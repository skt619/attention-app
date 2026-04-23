import React, { useEffect, useMemo, useRef, useState } from "react";
import Plotly from "plotly.js-dist-min";

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0) || 1;
}

function randn(rand) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function softmaxRow(row, temperature = 1) {
  const scaled = row.map((v) => v / Math.max(temperature, 1e-8));
  const maxVal = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - maxVal));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sumExp);
}

function matmul(A, B) {
  const rows = A.length;
  const cols = B[0].length;
  const inner = B.length;
  const out = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) {
        sum += A[i][k] * B[k][j];
      }
      out[i][j] = sum;
    }
  }
  return out;
}

function transpose(A) {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

function addMatrices(A, B) {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

function scaleMatrix(A, s) {
  return A.map((row) => row.map((v) => v * s));
}

function formatNum(x) {
  return Number.parseFloat(x).toFixed(4);
}

function makeTokenEmbeddings(tokens, dModel, seedOffset = 42) {
  return tokens.map((tok) => {
    const rand = mulberry32(hashString(tok) + seedOffset);
    return Array.from({ length: dModel }, () => randn(rand));
  });
}

function positionalEncoding(seqLen, dModel) {
  const pe = Array.from({ length: seqLen }, () => Array(dModel).fill(0));
  for (let pos = 0; pos < seqLen; pos++) {
    for (let i = 0; i < dModel; i += 2) {
      const divTerm = Math.exp((-Math.log(10000.0) * i) / dModel);
      pe[pos][i] = Math.sin(pos * divTerm);
      if (i + 1 < dModel) pe[pos][i + 1] = Math.cos(pos * divTerm);
    }
  }
  return pe;
}

function projectQKV(X, dModel, seed = 3) {
  const rand = mulberry32(seed);

  const initW = () =>
    Array.from({ length: dModel }, () =>
      Array.from({ length: dModel }, () => randn(rand) / Math.sqrt(dModel))
    );

  const Wq = initW();
  const Wk = initW();
  const Wv = initW();

  return {
    Q: matmul(X, Wq),
    K: matmul(X, Wk),
    V: matmul(X, Wv),
  };
}

function attention(Q, K, V, temperature = 1, scale = true) {
  const dK = Q[0].length;
  let scores = matmul(Q, transpose(K));
  if (scale) {
    scores = scaleMatrix(scores, 1 / Math.sqrt(dK));
  }
  const weights = scores.map((row) => softmaxRow(row, temperature));
  const output = matmul(weights, V);
  return { scores, weights, output };
}

function splitHeads(X, numHeads) {
  const n = X.length;
  const dModel = X[0].length;
  const headDim = dModel / numHeads;
  const heads = [];

  for (let h = 0; h < numHeads; h++) {
    heads.push(
      Array.from({ length: n }, (_, i) =>
        X[i].slice(h * headDim, (h + 1) * headDim)
      )
    );
  }
  return heads;
}

function tableFromMatrix(tokens, M) {
  return tokens.map((t, i) => ({
    token: t,
    ...Object.fromEntries(M[i].map((v, j) => [`d${j}`, formatNum(v)])),
  }));
}

function PlotCanvas({ data, layout, config, style }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    Plotly.newPlot(
      el,
      data,
      {
        ...layout,
        autosize: true,
      },
      {
        responsive: true,
        displayModeBar: false,
        ...config,
      }
    );

    const resize = () => {
      if (el) Plotly.Plots.resize(el);
    };

    const ro = new ResizeObserver(() => {
      resize();
    });

    ro.observe(el);
    window.addEventListener("resize", resize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resize);
      if (el) Plotly.purge(el);
    };
  }, [data, layout, config]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        minWidth: 0,
        ...style,
      }}
    />
  );
}

function Heatmap({ z, xLabels, yLabels, title, valueLabel = "value" }) {
  const text = z.map((row, i) =>
    row.map(
      (v, j) =>
        `row: ${yLabels[i]}<br>col: ${xLabels[j]}<br>${valueLabel}: ${formatNum(v)}`
    )
  );

  return (
    <PlotCanvas
      data={[
        {
          z,
          x: xLabels,
          y: yLabels,
          type: "heatmap",
          colorscale: "Blues",
          text,
          hovertemplate: "%{text}<extra></extra>",
          showscale: true,
        },
      ]}
      layout={{
        title: { text: title, font: { size: 18, color: "#e5eefc" } },
        margin: { l: 60, r: 20, t: 50, b: 50 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#e5eefc" },
        xaxis: { side: "bottom", automargin: true },
        yaxis: { autorange: "reversed", automargin: true },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={plotStyle}
    />
  );
}

function LinePlot({ data, layout }) {
  return (
    <PlotCanvas
      data={data}
      layout={{
        ...layout,
        autosize: true,
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={plotStyle}
    />
  );
}

function MatrixTable({ title, tokens, matrix }) {
  const rows = tableFromMatrix(tokens, matrix);
  const headers = Object.keys(rows[0] || {});

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>{title}</h3>
      <div
        style={{
          overflow: "auto",
          border: "1px solid #334155",
          borderRadius: 12,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead style={{ background: "#1e293b" }}>
            <tr>
              {headers.map((h) => (
                <th key={h} style={thtd}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderTop: "1px solid #1e293b" }}>
                {headers.map((h) => (
                  <td key={h} style={thtd}>
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ ...cardStyle, padding: 18 }}>
      <div style={{ color: "#cbd5e1", marginBottom: 8, fontSize: 14 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderRadius: 14,
        border: active ? "1px solid #22d3ee" : "1px solid #334155",
        background: active
          ? "rgba(34,211,238,0.12)"
          : "rgba(15,23,42,0.75)",
        color: "#e5eefc",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

function StepItem({ title, index, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 12,
        border: active ? "1px solid #22d3ee" : "1px solid #334155",
        background: active ? "rgba(34,211,238,0.12)" : "#0f172a",
        color: "#e5eefc",
        cursor: "pointer",
        marginBottom: 8,
        fontSize: 14,
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
        Step {index + 1}
      </div>
      <div style={{ fontWeight: 600 }}>{title}</div>
    </button>
  );
}

function StepDetails({ step }) {
  if (!step) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 14,
        borderRadius: 14,
        border: "1px solid #334155",
        background: "rgba(2,6,23,0.9)",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
        {step.title}
      </div>

      <div
        style={{
          color: "#a5f3fc",
          fontFamily: "monospace",
          fontSize: 14,
          whiteSpace: "pre-wrap",
          marginBottom: 10,
        }}
      >
        {step.formula}
      </div>

      <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6 }}>
        {step.explanation}
      </div>
    </div>
  );
}

function SidebarSectionButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: active ? "1px solid #22d3ee" : "1px solid #334155",
        background: active ? "rgba(34,211,238,0.12)" : "rgba(15,23,42,0.75)",
        color: "#e5eefc",
        cursor: "pointer",
        fontWeight: 600,
        marginBottom: 8,
      }}
    >
      {label}
    </button>
  );
}

const cardStyle = {
  background: "rgba(15,23,42,0.75)",
  border: "1px solid #334155",
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  minWidth: 0,
};

const thtd = {
  padding: "10px 12px",
  textAlign: "left",
  color: "#e2e8f0",
  whiteSpace: "nowrap",
};

const inputStyle = {
  width: "100%",
  marginTop: 8,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#020617",
  color: "#e2e8f0",
  fontSize: 14,
};

const smallText = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: 6,
};

const collapsedButtonStyle = {
  width: "100%",
  padding: "12px 0",
  borderRadius: 12,
  border: "1px solid #334155",
  background: "rgba(15,23,42,0.75)",
  color: "#e5eefc",
  cursor: "pointer",
  fontSize: 20,
};

const responsiveTwoColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 520px), 1fr))",
  gap: 24,
  alignItems: "start",
};

const responsiveThreeColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
  gap: 24,
  alignItems: "start",
};

const responsiveStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
};

const plotStyle = {
  width: "100%",
  minWidth: 0,
  height: "clamp(380px, 34vw, 560px)",
};

const mathSteps = [
  {
    title: "Token embeddings",
    formula: "X ∈ R^(n × d_model)",
    explanation:
      "Each token is converted into a vector of length d_model. In this app these embeddings are deterministic toy vectors, so the same token always gets the same starting representation.",
  },
  {
    title: "Add positional encoding",
    formula:
      "X_input = X + PE\n\nPE(pos, 2i) = sin(pos / 10000^(2i/d_model))\nPE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))",
    explanation:
      "Attention alone does not know word order. Positional encoding adds order information so the model can distinguish early and late tokens in the sequence.",
  },
  {
    title: "Project to Q, K, and V",
    formula: "Q = X_input W_Q\nK = X_input W_K\nV = X_input W_V",
    explanation:
      "The same input vectors are projected into three different spaces. Queries ask what to look for, keys describe what each token offers, and values hold the information to be combined.",
  },
  {
    title: "Compute similarity scores",
    formula: "S = QK^T",
    explanation:
      "Each entry S(i, j) measures how strongly token i matches token j before normalization. Bigger values mean stronger raw compatibility.",
  },
  {
    title: "Scale the scores",
    formula: "S_scaled = QK^T / sqrt(d_k)",
    explanation:
      "When d_k is large, dot products can become too large in magnitude. Dividing by sqrt(d_k) stabilizes the scores so softmax does not become too extreme.",
  },
  {
    title: "Apply softmax temperature",
    formula: "A = softmax(S_scaled / T)",
    explanation:
      "Softmax converts each row into a probability distribution. Lower temperature makes the distribution sharper. Higher temperature makes it smoother and more spread out.",
  },
  {
    title: "Compute attention output",
    formula: "Output = A V",
    explanation:
      "The attention weights tell each token how much information to collect from every other token. Multiplying by V creates the final context-aware output vectors.",
  },
  {
    title: "Multi-head attention",
    formula:
      "head_h = Attention(Q_h, K_h, V_h)\nMultiHead = Concat(head_1, ..., head_H)",
    explanation:
      "Multiple heads let the model attend in different representation subspaces. Different heads can capture different relationships among the same tokens.",
  },
];

export default function App() {
  const [tokenText, setTokenText] = useState("the, black, hole, is, massive");
  const [dModel, setDModel] = useState(8);
  const [temperature, setTemperature] = useState(1.0);
  const [usePositional, setUsePositional] = useState(true);
  const [numHeads, setNumHeads] = useState(2);
  const [activeTab, setActiveTab] = useState("qkv");
  const [activeStep, setActiveStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSection, setSidebarSection] = useState("controls");

  const tokens = useMemo(
    () =>
      tokenText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tokenText]
  );

  const data = useMemo(() => {
    if (tokens.length < 2 || dModel % numHeads !== 0) return null;

    const embed = makeTokenEmbeddings(tokens, dModel);
    const pe = positionalEncoding(tokens.length, dModel);
    const X = usePositional ? addMatrices(embed, pe) : embed;

    const { Q, K, V } = projectQKV(X, dModel, 7);
    const scaled = attention(Q, K, V, temperature, true);
    const unscaled = attention(Q, K, V, temperature, false);

    const qHeads = splitHeads(Q, numHeads);
    const kHeads = splitHeads(K, numHeads);
    const vHeads = splitHeads(V, numHeads);

    const headResults = qHeads.map((qh, i) =>
      attention(qh, kHeads[i], vHeads[i], temperature, true)
    );

    const rowSums = scaled.weights.map((row) =>
      row.reduce((acc, val) => acc + val, 0)
    );

    return { embed, pe, X, Q, K, V, scaled, unscaled, headResults, rowSums };
  }, [tokens, dModel, numHeads, temperature, usePositional]);

  if (!data) {
    return (
      <div style={{ color: "white", padding: 30 }}>
        Please enter at least two tokens and keep d_model divisible by number
        of heads.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #0f172a, #020617 55%)",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div
          style={{
            width: sidebarOpen ? 340 : 82,
            transition: "width 0.25s ease",
            borderRight: "1px solid #334155",
            background: "rgba(2,6,23,0.92)",
            padding: 16,
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: sidebarOpen ? "space-between" : "center",
              alignItems: "center",
              marginBottom: 16,
              gap: 8,
            }}
          >
            {sidebarOpen && (
              <div style={{ fontWeight: 700, fontSize: 18 }}>Sidebar</div>
            )}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #334155",
                background: "rgba(15,23,42,0.75)",
                color: "#e5eefc",
                cursor: "pointer",
                fontWeight: 700,
                width: sidebarOpen ? "auto" : "100%",
              }}
            >
              {sidebarOpen ? "←" : "→"}
            </button>
          </div>

          {sidebarOpen ? (
            <>
              <SidebarSectionButton
                label="⚙️ Controls"
                active={sidebarSection === "controls"}
                onClick={() => setSidebarSection("controls")}
              />
              <SidebarSectionButton
                label="📘 Math Steps"
                active={sidebarSection === "math"}
                onClick={() => setSidebarSection("math")}
              />

              <div style={{ marginTop: 16 }}>
                {sidebarSection === "controls" && (
                  <div style={cardStyle}>
                    <h2
                      style={{
                        marginTop: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span>⚙️</span> Controls
                    </h2>

                    <div style={{ marginBottom: 20 }}>
                      <label>Tokens</label>
                      <input
                        value={tokenText}
                        onChange={(e) => setTokenText(e.target.value)}
                        style={inputStyle}
                      />
                      <div style={smallText}>Comma-separated input sequence.</div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label>Embedding dimension (d_model)</label>
                      <select
                        value={dModel}
                        onChange={(e) => setDModel(Number(e.target.value))}
                        style={inputStyle}
                      >
                        <option value={4}>4</option>
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={16}>16</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{ display: "flex", justifyContent: "space-between" }}
                      >
                        <label>Softmax temperature</label>
                        <span style={{ color: "#67e8f9" }}>
                          {temperature.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="3"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        style={{ width: "100%" }}
                      />
                      <div style={smallText}>
                        Lower = sharper attention. Higher = smoother.
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label>Number of heads</label>
                      <select
                        value={numHeads}
                        onChange={(e) => setNumHeads(Number(e.target.value))}
                        style={inputStyle}
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={4}>4</option>
                      </select>
                    </div>

                    <div style={{ ...cardStyle, padding: 14, borderRadius: 14 }}>
                      <label
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <input
                          type="checkbox"
                          checked={usePositional}
                          onChange={(e) => setUsePositional(e.target.checked)}
                        />
                        Add positional encoding
                      </label>
                      <div style={smallText}>
                        Inject order information into embeddings.
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 20,
                        padding: 14,
                        borderRadius: 14,
                        background:
                          "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(168,85,247,0.08))",
                        border: "1px solid #334155",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: "#cbd5e1",
                          marginBottom: 8,
                        }}
                      >
                        Core formula
                      </div>
                      <div
                        style={{
                          color: "#a5f3fc",
                          fontFamily: "monospace",
                          fontSize: 14,
                        }}
                      >
                        Attention(Q, K, V) = softmax((QK^T) / sqrt(d_k)) V
                      </div>
                    </div>
                  </div>
                )}

                {sidebarSection === "math" && (
                  <div style={cardStyle}>
                    <h2 style={{ marginTop: 0, marginBottom: 16 }}>
                      <span>📘</span> Math Steps
                    </h2>

                    {mathSteps.map((step, idx) => (
                      <StepItem
                        key={idx}
                        title={step.title}
                        index={idx}
                        active={activeStep === idx}
                        onClick={() => setActiveStep(idx)}
                      />
                    ))}

                    <StepDetails step={mathSteps[activeStep]} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  setSidebarSection("controls");
                }}
                title="Controls"
                style={collapsedButtonStyle}
              >
                ⚙️
              </button>
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  setSidebarSection("math");
                }}
                title="Math Steps"
                style={collapsedButtonStyle}
              >
                📘
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: 32 }}>
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <span style={badge("#164e63", "#a5f3fc")}>Math for AI</span>
                <span style={badge("#3b0764", "#ddd6fe")}>
                  Interactive Visualization
                </span>
                <span style={badge("#064e3b", "#a7f3d0")}>
                  Attention Mechanism
                </span>
              </div>

              <h1 style={{ fontSize: 48, margin: 0 }}>Attention Visualizer</h1>
              <p
                style={{
                  color: "#cbd5e1",
                  maxWidth: 1000,
                  fontSize: 18,
                  lineHeight: 1.7,
                }}
              >
                Explore query, key, value projections, scaled dot-product
                attention, temperature effects, positional encoding, and
                multi-head behavior in a polished web application.
              </p>
            </div>

            <div
              style={{
                ...responsiveStatsGrid,
                marginTop: 24,
                marginBottom: 24,
              }}
            >
              <StatCard label="Tokens" value={tokens.length} />
              <StatCard label="d_model" value={dModel} />
              <StatCard label="Temperature" value={temperature.toFixed(2)} />
              <StatCard label="Heads" value={numHeads} />
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <TabButton
                label="Q/K/V"
                active={activeTab === "qkv"}
                onClick={() => setActiveTab("qkv")}
              />
              <TabButton
                label="Attention"
                active={activeTab === "attention"}
                onClick={() => setActiveTab("attention")}
              />
              <TabButton
                label="Temperature"
                active={activeTab === "temperature"}
                onClick={() => setActiveTab("temperature")}
              />
              <TabButton
                label="Positional"
                active={activeTab === "positional"}
                onClick={() => setActiveTab("positional")}
              />
              <TabButton
                label="Heads"
                active={activeTab === "heads"}
                onClick={() => setActiveTab("heads")}
              />
            </div>

            {activeTab === "qkv" && (
              <>
                <div style={responsiveTwoColGrid}>
                  <MatrixTable
                    title="Input Embeddings"
                    tokens={tokens}
                    matrix={data.X}
                  />
                  <MatrixTable
                    title="Queries (Q)"
                    tokens={tokens}
                    matrix={data.Q}
                  />
                  <MatrixTable
                    title="Keys (K)"
                    tokens={tokens}
                    matrix={data.K}
                  />
                  <MatrixTable
                    title="Values (V)"
                    tokens={tokens}
                    matrix={data.V}
                  />
                </div>

                <div style={{ marginTop: 24, ...cardStyle }}>
                  <Heatmap
                    z={matmul(data.Q, transpose(data.K))}
                    xLabels={tokens}
                    yLabels={tokens}
                    title="Similarity Matrix: QKᵀ"
                    valueLabel="score"
                  />
                </div>
              </>
            )}

            {activeTab === "attention" && (
              <>
                <div style={responsiveTwoColGrid}>
                  <div style={cardStyle}>
                    <Heatmap
                      z={data.unscaled.weights}
                      xLabels={tokens}
                      yLabels={tokens}
                      title="Without 1/√dₖ Scaling"
                      valueLabel="weight"
                    />
                  </div>

                  <div style={cardStyle}>
                    <Heatmap
                      z={data.scaled.weights}
                      xLabels={tokens}
                      yLabels={tokens}
                      title="With 1/√dₖ Scaling"
                      valueLabel="weight"
                    />
                  </div>
                </div>

                <div
                  style={{
                    ...responsiveTwoColGrid,
                    marginTop: 24,
                  }}
                >
                  <MatrixTable
                    title="Attention Output = A·V"
                    tokens={tokens}
                    matrix={data.scaled.output}
                  />
                  <div style={cardStyle}>
                    <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                      Row sums of attention weights
                    </h3>
                    <div style={{ lineHeight: 1.8, color: "#e2e8f0" }}>
                      {tokens.map((tok, i) => (
                        <div key={tok}>
                          <strong>{tok}</strong>: {formatNum(data.rowSums[i])}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "temperature" && (
              <div style={responsiveThreeColGrid}>
                {[0.5, 1.0, 2.0].map((t) => {
                  const att = attention(data.Q, data.K, data.V, t, true);
                  return (
                    <div key={t} style={cardStyle}>
                      <Heatmap
                        z={att.weights}
                        xLabels={tokens}
                        yLabels={tokens}
                        title={`Temperature = ${t.toFixed(1)}`}
                        valueLabel="weight"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "positional" && (
              <>
                <div style={cardStyle}>
                  <Heatmap
                    z={data.pe}
                    xLabels={Array.from({ length: dModel }, (_, i) => `d${i}`)}
                    yLabels={Array.from(
                      { length: tokens.length },
                      (_, i) => `pos ${i}`
                    )}
                    title="Sinusoidal Positional Encoding"
                    valueLabel="encoding"
                  />
                </div>

                <div style={{ ...cardStyle, marginTop: 24 }}>
                  <LinePlot
                    data={Array.from({ length: Math.min(4, dModel) }, (_, idx) => ({
                      x: Array.from({ length: tokens.length }, (_, i) => i),
                      y: data.pe.map((row) => row[idx]),
                      type: "scatter",
                      mode: "lines+markers",
                      name: `dim ${idx}`,
                      hovertemplate:
                        `position: %{x}<br>value: %{y:.4f}<extra>dim ${idx}</extra>`,
                    }))}
                    layout={{
                      title: {
                        text: "Selected Positional Encoding Dimensions",
                        font: { size: 18, color: "#e5eefc" },
                      },
                      margin: { l: 50, r: 20, t: 50, b: 50 },
                      paper_bgcolor: "rgba(0,0,0,0)",
                      plot_bgcolor: "rgba(0,0,0,0)",
                      font: { color: "#e5eefc" },
                      xaxis: { title: "Position" },
                      yaxis: { title: "Value" },
                    }}
                  />
                </div>
              </>
            )}

            {activeTab === "heads" && (
              <div style={responsiveTwoColGrid}>
                {data.headResults.map((head, idx) => (
                  <div key={idx} style={cardStyle}>
                    <Heatmap
                      z={head.weights}
                      xLabels={tokens}
                      yLabels={tokens}
                      title={`Head ${idx + 1} Attention Weights`}
                      valueLabel="weight"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function badge(bg, color) {
  return {
    background: bg,
    color,
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
  };
}