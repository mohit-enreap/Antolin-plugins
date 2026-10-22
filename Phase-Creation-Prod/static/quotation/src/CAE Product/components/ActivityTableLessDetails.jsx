import React from "react";

const VARIANTS = ["RT", "HT", "LT"]; // Variants to merge dynamically

function ActivityTableLessDetails({ activities, updateActivity }) {
  const HIDE_LOOP_ACTIVITIES = [
    "Initial meetings",
    "CAD & CAE inputs review (material cards revision)",
    "Project Planning and Documentation",
  ];

  // Helper to format values: hides decimals for 0 or integers, shows 2 decimals otherwise
  const formatValue = (val) => {
    if (val == null || isNaN(val)) return 0;
    // Rounding to 2 places to prevent floating point inaccuracies (e.g., 3.0000000004)
    const num = Math.round(Number(val) * 100) / 100;
    return Number.isInteger(num) ? num : num.toFixed(2);
  };

  // Step 1: Group by main section (TCL ACTIVITIES, etc.)
  const grouped = Object.entries(activities).reduce((acc, [key, act]) => {
    const [group, name] = key.split("|");
    if (!acc[group]) acc[group] = [];
    acc[group].push({ key, name, act });
    return acc;
  }, {});

  // Step 2: Merge RT/HT/LT variants for UI display
  const mergeVariants = (rows) => {
    const map = {};
    const normalRows = [];

    rows.forEach((row) => {
      const variant = VARIANTS.find((v) => row.name.endsWith(v));
      if (!variant) {
        normalRows.push(row);
        return;
      }

      const baseName = row.name.replace(` ${variant}`, "");
      if (!map[baseName]) map[baseName] = {};
      map[baseName][variant] = row;
    });

    return { merged: map, normal: normalRows };
  };

  // Shared input style to keep things neat and centered
  const inputStyle = {
    maxWidth: "70px",
    textAlign: "center",
    margin: "0 auto",
  };

  return (
    <section className="section">
      <h2 style={{ marginBottom: "20px" }}>Activities</h2>

      <div className="table-container">
        <table className="config-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left", width: "25%" }}>Activity</th>
              <th style={{ textAlign: "center" }}>Proto</th>
              <th style={{ textAlign: "center" }}>Serie</th>
              <th colSpan={3} style={{ textAlign: "center" }}>
                Components (RT/HT/LT)
              </th>
              <th style={{ textAlign: "center" }}>Select</th>
              <th style={{ textAlign: "center" }}>Total (Std)</th>
              <th style={{ textAlign: "center" }}>Total (Selected)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([group, rows]) => {
              const { merged, normal } = mergeVariants(rows);

              return (
                <React.Fragment key={group}>
                  {/* Group Header */}
                  <tr
                    style={{
                      backgroundColor: "#e0eefd",
                      fontWeight: "bold",
                    }}
                  >
                    <td
                      colSpan={9} // Adjusted from 14 to match actual column count
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "#333",
                      }}
                    >
                      {group}
                    </td>
                  </tr>

                  {/* Normal rows */}
                  {normal.map(({ key, name, act }) => (
                    <tr key={key}>
                      <td style={{ paddingLeft: "24px", fontWeight: "500" }}>
                        {name}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
                          <input
                            type="number"
                            min="0"
                            value={act.proto || 0}
                            style={inputStyle}
                            onChange={(e) =>
                              updateActivity(key, "proto", +e.target.value)
                            }
                          />
                        ) : (
                          <span style={{ color: "#999" }}>-</span>
                        )}
                      </td>

                      <td style={{ textAlign: "center" }}>
                        {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
                          <input
                            type="number"
                            min="0"
                            value={act.serie || 0}
                            style={inputStyle}
                            onChange={(e) =>
                              updateActivity(key, "serie", +e.target.value)
                            }
                          />
                        ) : (
                          <span style={{ color: "#999" }}>-</span>
                        )}
                      </td>

                      <td colSpan={3} style={{ textAlign: "center" }}>
                        {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
                          <input
                            type="number"
                            min="1"
                            value={act.noOfLoops}
                            style={inputStyle}
                            onChange={(e) =>
                              updateActivity(key, "noOfLoops", +e.target.value)
                            }
                          />
                        ) : (
                          <span style={{ color: "#999" }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={act.checked}
                          style={{ margin: "0 auto" }}
                          onChange={(e) =>
                            updateActivity(key, "checked", e.target.checked)
                          }
                        />
                      </td>
                      <td style={{ textAlign: "center", color: "#555" }}>
                        {formatValue(act.previewTotal / 2)}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        {formatValue(
                          !name.includes("ITERATIONS")
                            ? (act.calculatedTotal || 0) / 2
                            : act.calculatedTotal || 0
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Merged RT/HT/LT rows */}
                  {Object.entries(merged).map(([baseName, variants]) => {
                    const total =
                      (variants.RT?.act.calculatedTotal || 0) +
                      (variants.HT?.act.calculatedTotal || 0) +
                      (variants.LT?.act.calculatedTotal || 0);

                    return (
                      <tr key={baseName}>
                        <td style={{ paddingLeft: "24px", fontWeight: "500" }}>
                          {baseName}
                        </td>

                        {/* Proto (shared) */}
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            value={variants.RT?.act.proto || 0}
                            style={inputStyle}
                            onChange={(e) =>
                              VARIANTS.forEach((v) => {
                                const r = variants[v];
                                if (r)
                                  updateActivity(r.key, "proto", +e.target.value);
                              })
                            }
                          />
                        </td>

                        {/* Serie (shared) */}
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            value={variants.RT?.act.serie || 0}
                            style={inputStyle}
                            onChange={(e) =>
                              VARIANTS.forEach((v) => {
                                const r = variants[v];
                                if (r)
                                  updateActivity(r.key, "serie", +e.target.value);
                              })
                            }
                          />
                        </td>

                        {/* Variant Columns */}
                        {VARIANTS.map((v) => {
                          const row = variants[v];

                          return (
                            <td
                              key={v}
                              style={{
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              {row ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  {/* Label */}
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "bold",
                                      color: "var(--blue, #0b74d1)",
                                    }}
                                  >
                                    {v}
                                  </div>

                                  {/* Loop Input (SYNCED) */}
                                  <input
                                    type="number"
                                    min="1"
                                    value={row.act.noOfLoops}
                                    style={{ ...inputStyle, maxWidth: "50px" }}
                                    onChange={(e) => {
                                      const value = +e.target.value;
                                      // Sync across all variants
                                      VARIANTS.forEach((variantKey) => {
                                        const r = variants[variantKey];
                                        if (r) {
                                          updateActivity(
                                            r.key,
                                            "noOfLoops",
                                            value
                                          );
                                        }
                                      });
                                    }}
                                  />

                                  {/* Separate Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={row.act.checked}
                                    style={{ margin: 0 }}
                                    onChange={(e) =>
                                      updateActivity(
                                        row.key,
                                        "checked",
                                        e.target.checked
                                      )
                                    }
                                  />
                                </div>
                              ) : (
                                <span style={{ color: "#999" }}>-</span>
                              )}
                            </td>
                          );
                        })}

                        <td style={{ textAlign: "center" }}> </td>
                        <td style={{ textAlign: "center", color: "#555" }}>
                          {formatValue(total / 2)}
                        </td>
                        <td
                          style={{
                            textAlign: "center",
                            fontWeight: "bold",
                            color: "#333",
                          }}
                        >
                          {formatValue(total / 2)}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ActivityTableLessDetails;