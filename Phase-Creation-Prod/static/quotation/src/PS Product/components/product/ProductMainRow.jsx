import React from "react";

export default function ProductMainRow({
  activityName,
  productName,
  productData,
  onUpdateProductValue,
}) {
  const prefixes = ["2D DELIVERABLES", "GEOMETRICAL STUDY", "DATA MANAGEMENT"];

  // To hide for 3D activity
  // To Show for the 2d , DM and GeoStudy
  // Proto serie on "Main"
  const showProtoSerie = prefixes.some((prefix) =>
    activityName.toLowerCase().startsWith(prefix.toLowerCase())
  );

  // const showProto = true;

  return (
    <tr>
      <td>Main</td>
      <td></td>
      <td></td>
      <td></td>

      {/* Hide and Show based on the 2d Activity or not  */}
      {/* showProtoSerie  ==> For To Show  the Proto ,Serie for  2D / DM / GM  */}
      {showProtoSerie ? (
        <td>
          <input
            type="number"
            min="0"
            value={productData.Proto || 1}
            onChange={(e) =>
              onUpdateProductValue(
                activityName,
                productName,
                "Proto",
                e.target.value
              )
            }
          />
        </td>
      ) : (
        <td></td>
      )}

      {/* showProtoSerie  ==> For To Show  the Proto ,Serie for  2D / DM / GM  */}
      {showProtoSerie ? (
        <td>
          <input
            type="number"
            min="0"
            value={productData.Serie || 1}
            onChange={(e) =>
              onUpdateProductValue(
                activityName,
                productName,
                "Serie",
                e.target.value
              )
            }
          />
        </td>
      ) : (
        <td></td>
      )}

      {/* !showProtoSerie  ==> For To hide the NoOfComponent ,Selected  for  2D / DM / GM */}
      {!showProtoSerie ? (
        <td>
          <input
            type="number"
            min="0"
            value={productData.noOfComponent || 1}
            onChange={(e) =>
              onUpdateProductValue(
                activityName,
                productName,
                "noOfComponent",
                e.target.value
              )
            }
          />
        </td>
      ) : (
        <td></td>
      )}

      {/* !showProtoSeries  ==> For To hide the NoOfComponent ,Selected  for  2D / DM / GM */}
      {!showProtoSerie ? (
        <td>
          <input
            type="checkbox"
            checked={!!productData.componentSelected}
            onChange={(e) =>
              onUpdateProductValue(
                activityName,
                productName,
                "componentSelected",
                e.target.checked
              )
            }
          />
        </td>
      ) : (
        <td></td>
      )}
    </tr>
  );
}
