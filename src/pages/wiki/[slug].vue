<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑与头部 -->
    <div class="mb-8">
      <nav class="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        <NuxtLink to="/" class="hover:text-primary transition-colors">首页</NuxtLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <NuxtLink to="/wiki" class="hover:text-primary transition-colors">词条库</NuxtLink>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-foreground">{{ term.term }}</span>
      </nav>

      <div class="flex items-center gap-3 mb-3 flex-wrap">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BookOpen class="h-6 w-6 text-primary" />
        </div>
        <h1 class="text-3xl font-bold text-foreground">{{ term.term }}</h1>
        <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{{ term.category }}</span>
      </div>
      <p class="text-muted-foreground text-lg max-w-3xl leading-relaxed">{{ term.summary }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 正文 -->
      <div class="lg:col-span-2 space-y-6">
        <div
          v-for="section in term.body"
          :key="section.h"
          class="bg-card border border-border rounded-lg p-6"
        >
          <h2 class="text-lg font-semibold text-foreground mb-3 flex items-center">
            <span class="text-primary mr-2">#</span>{{ section.h }}
          </h2>
          <div class="space-y-3">
            <p
              v-for="(p, i) in section.paras || []"
              :key="'p' + i"
              class="text-sm text-muted-foreground leading-relaxed"
            >{{ p }}</p>
            <ul v-if="section.list" class="list-disc pl-5 space-y-1.5">
              <li v-for="(item, i) in section.list" :key="'l' + i" class="text-sm text-muted-foreground leading-relaxed">{{ item }}</li>
            </ul>
          </div>
        </div>

        <!-- 相关词条 -->
        <div v-if="relatedTerms.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <LinkIcon class="w-5 h-5 mr-2 text-primary" /> 相关词条
          </h2>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="rt in relatedTerms"
              :key="rt.slug"
              :to="`/wiki/${rt.slug}/`"
              class="bg-muted hover:bg-muted/80 px-3.5 py-1.5 rounded-full text-sm text-muted-foreground hover:text-primary transition-all"
            >{{ rt.term }}</NuxtLink>
          </div>
        </div>
      </div>

      <!-- 侧栏：相关工具 -->
      <div class="lg:col-span-1">
        <div class="sticky top-20 space-y-4">
          <div v-if="relatedTools.length > 0" class="bg-card border border-border rounded-lg p-5">
            <h2 class="text-base font-semibold text-foreground mb-1 flex items-center">
              <Wrench class="w-4 h-4 mr-2 text-primary" /> 配套工具
            </h2>
            <p class="text-xs text-muted-foreground mb-4">理解了概念，用工具直接上手验证</p>
            <div class="space-y-2.5">
              <NuxtLink
                v-for="tool in relatedTools"
                :key="tool.id"
                :to="`/tools/${tool.id}/`"
                class="flex items-center gap-3 bg-muted/50 hover:bg-muted rounded-lg p-3 transition-all group"
              >
                <component :is="resolveToolIcon(tool.icon, tool.category)" class="w-5 h-5 text-primary flex-shrink-0" />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{{ tool.name }}</p>
                  <p class="text-xs text-muted-foreground truncate">{{ tool.description }}</p>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- 目录 -->
          <div class="bg-card border border-border rounded-lg p-5">
            <h3 class="text-sm font-semibold text-foreground mb-3">本页目录</h3>
            <ul class="space-y-2">
              <li v-for="section in term.body" :key="section.h" class="text-sm text-muted-foreground flex gap-2">
                <span class="text-primary">#</span>{{ section.h }}
              </li>
            </ul>
            <p class="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">更新于 {{ term.updated }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="seoVisible = !seoVisible" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于「{{ term.term }}」的常见问题</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>{{ term.summary }}</p>
          <p>本词条属于{{ term.category }}分类，与 {{ term.relatedTerms.map(t => t.term).join('、') || '其他基础概念' }} 等概念紧密相关。如果你刚开始接触本地大模型部署，建议按「基础概念 → 模型与量化 → 推理与部署」的顺序阅读相关词条，配合<span class="text-primary"> GPU 检测工具 </span>边学边验证自己硬件的可行方案。</p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="''" :category="term.relatedTools[0] ? (tools.find(t => t.id === term.relatedTools[0])?.category || 'dev') : 'dev'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  BookOpen, ChevronRight, ChevronUp, ChevronDown, Link as LinkIcon, Wrench
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { wikiTerms } from '~/data/wiki-terms'
import { tools } from '~/data/tools'
import { resolveToolIcon } from '~/utils/toolIcons'
import RelatedTools from '~/components/RelatedTools.vue'

const route = useRoute()
const term = wikiTerms.find(t => t.slug === route.params.slug)

if (!term) {
  throw createError({ statusCode: 404, statusMessage: '词条不存在', fatal: false })
}

useSeoMeta({
  title: `${term.term}是什么 - ${term.category}词条详解`,
  description: `${term.summary} 附原理讲解、实践建议与配套在线工具。`,
  keywords: `${term.term}, ${term.term}是什么, ${term.category}, 本地大模型, ${term.slug}`,
  author: 'Util工具箱',
  ogTitle: `${term.term} - 有条工具词条库`,
  ogDescription: term.summary,
  ogUrl: `https://www.util.cn/wiki/${term.slug}`,
  ogType: 'article',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'DefinedTerm',
          name: term.term,
          description: term.summary,
          url: `https://www.util.cn/wiki/${term.slug}`,
          inDefinedTermSet: {
            '@type': 'DefinedTermSet',
            name: '有条工具技术词条库',
            url: 'https://www.util.cn/wiki'
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '词条库', item: 'https://www.util.cn/wiki' },
            { '@type': 'ListItem', position: 3, name: term.term, item: `https://www.util.cn/wiki/${term.slug}` }
          ]
        }
      ]
    })
  }]
})

const seoVisible = ref(true)

const relatedTools = computed(() =>
  term.relatedTools.map(id => tools.find(t => t.id === id)).filter(Boolean)
)
const relatedTerms = computed(() =>
  term.relatedTerms.map(slug => wikiTerms.find(t => t.slug === slug)).filter(Boolean)
)
</script>
