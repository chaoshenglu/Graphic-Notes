import './style.css'
import 'uno.css'
import router from './router'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import axios from 'axios'

const app = createApp(App)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})
app.mount('#app')
window.lx_host = window.localStorage.getItem("lx_host")
window.lx_doubao = window.localStorage.getItem("lx_doubao")
console.log("window.lx_host",window.lx_host)
console.log("window.lx_doubao",window.lx_doubao)

// 获取所有商品ID并存储到localStorage
axios.get(`${window.lx_host}/products/ids`)
  .then(response => {
    const productIds = response.data.data
    window.localStorage.setItem('product_ids', JSON.stringify(productIds))
    console.log('商品ID已存储到localStorage:', productIds)
  })
  .catch(error => {
    console.error('获取商品ID失败:', error)
  })