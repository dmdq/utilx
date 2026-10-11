<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Receipt class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">工资条成绩单批量生成</h1>
          <p class="text-sm text-muted-foreground mt-1">Excel 数据行套模板逐人生成 PDF 工资条/成绩单，可加姓名水印保护，全程本地</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传 Excel（xlsx/xls/csv，第一行为表头），自动按数据行逐人生成"标签: 值"两列小表式的 PDF 工资条或成绩单，每人一页，支持 A4/A5 纸型与"水印保护"（每页平铺该员工姓名淡色水印防转发）。全部处理在浏览器本地完成，员工数据不上传服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 上传 Excel 表格
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入 xlsx / xls / csv 文件</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 本地解析，员工数据不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <FileSpreadsheet class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">{{ headers.length }} 个字段 · {{ rows.length }} 行数据</p>
            </div>
            <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <div v-if="headers.length" class="mt-3 flex flex-wrap gap-1.5">
            <span v-for="h in headers" :key="h.key" class="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{{ h.label }}</span>
          </div>
        </div>

        <!-- 模板设置 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 模板设置
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">模板标题</label>
            <input
              v-model="docTitle"
              type="text"
              maxlength="40"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="2026年10月工资条"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">姓名列名</label>
            <input
              v-model="nameColumn"
              type="text"
              maxlength="20"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="姓名"
            />
            <p class="text-xs text-muted-foreground mt-1.5">
              用于每页水印与文件命名{{ nameColFound !== -1 ? `（已匹配到第 ${nameColFound + 1} 列「${headers[nameColFound]?.label}」）` : '，未在表头中找到时默认取第一列' }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">纸型</label>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                @click="pageSize = 'a4'"
                :class="pageSize === 'a4' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >A4（210×297mm）</button>
              <button
                @click="pageSize = 'a5'"
                :class="pageSize === 'a5' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >A5（148×210mm）</button>
            </div>
          </div>

          <div class="flex items-start gap-2">
            <input v-model="watermarkOn" type="checkbox" id="watermarkOn" class="w-4 h-4 mt-0.5 rounded border-border" />
            <label for="watermarkOn" class="text-sm text-foreground">
              水印保护
              <span class="block text-xs text-muted-foreground mt-0.5">每页平铺该员工姓名淡色水印，降低工资条被转发滥用的风险（pdf-lib 暂不支持打开密码，已提供水印保护作为替代）</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 右侧：处理与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 处理按钮 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <button
            @click="generatePdf"
            :disabled="!rows.length || processing"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Sparkles v-else class="w-4 h-4" />
            {{ processing ? `正在生成 ${progress}/${rows.length} …` : `为 ${rows.length} 人批量生成 PDF` }}
          </button>

          <div v-if="error" class="mt-4 flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <FileWarning class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- 成功结果卡片 -->
        <div v-if="result" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 生成完成
          </h2>
          <div class="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900 rounded-lg p-5 text-center mb-4">
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ result.people }} 人已生成</p>
            <p class="text-sm text-muted-foreground mt-1">共 {{ result.pages }} 页（每人一页 · {{ result.pageSize.toUpperCase() }}）· 输出 {{ formatSize(result.size) }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm mb-4">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">模板标题</span>
              <span class="font-medium text-foreground truncate max-w-[60%]">{{ docTitle || '（默认标题）' }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">水印保护</span>
              <span class="font-medium text-foreground">{{ watermarkOn ? '已开启（姓名平铺）' : '未开启' }}</span>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Download class="w-4 h-4" /> 保存 {{ outputName }}
          </button>
          <p class="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <ShieldCheck class="w-3 h-3" /> 建议通过企业微信/邮件单发到个人，避免群发泄露薪酬信息。
          </p>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 表格格式建议
          </h2>
          <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
            <li>第一行为表头（字段名），如：姓名 / 部门 / 应发工资 / 实发工资；第二行起每行一个人。</li>
            <li>字段数量不限，每页按表头顺序以「字段名: 值」两列小表呈现；空值单元格会显示为"—"。</li>
            <li>金额建议保留两位小数文本或数字格式；日期建议写成 2026-10-10 这类文本，避免 Excel 序列号。</li>
            <li>仅需工资条一部分列时，先在 Excel 中删掉多余列再上传即可。</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于电子工资条</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            电子工资条是 HR 每月最重复的活：把 Excel 工资表拆成一条条发给个人。本工具把"拆"与"发"之间的格式环节自动化——上传工资表后逐人生成排版统一、每人一页的 PDF，A5 纸型尤其适合打印裁切或截图单发，同一套流程也可用于学生成绩单、会员账单等"一行一单"场景。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么用姓名水印而不是打开密码</h3>
          <p>
            打开密码需要把密码单独发给每个人，沟通成本高且容易遗忘；更常见的做法是"无密码 + 姓名水印"：文件任何人都能打开（方便自动转发到邮箱），但每一页都平铺了员工姓名淡色水印，截图外传时天然带溯源标记。本工具即采用该方案。
          </p>
          <h3 class="text-lg font-semibold text-foreground">薪酬信息如何不泄露</h3>
          <p>
            本工具所有解析与生成都在浏览器本地完成，Excel 与生成的 PDF 都不会上传服务器；生成后建议通过企业微信/邮件"一对一"发送，避免群发附件，并提醒员工妥善保存。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些表格格式？</span>支持 xlsx、xls 与 csv，第一行必须是表头；WPS 导出的 xlsx 同样支持。</li>
            <li><span class="text-foreground font-medium">每人一页是怎么排版的？</span>每页顶部为模板标题，下方按表头顺序呈现「字段名: 值」两列小表；数据行之间自动分页，页数等于数据行数。</li>
            <li><span class="text-foreground font-medium">生成的 PDF 可以设置打开密码吗？</span>浏览器端 pdf-lib 暂不支持加密，已提供"水印保护"（姓名平铺淡色水印）作为替代方案。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'payslip-generator'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Receipt, FileUp, FileWarning, FileSpreadsheet, Upload, Download, X, Loader2,
  CheckCircle, Settings2, Sparkles, ShieldCheck, Lightbulb, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '工资条成绩单批量生成 - Excel批量生成PDF工具',
  description: '上传Excel按行批量生成每人一页的PDF工资条/成绩单，字段以标签值两列小表呈现，支持A4/A5与姓名淡色水印保护，全程浏览器本地处理不上传',
  keywords: '工资条生成, 电子工资条, 成绩单批量生成, excel转pdf, 批量pdf, hr工具',
  author: 'Util工具箱',
  ogTitle: '工资条成绩单批量生成 - 有条工具',
  ogDescription: 'Excel数据行套模板逐人生成PDF工资条/成绩单，可加姓名水印保护，全程本地',
  ogUrl: 'https://www.util.cn/tools/payslip-generator',
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
          name: '工资条成绩单批量生成',
          url: 'https://www.util.cn/tools/payslip-generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Excel按行批量生成PDF', '每人一页工资条/成绩单', 'A4/A5纸型可选', '姓名淡色水印保护', '字段标签值排版', '纯本地处理']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '工资条成绩单批量生成', item: 'https://www.util.cn/tools/payslip-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '支持哪些表格格式？',
              acceptedAnswer: { '@type': 'Answer', text: '支持xlsx、xls与csv，第一行必须是表头字段名，第二行起每行一个人；WPS导出的xlsx同样支持。' }
            },
            {
              '@type': 'Question',
              name: '每人一页是怎么排版的？',
              acceptedAnswer: { '@type': 'Answer', text: '每页顶部为模板标题，下方按表头顺序呈现「字段名: 值」两列小表；数据行之间自动分页，页数等于数据行数。' }
            },
            {
              '@type': 'Question',
              name: '生成的PDF可以设置打开密码吗？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器端pdf-lib暂不支持加密，已提供水印保护（每页平铺该员工姓名淡色水印）作为替代方案。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'payslip-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数（可独立测试） ----------
// sheet_to_json(header:1) 结果 → 表头 + 数据行（过滤全空行）
const extractTable = (matrix) => {
  if (!matrix || !matrix.length) return { headers: [], rows: [] }
  const rawHeaders = matrix[0].map((h, i) => (h === '' || h == null ? `列${i + 1}` : String(h).trim()))
  const rows = matrix.slice(1).filter(r => r.some(c => c !== '' && c != null))
  return { headers: rawHeaders, rows }
}

// 页面尺寸（pt）
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  a5: { width: 419.53, height: 595.28 }
}

// ---------- 状态 ----------
const file = ref(null)
const fileName = ref('')
const headers = ref([])
const rows = ref([])
const fileInput = ref(null)
const isDragging = ref(false)
const processing = ref(false)
const progress = ref(0)
const error = ref('')
const result = ref(null)

const docTitle = ref('2026年10月工资条')
const nameColumn = ref('姓名')
const pageSize = ref('a5')
const watermarkOn = ref(true)

const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const nameColFound = computed(() => {
  const name = (nameColumn.value || '').trim()
  if (!name) return -1
  return headers.value.findIndex(h => h.label === name)
})

const outputName = computed(() => `${(docTitle.value || '工资条').replace(/[\\/:*?"<>|]/g, '')}.pdf`)

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 文件选择与解析 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetTable = () => {
  file.value = null
  fileName.value = ''
  headers.value = []
  rows.value = []
  result.value = null
}

const acceptFile = async (f) => {
  if (!f) return
  error.value = ''
  result.value = null
  try {
    const XLSX = await import('xlsx')
    const buf = await f.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    const table = extractTable(matrix)
    if (!table.headers.length || !table.rows.length) {
      resetTable()
      error.value = '未解析到有效数据：请确认第一行为表头、第二行起为数据'
      return
    }
    file.value = f
    fileName.value = f.name
    headers.value = table.headers.map((label, key) => ({ key, label }))
    rows.value = table.rows
  } catch (e) {
    resetTable()
    error.value = '表格解析失败，请确认为有效的 xlsx/xls/csv 文件。' + (e && e.message ? `（${e.message}）` : '')
  }
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (files && files.length > 0) acceptFile(files[0])
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files && files.length > 0) acceptFile(files[0])
}

const clearFile = () => {
  resetTable()
  error.value = ''
}

const fmtCell = (v) => {
  if (v === '' || v == null) return '—'
  return String(v)
}

// ---------- 单人页面绘制（canvas 中文渲染 → PNG 嵌入） ----------
const renderPayslipPng = (row, opts) => {
  const { width, height } = PAGE_SIZES[opts.pageSize]
  const scale = opts.pageSize === 'a4' ? 2.5 : 3
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')

  // 白底
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const font = (px, bold) => `${bold ? 'bold ' : ''}${Math.round(px * scale)}px "PingFang SC", "Microsoft YaHei", sans-serif`

  // 姓名淡色水印（铺在最底层内容之上、正文之下亦可，这里最后统一绘制淡色不遮字）
  const drawWatermark = () => {
    if (!opts.watermarkText) return
    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.fillStyle = '#374151'
    ctx.font = font(22, true)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const stepX = 260 * scale
    const stepY = 150 * scale
    const angle = (-30 * Math.PI) / 180
    for (let y = stepY * 0.5; y < canvas.height + stepY; y += stepY) {
      for (let x = stepX * 0.5; x < canvas.width + stepX; x += stepX) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillText(opts.watermarkText, 0, 0)
        ctx.restore()
      }
    }
    ctx.restore()
  }

  // 标题
  ctx.fillStyle = '#111827'
  ctx.font = font(22, true)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const margin = 48
  ctx.fillText(opts.title, canvas.width / 2, margin * scale)
  ctx.strokeStyle = '#111827'
  ctx.lineWidth = 2 * scale
  ctx.beginPath()
  ctx.moveTo(margin * scale, margin * scale + 22 * scale)
  ctx.lineTo(canvas.width - margin * scale, margin * scale + 22 * scale)
  ctx.stroke()

  // 字段两列小表
  const tableTop = margin * scale + 46 * scale
  const rowH = 34
  const cols = 2
  const tableW = canvas.width / scale - margin * 2
  const colW = tableW / cols
  const valueOffset = colW * 0.42

  opts.fields.forEach((field, i) => {
    const colIdx = i % cols
    const rowIdx = Math.floor(i / cols)
    const x = margin + colIdx * colW
    const y = tableTop + rowIdx * rowH
    // 单元格底色（交替行色）
    ctx.fillStyle = i % 2 === 0 ? '#f3f4f6' : '#f9fafb'
    ctx.fillRect(x * scale, y * scale, colW * scale, rowH * scale)
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1 * scale
    ctx.strokeRect(x * scale, y * scale, colW * scale, rowH * scale)
    // 标签
    ctx.fillStyle = '#6b7280'
    ctx.font = font(11, false)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${field.label}:`, (x + 10) * scale, (y + rowH / 2) * scale)
    // 值
    ctx.fillStyle = '#111827'
    ctx.font = font(12, true)
    ctx.fillText(field.value, (x + valueOffset) * scale, (y + rowH / 2) * scale)
  })

  drawWatermark()

  return canvas.toDataURL('image/png')
}

// ---------- 主流程 ----------
const generatePdf = async () => {
  if (!rows.value.length) {
    error.value = '请先上传包含数据行的 Excel 表格'
    return
  }
  processing.value = true
  error.value = ''
  result.value = null
  progress.value = 0
  try {
    const { PDFDocument } = await import('pdf-lib')
    const pdfDoc = await PDFDocument.create()
    pdfDoc.setTitle(docTitle.value || '工资条')
    const { width, height } = PAGE_SIZES[pageSize.value]

    const nameIdx = nameColFound.value !== -1 ? nameColFound.value : 0

    for (let i = 0; i < rows.value.length; i++) {
      const row = rows.value[i]
      const fields = headers.value.map((h, ci) => ({
        label: h.label,
        value: fmtCell(row[ci])
      }))
      const personName = fmtCell(row[nameIdx])
      const png = renderPayslipPng(row, {
        pageSize: pageSize.value,
        title: docTitle.value || '工资条',
        watermarkText: watermarkOn.value ? personName : '',
        fields
      })
      const image = await pdfDoc.embedPng(png)
      const page = pdfDoc.addPage([width, height])
      page.drawImage(image, { x: 0, y: 0, width, height })
      progress.value = i + 1
      // 让出主线程，避免长列表卡死 UI
      if (i % 5 === 4) await new Promise(r => setTimeout(r, 0))
    }

    const bytes = await pdfDoc.save()
    result.value = {
      people: rows.value.length,
      pages: rows.value.length,
      pageSize: pageSize.value,
      size: bytes.byteLength,
      data: bytes
    }
  } catch (err) {
    error.value = '生成失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    processing.value = false
  }
}

const downloadResult = () => {
  if (!result.value) return
  const blob = new Blob([result.value.data], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = outputName.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
