<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero：唯一入口 -->
    <section class="relative text-center mb-12 mt-4 rounded-2xl border border-border/60 bg-card/30">
      <div class="px-6 py-10 lg:px-8 lg:py-14">
        <h1 class="text-display lg:text-display-lg mb-4 text-foreground">
          不仅是工具，更是<span class="text-primary">创造力</span>的延伸
        </h1>
        <p class="text-lg text-muted-foreground mb-8">极简、高效、全能。为极客、设计师和所有探索者打造。</p>

        <div class="relative max-w-2xl mx-auto">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search class="w-5 h-5 text-muted-foreground" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              class="block w-full rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm pl-11 pr-24 py-4 text-base placeholder:text-muted-foreground/60 transition-all duration-200 focus:border-primary/50 focus:outline-none"
              placeholder="搜索你需要的工具，如 Markdown、JSON、MD5、正则、图片…"
              @keydown.enter="handleSearchEnter"
            >
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              <button
                class="text-xs text-muted-foreground/60 bg-background/80 border border-border/40 px-2 py-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                title="检测剪贴板内容"
                @click="detectClipboardContent"
              >
                <Clipboard class="w-3 h-3" />
              </button>
              <span class="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground/60 font-mono bg-background/80 border border-border/40 px-2 py-1.5 rounded-lg">
                <kbd class="text-[11px] font-semibold bg-muted/50 px-1.5 py-0.5 rounded border border-border/30">⌘</kbd>
                <kbd class="text-[11px] font-semibold bg-muted/50 px-1.5 py-0.5 rounded border border-border/30">K</kbd>
              </span>
            </div>
          </div>

          <!-- 即时搜索结果 -->
          <div
            v-if="searchResults.length > 0"
            class="absolute z-20 left-0 right-0 top-full mt-2 rounded-xl border border-border bg-card text-left shadow-elevation-3 overflow-hidden"
          >
            <NuxtLink
              v-for="tool in searchResults"
              :key="tool.id"
              :to="`/tools/${tool.id}/`"
              class="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors"
              @click="addRecentTool(tool.id)"
            >
              <component
                :is="resolveToolIcon(tool.icon, tool.category)"
                class="w-4 h-4 flex-shrink-0"
                :style="{ color: getCategoryColor(tool.category).icon }"
              />
              <span class="text-sm font-medium truncate">{{ tool.name }}</span>
              <span class="text-xs text-muted-foreground truncate ml-auto hidden sm:block">{{ tool.description }}</span>
            </NuxtLink>
            <button
              class="w-full text-left text-xs text-primary px-4 py-2.5 border-t border-border hover:bg-muted/60 transition-colors"
              @click="handleSearchEnter"
            >
              查看全部结果 →
            </button>
          </div>
        </div>

        <!-- 智能粘贴提示 -->
        <div
          v-if="clipboardSuggestion"
          class="max-w-2xl mx-auto mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between text-left"
        >
          <div class="text-sm">
            <span class="text-primary">检测到剪贴板包含 {{ clipboardSuggestion.type }} 数据，</span>
            <button class="text-primary font-medium underline ml-1" @click="goToTool(clipboardSuggestion.toolId)">
              是否打开 {{ clipboardSuggestion.toolName }}？
            </button>
          </div>
          <button class="text-muted-foreground hover:text-foreground" @click="dismissClipboardSuggestion">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- 最近使用：轻量文字链，不渲染卡片 -->
        <div v-if="recentTools.length > 0" class="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Clock class="w-3.5 h-3.5" />
          <span>最近使用：</span>
          <NuxtLink
            v-for="tool in recentTools"
            :key="tool.id"
            :to="`/tools/${tool.id}/`"
            class="hover:text-primary transition-colors"
            @click="addRecentTool(tool.id)"
          >{{ tool.name }}</NuxtLink>
          <NuxtLink to="/recent/" class="text-primary hover:underline">全部 →</NuxtLink>
        </div>
      </div>
    </section>

    <!-- 精选工具 -->
    <section class="mb-14">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-h1 flex items-center gap-2">
          <LayoutGrid class="w-5 h-5 text-primary" />
          精选工具
        </h2>
        <NuxtLink to="/all/" class="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          查看全部 {{ tools.length }} 款 <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="tool in featuredTools"
          :key="tool.id"
          :to="`/tools/${tool.id}/`"
          class="group block"
          @click="addRecentTool(tool.id)"
        >
          <div class="h-full bg-card/40 border border-border/50 rounded-xl p-5 hover:bg-card/70 hover:border-foreground/10 hover:shadow-elevation-2 hover:-translate-y-0.5 transition-all duration-200">
            <div class="flex items-center gap-3 mb-3">
              <component
                :is="resolveToolIcon(tool.icon, tool.category)"
                class="w-6 h-6 group-hover:scale-110 transition-transform"
                :style="{ color: getCategoryColor(tool.category).icon }"
              />
              <span
                v-if="getToolBadge(tool)"
                :class="['text-[10px] px-1.5 py-0.5 rounded-full', getToolBadge(tool).class]"
              >{{ getToolBadge(tool).label }}</span>
            </div>
            <h3 class="font-semibold mb-1.5 group-hover:text-primary transition-colors">{{ tool.name }}</h3>
            <p class="text-sm text-muted-foreground line-clamp-2">{{ tool.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- 分类快捷入口 -->
    <section class="mb-14">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-h1">按分类浏览</h2>
        <NuxtLink to="/explore/" class="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          工具探索 <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="category in categoriesWithCount"
          :key="category.id"
          :to="`/${category.id}/`"
          class="inline-flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg border border-border/60 bg-card/30 hover:bg-card/70 hover:border-foreground/10 hover:shadow-elevation-1 transition-all"
        >
          <component
            :is="resolveToolIcon(category.icon, category.id)"
            class="w-4 h-4"
            :style="{ color: getCategoryColor(category.id).icon }"
          />
          {{ category.name }}
          <span class="text-xs text-muted-foreground">{{ category.count }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 场景专题 -->
    <section class="mb-14">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-h1 flex items-center gap-2">
          <FolderHeart class="w-5 h-5 text-primary" />
          场景专题
        </h2>
        <NuxtLink to="/collections/" class="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
          全部专题 <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink
          v-for="col in featuredCollections"
          :key="col.slug"
          :to="`/collections/${col.slug}/`"
          class="group block"
        >
          <div class="h-full bg-card/40 border border-border/50 rounded-xl p-5 hover:bg-card/70 hover:border-foreground/10 hover:shadow-elevation-1 transition-all">
            <div class="flex items-center justify-between gap-2 mb-2">
              <h3 class="font-semibold group-hover:text-primary transition-colors">{{ col.title }}</h3>
              <span class="text-xs text-muted-foreground whitespace-nowrap">{{ col.tools.length }} 个工具</span>
            </div>
            <p class="text-sm text-muted-foreground line-clamp-2">{{ col.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- 信任背书：单行 -->
    <footer class="border-t border-border/60 pt-6 pb-2 text-center text-sm text-muted-foreground">
      纯本地计算，数据不上传 · 开源免费 · 无广告 · 共 {{ tools.length }} 款工具
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Clipboard, X, Clock, LayoutGrid, ArrowRight, FolderHeart } from 'lucide-vue-next'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { collections } from '~/data/collections'
import { initToolsData, getRecentTools, addRecentTool } from '~/composables/useTools'
import { resolveToolIcon } from '~/utils/toolIcons'
import { getCategoryColor } from '~/utils/categoryColors'
import { getToolBadge } from '~/utils/toolBadges'

initToolsData()

const router = useRouter()
const searchQuery = ref('')
const clipboardSuggestion = ref(null)

const description = `为开发者打造的免费工具箱。JSON格式化、Base64编解码、正则表达式测试、MD5加密、时间戳转换、JWT解码等 ${tools.length} 款工具。纯本地计算，数据不上传，安全高效。`

useHead({
  title: '开发者工具箱 - JSON格式化 Base64 正则 MD5 JWT - 有条工具',
  meta: [
    { name: 'description', content: description },
    { property: 'og:title', content: '开发者工具箱 - JSON格式化 Base64 正则 MD5 JWT - 有条工具' },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.util.cn/' },
    { property: 'og:image', content: 'https://www.util.cn/logo.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: '开发者工具箱 - JSON格式化 Base64 正则 MD5 JWT - 有条工具' },
    { name: 'twitter:description', content: description }
  ]
})

const searchResults = computed(() => {
  const q = String(searchQuery.value || '').trim().toLowerCase()
  if (!q) return []
  return tools.filter(tool =>
    String(tool.name || '').toLowerCase().includes(q) ||
    String(tool.description || '').toLowerCase().includes(q) ||
    (tool.keywords || []).some(k => String(k || '').toLowerCase().includes(q)) ||
    (tool.tags || []).some(k => String(k || '').toLowerCase().includes(q))
  ).slice(0, 6)
})

const featuredTools = computed(() => tools.filter(tool => tool.hot).slice(0, 8))

const categoriesWithCount = computed(() => categories
  .map(category => ({
    ...category,
    count: tools.filter(tool => tool.category === category.id).length
  }))
  .sort((a, b) => (a.sort || 0) - (b.sort || 0))
)

const featuredCollections = computed(() => collections.slice(0, 4))

const recentTools = computed(() => getRecentTools()
  .map(id => tools.find(tool => tool.id === id))
  .filter(Boolean)
  .slice(0, 5)
)

const handleSearchEnter = () => {
  const q = String(searchQuery.value || '').trim()
  if (q) router.push(`/all/?search=${encodeURIComponent(q)}`)
}

const goToTool = (toolId) => {
  const tool = tools.find(t => t.id === toolId)
  if (!tool) return
  router.push(`/tools/${tool.id}/`)
  addRecentTool(tool.id)
}

const dismissClipboardSuggestion = () => {
  clipboardSuggestion.value = null
}

// 仅在用户主动点击时读取剪贴板：不再全局监听 paste，避免干扰搜索框输入
const detectClipboardContent = async () => {
  if (typeof window === 'undefined' || !navigator.clipboard || !window.isSecureContext) return
  try {
    const text = (await navigator.clipboard.readText()).trim()
    if (!text) return

    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      try {
        JSON.parse(text)
        clipboardSuggestion.value = { type: 'JSON', toolId: 'json-formatter', toolName: 'JSON格式化' }
        return
      } catch (e) { /* 非合法 JSON，继续检测其它类型 */ }
    }

    if (text.startsWith('eyJ') && text.split('.').length === 3) {
      clipboardSuggestion.value = { type: 'JWT', toolId: 'jwt-decoder', toolName: 'JWT解码' }
      return
    }

    if (/^\d{10,13}$/.test(text)) {
      clipboardSuggestion.value = { type: '时间戳', toolId: 'unix-timestamp', toolName: 'Unix时间戳转换' }
      return
    }

    // Base64：要求长度 ≥16、4 的倍数、字母与数字/符号混合，且能真正解码
    if (text.length >= 16 && text.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(text)) {
      if (/[A-Za-z]/.test(text) && /[0-9+/=]/.test(text)) {
        try {
          if (atob(text).length > 0) {
            clipboardSuggestion.value = { type: 'Base64', toolId: 'base64-encoder', toolName: 'Base64编码/解码' }
          }
        } catch (e) { /* 无法解码，不是 Base64 */ }
      }
    }
  } catch (error) {
    // 用户拒绝剪贴板权限，静默处理
  }
}
</script>
