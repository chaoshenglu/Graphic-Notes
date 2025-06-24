import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import UnoCSS from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), wasm(), topLevelAwait(),UnoCSS()],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@jsquash/webp']
  },
  server: {
    fs: {
      allow: ['..', '..']
    }
  }
})
