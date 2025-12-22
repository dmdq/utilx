<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">统计学计算器</h1>
      <p class="text-muted-foreground mb-6">数据分析工具，支持描述统计、回归分析、概率分布等统计计算</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：数据输入和基础统计 -->
      <div class="space-y-6">
        <!-- 数据输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">数据输入</h3>
            <div class="flex gap-2">
              <button @click="generateSampleData" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                生成示例
              </button>
              <button @click="clearData" class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90">
                清空
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-2">输入数据 (用逗号、空格或换行分隔)</label>
              <textarea
                v-model="rawData"
                @input="parseData"
                class="w-full px-3 py-2 border rounded-lg"
                rows="6"
                placeholder="例如: 23, 45, 67, 89, 12, 34, 56, 78, 90, 43"
              ></textarea>
            </div>

            <div class="flex gap-2">
              <button @click="addDataPoint" class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                添加数据点
              </button>
              <input
                v-model.number="newDataPoint"
                type="number"
                step="0.01"
                class="flex-1 px-3 py-1 border rounded text-sm"
                placeholder="输入单个数值"
              />
            </div>
          </div>
        </div>

        <!-- 基础统计量 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">描述统计</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm text-muted-foreground">样本数量</div>
              <div class="text-xl font-semibold">{{ basicStats.count }}</div>
            </div>
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm text-muted-foreground">均值</div>
              <div class="text-xl font-semibold">{{ formatNumber(basicStats.mean) }}</div>
            </div>
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm text-muted-foreground">中位数</div>
              <div class="text-xl font-semibold">{{ formatNumber(basicStats.median) }}</div>
            </div>
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm text-muted-foreground">众数</div>
              <div class="text-xl font-semibold">{{ basicStats.mode.join(', ') || '无' }}</div>
            </div>
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm text-muted-foreground">标准差</div>
              <div class="text-xl font-semibold">{{ formatNumber(basicStats.stdDev) }}</div>
            </div>
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm text-muted-foreground">方差</div>
              <div class="text-xl font-semibold">{{ formatNumber(basicStats.variance) }}</div>
            </div>
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm text-muted-foreground">极差</div>
              <div class="text-xl font-semibold">{{ formatNumber(basicStats.range) }}</div>
            </div>
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm text-muted-foreground">四分位距</div>
              <div class="text-xl font-semibold">{{ formatNumber(basicStats.iqr) }}</div>
            </div>
          </div>

          <!-- 百分位数 -->
          <div class="mt-4">
            <h4 class="font-medium mb-2">百分位数</h4>
            <div class="grid grid-cols-4 gap-2 text-sm">
              <div>P25: {{ formatNumber(percentiles.p25) }}</div>
              <div>P50: {{ formatNumber(percentiles.p50) }}</div>
              <div>P75: {{ formatNumber(percentiles.p75) }}</div>
              <div>P90: {{ formatNumber(percentiles.p90) }}</div>
            </div>
          </div>
        </div>

        <!-- 数据分布分析 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">分布分析</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">偏度 (Skewness)</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-muted rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all"
                    :style="{ width: `${Math.abs(distribution.skewness) * 20}%` }"
                  ></div>
                </div>
                <span class="text-sm font-medium">{{ formatNumber(distribution.skewness) }}</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ distribution.skewness > 0 ? '右偏分布' : distribution.skewness < 0 ? '左偏分布' : '对称分布' }}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">峰度 (Kurtosis)</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-muted rounded-full h-2">
                  <div
                    class="bg-green-500 h-2 rounded-full transition-all"
                    :style="{ width: `${Math.abs(distribution.kurtosis - 3) * 10}%` }"
                  ></div>
                </div>
                <span class="text-sm font-medium">{{ formatNumber(distribution.kurtosis) }}</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ distribution.kurtosis > 3 ? '尖峰分布' : distribution.kurtosis < 3 ? '平峰分布' : '正态峰度' }}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">变异系数 (CV)</label>
              <div class="text-sm font-medium">{{ formatNumber(distribution.cv) }}%</div>
              <div class="text-xs text-muted-foreground">
                {{ distribution.cv < 15 ? '变异很小' : distribution.cv < 30 ? '变异中等' : '变异很大' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：高级分析和可视化 -->
      <div class="space-y-6">
        <!-- 频率分布表 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">频率分布</h3>
            <div class="flex gap-2">
              <input
                v-model.number="binCount"
                type="number"
                min="3"
                max="20"
                class="w-16 px-2 py-1 border rounded text-sm"
                placeholder="组数"
              />
              <button @click="updateFrequency" class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                更新
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">区间</th>
                  <th class="text-center p-2">频数</th>
                  <th class="text-center p-2">频率</th>
                  <th class="text-center p-2">累积频率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bin, index) in frequencyDistribution" :key="index" class="border-b">
                  <td class="p-2">{{ formatRange(bin.min, bin.max) }}</td>
                  <td class="text-center p-2">{{ bin.count }}</td>
                  <td class="text-center p-2">{{ formatPercent(bin.frequency) }}</td>
                  <td class="text-center p-2">{{ formatPercent(bin.cumulative) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 概率分布分析 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">概率分布检验</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">正态性检验 (Shapiro-Wilk)</label>
              <div class="p-3 bg-secondary rounded">
                <div class="flex justify-between items-center">
                  <span class="text-sm">W统计量: {{ formatNumber(normalityTest.statistic) }}</span>
                  <span class="text-sm">P值: {{ formatNumber(normalityTest.pValue) }}</span>
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ normalityTest.pValue > 0.05 ? '数据符合正态分布' : '数据不符合正态分布' }}
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">置信区间 (95%)</label>
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm">均值: [{{ formatNumber(confidenceInterval.lower) }}, {{ formatNumber(confidenceInterval.upper) }}]</div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">异常值检测</label>
              <div class="space-y-2">
                <div v-if="outliers.length > 0" class="p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <div class="text-sm font-medium text-destructive">发现 {{ outliers.length }} 个异常值:</div>
                  <div class="text-sm">{{ outliers.join(', ') }}</div>
                </div>
                <div v-else class="p-3 bg-green-50 border border-green-200 rounded">
                  <div class="text-sm text-green-700">未发现异常值</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 回归分析 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">回归分析</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">X变量数据</label>
              <textarea
                v-model="xData"
                class="w-full px-3 py-2 border rounded-lg"
                rows="3"
                placeholder="输入X变量的数值，用逗号分隔"
              ></textarea>
            </div>
            <button @click="calculateRegression" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              计算线性回归
            </button>

            <div v-if="regression.hasResult" class="space-y-3">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm font-medium mb-2">回归方程: Y = {{ regression.slope }}X + {{ regression.intercept }}</div>
                <div class="text-xs text-muted-foreground">
                  R² = {{ formatNumber(regression.r2) }} ({{ regression.r2 > 0.7 ? '强相关' : regression.r2 > 0.3 ? '中等相关' : '弱相关' }})
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>斜率: {{ formatNumber(regression.slope) }}</div>
                <div>截距: {{ formatNumber(regression.intercept) }}</div>
                <div>相关系数: {{ formatNumber(regression.correlation) }}</div>
                <div>标准误差: {{ formatNumber(regression.stdError) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 假设检验 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">假设检验</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">t检验</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model.number="hypothesisTest.testValue"
                  type="number"
                  step="0.01"
                  class="px-3 py-1 border rounded text-sm"
                  placeholder="检验值"
                />
                <select v-model="hypothesisTest.type" class="px-3 py-1 border rounded text-sm">
                  <option value="two-tailed">双尾检验</option>
                  <option value="left-tailed">左尾检验</option>
                  <option value="right-tailed">右尾检验</option>
                </select>
              </div>
              <button @click="performTTest" class="w-full mt-2 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                执行t检验
              </button>
            </div>

            <div v-if="hypothesisTest.hasResult" class="p-3 bg-secondary rounded">
              <div class="text-sm space-y-1">
                <div>t统计量: {{ formatNumber(hypothesisTest.tStatistic) }}</div>
                <div>p值: {{ formatNumber(hypothesisTest.pValue) }}</div>
                <div class="font-medium">
                  {{ hypothesisTest.pValue < 0.05 ? '拒绝原假设' : '不能拒绝原假设' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('统计学计算器')

// 数据存储
const rawData = ref('')
const parsedData = ref([])
const xData = ref('')

// 分析参数
const binCount = ref(10)

// 计算结果
const basicStats = ref({
  count: 0,
  mean: 0,
  median: 0,
  mode: [],
  stdDev: 0,
  variance: 0,
  range: 0,
  iqr: 0
})

const percentiles = ref({
  p25: 0,
  p50: 0,
  p75: 0,
  p90: 0
})

const distribution = ref({
  skewness: 0,
  kurtosis: 0,
  cv: 0
})

const frequencyDistribution = ref([])

const normalityTest = ref({
  statistic: 0,
  pValue: 0
})

const confidenceInterval = ref({
  lower: 0,
  upper: 0
})

const outliers = ref([])

const regression = ref({
  hasResult: false,
  slope: 0,
  intercept: 0,
  r2: 0,
  correlation: 0,
  stdError: 0
})

const hypothesisTest = ref({
  testValue: 0,
  type: 'two-tailed',
  tStatistic: 0,
  pValue: 0,
  hasResult: false
})

const newDataPoint = ref('')

// 数据处理
const parseData = () => {
  const values = rawData.value
    .split(/[\s,，]+/)
    .map(val => parseFloat(val.trim()))
    .filter(val => !isNaN(val))

  parsedData.value = values
  calculateAllStats()
}

const addDataPoint = () => {
  if (newDataPoint.value !== null && !isNaN(newDataPoint.value)) {
    if (rawData.value) {
      rawData.value += ', ' + newDataPoint.value
    } else {
      rawData.value = newDataPoint.value.toString()
    }
    newDataPoint.value = ''
    parseData()
  }
}

const generateSampleData = () => {
  const sampleSize = 50
  const sampleData = []

  // 生成正态分布数据
  for (let i = 0; i < sampleSize; i++) {
    // Box-Muller变换生成正态分布随机数
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    sampleData.push((z * 15 + 50).toFixed(2)) // 均值50，标准差15
  }

  rawData.value = sampleData.join(', ')
  parseData()
}

const clearData = () => {
  rawData.value = ''
  parsedData.value = []
  resetResults()
}

// 统计计算
const calculateAllStats = () => {
  if (parsedData.value.length === 0) {
    resetResults()
    return
  }

  calculateBasicStats()
  calculatePercentiles()
  calculateDistribution()
  updateFrequency()
  calculateNormalityTest()
  calculateConfidenceInterval()
  detectOutliers()
}

const calculateBasicStats = () => {
  const data = parsedData.value.sort((a, b) => a - b)
  const n = data.length

  basicStats.value.count = n

  // 均值
  basicStats.value.mean = data.reduce((sum, val) => sum + val, 0) / n

  // 中位数
  if (n % 2 === 0) {
    basicStats.value.median = (data[n/2 - 1] + data[n/2]) / 2
  } else {
    basicStats.value.median = data[Math.floor(n/2)]
  }

  // 众数
  const frequency = {}
  data.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1
  })
  const maxFreq = Math.max(...Object.values(frequency))
  basicStats.value.mode = Object.keys(frequency)
    .filter(key => frequency[key] === maxFreq)
    .map(Number)

  // 方差和标准差
  const squaredDiffs = data.map(val => Math.pow(val - basicStats.value.mean, 2))
  basicStats.value.variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / n
  basicStats.value.stdDev = Math.sqrt(basicStats.value.variance)

  // 极差
  basicStats.value.range = data[n - 1] - data[0]

  // 四分位距
  const q1 = calculatePercentile(data, 25)
  const q3 = calculatePercentile(data, 75)
  basicStats.value.iqr = q3 - q1
}

const calculatePercentiles = () => {
  const data = parsedData.value.sort((a, b) => a - b)

  percentiles.value.p25 = calculatePercentile(data, 25)
  percentiles.value.p50 = calculatePercentile(data, 50)
  percentiles.value.p75 = calculatePercentile(data, 75)
  percentiles.value.p90 = calculatePercentile(data, 90)
}

const calculatePercentile = (sortedData, percentile) => {
  const index = (percentile / 100) * (sortedData.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)

  if (lower === upper) {
    return sortedData[lower]
  }

  const weight = index - lower
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight
}

const calculateDistribution = () => {
  const data = parsedData.value
  const n = data.length
  const mean = basicStats.value.mean
  const stdDev = basicStats.value.stdDev

  // 偏度
  const skewnessNumerator = data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0)
  distribution.value.skewness = skewnessNumerator / n

  // 峰度
  const kurtosisNumerator = data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0)
  distribution.value.kurtosis = (kurtosisNumerator / n) - 3

  // 变异系数
  distribution.value.cv = mean !== 0 ? (stdDev / mean) * 100 : 0
}

// 频率分布
const updateFrequency = () => {
  if (parsedData.value.length === 0) return

  const data = parsedData.value.sort((a, b) => a - b)
  const min = data[0]
  const max = data[data.length - 1]
  const binWidth = (max - min) / binCount.value

  const bins = []
  for (let i = 0; i < binCount.value; i++) {
    const binMin = min + i * binWidth
    const binMax = i === binCount.value - 1 ? max : min + (i + 1) * binWidth
    const count = data.filter(val => val >= binMin && val < binMax).length +
                   (i === binCount.value - 1 && data.some(val => val === max) ? 1 : 0)

    bins.push({
      min: binMin,
      max: binMax,
      count,
      frequency: count / data.length,
      cumulative: bins.reduce((sum, bin) => sum + bin.count, count) / data.length
    })
  }

  frequencyDistribution.value = bins
}

// 正态性检验（简化版）
const calculateNormalityTest = () => {
  const data = parsedData.value
  const n = data.length

  // 简化的正态性检验（实际应使用Shapiro-Wilk或Kolmogorov-Smirnov检验）
  const skewness = Math.abs(distribution.value.skewness)
  const kurtosis = Math.abs(distribution.value.kurtosis)

  // 基于偏度和峰度的简单判断
  normalityTest.value.statistic = Math.sqrt(skewness * skewness + kurtosis * kurtosis)
  normalityTest.value.pValue = Math.exp(-normalityTest.value.statistic)
}

// 置信区间
const calculateConfidenceInterval = () => {
  const data = parsedData.value
  const n = data.length
  const mean = basicStats.value.mean
  const stdDev = basicStats.value.stdDev
  const tValue = 1.96 // 简化的t值，实际应根据自由度查表

  const marginError = tValue * (stdDev / Math.sqrt(n))
  confidenceInterval.value.lower = mean - marginError
  confidenceInterval.value.upper = mean + marginError
}

// 异常值检测（IQR方法）
const detectOutliers = () => {
  const data = parsedData.value.sort((a, b) => a - b)
  const q1 = percentiles.value.p25
  const q3 = percentiles.value.p75
  const iqr = q3 - q1

  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  outliers.value = data.filter(val => val < lowerBound || val > upperBound)
}

// 回归分析
const calculateRegression = () => {
  const xValues = xData.value
    .split(/[\s,，]+/)
    .map(val => parseFloat(val.trim()))
    .filter(val => !isNaN(val))

  const yValues = parsedData.value

  if (xValues.length !== yValues.length || xValues.length < 2) {
    alert('X和Y数据数量不匹配或数据不足')
    return
  }

  const n = xValues.length
  const sumX = xValues.reduce((sum, val) => sum + val, 0)
  const sumY = yValues.reduce((sum, val) => sum + val, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, val) => sum + val * val, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // 计算相关系数
  const meanX = sumX / n
  const meanY = sumY / n
  const numerator = xValues.reduce((sum, x, i) => sum + (x - meanX) * (yValues[i] - meanY), 0)
  const denominatorX = xValues.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0)
  const denominatorY = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0)
  const correlation = numerator / Math.sqrt(denominatorX * denominatorY)

  // R²
  const r2 = correlation * correlation

  // 标准误差
  const predicted = xValues.map(x => slope * x + intercept)
  const residuals = yValues.map((y, i) => y - predicted[i])
  const sumSquaredResiduals = residuals.reduce((sum, res) => sum + res * res, 0)
  const stdError = Math.sqrt(sumSquaredResiduals / (n - 2))

  regression.value = {
    hasResult: true,
    slope,
    intercept,
    r2,
    correlation,
    stdError
  }
}

// t检验
const performTTest = () => {
  const data = parsedData.value
  const n = data.length
  const mean = basicStats.value.mean
  const stdDev = basicStats.value.stdDev

  // 计算t统计量
  const standardError = stdDev / Math.sqrt(n)
  const tStatistic = (mean - hypothesisTest.value.testValue) / standardError

  // 简化的p值计算（实际应查t分布表）
  const tAbs = Math.abs(tStatistic)
  let pValue

  if (hypothesisTest.value.type === 'two-tailed') {
    pValue = 2 * (1 - normalCDF(tAbs))
  } else if (hypothesisTest.value.type === 'right-tailed') {
    pValue = 1 - normalCDF(tStatistic)
  } else {
    pValue = normalCDF(tStatistic)
  }

  hypothesisTest.value = {
    ...hypothesisTest.value,
    tStatistic,
    pValue,
    hasResult: true
  }
}

// 辅助函数
const normalCDF = (x) => {
  // 标准正态分布累积分布函数近似
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

const erf = (x) => {
  // 误差函数近似
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

const formatNumber = (num) => {
  return Number.isFinite(num) ? num.toFixed(4) : 'N/A'
}

const formatPercent = (num) => {
  return (num * 100).toFixed(2) + '%'
}

const formatRange = (min, max) => {
  return `[${formatNumber(min)}, ${formatNumber(max)})`
}

const resetResults = () => {
  basicStats.value = {
    count: 0,
    mean: 0,
    median: 0,
    mode: [],
    stdDev: 0,
    variance: 0,
    range: 0,
    iqr: 0
  }

  frequencyDistribution.value = []
  outliers.value = []
  regression.value.hasResult = false
  hypothesisTest.value.hasResult = false
}

// 初始化
generateSampleData()
</script>

<style scoped>
.matrix-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.matrix-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>