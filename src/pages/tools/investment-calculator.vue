<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calculator, TrendingUp, PieChart, BarChart3, Info, Target, AlertCircle, FileText, Shield, DollarSign } from 'lucide-vue-next'

// 设置页面元数据
useHead({
  title: '理财收益计算器 - 有条工具',
  meta: [
    { name: 'description', content: '专业的理财收益计算工具，支持定期存款、基金、债券、理财等多种投资方式，提供收益计算、风险评估和投资组合优化建议。' },
    { name: 'keywords', content: '理财计算,收益计算,基金,债券,定期存款,投资收益,理财计算器,投资回报率' }
  ]
})

// 状态管理
const activeTab = ref('calculator')
const calculationType = ref('single') // single, regular, portfolio

// 投资产品类型
const productTypes = [
  { id: 'fixed_deposit', name: '定期存款', risk: 'low', minRate: 1.5, maxRate: 3.5, interestType: 'simple' },
  { id: 'fund', name: '基金投资', risk: 'high', minRate: 5, maxRate: 15, interestType: 'compound' },
  { id: 'wealth_management', name: '银行理财', risk: 'medium', minRate: 3, maxRate: 6, interestType: 'compound' },
  { id: 'bond', name: '债券投资', risk: 'low', minRate: 2, maxRate: 5, interestType: 'simple' },
  { id: 'stock', name: '股票投资', risk: 'high', minRate: 8, maxRate: 25, interestType: 'compound' }
]

// 基础参数
const selectedProduct = ref('fixed_deposit')
const principal = ref(100000)
const annualRate = ref(3.5)
const investmentPeriod = ref(12) // 月数
const compoundingFrequency = ref(12) // 复利频率

// 定投参数
const regularAmount = ref(5000) // 每月定投金额
const regularFrequency = ref('monthly') // monthly, quarterly, yearly

// 组合投资参数
const portfolio = ref([
  { product: 'fixed_deposit', amount: 50000, rate: 2.5 },
  { product: 'fund', amount: 30000, rate: 8 },
  { product: 'bond', amount: 20000, rate: 4 }
])

// 高级参数
const taxRate = ref(0) // 税率
const inflationRate = ref(2.5) // 通胀率
const managementFee = ref(0) // 管理费率

// 计算结果
const results = ref(null)
const showResults = ref(false)
const chartData = ref(null)

// 计算单笔投资收益
const calculateSingleInvestment = () => {
  const rate = annualRate.value / 100
  const years = investmentPeriod.value / 12
  const frequency = compoundingFrequency.value

  let totalAmount = 0
  let totalInterest = 0

  const product = productTypes.find(p => p.id === selectedProduct.value)

  if (product && product.interestType === 'simple') {
    // 单利计算
    totalInterest = principal.value * rate * years
    totalAmount = principal.value + totalInterest
  } else {
    // 复利计算
    totalAmount = principal.value * Math.pow(1 + rate / frequency, frequency * years)
    totalInterest = totalAmount - principal.value
  }

  // 扣除税收
  const tax = totalInterest * (taxRate.value / 100)
  const afterTaxInterest = totalInterest - tax
  const afterTaxAmount = principal.value + afterTaxInterest

  // 实际收益（考虑通胀）
  const realInterestRate = (1 + rate) / (1 + inflationRate.value / 100) - 1
  const realAmount = principal.value * Math.pow(1 + realInterestRate, years)
  const realInterest = realAmount - principal.value

  return {
    principal,
    totalInterest,
    totalAmount,
    tax,
    afterTaxInterest,
    afterTaxAmount,
    realInterest,
    realAmount,
    annualizedReturn: ((afterTaxAmount / principal.value) ** (1 / years) - 1) * 100
  }
}

// 计算定投收益
const calculateRegularInvestment = () => {
  const annualRateDecimal = annualRate.value / 100
  const monthlyRate = annualRateDecimal / 12
  const months = investmentPeriod.value
  const monthlyPayment = regularAmount.value

  let totalInvested = 0
  let finalAmount = 0
  let totalInterest = 0

  if (regularFrequency.value === 'monthly') {
    totalInvested = monthlyPayment * months

    if (monthlyRate === 0) {
      finalAmount = totalInvested
      totalInterest = 0
    } else {
      finalAmount = monthlyPayment * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
      totalInterest = finalAmount - totalInvested
    }
  } else if (regularFrequency.value === 'quarterly') {
    const quarterlyRate = annualRateDecimal / 4
    const quarters = Math.floor(months / 3)
    const quarterlyPayment = monthlyPayment * 3

    totalInvested = quarterlyPayment * quarters

    if (quarterlyRate === 0) {
      finalAmount = totalInvested
      totalInterest = 0
    } else {
      finalAmount = quarterlyPayment * (Math.pow(1 + quarterlyRate, quarters) - 1) / quarterlyRate
      totalInterest = finalAmount - totalInvested
    }
  } else if (regularFrequency.value === 'yearly') {
    const years = Math.floor(months / 12)
    const yearlyPayment = monthlyPayment * 12

    totalInvested = yearlyPayment * years

    if (annualRateDecimal === 0) {
      finalAmount = totalInvested
      totalInterest = 0
    } else {
      finalAmount = yearlyPayment * (Math.pow(1 + annualRateDecimal, years) - 1) / annualRateDecimal
      totalInterest = finalAmount - totalInvested
    }
  }

  // 扣除税收
  const tax = totalInterest * (taxRate.value / 100)
  const afterTaxInterest = totalInterest - tax
  const afterTaxAmount = totalInvested + afterTaxInterest

  return {
    totalInvested,
    totalInterest,
    finalAmount,
    tax,
    afterTaxInterest,
    afterTaxAmount,
    totalPayments: regularFrequency.value === 'monthly' ? months :
                   regularFrequency.value === 'quarterly' ? Math.floor(months / 3) :
                   Math.floor(months / 12),
    returnRate: ((afterTaxAmount / totalInvested - 1) * 100).toFixed(2)
  }
}

// 计算组合投资收益
const calculatePortfolio = () => {
  const totalInvestment = portfolio.value.reduce((sum, item) => sum + item.amount, 0)
  let totalValue = 0
  let totalReturn = 0

  const portfolioResults = portfolio.value.map(item => {
    const rate = item.rate / 100
    const years = investmentPeriod.value / 12
    const product = productTypes.find(p => p.id === item.product)

    let itemValue = 0
    let itemReturn = 0

    if (product && product.interestType === 'simple') {
      itemReturn = item.amount * rate * years
      itemValue = item.amount + itemReturn
    } else {
      itemValue = item.amount * Math.pow(1 + rate, years)
      itemReturn = itemValue - item.amount
    }

    totalValue += itemValue
    totalReturn += itemReturn

    return {
      ...item,
      value: itemValue,
      return: itemReturn,
      returnRate: (itemReturn / item.amount * 100).toFixed(2),
      weight: (item.amount / totalInvestment * 100).toFixed(1)
    }
  })

  // 计算组合收益率
  const portfolioReturnRate = (totalReturn / totalInvestment * 100).toFixed(2)

  // 风险评估
  const riskScore = calculatePortfolioRisk()

  return {
    totalInvestment,
    totalValue,
    totalReturn,
    portfolioReturnRate,
    riskScore,
    items: portfolioResults
  }
}

// 计算组合风险评分
const calculatePortfolioRisk = () => {
  let riskScore = 0

  portfolio.value.forEach(item => {
    const product = productTypes.find(p => p.id === item.product)
    if (product) {
      const weight = item.amount / portfolio.value.reduce((sum, i) => sum + i.amount, 0)
      if (product.risk === 'low') riskScore += weight * 1
      else if (product.risk === 'medium') riskScore += weight * 2
      else if (product.risk === 'high') riskScore += weight * 3
    }
  })

  return Math.round(riskScore * 10) / 10
}

// 计算目标反推
const calculateTargetGoal = () => {
  const targetAmount = principal.value // 这里使用principal作为目标金额
  const years = investmentPeriod.value / 12
  const annualRateDecimal = annualRate.value / 100

  // 计算需要的初始本金
  const requiredPrincipal = targetAmount / Math.pow(1 + annualRateDecimal, years)

  // 计算需要的月定投金额
  const monthlyRate = annualRateDecimal / 12
  const months = years * 12
  let requiredMonthly = 0

  if (monthlyRate > 0) {
    requiredMonthly = targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1)
  } else {
    requiredMonthly = targetAmount / months
  }

  return {
    requiredPrincipal,
    requiredMonthly,
    years,
    monthlyRate
  }
}

// 执行计算
const performCalculation = () => {
  try {
    let calculationResults = null

    switch (calculationType.value) {
      case 'single':
        calculationResults = calculateSingleInvestment()
        break
      case 'regular':
        calculationResults = calculateRegularInvestment()
        break
      case 'portfolio':
        calculationResults = calculatePortfolio()
        break
    }

    results.value = calculationResults
    generateChartData()
    showResults.value = true

  } catch (error) {
    console.error('计算错误:', error)
    alert('计算过程中出现错误，请检查输入数据')
  }
}

// 生成图表数据
const generateChartData = () => {
  if (!results.value) return

  if (calculationType.value === 'single') {
    // 单笔投资增长曲线
    const months = investmentPeriod.value
    const monthlyData = []

    for (let i = 0; i <= months; i++) {
      const years = i / 12
      const rate = annualRate.value / 100
      const product = productTypes.find(p => p.id === selectedProduct.value)

      let value = 0
      if (product && product.interestType === 'simple') {
        value = principal.value * (1 + rate * years)
      } else {
        value = principal.value * Math.pow(1 + rate, years)
      }

      monthlyData.push({
        month: i,
        principal: principal.value,
        interest: value - principal.value,
        total: value
      })
    }

    chartData.value = {
      type: 'growth',
      data: monthlyData
    }
  } else if (calculationType.value === 'portfolio') {
    // 组合投资饼图
    chartData.value = {
      type: 'pie',
      data: results.value.items.map(item => ({
        name: productTypes.find(p => p.id === item.product)?.name || item.product,
        value: item.amount,
        percentage: item.weight
      }))
    }
  }
}

// 添加投资项目
const addPortfolioItem = () => {
  portfolio.value.push({
    product: 'fixed_deposit',
    amount: 10000,
    rate: 2.5
  })
}

// 移除投资项目
const removePortfolioItem = (index) => {
  portfolio.value.splice(index, 1)
}

// 更新产品收益率
const updateProductRate = (index) => {
  const product = productTypes.find(p => p.id === portfolio.value[index].product)
  if (product) {
    portfolio.value[index].rate = (product.minRate + product.maxRate) / 2
  }
}

// 加载示例数据
const loadExampleData = () => {
  if (calculationType.value === 'single') {
    principal.value = 100000
    annualRate.value = 4.5
    investmentPeriod.value = 24
    compoundingFrequency.value = 12
    selectedProduct.value = 'fixed_deposit'
  } else if (calculationType.value === 'regular') {
    regularAmount.value = 5000
    annualRate.value = 8
    investmentPeriod.value = 36
    regularFrequency.value = 'monthly'
    selectedProduct.value = 'fund'
  } else if (calculationType.value === 'portfolio') {
    portfolio.value = [
      { product: 'fixed_deposit', amount: 50000, rate: 2.5 },
      { product: 'fund', amount: 30000, rate: 8 },
      { product: 'bond', amount: 20000, rate: 4 }
    ]
    investmentPeriod.value = 24
  }
}

// 重置表单
const resetForm = () => {
  showResults.value = false
  results.value = null
  chartData.value = null

  if (calculationType.value === 'single') {
    principal.value = 100000
    annualRate.value = 3.5
    investmentPeriod.value = 12
    compoundingFrequency.value = 12
    taxRate.value = 0
    inflationRate.value = 2.5
  } else if (calculationType.value === 'regular') {
    regularAmount.value = 5000
    annualRate.value = 8
    investmentPeriod.value = 12
    regularFrequency.value = 'monthly'
    taxRate.value = 0
  } else if (calculationType.value === 'portfolio') {
    portfolio.value = [
      { product: 'fixed_deposit', amount: 50000, rate: 2.5 },
      { product: 'fund', amount: 30000, rate: 8 }
    ]
    investmentPeriod.value = 12
  }
}

// 获取风险等级
const getRiskLevel = (score) => {
  if (score <= 1.5) return { level: '低风险', color: 'text-green-600', bgColor: 'bg-green-100' }
  if (score <= 2.5) return { level: '中风险', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  return { level: '高风险', color: 'text-red-600', bgColor: 'bg-red-100' }
}

// 获取收益率等级
const getReturnLevel = (rate) => {
  if (rate < 3) return { level: '保守型', color: 'text-blue-600' }
  if (rate < 8) return { level: '稳健型', color: 'text-green-600' }
  return { level: '进取型', color: 'text-red-600' }
}

// 格式化数字
const formatNumber = (num) => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

// 常见问题数据
const faqs = [
  {
    question: '单利和复利有什么区别？',
    answer: '单利只对本金计算利息，而复利是对本金和已产生的利息一起计算利息。在相同本金、利率和时间条件下，复利收益比单利收益更高。长期投资时复利效应更加明显。'
  },
  {
    question: '定投有什么优势？',
    answer: '定投可以平摊成本、降低择时风险、分散投资风险，适合工薪阶层强制储蓄。通过定期定额投资，可以在市场低点买入更多份额，在市场高点买入较少份额，从而降低平均持仓成本。'
  },
  {
    question: '如何选择投资产品？',
    answer: '选择投资产品应考虑风险承受能力、投资期限、收益预期等因素。保守型投资者可选择定期存款、国债等；稳健型可配置债券、银行理财；进取型可适当配置基金、股票等。'
  },
  {
    question: '投资收益需要缴税吗？',
    answer: '不同投资产品的税收政策不同。银行存款利息免征个人所得税；国债利息免税；股票买卖差价暂不征收个人所得税；基金分红暂不征税，但卖出时需缴纳增值税。具体请咨询税务专业人士。'
  },
  {
    question: '通胀对投资收益的影响？',
    answer: '通胀会侵蚀投资的实际收益。如果年化收益率5%，通胀率3%，实际收益率只有2%。投资时应考虑通胀因素，选择收益率能跑赢通胀的产品，如股票、基金等。'
  },
  {
    question: '投资组合如何分散风险？',
    answer: '可通过资产配置、行业分散、地域分散等方式降低风险。建议配置相关性较低的不同类型资产，如股票、债券、黄金、房地产等，避免过度集中于单一资产或行业。'
  },
  {
    question: '复利频率对收益的影响？',
    answer: '复利频率越高，实际收益率越高。年复利、半年复利、季度复利、月复利的实际收益率依次递增。但在年化利率相同的情况下，不同复利频率的最终收益差异相对较小。'
  },
  {
    question: '如何评估投资风险？',
    answer: '可从波动性、流动性、信用风险等方面评估。查看历史收益率波动、最大回撤等指标，了解产品的风险特征。根据自己的风险承受能力选择合适的产品。'
  }
]

// 页面加载时初始化
onMounted(() => {
  loadExampleData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <PieChart class="w-8 h-8 text-blue-600" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">理财收益计算器</h1>
        <p class="mt-4 text-xl text-gray-600">专业投资收益计算，助力财富稳健增长</p>
      </div>

      <!-- 标签页导航 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              @click="activeTab = 'calculator'"
              :class="[
                'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'calculator'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <Calculator class="w-5 h-5 inline mr-2" />
              收益计算器
            </button>
            <button
              @click="activeTab = 'guide'"
              :class="[
                'py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'guide'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <FileText class="w-5 h-5 inline mr-2" />
              投资攻略
            </button>
          </nav>
        </div>
      </div>

      <!-- 计算器内容 -->
      <div v-if="activeTab === 'calculator'" class="grid lg:grid-cols-3 gap-8">
        <!-- 左侧输入表单 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 计算类型选择 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target class="w-5 h-5 mr-2 text-blue-600" />
              计算方式
            </h3>
            <div class="grid grid-cols-3 gap-4">
              <button
                @click="calculationType = 'single'"
                :class="[
                  'p-4 rounded-lg border-2 transition-all',
                  calculationType === 'single'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                ]"
              >
                <div class="font-medium">单笔投资</div>
                <div class="text-sm mt-1">一次性投入计算</div>
              </button>
              <button
                @click="calculationType = 'regular'"
                :class="[
                  'p-4 rounded-lg border-2 transition-all',
                  calculationType === 'regular'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                ]"
              >
                <div class="font-medium">定期定投</div>
                <div class="text-sm mt-1">分批投入计算</div>
              </button>
              <button
                @click="calculationType = 'portfolio'"
                :class="[
                  'p-4 rounded-lg border-2 transition-all',
                  calculationType === 'portfolio'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                ]"
              >
                <div class="font-medium">组合投资</div>
                <div class="text-sm mt-1">多种产品配置</div>
              </button>
            </div>
          </div>

          <!-- 单笔投资表单 -->
          <div v-if="calculationType === 'single'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">投资参数</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">投资产品类型</label>
                <select
                  v-model="selectedProduct"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option v-for="product in productTypes" :key="product.id" :value="product.id">
                    {{ product.name }} ({{ product.minRate }}%-{{ product.maxRate }}%)
                  </option>
                </select>
              </div>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">投资金额 (元)</label>
                  <input
                    v-model.number="principal"
                    type="number"
                    min="1000"
                    step="1000"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">年化收益率 (%)</label>
                  <input
                    v-model.number="annualRate"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">投资期限 (月)</label>
                  <input
                    v-model.number="investmentPeriod"
                    type="number"
                    min="1"
                    max="600"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">复利频率</label>
                  <select
                    v-model="compoundingFrequency"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">年复利</option>
                    <option value="2">半年复利</option>
                    <option value="4">季度复利</option>
                    <option value="12">月复利</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">税率 (%)</label>
                  <input
                    v-model.number="taxRate"
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">通胀率 (%)</label>
                  <input
                    v-model.number="inflationRate"
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 定期定投表单 -->
          <div v-if="calculationType === 'regular'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">定投参数</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">投资产品类型</label>
                <select
                  v-model="selectedProduct"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option v-for="product in productTypes" :key="product.id" :value="product.id">
                    {{ product.name }} ({{ product.minRate }}%-{{ product.maxRate }}%)
                  </option>
                </select>
              </div>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">每期投资金额 (元)</label>
                  <input
                    v-model.number="regularAmount"
                    type="number"
                    min="100"
                    step="100"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">投资频率</label>
                  <select
                    v-model="regularFrequency"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">每月</option>
                    <option value="quarterly">每季度</option>
                    <option value="yearly">每年</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">年化收益率 (%)</label>
                  <input
                    v-model.number="annualRate"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">投资期限 (月)</label>
                  <input
                    v-model.number="investmentPeriod"
                    type="number"
                    min="1"
                    max="600"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">税率 (%)</label>
                  <input
                    v-model.number="taxRate"
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 组合投资表单 -->
          <div v-if="calculationType === 'portfolio'" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900">投资组合配置</h3>
              <button
                @click="addPortfolioItem"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                添加项目
              </button>
            </div>
            <div class="space-y-3">
              <div v-for="(item, index) in portfolio" :key="index" class="border border-gray-200 rounded-lg p-4">
                <div class="grid md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">产品类型</label>
                    <select
                      v-model="item.product"
                      @change="updateProductRate(index)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option v-for="product in productTypes" :key="product.id" :value="product.id">
                        {{ product.name }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">投资金额 (元)</label>
                    <input
                      v-model.number="item.amount"
                      type="number"
                      min="1000"
                      step="1000"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">预期收益率 (%)</label>
                    <input
                      v-model.number="item.rate"
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <button
                      @click="removePortfolioItem(index)"
                      class="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-200">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">投资期限 (月)</label>
                  <input
                    v-model.number="investmentPeriod"
                    type="number"
                    min="1"
                    max="600"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">总投资金额</label>
                  <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    ¥{{ formatNumber(portfolio.reduce((sum, item) => sum + item.amount, 0)) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-wrap gap-4">
            <button
              @click="performCalculation"
              class="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <Calculator class="w-5 h-5 inline mr-2" />
              开始计算
            </button>
            <button
              @click="loadExampleData"
              class="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              加载示例
            </button>
            <button
              @click="resetForm"
              class="flex-1 sm:flex-none border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              重置
            </button>
          </div>
        </div>

        <!-- 右侧信息面板 -->
        <div class="space-y-6">
          <!-- 产品类型说明 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info class="w-5 h-5 mr-2 text-blue-600" />
              投资产品类型
            </h3>
            <div class="space-y-3">
              <div v-for="product in productTypes" :key="product.id" class="p-3 border border-gray-200 rounded-lg">
                <div class="flex justify-between items-start mb-2">
                  <div class="font-medium text-gray-900">{{ product.name }}</div>
                  <span class="text-xs px-2 py-1 rounded-full"
                        :class="product.risk === 'low' ? 'bg-green-100 text-green-800' :
                               product.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                               'bg-red-100 text-red-800'">
                    {{ product.risk === 'low' ? '低风险' : product.risk === 'medium' ? '中风险' : '高风险' }}
                  </span>
                </div>
                <div class="text-sm text-gray-600">
                  预期收益: {{ product.minRate }}%-{{ product.maxRate }}%<br>
                  计息方式: {{ product.interestType === 'simple' ? '单利' : '复利' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 投资要点 -->
          <div class="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <TrendingUp class="w-5 h-5 mr-2" />
              投资要点提示
            </h3>
            <ul class="space-y-3 text-sm text-blue-800">
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>分散投资降低风险，不要把鸡蛋放在一个篮子里</span>
              </li>
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>长期投资收益相对稳定，避免频繁交易</span>
              </li>
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>投资收益需要考虑通胀因素，追求实际收益</span>
              </li>
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>根据风险承受能力选择合适的投资产品</span>
              </li>
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>定期检视投资组合，适时调整资产配置</span>
              </li>
            </ul>
          </div>

          <!-- 72法则速查 -->
          <div class="bg-green-50 rounded-lg border border-green-200 p-6">
            <h3 class="text-lg font-semibold text-green-900 mb-4">72法则速查</h3>
            <div class="text-sm text-green-800">
              <p class="mb-3">资金翻倍所需时间 ≈ 72 ÷ 年化收益率</p>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>3% 收益率</span>
                  <span class="font-medium">24年翻倍</span>
                </div>
                <div class="flex justify-between">
                  <span>6% 收益率</span>
                  <span class="font-medium">12年翻倍</span>
                </div>
                <div class="flex justify-between">
                  <span>8% 收益率</span>
                  <span class="font-medium">9年翻倍</span>
                </div>
                <div class="flex justify-between">
                  <span>12% 收益率</span>
                  <span class="font-medium">6年翻倍</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 计算结果 -->
      <div v-if="showResults && results" class="mt-8 space-y-6">
        <!-- 核心结果 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 class="w-6 h-6 mr-2 text-green-600" />
            计算结果
          </h3>

          <!-- 单笔投资结果 -->
          <div v-if="calculationType === 'single'" class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div class="text-center p-6 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">
                ¥{{ formatNumber(results.principal) }}
              </div>
              <div class="text-sm text-blue-800 mt-2">本金</div>
            </div>
            <div class="text-center p-6 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">
                ¥{{ formatNumber(results.totalInterest) }}
              </div>
              <div class="text-sm text-green-800 mt-2">利息收益</div>
            </div>
            <div class="text-center p-6 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">
                ¥{{ formatNumber(results.afterTaxAmount) }}
              </div>
              <div class="text-sm text-purple-800 mt-2">税后总额</div>
            </div>
            <div class="text-center p-6 bg-orange-50 rounded-lg">
              <div class="text-2xl font-bold text-orange-600">
                {{ results.annualizedReturn.toFixed(2) }}%
              </div>
              <div class="text-sm text-orange-800 mt-2">年化收益率</div>
            </div>
          </div>

          <!-- 定投结果 -->
          <div v-if="calculationType === 'regular'" class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div class="text-center p-6 bg-blue-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-600">
                ¥{{ formatNumber(results.totalInvested) }}
              </div>
              <div class="text-sm text-blue-800 mt-2">总投入</div>
            </div>
            <div class="text-center p-6 bg-green-50 rounded-lg">
              <div class="text-2xl font-bold text-green-600">
                ¥{{ formatNumber(results.totalInterest) }}
              </div>
              <div class="text-sm text-green-800 mt-2">总收益</div>
            </div>
            <div class="text-center p-6 bg-purple-50 rounded-lg">
              <div class="text-2xl font-bold text-purple-600">
                ¥{{ formatNumber(results.afterTaxAmount) }}
              </div>
              <div class="text-sm text-purple-800 mt-2">最终金额</div>
            </div>
            <div class="text-center p-6 bg-orange-50 rounded-lg">
              <div class="text-2xl font-bold text-orange-600">
                {{ results.returnRate }}%
              </div>
              <div class="text-sm text-orange-800 mt-2">总收益率</div>
            </div>
          </div>

          <!-- 组合投资结果 -->
          <div v-if="calculationType === 'portfolio'" class="mb-6">
            <div class="grid md:grid-cols-3 gap-6 mb-6">
              <div class="text-center p-6 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold text-blue-600">
                  ¥{{ formatNumber(results.totalInvestment) }}
                </div>
                <div class="text-sm text-blue-800 mt-2">总投资额</div>
              </div>
              <div class="text-center p-6 bg-green-50 rounded-lg">
                <div class="text-2xl font-bold text-green-600">
                  ¥{{ formatNumber(results.totalReturn) }}
                </div>
                <div class="text-sm text-green-800 mt-2">预期收益</div>
              </div>
              <div class="text-center p-6 bg-purple-50 rounded-lg">
                <div class="text-2xl font-bold text-purple-600">
                  {{ results.portfolioReturnRate }}%
                </div>
                <div class="text-sm text-purple-800 mt-2">组合收益率</div>
              </div>
            </div>

            <!-- 组合风险分析 -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 class="font-medium text-gray-900 mb-3">风险评估</h4>
              <div class="flex items-center">
                <div class="flex-1">
                  <div class="flex justify-between text-sm mb-1">
                    <span>风险评分</span>
                    <span class="font-medium">{{ results.riskScore }}/3.0</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="h-2 rounded-full transition-all duration-300"
                         :class="results.riskScore <= 1.5 ? 'bg-green-500' :
                                results.riskScore <= 2.5 ? 'bg-yellow-500' : 'bg-red-500'"
                         :style="{ width: (results.riskScore / 3.0 * 100) + '%' }">
                    </div>
                  </div>
                </div>
                <div class="ml-4">
                  <span class="px-3 py-1 rounded-full text-sm font-medium"
                        :class="getRiskLevel(results.riskScore).bgColor + ' ' + getRiskLevel(results.riskScore).color">
                    {{ getRiskLevel(results.riskScore).level }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 组合明细 -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="px-4 py-3 text-left font-medium text-gray-900">产品类型</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-900">投资金额</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-900">占比</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-900">预期收益</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-900">收益率</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(item, index) in results.items" :key="index" class="hover:bg-gray-50">
                    <td class="px-4 py-3">
                      {{ productTypes.find(p => p.id === item.product)?.name || item.product }}
                    </td>
                    <td class="px-4 py-3">¥{{ formatNumber(item.amount) }}</td>
                    <td class="px-4 py-3">{{ item.weight }}%</td>
                    <td class="px-4 py-3">¥{{ formatNumber(item.return) }}</td>
                    <td class="px-4 py-3">{{ item.returnRate }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 详细分析 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-6">详细分析</h3>

          <!-- 单笔投资详细分析 -->
          <div v-if="calculationType === 'single'" class="grid md:grid-cols-2 gap-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-3">收益分析</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">名义利息</span>
                  <span class="font-medium">¥{{ formatNumber(results.totalInterest) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">应缴税金</span>
                  <span class="font-medium">¥{{ formatNumber(results.tax) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">税后利息</span>
                  <span class="font-medium text-green-600">¥{{ formatNumber(results.afterTaxInterest) }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-3">实际收益</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">通胀调整后收益</span>
                  <span class="font-medium">¥{{ formatNumber(results.realInterest) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">实际购买力</span>
                  <span class="font-medium">¥{{ formatNumber(results.realAmount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">实际年化收益</span>
                  <span class="font-medium text-blue-600">{{ ((results.realAmount / results.principal) ** (1 / (investmentPeriod / 12)) - 1) * 100 }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 定投详细分析 -->
          <div v-if="calculationType === 'regular'" class="grid md:grid-cols-2 gap-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-3">投资概况</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">投资期数</span>
                  <span class="font-medium">{{ results.totalPayments }} 期</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">每期金额</span>
                  <span class="font-medium">¥{{ formatNumber(regularAmount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">总投入</span>
                  <span class="font-medium">¥{{ formatNumber(results.totalInvested) }}</span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-900 mb-3">收益明细</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">投资收益</span>
                  <span class="font-medium">¥{{ formatNumber(results.totalInterest) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">应缴税金</span>
                  <span class="font-medium">¥{{ formatNumber(results.tax) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">税后收益</span>
                  <span class="font-medium text-green-600">¥{{ formatNumber(results.afterTaxInterest) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 投资建议 -->
        <div class="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <AlertCircle class="w-5 h-5 mr-2" />
            投资建议
          </h3>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-blue-900 mb-3">风险提示</h4>
              <ul class="space-y-2 text-sm text-blue-800">
                <li>• 投资有风险，入市需谨慎</li>
                <li>• 过往业绩不代表未来表现</li>
                <li>• 请根据自身风险承受能力投资</li>
                <li>• 建议分散投资，降低集中风险</li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium text-blue-900 mb-3">优化建议</h4>
              <ul class="space-y-2 text-sm text-blue-800">
                <li>• 定期检视投资组合表现</li>
                <li>• 根据市场变化调整配置</li>
                <li>• 长期投资坚持价值投资理念</li>
                <li>• 咨询专业投资顾问意见</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 攻略指南内容 -->
      <div v-if="activeTab === 'guide'" class="space-y-8">
        <!-- 投资攻略 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText class="w-7 h-7 mr-3 text-blue-600" />
            理财投资完整攻略
          </h2>

          <div class="prose prose-blue max-w-none">
            <div class="space-y-8">
              <!-- 第一部分：投资基础 -->
              <section>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">一、投资基础知识</h3>
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-900 mb-3">什么是理财收益？</h4>
                    <p class="text-gray-700 leading-relaxed">
                      理财收益是指通过投资各种金融产品获得的资金增值。主要包括利息收入、投资收益、
                      资本利得等。合理的理财规划能够帮助个人财富保值增值，对抗通胀影响。
                    </p>
                  </div>
                  <div class="bg-blue-50 rounded-lg p-6">
                    <h4 class="font-semibold text-blue-900 mb-3">投资收益的分类</h4>
                    <p class="text-blue-800 leading-relaxed">
                      投资收益可分为固定收益和浮动收益。固定收益如存款利息、债券利息，收益相对稳定；
                      浮动收益如股票、基金，收益潜力较大但风险较高。
                    </p>
                  </div>
                </div>
              </section>

              <!-- 第二部分：投资产品详解 -->
              <section>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">二、主要投资产品分析</h3>
                <div class="space-y-4">
                  <div class="bg-green-50 rounded-lg p-6">
                    <h4 class="font-semibold text-green-900 mb-3">低风险产品</h4>
                    <div class="grid md:grid-cols-3 gap-4 text-sm text-green-800">
                      <div>
                        <h5 class="font-medium mb-2">定期存款</h5>
                        <p>银行存款的一种，期限固定，利率确定。优点是安全性高、收益稳定，缺点是收益率较低、流动性受限。</p>
                      </div>
                      <div>
                        <h5 class="font-medium mb-2">国债</h5>
                        <p>国家发行的债券，信用等级最高。优点是安全性极高、收益免税，缺点是收益率相对较低。</p>
                      </div>
                      <div>
                        <h5 class="font-medium mb-2">货币基金</h5>
                        <p>投资于短期货币工具的基金。优点是流动性好、风险低，缺点是收益率相对有限。</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-yellow-50 rounded-lg p-6">
                    <h4 class="font-semibold text-yellow-900 mb-3">中等风险产品</h4>
                    <div class="grid md:grid-cols-2 gap-4 text-sm text-yellow-800">
                      <div>
                        <h5 class="font-medium mb-2">银行理财</h5>
                        <p>银行发行的理财产品，投资于债券、票据等资产。收益相对稳定，风险适中，适合稳健型投资者。</p>
                      </div>
                      <div>
                        <h5 class="font-medium mb-2">债券基金</h5>
                        <p>专门投资债券的基金，收益相对稳定，风险低于股票基金，但高于存款和货币基金。</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-red-50 rounded-lg p-6">
                    <h4 class="font-semibold text-red-900 mb-3">高风险产品</h4>
                    <div class="grid md:grid-cols-2 gap-4 text-sm text-red-800">
                      <div>
                        <h5 class="font-medium mb-2">股票投资</h5>
                        <p>直接购买上市公司股票，收益潜力大但风险高。需要较强的专业知识和风险承受能力。</p>
                      </div>
                      <div>
                        <h5 class="font-medium mb-2">股票基金</h5>
                        <p>投资于股票市场的基金，通过专业管理分散风险，长期收益潜力较大，但短期波动较大。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 第三部分：投资策略 -->
              <section>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">三、投资策略与方法</h3>
                <div class="space-y-6">
                  <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-900 mb-4">资产配置策略</h4>
                    <div class="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 class="font-medium text-gray-800 mb-3">核心-卫星策略</h5>
                        <p class="text-gray-700 text-sm mb-3">将大部分资金(60-70%)配置在稳健的核心资产，如债券、银行理财等；
                        小部分资金(30-40%)配置在成长性的卫星资产，如股票、基金等。</p>
                      </div>
                      <div>
                        <h5 class="font-medium text-gray-800 mb-3">生命周期策略</h5>
                        <p class="text-gray-700 text-sm mb-3">根据年龄调整风险资产比例。年轻时可配置更多风险资产，
                        随年龄增长逐步降低风险资产比例，增加固定收益资产。</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-blue-50 rounded-lg p-6">
                    <h4 class="font-semibold text-blue-900 mb-4">定投策略要点</h4>
                    <ul class="space-y-2 text-sm text-blue-800">
                      <li>• 选择优质标的：选择长期业绩良好的基金或股票</li>
                      <li>• 坚持长期投资：至少坚持3-5年以上</li>
                      <li>• 设置合理频率：月度或季度定投较为合适</li>
                      <li>• 市场波动时机：市场下跌时是加仓好机会</li>
                      <li>• 定期调整组合：每年检视一次投资组合</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <!-- 常见问题解答 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">常见问题解答</h2>
          <div class="space-y-6">
            <div v-for="(faq, index) in faqs" :key="index" class="border-b border-gray-200 pb-6 last:border-b-0">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ faq.question }}</h3>
              <p class="text-gray-700 leading-relaxed">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具组件 -->
      <RelatedTools category="finance" :currentTool="'investment-calculator'" />

      <!-- SEO内容组件 -->
      <SeoContent toolName="理财收益计算器" />
    </div>
  </div>
</template>