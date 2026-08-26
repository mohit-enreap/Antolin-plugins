// // hooks/useCalculations.js
// export function useCalculations(activities, globalTDL, globalDE) {
//   let sumTDL = 0;
//   let sumDE = 0;
//   let grand = 0;

//   const result = JSON.parse(JSON.stringify(activities));

//   Object.entries(result).forEach(([key, a]) => {
//     if (key === "ITERATIONS|ITERATIONS") return;

//     // 🛡️ Pre-define safe values to avoid NaN
//     const proto = Number(a.proto ?? 0);
//     const serie = Number(a.serie ?? 0);
//     const loops = Number(a.noOfLoops ?? 1);
//     const multiplier = proto + serie || 1; // Default to 1 if both are 0 to avoid zeroing out

//     // 🔹 PREVIEW TOTAL
//     a.previewTotal =
//       (Number(a.TDL || 0) + Number(a.DE || 0) + Number(a.COO || 0)) *
//       loops *
//       multiplier;

//     // 🔹 FINAL TOTAL logic
//     const tdl = a.checked && loops > 0 ? Number(a.TDL || 0) * globalTDL : 0;
//     const de = a.checked && loops > 0 ? Number(a.DE || 0) * globalDE : 0;
//     const coo = a.checked && loops > 0 ? Number(a.COO || 0) : 0;

//     const total = (tdl + de + coo) * loops * multiplier;
//     a.calculatedTotal = total;

//     // Update sums
//     sumTDL += tdl * multiplier * loops;
//     sumDE += de * multiplier * loops;
//     grand += total;
//   });

//   // 🔁 ITERATION LOGIC
//   const iter = result["ITERATIONS|ITERATIONS"];

//   if (iter?.checked) {
//     const iterDE = Object.entries(result)
//       .filter(([k, a]) => a.checked && k !== "ITERATIONS|ITERATIONS")
//       .reduce((s, [, a]) => {
//         const m = Number(a.proto ?? 0) + Number(a.serie ?? 0) || 1;
//         return s + Number(a.DE || 0) * globalDE * m;
//       }, 0);

//     iter.calculatedTotal =
//       ((iterDE * Number(iter.percentage || 0)) / 100) *
//       Number(iter.noOfLoops || 0);
//     grand += iter.calculatedTotal;
//   } else if (iter) {
//     iter.calculatedTotal = 0;
//   }

//   return { activities: result, sumTDL, sumDE, grand };
// }

// new logic with proto/serie separation and iteration fix
export function useCalculations(activities, globalTDL, globalDE) {
  // =========================
  // GRAND TOTALS
  // =========================
  let sumTDL = 0;
  let sumDE = 0;
  let grand = 0;

  // =========================
  // PROTO TOTALS
  // =========================
  let protoSumTDL = 0;
  let protoSumDE = 0;
  let protoGrand = 0;

  // =========================
  // SERIE TOTALS
  // =========================
  let serieSumTDL = 0;
  let serieSumDE = 0;
  let serieGrand = 0;

  const result = JSON.parse(JSON.stringify(activities));

  Object.entries(result).forEach(([key, a]) => {
    if (key === "ITERATIONS|ITERATIONS") return;

    const isChecked = !!a.checked;

    // =========================
    // SAFE VALUES
    // =========================
    const loops = Number(a.noOfLoops ?? 1);

    // IMPORTANT RULE:
    // default = 1, but ignored when not checked
    const proto = isChecked ? Number(a.proto ?? 1) : 0;
    const serie = isChecked ? Number(a.serie ?? 1) : 0;

    const multiplier = proto + serie;

    // =========================
    // PREVIEW TOTAL
    // =========================
    a.previewTotal =
      (Number(a.TDL || 0) + Number(a.DE || 0) + Number(a.COO || 0)) *
      loops *
      multiplier;

    // =========================
    // PREVIEW TOTAL
    // =========================
    a.previewProtoTotal =
      (Number(a.TDL || 0) + Number(a.DE || 0) + Number(a.COO || 0)) *
      loops *
      proto;

    // =========================
    // PREVIEW TOTAL
    // =========================
    a.previewSerieTotal =
      (Number(a.TDL || 0) + Number(a.DE || 0) + Number(a.COO || 0)) *
      loops *
      serie;

    // =========================
    // FINAL VALUES
    // =========================
    const tdl = isChecked ? Number(a.TDL || 0) * globalTDL : 0;
    const de = isChecked ? Number(a.DE || 0) * globalDE : 0;
    const coo = isChecked ? Number(a.COO || 0) : 0;

    // =========================
    // PROTO CALCULATION
    // =========================
    const protoTotal = (tdl + de + coo) * loops * proto;

    protoSumTDL += tdl * loops * proto;
    protoSumDE += de * loops * proto;
    protoGrand += protoTotal;

    // =========================
    // SERIE CALCULATION
    // =========================
    const serieTotal = (tdl + de + coo) * loops * serie;

    serieSumTDL += tdl * loops * serie;
    serieSumDE += de * loops * serie;
    serieGrand += serieTotal;

    // =========================
    // FINAL COMBINED TOTAL
    // =========================
    const total = protoTotal + serieTotal;
    a.calculatedTotal = total;

    // =========================
    // OVERALL TOTALS
    // =========================
    sumTDL += tdl * loops * multiplier;
    sumDE += de * loops * multiplier;
    grand += total;
  });

  // =========================
  // ITERATION LOGIC
  // =========================
  // =========================
  // ITERATION LOGIC (FIXED)
  // =========================
  // =========================
  // ITERATION LOGIC (SEPARATED)
  // =========================

  const iter = result["ITERATIONS|ITERATIONS"];

  if (iter?.checked) {
    console.log("CAE ITERATION Loops before:\n", Number(iter.noOfLoops));

    const percentage = Number(iter.percentage || 0);
    const iterLoops = Number(iter.noOfLoops || 0);
    const factor = percentage / 100;

    console.log("CAE ITERATION Loops after:\n", iterLoops);

    let baseProto = 0;
    let baseSerie = 0;

    Object.entries(result)
      .filter(([k, a]) => a.checked && k !== "ITERATIONS|ITERATIONS")
      .forEach(([, a]) => {
        const loops = Number(a.noOfLoops ?? 1);

        const proto = Number(a.proto ?? 1);
        const serie = Number(a.serie ?? 1);

        const base = Number(a.DE || 0) * globalDE;

        // =========================
        // BASE (before iteration)
        // =========================
        const protoVal = base * loops * proto;
        const serieVal = base * loops * serie;

        baseProto += protoVal;
        baseSerie += serieVal;
      });

    // =========================
    // PREVIEW (BEFORE %)
    // =========================
    iter.previewProtoTotal = baseProto * iterLoops;
    iter.previewSerieTotal = baseSerie * iterLoops;
    iter.previewTotal = (iter.previewProtoTotal + iter.previewSerieTotal);
    // =========================
    // FINAL (AFTER %)
    // =========================
    iter.protoTotal = iter.previewProtoTotal / 2 * factor;  // As per Formula its getting divide by 2
    iter.serieTotal = iter.previewSerieTotal / 2 * factor;    // As per Formula its getting divide by 2

    // if you want to show the % only
    // iter.previewProtoTotal =iter.previewProtoTotal * factor;
    //  iter.previewSerieTotal =iter.previewSerieTotal * factor;

    iter.calculatedTotal = (iter.protoTotal);   // because we calculate only
    iter.calculatedProtoTotal = iter.protoTotal
    iter.calculatedSerieTotal = iter.serieTotal

    grand += iter.calculatedTotal;
  } else if (iter) {
    iter.previewProtoTotal = 0;
    iter.previewSerieTotal = 0;
    iter.previewTotal = 0;

    iter.protoTotal = 0;
    iter.serieTotal = 0;
    iter.calculatedTotal = 0;
  }
  //----Iteration ends
  //   return { activities: result, sumTDL, sumDE, grand };

  return {
    activities: result,

    // OVERALL
    sumTDL: sumTDL / 2 ?? 0,
    sumDE: sumDE / 2 ?? 0,
    grand: grand / 2 ?? 0,

    // PROTO
    protoSumTDL: protoSumTDL / 2 ?? 0,
    protoSumDE: protoSumDE / 2 ?? 0,
    protoGrand: protoGrand / 2 ?? 0,

    // SERIE
    serieSumTDL: serieSumTDL / 2 ?? 0,
    serieSumDE: serieSumDE / 2 ?? 0,
    serieGrand: serieGrand / 2 ?? 0,
  };
}
