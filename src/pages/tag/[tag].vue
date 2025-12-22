
<template>
  <div class="min-h-screen bg-background">
    <div class="max-w-8xl mx-auto py-8 px-4">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 backdrop-blur-sm border border-primary/20">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p class="text-muted-foreground">加载标签数据中...</p>
      </div>

      <!-- 标签内容 -->
      <div v-else-if="tag" class="space-y-8">
        <!-- 标签头部信息 -->
        <div class="bg-card/40 backdrop-blur-sm border-0 rounded-xl p-8 relative overflow-hidden">
          <!-- 背景装饰 -->
          <div class="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
               :style="{ backgroundColor: tag.color + '40', transform: 'translate(30%, -30%)' }"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
               :style="{ backgroundColor: tag.color + '40', transform: 'translate(-30%, 30%)' }"></div>

          <div class="relative">
            <div class="flex items-start justify-between mb-6">
              <div class="flex-1">

                <!-- 标签标题 -->
                <div class="flex items-center gap-6">
                  <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg"
                       :style="{ backgroundColor: tag.color + '20', color: tag.color }">
                    <component :is="getIconComponent(tag.icon)" class="w-10 h-10" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h1 class="text-4xl font-bold text-foreground">{{ tag.name }}</h1>
                      <h2 class="text-2xl font-normal text-muted-foreground">标签工具合集</h2>
                      <div v-if="tag.toolCount >= 5" class="inline-flex items-center px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-medium">
                        <TrendingUp class="w-4 h-4 mr-1" />
                        热门
                      </div>
                    </div>
                    <p class="text-xl text-muted-foreground mb-1">{{ tag.description }}</p>
                    <p class="text-sm text-muted-foreground opacity-80">
                      精选{{ tagStats?.totalTools || 0 }}个{{ tag.name.toLowerCase() }}相关工具，助力{{ getCategoryName(tag.categories[0]) }}工作效率提升
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 标签统计卡片 -->
            <div v-if="tagStats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div class="bg-card/60 backdrop-blur-sm rounded-lg p-4 text-center border border-border/50">
                <div class="text-3xl font-bold text-primary mb-1">
                  {{ tagStats.totalTools }}
                </div>
                <div class="text-sm text-muted-foreground">工具总数</div>
              </div>
              <div class="bg-card/60 backdrop-blur-sm rounded-lg p-4 text-center border border-border/50">
                <div class="text-3xl font-bold text-green-500 mb-1">
                  {{ tagStats.totalViews.toLocaleString() }}
                </div>
                <div class="text-sm text-muted-foreground">总访问量</div>
              </div>
              <div class="bg-card/60 backdrop-blur-sm rounded-lg p-4 text-center border border-border/50">
                <div class="text-3xl font-bold text-purple-500 mb-1">
                  {{ tagStats.avgViews.toLocaleString() }}
                </div>
                <div class="text-sm text-muted-foreground">平均访问量</div>
              </div>
              <div class="bg-card/60 backdrop-blur-sm rounded-lg p-4 text-center border border-border/50">
                <div class="text-3xl font-bold text-red-500 mb-1">
                  {{ tagStats.hotTools }}
                </div>
                <div class="text-sm text-muted-foreground">热门工具</div>
              </div>
              <div class="bg-card/60 backdrop-blur-sm rounded-lg p-4 text-center border border-border/50">
                <div class="text-3xl font-bold text-yellow-500 mb-1">
                  {{ tagStats.newTools }}
                </div>
                <div class="text-sm text-muted-foreground">新工具</div>
              </div>
            </div>

            <!-- 分类标签 -->
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-foreground">工具分类:</span>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="category in tag.categories"
                  :key="category"
                  class="inline-flex items-center px-3 py-1 text-sm rounded-full border"
                  :style="{
                    backgroundColor: getCategoryColor(category).bg + '20',
                    color: getCategoryColor(category).text,
                    borderColor: getCategoryColor(category).bg + '40'
                  }"
                >
                  <span class="w-1.5 h-1.5 rounded-full mr-1.5"
                        :style="{ backgroundColor: getCategoryColor(category).text }"></span>
                  {{ getCategoryName(category) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 工具列表控制栏 -->
        <div class="bg-card/40 backdrop-blur-sm border-0 rounded-xl p-6">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 class="text-xl font-semibold text-foreground">
              相关工具 ({{ tagTools.length }})
            </h2>

            <div class="flex gap-3">
              <!-- 排序选择 -->
              <select
                v-model="sortBy"
                class="px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="popularity">按热度排序</option>
                <option value="views">按访问量排序</option>
                <option value="name">按名称排序</option>
                <option value="updated">按更新时间排序</option>
              </select>

              <!-- 视图切换 -->
              <div class="flex border border-border rounded-lg">
                <button
                  :class="[
                    'px-3 py-2',
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-muted'
                  ]"
                  @click="viewMode = 'grid'"
                >
                  <Grid class="w-5 h-5" />
                </button>
                <button
                  :class="[
                    'px-3 py-2 border-l border-border',
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-muted'
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
        <div v-if="viewMode === 'grid' && filteredAndSortedTools.length > 0"
             class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <NuxtLink
            v-for="tool in filteredAndSortedTools"
            :key="tool.id"
            :to="`/tools/${tool.id}/`"
            class="bg-card/40 backdrop-blur-sm border-0 rounded-xl p-5 hover:bg-card/70 hover:shadow-sm hover:shadow-primary/5 transition-all duration-200 cursor-pointer group"
          >
            <div class="flex justify-between items-start mb-3">
              <component
                :is="getIconComponent(tool.icon)"
                class="w-8 h-8 group-hover:scale-110 transition-transform"
                :style="{ color: getCategoryColor(tool.category).icon }"
              />
              <div class="flex flex-col items-end gap-1">
                <span
                  v-if="tool.hot || tool.new"
                  :class="[
                    'text-xs px-2 py-1 rounded-full',
                    tool.hot ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  ]"
                >
                  {{ tool.hot ? 'HOT' : 'NEW' }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ (tool.viewCount || 0).toLocaleString() }}
                </span>
              </div>
            </div>
            <h3 class="font-semibold mb-2 group-hover:text-primary transition-colors">{{ tool.name }}</h3>
            <p class="text-sm text-muted-foreground">{{ tool.description }}</p>
          </NuxtLink>
        </div>

        <!-- 工具列表视图 -->
        <div v-else-if="viewMode === 'list' && filteredAndSortedTools.length > 0"
             class="bg-card/40 backdrop-blur-sm border-0 rounded-xl">
          <div class="divide-y divide-border">
            <NuxtLink
              v-for="tool in filteredAndSortedTools"
              :key="tool.id"
              :to="`/tools/${tool.id}/`"
              class="p-6 hover:bg-card/70 transition-colors cursor-pointer block"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <component
                      :is="getIconComponent(tool.icon)"
                      class="w-6 h-6"
                      :style="{ color: getCategoryColor(tool.category).icon }"
                    />
                    <h3 class="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                      {{ tool.name }}
                    </h3>
                    <div class="flex gap-2">
                      <span v-if="tool.hot" class="inline-flex items-center px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        热门
                      </span>
                      <span v-if="tool.new" class="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        新品
                      </span>
                    </div>
                  </div>
                  <p class="text-muted-foreground mt-2">{{ tool.description }}</p>
                  <div class="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <Eye class="w-4 h-4" />
                      {{ (tool.viewCount || 0).toLocaleString() }} 次访问
                    </span>
                    <span class="flex items-center gap-1">
                      <Clock class="w-4 h-4" />
                      {{ tool.lastUpdated ? new Date(tool.lastUpdated).toLocaleDateString() : '未知更新时间' }}
                    </span>
                    <span class="px-2 py-1 rounded-md opacity-70"
                          :style="{
                            backgroundColor: getCategoryColor(tool.category).bg + '20',
                            color: getCategoryColor(tool.category).text
                          }">
                      {{ getCategoryName(tool.category) }}
                    </span>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!isLoading && filteredAndSortedTools.length === 0"
             class="text-center py-12 bg-card/40 backdrop-blur-sm border-0 rounded-xl">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
            <WrenchIcon class="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">暂无相关工具</h3>
          <p class="text-muted-foreground">该标签下暂时没有工具</p>
        </div>

        <!-- 相关标签 -->
        <div v-if="relatedTags.length > 0" class="bg-card/40 backdrop-blur-sm border-0 rounded-xl p-6">
          <h2 class="text-xl font-semibold text-foreground mb-4">相关标签</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <NuxtLink
              v-for="relatedTag in relatedTags"
              :key="relatedTag.name"
              :to="`/tag/${relatedTag.urlName}`"
              class="flex flex-col items-center p-4 bg-card/60 rounded-lg hover:bg-card/80 transition-all duration-200 group"
            >
              <component
                :is="getIconComponent(relatedTag.icon)"
                class="w-8 h-8 text-muted-foreground group-hover:text-primary mb-2 transition-colors"
              />
              <span class="text-sm font-medium text-foreground text-center group-hover:text-primary transition-colors">
                {{ relatedTag.displayName }}
              </span>
              <span class="text-xs text-muted-foreground mt-1">
                {{ relatedTag.toolCount }} 个工具
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  ArrowLeft, Tag, Wrench, Clock, Eye, TrendingUp, Grid, List,
  FileJson, FileText, Database, Link, Timer, Regex,
  Globe, Shield, Code, Calculator, Image as ImageIcon, Heart, DollarSign, Zap,
  Lock, Palette, Calendar, Quote, BarChart, Wifi, Cpu, Package,
  Braces, Terminal, Layers, Grid3X3, PieChart, Activity, Hash, List as ListIcon, Merge,
  SortAsc, Users, Building, Briefcase, PiggyBank, HelpCircle, RefreshCw,
  Send, GraduationCap, Home, Gamepad, Receipt, FileSpreadsheet, Edit, Utensils,
  CheckSquare, RotateCw, User, Gift, Circle, Percent, Shuffle, Presentation, TrendingDown,
  Key, File, FileCode, Wrench as WrenchIcon, Star, Plus, Gamepad2, SortDesc, Settings, Unlock
} from 'lucide-vue-next'
import { getCategoryColor as getCatColor } from '~/utils/categoryColors'

// 获取路由参数
const route = useRoute()
const router = useRouter()

// 直接导入数据
import { tools } from '~/data/tools'
import { getTagInfo, tagDefinitions } from '~/data/tags'

// 响应式数据
const tag = ref(null)
const tagTools = ref([])
const relatedTags = ref([])
const viewMode = ref('grid')
const sortBy = ref('popularity')
const isLoading = ref(true)

// 图标映射
const iconMap = {
  FileJson, FileText, Database, Link, Timer, Regex, Globe, Shield, Code,
  Calculator, ImageIcon, Heart, DollarSign, Zap, Lock, Palette, Calendar,
  Quote, BarChart, TrendingUp, Wifi, Cpu, Package, Braces, Terminal,
  Layers, Grid3X3, PieChart, Activity, Tag, Hash, ListIcon, Merge, SortAsc,
  Users, Building, Briefcase, PiggyBank, HelpCircle, Eye, RefreshCw,
  Send, GraduationCap, Home, Gamepad, Receipt, FileSpreadsheet, Edit,
  Utensils, CheckSquare, RotateCw, User, Gift, Circle, Percent, Shuffle,
  Presentation, TrendingDown, Key, File, FileCode, WrenchIcon, Star,
  Plus, Gamepad2, SortDesc, Settings, Unlock
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FileJson
}

// 计算属性
const tagParam = computed(() => route.params.tag)

const filteredAndSortedTools = computed(() => {
  if (!tagTools.value.length) return []

  let sortedTools = [...tagTools.value]

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

  const totalViews = tagTools.value.reduce((sum, tool) => sum + (tool.viewCount || 0), 0)
  const hotTools = tagTools.value.filter(tool => tool.hot).length
  const newTools = tagTools.value.filter(tool => tool.new).length

  return {
    totalTools: tagTools.value.length,
    totalViews,
    hotTools,
    newTools,
    avgViews: tagTools.value.length > 0 ? Math.round(totalViews / tagTools.value.length) : 0
  }
})

// 获取标签名称
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

// 获取分类颜色
const getCategoryColor = getCatColor

// 方法
const loadTagData = async () => {
  isLoading.value = true

  try {
    const tagName = decodeURIComponent(tagParam.value)

    // 查找标签
    let foundTag = tagDefinitions.find(t => t.name === tagName)

    if (!foundTag) {
      console.error(`Tag not found: ${tagName}`)
      router.push('/tags')
      return
    }

    // 获取标签下的所有工具
    const toolsWithTag = tools.filter(tool =>
      tool.tags && tool.tags.includes(tagName)
    )

    // 构建标签数据
    tag.value = {
      ...foundTag,
      toolCount: toolsWithTag.length,
      tools: toolsWithTag,
      categories: [...new Set(toolsWithTag.map(tool => tool.category))]
    }

    tagTools.value = toolsWithTag

    // 获取相关标签
    const allRelatedTags = new Set()
    toolsWithTag.forEach(tool => {
      if (tool.tags) {
        tool.tags.forEach(t => {
          if (t !== tagName) allRelatedTags.add(t)
        })
      }
    })

    relatedTags.value = Array.from(allRelatedTags)
      .map(relatedTagName => {
        const relatedTagInfo = getTagInfo(relatedTagName)
        const relatedToolsCount = tools.filter(tool =>
          tool.tags && tool.tags.includes(relatedTagName)
        ).length

        return {
          name: relatedTagName,
          displayName: relatedTagName,
          description: relatedTagInfo.description,
          icon: relatedTagInfo.icon,
          toolCount: relatedToolsCount,
          urlName: relatedTagName
        }
      })
      .filter(t => t.toolCount > 0)
      .sort((a, b) => b.toolCount - a.toolCount)
      .slice(0, 6)

    // 设置页面SEO信息
    const pageTitle = `${foundTag.name}标签工具合集 - ${foundTag.description} - 有条工具`
    const pageDescription = `查看${foundTag.name}标签下的${toolsWithTag.length}个工具，${foundTag.description}。包含${tag.value.categories.map(c => getCategoryName(c)).join('、')}等分类的实用工具。`

    useHead({
      title: pageTitle,
      meta: [
        { name: 'description', content: pageDescription },
        { name: 'keywords', content: `${foundTag.name},工具,${tag.value.categories.join(',')}` }
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
  router.push(`/tools/${tool.id}/`)
}

// 页面加载时加载数据
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


<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>