import { identityMatrix, lerpMatrix, transformPoint, determinant } from "./matrix.js";

const basePalette = {
  asagi: "#33A6B8",
  ai: "#0D5661",
  kamenozoki: "#A5DEE4",
  yamabuki: "#FFB11B",
  momo: "#F596AA",
  karakurenai: "#D0104C"
};

const gridSpacing = 1;
const gridMajorEvery = 5;
const maxGridLines = 100;
const degenerateDetThreshold = 1e-6;

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
  animationComplete: null,
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
  state.animationComplete = null;
  requestAnimationFrame(animate);
}

export function animateTransformAsync(fromMatrix, toMatrix) {
  return new Promise((resolve) => {
    state.animationStart = fromMatrix;
    state.targetMatrix = toMatrix;
    state.startTime = performance.now();
    state.animating = true;
    state.animationComplete = resolve;
    requestAnimationFrame(animate);
  });
}

export function resetRenderer() {
  const base = identityMatrix();
  state.currentMatrix = identityMatrix();
  state.targetMatrix = identityMatrix();
  state.animationStart = identityMatrix();
  state.startTime = 0;
  state.animating = false;
  state.pan = { x: 0, y: 0 };
  state.zoom = 24;
  state.dragging = false;
  state.dragStart = { x: 0, y: 0 };
  state.panStart = { x: 0, y: 0 };
  drawScene(base);
  if (onStatsChange) {
    onStatsChange(base);
  }
}

function getThemePalette() {
  const isDark = document.body.classList.contains("dark-theme");
  return {
    referenceGrid: "rgba(165, 222, 228, 0.3)",
    transformedGrid: isDark ? basePalette.kamenozoki : basePalette.asagi,
    axis: isDark ? basePalette.kamenozoki : basePalette.ai,
    axisLabel: isDark ? basePalette.kamenozoki : basePalette.ai,
    eigenvector: isDark ? "rgba(165, 222, 228, 0.7)" : "rgba(13, 86, 97, 0.7)",
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

function worldToScreen(x, y) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const midX = width / 2 + state.pan.x * state.zoom;
  const midY = height / 2 - state.pan.y * state.zoom;
  return { x: midX + x * state.zoom, y: midY - y * state.zoom };
}

function canvasToWorld(x, y) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const midX = width / 2 + state.pan.x * state.zoom;
  const midY = height / 2 - state.pan.y * state.zoom;
  return [(x - midX) / state.zoom, (midY - y) / state.zoom];
}

function getVisibleWorldBounds() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const corners = [
    canvasToWorld(0, 0),
    canvasToWorld(width, 0),
    canvasToWorld(width, height),
    canvasToWorld(0, height)
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of corners) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  return { minX, maxX, minY, maxY };
}

function drawGrid(matrix, isReference) {
  const palette = getThemePalette();
  const bounds = getVisibleWorldBounds();
  const overscan = 2;
  const gMinX = bounds.minX - overscan;
  const gMaxX = bounds.maxX + overscan;
  const gMinY = bounds.minY - overscan;
  const gMaxY = bounds.maxY + overscan;

  let startX = Math.floor(gMinX / gridSpacing) * gridSpacing;
  let endX = Math.ceil(gMaxX / gridSpacing) * gridSpacing;
  let startY = Math.floor(gMinY / gridSpacing) * gridSpacing;
  let endY = Math.ceil(gMaxY / gridSpacing) * gridSpacing;

  let countX = Math.floor((endX - startX) / gridSpacing) + 1;
  let countY = Math.floor((endY - startY) / gridSpacing) + 1;

  if (countX > maxGridLines) {
    const midX = (startX + endX) / 2;
    const half = Math.floor(maxGridLines / 2);
    startX = Math.floor(midX / gridSpacing) * gridSpacing - half * gridSpacing;
    endX = startX + (maxGridLines - 1) * gridSpacing;
    countX = maxGridLines;
  }

  if (countY > maxGridLines) {
    const midY = (startY + endY) / 2;
    const half = Math.floor(maxGridLines / 2);
    startY = Math.floor(midY / gridSpacing) * gridSpacing - half * gridSpacing;
    endY = startY + (maxGridLines - 1) * gridSpacing;
    countY = maxGridLines;
  }

  ctx.strokeStyle = isReference ? palette.referenceGrid : palette.transformedGrid;

  for (let i = 0; i < countX; i += 1) {
    const x = startX + i * gridSpacing;
    const thick = Math.round(x / gridSpacing) % gridMajorEvery === 0;
    ctx.lineWidth = thick ? 1.4 : 0.6;
    const vStart = transformPoint(matrix, x, startY);
    const vEnd = transformPoint(matrix, x, endY);
    drawLine(vStart, vEnd);
  }

  for (let i = 0; i < countY; i += 1) {
    const y = startY + i * gridSpacing;
    const thick = Math.round(y / gridSpacing) % gridMajorEvery === 0;
    ctx.lineWidth = thick ? 1.4 : 0.6;
    const hStart = transformPoint(matrix, startX, y);
    const hEnd = transformPoint(matrix, endX, y);
    drawLine(hStart, hEnd);
  }
}

function drawAxes() {
  const palette = getThemePalette();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = palette.axis;

  const bounds = getVisibleWorldBounds();
  const overscan = 2;
  const minX = bounds.minX - overscan;
  const maxX = bounds.maxX + overscan;
  const minY = bounds.minY - overscan;
  const maxY = bounds.maxY + overscan;

  drawLine([minX, 0], [maxX, 0]);
  drawLine([0, minY], [0, maxY]);

  drawAxisArrow([maxX, 0], [maxX - 0.8, 0.4]);
  drawAxisArrow([maxX, 0], [maxX - 0.8, -0.4]);
  drawAxisArrow([0, maxY], [0.4, maxY - 0.8]);
  drawAxisArrow([0, maxY], [-0.4, maxY - 0.8]);
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

  const bounds = getVisibleWorldBounds();
  const overscan = 1;
  const minX = Math.floor(bounds.minX - overscan);
  const maxX = Math.ceil(bounds.maxX + overscan);
  const minY = Math.floor(bounds.minY - overscan);
  const maxY = Math.ceil(bounds.maxY + overscan);

  const labelStep = gridMajorEvery * gridSpacing;
  const startX = Math.floor(minX / labelStep) * labelStep;
  const endX = Math.ceil(maxX / labelStep) * labelStep;
  const startY = Math.floor(minY / labelStep) * labelStep;
  const endY = Math.ceil(maxY / labelStep) * labelStep;

  for (let i = startX; i <= endX; i += labelStep) {
    const point = worldToScreen(i, 0);
    ctx.fillText(`${i}`, point.x, point.y + 14);
  }

  ctx.textAlign = "left";
  for (let i = startY; i <= endY; i += labelStep) {
    if (i === 0) {
      continue;
    }
    const point = worldToScreen(0, i);
    ctx.fillText(`${i}`, point.x + 8, point.y);
  }
}

function drawLine(start, end) {
  const s = worldToScreen(start[0], start[1]);
  const e = worldToScreen(end[0], end[1]);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();
}

function drawArrow(x, y, color) {
  const s = worldToScreen(0, 0);
  const e = worldToScreen(x, y);
  const angle = Math.atan2(e.y - s.y, e.x - s.x);
  const head = 10;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(e.x - head * Math.cos(angle - Math.PI / 6), e.y - head * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(e.x - head * Math.cos(angle + Math.PI / 6), e.y - head * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function computeRealEigenvectors(matrix) {
  const a = matrix[0][0];
  const b = matrix[0][1];
  const c = matrix[1][0];
  const d = matrix[1][1];
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;
  if (disc < 0) {
    return [];
  }
  const sqrtDisc = Math.sqrt(disc);
  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  const vectors = [];
  const addVector = (vx, vy) => {
    const len = Math.hypot(vx, vy);
    if (len < 1e-6) {
      return;
    }
    const nx = vx / len;
    const ny = vy / len;
    for (const [ex, ey] of vectors) {
      const cross = Math.abs(nx * ey - ny * ex);
      if (cross < 1e-3) {
        return;
      }
    }
    vectors.push([nx, ny]);
  };

  const solveEigenvector = (lambda) => {
    const m11 = a - lambda;
    const m22 = d - lambda;
    if (Math.abs(b) > 1e-6 || Math.abs(m11) > 1e-6) {
      addVector(-b, m11);
      return;
    }
    if (Math.abs(c) > 1e-6 || Math.abs(m22) > 1e-6) {
      addVector(m22, -c);
      return;
    }
  };

  solveEigenvector(lambda1);
  solveEigenvector(lambda2);

  if (vectors.length === 0) {
    // Scalar matrix: all directions are eigenvectors. Show axes for clarity.
    addVector(1, 0);
    addVector(0, 1);
  }

  return vectors;
}

function drawEigenvectors(matrix) {
  const palette = getThemePalette();
  const vectors = computeRealEigenvectors(matrix);
  if (vectors.length === 0) {
    return;
  }
  const bounds = getVisibleWorldBounds();
  const overscan = 2;
  const maxRange = Math.max(
    Math.abs(bounds.minX),
    Math.abs(bounds.maxX),
    Math.abs(bounds.minY),
    Math.abs(bounds.maxY)
  ) + overscan;

  ctx.save();
  ctx.strokeStyle = palette.eigenvector;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 6]);
  for (const [vx, vy] of vectors) {
    const dx = vx * maxRange;
    const dy = vy * maxRange;
    drawLine([-dx, -dy], [dx, dy]);
  }
  ctx.restore();
}

function drawUnitSquare(matrix) {
  const palette = getThemePalette();
  const p0 = transformPoint(matrix, 0, 0);
  const p1 = transformPoint(matrix, 1, 0);
  const p2 = transformPoint(matrix, 1, 1);
  const p3 = transformPoint(matrix, 0, 1);

  const p0s = worldToScreen(p0[0], p0[1]);
  const p1s = worldToScreen(p1[0], p1[1]);
  const p2s = worldToScreen(p2[0], p2[1]);
  const p3s = worldToScreen(p3[0], p3[1]);

  ctx.fillStyle = palette.squareFill;
  ctx.strokeStyle = palette.squareStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p0s.x, p0s.y);
  ctx.lineTo(p1s.x, p1s.y);
  ctx.lineTo(p2s.x, p2s.y);
  ctx.lineTo(p3s.x, p3s.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawCollapsedLine(matrix) {
  const palette = getThemePalette();
  const v1 = { x: matrix[0][0], y: matrix[1][0] };
  const v2 = { x: matrix[0][1], y: matrix[1][1] };
  let dir = Math.hypot(v1.x, v1.y) > 1e-6 ? v1 : v2;
  const len = Math.hypot(dir.x, dir.y);
  if (len <= 1e-6) {
    return;
  }
  dir = { x: dir.x / len, y: dir.y / len };

  const bounds = getVisibleWorldBounds();
  const overscan = 2;
  const corners = [
    { x: bounds.minX - overscan, y: bounds.minY - overscan },
    { x: bounds.maxX + overscan, y: bounds.minY - overscan },
    { x: bounds.maxX + overscan, y: bounds.maxY + overscan },
    { x: bounds.minX - overscan, y: bounds.maxY + overscan }
  ];

  let maxProj = 0;
  for (const corner of corners) {
    const proj = Math.abs(corner.x * dir.x + corner.y * dir.y);
    if (proj > maxProj) {
      maxProj = proj;
    }
  }

  const L = Math.max(10, maxProj);
  const p1 = { x: -dir.x * L, y: -dir.y * L };
  const p2 = { x: dir.x * L, y: dir.y * L };

  ctx.strokeStyle = palette.transformedGrid;
  ctx.lineWidth = 1.4;
  drawLine([p1.x, p1.y], [p2.x, p2.y]);
}

function drawScene(matrix) {
  const palette = getThemePalette();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const det = determinant(matrix);
  const isDegenerate = Math.abs(det) < degenerateDetThreshold;

  drawGrid(identityMatrix(), true);
  drawAxes();
  drawLabels();
  if (!isDegenerate) {
    drawEigenvectors(matrix);
  }
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
    if (state.animationComplete) {
      const done = state.animationComplete;
      state.animationComplete = null;
      done();
    }
  }
}

function clampPan() {
  // Infinite grid: no pan clamping.
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

  const newScreen = worldToScreen(worldX, worldY);
  const shiftX = (mouseX - newScreen.x) / state.zoom;
  const shiftY = (newScreen.y - mouseY) / state.zoom;
  state.pan.x += shiftX;
  state.pan.y += shiftY;

  clampPan();
  drawScene(state.currentMatrix);
}
