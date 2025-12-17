<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm"
    @click="closeOnBackdrop"
  >
    <!-- 搜索框容器 -->
    <div
      class="w-full max-w-2xl mx-4"
      @click.stop
    >
      <!-- 搜索框 -->
      <div class="bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
        <!-- 搜索输入区 -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search class="w-5 h-5 text-muted-foreground" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            placeholder="搜索工具、文档..."
            @keydown.escape="close"
            @keydown.down="highlightNext"
            @keydown.up="highlightPrev"
            @keydown.enter="selectHighlighted"
          />
          <kbd class="px-2 py-1 text-xs text-muted-foreground bg-muted border border-border rounded">ESC</kbd>
        </div>

        <!-- 搜索结果 -->
        <div class="max-h-[60vh] overflow-y-auto">
          <!-- 搜索结果列表 -->
          <div v-if="filteredTools.length > 0" class="py-2">
            <div class="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              工具
            </div>
            <div
              v-for="(tool, index) in filteredTools.slice(0, 8)"
              :key="tool.id"
              class="px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
              :class="{ 'bg-muted': highlightedIndex === index }"
              @click="selectTool(tool)"
              @mouseenter="highlightedIndex = index"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="getIconComponent(tool.icon)"
                  class="w-5 h-5 text-muted-foreground flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-foreground truncate">{{ tool.name }}</div>
                  <div class="text-sm text-muted-foreground truncate">{{ tool.description }}</div>
                </div>
                <span
                  v-if="tool.hot || tool.new"
                  class="text-xs px-2 py-1 rounded-full flex-shrink-0"
                  :class="tool.hot ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'"
                >
                  {{ tool.hot ? 'HOT' : 'NEW' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 页面链接 -->
          <div v-if="filteredPages.length > 0" class="py-2 border-t border-border">
            <div class="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              页面
            </div>
            <div
              v-for="(page, index) in filteredPages.slice(0, 4)"
              :key="page.path"
              class="px-4 py-3 hover:bg-muted cursor-pointer transition-colors"
              :class="{ 'bg-muted': highlightedIndex === filteredTools.length + index + 1 }"
              @click="selectPage(page)"
              @mouseenter="highlightedIndex = filteredTools.length + index + 1"
            >
              <div class="flex items-center gap-3">
                <component
                  :is="page.icon"
                  class="w-5 h-5 text-muted-foreground flex-shrink-0"
                />
                <div class="flex-1">
                  <div class="font-medium text-foreground">{{ page.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ page.description }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 无结果 -->
          <div v-if="searchQuery && filteredTools.length === 0 && filteredPages.length === 0" class="py-12 text-center">
            <div class="text-muted-foreground mb-2">未找到相关结果</div>
            <div class="text-sm text-muted-foreground">试试搜索 "json" 或 "base64"</div>
          </div>

          <!-- 空状态 -->
          <div v-if="!searchQuery" class="py-8">
            <div class="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              热门工具
            </div>
            <div class="grid grid-cols-2 gap-2 px-4">
              <div
                v-for="tool in popularTools"
                :key="tool.id"
                class="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                @click="selectTool(tool)"
              >
                <div class="flex items-center gap-2">
                  <component
                    :is="getIconComponent(tool.icon)"
                    class="w-4 h-4 text-muted-foreground"
                  />
                  <span class="text-sm font-medium text-foreground truncate">{{ tool.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部快捷键提示 -->
        <div class="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <kbd class="px-2 py-0.5 bg-background border border-border rounded">↑↓</kbd>
              <span>导航</span>
            </div>
            <div class="flex items-center gap-1">
              <kbd class="px-2 py-0.5 bg-background border border-border rounded">Enter</kbd>
              <span>选择</span>
            </div>
            <div class="flex items-center gap-1">
              <kbd class="px-2 py-0.5 bg-background border border-border rounded">ESC</kbd>
              <span>关闭</span>
            </div>
          </div>
          <div>
            由 <kbd class="px-2 py-0.5 bg-background border border-border rounded">⌘K</kbd> 触发
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, FileJson, Hash, Database, Link, Shield, Timer, Image, Code, Layout, FileText, Book, Github, Clock, Type, Wifi } from 'lucide-vue-next'
import { tools } from '~/data/tools'

const router = useRouter()
const emit = defineEmits(['close'])

const isOpen = defineModel({ type: Boolean, default: false })
const searchQuery = ref('')
const searchInput = ref(null)
const highlightedIndex = ref(-1)

// 图标映射
const iconMap = {
  FileText, Hash, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Timer, Layout, Book, Github
}

// 页面数据
const pages = [
  {
    name: '全部工具',
    path: '/all',
    description: '浏览所有可用工具',
    icon: Layout
  },
  {
    name: '博客',
    path: '/blog',
    description: '技术文章和教程',
    icon: Book
  },
  {
    name: '关于我们',
    path: '/about',
    description: '了解 Util.cn',
    icon: FileText
  },
  {
    name: 'GitHub',
    path: 'https://github.com/dmdq/utilx',
    description: '开源项目地址',
    icon: Github
  }
]

// 热门工具
const popularTools = computed(() => {
  return tools
    .filter(tool => tool.hot || tool.viewCount > 10000)
    .slice(0, 6)
})

// 过滤结果
const filteredTools = computed(() => {
  if (!searchQuery.value) return []

  const query = String(searchQuery.value || '').toLowerCase()
  return tools.filter(tool =>
    String(tool.name || '').toLowerCase().includes(query) ||
    String(tool.description || '').toLowerCase().includes(query) ||
    (tool.keywords || []).some(keyword => String(keyword || '').toLowerCase().includes(query))
  ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
})

const filteredPages = computed(() => {
  if (!searchQuery.value) return []

  const query = String(searchQuery.value || '').toLowerCase()
  return pages.filter(page =>
    String(page.name || '').toLowerCase().includes(query) ||
    String(page.description || '').toLowerCase().includes(query)
  )
})

// 获取图标组件
const getIconComponent = (iconName) => {
  return iconMap[iconName] || FileText
}

// 选择工具
const selectTool = (tool) => {
  router.push(`/tools/${tool.id}/`)
  close()
}

// 选择页面
const selectPage = (page) => {
  if (page.path.startsWith('http')) {
    window.open(page.path, '_blank')
  } else {
    router.push(page.path)
  }
  close()
}

// 高亮下一个
const highlightNext = () => {
  const maxIndex = filteredTools.value.length + filteredPages.value.length - 1
  if (highlightedIndex.value < maxIndex) {
    highlightedIndex.value++
  } else {
    highlightedIndex.value = 0
  }
}

// 高亮上一个
const highlightPrev = () => {
  const maxIndex = filteredTools.value.length + filteredPages.value.length - 1
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  } else {
    highlightedIndex.value = maxIndex > 0 ? maxIndex : -1
  }
}

// 选择高亮项
const selectHighlighted = () => {
  if (highlightedIndex.value === -1) return

  if (highlightedIndex.value < filteredTools.value.length) {
    selectTool(filteredTools.value[highlightedIndex.value])
  } else {
    const pageIndex = highlightedIndex.value - filteredTools.value.length
    selectPage(filteredPages.value[pageIndex])
  }
}

// 关闭搜索
const close = () => {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
}

// 点击背景关闭
const closeOnBackdrop = () => {
  close()
}

// 键盘快捷键处理
const handleKeydown = (e) => {
  // Cmd/Ctrl + K 打开搜索
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      nextTick(() => {
        searchInput.value?.focus()
      })
    }
  }

  // ESC 关闭搜索
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听 isOpen 变化
watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})
</script>