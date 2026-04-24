import React from "react";
import SectionCard from "../components/SectionCard.jsx";
import HeatmapPanel from "../components/HeatmapPanel.jsx";

export default function PositionalSection({ tokens, embeddingWithPos, positionalEncoding, positionalComparison, beginnerMode }) {
  return (
    <SectionCard
      title="Positional Encoding"
      subtitle={
        beginnerMode
          ? "Position information is added to embeddings so attention knows the order of tokens."
          : "Positional encoding injects sequence position into the embeddings so self-attention can distinguish token order."
      }
    >
      <div style={{ display: "grid", gap: 24 }}>
        <HeatmapPanel
          title="Positional encoding matrix"
          z={positionalEncoding}
          xLabels={Array.from({ length: embeddingWithPos[0]?.length || 0 }, (_, i) => `d${i}`)}
          yLabels={tokens.map((token, index) => `pos ${index}`)}
          valueLabel="encoding"
        />
        <div style={{ color: "#cbd5e1", fontSize: 14, whiteSpace: "pre-wrap" }}>
          With positional encoding: average entropy {positionalComparison.withPos.avgEntropy.toFixed(3)}, strongest pair {positionalComparison.withPos.strongest.query} → {positionalComparison.withPos.strongest.key}.
          <br />
          Without positional encoding: average entropy {positionalComparison.noPos.avgEntropy.toFixed(3)}, strongest pair {positionalComparison.noPos.strongest.query} → {positionalComparison.noPos.strongest.key}.
        </div>
      </div>
    </SectionCard>
  );
}
