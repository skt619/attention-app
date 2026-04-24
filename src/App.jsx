import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import InputSection from "./sections/InputSection.jsx";
import EmbeddingSection from "./sections/EmbeddingSection.jsx";
import QKVSection from "./sections/QKVSection.jsx";
import ScoreSection from "./sections/ScoreSection.jsx";
import ScaledScoreSection from "./sections/ScaledScoreSection.jsx";
import WeightSection from "./sections/WeightSection.jsx";
import OutputSection from "./sections/OutputSection.jsx";
import MultiHeadSection from "./sections/MultiHeadSection.jsx";
import TemperatureSection from "./sections/TemperatureSection.jsx";
import PositionalSection from "./sections/PositionalSection.jsx";
import MaskSection from "./sections/MaskSection.jsx";
import ExperimentSection from "./sections/ExperimentSection.jsx";
import SummarySection from "./sections/SummarySection.jsx";
import TokenInspector from "./components/TokenInspector.jsx";
import { tokensFromText } from "./lib/tokenUtils.js";
import {
  addMatrices,
  attention,
  makeCausalMask,
  makeTokenEmbeddings,
  positionalEncoding,
  projectQKV,
  splitHeads,
} from "./lib/attentionMath.js";
import {
  average,
  attentionEntropy,
  diversityScore,
  headSimilarityMatrix,
  maxWeight,
  rowSumValues,
  sparsityMetric,
  strongestAttentionPair,
} from "./lib/metrics.js";
import {
  temperatureSweep,
  positionalEncodingComparison,
  headDiversity,
} from "./lib/experiments.js";
import "./index.css";

const responsiveStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 16,
};

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.85)",
        border: "1px solid #334155",
        borderRadius: 20,
        padding: 18,
      }}
    >
      <div style={{ color: "#cbd5e1", marginBottom: 8, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

export default function App() {
  const [tokenText, setTokenText] = useState("the, black, hole, is, massive");
  const [dModel, setDModel] = useState(8);
  const [temperature, setTemperature] = useState(1.0);
  const [usePositional, setUsePositional] = useState(true);
  const [numHeads, setNumHeads] = useState(2);
  const [causalMask, setCausalMask] = useState(false);
  const [selectedToken, setSelectedToken] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSection, setSidebarSection] = useState("controls");
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  const tokens = useMemo(() => tokensFromText(tokenText), [tokenText]);

  useEffect(() => {
    if (selectedToken >= tokens.length) {
      setSelectedToken(Math.max(0, tokens.length - 1));
    }
  }, [tokens, selectedToken]);

  const data = useMemo(() => {
    if (tokens.length < 2 || dModel % numHeads !== 0) return null;

    const embed = makeTokenEmbeddings(tokens, dModel);
    const pe = positionalEncoding(tokens.length, dModel);
    const X = usePositional ? addMatrices(embed, pe) : embed;
    const { Q, K, V } = projectQKV(X, dModel, 7);
    const mask = causalMask ? makeCausalMask(tokens.length) : null;
    const attentionResult = attention(Q, K, V, { temperature, scale: true, mask });
    const unmaskedResult = attention(Q, K, V, { temperature, scale: true, mask: null });
    const unscaledResult = attention(Q, K, V, { temperature, scale: false, mask: null });

    const qHeads = splitHeads(Q, numHeads);
    const kHeads = splitHeads(K, numHeads);
    const vHeads = splitHeads(V, numHeads);

    const headResults = qHeads.map((qh, index) => {
      const result = attention(qh, kHeads[index], vHeads[index], { temperature, scale: true, mask });
      const entropies = attentionEntropy(result.weights);
      const sparsity = sparsityMetric(result.weights, 0.05);
      return {
        ...result,
        entropy: average(entropies),
        sparsity: sparsity.sparsity,
      };
    });

    const rowSums = rowSumValues(attentionResult.weights);
    const entropies = attentionEntropy(attentionResult.weights);
    const avgEntropy = average(entropies);
    const sparsity = sparsityMetric(attentionResult.weights, 0.05);
    const maxAttention = maxWeight(attentionResult.weights);
    const strongest = strongestAttentionPair(attentionResult.weights, tokens);
    const headSimilarity = headSimilarityMatrix(headResults.map((head) => head.weights));
    const diversity = diversityScore(headSimilarity);

    return {
      embed,
      pe,
      X,
      Q,
      K,
      V,
      attention: attentionResult,
      unmasked: unmaskedResult,
      unscaled: unscaledResult,
      headResults,
      rowSums,
      entropies,
      avgEntropy,
      sparsity,
      maxAttention,
      strongest,
      headSimilarity,
      diversity,
    };
  }, [tokens, dModel, numHeads, temperature, usePositional, causalMask]);

  const averageHeadSimilarity = useMemo(() => {
    if (!data?.headSimilarity) return 0;
    const matrix = data.headSimilarity;
    const n = matrix.length;
    if (n < 2) return 0;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        sum += matrix[i][j];
        count += 1;
      }
    }
    return count ? sum / count : 0;
  }, [data]);

  const experimentData = useMemo(() => {
    if (!data) return [];
    return temperatureSweep(tokens, dModel, numHeads, [0.25, 0.5, 1, 2, 5], usePositional, causalMask);
  }, [data, tokens, dModel, numHeads, usePositional, causalMask]);

  const positionalComparison = useMemo(() => {
    if (!data) return null;
    return positionalEncodingComparison(tokens, dModel, temperature, causalMask);
  }, [data, tokens, dModel, temperature, causalMask]);

  const diversityData = useMemo(() => {
    if (!data) return [];
    return headDiversity(tokens, dModel, temperature, [1, 2, 4, 8], usePositional, causalMask);
  }, [data, tokens, dModel, temperature, usePositional, causalMask]);

  if (!data) {
    return (
      <div style={{ color: "white", padding: 30 }}>
        Please enter at least two tokens and choose a number of heads that divides d_model evenly.
      </div>
    );
  }

  const summary = `The input sentence contains ${tokens.length} tokens with d_model=${dModel}. Using ${numHeads} attention heads, temperature ${temperature.toFixed(3)}, positional encoding ${usePositional ? "enabled" : "disabled"}, and ${causalMask ? "causal masking" : "no masking"}, the average attention entropy is ${data.avgEntropy.toFixed(3)} and sparsity is ${data.sparsity.sparsity.toFixed(3)}. The head diversity score is ${data.diversity.toFixed(3)}. The strongest attention pair is ${data.strongest.query} → ${data.strongest.key} (${data.strongest.value.toFixed(3)}).`;

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #0f172a, #020617 55%)", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((value) => !value)}
          section={sidebarSection}
          onSectionChange={setSidebarSection}
          controls={{ tokenText, temperature, dModel, numHeads, usePositional, causalMask }}
          onControlsChange={(changes) => {
            if (changes.tokenText !== undefined) setTokenText(changes.tokenText);
            if (changes.temperature !== undefined) setTemperature(changes.temperature);
            if (changes.dModel !== undefined) setDModel(changes.dModel);
            if (changes.numHeads !== undefined) setNumHeads(changes.numHeads);
            if (changes.usePositional !== undefined) setUsePositional(changes.usePositional);
            if (changes.causalMask !== undefined) setCausalMask(changes.causalMask);
          }}
          beginnerMode={beginnerMode}
          onBeginnerToggle={setBeginnerMode}
          activeStep={activeStep}
          onStepChange={setActiveStep}
        />

        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: 32, display: "grid", gap: 28 }}>
            <header style={{ display: "grid", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 48, margin: 0 }}>Self-Attention Tutorial</h1>
                <p style={{ color: "#cbd5e1", maxWidth: 920, fontSize: 18, lineHeight: 1.7 }}>
                  Explore the full attention pipeline from tokens to embeddings, Q/K/V projections, raw scores, scaled attention, softmax weights, and weighted outputs. Compare heads, temperature, positional encoding, and masking in an interactive math laboratory.
                </p>
              </div>
              <div style={responsiveStatsGrid}>
                <StatCard label="Tokens" value={tokens.length} />
                <StatCard label="d_model" value={dModel} />
                <StatCard label="Temperature" value={temperature.toFixed(2)} />
                <StatCard label="Heads" value={numHeads} />
                <StatCard label="Avg entropy" value={data.avgEntropy.toFixed(3)} />
                <StatCard label="Sparsity" value={data.sparsity.sparsity.toFixed(3)} />
                <StatCard label="Diversity" value={data.diversity.toFixed(3)} />
              </div>
            </header>

            <div style={{ display: "grid", gap: 24 }}>
              <InputSection
                tokenText={tokenText}
                onTokenTextChange={setTokenText}
                tokens={tokens}
                selectedToken={selectedToken}
                onSelectToken={setSelectedToken}
                beginnerMode={beginnerMode}
              />
              <TokenInspector
                selectedIndex={selectedToken}
                tokens={tokens}
                data={data}
                temperature={temperature}
                causalMask={causalMask}
              />
              <EmbeddingSection
                tokens={tokens}
                embed={data.embed}
                inputX={data.X}
                usePositional={usePositional}
                selectedToken={selectedToken}
                beginnerMode={beginnerMode}
              />
              <QKVSection
                tokens={tokens}
                inputX={data.X}
                Q={data.Q}
                K={data.K}
                V={data.V}
                beginnerMode={beginnerMode}
                selectedToken={selectedToken}
              />
              <ScoreSection
                tokens={tokens}
                rawScores={data.attention.rawScores}
                Q={data.Q}
                K={data.K}
                selectedToken={selectedToken}
                beginnerMode={beginnerMode}
              />
              <ScaledScoreSection
                tokens={tokens}
                rawScores={data.attention.rawScores}
                scaledScores={data.attention.scaledScores}
                Q={data.Q}
                K={data.K}
                selectedToken={selectedToken}
                beginnerMode={beginnerMode}
              />
              <WeightSection
                tokens={tokens}
                scaledScores={data.attention.scaledScores}
                weights={data.attention.weights}
                selectedToken={selectedToken}
                beginnerMode={beginnerMode}
              />
              <OutputSection
                tokens={tokens}
                weights={data.attention.weights}
                V={data.V}
                output={data.attention.output}
                selectedToken={selectedToken}
                beginnerMode={beginnerMode}
              />
              <MultiHeadSection tokens={tokens} headResults={data.headResults} headSimilarity={data.headSimilarity} beginnerMode={beginnerMode} />
              <TemperatureSection experimentData={experimentData} beginnerMode={beginnerMode} />
              <PositionalSection
                tokens={tokens}
                embeddingWithPos={addMatrices(data.embed, data.pe)}
                positionalEncoding={data.pe}
                positionalComparison={positionalComparison}
                beginnerMode={beginnerMode}
              />
              <MaskSection
                tokens={tokens}
                unmaskedWeights={data.unmasked.weights}
                maskedWeights={attention(data.Q, data.K, data.V, { temperature, scale: true, mask: makeCausalMask(tokens.length) }).weights}
                beginnerMode={beginnerMode}
              />
              <ExperimentSection
                temperatureData={experimentData}
                positionalComparison={positionalComparison}
                diversityData={diversityData}
                beginnerMode={beginnerMode}
              />
              <SummarySection summary={summary} beginnerMode={beginnerMode} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
