import { sharedRef } from "../shared/sharedStore";
import { CECO_COST_SHEET_v8p13 } from "../CAD Product/data/Ceco_cost_sheet data/ceco_cost_sheet";
export default function prepareOfferData(rawOfferData) {
    // Assumptions:
    // 1. The activities have no product parts. So need to check in Work Order tool.
    // 2. Data Management activities values only available for DE. Need confirmation from client.

    let order = 100;
    // const dmOfferStandardHoursPerWeek = rawOfferData.hoursPerWeek["3D Standard"];
    const dmOfferStandardHoursPerWeek = () => {
        const targetSociety = sharedRef.dmCostCenter; // DM Cost Center

        // 1. Find the matching society name
        const foundEntry = CECO_COST_SHEET_v8p13.data.find(
            (item) => item.society === targetSociety
        );

        // 2. Extract hrsPerWeek. If not found set to 0
        const hrsPerWeek = foundEntry?.HoursPerWeek ?? 0;

        console.log("DM has this data \n", targetSociety, "\n", hrsPerWeek)

        return hrsPerWeek;
    }

    const hoursPerWeek = rawOfferData.hoursPerWeek

    const offer = {
        "activities": {},
    };

    // Get the total resources for each offer roles
    const totalTDL = rawOfferData.offerData.TDL.Resources * rawOfferData.weeks * hoursPerWeek.TDL;
    const total3DCoordination = rawOfferData.offerData["3D Coordination"].Resources * rawOfferData.weeks * hoursPerWeek["3D Coordination"];
    const total3DStandard = rawOfferData.offerData["3D Standard"].Resources * rawOfferData.weeks * hoursPerWeek["3D Standard"];

    //fetch the activities and percentages of Offer Phase (Considering any role as activities are same for all)
    const activityAndPercentages = rawOfferData.percentages.TDL.map(each => {
        return {
            activity: "Offer | " + each.activity,
            TDL: each.TDL,
            "3D Coordination": each["3D Coordination"],
            "3D Standard": each["3D Standard"]
        }
    });

    console.log("Total TDL : ", totalTDL)
    console.log("Total 3D Coordination : ", total3DCoordination)
    console.log("Total 3D Standard : ", total3DStandard)

    const activities = {};
    activityAndPercentages.forEach(activity => {
        let total = (activity.TDL / 100) * totalTDL + (activity["3D Coordination"] / 100) * total3DCoordination + (activity["3D Standard"] / 100) * total3DStandard;
        order++;
        activities[activity.activity] = {
            TDL: (activity.TDL / 100) * totalTDL,
            COO: (activity["3D Coordination"] / 100) * total3DCoordination,
            DE: (activity["3D Standard"] / 100) * total3DStandard,
            standard: total,
            total: total,
            extraWorkLoop: 0,
            reWorkLoop: 0,
            standardLoop: 1,
            checked: true,
            order: order.toString()
        };
    });

    // add Data Management activities
    activities["Offer | Data management"] = {
        TDL: 0,
        COO: 0,
        DE: rawOfferData.dmData["Data Management offer"].Resources * rawOfferData.dmData["Data Management offer"].weeks * dmOfferStandardHoursPerWeek(),
        standard: rawOfferData.dmData["Data Management offer"].Resources * rawOfferData.dmData["Data Management offer"].weeks * dmOfferStandardHoursPerWeek(),
        total: rawOfferData.dmData["Data Management offer"].Resources * rawOfferData.dmData["Data Management offer"].weeks * dmOfferStandardHoursPerWeek(),
        extraWorkLoop: 0,
        reWorkLoop: 0,
        standardLoop: 1,
        checked: true,
        order: (++order).toString()
    };

    if (rawOfferData.feasibility === "YES") {
        const feasibilityValue = (rawOfferData.feasibilityConstant * total3DStandard / 100);
        activities["Offer | Feasibility"] = {
            TDL: 0,
            COO: 0,
            DE: Number(feasibilityValue),
            standard: Number(feasibilityValue),
            total: Number(feasibilityValue),
            extraWorkLoop: 0,
            reWorkLoop: 0,
            standardLoop: 1,
            checked: true,
            order: (++order).toString()
        };
    }


    offer.activities = activities;

    offer.name = "Offer";

    return offer;
}

// export default function prepareOfferData(rawOfferData) {
//     // Assumptions:
//     // 1. The activities have no product parts. So need to check in Work Order tool.
//     // 2. Data Management activities values only available for DE. Need confirmation from client.

//     const dmOfferStandardHoursPerWeek = rawOfferData.hoursPerWeek["3D Standard"];

//     const hoursPerWeek = rawOfferData.hoursPerWeek

//     const offer = {
//         "activities": {},
//     };

//     // Get the total resources for each offer roles
//     const totalTDL = rawOfferData.offerData.TDL.Resources * rawOfferData.weeks * hoursPerWeek.TDL;
//     const total3DCoordination = rawOfferData.offerData["3D Coordination"].Resources * rawOfferData.weeks * hoursPerWeek["3D Coordination"];
//     const total3DStandard = rawOfferData.offerData["3D Standard"].Resources * rawOfferData.weeks * hoursPerWeek["3D Standard"];


//     console.log("Total TDL : ", totalTDL)
//     console.log("Total 3D Coordination : ", total3DCoordination)
//     console.log("Total 3D Standard : ", total3DStandard)

//     const activities = {};

//     // 3D modification activity as a whole
//     activities["Offer | 3D modifications"] = {
//         TDL: totalTDL,
//         COO: total3DCoordination,
//         DE: total3DStandard,
//         standard: totalTDL + total3DCoordination + total3DStandard,
//         total: totalTDL + total3DCoordination + total3DStandard,
//         extraWorkLoop: 0,
//         reWorkLoop: 0,
//         standardLoop: 0,
//         checked: true,
//         order: "101"
//     };


//     // add Data Management activities
//     activities["Offer | Data management"] = {
//         TDL: 0,
//         COO: 0,
//         DE: rawOfferData.dmData["Data Management offer"].Resources * rawOfferData.dmData["Data Management offer"].weeks * dmOfferStandardHoursPerWeek,
//         standard: rawOfferData.dmData["Data Management offer"].Resources * rawOfferData.dmData["Data Management offer"].weeks * dmOfferStandardHoursPerWeek,
//         total: rawOfferData.dmData["Data Management offer"].Resources * rawOfferData.dmData["Data Management offer"].weeks * dmOfferStandardHoursPerWeek,
//         extraWorkLoop: 0,
//         reWorkLoop: 0,
//         standardLoop: 0,
//         checked: true,
//         order: "102"
//     };

//     offer.activities = activities;

//     offer.name = "Offer";

//     return offer;
// }
