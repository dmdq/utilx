<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BookOpen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">技术词条库</h1>
          <p class="text-sm text-muted-foreground mt-1">用大白话解释开发与技术概念，每个词条都附带可以直接上手的站内工具</p>
        </div>
      </div>
      <p class="text-muted-foreground max-w-3xl">
        覆盖本地大模型、微调训练、量化部署等领域的核心概念：一句话定义 + 原理展开 + 常见误区 + 相关工具。词条与工具相互链接，看完概念就能直接用工具验证。
      </p>
    </div>

    <!-- 搜索与分类 -->
    <div class="mb-8 space-y-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索词条，如：量化、LoRA、Token..."
        class="w-full max-w-md px-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in ['全部', ...wikiCategories]"
          :key="cat"
          @click="activeCategory = cat"
          :class="activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
          class="px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
        >{{ cat }}</button>
      </div>
    </div>

    <!-- 词条卡片 -->
    <div v-if="filteredTerms.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
      <NuxtLink
        v-for="t in filteredTerms"
        :key="t.slug"
        :to="`/wiki/${t.slug}/`"
        class="bg-card/40 backdrop-blur-sm border-0 rounded-xl p-5 hover:bg-card/70 hover:shadow-sm hover:shadow-primary/5 transition-all duration-200 cursor-pointer group"
      >
        <div class="flex items-center justify-between mb-2.5">
          <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{{ t.category }}</span>
          <span v-if="t.relatedTools.length" class="text-xs text-muted-foreground">{{ t.relatedTools.length }} 个相关工具</span>
        </div>
        <h2 class="font-semibold mb-2 group-hover:text-primary transition-colors">{{ t.term }}</h2>
        <p class="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{{ t.summary }}</p>
      </NuxtLink>
    </div>
    <div v-else class="py-14 text-center mb-12">
      <BookOpen class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
      <p class="text-sm text-muted-foreground">没有匹配「{{ searchQuery }}」的词条</p>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="seoVisible = !seoVisible" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于本词条库</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>技术概念的解释散落在各类博客和问答里，质量参差且大多止步于"是什么"。本词条库的每个词条都遵循固定结构：一句话定义、原理展开、可操作的实践建议，以及配套的站内工具——读完"Q4_K_M 是什么"，下一步就能用 GPU 检测工具算清自己的显卡能跑哪个模型。</p>
          <h3 class="text-lg font-semibold text-foreground">词条持续更新</h3>
          <p>当前词条聚焦本地大模型生态（基础概念、量化、微调、部署四个方向），网络、文件处理、安全等领域的词条按计划滚动补充。如果你希望优先看到某个概念的词条，欢迎通过页面底部反馈告诉我们。</p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="''" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { BookOpen, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { wikiTerms, wikiCategories } from '~/data/wiki-terms'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '技术词条库 - 本地大模型/量化/微调概念解释',
  description: '用大白话解释本地大模型生态核心概念：Token、GGUF、Q4_K_M量化、KV Cache、LoRA、QLoRA、RAG等，每个词条附原理讲解与配套在线工具',
  keywords: '技术词条, 大模型概念, 量化是什么, lora是什么, gguf格式, kv cache, rag, 本地部署llm入门',
  author: 'Util工具箱',
  ogTitle: '技术词条库 - 有条工具',
  ogDescription: '用大白话解释技术概念，每个词条都附带可以直接上手的站内工具',
  ogUrl: 'https://www.util.cn/wiki',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '技术词条库',
      url: 'https://www.util.cn/wiki',
      description: '本地大模型生态核心概念词条，附配套工具',
      hasPart: wikiTerms.map(t => ({
        '@type': 'DefinedTerm',
        name: t.term,
        url: `https://www.util.cn/wiki/${t.slug}`
      }))
    })
  }]
})

const searchQuery = ref('')
const activeCategory = ref('全部')
const seoVisible = ref(true)

const filteredTerms = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return wikiTerms
    .filter(t => activeCategory.value === '全部' || t.category === activeCategory.value)
    .filter(t => !q || t.term.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q))
})
</script>
