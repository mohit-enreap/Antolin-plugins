import GlobalParams from "./components/GlobalParams";
import ActivityTable from "./components/ActivityTable";
import ActivityTableLessDetails from "./components/ActivityTableLessDetails";
import ResultTable from "./components/ResultTable";
import JSONViewer from "./components/JSONViewer";
import { useActivityLogic } from "./hooks/useActivityLogic";
import CAESummaryTable from "./components/CAESummaryTable";
import React, { useState } from "react";

import ShortcutPanel from "./components/ShortcutPanel";

// ✅ Import CAD hook with alias
import { useActivityLogic as useCADActivityLogic } from "../CAD Product/hooks/useActivityLogic";
function ActivityCalculator() {
  const logic = useActivityLogic();
  const iterationTotal =
    logic.activities["ITERATIONS|ITERATIONS"]?.calculatedTotal || 0;

  // ---- CAD logic (for quotation text only) ----
  const cadLogic = useCADActivityLogic();
  const quotationText = `Quotation: ${cadLogic.globalParams.product} ${cadLogic.globalParams.Customer} ${cadLogic.globalParams["ProjectName"]} ${cadLogic.globalParams["Type Of Development"]}`;
  const [showActivities, setShowActivities] = useState(false);
  const [showTempJSON, setShowTempJSON] = useState(false); // TEMP JSON viewer visibility
  return (
    <>
      <h1 style={{ color: "#0b74d1", marginBottom: 15 }}>{quotationText}</h1>
      <GlobalParams
        globalTDL={logic.globalTDL}
        globalDE={logic.globalDE}
        setGlobalTDL={logic.setGlobalTDL}
        setGlobalDE={logic.setGlobalDE}
      />
      <ShortcutPanel
        product={logic.product}
        shortcutValues={logic.shortcutValues}
        updateShortcutLoops={logic.updateShortcutLoops}
      />
      <ActivityTableLessDetails
        activities={logic.activities}
        updateActivity={logic.updateActivity}
      />
      <button
        onClick={() => setShowActivities((prev) => !prev)}
        style={{ marginBottom: 10 }}
      >
        {showActivities ? "Hide Activities Details" : "Show Activities Details"}
      </button>
      {showActivities && (
        <ActivityTable
          activities={logic.activities}
          updateActivity={logic.updateActivity}
        />
      )}
      {/* hidden for now */}
      {/* <ResultTable
        activities={logic.activities}
        sumTDL={logic.sumTDL}
        sumDE={logic.sumDE}
        grand={logic.grandTotal}
        globalTDL={logic.globalTDL}
        globalDE={logic.globalDE}
      /> */}
      {/* ✅ Small summary table – NO extra logic */}
      <CAESummaryTable
        protoTDL={logic.calculation?.protoSumTDL}
        protoDE={logic.calculation?.protoSumDE}
        protoIteration={
          logic.calculation?.activities?.["ITERATIONS|ITERATIONS"]
            ?.calculatedProtoTotal || 0
        }

        serieTDL={logic.calculation?.serieSumTDL}
        serieDE={logic.calculation?.serieSumDE}
        serieIteration={
          logic.calculation?.activities?.["ITERATIONS|ITERATIONS"]
            ?.calculatedSerieTotal || 0
        }
      />
      {/* <JSONViewer title="Temp JSON" json={logic.tempJSON} />
      <JSONViewer title="Final JSON" json={logic.finalJSON} /> */}
      {/* ---------------- Actions ---------------- */}
      {/*  // Logic for Forge save  temo and final on Click  */}
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          className="btn"
          onClick={logic.generateAndSaveJson}
        >
          ✅ Save CAE
        </button>
      </div>
      <p style={{ fontSize: "10px", color: "blue" }}>
        <span></span> CAE Data is auto refreshed
      </p>
      <div style={{ display: "flex", gap: "16px", marginTop: 16 }}>
        <div>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => setShowTempJSON((prev) => !prev)}
          >
            {showTempJSON ? "Hide Quotation JSON" : "Show Quotation JSON"}
          </button>
          {showTempJSON && <JSONViewer title="Quotation JSON" json={logic.tempJSON} />}
        </div>
        {/* <div style={{ flex: 1 }}>
          <JSONViewer title="Final JSON" json={logic.finalJSON} />
        </div> */}
      </div>
    </>
  );
}

export default ActivityCalculator;
