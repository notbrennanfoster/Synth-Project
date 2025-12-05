// src/components/ControllerShell.jsx
export default function ControllerShell({ children }) {
  return (
    <div className="controller-shell">
      <div className="controller-inner">{children}</div>
    </div>
  );
}
