<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Circle class="w-8 h-8 text-primary" />
        随机硬币
      </h1>
      <p class="text-muted-foreground">抛硬币做决定，支持多次抛掷和统计</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">硬币配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 抛掷次数 -->
          <div>
            <label class="text-sm font-medium mb-2 block">抛掷次数</label>
            <div class="flex gap-2">
              <input
                v-model.number="flipCount"
                type="number"
                min="1"
                max="100"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">次</span>
            </div>
          </div>

          <!-- 硬币类型 -->
          <div>
            <label class="text-sm font-medium mb-2 block">硬币类型</label>
            <select v-model="coinType" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="heads-tails">正面/反面</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <!-- 自定义选项 -->
          <div v-if="coinType === 'custom'">
            <label class="text-sm font-medium mb-2 block">自定义选项</label>
            <div class="flex gap-2">
              <input
                v-model="customOptions[0]"
                type="text"
                placeholder="选项1"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                v-model="customOptions[1]"
                type="text"
                placeholder="选项2"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <!-- 快捷按钮 -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            @click="flipCount = 1"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            1次
          </button>
          <button
            @click="flipCount = 10"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            10次
          </button>
          <button
            @click="flipCount = 100"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            100次
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="flipCoin"
          :disabled="isFlipping"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isFlipping" class="w-5 h-5 animate-spin" />
          <Circle v-else class="w-5 h-5" />
          {{ isFlipping ? '抛掷中...' : '抛硬币' }}
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

      <!-- 硬币动画 -->
      <div v-if="isFlipping" class="bg-card border border-border rounded-lg p-12">
        <div class="flex justify-center">
          <div class="w-20 h-20 bg-primary rounded-full flex items-center justify-center animate-bounce">
            <span class="text-white text-2xl font-bold">?</span>
          </div>
        </div>
      </div>

      <!-- 单次结果 -->
      <div v-if="latestResult && !isFlipping" class="bg-card border border-border rounded-lg p-12">
        <div class="text-center">
          <div class="mb-4 text-sm text-muted-foreground">最新抛掷结果</div>
          <div
            :class="[
              'inline-block px-8 py-4 rounded-lg text-3xl font-bold',
              latestResult === currentOptions[0] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            ]"
          >
            {{ latestResult }}
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">统计信息</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 class="font-medium mb-3">{{ currentOptions[0] }} (正面)</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">次数</span>
                <span class="font-bold">{{ headsCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">比例</span>
                <span class="font-bold">{{ headsPercentage }}%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full" :style="{ width: headsPercentage + '%' }"></div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-3">{{ currentOptions[1] }} (反面)</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">次数</span>
                <span class="font-bold">{{ tailsCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">比例</span>
                <span class="font-bold">{{ tailsPercentage }}%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="bg-red-500 h-2 rounded-full" :style="{ width: tailsPercentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 连续记录 -->
        <div v-if="showSequence" class="mt-6">
          <h3 class="font-medium mb-3">连续记录</h3>
          <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            <div
              v-for="(result, index) in results"
              :key="index"
              :class="[
                'px-3 py-1 rounded text-sm font-mono',
                result === currentOptions[0] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              ]"
            >
              {{ result[0] }}
            </div>
          </div>
        </div>
      </div>

      <!-- 历史记录 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">历史记录</h2>
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

        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="(result, index) in groupedResults"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
              <div class="flex gap-2">
                <div class="flex gap-1">
                  <div
                    v-for="(item, itemIndex) in result.items"
                    :key="itemIndex"
                    :class="[
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      item === currentOptions[0] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    ]"
                  >
                    {{ item[0] }}
                  </div>
                </div>
                <span class="text-xs text-muted-foreground">{{ result.items.length }}次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">功能特点</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>支持单次或批量抛掷硬币</li>
              <li>实时统计正反面次数和概率</li>
              <li>支持自定义选项名称</li>
              <li>可视化连续记录显示</li>
              <li>保存历史记录便于分析</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">概率理论</h3>
            <p class="text-muted-foreground">
              理论上，公平硬币的正反面概率各为50%。在大样本量下，实际结果会趋近理论概率。
              小样本可能出现偏差，这是正常的随机现象。
            </p>
          </div>

          <div>
            <h3 class="font-medium mb-2">常见用途</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>二元选择的决策辅助</li>
              <li>体育比赛中的开球选择</li>
              <li>概率统计教学演示</li>
              <li>游戏和娱乐活动</li>
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
            to="/tools/random-cards"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Heart class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机扑克牌</p>
              <p class="text-xs text-muted-foreground">从牌堆中随机抽牌</p>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Circle, RefreshCw, Trash2, Copy, Dice6, Heart, List, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机硬币 - 在线抛硬币工具')

// 配置
const flipCount = ref(1)
const coinType = ref('heads-tails')
const customOptions = ref(['选项A', '选项B'])

// 状态
const isFlipping = ref(false)
const results = ref([])
const latestResult = ref('')
const showSequence = ref(false)
const copied = ref(false)

// 计算属性
const currentOptions = computed(() => {
  return coinType.value === 'custom' ? customOptions.value : ['正面', '反面']
})

const headsCount = computed(() => {
  return results.value.flat().filter(r => r === currentOptions.value[0]).length
})

const tailsCount = computed(() => {
  return results.value.flat().filter(r => r === currentOptions.value[1]).length
})

const totalFlips = computed(() => {
  return results.value.flat().length
})

const headsPercentage = computed(() => {
  if (totalFlips.value === 0) return 0
  return ((headsCount.value / totalFlips.value) * 100).toFixed(1)
})

const tailsPercentage = computed(() => {
  if (totalFlips.value === 0) return 0
  return ((tailsCount.value / totalFlips.value) * 100).toFixed(1)
})

const groupedResults = computed(() => {
  const grouped = []
  const now = Date.now()

  results.value.forEach((result, index) => {
    const timestamp = new Date(now - (index * 60000))
    const timeStr = timestamp.toLocaleTimeString()

    const lastGroup = grouped[grouped.length - 1]
    if (lastGroup && Math.abs(new Date(lastGroup.timestamp).getTime() - timestamp.getTime()) < 5000) {
      lastGroup.items.push(...result)
    } else {
      grouped.push({
        timestamp: timeStr,
        items: [...result]
      })
    }
  })

  return grouped
})

// 抛硬币
const flipCoin = async () => {
  if (isFlipping.value) return

  isFlipping.value = true
  latestResult.value = ''

  // 模拟抛掷动画
  await new Promise(resolve => setTimeout(resolve, 1000))

  const flips = []
  for (let i = 0; i < flipCount.value; i++) {
    const result = Math.random() < 0.5 ? currentOptions.value[0] : currentOptions.value[1]
    flips.push(result)
  }

  latestResult.value = flips[0]
  results.value.unshift(flips)

  // 限制结果数量
  if (results.value.length > 100) {
    results.value = results.value.slice(0, 100)
  }

  isFlipping.value = false
  showSequence.value = true
}

// 清空结果
const clearResults = () => {
  results.value = []
  latestResult.value = ''
  showSequence.value = false
}

// 复制结果
const copyResults = async () => {
  try {
    const text = results.value.map((flip, index) => {
      return `${index + 1}: ${flip.join(', ')}`
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