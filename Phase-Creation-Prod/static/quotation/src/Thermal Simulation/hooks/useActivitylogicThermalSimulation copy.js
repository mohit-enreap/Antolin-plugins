import { useState, useMemo } from "react";

// ================= STANDARD ACTIVITIES =================
const firstLoopStandard = [
  { name: "DATA collect", hours: 5 },
  { name: "Documents creation", hours: 5 },
  { name: "Model generation", hours: 30 },
  { name: "Analysis result (One Simulation)", hours: 1 },
  { name: "Report generation (One Simulation)", hours: 5 }
];

const nextLoopStandard = [
  { name: "DATA collect", hours: 0 },
  { name: "Documents creation", hours: 1 },
  { name: "Model generation", hours: 20 },
  { name: "Analysis result (One Simulation)", hours: 1 },
  { name: "Report generation (One Simulation)", hours: 2 }
];

// ================= CORE CALCULATION =================
function calculateRfqDvp(standard, rfqCases, devCases) {
  const casesRFQ = Math.max(rfqCases - 1, 0);
  const casesDEV = Math.max(devCases - 1, 0);

  const activities = standard.map((a) => {
    let rfq = a.hours;
    let dvp = a.hours;

    if (a.name.includes("Analysis")) {
      rfq += casesRFQ * 0.5;
      dvp += casesDEV * 0.5;
    }
    if (a.name.includes("Report")) {
      rfq += casesRFQ * 0.75;
      dvp += casesDEV * 0.75;
    }

    return { name: a.name, rfq, dvp };
  });

  const total = {
    rfq: activities.reduce((s, a) => s + a.rfq, 0),
    dvp: activities.reduce((s, a) => s + a.dvp, 0)
  };

  return { activities, total };
}

// ================= FINAL MULTIPLIERS =================
function calculateFirstLoop(firstLoopResult, input) {
  return {
    rfq: firstLoopResult.total.rfq * input.rfqPCB,
    dvp: firstLoopResult.total.dvp * input.devPCB * input.devCases
  };
}

function calculateNextLoop(nextLoopResult, input) {
  return {
    rfq: nextLoopResult.total.rfq * input.rfqPCB * Math.max(input.rfqLoops - 1, 0),
    dvp:
      nextLoopResult.total.dvp *
      input.devPCB *
      input.devCases *
      Math.max(input.devLoops - 1, 0)
  };
}

// ================= HOOK =================
export function useActivitylogicThermalSimulation() {

    // Hav eto set Forge for Storage
  const [thermalActive, setThermalActive] = useState("yes");

  const [inputs, setInputs] = useState({
    rfqPCB: 1,
    devPCB: 1,
    rfqCases: 1,
    devCases: 1,
    rfqLoops: 1,
    devLoops: 1
  });

  // single update function used by JSX
  const updateField = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: Number(value) }));
  };

  // calculations
  const firstLoop = useMemo(
    () => calculateRfqDvp(firstLoopStandard, inputs.rfqCases, inputs.devCases),
    [inputs]
  );

  const nextLoop = useMemo(
    () => calculateRfqDvp(nextLoopStandard, inputs.rfqCases, inputs.devCases),
    [inputs]
  );

  const finalTotals = useMemo(() => {
    return {
      first: calculateFirstLoop(firstLoop, inputs),
      next: calculateNextLoop(nextLoop, inputs)
    };
  }, [firstLoop, nextLoop, inputs]);

  return {
    thermalActive,
    setThermalActive,
    inputs,
    updateField,
    firstLoop,
    nextLoop,
    finalTotals
  };
}
