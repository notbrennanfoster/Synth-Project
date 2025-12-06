// src/App.jsx
import { useState, useEffect, useRef } from "react";
import {
  startTransport,
  stopTransport,
  getIsPlaying,
  setBpm,
  setSequence,
  warmUp,
  setDrumPreset,
  setDrumVolume,
  setDrumReverbAmount,
  setDrumTone,
} from "./audio/strudelEngine";

import {
  playPad,
  initPadAudio,
  setPadPreset,
  setPadVolume,
  setPadReverbAmount,
  setPadTone,
} from "./components/padAudio";

import {
  playNote,
  initPianoAudio,
  setSynthParams as updateVoiceSynthParams,
  getInitialSynthParams,
  setVoiceSample,
  setGlobalVolume as setSynthVolume,
  setGlobalReverbAmount as setSynthReverb,
  setGlobalTone as setSynthTone,
} from "./components/pianoAudio";

import ControllerShell from "./components/ControllerShell/ControllerShell.jsx";
import TransportBar from "./components/TransportBar/TransportBar.jsx";
import DrumKitSelector from "./components/DrumKitSelector/DrumKitSelector.jsx";
import PadGrid from "./components/PadGrid/PadGrid.jsx";
import EffectsPanel from "./components/EffectsPanel/EffectsPanel.jsx";
import Keyboard from "./components/Keyboard/Keyboard.jsx";
import LoopsBar from "./components/LoopsBar/LoopsBar.jsx";
import SynthPanel from "./components/SynthPanel/SynthPanel.jsx";
import SynthLoopsBar from "./components/SynthLoopsBar/SynthLoopsBar.jsx";
import OctaveControl from "./components/OctaveControl/OctaveControl.jsx";
import NoteSpeedSelector from "./components/NoteSpeedSelector/NoteSpeedSelector.jsx";

import "./App.css";

/* ---------------- DRUM PADS ---------------- */

const PADS = [
  { label: "Kick", token: "bd" },
  { label: "Snare", token: "sd" },
  { label: "HatC", token: "hh" },  // closed hat
  { label: "HatO", token: "hho" }, // open hat
  { label: "Crash", token: "cp" },
];

/* ------------- SYNTH PRESETS (LEAD / BASS) ------------- */

const LEAD_PRESETS = [
  {
    id: "lead_juno",
    voice: "lead",
    label: "Juno Chorus",
    file: "04_juno_chorus_mid.wav",
  },
  {
    id: "lead_mighty",
    voice: "lead",
    label: "Mighty Moog G4",
    file: "006_Mighty Moog G4.wav",
  },
  {
    id: "lead_009_10",
    voice: "lead",
    label: "Lead 009_10",
    file: "009_10.wav",
  },
  {
    id: "lead_b3pl",
    voice: "lead",
    label: "BS B3 Pl",
    file: "BS B3 Pl.wav",
  },
];

const BASS_PRESETS = [
  {
    id: "bass_000",
    voice: "bass",
    label: "Bass 1",
    file: "000_bass1.wav",
  },
  {
    id: "bass_fuku",
    voice: "bass",
    label: "Fukubass 2",
    file: "002_fukubass2.wav",
  },
  {
    id: "bass_808",
    voice: "bass",
    label: "Gliding 808 Sub",
    file: "004_gliding_808_sub.wav",
  },
];

const ALL_SYNTH_PRESETS = [...LEAD_PRESETS, ...BASS_PRESETS];

/* ------------- LOOP MERGE HELPER (DRUMS) ------------- */

function buildMergedPattern(loops, fallbackSequence) {
  const activePatterns = loops
    .filter((l) => l.isActive && l.pattern && l.pattern.length > 0)
    .map((l) => l.pattern);

  if (activePatterns.length === 0) {
    return fallbackSequence || [];
  }

  const maxLen = Math.max(...activePatterns.map((p) => p.length));
  const merged = [];

  for (let i = 0; i < maxLen; i++) {
    activePatterns.forEach((pattern) => {
      if (pattern[i]) merged.push(pattern[i]);
    });
  }

  return merged;
}

/* ==================== APP ==================== */

export default function App() {
  const [bpm, setBpmState] = useState(100);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // DRUM sequence used for loops + Strudel
  const [sequence, setSequenceState] = useState([]);

  const [loops, setLoops] = useState([
    {
      id: 0,
      name: "Loop 1",
      pattern: [],
      instrument: "piano",
      drumPreset: "Default",
      isActive: false,
    },
    {
      id: 1,
      name: "Loop 2",
      pattern: [],
      instrument: "piano",
      drumPreset: "Default",
      isActive: false,
    },
    {
      id: 2,
      name: "Loop 3",
      pattern: [],
      instrument: "piano",
      drumPreset: "Default",
      isActive: false,
    },
    {
      id: 3,
      name: "Loop 4",
      pattern: [],
      instrument: "piano",
      drumPreset: "Default",
      isActive: false,
    },
  ]);

  // Synth loops (for piano side)
  const [synthLoops, setSynthLoops] = useState([
    { id: 0, name: "Synth 1", pattern: [], isActive: false },
    { id: 1, name: "Synth 2", pattern: [], isActive: false },
    { id: 2, name: "Synth 3", pattern: [], isActive: false },
    { id: 3, name: "Synth 4", pattern: [], isActive: false },
  ]);
  const [activeSynthLoopIndex, setActiveSynthLoopIndex] = useState(null);

  const [instrument] = useState("piano"); // kept for loop metadata if needed

  // 🔊 Global FX strip (universal sliders)
  const [effects, setEffects] = useState({
    volume: 0.8, // master volume
    reverb: 0.4, // global reverb (and delay)
    tone: 0.5,   // brightness / color
  });

  // drum kit preset (folder under /public/samples/Drums)
  const [padPreset, setPadPresetState] = useState("Default");

  // note speed (quarter / eighth / sixteenth)
  const [noteSpeed, setNoteSpeed] = useState("1x");

  // PIANO / SYNTH STATE
  const [pianoSequence, setPianoSequence] = useState([]);
  const [pianoPattern, setPianoPattern] = useState([]); // 16 steps
  const [activeVoice, setActiveVoice] = useState("lead"); // "lead" | "bass"
  const [synthPresetId, setSynthPresetId] = useState("lead_juno");
  const [synthParams, setSynthParamsState] = useState(() =>
    getInitialSynthParams()
  );
  const [pianoTab, setPianoTab] = useState("keys"); // "keys" | "sound"

  // Octave offset for keyboard: 0..3, default 1
  const [octaveOffset, setOctaveOffset] = useState(1);

  // refs
  const changeTimerRef = useRef(null);        // drums: quantized loop switching
  const pianoLoopTimerRef = useRef(null);     // piano: playback loop
  const pianoSequenceRef = useRef([]);        // latest flat sequence
  const pianoPatternRef = useRef([]);         // latest 16-step pattern

  // recording timing for piano
  const pianoEventsRef = useRef([]);
  const pianoRecordStartRef = useRef(null);

  /* ---------- ONE-TIME SETUP ---------- */

  useEffect(() => {
    warmUp();         // strudel engine
    initPadAudio();   // drum samples
    initPianoAudio(); // synth

    return () => {
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
      if (pianoLoopTimerRef.current) clearInterval(pianoLoopTimerRef.current);
    };
  }, []);

  // keep refs in sync with state
  useEffect(() => {
    pianoSequenceRef.current = pianoSequence;
  }, [pianoSequence]);

  useEffect(() => {
    pianoPatternRef.current = pianoPattern;
  }, [pianoPattern]);

  // reload drum samples whenever the preset changes
  useEffect(() => {
    setPadPreset(padPreset);  // pad one-shots
    initPadAudio();
    setDrumPreset(padPreset); // Strudel engine
  }, [padPreset]);

  /* ---------- HELPERS: PIANO PATTERN BUILDERS ---------- */

  const buildPianoPatternFromEvents = (eventsInput) => {
    const events = eventsInput && eventsInput.length
      ? eventsInput
      : pianoEventsRef.current;

    if (!events.length) {
      setPianoPattern([]);
      setPianoSequence([]);
      return;
    }

    const sorted = [...events].sort((a, b) => a.beatOffset - b.beatOffset);
    const minBeat = sorted[0].beatOffset;
    const normalized = sorted.map((e) => ({
      ...e,
      beatOffset: e.beatOffset - minBeat,
    }));

    const lastBeat = normalized[normalized.length - 1].beatOffset;
    const spanBeats = Math.max(lastBeat, 0.25);

    const scale = 4 / spanBeats; // map to 1 bar
    const scaled = normalized.map((e) => ({
      ...e,
      beatOffset: e.beatOffset * scale,
    }));

    const steps = Array.from({ length: 16 }, () => []);

    scaled.forEach((e) => {
      const stepFloat = e.beatOffset * 4; // 4 steps per beat
      let stepIndex = Math.round(stepFloat);
      if (stepIndex < 0) stepIndex = 0;
      if (stepIndex > 15) stepIndex = 15;

      steps[stepIndex].push(`${e.voice}:${e.note}`);
    });

    setPianoPattern(steps);
    pianoPatternRef.current = steps;

    const flatSeq = scaled.map((e) => `${e.voice}:${e.note}`);
    setPianoSequence(flatSeq);
    pianoSequenceRef.current = flatSeq;
  };

  const buildPianoPatternFromSequenceEven = (seq) => {
    if (!seq || seq.length === 0) {
      setPianoPattern([]);
      pianoPatternRef.current = [];
      return;
    }
    const steps = Array.from({ length: 16 }, () => []);
    const N = seq.length;
    for (let i = 0; i < N; i++) {
      const step = Math.round((i / N) * 15);
      steps[step].push(seq[i]);
    }
    setPianoPattern(steps);
    pianoPatternRef.current = steps;
  };

  /* ---------- HELPERS: PIANO LOOP ---------- */

  const stopPianoLoop = () => {
    if (pianoLoopTimerRef.current) {
      clearInterval(pianoLoopTimerRef.current);
      pianoLoopTimerRef.current = null;
    }
  };

  const startPianoLoop = () => {
    if (pianoLoopTimerRef.current) return;
    const pattern = pianoPatternRef.current;
    if (!pattern || pattern.length === 0) return;

    const stepMs = ((60000 / bpm) * 4) / 16; // 16ths

    let stepIndex = 0;

    pianoLoopTimerRef.current = setInterval(() => {
      const pat = pianoPatternRef.current;
      if (!pat || pat.length === 0) return;

      const notesHere = pat[stepIndex] || [];
      for (const entry of notesHere) {
        const [voice, note] = entry.split(":");
        if (note) {
          playNote(note, voice || activeVoice);
        }
      }

      stepIndex = (stepIndex + 1) % pat.length;
    }, stepMs);
  };

  /* ---------- HELPERS: DRUM SIDE ---------- */

  const applySequenceToEngine = (newSeq) => {
    setSequenceState(newSeq);
    setSequence(newSeq);
  };

  const updateSequenceForLoops = (updatedLoops, { quantize = true } = {}) => {
    if (!isPlayingState || !quantize) {
      const merged = buildMergedPattern(updatedLoops, sequence);
      applySequenceToEngine(merged);
      return;
    }

    if (changeTimerRef.current) clearTimeout(changeTimerRef.current);

    const beatsPerBar = 4;
    const barMs = (60000 / bpm) * beatsPerBar;

    const snapshotLoops = updatedLoops.map((l) => ({
      ...l,
      pattern: [...l.pattern],
    }));
    const currentSeqSnapshot = [...sequence];

    changeTimerRef.current = setTimeout(() => {
      const merged = buildMergedPattern(snapshotLoops, currentSeqSnapshot);
      applySequenceToEngine(merged);
      changeTimerRef.current = null;
    }, barMs);
  };

  const applySpeedToToken = (token) => {
    switch (noteSpeed) {
      case "2x":
        return `${token}*2`;
      case "4x":
        return `${token}*4`;
      case "1x":
      default:
        return token;
    }
  };

  /* ---------- HANDLERS: DRUMS ---------- */

  const handlePadHit = (token) => {
    playPad(token);

    if (isRecording) {
      const tokenForSeq = applySpeedToToken(token);

      setSequenceState((prev) => {
        const updated = [...prev, tokenForSeq];
        setSequence(updated);
        return updated;
      });
    }
  };

  const handlePlayClick = () => {
    if (getIsPlaying()) {
      stopTransport();
      setIsPlayingState(false);
      stopPianoLoop();
    } else {
      const merged = buildMergedPattern(loops, sequence);
      const seqForEngine = merged.length > 0 ? merged : sequence;
      applySequenceToEngine(seqForEngine);

      startTransport();
      setIsPlayingState(true);
      startPianoLoop();
    }
  };

  const handleSequenceToggle = () => {
    setIsRecording((prev) => {
      const next = !prev;

      if (next) {
        pianoRecordStartRef.current = performance.now();
        pianoEventsRef.current = [];

        applySequenceToEngine([]);
        setPianoSequence([]);
        setPianoPattern([]);
      } else {
        buildPianoPatternFromEvents();
        pianoRecordStartRef.current = null;
      }

      return next;
    });
  };

  const handleBpmChange = (valueOrEvent) => {
    const value =
      typeof valueOrEvent === "number"
        ? valueOrEvent
        : valueOrEvent?.target
        ? valueOrEvent.target.value
        : valueOrEvent;

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;

    setBpmState(numeric);
    setBpm(numeric);

    if (isPlayingState) {
      stopPianoLoop();
      startPianoLoop();
    }
  };

  const handleSaveLoop = (index) => {
    if (sequence.length === 0) return;

    setLoops((prev) => {
      const updated = prev.map((loop, i) =>
        i === index
          ? {
              ...loop,
              pattern: sequence,
              instrument,
              drumPreset: padPreset,
            }
          : loop
      );
      updateSequenceForLoops(updated);
      return updated;
    });
  };

  const handleToggleLoopActive = (index) => {
    setLoops((prev) => {
      const updated = prev.map((loop, i) =>
        i === index ? { ...loop, isActive: !loop.isActive } : loop
      );

      const toggled = updated[index];

      if (toggled.isActive && toggled.drumPreset) {
        setPadPresetState(toggled.drumPreset);
        setDrumPreset(toggled.drumPreset);
      }

      updateSequenceForLoops(updated);
      return updated;
    });
  };

  /* ---------- HANDLERS: SYNTH / PIANO ---------- */

  const handleKeyPress = (note) => {
    playNote(note, activeVoice);

    if (isRecording && pianoRecordStartRef.current != null) {
      const now = performance.now();
      const dtMs = now - pianoRecordStartRef.current;
      const dtSec = dtMs / 1000;
      const beatOffset = dtSec * (bpm / 60);

      pianoEventsRef.current.push({
        voice: activeVoice,
        note,
        beatOffset,
      });
    }
  };

  const handleSynthParamChange = (voice, name, value) => {
    setSynthParamsState((prev) => {
      const updatedVoiceParams = {
        ...prev[voice],
        [name]: value,
      };
      const updatedAll = {
        ...prev,
        [voice]: updatedVoiceParams,
      };

      updateVoiceSynthParams(voice, updatedVoiceParams);
      return updatedAll;
    });
  };

  const handleSynthPresetChange = (e) => {
    const id = e.target.value;
    setSynthPresetId(id);

    const preset = ALL_SYNTH_PRESETS.find((p) => p.id === id);
    if (!preset) return;

    setActiveVoice(preset.voice);
    setVoiceSample(preset.voice, preset.file);
  };

  const handleEffectChange = (name, value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;

    setEffects((prev) => ({ ...prev, [name]: numeric }));

    switch (name) {
      case "volume":
        setPadVolume(numeric);
        setSynthVolume(numeric);
        setDrumVolume(numeric);
        break;
      case "reverb":
        setPadReverbAmount(numeric);
        setSynthReverb(numeric);
        setDrumReverbAmount(numeric);
        break;
      case "tone":
        setPadTone(numeric);
        setSynthTone(numeric);
        setDrumTone(numeric);
        break;
      default:
        break;
    }
  };

  /* ---------- HANDLERS: SYNTH LOOPS ---------- */

  const handleSaveSynthLoop = (index) => {
    if (pianoSequence.length === 0) return;

    setSynthLoops((prev) =>
      prev.map((loop, i) =>
        i === index ? { ...loop, pattern: pianoSequence } : loop
      )
    );
    setActiveSynthLoopIndex(index);
  };

  const handleLoadSynthLoop = (index) => {
    const patternSeq = synthLoops[index]?.pattern || [];
    pianoSequenceRef.current = patternSeq;
    setPianoSequence(patternSeq);
    buildPianoPatternFromSequenceEven(patternSeq);
    setActiveSynthLoopIndex(index);
  };

  /* ------------------- RENDER ------------------- */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "whitesmoke",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <ControllerShell>
        {/* Top bar: transport left, drum kit right */}
        <div className="top-section">
          <TransportBar
            isPlaying={isPlayingState}
            onPlayClick={handlePlayClick}
            bpm={bpm}
            onBpmChange={handleBpmChange}
            isRecording={isRecording}
            onRecordToggle={handleSequenceToggle}
          />

          <div className="top-right-selectors">
            <DrumKitSelector
              padPreset={padPreset}
              onPresetChange={setPadPresetState}
            />
          </div>
        </div>

        {/* Divider under top bar */}
        <div className="top-divider" />

        {/* Middle controls: note speed (left) + global FX (center) */}
        <div className="middle-controls">
          <div className="note-speed-wrap">
            <NoteSpeedSelector value={noteSpeed} onChange={setNoteSpeed} />
          </div>
          <div className="effects-wrap">
            <EffectsPanel effects={effects} onEffectChange={handleEffectChange} />
          </div>
          <div className="middle-spacer" />
        </div>

        {/* Main control area: pads + piano */}
        <div
          className="main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          {/* Pads (left) */}
          <PadGrid pads={PADS} onPadHit={handlePadHit} />

          {/* Piano / Synth (right) */}
          <div>
            {/* Lead/Bass grouped dropdown */}
            <div className="synth-preset-row">
              <label className="synth-preset-label">Voice</label>
              <select
                className="synth-preset-select"
                value={synthPresetId}
                onChange={handleSynthPresetChange}
              >
                <optgroup label="Lead">
                  {LEAD_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Bass">
                  {BASS_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Piano / Sound tabs */}
            <div className="piano-tabs">
              <button
                className={
                  "piano-tab-btn" +
                  (pianoTab === "keys" ? " piano-tab-active" : "")
                }
                onClick={() => setPianoTab("keys")}
              >
                Piano
              </button>
              <button
                className={
                  "piano-tab-btn" +
                  (pianoTab === "sound" ? " piano-tab-active" : "")
                }
                onClick={() => setPianoTab("sound")}
              >
                Sound
              </button>
            </div>

            {pianoTab === "keys" ? (
              <div className="keyboard-panel">
                <div className="piano-keys-row">
                  <OctaveControl
                    octaveOffset={octaveOffset}
                    onChange={setOctaveOffset}
                  />
                  <Keyboard
                    onKeyPress={handleKeyPress}
                    octaveOffset={octaveOffset}
                  />
                </div>
              </div>
            ) : (
              <SynthPanel
                activeVoice={activeVoice}
                params={synthParams[activeVoice]}
                onChange={handleSynthParamChange}
              />
            )}
          </div>
        </div>

        {/* Bottom: loops row spanning full width */}
        <div className="bottom-loops-row">
          <div className="loops-column">
            <LoopsBar
              loops={loops}
              onSaveLoop={handleSaveLoop}
              onToggleLoopActive={handleToggleLoopActive}
            />
          </div>
          <div className="loops-column">
            <SynthLoopsBar
              loops={synthLoops}
              activeIndex={activeSynthLoopIndex}
              onSaveLoop={handleSaveSynthLoop}
              onLoadLoop={handleLoadSynthLoop}
            />
          </div>
        </div>

        {/* Debug readouts */}
        <p
          style={{
            marginTop: "1.5rem",
            opacity: 0.75,
            fontSize: "0.9rem",
          }}
        >
          Drum Sequence: {sequence.join(" ")}
          <br />
          Piano Sequence: {pianoSequence.join(" ")}
        </p>
      </ControllerShell>
    </div>
  );
}