<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Search class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">屏幕放大镜</h1>
          <p class="text-sm text-muted-foreground mt-1">调用摄像头的实时放大镜：数码变焦、画面定格、对比度增强，看小字标签与远处的板书</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线屏幕放大镜：点击启动后调用后置摄像头（facingMode: environment）实时取景，1–5× 变焦——设备支持原生变焦约束时走 track.applyConstraints 原生变焦（画质更好），
        否则降级为 CSS 数码放大；支持「定格」冻结当前画面（可保存 PNG）、对比度/亮度增强滑杆，安卓 Chrome 还可打开闪光灯补光。
        画面只在你的浏览器内处理，<strong class="text-foreground">不上传、不保存到服务器</strong>。标注：本工具是辅助视力的网页小工具，非医疗器械。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：控制面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Camera class="w-5 h-5 mr-2 text-primary" /> 放大镜控制
        </h2>

        <div class="text-xs text-muted-foreground">
          点击「启动摄像头」后浏览器会请求相机权限，只在本机预览与定格，不上传任何画面。需要 HTTPS 或 localhost 环境。
        </div>

        <!-- 启动 / 停止 -->
        <button
          v-if="status === 'idle'"
          @click="startCamera"
          class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Play class="w-4 h-4" /> 启动摄像头
        </button>
        <button
          v-else
          @click="stopCamera"
          class="w-full bg-destructive text-white hover:bg-destructive/90 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Square class="w-4 h-4" /> 关闭摄像头
        </button>

        <!-- 定格 / 取消定格 -->
        <button
          v-if="status === 'streaming'"
          @click="freezeFrame"
          class="w-full bg-muted hover:bg-muted/80 border border-border py-2.5 rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-2"
        >
          <Camera class="w-4 h-4" /> 定格画面
        </button>
        <button
          v-if="status === 'frozen'"
          @click="unfreezeFrame"
          class="w-full bg-muted hover:bg-muted/80 border border-border py-2.5 rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-2"
        >
          <Play class="w-4 h-4" /> 返回实时画面
        </button>

        <!-- 保存 PNG（仅定格时） -->
        <button
          v-if="status === 'frozen'"
          @click="saveFrozenPng"
          class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
        >
          <Camera class="w-4 h-4" /> 保存定格为 PNG
        </button>

        <!-- 变焦（仅实时态） -->
        <div v-if="status === 'streaming'">
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-sm font-medium text-foreground">变焦倍数</label>
            <span class="text-sm font-bold text-primary font-mono">{{ zoomLevel }}×（{{ zoomStrategyLabel }}）</span>
          </div>
          <input v-model.number="zoomLevel" type="range" min="1" max="5" step="0.1" class="w-full accent-[var(--primary,#2563eb)]" />
          <p class="text-[11px] text-muted-foreground mt-1">
            {{ zoomStrategy === 'native'
              ? '设备支持原生变焦约束，已用 track.applyConstraints 调整镜头（画质好）'
              : '设备不支持原生变焦约束，已降级为 CSS 数码放大（放大后清晰度下降）' }}
          </p>
        </div>

        <!-- 滤镜（对比度 / 亮度） -->
        <div v-if="status !== 'idle'" class="space-y-3">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-sm font-medium text-foreground">对比度增强</label>
              <span class="text-sm font-mono text-foreground">{{ contrastPct }}%</span>
            </div>
            <input v-model.number="contrastPct" type="range" min="100" max="220" step="5" class="w-full accent-[var(--primary,#2563eb)]" />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-sm font-medium text-foreground">亮度</label>
              <span class="text-sm font-mono text-foreground">{{ brightnessPct }}%</span>
            </div>
            <input v-model.number="brightnessPct" type="range" min="50" max="160" step="5" class="w-full accent-[var(--primary,#2563eb)]" />
          </div>
          <button
            @click="resetFilters"
            class="w-full px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs text-foreground transition"
          >
            滤镜复位（对比 100% / 亮度 100%）
          </button>
        </div>

        <!-- 手电筒（能力探测通过才显示） -->
        <button
          v-if="torchAvailable"
          @click="toggleTorch"
          class="w-full px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          :class="torchOn ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground border border-border'"
        >
          <Zap class="w-4 h-4" /> 闪光灯补光{{ torchOn ? '（开）' : '（关）' }}
        </button>

        <!-- 错误 / 降级说明卡 -->
        <div v-if="errorMessage" class="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
          <div class="flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p class="text-xs text-destructive leading-relaxed">{{ errorMessage }}</p>
          </div>
          <div class="bg-background/60 rounded p-2.5 text-xs text-muted-foreground leading-relaxed">
            <p class="font-medium text-foreground mb-1">可以这样解决：</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>点击地址栏左侧的摄像头图标，把「摄像头」权限改为允许。</li>
              <li>确认没有其他软件占用摄像头（会议/直播软件等）。</li>
              <li>手机请用后置摄像头（默认已按 environment 请求），并确认页面为 HTTPS。</li>
            </ol>
          </div>
        </div>

        <!-- 隐私说明 -->
        <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p class="text-xs text-muted-foreground leading-relaxed">
            隐私承诺：视频流只在浏览器内存中预览与定格，<span class="text-foreground">不上传服务器；保存 PNG 是你主动点击后写入本地下载</span>，关闭摄像头即释放设备。
          </p>
        </div>

        <p class="text-[11px] text-muted-foreground leading-relaxed">
          标注：本工具为低视力人群的网页辅助场景（看药瓶标签、铭牌、远处板书），<span class="text-foreground">不是医疗器械，不能替代专业助视设备或验光建议</span>。
        </p>
      </div>

      <!-- 右侧：取景区（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Eye class="w-5 h-5 mr-2 text-primary" /> 取景预览
          </h2>
          <span
            v-if="status !== 'idle'"
            class="px-2.5 py-1 rounded-full text-xs font-medium"
            :class="status === 'frozen'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              : 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'"
          >
            {{ status === 'frozen' ? '已定格' : '实时取景中' }}
          </span>
        </div>

        <!-- 视口区域：SSR 渲染静态占位 -->
        <div class="relative bg-black/90 rounded-xl overflow-hidden aspect-video">
          <video
            v-show="status === 'streaming'"
            ref="videoEl"
            playsinline
            muted
            class="absolute inset-0 w-full h-full object-contain origin-center"
            :style="videoStyle"
          ></video>
          <canvas
            v-show="status === 'frozen'"
            ref="canvasEl"
            class="absolute inset-0 w-full h-full object-contain"
            :style="canvasStyle"
          ></canvas>
          <div v-if="status === 'idle'" class="absolute inset-0 flex items-center justify-center">
            <p class="text-sm text-muted-foreground">点击「启动摄像头」开始放大取景</p>
          </div>
          <div
            v-if="status === 'streaming' && zoomStrategy === 'css' && zoomLevel > 1"
            class="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 text-white text-[11px] font-mono"
          >CSS 数码放大 {{ zoomLevel }}×</div>
        </div>
        <p class="text-[11px] text-muted-foreground">
          小技巧：定格后可保存 PNG 长图留档；对比度拉高看浅色印刷小字更清楚；需要照亮被摄物时打开闪光灯（安卓 Chrome 支持）。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 open:pb-8">
      <summary class="text-lg font-semibold text-foreground cursor-pointer select-none flex items-center">
        <Info class="w-5 h-5 mr-2 text-primary" /> 与系统放大镜对比、低视力辅助场景（点击展开：原理、FAQ 与来源）
      </summary>

      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">网页放大镜 vs 系统放大镜</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>免安装：不用下载 App，打开网页点一下就能用，公共电脑/借来的手机也能用。</li>
            <li>可保存：定格画面可存 PNG，方便拍下药瓶标签、铭牌后再放大细看，或转给家人医生。</li>
            <li>跨设备：手机（后置摄像头变焦）和带摄像头的电脑（当放大镜照小字）都能跑。</li>
            <li>局限：无连续自动对焦增强、无读屏联动，深度低视力用户仍以专业助视器为准。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">变焦口径：原生 vs CSS 降级</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            能力探测顺序：先读 track.getCapabilities()（Chromium 支持），存在 zoom 能力（min/max/step）时用 track.applyConstraints({ advanced: [{ zoom }] }) 让镜头真实变焦（光学/传感器裁切，画质好）；
            不支持时（iOS Safari 无 zoom 约束能力）降级为 CSS transform: scale() 数码放大，本质是把已采集的像素插值放大，超过一定倍率会模糊——这就是滑杆标注两种模式的原因。
            闪光灯走 ImageCapture.getPhotoCapabilities().torch 探测，Chromium/Android 可用，iOS 不支持时按钮直接隐藏。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">低视力辅助场景（诚实标注）</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            常见用途：看清药瓶与食品标签的小字、家电铭牌与序列号、超市价签、教室远处的板书（举手机拍远处再定格放大）、临时找细小掉落物。
            本工具是网页辅助小工具，<span class="text-foreground">不是医疗器械</span>；持续性视力障碍请咨询眼科医生与专业低视力助视服务。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">为什么变焦滑杆显示「CSS 数码放大」而不是原生变焦？</h4>
              <p class="text-sm text-muted-foreground mt-1">你的浏览器/设备没有暴露 zoom 能力（常见于 iOS Safari）。原生变焦是 Chromium 系（Android Chrome/桌面 Chrome）能力，会随镜头真实调整；CSS 模式是像素放大，倍率越高越模糊，建议 2× 以内使用。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">定格画面保存的 PNG 里有滤镜吗？</h4>
              <p class="text-sm text-muted-foreground mt-1">浏览器画布支持 ctx.filter 时（Chromium/Firefox）对比度与亮度会写入保存的 PNG；不支持的浏览器（部分 Safari 版本）滤镜只作用于预览显示，保存的是原始画面。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">电脑没有摄像头能用吗？</h4>
              <p class="text-sm text-muted-foreground mt-1">需要任意可用的摄像头（外接 USB 摄像头也行）。权限被拒时页面给出说明卡，按步骤在浏览器站点权限里放行后重试即可。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源（两源交叉核对）</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>原生变焦与能力探测：web.dev《Control camera pan, tilt, and zoom》（getCapabilities().zoom + applyConstraints advanced 用法）与 MDN MediaStreamTrack.applyConstraints 词条交叉。</li>
            <li>闪光灯 torch：W3C ImageCapture 规范（getPhotoCapabilities().torch）+ Chromium 实践（Android Chrome 可用，iOS Safari 无 ImageCapture/无 torch）。</li>
            <li>「非医疗器械」为本页诚实标注口径；低视力辅助建议参考专业机构科普。</li>
          </ul>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'screen-magnifier'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Search, Camera, Play, Square, Zap, Info, TriangleAlert, Eye
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '屏幕放大镜 - 网页版手机放大镜（摄像头变焦+定格保存） | 有条工具',
  description: '在线屏幕放大镜：调用后置摄像头实时放大取景，1-5× 原生/CSS 双模式变焦、画面定格保存 PNG、对比度亮度增强、闪光灯补光。免安装的网页助视小工具，画面本地处理不上传，非医疗器械。',
  keywords: '屏幕放大镜,手机放大镜,网页放大镜,摄像头变焦,看小字工具,助视工具',
  author: '有条工具',
  ogTitle: '屏幕放大镜 - 网页版手机放大镜（摄像头变焦+定格保存） | 有条工具',
  ogDescription: '调用摄像头的实时放大镜：数码变焦、画面定格、对比度增强，看小字标签与远处的板书。',
  ogUrl: 'https://www.util.cn/tools/screen-magnifier',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '屏幕放大镜',
          url: 'https://www.util.cn/tools/screen-magnifier',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '后置摄像头实时放大取景（facingMode environment）',
            '1-5× 变焦：原生 applyConstraints 优先，CSS scale 降级',
            '定格画面 + 保存 PNG',
            '对比度/亮度增强滤镜',
            '闪光灯补光（ImageCapture torch 能力探测）',
            '权限被拒友好指引',
            '本地处理不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '屏幕放大镜', item: 'https://www.util.cn/tools/screen-magnifier' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么变焦显示「CSS 数码放大」？',
              acceptedAnswer: { '@type': 'Answer', text: '浏览器未暴露 zoom 能力（常见于 iOS Safari），原生变焦是 Chromium 系能力；CSS 模式是像素插值放大，倍率越高越模糊，建议 2× 以内使用。' }
            },
            {
              '@type': 'Question',
              name: '定格保存的 PNG 里有滤镜吗？',
              acceptedAnswer: { '@type': 'Answer', text: '画布支持 ctx.filter 的浏览器（Chromium/Firefox）会写入对比度与亮度；不支持的浏览器保存原始画面，滤镜仅影响预览显示。' }
            },
            {
              '@type': 'Question',
              name: '这是医疗器械吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不是。本工具是低视力人群看小字、看远处的网页辅助小工具，不能替代专业助视设备与验光建议。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数区（node 可独立单测：状态机 + 变焦探测） ----------

// 四态状态机：idle → streaming → frozen →（unfreeze 回 streaming / stop 回 idle）
function magnifierReducer(state, action) {
  switch (action) {
    case 'start':
      return state === 'idle' ? 'streaming' : state
    case 'freeze':
      return state === 'streaming' ? 'frozen' : state
    case 'unfreeze':
      return state === 'frozen' ? 'streaming' : state
    case 'stop':
      return 'idle'
    default:
      return state
  }
}

// 变焦策略探测：track.getCapabilities() 结果存在 zoom 能力 → native，否则 css
function pickZoomStrategy(caps) {
  if (caps && caps.zoom
    && typeof caps.zoom.min === 'number'
    && typeof caps.zoom.max === 'number'
    && caps.zoom.max > caps.zoom.min) {
    return 'native'
  }
  return 'css'
}

// 滑杆 1..5 → 原生 zoom 值（把滑杆区间线性映射进能力区间）
function sliderToNativeZoom(sliderVal, zoomCaps) {
  const s = Math.min(5, Math.max(1, Number(sliderVal) || 1))
  if (!zoomCaps || typeof zoomCaps.min !== 'number' || typeof zoomCaps.max !== 'number' || zoomCaps.max <= zoomCaps.min) {
    return null
  }
  return zoomCaps.min + (s - 1) / 4 * (zoomCaps.max - zoomCaps.min)
}

// CSS 模式放大倍数钳制 1..5
function clampCssZoom(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 1
  return Math.min(5, Math.max(1, n))
}

// getUserMedia 错误 → 用户可读信息
function cameraErrorText(err) {
  const name = err && err.name ? err.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') return '摄像头权限被拒绝，无法取景。'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return '未找到可用的后置摄像头，试试换设备或允许任意摄像头。'
  if (name === 'NotReadableError' || name === 'TrackStartError') return '摄像头被其他应用占用，请关闭占用相机的软件后重试。'
  return '摄像头启动失败：' + (err && err.message ? err.message : '需要 HTTPS 或 localhost 环境与较新浏览器。')
}

// ---------- 状态 ----------
const status = ref('idle')            // idle | streaming | frozen
const errorMessage = ref('')

const videoEl = ref(null)
const canvasEl = ref(null)

const zoomLevel = ref(1)              // 滑杆 1..5
const zoomStrategy = ref('css')       // native | css（探测后写入）
const zoomCaps = ref(null)            // 原生 zoom 能力区间
const contrastPct = ref(100)
const brightnessPct = ref(100)

const torchAvailable = ref(false)
const torchOn = ref(false)

// 非响应式句柄
let stream = null
let track = null
let imageCapture = null

// ---------- 计算属性 ----------
const zoomStrategyLabel = computed(() => (zoomStrategy.value === 'native' ? '原生变焦' : 'CSS 放大'))

const filterCss = computed(() => `contrast(${contrastPct.value}%) brightness(${brightnessPct.value}%)`)
const videoStyle = computed(() => {
  const style = { filter: filterCss.value }
  if (zoomStrategy.value === 'css') {
    style.transform = `scale(${clampCssZoom(zoomLevel.value)})`
  }
  return style
})
const canvasStyle = computed(() => ({ filter: filterCss.value }))

// ---------- 相机启停 ----------
async function startCamera() {
  errorMessage.value = ''
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    errorMessage.value = cameraErrorText(null)
    return
  }
  try {
    // 仅在用户点击后请求摄像头；优先后置
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    } catch (err) {
      // 无后置摄像头的设备退回任意摄像头
      if (err && (err.name === 'OverconstrainedError' || err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      } else {
        throw err
      }
    }
    track = stream.getVideoTracks()[0] || null

    // 变焦能力探测：getCapabilities().zoom 存在 → 原生变焦
    if (track && typeof track.getCapabilities === 'function') {
      const caps = track.getCapabilities()
      zoomCaps.value = caps && caps.zoom ? caps.zoom : null
      zoomStrategy.value = pickZoomStrategy(zoomCaps.value)
    } else {
      zoomCaps.value = null
      zoomStrategy.value = 'css'
    }

    // 闪光灯能力探测：ImageCapture.getPhotoCapabilities().torch
    if (track && typeof window.ImageCapture === 'function') {
      try {
        imageCapture = new window.ImageCapture(track)
        const photoCaps = await imageCapture.getPhotoCapabilities()
        torchAvailable.value = !!(photoCaps && photoCaps.torch === true)
      } catch (err) {
        torchAvailable.value = false
      }
    } else {
      torchAvailable.value = false
    }

    const v = videoEl.value
    if (v) {
      v.srcObject = stream
      await v.play().catch(() => { /* 自动播放被拦时用户点击后再试 */ })
    }
    status.value = magnifierReducer(status.value, 'start')
  } catch (err) {
    errorMessage.value = cameraErrorText(err)
    releaseCamera()
  }
}

function stopCamera() {
  releaseCamera()
  status.value = magnifierReducer(status.value, 'stop')
}

// ---------- 定格 / 保存 PNG ----------
function freezeFrame() {
  if (status.value !== 'streaming') return
  const v = videoEl.value
  const c = canvasEl.value
  if (!v || !c || !v.videoWidth) return
  c.width = v.videoWidth
  c.height = v.videoHeight
  const ctx = c.getContext('2d')
  if (!ctx) return
  // 支持画布滤镜时把对比度/亮度写进定格像素（保存 PNG 才带滤镜）
  if (typeof ctx.filter === 'string') ctx.filter = filterCss.value
  ctx.drawImage(v, 0, 0, c.width, c.height)
  if (typeof ctx.filter === 'string') ctx.filter = 'none'
  status.value = magnifierReducer(status.value, 'freeze')
}

function unfreezeFrame() {
  if (status.value !== 'frozen') return
  status.value = magnifierReducer(status.value, 'unfreeze')
}

function saveFrozenPng() {
  const c = canvasEl.value
  if (!c || status.value !== 'frozen') return
  try {
    const url = c.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `magnifier-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch (err) { /* 导出失败静默 */ }
}

// ---------- 变焦（滑杆 → 约束） ----------
async function applyZoom() {
  if (zoomStrategy.value !== 'native' || !track) return
  const z = sliderToNativeZoom(zoomLevel.value, zoomCaps.value)
  if (z === null) return
  try {
    await track.applyConstraints({ advanced: [{ zoom: z }] })
  } catch (err) { /* 个别设备拒绝约束时保持当前值 */ }
}

// ---------- 滤镜复位 / 手电筒 ----------
function resetFilters() {
  contrastPct.value = 100
  brightnessPct.value = 100
}

async function toggleTorch() {
  if (!torchAvailable.value || !track) return
  try {
    torchOn.value = !torchOn.value
    await track.applyConstraints({ advanced: [{ torch: torchOn.value }] })
  } catch (err) {
    torchOn.value = false
  }
}

// ---------- 释放 ----------
// 滑杆变化 → 原生变焦约束实时下发（CSS 模式走 computed style，无需约束）
watch(zoomLevel, () => {
  if (status.value === 'streaming') applyZoom()
})

function releaseCamera() {
  if (stream) {
    for (const t of stream.getTracks()) t.stop()
    stream = null
  }
  track = null
  imageCapture = null
  torchAvailable.value = false
  torchOn.value = false
  zoomCaps.value = null
  zoomStrategy.value = 'css'
  const v = videoEl.value
  if (v) v.srcObject = null
}

// ---------- 生命周期 ----------
onMounted(() => {
  addRecentTool('screen-magnifier')
})

// 卸载必须停掉音轨释放摄像头
onUnmounted(() => {
  releaseCamera()
})
</script>
