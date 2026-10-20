<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ear class="h-6 h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">英语听写挖空生成</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴单词表或课文按规则挖空生成听写稿，A4 打印排版，家长教师两用</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        免费在线英语听写稿生成器：粘贴单词表（支持"apple 苹果"或纯"apple"两种行格式），选择听写稿、中译英或填空式三种模式，一键生成 A4 双栏排版听写卷，可附答案页并直接打印。全部在浏览器本地完成，适合家庭听写与课堂听写两用。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 输入与设置区 -->
      <div class="lg:col-span-1 bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <ListChecks class="w-5 h-5 mr-2 text-primary" /> 单词表与排版
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">粘贴单词表（每行一个词）</label>
          <textarea
            v-model="rawInput"
            rows="10"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y font-mono"
            placeholder="apple 苹果&#10;banana 香蕉&#10;orange&#10;…（空格分隔中文释义可选）"
          ></textarea>
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              @click="loadSample"
              class="px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >填入示例</button>
            <button
              @click="clearAll"
              class="px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >清空</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">听写模式</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="m in modes"
              :key="m.value"
              @click="mode = m.value"
              :class="[
                'py-2 rounded-lg text-xs font-medium transition-all',
                mode === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              {{ m.label }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">{{ modeHint }}</p>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="twoCols" type="checkbox" class="w-4 h-4 rounded border-border" />
            A4 双栏排版（省纸）
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="showHint" type="checkbox" class="w-4 h-4 rounded border-border" />
            行内附中文提示
          </label>
          <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input v-model="showAnswerPage" type="checkbox" class="w-4 h-4 rounded border-border" />
            附答案页（另起一页）
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">下划线长度</label>
            <input
              v-model.number="lineLen"
              type="number"
              min="6"
              max="40"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">起始序号</label>
            <input
              v-model.number="startIndex"
              type="number"
              min="1"
              max="999"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <button
          @click="printSheet"
          class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
        >
          <Printer class="w-4 h-4" /> 打印听写卷（{{ words.length }} 词）
        </button>
      </div>

      <!-- A4 预览输出区 -->
      <div class="lg:col-span-2">
        <div class="flex items-center justify-between mb-3 no-print">
          <label class="text-sm font-medium text-foreground">A4 预览</label>
          <span class="text-sm text-muted-foreground">共 {{ words.length }} 词 · 模式：{{ currentModeLabel }}</span>
        </div>

        <div class="dictation-sheet bg-white dark:bg-card border border-border rounded-lg p-8 min-h-[500px] shadow-sm">
          <h2 class="text-center text-xl font-bold text-foreground mb-1">英语听写卷</h2>
          <p class="text-center text-xs text-muted-foreground mb-6">
            姓名：________　日期：________　共 {{ words.length }} 词
          </p>

          <div v-if="words.length > 0" :class="twoCols ? 'columns-2 gap-10' : ''">
            <div
              v-for="(row, i) in sheetRows"
              :key="i"
              class="flex items-baseline gap-2 py-[11px] border-b border-dashed border-gray-300 dark:border-border break-inside-avoid"
            >
              <span class="text-sm text-muted-foreground w-8 flex-shrink-0">{{ row.no }}.</span>
              <span class="text-base font-mono text-foreground tracking-wide">{{ row.writeArea }}</span>
              <span v-if="row.hint" class="text-sm text-muted-foreground ml-2">{{ row.hint }}</span>
            </div>
          </div>
          <div v-else class="p-10 text-center text-muted-foreground">
            请先在左侧粘贴单词表，或点击"填入示例"
          </div>

          <!-- 答案页 -->
          <div v-if="showAnswerPage && words.length > 0" class="mt-8 pt-6 border-t-2 border-foreground break-before-page">
            <h3 class="text-center text-lg font-bold text-foreground mb-4">参考答案</h3>
            <div :class="twoCols ? 'columns-2 gap-10' : ''">
              <div
                v-for="(row, i) in answerRows"
                :key="i"
                class="flex items-baseline gap-2 py-1.5 break-inside-avoid"
              >
                <span class="text-sm text-muted-foreground w-8 flex-shrink-0">{{ row.no }}.</span>
                <span class="text-sm font-mono font-semibold text-foreground">{{ row.word }}</span>
                <span v-if="row.meaning" class="text-sm text-muted-foreground">{{ row.meaning }}</span>
              </div>
            </div>
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
          <span class="text-primary mr-2">#</span>英语听写稿怎么生成
        </h2>
        <p class="text-muted-foreground mb-4 leading-relaxed">
          把单词表按"一行一个词"粘贴进来，两种写法都自动识别：带释义的"apple 苹果"（空格分隔）和纯单词"apple"。选好评练模式后，右侧实时生成 A4 版式的听写稿，勾选双栏可在一页内排下约 60 个词，点"打印听写卷"即可输出纸质卷，答案页可另起一页附在后面，方便家长报听写、教师出卷。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">三种模式的区别</h3>
        <ul class="list-disc list-inside space-y-1.5 text-muted-foreground mb-4">
          <li><strong class="text-foreground">听写稿（挖英文留中文）</strong>：每行一条下划线写英文，右侧附中文提示，适合标准报听写。</li>
          <li><strong class="text-foreground">中译英（挖中文留英文）</strong>：每行印出英文单词，下划线处写中文释义，适合词汇默写检查。</li>
          <li><strong class="text-foreground">填空式</strong>：单词只给出首字母，其余挖空，适合拼写薄弱阶段的强化练习。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">打印与排版建议</h3>
        <p class="text-muted-foreground leading-relaxed mb-4">
          预览即所见即所得：下划线长度、起始序号均可调；打印时在浏览器对话框中选择 A4 纸张并开启"背景图形"可保留虚线分隔行。控制区与网页说明部分在打印时自动隐藏，只输出听写卷与答案页本身。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">单词带词组或例句怎么办？</h3>
            <p class="text-muted-foreground mt-1">
              本工具按"每行一个词（可附中文释义）"处理，空格分隔后自动以第一个中文汉字为界拆分英文与释义，如 "give up 放弃" 会被识别为词组 give up 加释义"放弃"；含句子的复杂听写可分多行录入。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">答案页的音标能显示吗？</h3>
            <p class="text-muted-foreground mt-1">
              答案页默认给出"序号 + 单词 + 中文释义"；音标需要离线词典数据，为保持纯本地轻量计算本工具不内置词典，音标可按需省略或另行标注。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">单词表数据安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              安全。页面所有解析与排版均在浏览器本地完成，不发送任何网络请求，刷新页面即全部清空，可放心处理未公开的考试词汇表。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools currentToolId="dictation-generator" category="text" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Ear, ListChecks, Printer, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO配置
useSeoMeta({
  title: '英语听写挖空生成 - 听写稿/中译英/填空式A4打印 | Util工具箱',
  description: '粘贴单词表或课文按规则挖空生成听写稿，A4打印排版，家长教师两用，支持听写稿、中译英、填空式三种模式与答案页输出，纯本地计算',
  keywords: '英语听写,听写稿生成,单词表打印,中译英默写,填空式听写,A4听写卷,英语单词挖空',
  author: 'Util工具箱',
  ogTitle: '英语听写挖空生成 - 有条工具',
  ogDescription: '粘贴单词表一键生成A4双栏听写稿，三种挖空模式，可附答案页直接打印',
  ogUrl: 'https://www.util.cn/tools/dictation-generator',
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
          name: '英语听写挖空生成',
          url: 'https://www.util.cn/tools/dictation-generator',
          applicationCategory: 'EducationApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['单词表自动解析', '听写稿模式', '中译英模式', '填空式模式', 'A4双栏排版', '答案页另起一页', '直接打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '英语听写挖空生成', item: 'https://www.util.cn/tools/dictation-generator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '单词带词组或例句怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '按"每行一个词（可附中文释义）"处理，自动以第一个中文汉字为界拆分英文与释义，如 "give up 放弃" 可被正确识别。' }
            },
            {
              '@type': 'Question',
              name: '答案页的音标能显示吗？',
              acceptedAnswer: { '@type': 'Answer', text: '答案页默认给出序号、单词与中文释义；为保持纯本地轻量计算不内置词典，音标可省略或另行标注。' }
            },
            {
              '@type': 'Question',
              name: '单词表数据安全吗？',
              acceptedAnswer: { '@type': 'Answer', text: '所有解析与排版均在浏览器本地完成，不发送网络请求，刷新页面即清空。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'dictation-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// === PURE-BEGIN ===
// 解析单词表：每行一个词；以行内第一个中文汉字为界拆分英文与释义
// parseWordList('apple 苹果\nbanana') => [{word:'apple',meaning:'苹果'},{word:'banana',meaning:''}]
const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAFF]/
const parseWordList = (input) => {
  if (!input) return []
  const lines = String(input).split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
  return lines.map((line) => {
    const chars = Array.from(line)
    let cjkIdx = -1
    for (let i = 0; i < chars.length; i += 1) {
      if (CJK_RE.test(chars[i])) { cjkIdx = i; break }
    }
    if (cjkIdx > 0) {
      return {
        word: line.slice(0, cjkIdx).trim(),
        meaning: chars.slice(cjkIdx).join('').trim()
      }
    }
    return { word: line, meaning: '' }
  })
}
// === PURE-END ===

const SAMPLE_TEXT = 'apple 苹果\nbanana 香蕉\norange 橙子\nwatermelon 西瓜\ngrape 葡萄\npineapple 菠萝\nstrawberry 草莓\nblueberry 蓝莓\npeach 桃子\nlemon 柠檬\nmango 芒果\ncherry 樱桃'

// 状态
const rawInput = ref('')
const mode = ref('listen')
const twoCols = ref(true)
const showHint = ref(true)
const showAnswerPage = ref(true)
const lineLen = ref(16)
const startIndex = ref(1)
const seoContentVisible = ref(true)

const modes = [
  { value: 'listen', label: '听写稿' },
  { value: 'translate', label: '中译英' },
  { value: 'fill', label: '填空式' }
]

const modeHint = computed(() => {
  if (mode.value === 'listen') return '挖英文留中文：逐词一行下划线写英文，右侧可附中文提示，标准报听写格式。'
  if (mode.value === 'translate') return '挖中文留英文：印出英文单词，在下划线处写中文释义，适合词汇默写。'
  return '填空式：单词仅给出首字母、其余挖空，强化拼写记忆。'
})

const currentModeLabel = computed(() => {
  const hit = modes.find(m => m.value === mode.value)
  return hit ? hit.label : ''
})

const words = computed(() => parseWordList(rawInput.value))

const underLine = computed(() => '_'.repeat(Math.min(40, Math.max(6, lineLen.value || 16))))

const sheetRows = computed(() => {
  const base = Math.max(1, startIndex.value || 1)
  return words.value.map((w, i) => {
    let writeArea = underLine.value
    let hint = ''
    if (mode.value === 'listen') {
      writeArea = underLine.value
      hint = showHint.value ? (w.meaning || '') : ''
    } else if (mode.value === 'translate') {
      writeArea = `${w.word}  ${underLine.value}`
      hint = ''
    } else {
      const first = w.word.charAt(0)
      writeArea = `${first}${'_'.repeat(Math.max(4, w.word.length - 1))}`
      hint = showHint.value ? (w.meaning || '') : ''
    }
    return { no: base + i, writeArea, hint }
  })
})

const answerRows = computed(() => {
  const base = Math.max(1, startIndex.value || 1)
  return words.value.map((w, i) => ({ no: base + i, word: w.word, meaning: w.meaning }))
})

const loadSample = () => { rawInput.value = SAMPLE_TEXT }

const clearAll = () => { rawInput.value = '' }

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const printSheet = () => { window.print() }
</script>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  .dictation-sheet {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
}
</style>
