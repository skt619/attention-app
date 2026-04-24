import React from "react";
import SectionCard from "../components/SectionCard.jsx";
import TokenBlocks from "../components/TokenBlocks.jsx";

export default function InputSection({ tokenText, onTokenTextChange, tokens, selectedToken, onSelectToken, beginnerMode }) {
  return (
    <SectionCard
      title="Input Tokens"
      subtitle={
        beginnerMode
          ? "Type a comma-separated sentence and see each token become a vector for attention." 
          : "Input tokens are the starting units that are converted into embeddings and used by the attention mechanism."
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", color: "#cbd5e1", marginBottom: 8, fontWeight: 600 }}>
            Editable token sentence
          </label>
          <input
            value={tokenText}
            onChange={(e) => onTokenTextChange(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 14,
              padding: "12px 14px",
              border: "1px solid #334155",
              background: "#020617",
              color: "#e5eefc",
              fontSize: 14,
            }}
          />
          <div style={{ color: "#94a3b8", marginTop: 8 }}>
            Separate tokens with commas, e.g. "the, black, hole, is, massive".
          </div>
        </div>
        <div>
          <div style={{ color: "#cbd5e1", marginBottom: 10, fontWeight: 600 }}>Clickable tokens</div>
          <TokenBlocks tokens={tokens} selectedIndex={selectedToken} onSelect={onSelectToken} />
        </div>
      </div>
    </SectionCard>
  );
}
