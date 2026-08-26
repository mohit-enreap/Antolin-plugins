import React from "react";

export function StepMouldShortCutActivities({
  incomingData,
  incomingCounter,
  updateActivityValue,
}) {
  const counter = incomingCounter ?? 0;

  const handleChange = (section, name, value) => {
    updateActivityValue(section, name, value);
  };

  return (
    <section className="section" style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "24px" }}>Step Mould Shortcut</h2>

      <div style={{ width: "100%", maxWidth: "900px" }}>
        {Object.entries(incomingData || {}).map(([section, activities]) => {
          const entries = Object.entries(activities || {});

          if (entries.length === 0) return null;

          return (
            <div key={section} style={{ marginBottom: "32px" }}>

              <div
                style={{
                  fontSize: "1.1em",
                  fontWeight: "600",
                  color: "#555",
                  fontStyle: "italic",
                  marginBottom: "8px",
                  textTransform: "capitalize",
                  paddingLeft: "4px"
                }}
              >
                {section}
              </div>

              <div
                style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  border: "1px solid #e0e0e0",
                  backgroundColor: "#fff"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <tbody>
                    {entries.map(([name, value], index) => (
                      <tr key={name}>

                        <td
                          style={{
                            backgroundColor: "#1c7ab0",
                            color: "white",
                            padding: "12px 16px",
                            borderBottom: "2px solid #ffffff",
                            width: "60%",
                            fontWeight: "500",
                          }}
                        >
                          {name}
                        </td>

                        <td
                          style={{
                            backgroundColor: "#d0e8c0",
                            textAlign: "center",
                            borderBottom: "2px solid #ffffff",
                            borderLeft: "2px solid #ffffff",
                            width: "20%",
                            padding: "8px",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            value={value ?? 0}
                            onChange={(e) =>
                              handleChange(section, name, e.target.value)
                            }
                            style={{
                              width: "70px",
                              padding: "6px",
                              border: "1px solid rgba(0,0,0,0.1)",
                              borderRadius: "4px",
                              background: "rgba(255, 255, 255, 0.65)",
                              textAlign: "center",
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          />
                        </td>

                        {/* Counter Cell (Spans all rows) */}
                        {index === 0 && (
                          <td
                            rowSpan={entries.length}
                            style={{
                              borderLeft: "2px solid #ffffff",
                              width: "20%",
                              padding: 0,
                              backgroundColor: "#f7df99", // Moved yellow to the TD so it always covers the full height
                              height: "1px",              // Magic trick to allow inner div to stretch to 100%
                              verticalAlign: "top",       // Keeps the grey header pinned to the top
                            }}
                          >
                            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

                              {/* Gray Header */}
                              <div
                                style={{
                                  background: "#e3e3e3",
                                  color: "#444",
                                  textAlign: "center",
                                  borderBottom: "2px solid #ffffff",
                                  fontWeight: "bold",
                                  padding: "12px",
                                }}
                              >
                                N° Com.
                              </div>

                              {/* Counter Body Container */}
                              <div
                                style={{
                                  flexGrow: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center", /* 🔹 CHANGE THIS TO "flex-start" IF YOU WANT IT AT THE TOP 🔹 */
                                  alignItems: "center",
                                  padding: "16px 10px",
                                  color: "#555",
                                }}
                              >
                                <div style={{ fontSize: "0.95em", marginBottom: "4px" }}>
                                  out of
                                </div>
                                <div style={{ fontWeight: "bold", fontSize: "1.6em", color: "#222" }}>
                                  {counter}
                                </div>
                              </div>

                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}