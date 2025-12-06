
import "./LoopsBar.css";

export default function LoopsBar({ loops, onSaveLoop, onToggleLoopActive }) {
  return (
    <section className="loops-section">
      <h2 className="loops-title">Loops</h2>

      <div className="loops-grid">
        {loops.map((loop, index) => (
          <div
            key={loop.id ?? index}
            className={
              "loop-slot" + (loop.isActive ? " loop-slot-active" : "")
            }
          >
            <div className="loop-slot-header">
              <span>{loop.name}</span>
              <button
                className={
                  "loop-toggle " + (loop.isActive ? "loop-on" : "loop-off")
                }
                onClick={() => onToggleLoopActive(index)}
              >
                {loop.isActive ? "On" : "Off"}
              </button>
            </div>

            <div className="loop-slot-body">
              {loop.pattern && loop.pattern.length > 0
                ? loop.pattern.join(" ")
                : "Empty"}
            </div>

            <button
              className="loop-btn-save"
              onClick={() => onSaveLoop(index)}
            >
              Save current sequence
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}