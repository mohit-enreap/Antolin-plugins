// components/GlobalParams.jsx
import React from "react";

function GlobalParams({ globalTDL, globalDE, setGlobalTDL, setGlobalDE }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "16px",
        borderRadius: "6px",
        marginBottom: "20px",
      }}
    >
      <h2>Global Parameters For CAE Load Cases</h2>

      <table>
        <tbody>
          <tr>
            <td>
              <b>CAE Engineers (TDL)</b>
            </td>
            <td>
              <select
                value={globalTDL}
                onChange={(e) => setGlobalTDL(+e.target.value)}
              >
                <option value={1}>YES</option>
                <option value={0}>NO</option>
              </select>
            </td>
          </tr>

          <tr>
            <td>
              <b>CAE Standard Work (DE) </b>
            </td>
            <td>
              <select
                value={globalDE}
                onChange={(e) => setGlobalDE(+e.target.value)}
              >
                <option value={1}>YES</option>
                <option value={0}>NO</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default GlobalParams;
