import "./DrumKitSelector.css";

export default function DrumKitSelector({ padPreset, onPresetChange }) {
  return (
    <div className="drumkit-selector">
      <span className="drumkit-label">Drum Kit</span>
      <select
        className="drumkit-select"
        value={padPreset}
        onChange={(e) => onPresetChange(e.target.value)}
      >
        <option value="Default">Default</option>
        <option value="Acoustic">Acoustic</option>
        <option value="808s">808s</option>
      </select>
    </div>
  );
}