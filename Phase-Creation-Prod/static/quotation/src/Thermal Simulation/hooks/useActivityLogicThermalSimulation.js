import { useState, useEffect, useContext } from "react";
import { StorageContext } from "../../StorageContext";

import { sharedRef } from "../../shared/sharedStore";
/* =========================
   Standards Initialization
=========================*/
const firstLoopStandard = [
  { name: "DATA collect", hours: 5 },
  { name: "Documents creation", hours: 5 },
  { name: "Model generation", hours: 30 },
  { name: "Analysis result (One Simulation)", hours: 1 },
  { name: "Report generation (One Simulation)", hours: 5 },
];

const nextLoopStandard = [
  { name: "DATA collect", hours: 0 },
  { name: "Documents creation", hours: 1 },
  { name: "Model generation", hours: 20 },
  { name: "Analysis result (One Simulation)", hours: 1 },
  { name: "Report generation (One Simulation)", hours: 2 },
];

/* =========================
   Hook
=========================*/
export function useActivityLogicThermalSimulation() {
  // fetch stored data
  const {
    thermalInput: input,
    setThermalInput: setInput,
    thermalActive,
    setThermalActive,
    storedData,
  } = useContext(StorageContext);

  // const [input, setInput] = useState({
  //   rfqPCB: 0,
  //   devPCB: 0,
  //   rfqCases: 0,
  //   devCases: 0,
  //   rfqLoops: 0,
  //   devLoops: 0,
  // });

  // const [thermalActive, setThermalActive] = useState("no");

  // pDF:
  sharedRef.currentThermalSimulation = {
    input,
    thermalActive,
    pdf:
      thermalActive === "yes" // Only show When its yes
        ? {
            rfqPCB: input?.rfqPCB ?? 0,
            devPCB: input?.devPCB ?? 0,

            rfqCases: input?.rfqCases ?? 0,
            devCases: input?.devCases ?? 0,

            rfqLoops: input?.rfqLoops ?? 0,
            devLoops: input?.devLoops ?? 0,
          }
        : null,
  };

  console.log("After Render --> Thermal Inputs: \n", input);
  useEffect(() => {
    if (!storedData) return;
    console.log("Hello Thermal");

    if (storedData.thermalActive) {
      console.log("Thermal Active : \n", storedData.thermalActive);
      setThermalActive(storedData.thermalActive);
    }

    if (storedData.thermalInput) {
      console.log("Thermal Input : \n", storedData.thermalInput);
      setInput(storedData.thermalInput);
    }

    // using for PDF data
    sharedRef.currentThermalSimulation = {
      input,
      thermalActive,
      pdf:
        thermalActive === "yes" // Only show When its yes
          ? {
              rfqPCB: input?.rfqPCB ?? 0,
              devPCB: input?.devPCB ?? 0,

              rfqCases: input?.rfqCases ?? 0,
              devCases: input?.devCases ?? 0,

              rfqLoops: input?.rfqLoops ?? 0,
              devLoops: input?.devLoops ?? 0,
            }
          : null,
    };
  }, [storedData]);

  // All below will be calculated run time

  const [firstFinal, setFirstFinal] = useState({ rfq: "0.00", dvp: "0.00" });
  const [nextFinal, setNextFinal] = useState({ rfq: "0.00", dvp: "0.00" });
  const [payload, setPayload] = useState({
    offer: "0.00",
    proto: "0.00",
    serie: "0.00",
  });

  /* =========================
     Calculations
  =========================*/

  /* =========================
   Calculations
=========================*/

  const calculateRfqDvp = (standard, rfqCases, devCases) => {
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
      dvp: activities.reduce((s, a) => s + a.dvp, 0),
    };

    return { activities, total };
  };

  /* ---------- First Loop ---------- */
  const calculateFirstLoop = (firstLoopResult, input) => ({
    rfq: firstLoopResult.total.rfq * Math.max(input.rfqPCB, 0),
    dvp:
      firstLoopResult.total.dvp *
      Math.max(input.devPCB, 0) *
      Math.max(input.devCases, 0),
  });

  /* ---------- Next Loops ---------- */
  const calculateNextLoop = (nextLoopResult, input) => {
    const rfqLoopCount = Math.max(input.rfqLoops - 1, 0);
    const devLoopCount = Math.max(input.devLoops - 1, 0);

    return {
      rfq: nextLoopResult.total.rfq * Math.max(input.rfqPCB, 0) * rfqLoopCount,
      dvp:
        nextLoopResult.total.dvp *
        Math.max(input.devPCB, 0) *
        Math.max(input.devCases, 0) *
        devLoopCount,
    };
  };

  /* =========================
     Recalculation Effect
  =========================*/
  useEffect(() => {
    const firstLoop = calculateRfqDvp(
      firstLoopStandard,
      input.rfqCases,
      input.devCases,
    );
    const nextLoop = calculateRfqDvp(
      nextLoopStandard,
      input.rfqCases,
      input.devCases,
    );

    const newFirst = calculateFirstLoop(firstLoop, input);
    const newNext = calculateNextLoop(nextLoop, input);

    setFirstFinal(newFirst);
    setNextFinal(newNext);
    const newPayload = {
      offer: (Number(newFirst.rfq) + Number(newNext.rfq)).toFixed(2),
      proto: ((Number(newFirst.dvp) + Number(newNext.dvp)) / 2).toFixed(2),
      serie: ((Number(newFirst.dvp) + Number(newNext.dvp)) / 2).toFixed(2),
    };

    setPayload(newPayload);

    sharedRef.currentTheramalSafety = {
      TheramalSafetyOffer: newPayload.offer,
      TheramalSafetyProto: newPayload.proto,
      TheramalSafetySerie: newPayload.serie,
      TheramalSafetyActive: thermalActive,
    };
  }, [input, thermalActive]);

  // alert("sharedRef.currentTheramalSafety :"+ JSON.stringify(sharedRef?.currentTheramalSafety))
  /* =========================
     Helpers
  =========================*/
  const updateInput = (key, value) => {
    setInput((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const updateThermalActive = (value) => {
    setThermalActive(value);
  };

  const firstLoop = calculateRfqDvp(
    firstLoopStandard,
    input.rfqCases,
    input.devCases,
  );
  const nextLoop = calculateRfqDvp(
    nextLoopStandard,
    input.rfqCases,
    input.devCases,
  );

  return {
    thermalActive, // Thermal Safty is Seleted as YES on NO
    input,
    updateInput,
    updateThermalActive,
    firstLoop,
    nextLoop,
    firstFinal,
    nextFinal,
    ThermalSaftypayload: payload,
  };
}
