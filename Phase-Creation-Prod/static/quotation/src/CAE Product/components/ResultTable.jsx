// components/ResultTable.jsx
import React from "react";

function ResultTable({
  activities,
  sumTDL,
  sumDE,
  grand,
  globalTDL,
  globalDE,
}) {
  const grouped = Object.entries(activities).reduce((acc, [key, act]) => {
    const [, name] = key.split("|");
    if (act.checked) acc.push({ key, name, act });
    return acc;
  }, []);

  return (
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
            <th>Proto</th>
            <th>Serie</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {grouped.map(({ key, name, act }) => (
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

              <td>{act.protoSumTDL || 0}</td>
              <td>{act.serieSumTDL || 0}</td>
              <td>{act.calculatedTotal || 0}</td>
            </tr>
          ))}

          <tr style={{ fontWeight: "bold", background: "#eef4ff" }}>
            <td colSpan={2}>TDL Total: {sumTDL}</td>
            <td colSpan={2}>DE Total: {sumDE}</td>
            <td colSpan={6}>Grand Total: {grand}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default ResultTable;
