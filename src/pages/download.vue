<template>
  <div class="max-w-6xl mx-auto py-8">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
        <DownloadCloud class="w-10 h-10 text-primary" />
      </div>
      <h1 class="text-4xl font-bold text-foreground mb-4">桌面版本，即将发布</h1>
      <p class="text-xl text-muted-foreground mb-2">我们正在努力为您带来更好的本地体验</p>
      <p class="text-muted-foreground">敬请期待 Util.cn 桌面版，享受离线使用和更多高级功能</p>
    </div>

    <!-- Features Preview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div class="bg-card border border-border rounded-xl p-6 text-center">
        <div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
          <WifiOff class="w-6 h-6 text-blue-500" />
        </div>
        <h3 class="font-semibold mb-2">离线使用</h3>
        <p class="text-sm text-muted-foreground">无需网络连接，随时随地使用所有工具</p>
      </div>

      <div class="bg-card border border-border rounded-xl p-6 text-center">
        <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Zap class="w-6 h-6 text-green-500" />
        </div>
        <h3 class="font-semibold mb-2">极速启动</h3>
        <p class="text-sm text-muted-foreground">原生应用性能，秒级启动响应</p>
      </div>

      <div class="bg-card border border-border rounded-xl p-6 text-center">
        <div class="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Shield class="w-6 h-6 text-purple-500" />
        </div>
        <h3 class="font-semibold mb-2">数据安全</h3>
        <p class="text-sm text-muted-foreground">所有数据本地存储，隐私更加安全</p>
      </div>
    </div>

    <!-- Coming Soon Badge -->
    <div class="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-border rounded-xl p-8 text-center mb-12">
      <div class="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
        <Clock class="w-4 h-4" />
        即将推出
      </div>
      <h2 class="text-2xl font-bold mb-3">桌面版正在紧张开发中</h2>
      <p class="text-muted-foreground mb-6 max-w-2xl mx-auto">
        我们的团队正在全力开发桌面版本，将为您带来更流畅、更稳定的本地使用体验。
        支持Windows、macOS和Linux三大平台。
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          @click="goBack"
          class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <ArrowLeft class="w-4 h-4" />
          返回首页
        </button>
        <NuxtLink
          to="/feedback/"
          class="px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center gap-2"
        >
          <MessageSquarePlus class="w-4 h-4" />
          提交建议
        </NuxtLink>
      </div>
    </div>

    <!-- Platform Support -->
    <div class="bg-card border border-border rounded-xl p-8">
      <h2 class="text-xl font-semibold mb-6 text-center">支持平台</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
            </svg>
          </div>
          <h3 class="font-medium">Windows</h3>
          <p class="text-sm text-muted-foreground">Windows 10/11</p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 bg-gray-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </div>
          <h3 class="font-medium">macOS</h3>
          <p class="text-sm text-muted-foreground">macOS 10.15+</p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.882 1.333-1.439 2.37-1.439 4.102v.07c0 2.762 2.204 5 4.923 5 2.72 0 4.923-2.238 4.923-5v-.07c0-1.697-.523-2.78-1.402-4.102-.75-1.067-1.03-1.923-1.05-3.02-.022-1.452.917-5.96-3.305-6.298V0zm.016 2.206c.135-.003.268.006.4.033 1.26.247 1.454 1.447 1.405 2.615-.05 1.17-.47 2.35-.966 3.425-.033.07-.065.134-.1.2v.001c-.17.348-.352.69-.543 1.02-1.18 2.055-2.787 3.78-4.083 5.017-.08.076-.155.147-.23.213-.36.326-.676.594-.924.796-.574.463-1.06.855-1.38 1.124-.32.269-.468.395-.468.395s.424-.62 1.155-1.528c.115-.144.24-.3.376-.47.22-.27.46-.57.716-.894.705-.884 1.543-2.023 2.18-3.28.1-.19.195-.384.284-.58.338-.73.602-1.482.767-2.203.03-.135.056-.27.078-.4.07-.423.1-.837.086-1.227-.024-.678-.2-1.294-.54-1.777-.12-.17-.266-.324-.437-.452-.324-.244-.73-.39-1.162-.428v-.001zm2.383 13.963c.14.01.283.016.426.016 2.72 0 4.923-2.238 4.923-5v-.07c0-1.697-.523-2.78-1.402-4.102-.75-1.067-1.03-1.923-1.05-3.02-.023-1.49.92-6.01-3.358-6.312v18.487c.157 0 .312-.006.463-.02v.01z"/>
            </svg>
          </div>
          <h3 class="font-medium">Linux</h3>
          <p class="text-sm text-muted-foreground">主流发行版</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  DownloadCloud, WifiOff, Zap, Shield, Clock, ArrowLeft,
  MessageSquarePlus
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('桌面版下载 - 敬请期待')

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
/* 添加一些动画效果 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>