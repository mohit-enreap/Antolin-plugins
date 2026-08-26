import RFQPhaseTable from "./RFQPhaseTable";
import { RFQ_TEMPLATE } from "./Data/rfqTemplate";
import { RFQ_ROLE_MAPPING } from "./Data/rfqMapping";
import { fillCostSheetData } from "./logic/fillCostSheetData";

function MainCostSheet({
  threeD,
  twoD,
  twoDAntolinDrawing,
  twoDCustomerDrawing,
  dm,
  gs,
  customerProductData,
  quotationText,
  phaseDates,
  manualWeeks,
  updateManualWeeks,
  sharedRef,
  additionalOthersHoursAndCostPayload,
  CECO_COST_SHEET_YearANDPhases,
  FINAL_DEBUG_DATA,
  FEASIBILITY,
  pdfData,

  // imports for PDF download
  offerRows,
  industrializationRows,
  dataManagementRows,
}) {
  // alert(
  //   "Data Summary (MainCostSheet):\n\n" +
  //     "3D Data:\n" +
  //     JSON.stringify(threeD, null, 2) +
  //     "\n\n" +
  //     "2D Data:\n" +
  //     JSON.stringify(twoD, null, 2) +
  //     "\n\n" +
  //     "DM Data:\n" +
  //     JSON.stringify(dm, null, 2) +
  //     "\n\n" +
  //     "GM Data:\n" +
  //     JSON.stringify(gs, null, 2)
  // );
  // alert(
  //   "Data Summary (MainCostSheet):\n\n" +
  //     "2D A Data:\n" +
  //     JSON.stringify(twoD, null, 2)
  // );

  //   alert(
  //   "Data Summary (MainCostSheet):\n\n" +
  //     "threeD A Data:\n" +
  //     JSON.stringify(threeD, null, 2)
  // );

  const totals = {
    "3D": threeD,
    "2D": twoD,
    "2D Antolin Drawing data": twoDAntolinDrawing,
    "2D Customer Drawing data": twoDCustomerDrawing,
    DM: dm,
    GS: gs,
  };

  // alert("1 3D: " + JSON.stringify(threeD, null, 2));
  //   alert("1 2D: " + JSON.stringify(twoD, null, 2));
  //   alert("1 DM: " + JSON.stringify(dm, null, 2));
  //   alert("1 GS: " + JSON.stringify(gs, null, 2));

  // alert("1 2DA: " + JSON.stringify(twoDAntolinDrawing, null, 2));
  // alert(
  //   "2 customerProductData: " + JSON.stringify(customerProductData, null, 2)
  // );
  const rfqData = fillCostSheetData(
    RFQ_TEMPLATE,
    totals,
    RFQ_ROLE_MAPPING,
    customerProductData,
    quotationText,
    sharedRef,
    additionalOthersHoursAndCostPayload,
    CECO_COST_SHEET_YearANDPhases,
    FEASIBILITY,
  );

  return (
    <RFQPhaseTable
      data={rfqData}
      quotationText={quotationText}
      phaseDates={phaseDates}
      manualWeeks={manualWeeks}
      updateManualWeeks={updateManualWeeks}
      FINAL_DEBUG_DATA={FINAL_DEBUG_DATA}
      pdfData={pdfData}
      offerRows={offerRows}
      industrializationRows={industrializationRows}
      dataManagementRows={dataManagementRows}
    />
  );
}

export default MainCostSheet;
