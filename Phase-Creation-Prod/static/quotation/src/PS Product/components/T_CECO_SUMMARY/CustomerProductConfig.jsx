import React, { useEffect, useState } from "react";
import { CUSTOMER_PRODUCT_CONFIG } from "../../data/customerProductConfig";

/**
 * ============================================================================
 * DEFAULT MAPPING (Automation Data)
 * ----------------------------------------------------------------------------
 * CUSTOMER_PRODUCT_CONFIG contains predefined automation rules based on:
 *   - Customer
 *   - Product
 *
 * Structure example (conceptual):
 * {
 *   CustomerA: {
 *     Common: { field: value },
 *     Product1: { field: value },
 *     Product2: { field: value }
 *   }
 * }
 *
 * Common values apply to all products.
 * Product values override Common values.
 * ============================================================================
 */

/**
 * ============================================================================
 * FIELD OPTIONS (User Editable Choices)
 * ----------------------------------------------------------------------------
 * Each key represents a configuration field.
 * Each value is a list of allowed dropdown options for that field.
 *
 * IMPORTANT:
 * - Options are FIELD-SPECIFIC (not shared globally)
 * - Keeps UI flexible and config-driven
 * - Prevents hardcoding dropdown values inside JSX
 * ============================================================================
 */
const FIELD_OPTIONS = {
  //CECO 2D BCC EXT  or  CECO 3D/2D BCC
  // Done as per AUX
  "2D_INT": [
    "-",
    "G.A.Pune (IF)",
    "G.A.Hyderabad",
    "Antolin Mexico",
    "Antolin Tanger (IF)",
    "Guangzhou Antolin",
    "G.A. Suzhou",
    "INTERTRIM",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
  ],

  //CECO 2D BCC EXT or  CECO 3D/2D BCC  (both have same value)
  // Done as per AUX

  "2D_OEM": [
    "-",
    "G.A.Pune (IF)",
    "G.A.Hyderabad",
    "Antolin Mexico",
    "Antolin Tanger (IF)",
    "Guangzhou Antolin",
    "G.A. Suzhou",
    "INTERTRIM",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
  ],

  // Percentage split between HCC and BCC for 3D TDL
  //Done as per Aux
  "3D_TDL (HCC/BCC)": [
    "-",
    "HCC 100%",
    "HCC 90% BCC 10%",
    "HCC 80% BCC 20%",
    "HCC 70% BCC 30%",
    "HCC 60% BCC 40%",
    "HCC 50% BCC 50%",
    "HCC 40% BCC 60%",
    "HCC 30% BCC 70%",
    "HCC 20% BCC 80%",
    "HCC 10% BCC 90%",
  ],

  // Flag indicating whether additional TDL 3/4 is applicable
  "3D_AddTDL34": ["-", "No"],

  // 3D Technical Design Lead ownership locations   :  CECO TDL
  //Done as per Aux
  "3D_TDL": [
    "-",
    "G. A. Ingeniería (IF)",
    "G. A. Besançon",
    "Antolin Czech Republic",
    "G. A. Deutschland",
    "G. A. France",
    "G. A. Japan",
    "G.A.Korea",
    "G. A. North America (IF)",
    "Antolin China Investment",
    "G. A. UK",
    "G. A. Vosges",
    "G.A. Suzhou",
    "G.A.Pune (IF)",
    "G.A.Hyderabad",
    "Antolin Mexico",
    "Antolin Tanger (IF)",
    "Guangzhou Antolin",
    "INTERTRIM",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
  ],

  // Coordination cost responsibility (fixed to BCC)  :CECO 3D COORD
  //Done as per Aux
  "3D_Coord": ["-", "BCC 100%"],

  // 3D Software / BCC responsibility
  //CECO 2D BCC EXT  or  CECO 3D/2D BCC
  // Done as per AUX
  "3D_SW": [
    "-",
    "G.A.Pune (IF)",
    "G.A.Hyderabad",

    "Antolin Mexico",
    "Antolin Tanger (IF)",
    "Guangzhou Antolin",
    "G.A. Suzhou",
    "INTERTRIM",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
  ],

  // Feasibility responsibility options
  // - Done as per Aux
  "3D_Feasib": [
    "-",
    "G. A. Ingeniería (IF)",
    "G.A.Pune (IF)",
    "Antolin Tanger (IF)",
    "INTERTRIM",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
  ],

  // Data Management responsibility split  //CECO Data Mgmt
  // - Done as per Aux
  DM: [
    "-",
    "G.A.Pune (IF)",
    "HCC 10% BCC 90%",
    "HCC 30% BCC 70%",
    "HCC 40% BCC 60%",
    "HCC 20% BCC 80%",
    "G. A. Deutschland",
    "G. A. UK",
    "G. A. North America (IF)",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
    "BCC 100%",
    "HCC 50% BCC 50%",
    "HCC 60% BCC 40%",
    "HCC 70% BCC 30%",
    "HCC 80% BCC 20%",
    "HCC 90% BCC 10%",
    "HCC 100%",
  ],

  // CAE / Optimization / Thermal / PS fields
  // CECO CAE - Done as per Aux
  CAE_TCL: [
    "-",
    "G. A. Ingeniería (IL)",
    "G. A. North America (IL)",
    "G.A.Pune (IL)",
    "Antolin Tanger (IL)",
    "External Engineering HCC (IL)",
  ], // CECO CAE

  // CECO CAE - Done as per Aux
  CAE_SW: [
    "-",
    "G. A. Ingeniería (IL)",
    "G. A. North America (IL)",
    "G.A.Pune (IL)",
    "Antolin Tanger (IL)",
    "External Engineering HCC (IL)",
  ], // CECO CAE

  CAE_Loops: [2, 3, "-"],

  OPT_TCL: ["-", "G.A.Pune (IL)"],
  OPT_SW: ["-", "G.A.Pune (IL)"],
  OPT_MAT: ["-", "G. A. Besançon"],

  //CECO THERMAL- Done as per Aux
  THR_TCL: ["-", "G. A. Ingeniería (IL)", "G.A.Pune (IL)"], //CECO THERMAL

  //CECO PS- Done as per Aux
  PS_PSL: ["-", "G. A. Ingeniería (IL)", "G.A.Pune (IL)"], //CECO PS

  // Tolerance Stack Up ownership
  //CECO Stack Up- Done as AUX
  "3D_StackUp": ["G.A.Hyderabad"],
};

/**
 * ============================================================================
 * VISIBLE_FIELDS
 * ----------------------------------------------------------------------------
 * Controls:
 *   - Which fields appear in the UI
 *   - What label is shown to the user
 *
 * Even if formData contains many fields,
 * ONLY these will be rendered.
 * ============================================================================
 */
const VISIBLE_FIELDS = {
  "3D_TDL": "Cost C. TDL",
  "3D_Coord": "Cost C. Coordination",
  "3D_SW": "Cost C. BCC 3D",
  "2D_INT": "Cost C. BCC 2D",
  "2D_OEM": "Cost C. BCC Customer 2D",
  DM: "Cost C. Data Management",
  "3D_StackUp": "Cost C. Tolerance Stack Up",
  "3D_Feasib": "Cost C. Feasibility",
};

/**
 * ============================================================================
 * COMPONENT: CustomerProductConfig
 * ----------------------------------------------------------------------------
 * Props:
 *   - customerName : selected customer
 *   - productName  : selected product
 *
 * Responsibility:
 *   - Load default automation mapping
 *   - Allow user to override values
 *   - Show only cost-related configuration fields
 *
 * { customerName, productName } we are getting from CAD Via props
 * ============================================================================
 */
// const CustomerProductConfig = ({ customer, product, data, onChange }) => {
//   return (
//     <div>
//       <h3>
//         {customer} | {product}
//       </h3>

//       {Object.entries(VISIBLE_FIELDS).map(([field, label]) => {
//         // Options for this field
//         const options = FIELD_OPTIONS[field] || [];

//         // Current value from data
//         let value = data[field];

//         // If the value is not in options, show default
//         if (!options.includes(value)) {
//           value = "No match option found";
//         }

//         return (
//           <div key={field} style={{ display: "flex", marginBottom: 8 }}>
//             <label style={{ width: 280 }}>{label}</label>

//             <select
//               value={value}
//               onChange={(e) => onChange(field, e.target.value)}
//             >
//               {/* Show default first if value was not in options */}
//               {!options.includes(data[field]) && (
//                 <option value="No match option found">
//                   No match option found
//                 </option>
//               )}

//               {options.map((opt) => (
//                 <option key={opt} value={opt}>
//                   {opt}
//                 </option>
//               ))}
//             </select>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default CustomerProductConfig;

// Group fields into titled sections
const COST_CENTER_SECTIONS = {
  "CAD Cost Centers": {
    "3D_TDL": "Cost C. TDL",
    "3D_Coord": "Cost C. Coordination",
    "3D_SW": "Cost C. BCC 3D",
    "2D_INT": "Cost C. BCC 2D",
    "2D_OEM": "Cost C. BCC Customer 2D",
    DM: "Cost C. Data Management",
    "3D_StackUp": "Cost C. Tolerance Stack Up",
    "3D_Feasib": "Cost C. Feasibility",
    "3D_TDL (HCC/BCC)": "Cost C. TDL (HCC/BCC)",
    // "3D_AddTDL34": "Cost C. Add TDL34",
  },
  "CAE Cost Centers": {
    CAE_TCL: "Cost C. CAE Engineer",
    CAE_SW: "Cost C. CAE Standard Work",
  },
  "PS Cost Center": {
    PS_PSL: "Cost C.P. Safety Standard & leader act.",
  },
  "Thermal Safety Cost Center": {
    THR_TCL: "Cost C. Thermals Activities",
  },
};

const CustomerProductConfig = ({ customer, product, data, onChange }) => {
  return (
    <div>
      <h3>
        {customer} | {product}
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN – FIRST SECTION */}
        <div
          style={{
            border: "1px solid #ddd",
            padding: 8,
            borderRadius: 4,
          }}
        >
          {(() => {
            const [sectionTitle, fields] =
              Object.entries(COST_CENTER_SECTIONS)[0];

            return (
              <>
                <h4 style={{ marginBottom: 6, fontSize: "14px" }}>
                  {sectionTitle}
                </h4>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <tbody>
                    {Object.entries(fields).map(([field, label]) => {
                      const options = FIELD_OPTIONS[field] || [];
                      let value = data[field];

                      if (!options.includes(value)) {
                        value = "No match option found";
                      }

                      return (
                        <tr key={field}>
                          <td
                            style={{
                              border: "1px solid #ccc",
                              padding: "4px 6px",
                              width: "45%",
                            }}
                          >
                            {label}
                          </td>
                          <td
                            style={{
                              border: "1px solid #ccc",
                              padding: "4px 6px",
                            }}
                          >
                            <select
                              value={value}
                              onChange={(e) => onChange(field, e.target.value)}
                              style={{
                                fontSize: "12px",
                                padding: "2px 4px",
                                height: "24px",
                                width: "100%",
                              }}
                            >
                              {!options.includes(data[field]) && (
                                <option value="No match option found">
                                  No match option found
                                </option>
                              )}
                              {options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            );
          })()}
        </div>

        {/* RIGHT COLUMN – REST STACKED */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(COST_CENTER_SECTIONS)
            .slice(1)
            .map(([sectionTitle, fields]) => (
              <div
                key={sectionTitle}
                style={{
                  border: "1px solid #ddd",
                  padding: 8,
                  borderRadius: 4,
                }}
              >
                <h4 style={{ marginBottom: 4, fontSize: "14px" }}>
                  {sectionTitle}
                </h4>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                  }}
                >
                  <tbody>
                    {Object.entries(fields).map(([field, label]) => {
                      const options = FIELD_OPTIONS[field] || [];
                      let value = data[field];

                      if (!options.includes(value)) {
                        value = "No match option found";
                      }

                      return (
                        <tr key={field}>
                          <td
                            style={{
                              border: "1px solid #ccc",
                              padding: "3px 5px",
                              width: "50%",
                            }}
                          >
                            {label}
                          </td>
                          <td
                            style={{
                              border: "1px solid #ccc",
                              padding: "3px 5px",
                            }}
                          >
                            <select
                              value={value}
                              onChange={(e) => onChange(field, e.target.value)}
                              style={{
                                fontSize: "11px",
                                padding: "2px 4px",
                                height: "22px",
                                width: "100%",
                              }}
                            >
                              {!options.includes(data[field]) && (
                                <option value="No match option found">
                                  No match option found
                                </option>
                              )}
                              {options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerProductConfig;
