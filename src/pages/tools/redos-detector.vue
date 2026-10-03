<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Bug class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">ReDoS风险检测器</h1>
          <p class="text-sm text-muted-foreground mt-1">静态启发式分析正则表达式的灾难性回溯风险</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴正则表达式（支持 /pattern/flags 形式），自动检测嵌套量词、可重叠分支、大边界重复、相邻可变片段四类 ReDoS 高危模式，给出风险等级、命中片段、原因解释与修复建议。纯静态分析，不会用长文本实际执行你的正则。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Terminal class="w-5 h-5 mr-2 text-primary" /> 正则表达式
          </h2>
          <textarea
            v-model="regexInput"
            class="w-full h-28 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="/(a+)+$/ 或裸写：^(a|aa)+$"
            spellcheck="false"
          ></textarea>
          <p class="text-xs text-muted-foreground mt-2">支持 /pattern/flags 形式（g i m s u y），也支持裸 pattern；输入后实时分析</p>

          <!-- 示例 -->
          <div class="mt-4">
            <label class="block text-sm font-medium text-foreground mb-2">高危示例</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="ex in examples"
                :key="ex"
                @click="loadExample(ex)"
                class="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-mono transition-all"
              >{{ ex }}</button>
            </div>
          </div>

          <button
            @click="clearAll"
            class="w-full mt-4 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-3.5 h-3.5" /> 清空重新分析
          </button>
        </div>

        <!-- 检测规则说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 检测规则说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">嵌套量词</span>：量词直接套在内部已含量词的分组上，如 (a+)+、(a*)*b，回溯呈指数级</li>
            <li>• <span class="text-foreground">重叠分支</span>：量词作用在可匹配相同输入的分支上，如 (a|aa)+，产生大量等价回溯路径</li>
            <li>• <span class="text-foreground">大边界重复</span>：{1,9999} 这类超大边界，展开后中间状态极多，嵌套时更危险</li>
            <li>• <span class="text-foreground">相邻可变片段</span>：多段可变长度片段（\d+\w* 类）相邻，边界归属不唯一，回溯为多项式级</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 语法校验 -->
        <div v-if="analysis" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <CheckCircle class="w-4 h-4 mr-2 text-primary" /> 基础校验
          </h3>
          <div v-if="analysis.syntaxOk" class="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>正则语法有效<span v-if="analysis.flags" class="text-muted-foreground">，flags：/{{ analysis.flags }}</span></span>
          </div>
          <div v-else class="flex items-start gap-2">
            <XCircle class="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="text-destructive font-medium">无法编译该正则</p>
              <p class="text-xs text-muted-foreground mt-1 font-mono break-all">{{ analysis.syntaxMsg }}</p>
              <p v-if="analysis.lookbehindHint" class="text-xs text-yellow-500 mt-1.5">
                提示：可能是当前浏览器不支持 lookbehind 断言（(?&lt;= …) / (?&lt;! …)），旧版 Safari 与部分移动端环境不支持该语法。
              </p>
            </div>
          </div>
        </div>

        <!-- 风险总览 -->
        <div v-if="analysis" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-foreground flex items-center">
              <AlertTriangle class="w-4 h-4 mr-2 text-primary" /> 风险总览
            </h3>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded"
              :class="overallBadgeClass"
            >{{ overallLabel }}</span>
          </div>
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold" :class="analysis.counts.high ? 'text-destructive' : 'text-foreground'">{{ analysis.counts.high }}</p>
              <p class="text-xs text-muted-foreground">高危</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold" :class="analysis.counts.mid ? 'text-yellow-500' : 'text-foreground'">{{ analysis.counts.mid }}</p>
              <p class="text-xs text-muted-foreground">中危</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ analysis.counts.low }}</p>
              <p class="text-xs text-muted-foreground">低危</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            {{ summaryText }}
          </p>
        </div>

        <!-- 命中明细 -->
        <div v-if="analysis && analysis.findings.length" class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border">
            <h3 class="text-sm font-semibold text-foreground flex items-center">
              <Bug class="w-4 h-4 mr-2 text-primary" /> 命中明细（{{ analysis.findings.length }} 处）
            </h3>
          </div>
          <div class="divide-y divide-border/50">
            <div
              v-for="(f, idx) in analysis.findings"
              :key="idx"
              class="px-6 py-4 border-l-4"
              :class="levelMeta[f.level].border"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium px-2 py-0.5 rounded" :class="levelMeta[f.level].badge">{{ levelMeta[f.level].label }}</span>
                <span class="text-[10px] text-muted-foreground">位置 {{ f.start }}-{{ f.end }}</span>
              </div>
              <p class="font-mono text-xs break-all mb-2">
                <span class="text-muted-foreground">{{ patternSource.slice(0, f.start) }}</span>
                <span :class="levelMeta[f.level].highlight">{{ patternSource.slice(f.start, f.end) }}</span>
                <span class="text-muted-foreground">{{ patternSource.slice(f.end) }}</span>
              </p>
              <p class="text-xs text-muted-foreground leading-relaxed mb-1.5">{{ f.reason }}</p>
              <p class="text-xs text-foreground leading-relaxed flex items-start gap-1.5">
                <ArrowRight class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>{{ f.fix }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="analysis && !analysis.findings.length && analysis.syntaxOk" class="bg-card border border-border rounded-lg p-6">
          <div class="py-8 text-center">
            <CheckCircle class="w-10 h-10 mx-auto mb-3 text-green-500" />
            <p class="text-sm font-medium text-foreground mb-1">未命中已知高危模式</p>
            <p class="text-xs text-muted-foreground">静态启发式分析无法覆盖所有情况，上线前仍建议对长输入做一次真实压测。</p>
          </div>
        </div>

        <div v-if="!analysis" class="bg-card border border-border rounded-lg p-6">
          <div class="py-12 text-center">
            <Bug class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">输入正则表达式后，这里会显示风险分析结果</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>什么是ReDoS灾难性回溯</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            ReDoS（Regular Expression Denial of Service，正则拒绝服务）是一种特殊的资源耗尽攻击：正则表达式本身逻辑正确，但面对特定输入时，回溯型引擎会尝试指数级数量的匹配路径，一次匹配从毫秒级膨胀到数小时甚至数天，进程被这一个请求拖死。2019 年 Cloudflare 的全球宕机事件，起因就是一条上线九年的正则在新规则触发下发生了灾难性回溯。
          </p>
          <h3 class="text-lg font-semibold text-foreground">经典案例：(a+)+$</h3>
          <p>
            用 <code class="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs font-mono">(a+)+$</code> 去匹配 30 个 a 加一个感叹号（aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!）：由于结尾的感叹号永远无法匹配，引擎会不断尝试把前面的 a 重新划分给内外两层量词——每一层都有「取多少个 a」的 free choice，路径总数约为 2 的 30 次方。这就是嵌套量词 (a+)+、(a*)*b、(a|aa)+ 被称为「正则地雷」的原因：模式合法、测试通过，只在恶意输入时引爆。
          </p>
          <h3 class="text-lg font-semibold text-foreground">防御手段</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>评审正则时重点检查嵌套量词与重叠分支，本工具的四条启发式规则即来源于此</li>
            <li>无法改写时，用排除字符类把「循环+切分」重构为「一次线性匹配」，如 (a+)+$ 处理无空白场景可改写为 [^\s]*$</li>
            <li>新版 JavaScript 引擎支持原子组 (?>…) 与占有量词 a++、a*+，可直接消除内层回溯；旧环境则应重构模式</li>
            <li>对用户输入的长度设上限，给正则匹配加超时（如 re2、rust regex 等无回溯引擎天然免疫）</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">会执行我的正则吗？</span>只用 new RegExp 做一次语法编译校验，不会将其运行于任何文本，更不会构造恶意输入。</li>
            <li><span class="text-foreground font-medium">没有命中就一定安全吗？</span>不是。启发式只能覆盖已知模式形态，复杂正则建议结合真实数据压测与超时保护。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'redos-detector'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Bug, Terminal, AlertTriangle, CheckCircle, XCircle, Info, ArrowRight,
  RefreshCw, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'ReDoS风险检测器 - 正则表达式灾难性回溯在线检测',
  description: '在线ReDoS检测工具，静态分析正则表达式的灾难性回溯风险：嵌套量词、重叠分支、大边界重复、相邻可变片段，给出风险等级与修复建议，纯本地分析不执行正则',
  keywords: 'redos, 正则检测, 灾难性回溯, 嵌套量词, 正则性能, 正则风险, catastrophic backtracking',
  author: 'Util工具箱',
  ogTitle: 'ReDoS风险检测器 - 有条工具',
  ogDescription: '静态启发式分析正则表达式的灾难性回溯风险',
  ogUrl: 'https://www.util.cn/tools/redos-detector',
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
          name: 'ReDoS风险检测器',
          url: 'https://www.util.cn/tools/redos-detector',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['嵌套量词检测', '重叠分支检测', '大边界重复检测', '语法编译校验']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'ReDoS风险检测器', item: 'https://www.util.cn/tools/redos-detector/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '什么是ReDoS灾难性回溯？',
              acceptedAnswer: { '@type': 'Answer', text: '正则表达式面对特定输入时，回溯型引擎会尝试指数级数量的匹配路径，一次匹配耗时从毫秒膨胀到数小时，导致服务不可用，典型模式如 (a+)+$。' }
            },
            {
              '@type': 'Question',
              name: '检测器会执行我的正则吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。工具只做纯静态分析与一次语法编译校验，不会将正则运行于任何文本。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'redos-detector')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const regexInput = ref('')
const seoContentVisible = ref(true)

const examples = ['/(a+)+$/', '/^(a|aa)+$/', '/^(\\d*)*$/', '/(x+x+)+y/']

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const loadExample = (ex) => { regexInput.value = ex }
const clearAll = () => { regexInput.value = '' }

const levelMeta = {
  high: {
    label: '高危',
    border: 'border-destructive',
    badge: 'bg-destructive/10 text-destructive',
    highlight: 'bg-destructive/10 text-destructive rounded px-0.5'
  },
  mid: {
    label: '中危',
    border: 'border-yellow-500',
    badge: 'bg-yellow-500/10 text-yellow-500',
    highlight: 'bg-yellow-500/10 text-yellow-500 rounded px-0.5'
  },
  low: {
    label: '低危',
    border: 'border-border',
    badge: 'bg-muted text-muted-foreground',
    highlight: 'bg-muted text-foreground rounded px-0.5'
  }
}

// ---------- 正则微型解析器（构建节点树，纯静态、不执行） ----------
const tokenizeRegex = (src) => {
  let i = 0
  const parseSeq = (stopChar) => {
    const nodes = []
    while (i < src.length) {
      const ch = src[i]
      if (stopChar && ch === stopChar) break
      const start = i
      let node
      if (ch === '\\') {
        let end = Math.min(i + 2, src.length)
        if (src[i + 1] === 'u' && src[i + 2] === '{') {
          const j = src.indexOf('}', i + 3)
          end = j > -1 ? j + 1 : src.length
        }
        node = { type: 'escape', text: src.slice(start, end), start, end }
        i = end
      } else if (ch === '[') {
        let j = i + 1
        if (src[j] === '^') j++
        if (src[j] === ']') j++
        while (j < src.length && src[j] !== ']') { if (src[j] === '\\') j++; j++ }
        const end = Math.min(j + 1, src.length)
        node = { type: 'class', text: src.slice(start, end), start, end }
        i = end
      } else if (ch === '(') {
        node = { type: 'group', start, children: [], head: '(' }
        i++
        if (src[i] === '?') {
          const n1 = src[i + 1]
          if (n1 === ':') { node.head = '(?:'; i += 2 }
          else if (n1 === '=' || n1 === '!') { node.head = src.slice(i, i + 2); node.lookaround = true; i += 2 }
          else if (n1 === '<' && (src[i + 2] === '=' || src[i + 2] === '!')) { node.head = src.slice(i, i + 3); node.lookaround = true; i += 3 }
          else if (n1 === '<') {
            const j = src.indexOf('>', i + 2)
            if (j > -1) { node.head = src.slice(i, j + 1); i = j + 1 }
            else { node.head = '(?<'; i += 1 }
          }
          else if (n1 === '>') { node.head = '(?>'; node.atomic = true; i += 2 }
          else { node.head = '(?'; i += 1 }
        }
        node.children = parseSeq(')')
        if (src[i] === ')') { node.closed = true; i++ } else { node.closed = false }
        node.end = i
      } else if (ch === '|') {
        node = { type: 'alt', text: '|', start, end: i + 1 }
        i++
      } else {
        node = { type: ch === '.' ? 'dot' : (ch === '^' || ch === '$' ? 'anchor' : 'char'), text: ch, start, end: i + 1 }
        i++
      }
      // 量词（{…} 不符合量词语法时按字面量处理）
      let q = null
      if (i < src.length) {
        const c = src[i]
        if (c === '*' || c === '+') { q = c; i++ }
        else if (c === '?') { q = '?'; i++ }
        else if (c === '{') {
          const m = /^\{(\d+)(,(\d+)?)?\}/.exec(src.slice(i))
          if (m) { q = m[0]; i += m[0].length }
        }
      }
      if (q) {
        if (src[i] === '?') { node.lazy = true; i++ }
        node.quantifier = q
      }
      nodes.push(node)
    }
    return nodes
  }
  return parseSeq(null)
}

const quantInfo = (q) => {
  if (q === '*') return { min: 0, max: Infinity, raw: q }
  if (q === '+') return { min: 1, max: Infinity, raw: q }
  if (q === '?') return { min: 0, max: 1, raw: q }
  const m = /^\{(\d+)(,(\d+)?)?\}$/.exec(q)
  if (!m) return { min: 1, max: 1, raw: q }
  const min = Number(m[1])
  const max = m[2] === undefined ? min : (m[3] === undefined ? Infinity : Number(m[3]))
  return { min, max, raw: q }
}

const splitBranches = (nodes) => {
  const branches = [[]]
  for (const n of nodes) {
    if (n.type === 'alt') branches.push([])
    else branches[branches.length - 1].push(n)
  }
  return branches
}

// 分支开头的字面量序列（用于重叠判断；类/点/不定转义视为通配）
const ESCAPE_LITERALS = /[.*+?^${}()|[\]\\]/
const ESCAPE_WILDCARDS = /[dwsDWSbB]/

const leadingLiteral = (branch) => {
  let s = ''
  for (const n of branch) {
    if (n.type === 'char') { s += n.text; continue }
    if (n.type === 'escape' && n.text.length === 2 && ESCAPE_LITERALS.test(n.text[1])) { s += n.text[1]; continue }
    break
  }
  return s
}

const startsWildcard = (n) => {
  if (!n) return false
  if (n.type === 'dot' || n.type === 'class') return true
  if (n.type === 'escape' && n.text.length === 2 && ESCAPE_WILDCARDS.test(n.text[1])) return true
  return false
}

const nodeDisplay = (n) => {
  let text = n.type === 'group' ? '(…)' : (n.text || '')
  if (n.quantifier) text += n.quantifier
  return text
}

// ---------- 静态启发式分析 ----------
const analyzePattern = (pattern) => {
  const findings = []
  const root = tokenizeRegex(pattern)

  const walk = (nodes, insideQuantified) => {
    let runLen = 0
    let runStart = 0
    let runEnd = 0
    let runExamples = []
    const flushRun = () => {
      if (runLen >= 2) {
        const level = runLen >= 3 ? 'mid' : 'low'
        const exText = runExamples.slice(0, 3).join('、')
        findings.push({
          level,
          start: runStart,
          end: runEnd,
          reason: runLen >= 3
            ? `连续 ${runLen} 段可变长度片段（${exText}）相邻，边界归属不唯一；匹配失败时引擎要尝试这些片段之间的所有长度组合，回溯次数为各片段长度的乘积（多项式级），长输入下依然可观。`
            : `两段可变长度片段（${exText}）相邻，存在回溯组合空间，多数场景可接受，但长输入与失败场景下值得留意。`,
          fix: `在片段之间加入确定的分隔符或锚点（^ $ \\b）、缩小字符类范围，让边界唯一；新引擎可用占有量词（如 \\d++）消除回溯。`
        })
      }
      runLen = 0
      runExamples = []
    }
    for (const n of nodes) {
      if (n.type === 'alt') { flushRun(); continue }
      const qi = n.quantifier ? quantInfo(n.quantifier) : null

      // 规则③：大边界重复
      if (qi && qi.raw.startsWith('{') && (qi.min >= 100 || qi.max >= 100)) {
        findings.push({
          level: insideQuantified ? 'high' : 'mid',
          start: n.start,
          end: n.end,
          reason: insideQuantified
            ? `超大边界量词 ${qi.raw} 出现在量词分组内部：外层每次迭代都会展开大量中间状态，回溯路径呈乘积级放大，属于高危组合。`
            : `超大边界量词 ${qi.raw} 会展开产生大量中间匹配状态；若匹配最终失败或与其他可变片段组合，回溯成本会成倍放大。`,
          fix: `用更精确的边界（如 \\d{1,4}）替代超大重复；把「重复+再重复」重构为排除字符类一次匹配到底（如 [^x]*），并对输入长度做上限校验。`
        })
      }

      // 规则①②：量词分组的嵌套量词 / 重叠分支
      if (n.type === 'group' && n.quantifier && !n.lookaround && !n.atomic) {
        const qo = quantInfo(n.quantifier)
        if (qo.max > 1) {
          const inner = n.children.find(c => c.quantifier && c.type !== 'anchor' && c.type !== 'alt')
          if (inner) {
            const bothEmpty = qo.min === 0 && quantInfo(inner.quantifier).min === 0
            findings.push({
              level: 'high',
              start: n.start,
              end: n.end,
              reason: `量词「${n.quantifier}」直接套在内部已含量词「${inner.quantifier}」的表达式上：匹配失败时引擎会在两层量词之间反复回溯，路径总数随输入长度呈指数级增长，是教科书级的 ReDoS 模式${bothEmpty ? '；内外层都可匹配空串，还存在空匹配循环风险' : ''}。`,
              fix: `优先重构为线性结构：用排除字符类替代内层量词（如 [^x]* 一次匹配到底）；新引擎可改用原子组 (?>…) 或占有量词（如 a++、a*+）直接消除内层回溯；无法改写时必须限制输入长度并加匹配超时。`
            })
          } else {
            const branches = splitBranches(n.children)
            if (branches.length >= 2) {
              let overlap = null
              outer:
              for (let a = 0; a < branches.length && !overlap; a++) {
                for (let b = a + 1; b < branches.length; b++) {
                  const la = leadingLiteral(branches[a])
                  const lb = leadingLiteral(branches[b])
                  if (la && lb && (la[0] === lb[0] || la.startsWith(lb) || lb.startsWith(la))) {
                    overlap = { descA: la || '（通配）', descB: lb || '（通配）', wildcard: false }
                    break outer
                  }
                  if (startsWildcard(branches[a][0]) && (branches[b].length > 0)) {
                    overlap = { descA: nodeDisplay(branches[a][0]), descB: lb || nodeDisplay(branches[b][0]), wildcard: true }
                    break outer
                  }
                  if (startsWildcard(branches[b][0]) && (branches[a].length > 0)) {
                    overlap = { descA: la || nodeDisplay(branches[a][0]), descB: nodeDisplay(branches[b][0]), wildcard: true }
                    break outer
                  }
                }
              }
              if (overlap) {
                findings.push({
                  level: overlap.wildcard ? 'mid' : (qo.max === Infinity ? 'high' : 'mid'),
                  start: n.start,
                  end: n.end,
                  reason: `量词「${n.quantifier}」作用在可重叠的分支上（分支「${overlap.descA}」与「${overlap.descB}」可匹配到相同输入${overlap.wildcard ? '，其中含通配片段' : ''}）：迭代匹配失败时会产生大量等价回溯路径，典型如 (a|aa)+ 面对全 a 输入时退化为指数级回溯。`,
                  fix: `把更长、更具体的分支放在前面并让分支互斥（如 (aa|a) 或直接合并为 a+）；新引擎可用原子组 (?>…) 包住分支组；或重构为排除字符类规避分支。`
                })
              }
            }
          }
        }
      }

      // 规则④：相邻可变长度片段
      if (qi && qi.max > 1 && (n.type === 'class' || n.type === 'dot' || n.type === 'escape')) {
        if (runLen === 0) { runStart = n.start }
        runLen++
        runEnd = n.end
        runExamples.push(nodeDisplay(n))
      } else if (n.type !== 'anchor') {
        flushRun()
      }

      if (n.children) walk(n.children, insideQuantified || !!n.quantifier)
    }
    flushRun()
  }

  walk(root, false)

  const rank = { high: 0, mid: 1, low: 2 }
  findings.sort((a, b) => rank[a.level] - rank[b.level] || a.start - b.start)
  return findings
}

// ---------- 输入识别与总览 ----------
const detectRegexSource = (raw) => {
  const s = String(raw || '').trim()
  if (!s) return { pattern: '', flags: '' }
  if (s.length > 2 && s[0] === '/') {
    const last = s.lastIndexOf('/')
    if (last > 0) return { pattern: s.slice(1, last), flags: s.slice(last + 1).replace(/[^gimsuy]/g, '') }
  }
  return { pattern: s, flags: '' }
}

const patternSource = computed(() => detectRegexSource(regexInput.value).pattern)

const analysis = computed(() => {
  const raw = regexInput.value
  if (!raw.trim()) return null
  const { pattern, flags } = detectRegexSource(raw)
  if (!pattern) return null

  let syntaxOk = true
  let syntaxMsg = ''
  let lookbehindHint = false
  try {
    new RegExp(pattern, flags)
  } catch (e) {
    syntaxOk = false
    syntaxMsg = e.message || '正则表达式无法编译'
    if (/lookbehind|invalid group|后行/i.test(syntaxMsg)) lookbehindHint = true
  }

  const findings = syntaxOk ? analyzePattern(pattern) : []
  const counts = {
    high: findings.filter(f => f.level === 'high').length,
    mid: findings.filter(f => f.level === 'mid').length,
    low: findings.filter(f => f.level === 'low').length
  }
  const hasAnchors = /[\^$]/.test(pattern)
  return { pattern, flags, syntaxOk, syntaxMsg, lookbehindHint, findings, counts, hasAnchors }
})

const overallLabel = computed(() => {
  const a = analysis.value
  if (!a) return ''
  if (!a.syntaxOk) return '语法错误'
  if (a.counts.high) return '整体高危'
  if (a.counts.mid) return '整体中危'
  if (a.counts.low) return '整体低危'
  return '未发现风险'
})

const overallBadgeClass = computed(() => {
  const a = analysis.value
  if (!a) return ''
  if (!a.syntaxOk) return 'bg-destructive/10 text-destructive'
  if (a.counts.high) return 'bg-destructive/10 text-destructive'
  if (a.counts.mid) return 'bg-yellow-500/10 text-yellow-500'
  return 'bg-muted text-muted-foreground'
})

const summaryText = computed(() => {
  const a = analysis.value
  if (!a) return ''
  if (!a.syntaxOk) return '请先修正语法错误，再做风险分析。'
  const parts = []
  if (a.counts.high) parts.push(`发现 ${a.counts.high} 处高危模式（嵌套量词或可指数级回溯的重叠分支），建议优先重构`)
  else if (a.counts.mid) parts.push('未发现指数级回溯模式，但存在多项式级回溯点，长输入下仍可能变慢')
  else if (a.counts.low) parts.push('仅有少量低风险回溯点，通常无需处理')
  else parts.push('四条启发式规则均未命中')
  if (a.hasAnchors) parts.push('模式包含行首/行尾锚点（^ 或 $），能显著缩小回溯空间，是加分项')
  parts.push('本结果为静态启发式分析，仅供代码评审参考，不代表该正则一定可被实际利用。')
  return parts.join('。') + '。'
})
</script>
