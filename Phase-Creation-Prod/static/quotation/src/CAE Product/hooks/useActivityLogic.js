// hooks/useActivityLogic.js
import { useState, useMemo, useContext, useEffect } from "react";
import { caeInitialData } from "../data/caeInitialData";
import { useCalculations } from "./useCalculations";
import { StorageContext } from "../../StorageContext";
import { sharedRef } from "../../shared/sharedStore";
import { CAE_SHORTCUT } from "../data/CAE_SHORTCUT";
import { useActivityLogic as useCADActivityLogic } from "../../CAD Product/hooks/useActivityLogic";
import { getCAEShortcut } from "../data/ShortCuts CheckUnchecked Activity/Logic To fetch ShortCut for Product";

import { getCheckedActivities } from "../utils/CAE_Pdf";

import { shortcutConfig } from "../data/shortcust for Assy";

export function useActivityLogic() {
  // -------------------------
  // 1️⃣ BASE DATA
  // -------------------------

  const [data, setData] = useState(caeInitialData);

  // Shortcut 
  const [modifiedShortcuts, setModifiedShortcuts] = useState({});
  const [shortcutValues, setShortcutValues] = useState({});
  // -------------------------
  // 2️⃣ GLOBAL PARAMETERS (ON/OFF)
  // -------------------------
  const [globalTDL, setGlobalTDL] = useState(0); // Global CAE TDL Off by default
  const [globalDE, setGlobalDE] = useState(0); // Global CAE DE Off by default

  const [product, setProduct] = useState("Headliner"); // Default product name

  const {
    storedDataCae,
    issueData,
    handleSaveCae,
    selectedVersion,
    currentVersion,
    statusValue,
  } = useContext(StorageContext);

  // const cadLogic = useCADActivityLogic();
  // const customerName = cadLogic?.globalParams.Customer;

  //OLD Use Effect
  // useEffect(() => {
  //   if (!storedDataCae) return;

  //   console.log("Hello CAE", storedDataCae);

  //   if (storedDataCae.Global) {
  //     console.log("Hello CAE Effect --> No ShortCut", storedDataCae.Global);

  //     setGlobalTDL(storedDataCae.Global.TDL);
  //     setGlobalDE(storedDataCae.Global.DE);
  //   } else {
  //     setData({
  //       Global: {
  //         TDL: globalTDL,
  //         DE: globalDE,
  //       },
  //       activities: storedDataCae.activities,
  //     });
  //     if (issueData) {
  //       console.log("Hello CAE Effect --> Yes ShortCut", issueData);
  //       const customerName = issueData.customer;
  //       applyShortcutForCustomer(customerName, CAE_SHORTCUT, setData);

  //       return;
  //     }
  //   }

  //   setData({
  //     Global: {
  //       TDL: globalTDL,
  //       DE: globalDE,
  //     },
  //     activities: storedDataCae.activities,
  //   });
  // }, [storedDataCae, issueData]);

  //NEW Use Effect
  useEffect(() => {
    if (!storedDataCae) return;

    console.log("Hello CAE", storedDataCae);
    
    if (issueData?.product) {
      console.log("CAE Product Effect ?? ",issueData.product)
      setProduct(issueData.product);
    }

    // ✅ Case 1: Global exists → NO shortcut
    if (storedDataCae.Global) {
      console.log("Hello CAE Effect --> No ShortCut");

      setGlobalTDL(storedDataCae.Global.TDL);
      setGlobalDE(storedDataCae.Global.DE);

      if (storedDataCae?.modifiedShortcutsAssyCAE) {
        setModifiedShortcuts(storedDataCae?.modifiedShortcutsAssyCAE);
        setShortcutValues(storedDataCae?.modifiedShortcutsAssyCAE);
        console.log("Set shortcut : ", modifiedShortcuts, "\n Stored shortcut : ", storedDataCae?.modifiedShortcutsAssyCAE);
      } else {
        setModifiedShortcuts({});
        setShortcutValues({});
        console.log("No modified shortcuts found in storedDataCae.");
      }

      setData({
        Global: storedDataCae.Global,
        activities: storedDataCae.activities,
        modifiedShortcutsAssyCAE: storedDataCae?.modifiedShortcutsAssyCAE, // Load modified shortcuts if available
      });

      return; // ⛔ IMPORTANT → Prevent shortcut execution
    }

    // if (storedDataCae?.modifiedShortcutsAssyCAE) {
    //   setModifiedShortcuts(storedDataCae?.modifiedShortcutsAssyCAE);
    //   console.log("Set shortcut 1 : ", modifiedShortcuts, "\n Stored shortcut : ", storedDataCae?.modifiedShortcutsAssyCAE);
    // }

    // ✅ Case 2: Global does NOT exist → Apply shortcut

    setData({
      Global: {
        TDL: globalTDL,
        DE: globalDE,
      },
      activities: storedDataCae.activities,
      modifiedShortcutsAssyCAE: storedDataCae?.modifiedShortcutsAssyCAE || {},
    });

    setModifiedShortcuts(storedDataCae?.modifiedShortcutsAssyCAE || {});
    setShortcutValues(storedDataCae?.modifiedShortcutsAssyCAE || {});

    if (issueData?.customer) {
      console.log("Hello CAE Effect --> Yes ShortCut");

      applyShortcutForCustomer(issueData.customer, getCAEShortcut(issueData.product), setData);
    }
  }, [storedDataCae, issueData]);
  // useEffect(() => {
  //   //Apply shortcut .Short cut should  overide once saved CAE data

  //   if (!customerName) return;

  //   applyShortcutForCustomer(customerName, CAE_SHORTCUT, setData);
  // }, [customerName]);

  // -------------------------
  // 3️⃣ UPDATE ACTIVITY
  // -------------------------
  const updateActivity1 = (key, field, value) => {
    setData((prev) => {
      const copy = structuredClone(prev);
      copy.activities[key][field] = value;
      return copy;
    });
  };

  // PROTO and Serie in Sync
  const updateActivity = (key, field, value) => {
    setData((prev) => {
      const copy = structuredClone(prev);

      // -----------------------------------
      //  Update current activity
      // -----------------------------------
      copy.activities[key][field] = value;

      // -----------------------------------
      //  Sync all proto values
      // -----------------------------------
      if (field === "proto") {
        Object.keys(copy.activities).forEach((activityKey) => {
          copy.activities[activityKey].proto = value;
        });
      }

      // -----------------------------------
      //  Sync all Serie values
      // -----------------------------------
      if (field === "serie") {
        Object.keys(copy.activities).forEach((activityKey) => {
          copy.activities[activityKey].serie = value;
        });
      }

      return copy;
    });
  };

  //=======Assy Short CUts starts=====

  const updateShortcutLoops = (shortcutName, noOfLoops) => {
    console.log("======================================");
    console.log("Shortcut Name :", shortcutName);
    console.log("No Of Loops   :", noOfLoops);

    // -----------------------------------
    // 1️⃣ Update Shortcut UI value
    // -----------------------------------
    setShortcutValues((prev) => ({
      ...prev,
      [shortcutName]: noOfLoops,
    }));

    // -----------------------------------
    // 2️⃣ Store Modified Shortcut
    // -----------------------------------
    setModifiedShortcuts((prev) => {
      const copy = {
        ...prev,
        [shortcutName]: noOfLoops,
      };

      console.log("======================================");
      console.log("Modified Shortcuts");
      console.log(copy);

      return copy;
    });

    // -----------------------------------
    // 3️⃣ Update Activities
    // -----------------------------------
    setData((prev) => {
      const copy = structuredClone(prev);

      const shortcut =
        shortcutConfig.Product[product]?.ShortCuts?.[shortcutName];

      const shortcutForCheck =
        shortcutConfig.Product[product]?.ShortCutsChecked?.[shortcutName];

      if (!shortcut && !shortcutForCheck) {
        console.error("Shortcut configuration not found:", shortcutName);
        return copy;
      }

      Object.keys(copy.activities).forEach((activityKey) => {
        const activity = copy.activities[activityKey];

        // ---------------------------------
        // Special Case : Pillar
        // ---------------------------------
        if (product === "Pillar") {
          if (
            shortcut?.activities?.includes(activityKey)
          ) {
            console.log("Pillar Updating :", activityKey);

            // Update Loop
            activity.noOfLoops = noOfLoops;

            // Update Checked
            activity.checked = Number(noOfLoops) > 0;
          }

          return; // Skip normal logic
        }

        // ---------------------------------
        // Existing Logic (Other Products)
        // ---------------------------------

        // Update Loops
        if (shortcut?.activities?.includes(activityKey)) {
          console.log("Updating Loop :", activityKey);
          activity.noOfLoops = noOfLoops;
        }

        // Update Checked
        if (shortcutForCheck?.activities?.includes(activityKey)) {
          console.log("Updating Checked :", activityKey);

          activity.checked = Number(noOfLoops) > 0;

          console.log(
            "Checked Status :",
            activity.checked,
            "(noOfLoops =", noOfLoops, ")"
          );
        }
      });


      console.log("======================================");
      console.log("Shortcut synchronization completed.");

      return copy;
    });
  };

  //========assy short cuts end==

  // -------------------------
  // 4️⃣ CALCULATION (derived)
  // -------------------------
  const calculation = useMemo(() => {
    if (!data?.activities) return null;

    return useCalculations(data.activities, globalTDL, globalDE);
  }, [data?.activities, globalTDL, globalDE]);

  // -------------------------
  // 5️⃣ GLOBAL OBJECT
  // -------------------------
  const Global = { TDL: globalTDL, DE: globalDE };

  // -------------------------
  // 6️⃣ APPLY GLOBAL RULES (for final JSON)
  // -------------------------
  const applyGlobalRules = (activities, global) => {
    return Object.fromEntries(
      Object.entries(activities).map(([key, activity]) => [
        key,
        {
          ...activity,
          TDL: global.TDL === 1 ? activity.TDL : 0,
          DE: global.DE === 1 ? activity.DE : 0,
        },
      ]),
    );
  };

  // -------------------------
  // 7️⃣ BUILD TEMP JSON (snapshot)
  // -------------------------
  const buildTempJson = () => {
    const finalData = {
      Global,
      // activities: applyGlobalRules(calculation.activities, Global),
      activities: calculation.activities,
    };

    //  Append only
    finalData.CAE_PDF_DATA = getCheckedActivities(finalData);
    finalData.modifiedShortcutsAssyCAE = modifiedShortcuts  // Storing short changess

    return finalData;
  };
  // const buildTempJson = () => ({
  //   Global,
  //   activities: calculation.activities,
  // });

  // -------------------------
  // 8️⃣ BUILD FINAL JSON (apply global rules)
  // -------------------------
  const buildFinalJson = () => {
    const finalData = {
      Global,
      activities: applyGlobalRules(calculation.activities, Global),
    };

    // Append only
    finalData.CAE_PDF_DATA = getCheckedActivities(finalData);

    return finalData;
  };
  // const buildFinalJson = () => ({
  //   Global,
  //   activities: applyGlobalRules(calculation.activities, Global),
  // });

  // -------------------------
  // 🔄 AUTO-LOAD CAE DATA TO SHARED REF (without saving)
  // -------------------------
  const autoLoadCaeDataToSharedRef = () => {
    if (!calculation) return;

    const iterationTotal =
      calculation.activities["ITERATIONS|ITERATIONS"]?.calculatedTotal || 0;

    const iterationProtoTotal =
      calculation.activities["ITERATIONS|ITERATIONS"]?.calculatedProtoTotal || 0;

    const iterationSerieTotal =
      calculation.activities["ITERATIONS|ITERATIONS"]?.calculatedSerieTotal || 0;


    // Calculate based on one loop, apply final scaling once
    const CAEEngineersPhase1Value = calculation.protoSumTDL;
    const CAEEngineersPhase2Value = calculation.serieSumTDL;

    let CAEStandardWorkPhase1Value = calculation.protoSumDE + iterationProtoTotal;
    let CAEStandardWorkPhase2Value = calculation.serieSumDE + iterationSerieTotal;

    // if (calculation.protoSumDE === 0) {
    //   CAEStandardWorkPhase2Value += iterationTotal;
    //   CAEStandardWorkPhase1Value = 0;
    // }
    // if (calculation.serieSumDE === 0) {
    //   CAEStandardWorkPhase1Value += iterationTotal;
    //   CAEStandardWorkPhase2Value = 0;
    // }

    // Generate PDF Data
    const finalContextData_pdfData = getCheckedActivities(calculation);

    sharedRef.currentCAE = {
      globalTDL: globalTDL ?? 0,
      globalDE: globalDE ?? 0,

      sumTDL: calculation?.sumTDL ?? 0,
      sumDE: calculation?.sumDE ?? 0,
      grandTotal: calculation?.grand ?? 0,
      activities: calculation?.activities ?? [],

      caeTotalHrs: CAEEngineersPhase1Value + CAEEngineersPhase2Value + CAEStandardWorkPhase1Value + CAEStandardWorkPhase2Value ?? 0, // Total hours including iteration for Cost Sheet

      tempJSON: JSON.stringify(buildTempJson() ?? {}, null, 2),
      finalJSON: JSON.stringify(buildFinalJson() ?? {}, null, 2),

      iterationTotal: iterationTotal ?? 0,

      CAEEngineersPhase1: CAEEngineersPhase1Value,
      CAEEngineersPhase2: CAEEngineersPhase2Value,

      CAEStandardWorkPhase1: CAEStandardWorkPhase1Value,
      CAEStandardWorkPhase2: CAEStandardWorkPhase2Value,

      pdfData: finalContextData_pdfData,
    };

    console.log("CAE Data auto-loaded to sharedRef:", sharedRef.currentCAE);
  };

  // ✅ Auto-load CAE data whenever calculation or globals change
  useEffect(() => {
    autoLoadCaeDataToSharedRef();
  }, [calculation, globalTDL, globalDE]);

  // -------------------------
  // 9️⃣ CLICK METHOD → TEMP + FINAL + sharedRef
  // -------------------------
  const generateAndSaveJson = () => {
    if (selectedVersion !== currentVersion && sharedRef.isCheatActive === false) {
      alert("OLD VERSIONS CANNOT BE MODIFIED!");
      return;
    }

    if (statusValue === "Closed" && sharedRef.isCheatActive === false) {
      alert("CLOSED QUOTATIONS CANNOT BE MODIFIED!");
      return;
    }

    const temp = buildTempJson();
    const final = buildFinalJson();

    alert("CAE SAVED!");

    console.log("CAE Save :- ", temp);
    handleSaveCae(temp);

    // Logic for Forge save  temo and final

    // Update sharedRef
    const iterationTotal =
      calculation.activities["ITERATIONS|ITERATIONS"]?.calculatedTotal || 0;
    const iterationProtoTotal =
      calculation.activities["ITERATIONS|ITERATIONS"]?.calculatedProtoTotal || 0;

    const iterationSerieTotal =
      calculation.activities["ITERATIONS|ITERATIONS"]?.calculatedSerieTotal || 0;

    // sharedRef.current = {
    //   globalTDL,
    //   globalDE,
    //   sumTDL: calculation.sumTDL,
    //   sumDE: calculation.sumDE,
    //   grandTotal: calculation.grand,
    //   activities: calculation.activities,
    //   tempJSON: JSON.stringify(temp, null, 2),
    //   finalJSON: JSON.stringify(final, null, 2),
    //   iterationTotal,
    // };
    //---Calculating the Phase1 and Phase2 for CAE enginer and CAE Standard Work---

    // Calculate based on one loop, apply final scaling once
    const CAEEngineersPhase1Value = calculation.protoSumTDL;
    const CAEEngineersPhase2Value = calculation.serieSumTDL;

    const CAEStandardWorkPhase1Value =
      (calculation.protoSumDE + iterationProtoTotal);
    const CAEStandardWorkPhase2Value =
      (calculation.serieSumDE + iterationSerieTotal);

    // Generate PDF Data
    const finalContextData_pdfData = getCheckedActivities(temp);

    sharedRef.currentCAE = {
      globalTDL: globalTDL ?? 0,
      globalDE: globalDE ?? 0,

      sumTDL: calculation?.sumTDL ?? 0,
      sumDE: calculation?.sumDE ?? 0,
      grandTotal: calculation?.grand ?? 0,
      activities: calculation?.activities ?? [],

      caeTotalHrs: CAEEngineersPhase1Value + CAEEngineersPhase2Value + CAEStandardWorkPhase1Value + CAEStandardWorkPhase2Value ?? 0, // Total hours including iteration for Cost Sheet

      tempJSON: JSON.stringify(temp ?? {}, null, 2),
      finalJSON: JSON.stringify(final ?? {}, null, 2),

      iterationTotal: iterationTotal ?? 0,

      CAEEngineersPhase1: CAEEngineersPhase1Value,
      CAEEngineersPhase2: CAEEngineersPhase2Value,

      CAEStandardWorkPhase1: CAEStandardWorkPhase1Value,
      CAEStandardWorkPhase2: CAEStandardWorkPhase2Value,

      pdfData: finalContextData_pdfData,
    };

    //alert(CAEEngineersPhase1Value +":"+ CAEEngineersPhase1Value  )
    //alert(CAEStandardWorkPhase1Value +":"+ CAEStandardWorkPhase1Value  )
    // console.log("SharedRef updated:", sharedRef.current);
  };

  //To apply shortcut Helper code start=========
  // step 1 :
  const applyShortcutForCustomer = (customerName, shortcutData, setData) => {
    setData((prev) => {
      const copy = structuredClone(prev);
      let customerActivities = shortcutData?.CAE_SHORTCUT?.[customerName]?.Activity;

      if (!customerActivities) {
        console.log(
          `Customer "${customerName}" not found. Falling back to STANDARD`
        );
        customerActivities = shortcutData?.CAE_SHORTCUT?.["STANDARD"]?.Activity;
      }

      if (!customerActivities) return prev;

      Object.keys(copy.activities).forEach((activityKey) => {
        const activity = copy.activities[activityKey];
        if (activityKey === "ITERATIONS|ITERATIONS") {
          activity.checked = customerActivities["ITERATIONS"] === "Yes";
          return;
        }

        // iN CASE OF lIGHTING AND Pillar dont split apply direclty by whole name .
        //reason behind same activity name is used in multiple places so we need to complete part of activity name to match with shortcut data.
        //  ( eg :  "A Upper Pillar Activities|Initial meetings" ) in Pillar A
        // (eg : "B Upper Pillar Activities|Initial meetings") In pillar  B

        let activityName;

        // In case of Lighting and Pillar, use the complete activity key.
        // For all other products, use only the activity name after '|'.
        //if (false)
        if (product === "Lighting" || product === "Pillar") {
          activityName = activityKey;
        } else {
          const parts = activityKey.split("|");
          activityName = parts[1]?.trim();
        }

        if (!activityName) return;


        const shortcutValue = customerActivities[activityName];
        const isChecked = shortcutValue === "Yes";
        activity.checked = isChecked;
        activity.noOfLoops = isChecked ? 1 : 0;
      });

      return copy;
    });
  };

  // Use effect called above

  // // step 1 :
  // useEffect(() => {
  //   const customer = "Audi"; //  hardcoded for now

  //   //todo1: Apply saved unsaved logic for forge .Short cut should  overide once saved CAE data

  //   applyShortcutForCustomer(customer, CAE_SHORTCUT, setData);
  // }, []);
  //To apply shortcut Helper code ends=========

  // -------------------------
  // 10️⃣ AUTO-GENERATE JSON for UI (readonly)
  // -------------------------
  const tempJSON = JSON.stringify(buildTempJson(), null, 2);
  const finalJSON = JSON.stringify(buildFinalJson(), null, 2);

  // -------------------------
  // 11️⃣ RETURN TO UI
  // -------------------------
  return {
    data,
    activities: calculation.activities,
    calculation,

    globalTDL,
    globalDE,
    setGlobalTDL,
    setGlobalDE,

    sumTDL: calculation.sumTDL,
    sumDE: calculation.sumDE,
    grandTotal: calculation.grand,

    protoSumTDL: calculation.protoSumTDL,
    protoSumDE: calculation.protoSumDE,
    serieSumTDL: calculation.serieSumTDL,
    serieSumDE: calculation.serieSumDE,

    updateActivity,
    generateAndSaveJson, // 🔘 click to update sharedRef

    // shortcut
    shortcutValues,
    updateShortcutLoops,

    tempJSON,
    finalJSON,

    product,
  };
}
