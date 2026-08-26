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

  // 1. Initialize state safely (using a callback for performance)
  const [otherTableData, setOtherTableData] = useState(() => {
    const payload =
      jsonData?.additionalOthersHoursAndCostPayload?.otherExpenses;
    return payload && Object.keys(payload).length > 0
      ? payload
      : INITIAL_OTHER_DATA.additionalOthersHoursAndCostPayload.otherExpenses;
  });

  // 1.1. Loading (Storage -> State)
  useEffect(() => {
    if (!storedData) return;
    // Other table data
    if (storedData.otherTableData) {
      console.log("Hello Other Cost Table: \n", storedData.otherTableData);
      setOtherTableData(storedData.otherTableData);
    }
  }, [storedData]);

  // 1.2. Bridging (State -> Ref)
  useEffect(() => {
    // This triggers whenever the state changes (from loading OR typing)
    sharedRef.currentOtherData = {
      additionalOthersHoursAndCostPayload: {
        otherExpenses: otherTableData,
      },
    };
  }, [otherTableData]);

  // 2. Sync state when jsonData loads asynchronously from Forge Storage
  useEffect(() => {
    const payload =
      jsonData?.additionalOthersHoursAndCostPayload?.otherExpenses;
    if (payload && Object.keys(payload).length > 0) {
      setOtherTableData(payload);
    }
  }, [jsonData]);

  // 3. Update function for hours/cost
  function updateOtherTableParam(design, phase, field, value) {
    setOtherTableData((prev) => ({
      ...prev,
      [design]: {
        ...prev[design],
        [phase]: {
          ...prev[design]?.[phase], // Added optional chaining to prevent crashes
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
