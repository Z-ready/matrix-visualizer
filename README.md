# Matrix Linear Transformation Visualizer

> **See the geometry behind 2×2 matrices in real-time**

An interactive web-based tool that brings linear algebra to life. Edit matrix values and watch how vectors, grids, and shapes transform in real time.

![Linear Transformation Visualization](https://img.shields.io/badge/Linear%20Algebra-Interactive-blue) ![Responsive Design](https://img.shields.io/badge/Design-Responsive-brightgreen)

## ✨ Features

- **Real-time Visualization** — Instantly see how 2×2 matrices transform 2D space
- **Matrix Inputs** — Edit values directly and animate transitions
- **Single + Composition Modes** — Apply A, B, or A∘B to understand composition
- **Grid, Axes, and Unit Square** — See how coordinate systems and area change
- **Basis Vectors + Eigenvectors** — Color-coded basis vectors and real eigenvector hints
- **Canvas Rendering** — Smooth graphics with zoom and pan controls
- **Theme Toggle** — Light and dark themes
- **Responsive Layout** — Works well on desktop and tablet

## 🚀 Quick Start

1. **Open in Browser** — No installation needed. Just open `index.html` in your browser
2. **Adjust the Matrix** — Use the input fields to modify matrix values
3. **Apply Transform** — Click `Apply A`, `Apply B`, or `Apply A∘B`
4. **Explore** — Try these matrices:
   - **Rotation**: `[[0, -1], [1, 0]]`
   - **Scale**: `[[2, 0], [0, 2]]`
   - **Shear**: `[[1, 1], [0, 1]]`
   - **Reflection**: `[[-1, 0], [0, 1]]`
   - **Singular**: `[[1, 1], [0, 0]]`

## 📊 Understanding the Visualization

- **Red Vector** — Transformation of the basis vector *i* (1, 0)
- **Teal Vector** — Transformation of the basis vector *j* (0, 1)
- **Unit Square** — Shows area scaling and orientation
- **Eigenvectors** — Dashed lines for real eigenvectors (when they exist)
- **Grid** — The underlying 2D space before and after transformation
- **Zoom & Pan** — Scroll to zoom, drag to move around the canvas

## 💻 Tech Stack

- **HTML5 Canvas** — Efficient 2D graphics rendering
- **Vanilla JavaScript** — Zero dependencies, pure JS implementation
- **CSS3** — Modern, responsive styling with gradient backgrounds
- **No Build Tools** — Works directly from source files

## 📁 Project Structure

```
matrix-visualizer/

├── index.html      
├── main.js         
├── render.js       
├── matrix.js       
├── ui.js           
├── style.css       
└── README.md       
```

## 🎯 Use Cases

✓ **Students** — Visualize concepts from linear algebra courses
✓ **Educators** — Interactive tool for teaching matrix transformations
✓ **Developers** — Understanding graphics transforms and 2D coordinate systems
✓ **Enthusiasts** — Exploring the beauty of mathematical transformations

## 🔧 Browser Support

Works on all modern browsers supporting HTML5 Canvas:
- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Design Philosophy

This tool prioritizes clarity and interactivity. Every visual element serves an educational purpose, from the color-coded basis vectors to the animated transformations.

## 📝 License

This project is licensed under the **MIT License** — free to use for any purpose, including commercial projects. See the [LICENSE](LICENSE) file for details.

---

**Questions or ideas?** Feel free to explore the code and experiment with different matrices. The best way to understand linear transformations is to play with them!
