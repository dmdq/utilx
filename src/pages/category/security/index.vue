<template>
  <div class="max-w-8xl mx-auto">
    <!-- 增强型头部 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">在线安全工具箱</h1>
      <p class="text-muted-foreground max-w-3xl">专业的数据脱敏、隐私保护、安全检测工具，帮助您保护数据安全，符合GDPR等隐私法规要求。</p>
    </div>

    <!-- 工具网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
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

    <!-- SEO知识库区域 -->
    <SeoKnowledgeBase category="security" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'
import SeoKnowledgeBase from '~/components/SeoKnowledgeBase.vue'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('在线安全工具箱')

const category = categories.find(c => c.id === 'security')

// 当前分类的工具
const categoryTools = computed(() => {
  return tools.filter(tool => tool.category === category.id)
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

const handleToolSelect = (tool) => {
  // 获取工具URL - 使用目录结构格式
  const toolUrl = `/tools/${tool.id}/`
  // 跳转到具体工具页面
  navigateTo(toolUrl)
  // 添加到最近使用
  addRecentTool(tool.id)
}
</script>