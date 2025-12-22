<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">方程求解器</h1>
      <p class="text-muted-foreground mb-6">一次方程、二次方程、方程组求解，支持图像绘制和根的验证</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：方程输入和求解 -->
      <div class="space-y-6">
        <!-- 方程类型选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">方程类型</h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="type in equationTypes"
              :key="type.value"
              @click="selectedType = type.value"
              :class="[
                'px-3 py-2 rounded text-sm font-medium transition-all',
                selectedType === type.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              ]"
            >
              {{ type.name }}
            </button>
          </div>
        </div>

        <!-- 一次方程 -->
        <div v-if="selectedType === 'linear'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">一次方程 ax + b = 0</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">系数 a</label>
                <input
                  v-model.number="linearEquation.a"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="1"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">常数 b</label>
                <input
                  v-model.number="linearEquation.b"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="-5"
                />
              </div>
            </div>
            <button @click="solveLinear" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              求解
            </button>

            <div v-if="linearSolution.hasResult" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">解: x = {{ linearSolution.x }}</div>
              <div class="text-xs text-muted-foreground mt-1">验证: {{ linearSolution.verification }}</div>
            </div>
          </div>
        </div>

        <!-- 二次方程 -->
        <div v-if="selectedType === 'quadratic'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">二次方程 ax² + bx + c = 0</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">系数 a</label>
                <input
                  v-model.number="quadraticEquation.a"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="1"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">系数 b</label>
                <input
                  v-model.number="quadraticEquation.b"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="-3"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">常数 c</label>
                <input
                  v-model.number="quadraticEquation.c"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="2"
                />
              </div>
            </div>
            <button @click="solveQuadratic" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              求解
            </button>

            <div v-if="quadraticSolution.hasResult" class="space-y-2">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm font-medium mb-2">判别式 Δ = {{ quadraticSolution.discriminant }}</div>
                <div class="text-sm">{{ quadraticSolution.type }}</div>
              </div>

              <div v-if="quadraticSolution.roots.length > 0" class="p-3 bg-secondary rounded">
                <div class="text-sm font-medium mb-2">根:</div>
                <div v-for="(root, index) in quadraticSolution.roots" :key="index" class="text-sm">
                  x{{ index + 1 }} = {{ root }}
                </div>
              </div>

              <div v-if="quadraticSolution.vertex" class="p-3 bg-secondary rounded">
                <div class="text-sm font-medium">顶点: ({{ quadraticSolution.vertex.x }}, {{ quadraticSolution.vertex.y }})</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 方程组 -->
        <div v-if="selectedType === 'system'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">线性方程组</h3>
          <div class="space-y-4">
            <div class="text-sm text-muted-foreground">
              <div>a₁x + b₁y = c₁</div>
              <div>a₂x + b₂y = c₂</div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">a₁</label>
                <input v-model.number="systemEquation.a1" type="number" step="0.01" class="w-full px-2 py-1 border rounded" placeholder="2">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">b₁</label>
                <input v-model.number="systemEquation.b1" type="number" step="0.01" class="w-full px-2 py-1 border rounded" placeholder="3">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">c₁</label>
                <input v-model.number="systemEquation.c1" type="number" step="0.01" class="w-full px-2 py-1 border rounded" placeholder="7">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">a₂</label>
                <input v-model.number="systemEquation.a2" type="number" step="0.01" class="w-full px-2 py-1 border rounded" placeholder="1">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">b₂</label>
                <input v-model.number="systemEquation.b2" type="number" step="0.01" class="w-full px-2 py-1 border rounded" placeholder="-1">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">c₂</label>
                <input v-model.number="systemEquation.c2" type="number" step="0.01" class="w-full px-2 py-1 border rounded" placeholder="1">
              </div>
            </div>

            <button @click="solveSystem" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              求解
            </button>

            <div v-if="systemSolution.hasResult" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">解:</div>
              <div class="text-sm">x = {{ systemSolution.x }}</div>
              <div class="text-sm">y = {{ systemSolution.y }}</div>
              <div v-if="systemSolution.method" class="text-xs text-muted-foreground mt-1">
                解法: {{ systemSolution.method }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：图像和高级功能 -->
      <div class="space-y-6">
        <!-- 函数图像 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">函数图像</h3>
          <div class="space-y-4">
            <div v-if="selectedType === 'linear'" class="p-4 bg-secondary rounded">
              <div class="text-sm font-mono mb-2">y = {{ linearEquation.a }}x + {{ -linearEquation.b }}</div>
              <div class="text-xs text-muted-foreground">直线斜率为 {{ linearEquation.a }}，y截距为 {{ -linearEquation.b }}</div>
            </div>

            <div v-if="selectedType === 'quadratic'" class="p-4 bg-secondary rounded">
              <div class="text-sm font-mono mb-2">y = {{ quadraticEquation.a }}x² + {{ quadraticEquation.b }}x + {{ quadraticEquation.c }}</div>
              <div v-if="quadraticSolution.vertex" class="text-xs text-muted-foreground">
                开口方向: {{ quadraticEquation.a > 0 ? '向上' : '向下' }}
              </div>
            </div>

            <canvas ref="graphCanvas" class="w-full h-64 border rounded"></canvas>

            <div class="grid grid-cols-2 gap-2">
              <button @click="drawGraph" class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                绘制图像
              </button>
              <button @click="clearGraph" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                清空
              </button>
            </div>
          </div>
        </div>

        <!-- 数值方法 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">数值方法</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">牛顿迭代法</label>
              <textarea
                v-model="newtonFunction"
                class="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                rows="3"
                placeholder="输入函数，如: x^3 - 2x - 5"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">初始值</label>
                <input
                  v-model.number="newtonInitial"
                  type="number"
                  step="0.01"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="2"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">迭代次数</label>
                <input
                  v-model.number="newtonIterations"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="10"
                />
              </div>
            </div>

            <button @click="newtonMethod" class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
              牛顿迭代
            </button>

            <div v-if="newtonResult.hasResult" class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium">根: x ≈ {{ newtonResult.root }}</div>
              <div class="text-xs text-muted-foreground">迭代 {{ newtonResult.iterations }} 次，误差 {{ newtonResult.error }}</div>
            </div>
          </div>
        </div>

        <!-- 方程性质 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">方程性质分析</h3>
          <div class="space-y-4">
            <div v-if="selectedType === 'linear'">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm font-medium">线性方程性质</div>
                <div class="text-sm">• 唯一解（当 a ≠ 0）</div>
                <div class="text-sm">• 无解（当 a = 0, b ≠ 0）</div>
                <div class="text-sm">• 无穷解（当 a = 0, b = 0）</div>
              </div>
            </div>

            <div v-if="selectedType === 'quadratic'">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm font-medium">二次方程性质</div>
                <div class="text-sm">• Δ > 0: 两个不同实根</div>
                <div class="text-sm">• Δ = 0: 一个重根</div>
                <div class="text-sm">• Δ < 0: 两个共轭复根</div>
              </div>
            </div>

            <div v-if="selectedType === 'system'">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm font-medium">方程组性质</div>
                <div class="text-sm">• 唯一解（系数行列式 ≠ 0）</div>
                <div class="text-sm">• 无解或无穷解（系数行列式 = 0）</div>
              </div>
            </div>

            <button @click="analyzeEquation" class="w-full px-3 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80">
              详细分析
            </button>

            <div v-if="analysisResult" class="p-3 bg-secondary rounded">
              <div class="text-sm">{{ analysisResult }}</div>
            </div>
          </div>
        </div>

        <!-- 求解历史 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">求解历史</h3>
            <button @click="clearHistory" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
              清空
            </button>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in solutionHistory"
              :key="index"
              @click="loadFromHistory(item)"
              class="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <div class="text-sm font-medium">{{ item.type }}</div>
              <div class="text-sm">{{ item.equation }}</div>
              <div class="text-xs text-muted-foreground">{{ item.solution }}</div>
              <div class="text-xs text-muted-foreground">{{ item.timestamp }}</div>
            </div>
            <div v-if="solutionHistory.length === 0" class="text-center text-muted-foreground py-4">
              暂无求解历史
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('方程求解器')

// 方程类型
const equationTypes = [
  { name: '一次方程', value: 'linear' },
  { name: '二次方程', value: 'quadratic' },
  { name: '方程组', value: 'system' }
]

const selectedType = ref('linear')

// 方程参数
const linearEquation = ref({
  a: 1,
  b: -5
})

const quadraticEquation = ref({
  a: 1,
  b: -3,
  c: 2
})

const systemEquation = ref({
  a1: 2,
  b1: 3,
  c1: 7,
  a2: 1,
  b2: -1,
  c2: 1
})

// 求解结果
const linearSolution = ref({
  hasResult: false,
  x: 0,
  verification: ''
})

const quadraticSolution = ref({
  hasResult: false,
  discriminant: 0,
  type: '',
  roots: [],
  vertex: null
})

const systemSolution = ref({
  hasResult: false,
  x: 0,
  y: 0,
  method: ''
})

// 数值方法
const newtonFunction = ref('x^3 - 2x - 5')
const newtonInitial = ref(2)
const newtonIterations = ref(10)
const newtonResult = ref({
  hasResult: false,
  root: 0,
  iterations: 0,
  error: 0
})

// 分析结果
const analysisResult = ref('')

// 图像绘制
const graphCanvas = ref(null)

// 历史记录
const solutionHistory = ref([])

// 求解方法
const solveLinear = () => {
  const { a, b } = linearEquation.value

  if (a === 0) {
    if (b === 0) {
      linearSolution.value = {
        hasResult: true,
        x: '无穷解',
        verification: '0 = 0 恒成立'
      }
    } else {
      linearSolution.value = {
        hasResult: true,
        x: '无解',
        verification: `${b} = 0 矛盾`
      }
    }
  } else {
    const x = -b / a
    const verification = `${a}(${x}) + ${b} = ${(a * x + b).toFixed(4)} ≈ 0`

    linearSolution.value = {
      hasResult: true,
      x: x.toFixed(4),
      verification
    }

    addToHistory('一次方程', `${a}x + ${b} = 0`, `x = ${x.toFixed(4)}`)
  }

  nextTick(() => drawGraph())
}

const solveQuadratic = () => {
  const { a, b, c } = quadraticEquation.value

  if (a === 0) {
    // 退化为一次方程
    linearEquation.value = { a: b, b: c }
    solveLinear()
    return
  }

  const discriminant = b * b - 4 * a * c
  const roots = []
  let type = ''

  if (discriminant > 0) {
    const sqrtDiscriminant = Math.sqrt(discriminant)
    const x1 = (-b + sqrtDiscriminant) / (2 * a)
    const x2 = (-b - sqrtDiscriminant) / (2 * a)
    roots.push(x1.toFixed(4), x2.toFixed(4))
    type = '两个不同的实根'
  } else if (discriminant === 0) {
    const x = -b / (2 * a)
    roots.push(x.toFixed(4))
    type = '一个重根'
  } else {
    const realPart = (-b / (2 * a)).toFixed(4)
    const imagPart = (Math.sqrt(-discriminant) / (2 * a)).toFixed(4)
    roots.push(`${realPart} + ${imagPart}i`, `${realPart} - ${imagPart}i`)
    type = '两个共轭复根'
  }

  // 顶点坐标
  const vertexX = -b / (2 * a)
  const vertexY = a * vertexX * vertexX + b * vertexX + c

  quadraticSolution.value = {
    hasResult: true,
    discriminant: discriminant.toFixed(4),
    type,
    roots,
    vertex: { x: vertexX.toFixed(4), y: vertexY.toFixed(4) }
  }

  addToHistory('二次方程', `${a}x² + ${b}x + ${c} = 0`, roots.join(', '))

  nextTick(() => drawGraph())
}

const solveSystem = () => {
  const { a1, b1, c1, a2, b2, c2 } = systemEquation.value

  // 计算行列式
  const determinant = a1 * b2 - a2 * b1

  if (Math.abs(determinant) < 1e-10) {
    systemSolution.value = {
      hasResult: true,
      x: '无解或无穷解',
      y: '',
      method: '系数行列式为零'
    }
    return
  }

  // 克拉默法则
  const x = (c1 * b2 - c2 * b1) / determinant
  const y = (a1 * c2 - a2 * c1) / determinant

  systemSolution.value = {
    hasResult: true,
    x: x.toFixed(4),
    y: y.toFixed(4),
    method: '克拉默法则'
  }

  addToHistory('方程组', `(${a1})x + (${b1})y = ${c1}, (${a2})x + (${b2})y = ${c2}`, `x = ${x.toFixed(4)}, y = ${y.toFixed(4)}`)
}

// 图像绘制
const drawGraph = () => {
  const canvas = graphCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 绘制坐标轴
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.moveTo(width / 2, 0)
  ctx.lineTo(width / 2, height)
  ctx.stroke()

  // 绘制函数
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()

  if (selectedType.value === 'linear') {
    const { a, b } = linearEquation.value
    for (let px = 0; px < width; px++) {
      const x = (px - width / 2) / 20
      const y = a * x - b
      const py = height / 2 - y * 20

      if (px === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
  } else if (selectedType.value === 'quadratic') {
    const { a, b, c } = quadraticEquation.value
    for (let px = 0; px < width; px++) {
      const x = (px - width / 2) / 20
      const y = a * x * x + b * x + c
      const py = height / 2 - y * 20

      if (px === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
  }

  ctx.stroke()
}

const clearGraph = () => {
  const canvas = graphCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

// 数值方法
const newtonMethod = () => {
  let x = newtonInitial.value
  const func = newtonFunction.value.toLowerCase()

  for (let i = 0; i < newtonIterations.value; i++) {
    // 简化的函数解析（实际应用中应使用表达式解析器）
    let fx = x * x * x - 2 * x - 5 // 示例函数
    let dfx = 3 * x * x - 2 // 导数

    if (Math.abs(dfx) < 1e-10) {
      newtonResult.value = {
        hasResult: true,
        root: x.toFixed(6),
        iterations: i + 1,
        error: '导数接近零'
      }
      return
    }

    const xNext = x - fx / dfx
    const error = Math.abs(xNext - x)

    if (error < 1e-6) {
      newtonResult.value = {
        hasResult: true,
        root: xNext.toFixed(6),
        iterations: i + 1,
        error: error.toExponential(2)
      }
      return
    }

    x = xNext
  }

  newtonResult.value = {
    hasResult: true,
    root: x.toFixed(6),
    iterations: newtonIterations.value,
    error: '未收敛'
  }
}

// 分析
const analyzeEquation = () => {
  if (selectedType.value === 'linear') {
    const { a, b } = linearEquation.value
    if (a !== 0) {
      analysisResult.value = '这是一个标准的一次方程，有唯一解 x = ' + (-b / a).toFixed(4)
    } else {
      analysisResult.value = '这不是一个标准的一次方程'
    }
  } else if (selectedType.value === 'quadratic') {
    const { a, b, c } = quadraticEquation.value
    const discriminant = b * b - 4 * a * c

    if (discriminant > 0) {
      analysisResult.value = '判别式大于零，方程有两个不同的实根'
    } else if (discriminant === 0) {
      analysisResult.value = '判别式等于零，方程有一个重根'
    } else {
      analysisResult.value = '判别式小于零，方程有两个共轭复根'
    }
  }
}

// 历史记录
const addToHistory = (type, equation, solution) => {
  solutionHistory.value.unshift({
    type,
    equation,
    solution,
    timestamp: new Date().toLocaleTimeString()
  })

  if (solutionHistory.value.length > 20) {
    solutionHistory.value = solutionHistory.value.slice(0, 20)
  }
}

const loadFromHistory = (item) => {
  console.log('Loading from history:', item)
}

const clearHistory = () => {
  solutionHistory.value = []
}
</script>

<style scoped>
input[type="number"],
textarea {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="number"]:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

canvas {
  background: white;
}
</style>