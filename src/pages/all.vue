<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- 目录页头部：与首页区分，不再重复大 hero -->
    <div class="mb-8">
      <h1 class="text-display lg:text-display-lg mb-3 text-foreground">全部工具</h1>
      <p class="text-muted-foreground mb-6">{{ tools.length }} 款工具，按分类筛选或直接搜索。全部支持浏览器本地计算。</p>

      <div class="relative max-w-2xl">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search class="w-5 h-5 text-muted-foreground" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          class="block w-full rounded-none border-0 border-b border-border/70 bg-transparent pl-11 pr-4 py-3.5 text-base transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
          placeholder="搜索工具名称、描述或关键词…"
          @input="page = 1"
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

    <!-- 工具网格：每页 48 个，避免一次渲染 748 张卡 -->
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

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-10">
      <button
        class="px-4 py-2 text-sm text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >上一页</button>
      <span class="text-sm text-muted-foreground tabular-nums">{{ currentPage }} / {{ totalPages }}</span>
      <button
        class="px-4 py-2 text-sm text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
      >下一页</button>
    </div>
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
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('全部工具')
initToolsData()

const router = useRouter()
const route = useRoute()

const PAGE_SIZE = 48
const searchQuery = ref('')
const activeCategory = ref('all')
const page = ref(1)

// 兼容首页跳入的 /all/?search=xxx，并支持 ?category= & ?page= 直达
onMounted(() => {
  page.value = Math.max(1, Number(route.query.page) || 1)
  activeCategory.value = String(route.query.category || 'all')
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

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTools.value.length / PAGE_SIZE)))
// 筛选条件变化后 page 可能越界，显示时做钳制
const currentPage = computed(() => Math.min(page.value, totalPages.value))
const pagedTools = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredTools.value.slice(start, start + PAGE_SIZE)
})

const filterClass = (id) => [
  'inline-flex items-center gap-1.5 text-sm px-1 py-2.5 border-b-2 -mb-px transition-colors',
  activeCategory.value === id
    ? 'border-primary text-foreground'
    : 'border-transparent text-muted-foreground hover:text-foreground'
]

const syncUrl = () => {
  const query = {}
  const q = String(searchQuery.value || '').trim()
  if (q) query.search = q
  if (activeCategory.value !== 'all') query.category = activeCategory.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  router.replace({ path: '/all', query })
}

const setCategory = (id) => {
  activeCategory.value = id
  page.value = 1
  syncUrl()
}

const goToPage = (n) => {
  page.value = Math.min(Math.max(1, n), totalPages.value)
  syncUrl()
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetFilters = () => {
  searchQuery.value = ''
  activeCategory.value = 'all'
  page.value = 1
  syncUrl()
}
</script>
