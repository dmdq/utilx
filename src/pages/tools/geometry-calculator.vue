<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">几何图形计算器</h1>
      <p class="text-muted-foreground mb-6">计算2D和3D图形的面积、周长、体积、表面积等几何属性</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：图形选择和参数输入 -->
      <div class="space-y-6">
        <!-- 图形类型选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">选择图形</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">图形类型</label>
              <select v-model="selectedShape" @change="resetCalculations" class="w-full px-3 py-2 border rounded-lg">
                <optgroup label="2D图形">
                  <option value="rectangle">矩形</option>
                  <option value="circle">圆形</option>
                  <option value="triangle">三角形</option>
                  <option value="square">正方形</option>
                  <option value="ellipse">椭圆</option>
                  <option value="trapezoid">梯形</option>
                  <option value="parallelogram">平行四边形</option>
                  <option value="rhombus">菱形</option>
                  <option value="regular-polygon">正多边形</option>
                </optgroup>
                <optgroup label="3D图形">
                  <option value="cube">立方体</option>
                  <option value="sphere">球体</option>
                  <option value="cylinder">圆柱体</option>
                  <option value="cone">圆锥体</option>
                  <option value="pyramid">金字塔</option>
                  <option value="prism">棱柱</option>
                  <option value="torus">圆环</option>
                </optgroup>
              </select>
            </div>

            <!-- 2D图形参数 -->
            <div v-if="is2DShape" class="space-y-3">
              <!-- 矩形参数 -->
              <div v-if="selectedShape === 'rectangle'">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">长度</label>
                    <input
                      v-model.number="shapeParams.length"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">宽度</label>
                    <input
                      v-model.number="shapeParams.width"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              <!-- 圆形参数 -->
              <div v-if="selectedShape === 'circle'">
                <div>
                  <label class="block text-sm font-medium mb-2">半径</label>
                  <input
                    v-model.number="shapeParams.radius"
                    type="number"
                    step="0.01"
                    class="w-full px-3 py-2 border rounded-lg"
                    placeholder="5"
                  />
                </div>
              </div>

              <!-- 三角形参数 -->
              <div v-if="selectedShape === 'triangle'">
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-sm font-medium mb-2">边 a</label>
                    <input
                      v-model.number="shapeParams.sideA"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">边 b</label>
                    <input
                      v-model.number="shapeParams.sideB"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">边 c</label>
                    <input
                      v-model.number="shapeParams.sideC"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              <!-- 正方形参数 -->
              <div v-if="selectedShape === 'square'">
                <div>
                  <label class="block text-sm font-medium mb-2">边长</label>
                  <input
                    v-model.number="shapeParams.side"
                    type="number"
                    step="0.01"
                    class="w-full px-3 py-2 border rounded-lg"
                    placeholder="5"
                  />
                </div>
              </div>

              <!-- 椭圆参数 -->
              <div v-if="selectedShape === 'ellipse'">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">长轴半径</label>
                    <input
                      v-model.number="shapeParams.semiMajor"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">短轴半径</label>
                    <input
                      v-model.number="shapeParams.semiMinor"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              <!-- 正多边形参数 -->
              <div v-if="selectedShape === 'regular-polygon'">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">边数</label>
                    <input
                      v-model.number="shapeParams.sides"
                      type="number"
                      min="3"
                      max="20"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="6"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">边长</label>
                    <input
                      v-model.number="shapeParams.sideLength"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="4"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 3D图形参数 -->
            <div v-if="is3DShape" class="space-y-3">
              <!-- 立方体参数 -->
              <div v-if="selectedShape === 'cube'">
                <div>
                  <label class="block text-sm font-medium mb-2">边长</label>
                  <input
                    v-model.number="shapeParams.edge"
                    type="number"
                    step="0.01"
                    class="w-full px-3 py-2 border rounded-lg"
                    placeholder="5"
                  />
                </div>
              </div>

              <!-- 球体参数 -->
              <div v-if="selectedShape === 'sphere'">
                <div>
                  <label class="block text-sm font-medium mb-2">半径</label>
                  <input
                    v-model.number="shapeParams.radius"
                    type="number"
                    step="0.01"
                    class="w-full px-3 py-2 border rounded-lg"
                    placeholder="5"
                  />
                </div>
              </div>

              <!-- 圆柱体参数 -->
              <div v-if="selectedShape === 'cylinder'">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">半径</label>
                    <input
                      v-model.number="shapeParams.radius"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">高度</label>
                    <input
                      v-model.number="shapeParams.height"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <!-- 圆锥体参数 -->
              <div v-if="selectedShape === 'cone'">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">底面半径</label>
                    <input
                      v-model.number="shapeParams.radius"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">高度</label>
                    <input
                      v-model.number="shapeParams.height"
                      type="number"
                      step="0.01"
                      class="w-full px-3 py-2 border rounded-lg"
                      placeholder="8"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button @click="calculateGeometry" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              计算
            </button>
          </div>
        </div>

        <!-- 图形可视化 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">图形预览</h3>
          <div class="flex justify-center items-center h-64 bg-muted rounded-lg">
            <div v-html="shapeSvg" class="shape-preview"></div>
          </div>
        </div>
      </div>

      <!-- 右侧：计算结果和公式 -->
      <div class="space-y-6">
        <!-- 计算结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">计算结果</h3>
          <div v-if="calculationResults.hasResult" class="space-y-4">
            <!-- 2D结果 -->
            <div v-if="is2DShape" class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-secondary rounded-lg">
                <div class="text-sm text-muted-foreground">面积</div>
                <div class="text-xl font-semibold">{{ calculationResults.area.toFixed(2) }}</div>
                <div class="text-xs text-muted-foreground">平方单位</div>
              </div>
              <div class="p-4 bg-secondary rounded-lg">
                <div class="text-sm text-muted-foreground">周长</div>
                <div class="text-xl font-semibold">{{ calculationResults.perimeter.toFixed(2) }}</div>
                <div class="text-xs text-muted-foreground">单位</div>
              </div>

              <!-- 额外属性 -->
              <div v-if="selectedShape === 'circle'" class="p-4 bg-accent rounded-lg col-span-2">
                <div class="text-sm text-muted-foreground">直径</div>
                <div class="text-lg font-semibold">{{ calculationResults.diameter.toFixed(2) }}</div>
              </div>

              <div v-if="selectedShape === 'triangle'" class="space-y-2 col-span-2">
                <div class="p-3 bg-accent rounded-lg">
                  <div class="text-sm text-muted-foreground">类型</div>
                  <div class="font-medium">{{ calculationResults.type }}</div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-3 bg-accent rounded-lg">
                    <div class="text-sm text-muted-foreground">周长</div>
                    <div class="font-medium">{{ calculationResults.perimeter.toFixed(2) }}</div>
                  </div>
                  <div class="p-3 bg-accent rounded-lg">
                    <div class="text-sm text-muted-foreground">面积</div>
                    <div class="font-medium">{{ calculationResults.area.toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3D结果 -->
            <div v-if="is3DShape" class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-secondary rounded-lg">
                <div class="text-sm text-muted-foreground">体积</div>
                <div class="text-xl font-semibold">{{ calculationResults.volume.toFixed(2) }}</div>
                <div class="text-xs text-muted-foreground">立方单位</div>
              </div>
              <div class="p-4 bg-secondary rounded-lg">
                <div class="text-sm text-muted-foreground">表面积</div>
                <div class="text-xl font-semibold">{{ calculationResults.surfaceArea.toFixed(2) }}</div>
                <div class="text-xs text-muted-foreground">平方单位</div>
              </div>

              <!-- 额外属性 -->
              <div v-if="selectedShape === 'sphere'" class="space-y-2 col-span-2">
                <div class="grid grid-cols-2 gap-2">
                  <div class="p-3 bg-accent rounded-lg">
                    <div class="text-sm text-muted-foreground">直径</div>
                    <div class="font-medium">{{ calculationResults.diameter.toFixed(2) }}</div>
                  </div>
                  <div class="p-3 bg-accent rounded-lg">
                    <div class="text-sm text-muted-foreground">周长</div>
                    <div class="font-medium">{{ calculationResults.circumference.toFixed(2) }}</div>
                  </div>
                </div>
              </div>

              <div v-if="selectedShape === 'cylinder'" class="space-y-2 col-span-2">
                <div class="grid grid-cols-3 gap-2">
                  <div class="p-3 bg-accent rounded-lg">
                    <div class="text-sm text-muted-foreground">底面积</div>
                    <div class="font-medium">{{ calculationResults.baseArea.toFixed(2) }}</div>
                  </div>
                  <div class="p-3 bg-accent rounded-lg">
                    <div class="text-sm text-muted-foreground">侧面积</div>
                    <div class="font-medium">{{ calculationResults.lateralArea.toFixed(2) }}</div>
                  </div>
                  <div class="p-3 bg-accent rounded-lg">
                    <div class="text-sm text-muted-foreground">对角线</div>
                    <div class="font-medium">{{ calculationResults.diagonal.toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入参数并点击计算按钮
          </div>
        </div>

        <!-- 公式展示 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">计算公式</h3>
          <div v-if="selectedShape" class="space-y-3">
            <div v-for="formula in getFormulas()" :key="formula.name" class="p-3 bg-secondary rounded">
              <div class="font-medium text-sm mb-1">{{ formula.name }}</div>
              <div class="font-mono text-xs">{{ formula.expression }}</div>
              <div class="text-xs text-muted-foreground mt-1">{{ formula.description }}</div>
            </div>
          </div>
        </div>

        <!-- 单位转换 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">单位转换</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">当前单位</label>
              <select v-model="unitConversion.fromUnit" class="w-full px-3 py-2 border rounded-lg">
                <option value="mm">毫米 (mm)</option>
                <option value="cm">厘米 (cm)</option>
                <option value="m">米 (m)</option>
                <option value="km">千米 (km)</option>
                <option value="in">英寸 (in)</option>
                <option value="ft">英尺 (ft)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">目标单位</label>
              <select v-model="unitConversion.toUnit" class="w-full px-3 py-2 border rounded-lg">
                <option value="mm">毫米 (mm)</option>
                <option value="cm">厘米 (cm)</option>
                <option value="m">米 (m)</option>
                <option value="km">千米 (km)</option>
                <option value="in">英寸 (in)</option>
                <option value="ft">英尺 (ft)</option>
              </select>
            </div>

            <div v-if="calculationResults.hasResult && is2DShape">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm text-muted-foreground">面积转换</div>
                <div class="font-medium">
                  {{ convertArea(calculationResults.area) }}
                </div>
              </div>
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm text-muted-foreground">周长转换</div>
                <div class="font-medium">
                  {{ convertLength(calculationResults.perimeter) }}
                </div>
              </div>
            </div>

            <div v-if="calculationResults.hasResult && is3DShape">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm text-muted-foreground">体积转换</div>
                <div class="font-medium">
                  {{ convertVolume(calculationResults.volume) }}
                </div>
              </div>
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm text-muted-foreground">表面积转换</div>
                <div class="font-medium">
                  {{ convertArea(calculationResults.surfaceArea) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('几何图形计算器')

// 图形选择
const selectedShape = ref('rectangle')

// 图形参数
const shapeParams = ref({
  // 通用参数
  radius: 5,
  height: 10,
  side: 5,
  edge: 5,

  // 2D特有参数
  length: 10,
  width: 5,
  sideA: 3,
  sideB: 4,
  sideC: 5,
  semiMajor: 8,
  semiMinor: 5,
  sides: 6,
  sideLength: 4,

  // 3D特有参数
  baseRadius: 3,
})

// 计算结果
const calculationResults = ref({
  hasResult: false,
  area: 0,
  perimeter: 0,
  volume: 0,
  surfaceArea: 0,
  // 额外属性
  diameter: 0,
  circumference: 0,
  baseArea: 0,
  lateralArea: 0,
  diagonal: 0,
  type: ''
})

// 单位转换
const unitConversion = ref({
  fromUnit: 'm',
  toUnit: 'cm'
})

// 计算属性
const is2DShape = computed(() => {
  const shapes2D = ['rectangle', 'circle', 'triangle', 'square', 'ellipse', 'trapezoid', 'parallelogram', 'rhombus', 'regular-polygon']
  return shapes2D.includes(selectedShape.value)
})

const is3DShape = computed(() => {
  const shapes3D = ['cube', 'sphere', 'cylinder', 'cone', 'pyramid', 'prism', 'torus']
  return shapes3D.includes(selectedShape.value)
})

// 图形SVG可视化
const shapeSvg = computed(() => {
  switch (selectedShape.value) {
    case 'rectangle':
      return `<svg width="200" height="150" viewBox="0 0 200 150">
        <rect x="50" y="25" width="100" height="75" fill="#3b82f6" fill-opacity="0.3" stroke="#3b82f6" stroke-width="2"/>
      </svg>`

    case 'circle':
      return `<svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="60" fill="#10b981" fill-opacity="0.3" stroke="#10b981" stroke-width="2"/>
      </svg>`

    case 'triangle':
      return `<svg width="200" height="200" viewBox="0 0 200 200">
        <polygon points="100,30 170,150 30,150" fill="#f59e0b" fill-opacity="0.3" stroke="#f59e0b" stroke-width="2"/>
      </svg>`

    case 'square':
      return `<svg width="200" height="200" viewBox="0 0 200 200">
        <rect x="50" y="50" width="100" height="100" fill="#ef4444" fill-opacity="0.3" stroke="#ef4444" stroke-width="2"/>
      </svg>`

    case 'cube':
      return `<svg width="200" height="200" viewBox="0 0 200 200">
        <path d="M50,50 L150,50 L150,150 L50,150 Z" fill="#8b5cf6" fill-opacity="0.3" stroke="#8b5cf6" stroke-width="2"/>
        <path d="M50,50 L100,25 L200,25 L150,50" fill="#8b5cf6" fill-opacity="0.2" stroke="#8b5cf6" stroke-width="2"/>
        <path d="M100,25 L200,25 L200,125 L150,150" fill="#8b5cf6" fill-opacity="0.4" stroke="#8b5cf6" stroke-width="2"/>
      </svg>`

    case 'sphere':
      return `<svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="60" fill="#ec4899" fill-opacity="0.3" stroke="#ec4899" stroke-width="2"/>
        <ellipse cx="100" cy="100" rx="60" ry="20" fill="none" stroke="#ec4899" stroke-width="1" opacity="0.6"/>
        <ellipse cx="100" cy="100" rx="20" ry="60" fill="none" stroke="#ec4899" stroke-width="1" opacity="0.6"/>
      </svg>`

    default:
      return `<svg width="200" height="200" viewBox="0 0 200 200">
        <rect x="50" y="50" width="100" height="100" fill="#6b7280" fill-opacity="0.3" stroke="#6b7280" stroke-width="2"/>
      </svg>`
  }
})

// 计算函数
const calculateGeometry = () => {
  switch (selectedShape.value) {
    case 'rectangle':
      calculateRectangle()
      break
    case 'circle':
      calculateCircle()
      break
    case 'triangle':
      calculateTriangle()
      break
    case 'square':
      calculateSquare()
      break
    case 'ellipse':
      calculateEllipse()
      break
    case 'regular-polygon':
      calculateRegularPolygon()
      break
    case 'cube':
      calculateCube()
      break
    case 'sphere':
      calculateSphere()
      break
    case 'cylinder':
      calculateCylinder()
      break
    case 'cone':
      calculateCone()
      break
    default:
      alert('暂不支持该图形')
  }
}

// 2D图形计算
const calculateRectangle = () => {
  const { length, width } = shapeParams.value

  calculationResults.value = {
    hasResult: true,
    area: length * width,
    perimeter: 2 * (length + width)
  }
}

const calculateCircle = () => {
  const { radius } = shapeParams.value

  calculationResults.value = {
    hasResult: true,
    area: Math.PI * radius * radius,
    perimeter: 2 * Math.PI * radius,
    diameter: 2 * radius,
    circumference: 2 * Math.PI * radius
  }
}

const calculateTriangle = () => {
  const { sideA, sideB, sideC } = shapeParams.value

  // 检查是否能构成三角形
  if (sideA + sideB <= sideC || sideA + sideC <= sideB || sideB + sideC <= sideA) {
    alert('这些边长不能构成三角形')
    return
  }

  // 使用海伦公式计算面积
  const s = (sideA + sideB + sideC) / 2
  const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC))
  const perimeter = sideA + sideB + sideC

  // 判断三角形类型
  let type = '普通三角形'
  const sides = [sideA, sideB, sideC].sort((a, b) => a - b)
  const tolerance = 0.0001

  if (Math.abs(sides[0] - sides[1]) < tolerance && Math.abs(sides[1] - sides[2]) < tolerance) {
    type = '等边三角形'
  } else if (Math.abs(sides[0] - sides[1]) < tolerance || Math.abs(sides[1] - sides[2]) < tolerance) {
    type = '等腰三角形'
  } else if (Math.abs(sides[0] * sides[0] + sides[1] * sides[1] - sides[2] * sides[2]) < tolerance) {
    type = '直角三角形'
  }

  calculationResults.value = {
    hasResult: true,
    area,
    perimeter,
    type
  }
}

const calculateSquare = () => {
  const { side } = shapeParams.value

  calculationResults.value = {
    hasResult: true,
    area: side * side,
    perimeter: 4 * side
  }
}

const calculateEllipse = () => {
  const { semiMajor, semiMinor } = shapeParams.value

  calculationResults.value = {
    hasResult: true,
    area: Math.PI * semiMajor * semiMinor,
    perimeter: Math.PI * (3 * (semiMajor + semiMinor) - Math.sqrt((3 * semiMajor + semiMinor) * (semiMajor + 3 * semiMinor)))
  }
}

const calculateRegularPolygon = () => {
  const { sides, sideLength } = shapeParams.value

  const area = (sides * sideLength * sideLength) / (4 * Math.tan(Math.PI / sides))
  const perimeter = sides * sideLength

  calculationResults.value = {
    hasResult: true,
    area,
    perimeter
  }
}

// 3D图形计算
const calculateCube = () => {
  const { edge } = shapeParams.value

  calculationResults.value = {
    hasResult: true,
    volume: edge * edge * edge,
    surfaceArea: 6 * edge * edge,
    diagonal: edge * Math.sqrt(3)
  }
}

const calculateSphere = () => {
  const { radius } = shapeParams.value

  calculationResults.value = {
    hasResult: true,
    volume: (4/3) * Math.PI * radius * radius * radius,
    surfaceArea: 4 * Math.PI * radius * radius,
    diameter: 2 * radius,
    circumference: 2 * Math.PI * radius
  }
}

const calculateCylinder = () => {
  const { radius, height } = shapeParams.value

  const baseArea = Math.PI * radius * radius
  const lateralArea = 2 * Math.PI * radius * height

  calculationResults.value = {
    hasResult: true,
    volume: baseArea * height,
    surfaceArea: 2 * baseArea + lateralArea,
    baseArea,
    lateralArea,
    diagonal: Math.sqrt((2 * radius) * (2 * radius) + height * height)
  }
}

const calculateCone = () => {
  const { radius, height } = shapeParams.value

  const baseArea = Math.PI * radius * radius
  const slantHeight = Math.sqrt(radius * radius + height * height)
  const lateralArea = Math.PI * radius * slantHeight

  calculationResults.value = {
    hasResult: true,
    volume: (1/3) * baseArea * height,
    surfaceArea: baseArea + lateralArea,
    baseArea,
    lateralArea
  }
}

// 公式获取
const getFormulas = () => {
  switch (selectedShape.value) {
    case 'rectangle':
      return [
        {
          name: '面积',
          expression: 'A = length × width',
          description: '长度乘以宽度'
        },
        {
          name: '周长',
          expression: 'P = 2 × (length + width)',
          description: '两条长边加上两条短边'
        }
      ]

    case 'circle':
      return [
        {
          name: '面积',
          expression: 'A = πr²',
          description: 'π乘以半径的平方'
        },
        {
          name: '周长',
          expression: 'P = 2πr',
          description: '2π乘以半径'
        }
      ]

    case 'triangle':
      return [
        {
          name: '面积 (海伦公式)',
          expression: 'A = √[s(s-a)(s-b)(s-c)]',
          description: 's = (a+b+c)/2 为半周长'
        },
        {
          name: '周长',
          expression: 'P = a + b + c',
          description: '三条边长之和'
        }
      ]

    case 'square':
      return [
        {
          name: '面积',
          expression: 'A = side²',
          description: '边长的平方'
        },
        {
          name: '周长',
          expression: 'P = 4 × side',
          description: '4条边长之和'
        }
      ]

    case 'sphere':
      return [
        {
          name: '体积',
          expression: 'V = (4/3)πr³',
          description: '4/3 π 乘以半径的立方'
        },
        {
          name: '表面积',
          expression: 'A = 4πr²',
          description: '4π 乘以半径的平方'
        }
      ]

    case 'cylinder':
      return [
        {
          name: '体积',
          expression: 'V = πr²h',
          description: 'π 乘以底面半径的平方再乘以高度'
        },
        {
          name: '表面积',
          expression: 'A = 2πr² + 2πrh',
          description: '两个底面积加上侧面积'
        }
      ]

    default:
      return []
  }
}

// 单位转换
const convertLength = (value) => {
  const { fromUnit, toUnit } = unitConversion.value

  // 转换为米
  const toMeters = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    in: 0.0254,
    ft: 0.3048
  }

  // 从米转换
  const fromMeters = {
    mm: 1000,
    cm: 100,
    m: 1,
    km: 0.001,
    in: 39.3701,
    ft: 3.28084
  }

  const inMeters = value * toMeters[fromUnit]
  const converted = inMeters * fromMeters[toUnit]

  return `${converted.toFixed(4)} ${toUnit}`
}

const convertArea = (value) => {
  const { fromUnit, toUnit } = unitConversion.value

  // 转换为平方米
  const toSquareMeters = {
    mm: 0.000001,
    cm: 0.0001,
    m: 1,
    km: 1000000,
    in: 0.00064516,
    ft: 0.092903
  }

  // 从平方米转换
  const fromSquareMeters = {
    mm: 1000000,
    cm: 10000,
    m: 1,
    km: 0.000001,
    in: 1550,
    ft: 10.764
  }

  const inSquareMeters = value * toSquareMeters[fromUnit]
  const converted = inSquareMeters * fromSquareMeters[toUnit]

  return `${converted.toFixed(4)} ${toUnit}²`
}

const convertVolume = (value) => {
  const { fromUnit, toUnit } = unitConversion.value

  // 转换为立方米
  const toCubicMeters = {
    mm: 0.000000001,
    cm: 0.000001,
    m: 1,
    km: 1000000000,
    in: 0.000016387,
    ft: 0.0283168
  }

  // 从立方米转换
  const fromCubicMeters = {
    mm: 1000000000,
    cm: 1000000,
    m: 1,
    km: 0.000000001,
    in: 61023.7,
    ft: 35.315
  }

  const inCubicMeters = value * toCubicMeters[fromUnit]
  const converted = inCubicMeters * fromCubicMeters[toUnit]

  return `${converted.toFixed(4)} ${toUnit}³`
}

// 重置
const resetCalculations = () => {
  calculationResults.value = {
    hasResult: false,
    area: 0,
    perimeter: 0,
    volume: 0,
    surfaceArea: 0,
    diameter: 0,
    circumference: 0,
    baseArea: 0,
    lateralArea: 0,
    diagonal: 0,
    type: ''
  }
}
</script>

<style scoped>
.shape-preview {
  max-width: 100%;
  max-height: 100%;
}

select,
input[type="number"] {
  transition: border-color 0.2s, box-shadow 0.2s;
}

select:focus,
input[type="number"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>