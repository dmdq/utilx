<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">增强剪贴板管理器</h1>
      <p class="text-muted-foreground mb-4">支持分类、搜索、格式化的剪贴板历史记录管理</p>
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
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {{ getContentType(currentClipboard.content) }}
                </span>
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded">
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
            📋 捕获剪贴板
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
                class="px-2 py-1 bg-green-500 text-white rounded text-xs"
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
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {{ getContentType(item.content) }}
                    </span>
                    <span
                      v-if="item.category"
                      class="px-2 py-1 rounded text-white"
                      :style="{ backgroundColor: getCategoryColor(item.category) }"
                    >
                      {{ getCategoryName(item.category) }}
                    </span>
                    <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">
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
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">编辑剪贴板项</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">标题</label>
            <input
              v-model="editingItem.title"
              type="text"
              class="w-full px-3 py-2 border rounded-md"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">内容</label>
            <textarea
              v-model="editingItem.content"
              class="w-full px-3 py-2 border rounded-md resize-none"
              rows="8"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">分类</label>
              <select v-model="editingItem.category" class="w-full px-3 py-2 border rounded-md">
                <option value="">无分类</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">标签</label>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('增强剪贴板管理器 - 分类搜索格式化剪贴板历史')

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