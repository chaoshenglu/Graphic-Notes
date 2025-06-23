<template>
  <div class="app-container">
    <!-- 应用头部 -->
    <header class="app-header">
      <div class="header-content">
        <div style="display: flex;flex-direction: row;cursor: pointer;" @click="refreshAndGoHome">
          <img src="/src/assets/logo.svg" style="width: 34px;margin-right: 10px;">
          <h1 class="app-title">琪响智能</h1>
        </div>
        <button v-if="$route.path !== '/'" @click="backToHome" class="back-btn">
          ← 返回首页
        </button>
      </div>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function refreshAndGoHome() {
  // 如果当前已经在首页，强制刷新路由
  if (router.currentRoute.value.path === '/') {
    // 先跳转到其他路由再回到首页，实现刷新效果
    router.replace('/notes').then(() => {
      router.replace('/')
    })
  } else {
    // 如果不在首页，直接导航到首页
    router.replace('/')
  }
}

// 返回首页
function backToHome() {
  router.push('/')
}
</script>
<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.app-header {
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.app-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  background: linear-gradient(135deg, var(--primary-color), #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .back-btn {
    align-self: flex-start;
  }
  
  .main-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0.75rem;
  }
  
  .main-content {
    padding: 0.75rem;
  }
  
  .app-title {
    font-size: 1.25rem;
  }
  
}
</style>
