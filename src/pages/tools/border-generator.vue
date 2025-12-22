<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">CSS边框生成器</h1>
      <p class="text-muted-foreground mb-6">可视化生成CSS边框样式，支持圆角、虚线、图片边框等</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：预览区域 -->
      <div class="space-y-6">
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预览</h3>
          <div
            class="preview-box"
            :style="previewStyle"
          >
            <div class="preview-content">
              <h4 class="text-xl font-semibold mb-2">边框预览</h4>
              <p class="text-muted-foreground">这是一个展示边框效果的示例元素</p>
            </div>
          </div>
        </div>

        <!-- 不同尺寸预览 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">多种尺寸预览</h3>
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="size in previewSizes"
              :key="size.name"
              class="text-center"
            >
              <div
                class="preview-size-box mx-auto mb-2"
                :style="{
                  ...previewStyle,
                  width: size.width + 'px',
                  height: size.height + 'px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }"
              >
                {{ size.name }}
              </div>
              <p class="text-xs text-muted-foreground">{{ size.width }}×{{ size.height }}</p>
            </div>
          </div>
        </div>

        <!-- 预设样式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预设样式</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="preset in borderPresets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="p-4 rounded-lg border hover:border-primary transition-colors"
            >
              <div
                class="w-full h-16 mb-2 rounded"
                :style="getPresetStyle(preset)"
              ></div>
              <p class="text-sm text-center">{{ preset.name }}</p>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：控制面板 -->
      <div class="space-y-6">
        <!-- 边框宽度 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">边框宽度</h3>

          <!-- 统一设置 -->
          <div class="mb-4">
            <label class="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                v-model="uniformBorder"
                class="rounded"
              />
              <span class="text-sm font-medium">统一设置所有边</span>
            </label>
          </div>

          <!-- 单独设置 -->
          <div class="space-y-3">
            <div
              v-for="(side, index) in borderSides"
              :key="side.name"
            >
              <div v-if="uniformBorder && index === 0" class="space-y-2">
                <label class="flex items-center justify-between text-sm font-medium">
                  所有边
                  <span class="text-primary">{{ borderWidth.top }}px</span>
                </label>
                <input
                  type="range"
                  v-model.number="borderWidth.top"
                  min="0"
                  max="50"
                  class="w-full"
                />
              </div>
              <div v-else-if="!uniformBorder" class="space-y-2">
                <label class="flex items-center justify-between text-sm font-medium">
                  {{ side.label }}
                  <span class="text-primary">{{ borderWidth[side.name] }}px</span>
                </label>
                <input
                  type="range"
                  v-model.number="borderWidth[side.name]"
                  min="0"
                  max="50"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 边框样式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">边框样式</h3>
          <div class="grid grid-cols-2 gap-2 mb-4">
            <button
              v-for="style in borderStyles"
              :key="style.value"
              @click="borderStyle = style.value"
              :class="[
                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                borderStyle === style.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              ]"
            >
              {{ style.label }}
            </button>
          </div>

          <!-- 虚线设置 -->
          <div v-if="borderStyle === 'dashed'" class="space-y-3">
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                虚线长度
                <span class="text-primary">{{ dashLength }}px</span>
              </label>
              <input
                type="range"
                v-model.number="dashLength"
                min="1"
                max="20"
                class="w-full"
              />
            </div>
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                虚线间隙
                <span class="text-primary">{{ dashGap }}px</span>
              </label>
              <input
                type="range"
                v-model.number="dashGap"
                min="1"
                max="20"
                class="w-full"
              />
            </div>
          </div>

          <!-- 点线设置 -->
          <div v-if="borderStyle === 'dotted'" class="space-y-3">
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                点线直径
                <span class="text-primary">{{ dotSize }}px</span>
              </label>
              <input
                type="range"
                v-model.number="dotSize"
                min="1"
                max="10"
                class="w-full"
              />
            </div>
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                点线间隙
                <span class="text-primary">{{ dotGap }}px</span>
              </label>
              <input
                type="range"
                v-model.number="dotGap"
                min="1"
                max="15"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- 边框颜色 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">边框颜色</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <input
                type="color"
                v-model="borderColor"
                class="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                v-model="borderColor"
                class="flex-1 px-3 py-2 border rounded-lg"
                placeholder="#000000"
              />
            </div>

            <!-- 透明度 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                透明度
                <span class="text-primary">{{ Math.round(borderOpacity * 100) }}%</span>
              </label>
              <input
                type="range"
                v-model.number="borderOpacity"
                min="0"
                max="1"
                step="0.01"
                class="w-full"
              />
            </div>

            <!-- 预设颜色 -->
            <div class="grid grid-cols-8 gap-2">
              <button
                v-for="color in presetColors"
                :key="color"
                @click="borderColor = color"
                class="w-8 h-8 rounded border-2 border-gray-200 hover:scale-110 transition-transform"
                :style="{ backgroundColor: color }"
                :title="color"
              ></button>
            </div>
          </div>
        </div>

        <!-- 圆角设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">圆角设置</h3>

          <!-- 统一设置 -->
          <div class="mb-4">
            <label class="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                v-model="uniformRadius"
                class="rounded"
              />
              <span class="text-sm font-medium">统一设置所有角</span>
            </label>
          </div>

          <!-- 单独设置 -->
          <div class="space-y-3">
            <div
              v-for="(corner, index) in borderCorners"
              :key="corner.name"
            >
              <div v-if="uniformRadius && index === 0" class="space-y-2">
                <label class="flex items-center justify-between text-sm font-medium">
                  所有角
                  <span class="text-primary">{{ borderRadius.topLeft }}px</span>
                </label>
                <input
                  type="range"
                  v-model.number="borderRadius.topLeft"
                  min="0"
                  max="100"
                  class="w-full"
                />
              </div>
              <div v-else-if="!uniformRadius" class="space-y-2">
                <label class="flex items-center justify-between text-sm font-medium">
                  {{ corner.label }}
                  <span class="text-primary">{{ borderRadius[corner.name] }}px</span>
                </label>
                <input
                  type="range"
                  v-model.number="borderRadius[corner.name]"
                  min="0"
                  max="100"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 图片边框 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">图片边框</h3>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="useImageBorder"
                class="rounded"
              />
              <span class="text-sm font-medium">启用</span>
            </label>
          </div>

          <div v-if="useImageBorder" class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-2">图片URL</label>
              <input
                type="text"
                v-model="imageBorderUrl"
                placeholder="https://example.com/pattern.png"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                边框切片
                <span class="text-primary">{{ imageBorderSlice }}px</span>
              </label>
              <input
                type="range"
                v-model.number="imageBorderSlice"
                min="1"
                max="100"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- CSS代码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">CSS代码</h3>
            <button
              @click="copyCSS"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              复制代码
            </button>
          </div>
          <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm"><code>{{ cssCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// SEO设置
useSeoMeta({
  title: 'CSS边框生成器 - 在线生成CSS边框样式和圆角效果',
  description: '免费CSS边框生成器，可视化生成CSS边框样式，支持圆角、虚线、实线、双线、图片边框等效果。可自定义边框宽度、颜色、圆角半径，实时预览。专业的CSS边框设计工具。',
  keywords: ['CSS边框生成器', '边框样式设计', 'CSS边框制作', '圆角边框生成', '虚线边框设计', '图片边框工具', '边框半径设置', '网页边框样式', 'CSS border属性', 'UI边框设计', '前端边框工具', '边框效果预览'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CSS边框生成器',
    description: '免费的在线CSS边框生成器，支持多种边框样式和圆角效果，实时预览和代码生成。',
    url: 'https://util.iskytrip.com/tools/border-generator',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '多种边框样式',
      '圆角边框生成',
      '边框颜色设置',
      '虚线参数调节',
      '图片边框支持',
      '边框尺寸预览',
      '统一边框设置',
      'CSS代码生成'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'UI设计师、前端开发者、网页设计师'
    }
  }
})

// 边框设置
const uniformBorder = ref(true)
const borderWidth = ref({
  top: 2,
  right: 2,
  bottom: 2,
  left: 2
})

const borderSides = [
  { name: 'top', label: '上边框' },
  { name: 'right', label: '右边框' },
  { name: 'bottom', label: '下边框' },
  { name: 'left', label: '左边框' }
]

// 边框样式
const borderStyle = ref('solid')
const borderStyles = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
  { value: 'double', label: '双线' },
  { value: 'groove', label: '凹槽' },
  { value: 'ridge', label: '凸起' },
  { value: 'inset', label: '内嵌' },
  { value: 'outset', label: '外凸' }
]

// 虚线设置
const dashLength = ref(10)
const dashGap = ref(5)

// 点线设置
const dotSize = ref(3)
const dotGap = ref(5)

// 边框颜色
const borderColor = ref('#3b82f6')
const borderOpacity = ref(1)

const presetColors = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#6b7280', '#a78bfa', '#60a5fa', '#34d399'
]

// 圆角设置
const uniformRadius = ref(true)
const borderRadius = ref({
  topLeft: 8,
  topRight: 8,
  bottomRight: 8,
  bottomLeft: 8
})

const borderCorners = [
  { name: 'topLeft', label: '左上角' },
  { name: 'topRight', label: '右上角' },
  { name: 'bottomRight', label: '右下角' },
  { name: 'bottomLeft', label: '左下角' }
]

// 图片边框
const useImageBorder = ref(false)
const imageBorderUrl = ref('')
const imageBorderSlice = ref(30)

// 预设样式
const borderPresets = [
  {
    name: '简约边框',
    style: {
      borderWidth: { top: 1, right: 1, bottom: 1, left: 1 },
      borderColor: '#e5e7eb',
      borderStyle: 'solid',
      borderRadius: { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 }
    }
  },
  {
    name: '卡片边框',
    style: {
      borderWidth: { top: 2, right: 2, bottom: 2, left: 2 },
      borderColor: '#d1d5db',
      borderStyle: 'solid',
      borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 }
    }
  },
  {
    name: '虚线边框',
    style: {
      borderWidth: { top: 2, right: 2, bottom: 2, left: 2 },
      borderColor: '#6366f1',
      borderStyle: 'dashed',
      borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 }
    }
  },
  {
    name: '圆润边框',
    style: {
      borderWidth: { top: 3, right: 3, bottom: 3, left: 3 },
      borderColor: '#10b981',
      borderStyle: 'solid',
      borderRadius: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 }
    }
  },
  {
    name: '不对称圆角',
    style: {
      borderWidth: { top: 2, right: 2, bottom: 2, left: 2 },
      borderColor: '#f59e0b',
      borderStyle: 'solid',
      borderRadius: { topLeft: 20, topRight: 8, bottomRight: 20, bottomLeft: 8 }
    }
  },
  {
    name: '霓虹边框',
    style: {
      borderWidth: { top: 3, right: 3, bottom: 3, left: 3 },
      borderColor: '#8b5cf6',
      borderStyle: 'solid',
      borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 }
    }
  }
]

// 预览尺寸
const previewSizes = [
  { name: '小', width: 60, height: 60 },
  { name: '中', width: 100, height: 100 },
  { name: '大', width: 150, height: 150 }
]

// 同步设置
watch(uniformBorder, (value) => {
  if (value) {
    const width = borderWidth.value.top
    borderWidth.value = {
      top: width,
      right: width,
      bottom: width,
      left: width
    }
  }
})

watch(borderWidth, (value) => {
  if (uniformBorder.value) {
    const width = value.top
    borderWidth.value = {
      top: width,
      right: width,
      bottom: width,
      left: width
    }
  }
}, { deep: true })

watch(uniformRadius, (value) => {
  if (value) {
    const radius = borderRadius.value.topLeft
    borderRadius.value = {
      topLeft: radius,
      topRight: radius,
      bottomRight: radius,
      bottomLeft: radius
    }
  }
})

watch(borderRadius, (value) => {
  if (uniformRadius.value) {
    const radius = value.topLeft
    borderRadius.value = {
      topLeft: radius,
      topRight: radius,
      bottomRight: radius,
      bottomLeft: radius
    }
  }
}, { deep: true })

// 计算边框样式
const computedBorderStyle = computed(() => {
  if (borderStyle.value === 'dashed') {
    return `dashed ${dashLength.value}px ${dashGap.value}px`
  } else if (borderStyle.value === 'dotted') {
    return `dotted ${dotSize.value}px ${dotGap.value}px`
  }
  return borderStyle.value
})

// 计算预览样式
const previewStyle = computed(() => {
  const style = {
    borderWidth: `${borderWidth.value.top}px ${borderWidth.value.right}px ${borderWidth.value.bottom}px ${borderWidth.value.left}px`,
    borderStyle: borderStyle.value,
    borderColor: hexToRgba(borderColor.value, borderOpacity.value),
    borderRadius: `${borderRadius.value.topLeft}px ${borderRadius.value.topRight}px ${borderRadius.value.bottomRight}px ${borderRadius.value.bottomLeft}px`
  }

  if (useImageBorder.value && imageBorderUrl.value) {
    style.borderImage = `url("${imageBorderUrl.value}") ${imageBorderSlice.value} stretch`
  }

  return style
})

// 计算CSS代码
const cssCode = computed(() => {
  const width = `${borderWidth.value.top}px ${borderWidth.value.right}px ${borderWidth.value.bottom}px ${borderWidth.value.left}px}`
  const radius = `${borderRadius.value.topLeft}px ${borderRadius.value.topRight}px ${borderRadius.value.bottomRight}px ${borderRadius.value.bottomLeft}px`
  const color = hexToRgba(borderColor.value, borderOpacity.value)

  let code = `border-width: ${width};
border-style: ${borderStyle.value};
border-color: ${color};
border-radius: ${radius};`

  if (useImageBorder.value && imageBorderUrl.value) {
    code += `\nborder-image: url("${imageBorderUrl.value}") ${imageBorderSlice.value} stretch;`
  }

  if (borderStyle.value === 'dashed') {
    code += `\n/* 虚线效果可能需要额外配置 */`
  }

  return code
})

// HEX转RGBA
const hexToRgba = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// 获取预设样式
const getPresetStyle = (preset) => {
  const { style } = preset
  return {
    borderWidth: `${style.borderWidth.top}px ${style.borderWidth.right}px ${style.borderWidth.bottom}px ${style.borderWidth.left}px`,
    borderStyle: style.borderStyle,
    borderColor: style.borderColor,
    borderRadius: `${style.borderRadius.topLeft}px ${style.borderRadius.topRight}px ${style.borderRadius.bottomRight}px ${style.borderRadius.bottomLeft}px`
  }
}

// 应用预设
const applyPreset = (preset) => {
  const { style } = preset
  borderWidth.value = { ...style.borderWidth }
  borderColor.value = style.borderColor
  borderStyle.value = style.borderStyle
  borderRadius.value = { ...style.borderRadius }
  borderOpacity.value = 1
  useImageBorder.value = false
}

// 复制CSS代码
const copyCSS = async () => {
  try {
    await navigator.clipboard.writeText(cssCode.value)
    alert('CSS代码已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.preview-box {
  @apply w-full h-64 p-8 bg-gradient-to-br from-blue-50 to-purple-50 transition-all duration-300;
}

.preview-size-box {
  @apply bg-white text-gray-700 font-medium;
}

.preview-content {
  @apply text-center;
}
</style>