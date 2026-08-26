// utils/activityJsonUtils.js

/**
 * Apply global TDL / DE rules on activities
 * @param {Object} activities - calculated activities
 * @param {Object} global - { TDL, DE }
 * @returns {Object} modified activities
 */
export const applyGlobalRules = (activities, global) => {
  return Object.fromEntries(
    Object.entries(activities).map(([key, activity]) => [
      key,
      {
        ...activity,
        TDL: global.TDL === 1 ? activity.TDL : 0,
        DE: global.DE === 1 ? activity.DE : 0,
      },
    ])
  );
};

/**
 * Build TEMP JSON (no mutation)
 */
export const buildTempJson = (data, global) => ({
  Global: global,
  ...data,
});

/**
 * Build FINAL JSON (mutated via rules)
 */
export const buildFinalJson = (data, activities, global) => ({
  Global: global,
  ...data,
  CAE: {
    ...data.CAE,
    activities: applyGlobalRules(activities, global),
  },
});
