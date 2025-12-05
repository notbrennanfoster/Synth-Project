// src/components/TransportBar.jsx
import SequenceButton from "./SequenceButton.jsx";

export default function TransportBar({
  bpm,
  isPlaying,
  isRecording,
  onPlayClick,
  onBpmChange,
  onSequenceToggle,
}) {
  return (
    <div className="transport-bar">
      <div className="brand-block">
        <div className="brand-main">MPK-React</div>
        <div className="brand-sub">Mini Drum &amp; Synth</div>
      </div>

      <div className="transport-block">
        <button
          className={`transport-btn ${isPlaying ? "transport-btn-active" : ""}`}
          onClick={onPlayClick}
        >
          {isPlaying ? "Stop" : "Play"}
        </button>

        <div className="bpm-control">
          <span>BPM</span>
          <input
            type="number"
            min="40"
            max="200"
            value={bpm}
            onChange={(e) => onBpmChange(e.target.value)}
          />
        </div>

        <SequenceButton isRecording={isRecording} onToggle={onSequenceToggle} />
      </div>
    </div>
  );
}

