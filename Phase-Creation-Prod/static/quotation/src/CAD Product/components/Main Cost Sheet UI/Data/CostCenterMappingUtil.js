// Maps RFQ row role → customerProductData key
export const ORG_SOURCE_BY_ROLE = {
  // 3D roles
  TDL: "3D_TDL",
  "Technical Design Leader Combined" :"3D_Coord" ,
  COO: "3D_Coord",
  DE: "3D_SW",

 
  // 2D / Activity roles
  "2d Antolin Drawings": "2D_INT",
  "2d Customer Drawings": "2D_OEM",
  "Data Management": "DM",
  "Geometrical Study": "3D_StackUp",
  Feasibility: "3D_Feasib",


  //CAE:
  "CAE Engineer"  : "CAE_TCL" ,
  "CAE Standard Work" : "CAE_SW" ,


//PS:
   "P. Safety Standard & Leader act" : "PS_PSL",

//Thermal Safty:
  "Thermals Activities"  :     "THR_TCL"


};

export function getOrgValue(roleKey, customerProductData) {
  const sourceKey = ORG_SOURCE_BY_ROLE[roleKey];
  if (!sourceKey) return null;

  return customerProductData?.[sourceKey] ?? null;
}

// Phases details
export const PHASE_META = {
  phase0: {
    label: "Phase 0",
    start: "2026-01-05",
    end: "2026-01-26",
    weeks: 3,
  },
  phase1: {
    label: "Phase 1",
    start: "2026-01-27",
    end: "2026-05-05",
    weeks: 14,
  },
  phase2: {
    label: "Phase 2",
    start: "2026-05-06",
    end: "2026-08-26",
    weeks: 16,
  },
  phase34: {
    label: "Phase 3-4",
    start: "2026-08-27",
    end: "2027-08-12",
    weeks: 50,
  },
};
