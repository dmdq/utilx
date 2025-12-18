<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Tag, TrendingUp, Grid, List, Filter, LayoutGrid, X } from 'lucide-vue-next'

// 设置页面元数据
useHead({
  title: '标签导航 - 有条工具',
  meta: [
    { name: 'description', content: '通过标签快速找到合适的工具，支持按应用场景和功能特性筛选，提升工作效率。' },
    { name: 'keywords', content: '标签,工具分类,场景导航,工具搜索,效率提升' }
  ]
})

// 获取标签管理器实例
const { $tagManager } = useNuxtApp()

// 响应式数据
const searchQuery = ref('')
const sortBy = ref('popularity') // popularity, name, tools
const filterCategory = ref('all')
const viewMode = ref('grid') // grid, list
const isLoading = ref(false)

// 计算属性
const allTags = computed(() => {
  return $tagManager?.getAllTags() || []
})

const filteredTags = computed(() => {
  let tags = [...allTags.value]

  // 搜索过滤
  if (searchQuery.value.trim()) {
    tags = $tagManager?.searchTags(searchQuery.value) || []
  }

  // 分类过滤
  if (filterCategory.value !== 'all') {
    tags = tags.filter(tag => tag.categories.includes(filterCategory.value))
  }

  // 排序
  tags.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'tools':
        return b.toolCount - a.toolCount
      case 'popularity':
      default:
        return b.popularity - a.popularity
    }
  })

  return tags
})

const hotTags = computed(() => {
  return $tagManager?.getPopularTags(8) || []
})

const tagStats = computed(() => {
  return $tagManager?.getTagStats() || {
    totalTags: 0,
    hotTags: 0,
    totalTools: 0,
    categoryDistribution: {}
  }
})

const categories = computed(() => {
  const cats = new Set()
  allTags.value.forEach(tag => {
    tag.categories.forEach(cat => cats.add(cat))
  })
  return Array.from(cats).sort()
})

// 方法定义
const handleSearch = (query) => {
  searchQuery.value = query
}

const clearSearch = () => {
  searchQuery.value = ''
}

const getCategoryName = (category) => {
  const categoryNames = {
    'ai': 'AI智能',
    'calculate': '计算工具',
    'crypto': '加密解密',
    'data': '数据处理',
    'design': '设计辅助',
    'dev': '开发工具',
    'encode': '编码解码',
    'finance': '金融计算',
    'format': '格式化工具',
    'health': '健康工具',
    'image': '图像处理',
    'network': '网络工具',
    'productivity': '效率工具',
    'random': '随机生成',
    'security': '安全工具',
    'text': '文本处理',
    'time': '时间工具',
    'visualization': '可视化工具'
  }
  return categoryNames[category] || category
}

const getCategoryColor = (category) => {
  const colors = {
    'ai': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'calculate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'crypto': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'data': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'design': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    'dev': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    'encode': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'finance': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    'format': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    'health': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'image': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    'network': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    'productivity': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'random': 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
    'security': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    'text': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
    'time': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
    'visualization': 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300'
  }
  return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

// 页面加载时初始化
onMounted(async () => {
  isLoading.value = true
  try {
    if (!$tagManager || !$tagManager._initialized) {
      await $tagManager?.init()
    }
  } catch (error) {
    console.error('Failed to initialize tag manager:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 区域 -->
    <div class="relative text-center mb-8 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
      <!-- 呼吸极光背景效果 -->
      <div class="absolute inset-0 -z-10">
        <!-- 主要呼吸光层 -->
        <div class="absolute top-1/4 left-1/3 w-64 h-64 bg-primary/20 rounded-full filter blur-2xl animate-breathe"></div>
        <div class="absolute bottom-1/4 right-1/3 w-72 h-72 bg-secondary/15 rounded-full filter blur-2xl animate-breathe delay-2000"></div>
        <div class="absolute top-1/2 left-1/2 w-56 h-56 bg-accent/10 rounded-full filter blur-2xl animate-breathe delay-4000"></div>

        <!-- 细节光点层 -->
        <div class="absolute top-1/6 left-1/4 w-32 h-32 bg-primary/15 rounded-full filter blur-xl animate-pulse-slow"></div>
        <div class="absolute bottom-1/6 right-1/4 w-40 h-40 bg-secondary/10 rounded-full filter blur-xl animate-pulse-slow delay-1000"></div>

        <!-- 微光渐变叠加 -->
        <div class="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/30"></div>
      </div>

      <div class="relative z-10 px-6 py-8 lg:px-8 lg:py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 backdrop-blur-sm border border-primary/20">
          <Tag class="w-8 h-8 text-primary" />
        </div>
        <h1 class="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          标签导航
        </h1>
        <p class="text-lg text-muted-foreground mb-6">通过标签快速找到合适的工具，提升工作效率</p>

        <!-- 统计信息 -->
        <div class="flex justify-center gap-8 text-sm text-muted-foreground">
          <div class="flex items-center gap-1">
            <Tag class="w-4 h-4" />
            <span>{{ tagStats.totalTags }} 个标签</span>
          </div>
          <div class="flex items-center gap-1">
            <TrendingUp class="w-4 h-4" />
            <span>{{ tagStats.hotTags }} 个热门标签</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 热门标签 -->
    <div v-if="hotTags.length > 0" class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-primary" />
          热门标签
        </h2>
        <div class="text-sm text-muted-foreground">
          {{ hotTags.length }} 个热门标签
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in hotTags"
          :key="tag.name"
          :to="`/tag/${tag.urlName}`"
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 transition-all duration-200 hover:scale-105"
        >
          <TrendingUp class="w-3 h-3" />
          {{ tag.displayName }}
          <span class="bg-primary/20 px-1.5 py-0.5 rounded-full text-xs">
            {{ tag.toolCount }}
          </span>
        </NuxtLink>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="bg-card/40 backdrop-blur-sm border border-border/60 rounded-xl p-6 mb-8 shadow-sm">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- 搜索框 -->
        <div class="flex-1">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索标签..."
              class="w-full pl-10 pr-10 py-3 bg-background/80 border border-border/60 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-background transition-all placeholder:text-muted-foreground/60"
              @input="handleSearch($event.target.value)"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 筛选控件 -->
        <div class="flex gap-3">
          <!-- 分类筛选 -->
          <select
            v-model="filterCategory"
            class="px-4 py-3 bg-background/80 border border-border/60 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-background transition-all"
          >
            <option value="all">所有分类</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ getCategoryName(category) }}
            </option>
          </select>

          <!-- 排序方式 -->
          <select
            v-model="sortBy"
            class="px-4 py-3 bg-background/80 border border-border/60 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-background transition-all"
          >
            <option value="popularity">按热度排序</option>
            <option value="tools">按工具数量排序</option>
            <option value="name">按名称排序</option>
          </select>

          <!-- 视图切换 -->
          <div class="flex border border-border/60 rounded-lg bg-background/40">
            <button
              :class="[
                'px-3 py-2 transition-all',
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              ]"
              @click="viewMode = 'grid'"
            >
              <Grid class="w-5 h-5" />
            </button>
            <button
              :class="[
                'px-3 py-2 border-l border-border/60 transition-all',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              ]"
              @click="viewMode = 'list'"
            >
              <List class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- 当前筛选状态 -->
      <div v-if="searchQuery || filterCategory !== 'all'" class="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Filter class="w-4 h-4" />
        <span>当前筛选:</span>
        <span v-if="searchQuery" class="bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
          搜索: {{ searchQuery }}
        </span>
        <span v-if="filterCategory !== 'all'" class="bg-secondary/10 text-secondary px-2 py-1 rounded-full border border-secondary/20">
          分类: {{ getCategoryName(filterCategory) }}
        </span>
        <button
          @click="() => { searchQuery = ''; filterCategory = 'all' }"
          class="text-destructive hover:text-destructive/80 transition-colors"
        >
          清除筛选
        </button>
      </div>
    </div>

      <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 backdrop-blur-sm border border-primary/20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      <p class="text-muted-foreground">加载标签数据中...</p>
    </div>

    <!-- 标签网格视图 -->
    <div v-else-if="viewMode === 'grid' && filteredTags.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="tag in filteredTags"
        :key="tag.name"
        :to="`/tag/${tag.urlName}`"
        class="group bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl p-6 hover:shadow-lg hover:border-primary/50 hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <component :is="tag.icon || Tag" class="w-5 h-5 text-primary" />
              <h3 class="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {{ tag.displayName }}
              </h3>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ tag.toolCount }} 个工具
            </p>
          </div>
          <div v-if="tag.hot" class="flex-shrink-0">
            <TrendingUp class="w-5 h-5 text-destructive" />
          </div>
        </div>

        <p class="text-card-foreground/80 text-sm mb-4 line-clamp-2">
          {{ tag.description }}
        </p>

        <!-- 分类标签 -->
        <div class="flex flex-wrap gap-1 mb-4">
          <span
            v-for="category in tag.categories.slice(0, 3)"
            :key="category"
            :class="[
              'inline-block px-2 py-1 text-xs rounded-full border',
              getCategoryColor(category)
            ]"
          >
            {{ getCategoryName(category) }}
          </span>
          <span
            v-if="tag.categories.length > 3"
            class="inline-block px-2 py-1 text-xs rounded-full bg-muted/50 text-muted-foreground border border-border/40"
          >
            +{{ tag.categories.length - 3 }}
          </span>
        </div>

        <!-- 热门工具预览 -->
        <div v-if="tag.tools.length > 0" class="border-t border-border/40 pt-4">
          <div class="text-xs text-muted-foreground mb-2">热门工具:</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tool in tag.tools.slice(0, 3)"
              :key="tool.id"
              class="text-xs bg-muted/30 text-muted-foreground px-2 py-1 rounded border border-border/30"
            >
              {{ tool.name }}
            </span>
            <span
              v-if="tag.tools.length > 3"
              class="text-xs bg-muted/20 text-muted-foreground/60 px-2 py-1 rounded border border-border/20"
            >
              +{{ tag.tools.length - 3 }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

      <!-- 标签列表视图 -->
    <div v-else-if="viewMode === 'list' && filteredTags.length > 0" class="bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl shadow-sm">
      <div class="divide-y divide-border/40">
        <NuxtLink
          v-for="tag in filteredTags"
          :key="tag.name"
          :to="`/tag/${tag.urlName}`"
          class="block p-6 hover:bg-card/80 transition-all duration-200"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <component :is="tag.icon || Tag" class="w-5 h-5 text-primary" />
                <h3 class="text-lg font-semibold text-card-foreground hover:text-primary transition-colors">
                  {{ tag.displayName }}
                </h3>
                <span v-if="tag.hot" class="inline-flex items-center px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full border border-destructive/20">
                  <TrendingUp class="w-3 h-3 mr-1" />
                  热门
                </span>
              </div>
              <p class="text-muted-foreground mt-1">{{ tag.description }}</p>
              <div class="flex items-center gap-4 mt-2">
                <span class="text-sm text-muted-foreground">
                  {{ tag.toolCount }} 个工具
                </span>
                <div class="flex gap-1">
                  <span
                    v-for="category in tag.categories"
                    :key="category"
                    :class="[
                      'inline-block px-2 py-1 text-xs rounded-full border',
                      getCategoryColor(category)
                    ]"
                  >
                    {{ getCategoryName(category) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex-shrink-0 ml-4">
              <div class="text-right">
                <div class="text-2xl font-bold text-primary">
                  {{ tag.toolCount }}
                </div>
                <div class="text-xs text-muted-foreground">工具</div>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!isLoading && filteredTags.length === 0" class="text-center py-12">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-muted/30 rounded-full mb-4 backdrop-blur-sm border border-border/40">
        <Tag class="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-medium text-card-foreground mb-2">未找到匹配的标签</h3>
      <p class="text-muted-foreground mb-4">
        尝试调整搜索关键词或筛选条件
      </p>
      <button
        @click="() => { searchQuery = ''; filterCategory = 'all' }"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        重置筛选
      </button>
    </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>