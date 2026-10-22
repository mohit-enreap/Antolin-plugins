// import React, { useEffect, useRef, useState } from "react";
// import { PRODUCT_COMPONENT_CONFIG } from "./productComponentConfig";

// const getProductComponentConfig = (productName) => {
//   return PRODUCT_COMPONENT_CONFIG.Products[productName] || null;
// };

// export const ProductComponents = ({
//   productName,
//   initialData,
//   onSelectionChange
// }) => {
//   const selectedProduct = productName || "IP";
//   const productConfig = getProductComponentConfig(selectedProduct);

//   const [latestChange, setLatestChange] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isSaved, setIsSaved] = useState(true);
//   const [componentQuantities, setComponentQuantities] = useState({});

//   const autoSaveTimer = useRef(null);
//   const isInitialized = useRef(false);
//   const hasUserChanged = useRef(false);

//   if (!productConfig) {
//     return (
//       <div>
//         No component configuration found for {selectedProduct}
//       </div>
//     );
//   }

//   const groupsOfComponents =
//     productConfig.GroupsOfComponents && typeof productConfig.GroupsOfComponents === "object"
//       ? Object.entries(productConfig.GroupsOfComponents).filter(
//         ([, components]) => Array.isArray(components) && components.length > 0
//       )
//       : [];

//   const singleComponents = Array.isArray(productConfig.SingleComponents)
//     ? productConfig.SingleComponents.filter(
//       component => typeof component === "string" && component.trim() !== ""
//     )
//     : [];

//   useEffect(() => {
//     if (hasUserChanged.current) {
//       return;
//     }

//     const initialQuantities = {};

//     // ==================================================
//     // Groups
//     // ==================================================
//     groupsOfComponents.forEach(
//       ([groupName, components]) => {
//         initialQuantities[groupName] = {};

//         components.forEach(component => {
//           const savedValue =
//             initialData
//               ?.GroupsOfComponents
//               ?.[groupName]
//               ?.components
//             ?.[component];

//           initialQuantities[groupName][component] = Number(savedValue ?? 0);
//         });
//       }
//     );

//     // ==================================================
//     // Single Components
//     // ==================================================
//     initialQuantities.SingleComponents = {};

//     singleComponents.forEach(component => {
//       const savedValue =
//         initialData
//           ?.SingleComponents
//         ?.[component];

//       initialQuantities.SingleComponents[component] = Number(savedValue ?? 0);
//     });

//     // ==================================================
//     // Set initial values
//     // ==================================================
//     setComponentQuantities(initialQuantities);

//     // ==================================================
//     // Initial state is saved
//     // ==================================================
//     setIsSaved(true);

//     // ==================================================
//     // No latest change
//     // ==================================================
//     setLatestChange(null);

//     // ==================================================
//     // Mark initialized
//     // ==================================================
//     isInitialized.current = true;

//   }, [selectedProduct]);

//   // ==================================================
//   // Handle Product Change
//   //
//   // When user changes product, allow the new product's
//   // initialData to initialize.
//   // ==================================================
//   useEffect(() => {
//     hasUserChanged.current = false;
//     isInitialized.current = false;

//     // ==================================================
//     // Clear auto save timer
//     // ==================================================
//     if (autoSaveTimer.current) {
//       clearTimeout(autoSaveTimer.current);
//       autoSaveTimer.current = null;
//     }

//   }, [selectedProduct]);

//   // ==================================================
//   // Initialize initialData when it becomes available
//   //
//   // Only happens if user hasn't edited anything.
//   // ==================================================
//   useEffect(() => {
//     if (isInitialized.current) {
//       return;
//     }

//     if (hasUserChanged.current) {
//       return;
//     }

//     const initialQuantities = {};

//     // ==================================================
//     // Groups
//     // ==================================================
//     groupsOfComponents.forEach(
//       ([groupName, components]) => {
//         initialQuantities[groupName] = {};

//         components.forEach(component => {
//           const savedValue =
//             initialData
//               ?.GroupsOfComponents
//               ?.[groupName]
//               ?.components
//             ?.[component];

//           initialQuantities[groupName][component] = Number(savedValue ?? 0);
//         });
//       }
//     );

//     // ==================================================
//     // Single Components
//     // ==================================================
//     initialQuantities.SingleComponents = {};

//     singleComponents.forEach(component => {
//       const savedValue =
//         initialData
//           ?.SingleComponents
//         ?.[component];

//       initialQuantities.SingleComponents[component] = Number(savedValue ?? 0);
//     });

//     setComponentQuantities(initialQuantities);
//     setLatestChange(null);
//     setIsSaved(true);
//     isInitialized.current = true;

//   }, [
//     initialData,
//     groupsOfComponents,
//     singleComponents
//   ]);

//   // ==================================================
//   // Mark Component As Changed
//   // ==================================================
//   const markAsChanged = (
//     groupName,
//     componentName,
//     newValue
//   ) => {
//     // ==================================================
//     // IMPORTANT:
//     // From this point onwards, local values are the
//     // source of truth.
//     // ==================================================
//     hasUserChanged.current = true;

//     // ==================================================
//     // Button becomes BLUE / Save
//     // ==================================================
//     setIsSaved(false);

//     // ==================================================
//     // Remember latest change
//     // ==================================================
//     setLatestChange({
//       type: groupName === "SingleComponents" ? "SINGLE" : "GROUP",
//       parent: groupName === "SingleComponents" ? null : groupName,
//       component: componentName,
//       componentValue: newValue
//     });
//   };

//   // ==================================================
//   // Increase Component Quantity
//   // ==================================================
//   const incrementComponent = (
//     groupName,
//     componentName
//   ) => {
//     setComponentQuantities(previous => {
//       const currentValue = previous[groupName]?.[componentName] || 0;
//       const newValue = currentValue + 1;

//       // ==================================================
//       // Mark as changed
//       // ==================================================
//       markAsChanged(groupName, componentName, newValue);

//       return {
//         ...previous,
//         [groupName]: {
//           ...previous[groupName],
//           [componentName]: newValue
//         }
//       };
//     });
//   };

//   // ==================================================
//   // Decrease Component Quantity
//   //
//   // Minimum = 0
//   // ==================================================
//   const decrementComponent = (
//     groupName,
//     componentName
//   ) => {
//     setComponentQuantities(previous => {
//       const currentValue = previous[groupName]?.[componentName] || 0;
//       const newValue = Math.max(0, currentValue - 1);

//       // ==================================================
//       // Mark as changed
//       // ==================================================
//       markAsChanged(groupName, componentName, newValue);

//       return {
//         ...previous,
//         [groupName]: {
//           ...previous[groupName],
//           [componentName]: newValue
//         }
//       };
//     });
//   };

//   // ==================================================
//   // Set Quantity Directly
//   // ==================================================
//   const setComponentValue = (
//     groupName,
//     componentName,
//     value
//   ) => {
//     const numericValue = Number(value);
//     const safeValue = Number.isFinite(numericValue)
//       ? Math.max(0, Math.floor(numericValue))
//       : 0;

//     setComponentQuantities(previous => {
//       // ==================================================
//       // Mark as changed
//       // ==================================================
//       markAsChanged(groupName, componentName, safeValue);

//       return {
//         ...previous,
//         [groupName]: {
//           ...previous[groupName],
//           [componentName]: safeValue
//         }
//       };
//     });
//   };

//   // ==================================================
//   // Calculate Parent Total
//   // ==================================================
//   const getGroupTotal = (groupName) => {
//     const group = componentQuantities[groupName] || {};
//     return Object.values(group).reduce(
//       (total, value) => total + (Number(value) || 0),
//       0
//     );
//   };

//   // ==================================================
//   // Build Final JSON
//   // ==================================================
//   const buildFinalJson = () => {
//     const finalGroups = {};

//     // ==================================================
//     // Build ALL Groups
//     // ==================================================
//     groupsOfComponents.forEach(
//       ([groupName, components]) => {
//         const componentValues = {};
//         let groupTotal = 0;

//         components.forEach(component => {
//           const value = Number(
//             componentQuantities?.[groupName]?.[component] || 0
//           );

//           componentValues[component] = value;
//           groupTotal += value;
//         });

//         finalGroups[groupName] = {
//           total: groupTotal,
//           components: componentValues
//         };
//       }
//     );

//     // ==================================================
//     // Build Single Components
//     // ==================================================
//     const finalSingleComponents = {};

//     singleComponents.forEach(component => {
//       finalSingleComponents[component] = Number(
//         componentQuantities?.SingleComponents?.[component] || 0
//       );
//     });

//     // ==================================================
//     // Build Latest Change
//     // ==================================================
//     let latest = null;

//     if (latestChange) {
//       // ==================================================
//       // GROUP
//       // ==================================================
//       if (latestChange.type === "GROUP") {
//         const parentData = finalGroups[latestChange.parent];
//         const componentValue = parentData?.components?.[latestChange.component] || 0;

//         latest = {
//           type: "GROUP",
//           parent: latestChange.parent,
//           component: latestChange.component,
//           componentValue: componentValue,
//           parentTotal: parentData?.total || 0
//         };
//       }

//       // ==================================================
//       // SINGLE
//       // ==================================================
//       if (latestChange.type === "SINGLE") {
//         latest = {
//           type: "SINGLE",
//           component: latestChange.component,
//           componentValue: finalSingleComponents[latestChange.component] || 0
//         };
//       }
//     }

//     // ==================================================
//     // FINAL JSON
//     // ==================================================
//     return {
//       product: selectedProduct,
//       GroupsOfComponents: finalGroups,
//       SingleComponents: finalSingleComponents,
//       latest: latest
//     };
//   };

//   // ==================================================
//   // SAVE
//   //
//   // Used by:
//   //
//   // 1. Manual Save
//   // 2. Automatic Save
//   // ==================================================
//   const handleSave = () => {
//     // ==================================================
//     // Don't save while another save is running
//     // ==================================================
//     if (isSaving) {
//       return;
//     }

//     // ==================================================
//     // Cancel pending auto-save timer
//     // ==================================================
//     if (autoSaveTimer.current) {
//       clearTimeout(autoSaveTimer.current);
//       autoSaveTimer.current = null;
//     }

//     setIsSaving(true);

//     try {
//       // ==================================================
//       // Build JSON from CURRENT LOCAL STATE
//       //
//       // IMPORTANT:
//       //
//       // This uses componentQuantities.
//       //
//       // It does NOT use initialData.
//       // ==================================================
//       const finalJson = buildFinalJson();

//       // ==================================================
//       // Send to parent
//       // ==================================================
//       if (onSelectionChange) {
//         onSelectionChange(finalJson);
//       }

//       // ==================================================
//       // Mark saved
//       // ==================================================
//       setIsSaved(true);

//       // ==================================================
//       // IMPORTANT:
//       //
//       // DO NOT reset:
//       //
//       // componentQuantities
//       //
//       // The current user values stay on screen.
//       // ==================================================
//     } finally {
//       setTimeout(() => {
//         setIsSaving(false);
//       }, 300);
//     }
//   };

//   // ==================================================
//   // AUTO SAVE
//   //
//   // Save automatically after 3 seconds of inactivity.
//   // ==================================================
//   useEffect(() => {
//     // ==================================================
//     // No unsaved changes
//     // ==================================================
//     if (isSaved || !latestChange) {
//       return;
//     }

//     // ==================================================
//     // Clear old timer
//     // ==================================================
//     if (autoSaveTimer.current) {
//       clearTimeout(autoSaveTimer.current);
//     }

//     // ==================================================
//     // Start new 3-second timer
//     // ==================================================
//     autoSaveTimer.current = setTimeout(() => {
//       handleSave();
//     }, 3000);

//     // ==================================================
//     // Cleanup
//     // ==================================================
//     return () => {
//       if (autoSaveTimer.current) {
//         clearTimeout(autoSaveTimer.current);
//         autoSaveTimer.current = null;
//       }
//     };
//   }, [latestChange, isSaved]);

//   // ==================================================
//   // Component Unmount Cleanup
//   // ==================================================
//   useEffect(() => {
//     return () => {
//       if (autoSaveTimer.current) {
//         clearTimeout(autoSaveTimer.current);
//         autoSaveTimer.current = null;
//       }
//     };
//   }, []);

//   // ==================================================
//   // CSS
//   // ==================================================
//   const styles = `
//         .product-components {
//             width: 100%;
//             font-family: Arial, Helvetica, sans-serif;
//             font-size: 10px;
//             color: #172b4d;
//         }

//         /* Product Header */
//         .product-header {
//             display: flex;
//             align-items: center;
//             justify-content: space-between;
//             min-height: 28px;
//             padding: 0 8px;
//             margin-bottom: 6px;
//             background: #f4f5f7;
//             border: 1px solid #dfe1e6;
//             border-radius: 3px;
//         }

//         .product-title {
//             font-size: 12px;
//             font-weight: 600;
//             color: #172b4d;
//         }

//         /* Section Header */
//         .section-header {
//             display: flex;
//             align-items: center;
//             height: 22px;
//             margin-top: 5px;
//             margin-bottom: 4px;
//             padding: 0 6px;
//             background: #f4f5f7;
//             border: 1px solid #dfe1e6;
//             border-radius: 3px;
//             font-size: 10px;
//             font-weight: 600;
//             color: #42526e;
//         }

//         /* Groups Grid */
//         .groups-grid {
//             display: grid;
//             grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//             gap: 6px;
//             width: 100%;
//         }

//         /* Component Group */
//         .component-group {
//             min-width: 0;
//             border: 1px solid #dfe1e6;
//             border-radius: 3px;
//             overflow: hidden;
//             background: #ffffff;
//         }

//         /* Group Header */
//         .group-header {
//             display: flex;
//             align-items: center;
//             justify-content: space-between;
//             min-height: 25px;
//             padding: 3px 7px;
//             background: #fafbfc;
//             border-bottom: 1px solid #dfe1e6;
//             font-size: 9px;
//             font-weight: 600;
//             color: #42526e;
//             line-height: 12px;
//         }

//         .group-title {
//             flex: 1;
//         }

//         /* Parent Total */
//         .group-total {
//             display: inline-flex;
//             align-items: center;
//             justify-content: center;
//             min-width: 30px;
//             height: 18px;
//             padding: 0 6px;
//             margin-left: 6px;
//             border-radius: 9px;
//             background: #deebff;
//             color: #0747a6;
//             font-size: 9px;
//             font-weight: 700;
//         }

//         /* Component List */
//         .component-list {
//             display: flex;
//             flex-direction: column;
//             width: 100%;
//         }

//         /* Component Row */
//         .component-item {
//             display: flex;
//             align-items: center;
//             min-height: 30px;
//             padding: 3px 6px;
//             border-bottom: 1px solid #ebecf0;
//             gap: 6px;
//             font-size: 10px;
//         }

//         .component-item:last-child {
//             border-bottom: none;
//         }

//         /* Component Number */
//         .component-number {
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             width: 20px;
//             height: 17px;
//             flex-shrink: 0;
//             border-radius: 3px;
//             font-size: 8px;
//             font-weight: 600;
//         }

//         /* Component Name */
//         .component-name {
//             flex: 1;
//             min-width: 0;
//             line-height: 14px;
//             overflow: hidden;
//             text-overflow: ellipsis;
//             white-space: nowrap;
//         }

//         /* Index Colors */
//         .component-index-0 { background: #deebff; color: #0747a6; }
//         .component-index-1 { background: #e3fcef; color: #006644; }
//         .component-index-2 { background: #ffebe6; color: #bf2600; }
//         .component-index-3 { background: #eae6ff; color: #403294; }
//         .component-index-4 { background: #fff0b3; color: #7a5c00; }

//         /* Quantity Controls */
//         .quantity-control {
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             gap: 3px;
//             flex-shrink: 0;
//         }

//         .quantity-button {
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             width: 20px;
//             height: 20px;
//             padding: 0;
//             border: 1px solid #c1c7d0;
//             border-radius: 3px;
//             background: #ffffff;
//             color: #172b4d;
//             font-size: 13px;
//             font-weight: 600;
//             cursor: pointer;
//             line-height: 1;
//         }

//         .quantity-button:hover { background: #f4f5f7; }
//         .quantity-button:active { background: #ebecf0; }
//         .quantity-button:disabled { opacity: 0.45; cursor: not-allowed; }

//         /* Quantity Input */
//         .quantity-input {
//             width: 38px;
//             height: 20px;
//             padding: 0 3px;
//             border: 1px solid #c1c7d0;
//             border-radius: 3px;
//             text-align: center;
//             font-size: 10px;
//             font-weight: 600;
//             color: #172b4d;
//             outline: none;
//         }

//         .quantity-input:focus { border-color: #4c9aff; }

//         /* Remove browser number arrows */
//         .quantity-input::-webkit-inner-spin-button,
//         .quantity-input::-webkit-outer-spin-button {
//             -webkit-appearance: none;
//             margin: 0;
//         }

//         .quantity-input[type=number] { -moz-appearance: textfield; }

//         /* Selected Row */
//         .component-item-selected { background: #f0f7ff; }
//         .component-item-selected .component-name { font-weight: 600; color: #0747a6; }

//         /* Single Component */
//         .single-component-group { min-width: 250px; }

//         /* SAVE SECTION */
//         .save-container {
//             display: flex;
//             justify-content: flex-end;
//             align-items: center;
//             margin-top: 10px;
//             padding-top: 7px;
//             border-top: 1px solid #dfe1e6;
//         }

//         /* SAVE BUTTON */
//         .save-button {
//             min-width: 70px;
//             height: 28px;
//             padding: 0 14px;
//             border: none;
//             border-radius: 3px;
//             background: #0052cc;
//             color: #ffffff;
//             font-size: 11px;
//             font-weight: 600;
//             cursor: pointer;
//         }

//         .save-button:hover { background: #0747a6; }
//         .save-button:active { background: #003b95; }
//         .save-button:disabled { opacity: 0.6; cursor: not-allowed; }

//         /* SAVED BUTTON */
//         .save-button-saved {
//             background: #dfe1e6;
//             color: #6b778c;
//             cursor: not-allowed;
//             opacity: 1;
//         }

//         .save-button-saved:hover { background: #dfe1e6; }

//         /* Responsive */
//         @media (max-width: 700px) {
//             .groups-grid { grid-template-columns: 1fr; }
//         }
//     `;

//   // ==================================================
//   // Render Child Quantity Control
//   // ==================================================
//   const renderQuantityControl = (groupName, componentName) => {
//     const quantity = componentQuantities[groupName]?.[componentName] || 0;

//     return (
//       <div className="quantity-control">
//         {/* Decrement */}
//         <button
//           type="button"
//           className="quantity-button"
//           onClick={() => decrementComponent(groupName, componentName)}
//           disabled={quantity === 0}
//         >
//           −
//         </button>

//         {/* Direct Input */}
//         <input
//           type="number"
//           min="0"
//           className="quantity-input"
//           value={quantity}
//           onChange={(event) =>
//             setComponentValue(groupName, componentName, event.target.value)
//           }
//         />

//         {/* Increment */}
//         <button
//           type="button"
//           className="quantity-button"
//           onClick={() => incrementComponent(groupName, componentName)}
//         >
//           +
//         </button>
//       </div>
//     );
//   };

//   // ==================================================
//   // Render
//   // ==================================================
//   return (
//     <div className="product-components">
//       <style>{styles}</style>

//       {/* Product Header */}
//       <div className="product-header">
//         <span className="product-title">{selectedProduct}</span>
//       </div>

//       {/* GROUPS OF COMPONENTS */}
//       {groupsOfComponents.length > 0 && (
//         <>
//           <div className="section-header">Groups Of Components</div>
//           <div className="groups-grid">
//             {groupsOfComponents.map(([groupName, components]) => {
//               // Remove empty values
//               const validComponents = components.filter(
//                 component => typeof component === "string" && component.trim() !== ""
//               );

//               if (validComponents.length === 0) {
//                 return null;
//               }

//               // Parent Total
//               const groupTotal = getGroupTotal(groupName);

//               return (
//                 <div className="component-group" key={groupName}>
//                   {/* Parent Header */}
//                   <div className="group-header">
//                     <span className="group-title">{groupName}</span>
//                     <span className="group-total">Total: {groupTotal}</span>
//                   </div>

//                   {/* Child Components */}
//                   <div className="component-list">
//                     {validComponents.map((component, index) => {
//                       const quantity = componentQuantities[groupName]?.[component] || 0;
//                       const colorIndex = index % 5;

//                       return (
//                         <div
//                           className={`component-item ${quantity > 0 ? "component-item-selected" : ""}`}
//                           key={`${groupName}-${component}`}
//                         >
//                           {/* Number */}
//                           <span className={`component-number component-index-${colorIndex}`}>
//                             {index + 1}
//                           </span>

//                           {/* Name */}
//                           <span className="component-name" title={component}>
//                             {component}
//                           </span>

//                           {/* Quantity */}
//                           {renderQuantityControl(groupName, component)}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </>
//       )}

//       {/* SINGLE COMPONENTS */}
//       {singleComponents.length > 0 && (
//         <>
//           <div className="section-header">Single Components</div>
//           <div className="groups-grid">
//             {singleComponents.map((component, index) => {
//               const quantity = componentQuantities.SingleComponents?.[component] || 0;
//               const colorIndex = index % 5;

//               return (
//                 <div className="component-group single-component-group" key={component}>
//                   <div className="component-list">
//                     <div className={`component-item ${quantity > 0 ? "component-item-selected" : ""}`}>
//                       {/* Number */}
//                       <span className={`component-number component-index-${colorIndex}`}>
//                         {index + 1}
//                       </span>

//                       {/* Name */}
//                       <span className="component-name" title={component}>
//                         {component}
//                       </span>

//                       {/* Quantity */}
//                       {renderQuantityControl("SingleComponents", component)}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </>
//       )}

//       {/* FINAL SAVE BUTTON */}
//       <div className="save-container">
//         <button
//           type="button"
//           className={`save-button ${isSaved ? "save-button-saved" : ""}`}
//           onClick={handleSave}
//           disabled={isSaving || isSaved}
//         >
//           {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
//         </button>
//       </div>
//     </div>
//   );
// };

import React, { useEffect, useRef, useState } from "react";
import { PRODUCT_COMPONENT_CONFIG } from "./productComponentConfig";

const getProductComponentConfig = (productName) => {
  return PRODUCT_COMPONENT_CONFIG.Products[productName] || null;
};

export const ProductComponents = ({
  productName,
  initialData,
  onSelectionChange
}) => {
  const selectedProduct = productName || "IP";
  const productConfig = getProductComponentConfig(selectedProduct);

  const [latestChange, setLatestChange] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [componentQuantities, setComponentQuantities] = useState({});

  const autoSaveTimer = useRef(null);
  const isInitialized = useRef(false);
  const hasUserChanged = useRef(false);

  if (!productConfig) {
    return (
      <div>
        No component configuration found for {selectedProduct}
      </div>
    );
  }

  const groupsOfComponents =
    productConfig.GroupsOfComponents && typeof productConfig.GroupsOfComponents === "object"
      ? Object.entries(productConfig.GroupsOfComponents).filter(
        ([, components]) => Array.isArray(components) && components.length > 0
      )
      : [];

  const singleComponents = Array.isArray(productConfig.SingleComponents)
    ? productConfig.SingleComponents.filter(
      component => typeof component === "string" && component.trim() !== ""
    )
    : [];

  useEffect(() => {
    if (hasUserChanged.current) {
      return;
    }

    const initialQuantities = {};

    // ==================================================
    // Groups
    // ==================================================
    groupsOfComponents.forEach(
      ([groupName, components]) => {
        initialQuantities[groupName] = {};

        components.forEach(component => {
          const savedValue =
            initialData
              ?.GroupsOfComponents
              ?.[groupName]
              ?.components
            ?.[component];

          initialQuantities[groupName][component] = Number(savedValue ?? 0);
        });
      }
    );

    // ==================================================
    // Single Components
    // ==================================================
    initialQuantities.SingleComponents = {};

    singleComponents.forEach(component => {
      const savedValue =
        initialData
          ?.SingleComponents
        ?.[component];

      initialQuantities.SingleComponents[component] = Number(savedValue ?? 0);
    });

    // ==================================================
    // Set initial values
    // ==================================================
    setComponentQuantities(initialQuantities);

    // ==================================================
    // Initial state is saved
    // ==================================================
    setIsSaved(true);

    // ==================================================
    // No latest change
    // ==================================================
    setLatestChange(null);

    // ==================================================
    // Mark initialized
    // ==================================================
    isInitialized.current = true;

  }, [selectedProduct]);

  // ==================================================
  // Handle Product Change
  //
  // When user changes product, allow the new product's
  // initialData to initialize.
  // ==================================================
  useEffect(() => {
    hasUserChanged.current = false;
    isInitialized.current = false;

    // ==================================================
    // Clear auto save timer
    // ==================================================
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }

  }, [selectedProduct]);

  // ==================================================
  // Initialize initialData when it becomes available
  //
  // Only happens if user hasn't edited anything.
  // ==================================================
  useEffect(() => {
    if (isInitialized.current) {
      return;
    }

    if (hasUserChanged.current) {
      return;
    }

    const initialQuantities = {};

    // ==================================================
    // Groups
    // ==================================================
    groupsOfComponents.forEach(
      ([groupName, components]) => {
        initialQuantities[groupName] = {};

        components.forEach(component => {
          const savedValue =
            initialData
              ?.GroupsOfComponents
              ?.[groupName]
              ?.components
            ?.[component];

          initialQuantities[groupName][component] = Number(savedValue ?? 0);
        });
      }
    );

    // ==================================================
    // Single Components
    // ==================================================
    initialQuantities.SingleComponents = {};

    singleComponents.forEach(component => {
      const savedValue =
        initialData
          ?.SingleComponents
        ?.[component];

      initialQuantities.SingleComponents[component] = Number(savedValue ?? 0);
    });

    setComponentQuantities(initialQuantities);
    setLatestChange(null);
    setIsSaved(true);
    isInitialized.current = true;

  }, [
    initialData,
    groupsOfComponents,
    singleComponents
  ]);

  // ==================================================
  // Mark Component As Changed
  // ==================================================
  const markAsChanged = (
    groupName,
    componentName,
    newValue
  ) => {
    // ==================================================
    // IMPORTANT:
    // From this point onwards, local values are the
    // source of truth.
    // ==================================================
    hasUserChanged.current = true;

    // ==================================================
    // Button becomes BLUE / Save
    // ==================================================
    setIsSaved(false);

    // ==================================================
    // Remember latest change
    // ==================================================
    setLatestChange({
      type: groupName === "SingleComponents" ? "SINGLE" : "GROUP",
      parent: groupName === "SingleComponents" ? null : groupName,
      component: componentName,
      componentValue: newValue
    });
  };

  // ==================================================
  // Increase Component Quantity
  // ==================================================
  const incrementComponent = (
    groupName,
    componentName
  ) => {
    setComponentQuantities(previous => {
      const currentValue = previous[groupName]?.[componentName] || 0;
      const newValue = currentValue + 1;

      // ==================================================
      // Mark as changed
      // ==================================================
      markAsChanged(groupName, componentName, newValue);

      return {
        ...previous,
        [groupName]: {
          ...previous[groupName],
          [componentName]: newValue
        }
      };
    });
  };

  // ==================================================
  // Decrease Component Quantity
  //
  // Minimum = 0
  // ==================================================
  const decrementComponent = (
    groupName,
    componentName
  ) => {
    setComponentQuantities(previous => {
      const currentValue = previous[groupName]?.[componentName] || 0;
      const newValue = Math.max(0, currentValue - 1);

      // ==================================================
      // Mark as changed
      // ==================================================
      markAsChanged(groupName, componentName, newValue);

      return {
        ...previous,
        [groupName]: {
          ...previous[groupName],
          [componentName]: newValue
        }
      };
    });
  };

  // ==================================================
  // Set Quantity Directly
  // ==================================================
  const setComponentValue = (
    groupName,
    componentName,
    value
  ) => {
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue)
      ? Math.max(0, Math.floor(numericValue))
      : 0;

    setComponentQuantities(previous => {
      // ==================================================
      // Mark as changed
      // ==================================================
      markAsChanged(groupName, componentName, safeValue);

      return {
        ...previous,
        [groupName]: {
          ...previous[groupName],
          [componentName]: safeValue
        }
      };
    });
  };

  // ==================================================
  // Calculate Parent Total
  // ==================================================
  const getGroupTotal = (groupName) => {
    const group = componentQuantities[groupName] || {};
    return Object.values(group).reduce(
      (total, value) => total + (Number(value) || 0),
      0
    );
  };

  // ==================================================
  // Build Final JSON
  // ==================================================
  const buildFinalJson = () => {
    const finalGroups = {};

    // ==================================================
    // Build ALL Groups
    // ==================================================
    groupsOfComponents.forEach(
      ([groupName, components]) => {
        const componentValues = {};
        let groupTotal = 0;

        components.forEach(component => {
          const value = Number(
            componentQuantities?.[groupName]?.[component] || 0
          );

          componentValues[component] = value;
          groupTotal += value;
        });

        finalGroups[groupName] = {
          total: groupTotal,
          components: componentValues
        };
      }
    );

    // ==================================================
    // Build Single Components
    // ==================================================
    const finalSingleComponents = {};

    singleComponents.forEach(component => {
      finalSingleComponents[component] = Number(
        componentQuantities?.SingleComponents?.[component] || 0
      );
    });

    // ==================================================
    // Build Latest Change
    // ==================================================
    let latest = null;

    if (latestChange) {
      // ==================================================
      // GROUP
      // ==================================================
      if (latestChange.type === "GROUP") {
        const parentData = finalGroups[latestChange.parent];
        const componentValue = parentData?.components?.[latestChange.component] || 0;

        latest = {
          type: "GROUP",
          parent: latestChange.parent,
          component: latestChange.component,
          componentValue: componentValue,
          parentTotal: parentData?.total || 0
        };
      }

      // ==================================================
      // SINGLE
      // ==================================================
      if (latestChange.type === "SINGLE") {
        latest = {
          type: "SINGLE",
          component: latestChange.component,
          componentValue: finalSingleComponents[latestChange.component] || 0
        };
      }
    }

    // ==================================================
    // FINAL JSON
    // ==================================================
    return {
      product: selectedProduct,
      GroupsOfComponents: finalGroups,
      SingleComponents: finalSingleComponents,
      latest: latest
    };
  };

  // ==================================================
  // SAVE
  //
  // Used by:
  //
  // 1. Manual Save
  // 2. Automatic Save
  // ==================================================
  const handleSave = () => {
    // ==================================================
    // Don't save while another save is running
    // ==================================================
    if (isSaving) {
      return;
    }

    // ==================================================
    // Cancel pending auto-save timer
    // ==================================================
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }

    setIsSaving(true);

    try {
      // ==================================================
      // Build JSON from CURRENT LOCAL STATE
      //
      // IMPORTANT:
      //
      // This uses componentQuantities.
      //
      // It does NOT use initialData.
      // ==================================================
      const finalJson = buildFinalJson();

      // ==================================================
      // Send to parent
      // ==================================================
      if (onSelectionChange) {
        onSelectionChange(finalJson);
      }

      // ==================================================
      // Mark saved
      // ==================================================
      setIsSaved(true);

      // ==================================================
      // IMPORTANT:
      //
      // DO NOT reset:
      //
      // componentQuantities
      //
      // The current user values stay on screen.
      // ==================================================
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, 300);
    }
  };

  // ==================================================
  // AUTO SAVE
  //
  // Save automatically after 3 seconds of inactivity.
  // ==================================================
  useEffect(() => {
    // ==================================================
    // No unsaved changes
    // ==================================================
    if (isSaved || !latestChange) {
      return;
    }

    // ==================================================
    // Clear old timer
    // ==================================================
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // ==================================================
    // Start new 3-second timer
    // ==================================================
    autoSaveTimer.current = setTimeout(() => {
      handleSave();
    }, 1500);

    // ==================================================
    // Cleanup
    // ==================================================
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [latestChange, isSaved]);

  // ==================================================
  // Component Unmount Cleanup
  // ==================================================
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, []);

  // ==================================================
  // CSS (UPDATED FOR VERTICAL LAYOUT & LARGER FONTS)
  // ==================================================
  const styles = `
        .product-components {
            width: 100%;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 14px;
            color: #172b4d;
        }

        /* Product Header */
        .product-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 40px;
            padding: 0 12px;
            margin-bottom: 12px;
            background: #f4f5f7;
            border: 1px solid #dfe1e6;
            border-radius: 4px;
        }

        .product-title {
            font-size: 16px;
            font-weight: 600;
            color: #172b4d;
        }

        /* Section Header */
        .section-header {
            display: flex;
            align-items: center;
            height: 30px;
            margin-top: 10px;
            margin-bottom: 8px;
            padding: 0 10px;
            background: #f4f5f7;
            border: 1px solid #dfe1e6;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            color: #42526e;
        }

        /* Groups Grid - Now forced vertically */
        .groups-grid {
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
        }

        /* Component Group */
        .component-group {
            min-width: 0;
            border: 1px solid #dfe1e6;
            border-radius: 4px;
            overflow: hidden;
            background: #ffffff;
        }

        /* Group Header */
        .group-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 35px;
            padding: 5px 12px;
            background: #fafbfc;
            border-bottom: 1px solid #dfe1e6;
            font-size: 14px;
            font-weight: 600;
            color: #42526e;
            line-height: 18px;
        }

        .group-title {
            flex: 1;
        }

        /* Parent Total */
        .group-total {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            height: 24px;
            padding: 0 10px;
            margin-left: 10px;
            border-radius: 12px;
            background: #deebff;
            color: #0747a6;
            font-size: 12px;
            font-weight: 700;
        }

        /* Component List */
        .component-list {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        /* Component Row */
        .component-item {
            display: flex;
            align-items: center;
            min-height: 40px;
            padding: 6px 12px;
            border-bottom: 1px solid #ebecf0;
            gap: 10px;
            font-size: 14px;
        }

        .component-item:last-child {
            border-bottom: none;
        }

        /* Component Number */
        .component-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 24px;
            flex-shrink: 0;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        /* Component Name */
        .component-name {
            flex: 1;
            min-width: 0;
            line-height: 18px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Index Colors */
        .component-index-0 { background: #deebff; color: #0747a6; }
        .component-index-1 { background: #e3fcef; color: #006644; }
        .component-index-2 { background: #ffebe6; color: #bf2600; }
        .component-index-3 { background: #eae6ff; color: #403294; }
        .component-index-4 { background: #fff0b3; color: #7a5c00; }

        /* Quantity Controls */
        .quantity-control {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            flex-shrink: 0;
        }

        .quantity-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border: 1px solid #c1c7d0;
            border-radius: 4px;
            background: #ffffff;
            color: #172b4d;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            line-height: 1;
        }

        .quantity-button:hover { background: #f4f5f7; }
        .quantity-button:active { background: #ebecf0; }
        .quantity-button:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Quantity Input */
        .quantity-input {
            width: 50px;
            height: 28px;
            padding: 0 5px;
            border: 1px solid #c1c7d0;
            border-radius: 4px;
            text-align: center;
            font-size: 14px;
            font-weight: 600;
            color: #172b4d;
            outline: none;
        }

        .quantity-input:focus { border-color: #4c9aff; }

        /* Remove browser number arrows */
        .quantity-input::-webkit-inner-spin-button,
        .quantity-input::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        .quantity-input[type=number] { -moz-appearance: textfield; }

        /* Selected Row */
        .component-item-selected { background: #f0f7ff; }
        .component-item-selected .component-name { font-weight: 600; color: #0747a6; }

        /* Single Component */
        .single-component-group { min-width: 250px; }

        /* SAVE SECTION */
        .save-container {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #dfe1e6;
        }

        /* SAVE BUTTON */
        .save-button {
            min-width: 90px;
            height: 36px;
            padding: 0 18px;
            border: none;
            border-radius: 4px;
            background: #0052cc;
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }

        .save-button:hover { background: #0747a6; }
        .save-button:active { background: #003b95; }
        .save-button:disabled { opacity: 0.6; cursor: not-allowed; }

        /* SAVED BUTTON */
        .save-button-saved {
            background: #dfe1e6;
            color: #6b778c;
            cursor: not-allowed;
            opacity: 1;
        }

        .save-button-saved:hover { background: #dfe1e6; }
    `;

  // ==================================================
  // Render Child Quantity Control
  // ==================================================
  const renderQuantityControl = (groupName, componentName) => {
    const quantity = componentQuantities[groupName]?.[componentName] || 0;

    return (
      <div className="quantity-control">
        {/* Decrement */}
        <button
          type="button"
          className="quantity-button"
          onClick={() => decrementComponent(groupName, componentName)}
          disabled={quantity === 0}
        >
          −
        </button>

        {/* Direct Input */}
        <input
          type="number"
          min="0"
          className="quantity-input"
          value={quantity}
          onChange={(event) =>
            setComponentValue(groupName, componentName, event.target.value)
          }
        />

        {/* Increment */}
        <button
          type="button"
          className="quantity-button"
          onClick={() => incrementComponent(groupName, componentName)}
        >
          +
        </button>
      </div>
    );
  };

  // ==================================================
  // Render
  // ==================================================
  return (
    <div className="product-components">
      <style>{styles}</style>

      {/* Product Header */}
      <div className="product-header">
        <span className="product-title">{selectedProduct}</span>
      </div>

      {/* GROUPS OF COMPONENTS */}
      {groupsOfComponents.length > 0 && (
        <>
          <div className="section-header">Groups Of Components</div>
          <div className="groups-grid">
            {groupsOfComponents.map(([groupName, components]) => {
              // Remove empty values
              const validComponents = components.filter(
                component => typeof component === "string" && component.trim() !== ""
              );

              if (validComponents.length === 0) {
                return null;
              }

              // Parent Total
              const groupTotal = getGroupTotal(groupName);

              return (
                <div className="component-group" key={groupName}>
                  {/* Parent Header */}
                  <div className="group-header">
                    <span className="group-title">{groupName}</span>
                    <span className="group-total">Total: {groupTotal}</span>
                  </div>

                  {/* Child Components */}
                  <div className="component-list">
                    {validComponents.map((component, index) => {
                      const quantity = componentQuantities[groupName]?.[component] || 0;
                      const colorIndex = index % 5;

                      return (
                        <div
                          className={`component-item ${quantity > 0 ? "component-item-selected" : ""}`}
                          key={`${groupName}-${component}`}
                        >
                          {/* Number */}
                          <span className={`component-number component-index-${colorIndex}`}>
                            {index + 1}
                          </span>

                          {/* Name */}
                          <span className="component-name" title={component}>
                            {component}
                          </span>

                          {/* Quantity */}
                          {renderQuantityControl(groupName, component)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* SINGLE COMPONENTS */}
      {singleComponents.length > 0 && (
        <>
          <div className="section-header">Single Components</div>
          <div className="groups-grid">
            {singleComponents.map((component, index) => {
              const quantity = componentQuantities.SingleComponents?.[component] || 0;
              const colorIndex = index % 5;

              return (
                <div className="component-group single-component-group" key={component}>
                  <div className="component-list">
                    <div className={`component-item ${quantity > 0 ? "component-item-selected" : ""}`}>
                      {/* Number */}
                      <span className={`component-number component-index-${colorIndex}`}>
                        {index + 1}
                      </span>

                      {/* Name */}
                      <span className="component-name" title={component}>
                        {component}
                      </span>

                      {/* Quantity */}
                      {renderQuantityControl("SingleComponents", component)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* FINAL SAVE BUTTON */}
      <div className="save-container">
        <button
          type="button"
          className={`save-button ${isSaved ? "save-button-saved" : ""}`}
          onClick={handleSave}
          disabled={isSaving || isSaved}
        >
          {isSaving ? "Updating..." : isSaved ? "Updated" : "Update"}
        </button>
      </div>
    </div>
  );
};