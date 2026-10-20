<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Keyboard class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">键盘按键测试</h1>
          <p class="text-sm text-muted-foreground mt-1">逐键检测坏键、测试按键无冲（键冲突），新键盘验货必备</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线键盘测试工具：按下任意按键即可实时高亮对应键位，自动记录已测试过的按键并统计进度。
        支持全键无冲（N-Key Rollover）检测——同时按住多个键，观察是否全部被识别，快速排查坏键与键冲问题。全部检测在浏览器本地完成，无需联网上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 状态面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gauge class="w-5 h-5 mr-2 text-primary" /> 测试进度
        </h2>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">已测试按键</p>
          <p class="text-2xl font-bold text-primary">已测 {{ testedCount }} / 共 {{ totalKeys }} 键</p>
        </div>

        <div>
          <div class="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full transition-all duration-200"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">按过的键会以绿点标记，方便检查遗漏</p>
        </div>

        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">当前同按</p>
            <p class="text-xl font-bold text-foreground">{{ currentSimultaneous }} 键</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-3">
            <p class="text-[10px] text-muted-foreground mb-1">最高同按纪录</p>
            <p class="text-xl font-bold text-foreground">{{ maxSimultaneous }} 键</p>
          </div>
        </div>

        <div class="text-sm space-y-1.5">
          <div class="flex items-center justify-between p-2 bg-muted rounded">
            <span class="text-muted-foreground">最近按键事件</span>
            <span class="font-mono text-xs text-foreground">{{ lastEventText }}</span>
          </div>
          <p v-if="rolloverHint" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground">{{ rolloverHint }}</p>
        </div>

        <button
          @click="resetTest"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RotateCcw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置测试记录
        </button>
      </div>

      <!-- 键盘布局区（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <LayoutGrid class="w-5 h-5 mr-2 text-primary" /> 标准键盘布局（按 e.code 定位）
          </h2>
          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <span class="flex items-center gap-1"><i class="w-3 h-3 rounded bg-primary inline-block"></i>当前按下</span>
            <span class="flex items-center gap-1"><i class="w-3 h-3 rounded border border-green-500 bg-green-500/10 inline-block"></i>已测试过</span>
          </div>
        </div>

        <div class="overflow-x-auto pb-2">
          <div class="kb-grid min-w-[980px]">
            <template v-for="(row, rowIdx) in keyRows" :key="rowIdx">
              <div
                v-for="(cell, cellIdx) in row"
                :key="`${rowIdx}-${cellIdx}`"
                :class="cell.code ? keyCellClass(cell.code) : 'kb-filler'"
                :style="{ gridColumn: `span ${cell.units * 4}` }"
              >
                <template v-if="cell.code">
                  <span class="kb-label">{{ cell.label }}</span>
                  <span v-if="isTested(cell.code)" class="kb-dot" title="已测试"></span>
                </template>
              </div>
            </template>
          </div>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          提示：页面出现后直接敲击键盘即可，无需点击某个键位。检测到的事件键码（如 KeyA、Space）来自浏览器 KeyboardEvent.code，与物理键位一一对应；
          <strong class="text-foreground">这是浏览器收到的事件，可能与硬件键冲有关</strong>——若某个组合中个别键按下后不亮，可能是键盘硬件冲突限制（Ghosting），也可能被操作系统或浏览器快捷键拦截。
        </p>

        <!-- 未收录键码 -->
        <div v-if="unmappedCodes.length" class="bg-muted/50 rounded-lg p-3">
          <p class="text-xs font-medium text-foreground mb-1.5">布局外按键（也已被浏览器收到）：</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="c in unmappedCodes" :key="c" class="px-2 py-0.5 bg-background border border-border rounded text-xs font-mono text-muted-foreground">{{ c }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 无冲测试指引 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold mb-3 flex items-center">
        <Shuffle class="w-5 h-5 mr-2 text-primary" /> 按键无冲 / 键冲突测试方法
      </h2>
      <ol class="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
        <li>先同时按住 <kbd class="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">W</kbd> + <kbd class="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">A</kbd> + <kbd class="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">S</kbd> + <kbd class="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">D</kbd> + <kbd class="px-1.5 py-0.5 bg-muted border border-border rounded text-xs font-mono">空格</kbd>，观察上方「当前同按」计数。</li>
        <li>逐个增加按键（如再加 J、K、L、;），直到计数不再增加——不亮起的键即疑似被键冲吞键。</li>
        <li>游戏键盘普遍支持 6KRO 或全键无冲（NKRO）；普通薄膜键盘常只支持 2-3 键无冲，同按 4-6 键丢键属正常现象。</li>
        <li>排查坏键：对每个键单独按下，若键位始终不高亮、也不出现在「布局外按键」里，则该键可能已损坏。</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>键盘按键测试是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          键盘按键测试是一款在线外设检测工具。它监听浏览器接收到的 keydown / keyup 事件，
          把每个按键的键码（KeyboardEvent.code）映射到可视化键盘布局上实时高亮，帮助你逐键验证新键盘是否全键正常、
          老键盘哪些键失灵，以及同时按下多键时是否发生「吞键」（键冲 / Ghosting）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">适合哪些场景？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>网购机械键盘开箱验货，逐键按下确认无坏键、无连点异常。</li>
          <li>玩游戏前检测 WASD 组合 + 空格是否会被键冲吞掉。</li>
          <li>排查笔记本某个键失灵是硬件问题还是系统快捷键被占用。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么是按键无冲与键冲？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          「无冲」（Rollover / NKO）指键盘同时按下多键时全部都能被独立识别。老式键盘多为 2KRO/6KRO，特定组合（如 W+A+Shift）会互相干扰导致某个键不触发，称为键冲或吞键。本工具的「当前同按 / 最高同按纪录」可粗略评估你这台键盘的无冲能力；若某组合中某个键始终不亮而单按正常，即疑似键冲组合。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">测试结果说明</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          本页检测的是「浏览器收到的键盘事件」。系统级快捷键（如 Ctrl+Tab、Cmd+Space）可能被操作系统或浏览器本身拦截，并不表示按键损坏；
          多媒体键、某些笔记本功能键（Fn+Fx）也不产生标准键码。判断硬件好坏时请结合单键测试与换设备交叉验证。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">按了键但页面没有反应？</h3>
            <p class="text-sm text-muted-foreground mt-1">先点击页面空白处让浏览器窗口获得焦点再按键。若只有个别键无反应且单键测试仍不亮，则该键可能存在硬件故障。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么同按多键时计数不变？</h3>
            <p class="text-sm text-muted-foreground mt-1">可能是键盘存在键冲限制（薄膜键盘常见 2-3 键无冲），也可能是组合键被操作系统或浏览器快捷键拦截，与按键本身好坏无关。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">这个工具会记录或上传我按键的内容吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。所有事件检测与统计都在你的浏览器内存中完成，不发送任何网络请求，页面刷新后记录自动清除。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'keyboard-test'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Keyboard, Gauge, LayoutGrid, Shuffle, RotateCcw,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '键盘按键测试 - 在线键盘检测/按键无冲测试',
  description: '免费在线键盘测试工具，逐键检测坏键与失灵按键，实时高亮键位、统计已测进度，支持按键无冲/键冲突（NKRO/Ghosting）测试，纯浏览器本地运行',
  keywords: '键盘测试,在线键盘检测,按键测试,键盘无冲,键冲突测试,键盘坏键,NKRO,新键盘验货',
  author: '有条工具',
  ogTitle: '键盘按键测试 - 在线键盘检测/按键无冲测试 | 有条工具',
  ogDescription: '逐键测试新键盘、排查坏键与按键冲突，实时高亮键位并统计测试进度。',
  ogUrl: 'https://www.util.cn/tools/keyboard-test',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（WebApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '键盘按键测试',
          url: 'https://www.util.cn/tools/keyboard-test',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['实时按键高亮', '已测按键进度统计', '按键无冲/键冲测试', '键码映射定位', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '键盘按键测试', item: 'https://www.util.cn/tools/keyboard-test/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '按了键但页面没有反应怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '先点击页面空白处让浏览器窗口获得焦点再按键。若只有个别键无反应且单键测试仍不亮，则该键可能存在硬件故障。' }
            },
            {
              '@type': 'Question',
              name: '为什么同按多键时计数不变？',
              acceptedAnswer: { '@type': 'Answer', text: '可能是键盘存在键冲限制（薄膜键盘常见2-3键无冲），也可能是组合键被操作系统或浏览器快捷键拦截，与按键本身好坏无关。' }
            },
            {
              '@type': 'Question',
              name: '这个工具会记录或上传按键内容吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有事件检测与统计都在浏览器内存中完成，不发送任何网络请求，刷新页面后记录自动清除。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 键盘布局定义（1u = 4 个 grid 列，行宽 100 列 = 25u） ----------
// k: 真实按键；g: 占位间隙
const k = (code, label, units = 1) => ({ code, label, units })
const g = (units) => ({ code: null, label: '', units })

const keyRows = [
  [
    k('Escape', 'Esc'),
    g(1),
    k('F1', 'F1'), k('F2', 'F2'), k('F3', 'F3'), k('F4', 'F4'),
    g(1),
    k('F5', 'F5'), k('F6', 'F6'), k('F7', 'F7'), k('F8', 'F8'),
    g(1),
    k('F9', 'F9'), k('F10', 'F10'), k('F11', 'F11'), k('F12', 'F12'),
    g(1),
    k('PrintScreen', 'PrtSc'), k('ScrollLock', 'ScrLk'), k('Pause', 'Pause'),
    g(5)
  ],
  [
    k('Backquote', '~'),
    k('Digit1', '1'), k('Digit2', '2'), k('Digit3', '3'), k('Digit4', '4'), k('Digit5', '5'),
    k('Digit6', '6'), k('Digit7', '7'), k('Digit8', '8'), k('Digit9', '9'), k('Digit0', '0'),
    k('Minus', '-'), k('Equal', '='), k('Backspace', 'Backspace', 2),
    g(1),
    k('Insert', 'Ins'), k('Home', 'Home'), k('PageUp', 'PgUp'),
    g(1),
    k('NumLock', 'Num'), k('NumpadDivide', '/'), k('NumpadMultiply', '*'), k('NumpadSubtract', '-'),
    g(1)
  ],
  [
    k('Tab', 'Tab', 1.5),
    k('KeyQ', 'Q'), k('KeyW', 'W'), k('KeyE', 'E'), k('KeyR', 'R'), k('KeyT', 'T'),
    k('KeyY', 'Y'), k('KeyU', 'U'), k('KeyI', 'I'), k('KeyO', 'O'), k('KeyP', 'P'),
    k('BracketLeft', '['), k('BracketRight', ']'), k('Backslash', '\\', 1.5),
    g(1),
    k('Delete', 'Del'), k('End', 'End'), k('PageDown', 'PgDn'),
    g(1),
    k('Numpad7', '7'), k('Numpad8', '8'), k('Numpad9', '9'), k('NumpadAdd', '+'),
    g(1)
  ],
  [
    k('CapsLock', 'Caps', 1.75),
    k('KeyA', 'A'), k('KeyS', 'S'), k('KeyD', 'D'), k('KeyF', 'F'), k('KeyG', 'G'),
    k('KeyH', 'H'), k('KeyJ', 'J'), k('KeyK', 'K'), k('KeyL', 'L'),
    k('Semicolon', ';'), k('Quote', "'"),
    k('Enter', 'Enter', 2.25),
    g(5),
    k('Numpad4', '4'), k('Numpad5', '5'), k('Numpad6', '6'),
    g(2)
  ],
  [
    k('ShiftLeft', 'Shift', 2.25),
    k('KeyZ', 'Z'), k('KeyX', 'X'), k('KeyC', 'C'), k('KeyV', 'V'), k('KeyB', 'B'),
    k('KeyN', 'N'), k('KeyM', 'M'), k('Comma', ','), k('Period', '.'), k('Slash', '/'),
    k('ShiftRight', 'Shift', 2.75),
    g(2),
    k('ArrowUp', '↑'),
    g(2),
    k('Numpad1', '1'), k('Numpad2', '2'), k('Numpad3', '3'), k('NumpadEnter', 'Enter'),
    g(1)
  ],
  [
    k('ControlLeft', 'Ctrl', 1.25), k('MetaLeft', 'Win', 1.25), k('AltLeft', 'Alt', 1.25),
    k('Space', 'Space', 6.25),
    k('AltRight', 'Alt', 1.25), k('ContextMenu', '菜单', 1.25), k('ControlRight', 'Ctrl', 1.25),
    g(1.25),
    g(1),
    k('ArrowLeft', '←'), k('ArrowDown', '↓'), k('ArrowRight', '→'),
    g(1),
    k('Numpad0', '0', 2), k('NumpadDecimal', '.', 1),
    g(2)
  ]
]

// e.code → 键位 id 映射（未知 code 返回 null）
const cellIndex = new Map()
keyRows.forEach((row) => {
  row.forEach((cell) => {
    if (cell.code) cellIndex.set(cell.code, cell.code)
  })
})

function codeToKeyCell(code) {
  return cellIndex.get(code) || null
}

const totalKeys = computed(() => cellIndex.size)

// ---------- 测试状态 ----------
const pressedCodes = ref(new Set())   // 当前按下的键
const testedCodes = ref(new Set())    // 本次会话测试过的键
const unmappedSet = ref(new Set())    // 布局未收录的 code
const maxSimultaneous = ref(0)
const lastEventText = ref('—')

const testedCount = computed(() => testedCodes.value.size)
const currentSimultaneous = computed(() => pressedCodes.value.size)
const unmappedCodes = computed(() => Array.from(unmappedSet.value).sort())
const progressPercent = computed(() =>
  totalKeys.value === 0 ? 0 : Math.min(100, Math.round((testedCount.value / totalKeys.value) * 100))
)

const rolloverHint = computed(() => {
  const best = maxSimultaneous.value
  if (best < 2) return '尚未测试同按组合：试着同时按住 W+A+S+空格，观察是否全部高亮。'
  if (best < 3) return `目前最高同按 ${best} 键。请继续尝试同时按住 4-6 个键，若某些组合不触发全部高亮，疑似存在键冲。`
  if (best < 6) return `已识别 ${best} 键同按，接近 6KRO。继续加压更多键位，若丢键则说明存在键冲上限。`
  return `最高同按 ${best} 键，多键组合均正常上报，接近或达到全键无冲（NKRO）水平。`
})

function isPressed(code) { return pressedCodes.value.has(code) }
function isTested(code) { return testedCodes.value.has(code) }
function keyCellClass(code) {
  return {
    'kb-key': true,
    'kb-pressed': isPressed(code),
    'kb-tested': isTested(code) && !isPressed(code)
  }
}

// 需要阻止默认行为（滚动/切焦点）的测试相关键；修饰键组合一律放行，避免破坏系统快捷键
const PREVENT_CODES = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'])

function handleKeyDown(e) {
  const code = e.code
  if (!code) return
  if (PREVENT_CODES.has(code) && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
  }
  pressedCodes.value.add(code)   // Set 自动去重，按住重复触发（repeat）不影响计数
  testedCodes.value.add(code)
  if (!codeToKeyCell(code)) unmappedSet.value.add(code)
  if (pressedCodes.value.size > maxSimultaneous.value) {
    maxSimultaneous.value = pressedCodes.value.size
  }
  lastEventText.value = `keydown ${e.key} (${code})`
}

function handleKeyUp(e) {
  const code = e.code
  if (!code) return
  pressedCodes.value.delete(code)
  lastEventText.value = `keyup ${e.key} (${code})`
}

function resetTest() {
  pressedCodes.value = new Set()
  testedCodes.value = new Set()
  unmappedSet.value = new Set()
  maxSimultaneous.value = 0
  lastEventText.value = '—'
}

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 事件监听器只在 onMounted 注册、onUnmounted 移除，避免内存泄漏
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  addRecentTool('keyboard-test')
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.kb-grid {
  display: grid;
  grid-template-columns: repeat(100, 1fr);
  grid-auto-rows: 2.4rem;
  gap: 4px;
}

.kb-filler {
  /* 间隙占位格 */
}

.kb-key {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 6px;
  border: 1px solid var(--border, #d4d4d8);
  background: var(--muted, #f4f4f5);
  color: var(--foreground, #18181b);
  font-size: 0.72rem;
  line-height: 1;
  user-select: none;
  transition: background-color 0.08s, transform 0.08s, border-color 0.08s;
  box-shadow: 0 1.5px 0 rgba(0, 0, 0, 0.12);
}

.kb-label {
  pointer-events: none;
  white-space: nowrap;
}

.kb-tested {
  border-color: rgb(34 197 94);
  background: rgba(34, 197, 94, 0.08);
}

.kb-tested::after {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 3px;
  width: 5px;
  height: 5px;
  border-radius: 9999px;
  background: rgb(34 197 94);
}

.kb-pressed {
  background: var(--primary, #2563eb);
  border-color: var(--primary, #2563eb);
  color: #fff;
  transform: translateY(1px);
  box-shadow: none;
}

kbd {
  font-size: 0.72rem;
}
</style>
