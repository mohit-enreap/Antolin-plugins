export default function prepareIndustData(rawIndustData) {
    const industData = rawIndustData.industrializationData;
    const weeks = rawIndustData.weeks;
    let order = 100;
    const hoursPerWeek = rawIndustData.hoursPerWeek;

    const activities = ["Industrialization | 3D modifications", "Industrialization | 2D modifications", "Industrialization | Data management"];
    const industActivities = {};

    for (let i = 0; i < activities.length; i++) {
        industActivities[activities[i]] = {
            TDL: 0,
            COO: 0,
            DE: 0,
            standard: 0,
            total: 0,
            extraWorkLoop: 0,
            reWorkLoop: 0,
            standardLoop: 1,
            checked: true,
            order: (++order).toString()
        };
    }

    industActivities["Industrialization | 3D modifications"].TDL = industData["TDL"].Resources * weeks * hoursPerWeek["TDL"];
    industActivities["Industrialization | 3D modifications"].COO = industData["3D Coordination"].Resources * weeks * hoursPerWeek["3D Coordination"];
    industActivities["Industrialization | 3D modifications"].DE = industData["3D Standard"].Resources * weeks * hoursPerWeek["3D Standard"];
    industActivities["Industrialization | 3D modifications"].standard = industActivities["Industrialization | 3D modifications"].TDL + industActivities["Industrialization | 3D modifications"].COO + industActivities["Industrialization | 3D modifications"].DE;
    industActivities["Industrialization | 3D modifications"].total = industActivities["Industrialization | 3D modifications"].standard;


    if (rawIndustData.feasibility === "YES") {
        const feasibilityValue = (rawIndustData.feasibilityConstant * (industData["3D Standard"].Resources * weeks * hoursPerWeek["3D Standard"]) / 100);
        industActivities["Industrialization | Feasibility"] = {
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


    return {
        "activities": industActivities,
        "percentages": {
            "Headliner": {
                "_2DModification": (100/9),
                "_3DModification": 100,
                "dataManagement": (100/9)
            }
        },
        name: "Industrialization"
    }
}