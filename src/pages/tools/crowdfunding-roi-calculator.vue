<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">众筹回报计算器</h1>
      <p class="text-muted-foreground mb-6">计算众筹投资回报率和收益预测，支持风险评估和投资组合分析</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投资信息</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">投资金额（元）</label>
              <input
                v-model.number="investmentAmount"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入投资金额"
                @input="calculateROI"
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
                @input="calculateROI"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">投资期限（年）</label>
              <input
                v-model.number="investmentPeriod"
                type="number"
                step="0.5"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入投资期限"
                @input="calculateROI"
              />
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">风险评估</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">风险等级</label>
              <select
                v-model="riskLevel"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @change="calculateROI"
              >
                <option value="low">低风险</option>
                <option value="medium">中等风险</option>
                <option value="high">高风险</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">失败概率（%）</label>
              <input
                v-model.number="failureProbability"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入失败概率"
                @input="calculateROI"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">平台手续费（%）</label>
              <input
                v-model.number="platformFee"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入平台手续费"
                @input="calculateROI"
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
        <div v-if="roiResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">回报计算结果</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-600 mb-1">预期总收益</div>
                <div class="text-xl font-bold text-blue-800">
                  ¥{{ roiResult.expectedReturn.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-green-600 mb-1">风险调整收益</div>
                <div class="text-xl font-bold text-green-800">
                  ¥{{ roiResult.riskAdjustedReturn.toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm text-purple-600 mb-1">最终金额</div>
                <div class="text-xl font-bold text-purple-800">
                  ¥{{ roiResult.finalAmount.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-yellow-600 mb-1">预期收益率</div>
                <div class="text-xl font-bold text-yellow-800">
                  {{ roiResult.expectedRate.toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="roiResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投资建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>众筹投资风险较高，建议分散投资</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>仔细研究项目背景和团队实力</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>了解平台的信誉和监管情况</span>
            </div>
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>只投入可承受损失的资金</span>
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
  title: '众筹回报计算器 - 在线计算众筹投资收益和风险评估',
  description: '免费众筹回报计算器，支持计算众筹投资回报率、风险评估、收益预测，帮助您分析众筹项目的投资价值。专业的股权众筹投资分析工具，支持风险调整收益计算和投资组合分析。',
  keywords: ['众筹回报计算器', '众筹投资收益', '股权众筹', '投资风险评估', 'ROI计算', '众筹项目分析', '众筹投资工具', '投资回报率计算', '风险调整收益', '股权投资', '创业投资', '天使投资'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '众筹回报计算器',
    description: '免费的在线众筹投资回报和风险评估工具，支持股权众筹、产品众筹等多种众筹模式的投资回报计算和风险分析。',
    url: 'https://util.iskytrip.com/tools/crowdfunding-roi-calculator',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '众筹投资回报计算',
      '风险评估分析',
      'ROI回报率计算',
      '风险调整收益',
      '投资组合分析',
      '失败概率评估'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: '众筹投资者'
    }
  }
})

const investmentAmount = ref(10000)
const expectedReturn = ref(15)
const investmentPeriod = ref(3)
const riskLevel = ref('medium')
const failureProbability = ref(20)
const platformFee = ref(5)

const roiResult = ref(null)

const calculateROI = () => {
  if (!investmentAmount.value || investmentAmount.value <= 0) return

  const netInvestment = investmentAmount.value * (1 - platformFee.value / 100)
  const grossReturn = netInvestment * Math.pow(1 + expectedReturn.value / 100, investmentPeriod.value)
  const expectedProfit = grossReturn - netInvestment

  // 风险调整收益
  const successProbability = (100 - failureProbability.value) / 100
  const riskAdjustedReturn = expectedProfit * successProbability

  roiResult.value = {
    expectedReturn: expectedProfit,
    riskAdjustedReturn,
    finalAmount: netInvestment + riskAdjustedReturn,
    expectedRate: (riskAdjustedReturn / netInvestment) * 100
  }
}

const resetCalculation = () => {
  investmentAmount.value = 10000
  expectedReturn.value = 15
  investmentPeriod.value = 3
  riskLevel.value = 'medium'
  failureProbability.value = 20
  platformFee.value = 5
  roiResult.value = null
}

const exportReport = () => {
  if (!roiResult.value) return

  const report = `众筹投资分析报告
投资金额: ¥${investmentAmount.value}
预期年化收益: ${expectedReturn.value}%
投资期限: ${investmentPeriod.value}年
风险等级: ${riskLevel.value}
失败概率: ${failureProbability.value}%
平台手续费: ${platformFee.value}%

分析结果:
预期总收益: ¥${roiResult.value.expectedReturn.toFixed(2)}
风险调整收益: ¥${roiResult.value.riskAdjustedReturn.toFixed(2)}
最终金额: ¥${roiResult.value.finalAmount.toFixed(2)}
预期收益率: ${roiResult.value.expectedRate.toFixed(2)}%

生成时间: ${new Date().toLocaleDateString()}`

  navigator.clipboard.writeText(report)
  alert('分析报告已复制到剪贴板')
}

calculateROI()
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>