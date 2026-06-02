import React, { useState, useEffect } from "react";
import ForgeReconciler, { Text } from "@forge/react";
import { view } from "@forge/bridge";

const View = () => {
  const [fieldValue, setFieldValue] = useState(null);

  useEffect(() => {
    view.getContext().then((context) => {
      setFieldValue(context.extension.fieldValue);
    });
  }, []);

  // Saved format: projectKey##projectName##incidentType##incidentLabel##incidentKey
  const parts = fieldValue ? fieldValue.split("##") : [];
  const incidentLabel = parts[3];
  const incidentType = parts[2];
  const display = incidentLabel || incidentType || "None";

  return <Text>{display}</Text>;
};

ForgeReconciler.render(
  <React.StrictMode>
    <View />
  </React.StrictMode>,
);
