
import "./OctaveControl.css";

export default function OctaveControl({ octaveOffset, onChange }) {
  const dec = () => {
    onChange(Math.max(0, octaveOffset - 1));  // min = 0
  };

  const inc = () => {
    onChange(Math.min(3, octaveOffset + 1));  // max = 3
  };

  const display =
    octaveOffset > 0 ? `+${octaveOffset}` : "0";

  return (
    <div className="octave-control">
      <span className="octave-label">Oct</span>
      <div className="octave-buttons">
        <button
          type="button"
          className="octave-btn"
          onClick={dec}
        >
          –
        </button>
        <span className="octave-value">{display}</span>
        <button
          type="button"
          className="octave-btn"
          onClick={inc}
        >
          +
        </button>
      </div>
    </div>
  );
}