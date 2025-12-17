<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">SVG路径编辑器</h1>
      <p class="text-muted-foreground mb-4">可视化编辑SVG path数据，支持实时预览和导出</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧编辑器 -->
      <div class="space-y-6">
        <!-- 路径编辑器 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">路径编辑器</h3>
            <div class="flex gap-2">
              <button
                @click="formatPath"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                格式化
              </button>
              <button
                @click="clearPath"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="pathData"
            @input="updateSVG"
            class="w-full h-48 p-3 font-mono text-sm border rounded-md resize-none"
            placeholder="输入SVG path数据，如: M 10 10 L 100 100 L 200 50 Z"
          ></textarea>

          <!-- 快捷工具 -->
          <div class="mt-4">
            <h4 class="text-sm font-medium mb-2">快捷工具</h4>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="tool in pathTools"
                :key="tool.id"
                @click="applyPathTool(tool)"
                class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                {{ tool.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- 形状工具 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">形状工具</h3>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="shape in shapes"
              :key="shape.id"
              @click="createShape(shape)"
              class="p-3 bg-secondary hover:bg-secondary/80 rounded text-sm flex flex-col items-center"
            >
              <span class="text-lg mb-1">{{ shape.icon }}</span>
              <span>{{ shape.name }}</span>
            </button>
          </div>
        </div>

        <!-- 路径参数 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">路径参数</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">填充颜色</label>
                <input
                  v-model="pathParams.fill"
                  type="color"
                  class="w-full h-10 rounded cursor-pointer"
                >
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">描边颜色</label>
                <input
                  v-model="pathParams.stroke"
                  type="color"
                  class="w-full h-10 rounded cursor-pointer"
                >
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">描边宽度</label>
              <input
                v-model.number="pathParams.strokeWidth"
                type="range"
                min="0"
                max="10"
                step="0.5"
                class="w-full"
              >
              <span class="text-sm text-muted-foreground">{{ pathParams.strokeWidth }}px</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">透明度</label>
                <input
                  v-model.number="pathParams.opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  class="w-full"
                >
                <span class="text-sm text-muted-foreground">{{ pathParams.opacity }}</span>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">线条端点</label>
                <select v-model="pathParams.strokeLinecap" class="w-full px-3 py-2 border rounded-md">
                  <option value="butt">butt</option>
                  <option value="round">round</option>
                  <option value="square">square</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧预览区域 -->
      <div class="space-y-6">
        <!-- SVG预览 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">预览</h3>
            <div class="flex gap-2">
              <button
                @click="zoomIn"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                放大
              </button>
              <button
                @click="zoomOut"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                缩小
              </button>
              <button
                @click="resetZoom"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                重置
              </button>
            </div>
          </div>

          <div class="border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-hidden" style="height: 400px;">
            <svg
              ref="svgRef"
              width="100%"
              height="100%"
              viewBox="0 0 400 400"
              class="bg-white"
              :style="{ transform: `scale(${zoom})` }"
            >
              <!-- 网格背景 -->
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <!-- SVG路径 -->
              <path
                :d="pathData || 'M 0 0'"
                :fill="pathParams.fill"
                :stroke="pathParams.stroke"
                :stroke-width="pathParams.strokeWidth"
                :stroke-linecap="pathParams.strokeLinecap"
                :opacity="pathParams.opacity"
                class="transition-all duration-200"
              />
            </svg>
          </div>
        </div>

        <!-- 生成的代码 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">生成的代码</h3>
            <div class="flex gap-2">
              <button
                @click="copyCode"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                复制代码
              </button>
              <button
                @click="downloadSVG"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                下载SVG
              </button>
            </div>
          </div>

          <pre class="bg-muted p-4 rounded-md text-sm overflow-x-auto"><code>{{ generatedCode }}</code></pre>
        </div>

        <!-- 路径说明 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">路径命令说明</h3>
          <div class="space-y-2 text-sm">
            <div class="grid grid-cols-2 gap-2">
              <div><code class="bg-muted px-2 py-1 rounded">M x y</code> - 移动到</div>
              <div><code class="bg-muted px-2 py-1 rounded">L x y</code> - 直线到</div>
              <div><code class="bg-muted px-2 py-1 rounded">H x</code> - 水平线到</div>
              <div><code class="bg-muted px-2 py-1 rounded">V y</code> - 垂直线到</div>
              <div><code class="bg-muted px-2 py-1 rounded">C x1 y1 x2 y2 x y</code> - 三次贝塞尔曲线</div>
              <div><code class="bg-muted px-2 py-1 rounded">S x2 y2 x y</code> - 平滑三次贝塞尔曲线</div>
              <div><code class="bg-muted px-2 py-1 rounded">Q x1 y1 x y</code> - 二次贝塞尔曲线</div>
              <div><code class="bg-muted px-2 py-1 rounded">T x y</code> - 平滑二次贝塞尔曲线</div>
              <div><code class="bg-muted px-2 py-1 rounded">A rx ry x-axis-rotation large-arc-flag sweep-flag x y</code> - 椭圆弧</div>
              <div><code class="bg-muted px-2 py-1 rounded">Z</code> - 关闭路径</div>
            </div>
            <p class="text-muted-foreground text-xs mt-2">
              大写字母表示绝对坐标，小写字母表示相对坐标
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('SVG路径编辑器 - 在线编辑SVG路径数据')

// 数据
const pathData = ref('M 50 50 L 150 50 L 200 150 L 100 200 L 50 150 Z')
const zoom = ref(1)
const svgRef = ref(null)

// 路径参数
const pathParams = ref({
  fill: '#3b82f6',
  stroke: '#1e40af',
  strokeWidth: 2,
  opacity: 1,
  strokeLinecap: 'round'
})

// 路径工具
const pathTools = [
  { id: 'circle', name: '圆形', path: 'M 100 100 m -50 0 a 50 50 0 1 1 100 0 a 50 50 0 1 1 -100 0' },
  { id: 'heart', name: '心形', path: 'M 100 150 C 100 100, 50 100, 50 150 C 50 200, 100 250, 100 300 C 100 250, 150 200, 150 150 C 150 100, 100 100, 100 150 Z' },
  { id: 'star', name: '星形', path: 'M 100 50 L 120 90 L 160 90 L 130 120 L 140 160 L 100 130 L 60 160 L 70 120 L 40 90 L 80 90 Z' }
]

// 形状工具
const shapes = [
  { id: 'rect', name: '矩形', icon: '▢', path: 'M 50 50 L 250 50 L 250 150 L 50 150 Z' },
  { id: 'circle', name: '圆形', icon: '○', path: 'M 100 100 m -50 0 a 50 50 0 1 1 100 0 a 50 50 0 1 1 -100 0' },
  { id: 'triangle', name: '三角形', icon: '△', path: 'M 100 50 L 150 150 L 50 150 Z' },
  { id: 'pentagon', name: '五边形', icon: '⬠', path: 'M 100 50 L 150 80 L 130 130 L 70 130 L 50 80 Z' },
  { id: 'hexagon', name: '六边形', icon: '⬡', path: 'M 100 50 L 150 75 L 150 125 L 100 150 L 50 125 L 50 75 Z' },
  { id: 'arrow', name: '箭头', icon: '→', path: 'M 50 100 L 100 80 L 120 100 L 100 120 L 100 100 M 120 100 L 250 100' }
]

// 生成代码
const generatedCode = computed(() => {
  return `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <path
    d="${pathData.value || 'M 0 0'}"
    fill="${pathParams.value.fill}"
    stroke="${pathParams.value.stroke}"
    stroke-width="${pathParams.value.strokeWidth}"
    stroke-linecap="${pathParams.value.strokeLinecap}"
    opacity="${pathParams.value.opacity}"
  />
</svg>`
})

// 方法
const updateSVG = () => {
  // SVG会自动更新
}

const formatPath = () => {
  // 格式化路径数据
  const formatted = pathData.value
    .replace(/([A-Za-z])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
  pathData.value = formatted
}

const clearPath = () => {
  pathData.value = ''
}

const applyPathTool = (tool) => {
  pathData.value = tool.path
}

const createShape = (shape) => {
  pathData.value = shape.path
}

const zoomIn = () => {
  zoom.value = Math.min(zoom.value * 1.2, 3)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value / 1.2, 0.5)
}

const resetZoom = () => {
  zoom.value = 1
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    // 可以添加成功提示
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const downloadSVG = () => {
  const blob = new Blob([generatedCode.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'path.svg'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
svg {
  transition: transform 0.2s ease;
}
</style>