<script setup>
import { computed } from 'vue'
import { 
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  tools: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['tool-select'])

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

const iconComponent = computed(() => {
  return iconMap[props.category.icon] || FileText
})

// 当前分类的工具
const categoryTools = computed(() => {
  return props.tools.filter(tool => tool.category === props.category.id)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
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

// 处理工具选择
const handleToolSelect = (tool) => {
  emit('tool-select', tool)
  // 添加到最近使用
  addRecentTool(tool.id)
}
</script>

<template>
  <div>
    <!-- 面包屑导航 -->
    <Breadcrumb :category="category" />
    
    <!-- 工具网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <ToolCard
        v-for="tool in categoryTools"
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
      v-if="categoryTools.length === 0"
      class="text-center py-12"
    >
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <FolderOpen class="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-medium text-foreground">暂无工具</h3>
      <p class="text-muted-foreground mt-2">该分类下还没有添加工具</p>
    </div>
  </div>
</template>
