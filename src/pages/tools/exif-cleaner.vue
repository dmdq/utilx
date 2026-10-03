<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ShieldCheck class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">EXIF清除器</h1>
          <p class="text-sm text-muted-foreground mt-1">一键清除照片中的 GPS 定位、拍摄设备等隐私信息，纯本地处理</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        手机拍摄的照片通常携带 EXIF 元数据：GPS 定位、拍摄时间、设备型号、拍摄参数等。本工具在浏览器本地解析并清除这些敏感信息后重新输出图片，文件不会上传到任何服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：上传与配置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ImageUp class="w-5 h-5 mr-2 text-primary" /> 选择图片
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
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload v-if="!file" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p v-if="!file" class="text-sm text-muted-foreground">点击选择或拖入图片（JPG / PNG / WebP）</p>
            <template v-else>
              <p class="text-sm font-medium text-foreground truncate">{{ file.name }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ formatSize(file.size) }}</p>
            </template>
          </div>

          <!-- 输出格式 -->
          <div class="mt-6" v-if="file">
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

          <!-- 质量滑块 -->
          <div class="mt-4" v-if="file && outputFormat !== 'png'">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-foreground">输出质量</label>
              <span class="text-sm text-muted-foreground">{{ Math.round(quality * 100) }}%</span>
            </div>
            <input
              v-model.number="quality"
              type="range"
              min="0.3"
              max="1"
              step="0.01"
              class="w-full accent-primary"
            />
          </div>

          <!-- 清除按钮 -->
          <button
            @click="cleanImage"
            :disabled="!file || processing"
            class="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Eraser v-else class="w-4 h-4" />
            {{ processing ? '处理中...' : '清除元数据并下载' }}
          </button>
        </div>

        <!-- 隐私说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Lock class="w-4 h-4 mr-2 text-primary" /> 隐私保障
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 图片在浏览器内通过 Canvas 重新编码，不经过网络</li>
            <li>• EXIF / XMP / IPTC 等全部元数据一并清除</li>
            <li>• 关闭页面后不留任何数据</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：图片预览与元数据 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 空状态 -->
        <div v-if="!file" class="bg-card border border-border rounded-lg p-12">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ImageIcon class="w-8 h-8 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">为什么需要清除 EXIF？</h3>
            <p class="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              发布照片前清除 EXIF，可以避免泄露家庭住址（GPS）、作息规律（拍摄时间）、设备型号等隐私信息。
            </p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
              <div class="bg-muted/50 rounded-lg p-3">
                <MapPin class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">GPS 定位</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <Camera class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">设备型号</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <Clock class="w-4 h-4 text-primary mb-1.5" />
                <p class="text-xs font-medium text-foreground">拍摄时间</p>
              </div>
            </div>
          </div>
        </div>

        <template v-else>
          <!-- 图片信息 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <h3 class="text-sm font-semibold text-foreground">图片预览</h3>
                <div class="bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center min-h-[200px]">
                  <img
                    :src="previewUrl"
                    alt="图片预览"
                    class="max-h-64 max-w-full object-contain"
                  />
                </div>
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div class="bg-muted/50 rounded p-2">
                    <p class="text-xs text-muted-foreground">宽高</p>
                    <p class="text-sm font-medium text-foreground">{{ dimensions.width }}×{{ dimensions.height }}</p>
                  </div>
                  <div class="bg-muted/50 rounded p-2">
                    <p class="text-xs text-muted-foreground">格式</p>
                    <p class="text-sm font-medium text-foreground">{{ file.type.split('/')[1]?.toUpperCase() || '—' }}</p>
                  </div>
                  <div class="bg-muted/50 rounded p-2">
                    <p class="text-xs text-muted-foreground">大小</p>
                    <p class="text-sm font-medium text-foreground">{{ formatSize(file.size) }}</p>
                  </div>
                </div>
              </div>

              <!-- 元数据摘要 -->
              <div class="space-y-3">
                <h3 class="text-sm font-semibold text-foreground flex items-center">
                  <Eye class="w-4 h-4 mr-1.5 text-primary" /> 将被清除的元数据
                </h3>
                <div v-if="metadataLoading" class="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 class="w-4 h-4 animate-spin" /> 正在解析...
                </div>
                <div v-else-if="metadataTags.length === 0" class="text-sm text-muted-foreground py-8 text-center">
                  <CheckCircle class="w-8 h-8 mx-auto mb-2 text-green-500" />
                  该图片没有可清除的 EXIF 元数据
                </div>
                <div v-else class="bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <div
                    v-for="tag in metadataTags"
                    :key="tag.name"
                    class="flex items-start justify-between gap-3 py-1.5 border-b border-border/50 last:border-0"
                  >
                    <span class="text-xs text-muted-foreground whitespace-nowrap">{{ tag.name }}</span>
                    <span class="text-xs text-foreground text-right break-all">{{ tag.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 清除结果 -->
          <div v-if="result" class="bg-card border border-green-500/40 rounded-lg p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle class="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-foreground">清除完成</h2>
                <p class="text-xs text-muted-foreground">{{ result.filename }} · {{ formatSize(result.size) }} · 耗时 {{ result.duration }}ms</p>
              </div>
            </div>
            <button
              @click="downloadResult"
              class="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <Download class="w-4 h-4" /> 保存到本地
            </button>
          </div>
        </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于EXIF清除器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            EXIF（Exchangeable Image File Format）是嵌入在照片中的元数据标准，记录了拍摄设备、时间、GPS 坐标、快门参数等信息。这些信息在分享照片时可能造成隐私泄露：通过 GPS 字段可以精确定位拍摄地点，通过设备信息可以推断使用者习惯。EXIF清除器通过浏览器 Canvas 将图片重新编码，输出不含任何元数据的新图片。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>发布二手交易、社交平台照片前清除定位与设备信息</li>
            <li>证件照、合同扫描件对外发送前脱敏</li>
            <li>摄影师交付样片时去除相机参数与版权字段</li>
            <li>新闻爆料、举报材料的隐私保护</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">清除后画质会下降吗？</span>选择 PNG 输出无损；选择 JPEG/WebP 时可自行控制质量，默认 92% 肉眼几乎无差异。</li>
            <li><span class="text-foreground font-medium">会修改像素内容吗？</span>不会，只重新编码，画面内容保持原样。</li>
            <li><span class="text-foreground font-medium">支持哪些格式？</span>浏览器能解码的图片均可处理（JPG/PNG/WebP/GIF 首帧等），输出支持 PNG / JPEG / WebP。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'exif-cleaner'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  ShieldCheck, ImageIcon, ImageUp, Upload, FileCheck, Download,
  Loader2, Eraser, Eye, MapPin, Camera, Clock, CheckCircle,
  Lock, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'EXIF清除器 - 照片元数据清除与图片脱敏工具',
  description: '在浏览器本地清除照片EXIF元数据，包括GPS定位、拍摄设备、拍摄时间等隐私信息，支持PNG/JPEG/WebP输出，图片不上传服务器',
  keywords: 'exif清除, 照片脱敏, 图片去元数据, gps清除, 照片隐私保护, exif查看',
  author: 'Util工具箱',
  ogTitle: 'EXIF清除器 - 有条工具',
  ogDescription: '一键清除照片中的GPS定位、拍摄设备等隐私信息，纯本地处理',
  ogUrl: 'https://www.util.cn/tools/exif-cleaner',
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
          name: 'EXIF清除器',
          url: 'https://www.util.cn/tools/exif-cleaner',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['EXIF元数据清除', 'GPS信息删除', '本地处理', 'PNG/JPEG/WebP输出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: 'EXIF清除器', item: 'https://www.util.cn/tools/exif-cleaner/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '清除EXIF后画质会下降吗？',
              acceptedAnswer: { '@type': 'Answer', text: '选择PNG输出完全无损；选择JPEG/WebP可自行控制质量，默认92%几乎无差异。' }
            },
            {
              '@type': 'Question',
              name: 'EXIF清除器会上传我的照片吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，图片在浏览器内通过Canvas重新编码，全程不经过网络。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'exif-cleaner')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const file = ref(null)
const previewUrl = ref('')
const dimensions = ref({ width: 0, height: 0 })
const metadataTags = ref([])
const metadataLoading = ref(false)
const outputFormat = ref('jpeg')
const quality = ref(0.92)
const isDragging = ref(false)
const processing = ref(false)
const result = ref(null)
const seoContentVisible = ref(true)
const fileInput = ref(null)

const formatOptions = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' }
]

// EXIF 中重点展示的隐私字段
const INTERESTING_TAGS = [
  'Make', 'Model', 'LensModel', 'Software', 'DateTimeOriginal', 'DateTime',
  'DateTimeDigitized', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
  'Artist', 'Copyright', 'ImageDescription', 'UserComment', 'OwnerName',
  'SerialNumber', 'HostComputer'
]

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// ---------- 文件选择 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  const selected = e.target.files?.[0]
  if (selected) setFile(selected)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) setFile(dropped)
}

const setFile = async (f) => {
  if (!f.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  resetResult()
  file.value = f

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(f)

  dimensions.value = { width: 0, height: 0 }
  metadataTags.value = []
  metadataLoading.value = true

  // 读取尺寸
  const img = new Image()
  img.onload = () => {
    dimensions.value = { width: img.naturalWidth, height: img.naturalHeight }
  }
  img.src = previewUrl.value

  // 解析 EXIF
  try {
    const ExifReader = await import('exifreader')
    const buffer = await f.arrayBuffer()
    const tags = ExifReader.load(buffer)
    metadataTags.value = Object.values(tags)
      .filter(tag => INTERESTING_TAGS.includes(tag.name) && tag.description)
      .map(tag => ({
        name: tag.name,
        value: String(tag.description).slice(0, 120)
      }))
  } catch (err) {
    metadataTags.value = []
  } finally {
    metadataLoading.value = false
  }
}

const resetResult = () => {
  result.value = null
}

// ---------- 清除（Canvas 重编码） ----------
const cleanImage = () => {
  if (!file.value || processing.value) return
  processing.value = true

  const img = new Image()
  const objectUrl = URL.createObjectURL(file.value)

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')

      // JPEG 不支持透明通道，填充白色底避免透明区域变黑
      if (outputFormat.value === 'jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)

      const mimeType = `image/${outputFormat.value}`
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl)
        processing.value = false
        if (!blob) {
          alert('图片处理失败，请尝试其他输出格式')
          return
        }
        const startTime = resultStartTime.value
        const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
        const base = file.value.name.replace(/\.[^.]+$/, '')
        result.value = {
          filename: `${base}-clean.${ext}`,
          blob,
          size: blob.size,
          duration: Math.round(performance.now() - startTime)
        }
      }, mimeType, outputFormat.value === 'png' ? undefined : quality.value)
    } catch (err) {
      URL.revokeObjectURL(objectUrl)
      processing.value = false
      alert('图片处理失败：' + (err.message || '未知错误'))
    }
  }

  img.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    processing.value = false
    alert('图片加载失败，请确认文件为有效图片')
  }

  resultStartTime.value = performance.now()
  img.src = objectUrl
}

const resultStartTime = ref(0)

const downloadResult = () => {
  if (!result.value) return
  const url = URL.createObjectURL(result.value.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.value.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
