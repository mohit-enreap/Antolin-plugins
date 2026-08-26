// import { isProductKey } from "../utils/helpers";

// // Actual Calculation :
// export function calculateResults(data) {
//   const results = [];
//   const TDLValue = data.Global.TDL === "YES" ? 1 : 0;
//   const COOValue = data.Global.COO === "YES" ? 1 : 0;
//   const DEValue = data.Global.DE === "YES" ? 1 : 0;

//   for (const [activityName, activityDetails] of Object.entries(
//     data.activities
//   )) {
//     if (activityDetails.checked === false) continue;
//     let totalTDL = 0,
//       totalCOO = 0,
//       totalDE = 0;

//     for (const [productPart, productData] of Object.entries(activityDetails)) {
//       if (!isProductKey(productPart)) continue;
//       if (productData.componentSelected === false) continue;

//       totalTDL += Number(productData.TDL || 0);
//       totalCOO += Number(productData.COO || 0);
//       totalDE += Number(productData.DE || 0);

//       if (productData.subactivity) {
//         for (const [subName, subDetails] of Object.entries(
//           productData.subactivity
//         )) {
//           if (subDetails.componentSelected === false) continue;
//           totalTDL += Number(subDetails.TDL || 0);
//           totalCOO += Number(subDetails.COO || 0);
//           totalDE += Number(subDetails.DE || 0);

//           if (Array.isArray(subDetails.protoSerie)) {
//             for (const ps of subDetails.protoSerie) {
//               totalTDL += Number(ps.TDL || 0);
//               totalCOO += Number(ps.COO || 0);
//               totalDE += Number(ps.DE || 0);
//             }
//           }
//         }
//       }
//     }

//     results.push({
//       activityName,
//       TDL: (totalTDL * TDLValue).toFixed(3),
//       COO: (totalCOO * COOValue).toFixed(3),
//       DE: (totalDE * DEValue).toFixed(3),
//       Total: (
//         totalTDL * TDLValue +
//         totalCOO * COOValue +
//         totalDE * DEValue
//       ).toFixed(3),
//     });
//   }

//   return results;
// }

//------------------------update---------------
import { isProductKey } from "../utils/helpers";

import { twoDHelper } from "../data/2D_Helper";
import { getDrawingValueBasedOnDev } from "../utils/getDrawingValueBasedOnDev";
import { getDataManagementConstantValueBasedOnDevProdCust } from "../utils/getDataManagementValueBasedOnDevProdCust";
import { _2D_PRECENTAGE_PRODUCT_WEIGHTS } from "../data/2D phasePercentage";

import { DM_PRECENTAGE_PRODUCT_WEIGHTS } from "../data/DM phasePercentage ";

import { CENTER_SPLIT_MAP } from "../data/3d BifurgationPercentage.js/costCenterSplitConstants";

import { useActivityLogic } from "./useActivityLogic";

import { sharedRef } from "../../shared/sharedStore.js";

//============================3D Start====================================================
/**
 * Calculate totals for 3D activities
 * @param {object} activityDetails - The activity object
 * @param {object} globalFlags - Global YES/NO for TDL, COO, DE
 * @returns {object} - Totals including proto and serie efforts separately
 */

function calculate3DActivity_old(activityDetails, globalFlags) {
  console.log("=== ▶ START 3D ACTIVITY CALCULATION ===");

  // Global Impact (YES = 1, NO = 0)
  const gTDL = globalFlags.TDL === "YES" ? 1 : 0;
  const gCOO = globalFlags.COO === "YES" ? 1 : 0;
  const gDE = globalFlags.DE === "YES" ? 1 : 0;

  console.log(`Global Multipliers → TDL=${gTDL}, COO=${gCOO}, DE=${gDE}`);

  // final totals
  let protoTDL = 0,
    protoCOO = 0,
    protoDE = 0;
  let serieTDL = 0,
    serieCOO = 0,
    serieDE = 0;

  // Iterate product parts: NORMAL ROOF / SUN ROOF / PANO ROOF
  for (const [productName, product] of Object.entries(activityDetails)) {
    if (!isProductKey(productName)) continue;

    console.log(`\n=== PRODUCT PART: ${productName} ===`);

    const noOfComponent = product.noOfComponent || 1;

    // ========== PRODUCT LEVEL (Calculation update) ==========
    console.log("  → Product-Level (NO MULTIPLIER APPLIED)");
    const pTDL = Number(product.TDL || 0) * gTDL;
    const pCOO = Number(product.COO || 0) * gCOO;
    const pDE = Number(product.DE || 0) * gDE;

    console.log(
      `    Raw: TDL=${product.TDL}, COO=${product.COO}, DE=${product.DE}`,
    );
    console.log(`    Filtered by Global: ${pTDL}, ${pCOO}, ${pDE}`);

    // =============== SUBACTIVITY LEVEL (REAL CALCULATION) ===============
    if (product.subactivity) {
      for (const [subName, sub] of Object.entries(product.subactivity)) {
        console.log(`\n  → Subactivity: ${subName}`);

        // BASIC TDL/COO/DE (NO MULT)
        const baseTDL = Number(sub.TDL || 0) * gTDL;
        const baseCOO = Number(sub.COO || 0) * gCOO;
        const baseDE = Number(sub.DE || 0) * gDE;

        console.log(
          `    Base Values (No Mult): TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`,
        );

        const protoLoop = sub.Proto || 0;
        const serieLoop = sub.Serie || 0;

        console.log(`    Loops: Proto=${protoLoop}, Serie=${serieLoop}`);
        console.log(`    noOfComponent = ${noOfComponent}`);

        // ===== PROTO CALCULATION =====
        const pTDLcalc = baseTDL * protoLoop * noOfComponent;
        const pCOOcalc = baseCOO * protoLoop * noOfComponent;
        const pDEcalc = baseDE * protoLoop * noOfComponent;

        protoTDL += pTDLcalc;
        protoCOO += pCOOcalc;
        protoDE += pDEcalc;

        console.log(
          `    Proto Calculation → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,
        );

        // ===== SERIE CALCULATION =====
        const sTDLcalc = baseTDL * serieLoop * noOfComponent;
        const sCOOcalc = baseCOO * serieLoop * noOfComponent;
        const sDEcalc = baseDE * serieLoop * noOfComponent;

        serieTDL += sTDLcalc;
        serieCOO += sCOOcalc;
        serieDE += sDEcalc;

        console.log(
          `    Serie Calculation → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`,
        );
      }
    }
  }

  console.log("\n=== ▶ FINAL TOTALS ===");

  const totalTDL = protoTDL + serieTDL;
  const totalCOO = protoCOO + serieCOO;
  const totalDE = protoDE + serieDE;

  console.log(`Total TDL = ${totalTDL}`);
  console.log(`Total COO = ${totalCOO}`);
  console.log(`Total DE  = ${totalDE}`);

  // ========== PRODUCT LEVEL (Calculation update) ==========
  console.log("  → Product-Level (Sum From below APPLIED)");
  const pTDL = totalTDL;
  const pCOO = totalCOO;
  const pDE = totalDE;

  // console.log(`    At Product Level: TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`);
  console.log(`    Filtered by Global: ${pTDL}, ${pCOO}, ${pDE}`);

  return {
    // proto only
    protoTDL: protoTDL.toFixed(3),
    protoCOO: protoCOO.toFixed(3),
    protoDE: protoDE.toFixed(3),
    protoTotal: (protoTDL + protoCOO + protoDE).toFixed(3),

    // serie only
    serieTDL: serieTDL.toFixed(3),
    serieCOO: serieCOO.toFixed(3),
    serieDE: serieDE.toFixed(3),
    serieTotal: (serieTDL + serieCOO + serieDE).toFixed(3),

    // combined
    TDL: pTDL.toFixed(3),
    COO: pCOO.toFixed(3),
    DE: pDE.toFixed(3),
    Total: (pTDL + pCOO + pDE).toFixed(3),
  };
}

//3D working properly
function calculate3DActivity_new1(activityDetails, globalFlags) {
  const blocked = ["2D DELIVERABLES", "DATA MANAGEMENT", "GEOMETRICAL STUDY"];
  console.log("====================================================");
  console.log("=== ▶ START 3D ACTIVITY CALCULATION (3D Logic) ===");
  console.log("====================================================\n");

  // -----------------------------------------------------
  // Global Flags (YES → 1, NO → 0)
  // These are applied to EVERY TDL / COO / DE below.
  // If a global flag is NO, entire parameter becomes 0 everywhere.
  // -----------------------------------------------------
  const gTDL = globalFlags.TDL === "YES" ? 1 : 0;
  const gCOO = globalFlags.COO === "YES" ? 1 : 0;
  const gDE = globalFlags.DE === "YES" ? 1 : 0;

  console.log(`Global Multipliers Set → TDL=${gTDL}, COO=${gCOO}, DE=${gDE}`);

  // Accumulators for totals (proto + serie)
  let protoTDL = 0,
    protoCOO = 0,
    protoDE = 0;

  let serieTDL = 0,
    serieCOO = 0,
    serieDE = 0;

  // -----------------------------------------------------
  // Loop products: NORMAL ROOF / SUNROOF / PANO ROOF
  // -----------------------------------------------------
  for (const [productName, product] of Object.entries(activityDetails)) {
    if (!isProductKey(productName)) continue; // skip non-product keys

    console.log(`\n==================================`);
    console.log(`=== PRODUCT PART: ${productName} ===`);
    console.log("==================================");

    const noOfComponent = product.noOfComponent || 1;
    console.log(`  → Number of Components = ${noOfComponent}`);

    // -----------------------------------------------------
    // PRODUCT-LEVEL LOGGING (NO multiplication except global filter)
    // -----------------------------------------------------
    console.log("  → Product-Level Values (Before Subactivity Calc)");

    const pTDL = Number(product.TDL || 0) * gTDL;
    const pCOO = Number(product.COO || 0) * gCOO;
    const pDE = Number(product.DE || 0) * gDE;

    console.log(
      `    Raw Product Values: TDL=${product.TDL}, COO=${product.COO}, DE=${product.DE}`,
    );
    console.log(
      `    After Applying Global Flags → TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`,
    );

    // -----------------------------------------------------
    // SUBACTIVITIES LOOP
    // -----------------------------------------------------
    if (product.subactivity) {
      for (const [subName, sub] of Object.entries(product.subactivity)) {
        console.log(`\n  → Subactivity Found: ${subName}`);
        console.log("    -----------------------------");

        // Step 1: Base value AFTER applying global YES/NO
        const baseTDL = Number(sub.TDL || 0) * gTDL;
        const baseCOO = Number(sub.COO || 0) * gCOO;
        const baseDE = Number(sub.DE || 0) * gDE;

        console.log(
          `    Base Values (After Global Filter) → TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`,
        );

        // Proto / Serie loops (multipliers)
        const protoLoop = sub.Proto || 0;
        const serieLoop = sub.Serie || 0;

        console.log(`    Proto Loop Count: ${protoLoop}`);
        console.log(`    Serie Loop Count: ${serieLoop}`);
        console.log(`    Component Count: ${noOfComponent}`);

        // -----------------------------------------------------
        // PROTO CALCULATIONS
        // -----------------------------------------------------
        const pTDLcalc = baseTDL * protoLoop * noOfComponent;
        const pCOOcalc = baseCOO * protoLoop * noOfComponent;
        const pDEcalc = baseDE * protoLoop * noOfComponent;

        protoTDL += pTDLcalc;
        protoCOO += pCOOcalc;
        protoDE += pDEcalc;

        console.log(
          `    Proto → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,
        );

        // -----------------------------------------------------
        // SERIE CALCULATIONS
        // -----------------------------------------------------
        const sTDLcalc = baseTDL * serieLoop * noOfComponent;
        const sCOOcalc = baseCOO * serieLoop * noOfComponent;
        const sDEcalc = baseDE * serieLoop * noOfComponent;

        serieTDL += sTDLcalc;
        serieCOO += sCOOcalc;
        serieDE += sDEcalc;

        console.log(
          `    Serie → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`,
        );
      }
    }
  }

  // -----------------------------------------------------
  // FINAL TOTALS
  // -----------------------------------------------------
  console.log("\n=============================");
  console.log("=== ▶ FINAL TOTALS (ALL) ===");
  console.log("=============================\n");

  const totalTDL = protoTDL + serieTDL;
  const totalCOO = protoCOO + serieCOO;
  const totalDE = protoDE + serieDE;

  console.log(
    `Total TDL = Proto(${protoTDL}) + Serie(${serieTDL}) = ${totalTDL}`,
  );
  console.log(
    `Total COO = Proto(${protoCOO}) + Serie(${serieCOO}) = ${totalCOO}`,
  );
  console.log(
    `Total DE  = Proto(${protoDE})  + Serie(${serieDE})  = ${totalDE}`,
  );

  // -----------------------------------------------------
  // PRODUCT-LEVEL FINAL SUMMARY (Your Original Code)
  // -----------------------------------------------------
  console.log("\n  → Product-Level (Sum From Below Applied)");

  const pTDL_final = totalTDL;
  const pCOO_final = totalCOO;
  const pDE_final = totalDE;

  console.log(
    `    Final Product-Level Values → TDL=${pTDL_final}, COO=${pCOO_final}, DE=${pDE_final}`,
  );

  // -----------------------------------------------------
  // RETURN RESULT IN SAME FORMAT
  // -----------------------------------------------------
  return {
    // proto only
    protoTDL: protoTDL.toFixed(3),
    protoCOO: protoCOO.toFixed(3),
    protoDE: protoDE.toFixed(3),
    protoTotal: (protoTDL + protoCOO + protoDE).toFixed(3),

    // serie only
    serieTDL: serieTDL.toFixed(3),
    serieCOO: serieCOO.toFixed(3),
    serieDE: serieDE.toFixed(3),
    serieTotal: (serieTDL + serieCOO + serieDE).toFixed(3),

    // combined total
    TDL: totalTDL.toFixed(3),
    COO: totalCOO.toFixed(3),
    DE: totalDE.toFixed(3),
    Total: (totalTDL + totalCOO + totalDE).toFixed(3),
  };
}

//3D working properly
function calculate3DActivity_new2(activityName, activityDetails, globalFlags) {
  const blocked = ["2D DELIVERABLES", "DATA MANAGEMENT", "GEOMETRICAL STUDY"];
  if (blocked.includes(activityName)) {
    console.log(`⛔ Skipping 3D logic for: ${activityName}`);
    return null;
  }
  console.log("====================================================");
  console.log("=== ▶ START 3D ACTIVITY CALCULATION (3D Logic) ===");
  console.log("====================================================\n");

  // -----------------------------------------------------
  // Global Flags (YES → 1, NO → 0)
  // These are applied to EVERY TDL / COO / DE below.
  // If a global flag is NO, entire parameter becomes 0 everywhere.
  // -----------------------------------------------------
  const gTDL = globalFlags.TDL === "YES" ? 1 : 0;
  const gCOO = globalFlags.COO === "YES" ? 1 : 0;
  const gDE = globalFlags.DE === "YES" ? 1 : 0;

  console.log(`Global Multipliers Set → TDL=${gTDL}, COO=${gCOO}, DE=${gDE}`);

  // Accumulators for totals (proto + serie)
  let protoTDL = 0,
    protoCOO = 0,
    protoDE = 0;

  let serieTDL = 0,
    serieCOO = 0,
    serieDE = 0;

  // -----------------------------------------------------
  // Loop products: NORMAL ROOF / SUNROOF / PANO ROOF
  // -----------------------------------------------------
  for (const [productName, product] of Object.entries(activityDetails)) {
    if (!isProductKey(productName)) continue; // skip non-product keys

    console.log(`\n==================================`);
    console.log(`=== PRODUCT PART: ${productName} ===`);
    console.log("==================================");

    const noOfComponent = product.noOfComponent || 1;
    console.log(`  → Number of Components = ${noOfComponent}`);

    // -----------------------------------------------------
    // PRODUCT-LEVEL LOGGING (NO multiplication except global filter)
    // -----------------------------------------------------
    console.log("  → Product-Level Values (Before Subactivity Calc)");

    const pTDL = Number(product.TDL || 0) * gTDL;
    const pCOO = Number(product.COO || 0) * gCOO;
    const pDE = Number(product.DE || 0) * gDE;

    console.log(
      `    Raw Product Values: TDL=${product.TDL}, COO=${product.COO}, DE=${product.DE}`,
    );
    console.log(
      `    After Applying Global Flags → TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`,
    );

    // -----------------------------------------------------
    // SUBACTIVITIES LOOP
    // -----------------------------------------------------
    if (product.subactivity) {
      for (const [subName, sub] of Object.entries(product.subactivity)) {
        console.log(`\n  → Subactivity Found: ${subName}`);
        console.log("    -----------------------------");

        // Step 1: Base value AFTER applying global YES/NO
        const baseTDL = Number(sub.TDL || 0) * gTDL;
        const baseCOO = Number(sub.COO || 0) * gCOO;
        const baseDE = Number(sub.DE || 0) * gDE;

        console.log(
          `    Base Values (After Global Filter) → TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`,
        );

        // Proto / Serie loops (multipliers)
        const protoLoop = sub.Proto || 0;
        const serieLoop = sub.Serie || 0;

        console.log(`    Proto Loop Count: ${protoLoop}`);
        console.log(`    Serie Loop Count: ${serieLoop}`);
        console.log(`    Component Count: ${noOfComponent}`);

        // -----------------------------------------------------
        // PROTO CALCULATIONS
        // -----------------------------------------------------
        const pTDLcalc = baseTDL * protoLoop * noOfComponent;
        const pCOOcalc = baseCOO * protoLoop * noOfComponent;
        const pDEcalc = baseDE * protoLoop * noOfComponent;

        protoTDL += pTDLcalc;
        protoCOO += pCOOcalc;
        protoDE += pDEcalc;

        console.log(
          `    Proto → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,
        );

        // -----------------------------------------------------
        // SERIE CALCULATIONS
        // -----------------------------------------------------
        const sTDLcalc = baseTDL * serieLoop * noOfComponent;
        const sCOOcalc = baseCOO * serieLoop * noOfComponent;
        const sDEcalc = baseDE * serieLoop * noOfComponent;

        serieTDL += sTDLcalc;
        serieCOO += sCOOcalc;
        serieDE += sDEcalc;

        console.log(
          `    Serie → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`,
        );
      }
    }
  }

  // -----------------------------------------------------
  // FINAL TOTALS
  // -----------------------------------------------------
  console.log("\n=============================");
  console.log("=== ▶ FINAL TOTALS (ALL) ===");
  console.log("=============================\n");

  const totalTDL = protoTDL + serieTDL;
  const totalCOO = protoCOO + serieCOO;
  const totalDE = protoDE + serieDE;

  console.log(
    `Total TDL = Proto(${protoTDL}) + Serie(${serieTDL}) = ${totalTDL}`,
  );
  console.log(
    `Total COO = Proto(${protoCOO}) + Serie(${serieCOO}) = ${totalCOO}`,
  );
  console.log(
    `Total DE  = Proto(${protoDE})  + Serie(${serieDE})  = ${totalDE}`,
  );

  // -----------------------------------------------------
  // PRODUCT-LEVEL FINAL SUMMARY (Your Original Code)
  // -----------------------------------------------------
  console.log("\n  → Product-Level (Sum From Below Applied)");

  const pTDL_final = totalTDL;
  const pCOO_final = totalCOO;
  const pDE_final = totalDE;

  console.log(
    `    Final Product-Level Values → TDL=${pTDL_final}, COO=${pCOO_final}, DE=${pDE_final}`,
  );

  // -----------------------------------------------------
  // RETURN RESULT IN SAME FORMAT
  // -----------------------------------------------------
  return {
    // proto only
    protoTDL: protoTDL.toFixed(3),
    protoCOO: protoCOO.toFixed(3),
    protoDE: protoDE.toFixed(3),
    protoTotal: (protoTDL + protoCOO + protoDE).toFixed(3),

    // serie only
    serieTDL: serieTDL.toFixed(3),
    serieCOO: serieCOO.toFixed(3),
    serieDE: serieDE.toFixed(3),
    serieTotal: (serieTDL + serieCOO + serieDE).toFixed(3),

    // combined total
    TDL: totalTDL.toFixed(3),
    COO: totalCOO.toFixed(3),
    DE: totalDE.toFixed(3),
    Total: (totalTDL + totalCOO + totalDE).toFixed(3),
  };
}

// Before applying the Added TDL and Phases Related % on 3D Activity
function calculate3DActivity1(activityName, activityDetails, globalFlags) {
  // alert("3d calculation");
  const blocked = ["2D DELIVERABLES", "DATA MANAGEMENT", "GEOMETRICAL STUDY"];
  if (blocked.includes(activityName)) {
    console.log(`⛔ Skipping 3D logic for: ${activityName}`);
    return null;
  }

  console.log("====================================================");
  console.log("=== ▶ START 3D ACTIVITY CALCULATION (3D Logic) ===");
  console.log("====================================================\n");

  // ------------------------------------------
  // Global Flags (YES → 1, NO → 0)
  // ------------------------------------------
  const gTDL = globalFlags.TDL === "YES" ? 1 : 0;
  const gCOO = globalFlags.COO === "YES" ? 1 : 0;
  const gDE = globalFlags.DE === "YES" ? 1 : 0;

  console.log(`Global Multipliers Set → TDL=${gTDL}, COO=${gCOO}, DE=${gDE}`);

  // ------------------------------------------
  // Accumulators for totals
  // ------------------------------------------
  let protoTDL = 0,
    protoCOO = 0,
    protoDE = 0;
  let serieTDL = 0,
    serieCOO = 0,
    serieDE = 0;

  // ------------------------------------------
  // Iterate products
  // ------------------------------------------
  for (const [productName, product] of Object.entries(activityDetails)) {
    if (!isProductKey(productName)) continue;

    console.log(`\n==================================`);
    console.log(`=== PRODUCT PART: ${productName} ===`);
    console.log("==================================");

    const noOfComponent = product.noOfComponent || 1;
    const pTDL = Number(product.TDL || 0) * gTDL;
    const pCOO = Number(product.COO || 0) * gCOO;
    const pDE = Number(product.DE || 0) * gDE;

    console.log(`  → Number of Components = ${noOfComponent}`);
    console.log(
      `    After Global Filter → TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`,
    );

    // ------------------------------------------
    // SUBACTIVITIES LOOP
    //         Product
    //  ├─ If sub-activities exist
    //  │    └─ calculate using sub-activity TDL/COO/DE
    //  │
    //  └─ Else
    //       └─ calculate using product TDL/COO/DE
    // ------------------------------------------
    /**
     * Determine whether valid sub-activities exist for the product.
     *
     * Conditions:
     * - subactivity must exist
     * - subactivity must be an object
     * - subactivity must contain at least one entry
     *
     * This avoids false positives where subactivity is `{}` (empty object),
     * which is truthy in JavaScript but semantically means "no sub-activities".
     */
    const hasSubActivity =
      product.subactivity &&
      typeof product.subactivity === "object" &&
      Object.keys(product.subactivity).length > 0;

    /**
     * CASE 1:
     * Sub-activities ARE present AND product is selected.
     *
     * → Perform calculation at SUB-ACTIVITY level.
     * → Product-level values are ignored in this case.
     */
    if (hasSubActivity && product.componentSelected) {
      // Iterate through each sub-activity under the product
      for (const [subName, sub] of Object.entries(product.subactivity)) {
        console.log(`\n  → Subactivity Found: ${subName}`);
        console.log("    -----------------------------");

        /**
         * Apply global YES/NO flags (TDL / COO / DE)
         * to sub-activity base values.
         */
        const baseTDL = Number(sub.TDL || 0) * gTDL;
        const baseCOO = Number(sub.COO || 0) * gCOO;
        const baseDE = Number(sub.DE || 0) * gDE;

        /**
         * Loop counts defined at sub-activity level.
         * Defaults to 0 to prevent accidental calculation.
         */
        const protoLoop = sub.Proto || 0;
        const serieLoop = sub.Serie || 0;

        console.log(
          `    Base Values (Filtered) → TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`,
        );
        console.log(`    Proto Loop = ${protoLoop}`);
        console.log(`    Serie Loop = ${serieLoop}`);
        console.log(`    Components = ${noOfComponent}`);

        // ------------------------------------------------
        // PROTOTYPE CALCULATION (Sub-activity level)
        // ------------------------------------------------
        const pTDLcalc = baseTDL * protoLoop * noOfComponent;
        const pCOOcalc = baseCOO * protoLoop * noOfComponent;
        const pDEcalc = baseDE * protoLoop * noOfComponent;

        protoTDL += pTDLcalc;
        protoCOO += pCOOcalc;
        protoDE += pDEcalc;

        // ------------------------------------------------
        // SERIES CALCULATION (Sub-activity level)
        // ------------------------------------------------
        const sTDLcalc = baseTDL * serieLoop * noOfComponent;
        const sCOOcalc = baseCOO * serieLoop * noOfComponent;
        const sDEcalc = baseDE * serieLoop * noOfComponent;

        serieTDL += sTDLcalc;
        serieCOO += sCOOcalc;
        serieDE += sDEcalc;

        console.log(
          `    Proto → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,
        );
        console.log(
          `    Serie → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`,
        );
      }
    } else if (!hasSubActivity && product.componentSelected) {
      /**
       * CASE 2:
       * No sub-activities exist BUT product is selected.
       *
       * → Fall back to PRODUCT-level calculation.
       * → This handles products that do not have sub-activities.
       */
      console.log(
        "  ⚠ No Subactivities Found → Using PRODUCT level calculation",
      );

      /**
       * Product-level loop counts.
       * Default to 1 so that product values are counted once.
       */
      const protoLoop = product.Proto || 1;
      const serieLoop = product.Serie || 1;

      console.log(`    Proto Loop = ${protoLoop}`);
      console.log(`    Serie Loop = ${serieLoop}`);
      console.log(`    Components = ${noOfComponent}`);

      // ------------------------------------------------
      // PROTOTYPE CALCULATION (Product level)
      // ------------------------------------------------
      const pTDLcalc = pTDL * protoLoop * noOfComponent;
      const pCOOcalc = pCOO * protoLoop * noOfComponent;
      const pDEcalc = pDE * protoLoop * noOfComponent;

      protoTDL += pTDLcalc;
      protoCOO += pCOOcalc;
      protoDE += pDEcalc;

      // ------------------------------------------------
      // SERIES CALCULATION (Product level)
      // ------------------------------------------------
      const sTDLcalc = pTDL * serieLoop * noOfComponent;
      const sCOOcalc = pCOO * serieLoop * noOfComponent;
      const sDEcalc = pDE * serieLoop * noOfComponent;

      serieTDL += sTDLcalc;
      serieCOO += sCOOcalc;
      serieDE += sDEcalc;

      console.log(
        `    Proto (Product) → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,
      );
      console.log(
        `    Serie (Product) → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`,
      );
    }
  }

  // ------------------------------------------
  // FINAL TOTALS
  // ------------------------------------------
  console.log("\n=============================");
  console.log("=== ▶ FINAL TOTALS (ALL) ===");
  console.log("=============================\n");

  const totalTDL = protoTDL + serieTDL;
  const totalCOO = protoCOO + serieCOO;
  const totalDE = protoDE + serieDE;

  console.log(
    `Total TDL = Proto(${protoTDL}) + Serie(${serieTDL}) = ${totalTDL}`,
  );
  console.log(
    `Total COO = Proto(${protoCOO}) + Serie(${serieCOO}) = ${totalCOO}`,
  );
  console.log(
    `Total DE  = Proto(${protoDE})  + Serie(${serieDE})  = ${totalDE}`,
  );

  // ------------------------------------------
  // GROUPED RETURN
  // ------------------------------------------
  // return {
  //   "3D": {
  //     Proto: {
  //       TDL: protoTDL.toFixed(3),
  //       COO: protoCOO.toFixed(3),
  //       DE: protoDE.toFixed(3),
  //       Total: (protoTDL + protoCOO + protoDE).toFixed(3),
  //     },
  //     Serie: {
  //       TDL: serieTDL.toFixed(3),
  //       COO: serieCOO.toFixed(3),
  //       DE: serieDE.toFixed(3),
  //       Total: (serieTDL + serieCOO + serieDE).toFixed(3) ,
  //     },
  //     Combined: {
  //       TDL: totalTDL.toFixed(3),
  //       COO: totalCOO.toFixed(3)  ,
  //       DE: totalDE.toFixed(3)  ,
  //       Total: (totalTDL + totalCOO + totalDE).toFixed(3)  ,
  //     },
  //   },
  // };

  return {
    // proto only
    protoTDL: protoTDL.toFixed(3),
    protoCOO: protoCOO.toFixed(3),
    protoDE: protoDE.toFixed(3),
    protoTotal: (protoTDL + protoCOO + protoDE).toFixed(3),

    // serie only
    serieTDL: serieTDL.toFixed(3),
    serieCOO: serieCOO.toFixed(3),
    serieDE: serieDE.toFixed(3),
    serieTotal: (serieTDL + serieCOO + serieDE).toFixed(3),

    // combined total
    TDL: totalTDL.toFixed(3),
    COO: totalCOO.toFixed(3),
    DE: totalDE.toFixed(3),
    Total: (totalTDL + totalCOO + totalDE).toFixed(3),
  };
}

// Processing applying the Added TDL and Phases Related % on 3D Activity
function calculate3DActivity(activityName, activityDetails, globalFlags) {
  // alert("3d calculation");
  const blocked = ["2D DELIVERABLES", "DATA MANAGEMENT", "GEOMETRICAL STUDY"];
  if (blocked.includes(activityName)) {
    console.log(`⛔ Skipping 3D logic for: ${activityName}`);
    return null;
  }

  console.log("====================================================");
  console.log("=== ▶ START 3D ACTIVITY CALCULATION (3D Logic) ===");
  console.log("====================================================\n");

  // ------------------------------------------
  // Global Flags (YES → 1, NO → 0)
  // ------------------------------------------
  const gTDL = globalFlags.TDL === "YES" ? 1 : 0;
  const gCOO = globalFlags.COO === "YES" ? 1 : 0;
  const gDE = globalFlags.DE === "YES" ? 1 : 0;

  console.log(`Global Multipliers Set → TDL=${gTDL}, COO=${gCOO}, DE=${gDE}`);

  // ------------------------------------------
  // Accumulators for totals
  // ------------------------------------------
  let protoTDL = 0,
    protoCOO = 0,
    protoDE = 0; //Initializing proto data
  let serieTDL = 0,
    serieCOO = 0,
    serieDE = 0; //Initializing Serie data
  let indusTDL = 0,
    indusCOO = 0,
    indusDE = 0; //Initializing indust data (Not require but for Aggregation template should be same)

  // ------------------------------------------
  // Iterate products
  // ------------------------------------------
  for (const [productName, product] of Object.entries(activityDetails)) {
    if (!isProductKey(productName)) continue;

    console.log(`\n==================================`);
    console.log(`=== PRODUCT PART: ${productName} ===`);
    console.log("==================================");

    const noOfComponent = product.noOfComponent || 1;
    const pTDL = Number(product.TDL || 0) * gTDL;
    const pCOO = Number(product.COO || 0) * gCOO;
    const pDE = Number(product.DE || 0) * gDE;

    console.log(`  → Number of Components = ${noOfComponent}`);
    console.log(
      `    After Global Filter → TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`,
    );

    // ------------------------------------------
    // SUBACTIVITIES LOOP
    //         Product
    //  ├─ If sub-activities exist
    //  │    └─ calculate using sub-activity TDL/COO/DE
    //  │
    //  └─ Else
    //       └─ calculate using product TDL/COO/DE
    // ------------------------------------------
    /**
     * Determine whether valid sub-activities exist for the product.
     *
     * Conditions:
     * - subactivity must exist
     * - subactivity must be an object
     * - subactivity must contain at least one entry
     *
     * This avoids false positives where subactivity is `{}` (empty object),
     * which is truthy in JavaScript but semantically means "no sub-activities".
     */
    const hasSubActivity =
      product.subactivity &&
      typeof product.subactivity === "object" &&
      Object.keys(product.subactivity).length > 0;

    /**
     * CASE 1:
     * Sub-activities ARE present AND product is selected.
     *
     * → Perform calculation at SUB-ACTIVITY level.
     * → Product-level values are ignored in this case.
     */
    if (hasSubActivity && product.componentSelected) {
      // Iterate through each sub-activity under the product
      for (const [subName, sub] of Object.entries(product.subactivity)) {
        console.log(`\n  → Subactivity Found: ${subName}`);
        console.log("    -----------------------------");

        //         activityLog.push({
        //   type: "3D",
        //   activity: activityName,
        //   product: productName,
        //   subactivity: subName,
        //   componentSelected: product.componentSelected || false,
        //   protoLoop,
        //   serieLoop,
        //   protoTDL: pTDLcalc,
        //   protoCOO: pCOOcalc,
        //   protoDE: pDEcalc,
        //   serieTDL: sTDLcalc,
        //   serieCOO: sCOOcalc,
        //   serieDE: sDEcalc
        // });
        /**
         * Apply global YES/NO flags (TDL / COO / DE)
         * to sub-activity base values.
         */
        const baseTDL = Number(sub.TDL || 0) * gTDL;
        const baseCOO = Number(sub.COO || 0) * gCOO;
        const baseDE = Number(sub.DE || 0) * gDE;

        /**
         * Loop counts defined at sub-activity level.
         * Defaults to 0 to prevent accidental calculation.
         */ //
        var scalfactor = 1;
        const protoLoop = sub.Proto * scalfactor || 0; /// here we have to applysing Scalling
        const serieLoop = sub.Serie || 0; /// here we have to applysing Scalling

        console.log(
          `    Base Values (Filtered) → TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`,
        );
        console.log(`    Proto Loop = ${protoLoop}`);
        console.log(`    Serie Loop = ${serieLoop}`);
        console.log(`    Components = ${noOfComponent}`);

        // ------------------------------------------------
        // PROTOTYPE CALCULATION (Sub-activity level)
        // ------------------------------------------------
        const pTDLcalc = baseTDL * protoLoop * noOfComponent;
        const pCOOcalc = baseCOO * protoLoop * noOfComponent;
        const pDEcalc = baseDE * protoLoop * noOfComponent;

        protoTDL += pTDLcalc;
        protoCOO += pCOOcalc;
        protoDE += pDEcalc;

        // ------------------------------------------------
        // SERIES CALCULATION (Sub-activity level)
        // ------------------------------------------------
        const sTDLcalc = baseTDL * serieLoop * noOfComponent;
        const sCOOcalc = baseCOO * serieLoop * noOfComponent;
        const sDEcalc = baseDE * serieLoop * noOfComponent;

        serieTDL += sTDLcalc;
        serieCOO += sCOOcalc;
        serieDE += sDEcalc;

        console.log(
          `    Proto → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,
        );
        console.log(
          `    Serie → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`,
        );
      }
    } else if (!hasSubActivity && product.componentSelected) {
      /**
       * CASE 2:
       * No sub-activities exist BUT product is selected.
       *
       * → Fall back to PRODUCT-level calculation.
       * → This handles products that do not have sub-activities.
       */
      console.log(
        "  ⚠ No Subactivities Found → Using PRODUCT level calculation",
      );

      //       activityLog.push({
      //   type: "3D",
      //   activity: activityName,
      //   product: productName,
      //   subactivity: null,
      //   componentSelected: true,
      //   protoLoop,
      //   serieLoop,
      //   protoTDL: pTDLcalc,
      //   protoCOO: pCOOcalc,
      //   protoDE: pDEcalc,
      //   serieTDL: sTDLcalc,
      //   serieCOO: sCOOcalc,
      //   serieDE: sDEcalc
      // });

      /**
       * Product-level loop counts.
       * Default to 1 so that product values are counted once.
       */

      var scalfactor = 1;

      // old
      // const protoLoop = product.Proto * scalfactor|| 1;    /// here we have to applysing Scalling
      // const serieLoop = product.Serie || 1;      /// here we have to applysing Scalling

      // new
      const protoLoop = (Number(product.Proto) || 0) * scalfactor;
      const serieLoop = (Number(product.Serie) || 0) * scalfactor;

      console.log(`    Proto Loop = ${protoLoop}`);
      console.log(`    Serie Loop = ${serieLoop}`);
      console.log(`    Components = ${noOfComponent}`);

      // ------------------------------------------------
      // PROTOTYPE CALCULATION (Product level)
      // ------------------------------------------------
      const pTDLcalc = pTDL * protoLoop * noOfComponent;
      const pCOOcalc = pCOO * protoLoop * noOfComponent;
      const pDEcalc = pDE * protoLoop * noOfComponent;

      protoTDL += pTDLcalc;
      protoCOO += pCOOcalc;
      protoDE += pDEcalc;

      // ------------------------------------------------
      // SERIES CALCULATION (Product level)
      // ------------------------------------------------
      const sTDLcalc = pTDL * serieLoop * noOfComponent;
      const sCOOcalc = pCOO * serieLoop * noOfComponent;
      const sDEcalc = pDE * serieLoop * noOfComponent;

      serieTDL += sTDLcalc;
      serieCOO += sCOOcalc;
      serieDE += sDEcalc;

      console.log(
        `    Proto (Product) → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,
      );
      console.log(
        `    Serie (Product) → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`,
      );
    }
  }

  // ------------------------------------------
  // FINAL TOTALS
  // ------------------------------------------
  console.log("\n=============================");
  console.log("=== ▶ FINAL TOTALS (ALL) ===");
  console.log("=============================\n");

  // Till here proto serie (Aggregated TDl , aggregated DE, aggregated COO) is calculated  properly for 3d .(No involved of  1)"Added TDL phase 3-4
  //  " and 2) "Combined TDL between centers" )
  const totalTDL = protoTDL + serieTDL;
  const totalCOO = protoCOO + serieCOO;
  const totalDE = protoDE + serieDE;

  console.log(
    `Total TDL = Proto(${protoTDL}) + Serie(${serieTDL}) = ${totalTDL}`,
  );
  console.log(
    `Total COO = Proto(${protoCOO}) + Serie(${serieCOO}) = ${totalCOO}`,
  );
  console.log(
    `Total DE  = Proto(${protoDE})  + Serie(${serieDE})  = ${totalDE}`,
  );

  //get TDL related Bufirgation in Hours based on selection of
  // " 1)"Added TDL phase 3-4" and 2) "Combined TDL between centers" )"

  // when we make "Added TDL phase 3-4"  20% from proto and 20% from serie will be added into Indust
  // But as per victor . This logic we will remove he said . So proto serie will remain 100% .
  // as with new logic there no addition to industrilization phase from proto serie

  //======Bifuration logic start========

  // alert("protoTDL"+protoTDL + " :" + serieTDL + " ==>" + (protoTDL + serieTDL));
  // const {
  //   proto: { HCC_TDL: protoHCC_TDL, BCC_TDLCombined: protoBSS_TDL },
  //   serie: { HCC_TDL: serieHCC_TDL, BCC_TDLCombined: serieBSS_TDL },
  //   indus: { HCC_TDL: indusHCC_TDL, BCC_TDLCombined: indusBSS_TDL },
  // } = calculateTDLBifurcation(protoTDL, serieTDL, "HCC 100%"); //"HCC 30% BCC 70%"

  // console.log("HCC & BCC :"+ protoHCC_TDL, protoBSS_TDL);
  // console.log("HCC & BCC :"+serieHCC_TDL, serieBSS_TDL);
  // console.log("HCC & BCC :"+indusHCC_TDL, indusBSS_TDL);

  // alert.log("PROTO  => HCC:", protoHCC_TDL, "BCC:", protoBSS_TDL+
  //           "SERIE  => HCC:", serieHCC_TDL, "BCC:", serieBSS_TDL +
  //         "INDUS  => HCC:", indusHCC_TDL, "BCC:", indusBSS_TDL
  // );

  //======Bifuration logic End========

  const finalRESULT = {
    // ==========================
    // proto only

    protoTDL: protoTDL.toFixed(3),
    protoCOO: protoCOO.toFixed(3),
    protoDE: protoDE.toFixed(3),
    protoTotal: (protoTDL + protoCOO + protoDE).toFixed(3),

    //==========================
    // serie only
    serieTDL: serieTDL.toFixed(3),
    serieCOO: serieCOO.toFixed(3),
    serieDE: serieDE.toFixed(3),
    serieTotal: (serieTDL + serieCOO + serieDE).toFixed(3),

    // ==========================
    // Industrilization only (Puuting zero because no contributing coming from Industrilization from 3d activity)
    indusTDL: 0, //TDL
    indusCOO: 0,
    indusDE: 0,
    indusTotal: 0, // as per your  victor new logic ( no 20 % proto , No 20% serie . Industrilization will take it seperately )

    // ==========================
    // combined total (HCC only)
    TDL: (protoTDL + serieTDL + indusTDL).toFixed(3), // We Setting in this way because ealier logic was taking 20% 20% (Logic no more related to 20%)
    COO: totalCOO.toFixed(3),
    DE: totalDE.toFixed(3),
    Total: (protoTDL + serieTDL + indusTDL + totalCOO + totalDE).toFixed(3),
  };

  console.log("finalRESULT :: " + JSON.stringify(finalRESULT));

  return finalRESULT;
  // return {
  //   // ==========================
  //   // proto only

  //   protoTDL: protoTDL.toFixed(3),
  //   protoCOO: protoCOO.toFixed(3),
  //   protoDE: protoDE.toFixed(3),
  //   protoTotal: (protoTDL + protoCOO + protoDE).toFixed(3),

  //   //==========================
  //   // serie only
  //   serieTDL: serieTDL.toFixed(3),
  //   serieCOO: serieCOO.toFixed(3),
  //   serieDE: serieDE.toFixed(3),
  //   serieTotal: (serieTDL + serieCOO + serieDE).toFixed(3),

  //   // ==========================
  //   // Industrilization only (Puuting zero because no contributing coming from Industrilization from 3d activity)
  //   indusTDL: 0, //TDL
  //   indusCOO: 0,
  //   indusDE: 0,
  //   indusTotal: 0, // as per your  victor new logic ( no 20 % proto , No 20% serie . Industrilization will take it seperately )

  //   // ==========================
  //   // combined total (HCC only)
  //   TDL: (protoTDL + serieTDL + indusTDL).toFixed(3),  // We Setting in this way because ealier logic was taking 20% 20% (Logic no more related to 20%)
  //   COO: totalCOO.toFixed(3),
  //   DE: totalDE.toFixed(3),
  //   Total: (
  //     protoTDL +
  //     serieTDL +
  //     indusTDL +
  //     totalCOO +
  //     totalDE
  //   ).toFixed(3),
  // };

  //Old
  // return {
  //   // proto only
  //   protoTDL: protoTDL.toFixed(3),
  //   protoCOO: protoCOO.toFixed(3),
  //   protoDE: protoDE.toFixed(3),
  //   protoTotal: (protoTDL + protoCOO + protoDE).toFixed(3),

  //   // serie only
  //   serieTDL: serieTDL.toFixed(3),
  //   serieCOO: serieCOO.toFixed(3),
  //   serieDE: serieDE.toFixed(3),
  //   serieTotal: (serieTDL + serieCOO + serieDE).toFixed(3),

  //   //===================================
  //   // Industrilization only
  //   indusTDL: 0,
  //   indusCOO: 0,
  //   indusDE: 0,
  //   indusTotal: indusTotalActive, // 10 %  define
  //   //==================================

  //   // combined total
  //   TDL: totalTDL.toFixed(3),
  //   COO: totalCOO.toFixed(3),
  //   DE: totalDE.toFixed(3),
  //   Total: (totalTDL + totalCOO + totalDE).toFixed(3),
  // };
}

/**
 * TDL bifurcation logic () 
 *
 * HCC  -> TDL
 * BCC  -> Technical Design Leader Combined
 
 */
function calculateTDLBifurcation(
  offerTDL,
  protoTDL,
  serieTDL,
  indusTDL,
  addedTDLPhase34,
) {
  // alert("addedTDLPhase34 :" + addedTDLPhase34);
  const totalTDL = Number(protoTDL ?? 0) + Number(serieTDL ?? 0);

  // If phase 3-4 NOT added → passthrough
  if (!addedTDLPhase34) {
    return {
      proto: { HCC_TDL: protoTDL, BCC_TDLCombined: 0 },
      serie: { HCC_TDL: serieTDL, BCC_TDLCombined: 0 },
      indus: { HCC_TDL: 0, BCC_TDLCombined: 0 },
    };
  }

  // Phase percentage split for TDL only
  const PHASE_SPLIT = {
    // proto: 0.8,  // 80% contribution to Proto
    // serie: 0.8,   // 80% contribution to Serie
    // indus: 0.2,    // 20% contribution to indust

    offer: 1, // 100% contribution to Offer  .(No involment of any thing pure offer 3d seperate table)
    proto: 1, // 100% contribution to Proto  // Logic change from 80% to keep it 100% (1)
    serie: 1, // 100% contribution to Serie  // Logic change from 80% to keep it 100% (1)
    indus: 1, // 1000% contribution to indust  // (No involment of any thing pure offer 3d seperate table)
  };

  // // Center split - hard Coded
  // const CENTER_SPLIT = {
  //   HCC: 0.5, // TDL
  //   BCC: 0.5, // Technical Design Leader Combined
  // };

  //Dyanamic Fetch
  const CENTER_SPLIT =
    CENTER_SPLIT_MAP[addedTDLPhase34] ?? DEFAULT_CENTER_SPLIT;

  // ================================
  // User-friendly alert
  // ================================
  // alert(
  //   `TDL Bifurcation Applied\n\n` +
  //     `Input TDL (Before Split):\n` +
  //     `  Proto TDL : ${Number(protoTDL ?? 0).toFixed(3)}\n` +
  //     `  Serie TDL : ${Number(serieTDL ?? 0).toFixed(3)}\n` +
  //     `  --------------------------------\n` +
  //     `  Total TDL : ${totalTDL.toFixed(3)}\n\n` +
  //     `Configuration Selected:\n` +
  //     `  ${addedTDLPhase34}\n\n` +
  //     `Center Split Applied (on each phase):\n` +
  //     `  HCC : ${(CENTER_SPLIT.HCC * 100).toFixed(0)}%\n` +
  //     `  BSS : ${(CENTER_SPLIT.BCC * 100).toFixed(0)}%\n\n` +
  //     `Phase Split Applied (on Total TDL):\n` +
  //     `  Proto            : ${(PHASE_SPLIT.proto * 100).toFixed(0)}%\n` +
  //     `  Serie            : ${(PHASE_SPLIT.serie * 100).toFixed(0)}%\n` +
  //     `  Industrialization: ${(PHASE_SPLIT.indus * 100).toFixed(0)}%\n\n`,
  // );

  // here HCC --> "TDL"
  // here BCC --> "Technical Design Leader Combined"

  //-----OFFER------

  const offerBase = offerTDL * PHASE_SPLIT.offer;
  const offerHCC_TDL = offerBase * CENTER_SPLIT.HCC;
  const offerBCC_TDLCombined = offerBase * CENTER_SPLIT.BCC;

  // ----- PROTO -----
  const protoBase = protoTDL * PHASE_SPLIT.proto;
  const protoHCC_TDL = protoBase * CENTER_SPLIT.HCC;
  const protoBCC_TDLCombined = protoBase * CENTER_SPLIT.BCC;

  // ----- SERIE -----
  const serieBase = serieTDL * PHASE_SPLIT.serie;
  const serieHCC_TDL = serieBase * CENTER_SPLIT.HCC;
  const serieBCC_TDLCombined = serieBase * CENTER_SPLIT.BCC;

  // ----- INDUSTRIALIZATION -----
  //const indusBase = protoTDL * PHASE_SPLIT.indus + serieTDL * PHASE_SPLIT.indus;  //old Because contribution was coming (20 %) from proto serie.

  //As New Logic Its not coming any contribution from proto serie

  const indusBase = indusTDL;
  const indusHCC_TDL = indusBase * CENTER_SPLIT.HCC;
  const indusBCC_TDLCombined = indusBase * CENTER_SPLIT.BCC;

  // alert(
  //   "HCC ==> Proto :" +
  //     protoHCC_TDL +
  //     "Serie :" +
  //     serieHCC_TDL +
  //     "Indus :" +
  //     indusHCC_TDL +
  //     "\n\n" +
  //     "BCC ==> Proto :" +
  //     protoBCC_TDLCombined +
  //     "Serie :" +
  //     serieBCC_TDLCombined +
  //     "Indus :" +
  //     indusBCC_TDLCombined,
  // );

  return {
    offer: {
      HCC_TDL: offerHCC_TDL,
      BCC_TDLCombined: offerBCC_TDLCombined,
    },

    proto: {
      HCC_TDL: protoHCC_TDL,
      BCC_TDLCombined: protoBCC_TDLCombined,
    },

    serie: {
      HCC_TDL: serieHCC_TDL,
      BCC_TDLCombined: serieBCC_TDLCombined,
    },

    indus: {
      HCC_TDL: indusHCC_TDL,
      BCC_TDLCombined: indusBCC_TDLCombined,
    },
  };
}

//==============================3d End==============================================

//=================================2d start=======================================
/**
 * Placeholder methods for other groups
 */
function calculate2DDeliverables_OLD(activityDetails, globalFlags) {
  //Write logic of 2d

  // Basic logic is
  // Product(Specific) forActivity (FSS or BTP)  * (Percentage of Product(Specific) mentioned in 2D standar Sheet ) * Number oF Component

  return {};
}

// vp10
function calculate2DDeliverablesV8P10(
  activityName,
  activityDetails,
  globalFlags,
  phaseFlags = {},
) {
  // alert(activityName);
  //----Alreat-------
  if (!globalFlags || typeof globalFlags !== "object") {
    alert("No Global Flags available for 2d");
    return;
  }

  let message = "Global Flags Summary:\n\n";

  Object.entries(globalFlags).forEach(([key, value]) => {
    // alert(`key : ${key} : value : ${value}\n`);
    message += `${key} : ${value}\n`;
  });

  // alert(message);
  // alert(globalFlags.product);
  // alert(globalFlags.Customer);
  //alert(globalFlags["Type Of Development"]);
  //-----------------

  /*
  ✅ Step-by-step Logic

    1.Filter out ignored keys → only keep product objects
    2.Pick the first product
    3.Get the activity values (TDL, COO, DE…)
    4.Return/proceed with just that product’s data

  */
  console.log(
    "================== 111calculate2DDeliverables11 ================================" +
    JSON.stringify(activityDetails),
  );

  const activityNameFilter =
    activityName.split("|")[1]?.trim() || activityName.trim();
  //alert(globalFlags.typeOfDevelopment);
  // Calling this method which will give us final value for product and Development Specific
  const result = getDrawingValueBasedOnDev({
    typeOfDevelopment: globalFlags["Type Of Development"],
    product: globalFlags.product,
    activity: activityNameFilter,
  });

  //Hard Coded for testing :
  const result1 = getDrawingValueBasedOnDev({
    typeOfDevelopment: "FSS",
    product: "OHS",
    activity: activityNameFilter,
  });

  console.log(result);

  // Keys we don't want to consider as products
  const ignoreKeys = [
    "extraWorkLoop",
    "reWorkLoop",
    "standardLoop",
    "checked",
    "order",
    "noOfLoops",
    "Proto",
    "Serie",
  ];
  // 1️⃣ Filter keys that are actual products
  const productKeys = Object.keys(activityDetails).filter(
    (key) => !ignoreKeys.includes(key),
  );

  if (productKeys.length === 0) return null;

  // 2️⃣ Pick the first product
  const firstProductKey = productKeys[0];
  const productData = activityDetails[firstProductKey];

  // 3️⃣ Extract only useful info
  const { TDL, COO, DE, Proto, Serie } = productData;

  console.log(" First Product Key:", firstProductKey);
  console.log(" Product Data:", { TDL, COO, DE, Proto, Serie });

  const percent = 7.5; // this Percent Multiple for headliner  .
  //alert(+result + "*" + Proto + " * (1.075)");
  var sum = result * Proto * 1.075;

  //eg :globalFlags.product is Headliner
  const typeOfDevelopmentFSS_or_BTP = globalFlags["Type Of Development"];
  const weights =
    _2D_PRECENTAGE_PRODUCT_WEIGHTS[
    "Headliner" + "_" + typeOfDevelopmentFSS_or_BTP
    ]; //Percentga
  //alert("2d sum :" + sum);
  // alert(weights.phase1 + "|||" + weights.phase2 + "|||" + weights.phase3);

  const protoTotalActive = phaseFlags["phase_1"] ? sum * weights.phase1 : 0;
  const serieTotalActive = phaseFlags["phase_2"] ? sum * weights.phase2 : 0;
  const indusTotalActive = phaseFlags["phase_3_4"] ? sum * weights.phase3 : 0;

  // alert("sum :" + sum);
  return {
    // proto only
    protoTDL: 0,
    protoCOO: 0,
    protoDE: 0,
    protoTotal: protoTotalActive, // 50 %  define

    // serie only
    serieTDL: 0,
    serieCOO: 0,
    serieDE: 0,
    serieTotal: serieTotalActive, // 40 %  define

    // Industrilization only
    indusTDL: 0,
    indusCOO: 0,
    indusDE: 0,
    indusTotal: indusTotalActive, // 10 %  define

    // combined total
    TDL: 0,
    COO: 0,
    DE: 0,
    Total: protoTotalActive + serieTotalActive + indusTotalActive, // 100 %
  };
}

// v8p13
function calculate2DDeliverables(
  activityName,
  activityDetails,
  globalFlags,
  phaseFlags = {},
) {
  console.log(" calculate2DDeliverables as per v8p13");
  // alert(acti
  // zvityName);
  //----Alreat-------
  if (!globalFlags || typeof globalFlags !== "object") {
    alert("No Global Flags available for 2d");
    return;
  }

  let message = "Global Flags Summary:\n\n";

  Object.entries(globalFlags).forEach(([key, value]) => {
    // alert(`key : ${key} : value : ${value}\n`);
    message += `${key} : ${value}\n`;
  });

  // alert(message);
  // alert(globalFlags.product);
  // alert(globalFlags.Customer);
  //alert(globalFlags["Type Of Development"]);
  //-----------------

  /*
  ✅ Step-by-step Logic
 
    1.Filter out ignored keys → only keep product objects
    2.Pick the first product
    3.Get the activity values (TDL, COO, DE…)
    4.Return/proceed with just that product’s data
 
  */
  console.log(
    "================== 111calculate2DDeliverables11 ================================" +
    JSON.stringify(activityDetails),
  );

  const activityNameFilter =
    activityName.split("|")[1]?.trim() || activityName.trim();
  //alert(globalFlags.typeOfDevelopment);
  // Calling this method which will give us final value for product and Development Specific
  const result = getDrawingValueBasedOnDev({
    typeOfDevelopment: globalFlags["Type Of Development"],
    product: globalFlags.product,
    activity: activityNameFilter,
  });

  //Hard Coded for testing :
  const result1 = getDrawingValueBasedOnDev({
    typeOfDevelopment: "FSS",
    product: "OHS",
    activity: activityNameFilter,
  });

  console.log(result);

  // Keys we don't want to consider as products
  const ignoreKeys = [
    "extraWorkLoop",
    "reWorkLoop",
    "standardLoop",
    "checked",
    "order",
    "noOfLoops",
    "Proto",
    "Serie",
  ];
  //  Filter keys that are actual products
  const productKeys = Object.keys(activityDetails).filter(
    (key) => !ignoreKeys.includes(key),
  );

  if (productKeys.length === 0) return null;

  //  Pick the first product
  const firstProductKey = productKeys[0];
  const productData = activityDetails[firstProductKey];

  //  Extract only useful info
  const { TDL, COO, DE, Proto, Serie } = productData;

  console.log(" First Product Key:", firstProductKey);
  console.log(" Product Data:", { TDL, COO, DE, Proto, Serie });

  const percent = 7.5; // this Percent Multiple for headliner  .
  //alert(+result + "*" + Proto + " * (1.075)");
  var sum = result * Proto * 1.075;

  //eg :globalFlags.product is Headliner
  // by default
  const typeOfDevelopmentFSS_or_BTP = globalFlags["Type Of Development"];
  //  alert("Headliner_" + typeOfDevelopmentFSS_or_BTP );
  const weights =
    _2D_PRECENTAGE_PRODUCT_WEIGHTS[
    "Headliner" + "_" + typeOfDevelopmentFSS_or_BTP
    ]; //Percentga
  //alert("2d sum :" + sum);
  //alert(weights.phase1 + "|||" + weights.phase2 + "|||" + weights.phase3);

  const protoTotalActive = phaseFlags["phase_1"] ? sum * weights.phase1 : 0;
  const originalSerieTotalActive = phaseFlags["phase_2"]
    ? sum * weights.phase2
    : 0;
  const indusTotalActive = phaseFlags["phase_3_4"] ? sum * weights.phase3 : 0;

  // final value   : Storing final Calculated Result of Serie
  let serieTotalActive = originalSerieTotalActive;

  // Minimal adjustment logic  as per new chnages in (v8p13 )
  // If Proto OFF and Serie ON → transfer Proto hours to Serie
  if (!phaseFlags["phase_1"] && phaseFlags["phase_2"]) {
    serieTotalActive = originalSerieTotalActive + sum * weights.phase1;
  }

  // alert("sum :" + sum);
  return {
    // Store loops for PDF
    protoLoopForPDF: Proto || 0,
    seriLoopForPDF: Proto || 0,

    // proto only
    protoTDL: 0,
    protoCOO: 0,
    protoDE: 0,
    protoTotal: protoTotalActive, // 50 %  define

    // serie only
    serieTDL: 0,
    serieCOO: 0,
    serieDE: 0,
    serieTotal: serieTotalActive, // 40 %  define

    // Industrilization only
    indusTDL: 0,
    indusCOO: 0,
    indusDE: 0,
    indusTotal: indusTotalActive, // 10 %  define

    // combined total
    TDL: 0,
    COO: 0,
    DE: 0,
    Total: protoTotalActive + serieTotalActive + indusTotalActive, // 100 %
  };
}

function calculate2DDeliverables_new_Not_working(
  activityName,
  activityDetails,
  globalFlags,
) {
  console.log("====================================================");
  console.log("=== ▶ START 2D ACTIVITY CALCULATION (2D Logic) ===");
  console.log("====================================================\n");

  if (globalFlags["2D"] === "NO") {
    console.log("🚫 Global 2D = NO → Entire SOW becomes 0");
    return { productResults: {}, grandTotal: 0 };
  }

  let grandTotal = 0;
  const productResults = {};

  for (const [productName, product] of Object.entries(activityDetails)) {
    if (!isProductKey(productName)) continue;

    console.log(`\n==================================`);
    console.log(`=== PRODUCT PART: ${productName} ===`);
    console.log("==================================");

    const numComponents = 1; //Number(product.numComponents || 1);
    const baseValue = 20; ///Number(product.baseValue || 0);
    const percentage = 7.5; //Number(product.twoDPercentage || 0);

    // console.log(`  → Components: ${numComponents}`);
    // console.log(`  → Base Product Value: ${baseValue}`);
    // console.log(`  → 2D % from Standard Sheet: ${percentage}%`);

    const perProductSOW = baseValue * (percentage / 100);
    const totalSOW = perProductSOW * numComponents;

    console.log(
      `  → SOW = ${baseValue} * (${percentage}/100) * ${numComponents} = ${totalSOW}`,
    );

    productResults[productName] = {
      perProductSOW: Number(perProductSOW.toFixed(3)),
      numComponents,
      totalSOW: Number(totalSOW.toFixed(3)),
    };

    grandTotal += totalSOW;
  }

  console.log("\n=============================");
  console.log("=== ▶ FINAL 2D TOTAL SOW ===");
  console.log("=============================\n");
  console.log(`Grand Total SOW = ${grandTotal}`);

  return {
    productResults,
    grandTotal: Number(grandTotal.toFixed(3)),
  };
}

//=================================2d End =======================================

//=================================DM start======================================
function calculateDataManagement1(activityDetails, globalFlags) {
  //  return {};

  return {
    // proto only
    protoTDL: 100,
    protoCOO: 200,
    protoDE: 300,
    protoTotal: 1000,

    // serie only
    serieTDL: 500,
    serieCOO: 600,
    serieDE: 700,
    serieTotal: 2000,

    // combined total
    TDL: 510,
    COO: 520,
    DE: 530,
    Total: 1000,
  };
}
function calculateDataManagement(
  activityName,
  activityDetails,
  globalFlags,
  phaseFlags = {},
) {
  // alert(
  //   activityName + ":" + JSON.stringify(activityDetails) + ":" + globalFlags
  // );

  //----Alreat-------
  if (!globalFlags || typeof globalFlags !== "object") {
    alert("No Global Flags available for DM");
    return;
  }

  let message = "Global Flags Summary:\n\n";

  Object.entries(globalFlags).forEach(([key, value]) => {
    // alert(`key : ${key} : value : ${value}\n`);
    message += `${key} : ${value}\n`;
  });

  // alert(message);
  // alert(globalFlags.product);
  // alert(globalFlags.Customer);
  //alert(globalFlags["Type Of Development"]);
  //-----------------

  /*
  ✅ Step-by-step Logic

    1.Filter out ignored keys → only keep product objects
    2.Pick the first product
    3.Get the activity values (TDL, COO, DE…)
    4.Return/proceed with just that product’s data

  */
  // console.log(
  //   "================== calculate Data Management ================================" +
  //     JSON.stringify(activityDetails)
  // );

  const activityNameFilter =
    activityName.split("|")[1]?.trim() || activityName.trim();
  //alert(globalFlags.typeOfDevelopment);
  // Calling this method which will give us final value for product and Development Specific

  // alert(
  //   "Global: " +
  //     JSON.stringify(globalFlags) + // FSS / BTP
  //     "typeOfDevelopment: " +
  //     globalFlags["Type Of Development"] + // FSS / BTP
  //     " ||| product: " +
  //     globalFlags.product + // Headliner, Door Panel, etc.
  //     " ||| customer: " +
  //     globalFlags.Customer // Audi, Mahindra, etc.
  // );

  const ConstanthoursResult = getDataManagementConstantValueBasedOnDevProdCust({
    typeOfDevelopment: globalFlags["Type Of Development"], // eg FSS / BTP
    customer: globalFlags.product, // eg "Headliner" , "Door Panel" etc
    oem: globalFlags.Customer, //Customer - Audi , Mahindra etc
  });

  // alert("ConstanthoursResult :" + ConstanthoursResult);
  console.log(ConstanthoursResult); // 130

  //Hard Coded for testing :
  const ConstanthoursResult1 = getDataManagementConstantValueBasedOnDevProdCust(
    {
      typeOfDevelopment: "FSS",
      customer: "Headliner",
      oem: "Audi",
    },
  );

  // Keys we don't want to consider as products
  const ignoreKeys = [
    "extraWorkLoop",
    "reWorkLoop",
    "standardLoop",
    "checked",
    "order",
    "noOfLoops",
    "Proto",
    "Serie",
  ];
  // 1️⃣ Filter keys that are actual products
  const productKeys = Object.keys(activityDetails).filter(
    (key) => !ignoreKeys.includes(key),
  );

  if (productKeys.length === 0) return null;

  // 2️⃣ Pick the first product
  const firstProductKey = productKeys[0];
  const productData = activityDetails[firstProductKey];

  // 3️⃣ Extract only useful info
  const { TDL, COO, DE, Proto, Serie } = productData;

  console.log(" First Product Key:", firstProductKey);
  console.log(" Product Data:", { TDL, COO, DE, Proto, Serie });

  //const percent = 7.5; // Not Require here
  const assy = Proto; // This will take it from Proto/ Seried (Bith have Same value in sycn)
  //alert(+result + "*" + Proto + " * (1.075)");
  var sum = ConstanthoursResult * assy;
  //eg :globalFlags.product is Headliner
  // by default

  const weights = DM_PRECENTAGE_PRODUCT_WEIGHTS["Headliner"]; //Percentage fo DM (Product wise)

  //alert("2d sum :" + sum);
  // alert(weights.phase1 + "|||" + weights.phase2 + "|||" + weights.phase3);

  const protoTotalActive = phaseFlags["phase_1"] ? sum * weights.phase1 : 0;
  const serieTotalActive = phaseFlags["phase_2"] ? sum * weights.phase2 : 0;
  const indusTotalActive = phaseFlags["phase_3_4"] ? sum * weights.phase3 : 0;

  // alert("sum :" + sum);
  return {
    // proto only
    protoTDL: 0,
    protoCOO: 0,
    protoDE: 0,
    protoTotal: protoTotalActive, // 50 %  define

    // serie only
    serieTDL: 0,
    serieCOO: 0,
    serieDE: 0,
    serieTotal: serieTotalActive, // 40 %  define

    // Industrilization only
    indusTDL: 0,
    indusCOO: 0,
    indusDE: 0,
    indusTotal: indusTotalActive, // 10 %  define

    // combined total
    TDL: 0,
    COO: 0,
    DE: 0,
    Total: protoTotalActive + serieTotalActive + indusTotalActive, // 100 %
  };

  //Hard Coded :
  // //alert("Sum for DM :" + sum);
  // // alert("sum :" + sum);
  // return {
  //   // proto only
  //   protoTDL: 0,
  //   protoCOO: 0,
  //   protoDE: 0,
  //   protoTotal: sum * 0.5, // 50%

  //   // serie only
  //   serieTDL: 0,
  //   serieCOO: 0,
  //   serieDE: 0,
  //   serieTotal: sum * 0.4, //  40 %

  //   // combined total
  //   TDL: 0,
  //   COO: 0,
  //   DE: 0,
  //   Total: sum * 0.5 + sum * 0.4 + sum * 0.1, // 50% + 40 % + 10% = 100%
  // };
}

//=================================DM End========================================

//=================================GS start======================================
function calculateGeometricalStudy1(activityDetails, globalFlags) {
  //Write logic of GeometricalStudy
  //return {};

  return {
    // proto only
    protoTDL: 155,
    protoCOO: 255,
    protoDE: 355,
    protoTotal: 105,

    // serie only
    serieTDL: 55,
    serieCOO: 65,
    serieDE: 75,
    serieTotal: 205,

    // combined total
    TDL: 515,
    COO: 525,
    DE: 535,
    Total: 1005,
  };
}

function calculateGeometricalStudy(activityName, activityDetails, globalFlags, phaseFlags = {},) {
  // ======================================================
  // Validate Global Flags
  // ======================================================
  if (!globalFlags || typeof globalFlags !== "object") {
    return null;
  }
  // ======================================================
  // Remove Category Prefix
  // Example:
  // "GEOMETRICAL STUDY | Section Analysis"
  //            ↓
  // "Section Analysis"
  // ======================================================
  const activityNameFilter = activityName.split("|")[1]?.trim() || activityName.trim();
  // ======================================================
  // Initialize Running Totals
  // ======================================================
  let protoTDL = 0,
    protoCOO = 0,
    protoDE = 0;
  let serieTDL = 0,
    serieCOO = 0,
    serieDE = 0;
  // Used while generating PDF
  let protoLoopForPDF = 0;
  let seriLoopForPDF = 0;
  // ======================================================
  // Apply Global YES / NO Flags not Utilizing this Global
  // because there is no dependency of Geometric Study with TDL COO DE
  // SO we will ingore its Global Impact
  //
  // ======================================================
  const gTDL = globalFlags.TDL ? 1 : 0;
  const gCOO = globalFlags.COO ? 1 : 0;
  const gDE = globalFlags.DE ? 1 : 0;
  // ======================================================
  // Iterate through ALL Product Parts
  //
  // Unlike 3D Deliverables, Geometrical Study does NOT
  // contain Sub-Activities.
  //
  // Therefore, calculations are performed directly at
  // Product Level.
  // ======================================================
  for (const [productName, product] of Object.entries(activityDetails)) {
    // Ignore configuration keys
    if (!isProductKey(productName)) continue;
    console.log("\n==================================");
    console.log(`=== PRODUCT PART : ${productName} ===`);
    console.log("==================================");
    const noOfComponent = product.noOfComponent || 1;
    // ------------------------------------------------------
    // Apply Global Filters
    // ------------------------------------------------------
    const pTDL = Number(product.TDL || 0);
    const pCOO = Number(product.COO || 0);
    const pDE = Number(product.DE || 0);
    console.log(`After Global Filter → TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`,);
    // ------------------------------------------------------
    // Skip if Product is not selected
    // ------------------------------------------------------
    if (product.componentSelected) {
      // alert(productName + "| Component  selected ==> " + product.componentSelected)
    } else if (!product.componentSelected) {
      // alert(productName + "Component  not selected. ..."+product.componentSelected)
      continue;
    }
    // ------------------------------------------------------
    // Product Level Loops
    // ------------------------------------------------------
    const protoLoop = Number(product.Proto || 0);
    const serieLoop = Number(product.Serie || 0);
    console.log(`Proto Loop = ${protoLoop}`);
    console.log(`Serie Loop = ${serieLoop}`);
    console.log(`Components = ${noOfComponent}`);
    // ------------------------------------------------------
    // Prototype Calculation
    //
    // Formula:
    // Hours = Base Hours × Loop × Components
    // ------------------------------------------------------
    const pTDLcalc = pTDL * protoLoop * noOfComponent;
    const pCOOcalc = pCOO * protoLoop * noOfComponent;
    const pDEcalc = pDE * protoLoop * noOfComponent;
    console.log(`Geometrical Study → Proto Calculation: TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,);
    protoTDL += pTDLcalc;
    protoCOO += pCOOcalc;
    protoDE += pDEcalc;
    // ------------------------------------------------------
    // Series Calculation
    //
    // Formula:
    // Hours = Base Hours × Loop × Components
    // ------------------------------------------------------
    const sTDLcalc = pTDL * serieLoop * noOfComponent;
    const sCOOcalc = pCOO * serieLoop * noOfComponent;
    const sDEcalc = pDE * serieLoop * noOfComponent;
    serieTDL += sTDLcalc;
    serieCOO += sCOOcalc;
    serieDE += sDEcalc;
    // ------------------------------------------------------
    // Store Active Loops
    // Used while generating PDF
    // ------------------------------------------------------
    protoLoopForPDF = protoLoop;
    seriLoopForPDF = serieLoop;
    console.log(`Proto → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`,);
    console.log(`Serie → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`,);
  }
  // ======================================================
  // Apply Phase Flags
  //
  // Only include Prototype/Series values if the
  // corresponding phase is enabled.
  // ======================================================
  const protoTDLActive = phaseFlags["phase_1"] ? protoTDL : 0;
  const protoCOOActive = phaseFlags["phase_1"] ? protoCOO : 0;
  const protoDEActive = phaseFlags["phase_1"] ? protoDE : 0;
  const serieTDLActive = phaseFlags["phase_2"] ? serieTDL : 0;
  const serieCOOActive = phaseFlags["phase_2"] ? serieCOO : 0;
  const serieDEActive = phaseFlags["phase_2"] ? serieDE : 0;
  const protoTotalActive = protoTDLActive + protoCOOActive + protoDEActive;
  const serieTotalActive = serieTDLActive + serieCOOActive + serieDEActive;
  // Geometrical Study currently has no Industry Phase
  const indusTDL = 0;
  const indusCOO = 0;
  const indusDE = 0;
  const indusTotal = 0;

  // ======================================================
  // Return Final Result
  // ======================================================
  return {
    protoLoopForPDF,
    seriLoopForPDF,
    protoTDL: protoTDLActive,
    protoCOO: protoCOOActive,
    protoDE: protoDEActive,
    protoTotal: protoTotalActive,
    serieTDL: serieTDLActive,
    serieCOO: serieCOOActive,
    serieDE: serieDEActive,
    serieTotal: serieTotalActive,
    indusTDL,
    indusCOO,
    indusDE,
    indusTotal,
    TDL: protoTDLActive + serieTDLActive,
    COO: protoCOOActive + serieCOOActive,
    DE: protoDEActive + serieDEActive,
    Total: protoTotalActive + serieTotalActive + indusTotal,
  };
}

//=================================GS End=========================================

//===========Start = Aggregating all activity in group and returing its total ============
export function aggregateSummary1(items, label = "TOTAL", data = {}) {
  //alert(label + ": items  : " + JSON.stringify(items));
  const sum = {
    activityName: label,

    protoTDL: 0,
    protoCOO: 0,
    protoDE: 0,
    protoTotal: 0,

    serieTDL: 0,
    serieCOO: 0,
    serieDE: 0,
    serieTotal: 0,

    indusTDL: 0,
    indusCOO: 0,
    indusDE: 0,
    indusTotal: 0,

    TDL: 0,
    COO: 0,
    DE: 0,
    Total: 0,
  };

  // var protoPhaseMultiplier = 0;
  // var seriePhaseMultiplier = 0;
  // alert(
  //   "data.phaseFlags.phase_1 :" +
  //     JSON.stringify(data.phaseFlags.phase_1) +
  //     "|||" +
  //     JSON.stringify(data.phaseFlags.phase_2)
  // );

  // ✅ SAFE multipliers (no crash ever)
  const protoPhaseMultiplier = data?.phaseFlags?.phase_1 === true ? 1 : 0;

  const seriePhaseMultiplier = data?.phaseFlags?.phase_2 === true ? 1 : 0;

  const indusPhaseMultiplier = data?.phaseFlags?.phase_3_4 === true ? 1 : 0;

  items.forEach((item = {}) => {
    // PROTO
    sum.protoTDL += Number(item.protoTDL ?? 0) * protoPhaseMultiplier;
    sum.protoCOO += Number(item.protoCOO ?? 0) * protoPhaseMultiplier;
    sum.protoDE += Number(item.protoDE ?? 0) * protoPhaseMultiplier;
    sum.protoTotal += Number(item.protoTotal ?? 0) * protoPhaseMultiplier;

    // SERIE
    sum.serieTDL += Number(item.serieTDL ?? 0) * seriePhaseMultiplier;
    sum.serieCOO += Number(item.serieCOO ?? 0) * seriePhaseMultiplier;
    sum.serieDE += Number(item.serieDE ?? 0) * seriePhaseMultiplier;
    sum.serieTotal += Number(item.serieTotal ?? 0) * seriePhaseMultiplier;

    // Industrilization
    sum.indusTDL += Number(item.indusTDL ?? 0) * indusPhaseMultiplier;
    sum.indusCOO += Number(item.indusCOO ?? 0) * indusPhaseMultiplier;
    sum.indusDE += Number(item.indusDE ?? 0) * indusPhaseMultiplier;
    sum.indusTotal += Number(item.indusTotal ?? 0) * indusPhaseMultiplier;

    // OVERALL
    sum.TDL += Number(item.TDL ?? 0);
    sum.COO += Number(item.COO ?? 0);
    sum.DE += Number(item.DE ?? 0);
    sum.Total += Number(item.Total ?? 0);
  });

  // format output
  Object.keys(sum).forEach((key) => {
    if (key !== "activityName") {
      sum[key] = sum[key].toFixed(3);
    }
  });

  return sum;
}

function aggregateSummary(
  items = [],
  label = "TOTAL",
  data = {},
  bifurcationConfig = null,
) {
  //Setting Default Reyurn payload for all Aggregated 3d, 3D, DM, GM
  const sum = {
    activityName: label,

    //  OFFER
    offerTDL: 0,
    offerCOO: 0,
    offerDE: 0,
    offerTotal: 0,

    protoTDL: 0,
    protoCOO: 0,
    protoDE: 0,
    protoTotal: 0,

    serieTDL: 0,
    serieCOO: 0,
    serieDE: 0,
    serieTotal: 0,

    indusTDL: 0,
    indusCOO: 0,
    indusDE: 0,
    indusTotal: 0,

    TDL: 0,
    COO: 0,
    DE: 0,
    Total: 0,
  };

  // Based on which phase is active we are handling to show the calculated value or not show
  const offerPhaseMultiplier = data?.phaseFlags?.phase_0 === true ? 1 : 0;
  const protoPhaseMultiplier = data?.phaseFlags?.phase_1 === true ? 1 : 0;
  const seriePhaseMultiplier = data?.phaseFlags?.phase_2 === true ? 1 : 0;
  const indusPhaseMultiplier = data?.phaseFlags?.phase_3_4 === true ? 1 : 0;

  /* ===== OFFER (part of 3D TOTAL) ===== */

  // For 3D Activity : Offer and industrilziation Contribution comes form different table not for Activities
  // 3D TOTAL  ==> handlying TDL only (i.e HCC)
  // 3D TOTAL TechnicalDesignLeaderCombined ==> handlying TDL only (i.e BCC)
  if (
    label === "3D TOTAL" ||
    label === "3D TOTAL TechnicalDesignLeaderCombined"
  ) {
    // ==================== OFFER (independent) ====================
    if (Array.isArray(data?.offerRows)) {
      const offer = collectOfferTotals(data.offerRows);

      //  alert("offer==1=>"+ JSON.stringify(offer ))

      const offerTDL = Number(offer.TDL ?? 0) * offerPhaseMultiplier;
      const offerCOO = Number(offer.COO ?? 0) * offerPhaseMultiplier;
      const offerDE = Number(offer.DE ?? 0) * offerPhaseMultiplier;
      const offerTotal = Number(offer.Total ?? 0) * offerPhaseMultiplier;

      sum.offerTDL = offerTDL;
      sum.offerCOO = offerCOO;
      sum.offerDE = offerDE;
      sum.offerTotal = offerTotal;

      sum.TDL += offerTDL;
      sum.COO += offerCOO;
      sum.DE += offerDE;
      sum.Total += offerTotal;
    }

    // ==================== INDUSTRIALIZATION (independent) ====================
    if (Array.isArray(data?.industrializationRows)) {
      const industrialization = collectOfferTotals(data.industrializationRows); //collectindustrializationTotals(data.industrializationRows);
      const indTDL = Number(industrialization.TDL ?? 0) * indusPhaseMultiplier;
      const indCOO = Number(industrialization.COO ?? 0) * indusPhaseMultiplier;
      const indDE = Number(industrialization.DE ?? 0) * indusPhaseMultiplier;
      const indTotal =
        Number(industrialization.Total ?? 0) * indusPhaseMultiplier;

      sum.indusTDL = indTDL;
      sum.indusCOO = indCOO;
      sum.indusDE = indDE;
      sum.indusTotal = indTotal;

      sum.TDL += indTDL;
      sum.COO += indCOO;
      sum.DE += indDE;
      sum.Total += indTotal;
    }
  }

  if (label === "DATA MANAGEMENT TOTAL") {
    // ==================== DM (independent) ====================
    if (Array.isArray(data?.dataManagementRows)) {
      const offer = collectDMTotals(data.dataManagementRows);
      // alert("offer DM==1=>" + JSON.stringify(offer));

      const offerTDL = Number(offer.TDL ?? 0) * offerPhaseMultiplier;
      const offerCOO = Number(offer.COO ?? 0) * offerPhaseMultiplier;
      const offerDE = Number(offer.DE ?? 0) * offerPhaseMultiplier;
      const offerTotal = Number(offer.Total ?? 0) * offerPhaseMultiplier;

      sum.offerTDL = offerTDL;
      sum.offerCOO = offerCOO;
      sum.offerDE = offerDE;
      sum.offerTotal = offerTotal;

      sum.TDL += offerTDL;
      sum.COO += offerCOO;
      sum.DE += offerDE;
      sum.Total += offerTotal;
    }
  }

  /* ===== OTHER PHASES ===== */
  items.forEach((item = {}) => {
    // setting Proto and Serie and industrilzation phase value for 3d Activity

    sum.protoTDL += Number(item.protoTDL ?? 0) * protoPhaseMultiplier;
    sum.protoCOO += Number(item.protoCOO ?? 0) * protoPhaseMultiplier;
    sum.protoDE += Number(item.protoDE ?? 0) * protoPhaseMultiplier;
    sum.protoTotal += Number(item.protoTotal ?? 0) * protoPhaseMultiplier;

    sum.serieTDL += Number(item.serieTDL ?? 0) * seriePhaseMultiplier;
    sum.serieCOO += Number(item.serieCOO ?? 0) * seriePhaseMultiplier;
    sum.serieDE += Number(item.serieDE ?? 0) * seriePhaseMultiplier;
    sum.serieTotal += Number(item.serieTotal ?? 0) * seriePhaseMultiplier;

    // we have to handle this differently will not work as expectd
    sum.indusTDL += Number(item.indusTDL ?? 0) * indusPhaseMultiplier;
    sum.indusCOO += Number(item.indusCOO ?? 0) * indusPhaseMultiplier;
    sum.indusDE += Number(item.indusDE ?? 0) * indusPhaseMultiplier;
    sum.indusTotal += Number(item.indusTotal ?? 0) * indusPhaseMultiplier;

    sum.TDL += Number(item.TDL ?? 0);
    sum.COO += Number(item.COO ?? 0);
    sum.DE += Number(item.DE ?? 0);
    sum.Total += Number(item.Total ?? 0);
  });

  //Till here all
  // Offer(From seperate table)
  // Proto (From 3d activity),
  // Serie (From 3d activity),,
  // Industrilization(From seperate table)
  // ================= BIFURCATION (Only for 3d . NO for 2d, DM ,GS) =================

  if (
    (bifurcationConfig && label === "3D TOTAL") ||
    label === "3D TOTAL TechnicalDesignLeaderCombined"
  ) {
    //alert("offer==2=>"+ JSON.stringify(   sum.offerTDL + ":"+     sum.protoTDL + ":"+  sum.serieTDL  + ":"+   sum.indusTDL   ))
    const bifurcation = calculateTDLBifurcation(
      sum.offerTDL,
      sum.protoTDL,
      sum.serieTDL,
      sum.indusTDL,
      bifurcationConfig,
    );

    const useBCC = label.includes("TechnicalDesignLeaderCombined");

    //Logic 1:when Label is "3D TOTAL" then set ( hours * HCC% ) for TDL in row
    //Logic 2:when Label is "3D TOTAL TechnicalDesignLeaderCombined" then set ( hours * BCC% ) for TDl in row

    sum.offerTDL = useBCC
      ? bifurcation.offer.BCC_TDLCombined
      : bifurcation.offer.HCC_TDL;

    sum.protoTDL = useBCC
      ? bifurcation.proto.BCC_TDLCombined
      : bifurcation.proto.HCC_TDL;

    sum.serieTDL = useBCC
      ? bifurcation.serie.BCC_TDLCombined
      : bifurcation.serie.HCC_TDL;

    sum.indusTDL = useBCC
      ? bifurcation.indus.BCC_TDLCombined
      : bifurcation.indus.HCC_TDL;
    //alert(useBCC + "TechnicalDesignLeaderCombined offer==2=>"+ JSON.stringify( sum.offerTDL  ))
    //alert(useBCC +"TechnicalDesignLeaderCombined offer==2=>"+ JSON.stringify( sum.offerTDL  ))
    // Recalculate total TDL after override
    sum.TDL = sum.offerTDL + sum.protoTDL + sum.serieTDL + sum.indusTDL;
  }

  return sum;
}
//===========End = Aggregating all activity in group and returing its total ============

// ====offer phase helper which need to add in Aggragtions start===

export function collectOfferTotals(offerRows = []) {
  let TDL = 0;
  let COO = 0;
  let DE = 0;

  offerRows.forEach((row) => {
    const hours = Number(row?.totalHours || 0);

    switch (row?.activityKey) {
      case "TDL":
        TDL += hours;
        break;

      case "3D Coordination":
        COO += hours;
        break;

      case "3D Standard":
        DE += hours;
        break;

      default:
        break;
    }
  });

  return {
    TDL,
    COO,
    DE,
    Total: TDL + COO + DE,
  };
}

export function collectindustrializationTotals(industrializationRows = []) {
  let TDL = 0;
  let COO = 0;
  let DE = 0;

  industrializationRows.forEach((row) => {
    const hours = Number(row?.totalHours || 0);

    switch (row?.activityKey) {
      case "TDL":
        TDL += hours;
        break;

      case "3D Coordination":
        COO += hours;
        break;

      case "3D Standard":
        DE += hours;
        break;

      default:
        break;
    }
  });

  return {
    TDL,
    COO,
    DE,
    Total: TDL + COO + DE,
  };
}

export function collectDMTotals(dataManagementRows = []) {
  let TDL = 0;
  let COO = 0;
  let DE = 0;

  dataManagementRows.forEach((row) => {
    const hours = Number(row?.totalHours || 0);

    switch (row?.activityKey) {
      case "Data Management offer":
        TDL += hours;
        break;

      default:
        break;
    }
  });

  return {
    TDL,
    COO,
    DE,
    Total: TDL + COO + DE,
  };
}

// to get details for what selected and with loops
function createActivityLogger() {
  const log = [];

  return {
    push: (entry) => log.push(entry),
    get: () => log,
  };
}
//=============ENTRY point for Fucntion============================
/**
 * Main calculation dispatcher
 */
//Each Activity is calling 32 method
/*
export function calculateResults_new1(data) {
  alert("1 calculateResults(data)");
  const results = [];

  for (const [activityName, activityDetails] of Object.entries(
    data.activities
  )) {
    if (!activityDetails.checked) continue;

    let activityResult = {};

    // Decide which method to call based on activity type
    if (
      !activityName.startsWith("2D DELIVERABLES") &&
      !activityName.startsWith("DATA MANAGEMENT") &&
      !activityName.startsWith("GEOMETRICAL STUDY")
    ) {
      // activityResult = calculate3DActivity(
      //   activityName,
      //   activityDetails,
      //   data.Global
      // );
      activityResult = calculate3DActivity(activityDetails, data.Global);
    } else if (activityName.startsWith("2D DELIVERABLES")) {
      activityResult = calculate2DDeliverables(
        activityName,
        activityDetails,
        data.Global
      );
    } else if (activityName.startsWith("DATA MANAGEMENT")) {
      activityResult = calculateDataManagement(
        activityName,
        activityDetails,
        data.Global
      );
    } else if (activityName.startsWith("GEOMETRICAL STUDY")) {
      activityResult = calculateGeometricalStudy(activityDetails, data.Global);
    }

    results.push({
      activityName,
      ...activityResult,
    });
  }

  return results;
}
*/
export function calculateResults(data) {
  // alert("1 calculateResults");
  console.log("▶ calculateResults(data) START");

  ////// alert("offerRows 1 :" + data.offerRows);

  // =========================================================
  // GROUPS
  // =========================================================
  const groups = {
    threeD: [],
    twoD: [],
    twoDAntolinDrwaings: [],
    twoDCustomerDrwaings: [],
    dataManagement: [],
    geometricalStudy: [],
  };

  // =========================================================
  // STEP 1: GROUP ACTIVITIES BASED ON PREFIX and then Calling method
  // =========================================================
  for (const [activityName, activityDetails] of Object.entries(
    data.activities,
  )) {
    if (!activityDetails.checked) continue;

    // alert(activityName);

    //Sorting Activity Based StartWith
    // And Calling thier Respective Methods
    //Group them First and then call
    //All 2d = antolin + customer drawings
    if (activityName.startsWith("2D DELIVERABLES")) {
      // alert("Pushed 2D DELIVERABLES :: " + activityName);
      // alert(activityName);
      groups.twoD.push([activityName, activityDetails]);

      //All 2d antolin drawings
      if (
        activityName.startsWith(
          "2D DELIVERABLES | Internal Drawing Main Parts",
        ) ||
        activityName.startsWith("2D DELIVERABLES | COP / Inherit Drawings") ||
        activityName.startsWith("2D DELIVERABLES | Format Drawing") ||
        activityName.startsWith("2D DELIVERABLES | Roll Drawing") ||
        activityName.startsWith("2D DELIVERABLES | NVH Drawing") ||
        activityName.startsWith("2D DELIVERABLES | Internal Assembly Drawings")
      ) {
        // alert("Pushed 2d antolin drawings ::" + activityName);
        groups.twoDAntolinDrwaings.push([
          activityName,
          activityDetails,
          data.Global,
          data.phaseFlags,
        ]);
      }
      //All 2d Customer drawings
      else if (
        activityName.startsWith("2D DELIVERABLES | Customer Part Drawings") ||
        activityName.startsWith("2D DELIVERABLES | Customer Assy Drawings")
      ) {
        // alert("Pushed  2d Customer drawings :: " + activityName);
        groups.twoDCustomerDrwaings.push([
          activityName,
          activityDetails,
          data.Global,
          data.phaseFlags,
        ]);
      }
    } else if (activityName.startsWith("DATA MANAGEMENT")) {
      groups.dataManagement.push([
        activityName,
        activityDetails,
        data.Global,
        data.phaseFlags,
      ]);
    } else if (activityName.startsWith("GEOMETRICAL STUDY")) {
      console.log("Got GeoStudy : ", activityName);
      groups.geometricalStudy.push([activityName, activityDetails]);
    } // 3d DELIVERABLES OR Activity
    else {
      groups.threeD.push([activityName, activityDetails]);
    }
  }

  console.log("▶ Grouping Complete:", groups);

  const results = []; // all Store 3d,2d,dm,gm
  const threeDResults = []; // only store 3d
  const twoDResults = []; // only store 2d
  const twoDAntolinDrwaingsResult = []; // only store  2d Antolin Drwaings
  const twoDCustomerDrwaingsResult = []; // only store  2d Customer Drwaings
  const dataManagementResults = []; // only store DM
  const geometricalStudyResults = []; // only store GM

  //Aggregated Blank array
  var threeDAggregatedTotal = []; // only store aggregated 3d
  var twoDAggregatedTotal = []; // only store aggregated 2d
  var twoDAntolinDrwaingsAggregatedTotal = []; // only store aggregated 2d
  var twoDCustomerDrwaingsAggregatedTotal = []; // only store aggregated 2d
  var dataMgmtAggregatedTotal = []; // only store aggregated  DM
  var geoAggregatedTotal = []; // only store aggregated GM

  //Build selected activity summary list
  const selectedActivitiesSummary = [];
  // =========================================================
  // STEP 2: PROCESS 3D ACTIVITIES
  // =========================================================
  for (const [activityName, activityDetails] of groups.threeD) {
    //calling 3d  one by one activity
    const res = calculate3DActivity(activityName, activityDetails, data.Global);

    //Later you can Take "res" to find only 3d details tdl coo dee as its already from 3d Activity just fetch from object
    // protoTDL , protoCOO , protoDE , protoTotal
    //  serieTDL , serieCOO , serieDE ,serieTotal
    // if (res) results.push({ activityName, ...res }); //This pushes a new object into the results array.

    // Store in the per-item general results array (existing behavior)
    if (res) {
      results.push({ activityName, ...res }); //This pushes a new object into the results array.

      // ALSO store in 3D aggregated array
      threeDResults.push({ activityName, ...res }); //This pushes a new object into the threeDResults array.
    }
  }

  // =========================================================
  // STEP 3: PROCESS 2D DELIVERABLES
  // =========================================================
  for (const [activityName, activityDetails] of groups.twoD) {
    console.log(
      "==================calculate2DDeliverables  all ================================" +
      JSON.stringify(activityDetails) +
      " =>" +
      activityName,
    );

    const res = calculate2DDeliverables(
      activityName,
      activityDetails,
      data.Global,
      data.phaseFlags,
    );

    // Store in the per-item general results array (existing behavior)
    if (res) {
      results.push({ activityName, ...res }); //This pushes a new object into the results array.

      // ALSO store in twoDResults aggregated array
      twoDResults.push({ activityName, ...res }); //This pushes a new object into the twoDResults array.
    }
  }

  // =========================================================
  // STEP 3.1: PROCESS 2D DELIVERABLES : Antolin Drawings only
  // =========================================================
  for (const [activityName, activityDetails] of groups.twoDAntolinDrwaings) {
    console.log(
      "==================calculate2DDeliverables twoDCustomerDrwaings all ================================" +
      JSON.stringify(activityDetails) +
      " =>" +
      activityName,
    );

    // Its calculation in same way , the way all 2d are calculated .
    // Method logic  will same to utilize it
    const res = calculate2DDeliverables(
      activityName,
      activityDetails,
      data.Global,
      data.phaseFlags,
    );

    // Store in the per-item general results array (existing behavior)
    if (res) {
      results.push({ activityName, ...res }); //This pushes a new object into the results array.

      // ALSO store in twoDAntolinDrwaingsResult aggregated array
      twoDAntolinDrwaingsResult.push({ activityName, ...res }); //This pushes a new object into the twoDResults array.
    }
  }

  // =========================================================
  // STEP 3.2: PROCESS 2D DELIVERABLES : Customer  Drawings only
  // =========================================================
  for (const [activityName, activityDetails] of groups.twoDCustomerDrwaings) {
    console.log(
      "==================calculate2DDeliverables activityDetails all ================================" +
      JSON.stringify(activityDetails) +
      " =>" +
      activityName,
    );

    // Its calculation in same way , the way all 2d are calculated .
    // Method logic  will same to utilize it
    const res = calculate2DDeliverables(
      activityName,
      activityDetails,
      data.Global,
      data.phaseFlags,
    );

    // Store in the per-item general results array (existing behavior)
    if (res) {
      results.push({ activityName, ...res }); //This pushes a new object into the results array.

      // ALSO store in twoDAntolinDrwaingsResult aggregated array
      twoDCustomerDrwaingsResult.push({ activityName, ...res }); //This pushes a new object into the twoDResults array.
    }
  }

  // =========================================================
  // STEP 4: PROCESS DATA MANAGEMENT
  // =========================================================
  for (const [activityName, activityDetails] of groups.dataManagement) {
    const res = calculateDataManagement(
      activityName,
      activityDetails,
      data.Global,
      data.phaseFlags,
    );

    // Store in the per-item general results array (existing behavior)
    if (res) {
      results.push({ activityName, ...res }); //This pushes a new object into the results array.

      // ALSO store in dataManagement aggregated array
      dataManagementResults.push({ activityName, ...res }); //This pushes a new object into the dataManagement array.
    }
  }

  // =========================================================
  // STEP 5: PROCESS GEOMETRICAL STUDY
  // =========================================================
  for (const [activityName, activityDetails] of groups.geometricalStudy) {
    // const res = calculateGeometricalStudy(activityDetails, data.Global);
    console.log("GeoStudy start", groups.geometricalStudy);

    const res = calculateGeometricalStudy(
      activityName,
      activityDetails,
      data.Global,
      data.phaseFlags,
    );

    // Store in the per-item general results array (existing behavior)
    if (res) {
      results.push({ activityName, ...res }); //This pushes a new object into the results array.

      // ALSO store in geometricalStudy aggregated array
      geometricalStudyResults.push({ activityName, ...res }); //This pushes a new object into the geometricalStudy array.
    }
  }

  // =========================================================
  // STEP 6: Aggregating all the total for Each
  // =========================================================

  // 🔹 Aggregated totals
  // twoDAggregatedTotal.push(aggregateSummary(threeDResults));
  console.log("What is Data? \n", JSON.stringify(data));

  threeDAggregatedTotal.push(
    // aggregateSummary(threeDResults, "3D TOTAL", data, "HCC 50% BCC 50%"),
    aggregateSummary(
      threeDResults,
      "3D TOTAL",
      data,
      data?.customerProductData?.["3D_TDL (HCC/BCC)"] ?? "HCC 100%",
    ),
  ); // "HCC 100%" "HCC 90% BCC 10%"
  threeDAggregatedTotal.push(
    aggregateSummary(
      threeDResults,
      "3D TOTAL TechnicalDesignLeaderCombined",
      data,
      // "HCC 50% BCC 50%",
      data?.customerProductData?.["3D_TDL (HCC/BCC)"] ?? "HCC 100%",
    ),
  ); // "HCC 100%"

  console.log(
    "TESTING HCC & BCC:",
    JSON.stringify(threeDAggregatedTotal, null, 2),
  );
  const firstData = threeDAggregatedTotal[0];
  sharedRef.cadDE.protoDE = firstData.protoDE;
  sharedRef.cadDE.serieDE = firstData.serieDE;
  // Offer phase (NO activities)

  twoDAggregatedTotal.push(aggregateSummary(twoDResults, "2D TOTAL", data));
  //alert("twoDAggregatedTotal ::" + JSON.stringify(twoDAggregatedTotal));

  twoDAntolinDrwaingsAggregatedTotal.push(
    aggregateSummary(
      twoDAntolinDrwaingsResult,
      "2D ANTOLIN DRAWING TOTAL",
      data,
    ),
  );
  twoDCustomerDrwaingsAggregatedTotal.push(
    aggregateSummary(
      twoDCustomerDrwaingsResult,
      "2D CUSTOMER DRAWING TOTAL",
      data,
    ),
  );
  dataMgmtAggregatedTotal.push(
    aggregateSummary(dataManagementResults, "DATA MANAGEMENT TOTAL", data),
  );
  geoAggregatedTotal.push(
    // this is Dependent on Serie Phase only ? Ask question antolin when working on Door Panel
    aggregateSummary(geometricalStudyResults, "GEOMETRICAL STUDY TOTAL", data),
  );

  console.log("2D and DM Aggregates \n 2D Total : ", twoDAggregatedTotal, "\n 2D Antolin : ", twoDAntolinDrwaingsAggregatedTotal, "\n 2D Customer : ", twoDCustomerDrwaingsAggregatedTotal, "\n DM : ", dataMgmtAggregatedTotal)
  //return results;
  // ✅ RETURN *ALL* RESULT GROUPS IN ONE OBJECT
  return {
    results,
    threeDResults,
    threeDAggregatedTotal,
    twoDResults,
    twoDAggregatedTotal,

    twoDAntolinDrwaingsResult,
    twoDAntolinDrwaingsAggregatedTotal,

    twoDCustomerDrwaingsResult,
    twoDCustomerDrwaingsAggregatedTotal,

    dataManagementResults,
    dataMgmtAggregatedTotal,
    geometricalStudyResults,
    geoAggregatedTotal,
  };
}
