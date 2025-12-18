<script setup>
import { computed } from 'vue'
import { tools } from '~/data/tools'
import { useRouter } from 'vue-router'

const props = defineProps({
  category: {
    type: String,
    required: true
  },
  currentToolId: {
    type: String,
    required: true
  }
})

const router = useRouter()

// 相关工具推荐算法
const relatedTools = computed(() => {
  // 获取当前工具
  const currentTool = tools.find(t => t.id === props.currentToolId)
  if (!currentTool) return []

  // 过滤同分类的其他工具
  const sameCategoryTools = tools.filter(tool =>
    tool.category === props.category &&
    tool.id !== props.currentToolId
  )

  // 按优先级排序
  const prioritizedTools = sameCategoryTools
    .map(tool => ({
      ...tool,
      priority: calculateToolPriority(tool, currentTool)
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6) // 最多推荐6个工具

  return prioritizedTools
})

// 计算工具推荐优先级
const calculateToolPriority = (tool, currentTool) => {
  let priority = 0

  // 热门工具加分
  if (tool.hot) priority += 20
  // 新工具加分
  if (tool.new) priority += 10
  // 浏览量加分（对数缩放）
  priority += Math.log10(tool.viewCount || 1) * 5
  // 相似功能加分（基于关键词）
  const commonKeywords = currentTool.keywords?.filter(keyword =>
    tool.keywords?.includes(keyword)
  ).length || 0
  priority += commonKeywords * 15

  return priority
}

// 跳转到工具页面
const goToTool = (toolId) => {
  router.push(`/tools/${toolId}/`)
}
</script>

<template>
  <div class="mt-12 border-t pt-8">
    <h2 class="text-2xl font-bold mb-6">相关工具推荐</h2>

    <div v-if="relatedTools.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="tool in relatedTools"
        :key="tool.id"
        @click="goToTool(tool.id)"
        class="bg-card border border-border rounded-lg p-4 hover:bg-accent hover:border-primary transition-all cursor-pointer group"
      >
        <div class="flex items-start space-x-3">
          <!-- 工具图标 -->
          <div class="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <component :is="tool.icon" class="w-5 h-5 text-primary" />
          </div>

          <!-- 工具信息 -->
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {{ tool.name }}
            </h3>
            <p class="text-sm text-muted-foreground mt-1 line-clamp-2">
              {{ tool.description }}
            </p>

            <!-- 工具标签 -->
            <div class="flex items-center gap-2 mt-2">
              <span
                v-if="tool.hot"
                class="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
              >
                热门
              </span>
              <span
                v-if="tool.new"
                class="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
              >
                新品
              </span>
              <span
                v-if="tool.local"
                class="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                本地
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <div class="text-muted-foreground">
        <p>暂无相关工具推荐</p>
        <p class="text-sm mt-1">您可以浏览更多分类发现其他实用工具</p>
      </div>
    </div>

    <!-- 探索更多 -->
    <div class="text-center mt-8">
      <router-link
        to="/all/"
        class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        探索全部工具
        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </router-link>
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