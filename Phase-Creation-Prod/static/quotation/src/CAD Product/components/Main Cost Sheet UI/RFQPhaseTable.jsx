// import React from "react";

// /**
//  * RFQPhaseTable
//  * -----------------
//  * This component is intentionally kept GENERIC.
//  * Later, you can pass dynamic data via props.
//  */

// const RFQPhaseTable = ({ data }) => {
//   /*
//     👉 HOW YOU WILL ACCESS DATA FROM PROPS (IMPORTANT)

//     `data` will be passed from parent like:

//     <RFQPhaseTable data={rfqData} />

//     Expected structure example:

//     data = {
//       rows: [
//         {
//           org: "G.A. Deutschland",
//           role: "TDL",
//           phase0: { hours: null, cost: null },
//           phase1: { hours: 520.33, cost: 38348.32 },
//           phase2: { hours: 531.06, cost: 39139.45 },
//           phase34: { hours: null, cost: null },
//           total: { hours: 1051.39, cost: 77487.77 }
//         }
//       ]
//     }

//     Access examples:
//     - data.rows
//     - row.phase1.hours
//     - row.total.cost
//   */

//   return (
//     <div className="overflow-x-auto">
//       <h1> COST Sheets CAD</h1>
//       <table className="min-w-full border border-black text-sm">
//         <thead>
//           <tr className="bg-gray-100 text-center">
//             <th rowSpan={2} className="border p-2">
//               Design
//             </th>
//             <th rowSpan={2} className="border p-2">
//               Role
//             </th>
//             <th colSpan={2} className="border p-2">
//               Phase 0
//             </th>
//             <th colSpan={2} className="border p-2">
//               Phase 1
//             </th>
//             <th colSpan={2} className="border p-2">
//               Phase 2
//             </th>
//             <th colSpan={2} className="border p-2">
//               Phase 3-4
//             </th>
//             <th colSpan={2} className="border p-2 text-red-600">
//               TOTAL
//             </th>
//           </tr>
//           <tr className="bg-gray-50 text-center">
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//           </tr>
//         </thead>

//         <tbody>
//           {data?.rows?.map((row, index) => (
//             <tr key={index} className="text-right">
//               <td className="border p-2 text-left">{row.org}</td>
//               <td className="border p-2 text-left">{row.role}</td>

//               <td className="border p-2">{row.phase0?.hours ?? "-"}</td>
//               <td className="border p-2">{row.phase0?.cost ?? "-"}</td>

//               <td className="border p-2">{row.phase1?.hours ?? "-"}</td>
//               <td className="border p-2">{row.phase1?.cost ?? "-"}</td>

//               <td className="border p-2">{row.phase2?.hours ?? "-"}</td>
//               <td className="border p-2">{row.phase2?.cost ?? "-"}</td>

//               <td className="border p-2">{row.phase34?.hours ?? "-"}</td>
//               <td className="border p-2">{row.phase34?.cost ?? "-"}</td>

//               <td className="border p-2 font-semibold">{row.total?.hours}</td>
//               <td className="border p-2 font-semibold">{row.total?.cost}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default RFQPhaseTable;

//++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++

// import React from "react";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable"; // ✅ important
// import { PHASE_META } from "./Data/CostCenterMappingUtil";
// import PhaseHeader from "./PhaseHeader";

// import { sharedRef } from "../../../shared/sharedStore";
// import SectionTable from "./SectionTable";

// const RFQPhaseTable = ({
//   data,
//   quotationText,
//   phaseDates,
//   manualWeeks,
//   updateManualWeeks,
// }) => {
//   // --------------------------
//   // PDF Download Function
//   // --------------------------
//   const downloadPDF = () => {
//     const doc = new jsPDF();

//     // --------------------------
//     // Title
//     // --------------------------
//     doc.setFontSize(18);
//     doc.setTextColor(255, 102, 0);
//     // doc.text("COST Sheets CAD", 14, 18);
//     doc.text(quotationText, 14, 18);

//     // --------------------------
//     // Phase Header
//     // --------------------------
//     const phaseHeaderStartY = 22;

//     const tableStartY = drawPhaseHeaderPDF(doc, PHASE_META, phaseHeaderStartY);

//     const columns = [
//       "Design",
//       "Role",
//       "Phase 0 Hours",
//       "Phase 0 Costs",
//       "Phase 1 Hours",
//       "Phase 1 Costs",
//       "Phase 2 Hours",
//       "Phase 2 Costs",
//       "Phase 3-4 Hours",
//       "Phase 3-4 Costs",
//       "TOTAL Hours",
//       "TOTAL Costs",
//     ];

//     const rows = data?.rows?.map((row) => [
//       row.org,
//       row.role,
//       row.phase0?.hours ?? "-",
//       row.phase0?.cost ?? "-",
//       row.phase1?.hours ?? "-",
//       row.phase1?.cost ?? "-",
//       row.phase2?.hours ?? "-",
//       row.phase2?.cost ?? "-",
//       row.phase34?.hours ?? "-",
//       row.phase34?.cost ?? "-",
//       row.total?.hours ?? "-",
//       row.total?.cost ?? "-",
//     ]);

//     autoTable(doc, {
//       startY: tableStartY,
//       head: [columns],
//       body: rows,
//       startY: 50,
//       theme: "grid",
//       styles: { fontSize: 8, textColor: [0, 0, 0] }, // black text
//       headStyles: {
//         fillColor: [255, 153, 51], // orange header
//         textColor: [255, 255, 255], // white text
//         fontStyle: "bold",
//       },
//       alternateRowStyles: {
//         fillColor: [255, 243, 230], // light orange for alternate rows
//       },
//       bodyStyles: {
//         fillColor: [255, 255, 255], // white background for normal rows
//       },
//       columnStyles: {
//         11: { textColor: [255, 51, 0], fontStyle: "bold" }, // TOTAL Costs in bright orange
//         10: { fontStyle: "bold" }, // TOTAL Hours bold
//       },
//     });

//     doc.save("cost-sheet.pdf");
//   };

//   const downloadPDF1 = () => {
//     const doc = new jsPDF();

//     // --------------------------
//     // Title
//     // --------------------------
//     doc.setFontSize(18);
//     doc.setTextColor(255, 102, 0);
//     doc.text("COST Sheets CAD", 14, 18);

//     // --------------------------
//     // Phase Header
//     // --------------------------
//     const tableStartY = drawPhaseHeaderPDF(doc, PHASE_META, 22);

//     // --------------------------
//     // Columns
//     // --------------------------
//     const columns = [
//       "Design",
//       "Role",
//       "Phase 0 Hours",
//       "Phase 0 Costs",
//       "Phase 1 Hours",
//       "Phase 1 Costs",
//       "Phase 2 Hours",
//       "Phase 2 Costs",
//       "Phase 3-4 Hours",
//       "Phase 3-4 Costs",
//       "TOTAL Hours",
//       "TOTAL Costs",
//     ];

//     // --------------------------
//     // Rows
//     // --------------------------
//     const rows = data?.rows?.map((row) => [
//       row.org,
//       row.role,
//       row.phase0?.hours ?? "-",
//       row.phase0?.cost ?? "-",
//       row.phase1?.hours ?? "-",
//       row.phase1?.cost ?? "-",
//       row.phase2?.hours ?? "-",
//       row.phase2?.cost ?? "-",
//       row.phase34?.hours ?? "-",
//       row.phase34?.cost ?? "-",
//       row.total?.hours ?? "-",
//       row.total?.cost ?? "-",
//     ]);

//     // --------------------------
//     // Table
//     // --------------------------
//     autoTable(doc, {
//       head: [columns],
//       body: rows,
//       startY: tableStartY,
//       theme: "grid",
//       styles: { fontSize: 8, textColor: [0, 0, 0] },
//       headStyles: {
//         fillColor: [255, 153, 51],
//         textColor: [255, 255, 255],
//         fontStyle: "bold",
//       },
//       columnStyles: {
//         10: { fontStyle: "bold" },
//         11: { textColor: [255, 51, 0], fontStyle: "bold" },
//       },
//     });

//     doc.save("cost-sheet.pdf");
//   };

//   function drawPhaseHeaderPDF(doc, phaseMeta, startY = 28) {
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const marginX = 14;
//     const boxWidth = (pageWidth - marginX * 2) / 4;
//     let y = startY;

//     doc.setFontSize(9);

//     Object.values(phaseMeta).forEach((phase, index) => {
//       const x = marginX + index * boxWidth;

//       // Outer box
//       doc.rect(x, y, boxWidth, 22);

//       // Phase title
//       doc.setFont(undefined, "bold");
//       doc.text(phase.label, x + boxWidth / 2, y + 5, { align: "center" });

//       doc.setFont(undefined, "normal");
//       doc.text(`Start: ${phase.start}`, x + 2, y + 10);
//       doc.text(`End: ${phase.end}`, x + 2, y + 15);
//       doc.text(`Weeks: ${phase.weeks}`, x + 2, y + 20);
//     });

//     return y + 26; // next Y position after header
//   }

//   return (
//     //---------

//     <div className="overflow-x-auto p-4">
//       <h1 className="text-xl font-bold mb-2">COST Sheets CAD</h1>

//       {/* PDF Button */}
//       <button
//         className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//         onClick={downloadPDF}
//       >
//         Download PDF
//       </button>

//       {/* ✅ Phase Header */}
//       <PhaseHeader
//         phaseDates={phaseDates}
//         manualWeeks={manualWeeks}
//         updateManualWeeks={updateManualWeeks}
//       />

//       {/* ✅ Table */}
//       {/* Table */}
//       <table className="min-w-full border border-black text-sm">
//         <thead>
//           <tr className="bg-gray-100 text-center">
//             <th rowSpan={2} className="border p-2">
//               Design
//             </th>
//             <th rowSpan={2} className="border p-2">
//               Role
//             </th>
//             <th colSpan={2} className="border p-2">
//               Phase 0
//             </th>
//             <th colSpan={2} className="border p-2">
//               Phase 1
//             </th>
//             <th colSpan={2} className="border p-2">
//               Phase 2
//             </th>
//             <th colSpan={2} className="border p-2">
//               Phase 3-4
//             </th>
//             <th colSpan={2} className="border p-2 text-red-600">
//               TOTAL
//             </th>
//           </tr>
//           <tr className="bg-gray-50 text-center">
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//             <th className="border">HOURS</th>
//             <th className="border">COSTS</th>
//           </tr>
//         </thead>
//         <tbody>
//           {data?.rows?.map((row, index) => {
//             const isLastRow = index === data.rows.length - 1;

//             return (
//               <tr
//                 key={index}
//                 style={
//                   isLastRow
//                     ? {
//                         backgroundColor: "#0b74d1", // light yellow
//                         fontWeight: "bold",
//                         borderTop: "3px solid black",
//                       }
//                     : {}
//                 }
//                 className="text-right"
//               >
//                 <td className="border p-2 text-left">{row.org}</td>
//                 <td className="border p-2 text-left">{row.role}</td>
//                 <td className="border p-2">{row.phase0?.hours ?? "-"}</td>
//                 <td className="border p-2">{row.phase0?.cost ?? "-"}</td>
//                 <td className="border p-2">{row.phase1?.hours ?? "-"}</td>
//                 <td className="border p-2">{row.phase1?.cost ?? "-"}</td>
//                 <td className="border p-2">{row.phase2?.hours ?? "-"}</td>
//                 <td className="border p-2">{row.phase2?.cost ?? "-"}</td>
//                 <td className="border p-2">{row.phase34?.hours ?? "-"}</td>
//                 <td className="border p-2">{row.phase34?.cost ?? "-"}</td>
//                 <td className="border p-2 font-semibold">
//                   {row.total?.hours ?? "-"}
//                 </td>
//                 <td className="border p-2 font-semibold">
//                   {row.total?.cost ?? "-"}
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>

//     //----------
//   );
// };

// export default RFQPhaseTable;

//===================================================

//===================================================

//===================================================

import React, { useState, useEffect, useContext } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ important
import { PHASE_META } from "./Data/CostCenterMappingUtil";
import PhaseHeader from "./PhaseHeader";

import { sharedRef } from "../../../shared/sharedStore";
import SectionTable from "./SectionTable";

import CostCenterTable from "./CostCenterTable";

import { StorageContext } from "../../../StorageContext";

const RFQPhaseTable = ({
  data,
  quotationText,
  phaseDates,
  manualWeeks,
  updateManualWeeks,
  FINAL_DEBUG_DATA,
  pdfData,

  offerRows,
  industrializationRows,
  dataManagementRows,
}) => {
  // --------------------------
  // PDF Download Function
  // --------------------------

  const { quotationAssumptions, setQuotVerTotalHours, setQuotVerTotalCost } =
    useContext(StorageContext);

  const [assumptionText, setAssumptionText] = useState("");

  // 3. Sync the local variable whenever the context value changes
  useEffect(() => {
    if (quotationAssumptions) {
      setAssumptionText(quotationAssumptions);
      console.log("Local variable updated:", quotationAssumptions);
    }
  }, [quotationAssumptions]); // Only runs when plainText is updated

  // 4. Save Budget totals to StorageContext whenever data changes
  useEffect(() => {
    const budgetRow = data?.rows6?.[data.rows6.length - 1];
    if (budgetRow) {
      setQuotVerTotalHours(budgetRow.total?.hours ?? null);
      setQuotVerTotalCost(budgetRow.total?.cost ?? null);
      console.log("Budget totals updated in StorageContext:", {
        hours: budgetRow.total?.hours,
        cost: budgetRow.total?.cost,
      });
    }
  }, [data?.rows6, setQuotVerTotalHours, setQuotVerTotalCost]);

  // const downloadPDFOLD = () => {
  //   const doc = new jsPDF();

  //   // --------------------------
  //   // Title
  //   // --------------------------
  //   doc.setFontSize(18);
  //   doc.setTextColor(52, 58, 64);
  //   doc.text(quotationText || "COST Sheets CAD", 14, 18);

  //   // --------------------------
  //   // Phase Header
  //   // --------------------------
  //   const tableStartY = drawPhaseHeaderPDF(doc, PHASE_META, 22);

  //   // --------------------------
  //   // Columns
  //   // --------------------------
  //   const columns = [
  //     "Cost Center",
  //     "Activities",
  //     "Phase 0 Hours",
  //     "Phase 0 Costs",
  //     "Phase 1 Hours",
  //     "Phase 1 Costs",
  //     "Phase 2 Hours",
  //     "Phase 2 Costs",
  //     "Phase 3-4 Hours",
  //     "Phase 3-4 Costs",
  //     "TOTAL Hours",
  //     "TOTAL Costs",
  //   ];

  //   // --------------------------
  //   // Helper: convert row object to array
  //   // --------------------------
  //   const formatRows = (rowsArray) =>
  //     rowsArray?.map((row) => [
  //       row.org ?? "",
  //       row.role ?? "",
  //       row.phase0?.hours ?? "-",
  //       row.phase0?.cost ?? "-",
  //       row.phase1?.hours ?? "-",
  //       row.phase1?.cost ?? "-",
  //       row.phase2?.hours ?? "-",
  //       row.phase2?.cost ?? "-",
  //       row.phase34?.hours ?? "-",
  //       row.phase34?.cost ?? "-",
  //       row.total?.hours ?? "-",
  //       row.total?.cost ?? "-",
  //     ]) ?? [];

  //   // --------------------------
  //   // Sections
  //   // --------------------------
  //   const sections = [
  //     { title: "Design", rows: data?.rows },
  //     { title: "CAE", rows: data?.rows2 },

  //     { title: "PS", rows: data?.rows4 },
  //     { title: "Thermal Simulation", rows: data?.rows3 },
  //     { title: "Other", rows: data?.rows5 },
  //     { title: "License / Budget Total", rows: data?.rows6 },
  //   ];

  //   let currentY = tableStartY;

  //   sections.forEach((section) => {
  //     if (!section.rows?.length) return;

  //     // Section Title
  //     doc.setFontSize(10);
  //     doc.setFont(undefined, "bold");
  //     doc.setTextColor(0, 0, 0);
  //     doc.text(section.title, 14, currentY + 6);
  //     currentY += 8;

  //     // Section Table
  //     autoTable(doc, {
  //       startY: currentY,
  //       head: [columns],
  //       body: formatRows(section.rows),
  //       theme: "grid",
  //       styles: { fontSize: 8, textColor: [0, 0, 0] },
  //       headStyles: {
  //         fillColor: [248, 249, 250],
  //         textColor: [52, 58, 64],
  //         fontStyle: "bold",
  //       },
  //       alternateRowStyles: { fillColor: [233, 236, 239] },
  //       bodyStyles: { fillColor: [206, 212, 218] },
  //       columnStyles: {
  //         10: { fontStyle: "bold" },
  //         11: { textColor: [33, 37, 41], fontStyle: "bold" },
  //       },
  //       didDrawPage: (dataArg) => {
  //         currentY = dataArg.cursor.y + 6;
  //       },
  //     });

  //     currentY += 5; // gap between sections
  //   });

  //   // --------------------------
  //   // ASSUMPTIONS Box
  //   // --------------------------
  //   // Assumptions Box
  //   // --------------------------
  //   //     const assumptionsText = `
  //   // V1/V2/V3/V4 ...., Comments
  //   // Scope considered as per "xxxxxxxx file name"
  //   // Development type: FSS/BTP/Expert phase, Concept, VPC, Pre-development phase
  //   // GA/Customer Standard timelines considered for the current offer
  //   // LH Symmetry RH is considered & LHD Symmetry RHD is considered
  //   // No Purchasing, Imposed & Directly supplied parts were considered for the scope of development.
  //   // TDL in GA …...............
  //   // Customer 2D considered/Not considered in the current offer
  //   // CAE considered/Not considered for the current offer
  //   // Passive Safety considered/Not considered for the current offer ... as per BU requirement.
  //   // GA Management & License costs were considered for the current offer

  //   // 2D:
  //   // Drawing hours quoted assuming XX Internal drawings & XX Customer drawings.
  //   // COP drawings considered for Purchasing/Imposed parts. Purchasing/Imposed parts Suppliers must provide those drawings.
  //   // 3D Annotations were considered/Not considered in the Customer drawings

  //   // Data Management (PLM):
  //   // Consider PLM system for Communications & Data Management is "xxxnamexxx" , if any others is used the Quotation need to be Re-estimated. /If OEM is New, the PLM is unknown to define, hence need to update the Estimation as per customer confirmation.
  //   // Number of Assembly’s + Variants consider for the following projects – XX
  //   // Number of Releases Proto/Series/industrialisation – (2+3+1) (To have a Tolerance as in Many Project we see there are multiple loop of releases and it affects the Hours).
  //   // Number of data environment extraction cycle – XX (In proto - 2 week 1 time in Series or weekly and in Industrialisation – 1 week before release) On average ±15 times.

  //   // Data Management (Web Portal):
  //   // Consider WEB-System for Communications & Data Management is "xxxnamexxx" , if any others is used the Quotation need to be Re-estimated. /If OEM is New, the PLM is unknown to define, hence need to update the Estimation as per customer confirmation.
  //   // Typical Releases activities which are performed in PLMs are not considered being web-portal support.

  //   // CAE ASSUMPTIONS:
  //   // Scope of Simulations is considered as per "xxxFILE NAMEXXX"/Standard OEM requirements
  //   // 2 Phases were considered with 1 loop each phase.
  //   // Variants included in the scope: Basis LH + Basis RH + 50% Luxury LH + With/Without HUD + With/Without backlit + …
  //   // Material Characterization would be quoted on top of current figure, 12000 EURO per material + 16 CAE Engineer hours. If Damage has to be modelled then the cost could be 15000 EURO + 16 CAE Engineer hours per material.
  //   // 2 Synthesis models deliveries were considered for the current offer.

  //   // PS Radius Analysis:
  //   // 2 Phases were considered with 1 loop each phase.
  //   // Scope includes ….......vehicles
  //   // PS Head Impact:
  //   // Head impact as per ECE R21/FMVSS 201U regulation considered
  //   // No physical Validation considered for now
  //   // Only theoretical studies for head impact are considered which will be shared to CAE for further

  //   // `;

  //   // Current Y position after last table
  //   let assumptionsY = currentY + 10;
  //   const pageHeight = doc.internal.pageSize.getHeight();
  //   const pageWidth = doc.internal.pageSize.getWidth();
  //   const marginX = 14;
  //   const lineHeight = 4; // adjust based on font size

  //   // Set font
  //   doc.setFontSize(10);
  //   doc.setFont(undefined, "bold");
  //   doc.text("Assumptions:", marginX, assumptionsY);
  //   assumptionsY += lineHeight;

  //   // Split text to fit page width
  //   doc.setFontSize(8);
  //   doc.setFont(undefined, "normal");
  //   const textLines = doc.splitTextToSize(
  //     assumptionText.trim(),
  //     pageWidth - marginX * 2,
  //   );

  //   // Print each line and handle page breaks
  //   textLines.forEach((line) => {
  //     if (assumptionsY + lineHeight > pageHeight - 14) {
  //       // bottom margin
  //       doc.addPage();
  //       assumptionsY = 14; // reset top margin
  //     }
  //     doc.text(line, marginX, assumptionsY);
  //     assumptionsY += lineHeight;
  //   });

  //   // ============================
  //   // MUA COST SHEET PDF SECTION
  //   // ============================
  //   doc.setFontSize(12);
  //   doc.setFont(undefined, "bold");
  //   doc.text("MUA Cost Sheet", 14, currentY + 10);
  //   currentY += 14;

  //   // Build columns & rows
  //   const { columnsMau, years } = buildPdfColumns(tableData);
  //   const rowsMau = buildPdfRows(tableData, years);

  //   // Render table
  //   autoTable(doc, {
  //     startY: currentY,
  //     head: [columnsMau],
  //     body: rowsMau,
  //     theme: "grid",
  //     styles: { fontSize: 8 },
  //     headStyles: {
  //       fillColor: [52, 58, 64],
  //       textColor: [255, 255, 255],
  //       fontStyle: "bold",
  //     },
  //     alternateRowStyles: { fillColor: [240, 240, 240] },
  //     didDrawPage: (dataArg) => {
  //       currentY = dataArg.cursor.y + 10;
  //     },
  //   });

  //   doc.save("cost-sheet.pdf");
  // };

  // OLD PDF Function
  // const downloadPDF = () => {
  //   const doc = new jsPDF();

  //   // --------------------------
  //   // Title
  //   // --------------------------
  //   doc.setFontSize(18);
  //   doc.setTextColor(52, 58, 64);
  //   doc.text(quotationText || "COST Sheets CAD", 14, 18);

  //   // --------------------------
  //   // Phase Header
  //   // --------------------------
  //   const tableStartY = drawPhaseHeaderPDF(doc, PHASE_META, 22);

  //   // --------------------------
  //   // Columns
  //   // --------------------------
  //   const columns = [
  //     "Cost Center",
  //     "Activities",
  //     "Ph0 Hrs",
  //     "Ph0 Cost",
  //     "Ph1 Hrs",
  //     "Ph1 Cost",
  //     "Ph2 Hrs",
  //     "Ph2 Cost",
  //     "Ph3-4 Hrs",
  //     "Ph3-4 Cost",
  //     "TOTAL Hrs",
  //     "TOTAL Cost",
  //   ];

  //   const formatRows = (rowsArray) =>
  //     rowsArray?.map((row) => [
  //       row.org ?? "",
  //       row.role ?? "",
  //       row.phase0?.hours ?? "-",
  //       row.phase0?.cost ?? "-",
  //       row.phase1?.hours ?? "-",
  //       row.phase1?.cost ?? "-",
  //       row.phase2?.hours ?? "-",
  //       row.phase2?.cost ?? "-",
  //       row.phase34?.hours ?? "-",
  //       row.phase34?.cost ?? "-",
  //       row.total?.hours ?? "-",
  //       row.total?.cost ?? "-",
  //     ]) ?? [];

  //   const sections = [
  //     { title: "Design", rows: data?.rows },
  //     { title: "CAE", rows: data?.rows2 },
  //     { title: "PS", rows: data?.rows4 },
  //     { title: "Thermal Simulation", rows: data?.rows3 },
  //     { title: "Other", rows: data?.rows5 },
  //     { title: "Total Budget", rows: data?.rows6 },
  //   ];

  //   let currentY = tableStartY;

  //   // --------------------------
  //   // Render Section Tables
  //   // --------------------------
  //   sections.forEach((section) => {
  //     if (!section.rows?.length) return;

  //     // Check for page break before drawing section title
  //     if (currentY > doc.internal.pageSize.getHeight() - 20) {
  //       doc.addPage();
  //       currentY = 14;
  //     }

  //     // Section Title
  //     doc.setFontSize(10);
  //     doc.setFont(undefined, "bold");
  //     doc.setTextColor(0, 0, 0);
  //     doc.text(section.title, 14, currentY + 6);
  //     currentY += 8;

  //     // Section Table
  //     autoTable(doc, {
  //       startY: currentY,
  //       head: [columns],
  //       body: formatRows(section.rows),
  //       theme: "grid",
  //       styles: { fontSize: 8, textColor: [0, 0, 0] },
  //       headStyles: {
  //         fillColor: [248, 249, 250],
  //         textColor: [52, 58, 64],
  //         fontStyle: "bold",
  //       },
  //       alternateRowStyles: { fillColor: [233, 236, 239] },
  //       bodyStyles: { fillColor: [206, 212, 218] },
  //       columnStyles: {
  //         10: { fontStyle: "bold" },
  //         11: { textColor: [33, 37, 41], fontStyle: "bold" },
  //       },
  //     });

  //     // Reliably get the end position of the table and add a 5px gap
  //     currentY = doc.lastAutoTable.finalY + 7;
  //   });

  //   // --------------------------
  //   // Assumptions Box
  //   // --------------------------
  //   let assumptionsY = currentY + 5;
  //   const pageHeight = doc.internal.pageSize.getHeight();
  //   const pageWidth = doc.internal.pageSize.getWidth();
  //   const marginX = 14;
  //   const lineHeight = 4;

  //   doc.setFontSize(10);
  //   doc.setFont(undefined, "bold");

  //   // Page break check for "Assumptions:" header
  //   if (assumptionsY > pageHeight - 20) {
  //     doc.addPage();
  //     assumptionsY = 14;
  //   }

  //   doc.text("Assumptions:", marginX, assumptionsY);
  //   assumptionsY += lineHeight + 2;

  //   doc.setFontSize(8);
  //   doc.setFont(undefined, "normal");
  //   const textLines = doc.splitTextToSize(
  //     assumptionText.trim(),
  //     pageWidth - marginX * 2,
  //   );

  //   textLines.forEach((line) => {
  //     if (assumptionsY + lineHeight > pageHeight - 14) {
  //       doc.addPage();
  //       assumptionsY = 14;
  //     }
  //     doc.text(line, marginX, assumptionsY);
  //     assumptionsY += lineHeight;
  //   });

  //   // SYNC currentY to wherever the assumptions ended!
  //   currentY = assumptionsY + 10;

  //   // --------------------------
  //   // MUA COST SHEET PDF SECTION
  //   // --------------------------
  //   // Ensure enough space for the MUA title and at least the table header
  //   if (currentY > pageHeight - 30) {
  //     doc.addPage();
  //     currentY = 14;
  //   }

  //   doc.setFontSize(12);
  //   doc.setFont(undefined, "bold");
  //   doc.text("MUA Cost Sheet", 14, currentY);
  //   currentY += 4;

  //   const { columnsMau, years } = buildPdfColumns(tableData);
  //   const rowsMau = buildPdfRows(tableData, years);

  //   autoTable(doc, {
  //     startY: currentY,
  //     head: [columnsMau],
  //     body: rowsMau,
  //     theme: "grid",
  //     styles: { fontSize: 8 },
  //     headStyles: {
  //       fillColor: [52, 58, 64],
  //       textColor: [255, 255, 255],
  //       fontStyle: "bold",
  //     },
  //     alternateRowStyles: { fillColor: [240, 240, 240] },
  //   });

  //   doc.save("cost-sheet.pdf");
  // };

  // NEW PDF Function
  const downloadPDF1 = () => {
    const doc = new jsPDF();

    // --------------------------
    // Title
    // --------------------------
    doc.setFontSize(14); // FIX: Reduced title size from 14 for better fit
    doc.setTextColor(52, 58, 64);
    doc.text(quotationText || "COST Sheets CAD", 14, 18);

    // --------------------------
    // Phase Header
    // --------------------------
    const tableStartY = drawPhaseHeaderPDF(doc, PHASE_META, 22);

    // --------------------------
    // Columns
    // --------------------------
    const columns = [
      "Cost Center",
      "Activities",
      "Ph0 Hrs",
      "Ph0 Cost",
      "Ph1 Hrs",
      "Ph1 Cost",
      "Ph2 Hrs",
      "Ph2 Cost",
      "Ph3-4 Hrs",
      "Ph3-4 Cost",
      "TOTAL Hrs",
      "TOTAL Cost",
    ];

    const formatRows = (rowsArray) =>
      rowsArray?.map((row) => [
        row.org ?? "",
        row.role ?? "",
        row.phase0?.hours ?? "-",
        row.phase0?.cost ?? "-",
        row.phase1?.hours ?? "-",
        row.phase1?.cost ?? "-",
        row.phase2?.hours ?? "-",
        row.phase2?.cost ?? "-",
        row.phase34?.hours ?? "-",
        row.phase34?.cost ?? "-",
        row.total?.hours ?? "-",
        row.total?.cost ?? "-",
      ]) ?? [];

    const sections = [
      { title: "Design", rows: data?.rows },
      { title: "CAE", rows: data?.rows2 },
      { title: "PS", rows: data?.rows4 },
      { title: "Thermal Simulation", rows: data?.rows3 },
      { title: "Other", rows: data?.rows5 },
      { title: "Total Budget", rows: data?.rows6 },
    ];

    let currentY = tableStartY;

    // --------------------------
    // Render Section Tables
    // --------------------------
    sections.forEach((section) => {
      if (!section.rows?.length) return;

      // Check for page break before drawing section title
      if (currentY > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        currentY = 14;
      }

      // Section Title
      doc.setFontSize(9); // FIX: Reduced from 10
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(section.title, 14, currentY + 6);
      currentY += 8;

      // Section Table
      autoTable(doc, {
        startY: currentY,
        head: [columns],
        body: formatRows(section.rows),
        theme: "grid",
        // FIX: Reduced fontSize from 8 to 6 or 7 to fit the page better
        styles: { fontSize: 6.5, textColor: [0, 0, 0] },
        headStyles: {
          fillColor: [248, 249, 250],
          textColor: [52, 58, 64],
          fontStyle: "bold",
          halign: "center", // FIX: Center headers to make multi-line wrapping look cleaner
        },
        alternateRowStyles: { fillColor: [233, 236, 239] },
        bodyStyles: { fillColor: [206, 212, 218] },
        columnStyles: {
          // FIX: Constrain column 1 ("Activities") so it wraps text instead of shrinking other cols
          1: { cellWidth: 40 },
          10: { fontStyle: "bold" },
          11: { textColor: [33, 37, 41], fontStyle: "bold" },
        },
      });

      // Reliably get the end position of the table and add a 5px gap
      currentY = doc.lastAutoTable.finalY + 7;
    });

    // --------------------------
    // Assumptions Box
    // --------------------------
    let assumptionsY = currentY + 5;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const lineHeight = 4;

    doc.setFontSize(9); // FIX: Reduced from 10
    doc.setFont(undefined, "bold");

    // Page break check for "Assumptions:" header
    if (assumptionsY > pageHeight - 20) {
      doc.addPage();
      assumptionsY = 14;
    }

    doc.text("Assumptions:", marginX, assumptionsY);
    assumptionsY += lineHeight + 2;

    doc.setFontSize(7); // FIX: Reduced from 8
    doc.setFont(undefined, "normal");
    const textLines = doc.splitTextToSize(
      assumptionText.trim(),
      pageWidth - marginX * 2,
    );

    textLines.forEach((line) => {
      if (assumptionsY + lineHeight > pageHeight - 14) {
        doc.addPage();
        assumptionsY = 14;
      }
      doc.text(line, marginX, assumptionsY);
      assumptionsY += lineHeight;
    });

    // SYNC currentY to wherever the assumptions ended!
    currentY = assumptionsY + 10;

    // --------------------------
    // MUA COST SHEET PDF SECTION
    // --------------------------
    // Ensure enough space for the MUA title and at least the table header
    if (currentY > pageHeight - 30) {
      doc.addPage();
      currentY = 14;
    }

    doc.setFontSize(11); // FIX: Reduced from 12
    doc.setFont(undefined, "bold");
    doc.text("MUA Cost Sheet", 14, currentY);
    currentY += 4;

    const { columnsMau, years } = buildPdfColumns(tableData);
    const rowsMau = buildPdfRows(tableData, years);

    autoTable(doc, {
      startY: currentY,
      head: [columnsMau],
      body: rowsMau,
      theme: "grid",
      styles: { fontSize: 6.5 }, // FIX: Reduced from 8 to match the earlier tables
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // --------------------------
    /* =========================================================
     1. ACTIVITIES TABLE
  ========================================================= */

    let y = 10; // vertical cursor

    // SAFE CLEAN FUNCTION (ONLY ADDITION)
    const cleanText = (text) => {
      if (!text) return "-";
      return String(text)
        .replace(/%/g, "")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim();
    };

    doc.setFontSize(14);
    doc.text("Activities", 14, y);
    y += 6;

    const activityBody = [];

    pdfData.activities.forEach((activity) => {
      // main row (like bold activity row)
      activityBody.push([cleanText(activity.name), "", ""]);

      // sub rows
      activity.rows.forEach((row) => {
        activityBody.push([
          `   ${cleanText(row.label)}`,
          cleanText(row.Proto ?? "-"),
          cleanText(row.Serie ?? "-"),
        ]);
      });
    });

    autoTable(doc, {
      startY: y,
      head: [["Activity / Sub-Activity", "Proto", "Serie"]],
      body: activityBody,

      theme: "grid",

      styles: {
        fontSize: 7, // 🔥 SMALL TABLE SIZE
        cellPadding: 2, // 🔥 compact rows
      },

      headStyles: {
        fillColor: [25, 42, 86],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },

      didParseCell: function (data) {
        if (
          data.row.index >= 0 &&
          activityBody[data.row.index][1] === "" &&
          activityBody[data.row.index][2] === ""
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    /* =========================================================
   2. PRODUCT PARTS TABLE
========================================================= */

    doc.setFontSize(14);
    doc.text("Product Parts", 14, y);
    y += 6;

    const productBody = Object.entries(pdfData.productParts || {}).map(
      ([name, val]) => [cleanText(name), cleanText(val.noOfComponent ?? "-")],
    );

    autoTable(doc, {
      startY: y,

      head: [["Product", "No Of Components"]],
      body: productBody,

      theme: "grid",

      styles: {
        fontSize: 7,
        cellPadding: 2,
      },

      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    y = doc.lastAutoTable.finalY + 8;

    /* =========================================================
   3. ADD ON COMPONENTS TABLE
========================================================= */

    doc.setFontSize(14);
    doc.text("Add On Components", 14, y);
    y += 6;

    const addOnBody = pdfData.addOnComponents.map((item) => [
      cleanText(item.activity),
      cleanText(item.product),
      cleanText(item.noOfComponent),
    ]);

    autoTable(doc, {
      startY: y,

      head: [["Activity", "Product", "No Of Components"]],
      body: addOnBody,

      theme: "grid",

      styles: {
        fontSize: 5,
        cellPadding: 1,
      },

      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    });
    ////=======end===

    // --------------------------

    doc.save("cost-sheet.pdf");
  };

  // 17th May 2026 local
  const downloadPDFLOCAL = () => {
    const doc = new jsPDF();

    // =========================================================
    // COMMON Y POSITION (ONLY ONE Y)
    // =========================================================
    let y = 18;

    // =========================================================
    // SAFE CLEAN FUNCTION
    // =========================================================
    const cleanText = (text) => {
      if (!text) return "-";

      return String(text)
        .replace(/%/g, "")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim();
    };

    // =========================================================
    // TITLE
    // =========================================================
    doc.setFontSize(18);
    doc.setTextColor(52, 58, 64);
    doc.text(quotationText || "COST Sheets CAD", 14, y);

    y += 8;

    // =========================================================
    // PHASE HEADER
    // =========================================================
    y = drawPhaseHeaderPDF(doc, PHASE_META, y);

    y += 10;

    // =========================================================
    // COMMON TABLE COLUMNS
    // =========================================================
    const columns = [
      "Design",
      "Role",
      "Phase 0 Hours",
      "Phase 0 Costs",
      "Phase 1 Hours",
      "Phase 1 Costs",
      "Phase 2 Hours",
      "Phase 2 Costs",
      "Phase 3-4 Hours",
      "Phase 3-4 Costs",
      "TOTAL Hours",
      "TOTAL Costs",
    ];

    // =========================================================
    // FORMAT ROWS
    // =========================================================
    const formatRows = (rowsArray) =>
      rowsArray?.map((row) => [
        row.org ?? "",
        row.role ?? "",
        row.phase0?.hours ?? "-",
        row.phase0?.cost ?? "-",
        row.phase1?.hours ?? "-",
        row.phase1?.cost ?? "-",
        row.phase2?.hours ?? "-",
        row.phase2?.cost ?? "-",
        row.phase34?.hours ?? "-",
        row.phase34?.cost ?? "-",
        row.total?.hours ?? "-",
        row.total?.cost ?? "-",
      ]) ?? [];

    // =========================================================
    // MAIN SECTIONS
    // =========================================================
    const sections = [
      { title: "CAD", rows: data?.rows },
      { title: "CAE", rows: data?.rows2 },
      { title: "Thermal Safety", rows: data?.rows3 },
      { title: "PS", rows: data?.rows4 },
      { title: "Other", rows: data?.rows5 },
      { title: "License / Budget Total", rows: data?.rows6 },
    ];

    sections.forEach((section) => {
      if (!section.rows?.length) return;

      // SECTION TITLE
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);

      doc.text(section.title, 14, y);

      y += 6;

      // TABLE
      autoTable(doc, {
        startY: y,

        head: [columns],

        body: formatRows(section.rows),

        theme: "grid",

        styles: {
          fontSize: 8,
          textColor: [0, 0, 0],
        },

        headStyles: {
          fillColor: [248, 249, 250],
          textColor: [52, 58, 64],
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [233, 236, 239],
        },

        bodyStyles: {
          fillColor: [206, 212, 218],
        },

        columnStyles: {
          10: { fontStyle: "bold" },
          11: {
            textColor: [33, 37, 41],
            fontStyle: "bold",
          },
        },
      });

      y = doc.lastAutoTable.finalY + 10;
    });

    // =========================================================
    // MAU COST SHEET
    // =========================================================
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");

    doc.text("MAU Cost Sheet", 14, y);

    y += 6;

    const { columnsMau, years } = buildPdfColumns(tableData);

    const rowsMau = buildPdfRows(tableData, years);

    autoTable(doc, {
      startY: y,

      head: [columnsMau],

      body: rowsMau,

      theme: "grid",

      styles: {
        fontSize: 8,
      },

      headStyles: {
        fillColor: [52, 58, 64],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },

      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    // =========================================================
    // ASSUMPTIONS
    // =========================================================
    const assumptionsText = `
V1/V2/V3/V4 -----
`;

    doc.setFontSize(10);
    doc.setFont(undefined, "bold");

    doc.text("Assumptions:", 14, y);

    y += 5;

    doc.setFontSize(8);
    doc.setFont(undefined, "normal");

    const pageWidth = doc.internal.pageSize.getWidth();

    const textLines = doc.splitTextToSize(
      assumptionsText.trim(),
      pageWidth - 28,
    );

    textLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 4;
    });

    y += 8;

    // =========================================================
    // ACTIVITIES TABLE
    // =========================================================
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");

    doc.text("Activities", 14, y);

    y += 6;

    const activityBody = [];

    pdfData.activities.forEach((activity) => {
      // MAIN ROW
      activityBody.push([cleanText(activity.name), "", ""]);

      // CHILD ROWS
      activity.rows.forEach((row) => {
        activityBody.push([
          `   ${cleanText(row.label)}`,
          cleanText(row.Proto ?? "-"),
          cleanText(row.Serie ?? "-"),
        ]);
      });
    });

    autoTable(doc, {
      startY: y,

      head: [["Activity / Sub-Activity", "Proto", "Serie"]],

      body: activityBody,

      theme: "grid",

      styles: {
        fontSize: 7,
        cellPadding: 2,
      },

      headStyles: {
        fillColor: [25, 42, 86],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },

      didParseCell: function (dataArg) {
        const rowData = activityBody[dataArg.row.index];

        if (rowData && rowData[1] === "" && rowData[2] === "") {
          dataArg.cell.styles.fontStyle = "bold";
          dataArg.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    // =========================================================
    // PRODUCT PARTS TABLE
    // =========================================================
    doc.setFontSize(14);

    doc.text("Product Parts", 14, y);

    y += 6;

    const productBody = Object.entries(pdfData.productParts || {}).map(
      ([name, val]) => [cleanText(name), cleanText(val.noOfComponent ?? "-")],
    );

    autoTable(doc, {
      startY: y,

      head: [["Product", "No Of Components"]],

      body: productBody,

      theme: "grid",

      styles: {
        fontSize: 7,
        cellPadding: 2,
      },

      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    // =========================================================
    // ADD ON COMPONENTS TABLE
    // =========================================================
    doc.setFontSize(14);

    doc.text("Add On Components", 14, y);

    y += 6;

    const addOnBody = pdfData.addOnComponents.map((item) => [
      cleanText(item.activity),
      cleanText(item.product),
      cleanText(item.noOfComponent),
    ]);

    autoTable(doc, {
      startY: y,

      head: [["Activity", "Product", "No Of Components"]],

      body: addOnBody,

      theme: "grid",

      styles: {
        fontSize: 5,
        cellPadding: 1,
      },

      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    });

    y = doc.lastAutoTable.finalY + 15;

    // =========================================================
    // CAE SECTION (AT END)
    // =========================================================
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");

    doc.text("CAE Activities", 14, y);

    y += 8;

    const caeBody = [];
    console.log("CAE PDF DATA --> ", sharedRef?.currentCAE);
    Object.entries(sharedRef?.currentCAE?.pdfData || {}).forEach(
      ([activityName, activity]) => {
        caeBody.push([
          cleanText(activityName),
          cleanText(activity["Proto"]),
          cleanText(activity["Serie"]),
          cleanText(activity["Number Of Loops"]),
        ]);
      },
    );

    autoTable(doc, {
      startY: y,

      head: [["Activity", "Proto", "Serie", "Number Of Loops"]],

      body: caeBody,

      theme: "grid",

      styles: {
        fontSize: 7,
        cellPadding: 2,
      },

      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // =========================================================
    // THERMAL SIMULATION SECTION
    // =========================================================

    y = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(16);
    doc.setFont(undefined, "bold");

    doc.text("Thermal Simulation", 14, y);

    y += 8;

    const thermalPdf = sharedRef?.currentThermalSimulation?.pdf || {};

    const thermalBody = [
      ["RFQ PCB", cleanText(thermalPdf.rfqPCB)],
      ["DEV PCB", cleanText(thermalPdf.devPCB)],
      ["RFQ Cases", cleanText(thermalPdf.rfqCases)],
      ["DEV Cases", cleanText(thermalPdf.devCases)],
      ["RFQ Loops", cleanText(thermalPdf.rfqLoops)],
      ["DEV Loops", cleanText(thermalPdf.devLoops)],
    ];

    autoTable(doc, {
      startY: y,

      head: [["Parameter", "Value"]],

      body: thermalBody,

      theme: "grid",

      styles: {
        fontSize: 8,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    // =========================================================
    // OFFER / INDUSTRIALIZATION / DATA MANAGEMENT TABLES
    // =========================================================

    const addSimpleTable = (title, rows) => {
      if (!rows?.length) return;

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(title, 14, y);

      y += 6;

      const body = rows.map((row) => [
        cleanText(row.activityKey),
        cleanText(row.resources),
        cleanText(row.weeks),
        cleanText(row.hoursPerWeek),
        cleanText(row.totalHours),
      ]);

      autoTable(doc, {
        startY: y,
        head: [
          ["Activity Key", "Resources", "Weeks", "Hours/Week", "Total Hours"],
        ],
        body: body,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [52, 58, 64],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      y = doc.lastAutoTable.finalY + 10;
    };

    // CALL YOUR OBJECTS HERE
    addSimpleTable("Offer Rows", offerRows);
    addSimpleTable("Industrialization Rows", industrializationRows);
    addSimpleTable("Data Management Rows", dataManagementRows);

    // =========================================================
    // SAVE PDF
    // =========================================================
    doc.save("cost-sheet.pdf");
  };

  const downloadPDFUnformatted = () => {
    console.log("PDF DATA -->");
    const doc = new jsPDF();

    // =========================================================
    // SAFE CLEAN FUNCTION
    // =========================================================
    const cleanText = (text) => {
      if (!text) return "-";
      return String(text)
        .replace(/%/g, "")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim();
    };

    // =========================================================
    // Title
    // =========================================================
    doc.setFontSize(14); // Jira/Forge style: Reduced title size
    doc.setTextColor(52, 58, 64);
    doc.text(quotationText || "COST Sheets CAD", 14, 18);

    // =========================================================
    // Phase Header
    // =========================================================
    const tableStartY = drawPhaseHeaderPDF(doc, PHASE_META, 22);

    // =========================================================
    // Columns & Formatters
    // =========================================================
    const columns = [
      "Cost Center",
      "Activities",
      "Ph0 Hrs",
      "Ph0 Cost",
      "Ph1 Hrs",
      "Ph1 Cost",
      "Ph2 Hrs",
      "Ph2 Cost",
      "Ph3-4 Hrs",
      "Ph3-4 Cost",
      "TOTAL Hrs",
      "TOTAL Cost",
    ];

    const formatRows = (rowsArray) =>
      rowsArray?.map((row) => [
        row.org ?? "",
        row.role ?? "",
        row.phase0?.hours ?? "-",
        row.phase0?.cost ?? "-",
        row.phase1?.hours ?? "-",
        row.phase1?.cost ?? "-",
        row.phase2?.hours ?? "-",
        row.phase2?.cost ?? "-",
        row.phase34?.hours ?? "-",
        row.phase34?.cost ?? "-",
        row.total?.hours ?? "-",
        row.total?.cost ?? "-",
      ]) ?? [];

    const sections = [
      { title: "Design", rows: data?.rows },
      { title: "CAE", rows: data?.rows2 },
      { title: "PS", rows: data?.rows4 },
      { title: "Thermal Simulation", rows: data?.rows3 },
      { title: "Other", rows: data?.rows5 },
      { title: "Total Budget", rows: data?.rows6 },
    ];

    let currentY = tableStartY;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;

    // Helper for page breaks
    const checkPageBreak = (neededSpace = 20) => {
      if (currentY > pageHeight - neededSpace) {
        doc.addPage();
        currentY = 14;
      }
    };

    // =========================================================
    // Render Main Section Tables
    // =========================================================
    sections.forEach((section) => {
      if (!section.rows?.length) return;

      checkPageBreak(20);

      // Section Title
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(section.title, 14, currentY + 6);
      currentY += 8;

      // Section Table
      autoTable(doc, {
        startY: currentY,
        head: [columns],
        body: formatRows(section.rows),
        theme: "grid",
        styles: { fontSize: 6.5, textColor: [0, 0, 0] },
        headStyles: {
          fillColor: [248, 249, 250],
          textColor: [52, 58, 64],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [233, 236, 239] },
        bodyStyles: { fillColor: [206, 212, 218] },
        columnStyles: {
          1: { cellWidth: 40 },
          10: { fontStyle: "bold" },
          11: { textColor: [33, 37, 41], fontStyle: "bold" },
        },
      });

      currentY = doc.lastAutoTable.finalY + 7;
    });

    // =========================================================
    // Assumptions Box
    // =========================================================
    let assumptionsY = currentY + 5;
    const lineHeight = 4;

    if (assumptionsY > pageHeight - 20) {
      doc.addPage();
      assumptionsY = 14;
    }

    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("Assumptions:", marginX, assumptionsY);
    assumptionsY += lineHeight + 2;

    doc.setFontSize(7);
    doc.setFont(undefined, "normal");

    // Fallback variable name in case local used assumptionsText instead of assumptionText
    const safeAssumptionText =
      typeof assumptionText !== "undefined"
        ? assumptionText
        : typeof assumptionsText !== "undefined"
          ? assumptionsText
          : "";

    const textLines = doc.splitTextToSize(
      safeAssumptionText.trim(),
      pageWidth - marginX * 2,
    );

    textLines.forEach((line) => {
      if (assumptionsY + lineHeight > pageHeight - 14) {
        doc.addPage();
        assumptionsY = 14;
      }
      doc.text(line, marginX, assumptionsY);
      assumptionsY += lineHeight;
    });

    currentY = assumptionsY + 10;

    // =========================================================
    // MUA COST SHEET PDF SECTION
    // =========================================================
    checkPageBreak(30);

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("MUA Cost Sheet", 14, currentY);
    currentY += 4;

    const { columnsMau, years } = buildPdfColumns(tableData);
    const rowsMau = buildPdfRows(tableData, years);

    autoTable(doc, {
      startY: currentY,
      head: [columnsMau],
      body: rowsMau,
      theme: "grid",
      styles: { fontSize: 6.5 },
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // =========================================================
    // 1. ACTIVITIES TABLE
    // =========================================================
    checkPageBreak(25);

    doc.setFontSize(14);
    doc.text("Activities", 14, currentY);
    currentY += 6;

    const activityBody = [];
    pdfData.activities.forEach((activity) => {
      activityBody.push([cleanText(activity.name), "", ""]);
      activity.rows.forEach((row) => {
        activityBody.push([
          `   ${cleanText(row.label)}`,
          cleanText(row.Proto ?? "-"),
          cleanText(row.Serie ?? "-"),
        ]);
      });
    });

    autoTable(doc, {
      startY: currentY,
      head: [["Activity / Sub-Activity", "Proto", "Serie"]],
      body: activityBody,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: {
        fillColor: [25, 42, 86],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: function (data) {
        if (
          data.row.index >= 0 &&
          activityBody[data.row.index][1] === "" &&
          activityBody[data.row.index][2] === ""
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // =========================================================
    // 2. PRODUCT PARTS TABLE
    // =========================================================
    checkPageBreak(20);

    doc.setFontSize(14);
    doc.text("Product Parts", 14, currentY);
    currentY += 6;

    const productBody = Object.entries(pdfData.productParts || {}).map(
      ([name, val]) => [cleanText(name), cleanText(val.noOfComponent ?? "-")],
    );

    autoTable(doc, {
      startY: currentY,
      head: [["Product", "No Of Components"]],
      body: productBody,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // =========================================================
    // 3. ADD ON COMPONENTS TABLE
    // =========================================================
    checkPageBreak(20);

    doc.setFontSize(14);
    doc.text("Add On Components", 14, currentY);
    currentY += 6;

    const addOnBody = pdfData.addOnComponents.map((item) => [
      cleanText(item.activity),
      cleanText(item.product),
      cleanText(item.noOfComponent),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Activity", "Product", "No Of Components"]],
      body: addOnBody,
      theme: "grid",
      styles: { fontSize: 5, cellPadding: 1 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    currentY = doc.lastAutoTable.finalY + 12;

    // =========================================================
    // CAE ACTIVITIES SECTION (MERGED FROM LOCAL)
    // =========================================================
    if (Object.keys(sharedRef?.currentCAE?.pdfData || {}).length > 0) {
      checkPageBreak(25);

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("CAE Activities", 14, currentY);
      currentY += 8;

      const caeBody = [];
      Object.entries(sharedRef?.currentCAE?.pdfData || {}).forEach(
        ([activityName, activity]) => {
          caeBody.push([
            cleanText(activityName),
            cleanText(activity["Proto"]),
            cleanText(activity["Serie"]),
            cleanText(activity["Number Of Loops"]),
          ]);
        },
      );

      autoTable(doc, {
        startY: currentY,
        head: [["Activity", "Proto", "Serie", "Number Of Loops"]],
        body: caeBody,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      currentY = doc.lastAutoTable.finalY + 12;
    }

    // =========================================================
    // PS ACTIVITIES SECTION (MERGED FROM LOCAL)
    // =========================================================

    console.log("PS PDF DATA -->", sharedRef?.currentPS?.pdfData);

    // =========================================================
    // 1. PS ACTIVITIES TABLE
    // =========================================================
    if (sharedRef?.currentPS?.pdfData?.activities?.length > 0) {
      checkPageBreak(25);

      doc.setFontSize(14);
      doc.text("PS Activities", 14, currentY);
      currentY += 6;

      const activityBodyPS = [];
      sharedRef?.currentPS?.pdfData?.activities?.forEach((activity) => {
        activityBodyPS.push([cleanText(activity.name), "", ""]);
        activity.rows.forEach((row) => {
          activityBodyPS.push([
            `   ${cleanText(row.label)}`,
            cleanText(row.Proto ?? "-"),
            cleanText(row.Serie ?? "-"),
          ]);
        });
      });

      autoTable(doc, {
        startY: currentY,
        head: [["Activity / Sub-Activity", "Proto", "Serie"]],
        body: activityBodyPS,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: {
          fillColor: [25, 42, 86],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didParseCell: function (data) {
          if (
            data.row.index >= 0 &&
            activityBodyPS[data.row.index][1] === "" &&
            activityBodyPS[data.row.index][2] === ""
          ) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [230, 230, 230];
          }
        },
      });

      currentY = doc.lastAutoTable.finalY + 8;
    }

    // =========================================================
    // 2. PS PRODUCT PARTS TABLE
    // =========================================================
    if (
      sharedRef?.currentPS?.pdfData?.productParts &&
      Object.keys(sharedRef?.currentPS?.pdfData?.productParts).length > 0
    ) {
      checkPageBreak(20);

      doc.setFontSize(14);
      doc.text("PS Product Parts", 14, currentY);
      currentY += 6;

      const productBodyPS = Object.entries(
        sharedRef?.currentPS?.pdfData?.productParts || {},
      ).map(([name, val]) => [
        cleanText(name),
        cleanText(val.noOfComponent ?? "-"),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Product", "No Of Components"]],
        body: productBodyPS,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: 255,
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      currentY = doc.lastAutoTable.finalY + 8;
    }

    // =========================================================
    // THERMAL SIMULATION SECTION (MERGED FROM LOCAL)
    // =========================================================
    const thermalPdf = sharedRef?.currentThermalSimulation?.pdf || {};
    if (Object.keys(thermalPdf).length > 0) {
      checkPageBreak(25);

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Thermal Simulation", 14, currentY);
      currentY += 8;

      const thermalBody = [
        ["RFQ PCB", cleanText(thermalPdf.rfqPCB)],
        ["DEV PCB", cleanText(thermalPdf.devPCB)],
        ["RFQ Cases", cleanText(thermalPdf.rfqCases)],
        ["DEV Cases", cleanText(thermalPdf.devCases)],
        ["RFQ Loops", cleanText(thermalPdf.rfqLoops)],
        ["DEV Loops", cleanText(thermalPdf.devLoops)],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [["Parameter", "Value"]],
        body: thermalBody,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      currentY = doc.lastAutoTable.finalY + 12;
    }

    // =========================================================
    // OFFER / INDUSTRIALIZATION / DATA MANAGEMENT TABLES (MERGED)
    // =========================================================
    const addSimpleTable = (title, rows) => {
      if (!rows?.length) return;

      checkPageBreak(25);

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text(title, 14, currentY);
      currentY += 6;

      const body = rows.map((row) => [
        cleanText(row.activityKey),
        cleanText(row.resources),
        cleanText(row.weeks),
        cleanText(row.hoursPerWeek),
        cleanText(row.totalHours),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [
          ["Activity Key", "Resources", "Weeks", "Hours/Week", "Total Hours"],
        ],
        body: body,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 2 },
        headStyles: {
          fillColor: [52, 58, 64],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      currentY = doc.lastAutoTable.finalY + 10;
    };

    // CALL YOUR OBJECTS HERE
    addSimpleTable(
      "Offer Rows",
      typeof offerRows !== "undefined" ? offerRows : [],
    );
    addSimpleTable(
      "Industrialization Rows",
      typeof industrializationRows !== "undefined" ? industrializationRows : [],
    );
    addSimpleTable(
      "Data Management Rows",
      typeof dataManagementRows !== "undefined" ? dataManagementRows : [],
    );

    // =========================================================
    // SAVE PDF
    // =========================================================
    doc.save("cost-sheet.pdf");
  };

  const downloadPDF = () => {
    console.log("PDF DATA -->");
    const doc = new jsPDF();

    // =========================================================
    // SAFE CLEAN FUNCTION
    // =========================================================
    const cleanText = (text) => {
      if (!text) return "-";
      return String(text)
        .replace(/%/g, "")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim();
    };

    // =========================================================
    // Title
    // =========================================================
    doc.setFontSize(14);
    doc.setTextColor(52, 58, 64);
    doc.text(quotationText || "COST Sheets CAD", 14, 18);

    // =========================================================
    // Phase Header
    // =========================================================
    const tableStartY = drawPhaseHeaderPDF(doc, sharedRef.PHASE_META, 22);

    // =========================================================
    // Columns & Formatters
    // =========================================================
    const columns = [
      "Cost Center",
      "Activities",
      "Ph0 Hrs",
      "Ph0 Cost",
      "Ph1 Hrs",
      "Ph1 Cost",
      "Ph2 Hrs",
      "Ph2 Cost",
      "Ph3-4 Hrs",
      "Ph3-4 Cost",
      "TOTAL Hrs",
      "TOTAL Cost",
    ];

    const formatRows = (rowsArray) =>
      rowsArray?.map((row) => [
        row.org ?? "",
        row.role ?? "",
        row.phase0?.hours ?? "-",
        row.phase0?.cost ?? "-",
        row.phase1?.hours ?? "-",
        row.phase1?.cost ?? "-",
        row.phase2?.hours ?? "-",
        row.phase2?.cost ?? "-",
        row.phase34?.hours ?? "-",
        row.phase34?.cost ?? "-",
        row.total?.hours ?? "-",
        row.total?.cost ?? "-",
      ]) ?? [];

    const sections = [
      { title: "Design", rows: data?.rows },
      { title: "CAE", rows: data?.rows2 },
      { title: "Passive Safety", rows: data?.rows4 },
      { title: "Thermal Simulation", rows: data?.rows3 },
      { title: "Other", rows: data?.rows5 },
      { title: "Total Budget", rows: data?.rows6 },
    ];

    let currentY = tableStartY;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;

    // Helper for page breaks
    const checkPageBreak = (neededSpace = 20) => {
      if (currentY > pageHeight - neededSpace) {
        doc.addPage();
        currentY = 14;
      }
    };

    // =========================================================
    // Render Main Section Tables
    // =========================================================
    sections.forEach((section) => {
      if (!section.rows?.length) return;

      // Force a page break for "Other", or use a standard safety margin for other tables
      if (section.title === "Other") {
        doc.addPage();
        currentY = 14;
      } else {
        checkPageBreak(25);
      }
      // Section Title
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(section.title, 14, currentY + 6);
      currentY += 8;

      // Section Table
      autoTable(doc, {
        startY: currentY,
        head: [columns],
        body: formatRows(section.rows),
        theme: "grid",
        styles: { fontSize: 6.5, textColor: [0, 0, 0] },
        headStyles: {
          fillColor: [248, 249, 250],
          textColor: [52, 58, 64],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [233, 236, 239] },
        bodyStyles: { fillColor: [206, 212, 218] },
        columnStyles: {
          1: { cellWidth: 40 },
          10: { fontStyle: "bold" },
          11: { textColor: [33, 37, 41], fontStyle: "bold" },
        },
      });

      currentY = doc.lastAutoTable.finalY + 7;
    });

    // =========================================================
    // Assumptions Box
    // =========================================================
    let assumptionsY = currentY + 5;
    const lineHeight = 4;

    if (assumptionsY > pageHeight - 20) {
      doc.addPage();
      assumptionsY = 14;
    }

    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("Assumptions:", marginX, assumptionsY);
    assumptionsY += lineHeight + 2;

    doc.setFontSize(7);
    doc.setFont(undefined, "normal");

    const safeAssumptionText =
      typeof assumptionText !== "undefined"
        ? assumptionText
        : typeof assumptionsText !== "undefined"
          ? assumptionsText
          : "";

    const textLines = doc.splitTextToSize(
      safeAssumptionText.trim(),
      pageWidth - marginX * 2,
    );

    textLines.forEach((line) => {
      if (assumptionsY + lineHeight > pageHeight - 14) {
        doc.addPage();
        assumptionsY = 14;
      }
      doc.text(line, marginX, assumptionsY);
      assumptionsY += lineHeight;
    });

    currentY = assumptionsY + 10;

    // =========================================================
    // MUA COST SHEET PDF SECTION
    // =========================================================
    checkPageBreak(30);

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("MUA Cost Sheet", 14, currentY);
    currentY += 4;

    const { columnsMau, years } = buildPdfColumns(tableData);
    const rowsMau = buildPdfRows(tableData, years);

    autoTable(doc, {
      startY: currentY,
      head: [columnsMau],
      body: rowsMau,
      theme: "grid",
      styles: { fontSize: 6.5 },
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    currentY = doc.lastAutoTable.finalY + 8;

    /* =========================================================
       --- COMPACT & STYLED SECTIONS BELOW MUA COST SHEET ---
       ========================================================= */

    // =========================================================
    // 1. ACTIVITIES TABLE (Atlassian Blue)
    // =========================================================
    checkPageBreak(25);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "bold");
    doc.text("Activities", 14, currentY);
    currentY += 4;

    const activityBody = [];
    pdfData.activities.forEach((activity) => {
      activityBody.push([cleanText(activity.name), "", ""]);
      activity.rows.forEach((row) => {
        activityBody.push([
          `   ${cleanText(row.label)}`,
          cleanText(row.Proto ?? "-"),
          cleanText(row.Serie ?? "-"),
        ]);
      });
    });

    autoTable(doc, {
      startY: currentY,
      head: [["Activity / Sub-Activity", "Proto", "Serie"]],
      body: activityBody,
      theme: "grid",
      styles: {
        fontSize: 6.5,
        cellPadding: 1.5,
        textColor: [33, 37, 41], // Standardize a highly legible dark grey for all body text
      },
      headStyles: {
        fillColor: [15, 23, 42], // Deep Slate/Navy (High contrast background)
        textColor: 255, // Pure white text
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Crisp, very light grey/blue for alternating rows
      },
      didParseCell: function (data) {
        // Target the parent activity rows
        const rowData = activityBody[data.row.index];   // local variable to access the full row data
        if (
          rowData &&
          rowData[1] === "" &&
          rowData[2] === ""
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [226, 232, 240]; // Noticeable mid-tone slate grey
          data.cell.styles.textColor = [15, 23, 42]; // Force dark text to guarantee contrast against the grey fill
        }
      },
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // =========================================================
    // 2. PRODUCT PARTS TABLE (Atlassian Slate)
    // =========================================================
    checkPageBreak(20);

    doc.setFontSize(11);
    doc.text("Product Parts", 14, currentY);
    currentY += 4;

    const productBody = Object.entries(pdfData.productParts || {}).map(
      ([name, val]) => [cleanText(name), cleanText(val.noOfComponent ?? "-")],
    );

    autoTable(doc, {
      startY: currentY,
      head: [["Product", "No Of Components"]],
      body: productBody,
      theme: "grid",
      styles: { fontSize: 6.5, cellPadding: 1.5 },
      headStyles: {
        fillColor: [23, 43, 77], // Atlassian Dark Slate
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [244, 245, 247] },
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // =========================================================
    // 3. ADD ON COMPONENTS TABLE (Atlassian Teal)
    // =========================================================
    checkPageBreak(20);

    doc.setFontSize(11);
    doc.text("Add On Components", 14, currentY);
    currentY += 4;

    const addOnBody = pdfData.addOnComponents.map((item) => [
      cleanText(item.activity),
      cleanText(item.product),
      cleanText(item.noOfComponent),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Activity", "Product", "No Of Components"]],
      body: addOnBody,
      theme: "grid",
      styles: { fontSize: 6.5, cellPadding: 1.5 },
      headStyles: {
        fillColor: [0, 136, 170], // Atlassian Teal
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [244, 245, 247] },
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // =========================================================
    // CAE ACTIVITIES SECTION (Atlassian Purple)
    // =========================================================
    if (Object.keys(sharedRef?.currentCAE?.pdfData || {}).length > 0) {
      checkPageBreak(25);

      doc.setFontSize(11);
      doc.text("CAE Activities", 14, currentY);
      currentY += 4;

      const caeBody = [];
      Object.entries(sharedRef?.currentCAE?.pdfData || {}).forEach(
        ([activityName, activity]) => {
          caeBody.push([
            cleanText(activityName),
            cleanText(activity["Proto"]),
            cleanText(activity["Serie"]),
            cleanText(activity["Number Of Loops"]),
          ]);
        },
      );

      autoTable(doc, {
        startY: currentY,
        head: [["Activity", "Proto", "Serie", "Number Of Loops"]],
        body: caeBody,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        headStyles: {
          fillColor: [101, 84, 192], // Atlassian Purple
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [244, 245, 247] },
      });

      currentY = doc.lastAutoTable.finalY + 8;
    }

    // =========================================================
    // PS ACTIVITIES SECTION
    // =========================================================
    console.log("PS PDF DATA -->", sharedRef?.currentPS?.pdfData);

    // 1. PS ACTIVITIES TABLE (Atlassian Blue)
    if (sharedRef?.currentPS?.pdfData?.activities?.length > 0) {
      checkPageBreak(25);

      doc.setFontSize(11);
      doc.text("PS Activities", 14, currentY);
      currentY += 4;

      const activityBodyPS = [];
      sharedRef?.currentPS?.pdfData?.activities?.forEach((activity) => {
        activityBodyPS.push([cleanText(activity.name), "", ""]);
        activity.rows.forEach((row) => {
          activityBodyPS.push([
            `   ${cleanText(row.label)}`,
            cleanText(row.Proto ?? "-"),
            cleanText(row.Serie ?? "-"),
          ]);
        });
      });

      autoTable(doc, {
        startY: currentY,
        head: [["Activity / Sub-Activity", "Proto", "Serie"]],
        body: activityBodyPS,
        theme: "grid",
        styles: {
          fontSize: 6.5,
          cellPadding: 1.5,
          textColor: [33, 37, 41], // Standardize a highly legible dark grey for all body text
        },
        headStyles: {
          fillColor: [15, 23, 42], // Deep Slate/Navy (High contrast background)
          textColor: 255, // Pure white text
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Crisp, very light grey/blue for alternating rows
        },
        didParseCell: function (data) {
          // Target the parent activity rows
          if (
            data.row.index >= 0 &&
            activityBodyPS[data.row.index][1] === "" &&
            activityBodyPS[data.row.index][2] === ""
          ) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [226, 232, 240]; // Noticeable mid-tone slate grey
            data.cell.styles.textColor = [15, 23, 42]; // Force dark text to guarantee contrast against the grey fill
          }
        },
      });

      currentY = doc.lastAutoTable.finalY + 6;
    }

    // 2. PS PRODUCT PARTS TABLE (Atlassian Slate)
    if (
      sharedRef?.currentPS?.pdfData?.productParts &&
      Object.keys(sharedRef?.currentPS?.pdfData?.productParts).length > 0
    ) {
      checkPageBreak(20);

      doc.setFontSize(11);
      doc.text("PS Product Parts", 14, currentY);
      currentY += 4;

      const productBodyPS = Object.entries(
        sharedRef?.currentPS?.pdfData?.productParts || {},
      ).map(([name, val]) => [
        cleanText(name),
        cleanText(val.noOfComponent ?? "-"),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Product", "No Of Components"]],
        body: productBodyPS,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        headStyles: {
          fillColor: [23, 43, 77], // Atlassian Dark Slate
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [244, 245, 247] },
      });

      currentY = doc.lastAutoTable.finalY + 8;
    }

    // =========================================================
    // THERMAL SIMULATION SECTION (Atlassian Red/Orange)
    // =========================================================
    const thermalPdf = sharedRef?.currentThermalSimulation?.pdf || {};
    if (Object.keys(thermalPdf).length > 0) {
      checkPageBreak(25);

      doc.setFontSize(11);
      doc.text("Thermal Simulation", 14, currentY);
      currentY += 4;

      const thermalBody = [
        ["RFQ PCB", cleanText(thermalPdf.rfqPCB)],
        ["DEV PCB", cleanText(thermalPdf.devPCB)],
        ["RFQ Cases", cleanText(thermalPdf.rfqCases)],
        ["DEV Cases", cleanText(thermalPdf.devCases)],
        ["RFQ Loops", cleanText(thermalPdf.rfqLoops)],
        ["DEV Loops", cleanText(thermalPdf.devLoops)],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [["Parameter", "Value"]],
        body: thermalBody,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        headStyles: {
          fillColor: [191, 38, 0], // Atlassian Red/Orange
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [244, 245, 247] },
      });

      currentY = doc.lastAutoTable.finalY + 8;
    }

    // =========================================================
    // OFFER / INDUSTRIALIZATION / DATA MANAGEMENT TABLES
    // =========================================================
    const addSimpleTable = (title, rows) => {
      if (!rows?.length) return;

      checkPageBreak(25);

      doc.setFontSize(11);
      doc.text(title, 14, currentY);
      currentY += 4;

      const body = rows.map((row) => [
        cleanText(row.activityKey),
        cleanText(row.resources),
        cleanText(row.weeks),
        cleanText(row.hoursPerWeek),
        cleanText(row.totalHours),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [
          ["Activity Key", "Resources", "Weeks", "Hours/Week", "Total Hours"],
        ],
        body: body,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 1.5 },
        headStyles: {
          fillColor: [66, 82, 110], // Atlassian Neutral Grey-Blue
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [244, 245, 247] },
      });

      currentY = doc.lastAutoTable.finalY + 8;
    };

    // CALL YOUR OBJECTS HERE
    addSimpleTable(
      "Offer Rows",
      typeof offerRows !== "undefined" ? offerRows : [],
    );
    addSimpleTable(
      "Industrialization Rows",
      typeof industrializationRows !== "undefined" ? industrializationRows : [],
    );
    addSimpleTable(
      "Data Management Rows",
      typeof dataManagementRows !== "undefined" ? dataManagementRows : [],
    );

    // =========================================================
    // SAVE PDF
    // =========================================================
    doc.save("cost-sheet.pdf");
  };

  // const downloadPDF2 = () => {
  //   const doc = new jsPDF();

  //   // --------------------------
  //   // Title
  //   // --------------------------
  //   doc.setFontSize(18);
  //   doc.setTextColor(255, 102, 0);
  //   // doc.text("COST Sheets CAD", 14, 18);
  //   doc.text(quotationText, 14, 18);

  //   // --------------------------
  //   // Phase Header
  //   // --------------------------
  //   const phaseHeaderStartY = 22;

  //   const tableStartY = drawPhaseHeaderPDF(doc, PHASE_META, phaseHeaderStartY);

  //   const columns = [
  //     "Design",
  //     "Role",
  //     "Phase 0 Hours",
  //     "Phase 0 Costs",
  //     "Phase 1 Hours",
  //     "Phase 1 Costs",
  //     "Phase 2 Hours",
  //     "Phase 2 Costs",
  //     "Phase 3-4 Hours",
  //     "Phase 3-4 Costs",
  //     "TOTAL Hours",
  //     "TOTAL Costs",
  //   ];

  //   const rows = data?.rows?.map((row) => [
  //     row.org,
  //     row.role,
  //     row.phase0?.hours ?? "-",
  //     row.phase0?.cost ?? "-",
  //     row.phase1?.hours ?? "-",
  //     row.phase1?.cost ?? "-",
  //     row.phase2?.hours ?? "-",
  //     row.phase2?.cost ?? "-",
  //     row.phase34?.hours ?? "-",
  //     row.phase34?.cost ?? "-",
  //     row.total?.hours ?? "-",
  //     row.total?.cost ?? "-",
  //   ]);

  //   autoTable(doc, {
  //     startY: tableStartY,
  //     head: [columns],
  //     body: rows,
  //     theme: "grid",
  //     styles: { fontSize: 8, textColor: [0, 0, 0] }, // black text
  //     headStyles: {
  //       fillColor: [255, 153, 51], // orange header
  //       textColor: [255, 255, 255], // white text
  //       fontStyle: "bold",
  //     },
  //     alternateRowStyles: {
  //       fillColor: [255, 243, 230], // light orange for alternate rows
  //     },
  //     bodyStyles: {
  //       fillColor: [255, 255, 255], // white background for normal rows
  //     },
  //     columnStyles: {
  //       11: { textColor: [255, 51, 0], fontStyle: "bold" }, // TOTAL Costs in bright orange
  //       10: { fontStyle: "bold" }, // TOTAL Hours bold
  //     },
  //   });

  //   doc.save("cost-sheet.pdf");
  // };

  // const downloadPDF1 = () => {
  //   const doc = new jsPDF();

  //   // --------------------------
  //   // Title
  //   // --------------------------
  //   doc.setFontSize(18);
  //   doc.setTextColor(255, 102, 0);
  //   doc.text("COST Sheets CAD", 14, 18);

  //   // --------------------------
  //   // Phase Header
  //   // --------------------------
  //   const tableStartY = drawPhaseHeaderPDF(doc, PHASE_META, 22);

  //   // --------------------------
  //   // Columns
  //   // --------------------------
  //   const columns = [
  //     "Design",
  //     "Role",
  //     "Phase 0 Hours",
  //     "Phase 0 Costs",
  //     "Phase 1 Hours",
  //     "Phase 1 Costs",
  //     "Phase 2 Hours",
  //     "Phase 2 Costs",
  //     "Phase 3-4 Hours",
  //     "Phase 3-4 Costs",
  //     "TOTAL Hours",
  //     "TOTAL Costs",
  //   ];

  //   // --------------------------
  //   // Rows
  //   // --------------------------
  //   const rows = data?.rows?.map((row) => [
  //     row.org,
  //     row.role,
  //     row.phase0?.hours ?? "-",
  //     row.phase0?.cost ?? "-",
  //     row.phase1?.hours ?? "-",
  //     row.phase1?.cost ?? "-",
  //     row.phase2?.hours ?? "-",
  //     row.phase2?.cost ?? "-",
  //     row.phase34?.hours ?? "-",
  //     row.phase34?.cost ?? "-",
  //     row.total?.hours ?? "-",
  //     row.total?.cost ?? "-",
  //   ]);

  //   // --------------------------
  //   // Table
  //   // --------------------------
  //   autoTable(doc, {
  //     head: [columns],
  //     body: rows,
  //     startY: tableStartY,
  //     theme: "grid",
  //     styles: { fontSize: 8, textColor: [0, 0, 0] },
  //     headStyles: {
  //       fillColor: [255, 153, 51],
  //       textColor: [255, 255, 255],
  //       fontStyle: "bold",
  //     },
  //     columnStyles: {
  //       10: { fontStyle: "bold" },
  //       11: { textColor: [255, 51, 0], fontStyle: "bold" },
  //     },
  //   });

  //   doc.save("cost-sheet.pdf");
  // };

  function drawPhaseHeaderPDF(doc, phaseMeta, startY = 28) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const boxWidth = (pageWidth - marginX * 2) / 4;
    let y = startY;

    doc.setFontSize(9);

    Object.values(phaseMeta).forEach((phase, index) => {
      const x = marginX + index * boxWidth;

      // Outer box
      doc.rect(x, y, boxWidth, 22);

      // Phase title
      doc.setFont(undefined, "bold");
      doc.text(phase.label, x + boxWidth / 2, y + 5, { align: "center" });

      doc.setFont(undefined, "normal");
      doc.text(`Start: ${phase.start}`, x + 2, y + 10);
      doc.text(`End: ${phase.end}`, x + 2, y + 15);
      doc.text(`Weeks: ${phase.weeks}`, x + 2, y + 20);
    });

    return y + 26; // next Y position after header
  }

  //===============For MUA Sheet start================

  // This Data will recive form Other Method as it is  then you Can pass dyanamically
  // const tableData1 = {
  //   "G.A.Pune (IF)": {
  //     ceco: "DBSIF",
  //     yearly: {
  //       2025: { hours: 30, cost: 459 },
  //       2026: { hours: 170, cost: 2663.9 },
  //       2027: { hours: 300, cost: 4812 },
  //       2028: { hours: 50, cost: 821 },
  //     },
  //     totalHours: 550,
  //     totalCost: 8755.9,
  //   },
  //   "G. A. Deutschland": {
  //     ceco: "HALIF",
  //     yearly: {
  //       2025: { hours: 45, cost: 819 },
  //       2026: { hours: 255, cost: 4778.5 },
  //     },
  //     totalHours: 300,
  //     totalCost: 5597.5,
  //   },
  // };

  // const tableData = {
  //   "Antolin China Investment": {
  //     ceco: "ACIIF",
  //     yearly: {
  //       2025: { hours: 120, cost: 1800 },
  //       2026: { hours: 200, cost: 3200 },
  //       2027: { hours: 150, cost: 2550 },
  //     },
  //     totalHours: 470,
  //     totalCost: 7550,
  //   },

  //   "Antolin Czech Republic": {
  //     ceco: "ACZIF",
  //     yearly: {
  //       2026: { hours: 180, cost: 2900 },
  //       2027: { hours: 220, cost: 3600 },
  //       2028: { hours: 90, cost: 1500 },
  //     },
  //     totalHours: 490,
  //     totalCost: 8000,
  //   },

  //   "Antolin Mexico": {
  //     ceco: "ATIIF",
  //     yearly: {
  //       2025: { hours: 100, cost: 1400 },
  //       2028: { hours: 130, cost: 1950 },
  //     },
  //     totalHours: 230,
  //     totalCost: 3350,
  //   },

  //   "G.A.Pune (IF)": {
  //     ceco: "DBSIF",
  //     yearly: {
  //       2025: { hours: 30, cost: 459 },
  //       2026: { hours: 170, cost: 2663.9 },
  //       2027: { hours: 300, cost: 4812 },
  //       2028: { hours: 50, cost: 821 },
  //     },
  //     totalHours: 550,
  //     totalCost: 8755.9,
  //   },

  //   "G.A.Pune (IL)": {
  //     ceco: "DBSIL",
  //     yearly: {
  //       2026: { hours: 140, cost: 2150 },
  //       2027: { hours: 260, cost: 4100 },
  //     },
  //     totalHours: 400,
  //     totalCost: 6250,
  //   },

  //   "G. A. Deutschland": {
  //     ceco: "HALIF",
  //     yearly: {
  //       2025: { hours: 45, cost: 819 },
  //       2026: { hours: 255, cost: 4778.5 },
  //     },
  //     totalHours: 300,
  //     totalCost: 5597.5,
  //   },

  //   "G. A. France": {
  //     ceco: "HRFIF",
  //     yearly: {
  //       2027: { hours: 210, cost: 3500 },
  //       2028: { hours: 160, cost: 2700 },
  //     },
  //     totalHours: 370,
  //     totalCost: 6200,
  //   },

  //   "External Engineering (IF)": {
  //     ceco: "XXIF",
  //     yearly: {
  //       2025: { hours: 90, cost: 2700 },
  //       2026: { hours: 110, cost: 3500 },
  //       2027: { hours: 130, cost: 4200 },
  //       2028: { hours: 150, cost: 5000 },
  //       2029: { hours: 170, cost: 5900 },
  //     },
  //     totalHours: 650,
  //     totalCost: 21300,
  //   },

  //   "External Engineering HCC (IF)": {
  //     ceco: "XXIF_HCC",
  //     yearly: {
  //       2026: { hours: 200, cost: 6000 },
  //       2027: { hours: 240, cost: 7500 },
  //     },
  //     totalHours: 440,
  //     totalCost: 13500,
  //   },

  //   "External Engineering BCC (IF)": {
  //     ceco: "XXIF_BCC",
  //     yearly: {
  //       2028: { hours: 180, cost: 5400 },
  //       2029: { hours: 220, cost: 6900 },
  //     },
  //     totalHours: 400,
  //     totalCost: 12300,
  //   },

  //   TOTAL: {
  //     ceco: "XXIF_BCC",
  //     yearly: {
  //       2028: { hours: 180000, cost: 5400000 },
  //       2029: { hours: 22000, cost: 690000 },
  //     },
  //     totalHours: 400000,
  //     totalCost: 12300000,
  //   },
  // };

  const tableData = FINAL_DEBUG_DATA.output3.finalHoursAndCosts; //FINAL_DEBUG_DATA.output3.finalHoursAndCosts
  function buildPdfColumns(data) {
    // Collect all unique years dynamically
    const years = Array.from(
      new Set(Object.values(data).flatMap((cc) => Object.keys(cc.yearly))),
    ).sort();

    // Static columns first
    const columnsMau = ["Cost Center", "CECO"];

    // Year-based columns
    years.forEach((year) => {
      columnsMau.push(`${year} Hours`);
      columnsMau.push(`${year} Cost`);
    });

    // Totals
    columnsMau.push("Total Hours");
    columnsMau.push("Total Cost");

    return { columnsMau, years };
  }

  function buildPdfRows(data, years) {
    return Object.entries(data).map(([center, details]) => {
      const rowMau = [center, details.ceco];

      // Add year-wise hours & cost
      years.forEach((year) => {
        rowMau.push(details.yearly[year]?.hours.toFixed(2) ?? "-");
        rowMau.push(details.yearly[year]?.cost.toFixed(2) ?? "-");  // Format cost to 2 decimal places
      });

      // Add totals
      rowMau.push(details.totalHours.toFixed(2));
      rowMau.push(details.totalCost.toFixed(2));  // Format total cost to 2 decimal places

      return rowMau;
    });
  }

  //===============For MUA Sheet end================
  //=============================================

  // Helper function to extract final totals from each category
  const getFinaltotals = () => {
    console.log(
      "CAE Data Rows",
      data?.rows2,
      "\n SharedRef CAE",
      sharedRef.currentCAE,
      "\n Weeks",
      sharedRef.phaseflagShared,
    );
    const categories = [
      { name: "Design", data: data?.rows },
      {
        name: "CAE",
        getCaeData: () => {
          // First try to get CAE data from sharedRef (auto-loaded)
          if (
            sharedRef.currentCAE?.sumTDL !== undefined ||
            sharedRef.currentCAE?.sumDE !== undefined
          ) {
            let caeHours = 0;
            if(sharedRef.phaseflagShared.phase1flag && !sharedRef.phaseflagShared.phase2flag){
              caeHours= sharedRef.currentCAE.CAEEngineersPhase1 + sharedRef.currentCAE.CAEStandardWorkPhase1
            } else if(!sharedRef.phaseflagShared.phase1flag && sharedRef.phaseflagShared.phase2flag){
              caeHours= sharedRef.currentCAE.CAEEngineersPhase2 + sharedRef.currentCAE.CAEStandardWorkPhase2
            } else if(sharedRef.phaseflagShared.phase1flag && sharedRef.phaseflagShared.phase2flag){
              caeHours= sharedRef.currentCAE.caeTotalHrs
            } else if(!sharedRef.phaseflagShared.phase1flag && !sharedRef.phaseflagShared.phase2flag){
              caeHours= 0
            }
            return {
              total: {
                // hours:
                //   sharedRef.phaseflagShared.phase1flag &&
                //   sharedRef.phaseflagShared.phase2flag
                //     ? sharedRef.currentCAE.caeTotalHrs.toFixed(2)
                //     : !sharedRef.phaseflagShared.phase1flag &&
                //         !sharedRef.phaseflagShared.phase2flag
                //       ? 0
                //       : sharedRef.currentCAE.caeTotalHrs.toFixed(2) / 2,
                hours: caeHours.toFixed(2),
                cost: data?.rows2?.[data.rows2.length - 1]?.total?.cost ?? 0,
              },
            };
          }
          // Fallback to data prop if sharedRef is empty
          return data?.rows2?.[data.rows2.length - 1];
        },
      },

      { name: "PS", data: data?.rows4 },
      { name: "Thermal Simulation", data: data?.rows3 },
      { name: "Other", data: data?.rows5 },
      { name: "Total", data: data?.rows6 },
    ];

    return categories.map((cat) => {
      let lastRow;
      if (cat.getCaeData) {
        lastRow = cat.getCaeData();
      } else {
        lastRow = cat.data?.[cat.data.length - 1];
      }

      console.log("CAE REFRESH TRIGGERED");

      return {
        category: cat.name,
        totalHours: lastRow?.total?.hours ?? "-",
        totalCost: lastRow?.total?.cost ?? "-",
      };
    });
  };

  const categoryTotals = getFinaltotals();

  sharedRef.total = categoryTotals.find((cat) => cat.category === "Total")

  return (
    //---------

    <div className="overflow-x-auto p-4">
      {/* <h1 className="text-xl font-bold mb-2">COST Sheets</h1> */}

      {/* PDF Button - Right Aligned with Interactive Styling */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 20,
          marginTop: 15,
        }}
      >
        <button
          className="btn-download"
          onClick={downloadPDF}
          type="button"
          title="Download Saved Quotation as PDF"
          style={{
            padding: "10px 18px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "500",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1d4ed8";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(37, 99, 235, 0.4)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Native SVG Download Icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download PDF</span>
        </button>
      </div>
      {/* ✅ Category Summary Table */}
      <div className="my-8" style={{ marginTop: 15, marginBottom: 15 }}>
        <h2 className="text-lg font-bold mb-4 bg-gray-200 p-2">
          Category Summary - Final Totals
        </h2>
        <table className="min-w-full border border-black text-sm">
          <thead>
            <tr className="bg-gray-100 text-center">
              <th className="border p-2 font-bold">Category</th>
              <th className="border p-2 font-bold">Total Hours</th>
              <th className="border p-2 font-bold">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {categoryTotals.map((item, index) => (
              <tr key={index} className="text-right hover:bg-gray-50">
                <td className="border p-2 text-left font-semibold">
                  {item.category}
                </td>
                <td className="border p-2">{item.totalHours}</td>
                <td className="border p-2">{item.totalCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Phase Header */}
      <br />
      <h1>Phase Timelines</h1>
      <PhaseHeader
        phaseDates={phaseDates}
        manualWeeks={manualWeeks}
        updateManualWeeks={updateManualWeeks}
      />
      <h1>Design </h1>
      {/* ✅ Table */}
      {/* Table */}
      <table className="min-w-full border border-black text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border p-2">
              Cost Center
            </th>
            <th rowSpan={2} className="border p-2">
              Activities
            </th>
            <th colSpan={2} className="border p-2">
              Phase 0
            </th>
            <th colSpan={2} className="border p-2">
              Phase 1
            </th>
            <th colSpan={2} className="border p-2">
              Phase 2
            </th>
            <th colSpan={2} className="border p-2">
              Phase 3-4
            </th>
            <th colSpan={2} className="border p-2 text-red-600">
              TOTAL
            </th>
          </tr>
          <tr className="bg-gray-50 text-center">
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
          </tr>
        </thead>
        <tbody>
          {data?.rows?.map((row, index) => {
            const isLastRow = index === data.rows.length - 1;

            return (
              <tr
                key={index}
                style={
                  isLastRow
                    ? {
                        backgroundColor: "#0a8efa",
                        fontWeight: "bold",
                        borderTop: "2px solid #474234",
                        color: "white",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                      }
                    : {}
                }
                className="text-right"
              >
                <td className="border p-2 text-left">{row.org}</td>
                <td className="border p-2 text-left">{row.role}</td>
                <td className="border p-2">
                  {typeof row.phase0?.hours === "number"
                    ? row.phase0.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase0?.cost === "number"
                    ? row.phase0.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.hours === "number"
                    ? row.phase1.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.cost === "number"
                    ? row.phase1.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.hours === "number"
                    ? row.phase2.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.cost === "number"
                    ? row.phase2.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.hours === "number"
                    ? row.phase34.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.cost === "number"
                    ? row.phase34.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {row.total?.hours ?? "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {row.total?.cost ?? "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <h1>CAE </h1>
      {/* ✅ Table 2*/}
      {/* Table */}
      <table className="min-w-full border border-black text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border p-2">
              Cost Center
            </th>
            <th rowSpan={2} className="border p-2">
              Activities
            </th>
            <th colSpan={2} className="border p-2">
              Phase 0
            </th>
            <th colSpan={2} className="border p-2">
              Phase 1
            </th>
            <th colSpan={2} className="border p-2">
              Phase 2
            </th>
            <th colSpan={2} className="border p-2">
              Phase 3-4
            </th>
            <th colSpan={2} className="border p-2 text-red-600">
              TOTAL
            </th>
          </tr>
          <tr className="bg-gray-50 text-center">
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
          </tr>
        </thead>
        <tbody>
          {data?.rows2?.map((row, index) => {
            const isLastRow = index === data.rows2.length - 1;

            return (
              <tr
                key={index}
                style={
                  isLastRow
                    ? {
                        backgroundColor: "#0a8efa",
                        fontWeight: "bold",
                        borderTop: "2px solid #474234",
                        color: "white",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                      }
                    : {}
                }
                className="text-right"
              >
                <td className="border p-2 text-left">{row.org}</td>
                <td className="border p-2 text-left">{row.role}</td>
                <td className="border p-2">
                  {typeof row.phase0?.hours === "number"
                    ? row.phase0.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase0?.cost === "number"
                    ? row.phase0.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.hours === "number"
                    ? row.phase1.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.cost === "number"
                    ? row.phase1.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.hours === "number"
                    ? row.phase2.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.cost === "number"
                    ? row.phase2.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.hours === "number"
                    ? row.phase34.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.cost === "number"
                    ? row.phase34.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.hours === "number"
                    ? row.total.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.cost === "number"
                    ? row.total.cost.toFixed(2)
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <h1>Passive Safety </h1>
      {/* ✅ Table 4*/}
      {/* Table */}
      <table className="min-w-full border border-black text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border p-2">
              Cost Center
            </th>
            <th rowSpan={2} className="border p-2">
              Activities
            </th>
            <th colSpan={2} className="border p-2">
              Phase 0
            </th>
            <th colSpan={2} className="border p-2">
              Phase 1
            </th>
            <th colSpan={2} className="border p-2">
              Phase 2
            </th>
            <th colSpan={2} className="border p-2">
              Phase 3-4
            </th>
            <th colSpan={2} className="border p-2 text-red-600">
              TOTAL
            </th>
          </tr>
          <tr className="bg-gray-50 text-center">
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
          </tr>
        </thead>
        <tbody>
          {data?.rows4?.map((row, index) => {
            const isLastRow = index === data.rows4.length - 1;

            return (
              <tr
                key={index}
                style={
                  isLastRow
                    ? {
                        backgroundColor: "#0a8efa",
                        fontWeight: "bold",
                        borderTop: "2px solid #474234",
                        color: "white",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                      }
                    : {}
                }
                className="text-right"
              >
                <td className="border p-2 text-left">{row.org}</td>
                <td className="border p-2 text-left">{row.role}</td>
                <td className="border p-2">
                  {typeof row.phase0?.hours === "number"
                    ? row.phase0.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase0?.cost === "number"
                    ? row.phase0.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.hours === "number"
                    ? row.phase1.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.cost === "number"
                    ? row.phase1.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.hours === "number"
                    ? row.phase2.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.cost === "number"
                    ? row.phase2.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.hours === "number"
                    ? row.phase34.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.cost === "number"
                    ? row.phase34.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.hours === "number"
                    ? row.total.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.cost === "number"
                    ? row.total.cost.toFixed(2)
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <h1>Thermal Simulation </h1>
      {/* ✅ Table 3*/}
      {/* Table */}
      <table className="min-w-full border border-black text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border p-2">
              Cost Center
            </th>
            <th rowSpan={2} className="border p-2">
              Activities
            </th>
            <th colSpan={2} className="border p-2">
              Phase 0
            </th>
            <th colSpan={2} className="border p-2">
              Phase 1
            </th>
            <th colSpan={2} className="border p-2">
              Phase 2
            </th>
            <th colSpan={2} className="border p-2">
              Phase 3-4
            </th>
            <th colSpan={2} className="border p-2 text-red-600">
              TOTAL
            </th>
          </tr>
          <tr className="bg-gray-50 text-center">
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
          </tr>
        </thead>
        <tbody>
          {data?.rows3?.map((row, index) => {
            const isLastRow = index === data.rows3.length - 1;

            return (
              <tr
                key={index}
                style={
                  isLastRow
                    ? {
                        backgroundColor: "#0a8efa",
                        fontWeight: "bold",
                        borderTop: "2px solid #474234",
                        color: "white",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                      }
                    : {}
                }
                className="text-right"
              >
                <td className="border p-2 text-left">{row.org}</td>
                <td className="border p-2 text-left">{row.role}</td>
                <td className="border p-2">
                  {typeof row.phase0?.hours === "number"
                    ? row.phase0.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase0?.cost === "number"
                    ? row.phase0.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.hours === "number"
                    ? row.phase1.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.cost === "number"
                    ? row.phase1.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.hours === "number"
                    ? row.phase2.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.cost === "number"
                    ? row.phase2.cost.toFixed(2)
                    : "-"}
                </td>

                {/* Industrilication phase is applicatable for Tharmal Safty */}
                <td className="border p-2">
                  {typeof row.phase34?.hours === "number"
                    ? row.phase34.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.cost === "number"
                    ? row.phase34.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.hours === "number"
                    ? row.total.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.cost === "number"
                    ? row.total.cost.toFixed(2)
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <h1>Other Additional Cost(User Input) </h1>
      {/* ✅ Table 5*/}
      {/* Table */}
      <table className="min-w-full border border-black text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border p-2">
              Cost Center
            </th>
            <th rowSpan={2} className="border p-2">
              Activities
            </th>
            <th colSpan={2} className="border p-2">
              Phase 0
            </th>
            <th colSpan={2} className="border p-2">
              Phase 1
            </th>
            <th colSpan={2} className="border p-2">
              Phase 2
            </th>
            <th colSpan={2} className="border p-2">
              Phase 3-4
            </th>
            <th colSpan={2} className="border p-2 text-red-600">
              TOTAL
            </th>
          </tr>
          <tr className="bg-gray-50 text-center">
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
          </tr>
        </thead>
        <tbody>
          {data?.rows5?.map((row, index) => {
            const isLastRow = index === data.rows5.length - 1;

            return (
              <tr
                key={index}
                style={
                  isLastRow
                    ? {
                        backgroundColor: "#0a8efa",
                        fontWeight: "bold",
                        borderTop: "2px solid #474234",
                        color: "white",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                      }
                    : {}
                }
                className="text-right"
              >
                <td className="border p-2 text-left">{row.org}</td>
                <td className="border p-2 text-left">{row.role}</td>
                <td className="border p-2">
                  {typeof row.phase0?.hours === "number"
                    ? row.phase0.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase0?.cost === "number"
                    ? row.phase0.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.hours === "number"
                    ? row.phase1.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.cost === "number"
                    ? row.phase1.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.hours === "number"
                    ? row.phase2.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.cost === "number"
                    ? row.phase2.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.hours === "number"
                    ? row.phase34.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.cost === "number"
                    ? row.phase34.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.hours === "number"
                    ? row.total.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.cost === "number"
                    ? row.total.cost.toFixed(2)
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <h1>Total </h1>
      {/* ✅ Table 6*/}
      {/* Table */}
      <table className="min-w-full border border-black text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border p-2">
              Cost Center
            </th>
            <th rowSpan={2} className="border p-2">
              Activities
            </th>
            <th colSpan={2} className="border p-2">
              Phase 0
            </th>
            <th colSpan={2} className="border p-2">
              Phase 1
            </th>
            <th colSpan={2} className="border p-2">
              Phase 2
            </th>
            <th colSpan={2} className="border p-2">
              Phase 3-4
            </th>
            <th colSpan={2} className="border p-2 text-red-600">
              TOTAL
            </th>
          </tr>
          <tr className="bg-gray-50 text-center">
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
            <th className="border">HOURS</th>
            <th className="border">COSTS</th>
          </tr>
        </thead>
        <tbody>
          {data?.rows6?.map((row, index) => {
            const isLastRow = index === data.rows6.length - 1;

            return (
              <tr
                key={index}
                style={
                  isLastRow
                    ? {
                        backgroundColor: "#0a8efa",
                        fontWeight: "bold",
                        borderTop: "2px solid #474234",
                        color: "white",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                      }
                    : {}
                }
                className="text-right"
              >
                <td className="border p-2 text-left">{row.org}</td>
                <td className="border p-2 text-left">{row.role}</td>
                <td className="border p-2">
                  {typeof row.phase0?.hours === "number"
                    ? row.phase0.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase0?.cost === "number"
                    ? row.phase0.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.hours === "number"
                    ? row.phase1.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase1?.cost === "number"
                    ? row.phase1.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.hours === "number"
                    ? row.phase2.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase2?.cost === "number"
                    ? row.phase2.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.hours === "number"
                    ? row.phase34.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2">
                  {typeof row.phase34?.cost === "number"
                    ? row.phase34.cost.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.hours === "number"
                    ? row.total.hours.toFixed(2)
                    : "-"}
                </td>
                <td className="border p-2 font-semibold">
                  {typeof row.total?.cost === "number"
                    ? row.total.cost.toFixed(2)
                    : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <h1>MUA Sheet </h1>
      <CostCenterTable data={tableData} />
    </div>

    //----------
  );
};

export default RFQPhaseTable;
