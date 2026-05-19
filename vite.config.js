import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(getGitHash())
  },
    react(),
    {
      name: 'copy-wasm',
      closeBundle() {
        const src = resolve(__dirname, 'public/wasm')
        const files = ['pdf_compressor.js', 'pdf_compressor_bg.wasm', 'pdf_compressor_bg.wasm.d.ts', 'pdf_compressor.d.ts', 'package.json']
        
        // Copy to dist/wasm/ (for direct access)
        const dest1 = resolve(__dirname, 'dist/wasm')
        if (!existsSync(dest1)) mkdirSync(dest1, { recursive: true })
        files.forEach(f => {
          try { copyFileSync(resolve(src, f), resolve(dest1, f)) } catch(e) {}
        })
        
        // Copy to dist/src/wasm/ (where the asset bundle looks for it)
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
    target: 'esnext',
    rollupOptions: {
      external: [/\/wasm\/pdf_compressor\.js$/, /pdf\.worker\./]
    }
  },
  optimizeDeps: {
    exclude: ['pdf_compressor', 'pdfjs-dist']
  }
})
