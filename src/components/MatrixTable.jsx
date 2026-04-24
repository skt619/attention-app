import React from "react";
import { tableFromMatrix, formatNum } from "../lib/tokenUtils.js";

const baseStyle = {
  background: "rgba(15,23,42,0.85)",
  border: "1px solid #334155",
  borderRadius: 18,
  padding: 20,
};

const thStyle = {
  padding: "10px 14px",
  textAlign: "left",
  color: "#a5b4fc",
  borderBottom: "1px solid #334155",
};

const tdStyle = {
  padding: "10px 14px",
  color: "#e2e8f0",
  borderBottom: "1px solid #1e293b",
  whiteSpace: "nowrap",
};

export default function MatrixTable({ title, tokens, matrix, explanation, columnLabels, selectedRow, selectedCol }) {
  const rows = tableFromMatrix(tokens, matrix, formatNum, columnLabels);
  const headers = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div style={baseStyle}>
      <h3 style={{ marginTop: 0, marginBottom: 14 }}>{title}</h3>
      {explanation && (
        <div style={{ marginBottom: 12, color: "#cbd5e1", fontSize: 14 }}>
          {explanation}
        </div>
      )}
      <div style={{ overflow: "auto", borderRadius: 14 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr>
              {headers.map((header, headerIndex) => {
                const isSelectedHeader = selectedCol !== undefined && headerIndex === selectedCol + 1;
                return (
                  <th
                    key={header}
                    style={isSelectedHeader ? { ...thStyle, background: "rgba(34,211,238,0.12)" } : thStyle}
                  >
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={selectedRow === rowIndex ? { background: "rgba(34,211,238,0.12)" } : {}}
              >
                {headers.map((header, headerIndex) => {
                  const isSelectedCell = selectedCol !== undefined && headerIndex === selectedCol + 1;
                  return (
                    <td
                      key={header}
                      style={
                        isSelectedCell
                          ? { ...tdStyle, background: "rgba(34,211,238,0.08)" }
                          : tdStyle
                      }
                    >
                      {row[header]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
