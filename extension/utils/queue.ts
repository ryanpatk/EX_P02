// Captures that couldn't reach memex (offline, worker down, token rejected)
// wait here and retry on an alarm, so a background save is never silently lost.
import { browser } from 'wxt/browser';
import { postCapture } from './api';
import { getSettings, isConfigured } from './settings';
import type { CapturePayload } from './types';

export interface QueuedCapture {
  id: string;
  payload: CapturePayload;
  attempts: number;
  nextAt: number;
  lastError: string;
  queuedAt: number;
}

export interface FailedCapture {
  payload: CapturePayload;
  error: string;
  failedAt: number;
}

export const FLUSH_ALARM = 'memex-flush-queue';
const MAX_ATTEMPTS = 12;
const MAX_FAILED = 20;
const minutes = (n: number) => n * 60_000;

async function read(): Promise<{ queue: QueuedCapture[]; failed: FailedCapture[] }> {
  const { queue = [], failed = [] } = await browser.storage.local.get(['queue', 'failed']);
  return { queue: queue as QueuedCapture[], failed: failed as FailedCapture[] };
}

async function write(queue: QueuedCapture[], failed?: FailedCapture[]): Promise<void> {
  const update: { queue: QueuedCapture[]; failed?: FailedCapture[] } = { queue };
  if (failed) update.failed = failed;
  await browser.storage.local.set(update);
  await scheduleFlush(queue);
}

async function scheduleFlush(queue: QueuedCapture[]): Promise<void> {
  if (!queue.length) {
    await browser.alarms.clear(FLUSH_ALARM);
    return;
  }
  const next = Math.min(...queue.map((q) => q.nextAt));
  // Chrome clamps alarms to ≥30s; that's fine for a retry loop.
  await browser.alarms.create(FLUSH_ALARM, { when: Math.max(next, Date.now() + 30_000) });
}

export async function enqueue(payload: CapturePayload, error: string): Promise<void> {
  const { queue } = await read();
  if (queue.some((q) => q.payload.url === payload.url)) return;
  queue.push({
    id: crypto.randomUUID(),
    payload,
    attempts: 1,
    nextAt: Date.now() + minutes(1),
    lastError: error,
    queuedAt: Date.now(),
  });
  await write(queue);
}

export async function getQueueState() {
  return read();
}

export async function clearFailed(): Promise<void> {
  await browser.storage.local.set({ failed: [] });
}

let flushing: Promise<void> | null = null;

/** Retry due captures. `force` retries everything now (options “Retry now”). */
export function flushQueue(force = false): Promise<void> {
  flushing ??= doFlush(force).finally(() => {
    flushing = null;
  });
  return flushing;
}

async function doFlush(force: boolean): Promise<void> {
  const settings = await getSettings();
  const { queue, failed } = await read();
  if (!queue.length || !isConfigured(settings)) return;

  const now = Date.now();
  const remaining: QueuedCapture[] = [];
  for (const item of queue) {
    if (!force && item.nextAt > now) {
      remaining.push(item);
      continue;
    }
    const outcome = await postCapture(settings, item.payload);
    if (outcome.ok) continue;
    const attempts = item.attempts + 1;
    if (!outcome.retry || attempts > MAX_ATTEMPTS) {
      failed.unshift({ payload: item.payload, error: outcome.message, failedAt: now });
      continue;
    }
    // 1, 2, 4, 8… minutes, capped at an hour.
    remaining.push({
      ...item,
      attempts,
      lastError: outcome.message,
      nextAt: now + minutes(Math.min(2 ** (attempts - 1), 60)),
    });
  }
  await write(remaining, failed.slice(0, MAX_FAILED));
}
