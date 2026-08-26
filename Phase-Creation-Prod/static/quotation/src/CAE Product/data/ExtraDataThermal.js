export const thermalSaftyInitialJson = {
  module: "Thermal Simulation",
  inputReference: "thermalSimulationInput",
  output: {
    firstLoop: {
      standard: {
        activities: [
          { name: "DATA collect", hours: 5 },
          { name: "Documents creation", hours: 5 },
          { name: "Model generation", hours: 30 },
          { name: "Analysis result (One Simulation)", hours: 1 },
          { name: "Report generation (One Simulation)", hours: 5 },
        ],
        totalHours: 46,
      },
      rfqDvp: {
        activities: [
          { name: "DATA collect", rfq: 5, dvp: 5 },
          { name: "Documents creation", rfq: 5, dvp: 5 },
          { name: "Model generation", rfq: 30, dvp: 30 },
          { name: "Analysis result (One Simulation)", rfq: 0.5, dvp: 0.5 },
          { name: "Report generation (One Simulation)", rfq: 4.25, dvp: 4.25 },
        ],
        total: {
          rfq: 44.75,
          dvp: 44.75,
        },
      },
    },
    nextLoops: {
      standard: {
        activities: [
          { name: "DATA collect", hours: 0 },
          { name: "Documents creation", hours: 1 },
          { name: "Model generation", hours: 20 },
          { name: "Analysis result (One Simulation)", hours: 1 },
          { name: "Report generation (One Simulation)", hours: 2 },
        ],
        totalHours: 24,
      },
      rfqDvp: {
        activities: [
          { name: "DATA collect", rfq: 0, dvp: 0 },
          { name: "Documents creation", rfq: 1, dvp: 1 },
          { name: "Model generation", rfq: 20, dvp: 20 },
          { name: "Analysis result (One Simulation)", rfq: 0.5, dvp: 0.5 },
          { name: "Report generation (One Simulation)", rfq: 1.25, dvp: 1.25 },
        ],
        total: {
          rfq: 22.75,
          dvp: 22.75,
        },
      },
    },
  },
};
