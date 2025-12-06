// src/components/SynthPanel/SynthPanel.jsx
import "./SynthPanel.css";

export default function SynthPanel({ activeVoice, params, onChange }) {
  const handleChange = (name) => (e) => {
    const value = Number(e.target.value);
    onChange(activeVoice, name, value);
  };

  return (
    <div className="synth-panel">
      <h3 className="synth-title">
        Sound Designer — {activeVoice === "lead" ? "Lead" : "Bass"}
      </h3>

      <div className="synth-grid">
        <div className="synth-control">
          <label>Cutoff (Hz)</label>
          <input
            type="range"
            min="200"
            max="12000"
            step="50"
            value={params.cutoff}
            onChange={handleChange("cutoff")}
          />
          <span className="synth-value">{Math.round(params.cutoff)}</span>
        </div>

        <div className="synth-control">
          <label>Resonance (Q)</label>
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={params.resonance}
            onChange={handleChange("resonance")}
          />
          <span className="synth-value">{params.resonance.toFixed(1)}</span>
        </div>

        <div className="synth-control">
          <label>Attack (s)</label>
          <input
            type="range"
            min="0.001"
            max="1"
            step="0.001"
            value={params.attack}
            onChange={handleChange("attack")}
          />
          <span className="synth-value">{params.attack.toFixed(3)}</span>
        </div>

        <div className="synth-control">
          <label>Release (s)</label>
          <input
            type="range"
            min="0.05"
            max="3"
            step="0.01"
            value={params.release}
            onChange={handleChange("release")}
          />
          <span className="synth-value">{params.release.toFixed(2)}</span>
        </div>

        <div className="synth-control">
          <label>Gain</label>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={params.gain}
            onChange={handleChange("gain")}
          />
          <span className="synth-value">{params.gain.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}