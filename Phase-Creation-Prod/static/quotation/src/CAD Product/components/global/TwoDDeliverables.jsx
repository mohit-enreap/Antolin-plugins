// import React from "react";

// // ==================================================
// // 2D DELIVERABLES
// // ==================================================

// const TWO_D_ACTIVITIES = [
//     "2D DELIVERABLES | Internal Drawing Main Parts",
//     "2D DELIVERABLES | COP / Inherit Drawings"
// ];


// // ==================================================
// // TwoDDeliverables
// // ==================================================

// const TwoDDeliverables = ({
//     activitiesData,
//     updateSubValueFor2D
// }) => {


//     // ==================================================
//     // GET CURRENT VALUE
//     // ==================================================

//     const getActivityValue_2d = (activityName) => {

//         return (
//             activitiesData?.[activityName]?.Proto ?? 0
//         );
//     };


//     // ==================================================
//     // HANDLE 2D VALUE CHANGE
//     // ==================================================

//     const handle2DValueChange_2d = (
//         activityName,
//         event
//     ) => {

//         const newValue = Math.max(
//             0,
//             Number(event.target.value) || 0
//         );


//         // ==================================================
//         // UPDATE 2D ACTIVITY
//         // ==================================================

//         updateSubValueFor2D(
//             activityName,
//             newValue
//         );
//     };


//     // ==================================================
//     // RENDER
//     // ==================================================

//     return (
//         <table
//             style={{
//                 width: "100%",
//                 borderCollapse: "collapse",
//                 fontSize: "12px"
//             }}
//         >

//             {/* ==================================================
//                 HEADER
//             ================================================== */}

//             <thead>

//                 <tr>

//                     <th
//                         style={{
//                             border: "1px solid #000",
//                             padding: "5px",
//                             textAlign: "left"
//                         }}
//                     >
//                         Activity
//                     </th>


//                     <th
//                         style={{
//                             border: "1px solid #000",
//                             padding: "5px",
//                             width: "100px",
//                             textAlign: "center"
//                         }}
//                     >
//                         N° Com.
//                     </th>

//                 </tr>

//             </thead>


//             {/* ==================================================
//                 BODY
//             ================================================== */}

//             <tbody>

//                 {TWO_D_ACTIVITIES.map(
//                     (activityName) => {

//                         const value =
//                             getActivityValue_2d(
//                                 activityName
//                             );


//                         return (
//                             <tr
//                                 key={activityName}
//                             >

//                                 {/* ======================================
//                                     ACTIVITY NAME
//                                 ====================================== */}

//                                 <td
//                                     style={{
//                                         border: "1px solid #000",
//                                         padding: "5px"
//                                     }}
//                                 >
//                                     {activityName}
//                                 </td>


//                                 {/* ======================================
//                                     VALUE
//                                 ====================================== */}

//                                 <td
//                                     style={{
//                                         border: "1px solid #000",
//                                         padding: 0
//                                     }}
//                                 >

//                                     <input
//                                         type="number"
//                                         min="0"
//                                         step="1"

//                                         value={value}

//                                         style={{
//                                             width: "100%",
//                                             border: "none",
//                                             outline: "none",
//                                             textAlign: "center",
//                                             boxSizing: "border-box"
//                                         }}

//                                         onChange={(event) =>
//                                             handle2DValueChange_2d(
//                                                 activityName,
//                                                 event
//                                             )
//                                         }
//                                     />

//                                 </td>

//                             </tr>
//                         );

//                     }
//                 )}

//             </tbody>

//         </table>
//     );
// };


// export default TwoDDeliverables;






//==========================================

import React, { useState, useEffect } from "react";

const TWO_D_ACTIVITIES = [
    "2D DELIVERABLES | Internal Drawing Main Parts",
    "2D DELIVERABLES | COP / Inherit Drawings",
    "2D DELIVERABLES | Format Drawing",
    "2D DELIVERABLES | Roll Drawing",
    "2D DELIVERABLES | NVH Drawing",
    "2D DELIVERABLES | Internal Assembly Drawings",
    "2D DELIVERABLES | Customer Part Drawings",
    "2D DELIVERABLES | Customer Assy Drawings"
];

const TwoDDeliverables = ({
    activitiesData,
    updateSubValueFor2D
}) => {
    const [values2D, setValues2D] = useState({});

    // Retrieve initial value from data
    const getActivityValue_2d = (activityName) => {
        const activityData = activitiesData?.[activityName];
        if (!activityData) return 0;

        const component = Object.values(activityData).find(
            (item) =>
                item &&
                typeof item === "object" &&
                !Array.isArray(item) &&
                "Proto" in item
        );
        return component?.Proto ?? 0;
    };

    // Initialize from JSON
    useEffect(() => {
        const initialValues = {};
        TWO_D_ACTIVITIES.forEach((activityName) => {
            initialValues[activityName] = getActivityValue_2d(activityName);
        });
        setValues2D(initialValues);
    }, [activitiesData]);

    // Unified change handler for +/- buttons and typing
    const handleQuantityChange = (activityName, newValue) => {
        const safeValue = Math.max(0, Number(newValue) || 0);

        setValues2D((prev) => ({
            ...prev,
            [activityName]: safeValue
        }));

        updateSubValueFor2D(activityName, safeValue);
    };

    return (
        <div className="unified-table-container" style={{ marginTop: 30 }}>
            <h3 style={{ marginBottom: "15px" }}>2D Activity Configuration</h3>

            <table className="config-table">
                <thead>
                    <tr>
                        <th>Activity</th>
                        <th>N° Com.</th>
                    </tr>
                </thead>

                <tbody>
                    {TWO_D_ACTIVITIES.map((activityName) => {
                        const value = values2D?.[activityName] ?? 0;

                        // Clean up display name to remove the prefix for a cleaner UI
                        const displayName = activityName.split(" | ")[1] || activityName;

                        return (
                            <tr key={activityName} className="main-row">
                                <td>{displayName}</td>

                                {/* Quantity Controls identical to the uniform style */}
                                <td>
                                    <div className="quantity-control">
                                        <button
                                            className="quantity-button"
                                            onClick={() => handleQuantityChange(activityName, value - 1)}
                                            disabled={value === 0}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            className="quantity-input"
                                            value={value}
                                            onChange={(e) => handleQuantityChange(activityName, e.target.value)}
                                        />
                                        <button
                                            className="quantity-button"
                                            onClick={() => handleQuantityChange(activityName, value + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default TwoDDeliverables;