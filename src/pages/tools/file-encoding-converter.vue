<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Languages class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">文件编码批量转换器</h1>
          <p class="text-sm text-muted-foreground mt-1">自动检测 UTF-8 / GBK / Big5 等编码，一键批量转为 UTF-8，纯本地处理</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        多选文本文件后自动逐个检测编码（BOM 识别、严格 UTF-8 试解、GBK 回退），列表中可查看检出编码与内容预览；支持手动指定源编码覆盖检测结果，单个或批量「转 UTF-8」下载。全部处理在浏览器本地完成，文件不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：上传与操作 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Upload class="w-5 h-5 mr-2 text-primary" /> 选择文本文件
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
              multiple
              accept=".txt,.csv,.md,.json,.xml,.html,.htm,.js,.css,.log,.ini,.sql,.yaml,.yml,text/*"
              class="hidden"
              @change="handleFileChange"
            />
            <File v-if="files.length === 0" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p class="text-xs text-muted-foreground">点击选择或拖入多个文本文件<br />（.txt / .csv / .md / .json 等）</p>
          </div>
          <p class="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            建议单个文件在 20MB 以内；UTF-16 文件通过 BOM 自动识别。
          </p>
        </div>

        <!-- 批量操作 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Settings2 class="w-4 h-4 mr-2 text-primary" /> 批量操作
          </h3>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ files.length }}</p>
              <p class="text-xs text-muted-foreground">文件总数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ selectedCount }}</p>
              <p class="text-xs text-muted-foreground">已选中</p>
            </div>
          </div>
          <div class="space-y-2">
            <button
              @click="toggleSelectAll"
              :disabled="files.length === 0"
              class="w-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle v-if="allSelected" class="w-3.5 h-3.5" />
              <File v-else class="w-3.5 h-3.5" />
              {{ allSelected ? '取消全选' : '全选文件' }}
            </button>
            <button
              @click="batchConvert"
              :disabled="selectedCount === 0 || converting"
              class="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Loader2 v-if="converting" class="w-3.5 h-3.5 animate-spin" />
              <Download v-else class="w-3.5 h-3.5" />
              {{ converting ? '批量转换中…' : `批量转换下载（${selectedCount}）` }}
            </button>
            <button
              @click="clearAll"
              :disabled="files.length === 0"
              class="w-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 class="w-3.5 h-3.5" /> 清空列表
            </button>
          </div>
        </div>

        <!-- 检测说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 检测规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 优先查 BOM：<span class="text-foreground">EF BB BF</span> → UTF-8（BOM）；<span class="text-foreground">FF FE</span> → UTF-16LE；<span class="text-foreground">FE FF</span> → UTF-16BE</li>
            <li>• 无 BOM 时用严格模式试解 UTF-8，成功即判定为 UTF-8</li>
            <li>• UTF-8 试解失败则按 GBK 解码，标记「疑似 GBK/GB2312」（两者共用字符集，无法进一步区分）</li>
            <li>• 检测结果仅供参考，可在列表中手动指定源编码覆盖</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：文件列表 -->
      <div class="lg:col-span-2">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileText class="w-5 h-5 mr-2 text-primary" /> 文件列表
            </h2>
          </div>
          <div class="p-6">
            <!-- 空状态 -->
            <div v-if="files.length === 0" class="py-16 text-center">
              <FileText class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">选择文本文件后，这里会显示编码检测结果</p>
            </div>
            <!-- 列表 -->
            <div v-else class="divide-y divide-border">
              <div v-for="item in files" :key="item.id" class="flex items-start gap-3 py-4">
                <input
                  type="checkbox"
                  v-model="item.selected"
                  class="mt-1 accent-primary flex-shrink-0"
                  :aria-label="'选择 ' + item.name"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-foreground truncate" :title="item.name">{{ item.name }}</p>
                    <span class="text-xs text-muted-foreground flex-shrink-0">{{ formatBytes(item.size) }}</span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1 truncate font-mono" :title="item.preview">
                    {{ item.preview || '（无法预览内容）' }}
                  </p>
                  <div class="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                      :class="isUtf8Like(item) ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'"
                    >
                      <CheckCircle v-if="isUtf8Like(item)" class="w-3 h-3" />
                      <AlertTriangle v-else class="w-3 h-3" />
                      {{ item.detected.label }}
                    </span>
                    <label class="text-xs text-muted-foreground flex items-center gap-1.5">
                      源编码
                      <select
                        v-model="item.override"
                        @change="refreshPreview(item)"
                        class="bg-muted text-foreground text-xs rounded px-1.5 py-1 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="auto">自动（{{ item.detected.short }}）</option>
                        <option v-for="enc in manualEncodings" :key="enc.value" :value="enc.value">{{ enc.label }}</option>
                      </select>
                    </label>
                  </div>
                </div>
                <button
                  @click="downloadOne(item)"
                  class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-xs transition-all flex items-center gap-1 flex-shrink-0 mt-0.5"
                  title="转换为 UTF-8 并下载"
                >
                  <Download class="w-3.5 h-3.5" /> 转UTF-8下载
                </button>
              </div>
            </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于文件编码批量转换器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            从旧系统导出的 CSV 是 GBK 编码、代码文件是 Big5、日志是 Shift_JIS……现代工具链默认 UTF-8，编码不一致就会出现乱码或导入失败。本工具批量检测文件的真实编码，并把它们统一转换为 UTF-8，处理过程全部在浏览器本地完成。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>旧系统导出的 GBK/GB2312 CSV、TXT 导入数据库或 Git 前统一转 UTF-8</li>
            <li>接收来自港台（Big5）、日本（Shift_JIS）地区的文本文件后转为 UTF-8</li>
            <li>批量检查一批文件的编码，确认是否带 BOM、是否为 UTF-16</li>
            <li>自动检测结果不准时，手动指定源编码强制转换</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">能 100% 准确检测编码吗？</span>不能。编码检测本质是启发式：带 BOM 的文件可准确识别；UTF-8 有严格校验，可靠度高；GBK/GB2312 与其他多字节编码只能「疑似」判定，建议转换前核对预览内容。</li>
            <li><span class="text-foreground font-medium">转换后文件名是什么？</span>原文件名加 -utf8 后缀，扩展名保持不变。</li>
            <li><span class="text-foreground font-medium">文件会上传吗？</span>不会，检测与转换全部在浏览器本地完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'file-encoding-converter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Languages, Upload, File, FileCheck, FileText, Settings2, CheckCircle, AlertTriangle,
  Download, Trash2, Info, Loader2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '文件编码批量转换器 - 检测GBK/UTF-8编码并批量转UTF-8',
  description: '在线文件编码检测与批量转换工具，自动识别UTF-8/GBK/GB2312/Big5/Shift_JIS/UTF-16编码，一键批量转换为UTF-8下载，纯本地处理不上传',
  keywords: '编码检测, 文件编码转换, gbk转utf-8, 批量转utf8, gb2312转utf8, big5, shift_jis, 编码识别',
  author: 'Util工具箱',
  ogTitle: '文件编码批量转换器 - 有条工具',
  ogDescription: '自动检测 UTF-8 / GBK / Big5 等编码，一键批量转为 UTF-8，纯本地处理',
  ogUrl: 'https://www.util.cn/tools/file-encoding-converter',
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
          name: '文件编码批量转换器',
          url: 'https://www.util.cn/tools/file-encoding-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['BOM识别UTF-8/UTF-16', '严格UTF-8校验检测', 'GBK疑似编码回退判定', '手动指定源编码', '批量转UTF-8下载']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '文件编码批量转换器', item: 'https://www.util.cn/tools/file-encoding-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '文件编码检测能100%准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。带BOM可准确识别，UTF-8可靠度高，GBK等多字节编码只能疑似判定，建议结合预览内容确认。' }
            },
            {
              '@type': 'Question',
              name: '批量转换会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，编码检测与转换全部在浏览器本地完成，数据不出设备。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'file-encoding-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const files = ref([])
const isDragging = ref(false)
const converting = ref(false)
const seoContentVisible = ref(true)
const fileInput = ref(null)
let fileSeq = 0

const manualEncodings = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'gbk', label: 'GBK' },
  { value: 'gb18030', label: 'GB18030' },
  { value: 'big5', label: 'Big5' },
  { value: 'shift_jis', label: 'Shift_JIS' },
  { value: 'latin1', label: 'Latin1' }
]

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 工具函数 ----------
const formatBytes = (n) => {
  if (!n || n <= 0) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

const decodeBytes = (bytes, enc) => {
  try {
    return new TextDecoder(enc).decode(bytes)
  } catch (e) {
    return ''
  }
}

// 编码检测：BOM → 严格 UTF-8 试解 → GBK 回退
const detectEncoding = (bytes) => {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { label: 'UTF-8 (BOM)', short: 'UTF-8', dec: 'utf-8' }
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { label: 'UTF-16LE (BOM)', short: 'UTF-16LE', dec: 'utf-16le' }
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { label: 'UTF-16BE (BOM)', short: 'UTF-16BE', dec: 'utf-16be' }
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return { label: 'UTF-8', short: 'UTF-8', dec: 'utf-8' }
  } catch (e) {
    return { label: '疑似 GBK/GB2312', short: 'GBK', dec: 'gbk' }
  }
}

const effectiveDec = (item) => {
  return item.override === 'auto' ? item.detected.dec : item.override
}

const isUtf8Like = (item) => {
  return effectiveDec(item) === 'utf-8'
}

const buildPreview = (bytes, dec) => {
  const text = decodeBytes(bytes, dec)
  return text.slice(0, 40).replace(/\s+/g, ' ').trim()
}

const refreshPreview = (item) => {
  item.preview = buildPreview(item.bytes, effectiveDec(item))
}

// ---------- 读取文件 ----------
const addFiles = async (fileList) => {
  const list = Array.from(fileList || [])
  for (const file of list) {
    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const detected = detectEncoding(bytes)
      files.value.push({
        id: ++fileSeq,
        name: file.name,
        size: file.size,
        bytes,
        detected,
        override: 'auto',
        selected: true,
        preview: buildPreview(bytes, detected.dec)
      })
    } catch (e) {
      // 单个文件读取失败不影响其他文件
    }
  }
}

// ---------- 转换下载 ----------
const downloadOne = (item) => {
  const text = decodeBytes(item.bytes, effectiveDec(item))
  if (!text && item.size > 0) {
    alert(`「${item.name}」按当前源编码解码失败，请手动指定正确的源编码。`)
    return
  }
  const encoded = new TextEncoder().encode(text)
  const blob = new Blob([encoded], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dot = item.name.lastIndexOf('.')
  const base = dot > 0 ? item.name.slice(0, dot) : item.name
  const ext = dot > 0 ? item.name.slice(dot) : ''
  a.href = url
  a.download = `${base}-utf8${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const batchConvert = async () => {
  const list = files.value.filter(f => f.selected)
  if (list.length === 0) return
  converting.value = true
  try {
    for (const item of list) {
      downloadOne(item)
      // 逐个触发下载，间隔避免被浏览器拦截
      await new Promise(resolve => setTimeout(resolve, 350))
    }
  } finally {
    converting.value = false
  }
}

// ---------- 选择 ----------
const selectedCount = computed(() => files.value.filter(f => f.selected).length)
const allSelected = computed(() => files.value.length > 0 && selectedCount.value === files.value.length)

const toggleSelectAll = () => {
  const target = !allSelected.value
  files.value.forEach(f => { f.selected = target })
}

// ---------- 交互 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  addFiles(e.target.files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  addFiles(e.dataTransfer?.files)
}

const clearAll = () => {
  files.value = []
}
</script>
