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

// --- MAIN LOGIC HOOK ---
import { useActivityLogic } from "../../../hooks/useActivityLogic";

// ✅ Import CAD hook with alias
import { useActivityLogic as useCADActivityLogic } from "../../../../CAD Product/hooks/useActivityLogic";

import { StorageContext } from "../../../../StorageContext";
import {sharedRef} from "../../../../shared/sharedStore";

export default function PSCalculator() {
  console.log("=== [PS Calculator] Component Rendered ===");

  const { storedDataPs, handleSavePs, selectedVersion, currentVersion, statusValue } =
    useContext(StorageContext);

  //------------- recalculation useefect start ---------------------
  useEffect(() => {
    if (storedDataPs && !storedDataPs.hasOwnProperty("id")) {
      console.log("Recalculate : \n", storedDataPs);
      const result = calculateTempResults({
        Global: storedDataPs["Global"],
        activities: storedDataPs.activities,
      });

      // calculateAndSetAggregates(result);
    }
  }, [storedDataPs]);

  // Style added in Page
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
    // PDF data
    pdfData,
    PS_SHORTCUT,
  } = useActivityLogic();

  // ---- CAD logic (for quotation text only) ----
  const cadLogic = useCADActivityLogic();
  const quotationText = `Quotation: ${cadLogic.globalParams.product} ${cadLogic.globalParams.Customer} ${cadLogic.globalParams["ProjectName"]} ${cadLogic.globalParams["Type Of Development"]}`;

  console.log("Quotation Text from CAD:", quotationText);

  // DUmmy data for Cost sheet
  // DUmmy data for Cost sheet
  const rfqData = {
    rows: [
      {
        org: "G.A. Deutschland",
        role: "TDL",
        phase0: { hours: null, cost: null },
        phase1: { hours: 520.33, cost: 38348.32 },
        phase2: { hours: 531.06, cost: 39139.45 },
        phase34: { hours: null, cost: null },
        total: { hours: 1051.39, cost: 77487.77 },
      },
      {
        org: "G.A. Deutschland",
        role: "COO",
        phase0: { hours: null, cost: null },
        phase1: { hours: 520.33, cost: 38348.32 },
        phase2: { hours: 531.06, cost: 39139.45 },
        phase34: { hours: null, cost: null },
        total: { hours: 1051.39, cost: 77487.77 },
      },
      {
        org: "G.A. Deutschland",
        role: "DE",
        phase0: { hours: null, cost: null },
        phase1: { hours: 520.33, cost: 38348.32 },
        phase2: { hours: 531.06, cost: 39139.45 },
        phase34: { hours: null, cost: null },
        total: { hours: 1051.39, cost: 77487.77 },
      },
      {
        org: "G.A. Deutschland",
        role: "2d Antolin Drawings",
        phase0: { hours: null, cost: null },
        phase1: { hours: 520.33, cost: 38348.32 },
        phase2: { hours: 531.06, cost: 39139.45 },
        phase34: { hours: null, cost: null },
        total: { hours: 1051.39, cost: 77487.77 },
      },
      {
        org: "G.A. Deutschland",
        role: "2d Customer Drawings",
        phase0: { hours: null, cost: null },
        phase1: { hours: 520.33, cost: 38348.32 },
        phase2: { hours: 531.06, cost: 39139.45 },
        phase34: { hours: null, cost: null },
        total: { hours: 1051.39, cost: 77487.77 },
      },
      {
        org: "G.A. Deutschland",
        role: "Data Management",
        phase0: { hours: null, cost: null },
        phase1: { hours: 520.33, cost: 38348.32 },
        phase2: { hours: 531.06, cost: 39139.45 },
        phase34: { hours: null, cost: null },
        total: { hours: 1051.39, cost: 77487.77 },
      },
      {
        org: "G.A. Deutschland",
        role: "Geometrical Study",
        phase0: { hours: null, cost: null },
        phase1: { hours: 1000 * (50 / 100), cost: 2 },
        phase2: { hours: 1000 * (40 / 100), cost: 10 },
        phase34: { hours: null, cost: 10 },
        total: { hours: 1051.39, cost: 77487.77 },
      },
      {
        org: "G.A. Deutschland",
        role: "Feasibility",
        phase0: { hours: null, cost: null },
        phase1: { hours: 520.33, cost: 38348.32 },
        phase2: { hours: 531.06, cost: 39139.45 },
        phase34: { hours: null, cost: null },
        total: { hours: 1051.39, cost: 77487.77 },
      },
    ],
  };

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
  const [sumDMDResultsActivities, setsumDMDResultsActivities] = useState(null);
  const [sumGSResultsActivities, setsumGSDResultsActivities] = useState(null);

  // --- SHOW / HIDE ACTIVITY CONTAINER ---
  const [showActivities, setShowActivities] = useState(false);

  const [showActivitiesGlobal, setActivitiesGlobal] = useState(true);
  const [customerProductConfig, setCustomerProductConfig] = useState({});

  //one button to toggle(SHOW / HIDE ) the visibility of your MainCostSheet component
  const [showCostSheet, setShowCostSheet] = useState(true); // initially visible

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

  const updateCustomerProductConfig = () => {
    console.log("----------NISHANT-------------");
    setCustomerProductConfig(data);
  };

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

  function loadData() {
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
      dataManagementResults,
      dataMgmtAggregatedTotal,
      geometricalStudyResults,
      geoAggregatedTotal,
    } = calculateTempResults({
      Global: globalParams,
      activities: jsonData.activities,
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
    setsumDMDResultsActivities(dataMgmtAggregatedTotal);
    setsumGSDResultsActivities(geoAggregatedTotal);

    // Create temp JSON output for display
    const tempJSONOutput = {
      Global: globalParams,
      global2DRows,
      activities: JSON.parse(JSON.stringify(jsonData.activities)),
    };
    // Create temp JSON output for display
    const tempJSONOutput1 = {};

    setTempJson(tempJSONOutput);
  }

  function handleTemp() {
    if (selectedVersion !== currentVersion && sharedRef.isCheatActive === false) {
      alert("OLD VERSIONS CANNOT BE MODIFIED!");
      return;
    }

    if (statusValue === "Closed" && sharedRef.isCheatActive === false) {
      alert("CLOSED QUOTATIONS CANNOT BE MODIFIED!");
      return;
    }

    alert("PS Saved!");
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
      dataManagementResults,
      dataMgmtAggregatedTotal,
      geometricalStudyResults,
      geoAggregatedTotal,
    } = calculateTempResults({
      Global: globalParams,
      activities: jsonData.activities,
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
    setsumDMDResultsActivities(dataMgmtAggregatedTotal);
    setsumGSDResultsActivities(geoAggregatedTotal);

    // Create temp JSON output for display
    const tempJSONOutput = {
      Global: globalParams,
      global2DRows,
      activities: JSON.parse(JSON.stringify(jsonData.activities)),
    };
    // Create temp JSON output for display
    const tempJSONOutput1 = {};

    handleSavePs(tempJSONOutput);

    setTempJson(tempJSONOutput);
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
  // =====================================================================
  //                                RENDER UI
  // =====================================================================
  return (
    <div>
      <h1 style={{ color: "#0b74d1", marginBottom: 15 }}>{quotationText}</h1>

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

      <div style={styles.column}>
        <GlobalParams
          globalParams={globalParams}
          onChange={updateGlobalParam}
        />
      </div>

      <div style={styles.column}>
        <ProductPartsGlobal
          data={jsonData}
          applyGlobalChange={applyGlobalProductChange}
          PS_SHORTCUT={PS_SHORTCUT}
        />
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

      <ActivitySubactivityTable
        data={jsonData}
        onChange={updateGlobalActivitySubactivity}
      />

      {/* --------------------------------------------------------------
         ACTION BUTTONS: TEMP + FINAL SAVE
        -------------------------------------------------------------- */}
      <div style={{ marginTop: 12 }}>
        <div style={{ margin: 5, display: "flex", gap: "20px" }}>
          <button className="btn" onClick={loadData}>
            🔄 Refresh
          </button>

          <button className="btn" onClick={handleTemp}>
            ✅ Save PS
          </button>
        </div>
        <p style={{ fontSize: "10px", color: "blue" }}>
          <span></span> Click on Refresh to Recalculate data
        </p>
        {/* 
        <button
          className="btn"
          style={{ marginLeft: 8 }}
          onClick={handleSaveFinal}
        >
          Save Final
        </button> */}

        {/* --------------------------------------------------------------
        ACTIVITY CONTAINER
        - Shows list of activities
        - Shows each product + its sub parameters
        - Handles update product & update sub values
        -------------------------------------------------------------- */}
        <br />
        <br />
        {/* <button
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
        )} */}
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
        <div>
          {" "}
          {/* old  You can ignore now
         <RFQPhaseTable data={rfqData} /> */}
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowCostSheet(!showCostSheet)}
          >
            {" "}
            {showCostSheet ? "Hide Cost Sheet" : "Show Cost Sheet"}
          </button>
          {showCostSheet && (
            <MainCostSheet
              threeD={sumthreeDResultsActivities}
              twoD={sumtwoDResultsActivities}
              dm={sumDMDResultsActivities}
              gs={sumGSResultsActivities}
            />
          )}
        </div>

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
            {showTempJSON ? "Hide Quotation JSON" : "Show Quotation JSON"}
          </button>
          {showTempJSON && <JsonViewer data={tempJson} />}
        </div>

        {/* <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowFinalJSON((prev) => !prev)}
          >
            {showFinalJSON ? "Hide Final JSON" : "Show Final JSON"}
          </button>
          {showFinalJSON && <JsonViewer data={finalJson} />}
        </div> */}

        {/* ---------------- */}
      </div>
    </div>
  );
}
