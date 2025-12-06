// src/audio/strudelEngine.js
// Main audio engine for all communications with Strudel

let started = false;
let isPlaying = false;

const BASE_BPM = 120; // reference tempo

// Holds parameters for the loops
const engineState = {
  bpm: 100,
  sequence: ["bd", "sd", "hh", "bd"], // default pattern until user records one
  drumPreset: "Default",              // current drum kit used for Strudel samples
};

// Convert BPM → cps and apply to Strudel
function applyTempo() {
  const cps = engineState.bpm / 240; // 120 BPM → cps = 0.5
  if (typeof window.setcps === "function") {
    window.setcps(cps);
  }
}

// Ensure Strudel is initialized and samples are loaded
async function ensureStarted() {
  if (window.__strudelInited) {
    started = true;
  }

  if (!started) {
    if (typeof window.initStrudel !== "function") {
      console.error(
        "Strudel web bundle not loaded. Check index.html <script> tag."
      );
      return;
    }

    await window.initStrudel();
    window.__strudelInited = true;

    applyTempo();
    started = true;
  }

  // Load samples from your folder: /samples/Drums/<drumPreset>/
  if (!window.__strudelSamplesLoaded) {
    const SAMPLE_BASE = `/samples/Drums/${engineState.drumPreset}/`;

    if (typeof window.samples === "function") {
      console.log(
        "[strudelEngine] Loading drum samples from",
        SAMPLE_BASE,
        "for preset",
        engineState.drumPreset
      );

      await window.samples(
        {
          bd:  "Kick.wav",   // Kick
          sd:  "Snare.wav",  // Snare
          hh:  "HatC.wav",   // Closed hat
          hho: "HatO.wav",   // Open hat  
          cp:  "Crash.wav",  // Crash
        },
        SAMPLE_BASE
      );

      window.__strudelSamplesLoaded = true;
      console.log("[strudelEngine] Samples loaded: bd, sd, hh, hho, cp");
    } else {
      console.warn(
        "Strudel 'samples' function not found; sample-based sounds won't work."
      );
    }
  }
}

// Build the main pattern from the current sequence and BPM
function buildMainPattern() {
  if (typeof window.sound !== "function") {
    console.error("Strudel 'sound' function not available.");
    return null;
  }

  const seq = engineState.sequence;

  // Fallback if nothing recorded/merged yet
  const patString =
    !seq || seq.length === 0 ? "bd sd, hh*8" : seq.join(" ");

  console.log("[strudelEngine] Pattern string:", patString);

  let pat = window.sound(patString);

  // Adjust speed based on BPM relative to BASE_BPM
  const factor = engineState.bpm / BASE_BPM;
  if (Number.isFinite(factor) && factor > 0 && factor !== 1) {
    if (typeof pat.fast === "function") {
      pat = pat.fast(factor);
    } else {
      console.warn("Pattern has no .fast() method; BPM won't affect speed.");
    }
  }

  return pat;
}

// Apply current pattern to Strudel (stop old, start new)
function applyCurrentPattern() {
  if (window.hush) window.hush();

  const pat = buildMainPattern();
  if (pat && typeof pat.play === "function") {
    pat.play();
  }
}

/* ===================== PUBLIC API ===================== */

// Start looping the current sequence
export async function startTransport() {
  if (isPlaying) return;

  await ensureStarted();
  applyCurrentPattern();
  isPlaying = true;
}

// Stop looping
export function stopTransport() {
  if (window.hush) window.hush();
  isPlaying = false;
}

// Check if Strudel transport is playing
export function getIsPlaying() {
  return isPlaying;
}

// Update BPM and reapply tempo/pattern if needed
export function setBpm(newBpm) {
  const bpm = Number(newBpm);
  if (!Number.isFinite(bpm) || bpm <= 0) {
    console.warn("Ignoring invalid BPM:", newBpm);
    return;
  }

  engineState.bpm = bpm;

  if (typeof window.setcps === "function") {
    const cps = engineState.bpm / 240;
    window.setcps(cps);
  }

  if (isPlaying) {
    applyCurrentPattern();
  }
}

// Set the recorded/merged sequence that Strudel will loop
// Allows tokens like "bd*2", "sd*4" etc. for note-speed density
export function setSequence(seq) {
  // Only allow tokens we have samples for, but permit Strudel modifiers like "*2", "*4"
  const cleaned = seq.filter((s) => {
    const base = String(s).split("*")[0]; // e.g. "bd*2" -> "bd"

    return (
      base === "bd" ||
      base === "sd" ||
      base === "hh" ||
      base === "hho" ||
      base === "cp"
    );
  });

  if (cleaned.length === 0) {
    // If nothing valid, don't overwrite the existing pattern
    console.log("[strudelEngine] Ignoring empty/invalid sequence", seq);
    return;
  }

  engineState.sequence = cleaned;
  console.log("[strudelEngine] Updated engine sequence:", cleaned);

  if (isPlaying) {
    applyCurrentPattern();
  }
}

// Change drum preset for loops (to match pad kit)
export async function setDrumPreset(preset) {
  console.log("[strudelEngine] setDrumPreset →", preset);
  engineState.drumPreset = preset;

  // Force sample reload next time ensureStarted runs
  window.__strudelSamplesLoaded = false;

  // If already playing, reload samples and re-apply pattern
  if (isPlaying) {
    await ensureStarted();
    applyCurrentPattern();
  }
}

// Fire a single drum hit via Strudel (not padAudio)
export async function triggerPad(token) {
  if (!["bd", "sd", "hh", "hho", "cp"].includes(token)) {
    console.warn("[strudelEngine] triggerPad: unsupported token", token);
    return;
  }

  await ensureStarted();

  const pat = window.sound(token);
  if (pat && typeof pat.play === "function") {
    pat.play();
  } else {
    console.warn("[strudelEngine] sound", token, "not found – is it loaded?");
  }
}

// Preload engine so the first action is instant
export async function warmUp() {
  if (window.__strudelWarm) return;

  await ensureStarted();

  try {
    const silent = window.sound("bd").gain(0); // gain(0) = silent
    silent.play();
  } catch (e) {
    console.warn("Warmup silent play failed:", e);
  }

  window.__strudelWarm = true;
}

