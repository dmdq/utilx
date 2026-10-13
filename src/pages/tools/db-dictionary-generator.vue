<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Database class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">数据字典生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴建表 DDL，自动解析表结构与注释，导出 Markdown / CSV / Word 交付文档</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴 CREATE TABLE 建表语句（多表分号分隔），自动解析表名与表注释、每列的字段名/类型/可空/默认值/列注释以及主键，一键生成数据字典：Markdown 表格、CSV（Excel 可直接打开）与带边框表格样式的 Word（.doc）文档。解析全部在浏览器本地完成，DDL 不上传服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileCode class="w-5 h-5 mr-2 text-primary" /> DDL 输入
          </h2>
          <textarea
            v-model="ddlText"
            class="w-full h-72 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="粘贴 CREATE TABLE 建表语句（多张表用分号分隔），例如：&#10;CREATE TABLE `users` (&#10;  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',&#10;  `name` VARCHAR(50) NOT NULL DEFAULT 'abc' COMMENT '用户名',&#10;  PRIMARY KEY (`id`)&#10;) ENGINE=InnoDB COMMENT='用户表';"
            spellcheck="false"
          ></textarea>

          <div class="flex gap-2 mt-4">
            <button
              @click="fillSample"
              class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
            >
              填入样例
            </button>
            <button
              @click="clearAll"
              class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 解析统计 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 解析结果
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ parsedTables.length }}</p>
              <p class="text-xs text-muted-foreground">数据表</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ totalColumns }}</p>
              <p class="text-xs text-muted-foreground">字段数</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-foreground">{{ totalPkColumns }}</p>
              <p class="text-xs text-muted-foreground">主键列</p>
            </div>
          </div>
          <p v-if="parseNotice" class="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle class="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
            {{ parseNotice }}
          </p>
        </div>

        <!-- 导出 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h3 class="text-sm font-semibold text-foreground flex items-center">
            <Download class="w-4 h-4 mr-2 text-primary" /> 导出数据字典
          </h3>
          <button
            @click="downloadMarkdown"
            :disabled="!parsedTables.length"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
          >
            <FileText class="w-4 h-4" /> 下载 Markdown（.md）
          </button>
          <button
            @click="downloadCsv"
            :disabled="!parsedTables.length"
            class="w-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
          >
            <FileSpreadsheet class="w-4 h-4" /> 下载 CSV / Excel（.csv）
          </button>
          <button
            @click="downloadWord"
            :disabled="!parsedTables.length"
            class="w-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
          >
            <FileType class="w-4 h-4" /> 下载 Word 文档（.doc）
          </button>
          <button
            @click="copyMarkdown"
            :disabled="!markdownOutput"
            class="w-full bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
          >
            <Copy class="w-4 h-4" /> 复制 Markdown 源码
          </button>
          <p class="text-xs text-muted-foreground">
            Word 版为 HTML 包裹的 .doc 文件，带边框表格样式，Word / WPS 打开后可直接另存为 .docx。
          </p>
        </div>
      </div>

      <!-- 右侧：预览 -->
      <div class="lg:col-span-2 space-y-6">
        <div v-if="!parsedTables.length" class="bg-card border border-border rounded-lg p-6">
          <div class="py-16 text-center">
            <Table class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">粘贴建表 DDL 后，这里会按表预览数据字典</p>
          </div>
        </div>

        <div
          v-for="table in parsedTables"
          :key="table.name"
          class="bg-card border border-border rounded-lg overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 class="text-base font-semibold text-foreground flex items-center gap-2">
              <Table class="w-4 h-4 text-primary" />
              <span class="font-mono">{{ table.name }}</span>
              <span v-if="table.comment" class="text-sm font-normal text-muted-foreground">（{{ table.comment }}）</span>
            </h3>
            <span class="text-xs text-muted-foreground">{{ table.columns.length }} 个字段</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted">
                <tr>
                  <th class="px-4 py-2.5 text-left font-medium text-foreground">字段</th>
                  <th class="px-4 py-2.5 text-left font-medium text-foreground">类型</th>
                  <th class="px-4 py-2.5 text-left font-medium text-foreground">允许空</th>
                  <th class="px-4 py-2.5 text-left font-medium text-foreground">默认值</th>
                  <th class="px-4 py-2.5 text-left font-medium text-foreground">注释</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="col in table.columns" :key="col.name" class="border-t border-border">
                  <td class="px-4 py-2 font-mono text-foreground whitespace-nowrap">
                    {{ col.name }}<span v-if="col.isPk" class="ml-1 text-yellow-600 dark:text-yellow-400" title="主键">🔑</span>
                  </td>
                  <td class="px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">{{ col.type }}</td>
                  <td class="px-4 py-2 text-muted-foreground">{{ col.nullable ? '是' : '否' }}</td>
                  <td class="px-4 py-2 font-mono text-muted-foreground">{{ col.default ?? '—' }}</td>
                  <td class="px-4 py-2 text-muted-foreground">{{ col.comment || '—' }}</td>
                </tr>
              </tbody>
            </table>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于数据字典生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            数据字典是交付文档里的「表结构说明书」：列出每张表的用途与每个字段的类型、是否可空、默认值和业务含义。手工从建表 DDL 抄写到 Word 费时且容易与库结构脱节，本工具直接解析 CREATE TABLE 语句生成字典，保证文档与 DDL 一致。
          </p>
          <h3 class="text-lg font-semibold text-foreground">支持哪些 DDL 语法</h3>
          <p>
            按 MySQL 风格的 CREATE TABLE 解析：兼容反引号与双引号标识符、多表分号分隔、表级与列级 COMMENT、PRIMARY KEY（列级与表级均识别）、DEFAULT（字符串/数字/NULL/CURRENT_TIMESTAMP）、NOT NULL 与 AUTO_INCREMENT 等。解析前会先剥离字符串字面量与注释，因此列注释里含逗号、括号、引号也能正确切分。
          </p>
          <h3 class="text-lg font-semibold text-foreground">三种导出格式怎么选</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>Markdown：进 Wiki、README、接口文档，代码仓库友好</li>
            <li>CSV：用 Excel / WPS 打开后按需美化，适合作为交付附件</li>
            <li>Word（.doc）：直接作为正式交付文档盖章归档，带边框表格样式</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">DDL 会上传吗？</span>不会。解析与导出全部在浏览器本地完成，适合含敏感字段结构的库表文档。</li>
            <li><span class="text-foreground font-medium">导出的 Word 打不开怎么办？</span>.doc 实为 HTML 包裹格式，Word/WPS 可正常打开；如提示格式不符，选择「用 Word 打开」或打开后另存为 .docx 即可。</li>
            <li><span class="text-foreground font-medium">不支持哪些语句？</span>目前只解析 CREATE TABLE，不解析 ALTER TABLE 增量改动；视图、存储过程会被忽略，可先只粘贴建表语句。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'db-dictionary-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Database, FileCode, FileText, FileSpreadsheet, FileType, Table,
  Copy, Download, Info, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '数据字典生成器 - DDL转Word/Excel/Markdown表结构文档',
  description: '在线数据字典生成器，粘贴 MySQL CREATE TABLE 建表 DDL 自动解析表名、表注释、字段类型/可空/默认值/列注释与主键，一键导出 Word(.doc)、CSV、Markdown 数据字典文档，纯本地解析',
  keywords: '数据字典生成, ddl转word, 表结构导出, 数据库文档工具, 字段注释导出, 建表语句转文档',
  author: 'Util工具箱',
  ogTitle: '数据字典生成器 - 有条工具',
  ogDescription: '粘贴建表 DDL 自动生成带字段注释的数据字典，导出 Word/Excel/Markdown',
  ogUrl: 'https://www.util.cn/tools/db-dictionary-generator',
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
          name: '数据字典生成器',
          url: 'https://www.util.cn/tools/db-dictionary-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['DDL解析表结构', '表注释与列注释提取', '主键识别', '导出Word/CSV/Markdown', '多表批量解析']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: '数据字典生成器', item: 'https://www.util.cn/tools/db-dictionary-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'DDL 数据会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。DDL 解析与三种格式导出全部在浏览器本地完成，适合含敏感字段结构的库表。' }
            },
            {
              '@type': 'Question',
              name: '导出的 Word 文档打不开怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '.doc 实为 HTML 包裹格式，用 Word 或 WPS 打开后另存为 .docx 即可。' }
            },
            {
              '@type': 'Question',
              name: '支持哪些建表语句语法？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 MySQL 风格 CREATE TABLE：反引号/双引号标识符、表级与列级 COMMENT、主键、DEFAULT、NOT NULL、多表分号分隔等。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'db-dictionary-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 纯函数区（node 可独立测试） ----------

// 单遍扫描：剥离注释（--、#、/* */），字符串/双引号/反引号字面量替换为占位符并记录原值
const maskSql = (sql) => {
  const literals = []
  let out = ''
  let i = 0
  const n = sql.length
  while (i < n) {
    const ch = sql[i]
    const next = i + 1 < n ? sql[i + 1] : ''
    // 行注释 -- 与 #
    if ((ch === '-' && next === '-') || ch === '#') {
      while (i < n && sql[i] !== '\n') i++
      continue
    }
    // 块注释
    if (ch === '/' && next === '*') {
      i += 2
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) i++
      i += 2
      out += ' '
      continue
    }
    // 单引号字符串（'' 或 \' 转义）
    if (ch === "'") {
      i++
      let val = ''
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") { val += "'"; i += 2; continue }
        if (sql[i] === '\\') { val += sql[i + 1] !== undefined ? sql[i + 1] : ''; i += 2; continue }
        if (sql[i] === "'") { i++; break }
        val += sql[i]
        i++
      }
      out += '\u0001' + literals.length + '\u0001'
      literals.push(val)
      continue
    }
    // 双引号标识符（"" 转义）
    if (ch === '"') {
      i++
      let val = ''
      while (i < n) {
        if (sql[i] === '"' && sql[i + 1] === '"') { val += '"'; i += 2; continue }
        if (sql[i] === '"') { i++; break }
        val += sql[i]
        i++
      }
      out += '\u0001' + literals.length + '\u0001'
      literals.push(val)
      continue
    }
    // 反引号标识符（`` 转义）
    if (ch === '`') {
      i++
      let val = ''
      while (i < n) {
        if (sql[i] === '`' && sql[i + 1] === '`') { val += '`'; i += 2; continue }
        if (sql[i] === '`') { i++; break }
        val += sql[i]
        i++
      }
      out += '\u0001' + literals.length + '\u0001'
      literals.push(val)
      continue
    }
    out += ch
    i++
  }
  return { masked: out, literals }
}

// 把占位符还原成带单引号的字符串字面量
const restoreText = (masked, literals) => {
  return masked.replace(/\u0001(\d+)\u0001/g, (m, idx) => {
    const raw = literals[Number(idx)] !== undefined ? literals[Number(idx)] : ''
    return "'" + raw.replace(/'/g, "''") + "'"
  })
}

// 读取一个标识符：占位符（反引号/双引号还原）或裸单词
const readIdentifier = (masked, literals, start) => {
  let i = start
  const n = masked.length
  while (i < n && /\s/.test(masked[i])) i++
  if (i >= n) return null
  if (masked[i] === '\u0001') {
    const close = masked.indexOf('\u0001', i + 1)
    if (close === -1) return null
    const idx = Number(masked.slice(i + 1, close))
    return { name: literals[idx] !== undefined ? literals[idx] : '', end: close + 1 }
  }
  const m = /^[A-Za-z_][\w$]*/.exec(masked.slice(i))
  if (!m) return null
  return { name: m[0], end: i + m[0].length }
}

// 读取裸关键字（大写）
const readWord = (masked, start) => {
  let i = start
  while (i < masked.length && /\s/.test(masked[i])) i++
  const m = /^[A-Za-z_][\w$]*/.exec(masked.slice(i))
  if (!m) return null
  return { word: m[0].toUpperCase(), end: i + m[0].length }
}

// 表级约束起始关键字（以该词开头则不是列定义）
const CONSTRAINT_KEYWORDS = ['PRIMARY', 'UNIQUE', 'KEY', 'INDEX', 'CONSTRAINT', 'FOREIGN', 'FULLTEXT', 'SPATIAL', 'CHECK']

// 列类型截断的约束关键字
const TYPE_STOP_RE = /\b(NOT|NULL|DEFAULT|COMMENT|PRIMARY|UNIQUE|AUTO_INCREMENT|REFERENCES|GENERATED|AS|CHECK|COLLATE|CHARACTER|ON|STORAGE)\b/i

// 解析建表 DDL，返回 { tables, error }
const parseDdl = (sql) => {
  const source = String(sql || '')
  if (!source.trim()) return { tables: [], error: '' }
  const { masked, literals } = maskSql(source)
  const tables = []
  const statements = masked.split(';')
  for (const stmtRaw of statements) {
    const stmt = stmtRaw.trim()
    if (!stmt) continue
    const createMatch = /^CREATE\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?/i.exec(stmt)
    if (!createMatch) continue
    let pos = createMatch[0].length

    // 表名（可含 schema. 前缀）
    const nameParts = []
    for (;;) {
      const ident = readIdentifier(stmt, literals, pos)
      if (!ident) break
      nameParts.push(ident.name)
      pos = ident.end
      let j = pos
      while (j < stmt.length && /\s/.test(stmt[j])) j++
      if (stmt[j] === '.') { pos = j + 1; continue }
      break
    }
    if (!nameParts.length) continue
    const tableName = nameParts[nameParts.length - 1]

    // 列定义区：第一个 ( 到配对的 )
    const openIdx = stmt.indexOf('(', pos)
    if (openIdx === -1) continue
    let depth = 0
    let closeIdx = -1
    for (let k = openIdx; k < stmt.length; k++) {
      if (stmt[k] === '(') depth++
      else if (stmt[k] === ')') {
        depth--
        if (depth === 0) { closeIdx = k; break }
      }
    }
    if (closeIdx === -1) continue
    const body = stmt.slice(openIdx + 1, closeIdx)
    const options = stmt.slice(closeIdx + 1)

    // 表注释
    let tableComment = ''
    const tblCmtMatch = /\bCOMMENT\b\s*=?\s*\u0001(\d+)\u0001/i.exec(options)
    if (tblCmtMatch) tableComment = literals[Number(tblCmtMatch[1])] !== undefined ? literals[Number(tblCmtMatch[1])] : ''

    // 按顶层逗号拆分列定义
    const defs = []
    let cur = ''
    depth = 0
    for (const ch of body) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (ch === ',' && depth === 0) { defs.push(cur); cur = '' }
      else cur += ch
    }
    if (cur.trim()) defs.push(cur)

    const columns = []
    const constraintPk = []
    for (const def of defs) {
      const d = def.trim()
      if (!d) continue
      const firstWord = readWord(d, 0)
      const first = firstWord ? firstWord.word : ''
      if (CONSTRAINT_KEYWORDS.indexOf(first) !== -1) {
        // 表级 PRIMARY KEY (a, b)
        const pkMatch = /\bPRIMARY\s+KEY\s*\(([^)]*)\)/i.exec(d)
        if (pkMatch) {
          const names = pkMatch[1].split(',')
          for (const piece of names) {
            const ident = readIdentifier(piece, literals, 0)
            if (ident && ident.name) constraintPk.push(ident.name)
          }
        }
        continue
      }
      // 列定义
      const colName = readIdentifier(d, literals, 0)
      if (!colName || !colName.name) continue
      const afterName = colName.end

      // 类型：截断到第一个约束关键字
      const tail = d.slice(afterName)
      const kwMatch = TYPE_STOP_RE.exec(tail)
      const typeSrc = kwMatch ? tail.slice(0, kwMatch.index) : tail
      const type = restoreText(typeSrc.trim(), literals) || '—'
      const flags = kwMatch ? tail.slice(kwMatch.index) : ''

      const nullable = !/\bNOT\s+NULL\b/i.test(flags)

      // 默认值
      let defaultVal = null
      const defMatch = /\bDEFAULT\b\s*=?\s*(\u0001(\d+)\u0001|NULL|CURRENT_TIMESTAMP(?:\s*\(\s*\d*\s*\))?|[A-Za-z_][\w.+-]*|-?\d+(?:\.\d+)?|\([^)]*\))/i.exec(flags)
      if (defMatch) {
        if (defMatch[2] !== undefined) {
          const raw = literals[Number(defMatch[2])] !== undefined ? literals[Number(defMatch[2])] : ''
          defaultVal = "'" + raw.replace(/'/g, "''") + "'"
        } else if (defMatch[1].toUpperCase() === 'NULL') {
          defaultVal = 'NULL'
        } else {
          defaultVal = restoreText(defMatch[1], literals)
        }
      }

      // 列注释
      let comment = ''
      const cmtMatch = /\bCOMMENT\b\s*=?\s*\u0001(\d+)\u0001/i.exec(flags)
      if (cmtMatch) comment = literals[Number(cmtMatch[1])] !== undefined ? literals[Number(cmtMatch[1])] : ''

      const isPk = /\bPRIMARY\s+KEY\b/i.test(flags)

      columns.push({ name: colName.name, type, nullable, default: defaultVal, comment, isPk })
    }

    // 表级主键标记
    if (constraintPk.length) {
      const lowerSet = constraintPk.map(s => s.toLowerCase())
      for (const col of columns) {
        if (lowerSet.indexOf(col.name.toLowerCase()) !== -1) col.isPk = true
      }
    }

    if (columns.length) tables.push({ name: tableName, comment: tableComment, columns })
  }
  return { tables, error: tables.length ? '' : '未解析到有效的 CREATE TABLE 语句，请检查 DDL 是否完整' }
}

// Markdown 输出
const buildMarkdown = (tables) => {
  const lines = ['# 数据字典', '']
  for (const table of tables) {
    lines.push('## ' + table.name + (table.comment ? '（' + table.comment + '）' : ''), '')
    lines.push('| 字段 | 类型 | 允许空 | 默认值 | 注释 |')
    lines.push('| --- | --- | --- | --- | --- |')
    for (const col of table.columns) {
      const cell = (v) => String(v === null || v === undefined ? '' : v).replace(/\|/g, '\\|').replace(/\n/g, ' ')
      lines.push('| ' + (col.isPk ? col.name + ' 🔑' : col.name) + ' | ' + cell(col.type) + ' | ' + (col.nullable ? '是' : '否') + ' | ' + cell(col.default === null ? '—' : col.default) + ' | ' + cell(col.comment) + ' |')
    }
    lines.push('')
  }
  return lines.join('\n')
}

// CSV 转义：含逗号/引号/换行时包裹双引号
const csvEscape = (v) => {
  const s = String(v === null || v === undefined ? '' : v)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

// CSV 输出
const buildCsv = (tables) => {
  const rows = [['表名', '字段', '类型', '允许空', '默认值', '注释'].join(',')]
  for (const table of tables) {
    for (const col of table.columns) {
      rows.push([csvEscape(table.name), csvEscape(col.name), csvEscape(col.type), col.nullable ? '是' : '否', csvEscape(col.default === null ? '' : col.default), csvEscape(col.comment)].join(','))
    }
  }
  return rows.join('\r\n')
}

// Word（HTML 包 application/msword）输出
const escapeHtml = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const buildWordHtml = (tables) => {
  const sections = tables.map(table => {
    const rows = table.columns.map(col =>
      '<tr>' +
      '<td>' + escapeHtml(col.name) + (col.isPk ? '（主键）' : '') + '</td>' +
      '<td>' + escapeHtml(col.type) + '</td>' +
      '<td>' + (col.nullable ? '是' : '否') + '</td>' +
      '<td>' + escapeHtml(col.default === null ? '—' : col.default) + '</td>' +
      '<td>' + escapeHtml(col.comment) + '</td>' +
      '</tr>'
    ).join('')
    return '<h2 style="font-size:14pt;font-family:\'Microsoft YaHei\',SimSun">' + escapeHtml(table.name) +
      (table.comment ? '（' + escapeHtml(table.comment) + '）' : '') + '</h2>' +
      '<table style="border-collapse:collapse;width:100%;font-family:\'Microsoft YaHei\',SimSun;font-size:10.5pt">' +
      '<tr>' +
      '<th style="border:1px solid #444;background:#f2f2f2;padding:4px 8px">字段</th>' +
      '<th style="border:1px solid #444;background:#f2f2f2;padding:4px 8px">类型</th>' +
      '<th style="border:1px solid #444;background:#f2f2f2;padding:4px 8px">允许空</th>' +
      '<th style="border:1px solid #444;background:#f2f2f2;padding:4px 8px">默认值</th>' +
      '<th style="border:1px solid #444;background:#f2f2f2;padding:4px 8px">注释</th>' +
      '</tr>' + rows + '</table><br/>'
  }).join('')
  return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head><meta charset="utf-8"><title>数据字典</title>' +
    '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->' +
    '</head><body style="font-family:\'Microsoft YaHei\',SimSun">' +
    '<h1 style="font-size:18pt;font-family:\'Microsoft YaHei\',SimSun">数据字典</h1>' + sections +
    '</body></html>'
}

// ---------- 状态 ----------
const ddlText = ref('')
const seoContentVisible = ref(true)

const parsedTables = computed(() => parseDdl(ddlText.value).tables)
const parseNotice = computed(() => {
  if (!ddlText.value.trim()) return ''
  return parseDdl(ddlText.value).error
})
const totalColumns = computed(() => parsedTables.value.reduce((sum, t) => sum + t.columns.length, 0))
const totalPkColumns = computed(() => parsedTables.value.reduce((sum, t) => sum + t.columns.filter(c => c.isPk).length, 0))

const markdownOutput = computed(() => parsedTables.value.length ? buildMarkdown(parsedTables.value) : '')

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const fillSample = () => {
  ddlText.value = [
    'CREATE TABLE `users` (',
    "  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID，主键',",
    "  `name` VARCHAR(50) NOT NULL DEFAULT 'abc' COMMENT '用户名, 含,逗号和''单引号''和括号(示例)',",
    "  `age` INT NULL DEFAULT NULL COMMENT '年龄',",
    '  `score` DECIMAL(10,2) NOT NULL DEFAULT 0,',
    '  PRIMARY KEY (`id`)',
    ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';",
    '',
    'CREATE TABLE orders (',
    "  id INT NOT NULL PRIMARY KEY COMMENT '订单ID',",
    "  user_id BIGINT NOT NULL COMMENT '下单用户',",
    "  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '订单金额（元）',",
    "  status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending/paid/done'",
    ") COMMENT='订单表';"
  ].join('\n')
}

const clearAll = () => {
  ddlText.value = ''
}

const triggerDownload = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadMarkdown = () => {
  if (!markdownOutput.value) return
  triggerDownload('\ufeff' + markdownOutput.value, '数据字典.md', 'text/markdown;charset=utf-8')
}

const downloadCsv = () => {
  if (!parsedTables.value.length) return
  triggerDownload('\ufeff' + buildCsv(parsedTables.value), '数据字典.csv', 'text/csv;charset=utf-8')
}

const downloadWord = () => {
  if (!parsedTables.value.length) return
  triggerDownload('\ufeff' + buildWordHtml(parsedTables.value), '数据字典.doc', 'application/msword')
}

const copyMarkdown = async () => {
  if (!markdownOutput.value) return
  try {
    await navigator.clipboard.writeText(markdownOutput.value)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = markdownOutput.value
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
