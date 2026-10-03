<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑与头部 -->
    <div class="mb-8">
      <nav class="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <NuxtLink to="/" class="hover:text-primary transition-colors">首页</NuxtLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <NuxtLink to="/collections" class="hover:text-primary transition-colors">场景专题</NuxtLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-foreground">{{ col.title }}</span>
      </nav>

      <div class="flex items-start gap-4 flex-wrap">
        <div class="p-3 bg-primary/10 rounded-2xl">
          <component :is="resolveToolIcon(col.icon, 'dev')" class="w-7 h-7 text-primary" />
        </div>
        <div class="flex-1 min-w-[240px]">
          <h1 class="text-3xl font-bold text-foreground mb-2">{{ col.title }}</h1>
          <p class="text-muted-foreground leading-relaxed max-w-3xl">{{ col.description }}</p>
          <p class="text-xs text-muted-foreground mt-2.5">适合：{{ col.scene }}</p>
        </div>
      </div>
    </div>

    <!-- 工作流 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
        <ListOrdered class="w-5 h-5 mr-2 text-primary" /> 推荐工作流
      </h2>
      <ol class="space-y-3">
        <li v-for="(step, i) in col.workflow" :key="i" class="flex gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{{ i + 1 }}</span>
          <p class="text-sm text-muted-foreground leading-relaxed">{{ step }}</p>
        </li>
      </ol>
    </div>

    <!-- 工具卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
      <ToolCard
        v-for="tool in colTools"
        :key="tool.id"
        :tool="tool"
        :title="tool.name"
        :description="tool.description"
        :category="tool.category"
        :usage-count="formatViewCount(tool.viewCount)"
        :icon="tool.icon"
      />
    </div>

    <!-- 相关词条 -->
    <div v-if="relatedTerms.length > 0" class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
        <BookOpen class="w-5 h-5 mr-2 text-primary" /> 配套词条
      </h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="t in relatedTerms"
          :key="t.slug"
          :to="`/wiki/${t.slug}/`"
          class="bg-muted hover:bg-muted/80 px-3.5 py-1.5 rounded-full text-sm text-muted-foreground hover:text-primary transition-all"
        >{{ t.term }}</NuxtLink>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="seoVisible = !seoVisible" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>{{ col.title }}：一套解决完整任务的工具组合</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{{ col.description }}本专题面向{{ col.scene }}，精选了 {{ col.tools.length }} 个{{ col.title.replace(/全套|套装|工具箱|防护包|包|流水线|套件|盒子/g, '') }}场景下的高频工具。</p>
          <p>所有工具均为纯本地计算：{{ col.title }}中的每一个工具都在浏览器内完成处理，{{ col.scene.split('、')[0] }}无需注册、无需上传任何数据。建议按上方工作流的顺序使用，每个环节的输出即为下一环节的输入。</p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="''" :category="colTools[0]?.category || 'dev'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ChevronRight, ChevronUp, ChevronDown, ListOrdered, BookOpen
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { collections } from '~/data/collections'
import { wikiTerms } from '~/data/wiki-terms'
import { tools } from '~/data/tools'
import { resolveToolIcon } from '~/utils/toolIcons'
import ToolCard from '~/components/ToolCard.vue'
import RelatedTools from '~/components/RelatedTools.vue'

const route = useRoute()
const col = collections.find(c => c.slug === route.params.slug)

if (!col) {
  throw createError({ statusCode: 404, statusMessage: '专题不存在', fatal: false })
}

useSeoMeta({
  title: `${col.title} - ${col.tools.length}个精选工具与工作流`,
  description: `${col.description}适合${col.scene}。`,
  keywords: `${col.title}, ${col.tools.map(t => tools.find(x => x.id === t)?.name).filter(Boolean).slice(0, 4).join(', ')}, 工具合集`,
  author: 'Util工具箱',
  ogTitle: `${col.title} - 有条工具场景专题`,
  ogDescription: col.description,
  ogUrl: `https://www.util.cn/collections/${col.slug}`,
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
          name: col.title,
          description: col.description,
          url: `https://www.util.cn/collections/${col.slug}`
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '场景专题', item: 'https://www.util.cn/collections' },
            { '@type': 'ListItem', position: 3, name: col.title, item: `https://www.util.cn/collections/${col.slug}` }
          ]
        }
      ]
    })
  }]
})

const seoVisible = ref(true)

const colTools = computed(() =>
  col.tools.map(id => tools.find(t => t.id === id)).filter(Boolean)
)
const relatedTerms = computed(() =>
  (col.relatedTerms || [])
    .map(slug => wikiTerms.find(t => t.slug === slug))
    .filter(Boolean)
)
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}
</script>
