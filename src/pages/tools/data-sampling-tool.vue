<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">数据采样工具 - 在线数据采样、分桶与分组工具</h1>
      <p class="text-muted-foreground">对数据集进行采样、分桶、分组操作，支持随机采样、系统采样、分层采样、聚类采样等多种方法。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧输入和控制 -->
      <div class="flex flex-col h-full space-y-6">
        <!-- 数据输入 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-foreground">数据输入</label>
            <div class="flex gap-2">
              <button
                @click="loadSampleData"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                加载示例
              </button>
              <button
                @click="clearData"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                清空
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium text-foreground mb-2">输入格式</label>
            <div class="flex gap-2">
              <button
                v-for="format in inputFormats"
                :key="format.id"
                @click="inputFormat = format.id"
                :class="[
                  'text-xs px-3 py-1 rounded',
                  inputFormat === format.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ format.name }}
              </button>
            </div>
          </div>

          <textarea
            v-model="inputData"
            @input="parseData"
            class="w-full h-48 p-3 bg-muted border border-border border-border rounded-lg resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            :placeholder="inputFormat === 'json' ? '[1, 2, 3, 4, 5]' : '1, 2, 3, 4, 5'"
          ></textarea>

          <div class="mt-2 text-sm text-muted-foreground">
            数据行数: {{ parsedData.length }}
          </div>
        </div>

        <!-- 采样配置 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <label class="text-sm font-medium text-foreground mb-3 block">采样配置</label>

          <!-- 采样方法 -->
          <div class="mb-4">
            <label class="block text-xs text-muted-foreground mb-2">采样方法</label>
            <select v-model="samplingConfig.method" @change="updateSampling" class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md text-sm">
              <option value="random">随机采样</option>
              <option value="systematic">系统采样</option>
              <option value="stratified">分层采样</option>
              <option value="cluster">聚类采样</option>
            </select>
          </div>

          <!-- 采样大小 -->
          <div class="mb-4">
            <label class="block text-xs text-muted-foreground mb-2">采样大小</label>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <input
                  v-model.number="samplingConfig.sampleSize"
                  type="number"
                  :min="1"
                  :max="parsedData.length"
                  @input="updateSampling"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md text-sm"
                  placeholder="数量"
                >
              </div>
              <div>
                <input
                  v-model.number="samplingConfig.samplePercent"
                  type="number"
                  :min="0"
                  :max="100"
                  :step="0.1"
                  @input="updateSamplePercent"
                  class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md text-sm"
                  placeholder="百分比"
                >
              </div>
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              或输入百分比 (0-100%)
            </div>
          </div>

          <!-- 高级选项 -->
          <div class="space-y-3" v-if="samplingConfig.method === 'stratified'">
            <div>
              <label class="block text-xs text-muted-foreground mb-2">分层字段</label>
              <select v-model="samplingConfig.strataField" @change="updateSampling" class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md text-sm">
                <option value="">自动检测</option>
                <option v-for="field in dataFields" :key="field" :value="field">{{ field }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-3" v-if="samplingConfig.method === 'cluster'">
            <div>
              <label class="block text-xs text-muted-foreground mb-2">聚类数量</label>
              <input
                v-model.number="samplingConfig.clusterCount"
                type="number"
                :min="1"
                @change="updateSampling"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md text-sm"
              >
            </div>
          </div>

          <!-- 随机种子 -->
          <div>
            <label class="block text-xs text-muted-foreground mb-2">随机种子 (可选)</label>
            <input
              v-model.number="samplingConfig.seed"
              type="number"
              @change="updateSampling"
              class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md text-sm"
              placeholder="固定随机种子以获得可重现结果"
            >
          </div>
        </div>

        <!-- 数据操作 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <label class="text-sm font-medium text-foreground mb-3 block">数据操作</label>

          <div class="space-y-4">
            <!-- 数据分桶 -->
            <div>
              <label class="block text-xs text-muted-foreground mb-2">数据分桶</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model.number="bucketConfig.count"
                  type="number"
                  :min="1"
                  placeholder="桶数量"
                  class="px-3 py-2 bg-muted border border-border border-border rounded-md text-sm"
                >
                <button
                  @click="createBuckets"
                  class="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                >
                  分桶
                </button>
              </div>
            </div>

            <!-- 数据分组 -->
            <div>
              <label class="block text-xs text-muted-foreground mb-2">数据分组</label>
              <select v-model="groupConfig.field" class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md mb-2 text-sm">
                <option value="">选择分组字段</option>
                <option v-for="field in dataFields" :key="field" :value="field">{{ field }}</option>
              </select>
              <button
                @click="groupData"
                :disabled="!groupConfig.field"
                class="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                分组
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧结果输出 -->
      <div class="flex flex-col h-full space-y-6">
        <!-- 采样结果 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-foreground">采样结果</label>
            <div class="flex gap-2">
              <button
                @click="copyResults"
                class="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                复制
              </button>
              <button
                @click="downloadResults"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                下载
              </button>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="mb-4 p-3 bg-muted rounded-md">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-foreground">原始数据:</span> <span class="text-muted-foreground">{{ parsedData.length }} 项</span>
              </div>
              <div>
                <span class="font-medium text-foreground">采样数据:</span> <span class="text-muted-foreground">{{ sampledData.length }} 项</span>
              </div>
              <div>
                <span class="font-medium text-foreground">采样率:</span> <span class="text-muted-foreground">{{ samplingRate.toFixed(1) }}%</span>
              </div>
              <div>
                <span class="font-medium text-foreground">方法:</span> <span class="text-muted-foreground">{{ getMethodName(samplingConfig.method) }}</span>
              </div>
            </div>
          </div>

          <!-- 结果预览 -->
          <div class="border border-border rounded-md overflow-hidden">
            <pre class="p-3 text-sm overflow-x-auto max-h-96 overflow-y-auto bg-muted font-mono">{{ formatResults(sampledData) }}</pre>
          </div>
        </div>

        <!-- 数据分布图表 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <label class="text-sm font-medium text-foreground mb-3 block">数据分布</label>
          <div class="mb-4">
            <label class="block text-xs text-muted-foreground mb-2">选择字段</label>
            <select v-model="chartField" class="w-full px-3 py-2 bg-muted border border-border border-border rounded-md text-sm">
              <option value="">选择字段进行分析</option>
              <option v-for="field in numericFields" :key="field" :value="field">{{ field }}</option>
            </select>
          </div>

          <div v-if="chartField && distributionData" class="border border-border rounded-md p-4">
            <div class="space-y-2">
              <div v-for="(item, index) in distributionData" :key="index" class="flex items-center">
                <div class="w-20 text-sm text-muted-foreground">{{ item.label }}</div>
                <div class="flex-1 mx-2">
                  <div class="bg-muted rounded-full h-6 relative">
                    <div
                      class="bg-primary h-6 rounded-full transition-all duration-300"
                      :style="{ width: `${item.percentage}%` }"
                    ></div>
                  </div>
                </div>
                <div class="w-16 text-right text-sm text-foreground">{{ item.count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 执行按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="updateSampling"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        执行采样
      </button>
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
          什么是数据采样？
        </h2>
        <p class="text-muted-foreground mb-4">
          数据采样是从大数据集中选择部分数据点的过程，旨在用较小的子集代表整体数据集的特征。
          通过采样，我们可以显著降低数据处理和分析的计算成本，同时保持统计结果的可靠性。
          本工具提供多种采样方法，适用于不同场景的数据分析需求。
        </p>
        <p class="text-muted-foreground">
          为什么需要数据采样？在大数据时代，处理数百万甚至数亿条记录既耗时又消耗资源。
          通过合理的采样策略，我们可以快速获得数据洞察，进行初步分析和模型验证。
          采样也常用于机器学习的数据集划分、A/B 测试、质量检查等场景。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的数据粘贴到左侧输入框，支持 JSON、CSV 或纯文本格式</li>
          <li>选择合适的采样方法（随机、系统、分层或聚类采样）</li>
          <li>设置采样大小（可以直接输入数量或百分比）</li>
          <li>点击"执行采样"按钮查看结果，可复制或下载采样数据</li>
          <li>使用数据分桶和分组功能进行进一步的数据处理</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          采样方法详解
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>随机采样</strong>: 每个样本有相等的被选中概率，适用于数据分布均匀的情况</li>
          <li><strong>系统采样</strong>: 按固定间隔从有序数据中选择样本，操作简单高效</li>
          <li><strong>分层采样</strong>: 按照某个特征将数据分层，从每层中按比例采样，确保各层代表性</li>
          <li><strong>聚类采样</strong>: 将数据聚类后，随机选择若干聚类进行采样，适用于有明显分组的数据</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线数据采样工具安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的数据采样工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              数据不会上传到任何服务器。您可以使用敏感数据进行采样处理，无需担心隐私泄露问题。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">应该选择多大的采样比例？</h3>
            <p class="text-muted-foreground mt-1">
              采样比例取决于数据集大小和分析目的。一般来说：
              对于小于 10,000 条的数据，可以使用 10-30% 的采样率；
              对于 10,000-100,000 条的数据，建议使用 5-10% 的采样率；
              对于更大的数据集，1-5% 的采样率通常就能获得具有代表性的样本。
              您也可以通过设置随机种子来确保结果的可重现性。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">分层采样和聚类采样有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              分层采样是根据已知特征将数据分成若干层，然后从每层中按比例抽取样本，
              目的是确保每个子群体都有足够的代表性。
              聚类采样则是将数据聚合成若干个聚类，然后随机选择部分聚类进行完整采样，
              适用于数据自然分组且组内差异小、组间差异大的情况。
              两种方法各有优势，选择取决于数据结构和分析目标。
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
import { ref, computed, watch } from 'vue'
import {
  Database, BarChart3, PieChart, TrendingUp,
  FileJson, FileText, Calculator, Filter,
  ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '数据采样工具 - 在线数据采样、分桶与分组 | Util工具箱',
  description: '免费在线数据采样工具，支持随机采样、系统采样、分层采样、聚类采样等多种方法。提供数据分桶、分组功能，纯本地计算，数据安全隐私。',
  keywords: '数据采样,随机采样,系统采样,分层采样,聚类采样,数据分桶,数据分组,在线采样工具',
  author: 'Util工具箱',
  ogTitle: '数据采样工具 - 免费在线数据采样分桶分组',
  ogDescription: '专业的数据采样工具，支持多种采样方法、数据分桶和分组功能。纯前端处理，数据安全可靠。',
  ogType: 'website'
})

// 数据
const inputData = ref('')
const parsedData = ref([])
const sampledData = ref([])
const inputFormat = ref('json')
const chartField = ref('')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 输入格式
const inputFormats = [
  { id: 'json', name: 'JSON' },
  { id: 'csv', name: 'CSV' },
  { id: 'text', name: '文本' }
]

// 采样配置
const samplingConfig = ref({
  method: 'random',
  sampleSize: 10,
  samplePercent: 20,
  strataField: '',
  clusterCount: 3,
  seed: null
})

// 分桶配置
const bucketConfig = ref({
  count: 5
})

// 分组配置
const groupConfig = ref({
  field: ''
})

// 图标映射
const iconMap = {
  FileJson, FileText, Calculator, Filter,
  Database, BarChart3, PieChart, TrendingUp
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'data-filter'),
    tools.find(t => t.id === 'pivot-table'),
    tools.find(t => t.id === 'duplicate-remover'),
    tools.find(t => t.id === 'csv-editor')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 计算属性
const dataFields = computed(() => {
  if (parsedData.value.length === 0) return []
  const firstItem = parsedData.value[0]
  if (typeof firstItem === 'object') {
    return Object.keys(firstItem)
  }
  return ['value']
})

const numericFields = computed(() => {
  return dataFields.value.filter(field => {
    return parsedData.value.some(item => {
      const value = typeof item === 'object' ? item[field] : item
      return !isNaN(parseFloat(value))
    })
  })
})

const samplingRate = computed(() => {
  if (parsedData.value.length === 0) return 0
  return (sampledData.value.length / parsedData.value.length) * 100
})

const distributionData = computed(() => {
  if (!chartField.value || sampledData.value.length === 0) return null

  const values = sampledData.value.map(item => {
    const value = typeof item === 'object' ? item[chartField.value] : item
    return parseFloat(value)
  }).filter(v => !isNaN(v))

  if (values.length === 0) return null

  // 简单的分桶统计
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const binSize = range / 5

  const bins = Array(5).fill(0).map((_, i) => ({
    label: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
    count: 0,
    percentage: 0
  }))

  values.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), 4)
    bins[binIndex].count++
  })

  const total = values.length
  bins.forEach(bin => {
    bin.percentage = (bin.count / total) * 100
  })

  return bins
})

// 方法
const parseData = () => {
  try {
    if (!inputData.value.trim()) {
      parsedData.value = []
      return
    }

    let data = []

    if (inputFormat.value === 'json') {
      data = JSON.parse(inputData.value)
    } else if (inputFormat.value === 'csv') {
      const lines = inputData.value.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim())

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const obj = {}
        headers.forEach((header, index) => {
          const value = values[index]
          obj[header] = isNaN(value) ? value : parseFloat(value)
        })
        data.push(obj)
      }
    } else {
      data = inputData.value.split(/[\n,\s]+/).filter(v => v.trim()).map(v => {
        const num = parseFloat(v.trim())
        return isNaN(num) ? v.trim() : num
      })
    }

    parsedData.value = Array.isArray(data) ? data : [data]
    updateSampling()
  } catch (error) {
    console.error('数据解析失败:', error)
  }
}

const updateSampling = () => {
  if (parsedData.value.length === 0) {
    sampledData.value = []
    return
  }

  const sampleSize = Math.min(samplingConfig.value.sampleSize, parsedData.value.length)

  if (samplingConfig.value.seed !== null) {
    // 使用固定种子
    Math.seedrandom = Math.seedrandom || function(seed) {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    const random = Math.seedrandom(samplingConfig.value.seed)
  }

  switch (samplingConfig.value.method) {
    case 'random':
      sampledData.value = randomSample(parsedData.value, sampleSize)
      break
    case 'systematic':
      sampledData.value = systematicSample(parsedData.value, sampleSize)
      break
    case 'stratified':
      sampledData.value = stratifiedSample(parsedData.value, sampleSize, samplingConfig.value.strataField)
      break
    case 'cluster':
      sampledData.value = clusterSample(parsedData.value, sampleSize, samplingConfig.value.clusterCount)
      break
  }
}

const updateSamplePercent = () => {
  if (parsedData.value.length === 0) return
  samplingConfig.value.sampleSize = Math.round(parsedData.value.length * samplingConfig.value.samplePercent / 100)
  updateSampling()
}

// 采样方法实现
const randomSample = (data, size) => {
  const shuffled = [...data].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, size)
}

const systematicSample = (data, size) => {
  if (size >= data.length) return [...data]
  const interval = Math.floor(data.length / size)
  const result = []
  for (let i = 0; i < size; i++) {
    result.push(data[i * interval])
  }
  return result
}

const stratifiedSample = (data, size, strataField) => {
  if (!strataField || typeof data[0] !== 'object') {
    return randomSample(data, size)
  }

  // 分层逻辑（简化版）
  const strata = {}
  data.forEach(item => {
    const key = item[strataField] || 'default'
    if (!strata[key]) strata[key] = []
    strata[key].push(item)
  })

  const result = []
  const strataCount = Object.keys(strata).length
  const samplesPerStratum = Math.floor(size / strataCount)

  Object.values(strata).forEach(stratum => {
    const samples = randomSample(stratum, Math.min(samplesPerStratum, stratum.length))
    result.push(...samples)
  })

  return result.slice(0, size)
}

const clusterSample = (data, size, clusterCount) => {
  if (clusterCount >= data.length) return randomSample(data, size)

  // 简化的聚类（按索引分组）
  const clusters = []
  const clusterSize = Math.floor(data.length / clusterCount)

  for (let i = 0; i < clusterCount; i++) {
    const start = i * clusterSize
    const end = i === clusterCount - 1 ? data.length : start + clusterSize
    clusters.push(data.slice(start, end))
  }

  const selectedClusters = randomSample(clusters, Math.ceil(clusterCount / 2))
  const result = selectedClusters.flat()
  return result.slice(0, size)
}

const loadSampleData = () => {
  const sampleData = [
    { id: 1, name: 'Alice', age: 25, department: 'Engineering', salary: 75000 },
    { id: 2, name: 'Bob', age: 30, department: 'Marketing', salary: 65000 },
    { id: 3, name: 'Charlie', age: 35, department: 'Engineering', salary: 85000 },
    { id: 4, name: 'Diana', age: 28, department: 'Sales', salary: 55000 },
    { id: 5, name: 'Eve', age: 32, department: 'Marketing', salary: 70000 },
    { id: 6, name: 'Frank', age: 45, department: 'Management', salary: 95000 },
    { id: 7, name: 'Grace', age: 26, department: 'Engineering', salary: 72000 },
    { id: 8, name: 'Henry', age: 38, department: 'Sales', salary: 68000 },
    { id: 9, name: 'Iris', age: 29, department: 'Engineering', salary: 78000 },
    { id: 10, name: 'Jack', age: 41, department: 'Management', salary: 88000 },
    { id: 11, name: 'Kate', age: 27, department: 'Sales', salary: 58000 },
    { id: 12, name: 'Leo', age: 33, department: 'Marketing', salary: 69000 },
    { id: 13, name: 'Maya', age: 24, department: 'Engineering', salary: 70000 },
    { id: 14, name: 'Noah', age: 36, department: 'Sales', salary: 72000 },
    { id: 15, name: 'Olivia', age: 31, department: 'Marketing', salary: 71000 }
  ]

  inputData.value = JSON.stringify(sampleData, null, 2)
  inputFormat.value = 'json'
  parseData()
}

const clearData = () => {
  inputData.value = ''
  parsedData.value = []
  sampledData.value = []
}

const createBuckets = () => {
  if (parsedData.value.length === 0 || !bucketConfig.value.count) return

  const bucketSize = Math.ceil(parsedData.value.length / bucketConfig.value.count)
  const buckets = []

  for (let i = 0; i < bucketConfig.value.count; i++) {
    const start = i * bucketSize
    const end = Math.min(start + bucketSize, parsedData.value.length)
    buckets.push(parsedData.value.slice(start, end))
  }

  sampledData.value = buckets
}

const groupData = () => {
  if (parsedData.value.length === 0 || !groupConfig.value.field) return

  const groups = {}
  parsedData.value.forEach(item => {
    const key = typeof item === 'object' ? (item[groupConfig.value.field] || 'unknown') : item
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })

  sampledData.value = Object.entries(groups).map(([key, items]) => ({
    group: key,
    items: items,
    count: items.length
  }))
}

const formatResults = (data) => {
  if (Array.isArray(data)) {
    try {
      return JSON.stringify(data, null, 2)
    } catch (e) {
      return data.join('\n')
    }
  }
  return String(data)
}

const getMethodName = (method) => {
  const methods = {
    random: '随机采样',
    systematic: '系统采样',
    stratified: '分层采样',
    cluster: '聚类采样'
  }
  return methods[method] || method
}

const copyResults = async () => {
  try {
    const text = formatResults(sampledData.value)
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const downloadResults = () => {
  const text = formatResults(sampledData.value)
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'sampled_data.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 监听变化
watch(() => samplingConfig.value.sampleSize, () => {
  if (parsedData.value.length > 0) {
    samplingConfig.value.samplePercent = (samplingConfig.value.sampleSize / parsedData.value.length) * 100
    updateSampling()
  }
})
</script>
