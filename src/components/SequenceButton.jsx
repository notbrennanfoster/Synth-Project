export default function SequenceButton({ isRecording, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: "0.75rem 1.5rem",
        margin: "0.5rem",
        // borderRadius: "20px",
        border: "none",
        fontSize: "1rem",
        cursor: "pointer",
        backgroundColor: isRecording ? "Red" : "Green",
      }}
    >
      {isRecording ? "Stop Sequencing" : "Sequence"}
    </button>
  );
}