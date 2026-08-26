import { useState } from "react";

export function useGlobalParams(initial = null) {
  const [globalParams, setGlobalParams] = useState(
    initial || {
      TDL: "YES",
      COO: "YES",
      DE: "YES",
      "2D": "YES",
      "Data Management": "YES",
      "Geometrical Study": "YES",
    }
  );

  function updateGlobalParam(key, val) {
    setGlobalParams((p) => ({ ...p, [key]: val }));
  }

  return { globalParams, updateGlobalParam, setGlobalParams };
}

// export function useGlobalParams(initial = null) {
//   return;
// }
