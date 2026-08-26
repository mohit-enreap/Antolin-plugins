import React from "react";
import { GlOBAL_VARIBALE_PARAM_RULES } from "./PARAM_RULES ";

const DISPLAY_LABELS = {
  TDL: "PS Engineer",
  DE: "PS Standard Work",
};

export default function GlobalParams({ globalParams, onChange }) {
  return (
    <section className="section">
      <h2>Global Parameters</h2>

      <div id="globalContainer">
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
          </thead>

          <tbody>
            {Object.keys(globalParams)
              .filter((key) => key !== "COO") // ⬅ Hide COO (display-only)
              .map((key) => {
                const rule = GlOBAL_VARIBALE_PARAM_RULES[key];
                const options = rule?.options || ["YES", "NO"];

                return (
                  <tr key={key}>
                    <td style={{ textAlign: "left", paddingLeft: 12 }}>
                      {DISPLAY_LABELS[key] || key}
                    </td>

                    <td>
                      <select
                        value={globalParams[key]}
                        onChange={(e) => onChange(key, e.target.value)}
                      >
                        {options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
