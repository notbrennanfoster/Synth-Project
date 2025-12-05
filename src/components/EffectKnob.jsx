// src/components/EffectKnob.jsx
export default function EffectKnob({ label, value, onChange }) {
  return (
    <div className="effect-knob">
      <span className="effect-knob-label">{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

