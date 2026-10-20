<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <GitBranch class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">DDL 转 ER 图</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 CREATE TABLE 建表语句，自动解析表与外键，绘制可导出的数据库关系图</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        拿到一堆建表语句想看表关系，开数据库设计器太重。本工具在浏览器内解析 MySQL / PostgreSQL 风格的 <code class="px-1 bg-muted rounded text-sm">CREATE TABLE</code> DDL：识别表、列、主键与 <code class="px-1 bg-muted rounded text-sm">FOREIGN KEY ... REFERENCES</code> 外键关系，自绘 SVG 关系图（表框 + 1:N 连线，可横向滚动），支持导出 PNG 与复制 mermaid <code class="px-1 bg-muted rounded text-sm">erDiagram</code> 文本。全程本地解析，DDL 不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：DDL 输入 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <FileCode2 class="w-4 h-4 text-primary" /> 粘贴 DDL
          </h3>
          <textarea
            v-model="ddlText"
            rows="18"
            spellcheck="false"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
            placeholder="CREATE TABLE users (...)&#10;CREATE TABLE orders (...)"
          ></textarea>
          <div class="flex flex-wrap gap-2">
            <button
              @click="loadSample"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Wand2 class="w-3.5 h-3.5" /> 载入示例
            </button>
            <button
              @click="ddlText = ''"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Eraser class="w-3.5 h-3.5" /> 清空
            </button>
          </div>

          <div
            v-if="parseResult.errors.length"
            class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
          >
            <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <ul class="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li v-for="(e, i) in parseResult.errors" :key="i">{{ e }}</li>
            </ul>
          </div>

          <div class="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span class="flex items-center gap-1"><Table2 class="w-3.5 h-3.5 text-primary" /> {{ parseResult.tables.length }} 张表</span>
            <span class="flex items-center gap-1"><GitBranch class="w-3.5 h-3.5 text-primary" /> {{ parseResult.edges.length }} 条外键</span>
          </div>
        </div>

        <!-- mermaid 导出 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-foreground flex items-center gap-2 text-sm">
              <Braces class="w-4 h-4 text-primary" /> mermaid erDiagram 文本
            </h3>
            <button
              @click="copyText(mermaidText, 'mermaid')"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Check v-if="copiedKey === 'mermaid'" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === 'mermaid' ? '已复制' : '复制' }}
            </button>
          </div>
          <pre class="overflow-auto p-3 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed max-h-52 text-foreground">{{ mermaidText }}</pre>
          <p class="text-xs text-muted-foreground leading-relaxed">粘贴到 GitHub README、mermaid.live 或任意支持 mermaid 的笔记软件即可渲染。</p>
        </div>
      </div>

      <!-- 右侧：SVG 图 -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h3 class="font-semibold text-foreground flex items-center gap-2">
              <ImageIcon class="w-4 h-4 text-primary" /> ER 关系图（自绘 SVG）
            </h3>
            <button
              @click="exportPng"
              :disabled="!parseResult.tables.length"
              :class="parseResult.tables.length ? 'hover:bg-muted/80' : 'opacity-40 cursor-not-allowed'"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs text-foreground transition-colors"
            >
              <Download class="w-3.5 h-3.5" /> 导出 PNG
            </button>
          </div>

          <div class="overflow-auto border border-border rounded-lg bg-white" style="max-height: 640px">
            <svg
              v-if="parseResult.tables.length"
              ref="svgEl"
              :width="layout.width"
              :height="layout.height"
              :viewBox="`0 0 ${layout.width} ${layout.height}`"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="0" y="0" :width="layout.width" :height="layout.height" fill="#f8fafc" />
              <!-- 外键连线 -->
              <g v-for="(e, i) in edgePaths" :key="`edge-${i}`">
                <path :d="e.d" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="none" />
                <text :x="e.x1" :y="e.y1 - 5" font-size="10" fill="#0ea5e9" font-family="ui-monospace, monospace">1</text>
                <text :x="e.x0 - 12" :y="e.y0 - 5" font-size="10" fill="#f97316" font-family="ui-monospace, monospace">N</text>
                <text :x="e.mx" :y="e.my" font-size="10" fill="#475569" text-anchor="middle" font-family="ui-monospace, monospace">{{ e.label }}</text>
              </g>
              <!-- 表框 -->
              <g v-for="n in layout.nodes" :key="n.name">
                <rect :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" />
                <rect :x="n.x" :y="n.y" :width="n.w" :height="TITLE_H" rx="6" fill="#334155" />
                <rect :x="n.x" :y="n.y + TITLE_H - 6" :width="n.w" height="6" fill="#334155" />
                <text :x="n.x + 10" :y="n.y + 20" font-size="13" font-weight="600" fill="#ffffff" font-family="ui-monospace, monospace">{{ n.name }}</text>
                <g v-for="(c, ci) in n.columns" :key="`${n.name}-${ci}`">
                  <line
                    :x1="n.x" :y1="n.y + TITLE_H + (ci + 1) * ROW_H"
                    :x2="n.x + n.w" :y2="n.y + TITLE_H + (ci + 1) * ROW_H"
                    stroke="#e2e8f0" stroke-width="1"
                  />
                  <text
                    :x="n.x + 10" :y="n.y + TITLE_H + ci * ROW_H + 15"
                    font-size="11" :fill="c.pk ? '#0284c7' : c.fk ? '#c2410c' : '#334155'"
                    font-family="ui-monospace, monospace"
                  >{{ c.pk ? 'PK ' : c.fk ? 'FK ' : '   ' }}{{ c.name }} <tspan fill="#94a3b8">{{ c.type }}</tspan></text>
                </g>
              </g>
            </svg>
            <div
              v-else
              class="flex items-center justify-center h-64 text-muted-foreground text-sm"
            >
              粘贴包含 CREATE TABLE 的 DDL 后，这里会实时绘制关系图
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            图例：蓝 PK 主键列，橙 FK 外键列；连线 N 端为子表（外键所在表），1 端为父表。区域过大时可横向滚动，导出 PNG 为完整画布。
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 DDL 转 ER 图</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            ER 图（实体关系图）把数据库表画成带列清单的方框，用连线表示外键形成的一对多关系。比起打开重量级数据库设计器，直接解析建表语句是评审 schema、写文档、交接项目时更快的方式。本工具在浏览器里完成解析与绘图：先剥离字符串字面量避免 DEFAULT 'a,b(c)' 之类内容干扰括号配对，再按顶层逗号切分每个列定义与约束。
          </p>

          <h3 class="text-lg font-semibold text-foreground">支持哪些 DDL 写法</h3>
          <p>
            表级约束 <code class="px-1 bg-muted rounded">FOREIGN KEY (col) REFERENCES other(col)</code>、带 <code class="px-1 bg-muted rounded">CONSTRAINT 名字</code> 前缀的外键、列内联写法 <code class="px-1 bg-muted rounded">col INT REFERENCES other(id)</code> 都能识别；表级与列级 <code class="px-1 bg-muted rounded">PRIMARY KEY</code> 均会标注。反引号、双引号、schema 前缀（db.table）自动清理。注意：外键指向的父表必须也在同一段 DDL 里出现，否则连线会被跳过并提示。
          </p>

          <h3 class="text-lg font-semibold text-foreground">关系连线怎么读</h3>
          <p>
            本工具采用简化记法：连线从子表（持有外键的表，N 端）连向父表（被引用的表，1 端），线上标注「子列 → 父列」。标准 crow foot 鸦爪符号中，父端是「一」、子端是「多」，等价于数据库外键约束本身表达的基数——一个用户可以有多条订单，但订单上的 user_id 只能指向一个用户。多对多中间表会呈现为指向两张父表的两条 1:N 连线。
          </p>

          <h3 class="text-lg font-semibold text-foreground">mermaid 文本怎么用</h3>
          <p>
            mermaid 的 <code class="px-1 bg-muted rounded">erDiagram</code> 是 GitHub、GitLab、Notion、Obsidian 等都认识的图表语法。本工具把解析结果同步导出成 <code class="px-1 bg-muted rounded">users ||--o{ orders : "user_id"</code> 形式的关系行与列定义块，复制进 Markdown 代码块即可随文档渲染，免去截图维护问题；图需要改动时重新粘贴 DDL 生成即可。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">DDL 里有存储过程或 INSERT 会报错吗？</span>不会崩溃，解析器只扫描 CREATE TABLE 块，其余语句直接忽略；括号不配对等结构问题会在提示区列明。</li>
            <li><span class="text-foreground font-medium">导出 PNG 模糊？</span>导出按 2 倍分辨率绘制画布，正常缩放足够清晰；表数量很多时建议改用 mermaid 文本在目标平台矢量渲染。</li>
            <li><span class="text-foreground font-medium">线上数据库的真实关系图不全？</span>很多项目（尤其早期 MySQL MyISAM 时代）没有物理外键，只在应用层维护关系，这类 DDL 解析出的边会偏少，可先补全 FOREIGN KEY 定义再粘贴。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ddl-to-er-diagram'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  GitBranch, FileCode2, Braces, Copy, Check, Download,
  Wand2, Eraser, AlertTriangle, Table2,
  Image as ImageIcon, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'DDL 转 ER 图 - 建表语句生成数据库关系图 导出 PNG | 有条工具',
  description: '在线 DDL 转 ER 图：粘贴 CREATE TABLE 建表语句，自动解析表、列、主键与外键 REFERENCES 关系，浏览器内自绘 SVG 表框与 1:N 连线，支持导出 PNG 与复制 mermaid erDiagram 文本，纯本地解析不上传',
  keywords: 'ddl转er图, 建表语句画图, 数据库关系图, erDiagram, mermaid er图, 外键关系图, mysql表结构可视化',
  author: '有条工具',
  ogTitle: 'DDL 转 ER 图 - 有条工具',
  ogDescription: '粘贴建表语句自动生成数据库 ER 图，导出 PNG 与 mermaid 文本',
  ogUrl: 'https://www.util.cn/tools/ddl-to-er-diagram',
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
          name: 'DDL 转 ER 图',
          url: 'https://www.util.cn/tools/ddl-to-er-diagram',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['CREATE TABLE 多表解析', '外键 REFERENCES 识别', 'SVG 自绘关系图', '1:N 连线标注', 'PNG 导出', 'mermaid erDiagram 文本导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'DDL 转 ER 图', item: 'https://www.util.cn/tools/ddl-to-er-diagram/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '哪些外键写法能被识别？',
              acceptedAnswer: { '@type': 'Answer', text: '支持表级 FOREIGN KEY (col) REFERENCES 父表(列)、带 CONSTRAINT 名字前缀、以及列内联 col INT REFERENCES 父表(列) 三种写法，父表需在同一段 DDL 中定义。' }
            },
            {
              '@type': 'Question',
              name: '粘贴的 DDL 会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析与绘图全部在浏览器本地完成，页面不发出任何网络请求，刷新即清空。' }
            },
            {
              '@type': 'Question',
              name: '为什么有些表之间没有连线？',
              acceptedAnswer: { '@type': 'Answer', text: '连线只来自 FOREIGN KEY 定义；若项目未声明物理外键（仅在应用层维护关系），则需先补全外键定义再生成。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ddl-to-er-diagram')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] DDL 解析与布局纯函数（可独立提取测试） =====
// 剥离单引号字符串字面量（含 '' 转义与反斜杠转义），避免内容干扰括号配对
function stripSqlStrings(sql) {
  let out = ''
  let i = 0
  const s = String(sql || '')
  while (i < s.length) {
    const ch = s[i]
    if (ch === "'") {
      i += 1
      while (i < s.length) {
        if (s[i] === '\\' && i + 1 < s.length) { i += 2; continue }
        if (s[i] === "'") {
          if (s[i + 1] === "'") { i += 2; continue }
          i += 1
          break
        }
        i += 1
      }
      out += "''"
      continue
    }
    if (ch === '-' && s[i + 1] === '-') {
      while (i < s.length && s[i] !== '\n') i += 1
      continue
    }
    out += ch
    i += 1
  }
  return out
}

// 从 openIdx（指向 '('）起找到配对 ')' 的下标，找不到返回 -1
function matchBalancedParen(str, openIdx) {
  let depth = 0
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '(') depth += 1
    else if (str[i] === ')') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

// 按顶层逗号切分（忽略括号内的逗号）
function splitTopLevel(body) {
  const parts = []
  let depth = 0
  let cur = ''
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; continue }
    cur += ch
  }
  if (cur.trim()) parts.push(cur)
  return parts
}

// 清洗标识符：去反引号/双引号/方括号，去 schema 前缀
function cleanIdent(name) {
  return String(name || '').replace(/[`"\[\]]/g, '').trim().split('.').pop()
}

// 解析 DDL → { tables: [{name, columns:[{name,type,pk,fk}]}], edges:[{fromTable,fromCol,toTable,toCol}], errors:[] }
function parseDdl(sql) {
  const tables = []
  const edges = []
  const errors = []
  const clean = stripSqlStrings(sql)
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"\[]?[\w$.]+[`"\]]?)\s*\(/gi
  let m
  while ((m = re.exec(clean)) !== null) {
    const name = cleanIdent(m[1])
    const openIdx = re.lastIndex - 1
    const closeIdx = matchBalancedParen(clean, openIdx)
    if (closeIdx === -1) {
      errors.push(`表「${name}」的括号未闭合，该表已跳过`)
      continue
    }
    const body = clean.slice(openIdx + 1, closeIdx)
    const table = { name, columns: [] }
    const colNames = new Set()

    for (const raw of splitTopLevel(body)) {
      const part = raw.replace(/\s+/g, ' ').trim()
      if (!part) continue

      // 表级外键
      const fk = part.match(
        /^(?:CONSTRAINT\s+[`"\[]?[\w$.]+[`"\]]?\s+)?FOREIGN\s+KEY\s*\(\s*([^)]+?)\s*\)\s*REFERENCES\s+([`"\[]?[\w$.]+[`"\]]?)\s*\(\s*([^)]+?)\s*\)/i
      )
      if (fk) {
        const col = cleanIdent(fk[1].split(',')[0])
        edges.push({
          fromTable: name, fromCol: col,
          toTable: cleanIdent(fk[2]), toCol: cleanIdent(fk[3].split(',')[0])
        })
        const target = table.columns.find(c => c.name === col)
        if (target) target.fk = true
        continue
      }
      // 表级主键 / 唯一 / 索引等约束：跳过但标注主键
      const pk = part.match(/^PRIMARY\s+KEY\s*\(\s*([^)]+?)\s*\)/i)
      if (pk) {
        pk[1].split(',').forEach(cn => {
          const c = table.columns.find(x => x.name === cleanIdent(cn))
          if (c) c.pk = true
        })
        continue
      }
      if (/^(UNIQUE|KEY|INDEX|CHECK|CONSTRAINT)\b/i.test(part)) continue

      // 列定义
      const col = part.match(/^([`"\[]?)([A-Za-z_]\w*)\1?\s+([A-Za-z][\w$]*(?:\s*\([\d,\s]+\))?[^\s,]*)/)
      if (!col) continue
      const cname = col[2]
      const column = { name: cname, type: col[3].toUpperCase(), pk: false, fk: false }
      if (/\bPRIMARY\s+KEY\b/i.test(part)) column.pk = true
      if (/\bREFERENCES\s+[`"\[]?[\w$.]+[`"\]]?\s*\(/i.test(part)) {
        column.fk = true
        const ref = part.match(/\bREFERENCES\s+([`"\[]?[\w$.]+[`"\]]?)\s*\(\s*([^)]+?)\s*\)/i)
        if (ref) {
          edges.push({
            fromTable: name, fromCol: cname,
            toTable: cleanIdent(ref[1]), toCol: cleanIdent(ref[2])
          })
        }
      }
      table.columns.push(column)
      colNames.add(cname)
    }

    if (!table.columns.length) errors.push(`表「${name}」没有解析到列定义`)
    tables.push(table)
  }

  if (!tables.length && String(clean).trim() && !/CREATE\s+TABLE/i.test(String(clean))) {
    errors.push('未找到 CREATE TABLE 语句')
  }

  // 校验外键指向的父表存在
  const validEdges = []
  for (const e of edges) {
    const parent = tables.find(t => t.name === e.toTable)
    if (!parent) {
      errors.push(`外键 ${e.fromTable}.${e.fromCol} 引用的表「${e.toTable}」不在本段 DDL 中，连线已跳过`)
      continue
    }
    validEdges.push(e)
  }

  return { tables, edges: validEdges, errors }
}

// 网格布局：列数自适应，返回节点坐标与画布尺寸
const BOX_W = 230
const TITLE_H = 30
const ROW_H = 22
const GAP_X = 90
const GAP_Y = 56
function layoutTables(tables) {
  const n = tables.length
  const perRow = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(n))))
  const nodes = tables.map((t, i) => {
    const r = Math.floor(i / perRow)
    const c = i % perRow
    const cols = t.columns.length ? t.columns : [{ name: '-', type: '' }]
    return {
      name: t.name,
      columns: cols,
      x: 24 + c * (BOX_W + GAP_X),
      y: 24 + r * (TITLE_H + cols.length * ROW_H + 8 + GAP_Y),
      w: BOX_W,
      h: TITLE_H + cols.length * ROW_H + 8
    }
  })
  const lastRow = nodes.length ? nodes[nodes.length - 1] : { x: 24, y: 24, w: BOX_W, h: TITLE_H }
  return {
    nodes,
    width: lastRow.x + lastRow.w + 24,
    height: lastRow.y + lastRow.h + 24
  }
}

// 生成 mermaid erDiagram 文本
function genMermaid(result) {
  const lines = ['erDiagram']
  for (const t of result.tables) {
    lines.push(`    ${t.name} {`)
    for (const c of t.columns) {
      const type = String(c.type || 'varchar').replace(/[^\w$]/g, '_')
      const key = c.pk ? ' PK' : c.fk ? ' FK' : ''
      lines.push(`        ${type} ${c.name}${key}`)
    }
    lines.push('    }')
  }
  for (const e of result.edges) {
    lines.push(`    ${e.toTable} ||--o{ ${e.fromTable} : "${e.fromCol}"`)
  }
  return lines.join('\n') + '\n'
}

// 计算连线贝塞尔路径与标注位置（纯几何，不依赖 DOM）
function buildEdgePaths(nodes, edges) {
  const byName = {}
  for (const nd of nodes) byName[nd.name] = nd
  return edges.map(e => {
    const a = byName[e.fromTable]
    const b = byName[e.toTable]
    if (!a || !b) return null
    // 子表(N)接右侧或左侧中点，父表(1)接对侧
    const forward = b.x > a.x
    const x0 = forward ? a.x + a.w : a.x
    const x1 = forward ? b.x : b.x + b.w
    const y0 = a.y + Math.min(a.h / 2, a.h - 12)
    const y1 = b.y + Math.min(b.h / 2, b.h - 12)
    const dx = Math.max(40, Math.abs(x1 - x0) / 2)
    const d = `M ${x0} ${y0} C ${x0 + (forward ? dx : -dx)} ${y0}, ${x1 + (forward ? -dx : dx)} ${y1}, ${x1} ${y1}`
    return {
      d, x0, y0, x1, y1,
      mx: (x0 + x1) / 2, my: (y0 + y1) / 2 - 6,
      label: `${e.fromCol}→${e.toCol}`
    }
  }).filter(Boolean)
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const SAMPLE_DDL = `CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  email VARCHAR(128) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username)
);

CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE order_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL REFERENCES products (id),
  quantity INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders (id)
);`

const ddlText = ref(SAMPLE_DDL)
const copiedKey = ref('')
const seoContentVisible = ref(true)
const svgEl = ref(null)

const parseResult = computed(() => parseDdl(ddlText.value))
const layout = computed(() => layoutTables(parseResult.value.tables))
const edgePaths = computed(() => buildEdgePaths(layout.value.nodes, parseResult.value.edges))
const mermaidText = computed(() => genMermaid(parseResult.value))

const loadSample = () => { ddlText.value = SAMPLE_DDL }

let copyTimer = null
const copyText = async (text, key) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

// SVG → canvas → PNG 下载（回调内使用浏览器 API）
const exportPng = () => {
  const node = svgEl.value
  if (!node) return
  try {
    const clone = node.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const data = new XMLSerializer().serializeToString(clone)
    const url = URL.createObjectURL(new Blob([data], { type: 'image/svg+xml;charset=utf-8' }))
    const img = new window.Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = layout.value.width * scale
      canvas.height = layout.value.height * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = 'er-diagram.png'
      a.click()
    }
    img.onerror = () => { URL.revokeObjectURL(url) }
    img.src = url
  } catch (e) {
    // 导出失败时静默，不打断页面
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
