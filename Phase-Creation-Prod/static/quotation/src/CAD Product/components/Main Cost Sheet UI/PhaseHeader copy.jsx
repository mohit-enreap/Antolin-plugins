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

//----Working perfectly but ui is not expected

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
//     // 🔥 Call YOUR parent method directly
//     updateManualWeeks(key, value);
//   };

//   return (
//     <div className="phase-header-container">
//       {PHASE_KEYS.map((key) => {
//         const phase = phaseDates[key] || {};

//         return (
//           <div className="phase-box" key={key}>
//             <div className="phase-title">{PHASE_LABELS[key]}</div>

//             <div className="phase-body">
//               <div>
//                 <strong>Start:</strong> {phase.start || ""}
//               </div>
//               <div>
//                 <strong>End:</strong> {phase.end || ""}
//               </div>

//               <div>
//                 <strong>Weeks:</strong>{" "}
//                 {editingPhase === key ? (
//                   <input
//                     type="number"
//                     min="0"
//                     autoFocus
//                     value={manualWeeks[key] ?? phase.weeks ?? ""}
//                     onChange={(e) => handleWeekChange(key, e.target.value)}
//                     onBlur={() => setEditingPhase(null)}
//                     onKeyDown={(e) =>
//                       e.key === "Enter" && setEditingPhase(null)
//                     }
//                   />
//                 ) : (
//                   <span
//                     style={{ cursor: "pointer" }}
//                     onClick={() => setEditingPhase(key)}
//                   >
//                     {phase.weeks ?? "-"}
//                   </span>
//                 )}
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default PhaseHeader;

//------Final UI-------
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
    updateManualWeeks(key, value);
  };

  return (
    <div className="phase-table">
      {PHASE_KEYS.map((key) => {
        const phase = phaseDates[key] || {};

        return (
          <div className="phase-column" key={key}>
            <div className="phase-header">{PHASE_LABELS[key]}</div>

            <div className="phase-row">
              <strong>Start:</strong> {phase.start || ""}
            </div>
            <div className="phase-row">
              <strong>End:</strong> {phase.end || ""}
            </div>
            <div className="phase-row">
              <strong>Weeks:</strong>{" "}
              {editingPhase === key ? (
                <input
                  type="number"
                  min="0"
                  autoFocus
                  value={manualWeeks[key] ?? phase.weeks ?? ""}
                  onChange={(e) => handleWeekChange(key, e.target.value)}
                  onBlur={() => setEditingPhase(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingPhase(null)}
                />
              ) : (
                <span
                  className="weeks-text"
                  onClick={() => setEditingPhase(key)}
                >
                  {phase.weeks ?? "-"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PhaseHeader;
