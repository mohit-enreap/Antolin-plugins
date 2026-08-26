// hooks/useCalculations.js
export function useCalculations(activities, globalTDL, globalDE) {
  let sumTDL = 0;
  let sumDE = 0;
  let grand = 0;

  const result = JSON.parse(JSON.stringify(activities));

  Object.entries(result).forEach(([key, a]) => {
    if (key === "ITERATIONS|ITERATIONS") return;

    // 🔹 PREVIEW TOTAL (always visible)
    a.previewTotal =
      (a.TDL + a.DE + a.COO) * (a.noOfLoops ?? 1) * (a.proto + a.serie) ?? 1; // For future developement

    // a.previewTotal = (a.TDL + a.DE + a.COO) * (a?.noOfLoops ?? 1) * (1 + 0); // Proto/serie same (OLD)

    // 🔹 FINAL TOTAL (result table logic)
    //Old Change
    // const tdl = a.checked ? a.TDL * globalTDL : 0;
    // const de = a.checked ? a.DE * globalDE : 0;
    // const coo = a.checked ? a.COO : 0;

    // 🔹 FINAL TOTAL (result table logic)
    // new change
    const tdl =
      a.checked && Number(a.noOfLoops) > 0 ? Number(a.TDL || 0) * globalTDL : 0;
    const de =
      a.checked && Number(a.noOfLoops) > 0 ? Number(a.DE || 0) * globalDE : 0;
    const coo = a.checked && Number(a.noOfLoops) > 0 ? Number(a.COO || 0) : 0;

    const total = (tdl + de + coo) * a.noOfLoops * (a.proto + a.serie) ?? 1; // For future developement
    // const total = (tdl + de + coo) * (a?.noOfLoops ?? 1) * (1 + 0);// Proto/serie same (OLD)

    a.calculatedTotal = total;

    // OLD
    // sumTDL += tdl;
    // sumDE += de;

    // FUTURE DEVELOPMENT - PROTO/SERIE Separate
    sumTDL += tdl * (a.proto + a.serie) ?? 1;
    sumDE += de * (a.proto + a.serie) ?? 1;
    grand += total;

    console.log("key: \n", key, "a: \n", JSON.stringify(a));

    console.log(
      "CAE Calculations \nTDL:",
      sumTDL,
      "\nDE:",
      sumDE,
      "\nGrand:",
      grand,
    );
  });

  // 🔁 ITERATION LOGIC
  const iter = result["ITERATIONS|ITERATIONS"];

  // Future Development for CAE Proto serie loops below
  if (iter?.checked) {
    const iterDE = Object.entries(result)
      .filter(([k, a]) => a.checked && k !== "ITERATIONS|ITERATIONS")
      .reduce((s, [, a]) => s + a.DE * globalDE * (a.proto + a.serie) ?? 1, 0);

    iter.calculatedTotal =
      ((iterDE * (iter.percentage || 0)) / 100) * iter.noOfLoops;

    grand += iter.calculatedTotal;
  } else {
    iter.calculatedTotal = 0;
  }

  // CAE Proto/serie same (OLD)
  // if (iter?.checked) {
  //   const iterDE = Object.entries(result)
  //     .filter(([k, a]) => a.checked && k !== "ITERATIONS|ITERATIONS")
  //     .reduce((s, [, a]) => s + a.DE * globalDE * (1 + 0), 0);

  //   iter.calculatedTotal =
  //     ((iterDE * (iter.percentage || 0)) / 100) * (iter?.noOfLoops ?? 1);

  //   grand += iter.calculatedTotal;
  // } else {
  //   iter.calculatedTotal = 0;
  // }

  return {
    activities: result,
    sumTDL,
    sumDE,
    grand,
  };
}
