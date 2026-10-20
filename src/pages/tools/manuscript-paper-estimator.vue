<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Grid3x3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">作文稿纸方格估算</h1>
          <p class="text-sm text-muted-foreground mt-1">作文按稿纸规格（300/400格）折算页数与剩余格数，达标状态一目了然</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        免费在线作文稿纸估算器：粘贴作文正文或手动输入字数，按 400 格（20×20）、300 格（20×15）、484 格（22×22）或自定义行列规格，自动折算有效字数、所需稿纸页数与剩余格数，对照中高考 800 字目标给出达标/接近/还差 N 字徽章，并可打印一页空白方格稿纸直接誊写。全部计算在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 输入区 -->
      <div class="lg:col-span-1 bg-card border border-border rounded-lg p-6 space-y-4 no-print">
        <h2 class="text-lg font-semibold flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 作文内容与稿纸规格
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">字数来源</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="inputMode = 'text'"
              :class="[
                'py-2 rounded-lg text-xs font-medium transition-all',
                inputMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >粘贴作文正文</button>
            <button
              @click="inputMode = 'manual'"
              :class="[
                'py-2 rounded-lg text-xs font-medium transition-all',
                inputMode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >手动输入字数</button>
          </div>
        </div>

        <div v-if="inputMode === 'text'">
          <label class="block text-sm font-medium text-foreground mb-2">作文正文</label>
          <textarea
            v-model="essayText"
            rows="8"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴作文正文，中文按字符、英文按单词计数……"
          ></textarea>
          <button
            @click="loadSample"
            class="mt-2 px-2.5 py-1.5 rounded-lg text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition"
          >填入示例</button>
        </div>

        <div v-else>
          <label class="block text-sm font-medium text-foreground mb-2">字数（含或不含标点以下方开关为准）</label>
          <input
            v-model.number="manualCount"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">稿纸规格</label>
          <select
            v-model="paperSpec"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="400">400 格 / 页（20 × 20）</option>
            <option value="300">300 格 / 页（20 × 15）</option>
            <option value="484">484 格 / 页（22 × 22）</option>
            <option value="custom">自定义行列</option>
          </select>
          <div v-if="paperSpec === 'custom'" class="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">每行格数</label>
              <input
                v-model.number="customCols"
                type="number"
                min="1"
                max="40"
                step="1"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">每页行数</label>
              <input
                v-model.number="customRows"
                type="number"
                min="1"
                max="40"
                step="1"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">目标字数（0 = 不判定）</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="t in targetPresets"
              :key="t"
              @click="targetCount = t"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                targetCount === t ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >{{ t }} 字</button>
          </div>
          <input
            v-model.number="targetCount"
            type="number"
            min="0"
            step="50"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input v-model="countPunctuation" type="checkbox" class="w-4 h-4 rounded border-border" />
          标点占格计入字数（考试惯例：计入）
        </label>
        <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer no-print">
          <input v-model="markFilled" type="checkbox" class="w-4 h-4 rounded border-border" />
          方格纸预览中标记已填字
        </label>

        <button
          @click="printPaper"
          class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
        >
          <Printer class="w-4 h-4" /> 打印方格稿纸
        </button>
      </div>

      <!-- 结果与方格纸预览 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">有效字数</p>
            <p class="text-2xl font-bold text-foreground">{{ effectiveCount }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">每页格数</p>
            <p class="text-2xl font-bold text-foreground">{{ cellsPerPage }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">所需页数</p>
            <p class="text-2xl font-bold text-primary">{{ pagesNeeded }}</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">最后一页剩格</p>
            <p class="text-2xl font-bold text-foreground">{{ remainingCells }}</p>
          </div>
        </div>

        <div v-if="targetCount > 0" class="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-3 no-print">
          <div class="flex items-center gap-3">
            <span
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-bold',
                statusInfo.tone === 'ok' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  : statusInfo.tone === 'near' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              ]"
            >{{ statusInfo.badge }}</span>
            <span class="text-sm text-muted-foreground">目标 {{ targetCount }} 字 · 当前 {{ effectiveCount }} 字</span>
          </div>
          <span class="text-sm font-medium text-foreground">{{ statusInfo.detail }}</span>
        </div>

        <!-- 方格纸预览（可打印） -->
        <div class="paper-sheet bg-white dark:bg-card border border-border rounded-lg p-5">
          <div class="flex items-center justify-between mb-3 no-print">
            <h2 class="text-lg font-semibold text-foreground">稿纸预览 · 第 1/{{ Math.max(pagesNeeded, 1) }} 页</h2>
            <span class="text-sm text-muted-foreground">{{ gridRows }} 行 × {{ gridCols }} 列</span>
          </div>
          <p class="text-center text-base font-semibold text-foreground mb-3">
            {{ markFilled ? '作文方格纸（前 ' + Math.min(effectiveCount, cellsPerPage) + ' 格已填）' : '空白方格稿纸' }}
          </p>
          <div
            class="paper-grid mx-auto"
            :style="{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, maxWidth: (gridCols * 22) + 'px' }"
          >
            <div
              v-for="i in cellsPerPage"
              :key="i"
              :class="[
                'paper-cell',
                markFilled && i <= Math.min(effectiveCount, cellsPerPage) ? 'paper-cell-filled' : ''
              ]"
            >
              <span v-if="markFilled && i <= Math.min(effectiveCount, cellsPerPage)" class="cell-char">{{ gridChars[i - 1] }}</span>
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
          <span class="text-primary mr-2">#</span>稿纸字数怎么数、页数怎么估
        </h2>
        <p class="text-muted-foreground mb-4 leading-relaxed">
          考场作文的字数统计惯例是：中文每个汉字占一格，标点符号也各占一格（逗、句、问号均计），英文与数字通常按单词计格。本工具按同一口径计算"有效字数"，再用"所需页数 = 字数 ÷ 每页格数向上取整"折算稿纸用量，并给出最后一页的剩余格数，方便预判作文写在第几页第几格收尾。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见稿纸规格</h3>
        <ul class="list-disc list-inside space-y-1.5 text-muted-foreground mb-4">
          <li><strong class="text-foreground">400 格（20 × 20）</strong>：中高考标准作文稿纸，800 字要求即两页。</li>
          <li><strong class="text-foreground">300 格（20 × 15）</strong>：小学与部分模拟考常用规格。</li>
          <li><strong class="text-foreground">484 格（22 × 22）</strong>：部分竞赛与信纸式稿纸。</li>
          <li>行列均可自定义，适配学校印制的特殊规格。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">达标判定口径</h3>
        <p class="text-muted-foreground leading-relaxed mb-4">
          设定目标字数（如 800）后：达到或超过目标显示"达标"；差距不足 50 字显示"接近"（同时标注还差字数，建议补一段点题段）；差距达到或超过 50 字显示"还差 N 字"。判定基于含标点的有效字数，与考场"标点计入字数"的惯例一致，可关闭标点开关另行核对。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4">
          <span class="text-primary mr-2">#</span>常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">标点真的算字数吗？</h3>
            <p class="text-muted-foreground mt-1">
              在中高考作文阅卷惯例中，标点符号各占一格并计入总字数，段末标点写在格内。本工具默认开启"标点占格计入"，如需按纯汉字口径统计，关闭开关即可对比两种结果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">能打印空白稿纸吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。关闭"方格纸预览中标记已填字"开关后点击"打印方格稿纸"，即输出一页按所选规格排版的空白方格纸，行×列与真实稿纸一致，可直接用于誊写练习；打印时网页控制区会自动隐藏。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">英文作文也适用吗？</h3>
            <p class="text-muted-foreground mt-1">
              适用。英文按单词计数（连续字母为一个词），数字串按一个词计，适合中英混排或英文答题卡字数核对；纯英文稿纸场景可关闭标点开关避免符号干扰。
            </p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools currentToolId="manuscript-paper-estimator" category="text" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Grid3x3, FileText, Printer, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO配置
useSeoMeta({
  title: '作文稿纸方格估算 - 400格/300格页数与剩余格计算 | Util工具箱',
  description: '作文按稿纸规格（300/400格）折算页数与剩余格数，达标状态一目了然，支持有效字数统计、目标字数判定与空白稿纸打印，纯本地计算',
  keywords: '作文稿纸,字数统计,400格稿纸,300格稿纸,稿纸页数,作文达标,中高考作文字数,方格纸打印',
  author: 'Util工具箱',
  ogTitle: '作文稿纸方格估算 - 有条工具',
  ogDescription: '粘贴作文自动统计有效字数，按稿纸规格折算页数与剩余格，达标状态一目了然',
  ogUrl: 'https://www.util.cn/tools/manuscript-paper-estimator',
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
          name: '作文稿纸方格估算',
          url: 'https://www.util.cn/tools/manuscript-paper-estimator',
          applicationCategory: 'EducationApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['有效字数统计', '标点占格开关', '400/300/484格规格', '自定义行列', '所需页数折算', '剩余格计算', '达标状态判定', '空白稿纸打印']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '作文稿纸方格估算', item: 'https://www.util.cn/tools/manuscript-paper-estimator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '标点真的算字数吗？',
              acceptedAnswer: { '@type': 'Answer', text: '中高考阅卷惯例中标点各占一格并计入总字数，本工具默认开启标点计入开关，也可关闭后按纯汉字口径核对。' }
            },
            {
              '@type': 'Question',
              name: '能打印空白稿纸吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以，关闭填字标记后点击打印，即输出按所选规格（如20×20）排版的一页空白方格稿纸。' }
            },
            {
              '@type': 'Question',
              name: '英文作文也适用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '适用。英文按单词计数、数字串按一个词计，适合中英混排或英文答题卡的字数核对。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'manuscript-paper-estimator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// === PURE-BEGIN ===
const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uF900-\uFAFF]/
const PUNCT_RE = /[\p{P}]/u

// 有效字数：中文按字符（每字 1）、英文/数字按词（连续串 1）、标点按开关每符 1，空白不计
// countChars('这是一段八十字的中文文本测试', true) => 14
const countChars = (text, includePunct) => {
  if (!text) return 0
  const chars = Array.from(String(text))
  let n = 0
  let i = 0
  while (i < chars.length) {
    const ch = chars[i]
    if (/\s/.test(ch)) { i += 1; continue }
    if (CJK_RE.test(ch)) { n += 1; i += 1; continue }
    if (/[A-Za-z]/.test(ch)) {
      while (i < chars.length && /[A-Za-z]/.test(chars[i])) i += 1
      n += 1
      continue
    }
    if (/[0-9]/.test(ch)) {
      while (i < chars.length && /[0-9]/.test(chars[i])) i += 1
      n += 1
      continue
    }
    if (PUNCT_RE.test(ch)) {
      if (includePunct) n += 1
      i += 1
      continue
    }
    i += 1
  }
  return n
}

// 所需页数 = ceil(字数 / 每页格数)
// pagesFor(760, 400) => 2
const pagesFor = (count, cellsPerPage) => {
  if (count <= 0 || cellsPerPage <= 0) return 0
  return Math.ceil(count / cellsPerPage)
}

// 达标判定：>=目标为 ok；差距<50 为 near；否则 short（均为"还差 N 字"口径）
// statusFor(760, 800) => { state:'near', gap:40 }
const statusFor = (count, target) => {
  if (target <= 0) return { state: 'none', gap: 0 }
  if (count >= target) return { state: 'ok', gap: 0 }
  const gap = target - count
  return { state: gap < 50 ? 'near' : 'short', gap }
}
// === PURE-END ===

const SAMPLE_ESSAY = '成长，往往发生在不知不觉之间。记得那次运动会，我报名了三千米长跑。发令枪响后，人群如潮水般涌出，我压着节奏跑在第二集团。第二圈时双腿开始发沉，喉咙像灌了沙子，"放弃吧"的念头一遍遍冒出来。可当我听见跑道边同学嘶哑的加油声，咬咬牙又撑过了一个弯道。冲线的那一刻我并不是第一名，但全班都为完赛的我鼓掌。原来坚持本身，就是成长发给我们的奖状。从那以后，每当我想退缩，就会想起那个弯道——再撑一撑，前方自有掌声。';

const SPEC_PRESETS = {
  '400': { cols: 20, rows: 20 },
  '300': { cols: 20, rows: 15 },
  '484': { cols: 22, rows: 22 }
}

// 状态
const inputMode = ref('text')
const essayText = ref('')
const manualCount = ref(0)
const paperSpec = ref('400')
const customCols = ref(20)
const customRows = ref(20)
const targetCount = ref(800)
const countPunctuation = ref(true)
const markFilled = ref(true)
const seoContentVisible = ref(true)

const targetPresets = [600, 800, 1000]

const gridCols = computed(() => {
  if (paperSpec.value === 'custom') return Math.min(40, Math.max(1, customCols.value || 1))
  return SPEC_PRESETS[paperSpec.value].cols
})

const gridRows = computed(() => {
  if (paperSpec.value === 'custom') return Math.min(40, Math.max(1, customRows.value || 1))
  return SPEC_PRESETS[paperSpec.value].rows
})

const cellsPerPage = computed(() => gridCols.value * gridRows.value)

const effectiveCount = computed(() => {
  if (inputMode.value === 'manual') return Math.max(0, Math.round(manualCount.value || 0))
  return countChars(essayText.value, countPunctuation.value)
})

const pagesNeeded = computed(() => pagesFor(effectiveCount.value, cellsPerPage.value))

const remainingCells = computed(() => {
  if (pagesNeeded.value === 0) return 0
  return pagesNeeded.value * cellsPerPage.value - effectiveCount.value
})

const statusInfo = computed(() => {
  const st = statusFor(effectiveCount.value, targetCount.value)
  if (st.state === 'ok') return { tone: 'ok', badge: '达标', detail: `已超目标 ${effectiveCount.value - targetCount.value} 字` }
  if (st.state === 'near') return { tone: 'near', badge: '接近', detail: `还差 ${st.gap} 字` }
  if (st.state === 'short') return { tone: 'short', badge: '还差 N 字'.replace('N', st.gap), detail: `建议再补 ${st.gap} 字` }
  return { tone: 'ok', badge: '—', detail: '未设置目标字数' }
})

// 第一页方格内展示的字符（按占格口径拆字；英文单词与数字串整体入格）
const gridChars = computed(() => {
  if (inputMode.value === 'manual') return []
  const text = essayText.value
  const chars = Array.from(text)
  const cells = []
  let i = 0
  while (i < chars.length && cells.length < cellsPerPage.value) {
    const ch = chars[i]
    if (/\s/.test(ch)) { i += 1; continue }
    if (/[A-Za-z0-9]/.test(ch)) {
      let word = ''
      while (i < chars.length && /[A-Za-z0-9]/.test(chars[i])) {
        word += chars[i]
        i += 1
      }
      cells.push(word)
      continue
    }
    if (!countPunctuation.value && /\p{P}/u.test(ch)) { i += 1; continue }
    cells.push(ch)
    i += 1
  }
  return cells
})

const loadSample = () => { essayText.value = SAMPLE_ESSAY }

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const printPaper = () => {
  markFilled.value = false
  window.print()
}
</script>

<style scoped>
.paper-grid {
  display: grid;
  gap: 0;
  border: 2px solid #333;
}
.paper-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border: 1px solid #666;
  display: flex;
  align-items: center;
  justify-content: center;
}
.paper-cell-filled {
  background: rgba(59, 130, 246, 0.12);
}
.cell-char {
  font-size: 11px;
  line-height: 1;
  color: #1f2937;
  max-width: 90%;
  overflow: hidden;
  text-align: center;
}
@media print {
  .no-print {
    display: none !important;
  }
  .paper-sheet {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
}
</style>
