/**
 * Arcana Sound Effects — Web Audio API synth
 * No external files needed. Generates whoosh, flip, shimmer sounds.
 */

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function setMuted(v: boolean) { muted = v; }
export function isMuted() { return muted; }

/** Whoosh — noise burst with bandpass sweep. Used for: shuffle, card fan entrance */
export function playWhoosh(opts?: { duration?: number; pitch?: number }) {
  if (muted) return;
  const ctx = getCtx();
  const dur = opts?.duration ?? 0.4;
  const baseFreq = opts?.pitch ?? 800;

  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(baseFreq * 3, ctx.currentTime + dur * 0.5);
  filter.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + dur);
  filter.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + dur);
}

/** Flip — short frequency sweep. Used for: card flip reveal */
export function playFlip() {
  if (muted) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/** Shimmer — high-frequency sparkle. Used for: gold glow burst on reveal */
export function playShimmer() {
  if (muted) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(4000, ctx.currentTime + 0.1);
  osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

/** Click — soft tap. Used for: card selection */
export function playClick() {
  if (muted) return;
  const ctx = getCtx();

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.06);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.06);
}

/** Reveal — ascending tone + shimmer. Used for: spread card reveal */
export function playReveal() {
  if (muted) return;
  const ctx = getCtx();

  // Base tone
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);

  // Shimmer overlay
  setTimeout(() => playShimmer(), 100);
}
