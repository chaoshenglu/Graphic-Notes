<template>
  <div class="home-container">
    <div class="tools-grid">
      <div 
        v-for="tool in tools" 
        :key="tool.id"
        class="tool-card"
        @click="openTool(tool.id)"
      >
        <div class="tool-icon">{{ tool.icon }}</div>
        <div class="tool-name">{{ tool.name }}</div>
        <div class="tool-description">{{ tool.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 九宫格工具数据
const tools = ref([
  {
    id: 'ai-drawing',
    name: 'AI绘图',
    icon: '🎨',
    description: '智能AI绘图工具'
  },
  // {
  //   id: 'notes',
  //   name: '图文笔记',
  //   icon: '📝',
  //   description: '富文本笔记编辑'
  // },
  {
    id: 'image-compress',
    name: '图片压缩',
    icon: '🗜️',
    description: '高效图片压缩'
  },
  // {
  //   id: 'detail-generate',
  //   name: '生成详情页',
  //   icon: '📃',
  //   description: '产品详情页生成'
  // },
  // {
  //   id: 'image-convert',
  //   name: '图片转格式',
  //   icon: '🔄',
  //   description: '图片格式转换'
  // },
  {
    id: 'product-list',
    name: '产品列表',
    icon: '⚏',
    description: '公司内部产品列表'
  },
  {
    id: 'watermark',
    name: '图片加水印',
    icon: '💧',
    description: '为图片添加水印'
  },
  {
    id: 'shopify-tool',
    name: 'Shopify产品管理工具',
    icon: '🛍️',
    description: '管理Shopify销售的产品'
  },
  {
    id: 'setting',
    name: '系统设置',
    icon: '⚙️',
    description: '环境变量设置'
  }
])

function openTool(toolId) {
  router.push(`/${toolId}`)
}
</script>

<style scoped>
.home-container {
  animation: fadeIn 0.3s ease;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.tool-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.tool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, var(--primary-color), #7c3aed);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.tool-card:hover::before {
  transform: scaleX(1);
}

.tool-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.tool-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.tool-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.tool-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    max-width: none;
  }
  
  .tool-card {
    padding: 1.5rem;
  }
  
  .tool-icon {
    font-size: 2.5rem;
  }
  
  .tool-name {
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .tools-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .tool-card {
    padding: 1.25rem;
  }
  
  .tool-icon {
    font-size: 2rem;
  }
}
</style>