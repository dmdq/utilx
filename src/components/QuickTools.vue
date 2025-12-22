<template>
  <div class="quick-tools">
    <!-- 返回顶部按钮 -->
    <Transition name="fade">
      <button
        v-if="showButton"
        @click="scrollToTop"
        class="back-to-top-button"
        title="返回顶部"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const showButton = ref(false)

const handleScroll = () => {
  const scrollContainer = document.getElementById('scrollContainer')
  if (scrollContainer) {
    showButton.value = scrollContainer.scrollTop > 200
  } else {
    // 备用：window 滚动
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    showButton.value = scrollTop > 200
  }
}

const scrollToTop = () => {
  const scrollContainer = document.getElementById('scrollContainer')

  if (scrollContainer) {
    scrollContainer.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  } else {
    // 备用：window 滚动
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })

  // 也监听滚动容器的事件
  const scrollContainer = document.getElementById('scrollContainer')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
  }

  // 初始检查
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)

  const scrollContainer = document.getElementById('scrollContainer')
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.quick-tools {
  position: fixed;
  right: 2rem;
  bottom: 6rem;
  z-index: 50;
}

.back-to-top-button {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);

  /* 使用主色调变量 */
  background: hsl(var(--primary) / 0.9);
  color: hsl(var(--primary-foreground));
  border: 1px solid hsl(var(--border) / 0.3);
  box-shadow: 0 4px 15px hsl(var(--primary) / 0.25);
}

.back-to-top-button:hover {
  transform: translateY(-2px);
  background: hsl(var(--primary) / 0.95);
  box-shadow: 0 8px 25px hsl(var(--primary) / 0.35);
  border: 1px solid hsl(var(--border) / 0.5);
}

.back-to-top-button:active {
  transform: translateY(0);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .quick-tools {
    right: 1rem;
    bottom: 5rem;
  }

  .back-to-top-button {
    width: 2.5rem;
    height: 2.5rem;
  }
}

</style>