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

        const data = await invoke("compareQuotation", { issue }); // pass it as payload
        console.log("[compare] resolver result:", data); // full tree in browser console

        setStatus(
          `Read ${data.phases.length} phase(s) — see console for details`,
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
