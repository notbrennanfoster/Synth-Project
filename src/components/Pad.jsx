// src/components/Pad.jsx
export default function Pad({ label, token, onHit }) {
  const handleClick = () => {
    onHit(token);
  };

  return (
    <button
      className="pad"
      onClick={handleClick}
      onMouseDown={(e) => e.currentTarget.classList.add("pad-active")}
      onMouseUp={(e) => e.currentTarget.classList.remove("pad-active")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("pad-active")}
    >
      <span className="pad-label">{label}</span>
    </button>
  );
}
