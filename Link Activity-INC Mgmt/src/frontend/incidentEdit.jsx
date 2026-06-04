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
  const [projectOptions, setProjectOptions] = useState([]);
  const [incidentOptions, setIncidentOptions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [incidentType, setIncidentType] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isIncidentLoading, setIsIncidentLoading] = useState(false);

  const [projectError, setProjectError] = useState(true);
  const [incidentTypeError, setIncidentTypeError] = useState(true);

  const context = useProductContext();

  const incidentTypeOptions = [
    { label: "GUIDES & STDS (Re-Work)", value: "GUIDES & STDS (Re-Work)" },
    { label: "DESIGN CRITERIA (Re-Work)", value: "DESIGN CRITERIA (Re-Work)" },
    { label: "QUALITY GATES", value: "QUALITY GATES" },
    { label: "MUA FORMAL (Extra Work)", value: "MUA FORMAL (Extra Work)" },
    { label: "MUA INFORMAL (Extra Work)", value: "MUA INFORMAL (Extra Work)" },
    { label: "SW & HW", value: "SW & HW" },
    { label: "RESOURCES", value: "RESOURCES" },
  ];

  // Incident dropdown only shows for these Extra Work / Re-Work types.
  const showIncident = (incident) =>
    [
      "GUIDES & STDS (Re-Work)",
      "DESIGN CRITERIA (Re-Work)",
      "MUA FORMAL (Extra Work)",
      "MUA INFORMAL (Extra Work)",
    ].includes(incident);

  // Map incident type -> keyword to match in the incident summary.
  const keywordFor = (incidentValue) =>
    incidentValue.includes("Extra Work") ? "Extra Work" : "Re-Work";

  const fetchIssuesByJQL = async (jql) => {
    try {
      const response = await invoke("getIssuesByJQL", { jql });
      return response.issues || [];
    } catch (error) {
      console.error("Error fetching issues:", error);
      return [];
    }
  };

  // Incidents stored in INCENC, linked to a CTEST project by name,
  // filtered by Extra Work / Re-Work keyword in the summary.
  const buildIncidentJQL = (projectValue, keyword) =>
    `"type" = Incident AND "Project Name[Short text]" ~ "${projectValue}" AND summary ~ "${keyword}" AND Project = INCENC ORDER BY key ASC`;

  // Hyphen/space fallback (mirrors the Activity flow in the existing field).
  const fetchIncidents = async (projectValue, keyword) => {
    const original = projectValue;
    const spaced = projectValue.replace(/-/g, " ");

    let issues = await fetchIssuesByJQL(buildIncidentJQL(original, keyword));
    if (issues.length === 0 && original !== spaced) {
      issues = await fetchIssuesByJQL(buildIncidentJQL(spaced, keyword));
    }
    return issues;
  };

  // Load CTEST projects on mount, and restore any saved value.
  useEffect(() => {
    const initialize = async () => {
      const contextData = await view.getContext();
      console.log("FULL CONTEXT:", JSON.stringify(contextData, null, 2));
      const fieldVal = contextData.extension.fieldValue?.toString() || "";
      setRenderContext(contextData.extension.renderContext);
      setValue(fieldVal);

      // Saved format: projectKey##projectName##incidentType##incidentLabel##incidentKey
      const [projectKey, project, incident, incidentLabel, incidentKey] =
        fieldVal.split("##");

      if (incident) {
        const selected = incidentTypeOptions.find(
          (opt) => opt.value === incident,
        );
        if (selected) setIncidentType(selected);
      }

      if (project) {
        setSelectedProject({ label: project, value: project, key: projectKey });
      }

      // Only CTEST projects.
      const projectIssues = await fetchIssuesByJQL(
        `"type" = Project AND Project = CTEST ORDER BY key ASC`,
      );
      setProjectOptions(
        projectIssues.map((issue) => ({
          label: issue.fields.summary,
          value: issue.fields.summary,
          key: issue.key,
        })),
      );

      if (project && incident && showIncident(incident)) {
        const incidents = await fetchIncidents(project, keywordFor(incident));
        const opts = incidents.map((issue) => ({
          label: `${issue.key} | ${issue.fields.summary}`,
          value: issue.key,
        }));
        setIncidentOptions(opts);
        if (incidentKey) {
          const matched = opts.find((opt) => opt.value === incidentKey);
          if (matched) setSelectedIncident(matched);
        }
      }
    };

    initialize();
  }, [context]);

  // Reload incidents when project or incident type changes.
  useEffect(() => {
    const loadIncidents = async () => {
      if (incidentType) setIncidentTypeError(false);
      if (selectedProject) setProjectError(false);

      if (selectedProject && incidentType && showIncident(incidentType.value)) {
        setIsIncidentLoading(true);
        const incidents = await fetchIncidents(
          selectedProject.value,
          keywordFor(incidentType.value),
        );
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
  }, [incidentType, selectedProject]);

  const onSubmit = async () => {
    try {
      setProjectError(false);
      setIncidentTypeError(false);

      if (!selectedProject) {
        setProjectError(true);
        await view.submit(null);
        return;
      }
      if (!incidentType) {
        setIncidentTypeError(true);
        await view.submit(null);
        return;
      }

      const valueToSave =
        `${selectedProject?.key || ""}##${selectedProject?.value || ""}##` +
        `${incidentType?.value || ""}##${selectedIncident?.label || ""}##` +
        `${selectedIncident?.value || ""}`;
      await view.submit(valueToSave);
    } catch (e) {
      console.error("Submit error:", e);
    }
  };

  const handleProjectChange = useCallback((option) => {
    setSelectedProject(option);
    setSelectedIncident(null);
    setIncidentOptions([]);
    setProjectError(false);
  }, []);

  const handleIncidentTypeChange = useCallback((option) => {
    setIncidentType(option);
    setSelectedIncident(null);
    setIncidentOptions([]);
    setIncidentTypeError(false);
  }, []);

  const handleIncidentChange = useCallback((option) => {
    setSelectedIncident(option);
  }, []);

  return (
    <CustomFieldEdit onSubmit={onSubmit} hideActionButtons>
      <Label>
        Project <RequiredAsterisk />
      </Label>
      <Select
        placeholder="Select Project ..."
        options={projectOptions}
        onChange={handleProjectChange}
        value={selectedProject}
        isLoading={projectOptions.length === 0}
      />
      {projectError && (
        <ErrorMessage>
          Project is required. Please select a project.
        </ErrorMessage>
      )}
      <HelperMessage>Select a project to view its incidents</HelperMessage>
      <Text></Text>

      <Label>
        Incident Type <RequiredAsterisk />
      </Label>
      <Select
        placeholder="Select Incident Type..."
        options={incidentTypeOptions}
        onChange={handleIncidentTypeChange}
        value={incidentType}
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

      {incidentType?.value && showIncident(incidentType.value) && (
        <>
          <Label>Incident</Label>
          <Select
            placeholder="Select Incident ..."
            options={incidentOptions}
            onChange={handleIncidentChange}
            value={selectedIncident}
            isDisabled={!selectedProject}
            isLoading={isIncidentLoading}
          />
          <HelperMessage>
            Incidents linked to the selected project
          </HelperMessage>
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
