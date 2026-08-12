// new code after DFS and standard hours update optimization

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

            roofData["TDL"] += subData["TDL"] * multiplier;
            roofData["COO"] += subData["COO"] * multiplier;
            roofData["DE"] += subData["DE"] * multiplier;
          });
        } else {
          let multiplier = roofData[phase] || 0;
          data[activityKey]["loop"] = multiplier;

          roofData["TDL"] *= multiplier;
          roofData["COO"] *= multiplier;
          roofData["DE"] *= multiplier;
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

///need to pass the phase name
/// then
resolver.define("getConfigData", async ({ payload }) => {
  let { issue, phase, key } = payload;
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
    key = issueDetail.fields["customfield_10073"].value;
    // let customer = issueDetail.fields["customfield_10041"]
    let customer = issueDetail.fields["customfield_10838"].value;

    const productParts = issueDetail.fields["customfield_10074"].map(
      (element) => element.value,
    );
    // console.log(productParts)
    console.log("Key" + key);
    // data=processJsonWithPhase(data,phase)
    console.log("Phasessss" + phase);

    if (!key.includes("- CAE")) {
      updatedActivities = calculateSumsWithTotal(
        processJsonWithPhase(data[key].activities, phase),
        productParts,
      );
      console.log(updatedActivities);
      let _2DDrawing = data["2D Drawing"].activities[key];
      let _2DDrawingPercentages = data["2D Drawing"].percentages;
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
        data["Data Management"].customers[key][customer] ||
        data["Data Management"].customers[key]["Standard"];
      let _dataManagementPercentages = data["Data Management"].percentages;
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

      // console.log("_2DDrawing", JSON.stringify(_2DDrawing))
      if (phase == "Industrialization") {
        let proto = await storage.get(`${issue.key}_Industrialization_Proto`);
        let serie = await storage.get(`${issue.key}_Industrialization_Serie`);
        updatedActivities = updateIndustrializationValues(
          proto,
          serie,
          data["Industrialization"].activities,
          data["Industrialization"].percentages[key],
        );
      }
    } else {
      updatedActivities = data[key].activities;
    }

    console.log(updatedActivities);

    // console.log(JSON.stringify(updatedActivities))
  }
  // console.log(data)
  if (data) {
    // console.log(key == "Milestone" ? data[key].milestones : updatedActivities)
    return key == "Milestone" && phase != "Industrialization"
      ? data[key].milestones
      : { product: key, activity: updatedActivities };
  }
  return {};
});

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
    // Dev --> CDEMO // Prod --> CWO // Staging --> CTEST
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
          const allClosed = agIsClosed
            ? await areAllDescendantsClosed(issueData.key)
            : false;

          if (allClosed) {
            // Q3=A: when all closed, Close Std Hrs (10971) == Total Standard Hrs (10061)
            // Compute in-memory and use it immediately as the denominator (no read-back -> no race)
            // All descendants closed -> the full plan is now the closed standard (Q3=A)
            const totalStdHrs = fieldValue10061;
            const closeStdHrs = totalStdHrs; // Close Std Hrs == Total Std Hrs at all-closed
            const actualHrs = fieldValue10093;

            // Remember the snapshot so we can persist 10971 in the main update payload (Step 3)
            agCloseStdHrsToSet = closeStdHrs;

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
            console.log(
              `CASE 2.1 [NOT ALL CLOSED]---> Type: ${type} | DFS + 10971 reset to null`,
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
  // const rawJql = `project in ( CWO) AND issuetype in (Activity, "Work Order", Task) AND (cf[11168] < now() OR cf[11168] IS EMPTY) ORDER BY cf[11168] ASC`;
  // const rawJql = `project in (CDEMO) AND (cf[11168] < now() OR cf[11168] IS EMPTY) ORDER BY cf[11168] ASC`;
  const rawJql = `project in (CTEST) AND (cf[11168] < now() OR cf[11168] IS EMPTY) ORDER BY cf[11168] ASC`;

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
export async function updateQuotationIssue(event, context) {
  console.log("Quotation Update Triggered !!!!!!!!!!!!");
  const issueKey = event.call.payload.issue.key;
  console.log("Issue Key", issueKey);

  const issue = await fetchIssue(issueKey);
  const product = issue.fields["customfield_10073"].value; // Product-BU custom field
  const customer = issue.fields["customfield_10838"].value; // Customer custom field

  let base64String = await storage.get(STORAGE_KEY);
  const uint8Arr = base64ToUint8Array(base64String);
  const decompressedString = pako.inflate(uint8Arr, { to: "string" });
  let data = JSON.parse(decompressedString);
  const t_ceco_summary = data["T_CECO_SUMMARY"]["records"][customer];
  console.log(data["T_CECO_SUMMARY"]["records"][customer][product]);
  const fieldsToUpdate = {
    customfield_11283: t_ceco_summary["Common"]["CATIA / NX"],
    customfield_11275: t_ceco_summary[product]?.["3D_TDL"],
  };
  const updateQuotation = await updateIssueWithRetry(issueKey, fieldsToUpdate);
  if (updateQuotation.ok) {
    console.log("T_CECO_SUMMARY details Updated");
  }
}

resolver.define("getQuotationData", async ({ payload }) => {
  let { issue } = payload;
  console.log("fetching...");
  console.log("Key: " + issue.key);
  const issueResponse = await fetchIssue(issue.key);
  const product = issueResponse.fields["customfield_10073"]?.value; // Product-BU custom field
  const customer = issueResponse.fields["customfield_10838"]?.value;
  // First, try to get quotation data from storage
  let quot = await storage.get(`Quot_${product}_${customer}_${issue.key}`);

  // If quotation data exists and has values, return it
  if (quot && Object.keys(quot).length > 0) {
    console.log("Returning cached quotation data");
    return quot;
  }

  // If no quotation data or empty, fetch from compressed storage
  console.log("No cached quotation found, fetching from compressed storage");

  try {
    let base64String = await storage.get(STORAGE_KEY);

    if (!base64String) {
      console.log("No data found in storage");
      return {};
    }

    const uint8Arr = base64ToUint8Array(base64String);
    const decompressedString = pako.inflate(uint8Arr, { to: "string" });
    let data = JSON.parse(decompressedString);

    // Fetch issue to get product information
    const issueResponse = await fetchIssue(issue.key);
    const product = issueResponse.fields["customfield_10073"]?.value; // Product-BU custom field
    const customer = issueResponse.fields["customfield_10838"]?.value; // Customer custom field

    if (!product) {
      console.log("No product found for issue");
      return {};
    }

    const productData = data[product];
    return productData || {};
  } catch (error) {
    console.error("Error fetching quotation data:", error);
    return {};
  }
});
resolver.define("saveQuotationData", async ({ payload }) => {
  let { issue, data } = payload;
  console.log("fetching...");
  console.log("Key" + issue);
  const issueResponse = await fetchIssue(issue);
  const revision = issueResponse.fields["customfield_11663"]; // to be used while craeting revision
  const product = issueResponse.fields["customfield_10073"]?.value; // Product-BU custom field
  const customer = issueResponse.fields["customfield_10838"]?.value;
  if (!data) {
    throw new Error("No data provided for update");
  }

  await storage.set(`Quot_${product}_${customer}_${issue}`, data);
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

// TEMPORARY (Step 3): faithful replay of getConfigData's activity-branch cook.
// Re-parses the blob fresh per call because processJsonWithPhase mutates in place.
// Removed in Step 7 when we extract the shared cookActivities from getConfigData.
// COMPATIBILITY SEAM (demo vs Sayan quotation):
// `recipe` is the NEW-side product/quotation object ({ activities, id, ... }).
// DEMO: caller passes blob[COOK_KEY]. REAL: caller passes the storage.get'd
// Quot_WO_... object — SAME shape, so this cook is unchanged either way.
// `productKey` is kept only for the CAE short-circuit + logging.
async function cookActivitiesTemp(
  recipe,
  productKey,
  phase,
  productParts,
  customer,
  projectKey,
) {
  // still need the blob for the SHARED sections (2D Drawing, Data Management)
  const base64String = await storage.get(STORAGE_KEY);
  const uint8Arr = base64ToUint8Array(base64String);
  const decompressedString = pako.inflate(uint8Arr, { to: "string" });
  const data = JSON.parse(decompressedString); // fresh parse each call

  console.log(
    `[compare] cook key="${productKey}" phase="${phase}" part0="${productParts[0]}" customer="${customer}"`,
  );

  if (!recipe || !recipe.activities) {
    console.log(`[compare] cook: no recipe/activities for "${productKey}"`);
    return {};
  }
  if (productKey.includes("- CAE")) return recipe.activities;

  // Industrialization does not cook from the product recipe. Production
  // (getConfigData ~1624) builds it from the per-project Proto/Serie snapshots
  // written at phase creation, against the shared "Industrialization" section.
  if (phase === "Industrialization") {
    const proto = await storage.get(`${projectKey}_Industrialization_Proto`);
    const serie = await storage.get(`${projectKey}_Industrialization_Serie`);
    const ind = data["Industrialization"];
    if (!ind || !ind.activities) {
      console.log(`[compare] no Industrialization section in blob`);
      return {};
    }
    // Percentages may be absent for this product. Production passes the
    // lookup through and lets updateIndustrializationValues fall back to its
    // 15/15/15 default, so hand over undefined rather than bailing out.
    return updateIndustrializationValues(
      proto,
      serie,
      JSON.parse(JSON.stringify(ind.activities)),
      ind.percentages ? ind.percentages[productKey] : undefined,
    );
  }

  // pass 1: phase multiply + sum selected parts
  let cooked = calculateSumsWithTotal(
    processJsonWithPhase(recipe.activities, phase),
    productParts,
  );

  // pass 2: 2D Drawing (diagnostic-guarded)
  const _2DDrawing = data["2D Drawing"]?.activities?.[productKey];
  const _2DPct = data["2D Drawing"]?.percentages;
  console.log(
    `[compare]   2D: drawing defined=${!!_2DDrawing}, pct defined=${!!_2DPct}, pct[phase]=${_2DPct?.[phase]}`,
  );
  if (_2DDrawing && _2DPct) {
    cooked = calculateSumsWithTotal(
      update2DDrawingData(
        recipe.activities,
        _2DDrawing,
        productParts,
        _2DPct,
        phase,
      ),
      productParts,
    );
  } else {
    console.log(
      `[compare]   2D: SKIPPED (missing input) — differs from getConfigData!`,
    );
  }

  // pass 3: Data Management (diagnostic-guarded)

  const _dmCustomers = data["Data Management"]?.customers?.[productKey];
  const _dmTime = _dmCustomers?.[customer] ?? _dmCustomers?.["Standard"];
  const _dmPct = data["Data Management"]?.percentages;
  console.log(
    `[compare]   DM: customers[key] defined=${!!_dmCustomers}, time=${_dmTime}, pct[phase]=${_dmPct?.[phase]}`,
  );
  if (_dmTime !== undefined && _dmPct) {
    cooked = calculateSumsWithTotal(
      updateDataManagement(
        recipe.activities,
        _dmTime,
        productParts,
        _dmPct,
        phase,
      ),
      productParts,
    );
  } else {
    console.log(
      `[compare]   DM: SKIPPED (missing input) — differs from getConfigData!`,
    );
  }

  cooked._diag = {
    phase,
    part0: productParts[0],
    customer,
    twoD_drawingDefined: !!_2DDrawing,
    twoD_pctPhase: _2DPct?.[phase],
    dm_customersDefined: !!_dmCustomers,
    dm_time: _dmTime,
    dm_pctPhase: _dmPct?.[phase],
  };
  return cooked;
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

// TEMPORARY revision resolver — naming convention only ("X New" in the blob).
// DEMO ONLY: current hierarchy vs "Centre Console New". Sayan's stored-quotation
// system is not deployed yet.
//
// REAL VERSION (swap this ONE function + getNewRevisionRecipe below when live):
//   - parse issue customfield_11696 = "summary ## quotation ## version" (split " ## ")
//   - family from Product-BU (10073): "- CAE"→CAE, "- PS"→PS, else CAD
//   - baseKey = productBU.split(" -")[0]
//   - key = `Quot_WO_${baseKey}_${customer}_${quotation}_${family}_${version}`
//   - stored value is a RAW recipe (same .activities shape) → cook path unchanged
//   - NEW-side 2D/DM must switch to "2D Drawing - Quotation" /
//     "Data Management - Quotation" + projectType routing (Sayan getConfigData ~1962/1994)
//   - PAIRING unresolved: 11696 holds the version BUILT from (V1); finding a NEWER
//     one (V2+) needs storage enumeration or a user-picked version.
function resolveNewRevisionKey(currentProductKey) {
  return `${currentProductKey} New`;
}

// The comparison body, extracted so Stage 2 can call the SAME code the UI calls.
// A copy would drift the moment one side changed; one implementation cannot.
async function runComparison(payload) {
  const { issue } = payload;
  const projectKey = issue.key;

  // read project product parts + customer + current product (drive the cook)
  const projRes = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/issue/${projectKey}?fields=customfield_10074,customfield_10838,customfield_10073`,
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

  // SELF-TEST SWITCH.
  //   false -> normal: compare against the "X New" revision in the blob.
  //   true  -> calibration: compare the project against its OWN product, so both
  //            sides cook the identical recipe. Every AG that has a baseline MUST
  //            then read SAME. Any CHANGE / REMOVE / ORPHAN is a bug in the
  //            compare code, not a quotation difference.
  //   Only meaningful while the catalog has not been edited since Create Phase
  //   ran for this project — otherwise the difference is catalog drift, not a bug.
  const CALIBRATE = false;
  const COOK_KEY = CALIBRATE
    ? currentProductKey
    : resolveNewRevisionKey(currentProductKey); // "X New"; swap when versioning lands

  // guard: does the NEW revision actually exist in the blob?
  const base64String = await storage.get(STORAGE_KEY);
  const blob = JSON.parse(
    pako.inflate(base64ToUint8Array(base64String), { to: "string" }),
  );
  if (!blob[COOK_KEY]) {
    return {
      ok: false,
      error: "NO_NEW_REVISION",
      message: `No newer revision available for "${currentProductKey}".`,
      currentProduct: currentProductKey,
    };
  }

  console.log(
    `[compare] COOK project=${projectKey} current="${currentProductKey}" new="${COOK_KEY}" customer="${customer}" parts=${productParts.length}`,
  );

  const phases = await fetchWbsChildren(projectKey);
  const result = [];

  for (const phase of phases) {
    const phaseName = phase.summary.replace(/^\d+\s*/, "").trim();

    // Fetch the NEW-side recipe. DEMO: from the blob under COOK_KEY.
    // REAL: replace this one line with the Quot_WO_... storage.get (see
    // resolveNewRevisionKey comment). Shape is identical, so the cook is unchanged.
    // Deep-copy per phase: processJsonWithPhase mutates in place, and its
    // no-subactivity branch multiplies (*=) rather than assigns. Sharing one
    // recipe object across phases compounds the multipliers — Stack up
    // tolerances read 8400 in Serie instead of 140 (2 x 60 x 70 vs 2 x 70).
    // Same guard the Industrialization branch already uses.
    const newRecipe = JSON.parse(JSON.stringify(blob[COOK_KEY]));

    // cook the NEW quotation for this phase
    const cooked = await cookActivitiesTemp(
      newRecipe,
      COOK_KEY,
      phaseName,
      productParts,
      customer,
      projectKey,
    );
    const cookDiag = cooked._diag || null; // keep the defined-flags for the safeguard
    delete cooked._diag; // drop it so it isn't treated as an activity

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
          route`/rest/api/3/issue/${ag.key}?fields=summary,status,customfield_10061,customfield_10075,customfield_10076,customfield_10077`,
        );
      const f = (await res.json()).fields;
      agRows.push({
        key: ag.key,
        summary: f.summary,
        status: f.status?.name || null,
        currentStd: f.customfield_10061 ?? null,
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
        verdicts.push({
          ...ag,
          newStd: null,
          verdict: "ORPHAN (no cooked match)",
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
      if (isClosed) {
        verdict = "LOCKED (closed — skip)";
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
      if (nw === 0 && !isClosed) {
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
      verdicts.push({
        ...ag,
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
    result.push({ phase: phase.summary, phaseKey: phase.key, verdicts, added });
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
  NONE: "no action",
};

// One comparison row -> the rule that governs it.
// Statuses: Closed | Submit for Approval | In Progress | Not Started.
// "started" means work has begun, so hours are cleared rather than deleted.
function resolvePlanRule(row) {
  const v = String(row.verdict || "");
  const status = row.status || "";
  const started = status === "In Progress" || status === "Submit for Approval";

  if (status === "Closed")
    return { rule: 1, action: PLAN_ACTION.SKIP, why: "group is closed" };
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
          action: PLAN_ACTION.CLEAR,
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
        (r.action === PLAN_ACTION.DELETE || r.action === PLAN_ACTION.CLEAR)
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
      if (action === PLAN_ACTION.UPDATE)
        after = { total: v.newStd, TDL: v.newTDL, COO: v.newCOO, DE: v.newDE };
      if (action === PLAN_ACTION.CLEAR)
        after = { total: null, TDL: null, COO: null, DE: null };

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
resolver.define("applyPlan", async ({ payload }) => buildPlan(payload));

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

const DRY_RUN = true;

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
  const payload = event?.call?.payload ?? event;
  const projectKey = payload?.issue?.key;
  const phaseKey = payload?.phaseKey;
  let phaseLabel = null;

  const plan = await buildPlan(payload);
  if (!plan.ok) return plan;

  const receipt = [];
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

  for (const ph of plan.phases) {
    // Everything outside the chosen phase is left exactly as it is.
    if (ph.phaseKey !== phaseKey) continue;
    phaseLabel = ph.phase;
    for (const row of ph.rows) {
      if (row.action !== "update 4 fields" && row.action !== "clear 4 fields")
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

  const rollups = [];
  let projectDelta = 0;
  for (const [phaseKey, delta] of Object.entries(phaseDelta)) {
    if (!delta) continue;
    projectDelta += delta;
    rollups.push(await bump(phaseKey, delta, "Phase"));
  }
  // Phases keep the delta so they don't shift by the 0.4 round-once/round-each
  // drift. The project recomputes: same answer, because the project is exactly
  // the sum of its phases — but idempotent, so a half-run is repairable.
  const predicted = {};
  rollups.forEach((r) => {
    if (r.label === "Phase") predicted[r.key] = r.after;
  });
  if (projectDelta)
    rollups.push(await rollupProjectTotal(projectKey, predicted));

  console.log(
    `[write] DONE dryRun=${DRY_RUN} written=${written} skipped=${skipped} failed=${failed}`,
  );

  // The receipt is the only record of what each write replaced — Jira keeps no
  // history of these fields and forge logs expire. One key per project,
  // overwritten each run.
  if (!phaseLabel) {
    console.warn(`[write] phase ${phaseKey} not found in the plan`);
    return { ok: false, error: "PHASE_NOT_FOUND", projectKey, phaseKey };
  }

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

export const handler = resolver.getDefinitions();
export const handler1 = resolver1.getDefinitions();
