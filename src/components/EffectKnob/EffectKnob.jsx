

export default function EffectKnob({ label, name, value, onChange }) {
  return (
    <div className="effect-knob">
      <div className="effect-knob-label">{label}</div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </div>
  );
}