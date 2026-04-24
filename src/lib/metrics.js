function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function attentionEntropy(weights) {
  return weights.map((row) => {
    return -row.reduce((sum, value) => {
      const safe = Math.max(value, 1e-12);
      return sum + safe * Math.log(safe);
    }, 0);
  });
}

function sparsityMetric(weights, epsilon = 0.05) {
  const n = weights.length;
  const total = n * (weights[0]?.length || 0);
  const smallCount = weights.reduce(
    (count, row) =>
      count + row.reduce((inner, value) => inner + (value < epsilon ? 1 : 0), 0),
    0
  );
  return {
    sparsity: total ? smallCount / total : 0,
    nearZeroCount: smallCount,
    total,
  };
}

function rowSumValues(weights) {
  return weights.map((row) => row.reduce((sum, value) => sum + value, 0));
}

function maxWeight(weights) {
  return Math.max(...weights.flat());
}

function strongestAttentionPair(weights, tokens) {
  let best = { value: -Infinity, query: null, key: null, row: -1, col: -1 };
  weights.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value > best.value) {
        best = {
          value,
          query: tokens[i],
          key: tokens[j],
          row: i,
          col: j,
        };
      }
    });
  });
  return best;
}

function flattenMatrix(matrix) {
  return matrix.flat();
}

function frobeniusNorm(matrix) {
  return Math.sqrt(flattenMatrix(matrix).reduce((sum, value) => sum + value * value, 0));
}

function dotProduct(a, b) {
  return a.reduce((sum, value, idx) => sum + value * b[idx], 0);
}

function headSimilarityMatrix(headWeights) {
  const heads = headWeights.length;
  const sim = Array.from({ length: heads }, () => Array(heads).fill(0));
  const norms = headWeights.map((weights) => frobeniusNorm(weights));
  for (let i = 0; i < heads; i++) {
    for (let j = 0; j < heads; j++) {
      const flatA = flattenMatrix(headWeights[i]);
      const flatB = flattenMatrix(headWeights[j]);
      const denom = norms[i] * norms[j] || 1e-12;
      sim[i][j] = dotProduct(flatA, flatB) / denom;
    }
  }
  return sim;
}

function diversityScore(similarityMatrix) {
  const heads = similarityMatrix.length;
  if (heads < 2) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < heads; i++) {
    for (let j = i + 1; j < heads; j++) {
      sum += similarityMatrix[i][j];
      count += 1;
    }
  }
  const avg = count ? sum / count : 0;
  return 1 - avg;
}

function topTokensForRow(weights, tokens, topK = 3) {
  return weights.map((row, i) => {
    return row
      .map((value, j) => ({ token: tokens[j], value, index: j }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topK);
  });
}

export {
  average,
  attentionEntropy,
  diversityScore,
  flattenMatrix,
  headSimilarityMatrix,
  maxWeight,
  rowSumValues,
  sparsityMetric,
  strongestAttentionPair,
  topTokensForRow,
};
