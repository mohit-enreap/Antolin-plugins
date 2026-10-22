import React, { useMemo } from "react";

export default function AddOnComponentsTable({
  data,
  addOnState,
  onAddOnChange,
}) {
  /* --------------------------------
     Extract ADD-ON components
  -------------------------------- */
  const addOnComponents = useMemo(() => {
    return Object.entries(data?.activities || {})
      .filter(([key]) => key.startsWith("ADD ON COMPONENTS |"))
      .map(([key]) => ({
        activityKey: key,
        componentName: key.split("|")[1].trim(),
      }));
  }, [data]);

  // Unified handler to process quantity and selection state together
  const handleQuantityChange = (activityKey, newQuantity) => {
    const safeQty = Math.max(0, newQuantity);
    const isSelected = safeQty > 0;

    // Fire update for quantity
    onAddOnChange({
      activityKey,
      field: "noOfComponent",
      value: safeQty,
    });

    // Fire update for selection status
    onAddOnChange({
      activityKey,
      field: "componentSelected",
      value: isSelected,
    });
  };

  if (!addOnComponents.length) return null;

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Add-On Component Configuration</h3>

      <div className="table-container">
        <table className="config-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Include</th>
              <th>No of Components</th>
            </tr>
          </thead>

          <tbody>
            {addOnComponents.map(({ activityKey, componentName }) => {
              const value =
                addOnState[activityKey] ??
                data.activities?.[activityKey]?.["ADD ON COMPONENTS"] ??
                {};

              let isSelected = value.componentSelected ?? false;
              let currentQty = value.noOfComponent ?? 0;

              // --- SANITIZE SAVED DATA ---
              if (isSelected === false) {
                currentQty = 0;
              } else if (isSelected === true && currentQty === 0) {
                currentQty = 1;
              }
              // ---------------------------

              return (
                <tr key={activityKey}>
                  <td>{componentName}</td>

                  {/* Auto-updating Badge */}
                  <td>
                    <span className={`status-badge ${isSelected ? "status-yes" : "status-no"}`}>
                      {isSelected ? "Yes" : "No"}
                    </span>
                  </td>

                  {/* Quantity Controls */}
                  <td>
                    <div className="quantity-control">
                      <button
                        className="quantity-button"
                        onClick={() => handleQuantityChange(activityKey, currentQty - 1)}
                        disabled={currentQty === 0}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        className="quantity-input"
                        value={currentQty}
                        onChange={(e) => handleQuantityChange(activityKey, Number(e.target.value))}
                      />
                      <button
                        className="quantity-button"
                        onClick={() => handleQuantityChange(activityKey, currentQty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}