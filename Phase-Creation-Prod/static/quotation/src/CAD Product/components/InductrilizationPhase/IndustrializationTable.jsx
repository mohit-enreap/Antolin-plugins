export default function IndustrializationTable({ rows, weeks, onChange }) {
  return (
    <table border="1" cellPadding="6">
      <thead>
        <tr>
          <th>Activity</th>
          <th>Resources</th>
          <th>Weeks</th>
          <th>Hours / Week</th>
          <th>Total Hours</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <tr key={row.activityKey}>
            <td>{row.activityKey}</td>

            <td>
              <input
                type="number"
                value={row.resources}
                onChange={(e) =>
                  onChange({
                    activityKey: row.activityKey,
                    field: "Resources",
                    value: Number(e.target.value),
                  })
                }
              />
            </td>

            <td>{weeks}</td>
            <td>{row.hoursPerWeek}</td>
            <td>{row.totalHours}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
