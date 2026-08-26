import { reworkPercent } from "../../../data/Rework/reworkPercentage";
import { getFeasibilityPercentage } from "../../../utils/FeasibilityUtils";
import { ORG_SOURCE_BY_ROLE } from "../Data/CostCenterMappingUtil";

import { getOrgValue } from "../Data/CostCenterMappingUtil";

import { calculateCost ,calculateCost1 } from "../Data/COST_RATE_BY_ORGUtil";



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
  sharedRef,
  additionalOthersHoursAndCostPayload
) {

//===============================CAD===============================

// ===========================
// TOTAL HOLDERS
// ===========================
const deStore = { phase1: 0, phase2: 0 };

let totalPhase1 = 0;
let totalPhase2 = 0;
let totalAll = 0;

let totalCostPhase1 = 0;
let totalCostPhase2 = 0;
let totalCostAll = 0;

// ===========================
// MAIN ROW PROCESSING
// ===========================
const updatedRows = template.rows.map((row) => {
  const roleKey = row.role;

  let resolved = null;

  if (ROLE_ROWS.includes(roleKey)) {
    resolved = resolve3DRoleHours(roleKey, totals, deStore);
  } 
  else if (ACTIVITY_ROWS.includes(roleKey)) {
    resolved = resolveActivityHours(roleKey, totals, roleMapping);
  } 
  else if (roleKey === "Rework") {
    resolved = resolveReworkHours(deStore, reworkPercent);
  } 
  else if (roleKey === "Feasibility") {
    resolved = resolveFeasibilityHours(deStore);
  } 
  else {
    return row;
  }

  if (!resolved) return row;

  /* ======================================================
     COMMON ROUNDING
     ====================================================== */
  const phase1Hours = +resolved.phase1.toFixed(2);
  const phase2Hours = +resolved.phase2.toFixed(2);
  const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

  /* ======================================================
     ACCUMULATE HOURS
     ====================================================== */
  totalPhase1 += phase1Hours;
  totalPhase2 += phase2Hours;
  totalAll += totalHours;

  /* ======================================================
     COST CALCULATION
     ====================================================== */
  const org = getOrgValue(roleKey, customerProductData);

  const phase1Cost = calculateCost1(phase1Hours, org, "Phase 1");
  const phase2Cost = calculateCost1(phase2Hours, org, "Phase 2");

  totalCostPhase1 += phase1Cost;
  totalCostPhase2 += phase2Cost;
  totalCostAll += phase1Cost + phase2Cost;

  /* ======================================================
     RETURN UPDATED ROW
     ====================================================== */
  return {
    ...row,
    org,
    phase1: { ...row.phase1, hours: phase1Hours, cost: phase1Cost },
    phase2: { ...row.phase2, hours: phase2Hours, cost: phase2Cost },
    total: {
      ...row.total,
      hours: totalHours,
      cost: +(phase1Cost + phase2Cost).toFixed(2),
    },
  };
});


//Adding another row using push Function
updatedRows.push({
  role: "TOTAL",
  org: "CAD Total",

  phase1: {
    ...template.rows[0].phase1,
    hours: +totalPhase1.toFixed(2),
    cost: +totalCostPhase1.toFixed(2),
  },
  phase2: {
    ...template.rows[0].phase2,
    hours: +totalPhase2.toFixed(2),
    cost: +totalCostPhase2.toFixed(2),
  },
  total: {
    ...template.rows[0].total,
    hours: +totalAll.toFixed(2),
    cost: +totalCostAll.toFixed(2),
  },
});


//Helper function for Calculation cost for CAD:
// ===========================
// HOURS RESOLVERS (FUTURE SAFE)
// ===========================

function resolve3DRoleHours(roleKey, totals, deStore) {
  const data = totals["3D"]?.[0];
  if (!data) return null;

  const phase1 = Number(data[`proto${roleKey}`] ?? 0);
  const phase2 = Number(data[`serie${roleKey}`] ?? 0);

  // Store DE for dependent rows
  if (roleKey === "DE") {
    deStore.phase1 = phase1;
    deStore.phase2 = phase2;
  }

  return { phase1, phase2 };
}

function resolveActivityHours(roleKey, totals, roleMapping) {
  const source = roleMapping[roleKey];
  const data = totals[source]?.[0];
  if (!data) return null;

  return {
    phase1: Number(data.protoTotal ?? 0),
    phase2: Number(data.serieTotal ?? 0),
  };
}

function resolveReworkHours(deStore, reworkPercent) {
  const product = "OHS"; // TODO: make dynamic
  const percent = reworkPercent?.Rework?.[product] ?? 0;

  return {
    phase1: (deStore.phase1 * percent) / 100,
    phase2: (deStore.phase2 * percent) / 100,
  };
}

function resolveFeasibilityHours(deStore) {
  const p1Percent = getFeasibilityPercentage("Phase1", "YES");
  const p2Percent = getFeasibilityPercentage("Phase2", "YES");

  return {
    phase1: (deStore.phase1 * p1Percent) / 100,
    phase2: (deStore.phase2 * p2Percent) / 100,
  };
}






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

// Initialize CAE totals Hours(used ONLY for final TOTAL row)
let caeTotalPhase1 = 0;
let caeTotalPhase2 = 0;
let caeTotalAll = 0;

// Initialize CAE totals Cost (used ONLY for final TOTAL row)
let caeTotalCostPhase1 = 0;
let caeTotalCostPhase2 = 0;
let caeTotalCostAll = 0;

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
     ✅ CAE TOTAL hours ACCUMULATION (CRITICAL FIX)
     ====================================================== */
  caeTotalPhase1 += phase1Hours;
  caeTotalPhase2 += phase2Hours;
  caeTotalAll += totalHours;

  const org = getOrgValue(roleKey, customerProductData);

  /* ======================================================
     ✅ CAE TOTAL Cost ACCUMULATION (CRITICAL FIX)
     ====================================================== */
const phase1Cost = calculateCost1(phase1Hours, org, "Phase 1");
const phase2Cost = calculateCost1(phase2Hours, org, "Phase 2");

caeTotalCostPhase1 += phase1Cost;
caeTotalCostPhase2 += phase2Cost;
caeTotalCostAll += phase1Cost + phase2Cost;


  return {
    ...row,
    org,
    phase1: {
      ...row.phase1,
      hours: phase1Hours,
      cost: phase1Cost
    },
    phase2: {
      ...row.phase2,
      hours: phase2Hours,
      cost: phase2Cost,
    },
    total: {
      ...row.total,
      hours: totalHours,
      cost: phase1Cost + phase2Cost
    },
  };
});

/* ======================================================
   FINAL TOTAL ROW – CAE (rows2)
   ====================================================== */

updatedRows2.push({
  role: "TOTAL",
  org: "CAE Total" ,

  phase1: {
    ...template.rows2[0].phase1,
    hours: +caeTotalPhase1.toFixed(2),
    cost: +caeTotalCostPhase1.toFixed(2),
  },

  phase2: {
    ...template.rows2[0].phase2,
    hours: +caeTotalPhase2.toFixed(2),
    cost: +caeTotalCostPhase2.toFixed(2),
  },

  total: {
    ...template.rows2[0].total,
    hours: +caeTotalAll.toFixed(2),
    cost: +caeTotalCostAll.toFixed(2),
  },
});



  //===================================Thermal Safty==============================================
// ===========================
// INITIAL TOTAL HOLDERS (THERMAL)
// ===========================
let thermalTotalPhase1 = 0;
let thermalTotalPhase2 = 0;
let thermalTotalAll = 0;

let thermalTotalCostPhase1 = 0;
let thermalTotalCostPhase2 = 0;
let thermalTotalCostAll = 0;

// ===========================
// MAIN ROW PROCESSING (rows3)
// ===========================
const updatedRows3 = template.rows3.map((row) => {
  const roleKey = row.role;

  let phase1Hours = 0;
  let phase2Hours = 0;

  /* ======================================================
     THERMAL ACTIVITY ROW
     ====================================================== */
  if (roleKey === "Thermals Activities") {
    // 🔹 Dummy values (replace later with real logic)
    phase1Hours = 24;
    phase2Hours = 16;
  } else {
    return row;
  }

  /* ======================================================
     COMMON ROUNDING
     ====================================================== */
  phase1Hours = +phase1Hours.toFixed(2);
  phase2Hours = +phase2Hours.toFixed(2);
  const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

  /* ======================================================
     ACCUMULATE HOURS
     ====================================================== */
  thermalTotalPhase1 += phase1Hours;
  thermalTotalPhase2 += phase2Hours;
  thermalTotalAll += totalHours;

  /* ======================================================
     COST CALCULATION (ONLY HERE)
     ====================================================== */
  const org = getOrgValue(roleKey, customerProductData);

  const phase1Cost = calculateCost1(phase1Hours, org, "Phase 1");
  const phase2Cost = calculateCost1(phase2Hours, org, "Phase 2");

  /* ======================================================
     ACCUMULATE COSTS
     ====================================================== */
  thermalTotalCostPhase1 += phase1Cost;
  thermalTotalCostPhase2 += phase2Cost;
  thermalTotalCostAll += phase1Cost + phase2Cost;

  /* ======================================================
     RETURN UPDATED ROW
     ====================================================== */
  return {
    ...row,
    org,
    phase1: {
      ...row.phase1,
      hours: phase1Hours,
      cost: phase1Cost,
    },
    phase2: {
      ...row.phase2,
      hours: phase2Hours,
      cost: phase2Cost,
    },
    total: {
      ...row.total,
      hours: totalHours,
      cost: +(phase1Cost + phase2Cost).toFixed(2),
    },
  };
});

// ===========================
// FINAL TOTAL ROW – THERMAL
//  NO calculateCost here  and Pushing final Value in Total row
// ===========================
updatedRows3.push({
  role: "TOTAL",
  org: "Thermals Total",

  phase1: {
    ...template.rows3[0].phase1,
    hours: +thermalTotalPhase1.toFixed(2),
    cost: +thermalTotalCostPhase1.toFixed(2),
  },

  phase2: {
    ...template.rows3[0].phase2,
    hours: +thermalTotalPhase2.toFixed(2),
    cost: +thermalTotalCostPhase2.toFixed(2),
  },

  total: {
    ...template.rows3[0].total,
    hours: +thermalTotalAll.toFixed(2),
    cost: +thermalTotalCostAll.toFixed(2),
  },
});

  //=================================== PS ==============================================
// ===========================
// INITIAL TOTAL HOLDERS (PS / SAFETY)
// ===========================
let safetyTotalPhase1 = 0;
let safetyTotalPhase2 = 0;
let safetyTotalAll = 0;

let safetyTotalCostPhase1 = 0;
let safetyTotalCostPhase2 = 0;
let safetyTotalCostAll = 0;

// ===========================
// MAIN ROW PROCESSING (rows4)
// ===========================
const updatedRows4 = template.rows4.map((row) => {
  const roleKey = row.role;

  let phase1Hours = 0;
  let phase2Hours = 0;

  /* ======================================================
     SAFETY ACTIVITY ROW
     ====================================================== */
  if (roleKey === "P. Safety Standard & Leader act") {
    phase1Hours = Number(sharedRef?.currentPS?.protoTotal ?? 0);
    phase2Hours = Number(sharedRef?.currentPS?.serieTotal ?? 0);
  } else {
    return row;
  }

  /* ======================================================
     COMMON ROUNDING
     ====================================================== */
  phase1Hours = +phase1Hours.toFixed(2);
  phase2Hours = +phase2Hours.toFixed(2);
  const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

  /* ======================================================
     ACCUMULATE HOURS
     ====================================================== */
  safetyTotalPhase1 += phase1Hours;
  safetyTotalPhase2 += phase2Hours;
  safetyTotalAll += totalHours;

  /* ======================================================
     COST CALCULATION (ONLY HERE)
     ====================================================== */
  const org = getOrgValue(roleKey, customerProductData);

  const phase1Cost = calculateCost1(phase1Hours, org, "Phase 1");
  const phase2Cost = calculateCost1(phase2Hours, org, "Phase 2");

  /* ======================================================
     ACCUMULATE COSTS
     ====================================================== */
  safetyTotalCostPhase1 += phase1Cost;
  safetyTotalCostPhase2 += phase2Cost;
  safetyTotalCostAll += phase1Cost + phase2Cost;

  /* ======================================================
     RETURN UPDATED ROW
     ====================================================== */
  return {
    ...row,
    org,
    phase1: {
      ...row.phase1,
      hours: phase1Hours,
      cost: phase1Cost,
    },
    phase2: {
      ...row.phase2,
      hours: phase2Hours,
      cost: phase2Cost,
    },
    total: {
      ...row.total,
      hours: totalHours,
      cost: +(phase1Cost + phase2Cost).toFixed(2),
    },
  };
});

// ===========================
// FINAL TOTAL ROW – PS / SAFETY
// NO calculateCost here  and Pushing final Value in Total row
// ===========================
updatedRows4.push({
  role: "TOTAL",
  org: "PS Total",

  phase1: {
    ...template.rows4[0].phase1,
    hours: +safetyTotalPhase1.toFixed(2),
    cost: +safetyTotalCostPhase1.toFixed(2),
  },

  phase2: {
    ...template.rows4[0].phase2,
    hours: +safetyTotalPhase2.toFixed(2),
    cost: +safetyTotalCostPhase2.toFixed(2),
  },

  total: {
    ...template.rows4[0].total,
    hours: +safetyTotalAll.toFixed(2),
    cost: +safetyTotalCostAll.toFixed(2),
  },
});

  //=================================== Other ==============================================
  
// ===========================
// TOTAL HOLDERS – EXPENSES
// ===========================


//---Start : Data Fetch From Additional Hours of Travel , Licenses, Material-----
const { otherExpenses } = additionalOthersHoursAndCostPayload;
// Destructure individual categories
const { Travels, "Licenses (CAD)": LicensesCAD, Materials } = otherExpenses;

// Destructure phases for Travels
const {
  phase0: TravelsPhase0,
  phase1: TravelsPhase1,
  phase2: TravelsPhase2,
  phase34: TravelsPhase34
} = Travels;

// Destructure phases for Licenses
const {
  phase0: LicensesPhase0,
  phase1: LicensesPhase1,
  phase2: LicensesPhase2,
  phase34: LicensesPhase34
} = LicensesCAD;

// Destructure phases for Materials
const {
  phase0: MaterialsPhase0,
  phase1: MaterialsPhase1,
  phase2: MaterialsPhase2,
  phase34: MaterialsPhase34
} = Materials;

// Example: Access hours and cost
console.log(TravelsPhase0.hours, TravelsPhase0.cost);      // 19, 24
console.log(LicensesPhase2.hours, LicensesPhase2.cost);    // 56, 37
console.log(MaterialsPhase34.hours, MaterialsPhase34.cost);// 34, 56
//---E : Data Fetch From Additional Hours of Travel , Licenses, Material-----

let expenseTotalPhase0 = 0;
let expenseTotalPhase1 = 0;
let expenseTotalPhase2 = 0;
let expenseTotalPhase34 = 0;
let expenseTotalAll = 0;

let expenseTotalCostPhase0 = 0;
let expenseTotalCostPhase1 = 0;
let expenseTotalCostPhase2 = 0;
let expenseTotalCostPhase34 = 0;
let expenseTotalCostAll = 0;

// ===========================
// MAIN ROW PROCESSING
// ===========================
const updatedRows5 = template.rows5.map((row) => {
  const categoryKey = row.category;

  let phase0Hours = 0;
  let phase1Hours = 0;
  let phase2Hours = 0;
  let phase34Hours = 0;

  let phase0Cost = 0;
  let phase1Cost = 0;
  let phase2Cost = 0;
  let phase34Cost = 0;

  /* ======================================================
     HOURS LOGIC (HARDCODED FOR NOW)
     ====================================================== */


  if (categoryKey === "Travels") {
    phase0Hours = 5;    // ✅ Hard-coded costs . later we will get from UI
    phase1Hours = 10;   // ✅ Hard-coded costs . later we will get from UI
    phase2Hours = 6;   // ✅ Hard-coded costs . later we will get from UI
    phase34Hours = 4;   // ✅ Hard-coded costs . later we will get from UI
  } 
  else if (categoryKey === "Licenses (CAD)") {
    phase0Hours = 2;     // ✅ Hard-coded costs . later we will get from UI
    phase1Hours = 8;    // ✅ Hard-coded costs . later we will get from UI
    phase2Hours = 3;      // ✅ Hard-coded costs . later we will get from UI
    phase34Hours = 1;    // ✅ Hard-coded costs . later we will get from UI
  } 
  else if (categoryKey === "Materials") {
    phase0Hours = 1;       // ✅ Hard-coded costs . later we will get from UI
    phase1Hours = 2;          // ✅ Hard-coded costs . later we will get from UI
    phase2Hours = 3;             // ✅ Hard-coded costs . later we will get from UI
    phase34Hours = 4;         // ✅ Hard-coded costs . later we will get from UI
  } 
  else {
    return row;s
  }

  /* ======================================================
     ROUNDING + TOTAL HOURS
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

  /* ======================================================
     COST LOGIC (CATEGORY-WISE)
     ====================================================== */
  if (categoryKey === "Travels") {
    // ❌ NO method call
    // ✅ Hard-coded costs . later we will get from UI
    // no standard rates here . 
    // user Input Cost will be considered
    phase0Cost = 500;
    phase1Cost = 1000;
    phase2Cost = 700;
    phase34Cost = 300;
  }

  else if (categoryKey === "Licenses (CAD)") {

const updatedRows_lastRow = updatedRows[updatedRows.length - 1];

    // ⚠️ Cost hours come from CAD calculation, NOT expense hours
// alert("updatedRows : "+JSON.stringify(updatedRows_lastRow))
 //   alert("phase0:"+updatedRows_lastRow?.phase0?.hours +" phase1:"+updatedRows_lastRow?.phase1?.hours +
    //   " phase2:"+updatedRows_lastRow?.phase2?.hours +" phase34:"+updatedRows_lastRow?.phase34?.hours 
    //  )

    const cadPhase0Hours = updatedRows_lastRow?.phase0?.hours ?? 0;
    const cadPhase1Hours = updatedRows_lastRow?.phase1?.hours ?? 0;
    const cadPhase2Hours = updatedRows_lastRow?.phase2?.hours ?? 0;
    const cadPhase34Hours = updatedRows_lastRow?.phase34?.hours ?? 0;

    phase0Cost = cadPhase0Hours * 3.06
    phase1Cost =   cadPhase1Hours * 3.06
    phase2Cost =  cadPhase2Hours * 3.06
    phase34Cost = cadPhase34Hours * 3.06
  }

  else if (categoryKey === "Materials") {
    // ✅ Method call
    
    phase0Cost = calculateMaterialCost(phase0Hours, "phase0");
    phase1Cost = calculateMaterialCost(phase1Hours, "phase1");
    phase2Cost = calculateMaterialCost(phase2Hours, "phase2");
    phase34Cost = calculateMaterialCost(phase34Hours, "phase34");
  }

  phase0Cost = +phase0Cost.toFixed(2);
  phase1Cost = +phase1Cost.toFixed(2);
  phase2Cost = +phase2Cost.toFixed(2);
  phase34Cost = +phase34Cost.toFixed(2);

  const totalCost = +(
    phase0Cost +
    phase1Cost +
    phase2Cost +
    phase34Cost
  ).toFixed(2);

  /* ======================================================
     ACCUMULATE TOTALS
     ====================================================== */
  expenseTotalPhase0 += phase0Hours;
  expenseTotalPhase1 += phase1Hours;
  expenseTotalPhase2 += phase2Hours;
  expenseTotalPhase34 += phase34Hours;
  expenseTotalAll += totalHours;

  expenseTotalCostPhase0 += phase0Cost;
  expenseTotalCostPhase1 += phase1Cost;
  expenseTotalCostPhase2 += phase2Cost;
  expenseTotalCostPhase34 += phase34Cost;
  expenseTotalCostAll += totalCost;

  /* ======================================================
     RETURN UPDATED ROW
     ====================================================== */
  return {
    ...row,
    org :categoryKey , // Seetting name in Design column : Travels , Licenses (CAD) ,Materials
    phase0: { ...row.phase0, hours: phase0Hours, cost: phase0Cost },
    phase1: { ...row.phase1, hours: phase1Hours, cost: phase1Cost },
    phase2: { ...row.phase2, hours: phase2Hours, cost: phase2Cost },
    phase34: { ...row.phase34, hours: phase34Hours, cost: phase34Cost },
    total: { ...row.total, hours: totalHours, cost: totalCost },
  };
});


updatedRows5.push({
  category: "Other Total",
    org :"Other Total" ,
  phase0: {
    ...template.rows5[0].phase0,
    hours: +expenseTotalPhase0.toFixed(2),
    cost: +expenseTotalCostPhase0.toFixed(2),
  },

  phase1: {
    ...template.rows5[0].phase1,
    hours: +expenseTotalPhase1.toFixed(2),
    cost: +expenseTotalCostPhase1.toFixed(2),
  },

  phase2: {
    ...template.rows5[0].phase2,
    hours: +expenseTotalPhase2.toFixed(2),
    cost: +expenseTotalCostPhase2.toFixed(2),
  },

  phase34: {
    ...template.rows5[0].phase34,
    hours: +expenseTotalPhase34.toFixed(2),
    cost: +expenseTotalCostPhase34.toFixed(2),
  },

  total: {
    ...template.rows5[0].total,
    hours: +expenseTotalAll.toFixed(2),
    cost: +expenseTotalCostAll.toFixed(2),
  },
});


function calculateMaterialCost(hours) {
  const MATERIAL_RATE = 16;
  return +(hours * MATERIAL_RATE).toFixed(2);
}

  //=================================== Budget ==============================================
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
    if (categoryKey === "Budget") {
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
      org: "Budget",   // Setting title in Design column
      phase0: {
        ...row.phase0,
        hours: phase0Hours,
        cost: calculateCost(phase0Hours, "Unknow_CostCenter"),   // here "BUDGET" is not 
      },
      phase1: {
        ...row.phase1,
        hours: phase1Hours,
        cost: calculateCost(phase1Hours, "Unknow_CostCenter" ),
      },
      phase2: {
        ...row.phase2,
        hours: phase2Hours,
        cost: calculateCost(phase2Hours, "Unknow_CostCenter" ),
      },
      phase34: {
        ...row.phase34,
        hours: phase34Hours,
        cost: calculateCost(phase34Hours, "Unknow_CostCenter"   ),
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: calculateCost(totalHours, "Unknow_CostCenter"  ),
      },
    };
  });

  /* ======================================================
   FINAL TOTAL ROW – BUDGET (rows6)
   ====================================================== */
  updatedRows6.push({
    category: "TOTAL",
    org: "Budget Total",   // Setting title in Design column
    phase0: {
      ...template.rows6[0].phase0,
      hours: +budgetTotalPhase0.toFixed(2),
      cost: calculateCost(+budgetTotalPhase0.toFixed(2), "Unknow_CostCenter"   ),
    },
    phase1: {
      ...template.rows6[0].phase1,
      hours: +budgetTotalPhase1.toFixed(2),
      cost: calculateCost(+budgetTotalPhase1.toFixed(2), "Unknow_CostCenter"  ),
    },
    phase2: {
      ...template.rows6[0].phase2,
      hours: +budgetTotalPhase2.toFixed(2),
      cost: calculateCost(+budgetTotalPhase2.toFixed(2), "Unknow_CostCenter" ),
    },
    phase34: {
      ...template.rows6[0].phase34,
      hours: +budgetTotalPhase34.toFixed(2),
      cost: calculateCost(+budgetTotalPhase34.toFixed(2), "Unknow_CostCenter"  ),
    },
    total: {
      ...template.rows6[0].total,
      hours: +budgetTotalAll.toFixed(2),
      cost: calculateCost(+budgetTotalAll.toFixed(2), "Unknow_CostCenter" ),
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
  // alert(`Org: ${org}\nPhase1: ${totals.phase1}\nPhase2: ${totals.phase2}\nTotal: ${totals.total}\nRoles: ${totals.roles.join(", ")}`);
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

