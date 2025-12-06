// src/components/padAudio.js

let audioCtx = null;
const padBuffers = {};
let padsLoaded = false;

const PAD_FILES = {
  bd: "006_DT Kick.wav",
  sd: "009_DT Snare.wav",
  hh: "004_DT Hat Closed.wav",
};

// Create (but don't resume) the AudioContext
function getAudioContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  return audioCtx;
}

// Resume only when called from a user gesture (e.g. pad click)
async function ensureResumedContext() {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch (err) {
      console.warn("Failed to resume AudioContext", err);
    }
  }

  return ctx;
}

// Wrap decodeAudioData so it works in Safari + Chrome
function decodeBuffer(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    // Some browsers support promise-based, some only callback-based
    const result = ctx.decodeAudioData(
      arrayBuffer,
      (buffer) => resolve(buffer),
      (err) => reject(err)
    );

    // If decodeAudioData already returned a Promise (modern spec)
    if (result && typeof result.then === "function") {
      result.then(resolve).catch(reject);
    }
  });
}

// Load all pad samples into memory
export async function initPadAudio() {
  if (padsLoaded) return;

  const ctx = getAudioContext(); // DO NOT resume here

  const entries = Object.entries(PAD_FILES);

  await Promise.all(
    entries.map(async ([token, fileName]) => {
      const url = `/samples/${encodeURIComponent(fileName)}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("Failed to load pad sample:", token, url);
        return;
      }
      const arrayBuffer = await res.arrayBuffer();
      try {
        const audioBuffer = await decodeBuffer(ctx, arrayBuffer);
        padBuffers[token] = audioBuffer;
      } catch (err) {
        console.warn("Failed to decode pad sample:", token, err);
      }
    })
  );

  padsLoaded = true;
}

// Play a sound on click of a pad
export async function playPad(token) {
  if (!PAD_FILES[token]) {
    console.warn("Unknown pad token:", token);
    return;
  }

  // This is called from the button click → safe for Safari
  const ctx = await ensureResumedContext();

  if (!padsLoaded) {
    await initPadAudio();
  }

  const buffer = padBuffers[token];
  if (!buffer) {
    console.warn("Pad buffer not loaded:", token);
    return;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();
}