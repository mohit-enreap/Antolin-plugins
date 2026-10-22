/////////  UI version 1
// // Working well - only  request - we need to add RT HT LT names in table
// // commenting this below code on 12th amrch 2026
// // components/ActivityTable.jsx
// import React from "react";

// const VARIANTS = ["RT", "HT", "LT"]; // Variants to merge dynamically

// function ActivityTable({ activities, updateActivity }) {
//   const [allowLoopEdit, setAllowLoopEdit] = React.useState(false); // default OFF

//   const HIDE_LOOP_ACTIVITIES = [
//     "Initial meetings",
//     "CAD & CAE inputs review (material cards revision)",
//     "Project Planning and Documentation",
//   ];

//   // Group by main section
//   const grouped = Object.entries(activities).reduce((acc, [key, act]) => {
//     const [group, name] = key.split("|");
//     if (!acc[group]) acc[group] = [];
//     acc[group].push({ key, name, act });
//     return acc;
//   }, {});

//   // Merge RT / HT / LT
//   const mergeVariants = (rows) => {
//     const merged = {};
//     const normal = [];

//     rows.forEach((row) => {
//       const variant = VARIANTS.find((v) => row.name.endsWith(v));
//       if (!variant) {
//         normal.push(row);
//         return;
//       }

//       const baseName = row.name.replace(` ${variant}`, "");
//       if (!merged[baseName]) merged[baseName] = {};
//       merged[baseName][variant] = row;
//     });

//     return { merged, normal };
//   };

//   return (
//     <div style={{ background: "#fff", padding: 16, borderRadius: 6 }}>
//       <h2>Activities</h2>

//       {/* <div style={{ marginBottom: "10px" }}>
//         <label>
//           <input
//             type="checkbox"
//             checked={allowLoopEdit}
//             onChange={(e) => setAllowLoopEdit(e.target.checked)}
//           />
//           Enable Loop Editing
//         </label>
//       </div> */}

//       <table width="100%" border="1" cellPadding="6">
//         <thead>
//           <tr style={{ background: "#0b72d0", color: "#fff" }}>
//             <th>Activity</th>
//             <th>TDL</th>
//             <th>COO</th>
//             <th>DE</th>
//             {/* <th>Extra</th>
//             <th>ReWork</th> */}
//             <th>Std</th>
//             {/* <th>%</th> */}
//             <th colSpan={1}>Proto</th>
//             <th colSpan={1}>Serie</th>
//             <th colSpan={2}>Loops (RT / HT / LT)</th>
//             <th>Select</th>
//             <th>Proto Total</th>
//             <th>Serie Total</th>

//             <th>Total</th>
//             <th>Dynamic Total</th>
//           </tr>
//         </thead>

//         <tbody>
//           {Object.entries(grouped).map(([group, rows]) => {
//             const { merged, normal } = mergeVariants(rows);

//             return (
//               <React.Fragment key={group}>
//                 {/* Group Header */}
//                 <tr>
//                   <td
//                     colSpan={16}
//                     style={{
//                       background: "#0b72d0",
//                       color: "#fff",
//                       fontWeight: "bold",
//                     }}
//                   >
//                     {group}
//                   </td>
//                 </tr>

//                 {/* Normal rows */}
//                 {normal.map(({ key, name, act }) => (
//                   <tr key={key}>
//                     <td>{name}</td>
//                     <td>{act.TDL}</td>
//                     <td>{act.COO}</td>
//                     <td>{act.DE}</td>
//                     {/* <td>{act.extraWorkLoop}</td>
//                     <td>{act.reWorkLoop}</td> */}
//                     <td>{act.standardLoop || act.standard}</td>
//                     {/* <td>{act.percentage || 0}</td> */}

//                     <td colSpan={1}>
//                       <input
//                         type="number"
//                         min="0"
//                         value={act.proto || 0}
//                         onChange={(e) =>
//                           updateActivity(key, "proto", +e.target.value)
//                         }
//                       />
//                     </td>

//                     <td colSpan={1}>
//                       <input
//                         type="number"
//                         min="0"
//                         value={act.serie || 0}
//                         onChange={(e) =>
//                           updateActivity(key, "serie", +e.target.value)
//                         }
//                       />
//                     </td>

//                     <td colSpan={1}>
//                       {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
//                         <input
//                           type="number"
//                           min="1"
//                           value={act.noOfLoops}
//                           onChange={(e) =>
//                             updateActivity(key, "noOfLoops", +e.target.value)
//                           }
//                         />
//                       ) : (
//                         "-"
//                       )}
//                     </td>

//                     <td>
//                       <input
//                         type="checkbox"
//                         checked={act.checked}
//                         onChange={(e) => {
//                           updateActivity(key, "checked", e.target.checked);
//                           updateActivity(
//                             key,
//                             "standardLoop",
//                             e.target.checked ? 1 : 0,
//                           );
//                         }}
//                       />
//                     </td>

//                     {/* Proto preview  & Serie Preview*/}

//                     <td>{act.previewProtoTotal || 0}</td>
//                     <td>{act.previewSerieTotal || 0}</td>

//                     <td>{act.previewTotal || 0}</td>
//                     <td>{act.calculatedTotal || 0}</td>
//                   </tr>
//                 ))}

//                 {/* Merged RT / HT / LT rows */}
//                 {Object.entries(merged).map(([baseName, variants]) => {
//                   const total =
//                     (variants.RT?.act.calculatedTotal || 0) +
//                     (variants.HT?.act.calculatedTotal || 0) +
//                     (variants.LT?.act.calculatedTotal || 0);

//                   return (
//                     <tr key={baseName}>
//                       <td>{baseName}</td>
//                       <td colSpan={7} />

//                       {/* Proto (shared) */}
//                       <td>
//                         <input
//                           type="number"
//                           min="0"
//                           value={variants.RT?.act.proto || 0}
//                           onChange={(e) =>
//                             VARIANTS.forEach((v) => {
//                               const r = variants[v];
//                               if (r)
//                                 updateActivity(r.key, "proto", +e.target.value);
//                             })
//                           }
//                         />
//                       </td>

//                       {/* Serie (shared) */}
//                       <td>
//                         <input
//                           type="number"
//                           min="0"
//                           value={variants.RT?.act.serie || 0}
//                           onChange={(e) =>
//                             VARIANTS.forEach((v) => {
//                               const r = variants[v];
//                               if (r)
//                                 updateActivity(r.key, "serie", +e.target.value);
//                             })
//                           }
//                         />
//                       </td>

//                       {/* Loops per variant  chnage on march 12th */}
//                       {/* RT / HT / LT Columns */}
//                       {VARIANTS.map((v) => {
//                         const row = variants[v];

//                         return (
//                           <td key={v} style={{ textAlign: "center" }}>
//                             {row ? (
//                               <>
//                                 {/* Variant Label */}
//                                 <div
//                                   style={{
//                                     fontSize: "12px",
//                                     fontWeight: "bold",
//                                     marginBottom: "4px",
//                                   }}
//                                 >
//                                   {v}
//                                 </div>

//                                 {/* Loop Input (SYNCED) */}
//                                 <input
//                                   type="number"
//                                   min="1"
//                                   value={row.act.noOfLoops}
//                                   disabled={allowLoopEdit}
//                                   onChange={(e) => {
//                                     const value = +e.target.value;

//                                     // Sync loops across RT/HT/LT
//                                     VARIANTS.forEach((variantKey) => {
//                                       const r = variants[variantKey];

//                                       if (r) {
//                                         updateActivity(
//                                           r.key,
//                                           "noOfLoops",
//                                           value,
//                                         );
//                                       }
//                                     });
//                                   }}
//                                 />

//                                 {/* Separate Checkbox */}
//                                 <div style={{ marginTop: "4px" }}>
//                                   <input
//                                     type="checkbox"
//                                     checked={row.act.checked}
//                                     onChange={(e) =>
//                                       updateActivity(
//                                         row.key,
//                                         "checked",
//                                         e.target.checked,
//                                       )
//                                     }
//                                   />
//                                 </div>
//                               </>
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                         );
//                       })}

//                       {/* Select */}
//                       {/* Select */}
//                       <td>
//                         <input
//                           type="checkbox"
//                           checked={
//                             variants.RT?.act.checked ||
//                             variants.HT?.act.checked ||
//                             variants.LT?.act.checked
//                           }
//                           onChange={(e) =>
//                             VARIANTS.forEach((v) => {
//                               const r = variants[v];
//                               if (r)
//                                 updateActivity(
//                                   r.key,
//                                   "checked",
//                                   e.target.checked,
//                                 );
//                             })
//                           }
//                         />
//                       </td>
//                       <td>{total}</td>
//                       <td>{total}</td>
//                     </tr>
//                   );
//                 })}
//               </React.Fragment>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default ActivityTable;

/////////  UI version 2

// // components/ActivityTable.jsx
// import React from "react";

// const VARIANTS = ["RT", "HT", "LT"]; // Variants to merge dynamically

// function ActivityTable({ activities, updateActivity }) {
//   const [allowLoopEdit, setAllowLoopEdit] = React.useState(false); // default OFF

//   const HIDE_LOOP_ACTIVITIES = [
//     "Initial meetings",
//     "CAD & CAE inputs review (material cards revision)",
//     "Project Planning and Documentation",
//   ];

//   // Group by main section
//   const grouped = Object.entries(activities).reduce((acc, [key, act]) => {
//     const [group, name] = key.split("|");
//     if (!acc[group]) acc[group] = [];
//     acc[group].push({ key, name, act });
//     return acc;
//   }, {});

//   // Merge RT / HT / LT
//   const mergeVariants = (rows) => {
//     const merged = {};
//     const normal = [];

//     rows.forEach((row) => {
//       const variant = VARIANTS.find((v) => row.name.endsWith(v));
//       if (!variant) {
//         normal.push(row);
//         return;
//       }

//       const baseName = row.name.replace(` ${variant}`, "");
//       if (!merged[baseName]) merged[baseName] = {};
//       merged[baseName][variant] = row;
//     });

//     return { merged, normal };
//   };

//   return (
//     <div style={{ background: "#fff", padding: 16, borderRadius: 6 }}>
//       <h2>Activities</h2>

//       {/* <div style={{ marginBottom: "10px" }}>
//         <label>
//           <input
//             type="checkbox"
//             checked={allowLoopEdit}
//             onChange={(e) => setAllowLoopEdit(e.target.checked)}
//           />
//           Enable Loop Editing
//         </label>
//       </div> */}

//       <table
//         width="100%"
//         border="1"
//         cellPadding="6"
//         style={{ borderCollapse: "collapse" }}
//       >
//         <thead>
//           <tr
//             style={{ background: "#0b72d0", color: "#fff", textAlign: "left" }}
//           >
//             <th>Activity</th>
//             <th>TDL</th>
//             <th>COO</th>
//             <th>DE</th>
//             <th>Std</th>
//             <th>Proto</th>
//             <th>Serie</th>
//             {/* Span 3 columns for RT, HT, LT */}
//             <th colSpan={3} style={{ textAlign: "center" }}>
//               Loops (RT / HT / LT)
//             </th>
//             <th>Select</th>
//             <th>Proto Total</th>
//             <th>Serie Total</th>
//             <th>Total</th>
//             <th>Dynamic Total</th>
//           </tr>
//         </thead>

//         <tbody>
//           {Object.entries(grouped).map(([group, rows]) => {
//             const { merged, normal } = mergeVariants(rows);

//             return (
//               <React.Fragment key={group}>
//                 {/* Group Header */}
//                 <tr>
//                   <td
//                     colSpan={15} // Total columns is 15
//                     style={{
//                       background: "#0b72d0",
//                       color: "#fff",
//                       fontWeight: "bold",
//                     }}
//                   >
//                     {group}
//                   </td>
//                 </tr>

//                 {/* Normal rows */}
//                 {normal.map(({ key, name, act }) => (
//                   <tr key={key}>
//                     <td>{name}</td>
//                     <td>{act.TDL}</td>
//                     <td>{act.COO}</td>
//                     <td>{act.DE}</td>
//                     <td>{act.standardLoop || act.standard}</td>

//                     <td>
//                       <input
//                         type="number"
//                         min="0"
//                         value={act.proto || 0}
//                         onChange={(e) =>
//                           updateActivity(key, "proto", +e.target.value)
//                         }
//                       />
//                     </td>

//                     <td>
//                       <input
//                         type="number"
//                         min="0"
//                         value={act.serie || 0}
//                         onChange={(e) =>
//                           updateActivity(key, "serie", +e.target.value)
//                         }
//                       />
//                     </td>

//                     {/* Needs to span 3 to align with the variant columns below */}
//                     <td colSpan={3} style={{ textAlign: "center" }}>
//                       {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
//                         <input
//                           type="number"
//                           min="1"
//                           value={act.noOfLoops}
//                           onChange={(e) =>
//                             updateActivity(key, "noOfLoops", +e.target.value)
//                           }
//                         />
//                       ) : (
//                         "-"
//                       )}
//                     </td>

//                     <td>
//                       <input
//                         type="checkbox"
//                         checked={act.checked}
//                         onChange={(e) => {
//                           updateActivity(key, "checked", e.target.checked);
//                           updateActivity(
//                             key,
//                             "standardLoop",
//                             e.target.checked ? 1 : 0,
//                           );
//                         }}
//                       />
//                     </td>

//                     {/* Previews & Totals */}
//                     <td>{act.previewProtoTotal || 0}</td>
//                     <td>{act.previewSerieTotal || 0}</td>
//                     <td>{act.previewTotal || 0}</td>
//                     <td>{act.calculatedTotal || 0}</td>
//                   </tr>
//                 ))}

//                 {/* Merged RT / HT / LT rows */}
//                 {Object.entries(merged).map(([baseName, variants]) => {
//                   // Calculate combined totals for the 4 total columns
//                   const previewProtoTotal = VARIANTS.reduce(
//                     (sum, v) => sum + (variants[v]?.act.previewProtoTotal || 0),
//                     0,
//                   );
//                   const previewSerieTotal = VARIANTS.reduce(
//                     (sum, v) => sum + (variants[v]?.act.previewSerieTotal || 0),
//                     0,
//                   );
//                   const previewTotal = VARIANTS.reduce(
//                     (sum, v) => sum + (variants[v]?.act.previewTotal || 0),
//                     0,
//                   );
//                   const calculatedTotal = VARIANTS.reduce(
//                     (sum, v) => sum + (variants[v]?.act.calculatedTotal || 0),
//                     0,
//                   );

//                   return (
//                     <tr key={baseName}>
//                       <td>{baseName}</td>

//                       {/* Skip exactly 4 columns: TDL, COO, DE, Std */}
//                       <td colSpan={4} />

//                       {/* Proto (shared) */}
//                       <td>
//                         <input
//                           type="number"
//                           min="0"
//                           value={variants.RT?.act.proto || 0}
//                           onChange={(e) =>
//                             VARIANTS.forEach((v) => {
//                               const r = variants[v];
//                               if (r)
//                                 updateActivity(r.key, "proto", +e.target.value);
//                             })
//                           }
//                         />
//                       </td>

//                       {/* Serie (shared) */}
//                       <td>
//                         <input
//                           type="number"
//                           min="0"
//                           value={variants.RT?.act.serie || 0}
//                           onChange={(e) =>
//                             VARIANTS.forEach((v) => {
//                               const r = variants[v];
//                               if (r)
//                                 updateActivity(r.key, "serie", +e.target.value);
//                             })
//                           }
//                         />
//                       </td>

//                       {/* RT / HT / LT Columns */}
//                       {VARIANTS.map((v) => {
//                         const row = variants[v];

//                         return (
//                           <td key={v} style={{ textAlign: "center" }}>
//                             {row ? (
//                               <>
//                                 {/* Variant Label */}
//                                 <div
//                                   style={{
//                                     fontSize: "12px",
//                                     fontWeight: "bold",
//                                     marginBottom: "4px",
//                                   }}
//                                 >
//                                   {v}
//                                 </div>

//                                 {/* Loop Input (SYNCED) */}
//                                 <input
//                                   style={{ width: "40px" }}
//                                   type="number"
//                                   min="1"
//                                   value={row.act.noOfLoops}
//                                   disabled={allowLoopEdit}
//                                   onChange={(e) => {
//                                     const value = +e.target.value;
//                                     VARIANTS.forEach((variantKey) => {
//                                       const r = variants[variantKey];
//                                       if (r)
//                                         updateActivity(
//                                           r.key,
//                                           "noOfLoops",
//                                           value,
//                                         );
//                                     });
//                                   }}
//                                 />

//                                 {/* Separate Checkbox */}
//                                 <div style={{ marginTop: "4px" }}>
//                                   <input
//                                     type="checkbox"
//                                     checked={row.act.checked}
//                                     onChange={(e) =>
//                                       updateActivity(
//                                         row.key,
//                                         "checked",
//                                         e.target.checked,
//                                       )
//                                     }
//                                   />
//                                 </div>
//                               </>
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                         );
//                       })}

//                       {/* Select */}
//                       <td>
//                         <input
//                           type="checkbox"
//                           checked={
//                             variants.RT?.act.checked ||
//                             variants.HT?.act.checked ||
//                             variants.LT?.act.checked
//                           }
//                           onChange={(e) =>
//                             VARIANTS.forEach((v) => {
//                               const r = variants[v];
//                               if (r)
//                                 updateActivity(
//                                   r.key,
//                                   "checked",
//                                   e.target.checked,
//                                 );
//                             })
//                           }
//                         />
//                       </td>

//                       {/* Properly align all 4 totals */}
//                       <td>{previewProtoTotal}</td>
//                       <td>{previewSerieTotal}</td>
//                       <td>{previewTotal}</td>
//                       <td>{calculatedTotal}</td>
//                     </tr>
//                   );
//                 })}
//               </React.Fragment>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default ActivityTable;

/////////  UI version 3

// components/ActivityTable.jsx
import React from "react";

const VARIANTS = ["RT", "HT", "LT"]; // Variants to merge dynamically

function ActivityTable({ activities, updateActivity }) {
  const [allowLoopEdit, setAllowLoopEdit] = React.useState(false); // default OFF

  const HIDE_LOOP_ACTIVITIES = [
    "Initial meetings",
    "CAD & CAE inputs review (material cards revision)",
    "Project Planning and Documentation",
  ];

  // Group by main section
  const grouped = Object.entries(activities).reduce((acc, [key, act]) => {
    const [group, name] = key.split("|");
    if (!acc[group]) acc[group] = [];
    acc[group].push({ key, name, act });
    return acc;
  }, {});

  // Merge RT / HT / LT
  const mergeVariants = (rows) => {
    const merged = {};
    const normal = [];

    rows.forEach((row) => {
      const variant = VARIANTS.find((v) => row.name.endsWith(v));
      if (!variant) {
        normal.push(row);
        return;
      }

      const baseName = row.name.replace(` ${variant}`, "");
      if (!merged[baseName]) merged[baseName] = {};
      merged[baseName][variant] = row;
    });

    return { merged, normal };
  };

  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 6 }}>
      <h2>Activities</h2>

      <table
        width="100%"
        border="1"
        cellPadding="6"
        style={{ borderCollapse: "collapse" }}
      >
        <thead>
          <tr
            style={{ background: "#0b72d0", color: "#fff", textAlign: "left" }}
          >
            <th>Activity</th>
            <th>TDL</th>
            <th>COO</th>
            <th>DE</th>
            <th>Std</th>
            <th>Proto</th>
            <th>Serie</th>
            {/* Removed colSpan=3. It is now a single consolidated column */}
            <th style={{ textAlign: "center" }}>Loops (RT / HT / LT)</th>
            <th>Select</th>
            <th>Proto Total</th>
            <th>Serie Total</th>
            <th>Total</th>
            <th>Dynamic Total</th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(grouped).map(([group, rows]) => {
            const { merged, normal } = mergeVariants(rows);

            return (
              <React.Fragment key={group}>
                {/* Group Header */}
                <tr>
                  <td
                    colSpan={13} // Total columns reduced from 15 to 13
                    style={{
                      background: "#0b72d0",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {group}
                  </td>
                </tr>

                {/* Normal rows */}
                {normal.map(({ key, name, act }) => (
                  <tr key={key}>
                    <td>{name}</td>
                    <td>{act.TDL}</td>
                    <td>{act.COO}</td>
                    <td>{act.DE}</td>
                    <td>{act.standardLoop || act.standard}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        style={{ width: "60px" }}
                        value={act.proto || 0}
                        onChange={(e) =>
                          updateActivity(key, "proto", +e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        style={{ width: "60px" }}
                        value={act.serie || 0}
                        onChange={(e) =>
                          updateActivity(key, "serie", +e.target.value)
                        }
                      />
                    </td>

                    {/* Single column instead of colSpan=3 */}
                    <td style={{ textAlign: "center" }}>
                      {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
                        <input
                          type="number"
                          min="1"
                          style={{ width: "50px" }}
                          value={act.noOfLoops}
                          onChange={(e) =>
                            updateActivity(key, "noOfLoops", +e.target.value)
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      <input
                        type="checkbox"
                        checked={act.checked}
                        onChange={(e) => {
                          updateActivity(key, "checked", e.target.checked);
                          updateActivity(
                            key,
                            "standardLoop",
                            e.target.checked ? 1 : 0,
                          );
                        }}
                      />
                    </td>

                    {/* Previews & Totals */}
                    <td>{act.previewProtoTotal || 0}</td>
                    <td>{act.previewSerieTotal || 0}</td>
                    <td>{act.previewTotal || 0}</td>
                    <td>{act.calculatedTotal || 0}</td>
                  </tr>
                ))}

                {/* Merged RT / HT / LT rows */}
                {Object.entries(merged).map(([baseName, variants]) => {
                  const previewProtoTotal = VARIANTS.reduce(
                    (sum, v) => sum + (variants[v]?.act.previewProtoTotal || 0),
                    0,
                  );
                  const previewSerieTotal = VARIANTS.reduce(
                    (sum, v) => sum + (variants[v]?.act.previewSerieTotal || 0),
                    0,
                  );
                  const previewTotal = VARIANTS.reduce(
                    (sum, v) => sum + (variants[v]?.act.previewTotal || 0),
                    0,
                  );
                  const calculatedTotal = VARIANTS.reduce(
                    (sum, v) => sum + (variants[v]?.act.calculatedTotal || 0),
                    0,
                  );

                  return (
                    <tr key={baseName}>
                      <td>{baseName}</td>

                      {/* Skip exactly 4 columns: TDL, COO, DE, Std */}
                      <td colSpan={4} />

                      {/* Proto (shared) */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          style={{ width: "60px" }}
                          value={variants.RT?.act.proto || 0}
                          onChange={(e) =>
                            VARIANTS.forEach((v) => {
                              const r = variants[v];
                              if (r)
                                updateActivity(r.key, "proto", +e.target.value);
                            })
                          }
                        />
                      </td>

                      {/* Serie (shared) */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          style={{ width: "60px" }}
                          value={variants.RT?.act.serie || 0}
                          onChange={(e) =>
                            VARIANTS.forEach((v) => {
                              const r = variants[v];
                              if (r)
                                updateActivity(r.key, "serie", +e.target.value);
                            })
                          }
                        />
                      </td>

                      {/* Single Flexbox cell handling all RT / HT / LT variants */}
                      <td style={{ textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "16px",
                          }}
                        >
                          {VARIANTS.map((v) => {
                            const row = variants[v];

                            return (
                              <div
                                key={v}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  width: "45px",
                                }}
                              >
                                {row ? (
                                  <>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        marginBottom: "4px",
                                      }}
                                    >
                                      {v}
                                    </div>
                                    <input
                                      style={{
                                        width: "40px",
                                        textAlign: "center",
                                      }}
                                      type="number"
                                      min="1"
                                      value={row.act.noOfLoops}
                                      disabled={allowLoopEdit}
                                      onChange={(e) => {
                                        const value = +e.target.value;
                                        VARIANTS.forEach((variantKey) => {
                                          const r = variants[variantKey];
                                          if (r)
                                            updateActivity(
                                              r.key,
                                              "noOfLoops",
                                              value,
                                            );
                                        });
                                      }}
                                    />
                                    <div style={{ marginTop: "4px" }}>
                                      <input
                                        type="checkbox"
                                        checked={row.act.checked}
                                        onChange={(e) =>
                                          updateActivity(
                                            row.key,
                                            "checked",
                                            e.target.checked,
                                          )
                                        }
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <div
                                    style={{
                                      marginTop: "auto",
                                      marginBottom: "auto",
                                    }}
                                  >
                                    -
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Select */}
                      <td>
                        <input
                          type="checkbox"
                          checked={
                            variants.RT?.act.checked ||
                            variants.HT?.act.checked ||
                            variants.LT?.act.checked
                          }
                          onChange={(e) =>
                            VARIANTS.forEach((v) => {
                              const r = variants[v];
                              if (r)
                                updateActivity(
                                  r.key,
                                  "checked",
                                  e.target.checked,
                                );
                            })
                          }
                        />
                      </td>

                      {/* Totals */}
                      <td>{previewProtoTotal}</td>
                      <td>{previewSerieTotal}</td>
                      <td>{previewTotal}</td>
                      <td>{calculatedTotal}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityTable;
