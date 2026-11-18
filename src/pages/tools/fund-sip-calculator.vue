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
                class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
            @click="addScenario"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            加入对比
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
          <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h3 class="text-lg font-semibold">收益增长趋势</h3>
            <div class="flex items-center gap-4 text-xs text-muted-foreground">
              <span class="flex items-center gap-1.5">
                <span class="inline-block w-4 h-0.5 rounded bg-primary"></span>账户市值
              </span>
              <span class="flex items-center gap-1.5">
                <span class="inline-block w-4 h-0.5 rounded bg-muted-foreground"></span>本金累计
              </span>
            </div>
          </div>
          <div v-if="chartGeom" class="relative">
            <svg
              :viewBox="`0 0 ${chartGeom.vbW} ${chartGeom.vbH}`"
              class="w-full h-auto block"
              role="img"
              aria-label="定投本金累计与账户市值增长曲线"
            >
              <!-- 网格与 Y 轴刻度 -->
              <g v-for="g in chartGeom.gridY" :key="'gy' + g.label">
                <line
                  :x1="chartGeom.padL" :y1="g.y"
                  :x2="chartGeom.padL + chartGeom.plotW" :y2="g.y"
                  class="stroke-border" stroke-width="1"
                />
                <text :x="chartGeom.padL - 8" :y="g.y + 3" text-anchor="end" font-size="10" class="fill-muted-foreground">{{ g.label }}</text>
              </g>
              <!-- X 轴与刻度 -->
              <line
                :x1="chartGeom.padL" :y1="chartGeom.padT + chartGeom.plotH"
                :x2="chartGeom.padL + chartGeom.plotW" :y2="chartGeom.padT + chartGeom.plotH"
                class="stroke-border" stroke-width="1"
              />
              <text
                v-for="t in chartGeom.gridX"
                :key="'gx' + t.label"
                :x="t.x" :y="chartGeom.padT + chartGeom.plotH + 18"
                text-anchor="middle" font-size="10" class="fill-muted-foreground"
              >{{ t.label }}</text>
              <!-- 市值面积与双曲线（主题色类：primary / muted-foreground） -->
              <path :d="chartGeom.areaPath" class="fill-primary" opacity="0.08" />
              <polyline
                :points="chartGeom.principalPoly"
                fill="none" class="stroke-muted-foreground"
                stroke-width="2" stroke-dasharray="6 4"
                stroke-linejoin="round" stroke-linecap="round"
              />
              <polyline
                :points="chartGeom.valuePoly"
                fill="none" class="stroke-primary"
                stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"
              />
              <!-- 悬停辅助线与数据点 -->
              <g v-if="hoverPoint">
                <line
                  :x1="chartGeom.xs(hoverPoint.year)" :y1="chartGeom.padT"
                  :x2="chartGeom.xs(hoverPoint.year)" :y2="chartGeom.padT + chartGeom.plotH"
                  class="stroke-muted-foreground" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"
                />
                <circle :cx="chartGeom.xs(hoverPoint.year)" :cy="chartGeom.ys(hoverPoint.principal)" r="4" class="fill-background stroke-muted-foreground" stroke-width="2" />
                <circle :cx="chartGeom.xs(hoverPoint.year)" :cy="chartGeom.ys(hoverPoint.value)" r="4" class="fill-background stroke-primary" stroke-width="2" />
              </g>
              <!-- 悬停捕获层 -->
              <rect
                :x="chartGeom.padL" :y="chartGeom.padT"
                :width="chartGeom.plotW" :height="chartGeom.plotH"
                fill="transparent" pointer-events="all" class="cursor-crosshair"
                @mousemove="onChartMove" @mouseleave="hoverIdx = -1"
              />
            </svg>
            <div
              v-if="hoverPoint"
              class="absolute z-10 pointer-events-none bg-popover text-popover-foreground border border-border rounded-lg shadow-md px-3 py-2 text-xs leading-relaxed whitespace-nowrap"
              :style="tipStyle"
            >
              <div class="font-medium mb-0.5">第 {{ fmtYearLabel(hoverPoint.year) }} 年</div>
              <div>本金累计：¥{{ fmtNum(hoverPoint.principal) }}</div>
              <div class="text-primary font-medium">账户市值：¥{{ fmtNum(hoverPoint.value) }}</div>
            </div>
          </div>
          <div v-else class="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
            <p class="text-sm text-muted-foreground">请输入有效的定投参数后查看收益增长曲线</p>
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

    <!-- 方案对比（无方案时不渲染，数据仅保存在内存中） -->
    <div v-if="scenarios.length" class="bg-card rounded-lg p-6 border mt-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">方案对比</h3>
        <button
          @click="clearScenarios"
          class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg"
        >
          清空方案
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm whitespace-nowrap">
          <thead>
            <tr class="text-left text-xs text-muted-foreground border-b border-border">
              <th class="py-2 pr-4 font-medium">方案</th>
              <th class="py-2 pr-4 font-medium">定投金额</th>
              <th class="py-2 pr-4 font-medium">年化收益</th>
              <th class="py-2 pr-4 font-medium">期限</th>
              <th class="py-2 pr-4 font-medium">期末市值</th>
              <th class="py-2 pr-4 font-medium">总收益</th>
              <th class="py-2 pr-4 font-medium">收益率</th>
              <th class="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in scenarios" :key="s.id" class="border-b border-border last:border-b-0">
              <td class="py-2.5 pr-4 font-medium">方案{{ s.id }}</td>
              <td class="py-2.5 pr-4">¥{{ s.amount }}/{{ s.frequencyLabel }}</td>
              <td class="py-2.5 pr-4">{{ s.annualRate }}%</td>
              <td class="py-2.5 pr-4">{{ s.years }}年</td>
              <td class="py-2.5 pr-4 font-semibold text-primary">¥{{ s.finalAmount.toFixed(2) }}</td>
              <td class="py-2.5 pr-4" :class="s.totalReturn >= 0 ? 'text-green-600' : 'text-red-500'">¥{{ s.totalReturn.toFixed(2) }}</td>
              <td class="py-2.5 pr-4">{{ s.totalReturnRate.toFixed(2) }}%</td>
              <td class="py-2.5 text-right">
                <button
                  @click="removeScenario(s.id)"
                  class="px-2 py-1 text-xs bg-muted hover:bg-muted/80 text-muted-foreground rounded"
                >
                  移除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground mt-3">
        最多可保存 3 个方案：调整左侧参数后点击「加入对比」继续添加；数据仅在当前页面内存中保存。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'

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

// ==== 纯函数区（无组件依赖，可整体提取单测）====
/**
 * 逐期累计定投序列（期末年金口径，每期复利）：
 * 递推 value_k = value_{k-1} × (1 + r) + periodAmount，
 * 与页面终值公式 FV = PMT × ((1+r)^n − 1) / r 数学等价。
 * @param {number} periodAmount 每期投入金额
 * @param {number} annualRatePercent 年化收益率（百分数，如 8 表示 8%）
 * @param {number} years 投资年数
 * @param {number} [periodsPerYear] 每年期数（月投 12 / 季投 4 / 周投 52）
 * @returns {Array<{year:number, principal:number, value:number}>} 每年（含不满整年的期末）累计本金与账户市值
 */
function periodSeries(periodAmount, annualRatePercent, years, periodsPerYear) {
  const ppy = periodsPerYear || 12
  const totalPeriods = Math.max(0, Math.round(Number(years) * ppy))
  const r = Number(annualRatePercent) / 100 / ppy
  const pts = []
  let value = 0
  for (let k = 1; k <= totalPeriods; k++) {
    value = value * (1 + r) + periodAmount
    if (k % ppy === 0 || k === totalPeriods) {
      pts.push({ year: k / ppy, principal: periodAmount * k, value })
    }
  }
  return pts
}

/** 月投年序列（yearlySeries 便捷封装，供单测与图表使用） */
function yearlySeries(monthly, annualRatePercent, years) {
  return periodSeries(monthly, annualRatePercent, years, 12)
}

/** 向上取整到 1/2/4/5/10 × 10^k 的“好看”坐标上限 */
function niceCeil(v) {
  if (!(v > 0)) return 1
  const exp = Math.floor(Math.log10(v))
  const base = Math.pow(10, exp)
  const m = v / base
  const step = m <= 1 ? 1 : m <= 2 ? 2 : m <= 4 ? 4 : m <= 5 ? 5 : 10
  return step * base
}

/** 金额紧凑格式（万 / 亿） */
function fmtCompact(v) {
  const abs = Math.abs(v)
  if (abs >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (abs >= 1e4) return (v / 1e4).toFixed(1) + '万'
  return String(Math.round(v))
}

/** 千分位两位小数（悬停数值用） */
function fmtNum(v) {
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 年份标签（整数不带小数点，小数保留 1~2 位） */
function fmtYearLabel(y) {
  return Number.isInteger(y) ? String(y) : y.toFixed(2).replace(/0$/, '')
}

/** X 轴刻度步长 */
function niceStepYears(maxYear) {
  if (maxYear <= 1) return 0.25
  if (maxYear <= 6) return 1
  if (maxYear <= 12) return 2
  if (maxYear <= 30) return 5
  if (maxYear <= 60) return 10
  return 20
}

/** 由数据点生成内联 SVG 折线图几何信息（viewBox 坐标） */
function buildChartGeometry(pts) {
  const vbW = 640
  const vbH = 300
  const padL = 56
  const padR = 20
  const padT = 20
  const padB = 34
  const plotW = vbW - padL - padR
  const plotH = vbH - padT - padB
  const maxYear = Math.max(pts[pts.length - 1].year, 1e-9)
  let peak = 0
  for (const p of pts) peak = Math.max(peak, p.value, p.principal)
  const maxY = niceCeil(peak * 1.05 || 1)
  const xs = year => padL + (year / maxYear) * plotW
  const ys = v => padT + plotH - (v / maxY) * plotH
  const toPoly = key => pts.map(p => `${xs(p.year).toFixed(1)},${ys(p[key]).toFixed(1)}`).join(' ')
  const baseY = padT + plotH
  const areaPath =
    `M ${xs(pts[0].year).toFixed(1)},${baseY}` +
    pts.map(p => ` L ${xs(p.year).toFixed(1)},${ys(p.value).toFixed(1)}`).join('') +
    ` L ${xs(pts[pts.length - 1].year).toFixed(1)},${baseY} Z`
  const gridY = []
  for (let i = 0; i <= 4; i++) {
    const v = (maxY * i) / 4
    gridY.push({ y: +ys(v).toFixed(1), label: fmtCompact(v) })
  }
  const gridX = []
  const step = niceStepYears(maxYear)
  for (let y = 0; y <= maxYear + 1e-9; y += step) {
    gridX.push({ x: +xs(y).toFixed(1), label: fmtYearLabel(+y.toFixed(4)) })
  }
  return {
    vbW, vbH, padL, padR, padT, padB, plotW, plotH, maxY, maxYear,
    valuePoly: toPoly('value'),
    principalPoly: toPoly('principal'),
    areaPath, gridY, gridX, xs, ys
  }
}
// ==== 纯函数区结束 ====

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

// ---------- 定投增长曲线（内联 SVG，无第三方库） ----------
// 数据源：与页面终值同口径的逐期序列（费后年化 = 预期年化 - 管理费率），原点补 (0,0)
const chartSeries = computed(() => {
  const years = Number(investmentYears.value)
  const amount = Number(frequency.value === 'monthly' ? monthlyAmount.value : periodicAmount.value)
  if (!Number.isFinite(years) || years <= 0 || !Number.isFinite(amount) || amount <= 0) return []
  const netAnnualRate = Number(expectedReturn.value) - Number(managementFee.value)
  const pts = periodSeries(amount, Number.isFinite(netAnnualRate) ? netAnnualRate : 0, years, getPeriodsPerYear())
  return [{ year: 0, principal: 0, value: 0 }, ...pts]
})

const chartGeom = computed(() => {
  const pts = chartSeries.value
  if (pts.length < 2) return null
  return buildChartGeometry(pts)
})

// 悬停交互：根据鼠标在绘图区的位置找最近年份的数据点
const hoverIdx = ref(-1)
const hoverPoint = computed(() => {
  const pts = chartSeries.value
  return hoverIdx.value >= 0 && hoverIdx.value < pts.length ? pts[hoverIdx.value] : null
})

const onChartMove = ev => {
  const geom = chartGeom.value
  if (!geom) return
  const svg = ev.currentTarget.ownerSVGElement
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  if (!rect.width) return
  const vbX = ((ev.clientX - rect.left) / rect.width) * geom.vbW
  const yearFloat = ((vbX - geom.padL) / geom.plotW) * geom.maxYear
  let best = 0
  let bestDist = Infinity
  chartSeries.value.forEach((p, i) => {
    const d = Math.abs(p.year - yearFloat)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  hoverIdx.value = best
}

// 悬停提示框位置（相对图表容器，边缘自动钳制）
const tipStyle = computed(() => {
  const geom = chartGeom.value
  const p = hoverPoint.value
  if (!geom || !p) return {}
  const leftPct = Math.min(Math.max((geom.xs(p.year) / geom.vbW) * 100, 16), 84)
  const topPct = (Math.min(geom.ys(p.value), geom.ys(p.principal)) / geom.vbH) * 100
  return {
    left: leftPct + '%',
    top: topPct + '%',
    transform: 'translate(-50%, calc(-100% - 8px))'
  }
})

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

// ---------- 方案对比（内存存储，最多 3 个） ----------
const scenarios = ref([])
let scenarioSeq = 0

// 把当前参数与计算结果快照保存为一个方案
const addScenario = () => {
  if (!sipResult.value) calculateSIP()
  if (!sipResult.value) {
    alert('请先输入有效的定投参数')
    return
  }
  if (scenarios.value.length >= 3) {
    alert('最多保存 3 个方案，请先移除或清空后再添加')
    return
  }
  const periodAmount = frequency.value === 'monthly' ? monthlyAmount.value : periodicAmount.value
  const freqLabels = { monthly: '月', quarterly: '季', weekly: '周' }
  scenarios.value.push({
    id: ++scenarioSeq,
    frequencyLabel: freqLabels[frequency.value] || '月',
    amount: periodAmount,
    annualRate: expectedReturn.value,
    years: investmentYears.value,
    finalAmount: sipResult.value.finalAmount,
    totalReturn: sipResult.value.totalReturn,
    totalReturnRate: sipResult.value.totalReturnRate
  })
}

const removeScenario = id => {
  scenarios.value = scenarios.value.filter(s => s.id !== id)
}

const clearScenarios = () => {
  scenarios.value = []
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