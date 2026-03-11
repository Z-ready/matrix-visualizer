import { identityMatrix } from "./matrix.js";
import { animateTransform, getCurrentMatrix, initRenderer } from "./render.js";
import { initMatrixUI, updateStats } from "./ui.js";

const canvas = document.getElementById("viz");
const vizStage = document.getElementById("vizStage");
const applyBtn = document.getElementById("apply");

let currentMatrix = identityMatrix();
let pendingMatrix = identityMatrix();

initRenderer({
  canvasEl: canvas,
  stageEl: vizStage,
  onStatsChange: updateStats
});

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
