export const isProductKey = (k) =>
  typeof k === "string" &&
  ![
    "extraWorkLoop",
    "reWorkLoop",
    "standardLoop",
    "checked",
    "order",
    "noOfLoops",
    "Proto",
    "Serie",
  ].includes(k);

export function escapeQuotes(s = "") {
  return s.replace(/'/g, "\\'");
}
