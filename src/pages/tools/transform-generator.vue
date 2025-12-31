<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">CSS变换生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化调节rotate/scale/skew/translate变换效果</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 预览区域 -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4">效果预览</h2>
          <div class="relative h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden" style="background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px;">
            <!-- 参考线 -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-full h-px bg-blue-400 opacity-50"></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="h-full w-px bg-blue-400 opacity-50"></div>
            </div>

            <!-- 变换元素 -->
            <div class="absolute top-1/2 left-1/2">
              <div
                ref="transformElement"
                class="w-32 h-32 rounded-xl flex items-center justify-center text-white font-bold shadow-xl"
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
                :style="{ transform: generatedTransform }"
              >
                <div class="text-center">
                  <div class="text-2xl">🎯</div>
                  <div class="text-xs mt-1">Transform</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成的CSS -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">CSS代码</h2>
            <button @click="copyCSS" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">复制</button>
          </div>
          <div class="p-4 bg-gray-900 rounded-lg">
            <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>transform: {{ generatedTransform }};</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">变换设置</h2>
          <button @click="resetTransform" class="px-3 py-1 text-sm bg-red-500 text-white rounded">重置</button>
        </div>

        <div class="space-y-6">
          <!-- 平移 Translate -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="font-medium mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs">XY</span>
              平移 (Translate)
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs">X轴</label>
                  <span class="text-xs text-gray-500">{{ translateX }}px</span>
                </div>
                <input v-model.number="translateX" type="range" min="-200" max="200" class="w-full">
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs">Y轴</label>
                  <span class="text-xs text-gray-500">{{ translateY }}px</span>
                </div>
                <input v-model.number="translateY" type="range" min="-200" max="200" class="w-full">
              </div>
            </div>
          </div>

          <!-- 旋转 Rotate -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="font-medium mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs">↻</span>
              旋转 (Rotate)
            </h3>
            <div>
              <div class="flex justify-between mb-1">
                <label class="text-xs">角度</label>
                <span class="text-xs text-gray-500">{{ rotate }}deg</span>
              </div>
              <input v-model.number="rotate" type="range" min="-360" max="360" class="w-full">
            </div>
            <div class="grid grid-cols-3 gap-2 mt-2">
              <button @click="rotate = 0" class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300">0°</button>
              <button @click="rotate = 45" class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300">45°</button>
              <button @click="rotate = 90" class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300">90°</button>
              <button @click="rotate = 180" class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300">180°</button>
              <button @click="rotate = -45" class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300">-45°</button>
              <button @click="rotate = -90" class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300">-90°</button>
            </div>
          </div>

          <!-- 缩放 Scale -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="font-medium mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs">⤢</span>
              缩放 (Scale)
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs">X轴</label>
                  <span class="text-xs text-gray-500">{{ scaleX }}x</span>
                </div>
                <input v-model.number="scaleX" type="range" min="0.1" max="3" step="0.1" class="w-full">
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs">Y轴</label>
                  <span class="text-xs text-gray-500">{{ scaleY }}x</span>
                </div>
                <input v-model.number="scaleY" type="range" min="0.1" max="3" step="0.1" class="w-full">
              </div>
            </div>
            <label class="flex items-center gap-2 mt-2 text-sm">
              <input type="checkbox" v-model="lockScale" class="rounded">
              <span>锁定比例</span>
            </label>
          </div>

          <!-- 倾斜 Skew -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="font-medium mb-3 flex items-center gap-2">
              <span class="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs">▱</span>
              倾斜 (Skew)
            </h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs">X轴</label>
                  <span class="text-xs text-gray-500">{{ skewX }}deg</span>
                </div>
                <input v-model.number="skewX" type="range" min="-60" max="60" class="w-full">
              </div>
              <div>
                <div class="flex justify-between mb-1">
                  <label class="text-xs">Y轴</label>
                  <span class="text-xs text-gray-500">{{ skewY }}deg</span>
                </div>
                <input v-model.number="skewY" type="range" min="-60" max="60" class="w-full">
              </div>
            </div>
          </div>

          <!-- 原点设置 -->
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 class="font-medium mb-3">变换原点 (Transform Origin)</h3>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="origin in origins"
                :key="origin.value"
                @click="transformOrigin = origin.value"
                :class="['px-2 py-1 text-xs rounded', transformOrigin === origin.value ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300']"
              >
                {{ origin.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 预设效果 -->
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-3">预设效果</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

useHead({
  title: 'CSS变换生成器 - transform可视化工具',
  meta: [{ name: 'description', content: '在线CSS transform生成工具，可视化调节旋转、缩放、倾斜、平移等变换效果。' }],
  keywords: ['css transform', '旋转', '缩放', '倾斜', 'translate', 'rotate', 'scale', 'skew']
})

const translateX = ref(0)
const translateY = ref(0)
const rotate = ref(0)
const scaleX = ref(1)
const scaleY = ref(1)
const skewX = ref(0)
const skewY = ref(0)
const transformOrigin = ref('center')
const lockScale = ref(false)

const transformElement = ref<HTMLElement>()

const origins = [
  { label: '左上', value: 'top left' },
  { label: '上中', value: 'top center' },
  { label: '右上', value: 'top right' },
  { label: '左中', value: 'center left' },
  { label: '中心', value: 'center' },
  { label: '右中', value: 'center right' },
  { label: '左下', value: 'bottom left' },
  { label: '下中', value: 'bottom center' },
  { label: '右下', value: 'bottom right' }
]

const presets = [
  { name: '无变换', x: 0, y: 0, r: 0, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '旋转45°', x: 0, y: 0, r: 45, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '旋转90°', x: 0, y: 0, r: 90, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '放大1.5x', x: 0, y: 0, r: 0, sx: 1.5, sy: 1.5, kx: 0, ky: 0 },
  { name: '缩小0.8x', x: 0, y: 0, r: 0, sx: 0.8, sy: 0.8, kx: 0, ky: 0 },
  { name: '水平翻转', x: 0, y: 0, r: 0, sx: -1, sy: 1, kx: 0, ky: 0 },
  { name: '垂直翻转', x: 0, y: 0, r: 0, sx: 1, sy: -1, kx: 0, ky: 0 },
  { name: '右移', x: 50, y: 0, r: 0, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '下移', x: 0, y: 50, r: 0, sx: 1, sy: 1, kx: 0, ky: 0 },
  { name: '倾斜X', x: 0, y: 0, r: 0, sx: 1, sy: 1, kx: 20, ky: 0 },
  { name: '倾斜Y', x: 0, y: 0, r: 0, sx: 1, sy: 1, kx: 0, ky: 20 }
]

// 锁定缩放比例
watch(scaleX, (newVal) => {
  if (lockScale.value) {
    scaleY.value = newVal
  }
})

const generatedTransform = computed(() => {
  const parts: string[] = []

  if (translateX.value !== 0 || translateY.value !== 0) {
    parts.push(`translate(${translateX.value}px, ${translateY.value}px)`)
  }
  if (rotate.value !== 0) {
    parts.push(`rotate(${rotate.value}deg)`)
  }
  if (scaleX.value !== 1 || scaleY.value !== 1) {
    parts.push(`scale(${scaleX.value}, ${scaleY.value})`)
  }
  if (skewX.value !== 0 || skewY.value !== 0) {
    parts.push(`skew(${skewX.value}deg, ${skewY.value}deg)`)
  }

  return parts.length > 0 ? parts.join(' ') : 'none'
})

function applyPreset(preset: any) {
  translateX.value = preset.x
  translateY.value = preset.y
  rotate.value = preset.r
  scaleX.value = preset.sx
  scaleY.value = preset.sy
  skewX.value = preset.kx
  skewY.value = preset.ky
}

function resetTransform() {
  translateX.value = 0
  translateY.value = 0
  rotate.value = 0
  scaleX.value = 1
  scaleY.value = 1
  skewX.value = 0
  skewY.value = 0
  transformOrigin.value = 'center'
}

async function copyCSS() {
  const origin = transformOrigin.value !== 'center' ? `\ntransform-origin: ${transformOrigin.value};` : ''
  const css = `transform: ${generatedTransform.value};${origin}`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}
</script>
