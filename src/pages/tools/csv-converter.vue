<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Table class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">CSV格式转换器</h1>
          <p class="text-sm text-muted-foreground mt-1">CSV/TSV 一键转换为 JSON、Markdown、HTML、YAML，纯本地解析</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴或上传 CSV、TSV 数据，自动识别分隔符与表头，转换为 JSON、Markdown 表格、HTML 表格或 YAML 格式。解析与转换全部在浏览器本地完成，数据不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与配置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 输入数据
          </h2>

          <!-- 上传区 -->
          <div
            class="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 mb-4"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload v-if="!inputFileName" class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
            <FileCheck v-else class="w-6 h-6 mx-auto mb-1.5 text-primary" />
            <p v-if="!inputFileName" class="text-xs text-muted-foreground">点击选择或拖入 .csv / .tsv 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ inputFileName }}</p>
          </div>

          <textarea
            v-model="inputText"
            class="w-full h-48 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 CSV 数据，例如：&#10;name,age,city&#10;张三,28,北京&#10;李四,32,上海"
            spellcheck="false"
            @input="convert"
          ></textarea>

          <!-- 配置 -->
          <div class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">分隔符</label>
              <div class="grid grid-cols-5 gap-1.5">
                <button
                  v-for="opt in delimiterOptions"
                  :key="opt.value"
                  @click="delimiter = opt.value; convert()"
                  :class="delimiter === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                  :title="opt.label"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">首行为表头</span>
              <button
                type="button"
                @click="hasHeader = !hasHeader; convert()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="hasHeader ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="hasHeader ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">目标格式</label>
              <div class="grid grid-cols-4 gap-1.5">
                <button
                  v-for="fmt in formatOptions"
                  :key="fmt.value"
                  @click="outputFormat = fmt.value; convert()"
                  :class="outputFormat === fmt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  {{ fmt.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 解析信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <BarChart3 class="w-4 h-4 mr-2 text-primary" /> 解析结果
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ parsedRows.length }}</p>
              <p class="text-xs text-muted-foreground">数据行</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ columnCount }}</p>
              <p class="text-xs text-muted-foreground">列数</p>
            </div>
          </div>
          <button
            @click="clearAll"
            class="w-full mt-4 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> 清空
          </button>
        </div>
      </div>

      <!-- 右侧：输出区 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileOutput class="w-5 h-5 mr-2 text-primary" />
              {{ currentFormatLabel }} 输出
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyOutput"
                :disabled="!outputText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadOutput"
                :disabled="!outputText"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>
          <div class="p-6">
            <textarea
              v-if="outputText"
              :value="outputText"
              readonly
              class="w-full h-96 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else-if="parseError" class="py-16 text-center">
              <FileWarning class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">解析失败</p>
              <p class="text-xs text-muted-foreground">{{ parseError }}</p>
            </div>
            <div v-else class="py-16 text-center">
              <Table class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入 CSV 数据后，这里会显示转换结果</p>
            </div>
          </div>
        </div>

        <!-- 格式说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 转换说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">JSON</span>：默认输出对象数组，关闭表头后输出二维数组</li>
            <li>• <span class="text-foreground">Markdown</span>：生成带表头分隔线的 Markdown 表格，可直接粘贴到文档</li>
            <li>• <span class="text-foreground">HTML</span>：生成 table 结构，内容已做 HTML 转义</li>
            <li>• <span class="text-foreground">YAML</span>：输出对象数组列表，便于配置文件使用</li>
            <li>• 完整支持带引号字段、转义引号（""）、字段内换行的标准 CSV</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于CSV格式转换器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            CSV（Comma-Separated Values）是最通用的表格数据交换格式，但在实际使用中经常需要把它转换成其他格式：给程序读取用 JSON、写进技术文档用 Markdown 表格、嵌入网页用 HTML、编写配置用 YAML。本工具把这几种高频转换整合在一起，一次粘贴，多格式可用。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>从 Excel / WPS 导出 CSV 后转成 JSON，供前端 Mock 或后端导入使用</li>
            <li>把数据表转成 Markdown 表格，插入 README、技术方案或博客文章</li>
            <li>生成 HTML 表格快速嵌入邮件、网页或管理后台</li>
            <li>转成 YAML 用于自动化脚本、CI 配置或容器编排文件</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些分隔符？</span>支持逗号、分号、制表符、竖线和空格，默认自动识别，也可手动指定。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会。所有解析与转换都在浏览器本地完成。</li>
            <li><span class="text-foreground font-medium">大文件能处理吗？</span>建议在 10MB 以内，浏览器解析非常快，超大文件可能导致页面卡顿。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'csv-converter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Table, FileUp, FileCheck, FileOutput, FileWarning, Upload, Download,
  Copy, Trash2, Info, BarChart3, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'CSV格式转换器 - CSV转JSON/Markdown/HTML/YAML工具',
  description: '在线CSV转换工具，支持CSV转JSON、CSV转Markdown表格、CSV转HTML、CSV转YAML，自动识别分隔符与表头，纯本地处理不上传数据',
  keywords: 'csv转json, csv转换, csv转markdown, csv转yaml, csv转html, tsv转换, 表格转换',
  author: 'Util工具箱',
  ogTitle: 'CSV格式转换器 - 有条工具',
  ogDescription: 'CSV/TSV一键转换为JSON、Markdown、HTML、YAML，纯本地解析',
  ogUrl: 'https://www.util.cn/tools/csv-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'CSV格式转换器',
          url: 'https://www.util.cn/tools/csv-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['CSV转JSON', 'CSV转Markdown', 'CSV转HTML', 'CSV转YAML', '分隔符自动识别']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'CSV格式转换器', item: 'https://www.util.cn/tools/csv-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'CSV转换器支持哪些输出格式？',
              acceptedAnswer: { '@type': 'Answer', text: '支持转换为JSON对象数组、Markdown表格、HTML表格和YAML列表四种格式。' }
            },
            {
              '@type': 'Question',
              name: 'CSV转换会上传数据到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，所有解析与转换都在浏览器本地完成，数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'csv-converter')
if (tool) addRecentTool(tool.id)

// ---------- 状态 ----------
const inputText = ref('')
const inputFileName = ref('')
const delimiter = ref('auto')
const hasHeader = ref(true)
const outputFormat = ref('json')
const isDragging = ref(false)
const parseError = ref('')
const seoContentVisible = ref(true)
const fileInput = ref(null)

const delimiterOptions = [
  { value: 'auto', label: '自动', text: '自动识别分隔符' },
  { value: ',', label: '逗号', text: '逗号分隔' },
  { value: '\t', label: 'Tab', text: '制表符分隔' },
  { value: ';', label: '分号', text: '分号分隔' },
  { value: '|', label: '竖线', text: '竖线分隔' }
]

const formatOptions = [
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'MD' },
  { value: 'html', label: 'HTML' },
  { value: 'yaml', label: 'YAML' }
]

const currentFormatLabel = computed(() => {
  return formatOptions.find(f => f.value === outputFormat.value)?.label || ''
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- CSV 解析（支持引号、转义引号、字段内换行） ----------
const parseCsv = (text, delim) => {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }

    if (ch === '"' && field === '') {
      inQuotes = true
      i++
      continue
    }
    if (ch === delim) {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (ch === '\r') {
      i++
      continue
    }
    if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += ch
    i++
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''))
}

const detectDelimiter = (text) => {
  const sample = text.split('\n').slice(0, 5).join('\n')
  const candidates = [',', '\t', ';', '|']
  let best = ','
  let bestCount = 0
  for (const d of candidates) {
    const count = sample.split(d).length - 1
    if (count > bestCount) {
      bestCount = count
      best = d
    }
  }
  return best
}

// ---------- 转换 ----------
const parsedRows = ref([])
const parsedHeaders = ref([])

const columnCount = computed(() => {
  return parsedHeaders.value.length || parsedRows.value[0]?.length || 0
})

const convert = () => {
  parseError.value = ''
  parsedRows.value = []
  parsedHeaders.value = []
  const text = inputText.value
  if (!text.trim()) return

  try {
    const delim = delimiter.value === 'auto' ? detectDelimiter(text) : delimiter.value
    const rows = parseCsv(text, delim)
    if (rows.length === 0) return

    if (hasHeader.value) {
      parsedHeaders.value = rows[0].map((h, idx) => h.trim() || `column_${idx + 1}`)
      parsedRows.value = rows.slice(1)
    } else {
      const width = Math.max(...rows.map(r => r.length))
      parsedHeaders.value = Array.from({ length: width }, (_, idx) => `column_${idx + 1}`)
      parsedRows.value = rows
    }
  } catch (err) {
    parseError.value = 'CSV 解析出现问题，请检查数据格式与分隔符设置。'
  }
}

const toObjects = () => {
  return parsedRows.value.map(row => {
    const obj = {}
    parsedHeaders.value.forEach((key, idx) => {
      obj[key] = row[idx] ?? ''
    })
    return obj
  })
}

const escapeHtml = (s) => {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const toMarkdown = () => {
  const headers = parsedHeaders.value
  const lines = []
  lines.push('| ' + headers.join(' | ') + ' |')
  lines.push('| ' + headers.map(() => '---').join(' | ') + ' |')
  for (const row of parsedRows.value) {
    lines.push('| ' + headers.map((_, idx) => (row[idx] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ') + ' |')
  }
  return lines.join('\n')
}

const toHtml = () => {
  const headers = parsedHeaders.value
  const lines = ['<table>', '  <thead>', '    <tr>']
  for (const h of headers) {
    lines.push('      <th>' + escapeHtml(h) + '</th>')
  }
  lines.push('    </tr>', '  </thead>', '  <tbody>')
  for (const row of parsedRows.value) {
    lines.push('    <tr>')
    for (const h of headers) {
      lines.push('      <td>' + escapeHtml(row[parsedHeaders.value.indexOf(h)] ?? '') + '</td>')
    }
    lines.push('    </tr>')
  }
  lines.push('  </tbody>', '</table>')
  return lines.join('\n')
}

const quoteYaml = (s) => {
  if (s === '') return '""'
  if (/^[\w.\-/]+$/.test(s)) return s
  return JSON.stringify(s)
}

const toYaml = () => {
  const objects = toObjects()
  const lines = []
  for (const obj of objects) {
    lines.push('-')
    for (const [key, value] of Object.entries(obj)) {
      lines.push(`  ${/^[A-Za-z0-9_.-]+$/.test(key) ? key : JSON.stringify(key)}: ${quoteYaml(value)}`)
    }
  }
  return lines.join('\n')
}

const outputText = computed(() => {
  if (parsedRows.value.length === 0) return ''
  try {
    switch (outputFormat.value) {
      case 'json':
        return hasHeader.value ? JSON.stringify(toObjects(), null, 2) : JSON.stringify(parsedRows.value, null, 2)
      case 'markdown':
        return toMarkdown()
      case 'html':
        return toHtml()
      case 'yaml':
        return toYaml()
      default:
        return ''
    }
  } catch (err) {
    return ''
  }
})

// ---------- 交互 ----------
const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = async (e) => {
  const selected = e.target.files?.[0]
  if (selected) {
    inputFileName.value = selected.name
    inputText.value = await selected.text()
    convert()
  }
  e.target.value = ''
}

const handleDrop = async (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) {
    inputFileName.value = dropped.name
    inputText.value = await dropped.text()
    convert()
  }
}

const clearAll = () => {
  inputText.value = ''
  inputFileName.value = ''
  parsedRows.value = []
  parsedHeaders.value = []
  parseError.value = ''
}

const downloadExtension = computed(() => {
  return { json: 'json', markdown: 'md', html: 'html', yaml: 'yml' }[outputFormat.value] || 'txt'
})

const downloadOutput = () => {
  if (!outputText.value) return
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const base = (inputFileName.value || 'converted').replace(/\.[^.]+$/, '')
  a.href = url
  a.download = `${base}.${downloadExtension.value}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
