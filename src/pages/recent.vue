<template>
  <div class="max-w-8xl mx-auto py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
        <Clock class="w-8 h-8 text-primary" />
        最近使用
      </h1>
      <p class="text-muted-foreground">您最近使用过的工具</p>
    </div>

    <!-- 最近使用的工具 -->
    <section>
      <div v-if="recentTools.length > 0">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <History class="w-5 h-5 text-primary" />
            使用历史
          </h2>
          <button 
            class="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
            @click="clearRecentToolsHandler"
          >
            <Trash2 class="w-4 h-4" />
            清空记录
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ToolCard
            v-for="tool in recentTools"
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
      </div>

      <!-- 空状态 -->
      <div 
        v-else
        class="text-center py-12"
      >
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Clock class="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-medium text-foreground">暂无记录</h3>
        <p class="text-muted-foreground mt-2">您还没有使用过任何工具，快去探索吧！</p>
        <NuxtLink 
          to="/explore" 
          class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Compass class="w-4 h-4" />
          去探索
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Clock, History, Trash2, Compass,Lock,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, Type, Wifi, Image, Code,
  Shield, Layout
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { getRecentTools, initToolsData, addRecentTool, clearRecentTools } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('最近使用')


// 初始化工具数据
initToolsData()

const router = useRouter()

// 图标映射
const iconMap = {
  FileText: FileJson, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, Layout, History, Trash2, Compass
}

// 最近使用的工具
const recentTools = ref([])

// 更新最近使用的工具列表
const updateRecentTools = () => {
  const recentIds = getRecentTools()
  recentTools.value = recentIds
    .map(id => tools.find(tool => tool.id === id))
    .filter(Boolean)
}

// 监听存储变化
const handleStorageChange = (e) => {
  if (e.key === 'recent-tools') {
    updateRecentTools()
  }
}

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

// 处理工具选择
const handleToolSelect = (tool) => {
  // 获取工具URL
  const toolUrl = `/tools/${tool.id}/`
  // 跳转到具体工具页面
  router.push(toolUrl)
  // 添加到最近使用
  addRecentTool(tool.id)
}

// 清空最近使用的工具
const clearRecentToolsHandler = () => {
  clearRecentTools()
  updateRecentTools()
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FileText
}

// 组件挂载时初始化数据
onMounted(() => {
  updateRecentTools()
  window.addEventListener('storage', handleStorageChange)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>