<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Tag, Tool, Clock, Eye, TrendingUp, Grid, List } from 'lucide-vue-next'

// 获取路由参数
const route = useRoute()
const router = useRouter()

// 获取标签管理器实例
const { $tagManager } = useNuxtApp()

// 响应式数据
const tag = ref(null)
const tools = ref([])
const relatedTags = ref([])
const viewMode = ref('grid')
const sortBy = ref('popularity')
const isLoading = ref(true)

// 计算属性
const tagParam = computed(() => route.params.tag)

const filteredAndSortedTools = computed(() => {
  if (!tools.value.length) return []

  let sortedTools = [...tools.value]

  // 排序
  switch (sortBy.value) {
    case 'name':
      sortedTools.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'updated':
      sortedTools.sort((a, b) => {
        const aTime = new Date(a.lastUpdated || 0).getTime()
        const bTime = new Date(b.lastUpdated || 0).getTime()
        return bTime - aTime
      })
      break
    case 'views':
      sortedTools.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      break
    case 'popularity':
    default:
      // 综合热度排序：考虑viewCount、new、hot等因素
      sortedTools.sort((a, b) => {
        let scoreA = (a.viewCount || 0)
        let scoreB = (b.viewCount || 0)

        if (a.hot) scoreA += 10000
        if (b.hot) scoreB += 10000
        if (a.new) scoreA += 5000
        if (b.new) scoreB += 5000

        return scoreB - scoreA
      })
      break
  }

  return sortedTools
})

const tagStats = computed(() => {
  if (!tag.value) return null

  const totalViews = tools.value.reduce((sum, tool) => sum + (tool.viewCount || 0), 0)
  const hotTools = tools.value.filter(tool => tool.hot).length
  const newTools = tools.value.filter(tool => tool.new).length

  return {
    totalTools: tools.value.length,
    totalViews,
    hotTools,
    newTools,
    avgViews: tools.value.length > 0 ? Math.round(totalViews / tools.value.length) : 0
  }
})

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
    'ai': 'bg-purple-100 text-purple-800',
    'calculate': 'bg-blue-100 text-blue-800',
    'crypto': 'bg-red-100 text-red-800',
    'data': 'bg-green-100 text-green-800',
    'design': 'bg-pink-100 text-pink-800',
    'dev': 'bg-indigo-100 text-indigo-800',
    'encode': 'bg-yellow-100 text-yellow-800',
    'finance': 'bg-emerald-100 text-emerald-800',
    'format': 'bg-cyan-100 text-cyan-800',
    'health': 'bg-orange-100 text-orange-800',
    'image': 'bg-teal-100 text-teal-800',
    'network': 'bg-violet-100 text-violet-800',
    'productivity': 'bg-amber-100 text-amber-800',
    'random': 'bg-lime-100 text-lime-800',
    'security': 'bg-rose-100 text-rose-800',
    'text': 'bg-sky-100 text-sky-800',
    'time': 'bg-slate-100 text-slate-800',
    'visualization': 'bg-fuchsia-100 text-fuchsia-800'
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

// 方法
const loadTagData = async () => {
  isLoading.value = true

  try {
    // 通过URL参数获取标签
    const foundTag = $tagManager?.getTagByUrlName(tagParam.value)

    if (!foundTag) {
      console.error(`Tag not found: ${tagParam.value}`)
      router.push('/tags')
      return
    }

    tag.value = foundTag
    tools.value = foundTag.tools || []

    // 获取相关标签
    relatedTags.value = $tagManager?.getRelatedTags(foundTag.name, 6) || []

    // 设置页面SEO信息
    const pageTitle = `${foundTag.displayName} - 有条工具`
    const pageDescription = `查看${foundTag.displayName}标签下的${foundTag.toolCount}个工具，${foundTag.description}`

    useHead({
      title: pageTitle,
      meta: [
        { name: 'description', content: pageDescription },
        { name: 'keywords', content: `${foundTag.displayName},工具,${foundTag.categories.join(',')}` }
      ]
    })

  } catch (error) {
    console.error('Failed to load tag data:', error)
    router.push('/tags')
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.push('/tags')
}

const navigateToTool = (tool) => {
  router.push(`/tools/${tool.id}`)
}

// 页面加载和路由变化时加载数据
onMounted(() => {
  loadTagData()
})

// 监听路由参数变化
watch(() => route.params.tag, () => {
  if (route.params.tag !== tagParam.value) {
    loadTagData()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 面包屑导航 -->
      <nav class="flex mb-8" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
          <li class="inline-flex items-center">
            <NuxtLink
              to="/"
              class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              首页
            </NuxtLink>
          </li>
          <li>
            <div class="flex items-center">
              <span class="text-gray-400">/</span>
              <NuxtLink
                to="/tags"
                class="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                标签
              </NuxtLink>
            </div>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <span class="text-gray-400">/</span>
              <span class="ml-1 text-sm font-medium text-gray-500">
                {{ tag?.displayName || tagParam }}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600">加载标签数据中...</p>
      </div>

      <!-- 标签内容 -->
      <div v-else-if="tag" class="space-y-8">
        <!-- 标签头部信息 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- 返回按钮 -->
              <button
                @click="goBack"
                class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft class="w-4 h-4 mr-1" />
                返回标签列表
              </button>

              <!-- 标签标题 -->
              <div class="flex items-center gap-3 mb-4">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                  <Tag class="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 class="text-3xl font-bold text-gray-900">{{ tag.displayName }}</h1>
                  <p class="text-gray-600 mt-1">{{ tag.description }}</p>
                </div>
                <div v-if="tag.hot" class="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  <TrendingUp class="w-4 h-4 mr-1" />
                  热门标签
                </div>
              </div>

              <!-- 标签统计 -->
              <div v-if="tagStats" class="grid grid-cols-2 md:grid-cols-5 gap-6 mt-6">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">
                    {{ tagStats.totalTools }}
                  </div>
                  <div class="text-sm text-gray-600">工具总数</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600">
                    {{ tagStats.totalViews.toLocaleString() }}
                  </div>
                  <div class="text-sm text-gray-600">总访问量</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">
                    {{ tagStats.avgViews.toLocaleString() }}
                  </div>
                  <div class="text-sm text-gray-600">平均访问量</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-red-600">
                    {{ tagStats.hotTools }}
                  </div>
                  <div class="text-sm text-gray-600">热门工具</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-yellow-600">
                    {{ tagStats.newTools }}
                  </div>
                  <div class="text-sm text-gray-600">新工具</div>
                </div>
              </div>

              <!-- 分类标签 -->
              <div class="mt-6">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-700">包含分类:</span>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="category in tag.categories"
                      :key="category"
                      :class="[
                        'inline-block px-3 py-1 text-sm rounded-full',
                        getCategoryColor(category)
                      ]"
                    >
                      {{ getCategoryName(category) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 工具列表控制栏 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 class="text-xl font-semibold text-gray-900">
              相关工具 ({{ tools.length }})
            </h2>

            <div class="flex gap-3">
              <!-- 排序选择 -->
              <select
                v-model="sortBy"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="popularity">按热度排序</option>
                <option value="views">按访问量排序</option>
                <option value="name">按名称排序</option>
                <option value="updated">按更新时间排序</option>
              </select>

              <!-- 视图切换 -->
              <div class="flex border border-gray-300 rounded-lg">
                <button
                  :class="[
                    'px-3 py-2',
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  ]"
                  @click="viewMode = 'grid'"
                >
                  <Grid class="w-5 h-5" />
                </button>
                <button
                  :class="[
                    'px-3 py-2 border-l border-gray-300',
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  ]"
                  @click="viewMode = 'list'"
                >
                  <List class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 工具网格视图 -->
        <div v-if="viewMode === 'grid' && filteredAndSortedTools.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="tool in filteredAndSortedTools"
            :key="tool.id"
            class="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
            @click="navigateToTool(tool)"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {{ tool.name }}
                </h3>
                <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                  {{ tool.description }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <component :is="tool.icon" class="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
                <div class="flex gap-1">
                  <span v-if="tool.hot" class="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    热门
                  </span>
                  <span v-if="tool.new" class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    新品
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between text-sm text-gray-500">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1">
                  <Eye class="w-4 h-4" />
                  {{ (tool.viewCount || 0).toLocaleString() }}
                </span>
                <span class="flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  {{ tool.lastUpdated ? new Date(tool.lastUpdated).toLocaleDateString() : '未知' }}
                </span>
              </div>
              <span :class="getCategoryColor(tool.category)">
                {{ getCategoryName(tool.category) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 工具列表视图 -->
        <div v-else-if="viewMode === 'list' && filteredAndSortedTools.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="divide-y divide-gray-200">
            <div
              v-for="tool in filteredAndSortedTools"
              :key="tool.id"
              class="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="navigateToTool(tool)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <component :is="tool.icon" class="w-6 h-6 text-gray-400" />
                    <h3 class="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {{ tool.name }}
                    </h3>
                    <div class="flex gap-2">
                      <span v-if="tool.hot" class="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        热门
                      </span>
                      <span v-if="tool.new" class="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        新品
                      </span>
                    </div>
                  </div>
                  <p class="text-gray-600 mt-2">{{ tool.description }}</p>
                  <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span class="flex items-center gap-1">
                      <Eye class="w-4 h-4" />
                      {{ (tool.viewCount || 0).toLocaleString() }} 次访问
                    </span>
                    <span class="flex items-center gap-1">
                      <Clock class="w-4 h-4" />
                      {{ tool.lastUpdated ? new Date(tool.lastUpdated).toLocaleDateString() : '未知更新时间' }}
                    </span>
                    <span :class="getCategoryColor(tool.category)">
                      {{ getCategoryName(tool.category) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!isLoading && filteredAndSortedTools.length === 0" class="text-center py-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Tool class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">暂无相关工具</h3>
          <p class="text-gray-600">该标签下暂时没有工具</p>
        </div>

        <!-- 相关标签 -->
        <div v-if="relatedTags.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">相关标签</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <NuxtLink
              v-for="relatedTag in relatedTags"
              :key="relatedTag.name"
              :to="`/tag/${relatedTag.urlName}`"
              class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Tag class="w-8 h-8 text-gray-600 mb-2" />
              <span class="text-sm font-medium text-gray-900 text-center">
                {{ relatedTag.displayName }}
              </span>
              <span class="text-xs text-gray-500 mt-1">
                {{ relatedTag.toolCount }} 个工具
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
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