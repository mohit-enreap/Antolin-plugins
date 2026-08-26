import React from "react";
import { GlOBAL_VARIBALE_PARAM_RULES } from "./PARAM_RULES";

const FIRST_DATA_KEYS = [
  "product",
  "Customer",
  "Type Of Development",
  "ProjectName",
];

// Dictionary mapping for UI display
const KEY_DISPLAY_NAMES = {
  product: "Product",
  ProjectName: "Project Name",
};

export default function GlobalParams({ globalParams = {}, onChange }) {
  const renderRow = (key) => {
    const rule = GlOBAL_VARIBALE_PARAM_RULES[key] ?? {};
    const type = rule.type ?? "select";
    const options = rule.options ?? ["YES", "NO"];

    const isReadOnly = FIRST_DATA_KEYS.includes(key);
    const displayLabel = rule.label || KEY_DISPLAY_NAMES[key] || key;

    return (
      <tr key={key}>
        <td
          style={{
            textAlign: "left",
            paddingLeft: 12,
            fontWeight: "600",
            fontSize: "1.05em",
            color: "#333",
            width: "50%", // Forces a 50/50 split for this 2-column table
          }}
        >
          {displayLabel}
        </td>

        <td style={{ textAlign: "left", width: "50%" }}>
          {isReadOnly ? (
            <span style={{ color: "#555" }}>{globalParams[key] ?? ""}</span>
          ) : type === "text" ? (
            <input
              type="text"
              value={globalParams[key] ?? ""}
              placeholder={rule.placeholder ?? "Enter value"}
              onChange={(e) => onChange(key, e.target.value)}
              style={{ maxWidth: "300px", margin: 0 }} // Restricts input width natively
            />
          ) : (
            <select
              value={globalParams[key] ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
              style={{ maxWidth: "300px", margin: 0 }} // Restricts select width natively
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </td>
      </tr>
    );
  };

  // Split keys
  const firstDataKeys = FIRST_DATA_KEYS.filter((k) => k in globalParams);
  const activityKeys = Object.keys(globalParams).filter(
    (k) => !FIRST_DATA_KEYS.includes(k)
  );

  return (
    <section className="section">
      {/* ================= First Data Table ================= */}
      <h2 style={{ marginBottom: 15 }}>Details</h2>
      <div className="table-container">
        <table className="config-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left", paddingLeft: 12 }}>Parameter</th>
              <th style={{ textAlign: "left" }}>Value</th>
            </tr>
          </thead>
          <tbody>{firstDataKeys.map(renderRow)}</tbody>
        </table>
      </div>

      {/* ================= Activity Table ================= */}
      <h2 style={{ marginTop: 20, marginBottom: 15 }}>Activity</h2>
      <div className="table-container">
        <table className="config-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left", paddingLeft: 12 }}>Parameter</th>
              <th style={{ textAlign: "left" }}>Value</th>
            </tr>
          </thead>
          <tbody>{activityKeys.map(renderRow)}</tbody>
        </table>
      </div>
    </section>
  );
}