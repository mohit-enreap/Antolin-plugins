export const DATA_MANAGEMENT_DATA_PHASE = {
  // TDL: {
  //   hours: 40,
  // },
  // "3D Coordination": {
  //   hours: 45,
  // },
  // "3D Standard": {
  //   hours: 45,
  // },
  "Data Management offer": {
    hours: 45,
  }
};

export const getDataManagementHours = (
  customerProductData,
  CECO_COST_SHEET_vxpx_sheet
) => {
  const societyName = customerProductData["DM"]; // Replace XXX with your key
 
  const matchedSociety = CECO_COST_SHEET_vxpx_sheet.data.find(
    (item) => item.society === societyName
  );
 
  return matchedSociety ? matchedSociety.HoursPerWeek : 0;
};