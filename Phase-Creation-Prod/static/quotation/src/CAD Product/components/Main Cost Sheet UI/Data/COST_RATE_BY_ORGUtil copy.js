// From excel we have to Take mapping details of Cost center

export const COST_RATE_BY_ORG = {
  "G. A. Deutschland": 2,
  "G.A.Pune (IF)": 3,
  "G.A.Hyderabad": 4,
  INTERTRIM: 5,
  "BCC 100%": 6,

  // fallback
  DEFAULT: 100,
};
export function getCostRateByOrg(org) {
  if (!org) return COST_RATE_BY_ORG.DEFAULT;
  return COST_RATE_BY_ORG[org] ?? COST_RATE_BY_ORG.DEFAULT;
}

export function calculateCost(hours, org) {
  const rate = getCostRateByOrg(org);
  return +(hours * rate).toFixed(2);
}
