// src/components/padAudio.js

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
   Audio Context Helpers
-------------------------------------------------- */

function getAudioContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
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
  src.connect(ctx.destination);
  src.start();

  console.log(`[padAudio] Played: ${token} (${currentPadPreset})`);
}