import { sharedRef } from "../shared/sharedStore";

export default function preparePSData(activities, Global) {
    // Deep copy to prevent mutating original data
    const psActivities = structuredClone(activities);

    const hasProto = sharedRef.phaseflagShared?.phase1flag;
    const hasSerie = sharedRef.phaseflagShared?.phase2flag;

    console.log("PS Integration,\n Proto : ", hasProto, "\n Serie : ", hasSerie);

    for (const [activityName, activityData] of Object.entries(psActivities)) {
        // If checked is true, ensure standardLoop is 1
        if (activityData.checked === true) {
            activityData.standardLoop = 1;
        } else {
            activityData.standardLoop = 0;
        }
        for (const [key, itemData] of Object.entries(activityData)) {

            // Check if the current item is a product part object
            if (typeof itemData === "object" && itemData !== null) {

                // 1. Ensure componentSelected has a boolean fallback
                itemData.componentSelected = itemData.componentSelected ?? false;

                // 2. Set noOfComponent based on selection status
                if (itemData.componentSelected === true) {
                    // If selected but missing a count, default to 1. Keep existing count if present.
                    itemData.noOfComponent = itemData.noOfComponent ?? 1;
                } else {
                    // If not selected, the count must always be 0
                    itemData.noOfComponent = 0;
                }

                // 3. Global checks (Using Optional Chaining for safety)
                if (Global?.TDL !== "YES") itemData.TDL = 0;
                if (Global?.COO !== "YES") itemData.COO = 0;
                if (Global?.DE !== "YES") itemData.DE = 0;

                // 4. Proto & Serie checks
                itemData.Proto = hasProto ? (itemData.Proto ?? 0) : 0;
                itemData.Serie = hasSerie ? (itemData.Serie ?? 0) : 0;
            }
        }
    }

    return psActivities;
}