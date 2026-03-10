# Matrix Linear Transformation Visualizer

> **See the geometry behind 2×2 matrices in real-time**

An interactive web-based tool that brings linear algebra to life. Adjust matrix values with sliders and watch how vectors, basis functions, and geometric shapes transform right before your eyes.

![Linear Transformation Visualization](https://img.shields.io/badge/Linear%20Algebra-Interactive-blue) ![Responsive Design](https://img.shields.io/badge/Design-Responsive-brightgreen)

## ✨ Features

- **Real-time Visualization** — Instantly see how 2×2 matrices transform 2D space
- **Interactive Sliders** — Smoothly adjust matrix elements and watch transformations animate
- **Grid & Basis Vectors** — Understand how coordinate systems change under transformation
- **Canvas-based Rendering** — Smooth, high-performance graphics with zoom and pan controls
- **Educational Focus** — Perfect for learning linear algebra concepts visually
- **Responsive Design** — Works seamlessly on desktop and tablet devices

## 🚀 Quick Start

1. **Open in Browser** — No installation needed. Just open `docs/index.html` in your browser
2. **Adjust the Matrix** — Use input fields or drag sliders to modify matrix values
3. **Apply Transform** — Click "Apply Transform" to animate the change
4. **Explore** — Try preset matrices:
   - **Rotation**: `[[0, -1], [1, 0]]`
   - **Scale**: `[[2, 0], [0, 2]]`
   - **Shear**: `[[1, 1], [0, 1]]`
   - **Reflection**: `[[-1, 0], [0, 1]]`

## 📊 Understanding the Visualization

- **Red Vector** — Transformation of the basis vector *i* (1, 0)
- **Teal Vector** — Transformation of the basis vector *j* (0, 1)
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
├── docs/
│   ├── index.html      # Main application
│   ├── main.js         # Core visualization logic
│   └── style.css       # Styling and layout
└── README.md           # This file
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
