<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FolderHeart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">场景专题</h1>
          <p class="text-sm text-muted-foreground mt-1">按任务组织的精选工具合集：一次解决"做 XX 该用什么"的问题</p>
        </div>
      </div>
      <p class="text-muted-foreground max-w-3xl">
        分类页按工具类型划分，这里按你的任务划分：本地跑大模型、视频创作、家庭财务、接口联调……每个专题是一套经过编排的工具组合加推荐工作流。
      </p>
    </div>

    <!-- 专题卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
      <NuxtLink
        v-for="col in collections"
        :key="col.slug"
        :to="`/collections/${col.slug}/`"
        class="bg-card/40 backdrop-blur-sm border-0 rounded-xl p-6 hover:bg-card/70 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer group"
      >
        <div class="flex items-start gap-4">
          <div class="p-2.5 bg-primary/10 rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform">
            <component :is="resolveToolIcon(col.icon, 'dev')" class="w-6 h-6 text-primary" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <h2 class="text-lg font-semibold group-hover:text-primary transition-colors">{{ col.title }}</h2>
              <span class="text-xs text-muted-foreground whitespace-nowrap">{{ col.tools.length }} 个工具</span>
            </div>
            <p class="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{{ col.description }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="id in col.tools.slice(0, 5)"
                :key="id"
                class="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >{{ toolName(id) }}</span>
              <span v-if="col.tools.length > 5" class="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">+{{ col.tools.length - 5 }}</span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="seoVisible = !seoVisible" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么按场景组织工具</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>传统工具站按功能分类：加密类、图片类、计算类。但真实的使用场景往往横跨多个分类——"发布一条视频"需要字幕转换、图片压缩、EXIF 清除三种工具；"买套房"需要贷款计算、提前还款对比、投资测算。场景专题把这些散落的工具按任务重新编排，并给出推荐的操作顺序。</p>
          <h3 class="text-lg font-semibold text-foreground">专题怎么用</h3>
          <p>每个专题页顶部是场景说明，中部是工具卡片（点击直接进入工具），底部是推荐工作流——按步骤走一遍，就是这个场景的完整解法。工具全部在本页内互链，不需要在站内来回找。</p>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="''" :category="'others'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FolderHeart, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { collections } from '~/data/collections'
import { tools } from '~/data/tools'
import { resolveToolIcon } from '~/utils/toolIcons'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '场景专题 - 按任务组织的工具合集',
  description: '按使用场景组织的在线工具合集：本地跑大模型全套、视频创作者工具箱、家庭财务计算、接口联调、网络排查等，每个专题附推荐工作流',
  keywords: '工具合集, 工具推荐, 场景工具, 本地大模型工具, 开发者工具箱, 效率工具套装',
  author: 'Util工具箱',
  ogTitle: '场景专题 - 有条工具',
  ogDescription: '按任务组织的精选工具合集，一次解决"做 XX 该用什么"',
  ogUrl: 'https://www.util.cn/collections',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '场景专题',
      url: 'https://www.util.cn/collections',
      hasPart: collections.map(c => ({
        '@type': 'CollectionPage',
        name: c.title,
        url: `https://www.util.cn/collections/${c.slug}`
      }))
    })
  }]
})

const seoVisible = ref(true)
const toolName = (id) => tools.find(t => t.id === id)?.name || id
</script>
