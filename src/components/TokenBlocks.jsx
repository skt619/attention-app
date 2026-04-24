import React from "react";

export default function TokenBlocks({ tokens, selectedIndex, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
      {tokens.map((token, index) => (
        <button
          key={`${token}-${index}`}
          onClick={() => onSelect(index)}
          style={{
            padding: "10px 16px",
            borderRadius: 14,
            border: selectedIndex === index ? "2px solid #22d3ee" : "1px solid #334155",
            background: selectedIndex === index ? "rgba(34,211,238,0.14)" : "rgba(15,23,42,0.8)",
            color: "#e5eefc",
            cursor: "pointer",
            minWidth: 80,
            textAlign: "left",
            fontWeight: 600,
          }}
        >
          <div style={{ fontSize: 14 }}>{token}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>idx {index}</div>
        </button>
      ))}
    </div>
  );
}
