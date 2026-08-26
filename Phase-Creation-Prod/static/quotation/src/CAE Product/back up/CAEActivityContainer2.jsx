import React, { useState, useEffect } from "react";
import { caeInitialData } from "../data/caeInitialData";

const initialData = caeInitialData;

function ActivityCalculator() {
  const [data, setData] = useState(initialData);
  const [globalTDL, setGlobalTDL] = useState(1);
  const [globalDE, setGlobalDE] = useState(1);
  const [tempJSON, setTempJSON] = useState("");
  const [finalJSON, setFinalJSON] = useState("");

  const updateActivity = (key, field, value) => {
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.CAE.activities[key][field] = value;
      return copy;
    });
  };

  const calculateResults = () => {
    let sumTDL = 0,
      sumDE = 0,
      grand = 0;
    const activities = JSON.parse(JSON.stringify(data.CAE.activities));

    Object.entries(activities).forEach(([key, a]) => {
      if (key === "ITERATIONS|ITERATIONS") return;

      const tdl = a.checked ? a.TDL * globalTDL : 0;
      const de = a.checked ? a.DE * globalDE : 0;
      const coo = a.checked ? a.COO : 0;
      const total = (tdl + de + coo) * a.noOfLoops;

      a.calculatedTotal = total;

      sumTDL += tdl;
      sumDE += de;
      grand += total;
    });

    // ITERATIONS calculation
    const iter = activities["ITERATIONS|ITERATIONS"];
    if (iter && iter.checked) {
      const iterDE = Object.entries(activities)
        .filter(([k, a]) => a.checked && k !== "ITERATIONS|ITERATIONS")
        .reduce((s, [k, a]) => s + a.DE * globalDE, 0);
      const iterTotal =
        ((iterDE * (iter.percentage || 0)) / 100) * iter.noOfLoops;
      iter.calculatedTotal = iterTotal;
      alert("iter.calculatedTotal :" + iter.calculatedTotal);
      iter.calculatedTotal = iterTotal;
      grand += iterTotal;
    }

    return { activities, sumTDL, sumDE, grand };
  };

  const applyCalculatedResultsToData = () => {
    const { activities } = calculateResults();

    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      Object.keys(activities).forEach((key) => {
        copy.CAE.activities[key].calculatedTotal =
          activities[key].calculatedTotal || 0;
      });
      return copy;
    });

    return activities;
  };

  const handleTemp = () => {
    const activities = applyCalculatedResultsToData();
    setTempJSON(
      JSON.stringify(
        {
          ...data,
          CAE: {
            ...data.CAE,
            activities,
          },
        },
        null,
        2
      )
    );
  };

  const handleFinal = () => {
    const activities = applyCalculatedResultsToData();

    setFinalJSON(
      JSON.stringify(
        {
          ...data,
          CAE: {
            ...data.CAE,
            activities,
          },
        },
        null,
        2
      )
    );
  };

  const result = calculateResults();

  const groupedActivities = Object.entries(result.activities).reduce(
    (acc, [key, act]) => {
      const [group, name] = key.split("|");
      if (!acc[group]) acc[group] = [];
      acc[group].push({ key, name, act });
      return acc;
    },
    {}
  );

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        background: "#f4f6f9",
      }}
    >
      <h1>Activity Calculator</h1>

      {/* Global Parameters */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <h2>Global Parameters</h2>
        <table>
          <tbody>
            <tr>
              <td>TDL</td>
              <td>
                <select
                  value={globalTDL}
                  onChange={(e) => setGlobalTDL(+e.target.value)}
                >
                  <option value={1}>YES</option>
                  <option value={0}>NO</option>
                </select>
              </td>
            </tr>
            <tr>
              <td>DE</td>
              <td>
                <select
                  value={globalDE}
                  onChange={(e) => setGlobalDE(+e.target.value)}
                >
                  <option value={1}>YES</option>
                  <option value={0}>NO</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Activities */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <h2>Activities</h2>
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>TDL</th>
              <th>COO</th>
              <th>DE</th>
              <th>Extra</th>
              <th>ReWork</th>
              <th>Standard</th>
              <th>%</th>
              <th>Loops</th>
              <th>Select</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedActivities).map(([group, rows]) => (
              <React.Fragment key={group}>
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      background: "#0b72d0",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    {group}
                  </td>
                </tr>
                {rows.map(({ key, name, act }) => (
                  <tr key={key}>
                    <td>{name}</td>
                    <td>{act.TDL}</td>
                    <td>{act.COO}</td>
                    <td>{act.DE}</td>
                    <td>{act.extraWorkLoop}</td>
                    <td>{act.reWorkLoop}</td>
                    <td>{act.standardLoop || act.standard}</td>
                    <td>{act.percentage || 0}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={act.noOfLoops}
                        onChange={(e) =>
                          updateActivity(key, "noOfLoops", +e.target.value)
                        }
                      />
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
                    <td>{act.calculatedTotal || 0}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <button onClick={handleTemp}>Temp Save</button>
        <button onClick={handleFinal}>Final Save</button>
      </div>

      {/* Result Table */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <h2>Result Table</h2>
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>TDL</th>
              <th>DE</th>
              <th>COO</th>
              <th>Extra</th>
              <th>ReWork</th>
              <th>Standard</th>
              <th>%</th>
              <th>Loops</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedActivities).map(([group, rows]) =>
              rows
                .filter((r) => r.act.checked)
                .map(({ key, name, act }) => (
                  <tr key={"result-" + key}>
                    <td>{name}</td>
                    <td>{act.TDL * globalTDL}</td>
                    <td>{act.DE * globalDE}</td>
                    <td>{act.COO}</td>
                    <td>{act.extraWorkLoop}</td>
                    <td>{act.reWorkLoop}</td>
                    <td>{act.standardLoop || act.standard}</td>
                    <td>{act.percentage || 0}</td>
                    <td>{act.noOfLoops}</td>
                    <td>{act.calculatedTotal || 0}</td>
                  </tr>
                ))
            )}
            <tr style={{ fontWeight: "bold", background: "#eef4ff" }}>
              <td colSpan={2}>TDL Total: {result.sumTDL}</td>
              <td colSpan={2}>DE Total: {result.sumDE}</td>
              <td colSpan={6}>Grand Total: {result.grand}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* JSON */}
      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <h2>Temp JSON</h2>
        <pre>{tempJSON}</pre>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "16px",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        <h2>Final JSON</h2>
        <pre>{finalJSON}</pre>
      </div>
    </div>
  );
}

export default ActivityCalculator;
