<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Gauge class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">手机水平仪</h1>
          <p class="text-sm text-muted-foreground mt-1">调用设备陀螺仪的气泡水平仪：双轴倾角数显、贴墙/贴面校零、桌面找平</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线手机水平仪：点击启动后调用浏览器 DeviceOrientation 接口读取 beta（前后倾）/ gamma（左右倾）两个姿态角，
        双轴数显 + 气泡盘可视化，|倾角|&lt;0.5° 时气泡居中变绿并提示「水平」。支持一键校零（把当前姿态记为 0，适合贴墙、贴面找平），
        可选水平提示音。所有数据只在浏览器内存中实时计算，不上传任何数据。注意：消费级设备精度约 ±1°，不能用于工程验收。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：控制面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Activity class="w-5 h-5 mr-2 text-primary" /> 检测控制
        </h2>

        <div class="text-xs text-muted-foreground space-y-1">
          <p>
            <span class="text-foreground">当前环境：</span>{{ orientSupported ? '支持方向传感器读取' : '不支持 DeviceOrientation（桌面无传感器设备不可用）' }}
          </p>
          <p>点击「启动水平仪」后，iOS 13+ Safari 会弹出动作权限请求（必须在点击时申请），Android Chrome 直接可用。</p>
        </div>

        <!-- 启动 / 停止 -->
        <button
          v-if="status !== 'running'"
          @click="startLevel"
          class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Play class="w-4 h-4" /> 启动水平仪
        </button>
        <button
          v-else
          @click="stopLevel"
          class="w-full bg-destructive text-white hover:bg-destructive/90 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Square class="w-4 h-4" /> 停止
        </button>

        <!-- 校零 / 复位 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="zeroNow"
            :disabled="status !== 'running'"
            class="px-3 py-2 bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw class="w-4 h-4" /> 校零
          </button>
          <button
            @click="clearZero"
            :disabled="!isZeroed"
            class="px-3 py-2 bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            清除校零
          </button>
        </div>

        <!-- 贴墙模式 -->
        <button
          @click="wallMode = !wallMode"
          class="w-full px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          :class="wallMode ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground border border-border'"
        >
          <Smartphone class="w-4 h-4" /> 贴墙模式{{ wallMode ? '（开）' : '（关）' }}
        </button>

        <!-- 声音提示 -->
        <button
          @click="soundOn = !soundOn"
          class="w-full px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          :class="soundOn ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground border border-border'"
        >
          <Volume2 class="w-4 h-4" /> 水平提示音{{ soundOn ? '（开）' : '（关）' }}
        </button>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p class="text-xs text-destructive leading-relaxed">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- 免责提示 -->
        <p class="text-[11px] text-muted-foreground leading-relaxed">
          诚实标注：手机陀螺仪/重力传感器为消费级器件，绝对精度约 ±1°，且浏览器事件频率与滤波因设备而异。本工具适合日常找平参考（挂画、桌面、家电），
          <span class="text-foreground">不能替代专业水平尺用于工程施工或验收</span>。
        </p>
      </div>

      <!-- 右侧：气泡盘 + 数显（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> {{ wallMode ? '贴墙模式（单轴 beta）' : '双轴倾角' }}
          </h2>
          <span
            v-if="status === 'running' && isLevel && !wallMode"
            class="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
          >水平 ✓</span>
          <span
            v-else-if="status === 'running' && hasData"
            class="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
          >倾斜中</span>
        </div>

        <template v-if="status === 'running' && hasData">
          <!-- 双轴模式：气泡盘 + 两轴数显 -->
          <div v-if="!wallMode" class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <!-- 气泡盘（SVG） -->
            <div class="flex justify-center">
              <svg viewBox="0 0 220 220" class="w-56 h-56" role="img" aria-label="气泡水平盘">
                <circle cx="110" cy="110" r="100" class="fill-muted/40 stroke-border" stroke-width="2" />
                <circle cx="110" cy="110" r="66" class="fill-none stroke-border" stroke-width="1" stroke-dasharray="4 3" />
                <circle cx="110" cy="110" r="33" class="fill-none stroke-border" stroke-width="1" stroke-dasharray="4 3" />
                <line x1="10" y1="110" x2="210" y2="110" class="stroke-border" stroke-width="1" />
                <line x1="110" y1="10" x2="110" y2="210" class="stroke-border" stroke-width="1" />
                <circle
                  :cx="bubblePos.x" :cy="bubblePos.y" r="18"
                  :class="isLevel ? 'fill-green-500' : 'fill-red-500'"
                  fill-opacity="0.85"
                />
                <circle :cx="bubblePos.x" :cy="bubblePos.y" r="18" class="fill-none stroke-background" stroke-width="2" />
              </svg>
            </div>
            <!-- 数显 -->
            <div class="space-y-3">
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">前后倾 beta（低头为正）</p>
                <p class="text-5xl font-mono font-bold tabular-nums" :class="isLevel ? 'text-green-600' : 'text-foreground'">
                  {{ displayBeta }}<span class="text-lg font-sans font-medium text-muted-foreground ml-1">°</span>
                </p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">左右倾 gamma（右倾为正）</p>
                <p class="text-5xl font-mono font-bold tabular-nums" :class="isLevel ? 'text-green-600' : 'text-foreground'">
                  {{ displayGamma }}<span class="text-lg font-sans font-medium text-muted-foreground ml-1">°</span>
                </p>
              </div>
              <p class="text-[11px] text-muted-foreground text-center">
                校零基准：β₀={{ zeroBeta.toFixed(1) }}° · γ₀={{ zeroGamma.toFixed(1) }}°{{ isZeroed ? '（已校零）' : '' }}
              </p>
            </div>
          </div>

          <!-- 贴墙模式：单轴大数字 -->
          <div v-else class="bg-muted/50 rounded-xl p-10 text-center">
            <p class="text-xs text-muted-foreground mb-2">贴墙倾斜角（beta 单轴，相对校零基准）</p>
            <p class="text-8xl font-mono font-bold tabular-nums" :class="isLevel ? 'text-green-600' : 'text-foreground'">
              {{ displayBeta }}<span class="text-2xl font-sans font-medium text-muted-foreground ml-2">°</span>
            </p>
            <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
              手机屏幕贴住墙面（屏幕朝外），先在校准姿态点「校零」，再贴到目标位置看读数偏离多少度。
            </p>
          </div>

          <!-- 屏幕方向说明 -->
          <div class="bg-muted/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed">
            <span class="text-foreground font-medium">屏幕方向口径：</span>竖屏持机时 beta 反映前后倾、gamma 反映左右倾；
            横屏（旋转 90°）后两者互换，且可能翻转符号——横屏使用时请以「气泡是否在中心」为准，或重新校零。
          </div>
        </template>

        <!-- 未启动占位（SSR 也渲染这里） -->
        <div v-else class="bg-muted/30 rounded-xl p-10 text-center">
          <p class="text-sm text-muted-foreground">
            {{ status === 'running' ? '正在等待传感器数据…（桌面电脑或无陀螺仪设备不会返回数据）' : '点击「启动水平仪」开始测量' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 兼容性说明卡 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-6 flex items-start gap-3">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        浏览器兼容性：iOS 13+ Safari 必须在用户手势内调用 <span class="font-mono">DeviceOrientationEvent.requestPermission()</span>（本工具在点击「启动」时申请，这是已知坑）；
        Android Chrome/Edge 直接可用无需权限；桌面浏览器没有姿态传感器，事件不返回数据。传感器数据要求 HTTPS 或 localhost 环境。
      </p>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 open:pb-8">
      <summary class="text-lg font-semibold text-foreground cursor-pointer select-none flex items-center">
        <Info class="w-5 h-5 mr-2 text-primary" /> 气泡水平仪原理、精度对比与使用口径（点击展开：原理、公式、FAQ 与来源）
      </summary>

      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">气泡水平仪的原理（实体 → 手机）</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            实体气泡水平尺利用重力让封闭玻璃管内的气泡始终停留在最高处，气泡相对两条刻度线的偏移量就是倾角；
            手机水平仪用同一物理量换了传感器实现——加速度计/陀螺仪测出设备相对重力方向的姿态角，
            按 W3C DeviceOrientation 规范给出三个角：alpha（绕 z 轴，0~360°）、beta（绕 x 轴前后倾，-180°~180°）、gamma（绕 y 轴左右倾，-90°~90°）。
            平放桌面时 beta/gamma 双轴都应接近 0；本页把 |beta|&lt;0.5° 且 |gamma|&lt;0.5° 判定为「水平」。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">校零的用途与公式</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            校零把当前姿态记为基准：显示角 = 实测角 − 校零角。用途是把「不平的起点」当作 0——比如贴墙挂画时先贴基准墙面校零，
            再贴目标墙面看偏差；贴斜的台面同理。清除校零即恢复绝对角度。贴墙模式只看 beta 单轴大数字，忽略 gamma 干扰，读数更直观。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">与实体水平尺的精度对比（诚实标注）</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>消费级手机传感器：绝对精度约 ±1°（受重力计噪声、磁干扰、温度影响），浏览器事件频率 60Hz 左右，够日常找平。</li>
            <li>普通气泡水平尺：±0.5mm/m ≈ 0.03°，专业水平尺更准；电子角度仪可达 0.01°。</li>
            <li>结论：手机水平仪适合挂画、置物架、洗衣机、桌面等家居场景，<span class="text-foreground">不能用于工程施工或验收</span>。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">为什么点击启动后没有反应？</h4>
              <p class="text-sm text-muted-foreground mt-1">三种可能：① iOS 未在弹窗里点「允许」（允许后在设置→Safari→动作与方向访问里可重置）；② 桌面电脑没有姿态传感器，事件永远不触发；③ 页面不在 HTTPS 环境。手机竖持平放时，若读数恒为空请检查系统「动作与方向」权限。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">横屏使用时读数不对？</h4>
              <p class="text-sm text-muted-foreground mt-1">W3C 规范中 beta/gamma 是相对设备自身坐标系的角，竖屏时 beta≈前后倾、gamma≈左右倾；横屏旋转后两轴互换且符号可能翻转。横屏请以气泡居中为准，或横屏姿态下重新校零。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">「水平」判定为什么是 0.5°？</h4>
              <p class="text-sm text-muted-foreground mt-1">考虑消费级传感器的噪声与抖动，±0.5° 以内肉眼已难分辨气泡偏移，作为「日常水平」判定阈值；实体水平尺标准更严（约 0.03°），需要严格水平请用专业工具。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源（两源交叉核对）</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>beta/gamma 定义与取值范围：W3C DeviceOrientation Event 规范与 MDN DeviceOrientationEvent 词条交叉一致。</li>
            <li>iOS 13+ 需 requestPermission() 且必须在用户手势内调用：Apple 开发者文档 + MDN/社区实践一致（2019 年 iOS 13 引入，本页实现遵循）。</li>
            <li>消费级设备 ±1° 精度：为诚实估计口径（民用 MEMS 传感器静态精度典型 0.5°~1°），页面标注「不用于工程验收」。</li>
          </ul>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'spirit-level-tool'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Gauge, Activity, Play, Square, RotateCcw, Volume2,
  Smartphone, TriangleAlert, Info
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '手机水平仪 - 在线气泡水平仪网页版（陀螺仪找平） | 有条工具',
  description: '在线手机水平仪：调用设备陀螺仪读取 beta/gamma 双轴倾角，气泡盘可视化+度数显示，支持贴墙校零、贴面找平、水平提示音。消费级精度约±1°，日常找平参考，不上传数据。',
  keywords: '手机水平仪,在线水平仪,气泡水平仪,网页水平仪,倾角测量,贴墙找平',
  author: '有条工具',
  ogTitle: '手机水平仪 - 在线气泡水平仪网页版（陀螺仪找平） | 有条工具',
  ogDescription: '调用陀螺仪的气泡水平仪：双轴倾角数显、贴墙/贴面校零、桌面找平，精度诚实标注±1°。',
  ogUrl: 'https://www.util.cn/tools/spirit-level-tool',
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
          name: '手机水平仪',
          url: 'https://www.util.cn/tools/spirit-level-tool',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'beta/gamma 双轴倾角实时数显',
            'SVG 气泡盘可视化（|角度|<0.5° 变绿提示水平）',
            '一键校零（当前姿态记为 0）与清除校零',
            '贴墙模式 beta 单轴大数字',
            '水平提示音（可开关）',
            'iOS 13+ 手势内权限申请',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '手机水平仪', item: 'https://www.util.cn/tools/spirit-level-tool' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么点击启动后没有反应？',
              acceptedAnswer: { '@type': 'Answer', text: 'iOS 需在权限弹窗点允许；桌面电脑没有姿态传感器事件不会触发；页面需在 HTTPS 环境下访问。' }
            },
            {
              '@type': 'Question',
              name: '横屏使用时读数不对？',
              acceptedAnswer: { '@type': 'Answer', text: 'beta/gamma 是相对设备自身坐标系的角，横屏后两轴互换且符号可能翻转，建议横屏时以气泡居中为准或重新校零。' }
            },
            {
              '@type': 'Question',
              name: '手机水平仪精度多少？',
              acceptedAnswer: { '@type': 'Answer', text: '消费级手机传感器绝对精度约±1°，适合挂画、桌面等日常找平参考，不能替代专业水平尺用于工程施工或验收。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数区（node 可独立单测：状态机 + 判平） ----------

// 三态状态机：未授权(idle) → 运行中(running) → 已校零(zeroed)；stop 任何态都回 idle
function levelReducer(state, action) {
  switch (action) {
    case 'start':
      return state === 'idle' ? 'running' : state
    case 'zero':
      return state === 'idle' ? state : 'zeroed'
    case 'stop':
      return 'idle'
    default:
      return state
  }
}

// 判平：|beta| < 0.5 且 |gamma| < 0.5（度）
const LEVEL_TOLERANCE_DEG = 0.5
function isLevelAt(beta, gamma, tol = LEVEL_TOLERANCE_DEG) {
  if (typeof beta !== 'number' || typeof gamma !== 'number' || !Number.isFinite(beta) || !Number.isFinite(gamma)) return false
  return Math.abs(beta) < tol && Math.abs(gamma) < tol
}

// 校零：显示角 = 实测角 - 校零角（保留一圈内的含义由调用方显示）
function applyZero(beta, gamma, zeroBeta, zeroGamma) {
  if (![beta, gamma, zeroBeta, zeroGamma].every((v) => Number.isFinite(v))) return { beta: 0, gamma: 0 }
  return { beta: beta - zeroBeta, gamma: gamma - zeroGamma }
}

// 气泡在盘内的偏移：45° 满偏映射到 R 像素，超出钳制到盘边
const BUBBLE_RADIUS_PX = 70
const BUBBLE_MAX_DEG = 45
function bubbleOffset(beta, gamma) {
  const cl = (v) => Math.min(BUBBLE_MAX_DEG, Math.max(-BUBBLE_MAX_DEG, Number.isFinite(v) ? v : 0))
  return {
    dx: cl(gamma) / BUBBLE_MAX_DEG * BUBBLE_RADIUS_PX,
    dy: cl(beta) / BUBBLE_MAX_DEG * BUBBLE_RADIUS_PX
  }
}

// 角度显示：保留 1 位小数，处理 -0.0
function fmtAngle(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  const r = Math.round(n * 10) / 10
  return (r === 0 ? 0 : r).toFixed(1)
}

// ---------- 状态 ----------
const status = ref('idle')            // idle | running | zeroed（三态状态机）
const errorMessage = ref('')
const orientSupported = ref(false)
const hasData = ref(false)

const rawBeta = ref(null)
const rawGamma = ref(null)
const zeroBeta = ref(0)
const zeroGamma = ref(0)
const wallMode = ref(false)
const soundOn = ref(false)

const displayBeta = ref('—')
const displayGamma = ref('—')

// 运行句柄（非响应式）
let audioCtx = null
let beepTimer = null

// ---------- 计算属性 ----------
const isZeroed = computed(() => status.value === 'zeroed')
const zeroedAngles = computed(() => applyZero(
  rawBeta.value ?? NaN,
  rawGamma.value ?? NaN,
  zeroBeta.value,
  zeroGamma.value
))
const isLevel = computed(() => status.value !== 'idle' && hasData.value && isLevelAt(zeroedAngles.value.beta, zeroedAngles.value.gamma))

// 气泡位置（SVG 圆心，盘心 110,110）
const bubblePos = computed(() => {
  const { dx, dy } = bubbleOffset(zeroedAngles.value.beta, zeroedAngles.value.gamma)
  return { x: 110 + dx, y: 110 + dy }
})

// ---------- 传感器启动（iOS 权限必须在用户手势内申请【已知坑】） ----------
function onOrientation(evt) {
  const beta = evt.beta
  const gamma = evt.gamma
  if (beta === null || gamma === null) {
    hasData.value = false
    return
  }
  rawBeta.value = beta
  rawGamma.value = gamma
  hasData.value = true
  const z = applyZero(beta, gamma, zeroBeta.value, zeroGamma.value)
  displayBeta.value = fmtAngle(z.beta)
  displayGamma.value = fmtAngle(z.gamma)
}

async function startLevel() {
  errorMessage.value = ''
  if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
    errorMessage.value = '当前浏览器不支持 DeviceOrientation（桌面电脑通常无姿态传感器），请用手机浏览器打开。'
    return
  }
  try {
    // iOS 13+：requestPermission 必须在用户点击手势内调用，绝不能在页面加载时调用
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission()
      if (res !== 'granted') {
        errorMessage.value = '动作权限被拒绝：请在浏览器设置中允许「动作与方向访问」后重试。'
        return
      }
    }
    window.addEventListener('deviceorientation', onOrientation)
    status.value = levelReducer(status.value, 'start')
    if (soundOn.value) ensureAudio()
  } catch (err) {
    errorMessage.value = '传感器权限申请失败：' + (err && err.message ? err.message : '未知错误')
  }
}

function stopLevel() {
  window.removeEventListener('deviceorientation', onOrientation)
  status.value = levelReducer(status.value, 'stop')
  hasData.value = false
  rawBeta.value = null
  rawGamma.value = null
  displayBeta.value = '—'
  displayGamma.value = '—'
}

function zeroNow() {
  if (status.value === 'idle' || !hasData.value) return
  zeroBeta.value = rawBeta.value ?? 0
  zeroGamma.value = rawGamma.value ?? 0
  status.value = levelReducer(status.value, 'zero')
  if (hasData.value) {
    const z = applyZero(rawBeta.value ?? 0, rawGamma.value ?? 0, zeroBeta.value, zeroGamma.value)
    displayBeta.value = fmtAngle(z.beta)
    displayGamma.value = fmtAngle(z.gamma)
  }
}
function clearZero() {
  zeroBeta.value = 0
  zeroGamma.value = 0
  if (status.value === 'zeroed') status.value = 'running'
  if (hasData.value) {
    const z = applyZero(rawBeta.value ?? 0, rawGamma.value ?? 0, 0, 0)
    displayBeta.value = fmtAngle(z.beta)
    displayGamma.value = fmtAngle(z.gamma)
  }
}

// ---------- 提示音（接近水平时短音，0.6s 节流） ----------
function ensureAudio() {
  if (audioCtx) return
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    audioCtx = new AudioCtx()
    if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') audioCtx.resume()
  } catch (err) { audioCtx = null }
}
function beep() {
  if (!audioCtx) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.16)
  } catch (err) { /* 音频失败静默 */ }
}
function tickBeep() {
  if (!soundOn.value || status.value === 'idle' || !isLevel.value) return
  beep()
}

// 提示音调度：运行中且声音开启时才起定时器（600ms 轮询判平），关掉即清
watch([soundOn, status], ([on, st]) => {
  const need = on && st !== 'idle'
  if (need) ensureAudio()
  if (need && beepTimer === null) {
    beepTimer = setInterval(tickBeep, 600)
  } else if (!need && beepTimer !== null) {
    clearInterval(beepTimer)
    beepTimer = null
  }
})

// ---------- 生命周期 ----------
onMounted(() => {
  addRecentTool('spirit-level-tool')
  orientSupported.value = typeof window !== 'undefined' && typeof DeviceOrientationEvent !== 'undefined'
    && ('ondeviceorientation' in window)
})
onUnmounted(() => {
  // 清理：监听、定时器、音频上下文全部释放
  if (typeof window !== 'undefined') window.removeEventListener('deviceorientation', onOrientation)
  if (beepTimer !== null) {
    clearInterval(beepTimer)
    beepTimer = null
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
})
</script>
