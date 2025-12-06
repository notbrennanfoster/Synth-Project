

let audioCtx = null;
let padsLoaded = false;
let currentPadPreset = "Default"; // folder inside /public/samples/Drums/

const padBuffers = {};

// Drum file mappings for pad clicks.
// Tokens:
//   bd  -> Kick
//   sd  -> Snare
//   hh  -> Closed Hat
//   hho -> Open Hat
//   cp  -> Crash
const PAD_FILES = {
  bd: "Kick.wav",
  sd: "Snare.wav",
  hh: "HatC.wav",   // closed hat
  hho: "HatO.wav",  // open hat
  cp: "Crash.wav",  // crash
};

/* --------------------------------------------------
   Global FX Graph (volume / tone / simple reverb)
-------------------------------------------------- */

let masterGain = null;
let toneFilter = null;
let reverbSend = null;
let reverbDelay = null;
let reverbFeedback = null;

// current control values (0–1)
let padVolume = 0.8;
let padReverb = 0.4;
let padTone = 0.5;

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function ensureGraph(ctx) {
  if (masterGain) return;

  masterGain = ctx.createGain();
  masterGain.gain.value = padVolume;

  toneFilter = ctx.createBiquadFilter();
  toneFilter.type = "lowpass";
  toneFilter.frequency.value = 500 + padTone * 9500; // 500–10k Hz

  reverbSend = ctx.createGain();
  reverbSend.gain.value = padReverb * 0.9;

  reverbDelay = ctx.createDelay();
  reverbDelay.delayTime.value = 0.25;

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
      console.warn("AudioContext resume failed:", err);
    }
  }
  return ctx;
}

/* Safari-safe decode wrapper */
function decodeBuffer(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const result = ctx.decodeAudioData(arrayBuffer, resolve, reject);

    // if decodeAudioData returns a Promise (Chrome)
    if (result && typeof result.then === "function") {
      result.then(resolve).catch(reject);
    }
  });
}

/* --------------------------------------------------
   PRESET HANDLING
-------------------------------------------------- */

export function setPadPreset(name) {
  console.log("[padAudio] Switching preset →", name);

  currentPadPreset = name;
  padsLoaded = false;

  // clear previous buffers
  Object.keys(padBuffers).forEach((k) => delete padBuffers[k]);
}

/* --------------------------------------------------
   SAMPLE LOADING
-------------------------------------------------- */

export async function initPadAudio() {
  if (padsLoaded) return;

  const ctx = getAudioContext();
  ensureGraph(ctx);

  console.log("[padAudio] Loading samples for preset:", currentPadPreset);

  await Promise.all(
    Object.entries(PAD_FILES).map(async ([token, filename]) => {
      const url = `/samples/Drums/${encodeURIComponent(
        currentPadPreset
      )}/${encodeURIComponent(filename)}`;

      console.log(`[padAudio] Fetching: ${token} → ${url}`);

      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`[padAudio] FILE NOT FOUND: ${url}`);
          return;
        }

        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await decodeBuffer(ctx, arrayBuffer);

        padBuffers[token] = audioBuffer;
        console.log(`[padAudio] Loaded buffer for: ${token}`);
      } catch (err) {
        console.error(`[padAudio] Failed to decode ${filename}`, err);
      }
    })
  );

  padsLoaded = true;
}

/* --------------------------------------------------
   PLAY PAD SOUND
-------------------------------------------------- */

export async function playPad(token) {
  if (!PAD_FILES[token]) {
    console.warn("Unknown pad token:", token);
    return;
  }

  const ctx = await ensureResumedContext();
  ensureGraph(ctx);

  if (!padsLoaded) {
    console.log("[padAudio] Samples not loaded — loading now…");
    await initPadAudio();
  }

  const buffer = padBuffers[token];
  if (!buffer) {
    console.warn("No buffer loaded for:", token);
    return;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  // route through tone → master (which is already wired to reverb + destination)
  src.connect(toneFilter);
  src.start();

  console.log(`[padAudio] Played: ${token} (${currentPadPreset})`);
}

/* --------------------------------------------------
   GLOBAL EFFECT CONTROLS (used by App.jsx sliders)
-------------------------------------------------- */

export function setPadVolume(v) {
  const numeric = clamp01(Number(v));
  padVolume = numeric;

  const ctx = getAudioContext();
  ensureGraph(ctx);
  masterGain.gain.value = padVolume;
}

export function setPadReverbAmount(v) {
  const numeric = clamp01(Number(v));
  padReverb = numeric;

  const ctx = getAudioContext();
  ensureGraph(ctx);
  reverbSend.gain.value = padReverb * 0.9;
}

export function setPadTone(v) {
  const numeric = clamp01(Number(v));
  padTone = numeric;

  const ctx = getAudioContext();
  ensureGraph(ctx);
  toneFilter.frequency.value = 500 + padTone * 9500;
}
