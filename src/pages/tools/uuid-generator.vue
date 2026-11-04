<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">UUID生成器</h1>
      <p class="text-muted-foreground max-w-3xl">在线生成唯一标识符UUID/GUID，支持UUID v1、v4、v5版本，批量生成，自定义数量和格式。</p>
    </div>

    <!-- UUID版本选择 -->
    <div class="mb-6">
      <label class="text-lg font-semibold block mb-3">选择UUID版本</label>
      <div class="flex flex-wrap gap-3">
        <label
          v-for="version in uuidVersions"
          :key="version.value"
          class="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
          :class="{ 'bg-primary text-primary-foreground border-primary': selectedVersion === version.value }"
        >
          <input
            type="radio"
            :value="version.value"
            v-model="selectedVersion"
            class="sr-only"
          >
          <span>{{ version.name }}</span>
          <span class="text-xs opacity-75">{{ version.description }}</span>
        </label>
      </div>
    </div>

    <!-- 生成设置 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- 基本设置 -->
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">生成数量</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="generateCount"
              type="range"
              min="1"
              max="100"
              class="flex-1"
            >
            <input
              v-model.number="generateCount"
              type="number"
              min="1"
              max="100"
              class="w-20 px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
          </div>
        </div>

        <div>
          <label class="text-sm font-medium mb-2 block">输出格式</label>
          <select
            v-model="outputFormat"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="uppercase">大写 (DEFAULT-XXXX-...)</option>
            <option value="lowercase">小写 (default-xxxx-...)</option>
            <option value="without-hyphens">无连字符 (DEFAULTXXXX...)</option>
            <option value="brackets">带括号 ({DEFAULT-XXXX-...})</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium mb-2 block">分隔符</label>
          <input
            v-model="separator"
            type="text"
            placeholder="每行一个、逗号、分号等"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">命名空间 (v5)</label>
          <input
            v-model="namespace"
            type="text"
            placeholder="输入命名空间字符串"
            :disabled="selectedVersion !== 'v5'"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
        </div>

        <div>
          <label class="text-sm font-medium mb-2 block">名称 (v5)</label>
          <input
            v-model="name"
            type="text"
            placeholder="输入名称字符串"
            :disabled="selectedVersion !== 'v5'"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
        </div>

        <div class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="includeTimestamp"
            id="includeTimestamp"
            class="rounded border border-border"
          >
          <label for="includeTimestamp" class="text-sm">包含生成时间戳</label>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="generateUUIDs"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        生成UUID
      </button>
      <button
        @click="copyAll"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
      >
        复制全部
      </button>
      <button
        @click="downloadResults"
        class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        下载结果
      </button>
      <button
        @click="clearResults"
        class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        清空
      </button>
    </div>

    <!-- 生成结果 -->
    <div v-if="generatedUUIDs.length > 0" class="border border-border rounded-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">生成结果 ({{ generatedUUIDs.length }} 个)</h3>
        <button
          @click="copyAll"
          class="text-primary hover:text-primary/80 transition-colors"
        >
          复制全部
        </button>
      </div>
      <div class="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <div v-for="(uuid, index) in generatedUUIDs" :key="index" class="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <span class="font-mono text-sm">{{ uuid }}</span>
          <button
            @click="copyToClipboard(uuid)"
            class="text-primary hover:text-primary/80 transition-colors ml-4"
          >
            复制
          </button>
        </div>
      </div>
    </div>

    <!-- UUID版本说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">UUID版本说明</h3>
      <div class="space-y-4">
        <div v-for="version in uuidVersions" :key="version.value" class="border-l-2 border-primary pl-4">
          <h4 class="font-medium mb-2">{{ version.name }}</h4>
          <p class="text-sm text-muted-foreground mb-2">{{ version.description }}</p>
          <p class="text-sm">{{ version.details }}</p>
        </div>
      </div>
    </div>

    <!-- 使用场景 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">常见使用场景</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium text-primary mb-2">数据库主键</h4>
          <p class="text-sm text-muted-foreground">作为数据库记录的唯一标识符，避免ID冲突</p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">分布式系统</h4>
          <p class="text-sm text-muted-foreground">在分布式系统中生成全局唯一标识符</p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">事务ID</h4>
          <p class="text-sm text-muted-foreground">跟踪和标识业务事务，确保可追溯性</p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">文件名</h4>
          <p class="text-sm text-muted-foreground">生成唯一的文件名，避免文件覆盖</p>
        </div>
      </div>
    </div>

    <!-- 技术细节 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">技术细节</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium text-primary mb-2">UUID结构</h4>
          <p class="text-sm text-muted-foreground mb-2">
            UUID由32个十六进制数字组成，通常表示为5组，格式为8-4-4-4-12
          </p>
          <code class="text-xs bg-muted px-2 py-1 rounded">xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">版本信息</h4>
          <p class="text-sm text-muted-foreground">
            第13位数字表示UUID版本（1-5），第14位数字表示变体
          </p>
          <ul class="text-sm mt-2 space-y-1">
            <li>• 版本1: 基于时间戳和MAC地址</li>
            <li>• 版本4: 完全随机生成</li>
            <li>• 版本5: 基于命名空间和名称</li>
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



const category = categories.find(c => c.id === 'crypto')

// UUID版本定义
const uuidVersions = [
  {
    value: 'v4',
    name: 'UUID v4',
    description: '随机生成',
    details: '使用随机或伪随机数生成，是最常用的UUID版本'
  },
  {
    value: 'v1',
    name: 'UUID v1',
    description: '基于时间戳',
    details: '基于时间戳和MAC地址生成，可能暴露生成者信息'
  },
  {
    value: 'v5',
    name: 'UUID v5',
    description: '基于命名空间',
    details: '基于命名空间和名称确定性生成，相同输入总是产生相同输出'
  }
]

// 响应式数据
const selectedVersion = ref('v4')
const generateCount = ref(10)
const outputFormat = ref('uppercase')
const separator = ref('\n')
const namespace = ref('')
const name = ref('')
const includeTimestamp = ref(false)
const generatedUUIDs = ref([])

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'uuid-generator'
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

// 生成UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 格式化UUID
const formatUUID = (uuid) => {
  let formatted = uuid

  // 应用输出格式
  switch (outputFormat.value) {
    case 'lowercase':
      formatted = formatted.toLowerCase()
      break
    case 'without-hyphens':
      formatted = formatted.replace(/-/g, '')
      break
    case 'brackets':
      formatted = `{${formatted}}`
      break
  }

  return formatted
}

// 生成UUIDs
const generateUUIDs = () => {
  const uuids = []

  for (let i = 0; i < generateCount.value; i++) {
    let uuid = generateUUID()

    // 应用格式化
    uuid = formatUUID(uuid)

    uuids.push(uuid)
  }

  generatedUUIDs.value = uuids
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 复制全部
const copyAll = async () => {
  const text = generatedUUIDs.value.join(separator.value)
  await copyToClipboard(text)
}

// 下载结果
const downloadResults = () => {
  if (generatedUUIDs.value.length === 0) return

  let content = generatedUUIDs.value.join(separator.value)

  if (includeTimestamp.value) {
    content = `Generated at: ${new Date().toLocaleString()}\n\n${content}`
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `uuids-${selectedVersion.value}-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 清空结果
const clearResults = () => {
  generatedUUIDs.value = []
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('uuid-generator')

// SEO配置
useSeoMeta({
  title: 'UUID生成器 - 在线UUID/GUID生成工具',
  description: '免费在线UUID生成器，支持UUID v1/v4/v5版本，批量生成，自定义格式，生成唯一标识符。',
  keywords: ['UUID', 'GUID', '生成器', '唯一标识符', 'v1', 'v4', 'v5', '随机ID']
})

</script>