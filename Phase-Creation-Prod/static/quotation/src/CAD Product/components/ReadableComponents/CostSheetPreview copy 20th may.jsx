// import React from "react";

// const Section = ({ title, children }) => (
//   <div className="mb-8">
//     <h2 className="text-xl font-semibold mb-3">{title}</h2>
//     <div className="overflow-auto border rounded-2xl shadow-sm">{children}</div>
//   </div>
// );

// const Table = ({ headers, rows }) => (
//   <table className="min-w-full text-sm">
//     <thead className="bg-gray-100">
//       <tr>
//         {headers.map((h) => (
//           <th key={h} className="px-4 py-2 text-left font-medium">
//             {h}
//           </th>
//         ))}
//       </tr>
//     </thead>
//     <tbody>
//       {rows.map((row, i) => (
//         <tr key={i} className="border-t">
//           {row.map((cell, j) => (
//             <td key={j} className="px-4 py-2 whitespace-nowrap">
//               {cell}
//             </td>
//           ))}
//         </tr>
//       ))}
//     </tbody>
//   </table>
// );

// export default function FinalDebugTable({ FINAL_DEBUG_DATA }) {
//   if (!FINAL_DEBUG_DATA) return null;

//   const {
//     input1 = {},
//     input2 = {},
//     input3 = {},
//     output1 = {},
//     output2 = {},
//     output3 = {},
//   } = FINAL_DEBUG_DATA;

//   /* ================= INPUT 1 ================= */
//   const phaseInputRows = Object.entries(input1.phaseDatesInput || {}).map(
//     ([phase, v]) => [phase, v.start || "-", v.end || "-"]
//   );

//   /* ================= OUTPUT 1 ================= */
//   const phaseOutputRows = (output1.phaseWisePercentages || []).map((p) => [
//     p.phase,
//     ...Object.values(p.distribution || {}),
//   ]);

//   /* ================= INPUT 2 ================= */
//   const phaseInput2Rows = (input2.phaseWisePercentages || []).map((p) => [
//     p.phase,
//     ...Object.values(p.distribution || {}),
//   ]);

//   const costCenterInputRows = Object.entries(input2.costCentersData || {}).map(
//     ([name, vals]) => [
//       name,
//       vals.Offer,
//       vals.Proto,
//       vals.Serie,
//       vals.Indust,
//     ]
//   );

//   /* ================= OUTPUT 2 ================= */
//   const allCentersRows = Object.entries(output2.allCostCentersYearWise || {}).map(
//     ([name, years]) => [name, ...Object.values(years || {})]
//   );

//   /* ================= INPUT 3 ================= */
//   const hoursInputRows = Object.entries(input3.hoursByCostCenter || {}).map(
//     ([name, years]) => [name, ...Object.values(years || {})]
//   );

//   const cecoRows = (input3.CECO_COST_SHEET?.data || []).map((r) => [
//     r.society,
//     r.ceco,
//     r["2025"],
//     r["2026"],
//     r["2027"],
//     r["2028"],
//     r["2029"] ?? "-",
//   ]);

//   /* ================= OUTPUT 3 ================= */
//   const finalRows = Object.entries(output3.finalHoursAndCosts || {}).map(
//     ([name, obj]) => [name, obj.ceco, obj.totalHours, obj.totalCost]
//   );

//   const hoursOutputRows = Object.entries(output3.hoursByCostCenter || {}).map(
//     ([name, years]) => [name, ...Object.values(years || {})]
//   );

//   const cecoOutputRows = (output3.CECO_COST_SHEET?.data || []).map((r) => [
//     r.society,
//     r.ceco,
//     r["2025"],
//     r["2026"],
//     r["2027"],
//     r["2028"],
//     r["2029"] ?? "-",
//   ]);

// return (
//   <div className="p-6 space-y-12">

//     {/* ================= PAIR 1 ================= */}
//     <h1 className="text-2xl font-bold">Input 1 → Output 1</h1>

//     <Section title="Input 1 → Phase Dates">
//       <Table headers={["Phase", "Start", "End"]} rows={phaseInputRows} />
//     </Section>

//     <Section title="Output 1 → Phase Wise Percentages">
//       <Table
//         headers={["Phase", "2025", "2026", "2027", "2028", "2029"]}
//         rows={phaseOutputRows}
//       />
//     </Section>

//     {/* ================= PAIR 2 ================= */}
//     <h1 className="text-2xl font-bold">Input 2 → Output 2</h1>

//     <Section title="Input 2 → Phase Wise Percentages">
//       <Table
//         headers={["Phase", "2025", "2026", "2027", "2028", "2029"]}
//         rows={phaseInput2Rows}
//       />
//     </Section>

//     <Section title="Input 2 → Cost Centers">
//       <Table
//         headers={["Cost Center", "Offer", "Proto", "Serie", "Indust"]}
//         rows={costCenterInputRows}
//       />
//     </Section>

//     <Section title="Output 2 → All Cost Centers Year Wise">
//       <Table
//         headers={["Cost Center", "2025", "2026", "2027", "2028", "2029"]}
//         rows={allCentersRows}
//       />
//     </Section>

//     {/* ================= PAIR 3 ================= */}
//     <h1 className="text-2xl font-bold">Input 3 → Output 3</h1>

//     <Section title="Input 3 → Hours By Cost Center">
//       <Table
//         headers={["Cost Center", "2025", "2026", "2027", "2028", "2029"]}
//         rows={hoursInputRows}
//       />
//     </Section>

//     <Section title="Input 3 → CECO Cost Sheet">
//       <Table
//         headers={["Society", "CECO", "2025", "2026", "2027", "2028", "2029"]}
//         rows={cecoRows}
//       />
//     </Section>

//     <Section title="Output 3 → Final Hours And Costs">
//       <Table
//         headers={["Cost Center", "CECO", "Total Hours", "Total Cost"]}
//         rows={finalRows}
//       />
//     </Section>

//     <Section title="Output 3 → Hours By Cost Center">
//       <Table
//         headers={["Cost Center", "2025", "2026", "2027", "2028", "2029"]}
//         rows={hoursOutputRows}
//       />
//     </Section>

//     <Section title="Output 3 → CECO Cost Sheet">
//       <Table
//         headers={["Society", "CECO", "2025", "2026", "2027", "2028", "2029"]}
//         rows={cecoOutputRows}
//       />
//     </Section>

//   </div>
// );

// }

//=============================================

import React from "react";

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-3">{title}</h2>
    <div className="overflow-auto border rounded-2xl shadow-sm">{children}</div>
  </div>
);

const Table = ({ headers, rows, footer }) => (
  <table className="min-w-full text-sm">
    <thead className="bg-gray-100">
      <tr>
        {headers.map((h) => (
          <th key={h} className="px-4 py-2 text-left font-medium">
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

    {footer && (
      <tfoot className="bg-gray-50 font-semibold border-t">
        <tr>
          {footer.map((cell, i) => (
            <td key={i} className="px-4 py-2 whitespace-nowrap">
              {cell}
            </td>
          ))}
        </tr>
      </tfoot>
    )}
  </table>
);

export default function FinalDebugTable({ FINAL_DEBUG_DATA }) {
  if (!FINAL_DEBUG_DATA) return null;

  const {
    input1 = {},
    input2 = {},
    input3 = {},
    output1 = {},
    output2 = {},
    output3 = {},
    output4 = {},
    HCC_BCC_DyanamicOutPut051 = {},
    HCC_BCC_DyanamicOutPut052 = {},
  } = FINAL_DEBUG_DATA;

  /* ================= INPUT 1 ================= */
  const phaseInputRows = Object.entries(input1.phaseDatesInput || {}).map(
    ([phase, v]) => [phase, v.start || "-", v.end || "-"],
  );

  /* ================= OUTPUT 1 ================= */
  const phaseOutputRows = (output1.phaseWisePercentages || []).map((p) => [
    p.phase,
    ...Object.values(p.distribution || {}),
  ]);

  /* ================= INPUT 2 ================= */
  const phaseInput2Rows = (input2.phaseWisePercentages || []).map((p) => [
    p.phase,
    ...Object.values(p.distribution || {}),
  ]);

  const costCenterInputRows = Object.entries(input2.costCentersData || {}).map(
    ([name, vals]) => [name, vals.Offer, vals.Proto, vals.Serie, vals.Indust],
  );

  /* ================= OUTPUT 2 ================= */
  const allCentersRows = Object.entries(
    output2.allCostCentersYearWise || {},
  ).map(([name, years]) => [name, ...Object.values(years || {})]);

  /* ================= INPUT 3 ================= */
  const hoursInputRows = Object.entries(input3.hoursByCostCenter || {}).map(
    ([name, years]) => [name, ...Object.values(years || {})],
  );

  const cecoRows = (input3.CECO_COST_SHEET?.data || []).map((r) => [
    r.society,
    r.ceco,
    r["2025"],
    r["2026"],
    r["2027"],
    r["2028"],
    r["2029"] ?? "-",
  ]);

  /* ================= OUTPUT 3 ================= */

  const finalHoursCostRows = Object.entries(
    output3.finalHoursAndCosts || {},
  ).map(([name, obj]) => {
    const yearly = obj.yearly || {};

    const row = [name, obj.ceco];

    let totalHours = 0;
    let totalCost = 0;

    Object.entries(yearly).forEach(([year, val]) => {
      row.push(val.hours);
      row.push(val.cost);

      totalHours += val.hours || 0;
      totalCost += val.cost || 0;
    });

    row.push(totalHours);
    row.push(totalCost);

    return row;
  });

  /** footer total */
  let grandHours = 0;
  let grandCost = 0;

  finalHoursCostRows.forEach((r) => {
    grandHours += r[r.length - 2] || 0;
    grandCost += r[r.length - 1] || 0;
  });

  const footerRow = ["TOTAL", "-"];

  const yearCount = finalHoursCostRows[0]?.length
    ? (finalHoursCostRows[0].length - 4) / 2
    : 0;

  for (let i = 0; i < yearCount; i++) {
    footerRow.push("-");
    footerRow.push("-");
  }

  footerRow.push(grandHours);
  footerRow.push(grandCost);

  const hoursOutputRows = Object.entries(output3.hoursByCostCenter || {}).map(
    ([name, years]) => [name, ...Object.values(years || {})],
  );

  const cecoOutputRows = (output3.CECO_COST_SHEET?.data || []).map((r) => [
    r.society,
    r.ceco,
    r["2025"],
    r["2026"],
    r["2027"],
    r["2028"],
    r["2029"] ?? "-",
  ]);

  const cecoData =
    output4.CECO_COST_SHEET_YearANDPhases?.data ||
    FINAL_DEBUG_DATA.CECO_COST_SHEET?.data ||
    [];

  const cecoOutputRows_yearsPhaeses = cecoData.map((r) => [
    r.society,
    r.ceco,
    r.type,
    r["2025"],
    r["2026"],
    r["2027"],
    r["2028"],
    r["2029"] ?? "-",
    r.phase_0,
    r.phase_1,
    r.phase_2,
    r.phase_3_4,
  ]);

  return (
    <div className="p-6 space-y-12">
      {/* ================= PAIR 1 ================= */}
      {/* <h1 className="text-2xl font-bold">Input 1 → Output 1</h1> */}

      <Section title="(Input) 1 → Phase Dates">
        <Table headers={["Phase", "Start", "End"]} rows={phaseInputRows} />
      </Section>

      <Section title="(Output 1) → Phase Wise Percentages">
        <Table
          headers={["Phase", "2025", "2026", "2027", "2028", "2029"]}
          rows={phaseOutputRows}
        />
      </Section>

      {/* ================= PAIR 2 ================= */}

      <Section title="Input 2(output1) → Phase Wise Percentages">
        <Table
          headers={["Phase", "2025", "2026", "2027", "2028", "2029"]}
          rows={phaseInput2Rows}
        />
      </Section>

      <Section title="Input 2 → Cost Centers (Runtime Calculated Aggregated(Hours) from all Cost center from Total Cost Sheet)">
        <Table
          headers={["Cost Center", "Offer", "Proto", "Serie", "Indust"]}
          rows={costCenterInputRows}
        />
      </Section>

      <Section title="Output 2 (Hours) → Applied phases%(Input 2) for respective years & distributed Hours in years i.e Hours By Cost Center">
        <Table
          headers={["Cost Center", "2025", "2026", "2027", "2028", "2029"]}
          rows={allCentersRows}
        />
      </Section>

      {/* ================= PAIR 3 ================= */}
      <h1 className="text-2xl font-bold"></h1>

      <Section title="Input 3 (Output 2) → Distributed Hours in years for all cost center">
        <Table
          headers={["Cost Center", "2025", "2026", "2027", "2028", "2029"]}
          rows={hoursInputRows}
        />
      </Section>

      <Section title="Input 3 → CECO Cost Sheet (Standard Cost) Applied for years">
        <Table
          headers={["Society", "CECO", "2025", "2026", "2027", "2028", "2029"]}
          rows={cecoRows}
        />
      </Section>

      <Section title="Output 3 → Final Hours & Cost Year Wise">
        <Table
          headers={[
            "Cost Center",
            "CECO",
            "2025 Hours",
            "2025 Cost",
            "2026 Hours",
            "2026 Cost",
            "2027 Hours",
            "2027 Cost",
            "2028 Hours",
            "2028 Cost",
            "2029 Hours",
            "2029 Cost",
            "Total Hours",
            "Total Cost",
          ]}
          rows={finalHoursCostRows}
          footer={footerRow}
        />
      </Section>

      {/* <Section title="Output 3 → Hours By Cost Center">
        <Table
          headers={["Cost Center", "2025", "2026", "2027", "2028", "2029"]}
          rows={hoursOutputRows}
        />
      </Section> */}

      <Section title="Output 3 → CECO Cost Sheet (Standard Cost for Years) ">
        <Table
          headers={["Society", "CECO", "2025", "2026", "2027", "2028", "2029"]}
          rows={cecoOutputRows}
        />
      </Section>

      <Section title="Output 3 → CECO Cost Sheet YEAR(Standard Cost for Years) & Phases(RuntimeCalculated Cost for phases)">
        <Table
          headers={[
            "Society",
            "CECO",
            "Type",
            "2025",
            "2026",
            "2027",
            "2028",
            "2029",
            "Phase 0",
            "Phase 1",
            "Phase 2",
            "Phase 3-4",
          ]}
          rows={cecoOutputRows_yearsPhaeses}
        />
      </Section>

      {/* ================= OUTPUT 5.1 ================= */}
      <Section title="Output → Pure Phase Values (HCC / BCC) ">
        <Table
          headers={["Phase", "HCC", "BCC"]}
          rows={Object.entries(HCC_BCC_DyanamicOutPut051 || {}).map(
            ([phase, v]) => [phase, v.HCC, v.BCC],
          )}
        />
      </Section>

      {/* ================= OUTPUT 5.2 ================= */}
      <Section title="Output →CECO SHEET : (HCC/BCC) used For Total Cost Sheet ">
        <Table
          headers={[
            "Distribution",
            "HCC %",
            "BCC %",
            "Phase 0",
            "Phase 1",
            "Phase 2",
            "Phase 3-4",
          ]}
          rows={(Array.isArray(HCC_BCC_DyanamicOutPut052)
            ? HCC_BCC_DyanamicOutPut052
            : Object.values(HCC_BCC_DyanamicOutPut052 || {})
          ).map((r) => [
            r.distribution,
            r.HCC_percent,
            r.BCC_percent,
            r["Phase 0"],
            r["Phase 1"],
            r["Phase 2"],
            r["Phase 3-4"],
          ])}
        />
      </Section>
    </div>
  );
}
