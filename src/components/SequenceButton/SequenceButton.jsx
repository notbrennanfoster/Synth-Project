

export default function SequenceButton({ isRecording, onToggle }) {
  return (
    <button
      className={`sequence-btn ${
        isRecording ? "sequence-btn-recording" : ""
      }`}
      onClick={onToggle}
    >
      Sequence
    </button>
  );
}