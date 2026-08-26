import RFQPhaseTable from "./RFQPhaseTable";
import { RFQ_TEMPLATE } from "./Data/rfqTemplate";
import { RFQ_ROLE_MAPPING } from "./Data/rfqMapping";
import { fillCostSheetData } from "./logic/fillCostSheetData";

function MainCostSheet({ threeD, twoD, dm, gs }) {
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

  const totals = {
    "3D": threeD,
    "2D": twoD,
    DM: dm,
    GS: gs,
  };

  //   alert("1 3D: " + JSON.stringify(threeD, null, 2));
  //   alert("1 2D: " + JSON.stringify(twoD, null, 2));
  //   alert("1 DM: " + JSON.stringify(dm, null, 2));
  //   alert("1 GS: " + JSON.stringify(gs, null, 2));

  const rfqData = fillCostSheetData(RFQ_TEMPLATE, totals, RFQ_ROLE_MAPPING);

  return <RFQPhaseTable data={rfqData} />;
}

export default MainCostSheet;
