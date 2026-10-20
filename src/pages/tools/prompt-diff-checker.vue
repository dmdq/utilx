<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <GitCompare class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Prompt 版本对比</h1>
          <p class="text-sm text-muted-foreground mt-1">两个提示词逐词高亮对比，附字数、行数与估算 token 变化</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        提示词迭代管理工具：粘贴旧版本 A 与新版本 B，按「中文按字、英文按词」分词后做字符级 LCS 对比，绿色标新增、红色标删除；
        统计面板给出字数增减、行数与估算 token 变化，帮助你在 Prompt 调优时看清每一步改动的影响。纯本地计算，敏感提示词不上传。
      </p>
    </div>

    <!-- 输入区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-foreground flex items-center">
            <span class="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span> 版本 A（旧）
          </label>
          <span class="text-xs text-muted-foreground">{{ diff.stats.charsA }} 字 · 约 {{ diff.stats.tokensA }} token</span>
        </div>
        <textarea
          v-model="textA"
          rows="9"
          spellcheck="false"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴旧版 Prompt..."
        ></textarea>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-foreground flex items-center">
            <span class="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span> 版本 B（新）
          </label>
          <span class="text-xs text-muted-foreground">{{ diff.stats.charsB }} 字 · 约 {{ diff.stats.tokensB }} token</span>
        </div>
        <textarea
          v-model="textB"
          rows="9"
          spellcheck="false"
          class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴新版 Prompt..."
        ></textarea>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <button
        @click="loadExample"
        class="px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-lg text-sm text-foreground transition-colors"
      >加载示例</button>
      <button
        @click="swapTexts"
        class="px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-lg text-sm text-foreground transition-colors"
      >交换 A/B</button>
      <button
        @click="clearAll"
        class="px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-lg text-sm text-foreground transition-colors"
      >清空</button>
      <button
        @click="copySummary"
        class="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm transition-colors flex items-center gap-1.5"
      ><ClipboardCopy class="w-4 h-4" /> 复制差异摘要</button>
      <p v-if="copyHint" class="text-xs text-primary">{{ copyHint }}</p>
    </div>

    <!-- 统计面板 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-foreground">{{ diff.stats.charDelta > 0 ? '+' : '' }}{{ diff.stats.charDelta }}</p>
        <p class="text-xs text-muted-foreground mt-1">字数增减（{{ diff.stats.charsA }} → {{ diff.stats.charsB }}）</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-foreground">{{ diff.stats.lineDelta > 0 ? '+' : '' }}{{ diff.stats.lineDelta }}</p>
        <p class="text-xs text-muted-foreground mt-1">行数增减（{{ diff.stats.linesA }} → {{ diff.stats.linesB }}）</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-2xl font-bold" :class="diff.stats.tokenDelta > 0 ? 'text-orange-500' : diff.stats.tokenDelta < 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground'">
          {{ diff.stats.tokenDelta > 0 ? '+' : '' }}{{ diff.stats.tokenDelta }}
        </p>
        <p class="text-xs text-muted-foreground mt-1">估算 token 变化（{{ diff.stats.tokensA }} → {{ diff.stats.tokensB }}）</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-2xl font-bold text-foreground">
          <span class="text-green-600 dark:text-green-400">+{{ diff.stats.addRuns }}</span> / <span class="text-red-600 dark:text-red-400">-{{ diff.stats.delRuns }}</span>
        </p>
        <p class="text-xs text-muted-foreground mt-1">新增 / 删除片段数</p>
      </div>
    </div>
    <p class="text-xs text-muted-foreground mb-6 -mt-2 leading-relaxed">
      token 粗估口径：中文每字约 1 token、英文约每 4 字符 1 token，与真实分词器有出入，精确值请用
      <NuxtLink to="/tools/token-cost-calculator" class="text-primary hover:underline">Token 计数与 API 成本计算</NuxtLink>。
    </p>

    <!-- 差异视图 -->
    <div class="bg-card border border-border rounded-lg mb-8 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 词级差异（A → B）
        </h2>
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-green-500/60"></span>新增</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-red-500/60"></span>删除</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-muted border border-border"></span>未变</span>
        </div>
      </div>
      <div class="p-5">
        <div v-if="hasInput" class="text-sm leading-relaxed whitespace-pre-wrap break-all prompt-diff-view">
          <span
            v-for="(op, idx) in diff.ops"
            :key="idx"
            :class="'op-' + op.type"
          >{{ op.text }}</span>
        </div>
        <div v-else class="py-10 text-center text-sm text-muted-foreground">
          粘贴两个版本的 Prompt 后，这里显示逐词高亮差异
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>为什么要做 Prompt 版本对比</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Prompt 工程是反复试错的过程：改一个词可能让输出质量波动一大截。把每次实验的提示词版本存下来并看清「到底改了什么」，
            是复现好结果、定位坏结果的前提。逐词高亮对比比人眼通读两段长文本可靠得多，也能顺手核对改动是否让 token 成本明显上涨。
          </p>
          <h3 class="text-lg font-semibold text-foreground">中文按字、英文按词的分词策略</h3>
          <p>
            中文没有空格分隔，若整句当一个词，任何改动都会显示为整句替换。本工具把每个汉字视为独立 token、把连续英文字母数字视为单词、
            标点与空白单独成 token，再跑 LCS（最长公共子序列）对齐两个版本，得到贴近人类直觉的最小改动集。
          </p>
          <h3 class="text-lg font-semibold text-foreground">推荐的 Prompt 版本管理工作流</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>把提示词作为独立文件放进 Git 仓库，随代码一起评审；</li>
            <li>每次调优前后各复制一份到本工具对比，确认改动是最小且有意为之；</li>
            <li>用「复制差异摘要」把改动点写进实验记录或 commit message；</li>
            <li>关注 token 变化：加长 few-shot 示例前先看成本增幅。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">Prompt 会被上传吗？</span>不会，分词与 LCS 全部在浏览器本地内存中完成。</li>
            <li><span class="text-foreground font-medium">能对比很长的 Prompt 吗？</span>几千 token 内流畅；超长文本建议先按段落拆分后分段对比。</li>
            <li><span class="text-foreground font-medium">估算 token 和真实计费差多少？</span>本工具是「中文约1字1token、英文约4字符1token」的粗估口径，与各家 tokenizer 有偏差，预算核算请以 Token 计算器与官方口径为准。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'prompt-diff-checker'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  GitCompare, FileText, ClipboardCopy, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Prompt版本对比 - 提示词Diff与token变化分析 | 有条工具',
  description: '在线Prompt对比工具，两个提示词版本按中文按字英文按词分词后LCS逐词对比，高亮增删内容，统计字数行数与估算token变化，可复制差异摘要，纯本地计算',
  keywords: 'prompt对比,提示词版本,diff提示词,prompt优化,token变化,提示词diff,ai提示词管理',
  author: 'Util工具箱',
  ogTitle: 'Prompt版本对比 - 有条工具',
  ogDescription: '两个提示词逐词对比高亮增删，附字数、行数与估算 token 变化',
  ogUrl: 'https://www.util.cn/tools/prompt-diff-checker',
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
          name: 'Prompt版本对比',
          url: 'https://www.util.cn/tools/prompt-diff-checker',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['中文按字英文按词分词', 'LCS逐词高亮对比', '字数行数token统计', '差异摘要复制', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Prompt版本对比', item: 'https://www.util.cn/tools/prompt-diff-checker/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Prompt会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，分词与LCS对比全部在浏览器本地内存中完成。' }
            },
            {
              '@type': 'Question',
              name: '能对比很长的Prompt吗？',
              acceptedAnswer: { '@type': 'Answer', text: '几千token内流畅；超长文本建议先按段落拆分后分段对比。' }
            },
            {
              '@type': 'Question',
              name: '估算token和真实计费差多少？',
              acceptedAnswer: { '@type': 'Answer', text: '按中文约1字1token、英文约4字符1token粗估，与各家tokenizer有偏差，预算核算请以官方口径为准。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'prompt-diff-checker')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数：分词与 LCS diff ----------
// --- pure-test-start ---
// 中文按字、英文数字串按词、空白与标点各自成 token
function tokenizeMixed(s) {
  const re = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]|[A-Za-z0-9][A-Za-z0-9_']*|\s+|[^\sA-Za-z0-9\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g
  return s.match(re) || []
}

// LCS diff：返回 ops（same/del/add 序列）与 LCS 长度
function lcsDiff(a, b) {
  const n = a.length
  const m = b.length
  const W = m + 1
  const dp = new Int32Array((n + 1) * W)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * W + j] = a[i] === b[j]
        ? dp[(i + 1) * W + j + 1] + 1
        : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1])
    }
  }
  const ops = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ type: 'same', text: a[i] }); i++; j++ }
    else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { ops.push({ type: 'del', text: a[i] }); i++ }
    else { ops.push({ type: 'add', text: b[j] }); j++ }
  }
  while (i < n) { ops.push({ type: 'del', text: a[i] }); i++ }
  while (j < m) { ops.push({ type: 'add', text: b[j] }); j++ }
  return { ops, lcsLen: dp[0] }
}

// 粗估 token：中文每字≈1 token，英文≈每4字符1 token
function estimateTokens(s) {
  let cjk = 0
  let latin = 0
  for (const ch of String(s || '')) {
    if (/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(ch)) cjk++
    else if (!/\s/.test(ch)) latin++
  }
  return Math.round(cjk + latin / 4)
}

// 完整对比入口
function diffPrompt(oldStr, newStr) {
  const a = String(oldStr || '')
  const b = String(newStr || '')
  const { ops, lcsLen } = lcsDiff(tokenizeMixed(a), tokenizeMixed(b))
  const delRuns = []
  const addRuns = []
  let curDel = ''
  let curAdd = ''
  const flush = () => {
    if (curDel.trim()) delRuns.push(curDel.trim())
    if (curAdd.trim()) addRuns.push(curAdd.trim())
    curDel = ''
    curAdd = ''
  }
  for (const op of ops) {
    if (op.type === 'del') { curDel += op.text }
    else if (op.type === 'add') { curAdd += op.text }
    else { flush() }
  }
  flush()
  const tokensA = estimateTokens(a)
  const tokensB = estimateTokens(b)
  const linesA = a ? a.split('\n').length : 0
  const linesB = b ? b.split('\n').length : 0
  return {
    ops,
    lcsLen,
    delRuns,
    addRuns,
    stats: {
      charsA: a.length,
      charsB: b.length,
      charDelta: b.length - a.length,
      linesA,
      linesB,
      lineDelta: linesB - linesA,
      tokensA,
      tokensB,
      tokenDelta: tokensB - tokensA,
      delRuns: delRuns.length,
      addRuns: addRuns.length
    }
  }
}
// --- pure-test-end ---

// ---------- 状态 ----------
const sampleA = '你是一名翻译助手。请把用户输入的中文翻译成英文，保持简洁。\n如果不确定词义，可以添加注释。'
const sampleB = '你是一名资深翻译助手。请把用户输入的中文翻译成地道的英文，保持简洁并保留原文格式。\n如果不确定词义，请先询问再翻译。'

const textA = ref(sampleA)
const textB = ref(sampleB)
const copyHint = ref('')
const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const hasInput = computed(() => textA.value !== '' || textB.value !== '')
const diff = computed(() => diffPrompt(textA.value, textB.value))

const summaryText = computed(() => {
  const d = diff.value
  const lines = ['Prompt 差异摘要（A → B）', '字数 ' + d.stats.charsA + ' → ' + d.stats.charsB + '（' + (d.stats.charDelta >= 0 ? '+' : '') + d.stats.charDelta + '）', '估算 token ' + d.stats.tokensA + ' → ' + d.stats.tokensB + '（' + (d.stats.tokenDelta >= 0 ? '+' : '') + d.stats.tokenDelta + '）']
  for (const r of d.delRuns) lines.push('- 删除: ' + JSON.stringify(r))
  for (const r of d.addRuns) lines.push('+ 新增: ' + JSON.stringify(r))
  if (!d.delRuns.length && !d.addRuns.length) lines.push('两个版本内容一致')
  return lines.join('\n')
})

const loadExample = () => {
  textA.value = sampleA
  textB.value = sampleB
}

const swapTexts = () => {
  const temp = textA.value
  textA.value = textB.value
  textB.value = temp
}

const clearAll = () => {
  textA.value = ''
  textB.value = ''
}

const copySummary = async () => {
  try {
    await navigator.clipboard.writeText(summaryText.value)
    copyHint.value = '已复制差异摘要'
    setTimeout(() => { copyHint.value = '' }, 3000)
  } catch {
    copyHint.value = '复制失败，请手动选择摘要文本复制'
    setTimeout(() => { copyHint.value = '' }, 4000)
  }
}
</script>

<style scoped>
.prompt-diff-view {
  min-height: 60px;
}

.op-same {
  color: hsl(var(--foreground));
}

.op-del {
  background-color: hsl(var(--destructive) / 0.25);
  color: hsl(var(--destructive));
  text-decoration: line-through;
  border-radius: 2px;
}

.op-add {
  background-color: hsl(var(--success) / 0.3);
  color: #16a34a;
  border-radius: 2px;
}

@media (prefers-color-scheme: dark) {
  .op-add {
    color: #4ade80;
  }
}
</style>
