<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">基金定投计算器</h1>
      <p class="text-muted-foreground mb-6">计算基金定投收益和收益率，支持定投频率分析和历史数据回测</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 定投基本信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">定投基本信息</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">每月定投金额（元）</label>
              <input
                v-model.number="monthlyAmount"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入每月定投金额"
                @input="calculateSIP"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">定投期限（年）</label>
              <input
                v-model.number="investmentYears"
                type="number"
                step="0.5"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入定投期限"
                @input="calculateSIP"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">预期年化收益率（%）</label>
              <input
                v-model.number="expectedReturn"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入预期年化收益率"
                @input="calculateSIP"
              />
            </div>
          </div>
        </div>

        <!-- 定投频率设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">定投频率设置</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="frequency"
                type="radio"
                value="monthly"
                class="mr-2"
                @change="calculateSIP"
              />
              <span class="text-sm">按月定投</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="frequency"
                type="radio"
                value="quarterly"
                class="mr-2"
                @change="calculateSIP"
              />
              <span class="text-sm">按季度定投</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="frequency"
                type="radio"
                value="weekly"
                class="mr-2"
                @change="calculateSIP"
              />
              <span class="text-sm">按周定投</span>
            </label>
          </div>

          <div v-if="frequency !== 'monthly'" class="mt-4">
            <label class="block text-sm font-medium mb-2">
              每{{ getFrequencyUnit() }}定投金额（元）
            </label>
            <input
              v-model.number="periodicAmount"
              type="number"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="请输入定投金额"
              @input="calculateSIP"
            />
          </div>
        </div>

        <!-- 高级设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">高级设置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">管理费率（%/年）</label>
              <input
                v-model.number="managementFee"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入管理费率"
                @input="calculateSIP"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">申购费率（%）</label>
              <input
                v-model.number="purchaseFee"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入申购费率"
                @input="calculateSIP"
              />
            </div>

            <div>
              <label class="flex items-center">
                <input
                  v-model="includeInflation"
                  type="checkbox"
                  class="mr-2"
                  @change="calculateSIP"
                />
                <span class="text-sm">考虑通货膨胀</span>
              </label>
            </div>

            <div v-if="includeInflation">
              <label class="block text-sm font-medium mb-2">通胀率（%）</label>
              <input
                v-model.number="inflationRate"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入通胀率"
                @input="calculateSIP"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-3 gap-2">
          <button
            @click="resetCalculation"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
          >
            重置
          </button>
          <button
            @click="compareScenarios"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            方案对比
          </button>
          <button
            @click="exportReport"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            导出报告
          </button>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="space-y-6">
        <!-- 投资结果 -->
        <div v-if="sipResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投资结果</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-600 mb-1">总投入金额</div>
                <div class="text-xl font-bold text-blue-800">
                  ¥{{ sipResult.totalInvestment.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-green-600 mb-1">预期总收益</div>
                <div class="text-xl font-bold text-green-800">
                  ¥{{ sipResult.totalReturn.toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm text-purple-600 mb-1">最终金额</div>
                <div class="text-xl font-bold text-purple-800">
                  ¥{{ sipResult.finalAmount.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-yellow-600 mb-1">总收益率</div>
                <div class="text-xl font-bold text-yellow-800">
                  {{ sipResult.totalReturnRate.toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 定投明细 -->
        <div v-if="sipResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">定投明细</h3>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">定投次数：</span>
                <span class="font-medium">{{ sipResult.totalPeriods }}次</span>
              </div>
              <div>
                <span class="text-muted-foreground">实际收益率：</span>
                <span class="font-medium">{{ sipResult.actualReturnRate.toFixed(2) }}%</span>
              </div>
              <div>
                <span class="text-muted-foreground">管理费用：</span>
                <span class="font-medium">¥{{ sipResult.totalFees.toFixed(2) }}</span>
              </div>
              <div v-if="includeInflation">
                <span class="text-muted-foreground">实际购买力：</span>
                <span class="font-medium">¥{{ sipResult.realPurchasingPower.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 收益增长图表 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">收益增长趋势</h3>
          <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div class="text-center text-gray-500">
              <TrendingUp class="w-12 h-12 mx-auto mb-2" />
              <p class="text-sm">图表功能开发中</p>
              <p class="text-xs">将显示定投收益增长曲线</p>
            </div>
          </div>
        </div>

        <!-- 投资建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投资建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>定投适合长期投资，建议坚持3年以上</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>选择业绩稳定的优质基金进行定投</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>根据个人风险承受能力调整定投金额</span>
            </div>
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>定投不保证收益，投资需谨慎</span>
            </div>
          </div>
        </div>

        <!-- 定投策略 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">定投策略推荐</h3>
          <div class="space-y-3">
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">保守策略</div>
              <div class="text-sm text-muted-foreground">月投500-1000元，债券型基金为主</div>
              <div class="text-xs text-green-600 mt-1">适合风险承受能力较低的投资者</div>
            </div>
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">稳健策略</div>
              <div class="text-sm text-muted-foreground">月投1000-3000元，混合型基金为主</div>
              <div class="text-xs text-blue-600 mt-1">适合有一定风险承受能力的投资者</div>
            </div>
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">积极策略</div>
              <div class="text-sm text-muted-foreground">月投3000元以上，股票型基金为主</div>
              <div class="text-xs text-orange-600 mt-1">适合风险承受能力较强的投资者</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: '基金定投计算器 - 在线计算定投收益和投资回报',
  description: '免费基金定投计算器，支持计算定投收益、收益率、定投频率分析，提供投资建议和策略推荐，帮助您制定最佳定投计划。专业的基金投资规划工具，支持多种定投策略和通胀调整计算。',
  keywords: ['基金定投计算器', '定投收益计算', 'SIP计算器', '基金投资收益', '定投收益率', '投资规划', '基金定投策略', '定期定额投资', '基金理财工具', '长期投资规划', '复利计算', '通胀调整'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '基金定投计算器',
    description: '免费的在线基金定投收益计算工具，支持定投收益、收益率、定投频率分析，提供投资建议和策略推荐，帮助制定最佳定投计划。',
    url: 'https://util.iskytrip.com/tools/fund-sip-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '基金定投收益计算',
      '定投频率分析',
      '投资回报率计算',
      '管理费用计算',
      '通胀调整计算',
      '定投策略推荐',
      '复利效果分析',
      '投资方案对比'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '基金投资者'
    }
  }
})

// 状态管理
const monthlyAmount = ref(1000)
const investmentYears = ref(5)
const expectedReturn = ref(8)
const frequency = ref('monthly')
const periodicAmount = ref(250)
const managementFee = ref(1.5)
const purchaseFee = ref(0.15)
const includeInflation = ref(false)
const inflationRate = ref(3)

const sipResult = ref(null)

// 获取定投频率单位
const getFrequencyUnit = () => {
  const units = {
    quarterly: '季度',
    weekly: '周'
  }
  return units[frequency.value] || '月'
}

// 获取每年定投次数
const getPeriodsPerYear = () => {
  const periods = {
    monthly: 12,
    quarterly: 4,
    weekly: 52
  }
  return periods[frequency.value] || 12
}

// 计算定投收益
const calculateSIP = () => {
  const periodsPerYear = getPeriodsPerYear()
  const totalPeriods = investmentYears.value * periodsPerYear
  const periodRate = expectedReturn.value / 100 / periodsPerYear
  const adjustedPeriodRate = periodRate - (managementFee.value / 100 / periodsPerYear)

  // 确定每期定投金额
  let periodAmount = frequency.value === 'monthly' ? monthlyAmount.value : periodicAmount.value

  if (!periodAmount || periodAmount <= 0) return

  // 计算总投入
  const totalInvestment = periodAmount * totalPeriods * (1 + purchaseFee.value / 100)

  // 计算定投终值 (年金的未来价值)
  let finalAmount
  if (adjustedPeriodRate === 0) {
    finalAmount = totalInvestment
  } else {
    finalAmount = periodAmount * (Math.pow(1 + adjustedPeriodRate, totalPeriods) - 1) / adjustedPeriodRate
  }

  // 计算收益
  const totalReturn = finalAmount - totalInvestment
  const totalReturnRate = (totalReturn / totalInvestment) * 100
  const actualReturnRate = ((finalAmount / totalInvestment) ** (1 / investmentYears.value) - 1) * 100

  // 计算管理费用
  const totalFees = totalInvestment * (managementFee.value / 100)

  // 计算实际购买力（考虑通胀）
  let realPurchasingPower = finalAmount
  if (includeInflation.value) {
    const realRate = (1 + expectedReturn.value / 100) / (1 + inflationRate.value / 100) - 1
    const realPeriodRate = realRate / periodsPerYear
    if (realPeriodRate !== 0) {
      realPurchasingPower = periodAmount * (Math.pow(1 + realPeriodRate, totalPeriods) - 1) / realPeriodRate
    }
  }

  sipResult.value = {
    totalInvestment,
    totalReturn,
    totalReturnRate,
    actualReturnRate,
    finalAmount,
    totalFees,
    totalPeriods,
    realPurchasingPower
  }
}

// 重置计算
const resetCalculation = () => {
  monthlyAmount.value = 1000
  investmentYears.value = 5
  expectedReturn.value = 8
  frequency.value = 'monthly'
  periodicAmount.value = 250
  managementFee.value = 1.5
  purchaseFee.value = 0.15
  includeInflation.value = false
  inflationRate.value = 3
  sipResult.value = null
}

// 方案对比
const compareScenarios = () => {
  alert('方案对比功能开发中，将提供多种投资方案对比分析')
}

// 导出报告
const exportReport = () => {
  if (!sipResult.value) return

  const report = `基金定投投资报告
定投金额: ${frequency.value === 'monthly' ? monthlyAmount.value : periodicAmount.value}元/${getFrequencyUnit()}
定投期限: ${investmentYears.value}年
预期年化收益: ${expectedReturn.value}%
定投频率: ${frequency.value}

投资结果:
总投入金额: ¥${sipResult.value.totalInvestment.toFixed(2)}
预期总收益: ¥${sipResult.value.totalReturn.toFixed(2)}
最终金额: ¥${sipResult.value.finalAmount.toFixed(2)}
总收益率: ${sipResult.value.totalReturnRate.toFixed(2)}%
定投次数: ${sipResult.value.totalPeriods}次

生成时间: ${new Date().toLocaleDateString()}`

  navigator.clipboard.writeText(report)
  alert('投资报告已复制到剪贴板')
}

// 初始化计算
calculateSIP()
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>