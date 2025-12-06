import "./TransportBar.css";
import SequenceButton from "../SequenceButton/SequenceButton.jsx";

export default function TransportBar({
  isPlaying,
  onPlayClick,
  bpm,
  onBpmChange,
  isRecording,
  onRecordToggle,
}) {
  return (
    <div className="top-section">
      <div className="transport-bar">
        <div className="brand-block">
          <div className="brand-main">MPK-REACT</div>
          <div className="brand-sub">Mini Drum &amp; Synth</div>
        </div>

        <div className="transport-block">
          <button
            className={`transport-btn ${
              isPlaying ? "transport-btn-active" : ""
            }`}
            onClick={onPlayClick}
          >
            {isPlaying ? "Stop" : "Play"}
          </button>

          <div className="bpm-control">
            <span>BPM</span>
            <input
              type="number"
              value={bpm}
              min="40"
              max="200"
              onChange={(e) => onBpmChange(e.target.value)}
            />
          </div>

          <SequenceButton
            isRecording={isRecording}
            onToggle={onRecordToggle}
          />
        </div>
      </div>
    </div>
  );
}