//Main audio Engine for All communications with Strudel

//Quick check constants for play state
let started = false;
let isPlaying = false;

const BASE_BPM = 120; // initial speed

//Holds parameters for the loops
const engineState = {
  bpm: 100,
  sequence: ["bd", "sd", "hh", "bd"], // default pattern until user records one
};

//Takes bpm input and converts to strudel logic then applies
function applyTempo() {
  const cps = engineState.bpm / 240; // Strudel thinks in "cycles per second" where 120bpm = 0.5cps
  if (typeof window.setcps === "function") {
    window.setcps(cps);
  }
}

// Check if Strudel has initialized; if not, do so
async function ensureStarted() {
  if (window.__strudelInited) {
    started = true;
  }

  if (!started) {
    if (typeof window.initStrudel !== "function") {
      console.error("Strudel web bundle not loaded. Check index.html <script> tag.");
      return;
    }

    await window.initStrudel();
    window.__strudelInited = true;

    applyTempo();
    started = true;
  }

  // Load samples locally
  if (!window.__strudelSamplesLoaded) {
    const SAMPLE_BASE = "/samples/";

    if (typeof window.samples === "function") {
      await window.samples(
        {
          bd: "006_DT Kick.wav",
          sd: "009_DT Snare.wav",
          hh: "004_DT Hat Closed.wav",
        },
        SAMPLE_BASE
      );

      window.__strudelSamplesLoaded = true;
    } else {
      console.warn("Strudel 'samples' function not found; sample-based sounds won't work.");
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

  // Fallback if nothing recorded yet
  const patString =
    !seq || seq.length === 0 ? "bd sd, hh*8" : seq.join(" ");

  let pat = window.sound(patString);

  // Change tempo to match BPM
  const factor = engineState.bpm / BASE_BPM; // 120 → 1, 60 → 0.5, 240 → 2
  if (Number.isFinite(factor) && factor > 0 && factor !== 1) {
    if (typeof pat.fast === "function") {
      pat = pat.fast(factor);
    } else {
      console.warn("Pattern has no .fast() method; BPM won’t affect speed.");
    }
  }

  return pat;
}

// Apply current pattern
function applyCurrentPattern() {
  if (window.hush) window.hush();

  const pat = buildMainPattern();
  if (pat && pat.play) {
    pat.play();
  }
}

// PUBLIC FUNCTIONS FOR THE UI TO CALL

// Start looping the sequence
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

// Allow UI to check play state
export function getIsPlaying() {
  return isPlaying;
}

// Update bpm
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

  // apply new speed to playing pattern
  if (isPlaying) {
    applyCurrentPattern();
  }
}


// Set the recorded sequence
export function setSequence(seq) {
  const cleaned = seq.filter((s) => s === "bd" || s === "sd" || s === "hh");
  if (cleaned.length === 0) return;

  engineState.sequence = cleaned;

  if (isPlaying) applyCurrentPattern();
}

// Play sound from pad
export async function triggerPad(token) {
  if (!["bd", "sd", "hh"].includes(token)) return;

  await ensureStarted();

  const pat = window.sound(token);
  if (pat?.play) {
    pat.play();
  }
}

// Preload engine so the first pad hit is instant. I don't think i need this anymore
export async function warmUp() {
  // Already warmed up?
  if (window.__strudelWarm) return;

  // Force Strudel init
  await ensureStarted();

  // Play a silent pattern to start the scheduler
  try {
    const silent = window.sound("bd").gain(0); // gain 0 = silent
    silent.play();
  } catch (e) {
    console.warn("Warmup silent play failed:", e);
  }

  window.__strudelWarm = true;
}