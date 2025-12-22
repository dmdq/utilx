<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">股票收益计算器</h1>
      <p class="text-muted-foreground mb-6">计算股票买卖收益、税费成本和持仓收益率，支持多笔交易汇总分析</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 交易信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">交易信息</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">买入价格（元）</label>
                <input
                  v-model.number="buyPrice"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入买入价格"
                  @input="calculateProfit"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">买入数量（股）</label>
                <input
                  v-model.number="buyQuantity"
                  type="number"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入买入数量"
                  @input="calculateProfit"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">卖出价格（元）</label>
                <input
                  v-model.number="sellPrice"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入卖出价格"
                  @input="calculateProfit"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">卖出数量（股）</label>
                <input
                  v-model.number="sellQuantity"
                  type="number"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入卖出数量"
                  @input="calculateProfit"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 费用设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">费用设置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">佣金费率（%）</label>
              <input
                v-model.number="commissionRate"
                type="number"
                step="0.001"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入佣金费率"
                @input="calculateProfit"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">最低佣金（元）</label>
              <input
                v-model.number="minCommission"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入最低佣金"
                @input="calculateProfit"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">印花税（%）</label>
                <input
                  v-model.number="stampTax"
                  type="number"
                  step="0.001"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入印花税"
                  @input="calculateProfit"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">过户费（%）</label>
                <input
                  v-model.number="transferFee"
                  type="number"
                  step="0.001"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入过户费"
                  @input="calculateProfit"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 税费设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">税费设置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">持股期限</label>
              <select
                v-model="holdingPeriod"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @change="calculateProfit"
              >
                <option value="">请选择持股期限</option>
                <option value="within1year">持股不足1年</option>
                <option value="over1year">持股超过1年</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">个人所得税率（%）</label>
              <input
                v-model.number="incomeTaxRate"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入个人所得税率"
                @input="calculateProfit"
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
            @click="addToHistory"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            添加记录
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
        <!-- 收益结果 -->
        <div v-if="profitResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">收益结果</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-600 mb-1">总收益</div>
                <div class="text-xl font-bold text-blue-800">
                  ¥{{ profitResult.totalProfit.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-green-600 mb-1">收益率</div>
                <div class="text-xl font-bold text-green-800">
                  {{ profitResult.profitRate.toFixed(2) }}%
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm text-purple-600 mb-1">总成本</div>
                <div class="text-xl font-bold text-purple-800">
                  ¥{{ profitResult.totalCost.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-yellow-600 mb-1">净收益</div>
                <div class="text-xl font-bold text-yellow-800">
                  ¥{{ profitResult.netProfit.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 费用明细 -->
        <div v-if="profitResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">费用明细</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">买入佣金：</span>
              <span class="font-medium">¥{{ profitResult.buyCommission.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">卖出佣金：</span>
              <span class="font-medium">¥{{ profitResult.sellCommission.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">印花税：</span>
              <span class="font-medium">¥{{ profitResult.stampTaxAmount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">过户费：</span>
              <span class="font-medium">¥{{ profitResult.transferFeeAmount.toFixed(2) }}</span>
            </div>
            <div v-if="profitResult.incomeTax > 0" class="flex justify-between text-sm">
              <span class="text-muted-foreground">个人所得税：</span>
              <span class="font-medium">¥{{ profitResult.incomeTax.toFixed(2) }}</span>
            </div>
            <div class="pt-3 border-t">
              <div class="flex justify-between font-medium">
                <span>总费用：</span>
                <span class="text-red-600">¥{{ profitResult.totalFees.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 持仓信息 -->
        <div v-if="holdingInfo" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">持仓信息</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">剩余持股：</span>
              <span class="font-medium">{{ holdingInfo.remainingShares }}股</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">持仓成本：</span>
              <span class="font-medium">¥{{ holdingInfo.avgCost.toFixed(2) }}/股</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">持仓市值：</span>
              <span class="font-medium">¥{{ holdingInfo.holdingValue.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">浮动盈亏：</span>
              <span class="font-medium" :class="holdingInfo.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'">
                ¥{{ holdingInfo.unrealizedPnL.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="tradeHistory.length > 0" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">交易历史</h3>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div v-for="(trade, index) in tradeHistory" :key="index"
                 class="p-3 border rounded-lg text-sm">
              <div class="flex justify-between mb-1">
                <span class="font-medium">{{ trade.stockName || `交易${index + 1}` }}</span>
                <span :class="trade.profit >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ trade.profit >= 0 ? '+' : '' }}¥{{ trade.profit.toFixed(2) }}
                </span>
              </div>
              <div class="text-xs text-muted-foreground">
                {{ trade.buyPrice }}→{{ trade.sellPrice }} | {{ trade.quantity }}股 | {{ trade.rate.toFixed(2) }}%
              </div>
            </div>
          </div>

          <div v-if="tradeHistory.length > 0" class="mt-4 pt-4 border-t">
            <div class="flex justify-between font-medium">
              <span>累计收益：</span>
              <span :class="totalHistoryProfit >= 0 ? 'text-green-600' : 'text-red-600'">
                ¥{{ totalHistoryProfit.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 投资建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投资建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>A股交易印花税仅在卖出时收取，买入时不需要</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>持股超过1年免征个人所得税，鼓励长期投资</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>佣金费用有最低标准，小额交易成本相对较高</span>
            </div>
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>股票投资有风险，请根据自身风险承受能力投资</span>
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
  title: '股票收益计算器 - 在线计算股票买卖收益和税费',
  description: '免费股票收益计算器，支持计算股票买卖收益、税费成本、佣金、印花税等，提供持仓分析和交易历史记录，帮助您准确计算投资收益。专业的A股交易收益计算工具，支持多种费用计算和税务优化。',
  keywords: ['股票收益计算器', '股票交易收益', '股票税费计算', '投资收益率', '股票佣金计算', '印花税计算', 'A股交易', '股票投资工具', '持股成本计算', '股票盈亏计算', '证券交易费用', '股票持仓分析'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '股票收益计算器',
    description: '免费的在线股票交易收益计算工具，支持A股买卖收益、税费成本、佣金、印花税等费用计算，提供持仓分析和交易历史记录功能。',
    url: 'https://util.iskytrip.com/tools/stock-profit-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '股票买卖收益计算',
      '交易佣金计算',
      '印花税费计算',
      '过户费计算',
      '个人所得税计算',
      '持仓成本分析',
      '浮动盈亏计算',
      '交易历史记录'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '股票投资者'
    }
  }
})

// 状态管理
const buyPrice = ref(10.00)
const buyQuantity = ref(1000)
const sellPrice = ref(12.00)
const sellQuantity = ref(1000)
const commissionRate = ref(0.025) // 0.025%
const minCommission = ref(5) // 最低5元
const stampTax = ref(0.1) // 0.1%
const transferFee = ref(0.002) // 0.002%
const holdingPeriod = ref('over1year') // 默认超过1年
const incomeTaxRate = ref(20) // 20%

const profitResult = ref(null)
const holdingInfo = ref(null)
const tradeHistory = ref([])

// 计算股票收益
const calculateProfit = () => {
  if (!buyPrice.value || !buyQuantity.value || !sellPrice.value || !sellQuantity.value) {
    profitResult.value = null
    return
  }

  // 计算佣金
  const buyCommissionAmount = buyPrice.value * buyQuantity.value * commissionRate.value / 100
  const buyCommission = Math.max(buyCommissionAmount, minCommission.value)

  const sellCommissionAmount = sellPrice.value * sellQuantity.value * commissionRate.value / 100
  const sellCommission = Math.max(sellCommissionAmount, minCommission.value)

  // 计算印花税（仅卖出时收取）
  const stampTaxAmount = sellPrice.value * sellQuantity.value * stampTax.value / 100

  // 计算过户费
  const buyTransferFee = buyPrice.value * buyQuantity.value * transferFee.value / 100
  const sellTransferFee = sellPrice.value * sellQuantity.value * transferFee.value / 100
  const totalTransferFee = buyTransferFee + sellTransferFee

  // 计算总费用
  const totalFees = buyCommission + sellCommission + stampTaxAmount + totalTransferFee

  // 计算收益
  const buyAmount = buyPrice.value * buyQuantity.value
  const sellAmount = sellPrice.value * sellQuantity.value
  const grossProfit = sellAmount - buyAmount

  // 计算个人所得税（持股不足1年需要缴纳）
  let incomeTax = 0
  if (holdingPeriod.value === 'within1year' && grossProfit > totalFees) {
    incomeTax = (grossProfit - totalFees) * incomeTaxRate.value / 100
  }

  const totalProfit = grossProfit - totalFees - incomeTax
  const totalCost = buyAmount + totalFees + incomeTax
  const netProfit = totalProfit
  const profitRate = (totalProfit / totalCost) * 100

  profitResult.value = {
    totalProfit,
    profitRate,
    totalCost,
    netProfit,
    buyCommission,
    sellCommission,
    stampTaxAmount,
    transferFeeAmount: totalTransferFee,
    incomeTax,
    totalFees
  }

  // 计算持仓信息
  const remainingShares = buyQuantity.value - sellQuantity.value
  if (remainingShares > 0) {
    const avgCost = (buyAmount + buyCommission + buyTransferFee) / buyQuantity.value
    const holdingValue = remainingShares * sellPrice.value
    const unrealizedPnL = holdingValue - (remainingShares * avgCost)

    holdingInfo.value = {
      remainingShares,
      avgCost,
      holdingValue,
      unrealizedPnL
    }
  } else {
    holdingInfo.value = null
  }
}

// 累计历史收益
const totalHistoryProfit = computed(() => {
  return tradeHistory.value.reduce((total, trade) => total + trade.profit, 0)
})

// 添加到历史记录
const addToHistory = () => {
  if (!profitResult.value) return

  tradeHistory.value.unshift({
    stockName: `股票${tradeHistory.value.length + 1}`,
    buyPrice: buyPrice.value,
    sellPrice: sellPrice.value,
    quantity: sellQuantity.value,
    profit: profitResult.value.totalProfit,
    rate: profitResult.value.profitRate,
    date: new Date().toLocaleDateString()
  })

  // 限制历史记录数量
  if (tradeHistory.value.length > 10) {
    tradeHistory.value = tradeHistory.value.slice(0, 10)
  }
}

// 重置计算
const resetCalculation = () => {
  buyPrice.value = 10.00
  buyQuantity.value = 1000
  sellPrice.value = 12.00
  sellQuantity.value = 1000
  commissionRate.value = 0.025
  minCommission.value = 5
  stampTax.value = 0.1
  transferFee.value = 0.002
  holdingPeriod.value = 'over1year'
  incomeTaxRate.value = 20
  profitResult.value = null
  holdingInfo.value = null
}

// 导出报告
const exportReport = () => {
  if (!profitResult.value) return

  const report = `股票交易收益报告
买入信息:
- 买入价格: ¥${buyPrice.value}/股
- 买入数量: ${buyQuantity.value}股
- 买入金额: ¥${(buyPrice.value * buyQuantity.value).toFixed(2)}

卖出信息:
- 卖出价格: ¥${sellPrice.value}/股
- 卖出数量: ${sellQuantity.value}股
- 卖出金额: ¥${(sellPrice.value * sellQuantity.value).toFixed(2)}

费用明细:
- 买入佣金: ¥${profitResult.value.buyCommission.toFixed(2)}
- 卖出佣金: ¥${profitResult.value.sellCommission.toFixed(2)}
- 印花税: ¥${profitResult.value.stampTaxAmount.toFixed(2)}
- 过户费: ¥${profitResult.value.transferFeeAmount.toFixed(2)}
- 个人所得税: ¥${profitResult.value.incomeTax.toFixed(2)}
- 总费用: ¥${profitResult.value.totalFees.toFixed(2)}

收益结果:
- 总收益: ¥${profitResult.value.totalProfit.toFixed(2)}
- 收益率: ${profitResult.value.profitRate.toFixed(2)}%
- 净收益: ¥${profitResult.value.netProfit.toFixed(2)}

生成时间: ${new Date().toLocaleDateString()}`

  navigator.clipboard.writeText(report)
  alert('收益报告已复制到剪贴板')
}

// 初始化计算
calculateProfit()
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>