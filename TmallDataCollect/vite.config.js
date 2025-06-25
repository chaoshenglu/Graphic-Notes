import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync } from 'fs'

// 复制manifest.json的插件
function copyManifest() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      copyFileSync('manifest.json', 'dist/manifest.json')
    }
  }
}

export default defineConfig({
  plugins: [vue(), copyManifest()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/popup.html'),
        content: resolve(__dirname, 'content/content.js'),
        background: resolve(__dirname, 'background/background.js')
      },
      output: {
        entryFileNames: '[name]/[name].js',
        chunkFileNames: '[name]/[name].js',
        assetFileNames: '[name]/[name].[ext]'
      }
    }
  }
})