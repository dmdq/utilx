<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FlaskConical class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">化学方程式配平器</h1>
          <p class="text-sm text-muted-foreground mt-1">输入反应物与生成物，高斯消元自动求配平系数，支持括号嵌套与大小写敏感，逐元素守恒核对</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线化学方程式配平工具：把反应物与生成物按「+」分开填入，工具会把每个化学式解析成元素计数（支持 Ca(OH)2、Fe2(SO4)3、K4[Fe(CN)6] 这类嵌套分组，
        元素符号严格区分大小写——Co 是钴而 CO 是一氧化碳），再用高斯消元求质量守恒线性方程组的最小正整数解；解析出错会精确指出第几个字符有问题，
        配平成功后附上每个元素「左 = 右」的守恒核对表。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FlaskConical class="w-5 h-5 mr-2 text-primary" /> 输入方程式
        </h2>

        <!-- 反应物 -->
        <div>
          <label for="chem-reactants" class="block text-sm font-medium text-foreground mb-1.5">反应物（多个用 + 分隔）</label>
          <input
            id="chem-reactants"
            v-model="reactantsInput"
            type="text"
            placeholder="如 H2 + O2"
            spellcheck="false"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <p class="mt-1.5 text-xs text-muted-foreground">解析预览：<span v-html="reactantsPreviewHtml"></span></p>
        </div>

        <!-- 生成物 -->
        <div>
          <label for="chem-products" class="block text-sm font-medium text-foreground mb-1.5">生成物（多个用 + 分隔）</label>
          <input
            id="chem-products"
            v-model="productsInput"
            type="text"
            placeholder="如 H2O"
            spellcheck="false"
            class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          <p class="mt-1.5 text-xs text-muted-foreground">解析预览：<span v-html="productsPreviewHtml"></span></p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <button
            @click="runSolve"
            class="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
          >
            <Play class="w-4 h-4" /> 配平
          </button>
          <button
            @click="resetAll"
            title="清空输入与结果"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>

        <!-- 内置示例 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">内置示例（点击填充并自动配平）</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="ex in examples"
              :key="ex.label"
              @click="applyExample(ex)"
              class="px-2.5 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 text-xs font-mono text-foreground transition"
            >
              {{ ex.label }}
            </button>
          </div>
        </div>

        <!-- 语法说明 -->
        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>语法：元素符号大小写敏感（Co 是钴，CO 是一氧化碳）；小括号与中括号均可嵌套分组，如 Ca(OH)2、Fe2(SO4)3、K4[Fe(CN)6]；原子个数直接跟在元素或右括号后。</span>
        </p>

        <!-- 反应条件提醒 -->
        <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>等号上的反应条件（点燃 / Δ 加热 / 催化剂 / 高温等）属于书写规范，请按作业要求自行标注在「=」上方，本工具只负责求配平系数。</span>
        </p>
      </div>

      <!-- 右：结果面板 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 配平结果与守恒核对
        </h2>

        <!-- 空状态 -->
        <div v-if="!result" class="flex flex-col items-center justify-center py-16 text-center">
          <FlaskConical class="w-10 h-10 text-primary/30 mb-3" />
          <p class="text-sm font-medium text-muted-foreground">在左侧输入反应物与生成物，点击「配平」</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击任一内置示例一键体验</p>
        </div>

        <!-- 错误卡：输入解析失败 -->
        <div v-else-if="result.status === 'error'" class="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-2.5">
          <p class="flex items-center gap-1.5 text-sm font-medium text-red-600">
            <TriangleAlert class="w-4 h-4" /> 输入有误
          </p>
          <p class="text-sm text-muted-foreground">{{ result.message }}</p>
          <div v-if="result.context" class="text-xs">
            <p class="text-muted-foreground mb-1">出错位置（高亮处为第 {{ result.pos + 1 }} 个字符）：</p>
            <p class="font-mono bg-muted/60 border border-border rounded p-2 break-all whitespace-pre-wrap">
              {{ result.context.slice(0, result.pos) }}<span class="bg-red-500/20 text-red-600 rounded px-0.5">{{ result.context.slice(result.pos, result.pos + 1) || '（末尾）' }}</span>{{ result.context.slice(result.pos + 1) }}
            </p>
          </div>
        </div>

        <!-- 错误卡：无法配平 -->
        <div v-else-if="result.status === 'unsolvable'" class="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2.5">
          <p class="flex items-center gap-1.5 text-sm font-medium text-amber-600">
            <TriangleAlert class="w-4 h-4" /> 无法配平
          </p>
          <p class="text-sm text-muted-foreground">{{ result.message }}</p>
          <p class="text-sm text-muted-foreground">{{ result.hint }}</p>
        </div>

        <!-- 提示卡：多组配平 -->
        <div v-else-if="result.status === 'multi'" class="rounded-lg border border-sky-500/30 bg-sky-500/5 p-4 space-y-2.5">
          <p class="flex items-center gap-1.5 text-sm font-medium text-sky-600">
            <Info class="w-4 h-4" /> 存在多组配平
          </p>
          <p class="text-sm text-muted-foreground">{{ result.message }}</p>
          <p class="text-sm text-muted-foreground">
            典型例子是「<span class="font-mono">C + O2 = CO + CO2</span>」：其中 CO 与 CO2 的比例可以任取，因为它其实是两个独立反应的叠加。
            请尝试把反应式拆分后分别配平，或检查是否多写、漏写了物种。
          </p>
        </div>

        <!-- 成功：配平结果 -->
        <div v-else class="space-y-5">
          <div class="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <div class="flex items-center justify-between gap-3 mb-4">
              <p class="flex items-center gap-1.5 text-sm font-medium text-green-600">
                <CheckCircle class="w-4 h-4" /> 配平成功，满足质量守恒
              </p>
              <button
                @click="copyResult"
                class="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-muted/60 text-xs font-medium text-muted-foreground hover:text-foreground transition flex items-center gap-1"
              >
                <CheckCircle v-if="copied" class="w-3.5 h-3.5 text-green-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                {{ copied ? '已复制' : '复制方程式' }}
              </button>
            </div>
            <div class="text-2xl sm:text-3xl font-bold font-mono text-foreground leading-relaxed break-words">
              <template v-for="(item, i) in result.left" :key="'l' + i">
                <span v-if="i > 0" class="text-muted-foreground mx-1.5">+</span>
                <span v-if="item.coeff !== 1" class="text-primary mr-1.5">{{ item.coeff }}</span><span v-html="item.html"></span>
              </template>
              <span class="text-primary mx-2.5">=</span>
              <template v-for="(item, i) in result.right" :key="'r' + i">
                <span v-if="i > 0" class="text-muted-foreground mx-1.5">+</span>
                <span v-if="item.coeff !== 1" class="text-primary mr-1.5">{{ item.coeff }}</span><span v-html="item.html"></span>
              </template>
            </div>
            <p class="text-xs text-muted-foreground mt-4 font-mono break-all">{{ result.text }}</p>
          </div>

          <!-- 元素守恒核对表 -->
          <div>
            <p class="text-sm font-medium text-foreground mb-2">元素守恒核对（左 = 右）</p>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-xs text-muted-foreground border-b border-border">
                    <th class="py-2 pr-4 font-medium">元素</th>
                    <th class="py-2 pr-4 font-medium">反应物侧原子数</th>
                    <th class="py-2 pr-4 font-medium">生成物侧原子数</th>
                    <th class="py-2 font-medium">守恒</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in result.balance" :key="row.element" class="border-b border-border/60">
                    <td class="py-2 pr-4 font-mono font-semibold text-foreground">{{ row.element }}</td>
                    <td class="py-2 pr-4 font-mono text-muted-foreground">{{ row.left }}</td>
                    <td class="py-2 pr-4 font-mono text-muted-foreground">{{ row.right }}</td>
                    <td class="py-2">
                      <span v-if="row.ok" class="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle class="w-3.5 h-3.5" /> 左 = 右
                      </span>
                      <span v-else class="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                        <TriangleAlert class="w-3.5 h-3.5" /> 不守恒
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>化学方程式为什么必须配平？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          化学反应遵守质量守恒定律：反应前后每一种元素的原子个数既不会凭空增加，也不会凭空减少，原子只是重新组合成新物质。因此一个能成立的化学方程式，
          等号两边每种元素的原子总数必须相等——这就是「配平」。配平时把各物种的系数设为未知数，对每种元素列出「左侧原子数 = 右侧原子数」的一次方程，
          就得到一个齐次线性方程组；配平的本质，就是求这个方程组的一组全为正整数的解，并把它化成最简整数比。
        </p>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          以 H2 + O2 → H2O 为例：设系数分别为 a、b、c，则氢原子满足 2a = 2c，氧原子满足 2b = c。令 c = 2，得 a = 2、b = 1，
          即配平结果 <span class="font-mono text-foreground">2 H2 + O2 = 2 H2O</span>。核对：左边 4 个氢、2 个氧，右边同样 4 个氢、2 个氧，守恒成立。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">常用配平技巧</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li><strong class="text-foreground">观察法：</strong>从组成最复杂的化学式入手，先把它系数定为 1，再顺推其他系数，最后化成最简整数比。适合 Fe + O2 → Fe3O4 这类结构简单的反应。</li>
          <li><strong class="text-foreground">最小公倍数法：</strong>挑一个两边原子数相差较大的元素，求最小公倍数反推两侧系数。如 H2 + O2 → H2O 中氧原子最小公倍数是 2，先定 O2 与 H2O 的系数为 1 和 2，再配氢。</li>
          <li><strong class="text-foreground">待定系数法：</strong>把所有系数设为未知数，对每种元素列守恒方程组求解（本工具采用的就是这一思路），适合 KMnO4 分解、C3H8 燃烧这类物种多、关系复杂的反应。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么会出现多组配平？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          当未知系数的个数比独立守恒方程多出不止一个时，方程组的解空间是高维的，正整数解有无穷多组——工具会提示「存在多组配平」。化学上这通常意味着两种情况：
          一是这个「反应式」实际上是几个独立反应的叠加，例如 <span class="font-mono">C + O2 → CO + CO2</span> 中 CO 与 CO2 的比例可以任意取，
          应拆成 C 与 O2 生成 CO、CO2 的两个反应分别配平；二是化学式写错、多写或漏写了物种。另外，若某个元素只出现在等号一侧，方程组无非零解，
          任何系数都配不平，工具会直接判定为「无法配平」并指出该元素。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">离子方程式要加电荷守恒（本工具暂不支持）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          离子方程式的配平条件比化学方程式多一条：除每种元素原子数左右相等外，还要求等号两边净电荷相等（若为氧化还原反应还需电子得失守恒）。
          本工具目前只按元素原子数建立线性方程组，不解析离子符号与电荷数（如 SO4^2-、e-），因此暂不支持离子方程式配平。
          建议先用化学式形式把方程配平，再自行改写成离子式，并核对两边电荷是否相等——这一步请务必手动完成，本工具无法代劳。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">工具算法一句话</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          把每个化学式用递归下降解析成元素计数，按「反应物取正、生成物取负」组成元素×物种矩阵，用高斯消元（全程有理数精确运算，避免浮点误差）求齐次线性方程组的零空间：
          零空间维数为 1 时，通分并约去最大公约数得到唯一的最小正整数系数比；维数大于 1 判为多组配平；不存在全正解则判为无法配平。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">化学方程式配平的原理是什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">质量守恒定律：反应前后每种元素的原子个数不变。把各物种的系数设为未知数，对每种元素列「左 = 右」的一次方程，得到齐次线性方程组，求出全为正整数的解并化成最小整数比，即为配平系数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">提示「存在多组配平」是什么意思？</h3>
            <p class="text-sm text-muted-foreground mt-1">说明系数方程组的自由未知数不止一个，存在无穷多组整数解。通常是反应式实为几个独立反应的叠加（如 C + O2 → CO + CO2），或者物种写多、写漏了。建议拆分成基本反应分别配平，或逐个核对化学式。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">支持配平离子方程式吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">暂不支持。离子方程式除原子守恒外还要求两边净电荷守恒，本工具目前只按元素原子数建立方程组，不解析离子符号与电荷。请先用化学式形式配平，再自行改写并核对电荷。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'chem-equation-balancer'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  FlaskConical, CheckCircle, TriangleAlert, ChevronUp, ChevronDown,
  Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '化学方程式配平器 - 在线自动配平化学方程式工具',
  description: '免费在线化学方程式配平工具：输入反应物与生成物即可自动计算配平系数，支持括号嵌套（Fe2(SO4)3、K4[Fe(CN)6]）与元素大小写敏感，解析出错精确到字符位置，附逐元素守恒核对表与配平技巧讲解，高斯消元纯本地计算不上传',
  keywords: '化学方程式配平,方程式配平器,自动配平化学方程式,化学计算器,质量守恒定律,高斯消元,待定系数法,在线化学工具',
  author: '有条工具',
  ogTitle: '化学方程式配平器 - 在线自动配平化学方程式工具 | 有条工具',
  ogDescription: '输入反应物与生成物即可自动配平化学方程式，支持括号嵌套与大小写敏感元素，附逐元素守恒核对表。',
  ogUrl: 'https://www.util.cn/tools/chem-equation-balancer',
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
          name: '化学方程式配平器',
          url: 'https://www.util.cn/tools/chem-equation-balancer',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['自动配平化学方程式系数', '支持括号与中括号嵌套分组', '元素大小写敏感解析（Co 与 CO 区分）', '解析错误定位到具体字符', '逐元素守恒核对表', '多组配平与无法配平检测', '浏览器本地高斯消元计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '化学方程式配平器', item: 'https://www.util.cn/tools/chem-equation-balancer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '化学方程式配平的原理是什么？',
              acceptedAnswer: { '@type': 'Answer', text: '质量守恒定律：反应前后每种元素的原子个数不变。把各物种的系数设为未知数，对每种元素列「左=右」的一次方程，得到齐次线性方程组，求出全为正整数的解并化成最小整数比，即为配平系数。' }
            },
            {
              '@type': 'Question',
              name: '提示「存在多组配平」是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: '说明系数方程组的自由未知数不止一个，存在无穷多组整数解。通常是反应式实为几个独立反应的叠加（如 C + O2 生成 CO 与 CO2），或者物种写多、写漏了。建议拆分成基本反应分别配平，或逐个核对化学式。' }
            },
            {
              '@type': 'Question',
              name: '支持配平离子方程式吗？',
              acceptedAnswer: { '@type': 'Answer', text: '暂不支持。离子方程式除原子守恒外还要求两边净电荷守恒，本工具目前只按元素原子数建立方程组，不解析离子符号与电荷。请先用化学式形式配平，再自行改写并核对电荷。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// --- 整数与有理数工具（求解全程精确，不用浮点） ---

// 最大公约数（入参可为负，返回非负）
function gcdInt(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = a % b
    a = b
    b = t
  }
  return a
}

// 最小公倍数（0 的最小公倍数约定为 0，实际不会遇到）
function lcmInt(a, b) {
  if (a === 0 || b === 0) return 0
  return (a / gcdInt(a, b)) * b
}

// 构造最简分数 { n, d }（d 恒为正）
function frac(n, d = 1) {
  if (d < 0) {
    n = -n
    d = -d
  }
  const g = gcdInt(n, d) || 1
  return { n: n / g, d: d / g }
}

function fAdd(a, b) {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d)
}

function fSub(a, b) {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d)
}

function fMul(a, b) {
  return frac(a.n * b.n, a.d * b.d)
}

function fDiv(a, b) {
  return b.n === 0 ? frac(0, 1) : frac(a.n * b.d, a.d * b.n)
}

function fNeg(a) {
  return { n: -a.n, d: a.d }
}

// --- 文本与展示 ---

// 全角字符（U+FF01–FF5E：Ｈ→H、２→2、＋→+、＝→= 等）统一转半角，再去首尾空白
function normalizeInput(text) {
  return String(text ?? '')
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .trim()
}

// HTML 转义（& < > " '），保证 v-html 注入安全
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 化学式 → 带下标的 HTML：'Fe2(SO4)3' → 'Fe<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub>'
// 逐字符先转义再包 <sub>，避免转义实体（如 &#39;）中的数字被误包
function formulaToHtml(formula) {
  let out = ''
  let inSub = false
  for (const ch of String(formula)) {
    if (ch >= '0' && ch <= '9') {
      if (!inSub) {
        out += '<sub>'
        inSub = true
      }
      out += ch
    } else {
      if (inSub) {
        out += '</sub>'
        inSub = false
      }
      out += escapeHtml(ch)
    }
  }
  if (inSub) out += '</sub>'
  return out
}

// --- 化学式解析 ---

// 判断解析结果是否为错误对象（成功时是元素计数对象，错误时是 { error, pos }）
function isParseError(result) {
  return typeof result === 'object' && result !== null && 'error' in result
}

// 解析单个化学式为 { 元素: 数量 }，如 'Fe2(SO4)3' → { Fe: 2, S: 3, O: 12 }
// 递归下降处理括号嵌套；() 与 [] 语义相同但须各自配对；失败返回 { error, pos } 而非 throw
// 大小写敏感：大写字母开头、其后小写字母整体为一种元素（'Co' 是钴，'CO' 是碳+氧）
function parseFormula(formula) {
  const s = String(formula)
  if (!s.length) return { error: '化学式为空', pos: 0 }

  const levels = [{}]      // 每层括号一个计数对象，栈顶为当前层
  const openBrackets = []  // 未闭合括号：{ ch, pos }
  let i = 0

  while (i < s.length) {
    const c = s[i]
    if (c === '(' || c === '[') {
      levels.push({})
      openBrackets.push({ ch: c, pos: i })
      i++
      continue
    }
    if (c === ')' || c === ']') {
      if (!openBrackets.length) return { error: `多余的「${c}」`, pos: i }
      const open = openBrackets[openBrackets.length - 1]
      const expect = open.ch === '(' ? ')' : ']'
      if (c !== expect) return { error: `括号不匹配：此处应为「${expect}」`, pos: i }
      openBrackets.pop()
      const group = levels.pop()
      let j = i + 1
      let num = ''
      while (j < s.length && s[j] >= '0' && s[j] <= '9') {
        num += s[j]
        j++
      }
      const times = num ? parseInt(num, 10) : 1
      const top = levels[levels.length - 1]
      for (const el of Object.keys(group)) {
        top[el] = (top[el] || 0) + group[el] * times
      }
      i = j
      continue
    }
    if (c >= 'A' && c <= 'Z') {
      let j = i + 1
      while (j < s.length && s[j] >= 'a' && s[j] <= 'z') j++
      const el = s.slice(i, j)
      let k = j
      let num = ''
      while (k < s.length && s[k] >= '0' && s[k] <= '9') {
        num += s[k]
        k++
      }
      const n = num ? parseInt(num, 10) : 1
      const top = levels[levels.length - 1]
      top[el] = (top[el] || 0) + n
      i = k
      continue
    }
    if (c === ' ' || c === '\t') {
      return { error: '化学式中间不能有空格（多个化学式请用「+」分隔）', pos: i }
    }
    return { error: `非法字符「${c}」`, pos: i }
  }

  if (openBrackets.length) {
    const open = openBrackets[openBrackets.length - 1]
    return { error: `「${open.ch}」未闭合`, pos: open.pos }
  }
  return levels[0]
}

// 把一侧输入按「+」拆成化学式数组；失败返回 { error, pos }（pos 相对整段输入）
function splitSide(input) {
  const s = String(input)
  if (!s.trim()) return { error: '内容为空', pos: 0 }
  const tokens = []
  let start = -1
  for (let i = 0; i <= s.length; i++) {
    const c = i < s.length ? s[i] : '+'
    if (c === '+') {
      const tok = s.slice(start < 0 ? i : start, i).trim()
      if (!tok) return { error: '这里有多余的「+」（加号旁缺少化学式）', pos: i }
      tokens.push(tok)
      start = -1
    } else if (start < 0 && c !== ' ' && c !== '\t') {
      start = i
    }
  }
  return { tokens }
}

// --- 矩阵构建与求解 ---

// 物种列表 → { elements: 元素列表（按首次出现顺序）, matrix: 元素×物种矩阵 }
// 物种形如 { counts: {元素: 数量}, sign: 1 | -1 }；反应物取 +，生成物取 −，配平即求 matrix·x = 0 的正整数解
function buildMatrix(species) {
  const elements = []
  for (const sp of species) {
    for (const el of Object.keys(sp.counts)) {
      if (!elements.includes(el)) elements.push(el)
    }
  }
  const matrix = elements.map((el) => species.map((sp) => (sp.counts[el] || 0) * sp.sign))
  return { elements, matrix }
}

// 高斯消元（有理数精确运算）求齐次线性方程组 matrix·x = 0 的零空间，返回：
//   number[] —— 唯一零空间方向对应的最小正整数系数比（通分 + 约去 GCD）
//   'multi'  —— 零空间维数 > 1（自由变量多于一个），存在多组配平
//   null     —— 零空间维数为 0（只有零解），或解中出现非正系数（无法配平）
function solveInteger(matrix) {
  const rows = matrix.length
  const cols = rows ? matrix[0].length : 0
  if (!rows || !cols) return null

  const m = matrix.map((row) => row.map((v) => frac(v, 1)))
  const pivotCols = []
  let r = 0

  // 化为简化行阶梯形（RREF）
  for (let c = 0; c < cols && r < rows; c++) {
    let piv = -1
    for (let i = r; i < rows; i++) {
      if (m[i][c].n !== 0) {
        piv = i
        break
      }
    }
    if (piv < 0) continue
    if (piv !== r) {
      const t = m[piv]
      m[piv] = m[r]
      m[r] = t
    }
    const pivot = m[r][c]
    for (let j = 0; j < cols; j++) m[r][j] = fDiv(m[r][j], pivot)
    for (let i = 0; i < rows; i++) {
      if (i === r || m[i][c].n === 0) continue
      const factor = m[i][c]
      for (let j = 0; j < cols; j++) {
        m[i][j] = fSub(m[i][j], fMul(factor, m[r][j]))
      }
    }
    pivotCols.push(c)
    r++
  }

  const freeCols = []
  for (let c = 0; c < cols; c++) {
    if (!pivotCols.includes(c)) freeCols.push(c)
  }
  if (freeCols.length === 0) return null
  if (freeCols.length > 1) return 'multi'

  // 唯一自由变量取 1，回代：RREF 中主元变量 = 该行自由变量系数的相反数
  const free = freeCols[0]
  const x = new Array(cols).fill(null)
  x[free] = frac(1, 1)
  for (let i = 0; i < pivotCols.length; i++) {
    x[pivotCols[i]] = fNeg(m[i][free])
  }

  // 通分成整数，再约去最大公约数 → 最小正整数比
  let L = 1
  for (const v of x) L = lcmInt(L, v.d)
  let ints = x.map((v) => (v.n * L) / v.d)
  let g = 0
  for (const v of ints) g = gcdInt(g, v)
  if (g > 1) ints = ints.map((v) => v / g)
  if (ints.some((v) => v <= 0)) return null
  return ints
}

// 拼配平方程式字符串：'2 H2 + O2 = 2 H2O'（系数 1 省略）
function formatEquation(reactants, products, coeffs) {
  const side = (list, offset) =>
    list
      .map((f, i) => (coeffs[offset + i] === 1 ? String(f) : `${coeffs[offset + i]} ${f}`))
      .join(' + ')
  return `${side(reactants, 0)} = ${side(products, reactants.length)}`
}

// 元素守恒核对：species 与 coeffs 对齐，返回 [{ element, left, right, ok }]
function verifyBalance(species, coeffs) {
  const left = {}
  const right = {}
  const order = []
  const note = (el) => {
    if (!order.includes(el)) order.push(el)
  }
  species.forEach((sp, i) => {
    const target = sp.sign > 0 ? left : right
    for (const el of Object.keys(sp.counts)) note(el)
    for (const [el, n] of Object.entries(sp.counts)) {
      target[el] = (target[el] || 0) + n * coeffs[i]
    }
  })
  return order.map((el) => ({
    element: el,
    left: left[el] || 0,
    right: right[el] || 0,
    ok: (left[el] || 0) === (right[el] || 0)
  }))
}

// 找出只出现在反应物或只在生成物一侧的元素（用于「无法配平」的定向提示）
function oneSideElements(species) {
  const left = new Set()
  const right = new Set()
  for (const sp of species) {
    const target = sp.sign > 0 ? left : right
    for (const el of Object.keys(sp.counts)) target.add(el)
  }
  const only = []
  for (const el of left) {
    if (!right.has(el)) only.push({ element: el, side: 'left' })
  }
  for (const el of right) {
    if (!left.has(el)) only.push({ element: el, side: 'right' })
  }
  return only
}

// ---------- 页面状态与交互 ----------

const reactantsInput = ref('H2 + O2')
const productsInput = ref('H2O')
const result = ref(null)
const copied = ref(false)
const seoContentVisible = ref(true)
let copyTimer = null

// 内置示例：label 用于按钮显示，reactants / products 用于填充
const examples = [
  { label: 'H2 + O2 → H2O', reactants: 'H2 + O2', products: 'H2O' },
  { label: 'Fe + O2 → Fe3O4', reactants: 'Fe + O2', products: 'Fe3O4' },
  { label: 'C3H8 + O2 → CO2 + H2O', reactants: 'C3H8 + O2', products: 'CO2 + H2O' },
  { label: 'KMnO4 → K2MnO4 + MnO2 + O2', reactants: 'KMnO4', products: 'K2MnO4 + MnO2 + O2' },
  { label: 'Ca(OH)2 + HCl → CaCl2 + H2O', reactants: 'Ca(OH)2 + HCl', products: 'CaCl2 + H2O' },
  { label: 'C2H2 + O2 → CO2 + H2O', reactants: 'C2H2 + O2', products: 'CO2 + H2O' }
]

// 输入即时格式化预览：合法化学式渲染下标，非法片段红色波浪线标出
function sidePreviewHtml(input) {
  const text = normalizeInput(input)
  if (!text) return '<span class="opacity-60">（等待输入）</span>'
  const split = splitSide(text)
  if ('error' in split) return `<span class="text-red-500">${escapeHtml(text)}</span>`
  return split.tokens
    .map((tok) => {
      const parsed = parseFormula(tok)
      if (isParseError(parsed)) {
        return `<span class="text-red-500 underline decoration-wavy">${escapeHtml(tok)}</span>`
      }
      return formulaToHtml(tok)
    })
    .join('<span class="opacity-60 mx-1">+</span>')
}

const reactantsPreviewHtml = computed(() => sidePreviewHtml(reactantsInput.value))
const productsPreviewHtml = computed(() => sidePreviewHtml(productsInput.value))

// 主流程：解析两侧 → 建矩阵 → 解零空间 → 生成结果对象
function runSolve() {
  const rText = normalizeInput(reactantsInput.value)
  const pText = normalizeInput(productsInput.value)
  if (!rText) {
    result.value = { status: 'error', message: '请先输入反应物，多个化学式用「+」分隔，例如 H2 + O2。' }
    return
  }
  if (!pText) {
    result.value = { status: 'error', message: '请先输入生成物，多个化学式用「+」分隔，例如 H2O。' }
    return
  }

  const species = []
  const formulas = { reactants: [], products: [] }
  const sides = [
    { text: rText, sign: 1, label: '反应物', key: 'reactants' },
    { text: pText, sign: -1, label: '生成物', key: 'products' }
  ]

  for (const side of sides) {
    const split = splitSide(side.text)
    if ('error' in split) {
      result.value = {
        status: 'error',
        message: `${side.label}格式有误：${split.error}`,
        context: side.text,
        pos: split.pos
      }
      return
    }
    for (let idx = 0; idx < split.tokens.length; idx++) {
      const tok = split.tokens[idx]
      const parsed = parseFormula(tok)
      if (isParseError(parsed)) {
        result.value = {
          status: 'error',
          message: `${side.label}第 ${idx + 1} 个化学式「${tok}」解析失败：${parsed.error}（第 ${parsed.pos + 1} 个字符）`,
          context: tok,
          pos: parsed.pos
        }
        return
      }
      species.push({ formula: tok, counts: parsed, sign: side.sign })
      formulas[side.key].push(tok)
    }
  }

  const { matrix } = buildMatrix(species)
  const solved = solveInteger(matrix)

  if (solved === null) {
    const only = oneSideElements(species)
    result.value = {
      status: 'unsolvable',
      message: '该反应式无法配平：质量守恒方程组没有全为正整数的解。',
      hint: only.length
        ? `元素 ${only.map((e) => `${e.element}（只出现在${e.side === 'left' ? '反应物' : '生成物'}一侧）`).join('、')} 在另一侧完全没有出现，请检查化学式是否写错或漏写了物种。`
        : '请逐个检查化学式的下标与括号是否正确、每种元素是否在两侧都出现，也可能是反应式本身写错了。'
    }
    return
  }
  if (solved === 'multi') {
    result.value = {
      status: 'multi',
      message: '存在多组配平：系数的自由未知数不止一个，配平结果有无穷多组。通常说明反应式可拆分或写错（详见下文说明）。'
    }
    return
  }

  const coeffs = solved
  result.value = {
    status: 'ok',
    coeffs,
    left: formulas.reactants.map((f, i) => ({ coeff: coeffs[i], html: formulaToHtml(f) })),
    right: formulas.products.map((f, i) => ({ coeff: coeffs[formulas.reactants.length + i], html: formulaToHtml(f) })),
    balance: verifyBalance(species, coeffs),
    text: formatEquation(formulas.reactants, formulas.products, coeffs)
  }
}

function applyExample(ex) {
  reactantsInput.value = ex.reactants
  productsInput.value = ex.products
  runSolve()
}

function resetAll() {
  reactantsInput.value = ''
  productsInput.value = ''
  result.value = null
}

// 复制纯文本方程式（仅在用户点击回调中访问剪贴板，SSR 安全）
async function copyResult() {
  if (!result.value || result.value.status !== 'ok') return
  const text = result.value.text
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
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
      copyTimer = null
    }, 2000)
  } catch {
    // 剪贴板不可用时静默失败，结果文本始终可见可手动复制
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

onMounted(() => {
  addRecentTool('chem-equation-balancer')
})

onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>
