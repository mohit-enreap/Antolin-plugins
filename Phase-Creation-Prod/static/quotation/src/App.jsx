import React, { useState, useEffect } from "react";
import Tabs from "./CAD Product/components/tabs/Tabs"; // Tabs component
import CADCalculator from "./CAD Product/components/modules/CAD/CADCalculator"; // All three modules in ONE folder
import ActivityCalculator from "./CAE Product/ActivityCalculator";
import PSCalculator from "./PS Product/components/modules/PS/PSCalculator";
import { view, invoke } from "@forge/bridge"; // Forge API for modal interaction
import pako from "pako";
import { StorageContext } from "./StorageContext";
import VersionSelection from "./VersionSelection";
import ThermalSimulation from "./Thermal Simulation/Components/ThermalSimulation";
import prepareDataForIntegration from "./Quot-WO-Integration/quot-wo-integration.js";
import { sharedRef } from "./shared/sharedStore.js";
import { getProductParts } from "./Quot-WO-Integration/getProductParts.js";
import { productParts } from "./Quot-WO-Integration/productPartsMap.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("CAD");
  const [issueData, setIssueData] = useState(null);

  // Start Date
  const [quotStartDate, setQuotStartDate] = useState(null);

  const [quotationAssumptions, setQuotationAssumptions] = useState("");

  // Budget Totals from RFQPhaseTable
  const [quotVerTotalHours, setQuotVerTotalHours] = useState(null);
  const [quotVerTotalCost, setQuotVerTotalCost] = useState(null);

  // CAD variables
  const [storedData, setStoredData] = useState(null);
  const [cadJson, setCadJson] = useState({ activities: {} });

  // CAE variables
  const [storedDataCae, setStoredDataCae] = useState(null);
  const [caeJson, setCaeJson] = useState(null);

  // PS variables
  const [storedDataPs, setStoredDataPs] = useState(null);
  const [psJson, setPsJson] = useState(null);

  // Jira Quotation Version field
  const [currentVersion, setCurrentVersion] = useState(null);

  // Selected Quotation Version
  const [selectedVersion, setSelectedVersion] = useState(null);

  // All available Versions
  const [allVersions, setAllVersions] = useState(["V1"]);

  // Issue Status
  const [statusValue, setStatusValue] = useState(null);

  // Inside your StorageContext provider
  const [thermalInput, setThermalInput] = useState({
    rfqPCB: 0,
    devPCB: 0,
    rfqCases: 0,
    devCases: 0,
    rfqLoops: 0,
    devLoops: 0,
  });
  const [thermalActive, setThermalActive] = useState("no");

  // const [error, setError] = useState(null);

  console.log("Hello World !!");

  // NEW
  useEffect(() => {
    // Initialization: Fetch versioning metadata
    const initializeVersions = async () => {
      const context = await view.getContext();
      const issue = context.extension.issue;

      // Fetch both in parallel to save time
      const [current, all] = await Promise.all([
        invoke("getQuotationVersion", { issue }),
        invoke("getAllVersions", { issue }),
      ]);

      console.log(
        "Version Fetched 1... \n All version: ",
        all,
        "\n Selected/Current version: ",
        current,
      );

      setAllVersions(all);
      // Setting this will trigger the 'load' useEffect below

      setCurrentVersion(current);
      // setSelectedVersion(current);
      console.log("Ok Version Fetched");
    };

    initializeVersions();
  }, []);

  useEffect(() => {
    if (currentVersion) {
      setSelectedVersion(currentVersion);
    }
  }, [currentVersion]);

  useEffect(() => {
    // Only load calculator data if we actually have a version selected
    if (selectedVersion) {
      console.log("Switching data context to:", selectedVersion);
      console.log(
        "Version Fetched 2... \n Current version: ",
        currentVersion,
        "\n Selected version: ",
        selectedVersion,
      );

      // It is best if these functions take selectedVersion as an argument
      // to avoid relying on state that might still be updating
      loadAllValues(selectedVersion);
      loadAllValuesCae(selectedVersion);
      loadAllValuesPs(selectedVersion);
    }
  }, [selectedVersion]);

  // OLD
  // useEffect(() => {
  //   if (selectedVersion) {
  //     console.log(
  //       "Version Fetched... \n Current version: ",
  //       currentVersion,
  //       "\n Selected version: ",
  //       selectedVersion,
  //     );

  //     loadAllValues();
  //     loadAllValuesCae();
  //     loadAllValuesPs();
  //     console.log("loaded Version:", selectedVersion);
  //   }
  // }, [selectedVersion]);

  // useEffect(() => {
  //   getJiraQuotationVersion();
  //   getAllQuotationVersions();
  // }, []);

  // Get Current Quotation Version from Jira issue

  useEffect(() => {
    console.log("Hello Effect 1.1 - CAD");

    if (cadJson?.activities) {
      setStoredData(cadJson);
      console.log("Fetched CAD Data -->", storedData);
    }
  }, [cadJson]);

  useEffect(() => {
    console.log("Hello Effect 1.2 - CAE");

    if (caeJson?.activities) {
      setStoredDataCae(caeJson);
      console.log("Fetched CAE Data -->", storedDataCae);
    }
  }, [caeJson]);

  useEffect(() => {
    console.log("Hello Effect 1.3 - PS");

    if (psJson?.activities) {
      setStoredDataPs(psJson);
      console.log("Fetched PS Data -->", storedDataPs);
    }
  }, [psJson]);

  // const getJiraQuotationVersion = async () => {
  //   const context = await view.getContext();
  //   const issue = context.extension.issue; // context.issue may contain { key: 'ABC-123', ... }
  //   console.log(issue);
  //   const quotationVersion = await invoke("getQuotationVersion", {
  //     issue,
  //   });
  //   console.log("Quotation Version --> ", quotationVersion);

  //   setCurrentVersion(quotationVersion);
  //   setSelectedVersion(quotationVersion);
  // };

  // // Get All Quotation Versions from storage
  // const getAllQuotationVersions = async () => {
  //   const context = await view.getContext();
  //   const issue = context.extension.issue; // context.issue may contain { key: 'ABC-123', ... }
  //   console.log(issue);
  //   const allQuotationVersion = await invoke("getAllVersions", { issue });
  //   console.log("All Versions --> ", allQuotationVersion);

  //   setAllVersions(allQuotationVersion);
  // };

  // Load CAD

  const loadAllValues = async (selectedVersion) => {
    const context = await view.getContext();
    const issue = context.extension.issue; // context.issue may contain { key: 'ABC-123', ... }
    console.log(issue);
    console.log("Fetching CAD data for version ", selectedVersion);
    const fetchActivities = async () => {
      const fetchedData = await invoke("getQuotationData", {
        issue,
        selectedVersion,
      });
      const quotIssueData = fetchedData.issueData;
      setIssueData(quotIssueData);

      const issueStatusValue = fetchedData.statusValue;
      setStatusValue(issueStatusValue);
      console.log("Quotation Issue Status --> ", issueStatusValue)

      const sopParamStart = fetchedData.sopParamStart;
      setQuotStartDate(sopParamStart);

      console.log("INIT Start Date : \n", sopParamStart);

      const quotAssumptions = fetchedData.quotAssumptions;
      setQuotationAssumptions(quotAssumptions);

      console.log("INIT Quot Assumptions : \n", quotAssumptions);

      const base64String = fetchedData.quotationData;
      // console.log("B64 --> ", base64String);
      setCadJson(base64String);
      if (base64String) {
        const uint8Arr = base64ToUint8Array(base64String);
        const decompressedString = pako.inflate(uint8Arr, { to: "string" });
        const parsedData = JSON.parse(decompressedString);
        console.log(
          "Parsed CAD Data for Version ",
          selectedVersion,
          " : \n",
          parsedData,
        );
        setCadJson(parsedData);
      }
    };
    await fetchActivities();
    // setCreated(false)
    // if (issue && issue.key) {
    //   setIssueKey(issue.key);
    //   // Once we have issueKey, fetch data from storage
    //   const base64String = await invoke('getData', { issueKey: issue.key, phase });
    //   if (base64String) {
    //     const uint8Arr = base64ToUint8Array(base64String);
    //     const decompressedString = pako.inflate(uint8Arr, { to: 'string' });
    //     const parsedData = JSON.parse(decompressedString);

    //     setPhaseName(parsedData.phaseName);
    //     // setExtraWork(parsedData.extraWork);
    //     setMilestones(parsedData.milestones);
    //     setActivities(parsedData.activities);
    //     setTotalHours(parsedData.totalHours);
    //     setCreated(true)
    //   }
    // }
  };

  // Load CAE
  const loadAllValuesCae = async (selectedVersion) => {
    const context = await view.getContext();
    const issue = context.extension.issue; // context.issue may contain { key: 'ABC-123', ... }
    console.log(issue);
    console.log("Fetching CAE data for version ", selectedVersion);

    const fetchActivitiesCae = async () => {
      const fetchedDataCae = await invoke("getQuotationDataCae", {
        issue,
        selectedVersion,
      });
      const quotIssueDataCae = fetchedDataCae.issueData;
      // setIssueData(quotIssueDataCae);        // NOT REQUIRED AGAIN FOR CAE
      const base64String = fetchedDataCae.quotationData;
      console.log("B64 CAE --> ", base64String);
      setCaeJson(base64String);
      if (base64String) {
        const uint8Arr = base64ToUint8Array(base64String);
        const decompressedString = pako.inflate(uint8Arr, { to: "string" });
        const parsedData = JSON.parse(decompressedString);
        console.log(
          "Parsed CAE Data for Version ",
          selectedVersion,
          " : \n",
          parsedData,
        );
        setCaeJson(parsedData);
      }
    };
    await fetchActivitiesCae();
    // setCreated(false)
    // if (issue && issue.key) {
    //   setIssueKey(issue.key);
    //   // Once we have issueKey, fetch data from storage
    //   const base64String = await invoke('getData', { issueKey: issue.key, phase });
    //   if (base64String) {
    //     const uint8Arr = base64ToUint8Array(base64String);
    //     const decompressedString = pako.inflate(uint8Arr, { to: 'string' });
    //     const parsedData = JSON.parse(decompressedString);

    //     setPhaseName(parsedData.phaseName);
    //     // setExtraWork(parsedData.extraWork);
    //     setMilestones(parsedData.milestones);
    //     setActivities(parsedData.activities);
    //     setTotalHours(parsedData.totalHours);
    //     setCreated(true)
    //   }
    // }
  };

  // Load PS
  const loadAllValuesPs = async (selectedVersion) => {
    const context = await view.getContext();
    const issue = context.extension.issue; // context.issue may contain { key: 'ABC-123', ... }
    console.log(issue);
    console.log("Fetching PS data for version ", selectedVersion);

    const fetchActivitiesPs = async () => {
      const fetchedDataPs = await invoke("getQuotationDataPs", {
        issue,
        selectedVersion,
      });
      const quotIssueDataPs = fetchedDataPs.issueData;
      // setIssueData(quotIssueDataPs);        // NOT REQUIRED AGAIN FOR CAE
      const base64String = fetchedDataPs.quotationData;
      console.log("B64 PS --> ", base64String);
      setPsJson(base64String);
      if (base64String) {
        const uint8Arr = base64ToUint8Array(base64String);
        const decompressedString = pako.inflate(uint8Arr, { to: "string" });
        const parsedData = JSON.parse(decompressedString);
        console.log(
          "Parsed PS Data for Version ",
          selectedVersion,
          " : \n",
          parsedData,
        );
        setPsJson(parsedData);
      }
    };
    await fetchActivitiesPs();
    // setCreated(false)
    // if (issue && issue.key) {
    //   setIssueKey(issue.key);
    //   // Once we have issueKey, fetch data from storage
    //   const base64String = await invoke('getData', { issueKey: issue.key, phase });
    //   if (base64String) {
    //     const uint8Arr = base64ToUint8Array(base64String);
    //     const decompressedString = pako.inflate(uint8Arr, { to: 'string' });
    //     const parsedData = JSON.parse(decompressedString);

    //     setPhaseName(parsedData.phaseName);
    //     // setExtraWork(parsedData.extraWork);
    //     setMilestones(parsedData.milestones);
    //     setActivities(parsedData.activities);
    //     setTotalHours(parsedData.totalHours);
    //     setCreated(true)
    //   }
    // }
  };

  // Save CAD
  const handleSave = async (updatedData) => {
    // const blob = new Blob([JSON.stringify({ activities: data ,id:json.id,name:json.name}, null, 2)], {
    //   type: 'application/json',
    // });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'updated_activities.json';
    // a.click();
    // URL.revokeObjectURL(url);
    const context = await view.getContext();
    const issue = context.extension.issue.key;
    console.log("Handle Save CAD -- > \n", JSON.stringify(updatedData));
    console.log(
      "Version Totals --> \n Hours: ",
      sharedRef.total.totalHours,
      " Cost: ",
      sharedRef.total.totalCost,
    );
    setStoredData(updatedData); // update Global Context
    // let payload = { activities: data, id: json.id, name: json.name };
    let payload = updatedData;
    const jsonString = JSON.stringify(payload);
    const compressedData = pako.deflate(jsonString);
    const base64String = uint8ArrayToBase64(compressedData);

    // Prepare data for WO integration
    const workOrderData = prepareDataForIntegration(updatedData, issueData, "CAD");
    console.log("Prepared Work Order Data (CAD) for Integration: ", JSON.stringify(workOrderData));
    const jsonStringWO = JSON.stringify(workOrderData);
    const compressedDataWO = pako.deflate(jsonStringWO);
    const base64StringWO = uint8ArrayToBase64(compressedDataWO);

    console.log("Phase Weeks to be saved ... ", sharedRef.phaseWeeksShared)

    const selectedProductParts = getProductParts(workOrderData.activities);

    await invoke("saveQuotationData", {
      issue,
      data: base64String,
      workOrderData: base64StringWO, // Send prepared data for WO integration
      selectedProductParts: selectedProductParts, // Send selected product parts for WO integration
      startDate: updatedData?.sopParams?.startDate,
      sopEndDate: updatedData?.sopEndDate,
      phaseWeeks: sharedRef.phaseWeeksShared, // Pass phaseWeeks to backend for saving
      currentVersion: currentVersion, // Pass current version to backend to save under correct version key
      quotVerTotalHours: sharedRef.total.totalHours, // Pass current version's total hours for quick reference in backend
      quotVerTotalCost: sharedRef.total.totalCost, // Pass current version's total cost for quick reference in backend
    });
    console.log("quotation saved");

    // Show selected roof types
    const selectedRoofTypes = [];
    const allRoofTypes = new Set();

    // // Get all unique roof types
    // Object.values(data).forEach((activity) => {
    //   Object.keys(activity).forEach((key) => {
    //     if (!nonProductPartKeys.includes(key)) {
    //       allRoofTypes.add(key);
    //     }
    //   });
    // });

    // // Check which roof types are selected and have quantities
    // Array.from(allRoofTypes).forEach((roofType) => {
    //   const firstActivity = Object.values(data).find(
    //     (activity) => activity[roofType]
    //   );
    //   if (
    //     firstActivity &&
    //     firstActivity[roofType].componentSelected &&
    //     firstActivity[roofType].noOfComponent > 0
    //   ) {
    //     selectedRoofTypes.push(
    //       `${roofType}: ${firstActivity[roofType].noOfComponent}`
    //     );
    //   }
    // });

    // if (selectedRoofTypes.length > 0) {
    //   alert(
    //     `Data saved successfully!\n\nSelected Roof Types (applies to all activities):\n${selectedRoofTypes.join(
    //       "\n"
    //     )}`
    //   );
    // } else {
    //   alert("Data saved successfully!");
    // }
  };

  // Save CAE
  const handleSaveCae = async (updatedData) => {
    // const blob = new Blob([JSON.stringify({ activities: data ,id:json.id,name:json.name}, null, 2)], {
    //   type: 'application/json',
    // });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'updated_activities.json';
    // a.click();
    // URL.revokeObjectURL(url);
    const context = await view.getContext();
    const issue = context.extension.issue.key;
    console.log("Handle Save CAE -- > \n", JSON.stringify(updatedData));
    console.log(
      "Version Totals --> \n Hours: ",
      sharedRef.total.totalHours,
      " Cost: ",
      sharedRef.total.totalCost,
    );

    setStoredDataCae(updatedData); // update Global Context
    // let payload = { activities: data, id: json.id, name: json.name };
    let payload = updatedData;
    const jsonString = JSON.stringify(payload);
    const compressedData = pako.deflate(jsonString);
    const base64String = uint8ArrayToBase64(compressedData);

    // Prepare data for WO integration for CAE
    const workOrderData = prepareDataForIntegration(updatedData, issueData, "CAE");
    console.log("Prepared Work Order Data (CAE) for Integration: ", JSON.stringify(workOrderData));
    const jsonStringWO = JSON.stringify(workOrderData);
    const compressedDataWO = pako.deflate(jsonStringWO);
    const base64StringWO = uint8ArrayToBase64(compressedDataWO);

    const selectedProductPartName = workOrderData?.name.toUpperCase();
    const selectedProductPartId = selectedProductPartName.includes("CAE") ? productParts[selectedProductPartName] : [];

    await invoke("saveQuotationDataCae", {
      issue,
      data: base64String,
      workOrderData: base64StringWO, // Send prepared data for WO integration,
      selectedProductParts: [{ id: selectedProductPartId }], // Send selected product parts for WO integration
      currentVersion: currentVersion, // Pass current version to backend to save under correct version key
      quotVerTotalHours: sharedRef.total.totalHours, // Pass current version's total hours for quick reference in backend
      quotVerTotalCost: sharedRef.total.totalCost, // Pass current version's total cost for quick reference in backend
    });
    console.log("CAE quotation saved");

    // Show selected roof types
    const selectedRoofTypes = [];
    const allRoofTypes = new Set();

    // // Get all unique roof types
    // Object.values(data).forEach((activity) => {
    //   Object.keys(activity).forEach((key) => {
    //     if (!nonProductPartKeys.includes(key)) {
    //       allRoofTypes.add(key);
    //     }
    //   });
    // });

    // // Check which roof types are selected and have quantities
    // Array.from(allRoofTypes).forEach((roofType) => {
    //   const firstActivity = Object.values(data).find(
    //     (activity) => activity[roofType]
    //   );
    //   if (
    //     firstActivity &&
    //     firstActivity[roofType].componentSelected &&
    //     firstActivity[roofType].noOfComponent > 0
    //   ) {
    //     selectedRoofTypes.push(
    //       `${roofType}: ${firstActivity[roofType].noOfComponent}`
    //     );
    //   }
    // });

    // if (selectedRoofTypes.length > 0) {
    //   alert(
    //     `Data saved successfully!\n\nSelected Roof Types (applies to all activities):\n${selectedRoofTypes.join(
    //       "\n"
    //     )}`
    //   );
    // } else {
    //   alert("Data saved successfully!");
    // }
  };

  // Save PS
  const handleSavePs = async (updatedData) => {
    // const blob = new Blob([JSON.stringify({ activities: data ,id:json.id,name:json.name}, null, 2)], {
    //   type: 'application/json',
    // });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'updated_activities.json';
    // a.click();
    // URL.revokeObjectURL(url);
    const context = await view.getContext();
    const issue = context.extension.issue.key;
    console.log("Handle Save PS-- > \n", JSON.stringify(updatedData));
    console.log(
      "Version Totals --> \n Hours: ",
      sharedRef.total.totalHours,
      " Cost: ",
      sharedRef.total.totalCost,
    );

    setStoredDataPs(updatedData); // update Global Context
    // let payload = { activities: data, id: json.id, name: json.name };
    let payload = updatedData;
    const jsonString = JSON.stringify(payload);
    const compressedData = pako.deflate(jsonString);
    const base64String = uint8ArrayToBase64(compressedData);

    // Prepare data for WO integration for PS
    const workOrderData = prepareDataForIntegration(updatedData, issueData, "PS");
    console.log("Prepared Work Order Data (PS) for Integration : ", JSON.stringify(workOrderData));
    const jsonStringWO = JSON.stringify(workOrderData);
    const compressedDataWO = pako.deflate(jsonStringWO);
    const base64StringWO = uint8ArrayToBase64(compressedDataWO);

    const selectedProductParts = getProductParts(workOrderData.activities);

    await invoke("saveQuotationDataPs", {
      issue,
      data: base64String,
      workOrderData: base64StringWO, // Send prepared data for WO integration
      selectedProductParts: selectedProductParts, // Send selected product parts for WO integration
      currentVersion: currentVersion, // Pass current version to backend to save under correct version key
      quotVerTotalHours: sharedRef.total.totalHours, // Pass current version's total hours for quick reference in backend
      quotVerTotalCost: sharedRef.total.totalCost, // Pass current version's total cost for quick reference in backend
    });
    console.log("PS quotation saved");

    // Show selected roof types
    const selectedRoofTypes = [];
    const allRoofTypes = new Set();

    // // Get all unique roof types
    // Object.values(data).forEach((activity) => {
    //   Object.keys(activity).forEach((key) => {
    //     if (!nonProductPartKeys.includes(key)) {
    //       allRoofTypes.add(key);
    //     }
    //   });
    // });

    // // Check which roof types are selected and have quantities
    // Array.from(allRoofTypes).forEach((roofType) => {
    //   const firstActivity = Object.values(data).find(
    //     (activity) => activity[roofType]
    //   );
    //   if (
    //     firstActivity &&
    //     firstActivity[roofType].componentSelected &&
    //     firstActivity[roofType].noOfComponent > 0
    //   ) {
    //     selectedRoofTypes.push(
    //       `${roofType}: ${firstActivity[roofType].noOfComponent}`
    //     );
    //   }
    // });

    // if (selectedRoofTypes.length > 0) {
    //   alert(
    //     `Data saved successfully!\n\nSelected Roof Types (applies to all activities):\n${selectedRoofTypes.join(
    //       "\n"
    //     )}`
    //   );
    // } else {
    //   alert("Data saved successfully!");
    // }
  };

  function uint8ArrayToBase64(uint8Arr) {
    let CHUNK_SIZE = 0x8000;
    let chunks = [];
    for (let i = 0; i < uint8Arr.length; i += CHUNK_SIZE) {
      chunks.push(
        String.fromCharCode.apply(null, uint8Arr.subarray(i, i + CHUNK_SIZE)),
      );
    }
    const binaryString = chunks.join("");
    return btoa(binaryString);
  }

  function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  return (
    <div style={{ padding: 18 }}>
      {/* ================= Sticky Tabs ================= */}
      <StorageContext.Provider
        value={{
          storedData,
          storedDataCae,
          storedDataPs,
          handleSave,
          handleSaveCae,
          handleSavePs,
          issueData,
          quotStartDate,
          quotationAssumptions,
          allVersions,
          selectedVersion,
          currentVersion,
          setSelectedVersion,
          //send Thermal Sim state variables
          thermalInput,
          setThermalInput,
          thermalActive,
          setThermalActive,
          //send Budget Totals
          quotVerTotalHours,
          setQuotVerTotalHours,
          quotVerTotalCost,
          setQuotVerTotalCost,
          statusValue
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            background: "#fff",
            borderBottom: "1px solid #ddd",
          }}
        >
          <Tabs active={activeTab} setActive={setActiveTab} />
        </div>

        {/* ================= Content ================= */}
        <div style={{ marginTop: 10 }}>
          {/* {activeTab === "CAD" && <CADCalculator />}
          {activeTab === "CAE" && <ActivityCalculator />}
          {activeTab === "PS" && <PSCalculator />} */}
          <div style={{ display: activeTab === "Versions" ? "block" : "none" }}>
            <VersionSelection />
          </div>

          <div style={{ display: activeTab === "CAD" ? "block" : "none" }}>
            <CADCalculator />
          </div>

          <div style={{ display: activeTab === "CAE" ? "block" : "none" }}>
            <ActivityCalculator />
          </div>

          <div style={{ display: activeTab === "PS" ? "block" : "none" }}>
            <PSCalculator />
          </div>

          <div style={{ display: activeTab === "TS" ? "block" : "none" }}>
            <ThermalSimulation />
          </div>
        </div>
      </StorageContext.Provider>
    </div>
  );
}
