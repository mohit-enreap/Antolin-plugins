import React from "react";
import ProductTable from "../product/ProductTable";
import { isProductKey } from "../../utils/helpers";

export default function ActivityProducts({
  activityName, // Name of the parent activity
  activityObj, // Object containing product-wise data for this activity
  onUpdateProductValue, // Callback to update product-level values
  onUpdateSubValue, // Callback to update sub-item values inside a product
}) {
  return (
    <>
      {/* Loop through all key-value pairs inside the activity object */}
      {Object.entries(activityObj).map(([productName, productData]) => {
        {
          /* Skip keys that are not product-level (like checked, order, etc.) */
        }
        if (!isProductKey(productName)) return null;

        {
          /* Render product table for this valid product */
        }
        return (
          <ProductTable
            key={productName} // Unique key for React list rendering
            activityName={activityName} // Pass the activity under which this product belongs
            productName={productName} // Name of the product being rendered
            productData={productData} // All data related to this specific product
            onUpdateProductValue={onUpdateProductValue} // Function to update product-level fields
            onUpdateSubValue={onUpdateSubValue} // Function to update sub-level fields
          />
        );
      })}
    </>
  );
}
