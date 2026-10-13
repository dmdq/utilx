<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Wand2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">截断 JSON 修复器</h1>
          <p class="text-sm text-muted-foreground mt-1">修复 LLM 输出的截断 JSON：剥围栏、去注释、补括号引号，全程本地验证</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        大模型返回的 JSON 经常因 max tokens 截断而解析失败。本工具按五步策略自动修复：① 剥除 Markdown 代码围栏；② 删除 // 与 /* */ 注释；③ 清理尾逗号；④ 补全未闭合的引号与括号（识别字符串内的引号与转义）；⑤ 截断处特殊处理（冒号结尾补 null、逗号结尾删除再补）。修复结果经 JSON.parse 本地验证，数据不发往任何服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Wand2 class="w-5 h-5 mr-2 text-primary" /> 损坏的 JSON
          </h2>
          <button
            @click="input = ''"
            class="text-xs text-muted-foreground hover:text-primary transition-colors"
          >清空</button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="eg in examples"
            :key="eg.label"
            @click="input = eg.value"
            class="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-muted-foreground transition-colors"
          >示例：{{ eg.label }}</button>
        </div>

        <textarea
          v-model="input"
          rows="14"
          spellcheck="false"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder='粘贴被截断或格式出错的 JSON，例如：{"name": "a", "tags": ["x", "y"'
        ></textarea>

        <div class="flex items-center gap-3">
          <button
            @click="doRepair"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw class="w-4 h-4" /> 修复并验证
          </button>
          <label class="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input v-model="autoRepair" type="checkbox" class="w-4 h-4 rounded border-border">
            输入变化时自动修复
          </label>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 flex flex-col">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <FileJson class="w-5 h-5 mr-2 text-primary" /> 修复结果
          </h2>
          <div class="flex items-center gap-2">
            <!-- JSON.parse 验证徽章 -->
            <span
              v-if="result"
              :class="result.valid
                ? 'inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs rounded-full font-medium'
                : 'inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs rounded-full font-medium'"
            >
              <Check v-if="result.valid" class="w-3.5 h-3.5" />
              <XCircle v-else class="w-3.5 h-3.5" />
              {{ result.valid ? 'JSON.parse 验证通过' : '仍解析失败' }}
            </span>
            <button
              v-if="result && result.text"
              @click="copyOutput"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Check v-if="copied" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
        </div>

        <div v-if="!result" class="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
          粘贴内容后点击「修复并验证」，或勾选自动修复
        </div>

        <template v-else>
          <!-- 修复动作清单：每步是否触发 -->
          <div class="border border-border rounded-lg p-3">
            <p class="text-xs font-medium text-foreground mb-2">修复动作清单</p>
            <div class="space-y-1.5">
              <div v-for="(s, idx) in result.steps" :key="s.name" class="flex items-start gap-2 text-xs">
                <span
                  :class="s.hit
                    ? 'mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 flex items-center justify-center'
                    : 'mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center'"
                >
                  <Check v-if="s.hit" class="w-3 h-3" />
                  <XCircle v-else class="w-3 h-3" />
                </span>
                <span :class="s.hit ? 'text-foreground font-medium' : 'text-muted-foreground'">
                  {{ idx + 1 }}. {{ s.name }}
                  <span v-if="s.detail" class="font-normal text-muted-foreground">（{{ s.detail }}）</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 失败时的错误位置 -->
          <div v-if="!result.valid && result.error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-xs text-red-700 dark:text-red-300">
            <p class="font-medium mb-0.5">解析错误</p>
            <p>{{ result.error }}</p>
            <p v-if="result.errorPos !== null" class="mt-0.5">错误位置：第 {{ result.errorLine }} 行，第 {{ result.errorCol }} 列（字符偏移 {{ result.errorPos }}）</p>
          </div>

          <!-- 修复后的 JSON（格式化 + 高亮） -->
          <div class="flex-1 relative border border-border rounded-lg overflow-hidden">
            <pre class="w-full h-full max-h-[420px] overflow-auto p-4 bg-muted/30 text-xs font-mono leading-relaxed"><code v-html="highlighted"></code></pre>
          </div>
        </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于截断 JSON 修复器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            让大模型输出 JSON 时，最常见的失败不是模型「不会写 JSON」，而是输出被 max tokens 截断：字符串停在半截、数组少个右括号、对象少了收尾。手工补齐既繁琐又容易出错，本工具按确定性的规则自动补全，并用 JSON.parse 在本地验证结果——所有处理都在你的浏览器内完成，敏感数据无需上传。
          </p>

          <h3 class="text-lg font-semibold text-foreground">五步修复策略</h3>
          <p>
            ① 剥除 Markdown 代码围栏（<code class="px-1 bg-muted rounded">```json ... ```</code>）；② 删除 // 与 /* */ 注释（跳过字符串内的注释符）；③ 清理 ] 或 } 前的尾逗号；④ 扫描计数 { [ " 三类字符完成补全——引号识别会跳过转义（\"），括号按逆序补齐；⑤ 截断处特殊处理：以冒号结尾补 null，以逗号结尾先删逗号再补，空值（冒号后直接跟括号）同样补 null。每一步是否触发都有清单记录，修复透明可核对。
          </p>

          <h3 class="text-lg font-semibold text-foreground">字符串里的引号怎么处理</h3>
          <p>
            天真地数引号个数会被 <code class="px-1 bg-muted rounded">{"say": "he said \"hi\""}</code> 这类内容带偏。修复器逐字符扫描并跟踪「当前是否在字符串内」，字符串内的引号与转义序列不参与括号计数；补全时若扫描结束仍处于字符串内，才会追加缺失的收尾引号，并处理结尾悬空的转义反斜杠，避免补出一个被转义失效的引号。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">修复结果可信吗？</span>所有修复结果都经过浏览器本地 JSON.parse 验证并通过才显示绿色徽章；无法修复时会给出错误信息与行列位置，方便人工定位。</li>
            <li><span class="text-foreground font-medium">数据会被上传吗？</span>不会。修复与验证全部在你的浏览器内本地完成，页面没有网络请求，适合处理含隐私内容的输出。</li>
            <li><span class="text-foreground font-medium">什么情况修不好？</span>结构性错误（如键名缺冒号、多余字符混入、对象里出现裸字符串）不属于截断问题，工具会如实报告失败位置而不是强行猜测。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'truncated-json-repair'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Wand2, FileJson, RefreshCw, Copy, Check, XCircle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '截断 JSON 修复器 - 补全 LLM 输出的半截 JSON',
  description: '在线截断 JSON 修复工具：剥除 Markdown 围栏、删除注释、清理尾逗号、补全未闭合的引号与括号、截断处自动补 null，JSON.parse 本地验证，纯浏览器处理不上传数据',
  keywords: 'json修复, 截断json补全, llm json解析失败, jsonrepair在线, json格式修复, 尾逗号清理',
  author: 'Util工具箱',
  ogTitle: '截断 JSON 修复器 - 有条工具',
  ogDescription: '修复 LLM 输出的截断 JSON：剥围栏、去注释、补括号引号，本地验证',
  ogUrl: 'https://www.util.cn/tools/truncated-json-repair',
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
          name: '截断 JSON 修复器',
          url: 'https://www.util.cn/tools/truncated-json-repair',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['剥除 Markdown 围栏', '删除 // 与 /* */ 注释', '清理尾逗号', '补全未闭合引号与括号', '截断处补 null', 'JSON.parse 本地验证']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '截断 JSON 修复器', item: 'https://www.util.cn/tools/truncated-json-repair/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '修复结果可信吗？',
              acceptedAnswer: { '@type': 'Answer', text: '所有修复结果都经过浏览器本地 JSON.parse 验证，通过才显示绿色徽章；无法修复时会给出错误信息与行列位置。' }
            },
            {
              '@type': 'Question',
              name: '字符串里的引号会被误判吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。修复器逐字符扫描并跟踪字符串状态，字符串内的引号与转义序列不参与括号计数，补全时还会处理结尾悬空的转义反斜杠。' }
            },
            {
              '@type': 'Question',
              name: '数据会被上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。修复与验证全部在浏览器内本地完成，页面没有网络请求，可以放心处理含隐私内容的模型输出。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'truncated-json-repair')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] JSON 修复纯函数（可独立提取测试） =====
// 构建字符串掩码：mask[i] 为 true 表示 text[i] 位于双引号字符串内（含引号本身），跳过转义
function buildStringMask(text) {
  const mask = new Array(text.length).fill(false)
  let inStr = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      mask[i] = true
      if (c === '\\') {
        if (i + 1 < text.length) {
          mask[i + 1] = true
          i++
        }
      } else if (c === '"') {
        inStr = false
      }
    } else if (c === '"') {
      mask[i] = true
      inStr = true
    }
  }
  return { mask, inStrAtEnd: inStr }
}

// 删除字符串外的 // 与 /* */ 注释
function stripJsonComments(text) {
  let out = ''
  let inStr = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      out += c
      if (c === '\\') {
        if (i + 1 < text.length) {
          out += text[i + 1]
          i++
        }
      } else if (c === '"') {
        inStr = false
      }
      continue
    }
    if (c === '"') {
      inStr = true
      out += c
      continue
    }
    if (c === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i)
      if (nl === -1) break
      out += '\n'
      i = nl
      continue
    }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      i = end === -1 ? text.length : end + 1
      continue
    }
    out += c
  }
  return out
}

// 清理 ] 或 } 前的尾逗号
function fixTrailingCommas(text) {
  const { mask } = buildStringMask(text)
  const drop = []
  for (let i = 0; i < text.length; i++) {
    if (mask[i] || text[i] !== ',') continue
    let j = i + 1
    while (j < text.length && /\s/.test(text[j])) j++
    if (j < text.length && (text[j] === ']' || text[j] === '}')) drop.push(i)
  }
  if (!drop.length) return { text, count: 0 }
  let out = ''
  let s = 0
  for (const d of drop) {
    out += text.slice(s, d)
    s = d + 1
  }
  out += text.slice(s)
  return { text: out, count: drop.length }
}

// 空值补全：冒号后直接跟 ] 或 } 时插入 null
function fixEmptyValues(text) {
  const { mask } = buildStringMask(text)
  let out = ''
  let inserted = 0
  for (let i = 0; i < text.length; i++) {
    out += text[i]
    if (mask[i] || text[i] !== ':') continue
    let j = i + 1
    while (j < text.length && /\s/.test(text[j])) j++
    if (j < text.length && (text[j] === '}' || text[j] === ']')) {
      out += ' null'
      inserted++
    }
  }
  return { text: out, count: inserted }
}

// 补全未闭合：悬空转义符、缺失的收尾引号、逆序补齐括号
function completeJson(text) {
  const info = { danglingEscape: false, unclosedString: false, closers: '', text }
  const { mask, inStrAtEnd } = buildStringMask(text)
  const stack = []
  for (let i = 0; i < text.length; i++) {
    if (mask[i]) continue
    const c = text[i]
    if (c === '{') stack.push('}')
    else if (c === '[') stack.push(']')
    else if (c === '}' || c === ']') {
      const idx = stack.lastIndexOf(c)
      if (idx !== -1) stack.length = idx
    }
  }
  let out = text
  if (inStrAtEnd) {
    let bs = 0
    for (let k = out.length - 1; k >= 0 && out[k] === '\\'; k--) bs++
    if (bs % 2 === 1) {
      out = out.slice(0, -1)
      info.danglingEscape = true
    }
    out += '"'
    info.unclosedString = true
  }
  while (stack.length) info.closers += stack.pop()
  out += info.closers
  info.text = out
  return info
}

// 主修复流程：返回 { text, steps, valid, error, errorPos, errorLine, errorCol }
function repairTruncatedJson(raw) {
  const steps = []
  const step = (name, hit, detail) => {
    steps.push({ name, hit, detail: hit ? detail : '' })
  }
  let text = String(raw == null ? '' : raw).trim()

  // ① 剥除 Markdown 代码围栏
  let fenced = false
  if (text.startsWith('```')) {
    const stripped = text
      .replace(/^```[a-zA-Z0-9_-]*[ \t]*\r?\n?/, '')
      .replace(/\r?\n?[ \t]*```\s*$/, '')
    if (stripped !== text) {
      text = stripped.trim()
      fenced = true
    }
  }
  step('剥除 Markdown 代码围栏', fenced, fenced ? '已移除 ``` 包裹' : '')

  // ② 删除 // 与 /* */ 注释
  const noComments = stripJsonComments(text)
  const removedComments = noComments !== text
  if (removedComments) text = noComments.trim()
  step('删除 // 与 /* */ 注释', removedComments, removedComments ? '已移除注释（跳过字符串内）' : '')

  // ⑤(先执行) 截断处特殊处理：冒号结尾补 null，逗号结尾删除再补
  let truncFixed = ''
  if (text.endsWith(':')) {
    text += ' null'
    truncFixed = '冒号结尾，补全 null 值'
  } else if (text.endsWith(',')) {
    text = text.slice(0, -1)
    truncFixed = '删除悬挂逗号后参与补全'
  }
  step('截断处特殊处理（冒号补 null / 逗号删除）', !!truncFixed, truncFixed)

  // ④-a 空值补全：": }" → ": null }"
  const ev = fixEmptyValues(text)
  if (ev.count > 0) text = ev.text
  step('空值补全（冒号后缺值插入 null）', ev.count > 0, ev.count > 0 ? `补全 ${ev.count} 处` : '')

  // ③ 清理尾逗号（补全前先清一次）
  const tc1 = fixTrailingCommas(text)
  if (tc1.count > 0) text = tc1.text
  step('清理尾逗号', tc1.count > 0, tc1.count > 0 ? `移除 ${tc1.count} 处 ] / } 前的逗号` : '')

  // ④-b 补全未闭合的引号与括号
  const done = completeJson(text)
  const fixedParts = []
  if (done.danglingEscape) fixedParts.push('移除悬空转义符')
  if (done.unclosedString) fixedParts.push('补全字符串引号')
  if (done.closers) fixedParts.push(`补全括号 ${done.closers.split('').join(' ')}`)
  text = done.text
  step('补全未闭合的引号与括号', fixedParts.length > 0, fixedParts.join('，'))

  // ③-b 补全后再清一次尾逗号（如 ,"x" 补引号后产生的 ",}"）
  const tc2 = fixTrailingCommas(text)
  if (tc2.count > 0) text = tc2.text

  // 验证
  let valid = false
  let error = ''
  let errorPos = null
  let errorLine = 0
  let errorCol = 0
  try {
    JSON.parse(text)
    valid = true
  } catch (e) {
    error = e && e.message ? e.message : String(e)
    const m = error.match(/position (\d+)/i)
    if (m) {
      errorPos = Number(m[1])
      const before = text.slice(0, errorPos)
      errorLine = before.split('\n').length
      errorCol = errorPos - before.lastIndexOf('\n')
    }
  }

  return {
    text,
    steps,
    valid,
    error,
    errorPos,
    errorLine,
    errorCol
  }
}

// 轻量 JSON 着色（返回 HTML，内容已转义）
function highlightJsonHtml(jsonStr) {
  const esc = String(jsonStr)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (m, str, colon) => {
      if (str) {
        if (colon) return `<span class="text-sky-600 dark:text-sky-300">${str}</span>${colon}`
        return `<span class="text-emerald-600 dark:text-emerald-300">${str}</span>`
      }
      if (m === 'true' || m === 'false' || m === 'null') {
        return `<span class="text-purple-600 dark:text-purple-300">${m}</span>`
      }
      return `<span class="text-amber-600 dark:text-amber-300">${m}</span>`
    }
  )
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const input = ref('')
const result = ref(null)
const autoRepair = ref(true)
const copied = ref(false)
const seoContentVisible = ref(true)

const examples = [
  { label: '截断数组', value: '{"name": "a", "tags": ["x", "y"' },
  { label: 'Markdown 围栏', value: '```json\n{"a":1,}\n```' },
  { label: '半截字符串', value: '{"a": 1, "b": "text' },
  { label: '缺失值', value: '{"a": }' },
  { label: '冒号截断', value: '{"ok": true, "next":' }
]

let copyTimer = null
const copyOutput = async () => {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(result.value.text)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

const runRepair = () => {
  const source = input.value
  if (!source.trim()) {
    result.value = null
    return
  }
  const r = repairTruncatedJson(source)
  result.value = r
}

const doRepair = () => {
  runRepair()
}

watch(input, () => {
  if (autoRepair.value) runRepair()
})

const highlighted = computed(() => {
  if (!result.value) return ''
  let pretty = result.value.text
  if (result.value.valid) {
    try {
      pretty = JSON.stringify(JSON.parse(result.value.text), null, 2)
    } catch (e) {
      // 保持原文
    }
  }
  return highlightJsonHtml(pretty)
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
