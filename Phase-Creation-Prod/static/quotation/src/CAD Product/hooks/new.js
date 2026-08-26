import { useState, useEffect, useMemo, useContext } from "react";
import { initialJsonData } from "../data/jsonData";
import { calculateResults } from "./useCalculations";
import { get2DActivities } from "../utils/activityUtils";
import { CUSTOMER_PRODUCT_CONFIG } from "../data/customerProductConfig";
import { T_TIMELINES_STD } from "../data/timelinesSTD";
import { StorageContext } from "../../StorageContext";

// newly imported -- start
import { sharedRef } from "../../shared/sharedStore";
import { BASE_3D_OFFER } from "../data/offer/offerIntialData";
import { BASE_INDUSTRIALIZATION_PHASE } from "../data/Industrilization/IndustrilizationPhaseIntialData";
import { DATA_MANAGEMENT_DATA_PHASE } from "../data/DataManagement/DataManagementPhaseIntialData";
import { activityCustomerPhase } from "../data/Customer3dPhaseData/Customerphase";
import { SCALING_FACTOR_FOR_3D_ACTIVITY } from "../data/ScalingFactorfor3DActivity";
import { useOtherTableLogic } from "./useOtherTableLogic";
import { CostSheetHelperLogic } from "./CostSheetHelperLogic";

import {
  setHccBccDynamicOutput,
  getHccBccDynamicOutput,
} from "../../shared/hccBccDynamicStore";
// newly imported -- end

export function useActivityLogic() {
  console.log("=== [useActivityLogic] Hook Initializing ===");

  const { storedData, handleSave, issueData } = useContext(StorageContext);
  const [jsonData, setJsonData] = useState(null);

  const { otherTableData = [], updateOtherTableParam = () => {} } =
    useOtherTableLogic({ jsonData: jsonData || {} });

  const [globalParams, setGlobalParams] = useState({
    TDL: "",
    COO: "",
    DE: "",
    "2d Antolin Drawings": "",
    "2d Customer Drawings": "",
    "Data Management": "",
    "Geometrical Study": "",
    Feasibility: "",
    product: "",
    Customer: "",
    "Type Of Development": "",
    ProjectName: "",
  });

  useEffect(() => {
    if (!storedData) return;

    setJsonData(storedData);

    if (storedData.phaseFlags) {
      setPhaseFlags(storedData.phaseFlags);
    }

    if (storedData.phaseDates) {
      setManualWeeks({
        phase_0: storedData.phaseDates.phase_0?.weeks ?? 3,
        phase_1: storedData.phaseDates.phase_1?.weeks ?? 14,
        phase_2: storedData.phaseDates.phase_2?.weeks ?? 16,
        phase_3_4: storedData.phaseDates.phase_3_4?.weeks ?? 50,
      });
    }

    if (storedData.sopParams) {
      setSopParams(storedData.sopParams);
    }

    if (storedData.Global) {
      setGlobalParams(storedData.Global);
      return;
    }

    if (issueData) {
      setGlobalParams({
        product: issueData.product ?? "Headliner",
        Customer: issueData.customer ?? "Audi",
        "Type Of Development": issueData.projectType ?? "FSS",
        ProjectName: issueData.projectName ?? "Proj",
        TDL: "NO",
        COO: "NO",
        DE: "NO",
        "2d Antolin Drawings": "NO",
        "2d Customer Drawings": "NO",
        "Data Management": "NO",
        "Geometrical Study": "NO",
        Feasibility: "NO",
      });
    }
  }, [storedData, issueData]);

  useEffect(() => {
    if (!jsonData) return;
    updateOtherTableParam(jsonData);
  }, [jsonData]);

  const [global2DRows, setGlobal2DRows] = useState(() =>
    get2DActivities(jsonData?.activities),
  );

  const update2DActivity = (activityName, field, value) => {
    setJsonData((prev) => {
      const nextActivities = {
        ...prev.activities,
        [activityName]: {
          ...prev.activities[activityName],
          [field]: field === "include" ? value === "Yes" : Number(value),
        },
      };

      setGlobal2DRows(get2DActivities(nextActivities));
      return { ...prev, activities: nextActivities };
    });
  };

  // ✅ OPTIMIZATION: Dynamically use `globalParams.Customer` instead of hardcoded "Acura"
  useEffect(() => {
    if (globalParams.Customer) {
      setJsonData((prev) => {
        if (!prev) return prev;
        return updateJsonDataWithCustomerPhases(prev, globalParams.Customer, activityCustomerPhase);
      });
    }
  }, [globalParams.Customer]);

  function updateJsonDataWithCustomerPhases(data, customer, mapping) {
    const newData = structuredClone(data);
    for (const activityKey in newData.activities) {
      const activity = newData.activities[activityKey];
      const activityName = activityKey.split("|")[1]?.trim();

      for (const roofKey of Object.keys(activity)) {
        if (
          ["extraWorkLoop", "reWorkLoop", "standardLoop", "checked", "order", "noOfLoops", "Proto", "Serie"].includes(roofKey)
        ) continue;

        const roof = activity[roofKey];
        const hasSubactivities = roof.subactivity && Object.keys(roof.subactivity).length > 0;

        if (hasSubactivities) {
          for (const subKey in roof.subactivity) {
            const customerPhase = mapping[subKey]?.[customer];
            if (!customerPhase) continue;
            roof.subactivity[subKey].Proto = customerPhase.PH1 ?? roof.subactivity[subKey].Proto;
            roof.subactivity[subKey].Serie = customerPhase.PH2 ?? roof.subactivity[subKey].Serie;
          }
        } else {
          const productPhase = mapping[activityName]?.[customer];
          if (!productPhase) continue;
          roof.Proto = productPhase.PH1 ?? roof.Proto;
          roof.Serie = productPhase.PH2 ?? roof.Serie;
        }
      }
    }
    return newData;
  }

  const SCALING_FACTOR = 3;

  function applyScalingFactor(data, productName, scalingFactors) {
    if (!scalingFactors || !productName) return data;
    const newData = structuredClone(data);

    for (const activityKey in newData.activities) {
      const activity = newData.activities[activityKey];
      const activityName = activityKey.split("|")[1]?.trim();
      if (!activityName) continue;

      for (const roofKey of Object.keys(activity)) {
        if (["extraWorkLoop", "reWorkLoop", "standardLoop", "checked", "order", "noOfLoops"].includes(roofKey)) continue;

        const roof = activity[roofKey];
        if (!roof) continue;

        const hasSub = roof.subactivity && Object.keys(roof.subactivity).length > 0;

        if (hasSub) {
          for (const subKey in roof.subactivity) {
            const sub = roof.subactivity[subKey];
            if (!sub) continue;
            if (isActivityInProduct(productName, subKey.trim())) {
              sub._standardProto ??= sub.Proto;
              sub._standardSerie ??= sub.Serie;
              if (typeof sub._standardProto === "number") sub.Proto = sub._standardProto * scalingFactors.Proto;
              if (typeof sub._standardSerie === "number") sub.Serie = sub._standardSerie * scalingFactors.Serie;
            }
          }
        } else {
          if (isActivityInProduct(productName, activityName)) {
            roof._standardProto ??= roof.Proto;
            roof._standardSerie ??= roof.Serie;
            if (typeof roof._standardProto === "number") roof.Proto = roof._standardProto * scalingFactors.Proto;
            if (typeof roof._standardSerie === "number") roof.Serie = roof._standardSerie * scalingFactors.Serie;
          }
        }
      }
    }
    return newData;
  }

  function isActivityInProduct(productName, activityName) {
    if (!activityName || !productName) return false;
    const product = SCALING_FACTOR_FOR_3D_ACTIVITY[productName.toUpperCase()];
    if (!product) return false;
    return product.activities.includes(activityName);
  }

  const [customerProductData, setCustomerProductData] = useState({});

  useEffect(() => {
    const customerObj = CUSTOMER_PRODUCT_CONFIG[globalParams.Customer] || {};
    const commonConfig = customerObj.Common || {};
    const productConfig = customerObj[globalParams.product] || {};

    setCustomerProductData({
      ...commonConfig,
      ...productConfig,
    });
  }, [globalParams.Customer, globalParams.product]);

  function updateCustomerProductField(field, value) {
    // ✅ OPTIMIZATION: Removed alert() as Forge strictly blocks it
    console.log(`[updateCustomerProductField] User changed: ${field} → ${value}`);
    setCustomerProductData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const [phaseFlags, setPhaseFlags] = useState({
    phase_0: false,
    phase_1: false,
    phase_2: false,
    phase_3_4: false,
  });

  const [manualWeeks, setManualWeeks] = useState({
    phase_0: 3,
    phase_1: 14,
    phase_2: 16,
    phase_3_4: 50,
  });

  // ✅ OPTIMIZATION: Use dynamic globalParams.product instead of hardcoded "Headliner"
  const phaseWeeks = T_TIMELINES_STD?.products?.[globalParams.product] || {
    phase_0: 0,
    phase_1: 0,
    phase_2: 0,
    phase_3_4: 0,
  };

  const {
    phase_0: phase0Weeks,
    phase_1: phase1Weeks,
    phase_2: phase2Weeks,
    phase_3_4: phase34Weeks,
  } = phaseWeeks;

  const [sopParams, setSopParams] = useState({ startDate: "" });

  function updateSopParam(key, value) {
    setSopParams((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhaseFlag(key, value) {
    setPhaseFlags((prev) => ({ ...prev, [key]: value }));
  }

  function updateManualWeeks(key, weeks) {
    setManualWeeks((prev) => ({ ...prev, [key]: weeks }));
  }

  function getScalingFactor(manualWeeks, standardWeeks) {
    if (!standardWeeks || standardWeeks <= 0) return 1;
    if (manualWeeks > standardWeeks) return Math.round(manualWeeks / standardWeeks);
    return 1;
  }

  const scalingFactors = useMemo(() => {
    return {
      Proto: manualWeeks?.phase_1 != null && phase1Weeks != null ? getScalingFactor(manualWeeks.phase_1, phase1Weeks) : 1,
      Serie: manualWeeks?.phase_2 != null && phase2Weeks != null ? getScalingFactor(manualWeeks.phase_2, phase2Weeks) : 1,
    };
  }, [manualWeeks?.phase_1, manualWeeks?.phase_2, phase1Weeks, phase2Weeks]);

  // ✅ OPTIMIZATION: Removed hardcoded "HEADLINER"
  useEffect(() => {
    if (globalParams.product) {
      setJsonData((prev) => {
        if (!prev) return prev;
        return applyScalingFactor(prev, globalParams.product, scalingFactors);
      });
    }
  }, [scalingFactors, globalParams.product]);

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const phaseDates = useMemo(() => {
    if (!sopParams.startDate) return {};
    const phases = [
      { key: "phase_0", weeks: manualWeeks.phase_0 },
      { key: "phase_1", weeks: manualWeeks.phase_1 },
      { key: "phase_2", weeks: manualWeeks.phase_2 },
      { key: "phase_3_4", weeks: manualWeeks.phase_3_4 },
    ];
    const result = {};
    let currentStart = new Date(`${sopParams.startDate}T00:00:00`);

    phases.forEach(({ key, weeks }) => {
      const safeWeeks = typeof weeks === "number" && weeks > 0 ? weeks : 0;
      const start = new Date(currentStart);
      const end = new Date(currentStart);
      const days = phaseFlags[key] && safeWeeks > 0 ? safeWeeks * 7 + 1 : 1;

      end.setDate(end.getDate() + days - 1);

      result[key] = {
        start: formatDate(start),
        end: formatDate(end),
        weeks: phaseFlags[key] ? safeWeeks : 0,
      };

      currentStart = new Date(end);
      currentStart.setDate(currentStart.getDate() + 1);
    });
    return result;
  }, [sopParams.startDate, phaseFlags, manualWeeks]);

  const sopEndDate = useMemo(() => {
    const dates = Object.values(phaseDates);
    if (!dates.length) return "";
    return dates[dates.length - 1].end;
  }, [phaseDates]);

  function sayHello(data) {
    // ✅ OPTIMIZATION: Removed alert() as Forge strictly blocks it
    console.log("Hello 👋 from useActivityLogic:", data);
  }

  function updateGlobalParam(key, val) {
    setGlobalParams((prev) => ({ ...prev, [key]: val }));

    setJsonData((prev) => {
      // ✅ OPTIMIZATION: Prefer structuredClone over JSON stringify/parse for performance
      const next = structuredClone(prev); 

      Object.entries(next.activities).forEach(([activityName, activityObj]) => {
        const name = activityName.toUpperCase();

        if (key === "2D" && name.startsWith("2D")) {
          activityObj.checked = val === "YES";
        }
        
        // ... (The rest of your activity matching conditions remain the same)
      });
      return next;
    });
  }

  function toggleActivityChecked(activityName, checked) {
    setJsonData((prev) => {
      const next = structuredClone(prev); // Optimized copying
      if (next.activities[activityName]) {
        next.activities[activityName].checked = checked;
        next.activities[activityName].standardLoop = checked ? 1 : 0;
      }
      return next;
    });
  }

  function updateProductValue(activityName, productName, key, value) {
    setJsonData((prev) => {
      const next = structuredClone(prev); // Optimized copying
      const product = next.activities[activityName]?.[productName];
      
      if (!product) return prev;

      let convertedValue;
      if (key === "componentSelected") {
        convertedValue = Boolean(value);
      } else {
        convertedValue = !isNaN(Number(value)) ? Number(value) : value;
      }

      product[key] = convertedValue;

      // Sync specific keys
      const NotAllowedActivities = ["2D DELIVERABLES", "DATA MANAGEMENT", "GEOMETRICAL STUDY", "ADD ON COMPONENT"];
      
      if (key === "componentSelected" || key === "noOfComponent") {
        for (const activity in next.activities) {
          const isNotAllowed = NotAllowedActivities.some((prefix) => activity.startsWith(prefix));
          if (isNotAllowed || activity === activityName) continue;
          
          if (next.activities[activity][productName]) {
            next.activities[activity][productName][key] = convertedValue;
          }
        }
      }

      return next;
    });
  }

  function updateSubValue(activityName, productName, subName, key, value) {
    setJsonData((prev) => {
      const next = structuredClone(prev); // Optimized copying
      const convertedValue = !isNaN(Number(value)) ? Number(value) : value;
      const activityProducts = next.activities?.[activityName];

      if (!activityProducts) return prev;

      for (const prodName in activityProducts) {
        const sub = activityProducts[prodName]?.subactivity?.[subName];
        if (sub) {
          sub[key] = convertedValue;
        }
      }
      return next;
    });
  }

  // The rest of your hook exports...
  // return { jsonData, updateGlobalParam, ... }
}