<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero：无容器、无圆角，靠字号与留白建立层级 -->
    <section class="pt-4 pb-10">
      <p class="text-[11px] tracking-[0.2em] text-muted-foreground/70 mb-5">独立 · 本地计算 · 开源</p>
      <h1 class="text-display lg:text-display-lg text-foreground mb-5">
        {{ tools.length }} 个小工具，<span class="text-primary">把具体问题算清楚</span>
      </h1>
      <p class="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed mb-9">
        不注册、不上传、打开即用。从 JSON 格式化到混凝土配合比，都在浏览器里算完。
      </p>

      <!-- 搜索：下划线式，无圆角无卡片 -->
      <div class="relative max-w-3xl">
        <div class="relative border-b border-border/70 focus-within:border-primary transition-colors">
          <Search class="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            class="block w-full bg-transparent border-0 rounded-none pl-8 pr-28 py-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
            placeholder="搜索工具、单位或场景，如 时间戳、扭矩、毛线用量…"
            @keydown.enter="handleSearchEnter"
          >
          <div class="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              class="text-xs text-muted-foreground/70 border border-border/60 px-2 py-1 hover:text-primary hover:border-foreground/30 transition-colors"
              title="检测剪贴板内容"
              @click="detectClipboardContent"
            >
              <Clipboard class="w-3.5 h-3.5" />
            </button>
            <span class="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground/60 font-mono">
              <kbd class="text-[11px] border border-border/60 px-1.5 py-0.5">⌘</kbd>
              <kbd class="text-[11px] border border-border/60 px-1.5 py-0.5">K</kbd>
            </span>
          </div>
        </div>

        <!-- 即时搜索结果：直角、发丝边框，不用圆角卡片 -->
        <div
          v-if="searchResults.length > 0"
          class="absolute z-20 left-0 right-0 top-full mt-1 border border-border bg-card text-left shadow-elevation-3"
        >
          <NuxtLink
            v-for="tool in searchResults"
            :key="tool.id"
            :to="`/tools/${tool.id}/`"
            class="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 last:border-b-0 hover:bg-muted/40 transition-colors"
            @click="addRecentTool(tool.id)"
          >
            <span class="text-sm font-medium truncate">{{ tool.name }}</span>
            <span class="text-xs text-muted-foreground truncate ml-auto hidden sm:block">{{ tool.description }}</span>
          </NuxtLink>
          <button
            class="w-full text-left text-xs text-primary px-4 py-2.5 border-t border-border hover:bg-muted/40 transition-colors"
            @click="handleSearchEnter"
          >
            查看全部结果 →
          </button>
        </div>
      </div>

      <!-- 剪贴板提示：发丝线一行，不做色块 -->
      <div
        v-if="clipboardSuggestion"
        class="max-w-3xl mt-4 py-2.5 border-b border-border/60 flex items-center justify-between gap-4 text-sm text-left"
      >
        <div>
          <span class="text-muted-foreground">检测到剪贴板包含 {{ clipboardSuggestion.type }} 数据，</span>
          <button class="text-primary hover:underline" @click="goToTool(clipboardSuggestion.toolId)">
            打开 {{ clipboardSuggestion.toolName }}？
          </button>
        </div>
        <button class="text-muted-foreground hover:text-foreground shrink-0" aria-label="关闭提示" @click="dismissClipboardSuggestion">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- 随机工具 + 最近使用 -->
      <div class="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            class="inline-flex items-center gap-2 border border-border/70 px-3 py-2 text-sm text-foreground hover:text-primary hover:border-foreground/30 transition-colors"
            @click="openRandomTool"
          >
            <Shuffle class="w-4 h-4" />
            随机打开一个工具
            <span class="text-muted-foreground/60">↗</span>
          </button>
          <span class="text-xs text-muted-foreground/70 hidden md:inline">
            试试
            <NuxtLink v-for="(q, i) in tryQueries" :key="q" :to="`/all/?search=${encodeURIComponent(q)}`" class="hover:text-primary transition-colors">
              {{ q }}<span v-if="i < tryQueries.length - 1"> · </span>
            </NuxtLink>
          </span>
        </div>
        <div v-if="recentTools.length > 0" class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span class="text-muted-foreground/70">最近使用</span>
          <NuxtLink
            v-for="tool in recentTools"
            :key="tool.id"
            :to="`/tools/${tool.id}/`"
            class="hover:text-primary transition-colors"
            @click="addRecentTool(tool.id)"
          >{{ tool.name }}</NuxtLink>
          <NuxtLink to="/recent/" class="text-primary hover:underline">全部 →</NuxtLink>
        </div>
      </div>
    </section>

    <!-- 数据条：真实统计，等宽数字 -->
    <section class="grid grid-cols-3 sm:grid-cols-5 border-y border-border/60 py-5 mb-10">
      <div v-for="stat in stats" :key="stat.label" class="px-1">
        <div class="font-mono text-xl sm:text-2xl tabular-nums text-foreground">{{ stat.value }}</div>
        <div class="text-xs text-muted-foreground mt-1">{{ stat.label }}</div>
      </div>
    </section>

    <!-- 主内容：左宽栏为目录，右窄栏为索引，形成层级差 -->
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-x-12 gap-y-12">
      <div class="min-w-0">
        <!-- 01 精选工具 -->
        <section class="mb-12">
          <div class="flex items-baseline gap-3 border-b border-border/70 pb-2 mb-1">
            <span class="font-mono text-xs text-muted-foreground/60">01</span>
            <h2 class="text-h1 flex-1">精选工具</h2>
            <NuxtLink to="/all/" class="text-xs text-muted-foreground hover:text-primary transition-colors">查看全部 {{ tools.length }} 款 →</NuxtLink>
          </div>
          <NuxtLink
            v-for="(tool, i) in featuredTools"
            :key="tool.id"
            :to="`/tools/${tool.id}/`"
            class="group flex items-baseline gap-4 border-b border-border/40 py-2.5 px-2 -mx-2 hover:bg-muted/25 transition-colors"
            @click="addRecentTool(tool.id)"
          >
            <span class="font-mono text-xs tabular-nums text-muted-foreground/60 w-6 shrink-0">{{ pad(i + 1) }}</span>
            <span class="font-medium text-sm sm:text-base shrink-0 group-hover:text-primary transition-colors">{{ tool.name }}</span>
            <span class="text-xs text-muted-foreground truncate hidden md:block flex-1">{{ tool.description }}</span>
            <span class="text-xs text-muted-foreground/70 ml-auto hidden sm:block shrink-0">{{ categoryName(tool.category) }}</span>
          </NuxtLink>
        </section>

        <!-- 02 分类目录 -->
        <section class="mb-12">
          <div class="flex items-baseline gap-3 border-b border-border/70 pb-2 mb-4">
            <span class="font-mono text-xs text-muted-foreground/60">02</span>
            <h2 class="text-h1 flex-1">按分类浏览</h2>
            <NuxtLink to="/explore/" class="text-xs text-muted-foreground hover:text-primary transition-colors">工具探索 →</NuxtLink>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-8">
            <NuxtLink
              v-for="category in categoryIndex"
              :key="category.id"
              :to="`/${category.id}/`"
              class="group flex items-baseline justify-between gap-2 border-b border-border/40 py-2 text-sm hover:text-primary transition-colors"
            >
              <span class="truncate">{{ category.name }}</span>
              <span class="font-mono text-xs tabular-nums text-muted-foreground/70 shrink-0">{{ category.count }}</span>
            </NuxtLink>
          </div>
        </section>

        <!-- 03 少见的实用计算：差异化长尾内链 -->
        <section class="mb-12">
          <div class="flex items-baseline gap-3 border-b border-border/70 pb-2 mb-1">
            <span class="font-mono text-xs text-muted-foreground/60">03</span>
            <h2 class="text-h1 flex-1">少见的实用计算</h2>
            <span class="text-xs text-muted-foreground/70 hidden sm:inline">别处不太好找，这里都有</span>
          </div>
          <NuxtLink
            v-for="(tool, i) in nicheTools"
            :key="tool.id"
            :to="`/tools/${tool.id}/`"
            class="group flex items-baseline gap-4 border-b border-border/40 py-2.5 px-2 -mx-2 hover:bg-muted/25 transition-colors"
            @click="addRecentTool(tool.id)"
          >
            <span class="font-mono text-xs tabular-nums text-muted-foreground/60 w-6 shrink-0">{{ pad(i + 1) }}</span>
            <span class="text-sm sm:text-base shrink-0 group-hover:text-primary transition-colors">{{ tool.name }}</span>
            <span class="text-xs text-muted-foreground truncate hidden md:block flex-1">{{ tool.description }}</span>
          </NuxtLink>
        </section>

        <!-- 04 场景专题 -->
        <section class="mb-4">
          <div class="flex items-baseline gap-3 border-b border-border/70 pb-2 mb-1">
            <span class="font-mono text-xs text-muted-foreground/60">04</span>
            <h2 class="text-h1 flex-1">场景专题</h2>
            <NuxtLink to="/collections/" class="text-xs text-muted-foreground hover:text-primary transition-colors">全部 {{ collections.length }} 个 →</NuxtLink>
          </div>
          <NuxtLink
            v-for="(col, i) in featuredCollections"
            :key="col.slug"
            :to="`/collections/${col.slug}/`"
            class="group flex items-baseline gap-4 border-b border-border/40 py-2.5 px-2 -mx-2 hover:bg-muted/25 transition-colors"
          >
            <span class="font-mono text-xs tabular-nums text-muted-foreground/60 w-6 shrink-0">{{ pad(i + 1) }}</span>
            <span class="text-sm sm:text-base shrink-0 group-hover:text-primary transition-colors">{{ col.title }}</span>
            <span class="text-xs text-muted-foreground truncate hidden md:block flex-1">{{ col.scene }}</span>
            <span class="text-xs text-muted-foreground/70 ml-auto shrink-0">{{ col.tools.length }} 个工具</span>
          </NuxtLink>
        </section>
      </div>

      <!-- 右侧索引栏 -->
      <aside class="min-w-0">
        <!-- AI 导航精选 -->
        <section class="mb-9">
          <div class="flex items-baseline justify-between border-b border-border/70 pb-2">
            <h2 class="text-xs tracking-[0.16em] text-muted-foreground">AI 导航精选</h2>
            <span class="font-mono text-xs text-muted-foreground/60">{{ aiTools.length }}</span>
          </div>
          <a
            v-for="item in aiFeatured"
            :key="item.id"
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-baseline justify-between gap-2 border-b border-border/40 py-2 text-sm hover:text-primary transition-colors"
          >
            <span class="truncate">{{ item.name }}</span>
            <span class="text-xs text-muted-foreground/70 shrink-0 group-hover:text-primary">{{ aiCategoryName(item.category) }} ↗</span>
          </a>
          <NuxtLink to="/ai/" class="inline-block text-xs text-primary hover:underline pt-3">
            全部 {{ aiTools.length }} 款 · {{ aiCategories.length }} 个分类 →
          </NuxtLink>
        </section>

        <!-- 词条索引 -->
        <section class="mb-9">
          <div class="flex items-baseline justify-between border-b border-border/70 pb-2">
            <h2 class="text-xs tracking-[0.16em] text-muted-foreground">词条索引</h2>
            <span class="font-mono text-xs text-muted-foreground/60">{{ wikiTerms.length }}</span>
          </div>
          <div v-for="group in wikiIndex" :key="group.name" class="pt-3">
            <div class="text-xs text-muted-foreground/70 mb-1.5">{{ group.name }} · {{ group.count }}</div>
            <div class="text-sm leading-7">
              <template v-for="(term, i) in group.terms" :key="term.slug">
                <NuxtLink :to="`/wiki/${term.slug}/`" class="hover:text-primary transition-colors">{{ term.term }}</NuxtLink>
                <span v-if="i < group.terms.length - 1" class="text-muted-foreground/50"> · </span>
              </template>
            </div>
          </div>
          <NuxtLink to="/wiki/" class="inline-block text-xs text-primary hover:underline pt-4">全部 {{ wikiTerms.length }} 条词条 →</NuxtLink>
        </section>

        <!-- 快捷入口 -->
        <section class="mb-4">
          <div class="border-b border-border/70 pb-2 mb-3">
            <h2 class="text-xs tracking-[0.16em] text-muted-foreground">快捷入口</h2>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <NuxtLink v-for="link in quickLinks" :key="link.to" :to="link.to" class="hover:text-primary transition-colors">
              {{ link.label }}
            </NuxtLink>
          </div>
        </section>
      </aside>
    </div>

    <footer class="border-t border-border/60 mt-12 pt-5 pb-2 text-xs text-muted-foreground">
      纯本地计算，数据不上传 · 开源免费 · 无广告 · 共 {{ tools.length }} 款工具
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Clipboard, X, Shuffle } from 'lucide-vue-next'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { collections } from '~/data/collections'
import { aiTools, aiCategories } from '~/data/ai-tools'
import { wikiTerms, wikiCategories } from '~/data/wiki-terms'
import { initToolsData, getRecentTools, addRecentTool } from '~/composables/useTools'

initToolsData()

const router = useRouter()
const pad = (n) => String(n).padStart(2, '0')
const categoryName = (id) => categories.find(c => c.id === id)?.name || ''
const aiCategoryName = (id) => aiCategories.find(c => c.id === id)?.name || 'AI 工具'

// 跨分类的确定性精选，避免按 hot 顺序取到清一色加密哈希工具
const FEATURED_IDS = [
  'json-formatter', 'base64-encode', 'regex-tester', 'timestamp-convert',
  'image-compress', 'unit-converter', 'password-generator', 'jwt-decode',
  'qr-code-generator', 'cron-generator'
]
const featuredTools = [
  ...FEATURED_IDS.map(id => tools.find(t => t.id === id)).filter(Boolean),
  ...tools.filter(t => t.hot && !FEATURED_IDS.includes(t.id))
].slice(0, 10)

// 本站差异化长尾：具体场景的实用计算，别处少见
const NICHE_IDS = [
  'concrete-mix-calculator', 'plywood-cut-planner', 'torque-unit-converter',
  'pesticide-dilution-calculator', 'cross-stitch-calculator', 'knitting-yarn-calculator',
  'print-cost-calculator', 'truck-loading-calculator'
]
const nicheTools = NICHE_IDS.map(id => tools.find(t => t.id === id)).filter(Boolean)

const stats = [
  { value: tools.length, label: '款工具' },
  { value: categories.length, label: '个分类' },
  { value: tools.filter(t => t.local === true).length, label: '本地计算' },
  { value: aiTools.length, label: 'AI 产品' },
  { value: wikiTerms.length, label: '技术词条' }
]

const categoryIndex = categories
  .map(c => ({ ...c, count: tools.filter(t => t.category === c.id).length }))
  .sort((a, b) => (a.sort || 0) - (b.sort || 0))

const featuredCollections = collections.slice(0, 6)
const aiFeatured = aiTools.filter(t => t.featured).slice(0, 8)
const wikiIndex = wikiCategories.map(name => ({
  name,
  count: wikiTerms.filter(t => t.category === name).length,
  terms: wikiTerms.filter(t => t.category === name).slice(0, 3)
}))

const tryQueries = ['时间戳', '扭矩', '毛线用量']
const quickLinks = [
  { label: '标签导航', to: '/tags/' },
  { label: '工具探索', to: '/explore/' },
  { label: '收藏夹', to: '/favorites/' },
  { label: '最近使用', to: '/recent/' },
  { label: '站点地图', to: '/sitemap/' }
]

// ---- 首页 TDK：差异化定位，避开「开发者工具箱 / JSON格式化」等红海通用词正面竞争 ----
// 战略：首页只承担「品牌 + 品类 + 隐私本地」的信号，具体长尾词交给 762 个工具页与 16 个专题页去覆盖。
const siteUrl = 'https://www.util.cn'
const seoTitle = `有条工具 · ${tools.length} 款免注册的本地小工具 | 计算 换算 转换`
const seoDescription = `有条工具收录 ${tools.length} 款免注册的浏览器小工具，覆盖 ${categories.length} 类真实场景：除 JSON 格式化、正则测试，还有混凝土配合比、板材开料、扭矩换算、毛线用量这类少见的实用计算。纯本地运行，数据不上传、无广告，另附 AI 导航与技术词条。`
const seoKeywords = '本地计算工具,免注册在线工具,在线换算器,隐私安全工具箱,场景工具合集,离线可用小工具,实用计算器,有条工具'

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: '有条工具',
    description: seoDescription,
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/all/?search={search_term_string}` },
      'query-input': 'required name=search_term_string'
    }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: '有条工具',
    url: `${siteUrl}/`,
    logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '精选工具',
    numberOfItems: featuredTools.length,
    itemListElement: featuredTools.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: tool.name,
      url: `${siteUrl}/tools/${tool.id}/`
    }))
  }
]

useHead({
  title: seoTitle,
  meta: [
    { name: 'description', content: seoDescription },
    { name: 'keywords', content: seoKeywords },
    { name: 'robots', content: 'index,follow,max-image-preview:large' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: '有条工具' },
    { property: 'og:locale', content: 'zh_CN' },
    { property: 'og:title', content: seoTitle },
    { property: 'og:description', content: seoDescription },
    { property: 'og:url', content: `${siteUrl}/` },
    { property: 'og:image', content: `${siteUrl}/logo.png` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: seoTitle },
    { name: 'twitter:description', content: seoDescription }
  ],
  link: [{ rel: 'canonical', href: `${siteUrl}/`, key: 'canonical' }],
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd) }]
})

// ---- 交互状态 ----
const searchQuery = ref('')
const clipboardSuggestion = ref(null)

const searchResults = computed(() => {
  const q = String(searchQuery.value || '').trim().toLowerCase()
  if (!q) return []
  return tools.filter(tool =>
    String(tool.name || '').toLowerCase().includes(q) ||
    String(tool.description || '').toLowerCase().includes(q) ||
    (tool.keywords || []).some(k => String(k || '').toLowerCase().includes(q)) ||
    (tool.tags || []).some(k => String(k || '').toLowerCase().includes(q))
  ).slice(0, 6)
})

const recentTools = computed(() => getRecentTools()
  .map(id => tools.find(tool => tool.id === id))
  .filter(Boolean)
  .slice(0, 5)
)

const handleSearchEnter = () => {
  const q = String(searchQuery.value || '').trim()
  if (q) router.push(`/all/?search=${encodeURIComponent(q)}`)
}

// 随机工具只在点击时取随机数，不参与 SSR 渲染，避免 hydration 漂移
const openRandomTool = () => {
  const tool = tools[Math.floor(Math.random() * tools.length)]
  if (!tool) return
  addRecentTool(tool.id)
  router.push(`/tools/${tool.id}/`)
}

const goToTool = (toolId) => {
  const tool = tools.find(t => t.id === toolId)
  if (!tool) return
  addRecentTool(tool.id)
  router.push(`/tools/${tool.id}/`)
}

const dismissClipboardSuggestion = () => {
  clipboardSuggestion.value = null
}

// 仅在用户主动点击时读取剪贴板：不全局监听 paste，避免干扰输入
const detectClipboardContent = async () => {
  if (typeof window === 'undefined' || !navigator.clipboard || !window.isSecureContext) return
  try {
    const text = (await navigator.clipboard.readText()).trim()
    if (!text) return

    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      try {
        JSON.parse(text)
        clipboardSuggestion.value = { type: 'JSON', toolId: 'json-formatter', toolName: 'JSON格式化' }
        return
      } catch (e) { /* 非合法 JSON，继续检测其它类型 */ }
    }

    if (text.startsWith('eyJ') && text.split('.').length === 3) {
      clipboardSuggestion.value = { type: 'JWT', toolId: 'jwt-decode', toolName: 'JWT解析器' }
      return
    }

    if (/^\d{10,13}$/.test(text)) {
      clipboardSuggestion.value = { type: '时间戳', toolId: 'timestamp-convert', toolName: '时间戳转换' }
      return
    }

    if (text.length >= 16 && text.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(text)) {
      if (/[A-Za-z]/.test(text) && /[0-9+/=]/.test(text)) {
        try {
          if (atob(text).length > 0) {
            clipboardSuggestion.value = { type: 'Base64', toolId: 'base64-encode', toolName: 'Base64编码' }
          }
        } catch (e) { /* 无法解码，不是 Base64 */ }
      }
    }
  } catch (error) {
    // 用户拒绝剪贴板权限，静默处理
  }
}
</script>
