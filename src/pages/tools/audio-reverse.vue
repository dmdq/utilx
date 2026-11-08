<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Rewind class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">音频倒放</h1>
          <p class="text-sm text-muted-foreground mt-1">把音频倒放生成回声彩蛋效果，支持 mp3/wav/m4a 输入导出 WAV</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传音频后在本地解码，把每个声道的采样序列整个反转，再编码为 WAV（PCM16）导出——
        隐藏人声彩蛋、反向混响素材、测试音频标注（如歌曲结尾藏的倒录留言）一秒生成。
        支持浏览器能解码的所有格式：mp3 / wav / m4a / ogg / flac / webm 等。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：音频全程通过 WebAudio 在本地解码与反转，不会上传到任何服务器。
      </div>
    </div>

    <!-- 大文件内存提示条 -->
    <div class="mb-6 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
      <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>
        内存提示：音频解码后以浮点采样存放，10 分钟立体声 44.1kHz 解码后约占数百 MB 内存，建议处理 ≤5 分钟的音频。
        超长音频请先裁剪，避免浏览器标签页内存溢出。
      </span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：上传与原音频 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <AudioLines class="w-5 h-5 mr-2 text-primary" /> 原音频
        </h2>

        <input ref="fileInput" type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm,.aac" class="hidden" @change="onFileChange" />

        <div v-if="!fileInfo">
          <button
            @click="triggerPick"
            class="w-full py-12 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
          >
            <Upload class="w-8 h-8 text-primary" />
            <span class="text-sm font-medium text-foreground">点击选择音频文件</span>
            <span class="text-xs">mp3 / wav / m4a / ogg / flac，文件仅在本地解码</span>
          </button>
        </div>

        <div v-else class="space-y-3">
          <div class="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <AudioLines class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileInfo.name">{{ fileInfo.name }}</p>
              <p class="text-[10px] text-muted-foreground">{{ sourceInfo }}</p>
            </div>
            <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div class="p-2.5 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-0.5">时长</p>
              <p class="font-bold text-foreground">{{ formatTime(duration) }}</p>
            </div>
            <div class="p-2.5 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-0.5">采样率</p>
              <p class="font-bold text-foreground">{{ sampleRate ? (sampleRate / 1000).toFixed(1).replace(/\.0$/, '') + ' kHz' : '-' }}</p>
            </div>
            <div class="p-2.5 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-0.5">声道</p>
              <p class="font-bold text-foreground">{{ channelLabel }}</p>
            </div>
            <div class="p-2.5 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-0.5">文件大小</p>
              <p class="font-bold text-foreground">{{ formatSize(fileInfo.size) }}</p>
            </div>
          </div>

          <div>
            <canvas ref="sourceCanvas" class="w-full h-36 bg-muted rounded-lg block"></canvas>
            <div class="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0:00</span>
              <span>原始波形</span>
              <span>{{ formatTime(duration) }}</span>
            </div>
          </div>

          <button @click="triggerPick" class="text-xs text-muted-foreground hover:text-primary transition-colors">
            重新选择文件
          </button>
        </div>

        <p v-if="isDecoding" class="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 class="w-4 h-4 animate-spin" /> 正在本地解码音频...
        </p>
        <p v-if="loadError" class="text-sm text-destructive flex items-center gap-2">
          <FileWarning class="w-4 h-4 flex-shrink-0" /> {{ loadError }}
        </p>
        <div v-if="duration > 300" class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
          <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>当前音频超过 5 分钟，解码与反转需要较大内存（约 {{ estMemory }}），如遇卡顿请先裁剪。</span>
        </div>
      </div>

      <!-- 右侧：倒放结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Rewind class="w-5 h-5 mr-2 text-primary" /> 倒放结果
        </h2>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="generateReverse"
            :disabled="!audioBuffer || isGenerating || isDecoding"
            class="py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Loader2 v-if="isGenerating" class="w-4 h-4 animate-spin" />
            <Rewind v-else class="w-4 h-4" />
            {{ isGenerating ? '正在反转采样...' : '生成倒放' }}
          </button>
          <button
            @click="downloadWav"
            :disabled="!resultUrl"
            class="py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            :class="resultUrl ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted text-muted-foreground/60 cursor-not-allowed'"
          >
            <Download class="w-4 h-4" /> 下载 .wav
          </button>
        </div>

        <div v-if="resultUrl" class="space-y-3">
          <div>
            <canvas ref="resultCanvas" class="w-full h-36 bg-muted rounded-lg block"></canvas>
            <div class="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0:00</span>
              <span>倒放波形（首尾已互换）</span>
              <span>{{ formatTime(duration) }}</span>
            </div>
          </div>
          <audio :src="resultUrl" controls class="w-full" preload="metadata"></audio>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2.5 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-0.5">输出时长</p>
              <p class="font-bold text-foreground">{{ formatTime(duration) }}</p>
            </div>
            <div class="p-2.5 bg-muted rounded-lg text-center">
              <p class="text-[10px] text-muted-foreground mb-0.5">WAV 体积</p>
              <p class="font-bold text-green-600 dark:text-green-400">{{ resultSizeLabel }}</p>
            </div>
          </div>
          <p class="text-[10px] text-muted-foreground leading-relaxed">
            输出为 16-bit PCM WAV（与源音频同采样率、同声道数），未压缩属正常现象：mp3 转换为 WAV 后体积会明显变大。
          </p>
        </div>

        <div v-else class="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
          {{ audioBuffer ? '点击「生成倒放」，采样序列会被整个反转' : '上传音频后，这里会显示倒放结果并可试听、下载' }}
        </div>

        <p v-if="generateStatus" class="text-xs" :class="generateError ? 'text-destructive' : 'text-green-600 dark:text-green-400'">
          {{ generateStatus }}
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于音频倒放</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            音频倒放就是把采样的时间轴整个翻过来：原来第 1 秒的声音放到最后，原来的结尾变成开头。
            倒放常用于制作人声彩蛋（很多歌曲把隐藏留言倒录在结尾）、给视频配「倒吸凉气」式的音效素材、
            检查录音里疑似倒放的片段，或纯粹好奇一句话倒过来听是什么样。本工具在浏览器里用 WebAudio
            解码音频，对每个声道做一次原地反转，再编码为标准 WAV 导出，全程不需要联网，也没有排队与次数限制。
          </p>
          <h3 class="text-lg font-semibold text-foreground">倒放是怎么实现的</h3>
          <p>
            解码后音频变成按时间排列的浮点采样数组，倒放只需把每个声道的数组首尾颠倒——不改变采样率、
            不改变音量、不做任何重采样，因此除源文件本身的编码损失外不会引入新的失真。导出采用 16-bit PCM WAV
            （RIFF 标准 44 字节头），任何播放器与剪辑软件都能直接打开。
          </p>
          <h3 class="text-lg font-semibold text-foreground">支持哪些格式，多长的音频合适</h3>
          <p>
            凡是当前浏览器能解码的格式都可以：mp3、wav、m4a/aac、ogg、flac、webm 音频轨等。
            内存方面，解码后的浮点采样约等于「时长 × 采样率 × 声道数 × 4 字节」：10 分钟立体声 44.1kHz
            解码后约占数百 MB 内存，因此建议处理 5 分钟以内的音频；超长素材请先裁剪再倒放。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么导出的 WAV 比原 mp3 大很多？</span>WAV 是未压缩的 PCM 数据（约每分钟立体声 10MB），mp3 则压缩了约 10 倍；倒放不改变时长，体积变大是格式本身的正常现象。</li>
            <li><span class="text-foreground font-medium">倒放会损失音质吗？</span>反转本身是无损的；导出统一为 16-bit PCM，若源是 24-bit 会有一次很小的量化，普通听感几乎不可分辨。</li>
            <li><span class="text-foreground font-medium">立体声会左右颠倒吗？</span>不会。每个声道独立反转，左声道仍是左声道，只是时间轴反了。</li>
            <li><span class="text-foreground font-medium">我的音频文件会被上传吗？</span>不会。解码、反转、编码全部在浏览器本地完成，页面没有上传行为，断网也能用。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-reverse'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Rewind, AudioLines, ShieldCheck, Upload, Download, X, Loader2,
  FileWarning, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '音频倒放 - 在线把音乐/人声反转生成回声彩蛋，导出WAV',
  description: '免费在线音频倒放工具：浏览器本地解码 mp3/wav/m4a/ogg，每个声道采样反转后编码 WAV 下载，带波形预览与试听，支持隐藏人声彩蛋制作，文件不上传服务器',
  keywords: '音频倒放, 声音反转, 音乐倒放, 倒放音乐, 人声彩蛋, 音频倒序, 反向音效',
  author: 'Util工具箱',
  ogTitle: '音频倒放 - 有条工具',
  ogDescription: '把音频倒放生成回声彩蛋效果，支持 mp3/wav/m4a 输入导出 WAV，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/audio-reverse',
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
          '@type': 'SoftwareApplication',
          name: '音频倒放',
          url: 'https://www.util.cn/tools/audio-reverse',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['每个声道采样反转', '波形预览（原始/倒放）', '在线试听', '导出 16-bit PCM WAV', '多格式输入（mp3/wav/m4a/ogg/flac）', '大文件内存提示', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '音频倒放', item: 'https://www.util.cn/tools/audio-reverse/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么导出的 WAV 比原 mp3 大很多？',
              acceptedAnswer: { '@type': 'Answer', text: 'WAV 是未压缩的 PCM 数据（约每分钟立体声 10MB），mp3 压缩了约 10 倍；倒放不改变时长，体积变大是格式本身的正常现象。' }
            },
            {
              '@type': 'Question',
              name: '倒放会损失音质吗？',
              acceptedAnswer: { '@type': 'Answer', text: '反转本身是无损的；导出统一为 16-bit PCM，若源是 24-bit 会有一次很小的量化，普通听感几乎不可分辨。' }
            },
            {
              '@type': 'Question',
              name: '立体声会左右颠倒吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。每个声道独立反转，左声道仍是左声道，只是时间轴首尾互换。' }
            },
            {
              '@type': 'Question',
              name: '多长的音频合适？',
              acceptedAnswer: { '@type': 'Answer', text: '解码后按浮点采样占内存，10 分钟立体声 44.1kHz 约占数百 MB，建议处理 5 分钟以内的音频，超长请先裁剪。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-reverse')

// ---------- 纯函数（node 自测覆盖，PURE 开始） ----------
// 编码 16-bit PCM WAV：44 字节 RIFF 头（小端）+ 交错的 int16 采样；|s|>1 先 clamp 到 ±1
function encodeWav(channels, sampleRate) {
  const numCh = Math.max(1, channels.length)
  const numFrames = channels[0] ? channels[0].length : 0
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
  view.setUint32(16, 16, true)               // fmt 块长度
  view.setUint16(20, 1, true)                // PCM
  view.setUint16(22, numCh, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)  // byte rate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)               // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = channels[c][i]
      if (s > 1) s = 1
      else if (s < -1) s = -1
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }
  return new Uint8Array(buffer)
}

// 每个声道采样序列反转（返回新数组，不修改入参）
function reverseChannels(channels) {
  const out = []
  for (let c = 0; c < channels.length; c++) {
    const src = channels[c]
    const dst = new Float32Array(src.length)
    for (let i = 0, j = src.length - 1; i < src.length; i++, j--) dst[i] = src[j]
    out.push(dst)
  }
  return out
}

// 波形包络（min/max 分桶降采样），供 canvas 简画
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
// ---------- 纯函数（PURE 结束） ----------

// ---------- 状态 ----------
const fileInput = ref(null)
const sourceCanvas = ref(null)
const resultCanvas = ref(null)
const fileInfo = ref(null)
const sourceInfo = ref('')
const duration = ref(0)
const sampleRate = ref(0)
const channelCount = ref(0)
const isDecoding = ref(false)
const isGenerating = ref(false)
const loadError = ref('')
const generateStatus = ref('')
const generateError = ref(false)
const resultUrl = ref('')
const resultSize = ref(0)
const seoContentVisible = ref(true)

// 非响应式大对象（AudioBuffer / 波形缓存 / 音频上下文）
let audioBuffer = null
let sourcePeaks = null
let resultPeaks = null

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

const channelLabel = computed(() => {
  const n = channelCount.value
  if (!n) return '-'
  return n === 1 ? '单声道' : n + ' 声道'
})
const resultSizeLabel = computed(() => (resultSize.value ? formatSize(resultSize.value) : '-'))
// 估算解码内存：时长 × 采样率 × 声道 × 4 字节（仅显示用）
const estMemory = computed(() => {
  if (!sampleRate.value || !channelCount.value) return '数百 MB'
  const bytes = duration.value * sampleRate.value * channelCount.value * 4
  return formatSize(bytes)
})

const formatTime = (t) => {
  const s = Math.max(0, Number(t) || 0)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`
}
const formatSize = (n) => {
  const v = Number(n)
  if (!v || v <= 0) return '0 B'
  if (v < 1024) return v + ' B'
  if (v < 1024 * 1024) return (v / 1024).toFixed(1) + ' KB'
  if (v < 1024 * 1024 * 1024) return (v / 1024 / 1024).toFixed(2) + ' MB'
  return (v / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const triggerPick = () => { if (fileInput.value) fileInput.value.click() }

const clearResult = () => {
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultSize.value = 0
  resultPeaks = null
  generateStatus.value = ''
  generateError.value = false
}

const clearFile = () => {
  clearResult()
  fileInfo.value = null
  sourceInfo.value = ''
  duration.value = 0
  sampleRate.value = 0
  channelCount.value = 0
  loadError.value = ''
  audioBuffer = null
  sourcePeaks = null
}

// ---------- 文件解码（用户手势回调内创建 AudioContext，不进 SSR setup） ----------
const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  isDecoding.value = true
  loadError.value = ''
  clearResult()
  fileInfo.value = null
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ctx = new AudioContext()
    let buf
    try {
      buf = await ctx.decodeAudioData(arrayBuffer)
    } finally {
      ctx.close()
    }
    audioBuffer = buf
    const dot = file.name.lastIndexOf('.')
    const ext = dot >= 0 ? file.name.slice(dot + 1).toUpperCase() : '未知'
    fileInfo.value = { name: file.name, size: file.size, ext }
    sampleRate.value = buf.sampleRate
    channelCount.value = buf.numberOfChannels
    duration.value = buf.duration
    sourceInfo.value = `${ext} · ${buf.sampleRate}Hz · ${buf.numberOfChannels === 1 ? '单声道' : buf.numberOfChannels + ' 声道'}`
    // 多声道取逐桶最大包络
    sourcePeaks = computeWaveformPeaks(buf.getChannelData(0), 600)
    drawWave(sourceCanvas.value, sourcePeaks, 'rgba(148, 163, 184, 0.75)')
  } catch (err) {
    loadError.value = '解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式'
    audioBuffer = null
  } finally {
    isDecoding.value = false
  }
}

// ---------- 生成倒放 ----------
const generateReverse = () => {
  if (!audioBuffer || isGenerating.value) return
  isGenerating.value = true
  generateStatus.value = ''
  generateError.value = false
  try {
    // 抽取各声道 → 反转 → 编码 WAV（纯函数，输入输出均为普通 typed array）
    const channels = []
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      channels.push(audioBuffer.getChannelData(c))
    }
    const reversed = reverseChannels(channels)
    const wavBytes = encodeWav(reversed, audioBuffer.sampleRate)
    const blob = new Blob([wavBytes], { type: 'audio/wav' })
    clearResult()
    resultUrl.value = URL.createObjectURL(blob) // 用户手势回调内创建 objectURL
    resultSize.value = blob.size
    resultPeaks = computeWaveformPeaks(reversed[0], 600)
    generateStatus.value = '倒放完成（' + formatSize(blob.size) + '），可直接试听或下载，文件未离开浏览器'
    // 等 <audio> 与 canvas 挂载后绘制
    requestAnimationFrame(() => {
      drawWave(resultCanvas.value, resultPeaks, 'rgba(16, 185, 129, 0.75)')
    })
  } catch (err) {
    generateStatus.value = '生成失败：' + (err && err.message ? err.message : '内存不足或音频异常，建议裁短后重试')
    generateError.value = true
  } finally {
    isGenerating.value = false
  }
}

// ---------- 波形绘制 ----------
const drawWave = (canvas, peaks, barColor) => {
  if (!canvas || !peaks) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || canvas.parentElement.clientWidth
  const h = canvas.clientHeight || 144
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const g = canvas.getContext('2d')
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, w, h)
  const { mins, maxs } = peaks
  const n = mins.length
  const mid = h / 2
  const scale = h / 2 - 6
  // 中线
  g.strokeStyle = 'rgba(128, 128, 128, 0.35)'
  g.beginPath()
  g.moveTo(0, mid)
  g.lineTo(w, mid)
  g.stroke()
  // 包络
  const bw = w / n
  g.fillStyle = barColor
  for (let i = 0; i < n; i++) {
    const x = i * bw
    const y0 = mid - maxs[i] * scale
    const y1 = mid - mins[i] * scale
    g.fillRect(x, y0, Math.max(1, bw * 0.9), Math.max(1.5, y1 - y0))
  }
}

// ---------- 下载 ----------
const downloadWav = () => {
  if (!resultUrl.value) return
  const base = fileInfo.value && fileInfo.value.name ? fileInfo.value.name.replace(/\.[^.]+$/, '') : 'audio'
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = base + '-reversed.wav'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
</script>
