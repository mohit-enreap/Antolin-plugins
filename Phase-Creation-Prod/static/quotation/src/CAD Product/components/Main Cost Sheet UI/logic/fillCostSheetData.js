import { reworkPercent } from "../../../data/Rework/reworkPercentage";
import { getFeasibilityPercentage } from "../../../utils/FeasibilityUtils";
import { ORG_SOURCE_BY_ROLE } from "../Data/CostCenterMappingUtil";

import { getOrgValue } from "../Data/CostCenterMappingUtil";

import {
  calculateCost1,
  getCostRateByOrgNewPayload,
} from "../Data/COST_RATE_BY_ORGUtil";

import { sharedRef } from "../../../../shared/sharedStore";
import { jsxs } from "react/jsx-runtime";

// 3D role rows
const ROLE_ROWS = ["TDL", , "COO", "DE"];
const HCC_BCC_ROLE_ROW = ["Technical Design Leader Combined"];

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
  additionalOthersHoursAndCostPayload,
  CECO_COST_SHEET_YearANDPhases,
  FEASIBILITY,
) {
  //===============================CAD===============================

  // ===========================
  // TOTAL HOLDERS
  // ===========================
  const deStore = { phase0: 0, phase1: 0, phase2: 0, phase34: 0 };

  // for Total appering in last row we require this varaible
  let totalPhase0 = 0;
  let totalPhase1 = 0;
  let totalPhase2 = 0;
  let totalPhase34 = 0;
  let totalAll = 0;

  // for Total appering in last column(right righ side)  we require this varaible
  let totalCostPhase0 = 0;
  let totalCostPhase1 = 0;
  let totalCostPhase2 = 0;
  let totalCostPhase34 = 0;
  let totalCostAll = 0;

  // ===========================
  // MAIN ROW PROCESSING : CAD
  // ===========================
  const updatedRows = template.rows.map((row) => {
    const roleKey = row.role;

    let resolved = null;
    // alert("Role :: "+roleKey )
    //for 3d Roles
    if (ROLE_ROWS.includes(roleKey)) {
      resolved = resolve3DRoleHours(roleKey, totals, deStore);
      if (roleKey === "TDL" || roleKey === "DE" || roleKey === "COO") {
        // alert(roleKey+" : resolved :: "+JSON.stringify(resolved))
      }
    } else if (HCC_BCC_ROLE_ROW.includes(roleKey)) {
      resolved = resolve3DRoleHoursForHCC_BCC(roleKey, totals, deStore);
      if (roleKey === "Technical Design Leader Combined") {
        //  alert(roleKey+" : resolved :: "+JSON.stringify(resolved))
      }
    }
    //for 2d Roles
    else if (ACTIVITY_ROWS.includes(roleKey)) {
      resolved = resolveActivityHours(roleKey, totals, roleMapping);
    }
    //Removed As per Request
    // else if (roleKey === "Rework") {
    //   resolved = resolveReworkHours(deStore, reworkPercent);
    // }
    else if (roleKey === "Feasibility") {
      resolved = resolveFeasibilityHours(deStore, FEASIBILITY);
    } else {
      return row;
    }

    if (!resolved) return row;

    /* ======================================================
     COMMON ROUNDING for hours
     ====================================================== */
    const phase0Hours = +resolved.phase0.toFixed(2);
    const phase1Hours = +resolved.phase1.toFixed(2);
    const phase2Hours = +resolved.phase2.toFixed(2);
    const phase34Hours = +resolved.phase34.toFixed(2);
    //const totalHours = +(phase1Hours + phase2Hours).toFixed(2);

    //change on 12th march (Final Total Hours on right Right for row)
    const totalHours = +(
      phase0Hours +
      phase1Hours +
      phase2Hours +
      phase34Hours
    ).toFixed(2);

    /* ======================================================
     ACCUMULATE HOURS
     ====================================================== */
    totalPhase0 += phase0Hours; // for last row Total(Down) for phase 0
    totalPhase1 += phase1Hours; // for last row Total(Down) for phase 1
    totalPhase2 += phase2Hours; // for last row Total(Down) for phase 2
    totalPhase34 += phase34Hours; // for last row Total(Down) for phase 34
    // Final Total Hours on right Right for row
    totalAll += totalHours;

    /* ======================================================
     COST CALCULATION
     ====================================================== */
    const org = getOrgValue(roleKey, customerProductData);

    const phase0Cost = calculateCost1(
      phase0Hours,
      org,
      "phase_0",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase1Cost = calculateCost1(
      phase1Hours,
      org,
      "phase_1",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase2Cost = calculateCost1(
      phase2Hours,
      org,
      "phase_2",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase34Cost = calculateCost1(
      phase34Hours,
      org,
      "phase_3_4",
      CECO_COST_SHEET_YearANDPhases,
    );
    //Aggregating cost in phases
    totalCostPhase0 += phase0Cost;
    totalCostPhase1 += phase1Cost;
    totalCostPhase2 += phase2Cost;
    totalCostPhase34 += phase34Cost;
    // Final Total Cost on right Right for row ()
    totalCostAll += phase0Cost + phase1Cost + phase2Cost + phase34Cost;

    /* ======================================================
     RETURN UPDATED ROW
     ====================================================== */
    return {
      ...row,
      org,
      phase0: { ...row.phase0, hours: phase0Hours, cost: phase0Cost },
      phase1: { ...row.phase1, hours: phase1Hours, cost: phase1Cost },
      phase2: { ...row.phase2, hours: phase2Hours, cost: phase2Cost },
      phase34: { ...row.phase1, hours: phase34Hours, cost: phase34Cost },
      total: {
        ...row.total,
        hours: totalHours.toFixed(2),
        cost: +(phase0Cost + phase1Cost + phase2Cost + phase34Cost).toFixed(2),
      },
    };
  });

  //Adding another row using push Function
  updatedRows.push({
    role: "TOTAL",
    org: "CAD Total",

    phase0: {
      ...template.rows[0].phase0,
      hours: +totalPhase0.toFixed(2),
      cost: +totalCostPhase0.toFixed(2),
    },

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

    phase34: {
      ...template.rows[0].phase0,
      hours: +totalPhase34.toFixed(2),
      cost: +totalCostPhase34.toFixed(2),
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
    // Fetch the first aggregated 3D record from totals
    const data = totals["3D"]?.[0]; // related to HCC (i.e TDL)

    // If no 3D data is available, stop processing
    if (!data) return null;

    const phase0 = Number(data[`offer${roleKey}`] ?? 0);
    const phase1 = Number(data[`proto${roleKey}`] ?? 0);
    const phase2 = Number(data[`serie${roleKey}`] ?? 0);
    const phase34 = Number(data[`indus${roleKey}`] ?? 0);

    if (roleKey === "DE") {
      deStore.phase0 = phase0;
      deStore.phase1 = phase1;
      deStore.phase2 = phase2;
      deStore.phase34 = phase34;
    }

    return { phase0, phase1, phase2, phase34 };
  }

  function resolve3DRoleHoursForHCC_BCC(roleKey, totals, deStore) {
    // Fetch the first aggregated 3D record from totals
    const data = totals["3D"]?.[1]; // related to BCC (i.e Technical Design Leader Combined)

    // alert("Data: "+JSON.stringify(data))
    // If no 3D data is available, stop processing
    if (!data) return null;

    // hard coding  offerTDL , protoTDL  , serieTDL indusTDL  because We have to Take Data
    // From our second role of "3d" . in Second role i store data related to bcc
    // and first role data store related to HCC
    const phase0 = Number(data[`offerTDL`] ?? 0);
    const phase1 = Number(data[`protoTDL`] ?? 0);
    const phase2 = Number(data[`serieTDL`] ?? 0);
    const phase34 = Number(data[`indusTDL`] ?? 0);

    if (roleKey === "DE") {
      deStore.phase0 = phase0;
      deStore.phase1 = phase1;
      deStore.phase2 = phase2;
      deStore.phase34 = phase34;
    }

    //alert("Set Data: "+phase0+":"+ phase1+":"+  phase2 +":"+ phase34 )
    return { phase0, phase1, phase2, phase34 };
  }

  function resolveActivityHours(roleKey, totals, roleMapping) {
    const source = roleMapping[roleKey];
    const data = totals[source]?.[0];
    if (!data) return null;

    return {
      phase0: Number(data.offerTotal ?? 0),
      phase1: Number(data.protoTotal ?? 0),
      phase2: Number(data.serieTotal ?? 0),
      phase34: Number(data.indusTotal ?? 0),
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

  function resolveFeasibilityHours(deStore, FEASIBILITY) {
    const p0Percent = getFeasibilityPercentage("Phase0", FEASIBILITY);
    const p1Percent = getFeasibilityPercentage("Phase1", FEASIBILITY);
    const p2Percent = getFeasibilityPercentage("Phase2", FEASIBILITY);
    const p34Percent = getFeasibilityPercentage("Phase3_4", FEASIBILITY);

    return {
      phase0: (deStore.phase0 * p0Percent) / 100,
      phase1: (deStore.phase1 * p1Percent) / 100,
      phase2: (deStore.phase2 * p2Percent) / 100,
      phase34: (deStore.phase34 * p34Percent) / 100,
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

  //==get Phase info from Seleted acvtive phases start======
  // in Cad I did the Phases selection in calculation because it wont require shared data
  //But for CAE , PS, Thermal Safty  this logic can be use  as Phase detail coming from CAD
  const { phase0flag, phase1flag, phase2flag, phase34flag } =
    sharedRef.phaseflagShared;

  const { phase0Week, phase1Week, phase2Week, phase34Week } =
    sharedRef.phaseWeeksShared;

  //alert("in fill sheet =>"+ phase0flag  +"phase0Week :"+phase0Week)

  // Phase multiplier logic:
  // - Phase must be explicitly selected (flag === true)
  // - Phase must have weeks > 0
  // - If any condition fails, multiplier becomes 0 (no cost calculation)

  const phaseMultiplier = {
    // Phase 0: cost applies only if phase0 is selected AND weeks > 0
    phase0: phase0flag === true && phase0Week > 0 ? 1 : 0,

    // Phase 1: cost applies only if phase1 is selected AND weeks > 0
    phase1: phase1flag === true && phase1Week > 0 ? 1 : 0,

    // Phase 2: cost applies only if phase2 is selected AND weeks > 0
    phase2: phase2flag === true && phase2Week > 0 ? 1 : 0,

    // Phase 3–4: cost applies only if phase3–4 is selected AND weeks > 0
    phase34: phase34flag === true && phase34Week > 0 ? 1 : 0,
  };

  // alert("==>"+JSON.stringify(phaseMultiplier))

  //==get Phase info from Seleted acvtive phases End======

  // Initialize CAE totals Hours(used ONLY for final TOTAL row)
  let caeTotalPhase0 = 0;
  let caeTotalPhase1 = 0;
  let caeTotalPhase2 = 0;
  let caeTotalPhase34 = 0;
  let caeTotalAll = 0;

  // Initialize CAE totals Cost (used ONLY for final TOTAL row)
  let caeTotalCostPhase0 = 0;
  let caeTotalCostPhase1 = 0;
  let caeTotalCostPhase2 = 0;
  let caeTotalCostPhase34 = 0;
  let caeTotalCostAll = 0;

  const updatedRows2 = template.rows2.map((row) => {
    const roleKey = row.role;
    let phase0Hours = 0;
    let phase1Hours = 0;
    let phase2Hours = 0;
    let phase34Hours = 0;

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
      // phase1Hours = Number(sharedRef?.currentCAE?.CAEEngineersPhase1 ?? 0);
      // phase2Hours = Number(sharedRef?.currentCAE?.CAEEngineersPhase2 ?? 0);

      // No offer phase as per excel
      phase0Hours = 0 * phaseMultiplier.phase0;
      phase1Hours =
        Number(sharedRef?.currentCAE?.CAEEngineersPhase1 ?? 0) *
        phaseMultiplier.phase1;
      phase2Hours =
        Number(sharedRef?.currentCAE?.CAEEngineersPhase2 ?? 0) *
        phaseMultiplier.phase2;
      // No Industrilization phase as per excel
      phase34Hours = 0 * phaseMultiplier.phase34;

      if (phase1Hours === 0 && phase2Hours === 0) {
        // alert("CAE Engineer hours are missing or not calculated yet.");
      }
    } else if (roleKey === "CAE Standard Work") {
      // No offer phase as per excel
      phase0Hours = 0 * phaseMultiplier.phase0;

      phase1Hours =
        Number(sharedRef?.currentCAE?.CAEStandardWorkPhase1 ?? 0) *
        phaseMultiplier.phase1;
      phase2Hours =
        Number(sharedRef?.currentCAE?.CAEStandardWorkPhase2 ?? 0) *
        phaseMultiplier.phase2;

      phase34Hours = 0 * phaseMultiplier.phase34;

      if (phase1Hours === 0 && phase2Hours === 0) {
        // alert("CAE Standard Work hours are missing or not calculated yet.");
      }
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

    /* ======================================================
     ✅ CAE TOTAL hours ACCUMULATION (CRITICAL FIX)
     ====================================================== */
    caeTotalPhase0 += phase0Hours;

    caeTotalPhase1 += phase1Hours;
    caeTotalPhase2 += phase2Hours;

    caeTotalPhase34 += phase34Hours;
    caeTotalAll += totalHours;

    const org = getOrgValue(roleKey, customerProductData);

    /* ======================================================
     ✅ CAE TOTAL Cost ACCUMULATION (CRITICAL FIX)
     ====================================================== */
    const phase0Cost = calculateCost1(
      phase0Hours,
      org,
      "phase_0",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase1Cost = calculateCost1(
      phase1Hours,
      org,
      "phase_1",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase2Cost = calculateCost1(
      phase2Hours,
      org,
      "phase_2",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase34Cost = calculateCost1(
      phase34Hours,
      org,
      "phase_3_4",
      CECO_COST_SHEET_YearANDPhases,
    );

    caeTotalCostPhase0 += phase0Cost;

    caeTotalCostPhase1 += phase1Cost;
    caeTotalCostPhase2 += phase2Cost;
    caeTotalCostPhase34 += phase34Cost;
    caeTotalCostAll += phase0Cost + phase1Cost + phase2Cost + phase34Cost;
    //   alert(` ==2=== \n
    // Phase 1 Hours: ${phase1Hours}
    // Phase 2 Hours: ${phase2Hours}

    // CAE Engineers Phase 1: ${sharedRef?.currentCAE?.CAEEngineersPhase1}
    // CAE Engineers Phase 2: ${sharedRef?.currentCAE?.CAEEngineersPhase2}

    // CAE Standard Work Phase 1: ${sharedRef?.currentCAE?.CAEStandardWorkPhase1}
    // CAE Standard Work Phase 2: ${sharedRef?.currentCAE?.CAEStandardWorkPhase2}
    // `);

    return {
      ...row,
      org,
      phase0: {
        ...row.phase0,
        hours: phase0Hours,
        cost: phase0Cost,
      },
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
      phase34: {
        ...row.phase34,
        hours: phase34Hours,
        cost: phase34Cost,
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: phase0Cost + phase1Cost + phase2Cost + phase34Cost,
      },
    };
  });

  /* ======================================================
   FINAL TOTAL ROW – CAE (rows2)
   ====================================================== */

  updatedRows2.push({
    role: "TOTAL",
    org: "CAE Total",
    phase0: {
      ...template.rows2[0].phase1,
      hours: +caeTotalPhase0.toFixed(2),
      cost: +caeTotalCostPhase0.toFixed(2),
    },

    phase1: {
      ...template.rows2[0].phase1,
      hours: +caeTotalPhase1.toFixed(2),
      cost: +caeTotalCostPhase1.toFixed(2),
    },

    phase2: {
      ...template.rows2[0].phase1,
      hours: +caeTotalPhase2.toFixed(2),
      cost: +caeTotalCostPhase2.toFixed(2),
    },
    phase34: {
      ...template.rows2[0].phase2,
      hours: +caeTotalPhase34.toFixed(2),
      cost: +caeTotalCostPhase34.toFixed(2),
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
  let thermalTotalPhase0 = 0;
  let thermalTotalPhase1 = 0;
  let thermalTotalPhase2 = 0;
  let thermalTotalPhase34 = 0;
  let thermalTotalAll = 0;

  let thermalTotalCostPhase0 = 0;
  let thermalTotalCostPhase1 = 0;
  let thermalTotalCostPhase2 = 0;
  let thermalTotalCostPhase34 = 0;
  let thermalTotalCostAll = 0;

  // ===========================
  // MAIN ROW PROCESSING (rows3)
  // ===========================
  const updatedRows3 = template.rows3.map((row) => {
    const roleKey = row.role;

    let phase0Hours = 0;
    let phase1Hours = 0;
    let phase2Hours = 0;
    let phase34Hours = 0;

    /* ======================================================
     THERMAL ACTIVITY ROW
     ====================================================== */
    if (roleKey === "Thermals Activities") {
      // 🔹 Dummy values (replace later with real logic)
      // phase0Hours = 1 * phaseMultiplier.phase0;
      // phase1Hours = 24   *  phssssaseMultiplier.phase1;;
      // phase2Hours = 16  * phaseMultiplier.phase2;;
      // phase34Hours = 0  * phaseMultiplier.phase34;;

      phase0Hours =
        Number(sharedRef?.currentTheramalSafety.TheramalSafetyOffer ?? 0) *
        Number(phaseMultiplier?.phase0 ?? 0);

      phase1Hours =
        Number(sharedRef?.currentTheramalSafety.TheramalSafetyProto ?? 0) *
        Number(phaseMultiplier?.phase1 ?? 0);

      phase2Hours =
        Number(sharedRef?.currentTheramalSafety.TheramalSafetySerie ?? 0) *
        Number(phaseMultiplier?.phase2 ?? 0);

      phase34Hours = 0 * Number(phaseMultiplier?.phase34 ?? 0);
    } else {
      return row;
    }

    /* ======================================================
     COMMON ROUNDING
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
     ACCUMULATE HOURS
     ====================================================== */

    thermalTotalPhase0 += phase0Hours;
    thermalTotalPhase1 += phase1Hours;
    thermalTotalPhase2 += phase2Hours;
    thermalTotalPhase34 += phase34Hours;
    thermalTotalAll += totalHours;

    /* ======================================================
     COST CALCULATION (ONLY HERE)
     ====================================================== */
    const org = getOrgValue(roleKey, customerProductData);

    const phase0Cost = calculateCost1(
      phase0Hours,
      org,
      "phase_0",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase1Cost = calculateCost1(
      phase1Hours,
      org,
      "phase_1",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase2Cost = calculateCost1(
      phase2Hours,
      org,
      "phase_2",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase34Cost = calculateCost1(
      phase34Hours,
      org,
      "phase_3_4",
      CECO_COST_SHEET_YearANDPhases,
    );
    /* ======================================================
     ACCUMULATE COSTS
     ====================================================== */
    thermalTotalCostPhase0 += phase0Cost;

    thermalTotalCostPhase1 += phase1Cost;
    thermalTotalCostPhase2 += phase2Cost;
    thermalTotalCostPhase34 += phase34Cost;
    thermalTotalCostAll += phase0Cost + phase1Cost + phase2Cost + phase34Cost;

    /* ======================================================
     RETURN UPDATED ROW
     ====================================================== */
    return {
      ...row,
      org,
      phase0: {
        ...row.phase0,
        hours: phase0Hours,
        cost: phase0Cost,
      },
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
      phase34: {
        ...row.phase34,
        hours: phase34Hours,
        cost: phase34Cost,
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: +(phase0Cost + phase1Cost + phase2Cost + phase34Cost).toFixed(2),
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

    phase0: {
      ...template.rows3[0].phase1,
      hours: +thermalTotalPhase0.toFixed(2),
      cost: +thermalTotalCostPhase0.toFixed(2),
    },

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

    phase34: {
      ...template.rows3[0].phase34,
      hours: +thermalTotalPhase34.toFixed(2),
      cost: +thermalTotalCostPhase34.toFixed(2),
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
  let safetyTotalPhase0 = 0;
  let safetyTotalPhase1 = 0;
  let safetyTotalPhase2 = 0;
  let safetyTotalPhase34 = 0;
  let safetyTotalAll = 0;

  let safetyTotalCostPhase0 = 0;
  let safetyTotalCostPhase1 = 0;
  let safetyTotalCostPhase2 = 0;
  let safetyTotalCostPhase34 = 0;
  let safetyTotalCostAll = 0;

  // ===========================
  // MAIN ROW PROCESSING (rows4)
  // ===========================
  const updatedRows4 = template.rows4.map((row) => {
    const roleKey = row.role;

    let phase0Hours = 0;
    let phase1Hours = 0;
    let phase2Hours = 0;
    let phase34Hours = 0;

    /* ======================================================
     SAFETY ACTIVITY ROW
     ====================================================== */
    if (roleKey === "P. Safety Standard & Leader act") {
      // No Configuration for OFfer and Industrilization as per ExCel
      phase0Hours = 0 * phaseMultiplier.phase0;
      phase1Hours =
        Number(sharedRef?.currentPS?.protoTotal ?? 0) * phaseMultiplier.phase1;
      phase2Hours =
        Number(sharedRef?.currentPS?.serieTotal ?? 0) * phaseMultiplier.phase2;
      phase34Hours = 0 * phaseMultiplier.phase34;
    } else {
      return row;
    }

    /* ======================================================
     COMMON ROUNDING
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
     ACCUMULATE HOURS
     ====================================================== */
    safetyTotalPhase0 += phase0Hours;
    safetyTotalPhase1 += phase1Hours;
    safetyTotalPhase2 += phase2Hours;
    safetyTotalPhase34 += phase34Hours;
    safetyTotalAll += totalHours;

    /* ======================================================
     COST CALCULATION (ONLY HERE)
     ====================================================== */
    const org = getOrgValue(roleKey, customerProductData);

    const phase0Cost = calculateCost1(
      phase0Hours,
      org,
      "phase_0",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase1Cost = calculateCost1(
      phase1Hours,
      org,
      "phase_1",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase2Cost = calculateCost1(
      phase2Hours,
      org,
      "phase_2",
      CECO_COST_SHEET_YearANDPhases,
    );
    const phase34Cost = calculateCost1(
      phase34Hours,
      org,
      "phase_3_4",
      CECO_COST_SHEET_YearANDPhases,
    );

    /* ======================================================
     ACCUMULATE COSTS
     ====================================================== */
    safetyTotalCostPhase0 += phase0Cost;
    safetyTotalCostPhase1 += phase1Cost;
    safetyTotalCostPhase2 += phase2Cost;
    safetyTotalCostPhase34 += phase34Cost;
    safetyTotalCostAll += phase0Cost + phase1Cost + phase2Cost + phase34Cost;

    /* ======================================================
     RETURN UPDATED ROW
     ====================================================== */
    return {
      ...row,
      org,

      phase0: {
        ...row.phase0,
        hours: phase0Hours,
        cost: phase0Cost,
      },

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

      phase34: {
        ...row.phase34,
        hours: phase34Hours,
        cost: phase34Cost,
      },
      total: {
        ...row.total,
        hours: totalHours,
        cost: +(phase0Cost + phase1Cost + phase2Cost + phase34Cost).toFixed(2),
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

    phase0: {
      ...template.rows4[0].phase1,
      hours: +safetyTotalPhase0.toFixed(2),
      cost: +safetyTotalCostPhase0.toFixed(2),
    },

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

    phase34: {
      ...template.rows4[0].phase1,
      hours: +safetyTotalPhase34.toFixed(2),
      cost: +safetyTotalCostPhase34.toFixed(2),
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
  //alert("otherExpenses : "+JSON.stringify(otherExpenses))
  // Destructure individual categories
  const { Travels, "Licenses (CAD)": LicensesCAD, Materials } = otherExpenses;

  // Destructure phases for Travels
  const {
    phase0: TravelsPhase0,
    phase1: TravelsPhase1,
    phase2: TravelsPhase2,
    phase34: TravelsPhase34,
  } = Travels;

  // Destructure phases for Licenses
  const {
    phase0: LicensesPhase0,
    phase1: LicensesPhase1,
    phase2: LicensesPhase2,
    phase34: LicensesPhase34,
  } = LicensesCAD;

  // Destructure phases for Materials
  const {
    phase0: MaterialsPhase0,
    phase1: MaterialsPhase1,
    phase2: MaterialsPhase2,
    phase34: MaterialsPhase34,
  } = Materials;

  // Example: Access hours and cost
  console.log(TravelsPhase0.hours, TravelsPhase0.cost); // 19, 24
  console.log(LicensesPhase2.hours, LicensesPhase2.cost); // 56, 37
  console.log(MaterialsPhase34.hours, MaterialsPhase34.cost); // 34, 56
  //---End : Data Fetch From Additional Hours of Travel , Licenses, Material-----

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
      phase0Hours = TravelsPhase0.hours; //  Hard-coded costs . later we will get from UI
      phase1Hours = TravelsPhase1.hours; //  Hard-coded costs . later we will get from UI
      phase2Hours = TravelsPhase2.hours; //  Hard-coded costs . later we will get from UI
      phase34Hours = TravelsPhase34.hours; //  Hard-coded costs . later we will get from UI
    } else if (categoryKey === "Licenses (CAD)") {
      phase0Hours = LicensesPhase0.hours; //  Hard-coded costs . later we will get from UI
      phase1Hours = LicensesPhase1.hours; //  Hard-coded costs . later we will get from UI
      phase2Hours = LicensesPhase2.hours; //  Hard-coded costs . later we will get from UI
      phase34Hours = LicensesPhase34.hours; //  Hard-coded costs . later we will get from UI
    } else if (categoryKey === "Materials") {
      phase0Hours = MaterialsPhase0.hours; //  Hard-coded costs . later we will get from UI
      phase1Hours = calculateMaterialCost(MaterialsPhase1.hours, "phase1"); //  Hard-coded costs . later we will get from UI
      phase2Hours = MaterialsPhase2.hours; //  Hard-coded costs . later we will get from UI
      phase34Hours = MaterialsPhase34.hours; //  Hard-coded costs . later we will get from UI
    } else {
      return row;
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
    /* ======================================================
   COST LOGIC (CATEGORY-WISE)
   ====================================================== */
    if (categoryKey === "Travels") {
      phase0Cost = Number(TravelsPhase0.cost ?? 0) || 0;
      phase1Cost = Number(TravelsPhase1.cost ?? 0) || 0;
      phase2Cost = Number(TravelsPhase2.cost ?? 0) || 0;
      phase34Cost = Number(TravelsPhase34.cost ?? 0) || 0;
    } else if (categoryKey === "Licenses (CAD)") {
      const updatedRows_lastRow = updatedRows[updatedRows.length - 1];

      const cadPhase0Hours =
        Number(updatedRows_lastRow?.phase0?.hours ?? 0) || 0;
      const cadPhase1Hours =
        Number(updatedRows_lastRow?.phase1?.hours ?? 0) || 0;
      const cadPhase2Hours =
        Number(updatedRows_lastRow?.phase2?.hours ?? 0) || 0;
      const cadPhase34Hours =
        Number(updatedRows_lastRow?.phase34?.hours ?? 0) || 0;

      phase0Cost =
        cadPhase0Hours * 3.06 + (Number(LicensesPhase0.cost ?? 0) || 0);
      phase1Cost =
        cadPhase1Hours * 3.06 + (Number(LicensesPhase1.cost ?? 0) || 0);
      phase2Cost =
        cadPhase2Hours * 3.06 + (Number(LicensesPhase2.cost ?? 0) || 0);
      phase34Cost =
        cadPhase34Hours * 3.06 + (Number(LicensesPhase34.cost ?? 0) || 0);
    } else if (categoryKey === "Materials") {
      phase0Cost = Number(MaterialsPhase0.cost ?? 0) || 0;
      phase1Cost = Number(MaterialsPhase1.cost ?? 0) || 0;
      phase2Cost = Number(MaterialsPhase2.cost ?? 0) || 0;
      phase34Cost = Number(MaterialsPhase34.cost ?? 0) || 0;

      const org = getOrgValue("CAE Engineer", customerProductData);

      const phase1CostFBasedCAE_COST_CENTER =
        Number(
          getCostRateByOrgNewPayload(
            org,
            "phase_1",
            CECO_COST_SHEET_YearANDPhases,
          ),
        ) || 0;

      phase0Cost = +(Number(phase0Cost ?? 0) || 0).toFixed(2);

      phase1Cost = +(
        (Number(MaterialsPhase1.hours ?? 0) || 0) * 12000 +
        phase1CostFBasedCAE_COST_CENTER *
          ((Number(MaterialsPhase1.hours ?? 0) || 0) * 16) +
        (Number(phase1Cost ?? 0) || 0)
      ).toFixed(2);

      phase2Cost = +(Number(phase2Cost ?? 0) || 0).toFixed(2);
      phase34Cost = +(Number(phase34Cost ?? 0) || 0).toFixed(2);
    }

    /* ================= TOTAL ================= */

    phase0Cost = +(Number(phase0Cost ?? 0) || 0).toFixed(2);
    phase1Cost = +(Number(phase1Cost ?? 0) || 0).toFixed(2);
    phase2Cost = +(Number(phase2Cost ?? 0) || 0).toFixed(2);
    phase34Cost = +(Number(phase34Cost ?? 0) || 0).toFixed(2);

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
      org: categoryKey, // Seetting name in Design column : Travels , Licenses (CAD) ,Materials
      phase0: { ...row.phase0, hours: phase0Hours, cost: phase0Cost },
      phase1: { ...row.phase1, hours: phase1Hours, cost: phase1Cost },
      phase2: { ...row.phase2, hours: phase2Hours, cost: phase2Cost },
      phase34: { ...row.phase34, hours: phase34Hours, cost: phase34Cost },
      total: { ...row.total, hours: totalHours, cost: totalCost },
    };
  });

  updatedRows5.push({
    category: "Other Total",
    org: "Other Total",
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
    const MATERIAL_RATE = 16; // Constany used in OHS
    return +(hours * MATERIAL_RATE).toFixed(2);
  }

  //=================================== Budget ==============================================
  //=================================== Budget ==============================================

  // =====================================
  // STEP 1: Declare totals for rows6
  // =====================================
  let budgetTotalPhase0 = 0;
  let budgetTotalPhase1 = 0;
  let budgetTotalPhase2 = 0;
  let budgetTotalPhase34 = 0;
  let budgetTotalAll = 0;

  let budgetCostPhase0 = 0;
  let budgetCostPhase1 = 0;
  let budgetCostPhase2 = 0;
  let budgetCostPhase34 = 0;
  let budgetCostAll = 0;

  // =====================================
  // STEP 2: Combine all rows
  // =====================================
  const budgetAllRowsCombined = [
    ...updatedRows, // CAD
    ...updatedRows2, // CAE
    ...updatedRows3, // Thermal
    ...updatedRows4, // PS
    ...updatedRows5, // Others
  ];

  //alert("updatedRows5 : "+ JSON.stringify(updatedRows5[3]))
  // =====================================
  // STEP 3: Aggregation Function
  // =====================================
  function aggregateBudgetAllPhases(allRows) {
    const totals = {
      phase0: { hours: 0, cost: 0 },
      phase1: { hours: 0, cost: 0 },
      phase2: { hours: 0, cost: 0 },
      phase34: { hours: 0, cost: 0 },
      total: { hours: 0, cost: 0 },
    };

    allRows.forEach((row) => {
      //  Skip ALL types of total rows
      if (
        row.role === "TOTAL" ||
        row.category === "TOTAL" ||
        row.category?.toLowerCase().includes("total")
      ) {
        return;
      }

      totals.phase0.hours += Number(row.phase0?.hours ?? 0);
      totals.phase0.cost += Number(row.phase0?.cost ?? 0);

      totals.phase1.hours += Number(row.phase1?.hours ?? 0);
      totals.phase1.cost += Number(row.phase1?.cost ?? 0);

      totals.phase2.hours += Number(row.phase2?.hours ?? 0);
      totals.phase2.cost += Number(row.phase2?.cost ?? 0);

      totals.phase34.hours += Number(row.phase34?.hours ?? 0);
      totals.phase34.cost += Number(row.phase34?.cost ?? 0);

      totals.total.hours += Number(row.total?.hours ?? 0);
      totals.total.cost += Number(row.total?.cost ?? 0);
    });

    return totals;
  }

  // =====================================
  // STEP 4: Compute totals ONCE (Performance fix)
  // =====================================
  const budgetTotals = aggregateBudgetAllPhases(budgetAllRowsCombined);

  // =====================================
  // STEP 5: Create updatedRows6
  // =====================================
  const updatedRows6 = template.rows6.map((row) => {
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
     BUDGET ROW
     ====================================================== */
    if (categoryKey === "Budget") {
      //  HOURS
      phase0Hours = budgetTotals?.phase0?.hours || 0;
      phase1Hours = budgetTotals?.phase1?.hours || 0;
      phase2Hours = budgetTotals?.phase2?.hours || 0;
      phase34Hours = budgetTotals?.phase34?.hours || 0;

      //  COST (no recalculation)
      phase0Cost = budgetTotals?.phase0?.cost || 0;
      phase1Cost = budgetTotals?.phase1?.cost || 0;
      phase2Cost = budgetTotals?.phase2?.cost || 0;
      phase34Cost = budgetTotals?.phase34?.cost || 0;
    } else {
      return row;
    }

    /* ======================================================
     ROUNDING
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

    const totalCost = +(
      phase0Cost +
      phase1Cost +
      phase2Cost +
      phase34Cost
    ).toFixed(2);

    /* ======================================================
     ACCUMULATE TOTALS
     ====================================================== */
    budgetTotalPhase0 += phase0Hours;
    budgetTotalPhase1 += phase1Hours;
    budgetTotalPhase2 += phase2Hours;
    budgetTotalPhase34 += phase34Hours;
    budgetTotalAll += totalHours;

    budgetCostPhase0 += phase0Cost;
    budgetCostPhase1 += phase1Cost;
    budgetCostPhase2 += phase2Cost;
    budgetCostPhase34 += phase34Cost;
    budgetCostAll += totalCost;

    /* ======================================================
     RETURN ROW
     ====================================================== */
    return {
      ...row,
      org: "Budget",

      phase0: {
        ...row.phase0,
        hours: phase0Hours,
        cost: +phase0Cost.toFixed(2),
      },

      phase1: {
        ...row.phase1,
        hours: phase1Hours,
        cost: +phase1Cost.toFixed(2),
      },

      phase2: {
        ...row.phase2,
        hours: phase2Hours,
        cost: +phase2Cost.toFixed(2),
      },

      phase34: {
        ...row.phase34,
        hours: phase34Hours,
        cost: +phase34Cost.toFixed(2),
      },

      total: {
        ...row.total,
        hours: totalHours,
        cost: totalCost,
      },
    };
  });

  // =====================================
  // STEP 6: FINAL TOTAL ROW
  // =====================================
  updatedRows6.push({
    category: "TOTAL",
    org: "Total",

    phase0: {
      ...template.rows6[0].phase0,
      hours: +budgetTotalPhase0.toFixed(2),
      cost: +budgetCostPhase0.toFixed(2),
    },

    phase1: {
      ...template.rows6[0].phase1,
      hours: +budgetTotalPhase1.toFixed(2),
      cost: +budgetCostPhase1.toFixed(2),
    },

    phase2: {
      ...template.rows6[0].phase2,
      hours: +budgetTotalPhase2.toFixed(2),
      cost: +budgetCostPhase2.toFixed(2),
    },

    phase34: {
      ...template.rows6[0].phase34,
      hours: +budgetTotalPhase34.toFixed(2),
      cost: +budgetCostPhase34.toFixed(2),
    },

    total: {
      ...template.rows6[0].total,
      hours: +budgetTotalAll.toFixed(2),
      cost: +budgetCostAll.toFixed(2),
    },
  });

  // ========budget logic to aggregate all hours and cost start===

  function aggregateBudgetAllPhases(allRows) {
    const totals = {
      phase0: { hours: 0, cost: 0 },
      phase1: { hours: 0, cost: 0 },
      phase2: { hours: 0, cost: 0 },
      phase34: { hours: 0, cost: 0 },
      total: { hours: 0, cost: 0 },
    };

    allRows.forEach((row) => {
      // Skip TOTAL rows (very important)
      if (
        row.role === "TOTAL" ||
        row.category === "TOTAL" ||
        row.category?.toLowerCase().includes("total")
      )
        return;

      totals.phase0.hours += Number(row.phase0?.hours ?? 0);
      totals.phase0.cost += Number(row.phase0?.cost ?? 0);

      totals.phase1.hours += Number(row.phase1?.hours ?? 0);
      totals.phase1.cost += Number(row.phase1?.cost ?? 0);

      totals.phase2.hours += Number(row.phase2?.hours ?? 0);
      totals.phase2.cost += Number(row.phase2?.cost ?? 0);

      totals.phase34.hours += Number(row.phase34?.hours ?? 0);
      totals.phase34.cost += Number(row.phase34?.cost ?? 0);

      totals.total.hours += Number(row.total?.hours ?? 0);
      totals.total.cost += Number(row.total?.cost ?? 0);
    });

    return totals;
  }

  // ========budget logic to aggregate all hours and cost end===

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
    ...updatedRows, //CAD
    ...updatedRows2, // CAE
    ...updatedRows3, // Thermal Safty
    ...updatedRows4, // PS
    // ...updatedRows5,    // Other - IGNORE (Because cost center are not present for them)
    // ...updatedRows6,   // Budget - IGNORE (Because cost center are not present for them)
  ];

  const orgTotals = aggregateByOrg(allRowsCombined); // aggregating Cost cneter Totals in phases
  console.log("orgTotals recv :" + JSON.stringify(orgTotals));

  //----Clean it and set it start---
  // 1️⃣ clear old data  . Reason - cost center can be change by user
  sharedRef.costCenters = {};

  // 2️⃣ set new data
  populateSharedRef(orgTotals);
  //-----clean and set it end

  // aggregating Cost cneter Totals in phases
  // Also saving in shared Data

  Object.entries(orgTotals).forEach(([org, totals]) => {
    console.log(
      `Org: ${org} | Phase1: ${totals.phase1} | Phase2: ${totals.phase2} | Total: ${totals.total}`,
    );
    console.log(`   Roles contributing: ${totals.roles.join(", ")}`);

    // Or alert if you prefer:
    //alert(`Org: ${org}\nPhase1: ${totals.phase1}\nPhase2: ${totals.phase2}\nTotal: ${totals.total}\nRoles: ${totals.roles.join(", ")}`);
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

//to do pending
//Aggrgated data store in shared data and use inMAU calculation hook

function aggregateByOrg2(allRows) {
  const orgTotals = {};

  allRows.forEach((row) => {
    if (!row.org || row.role === "TOTAL" || row.category === "TOTAL") return;

    if (!orgTotals[row.org]) {
      orgTotals[row.org] = {
        phase1: 0,
        phase2: 0,
        total: 0,
        roles: [], // 👈 keep track of contributing roles
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

// working well : But also considering others  rows and HCC bCC logic not handle in this
function aggregateByOrg3(allRows) {
  if (!Array.isArray(allRows)) {
    console.error("aggregateByOrg expected array but got:", allRows);
    return {};
  }

  const orgTotals = {};

  allRows.forEach((row) => {
    if (!row.org || row.role === "TOTAL" || row.category === "TOTAL") return;

    if (!orgTotals[row.org]) {
      orgTotals[row.org] = {
        phase1: 0,
        phase2: 0,
        total: 0,
        roles: [],
      };
    }

    orgTotals[row.org].phase1 += row.phase1?.hours ?? 0;
    orgTotals[row.org].phase2 += row.phase2?.hours ?? 0;
    orgTotals[row.org].total += row.total?.hours ?? 0;

    if (row.role) orgTotals[row.org].roles.push(row.role);
    else if (row.category) orgTotals[row.org].roles.push(row.category);
  });

  return orgTotals;
}

// working well : HCC bCC logic not handle in this
// work well with out HCC and BCC logic
function aggregateByOrg4(allRows) {
  if (!Array.isArray(allRows)) {
    console.error("aggregateByOrg expected array but got:", allRows);
    return {};
  }

  const orgTotals = {};

  allRows.forEach((row) => {
    if (!row.org || row.role === "TOTAL" || row.category === "TOTAL") return;

    // Need to Implement it properly
    // Logic is send to shared ref first then access into CostSheetHelperLogic.js (on 419 line)
    // Write logic to add hours in TDL cost center and DE cost center

    //      when HCC (100%) Related Cost cneter found then we have to add completely in TDL cost cneter  the hours.

    // if bcc(100%) Related Cost cneter found then we have to add completely in TDL cost cneter  the hours.

    // If combination HCC ( % ) & combination (BCC %) then We have calcualte % then send Respective share in TDL and DE cost cneter:

    // HCC share will go to TDL and
    // Bcc will go DE cost center
    // if(row.role == "TDL")
    // {
    //   costCentersForHCCToTDL_BCCToDE
    // }
    // if(row.role == "TDL")

    if (!orgTotals[row.org]) {
      //  alert("orgTotals[row] :"+JSON.stringify(orgTotals[row]))
      orgTotals[row.org] = {
        phase0: 0, // new change
        phase1: 0,
        phase2: 0,
        phase34: 0, // new change
        total: 0,
        roles: [],
      };
    }

    //     orgTotals[row.org].phase0 += row.phase0?.hours ?? 0;  // new change
    // orgTotals[row.org].phase1 += row.phase1?.hours ?? 0;
    // orgTotals[row.org].phase2 += row.phase2?.hours ?? 0;
    //     orgTotals[row.org].phase34 +=  row.phase34?.hours ?? 0;// new changesss
    // orgTotals[row.org].total += row.total?.hours ?? 0;

    // new to this for NUmber
    orgTotals[row.org].phase0 += Number(row.phase0?.hours ?? 0);
    orgTotals[row.org].phase1 += Number(row.phase1?.hours ?? 0);
    orgTotals[row.org].phase2 += Number(row.phase2?.hours ?? 0);
    orgTotals[row.org].phase34 += Number(row.phase34?.hours ?? 0);
    orgTotals[row.org].total += Number(row.total?.hours ?? 0);

    if (row.role) orgTotals[row.org].roles.push(row.role);
    else if (row.category) orgTotals[row.org].roles.push(row.category);
  });

  return orgTotals;
}

/**
 * Function : aggregateByOrg
 * Purpose  : Aggregate hours by organization.
 * Existing logic remains unchanged.
 *
 * NEW CHANGES:
 * Added HCC / BCC cost center distribution logic.
 *
 * Rules Implemented:
 * 1. If HCC = 100% → Entire hours go to TDL cost center
 * 2. If BCC = 100% → Entire hours go to DE cost center
 * 3. If HCC% and BCC% both exist → Split hours proportionally
 *      HCC share → TDL
 *      BCC share → DE
 */

// Code works Well : with hcc and bcc also
function aggregateByOrg(allRows) {
  if (!Array.isArray(allRows)) {
    console.error("aggregateByOrg expected array but got:", allRows);
    //   alert("Invalid input to aggregateByOrg");
    return {};
  }

  const orgTotals = {};

  // --------------------------------------------------
  // STEP 1 : Detect TDL and DE orgs
  // --------------------------------------------------

  let tdlOrg = null;
  let deOrg = null;

  allRows.forEach((row) => {
    const role = (row.role || "").trim();

    if (role === "TDL") {
      tdlOrg = row.org;
    }

    if (role === "DE") {
      deOrg = row.org;
    }
  });

  // alert(
  //   "Detected orgs\n" +
  //   "TDL: " + tdlOrg +
  //   "\nDE: " + deOrg
  // );

  // --------------------------------------------------
  // STEP 2 : Process rows
  // --------------------------------------------------

  allRows.forEach((row) => {
    if (!row.org) return;
    if (row.role === "TOTAL" || row.category === "TOTAL") return;

    const orgValue = (row.org || "").trim();

    const phases = {
      phase0: Number(row.phase0?.hours ?? 0),
      phase1: Number(row.phase1?.hours ?? 0),
      phase2: Number(row.phase2?.hours ?? 0),
      phase34: Number(row.phase34?.hours ?? 0),
      total: Number(row.total?.hours ?? 0),
    };

    // --------------------------------------------------
    // Check if org contains HCC/BCC
    // --------------------------------------------------

    if (/HCC|BCC/i.test(orgValue)) {
      const { hccPercent, bccPercent } = extractHccBccPercent(orgValue);

      // alert(
      //   "HCC/BCC Org Found\n" +
      //   "Org: " + orgValue +
      //   "\nHCC: " + hccPercent +
      //   "\nBCC: " + bccPercent
      // );

      // HCC 100%
      if (hccPercent === 100 && tdlOrg) {
        // alert("HCC 100% → send to TDL org: " + tdlOrg);

        addToOrg(tdlOrg, phases, row.role);
        return;
      }

      // BCC 100%
      if (bccPercent === 100 && deOrg) {
        //   alert("BCC 100% → send to DE org: " + deOrg);

        addToOrg(deOrg, phases, row.role);
        return;
      }

      // Split case
      if (hccPercent > 0 && bccPercent > 0 && tdlOrg && deOrg) {
        const tdlShare = {};
        const deShare = {};

        Object.keys(phases).forEach((phase) => {
          tdlShare[phase] = phases[phase] * (hccPercent / 100);
          deShare[phase] = phases[phase] * (bccPercent / 100);
        });

        // alert(
        //   "Split detected\n" +
        //   "TDL Org: " + tdlOrg +
        //   "\nDE Org: " + deOrg
        // );

        addToOrg(tdlOrg, tdlShare, row.role);
        addToOrg(deOrg, deShare, row.role);

        return;
      }
    }

    // --------------------------------------------------
    // Normal row
    // --------------------------------------------------

    addToOrg(row.org, phases, row.role);
  });

  return orgTotals;

  function addToOrg(org, phases, role) {
    if (!orgTotals[org]) {
      orgTotals[org] = {
        phase0: 0,
        phase1: 0,
        phase2: 0,
        phase34: 0,
        total: 0,
        roles: [],
      };
    }

    orgTotals[org].phase0 += phases.phase0;
    orgTotals[org].phase1 += phases.phase1;
    orgTotals[org].phase2 += phases.phase2;
    orgTotals[org].phase34 += phases.phase34;
    orgTotals[org].total += phases.total;

    if (role) orgTotals[org].roles.push(role);

    // alert(
    //   "Added hours to org: " + org +
    //   "\nTotal hours added: " + phases.total
    // );
  }
}

// --------------------------------------------------
// Extract HCC/BCC percentage from ORG column
// --------------------------------------------------

function extractHccBccPercent(text) {
  let hccPercent = 0;
  let bccPercent = 0;

  const hccMatch = text.match(/HCC\s*(\d+)%/i);
  const bccMatch = text.match(/BCC\s*(\d+)%/i);

  if (hccMatch) hccPercent = Number(hccMatch[1]);
  if (bccMatch) bccPercent = Number(bccMatch[1]);

  return { hccPercent, bccPercent };
}

//=======
// function populateSharedRef(orgTotals) {

//   alert("PopulateSharedRef orgTotals :: "+JSON.stringify(orgTotals) )

//   Object.entries(orgTotals).forEach(([org, data]) => {
//     sharedRef[org] = {
//       Offer: data.phase0,
//       Proto: data.phase1,
//       Serie: data.phase2,
//       Indust: data.phase3
//     };
//   });

//     alert("sharedRef  costCenters:: "+JSON.stringify(sharedRef.costCenters) )
// sharedRef.costCenters
//   return sharedRef;
// }

function populateSharedRef(orgTotals) {
  // alert("PopulateSharedRef orgTotals :: " + JSON.stringify(orgTotals));

  // make sure costCenters object exists
  if (!sharedRef.costCenters) {
    sharedRef.costCenters = {};
  }

  Object.entries(orgTotals).forEach(([org, data]) => {
    //alert("sharedRef.costCenters[org] :"+ org)
    sharedRef.costCenters[org] = {
      Offer: data.phase0 ?? 0,
      Proto: data.phase1 ?? 0,
      Serie: data.phase2 ?? 0,
      Indust: data.phase34 ?? 0,
    };
  });

  // alert("sharedRef costCenters :: " + JSON.stringify(sharedRef.costCenters));

  return sharedRef;
}
const cleaned = Object.fromEntries(
  Object.entries(sharedRef.costCenters || {}).map(([k, v]) => [k, v?.new ?? v]),
);
