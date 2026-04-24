import {
  addMatrices,
  attention,
  makeCausalMask,
  makeTokenEmbeddings,
  positionalEncoding,
  projectQKV,
  splitHeads,
} from "./attentionMath.js";
import {
  average,
  attentionEntropy,
  diversityScore,
  headSimilarityMatrix,
  maxWeight,
  sparsityMetric,
  strongestAttentionPair,
} from "./metrics.js";

function temperatureSweep(tokens, dModel, numHeads, temperatureValues, usePositional, causalMask) {
  const embed = makeTokenEmbeddings(tokens, dModel);
  const pe = positionalEncoding(tokens.length, dModel);
  const X = usePositional ? addMatrices(embed, pe) : embed;
  const { Q, K, V } = projectQKV(X, dModel, 7);
  const mask = causalMask ? makeCausalMask(tokens.length) : null;
  return temperatureValues.map((temperature) => {
    const { weights } = attention(Q, K, V, { temperature, scale: true, mask });
    const entropies = attentionEntropy(weights);
    const sparsity = sparsityMetric(weights, 0.05);
    return {
      temperature,
      avgEntropy: average(entropies),
      sparsity: sparsity.sparsity,
      maxWeight: maxWeight(weights),
    };
  });
}

function positionalEncodingComparison(tokens, dModel, temperature, causalMask) {
  const embed = makeTokenEmbeddings(tokens, dModel);
  const pe = positionalEncoding(tokens.length, dModel);
  const noPos = projectQKV(embed, dModel, 7);
  const withPos = projectQKV(addMatrices(embed, pe), dModel, 7);
  const mask = causalMask ? makeCausalMask(tokens.length) : null;
  const noPosRes = attention(noPos.Q, noPos.K, noPos.V, { temperature, scale: true, mask });
  const withPosRes = attention(withPos.Q, withPos.K, withPos.V, { temperature, scale: true, mask });
  const strongestNoPos = strongestAttentionPair(noPosRes.weights, tokens);
  const strongestWithPos = strongestAttentionPair(withPosRes.weights, tokens);
  return {
    noPos: {
      avgEntropy: average(attentionEntropy(noPosRes.weights)),
      strongest: strongestNoPos,
    },
    withPos: {
      avgEntropy: average(attentionEntropy(withPosRes.weights)),
      strongest: strongestWithPos,
    },
  };
}

function headDiversity(tokens, dModel, temperature, headList, usePositional, causalMask) {
  const embed = makeTokenEmbeddings(tokens, dModel);
  const pe = positionalEncoding(tokens.length, dModel);
  const X = usePositional ? addMatrices(embed, pe) : embed;
  const { Q, K, V } = projectQKV(X, dModel, 7);
  const mask = causalMask ? makeCausalMask(tokens.length) : null;
  return headList.map((numHeads) => {
    const qHeads = splitHeads(Q, numHeads);
    const kHeads = splitHeads(K, numHeads);
    const vHeads = splitHeads(V, numHeads);
    const headWeights = qHeads.map((qh, idx) =>
      attention(qh, kHeads[idx], vHeads[idx], { temperature, scale: true, mask }).weights
    );
    const similarity = headSimilarityMatrix(headWeights);
    return {
      heads: numHeads,
      averageSimilarity: average(
        similarity.flat().filter((value, idx) => {
          const row = Math.floor(idx / similarity.length);
          const col = idx % similarity.length;
          return row !== col;
        })
      ),
      diversity: diversityScore(similarity),
      similarity,
    };
  });
}

export { temperatureSweep, positionalEncodingComparison, headDiversity };
