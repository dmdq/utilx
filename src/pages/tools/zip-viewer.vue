<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileArchive class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">ZIP压缩包查看器</h1>
          <p class="text-sm text-muted-foreground mt-1">不解压落盘，在线浏览 ZIP 内容，文本可预览、可单独下载</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择 ZIP 压缩包，在浏览器本地列出全部条目的文件名、原始大小、压缩后大小与修改时间；文本类文件可直接预览内容，任意文件支持单独解压下载。全部操作在本地完成，文件不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：上传与汇总 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 选择压缩包
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
              accept=".zip,application/zip"
              class="hidden"
              @change="handleFileChange"
            />
            <File v-if="!zipName" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p v-if="!zipName" class="text-xs text-muted-foreground">点击选择或拖入 .zip 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ zipName }}</p>
          </div>
          <p class="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            仅支持标准 ZIP 格式（不含 RAR/7z）；加密压缩包暂不支持，建议文件在 200MB 以内。
          </p>
        </div>

        <!-- 汇总信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <FileSearch class="w-4 h-4 mr-2 text-primary" /> 汇总信息
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ entries.length }}</p>
              <p class="text-xs text-muted-foreground">文件条目</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-base font-bold text-foreground">{{ compressionRatio }}</p>
              <p class="text-xs text-muted-foreground">压缩率</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-sm font-bold text-foreground">{{ formatBytes(totalOriginal) }}</p>
              <p class="text-xs text-muted-foreground">原始总大小</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-sm font-bold text-foreground">{{ formatBytes(totalCompressed) }}</p>
              <p class="text-xs text-muted-foreground">压缩后总大小</p>
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

      <!-- 右侧：条目列表与预览 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileArchive class="w-5 h-5 mr-2 text-primary" /> 条目列表
            </h2>
            <p v-if="zipName" class="text-xs text-muted-foreground truncate max-w-[16rem]" :title="zipName">{{ zipName }}（{{ formatBytes(zipSize) }}）</p>
          </div>
          <div class="p-6">
            <!-- 加载中 -->
            <div v-if="loading" class="py-16 text-center">
              <Loader2 class="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
              <p class="text-sm text-muted-foreground">正在读取压缩包…</p>
            </div>
            <!-- 错误 -->
            <div v-else-if="errorMsg" class="py-16 text-center">
              <FileWarning class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">读取失败</p>
              <p class="text-xs text-muted-foreground">{{ errorMsg }}</p>
            </div>
            <!-- 列表 -->
            <div v-else-if="entries.length > 0" class="overflow-auto border border-border rounded-lg max-h-[30rem] divide-y divide-border">
              <div
                v-for="entry in entries"
                :key="entry.path"
                class="flex items-center gap-3 px-3 py-2 hover:bg-muted/40"
              >
                <component :is="entryIcon(entry)" class="w-4 h-4 text-primary flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-foreground truncate font-mono" :title="entry.path">{{ entry.path }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    {{ formatBytes(entry.size) }} → {{ formatBytes(entry.compSize) }} · {{ formatDate(entry.date) }}
                  </p>
                </div>
                <button
                  v-if="isPreviewable(entry)"
                  @click="previewEntry(entry)"
                  class="bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1.5 rounded text-xs transition-all flex items-center gap-1 flex-shrink-0"
                  title="预览内容"
                >
                  <Eye class="w-3.5 h-3.5" /> 预览
                </button>
                <button
                  @click="downloadEntry(entry)"
                  class="bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1.5 rounded text-xs transition-all flex items-center gap-1 flex-shrink-0"
                  title="解压下载该文件"
                >
                  <Download class="w-3.5 h-3.5" /> 下载
                </button>
              </div>
            </div>
            <!-- 空状态 -->
            <div v-else class="py-16 text-center">
              <FileArchive class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">选择 ZIP 文件后，这里会列出包内全部条目</p>
            </div>
          </div>
        </div>

        <!-- 文本预览 -->
        <div v-if="previewPath" class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 class="text-sm font-semibold text-foreground flex items-center min-w-0">
              <FileText class="w-4 h-4 mr-2 text-primary flex-shrink-0" />
              <span class="truncate font-mono" :title="previewPath">{{ previewPath }}</span>
            </h3>
            <div class="flex items-center gap-2 flex-shrink-0 ml-3">
              <button
                @click="copyPreview"
                :disabled="!previewText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="closePreview"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <EyeOff class="w-3.5 h-3.5" /> 收起
              </button>
            </div>
          </div>
          <div class="p-6">
            <div v-if="previewLoading" class="py-10 text-center">
              <Loader2 class="w-6 h-6 mx-auto mb-2 text-primary animate-spin" />
              <p class="text-sm text-muted-foreground">正在解压读取…</p>
            </div>
            <template v-else>
              <textarea
                :value="previewText"
                readonly
                class="w-full h-80 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
                spellcheck="false"
              ></textarea>
              <p v-if="previewTruncated" class="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <Info class="w-3.5 h-3.5" />
                内容较长，仅显示前 200KB；可下载该文件查看完整内容。
              </p>
            </template>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于ZIP压缩包查看器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            拿到一个 ZIP 压缩包，只想看一眼里面有什么，却不想把所有文件解压到磁盘？本工具在浏览器本地直接读取 ZIP 中央目录，列出全部条目的名称、大小与修改时间，文本类文件（代码、配置、文档等）可在线预览，任意文件都能单独解压下载，无需安装解压软件。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>下载资源包 / 前端构建产物后，先浏览内容再决定要不要解压</li>
            <li>查看压缩包内的 README、配置文件、源码片段，直接复制使用</li>
            <li>核对压缩包内文件清单与压缩率，判断打包是否合理</li>
            <li>只提取压缩包里需要的某一个文件，不必解压全部内容</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些格式？</span>支持标准 ZIP（.zip）；RAR、7z 等其他格式暂不支持。</li>
            <li><span class="text-foreground font-medium">加密的 ZIP 能看吗？</span>暂不支持带密码的压缩包，请先解密后再使用。</li>
            <li><span class="text-foreground font-medium">哪些文件可以预览？</span>常见文本类扩展名（txt/json/md/csv/html/js/css 等）且小于 1MB 的条目可预览；其他文件可下载后查看。</li>
            <li><span class="text-foreground font-medium">文件会上传吗？</span>不会，解压、预览、下载全部在浏览器本地完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'zip-viewer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileArchive, Upload, File, FileCheck, FileSearch, FileText, FileCode, Eye, EyeOff,
  Download, Copy, Trash2, Info, FileWarning, Loader2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'ZIP压缩包查看器 - 在线解压预览ZIP文件内容',
  description: '在线ZIP查看器，浏览器本地列出压缩包内全部文件条目与压缩率，文本文件在线预览，支持单个文件解压下载，不上传数据',
  keywords: 'zip查看器, 在线解压, zip在线预览, zip文件查看, 解压下载, 压缩包预览',
  author: 'Util工具箱',
  ogTitle: 'ZIP压缩包查看器 - 有条工具',
  ogDescription: '不解压落盘，在线浏览 ZIP 内容，文本可预览、可单独下载',
  ogUrl: 'https://www.util.cn/tools/zip-viewer',
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
          name: 'ZIP压缩包查看器',
          url: 'https://www.util.cn/tools/zip-viewer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['ZIP条目列表浏览', '文本文件在线预览', '单个文件解压下载', '压缩率统计', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'ZIP压缩包查看器', item: 'https://www.util.cn/tools/zip-viewer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'ZIP查看器支持加密压缩包吗？',
              acceptedAnswer: { '@type': 'Answer', text: '暂不支持带密码的 ZIP，请先解密后再使用。' }
            },
            {
              '@type': 'Question',
              name: 'ZIP查看会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，列出条目、预览与解压下载全部在浏览器本地完成。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'zip-viewer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const zipName = ref('')
const zipSize = ref(0)
const entries = ref([])
const loading = ref(false)
const errorMsg = ref('')
const isDragging = ref(false)
const seoContentVisible = ref(true)
const fileInput = ref(null)

const previewPath = ref('')
const previewText = ref('')
const previewLoading = ref(false)
const previewTruncated = ref(false)

const PREVIEW_MAX = 200 * 1024
const TEXT_SIZE_LIMIT = 1024 * 1024

const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'conf', 'env', 'log',
  'html', 'htm', 'css', 'scss', 'less', 'js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'vue', 'svg',
  'sh', 'bash', 'py', 'rb', 'go', 'rs', 'php', 'java', 'c', 'h', 'cpp', 'hpp', 'cs', 'sql', 'gitignore'
])

// jszip 较大，仅在函数内动态加载；zip 实例不放入响应式
let JSZipLib = null
let zipEntries = null

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 工具函数 ----------
const formatBytes = (n) => {
  if (!n || n <= 0) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB'
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const formatDate = (d) => {
  if (!d) return '-'
  try {
    const date = d instanceof Date ? d : new Date(d)
    const p = (x) => String(x).padStart(2, '0')
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
  } catch (e) {
    return '-'
  }
}

const extOf = (path) => {
  const base = path.split('/').pop() || ''
  const idx = base.lastIndexOf('.')
  return idx > 0 ? base.slice(idx + 1).toLowerCase() : ''
}

const totalOriginal = computed(() => entries.value.reduce((sum, e) => sum + e.size, 0))
const totalCompressed = computed(() => entries.value.reduce((sum, e) => sum + e.compSize, 0))

const compressionRatio = computed(() => {
  if (totalOriginal.value <= 0) return '-'
  const ratio = (1 - totalCompressed.value / totalOriginal.value) * 100
  if (ratio < 0) return '0%'
  return ratio.toFixed(1) + '%'
})

const entryIcon = (entry) => {
  const ext = extOf(entry.path)
  if (['js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'vue', 'css', 'scss', 'less', 'html', 'htm', 'svg', 'json', 'xml', 'sql', 'sh', 'py', 'rb', 'go', 'rs', 'php', 'java', 'c', 'h', 'cpp', 'hpp', 'cs'].includes(ext)) return FileCode
  if (TEXT_EXTS.has(ext)) return FileText
  return File
}

const isPreviewable = (entry) => {
  return TEXT_EXTS.has(extOf(entry.path)) && entry.size > 0 && entry.size <= TEXT_SIZE_LIMIT
}

// ---------- 读取 ZIP ----------
const readZip = async (file) => {
  loading.value = true
  errorMsg.value = ''
  closePreview()
  try {
    if (!JSZipLib) JSZipLib = await import('jszip')
    const buffer = await file.arrayBuffer()
    const zip = await JSZipLib.loadAsync(buffer)
    zipEntries = zip.files
    const list = []
    zip.forEach((path, entry) => {
      if (entry.dir) return
      const meta = entry._data || {}
      list.push({
        path,
        entry,
        size: meta.uncompressedSize || 0,
        compSize: meta.compressedSize || 0,
        date: entry.date || null
      })
    })
    // 按目录/路径排序，使同目录文件聚集在一起
    list.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    zipName.value = file.name
    zipSize.value = file.size
    entries.value = list
    if (list.length === 0) {
      errorMsg.value = '压缩包内没有文件条目。'
    }
  } catch (err) {
    clearData()
    errorMsg.value = '无法读取该压缩包，请确认是未加密的标准 ZIP 格式。'
  } finally {
    loading.value = false
  }
}

// ---------- 预览 ----------
const previewEntry = async (item) => {
  previewPath.value = item.path
  previewText.value = ''
  previewTruncated.value = false
  previewLoading.value = true
  try {
    const text = await item.entry.async('string')
    if (text.length > PREVIEW_MAX) {
      previewText.value = text.slice(0, PREVIEW_MAX)
      previewTruncated.value = true
    } else {
      previewText.value = text
    }
  } catch (err) {
    previewText.value = ''
    alert('读取该文件内容失败，可能是不支持的编码或已损坏。')
  } finally {
    previewLoading.value = false
  }
}

const closePreview = () => {
  previewPath.value = ''
  previewText.value = ''
  previewTruncated.value = false
  previewLoading.value = false
}

const copyPreview = async () => {
  if (!previewText.value) return
  try {
    await navigator.clipboard.writeText(previewText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = previewText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

// ---------- 下载 ----------
const downloadEntry = async (item) => {
  try {
    const blob = await item.entry.async('blob')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.path.split('/').pop() || 'file'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    alert('解压下载该文件失败。')
  }
}

// ---------- 交互 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  const selected = e.target.files?.[0]
  if (selected) readZip(selected)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) readZip(dropped)
}

const clearData = () => {
  zipEntries = null
  zipName.value = ''
  zipSize.value = 0
  entries.value = []
}

const clearAll = () => {
  clearData()
  closePreview()
  errorMsg.value = ''
}
</script>
