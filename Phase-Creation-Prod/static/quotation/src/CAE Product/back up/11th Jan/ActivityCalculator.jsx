import React, { useState } from "react";
import GlobalParams from "./components/GlobalParams";
import ActivityTable from "./components/ActivityTable";
import ActivityTableLessDetails from "./components/ActivityTableLessDetails";
import ResultTable from "./components/ResultTable";
import JSONViewer from "./components/JSONViewer";
import CAESummaryTable from "./components/CAESummaryTable";
import { useActivityLogic } from "./hooks/useActivityLogic";

function ActivityCalculator() {
  const logic = useActivityLogic();

  const iterationTotal =
    logic.activities["ITERATIONS|ITERATIONS"]?.calculatedTotal || 0;

  const [showActivities, setShowActivities] = useState(false);

  return (
    <>
      <h1>CAE Calculator</h1>

      {/* 🌍 Global Parameters */}
      <GlobalParams
        globalTDL={logic.globalTDL}
        globalDE={logic.globalDE}
        setGlobalTDL={logic.setGlobalTDL}
        setGlobalDE={logic.setGlobalDE}
      />

      {/* 🔹 Compact Activities Table */}
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

      {/* 🔸 Full Activities Table */}
      {showActivities && (
        <ActivityTable
          activities={logic.activities}
          updateActivity={logic.updateActivity}
        />
      )}

      {/* 📊 Result Table */}
      <ResultTable
        activities={logic.activities}
        sumTDL={logic.sumTDL}
        sumDE={logic.sumDE}
        grand={logic.grandTotal}
        globalTDL={logic.globalTDL}
        globalDE={logic.globalDE}
      />

      {/* ✅ CAE Summary */}
      <CAESummaryTable
        standard={logic.sumTDL}
        iteration={iterationTotal}
        engineers={logic.sumDE}
      />

      {/* 📄 JSON OUTPUT (AUTO UPDATED) */}
      <div style={{ display: "flex", gap: "16px", marginTop: 16 }}>
        <div style={{ flex: 1 }}>
          <JSONViewer title="Temp JSON" json={logic.tempJSON} />
        </div>
        <div style={{ flex: 1 }}>
          <JSONViewer title="Final JSON" json={logic.finalJSON} />
        </div>
      </div>
    </>
  );
}

export default ActivityCalculator;
