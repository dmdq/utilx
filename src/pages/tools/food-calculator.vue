<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">食物份量换算器</h1>
      <p class="text-muted-foreground">快速换算食物份量、营养素和计量单位，支持常见食物的重量体积转换</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：换算工具 -->
      <div class="space-y-4">
        <!-- 重量体积换算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Scale class="w-5 h-5 text-primary" />
            重量体积换算
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">选择食物</label>
              <select v-model="selectedFood" class="w-full px-3 py-2 border border-border rounded-lg text-sm" @change="calculateConversion">
                <option value="">请选择食物...</option>
                <optgroup label="主食类">
                  <option v-for="food in foods.staples" :key="food.name" :value="food.name">{{ food.name }}</option>
                </optgroup>
                <optgroup label="蛋白质">
                  <option v-for="food in foods.protein" :key="food.name" :value="food.name">{{ food.name }}</option>
                </optgroup>
                <optgroup label="蔬菜水果">
                  <option v-for="food in foods.vegetables" :key="food.name" :value="food.name">{{ food.name }}</option>
                </optgroup>
                <optgroup label="调料">
                  <option v-for="food in foods.condiments" :key="food.name" :value="food.name">{{ food.name }}</option>
                </optgroup>
              </select>
            </div>

            <div v-if="selectedFood">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium mb-2 block">重量 (克)</label>
                  <input
                    v-model.number="weightGrams"
                    type="number"
                    class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    placeholder="输入重量"
                    @input="calculateVolume"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-2 block">体积 (毫升)</label>
                  <input
                    v-model.number="volumeMl"
                    type="number"
                    class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                    placeholder="输入体积"
                    @input="calculateWeight"
                  >
                </div>
              </div>

              <!-- 换算结果 -->
              <div v-if="conversionResult" class="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                <p class="text-sm text-muted-foreground mb-2">换算结果</p>
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p class="text-2xl font-bold">{{ conversionResult.weight }}</p>
                    <p class="text-xs text-muted-foreground">克 (g)</p>
                  </div>
                  <div>
                    <p class="text-2xl font-bold">{{ conversionResult.volume }}</p>
                    <p class="text-xs text-muted-foreground">毫升 (ml)</p>
                  </div>
                </div>
              </div>

              <!-- 常见份量参考 -->
              <div v-if="selectedFoodData" class="mt-4 p-4 bg-muted rounded">
                <p class="text-sm font-medium mb-2">常见份量参考</p>
                <div class="space-y-2 text-sm">
                  <div v-for="(portion, index) in selectedFoodData.portions" :key="index" class="flex justify-between">
                    <span>{{ portion.name }}</span>
                    <span class="font-mono">{{ portion.weight }}g / {{ portion.volume }}ml</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 勺子杯子换算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">厨房计量换算</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">选择换算类型</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="conversionType = 'spoon'"
                  :class="['p-3 rounded-lg text-sm', conversionType === 'spoon' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  勺子换算
                </button>
                <button
                  @click="conversionType = 'cup'"
                  :class="['p-3 rounded-lg text-sm', conversionType === 'cup' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  杯子换算
                </button>
              </div>
            </div>

            <!-- 勺子换算 -->
            <div v-if="conversionType === 'spoon'" class="space-y-3">
              <div>
                <label class="text-sm font-medium mb-2 block"> tablespoons (汤勺)</label>
                <input
                  v-model.number="spoonTbsp"
                  type="number"
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  @input="calculateSpoons"
                >
              </div>
              <div>
                <label class="text-sm font-medium mb-2 block"> teaspoons (茶勺)</label>
                <input
                  v-model.number="spoonTsp"
                  type="number"
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  @input="calculateSpoonsReverse"
                >
              </div>
              <div class="p-3 bg-muted rounded text-sm">
                <p class="font-medium mb-1">换算关系</p>
                <p>1 tablespoon (汤勺) = 3 teaspoons (茶勺)</p>
                <p>1 tablespoon ≈ 15ml</p>
                <p>1 teaspoon ≈ 5ml</p>
              </div>
            </div>

            <!-- 杯子换算 -->
            <div v-if="conversionType === 'cup'" class="space-y-3">
              <div>
                <label class="text-sm font-medium mb-2 block"> cups (杯)</label>
                <input
                  v-model.number="cupAmount"
                  type="number"
                  class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  @input="calculateCups"
                >
              </div>
              <div class="p-3 bg-muted rounded text-sm">
                <p class="font-medium mb-2">换算结果</p>
                <div class="space-y-1 font-mono">
                  <p>{{ cupResult.ml }} ml</p>
                  <p>{{ cupResult.grams }} 克 (水)</p>
                  <p>{{ cupResult.tbsp }} tbsp</p>
                  <p>{{ cupResult.tsp }} tsp</p>
                </div>
              </div>
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <p class="font-medium mb-1">参考标准</p>
                <p>1 cup = 240ml (美国标准)</p>
                <p>1 cup = 250ml (公制标准)</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 烘焙比例换算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">烘焙比例换算</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">面粉重量 (克)</label>
              <input
                v-model.number="flourWeight"
                type="number"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="例如: 500"
                @input="calculateBakingRatios"
              >
            </div>

            <div v-if="bakingResult.flour > 0" class="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
              <p class="text-sm font-medium mb-3">按照烘焙百分比计算</p>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>面粉 (100%)</span>
                  <span class="font-mono font-medium">{{ bakingResult.flour }}g</span>
                </div>
                <div class="flex justify-between">
                  <span>水 (60%)</span>
                  <span class="font-mono font-medium">{{ bakingResult.water }}g</span>
                </div>
                <div class="flex justify-between">
                  <span>盐 (2%)</span>
                  <span class="font-mono font-medium">{{ bakingResult.salt }}g</span>
                </div>
                <div class="flex justify-between">
                  <span>酵母 (1%)</span>
                  <span class="font-mono font-medium">{{ bakingResult.yeast }}g</span>
                </div>
                <div class="flex justify-between">
                  <span>糖/油脂 (5-10%)</span>
                  <span class="font-mono font-medium">{{ bakingResult.fat }}g</span>
                </div>
              </div>
            </div>

            <div class="p-3 bg-muted rounded text-xs">
              <p class="font-medium mb-1">烘焙百分比说明</p>
              <p>以面粉重量为100%，其他材料按比例计算。这是面包师常用的配方计算方法。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：参考数据 -->
      <div class="space-y-4">
        <!-- 常见食物密度表 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Table class="w-5 h-5 text-blue-500" />
            常见食物密度表
          </h2>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">食物</th>
                  <th class="text-right p-2">g/ml</th>
                  <th class="text-right p-2">g/cup</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(food, index) in densityTable" :key="index" class="border-b">
                  <td class="p-2">{{ food.name }}</td>
                  <td class="p-2 text-right font-mono">{{ food.density }}</td>
                  <td class="p-2 text-right font-mono">{{ food.perCup }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 厨房单位对照表 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">厨房单位对照表</h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-2">体积单位</p>
              <div class="space-y-1 text-muted-foreground">
                <p>1 杯 (cup) = 240ml</p>
                <p>1 汤勺 (tbsp) = 15ml</p>
                <p>1 茶勺 (tsp) = 5ml</p>
                <p>1 毫升 (ml) = 1 立方厘米 (cc)</p>
              </div>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-2">重量单位</p>
              <div class="space-y-1 text-muted-foreground">
                <p>1 千克 (kg) = 1000 克 (g)</p>
                <p>1 磅 (lb) ≈ 453.6 克</p>
                <p>1 盎司 (oz) ≈ 28.35 克</p>
              </div>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-2">温度单位</p>
              <div class="space-y-1 text-muted-foreground">
                <p>°F = °C × 1.8 + 32</p>
                <p>°C = (°F - 32) ÷ 1.8</p>
                <p>烤箱 180°C ≈ 350°F</p>
                <p>烤箱 200°C ≈ 400°F</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 营养素换算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">营养素热量换算</h2>

          <div class="space-y-3">
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm">蛋白质</span>
                <span class="font-mono">1g = 4 大卡</span>
              </div>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm">碳水化合物</span>
                <span class="font-mono">1g = 4 大卡</span>
              </div>
            </div>

            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm">脂肪</span>
                <span class="font-mono">1g = 9 大卡</span>
              </div>
            </div>

            <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm">酒精</span>
                <span class="font-mono">1g = 7 大卡</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 常见份量大小 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常见份量大小参考</h2>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 bg-muted rounded">
              <p class="font-medium">拳头大小</p>
              <p class="text-xs text-muted-foreground">≈ 1杯 熟食</p>
            </div>
            <div class="p-2 bg-muted rounded">
              <p class="font-medium">手掌大小</p>
              <p class="text-xs text-muted-foreground">≈ 85-115g 肉类</p>
            </div>
            <div class="p-2 bg-muted rounded">
              <p class="font-medium">拇指大小</p>
              <p class="text-xs text-muted-foreground">≈ 1汤匙 油脂</p>
            </div>
            <div class="p-2 bg-muted rounded">
              <p class="font-medium">掌心大小</p>
              <p class="text-xs text-muted-foreground">≈ 1/2杯 坚果</p>
            </div>
            <div class="p-2 bg-muted rounded">
              <p class="font-medium">网球大小</p>
              <p class="text-xs text-muted-foreground">≈ 1个中等水果</p>
            </div>
            <div class="p-2 bg-muted rounded">
              <p class="font-medium">骰子大小</p>
              <p class="text-xs text-muted-foreground">≈ 30g 奶酪</p>
            </div>
          </div>
        </div>

        <!-- 使用技巧 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">厨房称量技巧</h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <Lightbulb class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p>液体材料用量杯，固体材料用厨房秤更准确</p>
            </div>
            <div class="flex items-start gap-2">
              <Lightbulb class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p>面粉的密度因品牌和储存方式不同会有差异</p>
            </div>
            <div class="flex items-start gap-2">
              <Lightbulb class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p>烘焙时建议使用重量而非体积，结果更稳定</p>
            </div>
            <div class="flex items-start gap-2">
              <Lightbulb class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p>勺子装满刮平是最标准的计量方法</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'
import { Scale, Table, Lightbulb } from 'lucide-vue-next'

const selectedFood = ref('')
const weightGrams = ref(null)
const volumeMl = ref(null)
const conversionType = ref('spoon')
const spoonTbsp = ref(null)
const spoonTsp = ref(null)
const cupAmount = ref(null)
const flourWeight = ref(null)

const foods = {
  staples: [
    { name: '大米', density: 0.85, portions: [{ name: '1碗米饭', weight: 150, volume: 180 }] },
    { name: '面粉', density: 0.55, portions: [{ name: '1杯', weight: 120, volume: 220 }] },
    { name: '燕麦片', density: 0.4, portions: [{ name: '1/2杯', weight: 40, volume: 100 }] },
    { name: '意大利面', density: 0.5, portions: [{ name: '1份', weight: 85, volume: 170 }] }
  ],
  protein: [
    { name: '鸡胸肉', density: 1.05, portions: [{ name: '1块手掌大小', weight: 120, volume: 115 }] },
    { name: '鸡蛋', density: 1.0, portions: [{ name: '1个大号', weight: 50, volume: 50 }] },
    { name: '三文鱼', density: 1.03, portions: [{ name: '1块', weight: 150, volume: 145 }] },
    { name: '豆腐', density: 0.95, portions: [{ name: '1块', weight: 200, volume: 210 }] }
  ],
  vegetables: [
    { name: '西兰花', density: 0.35, portions: [{ name: '1朵', weight: 30, volume: 85 }] },
    { name: '胡萝卜', density: 0.65, portions: [{ name: '1根中等', weight: 80, volume: 125 }] },
    { name: '菠菜', density: 0.25, portions: [{ name: '1杯切碎', weight: 30, volume: 120 }] },
    { name: '番茄', density: 0.95, portions: [{ name: '1个中等', weight: 120, volume: 125 }] }
  ],
  condiments: [
    { name: '食用油', density: 0.92, portions: [{ name: '1汤匙', weight: 14, volume: 15 }] },
    { name: '蜂蜜', density: 1.42, portions: [{ name: '1汤匙', weight: 21, volume: 15 }] },
    { name: '白糖', density: 0.85, portions: [{ name: '1汤匙', weight: 13, volume: 15 }] },
    { name: '盐', density: 1.2, portions: [{ name: '1茶匙', weight: 6, volume: 5 }] }
  ]
}

const densityTable = [
  { name: '水', density: '1.00', perCup: '240' },
  { name: '牛奶', density: '1.03', perCup: '247' },
  { name: '食用油', density: '0.92', perCup: '218' },
  { name: '蜂蜜', density: '1.42', perCup: '340' },
  { name: '白糖', density: '0.85', perCup: '200' },
  { name: '面粉', density: '0.55', perCup: '120' },
  { name: '大米', density: '0.85', perCup: '200' },
  { name: '燕麦片', density: '0.40', perCup: '95' }
]

const conversionResult = ref(null)
const selectedFoodData = computed(() => {
  if (!selectedFood.value) return null
  for (const category of Object.values(foods)) {
    const food = category.find(f => f.name === selectedFood.value)
    if (food) return food
  }
  return null
})

const cupResult = computed(() => {
  if (!cupAmount.value) return { ml: 0, grams: 0, tbsp: 0, tsp: 0 }
  return {
    ml: Math.round(cupAmount.value * 240),
    grams: Math.round(cupAmount.value * 240),
    tbsp: Math.round(cupAmount.value * 16),
    tsp: Math.round(cupAmount.value * 48)
  }
})

const bakingResult = ref({
  flour: 0,
  water: 0,
  salt: 0,
  yeast: 0,
  fat: 0
})

function calculateConversion() {
  weightGrams.value = null
  volumeMl.value = null
  conversionResult.value = null
}

function calculateVolume() {
  if (!weightGrams.value || !selectedFoodData.value) return
  volumeMl.value = Math.round(weightGrams.value / selectedFoodData.value.density)
  conversionResult.value = {
    weight: weightGrams.value,
    volume: volumeMl.value
  }
}

function calculateWeight() {
  if (!volumeMl.value || !selectedFoodData.value) return
  weightGrams.value = Math.round(volumeMl.value * selectedFoodData.value.density)
  conversionResult.value = {
    weight: weightGrams.value,
    volume: volumeMl.value
  }
}

function calculateSpoons() {
  if (spoonTbsp.value === null) return
  spoonTsp.value = spoonTbsp.value * 3
}

function calculateSpoonsReverse() {
  if (spoonTsp.value === null) return
  spoonTbsp.value = (spoonTsp.value / 3).toFixed(2)
}

function calculateCups() {
  // Result handled by computed property
}

function calculateBakingRatios() {
  if (!flourWeight.value) return
  bakingResult.value = {
    flour: flourWeight.value,
    water: Math.round(flourWeight.value * 0.6),
    salt: Math.round(flourWeight.value * 0.02),
    yeast: Math.round(flourWeight.value * 0.01),
    fat: Math.round(flourWeight.value * 0.075)
  }
}

useSeoMeta({
  title: '食物份量换算器 - 在线厨房计量单位转换工具',
  description: '免费在线食物份量换算器，快速换算食物重量体积、厨房计量单位、烘焙比例，支持常见食物密度查询。', keywords: ['食物换算', '份量换算', '厨房计量', '重量体积换算', '烘焙比例', '杯勺换算', '厨房单位', '在线工具']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('食物份量换算器')
</script>
