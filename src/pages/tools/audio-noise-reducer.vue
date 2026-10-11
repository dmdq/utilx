<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Activity class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">录音机与降噪</h1>
          <p class="text-sm text-muted-foreground mt-1">在线录音或导入音频，高通低通滤波 + 噪声采样谱减降噪，A/B 试听后导出</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        两种输入方式：直接在浏览器里录音（实时显示时长与音量表），或导入已有音频文件。
        降噪采用两级处理：先用高通/低通滤波去除隆隆声与高频嘶声，再通过「采样 1 秒噪声」建立噪声谱，
        用自研 FFT 谱减法减去背景噪声，并可选噪声门收尾。处理前后波形叠加显示，支持 A/B 对比试听。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：录音数据与音频文件全部在本地处理，不会上传到任何服务器。
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Mic class="w-5 h-5 mr-2 text-primary" /> 1. 录音或导入
        </h2>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            @click="mode = 'record'"
            :class="mode === 'record' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <Mic class="w-3.5 h-3.5" /> 在线录音
          </button>
          <button
            @click="mode = 'import'"
            :class="mode === 'import' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <Upload class="w-3.5 h-3.5" /> 导入文件
          </button>
        </div>

        <!-- 录音模式 -->
        <div v-if="mode === 'record'" class="space-y-3">
          <div v-if="!isRecording" class="text-xs text-muted-foreground leading-relaxed">
            点击开始录音后，浏览器会请求麦克风权限；录音数据仅在本地解码处理。
          </div>
          <div v-else class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-red-500">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              录音中 {{ recSeconds.toFixed(1) }} 秒
            </div>
            <div>
              <div class="flex justify-between text-xs text-muted-foreground mb-1">
                <span>输入音量</span><span>{{ Math.round(micLevel * 100) }}%</span>
              </div>
              <div class="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all" :style="{ width: Math.round(micLevel * 100) + '%' }"></div>
              </div>
            </div>
          </div>
          <button
            v-if="!isRecording"
            @click="startRecording"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Mic class="w-4 h-4" /> 开始录音
          </button>
          <button
            v-else
            @click="stopRecording"
            class="w-full py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Square class="w-4 h-4" /> 停止并使用录音
          </button>
          <p v-if="recError" class="text-sm text-red-500">{{ recError }}</p>
        </div>

        <!-- 导入模式 -->
        <div v-else class="space-y-3">
          <input ref="fileInput" type="file" accept="audio/*" class="hidden" @change="onFileChange" />
          <button
            @click="triggerPick"
            class="w-full py-10 border-2 border-dashed border-border rounded-lg hover:bg-muted/60 transition-colors flex flex-col items-center gap-3 text-muted-foreground"
          >
            <Upload class="w-8 h-8 text-primary" />
            <span class="text-sm font-medium text-foreground">点击选择音频文件</span>
            <span class="text-xs">会议录音、语音备忘录等均可</span>
          </button>
          <p v-if="isDecoding" class="text-sm text-muted-foreground">正在本地解码...</p>
        </div>

        <p v-if="loadError" class="text-sm text-red-500">{{ loadError }}</p>

        <div v-if="sourceLabel" class="p-3 bg-muted/50 rounded-lg space-y-1 border-t border-border">
          <p class="text-sm font-medium text-foreground truncate">{{ sourceLabel }}</p>
          <p class="text-xs text-muted-foreground">
            {{ formatTime(duration) }} · {{ sampleRate }} Hz · {{ channels === 1 ? '单声道' : channels + ' 声道（降噪按单声道混合后重排）' }}
          </p>
        </div>
      </div>

      <!-- 降噪参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 2. 降噪设置
        </h2>

        <template v-if="sourceLabel">
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input v-model="hpEnabled" type="checkbox" class="w-4 h-4 rounded border-border" />
              高通滤波去隆隆声
            </label>
            <div v-if="hpEnabled">
              <label class="block text-xs text-muted-foreground mb-1">截止频率：{{ hpFreq }} Hz</label>
              <input v-model.number="hpFreq" type="range" min="40" max="300" step="10" class="w-full accent-primary" />
            </div>
          </div>

          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input v-model="lpEnabled" type="checkbox" class="w-4 h-4 rounded border-border" />
              低通滤波去高频嘶声
            </label>
            <div v-if="lpEnabled">
              <label class="block text-xs text-muted-foreground mb-1">截止频率：{{ lpFreq }} Hz</label>
              <input v-model.number="lpFreq" type="range" min="4000" max="16000" step="500" class="w-full accent-primary" />
            </div>
          </div>

          <div class="border-t border-border pt-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">噪声采样</span>
              <button @click="resampleNoise" class="text-xs text-primary hover:underline">重新采样</button>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              默认取开头 1.0 秒（通常为环境底噪）作为噪声样本；若开头不是纯噪声，请先截掉或改用「导入文件」处理裁剪过的素材。
            </p>
            <p class="text-xs text-foreground">
              噪声电平估计：{{ noiseLevelText }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              降噪强度：<span class="text-primary">{{ strength.toFixed(2) }}（减去噪声谱的 {{ Math.round(strength * 100) }}%）</span>
            </label>
            <input v-model.number="strength" type="range" min="0" max="0.9" step="0.05" class="w-full accent-primary" />
            <div class="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0（不降噪）</span><span>0.5-0.9 推荐</span>
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm text-foreground">
            <input v-model="gateEnabled" type="checkbox" class="w-4 h-4 rounded border-border" />
            噪声门（压低低于底噪 2.5 倍的段落）
          </label>

          <button
            @click="processAudio"
            :disabled="isProcessing"
            class="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {{ isProcessing ? '正在本地降噪...' : '开始降噪' }}
          </button>
        </template>

        <p v-else class="text-sm text-muted-foreground">录音或导入音频后可配置降噪参数。</p>
      </div>

      <!-- 对比与导出 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Waves class="w-5 h-5 mr-2 text-primary" /> 3. A/B 试听与导出
        </h2>

        <div v-if="sourceLabel">
          <canvas ref="waveCanvas" class="w-full h-36 bg-muted rounded-lg block"></canvas>
          <div class="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block"></span>原始波形</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>降噪后波形</span>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-muted-foreground">
          降噪完成后这里会叠加显示前后波形
        </div>

        <template v-if="hasProcessed">
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="playBuffer('original')"
              class="py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
              :class="{ 'ring-2 ring-primary': playingWhich === 'original' }"
            >
              <Play class="w-3.5 h-3.5" /> 原始
            </button>
            <button
              @click="playBuffer('processed')"
              class="py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
              :class="{ 'ring-2 ring-primary': playingWhich === 'processed' }"
            >
              <Play class="w-3.5 h-3.5" /> 降噪后
            </button>
            <button
              @click="stopPlayback"
              class="py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
            >
              <Square class="w-3.5 h-3.5" /> 停止
            </button>
          </div>
          <p class="text-xs text-muted-foreground">A/B 试听会在同一位置切换播放，方便对比降噪效果</p>
          <button
            @click="exportResult"
            :disabled="isExporting"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Download class="w-4 h-4" /> {{ isExporting ? '导出中...' : '导出降噪后 WAV' }}
          </button>
        </template>

        <p v-if="exportStatus" class="text-xs" :class="exportError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">{{ exportStatus }}</p>

        <p class="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          提示：强度过大会产生「水声」伪影，建议从 0.5 开始试；处理仅针对单声道混合信号，立体声素材会合并后重排到各声道。
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
          在线录音机与音频降噪工具
        </h2>
        <p class="text-muted-foreground mb-6">
          一页搞定「录」与「清」：直接在浏览器录音（自动显示时长与实时音量表），或导入会议、课程、采访录音；
          通过高通滤波去除空调与脚步声造成的低频隆隆声，低通滤波收掉高频嘶声，
          再用谱减法把采样到的噪声频谱从整段音频中减去，最后可用噪声门把残留底噪压得更干净。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">谱减法降噪的原理</h3>
        <p class="text-muted-foreground mb-6">
          工具先对「1 秒噪声样本」做短时傅里叶变换，得到每个频点的平均噪声幅度谱；
          处理时把整段音频也分帧做 STFT，从每帧频谱中按强度比例减去噪声谱，
          再逆变换回时域重叠相加重构。它适合去除稳态噪声（风扇、电流声、环境白噪声），
          对突发噪声（关门、咳嗽）效果有限。强度建议从 0.5 起步，过大会出现「水声」音乐噪声伪影。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">为什么全部在本地处理</h3>
        <p class="text-muted-foreground mb-6">
          会议与采访录音往往涉及隐私，上传第三方降噪服务存在泄露风险。本工具的录音直接来自浏览器
          getUserMedia，解码、滤波、FFT 谱减全部在本机 JavaScript 与 WebAudio 中完成，
          断网状态下除页面加载外所有功能照常可用，音频文件从头到尾不离开你的设备。
        </p>

        <h3 class="text-lg font-semibold text-foreground mb-2">A/B 试听怎么用</h3>
        <p class="text-muted-foreground mb-6">
          降噪完成后，用「原始」与「降噪后」两个按钮来回切换播放同一段音频，重点听语音起始的辅音是否自然、
          段落间隙是否安静。若发现人声发闷，可降低降噪强度或关闭低通滤波；若有残留底噪，
          可提高强度或开启噪声门，但注意噪声门过强会切掉弱音节的尾音。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">浏览器录音是什么格式？</h3>
            <p class="text-muted-foreground mt-1">
              录音由浏览器 MediaRecorder 生成，Chrome/Firefox 默认为 WebM(Opus)，Safari 为 MP4(AAC)。
              录完后会立即在本地解码为 PCM 进行降噪处理，导出时统一封装为标准 WAV。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么降噪后人声有点「水声」？</h3>
            <p class="text-muted-foreground mt-1">
              这是谱减法强度过大时的典型音乐噪声伪影：噪声谱被过度减除后，相邻频点出现随机起伏。
              把强度降到 0.5 左右、配合开启高通滤波，通常能明显改善。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">立体声文件会被合并成单声道吗？</h3>
            <p class="text-muted-foreground mt-1">
              是的，为兼顾处理速度，谱减法在单声道混合信号上进行，处理结果会重排到所有声道。
              对语音类素材几乎无影响；音乐素材建议只用滤波部分、避免开启谱减降噪。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'audio-noise-reducer'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Activity, Mic, Upload, Play, Square, Download, Waves, SlidersHorizontal,
  ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '录音机与降噪 - 在线录音/高通低通滤波/谱减法去底噪',
  description: '在线录音机与音频降噪工具，浏览器本地录音或导入音频，高通低通滤波去隆隆声与嘶声，噪声采样谱减法去底噪，A/B试听对比后导出WAV，文件不上传',
  keywords: '在线录音机, 音频降噪, 去除底噪, 录音降噪软件, 会议录音处理, 谱减法降噪, 麦克风录音',
  author: 'Util工具箱',
  ogTitle: '录音机与降噪 - 有条工具',
  ogDescription: '在线录音或导入音频，高通低通滤波+噪声采样降噪，A/B 试听后导出，本地处理',
  ogUrl: 'https://www.util.cn/tools/audio-noise-reducer',
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
          name: '录音机与降噪',
          url: 'https://www.util.cn/tools/audio-noise-reducer',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['在线录音与音量表', '导入本地音频', '高通/低通滤波', '噪声采样谱减法降噪', '噪声门', 'A/B对比试听', '波形前后对比', '导出WAV', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '录音机与降噪', item: 'https://www.util.cn/tools/audio-noise-reducer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '浏览器录音是什么格式？',
              acceptedAnswer: { '@type': 'Answer', text: 'Chrome/Firefox 默认为 WebM(Opus)，Safari 为 MP4(AAC)，录完立即本地解码为 PCM 处理，导出统一为标准 WAV。' }
            },
            {
              '@type': 'Question',
              name: '为什么降噪后人声有点「水声」？',
              acceptedAnswer: { '@type': 'Answer', text: '这是谱减法强度过大产生的音乐噪声伪影，把强度降到 0.5 左右并配合高通滤波通常可明显改善。' }
            },
            {
              '@type': 'Question',
              name: '立体声文件会被合并成单声道吗？',
              acceptedAnswer: { '@type': 'Answer', text: '谱减法在单声道混合信号上进行，结果重排到所有声道，语音素材几乎无影响，音乐素材建议只用滤波。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'audio-noise-reducer')

// ---------- 状态 ----------
const mode = ref('record')
const fileInput = ref(null)
const waveCanvas = ref(null)
const sourceLabel = ref('')
const duration = ref(0)
const sampleRate = ref(0)
const channels = ref(0)
const isDecoding = ref(false)
const loadError = ref('')

const isRecording = ref(false)
const recSeconds = ref(0)
const micLevel = ref(0)
const recError = ref('')

const hpEnabled = ref(true)
const hpFreq = ref(80)
const lpEnabled = ref(false)
const lpFreq = ref(12000)
const strength = ref(0.7)
const gateEnabled = ref(true)
const noiseRms = ref(0)
const isProcessing = ref(false)
const hasProcessed = ref(false)
const playingWhich = ref('')
const isExporting = ref(false)
const exportStatus = ref('')
const exportError = ref(false)
const seoContentVisible = ref(true)

// 非响应式大对象与句柄
let audioBuffer = null
let originalPeaks = null
let processedPeaks = null
let processedBuffer = null
let recStream = null
let recCtx = null
let recAnalyser = null
let recRecorder = null
let recChunks = []
let recMeterBuf = null
let recTimer = null
let meterRaf = null
let playCtx = null
let playSrc = null

const noiseLevelText = computed(() => {
  if (!noiseRms.value) return '尚未采样'
  return toDb(noiseRms.value).toFixed(1) + ' dBFS（RMS）'
})

onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

onUnmounted(() => {
  cleanupRecording()
  stopPlayback()
  if (recTimer) { clearInterval(recTimer); recTimer = null }
})

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

// ---------- 纯函数（node 自测覆盖） ----------
function fftRadix2(re, im) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t
      t = im[i]; im[i] = im[j]; im[j] = t
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wRe = Math.cos(ang)
    const wIm = Math.sin(ang)
    const half = len / 2
    for (let i = 0; i < n; i += len) {
      let curRe = 1
      let curIm = 0
      for (let k = 0; k < half; k++) {
        const uRe = re[i + k]
        const uIm = im[i + k]
        const vRe = re[i + k + half] * curRe - im[i + k + half] * curIm
        const vIm = re[i + k + half] * curIm + im[i + k + half] * curRe
        re[i + k] = uRe + vRe
        im[i + k] = uIm + vIm
        re[i + k + half] = uRe - vRe
        im[i + k + half] = uIm - vIm
        const nRe = curRe * wRe - curIm * wIm
        curIm = curRe * wIm + curIm * wRe
        curRe = nRe
      }
    }
  }
}

function ifftRadix2(re, im) {
  // 交换实虚调正向 FFT 即为逆变换（结果实部已回到 re），仅需除以 N 归一化
  fftRadix2(im, re)
  const n = re.length
  for (let i = 0; i < n; i++) {
    re[i] /= n
    im[i] /= n
  }
}

function hannWindow(n) {
  const w = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / n))
  }
  return w
}

function computeNoiseSpectrum(mono, fftSize, hop, maxFrames) {
  const win = hannWindow(fftSize)
  const acc = new Float32Array(fftSize)
  const re = new Float32Array(fftSize)
  const im = new Float32Array(fftSize)
  let frames = 0
  for (let off = 0; off + fftSize <= mono.length && frames < maxFrames; off += hop, frames++) {
    for (let i = 0; i < fftSize; i++) {
      re[i] = mono[off + i] * win[i]
      im[i] = 0
    }
    fftRadix2(re, im)
    for (let k = 0; k < fftSize; k++) {
      acc[k] += Math.sqrt(re[k] * re[k] + im[k] * im[k])
    }
  }
  if (frames === 0) return null
  for (let k = 0; k < fftSize; k++) acc[k] /= frames
  return acc
}

function spectralSubtract(mono, noiseMag, strengthIn, fftSize) {
  // 强度为 0 时不处理，输出与输入逐位一致
  if (!(strengthIn > 0) || !noiseMag) return mono
  const hop = fftSize / 2
  const win = hannWindow(fftSize)
  const nFrames = Math.max(1, Math.ceil((mono.length - fftSize) / hop) + 1)
  const out = new Float32Array(mono.length + fftSize)
  const wsum = new Float32Array(mono.length + fftSize)
  const re = new Float32Array(fftSize)
  const im = new Float32Array(fftSize)
  for (let f = 0; f < nFrames; f++) {
    const off = f * hop
    for (let i = 0; i < fftSize; i++) {
      re[i] = (off + i < mono.length ? mono[off + i] : 0) * win[i]
      im[i] = 0
    }
    fftRadix2(re, im)
    for (let k = 0; k < fftSize; k++) {
      const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k])
      // 相对下限（保留 5% 原幅度）：抑制音乐噪声伪影，且不会注入原信号没有的能量
      const newMag = Math.max(mag - strengthIn * noiseMag[k], mag * 0.05, 1e-8)
      if (mag > 1e-12) {
        const scale = newMag / mag
        re[k] *= scale
        im[k] *= scale
      }
    }
    ifftRadix2(re, im)
    for (let i = 0; i < fftSize; i++) {
      const pos = off + i
      out[pos] += re[i] * win[i]
      wsum[pos] += win[i] * win[i]
    }
  }
  const result = new Float32Array(mono.length)
  for (let i = 0; i < mono.length; i++) {
    result[i] = wsum[i] > 1e-8 ? out[i] / wsum[i] : mono[i]
  }
  return result
}

function softGate(mono, threshold) {
  const out = new Float32Array(mono.length)
  const env = new Float32Array(mono.length)
  let e = 0
  for (let i = 0; i < mono.length; i++) {
    const a = Math.abs(mono[i])
    e = a > e ? a : e * 0.999 + a * 0.001
    env[i] = e
  }
  for (let i = 0; i < mono.length; i++) {
    if (env[i] >= threshold) {
      out[i] = mono[i]
    } else {
      const r = env[i] / threshold
      out[i] = mono[i] * r * r
    }
  }
  return out
}

function mixToMono(chans) {
  const numCh = chans.length
  if (numCh === 1) return chans[0]
  const len = chans[0].length
  const out = new Float32Array(len)
  for (let c = 0; c < numCh; c++) {
    const d = chans[c]
    for (let i = 0; i < len; i++) out[i] += d[i]
  }
  for (let i = 0; i < len; i++) out[i] /= numCh
  return out
}

function rmsOf(data) {
  let sum = 0
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
  return data.length ? Math.sqrt(sum / data.length) : 0
}

function toDb(v) {
  return 20 * Math.log10(Math.max(v, 1e-10))
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

// ---------- 设置音源 ----------
const setSource = (buf, label) => {
  audioBuffer = buf
  sourceLabel.value = label
  duration.value = buf.duration
  sampleRate.value = buf.sampleRate
  channels.value = buf.numberOfChannels
  originalPeaks = computeWaveformPeaks(buf.getChannelData(0), 600)
  processedBuffer = null
  processedPeaks = null
  hasProcessed.value = false
  noiseRms.value = 0
  drawWave()
}

// ---------- 文件导入（用户手势回调内创建 AudioContext） ----------
const onFileChange = async (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  isDecoding.value = true
  loadError.value = ''
  try {
    const arrayBuffer = await file.arrayBuffer()
    const ctx = new AudioContext()
    const buf = await ctx.decodeAudioData(arrayBuffer)
    await ctx.close()
    setSource(buf, file.name)
  } catch (err) {
    loadError.value = '解码失败：当前浏览器无法解析该音频文件，请尝试 mp3 / wav / m4a 格式'
  } finally {
    isDecoding.value = false
    e.target.value = ''
  }
}

// ---------- 在线录音（用户手势回调内创建 AudioContext 与 MediaRecorder） ----------
const startRecording = async () => {
  if (isRecording.value) return
  recError.value = ''
  try {
    recStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recCtx = new AudioContext()
    const source = recCtx.createMediaStreamSource(recStream)
    recAnalyser = recCtx.createAnalyser()
    recAnalyser.fftSize = 1024
    source.connect(recAnalyser)
    recMeterBuf = new Uint8Array(recAnalyser.fftSize)
    recChunks = []
    recRecorder = new MediaRecorder(recStream)
    recRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) recChunks.push(ev.data)
    }
    recRecorder.onstop = () => { finalizeRecording() }
    recRecorder.start(250)
    isRecording.value = true
    recSeconds.value = 0
    recTimer = setInterval(() => { recSeconds.value += 0.2 }, 200)
    meterRaf = requestAnimationFrame(meterTick)
  } catch (err) {
    cleanupRecording()
    recError.value = '无法访问麦克风：请检查浏览器麦克风权限，或改用「导入文件」模式'
  }
}

const meterTick = () => {
  if (!isRecording.value || !recAnalyser) return
  recAnalyser.getByteTimeDomainData(recMeterBuf)
  let sum = 0
  for (let i = 0; i < recMeterBuf.length; i++) {
    const d = (recMeterBuf[i] - 128) / 128
    sum += d * d
  }
  micLevel.value = Math.min(1, Math.sqrt(sum / recMeterBuf.length) * 4)
  meterRaf = requestAnimationFrame(meterTick)
}

const stopRecording = () => {
  if (recRecorder && recRecorder.state !== 'inactive') recRecorder.stop()
  isRecording.value = false
  if (recTimer) { clearInterval(recTimer); recTimer = null }
  if (meterRaf) { cancelAnimationFrame(meterRaf); meterRaf = null }
  micLevel.value = 0
}

const cleanupRecording = () => {
  if (recStream) {
    recStream.getTracks().forEach((t) => t.stop())
    recStream = null
  }
  if (recCtx) { try { recCtx.close() } catch (err) {} recCtx = null }
  recAnalyser = null
  recMeterBuf = null
}

const finalizeRecording = async () => {
  const blob = new Blob(recChunks, { type: recRecorder && recRecorder.mimeType ? recRecorder.mimeType : 'audio/webm' })
  recChunks = []
  cleanupRecording()
  const seconds = recSeconds.value
  try {
    const buf = await blob.arrayBuffer()
    const ctx = new AudioContext()
    const decoded = await ctx.decodeAudioData(buf)
    await ctx.close()
    setSource(decoded, `在线录音（${formatTime(seconds)}）`)
  } catch (err) {
    loadError.value = '录音解码失败，请重试或改用「导入文件」模式'
  }
}

// ---------- 降噪主流程（用户手势回调内创建 OfflineAudioContext） ----------
const resampleNoise = () => {
  // 重新取开头 1 秒估计噪声电平（谱减时按同样区间计算噪声谱）
  if (!audioBuffer) return
  const mono = mixToMonoChannels(audioBuffer)
  const noiseLen = Math.min(mono.length, Math.ceil(audioBuffer.sampleRate * 1.0))
  noiseRms.value = rmsOf(mono.subarray(0, noiseLen))
}

const mixToMonoChannels = (buffer) => {
  const chans = []
  for (let c = 0; c < buffer.numberOfChannels; c++) chans.push(buffer.getChannelData(c))
  return mixToMono(chans)
}

const processAudio = async () => {
  if (!audioBuffer || isProcessing.value) return
  isProcessing.value = true
  loadError.value = ''
  try {
    // 1) 滤波（高通/低通，OfflineAudioContext 渲染）
    let filtered = audioBuffer
    if (hpEnabled.value || lpEnabled.value) {
      const offline = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate)
      const src = offline.createBufferSource()
      src.buffer = audioBuffer
      let node = src
      if (hpEnabled.value) {
        const hp = offline.createBiquadFilter()
        hp.type = 'highpass'
        hp.frequency.value = hpFreq.value
        hp.Q.value = 0.707
        node.connect(hp)
        node = hp
      }
      if (lpEnabled.value) {
        const lp = offline.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = lpFreq.value
        lp.Q.value = 0.707
        node.connect(lp)
        node = lp
      }
      node.connect(offline.destination)
      src.start()
      filtered = await offline.startRendering()
    }

    // 2) 单声道混合（工程简化：单声道处理后重排到所有声道）
    const mono = mixToMonoChannels(filtered)
    const sr = filtered.sampleRate

    // 3) 噪声采样（开头 1 秒）与谱减法
    const fftSize = 1024
    const hop = 512
    const noiseLen = Math.min(mono.length, Math.ceil(sr * 1.0))
    const noiseSeg = mono.subarray(0, noiseLen)
    noiseRms.value = rmsOf(noiseSeg)
    const maxFrames = Math.max(4, Math.floor((noiseLen - fftSize) / hop) + 1)
    const noiseMag = computeNoiseSpectrum(noiseSeg, fftSize, hop, maxFrames)
    let outMono = mono
    if (noiseMag && strength.value > 0) {
      outMono = spectralSubtract(mono, noiseMag, strength.value, fftSize)
    }

    // 4) 噪声门
    if (gateEnabled.value) {
      outMono = softGate(outMono, Math.max(1e-6, noiseRms.value) * 2.5)
    }

    // 5) 写回多声道 AudioBuffer
    const builder = new OfflineAudioContext(1, 1, sr)
    const outBuf = builder.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, sr)
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      outBuf.getChannelData(c).set(outMono)
    }
    processedBuffer = outBuf
    processedPeaks = computeWaveformPeaks(outMono, 600)
    hasProcessed.value = true
    drawWave()
  } catch (err) {
    loadError.value = '降噪失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    isProcessing.value = false
  }
}

// ---------- A/B 试听（用户手势回调内创建 AudioContext） ----------
const playBuffer = (which) => {
  const buf = which === 'processed' ? processedBuffer : audioBuffer
  if (!buf) return
  stopPlayback()
  playingWhich.value = which
  playCtx = new AudioContext()
  playSrc = playCtx.createBufferSource()
  playSrc.buffer = buf
  playSrc.connect(playCtx.destination)
  playSrc.onended = () => {
    if (playingWhich.value === which) stopPlayback()
  }
  playSrc.start()
}

const stopPlayback = () => {
  playingWhich.value = ''
  if (playSrc) { try { playSrc.stop() } catch (err) {} playSrc = null }
  if (playCtx) { try { playCtx.close() } catch (err) {} playCtx = null }
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
const exportResult = () => {
  if (!processedBuffer || isExporting.value) return
  isExporting.value = true
  exportStatus.value = ''
  exportError.value = false
  try {
    const bytes = encodeWav(processedBuffer)
    const blob = new Blob([bytes], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'denoised.wav'
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
</script>
