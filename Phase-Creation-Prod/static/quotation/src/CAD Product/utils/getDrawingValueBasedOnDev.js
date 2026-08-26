/* =========================================================
   GET DRAWING VALUE
   ---------------------------------------------------------
   Inputs:
     - typeOfDevelopment → FSS / BTP
     - product           → DP / OHS / IP / etc.
     - activity          → Activity Name
   Output:
     - number | null
   ========================================================= */
import { DRAWING_MASTER_DATA } from "../data/drawingMasterData";

export function getDrawingValueBasedOnDev({
  typeOfDevelopment,
  product,
  activity,
}) {
  // 1️⃣ Get type-level data (FSS / BTP)
  const typeData = DRAWING_MASTER_DATA[typeOfDevelopment];
  if (!typeData) return null;

  // 2️⃣ Loop through categories (INTERNAL / CUSTOMER)
  for (const category of Object.values(typeData)) {
    // 3️⃣ Check if activity exists in category
    if (category[activity]) {
      // 4️⃣ Return product-specific value
      return category[activity][product] ?? null;
    }
  }

  return null;
}
