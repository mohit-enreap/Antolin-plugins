import { getHccBccDynamicOutput } from "../../../../shared/hccBccDynamicStore";

// we are uisng this . If cost center not macthed then apply zeroas defualt
export const COST_RATE_BY_ORG1 = {
  // fallback
  DEFAULT: 0,
};

// data coming from fill cost sheet is "phase_0" ,"phase_1" ,"phase_2" & "phase_34"
// we are mapping to "Phase 0" ,"Phase 1" ,"Phase 2" ,"Phase 3-4"
// because data present in HCC and BCC table in this way
export const PHASE_KEY_MAP = {
  phase_0: "Phase 0",
  phase_1: "Phase 1",
  phase_2: "Phase 2",
  phase_3_4: "Phase 3-4",
};
export const HCC_BCC_DISTRIBUTIONS = [
  "BCC 100%",
  "HCC 10% BCC 90%",
  "HCC 20% BCC 80%",
  "HCC 30% BCC 70%",
  "HCC 40% BCC 60%",
  "HCC 50% BCC 50%",
  "HCC 60% BCC 40%",
  "HCC 70% BCC 30%",
  "HCC 80% BCC 20%",
  "HCC 90% BCC 10%",
  "HCC 100%",
];

// working code2
///Get Final rate --> (hours * rate)
export function calculateCost1(
  hours,
  org,
  phase,
  CECO_COST_SHEET_YearANDPhases,
) {
  if (!hours) return 0;

  let rate = 0;
  // 🔴 If org is HCC/BCC distribution → get rate from shared store
  if (checkOrgDistribution(org)) {
    const table = getHccBccDynamicOutput();

    // alert(JSON.stringify(table))  // To check data coming properly in shared HCCBCC data js

    // find matching distribution row
    const row = table.find((item) => item.distribution === org);

    // get phase value safely
    rate = row?.["Phase 0"] ?? 0;

    // convert phase key → display phase
    const mappedPhase = PHASE_KEY_MAP[phase];

    // get rate safely
    rate = row?.[mappedPhase] ?? 0;

    // alert(org + " ::: rate are ==> for "+phase  + "==>"  + rate);
  } else {
    // normal CECO lookup
    rate = getCostRateByOrgNewPayload(
      org,
      phase,
      CECO_COST_SHEET_YearANDPhases,
    );
  }

  return +(hours * rate).toFixed(2);
}

// working code3
//To get Cost for Specific "Cost center"
export function getCostRateByOrgNewPayload(
  org,
  phase,
  CECO_COST_SHEET_YearANDPhases,
) {
  console.log("[CECO] Function called →", { org, phase });

  //  when org not found or data is not found
  if (!org) {
    console.warn("[CECO] FAILED → Org is missing❌");
    return 0;
  }

  if (!CECO_COST_SHEET_YearANDPhases?.data) {
    console.warn(
      "[CECO] FAILED → CECO_COST_SHEET_YearANDPhases.data is missing❌",
    );
    return 0;
  }

  console.log(
    "[CECO] Total records available →",
    CECO_COST_SHEET_YearANDPhases.data.length,
  );

  // Normalize org for safe comparison
  const normalize = (str) => str?.replace(/\s+/g, "").toLowerCase();

  const normalizedOrg = normalize(org);
  console.log("[CECO] Normalized org →", normalizedOrg);

  const orgConfig = CECO_COST_SHEET_YearANDPhases.data.find(
    (item) => normalize(item.society) === normalizedOrg,
  );

  //  Org not found
  if (!orgConfig) {
    console.warn("❌[CECO] FAILED → Org not found in CECO sheet →", org);
    return 0;
  }

  console.log("[CECO] Org found →", orgConfig);

  //  Phase missing
  if (!(phase in orgConfig)) {
    console.warn(
      `❌[CECO] FAILED → Phase "${phase}" not available for org →`,
      org,
    );
    return 0;
  }

  const value = orgConfig[phase];

  //  Value null/undefined
  if (value == null) {
    console.warn(
      `❌[CECO] FAILED → Value is null/undefined → Org: ${org}, Phase: ${phase}`,
    );
    return 0;
  }

  console.log("[CECO] SUCCESS → Returning value →", value);

  return value;
}

//Helper:

//To check org is hccBCC related?
function checkOrgDistribution(org) {
  if (HCC_BCC_DISTRIBUTIONS.includes(org)) {
    //  alert(org + "=YES=>Selected organization belongs to HCC/BCC distribution.");
    return true; //
  } else {
    //  alert(org + "=NO=>Selected organization NOT belongs to HCC/BCC distribution.");
    return false;
  }
}
