// entry piint for CAD (Step 1)

// when you click "calculated Temp"  it will call  handleTemp  function--> it will call --> calculateTempResults Method and get output ans set "setTempResults"

// when you click on save Final --> it will call "handleSaveFinal" method-->
//  1) it will update final payload(Considering global yes/no) i.e saveFinal(payload)
//  2) then call calculateFinalResults  and get calculated result based on final Payload
// 3) then set value for display i.e  setFinalResults(final);
// 4) then use Global and Json for Final Display
import React, { useState } from "react";

// --- UI Components ---
import ProductPartsGlobal from "../../global/ProductPartsGlobal";
import ActivitySubactivityTable from "../../global/ActivitySubactivityTable";
import GlobalParams from "../../global/GlobalParams";
import ActivityContainer from "../../activity/ActivityContainer";
import TempResultTable from "../../results/TempResultTable";
import FinalResultTable from "../../results/FinalResultTable";
import JsonViewer from "../../results/JsonViewer";

// --- MAIN LOGIC HOOK ---
import { useActivityLogic } from "../../../hooks/useActivityLogic";

export default function CADCalculator() {
  console.log("=== [CADCalculator] Component Rendered ===");

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
  } = useActivityLogic();

  // --- LOCAL STATE FOR DISPLAYING RESULTS ---
  const [tempResults, setTempResults] = useState([]);
  const [finalResults, setFinalResults] = useState([]);
  const [finalJson, setFinalJson] = useState(null);
  const [threeDfinalJson, setthreeDfinalJson] = useState(null);
  const [twoDfinalJson, settwoDfinalJson] = useState(null);
  const [dataManagementfinalJson, setdataManagementfinalJson] = useState(null);
  const [geometricStudyfinalJson, setgeometricStudyfinalJson] = useState(null);

  // =====================================================================
  //                     TEMP CALCULATION (NO IMPACT TO ORIGINAL JSON)
  // =====================================================================
  function handleTemp() {
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
      twoDResults,
      dataManagementResults,
      geometricalStudyResults,
    } = calculateTempResults({
      Global: globalParams,
      activities: jsonData.activities,
    });

    console.log("[TEMP] Computed Results:", twoDResults);
    setTempResults(results); // once Set "Temp" it Will Display -  all result (32 d,2d ,dm ,gm )
    setthreeDfinalJson(threeDResults); // once Set "Temp" it Will Display-  all result (3d d,2d ,dm ,gm )
    settwoDfinalJson(twoDResults); // once Set "Temp" it Will Display-  all result (2d  )
    setdataManagementfinalJson(dataManagementResults); //once Set "Temp" it Will Display- all result (dm )
    setgeometricStudyfinalJson(geometricalStudyResults); //once Set "Temp" it Will Display- all result (gm )
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
    saveFinal(payload); // Step 1 : Updating final json With Based on UI changes

    console.log("[FINAL SAVE] Activities Updated:", jsonData.activities);

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
      activities: jsonData.activities,
    });

    console.log("[FINAL SAVE] Final Result Table Data:", results);

    setFinalResults(results); // Step 3 : Result display in table

    setthreeDfinalJson(threeDResults); // once Set "Temp" it Will Display-  all result (3d  )
    settwoDfinalJson(twoDResults); // once Set "Temp" it Will Display-  all result (2d  )
    setdataManagementfinalJson(dataManagementResults); //once Set "Temp" it Will Display- all result (dm )
    setgeometricStudyfinalJson(geometricalStudyResults); //once Set "Temp" it Will Display- all result (gs )

    // Create final JSON output for display
    const finalOutput = {
      Global: globalParams,
      activities: JSON.parse(JSON.stringify(jsonData.activities)),
    };

    console.log("[FINAL SAVE] Final JSON:", finalOutput);

    setFinalJson(finalOutput); // Step 4 : Json SET final for Work order

    alert("Final data saved (values multiplied per Global toggles).");
  }

  // =====================================================================
  //                                RENDER UI
  // =====================================================================
  return (
    <div>
      <h1 style={{ color: "#0b74d1", marginBottom: 15 }}>
        Quotation Activity Calculator — HeadLiner
      </h1>

      {/* --------------------------------------------------------------
         GLOBAL YES/NO PARAMETERS BLOCK
         - Shows the buttons / toggles
         - updateGlobalParam() will update globalParams
        -------------------------------------------------------------- */}
      <GlobalParams globalParams={globalParams} onChange={updateGlobalParam} />

      {/* <ProductPartsGlobal data={jsonData} onChange={updateGlobalProductPart} /> */}
      <ProductPartsGlobal
        data={jsonData}
        applyGlobalChange={applyGlobalProductChange}
      />
      <ActivitySubactivityTable
        data={jsonData}
        onChange={updateGlobalActivitySubactivity}
      />

      {/* --------------------------------------------------------------
         ACTION BUTTONS: TEMP + FINAL SAVE
        -------------------------------------------------------------- */}
      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={handleTemp}>
          Calculate Temp
        </button>

        <button
          className="btn"
          style={{ marginLeft: 8 }}
          onClick={handleSaveFinal}
        >
          Save Final
        </button>

        {/* --------------------------------------------------------------
        ACTIVITY CONTAINER
        - Shows list of activities
        - Shows each product + its sub parameters
        - Handles update product & update sub values
        -------------------------------------------------------------- */}
        <ActivityContainer
          jsonData={jsonData}
          onToggleActivity={toggleActivityChecked}
          onUpdateProductValue={updateProductValue}
          onUpdateSubValue={updateSubValue}
        />
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
        {/* TEMP all TABLE */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Temp Results</h3>
          <TempResultTable results={tempResults} />
        </div>
        {/* TEMP 3d TABLE */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Temp 3d Results</h3>
          <TempResultTable results={threeDfinalJson} />
        </div>
        {/* TEMP 2d TABLE */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Temp 2d Results</h3>
          <TempResultTable results={twoDfinalJson} />
        </div>
        {/* TEMP dm TABLE */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Temp dm Results</h3>
          <TempResultTable results={dataManagementfinalJson} />
        </div>
        {/* TEMP gm TABLE */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Temp gm Results</h3>
          <TempResultTable results={geometricStudyfinalJson} />
        </div>

        {/* FINAL TABLE */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Final Results</h3>
          <FinalResultTable results={finalResults} />
        </div>

        {/* Temo  JSON */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Temp JSON</h3>
          <JsonViewer data={jsonData} />
        </div>

        {/* FINAL JSON */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3>Final JSON</h3>
          <JsonViewer data={finalJson} />
        </div>
      </div>
    </div>
  );
}
