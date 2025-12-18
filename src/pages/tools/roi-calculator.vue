<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">投资回报计算器 - ROI、复利、未来价值计算</h1>
      <p class="text-muted-foreground">计算投资回报率、复合增长率、未来价值预测，支持定投、复利计算和风险评估。帮助您制定科学的投资策略和理财规划。</p>
    </div>

    <!-- 计算模式选择 -->
    <div class="mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="mode in calculationModes"
          :key="mode.id"
          @click="currentMode = mode.id"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            currentMode === mode.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          ]"
        >
          {{ mode.name }}
        </button>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">投资参数</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadExample"
            >
              示例数据
            </button>
          </div>
        </div>

        <!-- ROI计算输入 -->
        <div v-if="currentMode === 'roi'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">初始投资金额 (元)</label>
            <input
              v-model.number="roiData.initialInvestment"
              @input="calculateROI"
              type="number"
              min="0"
              step="1000"
              placeholder="100000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">最终价值 (元)</label>
            <input
              v-model.number="roiData.finalValue"
              @input="calculateROI"
              type="number"
              min="0"
              step="1000"
              placeholder="130000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">投资期限 (年)</label>
            <input
              v-model.number="roiData.years"
              @input="calculateROI"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="2"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">额外投入 (元)</label>
            <input
              v-model.number="roiData.additionalInvestment"
              @input="calculateROI"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <!-- 复利计算输入 -->
        <div v-if="currentMode === 'compound'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">本金金额 (元)</label>
            <input
              v-model.number="compoundData.principal"
              @input="calculateCompound"
              type="number"
              min="0"
              step="1000"
              placeholder="100000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">年利率 (%)</label>
            <input
              v-model.number="compoundData.annualRate"
              @input="calculateCompound"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="8"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">投资期限 (年)</label>
            <input
              v-model.number="compoundData.years"
              @input="calculateCompound"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="10"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">复利频率</label>
            <select
              v-model="compoundData.compoundFrequency"
              @change="calculateCompound"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="1">年复利</option>
              <option value="2">半年复利</option>
              <option value="4">季度复利</option>
              <option value="12">月复利</option>
              <option value="365">日复利</option>
            </select>
          </div>
        </div>

        <!-- 定投计算输入 -->
        <div v-if="currentMode === 'sip'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">每月定投金额 (元)</label>
            <input
              v-model.number="sipData.monthlyAmount"
              @input="calculateSIP"
              type="number"
              min="0"
              step="100"
              placeholder="5000"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">年化收益率 (%)</label>
            <input
              v-model.number="sipData.annualReturn"
              @input="calculateSIP"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="10"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">投资期限 (年)</label>
            <input
              v-model.number="sipData.years"
              @input="calculateSIP"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="20"
              class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算结果</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyResult"
            >
              复制结果
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="exportResult"
            >
              导出报告
            </button>
          </div>
        </div>

        <div class="flex-1 p-4 bg-muted border border-border rounded-lg overflow-auto">
          <!-- ROI结果 -->
          <div v-if="currentMode === 'roi' && result.roi" class="space-y-4">
            <h3 class="text-lg font-semibold mb-3">投资回报分析</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">总投资额</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(roiData.initialInvestment + roiData.additionalInvestment) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">最终价值</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(roiData.finalValue) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">净收益</p>
                <p class="text-lg font-medium text-green-600">¥{{ formatCurrency(result.roi.netProfit) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">投资回报率 (ROI)</p>
                <p class="text-lg font-medium text-blue-600">{{ result.roi.roiPercentage }}%</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">年化收益率</p>
                <p class="text-lg font-medium text-purple-600">{{ result.roi.annualizedReturn }}%</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">回收期</p>
                <p class="text-lg font-medium">{{ result.roi.paybackPeriod }} 年</p>
              </div>
            </div>
          </div>

          <!-- 复利结果 -->
          <div v-if="currentMode === 'compound' && result.compound" class="space-y-4">
            <h3 class="text-lg font-semibold mb-3">复利增长分析</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">本金</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(compoundData.principal) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">最终价值</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(result.compound.finalValue) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">利息收益</p>
                <p class="text-lg font-medium text-green-600">¥{{ formatCurrency(result.compound.interest) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">收益率</p>
                <p class="text-lg font-medium text-blue-600">{{ result.compound.returnPercentage }}%</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">有效年利率</p>
                <p class="text-lg font-medium text-purple-600">{{ result.compound.effectiveAnnualRate }}%</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">翻倍时间</p>
                <p class="text-lg font-medium">{{ result.compound.doublingTime }} 年</p>
              </div>
            </div>

            <!-- 增长图表 -->
            <div class="mt-6">
              <h4 class="text-md font-medium mb-3">价值增长曲线</h4>
              <div class="space-y-2">
                <div v-for="(value, index) in result.compound.growthChart" :key="index" class="flex items-center gap-2">
                  <span class="text-sm w-16">第{{ index }}年</span>
                  <div class="flex-1 bg-border rounded-full h-4 relative overflow-hidden">
                    <div
                      class="absolute top-0 left-0 h-full bg-primary rounded-full"
                      :style="{ width: `${(value / result.compound.finalValue) * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-sm w-24 text-right">¥{{ formatCurrency(value) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 定投结果 -->
          <div v-if="currentMode === 'sip' && result.sip" class="space-y-4">
            <h3 class="text-lg font-semibold mb-3">定投收益分析</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-muted-foreground">总投入金额</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(result.sip.totalInvestment) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">最终价值</p>
                <p class="text-lg font-medium">¥{{ formatCurrency(result.sip.finalValue) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">总收益</p>
                <p class="text-lg font-medium text-green-600">¥{{ formatCurrency(result.sip.totalReturn) }}</p>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">收益率</p>
                <p class="text-lg font-medium text-blue-600">{{ result.sip.returnPercentage }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 计算按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="performCalculation"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        计算投资回报
      </button>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是投资回报计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          投资回报计算是评估投资项目收益能力的重要方法，包括ROI（投资回报率）、复利计算、定投收益等指标。
          通过科学的计算方法，投资者可以更好地了解投资项目的盈利能力，制定合理的投资策略，
          降低投资风险，提高投资效率。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          投资回报率(ROI)计算公式
        </h2>
        <div class="bg-muted p-4 rounded-lg mb-6">
          <p class="font-mono text-center mb-2">ROI = (最终价值 - 总投资) / 总投资 × 100%</p>
          <p class="text-sm text-muted-foreground text-center">
            年化收益率 = (最终价值 / 总投资)^(1/投资年限) - 1
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          复利计算公式
        </h2>
        <div class="bg-muted p-4 rounded-lg mb-6">
          <p class="font-mono text-center mb-2">最终价值 = 本金 × (1 + 年利率/复利频率)^(复利频率×年数)</p>
          <p class="text-sm text-muted-foreground text-center">
            有效年利率 = (1 + 名义年利率/复利频率)^复利频率 - 1
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          投资理财建议
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>长期投资通常比短期投资获得更高的复利收益</li>
          <li>定期定额投资可以平摊市场波动风险</li>
          <li>分散投资可以降低单一投资的风险</li>
          <li>了解自己的风险承受能力，选择合适的投资产品</li>
          <li>关注通货膨胀对实际收益的影响</li>
          <li>定期评估和调整投资组合</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  TrendingUp, Calculator, Copy, Download, HelpCircle, ChevronUp,
  FileText, Lock, Shield, Clock, Type, PieChart,
  Database, Link, Hash, Timer, FileDiff,
  Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'roi-calculator')
const category = categories.find(c => c.id === 'finance')

// 计算模式
const calculationModes = [
  { id: 'roi', name: 'ROI计算' },
  { id: 'compound', name: '复利计算' },
  { id: 'sip', name: '定投计算' }
]

const currentMode = ref('roi')

// ROI数据
const roiData = ref({
  initialInvestment: 100000,
  finalValue: 130000,
  years: 2,
  additionalInvestment: 0
})

// 复利数据
const compoundData = ref({
  principal: 100000,
  annualRate: 8,
  years: 10,
  compoundFrequency: 12
})

// 定投数据
const sipData = ref({
  monthlyAmount: 5000,
  annualReturn: 10,
  years: 20
})

// 计算结果
const result = ref({
  roi: null,
  compound: null,
  sip: null
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  TrendingUp, Calculator, Copy, Download, HelpCircle, ChevronUp,
  FileText, Lock, Shield, Clock, Type, PieChart,
  Database, Link, Hash, Timer, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'finance' && t.id !== 'roi-calculator'
  ).slice(0, 4)
  return sameCategory
})

// 格式化货币
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0'
  return new Intl.NumberFormat('zh-CN').format(Math.round(amount))
}

// 执行计算
const performCalculation = () => {
  if (currentMode.value === 'roi') {
    calculateROI()
  } else if (currentMode.value === 'compound') {
    calculateCompound()
  } else if (currentMode.value === 'sip') {
    calculateSIP()
  }
}

// 计算ROI
const calculateROI = () => {
  const totalInvestment = roiData.value.initialInvestment + roiData.value.additionalInvestment
  const netProfit = roiData.value.finalValue - totalInvestment
  const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0

  // 计算年化收益率
  const annualizedReturn = roiData.value.years > 0 && totalInvestment > 0
    ? Math.pow(roiData.value.finalValue / totalInvestment, 1 / roiData.value.years) - 1
    : 0

  // 计算回收期
  const annualReturn = netProfit / roiData.value.years
  const paybackPeriod = annualReturn > 0 ? totalInvestment / annualReturn : 0

  result.value.roi = {
    netProfit,
    roiPercentage: roiPercentage.toFixed(2),
    annualizedReturn: (annualizedReturn * 100).toFixed(2),
    paybackPeriod: paybackPeriod.toFixed(2)
  }
}

// 计算复利
const calculateCompound = () => {
  const principal = compoundData.value.principal
  const annualRate = compoundData.value.annualRate / 100
  const years = compoundData.value.years
  const frequency = compoundData.value.compoundFrequency

  // 计算最终价值
  const finalValue = principal * Math.pow(1 + annualRate / frequency, frequency * years)
  const interest = finalValue - principal
  const returnPercentage = principal > 0 ? (interest / principal) * 100 : 0

  // 计算有效年利率
  const effectiveAnnualRate = Math.pow(1 + annualRate / frequency, frequency) - 1

  // 计算翻倍时间（72法则）
  const doublingTime = annualRate > 0 ? 72 / compoundData.value.annualRate : 0

  // 生成增长图表数据
  const growthChart = []
  for (let i = 0; i <= Math.ceil(years); i++) {
    const value = principal * Math.pow(1 + annualRate / frequency, frequency * i)
    growthChart.push(Math.round(value))
  }

  result.value.compound = {
    finalValue: Math.round(finalValue),
    interest: Math.round(interest),
    returnPercentage: returnPercentage.toFixed(2),
    effectiveAnnualRate: (effectiveAnnualRate * 100).toFixed(2),
    doublingTime: doublingTime.toFixed(1),
    growthChart
  }
}

// 计算定投
const calculateSIP = () => {
  const monthlyAmount = sipData.value.monthlyAmount
  const annualReturn = sipData.value.annualReturn / 100
  const years = sipData.value.years
  const months = years * 12
  const monthlyRate = annualReturn / 12

  // 定投未来价值公式
  const finalValue = monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
  const totalInvestment = monthlyAmount * months
  const totalReturn = finalValue - totalInvestment
  const returnPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0

  result.value.sip = {
    totalInvestment: Math.round(totalInvestment),
    finalValue: Math.round(finalValue),
    totalReturn: Math.round(totalReturn),
    returnPercentage: returnPercentage.toFixed(2)
  }
}

// 清空输入
const clearInput = () => {
  if (currentMode.value === 'roi') {
    roiData.value = {
      initialInvestment: 0,
      finalValue: 0,
      years: 0,
      additionalInvestment: 0
    }
  } else if (currentMode.value === 'compound') {
    compoundData.value = {
      principal: 0,
      annualRate: 0,
      years: 0,
      compoundFrequency: 12
    }
  } else if (currentMode.value === 'sip') {
    sipData.value = {
      monthlyAmount: 0,
      annualReturn: 0,
      years: 0
    }
  }

  result.value = {
    roi: null,
    compound: null,
    sip: null
  }
}

// 加载示例数据
const loadExample = () => {
  if (currentMode.value === 'roi') {
    roiData.value = {
      initialInvestment: 100000,
      finalValue: 150000,
      years: 3,
      additionalInvestment: 20000
    }
  } else if (currentMode.value === 'compound') {
    compoundData.value = {
      principal: 50000,
      annualRate: 12,
      years: 15,
      compoundFrequency: 12
    }
  } else if (currentMode.value === 'sip') {
    sipData.value = {
      monthlyAmount: 3000,
      annualReturn: 8,
      years: 25
    }
  }

  performCalculation()
}

// 复制结果
const copyResult = async () => {
  let resultText = '投资回报计算结果\n\n'

  if (currentMode.value === 'roi' && result.value.roi) {
    const r = result.value.roi
    resultText += `ROI计算结果：\n`
    resultText += `总投资额：¥${formatCurrency(roiData.value.initialInvestment + roiData.value.additionalInvestment)}\n`
    resultText += `最终价值：¥${formatCurrency(roiData.value.finalValue)}\n`
    resultText += `净收益：¥${formatCurrency(r.netProfit)}\n`
    resultText += `投资回报率：${r.roiPercentage}%\n`
    resultText += `年化收益率：${r.annualizedReturn}%\n`
    resultText += `回收期：${r.paybackPeriod}年\n`
  } else if (currentMode.value === 'compound' && result.value.compound) {
    const r = result.value.compound
    resultText += `复利计算结果：\n`
    resultText += `本金：¥${formatCurrency(compoundData.value.principal)}\n`
    resultText += `最终价值：¥${formatCurrency(r.finalValue)}\n`
    resultText += `利息收益：¥${formatCurrency(r.interest)}\n`
    resultText += `收益率：${r.returnPercentage}%\n`
    resultText += `有效年利率：${r.effectiveAnnualRate}%\n`
  } else if (currentMode.value === 'sip' && result.value.sip) {
    const r = result.value.sip
    resultText += `定投计算结果：\n`
    resultText += `总投入金额：¥${formatCurrency(r.totalInvestment)}\n`
    resultText += `最终价值：¥${formatCurrency(r.finalValue)}\n`
    resultText += `总收益：¥${formatCurrency(r.totalReturn)}\n`
    resultText += `收益率：${r.returnPercentage}%\n`
  }

  try {
    await navigator.clipboard.writeText(resultText)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 导出结果
const exportResult = () => {
  let resultHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>投资回报计算结果</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .item { padding: 10px; border: 1px solid #ddd; }
        .label { font-weight: bold; }
        .value { color: #333; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>投资回报计算结果报告</h1>
        <p>计算时间：${new Date().toLocaleString('zh-CN')}</p>
      </div>
  `

  if (currentMode.value === 'roi' && result.value.roi) {
    const r = result.value.roi
    resultHtml += `
      <div class="section">
        <h2>投资回报率(ROI)计算结果</h2>
        <div class="grid">
          <div class="item"><span class="label">总投资额：</span><span class="value">¥${formatCurrency(roiData.value.initialInvestment + roiData.value.additionalInvestment)}</span></div>
          <div class="item"><span class="label">最终价值：</span><span class="value">¥${formatCurrency(roiData.value.finalValue)}</span></div>
          <div class="item"><span class="label">净收益：</span><span class="value">¥${formatCurrency(r.netProfit)}</span></div>
          <div class="item"><span class="label">投资回报率：</span><span class="value">${r.roiPercentage}%</span></div>
        </div>
      </div>
    `
  }

  resultHtml += `
    </body>
    </html>
  `

  const blob = new Blob([resultHtml], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `投资回报计算结果_${new Date().getTime()}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 初始化计算
onMounted(() => {
  performCalculation()
})
</script>