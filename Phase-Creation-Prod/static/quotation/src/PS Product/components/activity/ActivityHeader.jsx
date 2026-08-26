import React from "react"; // Import React library

export default function ActivityHeader({
  activityName, // Name of the activity
  activityObj, // Object containing properties like 'checked' and 'order'
  onToggle, // Function to toggle activity status
}) {
  return (
    <div
      style={{
        display: "flex", // Arrange elements horizontally
        justifyContent: "space-between", // Push title and controls apart
        alignItems: "center", // Vertically center items
      }}
    >
      {/* Activity Title */}
      <h3 style={{ margin: "6px 0" }}>{activityName}</h3>

      {/* Right side controls (checkbox + order display) */}
      <div className="controls">
        <label className="small">
          Active{" "}
          <input
            type="checkbox" // Checkbox input
            checked={!!activityObj.checked} // Ensure boolean value
            onChange={
              (e) => onToggle(activityName, e.target.checked) // Invoke toggle callback
            }
          />
        </label>

        {/* Display activity order or '-' if not set */}
        <span className="small muted">Order: {activityObj.order || "-"}</span>
      </div>
    </div>
  );
}

// activityName, Checkbox status, and Order value are displayed from this component
