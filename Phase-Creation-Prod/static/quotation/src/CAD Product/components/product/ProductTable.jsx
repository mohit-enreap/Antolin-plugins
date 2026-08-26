import React from "react";
import ProductMainRow from "./ProductMainRow";
import ProductSubRow from "./ProductSubRow";

export default function ProductTable({
  activityName,
  productName,
  productData,
  onUpdateProductValue,
  onUpdateSubValue,
}) {
  const subObj = productData.subactivity || {};
  return (
    <table style={{ marginBottom: 10 }}>
      <thead>
        <tr>
          <th colSpan={8} style={{ textAlign: "left", paddingLeft: 10 }}>
            {productName}
          </th>
        </tr>
        <tr>
          <th>Subactivity / Main</th>
          <th>TDL</th>
          <th>COO</th>
          <th>DE</th>
          <th>Proto</th>
          <th>Serie</th>
          <th>NoOfComponent</th>
          <th>Selected</th>
        </tr>
      </thead>
      <tbody>
        <ProductMainRow
          activityName={activityName}
          productName={productName}
          productData={productData}
          onUpdateProductValue={onUpdateProductValue}
        />
        {Object.entries(subObj).map(([subName, subData]) => (
          <ProductSubRow
            key={subName}
            activityName={activityName}
            productName={productName}
            subName={subName}
            subData={subData}
            onUpdateSubValue={onUpdateSubValue}
          />
        ))}
      </tbody>
    </table>
  );
}
