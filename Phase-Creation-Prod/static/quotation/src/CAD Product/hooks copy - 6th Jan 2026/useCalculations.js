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
      `    Raw: TDL=${product.TDL}, COO=${product.COO}, DE=${product.DE}`
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
          `    Base Values (No Mult): TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`
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
          `    Proto Calculation → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`
        );

        // ===== SERIE CALCULATION =====
        const sTDLcalc = baseTDL * serieLoop * noOfComponent;
        const sCOOcalc = baseCOO * serieLoop * noOfComponent;
        const sDEcalc = baseDE * serieLoop * noOfComponent;

        serieTDL += sTDLcalc;
        serieCOO += sCOOcalc;
        serieDE += sDEcalc;

        console.log(
          `    Serie Calculation → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`
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
      `    Raw Product Values: TDL=${product.TDL}, COO=${product.COO}, DE=${product.DE}`
    );
    console.log(
      `    After Applying Global Flags → TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`
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
          `    Base Values (After Global Filter) → TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`
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
          `    Proto → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`
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
          `    Serie → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`
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
    `Total TDL = Proto(${protoTDL}) + Serie(${serieTDL}) = ${totalTDL}`
  );
  console.log(
    `Total COO = Proto(${protoCOO}) + Serie(${serieCOO}) = ${totalCOO}`
  );
  console.log(
    `Total DE  = Proto(${protoDE})  + Serie(${serieDE})  = ${totalDE}`
  );

  // -----------------------------------------------------
  // PRODUCT-LEVEL FINAL SUMMARY (Your Original Code)
  // -----------------------------------------------------
  console.log("\n  → Product-Level (Sum From Below Applied)");

  const pTDL_final = totalTDL;
  const pCOO_final = totalCOO;
  const pDE_final = totalDE;

  console.log(
    `    Final Product-Level Values → TDL=${pTDL_final}, COO=${pCOO_final}, DE=${pDE_final}`
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
      `    Raw Product Values: TDL=${product.TDL}, COO=${product.COO}, DE=${product.DE}`
    );
    console.log(
      `    After Applying Global Flags → TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`
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
          `    Base Values (After Global Filter) → TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`
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
          `    Proto → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`
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
          `    Serie → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`
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
    `Total TDL = Proto(${protoTDL}) + Serie(${serieTDL}) = ${totalTDL}`
  );
  console.log(
    `Total COO = Proto(${protoCOO}) + Serie(${serieCOO}) = ${totalCOO}`
  );
  console.log(
    `Total DE  = Proto(${protoDE})  + Serie(${serieDE})  = ${totalDE}`
  );

  // -----------------------------------------------------
  // PRODUCT-LEVEL FINAL SUMMARY (Your Original Code)
  // -----------------------------------------------------
  console.log("\n  → Product-Level (Sum From Below Applied)");

  const pTDL_final = totalTDL;
  const pCOO_final = totalCOO;
  const pDE_final = totalDE;

  console.log(
    `    Final Product-Level Values → TDL=${pTDL_final}, COO=${pCOO_final}, DE=${pDE_final}`
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
      `    After Global Filter → TDL=${pTDL}, COO=${pCOO}, DE=${pDE}`
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
          `    Base Values (Filtered) → TDL=${baseTDL}, COO=${baseCOO}, DE=${baseDE}`
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
          `    Proto → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`
        );
        console.log(
          `    Serie → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`
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
        "  ⚠ No Subactivities Found → Using PRODUCT level calculation"
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
        `    Proto (Product) → TDL=${pTDLcalc}, COO=${pCOOcalc}, DE=${pDEcalc}`
      );
      console.log(
        `    Serie (Product) → TDL=${sTDLcalc}, COO=${sCOOcalc}, DE=${sDEcalc}`
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
    `Total TDL = Proto(${protoTDL}) + Serie(${serieTDL}) = ${totalTDL}`
  );
  console.log(
    `Total COO = Proto(${protoCOO}) + Serie(${serieCOO}) = ${totalCOO}`
  );
  console.log(
    `Total DE  = Proto(${protoDE})  + Serie(${serieDE})  = ${totalDE}`
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

/**
 * Placeholder methods for other groups
 */
function calculate2DDeliverables_OLD(activityDetails, globalFlags) {
  //Write logic of 2d

  // Basic logic is
  // Product(Specific) forActivity (FSS or BTP)  * (Percentage of Product(Specific) mentioned in 2D standar Sheet ) * Number oF Component

  return {};
}

function calculate2DDeliverables(activityName, activityDetails, globalFlags) {
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
      JSON.stringify(activityDetails)
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
    (key) => !ignoreKeys.includes(key)
  );

  if (productKeys.length === 0) return null;

  // 2️⃣ Pick the first product
  const firstProductKey = productKeys[0];
  const productData = activityDetails[firstProductKey];

  // 3️⃣ Extract only useful info
  const { TDL, COO, DE, Proto, Serie } = productData;

  console.log(" First Product Key:", firstProductKey);
  console.log(" Product Data:", { TDL, COO, DE, Proto, Serie });

  const percent = 7.5;
  //alert(+result + "*" + Proto + " * (1.075)");
  var sum = result * Proto * 1.075;
  // alert("sum :" + sum);
  return {
    // proto only
    protoTDL: 0,
    protoCOO: 0,
    protoDE: 0,
    protoTotal: sum * 0.5,

    // serie only
    serieTDL: 0,
    serieCOO: 0,
    serieDE: 0,
    serieTotal: sum * 0.4,

    // combined total
    TDL: 0,
    COO: 0,
    DE: 0,
    Total: sum * 0.5 + sum * 0.4 + sum * 0.1,
  };
}
function calculate2DDeliverables_new_Not_working(
  activityName,
  activityDetails,
  globalFlags
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
      `  → SOW = ${baseValue} * (${percentage}/100) * ${numComponents} = ${totalSOW}`
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
function calculateDataManagement(activityName, activityDetails, globalFlags) {
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
    }
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
    (key) => !ignoreKeys.includes(key)
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
  alert("sum :" + sum);
  return {
    // proto only
    protoTDL: 0,
    protoCOO: 0,
    protoDE: 0,
    protoTotal: sum * 0.5, // 50%

    // serie only
    serieTDL: 0,
    serieCOO: 0,
    serieDE: 0,
    serieTotal: sum * 0.4, //  40 %

    // combined total
    TDL: 0,
    COO: 0,
    DE: 0,
    Total: sum * 0.5 + sum * 0.4 + sum * 0.1, // 50% + 40 % + 10% = 100%
  };
}

function calculateGeometricalStudy(activityDetails, globalFlags) {
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

export function aggregateSummary(items, label = "TOTAL") {
  // alert(label + ": items  : " + items);
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

    TDL: 0,
    COO: 0,
    DE: 0,
    Total: 0,
  };

  items.forEach((item) => {
    sum.protoTDL += Number(item.protoTDL || 0);
    sum.protoCOO += Number(item.protoCOO || 0);
    sum.protoDE += Number(item.protoDE || 0);
    sum.protoTotal += Number(item.protoTotal || 0);

    sum.serieTDL += Number(item.serieTDL || 0);
    sum.serieCOO += Number(item.serieCOO || 0);
    sum.serieDE += Number(item.serieDE || 0);
    sum.serieTotal += Number(item.serieTotal || 0);

    sum.TDL += Number(item.TDL || 0);
    sum.COO += Number(item.COO || 0);
    sum.DE += Number(item.DE || 0);
    sum.Total += Number(item.Total || 0);
  });

  // format output
  Object.keys(sum).forEach((key) => {
    if (key !== "activityName") {
      sum[key] = sum[key].toFixed(3);
    }
  });

  return sum;
}

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
    data.activities
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
          "2D DELIVERABLES | Internal Drawing Main Parts"
        ) ||
        activityName.startsWith("2D DELIVERABLES | COP / Inherit Drawings") ||
        activityName.startsWith("2D DELIVERABLES | Format Drawing") ||
        activityName.startsWith("2D DELIVERABLES | Roll Drawing") ||
        activityName.startsWith("2D DELIVERABLES | NVH Drawing") 
      ) {
        // alert("Pushed 2d antolin drawings ::" + activityName);
        groups.twoDAntolinDrwaings.push([
          activityName,
          activityDetails,
          data.Global,
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
        ]);
      }
    } else if (activityName.startsWith("DATA MANAGEMENT")) {
      groups.dataManagement.push([activityName, activityDetails, data.Global]);
    } else if (activityName.startsWith("GEOMETRICAL STUDY")) {
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
        activityName
    );

    const res = calculate2DDeliverables(
      activityName,
      activityDetails,
      data.Global
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
        activityName
    );

    // Its calculation in same way , the way all 2d are calculated .
    // Method logic  will same to utilize it
    const res = calculate2DDeliverables(
      activityName,
      activityDetails,
      data.Global
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
        activityName
    );

    // Its calculation in same way , the way all 2d are calculated .
    // Method logic  will same to utilize it
    const res = calculate2DDeliverables(
      activityName,
      activityDetails,
      data.Global
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
      data.Global
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
    const res = calculateGeometricalStudy(activityDetails, data.Global);
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
  threeDAggregatedTotal.push(aggregateSummary(threeDResults));
  twoDAggregatedTotal.push(aggregateSummary(twoDResults, "2D TOTAL"));

  twoDAntolinDrwaingsAggregatedTotal.push(
    aggregateSummary(twoDAntolinDrwaingsResult, "2D ANTOLIN DRAWING TOTAL")
  );
  twoDCustomerDrwaingsAggregatedTotal.push(
    aggregateSummary(twoDCustomerDrwaingsResult, "2D CUSTOMER DRAWING TOTAL")
  );
  dataMgmtAggregatedTotal.push(
    aggregateSummary(dataManagementResults, "DATA MANAGEMENT TOTAL")
  );
  geoAggregatedTotal.push(
    aggregateSummary(geometricalStudyResults, "GEOMETRICAL STUDY TOTAL")
  );

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
