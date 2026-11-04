<template>
  <div class="max-w-xl mx-auto py-24 text-center">
    <h1 class="text-display text-foreground mb-4">该页面已合并</h1>
    <p class="text-muted-foreground mb-8">
      「全部工具」已统一到 /all，并提供分类筛选与分页。正在为你跳转…
    </p>
    <NuxtLink
      to="/all/"
      class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      前往全部工具 <ArrowRight class="w-4 h-4" />
    </NuxtLink>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { ArrowRight } from 'lucide-vue-next'

// 原页面是 /all.vue 的逐行复制（含两处失效 bug），现改为重定向入口。
// SSR 输出带 canonical 与 noindex 的静态兜底页，客户端再跳转，兼容历史外链。
useHead({
  title: '全部工具 - 有条工具',
  meta: [{ name: 'robots', content: 'noindex, follow' }],
  link: [{ rel: 'canonical', href: 'https://www.util.cn/all/' }]
})

onMounted(() => {
  navigateTo('/all/', { replace: true })
})
</script>
