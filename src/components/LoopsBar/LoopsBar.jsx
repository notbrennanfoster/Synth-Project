import "./LoopsBar.css";


export default function LoopsBar({ loops, onSaveLoop, onToggleActive }) {
  return (
    <div className="loops-section">
      <h2 className="loops-title">Loops</h2>
      <div className="loops-grid">
        {loops.map((loop, idx) => (
          <div
            key={loop.id}
            className={`loop-slot ${loop.isActive ? "loop-slot-active" : ""}`}
          >
            <div className="loop-slot-header">
              <span>{loop.name}</span>
              <button
                className={`loop-toggle ${loop.isActive ? "loop-on" : "loop-off"}`}
                onClick={() => onToggleActive(idx)}
              >
                {loop.isActive ? "Playing" : "Off"}
              </button>
            </div>

            <div className="loop-slot-body">
              {loop.pattern && loop.pattern.length
                ? loop.pattern.join(" ")
                : "Empty"}
            </div>

            <button
              className="loop-btn loop-btn-save"
              onClick={() => onSaveLoop(idx)}
            >
              Save current sequence
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

