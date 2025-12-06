// src/components/SynthLoopsBar/SynthLoopsBar.jsx

// Reuse the same styles as the drum loops
import "../LoopsBar/LoopsBar.css";

export default function SynthLoopsBar({
  loops,
  activeIndex,
  onSaveLoop,
  onLoadLoop,
}) {
  return (
    <section className="loops-section">
      <h2 className="loops-title">Synth Loops</h2>
      <div className="loops-grid">
        {loops.map((loop, index) => (
          <div
            key={loop.id}
            className={
              "loop-slot" + (activeIndex === index ? " loop-slot-active" : "")
            }
          >
            <div className="loop-slot-header">
              <span>{loop.name}</span>
            </div>

            <div className="loop-slot-body">
              {loop.pattern && loop.pattern.length > 0
                ? `${loop.pattern.length} notes`
                : "Empty"}
            </div>

            <div
              style={{
                marginTop: "0.4rem",
                display: "flex",
                gap: "0.4rem",
              }}
            >
              <button
                type="button"
                className="loop-btn-save"
                onClick={() => onSaveLoop(index)}
              >
                Save current
              </button>
              <button
                type="button"
                className="loop-toggle loop-on"
                onClick={() => onLoadLoop(index)}
              >
                Load
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}