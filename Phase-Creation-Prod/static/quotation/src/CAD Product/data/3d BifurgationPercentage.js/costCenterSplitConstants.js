export const CENTER_SPLIT_MAP = {
  "BCC 100%": { HCC: 0.0, BCC: 1.0 },

  "HCC 10% BCC 90%": { HCC: 0.1, BCC: 0.9 },
  "HCC 20% BCC 80%": { HCC: 0.2, BCC: 0.8 },
  "HCC 30% BCC 70%": { HCC: 0.3, BCC: 0.7 },
  "HCC 40% BCC 60%": { HCC: 0.4, BCC: 0.6 },
  "HCC 50% BCC 50%": { HCC: 0.5, BCC: 0.5 },
  "HCC 60% BCC 40%": { HCC: 0.6, BCC: 0.4 },
  "HCC 70% BCC 30%": { HCC: 0.7, BCC: 0.3 },
  "HCC 80% BCC 20%": { HCC: 0.8, BCC: 0.2 },
  "HCC 90% BCC 10%": { HCC: 0.9, BCC: 0.1 },

  "HCC 100%": { HCC: 1.0, BCC: 0.0 },
};

// safe fallback
export const DEFAULT_CENTER_SPLIT = { HCC: 1.0, BCC: 0.0 }; // Default to "HCC 100%"
