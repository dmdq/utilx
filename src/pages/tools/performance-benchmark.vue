<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">性能基准测试</h1>
      <p class="text-muted-foreground mb-4">测试JavaScript代码执行性能、函数运行时间和内存使用情况，支持多种测试场景和性能对比</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧代码输入 -->
      <div class="space-y-6">
        <!-- 测试类型选择 -->
        <div class="bg-card rounded-lg p-4">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">测试类型</label>
              <select v-model="testType" @change="onTestTypeChange" class="w-full px-3 py-2 border rounded-md">
                <option value="function">函数性能</option>
                <option value="algorithm">算法对比</option>
                <option value="memory">内存使用</option>
                <option value="rendering">渲染性能</option>
                <option value="async">异步操作</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">预设测试</label>
              <select v-model="selectedPreset" @change="loadPreset" class="w-full px-3 py-2 border rounded-md">
                <option value="">选择预设...</option>
                <option value="sorting">排序算法对比</option>
                <option value="array-methods">数组方法性能</option>
                <option value="loop-performance">循环性能测试</option>
                <option value="string-operations">字符串操作</option>
                <option value="dom-manipulation">DOM操作性能</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="runBenchmark"
              :disabled="isRunning"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
            >
              {{ isRunning ? '测试中...' : '运行测试' }}
            </button>
            <button
              @click="clearResults"
              class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              清空结果
            </button>
            <button
              @click="exportResults"
              class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              导出结果
            </button>
          </div>
        </div>

        <!-- 测试配置 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">测试配置</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">迭代次数</label>
              <input
                v-model.number="testConfig.iterations"
                type="number"
                min="100"
                max="10000000"
                class="w-full px-2 py-1 border rounded text-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">预热次数</label>
              <input
                v-model.number="testConfig.warmup"
                type="number"
                min="0"
                max="1000"
                class="w-full px-2 py-1 border rounded text-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">数据大小</label>
              <input
                v-model.number="testConfig.dataSize"
                type="number"
                min="10"
                max="100000"
                class="w-full px-2 py-1 border rounded text-sm"
              >
            </div>
          </div>
        </div>

        <!-- 代码编辑器 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">测试代码</h3>
            <div class="flex gap-2">
              <button
                @click="formatCode"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                格式化
              </button>
            </div>
          </div>

          <!-- 函数性能测试 -->
          <div v-if="testType === 'function'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">测试函数</label>
              <textarea
                v-model="testCode.function"
                class="w-full h-32 p-3 font-mono text-sm border rounded-md resize-none"
                placeholder="function testFunction(data) {
  // 在这里编写要测试的代码
  return data.map(x => x * 2);
}"
              ></textarea>
            </div>
          </div>

          <!-- 算法对比测试 -->
          <div v-else-if="testType === 'algorithm'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">算法 1</label>
              <textarea
                v-model="testCode.algorithm1"
                class="w-full h-32 p-3 font-mono text-sm border rounded-md resize-none"
                placeholder="function algorithm1(arr) {
  // 算法1实现
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
  }
  return arr;
}"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">算法 2</label>
              <textarea
                v-model="testCode.algorithm2"
                class="w-full h-32 p-3 font-mono text-sm border rounded-md resize-none"
                placeholder="function algorithm2(arr) {
  // 算法2实现
  return arr.sort((a, b) => a - b);
}"
              ></textarea>
            </div>
          </div>

          <!-- 内存使用测试 -->
          <div v-else-if="testType === 'memory'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">内存测试代码</label>
              <textarea
                v-model="testCode.memory"
                class="w-full h-32 p-3 font-mono text-sm border rounded-md resize-none"
                placeholder="function memoryTest(size) {
  // 创建大量数据来测试内存使用
  const arrays = [];
  for (let i = 0; i < size; i++) {
    arrays.push(new Array(1000).fill(0));
  }
  return arrays;
}"
              ></textarea>
            </div>
          </div>

          <!-- 渲染性能测试 -->
          <div v-else-if="testType === 'rendering'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">DOM操作代码</label>
              <textarea
                v-model="testCode.rendering"
                class="w-full h-32 p-3 font-mono text-sm border rounded-md resize-none"
                placeholder="function renderingTest() {
  const container = document.getElementById('test-container');
  // DOM操作测试代码
  for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div');
    div.textContent = 'Item ' + i;
    container.appendChild(div);
  }
}"
              ></textarea>
            </div>
            <div id="test-container" class="border rounded p-2 h-32 overflow-auto bg-gray-50"></div>
          </div>

          <!-- 异步操作测试 -->
          <div v-else-if="testType === 'async'" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">异步操作代码</label>
              <textarea
                v-model="testCode.async"
                class="w-full h-32 p-3 font-mono text-sm border rounded-md resize-none"
                placeholder="async function asyncTest() {
  // 异步操作测试代码
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(fetch('/api/data'));
  }
  return Promise.all(promises);
}"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧结果展示 -->
      <div class="space-y-6">
        <!-- 性能指标 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">性能指标</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold">{{ performanceMetrics.avgTime }}ms</div>
              <div class="text-xs text-muted-foreground">平均执行时间</div>
            </div>
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold">{{ performanceMetrics.opsPerSecond }}</div>
              <div class="text-xs text-muted-foreground">操作/秒</div>
            </div>
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold">{{ performanceMetrics.minTime }}ms</div>
              <div class="text-xs text-muted-foreground">最快执行时间</div>
            </div>
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold">{{ performanceMetrics.maxTime }}ms</div>
              <div class="text-xs text-muted-foreground">最慢执行时间</div>
            </div>
          </div>
        </div>

        <!-- 详细结果 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">详细结果</h3>

          <!-- 函数性能结果 -->
          <div v-if="testType === 'function' && benchmarkResults.function">
            <div class="space-y-3">
              <div class="p-3 bg-blue-50 rounded">
                <div class="font-medium text-sm">执行时间分布</div>
                <canvas ref="timeChart" width="400" height="200"></canvas>
              </div>
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span>总执行时间:</span>
                  <span>{{ benchmarkResults.function.totalTime }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span>标准差:</span>
                  <span>{{ benchmarkResults.function.stdDev }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span>中位数:</span>
                  <span>{{ benchmarkResults.function.median }}ms</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 算法对比结果 -->
          <div v-else-if="testType === 'algorithm' && benchmarkResults.algorithms">
            <div class="space-y-3">
              <div class="p-3 bg-green-50 rounded">
                <div class="font-medium text-sm mb-2">性能对比</div>
                <canvas ref="comparisonChart" width="400" height="200"></canvas>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="p-2 bg-muted rounded">
                  <div class="font-medium">算法 1</div>
                  <div>平均: {{ benchmarkResults.algorithms.alg1.avgTime }}ms</div>
                  <div>最快: {{ benchmarkResults.algorithms.alg1.minTime }}ms</div>
                </div>
                <div class="p-2 bg-muted rounded">
                  <div class="font-medium">算法 2</div>
                  <div>平均: {{ benchmarkResults.algorithms.alg2.avgTime }}ms</div>
                  <div>最快: {{ benchmarkResults.algorithms.alg2.minTime }}ms</div>
                </div>
              </div>
              <div class="text-center p-2 bg-blue-50 rounded">
                <div class="font-medium">性能提升</div>
                <div class="text-lg">{{ benchmarkResults.algorithms.improvement }}%</div>
              </div>
            </div>
          </div>

          <!-- 内存使用结果 -->
          <div v-else-if="testType === 'memory' && benchmarkResults.memory">
            <div class="space-y-3">
              <div class="p-3 bg-yellow-50 rounded">
                <div class="font-medium text-sm mb-2">内存使用情况</div>
                <canvas ref="memoryChart" width="400" height="200"></canvas>
              </div>
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span>初始内存:</span>
                  <span>{{ benchmarkResults.memory.initialMemory }}MB</span>
                </div>
                <div class="flex justify-between">
                  <span>峰值内存:</span>
                  <span>{{ benchmarkResults.memory.peakMemory }}MB</span>
                </div>
                <div class="flex justify-between">
                  <span>内存增长:</span>
                  <span>{{ benchmarkResults.memory.memoryGrowth }}MB</span>
                </div>
                <div class="flex justify-between">
                  <span>垃圾回收后:</span>
                  <span>{{ benchmarkResults.memory.afterGC }}MB</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 渲染性能结果 -->
          <div v-else-if="testType === 'rendering' && benchmarkResults.rendering">
            <div class="space-y-3">
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span>首次渲染时间:</span>
                  <span>{{ benchmarkResults.rendering.firstRender }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span>重绘时间:</span>
                  <span>{{ benchmarkResults.rendering.reflowTime }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span>重排时间:</span>
                  <span>{{ benchmarkResults.rendering.restartTime }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span>DOM节点数:</span>
                  <span>{{ benchmarkResults.rendering.nodeCount }}</span>
                </div>
              </div>
              <div class="text-center p-2 bg-green-50 rounded">
                <div class="font-medium">性能建议</div>
                <div class="text-xs text-gray-600 mt-1">{{ benchmarkResults.rendering.suggestion }}</div>
              </div>
            </div>
          </div>

          <!-- 异步操作结果 -->
          <div v-else-if="testType === 'async' && benchmarkResults.async">
            <div class="space-y-3">
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span>总响应时间:</span>
                  <span>{{ benchmarkResults.async.totalTime }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span>平均响应时间:</span>
                  <span>{{ benchmarkResults.async.avgTime }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span>并发请求数:</span>
                  <span>{{ benchmarkResults.async.concurrentRequests }}</span>
                </div>
                <div class="flex justify-between">
                  <span>成功率:</span>
                  <span>{{ benchmarkResults.async.successRate }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!Object.keys(benchmarkResults).length" class="text-center py-8 text-muted-foreground text-sm">
            运行测试后将在此显示详细结果
          </div>
        </div>

        <!-- 性能建议 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">性能优化建议</h3>
          <div class="space-y-2">
            <div
              v-for="(suggestion, index) in performanceSuggestions"
              :key="index"
              class="p-3 border rounded"
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
                  <div class="font-medium text-sm">{{ suggestion.title }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ suggestion.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 测试历史 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">测试历史</h3>
          <div class="space-y-2 max-h-48 overflow-auto">
            <div
              v-for="(history, index) in testHistory"
              :key="index"
              class="p-2 border rounded cursor-pointer hover:bg-muted"
              @click="loadHistory(history)"
            >
              <div class="flex justify-between items-center">
                <span class="text-sm">{{ history.type }} - {{ history.date.toLocaleString() }}</span>
                <span class="text-xs text-muted-foreground">{{ history.avgTime }}ms</span>
              </div>
            </div>
            <div v-if="testHistory.length === 0" class="text-center py-4 text-muted-foreground text-sm">
              暂无测试历史
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('性能基准测试 - JavaScript代码性能测试工具')

// 数据
const testType = ref('function')
const selectedPreset = ref('')
const isRunning = ref(false)

const testConfig = ref({
  iterations: 10000,
  warmup: 100,
  dataSize: 1000
})

const testCode = ref({
  function: '',
  algorithm1: '',
  algorithm2: '',
  memory: '',
  rendering: '',
  async: ''
})

const benchmarkResults = ref({})
const testHistory = ref([])

const timeChart = ref(null)
const comparisonChart = ref(null)
const memoryChart = ref(null)

// 预设测试
const presets = {
  'sorting': {
    type: 'algorithm',
    algorithm1: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
    algorithm2: `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}`
  },
  'array-methods': {
    type: 'function',
    function: `// 测试不同数组方法的性能
function arrayMethodsTest(arr) {
  // map方法
  const mapped = arr.map(x => x * 2);

  // filter方法
  const filtered = arr.filter(x => x % 2 === 0);

  // reduce方法
  const sum = arr.reduce((acc, x) => acc + x, 0);

  return { mapped, filtered, sum };
}`
  },
  'loop-performance': {
    type: 'algorithm',
    algorithm1: `// 传统for循环
function traditionalLoop(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i] * 2);
  }
  return result;
}`,
    algorithm2: `// forEach循环
function forEachLoop(arr) {
  const result = [];
  arr.forEach(x => {
    result.push(x * 2);
  });
  return result;
}`
  },
  'string-operations': {
    type: 'function',
    function: `function stringOperations(str) {
  // 字符串拼接性能测试
  let result = '';
  for (let i = 0; i < 1000; i++) {
    result += str + i;
  }

  // 使用数组join
  const parts = [];
  for (let i = 0; i < 1000; i++) {
    parts.push(str + i);
  }
  const joined = parts.join('');

  return { result, joined };
}`
  },
  'dom-manipulation': {
    type: 'rendering',
    rendering: `function domManipulationTest() {
  const container = document.getElementById('test-container');

  // 清空容器
  container.innerHTML = '';

  // 创建多个DOM元素
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div');
    div.className = 'test-item';
    div.textContent = 'Item ' + i;
    div.style.padding = '2px';
    div.style.margin = '1px';
    fragment.appendChild(div);
  }

  // 一次性添加所有元素
  container.appendChild(fragment);
}`
  }
}

// 计算属性
const performanceMetrics = computed(() => {
  if (!Object.keys(benchmarkResults.value).length) {
    return {
      avgTime: 0,
      opsPerSecond: 0,
      minTime: 0,
      maxTime: 0
    }
  }

  let metrics = { avgTime: 0, opsPerSecond: 0, minTime: 0, maxTime: 0 }

  if (testType.value === 'function' && benchmarkResults.value.function) {
    const result = benchmarkResults.value.function
    metrics = {
      avgTime: result.avgTime,
      opsPerSecond: Math.round(1000 / result.avgTime),
      minTime: result.minTime,
      maxTime: result.maxTime
    }
  } else if (testType.value === 'algorithm' && benchmarkResults.value.algorithms) {
    const alg1 = benchmarkResults.value.algorithms.alg1
    metrics = {
      avgTime: alg1.avgTime,
      opsPerSecond: Math.round(1000 / alg1.avgTime),
      minTime: alg1.minTime,
      maxTime: alg1.maxTime
    }
  }

  return metrics
})

const performanceSuggestions = computed(() => {
  const suggestions = []

  if (testType.value === 'function' && benchmarkResults.value.function) {
    const result = benchmarkResults.value.function
    if (result.avgTime > 10) {
      suggestions.push({
        priority: 'high',
        title: '执行时间过长',
        description: '考虑优化算法或使用更高效的数据结构'
      })
    }
    if (result.stdDev > result.avgTime * 0.5) {
      suggestions.push({
        priority: 'medium',
        title: '执行时间不稳定',
        description: '可能存在性能抖动，建议检查是否有异步操作或垃圾回收影响'
      })
    }
  }

  if (testType.value === 'algorithm' && benchmarkResults.value.algorithms) {
    const improvement = benchmarkResults.value.algorithms.improvement
    if (improvement > 50) {
      suggestions.push({
        priority: 'high',
        title: '算法差异显著',
        description: `算法2比算法1快${improvement}%，建议使用更快的算法`
      })
    }
  }

  if (testType.value === 'memory' && benchmarkResults.value.memory) {
    const memory = benchmarkResults.value.memory
    if (memory.memoryGrowth > 50) {
      suggestions.push({
        priority: 'high',
        title: '内存使用过高',
        description: '考虑使用对象池或及时释放不需要的对象'
      })
    }
  }

  return suggestions
})

// 方法
const onTestTypeChange = () => {
  benchmarkResults.value = {}
  selectedPreset.value = ''
}

const loadPreset = () => {
  if (selectedPreset.value && presets[selectedPreset.value]) {
    const preset = presets[selectedPreset.value]
    testType.value = preset.type
    Object.keys(preset).forEach(key => {
      if (key !== 'type' && testCode.value[key] !== undefined) {
        testCode.value[key] = preset[key]
      }
    })
  }
}

const formatCode = () => {
  // 简单的代码格式化
  Object.keys(testCode.value).forEach(key => {
    if (testCode.value[key]) {
      // 这里可以集成更复杂的代码格式化库
      testCode.value[key] = testCode.value[key]
        .replace(/\s+/g, ' ')
        .replace(/;\s*/g, ';\n')
        .replace(/{\s*/g, ' {\n  ')
        .replace(/}\s*/g, '\n}\n')
        .trim()
    }
  })
}

const clearResults = () => {
  benchmarkResults.value = {}
  // 清空测试容器
  const container = document.getElementById('test-container')
  if (container) {
    container.innerHTML = ''
  }
}

const runBenchmark = async () => {
  if (isRunning.value) return

  isRunning.value = true

  try {
    switch (testType.value) {
      case 'function':
        await runFunctionBenchmark()
        break
      case 'algorithm':
        await runAlgorithmBenchmark()
        break
      case 'memory':
        await runMemoryBenchmark()
        break
      case 'rendering':
        await runRenderingBenchmark()
        break
      case 'async':
        await runAsyncBenchmark()
        break
    }

    // 保存到历史记录
    saveToHistory()

  } catch (error) {
    console.error('Benchmark error:', error)
  } finally {
    isRunning.value = false
  }
}

const runFunctionBenchmark = async () => {
  const func = new Function('return ' + testCode.value.function)()
  const times = []
  const iterations = testConfig.value.iterations
  const warmup = testConfig.value.warmup

  // 预热
  for (let i = 0; i < warmup; i++) {
    func(testData())
  }

  // 正式测试
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    func(testData())
    const end = performance.now()
    times.push(end - start)
  }

  // 计算统计信息
  times.sort((a, b) => a - b)
  const sum = times.reduce((acc, time) => acc + time, 0)
  const avg = sum / times.length
  const median = times[Math.floor(times.length / 2)]
  const variance = times.reduce((acc, time) => acc + Math.pow(time - avg, 2), 0) / times.length
  const stdDev = Math.sqrt(variance)

  benchmarkResults.value.function = {
    totalTime: sum.toFixed(2),
    avgTime: avg.toFixed(4),
    minTime: times[0].toFixed(4),
    maxTime: times[times.length - 1].toFixed(4),
    median: median.toFixed(4),
    stdDev: stdDev.toFixed(4),
    times
  }

  // 绘制图表
  nextTick(() => {
    drawTimeChart(times)
  })
}

const runAlgorithmBenchmark = async () => {
  const alg1 = new Function('return ' + testCode.value.algorithm1)()
  const alg2 = new Function('return ' + testCode.value.algorithm2)()
  const data = generateTestData()

  // 测试算法1
  const times1 = []
  for (let i = 0; i < testConfig.value.iterations; i++) {
    const testData = [...data]
    const start = performance.now()
    alg1(testData)
    const end = performance.now()
    times1.push(end - start)
  }

  // 测试算法2
  const times2 = []
  for (let i = 0; i < testConfig.value.iterations; i++) {
    const testData = [...data]
    const start = performance.now()
    alg2(testData)
    const end = performance.now()
    times2.push(end - start)
  }

  const avg1 = times1.reduce((a, b) => a + b, 0) / times1.length
  const avg2 = times2.reduce((a, b) => a + b, 0) / times2.length
  const improvement = ((avg1 - avg2) / avg1 * 100).toFixed(2)

  benchmarkResults.value.algorithms = {
    alg1: {
      avgTime: avg1.toFixed(4),
      minTime: Math.min(...times1).toFixed(4),
      maxTime: Math.max(...times1).toFixed(4)
    },
    alg2: {
      avgTime: avg2.toFixed(4),
      minTime: Math.min(...times2).toFixed(4),
      maxTime: Math.max(...times2).toFixed(4)
    },
    improvement: improvement > 0 ? improvement : (-improvement).toFixed(2)
  }

  // 绘制对比图表
  nextTick(() => {
    drawComparisonChart(times1, times2)
  })
}

const runMemoryBenchmark = async () => {
  const func = new Function('return ' + testCode.value.memory)()

  // 记录初始内存
  const initialMemory = (performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(2) || 0
  let peakMemory = initialMemory

  // 执行内存测试
  const memorySnapshots = []
  for (let i = 0; i < 100; i++) {
    func(testConfig.value.dataSize)

    // 记录内存使用
    const currentMemory = (performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(2) || 0
    memorySnapshots.push(parseFloat(currentMemory))
    peakMemory = Math.max(peakMemory, parseFloat(currentMemory))

    // 每10次强制垃圾回收
    if (i % 10 === 0) {
      if (window.gc) window.gc()
    }
  }

  // 最终垃圾回收
  if (window.gc) window.gc()
  const afterGC = (performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(2) || 0

  benchmarkResults.value.memory = {
    initialMemory,
    peakMemory,
    memoryGrowth: (peakMemory - initialMemory).toFixed(2),
    afterGC,
    snapshots: memorySnapshots
  }

  // 绘制内存图表
  nextTick(() => {
    drawMemoryChart(memorySnapshots)
  })
}

const runRenderingBenchmark = async () => {
  const func = new Function('return ' + testCode.value.rendering)()

  // 记录渲染开始时间
  const renderStart = performance.now()

  // 执行DOM操作
  func()

  // 等待渲染完成
  await new Promise(resolve => {
    requestAnimationFrame(resolve)
  })

  const renderEnd = performance.now()
  const firstRender = renderEnd - renderStart

  // 计算DOM节点数
  const container = document.getElementById('test-container')
  const nodeCount = container?.childNodes.length || 0

  benchmarkResults.value.rendering = {
    firstRender: firstRender.toFixed(2),
    reflowTime: (firstRender * 0.3).toFixed(2), // 估算值
    restartTime: (firstRender * 0.2).toFixed(2), // 估算值
    nodeCount,
    suggestion: generateRenderingSuggestion(firstRender, nodeCount)
  }
}

const runAsyncBenchmark = async () => {
  // 由于跨域限制，这里使用模拟的异步操作
  const mockAsync = () => new Promise(resolve => {
    setTimeout(resolve, Math.random() * 100)
  })

  const concurrentRequests = 50
  const times = []

  const start = performance.now()

  // 并发执行异步操作
  const promises = []
  for (let i = 0; i < concurrentRequests; i++) {
    const promiseStart = performance.now()
    promises.push(
      mockAsync().then(() => {
        const promiseEnd = performance.now()
        times.push(promiseEnd - promiseStart)
        return true
      })
    )
  }

  const results = await Promise.all(promises)
  const end = performance.now()

  const totalTime = end - start
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length
  const successRate = (results.filter(r => r).length / results.length * 100).toFixed(2)

  benchmarkResults.value.async = {
    totalTime: totalTime.toFixed(2),
    avgTime: avgTime.toFixed(2),
    concurrentRequests,
    successRate
  }
}

const testData = () => {
  return Array.from({ length: testConfig.value.dataSize }, (_, i) => i)
}

const generateTestData = () => {
  return Array.from({ length: testConfig.value.dataSize }, () => Math.random() * 1000)
}

const generateRenderingSuggestion = (renderTime, nodeCount) => {
  if (renderTime > 100) {
    return '渲染时间过长，建议使用虚拟滚动或分页来优化性能'
  } else if (nodeCount > 1000) {
    return 'DOM节点过多，考虑使用文档片段或虚拟DOM技术'
  } else {
    return '渲染性能良好'
  }
}

const drawTimeChart = (times) => {
  if (!timeChart.value) return

  const canvas = timeChart.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  // 清空画布
  ctx.clearRect(0, 0, width, height)

  // 绘制时间分布直方图
  const bins = 20
  const maxTime = Math.max(...times)
  const minTime = Math.min(...times)
  const binSize = (maxTime - minTime) / bins
  const histogram = new Array(bins).fill(0)

  times.forEach(time => {
    const binIndex = Math.min(Math.floor((time - minTime) / binSize), bins - 1)
    histogram[binIndex]++
  })

  const maxCount = Math.max(...histogram)
  const barWidth = width / bins

  // 绘制柱状图
  histogram.forEach((count, index) => {
    const barHeight = (count / maxCount) * (height - 20)
    const x = index * barWidth
    const y = height - barHeight

    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(x, y, barWidth - 1, barHeight)
  })

  // 绘制坐标轴
  ctx.strokeStyle = '#e5e7eb'
  ctx.beginPath()
  ctx.moveTo(0, height - 1)
  ctx.lineTo(width, height - 1)
  ctx.stroke()
}

const drawComparisonChart = (times1, times2) => {
  if (!comparisonChart.value) return

  const canvas = comparisonChart.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  const avg1 = times1.reduce((a, b) => a + b, 0) / times1.length
  const avg2 = times2.reduce((a, b) => a + b, 0) / times2.length
  const maxAvg = Math.max(avg1, avg2)

  // 绘制对比柱状图
  const barWidth = width / 3
  const maxHeight = height - 40

  // 算法1
  const height1 = (avg1 / maxAvg) * maxHeight
  ctx.fillStyle = '#ef4444'
  ctx.fillRect(barWidth / 2, height - height1 - 20, barWidth, height1)

  // 算法2
  const height2 = (avg2 / maxAvg) * maxHeight
  ctx.fillStyle = '#10b981'
  ctx.fillRect(barWidth * 1.5, height - height2 - 20, barWidth, height2)

  // 添加标签
  ctx.fillStyle = '#374151'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('算法1', barWidth, height - 5)
  ctx.fillText('算法2', barWidth * 2, height - 5)

  // 添加数值
  ctx.fillText(avg1.toFixed(2) + 'ms', barWidth, height - height1 - 25)
  ctx.fillText(avg2.toFixed(2) + 'ms', barWidth * 2, height - height2 - 25)
}

const drawMemoryChart = (snapshots) => {
  if (!memoryChart.value) return

  const canvas = memoryChart.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  const maxMemory = Math.max(...snapshots)
  const minMemory = Math.min(...snapshots)
  const range = maxMemory - minMemory

  // 绘制折线图
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()

  snapshots.forEach((memory, index) => {
    const x = (index / (snapshots.length - 1)) * width
    const y = height - ((memory - minMemory) / range) * (height - 20) - 10

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // 绘制点
  snapshots.forEach((memory, index) => {
    const x = (index / (snapshots.length - 1)) * width
    const y = height - ((memory - minMemory) / range) * (height - 20) - 10

    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, 2 * Math.PI)
    ctx.fill()
  })
}

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

const saveToHistory = () => {
  const history = {
    type: testType.value,
    date: new Date(),
    avgTime: performanceMetrics.value.avgTime,
    config: { ...testConfig.value },
    results: { ...benchmarkResults.value }
  }

  testHistory.value.unshift(history)
  if (testHistory.value.length > 20) {
    testHistory.value = testHistory.value.slice(0, 20)
  }
}

const loadHistory = (history) => {
  testType.value = history.type
  testConfig.value = { ...history.config }
  benchmarkResults.value = { ...history.results }
}

const exportResults = () => {
  const data = {
    timestamp: new Date().toISOString(),
    testType: testType.value,
    config: testConfig.value,
    results: benchmarkResults.value,
    metrics: performanceMetrics.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `benchmark-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 初始化
onMounted(() => {
  loadPreset()
})
</script>