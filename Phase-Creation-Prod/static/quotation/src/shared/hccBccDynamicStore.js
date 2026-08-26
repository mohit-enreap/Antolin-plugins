// =======================================
// Shared HCC–BCC Dynamic Output Store
// =======================================

// 🔹 Initial empty state (safe default)
let HCC_BCC_DYNAMIC_OUTPUT = [];

// =======================================
// Get current shared value
// =======================================
export function getHccBccDynamicOutput() {
      //alert("In shared store getHccBccDynamicOutput:"+ JSON.stringify(HCC_BCC_DYNAMIC_OUTPUT))
  return structuredClone(HCC_BCC_DYNAMIC_OUTPUT);
}

// =======================================
// Set / replace shared value
// (call this after API or calculation)
// =======================================
export function setHccBccDynamicOutput(data) {
  HCC_BCC_DYNAMIC_OUTPUT = structuredClone(data || []);
 // alert("In shared store:"+ JSON.stringify(HCC_BCC_DYNAMIC_OUTPUT))
//getHccBccDynamicOutput() 
}

// =======================================
// Reset to empty (optional utility)
// =======================================
export function resetHccBccDynamicOutput() {
  HCC_BCC_DYNAMIC_OUTPUT = [];
}
