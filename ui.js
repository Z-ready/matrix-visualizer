import { determinant, transformPoint } from "./matrix.js";

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  if (Math.abs(value) < 1e-6) {
    return "0";
  }
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 1e-6) {
    return `${rounded}`;
  }
  const fixed = value.toFixed(3);
  return fixed.replace(/\\.0+$/, "").replace(/(\\.\\d*?)0+$/, "$1");
}

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

  if (applyButton) {
    applyButton.addEventListener("click", () => {
      const next = readMatrix();
      if (onPendingChange) {
        onPendingChange(next);
      }
      if (onApply) {
        onApply(next);
      }
    });
  }

  return {
    readMatrix,
    setMatrix: (matrix) => {
      inputs[0].value = formatNumber(matrix[0][0]);
      inputs[1].value = formatNumber(matrix[0][1]);
      inputs[2].value = formatNumber(matrix[1][0]);
      inputs[3].value = formatNumber(matrix[1][1]);
      if (onPendingChange) {
        onPendingChange(matrix);
      }
    }
  };
}

export function updateStats(matrix) {
  const payload = matrix && matrix.matrix ? matrix : { matrix };
  const currentMatrix = payload.matrix;
  const vector = payload.vector || { x: 0, y: 0 };
  const transformedVector = payload.transformedVector || transformPoint(currentMatrix, vector.x, vector.y);

  const det = determinant(currentMatrix);
  const basisI = [currentMatrix[0][0], currentMatrix[1][0]];
  const basisJ = [currentMatrix[0][1], currentMatrix[1][1]];
  const area = Math.abs(det);

  const detDisplay = document.getElementById("detDisplay");
  detDisplay.textContent = formatNumber(det);
  detDisplay.className = det > 0 ? "analysis-value det-value det-positive" : det < 0 ? "analysis-value det-value det-negative" : "analysis-value det-value det-zero";

  document.getElementById("basisIDisplay").textContent = `(${formatNumber(basisI[0])}, ${formatNumber(basisI[1])})`;
  document.getElementById("basisJDisplay").textContent = `(${formatNumber(basisJ[0])}, ${formatNumber(basisJ[1])})`;
  document.getElementById("areaDisplay").textContent = formatNumber(area);

  const vectorDisplay = document.getElementById("vectorDisplay");
  const avDisplay = document.getElementById("avDisplay");
  if (vectorDisplay) {
    vectorDisplay.textContent = `v = (${formatNumber(vector.x)}, ${formatNumber(vector.y)})`;
  }
  if (avDisplay) {
    avDisplay.textContent = `Av = (${formatNumber(transformedVector[0])}, ${formatNumber(transformedVector[1])})`;
  }
}

export function initVectorUI({ inputIds, onChange }) {
  const inputs = inputIds.map((id) => document.getElementById(id));
  let isProgrammatic = false;

  const readVector = () => ({
    x: parseFloat(inputs[0].value) || 0,
    y: parseFloat(inputs[1].value) || 0
  });

  const handleInput = () => {
    if (isProgrammatic) {
      return;
    }
    if (onChange) {
      onChange(readVector());
    }
  };

  inputs.forEach((input) => {
    input.addEventListener("input", handleInput);
  });

  return {
    readVector,
    setVector: (vector) => {
      isProgrammatic = true;
      inputs[0].value = formatNumber(vector.x);
      inputs[1].value = formatNumber(vector.y);
      isProgrammatic = false;
    }
  };
}

export function initInverseUI({ cellIds, noticeId, statusId, detId }) {
  const cells = cellIds.map((id) => document.getElementById(id));
  const notice = document.getElementById(noticeId);
  const status = document.getElementById(statusId);
  const detDisplay = document.getElementById(detId);

  const setCellText = (value) => {
    cells.forEach((cell) => {
      cell.textContent = value;
    });
  };

  return {
    setInverse: ({ inverse, invertible, det }) => {
      if (detDisplay) {
        detDisplay.textContent = formatNumber(det);
      }
      if (invertible && inverse) {
        cells[0].textContent = formatNumber(inverse[0][0]);
        cells[1].textContent = formatNumber(inverse[0][1]);
        cells[2].textContent = formatNumber(inverse[1][0]);
        cells[3].textContent = formatNumber(inverse[1][1]);
        if (notice) {
          notice.classList.add("hidden");
        }
        if (status) {
          status.classList.add("hidden");
        }
        return;
      }

      setCellText("—");
      if (notice) {
        notice.classList.remove("hidden");
      }
      if (status) {
        status.classList.remove("hidden");
      }
    }
  };
}
