<template>
  <div class="max-w-4xl mx-auto py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">站点地图</h1>
      <p class="text-muted-foreground">Util.cn 完整的网站页面索引</p>
    </div>

    <!-- 主要导航 -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Home class="w-5 h-5 text-primary" />
        主要页面
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">首页</h3>
          <p class="text-sm text-muted-foreground">开发者效率工具箱首页</p>
        </a>
        <a
          href="/all/"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">全部工具</h3>
          <p class="text-sm text-muted-foreground">浏览所有可用工具</p>
        </a>
        <a
          href="/explore/"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">工具探索</h3>
          <p class="text-sm text-muted-foreground">发现和探索工具</p>
        </a>
        <a
          href="/ai/"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">AI工具导航</h3>
          <p class="text-sm text-muted-foreground">AI智能工具合集</p>
        </a>
      </div>
    </section>

    <!-- 分类页面 -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <LayoutGrid class="w-5 h-5 text-primary" />
        工具分类
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="category in sortedCategories"
          :key="category.id"
          :to="'/' + category.id + '/'"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <div class="flex items-center gap-3 mb-2">
            <component
              :is="getIconComponent(category.icon)"
              class="w-6 h-6 text-primary"
            />
            <h3 class="font-medium text-foreground">{{ category.name }}</h3>
          </div>
          <p class="text-sm text-muted-foreground">{{ category.description }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- 工具列表 -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Wrench class="w-5 h-5 text-primary" />
        工具列表 ({{ tools.length }} 个)
      </h2>
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索工具..."
          class="w-full md:w-96 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
        >
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="tool in filteredTools"
          :key="tool.id"
          :to="`/tools/${tool.id}/`"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-3">
              <component
                :is="getIconComponent(tool.icon)"
                class="w-6 h-6 text-primary flex-shrink-0"
              />
              <div>
                <h3 class="font-medium text-foreground mb-1">{{ tool.name }}</h3>
                <p class="text-sm text-muted-foreground">{{ tool.description }}</p>
              </div>
            </div>
            <div class="flex gap-1">
              <span
                v-if="tool.hot"
                class="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full"
              >
                HOT
              </span>
              <span
                v-if="tool.new"
                class="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full"
              >
                NEW
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span class="px-2 py-1 bg-muted rounded">{{ getCategoryName(tool.category) }}</span>
            <span>{{ formatViewCount(tool.viewCount) }}</span>
          </div>
        </NuxtLink>
      </div>

      <!-- 搜索结果为空 -->
      <div v-if="filteredTools.length === 0" class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Search class="w-8 h-8 text-muted-foreground" />
        </div>
        <p class="text-muted-foreground">未找到匹配的工具</p>
      </div>
    </section>

    <!-- 其他页面 -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText class="w-5 h-5 text-primary" />
        其他页面
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink
          to="/about/"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">关于我们</h3>
          <p class="text-sm text-muted-foreground">了解 Util.cn 和我们的使命</p>
        </NuxtLink>
        <NuxtLink
          to="/faq/"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">常见问题</h3>
          <p class="text-sm text-muted-foreground">快速解答常见疑问</p>
        </NuxtLink>
        <NuxtLink
          to="/feedback/"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">用户反馈</h3>
          <p class="text-sm text-muted-foreground">提交意见和建议</p>
        </NuxtLink>
        <NuxtLink
          to="/download/"
          class="block p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">桌面版下载</h3>
          <p class="text-sm text-muted-foreground">下载离线桌面应用</p>
        </NuxtLink>
      </div>
    </section>

    <!-- SEO 信息 -->
    <section class="mt-16 p-6 bg-muted/30 rounded-lg">
      <h2 class="text-lg font-semibold mb-4">SEO 信息</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium text-foreground mb-2">统计信息</h3>
          <ul class="space-y-1 text-muted-foreground">
            <li>工具总数: {{ tools.length }} 个</li>
            <li>分类数量: {{ categories.length }} 个</li>
            <li>总页面数: {{ tools.length + categories.length + 8 }} 个</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium text-foreground mb-2">XML 站点地图</h3>
          <p class="text-muted-foreground mb-2">
            搜索引擎可以通过以下地址访问我们的 XML 站点地图：
          </p>
          <a
            href="/sitemap.xml"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Globe class="w-4 h-4" />
            /sitemap.xml
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Home, LayoutGrid, Wrench, Search, FileText, Globe,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  FolderOpen, GitBranch, Type, Wifi, Image, Code,
  Shield, Layout, Clock, Lock
} from 'lucide-vue-next'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { useSEO } from '~/composables/useSEO'

// 设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('站点地图')

definePageMeta({
  layout: 'default'
})

// 搜索功能
const searchQuery = ref('')

// 图标映射
const iconMap = {
  FileText: FileText,
  Lock: Shield,
  Clock: Clock,
  Type: Type,
  Wifi: Wifi,
  Image: Image,
  Code: Code,
  FileJson: FileJson,
  Database: Database,
  Link: Link,
  Hash: Hash,
  Timer: Timer,
  Regex: Regex,
  FileDiff: FileDiff,
  Globe: Globe,
  FolderOpen: FolderOpen,
  GitBranch: GitBranch,
  Layout: Layout
}

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FileText
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.find(c => c.id === categoryId)
  return category ? category.name : categoryId
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

// 过滤工具
const filteredTools = computed(() => {
  if (!searchQuery.value.trim()) {
    return tools
  }

  const query = searchQuery.value.toLowerCase()
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(query) ||
    tool.description.toLowerCase().includes(query) ||
    tool.keywords?.some(keyword => keyword.toLowerCase().includes(query))
  )
})

// 排序的分类
const sortedCategories = computed(() => {
  return categories.sort((a, b) => a.sort - b.sort)
})
</script>

<style scoped>
/* 站点地图样式 */
.grid {
  display: grid;
}

/* 链接悬停效果 */
a {
  text-decoration: none;
  color: inherit;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>