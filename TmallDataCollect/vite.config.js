import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// 复制文件的插件
function copyFiles() {
  return {
    name: 'copy-files',
    writeBundle() {
      // 复制manifest.json
      copyFileSync('manifest.json', 'dist/manifest.json')
      
      // 复制icons文件夹
      const iconsDir = 'icons'
      const distIconsDir = 'dist/icons'
      
      // 创建dist/icons目录
      mkdirSync(distIconsDir, { recursive: true })
      
      // 复制icons文件夹中的所有文件
      const files = readdirSync(iconsDir)
      files.forEach(file => {
        const srcPath = join(iconsDir, file)
        const destPath = join(distIconsDir, file)
        if (statSync(srcPath).isFile()) {
          copyFileSync(srcPath, destPath)
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), copyFiles()],
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