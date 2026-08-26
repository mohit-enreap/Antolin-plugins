import React from "react";

const RFQPhaseTable = ({ data }) => {
  let totalTDL = 0;
  let totalDE = 0;

  if (data && data.rows) {
    data.rows.forEach((row) => {
      if (row.role === "TDL") {
        totalTDL = totalTDL + (row.total?.hours || 0);
      }

      if (row.role === "DE") {
        totalDE = totalDE + (row.total?.hours || 0);
      }
    });
  }

  return (
    <div className="table-container">
      <table className="config-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left", paddingLeft: 12, width: "50%" }}>
              Description
            </th>
            <th style={{ textAlign: "left", width: "50%" }}>
              Total Hours
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td
              style={{
                textAlign: "left",
                paddingLeft: 12,
                fontWeight: "600",
                fontSize: "1.05em",
                color: "#333",
              }}
            >
              PS Engineers (i.e CE) (TDL)
            </td>
            <td style={{ textAlign: "left" }}>
              <span style={{ color: "#555", fontWeight: "500" }}>
                {totalTDL}
              </span>
            </td>
          </tr>

          <tr>
            <td
              style={{
                textAlign: "left",
                paddingLeft: 12,
                fontWeight: "600",
                fontSize: "1.05em",
                color: "#333",
              }}
            >
              PS Standard Work (i.e SOW) (DE)
            </td>
            <td style={{ textAlign: "left" }}>
              <span style={{ color: "#555", fontWeight: "500" }}>
                {totalDE}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default RFQPhaseTable;