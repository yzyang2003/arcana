// Procedural audio effects via Web Audio API
// No external audio files needed

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function getGain(): GainNode {
  getCtx();
  return masterGain!;
}

// 白噪声缓冲
function createNoiseBuffer(duration: number): AudioBuffer {
  const ctx = getCtx();
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// 翻牌音效
export function playCardFlip() {
  const ctx = getCtx();
  const gain = getGain();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
  oscGain.gain.setValueAtTime(0.15, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(oscGain).connect(gain);
  osc.start(now);
  osc.stop(now + 0.15);
}

// 洗牌音效
export function playShuffle() {
  const ctx = getCtx();
  const gain = getGain();
  const now = ctx.currentTime;

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(0.8);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.Q.setValueAtTime(0.5, now);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  noise.connect(filter).connect(noiseGain).connect(gain);
  noise.start(now);
  noise.stop(now + 0.8);
}

// 抽牌音效
export function playCardDraw() {
  const ctx = getCtx();
  const gain = getGain();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
  oscGain.gain.setValueAtTime(0.1, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(oscGain).connect(gain);
  osc.start(now);
  osc.stop(now + 0.12);
}

// 揭示音效（钟声）
export function playReveal() {
  const ctx = getCtx();
  const gain = getGain();
  const now = ctx.currentTime;

  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    oscGain.gain.setValueAtTime(0, now + i * 0.08);
    oscGain.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
    osc.connect(oscGain).connect(gain);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.6);
  });
}

// 环境音（低沉持续音）
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

export function startAmbient() {
  const ctx = getCtx();
  const gain = getGain();

  if (ambientOsc) return;

  ambientOsc = ctx.createOscillator();
  ambientGain = ctx.createGain();
  ambientOsc.type = 'sine';
  ambientOsc.frequency.setValueAtTime(110, ctx.currentTime);
  ambientGain.gain.setValueAtTime(0, ctx.currentTime);
  ambientGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2);
  ambientOsc.connect(ambientGain).connect(gain);
  ambientOsc.start();
}

export function stopAmbient() {
  if (ambientOsc) {
    ambientOsc.stop();
    ambientOsc = null;
    ambientGain = null;
  }
}

// 音量控制
export function setVolume(v: number) {
  const gain = getGain();
  gain.gain.setValueAtTime(v, getCtx().currentTime);
}

export function setMuted(muted: boolean) {
  const gain = getGain();
  gain.gain.setValueAtTime(muted ? 0 : 0.7, getCtx().currentTime);
}
