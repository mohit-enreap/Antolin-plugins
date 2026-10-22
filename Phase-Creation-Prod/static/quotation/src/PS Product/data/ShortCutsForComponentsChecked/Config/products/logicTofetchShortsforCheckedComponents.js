import { COMPONENT_SHORTCUT as OHSShortcut } from "./Headliner.js";
import { COMPONENT_SHORTCUT as DoorPanelShortcut } from "./DoorPanel";
import { COMPONENT_SHORTCUT as IPShortcut } from "./Ip.js";
import { COMPONENT_SHORTCUT as SunvisorShortcut } from "./Sunvisor";
import { COMPONENT_SHORTCUT as WindowRegulatorShortcut } from "./WindowRegulator";
import { COMPONENT_SHORTCUT as CentreConsoleShortcut } from "./Centre Console.js";
import { COMPONENT_SHORTCUT as PillarShortcut } from "./Pillar";

const PRODUCT_SHORTCUT = {
    Headliner: OHSShortcut,
    "Door Panel": DoorPanelShortcut,
    "IP": IPShortcut,
    "Sunvisor": SunvisorShortcut,
    // "Window Regulator": WindowRegulatorShortcut,     // NO PS in Window Regulator
    "Centre Console": CentreConsoleShortcut,
    "Pillar": PillarShortcut
};

// Fetch product specific checked component shortcuts
export const getCheckedComponentShortcuts = (product) => {
    return PRODUCT_SHORTCUT[product] || {};
};
