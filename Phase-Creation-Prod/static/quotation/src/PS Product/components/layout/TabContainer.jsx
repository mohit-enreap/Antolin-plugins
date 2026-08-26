import React from "react";

export default function Tabs({ active, setActive }) {
  const tabs = ["CAD", "CAE", "PS"];

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        borderBottom: "2px solid #ccc",
        marginBottom: 20,
        paddingBottom: 8,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          style={{
            padding: "8px 18px",
            border: "none",
            cursor: "pointer",
            background: active === tab ? "#0b74d1" : "#e6e6e6",
            color: active === tab ? "white" : "#333",
            borderRadius: 6,
            fontWeight: "bold",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
