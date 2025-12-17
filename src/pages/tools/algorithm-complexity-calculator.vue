<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">算法复杂度计算器</h1>
      <p class="text-muted-foreground mb-4">分析算法时间复杂度和空间复杂度，提供优化建议</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧代码输入 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 代码编辑器 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">算法代码</h3>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                加载示例
              </button>
              <button
                @click="clearCode"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="code"
            @input="analyzeComplexity"
            class="w-full h-64 p-3 font-mono text-sm border rounded-md resize-none"
            placeholder="输入算法代码，例如:
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}"
          ></textarea>

          <div class="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>行数: {{ code.split('\n').length }} | 字符数: {{ code.length }}</span>
          </div>
        </div>

        <!-- 算法配置 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">算法参数</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">算法类型</label>
              <select v-model="algorithmType" @change="analyzeComplexity" class="w-full px-3 py-2 border rounded-md">
                <option value="search">搜索算法</option>
                <option value="sort">排序算法</option>
                <option value="recursive">递归算法</option>
                <option value="iterative">迭代算法</option>
                <option value="dp">动态规划</option>
                <option value="graph">图算法</option>
                <option value="tree">树算法</option>
                <option value="array">数组操作</option>
                <option value="string">字符串处理</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">输入规模</label>
              <div class="flex gap-2">
                <input
                  v-model="inputSize.n"
                  type="number"
                  placeholder="n"
                  class="flex-1 px-2 py-1 border rounded text-sm"
                >
                <input
                  v-model="inputSize.m"
                  type="number"
                  placeholder="m"
                  class="flex-1 px-2 py-1 border rounded text-sm"
                >
              </div>
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium mb-2">关键变量识别</label>
            <div class="flex gap-2">
              <input
                v-model="inputVariables"
                placeholder="变量名,用逗号分隔 (如: n, m, arr)"
                class="w-full px-3 py-2 border rounded-md text-sm"
                @input="analyzeComplexity"
              >
            </div>
          </div>
        </div>

        <!-- 可视化图表 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">复杂度可视化</h3>
          <div class="mb-4">
            <canvas ref="chartCanvas" width="600" height="300" class="w-full border rounded"></canvas>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="showTimeComplexity"
                  @change="drawChart"
                  class="rounded"
                >
                <span>时间复杂度</span>
              </label>
            </div>
            <div>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="showSpaceComplexity"
                  @change="drawChart"
                  class="rounded"
                >
                <span>空间复杂度</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 对比分析 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">算法对比</h3>
            <button
              @click="addComparison"
              class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              添加对比
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(algo, index) in comparisons"
              :key="index"
              class="flex items-center justify-between p-2 border rounded"
            >
              <span class="text-sm font-medium">{{ algo.name }}</span>
              <div class="flex gap-4 text-xs">
                <span class="text-blue-600">O({{algo.timeComplexity }})</span>
                <span class="text-green-600">O({{algo.spaceComplexity }})</span>
                <button
                  @click="removeComparison(index)"
                  class="text-destructive hover:text-destructive/800"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧分析和建议 -->
      <div class="space-y-6">
        <!-- 复杂度分析结果 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">复杂度分析</h3>

          <!-- 时间复杂度 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-sm">时间复杂度</span>
              <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono">
                O({{ timeComplexity }})
              </span>
            </div>
            <div class="text-xs text-muted-foreground">
              {{ getTimeComplexityDescription(timeComplexity) }}
            </div>
            <div class="mt-2">
              <div class="flex items-center gap-2 text-xs">
                <span>n=1000:</span>
                <span class="font-mono">{{ calculateOperations(timeComplexity, 1000) }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span>n=10000:</span>
                <span class="font-mono">{{ calculateOperations(timeComplexity, 10000) }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span>n=100000:</span>
                <span class="font-mono">{{ calculateOperations(timeComplexity, 100000) }}</span>
              </div>
            </div>
          </div>

          <!-- 空间复杂度 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-sm">空间复杂度</span>
              <span class="px-2 py-1 bg-success/10 text-success rounded text-xs font-mono">
                O({{ spaceComplexity }})
              </span>
            </div>
            <div class="text-xs text-muted-foreground">
              {{ getSpaceComplexityDescription(spaceComplexity) }}
            </div>
            <div class="mt-2">
              <div class="flex items-center gap-2 text-xs">
                <span>n=1000:</span>
                <span class="font-mono">{{ calculateMemory(spaceComplexity, 1000) }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span>n=10000:</span>
                <span class="font-mono">{{ calculateMemory(spaceComplexity, 10000) }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs">
                <span>n=100000:</span>
                <span class="font-mono">{{ calculateMemory(spaceComplexity, 100000) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 性能建议 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">性能建议</h3>
          <div class="space-y-3">
            <div
              v-for="suggestion in suggestions"
              :key="suggestion.id"
              class="p-2 border rounded"
              :class="getSuggestionClass(suggestion.priority)"
            >
              <div class="flex items-start gap-2">
                <div class="flex-shrink-0 mt-1">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="getSuggestionIcon(suggestion.priority)"
                  ></div>
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ suggestion.title }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ suggestion.description }}</div>
                  <div v-if="suggestion.code" class="mt-2">
                    <pre class="text-xs bg-muted p-2 rounded overflow-x-auto"><code>{{ suggestion.code }}</code></pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 常见复杂度参考 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">复杂度参考表</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">复杂度</th>
                  <th class="text-left p-2">说明</th>
                  <th class="text-left p-2">n=10³</th>
                  <th class="text-left p-2">n=10⁶</th>
                  <th class="text-left p-2">n=10⁹</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in complexityReference" :key="item.complexity" class="border-b">
                  <td class="p-2 font-mono text-xs">{{ item.complexity }}</td>
                  <td class="p-2 text-xs">{{ item.description }}</td>
                  <td class="p-2 text-xs">{{ item.n1000 }}</td>
                  <td class="p-2 text-xs">{{ item.n10000 }}</td>
                  <td class="p-2 text-xs">{{ item.n100000 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 优化策略 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">优化策略</h3>
          <div class="space-y-3 text-sm">
            <div class="p-2 rounded">
              <strong class="text-blue-800">📈 时间优化:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>使用更高效的算法和数据结构</li>
                <li>减少不必要的循环嵌套</li>
                <li>避免重复计算，使用缓存</li>
                <li>选择合适的搜索策略</li>
              </ul>
            </div>

            <div class="p-2 rounded">
              <strong class="text-green-800">💾 空间优化:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>避免不必要的数据复制</li>
                <li>使用原地算法减少内存分配</li>
                <li>及时释放不需要的变量</li>
                <li>选择合适的数据结构大小</li>
              </ul>
            </div>

            <div class="p-2 rounded">
              <strong class="text-yellow-800">⚡ 综合优化:</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>权衡时间和空间复杂度</li>
                <li>根据实际问题选择合适的算法</li>
                <li>考虑硬件特性和缓存效果</li>
                <li>使用预处理和并行计算</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('算法复杂度计算器 - 算法性能分析工具')

// 数据
const code = ref('')
const algorithmType = ref('custom')
const inputSize = ref({ n: 100, m: 100 })
const inputVariables = ref('arr, target, i, j')
const timeComplexity = ref('n')
const spaceComplexity = ref('1')
const suggestions = ref([])
const comparisons = ref([])
const showTimeComplexity = ref(true)
const showSpaceComplexity = ref(true)

const chartCanvas = ref(null)

// 复杂度参考表
const complexityReference = [
  {
    complexity: 'O(1)',
    description: '常数时间',
    n1000: '1',
    n10000: '1',
    n100000: '1'
  },
  {
    complexity: 'O(log n)',
    description: '对数时间',
    n1000: '10',
    n10000: '13',
    n100000: '17'
  },
  {
    complexity: 'O(n)',
    description: '线性时间',
    n1000: '1K',
    n10000: '10K',
    n100000: '100K'
  },
  {
    complexity: 'O(n log n)',
    description: '线性对数时间',
    n1000: '10K',
    n10000: '130K',
    n100000: '1.7M'
  },
  {
    complexity: 'O(n²)',
    description: '平方时间',
    n1000: '1M',
    n10000: '100M',
    n100000: '10B'
  },
  {
    complexity: 'O(n³)',
    description: '立方时间',
    n1000: '1B',
    n10000: '1T',
    n100000: '1000T'
  },
  {
    complexity: 'O(2ⁿ)',
    description: '指数时间',
    n1000: '∞',
    n10000: '∞',
    n100000: '∞'
  },
  {
    complexity: 'O(n!)',
    description: '阶乘时间',
    n1000: '∞',
    n10000: '∞',
    n100000: '∞'
  }
]

// 计算属性
const getSuggestionClass = (priority) => {
  const classes = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50'
  }
  return classes[priority] || classes.low
}

const getSuggestionIcon = (priority) => {
  const colors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  }
  return colors[priority] || colors.low
}

// 方法
const getTimeComplexityDescription = (complexity) => {
  const descriptions = {
    '1': '执行时间恒定，不随输入规模变化',
    'log n': '执行时间与输入规模的对数成正比',
    'n': '执行时间与输入规模线性增长',
    'n log n': '执行时间介于线性和二次之间',
    'n²': '执行时间与输入规模的平方成正比',
    'n³': '执行时间与输入规模的立方成正比',
    '2ⁿ': '执行时间随输入规模指数增长',
    'n!': '执行时间与输入规模的阶乘成正比'
  }
  return descriptions[complexity] || '复杂度需要进一步分析'
}

const getSpaceComplexityDescription = (complexity) => {
  const descriptions = {
    '1': '空间使用恒定，不随输入规模变化',
    'n': '空间使用与输入规模线性增长',
    'n²': '空间使用与输入规模的平方成正比',
    'n log n': '空间使用介于线性和二次之间'
  }
  return descriptions[complexity] || '空间复杂度需要进一步分析'
}

const calculateOperations = (complexity, n) => {
  try {
    const ops = complexity.replace(/\s+/g, '')

    if (ops === '1') return '1'
    if (ops === 'n') return n.toString()
    if (ops === 'logn') return Math.ceil(Math.log2(n)).toString()
    if (ops === 'nlogn') return Math.ceil(n * Math.log2(n)).toString()
    if (ops === 'n²' || ops === 'n2') return (n * n).toString()
    if (ops === 'n³' || ops === 'n3') return (n * n * n).toString()
    if (ops === '2ⁿ' || ops === '2n') return n > 50 ? '∞' : Math.pow(2, n).toExponential(2)
    if (ops === 'n!') return n > 20 ? '∞' : factorial(n).toExponential(2)

    return '复杂'
  } catch (e) {
      return '错误'
    }
}

// 添加阶乘函数
const factorial = (n) => {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

const calculateMemory = (complexity, n) => {
  return calculateOperations(complexity, n)
}

const loadExample = () => {
  code.value = `// 线性搜索 - O(n)
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}

// 测试不同规模
console.log(linearSearch([1, 2, 3, 4, 5], 3));`
  analyzeComplexity()
}

const clearCode = () => {
  code.value = ''
  suggestions.value = []
  timeComplexity.value = 'n'
  spaceComplexity.value = '1'
  inputSize.value = { n: 100, m: 100 }
}

const addComparison = () => {
  if (timeComplexity.value && spaceComplexity.value) {
    comparisons.value.push({
      name: `算法 ${comparisons.value.length + 1}`,
      timeComplexity: timeComplexity.value,
      spaceComplexity: spaceComplexity.value
    })
  }
}

const removeComparison = (index) => {
  comparisons.value.splice(index, 1)
}

const analyzeComplexity = () => {
  if (!code.value.trim()) {
    suggestions.value = []
    return
  }

  const codeLower = code.value.toLowerCase()
  const newSuggestions = []
  let timeComp = 'n'
  let spaceComp = '1'

  try {
    // 分析循环结构
    const hasForLoop = codeLower.includes('for(')
    const hasWhileLoop = codeLower.includes('while(')
    const hasNestedLoop = codeLower.match(/for.*for/)
    const hasRecursion = codeLower.includes('function') && codeLower.includes('return')

    // 分析算法类型
    if (algorithmType.value === 'search') {
      if (hasForLoop && !hasNestedLoop && !hasRecursion) {
        timeComp = 'n'
        spaceComp = '1'
      } else if (hasRecursion) {
        timeComp = 'n'  // 简化的递归分析
        spaceComp = 'n'
      }
    } else if (algorithmType.value === 'sort') {
      if (codeLower.includes('bubble') || codeLower.includes('insertion')) {
        timeComp = 'n²'
        spaceComp = '1'
      } else if (codeLower.includes('quick') || codeLower.includes('merge')) {
        timeComp = 'n log n'
        spaceComp = codeLower.includes('merge') ? 'n' : 'log n'
      } else {
        timeComp = 'n log n' // 默认排序复杂度
        spaceComp = '1'
      }
    } else if (algorithmType.value === 'recursive') {
      if (hasRecursion) {
        // 简单的递归分析
        if (codeLower.includes('return') && codeLower.includes('n-1')) {
          timeComp = 'n'
          spaceComp = 'n'
        } else {
          timeComp = '2ⁿ'
          spaceComp = 'n'
        }
      }
    }

    // 通用循环分析
    if (hasNestedLoop) {
      const nestedCount = (codeLower.match(/for.*for/g) || []).length + 1
      timeComp = `n${nestedCount > 2 ? '^' + nestedCount : '²'}`
      spaceComp = '1'
    } else if (hasForLoop && !hasNestedLoop) {
      if (timeComp === 'n') {
        // 检查循环内部是否有复杂操作
        if (codeLower.includes('find') || codeLower.includes('indexof')) {
          timeComp = 'n²'
          newSuggestions.push({
            id: 1,
            priority: 'medium',
            title: '考虑使用更快的查找方法',
            description: 'Array.find() 和 indexOf() 在最坏情况下是O(n²)复杂度',
            code: '考虑使用哈希表或Set来达到O(1)查找复杂度'
          })
        }
      }
    }

    // 检查常见性能问题
    if (hasForLoop && codeLower.includes('push')) {
      newSuggestions.push({
        id: 2,
        priority: 'medium',
        title: '数组操作在循环中的性能影响',
        description: '在循环中使用push()可能导致多次数组重新分配',
        code: '考虑预先分配数组大小或使用其他数据结构'
      })
    }

    if (codeLower.includes('split') || codeLower.includes('substring')) {
      newSuggestions.push({
        id: 3,
        priority: 'low',
        title: '字符串操作注意点',
        description: '字符串操作可能创建新的字符串对象',
        code: '对于大量字符串操作，考虑使用字符数组或StringBuilder'
      })
    }

    if (hasRecursion && !codeLower.includes('memoization')) {
      newSuggestions.push({
        id: 4,
        priority: 'high',
        title: '递归优化建议',
        description: '考虑使用记忆化或动态规划来优化递归算法',
        code: '使用memoization缓存已计算的结果避免重复计算'
      })
    }

    // 检查算法效率
    if (algorithmType.value === 'custom' || algorithmType.value === 'array') {
      // 分析数组操作
      if (codeLower.includes('includes') || codeLower.includes('contains')) {
        timeComplexity = 'n'  // 简化分析
      }
    }

    // 添加通用优化建议
    newSuggestions.push({
      id: 5,
      priority: 'low',
      title: '代码可读性与性能',
      description: '在保证正确性的前提下，优先考虑代码的可读性',
      code: '过早优化是万恶之源'
    })

  } catch (e) {
    console.error('分析失败:', e)
    timeComp = 'n'
    spaceComp = '1'
  }

  timeComplexity.value = timeComp
  spaceComplexity.value = spaceComp
  suggestions.value = newSuggestions

  // 重新绘制图表
  nextTick(() => {
    drawChart()
  })
}

const drawChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  const width = chartCanvas.value.width
  const height = chartCanvas.value.height

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  const dataPoints = [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

  const datasets = []

  if (showTimeComplexity.value) {
    datasets.push({
      label: `时间复杂度 O(${timeComplexity.value})`,
      color: '#3b82f6',
      data: dataPoints.map(n => calculateOperations(timeComplexity.value, n))
    })
  }

  if (showSpaceComplexity.value) {
    datasets.push({
      label: `空间复杂度 O(${spaceComplexity.value})`,
      color: '#10b981',
      data: dataPoints.map(n => calculateMemory(spaceComplexity.value, n))
    })
  }

  if (datasets.length === 0) return

  // 绘制图表
  const maxValue = Math.max(...datasets.map(d => Math.max(...d.data.map(v => {
    try {
      const num = parseInt(v)
      return isNaN(num) ? 0 : num
    } catch {
      return 0
    }
  }))))

  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // 绘制坐标轴
  ctx.strokeStyle = '#e5e5e5'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  ctx.lineTo(width - padding, height - padding)
  ctx.stroke()

  // 绘制Y轴刻度
  ctx.fillStyle = '#666'
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'

  for (let i = 0; i <= 5; i++) {
    const y = height - padding - (i * chartHeight / 5)
    const value = Math.pow(10, i).toString()
    ctx.fillText(value, padding - 5, y + 3)
  }

  // 绘制X轴刻度
  ctx.textAlign = 'center'
  dataPoints.forEach((n, index) => {
    const x = padding + (index * chartWidth / (dataPoints.length - 1))
    ctx.fillText(n.toString(), x, height - padding + 20)
  })

  // 绘制数据线
  datasets.forEach((dataset, datasetIndex) => {
    ctx.strokeStyle = dataset.color
    ctx.lineWidth = 2
    ctx.beginPath()

    dataset.data.forEach((value, index) => {
      const x = padding + (index * chartWidth / (dataPoints.length - 1))
      const logValue = Math.log10(Math.max(1, parseFloat(value.toString()) || 1))
      const logMax = Math.log10(Math.max(1, maxValue))
      const y = height - padding - (logValue / logMax) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // 绘制数据点
    ctx.fillStyle = dataset.color
    dataset.data.forEach((value, index) => {
      const x = padding + (index * chartWidth / (dataPoints.length - 1))
      const logValue = Math.log10(Math.max(1, parseFloat(value.toString()) || 1))
      const logMax = Math.log10(Math.max(1, maxValue))
      const y = height - padding - (logValue / logMax) * chartHeight
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  })

  // 绘制图例
  ctx.font = '12px Arial'
  ctx.textAlign = 'left'
  datasets.forEach((dataset, index) => {
    const x = padding + index * 150 + 10
    const y = 10
    ctx.fillStyle = dataset.color
    ctx.fillRect(x, y, 10, 10)
    ctx.fillStyle = '#333'
    ctx.fillText(dataset.label, x + 15, y + 8)
  })
}

// 初始化
onMounted(() => {
  loadExample()
})
</script>