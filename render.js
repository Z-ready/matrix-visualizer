import { identityMatrix, lerpMatrix, transformPoint, invertMatrix } from "./matrix.js";

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
  const minX = Math.floor(bounds.minX - overscan);
  const maxX = Math.ceil(bounds.maxX + overscan);
  const minY = Math.floor(bounds.minY - overscan);
  const maxY = Math.ceil(bounds.maxY + overscan);

  const inv = invertMatrix(matrix);
  if (!inv) {
    return;
  }

  const corners = [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY]
  ].map(([x, y]) => transformPoint(inv, x, y));

  let gMinX = Infinity;
  let gMaxX = -Infinity;
  let gMinY = Infinity;
  let gMaxY = -Infinity;
  for (const [x, y] of corners) {
    gMinX = Math.min(gMinX, x);
    gMaxX = Math.max(gMaxX, x);
    gMinY = Math.min(gMinY, y);
    gMaxY = Math.max(gMaxY, y);
  }

  const startX = Math.floor(gMinX / gridSpacing) * gridSpacing;
  const endX = Math.ceil(gMaxX / gridSpacing) * gridSpacing;
  const startY = Math.floor(gMinY / gridSpacing) * gridSpacing;
  const endY = Math.ceil(gMaxY / gridSpacing) * gridSpacing;

  ctx.strokeStyle = isReference ? palette.referenceGrid : palette.transformedGrid;

  for (let x = startX; x <= endX; x += gridSpacing) {
    const thick = Math.round(x / gridSpacing) % gridMajorEvery === 0;
    ctx.lineWidth = thick ? 1.4 : 0.6;
    const vStart = transformPoint(matrix, x, startY);
    const vEnd = transformPoint(matrix, x, endY);
    drawLine(vStart, vEnd);
  }

  for (let y = startY; y <= endY; y += gridSpacing) {
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
    const [x, y] = worldToCanvas(i, 0);
    ctx.fillText(`${i}`, x, y + 14);
  }

  ctx.textAlign = "left";
  for (let i = startY; i <= endY; i += labelStep) {
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
  drawEigenvectors(matrix);

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

  const [newScreenX, newScreenY] = worldToCanvas(worldX, worldY);
  const shiftX = (mouseX - newScreenX) / state.zoom;
  const shiftY = (newScreenY - mouseY) / state.zoom;
  state.pan.x += shiftX;
  state.pan.y += shiftY;

  clampPan();
  drawScene(state.currentMatrix);
}
