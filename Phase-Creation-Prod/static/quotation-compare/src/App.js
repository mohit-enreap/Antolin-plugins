import React, { useEffect, useState } from "react";
import { invoke, view } from "@forge/bridge";

/* ------------------------------------------------------------------ *
 * Compare Quotation — Stage 1 (preview only, nothing is ever written) *
 * ------------------------------------------------------------------ */

const T = {
  ink: "#172B4D",
  body: "#44546F",
  muted: "#626F86",
  faint: "#8993A4",
  line: "#DFE1E6",
  hair: "#EBECF0",
  canvas: "#F7F8F9",
  surface: "#FFFFFF",
  link: "#0C66E4",
  linkDark: "#0055CC",
  red: "#AE2E24",
  violet: "#5E4DB2",
  amber: "#974F0C",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const VERDICT = {
  CHANGE: { label: "Change", fg: "#0055CC", bg: "#E9F2FF", dot: "#0C66E4" },
  REMOVE: { label: "Remove", fg: "#AE2E24", bg: "#FFECEB", dot: "#C9372C" },
  SAME: { label: "Same", fg: "#216E4E", bg: "#DCFFF1", dot: "#22A06B" },
  NOT_PLANNED: {
    label: "Not planned",
    fg: "#626F86",
    bg: "#F1F2F4",
    dot: "#B3B9C4",
  },
  LOCKED: { label: "Locked", fg: "#FFFFFF", bg: "#C9372C", dot: "#C9372C" },
  ORPHAN: { label: "Orphan", fg: "#974F0C", bg: "#FFF7D6", dot: "#E56910" },
  ADD: { label: "Add", fg: "#5E4DB2", bg: "#F3F0FF", dot: "#8270DB" },
};

const ORDER = [
  "CHANGE",
  "REMOVE",
  "SAME",
  "NOT_PLANNED",
  "LOCKED",
  "ORPHAN",
  "ADD",
];

/* the three role fields, in the order the quotation reads them */
const ROLES = [
  { label: "TDL", cur: "currentTDL", nw: "newTDL" },
  { label: "COO", cur: "currentCOO", nw: "newCOO" },
  { label: "DE", cur: "currentDE", nw: "newDE" },
];

function classify(verdict) {
  const v = String(verdict || "");
  if (v.startsWith("LOCKED")) return "LOCKED";
  if (v.startsWith("NOT PLANNED")) return "NOT_PLANNED";
  if (v.startsWith("ORPHAN")) return "ORPHAN";
  if (v.startsWith("ADD")) return "ADD";
  if (v.startsWith("REMOVE")) return "REMOVE";
  if (v === "SAME") return "SAME";
  return "CHANGE";
}

/* "Group 102 | DATA PREPARATION  |  A surface analysis" */
function parse(summary) {
  const parts = String(summary || "")
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    group: parts[0] || "",
    section: parts.length > 2 ? parts[1] : "",
    name: parts.length > 2 ? parts.slice(2).join(" | ") : parts[1] || "",
  };
}

const isNum = (n) => n !== null && n !== undefined && !Number.isNaN(Number(n));
const hrs = (n) => (isNum(n) ? Number(n).toFixed(1) : null);
const r1 = (n) => (isNum(n) ? Number(Number(n).toFixed(1)) : null);

/* sum of the role fields on one side; null when the side has no role data */
function roleSum(row, side) {
  let total = 0;
  let any = false;
  ROLES.forEach((role) => {
    const v = row[role[side]];
    if (isNum(v)) {
      total += Number(v);
      any = true;
    }
  });
  return any ? r1(total) : null;
}

/* does this row have anything worth expanding? */
function hasRoleData(row) {
  return ROLES.some((role) => isNum(row[role.cur]) || isNum(row[role.nw]));
}

function Lozenge({ verdict, flagged }) {
  const s = VERDICT[classify(verdict)] || VERDICT.CHANGE;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        title={verdict}
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 3,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: "uppercase",
          color: s.fg,
          background: s.bg,
          whiteSpace: "nowrap",
        }}
      >
        {s.label}
      </span>
      {flagged ? <span title="Configuration may be incomplete">⚠️</span> : null}
    </span>
  );
}

function Chips({ verdicts }) {
  const counts = {};
  verdicts.forEach((v) => {
    const k = classify(v.verdict);
    counts[k] = (counts[k] || 0) + 1;
  });
  const present = ORDER.filter((k) => counts[k]);
  if (!present.length) return null;
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 14 }}
    >
      {present.map((k) => (
        <span
          key={k}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: T.body,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 8,
              background: VERDICT[k].dot,
            }}
          />
          <strong style={{ color: T.ink, fontWeight: 600 }}>{counts[k]}</strong>
          {VERDICT[k].label.toLowerCase()}
        </span>
      ))}
    </div>
  );
}

const TH = {
  padding: "8px 12px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: T.faint,
  borderBottom: `1px solid ${T.line}`,
  background: T.canvas,
  textAlign: "left",
  position: "sticky",
  top: 0,
  zIndex: 2,
};
const TD = {
  padding: "9px 12px",
  fontSize: 13,
  color: T.ink,
  borderBottom: `1px solid ${T.hair}`,
  verticalAlign: "middle",
};
const NUM = {
  ...TD,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

/* ---- expanded role breakdown: one <tr> per role, aligned to the parent columns ---- */

const DETAIL = {
  padding: "6px 12px",
  fontSize: 12,
  background: T.canvas,
  borderBottom: `1px solid ${T.hair}`,
  color: T.body,
  verticalAlign: "middle",
};
const DETAIL_NUM = {
  ...DETAIL,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

function Delta({ cur, nw }) {
  const c = isNum(cur) ? Number(cur) : null;
  const n = isNum(nw) ? Number(nw) : null;

  if (c === null && n === null) return null;
  if (c === null)
    return (
      <span style={{ color: T.violet, fontSize: 11, fontWeight: 600 }}>
        not set before
      </span>
    );
  if (n === null)
    return (
      <span style={{ color: T.amber, fontSize: 11, fontWeight: 600 }}>
        not in new
      </span>
    );

  const d = r1(n - c);
  if (d === 0)
    return <span style={{ color: T.faint, fontSize: 11 }}>no change</span>;
  return (
    <span
      style={{
        color: d > 0 ? T.linkDark : T.red,
        fontSize: 11,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1)}
    </span>
  );
}

function DetailRows({ row }) {
  const rows = ROLES.filter(
    (role) => isNum(row[role.cur]) || isNum(row[role.nw]),
  );

  const curSum = roleSum(row, "cur");
  const nwSum = roleSum(row, "nw");
  const curStd = r1(row.currentStd);
  const nwStd = r1(row.newStd);

  /* the cook builds standard = TDL + COO + DE, so a mismatch means the
     stored total and its parts disagree. 0.25 absorbs 1-decimal rounding. */
  const curMismatch =
    curSum !== null && curStd !== null && Math.abs(curSum - curStd) > 0.25;
  const nwMismatch =
    nwSum !== null && nwStd !== null && Math.abs(nwSum - nwStd) > 0.25;

  const notes = [];
  if (row.status === "Closed")
    notes.push("This group is closed, so an overwrite will skip it.");
  if (classify(row.verdict) === "ORPHAN")
    notes.push("No matching activity was found in the new quotation.");
  if (row.flag === "MISSING_2D_CONFIG")
    notes.push(
      "The new quotation has no 2D Drawing configuration for this product, so these hours read as zero.",
    );
  if (row.flag === "MISSING_DM_CONFIG")
    notes.push(
      "The new quotation has no Data Management configuration for this product, so these hours read as zero.",
    );
  if (curMismatch || nwMismatch)
    notes.push("The roles below do not add up to the total on this row.");

  const accent = { boxShadow: `inset 3px 0 0 ${T.line}` };

  return (
    <>
      {rows.map((role) => {
        const cur = row[role.cur];
        const nw = row[role.nw];
        const changed = !(isNum(cur) && isNum(nw)) || r1(cur) !== r1(nw);
        return (
          <tr key={role.label}>
            <td style={{ ...DETAIL, ...accent }} />
            <td style={{ ...DETAIL, color: T.body, fontWeight: 500 }}>
              {role.label}
            </td>
            <td style={DETAIL} />
            <td
              style={{
                ...DETAIL_NUM,
                color: isNum(cur) ? T.body : T.faint,
              }}
            >
              {isNum(cur) ? hrs(cur) : "—"}
            </td>
            <td
              style={{
                ...DETAIL_NUM,
                color: T.ink,
                fontWeight: changed ? 700 : 400,
              }}
            >
              {isNum(nw) ? hrs(nw) : "—"}
            </td>
            <td style={DETAIL}>
              <Delta cur={cur} nw={nw} />
            </td>
          </tr>
        );
      })}

      {notes.length ? (
        <tr>
          <td style={{ ...DETAIL, ...accent }} />
          <td
            colSpan={5}
            style={{
              ...DETAIL,
              paddingTop: 2,
              paddingBottom: 10,
              fontSize: 12,
              color: T.muted,
            }}
          >
            {notes.map((n, i) => (
              <div key={i} style={{ marginTop: i ? 3 : 0 }}>
                {n}
              </div>
            ))}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Table({ verdicts }) {
  const [open, setOpen] = useState({});
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  /* group consecutive rows under their WBS section */
  const blocks = [];
  verdicts.forEach((v) => {
    const p = parse(v.summary);
    const last = blocks[blocks.length - 1];
    if (last && last.section === p.section) last.rows.push({ v, p });
    else blocks.push({ section: p.section, rows: [{ v, p }] });
  });

  return (
    <div
      style={{
        border: `1px solid ${T.line}`,
        borderRadius: 6,
        background: T.surface,
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}
      >
        <thead>
          <tr>
            <th style={{ ...TH, width: 92, borderTopLeftRadius: 6 }}>Group</th>
            <th style={TH}>Activity</th>
            <th style={{ ...TH, width: 108 }}>Status</th>
            <th style={{ ...TH, width: 92, textAlign: "right" }}>Current</th>
            <th style={{ ...TH, width: 92, textAlign: "right" }}>New</th>
            <th style={{ ...TH, width: 132, borderTopRightRadius: 6 }}>
              Verdict
            </th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((b, bi) => (
            <React.Fragment key={`${b.section}-${bi}`}>
              {b.section ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "7px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      color: T.muted,
                      background: T.canvas,
                      borderBottom: `1px solid ${T.hair}`,
                    }}
                  >
                    {b.section}
                  </td>
                </tr>
              ) : null}
              {b.rows.map(({ v, p }) => {
                const cur = hrs(v.currentStd);
                const nw = hrs(v.newStd);
                const closed = v.status === "Closed";
                const expandable = hasRoleData(v);
                const isOpen = Boolean(open[v.key]);
                return (
                  <React.Fragment key={v.key}>
                    <tr
                      className="cq-row"
                      data-open={isOpen}
                      onClick={expandable ? () => toggle(v.key) : undefined}
                      style={expandable ? { cursor: "pointer" } : undefined}
                    >
                      <td
                        style={{
                          ...TD,
                          color: T.faint,
                          whiteSpace: "nowrap",
                          paddingLeft: 8,
                        }}
                      >
                        {expandable ? (
                          <button
                            className="cq-caret"
                            data-open={isOpen}
                            aria-expanded={isOpen}
                            aria-label={`Hours by role for group ${p.group.replace(/^Group\s*/i, "")}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(v.key);
                            }}
                          >
                            ▸
                          </button>
                        ) : (
                          <span
                            style={{ display: "inline-block", width: 20 }}
                          />
                        )}
                        {p.group.replace(/^Group\s*/i, "")}
                      </td>
                      <td style={TD}>{p.name}</td>
                      <td
                        style={{
                          ...TD,
                          fontSize: 12,
                          color: closed ? T.ink : T.muted,
                          fontWeight: closed ? 600 : 400,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.status || "—"}
                      </td>
                      <td
                        style={{
                          ...NUM,
                          color: cur === null ? T.faint : T.body,
                        }}
                      >
                        {cur === null ? "—" : cur}
                      </td>
                      <td style={{ ...NUM, fontWeight: 600 }}>
                        {nw === null ? "—" : nw}
                      </td>
                      <td style={{ ...TD, whiteSpace: "nowrap" }}>
                        <Lozenge
                          verdict={v.verdict}
                          flagged={Boolean(v.flag)}
                        />
                      </td>
                    </tr>
                    {isOpen && expandable ? <DetailRows row={v} /> : null}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Added({ added }) {
  if (!added || !added.length) return null;
  return (
    <div style={{ marginTop: 22 }}>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: T.faint,
        }}
      >
        In the new quotation, not yet in the hierarchy
      </p>
      <div
        style={{
          border: `1px solid ${T.line}`,
          borderRadius: 6,
          overflow: "hidden",
          background: T.surface,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {added.map((a) => (
              <tr key={a.actKey} className="cq-row">
                <td style={TD}>
                  {String(a.actKey).replace(/\s*\|\s*/g, " | ")}
                </td>
                <td style={{ ...NUM, width: 92, fontWeight: 600 }}>
                  {hrs(a.newStd)}
                </td>
                <td style={{ ...TD, width: 132, whiteSpace: "nowrap" }}>
                  <Lozenge verdict={a.verdict} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * STEP 2 — the apply plan view. Renders what applyPlan returned.      *
 * Read-only: this component writes nothing and calls nothing.         *
 * ------------------------------------------------------------------ */

const LOZ = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 3,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.3,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

/* One lozenge per action. Delete is the only solid-red one because it is the
   only action that destroys issues. */
const ACTION_STYLE = {
  skip: { label: "Skip", fg: "#626F86", bg: "#F1F2F4" },
  "update 4 fields": { label: "Update", fg: "#0055CC", bg: "#E9F2FF" },
  "clear 4 fields": { label: "Clear hours", fg: "#974F0C", bg: "#FFF7D6" },
  "delete group and children": {
    label: "Delete",
    fg: "#FFFFFF",
    bg: "#C9372C",
  },
  "create via create phase": { label: "Add", fg: "#5E4DB2", bg: "#F3F0FF" },
  "no action": { label: "None", fg: "#8993A4", bg: "#F1F2F4" },
};

/* A vetoed row also carries action "no action", but for a very different
   reason — a rule fired and was cancelled. It must not look like the 32 rows
   that are idle because nothing changed. */
const VETO_STYLE = { label: "Vetoed", fg: "#974F0C", bg: "#FFF7D6" };

function ActionLozenge({ row }) {
  const s = row.veto
    ? VETO_STYLE
    : ACTION_STYLE[row.action] || ACTION_STYLE["no action"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span title={row.why} style={{ ...LOZ, color: s.fg, background: s.bg }}>
        {s.label}
      </span>
      {row.veto ? <span title={row.veto}>⚠️</span> : null}
      {row.rule ? (
        <span style={{ fontSize: 11, color: T.faint, whiteSpace: "nowrap" }}>
          rule {row.rule}
        </span>
      ) : null}
    </span>
  );
}

function PlanSummary({ phases }) {
  let writes = 0,
    adds = 0,
    vetoed = 0,
    skipped = 0,
    none = 0;
  phases.forEach((p) =>
    p.rows.forEach((r) => {
      if (r.veto) vetoed++;
      else if (r.action === "create via create phase") adds++;
      else if (r.action === "skip") skipped++;
      else if (r.action === "no action") none++;
      else writes++;
    }),
  );
  const item = (n, label, strong) => (
    <span style={{ fontSize: 12, color: T.body }}>
      <strong style={{ color: strong ? T.red : T.ink, fontWeight: 600 }}>
        {n}
      </strong>{" "}
      {label}
    </span>
  );
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 14 }}
    >
      {item(writes, "field writes")}
      {item(adds, "to add via Create Phase")}
      {vetoed ? item(vetoed, "vetoed", true) : null}
      {item(skipped, "skipped")}
      {item(none, "no action")}
    </div>
  );
}

function PlanDetailRows({ row }) {
  const fields = [
    { label: "Total", k: "total" },
    { label: "TDL", k: "TDL" },
    { label: "COO", k: "COO" },
    { label: "DE", k: "DE" },
  ];
  const notes = [];
  if (row.veto)
    notes.push(`Vetoed — ${row.veto}. Nothing will be written to this group.`);
  else notes.push(row.why);
  if (row.action === "delete group and children")
    notes.push(
      "The group and the Activity, Work Order and Task beneath it would be deleted.",
    );
  if (row.action === "clear 4 fields")
    notes.push("The group is kept; its four hour fields are set to empty.");
  if (row.action === "create via create phase")
    notes.push(
      "Created by re-running Create Phase from the updated snapshot, not written here.",
    );

  const accent = { boxShadow: `inset 3px 0 0 ${T.line}` };
  return (
    <>
      {fields.map((f) => {
        const b = row.before ? row.before[f.k] : null;
        const a = row.after ? row.after[f.k] : null;
        if (!isNum(b) && !isNum(a)) return null;
        const changed = !isNum(a) || !isNum(b) || Number(a) !== Number(b);
        return (
          <tr key={f.label}>
            <td style={{ ...DETAIL, ...accent }} />
            <td style={{ ...DETAIL, fontWeight: 500 }}>{f.label}</td>
            <td style={DETAIL} />
            <td style={{ ...DETAIL_NUM, color: isNum(b) ? T.body : T.faint }}>
              {isNum(b) ? hrs(b) : "—"}
            </td>
            <td
              style={{
                ...DETAIL_NUM,
                color: T.ink,
                fontWeight: changed ? 700 : 400,
              }}
            >
              {isNum(a) ? hrs(a) : "—"}
            </td>
            <td style={DETAIL} colSpan={2} />
          </tr>
        );
      })}
      <tr>
        <td style={{ ...DETAIL, ...accent }} />
        <td
          colSpan={6}
          style={{ ...DETAIL, paddingBottom: 10, color: T.muted }}
        >
          {notes.map((n, i) => (
            <div key={i} style={{ marginTop: i ? 3 : 0 }}>
              {n}
            </div>
          ))}
        </td>
      </tr>
    </>
  );
}

function PlanTable({ rows }) {
  const [open, setOpen] = useState({});
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div
      style={{
        border: `1px solid ${T.line}`,
        borderRadius: 6,
        background: T.surface,
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}
      >
        <thead>
          <tr>
            <th style={{ ...TH, width: 74, borderTopLeftRadius: 6 }}>Group</th>
            <th style={TH}>Activity</th>
            <th style={{ ...TH, width: 100 }}>Status</th>
            <th style={{ ...TH, width: 84, textAlign: "right" }}>Before</th>
            <th style={{ ...TH, width: 84, textAlign: "right" }}>After</th>
            <th style={{ ...TH, width: 104 }}>Verdict</th>
            <th style={{ ...TH, width: 178, borderTopRightRadius: 6 }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const p = parse(r.summary);
            const rowKey = r.key || r.summary;
            const isOpen = Boolean(open[rowKey]);
            const b = r.before ? hrs(r.before.total) : null;
            const a = r.after ? hrs(r.after.total) : null;
            return (
              <React.Fragment key={rowKey}>
                <tr
                  className="cq-row"
                  data-open={isOpen}
                  onClick={() => toggle(rowKey)}
                  style={{ cursor: "pointer" }}
                >
                  <td
                    style={{
                      ...TD,
                      color: T.faint,
                      whiteSpace: "nowrap",
                      paddingLeft: 8,
                    }}
                  >
                    <button
                      className="cq-caret"
                      data-open={isOpen}
                      aria-expanded={isOpen}
                      aria-label="Details"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(rowKey);
                      }}
                    >
                      ▸
                    </button>
                    {r.key ? p.group.replace(/^Group\s*/i, "") : "new"}
                  </td>
                  <td style={TD}>
                    {r.key
                      ? p.name
                      : String(r.summary).replace(/\s*\|\s*/g, " | ")}
                  </td>
                  <td
                    style={{
                      ...TD,
                      fontSize: 12,
                      color: T.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.status || "—"}
                  </td>
                  <td style={{ ...NUM, color: b === null ? T.faint : T.body }}>
                    {b === null ? "—" : b}
                  </td>
                  <td style={{ ...NUM, fontWeight: 600 }}>
                    {a === null ? "—" : a}
                  </td>
                  <td
                    style={{
                      ...TD,
                      fontSize: 11,
                      color: T.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {String(r.verdict).replace(/\s*\(.*\)$/, "")}
                  </td>
                  <td style={{ ...TD, whiteSpace: "nowrap" }}>
                    <ActionLozenge row={r} />
                  </td>
                </tr>
                {isOpen ? <PlanDetailRows row={r} /> : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [issue, setIssue] = useState(null);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [mode, setMode] = useState(null); // "compare" | "plan"
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const ctx = await view.getContext();
        setIssue(ctx.extension.issue);
      } catch (e) {
        setError("Could not read the project context. Reload the page.");
      }
    })();
  }, []);

  const run = async () => {
    setBusy(true);
    setError(null);
    setData(null);
    setTab(0);
    try {
      const res = await invoke("compareQuotation", { issue });
      if (!res || res.ok !== true) {
        setError(
          (res && (res.message || res.reason)) ||
            "No newer quotation is available for this project.",
        );
      } else {
        setData(res);
        setMode("compare");
      }
    } catch (e) {
      setError("The comparison could not be completed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const plan = async () => {
    setBusy(true);
    setError(null);
    setPlanData(null);
    setTab(0);
    try {
      const res = await invoke("applyPlan", { issue });
      console.log("[plan] result:", res);
      if (!res || res.ok !== true) {
        setError(
          (res && (res.message || res.reason)) ||
            "The plan could not be built for this project.",
        );
      } else {
        setPlanData(res);
        setMode("plan");
      }
    } catch (e) {
      setError("The plan could not be built. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const dump = async () => {
    const res = await invoke("dumpStorage", { issue });
    console.log("[dump] storage:", res);
  };

  /* One tab strip serves both views. Compare returns `result`, plan returns
     `phases`; both are arrays of objects carrying a `.phase` label. */
  const showPlan = mode === "plan";
  const result = showPlan ? planData : data;
  const phases = (result && (showPlan ? result.phases : result.result)) || [];
  const active = phases[tab];

  return (
    <div
      style={{
        fontFamily: T.font,
        color: T.ink,
        background: T.canvas,
        minHeight: "100%",
        padding: "20px 16px 32px",
      }}
    >
      <style>{`
        .cq-row:hover { background: #F7F8F9; }
        .cq-row[data-open="true"] { background: #F1F2F4; }
        .cq-caret { appearance:none; border:0; background:transparent; cursor:pointer;
          color:${T.faint}; font-size:11px; line-height:1; width:20px; padding:0;
          margin-right:2px; transition:transform .12s ease; display:inline-block;
          transform:rotate(0deg); transform-origin:center; }
        .cq-caret[data-open="true"] { transform:rotate(90deg); color:${T.body}; }
        .cq-row:hover .cq-caret { color:${T.body}; }
        .cq-tab { appearance:none; border:0; background:transparent; cursor:pointer;
          font: inherit; font-size:13px; padding:7px 14px; border-radius:5px; color:${T.body}; }
        .cq-tab:hover { background:#EBECF0; }
        .cq-tab[data-on="true"] { background:${T.surface}; color:${T.ink};
          font-weight:600; box-shadow:0 1px 2px rgba(9,30,66,.16); }
        .cq-btn { appearance:none; border:0; cursor:pointer; font:inherit; font-size:13px;
          font-weight:600; color:#fff; background:${T.link}; padding:7px 16px; border-radius:5px; }
        .cq-btn:hover:enabled { background:${T.linkDark}; }
        .cq-btn:disabled { background:#DCDFE4; color:#8993A4; cursor:not-allowed; }
        .cq-sel { font: inherit; font-size:13px; color:${T.ink}; background:${T.surface};
          border:1px solid ${T.line}; border-radius:5px; padding:7px 10px; min-width:260px; }
        :focus-visible { outline:2px solid ${T.link}; outline-offset:2px; }
        @media (prefers-reduced-motion: reduce) { .cq-caret { transition:none; } }
      `}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Compare quotation
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted }}>
          Preview how this project's hours would change against a newer
          quotation. Nothing is written.
        </p>

        {/* toolbar */}
        <div
          style={{
            marginTop: 18,
            padding: 16,
            background: T.surface,
            border: `1px solid ${T.line}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: 12,
            }}
          >
            <div>
              <label
                htmlFor="rev"
                style={{
                  display: "block",
                  marginBottom: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  color: T.faint,
                }}
              >
                Compare against
              </label>
              <select id="rev" className="cq-sel" defaultValue="latest">
                <option value="latest">
                  {data ? data.newProduct : "Latest revision"} (preview data)
                </option>
              </select>
            </div>
            <button className="cq-btn" onClick={run} disabled={busy || !issue}>
              {busy && mode !== "plan" ? "Comparing…" : "Compare"}
            </button>
            <button
              className="cq-btn"
              onClick={dump}
              disabled={!issue}
              style={{ background: T.muted }}
              title="Print stored Create Phase data to the browser console"
            >
              Storage
            </button>
            <button
              className="cq-btn"
              onClick={plan}
              disabled={busy || !issue}
              style={{ background: T.muted }}
              title="Dry run — show what would be written. Nothing is changed."
            >
              {busy && mode === "plan" ? "Planning…" : "Plan"}
            </button>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: T.faint }}>
            Version selection arrives with the quotation system.
          </p>
        </div>

        {error ? (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              fontSize: 13,
              color: "#974F0C",
              background: "#FFF7D6",
              border: "1px solid #F5CD47",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        ) : null}

        {result ? (
          <div style={{ marginTop: 22 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: T.body }}>
              {showPlan ? "Plan for " : "Comparing "}
              <strong style={{ color: T.ink }}>{result.currentProduct}</strong>
              <span style={{ margin: "0 7px", color: T.faint }}>→</span>
              <strong style={{ color: T.ink }}>{result.newProduct}</strong>
            </p>

            {showPlan ? (
              <div
                style={{
                  margin: "0 0 14px",
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#216E4E",
                  background: "#DCFFF1",
                  border: "1px solid #7EE2B8",
                  borderRadius: 6,
                }}
              >
                Dry run — {result.writeCount} intended changes across all
                phases. Nothing has been written.
              </div>
            ) : null}

            <div
              style={{
                display: "inline-flex",
                gap: 3,
                padding: 3,
                background: "#EBECF0",
                borderRadius: 7,
                marginBottom: 16,
              }}
            >
              {phases.map((p, i) => (
                <button
                  key={p.phase}
                  className="cq-tab"
                  data-on={i === tab}
                  onClick={() => setTab(i)}
                >
                  {p.phase}
                </button>
              ))}
            </div>

            {active && showPlan ? (
              <div>
                <PlanSummary phases={[active]} />
                <PlanTable rows={active.rows} />
                <p style={{ margin: "8px 0 0", fontSize: 12, color: T.faint }}>
                  Select a row to see its before and after values and why that
                  action was chosen.
                </p>
              </div>
            ) : null}

            {active && !showPlan ? (
              <div>
                {active.verdicts && active.verdicts.length ? (
                  <>
                    <Chips verdicts={active.verdicts} />
                    <Table key={active.phase} verdicts={active.verdicts} />
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 12,
                        color: T.faint,
                      }}
                    >
                      Select a row to see its TDL, COO and DE hours.
                    </p>
                  </>
                ) : (
                  <div
                    style={{
                      padding: "28px 16px",
                      textAlign: "center",
                      fontSize: 13,
                      color: T.muted,
                      background: T.surface,
                      border: `1px solid ${T.line}`,
                      borderRadius: 6,
                    }}
                  >
                    No activity groups in this phase.
                  </div>
                )}
                <Added added={active.added} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
