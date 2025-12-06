
// Main audio engine for Strudel loops (drums)

let started = false;
let isPlaying = false;

const BASE_BPM = 120; // reference tempo for .fast()

// Holds parameters for the loops
const engineState = {
  bpm: 100,
  sequence: ["bd", "sd", "hh", "bd"], // default pattern until user records one
  drumPreset: "Default",
  volume: 1.0, // 0..1 master gain for the Strudel pattern
  reverb: 0.4, // 0..1 reverb / delay intensity
  tone: 0.5,   // 0..1 brightness
};

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

// Takes bpm input and converts to Strudel cps, then applies
function applyTempo() {
  const cps = engineState.bpm / 240; // convert to cycles per second
  if (typeof window.setcps === "function") {
    window.setcps(cps);
  }
}

// Load samples for current drum preset into Strudel
async function loadDrumSamples() {
  if (typeof window.samples !== "function") {
    console.warn(
      "[strudelEngine] 'samples' function not found; sample-based drums won't work."
    );
    return;
  }

  const preset = engineState.drumPreset || "Default";

  // Expecting:
  // public/samples/Drums/<Preset>/Kick.wav
  // public/samples/Drums/<Preset>/Snare.wav
  // public/samples/Drums/<Preset>/HatC.wav
  // public/samples/Drums/<Preset>/HatO.wav
  // public/samples/Drums/<Preset>/Crash.wav
  const SAMPLE_BASE = `/samples/Drums/${encodeURIComponent(preset)}/`;

  const mapping = {
    bd: "Kick.wav",
    sd: "Snare.wav",
    hh: "HatC.wav",
    hho: "HatO.wav",
    cp: "Crash.wav",
  };

  try {
    await window.samples(mapping, SAMPLE_BASE);
    console.log(
      `[strudelEngine] Loaded Strudel samples for preset '${preset}' from ${SAMPLE_BASE}`
    );
  } catch (err) {
    console.error("[strudelEngine] Failed to load Strudel samples:", err);
  }
}

// Check if Strudel has initialized; if not, do so
async function ensureStarted() {
  if (window.__strudelInited) {
    started = true;
  }

  if (!started) {
    if (typeof window.initStrudel !== "function") {
      console.error(
        "[strudelEngine] Strudel web bundle not loaded. Check index.html <script> tag."
      );
      return;
    }

    await window.initStrudel();
    window.__strudelInited = true;

    applyTempo();
    started = true;
  }

  // Load samples for the current drum preset
  if (!window.__strudelSamplesLoaded) {
    await loadDrumSamples();
    window.__strudelSamplesLoaded = true;
  }
}

// Build the main pattern from the current sequence, BPM, and FX
function buildMainPattern() {
  if (typeof window.sound !== "function") {
    console.error("[strudelEngine] 'sound' function not available.");
    return null;
  }

  const seq = engineState.sequence;

  // Fallback if nothing recorded yet
  const patString =
    !seq || seq.length === 0 ? "bd sd, hh*8" : seq.join(" ");

  let pat = window.sound(patString);

  // --------- GLOBAL FX MAPPING ----------

  // Volume
  if (typeof pat.gain === "function") {
    pat = pat.gain(engineState.volume);
  }

  // Tone → cutoff; map 0..1 → 400Hz..10kHz
  if (typeof pat.cutoff === "function") {
    const cutoff = 400 + engineState.tone * 9600;
    pat = pat.cutoff(cutoff);
  }

  // Reverb-ish: room / size
  if (typeof pat.room === "function") {
    pat = pat.room(engineState.reverb);
  }
  if (typeof pat.size === "function") {
    pat = pat.size(0.2 + engineState.reverb * 0.8);
  }

  // Delay tied to reverb amount (if available in this Strudel build)
  if (typeof pat.delay === "function") {
    const delayTime = engineState.reverb * 0.5; // 0..0.5 beats-ish
    pat = pat.delay(delayTime);
  }
  if (typeof pat.delayfb === "function") {
    pat = pat.delayfb(0.3 + engineState.reverb * 0.4); // 0.3..0.7
  }

  // --------- TEMPO SCALING ----------

  const factor = engineState.bpm / BASE_BPM; // 120 → 1, 60 → 0.5, 240 → 2
  if (Number.isFinite(factor) && factor > 0 && factor !== 1) {
    if (typeof pat.fast === "function") {
      pat = pat.fast(factor);
    } else {
      console.warn(
        "[strudelEngine] Pattern has no .fast() method; BPM won't affect speed."
      );
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

/* --------------------------------------------------
   PUBLIC FUNCTIONS FOR THE UI TO CALL
-------------------------------------------------- */

export async function startTransport() {
  if (isPlaying) return;

  await ensureStarted();
  applyCurrentPattern();
  isPlaying = true;
}

export function stopTransport() {
  if (window.hush) window.hush();
  isPlaying = false;
}

export function getIsPlaying() {
  return isPlaying;
}

export function setBpm(newBpm) {
  const bpm = Number(newBpm);
  if (!Number.isFinite(bpm) || bpm <= 0) {
    console.warn("[strudelEngine] Ignoring invalid BPM:", newBpm);
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

// Set the recorded sequence (accepts full tokens like "bd", "sd", "hh*2", etc.)
export function setSequence(seq) {
  if (!Array.isArray(seq) || seq.length === 0) return;

  engineState.sequence = [...seq];

  if (isPlaying) applyCurrentPattern();
}

// Optional: fire a one-shot drum via Strudel
export async function triggerPad(token) {
  const allowed = ["bd", "sd", "hh", "hho", "cp"];
  if (!allowed.includes(token)) return;

  await ensureStarted();

  let pat = window.sound(token);
  if (typeof pat.gain === "function") {
    pat = pat.gain(engineState.volume);
  }
  if (pat?.play) {
    pat.play();
  }
}

// Preload engine so the first play is instant
export async function warmUp() {
  if (window.__strudelWarm) return;

  await ensureStarted();

  try {
    const silent = window.sound("bd").gain(0);
    silent.play();
  } catch (e) {
    console.warn("[strudelEngine] Warmup silent play failed:", e);
  }

  window.__strudelWarm = true;
}

/* --------------------------------------------------
   DRUM PRESET + FX
-------------------------------------------------- */

export async function setDrumPreset(name) {
  if (!name || name === engineState.drumPreset) return;

  engineState.drumPreset = name;

  // Force reload of Strudel drum samples for new preset
  window.__strudelSamplesLoaded = false;
  if (started) {
    await ensureStarted();
    if (isPlaying) {
      applyCurrentPattern();
    }
  }
}

// Volume from global FX slider
export function setDrumVolume(value) {
  const v = clamp01(Number(value));
  engineState.volume = v;

  if (isPlaying) {
    applyCurrentPattern();
  }
}

// Reverb / delay intensity from global FX slider
export function setDrumReverbAmount(value) {
  const v = clamp01(Number(value));
  engineState.reverb = v;

  if (isPlaying) {
    applyCurrentPattern();
  }
}

// Tone / brightness from global FX slider
export function setDrumTone(value) {
  const v = clamp01(Number(value));
  engineState.tone = v;

  if (isPlaying) {
    applyCurrentPattern();
  }
}