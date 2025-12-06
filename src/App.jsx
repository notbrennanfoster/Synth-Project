// src/App.jsx
import { useState, useEffect, useRef } from "react";
import {
  startTransport,
  stopTransport,
  getIsPlaying,
  setBpm,
  setSequence,
  warmUp,
} from "./audio/strudelEngine";

import { playPad, initPadAudio, setPadPreset } from "./components/padAudio";
import DrumKitSelector from "./components/DrumKitSelector/DrumKitSelector.jsx";
import ControllerShell from "./components/ControllerShell/ControllerShell.jsx";
import TransportBar from "./components/TransportBar/TransportBar.jsx";
import InstrumentSelector from "./components/InstrumentSelector/InstrumentSelector.jsx";
import PadGrid from "./components/PadGrid/PadGrid.jsx";
import EffectsPanel from "./components/EffectsPanel/EffectsPanel.jsx";
import Keyboard from "./components/Keyboard/Keyboard.jsx";
import LoopsBar from "./components/LoopsBar/LoopsBar.jsx";
import "./App.css";

// Merge all active loops into one sequence.
// If no loops are active, fall back to the current sequence.
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

const PADS = [
  { label: "Kick", token: "bd" },
  { label: "Snare", token: "sd" },
  { label: "HatC", token: "hhc" },
  { label: "HatO", token: "hho" },
  { label: "Crash", token: "cr" },
];

export default function App() {
  const [bpm, setBpmState] = useState(100);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sequence, setSequenceState] = useState([]);

  const [loops, setLoops] = useState([
    { id: 0, name: "Loop 1", pattern: [], isActive: false },
    { id: 1, name: "Loop 2", pattern: [], isActive: false },
    { id: 2, name: "Loop 3", pattern: [], isActive: false },
    { id: 3, name: "Loop 4", pattern: [], isActive: false },
  ]);

  const [instrument, setInstrument] = useState("piano");

  const [effects, setEffects] = useState({
    cutoff: 0.7,
    resonance: 0.3,
    reverb: 0.4,
  });

  // current drum preset (matches folder name under /public/Drums)
  const [padPreset, setPadPresetState] = useState("Default");

  // timer for quantized loop changes
  const changeTimerRef = useRef(null);

  // one-time setup (strudel warmup, cleanup)
  useEffect(() => {
    warmUp();
    return () => {
      if (changeTimerRef.current) {
        clearTimeout(changeTimerRef.current);
      }
    };
  }, []);

  // reload drum samples whenever the preset changes
  useEffect(() => {
    setPadPreset(padPreset);
    initPadAudio();
  }, [padPreset]);

  // ---------- helpers ----------

  // Apply loop changes either immediately or at the next bar boundary.
  const updateSequenceForLoops = (updatedLoops, { quantize = true } = {}) => {
    if (!isPlayingState || !quantize) {
      const merged = buildMergedPattern(updatedLoops, sequence);
      setSequence(merged);
      return;
    }

    if (changeTimerRef.current) {
      clearTimeout(changeTimerRef.current);
    }

    const beatsPerBar = 4; // simple 4/4 assumption
    const barMs = (60000 / bpm) * beatsPerBar;

    const snapshot = updatedLoops.map((l) => ({
      ...l,
      pattern: [...l.pattern],
    }));

    changeTimerRef.current = setTimeout(() => {
      const merged = buildMergedPattern(snapshot, sequence);
      setSequence(merged);
      changeTimerRef.current = null;
    }, barMs);
  };

  // ---------- handlers ----------

  const handlePadHit = (token) => {
    playPad(token);

    if (isRecording) {
      setSequenceState((prev) => {
        const updated = [...prev, token];
        setSequence(updated);
        return updated;
      });
    }
  };

  const handlePlayClick = () => {
    if (getIsPlaying()) {
      stopTransport();
      setIsPlayingState(false);
    } else {
      const merged = buildMergedPattern(loops, sequence);
      if (merged.length > 0) {
        setSequence(merged);
      }
      startTransport();
      setIsPlayingState(true);
    }
  };

  const handleSequenceToggle = () => {
    setIsRecording((prev) => {
      const next = !prev;
      if (next) {
        setSequenceState([]);
        setSequence([]);
      }
      return next;
    });
  };

  // Accepts either a number or an event.target.value
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
  };

  const handleKeyPress = (note) => {
    console.log("Key pressed:", note, "instrument:", instrument);
    // TODO: trigger synth note based on instrument
  };

  const handleSaveLoop = (index) => {
    if (sequence.length === 0) return;

    setLoops((prev) => {
      const updated = prev.map((loop, i) =>
        i === index ? { ...loop, pattern: sequence } : loop
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
      updateSequenceForLoops(updated);
      return updated;
    });
  };

  const handleEffectChange = (name, value) => {
    setEffects((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleInstrumentChange = (value) => {
    setInstrument(value);
  };

  // ---------- UI ----------

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
        position: "relative",
      }}
    >
      {/* Drum preset selector */}
      <div style={{ position: "absolute", top: "1rem", left: "1rem" }}>
        <select
          value={padPreset}
          onChange={(e) => setPadPresetState(e.target.value)}
        >
          <option value="Default">Drums: Default</option>
          <option value="Acoustic">Drums: Acoustic</option>
          <option value="808s">Drums: 808s</option>
        </select>
      </div>

      <ControllerShell>
        {/* Top transport & recording controls */}
        <TransportBar
          isPlaying={isPlayingState}
          onPlayClick={handlePlayClick}
          bpm={bpm}
          onBpmChange={handleBpmChange}
          isRecording={isRecording}
          onRecordToggle={handleSequenceToggle}
        />

        {/* Instrument selector */}
        <div className="top-right-controls">
          <InstrumentSelector
            instrument={instrument}
            onInstrumentChange={handleInstrumentChange}
          />
          <DrumKitSelector
            padPreset={padPreset}
            onPresetChange={setPadPresetState}
          />
        </div>

        {/* Main control area */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr",
            gridTemplateRows: "auto auto",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          {/* Pad grid */}
          <PadGrid pads={PADS} onPadHit={handlePadHit} />

          {/* Keyboard */}
          <Keyboard
            instrument={instrument}
            onKeyPress={handleKeyPress}
            scale={2}
          />

          {/* Loops / patterns */}
          <LoopsBar
            loops={loops}
            onSaveLoop={handleSaveLoop}
            onToggleLoopActive={handleToggleLoopActive}
          />

          {/* Effects */}
          <EffectsPanel effects={effects} onEffectChange={handleEffectChange} />
        </div>

        {/* Debug / Feedback */}
        <p style={{ marginTop: "1.5rem", opacity: 0.75, fontSize: "0.9rem" }}>
          Sequence: {sequence.join(" ")}
        </p>
      </ControllerShell>
    </div>
  );
}
