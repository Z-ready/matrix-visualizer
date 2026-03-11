import { determinant } from "./matrix.js";

export function initMatrixUI({ inputIds, applyButton, onPendingChange, onApply }) {
  const inputs = inputIds.map((id) => document.getElementById(id));

  const readMatrix = () => [
    [parseFloat(inputs[0].value) || 0, parseFloat(inputs[1].value) || 0],
    [parseFloat(inputs[2].value) || 0, parseFloat(inputs[3].value) || 0]
  ];

  const handleInput = () => {
    const next = readMatrix();
    if (onPendingChange) {
      onPendingChange(next);
    }
  };

  inputs.forEach((input) => {
    input.addEventListener("input", handleInput);
  });

  applyButton.addEventListener("click", () => {
    const next = readMatrix();
    if (onPendingChange) {
      onPendingChange(next);
    }
    if (onApply) {
      onApply(next);
    }
  });

  return {
    readMatrix,
    setMatrix: (matrix) => {
      inputs[0].value = matrix[0][0];
      inputs[1].value = matrix[0][1];
      inputs[2].value = matrix[1][0];
      inputs[3].value = matrix[1][1];
      if (onPendingChange) {
        onPendingChange(matrix);
      }
    }
  };
}

export function updateStats(matrix) {
  const det = determinant(matrix);
  const basisI = [matrix[0][0], matrix[1][0]];
  const basisJ = [matrix[0][1], matrix[1][1]];
  const area = Math.abs(det);

  const detDisplay = document.getElementById("detDisplay");
  detDisplay.textContent = det.toFixed(3);
  detDisplay.className = det > 0 ? "det-value det-positive" : det < 0 ? "det-value det-negative" : "det-value det-zero";

  document.getElementById("basisIDisplay").textContent = `(${basisI[0].toFixed(3)}, ${basisI[1].toFixed(3)})`;
  document.getElementById("basisJDisplay").textContent = `(${basisJ[0].toFixed(3)}, ${basisJ[1].toFixed(3)})`;
  document.getElementById("areaDisplay").textContent = area.toFixed(3);
}
