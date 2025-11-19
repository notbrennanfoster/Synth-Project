import { useState } from "react";
import {
  startTransport,
  stopTransport,
  getIsPlaying,
  setBpm,
} from "./audio/strudelEngine";

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState(120);

  const handlePlayClick = async () => {
    if (!getIsPlaying()) {
      await startTransport();
      setIsPlaying(true);
    } else {
      stopTransport();
      setIsPlaying(false);
    }
  };

  const handleBpmChange = (e) => {
    const value = e.target.value;
    setBpmState(value);
    setBpm(value);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Strudel GUI Test</h1>
      <button onClick={handlePlayClick}>
        {isPlaying ? "Stop" : "Play"}
      </button>

      <div style={{ marginTop: "1rem" }}>
        <label>
          BPM:{" "}
          <input
            type="number"
            value={bpm}
            onChange={handleBpmChange}
            min="40"
            max="200"
          />
        </label>
      </div>
    </div>
  );
}

export default App;