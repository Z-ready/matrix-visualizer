import { identityMatrix, multiplyMatrix } from "./matrix.js";
import { animateTransform, animateTransformAsync, getCurrentMatrix, initRenderer, renderMatrix, resetRenderer } from "./render.js";
import { initMatrixUI, updateStats } from "./ui.js";

const canvas = document.getElementById("viz");
const vizStage = document.getElementById("vizStage");
const applyABtn = document.getElementById("applyA");
const applyBBtn = document.getElementById("applyB");
const applyComposeBtn = document.getElementById("applyCompose");
const resetBtn = document.getElementById("reset");
const themeToggle = document.getElementById("themeToggle");
const matrixBControl = document.getElementById("matrixBControl");
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

initRenderer({
  canvasEl: canvas,
  stageEl: vizStage,
  onStatsChange: updateStats
});
rendererReady = true;

const matrixUIA = initMatrixUI({
  inputIds: ["m11", "m12", "m21", "m22"],
  applyButton: applyABtn,
  onPendingChange: (next) => {
    pendingMatrixA = next;
  },
  onApply: (next) => {
    pendingMatrixA = next;
    const previous = getCurrentMatrix();
    currentMatrix = pendingMatrixA;
    animateTransform(previous, currentMatrix);
  }
});

const matrixUIB = initMatrixUI({
  inputIds: ["m11b", "m12b", "m21b", "m22b"],
  applyButton: applyBBtn,
  onPendingChange: (next) => {
    pendingMatrixB = next;
  },
  onApply: (next) => {
    pendingMatrixB = next;
    const previous = getCurrentMatrix();
    currentMatrix = pendingMatrixB;
    animateTransform(previous, currentMatrix);
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
  resetRenderer();
});

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
}

modeRadios.forEach((radio) => {
  radio.addEventListener("change", (event) => {
    setMode(event.target.value);
  });
});

setMode("single");
