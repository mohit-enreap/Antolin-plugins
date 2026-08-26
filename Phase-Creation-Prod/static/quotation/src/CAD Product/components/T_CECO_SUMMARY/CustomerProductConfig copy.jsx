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
  "2D_INT": [
    "G.A.Pune (IF)",
    "Antolin Tanger (IF)",
    "Antolin Mexico",
    "G.A. Suzhou",
    "Guangzhou Antolin",
    "G.A.Hyderabad",
    "INTERTRIM",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
    "-",
  ],

  "2D_OEM": [
    "Antolin Mexico",
    "Antolin Tanger (IF)",
    "G.A.Pune (IF)",
    "G.A. Suzhou",
    "G.A.Hyderabad",
    "Guangzhou Antolin",
    "INTERTRIM",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
    "-",
  ],

  // Percentage split between HCC and BCC for 3D TDL
  "3D_TDL (HCC/BCC)": ["HCC 100%", "HCC 70% BCC 30%", "HCC 60% BCC 40%", "-"],

  // Flag indicating whether additional TDL 3/4 is applicable
  "3D_AddTDL34": ["No", "-"],

  // 3D Technical Design Lead ownership locations
  "3D_TDL": [
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

  // Coordination cost responsibility (fixed to BCC)
  "3D_Coord": ["BCC 100%"],

  // 3D Software / BCC responsibility
  "3D_SW": [
    "Antolin Mexico",
    "Antolin Tanger (IF)",
    "G.A.Pune (IF)",
    "G.A.Hyderabad",
    "G.A. Suzhou",
    "Guangzhou Antolin",
    "INTERTRIM",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
  ],

  // Feasibility responsibility options
  "3D_Feasib": [
    "INTERTRIM",
    "G. A. Ingeniería (IF)",
    "G.A.Pune (IF)",
    "Antolin Tanger (IF)",
    "External Engineering (IF)",
    "External Engineering HCC (IF)",
    "External Engineering BCC (IF)",
    "-",
  ],

  // Data Management responsibility split
  DM: [
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
    "-",
  ],

  // CAE / Optimization / Thermal / PS fields
  CAE_TCL: ["G. A. North America (IL)", "G.A.Pune (IL)", "-"],
  CAE_SW: ["G.A.Pune (IL)", "-"],
  CAE_Loops: [2, 3, "-"],

  OPT_TCL: ["G.A.Pune (IL)", "-"],
  OPT_SW: ["G.A.Pune (IL)", "-"],
  OPT_MAT: ["G. A. Besançon", "-"],

  THR_TCL: ["G.A.Pune (IL)", "-"],
  PS_PSL: ["G.A.Pune (IL)", "-"],

  // Tolerance Stack Up ownership
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
const CustomerProductConfig = ({ customerName, productName }) => {
  alert(customerName + " ===>" + productName);
  /**
   * formData holds the CURRENT state of the form
   * (automation defaults + user overrides)
   */
  const [formData, setFormData] = useState({});

  /**
   * Auto-populate form when customer or product changes
   *
   * Flow:
   * 1. Get customer-level config
   * 2. Get common defaults
   * 3. Get product-specific overrides
   * 4. Merge them (product overrides common)
   */
  useEffect(() => {
    const customer = CUSTOMER_PRODUCT_CONFIG[customerName] || {};
    const common = customer.Common || {};
    const product = customer[productName] || {};

    setFormData({
      ...common,
      ...product, // Product values take priority
    });
  }, [customerName, productName]);

  /**
   * Handle dropdown change
   * This overrides the automated value for that field
   * without affecting other fields
   */
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Safety check:
   * If no mapping exists for selected customer/product
   */
  if (!Object.keys(formData).length) {
    return <div>No mapping found</div>;
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 12 }}>
      {/* Header showing current context */}
      <h3>
        {customerName} | {productName}
      </h3>

      {/*
        DEBUG / FULL VIEW (COMMENTED)
        --------------------------------
        This block renders ALL fields from formData.
        Useful for debugging or admin views.
      */}
      {/* {Object.entries(formData).map(([field, value]) => (
        <div key={field} style={{ display: "flex", marginBottom: 8 }}>
          <label style={{ width: 280 }}>{field}</label>

          <select
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
          >
            {(FIELD_OPTIONS[field] || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))} */}

      {/*
        MAIN UI RENDERING
        -----------------
        Only fields defined in VISIBLE_FIELDS are shown.
        Each field:
          - Uses business-friendly label
          - Uses field-specific dropdown options
          - Is fully controlled by React state
      */}
      {Object.entries(VISIBLE_FIELDS).map(([field, label]) => (
        <div key={field} style={{ display: "flex", marginBottom: 8 }}>
          <label style={{ width: 280 }}>{label}</label>

          <select
            value={formData[field] || ""}
            onChange={(e) => handleChange(field, e.target.value)}
          >
            {(FIELD_OPTIONS[field] || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

export default CustomerProductConfig;
