// components/JSONViewer.jsx
import React from "react";

function JSONViewer({ title, json }) {
  if (!json) return null;

  return (
    <div
      style={{
        background: "#fff",
        padding: "16px",
        borderRadius: "6px",
        marginBottom: "20px",
      }}
    >
      <h2>{title}</h2>
      <pre>{json}</pre>
    </div>
  );
}

export default JSONViewer;
