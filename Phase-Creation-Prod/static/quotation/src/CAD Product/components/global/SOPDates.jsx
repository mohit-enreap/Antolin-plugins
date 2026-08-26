// components/SOPDates.jsx
import React from "react";

function SOPDates({ sopParams = {}, onChange }) {
  const { startDate = "", endDate = "" } = sopParams;

  return (
    <div className="card">
      <style>{`
        .date-input {
          width: 180px;
          height: 40px;
          font-size: 14px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #999;
        }

        .date-input:disabled {
          background-color: #f2f2f2;
          color: #666;
        }
      `}</style>

      <div style={{ display: "flex", gap: "16px" }}>
        {/* Start Date */}
        <div>
          <label>
            <b>Start Date</b>
          </label>
          <br />
          <input
            type="date"
            className="date-input"
            value={startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            disabled
          />
        </div>

        {/* SOP End Date */}
        <div>
          <label>
            <b>SOP End Date</b>
          </label>
          <br />
          <input type="date" className="date-input" value={endDate} disabled />
        </div>
      </div>
    </div>
  );
}

export default SOPDates;
