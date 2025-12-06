import "./NoteSpeedSelector.css";

const NOTE_SPEEDS = [
  { id: "1x", label: "Quarter notes" },
  { id: "2x", label: "Eighth notes" },
  { id: "4x", label: "Sixteenth notes" },
];

export default function NoteSpeedSelector({ value, onChange }) {
  return (
    <div className="note-speed">
      <span className="note-speed-label">Note speed</span>
      <select
        className="note-speed-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {NOTE_SPEEDS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
