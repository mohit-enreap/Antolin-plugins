import { productParts } from './productPartsMap.js';

export function getSelectedProductParts(activities) {
    // 1. Defensive Check: Ensure activities actually exists before looping
    if (!activities || typeof activities !== 'object') {
        return [];
    }

    const selectedParts = new Set();
    const ignoreKeys = ["extraWorkLoop", "reWorkLoop", "standardLoop", "checked", "order"];

    for (const activityName in activities) {
        const activityData = activities[activityName];

        for (const key in activityData) {
            // Skip the operational keys
            if (ignoreKeys.includes(key)) continue;

            // If the component is selected, add it to the Set.
            // If base components are true across multiple activities, the Set ignores the duplicates.
            if (activityData[key]?.componentSelected === true) {
                selectedParts.add(key);
            }
        }
    }

    // Convert the Set back to a standard Array and return it
    return Array.from(selectedParts);
}

export function getProductParts(activities) {
    // 2. Get the array of selected names using your function
    const selectedPartNames = getSelectedProductParts(activities);

    // 3. Map the names to their IDs directly using the imported 'productParts'
    const selectedPartIds = selectedPartNames
        .map(name => productParts[name]) // Look up the ID in the imported JSON
        .filter(id => id !== undefined); // Safety check: removes any undefined values

    console.log("Product Parts Selected IDs:", selectedPartIds);

    // 4. Format directly for Jira
    const jiraFormattedIds = selectedPartIds.map(id => ({ id: id }));

    return jiraFormattedIds;
}