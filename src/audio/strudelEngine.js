// src/audio/strudelEngine.js
// This is your audio "brain". React calls these functions; this file talks to Strudel.

let started = false;
let isPlaying = false;

const engineState = {
  bpm: 120,
};

// --- 1. Helper: apply tempo to Strudel --------------------------------------

function applyTempo() {
  // Simple mapping: 1 cycle = 4 beats → cps = bpm / 240
  const cps = engineState.bpm / 240;
  if (typeof window.setcps === "function") {
    window.setcps(cps);
  }
}

// --- 2. Helper: init Strudel + load samples ONCE ----------------------------

async function ensureStarted() {
  if (started) return;

  if (typeof window.initStrudel !== "function") {
    console.error("Strudel web bundle not loaded. Check index.html <script> tag.");
    return;
  }

  // 1) Boot Strudel (scheduler, audio context, etc.)
  await window.initStrudel();

  // 2) Load the samples you want to use (Dirt-style set)
  //    These paths assume a Dirt-Samples layout under the base URL.
  //    If you host them yourself, change SAMPLE_BASE and filenames.
  const SAMPLE_BASE =
    "https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/";

  if (typeof window.samples === "function") {
    await window.samples(
      {
        bd: "bd/BT0AADA.wav",
        sd: "sd/rytm-01-classic.wav",
        hh: "hh27/000_hh27closedhh.wav",
        cp: "cp/classic-001.wav",
        // add more mappings here if you want more sounds
        // e.g. oh: "oh/whatever.wav"
      },
      SAMPLE_BASE
    );
  } else {
    console.warn(
      "Strudel 'samples' function not found; sample-based sounds will not work."
    );
  }

  // 3) Apply initial tempo
  applyTempo();

  started = true;
}

// --- 3. Build your main pattern using those sample names --------------------

function buildMainPattern() {
  if (typeof window.sound !== "function") {
    console.error("Strudel 'sound' function not available.");
    return null;
  }

  // Simple test groove using bd/sd/hh/cp
  // You can replace this with something more musical later.
  return window.sound("bd sd cp, hh*8");
}

// --- 4. Apply current pattern and start playback ----------------------------

function applyCurrentPattern() {
  // Stop any previous patterns
  if (typeof window.hush === "function") {
    window.hush();
  }

  const pat = buildMainPattern();
  if (pat && typeof pat.play === "function") {
    pat.play();
  } else {
    console.error("Failed to build pattern or .play() is missing.");
  }
}

// --- 5. Public API for React ------------------------------------------------

// Play button calls this
export async function startTransport() {
  if (isPlaying) return;

  await ensureStarted();
  applyCurrentPattern();
  isPlaying = true;
}

// Stop button calls this
export function stopTransport() {
  if (typeof window.hush === "function") {
    window.hush();
  }
  isPlaying = false;
}

// Optional: lets React mirror playing state
export function getIsPlaying() {
  return isPlaying;
}

// Called from a BPM slider
export function setBpm(newBpm) {
  const bpm = Number(newBpm);
  if (!Number.isFinite(bpm) || bpm <= 0) {
    console.warn("Ignoring invalid BPM:", newBpm);
    return;
  }
  engineState.bpm = bpm;
  applyTempo();
}