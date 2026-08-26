import { reworkPercent } from "../../../data/Rework/reworkPercentage";
import { getFeasibilityPercentage } from "../../../utils/FeasibilityUtils";
import { ORG_SOURCE_BY_ROLE } from "../Data/CostCenterMappingUtil";

import { getOrgValue } from "../Data/CostCenterMappingUtil";

import { calculateCost } from "../Data/COST_RATE_BY_ORGUtil";


// 3D role rows
const ROLE_ROWS = ["TDL", "COO", "DE"];

// Activity rows (non-role based)
const ACTIVITY_ROWS = [
  "2d Antolin Drawings",
  "2d Customer Drawings",
  "Data Management",
  "Geometrical Study",
];

const CAE_ROWS = ["CAE Engineer", "CAE Standard Work"];

export function fillCostSheetData(
  template,
  totals,
  roleMapping,
  customerProductData,
  quotationText,
  sharedRef
) {

  ///alert("sharedRef :"+sharedRef)
  let dePhase1 = 0;
  let dePhase2 = 0;

  let totalPhase1 = 0;
  let totalPhase2 = 0;
  let totalAll = 0;

  const updatedRows = template.rows.map((row) => {
    const roleKey = row.role;

    let phase1Hours = 0;
    let phase2Hours = 0;

    // alert(
    //   "roleKey ::" + roleKey + "orgcustomerProductData ::" + customerProductData
    // );

    /* ======================================================
       1️⃣ 3D ROLE ROWS (TDL / COO / DE)
       ====================================================== */

// alert("totals[3d] :"+totals["3D"])

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

      const org = getOrgValue(roleKey, customerProductData);

      return {
        ...row,
        org,
        phase1: {
          ...row.phase1,
          hours: phase1Hours,
          cost: calculateCost(phase1Hours, org),
        },
        phase2: {
          ...row.phase2,
          hours: phase2Hours,
          cost: calculateCost(phase2Hours, org),
        },
        total: {
          ...row.total,
          hours: totalHours,
          cost: calculateCost(totalHours, org),
        },
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

    const org = getOrgValue(roleKey, customerProductData);

    return {
      ...row,
      org,
      phase1: {
        ...row.phase1,
        hours: phase1Hours,
        cost: calculateCost(phase1Hours, org),
      },
      phase2: {
        ...row.phase2,
        hours: phase2Hours,
        cost: calculateCost(phase2Hours, org),
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: calculateCost(totalHours, org),
      },
    };
  });

  /* ======================================================
     FINAL TOTAL ROW Design (Row)
     ====================================================== */
  updatedRows.push({
    role: "TOTAL",
    org: "OKAY Total",
    phase1: { ...template.rows[0].phase1, hours: +totalPhase1.toFixed(2) },
    phase2: { ...template.rows[0].phase2, hours: +totalPhase2.toFixed(2) },
    total: { ...template.rows[0].total, hours: +totalAll.toFixed(2) },
  });

  //===================================CAE==============================================
//   // For CAE Data



//   //=================================
//  let caeTotalPhase1 = 0;
//   let caeTotalPhase2 = 0;
//   let caeTotalAll = 0;
//   const updatedRows2 = template.rows2.map((row) => {
//     const roleKey = row.role;

//     let phase1Hours = 0;
//     let phase2Hours = 0;


//   if (CAE_ROWS.includes(roleKey)) {
//   if (roleKey === "CAE Engineer") {
//     // phase1Hours = 40;
//     // phase2Hours = 32;

//     phase1Hours = Number(sharedRef?.currentCAE?.CAEEngineersPhase1 ?? 0);
//     phase2Hours = Number(sharedRef?.currentCAE?.CAEEngineersPhase2 ?? 0);

//     if (phase1Hours === 0 && phase2Hours === 0) {
//       alert("CAE Engineer hours are missing or not calculated yet.");
//     }

//   } else if (roleKey === "CAE Standard Work") {
//     // phase1Hours = 16;
//     // phase2Hours = 12;

//     phase1Hours = Number(sharedRef?.currentCAE?.CAEStandardWorkPhase1 ?? 0);
//     phase2Hours = Number(sharedRef?.currentCAE?.CAEStandardWorkPhase2 ?? 0);

//     if (phase1Hours === 0 && phase2Hours === 0) {
//       alert("CAE Standard Work hours are missing or not calculated yet.");
//     }
//   }
// } else {
//   return row;
// }
//   //=============================

//   // let caeTotalPhase1 = 0;
//   // let caeTotalPhase2 = 0;
//   // let caeTotalAll = 0;
//   // const updatedRows2 = template.rows2.map((row) => {
//   //   const roleKey = row.role;

//   //   let phase1Hours = 0;
//   //   let phase2Hours = 0;

//   //   /* ======================================================
//   //    5️ CAE ROWS (rows2)
//   //    ====================================================== */
//   //   if (CAE_ROWS.includes(roleKey)) {
//   //     //  Dummy logic (replace later with real CAE source)
//   //     if (roleKey === "CAE Engineer") {
//   //       //phase1Hours = 40;
//   //       //phase2Hours = 32;
        
//   //     } else if (roleKey === "CAE Standard Work") {
//   //     //  phase1Hours = 16;
//   //       //phase2Hours = 12;
//   //     }
//   //   } else {
//   //     return row;
//   //   }

//     /* ======================================================
//      COMMON CALCULATION + ROUNDING
//      ====================================================== */
//     phase1Hours = +phase1Hours.toFixed(2);
//     phase2Hours = +phase2Hours.toFixed(2);
//     const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

//     totalPhase1 += phase1Hours;


//     totalPhase2 += phase2Hours;
//     totalAll += totalHours;

//         caeTotalPhase1 +=totalPhase1
//         caeTotalPhase2 +=totalPhase1
//    // alert("caeTotalPhase1 : "+caeTotalPhase1)

//     const org = getOrgValue(roleKey, customerProductData);

//     return {
//       ...row,
//       org,
//       phase1: {
//         ...row.phase1,
//         hours: phase1Hours,
//         cost: calculateCost(phase1Hours, org),
//       },
//       phase2: {
//         ...row.phase2,
//         hours: phase2Hours,
//         cost: calculateCost(phase2Hours, org),
//       },
//       total: {
//         ...row.total,
//         hours: totalHours,
//         cost: calculateCost(totalHours, org),
//       },
//     };
//   });

//   /* ======================================================
//    FINAL TOTAL ROW – CAE (rows2)
//    ====================================================== */
//   updatedRows2.push({
//     role: "TOTAL",
//     org: "CAE Total",
//     phase1: {
//       ...template.rows2[0].phase1,
//       hours: +caeTotalPhase1.toFixed(2),
//       cost: calculateCost(+caeTotalPhase1.toFixed(2), "CAE"),
//     },
//     phase2: {
//       ...template.rows2[0].phase2,
//       hours: +caeTotalPhase2.toFixed(2),
//       cost: calculateCost(+caeTotalPhase2.toFixed(2), "CAE"),
//     },
//     total: {
//       ...template.rows2[0].total,
//       hours: +caeTotalAll.toFixed(2),
//       cost: calculateCost(+caeTotalAll.toFixed(2), "CAE"),
//     },
//   });


//=================================== CAE ==============================================
// For CAE Data
//======================================================================================

// Initialize CAE totals (used ONLY for final TOTAL row)
let caeTotalPhase1 = 0;
let caeTotalPhase2 = 0;
let caeTotalAll = 0;

const updatedRows2 = template.rows2.map((row) => {
  const roleKey = row.role;

  let phase1Hours = 0;
  let phase2Hours = 0;

  /* ======================================================
     PROCESS ONLY CAE ROWS
     ====================================================== */
  if (!CAE_ROWS.includes(roleKey)) {
    return row; // non-CAE rows untouched
  }

  /* ======================================================
     FETCH HOURS BASED ON ROLE
     ====================================================== */
  if (roleKey === "CAE Engineer") {
    phase1Hours = Number(sharedRef?.currentCAE?.CAEEngineersPhase1 ?? 0);
    phase2Hours = Number(sharedRef?.currentCAE?.CAEEngineersPhase2 ?? 0);

    if (phase1Hours === 0 && phase2Hours === 0) {
     // alert("CAE Engineer hours are missing or not calculated yet.");
    }

  } else if (roleKey === "CAE Standard Work") {
    phase1Hours = Number(sharedRef?.currentCAE?.CAEStandardWorkPhase1 ?? 0);
    phase2Hours = Number(sharedRef?.currentCAE?.CAEStandardWorkPhase2 ?? 0);

    if (phase1Hours === 0 && phase2Hours === 0) {
     // alert("CAE Standard Work hours are missing or not calculated yet.");
    }
  }

  /* ======================================================
     COMMON CALCULATION + ROUNDING
     ====================================================== */
  phase1Hours = +phase1Hours.toFixed(2);
  phase2Hours = +phase2Hours.toFixed(2);
  const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

  /* ======================================================
     ✅ CAE TOTAL ACCUMULATION (CRITICAL FIX)
     ====================================================== */
  caeTotalPhase1 += phase1Hours;
  caeTotalPhase2 += phase2Hours;
  caeTotalAll += totalHours;

  const org = getOrgValue(roleKey, customerProductData);

  return {
    ...row,
    org,
    phase1: {
      ...row.phase1,
      hours: phase1Hours,
      cost: calculateCost(phase1Hours, org),
    },
    phase2: {
      ...row.phase2,
      hours: phase2Hours,
      cost: calculateCost(phase2Hours, org),
    },
    total: {
      ...row.total,
      hours: totalHours,
      cost: calculateCost(totalHours, org),
    },
  };
});

/* ======================================================
   FINAL TOTAL ROW – CAE (rows2)
   ====================================================== */
updatedRows2.push({
  role: "TOTAL",
  org: "CAE Total",
  phase1: {
    ...template.rows2[0].phase1,
    hours: +caeTotalPhase1.toFixed(2),
    cost: calculateCost(+caeTotalPhase1.toFixed(2), "CAE"),
  },
  phase2: {
    ...template.rows2[0].phase2,
    hours: +caeTotalPhase2.toFixed(2),
    cost: calculateCost(+caeTotalPhase2.toFixed(2), "CAE"),
  },
  total: {
    ...template.rows2[0].total,
    hours: +caeTotalAll.toFixed(2),
    cost: calculateCost(+caeTotalAll.toFixed(2), "CAE"),
  },
});






  //===================================Thermal Safty==============================================
  let thermalTotalPhase1 = 0;
  let thermalTotalPhase2 = 0;
  let thermalTotalAll = 0;

  const updatedRows3 = template.rows3.map((row) => {
    const roleKey = row.role;

    let phase1Hours = 0;
    let phase2Hours = 0;

    /* ======================================================
     THERMAL ROWS (rows3)
     ====================================================== */
    if (roleKey === "Thermals Activities") {
      // 🔹 Dummy values (replace later)
      phase1Hours = 24;
      phase2Hours = 16;
    } else {
      return row;
    }

    /* ======================================================
     COMMON CALCULATION + ROUNDING
     ====================================================== */
    phase1Hours = +phase1Hours.toFixed(2);
    phase2Hours = +phase2Hours.toFixed(2);
    const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

    thermalTotalPhase1 += phase1Hours;
    thermalTotalPhase2 += phase2Hours;
    thermalTotalAll += totalHours;

    const org = getOrgValue(roleKey, customerProductData);

    return {
      ...row,
      org,
      phase1: {
        ...row.phase1,
        hours: phase1Hours,
        cost: calculateCost(phase1Hours, org),
      },
      phase2: {
        ...row.phase2,
        hours: phase2Hours,
        cost: calculateCost(phase2Hours, org),
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: calculateCost(totalHours, org),
      },
    };
  });

  /* ======================================================
   FINAL TOTAL ROW – THERMALS (rows3)
   ====================================================== */
  updatedRows3.push({
    role: "TOTAL",
    org: "Thermals Total",
    phase1: {
      ...template.rows3[0].phase1,
      hours: +thermalTotalPhase1.toFixed(2),
      cost: calculateCost(+thermalTotalPhase1.toFixed(2), "THERMAL"),
    },
    phase2: {
      ...template.rows3[0].phase2,
      hours: +thermalTotalPhase2.toFixed(2),
      cost: calculateCost(+thermalTotalPhase2.toFixed(2), "THERMAL"),
    },
    total: {
      ...template.rows3[0].total,
      hours: +thermalTotalAll.toFixed(2),
      cost: calculateCost(+thermalTotalAll.toFixed(2), "THERMAL"),
    },
  });

  //=================================== PS ==============================================
  let safetyTotalPhase1 = 0;
  let safetyTotalPhase2 = 0;
  let safetyTotalAll = 0;
  const updatedRows4 = template.rows4.map((row) => {
    const roleKey = row.role;

    let phase1Hours = 0;
    let phase2Hours = 0;

    /* ======================================================
     SAFETY ROWS (rows4)
     ====================================================== */
    if (roleKey === "P. Safety Standard & Leader act") {
      // 🔹 Dummy values (replace later)

      // phase1Hours = 12;
      // phase2Hours = 8;


      
      phase1Hours = Number(sharedRef?.currentPS?.protoTotal ?? 0);
      phase2Hours = Number(sharedRef?.currentPS?.serieTotal ?? 0);
    } else {
      return row;
    }

    /* ======================================================
     COMMON CALCULATION + ROUNDING
     ====================================================== */
    phase1Hours = +phase1Hours.toFixed(2);
    phase2Hours = +phase2Hours.toFixed(2);
    const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

    safetyTotalPhase1 += phase1Hours;
    safetyTotalPhase2 += phase2Hours;
    safetyTotalAll += totalHours;

    const org = getOrgValue(roleKey, customerProductData);

    return {
      ...row,
      org,
      phase1: {
        ...row.phase1,
        hours: phase1Hours,
        cost: calculateCost(phase1Hours, org),
      },
      phase2: {
        ...row.phase2,
        hours: phase2Hours,
        cost: calculateCost(phase2Hours, org),
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: calculateCost(totalHours, org),
      },
    };
  });

  /* ======================================================
   FINAL TOTAL ROW – SAFETY (rows4)
   ====================================================== */
  updatedRows4.push({
    role: "TOTAL",
    org: "Safety Total",
    phase1: {
      ...template.rows4[0].phase1,
      hours: +safetyTotalPhase1.toFixed(2),
      cost: calculateCost(+safetyTotalPhase1.toFixed(2), "SAFETY"),
    },
    phase2: {
      ...template.rows4[0].phase2,
      hours: +safetyTotalPhase2.toFixed(2),
      cost: calculateCost(+safetyTotalPhase2.toFixed(2), "SAFETY"),
    },
    total: {
      ...template.rows4[0].total,
      hours: +safetyTotalAll.toFixed(2),
      cost: calculateCost(+safetyTotalAll.toFixed(2), "SAFETY"),
    },
  });

  //=================================== Other ==============================================
  // =====================================
  // STEP 1: Declare totals for rows5
  // =====================================
  let expenseTotalPhase0 = 0;
  let expenseTotalPhase1 = 0;
  let expenseTotalPhase2 = 0;
  let expenseTotalPhase34 = 0;
  let expenseTotalAll = 0;

  // =====================================
  // STEP 2: Create updatedRows5
  // =====================================
  const updatedRows5 = template.rows5.map((row) => {
    const categoryKey = row.category;

    let phase0Hours = 0;
    let phase1Hours = 0;
    let phase2Hours = 0;
    let phase34Hours = 0;

    /* ======================================================
     EXPENSE ROWS (rows5)
     ====================================================== */
    if (categoryKey === "Travels") {
      phase0Hours = 5;
      phase1Hours = 10;
      phase2Hours = 6;
      phase34Hours = 4;
    } else if (categoryKey === "Licenses (CAD)") {
      phase0Hours = 2;
      phase1Hours = 8;
      phase2Hours = 3;
      phase34Hours = 1;
    } else if (categoryKey === "Materials") {
      phase0Hours = 1;
      phase1Hours = 6;
      phase2Hours = 4;
      phase34Hours = 2;
    } else {
      return row;
    }

    /* ======================================================
     COMMON CALCULATION + ROUNDING
     ====================================================== */
    phase0Hours = +phase0Hours.toFixed(2);
    phase1Hours = +phase1Hours.toFixed(2);
    phase2Hours = +phase2Hours.toFixed(2);
    phase34Hours = +phase34Hours.toFixed(2);

    const totalHours = +(
      phase0Hours +
      phase1Hours +
      phase2Hours +
      phase34Hours
    ).toFixed(2);

    expenseTotalPhase0 += phase0Hours;
    expenseTotalPhase1 += phase1Hours;
    expenseTotalPhase2 += phase2Hours;
    expenseTotalPhase34 += phase34Hours;
    expenseTotalAll += totalHours;

    return {
      ...row,
      phase0: {
        ...row.phase0,
        hours: phase0Hours,
        cost: calculateCost(phase0Hours, "EXPENSE"),
      },
      phase1: {
        ...row.phase1,
        hours: phase1Hours,
        cost: calculateCost(phase1Hours, "EXPENSE"),
      },
      phase2: {
        ...row.phase2,
        hours: phase2Hours,
        cost: calculateCost(phase2Hours, "EXPENSE"),
      },
      phase34: {
        ...row.phase34,
        hours: phase34Hours,
        cost: calculateCost(phase34Hours, "EXPENSE"),
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: calculateCost(totalHours, "EXPENSE"),
      },
    };
  });
  /* ======================================================
   FINAL TOTAL ROW – EXPENSES (rows5)
   ====================================================== */
  updatedRows5.push({
    category: "TOTAL",
    phase0: {
      ...template.rows5[0].phase0,
      hours: +expenseTotalPhase0.toFixed(2),
      cost: calculateCost(+expenseTotalPhase0.toFixed(2), "EXPENSE"),
    },
    phase1: {
      ...template.rows5[0].phase1,
      hours: +expenseTotalPhase1.toFixed(2),
      cost: calculateCost(+expenseTotalPhase1.toFixed(2), "EXPENSE"),
    },
    phase2: {
      ...template.rows5[0].phase2,
      hours: +expenseTotalPhase2.toFixed(2),
      cost: calculateCost(+expenseTotalPhase2.toFixed(2), "EXPENSE"),
    },
    phase34: {
      ...template.rows5[0].phase34,
      hours: +expenseTotalPhase34.toFixed(2),
      cost: calculateCost(+expenseTotalPhase34.toFixed(2), "EXPENSE"),
    },
    total: {
      ...template.rows5[0].total,
      hours: +expenseTotalAll.toFixed(2),
      cost: calculateCost(+expenseTotalAll.toFixed(2), "EXPENSE"),
    },
  });

  //=================================== License ==============================================
  // =====================================
  // STEP 1: Declare totals for rows6
  // =====================================
  let budgetTotalPhase0 = 0;
  let budgetTotalPhase1 = 0;
  let budgetTotalPhase2 = 0;
  let budgetTotalPhase34 = 0;
  let budgetTotalAll = 0;

  // =====================================
  // STEP 2: Create updatedRows6
  // =====================================
  const updatedRows6 = template.rows6.map((row) => {
    const categoryKey = row.category;

    let phase0Hours = 0;
    let phase1Hours = 0;
    let phase2Hours = 0;
    let phase34Hours = 0;

    /* ======================================================
     BUDGET TOTAL ROW (rows6)
     ====================================================== */
    if (categoryKey === "Budget Total") {
      // 🔹 Dummy values (replace later)
      phase0Hours = 10;
      phase1Hours = 40;
      phase2Hours = 25;
      phase34Hours = 15;
    } else {
      return row;
    }

    /* ======================================================
     COMMON CALCULATION + ROUNDING
     ====================================================== */
    phase0Hours = +phase0Hours.toFixed(2);
    phase1Hours = +phase1Hours.toFixed(2);
    phase2Hours = +phase2Hours.toFixed(2);
    phase34Hours = +phase34Hours.toFixed(2);

    const totalHours = +(
      phase0Hours +
      phase1Hours +
      phase2Hours +
      phase34Hours
    ).toFixed(2);

    budgetTotalPhase0 += phase0Hours;
    budgetTotalPhase1 += phase1Hours;
    budgetTotalPhase2 += phase2Hours;
    budgetTotalPhase34 += phase34Hours;
    budgetTotalAll += totalHours;

    return {
      ...row,
      phase0: {
        ...row.phase0,
        hours: phase0Hours,
        cost: calculateCost(phase0Hours, "BUDGET"),
      },
      phase1: {
        ...row.phase1,
        hours: phase1Hours,
        cost: calculateCost(phase1Hours, "BUDGET"),
      },
      phase2: {
        ...row.phase2,
        hours: phase2Hours,
        cost: calculateCost(phase2Hours, "BUDGET"),
      },
      phase34: {
        ...row.phase34,
        hours: phase34Hours,
        cost: calculateCost(phase34Hours, "BUDGET"),
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: calculateCost(totalHours, "BUDGET"),
      },
    };
  });

  /* ======================================================
   FINAL TOTAL ROW – BUDGET (rows6)
   ====================================================== */
  updatedRows6.push({
    category: "TOTAL",
    phase0: {
      ...template.rows6[0].phase0,
      hours: +budgetTotalPhase0.toFixed(2),
      cost: calculateCost(+budgetTotalPhase0.toFixed(2), "BUDGET"),
    },
    phase1: {
      ...template.rows6[0].phase1,
      hours: +budgetTotalPhase1.toFixed(2),
      cost: calculateCost(+budgetTotalPhase1.toFixed(2), "BUDGET"),
    },
    phase2: {
      ...template.rows6[0].phase2,
      hours: +budgetTotalPhase2.toFixed(2),
      cost: calculateCost(+budgetTotalPhase2.toFixed(2), "BUDGET"),
    },
    phase34: {
      ...template.rows6[0].phase34,
      hours: +budgetTotalPhase34.toFixed(2),
      cost: calculateCost(+budgetTotalPhase34.toFixed(2), "BUDGET"),
    },
    total: {
      ...template.rows6[0].total,
      hours: +budgetTotalAll.toFixed(2),
      cost: calculateCost(+budgetTotalAll.toFixed(2), "BUDGET"),
    },
  });

//=============Logic For Aggrgationg Cost Center========

/*
// Step 2: Collect all rows together
const allRowsCombined = [
  ...updatedRows,
  ...updatedRows2,
  ...updatedRows3,
  ...updatedRows4,
  ...updatedRows5,
  ...updatedRows6,
];

// Run aggregation
const orgTotals = aggregateByOrg(allRowsCombined);
// Step 3: Print or alert results
Object.entries(orgTotals).forEach(([org, totals]) => {
  // console.log(
  //   `Org: ${org} | Phase1: ${totals.phase1} | Phase2: ${totals.phase2} | Total: ${totals.total}`
  // );
  // Or alert if you prefer:
   alert(`Org: ${org}\nPhase1: ${totals.phase1}\nPhase2: ${totals.phase2}\nTotal: ${totals.total}`);
});

*/
const allRowsCombined = [
  ...updatedRows,
  ...updatedRows2,
  ...updatedRows3,
  ...updatedRows4,
  ...updatedRows5,
  ...updatedRows6,
];

const orgTotals = aggregateByOrg(allRowsCombined);

Object.entries(orgTotals).forEach(([org, totals]) => {
  console.log(
    `Org: ${org} | Phase1: ${totals.phase1} | Phase2: ${totals.phase2} | Total: ${totals.total}`
  );
  console.log(`   Roles contributing: ${totals.roles.join(", ")}`);
  
  // Or alert if you prefer:
   alert(`Org: ${org}\nPhase1: ${totals.phase1}\nPhase2: ${totals.phase2}\nTotal: ${totals.total}\nRoles: ${totals.roles.join(", ")}`);
});



  ///========FINal Return=================================

  return {
    ...template,
    rows: updatedRows,
    rows2: updatedRows2,
    rows3: updatedRows3,
    rows4: updatedRows4,
    rows5: updatedRows5,
    rows6: updatedRows6,
  };
}





//1

function aggregateByOrg1(allRows) {
  const orgTotals = {};

  allRows.forEach((row) => {
    if (!row.org || row.role === "TOTAL" || row.category === "TOTAL") return;

    if (!orgTotals[row.org]) {
      orgTotals[row.org] = {
        phase1: 0,
        phase2: 0,
        total: 0,
      };
    }

    orgTotals[row.org].phase1 += row.phase1?.hours ?? 0;
    orgTotals[row.org].phase2 += row.phase2?.hours ?? 0;
    orgTotals[row.org].total += row.total?.hours ?? 0;
  });

  return orgTotals;
}



function aggregateByOrg(allRows) {
  const orgTotals = {};

  allRows.forEach((row) => {
    if (!row.org || row.role === "TOTAL" || row.category === "TOTAL") return;

    if (!orgTotals[row.org]) {
      orgTotals[row.org] = {
        phase1: 0,
        phase2: 0,
        total: 0,
        roles: []   // 👈 keep track of contributing roles
      };
    }

    orgTotals[row.org].phase1 += row.phase1?.hours ?? 0;
    orgTotals[row.org].phase2 += row.phase2?.hours ?? 0;
    orgTotals[row.org].total += row.total?.hours ?? 0;

    // Add role/category name for traceability
    if (row.role) {
      orgTotals[row.org].roles.push(row.role);
    } else if (row.category) {
      orgTotals[row.org].roles.push(row.category);
    }
  });

  return orgTotals;
}

