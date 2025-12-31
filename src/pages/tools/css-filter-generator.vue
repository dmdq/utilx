<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">CSS滤镜生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化调节blur/brightness/contrast/saturate等滤镜效果</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 预览区域 -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4">效果预览</h2>
          <div class="grid grid-cols-2 gap-4">
            <!-- 原图 -->
            <div>
              <div class="text-sm text-gray-500 mb-2">原图</div>
              <div class="aspect-square rounded-xl overflow-hidden" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="w-full h-full flex items-center justify-center">
                  <div class="text-center text-white">
                    <div class="text-4xl mb-2">🎨</div>
                    <div class="text-lg font-bold">Filter</div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 滤镜效果 -->
            <div>
              <div class="text-sm text-gray-500 mb-2">滤镜效果</div>
              <div
                class="aspect-square rounded-xl overflow-hidden"
                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
              >
                <div class="w-full h-full flex items-center justify-center" :style="{ filter: generatedFilter }">
                  <div class="text-center text-white">
                    <div class="text-4xl mb-2">🎨</div>
                    <div class="text-lg font-bold">Filter</div>
                  </div>
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
            <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>filter: {{ generatedFilter }};</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">滤镜设置</h2>
          <button @click="resetFilters" class="px-3 py-1 text-sm bg-red-500 text-white rounded">重置</button>
        </div>

        <div class="space-y-5">
          <!-- 模糊 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">模糊 (blur)</label>
              <span class="text-sm text-gray-500">{{ filters.blur }}px</span>
            </div>
            <input v-model.number="filters.blur" type="range" min="0" max="20" step="0.1" class="w-full">
          </div>

          <!-- 亮度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">亮度 (brightness)</label>
              <span class="text-sm text-gray-500">{{ filters.brightness }}%</span>
            </div>
            <input v-model.number="filters.brightness" type="range" min="0" max="300" step="1" class="w-full">
          </div>

          <!-- 对比度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">对比度 (contrast)</label>
              <span class="text-sm text-gray-500">{{ filters.contrast }}%</span>
            </div>
            <input v-model.number="filters.contrast" type="range" min="0" max="300" step="1" class="w-full">
          </div>

          <!-- 饱和度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">饱和度 (saturate)</label>
              <span class="text-sm text-gray-500">{{ filters.saturate }}%</span>
            </div>
            <input v-model.number="filters.saturate" type="range" min="0" max="300" step="1" class="w-full">
          </div>

          <!-- 灰度 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">灰度 (grayscale)</label>
              <span class="text-sm text-gray-500">{{ filters.grayscale }}%</span>
            </div>
            <input v-model.number="filters.grayscale" type="range" min="0" max="100" step="1" class="w-full">
          </div>

          <!-- 褐色/复古 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">复古 (sepia)</label>
              <span class="text-sm text-gray-500">{{ filters.sepia }}%</span>
            </div>
            <input v-model.number="filters.sepia" type="range" min="0" max="100" step="1" class="w-full">
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

          <!-- 阴影 -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">阴影 (drop-shadow)</label>
              <span class="text-sm text-gray-500">{{ filters.shadowX }}px {{ filters.shadowY }}px</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <input v-model.number="filters.shadowX" type="range" min="-30" max="30" step="1" class="w-full" placeholder="X">
              <input v-model.number="filters.shadowY" type="range" min="-30" max="30" step="1" class="w-full" placeholder="Y">
              <input v-model.number="filters.shadowBlur" type="range" min="0" max="30" step="1" class="w-full" placeholder="Blur">
            </div>
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
  title: 'CSS滤镜生成器 - filter可视化工具',
  meta: [{ name: 'description', content: '在线CSS filter生成工具，可视化调节模糊、亮度、对比度、饱和度等滤镜效果。' }],
  keywords: ['css filter', 'CSS滤镜', '模糊效果', '亮度调节', '对比度', 'saturate', 'grayscale']
})

interface Filters {
  blur: number
  brightness: number
  contrast: number
  saturate: number
  grayscale: number
  sepia: number
  hueRotate: number
  invert: number
  opacity: number
  shadowX: number
  shadowY: number
  shadowBlur: number
}

const filters = ref<Filters>({
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,
  opacity: 100,
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0
})

const presets = [
  {
    name: '无滤镜',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '灰度',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 100, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '复古',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 100, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '高亮',
    filters: { blur: 0, brightness: 150, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '高对比',
    filters: { blur: 0, brightness: 100, contrast: 150, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '高饱和',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 200, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '模糊',
    filters: { blur: 5, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '反色',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 100, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '暗色',
    filters: { blur: 0, brightness: 60, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '色调偏移',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 90, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '怀旧',
    filters: { blur: 0, brightness: 110, contrast: 90, saturate: 80, grayscale: 0, sepia: 40, hueRotate: 0, invert: 0, opacity: 100, shadowX: 0, shadowY: 0, shadowBlur: 0 }
  },
  {
    name: '阴影',
    filters: { blur: 0, brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, opacity: 100, shadowX: 10, shadowY: 10, shadowBlur: 10 }
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
  if (f.sepia > 0) parts.push(`sepia(${f.sepia}%)`)
  if (f.hueRotate > 0) parts.push(`hue-rotate(${f.hueRotate}deg)`)
  if (f.invert > 0) parts.push(`invert(${f.invert}%)`)
  if (f.opacity !== 100) parts.push(`opacity(${f.opacity}%)`)
  if (f.shadowX !== 0 || f.shadowY !== 0 || f.shadowBlur > 0) {
    parts.push(`drop-shadow(${f.shadowX}px ${f.shadowY}px ${f.shadowBlur}px rgba(0,0,0,0.5))`)
  }

  return parts.length > 0 ? parts.join(' ') : 'none'
})

function applyPreset(preset: any) {
  filters.value = { ...preset.filters }
}

function resetFilters() {
  filters.value = {
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    invert: 0,
    opacity: 100,
    shadowX: 0,
    shadowY: 0,
    shadowBlur: 0
  }
}

async function copyCSS() {
  const css = `filter: ${generatedFilter.value};`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}
</script>
