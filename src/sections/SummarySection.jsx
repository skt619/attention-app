import React from "react";
import SectionCard from "../components/SectionCard.jsx";

export default function SummarySection({ summary, beginnerMode }) {
  return (
    <SectionCard
      title="Research Summary"
      subtitle={
        beginnerMode
          ? "A concise overview of the current attention experiment."
          : "A report-ready summary of the input configuration, attention metrics, and key results."
      }
    >
      <p style={{ color: "#cbd5e1", lineHeight: 1.8, margin: 0 }}>{summary}</p>
    </SectionCard>
  );
}
