import { useState, useEffect } from "react";
import {
  startTransport,
  stopTransport,
  getIsPlaying,
  setBpm,
  setSequence,
  
} from "./audio/strudelEngine";

import { playPad, initPadAudio } from "./components/padAudio";

import Pad from "./components/pad.jsx";
import SequenceButton from "./components/SequenceButton.jsx";
import { warmUp } from "./audio/strudelEngine";



export default function App() {
//on load functions
  useEffect(() => {
    warmUp();  
  }, []);

   useEffect(() => {
    initPadAudio(); 
  }, []);

  const [isRecording, setIsRecording] = useState(false);
  const [sequence, setSequenceState] = useState([]);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const [bpm, setBpmState] = useState(100);

  // Pad hit handler
  const handlePadHit = (token) => {
   playPad(token);

  // If recording, capture into the sequence
  if (isRecording) {
    setSequenceState((prev) => [...prev, token]);
  }
};

  // Sequence mode start/stop
  const handleSequenceToggle = () => {
    if (!isRecording) {
      setSequenceState([]);
      setIsRecording(true);
    } else {
      setIsRecording(false);
      setSequence(sequence);

      if (!getIsPlaying()) {
        startTransport();
        setIsPlayingState(true);
      }
    }
  };

  // Play/Stop
  const handlePlayClick = async () => {
    if (!getIsPlaying()) {
      await startTransport();
      setIsPlayingState(true);
    } else {
      stopTransport();
      setIsPlayingState(false);
    }
  };

  // Change BPM
  const handleBpmChange = (e) => {
    const value = Number(e.target.value);
    setBpmState(value);
    setBpm(value);
  };

  // UI
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