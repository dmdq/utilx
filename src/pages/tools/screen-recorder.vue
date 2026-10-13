<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Video class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">在线录屏</h1>
          <p class="text-sm text-muted-foreground mt-1">浏览器直接录制屏幕 / 窗口 / 标签页，可选系统声音与麦克风，录完即下载</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        点击开始后选择要录制的屏幕、窗口或标签页，可选同时收录系统声音与麦克风人声（自动混音），录制中实时计时与预览，停止后即可回放并下载 .webm 文件。全程使用浏览器原生能力（getDisplayMedia + MediaRecorder），无需安装任何软件，画面数据不上传服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：控制面板 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 录制设置
          </h2>

          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">同时录制麦克风人声</span>
            <button
              type="button"
              @click="includeMic = !includeMic"
              :disabled="isRecording"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
              :class="includeMic ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="includeMic ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>
          <p class="text-xs text-muted-foreground -mt-2">勾选后浏览器会额外请求麦克风权限，人声与系统声音自动混合</p>

          <!-- 开始 / 停止 -->
          <button
            v-if="!isRecording"
            @click="startRecording"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <CircleDot class="w-4 h-4" /> 开始录屏
          </button>
          <button
            v-else
            @click="stopRecording"
            class="w-full bg-destructive text-white hover:bg-destructive/90 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 animate-pulse"
          >
            <Square class="w-4 h-4" /> 停止录制（{{ formattedElapsed }}）
          </button>

          <!-- 状态 -->
          <div v-if="isRecording" class="bg-muted/50 rounded-lg p-3 text-center">
            <p class="text-xs text-muted-foreground mb-1">正在录制</p>
            <p class="text-2xl font-bold font-mono text-destructive">{{ formattedElapsed }}</p>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p class="text-xs text-destructive">{{ errorMessage }}</p>
          </div>

          <!-- 环境支持情况 -->
          <div class="text-xs text-muted-foreground space-y-1 pt-1">
            <p v-if="checked"><span class="text-foreground">当前浏览器：</span>{{ displaySupported ? '支持录屏' : '不支持 getDisplayMedia（iOS Safari 等）' }}</p>
            <p v-if="checked && !displaySupported">请改用 Chrome / Edge 88+ 或其他桌面版 Chromium 浏览器</p>
          </div>
        </div>

        <!-- 兼容性说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 兼容性说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">Chrome / Edge 88+</span>：完整支持，可在共享弹窗勾选「同时分享标签页音频 / 系统音频」</li>
            <li>• <span class="text-foreground">Firefox</span>：可录屏，但不支持系统声音，仅部分场景支持标签页音频</li>
            <li>• <span class="text-foreground">iOS / 未支持的浏览器</span>：无 getDisplayMedia API，按钮会提示不支持</li>
            <li>• <span class="text-foreground">权限要求</span>：需 HTTPS 或 localhost 环境；开始时请选择「屏幕 / 窗口 / 标签页」之一</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：预览与回放 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 实时预览 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Monitor class="w-5 h-5 mr-2 text-primary" /> 实时预览
            </h2>
            <span v-if="isRecording" class="inline-flex items-center gap-1.5 text-xs text-destructive">
              <span class="w-2 h-2 rounded-full bg-destructive animate-pulse"></span> REC
            </span>
          </div>
          <div class="p-6">
            <video
              ref="previewVideo"
              autoplay
              muted
              playsinline
              class="w-full max-h-96 bg-black rounded-lg"
              :class="isRecording ? '' : 'hidden'"
            ></video>
            <div v-if="!isRecording" class="py-16 text-center">
              <Monitor class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">开始录屏后，这里会实时显示正在录制的画面（仅本地回显，不采集上传）</p>
            </div>
          </div>
        </div>

        <!-- 回放与下载 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <PlayCircle class="w-5 h-5 mr-2 text-primary" /> 录制结果
            </h2>
            <button
              v-if="resultUrl"
              @click="downloadRecording"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Download class="w-3.5 h-3.5" /> 下载 .webm（{{ resultSizeText }}）
            </button>
          </div>
          <div class="p-6">
            <template v-if="resultUrl">
              <video
                :src="resultUrl"
                controls
                playsinline
                class="w-full max-h-96 bg-black rounded-lg"
              ></video>
              <div class="grid grid-cols-3 gap-3 mt-4">
                <div class="bg-muted/50 rounded-lg p-3 text-center">
                  <p class="text-sm font-bold text-foreground">{{ formattedElapsed }}</p>
                  <p class="text-xs text-muted-foreground">录制时长</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-3 text-center">
                  <p class="text-sm font-bold text-foreground">{{ resultSizeText }}</p>
                  <p class="text-xs text-muted-foreground">文件大小</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-3 text-center">
                  <p class="text-sm font-bold text-foreground">.webm</p>
                  <p class="text-xs text-muted-foreground">{{ resultMimeText }}</p>
                </div>
              </div>
              <button
                @click="discardRecording"
                class="mt-4 w-full bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
              >
                丢弃本次录制
              </button>
            </template>
            <div v-else class="py-16 text-center">
              <PlayCircle class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">停止录制后，可在此回放并下载 .webm 文件</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于在线录屏</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            录个操作演示、报障复现视频或线上会议片段，传统做法是装 OBS、录屏软件或投屏到手机再录。现代浏览器已内置屏幕捕获能力（getDisplayMedia）与媒体录制能力（MediaRecorder），本页把两者串起来：点一下开始，选屏幕/窗口/标签页，录完直接下载 webm 视频，零安装。
          </p>
          <h3 class="text-lg font-semibold text-foreground">录制流程与技术方案</h3>
          <p>
            点击开始后浏览器弹出共享选择器，你决定录制整块屏幕、某个应用窗口还是某个标签页；视频轨固定请求 30fps。若在共享弹窗勾选了音频，会拿到系统/标签页声音轨；再勾选「麦克风人声」时，工具用 AudioContext 把系统声音与人声合并成一条混音轨。画面与混音交给 MediaRecorder 按 VP9+Opus 编码（浏览器不支持时自动降级 VP8），停止后打包为 .webm 供回放与下载。
          </p>
          <h3 class="text-lg font-semibold text-foreground">隐私与安全边界</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>画面与声音数据只存在于你的浏览器内存中，页面没有任何上传逻辑</li>
            <li>每次开始录制都需要你手动确认共享对象，浏览器地址栏会持续显示共享状态</li>
            <li>关闭页面或点击结束共享，录制立即停止</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么没有系统声音？</span>共享弹窗里要勾选「分享音频」（Chrome 在 Windows 支持系统声音、macOS 支持标签页声音）；Firefox 基本不支持系统音频，这是浏览器能力差异。</li>
            <li><span class="text-foreground font-medium">下载的是什么格式？</span>WebM（VP9 或 VP8 视频 + Opus 音频），Chrome、Edge、VLC、剪映等均支持；如需 MP4，可用格式转换工具二次处理。</li>
            <li><span class="text-foreground font-medium">手机上能用吗？</span>iOS Safari 不提供 getDisplayMedia，无法录屏；安卓 Chrome 可用，可录屏幕或标签页。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'screen-recorder'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Video, Settings2, CircleDot, Square, Monitor, PlayCircle, Download,
  Info, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '在线录屏 - 浏览器录屏幕/窗口/标签页，可选系统声音与麦克风',
  description: '免费在线录屏工具，浏览器直接录制屏幕、应用窗口或标签页，可选系统声音与麦克风人声自动混音，实时计时预览，停止即回放下载 .webm，基于 getDisplayMedia + MediaRecorder 纯本地录制，无需安装软件',
  keywords: '在线录屏, 屏幕录制, 录屏工具, 网页录屏, 浏览器录屏, 免费录屏, 屏幕录像',
  author: 'Util工具箱',
  ogTitle: '在线录屏 - 有条工具',
  ogDescription: '浏览器直接录屏（可选系统声音/麦克风），无需安装软件，录完即下载',
  ogUrl: 'https://www.util.cn/tools/screen-recorder',
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
          name: '在线录屏',
          url: 'https://www.util.cn/tools/screen-recorder',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['屏幕/窗口/标签页录制', '系统声音与麦克风混音', '实时计时与预览', 'VP9/VP8 自动降级', '录完即回放下载 webm']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '在线录屏', item: 'https://www.util.cn/tools/screen-recorder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么没有录到系统声音？',
              acceptedAnswer: { '@type': 'Answer', text: '共享弹窗里需勾选「分享音频」；Chrome 在 Windows 支持系统声音、macOS 支持标签页声音，Firefox 基本不支持系统音频。' }
            },
            {
              '@type': 'Question',
              name: '下载的是什么格式？',
              acceptedAnswer: { '@type': 'Answer', text: 'WebM（VP9 或 VP8 视频 + Opus 音频），主流播放器与剪辑工具均支持，需要 MP4 时可二次转换。' }
            },
            {
              '@type': 'Question',
              name: '手机上能用吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'iOS Safari 不提供 getDisplayMedia 无法录屏；安卓 Chrome 可用。桌面端建议 Chrome / Edge 88+。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'screen-recorder')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  displaySupported.value = typeof navigator !== 'undefined'
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getDisplayMedia === 'function'
  micSupported.value = typeof navigator !== 'undefined'
    && !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === 'function'
  checked.value = true
})

// ---------- 纯函数区（node 可独立测试） ----------

// 秒 → HH:MM:SS
const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return hh + ':' + mm + ':' + ss
}

// 字节数 → 人类可读大小
const formatSize = (bytes) => {
  const b = Number(bytes)
  if (!isFinite(b) || b <= 0) return '0 B'
  if (b < 1024) return Math.floor(b) + ' B'
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = b
  let i = -1
  do {
    v /= 1024
    i++
  } while (v >= 1024 && i < units.length - 1)
  return v.toFixed(v >= 100 ? 0 : 1) + ' ' + units[i]
}

// MediaRecorder mimeType 优先级：VP9 → VP8 → 默认 webm
const pickMimeType = (isTypeSupported) => {
  if (typeof isTypeSupported !== 'function') return ''
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  for (const c of candidates) {
    if (isTypeSupported(c)) return c
  }
  return ''
}

// ---------- 状态 ----------
const includeMic = ref(false)
const isRecording = ref(false)
const elapsedSec = ref(0)
const errorMessage = ref('')
const displaySupported = ref(false)
const micSupported = ref(false)
const checked = ref(false)
const resultUrl = ref('')
const resultSize = ref(0)
const resultMime = ref('')
const previewVideo = ref(null)
const seoContentVisible = ref(true)

// 运行时句柄（非响应式）
let displayStream = null
let micStream = null
let mixedStream = null
let audioCtx = null
let recorder = null
let chunks = []
let timerId = null

const formattedElapsed = computed(() => formatDuration(elapsedSec.value))
const resultSizeText = computed(() => formatSize(resultSize.value))
const resultMimeText = computed(() => {
  if (!resultMime.value) return 'WebM'
  return resultMime.value.includes('vp9') ? 'VP9 + Opus' : (resultMime.value.includes('vp8') ? 'VP8 + Opus' : 'WebM')
})

// 释放单次录制占用的全部资源
const cleanupStreams = () => {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
  const stopTracks = (stream) => {
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
    }
  }
  stopTracks(displayStream)
  stopTracks(micStream)
  if (mixedStream && mixedStream !== displayStream) stopTracks(mixedStream)
  displayStream = null
  micStream = null
  mixedStream = null
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
  if (previewVideo.value) {
    previewVideo.value.srcObject = null
  }
}

// 错误分类：取消 / 拒绝 / 不支持 / 其他
const classifyError = (err) => {
  if (!err) return '录制失败，请重试'
  const name = err.name || ''
  if (name === 'NotAllowedError') return '已取消屏幕共享选择，或浏览器拒绝了录制权限。'
  if (name === 'NotFoundError') return '未找到可录制的屏幕源。'
  if (name === 'NotSupportedError') return '当前浏览器不支持屏幕录制，请使用 Chrome / Edge 88+ 等桌面浏览器。'
  if (name === 'AbortError') return '共享选择已中断，请重新开始。'
  if (name === 'TypeError') return '当前环境不支持屏幕捕获（需 HTTPS 或 localhost，且为桌面浏览器）。'
  if (name === 'SecurityError') return '浏览器安全策略阻止了屏幕捕获，请确认页面通过 HTTPS 访问。'
  return '录制失败：' + (err.message || name || '未知错误')
}

// 麦克风与系统声音合流；无系统声音时直接用麦克风轨
const buildAudioTracks = async (systemAudioTracks) => {
  if (!includeMic.value) {
    return systemAudioTracks
  }
  if (!micSupported.value) {
    throw Object.assign(new Error('当前浏览器不支持麦克风采集'), { name: 'NotSupportedError' })
  }
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  if (!systemAudioTracks.length) {
    return micStream.getAudioTracks()
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  audioCtx = new AudioCtx()
  const dest = audioCtx.createMediaStreamDestination()
  audioCtx.createMediaStreamSource(new MediaStream(systemAudioTracks)).connect(dest)
  audioCtx.createMediaStreamSource(micStream).connect(dest)
  return dest.stream.getAudioTracks()
}

const startRecording = async () => {
  errorMessage.value = ''
  discardRecording()
  if (!displaySupported.value) {
    errorMessage.value = classifyError({ name: 'NotSupportedError' })
    return
  }
  try {
    // 用户选择屏幕 / 窗口 / 标签页，并请求系统声音
    displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: true
    })
    const audioTracks = await buildAudioTracks(displayStream.getAudioTracks())
    mixedStream = new MediaStream(displayStream.getVideoTracks().concat(audioTracks))

    const mimeType = pickMimeType(typeof MediaRecorder !== 'undefined' ? MediaRecorder.isTypeSupported : undefined)
    recorder = new MediaRecorder(mixedStream, mimeType ? { mimeType } : undefined)
    chunks = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = finishRecording

    // 用户在浏览器工具栏点「停止共享」时自动收尾
    const videoTrack = displayStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.addEventListener('ended', handleSharedEnded)
    }

    recorder.start(1000)
    isRecording.value = true
    elapsedSec.value = 0
    timerId = setInterval(() => {
      elapsedSec.value++
    }, 1000)

    if (previewVideo.value) {
      previewVideo.value.srcObject = displayStream
    }
  } catch (err) {
    errorMessage.value = classifyError(err)
    cleanupStreams()
  }
}

const handleSharedEnded = () => {
  if (isRecording.value) stopRecording()
}

const stopRecording = () => {
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop()
  } else if (isRecording.value) {
    finishRecording()
  }
}

const finishRecording = () => {
  isRecording.value = false
  const mime = recorder && recorder.mimeType ? recorder.mimeType : 'video/webm'
  if (chunks.length) {
    const blob = new Blob(chunks, { type: mime })
    if (resultUrl.value) {
      URL.revokeObjectURL(resultUrl.value)
    }
    resultUrl.value = URL.createObjectURL(blob)
    resultSize.value = blob.size
    resultMime.value = mime
  }
  chunks = []
  cleanupStreams()
}

const discardRecording = () => {
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = ''
  }
  resultSize.value = 0
  resultMime.value = ''
}

const downloadRecording = () => {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = '录屏-' + formatDuration(elapsedSec.value).replace(/:/g, '') + '.webm'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

onUnmounted(() => {
  if (recorder && recorder.state !== 'inactive') {
    try {
      recorder.stop()
    } catch (err) {
      // 页面卸载时忽略停止异常
    }
  }
  cleanupStreams()
  discardRecording()
})
</script>
