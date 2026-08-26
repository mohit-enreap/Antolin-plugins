// activityUtils.js

// This method not in use
import { CUSTOMER_PRODUCT_CONFIG } from "../../data/customerProductConfig";

export const getCustomerProductFields = (customerName, productName) => {
  const customer = CUSTOMER_PRODUCT_CONFIG[customerName];
  if (!customer) return {};

  return {
    ...(customer.Common || {}),
    ...(customer[productName] || {}),
  };
};
