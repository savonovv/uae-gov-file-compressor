import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-wasm',
      closeBundle() {
        const dest = resolve(__dirname, 'dist/wasm')
        if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
        const src = resolve(__dirname, 'public/wasm')
        const files = ['pdf_compressor.js', 'pdf_compressor_bg.wasm', 'pdf_compressor_bg.wasm.d.ts', 'pdf_compressor.d.ts', 'package.json']
        files.forEach(f => {
          try { copyFileSync(resolve(src, f), resolve(dest, f)) } catch(e) {}
        })
      }
    }
  ],
  base: './',
  build: {
    rollupOptions: {
      external: ['/wasm/pdf_compressor.js']
    }
  },
  optimizeDeps: {
    exclude: ['pdf_compressor']
  }
})