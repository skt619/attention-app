import React from "react";
import SectionCard from "../components/SectionCard.jsx";
import HeatmapPanel from "../components/HeatmapPanel.jsx";

export default function MultiHeadSection({ tokens, headResults, headSimilarity, beginnerMode }) {
  return (
    <SectionCard
      title="Multi-Head Attention Comparison"
      subtitle={
        beginnerMode
          ? "Each head computes attention in a different subspace so the model can capture multiple relationships at once."
          : "Compare attention patterns for each head and how similar the head distributions are to each other."
      }
    >
      <div style={{ display: "grid", gap: 24 }}>
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {headResults.map((head, index) => {
            const topAttention = [];
            head.weights.forEach((row, i) => {
              row.forEach((value, j) => {
                topAttention.push({ i, j, value });
              });
            });
            topAttention.sort((a, b) => b.value - a.value);
            const top = topAttention.slice(0, 3);

            return (
              <div key={index} style={{ display: "grid", gap: 12 }}>
                <h3 style={{ margin: 0, color: "#e5eefc" }}>Head {index + 1}</h3>
                <HeatmapPanel
                  title={`Head ${index + 1} attention`}
                  z={head.weights}
                  xLabels={tokens}
                  yLabels={tokens}
                  valueLabel="weight"
                  expandable
                />
                <div style={{ color: "#cbd5e1", fontSize: 14 }}>
                  Entropy: <strong>{head.entropy.toFixed(3)}</strong>
                  <br />
                  Sparsity: <strong>{head.sparsity.toFixed(3)}</strong>
                </div>
                <div style={{ color: "#e2e8f0", fontSize: 14 }}>
                  Top attention pairs:
                  <ul style={{ margin: "8px 0 0 16px", padding: 0, listStyle: "disc" }}>
                    {top.map((item, rank) => (
                      <li key={`${item.i}-${item.j}`}>
                        {rank + 1}. {tokens[item.i]} → {tokens[item.j]} ({item.value.toFixed(3)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {headSimilarity?.length > 1 && (
          <HeatmapPanel
            title="Head similarity matrix"
            z={headSimilarity}
            xLabels={headResults.map((_, index) => `H${index + 1}`)}
            yLabels={headResults.map((_, index) => `H${index + 1}`)}
            valueLabel="similarity"
            expandable
          />
        )}
      </div>
    </SectionCard>
  );
}
