import { activityCustomerPhase as HeadlinerActivity } from "./Headliner";
import { activityCustomerPhase as DoorPanelActivity } from "./DoorPanel";

const PRODUCT_CONFIG = {
    Headliner: HeadlinerActivity,
    "Door Panel": DoorPanelActivity,

};

//Fetch Project specific
export const getActivityCustomerPhase = (product) => {
    // alert("Inside getActivityCustomerPhase :" + product);
    return PRODUCT_CONFIG[product] || {};
};