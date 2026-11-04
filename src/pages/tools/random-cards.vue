<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Heart class="w-8 h-8 text-primary" />
        随机扑克牌
      </h1>
      <p class="text-muted-foreground">从牌堆中随机抽取扑克牌，支持多种玩法</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">牌堆配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 牌堆类型 -->
          <div>
            <label class="text-sm font-medium mb-2 block">牌堆类型</label>
            <select v-model="deckType" class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="standard">标准52张牌</option>
              <option value="with-jokers">54张牌（含大小王）</option>
              <option value="single-suit">同花色13张</option>
              <option value="numbers">数字牌（2-10）</option>
              <option value="face-cards">人头牌（J,Q,K,A）</option>
            </select>
          </div>

          <!-- 抽牌数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">抽牌数量</label>
            <div class="flex gap-2">
              <input
                v-model.number="drawCount"
                type="number"
                min="1"
                max="10"
                class="flex-1 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">张</span>
            </div>
          </div>

          <!-- 抽牌方式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">抽牌方式</label>
            <select v-model="drawMode" class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="with-replacement">有放回抽牌</option>
              <option value="without-replacement">无放回抽牌</option>
            </select>
          </div>
        </div>

        <!-- 快捷按钮 -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            @click="drawCount = 1"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            抽1张
          </button>
          <button
            @click="drawCount = 5"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            抽5张（扑克）
          </button>
          <button
            @click="deckType = 'standard'"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            标准牌
          </button>
          <button
            @click="drawCount = 13"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            一副手牌
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="drawCards"
          :disabled="isDrawing || (drawMode === 'without-replacement' && remainingCards.length < drawCount)"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isDrawing" class="w-5 h-5 animate-spin" />
          <Heart v-else class="w-5 h-5" />
          {{ isDrawing ? '抽牌中...' : '抽牌' }}
        </button>

        <button
          @click="resetDeck"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <RotateCcw class="w-5 h-5" />
          重置牌堆
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

      <!-- 牌堆状态 -->
      <div v-if="drawMode === 'without-replacement'" class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">牌堆状态</h3>
        <div class="grid grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-primary">{{ remainingCards.length }}</div>
            <div class="text-sm text-muted-foreground">剩余牌数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ deckSize - remainingCards.length }}</div>
            <div class="text-sm text-muted-foreground">已抽牌数</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ Math.round(remainingCards.length / deckSize * 100) }}%</div>
            <div class="text-sm text-muted-foreground">剩余比例</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-primary">{{ results.length }}</div>
            <div class="text-sm text-muted-foreground">抽牌次数</div>
          </div>
        </div>
      </div>

      <!-- 结果显示 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">抽牌结果</h2>
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
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-muted-foreground">第 {{ index + 1 }} 次</span>
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
            </div>

            <div class="flex justify-center gap-2 flex-wrap">
              <div
                v-for="card in result.cards"
                :key="card.id"
                :class="[ 'w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center text-lg font-bold transform hover:scale-110 transition-transform', card.suit === '♥' || card.suit === '♦' ? 'bg-red-50 border-red-300 text-red-600' : 'bg-gray-50 border-border text-gray-800' ]"
              >
                <div class="text-sm">{{ card.rank }}</div>
                <div class="text-2xl">{{ card.suit }}</div>
              </div>
            </div>

            <!-- 牌型分析 -->
            <div v-if="result.handRank" class="mt-4 text-center">
              <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {{ result.handRank }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">统计信息</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ totalDraws }}</div>
            <div class="text-muted-foreground">总抽牌数</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ suitStats.heart || 0 }}</div>
            <div class="text-muted-foreground">红桃</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ suitStats.diamond || 0 }}</div>
            <div class="text-muted-foreground">方块</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ suitStats.club || 0 }}</div>
            <div class="text-muted-foreground">梅花</div>
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
              <li>支持标准52张牌和54张牌（含大小王）</li>
              <li>支持有放回和无放回两种抽牌模式</li>
              <li>可自定义抽牌数量和牌堆类型</li>
              <li>自动识别扑克牌型（5张牌时）</li>
              <li>实时统计花色分布和牌堆状态</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">常见用途</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>扑克游戏和纸牌游戏</li>
              <li>魔术表演和娱乐活动</li>
              <li>概率统计教学</li>
              <li>随机分组和选择</li>
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
import { Heart, RefreshCw, Trash2, Copy, RotateCcw, Dice6, Circle, Hash, ArrowRight } from 'lucide-vue-next'



import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机扑克牌 - 在线抽牌工具')

// 配置
const deckType = ref('standard')
const drawCount = ref(5)
const drawMode = ref('without-replacement')

// 状态
const isDrawing = ref(false)
const results = ref([])
const remainingCards = ref([])
const copied = ref(false)

// 牌堆定义
const createDeck = () => {
  const suits = ['♠', '♥', '♦', '♣']
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const deck = []

  if (deckType.value === 'standard') {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ id: `${rank}${suit}`, rank, suit, value: getCardValue(rank) })
      }
    }
  } else if (deckType.value === 'with-jokers') {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ id: `${rank}${suit}`, rank, suit, value: getCardValue(rank) })
      }
    }
    deck.push({ id: 'Joker1', rank: '🃏', suit: '', value: 15 })
    deck.push({ id: 'Joker2', rank: '🃏', suit: '', value: 15 })
  } else if (deckType.value === 'single-suit') {
    for (const rank of ranks) {
      deck.push({ id: `${rank}♠`, rank, suit: '♠', value: getCardValue(rank) })
    }
  } else if (deckType.value === 'numbers') {
    for (const suit of suits) {
      for (const rank of ranks.slice(0, 9)) {
        deck.push({ id: `${rank}${suit}`, rank, suit, value: getCardValue(rank) })
      }
    }
  } else if (deckType.value === 'face-cards') {
    for (const suit of suits) {
      for (const rank of ranks.slice(9)) {
        deck.push({ id: `${rank}${suit}`, rank, suit, value: getCardValue(rank) })
      }
    }
  }

  return deck
}

// 计算牌值
const getCardValue = (rank) => {
  if (rank === 'A') return 14
  if (rank === 'K') return 13
  if (rank === 'Q') return 12
  if (rank === 'J') return 11
  return parseInt(rank)
}

// 牌堆大小
const deckSize = computed(() => createDeck().length)

// 总抽牌数
const totalDraws = computed(() => {
  return results.value.reduce((total, result) => total + result.cards.length, 0)
})

// 花色统计
const suitStats = computed(() => {
  const stats = { heart: 0, diamond: 0, club: 0, spade: 0 }
  results.value.forEach(result => {
    result.cards.forEach(card => {
      if (card.suit === '♥') stats.heart++
      else if (card.suit === '♦') stats.diamond++
      else if (card.suit === '♣') stats.club++
      else if (card.suit === '♠') stats.spade++
    })
  })
  return stats
})

// 初始化牌堆
const initDeck = () => {
  remainingCards.value = [...createDeck()]
}

// 抽牌
const drawCards = async () => {
  if (isDrawing.value) return

  isDrawing.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  const deck = drawMode.value === 'without-replacement' ? remainingCards.value : createDeck()
  const drawnCards = []

  for (let i = 0; i < drawCount.value; i++) {
    if (drawMode.value === 'without-replacement' && remainingCards.value.length === 0) break

    const randomIndex = Math.floor(Math.random() * deck.length)
    const card = deck.splice(randomIndex, 1)[0]

    if (drawMode.value === 'without-replacement') {
      remainingCards.value.splice(randomIndex, 1)
    }

    drawnCards.push(card)
  }

  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  const result = {
    cards: drawnCards,
    timestamp
  }

  // 5张牌时分析牌型
  if (drawnCards.length === 5) {
    result.handRank = analyzeHand(drawnCards)
  }

  results.value.unshift(result)
  if (results.value.length > 20) {
    results.value = results.value.slice(0, 20)
  }

  isDrawing.value = false
}

// 分析牌型
const analyzeHand = (cards) => {
  const ranks = cards.map(c => c.rank).sort()
  const suits = cards.map(c => c.suit)
  const values = cards.map(c => c.value).sort((a, b) => a - b)

  const rankCounts = {}
  ranks.forEach(rank => {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1
  })

  const counts = Object.values(rankCounts).sort((a, b) => b - a)
  const isFlush = suits.every(suit => suit === suits[0])
  const isStraight = values.every((val, i) => i === 0 || val === values[i - 1] + 1)

  if (isFlush && isStraight && values[4] === 14) return '皇家同花顺'
  if (isFlush && isStraight) return '同花顺'
  if (counts[0] === 4) return '四条'
  if (counts[0] === 3 && counts[1] === 2) return '葫芦'
  if (isFlush) return '同花'
  if (isStraight) return '顺子'
  if (counts[0] === 3) return '三条'
  if (counts[0] === 2 && counts[1] === 2) return '两对'
  if (counts[0] === 2) return '一对'
  return '高牌'
}

// 重置牌堆
const resetDeck = () => {
  initDeck()
  results.value = []
}

// 清空结果
const clearResults = () => {
  results.value = []
}

// 复制结果
const copyResults = async () => {
  try {
    const text = results.value.map((result, index) => {
      const cards = result.cards.map(c => c.id).join(' ')
      return `第${index + 1}次: ${cards}`
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

// 初始化
initDeck()
</script>