<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <KeyRound class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PDF密码解除</h1>
          <p class="text-sm text-muted-foreground mt-1">输入已知密码解除打开限制并另存，重编码为无密码版本</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传自己设置过密码、但一时想不起要长期保管的 PDF，输入已知密码后在浏览器本地解密并重编码为无密码版本另存。文件全程不上传服务器，本工具仅限处理合法自有文件。
      </p>
    </div>

    <!-- 合规声明 -->
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-red-700 dark:text-red-300 leading-relaxed">
        <strong>合规声明：</strong>本工具仅用于解除<strong>自己设置密码后忘记</strong>的合法自有文件，操作全程在浏览器本地完成。请勿用于破解、绕开他人文件的保护措施，由此产生的法律责任由使用者自行承担；工具不提供、也不会尝试猜测任何未知密码。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 文件与密码 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold mb-1 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择文件并输入密码
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
              class="hidden"
              @change="handleFileChange"
            />
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入一个 PDF 文件</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 纯本地处理，文件不上传
            </p>
          </div>
          <div v-if="fileName" class="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <FileText class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">{{ formatSize(fileSize) }}</p>
            </div>
            <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">打开密码</label>
            <input
              v-model="password"
              type="password"
              autocomplete="off"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="输入该 PDF 的打开密码"
              @keyup.enter="removePassword"
            />
            <p class="text-xs text-muted-foreground mt-1.5">密码仅在本机内存中用于解密，不会保存或发送</p>
          </div>

          <button
            @click="removePassword"
            :disabled="!file || processing"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <KeyRound v-else class="w-4 h-4" />
            {{ processing ? '解密重建中…' : '解除密码并下载' }}
          </button>
        </div>

        <!-- 处理说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Info class="w-5 h-5 mr-2 text-primary" /> 处理方式说明
          </h2>
          <div class="flex items-start gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2.5">
            <Info class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">
              解除采用重编码方案：用密码解密后逐页重建为<strong>图像型 PDF</strong>，文字不可再选中。用于自己设置密码后忘记的文件，仅限合法自有文件。
            </p>
          </div>
          <ul class="text-xs text-muted-foreground space-y-1.5 mt-3 list-disc pl-4">
            <li>密码错误会明确提示，不会尝试猜测</li>
            <li>输出文件不再需要密码即可打开</li>
            <li>仅设了权限密码（可打开但禁止打印/复制）的文件无需输入密码即可直接处理</li>
          </ul>
        </div>
      </div>

      <!-- 右侧结果区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 处理结果
        </h2>

        <!-- 空状态 -->
        <div v-if="!result && !processing" class="py-16 text-center text-muted-foreground">
          <KeyRound class="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p class="text-sm">选择文件、输入密码后点击「解除密码并下载」</p>
          <p class="text-xs mt-1">输出为无密码的新文件，原文件不会被修改</p>
        </div>

        <!-- 进度 -->
        <div v-if="processing" class="py-10">
          <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
            <Loader2 class="w-4 h-4 animate-spin" />
            {{ progressLabel }}
          </div>
          <div class="max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary transition-all" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>

        <!-- 前后对比 -->
        <div v-else-if="result" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Lock class="w-3 h-3" /> 原文件
              </p>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">页数</span>
                  <span class="text-foreground font-medium">{{ result.pages }} 页</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">大小</span>
                  <span class="text-foreground font-medium">{{ formatSize(result.origSize) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">打开限制</span>
                  <span class="text-red-600 dark:text-red-400 font-medium">需要密码</span>
                </div>
              </div>
            </div>
            <div class="bg-green-500/10 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <LockOpen class="w-3 h-3" /> 输出文件
              </p>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">页数</span>
                  <span class="text-foreground font-medium">{{ result.pages }} 页</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">大小</span>
                  <span class="text-foreground font-medium">{{ formatSize(result.newSize) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">打开限制</span>
                  <span class="text-green-600 dark:text-green-400 font-medium">无密码</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-2 bg-muted/50 border border-border rounded-lg px-3 py-2.5">
            <Info class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p class="text-xs text-muted-foreground leading-relaxed">输出为图像型 PDF：任何设备打开都不再需要密码，但文字不可再选中、检索。</p>
          </div>

          <button
            @click="downloadResult"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" /> 下载无密码 PDF（{{ outputName }}）
          </button>
        </div>

        <!-- 错误 -->
        <div v-if="error" class="mt-4 flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5">
          <FileWarning class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p class="text-xs text-destructive leading-relaxed">{{ error }}</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 PDF 密码解除</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            自己给重要文件设了打开密码，时间一长密码想不起来，文件又需要长期保管或换设备查阅——这时需要一份"输入已知密码、去掉打开限制"的工具。本工具全程在浏览器本地完成解密与重建，文件不上传任何服务器。
          </p>
          <h3 class="text-lg font-semibold text-foreground">适用场景与合规边界</h3>
          <p>
            仅限处理<strong>自己设置密码后忘记</strong>的合法自有文件。工具不会尝试猜测任何未知密码：密码错误会明确提示，空密码的加密文件会提示需要输入密码。请勿用于绕开他人文件的保护措施，破解他人加密文件可能违反《刑法》285 条及相关法律。
          </p>
          <h3 class="text-lg font-semibold text-foreground">"需要密码"与"密码错误"的区别</h3>
          <p>
            加密 PDF 分两种提示：文件加密但未输入密码时提示"该 PDF 已设置打开密码，请输入密码后重试"；输入了密码但解密失败则提示"密码错误，请核对后重试（区分大小写）"。另外，只设了权限密码（能打开但禁止打印复制）的文件无需密码即可直接处理。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">文件会上传到服务器吗？</span>不会。解密、重编码、下载全部在浏览器本地完成，密码同样只在本机内存中使用。</li>
            <li><span class="text-foreground font-medium">能破解不知道密码的文件吗？</span>不能。本工具必须输入正确密码才能解除，不提供任何猜测或暴力破解能力。</li>
            <li><span class="text-foreground font-medium">为什么解除后文字不能复制了？</span>输出采用图像型重编码方案，页面以高清图像呈现以彻底移除加密层；如需可复制的版本，请保留好原文件与密码。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pdf-password-remover'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  KeyRound, FileText, FileUp, FileWarning, Upload, Download, X, Loader2, CheckCircle,
  ShieldCheck, Info, Lock, LockOpen, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PDF密码解除 - 输入已知密码本地解除打开限制',
  description: '在线 PDF 密码解除工具，输入已知打开密码本地解密并重编码为无密码版本，区分需要密码/密码错误提示，仅限合法自有文件，文件不上传服务器',
  keywords: 'pdf解除密码, pdf解密, pdf去掉密码, unlock pdf, pdf密码移除, pdf解锁',
  author: 'Util工具箱',
  ogTitle: 'PDF密码解除 - 有条工具',
  ogDescription: '输入已知密码解除 PDF 打开限制并另存，重编码为无密码版本',
  ogUrl: 'https://www.util.cn/tools/pdf-password-remover',
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
          name: 'PDF密码解除',
          url: 'https://www.util.cn/tools/pdf-password-remover',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['已知密码解除打开限制', '错误分类提示', '前后页数大小对比', '权限密码文件直通', '纯本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PDF密码解除', item: 'https://www.util.cn/tools/pdf-password-remover/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '解除密码会上传文件到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解密、重编码、下载全部在浏览器本地完成，密码只在本机内存中使用。' }
            },
            {
              '@type': 'Question',
              name: '能破解不知道密码的文件吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。必须输入正确密码才能解除，工具不提供任何猜测或暴力破解能力。' }
            },
            {
              '@type': 'Question',
              name: '为什么解除后文字不能复制了？',
              acceptedAnswer: { '@type': 'Answer', text: '输出为图像型重编码方案，页面以高清图像呈现以彻底移除加密层。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pdf-password-remover')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- pdf.js 加载（动态 import，仅在用户交互回调内调用） ----------
let pdfjsLib = null
const loadPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib
  const lib = await import('pdfjs-dist')
  try {
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    lib.GlobalWorkerOptions.workerSrc = workerUrl
  } catch (e) {
    // 降级：worker 资源加载失败时置空，由 pdf.js 回退主线程解析
    console.warn('PDF worker 加载失败，回退主线程模式', e)
    lib.GlobalWorkerOptions.workerSrc = ''
  }
  pdfjsLib = lib
  return pdfjsLib
}

// ---------- 纯函数（可独立测试） ----------
// PDF 打开错误分类：wrong_password（密码错误）/ need_password（需要密码）/ other
// 依据 pdf.js PasswordException 的 code：1=NEED_PASSWORD，2=INCORRECT_PASSWORD
const classifyPdfError = (err, hasPassword) => {
  if (err && err.name === 'PasswordException') {
    if (err.code === 2) return 'wrong_password'
    if (err.code === 1) return 'need_password'
    return hasPassword ? 'wrong_password' : 'need_password'
  }
  return 'other'
}

// 错误分类 → 用户提示文案
const pdfErrorMessages = {
  wrong_password: '密码错误：请核对密码后重试（注意区分大小写）。',
  need_password: '该 PDF 已设置打开密码，请输入密码后重试。',
  other: '无法读取该 PDF，文件可能已损坏或格式异常，请确认后重试。'
}

// 字节大小格式化
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 状态 ----------
const file = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const fileInput = ref(null)
const isDragging = ref(false)
const processing = ref(false)
const error = ref('')
const password = ref('')
const result = ref(null)
const progressLabel = ref('')
const progressPercent = ref(0)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const outputName = computed(() => {
  const base = (fileName.value || 'document').replace(/\.pdf$/i, '')
  return `${base}-已解除密码.pdf`
})

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetResult = () => { result.value = null; error.value = ''; progressLabel.value = ''; progressPercent.value = 0 }

const clearFile = () => {
  file.value = null
  fileName.value = ''
  fileSize.value = 0
  password.value = ''
  resetResult()
}

const acceptFile = (f) => {
  if (!f) return
  if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') {
    error.value = '请选择 PDF 文件'
    return
  }
  clearFile()
  file.value = f
  fileName.value = f.name
  fileSize.value = f.size
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

// ---------- 主流程 ----------
const removePassword = async () => {
  if (!file.value) {
    error.value = '请先选择 PDF 文件'
    return
  }
  processing.value = true
  error.value = ''
  result.value = null
  try {
    const lib = await loadPdfJs()
    progressLabel.value = '正在解密…'
    progressPercent.value = 8

    const buf = await file.value.arrayBuffer()
    const pwd = password.value
    let doc
    try {
      doc = await lib.getDocument({
        data: new Uint8Array(buf),
        password: pwd || undefined
      }).promise
    } catch (openErr) {
      const kind = classifyPdfError(openErr, Boolean(pwd))
      throw new Error(pdfErrorMessages[kind])
    }
    progressPercent.value = 25

    const { PDFDocument } = await import('pdf-lib')
    const outDoc = await PDFDocument.create()
    const total = doc.numPages

    for (let n = 1; n <= total; n++) {
      const page = await doc.getPage(n)
      // 原始页面尺寸（pt）
      const baseViewport = page.getViewport({ scale: 1 })
      const wPt = baseViewport.width
      const hPt = baseViewport.height

      // 渲染为 JPEG（144dpi、质量 0.85，清晰度与体积平衡）
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: ctx, viewport }).promise
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas 导出失败'))), 'image/jpeg', 0.85)
      })
      const img = await outDoc.embedJpg(new Uint8Array(await blob.arrayBuffer()))
      const newPage = outDoc.addPage([wPt, hPt])
      newPage.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt })
      page.cleanup()

      progressLabel.value = `正在重建第 ${n} / ${total} 页…`
      progressPercent.value = 25 + Math.round((n / total) * 70)
      await new Promise((r) => setTimeout(r, 0))
    }

    const outBytes = await outDoc.save()
    result.value = {
      pages: total,
      origSize: fileSize.value,
      newSize: outBytes.byteLength,
      data: outBytes
    }
    progressLabel.value = ''
    progressPercent.value = 100
    try { doc.destroy() } catch (e) { /* 忽略销毁异常 */ }
  } catch (e) {
    error.value = e && e.message ? e.message : '处理失败，请重试。'
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
