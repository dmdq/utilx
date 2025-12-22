<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">财务比率计算器</h1>
      <p class="text-muted-foreground mb-6">盈利能力、偿债能力、运营能力比率分析，支持图表展示和行业对比</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：财务数据输入 -->
      <div class="space-y-6">
        <!-- 基础财务数据 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">基础财务数据</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">营业收入 (万元)</label>
                <input
                  v-model.number="financialData.revenue"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="1000"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">营业成本 (万元)</label>
                <input
                  v-model.number="financialData.cost"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="600"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">净利润 (万元)</label>
                <input
                  v-model.number="financialData.netProfit"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="120"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">总资产 (万元)</label>
                <input
                  v-model.number="financialData.totalAssets"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="2000"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">总负债 (万元)</label>
                <input
                  v-model.number="financialData.totalLiabilities"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="1200"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">所有者权益 (万元)</label>
                <input
                  v-model.number="financialData.equity"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="800"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">流动资产 (万元)</label>
                <input
                  v-model.number="financialData.currentAssets"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="800"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">流动负债 (万元)</label>
                <input
                  v-model.number="financialData.currentLiabilities"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="400"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">存货 (万元)</label>
                <input
                  v-model.number="financialData.inventory"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="200"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">应收账款 (万元)</label>
                <input
                  v-model.number="financialData.receivables"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="150"
                />
              </div>
            </div>

            <button @click="calculateRatios" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              计算财务比率
            </button>
          </div>
        </div>

        <!-- 行业对比选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">行业对比</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">选择行业</label>
              <select v-model="selectedIndustry" class="w-full px-3 py-2 border rounded-lg">
                <option value="manufacturing">制造业</option>
                <option value="technology">科技行业</option>
                <option value="retail">零售业</option>
                <option value="finance">金融业</option>
                <option value="healthcare">医疗健康</option>
                <option value="energy">能源行业</option>
              </select>
            </div>

            <button @click="compareWithIndustry" class="w-full px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80">
              行业对比分析
            </button>

            <div v-if="industryComparison.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium mb-2">行业平均对比</div>
              <div class="text-xs space-y-1">
                <div v-for="(item, index) in industryComparison.ratios" :key="index">
                  {{ item.name }}: {{ item.value }}% (行业平均: {{ item.industry }}%)
                  <span :class="item.status === 'above' ? 'text-green-600' : item.status === 'below' ? 'text-red-600' : 'text-gray-600'">
                    {{ item.status === 'above' ? '↑ 高于平均' : item.status === 'below' ? '↓ 低于平均' : '≈ 等于平均' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：比率分析结果 -->
      <div class="space-y-6">
        <!-- 盈利能力比率 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">盈利能力比率</h3>
          <div v-if="ratios.profitability.length > 0" class="space-y-3">
            <div v-for="ratio in ratios.profitability" :key="ratio.name" class="p-3 bg-secondary rounded">
              <div class="flex justify-between items-center">
                <span class="font-medium text-sm">{{ ratio.name }}</span>
                <span class="text-sm font-bold">{{ ratio.value }}%</span>
              </div>
              <div class="text-xs text-muted-foreground">{{ ratio.formula }}</div>
              <div class="text-xs mt-1">{{ ratio.interpretation }}</div>
            </div>
          </div>
          <div v-else class="text-center text-muted-foreground py-4">
            输入数据后计算
          </div>
        </div>

        <!-- 偿债能力比率 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">偿债能力比率</h3>
          <div v-if="ratios.solvency.length > 0" class="space-y-3">
            <div v-for="ratio in ratios.solvency" :key="ratio.name" class="p-3 bg-secondary rounded">
              <div class="flex justify-between items-center">
                <span class="font-medium text-sm">{{ ratio.name }}</span>
                <span class="text-sm font-bold">{{ ratio.value }}</span>
              </div>
              <div class="text-xs text-muted-foreground">{{ ratio.formula }}</div>
              <div class="text-xs mt-1">{{ ratio.interpretation }}</div>
            </div>
          </div>
          <div v-else class="text-center text-muted-foreground py-4">
            输入数据后计算
          </div>
        </div>

        <!-- 运营能力比率 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">运营能力比率</h3>
          <div v-if="ratios.efficiency.length > 0" class="space-y-3">
            <div v-for="ratio in ratios.efficiency" :key="ratio.name" class="p-3 bg-secondary rounded">
              <div class="flex justify-between items-center">
                <span class="font-medium text-sm">{{ ratio.name }}</span>
                <span class="text-sm font-bold">{{ ratio.value }}</span>
              </div>
              <div class="text-xs text-muted-foreground">{{ ratio.formula }}</div>
              <div class="text-xs mt-1">{{ ratio.interpretation }}</div>
            </div>
          </div>
          <div v-else class="text-center text-muted-foreground py-4">
            输入数据后计算
          </div>
        </div>

        <!-- 综合评分 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">综合财务健康评分</h3>
          <div v-if="healthScore.total > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-4xl font-bold" :class="healthScore.color">
                {{ healthScore.total }}
              </div>
              <div class="text-sm text-muted-foreground">{{ healthScore.grade }}</div>
              <div class="text-xs">{{ healthScore.status }}</div>
            </div>

            <div class="space-y-2">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>盈利能力</span>
                  <span>{{ healthScore.profitability }}/100</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-green-500 h-2 rounded-full transition-all"
                    :style="{ width: `${healthScore.profitability}%` }"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>偿债能力</span>
                  <span>{{ healthScore.solvency }}/100</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all"
                    :style="{ width: `${healthScore.solvency}%` }"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>运营能力</span>
                  <span>{{ healthScore.efficiency }}/100</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-purple-500 h-2 rounded-full transition-all"
                    :style="{ width: `${healthScore.efficiency}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-4">
            计算比率后生成评分
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('财务比率计算器')

// 财务数据
const financialData = ref({
  revenue: 1000,
  cost: 600,
  netProfit: 120,
  totalAssets: 2000,
  totalLiabilities: 1200,
  equity: 800,
  currentAssets: 800,
  currentLiabilities: 400,
  inventory: 200,
  receivables: 150
})

// 行业对比
const selectedIndustry = ref('manufacturing')
const industryComparison = ref({
  isValid: false,
  ratios: []
})

// 比率结果
const ratios = ref({
  profitability: [],
  solvency: [],
  efficiency: []
})

// 健康评分
const healthScore = ref({
  total: 0,
  profitability: 0,
  solvency: 0,
  efficiency: 0,
  grade: '',
  status: '',
  color: ''
})

// 行业基准数据
const industryBenchmarks = {
  manufacturing: {
    grossMargin: 25,
    netProfitMargin: 8,
    returnOnAssets: 6,
    currentRatio: 1.5,
    debtToEquity: 1.2,
    inventoryTurnover: 6,
    receivablesTurnover: 8
  },
  technology: {
    grossMargin: 40,
    netProfitMargin: 15,
    returnOnAssets: 10,
    currentRatio: 2.0,
    debtToEquity: 0.8,
    inventoryTurnover: 12,
    receivablesTurnover: 10
  },
  retail: {
    grossMargin: 30,
    netProfitMargin: 5,
    returnOnAssets: 8,
    currentRatio: 1.8,
    debtToEquity: 1.5,
    inventoryTurnover: 8,
    receivablesTurnover: 15
  },
  finance: {
    grossMargin: 35,
    netProfitMargin: 12,
    returnOnAssets: 1.2,
    currentRatio: 1.2,
    debtToEquity: 8,
    inventoryTurnover: 0,
    receivablesTurnover: 4
  },
  healthcare: {
    grossMargin: 45,
    netProfitMargin: 10,
    returnOnAssets: 7,
    currentRatio: 1.6,
    debtToEquity: 1.0,
    inventoryTurnover: 4,
    receivablesTurnover: 6
  },
  energy: {
    grossMargin: 20,
    netProfitMargin: 6,
    returnOnAssets: 4,
    currentRatio: 1.3,
    debtToEquity: 2.0,
    inventoryTurnover: 5,
    receivablesTurnover: 7
  }
}

// 计算财务比率
const calculateRatios = () => {
  const { revenue, cost, netProfit, totalAssets, totalLiabilities, equity, currentAssets, currentLiabilities, inventory, receivables } = financialData.value

  // 盈利能力比率
  const grossProfit = revenue - cost
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0
  const returnOnAssets = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0
  const returnOnEquity = equity > 0 ? (netProfit / equity) * 100 : 0

  ratios.value.profitability = [
    {
      name: '毛利率',
      value: grossMargin.toFixed(2),
      formula: '(营业收入 - 营业成本) / 营业收入 × 100%',
      interpretation: grossMargin > 30 ? '优秀' : grossMargin > 15 ? '良好' : '需要改进'
    },
    {
      name: '净利率',
      value: netProfitMargin.toFixed(2),
      formula: '净利润 / 营业收入 × 100%',
      interpretation: netProfitMargin > 10 ? '优秀' : netProfitMargin > 5 ? '良好' : '需要改进'
    },
    {
      name: '总资产收益率',
      value: returnOnAssets.toFixed(2),
      formula: '净利润 / 总资产 × 100%',
      interpretation: returnOnAssets > 8 ? '优秀' : returnOnAssets > 4 ? '良好' : '需要改进'
    },
    {
      name: '净资产收益率',
      value: returnOnEquity.toFixed(2),
      formula: '净利润 / 所有者权益 × 100%',
      interpretation: returnOnEquity > 15 ? '优秀' : returnOnEquity > 8 ? '良好' : '需要改进'
    }
  ]

  // 偿债能力比率
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0
  const debtToEquity = equity > 0 ? totalLiabilities / equity : 0
  const debtToAssets = totalAssets > 0 ? totalLiabilities / totalAssets : 0

  ratios.value.solvency = [
    {
      name: '流动比率',
      value: currentRatio.toFixed(2),
      formula: '流动资产 / 流动负债',
      interpretation: currentRatio >= 2 ? '优秀' : currentRatio >= 1.5 ? '良好' : '需要改进'
    },
    {
      name: '资产负债率',
      value: (debtToAssets * 100).toFixed(2),
      formula: '总负债 / 总资产 × 100%',
      interpretation: debtToAssets <= 0.4 ? '优秀' : debtToAssets <= 0.6 ? '良好' : '需要改进'
    },
    {
      name: '产权比率',
      value: debtToEquity.toFixed(2),
      formula: '总负债 / 所有者权益',
      interpretation: debtToEquity <= 1 ? '优秀' : debtToEquity <= 2 ? '良好' : '需要改进'
    }
  ]

  // 运营能力比率
  const inventoryTurnover = inventory > 0 ? cost / inventory : 0
  const receivablesTurnover = receivables > 0 ? revenue / receivables : 0
  const assetTurnover = totalAssets > 0 ? revenue / totalAssets : 0

  ratios.value.efficiency = [
    {
      name: '存货周转率',
      value: inventoryTurnover.toFixed(2),
      formula: '营业成本 / 存货',
      interpretation: inventoryTurnover >= 8 ? '优秀' : inventoryTurnover >= 4 ? '良好' : '需要改进'
    },
    {
      name: '应收账款周转率',
      value: receivablesTurnover.toFixed(2),
      formula: '营业收入 / 应收账款',
      interpretation: receivablesTurnover >= 10 ? '优秀' : receivablesTurnover >= 6 ? '良好' : '需要改进'
    },
    {
      name: '总资产周转率',
      value: assetTurnover.toFixed(2),
      formula: '营业收入 / 总资产',
      interpretation: assetTurnover >= 1.0 ? '优秀' : assetTurnover >= 0.5 ? '良好' : '需要改进'
    }
  ]

  // 计算健康评分
  calculateHealthScore()
}

// 计算健康评分
const calculateHealthScore = () => {
  if (ratios.value.profitability.length === 0) return

  // 盈利能力评分 (40%)
  const profitScore = Math.min(
    (parseFloat(ratios.value.profitability[1].value) / 15) * 100, // 净利率基准15%
    100
  )

  // 偿债能力评分 (30%)
  const solvencyScore = Math.min(
    (parseFloat(ratios.value.solvency[0].value) / 2) * 100, // 流动比率基准2
    100
  )

  // 运营能力评分 (30%)
  const efficiencyScore = Math.min(
    ((parseFloat(ratios.value.efficiency[0].value) / 8) * 100 + // 存货周转率基准8
     (parseFloat(ratios.value.efficiency[1].value) / 10) * 100) / 2, // 应收账款周转率基准10
    100
  )

  const totalScore = profitScore * 0.4 + solvencyScore * 0.3 + efficiencyScore * 0.3

  healthScore.value = {
    total: Math.round(totalScore),
    profitability: Math.round(profitScore),
    solvency: Math.round(solvencyScore),
    efficiency: Math.round(efficiencyScore),
    grade: totalScore >= 90 ? 'A' : totalScore >= 80 ? 'B' : totalScore >= 70 ? 'C' : totalScore >= 60 ? 'D' : 'F',
    status: totalScore >= 80 ? '财务状况优秀' : totalScore >= 60 ? '财务状况良好' : '需要改善财务状况',
    color: totalScore >= 80 ? 'text-green-600' : totalScore >= 60 ? 'text-blue-600' : 'text-red-600'
  }
}

// 行业对比
const compareWithIndustry = () => {
  const benchmark = industryBenchmarks[selectedIndustry.value]

  industryComparison.value.ratios = [
    {
      name: '毛利率',
      value: ratios.value.profitability[0]?.value || 0,
      industry: benchmark.grossMargin,
      status: getComparisonStatus(parseFloat(ratios.value.profitability[0]?.value || 0), benchmark.grossMargin)
    },
    {
      name: '净利率',
      value: ratios.value.profitability[1]?.value || 0,
      industry: benchmark.netProfitMargin,
      status: getComparisonStatus(parseFloat(ratios.value.profitability[1]?.value || 0), benchmark.netProfitMargin)
    },
    {
      name: '流动比率',
      value: ratios.value.solvency[0]?.value || 0,
      industry: benchmark.currentRatio,
      status: getComparisonStatus(parseFloat(ratios.value.solvency[0]?.value || 0), benchmark.currentRatio, true)
    }
  ]

  industryComparison.value.isValid = true
}

const getComparisonStatus = (value, benchmark, isRatio = false) => {
  const threshold = isRatio ? 0.1 : 0.2 // 比率用10%差异，百分比用20%差异
  const diff = Math.abs(value - benchmark) / benchmark

  if (diff < threshold) return 'equal'
  return value > benchmark ? 'above' : 'below'
}
</script>

<style scoped>
input[type="number"],
select {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="number"]:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>