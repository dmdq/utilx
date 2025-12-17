<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->
    
    <!-- 增强型头部 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">在线文本处理工具箱</h1>
      <p class="text-muted-foreground max-w-3xl">正则表达式测试、文本对比、大小写转换、字符统计等文本处理工具，提高文本操作效率。</p>
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
    <SeoKnowledgeBase category="text" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'
import SeoKnowledgeBase from '~/components/SeoKnowledgeBase.vue'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

// 使用SEO composable设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('在线文本处理工具箱')


const category = categories.find(c => c.id === 'text')

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
  // 获取工具URL
  const toolUrl = `/tools/${tool.id}/`
  // 跳转到具体工具页面
  navigateTo(toolUrl)
  // 添加到最近使用
  addRecentTool(tool.id)
}
</script>