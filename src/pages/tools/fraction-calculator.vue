<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">分数计算器</h1>
      <p class="text-muted-foreground mb-6">分数加减乘除、约分、通分、小数转换等分数运算工具</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：分数输入和运算 -->
      <div class="space-y-6">
        <!-- 分数输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">分数输入</h3>
          <div class="space-y-4">
            <!-- 第一个分数 -->
            <div>
              <label class="block text-sm font-medium mb-2">分数 A</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="fractionA.numerator"
                  type="number"
                  class="w-24 px-3 py-2 border rounded-lg text-center"
                  placeholder="分子"
                />
                <div class="text-2xl font-semibold">/</div>
                <input
                  v-model.number="fractionA.denominator"
                  type="number"
                  class="w-24 px-3 py-2 border rounded-lg text-center"
                  placeholder="分母"
                />
                <button @click="simplifyFraction('A')" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  约分
                </button>
              </div>
            </div>

            <!-- 第二个分数 -->
            <div>
              <label class="block text-sm font-medium mb-2">分数 B</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="fractionB.numerator"
                  type="number"
                  class="w-24 px-3 py-2 border rounded-lg text-center"
                  placeholder="分子"
                />
                <div class="text-2xl font-semibold">/</div>
                <input
                  v-model.number="fractionB.denominator"
                  type="number"
                  class="w-24 px-3 py-2 border rounded-lg text-center"
                  placeholder="分母"
                />
                <button @click="simplifyFraction('B')" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  约分
                </button>
              </div>
            </div>

            <!-- 运算符选择 -->
            <div>
              <label class="block text-sm font-medium mb-2">运算</label>
              <div class="grid grid-cols-4 gap-2">
                <button @click="performOperation('add')" class="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  A + B
                </button>
                <button @click="performOperation('subtract')" class="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  A - B
                </button>
                <button @click="performOperation('multiply')" class="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  A × B
                </button>
                <button @click="performOperation('divide')" class="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  A ÷ B
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 计算结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">计算结果</h3>
          <div v-if="result.isValid" class="space-y-4">
            <!-- 结果显示 -->
            <div class="p-4 bg-secondary rounded-lg">
              <div class="text-2xl font-bold text-center">
                {{ result.numerator }} / {{ result.denominator }}
              </div>
              <div class="text-center text-sm text-muted-foreground mt-2">
                = {{ result.decimal }} (小数)
              </div>
              <div class="text-center text-sm text-muted-foreground">
                = {{ result.percentage }}% (百分比)
              </div>
            </div>

            <!-- 步骤展示 -->
            <div v-if="calculationSteps.length > 0" class="space-y-2">
              <h4 class="font-medium">计算步骤</h4>
              <div v-for="(step, index) in calculationSteps" :key="index" class="p-2 bg-muted rounded text-sm">
                {{ step }}
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            选择运算开始计算
          </div>
        </div>

        <!-- 混合数转换 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">混合数与假分数</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">混合数转假分数</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="mixedNumber.whole"
                  type="number"
                  class="w-20 px-3 py-2 border rounded-lg text-center"
                  placeholder="整数"
                />
                <input
                  v-model.number="mixedNumber.numerator"
                  type="number"
                  class="w-20 px-3 py-2 border rounded-lg text-center"
                  placeholder="分子"
                />
                <div class="text-xl font-semibold">/</div>
                <input
                  v-model.number="mixedNumber.denominator"
                  type="number"
                  class="w-20 px-3 py-2 border rounded-lg text-center"
                  placeholder="分母"
                />
                <button @click="mixedToImproper" class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                  转换
                </button>
              </div>
            </div>

            <div v-if="improperFraction.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">假分数:</div>
              <div class="text-lg font-mono">{{ improperFraction.numerator }} / {{ improperFraction.denominator }}</div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">假分数转混合数</label>
              <button @click="improperToMixed" class="w-full px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80">
                将结果转换为混合数
              </button>
            </div>

            <div v-if="mixedResult.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">混合数:</div>
              <div class="text-lg">
                {{ mixedResult.whole }} {{ mixedResult.numerator }}/{{ mixedResult.denominator }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：其他功能 -->
      <div class="space-y-6">
        <!-- 小数转分数 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">小数转分数</h3>
          <div class="space-y-4">
            <div>
              <input
                v-model="decimalInput"
                type="number"
                step="0.01"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="输入小数，如: 0.75"
              />
            </div>
            <button @click="decimalToFraction" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              转换为分数
            </button>

            <div v-if="decimalFraction.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm">分数形式: {{ decimalFraction.numerator }} / {{ decimalFraction.denominator }}</div>
              <div class="text-sm">约分后: {{ decimalFraction.simplified.numerator }} / {{ decimalFraction.simplified.denominator }}</div>
            </div>
          </div>
        </div>

        <!-- 分数比较 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">分数比较</h3>
          <div class="space-y-4">
            <button @click="compareFractions" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              比较 A 和 B
            </button>

            <div v-if="fractionComparison.result" class="p-3 bg-secondary rounded">
              <div class="text-lg font-medium">
                {{ fractionComparison.text }}
              </div>
              <div class="text-sm text-muted-foreground mt-1">
                {{ fractionComparison.detail }}
              </div>
            </div>

            <!-- 通分 -->
            <div>
              <button @click="findCommonDenominator" class="w-full px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80">
                通分 A 和 B
              </button>
            </div>

            <div v-if="commonDenominator.isValid" class="p-3 bg-secondary rounded">
              <div class="text-sm">最小公倍数: {{ commonDenominator.lcm }}</div>
              <div class="text-sm">A = {{ commonDenominator.fractionA.numerator }} / {{ commonDenominator.fractionA.denominator }}</div>
              <div class="text-sm">B = {{ commonDenominator.fractionB.numerator }} / {{ commonDenominator.fractionB.denominator }}</div>
            </div>
          </div>
        </div>

        <!-- 分数性质 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">分数性质分析</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">分析分数</label>
              <select v-model="selectedFractionForAnalysis" class="w-full px-3 py-2 border rounded-lg">
                <option value="A">分数 A</option>
                <option value="B">分数 B</option>
                <option value="result">计算结果</option>
              </select>
            </div>

            <button @click="analyzeFraction" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              分析
            </button>

            <div v-if="fractionAnalysis.isValid" class="space-y-2">
              <div class="p-2 bg-secondary rounded">
                <div class="text-sm font-medium">类型: {{ fractionAnalysis.type }}</div>
              </div>
              <div class="p-2 bg-secondary rounded">
                <div class="text-sm font-medium">是否最简: {{ fractionAnalysis.isSimplified ? '是' : '否' }}</div>
              </div>
              <div v-if="fractionAnalysis.reciprocal.isValid" class="p-2 bg-secondary rounded">
                <div class="text-sm font-medium">倒数: {{ fractionAnalysis.reciprocal.numerator }} / {{ fractionAnalysis.reciprocal.denominator }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">计算历史</h3>
            <button @click="clearHistory" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
              清空
            </button>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in calculationHistory"
              :key="index"
              @click="loadFromHistory(item)"
              class="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <div class="text-sm font-mono">{{ item.expression }}</div>
              <div class="text-sm">{{ item.result }}</div>
              <div class="text-xs text-muted-foreground">{{ item.timestamp }}</div>
            </div>
            <div v-if="calculationHistory.length === 0" class="text-center text-muted-foreground py-4">
              暂无计算历史
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('分数计算器')

// 分数数据
const fractionA = ref({
  numerator: 1,
  denominator: 2
})

const fractionB = ref({
  numerator: 1,
  denominator: 3
})

// 计算结果
const result = ref({
  isValid: false,
  numerator: 0,
  denominator: 1,
  decimal: 0,
  percentage: 0
})

// 计算步骤
const calculationSteps = ref([])

// 混合数
const mixedNumber = ref({
  whole: 0,
  numerator: 0,
  denominator: 1
})

const improperFraction = ref({
  isValid: false,
  numerator: 0,
  denominator: 1
})

const mixedResult = ref({
  isValid: false,
  whole: 0,
  numerator: 0,
  denominator: 1
})

// 小数转分数
const decimalInput = ref('')
const decimalFraction = ref({
  isValid: false,
  numerator: 0,
  denominator: 1,
  simplified: { numerator: 0, denominator: 1 }
})

// 分数比较
const fractionComparison = ref({
  result: false,
  text: '',
  detail: ''
})

// 通分
const commonDenominator = ref({
  isValid: false,
  lcm: 0,
  fractionA: { numerator: 0, denominator: 0 },
  fractionB: { numerator: 0, denominator: 0 }
})

// 分数分析
const selectedFractionForAnalysis = ref('A')
const fractionAnalysis = ref({
  isValid: false,
  type: '',
  isSimplified: false,
  reciprocal: { isValid: false, numerator: 0, denominator: 0 }
})

// 历史记录
const calculationHistory = ref([])

// 辅助函数
const gcd = (a, b) => {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b !== 0) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

const lcm = (a, b) => {
  return Math.abs(a * b) / gcd(a, b)
}

const simplify = (numerator, denominator) => {
  if (denominator < 0) {
    numerator = -numerator
    denominator = -denominator
  }

  const divisor = gcd(Math.abs(numerator), Math.abs(denominator))
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  }
}

const fractionToDecimal = (numerator, denominator) => {
  return denominator !== 0 ? numerator / denominator : 0
}

// 分数运算
const performOperation = (operation) => {
  if (!fractionA.value.denominator || !fractionB.value.denominator) {
    alert('分母不能为零')
    return
  }

  let numerator = 0
  let denominator = 1
  const steps = []

  switch (operation) {
    case 'add':
      const commonDenom = lcm(fractionA.value.denominator, fractionB.value.denominator)
      numerator = (fractionA.value.numerator * (commonDenom / fractionA.value.denominator)) +
                   (fractionB.value.numerator * (commonDenom / fractionB.value.denominator))
      denominator = commonDenom

      steps.push(`通分: ${fractionA.value.numerator}/${fractionA.value.denominator} = ${fractionA.value.numerator * (commonDenom / fractionA.value.denominator)}/${commonDenom}`)
      steps.push(`通分: ${fractionB.value.numerator}/${fractionB.value.denominator} = ${fractionB.value.numerator * (commonDenom / fractionB.value.denominator)}/${commonDenom}`)
      steps.push(`相加: ${numerator}/${commonDenom}`)
      break

    case 'subtract':
      const commonDenomSub = lcm(fractionA.value.denominator, fractionB.value.denominator)
      numerator = (fractionA.value.numerator * (commonDenomSub / fractionA.value.denominator)) -
                   (fractionB.value.numerator * (commonDenomSub / fractionB.value.denominator))
      denominator = commonDenomSub
      break

    case 'multiply':
      numerator = fractionA.value.numerator * fractionB.value.numerator
      denominator = fractionA.value.denominator * fractionB.value.denominator
      steps.push(`分子相乘: ${fractionA.value.numerator} × ${fractionB.value.numerator} = ${numerator}`)
      steps.push(`分母相乘: ${fractionA.value.denominator} × ${fractionB.value.denominator} = ${denominator}`)
      break

    case 'divide':
      if (fractionB.value.numerator === 0) {
        alert('不能除以零')
        return
      }
      numerator = fractionA.value.numerator * fractionB.value.denominator
      denominator = fractionA.value.denominator * fractionB.value.numerator
      steps.push(`除以一个分数等于乘以它的倒数`)
      steps.push(`${fractionA.value.numerator}/${fractionA.value.denominator} × ${fractionB.value.denominator}/${fractionB.value.numerator} = ${numerator}/${denominator}`)
      break
  }

  // 约分结果
  const simplified = simplify(numerator, denominator)
  const decimal = fractionToDecimal(simplified.numerator, simplified.denominator)
  const percentage = (decimal * 100).toFixed(2)

  result.value = {
    isValid: true,
    numerator: simplified.numerator,
    denominator: simplified.denominator,
    decimal: decimal.toFixed(4),
    percentage
  }

  calculationSteps.value = steps
  addToHistory(`${operation.toUpperCase()}(${fractionA.value.numerator}/${fractionA.value.denominator}, ${fractionB.value.numerator}/${fractionB.value.denominator})`, `${simplified.numerator}/${simplified.denominator}`)
}

const simplifyFraction = (fractionName) => {
  const fraction = fractionName === 'A' ? fractionA.value : fractionB.value

  if (!fraction.denominator) {
    alert('分母不能为零')
    return
  }

  const simplified = simplify(fraction.numerator, fraction.denominator)

  if (fractionName === 'A') {
    fractionA.value = simplified
  } else {
    fractionB.value = simplified
  }
}

// 混合数转换
const mixedToImproper = () => {
  const { whole, numerator, denominator } = mixedNumber.value

  if (!denominator) {
    alert('分母不能为零')
    return
  }

  const newNumerator = whole * denominator + numerator

  improperFraction.value = {
    isValid: true,
    numerator: newNumerator,
    denominator
  }
}

const improperToMixed = () => {
  if (!result.value.isValid) return

  const { numerator, denominator } = result.value
  const whole = Math.floor(Math.abs(numerator) / denominator)
  const newNumerator = Math.abs(numerator) % denominator

  mixedResult.value = {
    isValid: true,
    whole: numerator < 0 ? -whole : whole,
    numerator: newNumerator,
    denominator
  }
}

// 小数转分数
const decimalToFraction = () => {
  const decimal = parseFloat(decimalInput.value)
  if (isNaN(decimal)) return

  const decimalStr = decimal.toString()
  const decimalPlaces = decimalStr.includes('.') ? decimalStr.split('.')[1].length : 0
  const denominator = Math.pow(10, decimalPlaces)
  let numerator = Math.round(decimal * denominator)

  // 约分
  const simplified = simplify(numerator, denominator)

  decimalFraction.value = {
    isValid: true,
    numerator,
    denominator,
    simplified
  }
}

// 分数比较
const compareFractions = () => {
  if (!fractionA.value.denominator || !fractionB.value.denominator) {
    alert('分母不能为零')
    return
  }

  const aDecimal = fractionToDecimal(fractionA.value.numerator, fractionA.value.denominator)
  const bDecimal = fractionToDecimal(fractionB.value.numerator, fractionB.value.denominator)

  let result = ''
  let detail = ''

  if (aDecimal > bDecimal) {
    result = 'A > B'
    detail = `${fractionA.value.numerator}/${fractionA.value.denominator} (${aDecimal}) > ${fractionB.value.numerator}/${fractionB.value.denominator} (${bDecimal})`
  } else if (aDecimal < bDecimal) {
    result = 'A < B'
    detail = `${fractionA.value.numerator}/${fractionA.value.denominator} (${aDecimal}) < ${fractionB.value.numerator}/${fractionB.value.denominator} (${bDecimal})`
  } else {
    result = 'A = B'
    detail = `${fractionA.value.numerator}/${fractionA.value.denominator} (${aDecimal}) = ${fractionB.value.numerator}/${fractionB.value.denominator} (${bDecimal})`
  }

  fractionComparison.value = {
    result: true,
    text: result,
    detail
  }
}

const findCommonDenominator = () => {
  if (!fractionA.value.denominator || !fractionB.value.denominator) {
    alert('分母不能为零')
    return
  }

  const commonDenom = lcm(fractionA.value.denominator, fractionB.value.denominator)

  commonDenominator.value = {
    isValid: true,
    lcm: commonDenom,
    fractionA: {
      numerator: fractionA.value.numerator * (commonDenom / fractionA.value.denominator),
      denominator: commonDenom
    },
    fractionB: {
      numerator: fractionB.value.numerator * (commonDenom / fractionB.value.denominator),
      denominator: commonDenom
    }
  }
}

// 分数分析
const analyzeFraction = () => {
  let fraction = null
  let fractionName = ''

  switch (selectedFractionForAnalysis.value) {
    case 'A':
      fraction = fractionA.value
      fractionName = 'A'
      break
    case 'B':
      fraction = fractionB.value
      fractionName = 'B'
      break
    case 'result':
      if (!result.value.isValid) return
      fraction = {
        numerator: result.value.numerator,
        denominator: result.value.denominator
      }
      fractionName = '结果'
      break
  }

  if (!fraction || !fraction.denominator) {
    alert('无效的分数')
    return
  }

  // 类型判断
  let type = '真分数'
  if (Math.abs(fraction.numerator) > Math.abs(fraction.denominator)) {
    type = '假分数'
  } else if (Math.abs(fraction.numerator) === Math.abs(fraction.denominator)) {
    type = '整数'
  }

  // 是否最简
  const isSimplified = gcd(Math.abs(fraction.numerator), Math.abs(fraction.denominator)) === 1

  // 倒数
  let reciprocal = { isValid: false, numerator: 0, denominator: 0 }
  if (fraction.numerator !== 0) {
    reciprocal = {
      isValid: true,
      numerator: fraction.denominator,
      denominator: fraction.numerator
    }
  }

  fractionAnalysis.value = {
    isValid: true,
    type,
    isSimplified,
    reciprocal
  }
}

// 历史记录
const addToHistory = (expression, result) => {
  calculationHistory.value.unshift({
    expression,
    result,
    timestamp: new Date().toLocaleTimeString()
  })

  if (calculationHistory.value.length > 20) {
    calculationHistory.value = calculationHistory.value.slice(0, 20)
  }
}

const loadFromHistory = (item) => {
  console.log('Loading from history:', item)
}

const clearHistory = () => {
  calculationHistory.value = []
}
</script>

<style scoped>
input[type="number"] {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="number"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

select {
  transition: border-color 0.2s, box-shadow 0.2s;
}

select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>