<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BarChart3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">代码行数统计器</h1>
          <p class="text-sm text-muted-foreground mt-1">多文件或粘贴代码，统计总行/代码/注释/空行与注释率</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        支持两种输入：批量选择代码文件（按扩展名自动识别 20 余种语言）或直接粘贴代码（可手动指定语言）。按语言感知的注释规则统计总行数、代码行、注释行、空行，多文件时列出每个文件的行数与占比，并给出注释率与平均行长。全部统计在浏览器本地完成，代码不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入区 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <List class="w-5 h-5 mr-2 text-primary" /> 输入方式
          </h2>
          <div class="grid grid-cols-2 gap-1.5 mb-4">
            <button
              v-for="m in modes"
              :key="m.value"
              @click="mode = m.value"
              :class="mode === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >{{ m.label }}</button>
          </div>

          <!-- 多文件模式 -->
          <template v-if="mode === 'files'">
            <div
              class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
              :class="{ 'border-primary/60 bg-primary/5': isDragging }"
              @click="triggerFileSelect"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileChange" />
              <FileDiff class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
              <p class="text-xs text-muted-foreground">点击选择或拖入多个代码文件</p>
              <p class="text-[10px] text-muted-foreground/70 mt-1">按扩展名识别语言，文件不会上传</p>
            </div>
            <div v-if="fileEntries.length" class="mt-4 flex items-center justify-between">
              <p class="text-xs text-muted-foreground">已添加 {{ fileEntries.length }} 个文件</p>
              <button
                @click="clearFiles"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-all flex items-center gap-1"
              >
                <RefreshCw class="w-3 h-3" /> 全部移除
              </button>
            </div>
          </template>

          <!-- 粘贴模式 -->
          <template v-else>
            <label class="block text-sm font-medium text-foreground mb-2">代码语言</label>
            <select
              v-model="pasteLang"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-3"
            >
              <option v-for="(lang, key) in LANGS" :key="key" :value="key">{{ lang.name }}</option>
            </select>
            <textarea
              v-model="pasteText"
              class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="粘贴代码内容，统计将按所选语言的注释规则进行"
              spellcheck="false"
            ></textarea>
          </template>
        </div>

        <!-- 统计口径 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-medium text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 统计口径（cloc 风格）
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">空行</span>：仅含空白字符的行</li>
            <li>• <span class="text-foreground">注释行</span>：整行均为注释，含块注释的中间行</li>
            <li>• <span class="text-foreground">代码行</span>：含任何代码的行；「代码 + 行内注释」的混合行计为代码行</li>
            <li>• 扫描时会跟踪引号状态，字符串里的 // 与 # 不会被误判为注释</li>
            <li>• <span class="text-foreground">平均行长</span>：每行去除首尾空白后的平均字符数</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：统计结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 总计卡 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-primary">{{ stats.total }}</p>
            <p class="text-xs text-muted-foreground mt-1">总行数</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-foreground">{{ stats.code }}</p>
            <p class="text-xs text-muted-foreground mt-1">代码行</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-foreground">{{ stats.comment }}</p>
            <p class="text-xs text-muted-foreground mt-1">注释行</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-foreground">{{ stats.blank }}</p>
            <p class="text-xs text-muted-foreground mt-1">空行</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-foreground">{{ commentRate }}</p>
            <p class="text-xs text-muted-foreground mt-1">注释率</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <p class="text-2xl font-bold text-foreground">{{ stats.avgLen }}</p>
            <p class="text-xs text-muted-foreground mt-1">平均行长</p>
          </div>
        </div>

        <!-- 多文件表格 -->
        <div v-if="mode === 'files'" class="bg-card border border-border rounded-lg">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileDiff class="w-5 h-5 mr-2 text-primary" /> 文件明细
            </h2>
            <span v-if="fileEntries.length" class="text-xs text-muted-foreground">删除单行会自动重新汇总</span>
          </div>
          <div v-if="fileEntries.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2.5 px-6 font-medium">文件</th>
                  <th class="py-2.5 px-3 font-medium">语言</th>
                  <th class="py-2.5 px-3 font-medium text-right">总行</th>
                  <th class="py-2.5 px-3 font-medium text-right">代码</th>
                  <th class="py-2.5 px-3 font-medium text-right">注释</th>
                  <th class="py-2.5 px-3 font-medium text-right">空行</th>
                  <th class="py-2.5 px-3 font-medium w-36">占比</th>
                  <th class="py-2.5 px-6"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/50">
                <tr v-for="f in fileEntries" :key="f.id">
                  <td class="py-2.5 px-6 text-foreground max-w-[220px] truncate" :title="f.name">{{ f.name }}</td>
                  <td class="py-2.5 px-3 text-muted-foreground">{{ LANGS[f.langKey].name }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground font-mono">{{ f.total }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground font-mono">{{ f.code }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground font-mono">{{ f.comment }}</td>
                  <td class="py-2.5 px-3 text-right text-foreground font-mono">{{ f.blank }}</td>
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-1.5 bg-primary/20 rounded overflow-hidden">
                        <div class="h-1.5 bg-primary rounded" :style="{ width: fileShare(f) + '%' }"></div>
                      </div>
                      <span class="text-xs text-muted-foreground w-12 text-right">{{ fileShare(f) }}%</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-6 text-right">
                    <button
                      @click="removeFile(f.id)"
                      class="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="移除该文件"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="py-12 text-center">
            <FileDiff class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">添加代码文件后，这里会列出每个文件的统计明细</p>
          </div>
        </div>

        <!-- 粘贴模式说明 -->
        <div v-else class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <List class="w-4 h-4 mr-2 text-primary" /> 语言与注释规则对照
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <p>• <span class="text-foreground">JS / TS / JSX / TSX / Go / Java / Rust / C / C++ / C#</span>：// 与 /* */</p>
            <p>• <span class="text-foreground">Python / Ruby / Shell / YAML / TOML</span>：#（Ruby 另识 =begin / =end）</p>
            <p>• <span class="text-foreground">HTML / XML / SVG</span>：&lt;!-- --&gt;</p>
            <p>• <span class="text-foreground">CSS</span>：仅 /* */；<span class="text-foreground">Vue</span>：// 与 /* */ 与 &lt;!-- --&gt; 均识别</p>
            <p>• <span class="text-foreground">SQL</span>：-- 与 /* */</p>
            <p>• <span class="text-foreground">JSON / Markdown / 纯文本</span>：无注释规则，仅区分代码行与空行</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于代码行数统计器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            代码行数（Lines of Code, LOC）是最直观的规模度量。单一的「总行数」意义有限，行业通行做法是像 cloc 那样把它拆分为代码行、注释行与空行三个口径：代码行反映有效工作量，注释率反映可维护性投入，空行比例则与团队格式规范相关。本工具在浏览器端实现了类似 cloc 的语言感知统计，不安装命令行工具也能快速得到结果。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>接手项目时快速了解代码规模与注释覆盖情况</li>
            <li>统计某次提交或某个模块的代码增量，写进周报或工作量说明</li>
            <li>课程作业、外包验收等需要对交付代码规模做佐证的场景</li>
            <li>粘贴单文件快速查看行数构成，无需 git 或命令行</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">统计口径和 cloc 完全一致吗？</span>口径一致（空行 / 注释行 / 代码行三类），实现为浏览器端简化版，极端语法（模板字符串内出现注释标记等）可能有细微误差。</li>
            <li><span class="text-foreground font-medium">文件会被上传吗？</span>不会。文件只在浏览器内存中读取统计，刷新页面即消失。</li>
            <li><span class="text-foreground font-medium">支持哪些语言？</span>按扩展名识别 20 余种：js/ts/jsx/tsx/vue/py/go/java/rs/c/cpp/cs/php/css/html/xml/md/json/yml/sh/rb/toml/sql 等，未知扩展名按纯文本统计。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'loc-counter'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  BarChart3, FileDiff, List, Info, Trash2, RefreshCw, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '代码行数统计器 - 在线LOC统计/代码行/注释行/空行分析',
  description: '在线代码行数统计工具，支持多文件或粘贴代码，按语言感知注释规则统计总行数、代码行、注释行、空行、注释率与平均行长，支持20余种语言，纯本地统计不上传',
  keywords: '代码行数统计, loc统计, 代码行数, 注释率, cloc, 代码统计工具, 行数分析',
  author: 'Util工具箱',
  ogTitle: '代码行数统计器 - 有条工具',
  ogDescription: '多文件或粘贴代码，统计总行/代码/注释/空行与注释率',
  ogUrl: 'https://www.util.cn/tools/loc-counter',
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
          name: '代码行数统计器',
          url: 'https://www.util.cn/tools/loc-counter',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多文件批量统计', '语言感知注释规则', '注释率与平均行长', '单文件移除重新汇总']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '代码行数统计器', item: 'https://www.util.cn/tools/loc-counter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '一行里既有代码又有注释怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '按 cloc 口径，混合行计为代码行；只有整行均为注释（含块注释的中间行）才计为注释行。' }
            },
            {
              '@type': 'Question',
              name: '上传的代码会被保存吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。所有文件只在浏览器内存中读取并统计，不经过任何服务器，刷新页面即消失。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'loc-counter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 语言规则（行注释 / 块注释） ----------
const LANGS = {
  plain: { name: '纯文本', line: [], block: [] },
  js: { name: 'JavaScript', line: ['//'], block: [['/*', '*/']] },
  ts: { name: 'TypeScript', line: ['//'], block: [['/*', '*/']] },
  jsx: { name: 'JSX', line: ['//'], block: [['/*', '*/']] },
  tsx: { name: 'TSX', line: ['//'], block: [['/*', '*/']] },
  vue: { name: 'Vue', line: ['//'], block: [['/*', '*/'], ['<!--', '-->']] },
  py: { name: 'Python', line: ['#'], block: [] },
  go: { name: 'Go', line: ['//'], block: [['/*', '*/']] },
  java: { name: 'Java', line: ['//'], block: [['/*', '*/']] },
  kt: { name: 'Kotlin', line: ['//'], block: [['/*', '*/']] },
  rs: { name: 'Rust', line: ['//'], block: [['/*', '*/']] },
  c: { name: 'C', line: ['//'], block: [['/*', '*/']] },
  cpp: { name: 'C++', line: ['//'], block: [['/*', '*/']] },
  cs: { name: 'C#', line: ['//'], block: [['/*', '*/']] },
  swift: { name: 'Swift', line: ['//'], block: [['/*', '*/']] },
  php: { name: 'PHP', line: ['//', '#'], block: [['/*', '*/']] },
  css: { name: 'CSS', line: [], block: [['/*', '*/']] },
  scss: { name: 'SCSS', line: ['//'], block: [['/*', '*/']] },
  html: { name: 'HTML', line: [], block: [['<!--', '-->']] },
  xml: { name: 'XML', line: [], block: [['<!--', '-->']] },
  md: { name: 'Markdown', line: [], block: [] },
  json: { name: 'JSON', line: [], block: [] },
  yml: { name: 'YAML', line: ['#'], block: [] },
  sh: { name: 'Shell', line: ['#'], block: [] },
  rb: { name: 'Ruby', line: ['#'], block: [['=begin', '=end']] },
  toml: { name: 'TOML', line: ['#'], block: [] },
  sql: { name: 'SQL', line: ['--'], block: [['/*', '*/']] }
}

const EXT_LANG = {
  js: 'js', mjs: 'js', cjs: 'js',
  ts: 'ts', mts: 'ts', cts: 'ts',
  jsx: 'jsx', tsx: 'tsx',
  vue: 'vue',
  py: 'py', pyw: 'py',
  go: 'go',
  java: 'java', kt: 'kt', kts: 'kt',
  rs: 'rs',
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hh: 'cpp',
  cs: 'cs',
  swift: 'swift',
  php: 'php',
  css: 'css',
  scss: 'scss', sass: 'scss', less: 'scss',
  html: 'html', htm: 'html',
  xml: 'xml', svg: 'xml',
  md: 'md', markdown: 'md',
  json: 'json', jsonc: 'json',
  yml: 'yml', yaml: 'yml',
  sh: 'sh', bash: 'sh', zsh: 'sh',
  rb: 'rb',
  toml: 'toml',
  sql: 'sql'
}

// ---------- 核心统计（引号感知的逐行扫描） ----------
const scanLine = (s, lang) => {
  let i = 0
  let quote = null
  let sawCode = false
  while (i < s.length) {
    const ch = s[i]
    if (quote) {
      if (ch === '\\') { i += 2; continue }
      if (ch === quote) quote = null
      i++
      continue
    }
    let hit = null
    for (const t of lang.line) {
      if (s.startsWith(t, i)) { hit = { kind: 'line' }; break }
    }
    if (!hit) {
      for (const [bs, be] of lang.block) {
        if (s.startsWith(bs, i)) { hit = { kind: 'block', bs, be }; break }
      }
    }
    if (hit) {
      if (hit.kind === 'line') return { type: sawCode ? 'code' : 'comment' }
      const endIdx = s.indexOf(hit.be, i + hit.bs.length)
      if (endIdx === -1) return { type: sawCode ? 'code' : 'comment', enterBlock: hit.be }
      const after = s.slice(endIdx + hit.be.length)
      if (after.trim()) {
        const r = scanLine(after, lang)
        return { type: (sawCode || r.type === 'code') ? 'code' : 'comment', enterBlock: r.enterBlock }
      }
      return { type: sawCode ? 'code' : 'comment' }
    }
    if (ch === '\'' || ch === '"' || ch === '`') { quote = ch; sawCode = true; i++; continue }
    if (!/\s/.test(ch)) sawCode = true
    i++
  }
  return { type: sawCode ? 'code' : 'blank' }
}

const analyzeCode = (code, lang) => {
  const lines = code.split(/\r\n|\r|\n/)
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  let codeL = 0
  let commentL = 0
  let blankL = 0
  let charTotal = 0
  let blockEnd = null
  for (const raw of lines) {
    charTotal += raw.trim().length
    let line = raw
    if (blockEnd) {
      const idx = line.indexOf(blockEnd)
      if (idx === -1) { commentL++; continue }
      line = line.slice(idx + blockEnd.length)
      blockEnd = null
      if (!line.trim()) { commentL++; continue }
    }
    const res = scanLine(line, lang)
    if (res.type === 'code') codeL++
    else if (res.type === 'comment') commentL++
    else blankL++
    if (res.enterBlock) blockEnd = res.enterBlock
  }
  const total = codeL + commentL + blankL
  return {
    total,
    code: codeL,
    comment: commentL,
    blank: blankL,
    charTotal,
    avgLen: total ? +(charTotal / total).toFixed(1) : 0
  }
}

// ---------- 状态 ----------
const modes = [
  { value: 'files', label: '多文件' },
  { value: 'paste', label: '粘贴代码' }
]
const mode = ref('files')
const isDragging = ref(false)
const fileInput = ref(null)
const fileEntries = ref([])
const pasteText = ref('')
const pasteLang = ref('js')
const seoContentVisible = ref(true)
let nextId = 1

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 多文件 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  addFiles(e.target.files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  addFiles(e.dataTransfer?.files)
}

const addFiles = async (fileList) => {
  const files = Array.from(fileList || [])
  for (const f of files) {
    try {
      const text = await f.text()
      const ext = (f.name.includes('.') ? f.name.split('.').pop() : '').toLowerCase()
      const langKey = EXT_LANG[ext] || 'plain'
      const stat = analyzeCode(text, LANGS[langKey])
      fileEntries.value.push({ id: nextId++, name: f.name, ext, langKey, ...stat })
    } catch (err) { /* 跳过无法读取的文件 */ }
  }
}

const removeFile = (id) => {
  fileEntries.value = fileEntries.value.filter(f => f.id !== id)
}

const clearFiles = () => { fileEntries.value = [] }

const totals = computed(() => {
  const sum = { total: 0, code: 0, comment: 0, blank: 0, charTotal: 0 }
  for (const f of fileEntries.value) {
    sum.total += f.total
    sum.code += f.code
    sum.comment += f.comment
    sum.blank += f.blank
    sum.charTotal += f.charTotal
  }
  sum.avgLen = sum.total ? +(sum.charTotal / sum.total).toFixed(1) : 0
  return sum
})

const fileShare = (f) => {
  if (!totals.value.total) return '0.0'
  return ((f.total / totals.value.total) * 100).toFixed(1)
}

// ---------- 当前统计 ----------
const stats = computed(() => {
  if (mode.value === 'files') return totals.value
  return analyzeCode(pasteText.value, LANGS[pasteLang.value])
})

const commentRate = computed(() => {
  const denom = stats.value.code + stats.value.comment
  if (!denom) return '0%'
  return ((stats.value.comment / denom) * 100).toFixed(1) + '%'
})
</script>
