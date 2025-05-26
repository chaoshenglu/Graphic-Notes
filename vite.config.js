import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 确保资源使用相对路径
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        sidebar: resolve(__dirname, 'sidebar.html'), // 添加 sidebar.html 作为入口
        // 如果你有 options 页面，也在这里添加
        // options: resolve(__dirname, 'options.html'),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    },
    outDir: 'dist' // 输出目录，Chrome 扩展会从这里加载
  }
})
