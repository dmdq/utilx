<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">信用卡还款计算器</h1>
      <p class="text-muted-foreground mb-6">计算信用卡最低还款、分期还款计划和利息成本，优化还款策略</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 账单信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">账单信息</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">账单金额（元）</label>
              <input
                v-model.number="billAmount"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入账单金额"
                @input="calculatePayment"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">年利率（%）</label>
              <input
                v-model.number="annualRate"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入年利率"
                @input="calculatePayment"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">最低还款比例（%）</label>
              <input
                v-model.number="minimumPaymentRate"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入最低还款比例"
                @input="calculatePayment"
              />
            </div>
          </div>
        </div>

        <!-- 还款方式选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">还款方式</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="paymentMethod"
                type="radio"
                value="minimum"
                class="mr-2"
                @change="calculatePayment"
              />
              <span class="text-sm">最低还款</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="paymentMethod"
                type="radio"
                value="full"
                class="mr-2"
                @change="calculatePayment"
              />
              <span class="text-sm">全额还款</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="paymentMethod"
                type="radio"
                value="installment"
                class="mr-2"
                @change="calculatePayment"
              />
              <span class="text-sm">分期还款</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="paymentMethod"
                type="radio"
                value="custom"
                class="mr-2"
                @change="calculatePayment"
              />
              <span class="text-sm">自定义金额</span>
            </label>
          </div>

          <!-- 分期还款选项 -->
          <div v-if="paymentMethod === 'installment'" class="mt-4 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">分期期数</label>
              <select
                v-model="installmentPeriods"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @change="calculatePayment"
              >
                <option value="3">3期</option>
                <option value="6">6期</option>
                <option value="9">9期</option>
                <option value="12">12期</option>
                <option value="18">18期</option>
                <option value="24">24期</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">分期手续费率（%）</label>
              <input
                v-model.number="installmentFeeRate"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入分期手续费率"
                @input="calculatePayment"
              />
            </div>
          </div>

          <!-- 自定义金额选项 -->
          <div v-if="paymentMethod === 'custom'" class="mt-4">
            <div>
              <label class="block text-sm font-medium mb-2">自定义还款金额（元）</label>
              <input
                v-model.number="customPayment"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入还款金额"
                @input="calculatePayment"
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="resetCalculation"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
          >
            重置
          </button>
          <button
            @click="exportPlan"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            导出方案
          </button>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="space-y-6">
        <!-- 还款结果 -->
        <div v-if="paymentResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">还款结果</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-600 mb-1">本期应还</div>
                <div class="text-xl font-bold text-blue-800">
                  ¥{{ paymentResult.currentPayment.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-green-600 mb-1">剩余本金</div>
                <div class="text-xl font-bold text-green-800">
                  ¥{{ paymentResult.remainingBalance.toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-yellow-600 mb-1">本期利息</div>
                <div class="text-xl font-bold text-yellow-800">
                  ¥{{ paymentResult.currentInterest.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm text-purple-600 mb-1">手续费</div>
                <div class="text-xl font-bold text-purple-800">
                  ¥{{ paymentResult.fee.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分期还款计划 -->
        <div v-if="paymentMethod === 'installment' && installmentPlan" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">分期还款计划</h3>
          <div class="space-y-3">
            <div class="p-3 bg-gray-50 rounded">
              <div class="flex justify-between text-sm mb-1">
                <span>每期还款金额</span>
                <span class="font-medium">¥{{ installmentPlan.monthlyPayment.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm mb-1">
                <span>总手续费</span>
                <span class="font-medium">¥{{ installmentPlan.totalFee.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>总还款金额</span>
                <span class="font-medium">¥{{ installmentPlan.totalPayment.toFixed(2) }}</span>
              </div>
            </div>

            <div class="max-h-48 overflow-y-auto">
              <div v-for="(payment, index) in installmentPlan.payments" :key="index"
                   class="p-2 border-b text-sm">
                <div class="flex justify-between">
                  <span>第{{ index + 1 }}期</span>
                  <span>¥{{ payment.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 利息计算器 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">利息计算器</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">还款天数</label>
              <input
                v-model.number="paymentDays"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入还款天数"
                @input="calculateDailyInterest"
              />
            </div>

            <div v-if="dailyInterestResult" class="p-3 bg-orange-50 rounded-lg">
              <div class="text-sm text-orange-600 mb-1">{{ paymentDays }}天利息</div>
              <div class="text-xl font-bold text-orange-800">
                ¥{{ dailyInterestResult.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 还款建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">还款建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>建议优先全额还款，避免高额利息支出</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>最低还款只适合短期资金周转，长期成本较高</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>分期还款适合大额消费，可缓解短期还款压力</span>
            </div>
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>避免逾期还款，以免影响个人信用记录</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: '信用卡还款计算器 - 在线计算最低还款、分期还款和利息',
  description: '免费信用卡还款计算器，支持最低还款计算、分期还款计划、利息成本分析，帮助您选择最优还款策略，避免高额利息支出。专业的信用卡管理工具，支持多种还款方式对比和日利息计算。',
  keywords: ['信用卡还款计算器', '最低还款计算', '分期还款', '信用卡利息计算', '还款计划', '信用卡管理工具', '信用卡账单', '循环利息', '信用卡分期', '最低还款额', '信用卡理财', '账单分期'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '信用卡还款计算器',
    description: '免费的在线信用卡还款计算工具，支持最低还款、分期还款、利息成本分析，帮助选择最优还款策略，避免高额利息支出。',
    url: 'https://util.iskytrip.com/tools/credit-card-payment-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '最低还款计算',
      '分期还款计划',
      '信用卡利息计算',
      '日利息计算器',
      '还款策略对比',
      '手续费计算',
      '还款计划导出',
      '账单管理建议'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '信用卡持卡人'
    }
  }
})

// 状态管理
const billAmount = ref(10000)
const annualRate = ref(18.25)
const minimumPaymentRate = ref(10)
const paymentMethod = ref('minimum')
const installmentPeriods = ref(12)
const installmentFeeRate = ref(0.6)
const customPayment = ref(0)
const paymentDays = ref(30)

const paymentResult = ref(null)
const installmentPlan = ref(null)
const dailyInterestResult = ref(0)

// 计算还款
const calculatePayment = () => {
  if (!billAmount.value || billAmount.value <= 0) return

  let currentPayment = 0
  let currentInterest = 0
  let fee = 0
  let remainingBalance = billAmount.value

  const monthlyRate = annualRate.value / 100 / 12

  switch (paymentMethod.value) {
    case 'minimum':
      currentPayment = Math.max(billAmount.value * minimumPaymentRate.value / 100, 50)
      currentInterest = billAmount.value * monthlyRate
      remainingBalance = billAmount.value - (currentPayment - currentInterest)
      break

    case 'full':
      currentPayment = billAmount.value
      currentInterest = 0
      remainingBalance = 0
      break

    case 'installment':
      const monthlyInstallment = billAmount.value / installmentPeriods.value
      const monthlyFee = billAmount.value * installmentFeeRate.value / 100
      currentPayment = monthlyInstallment + monthlyFee
      fee = monthlyFee
      remainingBalance = billAmount.value - monthlyInstallment
      currentInterest = 0

      // 生成分期计划
      installmentPlan.value = {
        monthlyPayment: currentPayment,
        totalFee: monthlyFee * installmentPeriods.value,
        totalPayment: billAmount.value + monthlyFee * installmentPeriods.value,
        payments: Array(installmentPeriods.value).fill(currentPayment)
      }
      break

    case 'custom':
      currentPayment = customPayment.value || billAmount.value
      currentInterest = billAmount.value * monthlyRate
      remainingBalance = Math.max(0, billAmount.value - (currentPayment - currentInterest))
      break
  }

  paymentResult.value = {
    currentPayment,
    currentInterest,
    fee,
    remainingBalance
  }
}

// 计算每日利息
const calculateDailyInterest = () => {
  if (!billAmount.value || !paymentDays.value) {
    dailyInterestResult.value = 0
    return
  }

  const dailyRate = annualRate.value / 100 / 365
  dailyInterestResult.value = billAmount.value * dailyRate * paymentDays.value
}

// 重置计算
const resetCalculation = () => {
  billAmount.value = 10000
  annualRate.value = 18.25
  minimumPaymentRate.value = 10
  paymentMethod.value = 'minimum'
  installmentPeriods.value = 12
  installmentFeeRate.value = 0.6
  customPayment.value = 0
  paymentDays.value = 30
  paymentResult.value = null
  installmentPlan.value = null
  dailyInterestResult.value = 0
}

// 导出方案
const exportPlan = () => {
  if (!paymentResult.value) return

  const plan = {
    billAmount: billAmount.value,
    paymentMethod: paymentMethod.value,
    currentPayment: paymentResult.value.currentPayment,
    currentInterest: paymentResult.value.currentInterest,
    fee: paymentResult.value.fee,
    remainingBalance: paymentResult.value.remainingBalance,
    date: new Date().toLocaleDateString()
  }

  const text = `信用卡还款方案
账单金额: ¥${plan.billAmount.toFixed(2)}
还款方式: ${getPaymentMethodName(plan.paymentMethod)}
本期应还: ¥${plan.currentPayment.toFixed(2)}
本期利息: ¥${plan.currentInterest.toFixed(2)}
手续费: ¥${plan.fee.toFixed(2)}
剩余本金: ¥${plan.remainingBalance.toFixed(2)}
生成日期: ${plan.date}`

  navigator.clipboard.writeText(text)
  alert('还款方案已复制到剪贴板')
}

// 获取还款方式名称
const getPaymentMethodName = (method) => {
  const names = {
    minimum: '最低还款',
    full: '全额还款',
    installment: '分期还款',
    custom: '自定义金额'
  }
  return names[method] || method
}

// 初始化计算
calculatePayment()
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>