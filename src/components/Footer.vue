<template>
  <footer class="border-t border-border/30 bg-background/95 backdrop-blur-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- 简约的版权和链接信息 -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <!-- 左侧版权信息 -->
        <div class="text-xs text-muted-foreground">
          <span class="mr-2">© 2025 有条工具</span>
          <span class="hidden sm:inline">|</span>
          <span class="hidden sm:inline ml-2">无广告 · 纯本地计算 · 即开即用的在线工具平台</span>
        </div>

        <!-- 中间快速链接 -->
        <nav class="flex items-center gap-4 text-xs">
          <NuxtLink to="/about/" class="text-muted-foreground hover:text-foreground transition-colors">
            关于我们
          </NuxtLink>
          <NuxtLink to="/privacy/" class="text-muted-foreground hover:text-foreground transition-colors">
            隐私政策
          </NuxtLink>
          <NuxtLink to="/terms/" class="text-muted-foreground hover:text-foreground transition-colors">
            服务条款
          </NuxtLink>
        </nav>

        <!-- 右侧特性标识 -->
        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <div class="flex items-center gap-1">
            <Shield class="w-3 h-3 text-green-500" />
            <span class="hidden sm:inline">本地计算</span>
          </div>
          <div class="flex items-center gap-1">
            <Github class="w-3 h-3" />
            <span class="hidden sm:inline">开源</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Github, Shield } from 'lucide-vue-next'
</script>