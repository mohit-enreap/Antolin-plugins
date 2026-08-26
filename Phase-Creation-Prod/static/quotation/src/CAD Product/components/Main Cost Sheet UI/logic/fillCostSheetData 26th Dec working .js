// Working

import { reworkPercent } from "../../../data/Rework/reworkPercentage";
import { getFeasibilityPercentage } from "../../../utils/FeasibilityUtils";

export function fillCostSheetData(template, totals, roleMapping) {
  // alert(
  //   "Data Summary (fillCostSheetData):\n\n" +
  //     "\n\n" +
  //     "2D Data:\n" +
  //     JSON.stringify(totals["2D"], null, 2)
  // );
  // alert(
  //   "Data Summary (fillCostSheetData):\n\n" +
  //     "\n\n" +
  //     "DM Data:\n" +
  //     JSON.stringify(totals["DM"], null, 2)
  // );
  // alert(
  //   "Data Summary (fillCostSheetData):\n\n" +
  //     "\n\n" +
  //     "GM Data:\n" +
  //     JSON.stringify(totals["GS"], null, 2)
  // );

  let alertMessage = "Cost Sheet Data Summary:\n\n";
  let dePhase1 = 0;
  let dePhase2 = 0;

  let totalPhase1 = 0;
  let totalPhase2 = 0;
  let totalAll = 0;

  const updatedRows = template.rows.map((row, index) => {
    const roleKey = row.role;

    if (roleKey !== "Rework" && roleKey !== "Feasibility") {
      const source = roleMapping[roleKey];
      if (!source || !totals[source] || !totals[source][0]) {
        console.warn("Missing mapping or totals for:", roleKey);
        return row;
      }

      const data = totals[source][0];

      // 🔹 Get raw values for ALL roles
      let phase1Hours = Number(data[`proto${roleKey}`] ?? row.phase1.hours);
      let phase2Hours = Number(data[`serie${roleKey}`] ?? row.phase2.hours);

      // 🔹 Always calculate total from phase1 + phase2
      let totalHours = phase1Hours + phase2Hours;

      // 🔹 Apply rounding FOR ALL ROLES
      phase1Hours = +phase1Hours.toFixed(2);
      phase2Hours = +phase2Hours.toFixed(2);
      totalHours = +totalHours.toFixed(2);

      // 🔹 Store DE separately (needed for Rework & Feasibility)
      if (roleKey === "DE") {
        dePhase1 = phase1Hours;
        dePhase2 = phase2Hours;
      }

      // 🔹 Add to grand totals (FOR ALL ROLES)
      totalPhase1 += phase1Hours;
      totalPhase2 += phase2Hours;
      totalAll += totalHours;

      return {
        ...row,
        phase1: { ...row.phase1, hours: phase1Hours },
        phase2: { ...row.phase2, hours: phase2Hours },
        total: { ...row.total, hours: totalHours },
      };
    } else if (roleKey === "Rework") {
      const product = "OHS"; // Need to make dyanamic
      const reworkPercentage = reworkPercent?.Rework?.[product] ?? 0;

      const phase1Hours = +((dePhase1 * reworkPercentage) / 100).toFixed(2);
      const phase2Hours = +((dePhase2 * reworkPercentage) / 100).toFixed(2);
      const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

      alertMessage +=
        `Row ${index + 1} ➜ Role: Rework\n` +
        `  Product: ${product}\n` +
        `  Rework %: ${reworkPercentage}\n` +
        `  Phase1 Hours: ${phase1Hours}\n` +
        `  Phase2 Hours: ${phase2Hours}\n` +
        `  Total Hours: ${totalHours}\n\n`;

      totalPhase1 += phase1Hours;
      totalPhase2 += phase2Hours;
      totalAll += totalHours;

      return {
        ...row,
        phase1: { ...row.phase1, hours: phase1Hours },
        phase2: { ...row.phase2, hours: phase2Hours },
        total: { ...row.total, hours: totalHours },
      };
    } else if (roleKey === "Feasibility") {
      const feasibilityPercentagephase1 = getFeasibilityPercentage(
        "Phase1",
        "YES"
      );
      const feasibilityPercentagephase2 = getFeasibilityPercentage(
        "Phase2",
        "YES"
      );

      const phase1Hours = +(
        (dePhase1 * feasibilityPercentagephase1) /
        100
      ).toFixed(2);
      const phase2Hours = +(
        (dePhase2 * feasibilityPercentagephase2) /
        100
      ).toFixed(2);
      const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

      alertMessage +=
        `Row ${index + 1} ➜ Role: Feasibility\n` +
        `  Feasibility %: ${feasibilityPercentagephase1} : ${feasibilityPercentagephase2}\n` +
        `  Phase1 Hours: ${phase1Hours}\n` +
        `  Phase2 Hours: ${phase2Hours}\n` +
        `  Total Hours: ${totalHours}\n\n`;

      totalPhase1 += phase1Hours;
      totalPhase2 += phase2Hours;
      totalAll += totalHours;

      return {
        ...row,
        phase1: { ...row.phase1, hours: phase1Hours },
        phase2: { ...row.phase2, hours: phase2Hours },
        total: { ...row.total, hours: totalHours },
      };
    } else {
      return row;
    }
  });

  // Round final totals
  totalPhase1 = +totalPhase1.toFixed(2);
  totalPhase2 = +totalPhase2.toFixed(2);
  totalAll = +totalAll.toFixed(2);

  updatedRows.push({
    role: "TOTAL",
    phase1: { ...template.rows[0].phase1, hours: totalPhase1 },
    phase2: { ...template.rows[0].phase2, hours: totalPhase2 },
    total: { ...template.rows[0].total, hours: totalAll },
  });

  return {
    ...template,
    rows: updatedRows,
  };
}
