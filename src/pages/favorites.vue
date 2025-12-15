<template>
  <div class="max-w-8xl mx-auto py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Heart class="w-8 h-8 text-red-500 fill-current" />
          我的收藏
        </h1>
        <p class="text-muted-foreground">您收藏的实用工具 · 拖拽卡片可调整顺序</p>
      </div>
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <GripVertical class="w-4 h-4" />
        <span>拖拽排序</span>
      </div>
    </div>

    <!-- 收藏的工具 -->
    <section>
      <div v-if="favoriteTools.length > 0">
        <div
          ref="sortableContainer"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <div
            v-for="tool in favoriteTools"
            :key="tool.id"
            :data-id="tool.id"
            class="sortable-item"
          >
            <ToolCard
              :tool="tool"
              :title="tool.name"
              :description="tool.description"
              :category="tool.category"
              :usage-count="formatViewCount(tool.viewCount)"
              :icon="tool.icon"
              :is-draggable="true"
              @select="handleToolSelect"
            />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="text-center py-12"
      >
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Heart class="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-medium text-foreground">暂无收藏</h3>
        <p class="text-muted-foreground mt-2">您还没有收藏任何工具，快去探索吧！</p>
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Heart, Compass, GripVertical,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, Type, Wifi, Image, Code,
  Shield, Layout, Clock, Lock
} from 'lucide-vue-next'
import { useSortable } from '@vueuse/integrations/useSortable'
import Sortable from 'sortablejs'
import { tools } from '~/data/tools'
import { getFavoriteTools, initToolsData, addRecentTool } from '~/composables/useTools'
import { useSEO } from '~/composables/useSEO'
import ToolCard from '~/components/ToolCard.vue'

definePageMeta({
  layout: 'default'
})

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('我的收藏')

// 初始化工具数据
initToolsData()

const router = useRouter()
const sortableContainer = ref(null)

// 图标映射
const iconMap = {
  FileText: FileJson, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, Layout, Heart, Compass
}

// 获取收藏工具排序
const getFavoriteOrder = () => {
  if (process.client) {
    try {
      const savedOrder = localStorage.getItem('favorite-tools-order')
      return savedOrder ? JSON.parse(savedOrder) : []
    } catch (error) {
      console.warn('Failed to load favorite tools order:', error)
      return []
    }
  }
  return []
}

// 保存收藏工具排序
const saveFavoriteOrder = (order) => {
  if (process.client) {
    try {
      localStorage.setItem('favorite-tools-order', JSON.stringify(order))
    } catch (error) {
      console.warn('Failed to save favorite tools order:', error)
    }
  }
}

// 使用响应式存储收藏工具
const favoriteTools = ref([])

// 更新收藏工具列表
const updateFavoriteTools = () => {
  const favoriteIds = getFavoriteTools()
  const savedOrder = getFavoriteOrder()

  // 获取收藏的工具
  const favoriteToolsList = favoriteIds
    .map(id => tools.find(tool => tool.id === id))
    .filter(Boolean)

  // 按保存的顺序排序
  if (savedOrder.length > 0) {
    favoriteTools.value = favoriteToolsList.sort((a, b) => {
      const aIndex = savedOrder.indexOf(a.id)
      const bIndex = savedOrder.indexOf(b.id)

      // 如果都在保存的顺序中，按保存的顺序排
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }

      // 如果只有一个在保存的顺序中，在保存顺序中的排在前面
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1

      // 如果都不在保存的顺序中，按原始顺序排
      return favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id)
    })
  } else {
    favoriteTools.value = favoriteToolsList
  }
}

// 初始化收藏工具列表
updateFavoriteTools()

// 监听 storage 变化（其他标签页的变化）
const handleStorageChange = (e) => {
  if (e.key === 'favorite-tools' || e.key === 'favorite-tools-order') {
    updateFavoriteTools()
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

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FileText
}

// 初始化拖拽排序
onMounted(async () => {
  await nextTick()

  // 初始化收藏工具列表
  updateFavoriteTools()

  // 监听 storage 事件
  window.addEventListener('storage', handleStorageChange)

  if (sortableContainer.value) {
    useSortable(sortableContainer, favoriteTools, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: '.sortable-item',
      onUpdate: (event) => {
        // 获取新的排序
        const items = event.target.querySelectorAll('.sortable-item')
        const newOrder = Array.from(items).map(item => item.dataset.id)

        // 保存新的排序
        saveFavoriteOrder(newOrder)

        // 更新响应式数据
        updateFavoriteTools()

        console.log('Favorite tools order updated:', newOrder)
      }
    })
  }
})

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style>
.sortable-ghost {
  opacity: 0.5;
  transform: scale(0.95);
}

.sortable-chosen {
  cursor: grabbing !important;
}

.sortable-chosen .tool-card {
  transform: scale(1.02);
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2);
  z-index: 1000;
}

.sortable-drag {
  opacity: 0.8;
  transform: rotate(5deg);
}

.sortable-item {
  cursor: grab;
}

.sortable-item:active {
  cursor: grabbing;
}

.tool-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sortable-item:hover .tool-card {
  transform: translateY(-2px);
}
</style>