<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">URL参数构建器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化构建URL查询参数，支持编码/解码，生成完整URL</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- 参数编辑区 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">查询参数</h2>
          <div class="flex gap-2">
            <button @click="addParam" class="px-3 py-1 text-sm bg-green-500 text-white rounded">添加</button>
            <button @click="clearAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          </div>
        </div>

        <div class="space-y-3 mb-4">
          <div v-for="(param, index) in params" :key="index" class="flex gap-2 items-center">
            <input
              v-model="param.key"
              placeholder="参数名"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              @input="generateURL"
            >
            <input
              v-model="param.value"
              placeholder="参数值"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              @input="generateURL"
            >
            <button @click="removeParam(index)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="params.length === 0" class="text-center py-8 text-gray-400">
          点击"添加"按钮添加查询参数
        </div>

        <!-- 快捷操作 -->
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-medium mb-2">快捷操作</h3>
          <div class="flex flex-wrap gap-2">
            <button @click="loadSample" class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">加载示例</button>
            <button @click="sortParams" class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">参数排序</button>
            <button @click="removeEmpty" class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">删除空值</button>
          </div>
        </div>
      </div>

      <!-- URL生成区 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">生成URL</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">基础URL</label>
            <input
              v-model="baseUrl"
              placeholder="https://example.com/api"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              @input="generateURL"
            >
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">完整URL</label>
            <textarea
              v-model="fullURL"
              readonly
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-sm font-mono"
            ></textarea>
          </div>

          <div class="flex gap-2">
            <button @click="copyURL" class="px-4 py-2 bg-green-500 text-white rounded text-sm">复制URL</button>
            <button @click="openURL" class="px-4 py-2 bg-blue-500 text-white rounded text-sm">打开URL</button>
          </div>
        </div>

        <!-- 编码选项 -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-medium mb-2">编码选项</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.encodeKeys" @change="generateURL" class="rounded">
              <span>URL编码参数名</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.encodeValues" @change="generateURL" class="rounded">
              <span>URL编码参数值</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.preserveOrder" class="rounded">
              <span>保持参数顺序</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- URL解析 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">URL解析器</h2>
      <div class="mb-4">
        <textarea
          v-model="urlToParse"
          placeholder="粘贴包含查询参数的URL进行解析..."
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
        ></textarea>
      </div>
      <button @click="parseURL" class="px-4 py-2 bg-blue-500 text-white rounded text-sm">解析URL</button>

      <div v-if="parsedParams.length > 0" class="mt-4">
        <h3 class="text-sm font-medium mb-2">解析结果</h3>
        <div class="space-y-2">
          <div v-for="(param, index) in parsedParams" :key="index" class="flex gap-4 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
            <span class="font-medium">{{ param.key }}</span>
            <span class="text-gray-600 dark:text-gray-400">=</span>
            <span class="font-mono">{{ param.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常见查询参数</h2>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div>
          <h3 class="font-medium mb-2">分页参数</h3>
          <div class="space-y-1">
            <button @click="addQuickParam('page', '1')" class="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">page - 页码</button>
            <button @click="addQuickParam('limit', '20')" class="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">limit - 每页数量</button>
            <button @click="addQuickParam('offset', '0')" class="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">offset - 偏移量</button>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2">排序参数</h3>
          <div class="space-y-1">
            <button @click="addQuickParam('sort', 'created_at')" class="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">sort - 排序字段</button>
            <button @click="addQuickParam('order', 'desc')" class="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">order - 排序方向</button>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2">筛选参数</h3>
          <div class="space-y-1">
            <button @click="addQuickParam('search', 'keyword')" class="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">search - 搜索关键词</button>
            <button @click="addQuickParam('filter', 'status')" class="block w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">filter - 筛选条件</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'URL参数构建器 - 在线查询参数生成器',
  meta: [{ name: 'description', content: '在线URL参数构建工具，可视化添加查询参数，支持URL编码，生成完整URL链接。' }],
  keywords: ['URL参数构建', '查询参数生成', 'URL编码', 'URL构建器', 'API测试']
})

interface Param {
  key: string
  value: string
}

const params = ref<Param[]>([])
const baseUrl = ref('https://example.com/api')
const fullURL = ref('')
const urlToParse = ref('')
const parsedParams = ref<Param[]>([])

const options = ref({
  encodeKeys: true,
  encodeValues: true,
  preserveOrder: true
})

function addParam() {
  params.value.push({ key: '', value: '' })
}

function removeParam(index: number) {
  params.value.splice(index, 1)
  generateURL()
}

function clearAll() {
  params.value = []
  fullURL.value = baseUrl.value
}

function addQuickParam(key: string, value: string) {
  params.value.push({ key, value })
  generateURL()
}

function encodeComponent(str: string, encode: boolean): string {
  if (!encode) return str
  return encodeURIComponent(str)
}

function generateURL() {
  const validParams = params.value.filter(p => p.key && p.value !== undefined)

  if (validParams.length === 0) {
    fullURL.value = baseUrl.value
    return
  }

  const queryString = validParams
    .map(p => `${encodeComponent(p.key, options.value.encodeKeys)}=${encodeComponent(p.value, options.value.encodeValues)}`)
    .join('&')

  fullURL.value = `${baseUrl.value}?${queryString}`
}

function loadSample() {
  params.value = [
    { key: 'page', value: '1' },
    { key: 'limit', value: '20' },
    { key: 'sort', value: 'created_at' },
    { key: 'order', value: 'desc' },
    { key: 'search', value: 'keyword' }
  ]
  generateURL()
}

function sortParams() {
  params.value.sort((a, b) => a.key.localeCompare(b.key))
  generateURL()
}

function removeEmpty() {
  params.value = params.value.filter(p => p.key && p.value)
  generateURL()
}

function parseURL() {
  if (!urlToParse.value) return

  try {
    const url = new URL(urlToParse.value)
    parsedParams.value = Array.from(url.searchParams.entries()).map(([key, value]) => ({ key, value }))
  } catch {
    alert('无效的URL格式')
  }
}

async function copyURL() {
  try {
    await navigator.clipboard.writeText(fullURL.value)
    alert('已复制URL')
  } catch {}
}

function openURL() {
  if (fullURL.value) {
    window.open(fullURL.value, '_blank')
  }
}

// 初始化
generateURL()
</script>
