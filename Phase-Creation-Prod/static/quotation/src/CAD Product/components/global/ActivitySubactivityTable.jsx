import { useMemo, useState, useEffect } from "react";
import Global2DActivities from "./Global2DActivities";

/* =========================================================
   Constants
========================================================= */
const IGNORE_KEYS = [
  "extraWorkLoop",
  "reWorkLoop",
  "standardLoop",
  "checked",
  "order",
  "noOfLoops",
  "Proto",
  "Serie",
];

const SYNC_PROTO_SERIE_ACTIVITIES = ["2D DELIVERABLES", "DATA MANAGEMENT"];

//For Read only proto Series : Future use
const READ_ONLY_ACTIVITY_PREFIXES = ["2D DELIVERABLES"];

/* =========================================================
   Utility: Normalize data
========================================================= */
/* =========================================================
========================================================= */
const buildActivities1 = (data) => {
  const activitiesList = [];

  // Loop through each activity in the JSON
  for (const [activityName, activity] of Object.entries(
    data?.activities || {}
  )) {
    const subActivitiesMap = {}; // store unique subactivities

    // Loop through each product inside the activity
    for (const [productName, product] of Object.entries(activity)) {
      // Skip keys that are not products
      if (IGNORE_KEYS.includes(productName)) continue;

      // Skip if product doesn't have subactivities
      if (!product?.subactivity) continue;

      // Loop through subactivities of the product
      for (const [subName, sub] of Object.entries(product.subactivity)) {
        // Add subactivity only if not already added
        if (!subActivitiesMap[subName]) {
          subActivitiesMap[subName] = {
            name: subName,
            hours: Number(sub.TDL || 0),
            Proto: Number(sub.Proto || 0),
            Serie: Number(sub.Serie || 0),
          };
        }
      }
    }

    // Calculate total hours for this activity
    let totalHours = 0;
    for (const sub of Object.values(subActivitiesMap)) {
      totalHours += sub.hours;
    }

    // Add this activity to the final list
    activitiesList.push({
      name: activityName,
      checked: activity.checked,
      hours: totalHours.toFixed(2),
      subactivities: Object.values(subActivitiesMap),
    });
  }

  return activitiesList;
};

const buildActivities = (data) => {
  const activitiesList = [];

  for (const [activityName, activity] of Object.entries(
    data?.activities || {}
  )) {
    const subActivitiesMap = {};
    let hasSubActivities = false;
    let productProto = 0;
    let productSerie = 0;

    for (const [productName, product] of Object.entries(activity)) {
      if (IGNORE_KEYS.includes(productName)) continue;

      // CASE 1: Real subactivities exist
      if (product.subactivity && Object.keys(product.subactivity).length > 0) {
        hasSubActivities = true;

        for (const [subName, sub] of Object.entries(product.subactivity)) {
          if (!subActivitiesMap[subName]) {
            subActivitiesMap[subName] = {
              name: subName,
              hours: Number(sub.TDL || 0),
              Proto: Number(sub.Proto || 0),
              Serie: Number(sub.Serie || 0),
              type: "SUB",
            };
          }
        }
      } else {
        // CASE 2: No subactivities → take product Proto/Serie
        productProto = Number(product.Proto || 0);
        productSerie = Number(product.Serie || 0);
      }
    }

    // 👉 If NO subactivities → create ONE product-level row
    if (!hasSubActivities) {
      subActivitiesMap["_PRODUCT_"] = {
        name: "Product Proto / Serie",
        hours: 0,
        Proto: productProto,
        Serie: productSerie,
        type: "PRODUCT",
      };
    }

    // Calculate hours
    let totalHours = 0;
    Object.values(subActivitiesMap).forEach((s) => {
      totalHours += s.hours;
    });

    activitiesList.push({
      name: activityName,
      checked: activity.checked,
      hours: totalHours.toFixed(2),
      subactivities: Object.values(subActivitiesMap),
    });
  }

  return activitiesList;
};

const shouldSyncProtoSerie = (activityName) => {
  const name = activityName.toUpperCase().trim();

  return SYNC_PROTO_SERIE_ACTIVITIES.some((key) => name.startsWith(key));
};

/* =========================================================
   Component
========================================================= */
const ActivitySubactivityTable = ({ data, onChange }) => {
  /* -------------------------------
     Normalized data
  --------------------------------*/
  const activities = useMemo(() => buildActivities(data), [data]);

  /* -------------------------------
     State (Single source of truth)
  --------------------------------*/
  const [activitySelected, setActivitySelected] = useState({});
  const [subValues, setSubValues] = useState({});

  /* -------------------------------
     Initialize state from JSON
  --------------------------------*/
  useEffect(() => {
    const initialActivitySelected = {};
    const initialState = {};

    activities.forEach((activity) => {
      // ✅ store checked from JSON
      initialActivitySelected[activity.name] = activity.checked;

      initialState[activity.name] = {};
      activity.subactivities.forEach((sub) => {
        initialState[activity.name][sub.name] = {
          Proto: sub.Proto,
          Serie: sub.Serie,
        };
      });
    });

    setActivitySelected(initialActivitySelected);
    setSubValues(initialState);
  }, [activities]);

  //Read only for 2d Proto serie
  const isReadOnlyActivity = (activityName) => {
    const name = activityName.toUpperCase().trim();
    return READ_ONLY_ACTIVITY_PREFIXES.some((p) => name.startsWith(p));
  };

  /* -------------------------------
     Emit changes to parent
  --------------------------------*/
  const emitChange = (nextActivitySelected, nextSubValues) => {
    if (typeof onChange === "function") {
      onChange({
        activitySelected: nextActivitySelected,
        subValues: nextSubValues,
      });
    }
  };

  /* -------------------------------
     Handlers
  --------------------------------*/
  const toggleActivity = (activityName) => {
    setActivitySelected((prev) => {
      const next = {
        ...prev,
        [activityName]: !prev[activityName],
      };

      emitChange(next, subValues);
      return next;
    });
  };

  const updateSubValue1 = (activity, sub, field, value) => {
    setSubValues((prev) => {
      const next = {
        ...prev,
        [activity]: {
          ...prev[activity],
          [sub]: {
            ...prev[activity]?.[sub],
            [field]: Math.max(0, Number(value)),
          },
        },
      };

      emitChange(activitySelected, next);
      return next;
    });
  };

  const updateSubValue2 = (activity, subName, field, value) => {
    const numValue = Math.max(0, Number(value));

    setSubValues((prev) => {
      const next = {
        ...prev,
        [activity]: {
          ...prev[activity],
          [subName]: {
            ...prev[activity]?.[subName],
            [field]: numValue,
          },
        },
      };

      emitChange(activitySelected, next);
      return next;
    });

    // 👉 PRODUCT LEVEL → update ALL products internally
    const activityData = data.activities[activity];

    Object.entries(activityData).forEach(([key, product]) => {
      if (
        product &&
        typeof product === "object" &&
        !IGNORE_KEYS.includes(key)
      ) {
        product[field] = numValue;
      }
    });
  };

  const updateSubValue3 = (activity, subName, field, value) => {
    const numValue = Math.max(0, Number(value));
    const otherField = field === "Proto" ? "Serie" : "Proto";

    setSubValues((prev) => {
      const next = {
        ...prev,
        [activity]: {
          ...prev[activity],
          [subName]: {
            ...prev[activity]?.[subName],
            [field]: numValue,
            [otherField]: numValue, // 👈 keep both same
          },
        },
      };

      emitChange(activitySelected, next);
      return next;
    });

    // 👉 Update all products internally (single source)
    Object.entries(data.activities[activity]).forEach(([key, product]) => {
      if (
        product &&
        typeof product === "object" &&
        !IGNORE_KEYS.includes(key)
      ) {
        product.Proto = numValue;
        product.Serie = numValue;
      }
    });
  };

  const updateSubValue4 = (activity, subName, field, value) => {
    const numValue = Math.max(0, Number(value));
    const sync = shouldSyncProtoSerie(activity); // ✅ central decision

    setSubValues((prev) => {
      const prevSub = prev[activity]?.[subName] || {};

      const nextSub = {
        ...prevSub,
        [field]: numValue,
      };

      // ✅ Sync only for specific activities
      if (sync) {
        nextSub.Proto = numValue;
        nextSub.Serie = numValue;
      }

      const next = {
        ...prev,
        [activity]: {
          ...prev[activity],
          [subName]: nextSub,
        },
      };

      emitChange(activitySelected, next);
      return next;
    });

    // ✅ Update product-level values ONLY when sync is enabled
    if (sync) {
      Object.entries(data.activities[activity]).forEach(([key, product]) => {
        if (
          product &&
          typeof product === "object" &&
          !IGNORE_KEYS.includes(key)
        ) {
          product.Proto = numValue;
          product.Serie = numValue;
        }
      });
    }
  };

  const updateSubValue = (activity, subName, field, value) => {
    // ---------------------------------------------------
    // Step 1: Sanitize input
    // - Convert value to number
    // - Do not allow negative numbers
    // ---------------------------------------------------
    const numValue = Math.max(0, Number(value));

    // ---------------------------------------------------
    // Step 2: Decide if this activity requires
    // Proto & Serie to be synced
    // Example:
    //   2D DELIVERABLES → true
    //   DATA MANAGEMENT → true
    //   3D DELIVERABLES → false
    // ---------------------------------------------------
    const sync = shouldSyncProtoSerie(activity);

    /* ===================================================
     STEP 3: UPDATE REACT STATE (UI STATE)
     ---------------------------------------------------
     This updates what user sees on screen.
     React state is the first source of truth for UI.
  =================================================== */
    setSubValues((prev) => {
      // Get previous values of this subactivity / product row
      const prevSub = prev[activity]?.[subName] || {};

      // Create updated object
      const nextSub = {
        ...prevSub,
        [field]: numValue, // Update only the edited field
      };

      // ---------------------------------------------------
      // If activity requires sync (2D / DATA MANAGEMENT):
      // Proto and Serie must always have same value
      // ---------------------------------------------------
      if (sync) {
        nextSub.Proto = numValue;
        nextSub.Serie = numValue;
      }

      // Merge back into full state
      const next = {
        ...prev,
        [activity]: {
          ...prev[activity],
          [subName]: nextSub,
        },
      };

      // Notify parent component
      emitChange(activitySelected, next);

      return next;
    });

    /* ===================================================
     STEP 4: UPDATE ORIGINAL JSON DATA (SOURCE DATA)
     ---------------------------------------------------
     THIS IS THE MOST IMPORTANT FIX.
     
     Why needed?
     - Some activities do NOT have subactivities
     - For them, Proto/Serie lives at PRODUCT level
     - If we don’t update JSON, values "snap back"
       on next render → looks like input is stuck
  =================================================== */

    const activityData = data.activities[activity];

    Object.entries(activityData).forEach(([key, product]) => {
      // Skip non-product keys
      if (
        product &&
        typeof product === "object" &&
        !IGNORE_KEYS.includes(key)
      ) {
        // -------------------------------------------------
        // ALWAYS update the edited field (Proto OR Serie)
        // This fixes:
        // ❌ Non-2D activities without subactivities (i.e 3d activities without Sub-activities)
        // -------------------------------------------------
        product[field] = numValue;

        // -------------------------------------------------
        // ONLY sync when activity requires it
        // (2D / DATA MANAGEMENT)
        // -------------------------------------------------
        if (sync) {
          product.Proto = numValue;
          product.Serie = numValue;
        }
      }
    });
  };

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "14px" }}>
      <div>{/* existing table */}</div>

      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 120px 120px",
          fontWeight: "bold",
          padding: "10px",
          background: "#f2f3f5",
          borderBottom: "2px solid #ddd",
        }}
      >
        <div>Activity</div>
        <div>Proto</div>
        <div>Serie</div>
      </div>

      {/* Activities */}
      {activities.map((activity) => (
        <div key={activity.name}>
          {/* Activity Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 120px",
              padding: "10px",
              borderBottom: "1px solid #eee",
              background: "#fff",
            }}
          >
            <div>
              <div>
                {"===>"} {!!activitySelected[activity.name]}
              </div>
              <input
                type="checkbox"
                checked={!!activitySelected[activity.name]}
                onChange={() => toggleActivity(activity.name)}
              />
              <strong style={{ marginLeft: 8 }}>{activity.name}</strong>
              <span style={{ marginLeft: 10, color: "#666" }}>
                ({activity.hours} hrs)
              </span>
            </div>
            <div />
            <div />
          </div>
          {activity.subactivities.map((sub) => {
            const values = subValues?.[activity.name]?.[sub.name] || {};
            const isProduct = sub.type === "PRODUCT";

            return (
              <div
                key={sub.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 120px",
                  padding: isProduct
                    ? "10px 10px 10px 30px"
                    : "10px 10px 10px 50px",
                  borderBottom: "1px solid #f0f0f0",
                  opacity: activitySelected[activity.name] ? 1 : 0.4,
                  background: isProduct ? "#eef2ff" : "#fafafa",
                }}
              >
                <div>
                  {isProduct ? "▸ Product Level" : "└─ "}
                  <strong>{sub.name}</strong>
                  {!isProduct && (
                    <span style={{ marginLeft: 8, color: "#777" }}>
                      ({sub.hours.toFixed(2)} hrs)
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  min="0"
                  disabled={!activitySelected[activity.name]}
                  value={values.Proto}
                  onChange={(e) => {
                    const val = Number(e.target.value);

                    // Always update Proto
                    updateSubValue(activity.name, sub.name, "Proto", val);

                    // Sync Serie ONLY for 2D / DM / GS activities
                    if (shouldSyncProtoSerie(activity.name)) {
                      updateSubValue(activity.name, sub.name, "Serie", val);
                    }
                  }}
                />

                <input
                  type="number"
                  min="0"
                  disabled={!activitySelected[activity.name]}
                  value={values.Serie}
                  onChange={(e) => {
                    const val = Number(e.target.value);

                    // If synced activity → Serie follows Proto
                    if (shouldSyncProtoSerie(activity.name)) {
                      updateSubValue(activity.name, sub.name, "Proto", val);
                      updateSubValue(activity.name, sub.name, "Serie", val);
                    } else {
                      // Else → Serie updates independently
                      updateSubValue(activity.name, sub.name, "Serie", val);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ActivitySubactivityTable;
