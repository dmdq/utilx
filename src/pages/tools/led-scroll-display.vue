<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Clapperboard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">LED 滚动字幕屏</h1>
          <p class="text-sm text-muted-foreground mt-1">手机秒变应援灯牌 / 接机牌 / 摊位招牌，全屏大字滚动闪烁</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入应援文字，选择字色（支持彩虹逐字配色）、背景、字号与滚动方向，点「全屏」即可让整块屏幕变成 LED 走字屏。演唱会把手机横过来举高就是灯牌，接机、摆摊叫卖、课堂提示同样适用。纯本地渲染，不联网、无广告遮挡。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左栏：设置 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Type class="w-5 h-5 mr-2 text-primary" /> 字幕内容
          </h2>
          <textarea
            v-model="text"
            rows="4"
            maxlength="120"
            placeholder="每行一句，可多行&#10;例如：&#10;欢迎回家&#10;一路辛苦了"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          <p class="text-xs text-muted-foreground">共 {{ lineCount }} 行 {{ totalChars }} 字 · 循环时长约 {{ duration }} 秒</p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Palette class="w-5 h-5 mr-2 text-primary" /> 颜色
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">字色</label>
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="c in colorSwatches"
                :key="c"
                class="w-7 h-7 rounded-full border border-border hover:scale-110 transition-transform"
                :style="{ background: c }"
                :title="c"
                @click="setFg(c)"
              />
              <input v-model="fgColor" type="color" class="w-9 h-7 rounded cursor-pointer bg-background border border-input" title="自定义字色" />
            </div>
            <label class="flex items-center gap-2 mt-2.5 text-sm text-foreground">
              <input v-model="rainbow" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
              彩虹逐字配色（应援色轮播）
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">背景色（默认黑）</label>
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="c in bgSwatches"
                :key="c"
                class="w-7 h-7 rounded-full border border-border hover:scale-110 transition-transform"
                :style="{ background: c }"
                :title="c"
                @click="bgColor = c"
              />
              <input v-model="bgColor" type="color" class="w-9 h-7 rounded cursor-pointer bg-background border border-input" title="自定义背景" />
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 滚动与字号
          </h2>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">滚动方向</label>
            <div class="grid grid-cols-5 gap-1.5">
              <button
                v-for="d in directions"
                :key="d.value"
                @click="direction = d.value"
                :class="direction === d.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1"
                :title="d.label"
              >
                <component :is="d.icon" class="w-4 h-4" /> {{ d.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">字号</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="s in sizes"
                :key="s.value"
                @click="sizeMode = s.value"
                :class="sizeMode === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >
                {{ s.label }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">当前约 {{ fontSize }} vmin（随屏幕短边自适应缩放）</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5">
              滚动速度：<span class="text-primary">{{ speed }}</span>
              <span class="text-muted-foreground font-normal">（1 慢 → 10 快）</span>
            </label>
            <input v-model.number="speed" type="range" min="1" max="10" class="w-full accent-primary" />
          </div>

          <label class="flex items-center gap-2 text-sm text-foreground">
            <input v-model="blink" type="checkbox" class="w-4 h-4 rounded border-border accent-primary" />
            闪烁效果（配合静止或滚动都有效果）
          </label>
        </div>
      </div>

      <!-- 右栏：LED 屏 -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <MonitorPlay class="w-5 h-5 mr-2 text-primary" /> 字幕屏
          </h2>
          <button
            @click="toggleFullscreen"
            class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Maximize v-if="!isFullscreen" class="w-4 h-4" />
            <Minimize v-else class="w-4 h-4" />
            {{ isFullscreen ? '退出全屏' : '全屏点亮' }}
          </button>
        </div>

        <!-- 舞台 -->
        <div
          ref="stageRef"
          class="led-stage relative w-full rounded-xl overflow-hidden border border-border"
          :style="{ background: bgColor, color: fgColor, animation: stageBlink }"
        >
          <!-- 空态 -->
          <div v-if="!lineCount" class="h-[300px] lg:h-[380px] flex flex-col items-center justify-center gap-2 opacity-50">
            <Clapperboard class="w-8 h-8" />
            <p class="text-sm">在左侧输入文字，屏幕就会亮起来</p>
          </div>

          <!-- 横向滚动（左/右）：两行堆叠为块，整块水平跑马 -->
          <div v-else-if="direction === 'left' || direction === 'right'" class="h-[300px] lg:h-[380px] flex items-center overflow-hidden">
            <div class="inline-flex flex-shrink-0" :style="runStyle">
              <div v-for="copy in 2" :key="copy" class="flex-shrink-0" :aria-hidden="copy === 2 ? 'true' : undefined">
                <div
                  v-for="(line, li) in lines"
                  :key="li"
                  class="whitespace-nowrap font-black tracking-wider"
                  style="line-height: 1.3; padding: 0.15em 0.4em"
                >
                  <span v-for="(ch, ci) in lineChars(line)" :key="ci" :style="{ color: colorFor(ci) }">{{ ch }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 纵向滚动（上/下）：文字块整体上下平移 -->
          <div v-else-if="direction === 'up' || direction === 'down'" class="h-[300px] lg:h-[380px] overflow-hidden">
            <div class="flex flex-col" :style="runStyle">
              <div v-for="copy in 2" :key="copy" class="flex flex-col" :aria-hidden="copy === 2 ? 'true' : undefined">
                <div
                  v-for="(line, li) in lines"
                  :key="li"
                  class="text-center whitespace-pre-wrap font-black tracking-wider"
                  style="line-height: 1.35; padding: 0.2em 0.4em"
                >
                  <span v-for="(ch, ci) in lineChars(line)" :key="ci" :style="{ color: colorFor(ci) }">{{ ch }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 静止（可闪烁） -->
          <div v-else class="h-[300px] lg:h-[380px] flex items-center justify-center overflow-hidden">
            <div class="text-center px-4 py-2" :style="blinkStyle">
              <div
                v-for="(line, li) in lines"
                :key="li"
                class="whitespace-pre-wrap font-black tracking-wider"
                style="line-height: 1.35"
              >
                <span v-for="(ch, ci) in lineChars(line)" :key="ci" :style="{ color: colorFor(ci) }">{{ ch }}</span>
              </div>
            </div>
          </div>

          <p class="absolute bottom-2 right-3 text-[10px] opacity-25 pointer-events-none select-none">按 Esc 或「退出全屏」返回</p>
        </div>

        <div class="bg-card border border-border rounded-lg p-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
          <Smartphone class="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
          <span>应援场景提示：演唱会/见面会请把手机<b class="text-foreground">横屏</b>后再全屏点亮，调成「特大」字号 + 彩虹逐字 + 静止闪烁最像灯牌；接机举高时建议黑色背景 + 高饱和亮黄/亮红字，远距离识别度最高。亮度请手动调到手机最高。</span>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 LED 滚动字幕屏</h2>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          这是一个把任意设备屏幕变成走字 LED 屏的在线工具：大字黑底、滚动或闪烁、配色自由。
          文字通过 CSS 动画（transform + keyframes）循环平移，动画时长由文字长度与速度共同决定，保持「恒定走字速度」的观感——字越多跑一轮越久，与真实门头 LED 屏一致。
          全屏模式使用浏览器标准全屏 API，进入后无任何界面元素遮挡，只有大字。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">典型使用场景</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><span class="text-foreground font-medium">演唱会应援</span>：横屏 + 特大字号 + 彩虹逐字，代替手写灯牌，改字只要 10 秒。</li>
          <li><span class="text-foreground font-medium">接机/接站</span>：静止 + 闪烁方向，名字一行大字，人流里最显眼。</li>
          <li><span class="text-foreground font-medium">摊位与门店</span>：「特价 10 元 / 扫码进群」之类的多行文案循环滚动，比贴纸醒目。</li>
          <li><span class="text-foreground font-medium">课堂与会议</span>：倒计时提示、欢迎词、标语展示。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">使用步骤</h3>
        <ol class="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>输入字幕文字，可换行分行显示。</li>
          <li>选字色（或开启彩虹逐字）与背景色，默认经典黑底。</li>
          <li>选滚动方向与速度；要「闪烁灯牌」选静止 + 闪烁。</li>
          <li>点击「全屏点亮」，把设备举起来即可。</li>
        </ol>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题</h3>
        <ul class="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><span class="text-foreground font-medium">文字会上传吗？</span>不会。所有内容仅在浏览器本地渲染，本页面无任何网络请求参与计算。</li>
          <li><span class="text-foreground font-medium">如何退出全屏？</span>点右上角「退出全屏」按钮，或直接按 Esc 键（安卓/iPhone Safari 部分版本需返回手势）。</li>
          <li><span class="text-foreground font-medium">为什么字越长感觉滚得越慢？</span>走字速度按恒定速度设计，文字总长度决定一轮循环时长，这样远距离才读得清；想更快请调高速度滑条或精简文字。</li>
        </ul>
      </div>
    </div>

    <RelatedTools :currentToolId="'led-scroll-display'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Clapperboard, Type, Palette, Settings2, MonitorPlay, Maximize, Minimize,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Pause, Smartphone,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'LED滚动字幕屏 - 应援灯牌接机牌走字屏 | 有条工具',
  description: '免费在线LED滚动字幕屏，输入文字全屏显示大字走马灯，支持彩虹逐字配色、背景色、字号自适应、横纵滚动与静止闪烁，演唱会应援灯牌、接机牌、摊位招牌神器，纯本地渲染',
  keywords: 'LED滚动字幕, 应援灯牌, 手机灯牌, 接机牌, 走字屏, 滚动字幕生成器, 全屏大字, 闪烁字幕',
  author: '有条工具',
  ogTitle: 'LED滚动字幕屏 - 手机秒变应援灯牌',
  ogDescription: '大字黑底滚动/闪烁字幕，彩虹逐字配色，速度字号可调，全屏点亮',
  ogUrl: 'https://www.util.cn/tools/led-scroll-display',
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
          name: 'LED滚动字幕屏',
          url: 'https://www.util.cn/tools/led-scroll-display',
          applicationCategory: 'EntertainmentApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['全屏大字字幕', '横向/纵向滚动与静止闪烁', '彩虹逐字配色', '恒定走字速度', '多行字幕', '纯本地渲染']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '更多工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: 'LED滚动字幕屏', item: 'https://www.util.cn/tools/led-scroll-display/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '文字会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有内容仅在浏览器本地渲染，页面计算与显示不依赖任何网络请求。' }
            },
            {
              '@type': 'Question',
              name: '如何退出全屏？',
              acceptedAnswer: { '@type': 'Answer', text: '点击「退出全屏」按钮或直接按Esc键即可返回页面。' }
            },
            {
              '@type': 'Question',
              name: '为什么字越长滚动一轮越久？',
              acceptedAnswer: { '@type': 'Answer', text: '走字采用恒定速度模型：位移距离等于屏幕加文字总长，因此文字越长循环时长越大，远距离才能读清，与真实LED门头屏行为一致。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'led-scroll-display')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* __PURE_START__ 纯函数区（供 node 自测提取，勿在此使用浏览器 API） */
const RAINBOW_COLORS = ['#ff4d4f', '#ff9f0a', '#ffe600', '#34c759', '#00e5ff', '#4d7bff', '#bf5af2', '#ff2d93']
function splitLines (text) {
  return String(text == null ? '' : text)
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)
}
// 恒定走字速度模型：循环距离 ≈ 屏幕 100 单位 + 每字 5.4 单位；速度 1..10 → 11..38 单位/秒
function speedToDuration (textLen, speed) {
  const n = Math.max(0, Math.round(Number(textLen) || 0))
  const raw = Number(speed)
  const s = Math.min(10, Math.max(1, Math.round(Number.isFinite(raw) ? raw : 5)))
  const travel = 100 + n * 5.4
  const unitsPerSec = 8 + s * 3
  return Math.max(1, Math.round((travel / unitsPerSec) * 10) / 10)
}
// 字号：大/特大为固定 vmin；全屏自适应按最长行与行数取小者
function fontSizeVmin (sizeMode, lines) {
  if (sizeMode === 'big') return 9
  if (sizeMode === 'bigger') return 15
  const ls = Array.isArray(lines) ? lines : []
  const count = Math.max(1, ls.length)
  const maxLen = ls.reduce((m, l) => Math.max(m, Array.from(String(l)).length), 1)
  return Math.max(5, Math.min(18, Math.min(72 / maxLen, 55 / count)))
}
function rainbowColorAt (charIndex) {
  const i = Math.max(0, Math.round(Number(charIndex) || 0))
  return RAINBOW_COLORS[i % RAINBOW_COLORS.length]
}
/* __PURE_END__ */

// ---------- 状态 ----------
const text = ref('欢迎回家\n一路辛苦了')
const fgColor = ref('#ffe600')
const bgColor = ref('#000000')
const rainbow = ref(false)
const direction = ref('left')
const sizeMode = ref('big')
const speed = ref(5)
const blink = ref(false)
const seoContentVisible = ref(true)
const stageRef = ref(null)
const isFullscreen = ref(false)

const colorSwatches = ['#ffffff', '#ffe600', '#ff4d4f', '#ff9f0a', '#34c759', '#00e5ff', '#4d7bff', '#ff2d93']
const bgSwatches = ['#000000', '#0a0f2c', '#1a0033', '#26060a']

const directions = [
  { value: 'left', label: '左滚', icon: ArrowLeft },
  { value: 'right', label: '右滚', icon: ArrowRight },
  { value: 'up', label: '上滚', icon: ArrowUp },
  { value: 'down', label: '下滚', icon: ArrowDown },
  { value: 'static', label: '静止', icon: Pause }
]
const sizes = [
  { value: 'big', label: '大' },
  { value: 'bigger', label: '特大' },
  { value: 'fit', label: '全屏自适应' }
]

const lines = computed(() => splitLines(text.value))
const lineCount = computed(() => lines.value.length)
const totalChars = computed(() => lines.value.reduce((acc, l) => acc + Array.from(l).length, 0))
const fontSize = computed(() => Math.round(fontSizeVmin(sizeMode.value, lines.value) * 10) / 10)
const duration = computed(() => speedToDuration(totalChars.value, speed.value))

const lineChars = (line) => Array.from(line)

const colorFor = (ci) => (rainbow.value ? rainbowColorAt(ci) : fgColor.value)

const runStyle = computed(() => {
  const style = {
    fontSize: fontSize.value + 'vmin',
    color: fgColor.value
  }
  if (direction.value === 'left' || direction.value === 'right') {
    const dir = direction.value === 'right' ? ' reverse' : ''
    style.animation = `led-scroll-x ${duration.value}s linear infinite${dir}`
  } else if (direction.value === 'up' || direction.value === 'down') {
    const dir = direction.value === 'down' ? ' reverse' : ''
    style.animation = `led-scroll-y ${duration.value}s linear infinite${dir}`
  }
  return style
})

const blinkStyle = computed(() => {
  const style = { fontSize: fontSize.value + 'vmin', color: fgColor.value }
  if (blink.value) style.animation = 'led-blink 1.15s step-end infinite'
  return style
})

// 静止模式的闪烁加在内容块上；横向/纵向模式的闪烁加在舞台上，避免打断滚动动画
const stageBlink = computed(() => {
  if (!blink.value) return ''
  if (direction.value === 'left' || direction.value === 'right' || direction.value === 'up' || direction.value === 'down') {
    return 'led-blink 1.15s step-end infinite'
  }
  return ''
})

const setFg = (c) => {
  fgColor.value = c
  rainbow.value = false
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 全屏（浏览器 API 仅在点击回调与钩子内） ----------
const onFsChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const toggleFullscreen = () => {
  const el = stageRef.value
  if (!el) return
  if (document.fullscreenElement) {
    if (document.exitFullscreen) document.exitFullscreen()
  } else if (el.requestFullscreen) {
    el.requestFullscreen().catch(() => {
      // 某些移动端浏览器不支持元素全屏，提示用户
      alert('当前浏览器不支持全屏，请改用系统自带的旋转/全屏，或在桌面浏览器中使用')
    })
  } else {
    alert('当前浏览器不支持全屏 API')
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFsChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFsChange)
})
</script>

<style>
/* 走字与闪烁关键帧（全局，供内联 animation 字符串引用） */
@keyframes led-scroll-x {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes led-scroll-y {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}
@keyframes led-blink {
  0%, 49.9% { opacity: 1; }
  50%, 100% { opacity: 0.1; }
}
/* 全屏时舞台铺满整屏 */
.led-stage:fullscreen,
.led-stage:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  border: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
/* 全屏时内容区铺满，覆盖屏幕预览用的固定高度（特异性高于 Tailwind h-[300px] 类） */
.led-stage:fullscreen > *,
.led-stage:-webkit-full-screen > * {
  width: 100%;
  height: 100%;
}
</style>
