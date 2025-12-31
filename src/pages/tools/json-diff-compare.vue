<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">JSON对比工具</h1>
      <p class="text-gray-600 dark:text-gray-400">对比两个JSON的差异，高亮显示新增、删除、修改的内容</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- JSON 1 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">JSON A（原始）</h2>
          <div class="flex gap-2">
            <button @click="loadSample('left')" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
            <button @click="clearLeft" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          </div>
        </div>
        <textarea
          v-model="jsonLeft"
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴第一个JSON..."
          @input="compare"
        ></textarea>
      </div>

      <!-- JSON 2 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">JSON B（修改后）</h2>
          <div class="flex gap-2">
            <button @click="loadSample('right')" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
            <button @click="clearRight" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          </div>
        </div>
        <textarea
          v-model="jsonRight"
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴第二个JSON..."
          @input="compare"
        ></textarea>
      </div>
    </div>

    <div class="flex gap-4 mb-6">
      <button @click="compare" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">对比JSON</button>
      <button v-if="diffResult" @click="copyDiff" class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">复制差异</button>
    </div>

    <!-- 对比结果 -->
    <div v-if="diffResult" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">对比结果</h2>

      <!-- 统计 -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">{{ stats.total }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">总计</div>
        </div>
        <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.added }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">新增</div>
        </div>
        <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-red-600">{{ stats.removed }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">删除</div>
        </div>
        <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ stats.modified }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">修改</div>
        </div>
      </div>

      <!-- 详细差异 -->
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div v-for="(diff, index) in diffResult" :key="index" class="flex">
          <div class="w-24 py-2 text-sm text-gray-500">{{ diff.path }}</div>
          <div class="flex-1">
            <div v-if="diff.type === 'added'" class="p-2 bg-green-100 dark:bg-green-900/30 rounded">
              <span class="text-green-600 text-xs font-medium">新增</span>
              <code class="ml-2 text-sm">{{ JSON.stringify(diff.value) }}</code>
            </div>
            <div v-else-if="diff.type === 'removed'" class="p-2 bg-red-100 dark:bg-red-900/30 rounded">
              <span class="text-red-600 text-xs font-medium">删除</span>
              <code class="ml-2 text-sm line-through opacity-60">{{ JSON.stringify(diff.oldValue) }}</code>
            </div>
            <div v-else class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
              <span class="text-yellow-600 text-xs font-medium">修改</span>
              <code class="ml-2 text-sm line-through opacity-60">{{ JSON.stringify(diff.oldValue) }}</code>
              <span class="mx-2">→</span>
              <code class="text-sm">{{ JSON.stringify(diff.value) }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="errorMessage" class="bg-red-100 dark:bg-red-900/30 rounded-xl p-6 mb-6">
      <div class="flex items-center gap-2 text-red-700 dark:text-red-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">图例说明</h2>
      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-green-500 rounded"></div>
          <span>新增字段</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-red-500 rounded"></div>
          <span>删除字段</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>修改字段</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'JSON对比工具 - 在线JSON差异对比',
  meta: [{ name: 'description', content: '在线对比两个JSON的差异，高亮显示新增、删除、修改的内容，支持深度嵌套对比。' }],
  keywords: ['JSON对比', 'JSON差异', 'JSON diff', 'JSON比较', '配置对比']
})

const jsonLeft = ref('')
const jsonRight = ref('')
const diffResult = ref<any[]>([])
const errorMessage = ref('')

const stats = computed(() => {
  const added = diffResult.value.filter(d => d.type === 'added').length
  const removed = diffResult.value.filter(d => d.type === 'removed').length
  const modified = diffResult.value.filter(d => d.type === 'modified').length
  return { total: added + removed + modified, added, removed, modified }
})

const sampleLeft = {
  name: '张三',
  age: 25,
  email: 'zhangsan@example.com',
  address: {
    city: '北京',
    street: '朝阳路'
  },
  hobbies: ['阅读', '旅游']
}

const sampleRight = {
  name: '张三',
  age: 26,
  email: 'zhangsan@example.com',
  phone: '13800138000',
  address: {
    city: '上海',
    street: '朝阳路'
  },
  hobbies: ['阅读', '游泳', '音乐']
}

function loadSample(side: 'left' | 'right') {
  if (side === 'left') {
    jsonLeft.value = JSON.stringify(sampleLeft, null, 2)
  } else {
    jsonRight.value = JSON.stringify(sampleRight, null, 2)
  }
  compare()
}

function clearLeft() {
  jsonLeft.value = ''
  compare()
}

function clearRight() {
  jsonRight.value = ''
  compare()
}

function compare() {
  errorMessage.value = ''
  diffResult.value = []

  if (!jsonLeft.value || !jsonRight.value) return

  let obj1: any, obj2: any

  try {
    obj1 = JSON.parse(jsonLeft.value)
  } catch {
    errorMessage.value = 'JSON A 格式错误'
    return
  }

  try {
    obj2 = JSON.parse(jsonRight.value)
  } catch {
    errorMessage.value = 'JSON B 格式错误'
    return
  }

  diffResult.value = deepDiff(obj1, obj2, '')
}

function deepDiff(obj1: any, obj2: any, path: string): any[] {
  const diffs: any[] = []

  // 处理对象
  if (typeof obj1 === 'object' && obj1 !== null && typeof obj2 === 'object' && obj2 !== null) {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    const allKeys = new Set([...keys1, ...keys2])

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key

      if (!(key in obj1)) {
        diffs.push({ type: 'added', path: currentPath, value: obj2[key] })
      } else if (!(key in obj2)) {
        diffs.push({ type: 'removed', path: currentPath, oldValue: obj1[key] })
      } else {
        const subDiffs = deepDiff(obj1[key], obj2[key], currentPath)
        diffs.push(...subDiffs)
      }
    }
  }
  // 处理数组
  else if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLength = Math.max(obj1.length, obj2.length)

    for (let i = 0; i < maxLength; i++) {
      const currentPath = `${path}[${i}]`

      if (i >= obj1.length) {
        diffs.push({ type: 'added', path: currentPath, value: obj2[i] })
      } else if (i >= obj2.length) {
        diffs.push({ type: 'removed', path: currentPath, oldValue: obj1[i] })
      } else {
        const subDiffs = deepDiff(obj1[i], obj2[i], currentPath)
        diffs.push(...subDiffs)
      }
    }
  }
  // 处理基本类型
  else if (obj1 !== obj2) {
    diffs.push({ type: 'modified', path, oldValue: obj1, value: obj2 })
  }

  return diffs
}

async function copyDiff() {
  try {
    const text = diffResult.value.map(d => {
      switch (d.type) {
        case 'added': return `[+] ${d.path}: ${JSON.stringify(d.value)}`
        case 'removed': return `[-] ${d.path}: ${JSON.stringify(d.oldValue)}`
        case 'modified': return `[*] ${d.path}: ${JSON.stringify(d.oldValue)} → ${JSON.stringify(d.value)}`
      }
    }).join('\n')
    await navigator.clipboard.writeText(text)
    alert('已复制')
  } catch {}
}

// 加载初始示例
loadSample('left')
loadSample('right')
</script>
