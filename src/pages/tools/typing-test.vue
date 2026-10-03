<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Type class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">打字速度测试</h1>
          <p class="text-sm text-muted-foreground mt-1">中文按字计速、英文按 WPM，逐字比对实时反馈</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择中文或英文段落，开始后进入倒计时，目标文本逐字高亮反馈正误，实时统计速度、准确率与进度。采用输入事件终值逐字比对，兼容中文输入法组词输入。成绩与历史最佳保存在本机浏览器中。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：设置与统计 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 测试设置
          </h2>

          <!-- 语言 -->
          <label class="block text-xs text-muted-foreground mb-1.5">语言</label>
          <div class="grid grid-cols-2 gap-1.5 mb-4">
            <button
              @click="switchLanguage('zh')"
              :disabled="running"
              :class="language === 'zh' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >中文</button>
            <button
              @click="switchLanguage('en')"
              :disabled="running"
              :class="language === 'en' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >English</button>
          </div>

          <!-- 段落 -->
          <label class="block text-xs text-muted-foreground mb-1.5">文本段落</label>
          <div class="space-y-1.5 mb-4">
            <button
              v-for="(s, idx) in currentSamples"
              :key="idx"
              @click="selectSample(idx)"
              :disabled="running"
              class="w-full text-left px-3 py-2 rounded-lg text-xs transition-all border disabled:cursor-not-allowed"
              :class="sampleIndex === idx
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border hover:border-primary/40 hover:bg-muted/30 text-muted-foreground'"
            >
              <span class="font-medium">{{ language === 'zh' ? sampleMeta.zh[idx] : sampleMeta.en[idx] }}</span>
              <span class="ml-1 text-muted-foreground">{{ s.length }}{{ language === 'zh' ? ' 字' : ' chars' }}</span>
            </button>
          </div>

          <!-- 时长 -->
          <label class="block text-xs text-muted-foreground mb-1.5">测试时长</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="d in durationOptions"
              :key="d"
              @click="selectDuration(d)"
              :disabled="running"
              :class="duration === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >{{ d }} 秒</button>
          </div>
        </div>

        <!-- 实时统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Gauge class="w-4 h-4 mr-2 text-primary" /> 实时统计
          </h3>
          <div class="grid grid-cols-2 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ displaySpeed }}</p>
              <p class="text-xs text-muted-foreground">{{ speedLabel }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ remainingText }}</p>
              <p class="text-xs text-muted-foreground">剩余时间</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-2xl font-bold text-green-500 font-mono tabular-nums">{{ correctCount }}</p>
              <p class="text-xs text-muted-foreground">正确字数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-2xl font-bold text-destructive font-mono tabular-nums">{{ wrongCount }}</p>
              <p class="text-xs text-muted-foreground">错误字数</p>
            </div>
          </div>

          <!-- 进度 -->
          <div class="mt-4">
            <div class="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>进度</span>
              <span>{{ progress.toFixed(0) }}%（准确率 {{ accuracy.toFixed(1) }}%）</span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- 历史最佳 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 历史最佳（{{ language === 'zh' ? '中文' : '英文' }}）
          </h3>
          <div v-if="bestRecord" class="grid grid-cols-2 gap-3 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ bestRecord.speed }}</p>
              <p class="text-xs text-muted-foreground">{{ speedLabel }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ bestRecord.accuracy }}%</p>
              <p class="text-xs text-muted-foreground">准确率</p>
            </div>
          </div>
          <p v-else class="text-xs text-muted-foreground text-center py-2">暂无记录，完成一次测试后自动保存</p>
        </div>
      </div>

      <!-- 右侧：测试区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 成绩卡 -->
        <div v-if="finished" class="bg-card border border-primary rounded-lg p-6">
          <div class="flex items-center gap-2 mb-4">
            <CheckCircle class="w-5 h-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">测试成绩</h2>
            <span v-if="isNewBest" class="text-xs text-green-500 font-medium">新纪录！</span>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center mb-4">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-3xl font-bold text-foreground font-mono tabular-nums">{{ finalSpeed }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ speedLabel }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-3xl font-bold text-foreground font-mono tabular-nums">{{ finalAccuracy.toFixed(1) }}%</p>
              <p class="text-xs text-muted-foreground mt-1">准确率</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-3xl font-bold text-foreground font-mono tabular-nums">{{ finalStreak }}</p>
              <p class="text-xs text-muted-foreground mt-1">最大连续正确</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="startTest"
              class="bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
            >
              <Play class="w-4 h-4" /> 再来一次
            </button>
            <button
              @click="resetTest"
              class="bg-muted hover:bg-muted/80 text-muted-foreground py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCw class="w-4 h-4" /> 重置
            </button>
          </div>
        </div>

        <!-- 目标文本与输入 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Type class="w-5 h-5 mr-2 text-primary" /> 目标文本
            </h2>
            <div class="flex items-center gap-2">
              <span
                class="text-xs px-2 py-1 rounded-full"
                :class="running ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
              >
                {{ running ? '测试进行中' : (started ? '已结束' : '等待开始') }}
              </span>
            </div>
          </div>

          <div class="p-6">
            <!-- 文本展示区 -->
            <div
              ref="textBox"
              class="h-44 overflow-y-auto bg-muted/30 border border-border rounded-lg p-4 text-lg leading-relaxed tracking-wide whitespace-pre-wrap break-all"
            >
              <span
                v-for="(ch, idx) in charStates"
                :key="idx"
                :data-idx="idx"
                :class="charClass(ch.status)"
              >{{ ch.char }}</span>
            </div>

            <!-- 输入区 -->
            <div class="mt-4">
              <input
                ref="typingInput"
                v-model="typed"
                type="text"
                :disabled="!running"
                autocomplete="off"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                placeholder="点击「开始测试」后在此输入，支持中文输入法组词"
                class="w-full px-4 py-3 bg-background border border-input rounded-lg text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                @paste.prevent
              />
              <p class="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  中文输入法兼容说明：工具不监听单个按键，而是对输入框的最终值逐字比对——组词、候选、回车上屏的中间过程都不会被判错，以输入框实际内容为准。
                </span>
              </p>
            </div>

            <!-- 控制按钮 -->
            <div class="grid grid-cols-2 gap-3 mt-4">
              <button
                @click="startTest"
                :disabled="running"
                class="bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
              >
                <Play class="w-4 h-4" /> {{ started ? '重新开始' : '开始测试' }}
              </button>
              <button
                @click="resetTest"
                class="bg-muted hover:bg-muted/80 text-muted-foreground py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCw class="w-4 h-4" /> 重置
              </button>
            </div>
          </div>
        </div>

        <!-- 说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 计分规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">中文</span>：速度 = 正确字数 ÷ 用时（分钟），单位为 字/分钟；<span class="text-foreground">英文</span>：WPM = 正确字符数 ÷ 5 ÷ 用时（分钟）</li>
            <li>• 准确率 = 正确字数 ÷ 已输入字数（含标点），空格与标点同样计入</li>
            <li>• 倒计时结束或提前完成全文时测试结束，按语言分别记录历史最佳</li>
            <li>• 建议练习时保持眼睛看目标文本，形成肌肉记忆后速度自然提升</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于打字速度测试</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            打字速度是值得长期投资的技能：从每分钟 30 字到 80 字，写文档、回消息、记笔记的体验会完全不同。中文打字速度通常用「字/分钟」衡量，普通熟练水平约 40-60 字/分钟；英文惯用 WPM（Words Per Minute，按 5 个字符折算一个词），60 WPM 以上即算熟练。本工具针对中文输入法做了兼容——不依赖单个按键事件，而是对输入框最终内容逐字比对，拼音组词、候选词选择的过程不会被误判。
          </p>
          <h3 class="text-lg font-semibold text-foreground">练习建议</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>先求准再求快：准确率稳定在 97% 以上后再逐步提速</li>
            <li>手指归位（ASDF / JKL;），尽量不看键盘，宁可慢也要保持指法</li>
            <li>每次 1-2 分钟短测更利于坚持，每天几次胜过每周一次长测</li>
            <li>关注「最大连续正确」：连续段越长，说明节奏越稳定</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">成绩会保存吗？</span>历史最佳按中英文分别保存在本机浏览器 localStorage 中，清除浏览器数据会重置。</li>
            <li><span class="text-foreground font-medium">为什么英文按 WPM、中文按字每分钟？</span>英文以词为天然单位（约 5 字符一词），中文以字为单位，两种口径分别更贴近各自的输入习惯。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'typing-test'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Type, Settings2, Gauge, CheckCircle, Info, Play, RotateCw,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '打字速度测试 - 在线打字练习与WPM测试工具',
  description: '在线打字速度测试，支持中文段落按字每分钟计速、英文按WPM计速，逐字高亮正误反馈，兼容中文输入法组词输入，实时统计准确率与进度，历史最佳保存在本地',
  keywords: '打字测试, 打字速度测试, 打字练习, wpm测试, 中文打字, 拼音打字, 在线打字',
  author: 'Util工具箱',
  ogTitle: '打字速度测试 - 有条工具',
  ogDescription: '中文按字计速、英文按 WPM，逐字比对实时反馈',
  ogUrl: 'https://www.util.cn/tools/typing-test',
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
          name: '打字速度测试',
          url: 'https://www.util.cn/tools/typing-test',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['中文/英文段落', '30/60/120秒可选', '逐字正误高亮', 'WPM与字每分钟计速', '历史最佳本地保存']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '打字速度测试', item: 'https://www.util.cn/tools/typing-test/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '支持中文输入法吗？',
              acceptedAnswer: { '@type': 'Answer', text: '支持。工具基于输入事件对输入框最终值逐字比对，拼音组词与候选上屏的中间过程不会被误判。' }
            },
            {
              '@type': 'Question',
              name: '成绩会保存吗？',
              acceptedAnswer: { '@type': 'Answer', text: '中英文历史最佳分别保存在本机浏览器 localStorage 中，不上传任何服务器。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'typing-test')

// ---------- 文本样例 ----------
const sampleMeta = {
  zh: ['工具与人', '学习方法', '生活节奏'],
  en: ['Practice', 'Software']
}

const samples = {
  zh: [
    '好的工具是人的延伸，它把重复的劳动交给机器，把创造的空间留给人。真正的高手不迷信工具，也不轻视工具，而是先想清楚要解决什么问题，再挑选合适的方法。软件会不断更新换代，但解决问题的思路、对细节的耐心和持续练习的习惯，才是真正带得走的能力。',
    '学习不是把知识搬进脑袋，而是把新内容和旧经验连接起来。遇到陌生的概念，先别急着背定义，试着找一个自己熟悉的例子；读完一段内容，合上书复述一遍，往往比再读三遍更有效。慢一点没有关系，重要的是每天进步一点，让时间和积累站在你这边。',
    '生活不必总是行色匆匆。清晨为自己泡一杯热茶，傍晚到楼下慢慢走一走，留意季节在树叶上的变化。把日子过得有节奏，不是懒散，而是懂得休息也是努力的一部分。认真对待一餐一饭、一次交谈，平凡的日子里同样藏着踏实而具体的幸福。'
  ],
  en: [
    'The quick brown fox jumps over the lazy dog while the calm river flows beneath the old stone bridge. Typing is a skill that grows with steady practice, and every mistake teaches your fingers where to go next. Keep your eyes on the text, keep your wrists relaxed, and let the rhythm carry you forward.',
    'Great software is built by people who care about small details. Simple tools, used well, can save hours of work every single week. Start with something easy, measure what really matters, and improve one step at a time until the whole workflow feels natural, smooth, and fast.'
  ]
}

// ---------- 状态 ----------
const BEST_KEY = 'typing-test-best'
const language = ref('zh')
const sampleIndex = ref(0)
const durationOptions = [30, 60, 120]
const duration = ref(60)

const typed = ref('')
const started = ref(false)
const running = ref(false)
const finished = ref(false)
const now = ref(Date.now())
const startTime = ref(0)
const endAt = ref(0)
const finishedAt = ref(0)
const isNewBest = ref(false)
const bestRecord = ref(null)
const textBox = ref(null)
const typingInput = ref(null)
const seoContentVisible = ref(true)

let tickTimer = null

const targetText = computed(() => samples[language.value][sampleIndex.value] || '')
const currentSamples = computed(() => samples[language.value])

const typedLength = computed(() => Math.min(typed.value.length, targetText.value.length))

// 逐字状态：pending / current / correct / wrong（按输入框最终值比对，兼容输入法）
const charStates = computed(() => {
  const target = targetText.value
  const input = typed.value
  const states = []
  for (let i = 0; i < target.length; i++) {
    let status = 'pending'
    if (i < input.length) {
      status = input[i] === target[i] ? 'correct' : 'wrong'
    } else if (i === input.length && running.value) {
      status = 'current'
    }
    states.push({ char: target[i], status })
  }
  return states
})

const correctCount = computed(() => {
  const target = targetText.value
  const input = typed.value
  let count = 0
  const len = Math.min(input.length, target.length)
  for (let i = 0; i < len; i++) {
    if (input[i] === target[i]) count++
  }
  return count
})

const wrongCount = computed(() => typedLength.value - correctCount.value)

const progress = computed(() => {
  if (!targetText.value) return 0
  return Math.min(100, (typedLength.value / targetText.value.length) * 100)
})

const accuracy = computed(() => {
  const len = typedLength.value
  return len === 0 ? 100 : (correctCount.value / len) * 100
})

const elapsedMinutes = computed(() => {
  if (!started.value) return 0
  const end = running.value ? now.value : (finishedAt.value || endAt.value)
  return Math.max(0.0001, (end - startTime.value) / 60000)
})

const speedLabel = computed(() => language.value === 'zh' ? '字/分钟' : 'WPM')

const liveSpeed = computed(() => {
  const correct = correctCount.value
  if (language.value === 'zh') return Math.round(correct / elapsedMinutes.value)
  return Math.round((correct / 5) / elapsedMinutes.value)
})

const displaySpeed = computed(() => (running.value || finished.value) ? liveSpeed.value : 0)

const remainingText = computed(() => {
  if (!running.value) return started.value ? '0:00' : formatDuration(duration.value)
  return formatDuration(Math.max(0, (endAt.value - now.value) / 1000))
})

const formatDuration = (seconds) => {
  const s = Math.ceil(seconds)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

const charClass = (status) => {
  switch (status) {
    case 'correct': return 'text-green-500'
    case 'wrong': return 'text-destructive underline decoration-destructive/60'
    case 'current': return 'bg-primary/20 text-foreground rounded-sm'
    default: return 'text-muted-foreground'
  }
}

// 最大连续正确
const maxStreak = computed(() => {
  const target = targetText.value
  const input = typed.value
  let max = 0
  let cur = 0
  const len = Math.min(input.length, target.length)
  for (let i = 0; i < len; i++) {
    if (input[i] === target[i]) {
      cur++
      if (cur > max) max = cur
    } else {
      cur = 0
    }
  }
  return max
})

// ---------- 成绩与历史最佳 ----------
const finalSpeed = ref(0)
const finalAccuracy = ref(100)
const finalStreak = ref(0)

const loadBest = () => {
  if (!process.client) return
  try {
    const data = JSON.parse(localStorage.getItem(BEST_KEY) || '{}')
    bestRecord.value = data[language.value] || null
  } catch (e) {
    bestRecord.value = null
  }
}

const saveBest = (speed, acc) => {
  if (!process.client) return
  try {
    let data = {}
    try { data = JSON.parse(localStorage.getItem(BEST_KEY) || '{}') } catch (e) { /* 忽略 */ }
    const prev = data[language.value]
    isNewBest.value = !prev || speed > prev.speed
    if (isNewBest.value) {
      data[language.value] = { speed, accuracy: acc, date: new Date().toISOString().slice(0, 10) }
      localStorage.setItem(BEST_KEY, JSON.stringify(data))
      bestRecord.value = data[language.value]
    }
  } catch (e) { /* 忽略 */ }
}

// ---------- 计时与流程 ----------
const stopTick = () => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

const tick = () => {
  now.value = Date.now()
  if (now.value >= endAt.value) {
    finishTest()
  }
}

const startTest = () => {
  stopTick()
  typed.value = ''
  started.value = true
  running.value = true
  finished.value = false
  finishedAt.value = 0
  isNewBest.value = false
  startTime.value = Date.now()
  endAt.value = startTime.value + duration.value * 1000
  now.value = startTime.value
  tickTimer = setInterval(tick, 100)
  nextTick(() => typingInput.value?.focus())
}

const finishTest = () => {
  stopTick()
  running.value = false
  finished.value = true
  finishedAt.value = Date.now()
  finalStreak.value = maxStreak.value
  finalAccuracy.value = accuracy.value
  if (language.value === 'zh') {
    finalSpeed.value = Math.round(correctCount.value / elapsedMinutes.value)
  } else {
    finalSpeed.value = Math.round((correctCount.value / 5) / elapsedMinutes.value)
  }
  saveBest(finalSpeed.value, Number(finalAccuracy.value.toFixed(1)))
}

const resetTest = () => {
  stopTick()
  typed.value = ''
  started.value = false
  running.value = false
  finished.value = false
  finishedAt.value = 0
  isNewBest.value = false
}

const switchLanguage = (lang) => {
  if (running.value) return
  language.value = lang
  sampleIndex.value = 0
  resetTest()
}

const selectSample = (idx) => {
  if (running.value) return
  sampleIndex.value = idx
  resetTest()
}

const selectDuration = (d) => {
  if (running.value) return
  duration.value = d
  resetTest()
}

// 当前字符滚动跟随；输入满全文时立即结束
watch(typedLength, async () => {
  if (running.value && typedLength.value >= targetText.value.length) {
    finishTest()
    return
  }
  if (!running.value || !textBox.value) return
  await nextTick()
  try {
    const el = textBox.value.querySelector(`[data-idx="${typedLength.value}"]`)
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  } catch (e) { /* 忽略 */ }
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

onMounted(() => {
  if (tool) addRecentTool(tool.id)
  loadBest()
})

onUnmounted(() => stopTick())
</script>
