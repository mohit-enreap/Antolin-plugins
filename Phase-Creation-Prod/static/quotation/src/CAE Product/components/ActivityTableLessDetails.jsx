import React from "react";

const VARIANTS = ["RT", "HT", "LT"]; // Variants to merge dynamically

function ActivityTableLessDetails({ activities, updateActivity }) {
  const HIDE_LOOP_ACTIVITIES = [
    "Initial meetings",
    "CAD & CAE inputs review (material cards revision)",
    "Project Planning and Documentation",
  ];
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

  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 6 }}>
      <h2>Activities</h2>

      <table width="100%" border="1" cellPadding="6">
        <thead>
          <tr style={{ background: "#0b72d0", color: "#fff" }}>
            <th>Activity</th>
            <th>Proto</th>
            <th>Serie</th>
            <th colSpan={3}>Components (RT/HT/LT)</th>
            <th>Select</th>
            <th>Total (Std)</th>
            <th>Total (Selected)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([group, rows]) => {
            const { merged, normal } = mergeVariants(rows);

            return (
              <React.Fragment key={group}>
                {/* Group Header */}
                <tr>
                  <td
                    colSpan={14}
                    style={{
                      background: "#0b72d0",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {group}
                  </td>
                </tr>

                {/* Normal rows */}
                {normal.map(({ key, name, act }) => (
                  <tr key={key}>
                    <td>{name}</td>
                    <td>
                      {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
                        <input
                          type="number"
                          min="0"
                          value={act.proto || 0}
                          onChange={(e) =>
                            updateActivity(key, "proto", +e.target.value)
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>
                      {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
                        <input
                          type="number"
                          min="0"
                          value={act.serie || 0}
                          onChange={(e) =>
                            updateActivity(key, "serie", +e.target.value)
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td colSpan={3}>
                      {!HIDE_LOOP_ACTIVITIES.includes(name) ? (
                        <input
                          type="number"
                          min="1"
                          value={act.noOfLoops}
                          onChange={(e) =>
                            updateActivity(key, "noOfLoops", +e.target.value)
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={act.checked}
                        onChange={(e) =>
                          updateActivity(key, "checked", e.target.checked)
                        }
                      />
                    </td>
                    <td>{act.previewTotal || 0}</td>
                    <td>{act.calculatedTotal || 0}</td>
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
                      <td>{baseName}</td>

                      {/* Proto (shared) */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={variants.RT?.act.proto || 0}
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
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={variants.RT?.act.serie || 0}
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
                          <td key={v} style={{ textAlign: "center" }}>
                            {row ? (
                              <>
                                {/* Label */}
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    marginBottom: "3px",
                                  }}
                                >
                                  {v}
                                </div>

                                {/* Loop Input (SYNCED) */}
                                <input
                                  type="number"
                                  min="1"
                                  value={row.act.noOfLoops}
                                  onChange={(e) => {
                                    const value = +e.target.value;

                                    // Sync across all variants
                                    VARIANTS.forEach((variantKey) => {
                                      const r = variants[variantKey];
                                      if (r) {
                                        updateActivity(
                                          r.key,
                                          "noOfLoops",
                                          value,
                                        );
                                      }
                                    });
                                  }}
                                />

                                {/* Separate Checkbox */}
                                <div>
                                  <input
                                    type="checkbox"
                                    checked={row.act.checked}
                                    onChange={(e) =>
                                      updateActivity(
                                        row.key,
                                        "checked",
                                        e.target.checked,
                                      )
                                    }
                                  />
                                </div>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}

                      <td>{total}</td>
                      <td>{total}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityTableLessDetails;
