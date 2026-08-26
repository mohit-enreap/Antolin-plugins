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
function calculate3DActivity(activityName, activityDetails, globalFlags) {
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
/**
 * Placeholder methods for other groups
 */
function calculate2DDeliverables(activityDetails, globalFlags) {
  // keep blank for now
  return {};
}

function calculateDataManagement(activityDetails, globalFlags) {
  // keep blank for now
  return {};
}

function calculateGeometricalStudy(activityDetails, globalFlags) {
  // keep blank for now
  return {};
}

/**
 * Main calculation dispatcher
 */
export function calculateResults(data) {
  alert("1 calculateResults111(data)");
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
      activityResult = calculate3DActivity(
        activityName,
        activityDetails,
        data.Global
      );
    } else if (activityName.startsWith("2D DELIVERABLES")) {
      activityResult = calculate2DDeliverables(activityDetails, data.Global);
    } else if (activityName.startsWith("DATA MANAGEMENT")) {
      activityResult = calculateDataManagement(activityDetails, data.Global);
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
