import { play, setEnabled, type SoundName } from 'cuelume'

/**
 * memex's sound vocabulary, per JOYFUL_SYSTEMS: sounds map to *mechanics*,
 * not events — one family each for confirm, dismiss, error, and movement,
 * plus a toggle click for switches. Components call `cue('confirm')` and
 * never a raw sound name, so the palette can be retuned in one place.
 *
 * Hover ticks stay declarative via `data-cuelume-hover` and go through the
 * same enable switch.
 */
export type SoundCue = 'confirm' | 'dismiss' | 'error' | 'move' | 'toggle'

const CUE_SOUNDS: Record<SoundCue, SoundName> = {
  /** Something was captured or sent: link/note/task capture, note to self. */
  confirm: 'sparkle',
  /** Something went away: delete, close a panel. */
  dismiss: 'droplet',
  /** A save or capture failed (the UI also restores the input). */
  error: 'error',
  /** Items moved somewhere: added to a space, tag applied to a selection. */
  move: 'page',
  /** A binary switch flipped: task done/undone. */
  toggle: 'toggle',
}

const STORAGE_KEY = 'memex.sound'

let enabled = true
const listeners = new Set<() => void>()

const readStored = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/** Apply the persisted preference. Call once at startup, before `bind()`. */
export const initSound = () => {
  enabled = readStored()
  setEnabled(enabled)
}

export const isSoundEnabled = () => enabled

export const setSoundEnabled = (next: boolean) => {
  enabled = next
  setEnabled(next)
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
  } catch {
    /* storage unavailable — preference lasts for the session */
  }
  listeners.forEach((listener) => listener())
}

/** Subscribe to preference changes (for useSyncExternalStore). */
export const subscribeSound = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Play the sound for a mechanic. No-op while muted or when audio is blocked. */
export const cue = (mechanic: SoundCue) => {
  if (!enabled) return
  play(CUE_SOUNDS[mechanic])
}
