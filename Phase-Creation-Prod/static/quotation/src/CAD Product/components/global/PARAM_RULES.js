export const GlOBAL_VARIBALE_PARAM_RULES = {
  // -------------------------
  // GLOBAL METRICS
  // -------------------------
  TDL: {
    type: "select",
    options: ["YES", "NO"],
  },
  COO: {
    type: "select",
    options: ["YES", "NO"],
  },
  DE: {
    type: "select",
    options: ["YES", "NO"],
  },

  // -------------------------
  // 2D RELATED
  // -------------------------
  "2D Antolin Drawings": {
    type: "select",
    options: ["YES", "NO"],
  },
  "2D Customer Drawings": {
    type: "select",
    options: ["YES", "NO"],
  },

  // -------------------------
  // OTHER MODULES
  // -------------------------
  "Data Management": {
    type: "select",
    options: ["YES", "NO"],
  },
  "Geometrical Study": {
    type: "select",
    options: ["YES", "NO"],
  },

  // -------------------------
  // FEASIBILITY
  // -------------------------
  Feasibility: {
    type: "select",
    options: ["YES", "NO"],
  },

  // -------------------------
  // PRODUCT TYPE
  // -------------------------
  product: {
    type: "select",
    options: [
      "Door Panel",
      "Pillars",
      "Headliner",
      "IP",
      "CC",
      "Sunvisor",
      "WR",
      "Lighting",
      "FEC",
      "CIDUT",
    ],
  },

  // -------------------------
  // CUSTOMER
  // -------------------------
  Customer: {
    type: "select",
    options: [
      "Acura",
      "Aiways",
      "Alfa Romeo",
      "Ashok Leyland",
      "Aston Martin",
      "Audi",
      "Bajaj",
      "Bentley",
      "BMW",
      "Buick",
      "Cadillac",
      "Canoo",
      "Chery",
      "Chevrolet",
      "CHJ",
      "Chrysler",
      "Dodge",
      "Evergrande",
      "FAW",
      "Ferrari",
      "Fiat",
      "Fisker",
      "Force Motors",
      "Ford",
      "Foxtron",
      "Fujian",
      "GAZ",
      "Geely",
      "GMC",
      "Günsel",
      "Honda",
      "Hongqi",
      "Hozon",
      "Hyundai",
      "Iconiq",
      "Ineos",
      "Isuzu",
      "Iveco",
      "Jeep",
      "JLR",
      "Karma",
      "KIA",
      "Lada",
      "Lamborghini",
      "Lincoln",
      "Mahindra",
      "MAN",
      "Maserati",
      "Mazda",
      "Mercedes-Benz",
      "MG",
      "Mini",
      "Mitsubishi",
      "NIO",
      "Nissan",
      "Polestar",
      "Porsche",
      "PSA",
      "Qoros",
      "Ram",
      "Renault",
      "Rivian",
      "Rolls Royce",
      "Saab",
      "SAIC",
      "Seat",
      "Skoda",
      "Smart",
      "Sono Motors",
      "Stellantis",
      "Suzuki",
      "Tata",
      "Tesla",
      "TOGG",
      "Toyota",
      "UAZ",
      "Velocity",
      "Vinfast",
      "Volkswagen",
      "Volvo",
      "Webasto",
      "Xiaopeng",
      "Yulon",
      "Zotye",
    ],
  },

  // -------------------------
  // DEVELOPMENT TYPE
  // -------------------------
  "Type Of Development": {
    type: "select",
    options: ["FSS", "BTP"],
  },

  // -------------------------
  // TEXT INPUT FIELD
  // -------------------------
  ProjectName: {
    type: "text",
    placeholder: "Enter Project Name",
  },
};
