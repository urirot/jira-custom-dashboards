import React from "react";

const loaderBackdropStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(30, 34, 44, 0.45)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const spinnerStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  border: "8px solid #e0e4ea",
  borderTop: "8px solid #1a6b8f",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const keyframes = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;

const Loader: React.FC = () => (
  <div style={loaderBackdropStyle}>
    <style>{keyframes}</style>
    <div style={spinnerStyle}></div>
  </div>
);

export default Loader;
