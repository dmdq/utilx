<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">房租收益计算器</h1>
      <p class="text-muted-foreground mb-6">计算房产租金收益率和投资回报，分析物业管理成本和税费影响</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">房产信息</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">房产价格（万元）</label>
              <input
                v-model.number="propertyPrice"
                type="number"
                step="1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入房产价格"
                @input="calculateYield"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">月租金（元）</label>
              <input
                v-model.number="monthlyRent"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入月租金"
                @input="calculateYield"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">首付比例（%）</label>
              <input
                v-model.number="downPaymentRatio"
                type="number"
                step="1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入首付比例"
                @input="calculateYield"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">贷款利率（%）</label>
              <input
                v-model.number="loanRate"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入贷款利率"
                @input="calculateYield"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">贷款期限（年）</label>
              <input
                v-model.number="loanTerm"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入贷款期限"
                @input="calculateYield"
              />
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">运营成本</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">物业费（元/月）</label>
              <input
                v-model.number="propertyFee"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入物业费"
                @input="calculateYield"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">维修费（元/年）</label>
              <input
                v-model.number="maintenanceFee"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入年维修费"
                @input="calculateYield"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">房产税（元/年）</label>
              <input
                v-model.number="propertyTax"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入年房产税"
                @input="calculateYield"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">空置率（%）</label>
              <input
                v-model.number="vacancyRate"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入空置率"
                @input="calculateYield"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="resetCalculation"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
          >
            重置
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
        <div v-if="yieldResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">收益分析</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-600 mb-1">毛收益率</div>
                <div class="text-xl font-bold text-blue-800">
                  {{ yieldResult.grossYield.toFixed(2) }}%
                </div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-green-600 mb-1">净收益率</div>
                <div class="text-xl font-bold text-green-800">
                  {{ yieldResult.netYield.toFixed(2) }}%
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm text-purple-600 mb-1">年净收入</div>
                <div class="text-xl font-bold text-purple-800">
                  ¥{{ yieldResult.annualNetIncome.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-yellow-600 mb-1">月现金流</div>
                <div class="text-xl font-bold text-yellow-800">
                  ¥{{ yieldResult.monthlyCashFlow.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="yieldResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">贷款分析</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">贷款金额：</span>
              <span class="font-medium">¥{{ yieldResult.loanAmount.toFixed(2) }}万</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">月供金额：</span>
              <span class="font-medium">¥{{ yieldResult.monthlyPayment.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">总利息：</span>
              <span class="font-medium">¥{{ yieldResult.totalInterest.toFixed(2) }}万</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">杠杆收益率：</span>
              <span class="font-medium">{{ yieldResult.leveragedYield.toFixed(2) }}%</span>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投资建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>建议净收益率不低于3-5%</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>考虑房产增值潜力和地段优势</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>预留维修基金应对突发支出</span>
            </div>
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>房产投资流动性较差，需长期持有</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: '房租收益计算器 - 在线计算房产租金收益率和投资回报',
  description: '免费房租收益计算器，支持计算房产租金收益率、投资回报、贷款分析、运营成本，帮助您评估房产投资价值。专业的房产投资分析工具，支持毛收益率、净收益率、杠杆收益率等多项指标计算。',
  keywords: ['房租收益计算器', '租金收益率', '房产投资回报', '租房收益', '房产投资分析', '租金回报率', '房产投资工具', '房贷计算器', '投资收益计算', '房地产投资', '租金回报计算', '房产估值'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '房租收益计算器',
    description: '免费的在线房产租金收益率和投资回报计算工具，支持贷款分析、运营成本计算，帮助投资者评估房产投资价值。',
    url: 'https://util.iskytrip.com/tools/rental-yield-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '房产租金收益率计算',
      '投资回报分析',
      '贷款利息计算',
      '运营成本评估',
      '现金流分析',
      '杠杆收益率计算'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '房产投资者'
    }
  }
})

const propertyPrice = ref(100)
const monthlyRent = ref(3000)
const downPaymentRatio = ref(30)
const loanRate = ref(4.9)
const loanTerm = ref(30)
const propertyFee = ref(200)
const maintenanceFee = ref(5000)
const propertyTax = ref(0)
const vacancyRate = ref(5)

const yieldResult = ref(null)

const calculateYield = () => {
  if (!propertyPrice.value || !monthlyRent.value) return

  const propertyValue = propertyPrice.value * 10000
  const annualRent = monthlyRent.value * 12
  const effectiveRent = annualRent * (1 - vacancyRate.value / 100)

  // 计算运营成本
  const annualPropertyFee = propertyFee.value * 12
  const totalAnnualCost = annualPropertyFee + maintenanceFee.value + propertyTax.value

  // 计算收益
  const annualNetIncome = effectiveRent - totalAnnualCost
  const grossYield = (annualRent / propertyValue) * 100
  const netYield = (annualNetIncome / propertyValue) * 100
  const monthlyCashFlow = annualNetIncome / 12

  // 贷款分析
  const loanAmount = propertyValue * (1 - downPaymentRatio.value / 100) / 10000
  const monthlyRate = loanRate.value / 100 / 12
  const totalMonths = loanTerm.value * 12

  let monthlyPayment = 0
  if (monthlyRate > 0) {
    monthlyPayment = (loanAmount * 10000 * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
                    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  }

  const totalPayment = monthlyPayment * totalMonths
  const totalInterest = (totalPayment - loanAmount * 10000) / 10000
  const monthlyCashFlowAfterLoan = monthlyCashFlow - monthlyPayment
  const leveragedYield = (monthlyCashFlowAfterLoan * 12) / (propertyValue * downPaymentRatio.value / 100) * 100

  yieldResult.value = {
    grossYield,
    netYield,
    annualNetIncome,
    monthlyCashFlow,
    loanAmount,
    monthlyPayment,
    totalInterest,
    leveragedYield
  }
}

const resetCalculation = () => {
  propertyPrice.value = 100
  monthlyRent.value = 3000
  downPaymentRatio.value = 30
  loanRate.value = 4.9
  loanTerm.value = 30
  propertyFee.value = 200
  maintenanceFee.value = 5000
  propertyTax.value = 0
  vacancyRate.value = 5
  yieldResult.value = null
}

const exportReport = () => {
  if (!yieldResult.value) return

  const report = `房产投资收益分析报告
房产信息:
- 房产价格: ¥${propertyPrice.value}万
- 月租金: ¥${monthlyRent.value}
- 首付比例: ${downPaymentRatio.value}%
- 贷款利率: ${loanRate.value}%
- 贷款期限: ${loanTerm.value}年

运营成本:
- 物业费: ¥${propertyFee.value}/月
- 维修费: ¥${maintenanceFee.value}/年
- 房产税: ¥${propertyTax.value}/年
- 空置率: ${vacancyRate.value}%

收益分析:
- 毛收益率: ${yieldResult.value.grossYield.toFixed(2)}%
- 净收益率: ${yieldResult.value.netYield.toFixed(2)}%
- 年净收入: ¥${yieldResult.value.annualNetIncome.toFixed(2)}
- 月现金流: ¥${yieldResult.value.monthlyCashFlow.toFixed(2)}

贷款分析:
- 贷款金额: ¥${yieldResult.value.loanAmount.toFixed(2)}万
- 月供金额: ¥${yieldResult.value.monthlyPayment.toFixed(2)}
- 总利息: ¥${yieldResult.value.totalInterest.toFixed(2)}万
- 杠杆收益率: ${yieldResult.value.leveragedYield.toFixed(2)}%

生成时间: ${new Date().toLocaleDateString()}`

  navigator.clipboard.writeText(report)
  alert('收益分析报告已复制到剪贴板')
}

calculateYield()
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>