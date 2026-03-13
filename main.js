import { determinant, identityMatrix, invertMatrix, multiplyMatrix } from "./matrix.js";
import { animateTransformAsync, DEFAULT_VECTOR, getCurrentMatrix, initRenderer, renderMatrix, resetRenderer, setAnimationStateListener, setVector, setVectorVisibility } from "./render.js";
import { formatNumber, initInverseUI, initMatrixUI, initVectorUI, setTextWithHighlight, updateStats } from "./ui.js";

const canvas = document.getElementById("viz");
const vizStage = document.getElementById("vizStage");
const applyABtn = document.getElementById("applyA");
const applyInverseBtn = document.getElementById("applyInverse");
const applyInverseBBtn = document.getElementById("applyInverseB");
const applyBBtn = document.getElementById("applyB");
const applyComposeBtn = document.getElementById("applyCompose");
const resetBtn = document.getElementById("reset");
const themeToggle = document.getElementById("themeToggle");
const matrixBControl = document.getElementById("matrixBControl");
const inversePanelB = document.getElementById("inversePanelB");
const composeActions = document.getElementById("composeActions");
const vectorToggle = document.getElementById("vectorToggle");
const vectorPanel = document.getElementById("vectorPanel");
const vectorResults = document.getElementById("vectorResults");
const matrixMultiplyPanel = document.getElementById("matrixMultiplyPanel");
const analysisOverlay = document.getElementById("analysisOverlay");
const currentMatrixLabel = document.getElementById("currentMatrixLabel");
const modeRadios = document.querySelectorAll('input[name="mode"]');

let currentMatrix = identityMatrix();
let pendingMatrixA = identityMatrix();
let pendingMatrixB = identityMatrix();
let rendererReady = false;
let isAnimating = false;
let actionLocked = false;
let inverseAInvertible = true;
let inverseBInvertible = true;
let lastApply = null;
const RESET_FADE_DURATION = 360;
const RESET_FADE_SWITCH = 180;
const RESET_FADE_PAUSE = 120;

const THEME_KEY = "matrix-theme";

function setTheme(theme) {
  document.body.classList.remove("light-theme", "dark-theme");
  document.body.classList.add(theme);
  localStorage.setItem(THEME_KEY, theme);
  themeToggle.textContent = theme === "dark-theme" ? "☀ Light" : "🌙 Dark";
  if (rendererReady) {
    renderMatrix(getCurrentMatrix());
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark-theme" || saved === "light-theme") {
    setTheme(saved);
  } else {
    setTheme("light-theme");
  }
}

const vectorUI = initVectorUI({
  inputIds: ["vX", "vY"],
  onChange: (next) => {
    setVector(next, { skipInputCallback: true });
  }
});

const inverseUI = initInverseUI({
  cellIds: ["inv11", "inv12", "inv21", "inv22"],
  noticeId: "inverseNotice",
  statusId: "inverseStatus",
  detId: "detADisplay"
});

const inverseUIB = initInverseUI({
  cellIds: ["invB11", "invB12", "invB21", "invB22"],
  noticeId: "inverseNoticeB",
  statusId: "inverseStatusB",
  detId: "detBDisplay"
});

const multiplyCells = {
  a11: document.getElementById("mulA11"),
  a12: document.getElementById("mulA12"),
  a21: document.getElementById("mulA21"),
  a22: document.getElementById("mulA22"),
  b11: document.getElementById("mulB11"),
  b12: document.getElementById("mulB12"),
  b21: document.getElementById("mulB21"),
  b22: document.getElementById("mulB22"),
  c11: document.getElementById("mulC11"),
  c12: document.getElementById("mulC12"),
  c21: document.getElementById("mulC21"),
  c22: document.getElementById("mulC22")
};

initRenderer({
  canvasEl: canvas,
  stageEl: vizStage,
  onStatsChange: updateStats,
  onVectorChange: (nextVector) => {
    vectorUI.setVector(nextVector);
  }
});
rendererReady = true;

setVector(DEFAULT_VECTOR);
setVectorVisibility(false);

setAnimationStateListener((animating) => {
  isAnimating = animating;
  syncActionButtons();
});

function syncActionButtons() {
  const disableAll = isAnimating || actionLocked;
  if (applyABtn) {
    applyABtn.disabled = disableAll;
  }
  if (applyBBtn) {
    applyBBtn.disabled = disableAll;
  }
  if (applyComposeBtn) {
    applyComposeBtn.disabled = disableAll;
  }
  if (applyInverseBtn) {
    applyInverseBtn.disabled = disableAll || !inverseAInvertible;
  }
  if (applyInverseBBtn) {
    applyInverseBBtn.disabled = disableAll || !inverseBInvertible;
  }
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function matricesEqual(a, b, epsilon = 1e-8) {
  if (!a || !b) {
    return false;
  }
  for (let r = 0; r < a.length; r += 1) {
    for (let c = 0; c < a[r].length; c += 1) {
      if (Math.abs(a[r][c] - b[r][c]) > epsilon) {
        return false;
      }
    }
  }
  return true;
}

function appliedEqual(nextApplied, lastApplied) {
  if (!nextApplied || !lastApplied) {
    return false;
  }
  if (nextApplied.a && nextApplied.b && lastApplied.a && lastApplied.b) {
    return matricesEqual(nextApplied.a, lastApplied.a) && matricesEqual(nextApplied.b, lastApplied.b);
  }
  return matricesEqual(nextApplied, lastApplied);
}

function fadeToMatrix(matrix) {
  return new Promise((resolve) => {
    if (!canvas) {
      renderMatrix(matrix);
      currentMatrix = matrix;
      resolve();
      return;
    }
    canvas.classList.remove("fade-reset");
    void canvas.offsetWidth;
    canvas.classList.add("fade-reset");
    setTimeout(() => {
      renderMatrix(matrix);
      currentMatrix = matrix;
    }, RESET_FADE_SWITCH);
    setTimeout(() => {
      canvas.classList.remove("fade-reset");
      resolve();
    }, RESET_FADE_DURATION);
  });
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runApplySequence(type, applied, sequenceFn) {
  if (isAnimating || actionLocked) {
    return;
  }
  actionLocked = true;
  syncActionButtons();
  try {
    const current = getCurrentMatrix();
    let base = current;
    const repeat = lastApply && lastApply.type === type && appliedEqual(applied, lastApply.applied);
    if (repeat && lastApply.base) {
      base = lastApply.base;
      if (!matricesEqual(current, base)) {
        await fadeToMatrix(base);
        await delay(RESET_FADE_PAUSE);
      }
    }
    await sequenceFn(base);
    lastApply = {
      type,
      base: cloneMatrix(base),
      applied: applied.a && applied.b ? { a: cloneMatrix(applied.a), b: cloneMatrix(applied.b) } : cloneMatrix(applied)
    };
  } finally {
    actionLocked = false;
    syncActionButtons();
  }
}

function updateInverseStateA(matrix) {
  const det = determinant(matrix);
  const inverse = invertMatrix(matrix);
  const invertible = Boolean(inverse);
  const displayDet = invertible ? det : 0;
  inverseUI.setInverse({ inverse, invertible, det: displayDet, highlight: true });
  inverseAInvertible = invertible;
  syncActionButtons();
  return inverse;
}

function updateInverseStateB(matrix) {
  const det = determinant(matrix);
  const inverse = invertMatrix(matrix);
  const invertible = Boolean(inverse);
  const displayDet = invertible ? det : 0;
  inverseUIB.setInverse({ inverse, invertible, det: displayDet, highlight: true });
  inverseBInvertible = invertible;
  syncActionButtons();
  return inverse;
}

function updateMultiplyDisplay() {
  if (!matrixMultiplyPanel) {
    return;
  }
  const a = pendingMatrixA;
  const b = pendingMatrixB;
  const c = multiplyMatrix(a, b);
  const highlight = true;
  setTextWithHighlight(multiplyCells.a11, formatNumber(a[0][0]), highlight);
  setTextWithHighlight(multiplyCells.a12, formatNumber(a[0][1]), highlight);
  setTextWithHighlight(multiplyCells.a21, formatNumber(a[1][0]), highlight);
  setTextWithHighlight(multiplyCells.a22, formatNumber(a[1][1]), highlight);
  setTextWithHighlight(multiplyCells.b11, formatNumber(b[0][0]), highlight);
  setTextWithHighlight(multiplyCells.b12, formatNumber(b[0][1]), highlight);
  setTextWithHighlight(multiplyCells.b21, formatNumber(b[1][0]), highlight);
  setTextWithHighlight(multiplyCells.b22, formatNumber(b[1][1]), highlight);
  setTextWithHighlight(multiplyCells.c11, formatNumber(c[0][0]), highlight);
  setTextWithHighlight(multiplyCells.c12, formatNumber(c[0][1]), highlight);
  setTextWithHighlight(multiplyCells.c21, formatNumber(c[1][0]), highlight);
  setTextWithHighlight(multiplyCells.c22, formatNumber(c[1][1]), highlight);
}

function updateAnalysisOverlayVisibility() {
  if (!analysisOverlay) {
    return;
  }
  const showVector = vectorResults && !vectorResults.classList.contains("hidden");
  const showMultiply = matrixMultiplyPanel && !matrixMultiplyPanel.classList.contains("hidden");
  analysisOverlay.classList.toggle("hidden", !showVector && !showMultiply);
}

const matrixUIA = initMatrixUI({
  inputIds: ["m11", "m12", "m21", "m22"],
  applyButton: applyABtn,
  onPendingChange: (next) => {
    pendingMatrixA = next;
    updateInverseStateA(next);
    updateMultiplyDisplay();
  },
  onApply: async (next) => {
    pendingMatrixA = next;
    updateInverseStateA(next);
    updateMultiplyDisplay();
    const applied = cloneMatrix(pendingMatrixA);
    await runApplySequence("applyA", applied, async (base) => {
      const target = multiplyMatrix(applied, base);
      currentMatrix = target;
      await animateTransformAsync(base, target);
    });
  }
});

const matrixUIB = initMatrixUI({
  inputIds: ["m11b", "m12b", "m21b", "m22b"],
  applyButton: applyBBtn,
  onPendingChange: (next) => {
    pendingMatrixB = next;
    updateInverseStateB(next);
    updateMultiplyDisplay();
  },
  onApply: async (next) => {
    pendingMatrixB = next;
    updateInverseStateB(next);
    updateMultiplyDisplay();
    const applied = cloneMatrix(pendingMatrixB);
    await runApplySequence("applyB", applied, async (base) => {
      const target = multiplyMatrix(applied, base);
      currentMatrix = target;
      await animateTransformAsync(base, target);
    });
  }
});

initTheme();

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-theme");
  setTheme(isDark ? "light-theme" : "dark-theme");
});

resetBtn.addEventListener("click", () => {
  const reset = identityMatrix();
  pendingMatrixA = reset;
  pendingMatrixB = reset;
  currentMatrix = reset;
  lastApply = null;
  actionLocked = false;
  syncActionButtons();
  matrixUIA.setMatrix(reset);
  matrixUIB.setMatrix(reset);
  updateInverseStateA(reset);
  updateInverseStateB(reset);
  updateMultiplyDisplay();
  resetRenderer();
  if (vectorToggle) {
    setVectorVisibility(vectorToggle.checked);
  }
});

if (applyInverseBtn) {
  applyInverseBtn.addEventListener("click", async () => {
    const inverse = invertMatrix(pendingMatrixA);
    if (!inverse) {
      return;
    }
    const applied = cloneMatrix(inverse);
    await runApplySequence("applyInverseA", applied, async (base) => {
      const target = multiplyMatrix(applied, base);
      currentMatrix = target;
      await animateTransformAsync(base, target);
    });
  });
}

if (applyInverseBBtn) {
  applyInverseBBtn.addEventListener("click", async () => {
    const inverse = invertMatrix(pendingMatrixB);
    if (!inverse) {
      return;
    }
    const applied = cloneMatrix(inverse);
    await runApplySequence("applyInverseB", applied, async (base) => {
      const target = multiplyMatrix(applied, base);
      currentMatrix = target;
      await animateTransformAsync(base, target);
    });
  });
}

applyComposeBtn.addEventListener("click", async () => {
  const a = cloneMatrix(pendingMatrixA);
  const b = cloneMatrix(pendingMatrixB);
  await runApplySequence("applyCompose", { a, b }, async (base) => {
    const composed = multiplyMatrix(a, b);
    const mid = multiplyMatrix(b, base);
    const target = multiplyMatrix(composed, base);
    currentMatrix = target;
    await animateTransformAsync(base, mid);
    await animateTransformAsync(mid, target);
  });
});

function setMode(mode) {
  const isCompose = mode === "compose";
  matrixBControl.classList.toggle("hidden", !isCompose);
  applyBBtn.classList.toggle("hidden", !isCompose);
  applyComposeBtn.classList.toggle("hidden", !isCompose);
  if (inversePanelB) {
    inversePanelB.classList.toggle("hidden", !isCompose);
  }
  if (composeActions) {
    composeActions.classList.toggle("hidden", !isCompose);
  }
  if (matrixMultiplyPanel) {
    matrixMultiplyPanel.classList.toggle("hidden", !isCompose);
  }
  if (currentMatrixLabel) {
    currentMatrixLabel.textContent = isCompose ? "A × B =" : "A =";
  }
  updateAnalysisOverlayVisibility();
}

modeRadios.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    setMode(event.target.value);
  });
});

setMode("single");

updateInverseStateA(pendingMatrixA);
updateInverseStateB(pendingMatrixB);
updateMultiplyDisplay();

if (vectorToggle) {
  const setVectorEnabled = (enabled) => {
    if (vectorPanel) {
      vectorPanel.classList.toggle("hidden", !enabled);
    }
    if (vectorResults) {
      vectorResults.classList.toggle("hidden", !enabled);
    }
    setVectorVisibility(enabled);
    updateAnalysisOverlayVisibility();
  };

  vectorToggle.addEventListener("change", (event) => {
    setVectorEnabled(event.target.checked);
  });

  setVectorEnabled(vectorToggle.checked);
}
