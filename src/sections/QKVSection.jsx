import React, { useState } from "react";
import SectionCard from "../components/SectionCard.jsx";
import MatrixTable from "../components/MatrixTable.jsx";

const optionButton = (active) => ({
  padding: "10px 16px",
  borderRadius: 14,
  border: active ? "1px solid #22d3ee" : "1px solid #334155",
  background: active ? "rgba(34,211,238,0.14)" : "rgba(15,23,42,0.8)",
  color: "#e5eefc",
  cursor: "pointer",
  fontWeight: 600,
});

export default function QKVSection({ tokens, inputX, Q, K, V, beginnerMode, selectedToken }) {
  const [view, setView] = useState("Q");
  const viewMap = { Q, K, V };
  return (
    <SectionCard
      title="Query, Key, Value Projections"
      subtitle={
        beginnerMode
          ? "The same input vectors are projected into Q, K, and V spaces so attention can compare and combine information."
          : "Q = X_input W_Q, K = X_input W_K, V = X_input W_V. Queries search, keys match, and values carry the information that attention mixes."
      }
    >
      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.keys(viewMap).map((label) => (
            <button type="button" key={label} onClick={() => setView(label)} style={optionButton(view === label)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          <MatrixTable
            title="Position-adjusted input X_input"
            tokens={tokens}
            matrix={inputX}
            explanation="This input matrix is used to compute Q, K, and V."
            selectedRow={selectedToken}
          />
          <MatrixTable
            title={`${view} matrix`}
            tokens={tokens}
            matrix={viewMap[view]}
            explanation={`Showing the ${view} projection for each token.`}
            selectedRow={selectedToken}
          />
        </div>
        <div style={{ color: "#cbd5e1" }}>
          {selectedToken != null && (
            <div>
              Selected token <strong>{tokens[selectedToken]}</strong> has query, key, and value vectors shown above in the current view.
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
