// // components/ActivityTable.jsx
// import React from "react";

// function ActivityTable({ activities, updateActivity }) {
//   const grouped = Object.entries(activities).reduce((acc, [key, act]) => {
//     const [group, name] = key.split("|");
//     if (!acc[group]) acc[group] = [];
//     acc[group].push({ key, name, act });
//     return acc;
//   }, {});

//   return (
//     <div
//       style={{
//         background: "#fff",
//         padding: "16px",
//         borderRadius: "6px",
//         marginBottom: "20px",
//       }}
//     >
//       <h2>Activities</h2>

//       <table>
//         <thead>
//           <tr>
//             <th>Activity</th>
//             <th>TDL</th>
//             <th>COO</th>
//             <th>DE</th>
//             <th>Extra</th>
//             <th>ReWork</th>
//             <th>Standard</th>
//             <th>%</th>
//             <th>Loops</th>
//             <th>Select</th>
//             <th>Total</th>
//             <th>Dyanamic Total</th>
//           </tr>
//         </thead>

//         <tbody>
//           {Object.entries(grouped).map(([group, rows]) => (
//             <React.Fragment key={group}>
//               <tr>
//                 <td
//                   colSpan={11}
//                   style={{
//                     background: "#0b72d0",
//                     color: "#fff",
//                     fontWeight: "bold",
//                   }}
//                 >
//                   {group}
//                 </td>
//               </tr>

//               {rows.map(({ key, name, act }) => (
//                 <tr key={key}>
//                   <td>{name}</td>
//                   <td>{act.TDL}</td>
//                   <td>{act.COO}</td>
//                   <td>{act.DE}</td>
//                   <td>{act.extraWorkLoop}</td>
//                   <td>{act.reWorkLoop}</td>
//                   <td>{act.standardLoop || act.standard}</td>
//                   <td>{act.percentage || 0}</td>

//                   <td>
//                     <input
//                       type="number"
//                       min="1"
//                       value={act.noOfLoops}
//                       onChange={(e) =>
//                         updateActivity(key, "noOfLoops", +e.target.value)
//                       }
//                     />
//                   </td>

//                   <td>
//                     <input
//                       type="checkbox"
//                       checked={act.checked}
//                       onChange={(e) =>
//                         updateActivity(key, "checked", e.target.checked)
//                       }
//                     />
//                   </td>

//                   <td>{act.previewTotal || 0}</td>
//                   <td>{act.calculatedTotal || 0}</td>
//                 </tr>
//               ))}
//             </React.Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default ActivityTable;

//--------------------------------------------------------------------------
// components/ActivityTable.jsx

// import React from "react";

// const VARIANTS = ["RT", "HT", "LT"]; // Variants to merge dynamically

// function ActivityTable({ activities, updateActivity }) {
//   // Step 1: Group by main section (TCL ACTIVITIES, etc.)
//   const grouped = Object.entries(activities).reduce((acc, [key, act]) => {
//     const [group, name] = key.split("|");
//     if (!acc[group]) acc[group] = [];
//     acc[group].push({ key, name, act });
//     return acc;
//   }, {});

//   // Step 2: Merge RT/HT/LT variants for UI display
//   const mergeVariants = (rows) => {
//     const map = {};
//     const normalRows = [];

//     rows.forEach((row) => {
//       const variant = VARIANTS.find((v) => row.name.endsWith(v));
//       if (!variant) {
//         normalRows.push(row);
//         return;
//       }

//       const baseName = row.name.replace(` ${variant}`, "");
//       if (!map[baseName]) map[baseName] = {};
//       map[baseName][variant] = row;
//     });

//     return { merged: map, normal: normalRows };
//   };

//   return (
//     <div style={{ background: "#fff", padding: 16, borderRadius: 6 }}>
//       <h2>Activities</h2>
//       <table width="100%" border="1" cellPadding="6">
//         <thead>
//           <tr style={{ background: "#0b72d0", color: "#fff" }}>
//             <th>Activity</th>
//             <th>TDL</th>
//             <th>COO</th>
//             <th>DE</th>
//             <th>Extra</th>
//             <th>ReWork</th>
//             <th>Standard</th>
//             <th>%</th>
//             <th colSpan={3}>Loops (RT/HT/LT)</th>
//             <th>Select</th>
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
//                     colSpan={14}
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
//                     <td>{act.extraWorkLoop}</td>
//                     <td>{act.reWorkLoop}</td>
//                     <td>{act.standardLoop || act.standard}</td>
//                     <td>{act.percentage || 0}</td>

//                     <td colSpan={3}>
//                       <input
//                         type="number"
//                         min="1"
//                         value={act.noOfLoops}
//                         onChange={(e) =>
//                           updateActivity(key, "noOfLoops", +e.target.value)
//                         }
//                       />
//                     </td>
//                     <td>
//                       <input
//                         type="checkbox"
//                         checked={act.checked}
//                         onChange={(e) =>
//                           updateActivity(key, "checked", e.target.checked)
//                         }
//                       />
//                     </td>
//                     <td>{act.previewTotal || 0}</td>
//                     <td>{act.calculatedTotal || 0}</td>
//                   </tr>
//                 ))}

//                 {/* Merged RT/HT/LT rows */}
//                 {Object.entries(merged).map(([baseName, variants]) => {
//                   const total =
//                     (variants.RT?.act.calculatedTotal || 0) +
//                     (variants.HT?.act.calculatedTotal || 0) +
//                     (variants.LT?.act.calculatedTotal || 0);

//                   return (
//                     <tr key={baseName}>
//                       <td>{baseName}</td>
//                       <td colSpan={7} />

//                       {VARIANTS.map((v) => {
//                         const row = variants[v];
//                         return (
//                           <td key={v}>
//                             {row ? (
//                               <input
//                                 type="number"
//                                 min="1"
//                                 value={row.act.noOfLoops}
//                                 onChange={(e) =>
//                                   updateActivity(
//                                     row.key,
//                                     "noOfLoops",
//                                     +e.target.value
//                                   )
//                                 }
//                               />
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                         );
//                       })}

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
//                                   e.target.checked
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

//---------------------------

// components/ActivityTable.jsx
import React from "react";

const VARIANTS = ["RT", "HT", "LT"]; // Variants to merge dynamically

function ActivityTable({ activities, updateActivity }) {
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

      <table width="100%" border="1" cellPadding="6">
        <thead>
          <tr style={{ background: "#0b72d0", color: "#fff" }}>
            <th>Activity</th>
            <th>TDL</th>
            <th>COO</th>
            <th>DE</th>
            <th>Extra</th>
            <th>ReWork</th>
            <th>Standard</th>
            <th>%</th>
            <th>Proto</th>
            <th>Serie</th>
            <th colSpan={2}>Loops (RT/HT/LT)</th>
            <th>Select</th>
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
                    colSpan={16}
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
                    <td>{act.extraWorkLoop}</td>
                    <td>{act.reWorkLoop}</td>
                    <td>{act.standardLoop || act.standard}</td>
                    <td>{act.percentage || 0}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
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
                        value={act.serie || 0}
                        onChange={(e) =>
                          updateActivity(key, "serie", +e.target.value)
                        }
                      />
                    </td>

                    {/* <td colSpan={2}>
                      <input
                        type="number"
                        min="1"
                        value={act.noOfLoops}
                        onChange={(e) =>
                          updateActivity(key, "noOfLoops", +e.target.value)
                        }
                      />
                    </td> */}

                    <td colSpan={2}>
                      {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
                        <input
                          type="number"
                          min="1"
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

                    <td>{act.previewTotal || 0}</td>
                    <td>{act.calculatedTotal || 0}</td>
                  </tr>
                ))}

                {/* Merged RT / HT / LT rows */}
                {Object.entries(merged).map(([baseName, variants]) => {
                  const total =
                    (variants.RT?.act.calculatedTotal || 0) +
                    (variants.HT?.act.calculatedTotal || 0) +
                    (variants.LT?.act.calculatedTotal || 0);

                  return (
                    <tr key={baseName}>
                      <td>{baseName}</td>
                      <td colSpan={7} />

                      {/* Proto (shared) */}
                      <td>
                        <input
                          type="number"
                          min="0"
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

                      {/* Loops per variant */}
                      {/* {VARIANTS.map((v) => {
                        const row = variants[v];
                        return (
                          <td key={v}>
                            {row ? (
                              <input
                                type="number"
                                min="1"
                                value={row.act.noOfLoops}
                                onChange={(e) =>
                                  updateActivity(
                                    row.key,
                                    "noOfLoops",
                                    +e.target.value,
                                  )
                                }
                              />
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })} */}

                      {VARIANTS.map((v) => {
                        const row = variants[v];

                        return (
                          <td key={v} style={{ textAlign: "center" }}>
                            {row ? (
                              <>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    marginBottom: "3px",
                                  }}
                                >
                                  {v}
                                </div>

                                <input
                                  type="number"
                                  min="1"
                                  value={row.act.noOfLoops}
                                  onChange={(e) =>
                                    updateActivity(
                                      row.key,
                                      "noOfLoops",
                                      +e.target.value,
                                    )
                                  }
                                />
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
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

                      <td>{total}</td>
                      <td>{total}</td>
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
