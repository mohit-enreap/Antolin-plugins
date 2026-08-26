import { CAE_SHORTCUT as OHSShortcut } from "./OHS";
import { CAE_SHORTCUT as DoorPanelShortcut } from "./DoorPanel";
import { CAE_SHORTCUT as IPShortcut } from "./Ip";
import { CAE_SHORTCUT as SunvisorShortcut } from "./sunvisor";
import { CAE_SHORTCUT as WindowRegulatorShortcut } from "./windowRegulator";
import { CAE_SHORTCUT as CentreConsoleShortcut } from "./Centre Console";

const PRODUCT_SHORTCUT = {
  "Headliner": OHSShortcut,
  "Door Panel": DoorPanelShortcut,
  "IP": IPShortcut,
  "Sunvisor": SunvisorShortcut,
  "Window Regulator": WindowRegulatorShortcut,
  "Centre Console": CentreConsoleShortcut
  //   XXX: XXXShortcut,
  //   YYY: YYYShortcut,

};

// Fetch Product specific CAE Shortcut
export const getCAEShortcut = (product) => {
  console.log("Inside getCAEShortcut :" + product);
  return PRODUCT_SHORTCUT[product] || {};
};


//===How to use it ======
// import { getCAEShortcut } from "../config/products";

// const shortcutData = getCAEShortcut(selectedProduct);

// applyShortcutForCustomer(customerName, shortcutData, setData);