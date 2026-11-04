<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">FPS在线测试工具</h1>
      <p class="text-muted-foreground">实时测试浏览器的帧率（FPS），评估动画性能和渲染能力</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：测试控制和结果 -->
      <div class="space-y-4">
        <!-- 当前FPS -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gauge class="w-5 h-5 text-primary" />
            实时帧率
          </h2>

          <div class="text-center">
            <div class="relative inline-block">
              <svg class="w-48 h-48" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" stroke-width="12"/>
                <circle cx="100" cy="100" r="90" fill="none" :stroke="getFpsColor(currentFps)" stroke-width="12"
                  stroke-dasharray="565.48" stroke-dashoffset="565.48" :stroke-dashoffset="565.48 - (565.48 * Math.min(currentFps / 60, 1))"
                  stroke-linecap="round" transform="rotate(-90 100 100)"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-5xl font-bold" :style="{ color: getFpsColor(currentFps) }">{{ currentFps }}</span>
                <span class="text-sm text-muted-foreground">FPS</span>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div class="p-3 bg-muted rounded">
                <p class="text-muted-foreground">最低</p>
                <p class="font-bold text-red-600">{{ minFps }}</p>
              </div>
              <div class="p-3 bg-muted rounded">
                <p class="text-muted-foreground">平均</p>
                <p class="font-bold text-blue-600">{{ avgFps }}</p>
              </div>
              <div class="p-3 bg-muted rounded">
                <p class="text-muted-foreground">最高</p>
                <p class="font-bold text-green-600">{{ maxFps }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 性能评级 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">性能评级</h2>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded" :class="getRatingClass(avgFps)">
              <div class="flex items-center gap-3">
                <component :is="getRatingIcon(avgFps)" class="w-8 h-8" />
                <div>
                  <p class="font-bold">{{ getRatingText(avgFps) }}</p>
                  <p class="text-sm text-muted-foreground">{{ getRatingDesc(avgFps) }}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="p-2 bg-muted rounded">
                <p class="text-muted-foreground">帧时间</p>
                <p class="font-medium">{{ frameTime }} ms</p>
              </div>
              <div class="p-2 bg-muted rounded">
                <p class="text-muted-foreground">测试时长</p>
                <p class="font-medium">{{ testDuration }} 秒</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作控制 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">测试控制</h2>

          <div class="space-y-3">
            <button v-if="!isRunning" @click="startTest" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Play class="w-5 h-5 inline mr-2" />
              开始测试
            </button>
            <button v-else @click="stopTest" class="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">
              <StopCircle class="w-5 h-5 inline mr-2" />
              停止测试
            </button>

            <button v-if="fpsHistory.length > 0" @click="resetTest" class="w-full px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg text-sm">
              <RotateCcw class="w-4 h-4 inline mr-2" />
              重置数据
            </button>

            <!-- 负载等级 -->
            <div>
              <label class="text-sm font-medium mb-2 block">渲染负载</label>
              <select v-model="loadLevel" @change="updateLoad" :disabled="isRunning" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="light">轻度（简单动画）</option>
                <option value="medium">中度（标准动画）</option>
                <option value="heavy">重度（复杂渲染）</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：动画区域和图表 -->
      <div class="space-y-4">
        <!-- 动画测试区域 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">动画测试区域</h2>

          <div ref="animationArea" class="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <!-- 粒子效果 -->
            <canvas ref="canvas" class="absolute inset-0 w-full h-full"></canvas>

            <!-- 移动元素 -->
            <div v-for="i in movingElements" :key="i" class="absolute w-16 h-16 rounded-full"
              :style="getMovingElementStyle(i)">
            </div>

            <div v-if="!isRunning && fpsHistory.length === 0" class="absolute inset-0 flex items-center justify-center">
              <p class="text-white text-lg">点击"开始测试"运行动画</p>
            </div>
          </div>
        </div>

        <!-- FPS历史图表 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">FPS历史曲线</h2>

          <div class="relative h-48">
            <svg v-if="fpsHistory.length > 0" class="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              <!-- 网格线 -->
              <line x1="0" y1="37.5" x2="400" y2="37.5" stroke="#e5e7eb" stroke-width="1"/>
              <line x1="0" y1="75" x2="400" y2="75" stroke="#e5e7eb" stroke-width="1"/>
              <line x1="0" y1="112.5" x2="400" y2="112.5" stroke="#e5e7eb" stroke-width="1"/>

              <!-- FPS曲线 -->
              <polyline :points="getChartPoints()" fill="none" stroke="#3b82f6" stroke-width="2"/>

              <!-- 60FPS参考线 -->
              <line x1="0" y1="0" x2="400" y2="0" stroke="#10b981" stroke-width="1" stroke-dasharray="5,5"/>
            </svg>
            <div v-else class="h-full flex items-center justify-center text-muted-foreground">
              暂无数据
            </div>

            <!-- Y轴标签 -->
            <div v-if="fpsHistory.length > 0" class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground -ml-6">
              <span>60</span>
              <span>45</span>
              <span>30</span>
              <span>15</span>
              <span>0</span>
            </div>
          </div>
        </div>

        <!-- FPS分布 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">FPS分布</h2>

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-xs w-12">60+</span>
              <div class="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div class="h-full bg-green-500" :style="{ width: (fpsDistribution.high / totalFrames * 100) + '%' }"></div>
              </div>
              <span class="text-xs w-8 text-right">{{ fpsDistribution.high }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs w-12">45-59</span>
              <div class="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div class="h-full bg-blue-500" :style="{ width: (fpsDistribution.medium / totalFrames * 100) + '%' }"></div>
              </div>
              <span class="text-xs w-8 text-right">{{ fpsDistribution.medium }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs w-12">30-44</span>
              <div class="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div class="h-full bg-yellow-500" :style="{ width: (fpsDistribution.low / totalFrames * 100) + '%' }"></div>
              </div>
              <span class="text-xs w-8 text-right">{{ fpsDistribution.low }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs w-12">&lt;30</span>
              <div class="flex-1 h-4 bg-muted rounded overflow-hidden">
                <div class="h-full bg-red-500" :style="{ width: (fpsDistribution.poor / totalFrames * 100) + '%' }"></div>
              </div>
              <span class="text-xs w-8 text-right">{{ fpsDistribution.poor }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSeoMeta } from '#app'
import { Gauge, Play, StopCircle, RotateCcw, CheckCircle, AlertTriangle, XCircle } from 'lucide-vue-next'

const canvas = ref(null)
const animationArea = ref(null)
const isRunning = ref(false)
const currentFps = ref(0)
const minFps = ref(0)
const maxFps = ref(0)
const avgFps = ref(0)
const frameTime = ref(0)
const testDuration = ref(0)
const loadLevel = ref('medium')
const fpsHistory = ref([])
const fpsDistribution = ref({
  high: 0,
  medium: 0,
  low: 0,
  poor: 0
})
const movingElements = ref(20)
const particles = ref([])

let animationId = null
let lastTime = 0
let frameCount = 0
let fpsUpdateInterval = null
let startTime = null
let totalFps = 0
let totalFramesCount = 0

const totalFrames = computed(() => {
  return fpsDistribution.value.high + fpsDistribution.value.medium + fpsDistribution.value.low + fpsDistribution.value.poor
})

function getFpsColor(fps) {
  if (fps >= 55) return '#10b981'
  if (fps >= 40) return '#3b82f6'
  if (fps >= 25) return '#f59e0b'
  return '#ef4444'
}

function getRatingClass(fps) {
  if (fps >= 55) return 'bg-green-50 dark:bg-green-900/20'
  if (fps >= 40) return 'bg-blue-50 dark:bg-blue-900/20'
  if (fps >= 25) return 'bg-yellow-50 dark:bg-yellow-900/20'
  return 'bg-red-50 dark:bg-red-900/20'
}

function getRatingIcon(fps) {
  if (fps >= 55) return CheckCircle
  if (fps >= 40) return CheckCircle
  if (fps >= 25) return AlertTriangle
  return XCircle
}

function getRatingText(fps) {
  if (fps >= 55) return '优秀'
  if (fps >= 40) return '良好'
  if (fps >= 25) return '一般'
  return '较差'
}

function getRatingDesc(fps) {
  if (fps >= 55) return '流畅运行，无卡顿'
  if (fps >= 40) return '基本流畅，偶有轻微卡顿'
  if (fps >= 25) return '明显卡顿，影响体验'
  return '严重卡顿，需要优化'
}

function getMovingElementStyle(index) {
  const time = Date.now() / 1000
  const x = (Math.sin(time + index) * 0.4 + 0.5) * 100
  const y = (Math.cos(time * 0.7 + index * 0.5) * 0.4 + 0.5) * 100
  const hue = (index * 18) % 360

  return {
    left: `${x}%`,
    top: `${y}%`,
    backgroundColor: `hsl(${hue}, 70%, 60%)`,
    transform: `translate(-50%, -50%)`
  }
}

function getChartPoints() {
  const maxPoints = 100
  const data = fpsHistory.value.slice(-maxPoints)
  if (data.length === 0) return ''

  const points = data.map((fps, i) => {
    const x = (i / (maxPoints - 1)) * 400
    const y = 150 - (fps / 60) * 150
    return `${x},${y}`
  })

  return points.join(' ')
}

function updateLoad() {
  switch (loadLevel.value) {
    case 'light':
      movingElements.value = 10
      particles.value = Array(50).fill(null).map(() => createParticle())
      break
    case 'medium':
      movingElements.value = 20
      particles.value = Array(100).fill(null).map(() => createParticle())
      break
    case 'heavy':
      movingElements.value = 40
      particles.value = Array(200).fill(null).map(() => createParticle())
      break
  }
}

function createParticle() {
  return {
    x: Math.random() * 400,
    y: Math.random() * 300,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    size: Math.random() * 3 + 1,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`
  }
}

function animate(timestamp) {
  if (!lastTime) lastTime = timestamp
  const delta = timestamp - lastTime

  frameCount++
  frameTime.value = delta.toFixed(2)

  // 每100ms更新一次FPS
  if (timestamp % 100 < 20) {
    const fps = Math.round(1000 / delta)
    currentFps.value = fps
    fpsHistory.value.push(fps)

    // 更新统计
    if (fpsHistory.value.length === 1) {
      minFps.value = maxFps.value = fps
    } else {
      minFps.value = Math.min(minFps.value, fps)
      maxFps.value = Math.max(maxFps.value, fps)
    }

    totalFps += fps
    totalFramesCount++
    avgFps.value = Math.round(totalFps / totalFramesCount)

    // 更新分布
    if (fps >= 55) fpsDistribution.value.high++
    else if (fps >= 40) fpsDistribution.value.medium++
    else if (fps >= 25) fpsDistribution.value.low++
    else fpsDistribution.value.poor++

    // 更新粒子位置
    particles.value.forEach(p => {
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0 || p.x > 400) p.vx *= -1
      if (p.y < 0 || p.y > 300) p.vy *= -1
    })

    // 绘制粒子
    if (canvas.value) {
      const ctx = canvas.value.getContext('2d')
      ctx.clearRect(0, 0, 400, 300)
      particles.value.forEach(p => {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }

  lastTime = timestamp

  if (isRunning.value) {
    animationId = requestAnimationFrame(animate)
  }
}

function startTest() {
  if (isRunning.value) return

  isRunning.value = true
  lastTime = 0
  frameCount = 0
  startTime = Date.now()
  totalFps = 0
  totalFramesCount = 0
  minFps.value = 0
  maxFps.value = 0
  avgFps.value = 0
  fpsHistory.value = []
  fpsDistribution.value = { high: 0, medium: 0, low: 0, poor: 0 }

  updateLoad()
  animationId = requestAnimationFrame(animate)

  fpsUpdateInterval = setInterval(() => {
    testDuration.value = Math.round((Date.now() - startTime) / 1000)
  }, 1000)
}

function stopTest() {
  isRunning.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (fpsUpdateInterval) {
    clearInterval(fpsUpdateInterval)
  }
}

function resetTest() {
  stopTest()
  currentFps.value = 0
  minFps.value = 0
  maxFps.value = 0
  avgFps.value = 0
  frameTime.value = 0
  testDuration.value = 0
  fpsHistory.value = []
  fpsDistribution.value = { high: 0, medium: 0, low: 0, poor: 0 }

  if (canvas.value) {
    const ctx = canvas.value.getContext('2d')
    ctx.clearRect(0, 0, 400, 300)
  }
}

onMounted(() => {
  updateLoad()
})

onUnmounted(() => {
  stopTest()
})

useSeoMeta({
  title: 'FPS在线测试工具 - 浏览器帧率性能测试',
  description: '免费在线FPS测试工具，实时测试浏览器帧率，评估动画性能和渲染能力，支持多种负载等级。', keywords: ['FPS测试', '帧率测试', '性能测试', '浏览器性能', '帧率检测', 'FPS meter', 'frame rate', 'performance test']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('FPS在线测试工具')
</script>
