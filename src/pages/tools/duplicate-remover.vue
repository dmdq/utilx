<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">重复数据清理器 - 在线文本与JSON去重工具</h1>
      <p class="text-muted-foreground">一款免费的在线重复数据清理工具。支持文本行去重、JSON数组对象去重，可自定义去重规则，适用于数据清洗、列表整理、CSV去重等场景。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="mb-8">
      <!-- 模式选择 -->
      <div class="flex justify-center mb-6">
        <div class="bg-card border border-border rounded-lg p-1 inline-flex">
          <button
            @click="mode = 'text'"
            :class="[
              'px-6 py-2 rounded-lg transition text-sm',
              mode === 'text'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            ]"
          >
            文本去重
          </button>
          <button
            @click="mode = 'json'"
            :class="[
              'px-6 py-2 rounded-lg transition text-sm',
              mode === 'json'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            ]"
          >
            JSON去重
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧：输入 -->
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-foreground">输入数据</label>
            <div class="flex gap-2">
              <button
                @click="loadSample"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                示例数据
              </button>
              <button
                v-if="inputData"
                @click="clear"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                清空
              </button>
            </div>
          </div>

          <!-- 字段名输入（JSON模式） -->
          <div v-if="mode === 'json'" class="mb-3">
            <label class="text-xs text-muted-foreground mb-1 block">去重字段（可选）</label>
            <input
              v-model="uniqueKey"
              type="text"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="例如: id, name, email"
            />
            <p class="text-xs text-muted-foreground mt-1">留空则基于整个对象去重</p>
          </div>

          <textarea
            v-model="inputData"
            class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
            :placeholder="mode === 'text' ? '输入文本数据，每行一条...' : '输入JSON数组...'"
          ></textarea>

          <!-- 选项设置 -->
          <div class="mt-4 p-4 bg-card border border-border rounded-lg">
            <h3 class="text-sm font-medium text-foreground mb-3">去重选项</h3>
            <div class="space-y-2">
              <label v-if="mode === 'text'" class="flex items-center gap-2">
                <input
                  v-model="caseSensitive"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm text-muted-foreground">区分大小写</span>
              </label>
              <label v-if="mode === 'text'" class="flex items-center gap-2">
                <input
                  v-model="trimWhitespace"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm text-muted-foreground">去除首尾空格</span>
              </label>
              <label v-if="mode === 'text'" class="flex items-center gap-2">
                <input
                  v-model="ignoreEmptyLines"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm text-muted-foreground">忽略空行</span>
              </label>
            </div>

            <!-- 去重按钮 -->
            <button
              @click="process"
              :disabled="!inputData"
              class="w-full mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Filter :size="18" />
              开始去重
            </button>
          </div>
        </div>

        <!-- 右侧：输出 -->
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-foreground">去重结果</label>
            <div class="flex gap-2">
              <button
                v-if="outputData"
                @click="copyResult"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground flex items-center gap-1"
              >
                <Copy :size="14" />
                复制
              </button>
              <button
                v-if="outputData"
                @click="downloadResult"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground flex items-center gap-1"
              >
                <Download :size="14" />
                下载
              </button>
            </div>
          </div>

          <!-- 结果统计 -->
          <div v-if="removeResult.original > 0" class="mb-3 p-4 bg-muted border border-border rounded-lg">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-foreground">{{ removeResult.original }}</div>
                <div class="text-xs text-muted-foreground">原始数据</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-destructive">{{ removeResult.removed }}</div>
                <div class="text-xs text-muted-foreground">已删除</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-primary">{{ removeResult.remaining }}</div>
                <div class="text-xs text-muted-foreground">剩余数据</div>
              </div>
            </div>
          </div>

          <textarea
            v-model="outputData"
            readonly
            class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg font-mono text-sm resize-none"
            placeholder="去重结果将显示在这里..."
          ></textarea>
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
          什么是重复数据清理？
        </h2>
        <p class="text-muted-foreground mb-4">
          重复数据是指在数据集中出现多次的相同或相似记录。在数据处理和分析过程中，重复数据会影响结果的准确性，
          导致统计偏差、资源浪费和决策失误。因此，数据去重是数据清洗的重要步骤之一。
        </p>
        <p class="text-muted-foreground">
          本工具提供了简单高效的在线去重功能，支持文本行去重和JSON数组对象去重两种模式。
          文本模式适用于列表、URL、邮箱等每行一条数据的去重；JSON模式适用于结构化数据的去重，
          可以基于指定字段或整个对象进行去重。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择去重模式：文本去重或JSON去重</li>
          <li>将您的数据粘贴到输入框中</li>
          <li>根据需要配置去重选项（如区分大小写、去除空格等）</li>
          <li>点击"开始去重"按钮查看结果</li>
          <li>复制或下载去重后的数据</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          文本去重模式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>每行一条数据</strong>: 工具将每一行视为一个独立的数据项进行去重</li>
          <li><strong>大小写敏感</strong>: 可选择是否区分大小写，默认不区分（Apple和apple视为相同）</li>
          <li><strong>空格处理</strong>: 可选去除每行首尾空格，避免因空格导致的重复</li>
          <li><strong>空行过滤</strong>: 可选择忽略空行，使结果更干净</li>
          <li><strong>应用场景</strong>: 适用于URL列表、邮箱列表、关键词列表、文件名列表等去重</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          JSON去重模式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>数组去重</strong>: 支持JSON数组格式的数据去重</li>
          <li><strong>字段去重</strong>: 可以指定某个字段作为唯一标识（如id、name等）</li>
          <li><strong>整体去重</strong>: 不指定字段时，基于整个对象的内容进行去重</li>
          <li><strong>保持原格式</strong>: 去重后保持JSON的格式化和缩进</li>
          <li><strong>应用场景</strong>: 适用于数据清洗、数据库导入前的去重、API数据处理等</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线去重工具安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的重复数据清理工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您可以放心处理敏感数据，包括个人邮箱、电话号码、用户ID等信息。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">去重后数据的顺序会改变吗？</h3>
            <p class="text-muted-foreground mt-1">
              工具会保留数据首次出现的顺序。例如，如果数据是 A、B、A、C、B，去重后结果为 A、B、C，
              按照它们在原始数据中第一次出现的顺序排列。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何对CSV文件进行去重？</h3>
            <p class="text-muted-foreground mt-1">
              对于简单的CSV文件，可以直接使用文本去重模式。对于包含标题行的CSV，建议先手动移除标题行，
              去重后再添加回去。对于复杂的CSV数据处理，建议使用专业的数据处理工具。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持多少数据的去重？</h3>
            <p class="text-muted-foreground mt-1">
              由于所有处理都在浏览器本地完成，理论上没有数据量限制。但实际上受限于浏览器内存和性能，
              建议单次处理不超过10万行数据或10MB大小的JSON文件。对于更大的数据集，建议分段处理。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">JSON去重时如何选择唯一字段？</h3>
            <p class="text-muted-foreground mt-1">
              选择能够唯一标识每个对象的字段。例如，用户数据可以选择"id"或"email"字段，
              产品数据可以选择"productId"或"sku"字段。如果选择错误的字段，可能会导致误删数据。
              不确定时，建议不指定字段，使用整体对象去重。
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
import { ref, computed } from 'vue'
import { Filter, Trash2, Copy, Download, ChevronUp, HelpCircle, FileText, Code, Type, Link, Hash, Regex, FileDiff, Database, Globe } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '重复数据清理器 - 在线文本与JSON去重工具 | Util工具箱',
  description: '免费在线重复数据清理工具，支持文本行去重、JSON数组对象去重，可自定义去重规则，适用于数据清洗、列表整理、CSV去重等场景。纯本地计算，数据安全隐私。',
  keywords: '去重,重复数据,数据清洗,文本去重,CSV去重,列表去重,数组去重,在线去重工具,JSON去重',
  author: 'Util工具箱',
  ogTitle: '重复数据清理器 - 免费在线去重工具',
  ogDescription: '专业的在线去重工具，支持文本和JSON数据去重。纯前端处理，数据安全可靠，支持自定义去重规则。',
  ogImage: 'https://www.util.cn/images/tools/duplicate-remover.png',
  ogUrl: 'https://www.util.cn/tools/duplicate-remover',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '重复数据清理器 - 免费在线去重工具',
  twitterDescription: '专业的在线去重工具，支持文本和JSON数据去重。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/duplicate-remover.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '重复数据清理器',
            description: '免费在线重复数据清理工具，支持文本和JSON去重',
            url: 'https://www.util.cn/tools/duplicate-remover',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '文本行去重',
              'JSON数组去重',
              '自定义去重规则',
              '大小写敏感选项',
              '本地安全处理',
              '一键复制下载'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '重复数据清理器',
                item: 'https://www.util.cn/tools/duplicate-remover'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '在线去重工具安全吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '绝对安全。我们的重复数据清理工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，数据不会上传到任何服务器。'
                }
              },
              {
                '@type': 'Question',
                name: '去重后数据的顺序会改变吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '工具会保留数据首次出现的顺序。如果数据是 A、B、A、C、B，去重后结果为 A、B、C，按照它们在原始数据中第一次出现的顺序排列。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// 数据状态
const mode = ref('text')
const inputData = ref('')
const outputData = ref('')
const caseSensitive = ref(false)
const trimWhitespace = ref(true)
const ignoreEmptyLines = ref(true)
const uniqueKey = ref('')
const removeResult = ref({ original: 0, removed: 0, remaining: 0 })

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Filter, Trash2, Copy, Download,
  FileText, Code, Type, Link, Hash,
  Regex, FileDiff, Database, Globe
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'others' && t.id !== 'duplicate-remover'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'text-diff'),
    tools.find(t => t.id === 'csv-to-json'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'text-counter')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 处理文本去重
const processText = () => {
  if (!inputData.value) {
    return
  }

  let lines = inputData.value.split('\n')
  removeResult.value.original = lines.length

  // 预处理
  if (trimWhitespace.value) {
    lines = lines.map(line => line.trim())
  }

  // 过滤空行
  if (ignoreEmptyLines.value) {
    lines = lines.filter(line => line !== '')
  }

  // 去重
  const seen = new Set()
  const unique = []

  for (const line of lines) {
    const key = caseSensitive.value ? line : line.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(line)
    }
  }

  removeResult.value.remaining = unique.length
  removeResult.value.removed = removeResult.value.original - unique.length

  outputData.value = unique.join('\n')
}

// 处理JSON去重
const processJSON = () => {
  if (!inputData.value) {
    return
  }

  try {
    const data = JSON.parse(inputData.value)
    const isArray = Array.isArray(data)

    if (!isArray) {
      alert('输入必须是JSON数组')
      return
    }

    removeResult.value.original = data.length

    if (!uniqueKey.value) {
      // 简单去重（基于JSON字符串）
      const seen = new Set()
      const unique = []

      for (const item of data) {
        const key = JSON.stringify(item)
        if (!seen.has(key)) {
          seen.add(key)
          unique.push(item)
        }
      }

      removeResult.value.remaining = unique.length
      removeResult.value.removed = data.length - unique.length
      outputData.value = JSON.stringify(unique, null, 2)
    } else {
      // 基于指定字段去重
      const seen = new Set()
      const unique = []

      for (const item of data) {
        const key = item[uniqueKey.value]
        if (key === undefined) {
          alert(`对象缺少字段: ${uniqueKey.value}`)
          return
        }
        if (!seen.has(key)) {
          seen.add(key)
          unique.push(item)
        }
      }

      removeResult.value.remaining = unique.length
      removeResult.value.removed = data.length - unique.length
      outputData.value = JSON.stringify(unique, null, 2)
    }
  } catch (error) {
    alert('JSON解析错误: ' + error.message)
  }
}

// 执行去重
const process = () => {
  if (mode.value === 'text') {
    processText()
  } else {
    processJSON()
  }
}

// 复制结果
const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(outputData.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载结果
const downloadResult = () => {
  const blob = new Blob([outputData.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'deduplicated.' + (mode.value === 'json' ? 'json' : 'txt')
  link.click()
  URL.revokeObjectURL(url)
}

// 清空
const clear = () => {
  inputData.value = ''
  outputData.value = ''
  removeResult.value = { original: 0, removed: 0, remaining: 0 }
}

// 加载示例
const loadSample = () => {
  if (mode.value === 'text') {
    inputData.value = `apple
banana
Apple
orange
banana
grape
ORANGE
apple
mango
grape`
  } else {
    inputData.value = JSON.stringify([
      { id: 1, name: 'Alice', age: 25 },
      { id: 2, name: 'Bob', age: 30 },
      { id: 1, name: 'Alice', age: 25 },
      { id: 3, name: 'Charlie', age: 35 },
      { id: 2, name: 'Bob', age: 30 }
    ], null, 2)
    uniqueKey.value = 'id'
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
