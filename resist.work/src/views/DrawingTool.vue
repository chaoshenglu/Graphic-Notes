<template>
  <div class="feature-placeholder">
    <div class="placeholder-content">
      <div class="placeholder-icon">✏️</div>
      <h3 class="placeholder-title">画图工具</h3>
      <p class="placeholder-description">该功能正在开发中，敬请期待！</p>
    </div>
  </div>
</template>

<script setup>
// 画图工具功能待开发
</script>

<style scoped>
.feature-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  animation: fadeIn 0.3s ease;
}

.placeholder-content {
  text-align: center;
  background: white;
  padding: 3rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.3;
}

.placeholder-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.placeholder-description {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

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
</style>