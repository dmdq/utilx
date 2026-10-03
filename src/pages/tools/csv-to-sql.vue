<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Table class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">CSV转SQL工具</h1>
          <p class="text-sm text-muted-foreground mt-1">CSV 一键生成 INSERT / CREATE TABLE 语句，支持 MySQL、PostgreSQL、SQLite</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴或上传 CSV，自动采样推断列类型生成建表语句，按方言生成批量 INSERT（反引号/双引号、事务包裹、空值为 NULL），单引号严格转义防止语法错误。预览前 100 行，可复制或下载完整 .sql 文件，全部在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入与配置 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Database class="w-5 h-5 mr-2 text-primary" /> 输入数据
          </h2>

          <!-- 上传区 -->
          <label
            class="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 mb-4 block"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/plain"
              class="hidden"
              @change="handleFileChange"
            />
            <Download class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
            <p v-if="!inputFileName" class="text-xs text-muted-foreground">点击选择 .csv / .tsv 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ inputFileName }}</p>
          </label>

          <textarea
            v-model="inputText"
            class="w-full h-44 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 CSV 数据（首行为表头），例如：&#10;name,age,city&#10;张三,28,北京&#10;李四,32,上海"
            spellcheck="false"
          ></textarea>

          <div class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">目标表名</label>
              <input
                v-model="tableName"
                type="text"
                placeholder="imported_data"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">SQL 方言</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="opt in dialectOptions"
                  :key="opt.value"
                  @click="dialect = opt.value"
                  :class="dialect === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">每条 INSERT 包含行数</label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="n in batchOptions"
                  :key="n"
                  @click="batchSize = n"
                  :class="batchSize === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                  class="py-1.5 rounded text-xs font-medium transition-all"
                >
                  {{ n }} 行
                </button>
              </div>
            </div>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">生成 CREATE TABLE（按前 100 行采样推断类型）</span>
              <button
                type="button"
                @click="withCreateTable = !withCreateTable"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="withCreateTable ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="withCreateTable ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">空单元格输出为 NULL</span>
              <button
                type="button"
                @click="nullForEmpty = !nullForEmpty"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="nullForEmpty ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="nullForEmpty ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-foreground">事务包裹（BEGIN / COMMIT）</span>
              <button
                type="button"
                @click="wrapTransaction = !wrapTransaction"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                :class="wrapTransaction ? 'bg-primary' : 'bg-muted'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="wrapTransaction ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </label>
          </div>
        </div>

        <!-- 解析信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 解析结果
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ parsedRows.length }}</p>
              <p class="text-xs text-muted-foreground">数据行</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ parsedHeaders.length }}</p>
              <p class="text-xs text-muted-foreground">列数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ statementCount }}</p>
              <p class="text-xs text-muted-foreground">语句数</p>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
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
      </div>

      <!-- 右侧：输出区 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileCode class="w-5 h-5 mr-2 text-primary" /> SQL 预览
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyOutput"
                :disabled="!fullSql"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadSql"
                :disabled="!fullSql"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载 .sql
              </button>
            </div>
          </div>
          <div class="p-6">
            <div v-if="previewNotice && fullSql" class="mb-3 flex items-start gap-2 bg-muted/50 rounded-lg p-3">
              <AlertTriangle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p class="text-xs text-muted-foreground">{{ previewNotice }}</p>
            </div>
            <textarea
              v-if="fullSql"
              :value="previewSql"
              readonly
              class="w-full h-96 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else-if="parseError" class="py-16 text-center">
              <XCircle class="w-10 h-10 mx-auto mb-3 text-destructive" />
              <p class="text-sm text-destructive font-medium mb-1">解析失败</p>
              <p class="text-xs text-muted-foreground">{{ parseError }}</p>
            </div>
            <div v-else class="py-16 text-center">
              <Table class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入 CSV 数据后，这里会显示生成的 SQL 语句</p>
            </div>
          </div>
        </div>

        <!-- 类型推断结果 -->
        <div v-if="columnTypes.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 列类型推断
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted">
                <tr>
                  <th class="px-4 py-2.5 text-left font-medium text-foreground">原列名</th>
                  <th class="px-4 py-2.5 text-left font-medium text-foreground">SQL 列名</th>
                  <th class="px-4 py-2.5 text-left font-medium text-foreground">推断类型</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(col, idx) in columnTypes" :key="idx" class="border-t border-border">
                  <td class="px-4 py-2 text-muted-foreground">{{ col.original }}</td>
                  <td class="px-4 py-2 font-mono text-foreground">{{ col.sqlName }}</td>
                  <td class="px-4 py-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{{ col.type }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 生成规则
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">类型推断</span>：按前 100 行采样——全整数 INTEGER、全数字 DECIMAL(18,4)、ISO 日期 DATE、其余 TEXT</li>
            <li>• <span class="text-foreground">列名合法化</span>：空格转下划线、非法字符移除、数字开头加前缀、SQL 保留字追加后缀</li>
            <li>• <span class="text-foreground">转义严格</span>：值用单引号包裹，内部单引号翻倍（''）；MySQL 方言额外转义反斜杠</li>
            <li>• <span class="text-foreground">标识符引用</span>：MySQL 使用反引号 <span class="font-mono">`t`</span>，PostgreSQL / SQLite 使用双引号 <span class="font-mono">"t"</span></li>
            <li>• <span class="text-foreground">预览限制</span>：页面预览仅展示前 100 行数据对应的语句，复制与下载包含全部行</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于CSV转SQL工具</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            把 CSV 数据导入数据库最常见的方式就是生成 INSERT 语句：从 Excel / 导出文件拿到 CSV，自动生成带类型推断的 CREATE TABLE 与批量 INSERT，再整体执行即可完成导入。本工具支持 MySQL（反引号）、PostgreSQL 与 SQLite（双引号）三种方言，可控制每条 INSERT 的行数以平衡执行效率与语句长度，支持事务包裹保证导入原子性，并对单引号等特殊字符做严格转义。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>Excel 数据批量导入 MySQL / PostgreSQL 测试库或生产库</li>
            <li>为单元测试生成种子数据（seed data）的 SQL 脚本</li>
            <li>SQLite 本地数据库初始化：把配置表、字典表灌入 App 内置数据库</li>
            <li>数据迁移中转：旧系统导出 CSV → 生成 SQL → 新系统执行</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会。CSV 解析与 SQL 生成全部在浏览器本地完成。</li>
            <li><span class="text-foreground font-medium">每条 INSERT 多少行合适？</span>批量多行 INSERT 执行更快，但单条语句有 max_allowed_packet（MySQL）等长度限制，建议 100~500 行。</li>
            <li><span class="text-foreground font-medium">列类型会推断错误吗？</span>推断按前 100 行采样，若后续行出现非数字内容，INSERT 仍会以字符串写入（数据库通常可隐式转换），必要时可手动调整建表语句。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'csv-to-sql'" :category="'format'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Table, Database, FileCode, Copy, Download, Info, AlertTriangle,
  XCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'CSV转SQL工具 - CSV生成INSERT/CREATE TABLE语句',
  description: '在线CSV转SQL工具，支持MySQL、PostgreSQL、SQLite三种方言，自动推断列类型生成CREATE TABLE与批量INSERT语句，单引号严格转义、事务包裹、空值NULL，纯本地处理',
  keywords: 'csv转sql, csv生成insert, csv导入数据库, csv to sql, 建表语句, 批量插入',
  author: 'Util工具箱',
  ogTitle: 'CSV转SQL工具 - 有条工具',
  ogDescription: 'CSV一键生成INSERT/CREATE TABLE，支持MySQL/PostgreSQL/SQLite，本地处理',
  ogUrl: 'https://www.util.cn/tools/csv-to-sql',
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
          name: 'CSV转SQL工具',
          url: 'https://www.util.cn/tools/csv-to-sql',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['CSV转INSERT', '类型推断建表', 'MySQL/PostgreSQL/SQLite方言', '事务包裹', '严格转义']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '数据格式化', item: 'https://www.util.cn/format/' },
            { '@type': 'ListItem', position: 3, name: 'CSV转SQL工具', item: 'https://www.util.cn/tools/csv-to-sql/' }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'csv-to-sql')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const inputText = ref('')
const inputFileName = ref('')
const tableName = ref('')
const dialect = ref('mysql')
const batchSize = ref(100)
const withCreateTable = ref(true)
const nullForEmpty = ref(true)
const wrapTransaction = ref(false)
const parseError = ref('')
const seoContentVisible = ref(true)
const fileInput = ref(null)

const dialectOptions = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgres', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' }
]

const batchOptions = [1, 100, 500]

// ---------- CSV 解析（引号感知，自动识别分隔符） ----------
const parseCsv = (text, delim) => {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }
    if (ch === '"' && field === '') { inQuotes = true; i++; continue }
    if (ch === delim) { row.push(field); field = ''; i++; continue }
    if (ch === '\r') { i++; continue }
    if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += ch
    i++
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''))
}

const detectDelimiter = (text) => {
  const sample = text.split('\n').slice(0, 5).join('\n')
  const candidates = [',', '\t', ';', '|']
  let best = ','
  let bestCount = 0
  for (const d of candidates) {
    const count = sample.split(d).length - 1
    if (count > bestCount) { bestCount = count; best = d }
  }
  return best
}

// ---------- SQL 生成辅助 ----------
const RESERVED = new Set([
  'order', 'group', 'table', 'select', 'index', 'key', 'primary', 'from', 'where',
  'insert', 'update', 'delete', 'values', 'into', 'create', 'drop', 'alter', 'set',
  'by', 'join', 'left', 'right', 'inner', 'outer', 'on', 'as', 'and', 'or', 'not',
  'null', 'default', 'unique', 'check', 'constraint', 'union', 'all', 'distinct',
  'limit', 'offset', 'having', 'case', 'when', 'then', 'else', 'end', 'view',
  'trigger', 'procedure', 'database', 'schema', 'user', 'role', 'grant', 'revoke',
  'desc', 'asc', 'between', 'in', 'is', 'like', 'exists', 'references', 'foreign',
  'column', 'type', 'data'
])

const legalizeIdentifier = (name, fallback) => {
  let c = String(name || '').trim().replace(/\s+/g, '_').replace(/[^\w\u4e00-\u9fa5]/g, '')
  if (!c) c = fallback
  if (/^\d/.test(c)) c = 'c_' + c
  if (RESERVED.has(c.toLowerCase())) c = c + '_field'
  return c
}

const quoteIdent = (name) => {
  return dialect.value === 'mysql' ? '`' + name + '`' : '"' + name + '"'
}

const escapeSqlValue = (raw) => {
  if (raw === null || raw === undefined) return 'NULL'
  let s = String(raw)
  if (s === '') return nullForEmpty.value ? 'NULL' : "''"
  if (dialect.value === 'mysql') {
    s = s.replace(/\\/g, '\\\\').replace(/'/g, "''")
  } else {
    s = s.replace(/'/g, "''")
  }
  return "'" + s + "'"
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/
const INT_RE = /^[+-]?\d+$/
const NUM_RE = /^[+-]?(\d+(\.\d+)?|\.\d+)$/

const inferType = (values) => {
  let isInt = true
  let isNum = true
  let isDate = true
  let hasValue = false
  for (const v of values) {
    const s = (v ?? '').trim()
    if (s === '') continue
    hasValue = true
    if (!INT_RE.test(s)) isInt = false
    if (!NUM_RE.test(s)) isNum = false
    if (!ISO_DATE_RE.test(s)) isDate = false
  }
  if (!hasValue) return 'TEXT'
  if (isInt) return 'INTEGER'
  if (isNum) return 'DECIMAL(18,4)'
  if (isDate) return 'DATE'
  return 'TEXT'
}

// ---------- 解析与生成 ----------
const parsedHeaders = computed(() => {
  const rows = parsedAllRows.value
  if (!rows.length) return []
  return rows[0].map((h, idx) => h.trim() || `column_${idx + 1}`)
})

const parsedRows = computed(() => {
  const rows = parsedAllRows.value
  if (!rows.length) return []
  const width = rows[0].length
  return rows.slice(1).map(r => {
    const rr = r.slice()
    while (rr.length < width) rr.push('')
    return rr.slice(0, width)
  })
})

const parsedAllRows = computed(() => {
  const text = inputText.value
  if (!text.trim()) return []
  try {
    return parseCsv(text, detectDelimiter(text))
  } catch (err) {
    return []
  }
})

const safeTableName = computed(() => legalizeIdentifier(tableName.value || 'imported_data', 'imported_data'))

const columnTypes = computed(() => {
  if (!parsedHeaders.value.length) return []
  const sampleN = Math.min(parsedRows.value.length, 100)
  return parsedHeaders.value.map((h, ci) => {
    const values = []
    for (let ri = 0; ri < sampleN; ri++) values.push(parsedRows.value[ri][ci])
    return {
      original: h,
      sqlName: legalizeIdentifier(h, `col_${ci + 1}`),
      type: inferType(values)
    }
  })
})

const sqlColumns = computed(() => columnTypes.value.map(c => c.sqlName))

const buildInsertStatements = (rows) => {
  if (!rows.length) return []
  const table = quoteIdent(safeTableName.value)
  const cols = '(' + sqlColumns.value.map(quoteIdent).join(', ') + ')'
  const statements = []
  for (let i = 0; i < rows.length; i += batchSize.value) {
    const chunk = rows.slice(i, i + batchSize.value)
    const tuples = chunk.map(row =>
      '(' + row.map(cell => escapeSqlValue(cell === undefined ? '' : String(cell))).join(', ') + ')'
    )
    if (batchSize.value === 1) {
      statements.push(`INSERT INTO ${table} ${cols} VALUES ${tuples[0]};`)
    } else {
      statements.push(`INSERT INTO ${table} ${cols} VALUES\n` + tuples.join(',\n') + ';')
    }
  }
  return statements
}

const fullSql = computed(() => {
  if (!parsedRows.value.length) return ''
  try {
    const parts = []
    if (withCreateTable.value) {
      const cols = columnTypes.value.map(c => '  ' + quoteIdent(c.sqlName) + ' ' + c.type).join(',\n')
      parts.push(`CREATE TABLE ${quoteIdent(safeTableName.value)} (\n${cols}\n);`)
    }
    parts.push(...buildInsertStatements(parsedRows.value))
    let body = parts.join('\n\n')
    if (wrapTransaction.value) {
      const begin = dialect.value === 'mysql' ? 'START TRANSACTION;' : 'BEGIN;'
      body = begin + '\n\n' + body + '\n\nCOMMIT;'
    }
    return body
  } catch (err) {
    parseError.value = err?.message || 'SQL 生成失败'
    return ''
  }
})

const statementCount = computed(() => {
  if (!parsedRows.value.length) return 0
  let count = withCreateTable.value ? 1 : 0
  count += Math.ceil(parsedRows.value.length / batchSize.value)
  return count
})

const PREVIEW_ROWS = 100

const previewSql = computed(() => {
  if (!parsedRows.value.length) return ''
  try {
    const parts = []
    if (withCreateTable.value) {
      const cols = columnTypes.value.map(c => '  ' + quoteIdent(c.sqlName) + ' ' + c.type).join(',\n')
      parts.push(`CREATE TABLE ${quoteIdent(safeTableName.value)} (\n${cols}\n);`)
    }
    parts.push(...buildInsertStatements(parsedRows.value.slice(0, PREVIEW_ROWS)))
    let body = parts.join('\n\n')
    if (wrapTransaction.value) {
      const begin = dialect.value === 'mysql' ? 'START TRANSACTION;' : 'BEGIN;'
      body = begin + '\n\n' + body + '\n\nCOMMIT;'
    }
    return body
  } catch (err) {
    return ''
  }
})

const previewNotice = computed(() => {
  if (!parsedRows.value.length) return ''
  if (parsedRows.value.length > PREVIEW_ROWS) {
    return `预览仅展示前 ${PREVIEW_ROWS} 行对应的语句，实际共 ${parsedRows.value.length} 行数据、${statementCount.value} 条 SQL 语句，复制或下载可获得完整内容。`
  }
  return ''
})

// ---------- 交互 ----------
const handleFileChange = async (e) => {
  const selected = e.target.files?.[0]
  if (selected) {
    inputFileName.value = selected.name
    inputText.value = await selected.text()
    if (!tableName.value) {
      tableName.value = selected.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '_')
    }
  }
  e.target.value = ''
}

const fillSample = () => {
  inputFileName.value = ''
  inputText.value = [
    'name,age,city,birthday,salary',
    '张三,28,北京,1996-05-12,12000.50',
    '李四,32,上海,1992-11-03,15800',
    "O'Brien,45,广州,1979-01-25,22000.75",
    '王五,,深圳,1990-07-08,',
    '赵六,24,杭州,2000-12-31,8900'
  ].join('\n')
  if (!tableName.value) tableName.value = 'employees'
}

const clearAll = () => {
  inputText.value = ''
  inputFileName.value = ''
  tableName.value = ''
  parseError.value = ''
}

const copyOutput = async () => {
  if (!fullSql.value) return
  try {
    await navigator.clipboard.writeText(fullSql.value)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = fullSql.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const downloadSql = () => {
  if (!fullSql.value) return
  const blob = new Blob([fullSql.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeTableName.value}.sql`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
