import React, { useEffect, useState } from "react";
import { invoke, view } from "@forge/bridge";

function App() {
  const [status, setStatus] = useState("loading…");

  useEffect(() => {
    (async () => {
      try {
        const context = await view.getContext(); // Forge tells us where we are
        const issue = context.extension.issue; // { key: "CTEST-1367", ... }
        console.log("[compare] context issue:", issue);

        // TEMP TEST 2 — list pickable quotation keys
        invoke("listQuotations").then((r) =>
          console.log("[compare] listQuotations:", r),
        );

        // TEMP TEST 3 — force a specific key to prove cookKey drives the cook
        const data = await invoke("compareQuotation", {
          issue,
          cookKey: "Centre Console",
        });
        console.log("[compare] resolver result:", data);

        setStatus(
          `Compared — ${data.result?.length ?? 0} phase(s), see console`,
        );
      } catch (e) {
        console.error("[compare] error:", e);
        setStatus("Error — see console");
      }
    })();
  }, []);

  return (
    <div className="p-4">
      <p className="text-lg font-semibold text-blue-600 mb-2">
        Compare Quotation — Step 2 (read)
      </p>
      <p>{status}</p>
    </div>
  );
}

export default App;
