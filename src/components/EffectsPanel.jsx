// src/components/EffectsPanel.jsx
import EffectKnob from "./EffectKnob.jsx";

export default function EffectsPanel({ effects, onEffectChange }) {
  return (
    <div className="effects-panel">
      <EffectKnob
        label="Cutoff"
        value={effects.cutoff}
        onChange={(v) => onEffectChange("cutoff", v)}
      />
      <EffectKnob
        label="Resonance"
        value={effects.resonance}
        onChange={(v) => onEffectChange("resonance", v)}
      />
      <EffectKnob
        label="Reverb"
        value={effects.reverb}
        onChange={(v) => onEffectChange("reverb", v)}
      />
    </div>
  );
}
