import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Notes from '../views/Notes.vue'
import AiDrawing from '../views/AiDrawing.vue'
import ImageCompress from '../views/ImageCompress.vue'
import DetailGenerate from '../views/DetailGenerate.vue'
import ImageConvert from '../views/ImageConvert.vue'
import GridCut from '../views/GridCut.vue'
import Watermark from '../views/Watermark.vue'
import QrDecode from '../views/QrDecode.vue'
import Base64Image from '../views/Base64Image.vue'

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
    path: '/grid-cut',
    name: 'GridCut',
    component: GridCut
  },
  {
    path: '/watermark',
    name: 'Watermark',
    component: Watermark
  },
  {
    path: '/qr-decode',
    name: 'QrDecode',
    component: QrDecode
  },
  {
    path: '/base64-image',
    name: 'Base64Image',
    component: Base64Image
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router