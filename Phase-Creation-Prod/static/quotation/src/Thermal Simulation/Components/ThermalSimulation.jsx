// import React from "react";
// import { useActivityLogicThermalSimulation } from "../hooks/useActivityLogicThermalSimulation"

// export default function ThermalSimulation() {
//   const {
//     thermalActive,
//     input,
//     updateInput,
//     updateThermalActive,
//     firstLoop,
//     nextLoop,
//     firstFinal,
//     nextFinal,
//     ThermalSaftypayload
//   } = useActivityLogicThermalSimulation();

//    const isDisabled = thermalActive !== "yes";

//   return (
//     <div style={{ fontFamily: "Arial", padding: 20 }}>
//       <h2 style={{ border: "1px solid #000", width: 900, padding: 6, textAlign: "center", marginTop: 30 }}>
//         Thermal Simulation
//       </h2>

//       {/* Thermal Active */}
//       <table style={{ borderCollapse: "collapse", marginTop: 15, width: 900 }}>
//         <tbody>
//           <tr>
//             <td style={labelStyle}>Thermal Activities</td>
//             <td>
//               <select value={thermalActive} onChange={(e) => updateThermalActive(e.target.value)}>
//                 <option value="yes">Yes</option>
//                 <option value="no">No</option>
//               </select>
//             </td>
//           </tr>
//         </tbody>
//       </table>

//       {/* INPUT TABLE */}
//       <table style={tableStyle}>
//         <thead>
//           <tr>
//             <th></th>
//             <th>RFQ</th>
//             <th>Development</th>
//           </tr>
//         </thead>
//         <tbody>
//           {[
//             ["Number of PCBs", "rfqPCB", "devPCB"],
//             ["Number of Cases", "rfqCases", "devCases"],
//             ["Number of Loops", "rfqLoops", "devLoops"]
//           ].map(([label, rfqKey, devKey]) => (
//             <tr key={label}>
//               <td>{label}</td>
//               <td>
//                 <input
//                   type="number"
//                   min="1"
//                   value={input[rfqKey]}
//                   onChange={(e) => updateInput(rfqKey, e.target.value)}
//                   style={inputStyle}
//                 />
//               </td>
//               <td>
//                 <input
//                   type="number"
//                   min="1"
//                   value={input[devKey]}
//                   onChange={(e) => updateInput(devKey, e.target.value)}
//                   style={inputStyle}
//                 />
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       {/* TOTALS */}
//       <table style={{ ...tableStyle, background: "#cce5ff", fontWeight: "bold" }}>
//         <tbody>
//           <tr>
//             <td>TOTAL 1st Loop</td>
//             <td>{firstLoop.total.rfq.toFixed(2)}</td>
//             <td>{firstLoop.total.dvp.toFixed(2)}</td>
//           </tr>
//           <tr>
//             <td>TOTAL Next Loops</td>
//             <td>{nextLoop.total.rfq.toFixed(2)}</td>
//             <td>{nextLoop.total.dvp.toFixed(2)}</td>
//           </tr>
//         </tbody>
//       </table>

//       <SectionTable title="First Loop Activities" data={firstLoop} loopLabel="First" />
//       <SectionTable title="Next Loops Activities" data={nextLoop} loopLabel="Next" />

//       {/* FINAL TOTALS */}
//       <table style={{ borderCollapse: "collapse", marginTop: 20, width: 300 }}>
//         <thead>
//           <tr>
//             <th></th>
//             <th>RFQ</th>
//             <th>DVP</th>
//           </tr>
//         </thead>
//         <tbody>
//           <tr>
//             <td><b>TOTAL 1st Loop</b></td>
//             <td>{firstFinal.rfq}</td>
//             <td>{firstFinal.dvp}</td>
//           </tr>
//           <tr>
//             <td><b>TOTAL Next Loops</b></td>
//             <td>{nextFinal.rfq}</td>
//             <td>{nextFinal.dvp}</td>
//           </tr>
//         </tbody>
//       </table>

// {/* Offer Proto Serie Calculated */}
// <table
//   style={{
//     marginTop: 10,
//     borderCollapse: "collapse",
//     minWidth: 150,
//     boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
//     borderRadius: 4,
//     overflow: "hidden",
//     fontFamily: "Arial"
//   }}
// >
//   <thead>
//     <tr style={{ background: "#1976d2", color: "#fff" }}>
//       <th style={{ padding: "8px 12px", textAlign: "left" }}>Type</th>
//       <th style={{ padding: "8px 12px", textAlign: "center" }}>Hours</th>
//     </tr>
//   </thead>

//   <tbody>
//     <tr style={{ background: "#e3f2fd" }}>
//       <td style={{ padding: "8px 12px" }}>Offer</td>
//       <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "bold" }}>
//         {ThermalSaftypayload.offer}
//       </td>
//     </tr>

//     <tr>
//       <td style={{ padding: "8px 12px" }}>Proto</td>
//       <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "bold" }}>
//         {ThermalSaftypayload.proto}
//       </td>
//     </tr>

//     <tr style={{ background: "#e3f2fd" }}>
//       <td style={{ padding: "8px 12px" }}>Serie</td>
//       <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "bold" }}>
//         {ThermalSaftypayload.serie}
//       </td>
//     </tr>
//   </tbody>
// </table>

//     </div>
//   );
// }

// function SectionTable({ title, data, loopLabel }) {
//   return (
//     <>
//       <h2 style={{ border: "1px solid #000", width: 900, padding: 6, textAlign: "center", marginTop: 30 }}>
//         {title}
//       </h2>

//       <table style={tableStyle}>
//         <thead>
//           <tr>
//             <th>Activity</th>
//             <th>RFQ</th>
//             <th>DVP</th>
//             <th>Loop</th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.activities.map((a) => (
//             <tr key={a.name}>
//               <td>{a.name}</td>
//               <td>{a.rfq.toFixed(2)}</td>
//               <td>{a.dvp.toFixed(2)}</td>
//               <td>{loopLabel}</td>
//             </tr>
//           ))}
//         </tbody>
//         <tfoot>
//           <tr style={{ background: "#ffeb3b", fontWeight: "bold" }}>
//             <td>Total</td>
//             <td>{data.total.rfq.toFixed(2)}</td>
//             <td>{data.total.dvp.toFixed(2)}</td>
//             <td></td>
//           </tr>
//         </tfoot>
//       </table>
//     </>
//   );
// }

// const tableStyle = {
//   borderCollapse: "collapse",
//   marginTop: 15,
//   width: 900
// };

// const labelStyle = {
//   background: "#f4b400",
//   fontWeight: "bold",
//   border: "1px solid #999",
//   padding: 6
// };

// const inputStyle = {
//   width: 60,
//   textAlign: "center"
// };

//=======read only feature===========

import React from "react";
import { useActivityLogicThermalSimulation } from "../hooks/useActivityLogicThermalSimulation";
import { useActivityLogic as useCADActivityLogic } from "../../CAD Product/hooks/useActivityLogic";

export default function ThermalSimulation() {
  const {
    thermalActive,
    input,
    updateInput,
    updateThermalActive,
    firstLoop,
    nextLoop,
    firstFinal,
    nextFinal,
    ThermalSaftypayload,
  } = useActivityLogicThermalSimulation();

  const cadLogic = useCADActivityLogic();
  const quotationText = `Quotation: ${cadLogic.globalParams.product} ${cadLogic.globalParams.Customer} ${cadLogic.globalParams["ProjectName"]} ${cadLogic.globalParams["Type Of Development"]}`;

  const isDisabled = thermalActive !== "yes";

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h1 style={{ color: "#0b74d1", marginBottom: 15 }}>{quotationText}</h1>
      <h2
        style={{
          border: "1px solid #000",
          width: 900,
          padding: 6,
          textAlign: "center",
          marginTop: 30,
        }}
      >
        Thermal Simulation
      </h2>

      {/* Thermal Active */}
      <table style={{ borderCollapse: "collapse", marginTop: 15, width: 900 }}>
        <tbody>
          <tr>
            <td style={labelStyle}>Thermal Activities</td>
            <td>
              <select
                value={thermalActive}
                onChange={(e) => updateThermalActive(e.target.value)}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      {/* READ ONLY WRAPPER */}
      <div style={{ opacity: isDisabled ? 0.5 : 1 }}>
        {/* INPUT TABLE */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th></th>
              <th>RFQ</th>
              <th>Development</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Number of PCBs", "rfqPCB", "devPCB"],
              ["Number of Cases", "rfqCases", "devCases"],
              ["Number of Loops", "rfqLoops", "devLoops"],
            ].map(([label, rfqKey, devKey]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={input[rfqKey]}
                    onChange={(e) => updateInput(rfqKey, e.target.value)}
                    style={inputStyle}
                    disabled={isDisabled}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={input[devKey]}
                    onChange={(e) => updateInput(devKey, e.target.value)}
                    style={inputStyle}
                    disabled={isDisabled}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <table
          style={{ ...tableStyle, background: "#cce5ff", fontWeight: "bold" }}
        >
          <tbody>
            <tr>
              <td>TOTAL 1st Loop</td>
              <td>{firstLoop.total.rfq.toFixed(2)}</td>
              <td>{firstLoop.total.dvp.toFixed(2)}</td>
            </tr>
            <tr>
              <td>TOTAL Next Loops</td>
              <td>{nextLoop.total.rfq.toFixed(2)}</td>
              <td>{nextLoop.total.dvp.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <SectionTable
          title="First Loop Activities"
          data={firstLoop}
          loopLabel="First"
        />
        <SectionTable
          title="Next Loops Activities"
          data={nextLoop}
          loopLabel="Next"
        />

        {/* FINAL TOTALS */}
        <table
          style={{ borderCollapse: "collapse", marginTop: 20, width: 300 }}
        >
          <thead>
            <tr>
              <th></th>
              <th>RFQ</th>
              <th>DVP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>TOTAL 1st Loop</b>
              </td>
              <td>{firstFinal.rfq}</td>
              <td>{firstFinal.dvp}</td>
            </tr>
            <tr>
              <td>
                <b>TOTAL Next Loops</b>
              </td>
              <td>{nextFinal.rfq}</td>
              <td>{nextFinal.dvp}</td>
            </tr>
          </tbody>
        </table>

        {/* Offer Proto Serie -  */}
        <table
          style={{
            marginTop: 10,

            borderCollapse: "collapse",

            width: 220, // smaller width

            fontSize: "13px", // smaller text

            border: "1px solid #ccc",

            textAlign: "center",
          }}
        >
          <thead>
            <tr style={{ background: "#1976d2", color: "#fff" }}>
              <th style={{ padding: "4px 6px" }}>Type</th>
              <th style={{ padding: "4px 6px" }}>Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "4px 6px" }}>Offer</td>
              <td style={{ padding: "4px 6px", fontWeight: "bold" }}>
                {ThermalSaftypayload.offer}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 6px" }}>Proto</td>
              <td style={{ padding: "4px 6px", fontWeight: "bold" }}>
                {ThermalSaftypayload.proto}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 6px" }}>Serie</td>
              <td style={{ padding: "4px 6px", fontWeight: "bold" }}>
                {ThermalSaftypayload.serie}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionTable({ title, data, loopLabel }) {
  return (
    <>
      <h2
        style={{
          border: "1px solid #000",
          width: 900,
          padding: 6,
          textAlign: "center",
          marginTop: 30,
        }}
      >
        {title}
      </h2>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th>Activity</th>
            <th>RFQ</th>
            <th>DVP</th>
            <th>Loop</th>
          </tr>
        </thead>
        <tbody>
          {data.activities.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.rfq.toFixed(2)}</td>
              <td>{a.dvp.toFixed(2)}</td>
              <td>{loopLabel}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#ffeb3b", fontWeight: "bold" }}>
            <td>Total</td>
            <td>{data.total.rfq.toFixed(2)}</td>
            <td>{data.total.dvp.toFixed(2)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}

const tableStyle = {
  borderCollapse: "collapse",
  marginTop: 15,
  width: 900,
};

const labelStyle = {
  background: "#f4b400",
  fontWeight: "bold",
  border: "1px solid #999",
  padding: 6,
};

const inputStyle = {
  width: 60,
  textAlign: "center",
};
