// entry piint for CAD (Step 1)

// when you click "calculated Temp"  it will call  handleTemp  function--> it will call --> calculateTempResults Method and get output ans set "setTempResults"

// when you click on save Final --> it will call "handleSaveFinal" method-->
//  1) it will update final payload(Considering global yes/no) i.e saveFinal(payload)
//  2) then call calculateFinalResults  and get calculated result based on final Payload
// 3) then set value for display i.e  setFinalResults(final);
// 4) then use Global and Json for Final Display
import React, { useState, useEffect, useContext } from "react";

// --- UI Components ---
import ProductPartsGlobal from "../../global/ProductPartsGlobal";
import ActivitySubactivityTable from "../../global/ActivitySubactivityTable";
import GlobalParams from "../../global/GlobalParams";
import ActivityContainer from "../../activity/ActivityContainer";
import TempResultTable from "../../results/TempResultTable";
import FinalResultTable from "../../results/FinalResultTable";
import JsonViewer from "../../results/JsonViewer";
import RFQPhaseTable from "../../Main Cost Sheet UI/RFQPhaseTable";
import MainCostSheet from "../../Main Cost Sheet UI/MainCostSheet";
import CustomerProductConfig from "../../T_CECO_SUMMARY/CustomerProductConfig";
import Global2DActivities from "../../global/Global2DActivities";
import SOPDates from "../../global/SOPDates";
import { StorageContext } from "../../../../StorageContext";
import { useActivityLogic } from "../../../hooks/useActivityLogic"; // --- MAIN LOGIC HOOK ---

// new imports -- Start
import { sharedRef } from "../../../../shared/sharedStore";

// ADD ON COMPONENT
import AddOnComponentsTable from "../../global/AddOnComponentsTable";

import OfferTable from "../../OfferPhase/OfferTable";
import IndustrializationTable from "../../InductrilizationPhase/IndustrializationTable";
import DataManagementTable from "../../DataManagement/DataManagementTable";

import OtherCostTable from "../../global/OtherCostTable";

import CostSheetPreview from "../../ReadableComponents/CostSheetPreview";

// thermal sim import
import { useActivityLogicThermalSimulation } from "../../../../Thermal Simulation/hooks/useActivityLogicThermalSimulation";

// import ThermalSimulation from "../../../../Thermal Simulation/Components/ThermalSimulation";

// new imports -- End

export default function CADCalculator({ showCostSheet: propShowCostSheet, setShowCostSheet: propSetShowCostSheet }) {
  console.log("=== [CADCalculator] Component Rendered ===");

  const {
    storedData,
    handleSave,
    selectedVersion,
    currentVersion,
    thermalInput,
    thermalActive,
  } = useContext(StorageContext);

  // Use props if provided, otherwise use local state
  const [localShowCostSheet, setLocalShowCostSheet] = useState(false);
  const showCostSheet = propShowCostSheet !== undefined ? propShowCostSheet : localShowCostSheet;
  const setShowCostSheet = propSetShowCostSheet !== undefined ? propSetShowCostSheet : setLocalShowCostSheet;

  //------------- recalculation useefect start ---------------------
  useEffect(() => {
    if (storedData && !storedData.hasOwnProperty("id")) {
      console.log("Recalculate : \n", storedData);
      const result = calculateTempResults({
        phaseFlags,
        Global: storedData["Global"],
        activities: storedData.activities,
        customerProductData: storedData.customerProductData,
      });

      calculateAndSetAggregates(result);
    }
  }, [storedData]);
  const shared = sharedRef.currentCAE; // Data Recived from CAE
  const styles = {
    page: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1.3fr",
      gap: "12px",
      alignItems: "flex-start",
    },
    column: {
      border: "1px solid #ddd",
      padding: "10px",
      background: "#fff",
      maxHeight: "80vh",
      overflowY: "auto",
    },
  };

  /**
   * useActivityLogic() returns:
   * - jsonData  → all activities, products, subs
   * - globalParams → YES/NO parameters
   * - functions → update logic + calculation logic
   */
  const {
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

    customerProductData,
    updateCustomerProductField,

    //
    //    sopParams,
    //  sopEndDate,
    //updateSopParam,

    //phaseFlags,
    //updatePhaseFlag,

    // sopParams, // SOP parameters (startDate, etc.)
    // updateSopParam, // Function to update SOP params
    // phaseFlags, // Active phase flags
    // updatePhaseFlag, // Function to update phase flags
    // phaseDates, // Calculated start and end dates per phase
    // sopEndDate, // Final end date based on selected phases

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
    offerRows,
    UpdateofferResouce,
    updatePercentage,

    // Percentages
    percentages,
    percentageMsg,
    resourcesPayload,
    percentagesPayload,

    // Industrialization
    industrializationData,
    industrializationRows,
    UpdateIndustrializationResource,
    industPayload,

    // Data Management
    dataManagementRows,
    UpdateDataManagementResource,
    dataManagementPayload,

    // expose to UI
    otherTableData,
    updateOtherTableParam,

    // expose to cost sheet
    additionalOthersHoursAndCostPayload,

    FINAL_DEBUG_DATA,
    CECO_COST_SHEET_YearANDPhases,
  } = useActivityLogic();

  // get thermal sim logic hook

  console.log("Getting Thermal Values : \n", thermalInput);

  const offerweeks = phaseDates?.phase_0?.weeks ?? 0;
  const industweeks = phaseDates?.phase_3_4?.weeks ?? 0;
  const dmtweeks = phaseDates?.phase_0?.weeks ?? 0;

  //alert("1: CAD => " + JSON.stringify(phaseDates));
  // alert(
  //   "1 customerProductData: " + JSON.stringify(customerProductData, null, 2)
  // );

  // DUmmy data for Cost sheet
  // DUmmy data for Cost sheet

  // --- LOCAL STATE FOR DISPLAYING RESULTS ---
  const [tempJson, setTempJson] = useState(null);
  const [tempResults, setTempResults] = useState([]);
  const [finalResults, setFinalResults] = useState([]);
  const [finalJson, setFinalJson] = useState(null);
  const [threeDfinalJson, setthreeDfinalJson] = useState(null);
  const [twoDfinalJson, settwoDfinalJson] = useState(null);
  const [dataManagementfinalJson, setdataManagementfinalJson] = useState(null);
  const [geometricStudyfinalJson, setgeometricStudyfinalJson] = useState(null);

  // UseState for Aggregated Result  :
  const [sumthreeDResultsActivities, setsumthreeDResultsActivities] =
    useState(null);
  const [sumtwoDResultsActivities, setsumtwoResultsActivities] = useState(null);
  const [
    sumtwoDAntoloinDrawingResultsActivities,
    setsumtwoDAntoloinDrawingResultsActivities,
  ] = useState(null);
  const [
    sumtwoDCustomerDrawingsResultsActivities,
    setsumtwoCustomerDrawingsResultsActivities,
  ] = useState(null);
  const [sumDMDResultsActivities, setsumDMDResultsActivities] = useState(null);
  const [sumGSResultsActivities, setsumGSDResultsActivities] = useState(null);

  // --- SHOW / HIDE ACTIVITY CONTAINER ---
  const [showActivities, setShowActivities] = useState(false);

  // --- SHOW / HIDE GLobal  ---
  const [showCustomerConfig, setShowCustomerConfig] = useState(false);

  // --- SHOW / HIDE GLobal  ---
  const [showActivitiesGlobal, setActivitiesGlobal] = useState(false);

  // --- SHOW / HIDE Activiry Global Selection  ---
  const [showActivityTable, setShowActivityTable] = useState(false);

  const [showOfferIndustrilizationPhase, setshowOfferIndustrilizationPhase] =
    useState(false); // initially visible

  const [showTempResults, setShowTempResults] = useState(false); // TEMP Results table visibility
  const [showTemp3DResults, setShowTemp3DResults] = useState(false); // TEMP 3D Results table visibility
  const [showTemp3DAggregated, setShowTemp3DAggregated] = useState(false); // TEMP 3D Aggregated Results table visibility
  const [showTemp2DResults, setShowTemp2DResults] = useState(false); // TEMP 2D Results table visibility
  const [showTemp2DAggregated, setShowTemp2DAggregated] = useState(false); // TEMP 2D Aggregated Results table visibility
  const [showTempDMResults, setShowTempDMResults] = useState(false); // TEMP DM (Data Management) Results table visibility
  const [showTempDMAggregated, setShowTempDMAggregated] = useState(false); // TEMP DM Aggregated Results table visibility
  const [showTempGMResults, setShowTempGMResults] = useState(false); // TEMP GM (Geometrical Study) Results table visibility
  const [showTempGMAggregated, setShowTempGMAggregated] = useState(false); // TEMP GM Aggregated Results table visibility
  const [showFinalResults, setShowFinalResults] = useState(false); // FINAL Results table visibility
  const [showTempJSON, setShowTempJSON] = useState(true); // TEMP JSON viewer visibility
  const [showFinalJSON, setShowFinalJSON] = useState(false); // FINAL JSON viewer visibility

  /* ----------------------------
     Collect data from children
  -----------------------------*/

  function sumActivities(data) {
    const sum = {
      activityName: "TOTAL",

      protoTDL: 0,
      protoCOO: 0,
      protoDE: 0,
      protoTotal: 0,

      serieTDL: 0,
      serieCOO: 0,
      serieDE: 0,
      serieTotal: 0,

      TDL: 0,
      COO: 0,
      DE: 0,
      Total: 0,
    };

    data.forEach((item) => {
      sum.protoTDL += parseFloat(item.protoTDL) || 0;
      sum.protoCOO += parseFloat(item.protoCOO) || 0;
      sum.protoDE += parseFloat(item.protoDE) || 0;
      sum.protoTotal += parseFloat(item.protoTotal) || 0;

      sum.serieTDL += parseFloat(item.serieTDL) || 0;
      sum.serieCOO += parseFloat(item.serieCOO) || 0;
      sum.serieDE += parseFloat(item.serieDE) || 0;
      sum.serieTotal += parseFloat(item.serieTotal) || 0;

      sum.TDL += parseFloat(item.TDL) || 0;
      sum.COO += parseFloat(item.COO) || 0;
      sum.DE += parseFloat(item.DE) || 0;
      sum.Total += parseFloat(item.Total) || 0;
    });

    // format to 3 decimals (same as input)
    Object.keys(sum).forEach((key) => {
      if (key !== "activityName") {
        sum[key] = sum[key].toFixed(3);
      }
    });

    return sum;
  }

  // =====================================================================
  //                     TEMP CALCULATION (NO IMPACT TO ORIGINAL JSON)
  // =====================================================================
  function handleTemp() {
    if (selectedVersion !== currentVersion) {
      alert("OLD VERSIONS CANNOT BE MODIFIED!");
      return;
    }

    console.log("=== [TEMP] Button Clicked ===");

    console.log("[TEMP] Sending JSON to temp calculator:", {
      Global: globalParams,
      activities: jsonData.activities,
    });

    /**
     * calculateTempResults(finalJSON)
     * - Does not modify jsonData
     * - Reads all values
     * - Applies logic based on YES/NO
     * - Returns UI table result only
     */
    // it call method calculateTempResults  (in useActivityLogic.js file )which go for calculations
    /*
    const res = calculateTempResults({
      Global: globalParams,
      activities: jsonData.activities,
    });

    console.log("[TEMP] Computed Results:", res);

    //Set Value For Temp
    setTempResults(res); // once Set "Temp" it Will Display
    */

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
    } = calculateTempResults({
      phaseFlags,
      Global: globalParams,
      activities: jsonData.activities,
      customerProductData,
      addOnComponentState: {},
      offerRows, // Sendting this because we have to add Seperate Offer related Data into 3D activity for OFfer  phase
      industrializationRows,
    });

    // Call thermal safety hook, once received update tempJson

    // alert(
    //   "Data Summary (MainCostSheet):\n\n" +
    //     "2D AntolinDrwaings Data:\n" +
    //     JSON.stringify(twoDAntolinDrwaingsAggregatedTotal, null, 2)
    // );

    // alert(
    //   "Data Summary (MainCostSheet):\n\n" +
    //     "2D CustomerDrwaings Data:\n" +
    //     JSON.stringify(twoDCustomerDrwaingsAggregatedTotal, null, 2)
    // );

    console.log("======CADCalculator=========");
    console.log("======CADCalculator=========" + threeDAggregatedTotal);

    console.log(
      "Save Thermal too: \n",
      thermalInput,
      "\n--------\n",
      thermalActive,
    );

    console.log("[TEMP] Computed Results:", twoDResults);
    setTempResults(results); // once Set "Temp" it Will Display -  all result (32 d,2d ,dm ,gm )
    setthreeDfinalJson(threeDResults); // once Set "Temp" it Will Display-  all result (3d d,2d ,dm ,gm )

    console.log(
      "[TEMP] Computed Results:threeDAggregatedTotal",
      threeDAggregatedTotal,
    );

    settwoDfinalJson(twoDResults); // once Set "Temp" it Will Display-  all result (2d  )

    setdataManagementfinalJson(dataManagementResults); //once Set "Temp" it Will Display- all result (dm )
    setgeometricStudyfinalJson(geometricalStudyResults); //once Set "Temp" it Will Display- all result (gm )

    //Setting alll agregated Result :
    setsumthreeDResultsActivities(threeDAggregatedTotal);
    setsumtwoResultsActivities(twoDAggregatedTotal);
    setsumtwoDAntoloinDrawingResultsActivities(
      twoDAntolinDrwaingsAggregatedTotal,
    );
    setsumtwoCustomerDrawingsResultsActivities(
      twoDCustomerDrwaingsAggregatedTotal,
    );

    setsumDMDResultsActivities(dataMgmtAggregatedTotal);
    setsumGSDResultsActivities(geoAggregatedTotal);

    // Create temp JSON output for display
    const tempJSONOutput = {
      sopParams, // SOP parameters (startDate, etc.)
      updateSopParam, // Function to update SOP params
      phaseFlags, // Active phase flags
      updatePhaseFlag, // Function to update phase flags
      phaseDates, // Calculated start and end dates per phase
      sopEndDate, // Final end date based on selected phases
      customerProductData,
      updateCustomerProductField,
      Global: globalParams,

      //offer, %age, industrialization
      offerData: resourcesPayload,
      percentages: percentagesPayload,
      industrializationData: industPayload,
      dmData: dataManagementPayload,
      //thermal safety
      thermalActive,
      thermalInput,
      //other tables
      otherTableData,

      global2DRows,
      // resourcesPayload,
      // percentagesPayload,
      // industPayload,
      activities: JSON.parse(JSON.stringify(jsonData.activities)),
    };
    // Create temp JSON output for display
    const tempJSONOutput1 = {};

    alert("CAD SAVED!");

    console.log("Saved Temp JSON Activities : \n", tempJSONOutput);

    handleSave(tempJSONOutput);

    setTempJson(tempJSONOutput);

    // Call Load Data to avoid Refresh
    setTimeout(() => {
      console.log("Calling Load data to recalculate results...");
      loadData();
    }, 100);
  }

  function loadData() {
    console.log("=== [TEMP] Button Clicked ===");

    console.log("[TEMP] Sending JSON to temp calculator:", {
      Global: globalParams,
      activities: jsonData.activities,
    });

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
    } = calculateTempResults({
      phaseFlags,
      Global: globalParams,
      activities: jsonData.activities,
      customerProductData,
      addOnComponentState: {},
      offerRows, // Sendting this because we have to add Seperate Offer related Data into 3D activity for OFfer  phase
      industrializationRows,
    });

    console.log("======CADCalculator=========");
    console.log("======CADCalculator=========" + threeDAggregatedTotal);

    console.log("[TEMP] Computed Results:", twoDResults);
    setTempResults(results); // once Set "Temp" it Will Display -  all result (32 d,2d ,dm ,gm )
    setthreeDfinalJson(threeDResults); // once Set "Temp" it Will Display-  all result (3d d,2d ,dm ,gm )

    console.log(
      "[TEMP] Computed Results:threeDAggregatedTotal",
      threeDAggregatedTotal,
    );

    settwoDfinalJson(twoDResults); // once Set "Temp" it Will Display-  all result (2d  )

    setdataManagementfinalJson(dataManagementResults); //once Set "Temp" it Will Display- all result (dm )
    setgeometricStudyfinalJson(geometricalStudyResults); //once Set "Temp" it Will Display- all result (gm )

    //Setting alll agregated Result :
    setsumthreeDResultsActivities(threeDAggregatedTotal);
    setsumtwoResultsActivities(twoDAggregatedTotal);
    setsumtwoDAntoloinDrawingResultsActivities(
      twoDAntolinDrwaingsAggregatedTotal,
    );
    setsumtwoCustomerDrawingsResultsActivities(
      twoDCustomerDrwaingsAggregatedTotal,
    );

    setsumDMDResultsActivities(dataMgmtAggregatedTotal);
    setsumGSDResultsActivities(geoAggregatedTotal);

    // Create temp JSON output for display
    const tempJSONOutput = {
      sopParams, // SOP parameters (startDate, etc.)
      updateSopParam, // Function to update SOP params
      phaseFlags, // Active phase flags
      updatePhaseFlag, // Function to update phase flags
      phaseDates, // Calculated start and end dates per phase
      sopEndDate, // Final end date based on selected phases
      customerProductData,
      updateCustomerProductField,
      Global: globalParams,

      //offer, %age, industrialization
      offerData: resourcesPayload,
      percentages: percentagesPayload,
      industrializationData: industPayload,
      dmData: dataManagementPayload,
      //thermal safety
      thermalActive,
      thermalInput,
      //other tables
      otherTableData,

      global2DRows,
      // resourcesPayload,
      // percentagesPayload,
      // industPayload,
      activities: JSON.parse(JSON.stringify(jsonData.activities)),
    };
    // Create temp JSON output for display
    const tempJSONOutput1 = {};

    console.log("Saved Temp JSON Activities : \n", tempJSONOutput);

    // handleSave(tempJSONOutput);

    setTempJson(tempJSONOutput);
  }

  function calculateAndSetAggregates(result) {
    //alert("setting :::" + JSON.stringify(result));
    setsumthreeDResultsActivities(result.threeDAggregatedTotal);
    setsumtwoResultsActivities(result.twoDAggregatedTotal);
    setsumtwoDAntoloinDrawingResultsActivities(
      result.twoDAntolinDrwaingsAggregatedTotal,
    );
    setsumtwoCustomerDrawingsResultsActivities(
      result.twoDCustomerDrwaingsAggregatedTotal,
    );
    setsumDMDResultsActivities(result.dataMgmtAggregatedTotal);
    setsumGSDResultsActivities(result.geoAggregatedTotal);
  }

  // =====================================================================
  //               FINAL SAVE CALCULATION (WRITES INTO JSON)
  // Save updated JSON with Zero(TDL ,COO ,DE) ==> Calculation ==> Display result
  // =====================================================================
  function handleSaveFinal() {
    console.log("=== [FINAL SAVE] Button Clicked ===");

    // Preparing deep copied activity data for saving
    const payload = {
      Global: globalParams,
      activities: JSON.parse(JSON.stringify(jsonData.activities)),
    };

    console.log("[FINAL SAVE] Payload to saveFinal():", payload);

    /**
     * saveFinal(finalJSON)
     * - Applies formulas
     * - Updates jsonData.activities with final values
     * - Multiplies based on YES/NO
     */
    // saveFinal(payload); // Step 1 : Updating final json With Based on UI changes
    // const updatedJSONfinal = payload;

    const updatedJSON = saveFinal(payload);

    console.log("[FINAL SAVE] Activities Updated:", updatedJSON.activities);

    // Now calculate final result table (already updated)
    // // it call method calculateFinalResults which go for calculations
    //calculateFinalResults(finalJSON)

    //// Step 2 : Go For Calculations
    // const final = calculateFinalResults({
    //   Global: globalParams,
    //   activities: jsonData.activities,
    // });

    const {
      results,
      threeDResults,
      twoDResults,
      dataManagementResults,
      geometricalStudyResults,
    } = calculateFinalResults({
      Global: globalParams,
      activities: updatedJSON.activities,
    });

    console.log("[FINAL SAVE] Final Result Table Data:", results);

    setFinalResults(results); // Step 3 : Result display in table

    setthreeDfinalJson(threeDResults); // once Set "Temp" it Will Display-  all result (3d  )
    console.log("[FINAL SAVE] Final threeDResults:", threeDResults);

    settwoDfinalJson(twoDResults); // once Set "Temp" it Will Display-  all result (2d  )
    setdataManagementfinalJson(dataManagementResults); //once Set "Temp" it Will Display- all result (dm )
    setgeometricStudyfinalJson(geometricalStudyResults); //once Set "Temp" it Will Display- all result (gs )

    // Create final JSON output for display
    const finalOutput = {
      Global: globalParams,
      activities: JSON.parse(JSON.stringify(updatedJSON.activities)),
    };

    console.log("[FINAL SAVE] Final JSON:", finalOutput);

    setFinalJson(finalOutput); // Step 4 : Json SET final for Work order

    alert("Final data saved (values multiplied per Global toggles).");
  }

  const ENABLE_2D = false; // 🔒 Toggle when ready
  const isFrozen = true; // or state-driven
  const quotationText = `Quotation: ${globalParams.product} ${globalParams.Customer} ${globalParams["ProjectName"]} ${globalParams["Type Of Development"]}`;

  // updating CAE data based on Phases selectoion and Deselection======
  // this Coming from activity Hook Main flag details
  const phaseMultiplier = {
    phase_0: phaseFlags.phase_0 ? true : false,
    phase_1: phaseFlags.phase_1 ? true : false,
    phase_2: phaseFlags.phase_2 ? true : false,
    phase_34: phaseFlags.phase_3_4 ? true : false,
  };
  // alert("before==>"+sharedRef.phaseflagShared.phase0flag )

  // Storing in shared
  sharedRef.phaseflagShared.phase0flag = phaseMultiplier.phase_0;
  //  alert("After==>"+sharedRef.phaseflagShared.phase0flag )
  sharedRef.phaseflagShared.phase1flag = phaseMultiplier.phase_1;
  sharedRef.phaseflagShared.phase2flag = phaseMultiplier.phase_2;
  sharedRef.phaseflagShared.phase34flag = phaseMultiplier.phase_34;

  // ---setting weeks in shared start--------
  //  alert("Setting value for shared strat date :"+
  //    JSON.stringify(sharedRef.phaseflagShared)
  //   )

  sharedRef.phaseWeeksShared.phase0Week = phaseDates.phase_0?.weeks > 0 ? 1 : 0;

  sharedRef.phaseWeeksShared.phase1Week = phaseDates.phase_1?.weeks > 0 ? 1 : 0;

  sharedRef.phaseWeeksShared.phase2Week = phaseDates.phase_2?.weeks > 0 ? 1 : 0;

  sharedRef.phaseWeeksShared.phase34Week =
    phaseDates.phase_3_4?.weeks > 0 ? 1 : 0;

  // alert("SET Setting value for shared strat date :"+
  //    JSON.stringify(sharedRef.phaseWeeksShared)
  //   )
  //---setting week in shared End--------

  // =====================================================================
  //                                RENDER UI
  // =====================================================================
  return (
    <div>
      {/* Phase Selection Header - Hidden when viewing Cost Sheet */}
      {!showCostSheet && (
        <>
          <div
            style={{
              position: "sticky",
              top: 60, // below Tabs
              zIndex: 900,
              background: "#fff",
              padding: "10px 0",
              display: "flex",
              alignItems: "flex-start",
              gap: "30px",
            }}
          >
            {/* Left: Quotation */}
            <h1 style={{ color: "#0b74d1", marginBottom: 15 }}>{quotationText}</h1>

            {/* Right: Phase Selection */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h4>Select Phases</h4>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <label>
              <input
                type="checkbox"
                checked={phaseFlags.phase_0}
                onChange={(e) => updatePhaseFlag("phase_0", e.target.checked)}
              />
              Phase 0
            </label>

            <label>
              <input
                type="checkbox"
                checked={phaseFlags.phase_1}
                onChange={(e) => updatePhaseFlag("phase_1", e.target.checked)}
              />
              Phase 1
            </label>

            <label>
              <input
                type="checkbox"
                checked={phaseFlags.phase_2}
                onChange={(e) => updatePhaseFlag("phase_2", e.target.checked)}
              />
              Phase 2
            </label>

            <label>
              <input
                type="checkbox"
                checked={phaseFlags.phase_3_4}
                onChange={(e) => updatePhaseFlag("phase_3_4", e.target.checked)}
              />
              Phase 3-4
            </label>

            <SOPDates
              sopParams={{
                startDate: sopParams.startDate,
                endDate: sopEndDate,
              }}
              onChange={updateSopParam}
            />
            <button className="btn" onClick={loadData}>
              🔄 Refresh
            </button>

            <button className="btn" onClick={handleTemp}>
              ✅ Save CAD
            </button>

            {/* <button
              className="btn"
              style={{ marginLeft: 8 }}
              onClick={handleSaveFinal}
            >
              Save Final
            </button> */}
          </div>
          <p style={{ fontSize: "10px", color: "blue" }}>
            <span></span> Click on Refresh to Recalculate data
          </p>
        </div>
      </div>
      {/* Customer Product Config Column */}
      <div style={styles.column}>
        <CustomerProductConfig
          customer={globalParams.Customer}
          product={globalParams.product}
          data={customerProductData}
          onChange={updateCustomerProductField}
        />
      </div>
        </>
      )}

      {/* Show Cost Sheet Component - Only visible when Cost Sheet is enabled */}
      {showCostSheet && (^`n        <MainCostSheet
        {/* old  You can ignore now
         <RFQPhaseTable data={rfqData} /> */}
        <button
          className="btn"
          style={{ marginLeft: 8 }}
          onClick={() =>
            setshowOfferIndustrilizationPhase(!showOfferIndustrilizationPhase)
          }
        >
          {" "}
          {showOfferIndustrilizationPhase
            ? "Hide Offer/ industrilization"
            : "Show Offer/ industrilization"}
        </button>
        <h3>3D Offer (PH0)</h3>
        {showOfferIndustrilizationPhase && (
          <OfferTable
            rows={offerRows}
            weeks={offerweeks || 0}
            onChange={UpdateofferResouce}
            onPercentageChange={updatePercentage}
            percentageMsg={percentageMsg}
          />
        )}
        <h3>3D Industrialization(PH34)</h3>
        {showOfferIndustrilizationPhase && (
          <IndustrializationTable
            rows={industrializationRows}
            weeks={industweeks || 0}
            onChange={UpdateIndustrializationResource}
          />
        )}
        <h3>Data Management (Offer)</h3>
        {/* <span style={{ color: "red", fontWeight: "bold" }}>
          Note: This DM is not a part of the Total Cost Sheet(Link is
          pending).Kindly ignore while testing Also need Confirmation Offer
          phase hours to show in which way TDL, DE ,COO
        </span> */}
        {showOfferIndustrilizationPhase && (
          <DataManagementTable
            rows={dataManagementRows}
            weeks={dmtweeks}
            onChange={UpdateDataManagementResource}
          />
        )}
      </div>

      <OtherCostTable data={otherTableData} onChange={updateOtherTableParam} />

      <div style={{ marginTop: 10 }}>
        <hr
          style={{
            border: "none",
            height: "1px",
            backgroundColor: "grey",
            marginTop: 5,
            marginBottom: 5,
          }}
        />
        <h1>Activity Page</h1>

        {/* <ThermalSimulation /> */}

        {/* Example: show totals in parent */}
      </div>

      {/* --------------------------------------------------------------
         GLOBAL YES/NO PARAMETERS BLOCK
         - Shows the buttons / toggles
         - updateGlobalParam() will update globalParams
        -------------------------------------------------------------- */}
      {/* <GlobalParams globalParams={globalParams} onChange={updateGlobalParam} /> */}
      {/* <CustomerProductConfig customerName="Audi" productName="Door Panel" /> */}
      {/* <CustomerProductConfig
        customerName={globalParams.Customer}
        productName={globalParams.product}
      /> */}
      {/* <ProductPartsGlobal data={jsonData} onChange={updateGlobalProductPart} /> */}
      {/* <ProductPartsGlobal
        data={jsonData}
        applyGlobalChange={applyGlobalProductChange}
      /> */}
      {/* --------------------------------------------------------------
         All three Section side by side
        -------------------------------------------------------------- */}
      <div style={{ marginTop: 10 }}>
        {/* Toggle Button */}
        <button
          className="btn2"
          onClick={() => setActivitiesGlobal((prev) => !prev)}
          style={{ marginBottom: 16 }}
        >
          {showActivitiesGlobal
            ? "Hide Global Details Page"
            : "Show Global Details "}
        </button>

        {/* Entire page div */}
        {showActivitiesGlobal && (
          <div>
            {/* Global Params Column */}
            <div style={styles.column}>
              <GlobalParams
                globalParams={globalParams}
                onChange={updateGlobalParam}
              />
            </div>

            {/* Not required to be rendered again */}
            {/* Customer Product Config Column
            <div style={styles.column}>
              <CustomerProductConfig
                customer={globalParams.Customer}
                product={globalParams.product}
                data={customerProductData}
                onChange={updateCustomerProductField}
              />
            </div> */}

            {/* Product Parts Column */}
            <div style={styles.column}>
              <ProductPartsGlobal
                data={jsonData}
                applyGlobalChange={applyGlobalProductChange}
              />
            </div>

            <div style={styles.column}>
              <AddOnComponentsTable
                data={jsonData}
                addOnState={addOnComponentState}
                onAddOnChange={applyAddOnComponentChange}
              />
              <h5>{JSON.stringify(addOnComponentState, null, 2)}</h5>
            </div>
          </div>
        )}
      </div>
      {/* <  Global2DActivities
        activities={jsonData.activities}
        onChange={update2DActivity}
      /> */}
      {false && (
        <Global2DActivities
          activities={jsonData.activities}
          onChange={update2DActivity}
        />
      )}
      {/* <div>
        <h4>Select Phases</h4>

        <label>
          <input
            type="checkbox"
            checked={phaseFlags.phase_0}
            onChange={(e) => updatePhaseFlag("phase_0", e.target.checked)}
          />
          Phase 0
        </label>
        <br />

        <label>
          <input
            type="checkbox"
            checked={phaseFlags.phase_1}
            onChange={(e) => updatePhaseFlag("phase_1", e.target.checked)}
          />
          Phase 1
        </label>
        <br />

        <label>
          <input
            type="checkbox"
            checked={phaseFlags.phase_2}
            onChange={(e) => updatePhaseFlag("phase_2", e.target.checked)}
          />
          Phase 2
        </label>
        <br />

        <label>
          <input
            type="checkbox"
            checked={phaseFlags.phase_3_4}
            onChange={(e) => updatePhaseFlag("phase_3_4", e.target.checked)}
          />
          Phase 3-4
        </label>

        <SOPDates
          sopParams={{
            startDate: sopParams.startDate,
            endDate: sopEndDate,
          }}
          onChange={updateSopParam}
        />
      </div> */}
      {/* <p style={{ fontSize: "18px", color: "red" }}>NOTE :</p>
      <p style={{ fontSize: "16px", color: "red" }}>
        <span></span> (Consider Proto & Serie for 2D as "Number of Drawing".
        Both Proto & Serie are in sync)
      </p>
      <p style={{ fontSize: "16px", color: "red" }}>
        <span></span> (Consider Proto & Serie as "Number of loop" (i.e: Assy).
        Both Proto & Serie are in sync)
      </p> */}
      {/* <p style={{ fontSize: "18px", color: "red" }}>Pendings :</p>
      <p style={{ fontSize: "16px", color: "red" }}>
        <span></span> (Start Date SOP date is pending)
      </p>
      <p style={{ fontSize: "16px", color: "red" }}>
        <span></span> (Storage part is pending . Once all logic are finalize I
        can work on Storage)
      </p> */}
      <div>
        {/* Toggle Button for Activity Table */}

        <button
          className="btn2"
          onClick={() => setShowActivityTable((prev) => !prev)}
          style={{ marginBottom: 16 }}
        >
          {showActivityTable ? "Hide Activity Table" : "Show Activity Table"}
        </button>

        {/* Activity Table */}
        {showActivityTable && (
          <ActivitySubactivityTable
            data={jsonData}
            onChange={updateGlobalActivitySubactivity}
          />
        )}
      </div>
      {/* --------------------------------------------------------------
         ACTION BUTTONS: TEMP + FINAL SAVE
        -------------------------------------------------------------- */}
      <div style={{ marginTop: 6 }}>
        {/* --------------------------------------------------------------
        ACTIVITY CONTAINER
        - Shows list of activities
        - Shows each product + its sub parameters
        - Handles update product & update sub values
        -------------------------------------------------------------- */}

        <button
          className="btn"
          style={{ marginLeft: 8 }}
          onClick={() => setShowActivities((prev) => !prev)}
        >
          {showActivities ? "Hide Activities" : "Show Activities"}
        </button>

        {showActivities && (
          <ActivityContainer
            jsonData={jsonData}
            onToggleActivity={toggleActivityChecked}
            onUpdateProductValue={updateProductValue}
            onUpdateSubValue={updateSubValue}
          />
        )}
      </div>
      {/* --------------------------------------------------------------
          RESULTS: TEMP | FINAL | JSON OUTPUT
        -------------------------------------------------------------- */}
      <div
        style={{
          // display: "flex",
          // gap: 12,
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        {/* ---------------- */}
        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTempResults((prev) => !prev)}
          >
            {showTempResults ? "Hide Temp Results" : "Show Temp Results"}
          </button>
          {showTempResults && <TempResultTable results={tempResults} />}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTemp3DResults((prev) => !prev)}
          >
            {showTemp3DResults
              ? "Hide Temp 3D Results"
              : "Show Temp 3D Results"}
          </button>
          {showTemp3DResults && <TempResultTable results={threeDfinalJson} />}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTemp3DAggregated((prev) => !prev)}
          >
            {showTemp3DAggregated
              ? "Hide Temp 3D Aggregated Results"
              : "Show Temp 3D Aggregated Results"}
          </button>
          {showTemp3DAggregated && (
            <TempResultTable results={sumthreeDResultsActivities} />
          )}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTemp2DResults((prev) => !prev)}
          >
            {showTemp2DResults
              ? "Hide Temp 2D Results"
              : "Show Temp 2D Results"}
          </button>
          {showTemp2DResults && <TempResultTable results={twoDfinalJson} />}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTemp2DAggregated((prev) => !prev)}
          >
            {showTemp2DAggregated
              ? "Hide Temp 2D Aggregated Results"
              : "Show Temp 2D Aggregated Results"}
          </button>
          {showTemp2DAggregated && (
            <TempResultTable results={sumtwoDResultsActivities} />
          )}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTempDMResults((prev) => !prev)}
          >
            {showTempDMResults
              ? "Hide Temp DM Results"
              : "Show Temp DM Results"}
          </button>
          {showTempDMResults && (
            <TempResultTable results={dataManagementfinalJson} />
          )}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTempDMAggregated((prev) => !prev)}
          >
            {showTempDMAggregated
              ? "Hide Temp DM Aggregated Results"
              : "Show Temp DM Aggregated Results"}
          </button>
          {showTempDMAggregated && (
            <TempResultTable results={sumDMDResultsActivities} />
          )}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTempGMResults((prev) => !prev)}
          >
            {showTempGMResults
              ? "Hide Temp GM Results"
              : "Show Temp GM Results"}
          </button>
          {showTempGMResults && (
            <TempResultTable results={geometricStudyfinalJson} />
          )}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTempGMAggregated((prev) => !prev)}
          >
            {showTempGMAggregated
              ? "Hide Temp GM Aggregated Results"
              : "Show Temp GM Aggregated Results"}
          </button>
          {showTempGMAggregated && (
            <TempResultTable results={sumGSResultsActivities} />
          )}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowFinalResults((prev) => !prev)}
          >
            {showFinalResults ? "Hide Final Results" : "Show Final Results"}
          </button>
          {showFinalResults && <FinalResultTable results={finalResults} />}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTempJSON((prev) => !prev)}
          >
            {showTempJSON ? "Hide Temp JSON" : "Show Temp JSON"}
          </button>
          {showTempJSON && <JsonViewer data={tempJson} />}
        </div>

        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowFinalJSON((prev) => !prev)}
          >
            {showFinalJSON ? "Hide Final JSON" : "Show Final JSON"}
          </button>
          {showFinalJSON && <JsonViewer data={finalJson} />}
        </div>

        {/* ---------------- */}
      </div>

      <div>
        <CostSheetPreview
          FINAL_DEBUG_DATA={FINAL_DEBUG_DATA}
        ></CostSheetPreview>
      </div>
    </div>
  );
}

