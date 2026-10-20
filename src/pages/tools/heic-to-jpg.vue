<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Camera class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">HEIC 转 JPG</h1>
          <p class="text-sm text-muted-foreground mt-1">iPhone 照片 HEIC 批量转 JPG / PNG，本地转换，微信与 Windows 都能打开</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        拖入或选择多张 .heic / .heif 图片，一键批量转成通用格式。可选择输出 JPG 或 PNG、调节画质、限制最长边尺寸，
        逐张预览转换结果，单张下载或全部打包逐个下载。非 HEIC 文件会自动跳过并标注，个别转换失败单独列出、不影响其余图片。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：照片在本机解码转换，全程不上传任何服务器，隐私无忧。
      </div>
    </div>

    <!-- 上传 + 设置 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 上传区 -->
      <div class="bg-card border border-border rounded-lg p-6 lg:col-span-2 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Upload class="w-5 h-5 mr-2 text-primary" /> 1. 选择 HEIC 图片
        </h2>
        <div
          class="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer flex flex-col items-center gap-2"
          @click="triggerPick"
          @drop.prevent="handleDrop"
          @dragover.prevent
        >
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            multiple
            accept="image/heic,image/heif,.heic,.heif,.hif"
            @change="onFileSelect"
          >
          <ImageIcon class="w-10 h-10 text-primary" />
          <span class="text-sm font-medium text-foreground">点击选择，或拖拽 .heic / .heif 文件到这里</span>
          <span class="text-xs text-muted-foreground">支持 iPhone 相册导出的 HEIC、HEIF，以及实况照片（Live Photo）容器内的静态图</span>
        </div>
        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>

        <div v-if="items.length" class="flex flex-wrap items-center gap-3 text-sm pt-1">
          <span class="text-muted-foreground">共 {{ items.length }} 个文件</span>
          <span class="text-green-600 dark:text-green-400">已转换 {{ doneCount }}</span>
          <span v-if="errorCount" class="text-red-500">失败 {{ errorCount }}</span>
          <span v-if="skippedCount" class="text-amber-600 dark:text-amber-400">跳过 {{ skippedCount }}</span>
          <button @click="clearAll" class="ml-auto text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 text-xs">
            <Trash2 class="w-3.5 h-3.5" /> 清空列表
          </button>
        </div>
      </div>

      <!-- 转换设置 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 2. 输出设置
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">目标格式</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="targetFormat = 'jpg'"
              :class="targetFormat === 'jpg' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <ImageIcon class="w-4 h-4" /> JPG
            </button>
            <button
              @click="targetFormat = 'png'"
              :class="targetFormat === 'png' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <ImageIcon class="w-4 h-4" /> PNG
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">照片选 JPG（体积小）；需要无损或保留透明选 PNG。</p>
        </div>

        <div v-if="targetFormat === 'jpg'">
          <label class="block text-sm font-medium text-foreground mb-2">
            JPG 画质：<span class="text-primary">{{ quality }}%</span>
          </label>
          <input v-model.number="quality" type="range" min="50" max="100" step="1" class="w-full accent-primary" />
          <div class="flex justify-between text-xs text-muted-foreground mt-1">
            <span>50（更小）</span><span>92 推荐</span><span>100</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">最长边限制</label>
          <select v-model.number="maxEdge" class="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option :value="0">不缩放（保留原始分辨率）</option>
            <option :value="1024">最长边 1024 px</option>
            <option :value="1536">最长边 1536 px</option>
            <option :value="2048">最长边 2048 px</option>
            <option :value="3072">最长边 3072 px</option>
            <option :value="4096">最长边 4096 px</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5">超过限制时按比例缩小，适合发微信 / 朋友圈、节省空间。</p>
        </div>

        <button
          @click="startConvert"
          :disabled="isConverting || readyCount === 0"
          class="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Loader2 v-if="isConverting" class="w-4 h-4 animate-spin" />
          {{ isConverting ? '正在本地转换...' : ('开始转换（' + readyCount + ' 张待处理）') }}
        </button>
      </div>
    </div>

    <!-- 结果列表 -->
    <div v-if="items.length" class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 3. 预览与下载
        </h2>
        <button
          v-if="doneCount > 0"
          @click="downloadAll"
          class="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <Download class="w-3.5 h-3.5" /> 全部下载（{{ doneCount }}）
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          :class="[
            'border rounded-lg p-3 flex gap-3 items-start transition-colors',
            item.status === 'error' ? 'border-red-500/40 bg-red-500/5' : '',
            item.status === 'skipped' ? 'border-amber-500/40 bg-amber-500/5' : '',
            (item.status === 'done' || item.status === 'ready' || item.status === 'converting') ? 'border-border bg-muted/30' : ''
          ]"
        >
          <!-- 缩略图 -->
          <div class="w-20 h-20 flex-shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
            <img v-if="item.status === 'done' && item.outputUrl" :src="item.outputUrl" :alt="item.name" class="w-full h-full object-cover" >
            <Loader2 v-else-if="item.status === 'converting'" class="w-6 h-6 text-primary animate-spin" />
            <CheckCircle v-else-if="item.status === 'done'" class="w-6 h-6 text-green-500" />
            <XCircle v-else-if="item.status === 'error'" class="w-6 h-6 text-red-500" />
            <X v-else-if="item.status === 'skipped'" class="w-6 h-6 text-amber-500" />
            <ImageIcon v-else class="w-6 h-6 text-muted-foreground" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate" :title="item.name">{{ item.name }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">{{ formatFileSize(item.inputSize) }}</p>

            <p v-if="item.status === 'ready'" class="text-xs text-muted-foreground mt-1">待转换</p>
            <p v-else-if="item.status === 'converting'" class="text-xs text-primary mt-1">转换中...</p>
            <p v-else-if="item.status === 'skipped'" class="text-xs text-amber-600 dark:text-amber-400 mt-1">{{ item.errorMsg }}</p>
            <p v-else-if="item.status === 'error'" class="text-xs text-red-500 mt-1 break-words">{{ item.errorMsg }}</p>
            <template v-else-if="item.status === 'done'">
              <p class="text-xs text-green-600 dark:text-green-400 mt-1">{{ item.outName }} · {{ formatFileSize(item.outputSize) }}</p>
              <button
                @click="downloadOne(item)"
                class="mt-2 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </template>
          </div>

          <button @click="removeItem(index)" class="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible" class="p-6 mb-12 bg-card border border-border rounded-lg">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          在线 HEIC 转 JPG / PNG 工具
        </h2>
        <p class="text-muted-foreground mb-6">
          这是一款纯本地运行的 HEIC（High Efficiency Image Container，高效图像容器）转换器。iPhone 从 iOS 11 起默认用 HEIC/HEVC
          保存照片，比 JPG 体积更小、画质更好，但很多 Windows 电脑、老版 Android、以及微信部分场景无法直接打开，
          发出去的照片经常"打不开 / 一片空白"。本工具把 HEIC 批量转成通用 JPG 或 PNG，转换全程在你的浏览器里完成，照片不上传服务器。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">为什么 iPhone 默认拍出来是 HEIC？</h3>
        <p class="text-muted-foreground mb-6">
          HEIC 基于 HEVC（H.265）视频编码的静帧，在同等画质下体积通常只有 JPG 的一半到三分之二，还能保存连拍、深度图、
          实况照片（Live Photo）等多帧信息。苹果为省空间、提升拍摄体验把它设为默认格式，代价是牺牲了跨平台兼容性——
          这也是 HEIC 转 JPG 需求长期存在的根本原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">微信 / Windows 打不开怎么办？</h3>
        <p class="text-muted-foreground mb-6">
          最快的办法就是转成 JPG：本工具支持批量拖入、逐张预览、一键下载，转换后文件名自动把 .heic 改成 .jpg（或 .png），
          发给微信好友、上传到不支持 HEIC 的平台都能正常显示。如果你想在 iPhone 上一劳永逸，也可在
          「设置 → 相机 → 格式」选择「兼容性最好」，之后直接拍 JPG；或用「设置 → 照片」开启"传输到 Mac 或 PC 时自动转 JPG"。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">本地转换，隐私更安全</h3>
        <p class="text-muted-foreground mb-6">
          许多在线转换站会把照片上传到服务器再返回结果，涉及相册隐私与照片元数据风险。本页用浏览器内置的解码能力完成转换，
          图片数据始终留在本机内存中，不经过任何网络请求，断网环境下（除首次加载页面与转换库外）依旧可用，尤其适合处理含人像、证件、定位的私密照片。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">转换后画质会不会变差？</h3>
            <p class="text-muted-foreground mt-1">
              HEIC 到 JPG 是有损格式的再次编码，画质取决于你选择的 JPG 画质与最长边设置。默认 92% 画质、不缩放的情况下，
              肉眼几乎看不出差别；如需绝对无损，请选 PNG（但文件会大很多）。注意本工具不迁移 EXIF 等元数据，输出文件不含原拍摄时间/GPS 信息。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">实况照片（Live Photo）能转吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以转其中"看清的那一张静态图"。Live Photo 由一张 HEIC 静帧加一段 .mov 短视频组成，本工具只处理 .heic 静帧部分并转成 JPG/PNG；
              附带的动态视频不属于图片，请在相册里单独处理。若你从相册导出的是 .mov 或其它非 HEIC 文件，列表会标注为"跳过"。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">一次能转多少张？会不会上传？</h3>
            <p class="text-muted-foreground mt-1">
              数量没有硬性上限，受本机内存与浏览器性能影响，建议几十张一批、逐张预览确认。所有转换都在浏览器本地完成，
              不会把图片上传到任何服务器；转换失败的文件会单独列出，不影响其余图片，重新选择即可。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'heic-to-jpg'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Camera, Upload, Download, ImageIcon, Loader2, CheckCircle, XCircle,
  X, Trash2, SlidersHorizontal, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'HEIC转JPG - iPhone照片批量转JPG/PNG 本地转换',
  description: '免费在线HEIC转JPG/PNG工具，iPhone照片HEIC/HEIF批量转换，本地浏览器解码不上传，解决微信与Windows打不开HEIC的问题，支持画质与最长边缩放，逐张预览单张/批量下载',
  keywords: 'heic转jpg, heic转png, iphone照片格式转换, heic打不开, 在线heic转换, 苹果heif转jpg, heic批量转换',
  author: 'Util工具箱',
  ogTitle: 'HEIC 转 JPG - 有条工具',
  ogDescription: 'iPhone 照片 HEIC 批量转 JPG/PNG，本地转换不上传，微信与 Windows 都能打开',
  ogUrl: 'https://www.util.cn/tools/heic-to-jpg',
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
          name: 'HEIC转JPG',
          description: 'iPhone 照片 HEIC 批量转 JPG/PNG，本地转换',
          url: 'https://www.util.cn/tools/heic-to-jpg',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['HEIC/HEIF 批量转换', '输出 JPG / PNG', '画质调节', '最长边缩放', '逐张预览', '单张/批量下载', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: 'HEIC转JPG', item: 'https://www.util.cn/tools/heic-to-jpg/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '转换后画质会不会变差？',
              acceptedAnswer: { '@type': 'Answer', text: 'HEIC 到 JPG 是有损再次编码，默认 92% 画质不缩放肉眼几乎无差别；需无损可选 PNG，输出不含原 EXIF 元数据。' }
            },
            {
              '@type': 'Question',
              name: '实况照片（Live Photo）能转吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可转其中静态 HEIC 帧为 JPG/PNG；附带的 .mov 动态视频不属于图片，非 HEIC 文件会标注跳过。' }
            },
            {
              '@type': 'Question',
              name: '会上传我的照片吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，转换在浏览器本地完成，图片不经过任何网络请求，适合含人像、证件、定位的私密照片。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'heic-to-jpg')

// ---------- 状态 ----------
const fileInput = ref(null)
const items = ref([])
const targetFormat = ref('jpg')
const quality = ref(92)
const maxEdge = ref(0)
const isConverting = ref(false)
const loadError = ref('')
const seoContentVisible = ref(true)

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数（node 自测覆盖）----------
// 识别是否为 HEIC/HEIF 文件：.heic/.heif/.hif 转换，其余排除
function shouldConvert (filename) {
  if (typeof filename !== 'string') return false
  const dot = filename.lastIndexOf('.')
  if (dot <= 0) return false
  const ext = filename.slice(dot + 1).toLowerCase()
  return ext === 'heic' || ext === 'heif' || ext === 'hif'
}

// 根据目标格式生成输出文件名：IMG_1.heic + jpg => IMG_1.jpg
function outputName (original, fmt) {
  const ext = fmt === 'png' ? 'png' : 'jpg'
  const base = String(original == null ? '' : original) || 'image'
  const dot = base.lastIndexOf('.')
  const stem = dot > 0 ? base.slice(0, dot) : base
  return stem + '.' + ext
}

// 目标最长边缩放计算：超过 max 时按比例缩小，返回取整后的宽高；max<=0 或已达标则原样返回
function scaleDims (w, h, max) {
  const width = Math.max(1, Math.round(Number(w) || 0))
  const height = Math.max(1, Math.round(Number(h) || 0))
  const limit = Math.max(0, Math.round(Number(max) || 0))
  if (!limit || (width <= limit && height <= limit)) {
    return { width, height }
  }
  const scale = limit / Math.max(width, height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  }
}

// ---------- 计算属性 ----------
const readyCount = computed(() => items.value.filter(i => i.status === 'ready').length)
const doneCount = computed(() => items.value.filter(i => i.status === 'done').length)
const errorCount = computed(() => items.value.filter(i => i.status === 'error').length)
const skippedCount = computed(() => items.value.filter(i => i.status === 'skipped').length)

// ---------- 工具函数 ----------
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const addFiles = (files) => {
  for (const file of files) {
    const ok = shouldConvert(file.name)
    items.value.push({
      id: Date.now() + Math.random(),
      name: file.name,
      file,
      status: ok ? 'ready' : 'skipped',
      errorMsg: ok ? '' : '非 HEIC/HEIF 图片，已自动跳过',
      inputSize: file.size,
      outputUrl: '',
      outputSize: 0,
      outName: ''
    })
  }
}

const onFileSelect = (e) => {
  loadError.value = ''
  const files = Array.from(e.target.files || [])
  if (files.length) addFiles(files)
  e.target.value = ''
}

const handleDrop = (e) => {
  loadError.value = ''
  const files = Array.from(e.dataTransfer.files || [])
  if (files.length) addFiles(files)
}

const removeItem = (index) => {
  const item = items.value[index]
  if (item && item.outputUrl) URL.revokeObjectURL(item.outputUrl)
  items.value.splice(index, 1)
}

const clearAll = () => {
  for (const item of items.value) {
    if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
  }
  items.value = []
}

// 缩放（仅在本机、转换回调内运行；使用全局 Image / canvas，不改变全局 heic 预览）
const resizeToMaxEdge = async (blob, mime, limit, q) => {
  if (!limit || limit <= 0) return blob
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => reject(new Error('无法读取转换结果进行缩放'))
      im.src = url
    })
    const srcW = img.naturalWidth || img.width
    const srcH = img.naturalHeight || img.height
    const dims = scaleDims(srcW, srcH, limit)
    if (dims.width === srcW && dims.height === srcH) return blob
    const canvas = document.createElement('canvas')
    canvas.width = dims.width
    canvas.height = dims.height
    const g = canvas.getContext('2d')
    if (mime === 'image/jpeg') {
      g.fillStyle = '#ffffff'
      g.fillRect(0, 0, canvas.width, canvas.height)
    }
    g.drawImage(img, 0, 0, dims.width, dims.height)
    const outBlob = await new Promise((resolve) => canvas.toBlob(resolve, mime, q))
    return outBlob || blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ---------- 转换主流程（动态 import heic2any 仅在用户点击回调内，全程 try/catch）----------
const startConvert = async () => {
  if (isConverting.value) return
  const pending = items.value.filter(i => i.status === 'ready')
  if (!pending.length) return
  isConverting.value = true
  loadError.value = ''

  let heic2any
  try {
    // 浏览器专用库，仅在用户交互时按需加载，node 环境不可用
    heic2any = (await import('heic2any')).default
  } catch (err) {
    loadError.value = '转换库加载失败，请检查网络后重试（首次加载库文件较大）'
    isConverting.value = false
    return
  }

  const mime = targetFormat.value === 'png' ? 'image/png' : 'image/jpeg'
  const q = Math.min(1, Math.max(0.1, quality.value / 100))

  for (const item of pending) {
    item.status = 'converting'
    try {
      let outBlob = await heic2any({ blob: item.file, toType: mime, quality: q })
      if (Array.isArray(outBlob)) outBlob = outBlob[0]
      if (maxEdge.value > 0) outBlob = await resizeToMaxEdge(outBlob, mime, maxEdge.value, q)
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl)
      item.outputUrl = URL.createObjectURL(outBlob)
      item.outputSize = outBlob.size
      item.outName = outputName(item.name, targetFormat.value)
      item.status = 'done'
      item.errorMsg = ''
    } catch (err) {
      item.status = 'error'
      item.errorMsg = '转换失败：' + (err && err.message ? err.message : '文件可能损坏或不是有效的 HEIC/HEIF')
    }
  }

  isConverting.value = false
}

// ---------- 下载 ----------
const downloadOne = (item) => {
  if (!item.outputUrl) return
  const a = document.createElement('a')
  a.href = item.outputUrl
  a.download = item.outName || outputName(item.name, targetFormat.value)
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const downloadAll = async () => {
  const done = items.value.filter(i => i.status === 'done')
  for (const item of done) {
    downloadOne(item)
    await new Promise(resolve => setTimeout(resolve, 180))
  }
}
</script>
