import { determinant, identityMatrix, invertMatrix, multiplyMatrix } from "./matrix.js";
import { animateTransform, animateTransformAsync, DEFAULT_VECTOR, getCurrentMatrix, initRenderer, renderMatrix, resetRenderer, setVector } from "./render.js";
import { initInverseUI, initMatrixUI, initVectorUI, updateStats } from "./ui.js";

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
const modeRadios = document.querySelectorAll('input[name="mode"]');

let currentMatrix = identityMatrix();
let pendingMatrixA = identityMatrix();
let pendingMatrixB = identityMatrix();
let rendererReady = false;

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

function updateInverseStateA(matrix) {
  const det = determinant(matrix);
  const inverse = invertMatrix(matrix);
  const invertible = Boolean(inverse);
  const displayDet = invertible ? det : 0;
  inverseUI.setInverse({ inverse, invertible, det: displayDet });
  if (applyInverseBtn) {
    applyInverseBtn.disabled = !invertible;
  }
  return inverse;
}

function updateInverseStateB(matrix) {
  const det = determinant(matrix);
  const inverse = invertMatrix(matrix);
  const invertible = Boolean(inverse);
  const displayDet = invertible ? det : 0;
  inverseUIB.setInverse({ inverse, invertible, det: displayDet });
  if (applyInverseBBtn) {
    applyInverseBBtn.disabled = !invertible;
  }
  return inverse;
}

const matrixUIA = initMatrixUI({
  inputIds: ["m11", "m12", "m21", "m22"],
  applyButton: applyABtn,
  onPendingChange: (next) => {
    pendingMatrixA = next;
    updateInverseStateA(next);
  },
  onApply: (next) => {
    pendingMatrixA = next;
    updateInverseStateA(next);
    const previous = getCurrentMatrix();
    const target = multiplyMatrix(pendingMatrixA, previous);
    currentMatrix = target;
    animateTransform(previous, target);
  }
});

const matrixUIB = initMatrixUI({
  inputIds: ["m11b", "m12b", "m21b", "m22b"],
  applyButton: applyBBtn,
  onPendingChange: (next) => {
    pendingMatrixB = next;
    updateInverseStateB(next);
  },
  onApply: (next) => {
    pendingMatrixB = next;
    updateInverseStateB(next);
    const previous = getCurrentMatrix();
    const target = multiplyMatrix(pendingMatrixB, previous);
    currentMatrix = target;
    animateTransform(previous, target);
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
  matrixUIA.setMatrix(reset);
  matrixUIB.setMatrix(reset);
  updateInverseStateA(reset);
  updateInverseStateB(reset);
  resetRenderer();
});

if (applyInverseBtn) {
  applyInverseBtn.addEventListener("click", () => {
    const inverse = invertMatrix(pendingMatrixA);
    if (!inverse) {
      return;
    }
    const start = getCurrentMatrix();
    const target = multiplyMatrix(inverse, start);
    currentMatrix = target;
    animateTransform(start, target);
  });
}

if (applyInverseBBtn) {
  applyInverseBBtn.addEventListener("click", () => {
    const inverse = invertMatrix(pendingMatrixB);
    if (!inverse) {
      return;
    }
    const start = getCurrentMatrix();
    const target = multiplyMatrix(inverse, start);
    currentMatrix = target;
    animateTransform(start, target);
  });
}

applyComposeBtn.addEventListener("click", async () => {
  const a = pendingMatrixA;
  const b = pendingMatrixB;
  const composed = multiplyMatrix(a, b);
  const start = getCurrentMatrix();
  currentMatrix = composed;
  await animateTransformAsync(start, b);
  await animateTransformAsync(b, composed);
});

function setMode(mode) {
  const isCompose = mode === "compose";
  matrixBControl.classList.toggle("hidden", !isCompose);
  applyBBtn.classList.toggle("hidden", !isCompose);
  applyComposeBtn.classList.toggle("hidden", !isCompose);
  if (inversePanelB) {
    inversePanelB.classList.toggle("hidden", !isCompose);
  }
}

modeRadios.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    setMode(event.target.value);
  });
});

setMode("single");

updateInverseStateA(pendingMatrixA);
updateInverseStateB(pendingMatrixB);
