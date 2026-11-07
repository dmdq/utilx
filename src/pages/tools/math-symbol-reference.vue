<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sigma class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">数学符号速查表</h1>
          <p class="text-sm text-muted-foreground mt-1">100 个常用数学符号分 8 组：Unicode 字符、LaTeX 写法、中文读法与含义示例，支持搜索与一键复制</p>
        </div>
      </div>
      <p class="text-muted-foreground no-print">
        在线数学符号大全：收录关系、运算、集合、逻辑、几何、希腊字母、概率统计与其他共 8 组约 100 个常用符号。
        每个符号给出 Unicode 字符（点击复制）、LaTeX 写法（点击复制）、中文读法与一句含义示例；支持按读法/含义/名称模糊搜索。
        另附「怎么打出来」输入指南（Word 公式编辑器、输入法特殊符号面板），写论文、做笔记、查读法一页搞定。
      </p>
      <div class="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 no-print">
        <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p class="text-sm leading-relaxed text-foreground">
          LaTeX 写法按 LaTeX 2e 数学模式整理（部分需 amsmath / amssymb / textcomp 宏包，如 \mathbb、\textperthousand）；
          读法与含义按国内数学教材惯例整理，个别符号在不同学科中含义有差异，以具体文献上下文为准。
        </p>
      </div>
    </div>

    <!-- 主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：搜索 + 分组 + 输入指南 -->
      <div class="space-y-6 no-print">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Search class="w-5 h-5 mr-2 text-primary" /> 搜索符号
          </h2>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="读法/含义/名称/LaTeX，如 约等于、求和、pi、属于"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              aria-label="清除搜索"
            >清除</button>
          </div>
          <div>
            <p class="text-xs text-muted-foreground mb-1.5">分组（{{ GROUPS.length }} 组）</p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="g in GROUP_TABS"
                :key="g.id"
                @click="activeGroup = g.id"
                class="px-2 py-1.5 rounded-lg border text-xs font-medium transition text-left"
                :class="activeGroup === g.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/40'"
              >
                {{ g.label }}
                <span class="opacity-70 ml-1">{{ g.count }}</span>
              </button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">当前 {{ filteredSymbols.length }} / {{ SYMBOLS.length }} 个符号，各组计数由符号表实时统计。</p>
        </div>

        <!-- 怎么打出来 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Keyboard class="w-4 h-4 mr-2 text-primary" /> 怎么打出来？
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2 leading-relaxed">
            <li>• <b class="text-foreground">最简单</b>：在本页找到符号点「复制字符」，直接粘贴。</li>
            <li>• <b class="text-foreground">Word / WPS</b>：按 Alt+= 插入公式编辑器，输入 \alpha、\sum 等 LaTeX 名后按空格会自动转成符号；或用「插入 → 符号 → 其他符号」，字体选 Cambria Math。</li>
            <li>• <b class="text-foreground">输入法</b>：搜狗/微软拼音等输入「阿尔法、约等于、因为」等读法可在候选栏直接选符号；也可打开「工具箱 → 符号大全 / 特殊符号」面板。</li>
            <li>• <b class="text-foreground">Windows</b>：按住 Alt + 小键盘数字（如 Alt+8800 = ≠，需启用十进制输入）；<b class="text-foreground">macOS</b>：Ctrl+Cmd+空格打开表情符号面板，搜索符号名称。</li>
            <li>• <b class="text-foreground">LaTeX / Markdown</b>：复制本页 LaTeX 写法列，放进 $...$ 或公式块即可渲染。</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：符号网格 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Sigma class="w-5 h-5 mr-2 text-primary" /> {{ activeGroupLabel }}
          </h2>
          <span class="text-xs text-muted-foreground">每个符号：大图字符 + LaTeX 写法 + 读法 + 含义</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <div
            v-for="(s, i) in filteredSymbols"
            :key="s.group + '-' + s.char + '-' + i"
            class="bg-muted/50 rounded-xl p-4 flex flex-col gap-2"
          >
            <div class="flex items-start justify-between gap-2">
              <span class="text-3xl font-bold text-foreground font-mono leading-none">{{ s.char }}</span>
              <span class="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium whitespace-nowrap">{{ groupLabelOf(s.group) }}</span>
            </div>
            <p class="text-sm font-semibold text-foreground">{{ s.read }}</p>
            <p class="text-xs text-muted-foreground leading-relaxed flex-1">{{ s.mean }}</p>
            <p class="text-xs text-muted-foreground font-mono bg-background border border-border rounded-lg px-2 py-1 truncate" :title="s.latex">LaTeX: {{ s.latex }}</p>
            <div class="flex gap-2">
              <button
                @click="copyChar(s)"
                class="flex-1 px-2 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium transition"
              >复制字符</button>
              <button
                @click="copyLatex(s)"
                class="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:border-primary/50 transition"
              >复制 LaTeX</button>
            </div>
          </div>
        </div>
        <p v-if="filteredSymbols.length === 0" class="text-xs text-muted-foreground py-8 text-center">
          没有匹配「{{ searchQuery }}」的符号：试试读法（约等于）、含义（求和）、名称（sigma）或直接粘贴符号字符。
        </p>
      </div>
    </div>

    <!-- SEO 内容区（details/summary 可折叠） -->
    <details class="bg-card border border-border rounded-lg p-6 mb-8 no-print" open>
      <summary class="text-xl font-bold text-foreground cursor-pointer select-none list-none flex items-center gap-2">
        <span class="text-primary">#</span> 数学符号速查表：LaTeX 与 Unicode 的区别、符号输入与常见问题
      </summary>
      <div class="mt-4 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          数学符号有两套主流载体：<b class="text-foreground">Unicode 字符</b>（如 ∑ ∫ ≠）可以直接放进聊天、文档、网页里显示，
          而 <b class="text-foreground">LaTeX 命令</b>（如 \sum \int \neq）是排版系统的源代码，交给 KaTeX/MathJax/LaTeX 编译后才渲染成公式。
          本页两者都给：日常输入复制 Unicode，写论文排公式复制 LaTeX 写法。
        </p>

        <h3 class="text-lg font-semibold text-foreground">LaTeX 与 Unicode 区别</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><b class="text-foreground">Unicode</b> 是字符编码标准：每个符号有一个码位（如 ∀ 是 U+2200），任何支持该字体的地方都能显示，但不表达数学结构（上标、分式、对齐）。站内可用 <NuxtLink to="/tools/unicode-convert/" class="text-primary hover:underline">Unicode 编码转换</NuxtLink>查看任意字符的码位。</li>
          <li><b class="text-foreground">LaTeX</b> 是排版宏语言：\frac{a}{b} 表达「b 分之 a」的结构，编译后得到真正的分式排版；\mathbb{R} 依赖 amssymb 宏包。复制本页 LaTeX 写法后，可在 <NuxtLink to="/tools/latex-formula-render/" class="text-primary hover:underline">LaTeX 公式渲染</NuxtLink>工具中即时预览效果。</li>
          <li><b class="text-foreground">选择建议</b>：聊天、笔记正文、网页文案用 Unicode；论文、作业、技术文档的公式用 LaTeX。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">几个高频符号怎么读</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li>∑ 读「西格玛」，是希腊字母大写 Sigma，数学里专指求和；Π 读「派」，大写 Pi 专指连乘。</li>
          <li>∀ 读「任意 / 对所有」（全称量词），∃ 读「存在」（存在量词），两者是数理逻辑的量词符号。</li>
          <li>∈ 读「属于」，⊆ 读「包含于」，∪ 读「并集」、∩ 读「交集」——注意 ∪ 并集像「杯子」变大集，∩ 交集取公共部分。</li>
          <li>∮ 读「环路积分」（沿闭合曲线），∂ 读「偏导 / 偏微分」，∇ 读「纳布拉」或「梯度算子」。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <div class="space-y-3">
          <div>
            <p class="font-semibold text-foreground">为什么有的符号复制出来显示成方框？</p>
            <p>说明当前字体缺字。数学专用字符（如 ℝ ℤ ∖ ⨁）在 Cambria Math、STIX、Noto Sans Math 等数学字体中齐全；换字体或改用 LaTeX 渲染即可。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">⊂ 和 ⊆ 有什么区别？</p>
            <p>⊆ 表示「子集」（允许相等，与 ≤ 类比），⊂ 严格说表示「真子集」（不许相等，与 &lt; 类比）。国内部分教材用 ⊂ 泛指子集、⊊ 表示真子集，阅读时以教材约定为准。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">希腊字母在数学里一般代表什么？</p>
            <p>惯例：α 角度/系数/显著性水平，β 系数/回归参数，θ 角度，λ 波长/泊松参数，μ 均值/摩擦系数，σ 标准差，ρ 密度/相关系数，ω 角速度，π 圆周率，Δ 变化量，Σ 求和，Ω 欧姆/复杂度下界。同一字母在不同学科含义可能不同，以文献为准。</p>
          </div>
          <div>
            <p class="font-semibold text-foreground">符号数据以什么为准？</p>
            <p>字符码位以 Unicode 标准为准，LaTeX 写法以 LaTeX 2e 数学模式及 amsmath/amssymb/textcomp 宏包文档为准，中文读法按国内教材通行读法整理，含义示例为常用语境参考。</p>
          </div>
        </div>
      </div>
    </details>

    <div class="no-print">
      <RelatedTools :currentToolId="'math-symbol-reference'" :category="'others'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Sigma, Search, Keyboard, TriangleAlert
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { trackEvent } from '~/utils/track'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '数学符号速查表 - 100个常用数学符号大全（Unicode字符+LaTeX写法+读法）',
  description: '在线数学符号速查表：100个常用数学符号分关系、运算、集合、逻辑、几何、希腊字母、概率统计等8组，每个符号含Unicode字符、LaTeX写法、中文读法与含义示例，支持搜索与一键复制，附Word公式编辑器与输入法输入指南',
  keywords: '数学符号大全,数学符号读法,LaTeX写法,希腊字母,数学符号怎么打,特殊符号复制',
  author: '有条工具',
  ogTitle: '数学符号速查表 - 100个常用数学符号大全 | 有条工具',
  ogDescription: '100 个数学符号：Unicode 字符 + LaTeX 写法 + 中文读法 + 含义示例，8 组分类一键复制。',
  ogUrl: 'https://www.util.cn/tools/math-symbol-reference',
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
          name: '数学符号速查表',
          url: 'https://www.util.cn/tools/math-symbol-reference',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '100 个常用数学符号分 8 组分类检索',
            '每个符号 Unicode 字符、LaTeX 写法、中文读法、含义示例四字段',
            '读法/含义/名称/LaTeX 模糊搜索',
            '一键复制字符与一键复制 LaTeX',
            'Word 公式编辑器与输入法特殊符号输入指南',
            'LaTeX 与 Unicode 区别说明'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others/' },
            { '@type': 'ListItem', position: 3, name: '数学符号速查表', item: 'https://www.util.cn/tools/math-symbol-reference/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么有的数学符号复制出来显示成方框？',
              acceptedAnswer: { '@type': 'Answer', text: '当前字体缺字。数学专用字符在 Cambria Math、STIX、Noto Sans Math 等数学字体中齐全，换字体或改用 LaTeX 渲染即可。' }
            },
            {
              '@type': 'Question',
              name: 'LaTeX 和 Unicode 符号有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'Unicode 是字符编码（如 ∀ 是 U+2200），可直接显示但不表达数学结构；LaTeX 命令（如 \\frac{a}{b}）是排版源代码，编译后得到真正的分式排版。日常输入用 Unicode，论文公式用 LaTeX。' }
            },
            {
              '@type': 'Question',
              name: '数学符号在 Word 里怎么打出来？',
              acceptedAnswer: { '@type': 'Answer', text: '按 Alt+= 打开公式编辑器，输入 \\alpha、\\sum 等 LaTeX 名后按空格自动转换；或用插入→符号→其他符号（字体选 Cambria Math）；也可在本页复制后直接粘贴。' }
            },
            {
              '@type': 'Question',
              name: '希腊字母在数学里一般代表什么？',
              acceptedAnswer: { '@type': 'Answer', text: '常用惯例：α 角度/系数，θ 角度，λ 波长/泊松参数，μ 均值，σ 标准差，ρ 密度/相关系数，ω 角速度，π 圆周率，Δ 变化量，Σ 求和，Ω 欧姆。同一字母在不同学科含义可能不同。' }
            }
          ]
        }
      ]
    })
  }]
})

// ===== DATA-BEGIN（纯逻辑与数据，可独立单测） =====
// 数据口径：Unicode 码位以 Unicode 标准为准；LaTeX 写法按 LaTeX 2e 数学模式
//（部分需 amsmath/amssymb/textcomp 宏包）；读法按国内数学教材惯例。
const SYMBOLS = [
  // —— 关系 11 ——
  { char: '=', latex: '=', read: '等于', mean: '两侧数量或表达式相等：a + b = c。', group: 'relation' },
  { char: '≠', latex: '\\neq', read: '不等于', mean: '两侧不相等：a ≠ b。', group: 'relation' },
  { char: '≈', latex: '\\approx', read: '约等于', mean: '近似相等，常用于测量或舍入：π ≈ 3.1416。', group: 'relation' },
  { char: '≡', latex: '\\equiv', read: '恒等于；同余', mean: '恒等式，或模运算同余：a ≡ b (mod n)。', group: 'relation' },
  { char: '<', latex: '<', read: '小于', mean: '左小于右：a < b。', group: 'relation' },
  { char: '>', latex: '>', read: '大于', mean: '左大于右：a > b。', group: 'relation' },
  { char: '≤', latex: '\\leq', read: '小于等于', mean: '不超过：a ≤ 5。', group: 'relation' },
  { char: '≥', latex: '\\geq', read: '大于等于', mean: '不低于：x ≥ 0。', group: 'relation' },
  { char: '∝', latex: '\\propto', read: '成正比', mean: 'y ∝ x 表示 y = kx（k 为常数）。', group: 'relation' },
  { char: '≪', latex: '\\ll', read: '远小于', mean: '数量级悬殊：ε ≪ 1。', group: 'relation' },
  { char: '≫', latex: '\\gg', read: '远大于', mean: '数量级悬殊：N ≫ 1。', group: 'relation' },
  // —— 运算 15 ——
  { char: '+', latex: '+', read: '加（正号）', mean: '加法或正数：2 + 3 = 5。', group: 'op' },
  { char: '−', latex: '-', read: '减（负号）', mean: '减法或负数：7 − 4 = 3。', group: 'op' },
  { char: '×', latex: '\\times', read: '乘；叉乘', mean: '乘法：3 × 4 = 12；向量代数中也表示向量积 a × b。', group: 'op' },
  { char: '÷', latex: '\\div', read: '除', mean: '除法：12 ÷ 4 = 3。', group: 'op' },
  { char: '±', latex: '\\pm', read: '正负号', mean: '表示两个可能取值：√9 = ±3。', group: 'op' },
  { char: '∓', latex: '\\mp', read: '负正号', mean: '与 ± 连用表示相反两档：(x±1)(x∓1) = x²−1。', group: 'op' },
  { char: '√', latex: '\\sqrt', read: '根号', mean: '平方根：√2、√x；n 次根用 \\sqrt[n]{}。', group: 'op' },
  { char: '∑', latex: '\\sum', read: '求和（西格玛）', mean: '∑ aᵢ（i 从 1 到 n）对各项求和。', group: 'op' },
  { char: '∏', latex: '\\prod', read: '求积（连乘）', mean: '∏ aᵢ 对各项连乘。', group: 'op' },
  { char: '∫', latex: '\\int', read: '积分号', mean: '不定/定积分：∫ f(x) dx。', group: 'op' },
  { char: '∮', latex: '\\oint', read: '环路积分', mean: '沿闭合曲线的积分：∮ F·dr（场论常用）。', group: 'op' },
  { char: '∂', latex: '\\partial', read: '偏导；偏微分', mean: '多元函数偏导数：∂f/∂x。', group: 'op' },
  { char: 'Δ', latex: '\\Delta', read: '德尔塔（增量）', mean: '变化量 Δx = x₂ − x₁；判别式 Δ = b² − 4ac。', group: 'op' },
  { char: '∇', latex: '\\nabla', read: '纳布拉（梯度算子）', mean: '∇f 梯度；∇·F 散度；∇×F 旋度。', group: 'op' },
  { char: '·', latex: '\\cdot', read: '点乘（数量积）', mean: '向量点积 a·b = |a||b|cosθ；小数点/乘号也用它。', group: 'op' },
  // —— 集合 15 ——
  { char: '∈', latex: '\\in', read: '属于', mean: '元素在集合中：3 ∈ ℕ。', group: 'set' },
  { char: '∉', latex: '\\notin', read: '不属于', mean: '元素不在集合中：0.5 ∉ ℤ。', group: 'set' },
  { char: '⊂', latex: '\\subset', read: '真包含于', mean: '严格子集（部分教材泛指子集）：{1,2} ⊂ {1,2,3}。', group: 'set' },
  { char: '⊆', latex: '\\subseteq', read: '包含于（子集）', mean: '子集（允许相等）：A ⊆ B。', group: 'set' },
  { char: '∪', latex: '\\cup', read: '并集', mean: 'A ∪ B = {x | x ∈ A 或 x ∈ B}。', group: 'set' },
  { char: '∩', latex: '\\cap', read: '交集', mean: 'A ∩ B = {x | x ∈ A 且 x ∈ B}。', group: 'set' },
  { char: '∅', latex: '\\emptyset', read: '空集', mean: '不含任何元素的集合；也写作 {}。', group: 'set' },
  { char: '⊃', latex: '\\supset', read: '真包含', mean: 'A ⊃ B 表示 A 真包含 B。', group: 'set' },
  { char: '⊇', latex: '\\supseteq', read: '包含（允许相等）', mean: 'A ⊇ B 表示 B 是 A 的子集。', group: 'set' },
  { char: '∖', latex: '\\setminus', read: '差集', mean: 'A ∖ B = {x | x ∈ A 且 x ∉ B}。', group: 'set' },
  { char: 'ℝ', latex: '\\mathbb{R}', read: '实数集', mean: '全体实数（amssymb 宏包）。', group: 'set' },
  { char: 'ℕ', latex: '\\mathbb{N}', read: '自然数集', mean: '自然数 0,1,2,…（部分教材从 1 起）。', group: 'set' },
  { char: 'ℤ', latex: '\\mathbb{Z}', read: '整数集', mean: '全体整数（德语 Zahlen）。', group: 'set' },
  { char: 'ℚ', latex: '\\mathbb{Q}', read: '有理数集', mean: '全体有理数（商数 quotient）。', group: 'set' },
  { char: 'ℂ', latex: '\\mathbb{C}', read: '复数集', mean: 'a + bi 形式的全体复数。', group: 'set' },
  // —— 逻辑 7 ——
  { char: '∀', latex: '\\forall', read: '任意（对所有）', mean: '全称量词：∀x，x² ≥ 0。', group: 'logic' },
  { char: '∃', latex: '\\exists', read: '存在', mean: '存在量词：∃x > 0 使等式成立。', group: 'logic' },
  { char: '¬', latex: '\\neg', read: '非（否定）', mean: '¬P 表示命题 P 不成立。', group: 'logic' },
  { char: '∧', latex: '\\land', read: '且（合取）', mean: 'P ∧ Q 表示两者同时成立（也写作 \\wedge）。', group: 'logic' },
  { char: '∨', latex: '\\lor', read: '或（析取）', mean: 'P ∨ Q 表示至少一个成立（也写作 \\vee）。', group: 'logic' },
  { char: '⇒', latex: '\\Rightarrow', read: '推出（蕴含）', mean: 'P ⇒ Q：由 P 可推出 Q。', group: 'logic' },
  { char: '⇔', latex: '\\Leftrightarrow', read: '当且仅当（等价）', mean: 'P ⇔ Q：互为充要条件。', group: 'logic' },
  // —— 几何 8 ——
  { char: '∠', latex: '\\angle', read: '角', mean: '∠ABC 表示以 B 为顶点的角。', group: 'geom' },
  { char: '⊥', latex: '\\perp', read: '垂直', mean: 'l₁ ⊥ l₂：两线垂直成 90°。', group: 'geom' },
  { char: '∥', latex: '\\parallel', read: '平行', mean: 'AB ∥ CD：两线平行。', group: 'geom' },
  { char: '≅', latex: '\\cong', read: '全等于', mean: '两图形全等：△ABC ≅ △DEF。', group: 'geom' },
  { char: '∼', latex: '\\sim', read: '相似', mean: '△ABC ∼ △A′B′C′；概率中也表「服从分布」。', group: 'geom' },
  { char: '△', latex: '\\triangle', read: '三角形', mean: '△ABC 表示以 A、B、C 为顶点的三角形。', group: 'geom' },
  { char: '○', latex: '\\bigcirc', read: '圆', mean: '○O 表示以 O 为圆心的圆。', group: 'geom' },
  { char: '°', latex: '^\\circ', read: '度（角度）', mean: '直角 90°；温度单位 °C 也用度。', group: 'geom' },
  // —— 希腊字母 28 ——
  { char: 'α', latex: '\\alpha', read: '阿尔法', mean: '角度、系数、显著性水平（α = 0.05）。', group: 'greek' },
  { char: 'β', latex: '\\beta', read: '贝塔', mean: '系数/回归参数、β 射线。', group: 'greek' },
  { char: 'γ', latex: '\\gamma', read: '伽马', mean: 'γ 射线、比热比、伽马分布。', group: 'greek' },
  { char: 'δ', latex: '\\delta', read: '德尔塔（小写）', mean: '微小变化量、狄拉克函数 δ(x)。', group: 'greek' },
  { char: 'ε', latex: '\\epsilon', read: '艾普西隆', mean: '无穷小量、介电常数、误差限。', group: 'greek' },
  { char: 'ζ', latex: '\\zeta', read: '泽塔', mean: '阻尼比、黎曼 ζ 函数。', group: 'greek' },
  { char: 'η', latex: '\\eta', read: '伊塔', mean: '效率、磁滞系数。', group: 'greek' },
  { char: 'θ', latex: '\\theta', read: '西塔', mean: '角度的标准记号：θ = 45°。', group: 'greek' },
  { char: 'ι', latex: '\\iota', read: '约塔', mean: '微小量记号（少用）。', group: 'greek' },
  { char: 'κ', latex: '\\kappa', read: '卡帕', mean: '曲率、热导率、介电常数。', group: 'greek' },
  { char: 'λ', latex: '\\lambda', read: '兰姆达', mean: '波长、泊松分布参数、特征值。', group: 'greek' },
  { char: 'μ', latex: '\\mu', read: '谬（mu）', mean: '均值、摩擦系数、磁导率；微（10⁻⁶）前缀。', group: 'greek' },
  { char: 'ν', latex: '\\nu', read: '纽', mean: '频率（物理）、泊松比、自由度。', group: 'greek' },
  { char: 'ξ', latex: '\\xi', read: '克西', mean: '随机变量、坐标分量。', group: 'greek' },
  { char: 'ο', latex: '\\omicron', read: '奥米克戎', mean: '很少单独使用（与拉丁字母 o 区分）。', group: 'greek' },
  { char: 'π', latex: '\\pi', read: '派', mean: '圆周率 ≈ 3.14159；素数计数函数 π(x)。', group: 'greek' },
  { char: 'ρ', latex: '\\rho', read: '柔', mean: '密度、电阻率、相关系数 ρ。', group: 'greek' },
  { char: 'σ', latex: '\\sigma', read: '西格玛（小写）', mean: '标准差、电导率；求和记号见大写 Σ。', group: 'greek' },
  { char: 'τ', latex: '\\tau', read: '套', mean: '切应力、时间常数、τ = 2π 的圆周率记号。', group: 'greek' },
  { char: 'υ', latex: '\\upsilon', read: '宇普西隆', mean: '位移、频率（物理少用）。', group: 'greek' },
  { char: 'φ', latex: '\\phi', read: '斐（phi）', mean: '角度、黄金分割比（≈1.618）、相位。', group: 'greek' },
  { char: 'χ', latex: '\\chi', read: '卡伊', mean: '卡方分布 χ²、磁化率。', group: 'greek' },
  { char: 'ψ', latex: '\\psi', read: '普赛', mean: '波函数（量子力学）、流函数。', group: 'greek' },
  { char: 'ω', latex: '\\omega', read: '欧米伽（小写）', mean: '角速度、角频率。', group: 'greek' },
  { char: 'Γ', latex: '\\Gamma', read: '大伽马', mean: '伽马函数 Γ(n) = (n−1)!。', group: 'greek' },
  { char: 'Σ', latex: '\\Sigma', read: '大西格玛', mean: '求和记号（大写）：Σᵢ aᵢ。', group: 'greek' },
  { char: 'Φ', latex: '\\Phi', read: '大斐', mean: '磁通量、标准正态分布函数 Φ(x)。', group: 'greek' },
  { char: 'Ω', latex: '\\Omega', read: '大欧米伽', mean: '欧姆（电阻单位）、立体角、复杂度下界 Ω(n)。', group: 'greek' },
  // —— 概率统计 7 ——
  { char: 'P(x)', latex: 'P(x)', read: 'P（概率）', mean: '事件或取值的概率：P(A) = 0.5、P(X = 3)。', group: 'stat' },
  { char: 'E(X)', latex: '\\mathrm{E}(X)', read: '期望', mean: '数学期望：E(X) = Σ xᵢpᵢ。', group: 'stat' },
  { char: 'Var(X)', latex: '\\mathrm{Var}(X)', read: '方差', mean: '方差：Var(X) = E((X − E(X))²)。', group: 'stat' },
  { char: 'σ', latex: '\\sigma', read: '标准差（统计语境）', mean: 'σ = √Var(X)，衡量数据离散程度。', group: 'stat' },
  { char: 'μ', latex: '\\mu', read: '均值（统计语境）', mean: '总体均值/期望：正态分布 N(μ, σ²) 的中心。', group: 'stat' },
  { char: '~', latex: '\\sim', read: '服从（分布）', mean: 'X ~ N(μ, σ²) 表示 X 服从正态分布。', group: 'stat' },
  { char: 'N(μ,σ²)', latex: '\\mathcal{N}(\\mu,\\sigma^2)', read: '正态分布', mean: '均值为 μ、方差为 σ² 的正态分布（高斯分布）。', group: 'stat' },
  // —— 其他 9 ——
  { char: '∞', latex: '\\infty', read: '无穷大', mean: '无限延伸：区间 (−∞, +∞)、极限 lim。', group: 'misc' },
  { char: 'π', latex: '\\pi', read: '派（圆周率）', mean: '圆周率 π ≈ 3.14159，圆周长与直径之比。', group: 'misc' },
  { char: 'e', latex: 'e', read: '自然常数（欧拉数）', mean: 'e ≈ 2.71828，自然对数的底。', group: 'misc' },
  { char: '%', latex: '\\%', read: '百分号', mean: '百分比：50% = 0.5。', group: 'misc' },
  { char: '‰', latex: '\\textperthousand', read: '千分号', mean: '千分比：5‰ = 0.005（textcomp 宏包）。', group: 'misc' },
  { char: '′', latex: "\\prime", read: '撇（角分/导数）', mean: '角度单位「分」；函数导数 f′(x)。', group: 'misc' },
  { char: '″', latex: "\\prime\\prime", read: '双撇（角秒）', mean: '角度单位「秒」；二阶导数 f″(x)；英寸记号。', group: 'misc' },
  { char: '∴', latex: '\\therefore', read: '所以', mean: '由前件推出结论：∵…，∴…。', group: 'misc' },
  { char: '∵', latex: '\\because', read: '因为', mean: '引出推理的前提。', group: 'misc' }
]

// 分组元信息
const GROUP_META = {
  relation: { label: '关系' },
  op: { label: '运算' },
  set: { label: '集合' },
  logic: { label: '逻辑' },
  geom: { label: '几何' },
  greek: { label: '希腊字母' },
  stat: { label: '概率统计' },
  misc: { label: '其他' }
}
const GROUPS = ['relation', 'op', 'set', 'logic', 'geom', 'greek', 'stat', 'misc']

// 搜索：读法/含义/LaTeX/字符/组名 归一小写包含匹配
function matchSymbol(s, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true
  return [s.char, s.latex, s.read, s.mean, s.group, (GROUP_META[s.group] && GROUP_META[s.group].label) || '']
    .join(' ').toLowerCase().includes(q)
}

function filterSymbols(rows, group, query) {
  return rows.filter((s) => (group === 'all' || s.group === group) && matchSymbol(s, query))
}

function groupLabelOf(g) {
  return (GROUP_META[g] && GROUP_META[g].label) || g
}
// ===== DATA-END =====

// ---------- UI 常量 ----------
const GROUP_TABS = [
  { id: 'all', label: '全部' },
  ...GROUPS.map((g) => ({ id: g, label: GROUP_META[g].label }))
]
GROUP_TABS.forEach((tab) => {
  tab.count = tab.id === 'all' ? SYMBOLS.length : SYMBOLS.filter((s) => s.group === tab.id).length
})

// ---------- 响应式状态 ----------
const searchQuery = ref('')
const activeGroup = ref('all')

// ---------- 派生 ----------
const filteredSymbols = computed(() => filterSymbols(SYMBOLS, activeGroup.value, searchQuery.value))
const activeGroupLabel = computed(() => {
  const tab = GROUP_TABS.find((t) => t.id === activeGroup.value)
  return (tab && tab.label) || '数学符号总表'
})

// ---------- 交互（浏览器 API 仅在回调内，SSR 安全） ----------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制')
    trackEvent('工具结果', '复制', 'math-symbol-reference')
  } catch (err) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      alert(ok ? '已复制' : '复制失败，请手动选择复制')
    } catch (err2) {
      alert('复制失败，请手动选择复制')
    }
  }
}

function copyChar(s) {
  copyText(s.char)
}

function copyLatex(s) {
  copyText(s.latex)
}

onMounted(() => {
  addRecentTool('math-symbol-reference')
})
</script>

<style scoped>
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  .no-print {
    display: none !important;
  }
}
</style>
