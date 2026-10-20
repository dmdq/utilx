<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Camera class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">时间地点水印相机</h1>
          <p class="text-sm text-muted-foreground mt-1">给照片盖上时间地点水印，打卡记录、工作留痕一秒钟搞定</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传照片后可选择「文件修改时间 / EXIF 拍摄时间 / 手动输入」三种时间来源，再叠加地点与品牌文案，用相机风、极简角标或底部信息条三种排版合成水印，全程在浏览器本地用 Canvas 绘制。
        <span class="font-medium text-foreground">本工具不做任何定位、不读取通讯录，照片也不会上传服务器</span>，隐私安全。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：上传与设置 -->
      <div class="space-y-6">
        <!-- 上传 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <ImageIcon class="w-5 h-5 mr-2 text-primary" /> 选择照片
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
            <Upload v-if="!hasImage" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p v-if="!hasImage" class="text-sm text-muted-foreground">点击选择或拖入照片（JPG / PNG / WebP）</p>
            <template v-else>
              <p class="text-sm font-medium text-foreground truncate">{{ fileName }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ imgW }}×{{ imgH }} · {{ exifStatusText }}</p>
            </template>
          </div>
        </div>

        <!-- 时间来源 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Clock class="w-5 h-5 mr-2 text-primary" /> 时间来源
          </h2>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="src in timeSources"
              :key="src.value"
              @click="setTimeSource(src.value)"
              :class="timeSource === src.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >
              {{ src.label }}
            </button>
          </div>

          <div v-if="timeSource === 'manual'">
            <label class="block text-sm font-medium text-foreground mb-1.5">手动选择时间</label>
            <input
              type="datetime-local"
              :value="manualInput"
              @input="onManualInput"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div v-if="degraded" class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-500/10 rounded-lg p-2.5">
            <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ degradedReason }}</span>
          </div>

          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[11px] text-muted-foreground mb-1">将写入水印的时间</p>
            <p class="text-sm font-semibold text-foreground font-mono">{{ displayStamp }}</p>
          </div>
        </div>

        <!-- 地点与信息 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <MapPin class="w-5 h-5 mr-2 text-primary" /> 地点与文案
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">地点文字（手动填写）</label>
            <input
              v-model="locationText"
              @input="renderPreview"
              type="text"
              placeholder="例如：上海市 · 徐汇滨江工地"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Lock class="w-3.5 h-3.5" /> 不做定位、不采集地理位置，仅把此处填写的文字画进水印，隐私安全。
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">品牌 / 备注文案（可选）</label>
            <input
              v-model="brandText"
              @input="renderPreview"
              type="text"
              placeholder="例如：巡检记录 0371"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      <!-- 右侧：样式、预览与导出 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 水印样式 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Palette class="w-5 h-5 mr-2 text-primary" /> 水印样式
          </h2>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="st in styleOptions"
              :key="st.value"
              @click="setStyle(st.value)"
              :class="watermarkStyle === st.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >
              {{ st.label }}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">字体大小</label>
              <input v-model.number="fontSize" @input="renderPreview" type="range" min="14" max="72" class="w-full accent-primary" />
              <p class="text-xs text-muted-foreground mt-1">{{ fontSize }}（按图宽自适应缩放）</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">字体颜色</label>
              <input v-model="fontColor" @input="renderPreview" type="color" class="w-full h-9 rounded cursor-pointer bg-background border border-input" />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">透明度</label>
              <input v-model.number="opacity" @input="renderPreview" type="range" min="0.2" max="1" step="0.05" class="w-full accent-primary" />
              <p class="text-xs text-muted-foreground mt-1">{{ Math.round(opacity * 100) }}%</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">时间格式</label>
              <select v-model="stampFormat" @change="renderPreview" class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="YYYY年MM月DD日 HH:mm">YYYY年MM月DD日 HH:mm</option>
                <option value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm</option>
                <option value="YYYY/MM/DD HH:mm:ss">YYYY/MM/DD HH:mm:ss</option>
                <option value="MM.DD HH:mm">MM.DD HH:mm</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">输出格式</label>
              <div class="grid grid-cols-2 gap-1.5">
                <button @click="setOutput('png')" :class="outputFormat === 'png' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'" class="py-2 rounded-lg text-xs font-medium transition-all">PNG</button>
                <button @click="setOutput('jpeg')" :class="outputFormat === 'jpeg' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'" class="py-2 rounded-lg text-xs font-medium transition-all">JPG</button>
              </div>
            </div>
            <div v-if="outputFormat === 'jpeg'">
              <label class="block text-sm font-medium text-foreground mb-1.5">JPG 质量</label>
              <input v-model.number="quality" @input="renderPreview" type="range" min="0.5" max="1" step="0.05" class="w-full accent-primary" />
              <p class="text-xs text-muted-foreground mt-1">{{ Math.round(quality * 100) }}%</p>
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <Eye class="w-5 h-5 mr-2 text-primary" /> 实时预览
            </h2>
            <span class="text-xs text-muted-foreground">{{ previewHint }}</span>
          </div>
          <div class="flex items-center justify-center bg-muted/40 rounded-lg min-h-[240px] overflow-hidden">
            <canvas v-show="hasImage" ref="previewCanvas" class="max-w-full max-h-[520px] rounded-lg shadow-md" />
            <div v-if="!hasImage" class="text-center text-muted-foreground py-10">
              <ImageIcon class="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p class="text-sm">上传照片后这里显示加水印效果</p>
            </div>
          </div>
          <button
            @click="downloadResult"
            :disabled="!hasImage || processing"
            class="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Download v-else class="w-4 h-4" />
            {{ processing ? '导出中...' : '导出带水印照片' }}
          </button>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于时间地点水印</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            水印相机常用于工程巡检、外卖快递、考勤打卡、二手车与房屋中介留痕等场景，核心是把「什么时间、在什么地点、拍了什么」直接固化进画面，形成难以事后篡改的记录。本工具在浏览器内用 Canvas 完成合成，图片不上传服务器，适合对隐私敏感的用户。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三种时间来源怎么选</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">文件修改时间</span>：读取图片在设备上的最后修改时间，几乎所有照片都有，作为兜底最稳妥。</li>
            <li><span class="text-foreground font-medium">EXIF 拍摄时间</span>：从照片元数据的 DateTimeOriginal 读取真实拍摄时刻，最贴近事实；若相机或截图未写入 EXIF，则自动降级到文件修改时间并给出提示。</li>
            <li><span class="text-foreground font-medium">手动输入</span>：补拍、翻拍或需要标注约定时间时使用，精确到分钟。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">三种排版差异</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">相机风</span>：左下角大号日期加小号地点，还原胶片相机的日期戳，适合风景与纪实。</li>
            <li><span class="text-foreground font-medium">极简角标</span>：角落一行小字，几乎不遮挡画面，适合需要保持整洁的交付图。</li>
            <li><span class="text-foreground font-medium">底部信息条</span>：半透明黑底白字横贯底部，把时间、地点、品牌一次说清，适合考勤与工程记录。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">它会获取我的地理位置吗？</span>不会。本工具没有任何定位能力，地点完全由你在输入框里手填，只是把文字画到图上。</li>
            <li><span class="text-foreground font-medium">照片会被上传吗？</span>不会。解码、绘制、导出全部在浏览器本地 Canvas 完成，关闭页面不留任何数据。</li>
            <li><span class="text-foreground font-medium">为什么读不到 EXIF 时间？</span>微信转发、截图、二次压缩常会剥离 EXIF，此时工具自动改用文件修改时间并提示你，你也可以切到手动输入。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'photo-timestamp-watermark'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Camera, ImageIcon, Upload, FileCheck, Clock, MapPin, Palette, Eye,
  Download, Loader2, AlertTriangle, Lock, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- 纯函数（可脱离浏览器单测） ----------
// 按模板格式化时间：支持 YYYY MM DD HH mm ss 六种令牌
const formatStamp = (date, fmt = 'YYYY-MM-DD HH:mm') => {
  const valid = date instanceof Date && !isNaN(date.getTime())
  const d = valid ? date : new Date(0)
  const pad = (n) => String(n).padStart(2, '0')
  const map = {
    YYYY: String(d.getFullYear()),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds())
  }
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (t) => map[t])
}

// 时间来源优先级与降级：manual 恒用手动；exif 读不到时降级到文件修改时间；file 直接用文件
const chooseTimeSource = (mode, { exifDate, fileDate, manualDate }) => {
  const ok = (d) => d instanceof Date && !isNaN(d.getTime())
  if (mode === 'manual') {
    return { date: ok(manualDate) ? manualDate : null, source: 'manual', degraded: false }
  }
  if (mode === 'exif') {
    if (ok(exifDate)) return { date: exifDate, source: 'exif', degraded: false }
    if (ok(fileDate)) return { date: fileDate, source: 'file', degraded: true, reason: 'exif-missing' }
    return { date: null, source: 'none', degraded: true, reason: 'all-missing' }
  }
  return { date: ok(fileDate) ? fileDate : null, source: 'file', degraded: false }
}

// 解析 EXIF 日期字符串 "YYYY:MM:DD HH:MM:SS" → Date
const parseExifDate = (s) => {
  if (typeof s !== 'string') return null
  const m = s.trim().match(/^(\d{4})[:\-\/](\d{2})[:\-\/](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]))
}

// ---------- SEO ----------
useSeoMeta({
  title: '时间地点水印相机 - 照片加时间水印（本地生成不定位）',
  description: '免费在线水印相机，上传照片叠加时间地点水印，支持文件时间、EXIF拍摄时间与手动输入三种时间来源，相机风/极简角标/底部信息条三种排版，Canvas本地合成导出PNG/JPG，不采集定位隐私安全',
  keywords: '水印相机, 时间水印, 地点水印, 打卡照片, EXIF拍摄时间, 照片加时间, 工作记录, 施工留痕',
  author: 'Util工具箱',
  ogTitle: '时间地点水印相机 - 有条工具',
  ogDescription: '照片加时间地点水印，本地生成不定位，可读EXIF拍摄时间',
  ogUrl: 'https://www.util.cn/tools/photo-timestamp-watermark',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '时间地点水印相机',
          url: 'https://www.util.cn/tools/photo-timestamp-watermark',
          applicationCategory: 'PhotographyApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['三种时间来源', 'EXIF拍摄时间读取', '手动地点标注', '相机风/角标/信息条排版', 'Canvas本地合成']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图像处理', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '时间地点水印相机', item: 'https://www.util.cn/tools/photo-timestamp-watermark/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '它会获取我的地理位置吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。本工具没有任何定位能力，地点完全由你在输入框里手填，只是把文字画到图上，照片也不会上传服务器。' }
            },
            {
              '@type': 'Question',
              name: '为什么读不到EXIF拍摄时间？',
              acceptedAnswer: { '@type': 'Answer', text: '微信转发、截图、二次压缩常会剥离EXIF，此时工具自动改用文件修改时间并提示你，你也可以切换到手动输入。' }
            },
            {
              '@type': 'Question',
              name: '导出的是原图尺寸吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是的，水印按图宽自适应缩放后绘制在原始分辨率的画布上，选择PNG无损、JPG可调质量。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'photo-timestamp-watermark')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const fileInput = ref(null)
const previewCanvas = ref(null)

const imageEl = ref(null)      // 已解码的 HTMLImageElement
const fileName = ref('')
const fileDate = ref(null)     // 文件修改时间 Date
const exifDate = ref(null)     // EXIF 拍摄时间 Date
const hasExif = ref(false)
const imgW = ref(0)
const imgH = ref(0)
const isDragging = ref(false)
const processing = ref(false)

const timeSource = ref('file')
const manualDate = ref(null)   // 手动选择的 Date
const locationText = ref('')
const brandText = ref('')

const watermarkStyle = ref('camera')
const fontSize = ref(30)
const fontColor = ref('#ffffff')
const opacity = ref(0.9)
const stampFormat = ref('YYYY年MM月DD日 HH:mm')

const outputFormat = ref('png')
const quality = ref(0.92)
const seoContentVisible = ref(true)

const timeSources = [
  { value: 'file', label: '文件时间' },
  { value: 'exif', label: 'EXIF拍摄' },
  { value: 'manual', label: '手动输入' }
]
const styleOptions = [
  { value: 'camera', label: '相机风' },
  { value: 'badge', label: '极简角标' },
  { value: 'bar', label: '底部信息条' }
]

const hasImage = computed(() => !!imageEl.value)

// 选择当前使用的时间
const picked = computed(() => chooseTimeSource(timeSource.value, {
  exifDate: exifDate.value,
  fileDate: fileDate.value,
  manualDate: manualDate.value
}))

const degraded = computed(() => !!picked.value.degraded)
const degradedReason = computed(() => {
  if (picked.value.reason === 'all-missing') return '既没有 EXIF 时间也没有可用的文件时间，请改用手动输入。'
  return '这张照片没有 EXIF 拍摄时间，已自动改用文件修改时间。'
})

const displayStamp = computed(() => {
  if (!picked.value.date) return '（未选择有效时间）'
  return formatStamp(picked.value.date, stampFormat.value)
})

const previewHint = computed(() => {
  if (!hasImage.value) return '未选择照片'
  if (!picked.value.date) return '请先选择有效时间'
  return '所见即所得'
})

const manualInput = computed(() => {
  const d = manualDate.value
  if (!(d instanceof Date) || isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
})

const onManualInput = (e) => {
  const v = e.target.value
  if (!v) { manualDate.value = null; renderPreview(); return }
  const d = new Date(v)
  manualDate.value = isNaN(d.getTime()) ? null : d
  renderPreview()
}

const setTimeSource = (v) => { timeSource.value = v; renderPreview() }
const setStyle = (v) => { watermarkStyle.value = v; renderPreview() }
const setOutput = (v) => { outputFormat.value = v; renderPreview() }
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const exifStatusText = computed(() => (hasExif.value ? '含 EXIF 时间' : '无 EXIF'))

// ---------- 文件处理（仅在事件回调内使用浏览器 API） ----------
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
  fileName.value = f.name
  fileDate.value = f.lastModified ? new Date(f.lastModified) : null
  exifDate.value = null
  hasExif.value = false
  imgW.value = 0
  imgH.value = 0

  // 解码取尺寸
  const img = new Image()
  const objectUrl = URL.createObjectURL(f)
  img.onload = () => {
    imageEl.value = img
    imgW.value = img.naturalWidth
    imgH.value = img.naturalHeight
    renderPreview()
  }
  img.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    alert('图片解码失败，请更换图片')
  }
  img.src = objectUrl

  // 解析 EXIF 拍摄时间
  try {
    const ExifReader = await import('exifreader')
    const buffer = await f.arrayBuffer()
    const tags = ExifReader.load(buffer)
    const raw = tags.DateTimeOriginal
    const desc = raw && (raw.description || raw.value)
    const parsed = parseExifDate(String(desc || ''))
    if (parsed) {
      exifDate.value = parsed
      hasExif.value = true
    }
  } catch (err) {
    exifDate.value = null
  }
}

// ---------- Canvas 水印绘制 ----------
const drawWatermark = (ctx, w, h) => {
  const base = Math.max(16, Math.round(fontSize.value * (w / 1000)))
  const margin = Math.round(base * 0.6)
  const dateText = picked.value.date ? formatStamp(picked.value.date, stampFormat.value) : ''
  const loc = locationText.value.trim()
  const brand = brandText.value.trim()

  ctx.save()
  ctx.globalAlpha = opacity.value
  ctx.textBaseline = 'alphabetic'
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = base * 0.18
  ctx.fillStyle = fontColor.value

  if (watermarkStyle.value === 'camera') {
    const bigFs = base
    const smallFs = Math.round(base * 0.52)
    ctx.font = `700 ${bigFs}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
    ctx.fillText(dateText, margin, h - margin - smallFs - bigFs * 0.2)
    ctx.font = `600 ${smallFs}px system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
    const second = [loc, brand].filter(Boolean).join('  ·  ')
    if (second) ctx.fillText(second, margin, h - margin)
  } else if (watermarkStyle.value === 'badge') {
    const fs = Math.round(base * 0.48)
    ctx.font = `600 ${fs}px system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
    const line = [dateText, loc, brand].filter(Boolean).join('  ·  ')
    ctx.fillText(line, margin, margin + fs)
  } else {
    // 底部信息条
    ctx.shadowBlur = 0
    const barH = Math.round(base * 1.7)
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, h - barH, w, barH)
    ctx.fillStyle = fontColor.value
    ctx.textAlign = 'center'
    ctx.font = `600 ${Math.round(base * 0.7)}px system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
    const line = [dateText, loc, brand].filter(Boolean).join('    ·    ')
    ctx.fillText(line, w / 2, h - barH / 2 + Math.round(base * 0.25))
  }
  ctx.restore()
}

const renderPreview = () => {
  const canvas = previewCanvas.value
  if (!canvas || !imageEl.value) return
  const img = imageEl.value
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  drawWatermark(ctx, canvas.width, canvas.height)
}

// ---------- 导出 ----------
const downloadResult = () => {
  const img = imageEl.value
  if (!img) return
  processing.value = true
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (outputFormat.value === 'jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0)
  drawWatermark(ctx, canvas.width, canvas.height)

  const mime = `image/${outputFormat.value}`
  canvas.toBlob((blob) => {
    processing.value = false
    if (!blob) { alert('导出失败，请尝试 PNG 格式'); return }
    const ext = outputFormat.value === 'jpeg' ? 'jpg' : 'png'
    const base = (fileName.value || 'photo').replace(/\.[^.]+$/, '')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${base}-stamp.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, mime, outputFormat.value === 'png' ? undefined : quality.value)
}
</script>
