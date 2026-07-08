import React from "react";
import Button from "@atlaskit/button/standard-button";

function App() {
  return (
    <div className="p-4">
      {" "}
      {/* Tailwind layout */}
      <p className="text-lg font-semibold text-blue-600 mb-3">
        Compare Quotation — module loaded ✅
      </p>
      <Button appearance="primary">Atlaskit button</Button>{" "}
      {/* native Jira component */}
    </div>
  );
}

export default App;
