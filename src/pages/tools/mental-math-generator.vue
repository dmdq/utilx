<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">口算题批量生成 - 小学数学口算题卡打印</h1>
      <p class="text-muted-foreground">
        免费在线口算题生成器，支持加、减、乘、除与带余除法五种题型，自定义数值范围与题量，可选括号两步运算，一键生成 A4 双栏口算题卡并附答案页。减法保证结果非负、除法保证整除，浏览器直接打印，纯本地生成。
      </p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 mb-8">
      <!-- 控制区 -->
      <div class="lg:col-span-1 no-print">
        <div class="bg-card border border-border rounded-lg p-5 space-y-5 lg:sticky lg:top-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">年级预设（一键配置）</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="preset in gradePresets"
                :key="preset.key"
                @click="applyPreset(preset)"
                class="py-2 px-1 rounded-lg text-xs font-medium transition bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                {{ preset.label }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">一年级：10 内加减；二年级：100 内加减乘；三年级：乘除</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">题型（可多选）</label>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="t in typeDefs"
                :key="t.key"
                class="flex items-center gap-2 text-sm text-foreground cursor-pointer"
              >
                <input
                  v-model="selectedTypes[t.key]"
                  type="checkbox"
                  class="w-4 h-4 rounded border-border accent-primary"
                >
                {{ t.label }}
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">数值范围</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                v-for="r in rangeOptions"
                :key="r"
                @click="rangeValue = r"
                :class="[
                  'py-2 rounded-lg text-sm font-medium transition',
                  rangeValue === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ r }} 内
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">题数</label>
            <input
              v-model.number="questionCount"
              type="number"
              min="5"
              max="200"
              step="5"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="twoStepEnabled"
              type="checkbox"
              id="twoStep"
              class="w-4 h-4 rounded border-border accent-primary"
            >
            <label for="twoStep" class="text-sm text-foreground">含括号两步运算（约 1/3 题量）</label>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="showAnswers"
              type="checkbox"
              id="showAnswers"
              class="w-4 h-4 rounded border-border accent-primary"
            >
            <label for="showAnswers" class="text-sm text-foreground">附带答案页</label>
          </div>

          <div class="flex gap-2 pt-1">
            <button
              @click="regenerate"
              class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition text-sm font-medium"
            >
              <RefreshCw class="w-4 h-4" /> 生成新题
            </button>
            <button
              @click="printSheet"
              class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition text-sm font-medium"
            >
              <Printer class="w-4 h-4" /> 打印
            </button>
          </div>
          <p v-if="activeTypes.length === 0" class="text-xs text-red-500">
            请至少勾选一种题型
          </p>
        </div>
      </div>

      <!-- 题卡预览（A4 双栏） -->
      <div class="lg:col-span-2">
        <div class="bg-white text-black rounded-lg border border-border shadow-sm p-6 sm:p-10 min-h-[600px]">
          <div class="text-center mb-6">
            <p class="text-lg font-bold">{{ sheetTitle }}</p>
            <p class="text-xs text-gray-500 mt-1">姓名：________　日期：________　用时：______ 分　对：____ 题</p>
          </div>

          <div v-if="questions.length > 0" class="grid grid-cols-2 gap-x-8 gap-y-5">
            <div
              v-for="(q, i) in questions"
              :key="i"
              class="flex items-baseline text-[15px] leading-6"
            >
              <span class="w-8 text-right mr-2 text-gray-500">{{ i + 1 }}.</span>
              <span class="font-mono tracking-wide">{{ q.text }}</span>
              <span class="flex-1 ml-2 border-b border-gray-400 min-w-[48px]"></span>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 py-20">
            请在左侧勾选题型后点击「生成新题」
          </div>

          <!-- 答案页 -->
          <div v-if="showAnswers && questions.length > 0" class="mt-10 pt-6 border-t-2 border-dashed border-gray-300">
            <p class="text-center text-sm font-bold mb-4">参考答案</p>
            <div class="grid grid-cols-2 gap-x-8 gap-y-2">
              <div
                v-for="(q, i) in questions"
                :key="'a' + i"
                class="flex items-baseline text-sm"
              >
                <span class="w-8 text-right mr-2 text-gray-500">{{ i + 1 }}.</span>
                <span class="text-gray-400">{{ q.text }}</span>
                <span class="ml-1 font-semibold">{{ q.answer }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg no-print">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronUp v-if="isSeoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是口算题批量生成工具？
        </h2>
        <p class="text-muted-foreground mb-4">
          口算题批量生成器是一款面向小学家长和数学老师的出题工具：选择题型（加、减、乘、除、带余除法）、数值范围与题量，
          一键生成一页 A4 双栏排版的口算题卡，可附答案页，直接用浏览器打印。每天 50 题限时口算，是训练计算速度与准确率的经典做法。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">出题规则说明</h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>加法</strong>：两个操作数都在设定范围内，且两数之和不超过范围上限（如 20 内加法不会出现 15+9）。</li>
          <li><strong>减法</strong>：保证结果非负，不会出现「3 − 7」这类小学低年级尚未学习的负数。</li>
          <li><strong>除法</strong>：先生成除数与商、再反推被除数，保证整除无余数，且除数不为 0。</li>
          <li><strong>带余除法</strong>：形如 a ÷ b = c……r，保证余数 r 小于除数 b 且被除数不超范围。</li>
          <li><strong>括号两步运算</strong>：勾选后约 1/3 的题目变为含括号的两步加减混合运算，结果同样保证非负。</li>
        </ul>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">如何打印口算题卡</h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>点选年级预设或手动配置题型、范围、题数</li>
          <li>点击「生成新题」，右侧即为 A4 双栏排版预览</li>
          <li>需要答案时勾选「附带答案页」，答案会附在题卡末尾</li>
          <li>点击「打印」，打印时自动隐藏控制区，只输出题卡内容</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-3">常见问题 (FAQ)</h3>
        <div class="space-y-4">
          <div>
            <h4 class="text-lg font-semibold text-foreground">每个年级该练什么范围？</h4>
            <p class="text-muted-foreground mt-1">
              一年级练 10 内（后学期可到 20 内）加减；二年级练 100 内加减乘（表内乘法）；三年级重点练乘除法与有余数除法。
              本工具的年级预设即按此配置，也可根据孩子实际水平手动微调范围与题型。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">为什么除法题都是整除的？</h4>
            <p class="text-muted-foreground mt-1">
              口算训练目标是熟练乘法口诀与逆运算，整除设计保证每道题都有整数答案，符合小学低年级学习进度。
              需要练习有余数除法时，单独勾选「带余除法」题型即可，其生成规则保证余数一定小于除数。
            </p>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-foreground">打印出来格式乱怎么办？</h4>
            <p class="text-muted-foreground mt-1">
              打印时请在系统打印对话框中选择 A4 纸、纵向、默认边距，并关闭「打印背景图形」以外的缩放选项（缩放选 100%）。
              题卡为双栏排版，50 题正好一页；题量超过 80 建议分两次打印或缩放到 90%。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mental-math-generator'" :category="'calculate'" class="no-print" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Printer, RefreshCw, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '口算题批量生成 - 小学数学口算题卡打印',
  description: '在线口算题生成器，支持加减乘除与带余除法五种题型、数值范围与题量自定义、括号两步运算，一键生成 A4 双栏口算题卡并附答案页，浏览器直接打印，减法非负、除法整除，纯本地生成',
  keywords: '口算题生成, 口算题卡打印, 小学口算, 数学练习题, 口算每日一练, 带余除法练习',
  author: 'Util工具箱',
  ogTitle: '口算题批量生成 - 有条工具',
  ogDescription: '参数化生成小学口算题卡，A4 双栏排版一键打印',
  ogUrl: 'https://www.util.cn/tools/mental-math-generator',
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
          name: '口算题批量生成',
          url: 'https://www.util.cn/tools/mental-math-generator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五种题型', '数值范围题量自定义', 'A4双栏打印排版', '附答案页', '年级一键预设', '括号两步运算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '口算题批量生成', item: 'https://www.util.cn/tools/mental-math-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '每个年级该练什么范围？',
              acceptedAnswer: { '@type': 'Answer', text: '一年级练 10 内加减，二年级练 100 内加减乘，三年级重点练乘除与有余数除法，可用年级预设一键配置。' }
            },
            {
              '@type': 'Question',
              name: '为什么除法题都是整除的？',
              acceptedAnswer: { '@type': 'Answer', text: '生成时先取除数与商再反推被除数，保证整除且除数不为 0；有余数训练请单独勾选带余除法题型。' }
            },
            {
              '@type': 'Question',
              name: '打印出来格式乱怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '选择 A4 纵向、默认边距、缩放 100% 即可；题卡为双栏排版，打印时自动隐藏控制区。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'mental-math-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 题目生成器（纯函数，仅在被点击回调/onMounted 中调用，内部使用 Math.random） ----------
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// 单步题目：add 两操作数∈[0,range]且和≤range；sub 结果非负；mul 积≤range；div 整除且除数≠0；remainder 余数<除数
const genQuestion = (type, range) => {
  const r = Math.max(2, range)
  if (type === 'add') {
    const a = randInt(0, r)
    const b = randInt(0, r - a)
    return { text: `${a} + ${b} =`, answer: String(a + b) }
  }
  if (type === 'sub') {
    const a = randInt(0, r)
    const b = randInt(0, a)
    return { text: `${a} − ${b} =`, answer: String(a - b) }
  }
  if (type === 'mul') {
    const a = randInt(0, r)
    const b = a === 0 ? randInt(0, r) : randInt(0, Math.floor(r / a))
    return { text: `${a} × ${b} =`, answer: String(a * b) }
  }
  if (type === 'div') {
    const divisor = randInt(1, r)
    const quotient = randInt(0, Math.floor(r / divisor))
    return { text: `${divisor * quotient} ÷ ${divisor} =`, answer: String(quotient) }
  }
  // remainder：a ÷ b = c……r（0 ≤ r < b，且 a ≤ range）
  const divisor = randInt(1, r)
  const quotient = randInt(0, Math.floor(r / divisor))
  const room = r - divisor * quotient
  const maxRem = Math.min(divisor - 1, room)
  const rem = maxRem >= 1 ? randInt(1, maxRem) : 0
  return { text: `${divisor * quotient + rem} ÷ ${divisor} =`, answer: `${quotient} 余 ${rem}` }
}

// 括号两步运算（加减混合，结果非负）
const genTwoStep = (range) => {
  const r = Math.max(2, range)
  const shape = randInt(0, 2)
  if (shape === 0) {
    const a = randInt(0, r)
    const b = randInt(0, r - a)
    const c = randInt(0, a + b)
    return { text: `(${a} + ${b}) − ${c} =`, answer: String(a + b - c) }
  }
  if (shape === 1) {
    const a = randInt(0, r)
    const b = randInt(0, a)
    const c = randInt(0, r)
    return { text: `(${a} − ${b}) + ${c} =`, answer: String(a - b + c) }
  }
  const b = randInt(0, r)
  const c = randInt(0, r - b)
  const a = randInt(b + c, r)
  return { text: `${a} − (${b} + ${c}) =`, answer: String(a - b - c) }
}

// ---------- 状态 ----------
const typeDefs = [
  { key: 'add', label: '加法' },
  { key: 'sub', label: '减法' },
  { key: 'mul', label: '乘法' },
  { key: 'div', label: '除法' },
  { key: 'remainder', label: '带余除法' }
]

const rangeOptions = [10, 20, 100, 1000]

const gradePresets = [
  { key: 'g1', label: '一年级', types: ['add', 'sub'], range: 10, twoStep: false },
  { key: 'g2', label: '二年级', types: ['add', 'sub', 'mul'], range: 100, twoStep: false },
  { key: 'g3', label: '三年级', types: ['mul', 'div'], range: 100, twoStep: false }
]

const selectedTypes = ref({ add: true, sub: true, mul: false, div: false, remainder: false })
const rangeValue = ref(100)
const questionCount = ref(50)
const twoStepEnabled = ref(false)
const showAnswers = ref(false)
const questions = ref([])

const isSeoContentVisible = ref(true)
const toggleSeoContent = () => { isSeoContentVisible.value = !isSeoContentVisible.value }

const activeTypes = computed(() => typeDefs.filter(t => selectedTypes.value[t.key]).map(t => t.key))

const sheetTitle = computed(() => {
  const range = rangeValue.value
  const types = activeTypes.value.map(k => typeDefs.find(t => t.key === k).label).join('、')
  return `口算练习（${types} · ${range} 内 · 共 ${questions.value.length} 题）`
})

// 应用年级预设
const applyPreset = (preset) => {
  for (const t of typeDefs) {
    selectedTypes.value[t.key] = preset.types.includes(t.key)
  }
  rangeValue.value = preset.range
  twoStepEnabled.value = preset.twoStep
}

// 生成一批题目（Math.random 仅在事件回调 / onMounted 中触发）
const regenerate = () => {
  const types = activeTypes.value
  if (types.length === 0) {
    questions.value = []
    return
  }
  const range = Number(rangeValue.value) || 100
  const count = Math.max(1, Math.min(200, Math.floor(Number(questionCount.value) || 50)))
  const seen = new Set()
  const list = []
  for (let i = 0; i < count; i++) {
    const useTwoStep = twoStepEnabled.value && i % 3 === 2
    let q = null
    // 尝试多次以降低重复率
    for (let attempt = 0; attempt < 15; attempt++) {
      const candidate = useTwoStep ? genTwoStep(range) : genQuestion(types[i % types.length], range)
      if (!seen.has(candidate.text)) {
        q = candidate
        break
      }
    }
    if (!q) {
      q = useTwoStep ? genTwoStep(range) : genQuestion(types[i % types.length], range)
    }
    seen.add(q.text)
    list.push(q)
  }
  questions.value = list
}

const printSheet = () => { window.print() }

onMounted(() => {
  regenerate()
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
