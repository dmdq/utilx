<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">CSS渐变生成器</h1>
      <p class="text-muted-foreground mb-6">可视化生成CSS渐变代码，支持线性、径向和锥形渐变</p>

      <!-- 渐变类型选择 -->
      <div class="flex gap-2 mb-6">
        <button
          v-for="type in gradientTypes"
          :key="type.value"
          @click="gradientType = type.value"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            gradientType === type.value
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
          <div
            class="w-full h-64 rounded-lg shadow-inner"
            :style="gradientStyle"
          ></div>
        </div>

        <!-- 预设渐变 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">预设渐变</h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="h-20 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              :style="preset.style"
              :title="preset.name"
            ></button>
          </div>
        </div>
      </div>

      <!-- 右侧：控制面板 -->
      <div class="space-y-6">
        <!-- 色标控制 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">色标</h3>
            <button
              @click="addColorStop"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              添加色标
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(stop, index) in colorStops"
              :key="index"
              class="flex items-center gap-3"
            >
              <input
                type="color"
                v-model="stop.color"
                class="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                v-model="stop.color"
                class="flex-1 px-3 py-2 border rounded-lg"
                placeholder="#000000"
              />
              <input
                type="number"
                v-model.number="stop.position"
                min="0"
                max="100"
                class="w-20 px-3 py-2 border rounded-lg"
              />
              <span class="text-sm text-muted-foreground">%</span>
              <button
                v-if="colorStops.length > 2"
                @click="removeColorStop(index)"
                class="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
              >
                <Icon name="Trash2" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 渐变选项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">渐变选项</h3>

          <!-- 线性渐变选项 -->
          <div v-if="gradientType === 'linear'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">角度</label>
              <div class="flex items-center gap-3">
                <input
                  type="range"
                  v-model.number="angle"
                  min="0"
                  max="360"
                  class="flex-1"
                />
                <input
                  type="number"
                  v-model.number="angle"
                  min="0"
                  max="360"
                  class="w-20 px-3 py-2 border rounded-lg"
                />
                <span class="text-sm">°</span>
              </div>
            </div>

            <!-- 快捷角度 -->
            <div class="flex gap-2">
              <button
                v-for="presetAngle in presetAngles"
                :key="presetAngle"
                @click="angle = presetAngle"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
              >
                {{ presetAngle }}°
              </button>
            </div>
          </div>

          <!-- 径向渐变选项 -->
          <div v-if="gradientType === 'radial'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">形状</label>
              <div class="flex gap-2">
                <button
                  v-for="shape in radialShapes"
                  :key="shape.value"
                  @click="radialShape = shape.value"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm',
                    radialShape === shape.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  ]"
                >
                  {{ shape.label }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">位置</label>
              <select v-model="radialPosition" class="w-full px-3 py-2 border rounded-lg">
                <option value="center">中心</option>
                <option value="top">顶部</option>
                <option value="bottom">底部</option>
                <option value="left">左侧</option>
                <option value="right">右侧</option>
                <option value="top left">左上</option>
                <option value="top right">右上</option>
                <option value="bottom left">左下</option>
                <option value="bottom right">右下</option>
              </select>
            </div>
          </div>

          <!-- 锥形渐变选项 -->
          <div v-if="gradientType === 'conic'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">起始角度</label>
              <div class="flex items-center gap-3">
                <input
                  type="range"
                  v-model.number="conicStart"
                  min="0"
                  max="360"
                  class="flex-1"
                />
                <input
                  type="number"
                  v-model.number="conicStart"
                  min="0"
                  max="360"
                  class="w-20 px-3 py-2 border rounded-lg"
                />
                <span class="text-sm">°</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">位置</label>
              <select v-model="conicPosition" class="w-full px-3 py-2 border rounded-lg">
                <option value="center">中心</option>
                <option value="top left">左上</option>
                <option value="top right">右上</option>
                <option value="bottom left">左下</option>
                <option value="bottom right">右下</option>
              </select>
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
          <pre class="bg-muted p-4 rounded-lg overflow-x-auto"><code>{{ cssCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// SEO设置
useSeoMeta({
  title: 'CSS渐变生成器 - 在线生成线性、径向、锥形渐变背景',
  description: '免费CSS渐变生成器，可视化生成CSS渐变背景，支持线性渐变、径向渐变、锥形渐变。可自定义渐变角度、颜色色标、位置参数，实时预览效果。专业的CSS渐变设计工具。',
  keywords: ['CSS渐变生成器', '线性渐变工具', '径向渐变制作', '锥形渐变生成', 'CSS gradient', '渐变背景设计', '颜色渐变编辑', '网页渐变背景', 'linear-gradient', 'radial-gradient', 'UI渐变设计', '前端渐变工具'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CSS渐变生成器',
    description: '免费的在线CSS渐变生成器，支持线性、径向、锥形渐变，实时预览和代码生成。',
    url: 'https://util.iskytrip.com/tools/gradient-generator',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '线性渐变生成',
      '径向渐变制作',
      '锥形渐变设计',
      '多色标渐变',
      '渐变角度调节',
      '颜色插值算法',
      '预设渐变模板',
      'CSS代码导出'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'UI设计师、前端开发者、网页设计师'
    }
  }
})

// 渐变类型
const gradientType = ref('linear')
const gradientTypes = [
  { value: 'linear', label: '线性渐变' },
  { value: 'radial', label: '径向渐变' },
  { value: 'conic', label: '锥形渐变' }
]

// 色标
const colorStops = ref([
  { color: '#667eea', position: 0 },
  { color: '#764ba2', position: 100 }
])

// 线性渐变选项
const angle = ref(45)
const presetAngles = [0, 45, 90, 135, 180, 225, 270, 315]

// 径向渐变选项
const radialShape = ref('circle')
const radialShapes = [
  { value: 'circle', label: '圆形' },
  { value: 'ellipse', label: '椭圆' }
]
const radialPosition = ref('center')

// 锥形渐变选项
const conicStart = ref(0)
const conicPosition = ref('center')

// 预设渐变
const presets = [
  {
    name: '蓝紫渐变',
    style: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  },
  {
    name: '日落渐变',
    style: { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }
  },
  {
    name: '海洋渐变',
    style: { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
  },
  {
    name: '火焰渐变',
    style: { background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
  },
  {
    name: '森林渐变',
    style: { background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' }
  },
  {
    name: '极光渐变',
    style: { background: 'linear-gradient(135deg, #00c6fb 0%, #005bea 100%)' }
  }
]

// 计算渐变样式
const gradientStyle = computed(() => {
  return { background: cssCode.value }
})

// 计算CSS代码
const cssCode = computed(() => {
  const stops = colorStops.value
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ')

  switch (gradientType.value) {
    case 'linear':
      return `linear-gradient(${angle.value}deg, ${stops})`

    case 'radial':
      const shape = radialShape.value
      const position = radialPosition.value === 'center' ? '' : `at ${radialPosition.value}`
      return `radial-gradient(${shape} ${position}, ${stops})`

    case 'conic':
      const startPos = conicPosition.value === 'center' ? '' : `at ${conicPosition.value}`
      return `conic-gradient(from ${conicStart.value}deg ${startPos}, ${stops})`

    default:
      return `linear-gradient(${angle.value}deg, ${stops})`
  }
})

// 添加色标
const addColorStop = () => {
  if (colorStops.value.length >= 10) return

  const sortedStops = [...colorStops.value].sort((a, b) => a.position - b.position)
  let insertPosition = 50

  // 找到合适的插入位置
  for (let i = 0; i < sortedStops.length - 1; i++) {
    const current = sortedStops[i].position
    const next = sortedStops[i + 1].position
    if (next - current > 10) {
      insertPosition = current + (next - current) / 2
      break
    }
  }

  // 生成中间颜色
  const color1 = sortedStops[0].color
  const color2 = sortedStops[sortedStops.length - 1].color
  const midColor = interpolateColor(color1, color2, 0.5)

  colorStops.value.push({
    color: midColor,
    position: Math.round(insertPosition)
  })
}

// 删除色标
const removeColorStop = (index) => {
  colorStops.value.splice(index, 1)
}

// 应用预设
const applyPreset = (preset) => {
  // 解析预设的渐变
  const gradient = preset.style.background
  if (gradient.includes('linear-gradient')) {
    gradientType.value = 'linear'
    const match = gradient.match(/(\d+)deg/)
    if (match) angle.value = parseInt(match[1])
  } else if (gradient.includes('radial-gradient')) {
    gradientType.value = 'radial'
  }

  // 提取色标
  const colorMatch = gradient.match(/#[0-9a-fA-F]{6}/g)
  if (colorMatch && colorMatch.length >= 2) {
    colorStops.value = [
      { color: colorMatch[0], position: 0 },
      { color: colorMatch[1], position: 100 }
    ]
  }
}

// 颜色插值
const interpolateColor = (color1, color2, factor) => {
  const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }

  const [r1, g1, b1] = hex2rgb(color1)
  const [r2, g2, b2] = hex2rgb(color2)

  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// 复制CSS代码
const copyCSS = async () => {
  try {
    await navigator.clipboard.writeText(`background: ${cssCode.value};`)
    alert('CSS代码已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}
</script>