<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">MD5哈希生成器</h1>
      <p class="text-muted-foreground max-w-3xl">在线MD5哈希值生成工具，支持文本和文件的MD5计算，用于数据完整性验证和密码加密。</p>
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
          placeholder="请输入要计算MD5哈希的文本..."
          class="w-full h-64 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          字符数：{{ inputText.length }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">MD5哈希值</label>
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
          <div class="font-mono text-lg break-all">
            {{ outputText || 'MD5哈希值将显示在这里...' }}
          </div>
        </div>
        <div class="text-sm text-muted-foreground">
          长度：{{ outputText.length }} 位
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="generateMD5"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        生成 MD5
      </button>
      <button
        @click="compareHash"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
      >
        哈希对比
      </button>
      <button
        @click="showBatchProcess = true"
        class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        批量处理
      </button>
    </div>

    <!-- 批量处理对话框 -->
    <div v-if="showBatchProcess" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-background rounded-lg border border-border max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">批量MD5计算</h3>
          <textarea
            v-model="batchInput"
            placeholder="每行输入一个要计算MD5的文本..."
            class="w-full h-48 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          ></textarea>
          <div class="flex justify-end gap-2">
            <button
              @click="showBatchProcess = false"
              class="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              取消
            </button>
            <button
              @click="processBatch"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              批量处理
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量处理结果 -->
    <div v-if="batchResults.length > 0" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">批量处理结果</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-2">原始文本</th>
              <th class="text-left py-2">MD5哈希</th>
              <th class="text-left py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(result, index) in batchResults" :key="index" class="border-b border-border">
              <td class="py-2 font-mono text-xs max-w-xs truncate">{{ result.text }}</td>
              <td class="py-2 font-mono text-xs">{{ result.hash }}</td>
              <td class="py-2">
                <button
                  @click="copyToClipboard(result.hash)"
                  class="text-primary hover:text-primary/80 transition-colors"
                >
                  复制
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MD5信息展示 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于MD5算法</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-primary mb-2">算法特性</h4>
          <ul class="space-y-1 text-sm">
            <li>• 固定输出长度：128位（32个十六进制字符）</li>
            <li>• 单向加密：无法从MD5反推原始数据</li>
            <li>• 雪崩效应：输入微小变化导致输出巨大差异</li>
            <li>• 计算速度快：适合大量数据处理</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">常见用途</h4>
          <ul class="space-y-1 text-sm">
            <li>• 文件完整性校验</li>
            <li>• 密码存储（已不推荐单独使用）</li>
            <li>• 数字签名（结合其他算法）</li>
            <li>• 数据去重和索引</li>
          </ul>
        </div>
      </div>
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

definePageMeta({
  layout: 'default'
})

const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const inputText = ref('')
const outputText = ref('')
const fileInput = ref(null)
const copyButtonText = ref('复制')
const showBatchProcess = ref(false)
const batchInput = ref('')
const batchResults = ref([])

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'md5-generator'
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

// 生成MD5哈希
const generateMD5 = async () => {
  try {
    if (inputText.value) {
      // 使用 Web Crypto API 计算 MD5（如果存在，优先使用）
      // 注意: crypto.subtle.digest('SHA-256') 不是 MD5，只是一个占位符
      // 实际使用 crypto-js 时，应该调用 calculateMD5
      outputText.value = await calculateMD5(inputText.value); // 使用动态导入的 calculateMD5
    } else {
      outputText.value = ''
    }
  } catch (error) {
    console.error('MD5 计算失败:', error);
    outputText.value = '计算失败'; // 提供一个用户友好的错误提示
  }
}

// import CryptoJS from 'crypto-js' // 实际项目中建议使用 crypto-js 等专业库
const calculateMD5 = async (text) => {
  const CryptoJS = await import('crypto-js')
  return CryptoJS.MD5(text).toString()
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    inputText.value = e.target.result
    generateMD5()
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

  const content = `原始文本: ${inputText.value}\nMD5哈希: ${outputText.value}\n生成时间: ${new Date().toLocaleString()}`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'md5-hash.txt'
  a.click()
  URL.revokeObjectURL(url)
}

// 哈希对比
const compareHash = () => {
  const compareValue = prompt('请输入要对比的MD5哈希值:')
  if (compareValue) {
    if (outputText.value.toLowerCase() === compareValue.toLowerCase()) {
      alert('✅ 哈希值匹配！')
    } else {
      alert('❌ 哈希值不匹配！')
    }
  }
}

// 批量处理
const processBatch = () => {
  const lines = batchInput.value.split('\n').filter(line => line.trim())
  const results = []

  lines.forEach(line => {
    if (line.trim()) {
      const hash = simpleMD5(line.trim())
      results.push({
        text: line.trim(),
        hash: hash
      })
    }
  })

  batchResults.value = results
  showBatchProcess.value = false
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
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
addRecentTool('md5-generator')

// SEO配置
useSeoMeta({
  title: 'MD5哈希生成器 - 在线MD5加密工具',
  description: '免费在线MD5哈希生成器，支持文本和文件的MD5计算，用于数据完整性验证和密码加密。',
  keywords: ['MD5', '哈希', '加密', '文件完整性', '密码加密']
})

</script>