<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">CSS阴影生成器</h1>
      <p class="text-muted-foreground mb-6">可视化生成CSS阴影效果，支持box-shadow和text-shadow</p>

      <!-- 阴影类型选择 -->
      <div class="flex gap-2 mb-6">
        <button
          v-for="type in shadowTypes"
          :key="type.value"
          @click="shadowType = type.value"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            shadowType === type.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          ]"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：预览区域 -->
      <div class="space-y-6">
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预览</h3>

          <!-- Box Shadow预览 -->
          <div v-if="shadowType === 'box'" class="space-y-6">
            <div
              class="preview-box"
              :style="boxShadowPreviewStyle"
            >
              <div class="preview-content">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg"></div>
                <p class="text-sm text-muted-foreground">示例卡片</p>
              </div>
            </div>

            <!-- 不同背景下的预览 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white p-4 rounded border">
                <div
                  class="w-full h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"
                  :style="{ boxShadow: boxShadowCSS }"
                ></div>
                <p class="text-xs text-center mt-2 text-muted-foreground">白色背景</p>
              </div>
              <div class="bg-gray-900 p-4 rounded border">
                <div
                  class="w-full h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg"
                  :style="{ boxShadow: boxShadowCSS }"
                ></div>
                <p class="text-xs text-center mt-2 text-gray-400">深色背景</p>
              </div>
            </div>
          </div>

          <!-- Text Shadow预览 -->
          <div v-else class="space-y-6">
            <div
              class="preview-text text-center p-8"
              :style="textShadowPreviewStyle"
            >
              <h2 class="text-4xl font-bold mb-4">Hello Shadow</h2>
              <p class="text-lg">文字阴影效果展示</p>
            </div>

            <!-- 不同背景下的预览 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white p-4 rounded border">
                <h3 class="text-2xl font-bold text-center" :style="{ textShadow: textShadowCSS }">
                  白色背景
                </h3>
              </div>
              <div class="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded border">
                <h3 class="text-2xl font-bold text-center text-white" :style="{ textShadow: textShadowCSS }">
                  渐变背景
                </h3>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设阴影 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预设效果</h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="preset in currentPresets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="p-4 rounded-lg border hover:border-primary transition-colors"
            >
              <div
                class="w-full h-12 mb-2 rounded"
                :style="preset.style"
              ></div>
              <p class="text-xs text-center">{{ preset.name }}</p>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：控制面板 -->
      <div class="space-y-6">
        <!-- Box Shadow控制 -->
        <div v-if="shadowType === 'box'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">阴影属性</h3>

          <div class="space-y-4">
            <!-- 水平偏移 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                水平偏移
                <span class="text-primary">{{ boxShadow.x }}px</span>
              </label>
              <input
                type="range"
                v-model.number="boxShadow.x"
                min="-50"
                max="50"
                class="w-full"
              />
            </div>

            <!-- 垂直偏移 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                垂直偏移
                <span class="text-primary">{{ boxShadow.y }}px</span>
              </label>
              <input
                type="range"
                v-model.number="boxShadow.y"
                min="-50"
                max="50"
                class="w-full"
              />
            </div>

            <!-- 模糊半径 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                模糊半径
                <span class="text-primary">{{ boxShadow.blur }}px</span>
              </label>
              <input
                type="range"
                v-model.number="boxShadow.blur"
                min="0"
                max="100"
                class="w-full"
              />
            </div>

            <!-- 扩展半径 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                扩展半径
                <span class="text-primary">{{ boxShadow.spread }}px</span>
              </label>
              <input
                type="range"
                v-model.number="boxShadow.spread"
                min="-50"
                max="50"
                class="w-full"
              />
            </div>

            <!-- 阴影颜色 -->
            <div>
              <label class="block text-sm font-medium mb-2">阴影颜色</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  v-model="boxShadow.color"
                  class="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  v-model="boxShadow.color"
                  class="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="#000000"
                />
              </div>
            </div>

            <!-- 透明度 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                透明度
                <span class="text-primary">{{ Math.round(boxShadow.opacity * 100) }}%</span>
              </label>
              <input
                type="range"
                v-model.number="boxShadow.opacity"
                min="0"
                max="1"
                step="0.01"
                class="w-full"
              />
            </div>

            <!-- 内阴影 -->
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="boxShadow.inset"
                id="inset"
                class="rounded"
              />
              <label for="inset" class="text-sm font-medium">内阴影 (inset)</label>
            </div>
          </div>
        </div>

        <!-- Text Shadow控制 -->
        <div v-else class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">文字阴影属性</h3>

          <div class="space-y-4">
            <!-- 水平偏移 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                水平偏移
                <span class="text-primary">{{ textShadow.x }}px</span>
              </label>
              <input
                type="range"
                v-model.number="textShadow.x"
                min="-20"
                max="20"
                class="w-full"
              />
            </div>

            <!-- 垂直偏移 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                垂直偏移
                <span class="text-primary">{{ textShadow.y }}px</span>
              </label>
              <input
                type="range"
                v-model.number="textShadow.y"
                min="-20"
                max="20"
                class="w-full"
              />
            </div>

            <!-- 模糊半径 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                模糊半径
                <span class="text-primary">{{ textShadow.blur }}px</span>
              </label>
              <input
                type="range"
                v-model.number="textShadow.blur"
                min="0"
                max="50"
                class="w-full"
              />
            </div>

            <!-- 阴影颜色 -->
            <div>
              <label class="block text-sm font-medium mb-2">阴影颜色</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  v-model="textShadow.color"
                  class="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  v-model="textShadow.color"
                  class="flex-1 px-3 py-2 border rounded-lg"
                  placeholder="#000000"
                />
              </div>
            </div>

            <!-- 透明度 -->
            <div>
              <label class="flex items-center justify-between text-sm font-medium mb-2">
                透明度
                <span class="text-primary">{{ Math.round(textShadow.opacity * 100) }}%</span>
              </label>
              <input
                type="range"
                v-model.number="textShadow.opacity"
                min="0"
                max="1"
                step="0.01"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- 多层阴影 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">多层阴影</h3>
            <button
              v-if="shadowType === 'box'"
              @click="addBoxShadowLayer"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              添加阴影层
            </button>
          </div>

          <div v-if="shadowType === 'box' && multipleShadows.length > 0" class="space-y-3">
            <div
              v-for="(shadow, index) in multipleShadows"
              :key="index"
              class="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <span class="text-sm font-mono">{{ shadow }}</span>
              <button
                @click="removeShadowLayer(index)"
                class="p-1 text-destructive hover:bg-destructive/10 rounded"
              >
                <Icon name="X" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">当前为单层阴影模式</p>
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
import { ref, computed } from 'vue'
import { X, Trash2 } from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: 'CSS阴影生成器 - 在线生成box-shadow和text-shadow效果',
  description: '免费CSS阴影生成器，可视化生成CSS阴影效果，支持box-shadow和text-shadow。可自定义水平偏移、垂直偏移、模糊半径、扩展半径、阴影颜色，实时预览。专业的CSS阴影设计工具。',
  keywords: ['CSS阴影生成器', 'box-shadow生成器', 'text-shadow工具', 'CSS阴影效果', '文字阴影制作', '盒子阴影设计', '阴影参数调节', '网页阴影样式', 'CSS shadow属性', 'UI阴影设计', '前端阴影工具', '多层阴影效果'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CSS阴影生成器',
    description: '免费的在线CSS阴影生成器，支持box-shadow和text-shadow，实时预览和代码生成。',
    url: 'https://util.iskytrip.com/tools/shadow-generator',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      'Box Shadow生成',
      'Text Shadow制作',
      '多层阴影叠加',
      '阴影参数调节',
      '阴影颜色设置',
      '内阴影效果',
      '实时预览展示',
      'CSS代码生成'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'UI设计师、前端开发者、网页设计师'
    }
  }
})

// 阴影类型
const shadowType = ref('box')
const shadowTypes = [
  { value: 'box', label: 'Box Shadow' },
  { value: 'text', label: 'Text Shadow' }
]

// Box Shadow属性
const boxShadow = ref({
  x: 0,
  y: 4,
  blur: 6,
  spread: 0,
  color: '#000000',
  opacity: 0.2,
  inset: false
})

// Text Shadow属性
const textShadow = ref({
  x: 2,
  y: 2,
  blur: 4,
  color: '#000000',
  opacity: 0.3
})

// 多层阴影
const multipleShadows = ref([])

// Box Shadow预设
const boxPresets = [
  {
    name: '微妙阴影',
    values: { x: 0, y: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.1, inset: false }
  },
  {
    name: '卡片阴影',
    values: { x: 0, y: 4, blur: 6, spread: -1, color: '#000000', opacity: 0.1, inset: false }
  },
  {
    name: '深度阴影',
    values: { x: 0, y: 10, blur: 15, spread: -3, color: '#000000', opacity: 0.2, inset: false }
  },
  {
    name: '悬浮阴影',
    values: { x: 0, y: 20, blur: 25, spread: -5, color: '#000000', opacity: 0.15, inset: false }
  },
  {
    name: '内阴影',
    values: { x: 0, y: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.1, inset: true }
  },
  {
    name: '霓虹阴影',
    values: { x: 0, y: 0, blur: 20, spread: 0, color: '#00ffff', opacity: 0.8, inset: false }
  }
]

// Text Shadow预设
const textPresets = [
  {
    name: '简单阴影',
    values: { x: 1, y: 1, blur: 2, color: '#000000', opacity: 0.3 }
  },
  {
    name: '深度阴影',
    values: { x: 2, y: 2, blur: 4, color: '#000000', opacity: 0.5 }
  },
  {
    name: '发光效果',
    values: { x: 0, y: 0, blur: 10, color: '#ff0000', opacity: 0.8 }
  },
  {
    name: '立体阴影',
    values: { x: 3, y: 3, blur: 0, color: '#000000', opacity: 0.5 }
  },
  {
    name: '多层阴影',
    values: { x: 1, y: 1, blur: 2, color: '#000000', opacity: 0.5 }
  },
  {
    name: '复古阴影',
    values: { x: 3, y: 3, blur: 0, color: '#8b4513', opacity: 0.7 }
  }
]

// 计算当前预设
const currentPresets = computed(() => {
  return shadowType.value === 'box' ? boxPresets : textPresets
})

// 计算Box Shadow CSS
const boxShadowCSS = computed(() => {
  const { x, y, blur, spread, color, opacity, inset } = boxShadow.value
  const rgba = hexToRgba(color, opacity)
  const insetStr = inset ? 'inset ' : ''
  return `${insetStr}${x}px ${y}px ${blur}px ${spread}px ${rgba}`
})

// 计算Text Shadow CSS
const textShadowCSS = computed(() => {
  const { x, y, blur, color, opacity } = textShadow.value
  const rgba = hexToRgba(color, opacity)
  return `${x}px ${y}px ${blur}px ${rgba}`
})

// 计算最终CSS代码
const cssCode = computed(() => {
  const property = shadowType.value === 'box' ? 'box-shadow' : 'text-shadow'
  const value = shadowType.value === 'box' ? boxShadowCSS.value : textShadowCSS.value

  // 添加多层阴影
  if (shadowType.value === 'box' && multipleShadows.value.length > 0) {
    return `${property}: ${value}, ${multipleShadows.value.join(', ')};`
  }

  return `${property}: ${value};`
})

// 预览样式
const boxShadowPreviewStyle = computed(() => {
  return {
    boxShadow: boxShadowCSS.value,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
})

const textShadowPreviewStyle = computed(() => {
  return {
    textShadow: textShadowCSS.value,
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#ffffff'
  }
})

// HEX转RGBA
const hexToRgba = (hex, opacity) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// 应用预设
const applyPreset = (preset) => {
  if (shadowType.value === 'box') {
    Object.assign(boxShadow.value, preset.values)
  } else {
    Object.assign(textShadow.value, preset.values)
  }
}

// 添加阴影层
const addBoxShadowLayer = () => {
  if (multipleShadows.value.length >= 5) return
  multipleShadows.value.push(boxShadowCSS.value)
}

// 删除阴影层
const removeShadowLayer = (index) => {
  multipleShadows.value.splice(index, 1)
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
  @apply rounded-xl p-8 transition-all duration-300;
}

.preview-content {
  @apply flex flex-col items-center justify-center text-white;
}

.preview-text {
  @apply rounded-xl;
}
</style>