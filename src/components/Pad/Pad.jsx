import { useState } from "react";
// import "./Pad.css";

export default function Pad({ label, token, onPadHit, onHit }) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    const handler = onPadHit || onHit;
    if (handler) {
      handler(token);
    }

    setIsActive(true);
    setTimeout(() => setIsActive(false), 120);
  };

  return (
    <button
      className={`pad ${isActive ? "pad-active" : ""}`}
      onClick={handleClick}
    >
      <span className="pad-label">{label}</span>
    </button>
  );
}