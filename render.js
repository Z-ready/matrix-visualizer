import { identityMatrix, lerpMatrix, transformPoint } from "./matrix.js";

const basePalette = {
  asagi: "#33A6B8",
  ai: "#0D5661",
  kamenozoki: "#A5DEE4",
  yamabuki: "#FFB11B",
  momo: "#F596AA",
  karakurenai: "#D0104C"
};

const gridRange = 50;

let canvas;
let ctx;
let stage;
let onStatsChange;

const state = {
  currentMatrix: identityMatrix(),
  targetMatrix: identityMatrix(),
  animationStart: identityMatrix(),
  startTime: 0,
  duration: 1800,
  animating: false,
  pan: { x: 0, y: 0 },
  zoom: 24,
  minZoom: 10,
  maxZoom: 80,
  dragging: false,
  dragStart: { x: 0, y: 0 },
  panStart: { x: 0, y: 0 }
};

export function initRenderer({ canvasEl, stageEl, onStatsChange: statsCallback }) {
  canvas = canvasEl;
  stage = stageEl;
  ctx = canvas.getContext("2d");
  onStatsChange = statsCallback;

  canvas.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("wheel", handleWheel, { passive: false });

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      resizeCanvas();
      clampPan();
    });
    observer.observe(stage);
  } else {
    window.addEventListener("resize", () => {
      resizeCanvas();
      clampPan();
    });
  }

  resizeCanvas();
  renderMatrix(state.currentMatrix);
}

export function getCurrentMatrix() {
  return state.currentMatrix;
}

export function renderMatrix(matrix) {
  state.currentMatrix = matrix;
  drawScene(matrix);
  if (onStatsChange) {
    onStatsChange(matrix);
  }
}

export function animateTransform(fromMatrix, toMatrix) {
  state.animationStart = fromMatrix;
  state.targetMatrix = toMatrix;
  state.startTime = performance.now();
  state.animating = true;
  requestAnimationFrame(animate);
}

function getThemePalette() {
  const isDark = document.body.classList.contains("dark-theme");
  return {
    referenceGrid: "rgba(165, 222, 228, 0.3)",
    transformedGrid: isDark ? basePalette.kamenozoki : basePalette.asagi,
    axis: isDark ? basePalette.kamenozoki : basePalette.ai,
    axisLabel: isDark ? basePalette.kamenozoki : basePalette.ai,
    basisI: basePalette.karakurenai,
    basisJ: basePalette.yamabuki,
    squareFill: isDark ? "rgba(245, 150, 170, 0.45)" : "rgba(245, 150, 170, 0.35)",
    squareStroke: basePalette.karakurenai
  };
}

function resizeCanvas() {
  if (!canvas || !stage) {
    return;
  }
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, stage.clientWidth);
  const height = Math.max(320, stage.clientHeight);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawScene(state.currentMatrix);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function worldToCanvas(x, y) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const midX = width / 2 + state.pan.x * state.zoom;
  const midY = height / 2 - state.pan.y * state.zoom;
  return [midX + x * state.zoom, midY - y * state.zoom];
}

function canvasToWorld(x, y) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const midX = width / 2 + state.pan.x * state.zoom;
  const midY = height / 2 - state.pan.y * state.zoom;
  return [(x - midX) / state.zoom, (midY - y) / state.zoom];
}

function drawGrid(matrix, isReference) {
  const palette = getThemePalette();
  for (let i = -gridRange; i <= gridRange; i += 1) {
    const thick = i % 5 === 0;
    ctx.lineWidth = thick ? 1.4 : 0.6;
    ctx.strokeStyle = isReference ? palette.referenceGrid : palette.transformedGrid;

    const vStart = transformPoint(matrix, i, -gridRange);
    const vEnd = transformPoint(matrix, i, gridRange);
    drawLine(vStart, vEnd);

    const hStart = transformPoint(matrix, -gridRange, i);
    const hEnd = transformPoint(matrix, gridRange, i);
    drawLine(hStart, hEnd);
  }
}

function drawAxes() {
  const palette = getThemePalette();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = palette.axis;

  drawLine([-gridRange, 0], [gridRange, 0]);
  drawLine([0, -gridRange], [0, gridRange]);

  drawAxisArrow([gridRange, 0], [gridRange - 0.8, 0.4]);
  drawAxisArrow([gridRange, 0], [gridRange - 0.8, -0.4]);
  drawAxisArrow([0, gridRange], [0.4, gridRange - 0.8]);
  drawAxisArrow([0, gridRange], [-0.4, gridRange - 0.8]);
}

function drawAxisArrow(tip, base) {
  drawLine(base, tip);
}

function drawLabels() {
  const palette = getThemePalette();
  ctx.fillStyle = palette.axisLabel;
  ctx.font = "12px Space Grotesk, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = -gridRange; i <= gridRange; i += 5) {
    const [x, y] = worldToCanvas(i, 0);
    ctx.fillText(`${i}`, x, y + 14);
  }

  ctx.textAlign = "left";
  for (let i = -gridRange; i <= gridRange; i += 5) {
    if (i === 0) {
      continue;
    }
    const [x, y] = worldToCanvas(0, i);
    ctx.fillText(`${i}`, x + 8, y);
  }
}

function drawLine(start, end) {
  const [sx, sy] = worldToCanvas(start[0], start[1]);
  const [ex, ey] = worldToCanvas(end[0], end[1]);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();
}

function drawArrow(x, y, color) {
  const [sx, sy] = worldToCanvas(0, 0);
  const [ex, ey] = worldToCanvas(x, y);
  const angle = Math.atan2(ey - sy, ex - sx);
  const head = 10;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - head * Math.cos(angle - Math.PI / 6), ey - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(ex - head * Math.cos(angle + Math.PI / 6), ey - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function drawUnitSquare(matrix) {
  const palette = getThemePalette();
  const p0 = transformPoint(matrix, 0, 0);
  const p1 = transformPoint(matrix, 1, 0);
  const p2 = transformPoint(matrix, 1, 1);
  const p3 = transformPoint(matrix, 0, 1);

  const [x0, y0] = worldToCanvas(p0[0], p0[1]);
  const [x1, y1] = worldToCanvas(p1[0], p1[1]);
  const [x2, y2] = worldToCanvas(p2[0], p2[1]);
  const [x3, y3] = worldToCanvas(p3[0], p3[1]);

  ctx.fillStyle = palette.squareFill;
  ctx.strokeStyle = palette.squareStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawScene(matrix) {
  const palette = getThemePalette();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid(identityMatrix(), true);
  drawAxes();
  drawLabels();

  drawGrid(matrix, false);
  drawUnitSquare(matrix);

  const ex = transformPoint(matrix, 1, 0);
  const ey = transformPoint(matrix, 0, 1);
  drawArrow(ex[0], ex[1], palette.basisI);
  drawArrow(ey[0], ey[1], palette.basisJ);
}

function animate(timestamp) {
  if (!state.animating) {
    return;
  }
  const progress = Math.min((timestamp - state.startTime) / state.duration, 1);
  const eased = easeInOut(progress);
  state.currentMatrix = lerpMatrix(state.animationStart, state.targetMatrix, eased);
  drawScene(state.currentMatrix);
  if (onStatsChange) {
    onStatsChange(state.currentMatrix);
  }
  if (progress < 1) {
    requestAnimationFrame(animate);
  } else {
    state.animating = false;
  }
}

function clampPan() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const viewHalfX = width / (2 * state.zoom);
  const viewHalfY = height / (2 * state.zoom);
  const margin = 2;
  const maxX = Math.max(0, viewHalfX - margin);
  const maxY = Math.max(0, viewHalfY - margin);
  state.pan.x = Math.max(-maxX, Math.min(maxX, state.pan.x));
  state.pan.y = Math.max(-maxY, Math.min(maxY, state.pan.y));
}

function handlePointerDown(event) {
  state.dragging = true;
  state.dragStart.x = event.clientX;
  state.dragStart.y = event.clientY;
  state.panStart.x = state.pan.x;
  state.panStart.y = state.pan.y;
}

function handlePointerMove(event) {
  if (!state.dragging) {
    return;
  }
  const dx = (event.clientX - state.dragStart.x) / state.zoom;
  const dy = (event.clientY - state.dragStart.y) / state.zoom;
  state.pan.x = state.panStart.x + dx;
  state.pan.y = state.panStart.y - dy;
  clampPan();
  drawScene(state.currentMatrix);
}

function handlePointerUp() {
  state.dragging = false;
}

function handleWheel(event) {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const [worldX, worldY] = canvasToWorld(mouseX, mouseY);

  const delta = Math.sign(event.deltaY);
  const factor = delta > 0 ? 0.9 : 1.1;
  state.zoom = Math.max(state.minZoom, Math.min(state.maxZoom, state.zoom * factor));

  const [newScreenX, newScreenY] = worldToCanvas(worldX, worldY);
  const shiftX = (mouseX - newScreenX) / state.zoom;
  const shiftY = (newScreenY - mouseY) / state.zoom;
  state.pan.x += shiftX;
  state.pan.y += shiftY;

  clampPan();
  drawScene(state.currentMatrix);
}
