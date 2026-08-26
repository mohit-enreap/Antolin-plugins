// sharedStore.js

/** ===============================
 *  DEFAULT TEMPLATE for Cost Center Phases
 *  Ensures every cost center always has
 *  Offer / Proto / Serie / Indust keys
 * Object.freeze() → prevents accidental modification
 *  =============================== */
export const DEFAULT_COST_CENTER = Object.freeze({
  Offer: 0,
  Proto: 0,
  Serie: 0,
  Indust: 0,
});

//Shared data among different Components
export const sharedRef = {
  product: null,
  Customer: null,
  "Type Of Development": null,
  ProjectName: null,
  isCheatActive: false,
  dmCostCenter: "",
  PHASE_META: {
    phase0: {},
    phase1: {},
    phase2: {},
    phase34: {},
  },

  phaseflagShared: {
    phase0flag: false,
    phase1flag: false,
    phase2flag: false,
    phase34flag: false,
  },
  //===to get Week infor from selected week count for  phase Start====
  phaseWeeksShared: {
    phase0Week: 0,
    phase1Week: 0,
    phase2Week: 0,
    phase34Week: 0,
  },

  //===to get Week infor from selected week count for  phase end====

  currentCAE: {
    globalTDL: 1,
    globalDE: 1,
    sumTDL: 0,
    sumDE: 0,
    grandTotal: 0,
    activities: {},
    tempJSON: "",
    finalJSON: "",
    iterationTotal: 0,
    CAEEngineersPhase1: 0,
    CAEEngineersPhase2: 0,
    CAEStandardWorkPhase1: 0,
    CAEStandardWorkPhase2: 0,
  },

  currentPS: {
    protoTDL: 0,
    protoCOO: 0,
    protoDE: 0,
    protoTotal: 0,
    serieTDL: 0,
    serieCOO: 0,
    serieDE: 0,
    serieTotal: 0,
    TDL: 0,
    COO: 0,
    DE: 0,
    Total: 0,
  },
  currentTheramalSafety: {
    TheramalSafetyOffer: 0,
    TheramalSafetyProto: 0,
    TheramalSafetySerie: 0,
    TheramalSafetyActive: "no",
  },
  // Other table
  currentOtherData: {
    additionalOthersHoursAndCostPayload: {
      otherExpenses: {},
    },
  },
  /** 👇 DEFAULT COST CENTER DATA */
  costCenters: {},

  // hours per week for Offer and Industrialization phases
  hoursPerWeek: {
    TDL: 0,
    "3D Coordination": 0,
    "3D Standard": 0,
  },

  cadDE: {
    protoDE: 0,
    serieDE: 0,
  },

  total: {
    totalHours: 0,
    totalCost: 0,
  }
};
