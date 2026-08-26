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

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ important

const RFQPhaseTable = ({ data }) => {
  // --------------------------
  // PDF Download Function
  // --------------------------
  const downloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(255, 102, 0); // Orange color for title
    doc.text("COST Sheets CAD", 14, 20);

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

    const rows = data?.rows?.map((row) => [
      row.org,
      row.role,
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
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 8, textColor: [0, 0, 0] }, // black text
      headStyles: {
        fillColor: [255, 153, 51], // orange header
        textColor: [255, 255, 255], // white text
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [255, 243, 230], // light orange for alternate rows
      },
      bodyStyles: {
        fillColor: [255, 255, 255], // white background for normal rows
      },
      columnStyles: {
        11: { textColor: [255, 51, 0], fontStyle: "bold" }, // TOTAL Costs in bright orange
        10: { fontStyle: "bold" }, // TOTAL Hours bold
      },
    });

    doc.save("cost-sheet.pdf");
  };

  return (
    <div className="overflow-x-auto p-4">
      <h1 className="text-xl font-bold mb-4">COST Sheets CAD</h1>

      {/* PDF Button */}
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={downloadPDF}
      >
        Download PDF
      </button>

      {/* Table */}
      <table className="min-w-full border border-black text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border p-2">
              Design
            </th>
            <th rowSpan={2} className="border p-2">
              Role
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
          {data?.rows?.map((row, index) => (
            <tr key={index} className="text-right">
              <td className="border p-2 text-left">{row.org}</td>
              <td className="border p-2 text-left">{row.role}</td>
              <td className="border p-2">{row.phase0?.hours ?? "-"}</td>
              <td className="border p-2">{row.phase0?.cost ?? "-"}</td>
              <td className="border p-2">{row.phase1?.hours ?? "-"}</td>
              <td className="border p-2">{row.phase1?.cost ?? "-"}</td>
              <td className="border p-2">{row.phase2?.hours ?? "-"}</td>
              <td className="border p-2">{row.phase2?.cost ?? "-"}</td>
              <td className="border p-2">{row.phase34?.hours ?? "-"}</td>
              <td className="border p-2">{row.phase34?.cost ?? "-"}</td>
              <td className="border p-2 font-semibold">
                {row.total?.hours ?? "-"}
              </td>
              <td className="border p-2 font-semibold">
                {row.total?.cost ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RFQPhaseTable;
