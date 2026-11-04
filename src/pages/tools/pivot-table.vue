<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">数据透视分析工具 - 在线透视表生成器与数据汇总统计</h1>
      <p class="text-muted-foreground">一款免费的在线数据透视分析工具。支持CSV/JSON数据导入，创建数据透视表、分类汇总统计、多维度数据分析，可导出Excel/CSV格式，适用于数据分析和报表制作。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="mb-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- 左侧：数据输入和配置 -->
        <div class="lg:col-span-1 space-y-4">
          <!-- 数据类型选择 -->
          <div class="bg-card border border-border rounded-lg p-5">
            <h3 class="font-semibold text-foreground mb-3">数据格式</h3>
            <div class="flex gap-2">
              <button
                @click="dataType = 'csv'"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition text-sm',
                  dataType === 'csv'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                ]"
              >
                CSV
              </button>
              <button
                @click="dataType = 'json'"
                :class="[
                  'flex-1 px-4 py-2 rounded-lg transition text-sm',
                  dataType === 'json'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                ]"
              >
                JSON
              </button>
            </div>
            <button
              @click="loadSample"
              class="w-full mt-3 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition text-sm"
            >
              加载示例数据
            </button>
          </div>

          <!-- 数据输入 -->
          <div class="bg-card border border-border rounded-lg p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-semibold text-foreground">原始数据</h3>
              <label class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground cursor-pointer flex items-center gap-1">
                <Upload :size="12" />
                导入文件
                <input type="file" accept=".csv,.json,.txt" @change="importFile" class="hidden" />
              </label>
            </div>
            <textarea
              v-model="rawData"
              @input="processData"
              class="w-full h-64 px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
              :placeholder="dataType === 'csv' ? csvPlaceholder : jsonPlaceholder"
            ></textarea>
            <div class="mt-2 text-sm text-muted-foreground">
              {{ parsedData.length }} 条记录
            </div>
          </div>

          <!-- 透视表配置 -->
          <div class="bg-card border border-border rounded-lg p-5">
            <h3 class="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Filter :size="18" />
              透视表配置
            </h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">行字段（分类）</label>
                <select
                  v-model="pivotConfig.rowField"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">请选择</option>
                  <option v-for="field in fields" :key="field" :value="field">{{ field }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">列字段（可选）</label>
                <select
                  v-model="pivotConfig.columnField"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">不设置</option>
                  <option v-for="field in fields" :key="field" :value="field">{{ field }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">值字段（数值）</label>
                <select
                  v-model="pivotConfig.valueField"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">请选择</option>
                  <option v-for="field in fields" :key="field" :value="field">{{ field }}</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-muted-foreground mb-1 block">聚合方式</label>
                <select
                  v-model="pivotConfig.aggregation"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="sum">求和</option>
                  <option value="count">计数</option>
                  <option value="avg">平均</option>
                  <option value="max">最大值</option>
                  <option value="min">最小值</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：透视表展示 -->
        <div class="lg:col-span-3 space-y-4">
          <!-- 统计摘要 -->
          <div v-if="summary" class="bg-primary rounded-lg p-6 text-primary-foreground">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <TrendingUp :size="24" />
                数据摘要
              </h3>
              <span class="text-sm opacity-90">{{ getAggregationName(pivotConfig.aggregation) }}统计</span>
            </div>
            <div class="grid grid-cols-5 gap-4">
              <div class="text-center">
                <div class="text-3xl font-bold">{{ formatNumber(summary.total) }}</div>
                <div class="text-sm opacity-90">总计</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold">{{ formatNumber(summary.avg) }}</div>
                <div class="text-sm opacity-90">平均</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold">{{ formatNumber(summary.max) }}</div>
                <div class="text-sm opacity-90">最大值</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold">{{ formatNumber(summary.min) }}</div>
                <div class="text-sm opacity-90">最小值</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold">{{ summary.count }}</div>
                <div class="text-sm opacity-90">记录数</div>
              </div>
            </div>
          </div>

          <!-- 透视表 -->
          <div class="bg-card border border-border rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 class="text-lg font-semibold text-foreground">透视表</h3>
              <button
                @click="exportCSV"
                :disabled="pivotTableData.length === 0"
                class="text-xs px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded transition flex items-center gap-1"
              >
                <Download :size="12" />
                导出CSV
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-muted">
                  <tr>
                    <th
                      v-for="col in pivotColumns"
                      :key="col"
                      class="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border"
                    >
                      {{ col }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in pivotTableData"
                    :key="index"
                    class="hover:bg-accent transition"
                  >
                    <td
                      v-for="col in pivotColumns"
                      :key="col"
                      class="px-4 py-3 text-sm border-b border-border"
                    >
                      <span v-if="row[col] !== undefined" class="font-mono">
                        {{ formatNumber(row[col]) }}
                      </span>
                      <span v-else class="text-muted-foreground">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="pivotTableData.length === 0" class="p-12 text-center text-muted-foreground">
              <Table :size="48" class="mx-auto mb-3 opacity-50" />
              <p>请在左侧配置透视表字段</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是数据透视表？
        </h2>
        <p class="text-muted-foreground mb-4">
          数据透视表（Pivot Table）是一种强大的数据汇总工具，可以快速对大量数据进行分类、汇总和分析。
          它允许用户通过拖放字段来重新组织和汇总数据，从而发现数据中的模式、趋势和关系。
          数据透视表广泛应用于商业分析、财务报告、销售统计等领域，是Excel等电子表格软件中最受欢迎的功能之一。
        </p>
        <p class="text-muted-foreground">
          本工具是在线版本的数据透视表生成器，无需安装任何软件，只需在浏览器中即可使用。
          支持CSV和JSON格式的数据导入，提供多种聚合函数（求和、计数、平均、最大值、最小值），
          可以轻松创建多维度的数据分析报表。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>准备CSV或JSON格式的数据，CSV文件第一行应为列名</li>
          <li>选择数据格式，将数据粘贴到输入框或点击"导入文件"上传</li>
          <li>配置透视表字段：选择行字段（作为分组依据）、列字段（可选）、值字段（要统计的数值）</li>
          <li>选择聚合方式：求和、计数、平均、最大值或最小值</li>
          <li>查看生成的透视表和统计摘要，可点击"导出CSV"下载结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多格式支持</strong>: 支持CSV和JSON两种常见数据格式导入</li>
          <li><strong>灵活配置</strong>: 自由设置行字段、列字段和值字段，创建多维度分析</li>
          <li><strong>多种聚合</strong>: 提供求和、计数、平均、最大值、最小值五种聚合函数</li>
          <li><strong>实时统计</strong>: 自动计算总计、平均值、最大值、最小值等统计指标</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>导出功能</strong>: 支持将透视表结果导出为CSV格式，方便后续分析</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">数据透视表和普通表格有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              普通表格只是数据的罗列，而数据透视表可以对数据进行动态汇总和重组。
              透视表能够按照不同维度对数据进行分组统计，自动计算总计和平均值，
              让你快速发现数据中的模式和趋势，非常适合数据分析和报表制作。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些数据格式？</h3>
            <p class="text-muted-foreground mt-1">
              目前支持CSV和JSON两种格式。CSV格式要求第一行为列名，后续行为数据；
              JSON格式要求数组形式，每个元素是一个对象。如果数据格式不正确，可以尝试使用本站的其他格式转换工具。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的聚合函数？</h3>
            <p class="text-muted-foreground mt-1">
              根据分析目的选择：求和用于计算总额（如销售额）；计数用于统计记录数量；
              平均值用于计算平均水平；最大值/最小值用于找出极值。例如分析销售数据时，
              可以用求和看总销售额，用平均看客单价，用最大值找出销售冠军。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">我的数据安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。本工具采用纯前端技术实现，所有数据处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您可以放心处理敏感数据，包括财务数据、客户信息等。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Table, Upload, Download, Filter, TrendingUp,
  ChevronUp, HelpCircle,
  FileText, BarChart3, Database, PieChart as PieChartIcon,
  FileSpreadsheet, Calculator, ChartScatter
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '数据透视分析工具 - 在线透视表生成器与数据汇总统计 | Util工具箱',
  description: '免费在线数据透视分析工具，支持CSV/JSON数据导入，创建数据透视表、分类汇总统计、多维度数据分析，可导出Excel/CSV格式，适用于数据分析和报表制作。纯本地计算，数据隐私绝对安全。',
  keywords: '数据透视,透视表,数据分析,数据汇总,统计工具,数据统计,在线分析,Excel透视表,数据透视分析器,在线透视表',
  author: 'Util工具箱',
  ogTitle: '数据透视分析工具 - 免费在线透视表生成器',
  ogDescription: '专业的数据透视分析工具，支持CSV/JSON数据导入，创建数据透视表、分类汇总统计、多维度数据分析。纯前端处理，数据安全可靠。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '数据透视分析工具 - 免费在线透视表生成器',
  twitterDescription: '专业的数据透视分析工具，支持CSV/JSON数据导入，创建数据透视表、分类汇总统计、多维度数据分析。纯前端处理，数据安全可靠。'
})

// 当前工具
const tool = tools.find(t => t.id === 'pivot-table')

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

const rawData = ref('')
const dataType = ref('csv') // csv, json
const parsedData = ref([])

// Placeholder文本
const csvPlaceholder = '输入CSV数据，第一行为列名...\n产品,区域,销售额\n产品A,北京,1000\n产品A,上海,1200'
const jsonPlaceholder = '输入JSON数组数据...\n[{"产品": "A", "区域": "北京", "销售额": 1000}]'

// 透视表配置
const pivotConfig = ref({
  rowField: '',
  columnField: '',
  valueField: '',
  aggregation: 'sum' // sum, count, avg, max, min
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, BarChart3, Database, PieChartIcon,
  FileSpreadsheet, Calculator, ChartScatter, Table
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'data' && t.id !== 'pivot-table'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'csv-formatter'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'excel-converter'),
    tools.find(t => t.id === 'chart-generator')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// CSV解析
const parseCSV = (csv) => {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const data = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    data.push(row)
  }

  return data
}

// JSON解析
const parseJSON = (json) => {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch (e) {
    return []
  }
}

// 解析数据
const processData = () => {
  if (!rawData.value.trim()) {
    parsedData.value = []
    return
  }

  if (dataType.value === 'csv') {
    parsedData.value = parseCSV(rawData.value)
  } else {
    parsedData.value = parseJSON(rawData.value)
  }
}

// 获取字段列表
const fields = computed(() => {
  if (parsedData.value.length === 0) return []
  return Object.keys(parsedData.value[0])
})

// 生成透视表数据
const pivotTableData = computed(() => {
  if (parsedData.value.length === 0 || !pivotConfig.value.rowField || !pivotConfig.value.valueField) {
    return []
  }

  const { rowField, columnField, valueField, aggregation } = pivotConfig.value
  const pivotData = {}

  parsedData.value.forEach(row => {
    const rowKey = row[rowField] || '未分类'
    const colKey = columnField ? (row[columnField] || '总计') : '总计'

    if (!pivotData[rowKey]) {
      pivotData[rowKey] = {}
    }
    if (!pivotData[rowKey][colKey]) {
      pivotData[rowKey][colKey] = []
    }

    const value = parseFloat(row[valueField]) || 0
    pivotData[rowKey][colKey].push(value)
  })

  // 聚合计算
  const result = []
  const allColumns = new Set()
  Object.values(pivotData).forEach(row => {
    Object.keys(row).forEach(col => allColumns.add(col))
  })

  Object.entries(pivotData).forEach(([rowKey, cols]) => {
    const rowData = { [rowField]: rowKey }
    let rowTotal = []

    Array.from(allColumns).forEach(colKey => {
      const values = cols[colKey] || []
      let aggregated = 0

      switch (aggregation) {
        case 'sum':
          aggregated = values.reduce((a, b) => a + b, 0)
          break
        case 'count':
          aggregated = values.length
          break
        case 'avg':
          aggregated = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
          break
        case 'max':
          aggregated = values.length > 0 ? Math.max(...values) : 0
          break
        case 'min':
          aggregated = values.length > 0 ? Math.min(...values) : 0
          break
      }

      rowData[colKey] = aggregated
      rowTotal.push(aggregated)
    })

    rowData['总计'] = aggregation === 'count'
      ? rowTotal.reduce((a, b) => a + b, 0)
      : aggregation === 'avg'
        ? rowTotal.reduce((a, b) => a + b, 0) / rowTotal.length
        : rowTotal.reduce((a, b) => a + b, 0)

    result.push(rowData)
  })

  return result
})

// 透视表列
const pivotColumns = computed(() => {
  if (pivotTableData.value.length === 0) return []
  const columns = new Set()
  pivotTableData.value.forEach(row => {
    Object.keys(row).forEach(key => columns.add(key))
  })
  return Array.from(columns)
})

// 统计摘要
const summary = computed(() => {
  if (pivotTableData.value.length === 0) return null

  const allValues = pivotTableData.value
    .filter(row => row['总计'] !== undefined)
    .map(row => row['总计'])

  const total = allValues.reduce((a, b) => a + b, 0)
  const avg = allValues.length > 0 ? total / allValues.length : 0
  const max = allValues.length > 0 ? Math.max(...allValues) : 0
  const min = allValues.length > 0 ? Math.min(...allValues) : 0

  return { total, avg, max, min, count: allValues.length }
})

// 导入文件
const importFile = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    rawData.value = e.target.result
    if (file.name.endsWith('.json')) {
      dataType.value = 'json'
    }
    processData()
  }
  reader.readAsText(file)
}

// 加载示例数据
const loadSample = () => {
  dataType.value = 'csv'
  rawData.value = `产品,区域,月份,销售额,数量
笔记本电脑,北京,1月,120000,50
笔记本电脑,上海,1月,98000,40
笔记本电脑,北京,2月,115000,48
笔记本电脑,上海,2月,102000,42
台式电脑,北京,1月,85000,30
台式电脑,上海,1月,72000,25
台式电脑,北京,2月,90000,32
台式电脑,上海,2月,78000,28
平板电脑,北京,1月,65000,35
平板电脑,上海,1月,58000,30
平板电脑,北京,2月,70000,38
平板电脑,上海,2月,62000,32`
  processData()
}

// 导出CSV
const exportCSV = () => {
  if (pivotTableData.value.length === 0) return

  const headers = pivotColumns.value
  const csv = [
    headers.join(','),
    ...pivotTableData.value.map(row =>
      headers.map(h => row[h] !== undefined ? row[h] : '').join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '透视表数据.csv'
  link.click()
  URL.revokeObjectURL(url)
}

// 格式化数字
const formatNumber = (num) => {
  if (Number.isInteger(num)) return num.toLocaleString()
  return num.toFixed(2)
}

// 获取聚合函数名称
const getAggregationName = (type) => {
  const names = {
    sum: '求和',
    count: '计数',
    avg: '平均',
    max: '最大',
    min: '最小'
  }
  return names[type] || type
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
