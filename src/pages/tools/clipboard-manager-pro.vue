<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">增强剪贴板管理器 - 分类搜索格式化剪贴板历史</h1>
      <p class="text-muted-foreground">支持分类、搜索、格式化的剪贴板历史记录管理。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 剪贴板状态 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">当前剪贴板</h3>
          <div class="border rounded-md p-3 bg-muted min-h-20">
            <div v-if="currentClipboard" class="space-y-2">
              <div class="text-sm font-medium">内容预览:</div>
              <div class="text-sm text-muted-foreground truncate">
                {{ currentClipboard.content }}
              </div>
              <div class="flex gap-2 text-xs">
                <span class="px-2 py-1 bg-primary/20 text-primary rounded">
                  {{ getContentType(currentClipboard.content) }}
                </span>
                <span class="px-2 py-1 bg-secondary/20 text-secondary-foreground rounded">
                  {{ formatBytes(currentClipboard.content.length) }}
                </span>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground">
              剪贴板为空
            </div>
          </div>

          <button
            @click="captureClipboard"
            class="w-full mt-3 px-3 py-2 bg-primary text-primary-foreground rounded text-sm"
          >
            捕获剪贴板
          </button>
        </div>

        <!-- 分类管理 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">分类管理</h3>
            <button
              @click="showAddCategory = true"
              class="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
            >
              + 添加
            </button>
          </div>

          <div v-if="showAddCategory" class="mb-3">
            <div class="flex gap-2">
              <input
                v-model="newCategoryName"
                placeholder="分类名称"
                class="flex-1 px-2 py-1 text-sm border rounded"
                @keyup.enter="addCategory"
              >
              <input
                v-model="newCategoryColor"
                type="color"
                class="w-8 h-8 rounded cursor-pointer"
              >
              <button
                @click="addCategory"
                class="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
              >
                ✓
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="category in categories"
              :key="category.id"
              class="flex items-center justify-between p-2 border rounded"
              :style="{ borderLeftColor: category.color, borderLeftWidth: '4px' }"
            >
              <span class="text-sm">{{ category.name }}</span>
              <div class="flex items-center gap-1">
                <span class="text-xs text-muted-foreground">{{ getItemCount(category.id) }}</span>
                <button
                  @click="deleteCategory(category.id)"
                  class="px-1 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索和过滤 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">搜索过滤</h3>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">搜索内容</label>
              <input
                v-model="searchQuery"
                @input="filterItems"
                type="text"
                placeholder="搜索剪贴板内容..."
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">按分类过滤</label>
              <select
                v-model="selectedCategory"
                @change="filterItems"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option value="">全部分类</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">按类型过滤</label>
              <select
                v-model="selectedType"
                @change="filterItems"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option value="">全部类型</option>
                <option value="text">文本</option>
                <option value="image">图片</option>
                <option value="url">链接</option>
                <option value="code">代码</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">时间范围</label>
              <select
                v-model="timeRange"
                @change="filterItems"
                class="w-full px-3 py-2 border rounded-md"
              >
                <option value="">全部时间</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 设置 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">设置</h3>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm">自动捕获剪贴板</span>
              <input
                v-model="settings.autoCapture"
                type="checkbox"
                class="rounded"
              >
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm">最大历史记录</span>
              <input
                v-model.number="settings.maxHistory"
                type="number"
                min="10"
                max="1000"
                class="w-20 px-2 py-1 border rounded text-sm"
              >
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm">显示收藏项优先</span>
              <input
                v-model="settings.prioritizeFavorites"
                type="checkbox"
                class="rounded"
              >
            </div>

            <button
              @click="clearHistory"
              class="w-full px-3 py-2 bg-destructive text-destructive-foreground rounded text-sm"
            >
              清空历史记录
            </button>

            <div>
              <label class="block text-sm font-medium mb-1">导出数据</label>
              <button
                @click="exportData"
                class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                导出剪贴板数据
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧剪贴板历史 -->
      <div class="lg:col-span-2">
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">剪贴板历史</h3>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{{ filteredItems.length }} 项</span>
              <div class="flex gap-1">
                <button
                  @click="sortBy = 'time'"
                  :class="sortBy === 'time' ? 'text-primary' : ''"
                  class="px-2 py-1 rounded hover:bg-muted"
                >
                  时间
                </button>
                <button
                  @click="sortBy = 'frequency'"
                  :class="sortBy === 'frequency' ? 'text-primary' : ''"
                  class="px-2 py-1 rounded hover:bg-muted"
                >
                  频率
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-2 max-h-[600px] overflow-y-auto">
            <div
              v-for="item in sortedItems"
              :key="item.id"
              class="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <button
                      @click="toggleFavorite(item.id)"
                      class="text-lg"
                      :class="item.favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'"
                    >
                      {{ item.favorite ? '★' : '☆' }}
                    </button>
                    <span class="font-medium text-sm truncate">{{ item.title || getPreview(item.content) }}</span>
                  </div>

                  <div class="flex gap-2 text-xs mb-1">
                    <span class="px-2 py-1 bg-primary/20 text-primary rounded">
                      {{ getContentType(item.content) }}
                    </span>
                    <span
                      v-if="item.category"
                      class="px-2 py-1 rounded text-white"
                      :style="{ backgroundColor: getCategoryColor(item.category) }"
                    >
                      {{ getCategoryName(item.category) }}
                    </span>
                    <span class="px-2 py-1 bg-muted text-muted-foreground rounded">
                      {{ formatTime(item.timestamp) }}
                    </span>
                  </div>
                </div>

                <div class="flex gap-1">
                  <button
                    @click="copyToClipboard(item.content)"
                    class="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
                  >
                    复制
                  </button>
                  <button
                    @click="editItem(item)"
                    class="px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-xs"
                  >
                    编辑
                  </button>
                  <button
                    @click="deleteItem(item.id)"
                    class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div class="text-sm text-muted-foreground bg-muted/50 rounded p-2 max-h-32 overflow-y-auto">
                {{ getPreview(item.content, 200) }}
              </div>
            </div>

            <div v-if="filteredItems.length === 0" class="text-center py-8 text-muted-foreground">
              暂无剪贴板记录
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="editingItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-card rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 class="text-lg font-semibold text-foreground mb-4">编辑剪贴板项</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">标题</label>
            <input
              v-model="editingItem.title"
              type="text"
              class="w-full px-3 py-2 border rounded-md"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1">内容</label>
            <textarea
              v-model="editingItem.content"
              class="w-full px-3 py-2 border border-border rounded-md resize-none bg-background"
              rows="8"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">分类</label>
              <select v-model="editingItem.category" class="w-full px-3 py-2 border rounded-md">
                <option value="">无分类</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-1">标签</label>
              <input
                v-model="editingItem.tags"
                placeholder="用逗号分隔"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="editingItem = null"
            class="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded"
          >
            取消
          </button>
          <button
            @click="saveEdit"
            class="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是增强剪贴板管理器？
        </h2>
        <p class="text-muted-foreground mb-4">
          增强剪贴板管理器是一款功能强大的剪贴板历史记录管理工具，支持内容分类、智能搜索、格式化预览等功能。
          它能够自动捕获您的剪贴板内容，并按照类型（文本、代码、链接、图片等）进行智能分类，
          让您能够快速找到之前复制过的内容。
          所有处理都在浏览器本地完成，数据不会上传到服务器，确保您的隐私安全。
        </p>
        <p class="text-muted-foreground">
          为什么需要剪贴板管理器？在日常工作中，我们经常需要重复使用之前复制过的内容，
          但系统默认的剪贴板只能保存最后一次复制的内容。增强剪贴板管理器可以保存完整的历史记录，
          支持收藏重要内容、按分类筛选、智能搜索等功能，大大提高工作效率。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>点击"捕获剪贴板"按钮手动捕获当前剪贴板内容</li>
          <li>或在设置中启用"自动捕获剪贴板"功能，每秒自动检测</li>
          <li>使用分类管理功能创建自定义分类，帮助组织内容</li>
          <li>通过搜索和过滤功能快速找到需要的历史记录</li>
          <li>点击星标收藏重要内容，方便快速访问</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能分类</strong>: 自动识别内容类型（文本、代码、链接、图片、JSON）</li>
          <li><strong>自定义分类</strong>: 创建个性化分类，使用不同颜色标识</li>
          <li><strong>高级搜索</strong>: 支持内容搜索、分类过滤、类型筛选、时间范围过滤</li>
          <li><strong>收藏功能</strong>: 星标收藏重要内容，优先显示收藏项</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>自动捕获</strong>: 可选自动捕获功能，实时监控剪贴板变化</li>
          <li><strong>数据导出</strong>: 支持导出剪贴板历史记录为JSON文件</li>
          <li><strong>使用统计</strong>: 记录每条内容的使用次数，智能排序</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">剪贴板管理器会收集我的数据吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。我们的剪贴板管理器采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您的剪贴板历史记录只保存在本地浏览器中，确保隐私安全。
              您可以随时使用"导出数据"功能备份您的剪贴板历史记录。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何启用自动捕获功能？</h3>
            <p class="text-muted-foreground mt-1">
              在左侧设置面板中，勾选"自动捕获剪贴板"选项即可启用。
              启用后，工具会每秒自动检测剪贴板变化，当发现新内容时会自动添加到历史记录中。
              注意：自动捕获功能需要浏览器授权访问剪贴板权限。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些内容类型？</h3>
            <p class="text-muted-foreground mt-1">
              工具支持多种内容类型的自动识别：文本（纯文本内容）、代码（包含编程语法特征）、
              链接（URL地址）、JSON数据、图片（图片链接或Base64编码）。
              系统会根据内容特征自动判断类型，也可以手动为内容分配自定义分类。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">历史记录会一直保存吗？</h3>
            <p class="text-muted-foreground mt-1">
              历史记录会一直保存在浏览器本地，直到您手动清除或浏览器清除缓存。
              您可以在设置中调整"最大历史记录"数量（10-1000条），当超过限制时，
              系统会自动删除最旧的记录。建议定期使用"导出数据"功能备份重要内容。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Clipboard, HelpCircle, ChevronUp,
  FileText, Lock, Shield, Clock, Type, Code,
  Database, Link, Hash, Save, Trash2, Edit2, Star, Search
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '增强剪贴板管理器 - 分类搜索格式化剪贴板历史 | Util工具箱',
  description: '免费在线剪贴板管理器，支持内容分类、智能搜索、格式化预览。纯本地计算，数据安全隐私。自动捕获剪贴板，提高工作效率。',
  keywords: '剪贴板管理器,剪贴板历史,剪贴板工具,剪贴板增强,在线剪贴板,剪贴板记录,剪贴板备份',
  author: 'Util工具箱',
  ogTitle: '增强剪贴板管理器 - 分类搜索格式化剪贴板历史',
  ogDescription: '专业的剪贴板管理器，支持内容分类、智能搜索、格式化预览。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/clipboard-manager-pro.png',
  ogUrl: 'https://www.util.cn/tools/clipboard-manager-pro',
  ogType: 'website'
})

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Code,
  Database, Link, Hash
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'text-tools'),
    tools.find(t => t.id === 'code-formatter'),
    tools.find(t => t.id === 'base64-encoder'),
    tools.find(t => t.id === 'url-encoder')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const router = useRouter()

// 定义当前工具
const tool = tools.find(t => t.id === 'clipboard-manager-pro')

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 数据
const currentClipboard = ref(null)
const clipboardHistory = ref([])
const categories = ref([
  { id: 'code', name: '代码', color: '#3b82f6' },
  { id: 'text', name: '文本', color: '#10b981' },
  { id: 'url', name: '链接', color: '#f59e0b' },
  { id: 'image', name: '图片', color: '#ef4444' }
])

// 搜索和过滤
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedType = ref('')
const timeRange = ref('')
const sortBy = ref('time')

// 界面状态
const showAddCategory = ref(false)
const newCategoryName = ref('')
const newCategoryColor = ref('#3b82f6')
const editingItem = ref(null)

// 设置
const settings = ref({
  autoCapture: false,
  maxHistory: 100,
  prioritizeFavorites: true
})

// 计算属性
const filteredItems = computed(() => {
  let items = [...clipboardHistory.value]

  // 搜索过滤
  if (searchQuery.value) {
    items = items.filter(item =>
      item.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 分类过滤
  if (selectedCategory.value) {
    items = items.filter(item => item.category === selectedCategory.value)
  }

  // 类型过滤
  if (selectedType.value) {
    items = items.filter(item => getContentType(item.content) === selectedType.value)
  }

  // 时间过滤
  if (timeRange.value) {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    items = items.filter(item => {
      const diff = now - item.timestamp
      switch (timeRange.value) {
        case 'today': return diff < dayMs
        case 'week': return diff < 7 * dayMs
        case 'month': return diff < 30 * dayMs
        default: return true
      }
    })
  }

  return items
})

const sortedItems = computed(() => {
  const items = [...filteredItems.value]

  if (settings.value.prioritizeFavorites) {
    items.sort((a, b) => {
      if (a.favorite !== b.favorite) {
        return b.favorite - a.favorite
      }
    })
  }

  if (sortBy.value === 'time') {
    return items.sort((a, b) => b.timestamp - a.timestamp)
  } else if (sortBy.value === 'frequency') {
    return items.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
  }

  return items
})

// 方法
const getContentType = (content) => {
  if (!content) return 'text'

  const trimmed = content.trim()

  // 检查URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.')) {
    return 'url'
  }

  // 检查JSON
  try {
    JSON.parse(trimmed)
    return 'json'
  } catch (e) {
    // 不是JSON
  }

  // 检查代码（常见代码特征）
  if (trimmed.includes('function') || trimmed.includes('class ') ||
      trimmed.includes('def ') || trimmed.includes('import ') ||
      trimmed.includes('const ') || trimmed.includes('let ') ||
      trimmed.includes('var ')) {
    return 'code'
  }

  // 检查是否可能包含图片（简单检查）
  if (trimmed.startsWith('data:image/') || trimmed.includes('<img')) {
    return 'image'
  }

  return 'text'
}

const getPreview = (content, maxLength = 100) => {
  if (!content) return ''
  const preview = content.replace(/\s+/g, ' ').trim()
  return preview.length > maxLength ? preview.substring(0, maxLength) + '...' : preview
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString()
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : '未分类'
}

const getCategoryColor = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.color : '#6b7280'
}

const getItemCount = (categoryId) => {
  return clipboardHistory.value.filter(item => item.category === categoryId).length
}

const captureClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      addToHistory(text)
    }
  } catch (err) {
    console.error('读取剪贴板失败:', err)
  }
}

const addToHistory = (content, options = {}) => {
  const existingItem = clipboardHistory.value.find(item => item.content === content)

  if (existingItem) {
    // 更新使用次数和时间戳
    existingItem.usageCount = (existingItem.usageCount || 0) + 1
    existingItem.timestamp = Date.now()
  } else {
    // 添加新项
    const newItem = {
      id: Date.now(),
      content,
      title: options.title || '',
      category: options.category || '',
      tags: options.tags || '',
      favorite: options.favorite || false,
      timestamp: Date.now(),
      usageCount: 1
    }

    clipboardHistory.value.unshift(newItem)

    // 限制历史记录数量
    if (clipboardHistory.value.length > settings.value.maxHistory) {
      clipboardHistory.value = clipboardHistory.value.slice(0, settings.value.maxHistory)
    }
  }

  currentClipboard.value = { content, timestamp: Date.now() }
}

const copyToClipboard = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    // 更新使用次数
    const item = clipboardHistory.value.find(i => i.content === content)
    if (item) {
      item.usageCount = (item.usageCount || 0) + 1
      item.timestamp = Date.now()
    }
  } catch (err) {
    console.error('复制到剪贴板失败:', err)
  }
}

const toggleFavorite = (itemId) => {
  const item = clipboardHistory.value.find(i => i.id === itemId)
  if (item) {
    item.favorite = !item.favorite
  }
}

const editItem = (item) => {
  editingItem.value = { ...item }
}

const saveEdit = () => {
  if (editingItem.value) {
    const index = clipboardHistory.value.findIndex(i => i.id === editingItem.value.id)
    if (index !== -1) {
      clipboardHistory.value[index] = { ...editingItem.value }
    }
  }
  editingItem.value = null
}

const deleteItem = (itemId) => {
  clipboardHistory.value = clipboardHistory.value.filter(i => i.id !== itemId)
}

const addCategory = () => {
  if (newCategoryName.value.trim()) {
    categories.value.push({
      id: newCategoryName.value.toLowerCase().replace(/\s+/g, '-'),
      name: newCategoryName.value,
      color: newCategoryColor.value
    })
    newCategoryName.value = ''
    newCategoryColor.value = '#3b82f6'
    showAddCategory.value = false
  }
}

const deleteCategory = (categoryId) => {
  categories.value = categories.value.filter(c => c.id !== categoryId)
  // 从历史记录中移除该分类
  clipboardHistory.value.forEach(item => {
    if (item.category === categoryId) {
      item.category = ''
    }
  })
}

const filterItems = () => {
  // 触发重新计算
}

const clearHistory = () => {
  if (confirm('确定要清空所有剪贴板历史记录吗？')) {
    clipboardHistory.value = []
  }
}

const exportData = () => {
  const data = {
    categories: categories.value,
    items: clipboardHistory.value,
    settings: settings.value,
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clipboard_history_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 自动捕获
let captureInterval = null

const startAutoCapture = () => {
  if (captureInterval) {
    clearInterval(captureInterval)
  }

  captureInterval = setInterval(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text !== (currentClipboard.value?.content || '')) {
        addToHistory(text)
      }
    } catch (err) {
      // 忽略错误
    }
  }, 1000) // 每秒检查一次
}

const stopAutoCapture = () => {
  if (captureInterval) {
    clearInterval(captureInterval)
    captureInterval = null
  }
}

// 生命周期
onMounted(() => {
  // 加载示例数据
  addToHistory('console.log("Hello, World!");', {
    title: 'JavaScript示例',
    category: 'code',
    favorite: true
  })

  addToHistory('https://github.com', {
    title: 'GitHub官网',
    category: 'url',
    favorite: true
  })

  addToHistory('This is a sample text snippet that demonstrates clipboard history.', {
    title: '示例文本',
    category: 'text'
  })

  // 监听自动捕获设置
  watch(() => settings.value.autoCapture, (newValue) => {
    if (newValue) {
      startAutoCapture()
    } else {
      stopAutoCapture()
    }
  }, { immediate: true })
})

onUnmounted(() => {
  stopAutoCapture()
})
</script>