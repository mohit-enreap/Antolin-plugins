import { useState, useContext, useEffect, useMemo } from "react";
import { initialJsonData } from "../data/jsonData";
import { calculateResults } from "./useCalculations";
import { StorageContext } from "../../StorageContext";

import { get2DActivities } from "../utils/activityUtils";

import { sharedRef } from "../../shared/sharedStore";

import { getCheckedComponentShortcuts } from "../data/ShortCutsForComponentsChecked/Config/products/logicTofetchShortsforCheckedComponents";

export function useActivityLogic() {
  console.log("=== [useActivityLogic] Hook Initializing ===");

  // ================================================================
  // 1️⃣ MAIN JSON DATA STATE
  // Full activities + products + subactivity
  // Deep cloning initial JSON to avoid reference mutation
  // ================================================================
  const { storedDataPs, handleSavePs, issueData } = useContext(StorageContext);

  const [jsonData, setJsonData] = useState(null);

  const [PS_SHORTCUT, setPS_SHORTCUT] = useState({});

  useEffect(() => {
    if (!storedDataPs) return;

    setJsonData(storedDataPs);

    if(issueData?.product) {
        setPS_SHORTCUT(getCheckedComponentShortcuts(issueData?.product));
    }
    console.log("PS Issue Data Product:", issueData?.product);

    // Global logic
    if (storedDataPs.Global) {
      setGlobalParams(storedDataPs.Global);
      return;
    }

    if (issueData) {
      setGlobalParams({
        TDL: "NO",
        COO: "NO",
        DE: "NO",
      });
    }
  }, [storedDataPs, issueData]);

  console.log("[INIT] Loaded Initial PS jsonData:", jsonData);

  const pdfData = useMemo(() => {
    if (!storedDataPs) return;
    return buildPDFOutput(storedDataPs); //  CALL HERE
  }, [storedDataPs]);

  // --- for PDF Json start-----

  function buildPDFOutput(data) {
    console.log("PDF DATA PS--> ", data);

    // Guard clause: return empty structure if data is null/undefined
    if (!data) {
      return {
        activities: [],
        productParts: {},
      };
    }

    const activities = [];
    const productParts = {};

    const IGNORE_KEYS = [
      "checked",
      "order",
      "extraWorkLoop",
      "reWorkLoop",
      "standardLoop",
    ];

    Object.entries(data.activities || {}).forEach(
      ([activityName, activity]) => {
        if (!activity.checked) return;

        const activityLabel = activityName.includes("|")
          ? activityName.split("|")[1].trim()
          : activityName;

        // 👉 Get all valid product entries (NORMAL ROOF, SUN ROOF etc.)
        const entries = Object.entries(activity).filter(
          ([key, val]) =>
            typeof val === "object" &&
            val !== null &&
            !IGNORE_KEYS.includes(key),
        );

        if (!entries.length) return;

        const rows = [];
        let totalHours = 0;

        entries.forEach(([productName, product]) => {
          if (!productParts[productName]) {
            productParts[productName] = {
              noOfComponent: product.noOfComponent || 1,
            };
          }
        });

        // =====================================================
        // ✅ PS ACTIVITIES PDF LOGIC
        // =====================================================

        const [_, firstProduct] = entries[0];
        const subacts = firstProduct.subactivity || {};

        //  CASE 1: Subactivities exist
        if (Object.keys(subacts).length > 0) {
          Object.entries(subacts).forEach(([subName, sub]) => {
            const hours = Number(sub.TDL || 0);
            totalHours += hours;

            rows.push({
              type: "SUB",
              label: `~ ${subName}`,
              name: subName,
              hours: Number(hours.toFixed(2)),
              Proto: sub.Proto || 0,
              Serie: sub.Serie || 0,
            });
          });
        }

        //  CASE 2: NO subactivities → take FIRST PRODUCT (IMPORTANT FIX)
        else {
          rows.push({
            type: "PRODUCT",
            label: `~  ${activityLabel}`,
            name: activityLabel,
            Proto: firstProduct.Proto || 0,
            Serie: firstProduct.Serie || 0,
          });
        }

        // =====================================================
        //  PUSH FINAL ACTIVITY
        // =====================================================
        activities.push({
          name: activityLabel,
          originalName: activityName,
          hours: Number(totalHours.toFixed(2)),
          rows,
        });
      },
    );

    return {
      activities,
      productParts, //  NORMAL ROOF etc.
    };
  }

  // ================================================================
  // 2️⃣ GLOBAL YES/NO PARAMETERS STATE
  // These determine how multipliers work (1 or 0)
  // ================================================================
  // const [globalParams, setGlobalParams] = useState({
  //   TDL: "YES",
  //   COO: "YES",
  //   DE: "YES",
  //   "2D": "YES",
  //   "Data Management": "YES",
  //   "Geometrical Study": "YES",
  //   "Geometrical Study2": "YES",
  // });

  const [globalParams, setGlobalParams] = useState({
    TDL: "",
    COO: "",
    DE: "",
  });

  // Earlier it was fecthing from here . Now i added GlOBAL_VARIBALE_PARAM_RULES logic
  //  it fetch value form there
  console.log("[INIT] Loaded Default Global Params:", globalParams);

  //----------get2DActivities-------
  // 2️⃣ Derived initial 2D rows (ONCE)
  const [global2DRows, setGlobal2DRows] = useState(() =>
    get2DActivities(jsonData?.activities),
  );

  // 3️⃣ Update 2D activity → JSON + rows
  const update2DActivity = (activityName, field, value) => {
    setJsonData((prev) => {
      const nextActivities = {
        ...prev.activities,
        [activityName]: {
          ...prev.activities[activityName],
          [field]: field === "include" ? value === "Yes" : Number(value),
        },
      };

      // keep rows in sync
      setGlobal2DRows(get2DActivities(nextActivities));

      return {
        ...prev,
        activities: nextActivities,
      };
    });
  };
  //-----------

  // ================================================================
  // ⭐ UPDATE GLOBAL PARAM
  // Called whenever user toggles YES/NO

  // ...prev → copy all old values
  // [key]: val → update only the field you want
  // ================================================================
  //Can be delete later
  function updateGlobalParam_old(key, val) {
    console.log(`=== [updateGlobalParam] Changing ${key} → ${val} ===`);
    setGlobalParams((prev) => {
      const next = { ...prev, [key]: val };
      console.log("[updateGlobalParam] Updated Global params:", next);
      return next;
    });
  }

  //--------------------------

  function sayHello(data) {
    alert("Hello 👋 from useActivityLogic:", data);
    console.log("Hello 👋 from useActivityLogic:", data);
  }
  //--------------------------

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
        "[updateGlobalParam] Applying activity updates due to Global change...",
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
          "[updateGlobalParam] 2D = NO → Unchecking all 2D activities...",
        );
        activityGroups["2D"].forEach((act) => {
          if (next.activities[act]) {
            next.activities[act].checked = false;
            console.log("  → Unchecked:", act);
          }
        });
      } else {
        console.log(
          "[updateGlobalParam] 2D = Yes → Unchecking all 2D activities...",
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
          "[updateGlobalParam] Data Management = NO → Unchecking all DM activities...",
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
            "[updateGlobalParam] Data Management = yes → Unchecking all DM activities...",
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
          "[updateGlobalParam] Geometrical Study = NO → Unchecking all GS activities...",
        );
        activityGroups["Geometrical Study"].forEach((act) => {
          if (next.activities[act]) {
            next.activities[act].checked = false;
            console.log("  → Unchecked:", act);
          }
        });
      } else {
        console.log(
          "[updateGlobalParam] Geometrical Study = yes → Unchecking all GS activities...",
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

  function updateGlobalParam(key, val) {
    console.log(`=== [nishant] Changing ${key} → ${val} ===`);
    console.log(`=== [updateGlobalParam111] Changing ${key} → ${val} ===`);

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
        "[updateGlobalParam] Applying activity updates due to Global change...",
      );

      // Loop through all activities
      Object.entries(next.activities).forEach(([activityName, activityObj]) => {
        const name = activityName.toUpperCase();

        // 2D : working:
        if (key === "2D" && name.startsWith("2D")) {
          if (val === "YES") {
            activityObj.checked = true;
          } else {
            activityObj.checked = false;
          }
          console.log(
            `  → ${
              activityObj.checked ? "Checked" : "Unchecked"
            }: ${activityName}`,
          );
        }

        // 2d Antolin Drawings
        // alert(key);
        //   alert("key-" + key + " ||| name " + name);
        if (
          key === "2d Antolin Drawings" &&
          (name.includes("2D DELIVERABLES | INTERNAL DRAWING MAIN PARTS") ||
            name.includes("2D DELIVERABLES | COP / INHERIT DRAWINGS") ||
            name.includes("2D DELIVERABLES | FORMAT DRAWING") ||
            name.includes("2D DELIVERABLES | ROLL DRAWING") ||
            name.includes("2D DELIVERABLES | NVH DRAWING"))
        ) {
          // alert("---");
          if (val === "YES") {
            activityObj.checked = true;
          } else {
            activityObj.checked = false;
          }
          console.log(
            `  → ${
              activityObj.checked ? "Checked" : "Unchecked"
            }: ${activityName}`,
          );
        }

        // 2d Antolin Drawings
        if (
          key === "2d Customer Drawings" &&
          (name.includes("2D DELIVERABLES | CUSTOMER PART DRAWINGS") ||
            name.includes("2D DELIVERABLES | CUSTOMER ASSY DRAWINGS"))
        ) {
          if (val === "YES") {
            activityObj.checked = true;
          } else {
            activityObj.checked = false;
          }
          console.log(
            `  → ${
              activityObj.checked ? "Checked" : "Unchecked"
            }: ${activityName}`,
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
            }: ${activityName}`,
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
            }: ${activityName}`,
          );
        }
      });

      console.log("[updateGlobalParam] Finished applying activity changes.");
      return next;
    });
  }

  function updateGlobalProductPart(key, val) {
    console.log(
      `=== [updateGlobalProductPart] Changing ===\n`,
      JSON.stringify(key, null, 2),
      JSON.stringify(val, null, 2),
    );
  }

  // OLD
  // function applyGlobalProductChange({ product, key, value }) {
  //   console.log("[GLOBAL CHANGE]", product, key, value);

  //   Object.keys(jsonData.activities).forEach((activityName) => {
  //     if (jsonData.activities[activityName][product]) {
  //       updateProductValue(activityName, product, key, value);
  //     }
  //   });
  // }

  //NEW
  // here applied the shortcut when we select teh componensts then respective activity will
  // be checked or Unchecked accordingly
  function applyGlobalProductChange({ product, key, value }) {
    /*
  ------------------------------------------------------------------
  PS_SHORTCUT
  ------------------------------------------------------------------
  This object defines which components belong to which activity.
 
  Why we need this:
  In your JSON, every activity contains ALL components, but logically
  each activity should only care about some components.
 
  So we create this mapping to tell the system:
 
  Activity 1 → these components control it
  Activity 2 → these components control it
  Activity 3 → these components control it
  */

    /*
  ------------------------------------------------------------------
  React State Update
  ------------------------------------------------------------------
 
  setJsonData() updates your React state.
 
  prev → current state
  next → cloned state that we modify safely
 
  structuredClone() is used to avoid mutating the original state.
  */

    setJsonData((prev) => {
      const next = structuredClone(prev);

      /*
    ------------------------------------------------------------------
    STEP 1 — Update the component in all activities
    ------------------------------------------------------------------
 
    Because your JSON contains all components in every activity,
    we must update the selected component everywhere it exists.
 
    Example:
    If product = "DRAWING"
 
    Then we update DRAWING inside:
    Activity 101
    Activity 102
    Activity 103
    */

      Object.values(next.activities).forEach((activity) => {
        // check if this activity contains the component
        if (activity[product]) {
          // update the value (example: componentSelected = true)
          activity[product][key] = value;
        }
      });

      /*
    ------------------------------------------------------------------
    STEP 2 — Recalculate activity.checked
    ------------------------------------------------------------------
 
    Now we must determine if each activity should be checked.
 
    Rule:
    If ANY of the components belonging to that activity
    is selected → checked = true
 
    Otherwise → checked = false
    */

      Object.entries(PS_SHORTCUT).forEach(
        ([activityName, components]) => {
          // get the activity from JSON
          const activity = next.activities[activityName];

          // if activity not found skip
          if (!activity) return;

          /*
        components.some()
 
        This checks if ANY component in the array is selected.
 
        Example:
 
        components = [
          "FRAME BUILDING 3D",
          "DRAWING",
          "HEAD IMPACT STUDY REPORT PREPARATION"
        ]
 
        If any of these has componentSelected = true
        → result becomes true
        */

          const anySelected = components.some(
            (comp) => activity[comp]?.componentSelected === true,
          );

          /*
        Update activity checkbox state
        */

          activity.checked = anySelected;
        },
      );

      /*
    Return updated JSON to React state
    */

      return next;
    });
  }

  /*
    Loop all activities

    Turn activity checked ON/OFF based on activitySelected

    Loop all products

    Apply Proto / Serie to matching subactivities

    Update entire jsonData in one place

    Child does NOT touch jsonData directly
    ✔ Parent (hook) is the single source of truth
  */
  function updateGlobalActivitySubactivity(payload) {
    console.log(
      "=== [updateGlobalActivitySubactivity] Incoming Payload ===",
      JSON.stringify(payload, null, 2),
    );

    const { activitySelected, subValues } = payload;

    setJsonData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));

      // 1️⃣ Loop all activities in JSON
      Object.entries(next.activities).forEach(([activityName, activityObj]) => {
        const isSelected = !!activitySelected[activityName];

        // 2️⃣ Set activity checked flag
        activityObj.checked = isSelected;
        // Set StandardLoop to 1
        activityObj.standardLoop = isSelected ? 1 : 0;

        // If activity is OFF → skip sub updates
        if (!isSelected) return;

        // 3️⃣ Loop all products in activity
        Object.entries(activityObj).forEach(([productName, productObj]) => {
          if (!productObj?.subactivity) return;

          // 4️⃣ Loop all selected subactivities
          Object.entries(subValues?.[activityName] || {}).forEach(
            ([subName, values]) => {
              const sub = productObj.subactivity[subName];
              if (!sub) return;

              sub.Proto = Number(values.Proto || 0);
              sub.Serie = Number(values.Serie || 0);

              console.log(
                `✔ Updated ${activityName} → ${productName} → ${subName}`,
                sub,
              );
            },
          );
        });
      });

      console.log(
        "=== [updateGlobalActivitySubactivity] Updated jsonData ===",
        next,
      );

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
      `=== [toggleActivityChecked] ${activityName} → checked = ${checked} ===`,
    );

    //Update jsonData using React state
    setJsonData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)); // Make a deep copy of "next"  from "prev"
      if (next.activities[activityName]) {
        // check for the same activity to modify the change "checked/uncheked"
        next.activities[activityName].checked = checked;
        next.activities[activityName].standardLoop = checked ? 1 : 0;

        console.log(
          " Checked :",
          next.activities[activityName].checked,
          "\n StandardLoop : ",
          next.activities[activityName].standardLoop,
        );

        console.log(
          `[toggleActivityChecked] Updated activity '${activityName}' checked flag`,
        );
      } else {
        console.warn(
          `[toggleActivityChecked] WARNING: '${activityName}' not found in jsonData`,
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
      `=== [updateProductValue] activity=${activityName}, product=${productName}, key=${key}, value=${value} ===`,
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
          `[updateProductValue] Product '${productName}' not found under activity '${activityName}'`,
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
        convertedValue,
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
          `[updateProductValue] Syncing111 '${key}' across all activities for product '${productName}'`,
        );

        for (const activity in next.activities) {
          const productInActivity = next.activities[activity][productName];

          //  console.log(
          //    `productInActivity --->'${productInActivity.activityName}'`
          //  );
          // Skip if product does not exist or it is the activity we just updated
          if (!productInActivity || activity === activityName) continue;
          productInActivity[key] = convertedValue;
          console
            .log
            // `[updateProductValue] Synced 222 '${key}' for activity '${activity}'`
            ();
        }
      }

      //------

      // Allowed activities for Proto/Serie sync
      const AllowedActivities = [
        "2D DELIVERABLES ",
        "DATA MANAGEMENT",
        "GEOMETRICAL STUDY ",
      ];

      // Keys that should NOT be updated as products
      const ignoreKeys = [
        "extraWorkLoop",
        "reWorkLoop",
        "standardLoop",
        "checked",
        "order",
        "noOfLoops",
        "Proto",
        "Serie",
      ];

      // Condition : If AllowedActivities
      const showProtoSerie = AllowedActivities.some((prefix) =>
        activityName.toLowerCase().startsWith(prefix.toLowerCase()),
      );

      // Sync Proto/Serie only for allowed activities
      if (
        (key === "Proto" || key === "Serie" || key === "noOfComponent") &&
        showProtoSerie
      ) {
        console.log(
          ` Proto/Serie[updateProductValue] Syncing '${key}' inside '${activityName}' for all products`,
        );

        const activityProducts = next.activities[activityName];
        console.log(
          " activityProducts[productKey]  ==111=> " +
            activityName +
            " ===>" +
            JSON.stringify(activityProducts),
        );

        for (const productKey in activityProducts) {
          // Skip ignored keys + skip currently updated product
          //          if (ignoreKeys.includes(productKey) || productKey === productName)

          // When you make Change in proto / Serie of 2d/DM/Gm it reflect in all product of same activity
          if (ignoreKeys.includes(productKey)) continue; // When you make Change in

          // if (productKey === productName) continue; // Already updated above

          console.log(
            " activityProducts[productKey]  ===> " +
              activityProducts[productKey] +
              "  ==))))))" +
              convertedValue,
          );

          console.log(
            " productKey  ===> " + productKey + "  ==))))))  key" + key,
          );
          activityProducts[productKey]["Proto"] = convertedValue;
          activityProducts[productKey]["Serie"] = convertedValue;
        }
      }
      return next;
    });
  }

  // ================================================================
  // ⭐ UPDATE SUB-ACTIVITY VALUE
  // Example: subactivity.ABC.TDL = 2.5
  // ================================================================
  function updateSubValue_old(activityName, productName, subName, key, value) {
    console.log(
      `=== [updateSubValue] act=${activityName}, product=${productName}, sub=${subName}, key=${key}, value=${value} ===`,
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
          `[updateSubValue] Sub '${subName}' not found under product '${productName}' in activity '${activityName}'`,
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
        convertedValue,
      );

      // 6. Return updated JSON data to React
      return next;
    });
  }

  //
  function updateSubValue(activityName, productName, subName, key, value) {
    console.log(
      `=== [updateSubValue] Start: act=${activityName}, product=${productName}, sub=${subName}, key=${key}, value=${value} ===`,
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
            `[updateSubValue] Sub '${subName}' not found under product '${prodName}' in activity '${activityName}'`,
          );
          continue;
        }

        // Log previous value before updating
        console.log(
          `[updateSubValue] Before Update: product='${prodName}', sub='${subName}', key='${key}', value=`,
          sub[key],
        );

        // Perform the actual update proto serie in other product for same activity
        sub[key] = convertedValue;
        updatedCount++;

        // Log after updating
        console.log(
          `[updateSubValue] After Update: product='${prodName}', sub='${subName}', key='${key}', value=`,
          sub[key],
        );
      }

      console.log(
        `[updateSubValue] Finished: Total products updated = ${updatedCount}`,
      );

      // Return the updated state
      return next;
    });
  }

  // ================================================================
  // ⭐ TEMP RESULTS (NO JSON MODIFICATION)  .
  // Call comes from  CADCalcuator
  //// calculateResults method  present in (useCalculation.js file)
  // ================================================================
  function calculateTempResults(finalJSON) {
    console.log("=== [calculateTempResults] Received JSON:", finalJSON);
    // const result = calculateResults(finalJSON);
    const {
      results,
      threeDResults,
      threeDAggregatedTotal,
      twoDResults,
      twoDAggregatedTotal,
      dataManagementResults,
      dataMgmtAggregatedTotal,
      geometricalStudyResults,
      geoAggregatedTotal,
    } = calculateResults(finalJSON);

    //--------Setting value from ps to fetch in CAD   -- START----------
    const protoTDL = Number(threeDAggregatedTotal[0].protoTDL ?? 0);
    const protoCOO = Number(threeDAggregatedTotal[0].protoCOO ?? 0);
    const protoDE = Number(threeDAggregatedTotal[0].protoDE ?? 0);
    const protoTotal = Number(threeDAggregatedTotal[0].protoTotal ?? 0);

    const serieTDL = Number(threeDAggregatedTotal[0].serieTDL ?? 0);
    const serieCOO = Number(threeDAggregatedTotal[0].serieCOO ?? 0);
    const serieDE = Number(threeDAggregatedTotal[0].serieDE ?? 0);
    const serieTotal = Number(threeDAggregatedTotal[0].serieTotal ?? 0);

    const sumTDL = Number(threeDAggregatedTotal[0].TDL ?? 0);
    const sumCOO = Number(threeDAggregatedTotal[0].COO ?? 0);
    const sumDE = Number(threeDAggregatedTotal[0].DE ?? 0);
    const grandTotal = Number(threeDAggregatedTotal[0].Total ?? 0);
    sharedRef.currentPS = {
      protoTDL,
      protoCOO,
      protoDE,
      protoTotal,

      serieTDL,
      serieCOO,
      serieDE,
      serieTotal,

      TDL: sumTDL,
      COO: sumCOO,
      DE: sumDE,
      Total: grandTotal,
      pdfData: pdfData,
    };

    console.log("SharedRef updated (PS):", sharedRef.currentPS);

    //--------Setting value from ps to fetch in CAD   -- END----------

    console.log("[calculateFinalResults] temp Computed Result:", results);
    console.log("[threeDResults] temp Computed Result:", threeDResults);

    console.log(
      "[dataManagementResults] temp Computed Result:",
      dataManagementResults,
    );
    console.log(
      "[geometricalStudyResults]  temp Computed Result:",
      geometricalStudyResults,
    );
    //return results;
    return {
      results,
      threeDResults,
      threeDAggregatedTotal,
      twoDResults,
      twoDAggregatedTotal,
      dataManagementResults,
      dataMgmtAggregatedTotal,
      geometricalStudyResults,
      geoAggregatedTotal,
    };
  }

  // ================================================================
  // ⭐ FINAL RESULTS (After JSON modified)
  // calculateResults method  present in (useCalculation.js file)
  // ================================================================
  function calculateFinalResults(finalJSON) {
    console.log("=== [calculateFinalResults] Received JSON:", finalJSON);
    //  const result = calculateResults(finalJSON);
    const {
      results,
      threeDResults,
      twoDResults,
      dataManagementResults,
      geometricalStudyResults,
    } = calculateResults(finalJSON);
    console.log("[calculateFinalResults] Computed Result:", results);
    console.log("[threeDResults] Computed Result:", threeDResults);
    console.log("[threeDResults] Computed Result:", threeDResults);
    console.log(
      "[dataManagementResults] Computed Result:",
      dataManagementResults,
    );
    console.log(
      "[geometricalStudyResults] Computed Result:",
      geometricalStudyResults,
    );

    //return results;
    return {
      results,
      threeDResults,
      twoDResults,
      dataManagementResults,
      geometricalStudyResults,
    };
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

    const next = JSON.parse(JSON.stringify(finalJSON));
    // ================================================================
    // 2️⃣ Update React State using Functional Set State
    // We take previous state → create a safe deep copy → update everything

    // May you have to apply condition to handle 2d , DM ,gS  where tdl , coo ,dee should not be affected
    // ================================================================

    //const next = JSON.parse(JSON.stringify(prev)); // deep clone

    // Loop Activities (TDL / COO / DE sections)
    for (const [activityName, activityDetails] of Object.entries(
      next.activities,
    )) {
      console.log(`-- Processing Activity: ${activityName}`);

      // Loop each product inside the activity
      for (const [productPart, productData] of Object.entries(
        activityDetails,
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
          productData,
        );

        // ================================================================
        // 4️⃣ SUBACTIVITIES PROCESSING
        // If product has subactivities → loop and update each one
        // ================================================================
        if (productData.subactivity) {
          console.log(`---- Processing Subactivities for '${productPart}'`);

          for (const [subName, subDetails] of Object.entries(
            productData.subactivity,
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
                TDL: (Number(ps.TDL || 0) * TDLValueGlobalConstant).toFixed(3),
                COO: (Number(ps.COO || 0) * COOValueGlobalConstant).toFixed(3),
                DE: (Number(ps.DE || 0) * DEValueGlobalConstant).toFixed(3),
                Proto: ps.Proto || 0,
                Serie: ps.Serie || 0,
              }));

              console.log(
                `[saveFinal] Updated protoSerie array for sub '${subName}':`,
                subDetails.protoSerie,
              );
            }
          }
        }
      }
    }

    console.log("=== [saveFinal] Final Updated jsonData:", next);
    return next; // ✅ React gets updated data
  }

  // ================================================================
  // RETURN EVERYTHING TO REACT COMPONENT
  // ================================================================
  return {
    jsonData,
    globalParams,
    updateGlobalParam,
    updateGlobalProductPart,
    applyGlobalProductChange,
    updateGlobalActivitySubactivity,
    toggleActivityChecked,
    updateProductValue,
    updateSubValue,
    calculateTempResults,
    calculateFinalResults,
    saveFinal,
    global2DRows,
    update2DActivity,
    // PDF data
    pdfData,
    // ✅ expose simple method
    sayHello,
    PS_SHORTCUT,
  };
}
