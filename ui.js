import { determinant, transformPoint } from "./matrix.js";

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
  const payload = matrix && matrix.matrix ? matrix : { matrix };
  const currentMatrix = payload.matrix;
  const vector = payload.vector || { x: 0, y: 0 };
  const transformedVector = payload.transformedVector || transformPoint(currentMatrix, vector.x, vector.y);

  const det = determinant(currentMatrix);
  const basisI = [currentMatrix[0][0], currentMatrix[1][0]];
  const basisJ = [currentMatrix[0][1], currentMatrix[1][1]];
  const area = Math.abs(det);

  const detDisplay = document.getElementById("detDisplay");
  detDisplay.textContent = det.toFixed(3);
  detDisplay.className = det > 0 ? "det-value det-positive" : det < 0 ? "det-value det-negative" : "det-value det-zero";

  document.getElementById("basisIDisplay").textContent = `(${basisI[0].toFixed(3)}, ${basisI[1].toFixed(3)})`;
  document.getElementById("basisJDisplay").textContent = `(${basisJ[0].toFixed(3)}, ${basisJ[1].toFixed(3)})`;
  document.getElementById("areaDisplay").textContent = area.toFixed(3);

  const vectorDisplay = document.getElementById("vectorDisplay");
  const avDisplay = document.getElementById("avDisplay");
  if (vectorDisplay) {
    vectorDisplay.textContent = `v = (${vector.x.toFixed(3)}, ${vector.y.toFixed(3)})`;
  }
  if (avDisplay) {
    avDisplay.textContent = `Av = (${transformedVector[0].toFixed(3)}, ${transformedVector[1].toFixed(3)})`;
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
      inputs[0].value = vector.x;
      inputs[1].value = vector.y;
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
        detDisplay.textContent = det.toFixed(3);
      }
      if (invertible && inverse) {
        cells[0].textContent = inverse[0][0].toFixed(3);
        cells[1].textContent = inverse[0][1].toFixed(3);
        cells[2].textContent = inverse[1][0].toFixed(3);
        cells[3].textContent = inverse[1][1].toFixed(3);
        if (notice) {
          notice.classList.add("hidden");
        }
        if (status) {
          status.classList.add("hidden");
        }
        return;
      }

      setCellText("not defined");
      if (notice) {
        notice.classList.remove("hidden");
      }
      if (status) {
        status.classList.remove("hidden");
      }
    }
  };
}
