import { identityMatrix } from "./matrix.js";
import { animateTransform, getCurrentMatrix, initRenderer, renderMatrix } from "./render.js";
import { initMatrixUI, updateStats } from "./ui.js";

const canvas = document.getElementById("viz");
const vizStage = document.getElementById("vizStage");
const applyBtn = document.getElementById("apply");
const themeToggle = document.getElementById("themeToggle");

let currentMatrix = identityMatrix();
let pendingMatrix = identityMatrix();
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

initMatrixUI({
  inputIds: ["m11", "m12", "m21", "m22"],
  applyButton: applyBtn,
  onPendingChange: (next) => {
    pendingMatrix = next;
  },
  onApply: (next) => {
    pendingMatrix = next;
    const previous = getCurrentMatrix();
    currentMatrix = pendingMatrix;
    animateTransform(previous, currentMatrix);
  }
});

initTheme();

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-theme");
  setTheme(isDark ? "light-theme" : "dark-theme");
});
