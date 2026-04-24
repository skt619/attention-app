import React from "react";

export default function ResearchSummary({ summary }) {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.85)",
        border: "1px solid #334155",
        borderRadius: 18,
        padding: 24,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Research summary</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.7, marginBottom: 24 }}>
        {summary}
      </p>
    </div>
  );
}
