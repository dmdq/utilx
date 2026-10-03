<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileCode class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">GraphQL格式化器</h1>
          <p class="text-sm text-muted-foreground mt-1">格式化与压缩 GraphQL 查询，字符串/块字符串/注释感知，纯本地解析</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴 query / mutation / subscription / fragment，按 2 空格缩进美化排版：变量定义与参数过长时自动换行对齐、每个字段独占一行、注释完整保留。压缩模式去除全部空白换行（保留字符串），并给出前后字节数对比。全部在浏览器本地完成，数据不上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与配置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Sliders class="w-5 h-5 mr-2 text-primary" /> 输入与配置
          </h2>

          <div class="grid grid-cols-2 gap-1.5 mb-4">
            <button
              v-for="opt in modeOptions"
              :key="opt.value"
              @click="switchMode(opt.value)"
              :class="mode === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ opt.label }}
            </button>
          </div>

          <textarea
            v-model="inputText"
            class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 GraphQL 查询，例如：&#10;query Hero($ep: Episode = JEDI) {&#10;  hero(episode: $ep) { name friends { name } }&#10;}"
            spellcheck="false"
          ></textarea>

          <div class="flex items-center gap-2 mt-4">
            <button
              @click="runFormat"
              class="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> {{ mode === 'pretty' ? '格式化' : '压缩' }}
            </button>
            <button
              @click="fillSample"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-sm transition-all"
            >
              测试样例
            </button>
            <button
              @click="clearAll"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-sm transition-all"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 大小对比 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 前后大小对比
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-foreground">{{ sizeStats.before }}</p>
              <p class="text-xs text-muted-foreground">输入字节</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold text-foreground">{{ sizeStats.after }}</p>
              <p class="text-xs text-muted-foreground">输出字节</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-lg font-bold" :class="sizeStats.delta > 0 ? 'text-green-500' : 'text-foreground'">{{ sizeStats.deltaLabel }}</p>
              <p class="text-xs text-muted-foreground">变化</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground mt-3">压缩模式会移除注释与全部空白；格式化模式因缩进换行体积通常略增。</p>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileCode class="w-5 h-5 mr-2 text-primary" />
              {{ mode === 'pretty' ? '格式化结果' : '压缩结果' }}
            </h2>
            <button
              @click="copyOutput"
              :disabled="!outputText"
              class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Copy class="w-3.5 h-3.5" /> 复制
            </button>
          </div>
          <div class="p-6">
            <textarea
              v-if="outputText && !errorMsg"
              :value="outputText"
              readonly
              class="w-full h-96 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else-if="errorMsg" class="py-16 text-center">
              <XCircle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">解析失败</p>
              <p class="text-xs text-muted-foreground">{{ errorMsg }}</p>
            </div>
            <div v-else class="py-16 text-center">
              <FileCode class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入 GraphQL 后点击「{{ mode === 'pretty' ? '格式化' : '压缩' }}」，这里会显示结果</p>
            </div>
          </div>
        </div>

        <!-- 处理规则 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 处理规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">缩进</span>：按大括号深度 2 空格缩进，每个字段独占一行</li>
            <li>• <span class="text-foreground">参数对齐</span>：变量定义与字段参数超过 60 字符或含注释时自动换行，每参数一行并与 <span class="font-mono">(</span> 对齐</li>
            <li>• <span class="text-foreground">注释保留</span>：<span class="font-mono">#</span> 注释在格式化时独占一行保留原位置</li>
            <li>• <span class="text-foreground">字符串安全</span>：普通字符串与 <span class="font-mono">"""块字符串"""</span> 内容原样保留，不受空白处理影响</li>
            <li>• <span class="text-foreground">错误提示</span>：大括号/小括号不匹配、字符串未闭合、非法字符都会标明行号</li>
            <li>• <span class="text-foreground">压缩模式</span>：去除空白、换行与注释，字符串内容原样保留，可直接用于请求体</li>
          </ul>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于GraphQL格式化器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            GraphQL 查询语言语法灵活：逗号可有可无、空白无关紧要，这让手写的查询容易变得凌乱。格式化后按 2 空格缩进、每字段一行的结构更利于 Code Review 与 Diff；而发给服务端的请求体往往希望尽量小，压缩模式可以去掉全部多余空白与注释。本工具按标准 GraphQL 词法（字符串、块字符串、注释、变量、指令、片段展开）解析后重排，不联网、不上传。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>整理从浏览器 DevTools / 抓包工具复制出来的单行 GraphQL 请求</li>
            <li>把压扁的查询压缩成单行，嵌入测试代码或 curl 命令</li>
            <li>Code Review 前统一团队 GraphQL 查询的排版风格</li>
            <li>排查查询语法问题：括号不匹配、字符串未闭合会定位到行号</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">注释会被保留吗？</span>格式化模式完整保留 <span class="font-mono">#</span> 注释；压缩模式会移除注释（注释对服务端执行无意义）。</li>
            <li><span class="text-foreground font-medium">支持 schema 语言（SDL）吗？</span>主要面向查询语句（query/mutation/subscription/fragment）；SDL 中的 type/enum 定义通常也能被正确缩进，但字段描述字符串建议使用块字符串。</li>
            <li><span class="text-foreground font-medium">参数什么时候会换行？</span>当参数整体超过 60 字符或内部包含注释时，每个参数会独占一行并按括号层级对齐。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'graphql-formatter'" :category="'format'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileCode, Sliders, RefreshCw, Copy, Info, XCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'GraphQL格式化器 - GraphQL查询美化与压缩工具',
  description: 'GraphQL在线格式化与压缩工具，支持query/mutation/fragment，字符串与块字符串感知、注释保留、参数自动换行对齐、括号不匹配报错定位，纯本地处理',
  keywords: 'graphql格式化, graphql美化, graphql压缩, graphql formatter, graphql查询, 格式化工具',
  author: 'Util工具箱',
  ogTitle: 'GraphQL格式化器 - 有条工具',
  ogDescription: '格式化与压缩GraphQL查询，字符串/块字符串/注释感知，纯本地解析',
  ogUrl: 'https://www.util.cn/tools/graphql-formatter',
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
          name: 'GraphQL格式化器',
          url: 'https://www.util.cn/tools/graphql-formatter',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['GraphQL格式化', 'GraphQL压缩', '注释保留', '参数换行对齐', '语法错误提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '数据格式化', item: 'https://www.util.cn/format/' },
            { '@type': 'ListItem', position: 3, name: 'GraphQL格式化器', item: 'https://www.util.cn/tools/graphql-formatter/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'graphql-formatter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 词法分析（字符串/块字符串/注释感知） ----------
const tokenize = (src) => {
  const tokens = []
  let i = 0
  let line = 1
  const n = src.length
  while (i < n) {
    const ch = src[i]
    if (ch === '\n') { line++; i++; continue }
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === ',') { i++; continue }
    if (ch === '#') {
      let j = i
      while (j < n && src[j] !== '\n') j++
      tokens.push({ type: 'comment', value: src.slice(i, j), line })
      i = j
      continue
    }
    if (src.startsWith('"""', i)) {
      let j = i + 3
      while (j < n) {
        if (src[j] === '\\' && j + 1 < n) { j += 2; continue }
        if (src.startsWith('"""', j)) break
        if (src[j] === '\n') line++
        j++
      }
      if (j >= n) throw new Error(`第 ${line} 行附近：块字符串（"""）未闭合`)
      tokens.push({ type: 'blockstring', value: src.slice(i, j + 3), line })
      i = j + 3
      continue
    }
    if (ch === '"') {
      let j = i + 1
      while (j < n) {
        if (src[j] === '\\' && j + 1 < n) { j += 2; continue }
        if (src[j] === '"') break
        if (src[j] === '\n') throw new Error(`第 ${line} 行：字符串未闭合（换行前缺少结束引号）`)
        j++
      }
      if (j >= n) throw new Error(`第 ${line} 行：字符串未闭合`)
      tokens.push({ type: 'string', value: src.slice(i, j + 1), line })
      i = j + 1
      continue
    }
    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i + 1
      while (j < n && /[0-9.eE]/.test(src[j])) j++
      tokens.push({ type: 'number', value: src.slice(i, j), line })
      i = j
      continue
    }
    if (/[_A-Za-z]/.test(ch)) {
      let j = i + 1
      while (j < n && /[_0-9A-Za-z]/.test(src[j])) j++
      tokens.push({ type: 'name', value: src.slice(i, j), line })
      i = j
      continue
    }
    if (ch === '$') { tokens.push({ type: 'dollar', value: '$', line }); i++; continue }
    if (ch === '@') { tokens.push({ type: 'at', value: '@', line }); i++; continue }
    if (ch === '.') {
      if (src.startsWith('...', i)) { tokens.push({ type: 'spread', value: '...', line }); i += 3; continue }
      throw new Error(`第 ${line} 行：非法字符「.」`)
    }
    if ('{}():=![]'.includes(ch)) {
      tokens.push({ type: 'punct', value: ch, line })
      i++
      continue
    }
    throw new Error(`第 ${line} 行：非法字符「${ch}」`)
  }
  return tokens
}

const findMatching = (tokens, start, openV, closeV) => {
  let depth = 0
  for (let k = start; k < tokens.length; k++) {
    if (tokens[k].value === openV) depth++
    else if (tokens[k].value === closeV) {
      depth--
      if (depth === 0) return k
    }
  }
  return -1
}

// ---------- 格式化（Pretty） ----------
const KEYWORDS = ['query', 'mutation', 'subscription', 'fragment', 'on']

const prettyPrint = (tokens) => {
  const lines = []
  let indent = 0
  let cur = ''
  let pendingNl = false
  let wantSpace = false       // 上一个 token 是 : 或 =，下一个词前加空格
  let afterAt = false         // @ 后的名称直接拼接
  let afterSpread = false     // ... 后的名称直接拼接（on 关键字加空格）
  let lastKeyword = false     // 上一个词是 query/mutation/subscription/fragment/on
  let braceDepth = 0

  const flush = () => { if (cur !== '') { lines.push('  '.repeat(indent) + cur); cur = '' } }
  const nl = () => flush()
  const clearPending = () => { pendingNl = false }
  const add = (s) => { cur += s }

  const emitWord = (v) => {
    if (pendingNl) clearPending()
    if (afterAt) { add(v); afterAt = false; lastKeyword = false; return }
    if (afterSpread) { add(v === 'on' ? ' on' : v); afterSpread = false; lastKeyword = (v === 'on'); return }
    if (wantSpace) { add(' ' + v); wantSpace = false; lastKeyword = false; return }
    if (cur === '') { add(v); lastKeyword = KEYWORDS.includes(v); return }
    if (lastKeyword || (v === 'on' && cur !== '')) { add(' ' + v); lastKeyword = KEYWORDS.includes(v); return }
    nl()
    add(v)
    lastKeyword = KEYWORDS.includes(v)
  }

  const writeInlineTokens = (from, to) => {
    let ws = false
    let prev = null
    const startsArg = (t) => t.type === 'dollar' || t.type === 'at' || t.type === 'name'
    const endsValue = (p) => p && (p.type === 'number' || p.type === 'string' || (p.type === 'name' && p.value !== 'on') || p.value === ')' || p.value === ']' || p.value === '!')
    for (let k = from; k < to; k++) {
      const t = tokens[k]
      const v = t.value
      if (startsArg(t) && endsValue(prev)) { add(', '); ws = false }
      if (t.type === 'dollar') { add(ws ? ' $' : '$'); ws = false; prev = t; continue }
      if (t.type === 'at') { add('@'); ws = false; prev = t; continue }
      if (t.type === 'spread') { add('...'); ws = false; prev = t; continue }
      if (v === ':') { add(':'); ws = true; prev = t; continue }
      if (v === '!') { add('!'); ws = false; prev = t; continue }
      if (v === '=') { add(' ='); ws = true; prev = t; continue }
      if (v === ',') { add(','); ws = true; prev = t; continue }
      if (v === '[' || v === ']') { add(ws ? ' ' + v : v); ws = false; prev = t; continue }
      if (v === '(') { const c = findMatching(tokens, k, '(', ')'); add('('); writeInlineTokens(k + 1, c); add(')'); k = c; prev = { type: 'punct', value: ')' }; continue }
      if (t.type === 'comment') continue
      if (ws) { add(' ' + v); ws = false } else add(v)
      prev = t
    }
  }

  const writeArgs = (openIdx, closeIdx) => {
    let innerLen = 0
    let hasBraceOrComment = false
    for (let k = openIdx + 1; k < closeIdx; k++) {
      innerLen += tokens[k].value.length + 1
      if (tokens[k].value === '{' || tokens[k].value === '}' || tokens[k].type === 'comment') hasBraceOrComment = true
    }
    if (innerLen <= 60 && !hasBraceOrComment) {
      add('(')
      writeInlineTokens(openIdx + 1, closeIdx)
      add(')')
      return
    }
    add('(')
    nl()
    indent++
    let k = openIdx + 1
    let ws = false
    let afterDollar = false
    let afterBracket = false
    while (k < closeIdx) {
      const t = tokens[k]
      const v = t.value
      if (t.type === 'comment') { nl(); lines.push('  '.repeat(indent) + v); k++; continue }
      if (v === '(') {
        const c = findMatching(tokens, k, '(', ')')
        add(ws ? ' (' : '(')
        writeInlineTokens(k + 1, c)
        add(')')
        ws = false
        k = c + 1
        continue
      }
      if (v === '{') { add(' {'); nl(); indent++; ws = false; k++; continue }
      if (v === '}') { nl(); indent = Math.max(0, indent - 1); add('}'); ws = false; k++; continue }
      if (v === ':') { add(':'); ws = true; k++; continue }
      if (v === '!') { add('!'); ws = false; k++; continue }
      if (v === '=') { add(' ='); ws = true; k++; continue }
      if (v === '[' || v === ']') { add(ws ? ' ' + v : v); ws = false; if (v === '[') afterBracket = true; k++; continue }
      if (v === ',') { k++; continue }
      if (afterBracket && t.type !== 'dollar' && t.type !== 'at') { add(v); afterBracket = false; k++; continue }
      if (t.type === 'dollar' || t.type === 'at' || t.type === 'spread') {
        if (t.type === 'dollar') {
          if (ws) { add(' $'); ws = false }
          else { if (cur !== '') nl(); add('$') }
          afterDollar = true
        } else {
          add(t.value)
          ws = false
        }
        k++
        continue
      }
      // name / number / string
      if (afterDollar) { add(v); afterDollar = false; k++; continue }
      if (ws) { add(' ' + v); ws = false; k++; continue }
      if (cur === '') { add(v); k++; continue }
      nl()
      add(v)
      k++
    }
    nl()
    indent--
    add(')')
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const v = t.value
    if (t.type === 'comment') {
      if (pendingNl) clearPending()
      nl()
      lines.push('  '.repeat(indent) + v)
      continue
    }
    if (v === '{') {
      if (pendingNl) clearPending()
      add(' {')
      nl()
      indent++
      continue
    }
    if (v === '}') {
      if (pendingNl) clearPending()
      nl()
      indent = Math.max(0, indent - 1)
      add('}')
      pendingNl = true
      braceDepth--
      if (braceDepth < 0) throw new Error(`第 ${t.line} 行：多余的「}」，大括号不匹配`)
      continue
    }
    if (v === '(') {
      if (pendingNl) clearPending()
      const close = findMatching(tokens, i, '(', ')')
      if (close === -1) throw new Error(`第 ${t.line} 行：「(」未闭合`)
      writeArgs(i, close)
      pendingNl = true
      i = close
      continue
    }
    if (v === ')') {
      throw new Error(`第 ${t.line} 行：多余的「)」，括号不匹配`)
    }
    if (v === ':') { if (pendingNl) clearPending(); add(':'); wantSpace = true; continue }
    if (v === '!') { add('!'); wantSpace = false; continue }
    if (v === '=') { add(' ='); wantSpace = true; continue }
    if (v === '[' || v === ']') { add(v); wantSpace = false; continue }
    if (t.type === 'dollar') { if (pendingNl) clearPending(); add('$'); wantSpace = false; continue }
    if (t.type === 'spread') { if (pendingNl) clearPending(); nl(); add('...'); afterSpread = true; continue }
    if (t.type === 'at') { if (pendingNl) clearPending(); add(cur === '' ? '@' : ' @'); afterAt = true; continue }
    if (t.type === 'blockstring') {
      if (pendingNl) clearPending()
      if (cur !== '') nl()
      add(v)
      pendingNl = true
      continue
    }
    // name / number / string
    emitWord(v)
  }
  nl()
  if (braceDepth > 0) throw new Error('存在未闭合的「{」，请检查大括号是否配对')
  return lines.join('\n')
}

// ---------- 压缩（Minify） ----------
const wordLike = (t) => t && (t.type === 'name' || t.type === 'number' || t.type === 'string' || t.type === 'blockstring')

const minifyTokens = (tokens) => {
  let out = ''
  let prev = null
  const needSpace = (p, c) => {
    if (!p) return ''
    if (c.value === '}' || c.value === ')' || c.value === ']' || c.value === ':' || c.value === '!' || c.value === '=') return ''
    if (p.value === '(' || p.value === '[' || p.value === '$' || p.value === '...' || p.value === '!') return ''
    if (p.value === '{') return ' '
    if (p.value === ':') return ' '
    if (c.value === '(') return ''
    if (c.value === '@') return ' '
    if (c.value === '...') return ' '
    if (c.value === '$') return ' '
    if (c.value === '{') return ' '
    if (wordLike(p) && wordLike(c)) return ' '
    if (p.value === '}' || p.value === ')') return ' '
    return ''
  }
  for (const t of tokens) {
    if (t.type === 'comment') continue
    out += needSpace(prev, t) + t.value
    prev = t
  }
  return out
}

// ---------- 状态 ----------
const mode = ref('pretty')
const inputText = ref('')
const outputText = ref('')
const errorMsg = ref('')
const seoContentVisible = ref(true)

const modeOptions = [
  { value: 'pretty', label: '格式化 (Pretty)' },
  { value: 'minify', label: '压缩 (Minify)' }
]

const runFormat = () => {
  errorMsg.value = ''
  outputText.value = ''
  if (!inputText.value.trim()) return
  try {
    const tokens = tokenize(inputText.value)
    outputText.value = mode.value === 'pretty' ? prettyPrint(tokens) : minifyTokens(tokens)
  } catch (err) {
    errorMsg.value = err?.message || '解析失败，请检查 GraphQL 语法'
  }
}

const switchMode = (m) => {
  mode.value = m
}

const sizeStats = computed(() => {
  if (!inputText.value || !outputText.value || errorMsg.value) {
    return { before: 0, after: 0, delta: 0, deltaLabel: '-' }
  }
  const before = new TextEncoder().encode(inputText.value).length
  const after = new TextEncoder().encode(outputText.value).length
  const delta = before - after
  const deltaLabel = delta > 0 ? `-${((delta / before) * 100).toFixed(1)}%` : `+${((after - before) / before * 100).toFixed(1)}%`
  return { before, after, delta, deltaLabel }
})

const fillSample = () => {
  inputText.value = `# 带变量定义与 Fragment 的复杂查询样例
query HeroNameAndFriends($episode: Episode = JEDI, $withFriends: Boolean!) {
  hero(episode: $episode) @include(if: $withFriends) {
    name # 英雄名字
    friends { ...CharacterFields }
  }
}
fragment CharacterFields on Character { name ... on Droid { primaryFunction } }
"""
块字符串描述：
可包含 "引号" 与任意内容
"""
mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { id name createdAt } }`
  runFormat()
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  errorMsg.value = ''
}

const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
