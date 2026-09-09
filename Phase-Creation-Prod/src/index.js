import Resolver from "@forge/resolver";
import api, { storage, route } from "@forge/api";
import pako from "pako";
import { Queue } from "@forge/events";
import { cloneElement } from "react";

const taskQueue = new Queue({ key: "task-queue" });
const updateKPIQueue = new Queue({ key: "kpi-update-queue" });
const updateLogQueue = new Queue({ key: "log-update-queue" });
const updateTodayQueue = new Queue({ key: "update-today-queue" });
const updateQuotationQueue = new Queue({ key: "quotation-update-queue" });
// Step 3b: the overwrite runs here instead of in the button's 25 second window.
const overwriteQueue = new Queue({ key: "overwrite-queue" });

const resolver = new Resolver();
const resolver1 = new Resolver();

function uint8ArrayToBase64(uint8Arr) {
  let CHUNK_SIZE = 0x8000; // To avoid "maximum call stack size exceeded" for large data
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

// Utility functions
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generic retry wrapper for Jira API calls
// Enhanced retry wrapper following Atlassian API Rate Limit best practices
async function retryJiraApiCall(apiCall, maxRetries = 5, baseDelayMs = 10000) {
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      const response = await apiCall();

      if (response.ok || response.status == 400 || response.status == 404) {
        return response;
      }

      const status = response.status;
      console.warn(
        `API call failed with status ${status}. Attempt ${retryCount + 1}/${maxRetries + 1}`,
      );

      // Check if we should retry based on status code
      const shouldRetry =
        (status === 429 || status >= 500) && retryCount < maxRetries;

      if (!shouldRetry) {
        const errorText = await response
          .text()
          .catch(() => "Unable to read response");
        throw new Error(
          `API call failed after ${retryCount + 1} attempts. Final status: ${status} - ${errorText}`,
        );
      }

      // Calculate delay based on response headers and exponential backoff
      let delayMs = baseDelayMs;

      // Check for Retry-After header (rate limiting)
      const retryAfterHeader = response.headers.get("Retry-After");
      if (retryAfterHeader) {
        const retryAfterSeconds = parseInt(retryAfterHeader, 10);
        if (!isNaN(retryAfterSeconds)) {
          delayMs = retryAfterSeconds * 1000; // Convert to milliseconds
          console.log(
            `Rate limited. Using Retry-After header: ${retryAfterSeconds}s`,
          );
        }
      } else {
        // Use exponential backoff with jitter for other errors
        const exponentialDelay = Math.pow(2, retryCount) * baseDelayMs;
        const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
        delayMs = exponentialDelay + jitter;

        // Cap maximum delay at 30 seconds
        delayMs = Math.min(delayMs, 30000);
      }

      retryCount++;
      console.log(
        `Retrying in ${Math.round(delayMs)}ms... (${retryCount}/${maxRetries})`,
      );
      await delay(delayMs);
    } catch (error) {
      // Handle network errors and other exceptions
      console.error(
        `API call attempt ${retryCount + 1} failed:`,
        error.message,
      );

      if (retryCount === maxRetries) {
        throw error;
      }

      // For network errors, use exponential backoff
      const exponentialDelay = Math.pow(2, retryCount) * baseDelayMs;
      const jitter = Math.random() * 0.1 * exponentialDelay;
      const delayMs = Math.min(exponentialDelay + jitter, 30000);

      retryCount++;
      console.log(
        `Network error. Retrying in ${Math.round(delayMs)}ms... (${retryCount}/${maxRetries})`,
      );
      await delay(delayMs);
    }
  }
}

// Helper function to fetch existing linked issues
async function fetchLinkedIssues(issueKey) {
  console.log(`Fetching linked issues for ${issueKey}`);

  const response = await retryJiraApiCall(() =>
    api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }),
  );

  const parentIssue = await response.json();
  const linkedIssues = parentIssue.fields.issuelinks || [];

  return linkedIssues
    .map((link) => {
      if (link.outwardIssue) {
        return {
          key: link.outwardIssue.key,
          summary: link.outwardIssue.fields.summary,
        };
      }
      if (link.inwardIssue) {
        return {
          key: link.inwardIssue.key,
          summary: link.inwardIssue.fields.summary,
        };
      }
      return null;
    })
    .filter(Boolean);
}

async function fetchIssue(issueKey) {
  console.log(`Fetching issue ${issueKey}`);

  const response = await retryJiraApiCall(() =>
    api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }),
  );

  return await response.json();
}

// Helper function to create an issue in Jira
async function createIssue({ projectId, issueTypeId, summary, ...fields }) {
  const issuePayload = {
    fields: {
      project: { id: projectId },
      issuetype: { id: issueTypeId },
      summary,
      ...fields,
    },
  };

  console.log(`Creating issue: ${summary}`);

  const response = await retryJiraApiCall(() =>
    api.asApp().requestJira(route`/rest/api/3/issue`, {
      method: "POST",
      body: JSON.stringify(issuePayload),
      headers: {
        "Content-Type": "application/json",
      },
    }),
  );

  // Read the body once
  let body;
  try {
    body = await response.json();
  } catch (err) {
    // If response is not JSON, fallback to text for debugging
    const text = await response.text().catch(() => "<unable to read body>");
    console.error("Failed to parse JSON response. Raw response:", text);
    throw err;
  }

  console.log("Create Response body:", body);

  if (!response.ok) {
    // Helpful debugging: include status and body
    const errMsg = `Create issue failed: ${response.status} ${response.statusText} - ${JSON.stringify(body)}`;
    console.error(errMsg);
    throw new Error(errMsg);
  }

  return body;
}

// Helper function to link issues in Jira with dedicated retry logic
async function linkIssues({ inwardIssueKey, outwardIssueKey }, maxRetries = 3) {
  const linkPayload = {
    type: { name: "Hierarchy link (WBSGantt)" },
    inwardIssue: { key: inwardIssueKey },
    outwardIssue: { key: outwardIssueKey },
  };

  let lastError = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      console.log(
        `Linking issues: ${inwardIssueKey} -> ${outwardIssueKey} (Attempt ${retryCount + 1}/${maxRetries + 1})`,
      );

      // Add delay before linking to ensure the issue is indexed in Jira
      await delay(1200);

      const response = await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issueLink`, {
          method: "POST",
          body: JSON.stringify(linkPayload),
          headers: { "Content-Type": "application/json" },
        }),
      );

      // Validate the response
      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "Unable to read error response");
        throw new Error(
          `Failed to link. Status: ${response.status} - ${errorText}`,
        );
      }

      console.log(
        `Successfully linked: ${inwardIssueKey} -> ${outwardIssueKey}`,
      );
      return response;
    } catch (error) {
      lastError = error;
      retryCount++;

      if (retryCount <= maxRetries) {
        // Calculate exponential backoff: 2s, 4s, 8s
        const delayMs = Math.pow(2, retryCount) * 1000;
        console.warn(
          `Linking failed (Attempt ${retryCount}/${maxRetries + 1}): ${error.message}. Retrying in ${delayMs}ms...`,
        );
        await delay(delayMs);
      }
    }
  }

  // All retries exhausted
  const errMsg = `Failed to link ${inwardIssueKey} -> ${outwardIssueKey} after ${maxRetries + 1} attempts. Final error: ${lastError.message}`;
  console.error(errMsg);
  throw new Error(errMsg);
}

async function updateIssueWithRetry(issueKey, fieldsToUpdate) {
  console.log(`Updating issue ${issueKey}`);

  const response = await retryJiraApiCall(() =>
    api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: fieldsToUpdate,
      }),
    }),
  );

  return response;
}
function getKeyBySummary(data, summary) {
  const item = data.find((obj) => obj.summary.includes(summary));
  return item ? item.key : null;
}

const calculateAndUpdateField = async (parentIssueKey) => {
  try {
    // Step 1: Fetch the parent issue data (to get linked issues)
    console.log(
      `Calculating and updating field for parent issue: ${parentIssueKey}`,
    );

    const parentIssueResponse = await retryJiraApiCall(() =>
      api
        .asApp()
        .requestJira(
          route`/rest/api/3/issue/${parentIssueKey}?fields=issuelinks`,
          {
            method: "GET",
          },
        ),
    );

    if (!parentIssueResponse.ok) {
      throw new Error(
        `Failed to fetch parent issue data: ${parentIssueResponse.status}`,
      );
    }

    const parentIssueData = await parentIssueResponse.json();
    const issueLinks = parentIssueData.fields.issuelinks || [];

    // Step 2: Filter outward issues
    const outwardIssues = issueLinks
      .filter((link) => link.outwardIssue)
      .map((link) => link.outwardIssue.key);

    if (outwardIssues.length === 0) {
      console.log("No outward issues found for calculateAndUpdateField.");
      return 0; // FIXED: Return 0 instead of undefined
    }

    console.log(`Found ${outwardIssues.length} child issues to calculate from`);

    // Step 3: Fetch all 4 standard hour field values for each outward issue
    let totals = {
      customfield_10075: 0, // COO
      customfield_10076: 0, // DE
      customfield_10077: 0, // TDL
      customfield_10061: 0, // Total Standard
    };

    for (const issueKey of outwardIssues) {
      const issueResponse = await retryJiraApiCall(() =>
        api
          .asApp()
          .requestJira(
            route`/rest/api/3/issue/${issueKey}?fields=customfield_10075,customfield_10076,customfield_10077,customfield_10061`,
            {
              method: "GET",
            },
          ),
      );

      if (issueResponse.ok) {
        const issueData = await issueResponse.json();
        const fields = issueData.fields;
        totals.customfield_10075 += fields.customfield_10075 || 0;
        totals.customfield_10076 += fields.customfield_10076 || 0;
        totals.customfield_10077 += fields.customfield_10077 || 0;
        totals.customfield_10061 += fields.customfield_10061 || 0;
        console.log(
          `Issue ${issueKey} - Standard Hours: ${fields.customfield_10061}`,
        );
      } else {
        console.error(
          `Failed to fetch data for issue ${issueKey}: ${issueResponse.status}`,
        );
      }
    }
    console.log(
      `Total sum of child standard hours: ${totals.customfield_10061}`,
    );

    // Step 4: Update the parent issue fields with the sums
    const updateResponse = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${parentIssueKey}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            customfield_10075:
              Number(totals.customfield_10075?.toFixed(1)) || null,
            customfield_10076:
              Number(totals.customfield_10076?.toFixed(1)) || null,
            customfield_10077:
              Number(totals.customfield_10077?.toFixed(1)) || null,
            customfield_10061:
              Number(totals.customfield_10061?.toFixed(1)) || null,
          },
        }),
      }),
    );

    if (!updateResponse.ok) {
      throw new Error(
        `Failed to update parent issue field: ${updateResponse.status}`,
      );
    }

    console.log(
      `Successfully updated parent issue ${parentIssueKey} with total sum: ${totals.customfield_10061}`,
    );
  } catch (error) {
    console.error("Error in calculateAndUpdateField:", error);
  }
};

function calculateSumsWithTotalCAE(data) {
  /**
   * Normalizes CAE activity data and ensures the 'standard' and 'total'
   * fields are correctly summed from TDL, COO, and DE.
   */
  if (!data) return {};

  Object.keys(data).forEach((activityKey) => {
    const activity = data[activityKey];

    if (typeof activity === "object" && activity !== null) {
      const tdl = activity.TDL || 0;
      const coo = activity.COO || 0;
      const de = activity.DE || 0;

      const standard = tdl + coo + de;

      // Update the activity object with the calculated sums
      activity.standard = standard;
      activity.total = standard;
    }
  });

  return data;
}

// Helper function to calculate TDL, COO, DE depending on Part Name selection
function calculateSumsWithTotal(data, keysToConsider) {
  Object.keys(data).forEach((section) => {
    // Filter keys to check for existence
    const validKeys = keysToConsider.filter((key) => data[section][key]);

    if (validKeys.length === 0) {
      console.warn(`No valid keys found for section: ${section}`);
      return; // Skip this section
    }

    let totals = { TDL: 0, DE: 0, COO: 0 };

    validKeys.forEach((key) => {
      const part = data[section][key];
      totals.TDL += part.TDL || 0;
      totals.DE += part.DE || 0;
      totals.COO += part.COO || 0;
    });

    // Calculate total and standard
    // const total = totals.TDL + totals.DE + totals.COO;
    // const standard = total;
    const standard = totals.TDL + totals.DE + totals.COO;
    const total = 0;

    // Update the totals in the section
    data[section].TDL = totals.TDL;
    data[section].DE = totals.DE;
    data[section].COO = totals.COO;
    data[section].total = total;
    data[section].standard = standard;

    // if()
  });

  return data;
}

// Resolver to get stored data
resolver.define("getData", async ({ payload }) => {
  const { issueKey, phase } = payload;
  const storedData = await storage.get(`${issueKey}_${phase}`);
  // console.log(`Retrieving Data for issueKey: ${issueKey}`);
  return storedData || null;
});

resolver.define("setData", async ({ payload }) => {
  // Push the task to the queue
  await taskQueue.push(payload);
  return { success: true, message: "Task has been queued for processing." };
});

// Resolver to handle data from UI and create/link issues
resolver1.define("create-activity", async ({ payload }) => {
  const { issueKey, base64Data } = payload;

  // Save data in Forge storage

  // Decompress and parse the data
  const compressedData = Buffer.from(base64Data, "base64");
  const jsonString = pako.inflate(compressedData, { to: "string" });
  const data = JSON.parse(jsonString);

  const {
    phaseName,
    extraWork,
    milestones,
    activities,
    totalHours,
    _3DModification,
    _2DModification,
    dataManagement,
  } = data;
  await storage.set(`${issueKey}_${phaseName.value}`, base64Data);
  await storage.set(`${issueKey}_Industrialization_${phaseName.value}`, {
    _3DModification,
    _2DModification,
    dataManagement,
  });

  console.log(JSON.stringify(activities));
  console.log("phase :", phaseName);
  // Fetch parent issue details

  // const parentIssueResponse = await fetchIssue(issueKey);
  const parentIssueResponse = await retryJiraApiCall(() =>
    api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }),
  );

  if (!parentIssueResponse.ok) {
    throw new Error(
      `Failed to fetch parent issue: ${parentIssueResponse.status}`,
    );
  }

  const parentIssue = await parentIssueResponse.json();

  const projectId = parentIssue.fields.project.id;
  const productParts = parentIssue.fields["customfield_10074"].map(
    (element) => element.value,
  );

  // console.log(`Parent Issue Fetched: ${JSON.stringify(parentIssue)}`);
  let existingIssues = await fetchLinkedIssues(issueKey);
  console.log(existingIssues);

  const linkKey = getKeyBySummary(existingIssues, phaseName.value);
  const updateResponse = await retryJiraApiCall(() =>
    api.asApp().requestJira(route`/rest/api/3/issue/${linkKey}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          customfield_10061: Number(totalHours?.toFixed(1)),
        },
      }),
    }),
  );
  existingIssues = await fetchLinkedIssues(linkKey);

  // return
  // Process checked milestones only
  for (const [milestoneKey, { order, checked, loops }] of Object.entries(
    milestones,
  )) {
    if (!checked) continue; // Skip unchecked milestones

    const [milestone0, milestone1] = milestoneKey.split("|");
    for (let loop = 1; loop <= loops; loop++) {
      const summary = `${order} ${milestone0} | ${milestone1} | Loop ${loop}`;
      // Check if the activity already exists
      if (existingIssues.some((issue) => issue.summary === summary)) {
        console.log(`Skipping existing activity: ${summary}`);
        continue; // Skip already existing activities
      }

      try {
        // Create milestone issue for each loop
        const createdIssue = await createIssue({
          projectId,
          issueTypeId: "10012", // Replace with your milestone issue type ID
          summary,
          customfield_10078: issueKey, // Project Key
        });

        console.log(`Created Milestone Issue: ${createdIssue.key}`);

        // Link the created issue to the parent issue
        await linkIssues({
          inwardIssueKey: linkKey,
          outwardIssueKey: createdIssue.key,
        });

        await delay(500);
      } catch (error) {
        console.error(
          `Failed to create/link milestone: ${summary}, Error: ${error.message}`,
        );
        continue;
      }
    }
  }

  function generateADF(jsonData, parts, phase) {
    let subactivitySummary = {};

    // Process only the selected parts
    parts.forEach((part) => {
      if (jsonData[part] && jsonData[part].subactivity) {
        Object.entries(jsonData[part].subactivity).forEach(
          ([subactivity, values]) => {
            const key = subactivity.trim();
            if (!subactivitySummary[key]) {
              subactivitySummary[key] = {
                Loop: parseInt(values[phase]) || 0,
                DE: 0,
                COO: 0,
                TDL: 0,
                order: parseInt(values.order) || 999, // Default high order if missing
              };
            }
            subactivitySummary[key].DE += values.DE || 0;
            subactivitySummary[key].COO += values.COO || 0;
            subactivitySummary[key].TDL += values.TDL || 0;
          },
        );
      }
    });

    // If no subactivities exist, return a simple ADF message
    if (Object.keys(subactivitySummary).length === 0) {
      return {
        version: 1,
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "No subactivities available for the selected parts.",
              },
            ],
          },
        ],
      };
    }

    // Convert to array and sort by "order"
    let sortedSubactivities = Object.entries(subactivitySummary)
      .map(([subactivity, values]) => ({
        Subactivity: subactivity,
        ...values,
      }))
      .sort((a, b) => a.order - b.order);

    // Construct ADF table structure with correct attributes
    let adfTable = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "table",
          attrs: {
            isNumberColumnEnabled: false,
            layout: "default",
            localId: "2ca1f4d9-6184-4646-beaa-248b4da684f6",
            width: 760,
          },
          content: [
            // Group Headers
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  attrs: { colspan: 1 },
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: { colspan: 4 },
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Standard" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: { colspan: 4 },
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Quoted" }],
                    },
                  ],
                },
              ],
            },
            // Sub-Headers
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Subactivity" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Loop" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "DE" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "COO" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "TDL" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Loop" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "DE" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "COO" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "TDL" }],
                    },
                  ],
                },
              ],
            },
            // Table Data Rows
            ...sortedSubactivities.map((values) => ({
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: values.Subactivity }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "1" }],
                    },
                  ],
                }, // Standard Loop is always 1
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: values.DE.toFixed(2) }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: values.COO.toFixed(2) }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: values.TDL.toFixed(2) }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: values.Loop.toString() }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: (values.DE * values.Loop).toFixed(2),
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: (values.COO * values.Loop).toFixed(2),
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  attrs: {},
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: (values.TDL * values.Loop).toFixed(2),
                        },
                      ],
                    },
                  ],
                },
              ],
            })),
          ],
        },
        {
          type: "paragraph",
          content: [],
        },
      ],
    };

    return adfTable;
  }

  async function updateOutwardIssueCount(issueKey, customFieldId) {
    try {
      // Fetch outward issues count
      const response = await retryJiraApiCall(() =>
        api
          .asApp()
          .requestJira(route`/rest/api/3/issue/${issueKey}?fields=issuelinks`, {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
      );

      const data = await response.json();
      if (!data.fields.issuelinks) return;

      // Count only outward issues of type "Hierarchy link (WBSGantt)"
      const outwardIssuesCount = data.fields.issuelinks.filter(
        (link) =>
          link.type.name === "Hierarchy link (WBSGantt)" && link.outwardIssue,
      ).length;

      // Update the issue with outward issues count
      await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            fields: {
              [customFieldId]: outwardIssuesCount - 1,
            },
          }),
        }),
      );

      console.log(
        `Updated issue ${issueKey} with outward issues count: ${outwardIssuesCount}`,
      );
    } catch (error) {
      console.error(
        `Error updating outward issue count for ${issueKey}:`,
        error,
      );
    }
  }

  // Common logic to handle loops for Standard, Extra Work, and Rework
  async function processLoops(
    loopType,
    startLoop,
    loopCount,
    additionalProps,
    type,
  ) {
    let nextLoopNumber = startLoop; // Start from the provided startLoop

    for (let loop = 1; loop <= loopCount; loop++) {
      const currentLoop = ++nextLoopNumber; // Increment the loop number for each iteration
      let activitySummary =
        `${additionalProps.order} | ${additionalProps.activity0} | ${additionalProps.activity1} | ${type} ${currentLoop}  ${loopType}`.trim();

      // Check if the activity already exists
      if (
        additionalProps.existingIssues.some(
          (issue) => issue.summary === activitySummary,
        )
      ) {
        // let iss=additionalProps.existingIssues.find((issue) => issue.summary === activitySummary)
        console.log(`Skipping existing activity: ${activitySummary}`);
        continue; // Skip already existing activities
      }

      if (activitySummary.includes("ITERATIONS | ITERATIONS"))
        activitySummary =
          `000 | ${additionalProps.activity0} | ${additionalProps.activity1} | ${type} ${currentLoop}  ${loopType}`.trim();
      try {
        // Create the Activity issue
        console.log(activities[additionalProps.activityKey]);
        console.log({
          projectId: additionalProps.projectId,
          issueTypeId: "10008", // Replace with your activity issue type ID
          summary: activitySummary,
          customfield_10078: additionalProps.issueKey,
          customfield_10059:
            activitySummary.includes("| 2D Drawing") ||
            activitySummary.includes("| 2D DELIVERABLES")
              ? additionalProps.loop
              : null,
          customfield_10970: additionalProps.phase,
          description: generateADF(
            activities[additionalProps.activityKey],
            productParts,
            additionalProps.phase,
          ),
          assignee: {
            id:
              additionalProps.parentIssue.fields["customfield_10045"][0][
                "accountId"
              ] || null,
          },
        });
        const createdActivity = await createIssue({
          projectId: additionalProps.projectId,
          issueTypeId: "10008", // Replace with your activity issue type ID
          summary: activitySummary,
          customfield_10078: additionalProps.issueKey,
          customfield_10059:
            activitySummary.includes("| 2D Drawing") ||
            activitySummary.includes("| 2D DELIVERABLES")
              ? `${additionalProps.loop}`
              : null,
          customfield_10970: additionalProps.phase,
          description: generateADF(
            activities[additionalProps.activityKey],
            productParts,
            additionalProps.phase,
          ),
          assignee: {
            id:
              additionalProps.parentIssue.fields["customfield_10045"][0][
                "accountId"
              ] || null,
          },
        });

        console.log(`Created Activity Issue: ${createdActivity.key}`);

        // Link the created Activity to the parent issue
        await linkIssues({
          inwardIssueKey: additionalProps.linkKey,
          outwardIssueKey: createdActivity.key,
          linkTypeName: "Hierarchy link (WBSGantt)",
        });
        if (type == "Iter")
          await updateOutwardIssueCount(
            additionalProps.linkKey,
            "customfield_10607",
          );

        // Create Work Order (WO) linked to the Activity
        const woSummary =
          `${additionalProps.order} | ${additionalProps.activity0} | ${additionalProps.activity1} | ${type} ${currentLoop} | WO1 ${loopType}`.trim();
        const createdWO = await createIssue({
          projectId: additionalProps.projectId,
          issueTypeId: "10009", // Replace with your Work Order issue type ID
          summary: woSummary,
          customfield_10078: additionalProps.issueKey,
          customfield_10970: additionalProps.phase,
          assignee: {
            id:
              woSummary.includes("2D Drawing") ||
              woSummary.includes("2D DELIVERABLES")
                ? additionalProps.parentIssue.fields["customfield_10079"][0][
                    "accountId"
                  ] || null
                : additionalProps.parentIssue.fields["customfield_10046"][0][
                    "accountId"
                  ] || null,
          },
        });

        console.log(`Created WO Issue: ${createdWO.key}`);

        await linkIssues({
          inwardIssueKey: createdActivity.key,
          outwardIssueKey: createdWO.key,
          linkTypeName: "Hierarchy link (WBSGantt)",
        });

        // Create Task linked to the Work Order
        const taskSummary =
          `${additionalProps.order} | ${additionalProps.activity0} | ${additionalProps.activity1} | ${type} ${currentLoop} | WO1 | Task 1 ${loopType}`.trim();
        const createdTask = await createIssue({
          projectId: additionalProps.projectId,
          issueTypeId: "10005", // Replace with your Task issue type ID
          summary: taskSummary,
          customfield_10078: additionalProps.issueKey,
          customfield_10970: additionalProps.phase,
          assignee: {
            id:
              taskSummary.includes("2D Drawing") ||
              taskSummary.includes("2D DELIVERABLES")
                ? additionalProps.parentIssue.fields["customfield_10080"][0][
                    "accountId"
                  ] || null
                : additionalProps.parentIssue.fields["customfield_10047"][0][
                    "accountId"
                  ] || null,
          },
        });

        console.log(`Created Task Issue: ${createdTask.key}`);

        await linkIssues({
          inwardIssueKey: createdWO.key,
          outwardIssueKey: createdTask.key,
          linkTypeName: "Hierarchy link (WBSGantt)",
        });

        // FIXED: Sequential delay to prevent overwhelming Jira
        await delay(1000);
      } catch (error) {
        console.error(
          `Failed to process ${loopType} activity: ${activitySummary}, Error: ${error.message}`,
        );
        continue;
      }
    }
  }

  // Main logic
  for (let [
    activityKey,
    {
      order,
      checked,
      standardLoop,
      extraWorkLoop,
      reWorkLoop,
      caeIterationLoop,
      TDL,
      COO,
      DE,
      standard,
      loop,
    },
  ] of Object.entries(activities)) {
    if (
      !checked &&
      standardLoop === 0 &&
      extraWorkLoop === 0 &&
      reWorkLoop === 0 &&
      !caeIterationLoop
    )
      continue;

    if (!order) order = "";
    const [activity0, activity1] = activityKey.split("|");

    const activityGroupSummary = `Group ${order} | ${activity0} | ${activity1}`;
    const iterationGroupSummary = "ITERATIONS | ITERATIONS";
    // Check if the specific "Activity Group" already exists
    let activityGroupIssue = existingIssues.find(
      (issue) => issue.summary === activityGroupSummary,
    );
    let iterationGroup = existingIssues.find((issue) =>
      issue.summary.includes(iterationGroupSummary),
    );
    if (!activityGroupIssue) {
      // Create "Activity Group" issue if not exists
      activityGroupIssue = await createIssue({
        projectId,
        issueTypeId: "10019", // Replace with your Activity Group issue type ID
        summary: activityGroupSummary,
        customfield_10078: issueKey,
        customfield_10075: standardLoop != 0 ? Number(COO?.toFixed(1)) : null,
        customfield_10076: standardLoop != 0 ? Number(DE?.toFixed(1)) : null,
        customfield_10077: standardLoop != 0 ? Number(TDL?.toFixed(1)) : null,
        customfield_10061:
          standardLoop != 0 ? Number(standard?.toFixed(1)) : null,
        customfield_10970: phaseName.value,
      });
      if (activityGroupSummary.includes(iterationGroupSummary))
        iterationGroup = activityGroupIssue;
      console.log(`Created Activity Group Issue: ${activityGroupIssue.key}`);
      try {
        await linkIssues({
          inwardIssueKey: linkKey,
          outwardIssueKey: activityGroupIssue.key,
        });
      } catch (error) {
        console.error(
          `Failed to link Activity Group ${activityGroupIssue.key} to parent: ${error.message}`,
        );
        // Continue despite linking error to allow other activities to be processed
      }
    } else {
      console.log(
        `Activity Group Issue already exists: ${activityGroupIssue.key}`,
      );
      const updateResponse = await retryJiraApiCall(() =>
        api
          .asApp()
          .requestJira(route`/rest/api/3/issue/${activityGroupIssue.key}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                customfield_10061:
                  standardLoop != 0 ? Number(standard?.toFixed(1)) : null,
              },
            }),
          }),
      );
      console.log("updated STandard at Group");
    }
    const additionalProps = {
      activityKey,

      order,
      activity0,
      activity1,
      existingIssues,
      projectId,
      TDL,
      COO,
      DE,
      standard,
      issueKey,
      parentIssue,
      // linkKey,
      linkKey: activityGroupIssue.key,
      iterationKey: caeIterationLoop ? iterationGroup.key : null,
      phase: phaseName.value,
      loop,
    };

    console.log("successs->>>>>>");

    let existingIssuesGroup = await fetchLinkedIssues(additionalProps.linkKey);
    let existingIterationIssuesGroup = caeIterationLoop
      ? await fetchLinkedIssues(additionalProps.iterationKey)
      : [];
    console.log("successs->>>>>>");

    // Filter existing issues for the current activity
    const filteredIssues = existingIssuesGroup.filter((issue) =>
      issue.summary.includes(`${activity0} | ${activity1}`),
    );
    // Calculate starting loop numbers dynamically based on filtered issues
    const totalExtraWork = filteredIssues.filter((issue) =>
      issue.summary.includes("Extra Work"),
    ).length; //1
    const totalReWork = filteredIssues.filter((issue) =>
      issue.summary.includes("Re-Work"),
    ).length; //1
    // const totalStandard = filteredIssues.filter((issue) => issue.summary.includes("Standard")).length;//1
    const totalStandard = filteredIssues.length - totalExtraWork - totalReWork; //1

    // Process Standard Loops
    await processLoops(
      "",
      totalStandard,
      standardLoop - totalStandard,
      additionalProps,
      "Loop",
    );

    // Process Extra Work Loops
    await processLoops(
      "| Extra Work",
      standardLoop + totalExtraWork + totalReWork,
      extraWorkLoop - totalExtraWork,
      additionalProps,
      "Loop",
    );

    // Process Rework Loops
    await processLoops(
      "| Re-Work",
      standardLoop +
        totalExtraWork +
        totalReWork +
        (extraWorkLoop - totalExtraWork),
      reWorkLoop - totalReWork,
      additionalProps,
      "Loop",
    );
    if (caeIterationLoop)
      await processLoops(
        "",
        0,
        caeIterationLoop,
        {
          ...additionalProps,
          linkKey: additionalProps.iterationKey,
          existingIssues: existingIterationIssuesGroup,
        },
        "Iter",
      );

    // FIXED: Sequential delay between activities
    await delay(1000);
  }

  const result = await calculateAndUpdateField(issueKey);

  return {
    success: true,
    message: `Phase "${phaseName}" created successfully with linked issues under parent issue ${issueKey}.`,
  };
});

// Resolver to return a simple message
resolver.define("getText", (req) => {
  console.log(req);
  return "Hello, world!";
});

resolver.define("projectSettingsFunction", async (req) => {
  const projectId = req.context.projectId; // Get the project ID from context

  try {
    // Fetch project details from Jira REST API
    const projectResponse = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/project/${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    if (!projectResponse.ok) {
      throw new Error(
        `Failed to fetch project details: ${projectResponse.status}`,
      );
    }

    const projectDetails = await projectResponse.json();

    return {
      message: `Welcome to the Project Settings Page for ${projectDetails.name}`,
      projectDetails,
    };
  } catch (error) {
    console.error(`Error fetching project details: ${error.message}`);
    throw error;
  }
});

// Key to store the product data
const STORAGE_KEY = "product-data";

// Default product data structure
const defaultProductData = {};

// Retrieve product data from Forge Storage
resolver.define("getProductData", async () => {
  let data = await storage.get(STORAGE_KEY);
  if (!data) {
    // If no data is stored, initialize with default
    data = defaultProductData;
    await storage.set(STORAGE_KEY, data);
  }
  return data;
});

// Update product data in Forge Storage
resolver.define("updateProductData", async ({ payload }) => {
  const { updatedData } = payload;
  if (!updatedData) {
    throw new Error("No data provided for update");
  }

  await storage.set(STORAGE_KEY, updatedData);
  return { success: true };
});

//////
///ProcessJSONwithPhase
//////
/// OLD
// function processJsonWithPhase(data, phase) {
//   /**
//    * Processes the JSON data by multiplying the selected Phase value (Proto or Serie)
//    * with TDL, COO, and DE values.
//    */

//   // Read JSON file

//   Object.keys(data).forEach(activityKey => {
//     let activityData = data[activityKey];

//     Object.keys(activityData).forEach(roof => {
//       let roofData = activityData[roof];

//       if (typeof roofData === 'object' && 'TDL' in roofData) {
//         if ('subactivity' in roofData && Object.keys(roofData['subactivity']).length > 0) {
//           // Reset roof type values and compute only from subactivities
//           roofData['TDL'] = 0;
//           roofData['COO'] = 0;
//           roofData['DE'] = 0;

//           Object.keys(roofData['subactivity']).forEach(subactivityKey => {
//             let subData = roofData['subactivity'][subactivityKey];
//             let multiplier = subData[phase] || 0;

//             roofData['TDL'] += subData['TDL'] * multiplier;
//             roofData['COO'] += subData['COO'] * multiplier;
//             roofData['DE'] += subData['DE'] * multiplier;
//           });
//         } else {
//           let multiplier = roofData[phase] || 0;
//           data[activityKey]["loop"] = multiplier;

//           roofData['TDL'] *= multiplier;
//           roofData['COO'] *= multiplier;
//           roofData['DE'] *= multiplier;
//         }
//       }
//     });
//   });

//   // return the Phase
//   return data;
// }

function processJsonWithPhaseCAE(data, phase) {
  /**
   * Processes CAE JSON data by multiplying TDL, COO, and DE values
   * by the multiplier factor of the selected phase (Proto or Serie).
   */
  if (!data) return {};

  Object.keys(data).forEach((activityKey) => {
    const activity = data[activityKey];

    if (typeof activity === "object" && activity !== null) {
      // Handle both "Proto"/"Serie" and "proto"/"serie" keys
      const phaseKey = phase;
      const phaseKeyLower = phase.toLowerCase();

      // Determine multiplier: use the phase value if it exists, otherwise default to 1
      const multiplier =
        activity[phaseKey] !== undefined
          ? activity[phaseKey]
          : activity[phaseKeyLower] !== undefined
            ? activity[phaseKeyLower]
            : 1;

      const loops =
        activity["noOfLoops"] !== undefined ? activity["noOfLoops"] : 1;

      // Multiply the core hour components
      if ("TDL" in activity)
        activity.TDL = (activity.TDL || 0) * multiplier * loops;
      if ("COO" in activity)
        activity.COO = (activity.COO || 0) * multiplier * loops;
      if ("DE" in activity)
        activity.DE = (activity.DE || 0) * multiplier * loops;

      // Update the standard total based on the new multiplied values
      activity.standard =
        (activity.TDL || 0) + (activity.COO || 0) + (activity.DE || 0);

      // Sync total with standard
      activity.total = activity.standard;
    }
  });

  return data;
}

/// NEW
function processJsonWithPhase(data, phase) {
  /**
   * Processes the JSON data by multiplying the selected Phase value (Proto or Serie)
   * with TDL, COO, and DE values.
   */

  // Read JSON file

  Object.keys(data).forEach((activityKey) => {
    let activityData = data[activityKey];

    Object.keys(activityData).forEach((roof) => {
      let roofData = activityData[roof];

      if (typeof roofData === "object" && "TDL" in roofData) {
        let noOfComponent = roofData["noOfComponent"] || 1;

        if (Object.hasOwn(roofData, "componentSelected"))
          noOfComponent = roofData["componentSelected"] ? noOfComponent : 0;

        if (
          "subactivity" in roofData &&
          Object.keys(roofData["subactivity"]).length > 0
        ) {
          // Reset roof type values and compute only from subactivities
          roofData["TDL"] = 0;
          roofData["COO"] = 0;
          roofData["DE"] = 0;
          Object.keys(roofData["subactivity"]).forEach((subactivityKey) => {
            let subData = roofData["subactivity"][subactivityKey];
            let multiplier = subData[phase] || 0;

            roofData["TDL"] += subData["TDL"] * multiplier * noOfComponent;
            roofData["COO"] += subData["COO"] * multiplier * noOfComponent;
            roofData["DE"] += subData["DE"] * multiplier * noOfComponent;
          });
        } else {
          let multiplier = roofData[phase] || 0;
          data[activityKey]["loop"] = multiplier;

          roofData["TDL"] *= multiplier * noOfComponent;
          roofData["COO"] *= multiplier * noOfComponent;
          roofData["DE"] *= multiplier * noOfComponent;
        }
      }
    });
  });

  // return the Phase
  return data;
}

function update2DDrawingData(data, values, product, percentages, phase) {
  for (let key in data) {
    for (let drawingKey in values) {
      // Check if the drawingData key exists in drawingDetails key
      if (key.includes(drawingKey)) {
        let value = values[drawingKey]; // Get the respective value from drawingData

        // Update NORMAL ROOF if exists
        if (data[key].hasOwnProperty(product[0])) {
          data[key][product[0]]["TDL"] = parseFloat(
            (
              (data[key][product[0]][phase] *
                value *
                percentages["TDL"] *
                (percentages[phase] / 100)) /
              100
            ).toFixed(2),
          ); // Set COO as 7.5% of DE
          data[key][product[0]]["COO"] = parseFloat(
            (
              (data[key][product[0]][phase] *
                value *
                percentages["COO"] *
                (percentages[phase] / 100)) /
              100
            ).toFixed(2),
          ); // Set COO as 7.5% of DE
          data[key][product[0]]["DE"] = parseFloat(
            (
              (data[key][product[0]][phase] *
                value *
                percentages["DE"] *
                (percentages[phase] / 100)) /
              100
            ).toFixed(2),
          ); // Set COO as 7.5% of DE
          // data[key]["2DLoop"]=data[key][product[0]][phase]
          console.log(key);
        }
      }
    }
  }
  // console.log(data)
  return data;
}

function updateDataManagement(data, values, product, percentages, phase) {
  for (let key in data) {
    // Check if the drawingData key exists in drawingDetails key
    if (
      key.includes("Customer input data management") ||
      key.includes("Data management") ||
      key.includes("Upload & Download customer data")
    ) {
      let value = values; // Get the respective value from drawingData
      console.log(value);
      // Update NORMAL ROOF if exists
      if (data[key].hasOwnProperty(product[0])) {
        data[key][product[0]]["TDL"] = parseFloat(
          (
            (data[key][product[0]][phase] *
              value *
              percentages["TDL"] *
              (percentages[phase] / 100)) /
            100
          ).toFixed(2),
        ); // Set COO as 7.5% of DE
        data[key][product[0]]["COO"] = parseFloat(
          (
            (data[key][product[0]][phase] *
              value *
              percentages["COO"] *
              (percentages[phase] / 100)) /
            100
          ).toFixed(2),
        ); // Set COO as 7.5% of DE
        data[key][product[0]]["DE"] = parseFloat(
          (
            (data[key][product[0]][phase] *
              value *
              percentages["DE"] *
              (percentages[phase] / 100)) /
            100
          ).toFixed(2),
        ); // Set COO as 7.5% of DE
        console.log(
          data[key][product[0]]["TDL"],
          data[key][product[0]]["COO"],
          data[key][product[0]]["DE"],
        );
      }
    }
  }
  return data;
}

function updateIndustrializationValues(
  json1 = {},
  json2 = {},
  detailedJson,
  percentages = {
    _3DModification: 15,
    dataManagement: 15,
    _2DModification: 15,
  },
) {
  // Summing the values of both JSON objects
  let summedJson = {};
  for (let key of new Set([
    ...Object.keys(json1 || {}),
    ...Object.keys(json2 || {}),
  ])) {
    summedJson[key] = (json1?.[key] || 0) + (json2?.[key] || 0);
  }

  // Mapping detailed JSON keys to summedJson keys
  let mappings = {
    "Industrialization | 3D modifications": "_3DModification",
    "Industrialization | Data management": "dataManagement",
    "Industrialization | 2D modifications": "_2DModification",
  };

  // Updating values in the detailed JSON
  for (let key in mappings) {
    let summedValue = summedJson[mappings[key]] || 0;
    let percentage = percentages[mappings[key]] || 0;
    let increment = parseFloat(((percentage / 100) * summedValue).toFixed(2));

    detailedJson[key].standard = increment;
    detailedJson[key].DE = increment;
    // detailedJson[key].total = increment;
  }

  return detailedJson;
}

function updateIndustrializationValuesFromQuotation(
  protoData = {},
  serieData = {},
  detailedJson,
  quotationData,
  percentages = {
    _3DModification: 100,
    dataManagement: 100 / 9,
    _2DModification: 100 / 9, // 11.11% by default
  },
) {
  console.log("Industralization with linked quotation");
  console.log("INDUSTRIALIZATION ... Percentage - INITIAL : ", percentages);

  console.log("INDUSTRIALIZATION - PROTO DATA : \n", protoData);
  console.log("INDUSTRIALIZATION - SERIE DATA : \n", serieData);

  const hasProto = protoData && Object.keys(protoData).length !== 0;
  const hasSerie = serieData && Object.keys(serieData).length !== 0;

  let _2DPercent = 0;
  let dmPercent = 0;

  // Logic to calculate 2D and DM percentages accurately in Work Order tool
  if (hasProto && !hasSerie) {
    _2DPercent = dmPercent = 20; // 20% (1/5 th) when only Proto (Proto - 50%)
  } else if (!hasProto && hasSerie) {
    _2DPercent = 100 / 9; // 11.11% (1/9 th) when only Serie (Serie - 90%)
    dmPercent = 25; // 25% (1/4 th) when only Serie (because of 50:40:10)
  } else if (hasProto && hasSerie) {
    _2DPercent = dmPercent = 100 / 9; // 11.11% (1/9 th) when both Proto & Serie (Proto - 50%, Serie - 40%)
  } else {
    _2DPercent = dmPercent = 100; // 100% when NEITHER Proto nor Serie are present
  }

  percentages._2DModification = _2DPercent;
  percentages.dataManagement = dmPercent;

  console.log("INDUSTRIALIZATION ... Percentage - LATER : ", percentages);

  // Summing the values of both JSON objects for 2D and DM
  let summedJson = {};
  for (let key of new Set([
    ...Object.keys(protoData || {}),
    ...Object.keys(serieData || {}),
  ])) {
    summedJson[key] = (protoData?.[key] || 0) + (serieData?.[key] || 0);
  }

  // Mapping detailed JSON keys to summedJson keys
  let mappings = {
    "Industrialization | 3D modifications": "_3DModification",
    "Industrialization | 2D modifications": "_2DModification",
    "Industrialization | Data management": "dataManagement",
  };

  // Extract 3D modifications standard value from quotation data
  // Based on sample: quotationData["Industrialization"].activities["Industrialization | 3D modifications"].standard
  const quot3DStandard =
    quotationData?.Industrialization?.activities?.[
      "Industrialization | 3D modifications"
    ]?.standard || 0;
  const quotFeasibilityStandard =
    quotationData?.Industrialization?.activities?.[
      "Industrialization | Feasibility"
    ]?.standard || 0;

  // console.log("INDUSTRIALIZATION --> \n 3D Standard : ",quot3DStandard,"\n Feasibility : ",quotFeasibilityStandard)
  for (let key in mappings) {
    let finalValue = 0;
    const mappingKey = mappings[key];

    if (mappingKey === "_3DModification") {
      // Logic for 3D: Percentage of 3D (100%) * (3D modifications activity 'Standard' key value)
      const percentage = percentages["_3DModification"] || 100;
      detailedJson[key].standard = quot3DStandard;
      detailedJson[key].DE =
        quotationData?.Industrialization?.activities?.[
          "Industrialization | 3D modifications"
        ]?.DE;
      detailedJson[key].COO =
        quotationData?.Industrialization?.activities?.[
          "Industrialization | 3D modifications"
        ]?.COO;
      detailedJson[key].TDL =
        quotationData?.Industrialization?.activities?.[
          "Industrialization | 3D modifications"
        ]?.TDL;
      detailedJson[key].total = quot3DStandard;
      detailedJson[key].checked = true;
      detailedJson[key].standardLoop = 1;
    } else {
      // Logic for 2D and DM: Percentage * (Proto + Serie)
      let summedValue = summedJson[mappingKey] || 0;
      let percentage = percentages[mappingKey];
      finalValue = parseFloat(((percentage / 100) * summedValue).toFixed(2));
      detailedJson[key].standard = finalValue;
      detailedJson[key].DE = finalValue;
      detailedJson[key].checked = true;
      detailedJson[key].standardLoop = 1;
    }
  }

  console.log(
    "Updated Industrialization values based on quotation:",
    detailedJson,
  );
  return detailedJson;
}

///need to pass the phase name
/// OLD
// resolver.define('getConfigData', async ({ payload }) => {
//   let { issue, phase, key } = payload;
//   console.log("fetching...")
//   console.log("Key" + key, issue)

//   let base64String = await storage.get(STORAGE_KEY);
//   const uint8Arr = base64ToUint8Array(base64String);
//   const decompressedString = pako.inflate(uint8Arr, { to: 'string' });
//   let data = JSON.parse(decompressedString);
//   let updatedActivities = {}
//   if (key == "Activity") {
//     // let storedActivity=await storage.get(issue.key)
//     // if(storedActivity) return storedActivity
//     const issueDetail = await fetchIssue(issue.key)
//     // console.log(issueDetail)
//     key = issueDetail.fields["customfield_10073"].value;
//     // let customer = issueDetail.fields["customfield_10041"]
//     let customer = issueDetail.fields["customfield_10838"].value

//     const productParts = issueDetail.fields["customfield_10074"].map(element => element.value)
//     // console.log(productParts)
//     console.log("Key" + key)
//     // data=processJsonWithPhase(data,phase)
//     console.log("Phasessss" + phase)

//     if (!key.includes("- CAE")) {
//       updatedActivities = calculateSumsWithTotal(processJsonWithPhase(data[key].activities, phase), productParts);
//       console.log(updatedActivities)
//       let _2DDrawing = data["2D Drawing"].activities[key]
//       let _2DDrawingPercentages = data["2D Drawing"].percentages
//       updatedActivities = calculateSumsWithTotal(update2DDrawingData(data[key].activities, _2DDrawing, productParts, _2DDrawingPercentages, phase), productParts)
//       let _dataManagementTime = data["Data Management"].customers[key][customer] || data["Data Management"].customers[key]["Standard"]
//       let _dataManagementPercentages = data["Data Management"].percentages
//       updatedActivities = calculateSumsWithTotal(updateDataManagement(data[key].activities, _dataManagementTime, productParts, _dataManagementPercentages, phase), productParts)

//       // console.log("_2DDrawing", JSON.stringify(_2DDrawing))
//       if (phase == "Industrialization") {
//         let proto = await storage.get(`${issue.key}_Industrialization_Proto`);
//         let serie = await storage.get(`${issue.key}_Industrialization_Serie`);
//         updatedActivities = updateIndustrializationValues(proto, serie, data["Industrialization"].activities, data["Industrialization"].percentages[key])

//       }
//     }
//     else {
//       updatedActivities = data[key].activities;
//     }

//     console.log(updatedActivities)

//     // console.log(JSON.stringify(updatedActivities))

//   }
//   // console.log(data)
//   if (data) {
//     // console.log(key == "Milestone" ? data[key].milestones : updatedActivities)
//     return key == "Milestone" && phase != "Industrialization" ? data[key].milestones : { product: key, activity: updatedActivities };
//   }
//   return {};

// });

/// NEW
async function computeConfigData(payload) {
  let { issue, phase, key, versionOverride, catalogOverride } = payload;
  // Function-scoped so the return can report which version was actually read.
  let quotationVersion = null;
  console.log("fetching...");
  console.log("Key" + key, issue);

  let base64String = await storage.get(STORAGE_KEY);
  const uint8Arr = base64ToUint8Array(base64String);
  const decompressedString = pako.inflate(uint8Arr, { to: "string" });
  let data = JSON.parse(decompressedString);
  let updatedActivities = {};
  if (key == "Activity") {
    // let storedActivity=await storage.get(issue.key)
    // if(storedActivity) return storedActivity
    const issueDetail = await fetchIssue(issue.key);
    // console.log(issueDetail)
    // The compare can ask for a different catalog entry — "{product} New" —
    // so a Phase Configuration comparison has something to compare against
    // rather than the entry the project was built from.
    key = catalogOverride || issueDetail.fields["customfield_10073"].value;
    // let customer = issueDetail.fields["customfield_10041"]
    let customer = issueDetail.fields["customfield_10838"].value;

    let quotationField = issueDetail.fields["customfield_12738"] || "";

    let projectType = issueDetail.fields["customfield_10052"].value;

    // A catalog comparison is a Phase Configuration comparison: plain 2D Drawing
    // and Data Management, no Quot_WO_ overlay, no BTP quarter.
    const hasQuotationReference = catalogOverride
      ? "No"
      : (issueDetail.fields["customfield_12059"]?.value ?? "No");

    const parts = quotationField.split(" ## ");
    // const quotationSummary = parts[0];
    const quotation = parts[1];
    quotationVersion = versionOverride || parts[2];

    const productParts = issueDetail.fields["customfield_10074"].map(
      (element) => element.value,
    );
    // console.log(productParts)
    console.log("Key" + key);
    // data=processJsonWithPhase(data,phase)
    console.log("Phasessss" + phase);

    // 1. Identify the module type
    const isCAE = key.includes("- CAE");
    const isPS = key.includes("- PS");
    const isCAD = !isCAE && !isPS;

    // 2. Guard clause: CAE and PS only support Proto and Serie phases
    if (
      (isCAE || isPS) &&
      (phase === "Offer" || phase === "Industrialization")
    ) {
      console.warn(
        `Phase '${phase}' is not applicable for ${isCAE ? "CAE" : "PS"}. Only Proto and Serie are allowed.`,
      );
      updatedActivities = {};
    }
    // 3. Handle Offer Phase (Only applicable to CAD)
    else if (phase === "Offer") {
      if (quotation && quotationVersion && hasQuotationReference === "Yes") {
        let quotBase64 = await storage.get(
          `Quot_WO_${key}_${customer}_${quotation}_CAD_${quotationVersion}`,
        );
        if (quotBase64) {
          const uint8Arr = base64ToUint8Array(quotBase64);
          const decompressedString = pako.inflate(uint8Arr, { to: "string" });
          const quotData = JSON.parse(decompressedString);
          updatedActivities = quotData["Offer"]?.activities || {};

          console.log("OFFER PHASE: \n", updatedActivities);
        }
      }

      if (!updatedActivities || Object.keys(updatedActivities).length === 0) {
        console.warn("No Offer activities found in quotation storage");
      }
    }
    // 4. Handle CAE Phase (Proto, Serie)
    else if (isCAE) {
      if (quotation && quotationVersion && hasQuotationReference === "Yes") {
        const baseKey = key.split(" -")[0];
        let base64String = await storage.get(
          `Quot_WO_${baseKey}_${customer}_${quotation}_CAE_${quotationVersion}`,
        );
        if (base64String) {
          const uint8Arr = base64ToUint8Array(base64String);
          const decompressedString = pako.inflate(uint8Arr, { to: "string" });
          console.log("Quotation fetched \n", decompressedString);
          data[key] = JSON.parse(decompressedString);
        }
      }
      if (data[key]?.activities) {
        updatedActivities = calculateSumsWithTotalCAE(
          processJsonWithPhaseCAE(data[key].activities, phase),
        );
      } else {
        updatedActivities = {};
      }
    }
    // 5. Handle CAD/PS Phases (Proto, Serie, or CAD Industrialization)
    else {
      // 5A. Fetch the quotation first (Applies to Proto, Serie, AND Industrialization)
      if (quotation && quotationVersion && hasQuotationReference === "Yes") {
        let base64String;

        if (isCAD) {
          base64String = await storage.get(
            `Quot_WO_${key}_${customer}_${quotation}_CAD_${quotationVersion}`,
          );
        } else if (isPS) {
          const baseKey = key.split(" -")[0];
          base64String = await storage.get(
            `Quot_WO_${baseKey}_${customer}_${quotation}_PS_${quotationVersion}`,
          );
        }

        if (base64String) {
          const uint8Arr = base64ToUint8Array(base64String);
          const decompressedString = pako.inflate(uint8Arr, { to: "string" });
          console.log("Quotation fetched \n", decompressedString);
          data[key] = JSON.parse(decompressedString);
        }
      }

      // 5B. Now execute the phase-specific calculations
      if (phase === "Proto" || phase === "Serie") {
        // Shared processing for CAD & PS
        if (data[key] && data[key].activities) {
          console.log("Hello from ", phase, " for ", key);

          updatedActivities = calculateSumsWithTotal(
            processJsonWithPhase(data[key].activities, phase),
            productParts,
          );

          console.log("Keys: ", Object.keys(data[key]));

          let _2DDrawing = data["2D Drawing"]?.activities?.[key];
          let _2DDrawingPercentages = data["2D Drawing"]?.percentages;

          if (
            quotation &&
            quotationVersion &&
            hasQuotationReference === "Yes"
          ) {
            _2DDrawing =
              data["2D Drawing - Quotation"]?.activities[projectType]?.[key];
            _2DDrawingPercentages = data["2D Drawing - Quotation"]?.percentages;
          }

          if (data[key]["Phases"]) {
            // check if Proto phase is not selected in Quotation
            // adjust Proto 2D percentage into Serie 2D percentage
            if (data[key]["Phases"]["phase_1"] === false) {
              _2DDrawingPercentages.Serie += _2DDrawingPercentages.Proto;
              _2DDrawingPercentages.Proto = 0;
            }
          }

          updatedActivities = calculateSumsWithTotal(
            update2DDrawingData(
              data[key].activities,
              _2DDrawing,
              productParts,
              _2DDrawingPercentages,
              phase,
            ),
            productParts,
          );

          let _dataManagementTime =
            data["Data Management"]?.customers?.[key]?.[customer] ||
            data["Data Management"]?.customers?.[key]?.["Standard"];
          let _dataManagementPercentages = data["Data Management"]?.percentages;

          console.log("DM TIME 1 --> ", _dataManagementTime);

          if (
            quotation &&
            quotationVersion &&
            hasQuotationReference === "Yes"
          ) {
            _dataManagementTime =
              data["Data Management - Quotation"][projectType]?.["customers"]?.[
                key
              ]?.[customer] ||
              data["Data Management - Quotation"][projectType]?.["customers"]?.[
                key
              ]?.["Standard"];
            _dataManagementPercentages =
              data["Data Management - Quotation"]?.percentages;

            // if BTP then 25% ... reference from static/quotation/src/CAD Product/utils/getDataManagementValueBasedOnDevProdCust.js (line 44)
            if (projectType === "BTP")
              _dataManagementTime = _dataManagementTime * 0.25;
          }

          console.log("DM TIME 2 --> ", _dataManagementTime);
          console.log(
            "2D% --> ",
            _2DDrawingPercentages,
            "\nDM% --> ",
            _2DDrawingPercentages,
            "\nPhases : ",
            data[key]["Phases"],
          );

          updatedActivities = calculateSumsWithTotal(
            updateDataManagement(
              data[key].activities,
              _dataManagementTime,
              productParts,
              _dataManagementPercentages,
              phase,
            ),
            productParts,
          );
        }
      }
      // Industrialization logic (Inherently CAD-only due to top-level guard clause)
      else if (phase === "Industrialization") {
        let proto = await storage.get(`${issue.key}_Industrialization_Proto`);
        let serie = await storage.get(`${issue.key}_Industrialization_Serie`);

        if (quotation && quotationVersion && hasQuotationReference === "Yes") {
          // when linked quotation, use new logic

          updatedActivities = updateIndustrializationValuesFromQuotation(
            proto,
            serie,
            data["Industrialization"].activities,
            data[key], // <--- Now `data` is guaranteed to have the fetched quotation!
            data["Industrialization"].percentages[key],
          );

          // add Feasibility activity in Industrialization if exists in quotation
          console.log(
            "Check Industrialization Feasibility in quotation data:",
            Object.hasOwn(
              data[key]["Industrialization"].activities,
              "Industrialization | Feasibility",
            ),
          );
          if (
            Object.hasOwn(
              data[key]["Industrialization"].activities,
              "Industrialization | Feasibility",
            )
          ) {
            updatedActivities["Industrialization | Feasibility"] =
              data[key]["Industrialization"].activities[
                "Industrialization | Feasibility"
              ];
          }
        } else {
          // when no linked quotation, fallback to old logic (based on Proto/Serie sums)
          updatedActivities = updateIndustrializationValues(
            proto,
            serie,
            data["Industrialization"].activities,
            data["Industrialization"].percentages[key],
          );
        }
      }
    }
    console.log(updatedActivities);

    // console.log(JSON.stringify(updatedActivities))
  }
  // console.log(data)
  if (data) {
    // console.log(key == "Milestone" ? data[key].milestones : updatedActivities)
    return key == "Milestone" && phase != "Industrialization"
      ? data[key].milestones
      : {
          product: key,
          activity: updatedActivities,
          quotationVersion: quotationVersion || "Phase Configuration",
        };
  }
  return {};
}

// The body above moved out of the resolver so the quotation compare can call
// it directly — backend code cannot invoke a resolver. Every existing caller
// passes no versionOverride, so the behaviour is unchanged.
resolver.define("getConfigData", async ({ payload }) =>
  computeConfigData(payload),
);

///////////////////////////////////////////////////
// Listener
///////////////////////////////////////////////////

// Fetch parent issue ID
async function fetchParentIssueId(issueId) {
  const issueResponse = await retryJiraApiCall(() =>
    api.asApp().requestJira(route`/rest/api/3/issue/${issueId}`),
  );
  const issueData = await issueResponse.json();

  const inwardLinks = issueData.fields.issuelinks.filter(
    (link) =>
      link.type.name === "Hierarchy link (WBSGantt)" && link.inwardIssue,
  );

  if (inwardLinks.length > 0) {
    return inwardLinks[0].inwardIssue.id;
  } else {
    console.log(`No parent issue (inward link) found for issue: ${issueId}`);
    return null;
  }
}

// Returns true only if EVERY descendant (Activity, Work Order, Task) under
// the given issue is Closed. Used to gate Activity Group DFS + 10971 snapshot.
async function areAllDescendantsClosed(issueKey) {
  let allClosed = true; // assume closed until we find one that isn't
  let descendantCount = 0; // guard against "no children" returning a false true

  async function traverse(key) {
    const res = await retryJiraApiCall(() =>
      api
        .asApp()
        .requestJira(
          route`/rest/api/3/issue/${key}?fields=issuetype,issuelinks,status`,
        ),
    );
    const issue = await res.json();

    // Find child (outward) issues via the WBSGantt hierarchy link
    const childKeys = issue.fields.issuelinks
      .filter(
        (link) =>
          link.type.name === "Hierarchy link (WBSGantt)" && link.outwardIssue,
      )
      .map((link) => link.outwardIssue.key);

    for (const childKey of childKeys) {
      // We only fetch the child's status; the recursive call fetches its links
      const childRes = await retryJiraApiCall(() =>
        api
          .asApp()
          .requestJira(route`/rest/api/3/issue/${childKey}?fields=status`),
      );
      const childIssue = await childRes.json();

      descendantCount++;
      if (childIssue.fields.status.name !== "Closed") {
        allClosed = false;
        return; // short-circuit: one open descendant is enough to fail
      }

      // Recurse into this child's own descendants
      await traverse(childKey);
      if (!allClosed) return; // bubble the short-circuit up
    }
  }

  await traverse(issueKey);

  // If there were no descendants at all, treat as NOT all-closed
  // (an empty Activity Group should not show a DFS%)
  return descendantCount > 0 && allClosed;
}

// Recursive function to propagate updates up the hierarchy
async function propagateActivityHours(currentIssueId, customFieldKey) {
  try {
    // Fetch the current issue details
    const response = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${currentIssueId}`),
    );
    const issueData = await response.json();

    // Find inward issues linked with "Hierarchy link (WBSGantt)"
    const inwardLinks = issueData.fields.issuelinks.filter(
      (link) =>
        link.type.name === "Hierarchy link (WBSGantt)" && link.inwardIssue,
    );

    // Fetch all outward (child) issues for the current issue
    const outwardLinks = issueData.fields.issuelinks.filter(
      (link) =>
        link.type.name === "Hierarchy link (WBSGantt)" && link.outwardIssue,
    );
    const childIssueIds = outwardLinks.map((link) => link.outwardIssue.id);

    // Sum all custom field values under child issues
    let totalLoggedHours = 0;
    for (const childId of childIssueIds) {
      const childIssueResponse = await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issue/${childId}`),
      );
      const childIssueData = await childIssueResponse.json();
      const childHours = childIssueData.fields[customFieldKey] || 0;
      totalLoggedHours += childHours;
    }

    // Update the custom field for the current issue
    // totalLoggedHours=issueData.fields.status.name=="Closed" && customFieldKey=="customfield_10093"?totalLoggedHours:null;
    // totalLoggedHours = customFieldKey == "customfield_10093" ? (issueData.fields.status.name == "Closed" ? totalLoggedHours : null) : totalLoggedHours;

    const updateResponse = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${currentIssueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            [customFieldKey]: Number(totalLoggedHours?.toFixed(1)) || null,
          },
        }),
      }),
    );

    if (updateResponse.ok) {
      console.log(
        `Successfully propagated field ${customFieldKey} for issue: ${currentIssueId}`,
      );
    } else {
      console.error(
        `Failed to propagate field ${customFieldKey}: ${await updateResponse.text()}`,
      );
    }

    // Recur for the parent (inward issue)
    if (inwardLinks.length > 0) {
      const parentIssueId = inwardLinks[0].inwardIssue.id;
      console.log(`Propagating to parent issue: ${parentIssueId}`);
      await propagateActivityHours(parentIssueId, customFieldKey);
    }
  } catch (error) {
    console.error(`Error propagating for issue ${currentIssueId}:`, error);
  }
}
// Recursive function to propagate updates up the hierarchy
async function propagateIterCount(currentIssueId, customFieldKey) {
  try {
    // Fetch the current issue details
    const response = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${currentIssueId}`),
    );
    const issueData = await response.json();

    // Find inward issues linked with "Hierarchy link (WBSGantt)"
    const inwardLinks = issueData.fields.issuelinks.filter(
      (link) =>
        link.type.name === "Hierarchy link (WBSGantt)" && link.inwardIssue,
    );

    // Fetch all outward (child) issues for the current issue
    const outwardLinks = issueData.fields.issuelinks.filter(
      (link) =>
        link.type.name === "Hierarchy link (WBSGantt)" && link.outwardIssue,
    );
    const childIssueIds = outwardLinks.map((link) => link.outwardIssue.id);

    // Sum all custom field values under child issues
    let totalLoggedHours = 0;
    for (const childId of childIssueIds) {
      const childIssueResponse = await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issue/${childId}`),
      );
      const childIssueData = await childIssueResponse.json();
      const childHours = !childIssueData.fields["summary"].includes("ITERATION")
        ? childIssueData.fields[customFieldKey]
        : 0 || 0;
      totalLoggedHours += childHours;
    }

    // Update the custom field for the current issue
    // totalLoggedHours=issueData.fields.status.name=="Closed" && customFieldKey=="customfield_10093"?totalLoggedHours:null;
    // totalLoggedHours = customFieldKey == "customfield_10093" ? (issueData.fields.status.name == "Closed" ? totalLoggedHours : null) : totalLoggedHours;

    const updateResponse = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${currentIssueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            [customFieldKey]: Number(totalLoggedHours?.toFixed(1)) || null,
          },
        }),
      }),
    );

    if (updateResponse.ok) {
      console.log(
        `Successfully propagated field ${customFieldKey} for issue: ${currentIssueId}`,
      );
    } else {
      console.error(
        `Failed to propagate field ${customFieldKey}: ${await updateResponse.text()}`,
      );
    }

    // Recur for the parent (inward issue)
    if (inwardLinks.length > 0) {
      const parentIssueId = inwardLinks[0].inwardIssue.id;
      console.log(`Propagating to parent issue: ${parentIssueId}`);
      await propagateIterCount(parentIssueId, customFieldKey);
    }
  } catch (error) {
    console.error(`Error propagating for issue ${currentIssueId}:`, error);
  }
}

async function propagateActivityHoursBulk(currentIssueId, customFieldKeys) {
  try {
    // Fetch the current issue details
    const response = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${currentIssueId}`),
    );
    const issueData = await response.json();

    // Find inward (parent) and outward (child) issues linked with "Hierarchy link (WBSGantt)"
    const inwardLinks = issueData.fields.issuelinks.filter(
      (link) =>
        link.type.name === "Hierarchy link (WBSGantt)" && link.inwardIssue,
    );
    const outwardLinks = issueData.fields.issuelinks.filter(
      (link) =>
        link.type.name === "Hierarchy link (WBSGantt)" && link.outwardIssue,
    );
    const childIssueIds = outwardLinks.map((link) => link.outwardIssue.id);

    // Initialize an object to store total values for all fields
    const totalValues = {};
    for (const key of customFieldKeys) {
      totalValues[key] = 0;
    }

    // Fetch and sum all custom field values under child issues
    for (const childId of childIssueIds) {
      const childIssueResponse = await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issue/${childId}`),
      );
      const childIssueData = await childIssueResponse.json();

      for (const key of customFieldKeys) {
        totalValues[key] += childIssueData.fields[key] || 0;
      }
    }

    // Prepare update payload
    const fieldsToUpdate = {};
    for (const key of customFieldKeys) {
      fieldsToUpdate[key] = Number(totalValues[key]?.toFixed(1)) || null;
    }

    // Update the custom fields for the current issue
    const updateResponse = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${currentIssueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: fieldsToUpdate }),
      }),
    );

    if (updateResponse.ok) {
      console.log(
        `Successfully propagated fields ${customFieldKeys} for issue: ${currentIssueId}`,
      );
    } else {
      console.error(
        `Failed to propagate fields: ${await updateResponse.text()}`,
      );
    }

    // Recur for the parent (inward issue)
    if (inwardLinks.length > 0) {
      const parentIssueId = inwardLinks[0].inwardIssue.id;
      console.log(`Propagating to parent issue: ${parentIssueId}`);
      await propagateActivityHoursBulk(parentIssueId, customFieldKeys);
    }
  } catch (error) {
    console.error(`Error propagating for issue ${currentIssueId}:`, error);
  }
}

// async function delay(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

export async function enqueueUpdateLog(event, context) {
  console.log("Logged");
  // console.log(event);
  const currentIssueId = await event.worklog.issueId;
  console.log(currentIssueId);
  const issueResponse = await retryJiraApiCall(() =>
    api.asApp().requestJira(route`/rest/api/3/issue/${currentIssueId}`),
  );
  const issueData = await issueResponse.json();
  const projectKey = await issueData.fields.project.key;

  console.log(projectKey);

  if (projectKey === "CTEST") {
    // Dev --> CDEMO // Prod --> CWO // Stage --> CTEST
    let retryCount = 0;
    let success = false;

    while (!success && retryCount < 5) {
      try {
        console.log(
          `🚀 Attempting to enqueue Log update (Try ${retryCount + 1})`,
          event,
        );
        // console.log('🚀 Enqueuing KPI update:', event);
        await updateLogQueue.push(event, context);
        console.log("✅ Successfully enqueued Log update");
        success = true; // Exit loop on success
      } catch (error) {
        // console.error('❌ Error enqueuing KPI update:', error);
        if (error.name === "RateLimitError") {
          console.warn(
            `⚠️ Rate limit reached. Retrying in ${2 ** retryCount} seconds...`,
          );
          await delay(2 ** retryCount * 1000); // Exponential backoff
          retryCount++;
        } else {
          console.error("❌ Error enqueuing Log update:", error);
          break; // Break the loop for non-rate-limit errors
        }
      }
    }
    if (!success) {
      console.error("❌ Failed to enqueue Log update after multiple retries");
    }
  } else {
    console.log("Skip Worklog");
  }
}
export async function updateLog(event, context) {
  let retryCount = 0;
  let success = false;

  while (!success && retryCount < 10) {
    try {
      console.log("Worklog Event:", JSON.stringify(event));

      const issueId = event.call.payload.worklog.issueId; // Current issue ID
      const worklogId = event.call.payload.worklog.id; // Worklog ID
      const customFieldDE = "customfield_10081"; // DE Actual / DE Activity hours
      const customFieldCOO = "customfield_10082"; // COO Act Hours

      const customFieldTDL = "customfield_10083"; // Tdl Act Hrs
      const customFieldExtraWork = "customfield_10084"; // Extra Work
      const customFieldRework = "customfield_10085"; // Rework
      console.log(issueId);

      try {
        // Step 1: Fetch the current issue
        const issueResponse = await retryJiraApiCall(() =>
          api.asApp().requestJira(route`/rest/api/3/issue/${issueId}`),
        );
        const issueData = await issueResponse.json();
        const issueType = issueData.fields.issuetype.name;
        const summary = issueData.fields.summary;

        // Check for [Extra Work] and [Re-Work] in the summary
        const isExtraWork = summary.includes("Extra Work");
        const isRework = summary.includes("Re-Work");

        // Determine the action based on the issue type
        if (issueType === "Task") {
          await handleTaskUpdate(issueId, isExtraWork, isRework);
        } else if (issueType === "Work Order") {
          await handleWorkOrderUpdate(issueId);
        } else if (issueType === "Activity" || issueType === "Activity Group") {
          await handleActivityUpdate(issueId);
        } else {
          console.log(
            `Skipping issue as it's not a relevant type: ${issueType}`,
          );
        }
      } catch (error) {
        console.error("Error processing worklog event:", error);
      }

      // Function to handle Task updates
      async function handleTaskUpdate(issueId, isExtraWork, isRework) {
        console.log(`Handling Task update for issue: ${issueId}`);
        await updateWorklogHours(issueId, customFieldDE);

        // if (isExtraWork) {
        //   console.log(`[Extra Work] detected in summary for Task: ${issueId}`);
        //   await updateWorklogHours(issueId, customFieldExtraWork);
        // }

        // if (isRework) {
        //   console.log(`[Re-Work] detected in summary for Task: ${issueId}`);
        //   await updateWorklogHours(issueId, customFieldRework);
        // }

        const parentIssueId = await fetchParentIssueId(issueId);
        if (parentIssueId) {
          await propagateActivityHours(parentIssueId, customFieldDE);
          if (isExtraWork)
            await propagateActivityHours(parentIssueId, customFieldExtraWork);
          if (isRework)
            await propagateActivityHours(parentIssueId, customFieldRework);
        }
      }

      // Function to handle Work Order updates
      async function handleWorkOrderUpdate(issueId) {
        console.log(`Handling Work Order update for issue: ${issueId}`);
        await updateWorklogHours(issueId, customFieldCOO);
        const parentIssueId = await fetchParentIssueId(issueId);
        if (parentIssueId)
          await propagateActivityHours(parentIssueId, customFieldCOO);
      }

      // Function to handle Activity updates
      async function handleActivityUpdate(issueId) {
        console.log(`Handling Activity update for issue: ${issueId}`);
        await updateWorklogHours(issueId, customFieldTDL);
        const parentIssueId = await fetchParentIssueId(issueId);
        if (parentIssueId)
          await propagateActivityHours(parentIssueId, customFieldTDL);
      }

      // Update worklog hours for the current issue
      async function updateWorklogHours(issueId, customFieldKey) {
        const worklogResponse = await retryJiraApiCall(() =>
          api.asApp().requestJira(route`/rest/api/3/issue/${issueId}/worklog`),
        );
        const worklogData = await worklogResponse.json();

        const totalWorkloggedHours = worklogData.worklogs.reduce(
          (sum, worklog) => sum + worklog.timeSpentSeconds / 3600,
          0,
        );

        const updateResponse = await retryJiraApiCall(() =>
          api.asApp().requestJira(route`/rest/api/3/issue/${issueId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                [customFieldKey]:
                  Number(totalWorkloggedHours?.toFixed(1)) || null,
              },
            }),
          }),
        );

        if (updateResponse.ok) {
          console.log(
            `Successfully updated field ${customFieldKey} for issue: ${issueId}`,
          );
        } else {
          console.error(
            `Failed to update field ${customFieldKey}: ${await updateResponse.text()}`,
          );
        }
      }

      success = true;
    } catch (error) {
      if (error.name === "RateLimitError") {
        console.warn(
          `⚠️ Rate limit reached. Retrying in ${2 ** retryCount} seconds...`,
        );
        await delay(2 ** retryCount * 1000); // Exponential backoff
        retryCount++;
      } else {
        console.error("❌ Error processing Log update:", error);
        break; // Break the loop for non-rate-limit errors
      }
    }
  }
  if (!success) {
    console.error("❌ Failed to process Log update after multiple retries");
  }
}

// function dateDifference(date1, date2) {
//   // Helper function to parse and strip time from a date
//   function getDateOnly(inputDate) {
//     if (!inputDate) {
//       return new Date().setHours(0, 0, 0, 0); // Use today's date with time stripped
//     }
//     const parsedDate = new Date(inputDate);
//     return parsedDate.setHours(0, 0, 0, 0); // Strip time
//   }

//   // Get both dates as timestamp (ignoring time part)
//   const firstDate = getDateOnly(date1);
//   const secondDate = getDateOnly(date2);

//   // Calculate the difference in milliseconds
//   const diffInMs = Math.abs(firstDate - secondDate);

//   // Convert milliseconds to days
//   const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

//   return diffInDays;
// }

// function dateDifference(date1, date2) {
//   // Helper function to parse and strip time from a date
//   function getDateOnly(inputDate) {
//     if (!inputDate) {
//       return new Date(new Date().setHours(0, 0, 0, 0)); // Use today's date with time stripped
//     }
//     const parsedDate = new Date(inputDate);
//     parsedDate.setHours(0, 0, 0, 0); // Strip time
//     return parsedDate; // Return as Date object
//   }

//   // Get both dates as Date objects (ignoring time part)
//   let firstDate = getDateOnly(date1);
//   let secondDate = getDateOnly(date2);

//   // Ensure the start date is the earlier one
//   let start = firstDate < secondDate ? firstDate : secondDate;
//   let end = firstDate > secondDate ? firstDate : secondDate;
//   let count = 0;

//   // Iterate through each day and count only working days (Monday-Friday)
//   while (start <= end) {
//     let day = start.getDay();
//     if (day >= 1 && day <= 5) { // Monday (1) to Friday (5)
//       count++;
//     }
//     start.setDate(start.getDate() + 1);
//   }

//   return count;
// }
// function dateDifference(date1, date2) {
//   function getDateOnly(inputDate) {
//     if (!inputDate) {
//       return new Date(new Date().setHours(0, 0, 0, 0));
//     }
//     let parsedDate = new Date(inputDate.replace(/(\+\d{4})$/, ''));
//     if (isNaN(parsedDate.getTime())) {
//       return null; // Invalid date handling
//     }
//     parsedDate.setHours(0, 0, 0, 0);
//     return parsedDate;
//   }

//   let firstDate = getDateOnly(date1);
//   let secondDate = getDateOnly(date2);
//   if (!firstDate || !secondDate) return null;

//   let start = firstDate < secondDate ? firstDate : secondDate;
//   let end = firstDate > secondDate ? firstDate : secondDate;
//   let count = 0;
//   let tempDate = new Date(start);

//   while (tempDate <= end) {
//     let day = tempDate.getDay();
//     if (day >= 1 && day <= 5) {
//       count++;
//     }
//     tempDate.setDate(tempDate.getDate() + 1);
//   }

//   return count;
// }

function dateDifference(U, V, W, mode = "start") {
  function getDateOnly(inputDate) {
    if (!inputDate) {
      return new Date(new Date().setHours(0, 0, 0, 0));
    }
    let parsedDate = new Date(inputDate.replace(/(\+\d{4})$/, ""));
    if (isNaN(parsedDate.getTime())) {
      return null;
    }
    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate;
  }

  const dateU = getDateOnly(U);
  const dateV = getDateOnly(V);
  const dateW = W ? getDateOnly(W) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!dateU || !dateV) return null;

  let endDate;

  if (W && dateW) {
    endDate = mode === "start" ? dateV : dateW;
  } else if (dateV < today) {
    endDate = mode === "start" ? dateV : today;
  } else {
    return 0;
  }

  let start = dateU < endDate ? dateU : endDate;
  let end = dateU > endDate ? dateU : endDate;
  let count = 0;
  let tempDate = new Date(start);

  while (tempDate <= end) {
    let day = tempDate.getDay();
    if (day >= 1 && day <= 5) {
      count++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }

  return count;
}

export async function enqueueUpdateKPI(event, context) {
  let retryCount = 0;
  let success = false;
  const maxRetries = 5;
  const baseDelayMs = 60000; // 60 seconds base delay

  while (!success && retryCount < maxRetries) {
    try {
      console.log(
        `🚀 Attempting to enqueue KPI update (Try ${retryCount + 1}/${maxRetries})`,
        {
          issueId: event?.call?.payload?.issue?.id || "unknown",
          retryCount,
        },
      );

      await updateKPIQueue.push(event, context);

      console.log("✅ Successfully enqueued KPI update");
      success = true; // Exit loop on success
    } catch (error) {
      console.error("❌ Error enqueuing KPI update:", {
        error: error.message,
        errorName: error.name,
        retryCount: retryCount + 1,
        maxRetries,
      });

      // Check if it's a rate limit error or similar retryable error
      const isRetryableError =
        error.name === "RateLimitError" ||
        error.message?.includes("Too many requests") ||
        error.message?.includes("rate limit") ||
        error.name === "TimeoutError" ||
        error.message?.includes("timeout");

      if (isRetryableError && retryCount < maxRetries - 1) {
        // Calculate delay between 60-180 seconds with jitter
        const minDelay = 60000; // 60 seconds
        const maxDelay = 120000; // 180 seconds
        const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
        const delayMs = Math.round(randomDelay);

        console.warn(
          `⚠️ Rate limit/timeout reached. Retrying in ${Math.round(delayMs / 1000)}s... (${retryCount + 1}/${maxRetries - 1})`,
        );

        retryCount++;
        await delay(delayMs);
      } else {
        // Non-retryable error or max retries reached
        if (retryCount >= maxRetries - 1) {
          console.error(
            `❌ Max retries (${maxRetries}) reached for KPI update`,
          );
        } else {
          console.error("❌ Non-retryable error for KPI update:", error.name);
        }
        break; // Break the loop for non-retryable errors or max retries
      }
    }
  }

  if (!success) {
    console.error("❌ Failed to enqueue KPI update after multiple retries", {
      finalRetryCount: retryCount,
      maxRetries,
      issueId: event?.call?.payload?.issue?.id || "unknown",
    });
  }
}

export async function updateKPI(event, context) {
  let retryCount = 0;
  let success = false;

  while (!success && retryCount < 10) {
    try {
      console.log("Event Triggered:", JSON.stringify(event));

      const issueId = event.call.payload.issue.id; // The issue that triggered the event
      // const customField10065 = 'customfield_10065'; //Actual Hours
      // const customField10065 = 'customfield_10065'; //Actual Hours
      const customField10085 = "customfield_10085"; //Rework
      const customField10084 = "customfield_10084"; //Extra Work

      const customField10083 = "customfield_10083"; //
      const customField10082 = "customfield_10082"; //
      const customField10081 = "customfield_10081"; //DE Act Hours
      const customField10086 = "customfield_10086"; //Rework (Rework Ratio)
      const customField10070 = "customfield_10070"; //EWR
      const customField10066 = "customfield_10066"; //DFS
      const customField10065 = "customfield_10065"; //Actual Hours
      const customField10061 = "customfield_10061"; //Standard Hours
      const customField10100 = "customfield_10100"; //WO-FTR (Without Rejection)
      const customField10101 = "customfield_10101"; //FTR (Without Rejection)
      const customField10078 = "customfield_10078"; //Project Key
      const customField10056 = "customfield_10056"; //Task Estimation
      const customField10092 = "customfield_10092"; //DED Calc1
      const customField10093 = "customfield_10093"; //DFS Act Hrs
      const customField10015 = "customfield_10015"; //Start Date
      const customField10053 = "customfield_10053"; //End Date
      const customField10009 = "customfield_10009"; //Actual End
      const customField10094 = "customfield_10094"; //Activity OTD (On time Delivery)
      const customField10095 = "customfield_10095"; //Activity Plan OTD (On time Delivery)
      const customField10096 = "customfield_10096"; //Actual End
      const customField10068 = "customfield_10068"; //DED % (Designer Engg Deviation)

      const customField10039 = "customfield_10039";
      const customField10050 = "customfield_10050";
      const customField10073 = "customfield_10073"; //Product BU
      const customField10839 = "customfield_10839";
      const customField10871 = "customfield_10871";
      const customField10872 = "customfield_10872";
      const customField10971 = "customfield_10971"; // Close Std Hrs
      const customField10972 = "customfield_10972"; // Close DE Hrs
      const customField10075 = "customfield_10075";
      const customField10076 = "customfield_10076";
      const customField10077 = "customfield_10077";
      const customField11036 = "customfield_11036"; //Iter Std Act Hour

      const customField11003 = "customfield_11003"; //Iter Act Hour
      const customField10970 = "customfield_10970"; //Phase

      const customField10607 = "customfield_10607"; //Iter count

      try {
        // Step 1: Fetch the current issue
        const issueResponse = await api
          .asApp()
          .requestJira(route`/rest/api/3/issue/${issueId}`);
        const issueData = await issueResponse.json();
        const type = issueData.fields.issuetype.name;
        const issueStatus = issueData.fields.status.name;
        console.log("Statuss --> ", issueStatus);
        console.log(issueData.fields[customField10078]);
        // Step 2: Retrieve the values of the fields
        const fieldValue10085 = issueData.fields[customField10085] || 0; // Default to 0 if null
        const fieldValue10084 = issueData.fields[customField10084] || 0; // Default to 0 if null
        const fieldValue10083 = issueData.fields[customField10083] || 0; // Default to 0 if null
        const fieldValue10082 = issueData.fields[customField10082] || 0; // Default to 0 if null
        const fieldValue10081 = issueData.fields[customField10081] || 0; // Default to 0 if null
        const fieldValue10061 = issueData.fields[customField10061] || 0; // Default to 0 if null
        const fieldValue10078 = issueData.fields[customField10078] || 0; // Default to 0 if null
        const fieldValue10056 = issueData.fields[customField10056] || 0; // Default to 0 if null
        const fieldValue10015 = issueData.fields[customField10015]; // Default to 0 if null
        const fieldValue10053 = issueData.fields[customField10053]; // Default to 0 if null
        const fieldValue10009 = issueData.fields[customField10009]; // Default to 0 if null
        const fieldValue10092 = issueData.fields[customField10092] || 0; // Default to 0 if null
        const fieldValue10094 = issueData.fields[customField10094] || 0; // Default to 0 if null
        const fieldValue10095 = issueData.fields[customField10095] || 0; // Default to 0 if null
        const fieldValue10093 = issueData.fields[customField10093] || 0; // Default to 0 if null
        const fieldValue10971 = issueData.fields[customField10971] || 0; // Default to 0 if null
        const fieldValue10972 = issueData.fields[customField10972] || 0; // Default to 0 if null
        const fieldValue11036 = issueData.fields[customField11036] || 0; // Default to 0 if null
        const fieldValue11003 = issueData.fields[customField11003] || 0; // Default to 0 if null

        async function getReportingManagerByAssignee(assignee) {
          if (assignee) {
            let base64String = await storage.get(STORAGE_KEY);
            const uint8Arr = base64ToUint8Array(base64String);
            const decompressedString = pako.inflate(uint8Arr, { to: "string" });
            let data = JSON.parse(decompressedString);
            const reporter =
              data["Reporting Manager"]["users"][assignee.accountId];
            return reporter ? reporter : null; // Returns the first matched user
          }
        }

        function extractBetweenFirstAndThird(input) {
          const parts = input.split("|"); // Split by " | "

          if (parts.length < 4) return null; // Ensure at least 3 separators exist

          return parts.slice(1, 3).join("|"); // Extract between first and third "|"
        }

        console.log(fieldValue10015, fieldValue10053, fieldValue10009);
        if (["Activity", "Work Order", "Task"].includes(type)) {
          console.log(type);
          const projectDetails = await api
            .asApp()
            .requestJira(route`/rest/api/3/issue/${fieldValue10078}`);
          const projectData = await projectDetails.json();
          console.log(projectData);
          console.log(
            issueData.fields.assignee
              ? {
                  id: await getReportingManagerByAssignee(
                    issueData.fields.assignee,
                  ),
                }
              : null,
          );
          console.log(
            await getReportingManagerByAssignee(issueData.fields.assignee),
          );
          const updateResponse = await api
            .asApp()
            .requestJira(route`/rest/api/3/issue/${issueId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fields: {
                  [customField10039]: projectData.fields["summary"],
                  [customField10050]: projectData.fields[customField10050],
                  [customField10073]: projectData.fields[customField10073],
                  [customField10839]: projectData.fields[customField10839],
                  [customField10871]: extractBetweenFirstAndThird(
                    issueData.fields.summary,
                  ),
                  [customField10872]: issueData.fields.assignee
                    ? {
                        id: await getReportingManagerByAssignee(
                          issueData.fields.assignee,
                        ),
                      }
                    : null,
                },
              }),
            });
        }
        // console.log(xyz)
        // console.log(`Field Values:
        //   customfield_10083: ${fieldValue10083},
        //   customfield_10082: ${fieldValue10082},
        //   customfield_10081: ${fieldValue10081}`);
        //propageate Standard Hours

        // propagateActivityHours(issueId,customField10061)

        // Step 3: Calculate the sum
        const fieldValue10065 =
          fieldValue10083 + fieldValue10082 + fieldValue10081;
        let DFSValue = null;
        let agCloseStdHrsToSet = undefined; // holds the AG's 10971 to write: a number (set), null (clear), or undefined (don't touch)
        // Same shape for 10093. Activities write it as they close and it
        // propagates up, so an AG held actual hours from partly-closed work and
        // the Phase counted them with no plan behind them. It is now kept only
        // once the whole group is closed, so the numerator and the denominator
        // fill together. Actual Hrs (10065) is untouched.
        let agDfsActToSet = undefined;
        // console.log(`Actual Hours (Sum): ${fieldValue10065}`);

        if (["Activity"].includes(type)) {
          // For Activity issues, don't calculate DFS% - set to null
          // DFS Act Hrs (10093) is still calculated and propagated
          // but DFS% (10066) is calculated only at Activity Group level
          DFSValue = null;
          console.log("CASE 1---> Type: ", type, "--- Value:", DFSValue);
        } else if (["Activity Group"].includes(type)) {
          // OPTION C gate:
          // (1) cheap in-memory check — only proceed if the AG's OWN status is Closed.
          //     This skips the expensive descendant walk on every activity-close event;
          //     the walk now runs ONLY when the user actually closes the AG.
          // (2) then confirm ALL descendants are closed via areAllDescendantsClosed.
          const agIsClosed = issueStatus === "Closed";
          // Cancelled is decided on the group alone — no descendant walk. The
          // workflow only allows Not Started -> Cancelled, so the children are
          // still Not Started and areAllDescendantsClosed would always fail.
          // The plan was committed and nothing was delivered, so 10971 takes the
          // full standard hours and there are no actual hours to record.
          const agIsCancelled = issueStatus === "CANCELLED";
          const allClosed =
            agIsClosed && !agIsCancelled
              ? await areAllDescendantsClosed(issueData.key)
              : false;

          if (agIsCancelled) {
            agCloseStdHrsToSet = fieldValue10061;
            agDfsActToSet = null;
            DFSValue = null;
            console.log(
              `CASE 2.0 [CANCELLED]---> Type: ${type} | 10971 = ${fieldValue10061}, 10093 + DFS null`,
            );
          } else if (allClosed) {
            // Q3=A: when all closed, Close Std Hrs (10971) == Total Standard Hrs (10061)
            // Compute in-memory and use it immediately as the denominator (no read-back -> no race)
            // All descendants closed -> the full plan is now the closed standard (Q3=A)
            const totalStdHrs = fieldValue10061;
            const closeStdHrs = totalStdHrs; // Close Std Hrs == Total Std Hrs at all-closed
            const actualHrs = fieldValue10093;

            // Remember the snapshot so we can persist 10971 in the main update payload (Step 3)
            agCloseStdHrsToSet = closeStdHrs;
            // The group is fully closed, so its propagated actual hours stand.
            agDfsActToSet = actualHrs;

            if (closeStdHrs !== 0 && closeStdHrs !== null) {
              if (actualHrs === null || actualHrs === 0) {
                DFSValue = null;
              } else if (actualHrs === closeStdHrs) {
                DFSValue = 0;
              } else if (actualHrs !== 0) {
                DFSValue = Number(
                  (((actualHrs - closeStdHrs) / closeStdHrs) * 100).toFixed(1),
                );
              }
            } else {
              DFSValue = null;
            }

            console.log(
              `CASE 2.1 [ALL CLOSED]---> Type: ${type} | Actual: ${actualHrs}, CloseStd: ${closeStdHrs}, DFS: ${DFSValue}`,
            );
          } else {
            // Two-way reset (Q2=A): not all closed -> clear DFS and 10971
            DFSValue = null;
            agCloseStdHrsToSet = null;
            agDfsActToSet = null;
            console.log(
              `CASE 2.1 [NOT ALL CLOSED]---> Type: ${type} | DFS + 10971 + 10093 reset to null`,
            );
          }
        } else if (["Project", "Phase"].includes(type)) {
          // For Project/Phase: use propagated Close Std Hrs (customfield_10971)
          // 10971 rolls up from Activity Groups that are fully closed (Step 4 propagation)
          const closeStdHrs = fieldValue10971;
          const actualHrs = fieldValue10093;

          if (closeStdHrs !== 0 && closeStdHrs !== null) {
            if (actualHrs === null || actualHrs === 0) {
              DFSValue = null; // If actual hours are 0 or null, set DFS% to null
            } else if (actualHrs === closeStdHrs) {
              DFSValue = 0;
            } else if (actualHrs !== 0) {
              DFSValue = Number(
                (((actualHrs - closeStdHrs) / closeStdHrs) * 100).toFixed(1),
              );
            }
          } else {
            DFSValue = null;
          }

          console.log(
            `CASE 2.2---> Type: ${type} | Actual: ${actualHrs}, CloseStd: ${closeStdHrs}, DFS: ${DFSValue}`,
          );
        } else {
          DFSValue = null;
          console.log("CASE 3---> Type: ", type, "--- Value:", DFSValue);
        }

        console.log("Final DFS Value", type, DFSValue);

        let extraWorkValue = null;
        let reWorkValue = null;

        // if (["Project"].includes(type)) {
        //   extraWorkValue = (fieldValue10084 / fieldValue10065) * 100;
        //   reWorkValue = (fieldValue10085 / fieldValue10065) * 100;
        // }
        if (["Project", "Phase", "Activity Group"].includes(type)) {
          extraWorkValue = (fieldValue10084 / fieldValue10065) * 100;
          reWorkValue = (fieldValue10085 / fieldValue10065) * 100;
        }

        // Check for [Extra Work] and [Re-Work] in the summary
        const isExtraWork = issueData.fields.summary.includes("Extra Work");
        const isRework = issueData.fields.summary.includes("Re-Work");

        // Step 4: Update the KPI field (customfield_10065)
        const updateResponse = await api
          .asApp()
          .requestJira(route`/rest/api/3/issue/${issueId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                [customField10065]: Number(fieldValue10065?.toFixed(1)) || null,
                // [customField10066]: ["Activity", "Activity Group"].includes(type) ? (issueStatus === "Closed" ? (Number(DFSValue ?.toFixed(1)) || 0) : null ) : null,   // changed from null to 0
                [customField10066]: DFSValue,
                // Persist the AG's Close Std Hrs snapshot decided in CASE 2.1.
                // undefined -> spread nothing (non-AG issues leave 10971 untouched);
                // number -> set it; null -> clear it (two-way reset).
                ...(agCloseStdHrsToSet !== undefined && {
                  [customField10971]: agCloseStdHrsToSet,
                }),
                // Only ever set on an Activity Group — undefined elsewhere, so
                // Activities keep writing 10093 and it still propagates. The
                // group simply holds it back until every descendant is closed.
                ...(agDfsActToSet !== undefined && {
                  [customField10093]: agDfsActToSet,
                }),
                [customField10086]: Number(reWorkValue?.toFixed(1)) || null,
                [customField10070]: Number(extraWorkValue?.toFixed(1)) || null,
                [customField10068]: Number(
                  (
                    ((fieldValue10972 - fieldValue10092) / fieldValue10092) *
                    100
                  )?.toFixed(1),
                ), //calculate proper
                [customField10084]: isExtraWork
                  ? Number(fieldValue10065?.toFixed(1)) || null
                  : fieldValue10084 || null,
                [customField10085]: isRework
                  ? Number(fieldValue10065?.toFixed(1)) || null
                  : fieldValue10085 || null,
              },
            }),
          });

        const parentIssueId = await fetchParentIssueId(issueId);
        if (parentIssueId) {
          const array = ["Activity"].includes(type)
            ? [
                customField10084, // Extra Work
                customField10085, // Re-work
                customField10056, // Task Estimation
                // REMOVED: customField10075, 10076, 10077 NOT propagated from Activity
              ]
            : ["Project", "Phase", "Activity Group"].includes(type)
              ? [
                  customField10084, // Extra Work
                  customField10085, // Re-work
                  customField10056, // Task Estimation
                  customField10075, // COO - propagated from AG, Phase, Project
                  customField10076, // DE - propagated from AG, Phase, Project
                  customField10077, // TDL - propagated from AG, Phase, Project
                ]
              : [customField10084, customField10085, customField10056];
          await propagateActivityHoursBulk(parentIssueId, array);
          if (type == "Activity Group") {
            await propagateActivityHoursBulk(parentIssueId, [
              customField11003,
              customField11036,
            ]);
            await propagateIterCount(parentIssueId, [customField10607]);
            // Roll the AG's Close Std Hrs (10971) snapshot up to Phase, then Project.
            // Only fires on AG updates, so it sums sibling AGs into the Phase -
            // it never pulls 10971 from an AG's own Activity children (which have none).
            await propagateActivityHoursBulk(parentIssueId, [customField10971]);
          }
          // await propagateActivityHours(parentIssueId, customField10084);,
          // await propagateActivityHours(parentIssueId, customField10085);
        }

        if (updateResponse.ok) {
          console.log(
            `Successfully updated customfield_10065 with value: ${fieldValue10065}`,
          );
        } else {
          console.error(
            `Failed to update customfield_10065: ${await updateResponse.text()}`,
          );
        }

        ///////////
        // Done till here
        ///////////

        console.log(type, type != "Project");
        console.log(fieldValue10078);
        if (
          ["Phase", "Activity Group", "Activity", "Work Order"].includes(type)
        ) {
          async function fetchInwardLinkedIssues(issueKey) {
            const response = await api
              .asApp()
              .requestJira(
                route`/rest/api/3/issue/${issueKey}?fields=issuelinks`,
              );
            const issue = await response.json();

            return issue.fields.issuelinks
              .filter(
                (link) =>
                  link.type.name === "Hierarchy link (WBSGantt)" &&
                  link.inwardIssue,
              )
              .map((link) => link.inwardIssue.key);
          }

          async function fetchAllWorkOrders(issueKey) {
            const workOrders = new Set();

            async function traverse(key) {
              const res = await api
                .asApp()
                .requestJira(
                  route`/rest/api/3/issue/${key}?fields=issuetype,issuelinks,status`,
                );

              const issue = await res.json();
              console.log(
                `/rest/api/3/issue/${key}?fields=issuetype,issuelinks`,
              );
              if (
                issue.fields.issuetype.name === "Work Order" &&
                issue.fields.status.id !== "10006"
              ) {
                workOrders.add(issue.key);
                return;
              }

              const linkedIssues = issue.fields.issuelinks
                .filter(
                  (link) =>
                    link.type.name === "Hierarchy link (WBSGantt)" &&
                    link.outwardIssue,
                )
                .map((link) => link.outwardIssue.key);

              for (const linkedKey of linkedIssues) {
                await traverse(linkedKey);
              }
            }

            await traverse(issueKey);
            return Array.from(workOrders);
          }
          async function generateWorkOrderJQL(workOrders) {
            // const workOrders = await fetchAllWorkOrders(issueKey);
            if (workOrders.length === 0) {
              return "key in (EMPTY)";
            }
            const jql = `key in (${workOrders.join(",")}) AND "WO-FTR (Without Rejection)[Number]" IS NOT EMPTY`;
            return jql;
          }
          let updateKey = await fetchInwardLinkedIssues(issueData.key);
          console.log("fetch--->", updateKey);
          const workOrders = await fetchAllWorkOrders(updateKey);

          const jql = await generateWorkOrderJQL(workOrders);
          console.log(jql);

          // const jql = `"Project Key[Short text]" ~ "${fieldValue10078}" AND "WO-FTR (Without Rejection)[Number]" IS NOT EMPTY`;
          // console.log(jql)
          try {
            // Fetch issues using JQL
            const response = await api
              .asApp()
              .requestJira(route`/rest/api/3/search/jql`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  jql: jql,
                  fields: ["customField10100"],
                  maxResults: 1000, // Adjust as needed
                }),
              });

            const data = await response.json();
            console.log(data);
            if (!response.ok) {
              console.error("Error fetching issues:", data);
            }

            const issues = data.issues;
            console.log(issues);
            // Extract the "WO-FTR (Without Rejection)[Number]" values
            const values = issues
              .map((issue) => {
                const value = issue.fields[customField10100];
                return typeof value === "number" ? value : null;
              })
              .filter((value) => value !== null);

            // Calculate the average
            const total = values.reduce((sum, value) => sum + value, 0);
            const average =
              workOrders.length > 0 ? total / workOrders.length : 0;
            console.log(
              "test avg ",
              Number((average * 100)?.toFixed(1)) || null,
            );
            console.log(average);
            const updateResponse = await api
              .asApp()
              .requestJira(route`/rest/api/3/issue/${updateKey}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fields: {
                    [customField10100]: Number(average?.toFixed(1)) || null,
                    [customField10101]:
                      Number((average * 100)?.toFixed(1)) || null,
                  },
                }),
              });
          } catch (error) {
            console.error("Error:", error);
          }
        }

        if (type == "Task") {
          console.log(
            "test ",
            Number(fieldValue10056?.toFixed(1)) || null,
            typeof Number(fieldValue10056?.toFixed(1)) || null,
          );
          const updateResponse = await api
            .asApp()
            .requestJira(route`/rest/api/3/issue/${issueId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fields: {
                  [customField10092]:
                    issueData.fields.status.name === "Closed"
                      ? Number(fieldValue10056.toFixed(1))
                      : null,
                  [customField10972]:
                    issueData.fields.status.name === "Closed"
                      ? Number(fieldValue10081.toFixed(1))
                      : null,
                },
              }),
            });

          const parentIssueId = await fetchParentIssueId(issueId);
          if (parentIssueId) {
            await propagateActivityHours(parentIssueId, customField10092);
            await propagateActivityHours(parentIssueId, customField10972);
          }
        }

        if (type == "Activity") {
          console.log(fieldValue10061);
          // if (fieldValue10061 > 0) {
          const updateResponse = await api
            .asApp()
            .requestJira(route`/rest/api/3/issue/${issueId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fields: {
                  [customField10093]:
                    issueData.fields.status.name === "Closed"
                      ? fieldValue10065 != null
                        ? Number(fieldValue10065.toFixed(1))
                        : null
                      : null,
                  // REMOVED: [customField10971] - not set at Activity level anymore
                },
              }),
            });

          const parentIssueId = await fetchParentIssueId(issueId);
          if (parentIssueId) {
            await propagateActivityHoursBulk(parentIssueId, [
              // REMOVED: customField10971
              customField10093,
              customField10094,
              customField10095,
            ]);
            // await propagateActivityHours(parentIssueId, customField10971);
            // await delay(10000)
            // await propagateActivityHours(parentIssueId, customField10093);
            // await delay(10000)
            // await propagateActivityHours(parentIssueId, customField10094);
            // await delay(10000)
            // await propagateActivityHours(parentIssueId, customField10095);
            // await delay(10000)
          }
          // }
        }

        ////DED
        if (!["Project", "Phase", "Activity Group"].includes(type)) {
          const updateResponse1 = await api
            .asApp()
            .requestJira(route`/rest/api/3/issue/${issueId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fields: {
                  [customField10094]: dateDifference(
                    fieldValue10015,
                    fieldValue10053,
                    fieldValue10009,
                    "end",
                  ),
                  [customField10095]: dateDifference(
                    fieldValue10015,
                    fieldValue10053,
                    fieldValue10009,
                    "start",
                  ),
                  [customField10096]: Number(
                    (
                      ((dateDifference(
                        fieldValue10015,
                        fieldValue10053,
                        fieldValue10009,
                        "end",
                      ) -
                        dateDifference(
                          fieldValue10015,
                          fieldValue10053,
                          fieldValue10009,
                          "start",
                        )) /
                        dateDifference(
                          fieldValue10015,
                          fieldValue10053,
                          fieldValue10009,
                          "start",
                        )) *
                      100
                    )?.toFixed(1),
                  ),
                },
              }),
            });
          const d = {
            [customField10094]: dateDifference(
              fieldValue10015,
              fieldValue10053,
              fieldValue10009,
              "end",
            ),
            [customField10095]: dateDifference(
              fieldValue10015,
              fieldValue10053,
              fieldValue10009,
              "start",
            ),
            [customField10096]: Number(
              (
                ((dateDifference(
                  fieldValue10015,
                  fieldValue10053,
                  fieldValue10009,
                  "end",
                ) -
                  dateDifference(
                    fieldValue10015,
                    fieldValue10053,
                    fieldValue10009,
                    "start",
                  )) /
                  dateDifference(
                    fieldValue10015,
                    fieldValue10053,
                    fieldValue10009,
                    "start",
                  )) *
                100
              )?.toFixed(1),
            ),
          };

          console.log(
            issueData.key,
            fieldValue10009,
            fieldValue10015,
            fieldValue10053,
            "testDate",
            JSON.stringify(d),
          );
          if (updateResponse1.ok) {
            console.log(`Successfully updated ${JSON.stringify(d)}`);
          } else {
            console.error(`Failed to update: ${await updateResponse1.text()}`);
          }
        } else {
          const totalUpdatedCAEIteration =
            (fieldValue11003 / (fieldValue11003 + fieldValue11036)) * 100;

          const updateResponse1 = await api
            .asApp()
            .requestJira(route`/rest/api/3/issue/${issueId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fields: {
                  [customField10096]: Number(
                    (
                      ((fieldValue10094 - fieldValue10095) / fieldValue10095) *
                      100
                    )?.toFixed(1),
                  ),
                  customfield_10608: Number(
                    totalUpdatedCAEIteration?.toFixed(1),
                  ),
                },
              }),
            });

          if (updateResponse1.ok) {
            console.log(`Successfully updated `);
          } else {
            console.error(`Failed to update: ${await updateResponse1.text()}`);
          }
        }

        //CAE
        if (type == "Activity") {
          console.log("entered");
          // console.log(kd)
          if (
            !(
              issueData.fields.summary.includes("Extra Work") ||
              issueData.fields.summary.includes("Re-Work")
            )
          ) {
            async function getFilteredIterationIssues(
              activityIssueKey,
              summaryMatch,
            ) {
              try {
                // Step 1: Get the Activity Issue details
                const activityIssue = await api
                  .asApp()
                  .requestJira(route`/rest/api/3/issue/${activityIssueKey}`);
                const activityData = await activityIssue.json();

                if (!activityData.fields.issuelinks) {
                  throw new Error("No issue links found for the activity.");
                }

                let activityGroupKey = null;

                // Step 2: Find the linked Activity Group (Hierarchy link)
                for (const link of activityData.fields.issuelinks) {
                  if (
                    link.type.name === "Hierarchy link (WBSGantt)" &&
                    link.inwardIssue
                  ) {
                    activityGroupKey = link.inwardIssue.key;
                    break;
                  }
                }

                if (!activityGroupKey) {
                  throw new Error("Activity Group not found.");
                }

                // Step 3: Fetch the Activity Group issue to get Phase
                const activityGroupIssue = await api
                  .asApp()
                  .requestJira(route`/rest/api/3/issue/${activityGroupKey}`);
                const activityGroupData = await activityGroupIssue.json();

                let phaseKey = null;

                for (const link of activityGroupData.fields.issuelinks) {
                  if (
                    link.type.name === "Hierarchy link (WBSGantt)" &&
                    link.inwardIssue
                  ) {
                    phaseKey = link.inwardIssue.key;
                    break;
                  }
                }

                if (!phaseKey) {
                  throw new Error("Phase not found.");
                }

                // Step 4: Fetch all Activity Groups under this Phase

                const activityGroupsData = await fetchLinkedIssues(phaseKey);

                if (!activityGroupsData.length) {
                  throw new Error("No Activity Groups found under this Phase.");
                }

                const iterationGroupKey = activityGroupsData.find((issue) =>
                  issue.summary.includes("| ITERATIONS | ITERATIONS"),
                );
                const iterationStdActivityGroup = activityGroupsData.find(
                  (issue) =>
                    issue.summary.includes(summaryMatch.replace(" | Iter", "")),
                );

                const iterationActivities = await fetchLinkedIssues(
                  iterationGroupKey.key,
                );
                const filteredIteration = iterationActivities.filter((issue) =>
                  issue.summary.includes(summaryMatch),
                );
                console.log(filteredIteration);
                console.log(iterationStdActivityGroup);
                // Step 7: Fetch Actual Hours for Standard Iteration Activity Group via REST API
                const stdActivityResponse = await api
                  .asApp()
                  .requestJira(
                    route`/rest/api/3/issue/${iterationStdActivityGroup.key}`,
                  );
                const stdActivityData = await stdActivityResponse.json();
                const stdActualHours =
                  stdActivityData.fields?.customfield_10065 || 0; // Replace XXXXX with 'Actual Hours' field ID (avoid division by zero)

                console.log(
                  "Actual Hours of Standard Iteration Activity:",
                  stdActualHours,
                  iterationStdActivityGroup.key,
                );
                let iterStd = stdActualHours;
                let iterActual = 0;
                // Step 8: Iterate through each filtered iteration activity, fetch actual hours via API & update issue
                for (const issue of filteredIteration) {
                  // Fetch issue details from REST API
                  const issueResponse = await api
                    .asApp()
                    .requestJira(route`/rest/api/3/issue/${issue.key}`);
                  const issueData = await issueResponse.json();

                  const actualHours = issueData.fields?.customfield_10065 || 0; // Replace XXXXX with 'Actual Hours' field ID
                  iterActual += actualHours;
                  const updatedCAEIteration = stdActualHours
                    ? (actualHours / (stdActualHours + actualHours)) * 100
                    : null;
                  console.log(
                    "data",
                    fieldValue10065,
                    actualHours,
                    stdActualHours,
                  );

                  console.log(
                    `Issue ${issue.key} - Actual Hours: ${actualHours}, Updated CAE Iteration: ${updatedCAEIteration}`,
                  );

                  // Update issue with new CAE Iteration value
                  await api
                    .asApp()
                    .requestJira(route`/rest/api/3/issue/${issue.key}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        fields: {
                          customfield_10608:
                            Number(updatedCAEIteration?.toFixed(1)) || null, // Replace YYYYY with CAE Iteration field ID
                        },
                      }),
                    });

                  console.log(`Updated CAE Iteration for issue ${issue.key}`);
                }
                console.log(
                  "Iter Actual",
                  iterActual,
                  iterStd,
                  (iterActual / (iterStd + iterActual)) * 100,
                );
                const totalUpdatedCAEIteration =
                  (iterActual / (iterStd + iterActual)) * 100;
                await api
                  .asApp()
                  .requestJira(
                    route`/rest/api/3/issue/${iterationStdActivityGroup.key}`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        fields: {
                          customfield_11003: Number(iterActual?.toFixed(1)), // Replace YYYYY with CAE Iteration field ID
                          customfield_11036: iterStd,
                          customfield_10607: filteredIteration.length,
                          customfield_10608: Number(
                            totalUpdatedCAEIteration?.toFixed(1),
                          ),
                        },
                      }),
                    },
                  );

                // console.log(kh)
              } catch (error) {
                console.error(
                  "Error fetching Iteration Issues:",
                  error.response.status,
                  " --- ",
                  error.message,
                );
                return [];
              }
            }
            function normalizeIteration(summary) {
              return summary.replace(/\s*\|\s*(Loop|Iter)\s*\d+$/, " | Iter");
            }
            let finalFilteredIssues = await getFilteredIterationIssues(
              issueData.key,
              normalizeIteration(issueData.fields.summary),
            );
            console.log("testttttt");
            console.log(finalFilteredIssues);
            // console.log(kd)
          }
        }

        // if(type== "Activity Group"){
        //   await propagateActivityHoursBulk(issueData.key, [customField11003, customField11036,customField10607])

        // }
      } catch (error) {
        console.error(
          "Error in updateKPI Event Listener: ",
          error?.response?.status,
          " --- ",
          error?.message,
        );
      }

      success = true; // Exit loop on success
    } catch (error) {
      if (error) {
        console.warn(
          `⚠️ Rate limit reached. Retrying in ${2 ** retryCount} seconds...`,
        );
        await delay(2 ** retryCount * 1000); // Exponential backoff
        retryCount++;
      } else {
        console.error("❌ Error processing KPI update:", error);
        break; // Break the loop for non-rate-limit errors
      }
    }
  }
  if (!success) {
    console.error("❌ Failed to process KPI update after multiple retries");
  }
}

export const trigger = async ({ context }) => {
  console.log("Scheduled trigger invoked ");
  // console.log(context);
  await updateTodayQueue.push(context);
  return { success: true, message: "Task has been queued for processing." };
  // Add your business logic here
};

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function updateIssuesDateField(jql, dateFieldId) {
  const jqlEncoded = jql; //encodeURIComponent(jql);
  console.log(`/rest/api/3/search/jql?jql=${jqlEncoded}&maxResults=25`);
  const searchResponse = await retryJiraApiCall(() =>
    api
      .asApp()
      .requestJira(
        route`/rest/api/3/search/jql?jql=${jqlEncoded}&maxResults=25`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      ),
  );

  if (!searchResponse.ok) {
    const errText = await searchResponse.text();
    console.error(`JQL error: ${errText}`);
    throw new Error("Failed to run JQL");
  }

  const data = await searchResponse.json();
  const issues = data.issues || [];
  const todayStr = getTodayDateString();

  for (const issue of issues) {
    const issueKey = issue.key;
    console.log(`Updating ${issueKey}...`);

    const updateRes = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            [dateFieldId]: todayStr,
          },
        }),
      }),
    );

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error(`Failed to update ${issueKey}: ${errorText}`);
    } else {
      console.log(`✅ Updated ${issueKey} to ${todayStr}`);
    }

    await sleep(3000); // wait for 3 seconds
  }
}

export async function updateToday(context) {
  console.log("Scheduled trigger invoked 1");
  console.log(context);
  const rawJql = `project in ( CWO) AND issuetype in (Activity, "Work Order", Task) AND (cf[11168] < now() OR cf[11168] IS EMPTY) ORDER BY cf[11168] ASC`;
  // const rawJql = `project in (CDEMO) AND (cf[11168] < now() OR cf[11168] IS EMPTY) ORDER BY cf[11168] ASC`;

  await updateIssuesDateField(rawJql, "customfield_11168");
}

export async function enqueueQuotationIssue(event, context) {
  let retryCount = 0;
  let success = false;

  while (!success && retryCount < 5) {
    try {
      console.log(
        `🚀 Attempting to enqueue quotation update (Try ${retryCount + 1})`,
        event,
      );
      await updateQuotationQueue.push(event, context);
      console.log("✅ Successfully enqueued Quotation update");
      success = true; // Exit loop on success
    } catch (error) {
      if (error.name === "RateLimitError") {
        console.warn(
          `⚠️ Rate limit reached. Retrying in ${2 ** retryCount} seconds...`,
        );
        await delay(2 ** retryCount * 1000); // Exponential backoff
        retryCount++;
      } else {
        console.error("❌ Error enqueuing Quotation update:", error);
        break; // Break the loop for non-rate-limit errors
      }
    }
  }
  if (!success) {
    console.error(
      "❌ Failed to enqueue Quotation update after multiple retries",
    );
  }
}

// export async function updateQuotationIssue(event, context) {
//   console.log("Quotation Update Triggered !!!!!!!!!!!!");
//   const issueKey = event.call.payload.issue.key;
//   console.log("Issue Key", issueKey);
//   // Quotation Plan 2-3 start
//   const issue = await fetchIssue(issueKey);
//   let product = issue.fields["customfield_10073"].value; // Product-BU custom field
//   const customer = issue.fields["customfield_10838"].value; // Customer custom field

//   const startDate = issue.fields["customfield_10015"]; // Start Date field

//   console.log("Start Date = ", startDate);

//   switch (product) {
//     case "Window Regulator":
//       product = "WR";
//       break;
//     case "Pillar":
//       product = "PL";
//       break;
//     case "Centre Console":
//       product = "CC";
//       break;
//     case "Sunvisor":
//       product = "SV";
//       break;
//     case "Lighting":
//       product = "LGT";
//       break;
//   }

//   let base64String = await storage.get(STORAGE_KEY);
//   const uint8Arr = base64ToUint8Array(base64String);
//   const decompressedString = pako.inflate(uint8Arr, { to: "string" });
//   let data = JSON.parse(decompressedString);
//   const t_ceco_summary = data["T_CECO_SUMMARY"]["records"][customer]; //  T_CECO_SUMMARY
//   // console.log(data["T_CECO_SUMMARY"]["records"][customer][product]) // PRODUCT DATA
//   // console.log(data["T_CECO_SUMMARY"]["records"][customer]["Common"]); // COMMON DATA

//   const t_std_timelines = data["T_TimelinesSTD"]["products"][product]; //  T_TimelinesSTD
//   // console.log(t_std_timelines);

//   let phase_0 =
//     issue.fields["customfield_11285"]?.value === "Yes" ? true : false;
//   let phase_1 =
//     issue.fields["customfield_11286"]?.value === "Yes" ? true : false;
//   let phase_2 =
//     issue.fields["customfield_11287"]?.value === "Yes" ? true : false;
//   let phase_3_4 =
//     issue.fields["customfield_11288"]?.value === "Yes" ? true : false;

//   console.log("Phase Values Extracted");

//   let totalWeeks = 0;

//   let quotationUpdatePayload;

//   if (event.call.payload.eventType === "avi:jira:updated:issue") {
//     console.log("Issue Update Event");

//     let phase_0_value, phase_1_value, phase_2_value, phase_3_4_value;

//     phase_0_value = phase_0 ? t_std_timelines["phase_0"] : 0;
//     phase_1_value = phase_1 ? t_std_timelines["phase_1"] : 0;
//     phase_2_value = phase_2 ? t_std_timelines["phase_2"] : 0;
//     phase_3_4_value = phase_3_4 ? t_std_timelines["phase_3_4"] : 0;

//     if (issue.fields["customfield_11821"] !== null && phase_0)
//       phase_0_value = issue.fields["customfield_11821"];
//     if (issue.fields["customfield_11822"] !== null && phase_1)
//       phase_1_value = issue.fields["customfield_11822"];
//     if (issue.fields["customfield_11823"] !== null && phase_2)
//       phase_2_value = issue.fields["customfield_11823"];
//     if (issue.fields["customfield_11824"] !== null && phase_3_4)
//       phase_3_4_value = issue.fields["customfield_11824"];

//     totalWeeks =
//       phase_0_value + phase_1_value + phase_2_value + phase_3_4_value;

//     console.log("Phase 0 = ", phase_0_value);
//     console.log("Phase 1 = ", phase_1_value);
//     console.log("Phase 2 = ", phase_2_value);
//     console.log("Phase 3-4 = ", phase_3_4_value);

//     console.log("Total Weeks = ", totalWeeks);

//     let sopDateValue = null;

//     if (startDate !== null) {
//       // 1. Parse Start Date
//       const startDateData = new Date(startDate);

//       // 2. Add (7 * numberOfWeeks) days
//       const sopDate = new Date(startDateData);
//       sopDate.setDate(startDateData.getDate() + 7 * totalWeeks);

//       // 3. Format YYYY-MM-DD
//       const formattedSopDate = sopDate.toISOString().split("T")[0];

//       sopDateValue = formattedSopDate.toString();
//     }

//     console.log("SOP Date = ", sopDateValue);

//     quotationUpdatePayload = {
//       //T_TimelinesSTD
//       customfield_11821: phase_0 ? phase_0_value : null,
//       customfield_11822: phase_1 ? phase_1_value : null,
//       customfield_11823: phase_2 ? phase_2_value : null,
//       customfield_11824: phase_3_4 ? phase_3_4_value : null,

//       //SOP Date
//       customfield_10043: sopDateValue,
//     };
//   } else {
//     // console.log("P0=",phase_0);
//     // console.log("P1=",phase_1);
//     // console.log("P2=",phase_2);
//     // console.log("P3=",phase_3_4);

//     totalWeeks = phase_0 ? t_std_timelines["phase_0"] + totalWeeks : totalWeeks;
//     totalWeeks = phase_1 ? t_std_timelines["phase_1"] + totalWeeks : totalWeeks;
//     totalWeeks = phase_2 ? t_std_timelines["phase_2"] + totalWeeks : totalWeeks;
//     totalWeeks = phase_3_4
//       ? t_std_timelines["phase_3_4"] + totalWeeks
//       : totalWeeks;

//     console.log("Total Weeks = ", totalWeeks);

//     let sopDateValue = null;

//     if (startDate !== null) {
//       // 1. Parse Start Date
//       const startDateData = new Date(startDate);

//       // 2. Add (7 * numberOfWeeks) days
//       const sopDate = new Date(startDateData);
//       sopDate.setDate(startDateData.getDate() + 7 * totalWeeks);

//       // 3. Format YYYY-MM-DD
//       const formattedSopDate = sopDate.toISOString().split("T")[0];

//       sopDateValue = formattedSopDate.toString();
//     }

//     console.log("SOP Date = ", sopDateValue);

//     const fieldsToUpdate = {
//       //  T_CECO_SUMMARY
//       customfield_11803: {
//         value: t_ceco_summary["Common"]["CATIA / NX"],
//       },
//       customfield_11804: {
//         value: t_ceco_summary["Common"]["3DA"],
//       },
//       customfield_11798: {
//         value: t_ceco_summary[product]?.["2D_INT"],
//       },
//       customfield_11861: {
//         value: t_ceco_summary[product]?.["2D_OEM"],
//       },
//       customfield_11809: {
//         value: t_ceco_summary[product]?.["3D_TDL (HCC/BCC)"],
//       },
//       customfield_11810: {
//         value: t_ceco_summary[product]?.["3D_AddTDL34"],
//       },
//       customfield_11795: {
//         value: t_ceco_summary[product]?.["3D_TDL"],
//       },
//       customfield_11796: {
//         value: t_ceco_summary[product]?.["3D_Coord"],
//       },
//       customfield_11797: {
//         value: t_ceco_summary[product]?.["3D_SW"],
//       },
//       customfield_11802: {
//         value: t_ceco_summary[product]?.["3D_Feasib"],
//       },
//       customfield_11800: {
//         value: t_ceco_summary[product]?.["DM"],
//       },
//       customfield_11811: {
//         value: t_ceco_summary[product]?.["CAE_TCL"],
//       },
//       customfield_11812: {
//         value: t_ceco_summary[product]?.["CAE_SW"],
//       },
//       customfield_11819: {
//         value: t_ceco_summary[product]?.["THR_TCL"],
//       },
//       customfield_11818: {
//         value: t_ceco_summary[product]?.["PS_PSL"],
//       },
//       //T_TimelinesSTD
//       customfield_11821: phase_0 ? t_std_timelines["phase_0"] : null,
//       customfield_11822: phase_1 ? t_std_timelines["phase_1"] : null,
//       customfield_11823: phase_2 ? t_std_timelines["phase_2"] : null,
//       customfield_11824: phase_3_4 ? t_std_timelines["phase_3_4"] : null,

//       //SOP Date
//       customfield_10043: sopDateValue,
//     };

//     for (let customField in fieldsToUpdate) {
//       if (
//         typeof fieldsToUpdate[customField] === "number" ||
//         customField.toString() == "customfield_10043" ||
//         fieldsToUpdate[customField] === null
//       )
//         continue;

//       fieldsToUpdate[customField] =
//         fieldsToUpdate[customField].value !== "-" &&
//         fieldsToUpdate[customField].value !== ""
//           ? { value: fieldsToUpdate[customField].value }
//           : null;
//     }
//     quotationUpdatePayload = fieldsToUpdate;
//   }
//   // Quotation Plan 2-3 end

//   const updateQuotation = await updateIssueWithRetry(
//     issueKey,
//     quotationUpdatePayload
//   );
//   // console.log(updateQuotation);
//   if (updateQuotation.ok) {
//     console.log("T_CECO_SUMMARY & T_TimelinesSTD details Updated");
//   }
// }

export async function updateQuotationIssue(event, context) {
  console.log("Quotation Update Triggered - Updating CATIA/NX only");
  const issueKey = event.call.payload.issue.key;

  // 1. Fetch necessary issue data to identify the customer
  const issue = await fetchIssue(issueKey);
  const customer = issue.fields["customfield_10838"].value; // Customer custom field

  // 2. Retrieve and decompress storage data
  let base64String = await storage.get(STORAGE_KEY);
  const uint8Arr = base64ToUint8Array(base64String);
  const decompressedString = pako.inflate(uint8Arr, { to: "string" });
  let data = JSON.parse(decompressedString);

  // 3. Extract the specific "Common" value for CATIA / NX
  const t_ceco_summary = data["T_CECO_SUMMARY"]["records"][customer];
  const catiaValue = t_ceco_summary["Common"]["CATIA / NX"];

  // 4. Prepare the specific payload for customfield_11803
  // Validates that the value isn't empty or a hyphen before setting
  const quotationUpdatePayload = {
    customfield_11803:
      catiaValue !== "-" && catiaValue !== "" ? { value: catiaValue } : null,
  };

  // 5. Execute Update
  const updateQuotation = await updateIssueWithRetry(
    issueKey,
    quotationUpdatePayload,
  );

  if (updateQuotation.ok) {
    console.log("customfield_11803 successfully updated.");
  }
}

resolver.define("getQuotationIssueData", async (payload) => {
  let { issue } = payload;
  console.log("fetching issue data...");
  console.log("Key: " + issue.key);
  const issueResponse = await fetchIssue(issue.key);
  const product = issueResponse.fields["customfield_10073"]?.value; // Product-BU custom field
  const customer = issueResponse.fields["customfield_10838"]?.value;
  const projectName = issueResponse.fields["summary"];
  const projectType = issueResponse.fields["customfield_10052"]?.value;

  return {
    product: product,
    customer: customer,
    projectName: projectName,
    projectType: projectType,
  };
});

// -----Get Quotation Version field data-----
resolver.define("getQuotationVersion", async ({ payload }) => {
  let { issue } = payload;
  console.log("fetching...");
  console.log("Key: " + issue.key);
  const issueResponse = await fetchIssue(issue.key);

  const quotationVersion = issueResponse.fields["customfield_12060"]; // Quotation Version field

  return quotationVersion;
});

// -----Get All Versions data-----
resolver.define("getAllVersions", async ({ payload }) => {
  const { issue } = payload;

  // 1. Get current version from Jira Field
  const issueResponse = await fetchIssue(issue.key);
  const currentJiraVersion = issueResponse.fields["customfield_12060"];

  // 2. Get history from storage
  const storedVersions = await storage.get(`Quot_Version_${issue.key}`);

  // 3. Store the data in a set
  const versionSet = new Set(storedVersions || []);

  // 4. Add the version from the Jira ticket, by default "V1" will get added for the first time
  versionSet.add(currentJiraVersion);

  // 5. Convert back to Array
  const finalVersions = Array.from(versionSet).sort(); // sort them in order V1, V2, V3

  console.log("Returning versions:", finalVersions);
  return finalVersions;
});

// Convert ADF to Plain text

function adfToPlainText(adfNode) {
  if (!adfNode) return "";

  // If it's a leaf node with text, return the text
  if (adfNode.type === "text") {
    return adfNode.text || "";
  }

  // Handle line breaks
  if (adfNode.type === "hardBreak") {
    return "\n";
  }

  let text = "";

  // Recursively process child content
  if (adfNode.content && Array.isArray(adfNode.content)) {
    text = adfNode.content.map((child) => adfToPlainText(child)).join("");
  }

  // Add newlines for block-level elements like paragraphs or list items
  if (adfNode.type === "paragraph" || adfNode.type === "listItem") {
    return text + "\n";
  }

  return text;
}

// -----Get Quotation data CAD-----
resolver.define("getQuotationData", async ({ payload }) => {
  let { issue, selectedVersion } = payload;

  console.log("Key: " + issue.key);

  const issueResponse = await fetchIssue(issue.key);

  const product = issueResponse.fields["customfield_10073"]?.value;
  const customer = issueResponse.fields["customfield_10838"]?.value;
  const projectName = issueResponse.fields["summary"];
  const projectType = issueResponse.fields["customfield_10052"]?.value;
  const startDate = issueResponse.fields["customfield_10015"];
  const catiaNxValue = issueResponse.fields["customfield_11803"]?.value;
  const statusValue = issueResponse.fields["status"]?.name;

  const adfData = issueResponse.fields["customfield_12290"];
  const quotAssumptions = adfToPlainText(adfData).trim();

  const issueData = {
    product,
    customer,
    projectName,
    projectType,
    catiaNxValue,
  };

  const sopParamStart = { startDate };

  const buildKey = (version) =>
    `Quot_${product}_${customer}_${issue.key}_CAD_${version}`;

  // -------------------------------
  // STEP 1: Try selected version
  // -------------------------------
  console.log(`Fetching selected version: ${selectedVersion}`);

  let quot = await storage.get(buildKey(selectedVersion));

  if (quot && Object.keys(quot).length > 0) {
    console.log("Returning selected version data");
    return {
      quotationData: quot,
      issueData,
      sopParamStart,
      quotAssumptions,
      statusValue,
    };
  }

  // -------------------------------
  // STEP 2: Try previous versions
  // -------------------------------
  console.log("Selected version not found, checking previous versions");

  let allVersions = [];

  try {
    allVersions = JSON.parse(issueResponse.fields["customfield_12257"]) || [];
  } catch (e) {
    console.log("Error parsing versions field");
  }

  // Sort versions safely (V1, V2, V3...)
  const sortedVersions = allVersions.sort(
    (a, b) => parseInt(a.replace("V", "")) - parseInt(b.replace("V", "")),
  );

  // Loop backwards (latest → oldest)
  for (let i = sortedVersions.length - 1; i >= 0; i--) {
    const versionToFetch = sortedVersions[i];

    if (versionToFetch === selectedVersion) continue;

    console.log(`Trying fallback version: ${versionToFetch}`);

    let quotLast = await storage.get(buildKey(versionToFetch));

    if (quotLast && Object.keys(quotLast).length > 0) {
      console.log(`Returning fallback version: ${versionToFetch}`);
      return {
        quotationData: quotLast,
        issueData,
        sopParamStart,
        quotAssumptions,
        statusValue,
      };
    }
  }

  // -------------------------------
  // STEP 3: Fallback to standard data
  // -------------------------------
  console.log("No version data found, loading standard data");

  try {
    let base64String = await storage.get(STORAGE_KEY);

    if (!base64String) {
      console.log("No standard data found");
      return {
        quotationData: {},
        issueData,
        sopParamStart,
        quotAssumptions,
        statusValue,
      };
    }

    const uint8Arr = base64ToUint8Array(base64String);
    const decompressedString = pako.inflate(uint8Arr, { to: "string" });
    const data = JSON.parse(decompressedString);

    if (!product) {
      console.log("No product found");
      return {
        quotationData: {},
        issueData,
        sopParamStart,
        quotAssumptions,
        statusValue,
      };
    }

    const productData = data[product];

    console.log("Returning standard data");

    return {
      quotationData: productData || {},
      issueData,
      sopParamStart,
      quotAssumptions,
      statusValue,
    };
  } catch (error) {
    console.error("Error fetching standard data:", error);

    return {
      quotationData: {},
      issueData,
      sopParamStart,
      quotAssumptions,
      statusValue,
    };
  }
});

async function updateProductParts(issueKey, existingParts, newParts) {
  const existingIds = existingParts.map((part) => part.id);
  const newIds = newParts.map((part) => part.id);

  const combinedIds = [...new Set([...existingIds, ...newIds])];
  const formattedCombinedParts = combinedIds.map((id) => ({ id: String(id) }));

  const issuePayload = {
    customfield_10074: formattedCombinedParts,
  };

  return updateIssueWithRetry(issueKey, issuePayload);
}

async function updatePhaseWeeks(issue, phaseWeeks) {
  const issuePayload = {
    customfield_11821: phaseWeeks.phase0Week,
    customfield_11822: phaseWeeks.phase1Week,
    customfield_11823: phaseWeeks.phase2Week,
    customfield_11824: phaseWeeks.phase34Week,
  };
  return updateIssueWithRetry(issue, issuePayload);
}
async function updateQuotVersionHoursAndCost(
  issue,
  version,
  totalHours,
  totalCost,
) {
  console.log("Total Hours to be updated:: ", totalHours);
  console.log("Total Cost to be updated:: ", totalCost);

  const versionFields = {
    V1: { hours: "customfield_12323", cost: "customfield_12360" },
    V2: { hours: "customfield_12324", cost: "customfield_12361" },
    V3: { hours: "customfield_12325", cost: "customfield_12362" },
    V4: { hours: "customfield_12358", cost: "customfield_12363" },
    V5: { hours: "customfield_12359", cost: "customfield_12364" },
    V6: { hours: "customfield_12404", cost: "customfield_12403" },
    V7: { hours: "customfield_12406", cost: "customfield_12405" },
  };

  const hoursField = versionFields[version]?.hours;
  const costField = versionFields[version]?.cost;

  // Fetch current issue data to compare with new values
  const issueResponse = await fetchIssue(issue);
  const currentHours = issueResponse.fields[hoursField];
  const currentCost = issueResponse.fields[costField];

  // Only include fields in payload if they have changed
  const issueUpdatePayload = {};

  if (currentHours !== totalHours) {
    issueUpdatePayload[hoursField] = totalHours;
    console.log(
      `Hours changed for ${version}: ${currentHours} → ${totalHours}`,
    );
  }

  if (currentCost !== totalCost) {
    issueUpdatePayload[costField] = totalCost;
    console.log(`Cost changed for ${version}: ${currentCost} → ${totalCost}`);
  }

  // Return early if no changes detected
  if (Object.keys(issueUpdatePayload).length === 0) {
    console.log(`No changes detected for version ${version}. Skipping update.`);
    return { ok: true, message: "No updates needed" };
  }

  return updateIssueWithRetry(issue, issueUpdatePayload);
}

// -----Save Quotation data CAD-----
resolver.define("saveQuotationData", async ({ payload }) => {
  let {
    issue,
    data,
    workOrderData,
    selectedProductParts,
    startDate,
    sopEndDate,
    phaseWeeks,
    currentVersion,
    quotVerTotalHours,
    quotVerTotalCost,
  } = payload;

  //update Phase Weeks in Quotation ticket
  const updatePhaseWeeksResponse = await updatePhaseWeeks(issue, phaseWeeks);
  // console.log("Weeks updated : ", updatePhaseWeeksResponse)

  console.log("Saving CAD data for issue: " + issue);

  const updateHoursAndCostResponse = await updateQuotVersionHoursAndCost(
    issue,
    currentVersion,
    quotVerTotalHours,
    quotVerTotalCost,
  );

  console.log("CAD Hours and Cost Updated : ", updateHoursAndCostResponse);

  // update the dates
  const issueUpdateDates = {
    customfield_10015: startDate,
    customfield_10043: sopEndDate,
  };

  console.log("Dates Payload... \n", issueUpdateDates);

  const updateQuotDates = await updateIssueWithRetry(issue, issueUpdateDates);

  console.log("Start and SOP End date field updated... \n", updateQuotDates);

  // save data next

  const issueResponse = await fetchIssue(issue);
  const product = issueResponse.fields["customfield_10073"]?.value;
  const customer = issueResponse.fields["customfield_10838"]?.value;
  const quotVersion = issueResponse.fields["customfield_12060"];

  // Pass the existing parts directly from the response you already have
  const existingProductParts = issueResponse.fields["customfield_10074"] || [];
  const newProductParts = selectedProductParts || [];

  const updateProductPartsResponse = await updateProductParts(
    issue,
    existingProductParts,
    newProductParts,
  );
  console.log("Product Parts Updated : ", updateProductPartsResponse);

  if (!data) throw new Error("No data provided");

  console.log(
    `saving... Quot_${product}_${customer}_${issue}_CAD_${quotVersion}`,
  );

  // 1. Always save the actual CAD data (since data might have changed)
  await storage.set(
    `Quot_${product}_${customer}_${issue}_CAD_${quotVersion}`,
    data,
  );

  // 1.5 Save Work Order prepared data for Integration
  if (workOrderData) {
    await storage.set(
      `Quot_WO_${product}_${customer}_${issue}_CAD_${quotVersion}`,
      workOrderData,
    );
    console.log(
      "Setting Work Order data in storage with key: ",
      `Quot_WO_${product}_${customer}_${issue}_CAD_${quotVersion}`,
    );
  }

  // 2. Optimized Version History Update
  const storedVersions = (await storage.get(`Quot_Version_${issue}`)) || [];

  // Check if the version is already known
  if (!storedVersions.includes(quotVersion)) {
    console.log(
      `New version ${quotVersion} detected. Updating history list...`,
    );

    const versionSet = new Set(storedVersions);
    versionSet.add(quotVersion);

    const versionArray = Array.from(versionSet).sort();
    // Only write to storage if it's a brand new version
    await storage.set(`Quot_Version_${issue}`, versionArray);

    const issueUpdatePayload = {
      customfield_12257: JSON.stringify(versionArray),
    };

    const updateQuotIssue = await updateIssueWithRetry(
      issue,
      issueUpdatePayload,
    );

    console.log("All versions field updated... \n", updateQuotIssue);
  } else {
    console.log(
      `Version ${quotVersion} already exists in history. Skipping version list update.`,
    );
  }

  return { success: true };
});

// -----Get Quotation data CAE-----
resolver.define("getQuotationDataCae", async ({ payload }) => {
  let { issue, selectedVersion } = payload;

  console.log("Key: " + issue.key);

  const issueResponse = await fetchIssue(issue.key);

  const product = issueResponse.fields["customfield_10073"]?.value;
  const customer = issueResponse.fields["customfield_10838"]?.value;
  const projectName = issueResponse.fields["summary"];
  const projectType = issueResponse.fields["customfield_10052"]?.value;
  const catiaNxValue = issueResponse.fields["customfield_11803"]?.value;

  const issueData = {
    product,
    customer,
    projectName,
    projectType,
    catiaNxValue,
  };

  const buildKey = (version) =>
    `Quot_${product}_${customer}_${issue.key}_CAE_${version}`;

  // -------------------------------
  // STEP 1: Try selected version
  // -------------------------------
  console.log(`Fetching selected version: ${selectedVersion}`);

  let quot = await storage.get(buildKey(selectedVersion));

  if (quot && Object.keys(quot).length > 0) {
    console.log("Returning selected version data");
    return { quotationData: quot, issueData };
  }

  // -------------------------------
  // STEP 2: Try previous versions
  // -------------------------------
  console.log("Checking previous versions");

  let allVersions = [];

  try {
    allVersions = JSON.parse(issueResponse.fields["customfield_12257"]) || [];
  } catch (e) {
    console.log("Error parsing versions");
  }

  const sortedVersions = allVersions.sort(
    (a, b) => parseInt(a.replace("V", "")) - parseInt(b.replace("V", "")),
  );

  for (let i = sortedVersions.length - 1; i >= 0; i--) {
    const versionToFetch = sortedVersions[i];

    if (versionToFetch === selectedVersion) continue;

    console.log(`Trying fallback version: ${versionToFetch}`);

    let quotLast = await storage.get(buildKey(versionToFetch));

    if (quotLast && Object.keys(quotLast).length > 0) {
      console.log(`Returning fallback version: ${versionToFetch}`);
      return { quotationData: quotLast, issueData };
    }
  }

  // -------------------------------
  // STEP 3: Standard fallback
  // -------------------------------
  console.log("Falling back to standard CAE data");

  try {
    let base64String = await storage.get(STORAGE_KEY);

    if (!base64String) {
      return { quotationData: {}, issueData };
    }

    const uint8Arr = base64ToUint8Array(base64String);
    const decompressedString = pako.inflate(uint8Arr, { to: "string" });
    const data = JSON.parse(decompressedString);

    const productKey = product + " - CAE";

    const productData = data[productKey];

    return { quotationData: productData || {}, issueData };
  } catch (error) {
    console.error("Error fetching CAE standard data:", error);
    return { quotationData: {}, issueData };
  }
});

// -----Save Quotation data CAE-----
resolver.define("saveQuotationDataCae", async ({ payload }) => {
  let {
    issue,
    data,
    workOrderData,
    selectedProductParts,
    currentVersion,
    quotVerTotalHours,
    quotVerTotalCost,
  } = payload;

  console.log("Saving CAE data for: " + issue);
  const updateHoursAndCostResponse = await updateQuotVersionHoursAndCost(
    issue,
    currentVersion,
    quotVerTotalHours,
    quotVerTotalCost,
  );
  console.log("CAE Hours and Payload Updated : ", updateHoursAndCostResponse);
  const issueResponse = await fetchIssue(issue);
  const product = issueResponse.fields["customfield_10073"]?.value; // Product-BU custom field
  const customer = issueResponse.fields["customfield_10838"]?.value;

  // Pass the existing parts directly from the response you already have
  const existingProductParts = issueResponse.fields["customfield_10074"] || [];
  const newProductParts = selectedProductParts || [];

  const updateProductPartsResponse = await updateProductParts(
    issue,
    existingProductParts,
    newProductParts,
  );
  console.log("Product Parts Updated : ", updateProductPartsResponse);

  const quotVersion = issueResponse.fields["customfield_12060"];

  if (!data) {
    throw new Error("No data provided for update");
  }

  console.log(
    `saving... Quot_${product}_${customer}_${issue}_CAE_${quotVersion}`,
  );

  // 1. Always save the actual CAE data (since data might have changed)
  await storage.set(
    `Quot_${product}_${customer}_${issue}_CAE_${quotVersion}`,
    data,
  );

  // 1.5 Save Work Order prepared data for Integration
  if (workOrderData) {
    await storage.set(
      `Quot_WO_${product}_${customer}_${issue}_CAE_${quotVersion}`,
      workOrderData,
    );
    console.log(
      "Setting Work Order data in storage with key: ",
      `Quot_WO_${product}_${customer}_${issue}_CAD_${quotVersion}`,
    );
  }

  // 2. Optimized Version History Update
  const storedVersions = (await storage.get(`Quot_Version_${issue}`)) || [];

  // Check if the version is already known
  if (!storedVersions.includes(quotVersion)) {
    console.log(
      `New version ${quotVersion} detected. Updating history list...`,
    );

    const versionSet = new Set(storedVersions);
    versionSet.add(quotVersion);

    const versionArray = Array.from(versionSet).sort();
    // Only write to storage if it's a brand new version
    await storage.set(`Quot_Version_${issue}`, versionArray);

    const issueUpdatePayload = {
      customfield_12257: JSON.stringify(versionArray),
    };

    const updateQuotIssue = await updateIssueWithRetry(
      issue,
      issueUpdatePayload,
    );

    console.log("All versions field updated... \n", updateQuotIssue);
  } else {
    console.log(
      `Version ${quotVersion} already exists in history. Skipping version list update.`,
    );
  }

  return { success: true };
});

// -----Get Quotation data PS-----
resolver.define("getQuotationDataPs", async ({ payload }) => {
  let { issue, selectedVersion } = payload;

  console.log("Key: " + issue.key);

  const issueResponse = await fetchIssue(issue.key);

  const product = issueResponse.fields["customfield_10073"]?.value;
  const customer = issueResponse.fields["customfield_10838"]?.value;
  const projectName = issueResponse.fields["summary"];
  const projectType = issueResponse.fields["customfield_10052"]?.value;
  const catiaNxValue = issueResponse.fields["customfield_11803"]?.value;

  const issueData = {
    product,
    customer,
    projectName,
    projectType,
    catiaNxValue,
  };

  const buildKey = (version) =>
    `Quot_${product}_${customer}_${issue.key}_PS_${version}`;

  // -------------------------------
  // STEP 1: Try selected version
  // -------------------------------
  console.log(`Fetching selected version: ${selectedVersion}`);

  let quot = await storage.get(buildKey(selectedVersion));

  if (quot && Object.keys(quot).length > 0) {
    console.log("Returning selected version data");
    return { quotationData: quot, issueData };
  }

  // -------------------------------
  // STEP 2: Try previous versions
  // -------------------------------
  console.log("Checking previous versions");

  let allVersions = [];

  try {
    allVersions = JSON.parse(issueResponse.fields["customfield_12257"]) || [];
  } catch (e) {
    console.log("Error parsing versions");
  }

  const sortedVersions = allVersions.sort(
    (a, b) => parseInt(a.replace("V", "")) - parseInt(b.replace("V", "")),
  );

  for (let i = sortedVersions.length - 1; i >= 0; i--) {
    const versionToFetch = sortedVersions[i];

    if (versionToFetch === selectedVersion) continue;

    console.log(`Trying fallback version: ${versionToFetch}`);

    let quotLast = await storage.get(buildKey(versionToFetch));

    if (quotLast && Object.keys(quotLast).length > 0) {
      console.log(`Returning fallback version: ${versionToFetch}`);
      return { quotationData: quotLast, issueData };
    }
  }

  // -------------------------------
  // STEP 3: Standard fallback
  // -------------------------------
  console.log("Falling back to standard PS data");

  try {
    let base64String = await storage.get(STORAGE_KEY);

    if (!base64String) {
      return { quotationData: {}, issueData };
    }

    const uint8Arr = base64ToUint8Array(base64String);
    const decompressedString = pako.inflate(uint8Arr, { to: "string" });
    const data = JSON.parse(decompressedString);

    const productKey = product + " - PS";

    const productData = data[productKey];

    return { quotationData: productData || {}, issueData };
  } catch (error) {
    console.error("Error fetching PS standard data:", error);
    return { quotationData: {}, issueData };
  }
});

// -----Save Quotation data PS-----
resolver.define("saveQuotationDataPs", async ({ payload }) => {
  let {
    issue,
    data,
    workOrderData,
    selectedProductParts,
    currentVersion,
    quotVerTotalHours,
    quotVerTotalCost,
  } = payload;

  console.log("Saving PS data for: " + issue);

  const updateHoursAndCostResponse = await updateQuotVersionHoursAndCost(
    issue,
    currentVersion,
    quotVerTotalHours,
    quotVerTotalCost,
  );

  console.log("PS Hours and Cost Updated : ", updateHoursAndCostResponse);

  const issueResponse = await fetchIssue(issue);
  // const revision = issueResponse.fields["customfield_11663"] // to be used while craeting revision
  const product = issueResponse.fields["customfield_10073"]?.value; // Product-BU custom field
  const customer = issueResponse.fields["customfield_10838"]?.value;

  // Pass the existing parts directly from the response you already have
  const existingProductParts = issueResponse.fields["customfield_10074"] || [];
  const newProductParts = selectedProductParts || [];

  const updateProductPartsResponse = await updateProductParts(
    issue,
    existingProductParts,
    newProductParts,
  );
  console.log("Product Parts Updated : ", updateProductPartsResponse);

  const quotVersion = issueResponse.fields["customfield_12060"];

  if (!data) {
    throw new Error("No data provided for update");
  }

  console.log(
    `saving... Quot_${product}_${customer}_${issue}_PS_${quotVersion}`,
  );

  // 1. Always save the actual PS data (since data might have changed)
  await storage.set(
    `Quot_${product}_${customer}_${issue}_PS_${quotVersion}`,
    data,
  );

  // 1.5 Save Work Order prepared data for Integration
  if (workOrderData) {
    await storage.set(
      `Quot_WO_${product}_${customer}_${issue}_PS_${quotVersion}`,
      workOrderData,
    );
    console.log(
      "Setting Work Order data in storage with key: ",
      `Quot_WO_${product}_${customer}_${issue}_CAD_${quotVersion}`,
    );
  }

  // 2. Optimized Version History Update
  const storedVersions = (await storage.get(`Quot_Version_${issue}`)) || [];

  // Check if the version is already known
  if (!storedVersions.includes(quotVersion)) {
    console.log(
      `New version ${quotVersion} detected. Updating history list...`,
    );

    const versionSet = new Set(storedVersions);
    versionSet.add(quotVersion);

    const versionArray = Array.from(versionSet).sort();
    // Only write to storage if it's a brand new version
    await storage.set(`Quot_Version_${issue}`, versionArray);

    const issueUpdatePayload = {
      customfield_12257: JSON.stringify(versionArray),
    };

    const updateQuotIssue = await updateIssueWithRetry(
      issue,
      issueUpdatePayload,
    );

    console.log("All versions field updated... \n", updateQuotIssue);
  } else {
    console.log(
      `Version ${quotVersion} already exists in history. Skipping version list update.`,
    );
  }

  return { success: true };
});

// ─── QUOTATION COMPARE (Stage 1) — additive only, modifies no existing logic ───

async function fetchWbsChildren(issueKey) {
  const res = await api
    .asApp()
    .requestJira(route`/rest/api/3/issue/${issueKey}?fields=issuelinks`);
  const data = await res.json();
  const links = data.fields.issuelinks || [];
  return links
    .filter(
      (link) =>
        link.type.name === "Hierarchy link (WBSGantt)" && link.outwardIssue,
    )
    .map((link) => ({
      key: link.outwardIssue.key,
      summary: link.outwardIssue.fields.summary,
      typeId: link.outwardIssue.fields.issuetype?.id || null,
    }));
}

// Returns the list of pickable quotation product keys (excludes internal sections).
resolver.define("listQuotations", async () => {
  const base64String = await storage.get(STORAGE_KEY);
  const uint8Arr = base64ToUint8Array(base64String);
  const decompressedString = pako.inflate(uint8Arr, { to: "string" });
  const data = JSON.parse(decompressedString);

  // Pickable products (CAD, - PS, and - CAE) all share the product shape:
  // an `activities` object plus an `id`. Internal sections
  // (Reporting Manager, Milestone, Data Management, "2D DELIVERABLES",
  // "2D Drawing", Industrialization) lack that combo and are excluded by shape.
  // These three sections carry a product-like shape (.activities + id) but are
  // NOT pickable products, so exclude them by name in addition to the shape test.
  const SECTION_EXCLUDE = new Set([
    "2D Drawing",
    "2D DELIVERABLES",
    "Data Management",
    "Industrialization",
    "Reporting Manager",
    "Milestone",
  ]);
  const keys = Object.keys(data).filter((k) => {
    if (SECTION_EXCLUDE.has(k)) return false;
    const entry = data[k];
    return (
      entry &&
      typeof entry === "object" &&
      entry.activities &&
      typeof entry.activities === "object" &&
      "id" in entry
    );
  });

  const dropped = Object.keys(data).filter((k) => !keys.includes(k));
  console.log(`[compare] listQuotations kept ${keys.length}:`, keys);
  console.log(`[compare] listQuotations dropped:`, dropped);

  return { keys };
});

// ITERATIONS|ITERATIONS is derived, not quoted. The blob stores it as zero and
// Create Phase computes it in the browser — create-phase/App.js 200-215 — so
// the cook returns 0 and the compare would call it a Remove on an activity that
// has real hours in Jira, and delete the group on an armed run.
// recomputeSnapshotHeader already applies this at line 7246; the comparison
// needs the same arithmetic.
function applyIterations(cooked) {
  const itKey = Object.keys(cooked || {}).find((k) => k.includes("ITERATIONS"));
  if (!itKey) return cooked;
  const it = cooked[itKey] || {};
  const pct = it.percentage || 0;
  const loops = it.noOfLoops || 1;
  if (!pct) return cooked;

  // Same filter as the form: DE only, excluding ITERATIONS and TCL ACTIVITIES.
  // checked and standardLoop are not on the cooked rows — the cook returns
  // every activity in the blob — but an unticked activity has DE 0, so it
  // contributes nothing either way.
  const base = Object.entries(cooked).reduce(
    (sum, [k, v]) =>
      k.includes("ITERATIONS") || k.includes("TCL ACTIVITIES")
        ? sum
        : sum + (v?.DE || 0),
    0,
  );
  const value = Number(((base * loops * pct) / 100).toFixed(2));
  cooked[itKey] = {
    ...it,
    DE: value,
    TDL: 0,
    COO: 0,
    standard: value,
    total: value,
  };
  console.log(
    `[cook] ${itKey}: ${base} DE x ${loops} loops x ${pct}% = ${value}`,
  );
  return cooked;
}

// The unrounded cook for one phase. runComparison rounds to one decimal for
// display; the snapshot stores raw values, so Step 5 needs what it rounds away.
// The unrounded cook for one phase, from the version the caller names.
// computeConfigData is Sayan's getConfigData body: it routes the quotation
// catalogs, noOfComponent, the Phases gate, Industrialization and CAE, and it
// re-parses the blob per call so nothing is shared between phases.
async function cookForPhase(projectKey, phaseName, version, catalogKey) {
  const res = await computeConfigData({
    issue: { key: projectKey },
    phase: phaseName,
    key: "Activity",
    versionOverride: version || null,
    catalogOverride: catalogKey || null,
  });
  return res?.activity ? applyIterations(res.activity) : null;
}

// A group with no standard hours is either an Extra Work / Re-Work group, or a
// standard group whose hours rule 4 cleared. 10061 being null cannot tell them
// apart — only the children can. processLoops appends "| Extra Work" or
// "| Re-Work" to the summary at the Activity, Work Order and Task level
// (lines 974, 1056, 1086), so the whole branch is identifiable.
//
// Create Phase builds an EW/RW group in two passes: tick the activity with
// standardLoop 0 and Create, which makes a bare group; reopen, set the extra
// work or rework loops, and Create again, which fills it in. So an EW/RW group
// is one whose Activity children ALL carry the suffix.
const EWRW_SUFFIX = /\|\s*(Extra Work|Re-Work)\s*$/i;

async function classifyNullGroup(agKey) {
  const kids = await fetchWbsChildren(agKey);
  const acts = kids.filter((c) => c.typeId === "10008");
  let ewrw = 0,
    std = 0;
  acts.forEach((a) => (EWRW_SUFFIX.test(a.summary) ? ewrw++ : std++));
  return { ewrw, std, isEwRw: ewrw > 0 && std === 0, total: acts.length };
}

// The status each group will END UP in. Compare becomes the only screen once
// Plan comes out at go-live, so it has to say what will happen, not just what
// changed. Derived from resolvePlanRule so the rules live in one place.
function nextStatusFor(action, status) {
  if (action === PLAN_ACTION.DELETE) return "Removed";
  if (
    action === PLAN_ACTION.CLOSE_BRANCH ||
    action === PLAN_ACTION.CLEAR_AND_CLOSE
  )
    return "Closed";
  // Ruling 3 reopens a closed group. Ruling 2's is already In Progress and
  // transitionTo returns ALREADY, so its status does not move.
  if (action === PLAN_ACTION.CLOSE_EWRW_ADD)
    return status === "Closed" ? "In Progress" : status;
  if (action === PLAN_ACTION.UPDATE_AND_REOPEN) return "In Progress";
  // Rule 2.2 — CANCELLED goes back to Not Started. That is the group's only
  // transition out of that status: id 7 "Reopen".
  if (action === PLAN_ACTION.UNCANCEL) return "Not Started";
  return status;
}

// buildPlan re-reads the hours live before it deletes anything — that is the
// safety gate and it stays there. This is the same test done from data Compare
// already has, so the preview does not promise a delete that will be vetoed.
function previewVeto(flag, action, actual) {
  if (
    flag &&
    (action === PLAN_ACTION.DELETE ||
      action === PLAN_ACTION.CLEAR ||
      action === PLAN_ACTION.CLEAR_AND_CLOSE ||
      action === PLAN_ACTION.CLOSE_BRANCH)
  )
    return true;
  if (action === PLAN_ACTION.DELETE && (actual ?? 0) > 0) return true;
  return false;
}

// The comparison body, extracted so Stage 2 can call the SAME code the UI calls.
// A copy would drift the moment one side changed; one implementation cannot.
async function runComparison(payload) {
  const { issue } = payload;
  // The version picked in the dropdown. Absent means the project has no linked
  // quotation, and computeConfigData falls back to the static catalog exactly
  // as Create Phase does.
  const version = payload?.version || null;
  const projectKey = issue.key;
  // Step 3c writes one phase, but this still cooked all three and read every
  // activity group in the project — roughly 60 fetches and three inflates, which
  // is where the 55 second consumer budget went. The write path passes
  // phaseKey; the UI passes nothing and still gets every phase.
  const onlyPhaseKey = payload?.phaseKey || null;

  // read project product parts + customer + current product (drive the cook)
  const projRes = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${projectKey}?fields=customfield_10074,customfield_10838,customfield_10073,customfield_12059,customfield_12738`,
    );
  const projFields = (await projRes.json()).fields;
  const productParts = (projFields.customfield_10074 || []).map((e) => e.value);
  const customer = projFields.customfield_10838?.value;

  // Reading A: the project owns its product; the NEW side is a revision of that same product.
  const currentProductKey = projFields.customfield_10073?.value;
  if (!currentProductKey) {
    return {
      ok: false,
      error: "NO_PRODUCT",
      message: "This project has no Product-BU set.",
    };
  }

  // The Quot_WO_ key is written from the QUOTATION issue's product and customer
  // and read using the PROJECT's. If they differ the blob is never found and
  // computeConfigData falls back to the static catalog without saying so —
  // plausible numbers from the wrong source. The UI blocks this, but a stale
  // frontend or a direct invoke would not, and buildPlan calls this function,
  // so the overwrite path would inherit the hole.
  if (version) {
    const linked = (projFields.customfield_12059?.value ?? "No") === "Yes";
    const qKey = String(projFields.customfield_12738 || "").split(" ## ")[1];
    if (linked && qKey) {
      const qres = await api
        .asApp()
        .requestJira(
          route`/rest/api/3/issue/${qKey}?fields=customfield_10073,customfield_10838`,
        );
      if (qres.ok) {
        const qf = (await qres.json()).fields || {};
        const qProduct = qf.customfield_10073?.value ?? null;
        const qCustomer = qf.customfield_10838?.value ?? null;
        // Base names only — one quotation covers CAD, CAE and PS.
        const baseOf = (s) =>
          String(s || "")
            .split(" -")[0]
            .trim();
        if (
          baseOf(qProduct) !== baseOf(currentProductKey) ||
          qCustomer !== customer
        ) {
          console.error(
            `[compare] MISMATCH ${projectKey} is ${currentProductKey}/${customer} but ${qKey} is ${qProduct}/${qCustomer}`,
          );
          return {
            ok: false,
            error: "QUOTATION_MISMATCH",
            message: `This project is ${currentProductKey} for ${customer}, but ${qKey} is ${qProduct} for ${qCustomer}. No quotation data can be read while they differ.`,
            projectProduct: currentProductKey,
            quotationProduct: qProduct,
            projectCustomer: customer,
            quotationCustomer: qCustomer,
          };
        }
      }
    }
  }

  // SELF-TEST SWITCH.
  //   false -> normal: compare against the "X New" revision in the blob.
  //   true  -> calibration: compare the project against its OWN product, so both
  //            sides cook the identical recipe. Every AG that has a baseline MUST
  //            then read SAME. Any CHANGE / REMOVE / ORPHAN is a bug in the
  //            compare code, not a quotation difference.
  //   Only meaningful while the catalog has not been edited since Create Phase
  //   ran for this project — otherwise the difference is catalog drift, not a bug.
  // No version means Phase Configuration: cook the "{product} New" catalog
  // entry rather than the one the project was built from, which would only ever
  // return no change. Guarded here as well as in the UI — computeConfigData
  // does data[key].activities with no null check, so a missing entry throws.
  let catalogKey = null;
  if (!version) {
    const candidate = `${currentProductKey} New`;
    try {
      const cfg = JSON.parse(
        pako.inflate(base64ToUint8Array(await storage.get(STORAGE_KEY)), {
          to: "string",
        }),
      );
      if (cfg?.[candidate]?.activities) catalogKey = candidate;
    } catch (e) {
      catalogKey = null;
    }
    if (!catalogKey) {
      return {
        ok: false,
        error: "NO_CATALOG_REVISION",
        message: `Phase Configuration has no "${candidate}" to compare against.`,
        currentProduct: currentProductKey,
      };
    }
  }
  const COOK_KEY = version || catalogKey;

  console.log(
    `[compare] COOK project=${projectKey} product="${currentProductKey}" version="${version || "phase configuration"}" customer="${customer}" parts=${productParts.length}`,
  );

  const phases = await fetchWbsChildren(projectKey);

  // If every phase was already built from — or overwritten to — the version
  // being compared against, there is nothing to find. Checked before the cook
  // rather than after, so it costs three storage reads instead of a full
  // comparison. Requires every phase to carry a stamp: a phase created before
  // stamping, or one built from a different version, falls through and compares
  // normally.
  // payload.force is the developer unlock — ten clicks on the version box —
  // so a version can be compared against itself.
  if (version && !payload?.force) {
    const stamps = [];
    for (const phase of phases) {
      if (onlyPhaseKey && phase.key !== onlyPhaseKey) continue;
      const pn = phase.summary.replace(/^\d+\s*/, "").trim();
      try {
        const b64 = await storage.get(`${projectKey}_${pn}`);
        stamps.push(
          b64
            ? (JSON.parse(
                pako.inflate(base64ToUint8Array(b64), { to: "string" }),
              ).quotationVersion ?? null)
            : null,
        );
      } catch (e) {
        stamps.push(null);
      }
    }
    if (stamps.length && stamps.every((s) => s === version)) {
      console.log(
        `[compare] ${projectKey} is already ${version} on every phase — nothing to compare`,
      );
      return {
        ok: true,
        projectKey,
        currentProduct: currentProductKey,
        newProduct: version,
        sameVersion: version,
        // Which phase this applies to. The compare is per phase now, so a
        // result left in state while the next phase loads would otherwise be
        // rendered against the new tab's name.
        sameVersionPhaseKey: onlyPhaseKey,
        result: [],
      };
    }
  }

  const result = [];

  for (const phase of phases) {
    if (onlyPhaseKey && phase.key !== onlyPhaseKey) continue;
    const phaseName = phase.summary.replace(/^\d+\s*/, "").trim();

    // What this phase was ACTUALLY built from, as opposed to what
    // customfield_12738 claims — that field records what the link says and can
    // be edited independently of the hierarchy. Absent on phases created before
    // the stamp existed, which is every project today.
    let builtFromStamp = null;
    // Which activities Create Phase actually built. Anything in the hierarchy
    // that is not in here was made by hand, and the quotation cannot have
    // dropped something it never contained.
    let snapshotKeys = null;
    try {
      const snapB64 = await storage.get(`${projectKey}_${phaseName}`);
      if (snapB64) {
        const snap = JSON.parse(
          pako.inflate(base64ToUint8Array(snapB64), { to: "string" }),
        );
        builtFromStamp = snap.quotationVersion ?? null;
        snapshotKeys = new Set(
          (snap.activities || []).map((a) =>
            String(a.key || "")
              .split("|")
              .map((p) => p.trim())
              .join(" | ")
              .toLowerCase(),
          ),
        );
      }
    } catch (e) {
      builtFromStamp = null;
      snapshotKeys = null;
    }

    // The phase's own Standard Hrs TOT, so Compare shows the number the Gantt
    // shows rather than a sum that rounds differently.
    const phRes = await api
      .asApp()
      .requestJira(
        route`/rest/api/3/issue/${phase.key}?fields=customfield_10061`,
      );
    const phaseTotal = (await phRes.json()).fields?.customfield_10061 ?? null;

    // Cook the selected version for this phase. computeConfigData re-parses the
    // blob on every call, so the deep copy the old fork needed is unnecessary:
    // processJsonWithPhase can only mutate that call's own data.
    const cooked =
      (await cookForPhase(projectKey, phaseName, version, catalogKey)) || {};
    const cookDiag = null;

    // read live AGs for this phase (key, summary, status, current std)
    // A Phase's WBSGantt children include Milestones (10012) as well as Activity
    // Groups (10019) — Create Phase links both to the Phase. A Milestone can never
    // match a cooked activity, so they arrived as ORPHAN rows and would hit Excel
    // row 1 (not in quotation + Not Started + no actuals = delete). Sayan: leave
    // milestones untouched, compare activities only.
    const ags = (await fetchWbsChildren(phase.key)).filter(
      (c) => c.typeId === "10019",
    );
    const agRows = [];
    for (const ag of ags) {
      const res = await api
        .asApp()
        .requestJira(
          route`/rest/api/3/issue/${ag.key}?fields=summary,status,customfield_10061,customfield_10065,customfield_10075,customfield_10076,customfield_10077`,
        );
      const f = (await res.json()).fields;
      // Only for groups with no standard hours — one extra fetch each, and
      // there are rarely more than one or two per phase.
      const ewrwInfo =
        (f.customfield_10061 ?? null) === null
          ? await classifyNullGroup(ag.key)
          : null;
      agRows.push({
        key: ag.key,
        summary: f.summary,
        status: f.status?.name || null,
        ewrw: ewrwInfo,
        currentStd: f.customfield_10061 ?? null,
        currentActual: f.customfield_10065 ?? null,
        currentCOO: f.customfield_10075 ?? null,
        currentDE: f.customfield_10076 ?? null,
        currentTDL: f.customfield_10077 ?? null,
      });
    }

    // --- JOIN + VERDICT ---
    // normalize a summary to a comparable activity key:
    // strip leading "Group N |", collapse whitespace around pipes, lowercase
    const norm = (s) =>
      s
        .replace(/^Group\s+\S+\s*\|/, "") // drop "Group 102 |"
        .split("|")
        .map((p) => p.trim())
        .join(" | ")
        .toLowerCase();

    // build lookup of cooked activities by normalized key
    const cookedByNorm = {};
    Object.entries(cooked).forEach(([actKey, v]) => {
      cookedByNorm[norm(actKey)] = {
        actKey,
        newStd: v.standard,
        newTDL: v.TDL ?? null,
        newDE: v.DE ?? null,
        newCOO: v.COO ?? null,
      };
    });

    const round1 = (n) =>
      n === null || n === undefined ? null : Number(Number(n).toFixed(1));
    const matchedCookedKeys = new Set();
    const verdicts = [];

    for (const ag of agRows) {
      const key = norm(ag.summary);
      const hit = cookedByNorm[key];
      const isClosed = ag.status === "Closed";
      const cur = round1(ag.currentStd);

      if (!hit) {
        // Two different things look the same here: an activity the quotation
        // dropped, and a group somebody added by hand. The snapshot separates
        // them — it lists what Create Phase built, so a group that is in it and
        // not in the cook is a real de-scope, and one that was never in it was
        // never part of any quotation. Swapnil: leave those alone.
        const wasPlanned = snapshotKeys ? snapshotKeys.has(key) : false;
        const dropped = Boolean(version) && wasPlanned;
        verdicts.push({
          ...ag,
          newStd: dropped ? 0 : null,
          verdict: dropped
            ? "REMOVE (dropped from the quotation)"
            : "ORPHAN (no cooked match)",
        });
        continue;
      }
      matchedCookedKeys.add(key);
      const nw = round1(hit.newStd);

      // role-level values, current (Jira) vs new (cook)
      const curTDL = round1(ag.currentTDL);
      const curDE = round1(ag.currentDE);
      const curCOO = round1(ag.currentCOO);
      const nwTDL = round1(hit.newTDL);
      const nwDE = round1(hit.newDE);
      const nwCOO = round1(hit.newCOO);

      // Industrialization cooks only a total — no role split exists there,
      // so don't let missing roles register as a difference.
      const hasRoles = nwTDL !== null || nwDE !== null || nwCOO !== null;
      const rolesSame =
        !hasRoles || (nwTDL === curTDL && nwDE === curDE && nwCOO === curCOO);

      let verdict;
      // Ruling 3 — a CLOSED extra work group whose activity is back in the
      // quotation. Checked before the closed test, which would otherwise lock
      // it and skip it forever.
      if (isClosed && cur === null && ag.ewrw?.isEwRw && nw > 0) {
        verdict = "ADD STANDARD (extra work group)";
      } else if (cur === null && ag.ewrw?.isEwRw) {
        // Swapnil: treat these like a standard group. The quotation decides
        // whether the activity exists at all; the extra work loops go with it.
        verdict =
          nw > 0
            ? "ADD STANDARD (extra work group)"
            : "REMOVE (extra work group)";
      } else if (cur === null) {
        verdict = "NOT PLANNED (no baseline)";
      } else if (nw === cur && rolesSame) {
        verdict = "SAME";
      } else if (nw === 0) {
        verdict = "REMOVE -> 0";
      } else {
        verdict = "CHANGE";
      }
      // safeguard: a 0 caused by a MISSING cook section (2D/DM not configured for this key)
      // is suspect, not a real de-scope. Flag it so the UI can warn.
      const isDrawingRow = ag.summary.includes("2D DELIVERABLES");
      const isDataMgmtRow = ag.summary.includes("DATA MANAGEMENT");
      let flag = null;
      if (nw === 0) {
        if (
          isDrawingRow &&
          cookDiag &&
          cookDiag.twoD_drawingDefined === false
        ) {
          flag = "MISSING_2D_CONFIG";
        } else if (
          isDataMgmtRow &&
          cookDiag &&
          cookDiag.dm_customersDefined === false
        ) {
          flag = "MISSING_DM_CONFIG";
        }
      }
      const planRule = resolvePlanRule({ verdict, status: ag.status });
      const previewVetoed = previewVeto(
        flag,
        planRule.action,
        ag.currentActual,
      );
      verdicts.push({
        ...ag,
        nextStatus: previewVetoed
          ? ag.status
          : nextStatusFor(planRule.action, ag.status),
        currentStd: cur,
        newStd: nw,
        currentTDL: curTDL,
        currentDE: curDE,
        currentCOO: curCOO,
        newTDL: nwTDL,
        newDE: nwDE,
        newCOO: nwCOO,
        verdict,
        flag,
      });
    }

    // cooked activities with NO matching AG = ADD candidates
    const added = [];
    Object.entries(cookedByNorm).forEach(([k, { actKey, newStd }]) => {
      if (!matchedCookedKeys.has(k) && round1(newStd) > 0) {
        added.push({
          actKey,
          newStd: round1(newStd),
          verdict: "ADD (no AG yet)",
        });
      }
    });

    // AG order comes from Jira's issuelinks array, which is link-creation
    // order. Deleting and recreating an AG appends its new key at the end,
    // which splits a WBS section across the table. Sort by the numeric
    // "Group N" prefix so order is stable no matter when an AG was created.
    const groupNo = (s) => {
      const m = String(s || "").match(/^Group\s+(\d+)/i);
      return m ? parseInt(m[1], 10) : 9999;
    };
    verdicts.sort((a, b) => groupNo(a.summary) - groupNo(b.summary));

    // concise log of decisions for this phase
    console.log(`[compare] === ${phase.summary} verdicts ===`);
    verdicts.forEach((v) =>
      console.log(
        `[compare]   ${v.verdict} | "${v.summary}" | cur=${v.currentStd} new=${v.newStd} | ${v.status}`,
      ),
    );
    added.forEach((a) =>
      console.log(`[compare]   ${a.verdict} | "${a.actKey}" | new=${a.newStd}`),
    );

    // phaseKey is needed by Step 3's rollup — the plan only carried the label.
    // `cooked` is the unrounded cook Step 5 writes into the snapshot. Built
    // here already — rebuilding it cost an extra fetch, inflate and cook.
    result.push({
      phase: phase.summary,
      phaseKey: phase.key,
      phaseTotal,
      builtFromStamp,
      verdicts,
      added,
      cooked,
    });
  }

  console.log(`[compare] COOK DONE`);
  return {
    ok: true,
    projectKey,
    currentProduct: currentProductKey,
    newProduct: COOK_KEY,
    result,
  };
}

// ─── QUOTATION VERSIONS (read-only) ──────────────────────────────────────────
// The compare needs a list of versions to pick a target from, and there is no
// way to enumerate them from storage: Forge has no storage.query, and the
// Quot_WO_ keys are only ever built, never listed.
//
// saveQuotationData writes the version history to customfield_12257 on the
// QUOTATION issue in the same block as it writes the Quot_WO_ key, so the two
// cannot fall out of step. Sayan's own code already reads it back the same way.
//
// The project's customfield_12738 is "summary ## quotation ## version": part 1
// names the quotation issue, part 2 the version this project was built from.
resolver.define("listQuotationVersions", async ({ payload }) => {
  const projectKey = payload?.issue?.key;
  if (!projectKey) {
    return { ok: false, error: "NO_ISSUE" };
  }

  const res = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${projectKey}?fields=customfield_12059,customfield_12738,customfield_10073,customfield_10838,customfield_10052`,
    );
  if (!res.ok) {
    return { ok: false, error: "FETCH_FAILED", status: res.status };
  }
  const f = (await res.json()).fields || {};

  // Same gate getConfigData uses. "No" means the project was built from the
  // static Phase Configuration catalog, and that is what the compare uses too.
  const linked = (f["customfield_12059"]?.value ?? "No") === "Yes";
  const parts = String(f["customfield_12738"] || "").split(" ## ");
  const quotationKey = parts[1] || null;
  const builtFrom = parts[2] || null;

  const productKey = f["customfield_10073"]?.value ?? null;
  const family = productKey
    ? productKey.includes("- CAE")
      ? "CAE"
      : productKey.includes("- PS")
        ? "PS"
        : "CAD"
    : null;

  // Does Phase Configuration hold a "{product} New" to compare against? The
  // dropdown offers Phase Configuration only when it does — computeConfigData
  // reads data[key].activities with no null check, so a missing entry throws.
  let hasCatalogNew = false;
  if (productKey) {
    try {
      const cfg = JSON.parse(
        pako.inflate(base64ToUint8Array(await storage.get(STORAGE_KEY)), {
          to: "string",
        }),
      );
      hasCatalogNew = Boolean(cfg?.[`${productKey} New`]?.activities);
    } catch (e) {
      hasCatalogNew = false;
    }
  }

  if (!linked || !quotationKey) {
    return {
      ok: true,
      linked: false,
      versions: [],
      hasCatalogNew,
      quotationKey,
      builtFrom,
      productKey,
      family,
      reason: !linked ? "NO_QUOTATION_REFERENCE" : "NO_QUOTATION_KEY",
    };
  }

  // 12257 lives on the QUOTATION issue, not the project. Reading it from the
  // project key would silently return nothing.
  const qres = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${quotationKey}?fields=customfield_12257,customfield_12060,status,customfield_10073,customfield_10838`,
    );
  if (!qres.ok) {
    return {
      ok: false,
      error: "QUOTATION_FETCH_FAILED",
      quotationKey,
      status: qres.status,
    };
  }
  const qf = (await qres.json()).fields || {};

  let versions = [];
  try {
    versions = JSON.parse(qf["customfield_12257"]) || [];
  } catch (e) {
    versions = [];
  }
  // The field can lag by one when a version was just saved, so fold in the
  // current one rather than trusting the list alone.
  const current = qf["customfield_12060"] || null;
  const quotStatus = qf.status?.name || null;

  // The Quot_WO_ key is written from the QUOTATION issue's product and customer
  // and read using the PROJECT's. If they differ the blob can never be found and
  // the cook falls back to the static catalog without saying so — the same
  // silent failure in Create Phase as here.
  const customerName = f["customfield_10838"]?.value ?? null;
  const quotProduct = qf["customfield_10073"]?.value ?? null;
  const quotCustomer = qf["customfield_10838"]?.value ?? null;
  // One quotation issue covers CAD, CAE and PS — the family lives in the key's
  // own segment, not in the product name. The read side already strips the
  // suffix via baseKey, so a "Headliner - CAE" project on a "Headliner"
  // quotation is correct and must not be flagged.
  const baseOf = (s) =>
    String(s || "")
      .split(" -")[0]
      .trim();
  const mismatch =
    baseOf(quotProduct) !== baseOf(productKey) || quotCustomer !== customerName
      ? {
          projectProduct: productKey,
          quotationProduct: quotProduct,
          projectCustomer: customerName,
          quotationCustomer: quotCustomer,
        }
      : null;
  if (mismatch) {
    console.error(
      `[ver] MISMATCH ${projectKey} is ${productKey}/${customerName} but ${quotationKey} is ${quotProduct}/${quotCustomer}`,
    );
  }

  if (current && !versions.includes(current)) versions.push(current);
  if (builtFrom && !versions.includes(builtFrom)) versions.push(builtFrom);

  versions.sort(
    (a, b) =>
      parseInt(String(a).replace(/\D/g, ""), 10) -
      parseInt(String(b).replace(/\D/g, ""), 10),
  );

  // Only a closed version is safe to compare against — a draft's hours are
  // still moving. Every version except the current one has already been through
  // Closed, since that is the only route to Re-Quotation; the current one is
  // closed only while the issue itself is.
  //
  // builtFrom is NOT excluded. customfield_12738 only records what the link
  // says, not that the hierarchy was built from it: a project created from
  // Phase Configuration and linked to a quotation afterwards names a version it
  // was never built from, and that is exactly the comparison the user wants.
  const closed = versions.filter(
    (v) => v !== current || quotStatus === "Closed",
  );

  // Probe the storage keys getConfigData would look for. Same key construction,
  // so a miss here is the miss Create Phase is having — and it says so in the
  // browser console rather than needing forge logs.
  const baseKey = family === "CAD" ? productKey : productKey.split(" -")[0];
  const probes = [];
  for (const v of closed) {
    const k = `Quot_WO_${baseKey}_${customerName}_${quotationKey}_${family}_${v}`;
    let found = false;
    let size = 0;
    try {
      const blob = await storage.get(k);
      found = Boolean(blob);
      size = typeof blob === "string" ? blob.length : 0;
    } catch (e) {
      found = false;
    }
    probes.push({ version: v, key: k, found, size });
    console.log(`[ver] ${found ? "FOUND  " : "MISSING"} ${k}`);
  }

  console.log(
    `[ver] ${projectKey} -> ${quotationKey} ${family} status ${quotStatus}, current ${current}, built from ${builtFrom}, closed ${closed.join(", ") || "none"}`,
  );
  return {
    ok: true,
    linked: true,
    hasCatalogNew,
    mismatch,
    probes,
    quotationKey,
    quotStatus,
    closed,
    builtFrom,
    current,
    productKey,
    family,
    customer: f["customfield_10838"]?.value ?? null,
    projectType: f["customfield_10052"]?.value ?? null,
    versions,
  };
});

// ─── QUOTATION DUMP (read-only) — never writes, never deletes ────────────────
// Everything the compare will need from a quotation blob, printed rather than
// guessed at: the exact key getConfigData builds, whether the blob is there,
// what shape it has, and — when two versions are given — precisely which
// activities and multipliers differ between them.
resolver.define("dumpQuotation", async ({ payload }) => {
  const projectKey = payload?.issue?.key;
  const wantVersion = payload?.version || null;
  if (!projectKey) return { ok: false, error: "NO_ISSUE" };

  const res = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${projectKey}?fields=customfield_12059,customfield_12738,customfield_10073,customfield_10838,customfield_10052`,
    );
  const f = (await res.json()).fields || {};
  const linked = (f["customfield_12059"]?.value ?? "No") === "Yes";
  const parts = String(f["customfield_12738"] || "").split(" ## ");
  const quotationKey = parts[1] || null;
  const builtFrom = parts[2] || null;
  const productKey = f["customfield_10073"]?.value ?? null;
  const customer = f["customfield_10838"]?.value ?? null;
  const projectType = f["customfield_10052"]?.value ?? null;
  if (!linked || !quotationKey || !productKey) {
    return { ok: true, linked: false, projectKey, reason: "NOT_LINKED" };
  }
  const family = productKey.includes("- CAE")
    ? "CAE"
    : productKey.includes("- PS")
      ? "PS"
      : "CAD";
  const baseKey = family === "CAD" ? productKey : productKey.split(" -")[0];

  // Exactly how getConfigData reads it: base64 -> inflate -> parse.
  async function load(v) {
    const key = `Quot_WO_${baseKey}_${customer}_${quotationKey}_${family}_${v}`;
    const out = { version: v, key, found: false };
    try {
      const b64 = await storage.get(key);
      if (!b64) return out;
      out.found = true;
      out.base64Length = typeof b64 === "string" ? b64.length : 0;
      const data = JSON.parse(
        pako.inflate(base64ToUint8Array(b64), { to: "string" }),
      );
      out.topKeys = Object.keys(data);
      out.activityCount = Object.keys(data.activities || {}).length;
      out.phases = data.Phases || null;
      out.offerActivities = Object.keys(data.Offer?.activities || {});
      out.industrialization = Object.keys(data.Industrialization || {});
      out.data = data;
    } catch (e) {
      out.error = e?.message;
    }
    return out;
  }

  const a = await load(builtFrom);
  const b =
    wantVersion && wantVersion !== builtFrom ? await load(wantVersion) : null;

  // What actually differs. A version bump moves the Proto and Serie multipliers
  // rather than TDL/COO/DE, so those are what the compare will pick up.
  let diff = null;
  if (a.data && b?.data) {
    const META = ["extraWorkLoop", "reWorkLoop", "standardLoop", "checked"];
    const rows = [];
    const names = new Set([
      ...Object.keys(a.data.activities || {}),
      ...Object.keys(b.data.activities || {}),
    ]);
    for (const n of names) {
      const x = a.data.activities?.[n];
      const y = b.data.activities?.[n];
      if (!x || !y) {
        rows.push({
          activity: n,
          change: x ? "removed in new" : "added in new",
        });
        continue;
      }
      for (const m of META) {
        if (x[m] !== y[m])
          rows.push({ activity: n, field: m, from: x[m], to: y[m] });
      }
      for (const part of Object.keys(x)) {
        if (META.includes(part) || part === "order") continue;
        const p = x[part];
        const q = y[part];
        if (!p || typeof p !== "object" || !q) continue;
        for (const fl of [
          "TDL",
          "COO",
          "DE",
          "Proto",
          "Serie",
          "noOfComponent",
          "componentSelected",
        ]) {
          if (p[fl] !== q[fl])
            rows.push({
              activity: `${n} | ${part}`,
              field: fl,
              from: p[fl],
              to: q[fl],
            });
        }
      }
    }
    diff = { count: rows.length, rows: rows.slice(0, 80) };
    console.log(
      `[quot] ${builtFrom} -> ${wantVersion}: ${rows.length} differences`,
    );
    rows
      .slice(0, 25)
      .forEach((r) =>
        console.log(
          `[quot]   ${r.activity} ${r.field || ""} ${r.from} -> ${r.to}`,
        ),
      );
  }

  // The catalogs the cook reads for 2D and Data Management. Without these the
  // quotation blobs alone are not enough to reproduce the cooked hours.
  let catalogs = null;
  if (payload?.includeRaw) {
    try {
      const cfg = JSON.parse(
        pako.inflate(base64ToUint8Array(await storage.get(STORAGE_KEY)), {
          to: "string",
        }),
      );
      catalogs = {
        twoDQuotation:
          cfg["2D Drawing - Quotation"]?.activities?.[projectType]?.[baseKey] ??
          null,
        // update2DDrawingData multiplies the catalog hours by a per-phase
        // percentage, so the values alone cannot reproduce the cook.
        twoDPercentages: cfg["2D Drawing - Quotation"]?.percentages ?? null,
        dmQuotation:
          cfg["Data Management - Quotation"]?.[projectType]?.customers?.[
            baseKey
          ]?.[customer] ??
          cfg["Data Management - Quotation"]?.[projectType]?.customers?.[
            baseKey
          ]?.["Standard"] ??
          null,
        dmPercentages: cfg["Data Management - Quotation"]?.percentages ?? null,
        // The cook sums only the parts selected on the project, so the totals
        // cannot be checked without knowing which.
        productParts: productParts ?? null,
        industrialization: cfg[baseKey]?.["Industrialization"] ?? null,
        phases: cfg[baseKey]?.["Phases"] ?? null,
      };
    } catch (e) {
      catalogs = { error: e?.message };
    }
  }

  // The blobs are large, so they are only returned when explicitly asked for.
  if (!payload?.includeRaw) {
    delete a.data;
    if (b) delete b.data;
  }
  console.log(`[quot] ${a.found ? "FOUND  " : "MISSING"} ${a.key}`);
  if (b) console.log(`[quot] ${b.found ? "FOUND  " : "MISSING"} ${b.key}`);

  return {
    ok: true,
    linked: true,
    projectKey,
    quotationKey,
    productKey,
    baseKey,
    customer,
    projectType,
    family,
    builtFrom,
    compareTo: wantVersion,
    current: a,
    target: b,
    catalogs,
    diff,
  };
});

// ─── COOK DUMP (read-only) — prints what the cook actually returns ───────────
// Every other diagnostic shows inputs. This shows the OUTPUT: the cooked hours
// per activity for a phase, and — when a version is given — the same phase
// cooked from that version beside it. It calls computeConfigData, the same
// function the compare uses, so it cannot disagree with what Compare shows.
resolver.define("dumpCook", async ({ payload }) => {
  const projectKey = payload?.issue?.key;
  const phase = payload?.phase || "Proto";
  const version = payload?.version || null;
  if (!projectKey) return { ok: false, error: "NO_ISSUE" };

  async function cook(v) {
    try {
      const r = await computeConfigData({
        issue: { key: projectKey },
        phase,
        key: "Activity",
        versionOverride: v,
      });
      return r?.activity || {};
    } catch (e) {
      console.error(`[cook] ${v || "linked version"} failed: ${e?.message}`);
      return {};
    }
  }

  // Left: whatever the project is linked to, i.e. what Create Phase would show.
  // Right: the version picked in the dropdown.
  const base = await cook(null);
  const target = version ? await cook(version) : null;

  const names = Array.from(
    new Set([...Object.keys(base), ...Object.keys(target || {})]),
  ).sort();
  const r1 = (n) =>
    n === null || n === undefined ? null : Number(Number(n).toFixed(1));

  const rows = names.map((n) => {
    const a = base[n] || {};
    const b = target ? target[n] || {} : {};
    const row = {
      activity: n,
      std: r1(a.standard),
      TDL: r1(a.TDL),
      COO: r1(a.COO),
      DE: r1(a.DE),
    };
    if (target) {
      row.newStd = r1(b.standard);
      row.newTDL = r1(b.TDL);
      row.newCOO = r1(b.COO);
      row.newDE = r1(b.DE);
      row.delta =
        row.std === null || row.newStd === null
          ? null
          : r1(row.newStd - row.std);
    }
    return row;
  });

  const sum = (k) => r1(rows.reduce((t, x) => t + (x[k] || 0), 0));

  console.log(
    `[cook] ${projectKey} ${phase}: ${Object.keys(base).length} activities, total ${sum("std")}` +
      (target
        ? ` -> ${version}: ${Object.keys(target).length} activities, total ${sum("newStd")}`
        : ""),
  );
  rows
    .filter((x) => !target || x.delta !== 0)
    .slice(0, 60)
    .forEach((x) =>
      console.log(
        `[cook]   ${x.activity.padEnd(52).slice(0, 52)} ${String(x.std).padStart(9)}` +
          (target ? ` -> ${String(x.newStd).padStart(9)}  ${x.delta}` : ""),
      ),
    );

  return {
    ok: true,
    projectKey,
    phase,
    version,
    baseCount: Object.keys(base).length,
    baseTotal: sum("std"),
    targetCount: target ? Object.keys(target).length : null,
    targetTotal: target ? sum("newStd") : null,
    rows,
  };
});

// ─── PHASE LIST (read-only) ──────────────────────────────────────────────────
// The tab strip used to come from the compare result, which was fine while one
// call returned every phase. It no longer does: four phases exceed the
// resolver's 25 second limit, so the compare runs one at a time — and a tab
// strip built from a single-phase result could never reach the other tabs.
// So the tabs get their own source, and the compare fills them in on demand.
resolver.define("listPhases", async ({ payload }) => {
  const projectKey = payload?.issue?.key;
  if (!projectKey) return { ok: false, error: "NO_ISSUE" };
  try {
    const kids = await fetchWbsChildren(projectKey);
    const phases = kids
      .filter((k) => k.typeId === "10016")
      .map((k) => ({ key: k.key, summary: k.summary }))
      .sort((a, b) => String(a.summary).localeCompare(String(b.summary)));
    console.log(
      `[phases] ${projectKey}: ${phases.map((p) => p.summary).join(", ") || "none"}`,
    );
    return { ok: true, projectKey, phases };
  } catch (e) {
    console.error(`[phases] ${projectKey} failed: ${e?.message}`);
    return { ok: false, error: "FETCH_FAILED", message: e?.message };
  }
});

// Thin wrapper — the UI's Compare button. Behaviour is unchanged.
resolver.define("compareQuotation", async ({ payload }) =>
  runComparison(payload),
);

// ─── STORAGE DUMP (read-only) — never writes, never deletes ───
// Forge App Storage has no admin UI and no REST endpoint, so the app itself is
// the only thing that can read it. Returns a readable summary of the three keys
// that drive a project, so storage questions are answered by fact not inference.
resolver.define("dumpStorage", async ({ payload }) => {
  const projectKey = payload?.issue?.key;

  // Same guard the codebase already uses at line 1963. displayConditions hides a
  // button; it is not a boundary. This refuses to read production storage even
  // if the resolver is invoked directly.
  if (!projectKey || !projectKey.startsWith("CTEST")) {
    return {
      ok: false,
      error: "NOT_ALLOWED",
      message: "Staging projects only.",
    };
  }

  // unzip a base64+deflate value into a small readable summary
  const summarise = (base64) => {
    if (!base64) return null;
    try {
      const json = JSON.parse(
        pako.inflate(base64ToUint8Array(base64), { to: "string" }),
      );
      const acts = json.activities || {};
      return {
        phaseName: json.phaseName?.value ?? null,
        // The version this phase was built from. Absent on phases created
        // before the stamp existed; "Phase Configuration" when no quotation
        // was linked.
        quotationVersion: json.quotationVersion ?? null,
        totalHours: json.totalHours ?? null,
        _3DModification: json._3DModification ?? null,
        _2DModification: json._2DModification ?? null,
        dataManagement: json.dataManagement ?? null,
        activityCount: Object.keys(acts).length,
        activities: Object.entries(acts)
          .map(([k, v]) => ({
            key: k,
            order: v.order,
            checked: v.checked,
            standardLoop: v.standardLoop,
            standard: v.standard,
            total: v.total,
            TDL: v.TDL,
            COO: v.COO,
            DE: v.DE,
          }))
          .sort((a, b) => String(a.order).localeCompare(String(b.order))),
      };
    } catch (e) {
      return { error: "COULD_NOT_DECODE", message: e?.message };
    }
  };

  const out = { ok: true, projectKey, phases: {}, industrializationInputs: {} };

  for (const phase of ["Proto", "Serie", "Industrialization"]) {
    // the Create Phase form snapshot — this is what the form redisplays
    out.phases[phase] = summarise(await storage.get(`${projectKey}_${phase}`));
    // the three derived numbers the Industrialization cook reads
    out.industrializationInputs[phase] =
      (await storage.get(`${projectKey}_Industrialization_${phase}`)) ?? null;
  }

  console.log(
    `[dump] ${projectKey}`,
    JSON.stringify(out.industrializationInputs),
  );
  return out;
});

// ─── WORKFLOW STUDY (read-only) — never performs a transition ────────────────
// The transition step needs transition IDs, and those differ per workflow
// scheme AND per current status. Hardcoding one would break the moment CWO's
// scheme differs from CTEST's, so this asks Jira instead.
//
// GET /transitions is a read. Performing one is a POST, which this never makes.
// It also returns only what the APP can do, so conditions and validators that
// would block us are already filtered out — this is the real answer, not the
// workflow diagram's.
resolver.define("dumpTransitions", async ({ payload }) => {
  const projectKey = payload?.issue?.key;
  const phaseKey = payload?.phaseKey;
  if (!projectKey || !projectKey.startsWith("CTEST")) {
    return {
      ok: false,
      error: "NOT_ALLOWED",
      message: "Staging projects only.",
    };
  }
  if (!phaseKey) {
    return {
      ok: false,
      error: "NO_PHASE",
      message: "Open a phase tab first.",
    };
  }

  const TYPE = {
    10019: "Activity Group",
    10008: "Activity",
    10009: "Work Order",
    10005: "Task",
  };
  // One sample per type+status pair is enough — the answer depends on the
  // workflow and the current status, not on which issue we ask.
  const seen = new Map();
  let calls = 0;
  const BUDGET = 40; // this runs in a resolver: 25 seconds, not 900

  async function readStatus(key) {
    calls++;
    const r = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${key}?fields=status,issuetype`);
    const f = (await r.json()).fields || {};
    return { status: f.status?.name || null, typeId: f.issuetype?.id || null };
  }

  async function walk(key, depth) {
    if (depth > 4 || calls > BUDGET) return;
    calls++;
    const kids = await fetchWbsChildren(key);
    for (const c of kids) {
      if (!TYPE[c.typeId]) continue;
      const s = await readStatus(c.key);
      const pair = `${c.typeId}|${s.status}`;
      if (!seen.has(pair))
        seen.set(pair, {
          key: c.key,
          summary: c.summary,
          typeId: c.typeId,
          status: s.status,
        });
      if (calls > BUDGET) return;
      await walk(c.key, depth + 1);
    }
  }
  await walk(phaseKey, 1);

  const pairs = [];
  for (const [, s] of seen) {
    // expand=transitions.fields returns the transition SCREEN and which of its
    // fields are required. Conditions decide whether a transition is offered;
    // validators reject it at POST time. Without this we would plan a close
    // that Jira then refuses because Start date is empty.
    const r = await api
      .asApp()
      .requestJira(
        route`/rest/api/3/issue/${s.key}/transitions?expand=transitions.fields`,
      );
    const body = await r.json();
    pairs.push({
      type: TYPE[s.typeId],
      from: s.status,
      sample: s.key,
      transitions: (body.transitions || []).map((t) => ({
        id: t.id,
        name: t.name,
        to: t.to?.name,
        hasScreen: Boolean(t.hasScreen),
        required: Object.entries(t.fields || {})
          .filter(([, f]) => f.required)
          .map(([id, f]) => `${f.name} (${id})`),
      })),
    });
  }
  pairs.sort((a, b) => (a.type + a.from).localeCompare(b.type + b.from));

  console.log(
    `[wf] ${projectKey} — ${pairs.length} type/status pairs, ${calls} walk calls`,
  );
  pairs.forEach((p) =>
    console.log(
      `[wf] ${p.type} @ ${p.from} (${p.sample}): ` +
        (p.transitions
          .map(
            (t) =>
              `${t.id}=${t.name}->${t.to}` +
              (t.required.length ? ` REQUIRES[${t.required.join(", ")}]` : ""),
          )
          .join("  ") || "NONE"),
    ),
  );
  return { ok: true, projectKey, phaseKey, pairs };
});

// ─── STAGE 2 · STEP 1 — APPLY PLAN (read-only) ───────────────────────────────
// Turns a comparison into the list of writes it implies, recording the BEFORE
// value of every field beside the AFTER.
//
// WRITES NOTHING. storage.get and Jira GET only. No PUT, POST or DELETE.
//
// Recomputes rather than accepting the browser's compare result: a tab opened at
// 10:00 must not apply 10:00 numbers at 10:30 after the catalog moved. The plan
// is always built from a comparison this resolver ran itself.
//
// Records BEFORE because the compare's Current column exists only on screen.
// Once a write lands there is no other record of what it replaced.

const PLAN_ACTION = {
  SKIP: "skip",
  UPDATE: "update 4 fields",
  CLEAR: "clear 4 fields",
  DELETE: "delete group and children",
  ADD: "create via create phase",
  REPLACE_EWRW: "delete extra work, add standard",
  CLOSE_BRANCH: "close the branch",
  CLEAR_AND_CLOSE: "clear hours and close",
  CLOSE_EWRW_ADD: "close extra work, add standard",
  UPDATE_AND_REOPEN: "reopen and update",
  UNCANCEL: "un-cancel and update",
  NONE: "no action",
};

// One comparison row -> the rule that governs it.
// Statuses: Closed | Submit for Approval | In Progress | Not Started.
// "started" means work has begun, so hours are cleared rather than deleted.
function resolvePlanRule(row) {
  const v = String(row.verdict || "");
  const status = row.status || "";
  const started = status === "In Progress" || status === "Submit For Approval";

  // Rulings 1, 2 and 3 — an extra work group the quotation has brought back
  // into standard scope. Handled BEFORE the closed test, because ruling 3
  // covers a group that is already Closed.
  if (v.startsWith("ADD STANDARD"))
    return status === "Not Started"
      ? {
          rule: 2,
          action: PLAN_ACTION.REPLACE_EWRW,
          why: "standard added, extra work not started",
        }
      : {
          rule: 2,
          action: PLAN_ACTION.CLOSE_EWRW_ADD,
          why: "standard added, extra work already worked on",
        };
  // Rulings 2.1.1 and 2.1.2 — the quotation has revised a group that is already
  // closed. The hours are corrected either way. 2.1.1 also reopens the group so
  // the correction is visible and someone can act on it; its activities stay
  // closed and any new one is created by hand. 2.1.2 leaves it closed, and
  // 10971 falls to 0 on its own once 10061 is null.
  // A cancelled group whose activity is still in the quotation should not be
  // cancelled. The hours are corrected if they moved, and the group goes back
  // to Not Started either way — this is the one rule that fires on SAME, so it
  // will keep proposing until someone applies it. REMOVE falls through to
  // rule 3 below, which deletes the group and its children.
  if (status === "CANCELLED" && !v.startsWith("REMOVE")) {
    if (v === "CHANGE" || v === "SAME")
      return {
        rule: "2.2",
        action: PLAN_ACTION.UNCANCEL,
        why:
          v === "CHANGE"
            ? "cancelled, and the quotation has changed the hours"
            : "cancelled, but the quotation still has this activity",
      };
    return { rule: 7, action: PLAN_ACTION.NONE, why: "cancelled, no baseline" };
  }

  if (status === "Closed") {
    if (v === "CHANGE")
      return {
        rule: "2.1.1",
        action: PLAN_ACTION.UPDATE_AND_REOPEN,
        why: "hours changed after the group was closed",
      };
    if (v.startsWith("REMOVE"))
      return {
        rule: "2.1.2",
        action: PLAN_ACTION.CLEAR,
        why: "dropped from the quotation after the group was closed",
      };
    return {
      rule: 1,
      action: PLAN_ACTION.SKIP,
      why: "group is closed and the quotation has not changed it",
    };
  }
  // Extra work groups. Closing a branch and reopening a group are transitions,
  // which is its own step — those cases plan as no action for now and say so.
  if (v.startsWith("REMOVE (extra work"))
    return started
      ? {
          rule: 4,
          action: PLAN_ACTION.CLOSE_BRANCH,
          why: "extra work dropped from the quotation, work started",
        }
      : {
          rule: 3,
          action: PLAN_ACTION.DELETE,
          why: "extra work dropped from the quotation, not started",
        };

  if (v.startsWith("NOT PLANNED"))
    return { rule: 7, action: PLAN_ACTION.NONE, why: "no baseline hours" };
  if (v.startsWith("ORPHAN"))
    return {
      rule: null,
      action: PLAN_ACTION.NONE,
      why: "no match in the new quotation",
    };
  if (v === "SAME")
    return { rule: null, action: PLAN_ACTION.NONE, why: "identical" };
  if (v.startsWith("REMOVE"))
    return started
      ? {
          rule: 4,
          action: PLAN_ACTION.CLEAR_AND_CLOSE,
          why: "dropped from the quotation, work started",
        }
      : {
          rule: 3,
          action: PLAN_ACTION.DELETE,
          why: "dropped from the quotation, not started",
        };
  if (v === "CHANGE")
    return started
      ? {
          rule: 5,
          action: PLAN_ACTION.UPDATE,
          why: "hours changed, work started",
        }
      : {
          rule: 6,
          action: PLAN_ACTION.UPDATE,
          why: "hours changed, not started",
        };
  return {
    rule: null,
    action: PLAN_ACTION.NONE,
    why: `unmapped verdict "${v}"`,
  };
}

// Extracted so Step 3 builds its writes from the SAME plan the UI renders.
// A copy would drift the moment one side changed.
async function buildPlan(payload) {
  const projectKey = payload?.issue?.key;
  if (!projectKey || !projectKey.startsWith("CTEST")) {
    return {
      ok: false,
      error: "NOT_ALLOWED",
      message: "Staging projects only.",
    };
  }

  const cmp = await runComparison(payload);
  if (!cmp.ok) return cmp;

  const phases = [];
  const counts = {};
  let writeCount = 0;

  for (const ph of cmp.result) {
    const rows = [];

    for (const v of ph.verdicts) {
      const r = resolvePlanRule(v);
      let veto = null;

      // Both destructive actions rest on "the new quotation says zero". A zero
      // caused by a missing 2D / Data Management section is a config gap, not a
      // de-scope — the safeguard flag vetoes it.
      if (
        v.flag &&
        (r.action === PLAN_ACTION.DELETE ||
          r.action === PLAN_ACTION.CLEAR ||
          r.action === PLAN_ACTION.CLEAR_AND_CLOSE ||
          r.action === PLAN_ACTION.CLOSE_BRANCH)
      ) {
        veto = `config flag ${v.flag}`;
      }

      // Delete removes the Activity, Work Order and Task beneath the group.
      // Never where time has been logged, whatever the status says.
      if (!veto && r.action === PLAN_ACTION.DELETE) {
        const res = await api
          .asApp()
          .requestJira(
            route`/rest/api/3/issue/${v.key}?fields=customfield_10065`,
          );
        const actual = (await res.json()).fields?.customfield_10065 ?? 0;
        if (actual > 0) veto = `actual hours logged (${actual})`;
      }

      const action = veto ? PLAN_ACTION.NONE : r.action;
      const before = {
        total: v.currentStd ?? null,
        TDL: v.currentTDL ?? null,
        COO: v.currentCOO ?? null,
        DE: v.currentDE ?? null,
      };
      let after = null;
      if (
        action === PLAN_ACTION.UPDATE ||
        action === PLAN_ACTION.UPDATE_AND_REOPEN ||
        // UNCANCEL on SAME has nothing to write — the hours already match, and
        // only the status moves.
        (action === PLAN_ACTION.UNCANCEL && v.verdict === "CHANGE")
      )
        after = { total: v.newStd, TDL: v.newTDL, COO: v.newCOO, DE: v.newDE };
      if (
        action === PLAN_ACTION.CLEAR ||
        action === PLAN_ACTION.CLEAR_AND_CLOSE
      )
        after = { total: null, TDL: null, COO: null, DE: null };
      // The group exists with no standard hours; these are the ones to write.
      if (
        action === PLAN_ACTION.REPLACE_EWRW ||
        action === PLAN_ACTION.CLOSE_EWRW_ADD
      )
        after = { total: v.newStd, TDL: v.newTDL, COO: v.newCOO, DE: v.newDE };

      counts[action] = (counts[action] || 0) + 1;
      if (action !== PLAN_ACTION.NONE && action !== PLAN_ACTION.SKIP)
        writeCount++;

      rows.push({
        key: v.key,
        summary: v.summary,
        status: v.status,
        verdict: v.verdict,
        rule: r.rule,
        action,
        why: veto ? `${r.why} — VETOED: ${veto}` : r.why,
        veto,
        before,
        after,
      });
    }

    // ADD candidates have no Jira issue yet, so there is no before to record.
    // Rule 2 is fulfilled by updating the stored snapshot and re-running Create
    // Phase — not by creating issues here.
    const adds = (ph.added || []).map((a) => ({
      key: null,
      summary: a.actKey,
      status: null,
      verdict: a.verdict,
      rule: 2,
      action: PLAN_ACTION.ADD,
      why: "in the new quotation, no group yet",
      veto: null,
      before: null,
      after: { total: a.newStd, TDL: null, COO: null, DE: null },
    }));
    counts[PLAN_ACTION.ADD] = (counts[PLAN_ACTION.ADD] || 0) + adds.length;
    writeCount += adds.length;

    phases.push({
      phase: ph.phase,
      phaseKey: ph.phaseKey,
      cooked: ph.cooked,
      rows: rows.concat(adds),
    });
  }

  console.log(
    `[plan] ${projectKey} DRY RUN — ${writeCount} intended writes`,
    JSON.stringify(counts),
  );
  phases.forEach((p) =>
    p.rows
      .filter(
        (r) => r.action !== PLAN_ACTION.NONE && r.action !== PLAN_ACTION.SKIP,
      )
      .forEach((r) =>
        console.log(
          `[plan]   ${p.phase} | rule ${r.rule} | ${r.action} | ${r.summary}`,
        ),
      ),
  );

  return {
    ok: true,
    dryRun: true,
    projectKey,
    currentProduct: cmp.currentProduct,
    newProduct: cmp.newProduct,
    counts,
    writeCount,
    phases,
  };
}

// Thin wrapper — the UI's Plan button. Behaviour is unchanged.
resolver.define("applyPlan", async ({ payload }) => {
  const plan = await buildPlan(payload);
  // The cook is for the write path only — the UI has the rounded values it needs.
  if (plan?.phases) plan.phases.forEach((p) => delete p.cooked);
  return plan;
});

// ─── STAGE 2 · STEP 3 — APPLY WRITES ─────────────────────────────────────────
// The first step that changes Jira. Everything before this was read-only.
//
// DRY_RUN is a constant, not a payload flag, so a caller can never arm it.
// With true, every write is built and logged and nothing is sent.
//
// Scope: rules 4, 5 and 6 — the four hour fields on activity groups that
// already exist. No status changes, no deletes, no creates, no storage writes.
//
// Safety:
//   - the plan is rebuilt here, never accepted from the browser
//   - each group is re-read immediately before writing and skipped if it moved
//     since the plan was shown
//   - only fields that actually differ are sent, so the KPI listener is not
//     woken for a value that did not change
//   - 1000 ms between groups, matching create-activity line 1300
//   - a failure logs and continues; the write is idempotent, so re-running is safe
//   - every attempt is returned in a receipt with before, after and status —
//     the only record of what a write replaced

const DRY_RUN = false;

const WRITE_FIELDS = [
  { k: "total", cf: "customfield_10061" },
  { k: "COO", cf: "customfield_10075" },
  { k: "DE", cf: "customfield_10076" },
  { k: "TDL", cf: "customfield_10077" },
];

// The button. Pushes and returns immediately — same shape as setData at line
// 471, which is how Create Phase escapes the same 25 second limit.
resolver.define("applyWrites", async ({ payload }) => {
  const projectKey = payload?.issue?.key;
  const phaseKey = payload?.phaseKey;
  if (!projectKey || !projectKey.startsWith("CTEST")) {
    return {
      ok: false,
      error: "NOT_ALLOWED",
      message: "Staging projects only.",
    };
  }
  // One phase per click. Required, not optional — without it there is no way to
  // ask for "everything", which is the point.
  if (!phaseKey) {
    return {
      ok: false,
      error: "NO_PHASE",
      message: "Open a phase tab before overwriting.",
    };
  }
  await overwriteQueue.push(payload);
  console.log(`[write] queued ${projectKey} phase ${phaseKey}`);
  return { ok: true, queued: true, projectKey, phaseKey };
});

// The queue consumer — 900 seconds instead of 25. The body below is unchanged
// except for where it gets its payload, the project rollup, and the receipt.
export async function applyWritesConsumer(event, context) {
  const t0 = Date.now();
  const ms = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
  const payload = event?.call?.payload ?? event;
  const projectKey = payload?.issue?.key;
  const phaseKey = payload?.phaseKey;
  // The version the plan was built against. It travels in the queued payload so
  // the write always uses the same one the plan did, and patchPhaseSnapshot
  // restamps the phase with it.
  const version = payload?.version || null;
  let phaseLabel = null;
  let phaseRows = [];
  let phaseCooked = null;

  const plan = await buildPlan(payload);
  console.log(`[write] plan built at ${ms()}`);
  if (!plan.ok) return plan;

  const receipt = [];
  const closures = [];
  const ewrwCloses = [];
  const closedEwRwSummaries = new Set();
  const reopens = [];
  const reopenedSummaries = new Set();
  const phaseDelta = {};
  let written = 0,
    skipped = 0,
    failed = 0;

  // 10061 is in NO propagateActivityHoursBulk array, so the total does not
  // roll up on its own. COO/DE/TDL do, via the KPI listener at line 2675.
  // Delta rather than recompute: the phase moves by exactly the number the
  // plan showed. Summing the rounded groups instead would also apply the
  // pre-existing round-once/round-each drift, which nobody asked for.
  async function bump(key, delta, label) {
    const res = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${key}?fields=customfield_10061`);
    const cur = (await res.json()).fields?.customfield_10061 ?? 0;
    const next = Number((cur + delta).toFixed(1));
    if (DRY_RUN) {
      console.log(`[write] DRY RUN ${label} ${key} 10061 ${cur} -> ${next}`);
      return { key, label, before: cur, after: next, delta, status: "DRY_RUN" };
    }
    // A rollup failure must not throw away the receipt for the group writes
    // that already succeeded — that receipt is the only record of the old values.
    try {
      const put = await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issue/${key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { customfield_10061: next } }),
        }),
      );
      console.log(`[write] ${label} ${key} 10061 ${cur} -> ${next}`);
      await delay(250);
      return {
        key,
        label,
        before: cur,
        after: next,
        delta,
        status: put?.ok ? "WRITTEN" : `HTTP_${put?.status ?? "NO_RESPONSE"}`,
      };
    } catch (e) {
      console.error(`[write] ERROR ${label} ${key}`, e?.message);
      return {
        key,
        label,
        before: cur,
        after: next,
        delta,
        status: "ERROR",
        message: e?.message,
      };
    }
  }

  // Sets the phase total the way create-activity line 539 does — from the
  // snapshot's totalHours, rounded once to one decimal. Keeps the old-code
  // relationship: Create Phase 3611.71 -> WBS 3611.7, exactly as before.
  async function setPhaseTotal(key, next) {
    const res = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${key}?fields=customfield_10061`);
    const cur = (await res.json()).fields?.customfield_10061 ?? 0;
    if (cur === next)
      return {
        key,
        label: "Phase",
        before: cur,
        after: next,
        status: "NO_DIFF",
      };
    if (DRY_RUN) {
      console.log(`[write] DRY RUN Phase ${key} 10061 ${cur} -> ${next}`);
      return {
        key,
        label: "Phase",
        before: cur,
        after: next,
        status: "DRY_RUN",
      };
    }
    try {
      const put = await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issue/${key}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: { customfield_10061: next } }),
        }),
      );
      console.log(`[write] Phase ${key} 10061 ${cur} -> ${next}`);
      await delay(250);
      return {
        key,
        label: "Phase",
        before: cur,
        after: next,
        status: put?.ok ? "WRITTEN" : `HTTP_${put?.status ?? "NO_RESPONSE"}`,
      };
    } catch (e) {
      console.error(`[write] ERROR Phase ${key}`, e?.message);
      return { key, label: "Phase", before: cur, after: next, status: "ERROR" };
    }
  }

  for (const ph of plan.phases) {
    // Everything outside the chosen phase is left exactly as it is.
    if (ph.phaseKey !== phaseKey) continue;
    phaseLabel = ph.phase;
    phaseRows = ph.rows;
    phaseCooked = ph.cooked || null;

    // Ruling 1.2 and rule 4 — close BEFORE the hour fields are touched.
    // Clearing 10061 first and then failing to close leaves a group with no
    // hours and an open status, which the next compare reads as NOT PLANNED
    // (rule 7, no action) because the hours were the only thing marking it as
    // de-scoped. Nothing would ever close it. Failing the close first changes
    // nothing at all, so the verdict still reads REMOVE and a re-click retries.
    for (const row of ph.rows) {
      if (
        row.action !== "close the branch" &&
        row.action !== "clear hours and close"
      )
        continue;
      closures.push(await closeBranch(row.key));
    }
    console.log(`[write] closures done at ${ms()}`);

    // Rulings 2 and 3 — the extra work has been worked on, so it is closed
    // rather than deleted and the standard activity is added beside it. Also
    // before the writes: the hours are the only thing marking this group as an
    // extra work group, so writing them after a failed close would make the
    // next compare read SAME and never retry.
    for (const row of ph.rows) {
      if (row.action !== "close extra work, add standard") continue;
      const r = await closeEwRwChildren(row);
      ewrwCloses.push(r);
      if (["CLOSED_EWRW", "DRY_RUN", "NOTHING_TO_CLOSE"].includes(r.status))
        closedEwRwSummaries.add(row.summary);
    }
    console.log(`[write] extra work closes done at ${ms()}`);

    // Ruling 2.1.1 — reopen before writing. Reopening and then failing to write
    // leaves a CHANGE the next run retries. Writing and then failing to reopen
    // leaves the hours matching the quotation, so the next compare reads SAME
    // and the group never reopens.
    for (const row of ph.rows) {
      if (row.action !== "reopen and update") continue;
      const m = await transitionTo(row.key, "In Progress");
      reopens.push(m);
      if (["MOVED", "DRY_RUN", "ALREADY"].includes(m.status))
        reopenedSummaries.add(row.summary);
    }
    console.log(`[write] reopens done at ${ms()}`);

    // Rule 2.2 — a cancelled group whose activity is still in the quotation
    // goes back to Not Started. Only the group moves; its children are already
    // Not Started, since the workflow has no Cancel below Activity Group level.
    for (const row of ph.rows) {
      if (row.action !== "un-cancel and update") continue;
      const m = await transitionTo(row.key, "Not Started");
      reopens.push(m);
      if (["MOVED", "DRY_RUN", "ALREADY"].includes(m.status))
        reopenedSummaries.add(row.summary);
    }
    console.log(`[write] un-cancels done at ${ms()}`);

    for (const row of ph.rows) {
      if (
        row.action !== "update 4 fields" &&
        row.action !== "clear 4 fields" &&
        row.action !== "clear hours and close" &&
        row.action !== "close extra work, add standard" &&
        row.action !== "reopen and update" &&
        row.action !== "un-cancel and update" &&
        row.action !== "delete extra work, add standard"
      )
        continue;
      // Only write the hours once the extra work actually closed.
      if (
        row.action === "close extra work, add standard" &&
        !closedEwRwSummaries.has(row.summary)
      )
        continue;
      // Only write the new hours once the group actually reopened.
      if (
        (row.action === "reopen and update" ||
          row.action === "un-cancel and update") &&
        !reopenedSummaries.has(row.summary)
      )
        continue;

      // Re-read. The plan showed the user `before`; refuse to overwrite
      // anything else, in case someone edited the group in between.
      const res = await api
        .asApp()
        .requestJira(
          route`/rest/api/3/issue/${row.key}?fields=customfield_10061,customfield_10075,customfield_10076,customfield_10077`,
        );
      const f = (await res.json()).fields || {};
      const live = {
        total: f.customfield_10061 ?? null,
        COO: f.customfield_10075 ?? null,
        DE: f.customfield_10076 ?? null,
        TDL: f.customfield_10077 ?? null,
      };
      const moved = WRITE_FIELDS.some(
        (x) => (live[x.k] ?? null) !== (row.before[x.k] ?? null),
      );
      if (moved) {
        console.warn(
          `[write] SKIP ${row.key} — changed since the plan was built`,
        );
        receipt.push({
          key: row.key,
          summary: row.summary,
          rule: row.rule,
          status: "SKIPPED_CHANGED",
          expected: row.before,
          found: live,
        });
        skipped++;
        continue;
      }

      // Send only what differs. Row 104 has COO 0.8 -> 0.8; including it would
      // fire the KPI listener for a field that never moved.
      const fields = {};
      WRITE_FIELDS.forEach((x) => {
        const b = row.before[x.k] ?? null;
        const a = row.after ? (row.after[x.k] ?? null) : null;
        if (a !== b) fields[x.cf] = a;
      });
      if (!Object.keys(fields).length) {
        receipt.push({
          key: row.key,
          summary: row.summary,
          rule: row.rule,
          status: "NO_DIFF",
        });
        continue;
      }

      const dTotal =
        (row.after ? (row.after.total ?? 0) : 0) - (row.before.total ?? 0);
      let outcome;
      if (DRY_RUN) {
        outcome = "DRY_RUN";
        console.log(
          `[write] DRY RUN ${row.key} rule ${row.rule}`,
          JSON.stringify(fields),
        );
      } else {
        try {
          const put = await retryJiraApiCall(() =>
            api.asApp().requestJira(route`/rest/api/3/issue/${row.key}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fields }),
            }),
          );
          outcome = put.ok ? "WRITTEN" : `HTTP_${put.status}`;
          console.log(
            `[write] ${outcome} ${row.key} rule ${row.rule}`,
            JSON.stringify(fields),
          );
          put.ok ? written++ : failed++;
        } catch (e) {
          outcome = "ERROR";
          console.error(`[write] ERROR ${row.key}`, e?.message);
          failed++;
        }
        await delay(250);
      }

      receipt.push({
        key: row.key,
        summary: row.summary,
        rule: row.rule,
        status: outcome,
        fields,
        before: row.before,
        after: row.after,
      });
      if (outcome === "DRY_RUN" || outcome === "WRITTEN")
        phaseDelta[ph.phaseKey] = (phaseDelta[ph.phaseKey] || 0) + dTotal;
    }
  }
  // phaseCooked holds what Step 5 needs; drop the rest so nothing large
  // survives into the return value.
  plan.phases.forEach((p) => delete p.cooked);
  console.log(`[write] writes done at ${ms()}`);

  if (!phaseLabel) {
    console.warn(`[write] phase ${phaseKey} not found in the plan`);
    return { ok: false, error: "PHASE_NOT_FOUND", projectKey, phaseKey };
  }

  // Step 6 — rule 3. Before the snapshot patch, so only groups that actually
  // deleted get unticked, and before the rollups, so the phase total already
  // reflects their removal.
  const deletions = [];
  const deletedSummaries = new Set();
  for (const row of phaseRows) {
    if (row.action !== "delete group and children") continue;
    const d = await deleteGroup(row);
    deletions.push(d);
    if (d.status === "DELETED" || d.status === "DRY_RUN")
      deletedSummaries.add(row.summary);
  }
  console.log(`[write] deletes done at ${ms()}`);

  // Ruling 1.5. After the deletes, so both destructive passes are finished
  // before the snapshot is touched.
  const replacements = [];
  const replacedSummaries = new Set();
  for (const row of phaseRows) {
    if (row.action !== "delete extra work, add standard") continue;
    const r = await replaceEwRw(row);
    replacements.push(r);
    if (["REPLACED", "DRY_RUN", "NOTHING_TO_DELETE"].includes(r.status))
      replacedSummaries.add(row.summary);
  }
  console.log(`[write] extra work replacements done at ${ms()}`);

  // Step 5 runs BEFORE the rollups now. create-activity line 539 sets the phase
  // total from the snapshot: customfield_10061 = Number(totalHours.toFixed(1)).
  // The rollup below uses the same formula, so the phase total keeps exactly the
  // relationship to Create Phase that it has always had. It needs the patched
  // totalHours, so the snapshot has to be written first.
  let snapshot = null;
  try {
    const phaseName = phaseLabel.replace(/^\d+\s*/, "").trim();
    snapshot = phaseCooked
      ? await patchPhaseSnapshot(
          projectKey,
          phaseName,
          phaseCooked,
          phaseRows,
          deletedSummaries,
          replacedSummaries,
          closedEwRwSummaries,
          reopenedSummaries,
          version,
        )
      : { ok: false, error: "NO_COOK" };
  } catch (e) {
    console.error(`[snap] ERROR`, e?.message);
    snapshot = { ok: false, error: "ERROR", message: e?.message };
  }
  console.log(`[write] snapshot done at ${ms()}`);

  // Step 7, rule 2. The snapshot now has the new activity ticked, so hand the
  // same base64 to task-queue and create-activity builds the group and its
  // children — the same path Create Phase uses. Only pushed when something was
  // actually ticked; re-running create-activity for nothing costs minutes and
  // touches every group in the phase.
  let queuedCreate = null;
  const adds = snapshot?.addedActivities || [];
  // Rule 2 works by ticking activities in the phase's stored snapshot and
  // handing that snapshot to create-activity. A phase that has never been
  // through Create Phase has no snapshot, so every cooked activity reads as an
  // Add and none of them can be created. Say so rather than doing nothing.
  if (snapshot?.error === "NO_SNAPSHOT") {
    queuedCreate = {
      status: "NO_SNAPSHOT",
      message:
        "This phase has never been created. Run Create Phase on it first, then overwrite.",
      key: snapshot.key,
    };
    console.warn(
      `[add] ${snapshot.key} has no snapshot — nothing can be added`,
    );
  } else if (adds.length && snapshot?.base64) {
    if (DRY_RUN) {
      console.log(
        `[add] DRY RUN would queue create-activity for ${adds.length}:`,
        adds.join(", "),
      );
      queuedCreate = {
        status: "DRY_RUN",
        count: adds.length,
        activities: adds,
      };
    } else {
      try {
        await taskQueue.push({
          issueKey: projectKey,
          base64Data: snapshot.base64,
        });
        console.log(`[add] queued create-activity for ${adds.length}`);
        queuedCreate = {
          status: "QUEUED",
          count: adds.length,
          activities: adds,
        };
      } catch (e) {
        console.error(`[add] could not queue`, e?.message);
        queuedCreate = { status: "ERROR", message: e?.message };
      }
    }
  }
  // The blob is a few hundred KB — never let it into the stored receipt.
  if (snapshot) delete snapshot.base64;

  const rollups = [];
  let projectDelta = 0;
  // The snapshot only holds what Create Phase built. A group added by hand in
  // Jira is not in it, so writing its total straight to the phase would wipe
  // that group's hours from the phase and the project. Orphan rows are exactly
  // those groups, so their current hours are added back.
  const orphanHours = (phaseRows || [])
    .filter((r) => String(r.verdict || "").startsWith("ORPHAN"))
    .reduce((t, r) => t + (Number(r.before?.total) || 0), 0);
  const snapTotal =
    snapshot?.headAfter?.totalHours != null
      ? snapshot.headAfter.totalHours + orphanHours
      : snapshot?.headAfter?.totalHours;
  if (isFinite(snapTotal)) {
    // Old code's formula, verbatim.
    rollups.push(await setPhaseTotal(phaseKey, Number(snapTotal.toFixed(1))));
    projectDelta = 1; // any non-zero: the project must be recomputed
  } else {
    // No snapshot to read — fall back to the delta so the phase is not left stale.
    for (const [pk, delta] of Object.entries(phaseDelta)) {
      if (!delta) continue;
      projectDelta += delta;
      rollups.push(await bump(pk, delta, "Phase"));
    }
  }
  const predicted = {};
  rollups.forEach((r) => {
    if (r.label === "Phase") predicted[r.key] = r.after;
  });
  if (projectDelta)
    rollups.push(await rollupProjectTotal(projectKey, predicted));
  console.log(`[write] rollups done at ${ms()}`);

  console.log(
    `[write] DONE dryRun=${DRY_RUN} written=${written} skipped=${skipped} failed=${failed}`,
  );

  // The receipt is the only record of what each write replaced — Jira keeps no
  // history of these fields and forge logs expire. One key per project,
  // overwritten each run.
  const record = {
    ok: true,
    at: new Date().toISOString(),
    dryRun: DRY_RUN,
    projectKey,
    phaseKey,
    phase: phaseLabel,
    written,
    skipped,
    failed,
    receipt,
    rollups,
    deletions,
    replacements,
    closures,
    ewrwCloses,
    reopens,
    snapshot,
    queuedCreate,
  };
  try {
    // One receipt per phase. A single project key would let a Serie run erase
    // the Proto record, and that record holds the only copy of the old values.
    await storage.set(`${projectKey}_lastOverwrite_${phaseKey}`, record);
    console.log(`[write] receipt stored for ${projectKey} ${phaseLabel}`);
  } catch (e) {
    console.error(`[write] could not store receipt`, e?.message);
  }
  return record;
}

// ─── ROLLUP REPAIR (idempotent) ──────────────────────────────────────────────
// Sets the project's 10061 to the sum of its phases' 10061.
//
// Step 3 rolls the total up with a DELTA, which only works inside the same
// invocation as the writes. When that invocation hit the 25 second limit right
// after the phase rollups, the project was left stale and there was no way to
// finish — re-running applyWrites skips every already-written group, so the
// delta is empty and no rollup happens.
//
// This RECOMPUTES instead, so running it twice gives the same answer and a
// partial run can always be repaired. 3 reads and 1 write, well inside budget.
//
// The project total will not equal the sum of the phase TDL + COO + DE columns.
// Create Phase rounds all four fields independently from one unrounded cook
// (line 1168-1172), so total never equals the sum of its roles at any level —
// groups 108, 118 and 119 already differ and were never written by us.

// `predicted` lets a dry run see the project total it WOULD reach. Without it
// the recompute reads phase values that the dry run never wrote, so it reports
// no change. In a live run predicted equals what was just written, so the
// answer is the same either way.
async function rollupProjectTotal(projectKey, predicted) {
  const phases = (await fetchWbsChildren(projectKey)).filter(
    (c) => c.typeId === "10016",
  );
  const parts = [];
  let sum = 0;
  for (const ph of phases) {
    const r = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${ph.key}?fields=customfield_10061`);
    const v =
      predicted?.[ph.key] ?? (await r.json()).fields?.customfield_10061 ?? 0;
    parts.push({ key: ph.key, phase: ph.summary, total: v });
    sum += v;
  }
  if (!parts.length) {
    return {
      ok: false,
      error: "NO_PHASES",
      message: "No phases under this project.",
    };
  }
  const next = Number(sum.toFixed(1));

  const curRes = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${projectKey}?fields=customfield_10061`,
    );
  const before = (await curRes.json()).fields?.customfield_10061 ?? 0;

  if (before === next) {
    console.log(`[rollup] ${projectKey} already ${next} — nothing to do`);
    return {
      ok: true,
      dryRun: DRY_RUN,
      projectKey,
      before,
      after: next,
      phases: parts,
      status: "NO_DIFF",
    };
  }
  if (DRY_RUN) {
    console.log(`[rollup] DRY RUN ${projectKey} 10061 ${before} -> ${next}`);
    return {
      ok: true,
      dryRun: true,
      projectKey,
      before,
      after: next,
      phases: parts,
      status: "DRY_RUN",
    };
  }
  try {
    const put = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${projectKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { customfield_10061: next } }),
      }),
    );
    console.log(`[rollup] ${projectKey} 10061 ${before} -> ${next}`);
    return {
      ok: true,
      dryRun: false,
      projectKey,
      before,
      after: next,
      phases: parts,
      status: put?.ok ? "WRITTEN" : `HTTP_${put?.status ?? "NO_RESPONSE"}`,
    };
  } catch (e) {
    console.error(`[rollup] ERROR ${projectKey}`, e?.message);
    return {
      ok: false,
      error: "WRITE_FAILED",
      message: e?.message,
      projectKey,
      before,
      after: next,
      phases: parts,
    };
  }
}

// Manual repair, if a queued job ever half-fails. Not on the normal path.
resolver.define("rollupTotals", async ({ payload }) => {
  const projectKey = payload?.issue?.key;
  if (!projectKey || !projectKey.startsWith("CTEST")) {
    return {
      ok: false,
      error: "NOT_ALLOWED",
      message: "Staging projects only.",
    };
  }
  return rollupProjectTotal(projectKey);
});

// Read-only. How the UI learns the queued job finished and what it did.
resolver.define("getLastOverwrite", async ({ payload }) => {
  const projectKey = payload?.issue?.key;
  const phaseKey = payload?.phaseKey;
  if (!projectKey || !projectKey.startsWith("CTEST")) {
    return {
      ok: false,
      error: "NOT_ALLOWED",
      message: "Staging projects only.",
    };
  }
  if (!phaseKey) return { ok: true, projectKey, record: null };
  const record = await storage.get(`${projectKey}_lastOverwrite_${phaseKey}`);
  return { ok: true, projectKey, phaseKey, record: record ?? null };
});

// ─── STAGE 2 · STEP 5 — PATCH THE CREATE PHASE SNAPSHOT ──────────────────────
// After an overwrite, Jira and storage disagree. Create Phase restores the
// snapshot over the fresh cook (create-phase App.js line 313), so the form
// shows the old hours; Industrialization stays frozen because it cooks from
// _Industrialization_Proto / _Serie; and re-running Create Phase rewrites
// 10061 from the old snapshot at line 1204, undoing the overwrite silently.
//
// Both keys are copied to _preOverwrite first, and the deflate is inflated back
// and parsed before anything is stored. Forge storage has no undo, and nothing
// else in this codebase deflates on the backend — App.js does the zipping and
// the resolver only ever stored the string it was handed.

// Reproduces create-phase App.js 149-235. Any drift here and the form shows
// different totals from the ones we just wrote to Jira.
function recomputeSnapshotHeader(activities) {
  let totalHours = 0,
    dataManagement = 0,
    _2DModification = 0;
  Object.entries(activities).forEach(([k, v]) => {
    if (!v || !v.checked || !v.standardLoop) return;
    if (!k.includes("ITERATIONS")) totalHours += v.total || 0;
    if (
      k.includes("Customer input data management") ||
      k.includes("Data management") ||
      k.includes("Upload & Download customer data")
    )
      dataManagement += v.standard || 0;
    if (k.startsWith("2D Drawing") || k.startsWith("2D DELIVERABLES"))
      _2DModification += v.standard || 0;
  });
  // App.js 200-223: iterations are a percentage of the standard total, added
  // to totalHours only when that activity is itself on.
  const it = activities["ITERATIONS|ITERATIONS"];
  if (it && it.checked && it.standardLoop > 0) {
    let base = 0;
    Object.entries(activities).forEach(([k, v]) => {
      if (
        !k.includes("ITERATIONS") &&
        !k.includes("TCL ACTIVITIES") &&
        v &&
        v.checked &&
        v.standardLoop
      )
        base += v.standard || 0;
    });
    totalHours += parseFloat(((base * (it.percentage || 0)) / 100).toFixed(2));
  }
  return {
    totalHours,
    dataManagement,
    _2DModification,
    _3DModification: totalHours - _2DModification - dataManagement,
  };
}

// Snapshot keys are "SECTION|Activity"; AG summaries are "Group N | SECTION | Activity".
const snapNorm = (s) =>
  String(s || "")
    .replace(/^Group\s+\S+\s*\|/, "")
    .split("|")
    .map((p) => p.trim())
    .join(" | ")
    .toLowerCase();

async function patchPhaseSnapshot(
  projectKey,
  phaseName,
  cooked,
  rows,
  deletedSummaries,
  replacedSummaries,
  closedEwRwSummaries,
  reopenedSummaries,
  version,
) {
  const snapKey = `${projectKey}_${phaseName}`;
  const derKey = `${projectKey}_Industrialization_${phaseName}`;
  const b64 = await storage.get(snapKey);
  if (!b64) return { ok: false, error: "NO_SNAPSHOT", key: snapKey };

  let snap;
  try {
    snap = JSON.parse(pako.inflate(base64ToUint8Array(b64), { to: "string" }));
  } catch (e) {
    return { ok: false, error: "COULD_NOT_DECODE", message: e?.message };
  }
  const acts = snap.activities || {};
  const byNorm = {};
  Object.keys(acts).forEach((k) => (byNorm[snapNorm(k)] = k));
  const cookedByNorm = {};
  Object.entries(cooked).forEach(([k, v]) => (cookedByNorm[snapNorm(k)] = v));

  const touched = [];
  const addedActivities = [];
  for (const row of rows) {
    const isUpdate =
      row.action === "update 4 fields" ||
      ((row.action === "reopen and update" ||
        row.action === "un-cancel and update") &&
        reopenedSummaries &&
        reopenedSummaries.has(row.summary));
    const isClear =
      row.action === "clear 4 fields" || row.action === "clear hours and close";
    const isSame =
      row.action === "no action" && !row.veto && row.verdict === "SAME";
    // A group cleared before Step 5 existed reads NOT PLANNED now, not REMOVE,
    // so it was never patched and storage still carries hours Jira does not.
    // Jira having null is the fact; the snapshot is the stale copy.
    const isStale =
      row.action === "no action" &&
      !row.veto &&
      String(row.verdict).startsWith("NOT PLANNED") &&
      (row.before?.total ?? null) === null;
    // Step 7, rule 2. The activity exists in the snapshot but is unticked, so
    // create-activity's line 1145 guard skips it. Ticking it is the whole job —
    // create-activity then builds the Activity Group, Activity, Work Order and
    // Task and links them, exactly as it does on a first run.
    const isAdd = row.action === "create via create phase";
    // Ruling 1.5 — same as an add, but the extra work loops go too.
    const isReplace =
      row.action === "delete extra work, add standard" &&
      replacedSummaries &&
      replacedSummaries.has(row.summary);
    // Rulings 2 and 3 — same as a replace, but the extra work branches survive
    // in Jira (closed), so their loops stay as they are. Zeroing them would make
    // the Create Phase form show 0 extra work loops beside an extra work
    // activity that is still there.
    const isCloseAdd =
      row.action === "close extra work, add standard" &&
      closedEwRwSummaries &&
      closedEwRwSummaries.has(row.summary);
    // Step 6 deleted this group, so untick it — same shape as rule 4. Only when
    // the delete actually succeeded; a skipped or failed one is left alone, or
    // storage would claim the group is gone while it is still in Jira.
    const isDeleted =
      row.action === "delete group and children" &&
      deletedSummaries &&
      deletedSummaries.has(row.summary);
    // locked and vetoed rows are still left alone.
    if (
      !isUpdate &&
      !isClear &&
      !isSame &&
      !isStale &&
      !isAdd &&
      !isDeleted &&
      !isReplace &&
      !isCloseAdd
    )
      continue;
    const n = snapNorm(row.summary);
    const ak = byNorm[n];
    if (!ak) continue;
    const a = acts[ak];
    const before = {
      standard: a.standard,
      total: a.total,
      checked: a.checked,
      standardLoop: a.standardLoop,
    };
    if (isClear || isStale || isDeleted) {
      // Unticked at zero. create-activity line 1145 then skips it entirely on a
      // re-run, so 10061 is not rewritten — which is the whole point.
      a.checked = false;
      a.standardLoop = 0;
      a.standard = 0;
      a.TDL = 0;
      a.COO = 0;
      a.DE = 0;
      a.total = 0;
      if (isDeleted) {
        // Rule 3 removed the group and every child, extra work included. Line
        // 1142 only skips when EVERY loop is zero, so leaving these behind makes
        // create-activity rebuild the group and its Re-Work branch — which is
        // what put 105 back after the last run.
        a.extraWorkLoop = 0;
        a.reWorkLoop = 0;
      }
    } else if (isAdd || isReplace || isCloseAdd) {
      const c = cookedByNorm[n];
      if (!c) continue;
      // One standard loop — that is what "in the new quotation" means. The user
      // can raise it in Create Phase afterwards if the quotation says more.
      a.checked = true;
      a.standardLoop = 1;
      a.standard = c.standard;
      a.TDL = c.TDL ?? 0;
      a.COO = c.COO ?? 0;
      a.DE = c.DE ?? 0;
      a.total = a.standard;
      if (isReplace) {
        // The extra work branch has just been deleted from Jira. Leaving the
        // loops here would make create-activity rebuild it on the next run,
        // because line 1142 only skips when EVERY loop is zero.
        a.extraWorkLoop = 0;
        a.reWorkLoop = 0;
      }
      // 2D activities carry a drawing count into customfield_10059.
      if (c.loop !== undefined) a.loop = c.loop;
      addedActivities.push(ak);
    } else {
      const c = cookedByNorm[n];
      if (!c) continue;
      // Unrounded, exactly as Create Phase stores them.
      a.standard = c.standard;
      a.TDL = c.TDL ?? 0;
      a.COO = c.COO ?? 0;
      a.DE = c.DE ?? 0;
      a.total = (a.standard || 0) * (a.standardLoop || 0);
    }
    touched.push({
      activity: ak,
      rule: row.rule ?? null,
      action: row.action,
      before,
      after: {
        standard: a.standard,
        total: a.total,
        checked: a.checked,
        standardLoop: a.standardLoop,
      },
    });
  }

  const head = recomputeSnapshotHeader(acts);
  const headBefore = {
    totalHours: snap.totalHours,
    _3DModification: snap._3DModification,
    _2DModification: snap._2DModification,
    dataManagement: snap.dataManagement,
  };
  Object.assign(snap, head);
  // The hours in this snapshot are now the target version's, so the stamp moves
  // with them. It means "last overwritten to", not "identical to" — residual
  // differences from skipped rows still show as verdicts on the next compare.
  if (version) snap.quotationVersion = version;
  const derived = {
    _3DModification: head._3DModification,
    _2DModification: head._2DModification,
    dataManagement: head.dataManagement,
  };

  // Built before the dry-run exit so a dry run also proves the round-trip, and
  // so Step 7 can report the payload it would push.
  const out = uint8ArrayToBase64(pako.deflate(JSON.stringify(snap)));

  if (DRY_RUN) {
    console.log(
      `[snap] DRY RUN ${snapKey} ${touched.length} activities, ${addedActivities.length} to add`,
      JSON.stringify(head),
    );
    return {
      ok: true,
      status: "DRY_RUN",
      snapKey,
      derKey,
      touched,
      addedActivities,
      base64: out,
      headBefore,
      headAfter: head,
      derived,
    };
  }

  const prevDer = await storage.get(derKey);
  await storage.set(`${snapKey}_preOverwrite`, b64);
  await storage.set(`${derKey}_preOverwrite`, prevDer ?? null);

  // Prove the round-trip before storing. A bad deflate corrupts the only copy
  // of the form state and Forge storage has no undo.
  try {
    JSON.parse(pako.inflate(base64ToUint8Array(out), { to: "string" }));
  } catch (e) {
    console.error(`[snap] ROUNDTRIP FAILED for ${snapKey}`, e?.message);
    return { ok: false, error: "ROUNDTRIP_FAILED", message: e?.message };
  }
  await storage.set(snapKey, out);
  await storage.set(derKey, derived);
  console.log(
    `[snap] ${snapKey} patched, ${touched.length} activities, ${addedActivities.length} to add`,
  );
  return {
    ok: true,
    status: "WRITTEN",
    snapKey,
    derKey,
    touched,
    addedActivities,
    base64: out,
    headBefore,
    headAfter: head,
    derived,
  };
}

// ─── STAGE 2 · STEP 6 — DELETE (rule 3) ──────────────────────────────────────
// The only irreversible thing this feature does. A field write has a receipt
// that can restore it; a deleted issue is gone.
//
// Rule 3 fires on Not Started with no logged hours — the activity was dropped
// from the quotation before anyone worked on it, so the group and its Activity,
// Work Order and Task are removed.
//
// Guards, in order:
//   - the plan's vetoes already excluded config-flag and actual-hours rows
//   - status and 10065 are re-read here, seconds before the delete, because the
//     plan was built earlier and a worklog since then flips the whole branch
//   - every level's worklog is read directly (see the note below)
//   - only Activity, Work Order and Task are collected by the walk, so the
//     Incident that Automation links from a Re-Work activity can never be caught
//   - deepest first, because WBSGantt links are not Jira parent-child — deleting
//     the group first would orphan everything beneath it

const DELETABLE_TYPES = new Set(["10008", "10009", "10005"]);

async function collectDescendants(issueKey) {
  const found = [];
  async function walk(key, depth) {
    if (depth > 4) return; // AG -> Activity -> WO -> Task, nothing deeper exists
    const children = await fetchWbsChildren(key);
    for (const c of children) {
      if (!DELETABLE_TYPES.has(c.typeId)) continue;
      found.push({ key: c.key, summary: c.summary, typeId: c.typeId, depth });
      await walk(c.key, depth + 1);
    }
  }
  await walk(issueKey, 1);
  return found;
}

async function deleteGroup(row) {
  const out = {
    key: row.key,
    summary: row.summary,
    rule: row.rule,
    deleted: [],
  };

  // The plan was built at the top of this run. Status can have moved since.
  const res = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${row.key}?fields=status,issuetype,customfield_10065`,
    );
  const f = (await res.json()).fields || {};
  if (f.issuetype?.id !== "10019") {
    out.status = "SKIPPED_NOT_A_GROUP";
    console.warn(`[del] SKIP ${row.key} — not an Activity Group`);
    return out;
  }
  if (f.status?.name !== "Not Started") {
    out.status = "SKIPPED_STATUS_MOVED";
    out.found = f.status?.name;
    console.warn(`[del] SKIP ${row.key} — status is now ${f.status?.name}`);
    return out;
  }
  const actual = f.customfield_10065 ?? 0;
  if (actual > 0) {
    out.status = "SKIPPED_HAS_HOURS";
    out.found = actual;
    console.warn(`[del] SKIP ${row.key} — ${actual} actual hours`);
    return out;
  }

  const kids = await collectDescendants(row.key);

  // Time can be logged at four levels — updateLog lines 2033-2037:
  //   Task -> 10081 DE, Work Order -> 10082 COO, Activity -> 10083 TDL,
  //   and line 2037 accepts the Activity Group itself for TDL as well.
  // The group's 10065 is their sum, but it only gets there via
  // propagateActivityHours, which is queued — a worklog added minutes before an
  // overwrite has not propagated yet. That window is the reason for this check.
  for (const k of [{ key: row.key, summary: row.summary }].concat(kids)) {
    const w = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${k.key}/worklog`);
    const logs = (await w.json()).worklogs || [];
    if (logs.length) {
      out.status = "SKIPPED_WORKLOG";
      out.found = `${k.key} has ${logs.length} worklog(s)`;
      console.warn(`[del] SKIP ${row.key} — ${out.found}`);
      return out;
    }
  }

  const order = kids
    .sort((a, b) => b.depth - a.depth)
    .concat([
      { key: row.key, summary: row.summary, typeId: "10019", depth: 0 },
    ]);

  if (DRY_RUN) {
    console.log(
      `[del] DRY RUN ${row.key} would delete ${order.length}:`,
      order.map((o) => o.key).join(", "),
    );
    out.status = "DRY_RUN";
    out.deleted = order.map((o) => ({ key: o.key, summary: o.summary }));
    return out;
  }

  for (const o of order) {
    try {
      const del = await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issue/${o.key}`, {
          method: "DELETE",
        }),
      );
      const ok = del?.ok || del?.status === 204;
      console.log(`[del] ${ok ? "DELETED" : "FAILED"} ${o.key} ${o.summary}`);
      out.deleted.push({ key: o.key, summary: o.summary, ok });
      await delay(1000);
    } catch (e) {
      console.error(`[del] ERROR ${o.key}`, e?.message);
      out.deleted.push({
        key: o.key,
        summary: o.summary,
        ok: false,
        message: e?.message,
      });
    }
  }
  out.status = out.deleted.every((d) => d.ok) ? "DELETED" : "PARTIAL";
  return out;
}

// Ruling 1.5 — the quotation has brought this activity back into standard scope
// and nothing has started, so the extra work planned in its place is redundant.
// The GROUP survives, because the standard Activity is about to be created in it.
// Same guards as deleteGroup: this destroys issues.
async function replaceEwRw(row) {
  const out = {
    key: row.key,
    summary: row.summary,
    rule: row.rule,
    deleted: [],
  };
  const res = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${row.key}?fields=status,issuetype,customfield_10065`,
    );
  const f = (await res.json()).fields || {};
  if (f.issuetype?.id !== "10019") {
    out.status = "SKIPPED_NOT_A_GROUP";
    return out;
  }
  if (f.status?.name !== "Not Started") {
    out.status = "SKIPPED_STATUS_MOVED";
    out.found = f.status?.name;
    console.warn(`[ewrw] SKIP ${row.key} — status is now ${f.status?.name}`);
    return out;
  }
  const actual = f.customfield_10065 ?? 0;
  if (actual > 0) {
    out.status = "SKIPPED_HAS_HOURS";
    out.found = actual;
    console.warn(`[ewrw] SKIP ${row.key} — ${actual} actual hours`);
    return out;
  }

  // Only the extra work and rework branch. processLoops puts the suffix on the
  // Activity, Work Order and Task alike, so this reaches all three levels.
  const kids = (await collectDescendants(row.key)).filter((k) =>
    EWRW_SUFFIX.test(k.summary),
  );
  if (!kids.length) {
    out.status = "NOTHING_TO_DELETE";
    return out;
  }
  for (const k of kids) {
    const w = await api
      .asApp()
      .requestJira(route`/rest/api/3/issue/${k.key}/worklog`);
    if (((await w.json()).worklogs || []).length) {
      out.status = "SKIPPED_WORKLOG";
      out.found = `${k.key} has worklog(s)`;
      console.warn(`[ewrw] SKIP ${row.key} — ${out.found}`);
      return out;
    }
  }

  const order = kids.sort((a, b) => b.depth - a.depth);
  if (DRY_RUN) {
    console.log(
      `[ewrw] DRY RUN ${row.key} would delete ${order.length}:`,
      order.map((o) => o.key).join(", "),
    );
    out.status = "DRY_RUN";
    out.deleted = order.map((o) => ({ key: o.key, summary: o.summary }));
    return out;
  }
  for (const o of order) {
    try {
      const del = await retryJiraApiCall(() =>
        api.asApp().requestJira(route`/rest/api/3/issue/${o.key}`, {
          method: "DELETE",
        }),
      );
      const ok = del?.ok || del?.status === 204;
      console.log(`[ewrw] ${ok ? "DELETED" : "FAILED"} ${o.key} ${o.summary}`);
      out.deleted.push({ key: o.key, summary: o.summary, ok });
      await delay(1000);
    } catch (e) {
      console.error(`[ewrw] ERROR ${o.key}`, e?.message);
      out.deleted.push({
        key: o.key,
        summary: o.summary,
        ok: false,
        message: e?.message,
      });
    }
  }
  out.status = out.deleted.every((d) => d.ok) ? "REPLACED" : "PARTIAL";
  return out;
}

// Rulings 2 and 3 — the quotation has brought this activity back into standard
// scope, but the extra work has been worked on, so it is closed rather than
// deleted and every logged hour is kept.
//
// The GROUP is not closed. Ruling 2 leaves it In Progress; ruling 3 reopens it
// from Closed so the new standard activity has an open parent. transitionTo
// returns ALREADY for the first case, so one path serves both.
async function closeEwRwChildren(row) {
  const out = { key: row.key, summary: row.summary, rule: row.rule, moves: [] };
  const res = await api
    .asApp()
    .requestJira(route`/rest/api/3/issue/${row.key}?fields=status,issuetype`);
  const f = (await res.json()).fields || {};
  if (f.issuetype?.id !== "10019") {
    out.status = "SKIPPED_NOT_A_GROUP";
    console.warn(`[ewrw] SKIP ${row.key} — not an Activity Group`);
    return out;
  }

  // Only the extra work and rework branch, deepest first. No worklog guard —
  // nothing is deleted here, so nothing can be lost.
  const kids = (await collectDescendants(row.key))
    .filter((k) => EWRW_SUFFIX.test(k.summary))
    .sort((a, b) => b.depth - a.depth);
  if (!kids.length) {
    out.status = "NOTHING_TO_CLOSE";
    return out;
  }
  const ok = (m) => ["MOVED", "DRY_RUN", "ALREADY"].includes(m.status);
  for (const k of kids) {
    const m = await transitionTo(k.key, "Closed");
    out.moves.push(m);
    if (!ok(m)) {
      console.warn(`[ewrw] cascade stopped at ${k.key} (${m.status})`);
      out.status = "PARTIAL";
      return out;
    }
  }
  // Reopening a Closed group clears its 10971 and DFS% — areAllDescendantsClosed
  // turns false. The logged hours and the closed history are untouched; the
  // derived fields recompute when it closes again.
  const g = await transitionTo(row.key, "In Progress");
  out.moves.push(g);
  out.status = ok(g) ? "CLOSED_EWRW" : "PARTIAL";
  return out;
}

// ─── STAGE 2 · STEP 10 — TRANSITIONS ─────────────────────────────────────────
// Ajinkya made a second copy of each transition for the app, condition-free and
// hidden from users; the manual copies keep their conditions. So /transitions
// under asApp returns exactly the set we are allowed to drive, and the date
// requirement seen when closing an Activity by hand is on the manual copy.
//
// Never hardcode an id. They are per workflow AND per status, and they collide
// across types: id 2 is Close on the Activity Group and Approve on the Activity.
// Never match on `name` either — the scheme has 'In Progress  ' with two
// trailing spaces on the group and 'In Progress ' with one on the Activity.
// Match on to.name, fetched per issue, every time.
async function transitionTo(key, targetStatus) {
  const cur = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${key}?fields=status,summary,customfield_10015,customfield_10053`,
    );
  const f = (await cur.json()).fields || {};
  const from = f.status?.name || null;
  const out = { key, summary: f.summary, from, to: targetStatus };

  if (from === targetStatus) {
    out.status = "ALREADY";
    return out;
  }

  const list = await api
    .asApp()
    .requestJira(route`/rest/api/3/issue/${key}/transitions`);
  const ts = (await list.json()).transitions || [];
  const hit = ts.find((t) => t.to?.name === targetStatus);
  if (!hit) {
    // No path in one step. Do not invent a route through another status —
    // which intermediate status is acceptable is a workflow decision, not ours.
    out.status = "NO_TRANSITION";
    out.available = ts.map((t) => `${t.id}=${t.name}->${t.to?.name}`);
    console.warn(`[trn] NO PATH ${key} ${from} -> ${targetStatus}`);
    return out;
  }
  out.id = hit.id;
  out.name = hit.name;

  // Closing needs a Start Date (10015) and an End Date (10053): the transition
  // has a validator that requires both, and dateDifference returns null without
  // them, so OTD would stay blank even if the close succeeded. Missing ones are
  // filled with today. Start falls back to the existing End rather than today
  // when only End is present, so a start can never land after its own end.
  const startVal = f.customfield_10015 || null;
  const endVal = f.customfield_10053 || null;
  if (targetStatus === "Closed" && (!startVal || !endVal)) {
    // Both are plain date fields — "2026-09-11", no time and no offset.
    // Confirmed on CTEST-5561; a datetime string here returns 400.
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const patch = {};
    if (!startVal) patch.customfield_10015 = endVal || today;
    if (!endVal) patch.customfield_10053 = today;
    out.datesFilled = patch;
    if (DRY_RUN) {
      console.log(`[trn] DRY RUN would fill dates on ${key}:`, patch);
    } else {
      try {
        await retryJiraApiCall(() =>
          api.asApp().requestJira(route`/rest/api/3/issue/${key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields: patch }),
          }),
        );
        console.log(`[trn] filled dates on ${key}:`, patch);
      } catch (e) {
        // Not fatal on its own — the transition below fails with the
        // validator's own message, which says more than we could here.
        console.warn(`[trn] could not fill dates on ${key}: ${e?.message}`);
      }
    }
  }

  if (DRY_RUN) {
    console.log(
      `[trn] DRY RUN ${key} ${from} -> ${targetStatus} via ${hit.id}`,
    );
    out.status = "DRY_RUN";
    return out;
  }
  try {
    const res = await retryJiraApiCall(() =>
      api.asApp().requestJira(route`/rest/api/3/issue/${key}/transitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transition: { id: hit.id } }),
      }),
    );
    out.httpStatus = res?.status;
    if (res?.status === 204) {
      out.status = "MOVED";
      console.log(`[trn] ${key} ${from} -> ${targetStatus} via ${hit.id}`);
    } else {
      // A validator rejects HERE, not at /transitions — no API reports them.
      // Carry the body so the receipt names the field it wanted.
      out.status = "REJECTED";
      try {
        out.body = await res.json();
      } catch (e) {
        out.body = null;
      }
      console.error(
        `[trn] REJECTED ${key} HTTP ${res?.status}`,
        JSON.stringify(out.body),
      );
    }
    await delay(500);
  } catch (e) {
    out.status = "ERROR";
    out.message = e?.message;
    console.error(`[trn] ERROR ${key}`, e?.message);
  }
  return out;
}

// Deepest first, and STOP at the first failure. A half-closed branch is worse
// than an untouched one: areAllDescendantsClosed keeps returning false, so
// 10971 never settles and the group sits in a state nobody chose.
async function closeBranch(agKey) {
  const kids = await collectDescendants(agKey);
  const order = kids
    .sort((a, b) => b.depth - a.depth)
    .concat([{ key: agKey, depth: 0 }]);
  const moves = [];
  for (const o of order) {
    const m = await transitionTo(o.key, "Closed");
    moves.push(m);
    if (!["MOVED", "DRY_RUN", "ALREADY"].includes(m.status)) {
      console.warn(`[trn] cascade stopped at ${o.key} (${m.status})`);
      break;
    }
  }
  const done = moves.every((m) =>
    ["MOVED", "DRY_RUN", "ALREADY"].includes(m.status),
  );
  return { agKey, status: done ? "CLOSED" : "PARTIAL", moves };
}

export const handler = resolver.getDefinitions();
export const handler1 = resolver1.getDefinitions();
