import React, { useEffect, useState } from "react";
import SectionCard from "../components/SectionCard.jsx";
import HeatmapPanel from "../components/HeatmapPanel.jsx";
import MatrixTable from "../components/MatrixTable.jsx";

const optionStyle = (active) => ({
  padding: "10px 16px",
  borderRadius: 14,
  border: active ? "1px solid #22d3ee" : "1px solid #334155",
  background: active ? "rgba(34,211,238,0.14)" : "rgba(15,23,42,0.8)",
  color: "#e5eefc",
  cursor: "pointer",
  fontWeight: 600,
});

export default function ScaledScoreSection({ tokens, rawScores, scaledScores, Q, K, selectedToken, beginnerMode }) {
  const [view, setView] = useState("both");
  const [selectedPair, setSelectedPair] = useState({ query: selectedToken, key: selectedToken });

  useEffect(() => {
    setSelectedPair((current) => ({
      query: Math.min(selectedToken, tokens.length - 1),
      key: Math.min(current.key, tokens.length - 1),
    }));
  }, [selectedToken, tokens.length]);

  const handleHeatmapClick = (eventData) => {
    const point = eventData?.points?.[0];
    if (!point) return;
    const query = tokens.indexOf(point.y);
    const key = tokens.indexOf(point.x);
    if (query >= 0 && key >= 0) {
      setSelectedPair({ query, key });
    }
  };

  const selectedQVector = Q[selectedPair.query] || [];
  const selectedKVector = K[selectedPair.key] || [];
  const dotProduct = selectedQVector.reduce((sum, q, idx) => sum + q * (selectedKVector[idx] ?? 0), 0);
  const dotTerms = selectedQVector.map((q, idx) => `${q.toFixed(3)}×${(selectedKVector[idx] ?? 0).toFixed(3)}`);

  return (
    <SectionCard
      title="Scaled Attention Scores"
      subtitle={
        beginnerMode
          ? "Scaling shrinks raw dot products so softmax produces stable attention."
          : "S_tilde = QK^T / √d_k. Scaling prevents large dot products from producing extreme softmax distributions."
      }
    >
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setView("raw")} style={optionStyle(view === "raw")}>Raw only</button>
          <button type="button" onClick={() => setView("scaled")} style={optionStyle(view === "scaled")}>Scaled only</button>
          <button type="button" onClick={() => setView("both")} style={optionStyle(view === "both")}>Compare</button>
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          {(view === "raw" || view === "both") && (
            <div style={{ display: "grid", gap: 16 }}>
              <HeatmapPanel
                title="Raw scores S = QKᵀ"
                z={rawScores}
                xLabels={tokens}
                yLabels={tokens}
                valueLabel="score"
                selectedRow={selectedPair.query}
                selectedCol={selectedPair.key}
                onClick={handleHeatmapClick}
                expandable
              />
              <MatrixTable
                title="Raw score matrix"
                tokens={tokens}
                matrix={rawScores}
                columnLabels={tokens}
                selectedRow={selectedPair.query}
                selectedCol={selectedPair.key}
                explanation="Each raw score is the dot product between a query and a key vector. Click a cell above to inspect it."
              />
            </div>
          )}

          {(view === "scaled" || view === "both") && (
            <div style={{ display: "grid", gap: 16 }}>
              <HeatmapPanel
                title="Scaled scores S_tilde = QKᵀ / √d_k"
                z={scaledScores}
                xLabels={tokens}
                yLabels={tokens}
                valueLabel="scaled"
                selectedRow={selectedPair.query}
                selectedCol={selectedPair.key}
                onClick={handleHeatmapClick}
                expandable
              />
              <MatrixTable
                title="Scaled score matrix"
                tokens={tokens}
                matrix={scaledScores}
                columnLabels={tokens}
                selectedRow={selectedPair.query}
                selectedCol={selectedPair.key}
                explanation="These values are used to compute softmax attention weights. Click a cell above to inspect it."
              />
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 10, color: "#cbd5e1", fontSize: 14 }}>
          <div>
            Selected cell: query <strong>{tokens[selectedPair.query]}</strong> and key <strong>{tokens[selectedPair.key]}</strong>.
          </div>
          <div>
            Dot product: S = q_i · k_j = {dotProduct.toFixed(3)}
          </div>
          <div style={{ whiteSpace: "pre-wrap" }}>
            {dotTerms.length
              ? `Expanded dot product: ${dotTerms.join(" + ")}`
              : "Select a valid cell to inspect the raw dot-product terms."}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
