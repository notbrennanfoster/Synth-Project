// src/components/SequenceButton.jsx
export default function SequenceButton({ isRecording, onToggle }) {
  return (
    <button
      className={`sequence-btn ${isRecording ? "sequence-btn-recording" : ""}`}
      onClick={onToggle}
    >
      {isRecording ? "Stop Seq" : "Sequence"}
    </button>
  );
}
