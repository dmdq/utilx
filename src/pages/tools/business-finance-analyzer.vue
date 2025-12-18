<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">企业财务分析器 - 财务健康度评估</h1>
      <p class="text-muted-foreground">分析企业财务指标，包括流动比率、负债率、利润率等，提供财务健康度评估和经营建议。帮助企业管理者快速了解财务状况。</p>
    </div>

    <!-- 分析模式选择 -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="mode in analysisModes"
          :key="mode.id"
          @click="currentMode = mode.id"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            currentMode === mode.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          {{ mode.name }}
        </button>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">财务数据输入</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadExample"
            >
              示例数据
            </button>
          </div>
        </div>

        <!-- 基础财务数据 -->
        <div class="space-y-4">
          <!-- 资产负债表数据 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">资产负债表</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">流动资产 (万元)</label>
                <input
                  v-model.number="financeData.currentAssets"
                  @input="calculateRatios"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="500"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">流动负债 (万元)</label>
                <input
                  v-model.number="financeData.currentLiabilities"
                  @input="calculateRatios"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="300"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">总资产 (万元)</label>
                <input
                  v-model.number="financeData.totalAssets"
                  @input="calculateRatios"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="1000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">总负债 (万元)</label>
                <input
                  v-model.number="financeData.totalLiabilities"
                  @input="calculateRatios"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="600"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <!-- 损益表数据 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">损益表</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">营业收入 (万元)</label>
                <input
                  v-model.number="financeData.revenue"
                  @input="calculateRatios"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="2000"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">营业成本 (万元)</label>
                <input
                  v-model.number="financeData.costOfGoods"
                  @input="calculateRatios"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="1200"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">净利润 (万元)</label>
                <input
                  v-model.number="financeData.netProfit"
                  @input="calculateRatios"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="200"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">股东权益 (万元)</label>
                <input
                  v-model.number="financeData.shareholderEquity"
                  @input="calculateRatios"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="400"
                  class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <!-- 行业对比数据 -->
          <div class="bg-card rounded-lg p-4">
            <h3 class="text-lg font-semibold mb-4">行业对比</h3>

            <div>
              <label class="block text-sm font-medium mb-2">行业类型</label>
              <select
                v-model="selectedIndustry"
                @change="updateIndustryAverages"
                class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option v-for="industry in industries" :key="industry.id" :value="industry.id">
                  {{ industry.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 结果显示区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">分析结果</label>
          <div class="text-xs text-muted-foreground">
            {{ getCurrentTime() }}
          </div>
        </div>

        <!-- 财务健康度评分 -->
        <div class="bg-card rounded-lg p-6 mb-4">
          <h3 class="text-lg font-semibold mb-4">财务健康度评估</h3>

          <div class="text-center mb-4">
            <div class="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 mb-2"
                 :class="getHealthScoreColor()">
              <span class="text-3xl font-bold">{{ getHealthScore() }}</span>
            </div>
            <p class="text-sm text-muted-foreground">{{ getHealthScoreDescription() }}</p>
          </div>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex justify-between p-2 bg-muted/50 rounded">
              <span>流动性风险</span>
              <span :class="getRiskColor(riskLevels.liquidity)">{{ riskLevels.liquidity }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded">
              <span>偿债风险</span>
              <span :class="getRiskColor(riskLevels.solvency)">{{ riskLevels.solvency }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded">
              <span>盈利能力</span>
              <span :class="getPerformanceColor(performanceLevels.profitability)">{{ performanceLevels.profitability }}</span>
            </div>
            <div class="flex justify-between p-2 bg-muted/50 rounded">
              <span>运营效率</span>
              <span :class="getPerformanceColor(performanceLevels.efficiency)">{{ performanceLevels.efficiency }}</span>
            </div>
          </div>
        </div>

        <!-- 财务比率分析 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">财务比率分析</h3>

          <div class="space-y-3">
            <div v-for="ratio in financialRatios" :key="ratio.id" class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium">{{ ratio.name }}</span>
                  <span class="text-sm text-muted-foreground">{{ ratio.value }}{{ ratio.unit }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-300"
                    :class="getRatioBarColor(ratio)"
                    :style="{ width: ratio.percentage + '%' }"
                  ></div>
                </div>
                <div class="flex justify-between mt-1">
                  <span class="text-xs text-muted-foreground">行业平均: {{ ratio.industryAverage }}{{ ratio.unit }}</span>
                  <span class="text-xs" :class="ratio.value > ratio.industryAverage ? 'text-green-600' : 'text-red-600'">
                    {{ ratio.value > ratio.industryAverage ? '优于' : '低于' }}行业
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细分析报告 -->
    <div class="bg-card rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">详细分析报告</h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 优势分析 -->
        <div>
          <h4 class="font-medium mb-3 text-green-600">优势分析</h4>
          <ul class="space-y-2">
            <li v-for="strength in analysisResults.strengths" :key="strength"
                class="flex items-start gap-2 text-sm">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{{ strength }}</span>
            </li>
          </ul>
        </div>

        <!-- 风险提示 -->
        <div>
          <h4 class="font-medium mb-3 text-red-600">风险提示</h4>
          <ul class="space-y-2">
            <li v-for="risk in analysisResults.risks" :key="risk"
                class="flex items-start gap-2 text-sm">
              <AlertCircle class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>{{ risk }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 改进建议 -->
      <div class="mt-6">
        <h4 class="font-medium mb-3 text-blue-600">改进建议</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="suggestion in analysisResults.suggestions" :key="suggestion.id"
               class="p-4 bg-muted/50 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <component :is="suggestion.icon" class="w-4 h-4 text-blue-500" />
              <span class="font-medium text-sm">{{ suggestion.title }}</span>
            </div>
            <p class="text-xs text-muted-foreground">{{ suggestion.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具推荐 -->
    <RelatedTools :category="'finance'" :current-tool-id="'business-finance-analyzer'" />

    <!-- SEO内容 -->
    <SeoContent :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, AlertCircle, TrendingDown, DollarSign, Target } from 'lucide-vue-next'
import RelatedTools from '~/components/RelatedTools.vue'
import SeoContent from '~/components/SeoContent.vue'

// 分析模式
const analysisModes = [
  { id: 'basic', name: '基础分析' },
  { id: 'comprehensive', name: '综合分析' },
  { id: 'trend', name: '趋势分析' }
]

const currentMode = ref('basic')

// 财务数据
const financeData = reactive({
  currentAssets: 0,
  currentLiabilities: 0,
  totalAssets: 0,
  totalLiabilities: 0,
  revenue: 0,
  costOfGoods: 0,
  netProfit: 0,
  shareholderEquity: 0
})

// 行业数据
const industries = [
  { id: 'manufacturing', name: '制造业', currentRatioAvg: 1.5, debtRatioAvg: 0.6, profitMarginAvg: 0.05 },
  { id: 'retail', name: '零售业', currentRatioAvg: 1.2, debtRatioAvg: 0.7, profitMarginAvg: 0.03 },
  { id: 'technology', name: '科技业', currentRatioAvg: 2.0, debtRatioAvg: 0.3, profitMarginAvg: 0.15 },
  { id: 'service', name: '服务业', currentRatioAvg: 1.3, debtRatioAvg: 0.5, profitMarginAvg: 0.08 }
]

const selectedIndustry = ref('manufacturing')

// 财务比率
const financialRatios = ref([
  {
    id: 'currentRatio',
    name: '流动比率',
    value: 0,
    unit: '',
    industryAverage: 1.5,
    percentage: 0,
    optimal: { min: 1.2, max: 2.0 }
  },
  {
    id: 'debtRatio',
    name: '资产负债率',
    value: 0,
    unit: '%',
    industryAverage: 60,
    percentage: 0,
    optimal: { min: 30, max: 70 }
  },
  {
    id: 'profitMargin',
    name: '销售净利率',
    value: 0,
    unit: '%',
    industryAverage: 5,
    percentage: 0,
    optimal: { min: 5, max: 20 }
  },
  {
    id: 'returnOnEquity',
    name: '净资产收益率',
    value: 0,
    unit: '%',
    industryAverage: 10,
    percentage: 0,
    optimal: { min: 8, max: 25 }
  }
])

// 风险等级
const riskLevels = reactive({
  liquidity: '低',
  solvency: '低'
})

const performanceLevels = reactive({
  profitability: '中等',
  efficiency: '中等'
})

// 分析结果
const analysisResults = reactive({
  strengths: [],
  risks: [],
  suggestions: []
})

// 计算财务比率
const calculateRatios = () => {
  // 流动比率
  const currentRatio = financeData.currentLiabilities > 0
    ? (financeData.currentAssets / financeData.currentLiabilities).toFixed(2)
    : 0
  financialRatios.value[0].value = parseFloat(currentRatio)

  // 资产负债率
  const debtRatio = financeData.totalAssets > 0
    ? ((financeData.totalLiabilities / financeData.totalAssets) * 100).toFixed(1)
    : 0
  financialRatios.value[1].value = parseFloat(debtRatio)

  // 销售净利率
  const profitMargin = financeData.revenue > 0
    ? ((financeData.netProfit / financeData.revenue) * 100).toFixed(1)
    : 0
  financialRatios.value[2].value = parseFloat(profitMargin)

  // 净资产收益率
  const returnOnEquity = financeData.shareholderEquity > 0
    ? ((financeData.netProfit / financeData.shareholderEquity) * 100).toFixed(1)
    : 0
  financialRatios.value[3].value = parseFloat(returnOnEquity)

  // 更新行业对比数据
  updateIndustryAverages()

  // 计算百分比
  financialRatios.value.forEach(ratio => {
    if (ratio.id === 'currentRatio') {
      ratio.percentage = Math.min((ratio.value / 3) * 100, 100)
    } else {
      ratio.percentage = Math.min((ratio.value / 30) * 100, 100)
    }
  })

  // 更新风险评估
  updateRiskAssessment()

  // 生成分析报告
  generateAnalysisReport()
}

// 更新行业平均值
const updateIndustryAverages = () => {
  const industry = industries.find(i => i.id === selectedIndustry.value)
  if (industry) {
    financialRatios.value[0].industryAverage = industry.currentRatioAvg
    financialRatios.value[1].industryAverage = industry.debtRatioAvg * 100
    financialRatios.value[2].industryAverage = industry.profitMarginAvg * 100
    financialRatios.value[3].industryAverage = (industry.profitMarginAvg * 1.5) * 100
  }
}

// 更新风险评估
const updateRiskAssessment = () => {
  // 流动性风险评估
  const currentRatio = financialRatios.value[0].value
  if (currentRatio >= 1.5) {
    riskLevels.liquidity = '低'
  } else if (currentRatio >= 1.0) {
    riskLevels.liquidity = '中等'
  } else {
    riskLevels.liquidity = '高'
  }

  // 偿债风险评估
  const debtRatio = financialRatios.value[1].value
  if (debtRatio <= 50) {
    riskLevels.solvency = '低'
  } else if (debtRatio <= 70) {
    riskLevels.solvency = '中等'
  } else {
    riskLevels.solvency = '高'
  }

  // 盈利能力评估
  const profitMargin = financialRatios.value[2].value
  if (profitMargin >= 10) {
    performanceLevels.profitability = '优秀'
  } else if (profitMargin >= 5) {
    performanceLevels.profitability = '良好'
  } else if (profitMargin >= 0) {
    performanceLevels.profitability = '中等'
  } else {
    performanceLevels.profitability = '较差'
  }

  // 运营效率评估
  const returnOnEquity = financialRatios.value[3].value
  if (returnOnEquity >= 15) {
    performanceLevels.efficiency = '优秀'
  } else if (returnOnEquity >= 8) {
    performanceLevels.efficiency = '良好'
  } else if (returnOnEquity >= 0) {
    performanceLevels.efficiency = '中等'
  } else {
    performanceLevels.efficiency = '较差'
  }
}

// 生成分析报告
const generateAnalysisReport = () => {
  analysisResults.strengths = []
  analysisResults.risks = []
  analysisResults.suggestions = []

  // 分析优势
  if (financialRatios.value[0].value >= 1.5) {
    analysisResults.strengths.push('流动性充足，短期偿债能力强')
  }
  if (financialRatios.value[1].value <= 50) {
    analysisResults.strengths.push('负债结构合理，财务风险较低')
  }
  if (financialRatios.value[2].value >= 8) {
    analysisResults.strengths.push('盈利能力良好，市场竞争力强')
  }
  if (financialRatios.value[3].value >= 12) {
    analysisResults.strengths.push('资产运营效率高，投资回报优良')
  }

  // 分析风险
  if (financialRatios.value[0].value < 1.0) {
    analysisResults.risks.push('流动比率偏低，存在短期偿债压力')
  }
  if (financialRatios.value[1].value > 70) {
    analysisResults.risks.push('资产负债率过高，财务杠杆风险较大')
  }
  if (financialRatios.value[2].value < 3) {
    analysisResults.risks.push('盈利能力偏低，需要提升经营效率')
  }
  if (financialRatios.value[3].value < 5) {
    analysisResults.risks.push('净资产收益率偏低，资产利用效率有待改善')
  }

  // 生成建议
  analysisResults.suggestions = [
    {
      id: 1,
      title: '优化资金管理',
      description: '加强应收账款管理，提高资金周转效率',
      icon: DollarSign
    },
    {
      id: 2,
      title: '控制成本结构',
      description: '优化成本结构，提高毛利率水平',
      icon: TrendingDown
    },
    {
      id: 3,
      title: '提升盈利能力',
      description: '拓展高附加值业务，提升整体盈利水平',
      icon: Target
    }
  ]
}

// 获取健康度评分
const getHealthScore = () => {
  let score = 0
  let weights = [25, 25, 25, 25] // 各比率权重

  financialRatios.value.forEach((ratio, index) => {
    const { optimal } = ratio
    let ratioScore = 0

    if (ratio.id === 'currentRatio') {
      if (ratio.value >= optimal.min && ratio.value <= optimal.max) {
        ratioScore = 100
      } else if (ratio.value < optimal.min) {
        ratioScore = (ratio.value / optimal.min) * 100
      } else {
        ratioScore = 100 - ((ratio.value - optimal.max) / optimal.max) * 50
      }
    } else {
      if (ratio.value >= optimal.min && ratio.value <= optimal.max) {
        ratioScore = 100
      } else if (ratio.value < optimal.min) {
        ratioScore = (ratio.value / optimal.min) * 100
      } else {
        ratioScore = 100 - ((ratio.value - optimal.max) / optimal.max) * 30
      }
    }

    score += ratioScore * weights[index] / 100
  })

  return Math.round(score)
}

// 获取健康度颜色
const getHealthScoreColor = () => {
  const score = getHealthScore()
  if (score >= 80) return 'border-green-500 text-green-600'
  if (score >= 60) return 'border-yellow-500 text-yellow-600'
  if (score >= 40) return 'border-orange-500 text-orange-600'
  return 'border-red-500 text-red-600'
}

// 获取健康度描述
const getHealthScoreDescription = () => {
  const score = getHealthScore()
  if (score >= 80) return '财务状况优秀'
  if (score >= 60) return '财务状况良好'
  if (score >= 40) return '财务状况一般'
  return '财务状况较差'
}

// 获取风险颜色
const getRiskColor = (level) => {
  switch (level) {
    case '低': return 'text-green-600'
    case '中等': return 'text-yellow-600'
    case '高': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// 获取表现颜色
const getPerformanceColor = (level) => {
  switch (level) {
    case '优秀': return 'text-green-600'
    case '良好': return 'text-blue-600'
    case '中等': return 'text-yellow-600'
    case '较差': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

// 获取比率条颜色
const getRatioBarColor = (ratio) => {
  const { optimal, value } = ratio

  if (ratio.id === 'currentRatio') {
    if (value >= optimal.min && value <= optimal.max) return 'bg-green-500'
    if (value < optimal.min) return 'bg-red-500'
    return 'bg-yellow-500'
  } else {
    if (value >= optimal.min && value <= optimal.max) return 'bg-green-500'
    if (value < optimal.min) return 'bg-red-500'
    return 'bg-yellow-500'
  }
}

// 清空输入
const clearInput = () => {
  Object.keys(financeData).forEach(key => {
    financeData[key] = 0
  })
  calculateRatios()
}

// 加载示例数据
const loadExample = () => {
  financeData.currentAssets = 850
  financeData.currentLiabilities = 420
  financeData.totalAssets = 1800
  financeData.totalLiabilities = 900
  financeData.revenue = 3200
  financeData.costOfGoods = 2200
  financeData.netProfit = 320
  financeData.shareholderEquity = 900
  calculateRatios()
}

// 获取当前时间
const getCurrentTime = () => {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化
loadExample()
</script>