// export function fillCostSheetData(template, totals, roleMapping) {
//   let alertMessage = "Cost Sheet Data Summary:\n\n"; // Start building the big alert

//   const updatedRows = template.rows.map((row, index) => {
//     const source = roleMapping[row.role]; // Map role to source like "3D", "2D", etc.

//     if (!source) {
//       //   alertMessage += `Row ${index + 1} ➜ Role "${row.role}" has no mapping.\n`;
//       return row;
//     }

//     const data = totals[source];
//     if (!data) {
//       //   alertMessage += `Row ${index + 1} ➜ No data for source "${source}".\n`;
//       return row;
//     }

//     const roleKey = row.role; // This should be "TDL", "COO", or "DE"

//     // Dynamically access the correct properties based on role
//     // alert(JSON.stringify(data, null, 2));
//     const phase1Hours = data[0][`proto${roleKey}`] ?? row.phase1.hours;
//     const phase2Hours = data[0][`serie${roleKey}`] ?? row.phase2.hours;
//     const totalHours = data[0][roleKey] ?? row.total.hours;

//     // Add row info to the big alert
//     alertMessage +=
//       `Row ${index + 1} ➜ Role: ${row.role}\n` +
//       `  Phase1 Hours: ${phase1Hours}\n` +
//       `  Phase2 Hours: ${phase2Hours}\n` +
//       `  Total Hours: ${totalHours}\n\n`;

//     return {
//       ...row,
//       phase1: { ...row.phase1, hours: phase1Hours },
//       phase2: { ...row.phase2, hours: phase2Hours },
//       total: { ...row.total, hours: totalHours },
//     };
//   });

//   // Show all rows info in one big alert
//   //   alert(alertMessage);

//   return {
//     ...template,
//     rows: updatedRows,
//   };
// }

//*********************************************************************** */
//Code updated 2:

import { reworkPercent } from "../../../data/Rework/reworkPercentage";

/**
 * fillCostSheetData
 * -----------------
 * This function fills cost sheet rows with calculated hours.
 *
 * - Normal roles (TDL, COO, DE, etc.) get their hours from `totals`
 * - Rework is NOT present in totals
 * - Rework hours are calculated as a percentage of DE hours
 * - Rework is automatically filled when DE is found
 */

export function fillCostSheetData(template, totals, roleMapping) {
  // Used only for debugging
  // This will show a readable summary of all calculated rows
  let alertMessage = "Cost Sheet Data Summary:\n\n";

  // These variables temporarily store DE hours
  // Rework calculation depends on DE, so we save them here
  let dePhase1 = 0;
  let dePhase2 = 0;

  // Loop through each row of the template
  const updatedRows = template.rows.map((row, index) => {
    // Role of current row (TDL / COO / DE / Rework / etc.)
    const roleKey = row.role;

    /* =================================================
       NORMAL ROLE CALCULATION
       -------------------------------------------------
       - Applies to all roles EXCEPT "Rework"
       - Data comes directly from `totals`
       ================================================= */
    if (roleKey !== "Rework") {
      // Find which totals source this role belongs to (3D / 2D / etc.)
      const source = roleMapping[row.role];

      // If no mapping exists, return the row without changes
      if (!source) return row;

      // Fetch totals data for this source
      const data = totals[source];

      // If totals are missing or empty, return row as-is
      if (!data || !data[0]) return row;

      // Get Phase 1 hours (Proto)
      // Example: protoDE, protoTDL, protoCOO
      let phase1Hours = data[0][`proto${roleKey}`] ?? row.phase1.hours;

      // Get Phase 2 hours (Serie)
      // Example: serieDE, serieTDL, serieCOO
      let phase2Hours = data[0][`serie${roleKey}`] ?? row.phase2.hours;

      // Get total hours for this role
      let totalHours = data[0][roleKey] ?? row.total.hours;

      //  IMPORTANT:
      // When we encounter the DE row,
      // store its hours so Rework can use them later
      if (roleKey === "DE") {
        dePhase1 = phase1Hours;
        dePhase2 = phase2Hours;
      }

      // Add readable debug information
      alertMessage +=
        `Row ${index + 1} ➜ Role: ${roleKey}\n` +
        `  Phase1 Hours: ${phase1Hours}\n` +
        `  Phase2 Hours: ${phase2Hours}\n` +
        `  Total Hours: ${totalHours}\n\n`;

      // Return updated row with calculated hours
      return {
        ...row,
        phase1: { ...row.phase1, hours: phase1Hours },
        phase2: { ...row.phase2, hours: phase2Hours },
        total: { ...row.total, hours: totalHours },
      };
    }

    /* =================================================
       REWORK CALCULATION
       -------------------------------------------------
       - Rework does NOT exist in totals
       - It is derived from DE hours
       - Formula:
         Rework Hours = DE Hours × Rework %
       ================================================= */

    /* =================================================
              REWORK CALCULATION
              -------------------------------------------------
              - Rework does NOT exist in totals
              - It is calculated from DE hours
              - Percentage comes from JSON file
              - Percentage depends on Product (OHS, IP, etc.)
              ================================================= */

    // Product name from row (example: "OHS")
    const product = "OHS"; // row.product;

    // Get Rework % for this product from JSON
    // Example: reworkPercent.Rework.OHS → 0.31
    // If product not found → use 0
    const reworkPercentage = reworkPercent?.Rework?.[product] ?? 0;

    // testing :
    // Fixed Rework percentage (0.31%)
    // Change this later if you want it dynamic
    // const reworkPercentage = 0.31;

    // Apply Rework % on DE hours
    const phase1Hours = (dePhase1 * reworkPercentage) / 100;
    const phase2Hours = (dePhase2 * reworkPercentage) / 100;

    // Total Rework hours
    const totalHours = phase1Hours + phase2Hours;

    // Debug info
    alertMessage +=
      `Row ${index + 1} ➜ Role: Rework\n` +
      `  Product: ${product}\n` +
      `  Rework %: ${reworkPercentage}\n` +
      `  Phase1 Hours: ${phase1Hours}\n` +
      `  Phase2 Hours: ${phase2Hours}\n` +
      `  Total Hours: ${totalHours}\n\n`;

    return {
      ...row,
      phase1: { ...row.phase1, hours: phase1Hours },
      phase2: { ...row.phase2, hours: phase2Hours },
      total: { ...row.total, hours: totalHours },
    };
  });

  // Show final calculation summary (debug only)
  //  alert(alertMessage);

  // Return updated template with all calculated rows
  return {
    ...template,
    rows: updatedRows,
  };
}
