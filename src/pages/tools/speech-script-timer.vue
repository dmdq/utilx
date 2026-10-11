<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Timer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">口播稿时长换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">字数与时长双向换算，语速档位 + 标点停顿加权 + 长稿分段</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        写短视频口播稿最怕时长没谱：太长剪不掉、太短凑不满。本工具支持双向换算——输入字数按语速估算时长，或反过来给定时长反推建议字数；可直接粘贴文稿自动计数（中文按字符、连续英文按词），并对句号、逗号等标点做停顿加权，让估算更贴近真实口播；还附分段器，按目标时长把长稿按句子边界切成 N 段。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 模式切换 -->
    <div class="flex gap-2 mb-6">
      <button
        @click="mode = 'words'"
        :class="mode === 'words' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
      >字数 → 时长</button>
      <button
        @click="mode = 'duration'"
        :class="mode === 'duration' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
      >时长 → 字数</button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <PenLine class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <!-- 模式①：字数 → 时长 -->
        <template v-if="mode === 'words'">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">字数（不粘贴文稿时生效）</label>
            <input
              v-model.number="wordCount"
              type="number"
              min="0"
              step="10"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="例如 520"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              或直接粘贴文稿自动计数
              <span v-if="scriptText.trim()" class="ml-2 text-xs text-primary">已计数：{{ autoCount }} 字</span>
            </label>
            <textarea
              v-model="scriptText"
              rows="6"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="粘贴口播稿原文，中文按字符计数，连续英文/数字按词计数；标点用于停顿加权"
            ></textarea>
          </div>
        </template>

        <!-- 模式②：时长 → 字数 -->
        <template v-else>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">目标时长</label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="targetMinutes"
                type="number"
                min="0"
                step="1"
                class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="分"
              />
              <span class="text-muted-foreground text-sm">分</span>
              <input
                v-model.number="targetSecondsInput"
                type="number"
                min="0"
                max="59"
                step="1"
                class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="秒"
              />
              <span class="text-muted-foreground text-sm">秒</span>
            </div>
          </div>
        </template>

        <!-- 语速档位 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">语速档位</label>
          <div class="grid grid-cols-3 gap-1.5 mb-2">
            <button
              v-for="p in speedPresets"
              :key="p.value"
              @click="applyPreset(p.value)"
              :class="speed === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ p.label }}（{{ p.value }}）</button>
          </div>
          <div class="flex items-center gap-3">
            <input
              v-model.number="speed"
              type="number"
              min="100"
              max="500"
              step="10"
              class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-muted-foreground text-sm whitespace-nowrap">字 / 分钟</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">可自定义 100–500 字/分钟，常用口播约 260 字/分钟</p>
        </div>

        <!-- 停顿加权开关 -->
        <div class="flex items-center gap-2">
          <input
            v-model="pauseEnabled"
            type="checkbox"
            id="pauseToggle"
            class="w-4 h-4 rounded border-border"
          />
          <label for="pauseToggle" class="text-sm text-foreground">启用停顿加权（句号/问号/感叹号 +0.6 秒，逗号/顿号 +0.3 秒）</label>
        </div>
        <p v-if="pauseEnabled && mode === 'words' && !scriptText.trim()" class="text-xs text-muted-foreground -mt-2">
          停顿加权需依据标点统计，直接填字数时按纯读速估算
        </p>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Clock class="w-5 h-5 mr-2 text-primary" /> 换算结果
        </h2>

        <!-- 模式①结果：两行时长 -->
        <template v-if="mode === 'words'">
          <div v-if="effectiveCount > 0">
            <div class="bg-muted/50 rounded-lg p-4 mb-3">
              <p class="text-xs text-muted-foreground mb-1">纯读速时长</p>
              <p class="text-2xl font-bold text-foreground">{{ fmtDuration(pureSeconds) }}</p>
              <p class="text-xs text-muted-foreground mt-1">约 {{ pureSeconds.toFixed(1) }} 秒 · {{ effectiveCount }} 字 · {{ speed }} 字/分</p>
            </div>
            <div class="bg-primary/10 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">含停顿时长{{ pauseEnabled ? '' : '（未启用加权）' }}</p>
              <p class="text-2xl font-bold text-primary">{{ fmtDuration(totalSeconds) }}</p>
              <p class="text-xs text-primary/80 mt-1">约 {{ totalSeconds.toFixed(1) }} 秒</p>
            </div>

            <div v-if="pauseEnabled && scriptText.trim()" class="text-sm mt-3 space-y-1.5">
              <div class="flex items-center justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">句号 / 问号 / 感叹号停顿</span>
                <span class="text-foreground font-medium">{{ strongPauses }} 处 × 0.6s = +{{ (strongPauses * 0.6).toFixed(1) }}s</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">逗号 / 顿号停顿</span>
                <span class="text-foreground font-medium">{{ weakPauses }} 处 × 0.3s = +{{ (weakPauses * 0.3).toFixed(1) }}s</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-muted-foreground">停顿合计</span>
                <span class="text-foreground font-medium">+{{ pauseSeconds.toFixed(1) }}s</span>
              </div>
            </div>
          </div>
          <div v-else class="p-8 text-center text-muted-foreground">
            输入字数或粘贴文稿开始换算
          </div>
        </template>

        <!-- 模式②结果：建议字数 -->
        <template v-else>
          <div v-if="targetTotalSeconds > 0">
            <div class="bg-primary/10 rounded-lg p-5 text-center mb-3">
              <p class="text-xs text-muted-foreground mb-1">{{ fmtDuration(targetTotalSeconds) }} · {{ speed }} 字/分 建议字数</p>
              <p class="text-3xl font-bold text-primary">{{ suggestedWords }} 字</p>
              <p class="text-xs text-muted-foreground mt-1.5">按纯读速 {{ speed }} 字/分钟推算，未计停顿</p>
            </div>
            <div class="text-sm">
              <div class="flex items-center justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">慢速口播 200 字/分</span>
                <span class="text-foreground font-medium">{{ Math.round(targetTotalSeconds / 60 * 200) }} 字</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">正常语速 260 字/分</span>
                <span class="text-foreground font-medium">{{ Math.round(targetTotalSeconds / 60 * 260) }} 字</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-border/50">
                <span class="text-muted-foreground">快节奏 320 字/分</span>
                <span class="text-foreground font-medium">{{ Math.round(targetTotalSeconds / 60 * 320) }} 字</span>
              </div>
            </div>
          </div>
          <div v-else class="p-8 text-center text-muted-foreground">
            输入目标时长开始反推字数
          </div>
        </template>
      </div>
    </div>

    <!-- 分段器 -->
    <div v-if="mode === 'words' && scriptText.trim()" class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Scissors class="w-5 h-5 mr-2 text-primary" /> 长稿分段器（按句子边界）
      </h2>
      <div class="flex items-center gap-3 mb-4">
        <label class="text-sm text-muted-foreground whitespace-nowrap">目标每段时长</label>
        <input
          v-model.number="segTargetSeconds"
          type="number"
          min="5"
          max="600"
          step="5"
          class="w-28 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span class="text-sm text-muted-foreground">秒 / 段 → 建议切成</span>
        <span class="text-sm font-bold text-primary">{{ segments.length }} 段</span>
      </div>
      <div class="space-y-2">
        <div
          v-for="(seg, i) in segments"
          :key="i"
          class="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
        >
          <span class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{{ i + 1 }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-muted-foreground">{{ seg.count }} 字</span>
              <span class="text-xs text-muted-foreground">约 {{ seg.seconds.toFixed(1) }} 秒</span>
            </div>
            <p class="text-sm text-foreground leading-relaxed break-all">{{ seg.preview }}{{ seg.truncated ? '…' : '' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="seoContentVisible = !seoContentVisible"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>口播稿时长怎么估算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            口播稿的时长主要由三个变量决定：字数、语速和停顿。基础公式是「时长 = 字数 ÷ 语速 × 60 秒」，但真实口播中每个句号、问号、感叹号后面通常要停约 0.6 秒，逗号、顿号停约 0.3 秒，长稿累积下来可能多出十几秒甚至更多——这就是为什么只按字数除以语速算出来的视频总是超时。
          </p>
          <h3 class="text-lg font-semibold text-foreground">语速档位怎么选</h3>
          <p>
            慢速口播约 200 字/分钟，适合知识讲解、情感类旁白与中老年受众；正常语速约 260 字/分钟，是大多数短视频口播的舒适区间；快节奏约 320 字/分钟，常见于带货、资讯盘点类内容。也可以按自己以往的成片反推：用成片秒数去除文稿字数，就是你的真实语速。
          </p>
          <h3 class="text-lg font-semibold text-foreground">长稿怎么分段</h3>
          <p>
            先设定每段目标时长（如 30 秒），工具会把总时长除以目标时长得到段数 N，再按句子边界把文稿尽量均匀地切分成 N 段，并给出每段的字数与估算时长。分段后每段可以单独录制或出镜，剪辑时也更容易对齐节奏。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">一分钟口播稿大概多少字？</span>正常语速约 260 字，慢速口播约 200 字，快节奏约 320 字；建议按 260 字/分钟预估，再留 10% 左右的弹性。</li>
            <li><span class="text-foreground font-medium">停顿加权是怎么计算的？</span>每个中英文句号、问号、感叹号加 0.6 秒，逗号、顿号加 0.3 秒，可在结果中分别查看两类停顿的合计；不需要时可直接关闭。</li>
            <li><span class="text-foreground font-medium">字数是怎么统计的？</span>中文按字符逐字计数，连续的英文或数字串按 1 个词计数，标点不计入字数，仅参与停顿加权。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'speech-script-timer'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Timer, PenLine, Clock, Scissors, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '口播稿时长换算器 - 字数与时长双向换算+停顿加权',
  description: '在线口播稿时长换算器，字数与时长双向换算，慢速/正常/快节奏语速档位可自定义，标点停顿加权估算更真实，附长稿按句分段器，纯本地计算',
  keywords: '口播稿字数, 一分钟多少字, 语速计算, 视频脚本时长, 口播时长估算, 脚本分段',
  author: 'Util工具箱',
  ogTitle: '口播稿时长换算器 - 有条工具',
  ogDescription: '口播稿字数与时长双向换算，语速档位、标点停顿加权与长稿分段',
  ogUrl: 'https://www.util.cn/tools/speech-script-timer',
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
          name: '口播稿时长换算器',
          url: 'https://www.util.cn/tools/speech-script-timer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['字数→时长换算', '时长→字数反推', '粘贴文稿自动计数', '标点停顿加权', '长稿按句分段', '语速档位可自定义']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '口播稿时长换算器', item: 'https://www.util.cn/tools/speech-script-timer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一分钟口播稿大概多少字？',
              acceptedAnswer: { '@type': 'Answer', text: '正常语速约 260 字，慢速口播约 200 字，快节奏约 320 字；建议按 260 字/分钟预估，再留 10% 左右的弹性。' }
            },
            {
              '@type': 'Question',
              name: '停顿加权是怎么计算的？',
              acceptedAnswer: { '@type': 'Answer', text: '每个中英文句号、问号、感叹号加 0.6 秒，逗号、顿号加 0.3 秒，两类停顿可分别查看合计，不需要时可关闭。' }
            },
            {
              '@type': 'Question',
              name: '字数是怎么统计的？',
              acceptedAnswer: { '@type': 'Answer', text: '中文按字符逐字计数，连续的英文或数字串按 1 个词计数，标点不计入字数，仅参与停顿加权。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'speech-script-timer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const mode = ref('words')
const wordCount = ref(0)
const scriptText = ref('')
const targetMinutes = ref(1)
const targetSecondsInput = ref(0)
const speed = ref(260)
const pauseEnabled = ref(true)
const segTargetSeconds = ref(30)
const seoContentVisible = ref(true)

const speedPresets = [
  { label: '慢速口播', value: 200 },
  { label: '正常语速', value: 260 },
  { label: '快节奏', value: 320 }
]

const applyPreset = (v) => { speed.value = v }

// ---------- 计数与停顿 ----------
const countUnits = (text) => {
  if (!text) return 0
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []
  const latin = text.match(/[A-Za-z0-9\u00C0-\u024F]+/g) || []
  return cjk.length + latin.length
}

const countStrongPauses = (text) => (text.match(/[。．.？?！!]/g) || []).length
const countWeakPauses = (text) => (text.match(/[，,、]/g) || []).length

const autoCount = computed(() => countUnits(scriptText.value))

const clampedSpeed = computed(() => Math.min(500, Math.max(100, speed.value || 260)))

const effectiveCount = computed(() => {
  if (scriptText.value.trim()) return autoCount.value
  return Math.max(0, wordCount.value || 0)
})

const strongPauses = computed(() => (pauseEnabled.value ? countStrongPauses(scriptText.value) : 0))
const weakPauses = computed(() => (pauseEnabled.value ? countWeakPauses(scriptText.value) : 0))
const pauseSeconds = computed(() => strongPauses.value * 0.6 + weakPauses.value * 0.3)

const pureSeconds = computed(() => effectiveCount.value / clampedSpeed.value * 60)
const totalSeconds = computed(() => pureSeconds.value + pauseSeconds.value)

const targetTotalSeconds = computed(() => Math.max(0, (targetMinutes.value || 0) * 60 + (targetSecondsInput.value || 0)))
const suggestedWords = computed(() => Math.round(targetTotalSeconds.value / 60 * clampedSpeed.value))

// ---------- 分段器 ----------
const segments = computed(() => {
  const text = scriptText.value.trim()
  if (!text) return []
  const sentences = (text.match(/[^。．.？?！!\n]+[。．.？?！!]?/g) || [])
    .map(s => s.trim())
    .filter(Boolean)
  if (!sentences.length) return []

  const target = Math.max(5, segTargetSeconds.value || 30)
  const n = Math.max(1, Math.ceil(totalSeconds.value / target))
  const base = Math.floor(sentences.length / n)
  const remainder = sentences.length % n

  const result = []
  let cursor = 0
  for (let i = 0; i < n; i++) {
    const take = base + (i < remainder ? 1 : 0)
    if (take <= 0) break
    const seg = sentences.slice(cursor, cursor + take).join('')
    cursor += take
    const strong = countStrongPauses(seg)
    const weak = countWeakPauses(seg)
    const count = countUnits(seg)
    const seconds = count / clampedSpeed.value * 60 + (pauseEnabled.value ? strong * 0.6 + weak * 0.3 : 0)
    result.push({
      count,
      seconds,
      preview: seg.length > 60 ? seg.slice(0, 60) : seg,
      truncated: seg.length > 60
    })
  }
  return result
})

// ---------- 格式化 ----------
const fmtDuration = (sec) => {
  const r = Math.round(sec)
  const m = Math.floor(r / 60)
  const s = r % 60
  if (m === 0) return `${s} 秒`
  return `${m} 分 ${s} 秒`
}
</script>
