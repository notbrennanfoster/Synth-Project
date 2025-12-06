import "./InstrumentSelector.css";

const OPTIONS = [
  { value: "piano", label: "Piano" },
  { value: "bass", label: "Bass" },
  { value: "lead", label: "Lead" },
  { value: "pad", label: "Pad" },
];

export default function InstrumentSelector({ instrument, onChange }) {
  return (
    <div className="instrument-selector">
      <span className="instrument-label">Instrument</span>
      <select
        value={instrument}
        onChange={(e) => onChange(e.target.value)}
        className="instrument-select"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
