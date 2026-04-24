import React from "react";
import SectionCard from "../components/SectionCard.jsx";
import LineChartPanel from "../components/LineChartPanel.jsx";

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 18,
};
const thStyle = {
  border: "1px solid #334155",
  padding: "10px 12px",
  background: "#1e293b",
  color: "#a5b4fc",
  textAlign: "left",
};
const tdStyle = {
  border: "1px solid #334155",
  padding: "10px 12px",
  color: "#e2e8f0",
};

function ExperimentTable({ title, columns, rows }) {
  return (
    <div>
      <h3 style={{ marginBottom: 10, color: "#e5eefc" }}>{title}</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={thStyle}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((column) => (
                <td key={column} style={tdStyle}>{row[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ExperimentSection({ temperatureData, positionalComparison, diversityData, beginnerMode }) {
  const tempRows = temperatureData.map((point) => ({
    Temperature: point.temperature.toFixed(2),
    "Avg entropy": point.avgEntropy.toFixed(3),
    Sparsity: point.sparsity.toFixed(3),
    "Max weight": point.maxWeight.toFixed(3),
  }));

  const diversityRows = diversityData.map((point) => ({
    Heads: point.heads,
    "Avg similarity": point.averageSimilarity.toFixed(3),
    "Diversity score": point.diversity.toFixed(3),
  }));

  return (
    <SectionCard
      title="Experiment Mode"
      subtitle={
        beginnerMode
          ? "Run preset experiments to compare temperature, positional encoding, and head diversity."
          : "The experiment mode summarizes how attention behavior changes under key parameter sweeps."
      }
    >
      <div style={{ display: "grid", gap: 24 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <LineChartPanel
            title="Avg entropy vs temperature"
            traces={[
              {
                x: temperatureData.map((point) => point.temperature),
                y: temperatureData.map((point) => point.avgEntropy),
                type: "scatter",
                mode: "lines+markers",
                name: "Entropy",
                marker: { color: "#38bdf8" },
              },
            ]}
            xLabel="Temperature"
            yLabel="Entropy"
          />
          <LineChartPanel
            title="Sparsity vs temperature"
            traces={[
              {
                x: temperatureData.map((point) => point.temperature),
                y: temperatureData.map((point) => point.sparsity),
                type: "scatter",
                mode: "lines+markers",
                name: "Sparsity",
                marker: { color: "#a855f7" },
              },
            ]}
            xLabel="Temperature"
            yLabel="Sparsity"
          />
          <LineChartPanel
            title="Max attention vs temperature"
            traces={[
              {
                x: temperatureData.map((point) => point.temperature),
                y: temperatureData.map((point) => point.maxWeight),
                type: "scatter",
                mode: "lines+markers",
                name: "Max weight",
                marker: { color: "#22d3ee" },
              },
            ]}
            xLabel="Temperature"
            yLabel="Max weight"
          />
        </div>
        <ExperimentTable title="Temperature sweep" columns={["Temperature", "Avg entropy", "Sparsity", "Max weight"]} rows={tempRows} />
        <div style={{ color: "#cbd5e1", fontSize: 14 }}>
          Positional encoding comparison: average entropy with positional encoding is {positionalComparison.withPos.avgEntropy.toFixed(3)}, without is {positionalComparison.noPos.avgEntropy.toFixed(3)}.
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          <LineChartPanel
            title="Diversity vs heads"
            traces={[
              {
                x: diversityData.map((point) => point.heads),
                y: diversityData.map((point) => point.diversity),
                type: "scatter",
                mode: "lines+markers",
                name: "Diversity",
                marker: { color: "#f97316" },
              },
            ]}
            xLabel="Heads"
            yLabel="Diversity"
          />
          <ExperimentTable title="Head diversity" columns={["Heads", "Avg similarity", "Diversity score"]} rows={diversityRows} />
        </div>
      </div>
    </SectionCard>
  );
}
