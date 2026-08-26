import { COMPONENT_SHORTCUT as OHSShortcut } from "./Headliner.js";
import { COMPONENT_SHORTCUT as DoorPanelShortcut } from "./DoorPanel";

const PRODUCT_SHORTCUT = {
    Headliner: OHSShortcut,
    "Door Panel": DoorPanelShortcut,
    // XXX: XXXShortcut,
    // YYY: YYYShortcut,
};

// Fetch product specific checked component shortcuts
export const getCheckedComponentShortcuts = (product) => {
    return PRODUCT_SHORTCUT[product] || {};
};
