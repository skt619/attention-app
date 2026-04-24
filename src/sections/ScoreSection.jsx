import React, { useEffect, useMemo, useState } from "react";
import SectionCard from "../components/SectionCard.jsx";
import HeatmapPanel from "../components/HeatmapPanel.jsx";
import MatrixTable from "../components/MatrixTable.jsx";
import { formatNum } from "../lib/tokenUtils.js";

export default function ScoreSection({ tokens, rawScores, Q, K, selectedToken, beginnerMode }) {
  const [selectedPair, setSelectedPair] = useState({ query: selectedToken, key: selectedToken });

  useEffect(() => {
    setSelectedPair((current) => ({
      query: Math.min(selectedToken, tokens.length - 1),
      key: Math.min(current.key, tokens.length - 1),
    }));
  }, [selectedToken, tokens.length]);

  useEffect(() => {
    setSelectedPair((current) => ({
      ...current,
      query: Math.min(selectedToken, tokens.length - 1),
    }));
  }, [selectedToken, tokens.length]);

  const selectedRow = rawScores[selectedToken] || [];
  const rowDetail = selectedRow
    .map((value, j) => `${tokens[selectedToken]} · ${tokens[j]} = ${formatNum(value)}`)
    .join("\n");

  const selectedQVector = Q[selectedPair.query] || [];
  const selectedKVector = K[selectedPair.key] || [];
  const pairTerms = selectedQVector.map((q, idx) => `${formatNum(q)}×${formatNum(selectedKVector[idx])}`);
  const dotProduct = selectedQVector.reduce((sum, q, idx) => sum + q * (selectedKVector[idx] ?? 0), 0);

  const handleHeatmapClick = (eventData) => {
    const point = eventData?.points?.[0];
    if (!point) return;
    const query = tokens.indexOf(point.y);
    const key = tokens.indexOf(point.x);
    if (query >= 0 && key >= 0) {
      setSelectedPair({ query, key });
    }
  };

  return (
    <SectionCard
      title="Raw Attention Scores"
      subtitle={
        beginnerMode
          ? "This matrix shows how much each query token matches each key token before scaling."
          : "S = QK^T. Each entry S_ij is the dot product between query i and key j."
      }
    >
      <div style={{ display: "grid", gap: 24 }}>
        <HeatmapPanel
          title="Raw scores S = QKᵀ"
          z={rawScores}
          xLabels={tokens}
          yLabels={tokens}
          valueLabel="score"
          selectedRow={selectedPair.query}
          selectedCol={selectedPair.key}
          onClick={handleHeatmapClick}
        />

        <MatrixTable
          title="Raw score table"
          tokens={tokens}
          matrix={rawScores}
          columnLabels={tokens}
          selectedRow={selectedPair.query}
          selectedCol={selectedPair.key}
          explanation="Rows are query tokens, columns are key tokens. Click a cell in the heatmap to inspect one score."
        />

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#cbd5e1", whiteSpace: "pre-wrap", fontSize: 14 }}>
            Selected row detail for <strong>{tokens[selectedToken]}</strong>:
            <br />
            {rowDetail}
          </div>
          <div style={{ color: "#e2e8f0", fontSize: 14 }}>
            Selected score for query <strong>{tokens[selectedPair.query]}</strong> and key <strong>{tokens[selectedPair.key]}</strong>:
            <br />
            S = q_i · k_j = {formatNum(dotProduct)}
          </div>
          <div style={{ color: "#cbd5e1", whiteSpace: "pre-wrap", fontSize: 14 }}>
            {pairTerms.length
              ? `Detailed dot product: ${pairTerms.join(" + ")}`
              : "Select a valid cell to inspect the dot-product terms."}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
