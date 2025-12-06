// src/components/SynthPanel/SynthPanel.jsx

export default function SynthPanel({ activeVoice, params, onChange }) {
  // Defensive defaults so the tab never crashes
  const safeParams = params || {};
  const attack = safeParams.attack ?? 0.01;
  const release = safeParams.release ?? 0.4;

  const handleSliderChange = (name) => (e) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    if (typeof onChange === "function") {
      onChange(activeVoice, name, value);
    }
  };

  return (
    <div className="synth-panel">
      <h2 className="loops-title">
        {activeVoice === "bass" ? "Bass Sound" : "Lead Sound"}
      </h2>

      <div className="effects-panel">
        {/* Attack */}
        <div className="effect-knob">
          <span className="effect-knob-label">Attack</span>
          <input
            type="range"
            min="0.001"
            max="0.5"
            step="0.001"
            value={attack}
            onChange={handleSliderChange("attack")}
          />
        </div>

        {/* Release */}
        <div className="effect-knob">
          <span className="effect-knob-label">Release</span>
          <input
            type="range"
            min="0.05"
            max="2.0"
            step="0.01"
            value={release}
            onChange={handleSliderChange("release")}
          />
        </div>
      </div>
    </div>
  );
}