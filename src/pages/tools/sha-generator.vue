<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">SHA哈希生成器</h1>
      <p class="text-muted-foreground max-w-3xl">支持SHA-1、SHA-256、SHA-512等多种哈希算法在线计算，用于数据完整性验证和数字签名。</p>
    </div>

    <!-- 算法选择 -->
    <div class="mb-6">
      <label class="text-lg font-semibold block mb-3">选择哈希算法</label>
      <div class="flex flex-wrap gap-3">
        <label
          v-for="algorithm in algorithms"
          :key="algorithm.value"
          class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
          :class="{ 'bg-primary text-primary-foreground border-primary': selectedAlgorithm === algorithm.value }"
        >
          <input
            type="radio"
            :value="algorithm.value"
            v-model="selectedAlgorithm"
            class="sr-only"
          >
          <span>{{ algorithm.name }}</span>
          <span class="text-xs opacity-75">{{ algorithm.bits }}位</span>
        </label>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">原始数据</label>
          <div class="flex items-center gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileUpload"
                accept="*/*"
                class="hidden"
              >
              <span class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                选择文件
              </span>
            </label>
          </div>
        </div>
        <textarea
          v-model="inputText"
          placeholder="请输入要计算哈希的文本..."
          class="w-full h-64 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          字符数：{{ inputText.length }} | 大小：{{ formatBytes(inputText.length) }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">{{ getCurrentAlgorithmName() }}哈希值</label>
          <div class="flex items-center gap-2">
            <button
              @click="copyToClipboard(outputText)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              {{ copyButtonText }}
            </button>
            <button
              @click="downloadHash()"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors"
            >
              下载
            </button>
          </div>
        </div>
        <div class="w-full h-64 p-4 border border-border rounded-lg bg-muted/50">
          <div class="font-mono text-sm break-all">
            {{ outputText || '哈希值将显示在这里...' }}
          </div>
        </div>
        <div class="text-sm text-muted-foreground">
          长度：{{ outputText.length }} 字符 ({{ (outputText.length * 4).toFixed(0) }} 位)
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="generateHash"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        生成哈希
      </button>
      <button
        @click="compareHash"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
      >
        哈希对比
      </button>
      <button
        @click="generateAllHashes"
        class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        生成全部算法
      </button>
    </div>

    <!-- 全部算法结果 -->
    <div v-if="allHashes.length > 0" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">所有算法哈希值</h3>
      <div class="space-y-3">
        <div v-for="hash in allHashes" :key="hash.algorithm" class="border-b border-border pb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium">{{ hash.name }}</span>
            <button
              @click="copyToClipboard(hash.value)"
              class="text-primary hover:text-primary/80 transition-colors"
            >
              复制
            </button>
          </div>
          <div class="font-mono text-sm bg-muted/50 p-3 rounded">{{ hash.value }}</div>
        </div>
      </div>
    </div>

    <!-- 算法对比 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">SHA算法对比</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-2">算法</th>
              <th class="text-left py-2">输出长度</th>
              <th class="text-left py-2">安全性</th>
              <th class="text-left py-2">推荐用途</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="algo in algorithms" :key="algo.value" class="border-b border-border">
              <td class="py-2 font-medium">{{ algo.name }}</td>
              <td class="py-2">{{ algo.bits }} 位</td>
              <td class="py-2">
                <span :class="algo.security === 'high' ? 'text-green-500' : algo.security === 'medium' ? 'text-yellow-500' : 'text-red-500'">
                  {{ algo.security === 'high' ? '高' : algo.security === 'medium' ? '中' : '低' }}
                </span>
              </td>
              <td class="py-2">{{ algo.useCase }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 安全提示 -->
    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-3 flex items-center">
        <span class="text-yellow-500 mr-2">⚠️</span>
        安全提示
      </h3>
      <ul class="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
        <li>• SHA-1 已被发现存在碰撞漏洞，不建议用于新的安全应用</li>
        <li>• 推荐使用 SHA-256 或更高强度的哈希算法</li>
        <li>• 哈希函数是单向的，无法从哈希值反推原始数据</li>
        <li>• 对于密码存储，建议使用加盐哈希（salted hash）</li>
      </ul>
    </div>

    <!-- 相关工具 -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">相关工具</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ToolCard
          v-for="tool in relatedTools"
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'



const category = categories.find(c => c.id === 'crypto')

// 算法定义
const algorithms = [
  { name: 'SHA-1', value: 'SHA-1', bits: 160, security: 'low', useCase: '已不推荐使用' },
  { name: 'SHA-256', value: 'SHA-256', bits: 256, security: 'high', useCase: '推荐使用' },
  { name: 'SHA-384', value: 'SHA-384', bits: 384, security: 'high', useCase: '高安全性需求' },
  { name: 'SHA-512', value: 'SHA-512', bits: 512, security: 'high', useCase: '最高安全性' }
]

// 响应式数据
const inputText = ref('')
const outputText = ref('')
const selectedAlgorithm = ref('SHA-256')
const fileInput = ref(null)
const copyButtonText = ref('复制')
const allHashes = ref([])

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'sha-generator'
  ).slice(0, 4)
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

// 格式化字节数
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取当前算法名称
const getCurrentAlgorithmName = () => {
  const algo = algorithms.find(a => a.value === selectedAlgorithm.value)
  return algo ? algo.name : 'SHA'
}

// 生成哈希
const generateHash = async () => {
  try {
    if (inputText.value) {
      const encoder = new TextEncoder()
      const data = encoder.encode(inputText.value)
      const hashBuffer = await crypto.subtle.digest(selectedAlgorithm.value, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      outputText.value = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
      outputText.value = ''
    }
  } catch (error) {
    console.error('哈希生成失败:', error)
    outputText.value = '生成失败：' + error.message
  }
}

// 生成所有算法的哈希
const generateAllHashes = async () => {
  if (!inputText.value) return

  allHashes.value = []
  const encoder = new TextEncoder()
  const data = encoder.encode(inputText.value)

  for (const algo of algorithms) {
    try {
      const hashBuffer = await crypto.subtle.digest(algo.value, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      allHashes.value.push({
        algorithm: algo.value,
        name: algo.name,
        value: hashHex
      })
    } catch (error) {
      console.error(`${algo.name} 生成失败:`, error)
    }
  }
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    inputText.value = e.target.result
    generateHash()
  }
  reader.readAsText(file)
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    copyButtonText.value = '已复制'
    setTimeout(() => {
      copyButtonText.value = '复制'
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载哈希值
const downloadHash = () => {
  if (!outputText.value) return

  const content = `原始文本: ${inputText.value}\n算法: ${getCurrentAlgorithmName()}\n哈希值: ${outputText.value}\n生成时间: ${new Date().toLocaleString()}`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sha-hash.txt'
  a.click()
  URL.revokeObjectURL(url)
}

// 哈希对比
const compareHash = () => {
  const compareValue = prompt('请输入要对比的哈希值:')
  if (compareValue) {
    if (outputText.value.toLowerCase() === compareValue.toLowerCase()) {
      alert('✅ 哈希值匹配！')
    } else {
      alert('❌ 哈希值不匹配！')
    }
  }
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  allHashes.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('sha-generator')

// SEO配置
useSeoMeta({
  title: 'SHA哈希生成器 - 在线SHA-1/SHA-256/SHA-512加密工具',
  description: '免费在线SHA哈希生成器，支持SHA-1、SHA-256、SHA-384、SHA-512算法，用于数据完整性验证和数字签名。',
  keywords: ['SHA', 'SHA-1', 'SHA-256', 'SHA-512', '哈希', '加密', '数字签名', '数据完整性']
})

</script>