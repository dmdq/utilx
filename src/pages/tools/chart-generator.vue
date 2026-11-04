<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3 flex items-center gap-2">
        <BarChart3 :size="36" />
        在线图表生成器 - 免费数据可视化工具 | 柱状图折线图饼图雷达图
      </h1>
      <p class="text-muted-foreground">免费在线图表生成器，支持柱状图、折线图、饼图、雷达图等多种图表类型。导入CSV/JSON数据，一键生成精美图表，支持导出SVG/PNG格式，适用于数据分析、报告展示等场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：图表显示 -->
      <div class="lg:col-span-2">
        <div class="bg-card border border-border rounded-2xl p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-foreground">图表预览</h2>
            <div class="flex gap-2">
              <button
                @click="exportChart('png')"
                class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center gap-1 text-sm"
              >
                <Download :size="16" />
                PNG
              </button>
              <button
                @click="exportChart('jpg')"
                class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center gap-1 text-sm"
              >
                <Download :size="16" />
                JPG
              </button>
            </div>
          </div>

          <div class="bg-muted rounded-xl p-4">
            <canvas ref="canvasRef" id="chartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- 右侧：控制面板 -->
      <div class="space-y-4">
        <!-- 图表类型 -->
        <div class="bg-card border border-border rounded-2xl p-6">
          <h3 class="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Settings :size="18" />
            图表类型
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="type in CHART_TYPES"
              :key="type.id"
              @click="selectedChartType = type.id"
              :class="[
                'p-3 rounded-xl text-center transition',
                selectedChartType === type.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="text-2xl mb-1">{{ type.icon }}</div>
              <div class="text-xs">{{ type.name }}</div>
            </button>
          </div>
        </div>

        <!-- 颜色方案 -->
        <div class="bg-card border border-border rounded-2xl p-6">
          <h3 class="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Palette :size="18" />
            颜色方案
          </h3>
          <div class="space-y-2">
            <button
              v-for="(scheme, index) in COLOR_SCHEMES"
              :key="index"
              @click="selectedColorScheme = index"
              :class="[
                'w-full p-2 rounded-lg flex items-center gap-2 transition',
                selectedColorScheme === index
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
              ]"
            >
              <div class="flex gap-0.5">
                <div
                  v-for="(color, i) in scheme.colors.slice(0, 6)"
                  :key="i"
                  class="w-4 h-4 rounded-sm"
                  :style="{ backgroundColor: color }"
                ></div>
              </div>
              <span class="text-sm text-foreground">{{ scheme.name }}</span>
            </button>
          </div>
        </div>

        <!-- 图表设置 -->
        <div class="bg-card border border-border rounded-2xl p-6">
          <h3 class="font-semibold text-foreground mb-3">图表设置</h3>
          <div class="space-y-3">
            <div>
              <label class="text-sm text-muted-foreground mb-1 block">图表标题</label>
              <input
                v-model="chartTitle"
                type="text"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入图表标题"
              />
            </div>
            <label class="flex items-center gap-2">
              <input
                v-model="showLegend"
                type="checkbox"
                class="rounded"
              />
              <span class="text-sm text-foreground">显示图例</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="showDataLabels"
                type="checkbox"
                class="rounded"
              />
              <span class="text-sm text-foreground">显示数据标签</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据编辑区 -->
    <div class="bg-card border border-border rounded-2xl p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-foreground">数据编辑</h2>
        <div class="flex gap-2">
          <label class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center gap-1 text-sm cursor-pointer">
            <Upload :size="16" />
            导入CSV
            <input type="file" accept=".csv,.txt" @change="importCSV" class="hidden" />
          </label>
          <button
            @click="exportData('csv')"
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm"
          >
            导出CSV
          </button>
          <button
            @click="exportData('json')"
            class="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm"
          >
            导出JSON
          </button>
        </div>
      </div>

      <!-- 示例数据按钮 -->
      <div class="flex gap-2 mb-3">
        <button
          @click="loadSampleData('sales')"
          class="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition text-sm"
        >
          销售数据
        </button>
        <button
          @click="loadSampleData('products')"
          class="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition text-sm"
        >
          产品对比
        </button>
        <button
          @click="loadSampleData('skills')"
          class="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition text-sm"
        >
          技能评分
        </button>
      </div>

      <div class="relative">
        <textarea
          v-model="rawData"
          @input="parseData"
          class="w-full h-48 px-4 py-3 bg-muted border border-border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          placeholder="输入数据，格式：类别,数值（每行一条）"
        ></textarea>
        <button
          @click="parseData"
          class="absolute bottom-3 right-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm"
        >
          更新图表
        </button>
      </div>
      <p class="text-sm text-muted-foreground mt-2">
        提示：第一行是标题，每行数据格式为"类别,数值"，支持逗号或制表符分隔
      </p>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-2xl">
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
          什么是图表生成器？
        </h2>
        <p class="text-muted-foreground mb-4">
          图表生成器是一种数据可视化工具，能够将枯燥的数据转换为直观的图表形式。
          通过图表，我们可以更快速地理解数据背后的趋势、模式和关联性。
          无论是商业报告、学术研究还是日常数据分析，图表都是传达信息的强有力工具。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在数据编辑区输入您的数据，支持CSV格式（类别,数值）</li>
          <li>选择合适的图表类型（柱状图、折线图、饼图等）</li>
          <li>调整颜色方案和图表设置（标题、图例、数据标签）</li>
          <li>点击"更新图表"按钮预览效果</li>
          <li>导出图表为PNG/JPG图片，或导出数据为CSV/JSON</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的图表类型
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>柱状图</strong>：适合比较不同类别的数据大小，直观展示差异</li>
          <li><strong>折线图</strong>：展示数据随时间变化的趋势，适合时序数据</li>
          <li><strong>饼图</strong>：显示各部分占整体的比例关系</li>
          <li><strong>环形图</strong>：现代感的饼图变体，视觉更加轻盈</li>
          <li><strong>雷达图</strong>：多维度数据对比，适合能力评估等场景</li>
          <li><strong>极地图</strong>：周期性数据展示，适合风向、周期性趋势等</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种图表类型</strong>：支持6种常用图表类型，满足不同场景需求</li>
          <li><strong>颜色方案自定义</strong>：提供5种预设配色方案，快速切换风格</li>
          <li><strong>数据导入导出</strong>：支持CSV文件导入，可导出图表和数据</li>
          <li><strong>本地安全处理</strong>：所有数据处理都在浏览器本地完成，保护隐私</li>
          <li><strong>响应式设计</strong>：图表自动适配不同屏幕尺寸</li>
          <li><strong>示例数据</strong>：内置多组示例数据，快速上手体验</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线图表生成器安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的图表生成器采用纯前端技术实现，所有数据处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您可以放心处理敏感数据和商业信息。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些数据格式？</h3>
            <p class="text-muted-foreground mt-1">
              目前支持CSV格式数据，每行一条记录，格式为"类别,数值"。
              数据之间可以用逗号或制表符分隔。未来版本将支持更多格式。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">导出的图片可以用于商业用途吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。您生成的图表可以自由使用于任何用途，包括商业报告、演示文稿、出版物等。
              我们对生成的内容不保留任何权利。
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
import { ref, computed, onMounted, watch } from 'vue'
import { BarChart3, Download, Upload, Palette, Settings, HelpCircle, ChevronUp, FileText, PieChart, LineChart, TrendingUp, Database, FileJson } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '在线图表生成器 - 免费数据可视化工具 | 柱状图折线图饼图雷达图',
  description: '免费在线图表生成器，支持柱状图、折线图、饼图、雷达图等多种图表类型。导入CSV/JSON数据，一键生成精美图表，支持导出SVG/PNG格式，适用于数据分析、报告展示等场景。',
  keywords: '图表生成器,数据可视化,柱状图,折线图,饼图,雷达图,在线图表,免费图表工具,数据图表,统计分析',
  author: 'Util工具箱',
  ogTitle: '在线图表生成器 - 免费数据可视化工具',
  ogDescription: '免费在线图表生成器，支持柱状图、折线图、饼图、雷达图等多种图表类型。导入CSV/JSON数据，一键生成精美图表。',
  ogType: 'website'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '在线图表生成器',
            description: '免费在线图表生成器，支持多种图表类型和数据格式',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多种图表类型',
              '颜色方案自定义',
              '数据导入导出',
              '本地安全处理',
              '响应式设计',
              '示例数据'
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '在线图表生成器安全吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '绝对安全。我们的图表生成器采用纯前端技术实现，所有数据处理都在您的浏览器本地完成，数据不会上传到任何服务器。'
                }
              },
              {
                '@type': 'Question',
                name: '支持哪些数据格式？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '目前支持CSV格式数据，每行一条记录，格式为"类别,数值"。数据之间可以用逗号或制表符分隔。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const CHART_TYPES = [
  { id: 'bar', name: '柱状图', icon: '📊' },
  { id: 'line', name: '折线图', icon: '📈' },
  { id: 'pie', name: '饼图', icon: '🥧' },
  { id: 'doughnut', name: '环形图', icon: '🍩' },
  { id: 'radar', name: '雷达图', icon: '🕸️' },
  { id: 'polarArea', name: '极地图', icon: '🎯' }
]

const COLOR_SCHEMES = [
  { name: '默认', colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'] },
  { name: '商务', colors: ['#1E40AF', '#065F46', '#92400E', '#991B1B', '#5B21B6', '#9D174D'] },
  { name: '鲜艳', colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] },
  { name: '柔和', colors: ['#A5D8FF', '#B2F2BB', '#FFEC99', '#FFD8A8', '#D0BFFF', '#FFC9C9'] },
  { name: '单色', colors: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5'] }
]

const selectedChartType = ref('bar')
const selectedColorScheme = ref(0)
const chartTitle = ref('数据图表')
const showLegend = ref(true)
const showDataLabels = ref(false)
const rawData = ref(`类别,数值
产品A,120
产品B,200
产品C,150
产品D,80
产品E,250`)

const chartData = ref({ labels: [], datasets: [] })
const canvasRef = ref(null)
let chartInstance = null

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, BarChart3, PieChart, LineChart, TrendingUp, Database, FileJson
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'pivot-table'),
    tools.find(t => t.id === 'mind-map'),
    tools.find(t => t.id === 'flowchart-builder'),
    tools.find(t => t.id === 'word-cloud')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 解析数据
const parseData = () => {
  try {
    const lines = rawData.value.trim().split('\n')
    const labels = []
    const values = []

    // 检测分隔符
    const firstLine = lines[0]
    const separator = firstLine.includes(',') ? ',' : firstLine.includes('\t') ? '\t' : ' '

    lines.forEach((line, index) => {
      if (index === 0) return // 跳过标题行
      const parts = line.split(separator)
      if (parts.length >= 2) {
        labels.push(parts[0].trim())
        values.push(parseFloat(parts[1].trim()) || 0)
      }
    })

    chartData.value = {
      labels,
      datasets: [{
        label: '数值',
        data: values,
        backgroundColor: COLOR_SCHEMES[selectedColorScheme.value].colors,
        borderColor: COLOR_SCHEMES[selectedColorScheme.value].colors.map(c => c),
        borderWidth: 2
      }]
    }

    updateChart()
  } catch (error) {
    console.error('数据解析错误:', error)
  }
}

// 创建/更新图表
const updateChart = () => {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js 未加载')
    return
  }

  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx) return

  const chartConfig = {
    type: selectedChartType.value,
    data: {
      labels: chartData.value.labels,
      datasets: [{
        ...chartData.value.datasets[0],
        backgroundColor: getBackgroundColor(),
        borderColor: getBorderColor()
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 16 / 9,
      plugins: {
        legend: {
          display: showLegend.value,
          position: 'top'
        },
        title: {
          display: !!chartTitle.value,
          text: chartTitle.value,
          font: {
            size: 18,
            weight: 'bold'
          }
        },
        datalabels: {
          display: showDataLabels.value,
          color: '#fff',
          font: {
            weight: 'bold'
          }
        }
      },
      scales: selectedChartType.value === 'bar' || selectedChartType.value === 'line' ? {
        y: {
          beginAtZero: true
        }
      } : {}
    }
  }

  chartInstance = new Chart(ctx, chartConfig)
}

const getBackgroundColor = () => {
  if (['pie', 'doughnut', 'polarArea'].includes(selectedChartType.value)) {
    return COLOR_SCHEMES[selectedColorScheme.value].colors
  }
  return COLOR_SCHEMES[selectedColorScheme.value].colors[0]
}

const getBorderColor = () => {
  if (['pie', 'doughnut', 'polarArea'].includes(selectedChartType.value)) {
    return COLOR_SCHEMES[selectedColorScheme.value].colors.map(c => c)
  }
  return COLOR_SCHEMES[selectedColorScheme.value].colors[0]
}

// 导出图片
const exportChart = (format = 'png') => {
  if (!chartInstance) return

  const link = document.createElement('a')
  link.download = `chart.${format}`

  if (format === 'png') {
    link.href = canvasRef.value.toDataURL('image/png')
  } else if (format === 'jpg') {
    link.href = canvasRef.value.toDataURL('image/jpeg', 0.9)
  }

  link.click()
}

// 导入CSV
const importCSV = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    rawData.value = e.target.result
    parseData()
  }
  reader.readAsText(file)
}

// 导出数据
const exportData = (format = 'csv') => {
  let content = ''
  let filename = ''
  let type = ''

  if (format === 'csv') {
    content = rawData.value
    filename = 'data.csv'
    type = 'text/csv'
  } else if (format === 'json') {
    const json = {
      labels: chartData.value.labels,
      data: chartData.value.datasets[0].data
    }
    content = JSON.stringify(json, null, 2)
    filename = 'data.json'
    type = 'application/json'
  }

  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// 示例数据
const loadSampleData = (type) => {
  const samples = {
    sales: `月份,销售额
1月,12000
2月,19000
3月,15000
4月,22000
5月,18000
6月,25000`,
    products: `产品,销量
产品A,120
产品B,200
产品C,150
产品D,80
产品E,250`,
    skills: `技能,得分
JavaScript,85
Python,90
Java,75
Go,80
Vue,95`,
    comparison: `项目,目标值,实际值
项目A,100,120
项目B,150,140
项目C,80,90
项目D,120,110`
  }

  rawData.value = samples[type] || samples.sales
  parseData()
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 监听变化
watch([selectedChartType, selectedColorScheme, showLegend, showDataLabels, chartTitle], () => {
  updateChart()
})

onMounted(() => {
  // 动态加载Chart.js
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
  script.onload = () => {
    // 加载Chart DataLabels插件
    const datalabelsScript = document.createElement('script')
    datalabelsScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js'
    datalabelsScript.onload = () => {
      if (window.ChartDataLabels) {
        Chart.register(window.ChartDataLabels)
      }
      parseData()
    }
    document.head.appendChild(datalabelsScript)
  }
  document.head.appendChild(script)
})
</script>
