<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">屏幕检测工具</h1>
      <p class="text-muted-foreground">检测屏幕分辨率、像素密度、色深等显示参数，测试坏点和显示效果</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：屏幕信息 -->
      <div class="space-y-4">
        <!-- 基本参数 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Monitor class="w-5 h-5 text-primary" />
            屏幕基本参数
          </h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>屏幕分辨率</span>
              <span class="font-medium">{{ screenWidth }} x {{ screenHeight }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>可用分辨率</span>
              <span class="font-medium">{{ availWidth }} x {{ availHeight }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>像素密度 (DPR)</span>
              <span class="font-medium">{{ devicePixelRatio }}x</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>色深</span>
              <span class="font-medium">{{ colorDepth }} 位</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>像素色深</span>
              <span class="font-medium">{{ pixelDepth }} 位</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>屏幕方向</span>
              <span class="font-medium">{{ orientation }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>色彩配置</span>
              <span class="font-medium">{{ colorGamut }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>对比度</span>
              <span class="font-medium">{{ contrast }}</span>
            </div>
          </div>
        </div>

        <!-- 触控支持 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hand class="w-5 h-5 text-primary" />
            触控支持
          </h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>触控事件</span>
              <span :class="touchSupport ? 'text-green-600' : 'text-red-600'" class="font-medium">
                {{ touchSupport ? '支持' : '不支持' }}
              </span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>最大触控点</span>
              <span class="font-medium">{{ maxTouchPoints }} 个</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>指针类型</span>
              <span class="font-medium">{{ pointerType }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-muted rounded">
              <span>悬停支持</span>
              <span :class="hoverSupport ? 'text-green-600' : 'text-red-600'" class="font-medium">
                {{ hoverSupport ? '支持' : '不支持' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 屏幕测试 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">屏幕测试</h2>

          <div class="space-y-3">
            <button @click="startTest('pure')" class="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm">
              纯色测试
            </button>
            <button @click="startTest('gradient')" class="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg text-sm">
              渐变测试
            </button>
            <button @click="startTest('grid')" class="w-full px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg text-sm">
              网格测试
            </button>
            <button @click="startTest('badpixel')" class="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm">
              坏点测试
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：测试区域 -->
      <div class="space-y-4">
        <!-- 测试画布 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">测试画布</h2>
            <button v-if="testMode" @click="endTest" class="text-sm px-3 py-1 bg-red-500 text-white rounded">
              退出测试
            </button>
          </div>

          <!-- 正常视图 -->
          <div v-if="!testMode" class="aspect-video bg-muted rounded flex items-center justify-center">
            <p class="text-muted-foreground">选择左侧测试开始检测</p>
          </div>

          <!-- 纯色测试 -->
          <div v-else-if="testMode === 'pure'" class="aspect-video rounded transition-all duration-1000" :style="{ backgroundColor: currentTestColor }">
            <div class="h-full flex flex-col items-center justify-center text-white">
              <p class="text-2xl font-bold">{{ currentTestColorName }}</p>
              <p class="text-sm mt-2">点击切换颜色</p>
              <div class="mt-4 flex gap-2">
                <button v-for="color in pureColors" :key="color.name" @click="setTestColor(color)" class="w-8 h-8 rounded border-2 border-white" :style="{ backgroundColor: color.hex }"></button>
              </div>
            </div>
          </div>

          <!-- 渐变测试 -->
          <div v-else-if="testMode === 'gradient'" class="aspect-video rounded" :style="{ background: gradientStyle }">
            <div class="h-full flex items-center justify-center">
              <p class="text-white text-xl font-bold bg-black/50 px-4 py-2 rounded">渐变色测试</p>
            </div>
          </div>

          <!-- 网格测试 -->
          <div v-else-if="testMode === 'grid'" class="aspect-video rounded" :style="gridStyle">
            <div class="h-full flex items-center justify-center bg-black/50">
              <p class="text-white text-xl font-bold">网格测试 - 检查显示区域</p>
            </div>
          </div>

          <!-- 坏点测试 -->
          <div v-else-if="testMode === 'badpixel'" class="aspect-video rounded bg-black overflow-hidden">
            <div class="h-full grid grid-cols-5 grid-rows-5">
              <div v-for="i in 25" :key="i" class="border border-border flex items-center justify-center cursor-pointer hover:opacity-80" :style="{ backgroundColor: getBadPixelColor(i) }" @click="cycleBadPixelColor(i)">
                <span class="text-white text-xs font-bold">{{ i }}</span>
              </div>
            </div>
            <div class="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
              点击方块切换颜色
            </div>
          </div>
        </div>

        <!-- 当前显示模式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">显示信息</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>窗口尺寸</span>
              <span class="font-mono">{{ windowWidth }} x {{ windowHeight }}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>文档尺寸</span>
              <span class="font-mono">{{ documentWidth }} x {{ documentHeight }}</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>滚动位置</span>
              <span class="font-mono">{{ scrollX }} , {{ scrollY }}</span>
            </div>
          </div>
        </div>

        <!-- 色彩测试说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">测试说明</h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded bg-red-500 flex-shrink-0"></div>
              <div>
                <p class="font-medium text-foreground">纯色测试</p>
                <p>检测色彩显示是否正常，是否有坏点或亮点</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0"></div>
              <div>
                <p class="font-medium text-foreground">渐变测试</p>
                <p>检查色彩过渡是否平滑，有无色带或断层</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded bg-grid flex-shrink-0" style="background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0px;"></div>
              <div>
                <p class="font-medium text-foreground">网格测试</p>
                <p>检查整个屏幕是否有显示异常区域</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded bg-black flex-shrink-0 border border-white"></div>
              <div>
                <p class="font-medium text-foreground">坏点测试</p>
                <p>通过纯色背景检测坏点、亮点或暗点</p>
              </div>
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
import { Monitor, Hand } from 'lucide-vue-next'

const screenWidth = ref(0)
const screenHeight = ref(0)
const availWidth = ref(0)
const availHeight = ref(0)
const devicePixelRatio = ref(1)
const colorDepth = ref(0)
const pixelDepth = ref(0)
const orientation = ref('')
const colorGamut = ref('')
const contrast = ref('')
const touchSupport = ref(false)
const maxTouchPoints = ref(0)
const pointerType = ref('')
const hoverSupport = ref(false)

const windowWidth = ref(0)
const windowHeight = ref(0)
const documentWidth = ref(0)
const documentHeight = ref(0)
const scrollX = ref(0)
const scrollY = ref(0)

const testMode = ref('')
const currentTestColor = ref('#FF0000')
const currentTestColorName = ref('红色')
const gradientIndex = ref(0)
const badPixelColors = ref({})

const pureColors = [
  { name: '红', hex: '#FF0000' },
  { name: '绿', hex: '#00FF00' },
  { name: '蓝', hex: '#0000FF' },
  { name: '白', hex: '#FFFFFF' },
  { name: '黑', hex: '#000000' }
]

const gradients = [
  'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)',
  'linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)',
  'linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)',
  'radial-gradient(circle, #ffffff, #ff0000, #ffff00, #00ff00, #000000)'
]

const gridStyle = computed(() => ({
  backgroundImage: `
    linear-gradient(to right, #666 1px, transparent 1px),
    linear-gradient(to bottom, #666 1px, transparent 1px)
  `,
  backgroundSize: '50px 50px',
  backgroundColor: '#f0f0f0'
}))

const gradientStyle = computed(() => gradients[gradientIndex.value])

function getScreenInfo() {
  const screen = window.screen
  screenWidth.value = screen.width
  screenHeight.value = screen.height
  availWidth.value = screen.availWidth
  availHeight.value = screen.availHeight
  devicePixelRatio.value = window.devicePixelRatio
  colorDepth.value = screen.colorDepth
  pixelDepth.value = screen.pixelDepth
  orientation.value = screen.orientation?.type || '未知'
  colorGamut.value = window.matchMedia('(color-gamut: rec2020)').matches ? 'rec2020' :
                      window.matchMedia('(color-gamut: p3)').matches ? 'P3' :
                      window.matchMedia('(color-gamut: srgb)').matches ? 'sRGB' : '未知'
  contrast.value = window.matchMedia('(prefers-contrast: more)').matches ? '高' :
                   window.matchMedia('(prefers-contrast: less)').matches ? '低' : '标准'
  touchSupport.value = 'ontouchstart' in window
  maxTouchPoints.value = navigator.maxTouchPoints || 0
  pointerType.value = matchMedia('(pointer: coarse)').matches ? '触摸' :
                      matchMedia('(pointer: fine)').matches ? '精确' : '未知'
  hoverSupport.value = matchMedia('(hover: hover)').matches

  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
  documentWidth.value = document.documentElement.scrollWidth
  documentHeight.value = document.documentElement.scrollHeight
  scrollX.value = window.scrollX
  scrollY.value = window.scrollY
}

function startTest(mode) {
  testMode.value = mode
  if (mode === 'pure') {
    setTestColor(pureColors[0])
  }
}

function endTest() {
  testMode.value = ''
}

function setTestColor(color) {
  currentTestColor.value = color.hex
  currentTestColorName.value = color.name
}

function getBadPixelColor(index) {
  return badPixelColors.value[index] || '#FFFFFF'
}

function cycleBadPixelColor(index) {
  const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF']
  const current = badPixelColors.value[index] || '#FFFFFF'
  const currentIndex = colors.indexOf(current)
  const nextIndex = (currentIndex + 1) % colors.length
  badPixelColors.value[index] = colors[nextIndex]
}

function handleResize() {
  getScreenInfo()
}

function handleScroll() {
  scrollX.value = window.scrollX
  scrollY.value = window.scrollY
}

onMounted(() => {
  getScreenInfo()
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll)
})

useSeoMeta({
  title: '屏幕检测工具 - 在线检测屏幕分辨率和显示质量',
  description: '免费在线屏幕检测工具，检测屏幕分辨率、像素密度、色深等显示参数，提供纯色、渐变、网格、坏点测试。', keywords: ['屏幕检测', '分辨率检测', '坏点测试', '屏幕测试', '显示检测', '像素密度', 'DPR', '色深测试']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('屏幕检测工具')
</script>
