<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Film class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">视频抽帧取图</h1>
          <p class="text-sm text-muted-foreground mt-1">本地按数量/间隔批量截取画面帧导出 PNG，也可手动定位抓单帧</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        选择本地视频，支持三种抽帧模式：① 按数量均分（默认 9 帧，适合挑封面）；② 按间隔秒数逐段抓取；
        ③ 拖动进度条手动定位抓单帧。canvas 逐帧 seek 抓取后导出无损 PNG，
        缩略图网格预览、单张或批量下载，全程在浏览器本地完成，视频不上传服务器。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        文件不出浏览器：解码、抓帧与 PNG 编码全部在本机完成，视频不会上传到任何服务器。
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧控制面板 -->
      <div class="space-y-6">
        <!-- 文件选择 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择视频文件
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="video/*,.mp4,.webm,.mov,.m4v"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload class="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">点击或拖入视频文件（建议 ≤200MB）</p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <ShieldCheck class="w-3 h-3" /> 本地抓帧，视频不上传
            </p>
          </div>
          <div v-if="fileName" class="mt-3 flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Film class="w-4 h-4 text-primary flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-foreground truncate" :title="fileName">{{ fileName }}</p>
              <p class="text-[10px] text-muted-foreground">
                {{ formatSize(fileSize) }}<span v-if="duration"> · 时长 {{ formatTime(duration) }}</span><span v-if="videoSize.w"> · {{ videoSize.w }}×{{ videoSize.h }}</span>
              </p>
            </div>
            <button @click="clearFile" class="p-1 text-muted-foreground hover:text-destructive" title="移除">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-[10px] text-muted-foreground mt-2 leading-relaxed">
            大文件提醒：视频超过 200MB 时逐帧 seek 与 PNG 编码会占用较多内存，建议先裁剪片段或降低帧数。
          </p>
        </div>

        <!-- 抽帧参数 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 抽帧模式
          </h2>

          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="m in modeOptions"
              :key="m.id"
              @click="selectMode(m.id)"
              :class="mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ m.label }}</button>
          </div>

          <!-- 模式①：按数量均分 -->
          <div v-if="mode === 'count'">
            <label class="block text-sm font-medium text-foreground mb-2">抽取帧数（整段视频均匀分布）</label>
            <div class="flex gap-1.5 mb-2">
              <button
                v-for="n in countPresets"
                :key="n"
                @click="frameCountParam = n"
                :class="frameCountParam === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ n }} 帧</button>
            </div>
            <input
              v-model.number="frameCountParam"
              type="number"
              min="1"
              max="200"
              step="1"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">默认 9 帧适合挑封面；帧数越多覆盖越细，建议不超过 100 帧</p>
          </div>

          <!-- 模式②：按间隔秒 -->
          <div v-if="mode === 'interval'">
            <label class="block text-sm font-medium text-foreground mb-2">抽帧间隔（秒）</label>
            <div class="flex gap-1.5 mb-2">
              <button
                v-for="s in intervalPresets"
                :key="s"
                @click="intervalParam = s"
                :class="intervalParam === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              >{{ s }}s</button>
            </div>
            <input
              v-model.number="intervalParam"
              type="number"
              min="0.5"
              step="0.5"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">每隔设定秒数抓一帧，从 0s 开始，末帧不超过视频时长</p>
          </div>

          <!-- 模式③：手动单帧 -->
          <div v-if="mode === 'single'">
            <label class="block text-sm font-medium text-foreground mb-2">
              定位时间：<span class="text-primary">{{ singleTime.toFixed(2) }}s</span>
            </label>
            <input
              v-model.number="singleTime"
              type="range"
              min="0"
              :max="durationMax"
              step="0.1"
              class="w-full accent-primary"
              :disabled="!duration"
              @change="seekAndPreview"
            />
            <div class="flex gap-2 mt-3">
              <button
                @click="grabSingleFrame"
                :disabled="!duration || processing"
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Images class="w-4 h-4" /> 抓取当前帧为 PNG
              </button>
              <button
                @click="downloadCurrentFrame"
                :disabled="!duration || processing"
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Download class="w-4 h-4" /> 直接下载当前帧
              </button>
            </div>
            <p class="text-[10px] text-muted-foreground mt-1.5">松开滑块后自动定位并刷新下方预览画面，可反复抓取不同时间点</p>
          </div>

          <!-- 批量提取按钮（模式①②） -->
          <button
            v-if="mode !== 'single'"
            @click="toggleExtract"
            :disabled="!duration || (plannedTimes.length === 0)"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Film v-else class="w-4 h-4" />
            {{ processing ? `抓帧中 ${captured}/${plannedTimes.length}（点击停止）` : `开始抽帧（${plannedTimes.length} 帧）` }}
          </button>

          <!-- 进度条 -->
          <div v-if="processing || captured > 0" class="h-2 bg-muted rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <p v-if="exportDims.w && mode !== 'single'" class="text-xs text-muted-foreground">
            输出尺寸 {{ exportDims.w }}×{{ exportDims.h }}（长边最大 1920，无损 PNG）
          </p>

          <div v-if="error" class="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
            <FileWarning class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：预览与结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 视频预览 -->
        <div v-if="videoUrl" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 视频预览
          </h2>
          <video
            ref="videoEl"
            :src="videoUrl"
            muted
            playsinline
            preload="auto"
            controls
            class="w-full max-h-96 rounded-lg bg-black"
            @loadedmetadata="onLoadedMetadata"
            @error="onVideoError"
          ></video>
          <!-- 手动单帧模式的定位预览画布 -->
          <template v-if="mode === 'single'">
            <h3 class="text-sm font-medium text-foreground mt-4 mb-2 flex items-center gap-1.5">
              <Images class="w-4 h-4 text-primary" /> 定位帧预览
            </h3>
            <canvas ref="previewCanvas" class="w-full rounded-lg border border-border bg-black"></canvas>
          </template>
        </div>

        <!-- 抽帧结果网格 -->
        <div v-if="results.length" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center">
              <CheckCircle2 class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" /> 已抓取 {{ results.length }} 帧
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="downloadAll"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <Download class="w-3.5 h-3.5" /> 批量下载全部
              </button>
              <button
                @click="clearResults"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
              >
                <X class="w-3.5 h-3.5" /> 清空
              </button>
            </div>
          </div>
          <p class="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
            <Info class="w-3 h-3" /> 批量下载时浏览器可能弹出「允许下载多个文件」授权提示，请点击允许；文件名格式为 帧序号_时间点。
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div
              v-for="(item, idx) in results"
              :key="item.url"
              class="group relative rounded-lg overflow-hidden border border-border bg-muted/30"
            >
              <img :src="item.url" :alt="item.name" class="w-full aspect-video object-cover" loading="lazy" />
              <div class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
                #{{ idx + 1 }} · {{ item.time.toFixed(2) }}s
              </div>
              <button
                @click="downloadOne(item)"
                class="absolute bottom-1 right-1 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
                title="下载该帧"
              >
                <Download class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!videoUrl && !results.length" class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          选择视频后，这里会显示预览与抽帧结果
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于视频抽帧取图</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            视频本质上是连续的图片：本工具借助浏览器的视频解码能力，按时间点逐帧 seek 定位后用 canvas 抓取画面，
            再导出为无损 PNG。做封面图、取表情包素材、整理网课板书截图、给设计稿找参考画面，
            都不必再安装剪辑软件。全程本地处理，视频不会上传，也没有水印和次数限制（建议单个视频 ≤200MB）。
          </p>

          <h3 class="text-lg font-semibold text-foreground">三种抽帧模式怎么选</h3>
          <p>
            「按数量均分」最适合挑封面：默认 9 帧从头到尾均匀铺开，一眼比较选最好的一帧；
            「按间隔秒」适合长时间录屏巡检，例如每 30 秒抓一帧快速浏览整段内容；
            「手动单帧」用于精确取某一画面——拖动进度条定位，预览确认后再抓取，
            也可以一边播放视频一边抓当前显示的画面。
          </p>

          <h3 class="text-lg font-semibold text-foreground">输出尺寸与帧数控制</h3>
          <p>
            默认按视频原始分辨率导出（长边超过 1920 时等比缩到 1920，避免 4K PNG 撑爆内存）。
            PNG 是无损格式，单张可达数 MB，高帧数时浏览器内存占用明显上升：
            建议单次不超过 100 帧，需要更多时改为「按间隔」分段抓取，或改用 JPG 类截图工具。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">抓到的画面和时间点有偏差吗？</span>seek 定位精确到约 0.1 秒，个别关键帧间隔较大的视频取到的画面可能与时间点有零点几秒偏差；每次定位均带 1.5 秒超时兜底，超时则取浏览器已就绪的画面。</li>
            <li><span class="text-foreground font-medium">为什么有些视频抓帧失败或画面黑屏？</span>浏览器无法解码的编码（如部分 HEVC 的 iPhone 视频）无法预览也无法抓取，请先转成 H.264 的 mp4；网页保护视频（DRM）受浏览器安全限制无法抓取。</li>
            <li><span class="text-foreground font-medium">批量下载会被拦截吗？</span>连续下载多张时浏览器会询问是否允许「下载多个文件」，允许即可；文件名自动带帧序号与时间点（如 xx_frame03_12.50s.png），不会互相覆盖。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'video-frame-extractor'" :category="'image'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  Film, FileUp, FileWarning, Upload, Download, X, Loader2, CheckCircle2,
  Settings2, MonitorPlay, ShieldCheck, Info, Images, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '视频抽帧取图 - 视频批量截取画面帧导出PNG | Util工具箱',
  description: '免费在线视频抽帧工具：按数量均分、按间隔秒或手动定位单帧抓取，canvas 本地逐帧导出无损 PNG，缩略图网格预览、单张/批量下载，视频不上传服务器',
  keywords: '视频抽帧, 视频截帧, 视频提取图片, 视频封面挑选, 批量截图, 视频转png, 抽帧工具',
  author: 'Util工具箱',
  ogTitle: '视频抽帧取图 - 有条工具',
  ogDescription: '本地按数量/间隔批量截取视频画面帧导出 PNG，也可手动定位抓单帧，视频不上传',
  ogUrl: 'https://www.util.cn/tools/video-frame-extractor',
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
          name: '视频抽帧取图',
          url: 'https://www.util.cn/tools/video-frame-extractor',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按数量均分抽帧', '按间隔秒抽帧', '手动定位抓单帧', '无损PNG导出', '缩略图网格预览', '批量下载', '本地处理不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '图片工具', item: 'https://www.util.cn/image/' },
            { '@type': 'ListItem', position: 3, name: '视频抽帧取图', item: 'https://www.util.cn/tools/video-frame-extractor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '抓到的画面和时间点有偏差吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'seek 定位精确到约 0.1 秒，关键帧间隔较大的视频可能有零点几秒偏差；每次定位带 1.5 秒超时兜底，超时则取浏览器已就绪的画面。' }
            },
            {
              '@type': 'Question',
              name: '为什么有些视频抓帧失败或画面黑屏？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器无法解码的编码（如部分 HEVC 的 iPhone 视频）无法预览也无法抓取，请先转成 H.264 的 mp4；受 DRM 保护的网页视频无法抓取。' }
            },
            {
              '@type': 'Question',
              name: '批量下载会被拦截吗？',
              acceptedAnswer: { '@type': 'Answer', text: '连续下载多张时浏览器会询问是否允许下载多个文件，允许即可；文件名自动带帧序号与时间点，不会互相覆盖。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'video-frame-extractor')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数（node 自测覆盖） ----------
// 由「时长 + 模式 + 参数」生成抽帧时间点数组
// mode: 'count' 按数量均分 | 'interval' 按间隔秒均分 | 'single' 手动单帧
// 约定：所有时间点落在 [0, 时长 - 0.001] 内（不超时长的可 seek 区间），
// 单调不减并四舍五入到 0.1ms；单批最多 300 项，避免误设参数导致内存爆炸
function frameTimes(duration, mode, param) {
  const d = Number(duration) || 0
  if (!(d > 0)) return []
  const upper = Math.max(0, d - 0.001)
  const round4 = (t) => Math.round(t * 10000) / 10000
  if (mode === 'count') {
    const n = Math.min(300, Math.max(1, Math.round(Number(param) || 1)))
    if (n === 1) return [0]
    const times = []
    for (let i = 0; i < n; i++) {
      const t = (d * i) / (n - 1)
      times.push(round4(Math.min(Math.max(0, t), upper)))
    }
    return times
  }
  if (mode === 'interval') {
    const step = Math.min(600, Math.max(0.1, Number(param) || 1))
    const times = []
    for (let t = 0; t < d; t += step) {
      times.push(round4(Math.min(t, upper)))
      if (times.length >= 300) break
    }
    return times
  }
  if (mode === 'single') {
    const t = Math.min(Math.max(0, Number(param) || 0), upper)
    return [round4(t)]
  }
  return []
}
// ---------- 纯函数结束 ----------

const formatTime = (sec) => {
  const s = Math.max(0, sec)
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return m > 0 ? `${m}分${r.toFixed(1)}秒` : `${r.toFixed(1)}秒`
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// ---------- 状态 ----------
const fileInput = ref(null)
const videoEl = ref(null)
const previewCanvas = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const videoUrl = ref('')
const duration = ref(0)
const videoSize = ref({ w: 0, h: 0 })
const isDragging = ref(false)
const processing = ref(false)
const captured = ref(0)
const error = ref('')

const mode = ref('count')
const frameCountParam = ref(9)
const intervalParam = ref(5)
const singleTime = ref(0)
const results = ref([])

const seoContentVisible = ref(true)

const modeOptions = [
  { id: 'count', label: '按数量均分' },
  { id: 'interval', label: '按间隔秒' },
  { id: 'single', label: '手动单帧' }
]
const countPresets = [5, 9, 16]
const intervalPresets = [2, 5, 10, 30]

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const durationMax = computed(() => (duration.value ? Math.max(0.1, Math.round(duration.value * 10) / 10) : 1))

const plannedTimes = computed(() => {
  if (mode.value === 'single') return []
  const param = mode.value === 'count' ? frameCountParam.value : intervalParam.value
  return frameTimes(duration.value, mode.value, param)
})

const progressPercent = computed(() => {
  const total = plannedTimes.value.length
  return total ? Math.min(100, Math.round((captured.value / total) * 100)) : (results.value.length ? 100 : 0)
})

// 导出尺寸：保持原始分辨率，长边最大 1920 避免 4K PNG 内存压力
const exportDims = computed(() => {
  const w = videoSize.value.w
  const h = videoSize.value.h
  if (!w || !h) return { w: 0, h: 0 }
  const maxSide = Math.max(w, h)
  if (maxSide <= 1920) return { w, h }
  const s = 1920 / maxSide
  return { w: Math.round(w * s), h: Math.round(h * s) }
})

const selectMode = (m) => {
  mode.value = m
  if (m === 'single' && duration.value) {
    nextTick(() => { seekAndPreview() })
  }
}

// ---------- 文件选择 ----------
const triggerFileSelect = () => { fileInput.value && fileInput.value.click() }

const revokeResults = () => {
  // URL 仅在用户交互回调中使用
  results.value.forEach((r) => { URL.revokeObjectURL(r.url) })
  results.value = []
}

const resetVideo = () => {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value)
  videoUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  duration.value = 0
  videoSize.value = { w: 0, h: 0 }
  captured.value = 0
  singleTime.value = 0
  revokeResults()
}

const acceptFile = (f) => {
  if (!f) return
  error.value = ''
  if (!f.type.startsWith('video/')) {
    error.value = '请选择视频文件（mp4 / webm / mov 等）'
    return
  }
  if (f.size > 200 * 1024 * 1024) {
    error.value = '视频超过 200MB，逐帧抓取可能导致内存不足，请先裁剪片段或压缩后再试'
    return
  }
  resetVideo()
  fileName.value = f.name
  fileSize.value = f.size
  // 用户交互回调内创建对象 URL（浏览器 API）
  videoUrl.value = URL.createObjectURL(f)
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

const clearFile = () => {
  resetVideo()
  error.value = ''
}

const onLoadedMetadata = () => {
  const v = videoEl.value
  if (!v) return
  duration.value = isFinite(v.duration) ? v.duration : 0
  videoSize.value = { w: v.videoWidth, h: v.videoHeight }
  singleTime.value = 0
  if (mode.value === 'single') nextTick(() => { seekAndPreview() })
}

const onVideoError = () => {
  error.value = '视频无法在浏览器中播放（编码不受支持），请尝试 mp4（H.264）或 webm 格式'
}

// ---------- seek 定位（seeked 事件 + 1.5 秒超时兜底，复用 video-to-gif 范式） ----------
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
      // 等待一帧渲染完成再抓取
      requestAnimationFrame(() => finish())
    }
    const timer = setTimeout(finish, 1500)
    video.addEventListener('seeked', onSeeked)
    video.currentTime = t
  })
}

// ---------- 结果管理 ----------
const baseName = () => (fileName.value || 'video').replace(/\.[^.]+$/, '')

const pushResult = (blob, time, index) => {
  const url = URL.createObjectURL(blob)
  const padded = String(index).padStart(2, '0')
  const name = `${baseName()}_frame${padded}_${time.toFixed(2)}s.png`
  results.value = [...results.value, { url, time, name }]
}

const clearResults = () => {
  revokeResults()
  captured.value = 0
}

// ---------- 批量抽帧（模式①②） ----------
const toggleExtract = () => {
  if (processing.value) {
    processing.value = false
    return
  }
  extractBatch()
}

const extractBatch = async () => {
  const video = videoEl.value
  if (!video || !duration.value) {
    error.value = '请先选择可播放的视频文件'
    return
  }
  const times = plannedTimes.value
  if (!times.length) {
    error.value = '当前参数没有可抽取的帧，请检查帧数或间隔设置'
    return
  }
  processing.value = true
  captured.value = 0
  error.value = ''
  try {
    const dims = exportDims.value
    const canvas = document.createElement('canvas')
    canvas.width = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext('2d')
    const startIndex = results.value.length
    for (let i = 0; i < times.length; i++) {
      if (!processing.value) {
        error.value = `已停止，本次抓取 ${i} 帧`
        break
      }
      await seekTo(video, times[i])
      ctx.drawImage(video, 0, 0, dims.w, dims.h)
      const blob = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/png') })
      if (blob) {
        pushResult(blob, times[i], startIndex + i + 1)
      } else {
        error.value = 'PNG 编码失败，可能是内存不足，请减少帧数或缩小输出尺寸后重试'
        break
      }
      captured.value = i + 1
      // 让出主线程，刷新进度条
      if (i % 2 === 1) await new Promise((r) => setTimeout(r, 0))
    }
  } catch (err) {
    error.value = '抽帧失败：' + (err && err.message ? err.message : '未知错误')
  } finally {
    processing.value = false
  }
}

// ---------- 手动单帧（模式③） ----------
const seekAndPreview = async () => {
  const video = videoEl.value
  const canvas = previewCanvas.value
  if (!video || !canvas || !duration.value) return
  const t = frameTimes(duration.value, 'single', singleTime.value)[0] || 0
  singleTime.value = t
  await seekTo(video, t)
  const dims = exportDims.value
  canvas.width = dims.w
  canvas.height = dims.h
  const ctx = canvas.getContext('2d')
  try {
    ctx.drawImage(video, 0, 0, dims.w, dims.h)
  } catch (err) {
    error.value = '画面抓取失败：该视频帧可能受浏览器安全策略限制'
  }
}

const grabSingleFrame = async () => {
  const video = videoEl.value
  const canvas = previewCanvas.value
  if (!video || !canvas || !duration.value) {
    error.value = '请先选择可播放的视频文件'
    return
  }
  processing.value = true
  try {
    await seekAndPreview()
    const blob = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/png') })
    if (blob) {
      pushResult(blob, singleTime.value, results.value.length + 1)
    } else {
      error.value = 'PNG 编码失败，可能是内存不足，请稍后重试'
    }
  } finally {
    processing.value = false
  }
}

const triggerDownload = (url, name) => {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const downloadOne = (item) => {
  if (!item || !item.url) return
  triggerDownload(item.url, item.name)
}

const downloadCurrentFrame = async () => {
  const canvas = previewCanvas.value
  if (!canvas || !duration.value) return
  const blob = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/png') })
  if (!blob) {
    error.value = 'PNG 编码失败，可能是内存不足，请稍后重试'
    return
  }
  const url = URL.createObjectURL(blob)
  const padded = String(results.value.length + 1).padStart(2, '0')
  triggerDownload(url, `${baseName()}_frame${padded}_${singleTime.value.toFixed(2)}s.png`)
  // 临时 URL 用后即焚，避免泄漏
  setTimeout(() => { URL.revokeObjectURL(url) }, 2000)
}

const downloadAll = async () => {
  const list = results.value.slice()
  for (let i = 0; i < list.length; i++) {
    triggerDownload(list[i].url, list[i].name)
    // 间隔触发，避免浏览器把连续点击下载判定为弹窗拦截
    await new Promise((r) => setTimeout(r, 400))
  }
}
</script>
