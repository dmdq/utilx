<script setup>
// 工具页底部「相关教程」反向链接块：
// 数据来自构建期生成的 src/data/tool-tutorials.json（博客文章→工具引用扫描），
// 仅在 /tools/<id>/ 路由且该工具有教程映射时渲染，SSR 输出保证搜索引擎与 LLM 可见。
import tutorialMap from '~/data/tool-tutorials.json'

const route = useRoute()

const toolId = computed(() => {
  const m = route.path.match(/^\/tools\/([a-z0-9-]+)/)
  return m ? m[1] : ''
})

const tutorials = computed(() => (toolId.value && tutorialMap[toolId.value]) || [])

const fmtDate = (d) => (d ? String(d).slice(0, 10) : '')
</script>

<template>
  <section v-if="tutorials.length" class="max-w-8xl mx-auto mt-10 mb-4 px-1">
    <h2 class="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      相关教程
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <a
        v-for="t in tutorials"
        :key="t.slug"
        :href="`/blog/articles/${t.slug}/`"
        class="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
      >
        <h3 class="font-medium text-foreground text-sm leading-snug line-clamp-2">{{ t.title }}</h3>
        <p class="text-xs text-muted-foreground mt-2 line-clamp-2">{{ t.summary }}</p>
        <p v-if="t.date" class="text-xs text-muted-foreground/70 mt-2">{{ fmtDate(t.date) }}</p>
      </a>
    </div>
  </section>
</template>
