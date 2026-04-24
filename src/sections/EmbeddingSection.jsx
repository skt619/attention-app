import React from "react";
import SectionCard from "../components/SectionCard.jsx";
import MatrixTable from "../components/MatrixTable.jsx";

export default function EmbeddingSection({ tokens, embed, inputX, usePositional, selectedToken, beginnerMode }) {
  return (
    <SectionCard
      title="Input Embeddings"
      subtitle={
        beginnerMode
          ? "Each token starts as a raw embedding vector. When enabled, position encoding changes the input so attention knows the order of words."
          : "X is the base embedding matrix. X_input = X + PE when positional encoding is enabled, otherwise X_input = X."
      }
    >
      <div style={{ display: "grid", gap: 24 }}>
        <MatrixTable
          title="Base embedding matrix X"
          tokens={tokens}
          matrix={embed}
          selectedRow={selectedToken}
          explanation="Each token row is the raw vector representation before positional encoding."
        />
        <MatrixTable
          title={usePositional ? "Position-adjusted input X_input" : "Input matrix X_input (same as X)"}
          tokens={tokens}
          matrix={inputX}
          selectedRow={selectedToken}
          explanation={
            usePositional
              ? "X_input is X plus positional encoding. Q/K/V are computed from this position-aware input."
              : "Positional encoding is disabled, so X_input is the same as X."
          }
        />
      </div>
    </SectionCard>
  );
}
