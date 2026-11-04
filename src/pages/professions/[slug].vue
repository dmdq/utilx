<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑与头部 -->
    <div class="mb-8">
      <nav class="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <NuxtLink to="/" class="hover:text-primary transition-colors">首页</NuxtLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <NuxtLink to="/professions" class="hover:text-primary transition-colors">按职业找工具</NuxtLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-foreground">{{ persona.name }}</span>
      </nav>

      <div class="flex items-start gap-4 flex-wrap">
        <component :is="resolveToolIcon(persona.icon, 'dev')" class="w-7 h-7 text-primary shrink-0 mt-1" />
        <div class="flex-1 min-w-[240px]">
          <h1 class="text-display text-foreground mb-2">{{ persona.name }}工具箱</h1>
          <p class="text-muted-foreground leading-relaxed max-w-3xl">{{ persona.scene }}</p>
          <p class="text-xs text-muted-foreground mt-2.5">
            {{ persona.group }} · {{ persona.tasks.length }} 条核心任务 · 覆盖 {{ toolCount }} 款工具
          </p>
        </div>
      </div>
    </div>

    <!-- 任务清单：每条任务挂工具直链 -->
    <section class="mb-12">
      <div class="flex items-baseline gap-3 border-b border-border/70 pb-2 mb-1">
        <h2 class="text-h2 text-foreground">核心任务与工具</h2>
        <span class="text-xs text-muted-foreground/70 hidden sm:inline">点任务下的工具名直接打开，全部本地计算</span>
      </div>
      <div
        v-for="(t, i) in persona.tasks"
        :key="t.task"
        class="border-b border-border/40 py-3.5 px-2 -mx-2"
      >
        <div class="flex items-baseline gap-3">
          <span class="font-mono text-xs tabular-nums text-muted-foreground/60 w-6 shrink-0">{{ pad(i + 1) }}</span>
          <span class="font-medium text-sm sm:text-base text-foreground">{{ t.task }}</span>
        </div>
        <div v-if="t.tools && t.tools.length" class="flex flex-wrap gap-x-4 gap-y-1.5 pl-9 mt-1.5">
          <NuxtLink
            v-for="tid in t.tools"
            :key="tid"
            :to="`/tools/${tid}/`"
            class="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            @click="addRecentTool(tid)"
          >
            {{ toolName(tid) }}
          </NuxtLink>
        </div>
        <p v-else class="text-xs text-muted-foreground/60 pl-9 mt-1.5">这条任务还在选品清单里，工具开发中</p>
      </div>
    </section>

    <!-- 同组画像 -->
    <section v-if="siblings.length" class="mb-12">
      <h2 class="text-h2 text-foreground mb-4">{{ persona.group }}的其他画像</h2>
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <NuxtLink
          v-for="sib in siblings"
          :key="sib.id"
          :to="`/professions/${sib.id}/`"
          class="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {{ sib.name }}
        </NuxtLink>
      </div>
    </section>

    <!-- SEO 说明 -->
    <section class="border-t border-border/60 pt-8 pb-4">
      <h2 class="text-h2 text-foreground mb-4">{{ persona.name }}常用的工具都有哪些</h2>
      <div class="text-muted-foreground leading-relaxed max-w-3xl space-y-3 text-sm">
        <p>本页按"任务 → 工具"整理了{{ persona.name }}（{{ persona.scene }}）日常最常用的 {{ toolCount }} 款在线工具，覆盖 {{ persona.tasks.length }} 条核心任务。所有工具都在浏览器本地完成计算，数据不上传、免注册、无广告。</p>
        <p>找别的职业？回 <NuxtLink to="/professions/" class="text-primary hover:underline">按职业找工具</NuxtLink> 总览；想按场景组合用，看 <NuxtLink to="/collections/" class="text-primary hover:underline">场景专题</NuxtLink>；全部 {{ toolTotal }} 款工具在 <NuxtLink to="/all/" class="text-primary hover:underline">全部工具</NuxtLink> 目录里。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ChevronRight } from 'lucide-vue-next'
import { personas } from '~/data/personas'
import { tools } from '~/data/tools'
import { resolveToolIcon } from '~/utils/toolIcons'
import { addRecentTool } from '~/composables/useTools'

const route = useRoute()
const persona = personas.find(p => p.id === route.params.slug)

if (!persona) {
  throw createError({ statusCode: 404, statusMessage: '职业画像不存在', fatal: false })
}

const pad = (n) => String(n).padStart(2, '0')
const toolTotal = tools.length
const toolName = (id) => tools.find(t => t.id === id)?.name || id
const toolCount = new Set(persona.tasks.flatMap(t => t.tools || [])).size
const siblings = personas.filter(p => p.group === persona.group && p.id !== persona.id)

useSeoMeta({
  title: `${persona.name}工具箱 - ${persona.tasks.length}条核心任务对应工具`,
  description: `${persona.name}（${persona.scene}）常用工具按任务整理：${persona.tasks.slice(0, 3).map(t => t.task).join('、')}等 ${persona.tasks.length} 条任务对应 ${toolCount} 款工具，全部本地计算免注册。`,
  keywords: `${persona.name}工具, ${persona.name}常用软件, 职业工具箱, ${persona.tasks.slice(0, 2).map(t => t.task).join(',')}`,
  ogTitle: `${persona.name}工具箱 - 有条工具按职业找工具`,
  ogDescription: persona.scene,
  ogUrl: `https://www.util.cn/professions/${persona.id}`,
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: `${persona.name}工具箱`,
          description: persona.scene,
          url: `https://www.util.cn/professions/${persona.id}`
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '按职业找工具', item: 'https://www.util.cn/professions' },
            { '@type': 'ListItem', position: 3, name: persona.name, item: `https://www.util.cn/professions/${persona.id}` }
          ]
        },
        {
          '@type': 'ItemList',
          name: `${persona.name}核心任务`,
          numberOfItems: persona.tasks.length,
          itemListElement: persona.tasks.slice(0, 10).map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: t.task,
            url: `https://www.util.cn/professions/${persona.id}#task-${i}`
          }))
        }
      ]
    })
  }]
})
</script>
