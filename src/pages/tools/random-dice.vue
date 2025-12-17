<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Dice6 class="w-8 h-8 text-primary" />
        随机骰子
      </h1>
      <p class="text-muted-foreground">投掷虚拟骰子，支持多种面数和多个骰子</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">骰子配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 骰子面数 -->
          <div>
            <label class="text-sm font-medium mb-2 block">骰子面数</label>
            <select v-model="diceSides" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="4">4面骰子 (D4)</option>
              <option value="6">6面骰子 (D6)</option>
              <option value="8">8面骰子 (D8)</option>
              <option value="10">10面骰子 (D10)</option>
              <option value="12">12面骰子 (D12)</option>
              <option value="20">20面骰子 (D20)</option>
              <option value="100">100面骰子 (D100)</option>
            </select>
          </div>

          <!-- 骰子数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">骰子数量</label>
            <div class="flex gap-2">
              <input
                v-model.number="diceCount"
                type="number"
                min="1"
                max="20"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">个</span>
            </div>
          </div>

          <!-- 修正值 -->
          <div>
            <label class="text-sm font-medium mb-2 block">修正值</label>
            <div class="flex gap-2">
              <input
                v-model.number="modifier"
                type="number"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">+/-</span>
            </div>
          </div>
        </div>

        <!-- 快捷按钮 -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            @click="diceCount = 1"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            1个骰子
          </button>
          <button
            @click="diceCount = 2"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            2个骰子
          </button>
          <button
            @click="diceCount = 3"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            3个骰子
          </button>
          <button
            @click="diceSides = '6'"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            D6
          </button>
          <button
            @click="diceSides = '20'"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            D20
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="rollDice"
          :disabled="isRolling"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isRolling" class="w-5 h-5 animate-spin" />
          <Dice6 v-else class="w-5 h-5" />
          {{ isRolling ? '投掷中...' : '投掷骰子' }}
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
          <h2 class="text-lg font-semibold">投掷结果</h2>
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
              <span class="font-mono text-sm">{{ result.timestamp }}</span>
            </div>

            <div class="flex items-center justify-center gap-4 py-6">
              <div class="flex gap-2">
                <div
                  v-for="(die, dieIndex) in result.dice"
                  :key="dieIndex"
                  class="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-lg transform hover:scale-110 transition-transform"
                >
                  {{ die }}
                </div>
              </div>

              <div v-if="result.modifier !== 0" class="flex items-center gap-1 text-lg">
                <span class="text-muted-foreground">{{ result.modifier > 0 ? '+' : '' }}{{ result.modifier }}</span>
                <span class="text-muted-foreground">=</span>
              </div>

              <div class="text-2xl font-bold text-primary">
                {{ result.total }}
              </div>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ results.length }}</div>
            <div class="text-muted-foreground">总次数</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ averageResult }}</div>
            <div class="text-muted-foreground">平均值</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ maxResult }}</div>
            <div class="text-muted-foreground">最大值</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ minResult }}</div>
            <div class="text-muted-foreground">最小值</div>
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
              <li>支持4面、6面、8面、10面、12面、20面、100面骰子</li>
              <li>可同时投掷1-20个骰子</li>
              <li>支持正负修正值计算</li>
              <li>实时统计平均值、最大值、最小值</li>
              <li>支持批量复制投掷结果</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">常见用途</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>桌面角色扮演游戏（TRPG）</li>
              <li>桌面游戏和聚会游戏</li>
              <li>概率统计教学</li>
              <li>随机决策和选择</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/random-coin"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Circle class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机硬币</p>
              <p class="text-xs text-muted-foreground">抛硬币做决定</p>
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
            to="/tools/random-number-generator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机数字生成器</p>
              <p class="text-xs text-muted-foreground">生成指定范围的随机数</p>
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
import { Dice6, RefreshCw, Trash2, Copy, Circle, Heart, Hash, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机骰子 - 在线投掷虚拟骰子工具')

// 配置
const diceSides = ref('6')
const diceCount = ref(1)
const modifier = ref(0)

// 状态
const isRolling = ref(false)
const results = ref([])
const copied = ref(false)

// 计算属性
const averageResult = computed(() => {
  if (results.value.length === 0) return 0
  const sum = results.value.reduce((acc, result) => acc + result.total, 0)
  return (sum / results.value.length).toFixed(1)
})

const maxResult = computed(() => {
  if (results.value.length === 0) return 0
  return Math.max(...results.value.map(r => r.total))
})

const minResult = computed(() => {
  if (results.value.length === 0) return 0
  return Math.min(...results.value.map(r => r.total))
})

// 投掷骰子
const rollDice = async () => {
  if (isRolling.value) return

  isRolling.value = true

  // 模拟投掷动画
  await new Promise(resolve => setTimeout(resolve, 800))

  const dice = []
  let total = 0

  for (let i = 0; i < diceCount.value; i++) {
    const value = Math.floor(Math.random() * parseInt(diceSides.value)) + 1
    dice.push(value)
    total += value
  }

  total += modifier.value

  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  results.value.unshift({
    dice,
    total,
    modifier: modifier.value,
    timestamp
  })

  // 限制结果数量
  if (results.value.length > 50) {
    results.value = results.value.slice(0, 50)
  }

  isRolling.value = false
}

// 清空结果
const clearResults = () => {
  results.value = []
}

// 复制结果
const copyResults = async () => {
  try {
    const text = results.value.map((result, index) => {
      const diceStr = result.dice.join(' + ')
      const modifierStr = result.modifier !== 0 ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` : ''
      return `第${index + 1}次: ${diceStr}${modifierStr} = ${result.total}`
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