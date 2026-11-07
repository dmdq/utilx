<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Compass class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">网页指南针</h1>
          <p class="text-sm text-muted-foreground mt-1">调用设备磁力计的在线指南针：实时方位角 + 16 方位名，室内辨向导航</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线网页指南针：点击启动后读取设备磁力计方位——安卓优先使用 deviceorientationabsolute 绝对方位事件，
        iOS Safari 使用 deviceorientation 事件里的 webkitCompassHeading 专有字段。SVG 罗盘盘面随方位旋转，
        同时给出方位角度数与 16 方位名（北/东北偏北/东北…），倾角过大时提示「请水平持握」。
        不支持磁力计的设备可用底部「手动查询方位名」兜底。所有数据本地处理，不上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：控制面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Activity class="w-5 h-5 mr-2 text-primary" /> 检测控制
        </h2>

        <div class="text-xs text-muted-foreground space-y-1">
          <p><span class="text-foreground">当前环境：</span>{{ orientSupported ? '浏览器支持方向事件' : '不支持 DeviceOrientation（桌面设备通常不可用）' }}</p>
          <p>磁力计读数受周围磁场影响，启动后请先按下方「校准指引」摇晃 8 字几圈。</p>
        </div>

        <button
          v-if="!isRunning"
          @click="startCompass"
          class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Play class="w-4 h-4" /> 启动指南针
        </button>
        <button
          v-else
          @click="stopCompass"
          class="w-full bg-destructive text-white hover:bg-destructive/90 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Square class="w-4 h-4" /> 停止
        </button>

        <div v-if="isRunning" class="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-destructive animate-pulse flex-shrink-0"></span>
          <p class="text-xs text-muted-foreground">正在读取磁力计 · 数据源：{{ sourceLabel }}</p>
        </div>

        <!-- 校准指引卡 -->
        <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
          <p class="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Magnet class="w-4 h-4 text-primary" /> 校准指引（8 字摇晃）
          </p>
          <ol class="list-decimal list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
            <li>手持手机在空中画「8」字摇几圈，让磁力计重新标定。</li>
            <li>远离磁铁、音箱、电机、金属桌面与通电电器——它们会让读数飘移。</li>
            <li>读数仍异常时重启浏览器或换个位置再试。</li>
          </ol>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p class="text-xs text-destructive leading-relaxed">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- 降级：手动查询（保底有内容） -->
        <div class="bg-muted/50 rounded-xl p-3 space-y-2">
          <p class="text-xs font-medium text-foreground">不支持磁力计？手动查询方位名</p>
          <div class="flex gap-2">
            <input v-model.number="manualHeading" type="number" min="0" max="360" step="1" placeholder="0–360"
              class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button
              @click="copyManual"
              class="px-3 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm text-foreground transition"
            >
              复制
            </button>
          </div>
          <p v-if="manualResult" class="text-xs text-muted-foreground">
            {{ manualResult.heading }}° → <span class="text-foreground font-semibold">{{ manualResult.name }}</span>（{{ manualResult.text }}）
          </p>
        </div>
      </div>

      <!-- 右侧：罗盘盘面（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Compass class="w-5 h-5 mr-2 text-primary" /> 实时方位
        </h2>

        <template v-if="isRunning && hasHeading">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <!-- SVG 罗盘盘面 -->
            <div class="flex justify-center">
              <svg viewBox="0 0 220 220" class="w-64 h-64" role="img" aria-label="罗盘盘面">
                <circle cx="110" cy="110" r="100" class="fill-muted/40 stroke-border" stroke-width="2" />
                <g :transform="'rotate(' + roseRotation + ' 110 110)'">
                  <!-- 刻度：每 15° 一格，主刻度每 45° -->
                  <line
                    v-for="deg in tickDegrees" :key="'t' + deg"
                    x1="110" :y1="deg % 45 === 0 ? 14 : 18" x2="110" y2="26"
                    class="stroke-muted-foreground"
                    :stroke-width="deg % 45 === 0 ? 2 : 1"
                    :transform="'rotate(' + deg + ' 110 110)'"
                  />
                  <!-- 主方向标签（随盘面旋转） -->
                  <text
                    v-for="(d, i) in ROSE_MAIN" :key="'l' + i"
                    x="110" y="44" text-anchor="middle"
                    class="fill-foreground font-bold"
                    :font-size="d.major ? 18 : 12"
                    :transform="'rotate(' + d.deg + ' 110 110)'"
                  >{{ d.label }}</text>
                </g>
                <!-- 固定指针（指向盘面上方=当前朝向） -->
                <polygon points="110,38 100,62 120,62" class="fill-red-500" />
                <circle cx="110" cy="110" r="8" class="fill-foreground" />
                <circle cx="110" cy="110" r="4" class="fill-background" />
              </svg>
            </div>

            <!-- 数显 -->
            <div class="space-y-3">
              <div class="bg-primary/5 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">当前方位角（磁北）</p>
                <p class="text-6xl font-mono font-bold tabular-nums text-foreground">
                  {{ displayHeading }}<span class="text-xl font-sans font-medium text-muted-foreground ml-1">°</span>
                </p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">16 方位名</p>
                <p class="text-2xl font-bold text-primary">{{ currentName }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ currentOffsetText }}</p>
              </div>
            </div>
          </div>

          <!-- 水平持握提示 -->
          <div
            v-if="needsLevelHold"
            class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2"
          >
            <TriangleAlert class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              设备倾角过大（beta/gamma 超过 45°）——磁力计水平投影失真，请尽量水平持握手机后再读数。
            </p>
          </div>
        </template>

        <!-- 未启动占位（SSR 渲染这里） -->
        <div v-else class="bg-muted/30 rounded-xl p-10 text-center">
          <p class="text-sm text-muted-foreground">
            {{ isRunning ? '正在等待磁力计数据…（桌面电脑或无磁力计设备不会返回数据，可用左侧手动查询兜底）' : '点击「启动指南针」开始辨向' }}
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 open:pb-8">
      <summary class="text-lg font-semibold text-foreground cursor-pointer select-none flex items-center">
        <Info class="w-5 h-5 mr-2 text-primary" /> 真北 vs 磁北、校准与兼容性（点击展开：原理、公式、FAQ 与来源）
      </summary>

      <div class="mt-4 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">真北 vs 磁北（磁偏角说明）</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            手机磁力计测出的是<span class="text-foreground">磁北</span>（地磁场水平分量指向的地磁极），而地图与经纬线用的是<span class="text-foreground">真北</span>（地理北极），
            两者之差叫磁偏角，随地点不同从 ±0° 到 ±20° 以上不等（中国大部分地区在 -10°~-2°~+10° 区间，可用国家地理信息公共服务平台查询当地值）。
            本工具<span class="text-foreground">不做自动磁偏角修正</span>，显示的方位角为磁北口径；按真北使用时请自行叠加当地磁偏角（东偏为正：真北方位 = 磁北方位 + 磁偏角）。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">方位角与 16 方位换算公式</h3>
          <p class="text-sm text-muted-foreground leading-relaxed font-mono">
            16 方位名 = DIR16[ round(heading ÷ 22.5) mod 16 ]，DIR16 从 0° 起：北、东北偏北、东北、东北偏东、东、东南偏东、东南、东南偏南、南、西南偏南、西南、西南偏西、西、西北偏西、西北、西北偏北。
          </p>
          <p class="text-sm text-muted-foreground leading-relaxed mt-2">
            双显示（如 350° →「北偏西 10°」）：取最近的 45° 基准方位 base = round(heading÷45)×45 mod 360，偏差 = heading − base 归一到 ±22.5°，
            偏差为负显示「偏西」（逆时针侧）为正显示「偏东」（顺时针侧）。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">浏览器兼容性口径</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>Android Chrome/Edge：支持 deviceorientationabsolute（alpha 为绝对方位，heading = 360 − alpha），无需权限申请。</li>
            <li>iOS 13+ Safari：不支持 absolute 事件，需在用户手势内调用 DeviceOrientationEvent.requestPermission()（本页在点击启动时申请），方位取 deviceorientation 事件里的 webkitCompassHeading 专有字段（0–360°，相对磁北）。</li>
            <li>桌面浏览器：无磁力计，事件不返回有效数据，请用左侧「手动查询方位名」。</li>
          </ul>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">为什么读数一直飘或固定不动？</h4>
              <p class="text-sm text-muted-foreground mt-1">磁力计易受硬铁/软铁干扰：手机壳带磁铁、桌面金属支架、音箱与充电器都会干扰。先做 8 字摇晃校准，再远离干扰源；手机套磁吸支架时建议取下再测。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">和手机自带指南针差几度正常吗？</h4>
              <p class="text-sm text-muted-foreground mt-1">正常。手机自带指南针通常叠加了 GPS 航向/地磁模型修正，网页只能拿原始磁力计口径，±5° 量级差异常见；先做 8 字校准可明显收敛。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">怎么知道「手机顶部」指向哪？</h4>
              <p class="text-sm text-muted-foreground mt-1">方位角指手机顶部（摄像头一端）水平指向的方向。把手机顶边对准目标物，读数即目标方位；测量时尽量水平持握（本页在倾角超 45° 时会提醒）。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">想确认手机放得够平怎么办？</h4>
              <p class="text-sm text-muted-foreground mt-1">配合站内的手机水平仪使用：先用水平仪确认手机接近水平（双轴 &lt;5°），再切到指南针读方位，可显著降低磁力计投影误差。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源（两源交叉核对）</h3>
          <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground leading-relaxed">
            <li>webkitCompassHeading 为 Safari 专有字段、相对磁北：MDN DeviceOrientationEvent 词条与 Apple 开发者文档一致；iOS Safari 不支持 deviceorientationabsolute（MDN + W3C 规范兼容性表交叉）。</li>
            <li>absolute 事件下 heading = 360 − alpha：W3C DeviceOrientation 规范（alpha 绕 z 轴逆时针增大）与 MDN 实践一致。</li>
            <li>磁偏角概念与数值区间：国家地理信息公共服务平台（天地图）公开资料与维基百科「磁偏角」条目交叉；本页不自动修正。</li>
          </ul>
          <p class="text-sm text-muted-foreground leading-relaxed mt-2">
            相关工具：<a href="/tools/spirit-level-tool/" class="text-primary hover:underline">手机水平仪</a>（先找平再辨向更准）。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'online-compass'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Compass, Activity, Play, Square, TriangleAlert, Info, Magnet
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '网页指南针 - 在线手机指南针方位角查询（网页版） | 有条工具',
  description: '在线网页指南针：调用手机磁力计实时显示方位角与 16 方位名（北/东北/东…），SVG 罗盘盘面随向旋转，8 字校准指引、水平持握提醒、手动方位查询兜底，磁北口径注明磁偏角，不上传数据。',
  keywords: '网页指南针,在线指南针,手机指南针,方位角查询,指南针网页版,16方位',
  author: '有条工具',
  ogTitle: '网页指南针 - 在线手机指南针方位角查询（网页版） | 有条工具',
  ogDescription: '调用设备磁力计的在线指南针：实时方位角+罗盘方位名（东南西北），室内导航辨向。',
  ogUrl: 'https://www.util.cn/tools/online-compass',
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
          name: '网页指南针',
          url: 'https://www.util.cn/tools/online-compass',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            'deviceorientationabsolute 优先 / iOS webkitCompassHeading 回退',
            'SVG 罗盘盘面随方位旋转',
            '方位角数显 + 16 方位名双显示',
            '倾角 >45° 提示水平持握',
            '8 字摇晃校准指引',
            '手动方位角查询兜底',
            '磁北口径注明不做磁偏角自动修正'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '网页指南针', item: 'https://www.util.cn/tools/online-compass' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么读数一直飘或固定不动？',
              acceptedAnswer: { '@type': 'Answer', text: '磁力计易受磁铁、音箱、金属支架等干扰，先做 8 字摇晃校准并远离干扰源；磁吸手机壳建议取下再测。' }
            },
            {
              '@type': 'Question',
              name: '和手机自带指南针差几度正常吗？',
              acceptedAnswer: { '@type': 'Answer', text: '正常。系统指南针通常叠加 GPS 航向或地磁模型修正，网页只有原始磁力计口径，±5° 量级差异常见，8 字校准后可明显收敛。' }
            },
            {
              '@type': 'Question',
              name: '显示的是真北还是磁北？',
              acceptedAnswer: { '@type': 'Answer', text: '磁北口径。真北 = 磁北方位 + 当地磁偏角（东偏为正），本工具不做自动修正，当地磁偏角可在国家地理信息公共服务平台查询。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯函数区（node 可独立单测） ----------

// 16 方位表：0=北、22.5=东北偏北、45=东北 … 337.5=西北偏北
const DIR_16 = [
  '北', '东北偏北', '东北', '东北偏东',
  '东', '东南偏东', '东南', '东南偏南',
  '南', '西南偏南', '西南', '西南偏西',
  '西', '西北偏西', '西北', '西北偏北'
]

// 8 基准方位（0/45/90/.../315），用于「北偏西 10°」双显示
const DIR_8 = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
// 主方位（偏向词取旋转方向上的最近主方位）
const CARD_4 = ['北', '东', '南', '西']

function normalizeHeading(h) {
  const n = Number(h)
  if (!Number.isFinite(n)) return 0
  return ((n % 360) + 360) % 360
}

// 16 方位下标：round(h/22.5) mod 16
function dir16Index(h) {
  return Math.round(normalizeHeading(h) / 22.5) % 16
}
function dir16Name(h) {
  return DIR_16[dir16Index(h)]
}

// 双显示：350° → { base:'北', offset:-10, side:'西', text:'北偏西 10°' }
// 偏向词口径：正偏差（顺时针）取基准旋转方向上的最近主方位（北→东→南→西→北）
function headingWithOffset(h) {
  const hn = normalizeHeading(h)
  const baseStep = Math.round(hn / 45)              // 0..8（350 → 8）
  const offset = Math.round((hn - baseStep * 45) * 10) / 10   // ∈ [−22.5, 22.5]（350−360=−10）
  const base = DIR_8[baseStep % 8]
  const sideStep = offset >= 0
    ? (baseStep % 2 === 0 ? baseStep + 2 : baseStep + 1)
    : (baseStep % 2 === 0 ? baseStep - 2 : baseStep - 1)
  const side = CARD_4[((sideStep / 2) % 4 + 4) % 4]
  const text = offset === 0 ? base : `${base}偏${side} ${Math.abs(offset)}°`
  return { base, offset, side, text }
}

// 绝对事件 alpha → 罗盘 heading（W3C：alpha 绕 z 轴逆时针增大，heading = 360 − alpha）
function alphaToHeading(alpha) {
  return normalizeHeading(360 - Number(alpha))
}

// 角度平滑（环形插值）：走最短弧方向按比例 t 靠近目标
function lerpAngle(current, target, t) {
  const a = normalizeHeading(current)
  const b = normalizeHeading(target)
  const delta = ((b - a + 540) % 360) - 180
  return normalizeHeading(a + delta * t)
}

// 倾角过大（beta/gamma 任一 |角|>45°）→ 提示水平持握
function needsHold(beta, gamma, limit = 45) {
  const b = Math.abs(Number(beta))
  const g = Math.abs(Number(gamma))
  if (!Number.isFinite(b) || !Number.isFinite(g)) return false
  return b > limit || g > limit
}

// ---------- 状态 ----------
const isRunning = ref(false)
const errorMessage = ref('')
const orientSupported = ref(false)
const hasHeading = ref(false)
const sourceLabel = ref('等待数据')

const headingRaw = ref(null)      // 0-360
const betaRaw = ref(null)
const gammaRaw = ref(null)
const manualHeading = ref(45)

let headingSmooth = null          // 平滑值（非响应式，事件高频）
let usedSource = ''               // absolute | webkit（先到先得后锁定）

// 罗盘盘面静态刻度
const tickDegrees = Array.from({ length: 24 }, (_, i) => i * 15)
const ROSE_MAIN = [
  { deg: 0, label: '北', major: true },
  { deg: 45, label: '东北', major: false },
  { deg: 90, label: '东', major: true },
  { deg: 135, label: '东南', major: false },
  { deg: 180, label: '南', major: true },
  { deg: 225, label: '西南', major: false },
  { deg: 270, label: '西', major: true },
  { deg: 315, label: '西北', major: false }
]

// ---------- 计算属性 ----------
const displayHeading = computed(() => (headingRaw.value === null ? '—' : Math.round(headingRaw.value)))
const roseRotation = computed(() => (headingRaw.value === null ? 0 : -headingRaw.value))
const currentName = computed(() => (headingRaw.value === null ? '—' : dir16Name(headingRaw.value)))
const currentOffsetText = computed(() => (headingRaw.value === null ? '' : headingWithOffset(headingRaw.value).text))
const needsLevelHold = computed(() => needsHold(betaRaw.value, gammaRaw.value))

const manualResult = computed(() => {
  const h = Number(manualHeading.value)
  if (!Number.isFinite(h)) return null
  const hn = normalizeHeading(h)
  return { heading: Math.round(hn), name: dir16Name(hn), text: headingWithOffset(hn).text }
})

// ---------- 事件处理 ----------
function setHeading(h, beta, gamma) {
  if (typeof beta === 'number') betaRaw.value = beta
  if (typeof gamma === 'number') gammaRaw.value = gamma
  const target = normalizeHeading(h)
  headingSmooth = headingSmooth === null ? target : lerpAngle(headingSmooth, target, 0.25)
  headingRaw.value = headingSmooth
  hasHeading.value = true
}

function onAbsolute(evt) {
  if (!isRunning.value || evt.alpha === null || evt.alpha === undefined) return
  usedSource = 'absolute'
  sourceLabel.value = 'deviceorientationabsolute'
  setHeading(alphaToHeading(evt.alpha), evt.beta, evt.gamma)
}

function onRelative(evt) {
  if (!isRunning.value) return
  // absolute 事件可用时不吃相对事件
  if (usedSource === 'absolute') return
  // iOS 专有：webkitCompassHeading 为相对磁北的绝对航向（0-360）
  if (typeof evt.webkitCompassHeading === 'number' && !Number.isNaN(evt.webkitCompassHeading)) {
    usedSource = 'webkit'
    sourceLabel.value = 'webkitCompassHeading (iOS)'
    setHeading(evt.webkitCompassHeading, evt.beta, evt.gamma)
  }
}

// ---------- 启停（iOS 权限必须在用户手势内申请【已知坑】） ----------
async function startCompass() {
  errorMessage.value = ''
  if (typeof window === 'undefined' || typeof DeviceOrientationEvent === 'undefined') {
    errorMessage.value = '当前浏览器不支持 DeviceOrientation（桌面设备通常无磁力计），可用左侧「手动查询方位名」兜底。'
    return
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission()
      if (res !== 'granted') {
        errorMessage.value = '动作权限被拒绝：请在浏览器设置中允许「动作与方向访问」后重试。'
        return
      }
    }
    usedSource = ''
    headingSmooth = null
    hasHeading.value = false
    // absolute 优先注册；iOS 无此事件类型，deviceorientation 事件里读 webkitCompassHeading 回退
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', onAbsolute)
    }
    window.addEventListener('deviceorientation', onRelative)
    isRunning.value = true
    sourceLabel.value = '等待数据'
  } catch (err) {
    errorMessage.value = '传感器权限申请失败：' + (err && err.message ? err.message : '未知错误')
  }
}

function stopCompass() {
  window.removeEventListener('deviceorientationabsolute', onAbsolute)
  window.removeEventListener('deviceorientation', onRelative)
  isRunning.value = false
  hasHeading.value = false
  headingRaw.value = null
  betaRaw.value = null
  gammaRaw.value = null
  usedSource = ''
}

// ---------- 复制手动结果 ----------
async function copyManual() {
  if (!manualResult.value) return
  const { heading, name, text } = manualResult.value
  try {
    await navigator.clipboard.writeText(`方位角 ${heading}° → ${name}（${text}） — 网页指南针`)
    alert('已复制')
  } catch (err) { /* 复制失败静默 */ }
}

// ---------- 生命周期 ----------
onMounted(() => {
  addRecentTool('online-compass')
  orientSupported.value = typeof window !== 'undefined' && typeof DeviceOrientationEvent !== 'undefined'
    && ('ondeviceorientation' in window)
})
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('deviceorientationabsolute', onAbsolute)
    window.removeEventListener('deviceorientation', onRelative)
  }
})
</script>
