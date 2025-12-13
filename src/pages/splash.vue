<template>
  <div id="rust-loader">
    <div class="logo-container">
      <div class="logo-ring"></div>
      <div class="logo-inner">U</div>
    </div>
    <h1 class="title">Util.cn</h1>
    <p class="subtitle">开发者效率工具箱</p>
    <div class="progress-container">
      <div class="progress-bar"></div>
    </div>
    <p class="loading-text">Rust is powering up...</p>

      </div>
</template>

<script setup>
// Import splash CSS
import '~/assets/css/splash.css'

// Handle page cleanup
onUnmounted(() => {
  // Ensure splash loader is removed when navigating away
  const loader = document.getElementById('rust-loader')
  if (loader) {
    loader.style.display = 'none'
  }
})
</script>