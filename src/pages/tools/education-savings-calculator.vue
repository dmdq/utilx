<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">教育储蓄计算器</h1>
      <p class="text-muted-foreground mb-6">计算子女教育储蓄目标和月储蓄建议，考虑教育通胀率和多种投资方式</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">教育目标</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">子女年龄</label>
              <input
                v-model.number="childAge"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入子女年龄"
                @input="calculateSavings"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">教育阶段</label>
              <select
                v-model="educationStage"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @change="updateEducationCost"
              >
                <option value="kindergarten">幼儿园</option>
                <option value="primary">小学</option>
                <option value="middle">中学</option>
                <option value="high">高中</option>
                <option value="university">大学</option>
                <option value="master">硕士</option>
                <option value="abroad">海外留学</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">当前年教育费用（元）</label>
              <input
                v-model.number="currentAnnualCost"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入当前年教育费用"
                @input="calculateSavings"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">教育年限</label>
              <input
                v-model.number="educationYears"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入教育年限"
                @input="calculateSavings"
              />
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投资设置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">教育通胀率（%）</label>
              <input
                v-model.number="educationInflation"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入教育通胀率"
                @input="calculateSavings"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">预期投资收益率（%）</label>
              <input
                v-model.number="investmentReturn"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入预期投资收益率"
                @input="calculateSavings"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">已有教育储蓄（元）</label>
              <input
                v-model.number="existingSavings"
                type="number"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入已有教育储蓄"
                @input="calculateSavings"
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
            @click="exportPlan"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            导出方案
          </button>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="space-y-6">
        <div v-if="savingsResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">储蓄规划结果</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm text-blue-600 mb-1">教育总费用</div>
                <div class="text-xl font-bold text-blue-800">
                  ¥{{ savingsResult.totalEducationCost.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-green-600 mb-1">资金缺口</div>
                <div class="text-xl font-bold text-green-800">
                  ¥{{ savingsResult.fundingGap.toFixed(2) }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-purple-50 rounded-lg">
                <div class="text-sm text-purple-600 mb-1">月储蓄建议</div>
                <div class="text-xl font-bold text-purple-800">
                  ¥{{ savingsResult.monthlySavings.toFixed(2) }}
                </div>
              </div>
              <div class="p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-yellow-600 mb-1">储蓄年限</div>
                <div class="text-xl font-bold text-yellow-800">
                  {{ savingsResult.savingsYears }}年
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="savingsResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">投资组合建议</h3>
          <div class="space-y-3">
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">保守型（风险低）</div>
              <div class="text-sm text-muted-foreground">存款、国债、货币基金</div>
              <div class="text-xs text-blue-600 mt-1">预期收益: 3-5%</div>
            </div>
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">稳健型（风险中）</div>
              <div class="text-sm text-muted-foreground">债券基金、定期理财</div>
              <div class="text-xs text-green-600 mt-1">预期收益: 5-8%</div>
            </div>
            <div class="p-3 border rounded-lg">
              <div class="font-medium mb-1">积极型（风险高）</div>
              <div class="text-sm text-muted-foreground">股票基金、指数基金</div>
              <div class="text-xs text-orange-600 mt-1">预期收益: 8-12%</div>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">储蓄建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>越早开始储蓄，复利效应越明显</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>定期评估和调整储蓄计划</span>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>考虑教育保险等保障产品</span>
            </div>
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>教育费用增长通常高于通胀率</span>
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
  title: '教育储蓄计算器 - 在线计算子女教育储蓄和规划',
  description: '免费教育储蓄计算器，支持计算子女教育储蓄目标、月储蓄建议、教育通胀率考虑，提供投资组合建议，帮助您制定教育储蓄计划。',
  keywords: ['教育储蓄计算器', '子女教育基金', '教育储蓄规划', '教育成本', '储蓄计算', '教育投资']
})

const childAge = ref(5)
const educationStage = ref('university')
const currentAnnualCost = ref(20000)
const educationYears = ref(4)
const educationInflation = ref(5)
const investmentReturn = ref(6)
const existingSavings = ref(50000)

const savingsResult = ref(null)

const educationStageInfo = {
  kindergarten: { startAge: 3, years: 3, baseCost: 10000 },
  primary: { startAge: 6, years: 6, baseCost: 8000 },
  middle: { startAge: 12, years: 3, baseCost: 12000 },
  high: { startAge: 15, years: 3, baseCost: 15000 },
  university: { startAge: 18, years: 4, baseCost: 20000 },
  master: { startAge: 22, years: 2, baseCost: 30000 },
  abroad: { startAge: 18, years: 4, baseCost: 200000 }
}

const updateEducationCost = () => {
  const stageInfo = educationStageInfo[educationStage.value]
  if (stageInfo) {
    currentAnnualCost.value = stageInfo.baseCost
    educationYears.value = stageInfo.years
    calculateSavings()
  }
}

const calculateSavings = () => {
  if (!currentAnnualCost.value || !educationYears.value) return

  const stageInfo = educationStageInfo[educationStage.value]
  const yearsToStart = Math.max(0, stageInfo.startAge - childAge.value)

  if (yearsToStart === 0) {
    alert('已错过储蓄时间，请考虑其他资金来源')
    return
  }

  // 计算未来教育总费用
  const futureAnnualCost = currentAnnualCost.value * Math.pow(1 + educationInflation.value / 100, yearsToStart)
  const totalEducationCost = futureAnnualCost * educationYears.value

  // 计算已有储蓄的增值
  const futureExistingSavings = existingSavings.value * Math.pow(1 + investmentReturn.value / 100, yearsToStart)

  // 计算资金缺口
  const fundingGap = totalEducationCost - futureExistingSavings

  // 计算月储蓄建议
  let monthlySavings = 0
  if (fundingGap > 0) {
    const monthlyRate = investmentReturn.value / 100 / 12
    const totalMonths = yearsToStart * 12

    if (monthlyRate > 0) {
      monthlySavings = fundingGap * monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    } else {
      monthlySavings = fundingGap / totalMonths
    }
  }

  savingsResult.value = {
    totalEducationCost,
    fundingGap,
    monthlySavings,
    savingsYears: yearsToStart,
    futureAnnualCost,
    futureExistingSavings
  }
}

const resetCalculation = () => {
  childAge.value = 5
  educationStage.value = 'university'
  currentAnnualCost.value = 20000
  educationYears.value = 4
  educationInflation.value = 5
  investmentReturn.value = 6
  existingSavings.value = 50000
  savingsResult.value = null
}

const exportPlan = () => {
  if (!savingsResult.value) return

  const plan = `子女教育储蓄规划报告
子女信息:
- 当前年龄: ${childAge.value}岁
- 教育阶段: ${getEducationStageName(educationStage.value)}
- 教育年限: ${educationYears.value}年

费用信息:
- 当前年费用: ¥${currentAnnualCost.value}
- 教育通胀率: ${educationInflation.value}%
- 未来年费用: ¥${savingsResult.value.futureAnnualCost.toFixed(2)}
- 教育总费用: ¥${savingsResult.value.totalEducationCost.toFixed(2)}

储蓄规划:
- 已有储蓄: ¥${existingSavings.value}
- 未来储蓄增值: ¥${savingsResult.value.futureExistingSavings.toFixed(2)}
- 资金缺口: ¥${savingsResult.value.fundingGap.toFixed(2)}
- 月储蓄建议: ¥${savingsResult.value.monthlySavings.toFixed(2)}
- 储蓄年限: ${savingsResult.value.savingsYears}年

生成时间: ${new Date().toLocaleDateString()}`

  navigator.clipboard.writeText(plan)
  alert('教育储蓄规划已复制到剪贴板')
}

const getEducationStageName = (stage) => {
  const names = {
    kindergarten: '幼儿园',
    primary: '小学',
    middle: '中学',
    high: '高中',
    university: '大学',
    master: '硕士',
    abroad: '海外留学'
  }
  return names[stage] || stage
}

calculateSavings()
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>