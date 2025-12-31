<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">CSS圆角生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化生成复杂的border-radius，分别设置8个角的圆角</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 预览区域 -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4">预览</h2>
          <div class="p-8 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <div
              class="w-64 h-64 flex items-center justify-center shadow-xl"
              style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
              :style="{ borderRadius: generatedRadius }"
            >
              <div class="text-white text-center">
                <div class="text-4xl mb-2">⚡</div>
                <div class="font-bold">Border Radius</div>
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
            <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>border-radius: {{ generatedRadius }};</code></pre>
          </div>
        </div>
      </div>

      <!-- 设置面板 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">圆角设置</h2>
          <button @click="resetRadius" class="px-3 py-1 text-sm bg-red-500 text-white rounded">重置</button>
        </div>

        <!-- 快捷预设 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">快捷预设</h3>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="preset in quickPresets"
              :key="preset.name"
              @click="applyQuickPreset(preset)"
              class="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              {{ preset.name }}
            </button>
          </div>
        </div>

        <!-- 可视化编辑器 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">拖拽调整 (px)</h3>
          <div class="relative h-64 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <!-- 8个角的控制点 -->
            <!-- 左上 -->
            <div
              class="absolute cursor-ns-resize"
              style="left: 10%; top: 0;"
              @mousedown="(e) => startDrag(e, 'tl')"
            >
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:bg-blue-600">
                  {{ radius.tl }}
                </div>
                <div class="h-16 w-0.5 bg-blue-500"></div>
              </div>
            </div>
            <!-- 上中 -->
            <div
              class="absolute cursor-ns-resize"
              style="left: 50%; top: 0; transform: translateX(-50%);"
              @mousedown="(e) => startDrag(e, 'tl', 'tr')"
            >
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:bg-purple-600">
                  {{ radius.tl }}/{{ radius.tr }}
                </div>
                <div class="h-16 w-0.5 bg-purple-500"></div>
              </div>
            </div>
            <!-- 右上 -->
            <div
              class="absolute cursor-ns-resize"
              style="right: 10%; top: 0;"
              @mousedown="(e) => startDrag(e, 'tr')"
            >
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:bg-green-600">
                  {{ radius.tr }}
                </div>
                <div class="h-16 w-0.5 bg-green-500"></div>
              </div>
            </div>

            <!-- 右中 -->
            <div
              class="absolute cursor-ew-resize"
              style="right: 0; top: 50%; transform: translateY(-50%);"
              @mousedown="(e) => startDrag(e, 'tr', 'br')"
            >
              <div class="flex items-center">
                <div class="w-16 h-0.5 bg-orange-500"></div>
                <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:bg-orange-600">
                  {{ radius.tr }}/{{ radius.br }}
                </div>
              </div>
            </div>

            <!-- 右下 -->
            <div
              class="absolute cursor-ns-resize"
              style="right: 10%; bottom: 0;"
              @mousedown="(e) => startDrag(e, 'br')"
            >
              <div class="flex flex-col items-center">
                <div class="h-16 w-0.5 bg-red-500"></div>
                <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:bg-red-600">
                  {{ radius.br }}
                </div>
              </div>
            </div>

            <!-- 下中 -->
            <div
              class="absolute cursor-ns-resize"
              style="left: 50%; bottom: 0; transform: translateX(-50%);"
              @mousedown="(e) => startDrag(e, 'bl', 'br')"
            >
              <div class="flex flex-col items-center">
                <div class="h-16 w-0.5 bg-pink-500"></div>
                <div class="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:bg-pink-600">
                  {{ radius.bl }}/{{ radius.br }}
                </div>
              </div>
            </div>

            <!-- 左下 -->
            <div
              class="absolute cursor-ns-resize"
              style="left: 10%; bottom: 0;"
              @mousedown="(e) => startDrag(e, 'bl')"
            >
              <div class="flex flex-col items-center">
                <div class="h-16 w-0.5 bg-cyan-500"></div>
                <div class="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:bg-cyan-600">
                  {{ radius.bl }}
                </div>
              </div>
            </div>

            <!-- 左中 -->
            <div
              class="absolute cursor-ew-resize"
              style="left: 0; top: 50%; transform: translateY(-50%);"
              @mousedown="(e) => startDrag(e, 'tl', 'bl')"
            >
              <div class="flex items-center">
                <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:bg-indigo-600">
                  {{ radius.tl }}/{{ radius.bl }}
                </div>
                <div class="w-16 h-0.5 bg-indigo-500"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 数值输入 -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium">精确输入 (px)</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs text-gray-500">左上 (Top-Left)</label>
              <input v-model.number="radius.tl" type="number" min="0" max="200" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            </div>
            <div class="space-y-2">
              <label class="text-xs text-gray-500">右上 (Top-Right)</label>
              <input v-model.number="radius.tr" type="number" min="0" max="200" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            </div>
            <div class="space-y-2">
              <label class="text-xs text-gray-500">左下 (Bottom-Left)</label>
              <input v-model.number="radius.bl" type="number" min="0" max="200" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            </div>
            <div class="space-y-2">
              <label class="text-xs text-gray-500">右下 (Bottom-Right)</label>
              <input v-model.number="radius.br" type="number" min="0" max="200" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            </div>
          </div>
        </div>

        <!-- 形状预设 -->
        <div class="mt-6">
          <h3 class="text-sm font-medium mb-2">形状预设</h3>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="preset in shapePresets"
              :key="preset.name"
              @click="applyShapePreset(preset)"
              class="aspect-square flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 transition"
              :title="preset.name"
            >
              <div class="w-12 h-12" style="background: linear-gradient(135deg, #667eea, #764ba2);" :style="{ borderRadius: preset.radius }"></div>
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
  title: 'CSS圆角生成器 - border-radius可视化',
  meta: [{ name: 'description', content: '在线CSS border-radius生成工具，可视化生成复杂的圆角效果，支持分别设置8个角的圆角。' }],
  keywords: ['border-radius', '圆角', 'CSS圆角', 'border', '圆角生成器']
})

interface Radius {
  tl: number
  tr: number
  bl: number
  br: number
}

const radius = ref<Radius>({
  tl: 16,
  tr: 16,
  bl: 16,
  br: 16
})

const quickPresets = [
  { name: '无圆角', value: 0 },
  { name: '小圆角', value: 4 },
  { name: '中圆角', value: 8 },
  { name: '大圆角', value: 16 },
  { name: '超大', value: 24 },
  { name: '圆形', value: 50 },
  { name: '药丸', value: 9999 }
]

const shapePresets = [
  { name: '圆角矩形', radius: '8px' },
  { name: '完全圆角', radius: '16px' },
  { name: '圆形', radius: '50%' },
  { name: '左圆角', radius: '16px 0 0 16px' },
  { name: '右圆角', radius: '0 16px 16px 0' },
  { name: '上圆角', radius: '16px 16px 0 0' },
  { name: '下圆角', radius: '0 0 16px 16px' },
  { name: '对角', radius: '16px 0 16px 0' }
]

const generatedRadius = computed(() => {
  const { tl, tr, bl, br } = radius.value
  if (tl === tr && tr === bl && bl === br) {
    return `${tl}px`
  }
  return `${tl}px ${tr}px ${br}px ${bl}px`
})

function applyQuickPreset(preset: any) {
  const value = preset.value === 9999 ? 128 : preset.value
  radius.value = { tl: value, tr: value, bl: value, br: value }
}

function applyShapePreset(preset: any) {
  const r = preset.radius
  const match = r.match(/^(\d+px|%)\s+(\d+px|%)\s+(\d+px|%)\s+(\d+px|%)$/)
  if (match) {
    radius.value = {
      tl: parseInt(match[1]),
      tr: parseInt(match[2]),
      br: parseInt(match[3]),
      bl: parseInt(match[4])
    }
  } else if (r === '50%') {
    radius.value = { tl: 128, tr: 128, bl: 128, br: 128 }
  } else {
    const match2 = r.match(/^(\d+)px/)
    if (match2) {
      const val = parseInt(match2[1])
      const parts = r.split(' ')
      if (parts.length === 4) {
        radius.value = {
          tl: parseInt(parts[0]),
          tr: parseInt(parts[1]),
          br: parseInt(parts[2]),
          bl: parseInt(parts[3])
        }
      } else {
        radius.value = { tl: val, tr: val, bl: val, br: val }
      }
    }
  }
}

function resetRadius() {
  radius.value = { tl: 16, tr: 16, bl: 16, br: 16 }
}

function startDrag(e: MouseEvent, corner1: keyof Radius, corner2?: keyof Radius) {
  const startY = e.clientY
  const startValue = radius.value[corner1]

  const onMouseMove = (moveEvent: MouseEvent) => {
    const deltaY = startY - moveEvent.clientY
    const newValue = Math.max(0, Math.min(128, startValue + deltaY / 2))
    radius.value[corner1] = Math.round(newValue)
    if (corner2) {
      radius.value[corner2] = Math.round(newValue)
    }
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

async function copyCSS() {
  const css = `border-radius: ${generatedRadius.value};`
  try {
    await navigator.clipboard.writeText(css)
    alert('已复制CSS代码')
  } catch {}
}
</script>
