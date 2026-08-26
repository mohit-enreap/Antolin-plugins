import { sharedRef } from "../shared/sharedStore";

export default function prepareCAEData(activities, Global) {
    // Deep copy to avoid mutating the original data
    const caeActivities = structuredClone(activities);

    const hasProto = sharedRef.phaseflagShared?.phase1flag;
    const hasSerie = sharedRef.phaseflagShared?.phase2flag;

    for (const [activityName, activityData] of Object.entries(caeActivities)) {

        // Check if TDL/DE roles are selected in Quotation
        if (!Global["TDL"]) activityData["TDL"] = 0;
        else activityData["TDL"] = activityData["TDL"] / 2 // Divided by 2 for getting correct results in WO

        if (!Global["DE"]) activityData["DE"] = 0;
        else activityData["DE"] = activityData["DE"] / 2 // Divided by 2 for getting correct results in WO


        // Create the required Capitalized keys of Proto/Serie (Used in Work Order)
        activityData["Proto"] = hasProto ? activityData["proto"] : 0;
        activityData["Serie"] = hasSerie ? activityData["serie"] : 0;

        // make standard loop as 1 if checked
        if (activityData["checked"])
            activityData["standardLoop"] = 1
        else {
            activityData["Proto"] = 0;
            activityData["Serie"] = 0;
        }


        // Delete unnecessary calculated/preview keys
        if (activityName === "ITERATIONS|ITERATIONS" || activityName === "ITERATIONS | ITERATIONS") {
            delete activityData.previewProtoTotal;
            delete activityData.previewSerieTotal;
            delete activityData.previewTotal;
            delete activityData.protoTotal;
            delete activityData.serieTotal;
            delete activityData.calculatedTotal;
            delete activityData.calculatedProtoTotal;
            delete activityData.calculatedSerieTotal;
        } else {
            delete activityData.previewTotal;
            delete activityData.previewProtoTotal;
            delete activityData.previewSerieTotal;
            delete activityData.calculatedTotal;
        }

        // Clean up the original lowercase proto/serie keys
        delete activityData.proto;
        delete activityData.serie;
    }

    return caeActivities;
}