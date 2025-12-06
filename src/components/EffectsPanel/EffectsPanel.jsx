
import "./EffectsPanel.css";

export default function EffectsPanel({ effects, onEffectChange }) {
  const handleChange = (name) => (e) => {
    const value = parseFloat(e.target.value);
    onEffectChange(name, value);
  };

  return (
    <section className="effects-panel">
      {/* MASTER VOLUME */}
      <div className="effect-knob">
        <span className="effect-knob-label">Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effects.volume}
          onChange={handleChange("volume")}
        />
      </div>

      {/* GLOBAL REVERB */}
      <div className="effect-knob">
        <span className="effect-knob-label">Reverb</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effects.reverb}
          onChange={handleChange("reverb")}
        />
      </div>

      {/* TONE / BRIGHTNESS */}
      <div className="effect-knob">
        <span className="effect-knob-label">Tone</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={effects.tone}
          onChange={handleChange("tone")}
        />
      </div>
    </section>
  );
}