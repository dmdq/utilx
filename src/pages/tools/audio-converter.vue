<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <RefreshCw class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频格式互转</h1>
          <p class="text-sm text-muted-foreground mt-1">本地互转 WAV / MP3 / M4A / WebM / OGG，无大小限制不排队</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传任意浏览器可解码的音频（录音笔、微信语音、视频音轨等），在本地解码后转换为目标格式：
        WAV 无损全浏览器可用；MP3 由内置 LAME 编码器输出；M4A/AAC、WebM(Opus)、OGG(Opus)
        取决于浏览器的媒体录制能力，不支持的格式会自动置灰并说明原因。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码、重采样与编码全部在本机完成，音频不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 输入与源信息 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Upload class="w-5 h-5 mr-2 text-primary" /> 1. 选择音频
        </h2>

        <input ref="fileInput" type="file" accept="audio/*" class="hidden" @change="onFileChange" />

        <div v-if="!fileInfo">
          <button
            @click="triggerPick"
            class="w-full py-12 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
          >
            <Upload class="w-8 h-8 text-primary" />
            <span class="text-sm font-medium text-foreground">点击选择音频文件</span>
            <span class="text-xs">mp3 / m4a / wav / ogg / flac / webm 均可</span>
          </button>
        </div>

        <div v-else class="space-y-3">
          <div class="p-3 bg-muted/50 rounded-lg space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">{{ fileInfo.ext }}</span>
              <span class="text-sm font-medium text-foreground truncate">{{ fileInfo.name }}</span>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>大小：{{ formatSize(fileInfo.size) }}</span>
              <span>时长：{{ formatTime(duration) }}</span>
              <span>采样率：{{ sampleRate }} Hz</span>
              <span>声道：{{ channels === 1 ? '单声道' : channels + ' 声道' }}</span>
            </div>
            <p class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5" /> 已在本地解码成功，可开始转换
            </p>
          </div>
          <button @click="triggerPick" class="text-xs text-muted-foreground hover:text-primary transition-colors">
            重新选择文件
          </button>
        </div>

        <p v-if="isDecoding" class="text-sm text-muted-foreground">正在本地解码...</p>
        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>

        <div class="border-t border-border pt-4">
          <h3 class="text-sm font-medium text-foreground mb-2">MP3 码率</h3>
          <div class="flex gap-2">
            <button
              v-for="b in bitrateOptions"
              :key="b"
              @click="mp3Bitrate = b"
              :class="[
                'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                mp3Bitrate === b
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              {{ b }}k
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">仅在目标格式为 MP3 时生效，码率越高音质越好、体积越大</p>
        </div>
      </div>

      <!-- 目标格式 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 2. 选择目标格式
        </h2>

        <div class="space-y-2">
          <button
            v-for="fmt in targetFormats"
            :key="fmt.id"
            @click="selectFormat(fmt)"
            :disabled="!formatSupport[fmt.id]"
            class="w-full text-left p-3 rounded-lg border transition-all"
            :class="[
              formatSupport[fmt.id]
                ? (selectedFormatId === fmt.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/60')
                : 'border-border bg-muted/30 cursor-not-allowed opacity-60'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-foreground">{{ fmt.label }}</span>
              <span
                v-if="formatSupport[fmt.id]"
                class="text-xs"
                :class="selectedFormatId === fmt.id ? 'text-primary' : 'text-muted-foreground'"
              >{{ selectedFormatId === fmt.id ? '已选中' : '可用' }}</span>
              <span v-else class="text-xs text-muted-foreground/70">置灰</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              {{ formatSupport[fmt.id] ? fmt.desc : fmt.unsupportedReason }}
            </p>
          </button>
        </div>

        <button
          @click="convert"
          :disabled="!audioReady || !selectedFormatId || isConverting"
          class="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isConverting ? '转换中...' : '开始本地转换' }}
        </button>

        <div v-if="isConverting">
          <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary transition-all" :style="{ width: Math.round(progress * 100) + '%' }"></div>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ statusText }}</p>
        </div>
        <p v-if="convertError" class="text-sm text-red-500">{{ convertError }}</p>
      </div>

      <!-- 结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Download class="w-5 h-5 mr-2 text-primary" /> 3. 下载结果
        </h2>

        <template v-if="resultInfo">
          <div class="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2">
            <p class="text-sm font-medium text-foreground break-all">{{ resultInfo.name }}</p>
            <div class="text-sm space-y-1">
              <div class="flex justify-between">
                <span class="text-muted-foreground">源文件</span>
                <span class="text-foreground">{{ formatSize(sourceSize) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">输出文件</span>
                <span class="text-foreground">{{ formatSize(resultInfo.size) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">体积变化</span>
                <span
                  class="font-medium"
                  :class="sizeDelta <= 0 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'"
                >
                  {{ sizeDelta <= 0 ? '-' : '+' }}{{ Math.abs(Math.round(sizeDelta * 100)) }}%
                </span>
              </div>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Download class="w-4 h-4" /> 保存到本地
          </button>
        </template>

        <div v-else class="py-10 text-center text-sm text-muted-foreground">
          选择目标格式并点击转换后，这里会显示体积对比与下载按钮
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          说明：M4A/AAC、WebM、OGG 采用浏览器媒体录制能力编码，转换耗时与音频时长相同（实时录制）；
          WAV 与 MP3 为纯计算编码，速度远快于实时。
        </p>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          在线音频格式转换器
        </h2>
        <p class="text-muted-foreground mb-6">
          录音笔的 ACT/WMV 音轨、微信的 SILK 语音、视频里抽出来的 M4A……遇到设备不认的音频格式时，
          本工具可以在浏览器里一步完成转码。没有文件大小限制、没有转换队列，也不需要注册登录，
          因为解码与编码全部发生在你自己的电脑上。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">五种目标格式怎么选</h3>
        <p class="text-muted-foreground mb-6">
          WAV 是无损 PCM，兼容一切剪辑软件与老设备，缺点是体积大；MP3 兼容性最好，
          提供 128/192/320 kbps 三档码率，适合车载与老式播放器；M4A（AAC）在同音质下体积更小，
          是 iPhone 的原生格式；WebM(Opus) 与 OGG(Opus) 压缩率高，常用于网页与语音场景。
          浏览器不支持的格式会自动置灰并标注原因，避免转换失败。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">本地转换的技术原理</h3>
        <p class="text-muted-foreground mb-6">
          文件先通过 WebAudio 的 decodeAudioData 在本地解码为 PCM 采样；WAV 按标准 RIFF 头手工封装；
          MP3 使用纯 JavaScript 实现的 LAME 编码器，先重采样到 44.1kHz 再分块编码；
          M4A/WebM/OGG 则借助浏览器的媒体录制管线完成容器封装。整个过程不产生任何网络请求。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">为什么转换 M4A 比较慢</h3>
        <p class="text-muted-foreground mb-6">
          浏览器的媒体录制能力按实时速度工作：3 分钟的音频就需要约 3 分钟完成录制封装，
          页面会显示进度条，期间请保持标签页在前台。追求速度可选择 WAV 或 MP3，
          这两种格式为纯计算编码，通常几秒内即可完成。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">哪些格式之间可以互转？</h3>
            <p class="text-muted-foreground mt-1">
              输入端支持浏览器能解码的全部格式（mp3、m4a/aac、wav、ogg、flac、webm 等）；
              输出端为 WAV、MP3、M4A、WebM、OGG 五种。WAV 与 MP3 全平台可用，
              其余取决于浏览器录制能力，不支持的选项会置灰提示。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">转换会损坏音质吗？</h3>
            <p class="text-muted-foreground mt-1">
              转到 WAV 为无损封装，音质与源一致；转到 MP3/M4A/Opus 属于有损压缩，
              建议源为无损或高码率音频，并选择较高码率（如 MP3 320k）以减少损失。
              有损格式之间反复互转会累积失真，应尽量从原始文件一次性转换。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">微信语音能转吗？</h3>
            <p class="text-muted-foreground mt-1">
              微信语音导出后多为 SILK/AMR 私有格式，桌面浏览器通常无法直接解码，
              建议先用手机端「收藏」或第三方工具转成 mp3/wav，再上传到本工具转为目标格式；
              转换过程同样只在本地进行，语音内容不会外泄。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-converter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  RefreshCw, ShieldCheck, Upload, Download, CheckCircle2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '音频格式互转 - 本地转换 WAV/MP3/M4A/WebM/OGG 无需上传',
  description: '在线音频格式转换器，浏览器本地互转 wav/m4a/webm/ogg/mp3，无大小限制不排队，录音笔微信语音通用，文件不上传，转换后显示体积对比',
  keywords: '音频格式转换, m4a转wav, webm转mp3, 音频在线转换, 录音转换, mp3转换器, wav转mp3',
  author: 'Util工具箱',
  ogTitle: '音频格式互转 - 有条工具',
  ogDescription: '浏览器本地互转 wav/m4a/webm/ogg/mp3，无大小限制不排队',
  ogUrl: 'https://www.util.cn/tools/audio-converter',
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
          name: '音频格式互转',
          url: 'https://www.util.cn/tools/audio-converter',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['WAV无损导出', 'MP3三档码率', 'M4A/AAC导出', 'WebM(Opus)导出', 'OGG(Opus)导出', '体积对比', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '音频格式互转', item: 'https://www.util.cn/tools/audio-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '哪些格式之间可以互转？',
              acceptedAnswer: { '@type': 'Answer', text: '输入端支持浏览器能解码的全部格式，输出端为 WAV、MP3、M4A、WebM、OGG 五种，不支持的选项会自动置灰提示。' }
            },
            {
              '@type': 'Question',
              name: '转换会损坏音质吗？',
              acceptedAnswer: { '@type': 'Answer', text: '转 WAV 为无损封装；转 MP3/M4A/Opus 属于有损压缩，建议选择较高码率并尽量从原始文件一次性转换。' }
            },
            {
              '@type': 'Question',
              name: '微信语音能转吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'SILK/AMR 私有格式浏览器通常无法直接解码，建议先转成 mp3/wav 再用本工具转换，全程本地处理。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-converter')

// ---------- 状态 ----------
const fileInput = ref(null)
const fileInfo = ref(null)
const duration = ref(0)
const sampleRate = ref(0)
const channels = ref(0)
const isDecoding = ref(false)
const loadError = ref('')
const mp3Bitrate = ref(192)
const bitrateOptions = [128, 192, 320]
const selectedFormatId = ref('')
const isConverting = ref(false)
const progress = ref(0)
const statusText = ref('')
const convertError = ref('')
const resultInfo = ref(null)
const seoContentVisible = ref(true)

const formatSupport = ref({ wav: true, mp3: false, m4a: false, webm: false, ogg: false })

// 非响应式大对象
let audioBuffer = null
let resultBlob = null
let lamejsModule = null

const audioReady = computed(() => !!fileInfo.value && !!audioBuffer)
const sourceSize = computed(() => (fileInfo.value ? fileInfo.value.size : 0))
const sizeDelta = computed(() => {
  if (!resultInfo.value || !sourceSize.value) return 0
  return (resultInfo.value.size - sourceSize.value) / sourceSize.value
})

const targetFormats = [
  { id: 'wav', label: 'WAV（无损 PCM）', desc: '44字节RIFF头 + PCM16，全部浏览器支持，无损', unsupportedReason: 'WAV 为纯计算封装，全部浏览器可用', mime: 'audio/wav', ext: 'wav' },
  { id: 'mp3', label: 'MP3（LAME 编码）', desc: '内置 LAME 编码器，重采样 44.1kHz 后分块编码', unsupportedReason: 'MP3 编码器加载失败，请刷新重试', mime: 'audio/mpeg', ext: 'mp3' },
  { id: 'm4a', label: 'M4A / AAC', desc: '经浏览器媒体录制管线封装，Chrome/Safari 支持', unsupportedReason: '当前浏览器不支持 audio/mp4 录制，请改用 Chrome 或 Safari', mime: 'audio/mp4', ext: 'm4a' },
  { id: 'webm', label: 'WebM（Opus）', desc: '高压缩比 Opus 编码，Chrome/Firefox 支持', unsupportedReason: '当前浏览器不支持 audio/webm 录制，请改用 Chrome 或 Firefox', mime: 'audio/webm;codecs=opus', ext: 'webm' },
  { id: 'ogg', label: 'OGG（Opus）', desc: 'Firefox 支持以 audio/ogg 容器录制 Opus', unsupportedReason: '当前浏览器不支持 audio/ogg 录制（目前仅 Firefox 支持），可选 WebM(Opus) 替代', mime: 'audio/ogg', ext: 'ogg' }
]

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 能力检测（onMounted 中执行，避免 SSR 阶段访问浏览器 API）
  const canCheck = typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
  formatSupport.value = {
    wav: true,
    mp3: false,
    m4a: canCheck && MediaRecorder.isTypeSupported('audio/mp4'),
    webm: canCheck && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
    ogg: canCheck && MediaRecorder.isTypeSupported('audio/ogg')
  }
  // 预加载 MP3 编码器（动态 import，仅在客户端执行）
  import('@breezystack/lamejs')
    .then((mod) => {
      lamejsModule = mod
      formatSupport.value = { ...formatSupport.value, mp3: true }
    })
    .catch(() => {})
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }
const selectFormat = (fmt) => {
  if (!formatSupport.value[fmt.id]) return
  selectedFormatId.value = fmt.id
}

const formatTime = (t) => {
  const s = Math.max(0, Math.floor(Number(t) || 0))
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r}`
}
const formatSize = (n) => {
  if (!n) return '0 B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 纯函数（node 自测覆盖） ----------
function floatToInt16(f32) {
  const out = new Int16Array(f32.length)
  for (let i = 0; i < f32.length; i++) {
    let s = f32[i]
    s = s > 1 ? 1 : (s < -1 ? -1 : s)
    out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return out
}

function encodeWavFromChannels(chans, sampleRateIn) {
  const numCh = Math.max(1, chans.length)
  const numFrames = chans[0] ? chans[0].length : 0
  const blockAlign = numCh * 2
  const dataSize = numFrames * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numCh, true)
  view.setUint32(24, sampleRateIn, true)
  view.setUint32(28, sampleRateIn * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = chans[c][i]
      s = s > 1 ? 1 : (s < -1 ? -1 : s)
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      offset += 2
    }
  }
  return new Uint8Array(buffer)
}

function encodeWav(audioBufferIn) {
  const chans = []
  for (let c = 0; c < audioBufferIn.numberOfChannels; c++) {
    chans.push(audioBufferIn.getChannelData(c))
  }
  return encodeWavFromChannels(chans, audioBufferIn.sampleRate)
}

// ---------- 文件解码（用户手势回调内创建 AudioContext） ----------
const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  isDecoding.value = true
  loadError.value = ''
  resultInfo.value = null
  resultBlob = null
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ctx = new AudioContext()
    const buf = await ctx.decodeAudioData(arrayBuffer)
    await ctx.close()
    audioBuffer = buf
    const dot = file.name.lastIndexOf('.')
    const ext = dot >= 0 ? file.name.slice(dot + 1).toUpperCase() : '未知'
    fileInfo.value = { name: file.name, size: file.size, ext, base: dot >= 0 ? file.name.slice(0, dot) : file.name }
    duration.value = buf.duration
    sampleRate.value = buf.sampleRate
    channels.value = buf.numberOfChannels
  } catch (err) {
    loadError.value = '解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式'
  } finally {
    isDecoding.value = false
    e.target.value = ''
  }
}

// ---------- MP3 编码（OfflineAudioContext 重采样 → Int16 → Mp3Encoder 分块） ----------
const encodeMp3FromBuffer = async (bufferIn, kbps, onProgress) => {
  const lamejs = lamejsModule || await import('@breezystack/lamejs')
  lamejsModule = lamejs
  const targetRate = 44100
  const numCh = Math.min(2, bufferIn.numberOfChannels)
  let buffer = bufferIn
  if (bufferIn.sampleRate !== targetRate) {
    const length = Math.max(1, Math.ceil(bufferIn.duration * targetRate))
    const offline = new OfflineAudioContext(numCh, length, targetRate)
    const src = offline.createBufferSource()
    src.buffer = bufferIn
    src.connect(offline.destination)
    src.start()
    buffer = await offline.startRendering()
  }
  const chanData = []
  for (let c = 0; c < numCh; c++) chanData.push(floatToInt16(buffer.getChannelData(c)))
  const encoder = new lamejs.Mp3Encoder(numCh, targetRate, kbps)
  const blockSize = 1152
  const blocks = []
  const totalFrames = Math.ceil(buffer.length / blockSize)
  for (let i = 0; i < totalFrames; i++) {
    const l = chanData[0].subarray(i * blockSize, (i + 1) * blockSize)
    const block = numCh > 1
      ? encoder.encodeBuffer(l, chanData[1].subarray(i * blockSize, (i + 1) * blockSize))
      : encoder.encodeBuffer(l)
    if (block.length > 0) blocks.push(block)
    if (onProgress && i % 64 === 0) onProgress((i / totalFrames) * 0.95)
  }
  const end = encoder.flush()
  if (end.length > 0) blocks.push(end)
  if (onProgress) onProgress(1)
  return new Blob(blocks, { type: 'audio/mpeg' })
}

// ---------- 媒体录制封装（M4A / WebM / OGG，实时进度） ----------
const recordBufferToBlob = (buffer, mimeType, onProgress) => new Promise((resolve, reject) => {
  let ctx = null
  try {
    ctx = new AudioContext()
  } catch (err) {
    reject(new Error('无法创建音频上下文'))
    return
  }
  const dest = ctx.createMediaStreamDestination()
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.connect(dest)
  const chunks = []
  let recorder = null
  try {
    recorder = new MediaRecorder(dest.stream, { mimeType })
  } catch (err) {
    ctx.close()
    reject(new Error('当前浏览器不支持该录制格式'))
    return
  }
  const total = Math.max(0.1, buffer.duration)
  const iv = onProgress ? setInterval(() => onProgress(Math.min(1, ctx.currentTime / total)), 200) : null
  recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data) }
  recorder.onerror = () => {
    if (iv) clearInterval(iv)
    try { ctx.close() } catch (err) {}
    reject(new Error('录制失败'))
  }
  recorder.onstop = () => {
    if (iv) clearInterval(iv)
    resolve(new Blob(chunks, { type: mimeType.split(';')[0] }))
    setTimeout(() => { try { ctx.close() } catch (err) {} }, 300)
  }
  src.onended = () => {
    setTimeout(() => { if (recorder && recorder.state !== 'inactive') recorder.stop() }, 150)
  }
  recorder.start(200)
  src.start()
})

// ---------- 转换主流程（用户手势回调） ----------
const convert = async () => {
  if (!audioReady.value || !selectedFormatId.value || isConverting.value) return
  const fmt = targetFormats.find(f => f.id === selectedFormatId.value)
  if (!fmt || !formatSupport.value[fmt.id]) return
  isConverting.value = true
  progress.value = 0
  convertError.value = ''
  resultInfo.value = null
  resultBlob = null
  try {
    let blob = null
    if (fmt.id === 'wav') {
      statusText.value = '正在本地封装 WAV...'
      await new Promise((r) => setTimeout(r, 30))
      const bytes = encodeWav(audioBuffer)
      blob = new Blob([bytes], { type: 'audio/wav' })
      progress.value = 1
    } else if (fmt.id === 'mp3') {
      statusText.value = `正在用 LAME 编码 MP3（${mp3Bitrate.value}kbps，先重采样到 44.1kHz）...`
      blob = await encodeMp3FromBuffer(audioBuffer, mp3Bitrate.value, (p) => { progress.value = p })
    } else {
      statusText.value = `正在录制为 ${fmt.label}（实时进行，约 ${formatTime(duration.value)}）...`
      blob = await recordBufferToBlob(audioBuffer, fmt.mime, (p) => {
        progress.value = p
        statusText.value = `正在录制为 ${fmt.label}（${Math.round(p * 100)}%，请保持页面在前台）...`
      })
    }
    resultBlob = blob
    resultInfo.value = { name: fileInfo.value.base + '-converted.' + fmt.ext, size: blob.size }
    statusText.value = ''
  } catch (err) {
    convertError.value = '转换失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isConverting.value = false
  }
}

const downloadResult = () => {
  if (!resultBlob || !resultInfo.value) return
  const url = URL.createObjectURL(resultBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = resultInfo.value.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
</script>
