<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Database class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">MyBatis日志还原SQL</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 Preparing 与 Parameters 两行，按类型回填占位符生成可直接执行的 SQL</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        把 MyBatis 打印的预编译 SQL 日志还原成可执行语句：自动识别整段日志中的多组 Preparing / Parameters，按 String、数值、日期、Boolean 等类型把问号占位符替换为真实参数值，参数与占位符数量不匹配时给出红色警告。全部解析在浏览器本地完成，日志不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> 日志输入
        </h2>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            @click="mode = 'log'"
            :class="mode === 'log' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-xs font-medium transition-all"
          >整段日志（自动识别）</button>
          <button
            @click="mode = 'split'"
            :class="mode === 'split' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-xs font-medium transition-all"
          >Preparing / Parameters 分行</button>
        </div>

        <div v-if="mode === 'log'">
          <label class="block text-sm font-medium text-foreground mb-2">完整日志（可含多组 Preparing / Parameters）</label>
          <textarea
            v-model="logText"
            class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 MyBatis 日志，例如：&#10;Preparing: INSERT INTO t(name, age, born) VALUES (?, ?, ?)&#10;Parameters: 张三(String), 25(Integer), 2024-05-01 08:30:00(Timestamp)"
            spellcheck="false"
          ></textarea>
          <p class="text-xs text-muted-foreground mt-1.5">自动扫描 Preparing: 与 Parameters: 两行并逐组配对还原，无需删除日志里的其他内容。</p>
        </div>

        <div v-else class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Preparing 行</label>
            <textarea
              v-model="preparingText"
              class="w-full h-28 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="INSERT INTO t(name, age, born) VALUES (?, ?, ?)&#10;（带 Preparing: 前缀也可以）"
              spellcheck="false"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Parameters 行</label>
            <textarea
              v-model="parametersText"
              class="w-full h-28 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="张三(String), 25(Integer), 2024-05-01 08:30:00(Timestamp)&#10;（带 Parameters: 前缀也可以）"
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="fillSample"
            class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
          >填入示例</button>
          <button
            @click="clearAll"
            class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
          >清空</button>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Code class="w-5 h-5 mr-2 text-primary" /> 还原结果
            <span v-if="groups.length > 0" class="ml-2 text-xs font-normal text-muted-foreground">共 {{ groups.length }} 条</span>
          </h2>
          <button
            v-if="groups.length > 1"
            @click="copyAll"
            class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
          >
            <Check v-if="copiedKey === 'all'" class="w-3.5 h-3.5 text-green-600" />
            <Copy v-else class="w-3.5 h-3.5" />
            {{ copiedKey === 'all' ? '已复制' : '复制全部' }}
          </button>
        </div>

        <div v-if="groups.length > 0" class="space-y-4">
          <div v-for="(g, gi) in groups" :key="gi" class="border border-border rounded-lg p-4">
            <div class="flex items-center justify-between mb-2 gap-2">
              <span class="text-xs text-muted-foreground">第 {{ gi + 1 }} 条 · 占位符 {{ g.placeholders }} 个 · 参数 {{ g.params }} 个</span>
              <button
                @click="copyText(g.sql, 'g' + gi)"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1 flex-shrink-0"
              >
                <Check v-if="copiedKey === 'g' + gi" class="w-3 h-3 text-green-600" />
                <Copy v-else class="w-3 h-3" />
                {{ copiedKey === 'g' + gi ? '已复制' : '复制' }}
              </button>
            </div>

            <!-- 数量不匹配警告 -->
            <div
              v-if="g.placeholders !== g.params"
              class="mb-2 flex items-start gap-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md p-2.5 text-xs leading-relaxed"
            >
              <AlertTriangle class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>参数与占位符数量不匹配：占位符 {{ g.placeholders }} 个，参数 {{ g.params }} 个。请检查日志是否被截断，或 SQL 中存在动态拼接的问号。</span>
            </div>

            <!-- 高亮 SQL -->
            <pre class="w-full bg-muted/30 border border-border rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed" v-html="highlightSql(g.sql)"></pre>

            <details class="mt-2">
              <summary class="text-xs text-muted-foreground cursor-pointer hover:text-foreground">查看原始 Preparing</summary>
              <pre class="text-xs text-muted-foreground font-mono mt-1 whitespace-pre-wrap break-all">{{ g.rawSql }}</pre>
            </details>
          </div>
        </div>

        <div v-else class="py-16 text-center">
          <Database class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">粘贴 MyBatis 日志后，这里会显示还原出的可执行 SQL</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 MyBatis 日志还原 SQL</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            开发时经常需要把 MyBatis 打印的预编译 SQL 与参数拼回完整语句，放到数据库客户端里直接执行来排查问题。手动替换问号既繁琐又容易错位，本工具按日志中的类型标注自动完成回填，支持一条日志里的多组 Preparing / Parameters，并在数量对不上时明确提示。
          </p>
          <h3 class="text-lg font-semibold text-foreground">工作原理</h3>
          <p>
            工具先从日志中扫描 Preparing: 行取出预编译 SQL、扫描其后的 Parameters: 行取出参数列表；再按「值(类型)」的格式逐个拆分参数（兼容参数值自身含逗号、括号的情况），依据类型把每个问号占位符按顺序替换为对应写法的值，最后输出一条可直接执行的完整 SQL。
          </p>
          <h3 class="text-lg font-semibold text-foreground">支持的参数类型</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>String / Char / varchar：加单引号，内部单引号转义为 <code class="font-mono">\'</code></li>
            <li>Long / Integer / Short / Byte / BigDecimal / Double / Float：数值原样输出</li>
            <li>Date / Timestamp / LocalDateTime：格式化为 <code class="font-mono">'YYYY-MM-DD HH:mm:ss'</code></li>
            <li>Boolean：输出 true / false</li>
            <li>null：输出 NULL</li>
            <li>无类型标注：能当数字就按数字输出，否则加引号按字符串输出</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">还原的 SQL 会不会不安全？</span>工具只在本页面内完成文本替换，日志与结果都不会上传服务器；还原出的 SQL 请仅在测试环境执行。</li>
            <li><span class="text-foreground font-medium">为什么提示数量不匹配？</span>说明 Preparing 里的问号个数与 Parameters 的参数个数对不上，常见原因是日志被截断、动态 SQL 拼接了额外的问号，或复制时漏了某个参数。</li>
            <li><span class="text-foreground font-medium">支持一条日志多组 SQL 吗？</span>支持。整段日志模式会自动把每组 Preparing 与紧随其后的 Parameters 配对，逐组还原并分别展示、分别复制。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mybatis-sql-restore'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Database, FileText, Code, Copy, Check, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'MyBatis日志还原SQL - Preparing/Parameters参数回填工具',
  description: '粘贴 MyBatis 日志的 Preparing 与 Parameters 两行，按类型自动回填问号占位符生成可执行 SQL，支持多组日志、SQL 高亮、一键复制，数量不匹配红色警告，纯本地处理',
  keywords: 'mybatis日志还原sql, 预编译sql参数填充, preparing parameters, 占位符替换, sql调试',
  author: 'Util工具箱',
  ogTitle: 'MyBatis日志还原SQL - 有条工具',
  ogDescription: '按类型回填 MyBatis 日志占位符，一键还原可执行 SQL',
  ogUrl: 'https://www.util.cn/tools/mybatis-sql-restore',
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
          name: 'MyBatis日志还原SQL',
          url: 'https://www.util.cn/tools/mybatis-sql-restore',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Preparing/Parameters 参数回填', '多组日志自动配对', '按类型转义与格式化', '数量不匹配警告', 'SQL 高亮与一键复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'MyBatis日志还原SQL', item: 'https://www.util.cn/tools/mybatis-sql-restore/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '还原的 SQL 会不会不安全？',
              acceptedAnswer: { '@type': 'Answer', text: '工具只在本页面内完成文本替换，日志与结果都不会上传服务器；还原出的 SQL 请仅在测试环境执行。' }
            },
            {
              '@type': 'Question',
              name: '为什么提示数量不匹配？',
              acceptedAnswer: { '@type': 'Answer', text: '说明 Preparing 里的问号个数与 Parameters 的参数个数对不上，常见原因是日志被截断、动态 SQL 拼接了额外的问号，或复制时漏了某个参数。' }
            },
            {
              '@type': 'Question',
              name: '支持一条日志多组 SQL 吗？',
              acceptedAnswer: { '@type': 'Answer', text: '支持。整段日志模式会自动把每组 Preparing 与紧随其后的 Parameters 配对，逐组还原并分别展示、分别复制。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'mybatis-sql-restore')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const mode = ref('log') // 'log' 整段日志 | 'split' 分行输入
const logText = ref('')
const preparingText = ref('')
const parametersText = ref('')
const seoContentVisible = ref(true)
const copiedKey = ref('')
let copyTimer = null

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 复制 ----------
const copyText = async (text, key) => {
  if (!text) return
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

// ---------- 参数拆分（兼容值内含逗号/括号） ----------
const splitParams = (s) => {
  const trimmed = s.trim()
  if (!trimmed) return []
  // 完全没有类型标注时按普通逗号拆分
  if (!/\([A-Za-z][\w.]*\s*\)/.test(trimmed)) {
    return trimmed.split(',').map(p => p.trim()).filter(p => p !== '')
  }
  const parts = []
  let rest = trimmed
  while (rest.length > 0) {
    // 值 + (类型)，且 (类型) 后面紧跟逗号或结尾
    const m = rest.match(/^([\s\S]*?)\(\s*([A-Za-z][\w.]*)\s*\)(?=\s*(,|$))/)
    if (!m) {
      parts.push(rest.trim())
      break
    }
    const value = m[1].replace(/^\s*,/, '').trim()
    parts.push((value ? value : '') + '(' + m[2] + ')')
    rest = rest.slice(m[0].length).replace(/^\s*,\s*/, '')
  }
  return parts.filter(p => p !== '')
}

// ---------- 类型映射 ----------
const NUM_TYPES = ['long', 'integer', 'int', 'short', 'byte', 'bigdecimal', 'double', 'float']
const STR_TYPES = ['string', 'char', 'varchar']
const DATE_TYPES = ['date', 'timestamp', 'localdatetime', 'localdate', 'localtime', 'time']
const BOOL_TYPES = ['boolean', 'bool']

const formatParam = (raw) => {
  let v = raw.trim()
  let type = ''
  const tm = v.match(/\(([A-Za-z][\w.]*)\)\s*$/)
  if (tm) {
    type = tm[1].toLowerCase()
    v = v.slice(0, tm.index).trim()
  }
  if (/^null$/i.test(v)) return 'NULL'
  const quoteStr = (t) => "'" + String(t).replace(/'/g, "\\'") + "'"
  if (DATE_TYPES.indexOf(type) > -1) {
    let d = v
    const dm = d.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/)
    if (dm) d = dm[1] + ' ' + dm[2]
    return "'" + d + "'"
  }
  if (BOOL_TYPES.indexOf(type) > -1) {
    return /^(true|false)$/i.test(v) ? v.toLowerCase() : quoteStr(v)
  }
  if (NUM_TYPES.indexOf(type) > -1) {
    return /^-?\d+(\.\d+)?$/.test(v) ? v : quoteStr(v)
  }
  if (STR_TYPES.indexOf(type) > -1) {
    return quoteStr(v)
  }
  // 无类型标注：能当数字就数字，否则加引号
  if (/^-?\d+(\.\d+)?$/.test(v)) return v
  return quoteStr(v)
}

// ---------- 占位符统计与回填 ----------
const countPlaceholders = (sql) => {
  let n = 0
  let inStr = false
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (ch === "'") {
      if (inStr && sql[i + 1] === "'") {
        i++
      } else {
        inStr = !inStr
      }
      continue
    }
    if (ch === '?' && !inStr) n++
  }
  return n
}

const restorePair = (sql, paramsRaw) => {
  const params = splitParams(paramsRaw)
  const formatted = params.map(formatParam)
  let pi = 0
  let out = ''
  let inStr = false
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (inStr) {
      out += ch
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          out += sql[i + 1]
          i++
        } else {
          inStr = false
        }
      }
      continue
    }
    if (ch === "'") {
      inStr = true
      out += ch
      continue
    }
    if (ch === '?') {
      if (pi < formatted.length) {
        out += formatted[pi]
        pi++
      } else {
        out += ch
      }
      continue
    }
    out += ch
  }
  return {
    sql: out,
    rawSql: sql,
    placeholders: countPlaceholders(sql),
    params: formatted.length,
    filled: pi
  }
}

// ---------- 整段日志抽取多组 Preparing / Parameters ----------
const extractPairs = (text) => {
  const lines = text.split(/\r?\n/)
  const pairs = []
  let pending = null
  for (const line of lines) {
    const pm = line.match(/Preparing:\s*(.*)$/)
    if (pm) {
      if (pending !== null && pending !== '') {
        pairs.push({ sql: pending, params: '' })
      }
      pending = pm[1].trim()
      continue
    }
    const rm = line.match(/Parameters:\s*(.*)$/)
    if (rm) {
      if (pending !== null && pending !== '') {
        pairs.push({ sql: pending, params: rm[1].trim() })
        pending = null
      }
      continue
    }
  }
  if (pending !== null && pending !== '') {
    pairs.push({ sql: pending, params: '' })
  }
  return pairs.filter(p => p.sql)
}

// ---------- 结果 ----------
const groups = computed(() => {
  let pairs = []
  if (mode.value === 'log') {
    pairs = extractPairs(logText.value)
  } else {
    const sqlRaw = preparingText.value.trim()
    const prmRaw = parametersText.value.trim()
    if (sqlRaw || prmRaw) {
      const sm = sqlRaw.match(/Preparing:\s*([\s\S]*)$/)
      const pm = prmRaw.match(/Parameters:\s*([\s\S]*)$/)
      pairs = [{
        sql: (sm ? sm[1] : sqlRaw).trim(),
        params: (pm ? pm[1] : prmRaw).trim()
      }]
    }
  }
  return pairs.map(p => restorePair(p.sql, p.params))
})

const allSqlText = computed(() => groups.value.map(g => g.sql).join('\n\n'))

const copyAll = () => {
  copyText(allSqlText.value, 'all')
}

// ---------- SQL 高亮 ----------
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const highlightSql = (sql) => {
  const escaped = escapeHtml(sql)
  return escaped.replace(
    /('(?:[^'\\]|\\.)*')|\b(SELECT|FROM|INSERT|INTO|VALUES|UPDATE|SET|DELETE|WHERE|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|ORDER|GROUP|BY|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN)\b|\b(\d+(?:\.\d+)?)\b/gi,
    (m, str, kw, num) => {
      if (str) return '<span class="text-green-600 dark:text-green-400">' + str + '</span>'
      if (kw) return '<span class="text-blue-600 dark:text-blue-400 font-semibold">' + kw + '</span>'
      if (num) return '<span class="text-orange-600 dark:text-orange-400">' + num + '</span>'
      return m
    }
  )
}

// ---------- 示例与清空 ----------
const fillSample = () => {
  mode.value = 'log'
  logText.value = [
    '==>  Preparing: INSERT INTO t(name, age, born) VALUES (?, ?, ?)',
    '==>  Parameters: 张三(String), 25(Integer), 2024-05-01 08:30:00(Timestamp)',
    '<==    Updates: 1',
    '==>  Preparing: SELECT * FROM t_user WHERE id = ? AND status = ?',
    '==>  Parameters: 1001(Long), null(String)'
  ].join('\n')
}

const clearAll = () => {
  logText.value = ''
  preparingText.value = ''
  parametersText.value = ''
}
</script>
