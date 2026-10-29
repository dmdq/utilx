<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Mouse class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">鼠标按键测试</h1>
          <p class="text-sm text-muted-foreground mt-1">左中右键与侧键点击计数、双击间隔检测、滚轮与移动轨迹测试，新鼠标验货排查双击失灵</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线鼠标测试工具：在大块测试区内任意点击、滚动、移动鼠标，实时统计每个物理按键的点击次数，自动记录相邻两次点击的间隔（ms）并换算 CPS（每秒点击数），
        据此判断微动是否老化、双击是否失灵；同时以渐隐轨迹可视化鼠标移动路径、按方向累计滚轮格数。全部检测在浏览器本地完成，不上传任何数据，新鼠标开箱验货必备。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 状态面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 测试统计
        </h2>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">累计点击</p>
          <p class="text-2xl font-bold text-primary">{{ totalClicks }} 次</p>
          <p class="text-xs text-muted-foreground mt-1">已检测到 {{ detectedCount }} / {{ buttonTotal }} 个按键</p>
        </div>

        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">当前按住</p>
            <p class="text-sm font-bold text-foreground">{{ activeNamesText }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">最近事件</p>
            <p class="text-sm font-bold text-foreground truncate" :title="lastEventText">{{ lastEventText }}</p>
          </div>
        </div>

        <!-- 滚轮测试 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">滚轮测试（在测试区内滚动）</p>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">向上滚动</p>
              <p class="text-xl font-bold text-foreground">{{ scrollUp }} 格</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">向下滚动</p>
              <p class="text-xl font-bold text-foreground">{{ scrollDown }} 格</p>
            </div>
          </div>
        </div>

        <p
          class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
          :class="suspectNames.length ? 'bg-red-500/10' : ''"
        >
          <AlertTriangle v-if="suspectNames.length" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          <span>{{ healthHint }}</span>
        </p>

        <button
          @click="resetTest"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RotateCcw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置全部计数
        </button>
      </div>

      <!-- 测试区（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <MousePointerClick class="w-5 h-5 mr-2 text-primary" /> 测试区（单击 / 双击 / 滚动 / 移动）
          </h2>
          <div class="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
            <span v-for="def in buttonDefs" :key="def.id" class="flex items-center gap-1">
              <i class="w-2 h-2 rounded-full inline-block" :style="{ backgroundColor: buttonColors[def.id] }"></i>{{ def.name }}
            </span>
          </div>
        </div>

        <!-- 大块交互画布：pointerdown 计数 + 轨迹绘制 -->
        <div
          ref="testAreaRef"
          class="relative w-full h-[320px] sm:h-[400px] rounded-xl border-2 border-dashed border-primary/40 bg-background overflow-hidden select-none cursor-crosshair touch-none"
        >
          <canvas ref="canvasRef" class="absolute inset-0 w-full h-full"></canvas>
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <MousePointerClick class="w-10 h-10 text-primary/30 mb-2" />
            <p class="text-sm font-medium text-muted-foreground">把鼠标移进来，任意点击 / 双击 / 滚动 / 画圈移动</p>
            <p class="text-xs text-muted-foreground/70 mt-1">已拦截右键菜单与默认拖拽，侧键不会触发页面前进后退，放心测试</p>
          </div>
          <div class="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-card/80 border border-border text-xs text-muted-foreground pointer-events-none">
            按住：{{ activeNamesText }}
          </div>
          <div class="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-card/80 border border-border text-xs text-muted-foreground pointer-events-none font-mono">
            {{ totalClicks }} clicks
          </div>
        </div>

        <!-- 按键卡片 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div v-for="card in buttonCards" :key="card.id" class="bg-muted/40 border border-border rounded-lg p-3 text-center space-y-1.5">
            <div class="flex items-center justify-center gap-1.5">
              <i class="w-2 h-2 rounded-full inline-block flex-shrink-0" :style="{ backgroundColor: card.color }"></i>
              <p class="text-sm font-medium text-foreground truncate">{{ card.name }}</p>
            </div>
            <p class="text-2xl font-bold" :class="card.clicks > 0 ? 'text-primary' : 'text-muted-foreground'">
              {{ card.clicks }}<span class="text-xs font-normal text-muted-foreground ml-0.5">次</span>
            </p>
            <span class="inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium" :class="statusMeta[card.status].class">
              {{ statusMeta[card.status].label }}
            </span>
            <p class="text-[10px] text-muted-foreground font-mono">均隔 {{ card.avgText }} · {{ card.cpsText }} CPS</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          提示：平均间隔取该键最近 10 次相邻点击的均值，CPS = 1000 ÷ 平均间隔。正常快速双击间隔约 80-300ms；
          若没点两下却连续出现间隔 &lt;80ms 的记录，是微动老化导致的「单击变双击」；若刻意连点却连续 5 次间隔都超过 1500ms，说明有点击被微动丢失——两者都会标记为「疑似双击失灵」。
        </p>
      </div>
    </div>

    <!-- 双击失灵排查指引 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold mb-3 flex items-center">
        <ListChecks class="w-5 h-5 mr-2 text-primary" /> 双击失灵排查方法
      </h2>
      <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
        <li>在测试区内快速双击左键 10 次以上，观察「左键」卡片的平均间隔：正常应在 80-300ms 之间。</li>
        <li>单击 20 次，看点击计数是否每次恰好 +1；若一次点击偶尔 +2，说明微动抖动（单击变双击）。</li>
        <li>若刻意连点但间隔连续 5 次超过 1500ms、状态变为「疑似双击失灵」，说明第二次点击被微动吞掉，建议保修或更换。</li>
        <li>在测试区内上下滚动各 10 格，确认上/下计数同步增加且方向不颠倒，排查滚轮编码器跳格、失灵。</li>
        <li>依次按下中键与两个侧键，确认 5 张卡片全部点亮；侧键无反应可先检查驱动映射，再怀疑微动损坏。</li>
      </ol>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>鼠标按键测试是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          鼠标按键测试是一款在线外设检测工具。它监听浏览器接收到的 pointerdown 事件，按 event.button 区分左键（0）、中键（1）、右键（2）与侧键（3/4），
          实时统计每个物理按键的点击次数；同时记录相邻同键两次点击的间隔毫秒数，换算平均间隔与 CPS（每秒点击数），
          用于判断鼠标微动是否老化、双击是否失灵。页面还会用 Canvas 以渐隐轨迹画出鼠标移动路径，并用 wheel 事件按方向累计滚轮滚动格数。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适合哪些场景？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>网购鼠标开箱验货：逐键点击确认 5 个按键全部正常，滚轮不跳格、方向不颠倒。</li>
          <li>排查老鼠标「单击变双击」：微动老化后金属弹片回弹抖动，一次点击被识别成两次。</li>
          <li>游戏玩家测连点手感：用 CPS 与平均间隔评估自己的点击速度与鼠标响应。</li>
          <li>排查侧键无响应：确认是浏览器拦截、驱动未映射还是硬件损坏。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么是双击失灵？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          鼠标微动（按键开关）内部的金属弹片经数万次按压后疲劳、氧化，会出现两种典型故障：一是单击被识别为双击（点击间隔短于约 80ms 的异常连点），
          二是快速连点时第二次按下接触不良、信号丢失（表现为刻意连点但间隔异常拉长到 1500ms 以上）。本工具把「最近 5 次间隔全部异常」作为判定阈值，
          满足即标记「疑似双击失灵」。更换微动或返修前，可换一台电脑 / 换一个 USB 接口复测，排除系统设置（如双击速度）干扰。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">测试结果说明</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本页检测的是「浏览器收到的事件」。操作系统双击速度设置、浏览器手势插件、厂商驱动都可能拦截或改写按键行为；
          触控板点按、触摸屏也可能被计入点击。判断硬件好坏时请在测试区反复操作并结合换设备交叉验证，滚轮格数按事件数近似统计，不同滚轮编码器每格触发次数略有差异。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么判断鼠标双击失灵？</h3>
            <p class="text-sm text-muted-foreground mt-1">快速双击左键 10 次以上并单击 20 次：若没点两下却频繁出现间隔小于 80ms 的记录（单击变双击），或刻意连点时连续 5 次间隔超过 1500ms（点击被吞），状态会标记为「疑似双击失灵」，两种模式都指向微动老化。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">侧键（后退 / 前进键）按下没反应？</h3>
            <p class="text-sm text-muted-foreground mt-1">测试区已拦截侧键默认的页面导航行为，正常应能看到计数增加。若计数始终为 0，先检查鼠标驱动或厂商软件是否将侧键映射成了其他功能，再交叉换机测试确认是否硬件损坏。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">测试数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有点击、滚轮与轨迹事件都在你的浏览器内存中处理，不发送任何网络请求，刷新或离开页面后计数自动清零。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mouse-test'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Mouse, MousePointerClick, Gauge, RotateCcw,
  AlertTriangle, CheckCircle, ListChecks, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '鼠标按键测试 - 在线鼠标双击/滚轮/侧键检测工具',
  description: '免费在线鼠标测试工具，左中右键与侧键点击计数、双击间隔与 CPS 检测、滚轮格数与移动轨迹测试，排查单击变双击、双击失灵、滚轮跳格，新鼠标验货必备，纯浏览器本地运行不上传',
  keywords: '鼠标按键测试,鼠标双击测试,鼠标连点检测,鼠标滚轮测试,新鼠标验货,鼠标侧键测试,CPS测试',
  author: '有条工具',
  ogTitle: '鼠标按键测试 - 在线鼠标双击/滚轮/侧键检测工具 | 有条工具',
  ogDescription: '点击计数、双击间隔检测、滚轮与轨迹测试，快速排查鼠标双击失灵。',
  ogUrl: 'https://www.util.cn/tools/mouse-test',
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
          name: '鼠标按键测试',
          url: 'https://www.util.cn/tools/mouse-test',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['左中右键与侧键点击计数', '双击间隔与 CPS 检测', '疑似双击失灵判定', '滚轮上下格数统计', 'Canvas 渐隐移动轨迹', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '鼠标按键测试', item: 'https://www.util.cn/tools/mouse-test/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '怎么判断鼠标双击失灵？',
              acceptedAnswer: { '@type': 'Answer', text: '快速双击左键10次以上并单击20次：若没点两下却频繁出现间隔小于80ms的记录（单击变双击），或刻意连点时连续5次间隔超过1500ms（点击被吞），状态会标记为疑似双击失灵，两种模式都指向微动老化。' }
            },
            {
              '@type': 'Question',
              name: '侧键（后退/前进键）按下没反应怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '测试区已拦截侧键默认的页面导航行为，正常应能看到计数增加。若计数始终为0，先检查鼠标驱动或厂商软件是否将侧键映射成了其他功能，再交叉换机测试确认是否硬件损坏。' }
            },
            {
              '@type': 'Question',
              name: '测试数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有点击、滚轮与轨迹事件都在浏览器内存中处理，不发送任何网络请求，刷新或离开页面后计数自动清零。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_INTERVALS = 12   // 每键最多保留的相邻间隔样本数
const BOUNCE_MS = 80       // 间隔小于此值：微动抖动（单击变双击）
const MISS_MS = 1500       // 间隔大于此值：连点时第二次点击被微动丢失
const WHEEL_THRESHOLD = 10 // |deltaY| 低于此值视为无效滚动（防触板抖动误计）

// 记录一次相邻点击间隔，超出上限时只保留最近样本
function recordInterval(list, interval) {
  const next = list.concat(interval)
  return next.length > MAX_INTERVALS ? next.slice(next.length - MAX_INTERVALS) : next
}

// 最近 10 次间隔的平均值（ms），无样本返回 null
function avgIntervalOf(list) {
  if (!list.length) return null
  const recent = list.slice(-10)
  return Math.round(recent.reduce((s, ms) => s + ms, 0) / recent.length)
}

// 每秒点击数 = 1000 ÷ 平均间隔，保留 1 位小数
function cpsOfIntervals(list) {
  const avg = avgIntervalOf(list)
  if (avg === null || avg <= 0) return 0
  return Math.round((1000 / avg) * 10) / 10
}

// 按键状态判定：未检测 / 正常 / 疑似双击失灵（最近 5 次间隔全部异常）
function judgeButtonStatus(clicks, intervals) {
  if (!clicks) return 'undetected'
  const recent = intervals.slice(-5)
  if (recent.length < 5) return 'ok'
  const allAbnormal = recent.every((ms) => ms < BOUNCE_MS || ms > MISS_MS)
  return allAbnormal ? 'suspect' : 'ok'
}

// 滚轮方向：deltaY < 0 向上，> 0 向下，过小视为无效
function wheelDirectionOf(deltaY) {
  if (deltaY < -WHEEL_THRESHOLD) return 'up'
  if (deltaY > WHEEL_THRESHOLD) return 'down'
  return null
}

// ---------- 按键定义 ----------
const buttonDefs = [
  { id: 0, name: '左键' },
  { id: 1, name: '中键' },
  { id: 2, name: '右键' },
  { id: 3, name: '侧键·后退' },
  { id: 4, name: '侧键·前进' }
]
const buttonColors = { 0: '#2563eb', 1: '#8b5cf6', 2: '#f59e0b', 3: '#10b981', 4: '#06b6d4' }
const buttonTotal = buttonDefs.length

const statusMeta = {
  undetected: { label: '未检测', class: 'bg-muted text-muted-foreground border-border' },
  ok: { label: '已检测到', class: 'bg-green-500/10 text-green-600 border-green-500/20' },
  suspect: { label: '疑似双击失灵', class: 'bg-red-500/10 text-red-600 border-red-500/20' }
}

// ---------- 测试状态 ----------
const buttonStates = ref(
  Object.fromEntries(buttonDefs.map((b) => [b.id, { clicks: 0, intervals: [], lastAt: null }]))
)
const scrollUp = ref(0)
const scrollDown = ref(0)
const activeButtons = ref([])
const lastEventText = ref('—')
const seoContentVisible = ref(true)

const totalClicks = computed(() =>
  buttonDefs.reduce((s, b) => s + buttonStates.value[b.id].clicks, 0)
)
const detectedCount = computed(() =>
  buttonDefs.filter((b) => buttonStates.value[b.id].clicks > 0).length
)
const activeNamesText = computed(() =>
  activeButtons.value.length
    ? activeButtons.value.map((id) => buttonDefs[id].name).join(' + ')
    : '—'
)
const suspectNames = computed(() =>
  buttonDefs.filter((b) => judgeButtonStatus(buttonStates.value[b.id].clicks, buttonStates.value[b.id].intervals) === 'suspect').map((b) => b.name)
)

const healthHint = computed(() => {
  if (suspectNames.value.length) {
    return `「${suspectNames.value.join('、')}」最近多次点击间隔异常，疑似微动双击失灵，建议换个接口 / 换台电脑复测确认。`
  }
  if (detectedCount.value === 0) {
    return '尚未检测到任何点击：把鼠标移入右侧测试区，单击、双击或滚动即可开始。'
  }
  if (detectedCount.value < buttonTotal) {
    return `已检测到 ${detectedCount.value} 个按键。继续补测中键与侧键，并快速双击左键 10 次以上以验证微动状态。`
  }
  return '5 个按键全部检测到，且最近点击间隔正常，未发现双击失灵迹象。'
})

const buttonCards = computed(() =>
  buttonDefs.map((def) => {
    const s = buttonStates.value[def.id]
    const avg = avgIntervalOf(s.intervals)
    return {
      id: def.id,
      name: def.name,
      color: buttonColors[def.id],
      clicks: s.clicks,
      avgText: avg === null ? '—' : `${avg} ms`,
      cpsText: cpsOfIntervals(s.intervals).toFixed(1),
      status: judgeButtonStatus(s.clicks, s.intervals)
    }
  })
)

// ---------- 事件处理（仅在 onMounted 注册，SSR 安全） ----------
const testAreaRef = ref(null)
const canvasRef = ref(null)

function handlePointerDown(e) {
  const btn = e.button
  const now = e.timeStamp || performance.now()
  if (btn >= 0 && btn <= 4) {
    e.preventDefault()
    const s = buttonStates.value[btn]
    if (s.lastAt !== null) {
      const interval = Math.max(0, Math.round(now - s.lastAt))
      s.intervals = recordInterval(s.intervals, interval)
    }
    s.lastAt = now
    s.clicks += 1
    lastEventText.value = `${buttonDefs[btn].name} 按下`
    if (!activeButtons.value.includes(btn)) activeButtons.value = [...activeButtons.value, btn]
    addClickMark(e, btn)
  } else {
    lastEventText.value = `额外按键 #${btn} 按下（不计入统计）`
  }
}

function handleWindowPointerUp(e) {
  activeButtons.value = activeButtons.value.filter((id) => id !== e.button)
}

function handleWheel(e) {
  e.preventDefault() // 测试滚轮时避免页面跟着滚动
  const dir = wheelDirectionOf(e.deltaY)
  if (dir === 'up') scrollUp.value += 1
  else if (dir === 'down') scrollDown.value += 1
  if (dir) {
    lastEventText.value = `滚轮向${dir === 'up' ? '上' : '下'}滚动（ΔY ${Math.round(e.deltaY)}）`
  }
}

function preventDefaultHandler(e) {
  e.preventDefault()
}

// ---------- 移动轨迹（Canvas 2D，节流绘制） ----------
const trailPoints = [] // { x, y, t } 相对测试区左上角
const clickMarks = []  // { x, y, t, color }
let rafId = null
let lastDrawTs = 0
let rectCache = null
let canvasCtx = null
let canvasW = 0
let canvasH = 0
const TRAIL_MS = 3500  // 轨迹保留时长
const MARK_MS = 1200   // 点击涟漪保留时长

function refreshRect() {
  if (testAreaRef.value) {
    rectCache = testAreaRef.value.getBoundingClientRect()
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  const area = testAreaRef.value
  if (!canvas || !area) return
  const dpr = window.devicePixelRatio || 1
  canvasW = area.clientWidth
  canvasH = area.clientHeight
  canvas.width = Math.max(1, Math.round(canvasW * dpr))
  canvas.height = Math.max(1, Math.round(canvasH * dpr))
  canvasCtx = canvas.getContext('2d')
  if (canvasCtx) canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  refreshRect()
}

function handlePointerEnter() {
  refreshRect()
}

function handlePointerMove(e) {
  if (!rectCache) refreshRect()
  if (!rectCache) return
  trailPoints.push({ x: e.clientX - rectCache.left, y: e.clientY - rectCache.top, t: performance.now() })
  if (trailPoints.length > 800) trailPoints.splice(0, trailPoints.length - 800)
}

function addClickMark(e, btn) {
  refreshRect()
  if (!rectCache) return
  clickMarks.push({
    x: e.clientX - rectCache.left,
    y: e.clientY - rectCache.top,
    t: performance.now(),
    color: buttonColors[btn] || '#2563eb'
  })
  if (clickMarks.length > 40) clickMarks.splice(0, clickMarks.length - 40)
}

function drawLoop() {
  rafId = requestAnimationFrame(drawLoop)
  const ctx = canvasCtx
  if (!ctx) return
  const now = performance.now()
  if (now - lastDrawTs < 32) return // 约 30fps 节流绘制
  lastDrawTs = now

  while (trailPoints.length && now - trailPoints[0].t > TRAIL_MS) trailPoints.shift()
  while (clickMarks.length && now - clickMarks[0].t > MARK_MS) clickMarks.shift()

  ctx.clearRect(0, 0, canvasW, canvasH)

  // 渐隐移动轨迹：越新越亮，长时间停顿处断开
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (let i = 1; i < trailPoints.length; i++) {
    const a = trailPoints[i - 1]
    const b = trailPoints[i]
    if (b.t - a.t > 250) continue
    const alpha = Math.max(0, 1 - (now - b.t) / TRAIL_MS) * 0.8
    if (alpha <= 0.02) continue
    ctx.strokeStyle = `rgba(37, 99, 235, ${alpha.toFixed(3)})`
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  // 点击涟漪：按按键着色，向外扩散并渐隐
  for (const m of clickMarks) {
    const p = (now - m.t) / MARK_MS
    ctx.globalAlpha = 1 - p
    ctx.strokeStyle = m.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(m.x, m.y, 6 + p * 22, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

function resetTest() {
  buttonDefs.forEach((b) => {
    buttonStates.value[b.id] = { clicks: 0, intervals: [], lastAt: null }
  })
  scrollUp.value = 0
  scrollDown.value = 0
  activeButtons.value = []
  lastEventText.value = '—'
  trailPoints.splice(0, trailPoints.length)
  clickMarks.splice(0, clickMarks.length)
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('pointerup', handleWindowPointerUp)

  const area = testAreaRef.value
  if (area) {
    area.addEventListener('pointerdown', handlePointerDown)
    area.addEventListener('pointermove', handlePointerMove)
    area.addEventListener('pointerenter', handlePointerEnter)
    // 非被动监听：需要 preventDefault 阻止页面滚动 / 右键菜单 / 拖拽 / 侧键导航
    area.addEventListener('wheel', handleWheel, { passive: false })
    area.addEventListener('contextmenu', preventDefaultHandler)
    area.addEventListener('mousedown', preventDefaultHandler)
    area.addEventListener('auxclick', preventDefaultHandler)
    area.addEventListener('dragstart', preventDefaultHandler)
  }

  rafId = requestAnimationFrame(drawLoop)
  addRecentTool('mouse-test')
})

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('pointerup', handleWindowPointerUp)
  const area = testAreaRef.value
  if (area) {
    area.removeEventListener('pointerdown', handlePointerDown)
    area.removeEventListener('pointermove', handlePointerMove)
    area.removeEventListener('pointerenter', handlePointerEnter)
    area.removeEventListener('wheel', handleWheel)
    area.removeEventListener('contextmenu', preventDefaultHandler)
    area.removeEventListener('mousedown', preventDefaultHandler)
    area.removeEventListener('auxclick', preventDefaultHandler)
    area.removeEventListener('dragstart', preventDefaultHandler)
  }
})
</script>
