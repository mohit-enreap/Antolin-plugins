import { useMemo } from "react";

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

  if (!addOnComponents.length) return null;

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Add-On Component Configuration</h3>

      {/* <table border="1" width="100%">
        <thead>
          <tr>
            <th>Component</th>
            <th>Include</th>
            <th>No of Components</th>
          </tr>
        </thead>

        <tbody>
          {addOnComponents.map(({ activityKey, componentName }) => {
            // const value = addOnState[activityKey] || {
            //   componentSelected: false,
            //   noOfComponent: 1,
            // };

            const value =
              addOnState[activityKey] ??
              data.activities?.[activityKey]?.["ADD ON COMPONENTS"] ??
              {};

            return (
              <tr key={activityKey}>
                <td>{componentName}</td>

                <td>
                  <select
                    value={value.componentSelected ? "Yes" : "No"}
                    onChange={(e) =>
                      onAddOnChange({
                        activityKey,
                        field: "componentSelected",
                        value: e.target.value === "Yes",
                      })
                    }
                  >
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </td>

                <td>
                  <input
                    type="number"
                    min="1"
                    value={value.noOfComponent}
                    onChange={(e) =>
                      onAddOnChange({
                        activityKey,
                        field: "noOfComponent",
                        value: Number(e.target.value),
                      })
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table> */}
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
              // const value = addOnState[activityKey] || {
              //   componentSelected: false,
              //   noOfComponent: 1,
              // };

              const value =
                addOnState[activityKey] ??
                data.activities?.[activityKey]?.["ADD ON COMPONENTS"] ??
                {};

              return (
                <tr key={activityKey}>
                  <td>{componentName}</td>

                  <td>
                    <select
                      value={value.componentSelected ? "Yes" : "No"}
                      onChange={(e) =>
                        onAddOnChange({
                          activityKey,
                          field: "componentSelected",
                          value: e.target.value === "Yes",
                        })
                      }
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </td>

                  <td>
                    <input
                      type="number"
                      min="1"
                      value={value.noOfComponent}
                      onChange={(e) =>
                        onAddOnChange({
                          activityKey,
                          field: "noOfComponent",
                          value: Number(e.target.value),
                        })
                      }
                    />
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
