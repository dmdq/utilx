<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">宏量营养素追踪器</h1>
      <p class="text-muted-foreground">追踪每日蛋白质、碳水、脂肪摄入，科学配比营养，支持增肌减脂目标</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：目标设置和记录 -->
      <div class="space-y-4">
        <!-- 目标设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target class="w-5 h-5 text-primary" />
            每日宏量营养素目标
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">目标热量 (大卡/天)</label>
              <input
                v-model.number="targetCalories"
                type="number"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="例如: 2000"
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">蛋白质比例 (%)</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="proteinRatio"
                  type="range"
                  min="10"
                  max="50"
                  class="flex-1"
                  @input="calculateTargets"
                >
                <span class="text-sm font-mono w-12 text-right">{{ proteinRatio }}%</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ Math.round(targetCalories * proteinRatio / 100 / 4) }}g/天</p>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">碳水化合物比例 (%)</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="carbsRatio"
                  type="range"
                  min="10"
                  max="60"
                  class="flex-1"
                  @input="calculateTargets"
                >
                <span class="text-sm font-mono w-12 text-right">{{ carbsRatio }}%</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ Math.round(targetCalories * carbsRatio / 100 / 4) }}g/天</p>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">脂肪比例 (%)</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="fatRatio"
                  type="range"
                  min="10"
                  max="50"
                  class="flex-1"
                  @input="calculateTargets"
                >
                <span class="text-sm font-mono w-12 text-right">{{ fatRatio }}%</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">{{ Math.round(targetCalories * fatRatio / 100 / 9) }}g/天</p>
            </div>

            <div class="p-3 bg-muted rounded text-sm">
              <p class="font-medium mb-1">比例总和: {{ proteinRatio + carbsRatio + fatRatio }}%</p>
              <p v-if="proteinRatio + carbsRatio + fatRatio !== 100" class="text-orange-600">总比例应为100%</p>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                @click="setPreset('balanced')"
                class="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-sm"
              >
                均衡
              </button>
              <button
                @click="setPreset('lowcarb')"
                class="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-sm"
              >
                低碳
              </button>
              <button
                @click="setPreset('highprotein')"
                class="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded text-sm"
              >
                高蛋白
              </button>
            </div>
          </div>
        </div>

        <!-- 添加食物 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">添加食物</h2>

          <div class="space-y-4">
            <input v-model="foodSearch" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="搜索食物...">

            <div v-if="foodSearch" class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="food in filteredFoods"
                :key="food.name"
                @click="selectFood(food)"
                class="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
              >
                <div>
                  <span class="text-sm">{{ food.name }}</span>
                  <div class="text-xs text-muted-foreground">
                    蛋白{{ food.protein }}g 碳水{{ food.carbs }}g 脂肪{{ food.fat }}g
                  </div>
                </div>
                <span class="text-xs font-mono text-muted-foreground">{{ food.calories }}大卡/100g</span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <input v-model="customFoodName" class="px-3 py-2 border border-border rounded text-sm" placeholder="食物名称">
              <input v-model.number="customFoodProtein" class="px-3 py-2 border border-border rounded text-sm" placeholder="蛋白质(g)">
              <input v-model.number="customFoodCarbs" class="px-3 py-2 border border-border rounded text-sm" placeholder="碳水(g)">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input v-model.number="customFoodFat" class="px-3 py-2 border border-border rounded text-sm" placeholder="脂肪(g)">
              <input v-model.number="customFoodAmount" class="px-3 py-2 border border-border rounded text-sm" placeholder="份量(g)">
            </div>
            <button @click="addCustomFood" class="w-full px-4 py-2 bg-muted rounded text-sm">添加自定义食物</button>
          </div>
        </div>

        <!-- 今日记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">今日记录</h2>
            <button @click="clearAll" class="text-xs text-red-600 hover:underline">清空</button>
          </div>

          <div v-if="todayLog.length === 0" class="text-center py-8 text-sm text-muted-foreground">
            今日暂无记录
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in todayLog"
              :key="index"
              class="flex items-center justify-between p-2 bg-muted rounded text-sm"
            >
              <div class="flex-1">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-xs text-muted-foreground ml-2">{{ item.amount }}g</span>
                <div class="text-xs text-muted-foreground">
                  蛋白{{ item.protein }}g 碳水{{ item.carbs }}g 脂肪{{ item.fat }}g
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono">{{ item.calories }}大卡</span>
                <button @click="removeFood(index)" class="text-red-500 hover:text-red-700">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：进度可视化 -->
      <div class="space-y-4">
        <!-- 宏量营养素进度 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-purple-500" />
            今日营养摄入
          </h2>

          <!-- 总热量 -->
          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-1">总热量</p>
              <p class="text-3xl font-bold text-primary">{{ totalCalories }} / {{ targetCalories }} 大卡</p>
              <p class="text-sm mt-2" :class="getCalorieStatus()">{{ getCalorieStatusText() }}</p>
            </div>
          </div>

          <!-- 蛋白质 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2 text-sm">
              <span class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                蛋白质
              </span>
              <span class="font-medium">{{ totalProtein }}g / {{ targetProtein }}g</span>
            </div>
            <div class="w-full bg-muted rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all bg-green-500"
                :style="{ width: Math.min((totalProtein / targetProtein) * 100, 100) + '%' }"
              ></div>
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ Math.round(totalProtein * 4) }}大卡 ({{ Math.round(totalProtein * 4 / totalCalories * 100) || 0 }}%)</p>
          </div>

          <!-- 碳水化合物 -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2 text-sm">
              <span class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                碳水化合物
              </span>
              <span class="font-medium">{{ totalCarbs }}g / {{ targetCarbs }}g</span>
            </div>
            <div class="w-full bg-muted rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all bg-blue-500"
                :style="{ width: Math.min((totalCarbs / targetCarbs) * 100, 100) + '%' }"
              ></div>
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ Math.round(totalCarbs * 4) }}大卡 ({{ Math.round(totalCarbs * 4 / totalCalories * 100) || 0 }}%)</p>
          </div>

          <!-- 脂肪 -->
          <div>
            <div class="flex items-center justify-between mb-2 text-sm">
              <span class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                脂肪
              </span>
              <span class="font-medium">{{ totalFat }}g / {{ targetFat }}g</span>
            </div>
            <div class="w-full bg-muted rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all bg-orange-500"
                :style="{ width: Math.min((totalFat / targetFat) * 100, 100) + '%' }"
              ></div>
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ Math.round(totalFat * 9) }}大卡 ({{ Math.round(totalFat * 9 / totalCalories * 100) || 0 }}%)</p>
          </div>
        </div>

        <!-- 环形图 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">营养分布</h2>

          <div class="flex justify-center mb-4">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <!-- 蛋白质 -->
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke="#22c55e"
                stroke-width="30"
                :stroke-dasharray="proteinArc"
                stroke-dashoffset="0"
                transform="rotate(-90 100 100)"
              />
              <!-- 碳水化合物 -->
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke="#3b82f6"
                stroke-width="30"
                :stroke-dasharray="carbsArc"
                :stroke-dashoffset="-proteinArc"
                transform="rotate(-90 100 100)"
              />
              <!-- 脂肪 -->
              <circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke="#f97316"
                stroke-width="30"
                :stroke-dasharray="fatArc"
                :stroke-dashoffset="-(proteinArc + carbsArc)"
                transform="rotate(-90 100 100)"
              />
              <text x="100" y="95" text-anchor="middle" class="text-2xl font-bold">{{ totalCalories }}</text>
              <text x="100" y="115" text-anchor="middle" class="text-xs fill-muted-foreground">大卡</text>
            </svg>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <div class="flex items-center justify-center gap-1 mb-1">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="font-medium">蛋白质</span>
              </div>
              <p class="text-xs">{{ Math.round(totalProtein * 4 / totalCalories * 100) || 0 }}%</p>
            </div>
            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div class="flex items-center justify-center gap-1 mb-1">
                <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                <span class="font-medium">碳水</span>
              </div>
              <p class="text-xs">{{ Math.round(totalCarbs * 4 / totalCalories * 100) || 0 }}%</p>
            </div>
            <div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div class="flex items-center justify-center gap-1 mb-1">
                <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                <span class="font-medium">脂肪</span>
              </div>
              <p class="text-xs">{{ Math.round(totalFat * 9 / totalCalories * 100) || 0 }}%</p>
            </div>
          </div>
        </div>

        <!-- 常见食物宏量营养素 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常见食物营养</h2>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div v-for="food in commonFoods" :key="food.name" class="p-2 border rounded">
              <p class="font-medium">{{ food.name }}</p>
              <p class="text-muted-foreground">蛋白{{ food.protein }}g 碳水{{ food.carbs }}g 脂肪{{ food.fat }}g</p>
            </div>
          </div>
        </div>

        <!-- 营养建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">营养建议</h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium text-foreground mb-1">蛋白质</p>
              <p class="text-muted-foreground">每公斤体重摄入1.2-2.0g蛋白质，运动人群需要更多</p>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium text-foreground mb-1">碳水化合物</p>
              <p class="text-muted-foreground">主要能量来源，运动前后应适量摄入复杂碳水</p>
            </div>

            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <p class="font-medium text-foreground mb-1">脂肪</p>
              <p class="text-muted-foreground">每日脂肪摄入应占总热量的20-35%，优先选择不饱和脂肪</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSeoMeta } from '#app'
import { Target, PieChart, X } from 'lucide-vue-next'

const targetCalories = ref(2000)
const proteinRatio = ref(30)
const carbsRatio = ref(40)
const fatRatio = ref(30)

const targetProtein = ref(150)
const targetCarbs = ref(200)
const targetFat = ref(67)

const foodSearch = ref('')
const customFoodName = ref('')
const customFoodProtein = ref(null)
const customFoodCarbs = ref(null)
const customFoodFat = ref(null)
const customFoodAmount = ref(100)

const todayLog = ref([])

const commonFoods = [
  { name: '鸡胸肉(熟)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: '鸡蛋', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: '米饭(熟)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: '三文鱼', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: '西兰花', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: '燕麦片', calories: 389, protein: 16.9, carbs: 66, fat: 6.9 },
  { name: '牛奶', calories: 54, protein: 3, carbs: 4.8, fat: 3 },
  { name: '香蕉', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }
]

const foodDatabase = [
  ...commonFoods,
  { name: '牛排', calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: '豆腐', calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { name: '全麦面包', calories: 247, protein: 13, carbs: 41, fat: 3.5 },
  { name: '酸奶', calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: '杏仁', calories: 579, protein: 21, carbs: 22, fat: 50 }
]

const filteredFoods = computed(() => {
  if (!foodSearch.value) return []
  return foodDatabase.filter(f => f.name.includes(foodSearch.value))
})

const totalProtein = computed(() => {
  return todayLog.value.reduce((sum, item) => sum + item.protein, 0)
})

const totalCarbs = computed(() => {
  return todayLog.value.reduce((sum, item) => sum + item.carbs, 0)
})

const totalFat = computed(() => {
  return todayLog.value.reduce((sum, item) => sum + item.fat, 0)
})

const totalCalories = computed(() => {
  return todayLog.value.reduce((sum, item) => sum + item.calories, 0)
})

const proteinArc = computed(() => {
  if (totalCalories.value === 0) return 0
  return (totalProtein.value * 4 / totalCalories.value) * 2 * Math.PI * 80
})

const carbsArc = computed(() => {
  if (totalCalories.value === 0) return 0
  return (totalCarbs.value * 4 / totalCalories.value) * 2 * Math.PI * 80
})

const fatArc = computed(() => {
  if (totalCalories.value === 0) return 0
  return (totalFat.value * 9 / totalCalories.value) * 2 * Math.PI * 80
})

function calculateTargets() {
  targetProtein.value = Math.round(targetCalories.value * proteinRatio.value / 100 / 4)
  targetCarbs.value = Math.round(targetCalories.value * carbsRatio.value / 100 / 4)
  targetFat.value = Math.round(targetCalories.value * fatRatio.value / 100 / 9)
}

function setPreset(type) {
  switch (type) {
    case 'balanced':
      proteinRatio.value = 30
      carbsRatio.value = 40
      fatRatio.value = 30
      break
    case 'lowcarb':
      proteinRatio.value = 35
      carbsRatio.value = 25
      fatRatio.value = 40
      break
    case 'highprotein':
      proteinRatio.value = 40
      carbsRatio.value = 35
      fatRatio.value = 25
      break
  }
  calculateTargets()
}

function selectFood(food) {
  todayLog.value.push({
    name: food.name,
    amount: 100,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    calories: food.calories
  })
  foodSearch.value = ''
}

function addCustomFood() {
  if (!customFoodName.value || !customFoodProtein.value || !customFoodCarbs.value || !customFoodFat.value) {
    alert('请填写完整的营养信息')
    return
  }

  const calories = customFoodProtein.value * 4 + customFoodCarbs.value * 4 + customFoodFat.value * 9
  const ratio = customFoodAmount.value / 100

  todayLog.value.push({
    name: customFoodName.value,
    amount: customFoodAmount.value,
    protein: Math.round(customFoodProtein.value * ratio),
    carbs: Math.round(customFoodCarbs.value * ratio),
    fat: Math.round(customFoodFat.value * ratio),
    calories: Math.round(calories * ratio)
  })

  customFoodName.value = ''
  customFoodProtein.value = null
  customFoodCarbs.value = null
  customFoodFat.value = null
  customFoodAmount.value = 100
}

function removeFood(index) {
  todayLog.value.splice(index, 1)
}

function clearAll() {
  todayLog.value = []
}

function getCalorieStatus() {
  if (totalCalories.value < targetCalories.value * 0.8) return 'text-orange-600'
  if (totalCalories.value > targetCalories.value * 1.1) return 'text-red-600'
  return 'text-green-600'
}

function getCalorieStatusText() {
  if (totalCalories.value < targetCalories.value * 0.8) return '摄入不足'
  if (totalCalories.value > targetCalories.value * 1.1) return '摄入过量'
  return '摄入适中'
}

watch([targetCalories, proteinRatio, carbsRatio, fatRatio], calculateTargets)

calculateTargets()

useSeoMeta({
  title: '宏量营养素追踪器 - 在线蛋白质碳水脂肪摄入记录工具',
  description: '免费在线宏量营养素追踪器，记录每日蛋白质、碳水化合物、脂肪摄入，科学配比营养，支持增肌减脂目标。', keywords: ['宏量营养素', '蛋白质', '碳水', '脂肪', '营养追踪', '增肌', '减脂', '营养配比', '在线工具']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('宏量营养素追踪器')
</script>
