<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Waves class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">人声消除 / 伴奏提取</h1>
          <p class="text-sm text-muted-foreground mt-1">本地相位抵消法去除居中人声得到简易伴奏，或反向近似保留人声，A/B 试听后导出 WAV</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        上传一首立体声歌曲，两种模式随选：① 去人声（伴奏）——左右声道相减，让居中的人声因反相抵消而消弱；
        ② 留人声（清唱）——取左右声道均值（中置人声保留、两侧乐器削弱）。处理在浏览器本地用 WebAudio 完成，
        可用「原声 / 处理后」A/B 对比试听，满意后导出标准 WAV。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：音频在本机解码与运算，全程不上传任何服务器。
      </div>
    </div>

    <!-- 主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 上传 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Upload class="w-5 h-5 mr-2 text-primary" /> 1. 上传音频
        </h2>
        <input ref="fileInput" type="file" accept="audio/*" class="hidden" @change="onFileChange" />
        <button
          @click="triggerPick"
          class="w-full py-10 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
        >
          <Music class="w-8 h-8 text-primary" />
          <span class="text-sm font-medium text-foreground">点击选择音频文件</span>
          <span class="text-xs">mp3 / wav / m4a / flac / ogg（需为立体声效果最佳）</span>
        </button>
        <p v-if="isDecoding" class="text-sm text-muted-foreground flex items-center gap-1.5">
          <Loader2 class="w-4 h-4 animate-spin" /> 正在本地解码...
        </p>
        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>

        <div v-if="sourceLabel" class="p-3 bg-muted/50 rounded-lg space-y-1 border-t border-border">
          <p class="text-sm font-medium text-foreground truncate">{{ sourceLabel }}</p>
          <p class="text-xs text-muted-foreground">
            {{ formatTime(duration) }} · {{ sampleRate }} Hz · {{ channels === 1 ? '单声道' : channels + ' 声道' }}
          </p>
        </div>
      </div>

      <!-- 模式与处理 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Waves class="w-5 h-5 mr-2 text-primary" /> 2. 选择模式并处理
        </h2>

        <template v-if="sourceLabel">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">处理模式</label>
            <div class="grid grid-cols-1 gap-2">
              <button
                @click="mode = 'remove'"
                :class="mode === 'remove' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all"
              >
                <div class="flex items-center gap-2">
                  <MicOff class="w-4 h-4" /> 去人声（得伴奏）
                </div>
                <p class="text-xs mt-1 opacity-80 font-normal">L − R 反相相减，消掉居中人声，得到简易伴奏（单声道）</p>
              </button>
              <button
                @click="mode = 'keep'"
                :class="mode === 'keep' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all"
              >
                <div class="flex items-center gap-2">
                  <Mic class="w-4 h-4" /> 留人声（得清唱）
                </div>
                <p class="text-xs mt-1 opacity-80 font-normal">(L + R) / 2 取中置信号，保留居中人声、削弱两侧乐器（单声道）</p>
              </button>
            </div>
          </div>

          <button
            @click="process"
            :disabled="isProcessing"
            class="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
            {{ isProcessing ? '正在本地处理...' : '开始处理' }}
          </button>

          <p v-if="monoWarning" class="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <AlertTriangle class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ monoWarning }}
          </p>
        </template>
        <p v-else class="text-sm text-muted-foreground">先上传音频，即可选择去人声或留人声模式。</p>

        <div class="bg-card border border-border rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            简易相位抵消法，效果有限：只能削弱"左右声道完全相同、居中混音"的人声，对立体声人声、加了混响/合唱效果、或单声道素材基本无效；
            这不是 AI 音源分离，若需高质量人声/伴奏分离请使用专用 AI 模型工具。
          </p>
        </div>
      </div>

      <!-- A/B 与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Play class="w-5 h-5 mr-2 text-primary" /> 3. A/B 试听与导出
        </h2>

        <div v-if="sourceLabel">
          <canvas ref="waveCanvas" class="w-full h-32 bg-muted rounded-lg block" />
          <div class="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />原始波形</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />处理后波形</span>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-muted-foreground">
          处理完成后，这里会叠加显示前后波形
        </div>

        <template v-if="hasProcessed">
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="playBuffer('original')"
              :class="{ 'ring-2 ring-primary': playingWhich === 'original' }"
              class="py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
            >
              <Play class="w-3.5 h-3.5" /> 原声
            </button>
            <button
              @click="playBuffer('processed')"
              :class="{ 'ring-2 ring-primary': playingWhich === 'processed' }"
              class="py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
            >
              <Play class="w-3.5 h-3.5" /> {{ mode === 'remove' ? '伴奏' : '人声' }}
            </button>
            <button
              @click="stopPlayback"
              class="py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
            >
              <Square class="w-3.5 h-3.5" /> 停止
            </button>
          </div>
          <p class="text-xs text-muted-foreground">A/B 按钮从同一段音频起对比，方便判断人声是否被削弱。</p>
          <button
            @click="exportResult"
            :disabled="isExporting"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Download class="w-4 h-4" /> {{ isExporting ? '导出中...' : ('导出' + (mode === 'remove' ? '伴奏' : '人声') + ' WAV') }}
          </button>
          <p v-if="exportStatus" class="text-xs" :class="exportError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">{{ exportStatus }}</p>
        </template>
        <p v-else-if="sourceLabel" class="text-sm text-muted-foreground">点击「开始处理」后即可试听与导出。</p>
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
          在线人声消除 / 伴奏提取工具
        </h2>
        <p class="text-muted-foreground mb-6">
          本工具用经典的"相位抵消"（卡拉 OK 消人声）原理，在浏览器本地把立体声歌曲处理成简易伴奏或近似人声。
          流行音乐的人声通常是居中混音（左右声道内容一致），把左右声道相减，居中的人声就会相互抵消，
          留下的多为两侧的乐器与和声，得到可哼唱、可垫乐的低成本伴奏；反之取左右均值则偏向保留人声。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">相位抵消为什么能消人声</h3>
        <p class="text-muted-foreground mb-6">
          立体声里，居中声源（一般是主唱、有时含 bass 与底鼓）在左右声道几乎完全相同：out = L − R 时，这部分相减归零，
          而摆放在两侧、左右不一致的乐器则保留下来——这就是伴奏。它无需上传、无需训练模型，纯数学运算即可完成，
          这也是它"快但糙"的原因：本质是"凡是左右一致的东西都消掉"，而不是真正听懂了"这是人声"。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">效果与局限（重要）</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-muted-foreground mb-6">
          <li>只能削弱完全居中、且左右相位一致的人声；<strong>立体声人声、加了混响/延迟/合唱效果的残响</strong> 抵消不干净，会有残留。</li>
          <li><strong>单声道素材无效</strong>：L 与 R 相同，相减直接趋近静音，页面会给出提示。</li>
          <li>居中混音的乐器（如部分 bass、底鼓）也会被一并削弱，伴奏会略"空"。</li>
          <li>这是简易相位法，不是 AI 音源分离；追求干净的人声/伴奏分离请使用基于深度学习的分离工具。</li>
          <li>导出为单声道 WAV（无损封装），可再导入其他软件做后续处理。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mb-2">本地处理，隐私与离线</h3>
        <p class="text-muted-foreground mb-6">
          音频通过 WebAudio 的 decodeAudioData 在本机解码，去人声/留人声只是数组逐点运算，导出用内置的 WAV 封装函数完成，
          整条链路不发起任何上传请求，未授权麦克风也不会被访问。除首次加载页面外，断网也能照常处理已选文件。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">能把人声 100% 去掉吗？</h3>
            <p class="text-muted-foreground mt-1">
              不能。相位抵消只对"完全居中、左右同相"的人声有效，实际编曲里的立体声人声、混响尾音、以及和声层都会残留。
              想要干净分离请选用 AI 音源分离工具，本工具定位为快速、本地、隐私的简易方案。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么处理后声音变"空"或偏小声？</h3>
            <p class="text-muted-foreground mt-1">
              L − R 抵消了居中内容（人声、bass、底鼓的一部分），所以整体能量下降、声像变窄，输出是单声道。
              这属于该方法的正常现象，可通过 A/B 试听判断是否可接受，或用其他软件做后续补偿。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些音频格式？导出是什么格式？</h3>
            <p class="text-muted-foreground mt-1">
              可解码浏览器支持的常见格式（mp3、wav、m4a/aac、ogg、flac 等，取决于系统解码器）。处理后统一导出为 16 位 PCM 单声道 WAV，
              无损封装、通用性好，方便再导入剪辑软件。音频全程在本地处理，不上传服务器。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'vocal-remover'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Waves, Upload, Music, Play, Square, Download, Loader2, Mic, MicOff,
  AlertTriangle, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '人声消除伴奏 - 在线相位抵消去人声/伴奏提取',
  description: '免费在线人声消除与伴奏提取工具，浏览器本地相位抵消法(L-R去中置人声、(L+R)/2留人声)，A/B对比试听后导出WAV，简易快速非AI分离，音频不上传',
  keywords: '人声消除, 伴奏提取, 去人声, 在线消音, 相位抵消, 卡拉ok伴奏, 提取人声, 音频伴奏分离',
  author: 'Util工具箱',
  ogTitle: '人声消除 / 伴奏提取 - 有条工具',
  ogDescription: '本地相位抵消法去除居中人声得伴奏，或反向保留人声，A/B 试听后导出 WAV',
  ogUrl: 'https://www.util.cn/tools/vocal-remover',
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
          name: '人声消除伴奏',
          url: 'https://www.util.cn/tools/vocal-remover',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['去人声得伴奏(L-R)', '留人声得清唱((L+R)/2)', 'A/B对比试听', '前后波形', '导出WAV', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '人声消除伴奏', item: 'https://www.util.cn/tools/vocal-remover/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '能把人声 100% 去掉吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能，相位抵消只对完全居中、左右同相的人声有效，立体声人声与混响尾音会残留，需干净分离请用 AI 音源分离。' }
            },
            {
              '@type': 'Question',
              name: '为什么处理后声音变空或偏小声？',
              acceptedAnswer: { '@type': 'Answer', text: 'L-R 抵消了居中的人声与部分 bass、底鼓，整体能量下降且输出为单声道，属该方法正常现象。' }
            },
            {
              '@type': 'Question',
              name: '音频会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，解码与运算全部在浏览器本地 WebAudio 完成，导出为 16 位单声道 WAV，全程不上传服务器。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'vocal-remover')

// ---------- 状态 ----------
const fileInput = ref(null)
const waveCanvas = ref(null)
const sourceLabel = ref('')
const duration = ref(0)
const sampleRate = ref(0)
const channels = ref(0)
const mode = ref('remove')
const isDecoding = ref(false)
const isProcessing = ref(false)
const hasProcessed = ref(false)
const playingWhich = ref('')
const isExporting = ref(false)
const exportStatus = ref('')
const exportError = ref(false)
const loadError = ref('')
const monoWarning = ref('')
const seoContentVisible = ref(true)

// 非响应式大对象与句柄（仅在浏览器/用户手势内使用）
let audioBuffer = null
let processedBuffer = null
let originalPeaks = null
let processedPeaks = null
let ctx = null
let playSrc = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }
const triggerPick = () => { if (fileInput.value) fileInput.value.click() }

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

// ---------- 纯函数（node 自测覆盖）----------
// 去人声（伴奏）：L − R，居中同相内容相消，输出单声道
function centerCut (L, R) {
  const n = Math.min(L.length, R.length)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = L[i] - R[i]
  return out
}

// 留人声（近似）：(L + R) / 2，保留中置人声、削弱两侧乐器
function midSide (L, R) {
  const n = Math.min(L.length, R.length)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = (L[i] + R[i]) / 2
  return out
}

function computeWaveformPeaks (data, bucketCount) {
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

// 16 位 PCM WAV 封装（本页自带一份，不跨文件 import）
function encodeWavFromChannels (chans, rate) {
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
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * blockAlign, true)
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

function encodeWav (buffer) {
  const chans = []
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    chans.push(buffer.getChannelData(c))
  }
  return encodeWavFromChannels(chans, buffer.sampleRate)
}

// ---------- AudioContext（首次于用户手势内创建，之后复用）----------
const ensureCtx = () => {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

// ---------- 设置音源 ----------
const setSource = (buf, label) => {
  audioBuffer = buf
  sourceLabel.value = label
  duration.value = buf.duration
  sampleRate.value = buf.sampleRate
  channels.value = buf.numberOfChannels
  const L = buf.getChannelData(0)
  const R = buf.numberOfChannels >= 2 ? buf.getChannelData(1) : L
  originalPeaks = computeWaveformPeaks(midSide(L, R), 600)
  processedBuffer = null
  processedPeaks = null
  hasProcessed.value = false
  monoWarning.value = ''
  exportStatus.value = ''
  exportError.value = false
  drawWave()
}

// ---------- 解码（用户手势回调内）----------
const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  isDecoding.value = true
  loadError.value = ''
  try {
    const arrayBuffer = await file.arrayBuffer()
    const actx = ensureCtx()
    const buf = await actx.decodeAudioData(arrayBuffer)
    setSource(buf, file.name)
  } catch (err) {
    loadError.value = '解码失败：浏览器无法解析该音频，请尝试 mp3 / wav / m4a / flac / ogg 格式'
  } finally {
    isDecoding.value = false
    e.target.value = ''
  }
}

// ---------- 处理 ----------
const process = () => {
  if (!audioBuffer || isProcessing.value) return
  isProcessing.value = true
  loadError.value = ''
  monoWarning.value = ''
  try {
    const numCh = audioBuffer.numberOfChannels
    const L = audioBuffer.getChannelData(0)
    const R = numCh >= 2 ? audioBuffer.getChannelData(1) : L
    if (numCh < 2) {
      monoWarning.value = '源文件是单声道，左右声道完全相同：去人声会接近静音、留人声约等于原声。相位抵消法需要立体声素材才有效果。'
    }
    const out = mode.value === 'remove' ? centerCut(L, R) : midSide(L, R)
    const actx = ensureCtx()
    const buf = actx.createBuffer(1, out.length, audioBuffer.sampleRate)
    buf.getChannelData(0).set(out)
    processedBuffer = buf
    processedPeaks = computeWaveformPeaks(out, 600)
    hasProcessed.value = true
    playingWhich.value = ''
    drawWave()
  } catch (err) {
    loadError.value = '处理失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isProcessing.value = false
  }
}

// ---------- A/B 试听（用户手势内）----------
const playBuffer = (which) => {
  const buf = which === 'processed' ? processedBuffer : audioBuffer
  if (!buf) return
  stopPlayback()
  const actx = ensureCtx()
  if (actx.state === 'suspended' && actx.resume) actx.resume()
  playingWhich.value = which
  playSrc = actx.createBufferSource()
  playSrc.buffer = buf
  playSrc.connect(actx.destination)
  playSrc.onended = () => {
    if (playingWhich.value === which) playingWhich.value = ''
  }
  playSrc.start()
}

const stopPlayback = () => {
  playingWhich.value = ''
  if (playSrc) { try { playSrc.stop() } catch (err) {} playSrc = null }
}

// ---------- 波形绘制 ----------
const drawWave = () => {
  const canvas = waveCanvas.value
  if (!canvas || !originalPeaks) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || (canvas.parentElement ? canvas.parentElement.clientWidth : 300) || 300
  const h = canvas.clientHeight || 128
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const g = canvas.getContext('2d')
  if (!g) return
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
const exportResult = () => {
  if (!processedBuffer || isExporting.value) return
  isExporting.value = true
  exportStatus.value = ''
  exportError.value = false
  try {
    const bytes = encodeWav(processedBuffer)
    const blob = new Blob([bytes], { type: 'audio/wav' })
    const base = (sourceLabel.value || 'audio').replace(/\.[^.]+$/, '')
    const suffix = mode.value === 'remove' ? '_instrumental' : '_vocals'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = base + suffix + '.wav'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    exportStatus.value = `WAV 导出成功（${formatSize(blob.size)}），文件未离开浏览器`
  } catch (err) {
    exportError.value = true
    exportStatus.value = '导出失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

onUnmounted(() => {
  stopPlayback()
  if (ctx) { try { ctx.close() } catch (err) {} ctx = null }
})
</script>
