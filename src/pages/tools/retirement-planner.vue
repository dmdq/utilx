<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calculator, TrendingUp, Target, PiggyBank, AlertCircle, Info, Calendar, DollarSign, BarChart3, Shield, FileText } from 'lucide-vue-next'

// 设置页面元数据
useHead({
  title: '退休储蓄规划器 - 有条工具',
  meta: [
    { name: 'description', content: '专业的退休储蓄规划工具，计算退休目标储蓄金额和月储蓄建议，考虑通胀率和多种收入来源，帮助制定合理的退休规划。' },
    { name: 'keywords', content: '退休规划,储蓄计算,退休金,养老,财务规划,退休计算器,养老金计算,退休储蓄' }
  ]
})

// 状态管理
const activeTab = ref('calculator')

// 基础信息
const currentAge = ref(30)
const retirementAge = ref(60)
const lifeExpectancy = ref(85)
const currentMonthlyIncome = ref(15000)
const currentMonthlyExpenses = ref(8000)
const currentSavings = ref(100000)
const retirementLifestyle = ref(70) // 退休后生活水平占当前收入的百分比

// 退休后收入来源
const socialPension = ref(3000) // 社保养老金
const companyPension = ref(1500) // 企业年金
const rentalIncome = ref(0) // 租金收入
const otherIncome = ref(0) // 其他收入

// 投资参数
const inflationRate = ref(3) // 通胀率
const workingReturnRate = ref(7) // 工作期间年化收益率
const retirementReturnRate = ref(4) // 退休后年化收益率（保守策略）
const salaryGrowthRate = ref(5) // 工资增长率

// 计算结果
const results = ref(null)
const showResults = ref(false)
const calculationDetails = ref([])

// 计算退休所需总金额
const calculateRetirementNeeds = () => {
  const yearsToRetirement = retirementAge.value - currentAge.value
  const yearsInRetirement = lifeExpectancy.value - retirementAge.value

  // 计算退休后月度支出（考虑通胀）
  const realRetirementMonthlyExpenses = (currentMonthlyIncome.value * retirementLifestyle.value / 100)
  const retirementMonthlyExpenses = realRetirementMonthlyExpenses * Math.pow(1 + inflationRate.value / 100, yearsToRetirement)

  // 计算退休后月度总收入
  const realRetirementMonthlyIncome = socialPension.value + companyPension.value + rentalIncome.value + otherIncome.value
  const retirementMonthlyIncome = realRetirementMonthlyIncome * Math.pow(1 + inflationRate.value / 100, yearsToRetirement)

  // 计算退休后月度净支出
  const monthlyNetExpenses = Math.max(0, retirementMonthlyExpenses - retirementMonthlyIncome)

  // 计算退休所需总金额（考虑退休期间的通胀和投资收益）
  const totalRetirementCorpus = calculatePresentValueOfRetirement(
    monthlyNetExpenses,
    yearsInRetirement,
    retirementReturnRate.value,
    inflationRate.value
  )

  return {
    yearsToRetirement,
    yearsInRetirement,
    retirementMonthlyExpenses,
    retirementMonthlyIncome,
    monthlyNetExpenses,
    totalRetirementCorpus
  }
}

// 计算退休金需求的现值
const calculatePresentValueOfRetirement = (monthlyExpenses, years, returnRate, inflationRate) => {
  const realReturnRate = (1 + returnRate / 100) / (1 + inflationRate / 100) - 1
  let presentValue = 0

  for (let year = 1; year <= years; year++) {
    const futureExpenses = monthlyExpenses * 12 * Math.pow(1 + inflationRate / 100, year - 1)
    const discountFactor = Math.pow(1 + realReturnRate, year - 1)
    presentValue += futureExpenses / discountFactor
  }

  return presentValue
}

// 计算现有储蓄的未来价值
const calculateFutureValueOfSavings = () => {
  const yearsToRetirement = retirementAge.value - currentAge.value
  return currentSavings.value * Math.pow(1 + workingReturnRate.value / 100, yearsToRetirement)
}

// 计算月储蓄建议
const calculateMonthlySavings = () => {
  const needs = calculateRetirementNeeds()
  const futureValueOfCurrentSavings = calculateFutureValueOfSavings()
  const shortfall = Math.max(0, needs.totalRetirementCorpus - futureValueOfCurrentSavings)
  const yearsToRetirement = needs.yearsToRetirement

  // 计算所需的月储蓄额
  const monthlySavingsNeeded = calculateMonthlySavingsForGoal(
    shortfall,
    yearsToRetirement,
    workingReturnRate.value
  )

  return {
    monthlySavingsNeeded,
    shortfall,
    futureValueOfCurrentSavings,
    affordabilityRatio: (monthlySavingsNeeded / currentMonthlyIncome.value) * 100
  }
}

// 计算实现目标所需的月储蓄
const calculateMonthlySavingsForGoal = (targetAmount, years, annualRate) => {
  const monthlyRate = annualRate / 100 / 12
  const months = years * 12

  if (monthlyRate === 0) {
    return targetAmount / months
  }

  const monthlySavings = targetAmount * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1)
  return monthlySavings
}

// 计算不同储蓄率的退休年龄
const calculateRetirementAgeScenarios = () => {
  const scenarios = []
  const needs = calculateRetirementNeeds()

  for (const savingsRate of [10, 15, 20, 25, 30]) {
    const monthlySavings = currentMonthlyIncome.value * savingsRate / 100
    let retirementAge = currentAge.value

    // 迭代计算可能的退休年龄
    for (let age = currentAge.value + 1; age <= lifeExpectancy.value; age++) {
      const years = age - currentAge.value
      const futureValueSavings = calculateFutureValueOfSavings()
      const futureValueMonthlySavings = calculateFutureValueOfAnnuity(monthlySavings, years, workingReturnRate.value)

      const totalAssets = futureValueSavings + futureValueMonthlySavings
      const needsAtRetirement = calculateRetirementNeedsAtAge(age)

      if (totalAssets >= needsAtRetirement) {
        retirementAge = age
        break
      }
    }

    scenarios.push({
      savingsRate,
      retirementAge,
      monthlySavings
    })
  }

  return scenarios
}

// 计算特定年龄退休所需的资金
const calculateRetirementNeedsAtAge = (age) => {
  const yearsToRetirement = age - currentAge.value
  const yearsInRetirement = lifeExpectancy.value - age

  const realRetirementMonthlyExpenses = (currentMonthlyIncome.value * retirementLifestyle.value / 100)
  const retirementMonthlyExpenses = realRetirementMonthlyExpenses * Math.pow(1 + inflationRate.value / 100, yearsToRetirement)

  const realRetirementMonthlyIncome = socialPension.value + companyPension.value + rentalIncome.value + otherIncome.value
  const retirementMonthlyIncome = realRetirementMonthlyIncome * Math.pow(1 + inflationRate.value / 100, yearsToRetirement)

  const monthlyNetExpenses = Math.max(0, retirementMonthlyExpenses - retirementMonthlyIncome)

  return calculatePresentValueOfRetirement(
    monthlyNetExpenses,
    yearsInRetirement,
    retirementReturnRate.value,
    inflationRate.value
  )
}

// 计算年金的未来价值
const calculateFutureValueOfAnnuity = (monthlyAmount, years, annualRate) => {
  const monthlyRate = annualRate / 100 / 12
  const months = years * 12

  if (monthlyRate === 0) {
    return monthlyAmount * months
  }

  return monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
}

// 执行完整计算
const performCalculation = () => {
  try {
    const needs = calculateRetirementNeeds()
    const savings = calculateMonthlySavings()
    const scenarios = calculateRetirementAgeScenarios()

    results.value = {
      needs,
      savings,
      scenarios,
      currentSavingsRate: ((currentMonthlyIncome.value - currentMonthlyExpenses.value) / currentMonthlyIncome.value * 100).toFixed(1)
    }

    // 生成计算详情
    generateCalculationDetails()
    showResults.value = true

  } catch (error) {
    console.error('计算错误:', error)
    alert('计算过程中出现错误，请检查输入数据')
  }
}

// 生成计算详情
const generateCalculationDetails = () => {
  calculationDetails.value = [
    {
      title: '退休目标分析',
      items: [
        `距离退休还有 ${results.value.needs.yearsToRetirement} 年`,
        `预计退休生活年限 ${results.value.needs.yearsInRetirement} 年`,
        `退休后月支出（现值）¥${formatNumber(results.value.needs.retirementMonthlyExpenses)}`,
        `退休后月收入（现值）¥${formatNumber(results.value.needs.retirementMonthlyIncome)}`,
        `退休后月净支出 ¥${formatNumber(results.value.needs.monthlyNetExpenses)}`
      ]
    },
    {
      title: '资金需求分析',
      items: [
        `退休所需总金额 ¥${formatNumber(results.value.needs.totalRetirementCorpus)}`,
        `现有储蓄未来价值 ¥${formatNumber(results.value.savings.futureValueOfCurrentSavings)}`,
        `资金缺口 ¥${formatNumber(results.value.savings.shortfall)}`,
        `建议月储蓄额 ¥${formatNumber(results.value.savings.monthlySavingsNeeded)}`,
        `储蓄占收入比例 ${results.value.savings.affordabilityRatio.toFixed(1)}%`
      ]
    }
  ]
}

// 格式化数字
const formatNumber = (num) => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(num))
}

// 加载示例数据
const loadExampleData = () => {
  currentAge.value = 30
  retirementAge.value = 60
  lifeExpectancy.value = 85
  currentMonthlyIncome.value = 15000
  currentMonthlyExpenses.value = 8000
  currentSavings.value = 100000
  retirementLifestyle.value = 70
  socialPension.value = 3000
  companyPension.value = 0
  rentalIncome.value = 0
  otherIncome.value = 0
  inflationRate.value = 3
  workingReturnRate.value = 7
  retirementReturnRate.value = 4
  salaryGrowthRate.value = 5
}

// 重置表单
const resetForm = () => {
  showResults.value = false
  results.value = null
  calculationDetails.value = []
  currentAge.value = 30
  retirementAge.value = 60
  lifeExpectancy.value = 85
  currentMonthlyIncome.value = 15000
  currentMonthlyExpenses.value = 8000
  currentSavings.value = 0
  retirementLifestyle.value = 70
  socialPension.value = 0
  companyPension.value = 0
  rentalIncome.value = 0
  otherIncome.value = 0
  inflationRate.value = 3
  workingReturnRate.value = 7
  retirementReturnRate.value = 4
  salaryGrowthRate.value = 5
}

// 计算进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 30) return 'bg-green-500'
  if (percentage < 50) return 'bg-yellow-500'
  if (percentage < 70) return 'bg-orange-500'
  return 'bg-red-500'
}

// 获取建议等级
const getRecommendationLevel = (ratio) => {
  if (ratio <= 15) return { level: '优秀', color: 'text-green-600', icon: '🟢' }
  if (ratio <= 25) return { level: '良好', color: 'text-yellow-600', icon: '🟡' }
  if (ratio <= 35) return { level: '一般', color: 'text-orange-600', icon: '🟠' }
  return { level: '需要改善', color: 'text-red-600', icon: '🔴' }
}

// 常见问题数据
const faqs = [
  {
    question: '退休储蓄规划中最重要的因素是什么？',
    answer: '最重要的是尽早开始和坚持执行。时间价值在长期投资中作用巨大，越早开始，复利效应越明显。同时要保持合理的储蓄率（建议15-25%）和适当的投资收益率。'
  },
  {
    question: '如何确定合适的退休生活水平？',
    answer: '一般建议退休后生活水平达到当前收入的70-80%，因为退休后通常减少了工作相关支出（交通、餐饮等），但可能增加医疗保健支出。可根据个人实际情况调整。'
  },
  {
    question: '通胀对退休规划有多大影响？',
    answer: '通胀影响很大。假设3%的通胀率，20年后的购买力会下降约45%。因此退休规划必须考虑通胀因素，确保退休金的实际购买力。'
  },
  {
    question: '如何平衡风险和收益？',
    answer: '年轻时可以承受较高风险，配置更多股票类资产；临近退休时应逐步降低风险，增加债券和存款比例。建议采用"100-年龄"作为股票配置的参考比例。'
  },
  {
    question: '社保养老金在退休规划中的作用？',
    answer: '社保是退休收入的基础保障，但通常只能满足基本生活需求。建议将社保养老金作为保底收入，额外建立个人养老金和企业年金来提高退休生活质量。'
  },
  {
    question: '退休规划需要定期调整吗？',
    answer: '是的，建议每年检视一次退休规划，根据收入变化、家庭状况、投资表现、政策调整等因素及时调整策略，确保目标的可实现性。'
  },
  {
    question: '如何应对长寿风险？',
    answer: '可以通过购买年金保险、配置长期债券、保持一定股票投资、延迟退休年龄等方式应对。规划时建议预留5-10年的额外资金作为缓冲。'
  },
  {
    question: '退休规划中常见的误区有哪些？',
    answer: '常见误区包括：开始太晚、低估通胀影响、过于保守或激进、忽视保险保障、没有应急储备、收入预测过于乐观等。'
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
          <Calendar class="w-8 h-8 text-blue-600" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">退休储蓄规划器</h1>
        <p class="mt-4 text-xl text-gray-600">制定合理的退休规划，享受体面的退休生活</p>
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
              规划计算器
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
              攻略指南
            </button>
          </nav>
        </div>
      </div>

      <!-- 计算器内容 -->
      <div v-if="activeTab === 'calculator'" class="grid lg:grid-cols-3 gap-8">
        <!-- 左侧输入表单 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 基础信息 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target class="w-5 h-5 mr-2 text-blue-600" />
              基础信息
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">当前年龄</label>
                <input
                  v-model.number="currentAge"
                  type="number"
                  min="18"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">计划退休年龄</label>
                <input
                  v-model.number="retirementAge"
                  type="number"
                  min="50"
                  max="80"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">预期寿命</label>
                <input
                  v-model.number="lifeExpectancy"
                  type="number"
                  min="70"
                  max="120"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">当前月收入 (元)</label>
                <input
                  v-model.number="currentMonthlyIncome"
                  type="number"
                  min="0"
                  step="1000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">当前月支出 (元)</label>
                <input
                  v-model.number="currentMonthlyExpenses"
                  type="number"
                  min="0"
                  step="500"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">现有储蓄 (元)</label>
                <input
                  v-model.number="currentSavings"
                  type="number"
                  min="0"
                  step="10000"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- 退休后收入来源 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign class="w-5 h-5 mr-2 text-green-600" />
              退休后收入来源 (月度)
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">社保养老金 (元)</label>
                <input
                  v-model.number="socialPension"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">企业年金 (元)</label>
                <input
                  v-model.number="companyPension"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">租金收入 (元)</label>
                <input
                  v-model.number="rentalIncome"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">其他收入 (元)</label>
                <input
                  v-model.number="otherIncome"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                退休后生活水平目标 (当前收入的 {{ retirementLifestyle }}%)
              </label>
              <input
                v-model.number="retirementLifestyle"
                type="range"
                min="50"
                max="120"
                step="5"
                class="w-full"
              />
            </div>
          </div>

          <!-- 投资参数 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 class="w-5 h-5 mr-2 text-purple-600" />
              投资参数设置
            </h3>
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">预期通胀率 (%)</label>
                <input
                  v-model.number="inflationRate"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">工作期间年化收益率 (%)</label>
                <input
                  v-model.number="workingReturnRate"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">退休后年化收益率 (%)</label>
                <input
                  v-model.number="retirementReturnRate"
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">工资增长率 (%)</label>
                <input
                  v-model.number="salaryGrowthRate"
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
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
          <!-- 当前储蓄率 -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">当前财务状况</h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm font-medium text-gray-700">当前储蓄率</span>
                  <span class="text-sm text-gray-500">{{ ((currentMonthlyIncome - currentMonthlyExpenses) / currentMonthlyIncome * 100).toFixed(1) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-300"
                    :class="getProgressColor(((currentMonthlyIncome - currentMonthlyExpenses) / currentMonthlyIncome * 100))"
                    :style="{ width: Math.min(100, ((currentMonthlyIncome - currentMonthlyExpenses) / currentMonthlyIncome * 100)) + '%' }"
                  />
                </div>
              </div>
              <div class="pt-4 border-t border-gray-200">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">月收入</span>
                  <span class="font-medium">¥{{ formatNumber(currentMonthlyIncome) }}</span>
                </div>
                <div class="flex justify-between text-sm mt-2">
                  <span class="text-gray-600">月支出</span>
                  <span class="font-medium">¥{{ formatNumber(currentMonthlyExpenses) }}</span>
                </div>
                <div class="flex justify-between text-sm mt-2">
                  <span class="text-gray-600">月结余</span>
                  <span class="font-medium text-green-600">¥{{ formatNumber(currentMonthlyIncome - currentMonthlyExpenses) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 退休规划要点 -->
          <div class="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 class="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Info class="w-5 h-5 mr-2" />
              退休规划要点
            </h3>
            <ul class="space-y-3 text-sm text-blue-800">
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>尽早开始规划，充分利用复利效应</span>
              </li>
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>保持15-25%的储蓄率较为合理</span>
              </li>
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>考虑通胀因素对购买力的影响</span>
              </li>
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>根据年龄调整投资风险偏好</span>
              </li>
              <li class="flex items-start">
                <span class="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5 mr-2">•</span>
                <span>定期检视并调整退休规划</span>
              </li>
            </ul>
          </div>

          <!-- 投资建议 -->
          <div class="bg-green-50 rounded-lg border border-green-200 p-6">
            <h3 class="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <TrendingUp class="w-5 h-5 mr-2" />
              投资配置建议
            </h3>
            <div class="space-y-3">
              <div v-if="currentAge < 35" class="text-sm text-green-800">
                <div class="font-medium mb-1">积极成长型 ({{ currentAge < 30 ? '20-40岁' : '30-40岁' }})</div>
                <div class="text-xs">股票 70-80% | 债券 20-30% | 现金 0-10%</div>
              </div>
              <div v-else-if="currentAge < 50" class="text-sm text-green-800">
                <div class="font-medium mb-1">稳健平衡型 (40-50岁)</div>
                <div class="text-xs">股票 50-60% | 债券 30-40% | 现金 10%</div>
              </div>
              <div v-else class="text-sm text-green-800">
                <div class="font-medium mb-1">保守稳健型 (50岁以上)</div>
                <div class="text-xs">股票 30-40% | 债券 50-60% | 现金 10-20%</div>
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
            <PiggyBank class="w-6 h-6 mr-2 text-green-600" />
            退休规划结果
          </h3>

          <div class="grid md:grid-cols-3 gap-6 mb-6">
            <!-- 退休所需总金额 -->
            <div class="text-center p-6 bg-blue-50 rounded-lg">
              <div class="text-3xl font-bold text-blue-600">
                ¥{{ formatNumber(results.needs.totalRetirementCorpus) }}
              </div>
              <div class="text-sm text-blue-800 mt-2">退休所需总金额</div>
            </div>

            <!-- 建议月储蓄 -->
            <div class="text-center p-6 bg-green-50 rounded-lg">
              <div class="text-3xl font-bold text-green-600">
                ¥{{ formatNumber(results.savings.monthlySavingsNeeded) }}
              </div>
              <div class="text-sm text-green-800 mt-2">建议月储蓄额</div>
            </div>

            <!-- 储蓄占收入比例 -->
            <div class="text-center p-6 rounded-lg"
                 :class="results.savings.affordabilityRatio <= 25 ? 'bg-green-50' : 'bg-orange-50'">
              <div class="text-3xl font-bold"
                   :class="results.savings.affordabilityRatio <= 25 ? 'text-green-600' : 'text-orange-600'">
                {{ results.savings.affordabilityRatio.toFixed(1) }}%
              </div>
              <div class="text-sm mt-2"
                   :class="results.savings.affordabilityRatio <= 25 ? 'text-green-800' : 'text-orange-800'">
                储蓄占收入比例
              </div>
            </div>
          </div>

          <!-- 可行性评估 -->
          <div class="border-t border-gray-200 pt-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-semibold text-gray-900">可行性评估</h4>
              <div class="flex items-center">
                <span class="text-2xl mr-2">{{ getRecommendationLevel(results.savings.affordabilityRatio).icon }}</span>
                <span class="font-medium"
                      :class="getRecommendationLevel(results.savings.affordabilityRatio).color">
                  {{ getRecommendationLevel(results.savings.affordabilityRatio).level }}
                </span>
              </div>
            </div>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-gray-50 rounded-lg p-4">
                <h5 class="font-medium text-gray-900 mb-3">资金状况分析</h5>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">资金缺口</span>
                    <span class="font-medium">¥{{ formatNumber(results.savings.shortfall) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">现有储蓄未来价值</span>
                    <span class="font-medium">¥{{ formatNumber(results.savings.futureValueOfCurrentSavings) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">距离退休时间</span>
                    <span class="font-medium">{{ results.needs.yearsToRetirement }} 年</span>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 rounded-lg p-4">
                <h5 class="font-medium text-gray-900 mb-3">退休后现金流</h5>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">月总支出</span>
                    <span class="font-medium">¥{{ formatNumber(results.needs.retirementMonthlyExpenses) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">月总收入</span>
                    <span class="font-medium">¥{{ formatNumber(results.needs.retirementMonthlyIncome) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">月净支出</span>
                    <span class="font-medium text-red-600">¥{{ formatNumber(results.needs.monthlyNetExpenses) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 情景分析 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-6">不同储蓄率情景分析</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-4 py-3 text-left font-medium text-gray-900">月储蓄率</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-900">月储蓄金额</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-900">预计退休年龄</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-900">评估</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="scenario in results.scenarios" :key="scenario.savingsRate" class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium">{{ scenario.savingsRate }}%</td>
                  <td class="px-4 py-3">¥{{ formatNumber(scenario.monthlySavings) }}</td>
                  <td class="px-4 py-3">{{ scenario.retirementAge }} 岁</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          :class="scenario.retirementAge <= retirementAge ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">
                      {{ scenario.retirementAge <= retirementAge ? '可达标' : '需延迟' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-start">
              <AlertCircle class="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div class="text-sm text-yellow-800">
                <strong>情景分析说明：</strong>以上分析基于当前投资收益率假设。实际结果会因市场表现、通胀变化等因素而有所不同。建议定期审视并调整计划。
              </div>
            </div>
          </div>
        </div>

        <!-- 详细计算过程 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-6">详细计算过程</h3>
          <div class="space-y-6">
            <div v-for="section in calculationDetails" :key="section.title" class="border-l-4 border-blue-500 pl-6">
              <h4 class="font-semibold text-gray-900 mb-3">{{ section.title }}</h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li v-for="item in section.items" :key="item" class="flex items-center">
                  <span class="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                  {{ item }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 攻略指南内容 -->
      <div v-if="activeTab === 'guide'" class="space-y-8">
        <!-- 退休规划攻略 -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText class="w-7 h-7 mr-3 text-blue-600" />
            退休规划完整攻略
          </h2>

          <div class="prose prose-blue max-w-none">
            <div class="space-y-8">
              <!-- 第一部分：退休规划基础 -->
              <section>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">一、退休规划基础知识</h3>
                <div class="grid md:grid-cols-2 gap-6">
                  <div class="bg-gray-50 rounded-lg p-6">
                    <h4 class="font-semibold text-gray-900 mb-3">什么是退休规划？</h4>
                    <p class="text-gray-700 leading-relaxed">
                      退休规划是一个全面的财务规划过程，旨在确保在退休后有足够的资金维持理想的生活水平。
                      它包括确定退休目标、分析现有资源、制定储蓄策略、选择投资工具等多个方面。
                    </p>
                  </div>
                  <div class="bg-blue-50 rounded-lg p-6">
                    <h4 class="font-semibold text-blue-900 mb-3">为什么需要提前规划？</h4>
                    <p class="text-blue-800 leading-relaxed">
                      随着人均寿命延长和通胀压力，仅靠社保养老金难以维持理想的退休生活。
                      提前规划可以充分利用时间价值的复利效应，降低储蓄压力，确保退休生活质量。
                    </p>
                  </div>
                </div>
              </section>

              <!-- 第二部分：退休资金需求计算 -->
              <section>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">二、退休资金需求计算</h3>
                <div class="bg-gray-50 rounded-lg p-6">
                  <h4 class="font-semibold text-gray-900 mb-4">计算方法详解</h4>
                  <div class="space-y-4">
                    <div>
                      <h5 class="font-medium text-gray-800 mb-2">1. 确定退休后年支出</h5>
                      <div class="bg-white p-4 rounded border border-gray-200">
                        <code class="text-sm">
                          退休后年支出 = 当前年支出 × (1 + 通胀率)^退休年限 × 目标生活水平比例
                        </code>
                      </div>
                    </div>
                    <div>
                      <h5 class="font-medium text-gray-800 mb-2">2. 计算退休总收入</h5>
                      <div class="bg-white p-4 rounded border border-gray-200">
                        <code class="text-sm">
                          年总收入 = 社保养老金 + 企业年金 + 投资收益 + 其他收入
                        </code>
                      </div>
                    </div>
                    <div>
                      <h5 class="font-medium text-gray-800 mb-2">3. 确定资金缺口</h5>
                      <div class="bg-white p-4 rounded border border-gray-200">
                        <code class="text-sm">
                          年资金缺口 = 退休后年支出 - 年总收入
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 第三部分：投资策略 -->
              <section>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">三、不同年龄段投资策略</h3>
                <div class="space-y-4">
                  <div class="bg-green-50 rounded-lg p-6">
                    <h4 class="font-semibold text-green-900 mb-3">25-35岁：积极成长期</h4>
                    <ul class="space-y-2 text-green-800">
                      <li>• 投资组合：股票70-80%，债券20-30%</li>
                      <li>• 特点：风险承受能力强，追求高收益</li>
                      <li>• 建议：定投指数基金，选择优质成长股</li>
                      <li>• 储蓄率：收入的15-20%</li>
                    </ul>
                  </div>

                  <div class="bg-blue-50 rounded-lg p-6">
                    <h4 class="font-semibold text-blue-900 mb-3">36-50岁：稳健增长期</h4>
                    <ul class="space-y-2 text-blue-800">
                      <li>• 投资组合：股票50-60%，债券30-40%，现金10%</li>
                      <li>• 特点：平衡风险与收益，开始降低风险</li>
                      <li>• 建议：配置优质债券，增加稳健理财</li>
                      <li>• 储蓄率：收入的20-25%</li>
                    </ul>
                  </div>

                  <div class="bg-orange-50 rounded-lg p-6">
                    <h4 class="font-semibold text-orange-900 mb-3">51-65岁：保守保值期</h4>
                    <ul class="space-y-2 text-orange-800">
                      <li>• 投资组合：股票30-40%，债券50-60%，现金10-20%</li>
                      <li>• 特点：保本为主，追求稳定收益</li>
                      <li>• 建议：增加国债、存款，降低股票配置</li>
                      <li>• 储蓄率：收入的25-30%</li>
                    </ul>
                  </div>
                </div>
              </section>

              <!-- 第四部分：风险提示 -->
              <section>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">四、风险管理与注意事项</h3>
                <div class="bg-red-50 rounded-lg p-6">
                  <h4 class="font-semibold text-red-900 mb-4 flex items-center">
                    <Shield class="w-5 h-5 mr-2" />
                    主要风险提示
                  </h4>
                  <div class="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 class="font-medium text-red-800 mb-3">投资风险</h5>
                      <ul class="space-y-1 text-sm text-red-700">
                        <li>• 市场波动风险</li>
                        <li>• 通胀侵蚀购买力</li>
                        <li>• 投资收益率不确定</li>
                        <li>• 流动性风险</li>
                      </ul>
                    </div>
                    <div>
                      <h5 class="font-medium text-red-800 mb-3">长寿风险</h5>
                      <ul class="space-y-1 text-sm text-red-700">
                        <li>• 寿命超出预期</li>
                        <li>• 医疗费用增加</li>
                        <li>• 护理成本上升</li>
                        <li>• 家庭结构变化</li>
                      </ul>
                    </div>
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
      <RelatedTools category="finance" :currentTool="'retirement-planner'" />

      <!-- SEO内容组件 -->
      <SeoContent toolName="退休储蓄规划器" />
    </div>
  </div>
</template>