// src/components/PadGrid.jsx
import Pad from "./Pad.jsx";

export default function PadGrid({ pads, onPadHit }) {
  return (
    <div className="pad-row">
      {pads.map((pad) => (
        <Pad
          key={pad.token}
          label={pad.label}
          token={pad.token}
          onHit={onPadHit}
        />
      ))}
    </div>
  );
}

