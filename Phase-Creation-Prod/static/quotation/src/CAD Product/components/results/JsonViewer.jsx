import React from "react";

export default function JsonViewer({ data }) {
  return (
    <div
      style={{
        background: "#fafafa",
        border: "1px solid #ddd",
        padding: 8,
        borderRadius: 6,
      }}
    >
      <pre style={{ height: 220, overflow: "auto", margin: 0 }}>
        {data ? JSON.stringify(data, null, 2) : "No final JSON yet."}
      </pre>
    </div>
  );
}
