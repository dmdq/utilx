<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">代码片段管理器</h1>
      <p class="text-gray-600 dark:text-gray-400">保存、管理和搜索常用代码片段，支持多语言分类</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- 左侧：片段列表 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">代码片段</h2>
          <button @click="showAddModal = true" class="px-3 py-1 text-sm bg-green-500 text-white rounded">+ 新建</button>
        </div>

        <!-- 搜索和筛选 -->
        <div class="mb-4">
          <input
            v-model="searchQuery"
            placeholder="搜索片段..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
        </div>

        <div class="mb-4 flex flex-wrap gap-1">
          <button
            v-for="lang in languages"
            :key="lang"
            @click="selectedLang = lang === selectedLang ? '' : lang"
            :class="['px-2 py-1 text-xs rounded', selectedLang === lang ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700']"
          >
            {{ lang }}
          </button>
        </div>

        <!-- 片段列表 -->
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="snippet in filteredSnippets"
            :key="snippet.id"
            @click="selectSnippet(snippet)"
            :class="['p-3 rounded-lg cursor-pointer transition', selectedSnippet?.id === snippet.id ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600']"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-medium text-sm">{{ snippet.title }}</h3>
                <p class="text-xs text-gray-500 mt-1">{{ snippet.description }}</p>
              </div>
              <button @click.stop="deleteSnippet(snippet.id)" class="text-red-500 hover:text-red-700">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="mt-2 flex gap-1">
              <span class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">{{ snippet.language }}</span>
              <span v-if="snippet.tags" class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 rounded">{{ snippet.tags }}</span>
            </div>
          </div>
        </div>

        <div v-if="filteredSnippets.length === 0" class="text-center py-8 text-gray-400 text-sm">
          {{ snippets.length === 0 ? '暂无代码片段，点击"新建"添加' : '没有匹配的片段' }}
        </div>
      </div>

      <!-- 右侧：代码编辑和预览 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 代码编辑器 -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">
              {{ selectedSnippet ? '编辑片段' : '选择或创建片段' }}
            </h2>
            <div v-if="selectedSnippet" class="flex gap-2">
              <button @click="copyCode" class="px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
              <button @click="saveSnippet" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">保存</button>
            </div>
          </div>

          <div v-if="selectedSnippet || showAddModal">
            <div class="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium mb-1">标题</label>
                <input
                  v-model="editingSnippet.title"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                  placeholder="片段标题"
                >
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">语言</label>
                <select v-model="editingSnippet.language" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
                  <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
                </select>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">描述</label>
              <input
                v-model="editingSnippet.description"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                placeholder="简短描述"
              >
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium mb-1">标签（逗号分隔）</label>
              <input
                v-model="editingSnippet.tags"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                placeholder="例如: 数组, 工具函数"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">代码</label>
              <textarea
                v-model="editingSnippet.code"
                class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
                placeholder="输入代码..."
              ></textarea>
            </div>
          </div>

          <div v-else class="text-center py-16 text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
            </svg>
            <p>从左侧选择一个片段或创建新片段</p>
          </div>
        </div>

        <!-- 预览 -->
        <div v-if="editingSnippet.code" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4">预览</h2>
          <pre class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto"><code>{{ editingSnippet.code }}</code></pre>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">新建代码片段</h2>
          <button @click="showAddModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">标题</label>
              <input v-model="newSnippet.title" class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm" placeholder="片段标题">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">语言</label>
              <select v-model="newSnippet.language" class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm">
                <option v-for="lang in languages" :key="lang" :value="lang">{{ lang }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">代码</label>
            <textarea v-model="newSnippet.code" rows="8" class="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-sm font-mono" placeholder="输入代码..."></textarea>
          </div>

          <div class="flex gap-2">
            <button @click="addSnippet" class="px-4 py-2 bg-blue-500 text-white rounded">添加</button>
            <button @click="showAddModal = false" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: '代码片段管理器 - 代码片段保存与管理',
  meta: [{ name: 'description', content: '在线代码片段管理工具，保存常用代码片段，支持多语言分类和搜索功能。' }],
  keywords: ['代码片段', '代码管理', 'snippet', '代码库', 'gists']
})

interface Snippet {
  id: string
  title: string
  description: string
  language: string
  code: string
  tags: string
  createdAt: number
}

const snippets = ref<Snippet[]>([])
const selectedSnippet = ref<Snippet | null>(null)
const editingSnippet = ref<Partial<Snippet>>({ title: '', description: '', language: 'JavaScript', code: '', tags: '' })
const searchQuery = ref('')
const selectedLang = ref('')
const showAddModal = ref(false)
const newSnippet = ref({ title: '', language: 'JavaScript', code: '' })

const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'PHP', 'Ruby', 'SQL', 'HTML', 'CSS', 'Shell', 'Other']

const filteredSnippets = computed(() => {
  return snippets.value.filter(s => {
    const matchSearch = !searchQuery.value ||
      s.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchLang = !selectedLang.value || s.language === selectedLang.value
    return matchSearch && matchLang
  })
})

function selectSnippet(snippet: Snippet) {
  selectedSnippet.value = snippet
  editingSnippet.value = { ...snippet }
}

function addSnippet() {
  if (!newSnippet.value.title || !newSnippet.value.code) {
    alert('请填写标题和代码')
    return
  }

  const snippet: Snippet = {
    id: Date.now().toString(),
    title: newSnippet.value.title,
    description: '',
    language: newSnippet.value.language,
    code: newSnippet.value.code,
    tags: '',
    createdAt: Date.now()
  }

  snippets.value.push(snippet)
  saveToStorage()
  showAddModal.value = false
  newSnippet.value = { title: '', language: 'JavaScript', code: '' }
}

function saveSnippet() {
  if (!selectedSnippet.value) return

  const index = snippets.value.findIndex(s => s.id === selectedSnippet.value!.id)
  if (index !== -1) {
    snippets.value[index] = {
      ...selectedSnippet.value,
      ...editingSnippet.value
    } as Snippet
    saveToStorage()
    alert('已保存')
  }
}

function deleteSnippet(id: string) {
  if (confirm('确定删除此片段？')) {
    snippets.value = snippets.value.filter(s => s.id !== id)
    if (selectedSnippet.value?.id === id) {
      selectedSnippet.value = null
      editingSnippet.value = { title: '', description: '', language: 'JavaScript', code: '', tags: '' }
    }
    saveToStorage()
  }
}

async function copyCode() {
  if (editingSnippet.value.code) {
    try {
      await navigator.clipboard.writeText(editingSnippet.value.code)
      alert('已复制')
    } catch {}
  }
}

function saveToStorage() {
  localStorage.setItem('code-snippets', JSON.stringify(snippets.value))
}

function loadFromStorage() {
  const saved = localStorage.getItem('code-snippets')
  if (saved) {
    try {
      snippets.value = JSON.parse(saved)
    } catch {}
  }

  // 如果没有数据，添加一些示例
  if (snippets.value.length === 0) {
    snippets.value = [
      {
        id: '1',
        title: '数组去重',
        description: '使用Set快速去重',
        language: 'JavaScript',
        code: 'const unique = [...new Set(array)]',
        tags: '数组',
        createdAt: Date.now()
      },
      {
        id: '2',
        title: '深拷贝',
        description: '对象深拷贝方法',
        language: 'JavaScript',
        code: 'const deepCopy = JSON.parse(JSON.stringify(obj))',
        tags: '对象',
        createdAt: Date.now()
      }
    ]
    saveToStorage()
  }
}

onMounted(() => {
  loadFromStorage()
})
</script>
