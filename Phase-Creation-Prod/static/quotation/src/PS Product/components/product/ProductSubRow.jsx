import React from "react";

export default function ProductSubRow({
  activityName,
  productName,
  subName,
  subData,
  onUpdateSubValue,
}) {
  return (
    <tr>
      <td style={{ textAlign: "left", paddingLeft: 8 }}>{subName}</td>
      <td>
        <input type="text" readOnly value={subData.TDL || 0} />
      </td>
      <td>
        <input type="text" readOnly value={subData.COO || 0} />
      </td>
      <td>
        <input type="text" readOnly value={subData.DE || 0} />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="any"
          value={subData.Proto || 0}
          onChange={(e) =>
            onUpdateSubValue(
              activityName,
              productName,
              subName,
              "Proto",
              e.target.value
            )
          }
        />
      </td>
      <td>
        <input
          type="number"
          min="0"
          step="any"
          value={subData.Serie || 0}
          onChange={(e) =>
            onUpdateSubValue(
              activityName,
              productName,
              subName,
              "Serie",
              e.target.value
            )
          }
        />
      </td>
      <td colSpan={2}></td>
    </tr>
  );
}
