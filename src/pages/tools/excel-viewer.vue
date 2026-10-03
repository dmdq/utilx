<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Table class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Excel表格查看转换器</h1>
          <p class="text-sm text-muted-foreground mt-1">XLSX/XLS/CSV 在线解析预览，导出 JSON / CSV / Markdown，纯本地处理</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传或拖入 Excel 工作簿（.xlsx / .xls）或 CSV 文件，在浏览器本地解析后切换多个 Sheet 标签预览表格内容，并一键导出为 JSON、CSV 或 Markdown 格式。文件不会上传到任何服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：上传与文件信息 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 选择文件
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              @change="handleFileChange"
            />
            <File v-if="!fileName" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p v-if="!fileName" class="text-xs text-muted-foreground">点击选择或拖入 .xlsx / .xls / .csv 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ fileName }}</p>
          </div>
          <p class="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            解析完全在浏览器本地完成，建议文件在 20MB 以内，过大文件可能导致页面卡顿。
          </p>
        </div>

        <!-- 文件信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <FileSearch class="w-4 h-4 mr-2 text-primary" /> 文件信息
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ sheetNames.length }}</p>
              <p class="text-xs text-muted-foreground">Sheet 数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ totalRows }}</p>
              <p class="text-xs text-muted-foreground">总行数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ totalCols }}</p>
              <p class="text-xs text-muted-foreground">列数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-base font-bold text-foreground truncate" :title="fileName">{{ fileName || '-' }}</p>
              <p class="text-xs text-muted-foreground">文件名（{{ fileSizeLabel }}）</p>
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

      <!-- 右侧：Sheet 预览与导出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-wrap gap-3">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 表格预览
            </h2>
            <div class="flex items-center gap-2 flex-wrap">
              <div class="grid grid-cols-3 gap-1 mr-1">
                <button
                  v-for="fmt in formatOptions"
                  :key="fmt.value"
                  @click="exportFormat = fmt.value"
                  :class="exportFormat === fmt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="px-2.5 py-1.5 rounded text-xs font-medium transition-all"
                >
                  {{ fmt.label }}
                </button>
              </div>
              <button
                @click="copyOutput"
                :disabled="!exportText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadOutput"
                :disabled="!exportText"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>

          <!-- Sheet 标签 -->
          <div v-if="sheetNames.length > 1" class="flex flex-wrap gap-1.5 px-6 pt-4">
            <button
              v-for="name in sheetNames"
              :key="name"
              @click="loadSheet(name)"
              :class="activeSheet === name ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-2.5 py-1.5 rounded text-xs font-medium transition-all max-w-[10rem] truncate"
              :title="name"
            >
              {{ name }}
            </button>
          </div>

          <div class="p-6">
            <!-- 加载中 -->
            <div v-if="loading" class="py-16 text-center">
              <Loader2 class="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
              <p class="text-sm text-muted-foreground">正在解析文件…</p>
            </div>
            <!-- 错误 -->
            <div v-else-if="errorMsg" class="py-16 text-center">
              <FileWarning class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">解析失败</p>
              <p class="text-xs text-muted-foreground">{{ errorMsg }}</p>
            </div>
            <!-- 表格 -->
            <template v-else-if="previewRows.length > 0">
              <div class="overflow-auto border border-border rounded-lg max-h-[28rem]">
                <table class="w-full text-xs">
                  <thead class="sticky top-0">
                    <tr class="bg-muted">
                      <th class="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border whitespace-nowrap">#</th>
                      <th
                        v-for="(h, idx) in previewHeaders"
                        :key="idx"
                        class="px-3 py-2 text-left font-medium text-foreground border-b border-border whitespace-nowrap"
                      >
                        {{ h }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rIdx) in previewRows" :key="rIdx" class="hover:bg-muted/40">
                      <td class="px-3 py-1.5 text-muted-foreground border-b border-border whitespace-nowrap">{{ rIdx + 1 }}</td>
                      <td
                        v-for="idx in previewWidth"
                        :key="idx"
                        class="px-3 py-1.5 text-foreground border-b border-border max-w-[14rem] truncate"
                        :title="String(row[idx - 1] ?? '')"
                      >
                        {{ row[idx - 1] ?? '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="totalRows > PREVIEW_LIMIT" class="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <Info class="w-3.5 h-3.5" />
                共 {{ totalRows }} 行，预览前 {{ PREVIEW_LIMIT }} 行；复制/下载会导出当前 Sheet 的全部数据。
              </p>
            </template>
            <!-- 空状态 -->
            <div v-else class="py-16 text-center">
              <Table class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">上传 Excel / CSV 文件后，这里会显示表格内容</p>
            </div>
          </div>
        </div>

        <!-- 导出说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 导出说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">JSON</span>：以第一行为表头输出对象数组，便于程序直接读取</li>
            <li>• <span class="text-foreground">CSV</span>：标准逗号分隔格式（带 BOM），Excel 打开不乱码</li>
            <li>• <span class="text-foreground">Markdown</span>：带表头分隔线的 Markdown 表格，可直接粘贴到文档</li>
            <li>• 单元格统一按文本读取，避免长数字被科学计数法或精度截断</li>
            <li>• 多 Sheet 工作簿导出的是当前选中的 Sheet；预览仅显示前 200 行</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于Excel表格查看转换器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            收到一份 Excel 表格却没装 Office？想快速看看 xlsx 里有什么、再把数据交给程序处理？本工具在浏览器本地直接解析 XLSX / XLS / CSV 文件，支持多 Sheet 切换预览，并可导出为 JSON、CSV、Markdown 三种常用格式，全程数据不出设备。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>临时查看他人发来的 xlsx / xls 表格内容，无需安装 Office 或 WPS</li>
            <li>把 Excel 数据转成 JSON，供前端 Mock、接口联调或数据库导入使用</li>
            <li>把表格转成 Markdown 粘贴进 README、技术文档或博客</li>
            <li>核对多 Sheet 工作簿中每个工作表的行列数与内容</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些格式？</span>支持 .xlsx、.xls 与 .csv 文件；旧版 .xls 大部分也能正常解析。</li>
            <li><span class="text-foreground font-medium">文件会上传吗？</span>不会，解析、预览与导出全部在浏览器本地完成。</li>
            <li><span class="text-foreground font-medium">预览只有 200 行吗？</span>页面预览前 200 行以保证流畅，复制与下载导出的是当前 Sheet 全部数据。</li>
            <li><span class="text-foreground font-medium">能导出所有 Sheet 吗？</span>当前按 Sheet 逐个导出，切换到对应标签后下载即可。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'excel-viewer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Table, Upload, File, FileCheck, FileSearch, Eye, Download, Copy, Trash2,
  Info, FileWarning, Loader2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Excel表格查看转换器 - 在线Excel/CSV查看与转JSON/CSV/Markdown工具',
  description: '在线Excel查看器，无需安装Office即可本地解析xlsx/xls/csv文件，多Sheet预览，一键导出JSON、CSV、Markdown，纯本地处理不上传数据',
  keywords: 'excel查看器, xlsx在线查看, excel转json, excel转csv, excel转markdown, csv查看器, 在线excel预览',
  author: 'Util工具箱',
  ogTitle: 'Excel表格查看转换器 - 有条工具',
  ogDescription: 'XLSX/XLS/CSV 在线解析预览，导出 JSON / CSV / Markdown，纯本地处理',
  ogUrl: 'https://www.util.cn/tools/excel-viewer',
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
          name: 'Excel表格查看转换器',
          url: 'https://www.util.cn/tools/excel-viewer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['XLSX/XLS/CSV本地解析', '多Sheet切换预览', '导出JSON', '导出CSV', '导出Markdown']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'Excel表格查看转换器', item: 'https://www.util.cn/tools/excel-viewer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Excel查看器支持哪些文件格式？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 .xlsx、.xls 与 .csv 文件，在浏览器本地解析预览。' }
            },
            {
              '@type': 'Question',
              name: 'Excel表格会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，解析、预览与导出全部在浏览器本地完成，数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'excel-viewer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const PREVIEW_LIMIT = 200
const fileName = ref('')
const fileSize = ref(0)
const sheetNames = ref([])
const activeSheet = ref('')
const tableData = ref([])
const totalRows = ref(0)
const totalCols = ref(0)
const loading = ref(false)
const errorMsg = ref('')
const exportFormat = ref('json')
const isDragging = ref(false)
const seoContentVisible = ref(true)
const fileInput = ref(null)

// xlsx 库较大，仅在函数内动态加载；工作簿对象不放入响应式
let XLSXLib = null
let workbook = null

const formatOptions = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'markdown', label: 'MD' }
]

const fileSizeLabel = computed(() => {
  if (!fileSize.value) return '0 B'
  if (fileSize.value < 1024 * 1024) return (fileSize.value / 1024).toFixed(1) + ' KB'
  return (fileSize.value / 1024 / 1024).toFixed(2) + ' MB'
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 解析 ----------
const ensureXLSX = async () => {
  if (!XLSXLib) XLSXLib = await import('xlsx')
  return XLSXLib
}

const parseWorkbook = async (file) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const XLSX = await ensureXLSX()
    const buffer = await file.arrayBuffer()
    workbook = XLSX.read(buffer, { type: 'array' })
    fileName.value = file.name
    fileSize.value = file.size
    sheetNames.value = workbook.SheetNames.slice()
    if (sheetNames.value.length === 0) {
      clearTable()
      errorMsg.value = '文件中没有找到任何工作表。'
      return
    }
    loadSheet(sheetNames.value[0])
  } catch (err) {
    clearTable()
    errorMsg.value = '无法解析该文件，请确认是有效的 .xlsx / .xls / .csv 文件。'
  } finally {
    loading.value = false
  }
}

const loadSheet = (name) => {
  if (!workbook || !XLSXLib) return
  try {
    const ws = workbook.Sheets[name]
    if (!ws) return
    const rows = XLSXLib.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
    activeSheet.value = name
    tableData.value = rows
    totalRows.value = rows.length
    totalCols.value = rows.reduce((max, r) => Math.max(max, r.length), 0)
  } catch (err) {
    errorMsg.value = '读取工作表失败：' + (err.message || '未知错误')
  }
}

const clearTable = () => {
  workbook = null
  sheetNames.value = []
  activeSheet.value = ''
  tableData.value = []
  totalRows.value = 0
  totalCols.value = 0
}

// ---------- 预览 ----------
const previewHeaders = computed(() => {
  const first = tableData.value[0] || []
  const width = Math.max(totalCols.value, first.length)
  return Array.from({ length: width }, (_, idx) => {
    const v = first[idx]
    return v !== undefined && String(v).trim() !== '' ? String(v) : `列${idx + 1}`
  })
})

const previewRows = computed(() => tableData.value.slice(0, PREVIEW_LIMIT))

const previewWidth = computed(() => Math.max(totalCols.value, previewHeaders.value.length))

// ---------- 导出 ----------
const buildHeaders = () => {
  const first = tableData.value[0] || []
  const width = Math.max(totalCols.value, first.length)
  const seen = new Set()
  return Array.from({ length: width }, (_, idx) => {
    let h = first[idx] !== undefined && String(first[idx]).trim() !== '' ? String(first[idx]).trim() : `column_${idx + 1}`
    while (seen.has(h)) h += '_' + (idx + 1)
    seen.add(h)
    return h
  })
}

const csvEscape = (v) => {
  const s = v === undefined || v === null ? '' : String(v)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

const toCsv = () => {
  return tableData.value.map(row => {
    const width = Math.max(totalCols.value, row.length)
    return Array.from({ length: width }, (_, idx) => csvEscape(row[idx])).join(',')
  }).join('\r\n')
}

const toMarkdown = () => {
  const headers = buildHeaders()
  const lines = []
  lines.push('| ' + headers.join(' | ') + ' |')
  lines.push('| ' + headers.map(() => '---').join(' | ') + ' |')
  for (const row of tableData.value.slice(1)) {
    const width = headers.length
    const cells = Array.from({ length: width }, (_, idx) =>
      String(row[idx] ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
    )
    lines.push('| ' + cells.join(' | ') + ' |')
  }
  return lines.join('\n')
}

const toJson = () => {
  const headers = buildHeaders()
  const objects = tableData.value.slice(1).map(row => {
    const obj = {}
    headers.forEach((key, idx) => {
      obj[key] = row[idx] ?? ''
    })
    return obj
  })
  return JSON.stringify(objects, null, 2)
}

const exportText = computed(() => {
  if (tableData.value.length === 0) return ''
  try {
    switch (exportFormat.value) {
      case 'json':
        return toJson()
      case 'csv':
        return toCsv()
      case 'markdown':
        return toMarkdown()
      default:
        return ''
    }
  } catch (err) {
    return ''
  }
})

// ---------- 复制 / 下载 ----------
const copyOutput = async () => {
  if (!exportText.value) return
  try {
    await navigator.clipboard.writeText(exportText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = exportText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const downloadOutput = () => {
  if (!exportText.value) return
  const isCsv = exportFormat.value === 'csv'
  // CSV 前置 BOM，保证 Excel 直接打开不乱码
  const content = isCsv ? '\uFEFF' + exportText.value : exportText.value
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const base = (fileName.value || 'sheet').replace(/\.[^.]+$/, '')
  const ext = { json: 'json', csv: 'csv', markdown: 'md' }[exportFormat.value] || 'txt'
  a.href = url
  a.download = `${base}.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------- 交互 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  const selected = e.target.files?.[0]
  if (selected) parseWorkbook(selected)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) parseWorkbook(dropped)
}

const clearAll = () => {
  clearTable()
  fileName.value = ''
  fileSize.value = 0
  errorMsg.value = ''
}
</script>
