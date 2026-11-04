<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">卡路里计数器</h1>
      <p class="text-muted-foreground">记录每日食物热量摄入，计算热量缺口，科学管理体重，支持常见食物热量查询</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target class="w-5 h-5 text-primary" />
            每日热量目标
          </h2>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">性别</label>
                <select v-model="gender" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">年龄</label>
                <input v-model.number="age" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="岁">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">体重 (kg)</label>
                <input v-model.number="weight" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="体重">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">身高 (cm)</label>
                <input v-model.number="height" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="身高">
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-1 block">活动水平</label>
              <select v-model="activity" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="1.2">久坐少动</option>
                <option value="1.375">轻度活动</option>
                <option value="1.55">中度活动</option>
                <option value="1.725">高度活动</option>
                <option value="1.9">极度活动</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-1 block">目标</label>
              <select v-model="goal" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="lose">减重 (-500大卡/天)</option>
                <option value="maintain">维持体重</option>
                <option value="gain">增重 (+300大卡/天)</option>
              </select>
            </div>

            <button @click="calculateTarget" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              计算目标热量
            </button>
          </div>
        </div>

        <div v-if="targetCalories" class="bg-card rounded-lg p-6 border">
          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded p-4 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-1">每日目标热量</p>
              <p class="text-4xl font-bold text-primary">{{ targetCalories }} 大卡</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="text-muted-foreground">蛋白质</p>
              <p class="font-bold">{{ Math.round(targetCalories * 0.3) }}g</p>
            </div>
            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="text-muted-foreground">碳水</p>
              <p class="font-bold">{{ Math.round(targetCalories * 0.4 / 4) }}g</p>
            </div>
            <div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <p class="text-muted-foreground">脂肪</p>
              <p class="font-bold">{{ Math.round(targetCalories * 0.3 / 9) }}g</p>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">添加食物</h2>

          <div class="space-y-4">
            <input v-model="foodSearch" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="搜索食物...">

            <div v-if="foodSearch" class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="food in filteredFoods"
                :key="food.name"
                @click="addFood(food)"
                class="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
              >
                <span class="text-sm">{{ food.name }}</span>
                <span class="text-xs font-mono text-muted-foreground">{{ food.calories }}大卡/{{ food.unit }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <input v-model.number="customFoodName" class="px-3 py-2 border border-border rounded text-sm" placeholder="食物名称">
              <input v-model.number="customFoodCalories" class="px-3 py-2 border border-border rounded text-sm" placeholder="热量">
            </div>
            <button @click="addCustomFood" class="w-full px-4 py-2 bg-muted rounded text-sm">添加自定义食物</button>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">今日记录</h2>
            <button @click="clearAll" class="text-xs text-red-600 hover:underline">清空</button>
          </div>

          <div v-if="todayLog.length === 0" class="text-center py-8 text-sm text-muted-foreground">
            今日暂无记录
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(item, index) in todayLog"
              :key="index"
              class="flex items-center justify-between p-2 bg-muted rounded text-sm"
            >
              <div class="flex-1">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-xs text-muted-foreground ml-2">{{ item.amount }}{{ item.unit }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono">{{ item.calories }}大卡</span>
                <button @click="removeFood(index)" class="text-red-500 hover:text-red-700">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div v-if="todayLog.length > 0" class="mt-4 p-3 bg-muted rounded">
            <div class="flex items-center justify-between text-sm">
              <span>已摄入: <strong>{{ totalCalories }}</strong> 大卡</span>
              <span>剩余: <strong>{{ targetCalories ? targetCalories - totalCalories : '-' }}</strong> 大卡</span>
            </div>
            <div class="w-full bg-background rounded-full h-2 mt-2">
              <div
                class="h-2 rounded-full transition-all"
                :class="getCalorieBarColor()"
                :style="{ width: Math.min((totalCalories / targetCalories) * 100, 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常见食物热量</h2>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div v-for="food in commonFoods" :key="food.name" class="p-2 border rounded">
              <p class="font-medium">{{ food.name }}</p>
              <p class="text-muted-foreground">{{ food.calories }}大卡/{{ food.unit }}</p>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">热量计算公式</h2>
          <div class="space-y-2 text-sm">
            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium">Mifflin-St Jeor公式</p>
              <p class="text-muted-foreground">男性: 10×体重 + 6.25×身高 - 5×年龄 + 5</p>
              <p class="text-muted-foreground">女性: 10×体重 + 6.25×身高 - 5×年龄 - 161</p>
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
import { Target, X } from 'lucide-vue-next'

const gender = ref('male')
const age = ref(25)
const weight = ref(null)
const height = ref(null)
const activity = ref('1.375')
const goal = ref('maintain')

const foodSearch = ref('')
const customFoodName = ref('')
const customFoodCalories = ref(null)
const targetCalories = ref(null)
const todayLog = ref([])

const commonFoods = [
  { name: '米饭(熟)', calories: 130, unit: '100g' },
  { name: '鸡蛋', calories: 155, unit: '个' },
  { name: '鸡胸肉', calories: 165, unit: '100g' },
  { name: '牛奶', calories: 54, unit: '100ml' },
  { name: '苹果', calories: 52, unit: '100g' },
  { name: '香蕉', calories: 89, unit: '100g' }
]

const foodDatabase = [
  ...commonFoods,
  { name: '燕麦片', calories: 389, unit: '100g' },
  { name: '全麦面包', calories: 247, unit: '100g' },
  { name: '牛排', calories: 250, unit: '100g' },
  { name: '三文鱼', calories: 208, unit: '100g' },
  { name: '西兰花', calories: 34, unit: '100g' }
]

const filteredFoods = computed(() => {
  if (!foodSearch.value) return []
  return foodDatabase.filter(f => f.name.includes(foodSearch.value))
})

const totalCalories = computed(() => {
  return todayLog.value.reduce((sum, item) => sum + item.calories, 0)
})

function calculateTarget() {
  if (!weight.value || !age.value) {
    alert('请输入体重和年龄')
    return
  }

  let bmr
  if (gender.value === 'male') {
    bmr = 10 * weight.value + 6.25 * height.value - 5 * age.value + 5
  } else {
    bmr = 10 * weight.value + 6.25 * height.value - 5 * age.value - 161
  }

  let tdee = bmr * parseFloat(activity.value)

  if (goal.value === 'lose') {
    tdee -= 500
  } else if (goal.value === 'gain') {
    tdee += 300
  }

  targetCalories.value = Math.round(tdee)
}

function addFood(food) {
  todayLog.value.push({
    name: food.name,
    amount: 100,
    unit: food.unit,
    calories: food.calories
  })
}

function addCustomFood() {
  if (!customFoodName.value || !customFoodCalories.value) return
  todayLog.value.push({
    name: customFoodName.value,
    amount: 100,
    unit: 'g',
    calories: customFoodCalories.value
  })
  customFoodName.value = ''
  customFoodCalories.value = null
}

function removeFood(index) {
  todayLog.value.splice(index, 1)
}

function clearAll() {
  todayLog.value = []
}

function getCalorieBarColor() {
  if (!targetCalories.value) return 'bg-gray-500'
  const ratio = totalCalories.value / targetCalories.value
  if (ratio <= 0.8) return 'bg-green-500'
  if (ratio <= 1) return 'bg-yellow-500'
  return 'bg-red-500'
}

useSeoMeta({
  title: '卡路里计数器 - 在线食物热量记录与追踪工具',
  description: '免费在线卡路里计数器，记录每日食物热量摄入，计算热量缺口，支持常见食物热量查询，科学管理体重。',
  keywords: ['卡路里', '热量计数', '卡路里计算', '食物热量', '减脂饮食', '热量缺口', '营养记录', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('卡路里计数器')
</script>
