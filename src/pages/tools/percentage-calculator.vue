<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">百分比计算器</h1>
      <p class="text-muted-foreground">计算百分比变化、百分比增减、占比等，支持正逆向计算</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：基础计算 -->
      <div class="space-y-4">
        <!-- 百分比计算 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">百分比计算</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">数值</label>
              <input
                v-model.number="basicCalc.value"
                @input="calculateBasic"
                type="number"
                step="any"
                placeholder="输入数值"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">百分比</label>
              <div class="flex gap-2">
                <input
                  v-model.number="basicCalc.percentage"
                  @input="calculateBasic"
                  type="number"
                  step="any"
                  placeholder="输入百分比"
                  class="flex-1 px-3 py-2 border rounded-md"
                >
                <span class="px-3 py-2 bg-muted rounded-md">%</span>
              </div>
            </div>

            <div v-if="basicCalc.result !== null" class="p-4 bg-primary/10 rounded-lg">
              <div class="text-center">
                <div class="text-sm text-muted-foreground mb-1">计算结果</div>
                <div class="text-2xl font-bold text-primary">
                  {{ formatNumber(basicCalc.result) }}
                </div>
                <div class="text-sm text-muted-foreground mt-1">
                  {{ basicCalc.value }} 的 {{ basicCalc.percentage }}% = {{ formatNumber(basicCalc.result) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 百分比增加/减少 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">百分比增加/减少</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">原始数值</label>
              <input
                v-model.number="changeCalc.original"
                @input="calculateChange"
                type="number"
                step="any"
                placeholder="输入原始数值"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">变化百分比</label>
              <div class="flex gap-2">
                <input
                  v-model.number="changeCalc.percentage"
                  @input="calculateChange"
                  type="number"
                  step="any"
                  placeholder="输入百分比"
                  class="flex-1 px-3 py-2 border rounded-md"
                >
                <span class="px-3 py-2 bg-muted rounded-md">%</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button
                @click="calculateIncrease"
                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                增加百分比
              </button>
              <button
                @click="calculateDecrease"
                class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                减少百分比
              </button>
            </div>

            <div v-if="changeCalc.result !== null" class="space-y-3">
              <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="text-sm font-medium text-green-800 mb-1">增加后</div>
                <div class="text-xl font-bold text-green-700">
                  {{ formatNumber(changeCalc.result) }}
                </div>
                <div class="text-sm text-green-600">
                  {{ changeCalc.original }} + {{ changeCalc.percentage }}% = {{ formatNumber(changeCalc.result) }}
                </div>
              </div>

              <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div class="text-sm font-medium text-red-800 mb-1">减少后</div>
                <div class="text-xl font-bold text-red-700">
                  {{ formatNumber(changeCalc.decreased) }}
                </div>
                <div class="text-sm text-red-600">
                  {{ changeCalc.original }} - {{ changeCalc.percentage }}% = {{ formatNumber(changeCalc.decreased) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：高级计算 -->
      <div class="space-y-4">
        <!-- 占比计算 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">占比计算</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">部分数值</label>
              <input
                v-model.number="ratioCalc.part"
                @input="calculateRatio"
                type="number"
                step="any"
                placeholder="输入部分数值"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">整体数值</label>
              <input
                v-model.number="ratioCalc.total"
                @input="calculateRatio"
                type="number"
                step="any"
                placeholder="输入整体数值"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div v-if="ratioCalc.percentage !== null" class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="text-center">
                <div class="text-sm text-blue-800 mb-1">占比结果</div>
                <div class="text-2xl font-bold text-blue-700">
                  {{ ratioCalc.percentage.toFixed(2) }}%
                </div>
                <div class="text-sm text-blue-600 mt-1">
                  {{ ratioCalc.part }} 占 {{ ratioCalc.total }} 的 {{ ratioCalc.percentage.toFixed(2) }}%
                </div>
              </div>

              <!-- 进度条可视化 -->
              <div class="mt-4">
                <div class="w-full bg-blue-200 rounded-full h-3">
                  <div
                    class="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    :style="{ width: `${Math.min(ratioCalc.percentage, 100)}%` }"
                  ></div>
                </div>
                <div class="text-xs text-blue-600 mt-1 text-center">{{ ratioCalc.percentage.toFixed(1) }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 百分比差异计算 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">百分比差异</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">数值 A</label>
              <input
                v-model.number="diffCalc.valueA"
                @input="calculateDiff"
                type="number"
                step="any"
                placeholder="输入第一个数值"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">数值 B</label>
              <input
                v-model.number="diffCalc.valueB"
                @input="calculateDiff"
                type="number"
                step="any"
                placeholder="输入第二个数值"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div v-if="diffCalc.percentage !== null" class="space-y-3">
              <div class="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div class="text-sm font-medium text-orange-800 mb-2">差异分析</div>
                <div class="space-y-2 text-sm">
                  <div>
                    A 相对于 B 的差异：
                    <span class="font-bold" :class="diffCalc.diffA > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ diffCalc.diffA > 0 ? '+' : '' }}{{ diffCalc.diffA.toFixed(2) }}%
                    </span>
                  </div>
                  <div>
                    B 相对于 A 的差异：
                    <span class="font-bold" :class="diffCalc.diffB > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ diffCalc.diffB > 0 ? '+' : '' }}{{ diffCalc.diffB.toFixed(2) }}%
                    </span>
                  </div>
                  <div>
                    绝对差异：
                    <span class="font-bold text-orange-600">
                      {{ formatNumber(Math.abs(diffCalc.valueA - diffCalc.valueB)) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实用工具 -->
    <div class="mt-6 bg-card rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">实用工具</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 小费计算器 -->
        <div class="p-4 bg-muted/50 rounded-lg">
          <h4 class="font-medium mb-3">小费计算器</h4>
          <div class="space-y-3">
            <div>
              <label class="text-sm">账单金额</label>
              <input
                v-model.number="tipCalc.bill"
                @input="calculateTip"
                type="number"
                step="any"
                placeholder="0.00"
                class="w-full px-3 py-2 border rounded-md text-sm"
              >
            </div>
            <div>
              <label class="text-sm">小费比例</label>
              <div class="flex gap-2">
                <input
                  v-model.number="tipCalc.percentage"
                  @input="calculateTip"
                  type="number"
                  step="any"
                  placeholder="15"
                  class="flex-1 px-3 py-2 border rounded-md text-sm"
                >
                <span class="px-3 py-2 bg-muted rounded-md text-sm">%</span>
              </div>
            </div>
            <div v-if="tipCalc.amount !== null" class="text-sm space-y-1">
              <div>小费金额: <span class="font-bold">{{ formatCurrency(tipCalc.amount) }}</span></div>
              <div>总计: <span class="font-bold">{{ formatCurrency(tipCalc.total) }}</span></div>
            </div>
          </div>
        </div>

        <!-- 折扣计算器 -->
        <div class="p-4 bg-muted/50 rounded-lg">
          <h4 class="font-medium mb-3">折扣计算器</h4>
          <div class="space-y-3">
            <div>
              <label class="text-sm">原价</label>
              <input
                v-model.number="discountCalc.original"
                @input="calculateDiscount"
                type="number"
                step="any"
                placeholder="0.00"
                class="w-full px-3 py-2 border rounded-md text-sm"
              >
            </div>
            <div>
              <label class="text-sm">折扣</label>
              <div class="flex gap-2">
                <input
                  v-model.number="discountCalc.percentage"
                  @input="calculateDiscount"
                  type="number"
                  step="any"
                  placeholder="20"
                  class="flex-1 px-3 py-2 border rounded-md text-sm"
                >
                <span class="px-3 py-2 bg-muted rounded-md text-sm">%</span>
              </div>
            </div>
            <div v-if="discountCalc.final !== null" class="text-sm space-y-1">
              <div>节省: <span class="font-bold text-green-600">{{ formatCurrency(discountCalc.saved) }}</span></div>
              <div>折后价: <span class="font-bold">{{ formatCurrency(discountCalc.final) }}</span></div>
            </div>
          </div>
        </div>

        <!-- 税收计算器 -->
        <div class="p-4 bg-muted/50 rounded-lg">
          <h4 class="font-medium mb-3">税收计算器</h4>
          <div class="space-y-3">
            <div>
              <label class="text-sm">税前金额</label>
              <input
                v-model.number="taxCalc.preTax"
                @input="calculateTax"
                type="number"
                step="any"
                placeholder="0.00"
                class="w-full px-3 py-2 border rounded-md text-sm"
              >
            </div>
            <div>
              <label class="text-sm">税率</label>
              <div class="flex gap-2">
                <input
                  v-model.number="taxCalc.rate"
                  @input="calculateTax"
                  type="number"
                  step="any"
                  placeholder="13"
                  class="flex-1 px-3 py-2 border rounded-md text-sm"
                >
                <span class="px-3 py-2 bg-muted rounded-md text-sm">%</span>
              </div>
            </div>
            <div v-if="taxCalc.amount !== null" class="text-sm space-y-1">
              <div>税额: <span class="font-bold">{{ formatCurrency(taxCalc.amount) }}</span></div>
              <div>税后: <span class="font-bold">{{ formatCurrency(taxCalc.total) }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常用百分比参考 -->
    <div class="mt-6 bg-card rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">常用百分比参考</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="reference in percentageReferences"
          :key="reference.name"
          class="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
          @click="applyReference(reference)"
        >
          <div class="font-medium">{{ reference.name }}</div>
          <div class="text-sm text-muted-foreground">{{ reference.value }}%</div>
          <div class="text-xs text-muted-foreground mt-1">{{ reference.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Percent, Calculator } from 'lucide-vue-next'

// 基础百分比计算
const basicCalc = ref({
  value: '',
  percentage: '',
  result: null
})

// 百分比增减计算
const changeCalc = ref({
  original: '',
  percentage: '',
  result: null,
  decreased: null
})

// 占比计算
const ratioCalc = ref({
  part: '',
  total: '',
  percentage: null
})

// 百分比差异计算
const diffCalc = ref({
  valueA: '',
  valueB: '',
  percentage: null,
  diffA: null,
  diffB: null
})

// 小费计算器
const tipCalc = ref({
  bill: '',
  percentage: 15,
  amount: null,
  total: null
})

// 折扣计算器
const discountCalc = ref({
  original: '',
  percentage: '',
  final: null,
  saved: null
})

// 税收计算器
const taxCalc = ref({
  preTax: '',
  rate: '',
  amount: null,
  total: null
})

// 常用百分比参考
const percentageReferences = [
  { name: '1/2', value: 50, description: '二分之一' },
  { name: '1/3', value: 33.33, description: '三分之一' },
  { name: '2/3', value: 66.67, description: '三分之二' },
  { name: '1/4', value: 25, description: '四分之一' },
  { name: '3/4', value: 75, description: '四分之三' },
  { name: '1/5', value: 20, description: '五分之一' },
  { name: '2/5', value: 40, description: '五分之二' },
  { name: '3/5', value: 60, description: '五分之三' }
]

// 计算方法
const calculateBasic = () => {
  const value = basicCalc.value.value
  const percentage = basicCalc.value.percentage

  if (value !== null && percentage !== null && !isNaN(value) && !isNaN(percentage)) {
    basicCalc.value.result = value * (percentage / 100)
  } else {
    basicCalc.value.result = null
  }
}

const calculateChange = () => {
  const original = changeCalc.value.original
  const percentage = changeCalc.value.percentage

  if (original !== null && percentage !== null && !isNaN(original) && !isNaN(percentage)) {
    changeCalc.value.result = original * (1 + percentage / 100)
    changeCalc.value.decreased = original * (1 - percentage / 100)
  } else {
    changeCalc.value.result = null
    changeCalc.value.decreased = null
  }
}

const calculateIncrease = () => {
  calculateChange()
}

const calculateDecrease = () => {
  calculateChange()
}

const calculateRatio = () => {
  const part = ratioCalc.value.part
  const total = ratioCalc.value.total

  if (part !== null && total !== null && !isNaN(part) && !isNaN(total) && total !== 0) {
    ratioCalc.value.percentage = (part / total) * 100
  } else {
    ratioCalc.value.percentage = null
  }
}

const calculateDiff = () => {
  const valueA = diffCalc.value.valueA
  const valueB = diffCalc.value.valueB

  if (valueA !== null && valueB !== null && !isNaN(valueA) && !isNaN(valueB)) {
    if (valueB !== 0) {
      diffCalc.value.diffA = ((valueA - valueB) / valueB) * 100
    } else {
      diffCalc.value.diffA = valueA > 0 ? Infinity : (valueA < 0 ? -Infinity : 0)
    }

    if (valueA !== 0) {
      diffCalc.value.diffB = ((valueB - valueA) / valueA) * 100
    } else {
      diffCalc.value.diffB = valueB > 0 ? Infinity : (valueB < 0 ? -Infinity : 0)
    }

    diffCalc.value.percentage = Math.abs(diffCalc.value.diffA)
  } else {
    diffCalc.value.percentage = null
    diffCalc.value.diffA = null
    diffCalc.value.diffB = null
  }
}

const calculateTip = () => {
  const bill = tipCalc.value.bill
  const percentage = tipCalc.value.percentage

  if (bill !== null && percentage !== null && !isNaN(bill) && !isNaN(percentage)) {
    tipCalc.value.amount = bill * (percentage / 100)
    tipCalc.value.total = bill + tipCalc.value.amount
  } else {
    tipCalc.value.amount = null
    tipCalc.value.total = null
  }
}

const calculateDiscount = () => {
  const original = discountCalc.value.original
  const percentage = discountCalc.value.percentage

  if (original !== null && percentage !== null && !isNaN(original) && !isNaN(percentage)) {
    discountCalc.value.saved = original * (percentage / 100)
    discountCalc.value.final = original - discountCalc.value.saved
  } else {
    discountCalc.value.saved = null
    discountCalc.value.final = null
  }
}

const calculateTax = () => {
  const preTax = taxCalc.value.preTax
  const rate = taxCalc.value.rate

  if (preTax !== null && rate !== null && !isNaN(preTax) && !isNaN(rate)) {
    taxCalc.value.amount = preTax * (rate / 100)
    taxCalc.value.total = preTax + taxCalc.value.amount
  } else {
    taxCalc.value.amount = null
    taxCalc.value.total = null
  }
}

// 格式化方法
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return ''
  return Number(num).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

const formatCurrency = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '¥0.00'
  return '¥' + Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 应用参考值
const applyReference = (reference) => {
  basicCalc.value.percentage = reference.value
  calculateBasic()
}

// SEO配置
useSeoMeta({
  title: '百分比计算器 - 占比增幅折扣在线计算工具',
  description: '免费在线百分比计算工具，支持基础百分比计算、占比分析、增幅减幅计算、小费折扣税收等实用功能。',
  keywords: ['百分比计算', '占比计算', '增幅计算', '折扣计算', '小费计算', '税率计算', '在线工具']
})

definePageMeta({
  layout: 'default'
})
</script>