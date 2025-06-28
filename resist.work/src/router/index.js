import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Notes from '../views/Notes.vue'
import AiDrawing from '../views/AiDrawing.vue'
import ImageCompress from '../views/ImageCompress.vue'
import DetailGenerate from '../views/DetailGenerate.vue'
import ImageConvert from '../views/ImageConvert.vue'
import ProductList from '../views/ProductList.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Watermark from '../views/Watermark.vue'
import ShopifyTool from '../views/ShopifyTool.vue'
import Setting from '../views/Setting.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/notes',
    name: 'Notes',
    component: Notes
  },
  {
    path: '/ai-drawing',
    name: 'AiDrawing',
    component: AiDrawing
  },
  {
    path: '/image-compress',
    name: 'ImageCompress',
    component: ImageCompress
  },
  {
    path: '/detail-generate',
    name: 'DetailGenerate',
    component: DetailGenerate
  },
  {
    path: '/image-convert',
    name: 'ImageConvert',
    component: ImageConvert
  },
  {
    path: '/product-list',
    name: 'ProductList',
    component: ProductList
  },
  {
    path: '/product-detail/:id',
    name: 'ProductDetail',
    component: ProductDetail
  },
  {
    path: '/watermark',
    name: 'Watermark',
    component: Watermark
  },
  {
    path: '/shopify-tool',
    name: 'ShopifyTool',
    component: ShopifyTool
  },
  {
    path: '/setting',
    name: 'Setting',
    component: Setting
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router