<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Table class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Excel两表免公式合并</h1>
          <p class="text-sm text-muted-foreground mt-1">选关键列即完成两表匹配合并（左/内连接），不会 VLOOKUP 也能对表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        上传两个 xlsx 或 csv 文件，各自选好关键列（如"姓名""订单号"），选择左连接（保留表1全部行）或内连接（只保留匹配行），即可把表2的列按关键列匹配合并进表1，列名冲突自动加"_表2"后缀。合并统计、前 10 行预览与 xlsx 导出全部在浏览器本地完成，文件不上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 表1 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FileSpreadsheet class="w-5 h-5 mr-2 text-primary" /> 表1（主表，保留全部行的基准）
        </h2>
        <label class="block border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:bg-muted/50 transition">
          <Upload class="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">{{ table1 ? table1.fileName : '点击选择 xlsx / csv 文件' }}</span>
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFile1" />
        </label>
        <div v-if="table1">
          <label class="block text-sm font-medium text-foreground mb-2">关键列（表1）</label>
          <select v-model.number="key1" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option v-for="(h, i) in table1.headers" :key="i" :value="i">{{ h }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5">共 {{ table1.totalRows }} 行数据，{{ table1.headers.length }} 列</p>
        </div>
      </div>

      <!-- 表2 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <FileSpreadsheet class="w-5 h-5 mr-2 text-primary" /> 表2（被并入的查找表）
        </h2>
        <label class="block border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:bg-muted/50 transition">
          <Upload class="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">{{ table2 ? table2.fileName : '点击选择 xlsx / csv 文件' }}</span>
          <input type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFile2" />
        </label>
        <div v-if="table2">
          <label class="block text-sm font-medium text-foreground mb-2">关键列（表2）</label>
          <select v-model.number="key2" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option v-for="(h, i) in table2.headers" :key="i" :value="i">{{ h }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5">共 {{ table2.totalRows }} 行数据，{{ table2.headers.length }} 列</p>
        </div>
      </div>
    </div>

    <!-- 合并设置 + 统计 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">连接方式</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="joinMode = 'left'"
              :class="joinMode === 'left' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >左连接（保留表1全部）</button>
            <button
              @click="joinMode = 'inner'"
              :class="joinMode === 'inner' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >内连接（仅匹配行）</button>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="keepSingleKey" type="checkbox" id="keepKeyChk" class="w-4 h-4 rounded border-border" />
          <label for="keepKeyChk" class="text-sm text-foreground">关键列只保留一份</label>
        </div>
        <button
          @click="exportXlsx"
          :disabled="!result || result.rows.length === 0"
          class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download class="w-4 h-4" /> 导出合并结果 xlsx
        </button>
      </div>

      <!-- 合并统计 -->
      <div v-if="result" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <div class="bg-muted/50 rounded-lg p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">表1数据行数</p>
          <p class="text-lg font-bold text-foreground">{{ result.total1 }}</p>
        </div>
        <div class="bg-primary/10 rounded-lg p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">匹配数（表1命中）</p>
          <p class="text-lg font-bold text-primary">{{ result.matched }}</p>
        </div>
        <div class="bg-muted/50 rounded-lg p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">未匹配数</p>
          <p class="text-lg font-bold text-foreground">{{ result.unmatched }}</p>
        </div>
        <div class="bg-muted/50 rounded-lg p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">输出列数</p>
          <p class="text-lg font-bold text-foreground">{{ result.outCols }}</p>
        </div>
      </div>
      <p v-if="result && result.unmatched > 0 && joinMode === 'left'" class="text-xs text-muted-foreground mt-3">
        有 {{ result.unmatched }} 行在表2中找不到匹配，这些行的表2列已填入空白。
      </p>
    </div>

    <!-- 预览 -->
    <div v-if="result" class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <Eye class="w-5 h-5 mr-2 text-primary" /> 合并预览（前 {{ Math.min(10, result.rows.length) }} 行，共 {{ result.rows.length }} 行）
      </h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted-foreground border-b border-border">
              <th v-for="(h, i) in result.headers" :key="i" class="py-2 pr-4 font-medium whitespace-nowrap">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, r) in result.rows.slice(0, 10)" :key="r" class="border-b border-border/50">
              <td v-for="(cell, c) in row" :key="c" class="py-2 pr-4 text-foreground whitespace-nowrap">{{ cell === '' ? '—' : cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        说明：关键列按"去除首尾空格后的文本"匹配，数字与文本型数字视为相同；表2同一关键列有多行时全部并入（一对多）。文件只在浏览器内存中解析，不会上传服务器。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于两表免公式合并</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            把两张表按某一列（如姓名、工号、订单号）匹配起来，Excel 里通常要写 VLOOKUP 或 XLOOKUP，还要处理 #N/A、列号错位、下拉填充等问题。本工具把这些步骤简化成"上传、选列、点合并"三步，数据全程留在浏览器本地，适合工资条核对、订单对账、名单补充联系方式等场景。
          </p>
          <h3 class="text-lg font-semibold text-foreground">左连接和内连接有什么区别</h3>
          <p>
            左连接保留表1的全部行：在表2中匹配不到的行，表2的列填空白，适合"以主表为准补全信息"；内连接只保留两边都匹配上的行，适合"只看能对上的数据"。表2同一关键列存在多行时（如一人多个订单），所有匹配行都会逐行并入。
          </p>
          <h3 class="text-lg font-semibold text-foreground">列名冲突与关键列处理</h3>
          <p>
            表2与表1出现同名列时，表2的列自动加"_表2"后缀，避免覆盖；勾选"关键列只保留一份"后，合并结果仅保留表1的关键列，表2的关键列不再重复输出，结果更干净。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些文件格式？</span>支持 .xlsx / .xls / .csv，默认读取每个文件的第一个工作表，第一行必须是表头。</li>
            <li><span class="text-foreground font-medium">匹配不上一般是什么原因？</span>常见原因是关键列一边是数字一边是文本、或含首尾空格；本工具已自动去除空格并按文本比较，仍不匹配时请检查两边的写法（如全角/半角）。</li>
            <li><span class="text-foreground font-medium">数据会泄露吗？</span>不会，解析与合并都在浏览器内存中完成，没有任何网络请求。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'excel-table-merge'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Table, FileSpreadsheet, Upload, Download, Eye, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Excel两表免公式合并 - 选关键列即完成 VLOOKUP 式匹配',
  description: '上传两个 xlsx/csv，各自选关键列后按左连接或内连接匹配合并，列名冲突自动加后缀，支持统计、预览与 xlsx 导出，浏览器本地处理不上传',
  keywords: 'excel两表合并, vlookup替代, 表格匹配合并, excel关联, 对表工具, 左连接内连接',
  author: 'Util工具箱',
  ogTitle: 'Excel两表免公式合并 - 有条工具',
  ogDescription: '选关键列即完成两表匹配合并（左/内连接），不会 VLOOKUP 也能对表',
  ogUrl: 'https://www.util.cn/tools/excel-table-merge',
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
          name: 'Excel两表免公式合并',
          url: 'https://www.util.cn/tools/excel-table-merge',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['xlsx/csv 解析', '左连接/内连接', '列名冲突自动后缀', '一对多匹配', '合并统计与预览', 'xlsx 导出']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'Excel两表免公式合并', item: 'https://www.util.cn/tools/excel-table-merge/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '左连接和内连接有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '左连接保留表1全部行、匹配不到的填空白；内连接只保留两边关键列都匹配上的行。' }
            },
            {
              '@type': 'Question',
              name: '两表的列名一样会冲突吗？',
              acceptedAnswer: { '@type': 'Answer', text: '表2与表1的同名列会自动加“_表2”后缀；勾选“关键列只保留一份”后表2关键列不再重复输出。' }
            },
            {
              '@type': 'Question',
              name: '匹配不上一般是什么原因？',
              acceptedAnswer: { '@type': 'Answer', text: '多为一边是数字一边是文本或含空格，工具已按文本去空格比较，仍不匹配时请检查全角/半角与写法差异。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'excel-table-merge')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
// 表结构：{ aoa, headers, totalRows, fileName }
const table1 = ref(null)
const table2 = ref(null)
const key1 = ref(0)
const key2 = ref(0)
const joinMode = ref('left')
const keepSingleKey = ref(true)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 解析（xlsx 动态加载，仅取第一个 sheet） ----------
const parseFile = async (file) => {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error('空工作簿')
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: false, defval: '' })
  if (!aoa.length) throw new Error('空工作表')
  return aoa
}

const loadInto = async (file, slot) => {
  try {
    const aoa = await parseFile(file)
    const headers = aoa[0].map((h, i) => String(h === '' ? `列${i + 1}` : h))
    const t = { aoa, headers, totalRows: aoa.length - 1, fileName: file.name }
    if (slot === 1) {
      table1.value = t
      key1.value = 0
    } else {
      table2.value = t
      key2.value = 0
    }
  } catch (e) {
    alert(`无法解析「${file.name}」，请确认是有效的 xlsx / xls / csv 文件且第一行为表头。`)
  }
}

const onFile1 = (e) => {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (f) loadInto(f, 1)
}
const onFile2 = (e) => {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (f) loadInto(f, 2)
}

// ---------- 合并算法（表2建 Map，同 key 多行保留数组；冲突列加 _表2） ----------
const normKey = (v) => String(v == null ? '' : v).trim()

const joinTables = (t1, k1, t2, k2, mode, keepOneKey) => {
  const h1 = (t1[0] || []).map(h => String(h))
  const h2raw = (t2[0] || []).map(h => String(h))
  const h2cols = []
  for (let j = 0; j < h2raw.length; j++) {
    if (j === k2 && keepOneKey) { h2cols.push(null); continue }
    let name = h2raw[j]
    if (h1.includes(name) || h1[k1] === name) name = name + '_表2'
    h2cols.push(name)
  }
  const map = new Map()
  for (let i = 1; i < t2.length; i++) {
    const row = t2[i]
    if (!row || row.every(c => c === '' || c == null)) continue
    const k = normKey(row[k2])
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(row)
  }
  const headers = [...h1, ...h2cols.filter(Boolean)]
  const rows = []
  let matched = 0
  let unmatched = 0
  for (let i = 1; i < t1.length; i++) {
    const r1 = t1[i]
    if (!r1 || r1.every(c => c === '' || c == null)) continue
    const hits = map.get(normKey(r1[k1]))
    if (hits && hits.length) {
      matched++
      for (const r2 of hits) {
        const extra = []
        for (let j = 0; j < h2raw.length; j++) {
          if (j === k2 && keepOneKey) continue
          const v = r2[j]
          extra.push(v === undefined || v === null ? '' : v)
        }
        rows.push([...r1, ...extra])
      }
    } else {
      unmatched++
      if (mode === 'left') {
        const extra = []
        for (let j = 0; j < h2raw.length; j++) {
          if (j === k2 && keepOneKey) continue
          extra.push('')
        }
        rows.push([...r1, ...extra])
      }
    }
  }
  const total1 = t1.slice(1).filter(r => r && !r.every(c => c === '' || c == null)).length
  return { headers, rows, matched, unmatched, total1, outCols: headers.length }
}

const canJoin = computed(() => table1.value && table2.value && table1.value.aoa.length > 1 && table2.value.aoa.length > 0)

const result = computed(() => {
  if (!canJoin.value) return null
  return joinTables(table1.value.aoa, key1.value, table2.value.aoa, key2.value, joinMode.value, keepSingleKey.value)
})

// ---------- 导出 ----------
const exportXlsx = async () => {
  if (!result.value || !result.value.rows.length) return
  const XLSX = await import('xlsx')
  const aoa = [result.value.headers, ...result.value.rows]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '合并结果')
  XLSX.writeFile(wb, '两表合并结果.xlsx')
}
</script>
