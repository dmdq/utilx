<script setup>
import { onMounted } from 'vue'

// 页面挂载后直接重定向
onMounted(() => {
  window.location.href = '/blog/index.html'
})
</script>

<template>
  <div class="blog-loading">
    <div class="loading-spinner"></div>
    <p>正在跳转到博客...</p>
  </div>
</template>

<style scoped>
.blog-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 20px;
  background-color: hsl(220 13% 11%);
  color: hsl(0 0% 98%);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid hsl(240 3.7% 15.9%);
  border-top: 3px solid hsl(221 83% 53%);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

p {
  color: hsl(240 5% 64.9%);
  font-size: 1.1rem;
}
</style>