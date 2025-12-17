<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">贷款计算器</h1>
      <p class="text-muted-foreground">计算房贷、车贷等月供金额、总利息和还款计划，支持等额本息和等额本金</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：贷款参数输入 -->
      <div class="lg:col-span-1 space-y-4">
        <!-- 贷款类型选择 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">贷款类型</h2>
          <div class="space-y-2">
            <button
              v-for="type in loanTypes"
              :key="type.id"
              @click="loanType = type.id"
              :class="[
                'w-full p-3 rounded-lg border transition-all text-left',
                loanType === type.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary'
              ]"
            >
              <div class="font-medium">{{ type.name }}</div>
              <div class="text-sm text-muted-foreground">{{ type.description }}</div>
            </button>
          </div>
        </div>

        <!-- 贷款参数 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">贷款参数</h2>

          <div class="space-y-4">
            <!-- 贷款金额 -->
            <div>
              <label class="block text-sm font-medium mb-2">贷款金额（万元）</label>
              <input
                v-model.number="loanAmount"
                @input="calculateLoan"
                type="number"
                min="1"
                max="10000"
                step="1"
                placeholder="100"
                class="w-full px-3 py-2 border rounded-md"
              >
              <div class="mt-1 text-xs text-muted-foreground">
                约人民币 {{ formatCurrency(loanAmount * 10000) }}
              </div>
            </div>

            <!-- 贷款年限 -->
            <div>
              <label class="block text-sm font-medium mb-2">贷款年限</label>
              <div class="flex gap-2">
                <input
                  v-model.number="loanYears"
                  @input="calculateLoan"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="30"
                  class="flex-1 px-3 py-2 border rounded-md"
                >
                <span class="px-3 py-2 bg-muted rounded-md">年</span>
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                共 {{ loanYears * 12 }} 期
              </div>
            </div>

            <!-- 年利率 -->
            <div>
              <label class="block text-sm font-medium mb-2">年利率（%）</label>
              <div class="flex gap-2">
                <input
                  v-model.number="interestRate"
                  @input="calculateLoan"
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.01"
                  placeholder="4.9"
                  class="flex-1 px-3 py-2 border rounded-md"
                >
                <span class="px-3 py-2 bg-muted rounded-md">%</span>
              </div>
              <!-- 利率快捷选择 -->
              <div class="mt-2 grid grid-cols-3 gap-1">
                <button
                  v-for="rate in quickRates"
                  :key="rate"
                  @click="interestRate = rate; calculateLoan()"
                  class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded"
                >
                  {{ rate }}%
                </button>
              </div>
            </div>

            <!-- 还款方式 -->
            <div>
              <label class="block text-sm font-medium mb-2">还款方式</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input
                    v-model="repaymentType"
                    value="equal-payment"
                    type="radio"
                    class="rounded"
                    @change="calculateLoan"
                  >
                  <span class="text-sm">等额本息</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="repaymentType"
                    value="equal-principal"
                    type="radio"
                    class="rounded"
                    @change="calculateLoan"
                  >
                  <span class="text-sm">等额本金</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 计算结果概览 -->
        <div v-if="loanResult" class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">计算结果</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="text-sm text-blue-800 mb-1">月供金额</div>
              <div class="text-2xl font-bold text-blue-700">
                {{ formatCurrency(loanResult.monthlyPayment) }}
              </div>
              <div class="text-xs text-blue-600">
                {{ repaymentType === 'equal-payment' ? '每月固定' : '逐月递减' }}
              </div>
            </div>

            <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="text-sm text-green-800 mb-1">支付利息</div>
              <div class="text-2xl font-bold text-green-700">
                {{ formatCurrency(loanResult.totalInterest) }}
              </div>
              <div class="text-xs text-green-600">
                利息占比 {{ ((loanResult.totalInterest / loanResult.totalPayment) * 100).toFixed(1) }}%
              </div>
            </div>

            <div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div class="text-sm text-orange-800 mb-1">还款总额</div>
              <div class="text-2xl font-bold text-orange-700">
                {{ formatCurrency(loanResult.totalPayment) }}
              </div>
              <div class="text-xs text-orange-600">
                本金 {{ formatCurrency(loanAmount * 10000) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 还款计划表 -->
        <div v-if="loanResult" class="bg-card rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">还款计划</h2>
            <div class="flex gap-2">
              <button
                @click="showChart = !showChart"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                {{ showChart ? '隐藏图表' : '显示图表' }}
              </button>
              <button
                @click="exportSchedule"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                导出计划
              </button>
            </div>
          </div>

          <!-- 图表展示 -->
          <div v-if="showChart" class="mb-6 h-64">
            <div class="h-full flex items-end justify-around gap-1">
              <div
                v-for="(year, index) in yearlyData"
                :key="index"
                class="flex-1 flex flex-col items-center gap-1"
              >
                <div class="relative w-full flex justify-center">
                  <div
                    class="bg-blue-500 rounded-t"
                    :style="{ height: `${(year.principal / Math.max(...yearlyData.map(y => y.principal + y.interest))) * 200}px` }"
                    :title="`本金: ${formatCurrency(year.principal)}`"
                  ></div>
                  <div
                    class="bg-red-500 rounded-t absolute bottom-0"
                    :style="{ height: `${(year.interest / Math.max(...yearlyData.map(y => y.principal + y.interest))) * 200}px` }"
                    :title="`利息: ${formatCurrency(year.interest)}`"
                  ></div>
                </div>
                <div class="text-xs">{{ year.year }}</div>
              </div>
            </div>
            <div class="flex justify-center gap-4 mt-2">
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-blue-500 rounded"></div>
                <span class="text-xs">本金</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 bg-red-500 rounded"></div>
                <span class="text-xs">利息</span>
              </div>
            </div>
          </div>

          <!-- 还款计划表格 -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">期数</th>
                  <th class="text-left py-2">月供</th>
                  <th class="text-left py-2">本金</th>
                  <th class="text-left py-2">利息</th>
                  <th class="text-left py-2">剩余本金</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(payment, index) in displaySchedule"
                  :key="index"
                  class="border-b"
                >
                  <td class="py-2">{{ payment.period }}</td>
                  <td class="py-2">{{ formatCurrency(payment.payment) }}</td>
                  <td class="py-2">{{ formatCurrency(payment.principal) }}</td>
                  <td class="py-2">{{ formatCurrency(payment.interest) }}</td>
                  <td class="py-2">{{ formatCurrency(payment.balance) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页控制 -->
          <div class="mt-4 flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              显示 {{ displayStart + 1 }}-{{ Math.min(displayEnd, totalPeriods) }} 期，共 {{ totalPeriods }} 期
            </div>
            <div class="flex gap-2">
              <button
                @click="prevPage"
                :disabled="displayStart === 0"
                class="px-3 py-1 border rounded disabled:opacity-50"
              >
                上一页
              </button>
              <button
                @click="nextPage"
                :disabled="displayEnd >= totalPeriods"
                class="px-3 py-1 border rounded disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>

        <!-- 贷款建议 -->
        <div v-if="loanResult" class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">贷款建议</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium mb-2">财务建议</h4>
              <ul class="space-y-2 text-sm text-muted-foreground">
                <li class="flex items-start gap-2">
                  <Check class="w-4 h-4 text-green-500 mt-0.5" />
                  <span>月供不超过月收入的30-40%</span>
                </li>
                <li class="flex items-start gap-2">
                  <Check class="w-4 h-4 text-green-500 mt-0.5" />
                  <span>保留3-6个月生活费作为应急储备</span>
                </li>
                <li class="flex items-start gap-2">
                  <Check class="w-4 h-4 text-green-500 mt-0.5" />
                  <span>考虑提前还款减少利息支出</span>
                </li>
                <li class="flex items-start gap-2">
                  <Check class="w-4 h-4 text-green-500 mt-0.5" />
                  <span>比较不同银行的利率和费用</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium mb-2">利率参考</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">商业贷款：</span>
                  <span>3.85%-4.9%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">公积金贷款：</span>
                  <span>2.75%-3.25%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">组合贷款：</span>
                  <span>根据比例计算</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">二套房利率：</span>
                  <span>上浮10%-20%</span>
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
import { ref, computed } from 'vue'
import { Check, TrendingUp, Calculator } from 'lucide-vue-next'

// 状态管理
const loanType = ref('house')
const loanAmount = ref(100)
const loanYears = ref(30)
const interestRate = ref(4.9)
const repaymentType = ref('equal-payment')
const showChart = ref(false)
const displayStart = ref(0)
const displayEnd = ref(12)

// 贷款类型
const loanTypes = [
  {
    id: 'house',
    name: '房屋贷款',
    description: '购买新房或二手房的按揭贷款'
  },
  {
    id: 'car',
    name: '汽车贷款',
    description: '购买新车的消费贷款'
  },
  {
    id: 'business',
    name: '经营贷款',
    description: '企业经营的流动资金贷款'
  },
  {
    id: 'personal',
    name: '个人消费贷款',
    description: '个人大额消费的信用贷款'
  }
]

// 快捷利率选择
const quickRates = [3.85, 4.2, 4.9, 5.4, 5.88]

// 计算属性
const totalPeriods = computed(() => loanYears.value * 12)

const loanResult = computed(() => {
  if (!loanAmount.value || !loanYears.value || !interestRate.value) return null

  const principal = loanAmount.value * 10000 // 转换为元
  const monthlyRate = interestRate.value / 100 / 12
  const periods = totalPeriods.value

  let monthlyPayment, totalPayment, totalInterest, schedule

  if (repaymentType.value === 'equal-payment') {
    // 等额本息计算
    if (monthlyRate === 0) {
      monthlyPayment = principal / periods
    } else {
      monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, periods) /
                     (Math.pow(1 + monthlyRate, periods) - 1)
    }

    totalPayment = monthlyPayment * periods
    totalInterest = totalPayment - principal

    // 生成还款计划
    schedule = generateEqualPaymentSchedule(principal, monthlyRate, periods, monthlyPayment)
  } else {
    // 等额本金计算
    const monthlyPrincipal = principal / periods
    let balance = principal
    let totalPaymentSum = 0
    let totalInterestSum = 0

    schedule = []
    for (let i = 1; i <= periods; i++) {
      const monthlyInterest = balance * monthlyRate
      const payment = monthlyPrincipal + monthlyInterest
      balance -= monthlyPrincipal

      totalPaymentSum += payment
      totalInterestSum += monthlyInterest

      schedule.push({
        period: i,
        payment: payment,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        balance: Math.max(0, balance)
      })
    }

    monthlyPayment = schedule[0].payment
    totalPayment = totalPaymentSum
    totalInterest = totalInterestSum
  }

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    schedule
  }
})

const displaySchedule = computed(() => {
  if (!loanResult.value) return []
  return loanResult.value.schedule.slice(displayStart.value, displayEnd.value)
})

const yearlyData = computed(() => {
  if (!loanResult.value) return []

  const schedule = loanResult.value.schedule
  const years = Math.ceil(schedule.length / 12)
  const data = []

  for (let i = 0; i < years; i++) {
    const startIndex = i * 12
    const endIndex = Math.min((i + 1) * 12, schedule.length)
    const yearSchedule = schedule.slice(startIndex, endIndex)

    const principal = yearSchedule.reduce((sum, item) => sum + item.principal, 0)
    const interest = yearSchedule.reduce((sum, item) => sum + item.interest, 0)

    data.push({
      year: `第${i + 1}年`,
      principal,
      interest
    })
  }

  return data
})

// 方法
const calculateLoan = () => {
  // 计算在computed属性中自动进行
}

const generateEqualPaymentSchedule = (principal, monthlyRate, periods, monthlyPayment) => {
  const schedule = []
  let balance = principal

  for (let i = 1; i <= periods; i++) {
    const monthlyInterest = balance * monthlyRate
    const monthlyPrincipal = monthlyPayment - monthlyInterest
    balance -= monthlyPrincipal

    schedule.push({
      period: i,
      payment: monthlyPayment,
      principal: monthlyPrincipal,
      interest: monthlyInterest,
      balance: Math.max(0, balance)
    })
  }

  return schedule
}

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '¥0'
  return '¥' + Number(amount).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

const prevPage = () => {
  if (displayStart.value > 0) {
    displayStart.value = Math.max(0, displayStart.value - 12)
    displayEnd.value = displayStart.value + 12
  }
}

const nextPage = () => {
  if (displayEnd.value < totalPeriods.value) {
    displayStart.value = displayEnd.value
    displayEnd.value = Math.min(totalPeriods.value, displayEnd.value + 12)
  }
}

const exportSchedule = () => {
  if (!loanResult.value) return

  const headers = ['期数', '月供', '本金', '利息', '剩余本金']
  const rows = loanResult.value.schedule.map(item => [
    item.period,
    item.payment.toFixed(2),
    item.principal.toFixed(2),
    item.interest.toFixed(2),
    item.balance.toFixed(2)
  ])

  let csv = headers.join(',') + '\n'
  rows.forEach(row => {
    csv += row.join(',') + '\n'
  })

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `还款计划表_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// 初始化
calculateLoan()

// SEO配置
useSeoMeta({
  title: '贷款计算器 - 房贷车贷月供利息计算工具',
  description: '免费在线贷款计算器，支持等额本息和等额本金两种还款方式，计算月供、总利息和生成详细还款计划表。',
  keywords: ['贷款计算', '房贷计算', '月供计算', '利息计算', '还款计划', '等额本息', '等额本金']
})

definePageMeta({
  layout: 'default'
})
</script>