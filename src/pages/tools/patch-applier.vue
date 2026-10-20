<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileDiff class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Patch补丁应用器</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 .diff/.patch 与源文件，本地按 hunk 逐块应用，失败精确到行</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        解析 unified diff（<code class="font-mono text-xs">--- a/x +++ b/x</code> 文件头 + <code class="font-mono text-xs">@@ -l,s +l,s @@</code> 块），对每个 hunk 先按声明行号定位，上下文不符时自动在附近行号搜索匹配位置；仍不匹配就把「期望上下文 / 实际内容」摆出来并跳过该块，绝不崩。全部 hunk 按顺序累计行号位移，输出可直接复制的结果文件。不做 fuzz 模糊合并——匹配不了就明确报错。所有内容留在浏览器本地处理。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <FileDiff class="w-5 h-5 mr-2 text-primary" /> Diff 补丁内容
          </h2>
          <textarea
            v-model="diffText"
            class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 unified diff，例如：&#10;--- a/demo.txt&#10;+++ b/demo.txt&#10;@@ -2,3 +2,3 @@&#10; line2&#10;-line3&#10;+line3-modified&#10; line4"
            spellcheck="false"
          ></textarea>
          <p class="text-xs text-muted-foreground">
            解析到 <span class="text-foreground font-semibold">{{ parsedFiles.length }}</span> 个文件段、
            <span class="text-foreground font-semibold">{{ totalHunks }}</span> 个 hunk。
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <FileText class="w-5 h-5 mr-2 text-primary" /> 源文件内容
          </h2>
          <textarea
            v-model="sourceText"
            class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴要打补丁的源文件全文"
            spellcheck="false"
          ></textarea>
          <p class="text-xs text-muted-foreground">源文件共 {{ sourceLineCount }} 行。</p>
          <div class="flex gap-2">
            <button @click="fillSample" class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all">填入示例</button>
            <button @click="clearAll" class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all">清空</button>
          </div>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <!-- hunk 应用状态 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
            <ListChecks class="w-5 h-5 mr-2 text-primary" /> 逐块应用结果
          </h2>
          <div v-if="totalHunks === 0" class="py-8 text-center">
            <FileDiff class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">粘贴 diff 后，每个 hunk 的成功/失败状态显示在这里</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(r, ri) in applied.results"
              :key="ri"
              :class="r.applied
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/40'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40'"
              class="border rounded-lg p-3"
            >
              <p class="text-xs font-semibold flex items-center gap-1.5" :class="r.applied ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
                <Check v-if="r.applied" class="w-4 h-4" />
                <X v-else class="w-4 h-4" />
                {{ r.file || '(未标注文件)' }} · {{ r.hunkHead }}
                <span v-if="r.applied" class="font-normal text-green-600/80 dark:text-green-400/80">已应用（第 {{ r.at }} 行{{ (r.at - r.declared) !== 0 ? '，位移 ' + ((r.at - r.declared) > 0 ? '+' : '') + (r.at - r.declared) : '，原位' }}）</span>
                <span v-else class="font-normal">{{ r.reason }}</span>
              </p>
              <div v-if="!r.applied" class="mt-2 text-xs font-mono space-y-1">
                <p class="text-red-600 dark:text-red-400 break-all">期望：{{ r.expected === '' ? '(空行)' : r.expected }}</p>
                <p class="text-amber-700 dark:text-amber-400 break-all">实际（第 {{ r.atLine }} 行）：{{ r.actual === '' ? '(空行)' : r.actual }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 结果文件 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
            <FileCheck class="w-5 h-5 mr-2 text-primary" /> 结果文件
          </h2>
          <div v-if="diffSummary.appliedCount > 0 || diffSummary.failedCount > 0" class="flex items-center gap-3 mb-3 text-xs">
            <span class="text-green-600 dark:text-green-400">成功 {{ diffSummary.appliedCount }}</span>
            <span :class="diffSummary.failedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'">失败 {{ diffSummary.failedCount }}</span>
            <button
              @click="copyText(applied.text, 'out')"
              class="ml-auto flex items-center gap-1 px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
            >
              <Check v-if="copiedKey === 'out'" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === 'out' ? '已复制' : '复制结果' }}
            </button>
          </div>
          <pre v-if="applied.text" class="bg-muted/50 rounded-lg p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all max-h-72 overflow-auto text-foreground">{{ applied.text }}</pre>
          <p v-else class="text-sm text-muted-foreground">在左侧输入 diff 与源文件后，这里输出打过补丁的完整内容。</p>
        </div>

        <!-- 补丁高亮 -->
        <div v-if="parsedFiles.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
            <Braces class="w-5 h-5 mr-2 text-primary" /> 补丁内容高亮
          </h2>
          <div class="max-h-72 overflow-auto space-y-3">
            <div v-for="(f, fi) in parsedFiles" :key="fi">
              <p class="text-xs font-mono text-primary mb-1">{{ f.name || '(未标注文件)' }}</p>
              <div v-for="(h, hi) in f.hunks" :key="fi + '-' + hi" class="mb-2 rounded border border-border/60 overflow-hidden">
                <p class="text-[10px] font-mono bg-muted px-2 py-1 text-muted-foreground">{{ h.hunkHead }}</p>
                <p
                  v-for="(b, bi) in h.body"
                  :key="bi"
                  class="text-xs font-mono px-2 py-0.5 break-all whitespace-pre-wrap"
                  :class="b.type === 'add' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                    : b.type === 'del' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    : 'text-muted-foreground'"
                >{{ (b.type === 'add' ? '+' : b.type === 'del' ? '-' : ' ') + (b.text === '' ? '' : b.text) }}</p>
              </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 Patch 补丁应用器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            unified diff 是 Git、<code class="font-mono">diff -u</code>、各类 PR 导出补丁的通用格式。手工打补丁最怕「行号对不上」：本工具按 hunk 逐个尝试——先用声明的起始行定位，把上下文（空格行）与待删行（-行）与源文件逐字比对；不一致就在附近行号双向搜索，找到完全吻合处再落刀，找不到就整块标记失败并展示冲突行，其余 hunk 照常处理。
          </p>
          <h3 class="text-lg font-semibold text-foreground">如何使用</h3>
          <ol class="list-decimal pl-5 space-y-1.5">
            <li>把 <code class="font-mono">git diff &gt; x.patch</code> 或 <code class="font-mono">diff -u</code> 产出的补丁粘到左上；</li>
            <li>把要修改的源文件全文粘到左下（单文件场景；多文件段会按顺序作用于同一份文本，仅供预览）；</li>
            <li>查看每个 hunk 的成功/失败标记，失败块附带「期望 vs 实际」行；</li>
            <li>点击「复制结果」拿到应用后的完整文件内容，回编辑器保存即可。</li>
          </ol>
          <h3 class="text-lg font-semibold text-foreground">定位与失败规则</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>匹配依据是上下文与删除行的逐字相等（含行首尾空格）；纯新增 hunk（删除行为 0 条）在就近位置直接插入。</li>
            <li>就近搜索覆盖 ±max(300, 文件行数) 行，可吸收上方 hunk 造成的行号漂移；多个 hunk 按补丁顺序应用并累计位移。</li>
            <li>本工具不做 fuzz（允许忽略 1-2 行上下文的模糊合并），宁可失败报告也不静默放错位置——生产环境请配合 <code class="font-mono">git apply</code> 复核。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么全部 hunk 都失败？</span>多半是源文件粘错了版本（或行尾换行风格 CRLF/LF 不一致——本工具按行比较时不换算行尾符，请保持同一来源）；看失败详情里的期望与实际行即可判断。</li>
            <li><span class="text-foreground font-medium">新建或删除文件的补丁怎么处理？</span><code class="font-mono">--- /dev/null</code> 表示新建，源文件留空即可整段插入；反之删除文件补丁要求源内容与被删行完全一致。git 扩展头（diff --git、index 行）会被自动忽略。</li>
            <li><span class="text-foreground font-medium">补丁和文件会被上传吗？</span>不会，解析与应用全部在浏览器本地完成，适合未公开的产品代码与内部补丁。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'patch-applier'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileDiff, FileText, ListChecks, FileCheck, Copy, Check, X, Braces,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Patch补丁应用器 - unified diff在线应用与冲突定位',
  description: '在线补丁应用器，解析 unified diff 按 hunk 逐块应用到源文本：行号定位、上下文容错搜索、行号位移累计，失败精确展示期望与实际行，输出结果文件可复制，纯本地处理',
  keywords: 'patch应用, unified diff解析, 打补丁工具, git diff手工应用, hunk冲突, diff应用器',
  author: 'Util工具箱',
  ogTitle: 'Patch补丁应用器 - 有条工具',
  ogDescription: '粘贴 .patch/.diff 与源文件，本地预览改动并尝试应用，失败定位到具体块',
  ogUrl: 'https://www.util.cn/tools/patch-applier',
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
          name: 'Patch补丁应用器',
          url: 'https://www.util.cn/tools/patch-applier',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['unified diff 解析', 'hunk 级成功/失败标记', '上下文就近搜索', '多块行号位移累计', '期望与实际行冲突展示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Patch补丁应用器', item: 'https://www.util.cn/tools/patch-applier/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么全部 hunk 都失败？',
              acceptedAnswer: { '@type': 'Answer', text: '多半是源文件版本与补丁基线不一致，或 CRLF/LF 行尾差异导致上下文逐字比对失败，展开失败详情的期望与实际行即可判断。' }
            },
            {
              '@type': 'Question',
              name: '新建或删除文件怎么打补丁？',
              acceptedAnswer: { '@type': 'Answer', text: '--- /dev/null 表示新建文件，源留空即可整段插入；删除文件要求源内容与待删行完全一致；git 扩展头（diff --git、index 行）会被自动忽略。' }
            },
            {
              '@type': 'Question',
              name: '支持模糊合并（fuzz）吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不支持。本工具只做精确上下文匹配与就近位置搜索，宁可整块失败报错也不静默错位应用；生产环境请配合 git apply 复核。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'patch-applier')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== 纯函数（node 自测提取区）begin ==== */
function formatHunkHead(hunk) {
  return '@@ -' + hunk.oldStart + ',' + hunk.oldCount + ' +' + hunk.newStart + ',' + hunk.newCount + ' @@'
}

// 解析 unified diff -> [{ name, hunks: [{ oldStart, oldCount, newStart, newCount, body: [{type,text}] }] }]
function parseUnifiedDiff(text) {
  const lines = String(text == null ? '' : text).split(/\r?\n/)
  const files = []
  let cur = null
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const hm = line.match(/^@@+ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
    if (hm) {
      if (!cur) {
        cur = { name: '(未标注文件)', hunks: [] }
        files.push(cur)
      }
      const hunk = {
        oldStart: Number(hm[1]),
        oldCount: hm[2] === undefined ? 1 : Number(hm[2]),
        newStart: Number(hm[3]),
        newCount: hm[4] === undefined ? 1 : Number(hm[4]),
        body: []
      }
      cur.hunks.push(hunk)
      i++
      let oldSeen = 0
      let newSeen = 0
      while (i < lines.length && (oldSeen < hunk.oldCount || newSeen < hunk.newCount)) {
        const bl = lines[i]
        if (/^\\/.test(bl)) { i++; continue } // "\ No newline at end of file"
        let entry = null
        if (bl === '') entry = { type: 'ctx', text: '' } // 容错：上下文空行丢失前导空格
        else if (bl[0] === ' ') entry = { type: 'ctx', text: bl.slice(1) }
        else if (bl[0] === '-') entry = { type: 'del', text: bl.slice(1) }
        else if (bl[0] === '+') entry = { type: 'add', text: bl.slice(1) }
        if (!entry) break // 到达下一个 @@ / 文件头
        if (entry.type === 'ctx') { oldSeen++; newSeen++ }
        else if (entry.type === 'del') oldSeen++
        else newSeen++
        hunk.body.push(entry)
        i++
      }
      continue
    }
    if (/^\+\+\+\s/.test(line)) {
      const nm = line.slice(4).trim().split(/\s+/)[0] || ''
      cur = { name: nm.replace(/^b\//, ''), hunks: [] }
      files.push(cur)
      i++
      continue
    }
    i++ // --- 行、diff --git、index、模拟模式等扩展头直接忽略
  }
  return files.filter(f => f.hunks.length > 0)
}

function matchAt(lines, pos, olds) {
  if (pos < 0 || pos + olds.length > lines.length) return false
  for (let k = 0; k < olds.length; k++) {
    if (lines[pos + k] !== olds[k]) return false
  }
  return true
}

// 单个 hunk：先按 base 定位，失败则双向就近搜索
function applyHunkToLines(lines, hunk, offset) {
  const olds = []
  const news = []
  for (const b of hunk.body) {
    if (b.type === 'add') news.push(b.text)
    else {
      olds.push(b.text)
      if (b.type === 'ctx') news.push(b.text)
    }
  }
  const base = Math.max(0, Math.min(lines.length, hunk.oldStart - 1 + offset))
  const maxSearch = Math.max(300, lines.length)
  for (let d = 0; d <= maxSearch; d++) {
    const candidates = d === 0 ? [base] : [base - d, base + d]
    for (const pos of candidates) {
      if (matchAt(lines, pos, olds)) {
        const out = lines.slice(0, pos).concat(news, lines.slice(pos + olds.length))
        return {
          ok: true,
          lines: out,
          appliedAt: pos,
          shift: pos - (hunk.oldStart - 1) + (news.length - olds.length)
        }
      }
    }
  }
  // 失败：报告 base 处第一处不一致
  let expected = ''
  let actual = ''
  let mismatchLine = base + 1
  if (olds.length === 0) {
    expected = '(纯新增，无需匹配)'
    actual = '(插入点越界)'
    mismatchLine = base
  } else {
    for (let k = 0; k < olds.length; k++) {
      if (lines[base + k] !== olds[k]) {
        expected = olds[k]
        actual = base + k < lines.length ? lines[base + k] : '(该行不存在)'
        mismatchLine = base + k + 1
        break
      }
    }
  }
  return { ok: false, reason: '上下文不匹配', expected, actual, base, mismatchLine }
}

function applyPatchToSource(sourceText, patchFiles) {
  let lines = String(sourceText == null ? '' : sourceText).split(/\r?\n/)
  if (lines.length === 1 && lines[0] === '') lines = []
  const results = []
  let offset = 0
  for (const f of patchFiles) {
    for (const hunk of f.hunks) {
      const r = applyHunkToLines(lines, hunk, offset)
      if (r.ok) {
        lines = r.lines
        offset = r.shift
        results.push({
          file: f.name,
          applied: true,
          at: r.appliedAt + 1,
          declared: hunk.oldStart,
          hunkHead: formatHunkHead(hunk)
        })
      } else {
        results.push({
          file: f.name,
          applied: false,
          reason: r.reason,
          expected: r.expected,
          actual: r.actual,
          atLine: r.mismatchLine,
          hunkHead: formatHunkHead(hunk)
        })
      }
    }
  }
  return { text: lines.join('\n'), results }
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 状态 ----------
const diffText = ref('')
const sourceText = ref('')
const seoContentVisible = ref(true)
const copiedKey = ref('')
let copyTimer = null

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const parsedFiles = computed(() => parseUnifiedDiff(diffText.value))
const totalHunks = computed(() => parsedFiles.value.reduce((n, f) => n + f.hunks.length, 0))
const sourceLineCount = computed(() => {
  const s = sourceText.value
  if (s === '') return 0
  return s.split(/\r?\n/).length
})
const applied = computed(() => applyPatchToSource(sourceText.value, parsedFiles.value))
const diffSummary = computed(() => {
  let a = 0
  let f = 0
  for (const r of applied.value.results) {
    if (r.applied) a++
    else f++
  }
  return { appliedCount: a, failedCount: f }
})

const copyText = async (text, key) => {
  let ok = false
  try {
    await navigator.clipboard.writeText(text)
    ok = true
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      ok = true
    } catch (e2) {
      ok = false
    }
  }
  if (ok) {
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  }
}

const fillSample = () => {
  sourceText.value = [
    'line1',
    'line2',
    'line3',
    'line4',
    'line5'
  ].join('\n')
  diffText.value = [
    '--- a/demo.txt',
    '+++ b/demo.txt',
    '@@ -2,3 +2,4 @@',
    ' line2',
    '-line3',
    '+line3-modified',
    '+line3-extra',
    ' line4'
  ].join('\n')
}

const clearAll = () => {
  diffText.value = ''
  sourceText.value = ''
}
</script>
