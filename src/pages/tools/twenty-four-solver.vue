<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Dices class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">24 点求解器</h1>
          <p class="text-sm text-muted-foreground mt-1">四张牌算 24：有理数精确穷举全部解法，支持 1-13 快捷牌面与任意正整数，分数中间值不漏解</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 24 点求解器：对 4 个数做「全排列 × 5 种括号树形 × 64 种运算符组合」的完整枚举（共 7680 种算式），
        中间值全部用有理数 p/q 精确运算并约分（不用浮点），因此 8÷(3−8÷3) 这类必须经过分数中间值的"最难 24 点"也能稳定解出；
        解法按交换律等代数形式去重后给出总数与前 20 条表达式（用 × ÷ 展示），支持"给一个提示"（隐藏一个数看部分式）。
        快捷牌面 1-13 一键点选 + 随机发一手，也可自定义任意正整数。全部计算在浏览器本地完成，零上传。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Dices class="w-5 h-5 mr-2 text-primary" /> 出题
        </h2>

        <!-- 四个数输入槽 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">四个数（1-999 正整数）</p>
          <div class="grid grid-cols-4 gap-2">
            <input
              v-for="(slot, i) in slots"
              :key="'slot-' + i"
              v-model.number="slots[i]"
              type="number"
              min="1"
              max="999"
              step="1"
              class="w-full px-2 py-2.5 border border-border bg-background rounded-lg text-center text-xl font-bold text-foreground font-mono"
              :aria-label="'第' + (i + 1) + '个数'"
            />
          </div>
          <p v-if="inputError" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ inputError }}</span>
          </p>
        </div>

        <!-- 快捷牌面 1-13 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">快捷牌面（点选填入下一个空位，J=11 Q=12 K=13）</p>
          <div class="grid grid-cols-7 sm:grid-cols-7 gap-1.5">
            <button
              v-for="n in 13"
              :key="'card-' + n"
              @click="addCard(n)"
              class="py-2 rounded-lg border text-sm font-bold font-mono transition active:scale-95"
              :class="n === 1 || n > 10 ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20' : 'border-border bg-muted/40 text-foreground hover:bg-muted/80'"
              :title="CARD_LABELS[n - 1]"
            >
              {{ CARD_LABELS[n - 1] }}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              @click="dealRandom"
              class="px-3 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-sm font-semibold text-primary transition flex items-center justify-center gap-1.5"
            >
              <Dices class="w-4 h-4" /> 随机发一手
            </button>
            <button
              @click="clearSlots"
              class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
            >
              <Eraser class="w-4 h-4" /> 清空重填
            </button>
          </div>
        </div>

        <!-- 求解按钮 -->
        <button
          @click="runSolve"
          class="w-full px-4 py-3.5 rounded-lg text-base font-semibold transition flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90"
        >
          <Lightbulb class="w-5 h-5" /> 开始求解
        </button>

        <p class="text-xs text-muted-foreground leading-relaxed">
          求解口径：只使用 + − × ÷ 四则运算，每个数恰好用一次；中间结果允许分数（有理数 p/q 精确表示），
          最终结果必须恰好等于 24。1-13 对应一副扑克去掉大小王后的牌面（A=1，J=11，Q=12，K=13）。
        </p>
      </div>

      <!-- 右：结果面板 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 求解结果
          </h2>
          <button
            v-if="solutions.length"
            @click="copyAll"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition flex items-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 复制全部解法
          </button>
        </div>

        <!-- 未求解占位 -->
        <div v-if="!solved" class="bg-muted/50 rounded-xl p-8 text-center">
          <Lightbulb class="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p class="text-sm text-muted-foreground">填好四个数后点「开始求解」：穷举 5 种括号结构 × 64 种运算符组合 × 全部排列，中间值按分数精确计算。</p>
        </div>

        <!-- 无解 -->
        <div v-else-if="solutions.length === 0" class="bg-muted/50 rounded-xl p-8 text-center">
          <TriangleAlert class="w-10 h-10 mx-auto text-amber-500/70 mb-3" />
          <p class="text-base font-semibold text-foreground">无解</p>
          <p class="text-sm text-muted-foreground mt-2">
            <span class="font-mono">{{ inputSummary }}</span> 无论怎么加括号、选运算符，都凑不出 24（例如 (1,1,1,1) 就是无解的经典组合）。换一手牌再试试。
          </p>
        </div>

        <!-- 有解 -->
        <template v-else>
          <div class="bg-muted/50 rounded-xl p-4">
            <p class="text-sm text-muted-foreground">
              <span class="font-mono font-semibold text-foreground">{{ inputSummary }}</span>
              共找到 <span class="text-primary font-bold text-lg">{{ solutions.length }}</span> 种去重解法
              <span v-if="solutions.length > MAX_SHOW">（下方展示前 {{ MAX_SHOW }} 条，点「复制全部解法」可复制全部）</span>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              <div
                v-for="(sol, i) in shownSolutions"
                :key="'sol-' + i"
                class="bg-background border border-border rounded-lg px-3 py-2.5 flex items-center justify-between gap-2"
              >
                <span class="font-mono text-sm sm:text-base text-foreground break-all">
                  <span class="text-primary font-bold">{{ i + 1 }}.</span> {{ sol.expr }}
                </span>
                <span class="text-xs text-muted-foreground whitespace-nowrap">= 24</span>
              </div>
            </div>
          </div>

          <!-- 提示 -->
          <div class="bg-muted/50 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <p class="text-sm font-semibold text-foreground">卡住了？给一个提示</p>
              <div class="flex gap-2">
                <button
                  @click="showHint"
                  :disabled="!solutions.length"
                  class="px-3 py-1.5 text-sm bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Lightbulb class="w-4 h-4" /> 给一个提示
                </button>
                <button
                  v-if="hintText"
                  @click="showHint"
                  class="px-3 py-1.5 text-sm bg-muted border border-border text-muted-foreground rounded-lg hover:bg-muted/80 transition"
                >
                  换一个提示
                </button>
              </div>
            </div>
            <p v-if="hintText" class="text-sm text-muted-foreground leading-relaxed">
              从 <span class="font-mono">{{ hintText }}</span> 开始想：其中一个数被遮住了（？处），先用剩下的三个数凑出能一步到 24 的形式。
            </p>
            <p v-else class="text-xs text-muted-foreground">点「给一个提示」：随机挑一种解法并隐藏其中一个数字，只看部分式子，自己补完最后一步。</p>
          </div>
        </template>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-12 group">
      <summary class="text-base font-semibold flex items-center cursor-pointer select-none text-muted-foreground">
        <Info class="w-4 h-4 mr-2 text-primary" /> 24 点规则说明与常见问题（点击展开）
      </summary>

      <h2 class="text-2xl font-bold text-foreground mt-4 mb-4"><span class="text-primary mr-2">#</span>24 点游戏是什么？从哪来？</h2>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        24 点是一款经典算术扑克游戏：从牌堆抽 4 张牌（大小王除外，A=1、J=11、Q=12、K=13），
        用加、减、乘、除（可加括号）把四个数算成 24，每个数必须且只能用一次。
        现代商业化的「The 24 Game」由美国教育家 Robert Sun 于 1988 年推出并注册商标，主要用于小学数学心算训练；
        而用一副扑克牌玩 24 点的民间玩法流行得更早，在中国几乎是普及度最高的扑克算术游戏之一——
        规则简单、道具只要一副牌，却能把四则运算、括号优先级和数感全部练到。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么 (3,3,8,8) 是最难的 24 点之一？</h3>
      <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
        绝大多数 24 点题目都能用「整数中间值」凑出来（先凑 3、4、6、8、12 这类 24 的约数再相乘），
        但 (3,3,8,8) 的唯一解 8÷(3−8÷3)=24 必须经过分数中间值 8÷3：全列整数组合永远差一步，直觉上"怎么都不对"，
        这是公认的经典难题。(5,5,5,1) 的 5×(5−1÷5)=24 和 (1,3,4,6) 的 6÷(1−3÷4)=24 同理——
        三个式子都要先算出一个非整数，再靠除法"归零"到 24。
      </p>
      <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
        这也是很多网页 24 点工具会"漏解"的原因：它们用浮点数做中间运算，8÷3=2.666…67 存在舍入误差，
        最后判 |v−24|&lt;0.001 这类容差时可能在边界上漏掉或错判。本工具全程用有理数 p/q 精确运算并约分
        （分子分母按最大公约数约简），等值判断是精确的分数相等，因此分数中间值题目一个不漏。
      </p>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">求解器怎么枚举？会漏解吗？</h3>
      <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
        <li>四个数的运算顺序共有 24 种排列；四叶二叉算式共有 5 种括号树形：((a∘b)∘c)∘d、(a∘(b∘c))∘d、(a∘b)∘(c∘d)、a∘((b∘c)∘d)、a∘(b∘(c∘d))。</li>
        <li>三个运算位各有 4 种选择，共 4³=64 种组合。总计 24×5×64=7680 个算式，全部用有理数精确求值一遍，一个不漏。</li>
        <li>去重规则：加法、乘法满足交换律（a+b 与 b+a 同解），再把连加、连乘链拉平后按式子结构归一化，只保留写法上真正不同的一种。</li>
        <li>除以 0 的分支（如 (a−a) 作分母）直接跳过，不影响其它解法。</li>
      </ul>

      <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常见问题 (FAQ)</h3>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground">可以用乘方、根号或把数字拼起来吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">本工具按通行规则只用 + − × ÷ 和括号。个别民间玩法允许乘方、阶乘或数字拼接（如 1 和 2 拼成 12），需要时自行换算后再用自定义数字输入。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">为什么有的四张牌"无解"？</h3>
          <p class="text-sm text-muted-foreground mt-1">不是所有组合都能算出 24，例如 (1,1,1,1)。四张牌全部组合里大约有四分之三有解；无解时本工具会明确提示，而不是硬凑一个近似答案。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">中间结果是分数也算对吗？</h3>
          <p class="text-sm text-muted-foreground mt-1">算。通行规则只要求最终结果是 24，中间值允许任意有理数（分数、负数都可以，例如 1−8÷3 是负分数也合法）。本工具用有理数精确运算，分数中间值不会因舍入误差漏解。</p>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground">「给一个提示」是怎么工作的？</h3>
          <p class="text-sm text-muted-foreground mt-1">从已找到的解法里随机挑一个，把其中一个数字遮成「？」只显示部分式子：先用看得到的三个数凑出形如 6×4、72÷3、25−1 的中间形式，再补上被遮的那一步。</p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'twenty-four-solver'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Dices, Lightbulb, Copy, Eraser, Info, CheckCircle, TriangleAlert } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '24点求解器 - 四张牌算24点全部解法在线工具',
  description: '免费在线 24 点求解器：四个数（1-13 扑克牌面或任意正整数）算 24，全排列×5 种括号×64 种运算符完整穷举，中间值用有理数精确运算不漏解，8÷(3−8÷3)=24 等分数难题稳定解出，解法去重并给提示，浏览器本地运行零上传',
  keywords: '24点求解器,24点计算器,24点游戏,算24点,24点解法,扑克算术,24点答案,3 3 8 8 24点',
  author: '有条工具',
  ogTitle: '24点求解器 - 有理数精确穷举全部解法 | 有条工具',
  ogDescription: '四个数算 24 点：分数中间值精确计算不漏解，全部去重解法与提示，1-13 快捷牌面一键出题。',
  ogUrl: 'https://www.util.cn/tools/twenty-four-solver',
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
          name: '24点求解器',
          url: 'https://www.util.cn/tools/twenty-four-solver',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['全排列 × 5 种括号树形 × 64 种运算符完整穷举', '中间值有理数 p/q 精确运算，分数难题不漏解', '解法按交换律等代数形式去重', '1-13 快捷牌面点选与随机发一手', '支持自定义任意正整数（1-999）', '「给一个提示」隐藏一个数看部分式', '无解明确提示（如 1,1,1,1）', '本地运行零上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '24点求解器', item: 'https://www.util.cn/tools/twenty-four-solver/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么 (3,3,8,8) 是最难的 24 点之一？',
              acceptedAnswer: { '@type': 'Answer', text: '唯一解 8÷(3−8÷3)=24 必须经过分数中间值 8÷3，整数的组合怎么都凑不出 24；用浮点运算的工具还会因舍入误差漏解，本工具用有理数精确运算稳定解出。' }
            },
            {
              '@type': 'Question',
              name: '求解器会漏解吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。四个数 24 种排列 × 5 种括号树形 × 64 种运算符组合共 7680 个算式全部用有理数精确求值，除以 0 的分支跳过，解法按代数形式去重后给出。' }
            },
            {
              '@type': 'Question',
              name: '为什么有的四张牌无解？',
              acceptedAnswer: { '@type': 'Answer', text: '不是所有组合都能算出 24，例如 (1,1,1,1)。四张牌组合中约四分之三有解，无解时本工具会明确提示而不是硬凑近似答案。' }
            },
            {
              '@type': 'Question',
              name: '中间结果是分数也算对吗？',
              acceptedAnswer: { '@type': 'Answer', text: '算。通行规则只要求最终结果是 24，中间值允许任意有理数（分数、负数均可），例如 6÷(1−3÷4)=24 中的 1−3÷4=1/4。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== TESTABLE-BEGIN: 24 点纯逻辑（有理数精确运算 + 枚举求解 + 去重 + 提示，可独立单测） =====
// 运算符（展示与逻辑统一用 × ÷ − 符号）
const T24_OPS = ['+', '−', '×', '÷']

// BigInt 最大公约数（输入取绝对值；任一为 0 时返回 1n 保证约分安全）
function t24Gcd(a, b) {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b) { const t = a % b; a = b; b = t }
  return a || 1n
}

// 有理数工厂：分母恒正、按 gcd 约分；分母为 0 返回 null（除零哨兵）
function t24Rat(n, d = 1n) {
  if (d === 0n) return null
  if (d < 0n) { n = -n; d = -d }
  const g = t24Gcd(n, d)
  return { n: n / g, d: d / g }
}
const t24Add = (a, b) => t24Rat(a.n * b.d + b.n * a.d, a.d * b.d)
const t24Sub = (a, b) => t24Rat(a.n * b.d - b.n * a.d, a.d * b.d)
const t24Mul = (a, b) => t24Rat(a.n * b.n, a.d * b.d)
const t24Div = (a, b) => (b.n === 0n ? null : t24Rat(a.n * b.d, a.d * b.n))

// 精确判等 24：p/q === 24/1 ⇔ p === 24q（无浮点容差）
const t24Is24 = (v) => v !== null && v.n === 24n * v.d

// 算式树求值：叶子 {type:'num', value, leaf}；内部 {type:'op', op, l, r}
function t24Eval(nd) {
  if (nd.type === 'num') return t24Rat(BigInt(nd.value))
  const l = t24Eval(nd.l)
  if (!l) return null
  const r = t24Eval(nd.r)
  if (!r) return null
  if (nd.op === '+') return t24Add(l, r)
  if (nd.op === '−') return t24Sub(l, r)
  if (nd.op === '×') return t24Mul(l, r)
  return t24Div(l, r)
}

// 最小括号展示：子优先级更低加括号；右侧同级且为 − ÷ 时也加括号（a−(b−c)、a÷(b×c)）
function t24Prec(op) { return op === '+' || op === '−' ? 1 : 2 }
function t24StrParts(nd) {
  if (nd.type === 'num') return { text: String(nd.value), prec: 3 }
  const l = t24StrParts(nd.l)
  const r = t24StrParts(nd.r)
  const p = t24Prec(nd.op)
  const ls = l.prec < p ? '(' + l.text + ')' : l.text
  const rs = r.prec < p || (r.prec === p && (nd.op === '−' || nd.op === '÷')) ? '(' + r.text + ')' : r.text
  return { text: ls + nd.op + rs, prec: p }
}
const t24Expr = (nd) => t24StrParts(nd).text

// 规范式去重：+ × 满足交换律/结合律——拉平同运算符链后排序；− ÷ 保持左右结构
function t24Flatten(nd, op) {
  return nd.type === 'op' && nd.op === op ? [...t24Flatten(nd.l, op), ...t24Flatten(nd.r, op)] : [nd]
}
function t24Canon(nd) {
  if (nd.type === 'num') return 'n' + nd.value
  if (nd.op === '+' || nd.op === '×') return '(' + nd.op + t24Flatten(nd, nd.op).map(t24Canon).sort().join(',') + ')'
  return '(' + nd.op + t24Canon(nd.l) + ',' + t24Canon(nd.r) + ')'
}

// 5 种括号树形（4 叶二叉树的全部形态）；o = [o1, o2, o3]
function t24S1(a, b, c, d, o) { return { type: 'op', op: o[2], l: { type: 'op', op: o[1], l: { type: 'op', op: o[0], l: a, r: b }, r: c }, r: d } }
function t24S2(a, b, c, d, o) { return { type: 'op', op: o[2], l: { type: 'op', op: o[0], l: a, r: { type: 'op', op: o[1], l: b, r: c } }, r: d } }
function t24S3(a, b, c, d, o) { return { type: 'op', op: o[2], l: { type: 'op', op: o[0], l: a, r: b }, r: { type: 'op', op: o[1], l: c, r: d } } }
function t24S4(a, b, c, d, o) { return { type: 'op', op: o[0], l: a, r: { type: 'op', op: o[2], l: { type: 'op', op: o[1], l: b, r: c }, r: d } } }
function t24S5(a, b, c, d, o) { return { type: 'op', op: o[0], l: a, r: { type: 'op', op: o[1], l: b, r: { type: 'op', op: o[2], l: c, r: d } } } }
const T24_SHAPES = [t24S1, t24S2, t24S3, t24S4, t24S5]

// 下标全排列（24 种；重复数值由规范式去重兜底）
function t24Perms(arr) {
  if (arr.length <= 1) return [arr]
  const out = []
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const p of t24Perms(rest)) out.push([arr[i], ...p])
  }
  return out
}

// 求解：返回去重后的解法列表 [{ expr, tree }]（发现顺序稳定）
function t24Solve(nums) {
  const leaves = nums.map((v, i) => ({ type: 'num', value: v, leaf: i }))
  const found = new Map()
  for (const p of t24Perms([0, 1, 2, 3])) {
    const [a, b, c, d] = p.map((i) => leaves[i])
    for (const shape of T24_SHAPES) {
      for (const o1 of T24_OPS) {
        for (const o2 of T24_OPS) {
          for (const o3 of T24_OPS) {
            const root = shape(a, b, c, d, [o1, o2, o3])
            if (t24Is24(t24Eval(root))) {
              const key = t24Canon(root)
              if (!found.has(key)) found.set(key, root)
            }
          }
        }
      }
    }
  }
  return [...found.values()].map((tree) => ({ expr: t24Expr(tree), tree }))
}

// 提示：把树中第 k 个叶子（中序 0 基）替换为「？」生成部分式
function t24Mask(nd, counter) {
  if (nd.type === 'num') {
    if (counter.k === 0) { counter.k = -1; return '？' }
    if (counter.k > 0) counter.k -= 1
    return String(nd.value)
  }
  const l = t24StrParts(nd.l)
  const r = t24StrParts(nd.r)
  const p = t24Prec(nd.op)
  const ls = l.prec < p ? '(' + t24Mask(nd.l, counter) + ')' : t24Mask(nd.l, counter)
  const rs = r.prec < p || (r.prec === p && (nd.op === '−' || nd.op === '÷')) ? '(' + t24Mask(nd.r, counter) + ')' : t24Mask(nd.r, counter)
  return ls + nd.op + rs
}
function t24Hint(tree, leafIdx) {
  return t24Mask(tree, { k: leafIdx })
}
function t24LeafCount(nd) {
  return nd.type === 'num' ? 1 : t24LeafCount(nd.l) + t24LeafCount(nd.r)
}

// 输入收敛：正整数 1-999，否则 null
function t24ClampNum(v) {
  const n = Math.round(Number(v))
  if (!Number.isFinite(n) || n < 1 || n > 999) return null
  return n
}
// ===== TESTABLE-END =====

// ---------- 页面状态 ----------
const MAX_SHOW = 20
const CARD_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const slots = ref([null, null, null, null])
const inputError = ref('')
const solved = ref(false)
const solutions = ref([])
const hintText = ref('')

const inputSummary = computed(() => slots.value.map((v) => (v === null || v === '' ? '?' : v)).join(', '))
const shownSolutions = computed(() => solutions.value.slice(0, MAX_SHOW))

function addCard(n) {
  inputError.value = ''
  const i = slots.value.findIndex((v) => v === null || v === '' || !Number.isFinite(Number(v)))
  if (i === -1) {
    alert('四个数都已填满：可直接修改输入框，或点「清空重填」。')
    return
  }
  slots.value[i] = n
}

function dealRandom() {
  inputError.value = ''
  slots.value = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 13))
  solved.value = false
  solutions.value = []
  hintText.value = ''
}

function clearSlots() {
  slots.value = [null, null, null, null]
  inputError.value = ''
  solved.value = false
  solutions.value = []
  hintText.value = ''
}

function runSolve() {
  const nums = slots.value.map(t24ClampNum)
  if (nums.some((n) => n === null)) {
    inputError.value = '请把四个数都填成 1-999 的正整数（可用快捷牌面 A-K 点选，或直接输入任意正整数）。'
    return
  }
  inputError.value = ''
  solutions.value = t24Solve(nums)
  solved.value = true
  hintText.value = ''
}

function showHint() {
  if (!solutions.value.length) return
  const sol = solutions.value[Math.floor(Math.random() * solutions.value.length)]
  const leafCount = t24LeafCount(sol.tree)
  hintText.value = t24Hint(sol.tree, Math.floor(Math.random() * leafCount)) + ' = 24'
}

async function copyAll() {
  if (!solutions.value.length) return
  const text = `${inputSummary.value} → 24，共 ${solutions.value.length} 种解法：\n` +
    solutions.value.map((s, i) => `${i + 1}. ${s.expr} = 24`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    alert(`已复制全部 ${solutions.value.length} 种解法到剪贴板。`)
  } catch {
    alert('复制失败：浏览器未授权剪贴板，请手动选择文本复制。')
  }
}

onMounted(() => {
  addRecentTool('twenty-four-solver')
})
</script>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}
</style>
