<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Terminal class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">SQL IN条件格式化</h1>
          <p class="text-sm text-muted-foreground mt-1">Excel 粘来的 ID 列表一键拼成 IN (...)，自动去重 / 数字识别 / 引号转义</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        从 Excel、日志、CSV 里复制出一列 ID，粘贴进来即可拼成可直接执行的 SQL IN 条件：支持逗号、换行、空格、制表符混排，可选引号模式（自动 / 全加 / 全不加）、保序去重、单引号转义，并按 Oracle 1000 项限制自动分组用 OR 拼接。全部处理在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与选项 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <List class="w-5 h-5 mr-2 text-primary" /> 值列表输入
          </h2>
          <textarea
            v-model="inputText"
            class="w-full h-48 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴任意分隔的值列表，例如：&#10;1, 2, 2, abc, o'brien&#10;1001&#09;1002&#10;1003 1004,1005"
            spellcheck="false"
          ></textarea>

          <div class="flex gap-2 mt-3">
            <button
              @click="fillSample"
              class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
            >
              样例
            </button>
            <button
              @click="clearAll"
              class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
            >
              清空
            </button>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings2 class="w-5 h-5 mr-2 text-primary" /> 格式化选项
          </h2>

          <!-- 引号模式 -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">引号模式</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="opt in quoteModeOptions"
                :key="opt.value"
                @click="quoteMode = opt.value"
                :class="quoteMode === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >
                {{ opt.label }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">自动：全部为数字时不加引号，混有非数字时统一加引号</p>
          </div>

          <!-- 去重 -->
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">去重（保留首次出现顺序）</span>
            <button
              type="button"
              @click="dedupe = !dedupe"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="dedupe ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="dedupe ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>

          <!-- 单引号转义 -->
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">单引号转义（' → ''）</span>
            <button
              type="button"
              @click="escapeQuote = !escapeQuote"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="escapeQuote ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="escapeQuote ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>

          <!-- Oracle 1000 限制分组 -->
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-foreground">Oracle 1000 限制分组（OR 拼接）</span>
            <button
              type="button"
              @click="groupEnabled = !groupEnabled"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              :class="groupEnabled ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="groupEnabled ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>

          <div v-if="groupEnabled">
            <label class="block text-sm font-medium text-foreground mb-2">每组个数 N</label>
            <input
              v-model.number="groupSize"
              type="number"
              min="1"
              max="10000"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p class="text-xs text-muted-foreground mt-1.5">Oracle IN 列表最多 1000 项，超出一组自动改为 IN (...) OR IN (...)。MySQL 超长列表也可参考此写法。</p>
          </div>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Braces class="w-5 h-5 mr-2 text-primary" /> IN 条件结果
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
            <div class="grid grid-cols-3 gap-3 mb-4">
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-xl font-bold text-foreground">{{ rawValues.length }}</p>
                <p class="text-xs text-muted-foreground">原始总数</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-xl font-bold text-foreground">{{ dedupeCount }}</p>
                <p class="text-xs text-muted-foreground">去重后</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-xl font-bold text-foreground">{{ groupCount }}</p>
                <p class="text-xs text-muted-foreground">组数</p>
              </div>
            </div>
            <textarea
              v-if="outputText"
              :value="outputText"
              readonly
              class="w-full h-64 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else class="py-16 text-center">
              <Braces class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">粘贴值列表后，这里会显示拼好的 IN 条件</p>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 处理规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">分隔识别</span>：逗号、换行、空格、制表符可任意混排，自动切分并去除空白项</li>
            <li>• <span class="text-foreground">引号模式</span>：自动 = 全部为纯数字时不加引号、混有非数字时统一加引号；也可强制全加 / 全不加</li>
            <li>• <span class="text-foreground">去重</span>：按首次出现顺序保留唯一值，不改变原有顺序</li>
            <li>• <span class="text-foreground">转义</span>：值中的单引号按 SQL 标准翻倍（' → ''），防止语法错误与注入</li>
            <li>• <span class="text-foreground">分组</span>：启用后每组 N 个值一组，输出 IN (...) OR IN (...)，规避 Oracle ORA-01795 限制</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于SQL IN条件格式化</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            排查线上问题时最常见的一步：从 Excel、CSV、日志或群消息里拿到一列订单号 / 用户 ID，要拿去数据库里查「WHERE id IN (...)」。手工逐个加引号加逗号既慢又容易漏转义，本工具把这一步变成粘贴 + 复制两次点击。
          </p>
          <h3 class="text-lg font-semibold text-foreground">引号模式怎么选</h3>
          <p>
            目标列是数值类型（BIGINT / INT）时选「全不加」即可；是字符类型（VARCHAR / CHAR）时必须加引号。「自动」模式按整列判断：全部是纯数字就不加引号，只要混有一个非数字值就统一加引号，避免把字符串列拼出语法错误。
          </p>
          <h3 class="text-lg font-semibold text-foreground">为什么要转义单引号</h3>
          <p>
            SQL 里字符串中的单引号要写成两个单引号（' → ''），比如 O'Brien 要写成 'O''Brien'。不转义轻则报语法错误，重则改变语句结构构成注入风险。开启转义后工具会自动处理，建议保持开启。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">Oracle 报 ORA-01795 怎么办？</span>Oracle 的 IN 列表最多 1000 项，开启分组后工具按每组 N 个（默认 1000）拆成 IN (...) OR IN (...)，语义与原语句等价。</li>
            <li><span class="text-foreground font-medium">会改变值的顺序吗？</span>不会。去重只保留首次出现的顺序，其余值按原顺序输出；不开启去重则完全按输入顺序。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会。切分、去重、拼接全部在浏览器本地完成，生产订单号、用户 ID 不会离开你的电脑。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sql-in-formatter'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Terminal, List, Settings2, Braces, Copy, Info,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'SQL IN条件格式化 - ID列表一键拼IN(...)，去重/转义/Oracle分组',
  description: '在线SQL IN条件格式化工具，把 Excel/日志粘来的逗号、换行、空格混排 ID 列表一键拼成 IN (...)，支持自动引号模式、保序去重、单引号转义与 Oracle 1000 限制 OR 分组，纯本地处理',
  keywords: 'sql in格式化, 逗号转引号, id列表转in, sql in拼接, oracle 1000限制, in条件生成, dba工具',
  author: 'Util工具箱',
  ogTitle: 'SQL IN条件格式化 - 有条工具',
  ogDescription: 'Excel 粘来的 ID 列表一键拼成 SQL IN 条件，自动去重/数字识别/引号转义',
  ogUrl: 'https://www.util.cn/tools/sql-in-formatter',
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
          name: 'SQL IN条件格式化',
          url: 'https://www.util.cn/tools/sql-in-formatter',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['任意分隔符混排识别', '自动/强制引号模式', '保序去重', '单引号转义', 'Oracle 1000 限制 OR 分组']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'SQL IN条件格式化', item: 'https://www.util.cn/tools/sql-in-formatter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Oracle 报 ORA-01795 怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: 'Oracle 的 IN 列表最多 1000 项，开启分组后按每组 N 个拆成 IN (...) OR IN (...)，语义与原语句等价。' }
            },
            {
              '@type': 'Question',
              name: '引号模式的自动是如何判断的？',
              acceptedAnswer: { '@type': 'Answer', text: '整列全部为纯数字时不加引号，只要混有非数字值就统一加引号，避免字符串列出现语法错误。' }
            },
            {
              '@type': 'Question',
              name: '数据会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。切分、去重、转义与拼接全部在浏览器本地完成。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'sql-in-formatter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数区（node 可独立测试） ----------

// 按逗号/换行/空格/制表符混排切分值列表
const splitValueList = (text) => {
  return String(text || '')
    .split(/[,\n\r\t ]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

// 纯数字判断（整数或小数，可带正负号）
const isNumericValue = (s) => /^[+-]?\d+(\.\d+)?$/.test(s)

// 保序去重
const dedupeKeepOrder = (arr) => {
  const seen = new Set()
  const out = []
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v)
      out.push(v)
    }
  }
  return out
}

// 格式化为 IN (...)；mode: 'auto' | 'all' | 'none'
// auto：整列全为数字时不加引号，混有非数字时统一加引号
const formatInList = (values, mode, escapeQuote) => {
  if (!values.length) return ''
  const allNumeric = values.every(isNumericValue)
  const useQuotes = mode === 'all' || (mode === 'auto' && !allNumeric)
  const items = values.map(v => {
    if (!useQuotes) return v
    const inner = escapeQuote ? v.replace(/'/g, "''") : v
    return "'" + inner + "'"
  })
  return '(' + items.join(', ') + ')'
}

// Oracle 1000 限制分组：每组 N 个值，IN (...) OR IN (...) 换行拼接
const formatGroupedIn = (values, mode, escapeQuote, groupSize) => {
  const size = Math.max(1, Math.floor(groupSize) || 1000)
  const groups = []
  for (let i = 0; i < values.length; i += size) {
    groups.push(formatInList(values.slice(i, i + size), mode, escapeQuote))
  }
  return groups.join('\nOR ')
}

// ---------- 状态 ----------
const inputText = ref('')
const quoteMode = ref('auto')
const dedupe = ref(false)
const escapeQuote = ref(true)
const groupEnabled = ref(false)
const groupSize = ref(1000)
const seoContentVisible = ref(true)

const quoteModeOptions = [
  { value: 'auto', label: '自动' },
  { value: 'all', label: '全部加引号' },
  { value: 'none', label: '全部不加' }
]

const rawValues = computed(() => splitValueList(inputText.value))
const dedupeCount = computed(() => dedupeKeepOrder(rawValues.value).length)
const effectiveValues = computed(() => dedupe.value ? dedupeKeepOrder(rawValues.value) : rawValues.value)

const groupCount = computed(() => {
  if (!effectiveValues.value.length) return 0
  if (!groupEnabled.value) return 1
  const size = Math.max(1, Math.floor(groupSize.value) || 1000)
  return Math.ceil(effectiveValues.value.length / size)
})

const outputText = computed(() => {
  if (!effectiveValues.value.length) return ''
  if (groupEnabled.value) {
    return formatGroupedIn(effectiveValues.value, quoteMode.value, escapeQuote.value, groupSize.value)
  }
  return formatInList(effectiveValues.value, quoteMode.value, escapeQuote.value)
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const fillSample = () => {
  inputText.value = "1, 2, 2, abc, o'brien\n1001\t1002\n1003 1004,1002"
}

const clearAll = () => {
  inputText.value = ''
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
</script>
