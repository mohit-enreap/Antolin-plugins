// import React from "react";

// const PhaseHeader = ({ phaseMeta }) => {
//   return (
//     <>
//       {/* Inline CSS */}
//       <style>
//         {`
//           .phase-header-container {
//             display: flex;
//             width: 100%;
//             border: 1px solid black;
//             margin-bottom: 16px;
//           }

//           .phase-box {
//             flex: 1;
//             border-right: 1px solid black;
//             text-align: center;
//             font-size: 13px;
//           }

//           .phase-box:last-child {
//             border-right: none;
//           }

//           .phase-title {
//             font-weight: bold;
//             color: #c40000;
//             border-bottom: 1px solid black;
//             padding: 4px 0;
//           }

//           .phase-body {
//             padding: 6px 4px;
//           }

//           .phase-body div {
//             margin: 2px 0;
//           }
//         `}
//       </style>

//       <div className="phase-header-container">
//         {Object.values(phaseMeta).map((phase, index) => (
//           <div className="phase-box" key={index}>
//             <div className="phase-title">{phase.label}</div>

//             <div className="phase-body">
//               <div>
//                 <strong>Start:</strong> {phase.start}
//               </div>
//               <div>
//                 <strong>End:</strong> {phase.end}
//               </div>
//               <div>
//                 <strong>Weeks:</strong> {phase.weeks}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </>
//   );
// };

// export default PhaseHeader;

// import React, { useState, useEffect, useRef } from "react";

// const PHASE_LABELS = {
//   phase_0: "Phase 0",
//   phase_1: "Phase 1",
//   phase_2: "Phase 2",
//   phase_3_4: "Phase 3-4",
// };

// const PHASE_KEYS = ["phase_0", "phase_1", "phase_2", "phase_3_4"];

// const PhaseHeader = ({ phaseDates = {}, onWeeksChange = () => {} }) => {
//   const [manualWeeks, setManualWeeks] = useState({});
//   const initializedRef = useRef(false);

//   // ✅ Initialize ONLY ONCE from phaseDates
//   useEffect(() => {
//     if (initializedRef.current) return;

//     const initialWeeks = {};
//     PHASE_KEYS.forEach((key) => {
//       initialWeeks[key] =
//         phaseDates[key]?.weeks !== undefined
//           ? String(phaseDates[key].weeks)
//           : "";
//     });

//     setManualWeeks(initialWeeks);
//     initializedRef.current = true;
//   }, [phaseDates]);

//   const handleWeekChange = (key, value) => {
//     setManualWeeks((prev) => {
//       const updated = { ...prev, [key]: value };

//       // ✅ Send parsed numbers to parent
//       const numericWeeks = {};
//       Object.keys(updated).forEach((k) => {
//         numericWeeks[k] = updated[k] === "" ? null : Number(updated[k]);
//       });

//       onWeeksChange(numericWeeks);
//       return updated;
//     });
//   };

//   return (
//     <>
//       <style>{`
//         .phase-header-container {
//           display: flex;
//           width: 100%;
//           border: 1px solid #ccc;
//           margin-bottom: 8px;
//           border-radius: 4px;
//           overflow: hidden;
//         }

//         .phase-box {
//           flex: 1;
//           border-right: 1px solid #ccc;
//           text-align: center;
//           font-size: 12px;
//           padding: 2px 4px;
//         }

//         .phase-box:last-child {
//           border-right: none;
//         }

//         .phase-title {
//           font-weight: bold;
//           color: #c40000;
//           border-bottom: 1px solid #ccc;
//           padding: 2px 0;
//           font-size: 13px;
//         }

//         .phase-body {
//           padding: 4px 2px;
//         }

//         .phase-body div {
//           margin: 1px 0;
//           font-size: 12px;
//         }

//         input {
//           width: 32px;
//           text-align: center;
//           padding: 2px;
//           font-size: 12px;
//         }
//       `}</style>

//       <div className="phase-header-container">
//         {PHASE_KEYS.map((key) => {
//           const phase = phaseDates[key] || {};

//           return (
//             <div className="phase-box" key={key}>
//               <div className="phase-title">{PHASE_LABELS[key]}</div>

//               <div className="phase-body">
//                 <div>
//                   <strong>Start:</strong> {phase.start || ""}
//                 </div>
//                 <div>
//                   <strong>End:</strong> {phase.end || ""}
//                 </div>
//                 <div>
//                   <strong>Weeks:</strong>
//                   <input
//                     type="number"
//                     min="0"
//                     value={phase.weeks ?? manualWeeks[key] ?? ""}
//                     onChange={(e) => handleWeekChange(key, e.target.value)}
//                   />
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </>
//   );
// };

// export default PhaseHeader;

// import React, { useState } from "react";

// const PHASE_LABELS = {
//   phase_0: "Phase 0",
//   phase_1: "Phase 1",
//   phase_2: "Phase 2",
//   phase_3_4: "Phase 3-4",
// };

// const PHASE_KEYS = ["phase_0", "phase_1", "phase_2", "phase_3_4"];

// const PhaseHeader = ({
//   phaseDates = {},
//   manualWeeks = {},
//   updateManualWeeks = () => {},
// }) => {
//   const [editingPhase, setEditingPhase] = useState(null);

//   const handleWeekChange = (key, value) => {
//     updateManualWeeks(key, value);
//   };

//   return (
//     <>
//       <style>{`
//         .phase-table {
//           width: 100%;
//           border-collapse: collapse;
//           margin-bottom: 16px;
//         }

//         .phase-table th, .phase-table td {
//           border: 1px solid black;
//           padding: 6px 8px;
//           text-align: center;
//           font-size: 13px;
//         }

//         .phase-table th {
//           background-color: #f2f2f2;
//           color: #c40000;
//           font-weight: bold;
//         }

//         input {
//           width: 50px;
//           text-align: center;
//           padding: 2px;
//           font-size: 12px;
//         }

//         .weeks-text {
//           cursor: pointer;
//           display: inline-block;
//           min-width: 30px;
//         }
//       `}</style>

//       <table className="phase-table">
//         <thead>
//           <tr>
//             <th>Phase</th>
//             {PHASE_KEYS.map((key) => (
//               <th key={key}>{PHASE_LABELS[key]}</th>
//             ))}
//           </tr>
//         </thead>

//         <tbody>
//           <tr>
//             <td>
//               <strong>Start</strong>
//             </td>
//             {PHASE_KEYS.map((key) => (
//               <td key={key}>{phaseDates[key]?.start || "-"}</td>
//             ))}
//           </tr>

//           <tr>
//             <td>
//               <strong>End</strong>
//             </td>
//             {PHASE_KEYS.map((key) => (
//               <td key={key}>{phaseDates[key]?.end || "-"}</td>
//             ))}
//           </tr>

//           <tr>
//             <td>
//               <strong>Weeks</strong>
//             </td>
//             {PHASE_KEYS.map((key) => {
//               const phase = phaseDates[key] || {};
//               return (
//                 <td key={key}>
//                   {editingPhase === key ? (
//                     <input
//                       type="number"
//                       min="0"
//                       autoFocus
//                       value={manualWeeks[key] ?? phase.weeks ?? ""}
//                       onChange={(e) => handleWeekChange(key, e.target.value)}
//                       onBlur={() => setEditingPhase(null)}
//                       onKeyDown={(e) =>
//                         e.key === "Enter" && setEditingPhase(null)
//                       }
//                     />
//                   ) : (
//                     <span
//                       className="weeks-text"
//                       onClick={() => setEditingPhase(key)}
//                     >
//                       {manualWeeks[key] ?? phase.weeks ?? "-"}
//                     </span>
//                   )}
//                 </td>
//               );
//             })}
//           </tr>
//         </tbody>
//       </table>
//     </>
//   );
// };

// export default PhaseHeader;

import React, { useState } from "react";

const PHASE_LABELS = {
  phase_0: "Phase 0",
  phase_1: "Phase 1",
  phase_2: "Phase 2",
  phase_3_4: "Phase 3-4",
};

const PHASE_KEYS = ["phase_0", "phase_1", "phase_2", "phase_3_4"];

const PhaseHeader = ({
  phaseDates = {},
  manualWeeks = {},
  updateManualWeeks = () => {},
}) => {
  const [editingPhase, setEditingPhase] = useState(null);

  const handleWeekChange = (key, value) => {
    const numeric = value === "" ? null : Number(value);
    updateManualWeeks(key, numeric);
  };

  return (
    <>
      <style>{`
        .phase-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-family: Arial, sans-serif;
        }

        .phase-table th, .phase-table td {
          border: 1px solid #ccc;
          padding: 8px 12px;
          text-align: center;
          font-size: 14px;
        }

        .phase-table th {
          background-color: #f9f9f9;
          color: #c40000;
          font-weight: bold;
        }

        .weeks-text {
          cursor: pointer;
          display: inline-block;
          min-width: 35px;
          padding: 2px 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .weeks-text:hover {
          background-color: #ffe6e6;
        }

        input {
          width: 50px;
          text-align: center;
          padding: 2px 4px;
          font-size: 13px;
          border: 1px solid #c40000;
          border-radius: 4px;
          outline: none;
        }

        input:focus {
          background-color: #fff5f5;
        }

        
      `}</style>

      <table className="phase-table">
        <thead>
          <tr>
            <th>Phase</th>
            {PHASE_KEYS.map((key) => (
              <th key={key}>{PHASE_LABELS[key]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Start</strong>
            </td>
            {PHASE_KEYS.map((key) => (
              <td key={key}>{phaseDates[key]?.start || "-"}</td>
            ))}
          </tr>

          <tr>
            <td>
              <strong>End</strong>
            </td>
            {PHASE_KEYS.map((key) => (
              <td key={key}>{phaseDates[key]?.end || "-"}</td>
            ))}
          </tr>

          <tr>
            <td>
              <strong>Weeks</strong>
            </td>
            {PHASE_KEYS.map((key) => {
              const phase = phaseDates[key] || {};
              // Controlled value: prefer manualWeeks, fallback to phase.weeks, fallback empty string
              const valueForInput =
                editingPhase === key
                  ? manualWeeks[key] ?? phase.weeks ?? ""
                  : undefined;

              const displayValue = phase.weeks ?? "-";

              return (
                <td key={key}>
                  {editingPhase === key ? (
                    <input
                      type="number"
                      min="0"
                      ssss
                      autoFocus
                      value={phase.weeks}
                      onChange={(e) => handleWeekChange(key, e.target.value)}
                      onBlur={() => setEditingPhase(null)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setEditingPhase(null)
                      }
                    />
                  ) : (
                    <span
                      className="weeks-text"
                      onClick={() => setEditingPhase(key)}
                      title="Click to edit"
                    >
                      {displayValue}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default PhaseHeader;
