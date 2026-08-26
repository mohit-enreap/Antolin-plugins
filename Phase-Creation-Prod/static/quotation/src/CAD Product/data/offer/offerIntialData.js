import { sharedRef } from "../../../shared/sharedStore";

// old logic

export const BASE_3D_OFFER = {
  TDL: {
    hours: 40,
  },
  "3D Coordination": {
    hours: 45,
  },
  "3D Standard": {
    hours: 45,
  },
};

// new logic
export const get3DCostCenterHours = (
  customerProductData,
  CECO_COST_SHEET_vxpx_sheet,
) => {
  // Mapping of customer product keys
  const mapping = {
    TDL: customerProductData["3D_TDL"],
    "3D Coordination": customerProductData["3D_SW"],
    "3D Standard": customerProductData["3D_SW"],
  };

  const result = {};

  Object.entries(mapping).forEach(([key, societyName]) => {
    // Find matching society in cost sheet
    const matchedSociety = CECO_COST_SHEET_vxpx_sheet.data.find(
      (item) => item.society === societyName,
    );

    result[key] = {
      society: societyName,
      hours: matchedSociety ? matchedSociety.HoursPerWeek : 0,
    };
  });

  console.log("3D Offer Hours Result:", result);
  console.log("3D Offer Hours BASE_3D_OFFER:", BASE_3D_OFFER);

  // Update sharedRef with the calculated hours per week for WO integration
  sharedRef.hoursPerWeek = {
    TDL: result.TDL.hours,
    "3D Coordination": result["3D Coordination"].hours,
    "3D Standard": result["3D Standard"].hours,
  };

  return result;
  // return BASE_3D_OFFER;
};
