const SectionTable = ({ title, rows, highlightColor }) => {
  return (
    <div className="mt-6 border-2 border-black">
      {/* Section Title */}
      <div
        className="font-bold px-2 py-1 border-b border-black"
        style={{ color: "red" }}
      >
        {title}
      </div>

      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="text-center">
            <th className="border">Role</th>
            <th className="border">
              Phase 0<br />
              Hours
            </th>
            <th className="border">Costs</th>
            <th className="border">
              Phase 1<br />
              Hours
            </th>
            <th className="border">Costs</th>
            <th className="border">
              Phase 2<br />
              Hours
            </th>
            <th className="border">Costs</th>
            <th className="border">
              Phase 3-4
              <br />
              Hours
            </th>
            <th className="border">Costs</th>
            <th className="border text-red-600">
              TOTAL
              <br />
              Hours
            </th>
            <th className="border text-red-600">
              TOTAL
              <br />
              Costs
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ backgroundColor: highlightColor || "transparent" }}
            >
              <td className="border px-2">{row.role}</td>
              <td className="border text-right">{typeof row.phase0?.hours === 'number' ? row.phase0.hours.toFixed(2) : "-"}</td>
              <td className="border text-right">{typeof row.phase0?.cost === 'number' ? row.phase0.cost.toFixed(2) : "-"}</td>
              <td className="border text-right">{typeof row.phase1?.hours === 'number' ? row.phase1.hours.toFixed(2) : "-"}</td>
              <td className="border text-right">{typeof row.phase1?.cost === 'number' ? row.phase1.cost.toFixed(2) : "-"}</td>
              <td className="border text-right">{typeof row.phase2?.hours === 'number' ? row.phase2.hours.toFixed(2) : "-"}</td>
              <td className="border text-right">{typeof row.phase2?.cost === 'number' ? row.phase2.cost.toFixed(2) : "-"}</td>
              <td className="border text-right">{typeof row.phase34?.hours === 'number' ? row.phase34.hours.toFixed(2) : "-"}</td>
              <td className="border text-right">{typeof row.phase34?.cost === 'number' ? row.phase34.cost.toFixed(2) : "-"}</td>
              <td className="border text-right font-bold">
                {typeof row.total?.hours === 'number' ? row.total.hours.toFixed(2) : "-"}
              </td>
              <td className="border text-right font-bold">
                {typeof row.total?.cost === 'number' ? row.total.cost.toFixed(2) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SectionTable;

//=========== later add in RFQ PHASE Below Table========

// ================= Mechanical Simulation =================
// <SectionTable
//   title="Mechanical Simulation"
//   highlightColor="#e8f5e9"
//   rows={[
//     {
//       role: "CAE Engineer",
//       phase1: { hours: 0, cost: 0 },
//       phase2: { hours: 0, cost: 0 },
//       total: { hours: 0, cost: 0 },
//     },
//     {
//       role: "CAE Standard Work",
//       phase1: { hours: 0, cost: 0 },
//       phase2: { hours: 0, cost: 0 },
//       total: { hours: 0, cost: 0 },
//     },
//   ]}
// />

// {/* ================= Thermal Simulation ================= */}
// <SectionTable
//   title="Thermal Simulation"
//   highlightColor="#fff3cd"
//   rows={[
//     {
//       role: "Thermal Activities",
//       phase0: { hours: 0, cost: 0 },
//       phase1: { hours: 0, cost: 0 },
//       phase2: { hours: 0, cost: 0 },
//       total: { hours: 0, cost: 0 },
//     },
//   ]}
// />

// {/* ================= Others ================= */}
// <SectionTable
//   title="Others"
//   highlightColor="#fce4ec"
//   rows={[
//     {
//       role: "Licenses (CAD)",
//       phase1: { cost: 0 },
//       phase2: { cost: 0 },
//       total: { cost: 0 },
//     },
//     {
//       role: "Materials",
//       phase1: { hours: 0, cost: 0 },
//       total: { hours: 0, cost: 0 },
//     },
//   ]}
// />
// {/* ================= Mechanical Simulation ================= */}
// <SectionTable
//   title="Mechanical Simulation"
//   highlightColor="#e8f5e9"
//   rows={[
//     {
//       role: "CAE Engineer",
//       phase1: { hours: 0, cost: 0 },
//       phase2: { hours: 0, cost: 0 },
//       total: { hours: 0, cost: 0 },
//     },
//     {
//       role: "CAE Standard Work",
//       phase1: { hours: 0, cost: 0 },
//       phase2: { hours: 0, cost: 0 },
//       total: { hours: 0, cost: 0 },
//     },
//   ]}
// />

// {/* ================= Thermal Simulation ================= */}
// <SectionTable
//   title="Thermal Simulation"
//   highlightColor="#fff3cd"
//   rows={[
//     {
//       role: "Thermal Activities",
//       phase0: { hours: 0, cost: 0 },
//       phase1: { hours: 0, cost: 0 },
//       phase2: { hours: 0, cost: 0 },
//       total: { hours: 0, cost: 0 },
//     },
//   ]}
// />

// {/* ================= Others ================= */}
// <SectionTable
//   title="Others"
//   highlightColor="#fce4ec"
//   rows={[
//     {
//       role: "Licenses (CAD)",
//       phase1: { cost: 0 },
//       phase2: { cost: 0 },
//       total: { cost: 0 },
//     },
//     {
//       role: "Materials",
//       phase1: { hours: 0, cost: 0 },
//       total: { hours: 0, cost: 0 },
//     },
//   ]}
// />
