import React, { useMemo, useState, useEffect } from "react";
import { PRODUCT_COMPONENT_CONFIG } from "../../data/ComponentGrouping/productComponentConfig.js";

const IGNORE_KEYS = [
  "extraWorkLoop", "reWorkLoop", "standardLoop", "checked",
  "order", "noOfLoops", "Proto", "Serie", "FRONT & REAR ASSEMBLY", "ADD ON COMPONENTS", "IP ASSEMBLY", "CENTER CONSOLE ASSEMBLY", "ALL (Stack Up Tolerances)"
];

export default function UnifiedProductTable({ 
  data, 
  productName, 
  applyGlobalChange, 
  dataForGroup, 
  onGroupDataChange 
}) {
  console.log("=== [UnifiedProductTable] Render Triggered ===");
  console.log("[UnifiedProductTable] Props -> productName:", productName);
  console.log("[UnifiedProductTable] Props -> dataForGroup:", dataForGroup);

  // 1. Extract dynamic product list from JSON
  const products = useMemo(() => {
    const result = new Set();
    Object.values(data?.activities || {}).forEach((activity) => {
      Object.keys(activity).forEach((key) => {
        if (!IGNORE_KEYS.includes(key)) {
          result.add(key);
        }
      });
    });
    const finalProducts = Array.from(result);
    console.log("[UnifiedProductTable] Parsed dynamic products list:", finalProducts);
    return finalProducts;
  }, [data]);

  // Fetch static config for the globally selected product
  const productConfig = PRODUCT_COMPONENT_CONFIG.Products[productName] || null;
  console.log(`[UnifiedProductTable] Static config loaded for '${productName}':`, productConfig);

  // 2. UI-only state
  const [productUI, setProductUI] = useState({});

  // 3. Initialize UI state
  useEffect(() => {
    if (!products.length) return;
    
    console.log("[UnifiedProductTable] --- Initializing/Updating productUI state ---");

    setProductUI((prev) => {
      const updated = { ...prev };

      products.forEach((prodName) => {
        const savedConfig = Object.values(data?.activities || {}).find(
          (activity) => activity?.[prodName]
        )?.[prodName];

        let initSelected = savedConfig?.componentSelected ?? false;
        let initNoOfComponent = savedConfig?.noOfComponent ?? 0;

        // Sanitize legacy data
        if (initSelected === false) {
          initNoOfComponent = 0;
        } else if (initSelected === true && initNoOfComponent === 0) {
          initNoOfComponent = 1;
        }

        let initSubComponents = prev[prodName]?.subComponents || {};
        
        // Read from the specific group matching this row's name
        if (dataForGroup?.GroupsOfComponents?.[prodName]?.components) {
          initSubComponents = { ...initSubComponents, ...dataForGroup.GroupsOfComponents[prodName].components };
        }

        updated[prodName] = {
          componentSelected: initSelected,
          noOfComponent: initNoOfComponent,
          subComponents: initSubComponents 
        };
      });
      
      console.log("[UnifiedProductTable] Final built UI State:", updated);
      return updated;
    });
  }, [products, data, productName, dataForGroup]);

  // 4. Handle Standard Change
  const handleStandardChange = (product, newQuantity) => {
    console.log(`[UnifiedProductTable] handleStandardChange -> product: ${product}, newQty: ${newQuantity}`);
    const safeQty = Math.max(0, newQuantity);
    const isSelected = safeQty > 0;

    setProductUI((prev) => ({
      ...prev,
      [product]: {
        ...prev[product],
        noOfComponent: safeQty,
        componentSelected: isSelected,
      },
    }));

    // Fire updates to backend
    applyGlobalChange({ product, key: "componentSelected", value: isSelected });
    applyGlobalChange({ product, key: "noOfComponent", value: safeQty });
  };

  // 5. Handle Grouped Sub-component Change
  const handleSubComponentChange = (parentProduct, subComponentName, changeAmount) => {
    console.log(`[UnifiedProductTable] handleSubComponentChange -> parent: ${parentProduct}, sub: ${subComponentName}, amount: ${changeAmount}`);
    
    setProductUI((prev) => {
      const parentState = prev[parentProduct] || { subComponents: {} };
      const currentSubQty = parentState.subComponents[subComponentName] || 0;
      const newSubQty = Math.max(0, currentSubQty + changeAmount);

      const newSubComponents = {
        ...parentState.subComponents,
        [subComponentName]: newSubQty,
      };

      // Calculate new parent total
      const newTotal = Object.values(newSubComponents).reduce((sum, val) => sum + val, 0);
      const isSelected = newTotal > 0;
      
      console.log(`[UnifiedProductTable] Calculated new total for ${parentProduct}:`, newTotal);

      // Push calculated total and selection state to the backend hook
      applyGlobalChange({ product: parentProduct, key: "noOfComponent", value: newTotal });
      applyGlobalChange({ product: parentProduct, key: "componentSelected", value: isSelected });

      // Build and export the dataForGroup JSON for CADCalculator to save
      if (productConfig?.GroupsOfComponents) {
        const finalGroups = {};
        
        Object.entries(productConfig.GroupsOfComponents).forEach(([gName, subList]) => {
          let gTotal = 0;
          const gComps = {};
          
          // Use the newly updated state for the active group, and existing state for others
          const currentSubState = gName === parentProduct ? newSubComponents : (prev[gName]?.subComponents || {});
          
          subList.forEach((sub) => {
            const val = currentSubState[sub] || 0;
            gComps[sub] = val;
            gTotal += val;
          });
          
          finalGroups[gName] = { total: gTotal, components: gComps };
        });

        const payload = {
          product: productName,
          GroupsOfComponents: finalGroups,
          SingleComponents: {} 
        };
        
        console.log("[UnifiedProductTable] Exporting grouped data payload to parent:", payload);

        // Bubble up the structured group data
        if (onGroupDataChange) {
           onGroupDataChange(payload);
        }
      }

      return {
        ...prev,
        [parentProduct]: {
          ...parentState,
          noOfComponent: newTotal,
          componentSelected: isSelected,
          subComponents: newSubComponents,
        },
      };
    });
  };

  // ==================================================
  // CSS Styles
  // ==================================================
  const styles = `
    .unified-table-container {
      width: 100%;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      color: #172b4d;
    }
    .config-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #dfe1e6;
    }
    .config-table th {
      background: #f4f5f7;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      color: #42526e;
      border-bottom: 2px solid #dfe1e6;
    }
    .config-table td {
      padding: 10px;
      border-bottom: 1px solid #ebecf0;
      vertical-align: middle;
    }
    .main-row {
      background: #ffffff;
    }
    .main-row.grouped-row {
      background: #fafbfc;
      font-weight: 450;
    }
    .sub-row td:first-child {
      padding-left: 30px;
      color: #5e6c84;
      font-size: 13px;
    }
    .sub-row {
      background: #ffffff;
    }
    .quantity-control {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .quantity-button {
      width: 28px;
      height: 28px;
      border: 1px solid #c1c7d0;
      border-radius: 4px;
      background: #ffffff;
      color: #172b4d;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .quantity-button:hover { background: #f4f5f7; }
    .quantity-button:disabled { opacity: 0.45; cursor: not-allowed; }
    .quantity-input {
      width: 50px;
      height: 28px;
      text-align: center;
      border: 1px solid #c1c7d0;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
    }
    .status-badge {
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-yes { background: #e3fcef; color: #006644; }
    .status-no { background: #ffebe6; color: #bf2600; }
  `;

  return (
    <div className="unified-table-container">
      <style>{styles}</style>
      <h3 style={{ marginBottom: "15px" }}>3D Component Configuration</h3>

      <table className="config-table">
        <thead>
          <tr>
            <th>Product / Component</th>
            <th>Included</th>
            <th>No of Components</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const subComponentsList = productConfig?.GroupsOfComponents?.[product];
            const hasGroups = Boolean(subComponentsList && subComponentsList.length > 0);
            const uiState = productUI[product] || {};

            // Logging render checks (uncomment if you need ultra-verbose logs during render)
            // console.log(`[UnifiedProductTable] Rendering row: ${product} | hasGroups: ${hasGroups}`, subComponentsList);

            return (
              <React.Fragment key={product}>
                {/* --- MAIN PRODUCT ROW --- */}
                <tr className={`main-row ${hasGroups ? "grouped-row" : ""}`}>
                  <td>{product}</td>
                  <td>
                    <span className={`status-badge ${uiState.componentSelected ? "status-yes" : "status-no"}`}>
                      {uiState.componentSelected ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    {hasGroups ? (
                      <span><strong>{uiState.noOfComponent || 0}</strong> (Combined)</span>
                    ) : (
                      <div className="quantity-control">
                        <button 
                          className="quantity-button" 
                          onClick={() => handleStandardChange(product, (uiState.noOfComponent || 0) - 1)}
                          disabled={(uiState.noOfComponent || 0) === 0}
                        >−</button>
                        <input
                          type="number"
                          min="0"
                          className="quantity-input"
                          value={uiState.noOfComponent || 0}
                          onChange={(e) => handleStandardChange(product, Number(e.target.value))}
                        />
                        <button 
                          className="quantity-button" 
                          onClick={() => handleStandardChange(product, (uiState.noOfComponent || 0) + 1)}
                        >+</button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* --- SUB-COMPONENT ROWS --- */}
                {hasGroups && subComponentsList.map((sub, index) => {
                  const subQty = uiState.subComponents?.[sub] || 0;
                  return (
                    <tr className="sub-row" key={`${product}-${sub}-${index}`}>
                      <td>↳ {sub}</td>
                      <td>-</td>
                      <td>
                        <div className="quantity-control">
                          <button 
                            className="quantity-button" 
                            onClick={() => handleSubComponentChange(product, sub, -1)}
                            disabled={subQty === 0}
                          >−</button>
                          <span style={{ width: "50px", textAlign: "center", fontWeight: "600" }}>
                            {subQty}
                          </span>
                          <button 
                            className="quantity-button" 
                            onClick={() => handleSubComponentChange(product, sub, 1)}
                          >+</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}