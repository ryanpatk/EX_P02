// Short JOYFUL_SYSTEMS confirmation blip (two quick soft sine ticks).
// Pages only — service workers have no AudioContext.
export function playBlip(): void {
  try {
    const ctx = new AudioContext();
    const tick = (freq: number, at: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.08);
    };
    tick(880, ctx.currentTime);
    tick(1320, ctx.currentTime + 0.06);
    setTimeout(() => void ctx.close(), 400);
  } catch {
    // sound is never load-bearing
  }
}
