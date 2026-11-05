<script setup>
import { computed } from 'vue'
import { tools } from '~/data/tools'

const props = defineProps({
  error: { type: Object, default: () => ({}) }
})

const route = useRoute()
const path = computed(() => props.error?.url || route.fullPath || '')
const is404 = computed(() => (props.error?.statusCode || 500) === 404)

const badSlug = computed(() => {
  const m = path.value.match(/\/tools\/([a-z0-9-]+)/)
  return m ? m[1] : ''
})

// 404 时按 slug 相似度推荐相近工具（前缀重合 + 包含关系打分）
const similarTools = computed(() => {
  const bad = badSlug.value.replace(/-+$/, '')
  if (!bad) return []
  return tools
    .map(t => {
      let i = 0
      while (i < bad.length && i < t.id.length && bad[i] === t.id[i]) i++
      let score = i * 2
      if (t.id.includes(bad) || bad.includes(t.id)) score += 6
      return { id: t.id, name: t.name, score }
    })
    .filter(t => t.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
})

useHead({
  title: is404.value ? '页面不存在 - 有条工具' : '服务出错了 - 有条工具'
})

const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center">
    <p class="text-sm font-mono text-muted-foreground mb-2">{{ error?.statusCode || 500 }}</p>
    <h1 class="text-2xl font-semibold mb-3">
      {{ is404 ? '这个页面不存在' : '服务出错了' }}
    </h1>
    <p class="text-sm text-muted-foreground mb-8 max-w-md">
      <template v-if="is404">
        地址可能有拼写偏差，或该工具已经迁移。全站 {{ tools.length }} 款工具都可以从目录找到。
      </template>
      <template v-else>刷新一下通常能解决；如果持续出现，请稍后再试。</template>
    </p>

    <div v-if="similarTools.length" class="w-full max-w-md text-left mb-8">
      <p class="text-sm font-medium mb-2">你是不是想找：</p>
      <ul class="space-y-2">
        <li v-for="t in similarTools" :key="t.id">
          <a :href="`/tools/${t.id}/`" class="text-sm text-primary hover:underline">
            {{ t.name }}
            <span class="text-xs text-muted-foreground font-mono ml-1">/tools/{{ t.id }}/</span>
          </a>
        </li>
      </ul>
    </div>

    <div class="flex gap-3">
      <button
        type="button"
        class="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted"
        @click="goHome"
      >
        返回首页
      </button>
      <a
        href="/all/"
        class="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted"
      >
        浏览全部工具
      </a>
    </div>
  </div>
</template>
