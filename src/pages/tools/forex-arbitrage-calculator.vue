<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">外汇套利计算器</h1>
      <p class="text-muted-foreground mb-6">计算外汇套利机会和收益预测，分析汇率差和交易成本影响</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">套利设置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">套利金额（美元）</label>
              <input
                v-model.number="arbitrageAmount"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入套利金额"
                @input="calculateArbitrage"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">货币对A</label>
                <select
                  v-model="currencyPairA"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @change="calculateArbitrage"
                >
                  <option value="EURUSD">EUR/USD</option>
                  <option value="GBPUSD">GBP/USD</option>
                  <option value="USDJPY">USD/JPY</option>
                  <option value="USDCHF">USD/CHF</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">买入汇率</label>
                <input
                  v-model.number="rateA"
                  type="number"
                  step="0.0001"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入买入汇率"
                  @input="calculateArbitrage"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">货币对B</label>
                <select
                  v-model="currencyPairB"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  @change="calculateArbitrage"
                >
                  <option value="EURUSD">EUR/USD</option>
                  <option value="GBPUSD">GBP/USD</option>
                  <option value="USDJPY">USD/JPY</option>
                  <option value="USDCHF">USD/CHF</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">卖出汇率</label>
                <input
                  v-model.number="rateB"
                  type="number"
                  step="0.0001"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入卖出汇率"
                  @input="calculateArbitrage"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">交易成本</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">点差（点）</label>
                <input
                  v-model.number="spread"
                  type="number"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入点差"
                  @input="calculateArbitrage"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">手续费（%）</label>
                <input
                  v-model.number="commission"
                  type="number"
                  step="0.001"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入手续费"
                  @input="calculateArbitrage"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">过夜利息（美元/天）</label>
              <input
                v-model.number="swapFee"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入过夜利息"
                @input="calculateArbitrage"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">持仓时间（天）</label>
              <input
                v-model.number="holdingDays"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入持仓时间"
                @input="calculateArbitrage"
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
        <div v-if="arbitrageResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">套利分析结果</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-600 mb-1">汇率差收益</div>
                <div class="text-xl font-bold text-blue-800">
                  ¥{{ arbitrageResult.exchangeRateProfit.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-green-600 mb-1">总交易成本</div>
                <div class="text-xl font-bold text-green-800">
                  ¥{{ arbitrageResult.totalCosts.toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm text-purple-600 mb-1">净套利收益</div>
                <div class="text-xl font-bold text-purple-800">
                  ¥{{ arbitrageResult.netProfit.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-yellow-600 mb-1">收益率</div>
                <div class="text-xl font-bold text-yellow-800">
                  {{ arbitrageResult.profitRate.toFixed(3) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="arbitrageResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">成本明细</h3>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">点差成本：</span>
              <span class="font-medium">¥{{ arbitrageResult.spreadCost.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">手续费：</span>
              <span class="font-medium">¥{{ arbitrageResult.commissionCost.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">过夜利息：</span>
              <span class="font-medium">¥{{ arbitrageResult.swapCost.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">套利建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>寻找流动性高、价差大的货币对</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>注意交易时间差和执行风险</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>控制仓位规模，管理风险敞口</span>
            </div>
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>外汇套利机会转瞬即逝，需快速决策</span>
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
  title: '外汇套利计算器 - 在线计算外汇套利收益和机会',
  description: '免费外汇套利计算器，支持计算外汇套利机会、收益预测、汇率差分析，帮助您评估外汇套利投资价值。',
  keywords: ['外汇套利计算器', '汇率套利', '外汇交易收益', '货币套利', '汇率差计算', '外汇投资分析']
})

const arbitrageAmount = ref(10000)
const currencyPairA = ref('EURUSD')
const currencyPairB = ref('EURUSD')
const rateA = ref(1.0800)
const rateB = ref(1.0820)
const spread = ref(2)
const commission = ref(0.02)
const swapFee = ref(0.5)
const holdingDays = ref(1)

const arbitrageResult = ref(null)

const calculateArbitrage = () => {
  if (!arbitrageAmount.value || !rateA.value || !rateB.value) return

  // 计算汇率差收益
  const rateDifference = rateB.value - rateA.value
  const exchangeRateProfit = arbitrageAmount.value * rateDifference

  // 计算点差成本
  const spreadCost = arbitrageAmount.value * (spread.value * 0.0001)

  // 计算手续费
  const commissionCost = arbitrageAmount.value * commission.value / 100

  // 计算过夜利息
  const swapCost = swapFee.value * holdingDays.value

  // 计算总成本
  const totalCosts = spreadCost + commissionCost + swapCost

  // 计算净收益
  const netProfit = exchangeRateProfit - totalCosts

  // 计算收益率
  const profitRate = (netProfit / arbitrageAmount.value) * 100

  arbitrageResult.value = {
    exchangeRateProfit,
    spreadCost,
    commissionCost,
    swapCost,
    totalCosts,
    netProfit,
    profitRate
  }
}

const resetCalculation = () => {
  arbitrageAmount.value = 10000
  currencyPairA.value = 'EURUSD'
  currencyPairB.value = 'EURUSD'
  rateA.value = 1.0800
  rateB.value = 1.0820
  spread.value = 2
  commission.value = 0.02
  swapFee.value = 0.5
  holdingDays.value = 1
  arbitrageResult.value = null
}

const exportReport = () => {
  if (!arbitrageResult.value) return

  const report = `外汇套利分析报告
套利设置:
- 套利金额: $${arbitrageAmount.value}
- 货币对A: ${currencyPairA.value} @ ${rateA.value}
- 货币对B: ${currencyPairB.value} @ ${rateB.value}
- 持仓时间: ${holdingDays.value}天

交易成本:
- 点差: ${spread.value}点
- 手续费: ${commission.value}%
- 过夜利息: $${swapFee.value}/天

分析结果:
- 汇率差收益: ¥${arbitrageResult.value.exchangeRateProfit.toFixed(2)}
- 总交易成本: ¥${arbitrageResult.value.totalCosts.toFixed(2)}
- 净套利收益: ¥${arbitrageResult.value.netProfit.toFixed(2)}
- 收益率: ${arbitrageResult.value.profitRate.toFixed(3)}%

生成时间: ${new Date().toLocaleDateString()}`

  navigator.clipboard.writeText(report)
  alert('套利分析报告已复制到剪贴板')
}

calculateArbitrage()
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>