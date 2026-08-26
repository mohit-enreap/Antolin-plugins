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
  // Use brackets for useState
  const [selectedQuotVersion, setSelectedQuotVersion] = useState("");

  // Destructure what you need from Context
  // Assuming you have a setter in context to update the global version
  const { allVersions, selectedVersion, setSelectedVersion } =
    useContext(StorageContext);

  // Sync local dropdown state when the global version changes (e.g., on initial load)
  useEffect(() => {
    if (selectedVersion) {
      setSelectedQuotVersion(selectedVersion);
    }
  }, [selectedVersion]);

  const handleApply = () => {
    console.log("Applying version data for:", selectedQuotVersion);

    // Update the global context so App.jsx triggers the loadAllValues functions
    if (setSelectedVersion) {
      setSelectedVersion(selectedQuotVersion);
    }

    alert(`Version ${selectedQuotVersion} applied successfully!`);
  };

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Warning Notice */}
      <p
        style={{
          // marginTop: "7px",
          marginBottom: "12px",
          padding: "10px 10px",
          backgroundColor: "#DEEBFF",
          color: "#0747A6",
          border: "1px solid #B3D4FF",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "16px" }}>⚠️</span>
        <span>
          <strong>NOTE:</strong> Only the latest quotation version can be saved.
        </span>
      </p>

      <br />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "400px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            style={{ fontSize: "16px", fontWeight: "bold", color: "#333" }}
          >
            Select the Quotation Version
          </label>
          <select
            value={selectedQuotVersion}
            onChange={(e) => setSelectedQuotVersion(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {/* Map directly from context (allVersions) or default to empty array */}
            {(allVersions || []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleApply}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 24px",
            background: "#0b74d1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          <span style={{ fontSize: "16px" }}>✓</span>
          Apply Version
        </button>

        <p style={{ fontSize: "12px", color: "#666", fontStyle: "italic" }}>
          Click on "Apply Version" to fetch the version data.
        </p>
      </div>
    </div>
  );
};

export default VersionSelection;
