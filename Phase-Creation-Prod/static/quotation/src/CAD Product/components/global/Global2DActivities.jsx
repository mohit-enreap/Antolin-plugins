// components/Global2DActivities.jsx
import React from "react";
import { get2DActivities } from "../../utils/activityUtils";

const Global2DActivities = ({ activities, onChange }) => {
  const rows = get2DActivities(activities);

  if (!rows.length) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>
        2D Drawing Configuration (Avoid For time Being . Consider proto & serie
        as Number of Drawing){" "}
      </h3>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Product</th>
            <th style={thStyle}>Include</th>
            <th style={thStyle}>No of Components</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.fullName}>
              <td style={tdStyle}>{r.label}</td>

              {/* Include */}
              <td style={tdStyle}>
                <select
                  value={r.include ? "Yes" : "No"}
                  onChange={(e) =>
                    onChange(r.fullName, "include", e.target.value)
                  }
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </td>

              {/* No of Components */}
              <td style={tdStyle}>
                <input
                  type="number"
                  min="1"
                  value={r.noOfComponent}
                  onChange={(e) =>
                    onChange(r.fullName, "noOfComponent", e.target.value)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Global2DActivities;

/* ===== Styles ===== */

const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  background: "#007bff",
  color: "#fff",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
};
