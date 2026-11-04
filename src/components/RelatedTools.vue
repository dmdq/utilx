<script setup>
import { getToolBadge } from '~/utils/toolBadges'
import { computed } from 'vue'
import { tools } from '~/data/tools'
import { personas } from '~/data/personas'
import { resolveToolIcon } from '~/utils/toolIcons'
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

// 引用了当前工具的职业画像（personas.js 底账反向查询）
const professionsUsing = computed(() =>
  personas.filter(p => p.tasks.some(t => (t.tools || []).includes(props.currentToolId)))
)

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
  // 相似功能加分（基于关键词）
  // 注：不再使用 new / viewCount 加权 —— new 覆盖 97.5% 无区分度，viewCount 为静态填充值
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
        class="bg-transparent border-0 border-b border-border/40 rounded-none p-4 hover:bg-muted/25 transition-colors cursor-pointer group"
      >
        <div class="flex items-start space-x-3">
          <!-- 工具图标 -->
          <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
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
                v-if="getToolBadge(tool)"
                class="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
              >
                热门
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

    <!-- 职业场景：哪些职业的工具卡引用了当前工具（personas.js 数据驱动，全站工具页自动生效） -->
    <div v-if="professionsUsing.length > 0" class="mt-8 border-t border-border/40 pt-6">
      <h3 class="text-sm font-semibold text-foreground mb-3">这张卡挂在哪些职业工具箱</h3>
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <NuxtLink
          v-for="p in professionsUsing"
          :key="p.id"
          :to="`/professions/${p.id}/`"
          class="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
        >
          <component :is="resolveToolIcon(p.icon, 'dev')" class="w-3.5 h-3.5" />
          {{ p.name }}
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