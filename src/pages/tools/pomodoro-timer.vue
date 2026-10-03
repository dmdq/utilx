<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Timer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">番茄钟与白噪音</h1>
          <p class="text-sm text-muted-foreground mt-1">专注计时 + 实时合成白噪音，数据只存在本机</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        经典 25 分钟专注 + 5 分钟休息的番茄工作法，时长可自定义；内置白噪音/粉噪音/棕噪音实时合成（Web Audio，无音频文件），帮助屏蔽环境干扰。今日完成的番茄数保存在本机浏览器中。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：计时器 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-8">
          <!-- 阶段切换 -->
          <div class="grid grid-cols-2 gap-2 mb-6">
            <button
              @click="switchPhase('work')"
              :class="phase === 'work' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >专注</button>
            <button
              @click="switchPhase('break')"
              :class="phase === 'break' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >休息</button>
          </div>

          <!-- 时间显示 -->
          <div class="text-center py-6">
            <p class="text-6xl font-bold text-foreground font-mono tabular-nums">{{ displayTime }}</p>
            <p class="text-sm text-muted-foreground mt-3">
              {{ running ? (phase === 'work' ? '专注中，加油' : '休息一下，看看远处') : '准备开始' }}
            </p>
          </div>

          <!-- 控制 -->
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="toggleRun"
              class="col-span-2 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <Pause v-if="running" class="w-4 h-4" />
              <Play v-else class="w-4 h-4" />
              {{ running ? '暂停' : (remaining === phaseMs ? '开始' : '继续') }}
            </button>
            <button @click="reset" class="bg-muted hover:bg-muted/80 text-muted-foreground py-3 rounded-lg text-sm transition-all">
              重置
            </button>
          </div>

          <!-- 时长设置 -->
          <div class="grid grid-cols-2 gap-3 mt-6">
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5">专注时长（分钟）</label>
              <input v-model.number="workMin" type="number" min="1" max="120" :disabled="running"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm disabled:opacity-50" />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1.5">休息时长（分钟）</label>
              <input v-model.number="breakMin" type="number" min="1" max="60" :disabled="running"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm disabled:opacity-50" />
            </div>
          </div>
        </div>

        <!-- 今日统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Flame class="w-4 h-4 mr-2 text-primary" /> 今日成果
          </h3>
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-2xl font-bold text-foreground">{{ todayCount }}</p>
              <p class="text-xs text-muted-foreground">完成番茄</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-2xl font-bold text-foreground">{{ todayMinutes }}</p>
              <p class="text-xs text-muted-foreground">专注分钟</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：白噪音 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-2 flex items-center">
            <Volume2 class="w-5 h-5 mr-2 text-primary" /> 白噪音
          </h2>
          <p class="text-xs text-muted-foreground mb-5">由 Web Audio 实时合成，无循环感、无音频文件下载。</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              v-for="n in noiseTypes"
              :key="n.value"
              @click="toggleNoise(n.value)"
              class="rounded-lg border p-4 text-left transition-all"
              :class="noiseType === n.value && noiseOn
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'"
            >
              <p class="text-sm font-medium text-foreground">{{ n.label }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ n.desc }}</p>
              <p class="text-xs mt-2" :class="noiseType === n.value && noiseOn ? 'text-primary' : 'text-muted-foreground'">
                {{ noiseType === n.value && noiseOn ? '▶ 播放中' : '点击播放' }}
              </p>
            </button>
          </div>

          <div class="flex items-center gap-4">
            <Volume2 class="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input v-model.number="volume" type="range" min="0" max="100" class="flex-1 accent-primary" @input="applyVolume" />
            <span class="text-sm text-muted-foreground w-10 text-right">{{ volume }}%</span>
          </div>
          <p v-if="audioError" class="text-xs text-destructive mt-3">{{ audioError }}</p>
        </div>

        <!-- 使用建议 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 番茄工作法小贴士
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 一个番茄 = 25 分钟专注 + 5 分钟休息，每 4 个番茄后建议来一次 15-30 分钟长休息</li>
            <li>• 专注期间被打断，这个番茄通常作废——先写下干扰事项，休息时再处理</li>
            <li>• 白噪音适合掩盖突发人声；粉噪音频谱更平衡，棕噪音低频更重，睡前也适用</li>
            <li>• 长期统计比单日更重要：连续记录一周再评估自己的真实专注容量</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于番茄工作法与白噪音</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>番茄工作法（Pomodoro Technique）由 Francesco Cirillo 在 1980 年代提出：把工作时间切成 25 分钟的专注单元，配合短休息维持注意力密度。它的价值不在 25 分钟这个数字，而在「开始前明确一个任务、期间拒绝切换」的仪式感。</p>
          <h3 class="text-lg font-semibold text-foreground">三种噪音的区别</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>白噪音：全频段等功率，类似风扇声/收音机沙沙声，掩蔽效果最强</li>
            <li>粉噪音：低频能量更高，听感更柔和，类似雨声，长时间工作推荐</li>
            <li>棕噪音：能量集中在低频，类似瀑布轰鸣，对低频环境噪音（空调、马路）掩蔽更好</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">统计数据会丢吗？</span>保存在本机浏览器的 localStorage 中，清除浏览器数据会重置；不上传任何服务器。</li>
            <li><span class="text-foreground font-medium">切换标签页计时会停吗？</span>不会，计时基于时间戳计算而非累加。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pomodoro-timer'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Timer, Play, Pause, Flame, Volume2, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '番茄钟与白噪音 - 在线专注计时器',
  description: '在线番茄钟专注计时器，25分钟工作法可自定义时长，内置白噪音/粉噪音/棕噪音实时合成，专注统计保存在本地',
  keywords: '番茄钟, 在线番茄钟, 专注计时器, 白噪音, pomodoro, 工作法, 计时器',
  author: 'Util工具箱',
  ogTitle: '番茄钟与白噪音 - 有条工具',
  ogDescription: '专注计时 + 实时合成白噪音，数据只存在本机',
  ogUrl: 'https://www.util.cn/tools/pomodoro-timer',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: '番茄钟与白噪音', url: 'https://www.util.cn/tools/pomodoro-timer', applicationCategory: 'ProductivityApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['自定义专注/休息时长', '白/粉/棕噪音合成', '今日专注统计'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
          { '@type': 'ListItem', position: 3, name: '番茄钟与白噪音', item: 'https://www.util.cn/tools/pomodoro-timer/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pomodoro-timer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  loadToday()
})

// ---------- 计时器 ----------
const phase = ref('work')
const workMin = ref(25)
const breakMin = ref(5)
const running = ref(false)
const remaining = ref(25 * 60 * 1000)
const endAt = ref(0)
let tickTimer = null

const phaseMs = computed(() => (phase.value === 'work' ? workMin.value : breakMin.value) * 60 * 1000)

const displayTime = computed(() => {
  const total = Math.max(0, Math.ceil(remaining.value / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const tick = () => {
  remaining.value = Math.max(0, endAt.value - Date.now())
  if (remaining.value <= 0) {
    completePhase()
  }
}

const completePhase = () => {
  stopTick()
  running.value = false
  if (phase.value === 'work') {
    recordToday(workMin.value)
    switchPhase('break')
  } else {
    switchPhase('work')
  }
  if (process.client && 'vibrate' in navigator) {
    try { navigator.vibrate([300, 100, 300]) } catch (e) { /* 忽略 */ }
  }
}

const switchPhase = (p) => {
  stopTick()
  running.value = false
  phase.value = p
  remaining.value = phaseMs.value
}

watch([workMin, breakMin], () => {
  if (!running.value) remaining.value = phaseMs.value
})

const toggleRun = () => {
  if (running.value) {
    stopTick()
    running.value = false
  } else {
    endAt.value = Date.now() + remaining.value
    running.value = true
    tickTimer = setInterval(tick, 250)
  }
}

const stopTick = () => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

const reset = () => {
  stopTick()
  running.value = false
  remaining.value = phaseMs.value
}

onUnmounted(() => stopTick())

// ---------- 今日统计 ----------
const STORAGE_KEY = 'pomodoro-timer-stats'
const todayCount = ref(0)
const todayMinutes = ref(0)

const todayKey = () => new Date().toISOString().slice(0, 10)

const loadToday = () => {
  if (!process.client) return
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (data.date === todayKey()) {
      todayCount.value = data.count || 0
      todayMinutes.value = data.minutes || 0
    }
  } catch (e) { /* 忽略 */ }
}

const recordToday = (minutes) => {
  if (!process.client) return
  try {
    let data = {}
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch (e) { /* 忽略 */ }
    if (data.date !== todayKey()) data = { date: todayKey(), count: 0, minutes: 0 }
    data.count += 1
    data.minutes += minutes
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    todayCount.value = data.count
    todayMinutes.value = data.minutes
  } catch (e) { /* 忽略 */ }
}

// ---------- 白噪音（Web Audio 合成） ----------
const noiseTypes = [
  { value: 'white', label: '白噪音', desc: '类风扇声，掩蔽效果最强' },
  { value: 'pink', label: '粉噪音', desc: '类雨声，柔和不刺耳' },
  { value: 'brown', label: '棕噪音', desc: '类瀑布低鸣，适合低频环境' }
]

const noiseOn = ref(false)
const noiseType = ref('white')
const volume = ref(40)
const audioError = ref('')
let audioCtx = null
let noiseSource = null
let gainNode = null

const buildNoiseBuffer = (type) => {
  const sampleRate = audioCtx.sampleRate
  const buffer = audioCtx.createBuffer(1, sampleRate * 3, sampleRate)
  const data = buffer.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, brown = 0
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1
    if (type === 'white') {
      data[i] = w * 0.25
    } else if (type === 'pink') {
      // Paul Kellet 粉噪音近似
      b0 = 0.997 * b0 + w * 0.029
      b1 = 0.985 * b1 + w * 0.032
      b2 = 0.95 * b2 + w * 0.048
      data[i] = (b0 + b1 + b2 + w * 0.05) * 0.6
    } else {
      brown = (brown + 0.02 * w) / 1.02
      data[i] = brown * 3.5
    }
  }
  return buffer
}

const toggleNoise = async (type) => {
  audioError.value = ''
  if (noiseOn.value && noiseType.value === type) {
    stopNoise()
    return
  }
  noiseType.value = type
  stopNoise()
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    noiseSource = audioCtx.createBufferSource()
    noiseSource.buffer = buildNoiseBuffer(type)
    noiseSource.loop = true
    gainNode = audioCtx.createGain()
    gainNode.gain.value = volume.value / 100 * 0.5
    noiseSource.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    noiseSource.start()
    noiseOn.value = true
  } catch (err) {
    audioError.value = '音频初始化失败：' + (err.message || '浏览器不支持 Web Audio')
    noiseOn.value = false
  }
}

const applyVolume = () => {
  if (gainNode) gainNode.gain.value = volume.value / 100 * 0.5
}

const stopNoise = () => {
  if (noiseSource) {
    try { noiseSource.stop() } catch (e) { /* 忽略 */ }
    noiseSource = null
  }
  noiseOn.value = false
}

onUnmounted(() => {
  stopNoise()
  if (audioCtx) {
    try { audioCtx.close() } catch (e) { /* 忽略 */ }
  }
})
</script>
