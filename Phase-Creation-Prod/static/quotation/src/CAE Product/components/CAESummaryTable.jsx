// components/CAESummaryTable.jsx
import React from "react";

function CAESummaryTable({
  protoTDL,
  protoDE,
  protoIteration,
  serieTDL,
  serieDE,
  serieIteration,
}) {
  // ==========================================
  // TDL TOTALS
  // ==========================================
  const totalTDL =
    Number(protoTDL || 0) +
    Number(serieTDL || 0);

  // ==========================================
  // DE TOTALS
  // ==========================================
  const totalDE =
    Number(protoDE || 0) +
    Number(serieDE || 0);

  // ==========================================
  // ITERATION TOTALS
  // ==========================================
  const totalIteration =
    Number(protoIteration || 0) +
    Number(serieIteration || 0);

  // ==========================================
  // DE + ITERATION
  // ==========================================
  const protoDEWithIteration =
    Number(protoDE || 0) +
    Number(protoIteration || 0);

  const serieDEWithIteration =
    Number(serieDE || 0) +
    Number(serieIteration || 0);

  const totalDEWithIteration =
    protoDEWithIteration +
    serieDEWithIteration;

  // ==========================================
  // GRAND TOTALS
  // ==========================================
  const protoTotal =
    Number(protoTDL || 0) +
    protoDEWithIteration;

  const serieTotal =
    Number(serieTDL || 0) +
    serieDEWithIteration;

  const grandTotal =
    protoTotal +
    serieTotal;

  return (
    <div
      style={{
        background: "#fff",
        padding: "16px",
        borderRadius: "6px",
        marginBottom: "20px",
      }}
    >
      {/* ===================================================== */}
      {/* SUMMARY TABLE */}
      {/* ===================================================== */}

      <h3>CAE Summary</h3>

      <table
        border="1"
        cellPadding="8"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginBottom: "30px",
        }}
      >
        <thead>
          <tr>
            <th>Description</th>
            <th>Proto</th>
            <th>Serie</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {/* TDL */}
          <tr>
            <td>
              <strong>TDL (CAE Engineers)</strong>
            </td>
            <td>{Number(protoTDL || 0).toFixed(2)}</td>
            <td>{Number(serieTDL || 0).toFixed(2)}</td>
            <td>{totalTDL.toFixed(2)}</td>
          </tr>

          {/* DE */}
          <tr>
            <td>
              <strong>DE (CAE Standard Work)</strong>
            </td>
            <td>{Number(protoDE || 0).toFixed(2)}</td>
            <td>{Number(serieDE || 0).toFixed(2)}</td>
            <td>{totalDE.toFixed(2)}</td>
          </tr>

          {/* Iteration */}
          <tr>
            <td>
              <strong>Iterations</strong>
            </td>
            <td>{Number(protoIteration || 0).toFixed(2)}</td>
            <td>{Number(serieIteration || 0).toFixed(2)}</td>
            <td>{totalIteration.toFixed(2)}</td>
          </tr>

          {/* DE + Iteration */}
          <tr>
            <td>
              <strong>DE + Iteration</strong>
            </td>
            <td>{protoDEWithIteration.toFixed(2)}</td>
            <td>{serieDEWithIteration.toFixed(2)}</td>
            <td>{totalDEWithIteration.toFixed(2)}</td>
          </tr>

          {/* Grand Total */}
          <tr
            style={{
              fontWeight: "bold",
              background: "#f5f5f5",
            }}
          >
            <td>Grand Total</td>
            <td>{protoTotal.toFixed(2)}</td>
            <td>{serieTotal.toFixed(2)}</td>
            <td>{grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* ===================================================== */}
      {/* EXCEL STYLE FINAL SUMMARY */}
      {/* ===================================================== */}

      <h3>Mechanical Simulation</h3>

      <table
        border="1"
        cellPadding="8"
        style={{
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            <th>Description</th>
            <th>Hours</th>

          </tr>
        </thead>

        <tbody>
          {/* CAE Engineer */}
          <tr>
            <td>CAE Engineer</td>
            <td>{totalTDL.toFixed(2)}</td>

          </tr>

          {/* CAE Standard Work + Iteration */}
          <tr>
            <td>CAE Standard Work + Iteration</td>
            <td>{totalDEWithIteration.toFixed(2)}</td>
          </tr>

          {/* Final Total */}
          <tr
            style={{
              fontWeight: "bold",
              background: "#f5f5f5",
            }}
          >
            <td>TOTAL</td>
            <td>{grandTotal.toFixed(2)}</td>

          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CAESummaryTable;