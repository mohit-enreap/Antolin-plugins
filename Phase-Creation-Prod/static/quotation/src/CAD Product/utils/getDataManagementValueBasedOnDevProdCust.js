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
  // 1️ Get type-level data (FSS / BTP)
  const typeData = DATAMANAGEMENT_CONSTANT_CONFIG[typeOfDevelopment];
  if (!typeData) return null;
 
  console.log( "typeData : "+ JSON.stringify(typeData.Customer))  ;
 
  // 2 Get customer-level data (OHS / DP / IP)
  const customerData = typeData.Customer?.[customer];
  if (!customerData) return null;
 
 
  console.log( "customerData : "+ JSON.stringify(customerData))  ;
 
 
   customerData[oem] ?? customerData.Standard ?? null;
  console.log( "customerData1 : "+ JSON.stringify(customerData[oem] ?? customerData.Standard ?? null))  ;
 
    //  Get OEM-specific value
  let value = customerData[oem] ?? customerData.Standard ?? null;
 
  if (value == null) return null;
 
  //  Apply FSS / BTP logic
  if (typeOfDevelopment === "BTP") {
    value = value * 0.25; // 25%
  }
 
  // FSS = 100% → no change needed
 
  console.log("Final value :", value);
  return value;
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
