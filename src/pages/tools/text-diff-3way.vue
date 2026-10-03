<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <GitCompare class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">文本三方对比</h1>
          <p class="text-sm text-muted-foreground mt-1">原文 + 两个版本，行级差异与冲突一目了然</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴原文与两个修改版本（如两份 AI 产出、两位同事的改动），按行级 LCS 算法对比：既看 A、B 之间的直接差异，也提示双方是否改动了同一处内容（潜在合并冲突）。纯本地计算，适合对比敏感文本。
      </p>
    </div>

    <!-- 输入区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-foreground flex items-center"><FileText class="w-4 h-4 mr-1.5 text-muted-foreground" /> 原文（基线）</label>
          <span class="text-xs text-muted-foreground">{{ lineCount(baseText) }} 行</span>
        </div>
        <textarea v-model="baseText" rows="10"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴原始版本..." spellcheck="false"></textarea>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-foreground flex items-center"><span class="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> 版本 A</label>
          <span class="text-xs text-muted-foreground">{{ lineCount(aText) }} 行 · 改动 {{ changedA }} 行</span>
        </div>
        <textarea v-model="aText" rows="10"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴版本 A..." spellcheck="false"></textarea>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-foreground flex items-center"><span class="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span> 版本 B</label>
          <span class="text-xs text-muted-foreground">{{ lineCount(bText) }} 行 · 改动 {{ changedB }} 行</span>
        </div>
        <textarea v-model="bText" rows="10"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴版本 B..." spellcheck="false"></textarea>
      </div>
    </div>

    <!-- 统计 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-green-500">{{ addedLines }}</p>
        <p class="text-xs text-muted-foreground mt-1">A 新增行</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-blue-500">{{ addedLinesB }}</p>
        <p class="text-xs text-muted-foreground mt-1">B 新增行</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-destructive">{{ sameChanged }}</p>
        <p class="text-xs text-muted-foreground mt-1">双方都改的行（冲突风险）</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-foreground">{{ diffRows.length }}</p>
        <p class="text-xs text-muted-foreground mt-1">A↔B 差异块</p>
      </div>
    </div>

    <!-- 差异视图 -->
    <div class="bg-card border border-border rounded-lg mb-8">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <GitCompare class="w-5 h-5 mr-2 text-primary" /> A ↔ B 行级对比
        </h2>
        <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input type="checkbox" v-model="ignoreWhitespace" class="accent-primary" /> 忽略行尾空白
        </label>
      </div>
      <div class="p-4">
        <div v-if="diffRows.length === 0" class="py-12 text-center">
          <GitCompare class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">填入原文与版本后，这里显示差异对比</p>
        </div>
        <div v-else class="font-mono text-xs overflow-x-auto">
          <div
            v-for="(row, idx) in diffRows"
            :key="idx"
            class="flex gap-3 px-3 py-1 rounded"
            :class="rowClass(row.type)"
          >
            <span class="w-10 text-right flex-shrink-0 select-none" :class="numClass(row.type)">{{ row.aNo || '' }}</span>
            <span class="w-10 text-right flex-shrink-0 select-none" :class="numClass(row.type)">{{ row.bNo || '' }}</span>
            <span class="w-4 flex-shrink-0 select-none" :class="signClass(row.type)">{{ row.sign }}</span>
            <span class="whitespace-pre-wrap break-all">{{ row.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于文本对比</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>行级对比基于 LCS（最长公共子序列）算法：找到两个版本共有的行骨架，其余即为增删。相比逐字对比，行级更适合审阅文档、配置与代码的版本差异。</p>
          <h3 class="text-lg font-semibold text-foreground">三方对比的典型场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>两份 AI 产出择优：对照原文看谁改得更准</li>
            <li>两人同时改同一文档：提前发现双方都动过的冲突行</li>
            <li>翻译定稿：原文 / 译者稿 / 审校稿三版本核对</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">内容会被上传吗？</span>不会，LCS 计算完全在浏览器内存中完成。</li>
            <li><span class="text-foreground font-medium">最大能比多少行？</span>数千行以内体验流畅，超大文本建议先分段。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'text-diff-3way'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  GitCompare, FileText, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '文本三方对比 - 行级差异对比与冲突检测',
  description: '在线文本对比工具，原文加两个修改版本行级LCS差异对比，高亮增删行并提示双方都改动的冲突行，纯本地计算不上传',
  keywords: '文本对比, diff工具, 在线diff, 文件比较, 文本差异, 三方对比, 冲突检测',
  author: 'Util工具箱',
  ogTitle: '文本三方对比 - 有条工具',
  ogDescription: '原文 + 两个版本，行级差异与冲突一目了然',
  ogUrl: 'https://www.util.cn/tools/text-diff-3way',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: '文本三方对比', url: 'https://www.util.cn/tools/text-diff-3way', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['行级LCS对比', '三方冲突提示', '忽略行尾空白', '本地计算'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '文本处理', item: 'https://www.util.cn/text/' },
          { '@type': 'ListItem', position: 3, name: '文本三方对比', item: 'https://www.util.cn/tools/text-diff-3way/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'text-diff-3way')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

const baseText = ref('')
const aText = ref('')
const bText = ref('')
const ignoreWhitespace = ref(true)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const lineCount = (t) => (t || '').split('\n').filter((l, i, arr) => l.trim() !== '' || i < arr.length - 1).length
const norm = (l) => ignoreWhitespace.value ? l.replace(/\s+$/g, '') : l
const linesOf = (t) => (t || '').split('\n')

// ---------- LCS 行级 diff ----------
const diffLines = (oldLines, newLines) => {
  const a = oldLines.map(norm)
  const b = newLines.map(norm)
  const n = a.length, m = b.length
  // LCS 动态规划表
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ops = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'same', aNo: i + 1, bNo: j + 1, text: newLines[j] })
      i++; j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', aNo: i + 1, bNo: null, text: oldLines[i] })
      i++
    } else {
      ops.push({ type: 'add', aNo: null, bNo: j + 1, text: newLines[j] })
      j++
    }
  }
  while (i < n) { ops.push({ type: 'del', aNo: i + 1, bNo: null, text: oldLines[i] }); i++ }
  while (j < m) { ops.push({ type: 'add', aNo: null, bNo: j + 1, text: newLines[j] }); j++ }
  return ops
}

// ---------- A vs B 视图 ----------
const diffRows = computed(() => {
  if (!baseText.value && !aText.value && !bText.value) return []
  return diffLines(linesOf(aText.value), linesOf(bText.value))
})

// ---------- 相对原文的改动统计与冲突 ----------
const changeSetOf = (t) => {
  const ops = diffLines(linesOf(baseText.value), linesOf(t))
  const added = []
  for (const op of ops) {
    if (op.type === 'add') added.push(norm(op.text))
  }
  return added
}

const addedLines = computed(() => {
  if (!baseText.value || !aText.value) return 0
  return changeSetOf(aText.value).filter(l => l.trim() !== '').length
})
const addedLinesB = computed(() => {
  if (!baseText.value || !bText.value) return 0
  return changeSetOf(bText.value).filter(l => l.trim() !== '').length
})

const changedA = computed(() => {
  if (!baseText.value || !aText.value) return 0
  const ops = diffLines(linesOf(baseText.value), linesOf(aText.value))
  return ops.filter(o => o.type === 'add').length
})
const changedB = computed(() => {
  if (!baseText.value || !bText.value) return 0
  const ops = diffLines(linesOf(baseText.value), linesOf(bText.value))
  return ops.filter(o => o.type === 'add').length
})

const sameChanged = computed(() => {
  if (!baseText.value || !aText.value || !bText.value) return 0
  const setA = new Set(changeSetOf(aText.value).filter(l => l.trim() !== ''))
  const setB = changeSetOf(bText.value).filter(l => l.trim() !== '' && setA.has(l))
  return new Set(setB).size
})

// ---------- 行样式 ----------
const rowClass = (type) => {
  if (type === 'add') return 'bg-green-500/10'
  if (type === 'del') return 'bg-red-500/10'
  return ''
}
const numClass = (type) => {
  if (type === 'add') return 'text-green-500/70'
  if (type === 'del') return 'text-red-500/70'
  return 'text-muted-foreground/50'
}
const signClass = (type) => {
  if (type === 'add') return 'text-green-500 font-bold'
  if (type === 'del') return 'text-red-500 font-bold'
  return 'text-transparent'
}
</script>
