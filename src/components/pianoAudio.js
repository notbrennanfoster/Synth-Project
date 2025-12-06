// src/components/pianoAudio.js

// Simple sample-based synth engine for lead & bass
// Uses one AudioContext + shared FX graph (volume / tone / "reverb")

let audioCtx = null;

const voices = {
  lead: {
    // must exist: public/samples/Lead/04_juno_chorus_mid.wav
    file: "04_juno_chorus_mid.wav",
    buffer: null,
    baseMidi: 60, // middle C
    params: {
      attack: 0.01,
      release: 0.4,
    },
  },
  bass: {
    // must exist: public/samples/Bass/000_bass1.wav
    file: "000_bass1.wav",
    buffer: null,
    baseMidi: 36, // C2
    params: {
      attack: 0.01,
      release: 0.6,
    },
  },
};

/* --------------------------------------------------
   Global FX graph (for synth)
-------------------------------------------------- */

let masterGain = null;
let toneFilter = null;
let reverbSend = null;
let reverbDelay = null;
let reverbFeedback = null;

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function ensureGraph(ctx) {
  if (masterGain) return;

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.8;

  toneFilter = ctx.createBiquadFilter();
  toneFilter.type = "lowpass";
  toneFilter.frequency.value = 9000;

  reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.25;

  reverbDelay = ctx.createDelay();
  reverbDelay.delayTime.value = 0.3;

  reverbFeedback = ctx.createGain();
  reverbFeedback.gain.value = 0.35;

  // main chain
  toneFilter.connect(masterGain);
  masterGain.connect(ctx.destination);

  // simple feedback "reverb"
  toneFilter.connect(reverbSend);
  reverbSend.connect(reverbDelay);
  reverbDelay.connect(reverbFeedback);
  reverbFeedback.connect(reverbDelay);
  reverbDelay.connect(masterGain);
}

/* --------------------------------------------------
   Audio Context Helpers
-------------------------------------------------- */

function getAudioContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    ensureGraph(audioCtx);
  }
  return audioCtx;
}

async function ensureResumedContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch (err) {
      console.warn("[pianoAudio] resume failed:", err);
    }
  }
  return ctx;
}

function decodeBuffer(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const result = ctx.decodeAudioData(
      arrayBuffer,
      resolve,
      reject
    );
    if (result && typeof result.then === "function") {
      result.then(resolve).catch(reject);
    }
  });
}

/* --------------------------------------------------
   Note helpers
-------------------------------------------------- */

const NOTE_TO_SEMITONE = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

// "C3" / "C#4" / "Db2" → MIDI number
function noteToMidi(note) {
  const match = note.match(/^([A-G](?:#|b)?)(\d)$/);
  if (!match) return 60; // fallback C4

  const [, name, octaveStr] = match;
  const semi = NOTE_TO_SEMITONE[name];
  const octave = parseInt(octaveStr, 10);
  if (semi == null || Number.isNaN(octave)) return 60;

  return 12 * (octave + 1) + semi;
}

/* --------------------------------------------------
   Sample loading
-------------------------------------------------- */

async function loadVoiceSample(voiceName) {
  const v = voices[voiceName];
  if (!v || !v.file) {
    console.warn("[pianoAudio] no file set for voice", voiceName);
    return;
  }

  const ctx = getAudioContext();
  ensureGraph(ctx);

  const folder = voiceName === "lead" ? "Lead" : "Bass";
  const url = `/samples/${folder}/${encodeURIComponent(v.file)}`;

  console.log(`[pianoAudio] loading sample for ${voiceName}: ${url}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[pianoAudio] sample not found: ${url}`);
      return;
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await decodeBuffer(ctx, arrayBuffer);
    v.buffer = buffer;
  } catch (err) {
    console.error(`[pianoAudio] failed to load ${url}`, err);
  }
}

/* --------------------------------------------------
   Public API
-------------------------------------------------- */

export async function initPianoAudio() {
  // just ensure context/graph exists; samples load lazily
  getAudioContext();
}

/**
 * Called by the UI when user switches presets.
 * `fileName` is something like "04_juno_chorus_mid.wav"
 */
export function setVoiceSample(voiceName, fileName) {
  if (!voices[voiceName]) return;
  voices[voiceName].file = fileName;
  voices[voiceName].buffer = null; // reload next time
}

/**
 * Initial synth params for both voices.
 * Shape matches what SynthPanel expects.
 */
export function getInitialSynthParams() {
  return {
    lead: {
      attack: voices.lead.params.attack,
      release: voices.lead.params.release,
    },
    bass: {
      attack: voices.bass.params.attack,
      release: voices.bass.params.release,
    },
  };
}

/**
 * Update per-voice params (attack/release now, extend later if needed).
 */
export function setSynthParams(voiceName, params) {
  const v = voices[voiceName];
  if (!v) return;

  v.params = {
    ...v.params,
    ...params,
  };
}

/**
 * Play a note for the given voice ("lead" | "bass").
 */
export async function playNote(note, voiceName = "lead") {
  const ctx = await ensureResumedContext();
  ensureGraph(ctx);

  const v = voices[voiceName] || voices.lead;

  // load sample if needed
  if (!v.buffer) {
    await loadVoiceSample(voiceName);
  }
  if (!v.buffer) {
    console.warn("[pianoAudio] no buffer for voice", voiceName);
    return;
  }

  const midi = noteToMidi(note);
  const baseMidi = v.baseMidi;
  const semitones = midi - baseMidi;
  const playbackRate = Math.pow(2, semitones / 12);

  const src = ctx.createBufferSource();
  src.buffer = v.buffer;
  src.playbackRate.value = playbackRate;

  // simple amp envelope
  const now = ctx.currentTime;
  const attack = v.params.attack ?? 0.01;
  const release = v.params.release ?? 0.4;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0, now);
  amp.gain.linearRampToValueAtTime(1.0, now + attack);
  amp.gain.setTargetAtTime(0.0, now + attack, release);

  src.connect(amp);
  amp.connect(toneFilter);

  src.start();

  const stopTime = now + attack + release * 4;
  src.stop(stopTime);
}

/* --------------------------------------------------
   Global FX setters (for App sliders)
-------------------------------------------------- */

export function setGlobalVolume(value) {
  const ctx = getAudioContext();
  ensureGraph(ctx);
  masterGain.gain.value = clamp01(value);
}

export function setGlobalReverbAmount(value) {
  const ctx = getAudioContext();
  ensureGraph(ctx);
  reverbSend.gain.value = clamp01(value) * 0.9;
}

export function setGlobalTone(value) {
  const ctx = getAudioContext();
  ensureGraph(ctx);
  // map 0..1 → 400Hz..10kHz
  const freq = 400 + clamp01(value) * 9600;
  toneFilter.frequency.value = freq;
}