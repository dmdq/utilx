<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Music class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频提取音频</h1>
          <p class="text-sm text-muted-foreground mt-1">从视频抽取音轨导出 WebM/M4A/MP3，把网课演唱会变成能听的</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        选择本地视频，双路径在浏览器内提取音轨：① 首选 MediaRecorder 实时录制——播放视频的同时抓取音频轨，
        编码为 WebM(Opus) 或 M4A(AAC)，几乎所有容器都能走通；② 可选 MP3——先用 WebAudio 解码出音频采样，
        再用内置 LAME 编码器纯计算转码，速度快于实时；容器解码失败时 MP3 选项自动置灰并说明原因。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码、录制与编码全部在本机完成，视频不会上传到任何服务器。
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- ① 选择视频 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Upload class="w-5 h-5 mr-2 text-primary" /> 1. 选择视频
        </h2>

        <input ref="fileInput" type="file" accept="video/*,.mp4,.webm,.mov,.m4v" class="hidden" @change="handleFileChange" />

        <div
          v-if="!fileName"
          class="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
          :class="{ 'border-primary/60 bg-primary/5': isDragging }"
          @click="triggerFileSelect"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <Upload class="w-8 h-8 mx-auto mb-2 text-primary" />
          <p class="text-sm font-medium text-foreground">点击或拖入视频文件</p>
          <p class="text-xs text-muted-foreground mt-1">mp4 / webm / mov / m4v 均可（上限 800MB）</p>
          <p class="text-[10px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <ShieldCheck class="w-3 h-3" /> 本地提取，视频不上传
          </p>
        </div>

        <div v-else class="space-y-3">
          <div class="p-3 bg-muted/50 rounded-lg space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">{{ fileExt }}</span>
              <span class="text-sm font-medium text-foreground truncate" :title="fileName">{{ fileName }}</span>
              <button @click="clearFile" class="ml-auto p-1 text-muted-foreground hover:text-destructive" title="移除">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>大小：{{ formatSize(fileSize) }}</span>
              <span>时长：{{ duration ? formatTime(duration) : '读取中…' }}</span>
              <span v-if="videoSize.w">画面：{{ videoSize.w }}×{{ videoSize.h }}</span>
              <span v-if="audioInfo">音轨：{{ audioInfo.sampleRate }} Hz · {{ audioInfo.channels === 1 ? '单声道' : audioInfo.channels + ' 声道' }}</span>
            </div>
          </div>
          <!-- 预览播放器（录制音轨时从这里取声） -->
          <video
            ref="videoEl"
            :src="videoUrl"
            playsinline
            preload="auto"
            controls
            class="w-full max-h-64 rounded-lg bg-black"
            @loadedmetadata="onLoadedMetadata"
            @error="onVideoError"
            @timeupdate="onTimeUpdate"
            @ended="onVideoEnded"
          ></video>
          <button @click="triggerFileSelect" class="text-xs text-muted-foreground hover:text-primary transition-colors">
            重新选择文件
          </button>
          <p v-if="fileSize > 300 * 1024 * 1024" class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Info class="w-3 h-3 flex-shrink-0" /> 大文件提醒：超过 300MB 已跳过 MP3 解码预检（避免内存压力），仍可用录制路径提取。
          </p>
        </div>

        <!-- MP3 预检状态 -->
        <div class="text-xs space-y-1.5 border-t border-border pt-3">
          <p class="text-muted-foreground">MP3 路径预检：</p>
          <p v-if="decodeState === 'idle'" class="text-muted-foreground">选择视频后自动在本机预检能否解码音频…</p>
          <p v-else-if="decodeState === 'trying'" class="text-muted-foreground flex items-center gap-1.5">
            <Loader2 class="w-3.5 h-3.5 animate-spin" /> 正在本地解码该容器的音轨…
          </p>
          <p v-else-if="decodeState === 'ok'" class="text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5" /> 解码成功，MP3 可用（本地 WebAudio 完成）
          </p>
          <p v-else class="text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ decodeNote }}</span>
          </p>
        </div>
      </div>

      <!-- ② 选择格式与提取 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Music class="w-5 h-5 mr-2 text-primary" /> 2. 输出格式与提取
        </h2>

        <div class="space-y-2">
          <button
            v-for="fmt in outputFormats"
            :key="fmt.id"
            @click="selectFormat(fmt)"
            :disabled="!fmt.available || extracting"
            class="w-full text-left p-3 rounded-lg border transition-all"
            :class="[
              fmt.available
                ? (selectedFormatId === fmt.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/60')
                : 'border-border bg-muted/30 cursor-not-allowed opacity-60'
            ]"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-foreground">{{ fmt.label }}</span>
              <span
                v-if="fmt.available"
                class="text-xs"
                :class="selectedFormatId === fmt.id ? 'text-primary' : 'text-muted-foreground'"
              >{{ selectedFormatId === fmt.id ? '已选中' : '可用' }}</span>
              <span v-else class="text-xs text-muted-foreground/70">置灰</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ fmt.desc }}</p>
            <p v-if="!fmt.available" class="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{{ fmt.unavailableReason }}</p>
          </button>
        </div>

        <!-- MP3 码率 -->
        <div v-if="selectedFormatId === 'mp3'">
          <label class="block text-sm font-medium text-foreground mb-2">MP3 码率</label>
          <div class="flex gap-2">
            <button
              v-for="b in bitrateOptions"
              :key="b"
              @click="mp3Bitrate = b"
              :class="mp3Bitrate === b ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            >{{ b }}k</button>
          </div>
        </div>

        <button
          @click="startExtract"
          :disabled="!canStart"
          class="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Loader2 v-if="extracting" class="w-4 h-4 animate-spin" />
          <Music v-else class="w-4 h-4" />
          {{ extracting ? '提取中，请保持前台' : startButtonLabel }}
        </button>

        <button
          v-if="extracting && selectedFormatId !== 'mp3'"
          @click="stopEarly"
          class="w-full py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-all"
        >
          提前停止（输出已录制的部分）
        </button>

        <div v-if="extracting || progress > 0">
          <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" :style="{ width: Math.min(100, Math.round(progress * 100)) + '%' }"></div>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">{{ statusText }}</p>
        </div>

        <div v-if="error" class="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <FileWarning class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>
        <div v-if="warnText" class="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg p-3">
          <Info class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ warnText }}</span>
        </div>
      </div>

      <!-- ③ 结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Download class="w-5 h-5 mr-2 text-primary" /> 3. 下载结果
        </h2>

        <template v-if="resultInfo">
          <div class="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2">
            <p class="text-sm font-medium text-foreground break-all flex items-center gap-2">
              <Music class="w-4 h-4 text-primary flex-shrink-0" /> {{ resultInfo.name }}
            </p>
            <div class="text-sm space-y-1">
              <div class="flex justify-between">
                <span class="text-muted-foreground">输出大小</span>
                <span class="text-foreground">{{ formatSize(resultInfo.size) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">音频时长</span>
                <span class="text-foreground">{{ formatTime(resultInfo.durationSec) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">相对原视频</span>
                <span class="text-green-600 dark:text-green-400 font-medium">{{ sizeShareOfVideo }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">格式</span>
                <span class="text-foreground">{{ resultInfo.format.toUpperCase() }}</span>
              </div>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Download class="w-4 h-4" /> 保存到本地（{{ formatSize(resultInfo.size) }}）
          </button>
        </template>

        <div v-else class="py-10 text-center text-sm text-muted-foreground">
          提取完成后，这里会显示输出文件大小、时长与下载按钮
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          说明：WebM/M4A 走实时录制路径，耗时≈视频时长，期间会播放视频并出声（可戴耳机）；
          MP3 为本地解码后纯计算转码，通常几十秒内完成。提取的音频只包含原视频音轨，无损原音无法承诺。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于从视频提取音频</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            网课录屏想反复听、演唱视频想当随身音乐、会议录像想导出发言做备份——把视频里的音轨单独拿出来，
            比抱着大视频方便得多。本工具在浏览器里完成整个提取过程，视频文件不上传任何服务器；
            常见做法要么依赖服务端 FFmpeg 排队，要么要装客户端软件，这里两条路都替你省了。
          </p>

          <h3 class="text-lg font-semibold text-foreground">两条提取路径怎么理解</h3>
          <p>
            路径一（首选，最通用）：把视频当作直播源，播放时用浏览器录制能力抓取它的音频轨，
            编码为 WebM(Opus) 或 M4A(AAC)。只要视频能在浏览器里出声，就能走通，缺点是实时——录多久要等多久。
            路径二（可选 MP3）：先用 WebAudio 把文件里的音频解码成 PCM 采样，再用内置 LAME 编码器转成 MP3，
            速度快且全平台兼容；但部分容器（不少 mp4 封装）浏览器拒绝整体解码，此时会预检失败并禁用 MP3，请走路径一。
          </p>

          <h3 class="text-lg font-semibold text-foreground">输出格式怎么选</h3>
          <p>
            MP3 兼容性最强（车载、老播放器、剪辑软件通吃），提供 128/192/320kbps 三档；
            WebM(Opus) 同码率音质更好、体积最小，适合网盘备份与网页使用；
            M4A(AAC) 是 iPhone 生态友好格式，Safari 录制支持。
            音质上限由源视频音轨决定（常见 AAC 128～256kbps），转更高码率不会让声音更清晰。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么 MP3 选项是灰的？</span>MP3 路径需要浏览器先把音轨解码为 PCM，部分容器（尤其带视频的 mp4/mov 封装）WebAudio 会解码失败，此时会提示改用 WebM/M4A 录制路径，成功率接近 100%。</li>
            <li><span class="text-foreground font-medium">提取要等多久？中途切走标签页会怎样？</span>录制路径按播放速度实时进行，10 分钟视频约需 10 分钟，请保持页面在前台；切走或关闭会中断，可点「提前停止」拿到已录部分。</li>
            <li><span class="text-foreground font-medium">提取出的音频没有声音？</span>说明源视频本身没有可播放的音轨（如无声录屏、纯画面直播回放），或音轨编码浏览器不支持；可先在预览里确认能听到声音再提取。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'extract-audio'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Music, Upload, Download, X, Loader2, CheckCircle2,
  ShieldCheck, Info, FileWarning, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '视频提取音频 - 从视频抽取音轨导出MP3/WebM/M4A | Util工具箱',
  description: '免费在线视频提取音频：双路径本地处理——MediaRecorder 实时录制导出 WebM(Opus)/M4A(AAC)，WebAudio+LAME 解码转码 MP3，视频不上传服务器，显示输出大小与时长',
  keywords: '视频提取音频, mp4转mp3, 视频转音频, 提取背景音乐, 音轨分离, 音频提取工具, 网课导出音频',
  author: 'Util工具箱',
  ogTitle: '视频提取音频 - 有条工具',
  ogDescription: '从视频抽取音轨导出 WebM/M4A/MP3，本地处理不上传',
  ogUrl: 'https://www.util.cn/tools/extract-audio',
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
          name: '视频提取音频',
          url: 'https://www.util.cn/tools/extract-audio',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['WebM(Opus) 导出', 'M4A(AAC) 导出', 'MP3 LAME 编码', '解码预检自动置灰', '提前停止', '输出大小时长展示', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '视频提取音频', item: 'https://www.util.cn/tools/extract-audio/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 MP3 选项是灰的？',
              acceptedAnswer: { '@type': 'Answer', text: 'MP3 路径需要浏览器先把音轨解码为 PCM，部分容器（尤其带视频的 mp4/mov 封装）会解码失败，此时请改用 WebM/M4A 录制路径，成功率接近 100%。' }
            },
            {
              '@type': 'Question',
              name: '提取要等多久？',
              acceptedAnswer: { '@type': 'Answer', text: '录制路径按播放速度实时进行，10 分钟视频约需 10 分钟，请保持页面在前台；MP3 为解码后纯计算转码，通常几十秒完成。' }
            },
            {
              '@type': 'Question',
              name: '提取出的音频没有声音？',
              acceptedAnswer: { '@type': 'Answer', text: '说明源视频本身没有可播放音轨或音轨编码不受支持，可先在预览播放器确认能听到声音再提取。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'extract-audio')

// ---------- 纯函数（node 自测覆盖） ----------
// 容器判断：该扩展名的文件是否值得尝试用 AudioContext.decodeAudioData 解码（MP3 路径预检）
// true 只代表「值得一试」，浏览器仍可能在运行时失败；avi/wmv/flv/mkv/ts 等浏览器普遍无法解码 → false
const DECODE_CANDIDATE_EXTS = ['mp4', 'm4v', 'mov', 'm4a', 'aac', 'mp3', 'wav', 'ogg', 'oga', 'opus', 'flac', 'webm', 'weba', '3gp']
function canTryDecode(ext) {
  const e = String(ext || '').toLowerCase().replace(/^\./, '')
  return DECODE_CANDIDATE_EXTS.includes(e)
}
// ---------- 纯函数结束 ----------

const formatTime = (t) => {
  const s = Math.max(0, Math.floor(Number(t) || 0))
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}:${r < 10 ? '0' : ''}${r}`
}
const formatSize = (n) => {
  if (!n) return '0 B'
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 状态 ----------
const fileInput = ref(null)
const videoEl = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const fileExt = ref('')
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)
const decodeState = ref('idle')
const decodeNote = ref('')
const audioInfo = ref(null)
const canMp3 = ref(false)

const selectedFormatId = ref('webm')
const mp3Bitrate = ref(192)
const bitrateOptions = [128, 192, 320]
const extracting = ref(false)
const progress = ref(0)
const statusText = ref('')
const error = ref('')
const warnText = ref('')
const partial = ref(false)
const recordedSeconds = ref(0)

const resultUrl = ref('')
const resultInfo = ref(null)

const seoContentVisible = ref(true)

// 浏览器能力（onMounted 检测）
const support = ref({ recorder: false, webm: false, m4a: false })
const mp3LibReady = ref(false)

// 非响应式内部件
let audioBuffer = null        // MP3 路径的解码结果
let recorder = null
let chunks = []
let audioCtx = null           // WebAudio 分离音轨用（MediaElementSource 与元素绑定，创建后复用）
let audioSourceNode = null
let audioDestNode = null
let audioRoute = 'unknown'    // 'capture' | 'webaudio' | 'unknown'
let lamejsModule = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const baseName = computed(() => (fileName.value || 'video').replace(/\.[^.]+$/, ''))
const sizeShareOfVideo = computed(() => {
  if (!resultInfo.value || !fileSize.value) return '—'
  return Math.max(0, Math.round((resultInfo.value.size / fileSize.value) * 100))
})

// available 在 computed 求值时直接读取当前能力状态，随依赖自动重算
const outputFormats = computed(() => [
  {
    id: 'webm',
    label: 'WebM（Opus）· 首选',
    desc: '实时录制路径，容器通用性最好；128kbps 高压缩比',
    available: support.value.webm,
    unavailableReason: '当前浏览器不支持 audio/webm;codecs=opus 录制，请换 Chrome/Firefox 或选 M4A'
  },
  {
    id: 'm4a',
    label: 'M4A（AAC）',
    desc: '实时录制路径，iPhone/Safari 生态友好',
    available: support.value.m4a,
    unavailableReason: '当前浏览器不支持 audio/mp4 录制（Chrome/Firefox 请用 WebM）'
  },
  {
    id: 'mp3',
    label: 'MP3（LAME 本地转码）',
    desc: '先解码再编码，速度快、兼容性最强，128/192/320kbps 可选',
    available: canMp3.value && mp3LibReady.value,
    unavailableReason: decodeState.value === 'trying'
      ? '本地解码预检中…'
      : (decodeState.value === 'skip' || decodeState.value === 'fail'
        ? decodeNote.value || '浏览器无法解码该容器的音频，请改用 WebM/M4A 录制路径'
        : '预检成功后可用（需要浏览器能解码本容器音轨）')
  }
])

const currentFormat = computed(() => outputFormats.value.find((f) => f.id === selectedFormatId.value) || null)

const canStart = computed(() => {
  if (extracting.value) return false
  if (!videoUrl.value || !duration.value) return false
  if (!currentFormat.value || !currentFormat.value.available) return false
  if (selectedFormatId.value === 'mp3') return !!audioBuffer
  return support.value.recorder
})

const startButtonLabel = computed(() => {
  if (selectedFormatId.value === 'mp3') return `开始转码 MP3（${mp3Bitrate.value}kbps）`
  return `开始提取（实时录制，约 ${formatTime(duration.value)}）`
})

const selectFormat = (fmt) => {
  if (!fmt.available) return
  selectedFormatId.value = fmt.id
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  // 能力检测（onMounted 中执行，避免 SSR 阶段访问浏览器 API）
  const canCheck = typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
  support.value = {
    recorder: canCheck,
    webm: canCheck && MediaRecorder.isTypeSupported('audio/webm;codecs=opus'),
    m4a: canCheck && MediaRecorder.isTypeSupported('audio/mp4')
  }
  if (!support.value.webm && support.value.m4a) selectedFormatId.value = 'm4a'
  // 预加载 MP3 编码器（动态 import，仅在客户端执行）
  import('@breezystack/lamejs')
    .then((mod) => {
      lamejsModule = mod
      mp3LibReady.value = true
    })
    .catch(() => {})
})

// ---------- 文件选择与 MP3 预检 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const resetAll = () => {
  stopRecorderInternal()
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = ''
  resultInfo.value = null
  fileName.value = ''
  fileSize.value = 0
  fileExt.value = ''
  duration.value = 0
  videoSize.value = { w: 0, h: 0 }
  audioBuffer = null
  canMp3.value = false
  decodeState.value = 'idle'
  decodeNote.value = ''
  audioInfo.value = null
  progress.value = 0
  recordedSeconds.value = 0
  partial.value = false
  error.value = ''
  warnText.value = ''
}

// MP3 路径预检：本地解码该容器能否产出 PCM（大文件直接跳过，避免 arrayBuffer + PCM 双份内存）
const tryMp3Decode = async (f, ext) => {
  if (!canTryDecode(ext)) {
    decodeState.value = 'skip'
    decodeNote.value = `.${ext} 容器浏览器通常无法整体解码音频，MP3 路径不可用，请使用 WebM/M4A 录制路径`
    return
  }
  if (f.size > 300 * 1024 * 1024) {
    decodeState.value = 'skip'
    decodeNote.value = '文件超过 300MB，已跳过 MP3 解码预检（避免内存压力），请使用 WebM/M4A 录制路径'
    return
  }
  decodeState.value = 'trying'
  decodeNote.value = ''
  try {
    const arrayBuffer = await f.arrayBuffer()
    const ctx = new AudioContext()
    const buf = await ctx.decodeAudioData(arrayBuffer)
    await ctx.close()
    audioBuffer = buf
    canMp3.value = true
    decodeState.value = 'ok'
    audioInfo.value = { sampleRate: buf.sampleRate, channels: buf.numberOfChannels, duration: buf.duration }
  } catch (err) {
    audioBuffer = null
    canMp3.value = false
    decodeState.value = 'fail'
    decodeNote.value = '浏览器无法解码该容器的音频（mp4 封装常见），MP3 选项已置灰，请使用 WebM/M4A 录制路径'
  }
}

const acceptFile = (f) => {
  if (!f) return
  resetAll()
  if (!f.type.startsWith('video/')) {
    error.value = '请选择视频文件（mp4 / webm / mov 等）'
    return
  }
  if (f.size > 800 * 1024 * 1024) {
    error.value = '视频超过 800MB，本地提取容易内存不足，请先裁剪或压缩'
    return
  }
  fileName.value = f.name
  fileSize.value = f.size
  const dot = f.name.lastIndexOf('.')
  fileExt.value = dot >= 0 ? f.name.slice(dot + 1) : 'mp4'
  // 用户交互回调内创建对象 URL（浏览器 API）
  videoUrl.value = URL.createObjectURL(f)
  tryMp3Decode(f, fileExt.value)
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

const clearFile = () => { resetAll() }

const onLoadedMetadata = () => {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
  if (v.mozHasAudio === false || (v.audioTracks && v.audioTracks.length === 0)) {
    warnText.value = '该视频似乎没有可播放的音轨，提取结果可能无声，可先在预览里确认声音。'
  }
}

const onVideoError = () => {
  error.value = '视频无法在浏览器中播放（编码不受支持），请尝试 mp4（H.264）或 webm 格式'
}

const onTimeUpdate = () => {
  const v = videoEl.value
  if (!v || !duration.value || !extracting.value) return
  progress.value = Math.min(1, v.currentTime / duration.value)
  recordedSeconds.value = v.currentTime
}

// ---------- seek 定位（seeked 事件 + 1.5 秒超时兜底） ----------
const seekTo = (video, t) => {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      video.removeEventListener('seeked', onSeeked)
      clearTimeout(timer)
      resolve()
    }
    const onSeeked = () => {
      requestAnimationFrame(() => finish())
    }
    const timer = setTimeout(finish, 1500)
    video.addEventListener('seeked', onSeeked)
    video.currentTime = t
  })
}

// ---------- 音轨获取：优先元素 captureStream，失败则 AudioContext 分离 ----------
const obtainAudioTracks = (video) => {
  if (audioRoute === 'webaudio') {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
    return audioDestNode ? audioDestNode.stream.getAudioTracks() : []
  }
  const cs = typeof video.captureStream === 'function'
    ? video.captureStream
    : (typeof video.mozCaptureStream === 'function' ? video.mozCaptureStream : null)
  if (cs) {
    try {
      const s = cs.call(video)
      const at = s.getAudioTracks()
      if (at && at.length) {
        audioRoute = 'capture'
        return at
      }
    } catch (err) { /* 落到 AudioContext 路径 */ }
  }
  if (!audioCtx || audioCtx.state === 'closed' || !audioSourceNode) {
    // 回调内创建 AudioContext（浏览器 API）
    audioCtx = new AudioContext()
    audioSourceNode = audioCtx.createMediaElementSource(video)
    audioDestNode = audioCtx.createMediaStreamDestination()
    audioSourceNode.connect(audioDestNode)
    audioSourceNode.connect(audioCtx.destination) // 录制期间保持可正常听到声音
    audioRoute = 'webaudio'
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioDestNode.stream.getAudioTracks()
}

const stopRecorderInternal = () => {
  extracting.value = false
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop() } catch (err) { /* 忽略 */ }
  }
}

const onVideoEnded = () => {
  if (extracting.value && selectedFormatId.value !== 'mp3') {
    partial.value = false
    stopRecorderInternal()
  }
}

const stopEarly = () => {
  if (!extracting.value || selectedFormatId.value === 'mp3') return
  partial.value = true
  const v = videoEl.value
  if (v) { v.pause(); recordedSeconds.value = v.currentTime }
  stopRecorderInternal()
}

// ---------- MP3 路径：Int16 转换 + LAME 分块编码（参照站内 audio-converter 用法） ----------
function floatToInt16(f32) {
  const out = new Int16Array(f32.length)
  for (let i = 0; i < f32.length; i++) {
    let s = f32[i]
    s = s > 1 ? 1 : (s < -1 ? -1 : s)
    out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return out
}

const encodeMp3FromBuffer = async (bufferIn, kbps, onProgress) => {
  const lamejs = lamejsModule || (await import('@breezystack/lamejs'))
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

// ---------- 提取主流程（用户手势触发） ----------
const startExtract = async () => {
  if (extracting.value) return
  const video = videoEl.value
  if (!video || !duration.value) {
    error.value = '请先选择可播放的视频文件'
    return
  }
  if (!currentFormat.value || !currentFormat.value.available) {
    error.value = '请选择一个当前可用的输出格式'
    return
  }
  const fmtId = selectedFormatId.value
  error.value = ''
  warnText.value = ''
  partial.value = false
  if (resultUrl.value) { URL.revokeObjectURL(resultUrl.value); resultUrl.value = '' }
  resultInfo.value = null

  // —— MP3：纯计算转码路径 ——
  if (fmtId === 'mp3') {
    if (!audioBuffer) {
      error.value = 'MP3 路径需要先成功解码音轨，请改用 WebM/M4A 录制路径'
      return
    }
    extracting.value = true
    progress.value = 0
    statusText.value = `正在本地解码重采样并用 LAME 编码（${mp3Bitrate.value}kbps）…`
    try {
      const blob = await encodeMp3FromBuffer(audioBuffer, mp3Bitrate.value, (p) => {
        progress.value = p
        statusText.value = `LAME 编码中 ${Math.round(p * 100)}%（纯计算，无需等待播放）`
      })
      finishWithBlob(blob, 'mp3', audioBuffer.duration)
    } catch (err) {
      error.value = 'MP3 编码失败：' + (err && err.message ? err.message : '未知错误')
    } finally {
      extracting.value = false
      statusText.value = ''
    }
    return
  }

  // —— WebM / M4A：实时录制路径 ——
  if (!support.value.recorder) {
    error.value = '当前浏览器不支持 MediaRecorder，请使用新版 Chrome / Firefox / Safari'
    return
  }
  const mimeType = fmtId === 'm4a' ? 'audio/mp4' : 'audio/webm;codecs=opus'
  extracting.value = true
  progress.value = 0
  recordedSeconds.value = 0
  statusText.value = `正在实时录制为 ${fmtId.toUpperCase()}（约 ${formatTime(duration.value)}，请保持前台）…`
  try {
    video.pause()
    await seekTo(video, 0)
    const at = obtainAudioTracks(video)
    if (!at || !at.length) {
      error.value = '未获取到音轨：该视频可能无声，或音轨编码不受浏览器支持，请先在预览中确认能听到声音'
      extracting.value = false
      statusText.value = ''
      return
    }
    video.muted = false
    try {
      recorder = new MediaRecorder(new MediaStream(at), { mimeType, audioBitsPerSecond: 128000 })
    } catch (err) {
      error.value = `当前浏览器不支持 ${mimeType} 录制，请换用其他格式或浏览器`
      extracting.value = false
      statusText.value = ''
      return
    }
    chunks = []
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data)
    }
    recorder.onerror = () => {
      error.value = '录制出错：请确认视频可正常播放，并保持页面在前台后重试'
      extracting.value = false
      statusText.value = ''
    }
    recorder.onstop = () => {
      extracting.value = false
      statusText.value = ''
      recorder = null
      if (!chunks.length) {
        error.value = '未录制到任何数据：视频可能未能播放，请重试'
        return
      }
      const blob = new Blob(chunks, { type: fmtId === 'm4a' ? 'audio/mp4' : 'audio/webm' })
      chunks = []
      if (blob.size < 512) {
        error.value = '录制结果异常（数据为空）：源视频可能没有可播放的音轨'
        return
      }
      finishWithBlob(blob, fmtId, Math.max(0.1, recordedSeconds.value || duration.value))
    }
    recorder.start(1000)
    await video.play()
  } catch (err) {
    extracting.value = false
    statusText.value = ''
    error.value = '提取失败：' + (err && err.message ? err.message : '视频未能自动播放，请先手动播放一次再开始提取')
  }
}

const finishWithBlob = (blob, fmtId, durSec) => {
  const ext = fmtId === 'mp3' ? 'mp3' : (fmtId === 'm4a' ? 'm4a' : 'webm')
  const url = URL.createObjectURL(blob)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = url
  resultInfo.value = {
    name: `${baseName.value}-audio.${ext}`,
    size: blob.size,
    format: ext,
    durationSec: durSec
  }
  if (partial.value) {
    warnText.value = '已按「提前停止」输出已录制部分，时长约 ' + formatTime(recordedSeconds.value)
  }
}

const downloadResult = () => {
  if (!resultUrl.value || !resultInfo.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = resultInfo.value.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>
