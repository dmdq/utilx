<template>
  <div class="max-w-4xl mx-auto py-8">
    <div class="mb-8">
      <h1 class="text-display text-foreground mb-2">站点地图</h1>
      <p class="text-muted-foreground">Util.cn 的页面索引。全部 {{ tools.length }} 款工具请在「全部工具」按分类筛选浏览。</p>
    </div>

    <!-- 主要页面 -->
    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Home class="w-5 h-5 text-primary" />
        主要页面
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NuxtLink
          v-for="page in mainPages"
          :key="page.to"
          :to="page.to"
          class="block p-4 bg-transparent border-0 border-b border-border/40 rounded-none transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">{{ page.name }}</h3>
          <p class="text-sm text-muted-foreground">{{ page.description }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- 工具分类 -->
    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <LayoutGrid class="w-4 h-4 text-muted-foreground" />
        工具分类
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <NuxtLink
          v-for="category in sortedCategories"
          :key="category.id"
          :to="`/${category.id}/`"
          class="flex items-center justify-between gap-2 p-4 bg-transparent border-0 border-b border-border/40 rounded-none transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <component :is="resolveToolIcon(category.icon, category.id)" class="w-5 h-5 text-primary flex-shrink-0" />
            <h3 class="font-medium text-foreground truncate">{{ category.name }}</h3>
          </div>
          <span class="text-xs text-muted-foreground whitespace-nowrap">{{ category.count }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 全部工具：只做入口，不再重复罗列 748 条 -->
    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Wrench class="w-5 h-5 text-primary" />
        全部工具
      </h2>
      <NuxtLink
        to="/all/"
        class="group flex items-center justify-between gap-4 p-5 bg-transparent border-0 border-b border-border/40 rounded-none transition-colors"
      >
        <div>
          <h3 class="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">浏览全部 {{ tools.length }} 款工具</h3>
          <p class="text-sm text-muted-foreground">支持分类筛选、关键词搜索与分页；工具详情由各分类页与工具页互链。</p>
        </div>
        <ArrowRight class="w-5 h-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
      </NuxtLink>
    </section>

    <!-- 其他页面 -->
    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText class="w-5 h-5 text-primary" />
        其他页面
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NuxtLink
          v-for="page in otherPages"
          :key="page.to"
          :to="page.to"
          class="block p-4 bg-transparent border-0 border-b border-border/40 rounded-none transition-colors"
        >
          <h3 class="font-medium text-foreground mb-1">{{ page.name }}</h3>
          <p class="text-sm text-muted-foreground">{{ page.description }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- 站点信息 -->
    <section class="p-6 bg-muted/30 rounded-none">
      <h2 class="text-lg font-semibold mb-4">站点信息</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium text-foreground mb-2">统计</h3>
          <ul class="space-y-1 text-muted-foreground">
            <li>工具总数：{{ tools.length }} 个</li>
            <li>分类数量：{{ categories.length }} 个</li>
            <li>场景专题：{{ collections.length }} 个</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium text-foreground mb-2">XML 站点地图</h3>
          <p class="text-muted-foreground mb-2">搜索引擎可通过以下地址访问完整的 XML 站点地图：</p>
          <a
            href="/sitemap.xml"
            target="_blank"
            class="inline-flex items-center gap-2 px-4 py-2 bg-transparent border-0 border-b border-border/60 rounded-none hover:bg-muted transition-colors"
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
import { computed } from 'vue'
import { Home, LayoutGrid, Wrench, FileText, Globe, ArrowRight } from 'lucide-vue-next'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { collections } from '~/data/collections'
import { useSEO } from '~/composables/useSEO'
import { resolveToolIcon } from '~/utils/toolIcons'

const { setPageTitle } = useSEO()
setPageTitle('站点地图')

const mainPages = [
  { to: '/', name: '首页', description: '搜索入口、精选工具与分类快捷方式' },
  { to: '/all/', name: '全部工具', description: '按分类筛选与分页浏览所有工具' },
  { to: '/explore/', name: '工具探索', description: '分类导航、精选工具与最近使用' },
  { to: '/ai/', name: 'AI 工具导航', description: 'AI 相关工具合集' },
  { to: '/tags/', name: '标签导航', description: '按功能标签检索工具' },
  { to: '/wiki/', name: '技术词条库', description: '概念解释与配套工具' },
  { to: '/collections/', name: '场景专题', description: '按任务编排的工具合集' }
]

const otherPages = [
  { to: '/about/', name: '关于我们', description: '了解 Util.cn 和我们的使命' },
  { to: '/faq/', name: '常见问题', description: '快速解答常见疑问' },
  { to: '/feedback/', name: '用户反馈', description: '提交意见和建议' },
  { to: '/download/', name: '桌面版下载', description: '下载离线桌面应用' }
]

// 用副本排序，避免原地修改导入的 categories（原实现有此副作用）
const sortedCategories = computed(() =>
  [...categories]
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map(category => ({
      ...category,
      count: tools.filter(tool => tool.category === category.id).length
    }))
)
</script>
