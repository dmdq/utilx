<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">科学计算器</h1>
      <p class="text-muted-foreground mb-6">高级数学运算，支持三角函数、对数、指数等科学计算</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：计算器和历史记录 -->
      <div class="space-y-6">
        <!-- 计算器主体 -->
        <div class="bg-card rounded-lg p-6 border">
          <!-- 显示屏 -->
          <div class="mb-4">
            <div class="bg-muted p-4 rounded-lg text-right">
              <div class="text-sm text-muted-foreground mb-2" v-if="currentExpression">
                {{ currentExpression }}
              </div>
              <div class="text-2xl font-mono font-semibold">
                {{ displayValue || '0' }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ angleMode.toUpperCase() }} | {{ currentBase }}进制
              </div>
            </div>
          </div>

          <!-- 功能切换 -->
          <div class="flex gap-2 mb-4">
            <button
              @click="angleMode = 'deg'"
              :class="[
                'px-3 py-1 rounded text-sm font-medium transition-all',
                angleMode === 'deg' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              ]"
            >
              DEG
            </button>
            <button
              @click="angleMode = 'rad'"
              :class="[
                'px-3 py-1 rounded text-sm font-medium transition-all',
                angleMode === 'rad' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              ]"
            >
              RAD
            </button>
            <button
              @click="toggleMemoryPanel"
              class="ml-auto px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm font-medium hover:bg-secondary/80"
            >
              内存 ({{ memoryItems.length }})
            </button>
          </div>

          <!-- 科学计算器按钮面板 -->
          <div class="grid grid-cols-5 gap-2">
            <!-- 第一行：基础运算 -->
            <button @click="clearAll" class="calc-btn btn-danger">AC</button>
            <button @click="clearEntry" class="calc-btn btn-secondary">C</button>
            <button @click="backspace" class="calc-btn btn-secondary">⌫</button>
            <button @click="appendOperator('/')" class="calc-btn btn-operator">÷</button>
            <button @click="appendOperator('*')" class="calc-btn btn-operator">×</button>

            <!-- 第二行：数字和基础运算 -->
            <button @click="appendNumber('7')" class="calc-btn btn-number">7</button>
            <button @click="appendNumber('8')" class="calc-btn btn-number">8</button>
            <button @click="appendNumber('9')" class="calc-btn btn-number">9</button>
            <button @click="appendOperator('-')" class="calc-btn btn-operator">−</button>
            <button @click="calculateSquareRoot" class="calc-btn btn-function">√</button>

            <!-- 第三行：数字和基础运算 -->
            <button @click="appendNumber('4')" class="calc-btn btn-number">4</button>
            <button @click="appendNumber('5')" class="calc-btn btn-number">5</button>
            <button @click="appendNumber('6')" class="calc-btn btn-number">6</button>
            <button @click="appendOperator('+')" class="calc-btn btn-operator">+</button>
            <button @click="calculatePower" class="calc-btn btn-function">x²</button>

            <!-- 第四行：数字和基础运算 -->
            <button @click="appendNumber('1')" class="calc-btn btn-number">1</button>
            <button @click="appendNumber('2')" class="calc-btn btn-number">2</button>
            <button @click="appendNumber('3')" class="calc-btn btn-number">3</button>
            <button @click="appendOperator('^')" class="calc-btn btn-function">xʸ</button>
            <button @click="calculateLog" class="calc-btn btn-function">log</button>

            <!-- 第五行：数字和小数点 -->
            <button @click="appendNumber('0')" class="calc-btn btn-number col-span-2">0</button>
            <button @click="appendDecimal" class="calc-btn btn-number">.</button>
            <button @click="calculateResult" class="calc-btn btn-equals">=</button>
            <button @click="calculateLn" class="calc-btn btn-function">ln</button>

            <!-- 第六行：三角函数 -->
            <button @click="calculateSin" class="calc-btn btn-function">sin</button>
            <button @click="calculateCos" class="calc-btn btn-function">cos</button>
            <button @click="calculateTan" class="calc-btn btn-function">tan</button>
            <button @click="toggleSign" class="calc-btn btn-function">+/−</button>
            <button @click="calculateFactorial" class="calc-btn btn-function">n!</button>

            <!-- 第七行：高级函数 -->
            <button @click="openParenthesis" class="calc-btn btn-function">(</button>
            <button @click="closeParenthesis" class="calc-btn btn-function">)</button>
            <button @click="calculateExp" class="calc-btn btn-function">eˣ</button>
            <button @click="appendConstant('pi')" class="calc-btn btn-function">π</button>
            <button @click="appendConstant('e')" class="calc-btn btn-function">e</button>

            <!-- 第八行：其他函数 -->
            <button @click="calculateSinH" class="calc-btn btn-function">sinh</button>
            <button @click="calculateCosH" class="calc-btn btn-function">cosh</button>
            <button @click="calculateTanH" class="calc-btn btn-function">tanh</button>
            <button @click="calculateReciprocal" class="calc-btn btn-function">1/x</button>
            <button @click="calculatePercentage" class="calc-btn btn-function">%</button>
          </div>
        </div>

        <!-- 内存面板 -->
        <div v-if="showMemoryPanel" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">内存存储</h3>
          <div class="space-y-2">
            <div
              v-for="(item, index) in memoryItems"
              :key="index"
              class="flex items-center justify-between p-2 bg-secondary rounded"
            >
              <span class="font-mono text-sm">{{ item.value }}</span>
              <div class="flex gap-2">
                <button
                  @click="recallMemory(index)"
                  class="px-2 py-1 bg-primary text-primary-foreground rounded text-xs"
                >
                  调用
                </button>
                <button
                  @click="removeMemory(index)"
                  class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                >
                  删除
                </button>
              </div>
            </div>
            <div v-if="memoryItems.length === 0" class="text-center text-muted-foreground py-4">
              暂无内存项
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：计算历史和常量 -->
      <div class="space-y-6">
        <!-- 计算历史 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">计算历史</h3>
            <button
              @click="clearHistory"
              class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
            >
              清空
            </button>
          </div>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="(item, index) in calculationHistory"
              :key="index"
              @click="loadFromHistory(item)"
              class="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <div class="text-sm text-muted-foreground">{{ item.expression }}</div>
              <div class="font-mono font-semibold">{{ item.result }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ item.timestamp }}</div>
            </div>
            <div v-if="calculationHistory.length === 0" class="text-center text-muted-foreground py-4">
              暂无计算历史
            </div>
          </div>
        </div>

        <!-- 科学常量 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">科学常量</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="constant in scientificConstants"
              :key="constant.name"
              @click="appendConstant(constant.value)"
              class="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-left"
            >
              <div class="font-medium text-sm">{{ constant.name }}</div>
              <div class="text-xs text-muted-foreground">{{ constant.value }}</div>
            </button>
          </div>
        </div>

        <!-- 单位转换快捷方式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">快捷转换</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">角度 ↔ 弧度</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model.number="angleConversion.degrees"
                  @input="convertAngle('deg')"
                  type="number"
                  class="px-3 py-2 border rounded"
                  placeholder="度"
                />
                <input
                  v-model.number="angleConversion.radians"
                  @input="convertAngle('rad')"
                  type="number"
                  class="px-3 py-2 border rounded"
                  placeholder="弧度"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">摄氏度 ↔ 华氏度</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model.number="tempConversion.celsius"
                  @input="convertTemp('c')"
                  type="number"
                  class="px-3 py-2 border rounded"
                  placeholder="°C"
                />
                <input
                  v-model.number="tempConversion.fahrenheit"
                  @input="convertTemp('f')"
                  type="number"
                  class="px-3 py-2 border rounded"
                  placeholder="°F"
                />
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
import { useSEO } from '~/composables/useSEO'
import { useClipboard } from '~/composables/useClipboard'

const { setPageTitle } = useSEO()
setPageTitle('科学计算器')

// 计算器状态
const displayValue = ref('')
const currentExpression = ref('')
const shouldResetDisplay = ref(false)
const angleMode = ref('deg') // deg or rad
const currentBase = ref(10) // number base

// 内存和历史记录
const showMemoryPanel = ref(false)
const memoryItems = ref([])
const calculationHistory = ref([])

// 快捷转换
const angleConversion = ref({
  degrees: 0,
  radians: 0
})

const tempConversion = ref({
  celsius: 0,
  fahrenheit: 32
})

// 科学常量
const scientificConstants = [
  { name: '光速', value: '299792458' },
  { name: '普朗克常数', value: '6.62607015e-34' },
  { name: '阿伏伽德罗常数', value: '6.02214076e23' },
  { name: '玻尔兹曼常数', value: '1.380649e-23' },
  { name: '理想气体常数', value: '8.314462618' },
  { name: '引力常数', value: '6.67430e-11' },
  { name: '电子电荷', value: '1.602176634e-19' },
  { name: '精细结构常数', value: '7.2973525693e-3' }
]

// 基础计算功能
const appendNumber = (num) => {
  if (shouldResetDisplay.value) {
    displayValue.value = ''
    shouldResetDisplay.value = false
  }
  displayValue.value += num
  currentExpression.value += num
}

const appendOperator = (op) => {
  if (displayValue.value && !shouldResetDisplay.value) {
    currentExpression.value += ` ${op} `
    shouldResetDisplay.value = true
  }
}

const appendDecimal = () => {
  if (!displayValue.value.includes('.')) {
    displayValue.value += '.'
    currentExpression.value += '.'
  }
}

const clearAll = () => {
  displayValue.value = ''
  currentExpression.value = ''
  shouldResetDisplay.value = false
}

const clearEntry = () => {
  displayValue.value = ''
  shouldResetDisplay.value = false
}

const backspace = () => {
  if (displayValue.value) {
    displayValue.value = displayValue.value.slice(0, -1)
    if (!shouldResetDisplay.value) {
      currentExpression.value = currentExpression.value.slice(0, -1)
    }
  }
}

const toggleSign = () => {
  if (displayValue.value) {
    if (displayValue.value.startsWith('-')) {
      displayValue.value = displayValue.value.slice(1)
    } else {
      displayValue.value = '-' + displayValue.value
    }
  }
}

// 高级计算功能
const calculateResult = () => {
  try {
    const result = evaluateExpression(currentExpression.value || displayValue.value)
    addToHistory(currentExpression.value || displayValue.value, result)
    displayValue.value = result.toString()
    currentExpression.value = result.toString()
    shouldResetDisplay.value = true
  } catch (error) {
    displayValue.value = 'Error'
    shouldResetDisplay.value = true
  }
}

const calculateSquareRoot = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    if (num >= 0) {
      const result = Math.sqrt(num)
      addToHistory(`√(${num})`, result)
      displayValue.value = result.toString()
      shouldResetDisplay.value = true
    } else {
      displayValue.value = 'Error'
      shouldResetDisplay.value = true
    }
  }
}

const calculatePower = () => {
  const num = parseFloat(displayValue.value)
  const result = num * num
  addToHistory(`${num}²`, result)
  displayValue.value = result.toString()
  shouldResetDisplay.value = true
}

const calculateLog = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    if (num > 0) {
      const result = Math.log10(num)
      addToHistory(`log(${num})`, result)
      displayValue.value = result.toString()
      shouldResetDisplay.value = true
    } else {
      displayValue.value = 'Error'
      shouldResetDisplay.value = true
    }
  }
}

const calculateLn = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    if (num > 0) {
      const result = Math.log(num)
      addToHistory(`ln(${num})`, result)
      displayValue.value = result.toString()
      shouldResetDisplay.value = true
    } else {
      displayValue.value = 'Error'
      shouldResetDisplay.value = true
    }
  }
}

const calculateSin = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    const radians = angleMode.value === 'deg' ? num * Math.PI / 180 : num
    const result = Math.sin(radians)
    addToHistory(`sin(${num}${angleMode.value === 'deg' ? '°' : 'rad'})`, result)
    displayValue.value = result.toString()
    shouldResetDisplay.value = true
  }
}

const calculateCos = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    const radians = angleMode.value === 'deg' ? num * Math.PI / 180 : num
    const result = Math.cos(radians)
    addToHistory(`cos(${num}${angleMode.value === 'deg' ? '°' : 'rad'})`, result)
    displayValue.value = result.toString()
    shouldResetDisplay.value = true
  }
}

const calculateTan = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    const radians = angleMode.value === 'deg' ? num * Math.PI / 180 : num
    const result = Math.tan(radians)
    addToHistory(`tan(${num}${angleMode.value === 'deg' ? '°' : 'rad'})`, result)
    displayValue.value = result.toString()
    shouldResetDisplay.value = true
  }
}

const calculateSinH = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    const result = Math.sinh(num)
    addToHistory(`sinh(${num})`, result)
    displayValue.value = result.toString()
    shouldResetDisplay.value = true
  }
}

const calculateCosH = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    const result = Math.cosh(num)
    addToHistory(`cosh(${num})`, result)
    displayValue.value = result.toString()
    shouldResetDisplay.value = true
  }
}

const calculateTanH = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    const result = Math.tanh(num)
    addToHistory(`tanh(${num})`, result)
    displayValue.value = result.toString()
    shouldResetDisplay.value = true
  }
}

const calculateExp = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    const result = Math.exp(num)
    addToHistory(`e^${num}`, result)
    displayValue.value = result.toString()
    shouldResetDisplay.value = true
  }
}

const calculateFactorial = () => {
  if (displayValue.value) {
    const num = parseInt(displayValue.value)
    if (num >= 0 && num <= 170) { // 防止溢出
      const result = factorial(num)
      addToHistory(`${num}!`, result)
      displayValue.value = result.toString()
      shouldResetDisplay.value = true
    } else {
      displayValue.value = 'Error'
      shouldResetDisplay.value = true
    }
  }
}

const calculateReciprocal = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    if (num !== 0) {
      const result = 1 / num
      addToHistory(`1/${num}`, result)
      displayValue.value = result.toString()
      shouldResetDisplay.value = true
    } else {
      displayValue.value = 'Error'
      shouldResetDisplay.value = true
    }
  }
}

const calculatePercentage = () => {
  if (displayValue.value) {
    const num = parseFloat(displayValue.value)
    const result = num / 100
    addToHistory(`${num}%`, result)
    displayValue.value = result.toString()
    shouldResetDisplay.value = true
  }
}

const openParenthesis = () => {
  currentExpression.value += '('
  shouldResetDisplay.value = false
}

const closeParenthesis = () => {
  currentExpression.value += ')'
  shouldResetDisplay.value = false
}

const appendConstant = (constant) => {
  const value = constant === 'pi' ? Math.PI :
                constant === 'e' ? Math.E :
                parseFloat(constant)

  displayValue.value = value.toString()
  currentExpression.value += value.toString()
  shouldResetDisplay.value = true
}

// 辅助函数
const factorial = (n) => {
  if (n <= 1) return 1
  return n * factorial(n - 1)
}

const evaluateExpression = (expr) => {
  // 简化的表达式求值，实际项目中建议使用math.js等库
  try {
    // 替换运算符
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
    return Function('"use strict"; return (' + expr + ')')()
  } catch (error) {
    throw new Error('Invalid expression')
  }
}

// 内存管理
const toggleMemoryPanel = () => {
  showMemoryPanel.value = !showMemoryPanel.value
}

const recallMemory = (index) => {
  displayValue.value = memoryItems.value[index].value
  currentExpression.value += memoryItems.value[index].value
  shouldResetDisplay.value = true
}

const removeMemory = (index) => {
  memoryItems.value.splice(index, 1)
}

// 历史记录管理
const addToHistory = (expression, result) => {
  calculationHistory.value.unshift({
    expression,
    result: result.toString(),
    timestamp: new Date().toLocaleTimeString()
  })

  // 限制历史记录数量
  if (calculationHistory.value.length > 50) {
    calculationHistory.value = calculationHistory.value.slice(0, 50)
  }
}

const loadFromHistory = (item) => {
  displayValue.value = item.result
  currentExpression.value = item.expression
  shouldResetDisplay.value = true
}

const clearHistory = () => {
  calculationHistory.value = []
}

// 快捷转换功能
const convertAngle = (from) => {
  if (from === 'deg') {
    angleConversion.value.radians = (angleConversion.value.degrees * Math.PI / 180).toFixed(6)
  } else {
    angleConversion.value.degrees = (angleConversion.value.radians * 180 / Math.PI).toFixed(6)
  }
}

const convertTemp = (from) => {
  if (from === 'c') {
    tempConversion.value.fahrenheit = (tempConversion.value.celsius * 9/5 + 32).toFixed(2)
  } else {
    tempConversion.value.celsius = ((tempConversion.value.fahrenheit - 32) * 5/9).toFixed(2)
  }
}
</script>

<style scoped>
.calc-btn {
  @apply px-3 py-2 rounded font-medium transition-all text-sm;
}

.btn-number {
  @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
}

.btn-operator {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}

.btn-function {
  @apply bg-accent text-accent-foreground hover:bg-accent/80;
}

.btn-equals {
  @apply bg-green-500 text-white hover:bg-green-600 col-span-2;
}

.btn-danger {
  @apply bg-destructive text-destructive-foreground hover:bg-destructive/90;
}

.btn-secondary {
  @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
}
</style>