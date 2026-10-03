<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileText class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF合并拆分器</h1>
          <p class="text-sm text-muted-foreground mt-1">本地合并多个 PDF、按页码范围或页数拆分，文件不上传服务器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        支持将多个 PDF 合并为一个文档，或将单个 PDF 按页码范围提取、按固定页数拆分。基于 pdf-lib 在浏览器本地完成处理，PDF 文件不会上传到任何服务器，适合处理合同、报表等敏感文档。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：控制面板 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <!-- 模式切换 -->
          <div class="grid grid-cols-2 gap-2 mb-6">
            <button
              @click="switchMode('merge')"
              :class="mode === 'merge' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Merge class="w-4 h-4" /> 合并
            </button>
            <button
              @click="switchMode('split')"
              :class="mode === 'split' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Scissors class="w-4 h-4" /> 拆分
            </button>
          </div>

          <!-- 文件选择 -->
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" />
            {{ mode === 'merge' ? '添加 PDF 文件' : '选择 PDF 文件' }}
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
              accept="application/pdf,.pdf"
              multiple
              class="hidden"
              @change="handleFileChange"
            />
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">
              {{ mode === 'merge' ? '点击或拖入一个或多个 PDF' : '点击或拖入一个 PDF' }}
            </p>
          </div>

          <!-- 合并模式：文件列表 -->
          <div v-if="mode === 'merge' && pdfFiles.length > 0" class="mt-4 space-y-2">
            <div
              v-for="(item, index) in pdfFiles"
              :key="item.id"
              class="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
            >
              <span class="text-xs text-muted-foreground w-4">{{ index + 1 }}.</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground truncate" :title="item.file.name">{{ item.file.name }}</p>
                <p class="text-[10px] text-muted-foreground">{{ formatSize(item.file.size) }}<span v-if="item.pages"> · {{ item.pages }} 页</span></p>
              </div>
              <button
                @click="moveFile(index, -1)"
                :disabled="index === 0"
                class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="上移"
              >
                <ArrowUp class="w-3.5 h-3.5" />
              </button>
              <button
                @click="moveFile(index, 1)"
                :disabled="index === pdfFiles.length - 1"
                class="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="下移"
              >
                <ArrowDown class="w-3.5 h-3.5" />
              </button>
              <button
                @click="removeFile(index)"
                class="p-1 text-muted-foreground hover:text-destructive"
                title="移除"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 拆分模式：配置 -->
          <div v-if="mode === 'split' && pdfFiles.length > 0" class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">拆分方式</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  @click="splitStrategy = 'range'"
                  :class="splitStrategy === 'range' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  页码范围提取
                </button>
                <button
                  @click="splitStrategy = 'chunk'"
                  :class="splitStrategy === 'chunk' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  按页数拆分
                </button>
              </div>
            </div>

            <div v-if="splitStrategy === 'range'">
              <label class="block text-sm font-medium text-foreground mb-2">页码范围</label>
              <input
                v-model="pageRange"
                type="text"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="例如：1-3, 5, 8-10"
              />
              <p class="text-xs text-muted-foreground mt-1.5">
                支持逗号分隔的页码与区间，从第 1 页开始，共 {{ totalPages }} 页
              </p>
            </div>

            <div v-else>
              <label class="block text-sm font-medium text-foreground mb-2">每个文件的页数</label>
              <input
                v-model.number="chunkSize"
                type="number"
                min="1"
                :max="totalPages"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-xs text-muted-foreground mt-1.5">
                共 {{ totalPages }} 页，将拆为 {{ Math.ceil(totalPages / (chunkSize || 1)) }} 个文件
              </p>
            </div>
          </div>

          <!-- 主操作 -->
          <button
            @click="process"
            :disabled="!canProcess || processing"
            class="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Merge v-else-if="mode === 'merge'" class="w-4 h-4" />
            <Scissors v-else class="w-4 h-4" />
            {{ processing ? '处理中...' : (mode === 'merge' ? '合并 PDF' : '拆分 PDF') }}
          </button>
        </div>

        <!-- 说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <ShieldCheck class="w-4 h-4 mr-2 text-primary" /> 隐私与限制
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 全部处理在浏览器本地完成，文件不上传</li>
            <li>• 单文件建议不超过 100MB</li>
            <li>• 加密保护的 PDF 可能无法处理</li>
            <li>• 拆分产生多个文件时自动打包为 ZIP 下载</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 错误 -->
        <div v-if="error" class="bg-card border border-destructive/50 rounded-lg p-8">
          <div class="flex items-start gap-3">
            <FileWarning class="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="text-lg font-semibold text-destructive mb-1">处理失败</h3>
              <p class="text-sm text-muted-foreground">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- 结果 -->
        <div v-else-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary/10 rounded-lg">
                <CheckCircle class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-foreground">处理完成</h2>
                <p class="text-xs text-muted-foreground">共 {{ results.length }} 个输出文件</p>
              </div>
            </div>
            <button
              v-if="results.length > 1"
              @click="downloadAll"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
            >
              <Package class="w-4 h-4" /> 打包下载
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(item, index) in results"
              :key="index"
              class="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3"
            >
              <FileText class="w-4 h-4 text-primary flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-foreground truncate" :title="item.filename">{{ item.filename }}</p>
                <p class="text-xs text-muted-foreground">{{ formatSize(item.size) }} · {{ item.pages }} 页</p>
              </div>
              <button
                @click="downloadOne(item)"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="bg-card border border-border rounded-lg p-12">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText class="w-8 h-8 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">本地处理 PDF</h3>
            <p class="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {{ mode === 'merge'
                ? '按顺序添加多个 PDF 文件，合并为一个文档，顺序可随时调整。'
                : '提取指定页码范围，或按固定页数把一份 PDF 拆分为多份。' }}
            </p>
            <div class="grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
              <div class="bg-muted/50 rounded-lg p-3">
                <Merge class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">多文件合并</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <Scissors class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">页码提取拆分</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 使用提示
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 合并模式下可通过上移/下移按钮调整文件顺序，输出按列表顺序拼接</li>
            <li>• 页码范围示例：`1-3, 5, 8-10` 表示提取第 1~3、5、8~10 页</li>
            <li>• 按页数拆分时，最后一个文件可能不足设定页数</li>
            <li>• 输出文件名自动带上序号或页码信息，便于识别</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于PDF合并拆分器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            PDF合并拆分器是一款纯本地的 PDF 页面级处理工具。合并模式按你排列的顺序把多个 PDF 拼接成一个文档；拆分模式支持两种方式：按页码范围提取需要的页面，或按固定页数把长文档切成多个小文件。全部处理基于 pdf-lib 在浏览器中完成，文件不会上传到任何服务器。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>合并扫描件：把分多次扫描的合同、证明材料合并为一个完整 PDF</li>
            <li>提取关键页：从几百页的报告中提取需要归档或发送的章节</li>
            <li>拆分大文档：把整本书、整套图纸按章节页数拆分便于分发</li>
            <li>敏感文档处理：合同、财务报表等不便上传第三方网站的文件</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">合并后书签和表单还在吗？</span>本工具进行页面级合并，保留页面内容与外观，书签、表单域等文档级结构不会保留。</li>
            <li><span class="text-foreground font-medium">文件会上传吗？</span>不会，所有处理在浏览器本地完成，关闭页面数据即释放。</li>
            <li><span class="text-foreground font-medium">为什么有的加密 PDF 打不开？</span>带密码保护的 PDF 需要先解除限制，本工具不破解加密文档。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-merge-split'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileText, FileUp, FileWarning, Upload, Download, Merge, Scissors,
  ArrowUp, ArrowDown, X, Loader2, CheckCircle, Package, ShieldCheck,
  Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF合并拆分器 - 本地PDF合并与页面提取工具',
  description: '在浏览器本地合并多个PDF文件、按页码范围提取页面或按页数拆分PDF，支持批量打包下载，文件不上传服务器，保护文档隐私',
  keywords: 'pdf合并, pdf拆分, pdf分割, pdf页面提取, pdf合并在线, 本地pdf处理',
  author: 'Util工具箱',
  ogTitle: 'PDF合并拆分器 - 有条工具',
  ogDescription: '本地合并多个PDF、按页码范围或页数拆分，文件不上传服务器',
  ogUrl: 'https://www.util.cn/tools/pdf-merge-split',
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
          name: 'PDF合并拆分器',
          url: 'https://www.util.cn/tools/pdf-merge-split',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多文件合并', '页码范围提取', '按页数拆分', 'ZIP打包下载', '纯本地处理']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF合并拆分器', item: 'https://www.util.cn/tools/pdf-merge-split/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'PDF合并拆分会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，全部处理基于pdf-lib在浏览器本地完成，文件不离开设备。' }
            },
            {
              '@type': 'Question',
              name: '如何只提取PDF的部分页面？',
              acceptedAnswer: { '@type': 'Answer', text: '使用拆分模式的页码范围提取，输入如1-3,5,8-10即可只保留指定页面。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pdf-merge-split')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const mode = ref('merge')
const pdfFiles = ref([])
const splitStrategy = ref('range')
const pageRange = ref('')
const chunkSize = ref(1)
const isDragging = ref(false)
const processing = ref(false)
const error = ref('')
const results = ref([])
const seoContentVisible = ref(true)
const fileInput = ref(null)
const fileSeq = ref(0)

const totalPages = computed(() => {
  return pdfFiles.value[0]?.pages || 0
})

const canProcess = computed(() => {
  if (processing.value || pdfFiles.value.length === 0) return false
  if (mode.value === 'merge') return pdfFiles.value.length >= 2
  if (splitStrategy.value === 'range') {
    return parseRanges(pageRange.value).length > 0
  }
  return chunkSize.value >= 1
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const switchMode = (m) => {
  mode.value = m
  error.value = ''
  results.value = []
  if (m === 'split' && pdfFiles.value.length > 1) {
    pdfFiles.value = pdfFiles.value.slice(0, 1)
  }
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// ---------- 文件管理 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  addFiles(Array.from(e.target.files || []))
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  addFiles(Array.from(e.dataTransfer?.files || []))
}

const addFiles = async (files) => {
  const pdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf')
  if (pdfs.length === 0) {
    alert('请选择 PDF 文件')
    return
  }
  error.value = ''
  results.value = []

  for (const f of pdfs) {
    if (mode.value === 'split') {
      pdfFiles.value = []
    }
    const pages = await countPages(f)
    pdfFiles.value.push({ id: ++fileSeq.value, file: f, pages })
    if (mode.value === 'split') break
  }
}

const countPages = async (file) => {
  try {
    const { PDFDocument } = await import('pdf-lib')
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })
    return doc.getPageCount()
  } catch (err) {
    return 0
  }
}

const moveFile = (index, dir) => {
  const target = index + dir
  if (target < 0 || target >= pdfFiles.value.length) return
  const list = [...pdfFiles.value]
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item)
  pdfFiles.value = list
}

const removeFile = (index) => {
  pdfFiles.value.splice(index, 1)
}

// ---------- 页码解析 ----------
const parseRanges = (input) => {
  if (!input || !input.trim()) return []
  const indices = []
  for (const part of input.split(/[,，]/)) {
    const seg = part.trim()
    if (!seg) continue
    const m = seg.match(/^(\d+)\s*[-~—]\s*(\d+)$/)
    if (m) {
      const start = parseInt(m[1], 10)
      const end = parseInt(m[2], 10)
      if (start >= 1 && end >= start) {
        for (let p = start; p <= end; p++) indices.push(p - 1)
      }
      continue
    }
    const single = parseInt(seg, 10)
    if (String(single) === seg && single >= 1) indices.push(single - 1)
  }
  return [...new Set(indices)].sort((a, b) => a - b)
}

// ---------- 处理 ----------
const process = async () => {
  if (!canProcess.value) return
  processing.value = true
  error.value = ''
  results.value = []

  try {
    const { PDFDocument } = await import('pdf-lib')
    const startTime = performance.now()

    if (mode.value === 'merge') {
      const out = await PDFDocument.create()
      for (const item of pdfFiles.value) {
        const src = await PDFDocument.load(await item.file.arrayBuffer(), { ignoreEncryption: true })
        const pages = await out.copyPages(src, src.getPageIndices())
        pages.forEach(p => out.addPage(p))
      }
      const bytes = await out.save()
      results.value.push({
        filename: 'merged.pdf',
        data: bytes,
        size: bytes.byteLength,
        pages: out.getPageCount()
      })
    } else {
      const item = pdfFiles.value[0]
      const src = await PDFDocument.load(await item.file.arrayBuffer(), { ignoreEncryption: true })
      const total = src.getPageCount()
      const base = item.file.name.replace(/\.pdf$/i, '')

      let groups = []
      if (splitStrategy.value === 'range') {
        const indices = parseRanges(pageRange.value).filter(i => i < total)
        if (indices.length === 0) throw new Error('RANGE')
        groups.push({ label: `p${indices[0] + 1}-${indices[indices.length - 1] + 1}`, indices })
      } else {
        const size = Math.max(1, chunkSize.value)
        for (let start = 0; start < total; start += size) {
          const indices = Array.from({ length: Math.min(size, total - start) }, (_, k) => start + k)
          groups.push({ label: `p${start + 1}-${start + indices.length}`, indices })
        }
      }

      const outputs = []
      for (const group of groups) {
        const out = await PDFDocument.create()
        const pages = await out.copyPages(src, group.indices)
        pages.forEach(p => out.addPage(p))
        const bytes = await out.save()
        outputs.push({
          filename: `${base}_${group.label}.pdf`,
          data: bytes,
          size: bytes.byteLength,
          pages: group.indices.length
        })
      }
      results.value = outputs
    }

    processingDuration.value = Math.round(performance.now() - startTime)
  } catch (err) {
    if (err.message === 'RANGE') {
      error.value = '页码范围无效，请输入 1 到 ' + totalPages.value + ' 之间的页码或区间。'
    } else {
      error.value = 'PDF 处理失败，文件可能已损坏或受加密保护。' + (err.message ? `（${err.message}）` : '')
    }
  } finally {
    processing.value = false
  }
}

const processingDuration = ref(0)

// ---------- 下载 ----------
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadOne = (item) => {
  downloadBlob(new Blob([item.data], { type: 'application/pdf' }), item.filename)
}

const downloadAll = async () => {
  if (results.value.length <= 1) {
    downloadOne(results.value[0])
    return
  }
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  for (const item of results.value) {
    zip.file(item.filename, item.data)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, `pdf-split_${Date.now()}.zip`)
}
</script>
