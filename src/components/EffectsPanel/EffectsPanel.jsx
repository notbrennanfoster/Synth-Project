import "./EffectsPanel.css";
import EffectKnob from "../EffectKnob/EffectKnob.jsx";

export default function EffectsPanel({ effects, onEffectChange }) {
  return (
    <div className="effects-panel">
      <EffectKnob
        label="Cutoff"
        name="cutoff"
        value={effects.cutoff}
        onChange={onEffectChange}
      />
      <EffectKnob
        label="Resonance"
        name="resonance"
        value={effects.resonance}
        onChange={onEffectChange}
      />
      <EffectKnob
        label="Reverb"
        name="reverb"
        value={effects.reverb}
        onChange={onEffectChange}
      />
    </div>
  );
}