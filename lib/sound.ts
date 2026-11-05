import type { Move } from "./cube";

/**
 * Tiny synthesised sound effects, no audio files. A turn is a short filtered
 * noise tick plus a low body whose pitch depends on the face; solving plays a
 * short ascending arpeggio. Everything is lazy and guarded, so it is a no-op
 * during SSR, in tests, or when Web Audio is blocked.
 */

const BASE_VOLUME = 0.14;
/** Turn pitch by physical face, tuned to a low, wooden range. */
const FACE_TONE: Record<string, number> = {
  U: 392,
  D: 294,
  L: 233,
  R: 311,
  F: 349,
  B: 262,
};

let context: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    if (!context) context = new Ctor();
    // Browsers start it suspended until a gesture; the first turn is one.
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

/** A short burst of white noise, built once per context and reused. */
function getNoise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.1);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

/** Play the click of one quarter turn. `gain` scales volume (0..1). */
export function playTurn(move: Move, gain = 1): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const volume = BASE_VOLUME * Math.max(0, Math.min(1, gain));
  // A little detune per turn keeps repeated moves from sounding identical.
  const tone = (FACE_TONE[move.face] ?? 280) * (1 + (Math.random() - 0.5) * 0.06);

  // Body: a short falling tone, the "thunk" of the layer landing.
  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  body.type = "triangle";
  body.frequency.setValueAtTime(tone, now);
  body.frequency.exponentialRampToValueAtTime(tone * 0.62, now + 0.13);
  bodyGain.gain.setValueAtTime(0.0001, now);
  bodyGain.gain.exponentialRampToValueAtTime(volume, now + 0.006);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
  body.connect(bodyGain).connect(ctx.destination);
  body.start(now);
  body.stop(now + 0.19);

  // Transient: a bandpassed noise click on top, the plastic snap.
  const noise = ctx.createBufferSource();
  noise.buffer = getNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1500 + tone;
  filter.Q.value = 0.9;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume * 1.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.08);
}

/** Play the little victory chime once the cube is solved. */
export function playSolved(): void {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, index) => {
    const start = now + index * 0.11;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(BASE_VOLUME * 0.9, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
}
