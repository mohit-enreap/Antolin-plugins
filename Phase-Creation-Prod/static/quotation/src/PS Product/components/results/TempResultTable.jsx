// import React from "react";

// export default function TempResultTable({ results }) {
//   if (!results || results.length === 0)
//     return (
//       <div className="small muted">
//         No active activities or results to display.
//       </div>
//     );
//   return (
//     <div className="resultTableWrapper">
//       <table>
//         <thead>
//           <tr style={{ background: "#f0f0f0" }}>
//             <th>Activity Name</th>
//             <th>TDL</th>
//             <th>COO</th>
//             <th>DE</th>
//             <th>Total</th>
//             <th>ProtoTotal</th>
//             <th>SerieTotal</th>
//           </tr>
//         </thead>
//         <tbody>
//           {results.map((r) => (
//             <tr key={r.activityName}>
//               <td style={{ textAlign: "left", paddingLeft: 8 }}>
//                 {r.activityName}
//               </td>
//               <td>{r.TDL}</td>
//               <td>{r.COO}</td>
//               <td>{r.DE}</td>
//               <td>{r.Total}</td>
//               <td>{r.ProtoTotal}</td>
//               <td>{r.SerieTotal}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

//----------------------------------2nd changes--------------------------
import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
export default function TempResultTable({ results }) {
  console.log("=== [TempResultTable] Rendering Results ===");
  console.log(results);

  const downloadPDF = () => {
    if (!results || results.length === 0) {
      alert("No results to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Activity Summary Report", 14, 20);

    const columns = [
      "Activity",
      "Proto TDL",
      "Proto COO",
      "Proto DE",
      "Proto Total",
      "Serie TDL",
      "Serie COO",
      "Serie DE",
      "Serie Total",
      "TDL",
      "COO",
      "DE",
      "Grand Total",
    ];

    const rows = results.map((r) => [
      r.activityName,
      r.protoTDL,
      r.protoCOO,
      r.protoDE,
      r.protoTotal,
      r.serieTDL,
      r.serieCOO,
      r.serieDE,
      r.serieTotal,
      r.TDL,
      r.COO,
      r.DE,
      r.Total,
    ]);

    const tableOptions = {
      startY: 30,
      head: [columns],
      body: rows,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 200, 200] },
      didDrawPage: (data) => {
        // optional: page footer
        const page = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Page ${page}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 10
        );
      },
    };

    // Try both ways: doc.autoTable(...) OR autoTable(doc, ...)
    try {
      if (typeof doc.autoTable === "function") {
        // older / some builds attach plugin to doc
        doc.autoTable(tableOptions);
      } else if (typeof autoTable === "function") {
        // some builds export a function
        autoTable(doc, tableOptions);
      } else {
        // final fallback: try to require at runtime (for uncommon bundlers)
        // eslint-disable-next-line no-undef
        try {
          // dynamic require — may work in non-ESM environments
          // (this will fail in pure ESM/Next.js SSR; it's a last-resort)
          // eslint-disable-next-line global-require
          const reqAutoTable = require("jspdf-autotable");
          if (typeof reqAutoTable === "function") {
            reqAutoTable(doc, tableOptions);
          } else if (
            reqAutoTable &&
            typeof reqAutoTable.default === "function"
          ) {
            reqAutoTable.default(doc, tableOptions);
          } else {
            throw new Error(
              "jspdf-autotable require returned unexpected shape"
            );
          }
        } catch (err) {
          console.error("autoTable plugin not found or not loaded.", {
            docAutoTable: doc.autoTable,
            autoTable,
            error: err,
          });
          alert(
            "PDF export failed: autoTable plugin not loaded. Check console for details."
          );
          return;
        }
      }

      // save
      doc.save("Activity_Summary.pdf");
    } catch (err) {
      console.error("Error creating PDF:", err);
      alert("PDF generation failed — see console for error.");
    }
  };

  if (!results || results.length === 0)
    return <div className="small muted">No activities to display.</div>;

  return (
    <div className="resultTableWrapper">
      {/* <button
        onClick={downloadPDF}
        style={{ marginBottom: 10, padding: "6px 12px" }}
      >
        Download PDF
      </button> */}

      <table>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            {/* Activity */}
            <th>Activity1111</th>

            {/* PROTO */}
            <th>Proto TDL</th>
            <th>Proto COO</th>
            <th>Proto DE</th>
            <th>Proto Total</th>

            {/* SERIE */}
            <th>Serie TDL</th>
            <th>Serie COO</th>
            <th>Serie DE</th>
            <th>Serie Total</th>

            {/* FINAL TOTAL */}
            <th>Total TDL</th>
            <th>Total COO</th>
            <th>Total DE</th>
            <th>Grand Total</th>
          </tr>
        </thead>

        <tbody>
          {results.map((r) => (
            <tr key={r.activityName}>
              {/* Activity Name */}
              <td style={{ textAlign: "left", paddingLeft: 8 }}>
                {r.activityName}
              </td>

              {/* PROTO */}
              <td>{r.protoTDL}</td>
              <td>{r.protoCOO}</td>
              <td>{r.protoDE}</td>
              <td>{r.protoTotal}</td>

              {/* SERIE */}
              <td>{r.serieTDL}</td>
              <td>{r.serieCOO}</td>
              <td>{r.serieDE}</td>
              <td>{r.serieTotal}</td>

              {/* FINAL */}
              <td>{r.TDL}</td>
              <td>{r.COO}</td>
              <td>{r.DE}</td>
              <td>{r.Total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

//-------------------------------3d change-----------------
// import React from "react";
// import jsPDF from "jspdf";
// // Try to import the plugin. Some bundlers attach it to jsPDF (doc.autoTable),
// // some export a function. We'll import the package to try to get the function.
// import autoTable from "jspdf-autotable";

// export default function TempResultTable({ results = [] }) {
//   console.log(
//     ` → → → → → → → → → → → → →results → → → → → → :`,
//     JSON.stringify(results, null, 2)
//   );
//   const downloadPDF = () => {
//     if (!results || results.length === 0) {
//       alert("No results to export");
//       return;
//     }

//     const doc = new jsPDF({ orientation: "landscape" });
//     doc.setFontSize(16);
//     doc.text("Activity Summary Report", 14, 20);

//     const columns = [
//       "Activity",
//       "Proto TDL",
//       "Proto COO",
//       "Proto DE",
//       "Proto Total",
//       "Serie TDL",
//       "Serie COO",
//       "Serie DE",
//       "Serie Total",
//       "TDL",
//       "COO",
//       "DE",
//       "Grand Total",
//     ];

//     const rows = results.map((r) => [
//       r.activityName,
//       r.protoTDL,
//       r.protoCOO,
//       r.protoDE,
//       r.protoTotal,
//       r.serieTDL,
//       r.serieCOO,
//       r.serieDE,
//       r.serieTotal,
//       r.TDL,
//       r.COO,
//       r.DE,
//       r.Total,
//     ]);

//     const tableOptions = {
//       startY: 30,
//       head: [columns],
//       body: rows,
//       theme: "striped",
//       styles: { fontSize: 8 },
//       headStyles: { fillColor: [200, 200, 200] },
//       didDrawPage: (data) => {
//         // optional: page footer
//         const page = doc.internal.getNumberOfPages();
//         doc.setFontSize(9);
//         doc.text(
//           `Page ${page}`,
//           doc.internal.pageSize.getWidth() - 20,
//           doc.internal.pageSize.getHeight() - 10
//         );
//       },
//     };

//     // Try both ways: doc.autoTable(...) OR autoTable(doc, ...)
//     try {
//       if (typeof doc.autoTable === "function") {
//         // older / some builds attach plugin to doc
//         doc.autoTable(tableOptions);
//       } else if (typeof autoTable === "function") {
//         // some builds export a function
//         autoTable(doc, tableOptions);
//       } else {
//         // final fallback: try to require at runtime (for uncommon bundlers)
//         // eslint-disable-next-line no-undef
//         try {
//           // dynamic require — may work in non-ESM environments
//           // (this will fail in pure ESM/Next.js SSR; it's a last-resort)
//           // eslint-disable-next-line global-require
//           const reqAutoTable = require("jspdf-autotable");
//           if (typeof reqAutoTable === "function") {
//             reqAutoTable(doc, tableOptions);
//           } else if (
//             reqAutoTable &&
//             typeof reqAutoTable.default === "function"
//           ) {
//             reqAutoTable.default(doc, tableOptions);
//           } else {
//             throw new Error(
//               "jspdf-autotable require returned unexpected shape"
//             );
//           }
//         } catch (err) {
//           console.error("autoTable plugin not found or not loaded.", {
//             docAutoTable: doc.autoTable,
//             autoTable,
//             error: err,
//           });
//           alert(
//             "PDF export failed: autoTable plugin not loaded. Check console for details."
//           );
//           return;
//         }
//       }

//       // save
//       doc.save("Activity_Summary.pdf");
//     } catch (err) {
//       console.error("Error creating PDF:", err);
//       alert("PDF generation failed — see console for error.");
//     }
//   };

//   return (
//     <div className="resultTableWrapper">
//       <button
//         onClick={downloadPDF}
//         style={{ marginBottom: 10, padding: "6px 12px" }}
//       >
//         Download PDF
//       </button>

//       <table>
//         <thead>
//           <tr style={{ background: "#f0f0f0" }}>
//             <th>Activity</th>
//             <th>Proto TDL</th>
//             <th>Proto COO</th>
//             <th>Proto DE</th>
//             <th>Proto Total</th>
//             <th>Serie TDL</th>
//             <th>Serie COO</th>
//             <th>Serie DE</th>
//             <th>Serie Total</th>
//             <th>TDL</th>
//             <th>COO</th>
//             <th>DE</th>
//             <th>Grand Total</th>
//           </tr>
//         </thead>
//         <tbody>
//           {results.map((r) => (
//             <tr key={r.activityName}>
//               <td style={{ textAlign: "left", paddingLeft: 8 }}>
//                 {r.activityName}
//               </td>
//               <td>{r.protoTDL}</td>
//               <td>{r.protoCOO}</td>
//               <td>{r.protoDE}</td>
//               <td>{r.protoTotal}</td>
//               <td>{r.serieTDL}</td>
//               <td>{r.serieCOO}</td>
//               <td>{r.serieDE}</td>
//               <td>{r.serieTotal}</td>
//               <td>{r.TDL}</td>
//               <td>{r.COO}</td>
//               <td>{r.DE}</td>
//               <td>{r.Total}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
