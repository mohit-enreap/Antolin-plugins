import React from "react";
import { GlOBAL_VARIBALE_PARAM_RULES } from "./PARAM_RULES";

const FIRST_DATA_KEYS = [
  "product",
  "Customer",
  "Type Of Development",
  "ProjectName",
];

export default function GlobalParams({ globalParams = {}, onChange }) {
  const renderRow1 = (key) => {
    const rule = GlOBAL_VARIBALE_PARAM_RULES[key] ?? {};
    const type = rule.type ?? "select";
    const options = rule.options ?? ["YES", "NO", ""];

    return (
      <tr key={key}>
        <td style={{ textAlign: "left", paddingLeft: 12 }}>
          {rule.label || key}
        </td>
        <td>
          {type === "text" ? (
            <input
              type="text"
              value={globalParams[key] ?? ""}
              placeholder={rule.placeholder ?? "Enter value"}
              onChange={(e) => onChange(key, e.target.value)}
            />
          ) : (
            <select
              value={globalParams[key] ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
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
  const renderRow2 = (key) => {
    const rule = GlOBAL_VARIBALE_PARAM_RULES[key] ?? {};
    const type = rule.type ?? "select";
    const options = rule.options ?? ["YES", "NO"];

    const isReadOnly = FIRST_DATA_KEYS.includes(key);

    return (
      <tr key={key}>
        <td style={{ textAlign: "left", paddingLeft: 12 }}>
          {rule.label || key}
        </td>
        <td>
          {type === "text" ? (
            <input
              type="text"
              value={globalParams[key] ?? ""}
              placeholder={rule.placeholder ?? "Enter value"}
              onChange={(e) => onChange(key, e.target.value)}
              readOnly={isReadOnly}
              style={
                isReadOnly ? { border: "none", background: "transparent" } : {}
              }
            />
          ) : (
            <select
              value={globalParams[key] ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={isReadOnly}
              style={
                isReadOnly
                  ? {
                    border: "none",
                    background: "transparent",
                    appearance: "none",
                  }
                  : {}
              }
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
  const renderRow = (key) => {
    const rule = GlOBAL_VARIBALE_PARAM_RULES[key] ?? {};
    const type = rule.type ?? "select";
    const options = rule.options ?? ["YES", "NO"];

    const isReadOnly = FIRST_DATA_KEYS.includes(key);

    return (
      <tr key={key}>
        {/* Updated styling for the Parameter column */}
        <td
          style={{
            textAlign: "left",
            paddingLeft: 12,
            fontWeight: "600",      /* Makes the text bold */
            fontSize: "1.05em",     /* Makes the text slightly larger */
            color: "#333"           /* Optional: ensures the text is nicely dark */
          }}
        >
          {rule.label || key}
        </td>

        <td>
          {isReadOnly ? (
            <span style={{ color: "#555" }}>
              {globalParams[key] ?? ""}
            </span>
          ) : type === "text" ? (
            <input
              type="text"
              value={globalParams[key] ?? ""}
              placeholder={rule.placeholder ?? "Enter value"}
              onChange={(e) => onChange(key, e.target.value)}
            />
          ) : (
            <select
              value={globalParams[key] ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
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
    (k) => !FIRST_DATA_KEYS.includes(k),
  );

  return (
    <section className="section">
      {/* ================= First Data Table ================= */}
      <h2 style={{ marginBottom: 15 }}>Details</h2>
      <div id="globalContainer">
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>{firstDataKeys.map(renderRow)}</tbody>
        </table>
      </div>

      {/* ================= Activity Table ================= */}
      <h2 style={{ marginTop: 20, marginBottom: 15 }}>Activity</h2>
      <div id="globalContainer">
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>{activityKeys.map(renderRow)}</tbody>
        </table>
      </div>
    </section>
  );
}
