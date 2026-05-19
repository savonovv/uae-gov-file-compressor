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
        const src = resolve(__dirname, 'public/wasm')
        const files = ['pdf_compressor.js', 'pdf_compressor_bg.wasm', 'pdf_compressor_bg.wasm.d.ts', 'pdf_compressor.d.ts', 'package.json']
        
        // Копируем в dist/wasm/ (для прямого доступа)
        const dest1 = resolve(__dirname, 'dist/wasm')
        if (!existsSync(dest1)) mkdirSync(dest1, { recursive: true })
        files.forEach(f => {
          try { copyFileSync(resolve(src, f), resolve(dest1, f)) } catch(e) {}
        })
        
        // Копируем в dist/src/wasm/ (куда смотрит бандл из assets/)
        const dest2 = resolve(__dirname, 'dist/src/wasm')
        if (!existsSync(dest2)) mkdirSync(dest2, { recursive: true })
        files.forEach(f => {
          try { copyFileSync(resolve(src, f), resolve(dest2, f)) } catch(e) {}
        })
      }
    }
  ],
  base: './',
  build: {
    rollupOptions: {
      external: [/\/wasm\/pdf_compressor\.js$/]
    }
  },
  optimizeDeps: {
    exclude: ['pdf_compressor']
  }
})
