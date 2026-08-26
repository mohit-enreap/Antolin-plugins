import React from "react";

/**
 * Renders Hours & Costs table directly from JSON
 * No data transformation needed
 */
const CostCenterTable = ({ data }) => {
  // Extract unique years dynamically (2025, 2026, ...)
  const years = Array.from(
    new Set(Object.values(data).flatMap((cc) => Object.keys(cc.yearly)))
  ).sort();

  return (
    <table border="1" cellPadding="8" cellSpacing="0" width="100%">
      {/* ================= HEADER ================= */}
      <thead>
        <tr>
          <th rowSpan="2">Company</th>
          <th rowSpan="2">CECO</th>

          {years.map((year) => (
            <th key={year} colSpan="2">
              {year}
            </th>
          ))}

          <th rowSpan="2">Total Hours</th>
          <th rowSpan="2">Total Cost</th>
        </tr>

        <tr>
          {years.map((year) => (
            <React.Fragment key={year}>
              <th>Hours</th>
              <th>Cost</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>

      {/* ================= BODY ================= */}
      <tbody>
        {Object.entries(data).map(([company, details]) => (
          <tr key={company}>
            <td>{company}</td>
            <td>{details.ceco}</td>

            {years.map((year) => (
              <React.Fragment key={year}>
                <td>{details.yearly[year]?.hours.toFixed(2) ?? "-"}</td>
                <td>{details.yearly[year]?.cost.toFixed(2) ?? "-"}</td>
              </React.Fragment>
            ))}

            <td>{details.totalHours.toFixed(2)}</td>
            <td>{details.totalCost.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CostCenterTable;
