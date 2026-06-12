# Matrix Linear Transformation Visualizer

**Live demo:** https://z-ready.github.io/matrix-visualizer/

Interactive visualization of 2×2 matrix linear transformations. Change the matrix entries and see how the plane, basis vectors, unit square, and optional test vector are transformed.

## Demo



## Why I built this

I built this project while learning linear algebra and wanting a clearer way to understand what matrix multiplication is doing geometrically.

For 2×2 transformations, the equations are compact, but they can still be hard to interpret on their own. This tool helps build geometric intuition by showing how a matrix transforms space, not just how it changes a list of numbers.

## What this visualizer shows

This project is an educational linear algebra tool focused on the ideas behind 2×2 linear transformations:

- Basis vectors and how the standard basis changes under a matrix
- Grid transformation across the 2D plane
- The unit square and how its shape and orientation change
- Determinant as signed area scaling
- Real eigenvectors, when they exist
- Composition of transformations using matrix multiplication
- Invertibility through the displayed inverse matrix and determinant

## Features

- Edit the entries of matrix A directly and animate the resulting transformation
- Switch between single-matrix mode and composition mode with matrices A and B
- Apply `A`, `B`, `A × B`, `A⁻¹`, or `B⁻¹` when the inverse exists
- Compare the reference grid with the transformed grid on the canvas
- Track the transformed basis vectors, determinant, and unit area in the analysis panel
- Show an optional vector `v` and compare `v` with its transformed result
- Display real eigenvector directions as dashed lines when they exist
- Pan and zoom the canvas to inspect transformations more closely
- Reset back to the identity transformation at any time

## Quick Start

1. Open the live demo: https://z-ready.github.io/matrix-visualizer/
2. Change the matrix values for `A` or switch to composition mode and edit `A` and `B`
3. Try matrices such as rotation, scale, shear, reflection, and singular examples

## Good matrices to try

- Identity: `[[1, 0], [0, 1]]`
- Rotation 90°: `[[0, -1], [1, 0]]`
- Scale: `[[2, 0], [0, 2]]`
- Shear: `[[1, 1], [0, 1]]`
- Reflection: `[[-1, 0], [0, 1]]`
- Singular: `[[1, 1], [0, 0]]`

## Suggested GitHub topics

`linear-algebra`, `matrix`, `visualization`, `education`, `mathematics`, `javascript`, `canvas`, `eigenvectors`, `linear-transformations`

## Tech Stack

- Vanilla JavaScript
- HTML5 Canvas
- CSS
- No build step

## License

This project is licensed under the [MIT License](LICENSE).
