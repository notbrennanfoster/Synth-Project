export default function Pad({ label, token, onHit }) {
  const handleClick = () => {
    onHit(token);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        width: "120px",
        height: "120px",
        margin: "0.75rem",
        borderRadius: "0px",
        fontSize: "1.2rem",
        fontWeight: "600",
        cursor: "pointer",
        backgroundColor: "#7b6363ff", 
        border: "2px solid #5a4545ff",
        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
        transition: "transform 0.05s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {label}
    </button>
  );
}