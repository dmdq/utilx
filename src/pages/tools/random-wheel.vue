<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">随机大转盘 - 自定义抽奖转盘工具</h1>
      <p class="text-muted-foreground">自定义奖项的转盘抽奖工具，支持编辑奖项内容和概率。完美用于活动抽奖、决策制定、游戏娱乐等场景。</p>
    </div>

    <!-- 主要功能区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <!-- 左侧：转盘区域 -->
      <div class="lg:col-span-2">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex justify-center mb-6">
            <!-- Canvas 转盘 -->
            <div class="relative">
              <canvas
                ref="wheelCanvas"
                :width="canvasSize"
                :height="canvasSize"
                class="border-4 border-primary rounded-full shadow-2xl"
              ></canvas>
              <!-- 指针 -->
              <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div class="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-red-500 drop-shadow-lg"></div>
              </div>
            </div>
          </div>

          <!-- 控制按钮 -->
          <div class="flex justify-center gap-4 mb-6">
            <button
              @click="startSpin"
              :disabled="isSpinning"
              class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <span v-if="isSpinning">转动中...</span>
              <span v-else>开始抽奖</span>
            </button>
            <button
              @click="resetWheel"
              class="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              重置转盘
            </button>
          </div>

          <!-- 结果显示 -->
          <div v-if="winner" class="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-600">
            <h3 class="text-2xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">🎉 恭喜！</h3>
            <p class="text-lg text-yellow-700 dark:text-yellow-400">抽中了：<span class="font-bold">{{ winner.text }}</span></p>
          </div>
        </div>
      </div>

      <!-- 右侧：奖项管理 -->
      <div class="lg:col-span-1">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-foreground">奖项设置</h2>
            <div class="flex gap-2">
              <button
                @click="addPrize"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
              >
                添加奖项
              </button>
              <button
                @click="loadPreset"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
              >
                预设模板
              </button>
            </div>
          </div>

          <!-- 奖项列表 -->
          <div class="space-y-3 max-h-[600px] overflow-y-auto">
            <div
              v-for="(prize, index) in prizes"
              :key="prize.id"
              class="p-3 bg-muted border border-border rounded-lg"
            >
              <div class="flex items-center gap-3 mb-2">
                <input
                  v-model="prize.color"
                  type="color"
                  class="w-8 h-8 rounded cursor-pointer"
                >
                <input
                  v-model="prize.text"
                  type="text"
                  placeholder="奖项名称"
                  class="flex-1 px-2 py-1 bg-background border border-border rounded text-sm"
                  @input="updateWheel"
                >
                <button
                  @click="removePrize(prize.id)"
                  class="p-1 text-destructive hover:bg-destructive/10 rounded"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">权重:</span>
                <input
                  v-model.number="prize.weight"
                  type="number"
                  min="1"
                  max="100"
                  class="w-16 px-2 py-1 bg-background border border-border rounded text-sm"
                  @input="updateWheel"
                >
                <span class="text-xs text-muted-foreground ml-2">
                  {{ getPrizePercentage(prize) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="mt-4 p-3 bg-muted/50 rounded text-sm text-muted-foreground">
            <div class="flex justify-between mb-1">
              <span>总奖项数：</span>
              <span class="font-medium">{{ prizes.length }}</span>
            </div>
            <div class="flex justify-between">
              <span>总权重：</span>
              <span class="font-medium">{{ totalWeight }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="bg-card border border-border rounded-lg p-6">
      <h2 class="text-xl font-semibold text-foreground mb-4">使用说明</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-muted-foreground">
        <div>
          <h3 class="font-medium text-foreground mb-2">🎯 基本使用</h3>
          <ul class="space-y-1 text-sm">
            <li>• 点击"添加奖项"创建新的奖项</li>
            <li>• 设置奖项名称、颜色和权重</li>
            <li>• 权重越高，中奖概率越大</li>
            <li>• 点击"开始抽奖"启动转盘</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium text-foreground mb-2">⚙️ 高级功能</h3>
          <ul class="space-y-1 text-sm">
            <li>• 使用"预设模板"快速设置常用奖项</li>
            <li>• 自定义每个奖项的颜色区分</li>
            <li>• 调整权重控制中奖概率</li>
            <li>• 支持任意数量的奖项</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mt-12">
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Trash2, Dice6, Heart, Circle, Utensils, Hash, List,
  Palette, Users, Activity
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: '随机大转盘 - 自定义抽奖转盘工具 | Util工具箱',
  description: '专业的随机大转盘抽奖工具，支持自定义奖项内容、颜色和权重。完美适用于活动抽奖、决策制定、游戏娱乐等场景。纯本地处理，数据安全可靠。',
  keywords: '随机大转盘,抽奖工具,转盘抽奖,决策工具,活动抽奖,游戏转盘,自定义奖项,概率控制',
  author: 'Util工具箱',
  ogTitle: '随机大转盘 - 专业抽奖转盘工具',
  ogDescription: '支持自定义奖项和权重的专业转盘抽奖工具，完美适用于各种抽奖场景。',
  ogImage: 'https://util.cn/images/tools/random-wheel.png',
  ogUrl: 'https://util.cn/tools/random-wheel',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '随机大转盘 - 专业抽奖转盘工具',
  twitterDescription: '支持自定义奖项和权重的专业转盘抽奖工具，完美适用于各种抽奖场景。',
  twitterImage: 'https://util.cn/images/tools/random-wheel.png'
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
            name: '随机大转盘',
            description: '自定义奖项的转盘抽奖工具，支持编辑奖项内容和概率',
            url: 'https://util.cn/tools/random-wheel',
            applicationCategory: 'EntertainmentApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '自定义奖项设置',
              '权重概率控制',
              '颜色自定义',
              '预设模板',
              '本地安全处理',
              '流畅动画效果'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '随机决策',
                item: 'https://util.cn/tools?category=random'
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: '随机大转盘',
                item: 'https://util.cn/tools/random-wheel'
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'random-wheel')
const category = categories.find(c => c.id === 'random')

// Canvas 相关
const wheelCanvas = ref(null)
const canvasSize = 400
const isSpinning = ref(false)
const winner = ref(null)

// 奖品数据
const prizes = ref([])

// 预设模板
const presetTemplates = {
  simple: [
    { text: '一等奖', color: '#FF6B6B', weight: 5 },
    { text: '二等奖', color: '#4ECDC4', weight: 10 },
    { text: '三等奖', color: '#45B7D1', weight: 20 },
    { text: '谢谢参与', color: '#96CEB4', weight: 30 }
  ],
  decision: [
    { text: '去做', color: '#2ECC71', weight: 1 },
    { text: '不做', color: '#E74C3C', weight: 1 },
    { text: '再想想', color: '#F39C12', weight: 1 }
  ],
  food: [
    { text: '火锅', color: '#FF6B6B', weight: 3 },
    { text: '烧烤', color: '#4ECDC4', weight: 3 },
    { text: '日料', color: '#45B7D1', weight: 2 },
    { text: '西餐', color: '#96CEB4', weight: 2 },
    { text: '中餐', color: '#FFEAA7', weight: 3 },
    { text: '快餐', color: '#DDA0DD', weight: 2 }
  ],
  team: [
    { text: '红队', color: '#FF6B6B', weight: 1 },
    { text: '蓝队', color: '#4ECDC4', weight: 1 },
    { text: '绿队', color: '#96CEB4', weight: 1 },
    { text: '黄队', color: '#FFEAA7', weight: 1 }
  ]
}

// 计算总权重
const totalWeight = computed(() => {
  return prizes.value.reduce((sum, prize) => sum + prize.weight, 0)
})

// 计算每个奖项的百分比
const getPrizePercentage = (prize) => {
  if (totalWeight.value === 0) return 0
  return ((prize.weight / totalWeight.value) * 100).toFixed(1)
}

// 图标映射
const iconMap = {
  Trash2, Dice6, Heart, Circle, Utensils, Hash, List,
  Palette, Users, Activity
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'random' && t.id !== 'random-wheel'
  ).slice(0, 4)

  return sameCategory
})

// 初始化默认数据
const initializePrizes = () => {
  if (prizes.value.length === 0) {
    loadPreset('simple')
  }
}

// 绘制转盘
const drawWheel = () => {
  const canvas = wheelCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const centerX = canvasSize / 2
  const centerY = canvasSize / 2
  const radius = canvasSize / 2 - 10

  // 清空画布
  ctx.clearRect(0, 0, canvasSize, canvasSize)

  if (prizes.value.length === 0) {
    // 绘制空转盘
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#f1f5f9'
    ctx.fill()
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#64748b'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('请添加奖项', centerX, centerY)
    return
  }

  // 计算每个奖项的角度
  let currentAngle = -Math.PI / 2 // 从顶部开始

  prizes.value.forEach((prize, index) => {
    const percentage = prize.weight / totalWeight.value
    const prizeAngle = percentage * 2 * Math.PI

    // 绘制扇形
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + prizeAngle)
    ctx.closePath()
    ctx.fillStyle = prize.color
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    // 绘制文字
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(currentAngle + prizeAngle / 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px sans-serif'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 3
    ctx.fillText(prize.text, radius / 3, 0)
    ctx.restore()

    currentAngle += prizeAngle
  })

  // 绘制中心圆
  ctx.beginPath()
  ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI)
  ctx.fillStyle = '#1f2937'
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()
}

// 开始转动
const startSpin = () => {
  if (isSpinning.value || prizes.value.length === 0) return

  isSpinning.value = true
  winner.value = null

  const canvas = wheelCanvas.value
  const duration = 3000 + Math.random() * 2000 // 3-5秒
  const startTime = Date.now()
  const totalRotation = (Math.PI * 2 * 5) + (Math.random() * Math.PI * 2) // 至少转5圈

  // 根据权重选择获奖者
  const random = Math.random() * totalWeight.value
  let accumulator = 0
  let selectedPrize = null

  for (const prize of prizes.value) {
    accumulator += prize.weight
    if (random <= accumulator) {
      selectedPrize = prize
      break
    }
  }

  const animate = () => {
    const now = Date.now()
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 缓动函数
    const easeOut = 1 - Math.pow(1 - progress, 3)
    const currentRotation = totalRotation * easeOut

    const canvas = wheelCanvas.value
    const ctx = canvas.getContext('2d')

    ctx.save()
    ctx.translate(canvasSize / 2, canvasSize / 2)
    ctx.rotate(currentRotation)
    ctx.translate(-canvasSize / 2, -canvasSize / 2)

    drawWheel()

    ctx.restore()

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      isSpinning.value = false
      winner.value = selectedPrize
    }
  }

  animate()
}

// 重置转盘
const resetWheel = () => {
  isSpinning.value = false
  winner.value = null
  drawWheel()
}

// 添加奖项
const addPrize = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFA07A', '#20B2AA']
  const newPrize = {
    id: Date.now(),
    text: `奖项${prizes.value.length + 1}`,
    color: colors[prizes.value.length % colors.length],
    weight: 10
  }
  prizes.value.push(newPrize)
  updateWheel()
}

// 移除奖项
const removePrize = (id) => {
  const index = prizes.value.findIndex(prize => prize.id === id)
  if (index > -1) {
    prizes.value.splice(index, 1)
    updateWheel()
  }
}

// 加载预设
const loadPreset = (templateName) => {
  let selectedPreset
  if (typeof templateName === 'string') {
    selectedPreset = presetTemplates[templateName]
  } else {
    // 如果没有指定模板，显示选择菜单
    const templates = Object.keys(presetTemplates)
    const selected = prompt(`选择预设模板：\n${templates.map((t, i) => `${i + 1}. ${t}`).join('\n')}`, '1')
    const templateIndex = parseInt(selected) - 1
    if (templateIndex >= 0 && templateIndex < templates.length) {
      selectedPreset = presetTemplates[templates[templateIndex]]
    } else {
      selectedPreset = presetTemplates.simple
    }
  }

  if (selectedPreset) {
    prizes.value = selectedPreset.map((prize, index) => ({
      ...prize,
      id: Date.now() + index
    }))
    updateWheel()
  }
}

// 更新转盘
const updateWheel = () => {
  nextTick(() => {
    drawWheel()
  })
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 组件挂载时初始化
onMounted(() => {
  initializePrizes()
  nextTick(() => {
    drawWheel()
  })
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>