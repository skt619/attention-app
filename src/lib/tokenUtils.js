function tokensFromText(text) {
  return text
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function formatNum(value, decimals = 3) {
  return Number.parseFloat(value).toFixed(decimals);
}

function tableFromMatrix(tokens, matrix, formatter = formatNum, columnLabels) {
  return matrix.map((row, rowIndex) => {
    return {
      token: tokens[rowIndex] ?? rowIndex,
      ...Object.fromEntries(
        row.map((value, colIndex) => [
          columnLabels?.[colIndex] ?? `d${colIndex}`,
          formatter(value),
        ])
      ),
    };
  });
}

export { formatNum, tableFromMatrix, tokensFromText };
