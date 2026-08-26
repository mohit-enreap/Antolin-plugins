import { useState, useEffect, useContext } from "react";
import { StorageContext } from "../../StorageContext";
import { sharedRef } from "../../shared/sharedStore";

// Default data exactly matching your payload structure
const INITIAL_OTHER_DATA = {
  additionalOthersHoursAndCostPayload: {
    otherExpenses: {
      Travels: {
        phase0: { hours: 0, cost: 0 },
        phase1: { hours: 0, cost: 0 },
        phase2: { hours: 0, cost: 0 },
        phase34: { hours: 0, cost: 0 },
      },
      "Licenses (CAD)": {
        phase0: { hours: 0, cost: 0 },
        phase1: { hours: 0, cost: 0 },
        phase2: { hours: 0, cost: 0 },
        phase34: { hours: 0, cost: 0 },
      },
      Materials: {
        phase0: { hours: 0, cost: 0 },
        phase1: { hours: 0, cost: 0 },
        phase2: { hours: 0, cost: 0 },
        phase34: { hours: 0, cost: 0 },
      },
    },
  },
};

export function useOtherTableLogic({ jsonData = {} }) {
  const { storedData } = useContext(StorageContext);

  // Helper to strip the bad key from any object
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    const clean = { ...obj };
    delete clean["[object Object]"]; // Explicitly remove the ghost key
    return clean;
  };

  // 1. Initialize state safely (Adding sanitization here)
  const [otherTableData, setOtherTableData] = useState(() => {
    const payload =
      jsonData?.additionalOthersHoursAndCostPayload?.otherExpenses;
    const baseData =
      payload && Object.keys(payload).length > 0
        ? payload
        : INITIAL_OTHER_DATA.additionalOthersHoursAndCostPayload.otherExpenses;

    return sanitize(baseData);
  });

  // 1.1. Loading (Storage -> State)
  useEffect(() => {
    if (storedData?.otherTableData) {
      setOtherTableData(sanitize(storedData.otherTableData));
    }
  }, [storedData]);

  // 2. Sync when jsonData loads (Adding sanitization here)
  useEffect(() => {
    const payload =
      jsonData?.additionalOthersHoursAndCostPayload?.otherExpenses;
    if (payload && Object.keys(payload).length > 0) {
      setOtherTableData(sanitize(payload));
    }
  }, [jsonData]);

  // 1.2. Bridging (State -> Ref)
  useEffect(() => {
    sharedRef.currentOtherData = {
      additionalOthersHoursAndCostPayload: {
        otherExpenses: otherTableData,
      },
    };
  }, [otherTableData]);

  // 3. Update function with "The Guard"
  function updateOtherTableParam(design, phase, field, value) {
    // PROTECT: Prevent React Event objects from becoming keys
    if (typeof design !== "string" || !phase || !field) {
      console.warn(
        "Blocked invalid update call. Check if you passed an Event object.",
      );
      return;
    }

    setOtherTableData((prev) => ({
      ...prev,
      [design]: {
        ...prev[design],
        [phase]: {
          ...prev[design]?.[phase],
          [field]: Number(value) || 0,
        },
      },
    }));
  }

  return {
    otherTableData,
    updateOtherTableParam,
  };
}
