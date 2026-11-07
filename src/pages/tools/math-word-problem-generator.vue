<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- 全局 @page 规则：A4 竖版、12mm 页边距 -->
    <component :is="'style'" v-html="printPageCss"></component>

    <!-- Hero 头部 -->
    <div class="mb-8 no-print">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <GraduationCap class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">应用题生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">鸡兔同笼、行程相遇、工程合作、盈亏问题、年龄倍数五大题型，简单/进阶分档，答案页附完整解题步骤，A4 打印</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线小学数学应用题组卷工具：面向 2-5 年级，覆盖鸡兔同笼（含三轮车/船位变体）、行程相遇、工程合作、盈亏问题、年龄差与倍数五大经典题型。
        全部题目先设计整数答案再反推题面，保证每题数字友好、有整数解；简单/进阶两档难度，一次出 5 / 10 / 20 题组成一份练习卷。
        每题附完整解题步骤与验算算式，打印时题目页与答案页自动分离（答案页另起一页，含算式步骤，方便家长批改）。
        采用 mulberry32 确定性种子随机：同一种子随时再生成完全相同的一份卷。全部在浏览器本地生成，不上传任何数据。
      </p>
    </div>

    <div class="print-grid grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：出题设置 -->
      <div class="no-print space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <GraduationCap class="w-5 h-5 mr-2 text-primary" /> 题型与难度
          </h2>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">难度档位</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="level = 'simple'"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="level === 'simple' ? BTN_ON : BTN_OFF"
              >
                简单（2-3 年级）
              </button>
              <button
                type="button"
                @click="level = 'advanced'"
                class="px-3 py-2 rounded-lg border text-xs font-medium transition"
                :class="level === 'advanced' ? BTN_ON : BTN_OFF"
              >
                进阶（4-5 年级）
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {{ levelTip }}
            </p>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">题量</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="n in COUNT_OPTIONS"
                :key="n"
                type="button"
                @click="count = n"
                class="px-1 py-2 rounded-lg border text-xs font-medium transition"
                :class="count === n ? BTN_ON : BTN_OFF"
              >
                {{ n }} 题
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">页眉（打印在题目上方，可直接修改）</label>
            <input v-model="headerText" type="text" :class="SEL_CLS" placeholder="应用题练习 · ____年__月__日 · 姓名________" />
          </div>

          <div>
            <label class="block text-xs text-muted-foreground mb-1">随机种子（同一种子 = 同一份卷）</label>
            <input
              v-model="seedInput"
              type="text"
              inputmode="numeric"
              :class="SEL_CLS"
              placeholder="留空则每次随机；如填 20260101 随时能再出同一份卷"
              @change="applySeedInput"
            />
          </div>

          <div class="grid grid-cols-1 gap-2 pt-1">
            <button
              @click="regenerate"
              class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重新生成（换一套题）
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="printPaper"
                class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
              >
                <Printer class="w-4 h-4" /> 打印 / PDF
              </button>
              <button
                @click="copyText"
                class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle v-if="copied" class="w-4 h-4 text-green-500" />
                <Copy v-else class="w-4 h-4" />
                {{ copied ? '已复制' : '复制含答案' }}
              </button>
            </div>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>五大题型按配额混编；改设置或种子会即时重新组卷，点「重新生成」才换新随机种子。同一种子 + 同样设置 = 逐题完全一致。</span>
          </p>
        </div>
      </div>

      <!-- 右：A4 预览（打印时仅输出题目页与答案页） -->
      <div class="lg:col-span-2 print-area">
        <div class="no-print flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Play class="w-5 h-5 mr-2 text-primary" /> A4 预览
          </h2>
          <div class="inline-flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              @click="viewMode = 'questions'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'questions' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              题目页
            </button>
            <button
              type="button"
              @click="viewMode = 'answers'"
              class="px-3 py-1.5 transition"
              :class="viewMode === 'answers' ? 'bg-primary/10 text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-muted/70'"
            >
              答案页
            </button>
          </div>
        </div>

        <div class="no-print flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Info class="w-3.5 h-3.5 shrink-0" />
            共 {{ paper.items.length }} 题 · 当前种子 {{ activeSeed }}
          </span>
          <span
            v-if="selfCheck.total > 0 && selfCheck.passed === selfCheck.total"
            class="flex items-center gap-1 text-green-600"
          >
            <CheckCircle class="w-3.5 h-3.5 shrink-0" /> 答案自校验 {{ selfCheck.passed }}/{{ selfCheck.total }} 通过
          </span>
          <span v-else-if="selfCheck.failed.length" class="flex items-center gap-1 text-amber-600">
            <TriangleAlert class="w-3.5 h-3.5 shrink-0" /> {{ selfCheck.failed.length }} 题自校验未通过，请重新生成
          </span>
        </div>

        <div ref="previewWrapRef" class="w-full overflow-hidden">
          <div :style="{ width: sheetWpx * previewScale + 'px', height: stackH > 0 ? stackH * previewScale + 'px' : 'auto' }" class="mx-auto">
            <div :style="{ width: sheetWpx + 'px', transform: 'scale(' + previewScale + ')', transformOrigin: 'top left' }">
              <!-- 题目页 -->
              <div v-show="viewMode === 'questions'" class="a4-sheet sheet-break">
                <p class="sheet-header">{{ headerText }}</p>
                <ol class="wp-list">
                  <li v-for="it in paper.items" :key="it.no" class="wp-item">
                    <span class="wp-no">{{ it.no }}.</span>{{ it.text }}
                  </li>
                </ol>
              </div>
              <!-- 答案页（单独一页：答案 + 解题步骤） -->
              <div v-show="viewMode === 'answers'" class="a4-sheet answer-sheet">
                <p class="sheet-header">{{ headerText }} · 参考答案与解题步骤</p>
                <ol class="wp-list">
                  <li v-for="a in paper.answers" :key="a.no" class="wp-item wp-answer">
                    <p><span class="wp-no">{{ a.no }}.</span><strong>{{ a.answer }}</strong></p>
                    <p class="wp-steps">{{ a.steps }}</p>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <p class="no-print text-xs text-muted-foreground mt-3 leading-relaxed">
          提示：打印或另存 PDF 时缩放请选「100% / 实际大小」，本页已按 A4 竖版、12mm 页边距排版；打印只会输出题目页与答案页（答案页另起一页，含解题步骤与验算），设置面板不会被打出来。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 折叠） -->
    <details class="no-print group bg-card border border-border rounded-lg mb-12">
      <summary class="cursor-pointer select-none px-6 py-4 text-lg font-semibold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>应用题生成器是什么？五大题型怎么解？</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div class="px-6 pb-6">
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          应用题生成器是一款面向小学 2-5 年级家长与老师的免费在线组卷工具。它把五类经典应用题——鸡兔同笼（简单档为鸡 2 脚 / 兔 4 脚，
          进阶档换成三轮车 / 自行车、大船 / 小船等变体）、行程相遇（两车相向而行求相遇时间）、工程合作（两队合作求完成天数，工作总量记作 1）、
          盈亏问题（两种分法一多一少求人数与总量）、年龄问题（差不变，求几年前 / 后的倍数关系）——按配额混编成卷。
          出题核心是「先设计答案、再反推题面」：所有题目先取定整数答案，再倒推出整数题面，保证每题都有整数解、数字友好。
          简单档对应 2-3 年级（数字小、倍数关系直接），进阶档对应 4-5 年级（数字更大、出现 3 与 4 的倍数、船位座位等变体）。
          生成采用 mulberry32 确定性随机：同一种子配同样设置，任何时候都能逐题复现同一份卷，方便补打与全班同卷。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">五大题型解法口诀</h3>
        <div class="overflow-x-auto mb-4">
          <table class="w-full border-collapse border border-border text-sm">
            <thead>
              <tr class="bg-muted">
                <th class="border border-border px-3 py-2 text-left">题型</th>
                <th class="border border-border px-3 py-2 text-left">核心公式 / 口诀</th>
                <th class="border border-border px-3 py-2 text-left">例</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-border px-3 py-2">鸡兔同笼</td>
                <td class="border border-border px-3 py-2">假设全是腿少的：兔数 =（实际脚数 − 2×头数）÷(4−2)，即「多脚数 ÷ 脚差」</td>
                <td class="border border-border px-3 py-2">12 头 34 脚 → 兔 5、鸡 7</td>
              </tr>
              <tr>
                <td class="border border-border px-3 py-2">行程相遇</td>
                <td class="border border-border px-3 py-2">相遇时间 = 总路程 ÷ 速度和（相向而行，速度相加）</td>
                <td class="border border-border px-3 py-2">40+50 千米/时、270 千米 → 3 小时</td>
              </tr>
              <tr>
                <td class="border border-border px-3 py-2">工程合作</td>
                <td class="border border-border px-3 py-2">把总量看作 1：合作天数 = 1 ÷（1/甲天数 + 1/乙天数）= 甲×乙 ÷（甲+乙）</td>
                <td class="border border-border px-3 py-2">甲 6 天乙 12 天 → 合作 4 天</td>
              </tr>
              <tr>
                <td class="border border-border px-3 py-2">盈亏问题</td>
                <td class="border border-border px-3 py-2">人数 =（盈 + 亏）÷ 两次分配差；总量 = 盈分方案 + 盈（或 亏分方案 − 亏）</td>
                <td class="border border-border px-3 py-2">分 5 余 8、分 7 差 4 → 6 人 38 颗</td>
              </tr>
              <tr>
                <td class="border border-border px-3 py-2">年龄问题</td>
                <td class="border border-border px-3 py-2">年龄差永远不变：倍数年份的年龄 = 差 ÷（倍数 − 1），再减 / 加今年年龄得年前 / 后年数</td>
                <td class="border border-border px-3 py-2">父 40 子 16，几年前 3 倍？→ 4 年前</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">答案页怎么用？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          勾选打印后，答案页自动另起一页附在题目卷尾，不只给最终答案，还给出完整解题步骤（分步算式 + 验算），孩子做完可先自己对步骤复盘，
          家长批改时也能照步骤讲题。想让孩子先盲做，可以先只打题目页，批改前用同一种子重新生成再补打答案页。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">难度怎么选？</h3>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          简单档：数值小（头数 6-12、速度 30-60）、变体少，适合 2-3 年级刚接触应用题的孩子建立「假设法」「单位 1」的思路；
          进阶档：数值更大（头数 10-20、速度 30-80）、出现三轮车 / 大船小船变体与 3 倍 / 4 倍年龄关系，适合 4-5 年级。
          建议正确率稳定在 80% 以上再升档；各版本教材进度略有差异，以孩子所用教材与老师要求为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么每题都有整数解？</h3>
            <p class="text-sm text-muted-foreground mt-1">工具采用「先答案后题面」的生成方式：先随机取定答案（如兔 5 只鸡 7 只），再反推出符合答案的整数题面（12 头 34 脚），所以每题一定有整数解，不会出现除不尽的尴尬。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">随机种子是什么？怎么复现同一份卷？</h3>
            <p class="text-sm text-muted-foreground mt-1">种子是出题随机数的起点：同一种子配同样设置，生成的卷子逐题完全一致。把种子填回输入框即可复现（补打丢卷、全班同卷都靠它）；点「重新生成」则换新种子出新卷。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">打印会带出按钮和设置吗？答案怎么打？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。打印样式已隐藏页面其余内容，只输出 A4 题目页；答案页（含解题步骤与验算）自动另起一页附在卷尾，可整卷打印，也可先打题目页再补打答案页。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">还想练口算 / 竖式怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">口算训练请配合站内<a href="/tools/math-worksheet-printer/" class="text-primary underline">口算题卡生成器</a>使用：那边主打加减乘除口算与竖式打印，本页主打应用题思维训练，两者搭配正好覆盖计算与应用两大板块。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'math-word-problem-generator'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  GraduationCap, Printer, RefreshCw, CheckCircle, TriangleAlert,
  Info, Play, Copy, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '应用题生成器 - 鸡兔同笼/行程相遇/盈亏问题在线组卷打印（带答案步骤）',
  description: '免费在线小学应用题生成器：鸡兔同笼、行程相遇、工程合作、盈亏问题、年龄倍数五大题型，简单/进阶难度分档，每题整数解并附完整解题步骤与验算，5/10/20 题组卷，A4 打印题目页与答案页分离，mulberry32 种子同码同卷可复现，纯浏览器本地生成不上传',
  keywords: '应用题生成器,鸡兔同笼,行程问题,盈亏问题,工程问题,年龄问题,小学数学应用题,应用题打印',
  author: '有条工具',
  ogTitle: '应用题生成器 - 五大题型在线组卷打印（带答案步骤） | 有条工具',
  ogDescription: '鸡兔同笼、行程相遇、工程合作、盈亏、年龄五大题型，简单/进阶分档，答案页附完整解题步骤，同种子同卷可复现。',
  ogUrl: 'https://www.util.cn/tools/math-word-problem-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '应用题生成器',
          url: 'https://www.util.cn/tools/math-word-problem-generator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '五大题型：鸡兔同笼/行程相遇/工程合作/盈亏问题/年龄问题',
            '简单与进阶两档难度（2-3 年级 / 4-5 年级）',
            '先设计整数答案再反推题面，每题保证整数解',
            '答案页附完整解题步骤与验算算式',
            'mulberry32 确定性种子，同种子同卷可复现',
            'A4 打印题目页与答案页分离，纯浏览器本地生成'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '应用题生成器', item: 'https://www.util.cn/tools/math-word-problem-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么每题都有整数解？',
              acceptedAnswer: { '@type': 'Answer', text: '工具采用先答案后题面的生成方式：先随机取定答案，再反推出符合答案的整数题面，所以每题一定有整数解。' }
            },
            {
              '@type': 'Question',
              name: '随机种子是什么？怎么复现同一份卷？',
              acceptedAnswer: { '@type': 'Answer', text: '种子是出题随机数的起点：同一种子配同样设置，生成的卷子逐题完全一致。把种子填回输入框即可复现；点重新生成则换新种子出新卷。' }
            },
            {
              '@type': 'Question',
              name: '打印会带出按钮和设置吗？答案怎么打？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。打印样式已隐藏页面其余内容，只输出 A4 题目页；答案页（含解题步骤与验算）自动另起一页附在卷尾。' }
            },
            {
              '@type': 'Question',
              name: '五大题型分别怎么解？',
              acceptedAnswer: { '@type': 'Answer', text: '鸡兔同笼用假设法：兔数=（脚数−2×头数）÷2；相遇问题：时间=路程÷速度和；工程合作：合作天数=甲天数×乙天数÷（甲天数+乙天数）；盈亏问题：人数=（盈+亏）÷分配差；年龄问题：年龄差不变，倍数年份年龄=差÷（倍数−1）。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// mulberry32 确定性伪随机数发生器（标准实现）：同一种子产生完全相同的 [0,1) 序列
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// [min, max] 闭区间随机整数
function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

// 最大公约数（分数化简用）
function gcdOf(a, b) {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y > 0) {
    const t = x % y
    x = y
    y = t
  }
  return x
}

// 分数文本：num/den 约分，分母为 1 时只留整数
function fracText(num, den) {
  if (den === 0) return '∞'
  const g = gcdOf(num, den)
  const n = num / g
  const d = den / g
  return d === 1 ? String(n) : n + '/' + d
}

// ---------- 题型 1：鸡兔同笼（简单档 鸡2/兔4；进阶档 三轮车/自行车、汽车/摩托、大船/小船 变体） ----------
const JITU_VARIANTS = [
  { hi: 3, lo: 2, hiName: '三轮车', loName: '自行车', unit: '辆', measure: '个轮子', place: '停车场里停着' },
  { hi: 4, lo: 2, hiName: '小汽车', loName: '摩托车', unit: '辆', measure: '个轮子', place: '车棚里停着' },
  { hi: 6, lo: 4, hiName: '大船', loName: '小船', unit: '条', measure: '个座位', place: '码头边停着' }
]
function genJiTu(rng, level) {
  const v = level === 'simple'
    ? { hi: 4, lo: 2, hiName: '兔', loName: '鸡', unit: '只', measure: '条腿', place: '笼子里有鸡和兔共' }
    : JITU_VARIANTS[randInt(rng, 0, JITU_VARIANTS.length - 1)]
  const h = level === 'simple' ? randInt(rng, 6, 12) : randInt(rng, 10, 20)
  const hiCount = randInt(rng, 1, h - 1)
  const loCount = h - hiCount
  const f = v.hi * hiCount + v.lo * loCount
  const text = level === 'simple'
    ? v.place + ' ' + h + ' ' + v.unit + '，数一数腿一共有 ' + f + ' ' + v.measure + '。鸡和兔各有几只？'
    : v.place + v.hiName + '和' + v.loName + '共 ' + h + ' ' + v.unit + '，一共有 ' + f + ' ' + v.measure + '。' + v.hiName + '和' + v.loName + '各有多少' + v.unit + '？'
  const steps = '假设全是' + v.loName + '：' + v.lo + '×' + h + '=' + (v.lo * h) + '（' + v.measure + '）；比实际少 ' + (f - v.lo * h) + '（' + v.measure +
    '）；每' + v.unit + v.hiName + '比' + v.loName + '多 ' + (v.hi - v.lo) + '（' + v.measure + '）；' + v.hiName + '：' + (f - v.lo * h) + '÷' + (v.hi - v.lo) + '=' + hiCount +
    '（' + v.unit + '）；' + v.loName + '：' + h + '−' + hiCount + '=' + loCount + '（' + v.unit + '）。验算：' + v.hi + '×' + hiCount + '+' + v.lo + '×' + loCount + '=' + f + ' ✓'
  return {
    kind: 'jitu',
    text,
    answer: v.hiName + ' ' + hiCount + ' ' + v.unit + '，' + v.loName + ' ' + loCount + ' ' + v.unit,
    steps,
    vars: { hi: v.hi, lo: v.lo, hiCount, loCount, h, f }
  }
}
// 独立验算：头数守恒 + 脚数守恒
function verifyJiTu(vars) {
  return vars.hiCount + vars.loCount === vars.h &&
    vars.hi * vars.hiCount + vars.lo * vars.loCount === vars.f
}

// ---------- 题型 2：行程相遇（速度和 × 时间 = 距离，先定时间反推距离） ----------
const MEET_SCENES = ['甲、乙两车同时从相距 {s} 千米的两地相向而行', '两辆汽车同时从相距 {s} 千米的两城相向开出', '两列火车从相距 {s} 千米的两站相向而行']
function genMeet(rng, level) {
  const step = level === 'simple' ? 10 : 5
  const vMax = level === 'simple' ? 60 : 80
  const v1 = randInt(rng, 30, vMax / step) * step
  const v2 = randInt(rng, 30, vMax / step) * step
  const t = level === 'simple' ? randInt(rng, 1, 3) : randInt(rng, 1, 6)
  const s = (v1 + v2) * t
  const scene = MEET_SCENES[randInt(rng, 0, MEET_SCENES.length - 1)].replace('{s}', String(s))
  const text = scene + '，甲车每小时行 ' + v1 + ' 千米，乙车每小时行 ' + v2 + ' 千米。经过几小时两车相遇？'
  const steps = '速度和：' + v1 + '+' + v2 + '=' + (v1 + v2) + '（千米/时）；相遇时间：' + s + '÷' + (v1 + v2) + '=' + t + '（小时）。验算：(' + v1 + '+' + v2 + ')×' + t + '=' + s + '（千米） ✓'
  return {
    kind: 'meet',
    text,
    answer: t + ' 小时',
    steps,
    vars: { v1, v2, t, s }
  }
}
// 独立验算：速度和 × 时间 = 距离
function verifyMeet(vars) {
  return (vars.v1 + vars.v2) * vars.t === vars.s
}

// ---------- 题型 3：工程合作（先定合作天数 t，再找使 y=xt/(x−t) 为整数的甲天数） ----------
function genWork(rng, level) {
  const xMin = level === 'simple' ? 3 : 4
  const xMax = level === 'simple' ? 10 : 20
  let x = 0
  let y = 0
  let t = 0
  for (let attempt = 0; attempt < 400; attempt++) {
    const cx = randInt(rng, xMin, xMax)
    const ct = randInt(rng, 2, cx - 1)
    const num = cx * ct
    const den = cx - ct
    if (den <= 0) continue
    if (num % den !== 0) continue
    const cy = num / den
    if (cy < 1 || cy > 60 || cy === cx) continue
    x = cx
    y = cy
    t = ct
    break
  }
  if (x === 0) { x = 6; y = 12; t = 4 } // 兜底：甲6乙12合作4天
  const eff = fracText(x + y, x * y) // 合作效率 1/x+1/y=(x+y)/(xy) 化简
  const text = '一项工程，甲队单独做 ' + x + ' 天完成，乙队单独做 ' + y + ' 天完成。两队合作，多少天可以完成？'
  const steps = '把工作总量看作"1"：甲的效率是 1/' + x + '，乙的效率是 1/' + y + '；合作效率 1/' + x + '+1/' + y + '=' + (x + y) + '/' + (x * y) + '=' + eff +
    '；合作天数 1÷' + eff + '=' + t + '（天）。验算：(' + x + '+' + y + ')×' + t + '=' + ((x + y) * t) + '=' + x + '×' + y + ' ✓'
  return {
    kind: 'work',
    text,
    answer: t + ' 天',
    steps,
    vars: { x, y, t }
  }
}
// 独立验算：1/x+1/y=1/t 等价于 (x+y)·t=xy（整数恒等式，无浮点误差）
function verifyWork(vars) {
  return (vars.x + vars.y) * vars.t === vars.x * vars.y
}

// ---------- 题型 4：盈亏问题（先定人数与两种分法，反推盈亏数） ----------
const YK_ITEMS = ['糖果', '苹果', '铅笔', '橘子']
function genYingKui(rng, level) {
  const item = YK_ITEMS[randInt(rng, 0, YK_ITEMS.length - 1)]
  for (let attempt = 0; attempt < 400; attempt++) {
    const p = level === 'simple' ? randInt(rng, 4, 12) : randInt(rng, 6, 20)
    const a = level === 'simple' ? randInt(rng, 2, 6) : randInt(rng, 2, 9)
    const d = level === 'simple' ? randInt(rng, 1, 2) : randInt(rng, 1, 4)
    const b = a + d
    const mMax = Math.min(level === 'simple' ? 6 : 8, p * d - 1)
    if (mMax < 1) continue
    const m = randInt(rng, 1, mMax)
    const n = p * d - m // b×p − total = n ≥ 1
    if (n < 1) continue
    const total = a * p + m
    const text = '老师把一些' + item + '分给小朋友，每人分 ' + a + ' ' + (item === '铅笔' ? '支' : '颗') + '就多出 ' + m + ' ' + (item === '铅笔' ? '支' : '颗') +
      '；每人分 ' + b + ' ' + (item === '铅笔' ? '支' : '颗') + '还差 ' + n + ' ' + (item === '铅笔' ? '支' : '颗') + '。一共有多少个小朋友？' + item + '有多少？'
    const unit = item === '铅笔' ? '支' : '颗'
    const steps = '两种分法总数相差：' + m + '+' + n + '=' + (m + n) + '（' + unit + '）；每人相差：' + b + '−' + a + '=' + (b - a) + '（' + unit +
      '）；人数：' + (m + n) + '÷' + (b - a) + '=' + p + '（个）；' + item + '：' + a + '×' + p + '+' + m + '=' + total + '（' + unit + '）。验算：' + b + '×' + p + '−' + n + '=' + total + ' ✓'
    return {
      kind: 'yingkui',
      text,
      answer: p + ' 个小朋友，' + total + ' ' + unit + item,
      steps,
      vars: { p, a, b, m, n, total }
    }
  }
  // 兜底（参数极端时几乎不会走到）：分5余8 分7差4 → 6人38颗
  const p = 6; const a = 5; const b = 7; const m = 8; const n = 4; const total = 38
  return {
    kind: 'yingkui',
    text: '老师把一些糖果分给小朋友，每人分 5 颗就多出 8 颗；每人分 7 颗还差 4 颗。一共有多少个小朋友？糖果有多少颗？',
    answer: p + ' 个小朋友，' + total + ' 颗糖果',
    steps: '两种分法总数相差：8+4=12（颗）；每人相差：7−5=2（颗）；人数：12÷2=6（个）；糖果：5×6+8=38（颗）。验算：7×6−4=38 ✓',
    vars: { p, a, b, m, n, total }
  }
}
// 独立验算：两种分法都对应同一总量，且 (盈+亏)=人数×分配差
function verifyYingKui(vars) {
  return vars.a * vars.p + vars.m === vars.total &&
    vars.b * vars.p - vars.n === vars.total &&
    vars.m + vars.n === vars.p * (vars.b - vars.a)
}

// ---------- 题型 5：年龄问题（差不变；三种形式：今年倍数/几年前/几年后） ----------
function genAge(rng, level) {
  const form = level === 'simple'
    ? (rng() < 0.5 ? 'now' : 'future')
    : (rng() < 0.5 ? 'past' : 'future')
  if (form === 'now') {
    // 今年：父子年龄之和 S = (k+1)×c，父亲 = k×c；保证年龄差 ≥ 22（生物学合理）
    const k = randInt(rng, 3, 4)
    const cMin = Math.max(5, Math.ceil(23 / (k - 1)))
    const cMax = k === 3 ? 16 : 11
    const c = randInt(rng, cMin, cMax)
    const S = (k + 1) * c
    const F = k * c
    return {
      kind: 'age',
      text: '今年父子两人的年龄之和是 ' + S + ' 岁，父亲的年龄恰好是儿子年龄的 ' + k + ' 倍。父亲和儿子今年各多少岁？',
      answer: '儿子 ' + c + ' 岁，父亲 ' + F + ' 岁',
      steps: '把儿子年龄看作 1 份，父亲是 ' + k + ' 份，一共 ' + (k + 1) + ' 份；儿子：' + S + '÷' + (k + 1) + '=' + c + '（岁）；父亲：' + c + '×' + k + '=' + F + '（岁）。验算：' + c + '+' + F + '=' + S + '，' + F + '=' + k + '×' + c + ' ✓',
      vars: { mode: 'now', S, k, c, F }
    }
  }
  if (form === 'past') {
    // 几年前：先定当年儿子年龄 c0 与倍数 j，再定年前年数 x，反推今年年龄
    // 注意：几年前的年龄差 = (j−1)×c0（x 在差中抵消），父子差 ≥22 要求 c0 ≥ 22/(j−1)，
    // 故 j=2 时儿子当年需 ≥22 岁（不合理），几年前只用 3 倍 / 4 倍
    const j = randInt(rng, 3, 4)
    const cMin = j === 3 ? 11 : 8
    const c0 = randInt(rng, cMin, 14)
    const x = randInt(rng, 3, 15)
    const F = j * c0 + x
    const S = c0 + x
    if ((j - 1) * c0 < 22 || F > 75) return genAgeFuture(rng, level)
    return {
      kind: 'age',
      text: '今年父亲 ' + F + ' 岁，儿子 ' + S + ' 岁。几年前父亲的年龄恰好是儿子年龄的 ' + j + ' 倍？',
      answer: x + ' 年前',
      steps: '年龄差永远不变：' + F + '−' + S + '=' + (F - S) + '（岁）；' + j + ' 倍时两人相差 ' + (j - 1) + ' 份，儿子当时：' + (F - S) + '÷' + (j - 1) + '=' + c0 + '（岁）；' + S + '−' + c0 + '=' + x + '，即 ' + x + ' 年前。验算：' + F + '−' + x + '=' + (F - x) + '，' + S + '−' + x + '=' + (S - x) + '，' + (F - x) + '=' + j + '×' + (S - x) + ' ✓',
      vars: { mode: 'past', F, S, j, x }
    }
  }
  return genAgeFuture(rng, level)
}
// 几年后：先定几年后儿子年龄 c1 与倍数 m，反推今年年龄
function genAgeFuture(rng, level) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const S = level === 'simple' ? randInt(rng, 8, 15) : randInt(rng, 8, 20)
    const m = level === 'simple' ? 2 : randInt(rng, 2, 3)
    const y = randInt(rng, 1, 12)
    const c1 = S + y
    if ((m - 1) * c1 < 22) continue
    const F = m * c1 - y
    if (F > 75) continue
    return {
      kind: 'age',
      text: '今年父亲 ' + F + ' 岁，儿子 ' + S + ' 岁。几年后父亲的年龄恰好是儿子年龄的 ' + m + ' 倍？',
      answer: y + ' 年后',
      steps: '年龄差永远不变：' + F + '−' + S + '=' + (F - S) + '（岁）；' + m + ' 倍时两人相差 ' + (m - 1) + ' 份，儿子那时：' + (F - S) + '÷' + (m - 1) + '=' + c1 + '（岁）；' + c1 + '−' + S + '=' + y + '，即 ' + y + ' 年后。验算：' + F + '+' + y + '=' + (F + y) + '，' + S + '+' + y + '=' + c1 + '，' + (F + y) + '=' + m + '×' + c1 + ' ✓',
      vars: { mode: 'future', F, S, m, y }
    }
  }
  // 兜底：父34子12，10年后 44=2×22
  return {
    kind: 'age',
    text: '今年父亲 34 岁，儿子 12 岁。几年后父亲的年龄恰好是儿子年龄的 2 倍？',
    answer: '10 年后',
    steps: '年龄差永远不变：34−12=22（岁）；2 倍时两人相差 1 份，儿子那时：22÷1=22（岁）；22−12=10，即 10 年后。验算：34+10=44，12+10=22，44=2×22 ✓',
    vars: { mode: 'future', F: 34, S: 12, m: 2, y: 10 }
  }
}
// 独立验算：按年份代入等式（差不变原理的代数验证）
function verifyAge(vars) {
  if (vars.mode === 'now') return vars.c + vars.F === vars.S && vars.F === vars.k * vars.c
  if (vars.mode === 'past') return vars.F - vars.x === vars.j * (vars.S - vars.x) && vars.S - vars.x >= 1
  return vars.F + vars.y === vars.m * (vars.S + vars.y)
}

// ---------- 组卷 ----------
const QUESTION_KINDS = ['jitu', 'meet', 'work', 'yingkui', 'age']
const KIND_GENERATORS = { jitu: genJiTu, meet: genMeet, work: genWork, yingkui: genYingKui, age: genAge }
const KIND_VERIFIERS = { jitu: verifyJiTu, meet: verifyMeet, work: verifyWork, yingkui: verifyYingKui, age: verifyAge }

// 归一化配置：非法值回退默认，保证「同配置」含义稳定
function normalizePaperConfig(config) {
  const c = config && typeof config === 'object' ? config : {}
  return {
    count: Math.min(50, Math.max(1, Math.floor(Number(c.count) || 10))),
    level: c.level === 'advanced' ? 'advanced' : 'simple'
  }
}

// 组卷：五大题型均等配额 + 确定性洗牌 + 去重重试；同 config 同 seed 输出逐题完全一致
function buildPaper(config, seed) {
  const cfg = normalizePaperConfig(config)
  const rng = mulberry32(Number(seed) >>> 0)
  const slots = []
  for (let i = 0; i < cfg.count; i++) slots.push(QUESTION_KINDS[i % QUESTION_KINDS.length])
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = slots[i]
    slots[i] = slots[j]
    slots[j] = tmp
  }
  const rawQuestions = []
  const items = []
  const answers = []
  const seen = new Set()
  for (let i = 0; i < slots.length; i++) {
    let q = null
    for (let attempt = 0; attempt < 8; attempt++) {
      q = KIND_GENERATORS[slots[i]](rng, cfg.level)
      if (!seen.has(q.text)) break
    }
    seen.add(q.text)
    rawQuestions.push(q)
    items.push({ no: i + 1, text: q.text })
    answers.push({ no: i + 1, answer: q.answer, steps: q.steps })
  }
  return { items, answers, rawQuestions }
}

// 自校验：用独立验算器逐题重算（每题记录结构化变量，代入守恒式复核）
function checkPaper(rawQuestions) {
  const list = Array.isArray(rawQuestions) ? rawQuestions : []
  let passed = 0
  const failed = []
  for (let i = 0; i < list.length; i++) {
    const q = list[i]
    const ok = KIND_VERIFIERS[q.kind] ? KIND_VERIFIERS[q.kind](q.vars) : false
    if (ok) passed += 1
    else failed.push(i + 1)
  }
  return { total: list.length, passed, failed }
}

// 复制用文本：题目 + 答案与步骤
function paperPlainText(items, answers) {
  const qs = Array.isArray(items) ? items : []
  const as = Array.isArray(answers) ? answers : []
  const lines = ['【题目】']
  for (const q of qs) lines.push(q.no + '. ' + q.text)
  lines.push('', '【参考答案与解题步骤】')
  for (const a of as) lines.push(a.no + '. ' + a.answer, '   ' + a.steps)
  return lines.join('\n')
}

// ---------- 页面状态与交互 ----------
const COUNT_OPTIONS = [5, 10, 20]
const BTN_ON = 'bg-primary/10 border-primary/40 text-primary font-medium'
const BTN_OFF = 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/70'
const SEL_CLS = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const level = ref('simple')
const count = ref(10)
const headerText = ref('应用题练习 · ____年__月__日 · 姓名________')
const seedInput = ref('')
const activeSeed = ref(20260101) // 首屏固定种子保证 SSR 与客户端渲染一致；onMounted 后换随机种子
const viewMode = ref('questions')
const copied = ref(false)
let copiedTimer = null

const paper = ref({ items: [], answers: [], rawQuestions: [] })
const selfCheck = ref({ total: 0, passed: 0, failed: [] })

const levelTip = computed(() => level.value === 'simple'
  ? '简单档：鸡兔同笼（鸡 2 脚 / 兔 4 脚）、速度 30-60、2 倍年龄关系，适合 2-3 年级。'
  : '进阶档：三轮车 / 大船小船变体、速度 30-80、3-4 倍年龄与几年前 / 后，适合 4-5 年级。')

const paperConfig = computed(() => ({ count: count.value, level: level.value }))

// 按当前种子重新组卷并自校验（buildPaper 为纯函数，SSR 阶段也可安全执行）
function rebuild() {
  paper.value = buildPaper(paperConfig.value, activeSeed.value)
  selfCheck.value = checkPaper(paper.value.rawQuestions)
}
watch(paperConfig, rebuild)
rebuild()

// 解析种子输入：空或非法返回 null（表示随机）
function seedFromInput() {
  const raw = String(seedInput.value).trim()
  if (raw === '') return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? Math.abs(n) >>> 0 : null
}

// 9 位正整数随机种子（仅回调中调用，SSR 安全）
function randomSeed() {
  return Math.floor(Math.random() * 900000000) + 100000000
}

function applySeedInput() {
  const s = seedFromInput()
  activeSeed.value = s === null ? randomSeed() : s
  rebuild()
}

function regenerate() {
  seedInput.value = ''
  activeSeed.value = randomSeed()
  rebuild()
}

function printPaper() {
  window.print()
}

async function copyText() {
  const text = paperPlainText(paper.value.items, paper.value.answers)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    window.alert('已复制')
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
      copiedTimer = null
    }, 2000)
  } catch (err) {
    window.alert('复制失败，请手动选择预览中的题目文本复制')
  }
}

// ---------- A4 预览缩放（mm 为单位，屏幕缩放预览、打印还原物理尺寸） ----------
const MM_PX = 96 / 25.4
const SHEET_W_MM = 210
const sheetWpx = SHEET_W_MM * MM_PX
const previewWrapRef = ref(null)
const previewScale = ref(1)
const stackH = ref(0)
let innerTimer = null

function updateScale() {
  const wrap = previewWrapRef.value
  if (!wrap) return
  const avail = wrap.clientWidth
  if (avail > 0) previewScale.value = Math.min(1, (avail - 2) / sheetWpx)
  const stack = wrap.firstElementChild ? wrap.firstElementChild.firstElementChild : null
  if (stack) stackH.value = stack.offsetHeight
}

// @page 规则单独注入（静态内容，A4 竖版 + 12mm 页边距）
const printPageCss = '@page { size: A4 portrait; margin: 12mm; }'

onMounted(() => {
  activeSeed.value = randomSeed()
  rebuild()
  updateScale()
  window.addEventListener('resize', updateScale)
  // 字体加载/渲染完成后量一次高度
  innerTimer = setTimeout(updateScale, 300)
  addRecentTool('math-word-problem-generator')
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScale)
  if (innerTimer) {
    clearTimeout(innerTimer)
    innerTimer = null
  }
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
})
</script>

<style scoped>
/* 屏幕上的 A4 卷面 */
.a4-sheet {
  width: 210mm;
  min-height: 297mm;
  padding: 14mm 13mm;
  background: #ffffff;
  color: #111827;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
  border-radius: 2px;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 4.2mm;
}
.pages-stack-margin {
  margin-top: 16px;
}
.sheet-header {
  font-size: 0.8em;
  color: #374151;
  border-bottom: 1.5px solid #d1d5db;
  padding-bottom: 3mm;
  margin-bottom: 8mm;
  white-space: pre-wrap;
  font-variant-numeric: tabular-nums;
}
.wp-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.wp-item {
  line-height: 1.7;
  margin-bottom: 6mm;
  break-inside: avoid;
  page-break-inside: avoid;
  font-variant-numeric: tabular-nums;
}
.wp-no {
  display: inline-block;
  min-width: 2em;
  color: #6b7280;
}
.wp-answer {
  margin-bottom: 5mm;
}
.wp-answer strong {
  color: #1e40af;
}
.wp-steps {
  margin: 1.5mm 0 0 2em;
  font-size: 0.82em;
  color: #4b5563;
  line-height: 1.6;
}

@media print {
  .no-print {
    display: none !important;
  }
  /* 打印时放开布局壳层：左右分栏改为通栏，保证 A4 卷面完整输出 */
  .print-grid {
    display: block !important;
  }
  .print-area {
    width: auto !important;
  }
  :global(main) {
    overflow: visible !important;
    height: auto !important;
  }
  .a4-sheet {
    display: block !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    width: auto !important;
    min-height: 0 !important;
    padding: 0 !important;
    transform: none !important;
  }
  /* 父层缩放容器在打印时还原 */
  .print-area div {
    width: auto !important;
    height: auto !important;
    transform: none !important;
  }
  /* 题目页打印后答案页另起一页 */
  .sheet-break {
    break-after: page;
    page-break-after: always;
  }
}
</style>
