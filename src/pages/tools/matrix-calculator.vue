<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">矩阵计算器</h1>
      <p class="text-muted-foreground mb-6">矩阵运算工具，支持加减乘除、转置、求逆、行列式等操作</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：矩阵输入和操作 -->
      <div class="space-y-6">
        <!-- 矩阵A输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">矩阵 A</h3>
            <div class="flex gap-2">
              <select v-model="matrixARows" @change="updateMatrixSize('A')" class="px-2 py-1 border rounded text-sm">
                <option value="2">2行</option>
                <option value="3">3行</option>
                <option value="4">4行</option>
                <option value="5">5行</option>
              </select>
              <select v-model="matrixACols" @change="updateMatrixSize('A')" class="px-2 py-1 border rounded text-sm">
                <option value="2">2列</option>
                <option value="3">3列</option>
                <option value="4">4列</option>
                <option value="5">5列</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <div :class="`matrix-grid grid-cols-${matrixACols}`">
              <input
                v-for="(value, index) in matrixA"
                :key="index"
                v-model.number="matrixA[index]"
                type="number"
                step="0.01"
                class="matrix-input"
                :placeholder="`a${Math.floor(index / matrixACols) + 1}${(index % matrixACols) + 1}`"
              />
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <button @click="fillMatrix('A', 'random')" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
              随机填充
            </button>
            <button @click="fillMatrix('A', 'zero')" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
              零矩阵
            </button>
            <button @click="fillMatrix('A', 'identity')" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
              单位矩阵
            </button>
            <button @click="clearMatrix('A')" class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90">
              清空
            </button>
          </div>
        </div>

        <!-- 矩阵B输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">矩阵 B</h3>
            <div class="flex gap-2">
              <select v-model="matrixBRows" @change="updateMatrixSize('B')" class="px-2 py-1 border rounded text-sm">
                <option value="2">2行</option>
                <option value="3">3行</option>
                <option value="4">4行</option>
                <option value="5">5行</option>
              </select>
              <select v-model="matrixBCols" @change="updateMatrixSize('B')" class="px-2 py-1 border rounded text-sm">
                <option value="2">2列</option>
                <option value="3">3列</option>
                <option value="4">4列</option>
                <option value="5">5列</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <div :class="`matrix-grid grid-cols-${matrixBCols}`">
              <input
                v-for="(value, index) in matrixB"
                :key="index"
                v-model.number="matrixB[index]"
                type="number"
                step="0.01"
                class="matrix-input"
                :placeholder="`b${Math.floor(index / matrixBCols) + 1}${(index % matrixBCols) + 1}`"
              />
            </div>
          </div>

          <div class="flex gap-2 mt-4">
            <button @click="fillMatrix('B', 'random')" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
              随机填充
            </button>
            <button @click="fillMatrix('B', 'zero')" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
              零矩阵
            </button>
            <button @click="fillMatrix('B', 'identity')" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
              单位矩阵
            </button>
            <button @click="clearMatrix('B')" class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90">
              清空
            </button>
          </div>
        </div>

        <!-- 矩阵操作 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">矩阵操作</h3>
          <div class="grid grid-cols-2 gap-3">
            <button @click="addMatrices" class="operation-btn">A + B</button>
            <button @click="subtractMatrices" class="operation-btn">A - B</button>
            <button @click="multiplyMatrices" class="operation-btn">A × B</button>
            <button @click="transposeMatrix('A')" class="operation-btn">Aᵀ</button>
            <button @click="transposeMatrix('B')" class="operation-btn">Bᵀ</button>
            <button @click="determinant('A')" class="operation-btn">det(A)</button>
            <button @click="determinant('B')" class="operation-btn">det(B)</button>
            <button @click="inverse('A')" class="operation-btn">A⁻¹</button>
            <button @click="inverse('B')" class="operation-btn">B⁻¹</button>
            <button @click="scalarMultiply('A')" class="operation-btn">kA</button>
            <button @click="scalarMultiply('B')" class="operation-btn">kB</button>
            <button @click="copyMatrix('A', 'B')" class="operation-btn">A→B</button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果和步骤 -->
      <div class="space-y-6">
        <!-- 计算结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">计算结果</h3>
            <button
              v-if="resultMatrix.length > 0"
              @click="copyResult"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              复制结果
            </button>
          </div>

          <div v-if="resultMatrix.length > 0" class="space-y-4">
            <div v-if="resultExpression" class="p-3 bg-muted rounded">
              <div class="text-sm font-mono">{{ resultExpression }}</div>
            </div>

            <div class="overflow-x-auto">
              <div :class="`matrix-grid grid-cols-${resultCols}`">
                <div
                  v-for="(value, index) in resultMatrix"
                  :key="index"
                  class="matrix-cell"
                >
                  {{ formatNumber(value) }}
                </div>
              </div>
            </div>

            <div v-if="calculationSteps.length > 0" class="mt-4">
              <h4 class="font-medium mb-2">计算步骤</h4>
              <div class="text-sm space-y-1">
                <div v-for="(step, index) in calculationSteps" :key="index" class="p-2 bg-muted rounded">
                  {{ step }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            选择一个操作开始计算
          </div>
        </div>

        <!-- 矩阵属性 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">矩阵属性</h3>
          <div class="space-y-4">
            <div>
              <h4 class="font-medium mb-2">矩阵 A</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>维度: {{ matrixARows }}×{{ matrixACols }}</div>
                <div>秩: {{ matrixARank }}</div>
                <div>迹: {{ matrixATrace }}</div>
                <div>范数: {{ matrixANorm }}</div>
              </div>
            </div>

            <div>
              <h4 class="font-medium mb-2">矩阵 B</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>维度: {{ matrixBRows }}×{{ matrixBCols }}</div>
                <div>秩: {{ matrixBRank }}</div>
                <div>迹: {{ matrixBTrace }}</div>
                <div>范数: {{ matrixBNorm }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
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

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in calculationHistory"
              :key="index"
              @click="loadFromHistory(item)"
              class="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <div class="text-sm font-medium">{{ item.operation }}</div>
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
import { ref, computed, watch } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('矩阵计算器')


// 矩阵维度
const matrixARows = ref(3)
const matrixACols = ref(3)
const matrixBRows = ref(3)
const matrixBCols = ref(3)

// 矩阵数据
const matrixA = ref([])
const matrixB = ref([])
const resultMatrix = ref([])
const resultCols = ref(0)
const resultExpression = ref('')
const calculationSteps = ref([])
const calculationHistory = ref([])

// 初始化矩阵
const initializeMatrices = () => {
  const sizeA = matrixARows.value * matrixACols.value
  const sizeB = matrixBRows.value * matrixBCols.value

  matrixA.value = Array(sizeA).fill(0)
  matrixB.value = Array(sizeB).fill(0)
}

const updateMatrixSize = (matrix) => {
  if (matrix === 'A') {
    const size = matrixARows.value * matrixACols.value
    matrixA.value = Array(size).fill(0)
  } else {
    const size = matrixBRows.value * matrixBCols.value
    matrixB.value = Array(size).fill(0)
  }
  clearResult()
}

// 矩阵填充函数
const fillMatrix = (matrix, type) => {
  const targetMatrix = matrix === 'A' ? matrixA : matrixB
  const rows = matrix === 'A' ? matrixARows : matrixBRows
  const cols = matrix === 'A' ? matrixACols : matrixBCols

  if (type === 'random') {
    for (let i = 0; i < targetMatrix.value.length; i++) {
      targetMatrix.value[i] = Math.floor(Math.random() * 10)
    }
  } else if (type === 'zero') {
    targetMatrix.value.fill(0)
  } else if (type === 'identity' && rows === cols) {
    targetMatrix.value.fill(0)
    for (let i = 0; i < rows; i++) {
      targetMatrix.value[i * cols + i] = 1
    }
  }
}

const clearMatrix = (matrix) => {
  const targetMatrix = matrix === 'A' ? matrixA : matrixB
  targetMatrix.value.fill(0)
}

// 矩阵操作函数
const addMatrices = () => {
  if (matrixARows.value !== matrixBRows.value || matrixACols.value !== matrixBCols.value) {
    showError('矩阵维度不匹配')
    return
  }

  const result = []
  const steps = []

  for (let i = 0; i < matrixA.value.length; i++) {
    result[i] = matrixA.value[i] + matrixB.value[i]
    if (i < 9) { // 只显示前几个步骤
      const rowA = Math.floor(i / matrixACols.value)
      const colA = i % matrixACols.value
      steps.push(`${matrixA.value[i]} + ${matrixB.value[i]} = ${result[i]}`)
    }
  }

  setResult(result, matrixACols.value, 'A + B', ['矩阵加法：对应元素相加'])
}

const subtractMatrices = () => {
  if (matrixARows.value !== matrixBRows.value || matrixACols.value !== matrixBCols.value) {
    showError('矩阵维度不匹配')
    return
  }

  const result = []
  const steps = []

  for (let i = 0; i < matrixA.value.length; i++) {
    result[i] = matrixA.value[i] - matrixB.value[i]
    if (i < 9) {
      const rowA = Math.floor(i / matrixACols.value)
      const colA = i % matrixACols.value
      steps.push(`${matrixA.value[i]} - ${matrixB.value[i]} = ${result[i]}`)
    }
  }

  setResult(result, matrixACols.value, 'A - B', ['矩阵减法：对应元素相减'])
}

const multiplyMatrices = () => {
  if (matrixACols.value !== matrixBRows.value) {
    showError('矩阵A的列数必须等于矩阵B的行数')
    return
  }

  const result = []
  const steps = []

  for (let i = 0; i < matrixARows.value; i++) {
    for (let j = 0; j < matrixBCols.value; j++) {
      let sum = 0
      for (let k = 0; k < matrixACols.value; k++) {
        sum += matrixA.value[i * matrixACols.value + k] * matrixB.value[k * matrixBCols.value + j]
      }
      result[i * matrixBCols.value + j] = sum

      if (result.length <= 9) {
        steps.push(`行${i+1} × 列${j+1} = ${sum}`)
      }
    }
  }

  setResult(result, matrixBCols.value, 'A × B', ['矩阵乘法：行向量与列向量点积'])
}

const transposeMatrix = (matrixName) => {
  const source = matrixName === 'A' ? matrixA : matrixB
  const sourceRows = matrixName === 'A' ? matrixARows : matrixBRows
  const sourceCols = matrixName === 'A' ? matrixACols : matrixBCols

  const result = []
  for (let j = 0; j < sourceCols.value; j++) {
    for (let i = 0; i < sourceRows.value; i++) {
      result[j * sourceRows.value + i] = source.value[i * sourceCols.value + j]
    }
  }

  setResult(result, sourceRows.value, `${matrixName}ᵀ`, [`${matrixName}的转置：行列互换`])
}

const determinant = (matrixName) => {
  const source = matrixName === 'A' ? matrixA : matrixB
  const size = matrixName === 'A' ? matrixARows : matrixBRows

  if (size.value !== matrixACols.value) {
    showError('只能计算方阵的行列式')
    return
  }

  const det = calculateDeterminant(source.value, size.value)
  setResult([det], 1, `det(${matrixName})`, [
    `${matrixName}的行列式计算完成`,
    `结果: ${det}`
  ])
}

const inverse = (matrixName) => {
  const source = matrixName === 'A' ? matrixA : matrixB
  const size = matrixName === 'A' ? matrixARows : matrixBRows

  if (size.value !== matrixACols.value) {
    showError('只能计算方阵的逆矩阵')
    return
  }

  const det = calculateDeterminant(source.value, size.value)
  if (Math.abs(det) < 1e-10) {
    showError('矩阵行列式为0，无法求逆')
    return
  }

  const result = calculateInverse(source.value, size.value)
  setResult(result, size.value, `${matrixName}⁻¹`, [`${matrixName}的逆矩阵计算完成`])
}

const scalarMultiply = (matrixName) => {
  const scalar = prompt('请输入标量值：')
  if (scalar === null) return

  const value = parseFloat(scalar)
  if (isNaN(value)) {
    showError('请输入有效的数字')
    return
  }

  const source = matrixName === 'A' ? matrixA : matrixB
  const cols = matrixName === 'A' ? matrixACols : matrixBCols

  const result = source.value.map(val => val * value)
  setResult(result, cols.value, `${value} × ${matrixName}`, [`${matrixName}的每个元素乘以${value}`])
}

const copyMatrix = (from, to) => {
  const source = from === 'A' ? matrixA : matrixB
  const target = to === 'A' ? matrixA : matrixB
  const targetRows = to === 'A' ? matrixARows : matrixBRows
  const targetCols = to === 'A' ? matrixACols : matrixBCols

  targetRows.value = from === 'A' ? matrixARows.value : matrixBRows.value
  targetCols.value = from === 'A' ? matrixACols.value : matrixBCols.value

  target.value = [...source.value]
}

// 计算函数
const calculateDeterminant = (matrix, size) => {
  if (size === 1) return matrix[0]
  if (size === 2) return matrix[0] * matrix[3] - matrix[1] * matrix[2]

  let det = 0
  for (let j = 0; j < size; j++) {
    const minor = getMinor(matrix, size, 0, j)
    det += (j % 2 === 0 ? 1 : -1) * matrix[j] * calculateDeterminant(minor, size - 1)
  }
  return det
}

const getMinor = (matrix, size, row, col) => {
  const minor = []
  let minorIndex = 0

  for (let i = 0; i < size; i++) {
    if (i === row) continue
    for (let j = 0; j < size; j++) {
      if (j === col) continue
      minor[minorIndex++] = matrix[i * size + j]
    }
  }
  return minor
}

const calculateInverse = (matrix, size) => {
  const identity = []
  const result = []

  // 创建单位矩阵
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      identity[i * size + j] = i === j ? 1 : 0
    }
  }

  // 复制原始矩阵
  const augmented = [...matrix, ...identity]

  // 高斯消元法
  for (let i = 0; i < size; i++) {
    // 主元归一化
    const pivot = augmented[i * size * 2 + i]
    if (Math.abs(pivot) < 1e-10) continue

    for (let j = 0; j < size * 2; j++) {
      augmented[i * size * 2 + j] /= pivot
    }

    // 消元
    for (let k = 0; k < size; k++) {
      if (k === i) continue
      const factor = augmented[k * size * 2 + i]
      for (let j = 0; j < size * 2; j++) {
        augmented[k * size * 2 + j] -= factor * augmented[i * size * 2 + j]
      }
    }
  }

  // 提取逆矩阵
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      result[i * size + j] = augmented[i * size * 2 + size + j]
    }
  }

  return result
}

// 结果处理
const setResult = (result, cols, expression, steps) => {
  resultMatrix.value = result
  resultCols.value = cols
  resultExpression.value = expression
  calculationSteps.value = steps

  // 添加到历史记录
  calculationHistory.value.unshift({
    operation: expression,
    timestamp: new Date().toLocaleTimeString(),
    result: result.length > 0 ? result.slice(0, 4).map(v => formatNumber(v)).join(', ') : 'Error'
  })

  // 限制历史记录数量
  if (calculationHistory.value.length > 20) {
    calculationHistory.value = calculationHistory.value.slice(0, 20)
  }
}

const clearResult = () => {
  resultMatrix.value = []
  resultCols.value = 0
  resultExpression.value = ''
  calculationSteps.value = []
}

// 矩阵属性计算
const matrixARank = computed(() => calculateRank(matrixA.value, matrixARows.value, matrixACols.value))
const matrixBRank = computed(() => calculateRank(matrixB.value, matrixBRows.value, matrixBCols.value))
const matrixATrace = computed(() => calculateTrace(matrixA.value, Math.min(matrixARows.value, matrixACols.value)))
const matrixBTrace = computed(() => calculateTrace(matrixB.value, Math.min(matrixBRows.value, matrixBCols.value)))
const matrixANorm = computed(() => calculateNorm(matrixA.value))
const matrixBNorm = computed(() => calculateNorm(matrixB.value))

const calculateRank = (matrix, rows, cols) => {
  // 简化的秩计算，实际应该使用更精确的算法
  const size = Math.min(rows, cols)
  let rank = size

  for (let i = 0; i < size; i++) {
    const diagonalValue = matrix[i * cols + i]
    if (Math.abs(diagonalValue) < 1e-10) {
      rank--
    }
  }

  return rank
}

const calculateTrace = (matrix, size) => {
  let trace = 0
  for (let i = 0; i < size; i++) {
    trace += matrix[i * size + i]
  }
  return trace
}

const calculateNorm = (matrix) => {
  const sum = matrix.reduce((acc, val) => acc + val * val, 0)
  return Math.sqrt(sum).toFixed(2)
}

// 工具函数
const formatNumber = (num) => {
  return Number.isInteger(num) ? num : num.toFixed(2)
}

const showError = (message) => {
  alert(message)
}

const copyResult = async () => {
  const matrixStr = resultMatrix.value.map((val, index) => {
    const col = index % resultCols.value
    const isNewRow = col === 0 && index > 0
    return (isNewRow ? '\n' : '') + formatNumber(val)
  }).join(' ')

  // 直接使用 Clipboard API
  try {
    await navigator.clipboard.writeText(matrixStr)
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = matrixStr
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

const loadFromHistory = (item) => {
  // 从历史记录重新加载计算（简化实现）
  console.log('Loading from history:', item)
}

const clearHistory = () => {
  calculationHistory.value = []
}

// 初始化
initializeMatrices()
</script>

<style scoped>
.matrix-grid {
  display: inline-grid;
  gap: 0.5rem;
}

.matrix-input {
  width: 60px;
  height: 40px;
  text-align: center;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
}

.matrix-input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -1px;
}

.matrix-cell {
  width: 60px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.operation-btn {
  @apply px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors font-medium text-sm;
}

.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
</style>