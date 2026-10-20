<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BookOpen class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">古诗文默写挖空</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴古诗文篇目自动挖空生成默写卷，随机/等距/实词三种策略，可打印可自测判分</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        免费在线古诗文默写挖空生成器：粘贴任意古诗文原文，选择随机比例、每句等距或"易错实词"三种挖空策略，一键生成带等长下划线的默写卷；支持打印、逐空输入自测判分与原句对照。全部计算在浏览器本地完成，不上传任何内容。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 输入与策略区 -->
      <div class="lg:col-span-1 bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <Pencil class="w-5 h-5 mr-2 text-primary" /> 原文与挖空策略
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">古诗文原文</label>
          <textarea
            v-model="sourceText"
            rows="10"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴需要挖空的古诗文原文，保留换行即可……"
          ></textarea>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="sample in sampleList"
              :key="sample.key"
              @click="loadSample(sample.key)"
              class="px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >
              填入示例·{{ sample.name }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">挖空策略</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="s in strategies"
              :key="s.value"
              @click="strategy = s.value"
              :class="[
                'py-2 rounded-lg text-xs font-medium transition-all',
                strategy === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <div v-if="strategy === 'ratio'">
          <label class="block text-sm font-medium text-foreground mb-2">
            随机挖空比例：<span class="text-primary">{{ ratioPercent }}%</span>
          </label>
          <input
            v-model.number="ratioPercent"
            type="range"
            min="10"
            max="50"
            step="1"
            class="w-full accent-primary"
          />
          <p class="text-xs text-muted-foreground mt-1">按可挖字符数随机抽取该比例进行挖空</p>
        </div>

        <div v-if="strategy === 'interval'">
          <label class="block text-sm font-medium text-foreground mb-2">每句等距挖 N 字</label>
          <input
            v-model.number="intervalN"
            type="number"
            min="1"
            max="20"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1">以句号、问号、叹号、分号与换行分句，每句等距挖 N 个字</p>
        </div>

        <div v-if="strategy === 'wrong'">
          <p class="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
            内置 {{ wrongChars.length }} 个高频易错实词表（如"落霞与孤鹜齐飞"的"鹜"、"沧海月明珠有泪"的"沧"），命中即挖，专攻默写丢分字。
          </p>
        </div>

        <div class="flex gap-2">
          <button
            @click="regenerate"
            class="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
          >
            <Shuffle class="w-4 h-4" /> 重新挖空
          </button>
          <button
            @click="clearAll"
            class="px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition"
          >
            清空
          </button>
        </div>
      </div>

      <!-- 输出区 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 flex flex-col">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4 no-print">
          <div class="flex gap-1.5">
            <button
              @click="activeTab = 'sheet'"
              :class="[
                'px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'sheet' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >默写卷视图</button>
            <button
              @click="activeTab = 'quiz'"
              :class="[
                'px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'quiz' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >自测模式</button>
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
              <input v-model="showOriginal" type="checkbox" class="w-4 h-4 rounded border-border" />
              原句对照
            </label>
            <button
              @click="printSheet"
              class="px-3.5 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition flex items-center gap-1.5"
            >
              <Printer class="w-4 h-4" /> 打印默写卷
            </button>
          </div>
        </div>

        <div class="text-sm text-muted-foreground mb-3 no-print">
          共 <span class="font-semibold text-foreground">{{ blankableCount }}</span> 个可挖字，已挖
          <span class="font-semibold text-primary">{{ blanks.length }}</span> 空 / {{ blanksCharCount }} 字
        </div>

        <!-- 默写卷视图（可打印） -->
        <div class="recite-sheet flex-1">
          <h2 class="text-center text-xl font-bold text-foreground mb-1">古诗文默写卷</h2>
          <p class="text-center text-xs text-muted-foreground mb-4 no-print">策略：{{ currentStrategyLabel }} · 共 {{ blanks.length }} 处挖空 · 由有条工具生成</p>
          <div v-if="hasText" class="whitespace-pre-wrap break-all text-base leading-[2.4] text-foreground font-serif">
            <template v-for="(item, i) in renderItems" :key="i">
              <span v-if="item.blank" class="tracking-widest select-none border-b border-foreground mx-0.5">{{ '_'.repeat(item.text.length) }}</span>
              <span v-else>{{ item.text }}</span>
            </template>
          </div>
          <div v-else class="p-10 text-center text-muted-foreground">
            请先在左侧粘贴古诗文原文，或点击"填入示例"
          </div>

          <!-- 原句对照 -->
          <div v-if="showOriginal && hasText" class="mt-4 p-4 bg-muted/50 rounded-lg border border-border no-print">
            <p class="text-xs font-medium text-muted-foreground mb-2">原句对照</p>
            <p class="whitespace-pre-wrap break-all text-sm leading-loose text-muted-foreground font-serif">{{ sourceText }}</p>
          </div>
        </div>

        <!-- 自测模式 -->
        <div v-if="activeTab === 'quiz' && hasText" class="mt-2 border-t border-border pt-4 no-print">
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <button
              @click="checkAnswers"
              class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1.5"
            >
              <CheckCircle2 class="w-4 h-4" /> 核对答案
            </button>
            <button
              @click="fillAnswers"
              class="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition"
            >
              显示答案
            </button>
            <button
              @click="resetQuiz"
              class="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition"
            >
              清空重来
            </button>
            <div v-if="checked" class="ml-auto text-sm">
              正确率
              <span :class="accuracy >= 80 ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-500 font-bold'">
                {{ accuracy }}%
              </span>
              <span class="text-muted-foreground ml-1">（{{ correctCount }}/{{ blanks.length }} 空）</span>
            </div>
          </div>

          <div class="whitespace-pre-wrap break-all text-base leading-[2.6] text-foreground font-serif">
            <template v-for="(item, i) in renderItems" :key="i">
              <template v-if="item.blank">
                <input
                  :value="userAnswers[item.bi]"
                  :style="{ width: Math.max(item.text.length, 2) + 'ch' }"
                  @input="setAnswer(item.bi, $event.target.value)"
                  type="text"
                  spellcheck="false"
                  :class="[
                    'inline-block text-center border-b-2 mx-0.5 bg-transparent text-foreground focus:outline-none focus:bg-primary/10 font-serif',
                    checked
                      ? (userAnswers[item.bi] === blanks[item.bi] ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-red-500 text-red-500 bg-red-500/10')
                      : 'border-border'
                  ]"
                />
              </template>
              <span v-else>{{ item.text }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="relative no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
        :aria-label="seoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="p-6 mb-12 bg-card border border-border rounded-lg">
        <h2 class="text-2xl font-bold text-foreground mb-4">
          <span class="text-primary mr-2">#</span>古诗文默写挖空怎么用
        </h2>
        <p class="text-muted-foreground mb-4 leading-relaxed">
          把课本里的古诗文段落粘贴进左侧文本框（换行会原样保留），选一种挖空策略即可实时生成默写卷：随机比例适合日常泛练，每句等距适合控制难度均匀挖空，"易错实词"策略基于内置的高频易错字表，只挖学生最容易写错的字，针对性最强。点击"打印默写卷"即可输出纸质版直接用于课堂听写。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三种挖空策略怎么选</h3>
        <ul class="list-disc list-inside space-y-1.5 text-muted-foreground mb-4">
          <li><strong class="text-foreground">随机比例（10%–50%）</strong>：按可挖字数百分比随机布点，比例越高难度越大，适合考前摸底。</li>
          <li><strong class="text-foreground">每句等距挖 N 字</strong>：每句均匀挖 N 个字，难度分布稳定，适合每日限时训练。</li>
          <li><strong class="text-foreground">只挖易错实词</strong>：命中内置易错字表即挖，专攻"鹜/凫""沧/苍"这类形近致错的高频丢分字。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">自测判分与原句对照</h3>
        <p class="text-muted-foreground leading-relaxed mb-4">
          切到"自测模式"后，每个空变为可输入的格子，写完点击"核对答案"，逐空标绿（正确）或标红（写错），并给出正确率；"显示答案"可一键回填，"原句对照"开关则在卷面下方附完整原文，方便讲评。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">挖空会破坏段落和换行吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。换行符与标点默认不参与挖空，只出现在非挖空段中，默写卷保留原文的分行与分段结构，打印版式与原文一致。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">"易错实词"策略的字表是怎么来的？</h3>
            <p class="text-muted-foreground mt-1">
              内置约 60 个中高考必背篇目中的高频易错字（如"孤鹜"的"鹜"、"沧海"的"沧"、"冯虚御风"的"冯"等），按教材默写丢分统计整理；粘贴的原文命中表中字即被挖空。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成内容会上传到服务器吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。本工具为纯前端本地计算，粘贴的文本、输入的答案都只在您的浏览器内存中处理，刷新页面即清空，可放心使用任何未公开的试卷内容。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools currentToolId="recite-blank-generator" category="text" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  BookOpen, Pencil, Printer, Shuffle, CheckCircle2, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO配置
useSeoMeta({
  title: '古诗文默写挖空 - 随机/等距/易错实词三种策略 | Util工具箱',
  description: '粘贴古诗文篇目自动挖空生成默写卷，随机/等距/实词三种策略，可打印可自测判分，支持原句对照与内置易错字表，纯本地计算',
  keywords: '古诗文默写,默写卷生成,挖空练习,易错字,文言文默写,诗词填空,听写打印',
  author: 'Util工具箱',
  ogTitle: '古诗文默写挖空 - 有条工具',
  ogDescription: '粘贴古诗文自动挖空生成默写卷，随机/等距/易错实词三种策略，可打印可自测判分',
  ogUrl: 'https://www.util.cn/tools/recite-blank-generator',
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
          name: '古诗文默写挖空',
          url: 'https://www.util.cn/tools/recite-blank-generator',
          applicationCategory: 'EducationApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['随机比例挖空', '每句等距挖空', '易错实词定向挖空', '默写卷打印', '逐空自测判分', '原句对照', '内置示例篇目']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '古诗文默写挖空', item: 'https://www.util.cn/tools/recite-blank-generator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '挖空会破坏段落和换行吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。换行符与标点默认不参与挖空，默写卷保留原文的分行与分段结构，打印版式与原文一致。' }
            },
            {
              '@type': 'Question',
              name: '"易错实词"策略的字表是怎么来的？',
              acceptedAnswer: { '@type': 'Answer', text: '内置约60个中高考必背篇目中的高频易错字，按教材默写丢分统计整理，原文命中表中字即被挖空。' }
            },
            {
              '@type': 'Question',
              name: '生成内容会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。本工具为纯前端本地计算，粘贴的文本与答案只在浏览器内处理，刷新即清空。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'recite-blank-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// === PURE-BEGIN ===
// 高频易错实词表（中高考必背篇目默写常见丢分字）
const WRONG_CHARS = [
  '鹜', '凫', '沧', '萧', '瑟', '樽', '嫠', '蜉', '蝣', '蠡',
  '汀', '渚', '隰', '淇', '湄', '溯', '洄', '雎', '鸠', '葭',
  '曌', '霁', '暝', '笺', '碣', '荇', '蠹', '骥', '枥', '槊',
  '酾', '椽', '燧', '胥', '谪', '庾', '蠲', '邈', '岫', '聒',
  '筇', '鸢', '澹', '岷', '霭', '鹧', '鸪', '荻', '暄', '糁',
  '羸', '殁', '庠', '馔', '饯', '隽', '昀', '燔', '祗', '牍'
]

const isBlankableChar = (ch) => {
  if (ch === '\n' || ch === '\r' || ch === ' ' || ch === '\t' || ch === '\u3000') return false
  return !/[!”#%&’()*+,\-./:;<=>?@[\\\]^_`{|}~。，、；：？！””‘’（）《》〈〉【】〔〕…—～·]/.test(ch)
}

// 确定性哈希随机（同一文本+种子结果稳定，便于打印重出同卷）
const hashRand = (i, seed) => {
  let h = Math.imul(i + seed * 2654435761 + 1, 2654435761)
  h ^= h >>> 13
  h = Math.imul(h, 2246822519)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

// 将文本按挖空标记切分为段：applyBlanks(原文, 策略, 参数[, 种子]) => [{text, blank}]
const applyBlanks = (text, strategy, param, seed = 7) => {
  if (!text) return []
  const chars = Array.from(text)
  const flags = chars.map(() => false)

  if (strategy === 'wrong') {
    chars.forEach((ch, i) => {
      if (WRONG_CHARS.includes(ch)) flags[i] = true
    })
  } else if (strategy === 'ratio') {
    chars.forEach((ch, i) => {
      if (isBlankableChar(ch) && hashRand(i, seed) < param) flags[i] = true
    })
  } else if (strategy === 'interval') {
    // 按句末标点/换行分句，每句对可挖字符等距挖 N 个
    const enders = new Set(['\n', '。', '！', '？', '；', ':', ';'])
    let start = 0
    while (start < chars.length) {
      let end = start
      while (end < chars.length && !enders.has(chars[end])) end += 1
      if (end < chars.length) end += 1 // 含结束符
      const cand = []
      for (let i = start; i < end; i += 1) {
        if (isBlankableChar(chars[i])) cand.push(i)
      }
      const n = Math.min(Math.max(1, param), cand.length)
      for (let j = 0; j < n; j += 1) {
        flags[cand[Math.floor(((j + 0.5) * cand.length) / n)]] = true
      }
      start = end
    }
  }

  // 合并相邻同标记段，换行始终留在非挖空段中
  const segs = []
  chars.forEach((ch, i) => {
    const b = flags[i]
    const last = segs[segs.length - 1]
    if (last && last.blank === b) last.text += ch
    else segs.push({ text: ch, blank: b })
  })
  return segs
}
// === PURE-END ===

// 内置示例篇目（节选）
const SAMPLES = {
  tengwang: '时维九月，序属三秋。潦水尽而寒潭清，烟光凝而暮山紫。俨骖騑于上路，访风景于崇阿。临帝子之长洲，得天人之旧馆。层峦耸翠，上出重霄；飞阁流丹，下临无地。鹤汀凫渚，穷岛屿之萦回；桂殿兰宫，即冈峦之体势。\n落霞与孤鹜齐飞，秋水共长天一色。渔舟唱晚，响穷彭蠡之滨；雁阵惊寒，声断衡阳之浦。',
  chibi: '壬戌之秋，七月既望，苏子与客泛舟游于赤壁之下。清风徐来，水波不兴。举酒属客，诵明月之诗，歌窈窕之章。少焉，月出于东山之上，徘徊于斗牛之间。白露横江，水光接天。纵一苇之所如，凌万顷之茫然。浩浩乎如冯虚御风，而不知其所止；飘飘乎如遗世独立，羽化而登仙。',
  yueyang: '庆历四年春，滕子京谪守巴陵郡。越明年，政通人和，百废具兴。乃重修岳阳楼，增其旧制，刻唐贤今人诗赋于其上。属予作文以记之。\n予观夫巴陵胜状，在洞庭一湖。衔远山，吞长江，浩浩汤汤，横无际涯；朝晖夕阴，气象万千。此则岳阳楼之大观也。'
}
const sampleList = [
  { key: 'tengwang', name: '滕王阁序' },
  { key: 'chibi', name: '赤壁赋' },
  { key: 'yueyang', name: '岳阳楼记' }
]

// 状态
const sourceText = ref('')
const strategy = ref('ratio')
const ratioPercent = ref(30)
const intervalN = ref(5)
const seed = ref(7)
const activeTab = ref('sheet')
const showOriginal = ref(false)
const seoContentVisible = ref(true)
const userAnswers = ref([])
const checked = ref(false)

const strategies = [
  { value: 'ratio', label: '随机比例' },
  { value: 'interval', label: '每句等距' },
  { value: 'wrong', label: '易错实词' }
]

const currentStrategyLabel = computed(() => {
  const hit = strategies.find(s => s.value === strategy.value)
  return hit ? hit.label : ''
})

const segments = computed(() => {
  const param = strategy.value === 'ratio'
    ? Math.min(0.5, Math.max(0.1, ratioPercent.value / 100))
    : intervalN.value
  return applyBlanks(sourceText.value, strategy.value, param, seed.value)
})

const hasText = computed(() => sourceText.value.trim().length > 0)

const blanks = computed(() => segments.value.filter(s => s.blank).map(s => s.text))
const blanksCharCount = computed(() => blanks.value.reduce((a, b) => a + b.length, 0))
const blankableCount = computed(() => {
  let n = 0
  for (const ch of Array.from(sourceText.value)) {
    if (isBlankableChar(ch)) n += 1
  }
  return n
})

// 带空序号的渲染项（默写卷与自测共用）
const renderItems = computed(() => {
  let bi = 0
  return segments.value.map(s => s.blank
    ? { blank: true, text: s.text, bi: bi++ }
    : { blank: false, text: s.text, bi: -1 })
})

const correctCount = computed(() => {
  if (!checked.value) return 0
  return blanks.value.filter((b, i) => (userAnswers.value[i] || '').trim() === b).length
})

const accuracy = computed(() => {
  if (blanks.value.length === 0) return 0
  return Math.round((correctCount.value / blanks.value.length) * 100)
})

// 挖空结果变化时重置自测输入（不触碰任何浏览器 API）
watch(blanks, () => {
  userAnswers.value = blanks.value.map(() => '')
  checked.value = false
})

const setAnswer = (bi, val) => {
  const next = userAnswers.value.slice()
  next[bi] = val
  userAnswers.value = next
}

const checkAnswers = () => { checked.value = true }

const fillAnswers = () => {
  userAnswers.value = blanks.value.slice()
  checked.value = true
}

const resetQuiz = () => {
  userAnswers.value = blanks.value.map(() => '')
  checked.value = false
}

const regenerate = () => { seed.value += 1 }

const clearAll = () => {
  sourceText.value = ''
  showOriginal.value = false
}

const loadSample = (key) => {
  sourceText.value = SAMPLES[key] || ''
  showOriginal.value = false
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const printSheet = () => {
  activeTab.value = 'sheet'
  showOriginal.value = false
  window.print()
}
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .recite-sheet {
    font-size: 15pt;
  }
}
</style>
