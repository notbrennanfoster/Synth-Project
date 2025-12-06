import "./PadGrid.css";
import Pad from "../Pad/Pad.jsx";

export default function PadGrid({ pads, onPadHit }) {
  return (
    <div className="pad-effects-section">
      <div className="pad-row">
        {pads.map((pad) => (
          <Pad
            key={pad.token}
            label={pad.label}
            token={pad.token}
            onPadHit={onPadHit}
          />
        ))}
      </div>
    </div>
  );
}