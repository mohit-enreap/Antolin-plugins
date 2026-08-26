import { useState } from "react";
import { initialJsonData } from "../data/jsonData";
import { calculateResults } from "./useCalculations";

export function useActivityLogic() {
  console.log("=== [useActivityLogic] Hook Initializing ===");

  // ================================================================
  // 1️⃣ MAIN JSON DATA STATE
  // Full activities + products + subactivity
  // Deep cloning initial JSON to avoid reference mutation
  // ================================================================
  const [jsonData, setJsonData] = useState(
    JSON.parse(JSON.stringify(initialJsonData))
  );

  console.log("[INIT] Loaded Initial jsonData:", jsonData);

  // ================================================================
  // 2️⃣ GLOBAL YES/NO PARAMETERS STATE
  // These determine how multipliers work (1 or 0)
  // ================================================================
  const [globalParams, setGlobalParams] = useState({
    TDL: "YES",
    COO: "YES",
    DE: "YES",
    "2D": "YES",
    "Data Management": "YES",
    "Geometrical Study": "YES",
  });

  console.log("[INIT] Loaded Default Global Params:", globalParams);

  // ================================================================
  // ⭐ UPDATE GLOBAL PARAM
  // Called whenever user toggles YES/NO

  // ...prev → copy all old values
  // [key]: val → update only the field you want
  // ================================================================
  //Can be delete later
  function updateGlobalParam(key, val) {
    console.log(`=== [updateGlobalParam] Changing ${key} → ${val} ===`);
    setGlobalParams((prev) => {
      const next = { ...prev, [key]: val };
      console.log("[updateGlobalParam] Updated Global params:", next);
      return next;
    });
  }

  // new Activitity changes on Glabl 2d , dm , gm
  //Can be delete later
  function updateGlobalParam_new1(key, val) {
    console.log(`=== [updateGlobalParam] Changing ${key} → ${val} ===`);

    // 1) Update Global Params FIRST
    setGlobalParams((prev) => {
      const next = { ...prev, [key]: val };
      console.log("[updateGlobalParam] Updated Global params:", next);
      return next;
    });

    // 2) APPLY ACTIVITY UPDATE BASED ON GLOBAL VALUE
    setJsonData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));

      console.log(
        "[updateGlobalParam] Applying activity updates due to Global change..."
      );

      // Mapping of which activities belong to which group
      const activityGroups = {
        "2D": ["2D DELIVERABLES | Internal Drawing Main Parts"],
        "Data Management": ["DM UPLOADS", "DM VALIDATION", "DM CLEANUP"],
        "Geometrical Study": [
          "GEOMETRICAL STUDY | Stack up tolerances",
          "GEO ANALYSIS",
          "GEO MODELING",
        ],
      };

      const is2D_Off = key === "2D" && val === "NO";
      const isDM_Off = key === "Data Management" && val === "NO";
      const isGS_Off = key === "Geometrical Study" && val === "NO";

      console.log("[updateGlobalParam] Change found " + key + "  val :" + val);
      // -------------------------------------
      // AUTO-UNCHECK BULK ACTIVITIES
      // -------------------------------------

      if (is2D_Off) {
        console.log(
          "[updateGlobalParam] 2D = NO → Unchecking all 2D activities..."
        );
        activityGroups["2D"].forEach((act) => {
          if (next.activities[act]) {
            next.activities[act].checked = false;
            console.log("  → Unchecked:", act);
          }
        });
      } else {
        console.log(
          "[updateGlobalParam] 2D = Yes → Unchecking all 2D activities..."
        );
        activityGroups["2D"].forEach((act) => {
          if (next.activities[act]) {
            next.activities[act].checked = true;
            console.log("  → Unchecked:", act);
          }
        });
      }

      if (isDM_Off) {
        console.log(
          "[updateGlobalParam] Data Management = NO → Unchecking all DM activities..."
        );
        activityGroups["Data Management"].forEach((act) => {
          if (next.activities[act]) {
            next.activities[act].checked = false;
            console.log("  → Unchecked:", act);
          }
        });
      } else {
        if (isDM_Off) {
          console.log(
            "[updateGlobalParam] Data Management = yes → Unchecking all DM activities..."
          );
          activityGroups["Data Management"].forEach((act) => {
            if (next.activities[act]) {
              next.activities[act].checked = true;
              console.log("  → Unchecked:", act);
            }
          });
        }
      }

      if (isGS_Off) {
        console.log(
          "[updateGlobalParam] Geometrical Study = NO → Unchecking all GS activities..."
        );
        activityGroups["Geometrical Study"].forEach((act) => {
          if (next.activities[act]) {
            next.activities[act].checked = false;
            console.log("  → Unchecked:", act);
          }
        });
      } else {
        console.log(
          "[updateGlobalParam] Geometrical Study = yes → Unchecking all GS activities..."
        );
        activityGroups["Geometrical Study"].forEach((act) => {
          if (next.activities[act]) {
            next.activities[act].checked = true;
            console.log("  → Unchecked:", act);
          }
        });
      }

      console.log("[updateGlobalParam] Finished applying activity changes.");
      return next;
    });
  }

  function updateGlobalParam_new2(key, val) {
    console.log(`=== [updateGlobalParam] Changing ${key} → ${val} ===`);

    // 1) Update Global Params FIRST
    setGlobalParams((prev) => {
      const next = { ...prev, [key]: val };
      console.log("[updateGlobalParam] Updated Global params:", next);
      return next;
    });

    // 2) APPLY ACTIVITY UPDATE BASED ON GLOBAL VALUE
    setJsonData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      console.log(
        "[updateGlobalParam] Applying activity updates due to Global change..."
      );

      // Loop through all activities
      Object.entries(next.activities).forEach(([activityName, activityObj]) => {
        const name = activityName.toUpperCase();

        // 2D
        if (key === "2D" && name.startsWith("2D")) {
          if (val === "YES") {
            activityObj.checked = true;
          } else {
            activityObj.checked = false;
          }
          console.log(
            `  → ${
              activityObj.checked ? "Checked" : "Unchecked"
            }: ${activityName}`
          );
        }

        // Data Management
        if (
          key === "Data Management" &&
          (name.startsWith("DM") || name.includes("DATA MANAGEMENT"))
        ) {
          if (val === "YES") {
            activityObj.checked = true;
          } else {
            activityObj.checked = false;
          }
          console.log(
            `  → ${
              activityObj.checked ? "Checked" : "Unchecked"
            }: ${activityName}`
          );
        }

        // Geometrical Study
        if (
          key === "Geometrical Study" &&
          (name.startsWith("GEO") || name.includes("GEOMETRICAL"))
        ) {
          if (val === "YES") {
            activityObj.checked = true;
          } else {
            activityObj.checked = false;
          }
          console.log(
            `  → ${
              activityObj.checked ? "Checked" : "Unchecked"
            }: ${activityName}`
          );
        }
      });

      console.log("[updateGlobalParam] Finished applying activity changes.");
      return next;
    });
  }

  // ================================================================
  // ⭐ TOGGLE ACTIVITY CHECKED (ENABLE / DISABLE ACTIVITY)
  //This function turns an activity ON/OFF inside your big JSON, safely and correctly, using a deep copy so React can re-render.
  //
  // To avoid modifying React state directly
  // Deep copy ensures nested objects are also cloned and changes are made on clone
  // ================================================================
  function toggleActivityChecked(activityName, checked) {
    console.log(
      `=== [toggleActivityChecked] ${activityName} → checked = ${checked} ===`
    );

    //Update jsonData using React state
    setJsonData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)); // Make a deep copy of "next"  from "prev"
      if (next.activities[activityName]) {
        // check for the same activity to modify the change "checked/uncheked"
        next.activities[activityName].checked = checked;
        console.log(
          `[toggleActivityChecked] Updated activity '${activityName}' checked flag`
        );
      } else {
        console.warn(
          `[toggleActivityChecked] WARNING: '${activityName}' not found in jsonData`
        );
      }
      return next;
    });
  }

  // ================================================================
  // ⭐ UPDATE PRODUCT VALUE
  // Example:  "componentSelected" / "noOfComponent" /

  //key : "componentSelected" or "noOfComponent"
  // value → new value to set
  // ================================================================
  function updateProductValue(activityName, productName, key, value) {
    console.log(
      `=== [updateProductValue] activity=${activityName}, product=${productName}, key=${key}, value=${value} ===`
    );

    setJsonData((prev) => {
      // 1. Make a complete copy of the previous state
      // We do this because we should NEVER modify React state directly.
      const next = JSON.parse(JSON.stringify(prev)); // Makes a deep copy(next) of the existing state(prev)

      // 2. Find the exact product we want to update
      // Structure: next.activities → activityName → productName
      const product = next.activities[activityName][productName]; //Access the product you want to update

      // If product is missing, stop and return the original state
      if (!product) {
        //If that product doesn’t exist, it logs a warning and returns the old state
        console.warn(
          `[updateProductValue] Product '${productName}' not found under activity '${activityName}'`
        );
        return prev;
      }

      // Convert incoming value
      // 3. Convert the incoming value properly
      // - If key is "componentSelected", convert value to true/false
      // - If value is a number (like "5"), convert it to number
      // - Otherwise keep the value as is (string, etc.)
      let convertedValue;

      if (key === "componentSelected") {
        convertedValue = Boolean(value); // true or false
      } else {
        // Check if value is numeric
        if (!isNaN(Number(value))) {
          convertedValue = Number(value); // convert "10" → 10
        } else {
          convertedValue = value; // keep value as string
        }
      }

      product[key] = convertedValue; //// 4. Update the specific key inside the product

      console.log(
        `[updateProductValue] Updated ${activityName} → ${productName} → ${key} =`,
        convertedValue
      );

      // ==========================================================
      // 5. SYNC VALUES ACROSS ALL ACTIVITIES IF REQUIRED
      //
      // If the key is "componentSelected" or "noOfComponent",
      // then every activity that contains the SAME productName
      // must also get this updated value.
      // ==========================================================
      if (key === "componentSelected" || key === "noOfComponent") {
        console.log(
          `[updateProductValue] Syncing '${key}' across all activities for product '${productName}'`
        );

        for (const activity in next.activities) {
          const productInActivity = next.activities[activity][productName];
          // Skip if product does not exist or it is the activity we just updated
          if (!productInActivity || activity === activityName) continue;
          productInActivity[key] = convertedValue;
          console.log(
            `[updateProductValue] Synced '${key}' for activity '${activity}'`
          );
        }
      }

      return next;
    });
  }

  // ================================================================
  // ⭐ UPDATE SUB-ACTIVITY VALUE
  // Example: subactivity.ABC.TDL = 2.5
  // ================================================================
  function updateSubValue(activityName, productName, subName, key, value) {
    console.log(
      `=== [updateSubValue] act=${activityName}, product=${productName}, sub=${subName}, key=${key}, value=${value} ===`
    );

    setJsonData((prev) => {
      // 1. Create a deep copy of the previous state
      const next = JSON.parse(JSON.stringify(prev));

      // 2. Find the sub-activity inside the structure:
      // next.activities → activityName → productName → subactivity → subName
      const sub =
        next.activities?.[activityName]?.[productName]?.subactivity?.[subName];

      // 3. If the sub activity does not exist, stop and return old data
      if (!sub) {
        console.warn(
          `[updateSubValue] Sub '${subName}' not found under product '${productName}' in activity '${activityName}'`
        );
        return prev;
      }

      // 4. Convert the incoming value
      // If numeric → convert to number
      // Otherwise → keep as string
      let convertedValue;

      if (!isNaN(Number(value))) {
        // If numeric → convert to number
        convertedValue = Number(value);
      } // Otherwise → keep as string
      else {
        convertedValue = value;
      }

      // 5. Apply the value to the specific sub key
      sub[key] = convertedValue;

      console.log(
        `[updateSubValue] Updated sub '${subName}' → key '${key}' =`,
        convertedValue
      );

      // 6. Return updated JSON data to React
      return next;
    });
  }

  //
  function updateSubValue_new(activityName, productName, subName, key, value) {
    console.log(
      `=== [updateSubValue] Start: act=${activityName}, product=${productName}, sub=${subName}, key=${key}, value=${value} ===`
    );

    // Use React state setter to update jsonData
    setJsonData((prev) => {
      // Make a deep copy of the previous state to avoid direct mutation
      const next = JSON.parse(JSON.stringify(prev));

      // Convert value to number if it's a numeric string
      const convertedValue = !isNaN(Number(value)) ? Number(value) : value;

      // Access the products for the specified activity
      const activityProducts = next.activities?.[activityName];

      // Warn and return previous state if activity does not exist
      if (!activityProducts) {
        console.warn(`[updateSubValue] Activity '${activityName}' not found`);
        return prev;
      }

      let updatedCount = 0; // Track number of products updated

      // Loop over all products in this activity
      for (const prodName in activityProducts) {
        const sub = activityProducts[prodName]?.subactivity?.[subName];

        // Warn if the subactivity is missing for this product
        if (!sub) {
          console.warn(
            `[updateSubValue] Sub '${subName}' not found under product '${prodName}' in activity '${activityName}'`
          );
          continue;
        }

        // Log previous value before updating
        console.log(
          `[updateSubValue] Before Update: product='${prodName}', sub='${subName}', key='${key}', value=`,
          sub[key]
        );

        // Perform the actual update proto serie in other product for same activity
        sub[key] = convertedValue;
        updatedCount++;

        // Log after updating
        console.log(
          `[updateSubValue] After Update: product='${prodName}', sub='${subName}', key='${key}', value=`,
          sub[key]
        );
      }

      console.log(
        `[updateSubValue] Finished: Total products updated = ${updatedCount}`
      );

      // Return the updated state
      return next;
    });
  }

  // ================================================================
  // ⭐ TEMP RESULTS (NO JSON MODIFICATION)  .
  // Call comes from  CADCalcuator
  // ================================================================
  function calculateTempResults(finalJSON) {
    console.log("=== [calculateTempResults] Received JSON:", finalJSON);
    const result = calculateResults(finalJSON);
    console.log("[calculateTempResults] Computed Result:", result);
    return result;
  }

  // ================================================================
  // ⭐ FINAL RESULTS (After JSON modified)
  // ================================================================
  function calculateFinalResults(finalJSON) {
    console.log("=== [calculateFinalResults] Received JSON:", finalJSON);
    const result = calculateResults(finalJSON);
    console.log("[calculateFinalResults] Computed Result:", result);
    return result;
  }

  // ================================================================
  // ⭐ SAVE FINAL (WRITES INTO JSON)
  // Applies multipliers based on Global YES/NO
  // ================================================================
  function saveFinal(finalJSON) {
    console.log("=== [saveFinal] Starting Final Save ===");
    console.log("[saveFinal] Incoming JSON:", finalJSON);

    // ================================================================
    // 1️⃣ Read the YES/NO Global Flags and Convert Them into Multipliers
    // "YES" means include → multiplier = 1
    // "NO"  means exclude → multiplier = 0
    // These multipliers will be applied on every TDL / COO / DE value.
    // ================================================================
    const TDLValueGlobalConstant = finalJSON.Global.TDL === "YES" ? 1 : 0;
    const COOValueGlobalConstant = finalJSON.Global.COO === "YES" ? 1 : 0;
    const DEValueGlobalConstant = finalJSON.Global.DE === "YES" ? 1 : 0;

    console.log("[saveFinal] Global Multipliers:", {
      TDLValueGlobalConstant,
      COOValueGlobalConstant,
      DEValueGlobalConstant,
    });

    // ================================================================
    // 2️⃣ Update React State using Functional Set State
    // We take previous state → create a safe deep copy → update everything
    // ================================================================
    setJsonData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)); // deep clone

      // Loop Activities (TDL / COO / DE sections)
      for (const [activityName, activityDetails] of Object.entries(
        finalJSON.activities
      )) {
        console.log(`-- Processing Activity: ${activityName}`);

        // Loop each product inside the activity
        for (const [productPart, productData] of Object.entries(
          activityDetails
        )) {
          // Skip non-product fields
          const skipFields = [
            "extraWorkLoop",
            "reWorkLoop",
            "standardLoop",
            "checked",
            "order",
            "noOfLoops",
            "Proto",
            "Serie",
          ];
          // Skip processing if the current field is listed in skipFields
          if (skipFields.includes(productPart)) continue;

          // Validate productData before accessing its properties
          // If productData is null/undefined or not an object, skip further processing
          if (!productData || typeof productData !== "object") continue;

          console.log(`---- Updating Product: ${productPart}`);

          // ================================================================
          // 3️⃣ Multiply Base Product Values
          // Apply the YES/NO multipliers to TDL, COO, DE
          // (toFixed(3) ensures values look like "3.500")
          // ================================================================
          productData.TDL = (
            Number(productData.TDL || 0) * TDLValueGlobalConstant
          ).toFixed(3);
          productData.COO = (
            Number(productData.COO || 0) * COOValueGlobalConstant
          ).toFixed(3);
          productData.DE = (
            Number(productData.DE || 0) * DEValueGlobalConstant
          ).toFixed(3);

          console.log(
            `[saveFinal] Updated Base Values for '${productPart}':`,
            productData
          );

          // ================================================================
          // 4️⃣ SUBACTIVITIES PROCESSING
          // If product has subactivities → loop and update each one
          // ================================================================
          if (productData.subactivity) {
            console.log(`---- Processing Subactivities for '${productPart}'`);

            for (const [subName, subDetails] of Object.entries(
              productData.subactivity
            )) {
              // Multiply subactivity-level values
              subDetails.TDL = (
                Number(subDetails.TDL || 0) * TDLValueGlobalConstant
              ).toFixed(3);
              subDetails.COO = (
                Number(subDetails.COO || 0) * COOValueGlobalConstant
              ).toFixed(3);
              subDetails.DE = (
                Number(subDetails.DE || 0) * DEValueGlobalConstant
              ).toFixed(3);

              console.log(`[saveFinal] Updated Sub '${subName}':`, subDetails);

              // ================================================================
              // 5️⃣ protoSerie ARRAY PROCESSING
              // protoSerie = [{ TDL, COO, DE, Proto, Serie }]
              // Must update each item inside it
              // ================================================================
              if (Array.isArray(subDetails.protoSerie)) {
                subDetails.protoSerie = subDetails.protoSerie.map((ps) => ({
                  TDL: (Number(ps.TDL || 0) * TDLValueGlobalConstant).toFixed(
                    3
                  ),
                  COO: (Number(ps.COO || 0) * COOValueGlobalConstant).toFixed(
                    3
                  ),
                  DE: (Number(ps.DE || 0) * DEValueGlobalConstant).toFixed(3),
                  Proto: ps.Proto || 0,
                  Serie: ps.Serie || 0,
                }));

                console.log(
                  `[saveFinal] Updated protoSerie array for sub '${subName}':`,
                  subDetails.protoSerie
                );
              }
            }
          }
        }
      }

      console.log("=== [saveFinal] Final Updated jsonData:next", next);
      return next;
    });
  }

  // ================================================================
  // RETURN EVERYTHING TO REACT COMPONENT
  // ================================================================
  return {
    jsonData,
    globalParams,
    updateGlobalParam,
    toggleActivityChecked,
    updateProductValue,
    updateSubValue,
    calculateTempResults,
    calculateFinalResults,
    saveFinal,
  };
}
