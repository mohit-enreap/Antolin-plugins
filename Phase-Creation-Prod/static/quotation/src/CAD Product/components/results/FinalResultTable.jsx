import React from "react";

export default function FinalResultTable({ results }) {
  if (!results || results.length === 0)
    return (
      <div className="small muted">
        No active activities or results to display.
      </div>
    );
  return (
    <div className="resultTableWrapper">
      <table>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th>Activity Name</th>
            <th>TDL</th>
            <th>COO</th>
            <th>DE</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.activityName}>
              <td style={{ textAlign: "left", paddingLeft: 8 }}>
                {r.activityName}
              </td>
              <td>{r.TDL}</td>
              <td>{r.COO}</td>
              <td>{r.DE}</td>
              <td>{r.Total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
