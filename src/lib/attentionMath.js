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
  return A.map((row, i) => row.map((value, j) => value + B[i][j]));
}

function scaleMatrix(A, factor) {
  return A.map((row) => row.map((value) => value * factor));
}

function softmaxRow(row, temperature = 1) {
  const safeTemp = Math.max(temperature, 1e-8);
  const scaled = row.map((value) => value / safeTemp);
  const maxVal = Math.max(...scaled);
  const exps = scaled.map((value) => Math.exp(value - maxVal));
  const sumExp = exps.reduce((acc, value) => acc + value, 0);
  return exps.map((value) => value / Math.max(sumExp, 1e-12));
}

function makeTokenEmbeddings(tokens, dModel, seedOffset = 42) {
  return tokens.map((token) => {
    const rand = mulberry32(hashString(token) + seedOffset);
    return Array.from({ length: dModel }, () => randn(rand));
  });
}

function positionalEncoding(seqLen, dModel) {
  const pe = Array.from({ length: seqLen }, () => Array(dModel).fill(0));
  for (let pos = 0; pos < seqLen; pos++) {
    for (let i = 0; i < dModel; i += 2) {
      const divTerm = Math.exp((-Math.log(10000.0) * i) / dModel);
      pe[pos][i] = Math.sin(pos * divTerm);
      if (i + 1 < dModel) {
        pe[pos][i + 1] = Math.cos(pos * divTerm);
      }
    }
  }
  return pe;
}

function initProjectionMatrix(dModel, rand) {
  return Array.from({ length: dModel }, () =>
    Array.from({ length: dModel }, () => randn(rand) / Math.sqrt(dModel))
  );
}

function projectQKV(X, dModel, seed = 3) {
  const rand = mulberry32(seed);
  const Wq = initProjectionMatrix(dModel, rand);
  const Wk = initProjectionMatrix(dModel, rand);
  const Wv = initProjectionMatrix(dModel, rand);
  return {
    Q: matmul(X, Wq),
    K: matmul(X, Wk),
    V: matmul(X, Wv),
    Wq,
    Wk,
    Wv,
  };
}

function makeCausalMask(sequenceLength) {
  return Array.from({ length: sequenceLength }, (_, i) =>
    Array.from({ length: sequenceLength }, (_, j) =>
      j > i ? -1e9 : 0
    )
  );
}

function addMask(scores, mask) {
  if (!mask) return scores;
  return scores.map((row, i) => row.map((value, j) => value + mask[i][j]));
}

function attention(Q, K, V, options = {}) {
  const { temperature = 1, scale = true, mask = null } = options;
  const dK = Q[0].length;
  let scores = matmul(Q, transpose(K));
  const raw = scores;
  if (scale) {
    scores = scaleMatrix(scores, 1 / Math.sqrt(dK));
  }
  const scoresWithMask = addMask(scores, mask);
  const weights = scoresWithMask.map((row) => softmaxRow(row, temperature));
  const output = matmul(weights, V);
  return {
    rawScores: raw,
    scaledScores: scores,
    maskedScores: scoresWithMask,
    weights,
    output,
  };
}

function splitHeads(X, numHeads) {
  const n = X.length;
  const dModel = X[0].length;
  const headDim = Math.floor(dModel / numHeads);
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

function concatHeads(headOutputs) {
  return headOutputs[0].map((_, rowIndex) =>
    headOutputs
      .map((head) => head[rowIndex])
      .reduce((acc, headRow) => acc.concat(headRow), [])
  );
}

export {
  addMatrices,
  attention,
  concatHeads,
  makeCausalMask,
  makeTokenEmbeddings,
  matmul,
  positionalEncoding,
  projectQKV,
  splitHeads,
};
