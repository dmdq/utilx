<script setup>
import { ref, computed } from 'vue'
import {
  FileJson, FileText, Database, Link, Timer, Regex,
  Globe, Shield, Code, Calculator, Image as ImageIcon, Heart, DollarSign, Zap,
  Lock, Palette, Calendar, Quote, BarChart, TrendingUp, Wifi, Cpu, Package,
  Braces, Terminal, Layers, Grid3X3, PieChart, Activity, Tag, Hash, List, Merge,
  SortAsc, Users, Building, Briefcase, PiggyBank, HelpCircle, Eye, RefreshCw,
  Send, GraduationCap, Home, Gamepad, Receipt, FileSpreadsheet, Edit, Utensils,
  CheckSquare, RotateCw, User, Gift, Circle, Percent, Shuffle, Presentation, TrendingDown,
  Key, File, FileCode, Wrench, Star, Plus, Gamepad2, SortDesc, Settings, Unlock
} from 'lucide-vue-next'
import { getCategoryColor as getCatColor } from '~/utils/categoryColors'

// 设置页面元数据
useHead({
  title: '标签导航 - 有条工具',
  meta: [
    { name: 'description', content: '通过标签快速找到合适的工具，按应用场景和功能特性分类，提升工作效率。' },
    { name: 'keywords', content: '标签,工具分类,场景导航,效率提升' }
  ]
})

// 获取标签管理器实例
const { $tagManager } = useNuxtApp()

// 直接导入数据
import { tools } from '~/data/tools'
import { getTagInfo } from '~/data/tags'

// 直接提取并处理标签数据
const tagMap = new Map()

// 遍历所有工具，提取标签
tools.forEach(tool => {
  if (tool.tags && Array.isArray(tool.tags)) {
    tool.tags.forEach(tag => {
      if (!tag || typeof tag !== 'string') return

      const cleanTag = tag.trim()
      if (cleanTag.length === 0) return

      if (!tagMap.has(cleanTag)) {
        const tagInfo = getTagInfo(cleanTag)
        tagMap.set(cleanTag, {
          id: cleanTag,
          name: cleanTag,
          displayName: cleanTag,
          tools: [],
          toolCount: 0,
          description: tagInfo.description,
          icon: tagInfo.icon,
          categories: new Set(),
          sort: tagInfo.sort || 999,
          hot: false,
          popularity: 0
        })
      }

      const tagEntry = tagMap.get(cleanTag)
      tagEntry.tools.push(tool)
      tagEntry.toolCount++
      tagEntry.categories.add(tool.category)
    })
  }
})

// 转换为数组并处理
const allTags = Array.from(tagMap.values())
  .map(tag => ({
    ...tag,
    categories: Array.from(tag.categories),
    hot: tag.toolCount >= 5,
    popularity: tag.toolCount * 10
  }))
  .sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort
    return b.popularity - a.popularity
  })

// 响应式数据
const isLoading = ref(false)

// 按序号排序的标签
const tagsByPopularity = computed(() => allTags)

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

// 图标映射
const iconMap = {
  FileJson, FileText, Database, Link, Timer, Regex, Globe, Shield, Code,
  Calculator, ImageIcon, Heart, DollarSign, Zap, Lock, Palette, Calendar,
  Quote, BarChart, TrendingUp, Wifi, Cpu, Package, Braces, Terminal,
  Layers, Grid3X3, PieChart, Activity, Tag, Hash, List, Merge, SortAsc,
  Users, Building, Briefcase, PiggyBank, HelpCircle, Eye, RefreshCw,
  Send, GraduationCap, Home, Gamepad, Receipt, FileSpreadsheet, Edit,
  Utensils, CheckSquare, RotateCw, User, Gift, Circle, Percent, Shuffle,
  Presentation, TrendingDown, Key, File, FileCode, Wrench, Star,
  Plus, Gamepad2, SortDesc, Settings, Unlock
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FileJson
}


</script>

<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">标签导航</h1>
      <p class="text-muted-foreground">通过标签快速找到合适的工具</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 backdrop-blur-sm border border-primary/20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      <p class="text-muted-foreground">加载标签数据中...</p>
    </div>

    <!-- 标签卡片列表 -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <NuxtLink
          v-for="tag in tagsByPopularity"
          :key="tag.name"
          :to="`/tag/${tag.name}/`"
          class="bg-card/40 backdrop-blur-sm border-0 rounded-xl p-5 hover:bg-card/70 hover:shadow-sm hover:shadow-primary/5 transition-all duration-200 cursor-pointer group"
        >
          <div class="flex justify-between items-start mb-3">
            <component
              :is="getIconComponent(tag.icon)"
              class="w-8 h-8 group-hover:scale-110 transition-transform"
              :style="{ color: tag.color || '#6B7280' }"
            />
            <div class="flex flex-col items-end gap-1">
              <span v-if="tag.hot" class="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                HOT
              </span>
              <span class="text-xs text-muted-foreground">
                {{ tag.toolCount }} 个工具
              </span>
            </div>
          </div>
          <h3 class="font-semibold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
            {{ tag.displayName }}
          </h3>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ tag.description }}</p>

          <!-- 分类标签 -->
          <div v-if="tag.categories && tag.categories.length > 0" class="mt-3 flex flex-wrap gap-1">
            <span
              v-for="category in tag.categories.slice(0, 3)"
              :key="category"
              class="text-xs px-2 py-1 rounded-md opacity-70"
              :style="{
                backgroundColor: getCategoryColor(category).bg + '20',
                color: getCategoryColor(category).text
              }"
            >
              {{ getCategoryName(category) }}
            </span>
            <span
              v-if="tag.categories.length > 3"
              class="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
            >
              +{{ tag.categories.length - 3 }}
            </span>
          </div>
        </NuxtLink>
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