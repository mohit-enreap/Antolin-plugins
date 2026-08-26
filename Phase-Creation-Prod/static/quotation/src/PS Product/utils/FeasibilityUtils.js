// FeasibilityUtils.js

import { FEASIBILITY_CONSTANT } from "../data/feasibilityPercentage/feasibilityPercentage";

/**
 * getFeasibilityPercentage
 * ------------------------
 * Returns the feasibility percentage for a given phase and STA.
 *
 * @param {string} phase - The phase name: "Phase0", "Phase1", "Phase2", "Phase3_4"
 * @param {string} sta - "YES" or "NO"
 * @returns {number} - The feasibility percentage
 */
export function getFeasibilityPercentage(phase, sta) {
  // Validate STA input
  const staKey = sta.toUpperCase();
  if (!FEASIBILITY_CONSTANT[staKey]) {
    console.warn(`Invalid STA: ${sta}. Defaulting to NO.`);
    return 0.0;
  }

  // Validate Phase input
  if (!FEASIBILITY_CONSTANT[staKey][phase]) {
    console.warn(`Invalid Phase: ${phase}. Returning 0.`);
    return 0.0;
  }

  return FEASIBILITY_CONSTANT[staKey][phase];
}

/*
example how to call this method

import { getFeasibilityPercentage } from "./FeasibilityUtils";

const phase2Percent = getFeasibilityPercentage("Phase2", "YES");
console.log(phase2Percent); // Output: 7.0

const phase1No = getFeasibilityPercentage("Phase1", "NO");
console.log(phase1No); // Output: 0.0

*/
