
import { useRef } from "react";
import "./Keyboard.css";

const WHITE_KEYS = [
  "C1", "D1", "E1", "F1", "G1", "A1", "B1",
  "C2", "D2", "E2", "F2", "G2", "A2", "B2",
];

const BLACK_KEYS = [
  { label: "C#1", position: 0 },
  { label: "D#1", position: 1 },
  { label: "F#1", position: 3 },
  { label: "G#1", position: 4 },
  { label: "A#1", position: 5 },
  { label: "C#2", position: 7 },
  { label: "D#2", position: 8 },
  { label: "F#2", position: 10 },
  { label: "G#2", position: 11 },
  { label: "A#2", position: 12 },
];

// helper: apply octave offset to note strings like "C3" / "C#2"
function applyOctave(note, offset) {
  if (!offset) return note;

  const match = note.match(/^(.+?)(\d)$/);
  if (!match) return note;

  const [, prefix, octaveStr] = match;
  const octaveNum = parseInt(octaveStr, 10);
  if (Number.isNaN(octaveNum)) return note;

  const newOctave = Math.min(8, Math.max(0, octaveNum + offset));
  return `${prefix}${newOctave}`;
}

export default function Keyboard({ onKeyPress, octaveOffset = 0 }) {
  // only one held key/timer for now
  const holdTimerRef = useRef(null);

  const startHeldNote = (baseNote) => {
    if (!onKeyPress) return;

    const note = applyOctave(baseNote, octaveOffset);

    // Play once immediately
    onKeyPress(note);

    // clear any old timer
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    // retrigger while held
    holdTimerRef.current = setInterval(() => {
      onKeyPress(note);
    }, 160); 
  };

  const stopHeldNote = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <div className="keyboard-wrapper">
      {/* White key row */}
      <div className="white-keys">
        {WHITE_KEYS.map((note) => (
          <button
            key={note}
            className="key key-white"
            type="button"
            onMouseDown={() => startHeldNote(note)}
            onMouseUp={stopHeldNote}
            onMouseLeave={stopHeldNote}
          >
            <span className="key-label">{note}</span>
          </button>
        ))}
      </div>

      {/* Black keys overlay */}
      <div className="black-keys">
        {BLACK_KEYS.map((key) => (
          <button
            key={key.label}
            className={`key key-black black-pos-${key.position}`}
            type="button"
            onMouseDown={() => startHeldNote(key.label)}
            onMouseUp={stopHeldNote}
            onMouseLeave={stopHeldNote}
          >
            <span className="key-label key-label-black">
              {key.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}