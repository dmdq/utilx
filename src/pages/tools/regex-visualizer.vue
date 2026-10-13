<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Share class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">正则可视化图解</h1>
          <p class="text-sm text-muted-foreground mt-1">把正则表达式解析成分段结构图，评审讲解他人正则不再靠猜</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入正则表达式，本工具用内置解析器把它拆成嵌套结构盒：或分支上下堆叠、序列横向排布、量词在盒下标注重复次数、字符类展开集合卡、锚点用箭头标注起止；
        再配合测试字符串实时高亮匹配段，一眼看清每段正则各自负责什么。全部解析与匹配在浏览器本地完成。
      </p>
    </div>

    <!-- 支持语法范围提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        支持的可视化语法：<strong>字面字符</strong>、转义（\d \D \w \W \s \S \b \B \n \t \. 等常用转义）、
        <strong>字符类 [...]（范围 a-z 与取反 [^...]）</strong>、<strong>分组 (...) 与非捕获分组 (?:...)</strong>、
        量词 * + ? {n} {n,} {n,m}（含非贪婪 ?）、或 |、锚点 ^ $、点号 .。
        反向引用 \1、环视断言 (?=) (?!)(?&lt;=)(?&lt;!）、命名分组 (?&lt;name&gt;) 等暂不支持，会以灰色「暂不支持可视化」原样展示，不会报错。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 输入正则与测试文本
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">正则表达式</label>
          <textarea
            v-model="patternInput"
            rows="2"
            spellcheck="false"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 ^(\d{4})-(\d{2})$ 或 /1[3-9]\d{9}/"
          ></textarea>
          <p class="text-xs text-muted-foreground mt-1">若整体被 /.../ 包裹会自动剥离分隔符与标志位（如 /abc/i 按 abc 解析）</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">快速示例</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in presets"
              :key="p.label"
              @click="applyPreset(p)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
            >{{ p.label }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">测试字符串</label>
          <textarea
            v-model="testStr"
            rows="3"
            spellcheck="false"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入用于实测匹配的文本"
          ></textarea>
        </div>

        <!-- 匹配实测结果 -->
        <div class="bg-muted/50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-foreground flex items-center">
              <Play class="w-4 h-4 mr-1.5 text-primary" /> RegExp 实测
            </span>
            <span v-if="testResult && !testResult.error && !testResult.idle" class="text-xs text-muted-foreground">
              命中 {{ testResult.count }} 段
            </span>
          </div>
          <p v-if="!testResult || testResult.idle" class="text-xs text-muted-foreground">输入正则与测试字符串后开始实测</p>
          <p v-else-if="testResult.error" class="text-xs text-red-500 dark:text-red-400 font-mono break-all">{{ testResult.error }}</p>
          <template v-else>
            <p class="text-sm font-mono leading-6 break-all whitespace-pre-wrap text-foreground">
              <template v-for="(seg, i) in testResult.segs" :key="i">
                <mark v-if="seg.hit" class="bg-yellow-200 dark:bg-yellow-600/60 text-foreground rounded px-0.5">{{ seg.text }}</mark><span v-else>{{ seg.text }}</span>
              </template>
            </p>
            <p v-if="testResult.count === 0" class="text-xs text-muted-foreground mt-2">无匹配，试试简化正则或检查转义</p>
          </template>
        </div>
      </div>

      <!-- 可视化区 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center mb-4">
          <Share class="w-5 h-5 mr-2 text-primary" /> 结构图解
        </h2>

        <div v-if="parseResult && !parseResult.ok" class="text-sm text-red-500 dark:text-red-400">
          {{ parseResult.error }}
        </div>
        <div v-else-if="parseResult && parseResult.ast" class="overflow-x-auto">
          <RegexNodeView :node="parseResult.ast" />
          <p class="text-xs text-muted-foreground mt-4 leading-relaxed">
            阅读方式：从左到右按顺序拼接；嵌套边框表示分组归属；盒下方小字为量词；「或」分隔上下分支任选其一；灰色虚线盒为暂不支持可视化的原文片段。
          </p>
        </div>
        <div v-else class="text-sm text-muted-foreground">输入正则后自动生成图解</div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于正则可视化</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            正则表达式一行字符里塞进了字符、分组、重复与分支多重结构，读别人写的正则往往要靠脑内逐字符展开。
            可视化把它还原成嵌套盒子：分组是谁的边界、量词修饰谁、或分支有哪几条路，一眼即得，特别适合代码评审、教学讲解与调试复杂规则。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么要可视化正则</h3>
          <p>
            例如 ^(\d{4})-(\d{2})$ 拆开后是「行首锚点 → 捕获组#1（数字重复 4 次）→ 字面量 - → 捕获组#2（数字重复 2 次）→ 行尾锚点」五段，
            哪段限制格式、哪段用于提取一目了然；而 a|bc 的图解会明确显示两条分支是「a」或「bc」，避免误读成「ab 或 c」。
          </p>
          <h3 class="text-lg font-semibold text-foreground">本工具支持哪些语法</h3>
          <p>
            覆盖日常大多数场景：字面字符、常用转义（\d \w \s \b 及其大写、\n \t 等）、字符类（范围与取反）、捕获与非捕获分组、
            全部五种量词及非贪婪写法、或分支、^ $ 锚点与点号。反向引用、环视断言、命名分组等高级语法暂不支持，会原样以灰色盒展示，不会中断图解。
          </p>
          <h3 class="text-lg font-semibold text-foreground">匹配高亮是怎么测的</h3>
          <p>
            底部实测直接用浏览器原生 RegExp 按输入正则做全局匹配，命中的片段黄色高亮；
            若正则语法本身有错（如括号不配对），会显示原生报错信息而不是崩溃，方便对照修正。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">我的正则里有 (?=...) 为什么显示灰色？</span>环视断言、反向引用与命名分组暂在本工具支持范围之外，会以灰色「暂不支持可视化」盒原样保留，不影响其余部分解析。</li>
            <li><span class="text-foreground font-medium">量词作用在谁身上？</span>量词只修饰紧邻它的前一个单元（单个字符、转义、字符类或分组），图解中表现为包住该单元并在下方标注。</li>
            <li><span class="text-foreground font-medium">输入 /.../ 包裹的正则会怎样？</span>工具会自动剥离首尾分隔符与 i g m 等标志位，只解析中间的表达式本体。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'regex-visualizer'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h, defineComponent } from 'vue'
import {
  Share, Play, Lightbulb, AlertTriangle,
  ChevronUp, ChevronDown, ArrowLeft, ArrowRight
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '正则可视化图解 - 正则表达式结构解析工具',
  description: '在线正则可视化工具，把正则表达式解析成嵌套分段结构图：分组、量词、或分支、字符类、锚点逐段图解，配合测试字符串实时高亮匹配段，纯本地计算',
  keywords: '正则可视化, 正则图解, regex可视化, 正则表达式图, 正则解析, 正则调试',
  author: 'Util工具箱',
  ogTitle: '正则可视化图解 - 有条工具',
  ogDescription: '正则表达式解析成分段结构图，评审讲解不再靠猜',
  ogUrl: 'https://www.util.cn/tools/regex-visualizer',
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
          name: '正则可视化图解',
          url: 'https://www.util.cn/tools/regex-visualizer',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['正则结构树图解', '分组量词或分支可视化', '字符类集合卡', '锚点起止标注', '测试串匹配高亮', '不支持语法原样保留']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '正则可视化图解', item: 'https://www.util.cn/tools/regex-visualizer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '我的正则里有(?=...)为什么显示灰色？',
              acceptedAnswer: { '@type': 'Answer', text: '环视断言、反向引用与命名分组暂在支持范围之外，会以灰色「暂不支持可视化」盒原样保留，不影响其余部分解析。' }
            },
            {
              '@type': 'Question',
              name: '量词作用在谁身上？',
              acceptedAnswer: { '@type': 'Answer', text: '量词只修饰紧邻的前一个单元（字符、转义、字符类或分组），图解中包住该单元并在下方标注。' }
            },
            {
              '@type': 'Question',
              name: '输入 /.../ 包裹的正则会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '工具自动剥离首尾分隔符与标志位，只解析中间的表达式本体。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'regex-visualizer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 正则子集解析纯函数（可独立提取测试） =====
// 支持语法：字面字符、转义（\d \D \w \W \s \S \b \B \n \r \t \f \v \0 \xHH \uHHHH 与标点转义）、
// 字符类 [...]（范围与取反）、分组 (...) 与 (?:...)、量词 * + ? {n} {n,} {n,m}（含非贪婪 ?）、
// 或 |、锚点 ^ $、点号 .。
// 不支持语法（反向引用、环视、命名分组等）解析为 unsupported 节点原样保留，全程不抛异常。
const ESCAPE_MEANINGS = {
  d: '数字 0-9', D: '非数字', w: '单词字符', W: '非单词字符',
  s: '空白字符', S: '非空白字符', b: '单词边界', B: '非单词边界',
  n: '换行符', r: '回车符', t: '制表符', f: '换页符', v: '垂直制表符', '0': '空字符'
}

function parseRegex(input) {
  const src = String(input == null ? '' : input)
  let pos = 0
  let groupCounter = 0

  const peek = () => (pos < src.length ? src[pos] : '')
  const next = () => (pos < src.length ? src[pos++] : '')

  function parseAlternation(depth) {
    const branches = [parseSequence(depth)]
    while (peek() === '|') {
      next()
      branches.push(parseSequence(depth))
    }
    if (branches.length === 1) return branches[0]
    return { type: 'alternation', branches }
  }

  function parseSequence(depth) {
    const items = []
    while (pos < src.length) {
      const ch = peek()
      if (ch === '|') break
      if (ch === ')' && depth > 0) break
      let atom
      if (ch === ')' && depth === 0) {
        // 顶层多余右括号按字面量处理，不抛异常
        next()
        atom = { type: 'literal', text: ')' }
        mergeOrPush(items, atom)
        continue
      }
      atom = parseAtom()
      if (atom === null) break
      const quant = tryQuantifier()
      mergeOrPush(items, quant ? { type: 'quantifier', qtext: quant.qtext, desc: quant.desc, child: atom } : atom)
    }
    return { type: 'sequence', items }
  }

  function mergeOrPush(items, node) {
    // 相邻普通字面量合并为一个盒子（带量词的节点不合并）
    const last = items.length > 0 ? items[items.length - 1] : null
    if (node.type === 'literal' && last && last.type === 'literal') {
      last.text += node.text
    } else {
      items.push(node)
    }
  }

  function parseAtom() {
    const ch = next()
    if (ch === '') return null
    if (ch === '(') return parseGroup()
    if (ch === '[') return parseCharClass()
    if (ch === '\\') return parseEscape()
    if (ch === '^') return { type: 'anchor', value: '^' }
    if (ch === '$') return { type: 'anchor', value: '$' }
    if (ch === '.') return { type: 'dot' }
    return { type: 'literal', text: ch }
  }

  function tryQuantifier() {
    const ch = peek()
    let qtext = ''
    let desc = ''
    if (ch === '*') {
      next()
      qtext = '*'
      desc = '重复 0 次或多次'
    } else if (ch === '+') {
      next()
      qtext = '+'
      desc = '重复 1 次或多次'
    } else if (ch === '?') {
      next()
      qtext = '?'
      desc = '出现 0 或 1 次'
    } else if (ch === '{') {
      const save = pos
      const brace = parseBraceQuant()
      if (!brace) {
        pos = save
        return null
      }
      qtext = brace.qtext
      desc = brace.desc
    } else {
      return null
    }
    let greedy = true
    if (peek() === '?') {
      next()
      greedy = false
    }
    return { qtext, desc: desc + (greedy ? '（贪婪）' : '（非贪婪）') }
  }

  function parseBraceQuant() {
    next() // 消费 '{'
    const a = readDigits()
    if (a === null) return null
    if (peek() === '}') {
      next()
      return { qtext: '{' + a + '}', desc: '恰好 ' + a + ' 次' }
    }
    if (peek() === ',') {
      next()
      if (peek() === '}') {
        next()
        return { qtext: '{' + a + ',}', desc: '至少 ' + a + ' 次' }
      }
      const b = readDigits()
      if (b === null) return null
      if (peek() !== '}') return null
      next()
      return { qtext: '{' + a + ',' + b + '}', desc: '重复 ' + a + ' 到 ' + b + ' 次' }
    }
    return null
  }

  function readDigits() {
    let s = ''
    while (pos < src.length && src[pos] >= '0' && src[pos] <= '9') s += next()
    return s === '' ? null : s
  }

  function parseGroup() {
    // 已消费 '('
    if (src.startsWith('?:', pos)) {
      pos += 2
      const child = parseAlternation(1)
      skipCloseParen()
      return { type: 'group', capturing: false, child }
    }
    if (src.startsWith('?=', pos) || src.startsWith('?!', pos)) {
      return { type: 'unsupported', raw: readBalanced(), reason: '前瞻断言（环视）' }
    }
    if (src.startsWith('?<=', pos) || src.startsWith('?<!', pos)) {
      return { type: 'unsupported', raw: readBalanced(), reason: '后行断言（环视）' }
    }
    if (src.startsWith('?<', pos)) {
      return { type: 'unsupported', raw: readBalanced(), reason: '命名分组' }
    }
    if (peek() === '?') {
      return { type: 'unsupported', raw: readBalanced(), reason: '特殊分组语法' }
    }
    groupCounter += 1
    const index = groupCounter
    const child = parseAlternation(1)
    skipCloseParen()
    return { type: 'group', capturing: true, index, child }
  }

  function readBalanced() {
    // '(' 已在 pos-1，读至配对右括号（或字符串结尾），原样返回整段
    const start = pos - 1
    let depth = 1
    while (pos < src.length) {
      const c = src[pos]
      if (c === '\\') {
        pos += 2
        continue
      }
      if (c === '(') depth += 1
      else if (c === ')') {
        depth -= 1
        pos += 1
        if (depth === 0) break
        continue
      }
      pos += 1
    }
    return src.slice(start, pos)
  }

  function skipCloseParen() {
    // 分组未闭合时容忍缺失，不抛异常
    if (peek() === ')') next()
  }

  function parseEscape() {
    // 已消费 '\'
    if (pos >= src.length) return { type: 'literal', text: '\\' }
    const c = next()
    if (c >= '1' && c <= '9') {
      return { type: 'unsupported', raw: '\\' + c, reason: '反向引用' }
    }
    if (c === 'k') {
      let raw = '\\k'
      while (pos < src.length && src[pos] !== '>') raw += next()
      if (pos < src.length) raw += next()
      return { type: 'unsupported', raw, reason: '命名反向引用' }
    }
    if (c === 'x' || c === 'u') {
      let raw = '\\' + c
      if (peek() === '{') {
        raw += next()
        while (pos < src.length && src[pos] !== '}') raw += next()
        if (pos < src.length) raw += next()
      } else {
        let n = c === 'x' ? 2 : 4
        while (n > 0 && pos < src.length && /[0-9a-fA-F]/.test(src[pos])) {
          raw += next()
          n -= 1
        }
      }
      return { type: 'escape', label: raw, meaning: 'Unicode 转义字符' }
    }
    const meaning = Object.prototype.hasOwnProperty.call(ESCAPE_MEANINGS, c)
      ? ESCAPE_MEANINGS[c]
      : '转义字面量 ' + c
    return { type: 'escape', label: '\\' + c, meaning }
  }

  function parseCharClass() {
    // 已消费 '['
    const start = pos - 1
    const negated = peek() === '^'
    if (negated) next()
    const parts = []
    while (pos < src.length) {
      if (peek() === ']' && parts.length > 0) {
        next()
        break
      }
      let lo = ''
      if (peek() === '\\') {
        next()
        if (pos >= src.length) {
          lo = '\\'
        } else {
          const c = next()
          if (c === 'd' || c === 'w' || c === 's' || c === 'D' || c === 'W' || c === 'S') {
            parts.push({ kind: 'class', label: '\\' + c, meaning: ESCAPE_MEANINGS[c] })
            continue
          }
          if (c >= '1' && c <= '9') {
            parts.push({ kind: 'unsupported', label: '\\' + c })
            continue
          }
          lo = unescapeChar(c)
        }
      } else {
        lo = next()
      }
      // 范围 a-z：'-' 后面还有字符且不是 ']' 才成范围
      if (peek() === '-' && pos + 1 < src.length && src[pos + 1] !== ']') {
        next()
        let hi = ''
        if (peek() === '\\') {
          next()
          hi = pos < src.length ? unescapeChar(next()) : ''
        } else {
          hi = next()
        }
        parts.push({ kind: 'range', from: lo, to: hi })
      } else {
        parts.push({ kind: 'char', ch: lo })
      }
    }
    return { type: 'charclass', negated, parts, raw: src.slice(start, pos) }
  }

  function unescapeChar(c) {
    if (c === 'n') return '\n'
    if (c === 'r') return '\r'
    if (c === 't') return '\t'
    return c
  }

  const ast = parseAlternation(0)
  return { ok: true, ast, groupCount: groupCounter }
}
// ===== [PURE-END] =====

// ---------- 可视化渲染（递归结构树 → 嵌套盒子） ----------
const boxBase = 'inline-flex items-center rounded-md border px-2 py-1 text-sm leading-5'

function renderAnchor(node) {
  const isStart = node.value === '^'
  return h(
    'span',
    {
      class:
        boxBase +
        ' bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-medium'
    },
    [
      h(isStart ? ArrowLeft : ArrowRight, { class: 'w-3.5 h-3.5 mr-1 flex-shrink-0' }),
      h('code', { class: 'font-mono font-semibold mr-1' }, node.value),
      isStart ? '锚定开头（从这里开始）' : '锚定结尾（到这里结束）'
    ]
  )
}

function renderClassPart(part) {
  if (part.kind === 'char') {
    return h('span', { class: 'px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs' }, part.ch === ' ' ? '␣' : part.ch)
  }
  if (part.kind === 'range') {
    return h(
      'span',
      { class: 'px-1.5 py-0.5 rounded bg-background border border-border font-mono text-xs' },
      [part.from, h('span', { class: 'text-muted-foreground mx-0.5' }, '–'), part.to]
    )
  }
  if (part.kind === 'class') {
    return h(
      'span',
      {
        class: 'px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 border border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200 font-mono text-xs',
        title: part.meaning
      },
      part.label
    )
  }
  return h('span', { class: 'px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-400 dark:border-gray-600 text-gray-500 font-mono text-xs' }, part.label + '（暂不支持）')
}

function renderNode(node) {
  if (node.type === 'sequence') {
    if (!node.items || node.items.length === 0) {
      return h('span', { class: 'text-xs text-muted-foreground italic' }, '（空）')
    }
    return h('div', { class: 'flex flex-wrap items-center gap-1.5' }, node.items.map(renderNode))
  }
  if (node.type === 'alternation') {
    const children = []
    node.branches.forEach((b, i) => {
      if (i > 0) {
        children.push(
          h('div', { class: 'flex items-center gap-1 text-[10px] text-muted-foreground' }, [
            h('span', { class: 'h-px flex-1 bg-muted min-w-4' }),
            '或（任选其一）',
            h('span', { class: 'h-px flex-1 bg-muted min-w-4' })
          ])
        )
      }
      children.push(renderNode(b))
    })
    return h(
      'div',
      { class: 'inline-flex flex-col gap-1 rounded-md border border-dashed border-border p-2' },
      children
    )
  }
  if (node.type === 'literal') {
    return h('span', { class: boxBase + ' bg-muted border-border text-foreground font-mono' }, node.text === ' ' ? '␣' : node.text)
  }
  if (node.type === 'dot') {
    return h(
      'span',
      { class: boxBase + ' bg-sky-100 dark:bg-sky-900/40 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200' },
      [h('code', { class: 'font-mono font-semibold mr-1' }, '.'), h('small', '任意字符（换行除外）')]
    )
  }
  if (node.type === 'escape') {
    return h(
      'span',
      { class: boxBase + ' bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200' },
      [h('code', { class: 'font-mono font-semibold mr-1' }, node.label), h('small', node.meaning)]
    )
  }
  if (node.type === 'anchor') {
    return renderAnchor(node)
  }
  if (node.type === 'charclass') {
    return h(
      'div',
      { class: 'inline-flex flex-col rounded-md border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/30 px-2 py-1' },
      [
        h('div', { class: 'text-[10px] font-medium text-sky-800 dark:text-sky-200' }, [
          h('code', { class: 'font-mono' }, '[...]'),
          node.negated ? ' 字符类（取反：匹配集合以外）' : ' 字符类（任选其一）'
        ]),
        h('div', { class: 'flex flex-wrap gap-1 mt-1' }, node.parts.map(renderClassPart))
      ]
    )
  }
  if (node.type === 'group') {
    return h(
      'div',
      { class: 'inline-flex flex-col rounded-lg border-2 border-amber-400 dark:border-amber-600/70 bg-amber-50/60 dark:bg-amber-900/10 px-2 py-1.5' },
      [
        h(
          'div',
          { class: 'text-[10px] font-semibold text-amber-700 dark:text-amber-300 mb-1' },
          node.capturing ? '捕获组 #' + node.index : '非捕获分组 (?:)'
        ),
        renderNode(node.child)
      ]
    )
  }
  if (node.type === 'quantifier') {
    return h('div', { class: 'inline-flex flex-col items-center' }, [
      renderNode(node.child),
      h(
        'div',
        { class: 'mt-0.5 text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5' },
        [h('code', { class: 'font-mono text-primary font-semibold' }, node.qtext), ' ' + node.desc]
      )
    ])
  }
  if (node.type === 'unsupported') {
    return h(
      'div',
      { class: 'inline-flex flex-col rounded-md border border-dashed border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 px-2 py-1' },
      [
        h('div', { class: 'text-[10px] font-medium' }, '暂不支持可视化'),
        h('code', { class: 'font-mono text-xs text-foreground/70' }, node.raw),
        node.reason ? h('div', { class: 'text-[10px]' }, node.reason) : null
      ]
    )
  }
  return h('span', { class: boxBase + ' bg-muted border-border text-muted-foreground' }, String(node.type))
}

const RegexNodeView = defineComponent({
  name: 'RegexNodeView',
  props: { node: { type: Object, required: true } },
  setup(props) {
    return () => renderNode(props.node)
  }
})

// ---------- 状态 ----------
const patternInput = ref('^(\\d{4})-(\\d{2})$')
const testStr = ref('2026-10\n1999-12\nabc')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const presets = [
  { label: '年-月', value: '^(\\d{4})-(\\d{2})$', test: '2026-10\n1999-12\nabc' },
  { label: '手机号', value: '^1[3-9]\\d{9}$', test: '13912345678\n12345678901' },
  { label: '或分支', value: 'a|bc', test: 'a\nbc\nabc\ncb' },
  { label: '非捕获+量词', value: '(?:ab)+c?', test: 'ababc\nabab\nccc' },
  { label: '字符类取反', value: '[^0-9]+', test: 'abc123def' },
  { label: '含环视', value: '(?<=a)b', test: 'ab\nb' }
]

const applyPreset = (p) => {
  patternInput.value = p.value
  testStr.value = p.test
}

// 剥离 /.../ 分隔符与标志位
const cleanPattern = computed(() => {
  const raw = patternInput.value.trim()
  if (raw.length > 1 && raw.charAt(0) === '/') {
    const end = raw.lastIndexOf('/')
    if (end > 0) return raw.slice(1, end)
  }
  return raw
})

// 图解树
const parseResult = computed(() => {
  try {
    return parseRegex(cleanPattern.value)
  } catch (e) {
    // 解析器按设计不抛异常，此处兜底
    return { ok: false, error: '解析失败，请检查正则写法' }
  }
})

// RegExp 实测匹配高亮
const testResult = computed(() => {
  const pat = cleanPattern.value
  const str = testStr.value
  if (!pat) return { idle: true }
  let re
  try {
    re = new RegExp(pat, 'g')
  } catch (e) {
    return { error: '正则语法错误：' + (e && e.message ? e.message : String(e)) }
  }
  const segs = []
  let last = 0
  const MAX_SEG = 500
  try {
    let m
    while ((m = re.exec(str)) !== null && segs.length < MAX_SEG) {
      if (m[0].length === 0) {
        // 零长匹配前进一位，避免死循环
        re.lastIndex += 1
        continue
      }
      if (m.index > last) segs.push({ text: str.slice(last, m.index), hit: false })
      segs.push({ text: m[0], hit: true })
      last = m.index + m[0].length
    }
  } catch (e) {
    /* 个别引擎限制，忽略后续匹配 */
  }
  if (last < str.length) segs.push({ text: str.slice(last), hit: false })
  return { segs, count: segs.filter(s => s.hit).length }
})
</script>
