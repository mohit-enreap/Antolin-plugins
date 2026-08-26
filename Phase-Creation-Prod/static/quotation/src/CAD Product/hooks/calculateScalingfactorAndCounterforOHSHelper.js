//==========================================================
// ==============================
// MAIN FUNCTION
// ==============================
export function calculateScalingfactorAndCounterforOHSHelper(
  finalJSON,
  groupedIncomingData = {},
) {
  // alert("groupedIncomingData" + JSON.stringify(groupedIncomingData))

  const incomingData = flattenGroupedActivities(groupedIncomingData);

  // Optional safety check
  if (!incomingData || Object.keys(incomingData).length === 0) {
    return {
      counter: 0,
      activityFactors: [],
    };
  }

  const productMap = buildSelectedProductMap(finalJSON.activities);

  // counter is found
  const counter = calculateShortcutResult(productMap);

  //  Build  factor all mentioned activities ONLY from incomingData
  /* eg:
  const incomingData =
  {
    "Pillar matching (fakes)": 1,
    "Wing bending": 1
  }
  */
  const activities = Object.keys(incomingData).map((name) => ({
    name,
    value: incomingData[name],
  }));

  const activityFactors = calculateActivityFactors(activities, counter);

  // returning final counter  , ActivityFactor for all mentioned activities
  return {
    counter,
    activityFactors,
  };
}

// ==============================
// BUILD SELECTED PRODUCT MAP
// ==============================
function buildSelectedProductMap(activities = {}) {
  const result = {};

  Object.values(activities).forEach((activity) => {
    Object.entries(activity).forEach(([productName, product]) => {
      if (typeof product !== "object") return;

      if (product.componentSelected) {
        result[productName] = product.noOfComponent || 0;
      }
    });
  });

  return result;
}

// ==============================
// CALCULATE SHORTCUT COUNTER
// ==============================
function calculateShortcutResult(productMap = {}) {
  let total = 0;

  for (const key in productMap) {
    // Ignore ADD ON COMPONENTS
    if (key.includes("ADD ON COMPONENTS")) {
      continue;
    }

    const value = productMap[key];

    const multiplier = key.split("+").length;

    total += value * multiplier;
  }

  return total;
}

// ==============================
// CALCULATE ACTIVITY FACTORS
// ==============================
function calculateActivityFactors(activities = [], counter = 0) {
  return activities.map((activity) => {
    const value = activity.value;

    return {
      name: activity.name,
      value,
      factor: counter ? value / counter : 0,
    };
  });
}

// ==============================
// Tranfor group activity into single list of activity
// ==============================
const flattenGroupedActivities = (groupedData) => {
  const flatData = {};

  Object.values(groupedData).forEach((section) => {
    Object.entries(section).forEach(([key, value]) => {
      flatData[key] = value;
    });
  });

  return flatData;
};

// ==============================
// CALL from Activity hook will be in this way , it return respective result
// ==============================

// // Example incoming data (ONLY source of truth)
// const incomingData = {
//   "Markings": 50,
//   "Wing bending": 10
// };

// // Call function
// const result = calculateScalingfactorAndCounterforOHSHelper(
//   finalJSON,
//   incomingData
// );

// console.log(result);
