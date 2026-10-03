<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sliders class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Properties/INI格式化器</h1>
          <p class="text-sm text-muted-foreground mt-1">美化 .properties 与 INI 配置：等号对齐、键排序、注释保留、错误定位</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴 .properties（key=value / key: value）或 INI（[section] 分节）配置，自动识别风格并解析：注释行（# ! ;）完整保留、支持等号按节内最长键对齐、键排序、键缩进等选项，语法错误标注行号，全部在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与选项 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileCode class="w-5 h-5 mr-2 text-primary" /> 输入配置
          </h2>
          <textarea
            v-model="inputText"
            class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 .properties 或 INI 配置，例如：&#10;# 数据库配置&#10;[database]&#10;host=127.0.0.1&#10;port=3306&#10;&#10;[server]&#10;port : 8080"
            spellcheck="false"
          ></textarea>

          <div class="mt-4 space-y-4">
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">等号对齐（按节内最长键）</span>
              <button
                type="button"
                @click="alignEquals = !alignEquals; formatNow()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="alignEquals ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="alignEquals ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">键排序（节内字母序）</span>
              <button
                type="button"
                @click="sortKeys = !sortKeys; formatNow()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="sortKeys ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="sortKeys ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">保留空行分隔</span>
              <button
                type="button"
                @click="keepBlankLines = !keepBlankLines; formatNow()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="keepBlankLines ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="keepBlankLines ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">节内键缩进（2 空格）</span>
              <button
                type="button"
                @click="indentKeys = !indentKeys; formatNow()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="indentKeys ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="indentKeys ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
          </div>

          <div class="flex items-center gap-2 mt-4">
            <button
              @click="formatNow"
              class="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 格式化
            </button>
            <button
              @click="fillSample"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-sm transition-all"
            >
              样例
            </button>
            <button
              @click="clearAll"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-sm transition-all"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 分节统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 解析统计
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ stats.sections }}</p>
              <p class="text-xs text-muted-foreground">配置节</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ stats.pairs }}</p>
              <p class="text-xs text-muted-foreground">配置键</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ stats.comments }}</p>
              <p class="text-xs text-muted-foreground">注释行</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold" :class="stats.errors > 0 ? 'text-destructive' : 'text-foreground'">{{ stats.errors }}</p>
              <p class="text-xs text-muted-foreground">语法问题</p>
            </div>
          </div>
          <div v-if="styleBadge" class="mt-3 flex items-center gap-2">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="styleBadge.mixed ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'"
            >
              {{ styleBadge.label }}
            </span>
            <span class="text-xs text-muted-foreground">自动识别的配置风格</span>
          </div>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 格式化结果
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyOutput"
                :disabled="!outputText"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadOutput"
                :disabled="!outputText"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>
          <div class="p-6">
            <textarea
              v-if="outputText"
              :value="outputText"
              readonly
              class="w-full h-96 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else class="py-16 text-center">
              <Sliders class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入配置后点击「格式化」，这里会显示结果</p>
            </div>
          </div>
        </div>

        <!-- 错误列表 -->
        <div v-if="errorList.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <AlertTriangle class="w-4 h-4 mr-2 text-yellow-500" /> 语法问题（{{ errorList.length }}）
          </h3>
          <ul class="space-y-2">
            <li v-for="(err, idx) in errorList" :key="idx" class="flex items-start gap-2 text-xs">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono flex-shrink-0">第 {{ err.line }} 行</span>
              <span class="text-destructive">{{ err.message }}</span>
              <span class="text-muted-foreground font-mono truncate">{{ err.raw }}</span>
            </li>
          </ul>
          <p class="text-xs text-muted-foreground mt-3">有语法问题的行会在输出中原样保留，便于排查后重新格式化。</p>
        </div>

        <!-- 说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 解析规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">注释</span>：<span class="font-mono">#</span>、<span class="font-mono">!</span>、<span class="font-mono">;</span> 开头的行按注释原样保留</li>
            <li>• <span class="text-foreground">分节</span>：<span class="font-mono">[section]</span> 行开启新节，节名保留原样</li>
            <li>• <span class="text-foreground">键值</span>：按行内最先出现的 <span class="font-mono">=</span> 或 <span class="font-mono">:</span> 分隔，键去除首尾空白</li>
            <li>• <span class="text-foreground">排序</span>：键排序在节内进行，紧邻键的注释会跟随键一起移动</li>
            <li>• <span class="text-foreground">错误检测</span>：缺少分隔符、节名未闭合 <span class="font-mono">]</span>、值引号未闭合都会标注行号</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于Properties/INI格式化器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            .properties 是 Java 生态的键值配置格式，分隔符可以是等号、冒号或空格；INI 是 Windows 起源的配置格式，以 <span class="font-mono">[section]</span> 分节、等号分隔。两者结构简单但手写时容易出现对齐混乱、重复键、分隔符缺失等问题。本工具统一解析两种风格，提供对齐、排序、缩进等整理能力，并把无法解析的行连同行号一起标出。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>整理 Spring Boot 的 application.properties，让配置一目了然</li>
            <li>规范化 php.ini、my.ini、sshd_config 风格的 INI 文件</li>
            <li>排查「配置不生效」：定位缺分隔符、引号未闭合等低级错误</li>
            <li>合并多环境配置前统一键序，减小 Diff 噪音</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">如何区分 properties 和 INI？</span>工具按内容自动判断：出现 [section] 分节视为 INI 风格，仅有键值对视为 properties 风格，混用时也能正确解析。</li>
            <li><span class="text-foreground font-medium">值中的冒号会被误切吗？</span>不会。按行内最先出现的分隔符切分，key 之后的 = 或 : 都属于值的一部分。</li>
            <li><span class="text-foreground font-medium">排序会打乱注释吗？</span>紧邻键上方的注释会跟随键一起排序，孤立的注释块与空行保持原位。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'properties-ini-formatter'" :category="'format'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Sliders, FileCode, RefreshCw, Copy, Download, Info,
  AlertTriangle, CheckCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Properties/INI格式化器 - 配置文件美化与校验工具',
  description: 'Properties与INI配置文件在线格式化工具，支持等号对齐、节内键排序、键缩进、注释保留、分节统计与语法错误行号标注，自动识别properties/ini风格',
  keywords: 'properties格式化, ini格式化, 配置文件格式化, properties排序, ini编辑, application.properties',
  author: 'Util工具箱',
  ogTitle: 'Properties/INI格式化器 - 有条工具',
  ogDescription: '美化.properties与INI配置：等号对齐、键排序、注释保留、错误定位',
  ogUrl: 'https://www.util.cn/tools/properties-ini-formatter',
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
          name: 'Properties/INI格式化器',
          url: 'https://www.util.cn/tools/properties-ini-formatter',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['等号对齐', '节内键排序', '注释保留', '语法错误行号标注', '风格自动识别']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '数据格式化', item: 'https://www.util.cn/format/' },
            { '@type': 'ListItem', position: 3, name: 'Properties/INI格式化器', item: 'https://www.util.cn/tools/properties-ini-formatter/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'properties-ini-formatter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const inputText = ref('')
const outputText = ref('')
const errorList = ref([])
const stats = ref({ sections: 0, pairs: 0, comments: 0, errors: 0 })
const styleBadge = ref(null)
const seoContentVisible = ref(true)

const alignEquals = ref(true)
const sortKeys = ref(false)
const keepBlankLines = ref(true)
const indentKeys = ref(false)

// ---------- 解析 ----------
// item: { type: 'comment'|'blank'|'section'|'pair'|'error', raw, key, value, sep, line, name, message }
const parseLines = (text) => {
  const items = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  lines.forEach((raw, idx) => {
    const line = idx + 1
    const trimmed = raw.trim()

    if (trimmed === '') {
      items.push({ type: 'blank', raw, line })
      return
    }
    if (trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed.startsWith(';')) {
      items.push({ type: 'comment', raw: trimmed, line })
      return
    }
    // [section]
    if (trimmed.startsWith('[')) {
      if (!trimmed.endsWith(']') || trimmed.length < 3) {
        items.push({ type: 'error', raw, line, message: '节名未闭合，缺少「]」' })
        return
      }
      items.push({ type: 'section', raw: trimmed, name: trimmed.slice(1, -1).trim(), line })
      return
    }
    // key=value 或 key: value：取行内最先出现的分隔符
    const eq = trimmed.indexOf('=')
    const colon = trimmed.indexOf(':')
    let sepIdx = -1
    let sep = ''
    if (eq !== -1 && colon !== -1) {
      if (eq <= colon) { sepIdx = eq; sep = '=' } else { sepIdx = colon; sep = ':' }
    } else if (eq !== -1) {
      sepIdx = eq; sep = '='
    } else if (colon !== -1) {
      sepIdx = colon; sep = ':'
    }
    if (sepIdx === -1) {
      items.push({ type: 'error', raw, line, message: '无法识别：既不是注释/节，也没有「=」或「:」分隔符' })
      return
    }
    const key = trimmed.slice(0, sepIdx).trim()
    let value = trimmed.slice(sepIdx + 1).trim()
    if (!key) {
      items.push({ type: 'error', raw, line, message: '缺少 key：分隔符前没有键名' })
      return
    }
    // 引号未闭合检测（值以引号开头时）
    if ((value.startsWith('"') && !endsWithUnescapedQuote(value)) ||
        (value.startsWith("'") && !(value.length > 1 && value.endsWith(value[0]) && value.length >= 2))) {
      items.push({ type: 'error', raw, line, message: '值的引号未闭合' })
      return
    }
    items.push({ type: 'pair', raw: trimmed, key, value, sep, line })
  })
  return items
}

const endsWithUnescapedQuote = (s) => {
  // "..."：检查结尾的 " 前是否有连续的反斜杠转义
  if (s.length < 2) return false
  if (!s.endsWith('"')) return false
  let backslashes = 0
  for (let i = s.length - 2; i >= 1; i--) {
    if (s[i] === '\\') backslashes++
    else break
  }
  return backslashes % 2 === 0
}

// ---------- 格式化输出 ----------
const formatNow = () => {
  outputText.value = ''
  errorList.value = []
  styleBadge.value = null
  stats.value = { sections: 0, pairs: 0, comments: 0, errors: 0 }
  const text = inputText.value
  if (!text.trim()) return

  let items
  try {
    items = parseLines(text)
  } catch (err) {
    errorList.value = [{ line: '-', message: err?.message || '解析失败', raw: '' }]
    return
  }

  // 统计与错误收集
  const errors = items.filter(i => i.type === 'error')
  errorList.value = errors.map(e => ({ line: e.line, message: e.message, raw: e.raw }))
  stats.value.errors = errors.length
  stats.value.sections = items.filter(i => i.type === 'section').length
  stats.value.pairs = items.filter(i => i.type === 'pair').length
  stats.value.comments = items.filter(i => i.type === 'comment').length

  // 风格识别
  const eqCount = items.filter(i => i.type === 'pair' && i.sep === '=').length
  const colonCount = items.filter(i => i.type === 'pair' && i.sep === ':').length
  const hasSection = stats.value.sections > 0
  if (stats.value.pairs === 0) {
    styleBadge.value = null
  } else if (hasSection && colonCount > eqCount) {
    styleBadge.value = { label: 'INI / properties 混合风格', mixed: true }
  } else if (hasSection) {
    styleBadge.value = { label: 'INI 风格（分节 + 等号）', mixed: false }
  } else if (colonCount > eqCount) {
    styleBadge.value = { label: 'Properties 风格（冒号分隔）', mixed: false }
  } else {
    styleBadge.value = { label: 'Properties 风格（等号分隔）', mixed: false }
  }

  // 输出：按"块"重组（注释+空行附着到其后的 pair，便于排序时一起移动）
  const blocks = [] // { kind: 'pair'|'keep', lines: [item...] }
  let pending = [] // 附着注释/空行
  let currentSection = '__global__'
  const sectionKeysMax = {} // 节 -> 最长键长
  const sectionPairs = {} // 节 -> pair 引用列表

  for (const item of items) {
    if (item.type === 'comment' || item.type === 'blank') {
      pending.push(item)
      continue
    }
    if (item.type === 'section') {
      currentSection = item.name
      blocks.push({ kind: 'keep', items: [...pending, item] })
      pending = []
      continue
    }
    if (item.type === 'error') {
      blocks.push({ kind: 'keep', items: [...pending, item] })
      pending = []
      continue
    }
    // pair
    blocks.push({ kind: 'pair', items: [...pending, item], section: currentSection, pair: item })
    pending = []
    if (!sectionPairs[currentSection]) sectionPairs[currentSection] = []
    sectionPairs[currentSection].push(item)
    sectionKeysMax[currentSection] = Math.max(sectionKeysMax[currentSection] || 0, item.key.length)
  }
  if (pending.length) blocks.push({ kind: 'keep', items: pending })

  // 排序：对每个节内的 pair 块按 key 排序（保持节头位置不变）
  if (sortKeys.value) {
    let idx = 0
    while (idx < blocks.length) {
      const b = blocks[idx]
      if (b.kind === 'keep' && b.items.some(i => i.type === 'section')) {
        // 收集该节后续连续的 pair 块（直到下一个 section 或末尾）
        let j = idx + 1
        const pairBlocks = []
        while (j < blocks.length && !(blocks[j].kind === 'keep' && blocks[j].items.some(i => i.type === 'section'))) {
          if (blocks[j].kind === 'pair') pairBlocks.push(blocks[j])
          j++
        }
        if (pairBlocks.length > 1) {
          const sorted = [...pairBlocks].sort((a, b2) => a.pair.key.localeCompare(b2.pair.key))
          for (let n = 0; n < sorted.length; n++) blocks[idx + 1 + n] = sorted[n]
        }
        idx = j
      } else {
        idx++
      }
    }
  }

  // 渲染
  const outLines = []
  let lastWasBlank = false
  for (const b of blocks) {
    if (b.kind === 'keep') {
      for (const item of b.items) {
        if (item.type === 'blank') {
          if (keepBlankLines.value && outLines.length > 0 && !lastWasBlank) {
            outLines.push('')
            lastWasBlank = true
          }
          continue
        }
        outLines.push(item.raw)
        lastWasBlank = false
      }
      continue
    }
    // pair 块
    const pair = b.pair
    // 块内附着的空行
    for (const item of b.items) {
      if (item.type === 'blank') {
        if (keepBlankLines.value && outLines.length > 0 && !lastWasBlank) {
          outLines.push('')
          lastWasBlank = true
        }
      }
    }
    const maxKey = alignEquals.value ? (sectionKeysMax[pair.section] || 0) : 0
    const paddedKey = alignEquals.value ? pair.key.padEnd(maxKey, ' ') : pair.key
    const indent = indentKeys.value && pair.section !== '__global__' ? '  ' : ''
    outLines.push(indent + paddedKey + ' ' + pair.sep + ' ' + pair.value)
    lastWasBlank = false
  }

  // 去掉末尾多余空行
  while (outLines.length > 0 && outLines[outLines.length - 1] === '') outLines.pop()
  outputText.value = outLines.join('\n')
}

// ---------- 交互 ----------
const fillSample = () => {
  inputText.value = `# 应用配置样例
[database]
port=3306
host = 127.0.0.1
name: app_db

[server]
port : 8080
host=0.0.0.0
debug = true

# 日志级别
log.level=INFO
log.path = /var/log/app
`
  formatNow()
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
  errorList.value = []
  styleBadge.value = null
  stats.value = { sections: 0, pairs: 0, comments: 0, errors: 0 }
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

const downloadOutput = () => {
  if (!outputText.value) return
  const isIni = (styleBadge.value?.label || '').includes('INI')
  const ext = isIni ? 'ini' : 'properties'
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `config.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
