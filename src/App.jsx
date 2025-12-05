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

import { playPad, initPadAudio } from "./components/padAudio";

import ControllerShell from "./components/ControllerShell.jsx";
import TransportBar from "./components/TransportBar.jsx";
import PadGrid from "./components/PadGrid.jsx";
import Keyboard from "./components/Keyboard.jsx";
import LoopsBar from "./components/LoopsBar.jsx";
import EffectsPanel from "./components/EffectsPanel.jsx";
import InstrumentSelector from "./components/InstrumentSelector.jsx";

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
  { label: "Hat", token: "hh" },
  { label: "Clap", token: "cp" },
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

  // timer for quantized loop changes
  const changeTimerRef = useRef(null);

  useEffect(() => {
    warmUp();
    initPadAudio();
    return () => {
      if (changeTimerRef.current) {
        clearTimeout(changeTimerRef.current);
      }
    };
  }, []);

  // ---------- helpers ----------

  // Apply loop changes either immediately or at the next bar boundary.
  const updateSequenceForLoops = (updatedLoops, { quantize = true } = {}) => {
    if (!isPlayingState || !quantize) {
      const merged = buildMergedPattern(updatedLoops, sequence);
      setSequence(merged);
      return;
    }

    // If we're playing, schedule an update for the next bar.
    if (changeTimerRef.current) {
      clearTimeout(changeTimerRef.current);
    }

    const beatsPerBar = 4; // simple 4/4 assumption
    const barMs = (60000 / bpm) * beatsPerBar;

    // Take a snapshot of the loops at this moment
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
      // when starting playback, apply loops immediately (start at bar 1)
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

  const handleBpmChange = (value) => {
    const numeric = Number(value);
    setBpmState(numeric);
    setBpm(numeric);
  };

  const handleKeyPress = (note) => {
    console.log("Key pressed:", note, "instrument:", instrument);
    // TODO: trigger synth note based on instrument
  };

  // loops

  const handleSaveLoop = (index) => {
    if (sequence.length === 0) return;

    setLoops((prev) => {
      const updated = prev.map((loop, i) =>
        i === index ? { ...loop, pattern: sequence } : loop
      );
      updateSequenceForLoops(updated); // quantized if playing
      return updated;
    });
  };

  const handleToggleLoopActive = (index) => {
    setLoops((prev) => {
      const updated = prev.map((loop, i) =>
        i === index ? { ...loop, isActive: !loop.isActive } : loop
      );
      updateSequenceForLoops(updated); // quantized if playing
      return updated;
    });
  };

  // effects + instrument

  const handleEffectChange = (name, value) => {
    setEffects((prev) => ({ ...prev, [name]: Number(value) }));
    // TODO: route to audio engine
  };

  const handleInstrumentChange = (value) => {
    setInstrument(value);
  };

  // ---------- UI ----------

  return (
    <div style={{ padding: "4rem", fontFamily: "Arial, sans-serif" , textAlign: "center" , lineHeight: "1.6" ,
     color: "whitesmoke" , layout: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1>Drum Machine</h1>

      {/* Play / Stop */}
      <button onClick={handlePlayClick}>
        {isPlayingState ? "Stop" : "Play"}
      </button>

      {/* BPM */}
      <label style={{ marginLeft: "1rem" }}>
        BPM:{" "}
        <input
          type="number"
          value={bpm}
          onChange={handleBpmChange}
          min="40"
          max="200"
        />
      </label>

      {/* Pads */}
      <div style={{ marginTop: "2rem" }}>
        <Pad label="Kick" token="bd" onHit={handlePadHit} />
        <Pad label="Snare" token="sd" onHit={handlePadHit} />
        <Pad label="Hat" token="hh" onHit={handlePadHit} />
      </div>

      {/* Sequence Button */}
      <div style={{ marginTop: "1rem" }}>
        <SequenceButton
          isRecording={isRecording}
          onToggle={handleSequenceToggle}
        />
      </div>

      {/* Debug / Feedback */}
      <p style={{ marginTop: "1rem" }}>
        Sequence: {sequence.join(" ")}
      </p>
    </div>
  );
}


