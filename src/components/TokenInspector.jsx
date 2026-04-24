import React, { useMemo } from "react";
import MatrixTable from "./MatrixTable.jsx";
import BarChartPanel from "./BarChartPanel.jsx";
import { formatNum } from "../lib/tokenUtils.js";

const panelStyle = {
  background: "rgba(15,23,42,0.85)",
  border: "1px solid #334155",
  borderRadius: 18,
  padding: 20,
};

export default function TokenInspector({ selectedIndex, tokens, data, temperature, causalMask }) {
  const rawRow = data.attention.rawScores[selectedIndex] || [];
  const scaledRow = data.attention.scaledScores[selectedIndex] || [];
  const probabilityRow = data.attention.weights[selectedIndex] || [];
  const outputVector = data.attention.output[selectedIndex] || [];

  const contributions = useMemo(
    () =>
      data.V.map((valueVector, j) => {
        const weight = probabilityRow[j] ?? 0;
        const norm = Math.sqrt(valueVector.reduce((sum, v) => sum + v * v, 0));
        return {
          token: tokens[j],
          index: j,
          weight,
          norm,
          contribution: weight * norm,
        };
      }),
    [data.V, probabilityRow, tokens]
  );

  const topAttended = useMemo(
    () =>
      contributions
        .slice()
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5),
    [contributions]
  );

  return (
    <div style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>Selected token inspection</h3>
      <div style={{ color: "#cbd5e1", marginBottom: 16 }}>
        Track how <strong>{tokens[selectedIndex]}</strong> moves through attention, scores, and output.
      </div>

      <div style={{ display: "grid", gap: 18, marginBottom: 18 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid #334155", borderRadius: 16, padding: 14 }}>
            <div style={{ color: "#94a3b8", marginBottom: 8 }}>Current token</div>
            <div style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.7 }}>
              <strong>{tokens[selectedIndex]}</strong>
              <br />Index: {selectedIndex}
              <br />Temperature: {temperature.toFixed(3)}
              <br />Masking: {causalMask ? "Causal" : "None"}
            </div>
          </div>
          <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid #334155", borderRadius: 16, padding: 14 }}>
            <div style={{ color: "#94a3b8", marginBottom: 8 }}>Top attended tokens</div>
            {topAttended.map((item, rank) => (
              <div key={item.token} style={{ color: "#e2e8f0", fontSize: 14, marginBottom: 6 }}>
                <strong>{rank + 1}.</strong> {item.token} — {formatNum(item.weight)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <MatrixTable
            title="Raw score row"
            tokens={[tokens[selectedIndex]]}
            matrix={[rawRow]}
            columnLabels={tokens}
          />
          <MatrixTable
            title="Scaled score row"
            tokens={[tokens[selectedIndex]]}
            matrix={[scaledRow]}
            columnLabels={tokens}
          />
          <MatrixTable
            title="Softmax probability row"
            tokens={[tokens[selectedIndex]]}
            matrix={[probabilityRow]}
            columnLabels={tokens}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <MatrixTable
            title="Query vector"
            tokens={[tokens[selectedIndex]]}
            matrix={[data.Q[selectedIndex]]}
          />
          <MatrixTable
            title="Key vector"
            tokens={[tokens[selectedIndex]]}
            matrix={[data.K[selectedIndex]]}
          />
          <MatrixTable
            title="Value vector"
            tokens={[tokens[selectedIndex]]}
            matrix={[data.V[selectedIndex]]}
          />
        </div>

        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr" }}>
          <MatrixTable
            title="Selected output vector"
            tokens={[tokens[selectedIndex]]}
            matrix={[outputVector]}
          />
          <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid #334155", borderRadius: 16, padding: 16 }}>
            <div style={{ color: "#94a3b8", marginBottom: 8 }}>Contribution metric</div>
            <div style={{ color: "#cbd5e1", fontSize: 14, marginBottom: 12 }}>
              Each bar shows token attention strength weighted by the value vector norm: weight × ‖v_j‖.
            </div>
            <BarChartPanel
              title="Output contribution norm"
              x={contributions.map((item) => item.token)}
              y={contributions.map((item) => item.contribution)}
              xLabel="Source token"
              yLabel="Contribution"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
