export default function prepareCADData(activities, Global, feasibility, feasibilityPhase1Percent, feasibilityPhase2Percent, protoDE, serieDE, hasProto, hasSerie) {

    const cadActivities = structuredClone(activities);
    let order = 0;

    // If TDL, COO, DE is YES then only the respective values will be kept within the subactivity level TDL, COO and DE or else it will be 0
    // Iterate through each product part data present within the each activities and update the TDL, COO, DE values based on the global TDL, COO, DE values at subactivity level

    for (const activity in cadActivities) {

        if (cadActivities[activity]["checked"] === true) {
            cadActivities[activity]["standardLoop"] = 1; // set standardLoop to 1 when activity is checked
        }

        for (const productPart in cadActivities[activity]) {
            // ignoring the extraWorkLoop, reWorkLoop, standardLoop, checked and order keys as they are not related to TDL, COO, DE values
            if (["extraWorkLoop", "reWorkLoop", "standardLoop", "checked", "order"].includes(productPart)) {
                continue;
            }

            // if (cadActivities[activity]["checked"] === false) { // when activity unchecked, set noOfComponent to 0
            //     cadActivities[activity][productPart]["noOfComponent"] = 0;
            // }

            if (!cadActivities[activity][productPart].subactivity) {
                continue;
            }


            for (const subActivity in cadActivities[activity][productPart].subactivity) {
                if (Global["TDL"] === "YES") {
                    cadActivities[activity][productPart].subactivity[subActivity]["TDL"] = cadActivities[activity][productPart].subactivity[subActivity]["TDL"];
                } else {
                    cadActivities[activity][productPart].subactivity[subActivity]["TDL"] = 0;
                }

                if (Global["COO"] === "YES") {
                    cadActivities[activity][productPart].subactivity[subActivity]["COO"] = cadActivities[activity][productPart].subactivity[subActivity]["COO"];
                } else {
                    cadActivities[activity][productPart].subactivity[subActivity]["COO"] = 0;
                }

                if (Global["DE"] === "YES") {
                    cadActivities[activity][productPart].subactivity[subActivity]["DE"] = cadActivities[activity][productPart].subactivity[subActivity]["DE"];
                } else {
                    cadActivities[activity][productPart].subactivity[subActivity]["DE"] = 0;
                }

                // If No Proto or No Serie then set the loops to 0 (for proper value in WO)
                if (!hasProto)
                    cadActivities[activity][productPart].subactivity[subActivity]["Proto"] = 0;

                if (!hasSerie)
                    cadActivities[activity][productPart].subactivity[subActivity]["Serie"] = 0;

                if (cadActivities[activity]["checked"] === false) { // when activity unchecked, set Proto/Serie to 0
                    cadActivities[activity][productPart].subactivity[subActivity]["Proto"] = 0;
                    cadActivities[activity][productPart].subactivity[subActivity]["Serie"] = 0;
                }
            }

            // Perform the same for the main activity level TDL, COO, DE values as well
            if (Global["TDL"] === "YES") {
                cadActivities[activity][productPart]["TDL"] = cadActivities[activity][productPart]["TDL"];
            } else {
                cadActivities[activity][productPart]["TDL"] = 0;
            }

            if (Global["COO"] === "YES") {
                cadActivities[activity][productPart]["COO"] = cadActivities[activity][productPart]["COO"];
            } else {
                cadActivities[activity][productPart]["COO"] = 0;
            }

            if (Global["DE"] === "YES") {
                cadActivities[activity][productPart]["DE"] = cadActivities[activity][productPart]["DE"];
            } else {
                cadActivities[activity][productPart]["DE"] = 0;
            }

            // If No Proto or No Serie then set the loops to 0 (for proper value in WO)
            if (!hasProto)
                cadActivities[activity][productPart]["Proto"] = 0;

            if (!hasSerie)
                cadActivities[activity][productPart]["Serie"] = 0;

            if (cadActivities[activity]["checked"] === false) { // when activity unchecked, set Proto/Serie to 0
                cadActivities[activity][productPart]["Proto"] = 0;
                cadActivities[activity][productPart]["Serie"] = 0;
            }

        }

        order = Number(cadActivities[activity].order)

    }
    console.log("Last order : ", order)
    // new logic for Feasibility
    if (feasibility === "YES") {
        let totalSelectedComponents = 0;
        // find the product parts which have "componentSelected" as true and store the noOfComponent in an object with key as product part and value as noOfComponent
        let productPartComponents = {};

        for (const activity in cadActivities) {
            for (const productPart in cadActivities[activity]) {
                if (["extraWorkLoop", "reWorkLoop", "standardLoop", "checked", "order"].includes(productPart)) {
                    continue;
                }
                const componentSelected = cadActivities[activity][productPart]?.["componentSelected"] || false;
                if (componentSelected) {
                    productPartComponents[productPart] = cadActivities[activity][productPart]["noOfComponent"];
                    totalSelectedComponents += productPartComponents[productPart];
                } else {
                    productPartComponents[productPart] = 0;
                }
            }
            break; // breaking after first iteration as we just need to find the product parts with componentSelected as true, assuming that the product parts will be same across all activities
        }

        let addONComponentsCount = 0;
        // check for ADD ON COMPONENTS component in all activities which have the name "ADD ON COMPONENTS" and if componentSelected is true then store value as noOfComponent in productPartComponents with key as "ADD ON COMPONENTS" and value as noOfComponent, this is to handle the case when ADD ON COMPONENTS is present at activity level instead of product part level
        for (const activity in cadActivities) {
            // check if activity name has "ADD ON COMPONENTS" substring present in it
            if (activity.includes("ADD ON COMPONENTS")) {
                for (const productPart in cadActivities[activity]) {
                    if (["extraWorkLoop", "reWorkLoop", "standardLoop", "checked", "order"].includes(productPart)) {
                        continue;
                    }
                    if (productPart === "ADD ON COMPONENTS" && cadActivities[activity][productPart]?.["componentSelected"]) {
                        addONComponentsCount += cadActivities[activity][productPart]["noOfComponent"];
                    }
                }
            }
            productPartComponents["ADD ON COMPONENTS"] = addONComponentsCount;
        }
        totalSelectedComponents += addONComponentsCount;

        console.log("Selected Product Parts and Components 2: ", productPartComponents, "\n Total no of compoenents : ", totalSelectedComponents);

        // Calculate phase 1 and phase 2 target feasibility totals
        const phase1Feasibility = feasibilityPhase1Percent * protoDE;
        const phase2Feasibility = feasibilityPhase2Percent * serieDE;

        // --- NEW LOGIC IMPLEMENTATION ---

        // Calculate the distributed Phase multipliers (protect against division by zero)
        const calculatedProto = totalSelectedComponents > 0 ? (phase1Feasibility / totalSelectedComponents) : 0;
        const calculatedSerie = totalSelectedComponents > 0 ? (phase2Feasibility / totalSelectedComponents) : 0;

        const feasibilityActivity = {
            "extraWorkLoop": 0,
            "reWorkLoop": 0,
            "standardLoop": 1,
            "checked": true,
            "order": (order + 1).toString()
        };

        // Loop through the extracted components and build the final object
        for (const part in productPartComponents) {
            const count = productPartComponents[part];
            const isSelected = count > 0;

            feasibilityActivity[part] = {
                "TDL": 0,
                "COO": 0,
                // Keep DE at a constant 1 if selected so the math works out perfectly
                "DE": isSelected ? 1 : 0,
                "subactivity": {},
                "noOfComponent": count,
                "componentSelected": isSelected,
                "Proto": isSelected ? (calculatedProto / 100) : 0,
                "Serie": isSelected ? (calculatedSerie / 100) : 0
            };
        }

        console.log("Final Feasibility Activity Object: ", feasibilityActivity);

        cadActivities["FEASIBILITY | Feasibility"] = feasibilityActivity
    }

    return cadActivities;

}