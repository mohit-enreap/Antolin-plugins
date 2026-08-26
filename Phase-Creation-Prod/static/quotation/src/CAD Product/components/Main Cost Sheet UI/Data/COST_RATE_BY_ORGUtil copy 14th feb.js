// From excel we have to Take mapping details of Cost center

//For Testing
export const COST_RATE_BY_ORG = {
  "G. A. Deutschland": 2,
  "G.A.Pune (IF)": 3,
  "G.A.Hyderabad": 4,
  INTERTRIM: 5,
  "BCC 100%": 6,

  // fallback
  DEFAULT: 100,
};





export const COST_RATE_BY_ORG1 = {

  // fallback
  DEFAULT: 0,
};


// not using ignore this function
export function getCostRateByOrg(org) {
  if (!org) return COST_RATE_BY_ORG.DEFAULT;
  return COST_RATE_BY_ORG[org] ?? COST_RATE_BY_ORG.DEFAULT;
}
// not using ignore this function
export function calculateCost(hours, org) {
  const rate = getCostRateByOrg(org);
  return +(hours * rate).toFixed(2);
}



//using  this function for for find cost multipler (wrt to Cost center)
//replaced by "getCostRateByOrgNewPayload"
export function getCostRateByOrg1(org, phase) {
  if (!org || !phase) return COST_RATE_BY_ORG1.DEFAULT;

  const orgConfig = COST_RATE_BY_ORG1[org];
  if (!orgConfig) return COST_RATE_BY_ORG1.DEFAULT;

  return orgConfig[phase] ?? COST_RATE_BY_ORG1.DEFAULT;
}

// working code2
///Get Final rate --> (hours * rate)
export function calculateCost1(hours, org, phase,CECO_COST_SHEET_YearANDPhases) {
  if (!hours) return 0;

  

// const rate = getCostRateByOrg1(org, phase);
  const rate = getCostRateByOrgNewPayload(org, phase,CECO_COST_SHEET_YearANDPhases);
  // alert("CECO_COST_SHEET_YearANDPhases1 rate:"+rate)  
 
  return +(hours * rate).toFixed(2);
} 


// working code3
//To get Cost for Specific "Cost center"
export function getCostRateByOrgNewPayload(org, phase, CECO_COST_SHEET_YearANDPhases) {

  
  console.log("[CECO] Function called →", { org, phase });

  //  when org not found or data is not found
  if (!org) {
    console.warn("[CECO] FAILED → Org is missing❌");
    return 0;
  }

  if (!CECO_COST_SHEET_YearANDPhases?.data) {
    console.warn("[CECO] FAILED → CECO_COST_SHEET_YearANDPhases.data is missing❌");
    return 0;
  }

  console.log("[CECO] Total records available →", CECO_COST_SHEET_YearANDPhases.data.length);

  // Normalize org for safe comparison
  const normalize = str => str?.replace(/\s+/g, "").toLowerCase();

  const normalizedOrg = normalize(org);
  console.log("[CECO] Normalized org →", normalizedOrg);

  const orgConfig = CECO_COST_SHEET_YearANDPhases.data.find(
    item => normalize(item.society) === normalizedOrg
  );

  //  Org not found
  if (!orgConfig) {
    console.warn("❌[CECO] FAILED → Org not found in CECO sheet →", org);
    return 0;
  }

  console.log("[CECO] Org found →", orgConfig);

  //  Phase missing
  if (!(phase in orgConfig)) {
    console.warn(`❌[CECO] FAILED → Phase "${phase}" not available for org →`, org);
    return 0;
  }

  const value = orgConfig[phase];

  //  Value null/undefined
  if (value == null) {
    console.warn(`❌[CECO] FAILED → Value is null/undefined → Org: ${org}, Phase: ${phase}`);
    return 0;
  }

  console.log("[CECO] SUCCESS → Returning value →", value);

  return value;
}
