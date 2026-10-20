<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wind class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">呼吸训练引导</h1>
          <p class="text-sm text-muted-foreground mt-1">4-7-8 呼吸法 / 盒式呼吸跟练动画，缓解焦虑、帮助放松入眠</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        跟随圆环的扩张与收缩调整呼吸：吸气时圆环扩大、屏息时保持、呼气时收缩。内置 4-7-8 呼吸法与 4-4-4-4 盒式呼吸两种经典节拍，也可自定义各阶段秒数。全程本地动画引导，无音频干扰，适合睡前放松与冥想入门。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 设置面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> 练习设置
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">呼吸模式</label>
          <div class="space-y-1.5">
            <button
              v-for="m in modeOptions"
              :key="m.value"
              @click="selectMode(m.value)"
              :class="mode === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="w-full py-2.5 px-3 rounded-lg text-sm font-medium transition-all text-left"
            >
              {{ m.label }}
              <span class="block text-[11px] opacity-80 mt-0.5">{{ m.desc }}</span>
            </button>
          </div>
        </div>

        <!-- 自定义秒数 -->
        <div v-if="mode === 'custom'" class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">吸气（秒）</label>
            <input v-model.number="customInhale" type="number" min="1" max="12" class="w-full px-2 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">屏息（秒）</label>
            <input v-model.number="customHold" type="number" min="0" max="12" class="w-full px-2 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">呼气（秒）</label>
            <input v-model.number="customExhale" type="number" min="1" max="15" class="w-full px-2 py-2 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">目标循环数</label>
            <span class="text-sm text-primary font-semibold">{{ targetCycles }} 次</span>
          </div>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="n in [2, 4, 6, 8]"
              :key="n"
              @click="targetCycles = n"
              :class="targetCycles === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ n }} 次</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">达到目标循环后自动结束并提示；4-7-8 法建议从 4 次开始</p>
        </div>

        <div class="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed">
          当前节拍：{{ phaseSummaryText }} · 单循环 {{ cycleDuration }} 秒 · 预计总时长约 {{ estimatedTotalText }}
        </div>

        <button
          @click="toggleRun"
          :class="running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'"
          class="w-full py-3 rounded-lg text-white font-semibold transition"
        >
          <Play v-if="!running" class="w-4 h-4 inline mr-1.5 -mt-0.5" />
          <Pause v-else class="w-4 h-4 inline mr-1.5 -mt-0.5" />
          {{ running ? '暂停' : (finished ? '重新开始' : (cycleCount > 0 ? '继续' : '开始练习')) }}
        </button>
        <button
          @click="resetExercise"
          class="w-full py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RotateCcw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
        </button>
      </div>

      <!-- 动画圆环（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center min-h-[480px] transition-colors duration-500" :style="{ backgroundColor: stageTint }">
        <!-- 结束提示 -->
        <div v-if="finished" class="text-center space-y-3">
          <div class="text-4xl">🌿</div>
          <p class="text-xl font-bold text-foreground">练习完成</p>
          <p class="text-sm text-muted-foreground">已完成 {{ cycleCount }} 个循环，用时 {{ formatClock(totalSeconds) }}。愿您身心放松。</p>
          <button @click="resetExercise" class="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition">再练一组</button>
        </div>

        <div v-else class="relative flex items-center justify-center" style="width: 300px; height: 300px;">
          <!-- 外圈光晕 -->
          <div class="absolute inset-0 rounded-full border border-dashed border-primary/30"></div>
          <!-- 呼吸圆环 -->
          <div
            class="absolute rounded-full transition-none"
            :style="ringStyle"
          ></div>
          <!-- 中心文字 -->
          <div class="relative z-10 text-center pointer-events-none">
            <p class="text-2xl font-bold text-foreground">{{ phaseLabelText }}</p>
            <p class="text-5xl font-mono font-bold text-primary mt-2">{{ displayCountdown }}</p>
            <p class="text-sm text-muted-foreground mt-2">第 {{ currentCycle }} / {{ targetCycles }} 循环</p>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-3 gap-2 text-center w-full max-w-md">
          <div class="bg-background/60 border border-border rounded-lg p-2.5">
            <p class="text-[10px] text-muted-foreground mb-0.5">阶段进度</p>
            <p class="text-sm font-bold text-foreground">{{ (phaseIndex + 1) }} / {{ phases.length }}</p>
          </div>
          <div class="bg-background/60 border border-border rounded-lg p-2.5">
            <p class="text-[10px] text-muted-foreground mb-0.5">已完成循环</p>
            <p class="text-sm font-bold text-foreground">{{ cycleCount }} 次</p>
          </div>
          <div class="bg-background/60 border border-border rounded-lg p-2.5">
            <p class="text-[10px] text-muted-foreground mb-0.5">总时长</p>
            <p class="text-sm font-bold text-foreground font-mono">{{ formatClock(totalSeconds) }}</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground mt-5 text-center max-w-md leading-relaxed">
          建议用鼻吸气、口呼气，肩膀放松；圆环扩至最大时吸气结束，缩至最小时呼气结束。
        </p>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <HeartPulse class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        健康提示：本工具仅为放松练习的节拍参考，不能替代医疗或心理治疗。练习时如出现头晕、胸闷、呼吸困难等不适，请立即停止并恢复正常呼吸；孕妇、呼吸系统疾病患者或有恐慌症史者，请先咨询医生。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>呼吸训练是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          有意识地放慢、加深呼吸可以激活副交感神经，让心率与紧张感随之下降。4-7-8 呼吸法（吸气 4 秒、屏息 7 秒、呼气 8 秒）由 Andrew Weil 博士推广，常用于助眠与情绪平复；盒式呼吸（4-4-4-4）因四段时长相等、轨迹像正方形而得名，被 Navy SEAL 等用于压力场景下的快速镇定。本工具用动画圆环替代默数，让您不必分心掐表。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">4-7-8 呼吸法怎么做？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          舌尖轻抵上颚，经鼻吸气 4 秒，屏息 7 秒，再经口缓慢呼气 8 秒，此为 1 个循环。初学者从 4 个循环开始（约 1 分钟），坚持一到两周后可增至 8 个循环。呼气长于吸气是本法的核心，能帮助身体更快进入放松状态。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么时候适合练习？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>睡前躺在床上、思绪纷乱难以入睡时（推荐 4-7-8）。</li>
          <li>考试、演讲、面试前感到紧张心跳快时（推荐盒式呼吸）。</li>
          <li>久坐办公午后昏沉，或冥想入门寻找专注锚点时。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">自定义节拍建议</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          若 4-7-8 屏息过长导致憋气难受，可先从自定义的 4-2-6 开始，逐步延长屏息时间；也可采用吸 4 呼 6 的简单延长呼气法。原则是呼气不短于吸气、练习后感觉放松而非更疲惫。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">练完反而头晕正常吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">过度换气或屏息用力过猛时可能出现轻微头晕，应立即恢复自然呼吸、缩短节拍的自定义时长。若持续不适请停止练习并咨询医生。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">每天练几次比较好？</h3>
            <p class="text-sm text-muted-foreground mt-1">一般建议每天 2 次、每次 4-8 个循环；4-7-8 呼吸法初学期不建议单次超过 4 个循环，熟悉后可按需增加。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">需要跟着数秒吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不需要。圆环的缩放与中央倒计时已同步节拍，把注意力放在呼吸与圆环上即可，跟随几个循环后身体会自然记住节奏。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'breathing-exercise'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Wind, SlidersHorizontal, Play, Pause, RotateCcw,
  HeartPulse, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '呼吸训练引导 - 4-7-8呼吸法/盒式呼吸跟练 | 有条工具',
  description: '在线呼吸训练引导工具，4-7-8 呼吸法与 4-4-4-4 盒式呼吸动画跟练，圆环随吸气屏息呼气缩放，可自定义节拍与循环数，缓解焦虑助眠放松，纯本地运行',
  keywords: '呼吸训练,478呼吸法,盒式呼吸,助眠呼吸,减压呼吸练习,冥想呼吸引导,腹式呼吸',
  author: '有条工具',
  ogTitle: '呼吸训练引导 - 4-7-8呼吸法/盒式呼吸跟练 | 有条工具',
  ogDescription: '跟随动画圆环练习 4-7-8 呼吸法与盒式呼吸，缓解焦虑、帮助放松入眠。',
  ogUrl: 'https://www.util.cn/tools/breathing-exercise',
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
          name: '呼吸训练引导',
          url: 'https://www.util.cn/tools/breathing-exercise',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['4-7-8 呼吸法引导', '盒式呼吸 4-4-4-4', '自定义吸屏呼秒数', '动画圆环节拍', '循环计数与计时', '结束自动提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '呼吸训练引导', item: 'https://www.util.cn/tools/breathing-exercise/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '练完呼吸反而头晕正常吗？',
              acceptedAnswer: { '@type': 'Answer', text: '过度换气或屏息用力过猛时可能出现轻微头晕，应立即恢复自然呼吸并缩短节拍时长；若持续不适请停止练习并咨询医生。' }
            },
            {
              '@type': 'Question',
              name: '每天练几次呼吸比较好？',
              acceptedAnswer: { '@type': 'Answer', text: '一般建议每天2次、每次4-8个循环；4-7-8呼吸法初学期不建议单次超过4个循环，熟悉后可按需增加。' }
            },
            {
              '@type': 'Question',
              name: '需要跟着数秒吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不需要，圆环缩放与中央倒计时已同步节拍，把注意力放在呼吸与圆环上即可。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑：阶段序列构建（可独立单测） ----------
// 吸气 inhale / 屏息 hold / 呼气 exhale
function buildPhases(mode, custom) {
  const P = (type, label, seconds) => ({ type, label, seconds })
  if (mode === 'p478') {
    return [P('inhale', '吸气', 4), P('hold', '屏息', 7), P('exhale', '呼气', 8)]
  }
  if (mode === 'box') {
    return [P('inhale', '吸气', 4), P('hold', '屏息', 4), P('exhale', '呼气', 4), P('hold', '屏息', 4)]
  }
  // 自定义：吸气/屏息/呼气秒数（屏息可为 0 表示跳过）
  const c = custom || { inhale: 4, hold: 4, exhale: 6 }
  const list = []
  if (c.inhale > 0) list.push(P('inhale', '吸气', c.inhale))
  if (c.hold > 0) list.push(P('hold', '屏息', c.hold))
  if (c.exhale > 0) list.push(P('exhale', '呼气', c.exhale))
  return list
}

function cycleDurationOf(phases) {
  return phases.reduce((s, p) => s + p.seconds, 0)
}

// ---------- 状态 ----------
const mode = ref('p478')
const customInhale = ref(4)
const customHold = ref(2)
const customExhale = ref(6)
const targetCycles = ref(4)

const modeOptions = [
  { value: 'p478', label: '4-7-8 呼吸法', desc: '吸 4 秒 · 屏 7 秒 · 呼 8 秒，助眠减压经典节拍' },
  { value: 'box', label: '盒式呼吸 4-4-4-4', desc: '吸 屏 呼 屏 各 4 秒，快速镇定' },
  { value: 'custom', label: '自定义节拍', desc: '按需设置吸气 / 屏息 / 呼气秒数' }
]

const phases = computed(() => buildPhases(mode.value, {
  inhale: Math.max(0, customInhale.value || 0),
  hold: Math.max(0, customHold.value || 0),
  exhale: Math.max(0, customExhale.value || 0)
}))
const cycleDuration = computed(() => cycleDurationOf(phases.value))

const phaseSummaryText = computed(() =>
  phases.value.length
    ? phases.value.map((p) => `${p.label} ${p.seconds}s`).join(' → ')
    : '请设置有效的吸气与呼气秒数'
)

const running = ref(false)
const finished = ref(false)
const phaseIndex = ref(0)
const phaseRemaining = ref(0)
const cycleCount = ref(0)
const totalSeconds = ref(0)
const scale = ref(0.5)

// rAF 引擎句柄（非响应式）
let rafId = null
let lastTs = null

const currentPhase = computed(() => phases.value[phaseIndex.value] || null)
const phaseLabelText = computed(() => (currentPhase.value ? currentPhase.value.label + '…' : '准备'))
const displayCountdown = computed(() =>
  Math.max(0, Math.ceil(phaseRemaining.value - 1e-6)).toString()
)
const currentCycle = computed(() => Math.min(targetCycles.value, cycleCount.value + 1))

const estimatedTotalText = computed(() => formatClock(cycleDuration.value * targetCycles.value))

function formatClock(sec) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// 圆环：吸气扩张至 1、呼气收缩至 0.5、屏息保持
const MIN_SCALE = 0.5
const MAX_SCALE = 1
const ringStyle = computed(() => ({
  width: '260px',
  height: '260px',
  transform: `scale(${scale.value.toFixed(3)})`,
  background: 'radial-gradient(circle at 35% 30%, rgba(96, 165, 250, 0.85), rgba(37, 99, 235, 0.55))',
  boxShadow: '0 0 60px rgba(59, 130, 246, 0.35)'
}))

// 柔和背景色随阶段变化
const stageTint = computed(() => {
  if (!currentPhase.value) return 'transparent'
  const t = currentPhase.value.type
  if (t === 'inhale') return 'rgba(59, 130, 246, 0.06)'
  if (t === 'exhale') return 'rgba(16, 185, 129, 0.06)'
  return 'rgba(139, 92, 246, 0.06)'
})

function enterPhase(index) {
  if (!phases.value.length) return
  phaseIndex.value = index % phases.value.length
  phaseRemaining.value = phases.value[phaseIndex.value].seconds
}

function tick(ts) {
  if (!running.value) return
  if (!phases.value.length) {
    stopRun()
    return
  }
  // 若因自定义秒数变化导致索引越界，回到首阶段继续
  if (phaseIndex.value >= phases.value.length) enterPhase(0)
  if (lastTs === null) {
    lastTs = ts
    rafId = requestAnimationFrame(tick)
    return
  }
  const dt = Math.min(0.25, (ts - lastTs) / 1000)
  lastTs = ts
  totalSeconds.value += dt

  const phase = phases.value[phaseIndex.value]
  if (!phase) return

  phaseRemaining.value -= dt

  // 圆环缩放：按阶段进度线性插值
  const p = Math.min(1, Math.max(0, 1 - phaseRemaining.value / phase.seconds))
  if (phase.type === 'inhale') {
    scale.value = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * p
  } else if (phase.type === 'exhale') {
    scale.value = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * p
  }
  // hold：保持当前大小

  if (phaseRemaining.value <= 0) {
    // 进入下一阶段；若已回到首阶段则完成一个循环
    const nextIndex = phaseIndex.value + 1
    if (nextIndex >= phases.value.length) {
      cycleCount.value += 1
      if (cycleCount.value >= targetCycles.value) {
        stopRun()
        finished.value = true
        return
      }
    }
    enterPhase(nextIndex)
  }

  rafId = requestAnimationFrame(tick)
}

function startRun() {
  if (!phases.value.length) return
  if (finished.value) resetExercise()
  running.value = true
  lastTs = null
  if (phaseRemaining.value <= 0) enterPhase(phaseIndex.value)
  cancelRaf()
  rafId = requestAnimationFrame(tick)
}

function stopRun() {
  running.value = false
  cancelRaf()
}

function toggleRun() {
  if (running.value) stopRun()
  else startRun()
}

function resetExercise() {
  stopRun()
  finished.value = false
  phaseIndex.value = 0
  cycleCount.value = 0
  totalSeconds.value = 0
  scale.value = MIN_SCALE
  enterPhase(0)
}

function selectMode(m) {
  mode.value = m
  if (running.value || finished.value) resetExercise()
  else resetExercise()
}

// 自定义秒数变化时同步阶段时长（未运行时）
watch(phases, () => {
  if (!running.value && !finished.value) resetExercise()
})

function cancelRaf() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

onMounted(() => {
  enterPhase(0)
  addRecentTool('breathing-exercise')
})

// 卸载时务必取消动画帧，避免离开页面后 rAF 泄漏
onUnmounted(() => {
  cancelRaf()
})
</script>
