<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- 目录页头部：与首页区分，不再重复大 hero -->
    <div class="mb-8">
      <h1 class="text-display lg:text-display-lg mb-3 text-foreground">
        全部工具<span v-if="currentPage > 1" class="text-muted-foreground"> 第 {{ currentPage }} 页</span>
      </h1>
      <p class="text-muted-foreground mb-6">
        {{ tools.length }} 款工具，按分类筛选或直接搜索。全部支持浏览器本地计算。
      </p>

      <div class="relative max-w-2xl">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search class="w-5 h-5 text-muted-foreground" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          class="block w-full rounded-none border-0 border-b border-border/70 bg-transparent pl-11 pr-4 py-3.5 text-base transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
          placeholder="搜索工具名称、描述或关键词…"
          @keydown.enter="syncUrl"
        >
      </div>
    </div>

    <!-- 分类筛选 -->
    <div class="flex flex-wrap gap-x-5 mb-8 border-b border-border/60">
      <button
        :class="filterClass('all')"
        @click="setCategory('all')"
      >
        全部 <span class="opacity-60">{{ tools.length }}</span>
      </button>
      <button
        v-for="category in categoriesWithCount"
        :key="category.id"
        :class="filterClass(category.id)"
        @click="setCategory(category.id)"
      >
        {{ category.name }} <span class="opacity-60">{{ category.count }}</span>
      </button>
    </div>

    <!-- 结果统计 -->
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-base font-medium flex items-center gap-2">
        <LayoutGrid class="w-4 h-4 text-muted-foreground" />
        {{ activeCategory === 'all' ? '全部工具' : activeCategoryName }}
      </h2>
      <span class="text-sm text-muted-foreground">
        {{ filteredTools.length }} 个结果<span v-if="totalPages > 1"> / 第 {{ currentPage }} / {{ totalPages }} 页</span>
      </span>
    </div>

    <!-- 工具网格：每页 48 个，避免一次渲染 762 张卡 -->
    <div v-if="pagedTools.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8">
      <ToolCard
        v-for="tool in pagedTools"
        :key="tool.id"
        :tool="tool"
        :title="tool.name"
        :description="tool.description"
        :category="tool.category"
        :icon="tool.icon"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-24">
      <div class="inline-flex items-center justify-center w-16 h-16 text-muted-foreground/60 mb-4">
        <SearchX class="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-medium text-foreground">未找到相关工具</h3>
      <p class="text-muted-foreground mt-2">
        换个关键词，或<button class="text-primary hover:underline" @click="resetFilters">清除筛选</button>
      </p>
    </div>

    <!--
      分页使用真实目录路径 /all/page/N/（而不是 ?page=N），
      每一页都会被 nuxt generate 预渲染为 all/page/N/index.html，nginx 目录索引直接命中。
    -->
    <nav v-if="totalPages > 1" class="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 mt-10" aria-label="全部工具分页">
      <NuxtLink
        v-if="currentPage > 1"
        :to="pageLink(currentPage - 1)"
        class="px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >上一页</NuxtLink>
      <span v-else class="px-3 py-2 text-sm text-muted-foreground/40">上一页</span>

      <template v-for="n in totalPages" :key="n">
        <span
          v-if="n === currentPage"
          aria-current="page"
          class="min-w-8 px-2 py-1.5 text-center text-sm font-medium text-foreground tabular-nums"
        >{{ n }}</span>
        <NuxtLink
          v-else
          :to="pageLink(n)"
          class="min-w-8 px-2 py-1.5 text-center text-sm text-muted-foreground hover:text-primary transition-colors tabular-nums"
        >{{ n }}</NuxtLink>
      </template>

      <NuxtLink
        v-if="currentPage < totalPages"
        :to="pageLink(currentPage + 1)"
        class="px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >下一页</NuxtLink>
      <span v-else class="px-3 py-2 text-sm text-muted-foreground/40">下一页</span>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, LayoutGrid, SearchX } from 'lucide-vue-next'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { initToolsData } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'
import { siteConfig } from '~/data/site'
import { TOOLS_PAGE_SIZE, TOTAL_TOOL_PAGES, toolPagePath } from '~/data/pagination'

const props = defineProps({
  // 由路由决定：/all -> 1，/all/page/2 -> 2
  pageNumber: {
    type: Number,
    default: 1
  }
})

initToolsData()

const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const activeCategory = ref('all')

const categoryIds = new Set(categories.map(c => c.id))

// 静态页的 SSR 内容由路由参数决定；?search= / ?category= 属于筛选态，
// 预渲染时为空，客户端挂载后再应用，避免 hydration 不一致。
onMounted(() => {
  const category = String(route.query.category || 'all')
  activeCategory.value = categoryIds.has(category) ? category : 'all'
  searchQuery.value = String(route.query.search || '')
})

const categoriesWithCount = computed(() => categories
  .map(category => ({
    ...category,
    count: tools.filter(tool => tool.category === category.id).length
  }))
  .sort((a, b) => (a.sort || 0) - (b.sort || 0))
)

const activeCategoryName = computed(() =>
  categoriesWithCount.value.find(c => c.id === activeCategory.value)?.name || '工具'
)

const filteredTools = computed(() => {
  const q = String(searchQuery.value || '').trim().toLowerCase()
  return tools.filter(tool => {
    if (activeCategory.value !== 'all' && tool.category !== activeCategory.value) return false
    if (!q) return true
    return String(tool.name || '').toLowerCase().includes(q) ||
      String(tool.description || '').toLowerCase().includes(q) ||
      (tool.keywords || []).some(k => String(k || '').toLowerCase().includes(q)) ||
      (tool.tags || []).some(k => String(k || '').toLowerCase().includes(q))
  }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTools.value.length / TOOLS_PAGE_SIZE)))

const isFiltered = computed(() =>
  Boolean(String(searchQuery.value || '').trim()) || activeCategory.value !== 'all'
)

// 搜索时回到结果第 1 页；筛选导致页数变少时钳制到最后一页
const currentPage = computed(() => {
  if (String(searchQuery.value || '').trim()) return 1
  return Math.min(Math.max(1, Number(props.pageNumber) || 1), totalPages.value)
})

const pagedTools = computed(() => {
  const start = (currentPage.value - 1) * TOOLS_PAGE_SIZE
  return filteredTools.value.slice(start, start + TOOLS_PAGE_SIZE)
})

const filterClass = (id) => [
  'inline-flex items-center gap-1.5 text-sm px-1 py-2.5 border-b-2 -mb-px transition-colors',
  activeCategory.value === id
    ? 'border-primary text-foreground'
    : 'border-transparent text-muted-foreground hover:text-foreground'
]

const buildQuery = () => {
  const query = {}
  const q = String(searchQuery.value || '').trim()
  if (q) query.search = q
  if (activeCategory.value !== 'all') query.category = activeCategory.value
  return query
}

const pageLink = (n) => ({
  path: toolPagePath(n),
  query: buildQuery()
})

// 搜索 / 清除筛选后回到目录第 1 页，避免停留在越界页码
const syncUrl = () => {
  router.replace({ path: '/all', query: buildQuery() })
}

const setCategory = (id) => {
  activeCategory.value = id
  router.replace({ path: '/all', query: buildQuery() })
}

const resetFilters = () => {
  searchQuery.value = ''
  activeCategory.value = 'all'
  router.replace({ path: '/all' })
}

// ---- SEO：分页页自引用 canonical + prev/next，避免被当成重复页 ----
const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || 'https://www.util.cn').replace(/\/+$/, '')
const canonicalUrl = computed(() => `${siteUrl}${toolPagePath(currentPage.value)}`)

useHead(() => {
  const n = currentPage.value
  const first = (n - 1) * TOOLS_PAGE_SIZE + 1
  const last = Math.min(n * TOOLS_PAGE_SIZE, tools.length)

  const title = n > 1
    ? `全部工具 第 ${n} 页${siteConfig.titleSuffix}`
    : `全部工具${siteConfig.titleSuffix}`

  const description = n > 1
    ? `全部工具第 ${n} 页，共 ${TOTAL_TOOL_PAGES} 页。浏览第 ${first}–${last} 款免注册的浏览器本地工具，覆盖开发、计算、设计、文本、图像与工程场景，数据不上传。`
    : `有条工具收录 ${tools.length} 款免注册的浏览器本地工具，覆盖开发、计算、设计、文本、图像、工程等场景。支持分类筛选与分页浏览，数据不上传。`

  return {
    title,
    meta: [
      { name: 'description', content: description },
      ...(isFiltered.value ? [{ name: 'robots', content: 'noindex, follow' }] : [])
    ],
    link: [
      { rel: 'canonical', href: canonicalUrl.value, key: 'canonical' },
      ...(n > 1 ? [{ rel: 'prev', href: `${siteUrl}${toolPagePath(n - 1)}` }] : []),
      ...(n < TOTAL_TOOL_PAGES ? [{ rel: 'next', href: `${siteUrl}${toolPagePath(n + 1)}` }] : [])
    ]
  }
})
</script>
