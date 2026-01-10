<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">排序算法可视化 - 冒泡、快速、归并排序动画演示</h1>
      <p class="text-muted-foreground">免费在线排序算法可视化工具，支持冒泡、快速、归并、堆排序等算法的动画演示，帮助理解排序算法原理。可视化展示排序过程，实时显示比较和交换次数。</p>
    </div>

    <!-- 控制面板 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 算法选择 -->
        <div>
          <label class="text-sm font-medium text-foreground mb-2 block">选择算法</label>
          <select v-model="selectedAlgorithm" :disabled="isSorting" class="w-full px-3 py-2 border border-border rounded-md bg-background">
            <option v-for="algo in algorithms" :key="algo.id" :value="algo.id">
              {{ algo.name }} - {{ algo.complexity }}
            </option>
          </select>
        </div>

        <!-- 数组大小 -->
        <div>
          <label class="text-sm font-medium text-foreground mb-2 block">数组大小: {{ arraySize }}</label>
          <input
            v-model.number="arraySize"
            type="range"
            min="5"
            max="100"
            step="5"
            :disabled="isSorting"
            class="w-full"
          >
        </div>

        <!-- 排序速度 -->
        <div>
          <label class="text-sm font-medium text-foreground mb-2 block">排序速度: {{ speed }}ms</label>
          <input
            v-model.number="speed"
            type="range"
            min="10"
            max="1000"
            step="10"
            class="w-full"
          >
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-2 items-end">
          <button
            @click="generateArray"
            :disabled="isSorting"
            class="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors disabled:opacity-50"
          >
            生成数组
          </button>
          <button
            @click="startSorting"
            :disabled="isSorting"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {{ isSorting ? '排序中...' : '开始排序' }}
          </button>
        </div>
      </div>

      <!-- 额外控制 -->
      <div class="mt-4 flex flex-wrap gap-3">
        <button
          @click="pauseSorting"
          :disabled="!isSorting || isPaused"
          class="px-3 py-1 bg-warning text-warning-foreground rounded hover:bg-warning/90 transition-colors disabled:opacity-50 text-sm"
        >
          暂停
        </button>
        <button
          @click="resumeSorting"
          :disabled="!isPaused"
          class="px-3 py-1 bg-success text-success-foreground rounded hover:bg-success/90 transition-colors disabled:opacity-50 text-sm"
        >
          继续
        </button>
        <button
          @click="stopSorting"
          :disabled="!isSorting"
          class="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors disabled:opacity-50 text-sm"
        >
          停止
        </button>
        <label class="flex items-center gap-2 text-sm text-foreground">
          <input
            v-model="showComparisons"
            type="checkbox"
            class="rounded"
          >
          显示比较次数
        </label>
        <label class="flex items-center gap-2 text-sm text-foreground">
          <input
            v-model="showSwaps"
            type="checkbox"
            class="rounded"
          >
          显示交换次数
        </label>
      </div>
    </div>

    <!-- 可视化区域 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-foreground">可视化展示</h2>
        <div class="flex gap-4 text-sm">
          <span v-if="showComparisons" class="text-primary">
            比较次数: {{ comparisons }}
          </span>
          <span v-if="showSwaps" class="text-destructive">
            交换次数: {{ swaps }}
          </span>
          <span class="text-success">
            状态: {{ status }}
          </span>
        </div>
      </div>

      <div class="relative h-96 flex items-end justify-center gap-1 p-4 bg-muted/30 rounded">
        <div
          v-for="(bar, index) in array"
          :key="index"
          class="flex-1 transition-all duration-300 rounded-t"
          :class="{
            'bg-primary': !bar.comparing && !bar.sorted,
            'bg-destructive': bar.comparing,
            'bg-success': bar.sorted,
            'bg-warning': bar.pivot
          }"
          :style="{
            height: `${(bar.value / maxValue) * 100}%`,
            maxWidth: `${100 / array.length - 0.5}%`
          }"
          :title="`值: ${bar.value}`"
        >
          <div v-if="array.length <= 20" class="text-xs text-white text-center pt-1">
            {{ bar.value }}
          </div>
        </div>
      </div>

      <!-- 步骤说明 -->
      <div v-if="currentStep" class="mt-4 p-3 bg-primary/10 border border-primary/20 rounded text-sm text-foreground">
        <strong>当前步骤:</strong> {{ currentStep }}
      </div>
    </div>

    <!-- 算法说明 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 算法详细信息 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold text-foreground mb-4">算法信息</h3>
        <div v-if="currentAlgorithm" class="space-y-3">
          <div>
            <h4 class="font-medium text-foreground">{{ currentAlgorithm.name }}</h4>
            <p class="text-sm text-muted-foreground">{{ currentAlgorithm.description }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-foreground">时间复杂度:</span>
              <span class="ml-2 text-muted-foreground">{{ currentAlgorithm.timeComplexity }}</span>
            </div>
            <div>
              <span class="font-medium text-foreground">空间复杂度:</span>
              <span class="ml-2 text-muted-foreground">{{ currentAlgorithm.spaceComplexity }}</span>
            </div>
            <div>
              <span class="font-medium text-foreground">稳定性:</span>
              <span class="ml-2 text-muted-foreground">{{ currentAlgorithm.stable ? '稳定' : '不稳定' }}</span>
            </div>
            <div>
              <span class="font-medium text-foreground">原地排序:</span>
              <span class="ml-2 text-muted-foreground">{{ currentAlgorithm.inPlace ? '是' : '否' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 算法特点 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold text-foreground mb-4">算法特点</h3>
        <div v-if="currentAlgorithm" class="space-y-2 text-sm">
          <div v-for="(pro, index) in currentAlgorithm.pros" :key="`pro-${index}`" class="flex items-start gap-2">
            <Check class="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <span class="text-foreground">{{ pro }}</span>
          </div>
          <div v-for="(con, index) in currentAlgorithm.cons" :key="`con-${index}`" class="flex items-start gap-2">
            <X class="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <span class="text-foreground">{{ con }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mb-12 bg-card border border-border rounded-lg p-6">
      <h3 class="text-lg font-semibold text-foreground mb-4">使用说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
        <div>
          <h4 class="font-medium text-foreground mb-2">操作指南</h4>
          <ul class="space-y-1 list-disc list-inside">
            <li>选择要演示的排序算法</li>
            <li>调整数组大小（5-100个元素）</li>
            <li>设置排序速度（10-1000ms）</li>
            <li>点击"生成数组"创建随机数据</li>
            <li>点击"开始排序"观看动画演示</li>
            <li>可以随时暂停、继续或停止排序</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">颜色说明</h4>
          <ul class="space-y-1">
            <li><span class="inline-block w-4 h-4 bg-primary rounded mr-2"></span>默认状态</li>
            <li><span class="inline-block w-4 h-4 bg-destructive rounded mr-2"></span>正在比较</li>
            <li><span class="inline-block w-4 h-4 bg-success rounded mr-2"></span>已排序</li>
            <li><span class="inline-block w-4 h-4 bg-warning rounded mr-2"></span>基准元素（快速排序）</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是排序算法可视化？
        </h2>
        <p class="text-muted-foreground mb-4">
          排序算法可视化是一种通过图形化方式展示排序算法执行过程的技术。
          它将抽象的算法逻辑转换为直观的动画演示，帮助学习者更好地理解算法的工作原理。
          通过可视化，我们可以清楚地看到每次比较、交换的操作，以及数据如何一步步从无序变为有序。
        </p>
        <p class="text-muted-foreground">
          本工具支持多种经典排序算法的可视化演示，包括冒泡排序、选择排序、插入排序、快速排序、归并排序和堆排序。
          每种算法都有其独特的特点和适用场景，通过对比观察不同算法的执行过程，
          可以更深入地理解算法的时间复杂度、空间复杂度和稳定性等重要特性。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>从下拉菜单中选择想要演示的排序算法</li>
          <li>通过滑块调整数组大小，建议从小到大逐步尝试</li>
          <li>设置排序速度，初学者建议选择较慢的速度以便观察细节</li>
          <li>点击"生成数组"创建随机数据集</li>
          <li>点击"开始排序"观看动画演示过程</li>
          <li>观察实时统计数据（比较次数、交换次数）了解算法效率</li>
          <li>可以随时暂停、继续或停止排序过程</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的排序算法
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>冒泡排序</strong>: 简单直观但效率较低，适合小数据集</li>
          <li><strong>选择排序</strong>: 每次选择最小元素，交换次数少</li>
          <li><strong>插入排序</strong>: 类似整理扑克牌，对小数据或近乎有序数据效率高</li>
          <li><strong>快速排序</strong>: 平均性能优秀，是实际应用中最常用的算法</li>
          <li><strong>归并排序</strong>: 稳定且时间复杂度优秀，但需要额外空间</li>
          <li><strong>堆排序</strong>: 原地排序且时间复杂度稳定，实现较复杂</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要学习排序算法？</h3>
            <p class="text-muted-foreground mt-1">
              排序是计算机科学中最基本的操作之一，理解和掌握排序算法对于提升编程能力和解决实际问题非常重要。
              不同的排序算法有各自的优缺点，在实际开发中选择合适的排序算法可以显著提升程序性能。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">时间复杂度 O(n log n) 和 O(n²) 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              时间复杂度描述了算法执行时间随数据规模增长的变化趋势。O(n log n) 的算法（如快速排序、归并排序）在处理大数据时比 O(n²) 的算法（如冒泡排序）快得多。
              例如，处理10000个数据时，O(n²) 可能需要数秒，而 O(n log n) 只需几毫秒。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是稳定排序？</h3>
            <p class="text-muted-foreground mt-1">
              稳定排序是指相等元素的相对顺序在排序后保持不变。例如，如果原始数据中有两个相同的数字A和B，且A在B前面，
              稳定排序会保证排序后A仍然在B前面。冒泡排序、插入排序和归并排序是稳定的，而快速排序、选择排序和堆排序通常是不稳定的。
            </p>
          </div>
        </div>
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
import { ref, computed, watch } from 'vue'
import {
  Check, X, HelpCircle, ChevronUp,
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// 状态管理
const array = ref([])
const arraySize = ref(30)
const selectedAlgorithm = ref('bubble')
const speed = ref(100)
const isSorting = ref(false)
const isPaused = ref(false)
const comparisons = ref(0)
const swaps = ref(0)
const currentStep = ref('')
const status = ref('就绪')
const showComparisons = ref(true)
const showSwaps = ref(true)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'algorithm' && t.id !== 'sorting-algorithm-visualizer'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'data-structure-visualizer'),
    tools.find(t => t.id === 'binary-search-tree'),
    tools.find(t => t.id === 'graph-algorithm-visualizer'),
    tools.find(t => t.id === 'dynamic-programming')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 算法定义
const algorithms = [
  {
    id: 'bubble',
    name: '冒泡排序',
    description: '通过重复遍历数组，比较相邻元素并交换位置',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    stable: true,
    inPlace: true,
    pros: ['实现简单', '对小数据集效率较高', '稳定排序'],
    cons: ['时间复杂度高', '对大数据集效率低']
  },
  {
    id: 'selection',
    name: '选择排序',
    description: '每次选择最小元素放到已排序部分末尾',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    pros: ['交换次数少', '实现简单'],
    cons: ['时间复杂度高', '不稳定排序']
  },
  {
    id: 'insertion',
    name: '插入排序',
    description: '将每个元素插入到已排序部分的正确位置',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    stable: true,
    inPlace: true,
    pros: ['对小数据集效率高', '稳定排序', '近乎有序时效率高'],
    cons: ['时间复杂度高', '对大数据集效率低']
  },
  {
    id: 'quick',
    name: '快速排序',
    description: '选择基准元素，将数组分为两部分递归排序',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    stable: false,
    inPlace: true,
    pros: ['平均时间复杂度优秀', '原地排序'],
    cons: ['最坏情况O(n²)', '不稳定排序']
  },
  {
    id: 'merge',
    name: '归并排序',
    description: '将数组分成两半，分别排序后合并',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    stable: true,
    inPlace: false,
    pros: ['时间复杂度稳定', '稳定排序'],
    cons: ['需要额外空间', '不是原地排序']
  },
  {
    id: 'heap',
    name: '堆排序',
    description: '利用堆数据结构进行排序',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(1)',
    stable: false,
    inPlace: true,
    pros: ['时间复杂度稳定', '原地排序', '不需要额外空间'],
    cons: ['不稳定排序', '实现较复杂']
  }
]

// 计算属性
const currentAlgorithm = computed(() => {
  return algorithms.find(a => a.id === selectedAlgorithm.value)
})

const maxValue = computed(() => {
  return Math.max(...array.value.map(item => item.value), 100)
})

// 监听器
watch(arraySize, () => {
  if (!isSorting.value) {
    generateArray()
  }
})

// 方法
const generateArray = () => {
  const newArray = []
  for (let i = 0; i < arraySize.value; i++) {
    newArray.push({
      value: Math.floor(Math.random() * 100) + 1,
      comparing: false,
      sorted: false,
      pivot: false
    })
  }
  array.value = newArray
  resetStats()
}

const resetStats = () => {
  comparisons.value = 0
  swaps.value = 0
  currentStep.value = ''
  status.value = '就绪'
  // 重置所有元素的样式
  array.value.forEach(item => {
    item.comparing = false
    item.sorted = false
    item.pivot = false
  })
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const startSorting = async () => {
  if (isSorting.value) return

  isSorting.value = true
  isPaused.value = false
  resetStats()
  status.value = '排序中'

  // 复制数组以避免修改原数组
  const arrCopy = array.value.map(item => ({ ...item }))

  try {
    switch (selectedAlgorithm.value) {
      case 'bubble':
        await bubbleSort(arrCopy)
        break
      case 'selection':
        await selectionSort(arrCopy)
        break
      case 'insertion':
        await insertionSort(arrCopy)
        break
      case 'quick':
        await quickSort(arrCopy, 0, arrCopy.length - 1)
        break
      case 'merge':
        await mergeSort(arrCopy, 0, arrCopy.length - 1)
        break
      case 'heap':
        await heapSort(arrCopy)
        break
    }

    // 标记所有为已排序
    arrCopy.forEach(item => item.sorted = true)
    array.value = arrCopy
    status.value = '排序完成'
  } catch (error) {
    if (error.message !== 'Sorting stopped') {
      console.error('排序出错:', error)
    }
  } finally {
    isSorting.value = false
    isPaused.value = false
  }
}

const pauseSorting = () => {
  isPaused.value = true
  status.value = '已暂停'
}

const resumeSorting = () => {
  isPaused.value = false
  status.value = '排序中'
}

const stopSorting = () => {
  isSorting.value = false
  isPaused.value = false
  status.value = '已停止'
  throw new Error('Sorting stopped')
}

const updateArray = (arr) => {
  array.value = [...arr]
}

// 排序算法实现
const bubbleSort = async (arr) => {
  const n = arr.length
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (!isSorting.value) return

      while (isPaused.value) {
        await sleep(100)
      }

      arr[j].comparing = true
      arr[j + 1].comparing = true
      updateArray(arr)
      comparisons.value++
      currentStep.value = `比较元素 ${arr[j].value} 和 ${arr[j + 1].value}`

      await sleep(speed.value)

      if (arr[j].value > arr[j + 1].value) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        swaps.value++
        currentStep.value = `交换 ${arr[j + 1].value} 和 ${arr[j].value}`
      }

      arr[j].comparing = false
      arr[j + 1].comparing = false
      updateArray(arr)
    }
    arr[n - i - 1].sorted = true
  }
  arr[0].sorted = true
}

const selectionSort = async (arr) => {
  const n = arr.length
  for (let i = 0; i < n - 1; i++) {
    if (!isSorting.value) return

    while (isPaused.value) {
      await sleep(100)
    }

    let minIdx = i
    arr[i].comparing = true
    updateArray(arr)

    for (let j = i + 1; j < n; j++) {
      if (!isSorting.value) return

      while (isPaused.value) {
        await sleep(100)
      }

      arr[j].comparing = true
      updateArray(arr)
      comparisons.value++

      if (arr[j].value < arr[minIdx].value) {
        if (minIdx !== i) arr[minIdx].comparing = false
        minIdx = j
        currentStep.value = `找到新的最小值 ${arr[j].value}`
      } else {
        arr[j].comparing = false
      }

      await sleep(speed.value)
      updateArray(arr)
    }

    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
      swaps.value++
      currentStep.value = `交换 ${arr[i].value} 和 ${arr[minIdx].value}`
    }

    arr[i].comparing = false
    arr[i].sorted = true
    if (minIdx !== i) arr[minIdx].comparing = false
    updateArray(arr)
  }
  arr[n - 1].sorted = true
}

const insertionSort = async (arr) => {
  const n = arr.length
  for (let i = 1; i < n; i++) {
    if (!isSorting.value) return

    while (isPaused.value) {
      await sleep(100)
    }

    const key = arr[i]
    let j = i - 1
    arr[i].comparing = true
    updateArray(arr)

    while (j >= 0 && arr[j].value > key.value) {
      if (!isSorting.value) return

      while (isPaused.value) {
        await sleep(100)
      }

      arr[j].comparing = true
      updateArray(arr)
      comparisons.value++
      currentStep.value = `比较 ${arr[j].value} 和 ${key.value}`

      await sleep(speed.value)

      arr[j + 1] = arr[j]
      swaps.value++
      arr[j].comparing = false
      j--
      updateArray(arr)
    }

    arr[j + 1] = key
    arr[j + 1].sorted = true
    arr[j + 1].comparing = false

    for (let k = 0; k <= i; k++) {
      arr[k].sorted = true
    }

    updateArray(arr)
    currentStep.value = `将 ${key.value} 插入到正确位置`
  }
}

const quickSort = async (arr, low, high) => {
  if (low < high && isSorting.value) {
    while (isPaused.value) {
      await sleep(100)
    }

    const pi = await partition(arr, low, high)
    await quickSort(arr, low, pi - 1)
    await quickSort(arr, pi + 1, high)
  }
}

const partition = async (arr, low, high) => {
  const pivot = arr[high]
  pivot.pivot = true
  let i = low - 1
  currentStep.value = `选择基准元素 ${pivot.value}`

  for (let j = low; j < high; j++) {
    if (!isSorting.value) return i + 1

    while (isPaused.value) {
      await sleep(100)
    }

    arr[j].comparing = true
    updateArray(arr)
    comparisons.value++

    await sleep(speed.value)

    if (arr[j].value < pivot.value) {
      i++
      [arr[i], arr[j]] = [arr[j], arr[i]]
      swaps.value++
      currentStep.value = `交换 ${arr[j].value} 和 ${arr[i].value}`
    }

    arr[j].comparing = false
    updateArray(arr)
  }

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
  arr[high].pivot = false
  arr[i + 1].sorted = true
  swaps.value++
  updateArray(arr)

  return i + 1
}

const mergeSort = async (arr, left, right) => {
  if (left < right && isSorting.value) {
    while (isPaused.value) {
      await sleep(100)
    }

    const mid = Math.floor((left + right) / 2)
    await mergeSort(arr, left, mid)
    await mergeSort(arr, mid + 1, right)
    await merge(arr, left, mid, right)
  }
}

const merge = async (arr, left, mid, right) => {
  const leftArr = arr.slice(left, mid + 1)
  const rightArr = arr.slice(mid + 1, right + 1)

  let i = 0, j = 0, k = left

  while (i < leftArr.length && j < rightArr.length && isSorting.value) {
    while (isPaused.value) {
      await sleep(100)
    }

    arr[k].comparing = true
    updateArray(arr)
    comparisons.value++

    await sleep(speed.value)

    if (leftArr[i].value <= rightArr[j].value) {
      arr[k] = leftArr[i]
      i++
    } else {
      arr[k] = rightArr[j]
      j++
    }

    arr[k].comparing = false
    arr[k].sorted = true
    updateArray(arr)
    k++
  }

  while (i < leftArr.length && isSorting.value) {
    arr[k] = leftArr[i]
    arr[k].sorted = true
    updateArray(arr)
    i++
    k++
    await sleep(speed.value / 2)
  }

  while (j < rightArr.length && isSorting.value) {
    arr[k] = rightArr[j]
    arr[k].sorted = true
    updateArray(arr)
    j++
    k++
    await sleep(speed.value / 2)
  }
}

const heapSort = async (arr) => {
  const n = arr.length

  // 构建最大堆
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    await heapify(arr, n, i)
  }

  // 逐个提取元素
  for (let i = n - 1; i > 0; i--) {
    if (!isSorting.value) return

    while (isPaused.value) {
      await sleep(100)
    }

    [arr[0], arr[i]] = [arr[i], arr[0]]
    swaps.value++
    arr[i].sorted = true
    updateArray(arr)

    await heapify(arr, i, 0)
  }
  arr[0].sorted = true
}

const heapify = async (arr, n, i) => {
  let largest = i
  const left = 2 * i + 1
  const right = 2 * i + 2

  if (left < n) {
    arr[left].comparing = true
    arr[largest].comparing = true
    updateArray(arr)
    comparisons.value++
    await sleep(speed.value)

    if (arr[left].value > arr[largest].value) {
      largest = left
    }

    arr[left].comparing = false
    arr[i].comparing = false
    updateArray(arr)
  }

  if (right < n) {
    arr[right].comparing = true
    arr[largest].comparing = true
    updateArray(arr)
    comparisons.value++
    await sleep(speed.value)

    if (arr[right].value > arr[largest].value) {
      largest = right
    }

    arr[right].comparing = false
    arr[i].comparing = false
    updateArray(arr)
  }

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]]
    swaps.value++
    updateArray(arr)
    await heapify(arr, n, largest)
  }
}

// 初始化
generateArray()

// SEO配置
useSeoMeta({
  title: '排序算法可视化工具 - 冒泡、快速、归并排序动画演示 | Util工具箱',
  description: '免费在线排序算法可视化工具，支持冒泡排序、快速排序、归并排序、堆排序等算法的动画演示，帮助理解排序算法原理。可视化展示排序过程，实时显示比较和交换次数。',
  keywords: '排序算法可视化,算法演示,冒泡排序,快速排序,归并排序,堆排序,选择排序,插入排序,在线算法学习',
  author: 'Util工具箱',
  ogTitle: '排序算法可视化工具 - 免费在线排序算法动画演示',
  ogDescription: '专业的排序算法可视化工具，支持冒泡、快速、归并、堆排序等6种经典算法动画演示，实时显示比较和交换次数，帮助理解算法原理。',
  ogImage: 'https://www.util.cn/images/tools/sorting-algorithm-visualizer.png',
  ogUrl: 'https://www.util.cn/tools/sorting-algorithm-visualizer',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '排序算法可视化工具 - 免费在线排序算法动画演示',
  twitterDescription: '专业的排序算法可视化工具，支持6种经典排序算法动画演示，实时统计数据，帮助理解算法原理。',
  twitterImage: 'https://www.util.cn/images/tools/sorting-algorithm-visualizer.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '排序算法可视化工具',
            description: '免费在线排序算法可视化工具，支持多种排序算法的动画演示',
            url: 'https://www.util.cn/tools/sorting-algorithm-visualizer',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '冒泡排序可视化',
              '快速排序可视化',
              '归并排序可视化',
              '堆排序可视化',
              '选择排序可视化',
              '插入排序可视化',
              '实时统计比较次数',
              '实时统计交换次数',
              '可调节排序速度',
              '可调节数组大小'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '排序算法可视化',
                item: 'https://www.util.cn/tools/sorting-algorithm-visualizer'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '为什么需要学习排序算法？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '排序是计算机科学中最基本的操作之一，理解和掌握排序算法对于提升编程能力和解决实际问题非常重要。不同的排序算法有各自的优缺点，在实际开发中选择合适的排序算法可以显著提升程序性能。'
                }
              },
              {
                '@type': 'Question',
                name: '时间复杂度 O(n log n) 和 O(n²) 有什么区别？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '时间复杂度描述了算法执行时间随数据规模增长的变化趋势。O(n log n) 的算法（如快速排序、归并排序）在处理大数据时比 O(n²) 的算法（如冒泡排序）快得多。例如，处理10000个数据时，O(n²) 可能需要数秒，而 O(n log n) 只需几毫秒。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是稳定排序？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '稳定排序是指相等元素的相对顺序在排序后保持不变。例如，如果原始数据中有两个相同的数字A和B，且A在B前面，稳定排序会保证排序后A仍然在B前面。冒泡排序、插入排序和归并排序是稳定的，而快速排序、选择排序和堆排序通常是不稳定的。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

</script>

<style scoped>
/* 动画效果 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>