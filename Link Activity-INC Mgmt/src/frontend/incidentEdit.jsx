import React, { useState, useEffect, useCallback } from "react";
import ForgeReconciler, {
  Label,
  Text,
  Link,
  Select,
  RequiredAsterisk,
  HelperMessage,
  useProductContext,
  ErrorMessage,
} from "@forge/react";
import { CustomFieldEdit } from "@forge/react/jira";
import { view, invoke } from "@forge/bridge";

const Edit = () => {
  const [value, setValue] = useState("");
  const [renderContext, setRenderContext] = useState(null);

  const [projectName, setProjectName] = useState(null); // display only (read-only)
  const [projectKey, setProjectKey] = useState(null); // stable key used for matching
  const [activityNature, setActivityNature] = useState(null); // "Extra Work" | "Re-Work" | null

  const [incidentOptions, setIncidentOptions] = useState([]);
  const [incidentType, setIncidentType] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isIncidentLoading, setIsIncidentLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [incidentTypeError, setIncidentTypeError] = useState(false);

  const context = useProductContext();

  const extraWorkTypes = [
    { label: "MUA FORMAL (Extra Work)", value: "MUA FORMAL (Extra Work)" },
    { label: "MUA INFORMAL (Extra Work)", value: "MUA INFORMAL (Extra Work)" },
  ];
  const reWorkTypes = [
    { label: "GUIDES & STDS (Re-Work)", value: "GUIDES & STDS (Re-Work)" },
    { label: "DESIGN CRITERIA (Re-Work)", value: "DESIGN CRITERIA (Re-Work)" },
  ];

  const incidentTypeOptions =
    activityNature === "Extra Work"
      ? extraWorkTypes
      : activityNature === "Re-Work"
        ? reWorkTypes
        : [];

  const incidentTypesForNature = (nature) =>
    nature === "Extra Work"
      ? ["MUA FORMAL (Extra Work)", "MUA INFORMAL (Extra Work)"]
      : nature === "Re-Work"
        ? ["GUIDES & STDS (Re-Work)", "DESIGN CRITERIA (Re-Work)"]
        : [];

  const detectNature = (summary) => {
    if (!summary) return null;
    if (summary.includes("Extra Work")) return "Extra Work";
    if (summary.includes("Re-Work")) return "Re-Work";
    return null;
  };

  const fetchIssuesByJQL = async (jql) => {
    try {
      const response = await invoke("getIssuesByJQL", { jql });
      return response.issues || [];
    } catch (error) {
      console.error("Error fetching issues:", error);
      return [];
    }
  };

  // Key-based JQL: match incidents linked to the Project work-item KEY (stable),
  // filtered by the incident's "Incident type" field, grouped by nature.
  const buildIncidentJQL = (projKey, nature) => {
    const types = incidentTypesForNature(nature)
      .map((t) => `"${t}"`)
      .join(", ");
    return `"type" = Incident AND issue in linkedIssues("${projKey}") AND "Incident type" in (${types}) AND Project = INCENC ORDER BY key ASC`;
  };

  const fetchIncidents = async (projKey, nature) => {
    if (!projKey) return [];
    return await fetchIssuesByJQL(buildIncidentJQL(projKey, nature));
  };

  useEffect(() => {
    const initialize = async () => {
      const contextData = await view.getContext();
      const fieldVal = contextData.extension.fieldValue?.toString() || "";
      setRenderContext(contextData.extension.renderContext);
      setValue(fieldVal);

      // Saved format: projectKey##projectName##incidentType##incidentLabel##incidentKey
      const [
        savedProjKey,
        savedProject,
        savedIncidentType,
        savedIncidentLabel,
        savedIncidentKey,
      ] = fieldVal.split("##");

      const hostKey = contextData.extension?.issue?.key;
      let pKey = savedProjKey || null;
      let pName = savedProject || null;
      let nature = null;

      if (hostKey) {
        try {
          const res = await invoke("getIssueByKey", { issueKey: hostKey });
          if (res && res.fields) {
            pKey = res.fields.customfield_10078 || pKey; // Project work-item KEY
            pName = res.fields.customfield_10039 || pName; // Project name (display)
            nature = detectNature(res.fields.summary);
          }
        } catch (e) {
          console.error("Failed to fetch host issue:", e);
        }
      }

      if (savedIncidentType) {
        const all = [...extraWorkTypes, ...reWorkTypes];
        const match = all.find((o) => o.value === savedIncidentType);
        if (match) {
          setIncidentType(match);
          if (!nature) {
            nature = savedIncidentType.includes("Extra Work")
              ? "Extra Work"
              : "Re-Work";
          }
        }
      }

      setProjectKey(pKey);
      setProjectName(pName);
      setActivityNature(nature);

      if (pKey && nature && savedIncidentType) {
        const incidents = await fetchIncidents(pKey, nature);
        const opts = incidents.map((issue) => ({
          label: `${issue.key} | ${issue.fields.summary}`,
          value: issue.key,
        }));
        setIncidentOptions(opts);
        if (savedIncidentKey) {
          const matched = opts.find((o) => o.value === savedIncidentKey);
          if (matched) setSelectedIncident(matched);
        }
      }

      setIsInitializing(false);
    };

    initialize();
  }, [context]);

  useEffect(() => {
    const loadIncidents = async () => {
      if (isInitializing) return;
      if (incidentType) setIncidentTypeError(false);

      if (projectKey && activityNature && incidentType) {
        setIsIncidentLoading(true);
        const incidents = await fetchIncidents(projectKey, activityNature);
        setIncidentOptions(
          incidents.map((issue) => ({
            label: `${issue.key} | ${issue.fields.summary}`,
            value: issue.key,
          })),
        );
        setIsIncidentLoading(false);
      } else {
        setIncidentOptions([]);
        setIsIncidentLoading(false);
      }
    };
    loadIncidents();
  }, [incidentType]);

  const onSubmit = async () => {
    try {
      setIncidentTypeError(false);

      if (!activityNature) {
        await view.submit(null);
        return;
      }
      if (!incidentType) {
        setIncidentTypeError(true);
        await view.submit(null);
        return;
      }

      // Saved format: projectKey##projectName##incidentType##incidentLabel##incidentKey
      const valueToSave =
        `${projectKey || ""}##${projectName || ""}##${incidentType?.value || ""}##` +
        `${selectedIncident?.label || ""}##${selectedIncident?.value || ""}`;
      await view.submit(valueToSave);
    } catch (e) {
      console.error("Submit error:", e);
    }
  };

  const handleIncidentTypeChange = useCallback((option) => {
    setIncidentType(option);
    setSelectedIncident(null);
    setIncidentOptions([]);
    setIncidentTypeError(false);
  }, []);

  const handleIncidentChange = useCallback((option) => {
    setSelectedIncident(option);
  }, []);

  if (!isInitializing && !activityNature) {
    return (
      <CustomFieldEdit onSubmit={onSubmit} hideActionButtons>
        <Text>
          Incidents can only be added on Extra Work or Re-Work activities.
        </Text>
      </CustomFieldEdit>
    );
  }

  return (
    <CustomFieldEdit onSubmit={onSubmit} hideActionButtons>
      <Label>Project</Label>
      <Text>{projectName || "Loading..."}</Text>
      <HelperMessage>Auto-filled from the current activity</HelperMessage>
      <Text></Text>

      <Label>
        Incident Type <RequiredAsterisk />
      </Label>
      <Select
        placeholder="Select Incident Type..."
        options={incidentTypeOptions}
        onChange={handleIncidentTypeChange}
        value={incidentType}
        isLoading={isInitializing}
      />
      {incidentTypeError && (
        <ErrorMessage>
          Incident type is required. Please select one.
        </ErrorMessage>
      )}
      <HelperMessage>
        For the incident type guide, refer to the link below.
        <Text></Text>
        <Link
          href="https://grupoantolin.sharepoint.com/sites/App_Monitoring/CET/INCIDENCES/Issue%20types_02-Jan-2026.xlsx"
          openNewTab={true}
        >
          Guide
        </Link>
      </HelperMessage>
      <Text></Text>

      {incidentType?.value && (
        <>
          <Label>Incident</Label>
          <Select
            placeholder="Select Incident ..."
            options={incidentOptions}
            onChange={handleIncidentChange}
            value={selectedIncident}
            isLoading={isIncidentLoading}
          />
          <HelperMessage>Incidents linked to the current project</HelperMessage>
        </>
      )}
    </CustomFieldEdit>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Edit />
  </React.StrictMode>,
);
