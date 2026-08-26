export function getCheckedActivities(CAE_json_data) {
 
    return Object.fromEntries(
 
        Object.entries(CAE_json_data.activities)
 
            .filter(([_, activityData]) => activityData.checked === true)
 
            .map(([activityName, activityData]) => [
                activityName,
                {
                    Proto: activityData.proto,
                    Serie: activityData.serie,
                    "Number Of Loops": activityData.noOfLoops
                }
            ])
    );
}
 
 