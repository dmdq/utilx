<template>
  <div>
    <!-- Hero 区域 -->
    <div
      id="heroSection"
      class="max-w-8xl mx-auto mb-12 mt-4 lg:mt-8 text-center animate-fade-in"
    >
      <h2 class="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
        数字创作者的万能工具箱
      </h2>
      <p class="text-muted-foreground mb-8 text-lg">无论是调试代码还是处理图像，这里都有你得心应手的利器。纯本地，更安全。</p>

      <!-- 大搜索框 -->
      <div class="relative max-w-2xl mx-auto shadow-2xl shadow-primary/10 rounded-xl">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search class="w-5 h-5 text-muted-foreground" />
        </div>
        <input
          v-model="heroSearch"
          type="text"
          class="block w-full rounded-xl border border-border bg-muted/50 pl-11 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground/70"
          placeholder="搜索你需要的工具，如 'JSON', 'MD5', '正则'..."
          @input="handleSearch"
        >
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <span class="text-xs text-muted-foreground bg-muted border border-border px-2 py-1 rounded hidden sm:block">Enter</span>
        </div>
      </div>

      <!-- 热门推荐胶囊 -->
      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <span class="text-xs text-muted-foreground py-1">热门搜索：</span>
        <button
          class="text-xs px-3 py-1 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors border border-border"
          @click="setSearchTerm('JSON格式化')"
        >
          JSON 格式化
        </button>
        <button
          class="text-xs px-3 py-1 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors border border-border"
          @click="setSearchTerm('时间戳转换')"
        >
          时间戳转换
        </button>
        <button
          class="text-xs px-3 py-1 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors border border-border"
          @click="setSearchTerm('Base64编码')"
        >
          Base64 编码
        </button>
        <button
          class="text-xs px-3 py-1 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors border border-border"
          @click="setSearchTerm('Cron')"
        >
          Cron 生成器
        </button>
        <button
          class="text-xs px-3 py-1 rounded-full bg-muted/50 hover:bg-primary/20 hover:text-primary transition-colors border border-border"
          @click="setSearchTerm('JWT')"
        >
          JWT 解码
        </button>
     
      </div>
    </div>

    <!-- 工具网格 -->
    <div class="max-w-8xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold flex items-center gap-2" id="gridTitle">
          <LayoutGrid class="w-5 h-5 text-primary" />
          全部工具
        </h3>
        <div class="text-sm text-muted-foreground" id="toolCount">
          {{ filteredTools.length }} 个工具
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="toolGrid">
        <ToolCard
          v-for="tool in filteredTools"
          :key="tool.id"
          :tool="tool"
          :title="tool.name"
          :description="tool.description"
          :category="tool.category"
          :usage-count="formatViewCount(tool.viewCount)"
          :icon="tool.icon"
          @select="handleToolSelect"
        />
      </div>

      <!-- 空状态 -->
      <div
        id="emptyState"
        class="hidden text-center py-24"
        v-show="filteredTools.length === 0"
      >
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <SearchX class="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-medium text-foreground">未找到相关工具</h3>
        <p class="text-muted-foreground mt-2">试试搜索 "json" 或 "timestamp"</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Search, LayoutGrid, SearchX, Github
} from 'lucide-vue-next'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { initToolsData, addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('全部工具')


// 初始化工具数据
initToolsData()

const router = useRouter()
const route = useRoute()

// 数据状态
const currentCategory = ref('all')
const heroSearch = ref('')
const sidebarSearch = ref('')

// 计算属性：过滤后的工具
const filteredTools = computed(() => {
  const searchTerm = String(heroSearch.value || '').toLowerCase()

  return tools.filter(tool => {
    const matchesCategory = currentCategory.value === 'all' || tool.category === currentCategory.value
    const matchesSearch = !searchTerm ||
      String(tool.name || '').toLowerCase().includes(searchTerm) ||
      String(tool.description || '').toLowerCase().includes(searchTerm) ||
      (tool.keywords || []).some(keyword => String(keyword || '').toLowerCase().includes(searchTerm))

    return matchesCategory && matchesSearch
  })
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

const handleSearch = (event) => {
  const term = event.target.value
  heroSearch.value = term
  sidebarSearch.value = term
}

const setSearchTerm = (term) => {
  heroSearch.value = term
  sidebarSearch.value = term
}

const handleToolSelect = (tool) => {
  console.log('Selected tool:', tool)
  // 跳转到工具详情页 - 使用目录结构格式
  router.push(`/tools/${tool.id}/`)
  // 添加到最近使用
  addRecentTool(tool.id)
}

// 组件挂载时检查URL参数
onMounted(() => {
  // 从URL查询参数中获取搜索词
  const searchQuery = route.query.search
  if (searchQuery) {
    heroSearch.value = searchQuery
    sidebarSearch.value = searchQuery
  }
})
</script>