<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">文本转表格工具 - CSV/TSV转表格Markdown</h1>
      <p class="text-muted-foreground">专业的在线文本转表格工具，将逗号、制表符等分隔的文本转换为HTML表格或Markdown表格格式。支持自定义分隔符和多种输出格式。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">文本输入</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteText"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadSample"
            >
              示例
            </button>
          </div>
        </div>
        <textarea
          v-model="inputText"
          class="w-full h-80 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入文本，每行一条记录，字段用分隔符分开..."
          @input="convert"
        ></textarea>
      </div>

      <!-- 表格预览 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">表格预览</label>
        </div>
        <div class="overflow-auto max-h-80 border border-border rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-muted sticky top-0">
              <tr>
                <th v-for="(header, i) in headers" :key="i" class="px-4 py-2 text-left border-b border-border text-foreground">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in rows" :key="ri" class="border-b border-border">
                <td v-for="(cell, ci) in row" :key="ci" class="px-4 py-2 text-muted-foreground">
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 输出格式区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">输出格式</h2>
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="format in formats"
          :key="format.id"
          @click="outputFormat = format.id; updateOutput()"
          :class="['px-4 py-2 rounded transition-colors', outputFormat === format.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
        >
          {{ format.name }}
        </button>
      </div>
      <textarea
        v-model="outputText"
        class="w-full h-48 px-4 py-3 bg-muted border border-border rounded-lg resize-none font-mono text-sm"
        readonly
      ></textarea>
      <div class="mt-4 flex gap-2">
        <button @click="copyResult" class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground">复制</button>
      </div>
    </div>

    <!-- 设置区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">设置</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">分隔符</label>
          <div class="flex gap-2 flex-wrap mb-2">
            <button
              v-for="delim in delimiters"
              :key="delim.char"
              @click="delimiter = delim.char; convert()"
              :class="['px-3 py-1 text-sm rounded transition-colors', delimiter === delim.char ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >
              {{ delim.name }}
            </button>
          </div>
          <div>
            <input
              v-model="customDelimiter"
              type="text"
              class="w-24 px-2 py-1 bg-muted border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="自定义"
              @input="delimiter = customDelimiter; convert()"
            >
          </div>
        </div>

        <div>
          <label class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <input type="checkbox" v-model="options.hasHeader" @change="convert" class="rounded">
            <span>第一行是表头</span>
          </label>
          <label class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <input type="checkbox" v-model="options.trimWhitespace" @change="convert" class="rounded">
            <span>去除字段空白</span>
          </label>
          <label class="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" v-model="options.skipEmpty" @change="convert" class="rounded">
            <span>跳过空行</span>
          </label>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12 relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是文本转表格？
        </h2>
        <p class="text-muted-foreground mb-4">
          文本转表格工具可以将分隔符分隔的文本数据转换为结构化的表格格式。支持从CSV、TSV等格式
          转换为HTML表格、Markdown表格或JSON数组，方便在各种场景下使用。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中粘贴或输入分隔符分隔的文本数据</li>
          <li>选择合适的分隔符（逗号、制表符、分号等）</li>
          <li>配置选项：是否包含表头、是否去除空白、是否跳过空行</li>
          <li>选择输出格式（Markdown、HTML、CSV、JSON）并复制结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的格式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Markdown表格</strong>: 适用于Markdown文档和GitHub README</li>
          <li><strong>HTML表格</strong>: 可直接嵌入网页，支持自定义样式</li>
          <li><strong>CSV格式</strong>: 通用的数据交换格式，Excel可直接打开</li>
          <li><strong>JSON数组</strong>: 适用于Web开发和API数据交换</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理包含逗号的CSV字段？</h3>
            <p class="text-muted-foreground mt-1">
              标准CSV格式使用双引号包裹包含分隔符的字段。本工具目前支持简单的分隔符分割，
              对于复杂的CSV格式（包含引号、转义字符等），建议先使用专业CSV编辑器处理。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是TSV格式？</h3>
            <p class="text-muted-foreground mt-1">
              TSV（Tab-Separated Values）使用制表符（Tab）作为字段分隔符，是CSV的一种变体。
              TSV格式在处理包含逗号的文本数据时更加方便，常用于数据库导出和数据交换。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何将Excel数据转换为表格？</h3>
            <p class="text-muted-foreground mt-1">
              在Excel中选择数据并复制，然后粘贴到本工具的输入框中。Excel复制的数据通常使用制表符分隔，
              选择"制表符 (Tab)"作为分隔符即可正确解析。
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
import { HelpCircle, ChevronUp, Table, FileSpreadsheet, FileJson, FileText, Type, Code } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '文本转表格工具 - CSV/TSV转表格Markdown | Util工具箱',
  description: '免费在线文本转表格工具，将逗号、制表符等分隔的文本转换为HTML表格或Markdown表格格式。支持自定义分隔符和多种输出格式。',
  keywords: '文本转表格,csv转表格,tsv转表格,markdown表格,表格生成器,excel转表格,文本数据转换',
  author: 'Util工具箱',
  ogTitle: '文本转表格工具 - CSV/TSV转Markdown表格',
  ogDescription: '将分隔符分隔的文本转换为HTML表格、Markdown表格、CSV或JSON格式。支持自定义分隔符。',
  ogImage: 'https://www.util.cn/images/tools/text-to-table.png',
  ogUrl: 'https://www.util.cn/tools/text-to-table',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '文本转表格工具 - CSV/TSV转Markdown表格',
  twitterDescription: '将分隔符分隔的文本转换为HTML表格、Markdown表格、CSV或JSON格式。',
  twitterImage: 'https://www.util.cn/images/tools/text-to-table.png'
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
            name: '文本转表格工具',
            description: '在线文本转表格工具，将分隔符分隔的文本转换为多种表格格式',
            url: 'https://www.util.cn/tools/text-to-table',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '支持多种分隔符',
              '转换为Markdown表格',
              '转换为HTML表格',
              '转换为CSV格式',
              '转换为JSON数组',
              '实时预览表格'
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
                name: '文本转表格',
                item: 'https://www.util.cn/tools/text-to-table'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何处理包含逗号的CSV字段？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '标准CSV格式使用双引号包裹包含分隔符的字段。对于复杂的CSV格式，建议先使用专业CSV编辑器处理。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是TSV格式？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'TSV（Tab-Separated Values）使用制表符作为字段分隔符，是CSV的一种变体。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const inputText = ref('')
const outputText = ref('')
const outputFormat = ref('markdown')
const delimiter = ref(',')
const customDelimiter = ref('')

const options = ref({
  hasHeader: true,
  trimWhitespace: true,
  skipEmpty: true
})

const delimiters = [
  { char: ',', name: '逗号 (,)' },
  { char: '\t', name: '制表符 (Tab)' },
  { char: ';', name: '分号 (;)' },
  { char: '|', name: '竖线 (|)' },
  { char: ' ', name: '空格' }
]

const formats = [
  { id: 'markdown', name: 'Markdown表格' },
  { id: 'html', name: 'HTML表格' },
  { id: 'csv', name: 'CSV' },
  { id: 'json', name: 'JSON数组' }
]

const headers = ref([])
const rows = ref([])

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Table, FileSpreadsheet, FileJson, FileText, Type, Code
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'text' && t.id !== 'text-to-table'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'csv-parser'),
    tools.find(t => t.id === 'json-to-csv'),
    tools.find(t => t.id === 'excel-to-html'),
    tools.find(t => t.id === 'markdown-editor')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

function convert() {
  const text = inputText.value
  const lines = text.split('\n').filter(line => {
    if (!options.value.skipEmpty) return true
    return line.trim() !== ''
  })

  if (lines.length === 0) {
    headers.value = []
    rows.value = []
    updateOutput()
    return
  }

  // 解析每一行
  const parsed = lines.map(line => {
    const parts = line.split(delimiter.value)
    return options.value.trimWhitespace ? parts.map(p => p.trim()) : parts
  })

  // 分离表头和数据
  if (options.value.hasHeader && parsed.length > 0) {
    headers.value = parsed[0]
    rows.value = parsed.slice(1)
  } else {
    if (parsed.length > 0) {
      headers.value = parsed[0].map((_, i) => `列${i + 1}`)
      rows.value = parsed
    } else {
      headers.value = []
      rows.value = []
    }
  }

  updateOutput()
}

function updateOutput() {
  if (headers.value.length === 0) {
    outputText.value = ''
    return
  }

  switch (outputFormat.value) {
    case 'markdown':
      outputText.value = toMarkdown()
      break
    case 'html':
      outputText.value = toHTML()
      break
    case 'csv':
      outputText.value = toCSV()
      break
    case 'json':
      outputText.value = toJSON()
      break
  }
}

function toMarkdown() {
  let result = '| ' + headers.value.join(' | ') + ' |\n'
  result += '| ' + headers.value.map(() => '---').join(' | ') + ' |\n'

  for (const row of rows.value) {
    result += '| ' + row.join(' | ') + ' |\n'
  }

  return result.trim()
}

function toHTML() {
  let result = '<table>\n'
  result += '  <thead>\n    <tr>\n'
  for (const h of headers.value) {
    result += `      <th>${h}</th>\n`
  }
  result += '    </tr>\n  </thead>\n'
  result += '  <tbody>\n'

  for (const row of rows.value) {
    result += '    <tr>\n'
    for (const cell of row) {
      result += `      <td>${cell}</td>\n`
    }
    result += '    </tr>\n'
  }

  result += '  </tbody>\n</table>'
  return result
}

function toCSV() {
  let result = headers.value.join(',') + '\n'
  for (const row of rows.value) {
    result += row.join(',') + '\n'
  }
  return result.trim()
}

function toJSON() {
  const data = rows.value.map(row => {
    const obj = {}
    headers.value.forEach((h, i) => {
      obj[h] = row[i] || ''
    })
    return obj
  })
  return JSON.stringify(data, null, 2)
}

async function pasteText() {
  try {
    inputText.value = await navigator.clipboard.readText()
    convert()
  } catch {}
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
  } catch {}
}

function clearInput() {
  inputText.value = ''
  convert()
}

function loadSample() {
  inputText.value = `姓名,年龄,城市,职业
张三,25,北京,工程师
李四,30,上海,设计师
王五,28,深圳,产品经理`
  convert()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
addRecentTool('text-to-table')

// 初始化示例
loadSample()
</script>
