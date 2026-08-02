import path from "path"
import { readFileSync } from "fs"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string }

const reactAliases = {
  react: path.resolve(import.meta.dirname, "node_modules/react"),
  "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
  "react-dom/client": path.resolve(import.meta.dirname, "node_modules/react-dom/client"),
  "react/jsx-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-runtime.js"),
  "react/jsx-dev-runtime": path.resolve(import.meta.dirname, "node_modules/react/jsx-dev-runtime.js"),
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';
  return {
    base: './',
    plugins: [react()],
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        ...(isLib ? reactAliases : {}),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': '{}',
    },
    build: isLib ? {
      outDir: 'dist',
      lib: {
        entry: path.resolve(import.meta.dirname, 'src/main.tsx'),
        name: 'GameSkull',
        formats: ['es'],
        fileName: () => 'index.js'
      },
      rollupOptions: {
        output: { assetFileNames: 'style.css' },
      },
    } : {
      outDir: 'dist'
    }
  }
})
