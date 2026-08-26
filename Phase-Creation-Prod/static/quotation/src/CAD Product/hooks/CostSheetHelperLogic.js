// hooks/CostSheetHelperLogic.js
export function CostSheetHelperLogic() {
  //=============LOGIC 1 Start=========================

  //1 : To get Percentage based on the phases dates . Replicate logic Similar to CECO-COST Top Table Above Cost Details . on TOP Left Table  we have input(Dates) Which i am considering as input and TOP Right table is creating dyanamic Percentage for each Years. Which we have to use for Repective "COST CENTER" ,

  // This Percentage and (phase & years Wise) cost will be Applied to respective "COST CENTER"

  // This Final cost will be Multipler for Hours

  /* ---------------------------
     PUBLIC: CalculatePercentagePhaseWiseForDuration
  ---------------------------- */
  function CalculatePercentagePhaseWiseForDuration(phaseDatesinput) {
    /*Input example require is  So setting same Payload from Method buildPhaseDateMap(phaseDates)
            phaseDates: {
                phase0: "2025-01-09",
                phase1: "2027-12-10",
                phase2: "2029-04-21",
                phase3_4: "2030-08-18",
                end: "2032-05-16"
            }
    */

    // Needs to be updated every year whenever the COSTS change in the CECO-COST sheet as per the years
    const years = [2026, 2027, 2028, 2029, 2030];
    const phaseDates = buildPhaseDateMapHelperFunction(phaseDatesinput); // which help to create Input

    // ---------------------------
    // 1️⃣ Calculate first
    // ---------------------------
    const phase0Result = calculateYearDistribution(
      phaseDates.phase0,
      phaseDates.phase1,
      years,
    );

    const phase1Result = calculateYearDistribution(
      phaseDates.phase1,
      phaseDates.phase2,
      years,
    );

    const phase2Result = calculateYearDistribution(
      phaseDates.phase2,
      phaseDates.phase3_4,
      years,
    );

    const phase3_4Result = calculateYearDistribution(
      phaseDates.phase3_4,
      phaseDates.end,
      years,
    );

    //  alert("distribution :: phase0 "+ JSON.stringify(phase0Result)+ "  |||phase1 "+
    //   JSON.stringify(phase1Result)
    // + "  ||| phase2"+
    //   JSON.stringify(phase2Result)
    // + "  ||| phase34"+
    //   JSON.stringify(phase3_4Result) )
    // // ---------------------------
    // 2️⃣ Then return structured output
    // ---------------------------
    return [
      {
        phase: "Phase 0",
        distribution: phase0Result,
      },
      {
        phase: "Phase 1",
        distribution: phase1Result,
      },
      {
        phase: "Phase 2",
        distribution: phase2Result,
      },
      {
        phase: "Phase 3-4",
        distribution: phase3_4Result,
      },
    ];

    /* it will generate output like this: example
    [
  {
    phase: "Phase 0",
    distribution: {
      2025: 33.5,
      2026: 34.2,
      2027: 32.3,
      2028: 0,
      ...
    }
  }
      {
    phase: "Phase 1",
    distribution: {
      2025: 33.5,
      2026: 34.2,
      2027: 32.3,
      2028: 0,
      ...
    }
  }
      {
    phase: "Phase 2",
    distribution: {
      2025: 33.5,
      2026: 34.2,
      2027: 32.3,
      2028: 0,
      ...
    }
  }
      {
    phase: "Phase 3-4",
    distribution: {
      2025: 33.5,
      2026: 34.2,
      2027: 32.3,
      2028: 0,
      ...
    }
  }
]


    */
  }

  function buildPhaseDateMapHelperFunction(phaseDates) {
    return {
      phase0: phaseDates.phase_0.start,
      phase1: phaseDates.phase_1.start,
      phase2: phaseDates.phase_2.start,
      phase3_4: phaseDates.phase_3_4.start,
      end: phaseDates.phase_3_4.end,
    };
  }

  /* ---------------------------
     INTERNAL: calculate overlap % For each years and for each phase (CECO-Cost) Sheet Top Table 
  ---------------------------- */
  // some issue .1 to .3 gap coming not 100% always
  function calculateYearDistribution1(startDate, endDate, years) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const distribution = {};

    years.forEach((year) => {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);

      if (start > yearEnd || end < yearStart) {
        distribution[year] = 0;
        return;
      }

      const overlapStart = start > yearStart ? start : yearStart;
      const overlapEnd = end < yearEnd ? end : yearEnd;

      const overlapDays =
        Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;

      distribution[year] = +((overlapDays / totalDays) * 100).toFixed(1);
    });

    return distribution;
  }

  // issue from 0.1% to 0.3% gap coming not 100% always
  function calculateYearDistributionOLD(startDate, endDate, years) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor((end - start) / MS_PER_DAY) + 1;

    const rawValues = {};
    const distribution = {};

    let totalRounded = 0;
    let lastValidYear = null;

    // Step 1: calculate raw percentages
    years.forEach((year) => {
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);

      if (start > yearEnd || end < yearStart) {
        rawValues[year] = 0;
        return;
      }

      const overlapStart = start > yearStart ? start : yearStart;
      const overlapEnd = end < yearEnd ? end : yearEnd;

      const overlapDays =
        Math.floor((overlapEnd - overlapStart) / MS_PER_DAY) + 1;

      const percent = (overlapDays / totalDays) * 100;
      rawValues[year] = percent;
      lastValidYear = year;
    });

    // Step 2: round & accumulate
    years.forEach((year) => {
      if (year !== lastValidYear) {
        const rounded = +rawValues[year].toFixed(1);
        distribution[year] = rounded;
        totalRounded += rounded;
      }
    });

    // Step 3: force total = 100 on last year
    if (lastValidYear !== null) {
      distribution[lastValidYear] = +(100 - totalRounded).toFixed(1);
    }

    return distribution;
  }

  // issue resolved
  function calculateYearDistribution(startDate, endDate, years) {
    /**
     * Converts date into pure local date
     * without timezone/time values.
     */
    function normalize(date) {
      const d = new Date(date);

      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    // Normalize input dates
    const start = normalize(startDate);
    const end = normalize(endDate);

    // Milliseconds in one day
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    /**
     * ------------------------------------------------
     * TOTAL DAYS
     * ------------------------------------------------
     *
     * Excel uses:
     *
     * (end - start)
     *
     * WITHOUT +1
     *
     * So this is EXCLUSIVE duration.
     *
     * Example:
     *
     * 2027-03-21 - 2026-12-12
     *
     * = 99 days
     */
    const totalDays = (end - start) / MS_PER_DAY;

    // Final result object
    const distribution = {};

    // Loop through each requested year
    years.forEach((year) => {
      const currentYear = Number(year);

      /**
       * Start of current year
       *
       * Example:
       * 2026-01-01
       */
      const yearStart = new Date(currentYear, 0, 1);

      /**
       * End of current year
       *
       * Example:
       * 2026-12-31
       */
      const yearEnd = new Date(currentYear, 11, 31);

      // Stores calculated percentage
      let percent = 0;

      /**
       * =================================================
       * CASE 1
       * NO OVERLAP
       * =================================================
       *
       * Example:
       *
       * Range:
       * 2026 → 2027
       *
       * Current year:
       * 2028
       *
       * Result:
       * 0%
       */
      if (
        start.getFullYear() > currentYear ||
        end.getFullYear() < currentYear
      ) {
        percent = 0;
      } else if (

      /**
       * =================================================
       * CASE 2
       * ENTIRE RANGE INSIDE SAME YEAR
       * =================================================
       *
       * Example:
       *
       * Start : 2026-05-01
       * End   : 2026-06-01
       *
       * Current year:
       * 2026
       *
       * Result:
       * 100%
       */
        start.getFullYear() === currentYear &&
        end.getFullYear() === currentYear
      ) {
        percent = 100;
      } else if (

      /**
       * =================================================
       * CASE 3
       * END YEAR
       * =================================================
       *
       * Example:
       *
       * Start : 2026-12-12
       * End   : 2027-03-21
       *
       * Current year:
       * 2027
       *
       * Excel Formula:
       *
       * ((end + 1) - Jan1)
       * /
       * (end - start)
       *
       * Meaning:
       *
       * Count from:
       * Jan1 → end date
       *
       * INCLUDING end date
       */
        start.getFullYear() < currentYear &&
        end.getFullYear() === currentYear
      ) {
        const overlapDays =
          (end.getTime() + MS_PER_DAY - yearStart.getTime()) / MS_PER_DAY;

        percent = (overlapDays / totalDays) * 100;
      } else if (

      /**
       * =================================================
       * CASE 4
       * START YEAR
       * =================================================
       *
       * Example:
       *
       * Start : 2026-12-12
       * End   : 2027-03-21
       *
       * Current year:
       * 2026
       *
       * Excel Formula:
       *
       * (Dec31 - start)
       * /
       * (end - start)
       *
       * Meaning:
       *
       * Count from:
       * start date → Dec31
       *
       * EXCLUDING Dec31
       */
        start.getFullYear() === currentYear &&
        end.getFullYear() > currentYear
      ) {
        const overlapDays = (yearEnd.getTime() - start.getTime()) / MS_PER_DAY;

        percent = (overlapDays / totalDays) * 100;
      } else {

      /**
       * =================================================
       * CASE 5
       * FULL MIDDLE YEAR
       * =================================================
       *
       * Example:
       *
       * Start : 2025
       * End   : 2027
       *
       * Current year:
       * 2026
       *
       * Excel Formula:
       *
       * (Dec31 - Jan1)
       * /
       * (end - start)
       */
        const overlapDays =
          (yearEnd.getTime() - yearStart.getTime()) / MS_PER_DAY;

        percent = (overlapDays / totalDays) * 100;
      }

      /**
       * Store rounded percentage
       *
       * Rounded to 2 decimal places
       */
      // distribution[currentYear] = Number(percent.toFixed(4)); // This also works
      // distribution[currentYear] = percent.toFixed(1);
      distribution[currentYear] = percent
    });

    return distribution;
  }

  //=============LOGIC 1 End =========================

  //==============  //Logic 3 Start==============================
  //Logic 3  : we have to collect data for Specific Cost center
  /*
            For each Cost Center
            → For each Phase
                → Apply % to its OWN cost
                    → Add result to that year
   */

  // const resultCostCenterYearWiseDetails = calculateCostCenterYearWiseDetails(
  //   phaseWisePercentages={},
  //   costCentersData
  // );

  // console.log(resultCostCenterYearWiseDetails);

  //Input Array with list for Cost center and there phase details:
  /*
        const costCentersData = {
        "G.A.Pune (IF)": {
            Offer: 100,
            Proto: 200,
            Serie: 300,
            Indust: 50
        },
        "G. A. Deutschland": {
            Offer: 150,
            Proto: 250,
            Serie: 350,
            Indust: 75
        }
        };
  */

  /**
   * Calculates year-wise cost values for ALL cost centers
   * using phase-wise percentages
   */
  function calculateCostCenterYearWiseDetails(
    phaseWisePercentages,
    costCentersData,
  ) {
    //   alert("==========111==============")
    const finalResult = {};

    // Loop through each cost center
    for (const costCenterName in costCentersData) {
      const phaseCosts = costCentersData[costCenterName];
      // alert("==========22 ==============")
      // Reuse your existing logic per cost center
      const yearWiseResult = applyPhasePercentagesPerYear(
        phaseWisePercentages,
        phaseCosts,
      );

      finalResult[costCenterName] = yearWiseResult;
    }

    // alert("calculateCostCenterYearWiseDetails  :: "+ JSON.stringify(finalResult))

    return finalResult;

    /*output : for all Cost Center :
            {
        "G.A. Pune (IF)": {
            2025: 30,
            2026: 170,
            2027: 300,
            2028: 50
        },
      "G.A. Pune (IL)": {
            2025: 45,
            2026: 255,
            2027: 350,
            2028: 75
        }
        }
    */
  }

  function applyPhasePercentagesPerYear(
    phaseWisePercentages = {},
    costCenterFinalTotalAllocationPhasewise,
  ) {
    // Final output object
    // Example: { 2025: 120, 2026: 450 }
    const yearTotals = {};

    // Loop through each phase (Phase 0, Phase 1, Phase 2, Phase 3-4)
    for (let i = 0; i < phaseWisePercentages?.length; i++) {
      const phaseItem = phaseWisePercentages[i];

      const phaseName = phaseItem.phase; // e.g. "Phase 0"
      const yearDistribution = phaseItem.distribution; // { 2025: 50, 2026: 50 }

      let phaseCost = 0;

      // Decide which cost value belongs to this phase
      if (phaseName === "Phase 0") {
        phaseCost = costCenterFinalTotalAllocationPhasewise.Offer;
      } else if (phaseName === "Phase 1") {
        phaseCost = costCenterFinalTotalAllocationPhasewise.Proto;
      } else if (phaseName === "Phase 2") {
        phaseCost = costCenterFinalTotalAllocationPhasewise.Serie;
      } else if (phaseName === "Phase 3-4") {
        phaseCost = costCenterFinalTotalAllocationPhasewise.Indust;
      }

      // Loop through each year inside this phase
      for (const year in yearDistribution) {
        const percentage = yearDistribution[year]; // e.g. 50

        // If year is not present yet, initialize it
        if (!yearTotals[year]) {
          yearTotals[year] = 0;
        }

        // Apply percentage to the phase cost
        const calculatedValue = phaseCost * (percentage / 100);

        // Add value to that year
        yearTotals[year] =
          yearTotals[year] + Number(calculatedValue.toFixed(2));
      }
    }

    //  alert("Years :: "+ JSON.stringify(yearTotals) )

    // Return final year-wise result
    return yearTotals;

    /* Output :
    {
  2025: 100,
  2026: 500,
  2027: 50
}
    */
  }

  //==============  //Logic 3 end ==============================

  //==============  //Logic4 Start ==============================
  function calculateHoursAndCosts(hoursInput, costSheet) {
    // This object will store final result for ALL cost centers
    const result = {};

    /**
     * ------------------------------------------------------------
     * STEP 1: Loop through each Cost Center
     * ------------------------------------------------------------
     * Object.entries converts:
     * {
     *   "G.A.Pune (IF)": { 2025: 30, 2026: 170 }
     * }
     *
     * into:
     * [
     *   ["G.A.Pune (IF)", { 2025: 30, 2026: 170 }]
     * ]
     */
    Object.entries(hoursInput).forEach(([costCenter, yearHours]) => {
      /**
       * ----------------------------------------------------------
       * STEP 2: Find matching COST RATE row for this Cost Center
       * ----------------------------------------------------------
       * We match using "society" name
       */
      const rateRow = costSheet.data.find((row) => row.society === costCenter);

      /**
       * If rate is not found → skip this cost center safely
       * (prevents runtime crashes)
       */
      if (!rateRow) return;

      // Will accumulate total hours for this cost center
      let totalHours = 0;

      // Will accumulate total cost for this cost center
      let totalCost = 0;

      // Stores year-wise breakdown
      const yearlyData = {};

      /**
       * ----------------------------------------------------------
       * STEP 3: Loop through each Year inside this Cost Center
       * ----------------------------------------------------------
       * Example:
       * year = "2026"
       * hours = 170
       */
      Object.entries(yearHours).forEach(([year, hours]) => {
        /**
         * Get hourly rate for this year
         * If rate not found → default to 0
         */
        const rate = rateRow[year] || 0;

        /**
         * Core Formula (Excel Equivalent):
         * COST = HOURS × RATE
         */
        const cost = +(hours * rate)  //.toFixed(2);

        /**
         * Save year-wise result
         * This directly maps to UI table columns
         */
        yearlyData[year] = {
          hours: hours,
          cost: cost,
        };

        // Accumulate totals
        totalHours += hours;
        totalCost += cost;
      });

      /**
       * ----------------------------------------------------------
       * STEP 4: Final structure for this Cost Center
       * ----------------------------------------------------------
       */
      result[costCenter] = {
        ceco: rateRow.ceco, // Cost Element Code
        yearly: yearlyData, // Year-wise HOURS & COSTS
        totalHours: totalHours, // Sum of all years hours
        totalCost: +totalCost  //.toFixed(2), // Sum of all years cost
      };
    });

    /**
     * ------------------------------------------------------------
     * STEP 5: Return final aggregated result
     * ------------------------------------------------------------
     */
    return result;
  }
  //==============  //Logic 4 end ==============================

  //Logic 5 :  Apply Logic 3 output   * to calculate Cost (from " CECO_COST_SHEET")

  //===START :  to to calculate phase % Left table in "CECO-Cost" Sheet====
  //==============  //Start ==============================
  /**
   * ------------------------------------------------------------
   * LOGIC 2:
   * Apply Phase-wise Year % on CECO cost sheet
   * ------------------------------------------------------------
   * Input:
   *  - phaseWisePercentages (Phase → Year %)
   *  - CECO_COST_SHEET (year-wise rates)
   *
   * Output:
   *  - CECO_COST_SHEET with populated:
   *    phase_0, phase_1, phase_2, phase_3_4
   * ------------------------------------------------------------
   */
  function populatePhaseCosts(costSheet, phaseWisePercentages = {}) {
    if (phaseWisePercentages == null) return;

    const years = [2025, 2026, 2027, 2028, 2029];

    // Convert array → map for easy lookup
    const phasePercentMap = {};
    phaseWisePercentages.forEach((item) => {
      phasePercentMap[item.phase] = item.distribution;
    });

    // Loop each CECO row
    const updatedData = costSheet.data.map((row) => {
      const phaseResult = {
        phase_0: 0,
        phase_1: 0,
        phase_2: 0,
        phase_3_4: 0,
      };

      // Loop each Phase
      Object.entries(phasePercentMap).forEach(([phaseName, distribution]) => {
        let total = 0;

        // Loop each year
        years.forEach((year) => {
          const rate = row[year] || 0;
          const percent = distribution[year] || 0;

          total += (rate * percent) / 100;
        });

        // Map phase name → field
        // if (phaseName === "Phase 0") phaseResult.phase_0 = +total.toFixed(2);
        // else if (phaseName === "Phase 1")
        //   phaseResult.phase_1 = +total.toFixed(2);
        // else if (phaseName === "Phase 2")
        //   phaseResult.phase_2 = +total.toFixed(2);
        // else if (phaseName === "Phase 3-4")
        //   phaseResult.phase_3_4 = +total.toFixed(2);

        // No fixed decimal places for accurate cost calculation
        if (phaseName === "Phase 0") phaseResult.phase_0 = total;
        else if (phaseName === "Phase 1") phaseResult.phase_1 = total;
        else if (phaseName === "Phase 2") phaseResult.phase_2 = total;
        else if (phaseName === "Phase 3-4") phaseResult.phase_3_4 = total;
      });

      // Merge result into row
      return {
        ...row,
        ...phaseResult,
      };
    });

    return {
      ...costSheet,
      data: updatedData,
    };
  }
  //==============  // End ==============================
  //===End :  to to calculate phase % Left table in "CECO-Cost" Sheet====

  //=============

  // Logic to get the HCC BCC for Totak Cost Sheet :

  function calculateHccBccPhaseMix(resultHCC_BCC, phaseWisePercentages) {
    // ---------------------------
    // Extract HCC & BCC objects
    // ---------------------------
    let HCC = null;
    let BCC = null;

    Object.values(resultHCC_BCC).forEach((society) => {
      if (society.HCC) HCC = society.HCC;
      if (society.BCC) BCC = society.BCC;
    });

    if (!HCC || !BCC) {
      //throw new Error("HCC or BCC data missing in resultHCC_BCC");
      return;
    }

    // ---------------------------
    // Step-1: Calculate pure phase values
    // ---------------------------
    const phaseValues = {};

    phaseWisePercentages?.forEach(({ phase, distribution }) => {
      let hccVal = 0;
      let bccVal = 0;

      Object.entries(distribution).forEach(([year, pct]) => {
        const percent = pct / 100;

        if (HCC[year] !== undefined) hccVal += HCC[year] * percent;
        if (BCC[year] !== undefined) bccVal += BCC[year] * percent;
      });

      phaseValues[phase] = {
        // HCC: Number(hccVal.toFixed(2)),
        // BCC: Number(bccVal.toFixed(2)),
        HCC: Number(hccVal),
        BCC: Number(bccVal),
      };
    });

    // ---------------------------
    // Step-2: Generate mix (0→100)
    // ---------------------------
    const results = [];

    for (let h = 0; h <= 100; h += 10) {
      const b = 100 - h;

      const row = {
        distribution:
          h === 100
            ? "HCC 100%"
            : b === 100
              ? "BCC 100%"
              : `HCC ${h}% BCC ${b}%`,
        HCC_percent: h,
        BCC_percent: b,
      };

      Object.entries(phaseValues).forEach(([phase, vals]) => {
        const mixed = vals.HCC * (h / 100) + vals.BCC * (b / 100);

        // row[phase] = Number(mixed.toFixed(2));
        row[phase] = Number(mixed);
      });

      results.push(row);
    }

    return {
      purePhaseValues: phaseValues,
      mixedDistributionTable: results,
    };
  }

  return {
    CalculatePercentagePhaseWiseForDuration,
    calculateCostCenterYearWiseDetails,
    //Appying Phase % for Each Phase and getting its Distribution amoung years
    calculateHoursAndCosts, // Final Hours * Cost
    populatePhaseCosts,

    calculateHccBccPhaseMix,
  };
}

/*

Input require for populatePhaseCosts(costSheet, phaseWisePercentages)

INPUT 1: Phase-wise Percentages
const phaseWisePercentages = [
  {
    phase: "Phase 0",
    distribution: {
      2025: 100.0,
      2026: 0.0,
      2027: 0.0,
      2028: 0.0,
      2029: 0.0
    }
  },
  {
    phase: "Phase 1",
    distribution: {
      2025: 54.5,
      2026: 45.5,
      2027: 0.0,
      2028: 0.0,
      2029: 0.0
    }
  },
  {
    phase: "Phase 2",
    distribution: {
      2025: 0.0,
      2026: 30.7,
      2027: 61.1,
      2028: 8.3,
      2029: 0.0
    }
  },
  {
    phase: "Phase 3-4",
    distribution: {
      2025: 0.0,
      2026: 0.0,
      2027: 0.0,
      2028: 65.8,
      2029: 34.2
    }
  }
];


INPUT 2: CECO Cost Sheet

const CECO_COST_SHEET = {
  data: [
    {
      society: "Antolin China Investment",
      ceco: "ACIIF",
      type: "HCC",
      2025: 47.47,
      2026: 47.94,
      2027: 48.68,
      2028: 49.56,
      2029: 50.46,
      phase_0: 0,
      phase_1: 0,
      phase_2: 0,
      phase_3_4: 0
    }
  ]
};



ouput :
{
  society: "Antolin China Investment",
  ceco: "ACIIF",
  type: "HCC",

  2025: 47.47,
  2026: 47.94,
  2027: 48.68,
  2028: 49.56,
  2029: 50.46,

  phase_0: 47.47,
  phase_1: 47.68,
  phase_2: 48.58,
  phase_3_4: 49.88
}


*/
