// // hooks/useActivityLogic.js
// import { useState, useMemo } from "react";
// import { caeInitialData } from "../data/caeInitialData";
// import { useCalculations } from "./useCalculations";

// export function useActivityLogic() {
//   const [data, setData] = useState(caeInitialData);
//   const [globalTDL, setGlobalTDL] = useState(1);
//   const [globalDE, setGlobalDE] = useState(1);
//   const [tempJSON, setTempJSON] = useState("");
//   const [finalJSON, setFinalJSON] = useState("");

//   const updateActivity = (key, field, value) => {
//     setData((prev) => {
//       const copy = JSON.parse(JSON.stringify(prev));
//       copy.CAE.activities[key][field] = value;
//       return copy;
//     });
//   };

//   // 🧠 Central calculation
//   const calculation = useMemo(() => {
//     return useCalculations(data.CAE.activities, globalTDL, globalDE);
//   }, [data, globalTDL, globalDE]);

//   const Global = {
//     TDL: globalTDL,
//     DE: globalDE,
//   };

//   const saveTemp = () => {
//     setTempJSON(
//       JSON.stringify(
//         {
//           Global,
//           ...data,

//           CAE: {
//             ...data.CAE,
//             activities: calculation.activities,
//           },
//         },
//         null,
//         2
//       )
//     );
//   };

//   const saveFinal = () => {
//     setFinalJSON(
//       JSON.stringify(
//         {
//           ...data,
//           CAE: {
//             ...data.CAE,
//             activities: calculation.activities,
//           },
//         },
//         null,
//         2
//       )
//     );
//   };

//   return {
//     // data
//     data,
//     activities: calculation.activities,

//     // globals
//     globalTDL,
//     globalDE,
//     setGlobalTDL,
//     setGlobalDE,

//     // results
//     sumTDL: calculation.sumTDL,
//     sumDE: calculation.sumDE,
//     grandTotal: calculation.grand,

//     // actions
//     updateActivity,
//     saveTemp,
//     saveFinal,

//     // json
//     tempJSON,
//     finalJSON,
//   };
// }

//-===========working well (still not readable ===========)

// // hooks/useActivityLogic.js
// import { useState, useMemo } from "react";
// import { caeInitialData } from "../data/caeInitialData";
// import { useCalculations } from "./useCalculations";

// export function useActivityLogic() {
//   const [data, setData] = useState(caeInitialData);
//   // 🌍 Global toggles
//   const [globalTDL, setGlobalTDL] = useState(1);
//   const [globalDE, setGlobalDE] = useState(1);

//   // JSON outputs
//   const [tempJSON, setTempJSON] = useState("");
//   const [finalJSON, setFinalJSON] = useState("");

//   // 🔁 Update activity
//   const updateActivity = (key, field, value) => {
//     setData((prev) => {
//       const copy = structuredClone(prev);
//       copy.CAE.activities[key][field] = value;
//       return copy;
//     });
//   };

//   // 🧠 Calculations (derived)
//   const calculation = useMemo(
//     () => useCalculations(data.CAE.activities, globalTDL, globalDE),
//     [data, globalTDL, globalDE]
//   );

//   const Global = {
//     TDL: globalTDL,
//     DE: globalDE,
//   };

//   // 🟡 TEMP (snapshot only)
//   const saveTemp = () => {
//     setTempJSON(JSON.stringify(buildTempJson(data, Global), null, 2));
//   };

//   // 🟢 FINAL (rules applied)
//   const saveFinal = () => {
//     setFinalJSON(
//       JSON.stringify(
//         buildFinalJson(data, calculation.activities, Global),
//         null,
//         2
//       )
//     );
//   };

//   const applyGlobalRules = (activities, global) => {
//     return Object.fromEntries(
//       Object.entries(activities).map(([key, activity]) => [
//         key,
//         {
//           ...activity,
//           TDL: global.TDL === 1 ? activity.TDL : 0,
//           DE: global.DE === 1 ? activity.DE : 0,
//         },
//       ])
//     );
//   };

//   /**
//    * Build TEMP JSON (no mutation)
//    */
//   const buildTempJson = (data, global) => ({
//     Global: global,
//     ...data,
//   });

//   /**
//    * Build FINAL JSON (mutated via rules)
//    */
//   const buildFinalJson = (data, activities, global) => ({
//     Global: global,
//     ...data,
//     CAE: {
//       ...data.CAE,
//       activities: applyGlobalRules(activities, global),
//     },
//   });

//   return {
//     // base
//     data,
//     activities: calculation.activities,

//     // globals
//     globalTDL,
//     globalDE,
//     setGlobalTDL,
//     setGlobalDE,

//     // totals
//     sumTDL: calculation.sumTDL,
//     sumDE: calculation.sumDE,
//     grandTotal: calculation.grand,

//     // actions
//     updateActivity,
//     saveTemp,
//     saveFinal,

//     // output
//     tempJSON,
//     finalJSON,
//   };
// }

//=========================================================
// hooks/useActivityLogic.js

// import { useState, useMemo } from "react";
// import { caeInitialData } from "../data/caeInitialData";
// import { useCalculations } from "./useCalculations";

// export function useActivityLogic() {
//   // --------------------------------------------------
//   // 1️⃣ BASE DATA (Original CAE structure)
//   // --------------------------------------------------
//   const [data, setData] = useState(caeInitialData);

//   // --------------------------------------------------
//   // 2️⃣ GLOBAL PARAMETERS (ON / OFF switches)
//   // 1 = enabled, 0 = disabled
//   // --------------------------------------------------
//   const [globalTDL, setGlobalTDL] = useState(1);
//   const [globalDE, setGlobalDE] = useState(1);

//   // --------------------------------------------------
//   // 3️⃣ JSON OUTPUTS (for UI / download / API)
//   // --------------------------------------------------
//   const [tempJSON, setTempJSON] = useState("");
//   const [finalJSON, setFinalJSON] = useState("");

//   // --------------------------------------------------
//   // 4️⃣ UPDATE A SINGLE ACTIVITY FIELD
//   // Example: update loops, checkbox, etc.
//   // --------------------------------------------------
//   const updateActivity = (key, field, value) => {
//     setData((prevData) => {
//       // Create a deep copy (important!)
//       const copy = structuredClone(prevData);

//       // Update only the required field
//       copy.CAE.activities[key][field] = value;

//       return copy;
//     });
//   };

//   // --------------------------------------------------
//   // 5️⃣ CALCULATIONS (Derived data)
//   // Runs only when dependencies change
//   // --------------------------------------------------
//   const calculation = useMemo(() => {
//     return useCalculations(data.CAE.activities, globalTDL, globalDE);
//   }, [data, globalTDL, globalDE]);

//   // --------------------------------------------------
//   // 6️⃣ GLOBAL OBJECT (used inside JSON)
//   // --------------------------------------------------
//   const Global = {
//     TDL: globalTDL,
//     DE: globalDE,
//   };

//   // --------------------------------------------------
//   // 7️⃣ APPLY GLOBAL RULES
//   // If global TDL / DE is OFF → set values to 0
//   // --------------------------------------------------
//   const applyGlobalRules = (activities, global) => {
//     return Object.fromEntries(
//       Object.entries(activities).map(([key, activity]) => {
//         return [
//           key,
//           {
//             ...activity,
//             TDL: global.TDL === 1 ? activity.TDL : 0,
//             DE: global.DE === 1 ? activity.DE : 0,
//           },
//         ];
//       })
//     );
//   };

//   // --------------------------------------------------
//   // 8️⃣ BUILD TEMP JSON (NO MODIFICATION)
//   // Only a snapshot of current data + globals
//   // --------------------------------------------------
//   const buildTempJson = (data, global) => {
//     return {
//       Global: global,
//       ...data,
//     };
//   };

//   // --------------------------------------------------
//   // 9️⃣ BUILD FINAL JSON (MODIFIED DATA)
//   // Global rules are applied here
//   // --------------------------------------------------
//   const buildFinalJson = (data, activities, global) => {
//     return {
//       Global: global,
//       ...data,
//       CAE: {
//         ...data.CAE,
//         activities: applyGlobalRules(activities, global),
//       },
//     };
//   };

//   // --------------------------------------------------
//   // 🔟 SAVE TEMP JSON
//   // --------------------------------------------------
//   const saveTemp = () => {
//     const temp = buildTempJson(data, Global);
//     setTempJSON(JSON.stringify(temp, null, 2));
//   };

//   // --------------------------------------------------
//   // 1️⃣1️⃣ SAVE FINAL JSON
//   // --------------------------------------------------
//   const saveFinal = () => {
//     const final = buildFinalJson(data, calculation.activities, Global);
//     setFinalJSON(JSON.stringify(final, null, 2));
//   };

//   // --------------------------------------------------
//   // 1️⃣2️⃣ RETURN EVERYTHING UI NEEDS
//   // --------------------------------------------------
//   return {
//     // original data
//     data,

//     // calculated activities
//     activities: calculation.activities,

//     // global controls
//     globalTDL,
//     globalDE,
//     setGlobalTDL,
//     setGlobalDE,

//     // totals
//     sumTDL: calculation.sumTDL,
//     sumDE: calculation.sumDE,
//     grandTotal: calculation.grand,

//     // actions
//     updateActivity,
//     saveTemp,
//     saveFinal,

//     // json output
//     tempJSON,
//     finalJSON,
//   };
// }

//=================
//add here click method for temp and Final:

// // hooks/useActivityLogic.js
// import { useState, useMemo, useEffect } from "react";
// import { caeInitialData } from "../data/caeInitialData";
// import { useCalculations } from "./useCalculations";

// export function useActivityLogic() {
//   const Global = {
//     TDL: globalTDL,
//     DE: globalDE,
//   };

//   // --------------------------------------------------
//   // 1️⃣ BASE DATA
//   // --------------------------------------------------
//   const [data, setData] = useState(caeInitialData);

//   // --------------------------------------------------
//   // 2️⃣ GLOBAL PARAMETERS (ON / OFF)
//   // --------------------------------------------------
//   const [globalTDL, setGlobalTDL] = useState(1);
//   const [globalDE, setGlobalDE] = useState(1);

//   // --------------------------------------------------
//   // 3️⃣ OUTPUT JSON STATES
//   // --------------------------------------------------
//   const [tempJSON, setTempJSON] = useState("");
//   const [finalJSON, setFinalJSON] = useState("");

//   // --------------------------------------------------
//   // 4️⃣ UPDATE ACTIVITY FIELD
//   // --------------------------------------------------
//   const updateActivity = (key, field, value) => {
//     setData((prev) => {
//       const copy = structuredClone(prev);
//       copy.CAE.activities[key][field] = value;
//       return copy;
//     });
//   };

//   // --------------------------------------------------
//   // 5️⃣ CALCULATIONS (DERIVED)
//   //Re-calculate calculation only when data, globalTDL, or globalDE changes
//   // --------------------------------------------------
//   const calculation = useMemo(() => {
//     return useCalculations(data.CAE.activities, globalTDL, globalDE);
//   }, [data, globalTDL, globalDE]);

//   useEffect(() => {
//     const Global = {
//       TDL: globalTDL,
//       DE: globalDE,
//     };

//     const temp = {
//       TDL: globalTDL,
//       DE: globalDE,
//       ...data,
//       CAE: {
//         ...data.CAE,
//         activities: calculation.activities,
//       },
//     };

//     const final = {
//       Global,
//       ...data,
//       CAE: {
//         ...data.CAE,
//         activities: applyGlobalRules(calculation.activities, Global),
//       },
//     };

//     setTempJSON(JSON.stringify(temp, null, 2));
//     setFinalJSON(JSON.stringify(final, null, 2));
//   }, [data, calculation.activities, globalTDL, globalDE]);

//   // --------------------------------------------------
//   // 6️⃣ GLOBAL OBJECT
//   // --------------------------------------------------
//   const Global = {
//     TDL: globalTDL,
//     DE: globalDE,
//   };

//   // --------------------------------------------------
//   // 7️⃣ APPLY GLOBAL RULES
//   // --------------------------------------------------
//   const applyGlobalRules = (activities, global) => {
//     return Object.fromEntries(
//       Object.entries(activities).map(([key, activity]) => [
//         key,
//         {
//           ...activity,
//           TDL: global.TDL === 1 ? activity.TDL : 0,
//           DE: global.DE === 1 ? activity.DE : 0,
//         },
//       ])
//     );
//   };

//   // --------------------------------------------------
//   // 8️⃣ BUILD TEMP JSON (NO MODIFICATION)
//   // --------------------------------------------------
//   const buildTempJson = () => ({
//     Global,
//     ...data,
//     CAE: {
//       ...data.CAE,
//       activities: calculation.activities,
//     },
//   });

//   // --------------------------------------------------
//   // 9️⃣ BUILD FINAL JSON (MODIFIED)
//   // --------------------------------------------------
//   const buildFinalJson = () => ({
//     Global,
//     ...data,
//     CAE: {
//       ...data.CAE,
//       activities: applyGlobalRules(calculation.activities, Global),
//     },
//   });

//   // --------------------------------------------------
//   // 🔟 ONE METHOD → TEMP + FINAL
//   // --------------------------------------------------
//   const generateAndSaveJson1 = () => {
//     alert("====1=======");
//     const temp = buildTempJson();
//     const final = buildFinalJson();

//     setTempJSON(JSON.stringify(temp, null, 2));
//     setFinalJSON(JSON.stringify(final, null, 2));
//   };
//   const generateAndSaveJson = () => {
//     const Global = {
//       TDL: globalTDL,
//       DE: globalDE,
//     };

//     const temp = {
//       Global,
//       ...data,
//       CAE: {
//         ...data.CAE,
//         activities: calculation.activities,
//       },
//     };

//     const final = {
//       Global,
//       ...data,
//       CAE: {
//         ...data.CAE,
//         activities: applyGlobalRules(calculation.activities, Global),
//       },
//     };

//     setTempJSON(JSON.stringify(temp, null, 2));
//     setFinalJSON(JSON.stringify(final, null, 2));
//   };

//   // --------------------------------------------------
//   // 1️⃣1️⃣ RETURN TO UI
//   // --------------------------------------------------
//   return {
//     // base
//     data,
//     activities: calculation.activities,

//     // globals
//     globalTDL,
//     globalDE,
//     setGlobalTDL,
//     setGlobalDE,

//     // totals
//     sumTDL: calculation.sumTDL,
//     sumDE: calculation.sumDE,
//     grandTotal: calculation.grand,

//     // actions
//     updateActivity,
//     generateAndSaveJson, // ✅ ONE BUTTON

//     // outputs
//     tempJSON,
//     finalJSON,
//   };
// }

import { useState } from "react";
import { caeInitialData } from "../data/caeInitialData";
import { useCalculations } from "./useCalculations"; // must be PURE

export function useActivityLogic() {
  // --------------------------------------------------
  // 1️⃣ BASE DATA (SOURCE OF TRUTH)
  // --------------------------------------------------
  const [data, setData] = useState(caeInitialData);

  // --------------------------------------------------
  // 2️⃣ GLOBALS (FROM INITIAL JSON IF PRESENT)
  // --------------------------------------------------
  const [globalTDL, setGlobalTDL] = useState(caeInitialData?.Global?.TDL ?? 0);
  const [globalDE, setGlobalDE] = useState(caeInitialData?.Global?.DE ?? 0);

  // --------------------------------------------------
  // 3️⃣ UPDATE ACTIVITY
  // --------------------------------------------------
  const updateActivity = (key, field, value) => {
    setData((prev) => {
      const copy = structuredClone(prev);
      copy.CAE.activities[key][field] = value;
      return copy;
    });
  };

  // --------------------------------------------------
  // 4️⃣ DERIVED CALCULATION (PURE)
  // --------------------------------------------------
  const calculation = useCalculations(data.CAE.activities, globalTDL, globalDE);

  // --------------------------------------------------
  // 5️⃣ GLOBAL OBJECT
  // --------------------------------------------------
  const Global = {
    TDL: globalTDL,
    DE: globalDE,
  };

  // --------------------------------------------------
  // 6️⃣ APPLY GLOBAL RULES (FINAL ONLY)
  // --------------------------------------------------
  const applyGlobalRules = (activities) =>
    Object.fromEntries(
      Object.entries(activities).map(([key, activity]) => [
        key,
        {
          ...activity,
          TDL: globalTDL ? activity.TDL : 0,
          DE: globalDE ? activity.DE : 0,
        },
      ])
    );

  // --------------------------------------------------
  // 7️⃣ TEMP JSON (AUTO UPDATED)
  // --------------------------------------------------
  const tempJSON = JSON.stringify(
    {
      ...data,
      Global: Global, // ✅ override top-level Global
      CAE: {
        ...data.CAE,
        activities: calculation.activities,
      },
    },
    null,
    2
  );

  // --------------------------------------------------
  // 8️⃣ FINAL JSON (AUTO UPDATED)
  // --------------------------------------------------
  // --------------------------------------------------
  // 8️⃣ FINAL JSON (AUTO UPDATED)
  // --------------------------------------------------
  const finalJSON = JSON.stringify(
    {
      ...data,
      Global: Global, // ✅ override top-level Global
      CAE: {
        ...data.CAE,
        activities: applyGlobalRules(calculation.activities, Global),
      },
    },
    null,
    2
  );

  // --------------------------------------------------
  // 9️⃣ RETURN API
  // --------------------------------------------------
  return {
    // base
    data,
    activities: calculation.activities,

    // globals
    globalTDL,
    globalDE,
    setGlobalTDL,
    setGlobalDE,

    // totals
    sumTDL: calculation.sumTDL,
    sumDE: calculation.sumDE,
    grandTotal: calculation.grand,

    // actions
    updateActivity,

    // json
    tempJSON,
    finalJSON,
  };
}
