export function identityMatrix() {
  return [
    [1, 0],
    [0, 1]
  ];
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpMatrix(a, b, t) {
  return [
    [lerp(a[0][0], b[0][0], t), lerp(a[0][1], b[0][1], t)],
    [lerp(a[1][0], b[1][0], t), lerp(a[1][1], b[1][1], t)]
  ];
}

export function determinant(matrix) {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

export function transformPoint(matrix, x, y) {
  return [
    matrix[0][0] * x + matrix[0][1] * y,
    matrix[1][0] * x + matrix[1][1] * y
  ];
}
