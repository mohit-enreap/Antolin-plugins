// export default function OfferTable({ rows, weeks, onChange }) {
//   // alert("sumActivities =>" + sumActivities);

//   // Flatten sub-activities for separate table
//   const allSubActivities = rows.flatMap((row) => row.subActivities);

//   return (
//     <div>
//       <table border="1" cellPadding="6">
//         <thead>
//           <tr>
//             <th>Activity</th>
//             <th>Resources</th>
//             <th>Weeks</th>
//             <th>Hours / Week</th>
//             <th>Total Hours</th>
//           </tr>
//         </thead>

//         <tbody>
//           {rows.map((row) => (
//             <tr key={row.activityKey}>
//               <td>{row.activityKey}</td>

//               <td>
//                 <input
//                   type="number"
//                   value={row.resources}
//                   onChange={(e) =>
//                     onChange({
//                       activityKey: row.activityKey,
//                       field: "Resources",
//                       value: Number(e.target.value),
//                     })
//                   }
//                 />
//               </td>
//               <td>
//                 <input
//                   type="number"
//                   value={row.weeks}
//                   onChange={(e) =>
//                     onChange({
//                       activityKey: row.activityKey,
//                       field: "Weeks",
//                       value: Number(e.target.value),
//                     })
//                   }
//                 />
//               </td>

//               <td>{row.hoursPerWeek}</td>
//               <td>{row.totalHours}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       <br />

//       {/* === Sub Activities Table === */}
//       <h4>Sub Activities</h4>
//       <h4>Sub Activities</h4>
//       <table
//         border="1"
//         cellPadding="5"
//         style={{ borderCollapse: "collapse", width: "100%" }}
//       >
//         <thead>
//           <tr style={{ backgroundColor: "#f0f0f0" }}>
//             <th>Activity</th>
//             <th>TDI</th>
//             <th>3D Coordination</th>
//             <th>3D Standard</th>
//           </tr>
//         </thead>
//         <tbody>
//           {rows.length > 0 ? (
//             rows.map((row, idx) => {
//               const tdi =
//                 row.subActivities.find((s) => s.type === "TDI")?.hours || 0;
//               const coord =
//                 row.subActivities.find((s) => s.type === "3D Coordination")
//                   ?.hours || 0;
//               const std =
//                 row.subActivities.find((s) => s.type === "3D Standard")
//                   ?.hours || 0;

//               return (
//                 <tr key={idx}>
//                   <td
//                     style={{
//                       backgroundColor: "#0057b7",
//                       color: "white",
//                       padding: "5px",
//                     }}
//                   >
//                     {row.activity}
//                   </td>
//                   <td
//                     style={{ backgroundColor: "#d9f2d9", textAlign: "center" }}
//                   >
//                     {tdi}
//                   </td>
//                   <td
//                     style={{ backgroundColor: "#d9f2d9", textAlign: "center" }}
//                   >
//                     {coord}
//                   </td>
//                   <td
//                     style={{ backgroundColor: "#d9f2d9", textAlign: "center" }}
//                   >
//                     {std}
//                   </td>
//                 </tr>
//               );
//             })
//           ) : (
//             <tr>
//               <td colSpan="4" style={{ textAlign: "center" }}>
//                 No sub activities
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// //note 1
// //here onchange  - "UpdateofferResouce" Method
// export default function OfferTable({ rows, onChange , }) {
//   // 1️⃣ Collect all unique sub-activities across all rows
//   const subActivityNames = Array.from(
//     new Set(rows.flatMap((row) => row.subActivities.map((s) => s.activity))),
//   );

//   return (
//     <div>
//       {/* === Main Activities Table === */}
//       <table border="1" cellPadding="6">
//         <thead>
//           <tr>
//             <th>Activity</th>
//             <th>Resources</th>
//             <th>Weeks</th>
//             <th>Hours / Week</th>
//             <th>Total Hours</th>
//           </tr>
//         </thead>
//         <tbody>
//           {rows.map((row) => (
//             <tr key={row.activityKey}>
//               <td>{row.activityKey}</td>
//               <td>
//                 <input
//                   type="number"
//                   value={row.resources}
//                   onChange={(e) =>
//                     onChange({
//                       activityKey: row.activityKey,
//                       field: "Resources",
//                       value: Number(e.target.value),
//                     })
//                   }
//                 />
//               </td>
//               <td>
//                 <input
//                   type="number"
//                   value={row.weeks}
//                   onChange={(e) =>
//                     onChange({
//                       activityKey: row.activityKey,
//                       field: "Weeks",
//                       value: Number(e.target.value),
//                     })
//                   }
//                 />
//               </td>
//               <td>{row.hoursPerWeek}</td>
//               <td>{row.totalHours}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       <br />

//       {/* === Sub Activities Table === */}
//       <h4>Sub Activities</h4>
//       <table
//         border="1"
//         cellPadding="5"
//         style={{ borderCollapse: "collapse", width: "100%" }}
//       >
//         <thead>
//           <tr style={{ backgroundColor: "#f0f0f0" }}>
//             <th>Sub Activity</th>
//             {rows.map((row) => (
//               <th key={row.activityKey}>{row.activityKey}</th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {subActivityNames.map((subName) => (
//             <tr key={subName}>
//               <td
//                 style={{
//                   backgroundColor: "#0057b7",
//                   color: "white",
//                   padding: "5px",
//                 }}
//               >
//                 {subName}
//               </td>
//               {rows.map((row) => {
//                 const sub = row.subActivities.find(
//                   (s) => s.activity === subName,
//                 );
//                 return (
//                   <td
//                     key={row.activityKey + subName}
//                     style={{
//                       backgroundColor: "#61dafbaas",
//                       textAlign: "center",
//                     }}
//                   >
//                     {sub ? sub.hours : 0}
//                   </td>
//                 );
//               })}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

import React from 'react';
// here onchange - "UpdateofferResouce" Method
export default function OfferTable({
  rows,
  onChange,
  onPercentageChange,
  percentageMsg,
}) {
  // Collect all unique sub-activities
  const subActivityNames = Array.from(
    new Set(rows.flatMap((row) => row.subActivities.map((s) => s.activity))),
  );

  return (
    <div>
      {/* === Main Activities Table === */}
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Activity</th>
            <th>Resources</th>
            <th>Weeks</th>
            <th>Hours / Week</th>
            <th>Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.activityKey}>
              <td>{row.activityKey}</td>

              <td>
                <input
                  type="number"
                  value={row.resources}
                  onChange={(e) =>
                    onChange({
                      activityKey: row.activityKey,
                      field: "Resources",
                      value: Number(e.target.value),
                    })
                  }
                />
              </td>

              {/* <td>
                <input
                  type="number"
                  value={row.weeks}
                  onChange={(e) =>
                    onChange({
                      activityKey: row.activityKey,
                      field: "Weeks",
                      value: Number(e.target.value),
                    })
                  }
                />
              </td> */}
              <td>{row.weeks}</td>
              <td>{row.hoursPerWeek}</td>
              <td>{row.totalHours}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      {/* === Sub Activities Table === */}
      <h4>Sub Activities </h4>

      {/* ======================new table==================== */}

      {percentageMsg && (
        <div
          style={{
            color: "red",
            fontWeight: "bold",
            marginBottom: "8px",
          }}
        >
          {percentageMsg}
        </div>
      )}

      <table
        border="1"
        cellPadding="5"
        style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}
      >
        <thead>
          {/* Header row 1 */}
          <tr style={{ backgroundColor: "#f0f0f0" }}>
            <th rowSpan="2" style={{ textAlign: "left" }}>
              Sub Activity
            </th>

            {rows.map((row) => (
              <th key={row.activityKey} colSpan="2" style={{ textAlign: "center" }}>
                {row.activityKey}
              </th>
            ))}
          </tr>

          {/* Header row 2 */}
          <tr style={{ backgroundColor: "#e6e6e6" }}>
            {rows.map((row) => (
              <React.Fragment key={row.activityKey + "_head"}>
                <th style={{ textAlign: "center", width: "120px" }}>Hrs</th>
                <th style={{ textAlign: "center", width: "120px" }}>%</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>

        <tbody>
          {subActivityNames.map((subName) => (
            <tr key={subName}>
              <td
                style={{
                  backgroundColor: "#0057b7",
                  color: "white",
                  padding: "5px",
                }}
              >
                {subName}
              </td>

              {rows.map((row) => {
                const sub = row.subActivities.find((s) => s.activity === subName);

                return (
                  <React.Fragment key={row.activityKey + subName}>
                    {/* Hours column */}
                    <td style={{ textAlign: "center" }}>
                      {sub ? sub.hours : 0} hrs
                    </td>

                    {/* Percentage column */}
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        value={sub?.percent || 0}
                        style={{ width: "60px", textAlign: "center" }}
                        onChange={(e) =>
                          onPercentageChange(
                            subName,
                            row.activityKey,
                            Number(e.target.value),
                          )
                        }
                      />
                    </td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
