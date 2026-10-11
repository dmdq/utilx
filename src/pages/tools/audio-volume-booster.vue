<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Volume2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频音量增大</h1>
          <p class="text-sm text-muted-foreground mt-1">峰值测量 + 响度估算，增益放大后限幅防爆音，录音太小声一键调大</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传录音后自动分析峰值（Peak）、RMS 与响度近似值（LUFS），并给出建议增益；
        通过增益滑条放大音量（0.5x–8x），再经 DynamicsCompressor 限幅器压住峰值避免爆音削波，
        离线渲染后可叠加对比处理前后的波形并导出 WAV / MP3。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：分析、增益与限幅全部通过 WebAudio 在本地完成，音频不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 上传与分析 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Upload class="w-5 h-5 mr-2 text-primary" /> 1. 上传与响度分析
        </h2>

        <input ref="fileInput" type="file" accept="audio/*" class="hidden" @change="onFileChange" />

        <div v-if="!fileInfo">
          <button
            @click="triggerPick"
            class="w-full py-12 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
          >
            <Upload class="w-8 h-8 text-primary" />
            <span class="text-sm font-medium text-foreground">点击选择音频文件</span>
            <span class="text-xs">录音、语音备忘录、会议记录等均可</span>
          </button>
        </div>

        <div v-else class="space-y-3">
          <div class="p-3 bg-muted/50 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">{{ fileInfo.ext }}</span>
              <span class="text-sm font-medium text-foreground truncate">{{ fileInfo.name }}</span>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>大小：{{ formatSize(fileInfo.size) }}</span>
              <span>时长：{{ formatTime(duration) }}</span>
              <span>采样率：{{ sampleRate }} Hz</span>
              <span>声道：{{ channels === 1 ? '单声道' : channels + ' 声道' }}</span>
            </div>
          </div>
          <button @click="triggerPick" class="text-xs text-muted-foreground hover:text-primary transition-colors">
            重新选择文件
          </button>
        </div>

        <p v-if="isDecoding" class="text-sm text-muted-foreground">正在本地解码并分析...</p>
        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>

        <div v-if="analysis" class="space-y-2 border-t border-border pt-4">
          <h3 class="text-sm font-medium text-foreground">分析结果</h3>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 rounded-lg p-2.5 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">峰值 Peak</p>
              <p class="text-sm font-bold text-foreground">{{ analysis.peakDb.toFixed(1) }} dBFS</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-2.5 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">响度近似 (RMS→LUFS)</p>
              <p class="text-sm font-bold text-foreground">{{ analysis.lufs.toFixed(1) }} LUFS</p>
            </div>
          </div>
          <div class="bg-primary/10 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">建议增益（目标峰值 -0.26dBFS ≈ 满幅 0.97）</p>
            <p class="text-lg font-bold text-primary">
              +{{ suggestionDb.toFixed(1) }} dB（{{ suggestionGain.toFixed(2) }}x）
            </p>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            建议增益 = 目标峰值 ÷ 当前峰值，上限 +30dB；LUFS 为基于 RMS 的近似估算，仅供对照参考。
          </p>
        </div>
      </div>

      <!-- 增益与处理 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 2. 增益与限幅
        </h2>

        <template v-if="analysis">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              增益倍数：<span class="text-primary">{{ gainValue.toFixed(1) }}x（{{ gainDb > 0 ? '+' : '' }}{{ gainDb.toFixed(1) }} dB）</span>
            </label>
            <input v-model.number="gainValue" type="range" min="0.5" max="8" step="0.1" class="w-full accent-primary" />
            <div class="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.5x（衰减）</span>
              <span>8x（约 +18dB）</span>
            </div>
          </div>

          <button
            @click="applySuggestion"
            class="w-full py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            应用建议增益（{{ suggestionGain > 8 ? '上限 8x' : suggestionGain.toFixed(2) + 'x' }}）
          </button>

          <div class="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
            <p class="flex items-center gap-1.5 text-foreground font-medium">
              <Zap class="w-3.5 h-3.5 text-primary" /> 处理链
            </p>
            <p>GainNode（{{ gainValue.toFixed(1) }}x） → DynamicsCompressor（threshold -3dB / ratio 12，限幅防爆音） → 离线渲染</p>
          </div>

          <button
            @click="processAudio"
            :disabled="isProcessing"
            class="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {{ isProcessing ? '正在本地渲染...' : '开始处理' }}
          </button>

          <div v-if="processResult" class="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs space-y-1">
            <p class="text-foreground font-medium">处理完成</p>
            <p class="text-muted-foreground">处理后峰值：{{ processResult.peakDb.toFixed(1) }} dBFS
              <span v-if="processResult.limited" class="text-yellow-600 dark:text-yellow-400">（限幅器已介入，峰值被压平）</span>
            </p>
          </div>
        </template>

        <p v-else class="text-sm text-muted-foreground">上传音频后即可调整增益并处理。</p>
      </div>

      <!-- 波形对比与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Download class="w-5 h-5 mr-2 text-primary" /> 3. 对比与导出
        </h2>

        <div v-if="fileInfo">
          <canvas ref="waveCanvas" class="w-full h-36 bg-muted rounded-lg block"></canvas>
          <div class="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block"></span>原始波形</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>处理后波形</span>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-muted-foreground">
          处理完成后这里会叠加显示前后波形
        </div>

        <template v-if="processedBuffer">
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input v-model="alsoMp3" type="checkbox" class="w-4 h-4 rounded border-border" />
            同时导出 MP3（192kbps，编码稍慢）
          </label>
          <button
            @click="exportResult"
            :disabled="isExporting"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Download class="w-4 h-4" /> {{ isExporting ? '导出中...' : '导出' + (alsoMp3 ? ' WAV + MP3' : ' WAV') }}
          </button>
        </template>

        <p v-if="exportStatus" class="text-xs" :class="exportError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">{{ exportStatus }}</p>

        <p class="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          提示：增益不是越大越好，过大增益会让限幅器频繁介入、声音发闷；语音素材建议处理后峰值在 -3dB 左右。
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
          在线音频音量增大工具
        </h2>
        <p class="text-muted-foreground mb-6">
          手机录的课听不清、会议录音像蚊子叫、采访素材声音太小？本工具先测量音频的峰值与 RMS 响度，
          给出把峰值拉到接近满幅的建议增益，再通过增益节点放大并用限幅器压住超标的瞬时峰值，
          让录音变大声的同时不至于破音。处理结果可叠加波形前后对比，一目了然。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">为什么放大后要限幅</h3>
        <p class="text-muted-foreground mb-6">
          数字音频的采样值上限是 1.0，直接乘以增益会让大音量片段超出上限被「削平」，产生刺耳的削波失真。
          本工具在增益之后串联 DynamicsCompressor（阈值 -3dB、压缩比 12），把超出阈值的部分按比例压回，
          在整体变响与避免爆音之间取得平衡；处理后的峰值也会如实显示，便于判断限幅介入程度。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">峰值、RMS 与 LUFS 有什么区别</h3>
        <p class="text-muted-foreground mb-6">
          峰值（Peak）是采样绝对值的最大值，决定会不会削波；RMS 反映一段时间的平均能量，更接近人耳感知的响度；
          LUFS 是广播行业标准响度单位，本工具以 -0.691 + 20·log10(RMS) 做近似估算，可用来粗略判断
          「这段录音到底有多小声」。语音素材常见 -30 至 -20 LUFS，流媒体平台目标响度约 -14 至 -16 LUFS。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">增益调到多少合适？</h3>
            <p class="text-muted-foreground mt-1">
              一般以「处理后峰值 -3dB 左右」为目标：工具给出的建议增益就是把峰值拉到约 0.97 满幅的倍数，
              语音素材可在建议值上略减；若处理结果显示限幅器大量介入，说明增益过大，建议回调。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">能增大视频里的声音吗？</h3>
            <p class="text-muted-foreground mt-1">
              本工具处理纯音频文件。可以先用视频转 GIF/抽帧类工具或本地软件把音轨提取为 m4a/wav，
              再上传到这里增大音量并导出；全程本地处理，素材不会上传。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么处理后声音发闷或发紧？</h3>
            <p class="text-muted-foreground mt-1">
              这是限幅器高强度工作的典型听感：增益过大时大量瞬态被压缩，动态范围损失明显。
              解决办法是降低增益倍数、分多次小幅度提升，或先用电平更高的原始录音。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-volume-booster'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Volume2, ShieldCheck, Upload, Download, Gauge, Zap, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '音频音量增大 - 本地增益放大/响度归一/限幅防爆音',
  description: '在线音频音量增大工具，本地测量峰值与RMS响度（LUFS近似）并给出建议增益，GainNode放大后经限幅器防爆音，波形前后对比，导出WAV/MP3，文件不上传',
  keywords: '音频音量增大, 音量放大器, 录音声音太小, 响度归一化, 增益调整, 音量增强, 录音放大',
  author: 'Util工具箱',
  ogTitle: '音频音量增大 - 有条工具',
  ogDescription: '峰值测量+限幅防爆音，录音太小声一键调大，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/audio-volume-booster',
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
          name: '音频音量增大',
          url: 'https://www.util.cn/tools/audio-volume-booster',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['峰值/RMS分析', 'LUFS近似估算', '建议增益', '0.5x-8x增益滑条', '限幅防爆音', '波形前后对比', '导出WAV/MP3', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '音频音量增大', item: 'https://www.util.cn/tools/audio-volume-booster/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '增益调到多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '一般以处理后峰值 -3dB 左右为目标，可先应用工具给出的建议增益再按听感微调；限幅器大量介入说明增益过大。' }
            },
            {
              '@type': 'Question',
              name: '能增大视频里的声音吗？',
              acceptedAnswer: { '@type': 'Answer', text: '本工具处理纯音频文件，可先用本地软件把视频音轨提取为 m4a/wav 再上传处理，全程本地完成。' }
            },
            {
              '@type': 'Question',
              name: '为什么处理后声音发闷或发紧？',
              acceptedAnswer: { '@type': 'Answer', text: '这是限幅器高强度工作导致动态范围损失的听感，降低增益倍数、分多次小幅度提升即可改善。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-volume-booster')

// ---------- 状态 ----------
const fileInput = ref(null)
const waveCanvas = ref(null)
const fileInfo = ref(null)
const duration = ref(0)
const sampleRate = ref(0)
const channels = ref(0)
const isDecoding = ref(false)
const loadError = ref('')
const analysis = ref(null) // { peak, peakDb, rms, rmsDb, lufs }
const gainValue = ref(1)
const isProcessing = ref(false)
const processResult = ref(null) // { peakDb, limited }
const isExporting = ref(false)
const exportStatus = ref('')
const exportError = ref(false)
const alsoMp3 = ref(false)
const seoContentVisible = ref(true)

// 非响应式大对象
let audioBuffer = null
let originalPeaks = null
let processedPeaks = null
let processedBuffer = null
let lamejsModule = null

const TARGET_PEAK = 0.97

const suggestionGain = computed(() => (analysis.value ? computeGain(analysis.value.peak, TARGET_PEAK) : 1))
const suggestionDb = computed(() => toDb(suggestionGain.value))
const gainDb = computed(() => toDb(gainValue.value))

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }
const applySuggestion = () => {
  gainValue.value = Math.round(Math.min(8, Math.max(0.5, suggestionGain.value)) * 10) / 10
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
function toDb(v) {
  return 20 * Math.log10(Math.max(v, 1e-10))
}

function computeGain(peak, targetPeak) {
  if (!(peak > 0)) return 1
  const MAX_GAIN = Math.pow(10, 30 / 20)
  return Math.min(targetPeak / peak, MAX_GAIN)
}

function analyzeSignal(data) {
  let peak = 0
  let sumSq = 0
  for (let i = 0; i < data.length; i++) {
    const v = data[i]
    const a = v < 0 ? -v : v
    if (a > peak) peak = a
    sumSq += v * v
  }
  const rms = data.length ? Math.sqrt(sumSq / data.length) : 0
  return { peak, rms }
}

function computeWaveformPeaks(data, bucketCount) {
  const mins = new Float32Array(bucketCount)
  const maxs = new Float32Array(bucketCount)
  const size = Math.max(1, Math.floor(data.length / bucketCount))
  for (let b = 0; b < bucketCount; b++) {
    const s = b * size
    const e = Math.min(data.length, s + size)
    let mn = 0
    let mx = 0
    for (let i = s; i < e; i++) {
      const v = data[i]
      if (v < mn) mn = v
      if (v > mx) mx = v
    }
    mins[b] = mn
    maxs[b] = mx
  }
  return { mins, maxs }
}

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

// ---------- 文件解码与分析（用户手势回调内创建 AudioContext） ----------
const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  isDecoding.value = true
  loadError.value = ''
  processResult.value = null
  processedBuffer = null
  processedPeaks = null
  exportStatus.value = ''
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
    const stat = analyzeSignal(buf.getChannelData(0))
    analysis.value = {
      peak: stat.peak,
      peakDb: toDb(stat.peak),
      rms: stat.rms,
      rmsDb: toDb(stat.rms),
      lufs: -0.691 + toDb(stat.rms)
    }
    gainValue.value = Math.round(Math.min(8, Math.max(0.5, computeGain(stat.peak, TARGET_PEAK))) * 10) / 10
    originalPeaks = computeWaveformPeaks(buf.getChannelData(0), 600)
    drawWave()
  } catch (err) {
    loadError.value = '解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式'
  } finally {
    isDecoding.value = false
    e.target.value = ''
  }
}

// ---------- 处理（用户手势回调内创建 OfflineAudioContext） ----------
const processAudio = async () => {
  if (!audioBuffer || isProcessing.value) return
  isProcessing.value = true
  processResult.value = null
  try {
    const offline = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate)
    const src = offline.createBufferSource()
    src.buffer = audioBuffer
    const gainNode = offline.createGain()
    gainNode.gain.value = gainValue.value
    const comp = offline.createDynamicsCompressor()
    comp.threshold.value = -3
    comp.knee.value = 0
    comp.ratio.value = 12
    comp.attack.value = 0.003
    comp.release.value = 0.25
    src.connect(gainNode)
    gainNode.connect(comp)
    comp.connect(offline.destination)
    src.start()
    const rendered = await offline.startRendering()
    processedBuffer = rendered
    const stat = analyzeSignal(rendered.getChannelData(0))
    const before = analysis.value ? analysis.value.peak : 0
    const expected = before * gainValue.value
    processedPeaks = computeWaveformPeaks(rendered.getChannelData(0), 600)
    processResult.value = {
      peakDb: toDb(stat.peak),
      limited: expected > 1.01 || stat.peak < expected * 0.92
    }
    drawWave()
  } catch (err) {
    loadError.value = '处理失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isProcessing.value = false
  }
}

// ---------- 波形叠加绘制 ----------
const drawWave = () => {
  const canvas = waveCanvas.value
  if (!canvas || !originalPeaks) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || canvas.parentElement.clientWidth
  const h = canvas.clientHeight || 144
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, w, h)
  const mid = h / 2
  const scale = h / 2 - 6
  g.strokeStyle = 'rgba(128, 128, 128, 0.35)'
  g.beginPath()
  g.moveTo(0, mid)
  g.lineTo(w, mid)
  g.stroke()
  const drawEnvelope = (peaks, fillStyle) => {
    if (!peaks) return
    const n = peaks.mins.length
    const bw = w / n
    g.fillStyle = fillStyle
    for (let i = 0; i < n; i++) {
      const x = i * bw
      const y0 = mid - peaks.maxs[i] * scale
      const y1 = mid - peaks.mins[i] * scale
      g.fillRect(x, y0, Math.max(1, bw * 0.9), Math.max(1.5, y1 - y0))
    }
  }
  drawEnvelope(originalPeaks, 'rgba(148, 163, 184, 0.7)')
  drawEnvelope(processedPeaks, 'rgba(16, 185, 129, 0.75)')
}

// ---------- 导出 ----------
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const encodeMp3FromBuffer = async (bufferIn, kbps) => {
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
  }
  const end = encoder.flush()
  if (end.length > 0) blocks.push(end)
  return new Blob(blocks, { type: 'audio/mpeg' })
}

const exportResult = async () => {
  if (!processedBuffer || isExporting.value) return
  isExporting.value = true
  exportStatus.value = ''
  exportError.value = false
  try {
    const bytes = encodeWav(processedBuffer)
    const wavBlob = new Blob([bytes], { type: 'audio/wav' })
    triggerDownload(wavBlob, fileInfo.value.base + '-boosted.wav')
    let msg = `WAV 导出成功（${formatSize(wavBlob.size)}）`
    if (alsoMp3.value) {
      exportStatus.value = '正在编码 MP3...'
      const mp3Blob = await encodeMp3FromBuffer(processedBuffer, 192)
      triggerDownload(mp3Blob, fileInfo.value.base + '-boosted.mp3')
      msg += `，MP3 导出成功（${formatSize(mp3Blob.size)}）`
    }
    exportStatus.value = msg + '，文件未离开浏览器'
  } catch (err) {
    exportError.value = true
    exportStatus.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isExporting.value = false
  }
}
</script>
