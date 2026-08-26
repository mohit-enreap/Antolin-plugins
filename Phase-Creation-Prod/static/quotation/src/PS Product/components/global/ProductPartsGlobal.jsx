import React, { useMemo, useState, useEffect } from "react";

const IGNORE_KEYS = [
  "extraWorkLoop",
  "reWorkLoop",
  "standardLoop",
  "checked",
  "order",
  "noOfLoops",
  "Proto",
  "Serie",
];

// 🔹 Added Mapping for Groups
// const PS_SHORTCUT = {
//   "Minimum Radius Analysis (Overhead System)": [
//     "HEADLINER",
//     "SURROUNDING PARTS(GH , CAP'S & READING LAMPS, SPEAKER GRILL)",
//     "GRABHANDLE (2 GRABHANDLE) WITHOUT HEADLINER",
//     "LIGHT FRAMES WITHOUT HEADLINER",
//     "OVERHEAD READING LAMP WITHOUT HEADLINER",
//     "OVERHEAD CONSOLE WITHOUT HEADLINER",
//   ],
//   "Head Impact Test (ECE R21 - Overhead Console)": [
//     "FRAME BUILDING 3D",
//     "DRAWING",
//     "HEAD IMPACT STUDY REPORT PREPARATION",
//   ],
//   "FMVSS201U Headliner Head Impact Test (US Market)": [
//     "FMVSS201U HEADLINER HEAD IMPACT STUDY",
//   ],
// };

export default function ProductPartsGlobal({ data, applyGlobalChange, PS_SHORTCUT }) {
  /* --------------------------------
      Get unique product names
  -------------------------------- */
  const products = useMemo(() => {
    const result = new Set();

    Object.values(data?.activities || {}).forEach((activity) => {
      Object.keys(activity).forEach((key) => {
        if (!IGNORE_KEYS.includes(key)) {
          result.add(key);
        }
      });
    });

    return Array.from(result);
  }, [data]);

  /* --------------------------------
      UI-only state
  -------------------------------- */
  const [productUI, setProductUI] = useState({});

  useEffect(() => {
    if (!products.length) return;

    setProductUI((previousUIState) => {
      const updatedUIState = { ...previousUIState };

      products.forEach((productName) => {
        const savedProductConfig = Object.values(data?.activities || {}).find(
          (activity) => activity?.[productName],
        )?.[productName];

        updatedUIState[productName] = {
          componentSelected: savedProductConfig?.componentSelected ?? false,
          noOfComponent: savedProductConfig?.noOfComponent ?? 1,
        };
      });

      return updatedUIState;
    });
  }, [products, data]);

  /* --------------------------------
      Handle UI change
  -------------------------------- */
  function handleChange(product, key, value) {
    setProductUI((prev) => ({
      ...prev,
      [product]: {
        ...prev[product],
        [key]: value,
      },
    }));

    applyGlobalChange({ product, key, value });
  }

  /* --------------------------------
      UI Render
  -------------------------------- */
  return (
    <div>
      <h3>3D Component Configuration</h3>

      {/* <table border="1" width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th>Product</th>
            <th>Include</th>
            <th>No of Components</th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(PS_SHORTCUT).map(([groupName, groupProducts]) => {
            // Filter products that belong to this specific group
            const itemsInGroup = products.filter((p) =>
              groupProducts.includes(p),
            );

            if (itemsInGroup.length === 0) return null;

            return (
              <React.Fragment key={groupName}>
                
                <tr style={{ backgroundColor: "#e0eefd", fontWeight: "bold" }}>
                  <td colSpan="3" style={{ padding: "8px" }}>
                    {groupName}
                  </td>
                </tr>

              
                {itemsInGroup.map((product) => (
                  <tr key={product}>
                    <td style={{ paddingLeft: "20px" }}>{product}</td>

                    <td>
                      <select
                        value={
                          productUI[product]?.componentSelected ? "Yes" : "No"
                        }
                        onChange={(e) =>
                          handleChange(
                            product,
                            "componentSelected",
                            e.target.value === "Yes",
                          )
                        }
                      >
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        min="1"
                        value={productUI[product]?.noOfComponent || 1}
                        onChange={(e) =>
                          handleChange(
                            product,
                            "noOfComponent",
                            Number(e.target.value),
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}

          
          {products
            .filter((p) => !Object.values(PS_SHORTCUT).flat().includes(p))
            .map((p) => (
              <tr key={p}>
                <td>{p}</td>
                
              </tr>
            ))}
        </tbody>
      </table> */}

      <div className="table-container">
        <table className="config-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Include</th>
              <th>No of Components</th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(PS_SHORTCUT).map(([groupName, groupProducts]) => {
              // Filter products that belong to this specific group
              const itemsInGroup = products.filter((p) =>
                groupProducts.includes(p)
              );

              if (itemsInGroup.length === 0) return null;

              return (
                <React.Fragment key={groupName}>
                  {/* 🔹 Group Header Row */}
                  <tr style={{ backgroundColor: "#e0eefd", fontWeight: "bold" }}>
                    {/* Added standard padding and text-align to match other cells */}
                    <td colSpan="3" style={{ padding: "12px 16px", textAlign: "left" }}>
                      {groupName}
                    </td>
                  </tr>

                  {/* 🔹 Product Rows within Group */}
                  {itemsInGroup.map((product) => (
                    <tr key={product}>
                      {/* Slightly increased padding to indent sub-items */}
                      <td style={{ paddingLeft: "24px" }}>{product}</td>

                      <td>
                        <select
                          value={
                            productUI[product]?.componentSelected ? "Yes" : "No"
                          }
                          onChange={(e) =>
                            handleChange(
                              product,
                              "componentSelected",
                              e.target.value === "Yes"
                            )
                          }
                        >
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                      </td>

                      <td>
                        <input
                          type="number"
                          min="1"
                          value={productUI[product]?.noOfComponent || 1}
                          onChange={(e) =>
                            handleChange(
                              product,
                              "noOfComponent",
                              Number(e.target.value)
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Fallback for products not in the mapping */}
            {products
              .filter((p) => !Object.values(PS_SHORTCUT).flat().includes(p))
              .map((p) => (
                <tr key={p}>
                  <td style={{ paddingLeft: "24px" }}>{p}</td>
                  <td>
                    <select
                      value={productUI[p]?.componentSelected ? "Yes" : "No"}
                      onChange={(e) =>
                        handleChange(
                          p,
                          "componentSelected",
                          e.target.value === "Yes"
                        )
                      }
                    >
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={productUI[p]?.noOfComponent || 1}
                      onChange={(e) =>
                        handleChange(p, "noOfComponent", Number(e.target.value))
                      }
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
