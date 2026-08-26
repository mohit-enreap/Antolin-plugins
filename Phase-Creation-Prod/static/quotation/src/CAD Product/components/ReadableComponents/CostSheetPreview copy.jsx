import React from "react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <div className="overflow-auto border rounded-2xl shadow-sm">{children}</div>
  </div>
);

const Table = ({ headers, rows }) => (
  <table className="min-w-full text-sm">
    <thead className="bg-gray-100">
      <tr>
        {headers.map((h) => (
          <th key={h} className="px-4 py-2 text-left font-medium whitespace-nowrap">
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} className="border-t">
          {row.map((cell, j) => (
            <td key={j} className="px-4 py-2 whitespace-nowrap">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default function CostSheetPreview({ data }) {
  if (!data) return <div className="p-6">No data available</div>;

  const { inputs = {}, outputs = {} } = data;

  /* ================= INPUT TABLES ================= */

  const phaseInputRows = Object.entries(inputs.phaseDatesInput || {}).map(
    ([phase, v]) => [phase, v.start || "-", v.end || "-"]
  );

  const costCenterInputRows = Object.entries(inputs.costCentersData || {}).map(
    ([name, vals]) => [name, vals.Offer, vals.Proto, vals.Serie, vals.Indust]
  );

  const hoursInputRows = Object.entries(inputs.hoursByCostCenter || {}).map(
    ([name, years]) => [name, ...Object.values(years)]
  );

  const cecoRows = (inputs.CECO_COST_SHEET?.data || []).map((r) => [
    r.society,
    r.ceco,
    r["2025"],
    r["2026"],
    r["2027"],
    r["2028"],
  ]);

  /* ================= OUTPUT TABLES ================= */

  const phaseOutputRows = (outputs.phaseWisePercentages || []).map((p) => [
    p.phase,
    ...Object.values(p.distribution || {}),
  ]);

  const allCentersRows = Object.entries(outputs.allCostCentersYearWise || {}).map(
    ([name, years]) => [name, ...Object.values(years)]
  );

  const finalRows = Object.entries(outputs.finalHoursAndCosts || {}).map(
    ([name, obj]) => [name, obj.ceco, obj.totalHours, obj.totalCost]
  );

  return (
    <div className="p-6 space-y-10">
      {/* ================= INPUTS ================= */}
      <h1 className="text-2xl font-bold">Input Data</h1>

      <Section title="Phase Dates Input">
        <Table headers={["Phase", "Start", "End"]} rows={phaseInputRows} />
      </Section>

      <Section title="Cost Centers Data">
        <Table
          headers={["Cost Center", "Offer", "Proto", "Serie", "Indust"]}
          rows={costCenterInputRows}
        />
      </Section>

      <Section title="Hours By Cost Center">
        <Table
          headers={["Cost Center", "2025", "2026", "2027", "2028", "2029"]}
          rows={hoursInputRows}
        />
      </Section>

      <Section title="CECO Cost Sheet">
        <Table
          headers={["Society", "CECO", "2025", "2026", "2027", "2028"]}
          rows={cecoRows}
        />
      </Section>

      {/* ================= OUTPUTS ================= */}
      <h1 className="text-2xl font-bold">Output Data</h1>

      <Section title="Phase Wise Percentages">
        <Table
          headers={["Phase", "2025", "2026", "2027", "2028", "2029"]}
          rows={phaseOutputRows}
        />
      </Section>

      <Section title="All Cost Centers Year Wise">
        <Table
          headers={["Cost Center", "2025", "2026", "2027", "2028", "2029"]}
          rows={allCentersRows}
        />
      </Section>

      <Section title="Final Hours And Costs">
        <Table
          headers={["Cost Center", "CECO", "Total Hours", "Total Cost"]}
          rows={finalRows}
        />
      </Section>
    </div>
  );
}
