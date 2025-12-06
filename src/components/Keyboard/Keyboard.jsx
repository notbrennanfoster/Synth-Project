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

export default function Keyboard({ onKeyPress }) {
  return (
    <div className="keyboard-panel">
      <div className="keyboard-wrapper">
        {/* white keys */}
        <div className="white-keys">
          {WHITE_KEYS.map((note) => (
            <button
              key={note}
              className="key key-white"
              onClick={() => onKeyPress && onKeyPress(note)}
              aria-label={note}
            />
          ))}
        </div>

        {/* black keys */}
        <div className="black-keys">
          {BLACK_KEYS.map((key) => (
            <button
              key={key.label}
              className={`key key-black black-pos-${key.position}`}
              onClick={() => onKeyPress && onKeyPress(key.label)}
              aria-label={key.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}