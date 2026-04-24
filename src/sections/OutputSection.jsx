import React, { useMemo } from "react";
import SectionCard from "../components/SectionCard.jsx";
import MatrixTable from "../components/MatrixTable.jsx";
import BarChartPanel from "../components/BarChartPanel.jsx";
import { formatNum } from "../lib/tokenUtils.js";

export default function OutputSection({ tokens, weights, V, output, selectedToken, beginnerMode }) {
  const contributions = useMemo(
    () =>
      V.map((vRow, j) => {
        const weight = weights[selectedToken][j];
        const scaledVector = vRow.map((value) => value * weight);
        const norm = Math.sqrt(scaledVector.reduce((sum, value) => sum + value * value, 0));
        return {
          token: tokens[j],
          weight,
          norm,
        };
      }),
    [V, weights, selectedToken, tokens]
  );

  return (
    <SectionCard
      title="Attention Output"
      subtitle={
        beginnerMode
          ? "Each token output is the weighted sum of value vectors using attention weights."
          : "O = A V. Each output vector o_i is a sum of the value vectors weighted by attention from query token i."
      }
    >
      <div style={{ display: "grid", gap: 24 }}>
        <MatrixTable
          title="Values V"
          tokens={tokens}
          matrix={V}
          explanation="Value vectors are combined by attention weights to create the output."
        />
        <MatrixTable
          title="Output O = A V"
          tokens={tokens}
          matrix={output}
          selectedRow={selectedToken}
          explanation="Each output row is the weighted sum for one query token."
        />
        <div style={{ color: "#cbd5e1", fontSize: 14 }}>
          The selected output for <strong>{tokens[selectedToken]}</strong> uses:
          <br />
          o_i = sum_j A_ij v_j
        </div>
        <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid #334155", background: "rgba(15,23,42,0.85)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 340 }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 14px", borderBottom: "1px solid #334155", color: "#a5b4fc" }}>Source token</th>
                <th style={{ padding: "10px 14px", borderBottom: "1px solid #334155", color: "#a5b4fc" }}>Attention weight</th>
                <th style={{ padding: "10px 14px", borderBottom: "1px solid #334155", color: "#a5b4fc" }}>Contribution norm</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((item) => (
                <tr key={item.token} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>{item.token}</td>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>{formatNum(item.weight)}</td>
                  <td style={{ padding: "10px 14px", color: "#e2e8f0" }}>{formatNum(item.norm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <BarChartPanel
          title={`Weighted contribution magnitudes for ${tokens[selectedToken]}`}
          x={contributions.map((item) => item.token)}
          y={contributions.map((item) => item.norm)}
          xLabel="Source token"
          yLabel="Contribution norm"
        />
      </div>
    </SectionCard>
  );
}
