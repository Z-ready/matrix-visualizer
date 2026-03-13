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

export function triggerHighlight(el) {
  if (!el) {
    return;
  }
  el.classList.remove("highlight-update");
  void el.offsetWidth;
  el.classList.add("highlight-update");
  const handle = () => {
    el.classList.remove("highlight-update");
    el.removeEventListener("animationend", handle);
  };
  el.addEventListener("animationend", handle);
}

export function setTextWithHighlight(el, text, highlight = true) {
  if (!el) {
    return;
  }
  if (el.textContent !== text) {
    el.textContent = text;
    if (highlight) {
      triggerHighlight(el);
    }
  }
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
  const highlight = payload.highlight !== false;

  const det = determinant(currentMatrix);
  const basisI = [currentMatrix[0][0], currentMatrix[1][0]];
  const basisJ = [currentMatrix[0][1], currentMatrix[1][1]];
  const area = Math.abs(det);

  const detDisplay = document.getElementById("detDisplay");
  detDisplay.className = det > 0 ? "analysis-value det-value det-positive" : det < 0 ? "analysis-value det-value det-negative" : "analysis-value det-value det-zero";
  setTextWithHighlight(detDisplay, formatNumber(det), highlight);

  setTextWithHighlight(
    document.getElementById("basisIDisplay"),
    `(${formatNumber(basisI[0])}, ${formatNumber(basisI[1])})`,
    highlight
  );
  setTextWithHighlight(
    document.getElementById("basisJDisplay"),
    `(${formatNumber(basisJ[0])}, ${formatNumber(basisJ[1])})`,
    highlight
  );
  setTextWithHighlight(document.getElementById("areaDisplay"), formatNumber(area), highlight);

  setTextWithHighlight(document.getElementById("current11"), formatNumber(currentMatrix[0][0]), false);
  setTextWithHighlight(document.getElementById("current12"), formatNumber(currentMatrix[0][1]), false);
  setTextWithHighlight(document.getElementById("current21"), formatNumber(currentMatrix[1][0]), false);
  setTextWithHighlight(document.getElementById("current22"), formatNumber(currentMatrix[1][1]), false);

  setTextWithHighlight(document.getElementById("vectorXDisplay"), formatNumber(vector.x), highlight);
  setTextWithHighlight(document.getElementById("vectorYDisplay"), formatNumber(vector.y), highlight);
  setTextWithHighlight(document.getElementById("vectorTXDisplay"), formatNumber(transformedVector[0]), highlight);
  setTextWithHighlight(document.getElementById("vectorTYDisplay"), formatNumber(transformedVector[1]), highlight);
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
    setInverse: ({ inverse, invertible, det, highlight = true }) => {
      if (detDisplay) {
        setTextWithHighlight(detDisplay, formatNumber(det), highlight);
      }
      if (invertible && inverse) {
        setTextWithHighlight(cells[0], formatNumber(inverse[0][0]), highlight);
        setTextWithHighlight(cells[1], formatNumber(inverse[0][1]), highlight);
        setTextWithHighlight(cells[2], formatNumber(inverse[1][0]), highlight);
        setTextWithHighlight(cells[3], formatNumber(inverse[1][1]), highlight);
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
        if (highlight) {
          triggerHighlight(notice);
        }
      }
      if (status) {
        status.classList.remove("hidden");
        if (highlight) {
          triggerHighlight(status);
        }
      }
    }
  };
}
