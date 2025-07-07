# PySculptor

A modern, AI-powered online Python IDE built with React, Vite, Tailwind CSS, Monaco Editor, and Pyodide. Write, run, and manage Python code in your browser with real-time execution, Copilot-style AI code completion, and a beautiful, glassmorphic neon UI.

## Features
- Split view: Monaco Editor & real-time Python output (Pyodide)
- Copilot-style AI code completion (Google Gemini backend)
- Prompt-to-code AI modal for natural language code generation
- File management: add, remove, rename, switch tabs
- Download/upload files, session saving with localStorage
- Theme switching: gradient dark, glassmorphism, neon
- Keyboard shortcuts & animated transitions
- Responsive, modern design with custom PySculptor branding

## Demo
[PySculptor Live](https://your-demo-link.com/)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/CrazyArpan/PySculptor.git
   cd PySculptor
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Building for Production
```bash
npm run build
# or
yarn build
```

### Preview Production Build
```bash
npm run preview
# or
yarn preview
```

## Project Structure
```
PySculptor/
├── public/           # Static assets (icons, Pyodide, etc.)
├── src/              # Source code
│   ├── assets/       # Images, SVGs, etc.
│   ├── components/   # Reusable React components
│   ├── App.tsx       # Main app layout and logic
│   ├── main.tsx      # App entry point
│   └── ...           # Styles, utils, etc.
├── index.html        # Main HTML file
├── package.json      # Project metadata and scripts
├── vite.config.ts    # Vite configuration
└── tailwind.config.js # Tailwind CSS config
```

## Customization
- Update branding, colors, and gradients in `tailwind.config.js` and `src/App.css`.
- Add or modify components in `src/components/`.
- Adjust editor settings and AI integration in `src/App.tsx`.
- Replace icons and assets in `public/` and `src/assets/`.

## License
This project is open source and available under the [MIT License](LICENSE).

---
Feel free to reach out if you have any questions or suggestions!
