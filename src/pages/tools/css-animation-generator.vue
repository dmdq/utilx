<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">CSS动画生成器</h1>
      <p class="text-muted-foreground mb-6">可视化编辑CSS关键帧动画，实时预览和代码生成</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：控制面板 -->
      <div class="space-y-6">
        <!-- 动画基础设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">动画基础设置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">动画名称</label>
              <input
                type="text"
                v-model="animationName"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="myAnimation"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="flex items-center justify-between text-sm font-medium mb-2">
                  持续时间
                  <span class="text-primary">{{ duration }}s</span>
                </label>
                <input
                  type="range"
                  v-model.number="duration"
                  min="0.1"
                  max="10"
                  step="0.1"
                  class="w-full"
                />
              </div>
              <div>
                <label class="flex items-center justify-between text-sm font-medium mb-2">
                  延迟时间
                  <span class="text-primary">{{ delay }}s</span>
                </label>
                <input
                  type="range"
                  v-model.number="delay"
                  min="0"
                  max="5"
                  step="0.1"
                  class="w-full"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">缓动函数</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="easing in easingFunctions"
                  :key="easing.value"
                  @click="selectedEasing = easing.value"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    selectedEasing === easing.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  ]"
                >
                  {{ easing.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">动画循环</label>
              <div class="flex gap-2">
                <button
                  v-for="iteration in iterations"
                  :key="iteration.value"
                  @click="selectedIteration = iteration.value"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    selectedIteration === iteration.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  ]"
                >
                  {{ iteration.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">动画方向</label>
              <select v-model="direction" class="w-full px-3 py-2 border rounded-lg">
                <option value="normal">正常</option>
                <option value="reverse">反向</option>
                <option value="alternate">交替</option>
                <option value="alternate-reverse">反向交替</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 关键帧编辑 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">关键帧</h3>
            <button
              @click="addKeyframe"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              添加关键帧
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(keyframe, index) in keyframes"
              :key="index"
              class="p-4 bg-secondary rounded-lg"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <input
                    type="number"
                    v-model.number="keyframe.position"
                    min="0"
                    max="100"
                    class="w-16 px-2 py-1 border rounded text-sm"
                  />
                  <span class="text-sm">%</span>
                </div>
                <button
                  v-if="keyframes.length > 2"
                  @click="removeKeyframe(index)"
                  class="p-1 text-destructive hover:bg-destructive/10 rounded"
                >
                  <Icon name="Trash2" class="w-4 h-4" />
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium mb-1">X轴位移</label>
                  <input
                    type="number"
                    v-model.number="keyframe.transform.translateX"
                    class="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">Y轴位移</label>
                  <input
                    type="number"
                    v-model.number="keyframe.transform.translateY"
                    class="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">缩放</label>
                  <input
                    type="number"
                    v-model.number="keyframe.transform.scale"
                    min="0"
                    step="0.1"
                    class="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">旋转</label>
                  <input
                    type="number"
                    v-model.number="keyframe.transform.rotate"
                    class="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">透明度</label>
                  <input
                    type="number"
                    v-model.number="keyframe.opacity"
                    min="0"
                    max="1"
                    step="0.1"
                    class="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">背景色</label>
                  <input
                    type="color"
                    v-model="keyframe.backgroundColor"
                    class="w-full h-8 border rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设动画 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预设动画</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="preset in animationPresets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="p-3 rounded-lg border hover:border-primary transition-colors"
            >
              <div class="font-medium text-sm">{{ preset.name }}</div>
              <div class="text-xs text-muted-foreground">{{ preset.description }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和代码 -->
      <div class="space-y-6">
        <!-- 预览区域 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">预览</h3>
            <div class="flex gap-2">
              <button
                @click="playAnimation"
                class="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
              >
                播放
              </button>
              <button
                @click="pauseAnimation"
                class="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
              >
                暂停
              </button>
              <button
                @click="resetAnimation"
                class="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
              >
                重置
              </button>
            </div>
          </div>

          <!-- 预览元素 -->
          <div class="flex flex-col items-center justify-center h-80 bg-muted rounded-lg">
            <div
              ref="previewElement"
              class="preview-element"
              :style="previewStyle"
            >
              <div class="text-white font-semibold">动画元素</div>
            </div>
          </div>

          <!-- 多个预览对象 -->
          <div class="grid grid-cols-3 gap-4 mt-6">
            <div
              class="preview-small"
              :style="previewStyle"
            >
              <div class="w-full h-full bg-blue-500 rounded flex items-center justify-center text-white text-xs">
                方形
              </div>
            </div>
            <div
              class="preview-small rounded-full"
              :style="previewStyle"
            >
              <div class="w-full h-full bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                圆形
              </div>
            </div>
            <div
              class="preview-small"
              style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"
              :style="previewStyle"
            >
              <div class="w-full h-full bg-purple-500 flex items-center justify-center text-white text-xs">
                三角
              </div>
            </div>
          </div>
        </div>

        <!-- 时间轴视图 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">时间轴</h3>
          <div class="relative h-16 bg-muted rounded-lg overflow-hidden">
            <!-- 时间标尺 -->
            <div class="absolute top-0 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            <!-- 关键帧标记 -->
            <div
              v-for="(keyframe, index) in keyframes"
              :key="index"
              class="absolute top-6 w-1 h-8 bg-primary"
              :style="{ left: `${keyframe.position}%` }"
            >
              <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs">
                {{ keyframe.position }}%
              </div>
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
import { ref, computed, nextTick } from 'vue'
import { Trash2 } from 'lucide-vue-next'

// SEO设置
useSeoMeta({
  title: 'CSS动画生成器 - 在线可视化编辑CSS关键帧动画',
  description: '免费CSS动画生成器，可视化编辑CSS关键帧动画，实时预览和代码生成。支持位移、缩放、旋转、透明度等动画属性，提供预设动画模板。专业的CSS动画设计工具。',
  keywords: ['CSS动画生成器', '关键帧动画', 'CSS动画编辑器', '动画制作工具', '网页动画设计', 'CSS keyframes', '动画效果制作', '前端动画工具', 'UI动画设计', 'CSS动画代码生成', '动画时间轴编辑', '动画预设模板'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CSS动画生成器',
    description: '免费的在线CSS动画生成器，可视化编辑关键帧动画，支持多种动画属性和预设模板。',
    url: 'https://util.iskytrip.com/tools/css-animation-generator',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '可视化动画编辑',
      '关键帧时间轴',
      '多属性动画支持',
      '实时预览效果',
      '预设动画模板',
      '动画参数调节',
      'CSS代码生成',
      '动画播放控制'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'UI设计师、前端开发者、动画设计师'
    }
  }
})

// 动画基础设置
const animationName = ref('myAnimation')
const duration = ref(2)
const delay = ref(0)
const selectedEasing = ref('ease')
const selectedIteration = ref('1')
const direction = ref('normal')

// 缓动函数
const easingFunctions = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' }
]

// 迭代次数
const iterations = [
  { value: '1', label: '1次' },
  { value: '2', label: '2次' },
  { value: '3', label: '3次' },
  { value: 'infinite', label: '无限' }
]

// 关键帧
const keyframes = ref([
  {
    position: 0,
    transform: {
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotate: 0
    },
    opacity: 1,
    backgroundColor: '#3b82f6'
  },
  {
    position: 100,
    transform: {
      translateX: 100,
      translateY: 0,
      scale: 1.5,
      rotate: 360
    },
    opacity: 0.5,
    backgroundColor: '#ef4444'
  }
])

// 预设动画
const animationPresets = [
  {
    name: '淡入淡出',
    description: '透明度变化动画',
    keyframes: [
      { position: 0, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 0, backgroundColor: '#3b82f6' },
      { position: 50, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 1, backgroundColor: '#3b82f6' },
      { position: 100, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 0, backgroundColor: '#3b82f6' }
    ]
  },
  {
    name: '弹跳',
    description: '弹跳效果动画',
    keyframes: [
      { position: 0, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 1, backgroundColor: '#10b981' },
      { position: 20, transform: { translateX: 0, translateY: -50, scale: 1.1, rotate: 0 }, opacity: 1, backgroundColor: '#10b981' },
      { position: 40, transform: { translateX: 0, translateY: 0, scale: 0.9, rotate: 0 }, opacity: 1, backgroundColor: '#10b981' },
      { position: 60, transform: { translateX: 0, translateY: -30, scale: 1.05, rotate: 0 }, opacity: 1, backgroundColor: '#10b981' },
      { position: 80, transform: { translateX: 0, translateY: 0, scale: 0.95, rotate: 0 }, opacity: 1, backgroundColor: '#10b981' },
      { position: 100, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 1, backgroundColor: '#10b981' }
    ]
  },
  {
    name: '旋转缩放',
    description: '旋转和缩放组合',
    keyframes: [
      { position: 0, transform: { translateX: 0, translateY: 0, scale: 0, rotate: 0 }, opacity: 0, backgroundColor: '#f59e0b' },
      { position: 50, transform: { translateX: 50, translateY: -50, scale: 1.2, rotate: 180 }, opacity: 1, backgroundColor: '#ef4444' },
      { position: 100, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 360 }, opacity: 1, backgroundColor: '#8b5cf6' }
    ]
  },
  {
    name: '摇摆',
    description: '左右摇摆动画',
    keyframes: [
      { position: 0, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 1, backgroundColor: '#06b6d4' },
      { position: 25, transform: { translateX: -30, translateY: 0, scale: 1, rotate: -15 }, opacity: 1, backgroundColor: '#06b6d4' },
      { position: 75, transform: { translateX: 30, translateY: 0, scale: 1, rotate: 15 }, opacity: 1, backgroundColor: '#06b6d4' },
      { position: 100, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 1, backgroundColor: '#06b6d4' }
    ]
  },
  {
    name: '脉冲',
    description: '脉冲呼吸效果',
    keyframes: [
      { position: 0, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 1, backgroundColor: '#ec4899' },
      { position: 50, transform: { translateX: 0, translateY: 0, scale: 1.3, rotate: 0 }, opacity: 0.7, backgroundColor: '#ec4899' },
      { position: 100, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 1, backgroundColor: '#ec4899' }
    ]
  },
  {
    name: '滑入',
    description: '从右侧滑入',
    keyframes: [
      { position: 0, transform: { translateX: 200, translateY: 0, scale: 1, rotate: 0 }, opacity: 0, backgroundColor: '#22c55e' },
      { position: 100, transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 }, opacity: 1, backgroundColor: '#22c55e' }
    ]
  }
]

// 预览元素引用
const previewElement = ref(null)

// 计算预览样式
const previewStyle = computed(() => {
  const keyframeCSS = keyframes.value
    .map(kf => {
      const transform = `translateX(${kf.transform.translateX}px) translateY(${kf.transform.translateY}px) scale(${kf.transform.scale}) rotate(${kf.transform.rotate}deg)`
      return `${kf.position}% {
        transform: ${transform};
        opacity: ${kf.opacity};
        background-color: ${kf.backgroundColor};
      }`
    })
    .join('\n      ')

  return {
    '--animation-name': animationName.value,
    '--animation-duration': `${duration.value}s`,
    '--animation-delay': `${delay.value}s`,
    '--animation-timing-function': selectedEasing.value,
    '--animation-iteration-count': selectedIteration.value,
    '--animation-direction': direction.value,
    '--keyframes': keyframeCSS,
    animation: `var(--animation-name) var(--animation-duration) var(--animation-timing-function) var(--animation-delay) var(--animation-iteration-count) var(--animation-direction) both`
  }
})

// 计算CSS代码
const cssCode = computed(() => {
  const keyframeCSS = keyframes.value
    .map(kf => {
      const transform = `translateX(${kf.transform.translateX}px) translateY(${kf.transform.translateY}px) scale(${kf.transform.scale}) rotate(${kf.transform.rotate}deg)`
      return `  ${kf.position}% {
    transform: ${transform};
    opacity: ${kf.opacity};
    background-color: ${kf.backgroundColor};
  }`
    })
    .join('\n')

  return `@keyframes ${animationName.value} {
${keyframeCSS}
}

.element {
  animation: ${animationName.value} ${duration.value}s ${selectedEasing.value} ${delay.value}s ${selectedIteration.value} ${direction.value};
}`
})

// 方法
const addKeyframe = () => {
  if (keyframes.value.length >= 10) return

  const sortedKeyframes = [...keyframes.value].sort((a, b) => a.position - b.position)
  let insertPosition = 50

  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    const current = sortedKeyframes[i].position
    const next = sortedKeyframes[i + 1].position
    if (next - current > 10) {
      insertPosition = current + (next - current) / 2
      break
    }
  }

  keyframes.value.push({
    position: Math.round(insertPosition),
    transform: {
      translateX: 0,
      translateY: 0,
      scale: 1,
      rotate: 0
    },
    opacity: 1,
    backgroundColor: '#3b82f6'
  })
}

const removeKeyframe = (index) => {
  keyframes.value.splice(index, 1)
}

const applyPreset = (preset) => {
  keyframes.value = JSON.parse(JSON.stringify(preset.keyframes))
}

const playAnimation = async () => {
  if (previewElement.value) {
    previewElement.value.style.animationPlayState = 'running'
  }
}

const pauseAnimation = () => {
  if (previewElement.value) {
    previewElement.value.style.animationPlayState = 'paused'
  }
}

const resetAnimation = async () => {
  if (previewElement.value) {
    previewElement.value.style.animation = 'none'
    await nextTick()
    previewElement.value.style.animation = ''
  }
}

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
.preview-element {
  @apply w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-lg;
}

.preview-small {
  @apply w-full h-16 bg-blue-500 flex items-center justify-center text-white font-medium;
}
</style>