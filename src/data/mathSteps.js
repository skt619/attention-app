const mathSteps = [
  {
    title: "Token embeddings",
    formula: "X ∈ R^{n × d_model}",
    explanation:
      "Each token is represented by a numerical vector. Attention does not operate directly on words; it operates on vectors.",
  },
  {
    title: "Positional encoding",
    formula:
      "X_input = X + P\n\nP(pos, 2i) = sin(pos / 10000^{2i/d_model})\nP(pos, 2i+1) = cos(pos / 10000^{2i/d_model})",
    explanation:
      "Self-attention alone cannot distinguish the order of tokens. Positional encoding injects sequence position into the embeddings.",
  },
  {
    title: "Query, Key, Value",
    formula: "Q = X_input W_Q\nK = X_input W_K\nV = X_input W_V",
    explanation:
      "Queries ask what a token is looking for, keys describe what each token offers to match, and values carry the information that is passed to the next layer.",
  },
  {
    title: "Raw dot-product scores",
    formula: "S = Q K^T",
    explanation:
      "Each entry S_ij is the dot product between query i and key j. It measures raw similarity before scaling and normalization.",
  },
  {
    title: "Scaled attention scores",
    formula: "S_tilde = S / sqrt(d_k)",
    explanation:
      "Scaling keeps the raw scores from growing too large with dimensionality. It helps softmax produce stable distributions.",
  },
  {
    title: "Softmax attention weights",
    formula: "A_ij = exp(S_tilde_ij) / sum_m exp(S_tilde_im)",
    explanation:
      "Softmax turns each row of scores into a probability distribution. Each query attends to all keys with non-negative weights that sum to one.",
  },
  {
    title: "Weighted output",
    formula: "O = A V",
    explanation:
      "The output vector for each token is the weighted sum of value vectors, with weights given by the attention probabilities.",
  },
  {
    title: "Multi-head attention",
    formula: "head_h = softmax(Q_h K_h^T / sqrt(d_k)) V_h\nMultiHead = Concat(head_1, ..., head_H)",
    explanation:
      "Separate attention heads can focus on different relationships. The outputs are concatenated so the model can combine diverse signals.",
  },
];

export default mathSteps;
