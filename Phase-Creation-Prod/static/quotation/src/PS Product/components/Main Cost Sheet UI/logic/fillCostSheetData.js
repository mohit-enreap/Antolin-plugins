import { reworkPercent } from "../../../data/Rework/reworkPercentage";
import { getFeasibilityPercentage } from "../../../utils/FeasibilityUtils";

// 3D role rows
const ROLE_ROWS = ["TDL", "COO", "DE"];

// Activity rows (non-role based)
const ACTIVITY_ROWS = [
  "2d Antolin Drawings",
  "2d Customer Drawings",
  "Data Management",
  "Geometrical Study",
];

export function fillCostSheetData(template, totals, roleMapping) {
  let dePhase1 = 0;
  let dePhase2 = 0;

  let totalPhase1 = 0;
  let totalPhase2 = 0;
  let totalAll = 0;

  const updatedRows = template.rows.map((row) => {
    const roleKey = row.role;

    let phase1Hours = 0;
    let phase2Hours = 0;

    /* ======================================================
       1️⃣ 3D ROLE ROWS (TDL / COO / DE)
       ====================================================== */
    if (ROLE_ROWS.includes(roleKey)) {
      const data = totals["3D"]?.[0];
      if (!data) return row;

      phase1Hours = Number(data[`proto${roleKey}`] ?? 0);
      phase2Hours = Number(data[`serie${roleKey}`] ?? 0);

      // Store DE for Rework / Feasibility
      if (roleKey === "DE") {
        dePhase1 = phase1Hours;
        dePhase2 = phase2Hours;
      }
    } else if (ACTIVITY_ROWS.includes(roleKey)) {
      /* ======================================================
   ACTIVITY ROWS (2D / DM / GS)
   protoTotal → Phase 1
   serieTotal → Phase 2
   Total → Total
   ====================================================== */

      const source = roleMapping[roleKey];
      const data = totals[source]?.[0];

      // alert("Source Data:\n" + JSON.stringify(data, null, 2));

      if (!data) return row;

      // ✅ Direct mapping (NO summation)
      let phase1Hours = Number(data.protoTotal ?? 0);
      let phase2Hours = Number(data.serieTotal ?? 0);
      let totalHours = Number(data.Total ?? phase1Hours + phase2Hours);

      // alert(
      //   `📊 Activity Hours\n\n` +
      //     `Phase 1 (Proto Total): ${phase1Hours}\n` +
      //     `Phase 2 (Serie Total): ${phase2Hours}\n` +
      //     `Total Hours: ${totalHours}\n`
      // );

      // rounding
      phase1Hours = +phase1Hours.toFixed(2);
      phase2Hours = +phase2Hours.toFixed(2);
      totalHours = +totalHours.toFixed(2);

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
      /* ======================================================
       3️⃣ REWORK (Derived from DE)
       ====================================================== */
      const product = "OHS"; // TODO: make dynamic
      const percent = reworkPercent?.Rework?.[product] ?? 0;

      phase1Hours = (dePhase1 * percent) / 100;
      phase2Hours = (dePhase2 * percent) / 100;
    } else if (roleKey === "Feasibility") {
      /* ======================================================
       4️⃣ FEASIBILITY (Derived from DE)
       ====================================================== */
      const p1Percent = getFeasibilityPercentage("Phase1", "YES");
      const p2Percent = getFeasibilityPercentage("Phase2", "YES");

      phase1Hours = (dePhase1 * p1Percent) / 100;
      phase2Hours = (dePhase2 * p2Percent) / 100;
    } else {
      return row;
    }

    /* ======================================================
       COMMON CALCULATION + ROUNDING
       ====================================================== */
    phase1Hours = +phase1Hours.toFixed(2);
    phase2Hours = +phase2Hours.toFixed(2);
    const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

    totalPhase1 += phase1Hours;
    totalPhase2 += phase2Hours;
    totalAll += totalHours;

    return {
      ...row,
      phase1: { ...row.phase1, hours: phase1Hours },
      phase2: { ...row.phase2, hours: phase2Hours },
      total: { ...row.total, hours: totalHours },
    };
  });

  /* ======================================================
     FINAL TOTAL ROW
     ====================================================== */
  updatedRows.push({
    role: "TOTAL",
    phase1: { ...template.rows[0].phase1, hours: +totalPhase1.toFixed(2) },
    phase2: { ...template.rows[0].phase2, hours: +totalPhase2.toFixed(2) },
    total: { ...template.rows[0].total, hours: +totalAll.toFixed(2) },
  });

  return {
    ...template,
    rows: updatedRows,
  };
}
