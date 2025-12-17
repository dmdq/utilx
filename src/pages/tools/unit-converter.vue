<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">单位换算器</h1>
      <p class="text-muted-foreground">支持长度、重量、温度、面积、体积等多种单位类型的相互转换</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：单位换算 -->
      <div class="space-y-4">
        <!-- 单位类型选择 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">选择换算类型</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="category in unitCategories"
              :key="category.id"
              @click="selectCategory(category.id)"
              :class="[
                'p-4 rounded-lg border transition-all text-center',
                selectedCategory === category.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary'
              ]"
            >
              <div class="flex justify-center mb-2">
                <component :is="category.icon" class="w-6 h-6" />
              </div>
              <div class="font-medium">{{ category.name }}</div>
              <div class="text-sm text-muted-foreground">{{ category.count }}种单位</div>
            </button>
          </div>
        </div>

        <!-- 换算输入区域 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">单位换算</h2>

          <div class="space-y-4">
            <!-- 源单位输入 -->
            <div>
              <label class="block text-sm font-medium mb-2">从</label>
              <div class="flex gap-2">
                <input
                  v-model.number="fromValue"
                  @input="convertFromUnit"
                  type="number"
                  step="any"
                  placeholder="输入数值"
                  class="flex-1 px-3 py-2 border rounded-md"
                >
                <select
                  v-model="fromUnit"
                  @change="convertFromUnit"
                  class="px-3 py-2 border rounded-md min-w-32"
                >
                  <option v-for="unit in currentUnits" :key="unit.value" :value="unit.value">
                    {{ unit.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 换算方向按钮 -->
            <div class="flex justify-center">
              <button
                @click="swapUnits"
                class="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                title="交换单位"
              >
                <ArrowUpDown class="w-5 h-5" />
              </button>
            </div>

            <!-- 目标单位输入 -->
            <div>
              <label class="block text-sm font-medium mb-2">到</label>
              <div class="flex gap-2">
                <input
                  v-model.number="toValue"
                  @input="convertToUnit"
                  type="number"
                  step="any"
                  placeholder="转换结果"
                  class="flex-1 px-3 py-2 border rounded-md"
                >
                <select
                  v-model="toUnit"
                  @change="convertFromUnit"
                  class="px-3 py-2 border rounded-md min-w-32"
                >
                  <option v-for="unit in currentUnits" :key="unit.value" :value="unit.value">
                    {{ unit.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- 结果显示 -->
            <div v-if="fromValue && toValue" class="p-4 bg-muted rounded-lg">
              <div class="text-center">
                <div class="font-mono text-lg">
                  {{ formatNumber(fromValue) }} {{ getUnitName(fromUnit) }}
                </div>
                <div class="text-muted-foreground my-2">=</div>
                <div class="font-mono text-xl text-primary font-bold">
                  {{ formatNumber(toValue) }} {{ getUnitName(toUnit) }}
                </div>
              </div>
            </div>

            <!-- 转换公式说明 -->
            <div v-if="conversionFormula" class="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>转换公式：</strong>{{ conversionFormula }}
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：常用换算和参考 -->
      <div class="space-y-4">
        <!-- 常用换算 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">常用换算</h3>
          <div class="space-y-3">
            <div
              v-for="preset in currentPresets"
              :key="preset.name"
              class="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
              @click="applyPreset(preset)"
            >
              <div class="font-medium">{{ preset.name }}</div>
              <div class="text-sm text-muted-foreground">{{ preset.description }}</div>
            </div>
          </div>
        </div>

        <!-- 单位换算表 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">单位换算表</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">单位</th>
                  <th class="text-left py-2">符号</th>
                  <th class="text-left py-2">相对于基准单位</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="unit in currentUnits" :key="unit.value" class="border-b">
                  <td class="py-2">{{ unit.name }}</td>
                  <td class="py-2 font-mono">{{ unit.symbol }}</td>
                  <td class="py-2 font-mono">{{ unit.factor }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量换算 -->
    <div class="mt-6 bg-card rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">批量换算</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2">输入批量数据（每行一个数值）</label>
          <textarea
            v-model="batchInput"
            @input="batchConvert"
            placeholder="100&#10;200&#10;300"
            rows="6"
            class="w-full p-3 border rounded-md resize-none font-mono text-sm"
          ></textarea>
          <div class="mt-2 text-xs text-muted-foreground">
            共 {{ batchLines }} 行数据
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">换算结果</label>
          <div class="h-32 p-3 bg-muted rounded-lg overflow-y-auto">
            <div v-if="batchResults.length === 0" class="text-muted-foreground text-center">
              输入数据开始批量换算
            </div>
            <div v-else class="space-y-1 font-mono text-sm">
              <div v-for="(result, index) in batchResults" :key="index">
                {{ formatNumber(result.from) }} {{ getUnitName(fromUnit) }} =
                <span class="text-primary font-bold">{{ formatNumber(result.to) }} {{ getUnitName(toUnit) }}</span>
              </div>
            </div>
          </div>
          <button
            v-if="batchResults.length > 0"
            @click="copyBatchResults"
            class="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            复制全部结果
          </button>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-6 bg-card rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Info class="w-5 h-5 text-primary" />
        使用说明
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
        <div>
          <h4 class="font-medium text-foreground mb-2">支持的单位类型</h4>
          <ul class="space-y-1 list-disc list-inside">
            <li><strong>长度：</strong>米、千米、厘米、毫米、英寸、英尺、码、英里等</li>
            <li><strong>重量：</strong>千克、克、毫克、吨、磅、盎司、斤、两等</li>
            <li><strong>温度：</strong>摄氏度、华氏度、开尔文、兰氏度等</li>
            <li><strong>面积：</strong>平方米、平方千米、平方厘米、亩、平方英尺等</li>
            <li><strong>体积：</strong>立方米、升、毫升、加仑、夸脱、品脱等</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">使用技巧</h4>
          <ul class="space-y-1 list-disc list-inside">
            <li>支持小数输入，精度可达小数点后多位</li>
            <li>点击上下箭头按钮可快速交换单位</li>
            <li>批量换算功能支持大量数据处理</li>
            <li>所有计算均为实时进行，无需点击按钮</li>
            <li>支持复制单个结果或批量结果</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  ArrowUpDown,
  Ruler,
  Weight,
  Thermometer,
  Maximize2,
  Droplet,
  Info
} from 'lucide-vue-next'

// 状态管理
const selectedCategory = ref('length')
const fromValue = ref('')
const toValue = ref('')
const fromUnit = ref('')
const toUnit = ref('')
const batchInput = ref('')
const batchResults = ref([])

// 单位分类
const unitCategories = [
  { id: 'length', name: '长度', icon: Ruler, count: 12 },
  { id: 'weight', name: '重量', icon: Weight, count: 10 },
  { id: 'temperature', name: '温度', icon: Thermometer, count: 4 },
  { id: 'area', name: '面积', icon: Maximize2, count: 8 },
  { id: 'volume', name: '体积', icon: Droplet, count: 8 }
]

// 单位定义
const units = {
  length: [
    { name: '米', symbol: 'm', value: 'm', factor: 1 },
    { name: '千米', symbol: 'km', value: 'km', factor: 0.001 },
    { name: '厘米', symbol: 'cm', value: 'cm', factor: 100 },
    { name: '毫米', symbol: 'mm', value: 'mm', factor: 1000 },
    { name: '英里', symbol: 'mi', value: 'mi', factor: 0.000621371 },
    { name: '码', symbol: 'yd', value: 'yd', factor: 1.09361 },
    { name: '英尺', symbol: 'ft', value: 'ft', factor: 3.28084 },
    { name: '英寸', symbol: 'in', value: 'in', factor: 39.3701 },
    { name: '海里', symbol: 'nmi', value: 'nmi', factor: 0.000539957 },
    { name: '光年', symbol: 'ly', value: 'ly', factor: 1.057e-16 },
    { name: '天文单位', symbol: 'au', value: 'au', factor: 6.68459e-12 },
    { name: '市尺', symbol: 'chi', value: 'chi', factor: 3 }
  ],
  weight: [
    { name: '千克', symbol: 'kg', value: 'kg', factor: 1 },
    { name: '克', symbol: 'g', value: 'g', factor: 1000 },
    { name: '毫克', symbol: 'mg', value: 'mg', factor: 1000000 },
    { name: '吨', symbol: 't', value: 't', factor: 0.001 },
    { name: '磅', symbol: 'lb', value: 'lb', factor: 2.20462 },
    { name: '盎司', symbol: 'oz', value: 'oz', factor: 35.274 },
    { name: '斤', symbol: 'jin', value: 'jin', factor: 2 },
    { name: '两', symbol: 'liang', value: 'liang', factor: 20 },
    { name: '克拉', symbol: 'ct', value: 'ct', factor: 5000 },
    { name: '原子质量单位', symbol: 'u', value: 'u', factor: 6.022e26 }
  ],
  temperature: [
    { name: '摄氏度', symbol: '°C', value: 'celsius', factor: 1 },
    { name: '华氏度', symbol: '°F', value: 'fahrenheit', factor: 1 },
    { name: '开尔文', symbol: 'K', value: 'kelvin', factor: 1 },
    { name: '兰氏度', symbol: '°R', value: 'rankine', factor: 1 }
  ],
  area: [
    { name: '平方米', symbol: 'm²', value: 'm2', factor: 1 },
    { name: '平方千米', symbol: 'km²', value: 'km2', factor: 0.000001 },
    { name: '平方厘米', symbol: 'cm²', value: 'cm2', factor: 10000 },
    { name: '公顷', symbol: 'ha', value: 'ha', factor: 0.0001 },
    { name: '亩', symbol: 'mu', value: 'mu', factor: 0.0015 },
    { name: '平方英尺', symbol: 'ft²', value: 'ft2', factor: 10.7639 },
    { name: '平方英寸', symbol: 'in²', value: 'in2', factor: 1550 },
    { name: '英亩', symbol: 'acre', value: 'acre', factor: 0.000247105 }
  ],
  volume: [
    { name: '立方米', symbol: 'm³', value: 'm3', factor: 1 },
    { name: '升', symbol: 'L', value: 'l', factor: 1000 },
    { name: '毫升', symbol: 'mL', value: 'ml', factor: 1000000 },
    { name: '加仑(美)', symbol: 'gal', value: 'gal_us', factor: 264.172 },
    { name: '加仑(英)', symbol: 'gal', value: 'gal_uk', factor: 219.969 },
    { name: '夸脱', symbol: 'qt', value: 'qt', factor: 1056.69 },
    { name: '品脱', symbol: 'pt', value: 'pt', factor: 2113.38 },
    { name: '立方厘米', symbol: 'cm³', value: 'cm3', factor: 1000000 }
  ]
}

// 常用换算预设
const presets = {
  length: [
    { name: '1米 = 3.28英尺', description: '常用长度换算', from: 1, fromUnit: 'm', toUnit: 'ft' },
    { name: '1千米 = 0.62英里', description: '公里英里换算', from: 1, fromUnit: 'km', toUnit: 'mi' },
    { name: '1英寸 = 2.54厘米', description: '英寸厘米换算', from: 1, fromUnit: 'in', toUnit: 'cm' }
  ],
  weight: [
    { name: '1千克 = 2.2磅', description: '公斤磅换算', from: 1, fromUnit: 'kg', toUnit: 'lb' },
    { name: '1斤 = 500克', description: '市斤克换算', from: 1, fromUnit: 'jin', toUnit: 'g' },
    { name: '1盎司 = 28.35克', description: '盎司克换算', from: 1, fromUnit: 'oz', toUnit: 'g' }
  ],
  temperature: [
    { name: '0°C = 32°F', description: '水冰点', from: 0, fromUnit: 'celsius', toUnit: 'fahrenheit' },
    { name: '100°C = 212°F', description: '水沸点', from: 100, fromUnit: 'celsius', toUnit: 'fahrenheit' },
    { name: '37°C = 98.6°F', description: '人体温度', from: 37, fromUnit: 'celsius', toUnit: 'fahrenheit' }
  ],
  area: [
    { name: '1亩 = 666.67平方米', description: '亩平方米换算', from: 1, fromUnit: 'mu', toUnit: 'm2' },
    { name: '1公顷 = 15亩', description: '公顷亩换算', from: 1, fromUnit: 'ha', toUnit: 'mu' },
    { name: '1平方英尺 = 0.093平方米', description: '平方英尺平方米换算', from: 1, fromUnit: 'ft2', toUnit: 'm2' }
  ],
  volume: [
    { name: '1升 = 1000毫升', description: '升毫升换算', from: 1, fromUnit: 'l', toUnit: 'ml' },
    { name: '1加仑(美) = 3.785升', description: '美制加仑升换算', from: 1, fromUnit: 'gal_us', toUnit: 'l' },
    { name: '1立方米 = 1000升', description: '立方米升换算', from: 1, fromUnit: 'm3', toUnit: 'l' }
  ]
}

// 计算属性
const currentUnits = computed(() => {
  return units[selectedCategory.value] || []
})

const currentPresets = computed(() => {
  return presets[selectedCategory.value] || []
})

const batchLines = computed(() => {
  return batchInput.value.split('\n').filter(line => line.trim()).length
})

const conversionFormula = computed(() => {
  if (!fromValue.value || !fromUnit.value || !toUnit.value) return ''

  if (selectedCategory.value === 'temperature') {
    const from = getUnitName(fromUnit.value)
    const to = getUnitName(toUnit.value)
    return `${from} × 转换系数 = ${to}`
  } else {
    const fromFactor = getUnitFactor(fromUnit.value)
    const toFactor = getUnitFactor(toUnit.value)
    const ratio = fromFactor / toFactor
    return `1 ${getUnitName(fromUnit.value)} = ${ratio.toFixed(6)} ${getUnitName(toUnit.value)}`
  }
})

// 方法
const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
  const categoryUnits = units[categoryId]
  if (categoryUnits && categoryUnits.length > 0) {
    fromUnit.value = categoryUnits[0].value
    toUnit.value = categoryUnits.length > 1 ? categoryUnits[1].value : categoryUnits[0].value
  }
  fromValue.value = ''
  toValue.value = ''
  batchInput.value = ''
  batchResults.value = []
}

const getUnitName = (unitValue) => {
  const unit = currentUnits.value.find(u => u.value === unitValue)
  return unit ? unit.name : ''
}

const getUnitFactor = (unitValue) => {
  const unit = currentUnits.value.find(u => u.value === unitValue)
  return unit ? unit.factor : 1
}

const convertFromUnit = () => {
  if (fromValue.value === '' || fromUnit.value === '' || toUnit.value === '') {
    toValue.value = ''
    return
  }

  if (selectedCategory.value === 'temperature') {
    toValue.value = convertTemperature(fromValue.value, fromUnit.value, toUnit.value)
  } else {
    const fromFactor = getUnitFactor(fromUnit.value)
    const toFactor = getUnitFactor(toUnit.value)
    const baseValue = fromValue.value / fromFactor
    toValue.value = baseValue * toFactor
  }
}

const convertToUnit = () => {
  if (toValue.value === '' || fromUnit.value === '' || toUnit.value === '') {
    fromValue.value = ''
    return
  }

  if (selectedCategory.value === 'temperature') {
    fromValue.value = convertTemperature(toValue.value, toUnit.value, fromUnit.value)
  } else {
    const fromFactor = getUnitFactor(fromUnit.value)
    const toFactor = getUnitFactor(toUnit.value)
    const baseValue = toValue.value / toFactor
    fromValue.value = baseValue * fromFactor
  }
}

const convertTemperature = (value, fromUnit, toUnit) => {
  // 先转换为摄氏度
  let celsius
  switch (fromUnit) {
    case 'celsius':
      celsius = value
      break
    case 'fahrenheit':
      celsius = (value - 32) * 5/9
      break
    case 'kelvin':
      celsius = value - 273.15
      break
    case 'rankine':
      celsius = (value - 491.67) * 5/9
      break
    default:
      return value
  }

  // 再转换为目标单位
  switch (toUnit) {
    case 'celsius':
      return celsius
    case 'fahrenheit':
      return celsius * 9/5 + 32
    case 'kelvin':
      return celsius + 273.15
    case 'rankine':
      return (celsius + 273.15) * 9/5
    default:
      return celsius
  }
}

const swapUnits = () => {
  const temp = fromUnit.value
  fromUnit.value = toUnit.value
  toUnit.value = temp
  const tempValue = fromValue.value
  fromValue.value = toValue.value
  toValue.value = tempValue
}

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return ''
  return Number(num).toLocaleString('zh-CN', { maximumFractionDigits: 8 })
}

const applyPreset = (preset) => {
  selectedCategory.value = Object.keys(units).find(key =>
    units[key].some(u => u.value === preset.fromUnit)
  )
  fromUnit.value = preset.fromUnit
  toUnit.value = preset.toUnit
  fromValue.value = preset.from
  convertFromUnit()
}

const batchConvert = () => {
  if (!batchInput.value || fromUnit.value === '' || toUnit.value === '') {
    batchResults.value = []
    return
  }

  const lines = batchInput.value.split('\n').filter(line => line.trim())
  const results = []

  lines.forEach(line => {
    const value = parseFloat(line.trim())
    if (!isNaN(value)) {
      let convertedValue
      if (selectedCategory.value === 'temperature') {
        convertedValue = convertTemperature(value, fromUnit.value, toUnit.value)
      } else {
        const fromFactor = getUnitFactor(fromUnit.value)
        const toFactor = getUnitFactor(toUnit.value)
        const baseValue = value / fromFactor
        convertedValue = baseValue * toFactor
      }

      results.push({
        from: value,
        to: convertedValue
      })
    }
  })

  batchResults.value = results
}

const copyBatchResults = async () => {
  const text = batchResults.value.map(r =>
    `${formatNumber(r.from)} ${getUnitName(fromUnit.value)} = ${formatNumber(r.to)} ${getUnitName(toUnit.value)}`
  ).join('\n')

  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 监听器
watch(selectedCategory, () => {
  selectCategory(selectedCategory.value)
})

// 初始化
selectCategory('length')

// SEO配置
useSeoMeta({
  title: '单位换算器 - 长度重量温度面积体积在线转换',
  description: '免费在线单位换算工具，支持长度、重量、温度、面积、体积等多种单位类型的相互转换，实时计算，批量处理。',
  keywords: ['单位换算', '长度转换', '重量转换', '温度转换', '面积转换', '体积转换', '在线工具']
})

definePageMeta({
  layout: 'default'
})
</script>