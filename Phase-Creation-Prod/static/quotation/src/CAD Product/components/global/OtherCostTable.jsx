import React from "react";

const PHASES = ["phase0", "phase1", "phase2", "phase34"];

function EditableCell({ value, onChange }) {
  return (
    <input
      type="number"
      className="w-20 border px-1 text-right"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function OtherCostTable({ data, onChange }) {
  console.log("Other Cost Table: \n", data);
  // data is expected to be otherTableData (otherExpenses)
  return (
    <div className="mt-6">
      <h3 className="font-bold text-lg mb-2">Other Additional (User Input) </h3>
      <h6 className="font-bold text-lg mb-2">
        This Data will be Additional added in costSheet{" "}
      </h6>
      <table className="min-w-full border border-black text-sm">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th rowSpan={2} className="border p-2">
              Design
            </th>
            <th colSpan={2} className="border p-2">
              Phase 0
            </th>
            <th colSpan={2} className="border p-2">
              Phase 1
            </th>
            <th colSpan={2} className="border p-2">
              Phase 2
            </th>
            <th colSpan={2} className="border p-2">
              Phase 3-4
            </th>
          </tr>
          <tr className="bg-gray-50 text-center">
            {PHASES.map((phase) => (
              <React.Fragment key={phase}>
                <th className="border">HRS</th>
                <th className="border">COST</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>

        <tbody>
          {Object.entries(data).map(([design, phases]) => (
            <tr key={design} className="text-right">
              <td className="border p-2 text-left font-medium">{design}</td>

              {PHASES.map((phase) => (
                <React.Fragment key={phase}>
                  <td className="border p-1">
                    <EditableCell
                      value={phases[phase]?.hours ?? 0}
                      onChange={(val) => onChange(design, phase, "hours", val)}
                    />
                  </td>

                  <td className="border p-1">
                    <EditableCell
                      value={phases[phase]?.cost ?? 0}
                      onChange={(val) => onChange(design, phase, "cost", val)}
                    />
                  </td>
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
