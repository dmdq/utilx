<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Braces class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">JSONL/NDJSON转换器</h1>
          <p class="text-sm text-muted-foreground mt-1">JSONL 与 JSON/CSV 互转，逐行校验定位坏行，纯本地解析</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴或上传 JSONL/NDJSON 数据（每行一个 JSON），自动逐行校验并标注错误行号，转换为格式化 JSON 数组、CSV 或表格预览；也支持把 JSON 数组压缩回 JSONL。全部解析在浏览器本地完成，数据不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与配置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Braces class="w-5 h-5 mr-2 text-primary" /> 输入数据
          </h2>

          <!-- 转换方向 -->
          <div class="grid grid-cols-2 gap-1.5 mb-4">
            <button
              v-for="d in directionOptions"
              :key="d.value"
              @click="mode = d.value"
              :class="mode === d.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ d.label }}
            </button>
          </div>

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
              accept=".jsonl,.ndjson,.json,.txt,application/json,text/plain"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload v-if="!inputFileName" class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
            <FileCheck v-else class="w-6 h-6 mx-auto mb-1.5 text-primary" />
            <p v-if="!inputFileName" class="text-xs text-muted-foreground">点击选择或拖入 .jsonl / .ndjson / .json 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ inputFileName }}</p>
          </div>

          <textarea
            v-model="inputText"
            class="w-full h-52 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            :placeholder="inputPlaceholder"
            spellcheck="false"
          ></textarea>

          <!-- 输出格式（仅 JSONL 方向） -->
          <div v-if="mode === 'jsonl2other'" class="mt-4">
            <label class="block text-sm font-medium text-foreground mb-2">输出格式</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="fmt in formatOptions"
                :key="fmt.value"
                @click="outputFormat = fmt.value"
                :class="outputFormat === fmt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-1.5 rounded text-xs font-medium transition-all"
              >
                {{ fmt.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 解析结果 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 解析结果
          </h3>
          <div class="grid gap-3" :class="stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'">
            <div v-for="s in stats" :key="s.label" class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ s.value }}</p>
              <p class="text-xs text-muted-foreground">{{ s.label }}</p>
            </div>
          </div>

          <!-- 无效行列表 -->
          <div v-if="invalidLines.length" class="mt-4">
            <p class="text-xs font-medium text-destructive mb-2 flex items-center">
              <FileWarning class="w-3.5 h-3.5 mr-1" /> {{ invalidLines.length }} 行解析失败
            </p>
            <ul class="space-y-1.5 max-h-40 overflow-auto">
              <li v-for="bad in invalidLines" :key="bad.line" class="text-xs bg-muted/50 rounded p-2">
                <span class="font-medium text-destructive">第 {{ bad.line }} 行</span>
                <span class="text-muted-foreground">：{{ bad.reason }}</span>
                <p class="font-mono text-muted-foreground/70 mt-0.5 truncate">{{ bad.content }}</p>
              </li>
            </ul>
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
              <FileText class="w-5 h-5 mr-2 text-primary" />
              {{ outputTitle }}
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
            <!-- 表格预览 -->
            <div v-if="showTable && tableRows.length" class="overflow-auto max-h-96 border border-border rounded-lg">
              <table class="w-full text-xs">
                <thead class="bg-muted sticky top-0">
                  <tr>
                    <th
                      v-for="h in tableHeaders"
                      :key="h"
                      class="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap border-b border-border"
                    >{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in tableRows" :key="ri" class="border-b border-border last:border-0">
                    <td
                      v-for="h in tableHeaders"
                      :key="h"
                      class="px-3 py-2 text-muted-foreground font-mono whitespace-nowrap max-w-[240px] truncate"
                    >{{ formatCell(row[h]) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else-if="showTable" class="py-16 text-center text-sm text-muted-foreground">
              没有可预览的对象行，请确认输入是 JSONL
            </p>

            <textarea
              v-else-if="outputText"
              :value="outputText"
              readonly
              class="w-full h-96 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>

            <div v-else-if="arrayParse.error && !arrayParse.empty" class="py-16 text-center">
              <FileWarning class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">解析失败</p>
              <p class="text-xs text-muted-foreground">{{ arrayParse.error }}</p>
            </div>

            <div v-else class="py-16 text-center">
              <Braces class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">{{ emptyHint }}</p>
            </div>

            <p v-if="showTable && nonObjectCount > 0" class="text-xs text-muted-foreground mt-3">
              另有 {{ nonObjectCount }} 条非对象记录未在表格中显示（如数字、字符串行）
            </p>
          </div>
        </div>

        <!-- 转换说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 转换说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">JSONL/NDJSON</span>：每行一个独立 JSON 值（通常是对象），常见于日志与流式数据</li>
            <li>• <span class="text-foreground">转 JSON</span>：合并为标准 JSON 数组并格式化缩进，可直接保存为 .json 文件</li>
            <li>• <span class="text-foreground">转 CSV</span>：自动收集所有行出现过的键作为表头，嵌套结构序列化为 JSON 字符串</li>
            <li>• <span class="text-foreground">JSON → JSONL</span>：把 JSON 数组的每个元素压缩为一行输出</li>
            <li>• 解析失败的行会在左侧标注行号与原因，其余行正常转换，不会因个别坏行中断</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于JSONL/NDJSON转换器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            JSONL（JSON Lines，也叫 NDJSON）是每行一个独立 JSON 值的文本格式，广泛用于日志采集、大模型流式输出、数据管道与批量导入等场景。它便于逐行读写和追加，但不方便人工查看与表格化分析。本工具在两种形态之间自由转换：把 JSONL 合并成标准 JSON 数组或 CSV，也可以把 JSON 数组压缩回 JSONL。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>把服务日志的 JSONL 转成 CSV，在 Excel 里筛选分析</li>
            <li>整理大模型流式接口返回的 NDJSON 数据为可读 JSON</li>
            <li>逐行校验定位坏行，清洗脏数据</li>
            <li>为只接受 JSONL 的系统（如 Elasticsearch 批量导入）准备数据</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">什么是 JSONL/NDJSON？</span>每行一个独立 JSON 值的文本格式，行与行之间没有逗号，整个文件本身不是合法的 JSON 文档。</li>
            <li><span class="text-foreground font-medium">个别坏行会中断转换吗？</span>不会。工具逐行解析，错误的行会标注行号与原因，其余行正常转换。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会。所有解析与转换都在浏览器本地完成，数据不出设备。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'jsonl-converter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Braces, FileText, Upload, FileCheck, FileWarning, Copy, Download,
  Trash2, Info, CheckCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'JSONL/NDJSON转换器 - JSONL转JSON/CSV工具',
  description: '在线JSONL转换工具，支持JSONL转JSON数组、JSONL转CSV、JSON数组转JSONL，逐行校验并标注错误行号，纯本地处理不上传数据',
  keywords: 'jsonl转json, jsonl转csv, ndjson转换, json转jsonl, jsonl格式化, json lines',
  author: 'Util工具箱',
  ogTitle: 'JSONL/NDJSON转换器 - 有条工具',
  ogDescription: 'JSONL 与 JSON/CSV 互转，逐行校验定位坏行，纯本地解析',
  ogUrl: 'https://www.util.cn/tools/jsonl-converter',
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
          name: 'JSONL/NDJSON转换器',
          url: 'https://www.util.cn/tools/jsonl-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['JSONL转JSON', 'JSONL转CSV', 'JSON数组转JSONL', '逐行校验与错误定位', '表格预览']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'JSONL/NDJSON转换器', item: 'https://www.util.cn/tools/jsonl-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么是JSONL/NDJSON格式？',
              acceptedAnswer: { '@type': 'Answer', text: '每行一个独立JSON值的文本格式，行与行之间没有逗号，整个文件本身不是合法的JSON文档，常用于日志与批量数据交换。' }
            },
            {
              '@type': 'Question',
              name: '个别坏行会中断转换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，工具逐行解析，错误的行会标注行号与原因，其余行正常转换。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'jsonl-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const inputText = ref('')
const inputFileName = ref('')
const mode = ref('jsonl2other')
const outputFormat = ref('json')
const isDragging = ref(false)
const seoContentVisible = ref(true)
const fileInput = ref(null)

const directionOptions = [
  { value: 'jsonl2other', label: 'JSONL → JSON/CSV' },
  { value: 'array2jsonl', label: 'JSON → JSONL' }
]

const formatOptions = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'table', label: '表格' }
]

const inputPlaceholder = computed(() => {
  return mode.value === 'jsonl2other'
    ? '每行一个 JSON，例如：\n{"name":"张三","age":28}\n{"name":"李四","age":32}'
    : '粘贴 JSON 数组，例如：\n[\n  {"name":"张三"},\n  {"name":"李四"}\n]'
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 解析 ----------
const isPlainObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

const jsonlParse = computed(() => {
  const text = inputText.value
  const records = []
  const invalid = []
  let total = 0
  if (!text.trim()) return { empty: true, records, invalid, total }
  const lines = text.split(/\r?\n/)
  lines.forEach((line, idx) => {
    const t = line.trim()
    if (!t) return
    total++
    try {
      records.push(JSON.parse(t))
    } catch (e) {
      invalid.push({
        line: idx + 1,
        reason: e.message,
        content: t.slice(0, 60) + (t.length > 60 ? '…' : '')
      })
    }
  })
  return { empty: false, records, invalid, total }
})

const arrayParse = computed(() => {
  const t = inputText.value.trim()
  if (!t) return { ok: false, empty: true, data: null, error: '' }
  try {
    const v = JSON.parse(t)
    if (!Array.isArray(v)) {
      return { ok: false, empty: false, data: null, error: '输入需要是 JSON 数组，例如 [{...}, {...}]' }
    }
    return { ok: true, empty: false, data: v, error: '' }
  } catch (e) {
    return { ok: false, empty: false, data: null, error: 'JSON 语法错误：' + e.message }
  }
})

// ---------- 表格 / CSV ----------
const objectRecords = computed(() => jsonlParse.value.records.filter(isPlainObj))
const nonObjectCount = computed(() => jsonlParse.value.records.length - objectRecords.value.length)

const tableHeaders = computed(() => {
  const keys = []
  const seen = new Set()
  for (const r of objectRecords.value) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k)
        keys.push(k)
      }
    }
  }
  return keys
})

const tableRows = computed(() => objectRecords.value.slice(0, 200))

const formatCell = (v) => {
  if (v === undefined) return ''
  if (v === null) return 'null'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const csvCell = (v) => {
  const s = v === undefined || v === null
    ? ''
    : (typeof v === 'object' ? JSON.stringify(v) : String(v))
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

const toCsv = () => {
  const keys = tableHeaders.value
  if (!keys.length) return ''
  const lines = [keys.map(csvCell).join(',')]
  for (const r of jsonlParse.value.records) {
    if (isPlainObj(r)) {
      lines.push(keys.map(k => csvCell(r[k])).join(','))
    } else {
      const cell = r === undefined ? '' : (typeof r === 'object' ? JSON.stringify(r) : String(r))
      lines.push(csvCell(cell))
    }
  }
  return lines.join('\n')
}

// ---------- 输出 ----------
const structuredOutput = computed(() => {
  const { records } = jsonlParse.value
  if (!records.length) return ''
  if (outputFormat.value === 'csv') return toCsv()
  return JSON.stringify(records, null, 2)
})

const jsonlOutput = computed(() => {
  const p = arrayParse.value
  if (!p.ok) return ''
  return p.data.map(item => (item === undefined ? 'null' : JSON.stringify(item))).join('\n')
})

const showTable = computed(() => mode.value === 'jsonl2other' && outputFormat.value === 'table')

const outputText = computed(() => {
  if (mode.value === 'array2jsonl') return jsonlOutput.value
  if (showTable.value) return ''
  return structuredOutput.value
})

const outputTitle = computed(() => {
  if (mode.value === 'array2jsonl') return 'JSONL 输出'
  if (outputFormat.value === 'json') return 'JSON 输出'
  if (outputFormat.value === 'csv') return 'CSV 输出'
  return '表格预览'
})

const emptyHint = computed(() => {
  if (mode.value === 'array2jsonl') return '粘贴 JSON 数组后，这里会显示压缩后的 JSONL'
  return '输入 JSONL 数据后，这里会显示转换结果'
})

const invalidLines = computed(() => {
  return mode.value === 'jsonl2other' ? jsonlParse.value.invalid : []
})

const stats = computed(() => {
  if (mode.value === 'array2jsonl') {
    const p = arrayParse.value
    return [
      { label: 'JSON 元素', value: p.ok ? p.data.length : '—' },
      { label: 'JSONL 行数', value: p.ok ? p.data.length : '—' }
    ]
  }
  const p = jsonlParse.value
  return [
    { label: '总行数', value: p.total },
    { label: '有效行', value: p.records.length },
    { label: '无效行', value: p.invalid.length }
  ]
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
  }
  e.target.value = ''
}

const handleDrop = async (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) {
    inputFileName.value = dropped.name
    inputText.value = await dropped.text()
  }
}

const clearAll = () => {
  inputText.value = ''
  inputFileName.value = ''
}

const downloadExtension = computed(() => {
  if (mode.value === 'array2jsonl') return 'jsonl'
  return outputFormat.value === 'csv' ? 'csv' : 'json'
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
