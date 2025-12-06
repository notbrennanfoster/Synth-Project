

import "./SynthLoopsBar.css"; 

export default function SynthLoopsBar({
  loops,
  activeIndex,
  onSaveLoop,
  onLoadLoop,
  onToggleLoopActive,
}) {
  return (
    <section className="loops-section">
      <h2 className="loops-title">Synth Loops</h2>
      <div className="loops-grid">
        {loops.map((loop, index) => {
          const isActive = loop.isActive;
          const hasPattern = loop.pattern && loop.pattern.length > 0;

          return (
            <div
              key={loop.id}
              className={
                "loop-slot" +
                (isActive ? " loop-slot-active" : "") +
                (activeIndex === index ? " loop-slot-current" : "")
              }
            >
              <div className="loop-slot-header">
                <span>{loop.name}</span>
                <button
                  className={
                    "loop-toggle " + (isActive ? "loop-on" : "loop-off")
                  }
                  onClick={() => onToggleLoopActive(index)}
                >
                  {isActive ? "On" : "Off"}
                </button>
              </div>

              <div className="loop-slot-body">
                {hasPattern ? "Pattern saved" : "Empty"}
              </div>

              <div style={{ marginTop: "0.35rem", display: "flex", gap: 8 }}>
                <button
                  className="loop-btn-save"
                  onClick={() => onSaveLoop(index)}
                >
                  Save current pattern
                </button>
                <button
                  className="loop-toggle"
                  onClick={() => onLoadLoop(index)}
                  disabled={!hasPattern}
                >
                  Load
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}