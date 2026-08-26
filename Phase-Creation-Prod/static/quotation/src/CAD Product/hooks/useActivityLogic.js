import { useState, useEffect, useMemo, useContext } from "react";
import { initialJsonData } from "../data/jsonData";
import { calculateResults } from "./useCalculations";
import { get2DActivities } from "../utils/activityUtils";
import { CUSTOMER_PRODUCT_CONFIG } from "../data/customerProductConfig";
import { T_TIMELINES_STD } from "../data/timelinesSTD";
import { StorageContext } from "../../StorageContext";

// newly imported -- start
import { sharedRef } from "../../shared/sharedStore";

import { DATA_MANAGEMENT_DATA_PHASE } from "../data/DataManagement/DataManagementPhaseIntialData";
import { getDataManagementHours } from "../data/DataManagement/DataManagementPhaseIntialData";

// For Product + oem loop short cut
import { activityCustomerPhase } from "../data/Customer3dPhaseData/Customerphase";
import { getActivityCustomerPhase } from "../data/Customer3dPhaseData/config/products/LogicTofetchProduct"; // NEW

import { SCALING_FACTOR_FOR_3D_ACTIVITY } from "../data/ScalingFactorfor3DActivity";
import { useOtherTableLogic } from "./useOtherTableLogic";

import { CostSheetHelperLogic } from "./CostSheetHelperLogic";

// for store HCC&BCC data for TotalCOst Sheet (Dyanamic run tim data store)
import {
  setHccBccDynamicOutput,
  getHccBccDynamicOutput,
} from "../../shared/hccBccDynamicStore";

// 1st and 2nd step mould shortcut activities import
import { calculateScalingfactorAndCounterforOHSHelper } from "./calculateScalingfactorAndCounterforOHSHelper";

// Standard cost center hours data import from V8p13
import { CECO_COST_SHEET_v8p13 } from "../data/Ceco_cost_sheet data/ceco_cost_sheet";

import { get3DCostCenterHours } from "../data/offer/offerIntialData"; // user for offer and insutrilization

// newly imported -- end

export function useActivityLogic() {
  console.log("=== [useActivityLogic] Hook Initializing ===");

  // Add this helper to safely clone JSON state while stripping out hidden functions
  const safeDeepClone = (obj) => {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj));
  };

  // ================================================================
  // 1️⃣ MAIN JSON DATA STATE
  // Full activities + products + subactivity
  // Deep cloning initial JSON to avoid reference mutation
  // ================================================================

  const { storedData, handleSave, issueData, quotStartDate } =
    useContext(StorageContext);

  const [jsonData, setJsonData] = useState(null);

  const { otherTableData = [], updateOtherTableParam = () => {} } =
    useOtherTableLogic({ jsonData: jsonData || {} });

  const [globalParams, setGlobalParams] = useState({
    TDL: "",
    COO: "",
    DE: "",
    // "2D": "",  // Commented also commneted in ActivityLogic Hook
    "2d Antolin Drawings": "",
    "2d Customer Drawings": "",
    // "Short cut 3D": "",
    "Data Management": "",
    "Geometrical Study": "",
    Feasibility: "", // NOT NEEDED to Display
    product: "",
    Customer: "",
    "Type Of Development": "",
    ProjectName: "",
  });

  const [offerData, setOfferData] = useState({
    TDL: { Resources: 1, Weeks: 0 },
    "3D Coordination": { Resources: 2, Weeks: 0 },
    "3D Standard": { Resources: 1, Weeks: 0 },
  });

  const [percentages, setPercentages] = useState([
    {
      activity: "Customer Meetings",
      TDL: 10,
      "3D Coordination": 0,
      "3D Standard": 0,
    },
    {
      activity: "Internal Meetings",
      TDL: 10,
      "3D Coordination": 10,
      "3D Standard": 0,
    },
    {
      activity: "Master Sections",
      TDL: 35,
      "3D Coordination": 35,
      "3D Standard": 0,
    },
    {
      activity: "Feasibility Study",
      TDL: 40,
      "3D Coordination": 40,
      "3D Standard": 0,
    },
    {
      activity: "3D Development",
      TDL: 5,
      "3D Coordination": 15,
      "3D Standard": 100,
    },
  ]);

  const [industrializationData, setIndustrializationData] = useState({
    TDL: { Resources: 1 },
    "3D Coordination": { Resources: 1 },
    "3D Standard": { Resources: 1 },
  });

  // Data Management Offer
  const [dataManagementData, setDataManagementData] = useState({
    // TDL: { Resources: 1 },
    // "3D Coordination": { Resources: 1 },
    // "3D Standard": { Resources: 1 },
    "Data Management offer": { Resources: 1 },
  });

  // Data Management Weeks (separate variable for editable weeks)
  const [offerDMWeeks, setOfferDMWeeks] = useState(3);

  //===================

  // const DEFAULT_GLOBAL = {
  //   TDL: "",
  //   COO: "",
  //   DE: "",
  //   "2d Antolin Drawings": "",
  //   "2d Customer Drawings": "",
  //   "Data Management": "",
  //   "Geometrical Study": "",
  //   Feasibility: "",
  //   product: "",
  //   Customer: "",
  //   "Type Of Development": "",
  //   ProjectName: "",
  // };

  // const [globalParams, setGlobalParams] = useState(() => {
  //   // ✅ SAVED VERSION
  //   if (jsonData?.Global) {
  //     return {
  //       TDL: jsonData.Global.TDL,
  //       COO: jsonData.Global.COO,
  //       DE: jsonData.Global.DE,
  //       "2d Antolin Drawings": jsonData.Global["2d Antolin Drawings"],
  //       "2d Customer Drawings": jsonData.Global["2d Customer Drawings"],
  //       "Data Management": jsonData.Global["Data Management"],
  //       "Geometrical Study": jsonData.Global["Geometrical Study"],
  //       Feasibility: jsonData.Global["Feasibility"],
  //       product: jsonData.Global.product,
  //       Customer: jsonData.Global.Customer,
  //       "Type Of Development": jsonData.Global["Type Of Development"],
  //       ProjectName: jsonData.Global.ProjectName,
  //     };
  //   }

  //   // ✅ INITIAL VERSION (no Global)
  //   return { ...DEFAULT_GLOBAL };
  // });

  useEffect(() => {
    if (!storedData) return;

    setJsonData(storedData);

    if (storedData.phaseFlags) {
      setPhaseFlags(storedData.phaseFlags);
    }

    // ✅ SAFELY extract only weeks (never objects)
    if (storedData.phaseDates) {
      setManualWeeks({
        phase_0: storedData.phaseDates.phase_0?.weeks ?? 3,
        phase_1: storedData.phaseDates.phase_1?.weeks ?? 14,
        phase_2: storedData.phaseDates.phase_2?.weeks ?? 16,
        phase_3_4: storedData.phaseDates.phase_3_4?.weeks ?? 50,
      });
    }

    if (storedData.offerData) {
      setOfferData((prevDefaults) => ({
        ...prevDefaults, // Keep defaults (TDL, 3D Coordination, 3D Standard)
        ...storedData.offerData, // Overwrite with whatever came from storage
      }));
    }

    if (storedData.percentages) {
      console.log(
        "Effect | Got Percentages --> \n",
        JSON.stringify(storedData.percentages?.TDL),
      );
      setPercentages(storedData.percentages?.TDL);
    }

    if (storedData.industrializationData) {
      setIndustrializationData((prevDefaults) => ({
        ...prevDefaults, // Keep the defaults ("TDL", "3D Standard", etc.)
        ...storedData.industrializationData, // Overwrite with data from storage
      }));
    }

    if (storedData.dmData) {
      // ✅ Extract weeks from first activity and separate activity data
      let extractedWeeks = null;
      const dmActivityData = {};

      for (const [key, value] of Object.entries(storedData.dmData)) {
        if (value && typeof value === "object") {
          const { weeks, ...activityData } = value;
          dmActivityData[key] = activityData;
          if (weeks !== undefined && extractedWeeks === null) {
            extractedWeeks = weeks; // Get weeks from first activity
          }
        }
      }

      setDataManagementData((prevDefaults) => ({
        ...prevDefaults, // Keep the defaults
        ...dmActivityData, // Overwrite with activity data only (no weeks)
      }));

      // ✅ Extract DM weeks from storage or fallback to phase_0
      if (extractedWeeks !== null) {
        setOfferDMWeeks(extractedWeeks);
      } else if (storedData.phaseDates?.phase_0?.weeks) {
        setOfferDMWeeks(storedData.phaseDates.phase_0.weeks);
      }
    }

    // ✅ If dmData not present but phaseDates exists, initialize from phase_0
    if (!storedData.dmData && storedData.phaseDates?.phase_0?.weeks) {
      setOfferDMWeeks(storedData.phaseDates.phase_0.weeks);
    }

    // Set First and Second Step Mould Shortcut Initial Activity Values
    if (storedData.Initial) {
      setActivityValues(storedData.Initial);
    }

    // Set Cost Centers
    if (storedData.customerProductData) {
      console.log("CPD --> Effect 1 : \n", storedData.customerProductData);

      setCustomerProdData(storedData.customerProductData);
    }

    // Global OLD logic
    // if (storedData.Global) {
    //   setGlobalParams(storedData.Global);
    //   return;
    // }

    // Global logic
    if (storedData.Global) {
      let finalGlobal = { ...storedData.Global };

      // Override with projectType if it exists
      if (issueData?.projectType) {
        finalGlobal["Type Of Development"] = issueData.projectType;
      }
      setGlobalParams(finalGlobal);
      return; // skip the rest of the effect to avoid overwriting with issueData
    }

    if (issueData) {
      setGlobalParams({
        product: issueData.product ?? "Headliner",
        Customer: issueData.customer ?? "Audi",
        "Type Of Development": issueData.projectType ?? "FSS",
        ProjectName: issueData.projectName ?? "Proj",
        TDL: "NO",
        COO: "NO",
        DE: "NO",
        "2d Antolin Drawings": "NO",
        "2d Customer Drawings": "NO",
        "Data Management": "NO",
        "Geometrical Study": "NO",
        Feasibility: "NO",
      });
    }

    if (issueData?.customer) {
      setJsonData((prevJsonData) =>
        updateJsonDataWithCustomerPhases(
          prevJsonData,
          issueData?.customer,
          getActivityCustomerPhase(issueData?.product),
        ),
      );
      
      updateGlobalActivitySubactivityCN(storedData, issueData.catiaNxValue); // calling shortcut to update File translation subactivity based on CATIA/NX selection

      console.log(
        "USE Effect STEP MOULD hook after --> \n",
        issueData?.customer,
        "\nStringify-->\n",
        JSON.stringify(storedData),
      );
    }
    if (quotStartDate) {
      console.log("Hello Start Date : \n", quotStartDate);
      setSopParams(quotStartDate);
    }
  }, [storedData, issueData, quotStartDate]);

  useEffect(() => {
    if (!jsonData) return;
    updateOtherTableParam(jsonData);
  }, [jsonData]);

  console.log("[INIT] 1 -- Loaded Initial jsonData:", jsonData);

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

  const pdfData = useMemo(() => {
    if (!storedData) return;
    return buildPDFOutput(storedData); //  CALL HERE
  }, [storedData]);

  // --- for PDF Json start-----

  function buildPDFOutput(data) {
    console.log("PDF DATA --> ", data);

    // Guard clause: return empty structure if data is null/undefined
    if (!data) {
      return {
        activities: [],
        productParts: {},
        addOnComponents: [],
      };
    }

    const activities = [];
    const productParts = {};
    const addOnComponents = [];

    const IGNORE_KEYS = [
      "checked",
      "order",
      "extraWorkLoop",
      "reWorkLoop",
      "standardLoop",
    ];

    const ADD_ON_KEY = "ADD ON COMPONENTS";

    Object.entries(data.activities || {}).forEach(
      ([activityName, activity]) => {
        if (!activity.checked) return;

        const activityLabel = activityName.includes("|")
          ? activityName.split("|")[1].trim()
          : activityName;

        const is2D = activityName.startsWith("2D DELIVERABLES");
        const isDM = activityName.startsWith("DATA MANAGEMENT");
        const isGS = activityName.startsWith("GEOMETRICAL STUDY");

        // 👉 Get all valid product entries (NORMAL ROOF, SUN ROOF etc.)
        const entries = Object.entries(activity).filter(
          ([key, val]) =>
            typeof val === "object" &&
            val !== null &&
            !IGNORE_KEYS.includes(key),
        );

        if (!entries.length) return;

        let isAddOnActivity = false;

        // =====================================================
        // ✅ ADD ON COMPONENTS (capture separately)
        // =====================================================
        entries.forEach(([productName, product]) => {
          if (productName === ADD_ON_KEY) {
            isAddOnActivity = true;

            addOnComponents.push({
              activity: activityLabel,
              product: productName,
              noOfComponent: product.noOfComponent || 0,
            });
          }
        });

        const rows = [];
        let totalHours = 0;

        // =====================================================
        // ✅ 3D ACTIVITIES (INCLUDING ADD-ON)
        // =====================================================
        if (!is2D && !isDM && !isGS) {
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
        }
        // =====================================================
        //  2D / DM / GS (PRODUCT LEVEL ONLY)
        // =====================================================
        else {
          const [_, product] = entries[0];

          rows.push({
            type: "PRODUCT",
            label: `~  ${activityLabel}`,
            name: activityLabel,
            Proto: product.Proto || 0,
            Serie: product.Serie || 0,
          });
        }

        // =====================================================
        // ✅ POPULATE PRODUCT PARTS (FOR ALL ACTIVITIES)
        // =====================================================
        // Iterate ALL entries and add products (NORMAL ROOF, SUN ROOF, etc.)
        // Skip ONLY the "ADD ON COMPONENTS" entry
        entries.forEach(([productName, product]) => {
          // Skip ADD ON COMPONENTS - it's handled separately above
          if (productName === ADD_ON_KEY) return;

          // Add product to productParts if not already present
          if (!productParts[productName]) {
            productParts[productName] = {
              // If componentSelected is true, use noOfComponent value; otherwise use "-"
              noOfComponent: product.componentSelected
                ? product.noOfComponent || 1
                : "-",
            };
          }
        });

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
      addOnComponents, //  ADD ON COMPONENTS
    };
  }

  //-----------
  // //=========update Phases Number based on OEM start===========
  // setJsonData(prev =>
  //   updateJsonDataWithCustomerPhases1(
  //     prev,
  //     "Acura",
  //     activityCustomerPhase
  //   )
  // );

  //========= update Phases Number based on OEM start ===========

  // useEffect(() => {
  //   if (!issueData?.customer) return;

  //   console.log(
  //     "USE Effect STEP MOULD hook before --> \n",
  //     issueData?.customer,
  //     "\nStringify-->\n",
  //     JSON.stringify(storedData),
  //   );
  //   setJsonData((prevJsonData) =>
  //     updateJsonDataWithCustomerPhases(
  //       prevJsonData,
  //       issueData?.customer,
  //       activityCustomerPhase,
  //     ),
  //   );

  //   console.log(
  //     "USE Effect STEP MOULD hook after --> \n",
  //     issueData?.customer,
  //     "\nStringify-->\n",
  //     JSON.stringify(storedData),
  //   );
  // }, [storedData, jsonData, issueData]);

  // useEffect(() => {
  //   setJsonData(prev => {
  //     // Step 1: Apply your mapping logic
  //     const mappedData = prev;
  //     // updateJsonDataWithCustomerPhases(prev, "Aiways", activityCustomerPhase);

  //     // Step 2: Apply scaling factor separately for HEADLINER
  //     return applyScalingFactor(prev, "HEADLINER");
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  /*
For an activity:

If subactivities exist AND mapping matches
→ update subactivity Proto / Serie (already working)

If subactivities are EMPTY or NOT FOUND in mapping
→ update ALL product-level Proto / Serie
(NORMAL ROOF, SUN ROOF, PANO ROOF, combos, etc.)
*/
  function updateJsonDataWithCustomerPhases(data, customer, mapping) {
    // =====================================================
    // ✅ Deep clone the entire JSON
    // - Prevents direct mutation of React state
    // - Ensures React detects changes correctly
    // =====================================================
    // const newData = structuredClone(data);
    const newData = safeDeepClone(data);

    // =====================================================
    // 🔁 Loop through each ACTIVITY
    // Example activityKey:
    // "DATA PREPARATION | A side proposal"
    // =====================================================
    for (const activityKey in newData.activities) {
      const activity = newData.activities[activityKey];

      // =====================================================
      // Extract logical activity name after "|"
      // "DATA PREPARATION | A side proposal"
      // → "A side proposal"
      // This name is used to look up CUSTOMER PHASE mapping
      // =====================================================
      const activityName = activityKey.split("|")[1]?.trim();

      // =====================================================
      //  Loop through each ROOF / PRODUCT inside activity
      // Example roofKey:
      // "NORMAL ROOF", "SUN ROOF", etc.
      // =====================================================
      for (const roofKey of Object.keys(activity)) {
        // -------------------------------------------------
        // ❌ Skip non-product / meta keys
        // These are NOT roofs or products
        // -------------------------------------------------
        if (
          [
            "extraWorkLoop",
            "reWorkLoop",
            "standardLoop",
            "checked",
            "order",
            "noOfLoops",
            "Proto",
            "Serie",
          ].includes(roofKey)
        )
          continue;

        const roof = activity[roofKey];

        // =====================================================
        // 🔍 Check if this roof contains SUBACTIVITIES
        // - true  → subactivity object exists & not empty
        // - false → product-only (NORMAL ROOF, SUN ROOF, etc.)
        // =====================================================
        const hasSubactivities =
          roof.subactivity && Object.keys(roof.subactivity).length > 0;

        // =====================================================
        // CASE 1️⃣: Roof HAS subactivities
        // -----------------------------------------------------
        // - Update Proto / Serie at SUBACTIVITY level
        // - Mapping key = subactivity name
        // =====================================================
        if (hasSubactivities) {
          for (const subKey in roof.subactivity) {
            // Look up phase mapping for this subactivity & customer
            const customerPhase = mapping[subKey]?.[customer];

            // If mapping not found → do nothing
            if (!customerPhase) continue;

            // Update Proto (PH1) if available, else keep old value
            roof.subactivity[subKey].Proto =
              customerPhase.PH1 ?? roof.subactivity[subKey].Proto;

            // Update Serie (PH2) if available, else keep old value
            roof.subactivity[subKey].Serie =
              customerPhase.PH2 ?? roof.subactivity[subKey].Serie;
          }
        }

        // =====================================================
        // CASE 2️⃣: PRODUCT ONLY (NO subactivities)
        // -----------------------------------------------------
        // - Example: NORMAL ROOF, SUN ROOF, etc.
        // - Update Proto / Serie at PRODUCT level
        // - Mapping key = ACTIVITY NAME (after "|")
        // =====================================================
        else {
          // Look up phase mapping using activity name
          const productPhase = mapping[activityName]?.[customer];

          // If no mapping exists → do nothing
          if (!productPhase) continue;

          // Update product-level Proto and Serie
          roof.Proto = productPhase.PH1 ?? roof.Proto;
          roof.Serie = productPhase.PH2 ?? roof.Serie;
        }
      }
    }

    // =====================================================
    // ✅ Return fully updated JSON
    // =====================================================
    return newData;
  }

  //=========update Phases Number based on OEM end===========

  ///----------Scaling factor Starts---------------
  // Define scaling factor
  const SCALING_FACTOR = 3;

  /**
   * Apply scaling factor to JSON data for a specific product
   * Only scales activities that exist in that product
   *
   * data - JSON data (after mapping updates)
   * productName - Product to check (HEADLINER, DOOR_PANEL, IP)
   * New JSON with scaled Proto and Serie
   */
  // //Hard Coded testing
  // function applyScalingFactor1(data, productName) {
  //   const newData = structuredClone(data);

  //   for (const activityKey in newData.activities) {
  //     const activity = newData.activities[activityKey];

  //     // Extract activity name after "|" and trim for comparison only
  //     const activityName = activityKey.split("|")[1]?.trim();
  //     if (!activityName) continue;

  //     for (const roofKey of Object.keys(activity)) {
  //       if (
  //         [
  //           "extraWorkLoop",
  //           "reWorkLoop",
  //           "standardLoop",
  //           "checked",
  //           "order",
  //           "noOfLoops",
  //           "Proto",
  //           "Serie",
  //         ].includes(roofKey)
  //       )
  //         continue;

  //       const roof = activity[roofKey];
  //       const hasSubactivities =
  //         roof.subactivity && Object.keys(roof.subactivity).length > 0;

  //       if (hasSubactivities) {
  //         for (const subKey in roof.subactivity) {
  //           const trimmedSubKey = subKey.trim(); // trim for comparison
  //           if (isActivityInProduct(productName, trimmedSubKey)) {
  //             roof.subactivity[subKey].Proto *= SCALING_FACTOR;
  //             roof.subactivity[subKey].Serie *= SCALING_FACTOR;
  //           }
  //         }
  //       } else {
  //         if (isActivityInProduct(productName, activityName)) {
  //           roof.Proto *= SCALING_FACTOR;
  //           roof.Serie *= SCALING_FACTOR;
  //         }
  //       }
  //     }
  //   }

  //   return newData;
  // }

  // //Problem in this  applyScalingFactor1:
  // // Every time this function runs:
  // // It takes the current Proto / Serie
  // // Multiplies it again by the scaling factor
  // // Saves it back
  // // So values grow exponentially.
  // function applyScalingFactor1(data, productName, scalingFactors) {
  //   const newData = structuredClone(data);

  //   for (const activityKey in newData.activities) {
  //     const activity = newData.activities[activityKey];
  //     const activityName = activityKey.split("|")[1]?.trim();
  //     if (!activityName) continue;

  //     for (const roofKey of Object.keys(activity)) {
  //       if (
  //         [
  //           "extraWorkLoop",
  //           "reWorkLoop",
  //           "standardLoop",
  //           "checked",
  //           "order",
  //           "noOfLoops",
  //         ].includes(roofKey)
  //       )
  //         continue;

  //       const roof = activity[roofKey];
  //       if (!roof) continue;

  //       const hasSub =
  //         roof.subactivity && Object.keys(roof.subactivity).length > 0;

  //       if (hasSub) {
  //         for (const subKey in roof.subactivity) {
  //           const sub = roof.subactivity[subKey];
  //           if (!sub) continue;

  //           if (isActivityInProduct(productName, subKey.trim())) {
  //             if (typeof sub.Proto === "number") {
  //               //    alert("scalingFactors :"+ JSON.stringify(scalingFactors))
  //               sub.Proto *= scalingFactors.Proto;
  //             }
  //             if (typeof sub.Serie === "number") {
  //               sub.Serie *= scalingFactors.Serie;
  //             }
  //           }
  //         }
  //       } else {
  //         if (isActivityInProduct(productName, activityName)) {
  //           if (typeof roof.Proto === "number") {
  //             roof.Proto *= scalingFactors.Proto;
  //           }
  //           if (typeof roof.Serie === "number") {
  //             roof.Serie *= scalingFactors.Serie;
  //           }
  //         }
  //       }
  //     }
  //   }

  //   return newData;
  // }

  //Proto and Serie are always calculated from fixed “standard” values,
  //  never from already-scaled values.
  function applyScalingFactor(data, productName, scalingFactors) {
    if (!data || !data?.activities) return;
    // 🛑 Safety guard:
    // If scalingFactors is undefined/null, return original data
    // This prevents crashes during initial render when values are not loaded yet
    if (!scalingFactors) return data;

    // 🔄 Deep clone data to avoid mutating React state directly
    // structuredClone ensures nested objects are copied safely
    // const newData = structuredClone(data);
    const newData = safeDeepClone(data);

    // 🔁 Loop through all activities
    for (const activityKey in newData?.activities) {
      const activity = newData.activities[activityKey];

      // 📌 Extract activity name from key: "123 | Activity Name"
      const activityName = activityKey.split("|")[1]?.trim();
      if (!activityName) continue;

      // 🔁 Loop through roofs inside an activity
      for (const roofKey of Object.keys(activity)) {
        // 🚫 Skip non-calculation keys
        if (
          [
            "extraWorkLoop",
            "reWorkLoop",
            "standardLoop",
            "checked",
            "order",
            "noOfLoops",
          ].includes(roofKey)
        )
          continue;

        const roof = activity[roofKey];
        if (!roof) continue;

        // 🔍 Check if roof has subactivities
        const hasSub =
          roof.subactivity && Object.keys(roof.subactivity).length > 0;

        // =========================
        // 🔹 CASE 1: Subactivities
        // =========================
        if (hasSub) {
          for (const subKey in roof.subactivity) {
            const sub = roof.subactivity[subKey];
            if (!sub) continue;

            // ✅ Apply scaling only if activity belongs to selected product
            if (isActivityInProduct(productName, subKey.trim())) {
              // 🧠 STORE STANDARD VALUES (ONLY ONCE)
              // These remain constant forever and prevent exponential scaling
              sub._standardProto ??= sub.Proto;
              sub._standardSerie ??= sub.Serie;

              //  Recalculate Proto from STANDARD value
              // Always:  Round(standard × scalingFactor) as formula in excel
              if (typeof sub._standardProto === "number") {
                sub.Proto = Math.round(
                  sub._standardProto * scalingFactors.Proto,
                );
              }

              // 🔢 Recalculate Serie from STANDARD value
              if (typeof sub._standardSerie === "number") {
                sub.Serie = Math.round(
                  sub._standardSerie * scalingFactors.Serie,
                );
              }
            }
          }

          // =========================
          // 🔹 CASE 2: No subactivity
          // =========================
        } else {
          if (isActivityInProduct(productName, activityName)) {
            // 🧠 Store original (standard) values once
            roof._standardProto ??= roof.Proto;
            roof._standardSerie ??= roof.Serie;

            //  Recalculate Proto from STANDARD value
            // Always:  Round(standard × scalingFactor) as formula in excel
            if (typeof roof._standardProto === "number") {
              roof.Proto = Math.round(
                roof._standardProto * scalingFactors.Proto,
              );
            }

            if (typeof roof._standardSerie === "number") {
              roof.Serie = Math.round(
                roof._standardSerie * scalingFactors.Serie,
              );
            }
          }
        }
      }
    }

    // ✅ Return safely scaled data
    return newData;
  }

  // Helper function: check if activity exists in a specific product
  function isActivityInProduct(productName, activityName) {
    if (!activityName || !productName) return false;

    const product = SCALING_FACTOR_FOR_3D_ACTIVITY[productName];
    console.log("SCALING Factor \n Product : ",productName, "\n Data : ",product);
    if (!product) return false;

    return product.activities.includes(activityName);
  }

  //-----------Scaling Factor Ends-----------------

  //_____________Product mapping configuration start__________________
  // ------------------------------------------------------------
  // 1️⃣ CUSTOMER & PRODUCT SELECTION
  // ------------------------------------------------------------

  // ------------------------------------------------------------
  // 2️⃣ CUSTOMER-PRODUCT CONFIG DATA (FINAL TRUTH)
  // ------------------------------------------------------------
  const [customerProductData, setCustomerProductData] = useState({});

  const [customerProdData, setCustomerProdData] = useState({}); // shadow clone of customerProductData

  // ------------------------------------------------------------
  // 3️⃣ APPLY AUTOMATION WHEN CUSTOMER / PRODUCT CHANGES
  // ------------------------------------------------------------
  useEffect(() => {
    if (customerProdData && Object.keys(customerProdData).length > 0) {
      console.log("CPD --> Effect 2 : \n", customerProdData);
      setCustomerProductData(customerProdData);
    } else {
      console.log(
        "Applying automation for:",
        globalParams.Customer,
        globalParams.product,
      );
      // alert(globalParams.Customer + "--->" + globalParams.product);
      // const customerObj = CUSTOMER_PRODUCT_CONFIG[globalParams.Customer] || {};
      // const commonConfig = customerObj.Common || {};
      // const productConfig = customerObj[globalParams.product] || {};

      const customerObj = CUSTOMER_PRODUCT_CONFIG[globalParams.Customer] || {};
      console.log("CustomerObj keys:", Object.keys(customerObj)); // debug

      const commonConfig = customerObj.Common || {};
      const productConfig = customerObj[globalParams.product] || {};

      // alert(
      //   globalParams.Customer +
      //     " ||| " +
      //     globalParams.product +
      //     "\n\ncommonConfig:\n" +
      //     JSON.stringify(commonConfig, null, 2) +
      //     "\n\nproductConfig:\n" +
      //     JSON.stringify(productConfig, null, 2)
      // );

      setCustomerProductData({
        ...commonConfig,
        ...productConfig,
      });
    }
  }, [globalParams.Customer, globalParams.product, customerProdData]);

  // ------------------------------------------------------------
  // 4️⃣ USER OVERRIDES A SINGLE FIELD
  // ------------------------------------------------------------
  function updateCustomerProductField(field, value) {
    // alert(field + "-------->" + value);
    console.log("User changed:", field, "→", value);

    setCustomerProductData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  //_______________Product mapping configuration end________________

  //------------Start and end Date Start -------------
  // ----------------- Phase Flags -----------------
  const [phaseFlags, setPhaseFlags] = useState({
    phase_0: false,
    phase_1: false,
    phase_2: false,
    phase_3_4: false,
  });

  // ----------------- Manual Weeks Override -----------------
  const [manualWeeks, setManualWeeks] = useState({
    phase_0: 3,
    phase_1: 14,
    phase_2: 16,
    phase_3_4: 50,
  });

  // ----------------- Phase Weeks from External Data -----------------
  const phaseWeeks = T_TIMELINES_STD?.products?.["Headliner"] || {
    phase_0: 0,
    phase_1: 0,
    phase_2: 0,
    phase_3_4: 0,
  };

  const {
    phase_0: phase0Weeks,
    phase_1: phase1Weeks,
    phase_2: phase2Weeks,
    phase_3_4: phase34Weeks,
  } = phaseWeeks;

  // ----------------- SOP Parameters -----------------
  const [sopParams, setSopParams] = useState({
    startDate: "",
  });

  console.log("Hello Start Date after change: ", sopParams);

  function updateSopParam(key, value) {
    setSopParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updatePhaseFlag(key, value) {
    setPhaseFlags((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateManualWeeks(key, weeks) {
    setManualWeeks((prev) => ({
      ...prev,
      [key]: weeks,
    }));
  }

  //---to get Scaling factor start--

  function getScalingFactor(manualWeeks, standardWeeks) {
    if (!standardWeeks || standardWeeks <= 0) {
      return 1;
    }

    if (manualWeeks > standardWeeks) {
      return manualWeeks / standardWeeks;
    }

    return 1;
  }

  // 1️⃣ FIRST: compute scaling factors
  const scalingFactors = useMemo(() => {
    // DEFAULT (initial render safe)
    let proto = 1;
    let serie = 1;
    return {
      Proto:
        manualWeeks?.phase_1 != null && phase1Weeks != null
          ? getScalingFactor(manualWeeks.phase_1, phase1Weeks)
          : 1,

      Serie:
        manualWeeks?.phase_2 != null && phase2Weeks != null
          ? getScalingFactor(manualWeeks.phase_2, phase2Weeks)
          : 1,
    };
  }, [manualWeeks?.phase_1, manualWeeks?.phase_2, phase1Weeks, phase2Weeks]);

  // 2️⃣ THEN: use them
  useEffect(() => {
    setJsonData((prev) =>
      applyScalingFactor(prev, issueData?.product, scalingFactors),
    );
  }, [scalingFactors, issueData]);
  //---to get Scaling factor end--

  // ----------------- Helper Function -----------------
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // ----------------- Phase Dates Calculation -----------------
  const phaseDates = useMemo(() => {
    if (!sopParams.startDate) return {};

    const phases = [
      { key: "phase_0", weeks: manualWeeks.phase_0 },
      { key: "phase_1", weeks: manualWeeks.phase_1 },
      { key: "phase_2", weeks: manualWeeks.phase_2 },
      { key: "phase_3_4", weeks: manualWeeks.phase_3_4 },
    ];

    const result = {};
    let currentStart = new Date(`${sopParams.startDate}T00:00:00`);

    // OLD Logic
    // phases.forEach(({ key, weeks }) => {
    //   const safeWeeks = typeof weeks === "number" && weeks > 0 ? weeks : 0;

    //   const start = new Date(currentStart);
    //   const end = new Date(currentStart);

    //   // ✅ Selected → weeks * 7
    //   // ❌ Not selected → 1 day
    //   const days = phaseFlags[key] && safeWeeks > 0 ? safeWeeks * 7 + 1 : 1;

    //   end.setDate(end.getDate() + days - 1);

    //   result[key] = {
    //     start: formatDate(start),
    //     end: formatDate(end),
    //     weeks: phaseFlags[key] ? safeWeeks : 0,
    //   };

    //   currentStart = new Date(end);
    //   currentStart.setDate(currentStart.getDate() + 1);
    // });

    phases.forEach(({ key, weeks }) => {
      const start = new Date(currentStart);
      const end = new Date(currentStart);

      // Selected phase → actual duration
      // Non-selected or 0 weeks → only same day
      const days = phaseFlags[key] && weeks > 0 ? weeks * 7 + 1 : 1;

      end.setDate(end.getDate() + days - 1);

      result[key] = {
        start: formatDate(start),
        end: formatDate(end),
        weeks: phaseFlags[key] ? weeks : 0,
      };

      // ---------------------------------------
      // Move next phase start date
      // ---------------------------------------

      currentStart = new Date(end);

      // Only move to next day
      // if current phase actually has weeks
      if (phaseFlags[key] && weeks > 0) {
        currentStart.setDate(currentStart.getDate() + 1);
      }

      // else keep same date
    });

    return result;
  }, [sopParams.startDate,
    phaseFlags,
    manualWeeks,
    phase0Weeks,
    phase1Weeks,
    phase2Weeks,
    phase34Weeks,]);

  // ----------------- SOP End Date -----------------
  const sopEndDate = useMemo(() => {
    const dates = Object.values(phaseDates);
    if (!dates.length) return "";
    return dates[dates.length - 1].end;
  }, [phaseDates]);

  //-----------Start and End Date stop-------------

  // ================================================================
  // ⭐ UPDATE GLOBAL PARAM
  // Called whenever user toggles YES/NO

  //--------------------------

  function sayHello(data) {
    alert("Hello 👋 from useActivityLogic:", data);
    console.log("Hello 👋 from useActivityLogic:", data);
  }
  //--------------------------

  function updateGlobalParam(key, val) {
    // alert("Glocal Change :::" + key + "=======>" + val);
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
            name.includes("2D DELIVERABLES | NVH DRAWING") ||
            name.includes("2D DELIVERABLES | INTERNAL ASSEMBLY DRAWINGS"))
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

        // Exclude 2d , DM , GS  rest become 3d

        //key === "Short cut 3D" &&
        if (
          key === "DE" &&
          !name.includes("2D DELIVERABLES | CUSTOMER PART DRAWINGS") &&
          !name.includes("2D DELIVERABLES | CUSTOMER ASSY DRAWINGS") &&
          !name.startsWith("DM") &&
          !name.includes("DATA MANAGEMENT") &&
          !name.startsWith("GEO") &&
          !name.startsWith("ADD ON COMPONENTS") && // Exclude ADD ON COMPONENTS
          !name.includes("GEOMETRICAL") &&
          !name.includes("2D DELIVERABLES | INTERNAL DRAWING MAIN PARTS") &&
          !name.includes("2D DELIVERABLES | COP / INHERIT DRAWINGS") &&
          !name.includes("2D DELIVERABLES | FORMAT DRAWING") &&
          !name.includes("2D DELIVERABLES | ROLL DRAWING") &&
          !name.includes("2D DELIVERABLES | NVH DRAWING") &&
          !name.includes("2D DELIVERABLES | INTERNAL ASSEMBLY DRAWINGS") &&
          !name.startsWith("DATA PREPARATION | A SIDE PROPOSAL") // names are in CAPITALs
        ) {
          if (val === "YES") {
            activityObj.checked = true;
            // console.log("CATIA or NX : ", issueData.catiaNxValue);

            // updateGlobalActivitySubactivityCN(next, issueData.catiaNxValue); // calling shortcut to update File translation subactivity based on CATIA/NX selection
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

  function applyGlobalProductChange({ product, key, value }) {
    console.log("[GLOBAL CHANGE]", product, key, value);
    const NotAllowedActivities = [
      "2D DELIVERABLES",
      "DATA MANAGEMENT",
      "GEOMETRICAL STUDY",
      "ADD ON COMPONENT",
    ];

    Object.keys(jsonData.activities).forEach((activityName) => {
      // ❌ Skip non-3D activities
      const isNotAllowed = NotAllowedActivities.some((prefix) =>
        activityName.startsWith(prefix),
      );
      if (isNotAllowed) return;

      // ✅ 3D only
      if (jsonData.activities[activityName][product]) {
        updateProductValue(activityName, product, key, value);
      }
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
        // Set StandardLoop as 1
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

              // console.log(
              //   `✔ Updated ${activityName} → ${productName} → ${subName}`,
              //   sub
              // );
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

  // updating Based on CATIA/NX
  function updateGlobalActivitySubactivityCN(payload, translationType) {
    console.log(
      "=== [updateGlobalActivitySubactivityCN] Incoming Payload ===",
      JSON.stringify(payload, null, 2),
    );

    setJsonData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));

      // Loop all activities
      Object.entries(next.activities).forEach(([activityName, activityObj]) => {
        // Loop all products
        Object.entries(activityObj).forEach(([productName, productObj]) => {
          if (!productObj?.subactivity) return;

          // Get File translation subactivity directly
          const sub = productObj.subactivity["File translation"];

          if (!sub) return;

          // Only for required activity
          if (activityName === "GOVERNANCE | Monitoring & Coordination") {
            if (translationType === "CATIA") {
              sub.Proto = 0;
              sub.Serie = 0;
            } else if (translationType === "NX") {
              sub.Proto = 1;
              sub.Serie = 1;
            }

            console.log(
              `✔ Updated ${activityName} → ${productName} → File translation`,
              sub,
            );
          }
        });
      });

      console.log(
        "=== [updateGlobalActivitySubactivityCN] Updated jsonData ===",
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
      const NotAllowedActivities = [
        "2D DELIVERABLES",
        "DATA MANAGEMENT",
        "GEOMETRICAL STUDY",
        "ADD ON COMPONENT",
      ];

      if (key === "componentSelected" || key === "noOfComponent") {
        console.log(
          `[updateProductValue] Syncing '${key}' for 3D activities only`,
        );

        for (const activity in next.activities) {
          // ❌ Skip non-3D activities
          const isNotAllowed = NotAllowedActivities.some((prefix) =>
            activity.startsWith(prefix),
          );
          if (isNotAllowed) continue;

          // ❌ Skip same activity
          if (activity === activityName) continue;

          const productInActivity = next.activities[activity][productName];
          if (!productInActivity) continue;

          // ✅ Sync (3D only)
          productInActivity[key] = convertedValue;
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
        (key === "Proto" || key === "Serie" || key === "noOfComponent1") &&
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

  // 1st & 2nd Step Mould Start

  // =====================================================
  // 1. Initial State
  // =====================================================
  const groupedIncomingData = {
    "2 Steps Mould": {
      "1 Step Mould": 0,
      "2 Step Mould": 0,
    },
    "3D MOULD DESIGN": {
      "Pillar matching (fakes)": 0,
      "Wing bending": 0,
      "Hdl water jet nest definition": 0,
    },
    "DETAIL DESIGN": {
      Markings: 0,
      "Routing (airbag split/hinge line+roof harness+washer hose)": 0,
      "Perimeter and cutout orientation": 0,
      "Variants creation": 0,
      "Logistic study for Assembly (Assembly Packaging)": 0,
      "Thickness map by point": 0,
      "Cartography study (acoustic)": 0,
      "Hdl templates for dimensional control": 0,
    },
  };

  const [activityValues, setActivityValues] = useState(groupedIncomingData);

  // =====================================================
  // 2. DERIVED STATE (Replaces useState & useEffect)
  // Automatically recalculates when jsonData or activityValues change,
  // without triggering an extra re-render cycle.
  // =====================================================
  const { counter, activityFactors } = useMemo(() => {
    if (!jsonData) return { counter: 0, activityFactors: [] };

    const result = calculateScalingfactorAndCounterforOHSHelper(
      jsonData,
      activityValues,
    );
    console.log(
      "Derived Counter:",
      result.counter,
      "Derived Factors:",
      result.activityFactors,
    );

    return result;
  }, [jsonData, activityValues]);

  // =====================================================
  // 3. APPLY FACTORS TO JSON (Guarded Effect)
  // =====================================================
  useEffect(() => {
    if (!jsonData || !activityFactors || activityFactors.length === 0) return;

    const updated = applyMouldShortcutFactors(jsonData, activityFactors);

    setJsonData((prev) => {
      // CRITICAL GUARD: Only update state if the data actually changed.
      // This stops the infinite loop.
      if (JSON.stringify(prev) === JSON.stringify(updated)) {
        return prev;
      }
      return updated;
    });
  }, [activityFactors]); // Only re-run when factors actually change

  // =====================================================
  // 4. COUNTER SYNC (Guarded Effect)
  // Keeps "1 Step Mould" in sync with counter without looping
  // =====================================================
  useEffect(() => {
    if (counter > 0) {
      setActivityValues((prev) => {
        const section = prev["2 Steps Mould"];
        if (!section) return prev;

        const currentOneStep = Number(section["1 Step Mould"]) || 0;
        const currentTwoStep = Number(section["2 Step Mould"]) || 0;

        // Break the loop: If it's already in sync, do nothing
        if (currentOneStep + currentTwoStep === counter) {
          return prev;
        }

        // Otherwise, adjust 1 Step Mould based on the new counter
        return {
          ...prev,
          "2 Steps Mould": {
            ...section,
            "1 Step Mould": counter - currentTwoStep,
            "2 Step Mould": currentTwoStep,
          },
        };
      });
    }
  }, [counter]);

  // =====================================================
  // 5. USER INTERACTION HANDLER
  // =====================================================
  const isStepMouldSection = (sectionData) => {
    return "1 Step Mould" in sectionData && "2 Step Mould" in sectionData;
  };

  const updateActivityValue = (section, name, value) => {
    const safeValue = Math.max(0, Number(value) || 0);

    setActivityValues((prev) => {
      const prevSection = prev[section] || {};

      // Handle step mould logic manually
      if (
        isStepMouldSection(prevSection) &&
        (name === "1 Step Mould" || name === "2 Step Mould")
      ) {
        let oneStep = Number(prevSection["1 Step Mould"]) || 0;
        let twoStep = Number(prevSection["2 Step Mould"]) || 0;

        if (name === "2 Step Mould") {
          twoStep = Math.min(safeValue, counter);
          oneStep = counter - twoStep;
        } else if (name === "1 Step Mould") {
          oneStep = Math.min(safeValue, counter);
          twoStep = counter - oneStep;
        }

        return {
          ...prev,
          [section]: {
            ...prevSection,
            "1 Step Mould": oneStep,
            "2 Step Mould": twoStep,
          },
        };
      }

      // Normal fields
      return {
        ...prev,
        [section]: {
          ...prevSection,
          [name]: safeValue,
        },
      };
    });
  };

  // check working well to handle scaling factor of 1 step mould and 2 step mould
  function applyMouldShortcutFactors1(jsonData, activityFactors) {
    // =====================================================
    // 1. Safety Check
    // =====================================================
    // Ensure valid input data before processing
    if (!jsonData?.activities || !Array.isArray(activityFactors)) {
      return jsonData;
    }

    // =====================================================
    // 2. Clone Data (avoid mutating original input)
    // =====================================================
    const newData = JSON.parse(JSON.stringify(jsonData));

    // =====================================================
    // 3. Iterate through all activities
    // =====================================================
    for (const activityKey in newData.activities) {
      const activity = newData.activities[activityKey];

      // Extract activity name (after '|')
      const activityName = activityKey.split("|")[1]?.trim();
      if (!activityName) continue;

      // =====================================================
      // 4. Find Matching Factor (Normal Case)
      // =====================================================
      let matchedFactor = activityFactors.find((f) => f.name === activityName);

      // =====================================================
      // 5. SPECIAL CASE: "3d mould design"
      // =====================================================
      // If "2 Step Mould" exists in activityFactors:
      // → Use its factor instead of "3d mould design"
      // → Apply ONLY to specific 3 subactivities
      if (activityName === "3d mould design") {
        const twoStepFactor = activityFactors.find(
          (f) => f.name === "2 Step Mould",
        );

        if (twoStepFactor) {
          matchedFactor = twoStepFactor; // override normal match
        }
      }

      // If still no factor found → skip this activity
      if (!matchedFactor) continue;

      // Convert factor value to number
      const value = Number(matchedFactor.factor);

      // =====================================================
      // 6. Loop through activity sections (roof level)
      // =====================================================
      for (const roofKey of Object.keys(activity)) {
        // Skip system/internal fields
        if (
          [
            "extraWorkLoop",
            "reWorkLoop",
            "standardLoop",
            "checked",
            "order",
            "noOfLoops",
          ].includes(roofKey)
        )
          continue;

        const roof = activity[roofKey];
        if (!roof) continue;

        // Check if subactivities exist
        const hasSub =
          roof.subactivity && Object.keys(roof.subactivity).length > 0;

        // =====================================================
        // CASE 1: Subactivities exist
        // =====================================================
        if (hasSub) {
          for (const subKey in roof.subactivity) {
            const sub = roof.subactivity[subKey];
            if (!sub) continue;

            const subName = subKey.trim();

            // =====================================================
            // SPECIAL FILTER (Only for "3d mould design")
            // =====================================================
            // Only update these 3 subactivities:
            // - Covering A side
            // - Covering C side
            // - Covering Tooling surface
            if (
              activityName === "3d mould design" &&
              !(
                subName === "Covering A side" ||
                subName === "Covering C side" ||
                subName === "Covering Tooling surface"
              )
            ) {
              continue; // skip other subactivities
            }

            // Apply factor value
            sub.Serie = value;
          }
        }

        // =====================================================
        // CASE 2: No subactivities (direct roof level)
        // =====================================================
        else {
          // Skip root-level update for special case
          if (activityName === "3d mould design") continue;

          // Normal update
          roof.Serie = value;
        }
      }
    }

    // =====================================================
    // 7. Return Updated Data
    // =====================================================
    return newData;
  }
  // =====================================================

  function applyMouldShortcutFactors(jsonData, activityFactors) {
    // =====================================================
    // 1. SAFETY CHECK
    // =====================================================
    // Ensure valid input before processing
    if (!jsonData?.activities || !Array.isArray(activityFactors)) {
      return jsonData;
    }

    // =====================================================
    // 2. CLONE DATA
    // =====================================================
    // Prevent mutation of original object
    const newData = JSON.parse(JSON.stringify(jsonData));

    // =====================================================
    // 3. LOOP THROUGH ALL ACTIVITIES
    // =====================================================
    for (const activityKey in newData.activities) {
      const activity = newData.activities[activityKey];

      // Extract activity name after "|"
      // Example:
      // "123 | Wing bending" → "Wing bending"
      const activityName = activityKey.split("|")[1]?.trim();

      if (!activityName) continue;

      // =====================================================
      // 4. FIND MATCHING MOULD FACTOR
      // =====================================================
      // mouldFactor =
      // 1st / 2nd step mould factor
      //
      // Example:
      // mouldFactor = (user defined number / counter)
      let matchedFactor = activityFactors.find((f) => f.name === activityName);

      // =====================================================
      // 5. SPECIAL CASE : 3D MOULD DESIGN
      // =====================================================
      // If "2 Step Mould" factor exists:
      // → Use that factor instead of
      //   "3d mould design" factor
      if (activityName === "3d mould design") {
        const twoStepFactor = activityFactors.find(
          (f) => f.name === "2 Step Mould",
        );

        if (twoStepFactor) {
          matchedFactor = twoStepFactor;
        }
      }

      // Skip activity if no factor found
      if (!matchedFactor) continue;

      // =====================================================
      // 6. MOULD FACTOR
      // =====================================================
      // Factor derived from:
      // 1st / 2nd step mould calculation
      const mouldFactor = Number(matchedFactor.factor);

      // =====================================================
      // 7. LOOP THROUGH ROOF LEVELS
      // =====================================================
      for (const roofKey of Object.keys(activity)) {
        // Skip internal/system fields
        if (
          [
            "extraWorkLoop",
            "reWorkLoop",
            "standardLoop",
            "checked",
            "order",
            "noOfLoops",
          ].includes(roofKey)
        ) {
          continue;
        }

        const roof = activity[roofKey];

        if (!roof) continue;

        // Check if subactivities exist
        const hasSub =
          roof.subactivity && Object.keys(roof.subactivity).length > 0;

        // =====================================================
        // CASE 1 : SUBACTIVITIES EXIST
        // =====================================================
        if (hasSub) {
          for (const subKey in roof.subactivity) {
            const sub = roof.subactivity[subKey];

            if (!sub) continue;

            const subName = subKey.trim();

            // =====================================================
            // SPECIAL FILTER : 3D MOULD DESIGN
            // =====================================================
            // Only update below subactivities:
            // - Covering A side
            // - Covering C side
            // - Covering Tooling surface
            if (
              activityName === "3d mould design" &&
              !(
                subName === "Covering A side" ||
                subName === "Covering C side" ||
                subName === "Covering Tooling surface"
              )
            ) {
              continue;
            }

            // =====================================================
            // STORE ORIGINAL VALUES
            // =====================================================
            // Store only once to prevent
            // continuous multiplication during rerender
            sub._originalProto ??= Number(sub.Proto || 0);

            sub._originalSerie ??= Number(sub.Serie || 0);

            // =====================================================
            // DEFAULT PROTO CALCULATION
            // =====================================================
            // Formula:
            // original value * mould factor
            sub.Proto =
              sub._originalProto !== 0 ? sub._originalProto * mouldFactor : 0;

            // =====================================================
            // DEFAULT SERIE CALCULATION
            // =====================================================
            // Formula:
            // original value * mould factor
            sub.Serie =
              sub._originalSerie !== 0 ? sub._originalSerie * mouldFactor : 0;

            // =====================================================
            // SPECIAL SCALING CASE
            // =====================================================
            // Activities:
            // - Pillar matching (fakes)
            // - Wing bending
            //
            // scalingFactors = duration related factors
            //
            // Formula:
            // ROUND(original value * scaling factor)
            // THEN
            // multiply by mould factor
            //
            // Excel Equivalent:
            // ROUND(original * scaling,0)
            // *
            // mouldFactor
            if (
              activityName === "Pillar matching (fakes)" ||
              activityName === "Wing bending"
            ) {
              // =========================
              // SPECIAL PROTO SCALING
              // =========================
              if (sub._originalProto !== 0) {
                sub.Proto =
                  Math.round(sub._originalProto * scalingFactors.Proto) *
                  mouldFactor;
              }

              // =========================
              // SPECIAL SERIE SCALING
              // =========================
              if (sub._originalSerie !== 0) {
                sub.Serie =
                  Math.round(sub._originalSerie * scalingFactors.Serie) *
                  mouldFactor;
              }
            }
          }
        }

        // =====================================================
        // CASE 2 : NO SUBACTIVITIES
        // =====================================================
        else {
          // Skip root level for
          // "3d mould design"
          // because data exists only in subactivities
          if (activityName === "3d mould design") {
            continue;
          }

          // =====================================================
          // STORE ORIGINAL VALUES
          // =====================================================
          roof._originalProto ??= Number(roof.Proto || 0);

          roof._originalSerie ??= Number(roof.Serie || 0);

          // =====================================================
          // DEFAULT PROTO CALCULATION
          // =====================================================
          roof.Proto =
            roof._originalProto !== 0 ? roof._originalProto * mouldFactor : 0;

          // =====================================================
          // DEFAULT SERIE CALCULATION
          // =====================================================
          roof.Serie =
            roof._originalSerie !== 0 ? roof._originalSerie * mouldFactor : 0;

          // =====================================================
          // SPECIAL SCALING CASE
          // =====================================================
          // Activities:
          // - Pillar matching (fakes)
          // - Wing bending
          //
          // Formula:
          // ROUND(original value * scaling factor)
          // THEN
          // multiply by mould factor
          if (
            activityName === "Pillar matching (fakes)" ||
            activityName === "Wing bending"
          ) {
            // =========================
            // SPECIAL PROTO SCALING
            // =========================
            if (roof._originalProto !== 0) {
              roof.Proto =
                Math.round(roof._originalProto * scalingFactors.Proto) *
                mouldFactor;
            }

            // =========================
            // SPECIAL SERIE SCALING
            // =========================
            if (roof._originalSerie !== 0) {
              roof.Serie =
                Math.round(roof._originalSerie * scalingFactors.Serie) *
                mouldFactor;
            }
          }
        }
      }
    }

    // =====================================================
    // 8. RETURN UPDATED DATA
    // =====================================================
    return newData;
  }
  // 1st & 2nd Step Mould End

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

      twoDAntolinDrwaingsResult,
      twoDAntolinDrwaingsAggregatedTotal,

      twoDCustomerDrwaingsResult,
      twoDCustomerDrwaingsAggregatedTotal,

      dataManagementResults,
      dataMgmtAggregatedTotal,
      geometricalStudyResults,
      geoAggregatedTotal,
    } = calculateResults(finalJSON);
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

      twoDAntolinDrwaingsResult,
      twoDAntolinDrwaingsAggregatedTotal,

      twoDCustomerDrwaingsResult,
      twoDCustomerDrwaingsAggregatedTotal,

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

  // !!------ADD ON COMPONENT - Pending------!!

  // ================================================================
  //  for ADD on Component handling start :
  // ================================================================

  /* --------------------------------
     ADD-ON COMPONENT TEMP STATE
  -------------------------------- */
  const [addOnComponentState, setAddOnComponentState] = useState({});
  //--------------------------------

  // This Logic to handle  Add on Component  updated coming from Table "Add on Component Table"

  function applyAddOnComponentChange({ activityKey, field, value }) {
    //  Safety check:
    // Only handle activities that start with "ADD ON COMPONENTS |"
    if (!activityKey.startsWith("ADD ON COMPONENTS |")) return;

    /* =====================================================
     1 UPDATE UI STATE (for immediate visual update)
     -----------------------------------------------------
     This keeps table UI responsive before JSON re-renders
  ====================================================== */
    setAddOnComponentState((prev) => {
      //  Get current product values from JSON (if available)
      const jsonProduct =
        jsonData.activities?.[activityKey]?.["ADD ON COMPONENTS"] || {};

      //  Use previous UI state if exists, otherwise fallback to JSON values
      const previous = prev[activityKey] || jsonProduct;

      //  Create updated object with changed field
      const updated = {
        ...previous,
        [field]: value,
      };

      //  Determine latest number of components
      const noOfComponent = Number(
        field === "noOfComponent" ? value : (updated.noOfComponent ?? 0),
      );

      //  Determine latest componentSelected value
      const componentSelected =
        field === "componentSelected"
          ? value
          : (updated.componentSelected ?? false);

      //  Business Rule:
      // Component is considered selected ONLY if:
      // - componentSelected = true
      // - noOfComponent > 0
      
      // updated.componentSelected = componentSelected && noOfComponent > 0; // Bug Raised by Sagar

      updated.componentSelected = componentSelected;

      //  Sync helper flag (used in UI if needed)
      updated.checked = componentSelected && noOfComponent > 0;

      return {
        ...prev,
        [activityKey]: updated,
      };
    });

    /* =====================================================
     2️ UPDATE JSON DATA (REAL SOURCE OF TRUTH)
     -----------------------------------------------------
     This updates the main activity structure permanently
  ====================================================== */
    setJsonData((prevData) => {
      // Get the activity object
      const activity = prevData.activities[activityKey];
      if (!activity) return prevData;

      //  Get existing "ADD ON COMPONENTS" product
      const existingProduct = activity["ADD ON COMPONENTS"] || {};

      //  Update changed field
      const updatedProduct = {
        ...existingProduct,
        [field]: value,
      };

      //  Determine latest number of components
      const noOfComponent = Number(
        field === "noOfComponent" ? value : (updatedProduct.noOfComponent ?? 0),
      );

      //  Determine latest componentSelected value
      const componentSelected =
        field === "componentSelected"
          ? value
          : (updatedProduct.componentSelected ?? false);

      //  Apply business rule again (ensures consistency)
      updatedProduct.componentSelected = componentSelected && noOfComponent > 0;

      return {
        ...prevData,
        activities: {
          ...prevData.activities,
          [activityKey]: {
            ...activity,

            //  Update product section
            "ADD ON COMPONENTS": updatedProduct,

            //  IMPORTANT:
            // If component is selected → automatically check activity
            checked: updatedProduct.componentSelected,
          },
        },
      };
    });
  }
  // ================================================================
  //  for ADD on Component handling end :
  // ================================================================

  // ================================================================
  //  for Offer Related  on Component handling start :
  // ================================================================

  /**
   * Update Offer Resource / Weeks / SOW
   * activityKey: "TDL" | "3D Coordination" | "3D Standard"
   * field: "Resources" | "Weeks" | "SOW"
   */

  // -------------------------------
  // State: only user input
  // -------------------------------

  // -------------------------------
  // Update resource / weeks from UI
  // -------------------------------
  function UpdateofferResouce({ activityKey, field, value }) {
    setOfferData((prev) => {
      // ✅ SAFELY clone state to avoid DataCloneError
      const next = JSON.parse(JSON.stringify(prev));

      // Fallback just in case the key doesn't exist yet
      if (!next[activityKey]) {
        next[activityKey] = {};
      }

      // Handle both Resources and Weeks dynamically
      if (field === "Resources" || field === "Weeks") {
        next[activityKey][field] = value;
      }

      return next;
    });
  }

  // -------------------------------
  // CALCULATIONS (simple loop)
  // -------------------------------

  // const offerweeks = phaseDates?.phase_0?.weeks || 0;
  // function getOfferRows() {
  //   const rows = [];

  //   for (const activityKey in BASE_3D_OFFER) {
  //     const resources = offerData[activityKey]?.Resources || 0;
  //     const weeks = offerData[activityKey]?.Weeks || offerweeks;
  //     const hoursPerWeek = BASE_3D_OFFER[activityKey].hours;

  //     const totalHours = resources * weeks * hoursPerWeek;

  //     rows.push({
  //       activityKey,
  //       resources,
  //       weeks,
  //       hoursPerWeek,
  //       totalHours,
  //     });
  //   }

  //   return rows;
  // }
  

  // Example percentages table

  function getOfferRows() {
    const offerweeks = phaseDates?.phase_0?.weeks || 0;
    const rows = [];

    const BASE_3D_OFFER = get3DCostCenterHours(
      customerProductData,
      CECO_COST_SHEET_v8p13,
    );

    console.log("BASE_3D_OFFER :: " + JSON.stringify(BASE_3D_OFFER));

    for (const activityKey in BASE_3D_OFFER) {
      const resources = offerData[activityKey]?.Resources || 0;
      // const weeks = offerData[activityKey]?.Weeks || offerweeks;
      const hoursPerWeek = BASE_3D_OFFER[activityKey].hours;

      const totalHours = resources * offerweeks * hoursPerWeek;

      // Distributing Specific TDL or DE or COO into there activities based on Percentage
      const subActivities = percentages.map((p) => {
        const percent = p[activityKey] || 0;
        const hours = (totalHours * percent) / 100;

        return {
          activity: p.activity,
          percent,
          hours: hours.toFixed(2),
        };
      });

      // For TDL (ie TDL) => Output Row.
      // Similarly  DE (ie 3D Coordination) => Output Row.
      //Similarly COO (ie 3D Standard) => Output Row.
      rows.push({
        activityKey,
        resources,
        weeks: offerweeks,
        hoursPerWeek,
        totalHours,
        subActivities,
      });
    }

    return rows;
  }

  // Offer Rows to Offer Data conversion
  //mapped fucntion
  function convertOfferRowsToPayloads(offerRows) {
    if (!offerRows?.length) {
      return {
        resourcesPayload: {},
        percentagesPayload: {},
      };
    }

    /* -----CASE-1 → Build Resources Payload-----*/
    const resourcesPayload = {};

    offerRows.forEach((row) => {
      resourcesPayload[row.activityKey] = {
        Resources: row.resources,
        Weeks: row.weeks,
      };
    });

    /* --------------------------------
     CASE-2 → Build Base Percentage Table
  ---------------------------------*/
    const percentageBase = offerRows[0].subActivities.map((sub, index) => {
      const record = { activity: sub.activity };

      offerRows.forEach((row) => {
        record[row.activityKey] = row.subActivities[index]?.percent || 0;
      });

      return record;
    });

    /* --------------------------------
     Duplicate percentage table per key
  ---------------------------------*/
    const percentagesPayload = {};

    offerRows.forEach((row) => {
      percentagesPayload[row.activityKey] = percentageBase;
    });

    return {
      resourcesPayload,
      percentagesPayload,
    };
  }

  const offerRows = useMemo(() => getOfferRows(), [offerData, percentages]);

  const { resourcesPayload, percentagesPayload } = useMemo(() => {
    return convertOfferRowsToPayloads(offerRows);
  }, [offerRows]);

  //Offer initialize end

  const [percentageMsg, setPercentageMsg] = useState("");

  function updatePercentage(activityName, activityKey, value) {
    setPercentages((prev) => {
      // ✅ SAFELY clone state to avoid DataCloneError
      const updated = JSON.parse(JSON.stringify(prev));
      const lastIndex = updated.length - 1;

      // ---- Clamp individual cell between 0 and 100 ----
      value = Math.min(100, Math.max(0, Number(value) || 0));

      // Sum excluding edited and last row
      let sumExceptCurrent = 0;
      updated.forEach((p, i) => {
        if (i !== lastIndex && p.activity !== activityName) {
          sumExceptCurrent += Number(p[activityKey]) || 0;
        }
      });

      // Ensure total never exceeds 100
      const maxAllowed = Math.max(0, 100 - sumExceptCurrent);
      const finalValue = Math.min(value, maxAllowed);

      // Update edited row
      updated.forEach((p, i) => {
        if (p.activity === activityName && i !== lastIndex) {
          p[activityKey] = finalValue;
        }
      });

      // Recalculate sum
      let sum = 0;
      updated.forEach((p, i) => {
        if (i !== lastIndex) {
          sum += Number(p[activityKey]) || 0;
        }
      });

      // Remaining percentage
      const remaining = Math.max(0, Number((100 - sum).toFixed(2)));
      updated[lastIndex][activityKey] = remaining;

      // Message logic
      if (remaining === 0) {
        setPercentageMsg("100% reached. Can’t exceed further.");
      } else {
        setPercentageMsg("");
      }

      return updated;
    });
  }
  //offere ends:
  // ================================================================
  //  for indust Related  on Component handling :
  // ================================================================

  /**
   * Update Offer Resource / Weeks / SOW
   * activityKey: "TDL" | "3D Coordination" | "3D Standard"
   * field: "Resources" | "Weeks" | "SOW"
   */

  const industrializationRows = useMemo(
    () => getIndustrializationRows(),
    [industrializationData],
  );
  const { industPayload } = useMemo(() => {
    return convertIndustRowsToPayloads(industrializationRows);
  }, [industrializationRows]);

  function convertIndustRowsToPayloads(industrializationRows) {
    if (!industrializationRows?.length) {
      return {
        industPayload: {},
      };
    }

    /* -----Build Resources Payload-----*/
    const industPayload = {};

    industrializationRows.forEach((row) => {
      industPayload[row.activityKey] = {
        Resources: row.resources,
      };
    });

    return {
      industPayload,
    };
  }

  function UpdateIndustrializationResource({ activityKey, field, value }) {
    setIndustrializationData((prev) => {
      // safe clone approach to avoid the DataCloneError
      const next = JSON.parse(JSON.stringify(prev));

      // Fallback just in case the key doesn't exist yet
      if (!next[activityKey]) {
        next[activityKey] = {};
      }

      next[activityKey][field] = value;
      return next;
    });
  }

  function getIndustrializationRows() {
    const industrializationWeeks = phaseDates?.phase_3_4?.weeks || 0;
    const rows = [];

    const BASE_INDUSTRIALIZATION_PHASE = get3DCostCenterHours(
      customerProductData,
      CECO_COST_SHEET_v8p13,
    );

    console.log(
      "BASE_3D_OFFER :: " + JSON.stringify(BASE_INDUSTRIALIZATION_PHASE),
    );

    for (const activityKey in BASE_INDUSTRIALIZATION_PHASE) {
      const resources = industrializationData[activityKey]?.Resources || 0;

      const hoursPerWeek = BASE_INDUSTRIALIZATION_PHASE[activityKey].hours;

      const totalHours = resources * industrializationWeeks * hoursPerWeek;

      rows.push({
        activityKey,
        resources,
        weeks: industrializationWeeks,
        hoursPerWeek,
        totalHours,
      });
    }

    return rows;
  }

  //======================industrilization end====================

  //========== Data Management start =======

  const dataManagementRows = useMemo(
    () => getDataManagementRows(),
    [dataManagementData],
  );
  const { dataManagementPayload } = useMemo(() => {
    return convertDataManagementRowsToPayloads(dataManagementRows);
  }, [dataManagementRows]);

  function convertDataManagementRowsToPayloads(dataManagementRows) {
    if (!dataManagementRows?.length) {
      return {
        dataManagementPayload: {},
      };
    }

    /* -----Build Resources Payload-----*/
    const dataManagementPayload = {};

    dataManagementRows.forEach((row) => {
      dataManagementPayload[row.activityKey] = {
        Resources: row.resources,
      };
    });

    return {
      dataManagementPayload,
    };
  }

  function UpdateDataManagementResource({ activityKey, field, value }) {
    // ✅ Handle global weeks update separately
    if (field === "Weeks") {
      setOfferDMWeeks(value);
      return;
    }

    // ✅ Handle per-activity resource updates
    setDataManagementData((prev) => {
      const next = JSON.parse(JSON.stringify(prev));

      // 🛡 ensure activity exists
      if (!next[activityKey]) {
        next[activityKey] = {};
      }

      next[activityKey][field] = value;

      return next;
    });
  }

  function getDataManagementRows() {
    const rows = [];
    // const dataManagementWeeks = phaseDates?.phase_0?.weeks || 0;
    // ✅ Use offerDMWeeks state instead of phaseDates
    const dataManagementWeeks = offerDMWeeks || 0;

    for (const activityKey in DATA_MANAGEMENT_DATA_PHASE) {
      const resources = dataManagementData[activityKey]?.Resources || 0;

      const hoursPerWeek = getDataManagementHours(customerProductData, CECO_COST_SHEET_v8p13)

      const totalHours = resources * dataManagementWeeks * hoursPerWeek;

      rows.push({
        activityKey,
        resources,
        weeks: dataManagementWeeks,
        hoursPerWeek,
        totalHours,
      });
    }

    return rows;
  }

  //==========Data Management  end =========

  //---------------------OTHER TABLE Start================

  // =============================
  // OTHER TABLE
  // =============================

  // alert("initialData1 : " + (JSON.stringify(jsonData?.activityPayload) ))

  // =============================
  // FINAL PAYLOAD (SEND TO COST SHEET)
  // =============================
  const additionalOthersHoursAndCostPayload = {
    otherExpenses: otherTableData, // Additional Hour or Cost from user.
  };

  //Data collecting from user input
  // alert("Other activityPayload : "+JSON.stringify(activityPayload) )

  //====================OTHER TABLE ENDS==================

  //=========Start :MUA Sheet Logic===================================================

  // ===============================
  // INIT HELPER (ONLY ONCE)
  // ===============================
  // ===============================
  // INIT HELPER (ONLY ONCE)
  // ===============================
  // alert(
  //   " Initializing CostSheetHelperLogic\n\n" +
  //   JSON.stringify({ status: "START" }, null, 2)
  // );
  console.log(" Initializing CostSheetHelperLogic");

  const {
    CalculatePercentagePhaseWiseForDuration,
    calculateCostCenterYearWiseDetails,
    calculateHoursAndCosts,

    populatePhaseCosts, // to get years and phases both
    calculateHccBccPhaseMix,
  } = CostSheetHelperLogic();

  // =======================================================
  // LOGIC 1 : PHASE DATE → YEAR % DISTRIBUTION
  // =======================================================

  // alert(
  //   "🟦 LOGIC 1: Starting Phase → Year % Calculation"
  // );

  //For testing :
  // const phaseDatesInput1 = {
  //   phase_0: { start: "2025-01-01" },
  //   phase_1: { start: "2026-11-02"},
  //   phase_2: { start: "2027-09-03" },
  //   phase_3_4: {
  //     start: "2028-09-04",
  //     end: "2029-09-04"
  //   }
  // };

  let phaseDatesInput = null;

  if (phaseDates && Object.keys(phaseDates).length > 0) {
    phaseDatesInput = {
      phase_0: { start: phaseDates.phase_0?.start },
      phase_1: { start: phaseDates.phase_1?.start },
      phase_2: { start: phaseDates.phase_2?.start },
      phase_3_4: {
        start: phaseDates.phase_3_4?.start,
        end: phaseDates.phase_3_4?.end,
      },
    };
  }

  let phaseWisePercentages = null;

  if (phaseDatesInput) {
    phaseWisePercentages =
      CalculatePercentagePhaseWiseForDuration(phaseDatesInput);
  }

  // alert(
  //   "✅ LOGIC 1 OUTPUT — Phase Wise Percentages\n\n" +
  //   JSON.stringify(phaseWisePercentages)
  // );

  // =======================================================
  // LOGIC 2 : APPLY % TO SINGLE COST CENTER
  // =======================================================

  // alert(" LOGIC 2: Applying Phase % to SINGLE Cost Center");

  // const singleCostCenterPhaseTotals = {
  //   Offer: 100,
  //   Proto: 200,
  //   Serie: 300,
  //   Indust: 50
  // };

  // alert(
  //   " LOGIC 2 INPUT — Single Cost Center Totals\n\n" +
  //   JSON.stringify(singleCostCenterPhaseTotals, null, 2)
  // );

  // const yearWiseSingleCostCenter =
  //   applyPhasePercentagesPerYear(
  //     phaseWisePercentages,
  //     singleCostCenterPhaseTotals
  //   );

  // alert(
  //   "✅ LOGIC 2 OUTPUT — Year Wise Cost (Single)\n\n" +
  //   JSON.stringify(yearWiseSingleCostCenter, null, 2)
  // );

  // =======================================================
  // LOGIC 3 : MULTIPLE COST CENTERS
  // =======================================================

  //alert(" LOGIC 3: Applying Logic for ALL Cost Centers");

  // hard coded For testing
  // const costCentersData = {
  //   "G.A.Pune (IF)": {
  //     Offer:  40.00   ,
  //     Proto:  4994.99  ,
  //     Serie: 5161.54,
  //     Indust: 2539.13
  //   },
  //   "G. A. Deutschland": {
  //     Offer: 150,
  //     Proto: 250,
  //     Serie: 350,
  //     Indust: 75
  //   }
  // };

  // get above data from shared data
  //data recved fro  sharedRef.costCenters

  // This values are set in MainCostSheet : There we are performing aggregation logic
  const costCentersData = sharedRef.costCenters;
  //alert("costCentersData :"+JSON.stringify(costCentersData))

  /* The above code is a JavaScript code snippet that is commented out. It includes two `alert`
statements that are currently commented out. 
1)The first `alert` statement is displaying the contents
of a variable `phaseWisePercentages` using `JSON.stringify`, and 
2)the second `alert` statement is
displaying the contents of a variable `costCentersData` using `JSON.stringify`.  */
  // alert(
  //   " LOGIC 3 INPUT — phaseWisePercentages\n\n" +
  //   JSON.stringify(phaseWisePercentages)
  // );
  // alert(
  //   " LOGIC 3 INPUT — Each Aggregated Cost Center hours data  for each phases\n\n" +
  //   JSON.stringify(costCentersData)
  // );

  const allCostCentersYearWise = calculateCostCenterYearWiseDetails(
    phaseWisePercentages,
    costCentersData,
  );

  // alert(
  //   "✅ LOGIC 3 OUTPUT — All Cost Centers Year Wise  (hours) "
  //      +" distribution calculated from % give based on Duration \n\n" +
  //   JSON.stringify(allCostCentersYearWise, null, 2)
  // );

  // =======================================================
  // LOGIC 4 : HOURS × RATE = FINAL COST
  // =======================================================

  //  alert(" LOGIC 4: Calculating FINAL COST (Hours × Rate)");

  // const hoursByCostCenter = {
  //   "G.A.Pune (IF)": {
  //     2025: 30,
  //     2026: 170,
  //     2027: 300,
  //     2028: 50
  //   },
  //   "G. A. Deutschland": {
  //     2025: 45,
  //     2026: 255,
  //     2027: 350,
  //     2028: 75
  //   }
  // };

  const hoursByCostCenter = allCostCentersYearWise;

  // const CECO_COST_SHEET = {
  //   data: [
  //     {
  //       society: "G.A.Pune (IF)",
  //       ceco: "DBSIF",
  //       2025: 15.3,
  //       2026: 15.67,
  //       2027: 16.04,
  //       2028: 16.42,

  //     },
  //     {
  //       society: "G. A. Deutschland",
  //       ceco: "HALIF",
  //       2025: 18.2,
  //       2026: 18.7,
  //       2027: 19.1,   // 557.03
  //       2028: 19.6 ,  // 2477.636
  //             2029: 2   // 2477.636
  //     }
  //   ]
  // };

  const CECO_COST_SHEET_1 = {
    data: [
      {
        society: "Antolin China Investment",
        ceco: "ACIF",
        type: "HCC",
        2025: 47.47,
        2026: 47.94,
        2027: 48.68,
        2028: 49.56,
        2029: 50.46,
      },
      {
        society: "Antolin Czech Republic",
        ceco: "ACZIF",
        type: "HCC",
        2025: 57.34,
        2026: 58.23,
        2027: 59.09,
        2028: 59.97,
        2029: 60.86,
      },
      {
        society: "Antolin Mexico",
        ceco: "ATIF",
        type: "BCC",
        2025: 33.55,
        2026: 34.64,
        2027: 35.64,
        2028: 36.57,
        2029: 37.54,
      },
      {
        society: "G. A. Besancon",
        ceco: "CBTIF",
        type: "HCC",
        2025: 76.02,
        2026: 77.09,
        2027: 78.18,
        2028: 79.3,
        2029: 80.44,
      },

      {
        society: "G.A.Pune (IF)",
        ceco: "DBSIF",
        type: "BCC",
        2025: 15.3,
        2026: 15.67,
        2027: 16.04,
        2028: 16.42,
        2029: 16.82,
      },
      {
        society: "G.A.Pune (IL)",
        ceco: "DBSIL",
        type: "BCC",
        2025: 15.3,
        2026: 15.67,
        2027: 16.04,
        2028: 16.42,
        2029: 16.82,
      },
      {
        society: "G.A.Hyderabad",
        ceco: "DBSBF",
        type: "BCC",
        2025: 15.3,
        2026: 15.67,
        2027: 16.04,
        2028: 16.42,
        2029: 16.82,
      },

      {
        society: "G. A. UK",
        ceco: "GUKIF",
        type: "HCC",
        2025: 76.79,
        2026: 77.97,
        2027: 79.15,
        2028: 80.35,
        2029: 81.58,
      },
      {
        society: "G. A. Deutschland",
        ceco: "HALIF",
        type: "HCC",
        2025: 73.7,
        2026: 74.83,
        2027: 75.98,
        2028: 77.16,
        2029: 78.35,
      },
      {
        society: "G. A. France",
        ceco: "HRFIF",
        type: "HCC",
        2025: 75.5,
        2026: 76.68,
        2027: 77.88,
        2028: 79.11,
        2029: 80.36,
      },

      {
        society: "G. A. North America (IF)",
        ceco: "IAMIF",
        type: "HCC",
        2025: 120.37,
        2026: 122.66,
        2027: 124.65,
        2028: 126.54,
        2029: 128.47,
      },
      {
        society: "G. A. North America (IL)",
        ceco: "IAMIL",
        type: "HCC",
        2025: 120.37,
        2026: 122.66,
        2027: 124.65,
        2028: 126.54,
        2029: 128.47,
      },

      {
        society: "G. A. Ingeniería (IF)",
        ceco: "INGIF",
        type: "HCC",
        2025: 65.97,
        2026: 66.87,
        2027: 67.71,
        2028: 68.57,
        2029: 69.44,
      },
      {
        society: "G. A. Ingeniería (IL)",
        ceco: "INGIL",
        type: "HCC",
        2025: 65.97,
        2026: 66.87,
        2027: 67.71,
        2028: 68.57,
        2029: 69.44,
      },

      {
        society: "INTERTRIM",
        ceco: "IITIF",
        type: "BCC",
        2025: 28.47,
        2026: 29.56,
        2027: 30.55,
        2028: 31.48,
        2029: 32.34,
      },

      {
        society: "G. A. Japan",
        ceco: "JAPIF",
        type: "HCC",
        2025: 58.18,
        2026: 58.89,
        2027: 59.66,
        2028: 60.48,
        2029: 61.32,
      },
      {
        society: "G.A.Korea",
        ceco: "KORIF",
        type: "BCC",
        2025: 38.5,
        2026: 39.02,
        2027: 39.55,
        2028: 40.09,
        2029: 40.64,
      },
      {
        society: "G.A. Suzhou",
        ceco: "SUZIF",
        type: "BCC",
        2025: 30.01,
        2026: 30.41,
        2027: 31.06,
        2028: 31.81,
        2029: 32.59,
      },

      {
        society: "Antolin Tanger (IF)",
        ceco: "TGRIF",
        type: "BCC",
        2025: 16.17,
        2026: 16.4,
        2027: 16.63,
        2028: 16.87,
        2029: 17.11,
      },
      {
        society: "Antolin Tanger (IL)",
        ceco: "TGRIL",
        type: "BCC",
        2025: 16.17,
        2026: 16.4,
        2027: 16.63,
        2028: 16.87,
        2029: 17.11,
      },

      {
        society: "G. A. Vosges",
        ceco: "VOSIF",
        type: "HCC",
        2025: 50.46,
        2026: 51.4,
        2027: 52.36,
        2028: 53.34,
        2029: 54.34,
      },
      {
        society: "Guangzhou Antolin",
        ceco: "CGZIF",
        type: "BCC",
        2025: 29.79,
        2026: 30.09,
        2027: 30.57,
        2028: 31.13,
        2029: 31.71,
      },

      {
        society: "External Engineering (IF)",
        ceco: "xxxIF",
        type: "HCC",
        2025: 45.0,
        2026: 45.0,
        2027: 45.0,
        2028: 45.0,
        2029: 45.0,
      },
      {
        society: "External Engineering HCC (IF)",
        ceco: "xxxIF_HCC",
        type: "HCC",
        2025: 70.0,
        2026: 70.0,
        2027: 70.0,
        2028: 70.0,
        2029: 70.0,
      },
      {
        society: "External Engineering BCC (IF)",
        ceco: "xxxIF_BCC",
        type: "BCC",
        2025: 28.0,
        2026: 28.0,
        2027: 28.0,
        2028: 28.0,
        2029: 28.0,
      },
      {
        society: "External Engineering HCC (IL)",
        ceco: "xxxIL",
        type: "HCC",
        2025: 73.7,
        2026: 74.83,
        2027: 75.98,
        2028: 77.16,
        2029: 78.35,
      },
    ],
  };

  // v8p13 : Updated cost sheet rates based on latest data received (May 2026)
  const CECO_COST_SHEET = CECO_COST_SHEET_v8p13;

  // alert(
  //   " LOGIC 4 INPUT — Hours By Cost Center\n\n" +
  //   JSON.stringify(hoursByCostCenter, null, 2)
  // );

  // alert(
  //   " LOGIC 4 INPUT — CECO Cost Sheet\n\n" +
  //   JSON.stringify(CECO_COST_SHEET, null, 2)
  // );

  const finalHoursAndCosts = calculateHoursAndCosts(
    hoursByCostCenter,
    CECO_COST_SHEET,
  );

  // alert(
  //   " FINAL OUTPUT — UI READY COST SHEET\n\n" +
  //   JSON.stringify(finalHoursAndCosts, null, 2)
  // );

  // // //===============================
  // // END OF DEBUG FLOW
  // // ===============================
  // alert(
  //   " ALL LOGICS EXECUTED SUCCESSFULLY\n\n" +
  //   JSON.stringify({ completed: true }, null, 2)
  // );

  console.log("==================FINAL=================");

  const FINAL_DEBUG_DATA1 = {
    input1: {
      phaseDatesInput,
    },
    output1: {
      phaseWisePercentages,
    },

    input2: {
      phaseWisePercentages, // (output 1)
      costCentersData, // Aggregated Cost center from MUA Sheet
    },
    output2: {
      allCostCentersYearWise, // Distributed Hours in years
    },

    input3: {
      hoursByCostCenter,
      CECO_COST_SHEET,
    },
    output3: {
      finalHoursAndCosts,
      hoursByCostCenter,
      CECO_COST_SHEET,
    },

    // All Inputs
    inputs: {
      phaseDatesInput,
      CECO_COST_SHEET,

      costCentersData,
      hoursByCostCenter,
    },

    // 🔹 All Outputs
    outputs: {
      phaseWisePercentages,
      allCostCentersYearWise,
      finalHoursAndCosts,
    },
  };

  const CECO_COST_SHEET_YearANDPhases123 = {
    data: [
      {
        2025: 47.47,
        2026: 47.94,
        2027: 48.68,
        2028: 49.56,
        2029: 50.46,
        society: "Antolin China Investment",
        ceco: "ACIIF",
        type: "HCC",
        phase_0: 0,
        phase_1: 0,
        phase_2: 0,
        phase_3_4: 0,
      },
    ],
  };

  // this is needed - v8p13 (update require when cost change)
  const CECO_COST_SHEET_YearANDPhases1 =CECO_COST_SHEET_v8p13; // Updated cost sheet rates based on latest data received (May 2026) with phase details

  let CECO_COST_SHEET_YearANDPhases = null;

  // if phaseDatesInput not available then calculation cant be done
  if (phaseFlags) {
    CECO_COST_SHEET_YearANDPhases =
      populatePhaseCosts(
        CECO_COST_SHEET_YearANDPhases1,
        phaseWisePercentages,
      ) || CECO_COST_SHEET_YearANDPhases1;
  }

  //alert("CECO_COST_SHEET_YearANDPhases.data : "+JSON.stringify(CECO_COST_SHEET_YearANDPhases.data))

  let resultHCC_BCC = null;
  let HCC_BCC_DyanamicOutPut = null;
  if (CECO_COST_SHEET_YearANDPhases != null) {
    // console.log("---- DEBUG START ----");

    // console.log("Customer Product Data:", customerProductData);
    console.log(
      "Looking for societies:",
      customerProductData["3D_TDL"],
      "and",
      customerProductData["3D_SW"],
    );

    //  normalization helper (To handle Space in cost center)
    const normalize = (v) =>
      v?.toLowerCase().replace(/\s+/g, "").replace(/[().]/g, "").trim();

    const resultHCC_BCC = CECO_COST_SHEET_YearANDPhases.data
      .filter((item) => {
        //  same logic, just normalized
        const matchTDL =
          normalize(item.society) === normalize(customerProductData["3D_TDL"]);
        const matchSW =
          normalize(item.society) === normalize(customerProductData["3D_SW"]);

        //console.log("Checking item:", item.society);
        //console.log("   == TDL ?", matchTDL);
        //console.log("   == SW  ?", matchSW);

        // no mactch
        if (!matchTDL && !matchSW) {
          // console.log("    Not matching. Possible reason:");
          // console.log("      item.society:", `"${item.society}"`);
          // console.log(
          //   "      TDL value   :",
          //   `"${customerProductData["3D_TDL"]}"`
          // );
          // console.log(
          //   "      SW value    :",
          //   `"${customerProductData["3D_SW"]}"`
          // );
          // console.log(
          //   "      Lengths     :",
          //   item.society?.length,
          //   customerProductData["3D_TDL"]?.length,
          //   customerProductData["3D_SW"]?.length
          // );
          // //  extra debug (normalized view)
          // console.log("      Normalized item :", normalize(item.society));
          // console.log("      Normalized TDL  :", normalize(customerProductData["3D_TDL"]));
          // console.log("      Normalized SW   :", normalize(customerProductData["3D_SW"]));
        }
        //// no TDL or DE cost center match
        else if (matchTDL || matchSW) {
          //  console.log("   ✅  Matching");
          // console.log("   ✅   item.society:", `"${item.society}"`);
        }

        return matchTDL || matchSW;
      })
      .reduce((acc, item) => {
        if (!acc[item.society]) {
          acc[item.society] = {};
        }

        acc[item.society][item.type] = item;

        // when both cost centers are same
        const sameCostCenter =
          normalize(customerProductData["3D_TDL"]) ===
          normalize(customerProductData["3D_SW"]);

        // if only one type exists, create mirror copy
        if (sameCostCenter) {
          if (item.type === "BCC" && !acc[item.society]["HCC"]) {
            acc[item.society]["HCC"] = { ...item, type: "HCC" };
          }

          if (item.type === "HCC" && !acc[item.society]["BCC"]) {
            acc[item.society]["BCC"] = { ...item, type: "BCC" };
          }
        }

        return acc;
      }, {});

    console.log("Filtered Result:", JSON.stringify(resultHCC_BCC, null, 2));
    // console.log("---- DEBUG END ----");

    //==========
    console.log(
      "phaseWisePercentages Result:",
      JSON.stringify(phaseWisePercentages, null, 2),
    );

    // Geting dyanamic Output For HCC_BCC_Distribution
    HCC_BCC_DyanamicOutPut = calculateHccBccPhaseMix(
      resultHCC_BCC,
      phaseWisePercentages,
    );

    //alert("getHccBccDynamicOutput before :"+ JSON.stringify(getHccBccDynamicOutput)); // Final Excel-like table

    //Storing Shared store HCCBCC  used for Total Cost Sheet  (as cost muliplier for COO & DM)
    const HCC_BCC_table = HCC_BCC_DyanamicOutPut?.mixedDistributionTable ?? [];
    //alert("HCC_BCC_table   :"+ JSON.stringify(HCC_BCC_table)); // Final Excel-like table

    setHccBccDynamicOutput(HCC_BCC_table);

    console.log(
      "calculateHccBccPhaseMix output 1 :" +
        JSON.stringify(HCC_BCC_DyanamicOutPut?.purePhaseValues),
    ); // Pure HCC/BCC phase values

    console.log(
      "calculateHccBccPhaseMix output 2 :" +
        JSON.stringify(HCC_BCC_DyanamicOutPut?.mixedDistributionTable),
    ); // Final Excel-like table

    //alert("getHccBccDynamicOutput after  :"+ JSON.stringify(getHccBccDynamicOutput)); // Final Excel-like table
  }

  //output of Result :
  /*
{
  "TDL": {
    "HCC": {
      "2025": 50.00,
      "2026": 51.00,
      "2027": 52.00,
      "2028": 53.00,
      "2029": 54.00,
      "society": "TDL",
      "ceco": "TDL001",
      "type": "HCC",
      "phase_0": 10,
      "phase_1": 20,
      "phase_2": 30,
      "phase_3_4": 40
    }
  },
  "DE": {
    "BCC": {
      "2025": 60.00,
      "2026": 61.00,
      "2027": 62.00,
      "2028": 63.00,
      "2029": 64.00,
      "society": "DE",
      "ceco": "DE001",
      "type": "BCC",
      "phase_0": 5,
      "phase_1": 15,
      "phase_2": 25,
      "phase_3_4": 55
    }
  }
}

*/

  //Take
  //3D HCC	  i.e TDL COst Center  ==> G. A. Ingeniería (IF)
  //3D BCC	i.e DE COst Center  ==>G.A.Pune (IF)

  // alert("phaseWisePercentages :"+JSON.stringify(phaseWisePercentages))

  //alert("CECO_COST_SHEET_YearANDPhases1 :"+JSON.stringify(CECO_COST_SHEET_YearANDPhases))

  //alert("TDL :: "+customerProductData["3D_TDL"] +" |||| DE ::: " + customerProductData["3D_SW"] )

  const FINAL_DEBUG_DATA = {
    input1: { phaseDatesInput },
    output1: { phaseWisePercentages },

    input2: { phaseWisePercentages, costCentersData },
    output2: { allCostCentersYearWise },

    input3: { hoursByCostCenter, CECO_COST_SHEET },
    output3: { finalHoursAndCosts, hoursByCostCenter, CECO_COST_SHEET },

    output4: { CECO_COST_SHEET_YearANDPhases },

    // For HCC & BCC as per CECO:
    // It is used for Mulplication for Items like COO or Data managemnet where there is no cost center:
    // It internally refer bases on HCC --> TDL cost center , BCC --> DE cost Center
    HCC_BCC_DyanamicOutPut051: HCC_BCC_DyanamicOutPut?.purePhaseValues,
    HCC_BCC_DyanamicOutPut052: HCC_BCC_DyanamicOutPut?.mixedDistributionTable,
  };

  //alert("HCC_BCC_DyanamicOutPut051 ::: "+JSON.stringify(HCC_BCC_DyanamicOutPut?.purePhaseValues))
  //alert("HCC_BCC_DyanamicOutPut052 ::: "+JSON.stringify(HCC_BCC_DyanamicOutPut?.mixedDistributionTable))

  //alert("TDL :: "+customerProductData["3D_TDL"] +" |||| DE ::: " + customerProductData["3D_SW"] )

  console.log("\n================= FINAL MUA SHEET DATA =================");
  console.log(JSON.stringify(FINAL_DEBUG_DATA1, null, 2));
  console.log("========================================================\n");

  console.log("\n================= FINAL MUA SHEET DATA2 =================");
  console.log(JSON.stringify(FINAL_DEBUG_DATA, null, 2));
  console.log("========================================================\n");
  //========ENDS : MUA SHeeet Logic Ends============================================

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
    // ✅ expose simple method
    sayHello,

    customerProductData,
    updateCustomerProductField,

    //Start and sop date :
    //sopParams,
    sopEndDate,
    //updateSopParam,

    //phaseFlags,
    //updatePhaseFlag,

    // sopParams, // SOP parameters (startDate, etc.)
    // updateSopParam, // Function to update SOP params
    // phaseFlags, // Active phase flags
    // updatePhaseFlag, // Function to update phase flags
    // phaseDates, // Calculated start and end dates per phase
    // sopEndDate, // Final end date based on selected phases
    // manualWeeks,
    // updateManualWeeks,

    // ----------------- Return Hook State & Actions -----------------
    sopParams,
    updateSopParam,
    phaseFlags,
    updatePhaseFlag,
    manualWeeks,
    updateManualWeeks,
    phaseDates,
    sopEndDate,

    // ADD ON COMPONENT
    addOnComponentState,
    applyAddOnComponentChange,

    // Offer
    offerData,
    offerRows: getOfferRows(),
    UpdateofferResouce,
    updatePercentage, // handle  % for offer activity

    // Percentages
    percentages,
    percentageMsg,
    resourcesPayload,
    percentagesPayload,

    // Industrialization
    industrializationData,
    industrializationRows: getIndustrializationRows(),
    UpdateIndustrializationResource,
    industPayload,

    // Data Management
    dataManagementData,
    offerDMWeeks, // DM Offer phase weeks
    dataManagementRows: getDataManagementRows(),
    UpdateDataManagementResource,
    dataManagementPayload,

    // expose to UI
    otherTableData,
    updateOtherTableParam,

    // expose to cost sheet
    additionalOthersHoursAndCostPayload, // Additional hours and Cost from Other(Travel ,Licenses, Material)

    //For Readonly table:
    FINAL_DEBUG_DATA,
    CECO_COST_SHEET_YearANDPhases,

    // step Mould Short Cut
    counter,
    activityValues,
    activityFactors,
    updateActivityValue,
    //PDF data
    pdfData,
  };
}
