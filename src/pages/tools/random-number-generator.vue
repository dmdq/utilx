<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Hash class="w-8 h-8 text-primary" />
        随机数字生成器
      </h1>
      <p class="text-muted-foreground">生成随机数字，支持范围、排除、抽奖模式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">数字配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 最小值 -->
          <div>
            <label class="text-sm font-medium mb-2 block">最小值</label>
            <input
              v-model.number="minValue"
              type="number"
              class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <!-- 最大值 -->
          <div>
            <label class="text-sm font-medium mb-2 block">最大值</label>
            <input
              v-model.number="maxValue"
              type="number"
              class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <!-- 生成数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">生成数量</label>
            <input
              v-model.number="count"
              type="number"
              min="1"
              max="100"
              class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <!-- 生成模式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">生成模式</label>
            <select v-model="mode" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="normal">普通模式</option>
              <option value="unique">不重复模式</option>
              <option value="lottery">抽奖模式</option>
            </select>
          </div>
        </div>

        <!-- 排除数字 -->
        <div v-if="mode === 'unique'" class="mt-6">
          <label class="text-sm font-medium mb-2 block">排除数字（用逗号分隔）</label>
          <input
            v-model="excludeInput"
            type="text"
            placeholder="例如: 7, 13, 21"
            class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- 快捷按钮 -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            @click="setRange(1, 100)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            1-100
          </button>
          <button
            @click="setRange(1, 6)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            骰子(1-6)
          </button>
          <button
            @click="setRange(0, 9)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            0-9
          </button>
          <button
            @click="count = 1"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            单个
          </button>
          <button
            @click="count = 5"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            5个
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="generateNumbers"
          :disabled="isGenerating || !canGenerate"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isGenerating" class="w-5 h-5 animate-spin" />
          <Hash v-else class="w-5 h-5" />
          {{ isGenerating ? '生成中...' : '生成数字' }}
        </button>

        <button
          v-if="results.length > 0"
          @click="clearResults"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Trash2 class="w-5 h-5" />
          清空结果
        </button>
      </div>

      <!-- 结果显示 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">生成结果</h2>
          <div class="flex gap-2">
            <button
              @click="copyResults"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制结果' }}
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="(result, index) in results"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">第 {{ index + 1 }} 次</span>
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
            </div>

            <div class="flex flex-wrap gap-2 justify-center">
              <div
                v-for="number in result.numbers"
                :key="number"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-lg transform hover:scale-110 transition-transform"
              >
                {{ number }}
              </div>
            </div>

            <div v-if="mode === 'lottery'" class="mt-3 text-center">
              <span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                幸运号码: {{ result.numbers.join(', ') }}
              </span>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ totalNumbers }}</div>
            <div class="text-muted-foreground">总数量</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ averageNumber }}</div>
            <div class="text-muted-foreground">平均值</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ maxGenerated }}</div>
            <div class="text-muted-foreground">最大值</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ minGenerated }}</div>
            <div class="text-muted-foreground">最小值</div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">生成模式说明</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">普通模式</h4>
                <p class="text-muted-foreground">数字可以重复生成，适用于常规随机数需求</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">不重复模式</h4>
                <p class="text-muted-foreground">生成的数字不重复，支持排除特定数字</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <h4 class="font-medium mb-1">抽奖模式</h4>
                <p class="text-muted-foreground">模拟抽奖效果，生成幸运号码</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">应用场景</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>随机密码和验证码生成</li>
              <li>抽奖活动和号码抽取</li>
              <li>统计采样和数据分析</li>
              <li>游戏随机数生成</li>
              <li>实验数据的随机分组</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/random-dice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Dice6 class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机骰子</p>
              <p class="text-xs text-muted-foreground">投掷虚拟骰子</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-choice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <List class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机选择器</p>
              <p class="text-xs text-muted-foreground">从列表中随机选择</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-color"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Palette class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机颜色生成</p>
              <p class="text-xs text-muted-foreground">生成随机颜色和配色</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Hash, RefreshCw, Trash2, Copy, Dice6, List, Palette, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机数字生成器 - 在线随机数工具')

// 配置
const minValue = ref(1)
const maxValue = ref(100)
const count = ref(5)
const mode = ref('normal')
const excludeInput = ref('')

// 状态
const isGenerating = ref(false)
const results = ref([])
const copied = ref(false)

// 计算属性
const excludeNumbers = computed(() => {
  if (!excludeInput.value.trim()) return []
  return excludeInput.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
})

const canGenerate = computed(() => {
  if (minValue.value > maxValue.value) return false
  if (mode.value === 'unique') {
    const availableCount = maxValue.value - minValue.value + 1 - excludeNumbers.value.length
    return availableCount >= count.value
  }
  return true
})

const totalNumbers = computed(() => {
  return results.value.reduce((total, result) => total + result.numbers.length, 0)
})

const allNumbers = computed(() => {
  return results.value.flatMap(result => result.numbers)
})

const averageNumber = computed(() => {
  if (allNumbers.value.length === 0) return 0
  const sum = allNumbers.value.reduce((a, b) => a + b, 0)
  return (sum / allNumbers.value.length).toFixed(1)
})

const maxGenerated = computed(() => {
  if (allNumbers.value.length === 0) return 0
  return Math.max(...allNumbers.value)
})

const minGenerated = computed(() => {
  if (allNumbers.value.length === 0) return 0
  return Math.min(...allNumbers.value)
})

// 设置范围
const setRange = (min, max) => {
  minValue.value = min
  maxValue.value = max
}

// 生成随机数
const generateNumbers = async () => {
  if (isGenerating.value || !canGenerate.value) return

  isGenerating.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  const numbers = []

  if (mode.value === 'normal') {
    for (let i = 0; i < count.value; i++) {
      const num = Math.floor(Math.random() * (maxValue.value - minValue.value + 1)) + minValue.value
      numbers.push(num)
    }
  } else if (mode.value === 'unique') {
    const available = []
    for (let i = minValue.value; i <= maxValue.value; i++) {
      if (!excludeNumbers.value.includes(i)) {
        available.push(i)
      }
    }

    for (let i = 0; i < Math.min(count.value, available.length); i++) {
      const index = Math.floor(Math.random() * available.length)
      numbers.push(available.splice(index, 1)[0])
    }
  } else if (mode.value === 'lottery') {
    // 彩票模式：生成独特的"幸运"号码
    for (let i = 0; i < count.value; i++) {
      const num = Math.floor(Math.random() * (maxValue.value - minValue.value + 1)) + minValue.value
      numbers.push(num)
    }
    // 排序以模拟彩票效果
    numbers.sort((a, b) => a - b)
  }

  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  results.value.unshift({
    numbers,
    timestamp
  })

  if (results.value.length > 20) {
    results.value = results.value.slice(0, 20)
  }

  isGenerating.value = false
}

// 清空结果
const clearResults = () => {
  results.value = []
}

// 复制结果
const copyResults = async () => {
  try {
    const text = results.value.map((result, index) => {
      return `第${index + 1}次: ${result.numbers.join(', ')}`
    }).join('\n')

    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}
</script>