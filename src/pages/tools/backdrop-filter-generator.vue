<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">CSS背景滤镜生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成毛玻璃、模糊等backdrop-filter效果</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 预览区域 -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4">效果预览</h2>
          <div class="relative h-[400px] rounded-xl overflow-hidden" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);">
            <!-- 背景装饰 -->
            <div class="absolute inset-0 flex items-center justify-center gap-8 opacity-50">
              <div class="w-32 h-32 rounded-full bg-yellow-400"></div>
              <div class="w-24 h-24 rounded-full bg-cyan-400"></div>
              <div class="w-20 h-20 rounded-full bg-pink-400"></div>
            </div>

            <!-- 浮动元素 -->
            <div class="absolute top-8 left-8 w-16 h-16 bg-white/30 rounded-lg"></div>
            <div class="absolute bottom-12 right-12 w-20 h-20 bg-white/20 rounded-full"></div>

            <!-- 滤镜卡片 -->
            <div
              class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 p-6 rounded-2xl bg-white/30 border border-white/40 shadow-2xl"
              :style="{ backdropFilter: generatedFilter, WebkitBackdropFilter: generatedFilter }"
            >
              <h3 class="text-2xl font-bold text-gray-800 mb-2">毛玻璃效果</h3>
              <p class="text-gray-700 text-sm">
                Backdrop Filter 可以让元素背后的内容产生模糊等滤镜效果。
              </p>
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
            <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>.glass-effect {
  backdrop-filter: {{ generatedFilter }};
  -webkit-backdrop-filter: {{ generatedFilter }};
  background: rgba(255, 255, 255, 0.3);
}</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">滤镜设置</h2>
          <button @click="resetFilters" class="px-3 py-1 text-sm bg-red-500 text-white rounded">重置</button>
        </div>

        <div class="space-y-6">
          <!-- 模糊 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">模糊 (blur)</label>
              <span class="text-sm text-gray-500">{{ filters.blur }}px</span>
            </div>
            <input v-model.number="filters.blur" type="range" min="0" max="50" step="0.5" class="w-full">
          </div>

          <!-- 亮度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">亮度 (brightness)</label>
              <span class="text-sm text-gray-500">{{ filters.brightness }}%</span>
            </div>
            <input v-model.number="filters.brightness" type="range" min="0" max="200" step="1" class="w-full">
          </div>

          <!-- 对比度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">对比度 (contrast)</label>
              <span class="text-sm text-gray-500">{{ filters.contrast }}%</span>
            </div>
            <input v-model.number="filters.contrast" type="range" min="0" max="200" step="1" class="w-full">
          </div>

          <!-- 饱和度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">饱和度 (saturate)</label>
              <span class="text-sm text-gray-500">{{ filters.saturate }}%</span>
            </div>
            <input v-model.number="filters.saturate" type="range" min="0" max="200" step="1" class="w-full">
          </div>

          <!-- 灰度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">灰度 (grayscale)</label>
              <span class="text-sm text-gray-500">{{ filters.grayscale }}%</span>
            </div>
            <input v-model.number="filters.grayscale" type="range" min="0" max="100" step="1" class="w-full">
          </div>

          <!-- 色相旋转 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">色相旋转 (hue-rotate)</label>
              <span class="text-sm text-gray-500">{{ filters.hueRotate }}deg</span>
            </div>
            <input v-model.number="filters.hueRotate" type="range" min="0" max="360" step="1" class="w-full">
          </div>

          <!-- 反色 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">反色 (invert)</label>
              <span class="text-sm text-gray-500">{{ filters.invert }}%</span>
            </div>
            <input v-model.number="filters.invert" type="range" min="0" max="100" step="1" class="w-full">
          </div>

          <!-- 透明度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">透明度 (opacity)</label>
              <span class="text-sm text-gray-500">{{ filters.opacity }}%</span>
            </div>
            <input v-model.number="filters.opacity" type="range" min="0" max="100" step="1" class="w-full">
          </div>

          <!-- 背景透明度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">背景透明度</label>
              <span class="text-sm text-gray-500">{{ bgOpacity }}%</span>
            </div>
            <input v-model.number="bgOpacity" type="range" min="0" max="100" step="1" class="w-full">
          </div>
        </div>

        <!-- 预设效果 -->
        <div class="mt-8">
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
import { ref, computed } from 'vue'

useHead({
  title: 'CSS背景滤镜生成器 - backdrop-filter可视化',
  meta: [{ name: 'description', content: '在线CSS backdrop-filter生成工具，可视化创建毛玻璃、模糊等背景滤镜效果。' }],
  keywords: ['backdrop-filter', '毛玻璃', 'CSS滤镜', '背景模糊', 'frosted glass', 'glassmorphism']
})

interface Filters {
  blur: number
  brightness: number
  contrast: number
  saturate: number
  grayscale: number
  hueRotate: number
  invert: number
  opacity: number
}

const filters = ref<Filters>({
  blur: 20,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  hueRotate: 0,
  invert: 0,
  opacity: 100
})

const bgOpacity = ref(30)

const presets = [
  {
    name: '经典毛玻璃',
    filters: { blur: 20, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '强模糊',
    filters: { blur: 40, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '高对比',
    filters: { blur: 15, brightness: 110, contrast: 130, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '灰度玻璃',
    filters: { blur: 20, brightness: 100, contrast: 100, saturate: 100, grayscale: 100, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '复古效果',
    filters: { blur: 10, brightness: 100, contrast: 100, saturate: 80, grayscale: 0, hueRotate: 30, invert: 0, opacity: 100 }
  },
  {
    name: '反色玻璃',
    filters: { blur: 15, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 100, opacity: 100 }
  },
  {
    name: '轻度模糊',
    filters: { blur: 8, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  },
  {
    name: '无模糊',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, hueRotate: 0, invert: 0, opacity: 100 }
  }
]

const generatedFilter = computed(() => {
  const f = filters.value
  const parts: string[] = []

  if (f.blur > 0) parts.push(`blur(${f.blur}px)`)
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`)
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`)
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`)
  if (f.grayscale > 0) parts.push(`grayscale(${f.grayscale}%)`)
  if (f.hueRotate > 0) parts.push(`hue-rotate(${f.hueRotate}deg)`)
  if (f.invert > 0) parts.push(`invert(${f.invert}%)`)
  if (f.opacity !== 100) parts.push(`opacity(${f.opacity}%)`)

  return parts.length > 0 ? parts.join(' ') : 'none'
})

function applyPreset(preset: any) {
  filters.value = { ...preset.filters }
}

function resetFilters() {
  filters.value = {
    blur: 20,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    hueRotate: 0,
    invert: 0,
    opacity: 100
  }
  bgOpacity.value = 30
}

async function copyCSS() {
  const css = `.glass-effect {
  backdrop-filter: ${generatedFilter.value};
  -webkit-backdrop-filter: ${generatedFilter.value};
  background: rgba(255, 255, 255, ${bgOpacity.value / 100});
}`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}
</script>
