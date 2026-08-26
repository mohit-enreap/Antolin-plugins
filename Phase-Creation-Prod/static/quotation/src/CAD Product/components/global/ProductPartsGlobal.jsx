// // import { useMemo, useState } from "react";

// // const IGNORE_KEYS = [
// //   "extraWorkLoop",
// //   "reWorkLoop",
// //   "standardLoop",
// //   "checked",
// //   "order",
// //   "noOfLoops",
// //   "Proto",
// //   "Serie",
// // ];

// // const ProductPartsGlobal = ({ data, onChange }) => {
// //   // 🔹 Extract products dynamically
// //   const products = useMemo(() => {
// //     const set = new Set();

// //     Object.values(data?.activities || {}).forEach((activity) => {
// //       Object.keys(activity).forEach((key) => {
// //         if (!IGNORE_KEYS.includes(key)) {
// //           set.add(key);
// //         }
// //       });
// //     });

// //     return Array.from(set);
// //   }, [data]);

// //   // 🔹 Global product state
// //   const [productConfig, setProductConfig] = useState(() =>
// //     products.reduce((acc, p) => {
// //       acc[p] = { include: true, components: 1 };
// //       return acc;
// //     }, {})
// //   );

// //   const updateProduct = (product, field, value) => {
// //     const updated = {
// //       ...productConfig,
// //       [product]: {
// //         ...productConfig[product],
// //         [field]: value,
// //       },
// //     };

// //     setProductConfig(updated);
// //     onChange?.(updated); // send to parent
// //   };

// //   return (
// //     <div>
// //       <h3>Products Part (Top)</h3>

// //       <table border="1" width="100%">
// //         <thead>
// //           <tr>
// //             <th>Product</th>
// //             <th>Include (Yes / No)</th>
// //             <th>Components</th>
// //           </tr>
// //         </thead>

// //         <tbody>
// //           {products.map((product) => (
// //             <tr key={product}>
// //               <td>{product}</td>

// //               <td>
// //                 <select
// //                   value={productConfig[product]?.include ? "Yes" : "No"}
// //                   onChange={(e) =>
// //                     updateProduct(product, "include", e.target.value === "Yes")
// //                   }
// //                 >
// //                   <option>Yes</option>
// //                   <option>No</option>
// //                 </select>
// //               </td>

// //               <td>
// //                 <input
// //                   type="number"
// //                   min="1"
// //                   value={productConfig[product]?.components}
// //                   onChange={(e) =>
// //                     updateProduct(product, "components", Number(e.target.value))
// //                   }
// //                 />
// //               </td>
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   );
// // };

// // export default ProductPartsGlobal;

// import { useMemo, useState, useEffect } from "react";

// const IGNORE_KEYS = [
//   "extraWorkLoop",
//   "reWorkLoop",
//   "standardLoop",
//   "checked",
//   "order",
//   "noOfLoops",
//   "Proto",
//   "Serie",
// ];

// export default function ProductPartsGlobal({ data, applyGlobalChange }) {
//   /* --------------------------------
//      Extract product names
//   -------------------------------- */
//   const products = useMemo(() => {
//     const set = new Set();

//     Object.values(data?.activities || {}).forEach((activity) => {
//       Object.keys(activity).forEach((key) => {
//         if (!IGNORE_KEYS.includes(key)) set.add(key);
//       });
//     });

//     return Array.from(set);
//   }, [data]);

//   /* --------------------------------
//      UI State only
//   -------------------------------- */
//   const [config, setConfig] = useState({});

//   /* Init once */
//   useEffect(() => {
//     const init = {};
//     products.forEach((p) => {
//       init[p] = {
//         componentSelected: false,
//         noOfComponent: 1,
//       };
//     });
//     setConfig(init);
//   }, [products]);

//   /* --------------------------------
//      Handlers
//   -------------------------------- */
//   function update(product, key, value) {
//     const next = {
//       ...config,
//       [product]: {
//         ...config[product],
//         [key]: value,
//       },
//     };

//     setConfig(next);

//     // 🔥 SINGLE CALL TO PARENT
//     applyGlobalChange({
//       product,
//       key,
//       value,
//     });
//   }

//   /* --------------------------------
//      UI
//   -------------------------------- */
//   return (
//     <div>
//       <h3>Global Product Configuration</h3>

//       <table border="1" width="100%">
//         <thead>
//           <tr>
//             <th>Product</th>
//             <th>Include</th>
//             <th>No of Components</th>
//           </tr>
//         </thead>

//         <tbody>
//           {products.map((p) => (
//             <tr key={p}>
//               <td>{p}</td>

//               <td>
//                 <select
//                   value={config[p]?.componentSelected ? "Yes" : "No"}
//                   onChange={(e) =>
//                     update(p, "componentSelected", e.target.value === "Yes")
//                   }
//                 >
//                   <option>Yes</option>
//                   <option>No</option>
//                 </select>
//               </td>

//               <td>
//                 <input
//                   type="number"
//                   min="1"
//                   value={config[p]?.noOfComponent || 1}
//                   onChange={(e) =>
//                     update(p, "noOfComponent", Number(e.target.value))
//                   }
//                 />
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

import { useMemo, useState, useEffect } from "react";

const IGNORE_KEYS = [
  "extraWorkLoop",
  "reWorkLoop",
  "standardLoop",
  "checked",
  "order",
  "noOfLoops",
  "Proto",
  "Serie",
  "FRONT & REAR ASSEMBLY", // For Door Panel (Geometrical Study) hiding
  "ADD ON COMPONENTS", // This For Hiding the "ADD ON COMPONENTS" from Normal Product Table . becauase we defines sepeate table for Add on Components
];

export default function ProductPartsGlobal({ data, applyGlobalChange }) {
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

  /* Initialize UI state */
  useEffect(() => {
    // If there are no products, there is nothing to initialize
    if (!products.length) {
      return;
    }

    // Update UI state based on saved JSON data
    setProductUI((previousUIState) => {
      // Start by copying the existing UI state
      const updatedUIState = { ...previousUIState };

      // Loop through each detected product
      products.forEach((productName) => {
        /*
        STEP 1: Find saved data for this product
 
        data.activities structure looks like:
        {
          activity1: {
            "Door Panel": { componentSelected: true, noOfComponent: 3 }
          },
          activity2: {
            "Bumper": { componentSelected: false, noOfComponent: 1 }
          }
        }
 
        We:
        - Take all activity objects
        - Find the one that contains the current product
        - Extract that product's saved config
      */
        const savedProductConfig = Object.values(data?.activities || {}).find(
          (activity) => activity?.[productName],
        )?.[productName];

        /*
        STEP 2: Initialize / overwrite UI state for this product
 
        - If saved data exists → use it
        - Otherwise → use safe defaults
      */
        updatedUIState[productName] = {
          componentSelected: savedProductConfig?.componentSelected ?? false,
          noOfComponent: savedProductConfig?.noOfComponent ?? 1,
        };
      });

      // Return the fully prepared UI state
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

    // 🔥 SINGLE SOURCE OF TRUTH
    applyGlobalChange({ product, key, value });
  }

  /* --------------------------------
     UI
  -------------------------------- */
  return (
    <div>
      <h3>3D Component Configuration</h3>
    
      {/* <table border="1" width="100%">
        <thead>
          <tr>
            <th>Product</th>
            <th>Include</th>
            <th>No of Components</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product}>
              <td>{product}</td>

              <td>
                <select
                  value={productUI[product]?.componentSelected ? "Yes" : "No"}
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
            {products.map((product) => (
              <tr key={product}>
                <td>{product}</td>

                <td>
                  <select
                    value={productUI[product]?.componentSelected ? "Yes" : "No"}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
