// import React, { useState, useContext, useEffect } from "react";
// import { StorageContext } from "./StorageContext";

// const VersionSelection = () => {
//   const { versions, setVersions } = useState([]);
//   const [selectedQuotVersion, setSelectedQuotVersion] = useState("");

//   const { allVersions, selectedVersion } = useContext(StorageContext);

//   useEffect(() => {
//     if (allVersions) {
//       setVersions(allVersions);
//     }
//   }, [allVersions]);

//   useEffect(() => {
//     if (selectedVersion) {
//       setSelectedQuotVersion(selectedVersion);
//     }
//   }, [selectedVersion]);

//   const handleApply = () => {
//     // You mentioned you will handle the data logic here
//     console.log("Applying version data for:", selectedQuotVersion);
//     alert(`Version ${selectedQuotVersion} applied successfully!`);
//   };

//   return (
//     <div style={{ padding: "20px 0" }}>
//       <p
//         style={{
//           marginTop: "15px",
//           padding: "10px 15px",
//           backgroundColor: "#fff3cd", // Light amber warning background
//           color: "#856404", // Dark amber text
//           border: "1px solid #ffeeba",
//           borderRadius: "6px",
//           fontSize: "13px",
//           fontWeight: "500",
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//         }}
//       >
//         <span style={{ fontSize: "16px" }}>⚠️</span>
//         <strong>Notice:</strong> This feature is currently under development and
//         is for internal testing only. Please do not use this feature.
//       </p>
//       <br />
//       <div
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           gap: "20px",
//           maxWidth: "400px",
//         }}
//       >
//         <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//           <label
//             style={{
//               fontSize: "16px",
//               fontWeight: "bold",
//               color: "#333",
//             }}
//           >
//             Select the Quotation Version
//           </label>
//           <select
//             value={selectedQuotVersion}
//             onChange={(e) => setSelectedQuotVersion(e.target.value)}
//             style={{
//               padding: "10px",
//               borderRadius: "6px",
//               border: "1px solid #ccc",
//               fontSize: "14px",
//               outline: "none",
//               cursor: "pointer",
//             }}
//           >
//             {versions.map((v) => (
//               <option key={v} value={v}>
//                 {v}
//               </option>
//             ))}
//           </select>
//         </div>

//         <button
//           onClick={handleApply}
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: "8px",
//             padding: "10px 24px",
//             background: "#0b74d1", // Matching your tab/save button blue
//             color: "white",
//             border: "none",
//             borderRadius: "6px",
//             fontWeight: "bold",
//             cursor: "pointer",
//             width: "fit-content",
//             transition: "background 0.2s",
//           }}
//           onMouseOver={(e) => (e.currentTarget.style.background = "#085ba3")}
//           onMouseOut={(e) => (e.currentTarget.style.background = "#0b74d1")}
//         >
//           {/* Using a simple Unicode checkmark to match your "Save CAD" style */}
//           <span style={{ fontSize: "16px" }}>✓</span>
//           Apply Version
//         </button>

//         <p style={{ fontSize: "12px", color: "#666", fontStyle: "italic" }}>
//           Click on "Apply Version" to fetch the version data.
//         </p>
//       </div>
//     </div>
//   );
// };

// export default VersionSelection;

import React, { useState, useContext, useEffect } from "react";
import { StorageContext } from "./StorageContext";

const VersionSelection = () => {
  const [selectedQuotVersion, setSelectedQuotVersion] = useState("");
  const { allVersions, selectedVersion, setSelectedVersion } = useContext(StorageContext);

  useEffect(() => {
    if (selectedVersion) {
      setSelectedQuotVersion(selectedVersion);
    }
  }, [selectedVersion]);

  const handleApply = () => {
    if (setSelectedVersion) {
      setSelectedVersion(selectedQuotVersion);
    }
    alert(`Version ${selectedQuotVersion} applied successfully!`);
  };

  return (
    <div style={{ padding: "20px 0", maxWidth: "450px" }}>
      
      {/* Warning Notice (Slightly customized since there is no native alert class in your CSS) */}
      <div style={{
        marginBottom: "16px",
        padding: "10px 14px",
        backgroundColor: "rgba(11, 116, 209, 0.08)", // Using a transparent version of your --blue
        color: "var(--blue)",
        border: "1px solid rgba(11, 116, 209, 0.2)",
        borderRadius: "6px",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <span style={{ fontSize: "18px" }}>ℹ️</span>
        <span><strong>NOTE:</strong> Only the latest quotation version can be saved.</span>
      </div>

      {/* We use YOUR .section class here for the card look! */}
      <div className="section" style={{ margin: "0", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
            Select the Quotation Version
          </label>
          {/* Inherits your global select styles automatically */}
          <select
            value={selectedQuotVersion}
            onChange={(e) => setSelectedQuotVersion(e.target.value)}
          >
            {(!allVersions || allVersions.length === 0) && (
              <option value="" disabled>No versions available</option>
            )}
            {(allVersions || []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          {/* We use YOUR .btn class here! Added inline flex just to align the SVG */}
          <button
            className="btn"
            onClick={handleApply}
            disabled={!selectedQuotVersion}
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px",
              opacity: !selectedQuotVersion ? 0.6 : 1,
              cursor: !selectedQuotVersion ? "not-allowed" : "pointer"
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
            </svg>
            Apply Version
          </button>
          
          {/* We use YOUR .small and .muted classes here! */}
          <div className="small muted" style={{ marginTop: "8px", fontStyle: "italic" }}>
            Click on "Apply Version" to fetch the version data.
          </div>
        </div>

      </div>
    </div>
  );
};

export default VersionSelection;