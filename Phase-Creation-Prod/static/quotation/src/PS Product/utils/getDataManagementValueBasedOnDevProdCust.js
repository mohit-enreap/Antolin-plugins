/* =========================================================
   GET DATA MANAGEMENT VALUE BASED ON
   DEVELOPMENT + PRODUCT + CUSTOMER
   ---------------------------------------------------------
   Inputs:
     - typeOfDevelopment → FSS / BTP
     - customer          → OHS / DP / IP / etc.
     - oem               → Audi / BMW / Standard / etc.
   Output:
     - number | null
   ========================================================= */

import { DATAMANAGEMENT_CONSTANT_CONFIG } from "../data/DataManagementConstant";

export function getDataManagementConstantValueBasedOnDevProdCust({
  typeOfDevelopment,
  customer,
  oem,
}) {
  // 1️⃣ Get type-level data (FSS / BTP)
  const typeData = DATAMANAGEMENT_CONSTANT_CONFIG[typeOfDevelopment];
  if (!typeData) return null;

  // 2️⃣ Get customer-level data (OHS / DP / IP)
  const customerData = typeData.Customer?.[customer];
  if (!customerData) return null;

  // 3️⃣ Return OEM-specific value
  return customerData[oem] ?? customerData.Standard ?? null;
}

/*
example to call :

import { getDataManagementConstantValueBasedOnDevProdCust } 
  from "../utils/getDataManagementValueBasedOnDevProdCust";

const hours = getDataManagementConstantValueBasedOnDevProdCust({
  typeOfDevelopment: "FSS",
  customer: "OHS",
  oem: "Audi",
});

console.log(hours); // 130

*/
