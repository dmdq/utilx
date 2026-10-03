<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileDiff class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Changelog生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 git log，按 Keep a Changelog 风格生成分组 Markdown</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴 git log 输出（每行如 a1b2c3d feat: xxx，兼容 feat(api): 与 feat(api)! 形式），自动剥离 hash、按类型分组为 Added / Changed / Deprecated / Removed / Fixed / Security 六个区块，可附加版本号、日期与仓库链接（commit hash 自动转为 commit 链接），支持预览、复制与下载 .md 文件。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与参数 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <List class="w-5 h-5 mr-2 text-primary" /> git log 输入
          </h2>
          <textarea
            v-model="inputText"
            class="w-full h-56 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="a1b2c3d feat: 支持导出 PDF&#10;e4f5a6b fix(api): 修复分页参数越界&#10;9f8e7d6 feat(ui)!: 重构侧边栏交互&#10;Merge branch 'dev'"
            spellcheck="false"
          ></textarea>

          <!-- 参数 -->
          <div class="mt-4 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">版本号</label>
                <input
                  v-model="version"
                  type="text"
                  placeholder="1.4.0"
                  class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">日期</label>
                <input
                  v-model="date"
                  type="date"
                  class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">仓库链接（可选，hash 转链接）</label>
              <input
                v-model="repoLink"
                type="text"
                placeholder="https://github.com/user/repo"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <label class="flex items-center justify-between cursor-pointer bg-muted/30 rounded-lg px-3 py-2.5">
              <span class="text-sm text-foreground">输出 chore / build / ci</span>
              <button
                type="button"
                @click="includeChore = !includeChore"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="includeChore ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="includeChore ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
          </div>

          <button
            @click="clearAll"
            class="w-full mt-4 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" /> 清空
          </button>
        </div>

        <!-- 解析规则 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-medium text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 解析规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 兼容 <span class="text-foreground font-mono">hash type: 描述</span> 与不带 hash 的 <span class="text-foreground font-mono">type: 描述</span> 两种行</li>
            <li>• 兼容带 scope（<span class="text-foreground font-mono">feat(api):</span>）与破坏性标记（<span class="text-foreground font-mono">!:</span>）的提交</li>
            <li>• 类型映射：feat→Added，fix→Fixed，perf / refactor / docs / style / test→Changed，revert→Removed，deprecate→Deprecated，security→Security</li>
            <li>• Merge 提交与非规范行会跳过并在统计中列出，不会混入结果</li>
            <li>• 填写仓库链接后，hash 会渲染为 <span class="text-foreground font-mono">[a1b2c3d](仓库/commit/hash)</span> 链接</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：统计 + 预览 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 解析统计 -->
        <div v-if="inputText.trim()" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <BarChart3 class="w-4 h-4 mr-2 text-primary" /> 解析统计
          </h3>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ parseResult.entries.length }}</p>
              <p class="text-xs text-muted-foreground">解析成功</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-primary">{{ outputCount }}</p>
              <p class="text-xs text-muted-foreground">输出条目</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold" :class="parseResult.skipped.length ? 'text-yellow-500' : 'text-foreground'">{{ parseResult.skipped.length }}</p>
              <p class="text-xs text-muted-foreground">跳过条数</p>
            </div>
          </div>
          <div v-if="parseResult.skipped.length" class="flex items-start gap-2 bg-yellow-500/10 rounded-lg p-3">
            <AlertTriangle class="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div class="text-xs text-muted-foreground space-y-1">
              <p class="text-yellow-500 font-medium">跳过了 {{ parseResult.skipped.length }} 条非规范提交：</p>
              <p v-for="(s, idx) in parseResult.skipped.slice(0, 10)" :key="idx" class="font-mono break-all">
                {{ s.line }} <span class="text-muted-foreground/70">（{{ s.reason }}）</span>
              </p>
              <p v-if="parseResult.skipped.length > 10" class="text-muted-foreground/70">……其余 {{ parseResult.skipped.length - 10 }} 条略</p>
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileDiff class="w-5 h-5 mr-2 text-primary" /> Markdown 预览
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyOutput"
                :disabled="!markdown"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadOutput"
                :disabled="!markdown"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载 .md
              </button>
            </div>
          </div>
          <div class="p-6">
            <pre v-if="markdown" class="bg-muted/30 border border-border rounded-lg p-4 text-sm font-mono text-foreground whitespace-pre-wrap break-words max-h-[480px] overflow-auto">{{ markdown }}</pre>
            <div v-else class="py-16 text-center">
              <FileDiff class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">粘贴 git log 输出后，这里会生成分组的 Changelog</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于Changelog生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Keep a Changelog 是最流行的 CHANGELOG 组织约定：按 Added（新增）、Changed（变更）、Deprecated（弃用）、Removed（移除）、Fixed（修复）、Security（安全）六个固定区块分组，面向「人」而不是「提交机器」来书写。把 git log 的原始提交直接丢给用户看是糟糕的发布说明，本工具按提交类型自动完成归类整理，生成符合该约定的 Markdown。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>发版时执行 git log v1.3.0..HEAD --oneline，把输出粘贴进来一键生成发布说明</li>
            <li>开源项目按 Keep a Changelog 维护 CHANGELOG.md，配合 GitHub Releases 发布</li>
            <li>把 feat/fix 等提交自动归类，补上版本号与日期即可直接提交评审</li>
            <li>填写仓库链接后自动生成 commit 链接，方便追溯每条变更的源码</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些 git log 格式？</span>每行一条「hash type(scope): 描述」或「type: 描述」，--oneline 与 %s 格式输出均可直接粘贴。</li>
            <li><span class="text-foreground font-medium">chore 类提交去哪了？</span>默认不输出（发布说明对用户无意义），需要时打开左下角开关即可并入 Changed 区块。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会，解析与生成全部在浏览器本地完成。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'changelog-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileDiff, List, BarChart3, Info, Copy, Download, Trash2, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Changelog生成器 - git log转Keep a Changelog格式Markdown',
  description: '在线Changelog生成工具，粘贴git log提交记录自动剥离hash并按Added/Changed/Fixed等类型分组，生成Keep a Changelog风格Markdown，支持commit链接、复制与下载',
  keywords: 'changelog生成, git log格式化, keep a changelog, 发布说明生成, 更新日志, commit转changelog',
  author: 'Util工具箱',
  ogTitle: 'Changelog生成器 - 有条工具',
  ogDescription: '粘贴 git log，按 Keep a Changelog 风格生成分组 Markdown',
  ogUrl: 'https://www.util.cn/tools/changelog-generator',
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
          name: 'Changelog生成器',
          url: 'https://www.util.cn/tools/changelog-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['git log解析归类', 'Keep a Changelog格式输出', 'commit hash转链接', 'Markdown复制下载']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Changelog生成器', item: 'https://www.util.cn/tools/changelog-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '支持什么样的 git log 输入？',
              acceptedAnswer: { '@type': 'Answer', text: '每行一条「hash type: 描述」或「type: 描述」，兼容 scope 与 ! 破坏性标记（如 feat(api)!: xxx）；Merge 等非规范行会被跳过并在统计中列出。' }
            },
            {
              '@type': 'Question',
              name: '提交类型如何映射到区块？',
              acceptedAnswer: { '@type': 'Answer', text: 'feat→Added，fix→Fixed，perf/refactor/docs/style/test→Changed，revert→Removed，deprecate→Deprecated，security→Security；chore/build/ci 默认不输出，可通过开关并入 Changed。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'changelog-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  date.value = new Date().toISOString().slice(0, 10)
})

// ---------- 常量 ----------
const TYPE_SECTION = {
  feat: 'Added',
  fix: 'Fixed',
  perf: 'Changed',
  refactor: 'Changed',
  docs: 'Changed',
  style: 'Changed',
  test: 'Changed',
  revert: 'Removed',
  remove: 'Removed',
  deprecate: 'Deprecated',
  deprecated: 'Deprecated',
  security: 'Security',
  chore: 'Changed',
  build: 'Changed',
  ci: 'Changed'
}

const CHORE_TYPES = ['chore', 'build', 'ci']
const SECTION_ORDER = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security']

// 兼容 hash type(scope)!: 描述 / type: 描述
const LOG_LINE_RE = /^(?:([0-9a-f]{7,40})\s+)?(\w+)(?:\(([^)]*)\))?!?:\s*(.+)$/

// ---------- 状态 ----------
const inputText = ref('')
const version = ref('')
const date = ref('')
const repoLink = ref('')
const includeChore = ref(false)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const clearAll = () => {
  inputText.value = ''
  version.value = ''
  repoLink.value = ''
  includeChore.value = false
}

// ---------- 解析 ----------
const parseResult = computed(() => {
  const entries = []
  const skipped = []
  for (const rawLine of inputText.value.split('\n')) {
    const line = rawLine.trim().replace(/^[-*]\s+/, '')
    if (!line) continue
    const m = LOG_LINE_RE.exec(line)
    if (!m) {
      skipped.push({ line, reason: '非规范格式，应为 hash type(scope): 描述 或 type: 描述' })
      continue
    }
    const type = m[2].toLowerCase()
    if (!TYPE_SECTION[type]) {
      skipped.push({ line, reason: `未知提交类型「${type}」` })
      continue
    }
    entries.push({
      hash: (m[1] || '').trim(),
      type,
      scope: (m[3] || '').trim(),
      subject: m[4].trim()
    })
  }
  return { entries, skipped }
})

const outputEntries = computed(() =>
  parseResult.value.entries.filter(e => !CHORE_TYPES.includes(e.type) || includeChore.value)
)

const outputCount = computed(() => outputEntries.value.length)

// ---------- 生成 Markdown ----------
const normalizeRepo = (r) => r.trim().replace(/\.git\/?$/, '').replace(/\/+$/, '')

const formatEntry = (e) => {
  const scopePrefix = e.scope ? `**${e.scope}**: ` : ''
  let line = `- ${scopePrefix}${e.subject}`
  const repo = normalizeRepo(repoLink.value)
  if (e.hash) {
    const shortHash = e.hash.slice(0, 7)
    line += repo ? ` ([${shortHash}](${repo}/commit/${e.hash}))` : ` (${shortHash})`
  }
  return line
}

const markdown = computed(() => {
  if (!inputText.value.trim() || outputEntries.value.length === 0) return ''
  const grouped = {}
  for (const e of outputEntries.value) {
    const sec = TYPE_SECTION[e.type]
    if (!grouped[sec]) grouped[sec] = []
    grouped[sec].push(e)
  }
  const lines = []
  lines.push(`## [${version.value.trim() || 'Unreleased'}] - ${date.value.trim() || '未填写日期'}`)
  for (const sec of SECTION_ORDER) {
    if (!grouped[sec] || grouped[sec].length === 0) continue
    lines.push('', `### ${sec}`)
    for (const e of grouped[sec]) lines.push(formatEntry(e))
  }
  return lines.join('\n')
})

// ---------- 复制与下载 ----------
const copyOutput = async () => {
  if (!markdown.value) return
  try {
    await navigator.clipboard.writeText(markdown.value)
    alert('已复制')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = markdown.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制')
  }
}

const downloadOutput = () => {
  if (!markdown.value) return
  const blob = new Blob([markdown.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const ver = version.value.trim().replace(/[^\w.-]/g, '')
  a.href = url
  a.download = `CHANGELOG${ver ? '-' + ver : ''}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
