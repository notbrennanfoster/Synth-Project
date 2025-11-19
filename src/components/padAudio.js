

let audioCtx = null;
const padBuffers = {};
let padsLoaded = false;

const PAD_FILES = {
  bd: "006_DT Kick.wav",
  sd: "009_DT Snare.wav",
  hh: "004_DT Hat Closed.wav",
};

async function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
}

// Load all pad samples into memory
export async function initPadAudio() {
  if (padsLoaded) return;
  await ensureAudioContext();

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
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      padBuffers[token] = audioBuffer;
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

  await ensureAudioContext();
  if (!padsLoaded) {
    await initPadAudio();
  }

  const buffer = padBuffers[token];
  if (!buffer) {
    console.warn("Pad buffer not loaded:", token);
    return;
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(audioCtx.destination);
  src.start();
}