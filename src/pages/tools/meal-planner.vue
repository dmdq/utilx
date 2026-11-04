<template>
  <div class="max-w-7xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">一周食谱规划</h1>
      <p class="text-muted-foreground">智能生成健康的一周食谱，科学搭配营养，支持增肌、减脂、均衡饮食等多种目标</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- 左侧：设置 -->
      <div class="space-y-4">
        <!-- 目标设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target class="w-5 h-5 text-primary" />
            饮食目标
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">主要目标</label>
              <select v-model="goal" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="balanced">均衡饮食</option>
                <option value="muscle">增肌</option>
                <option value="fatloss">减脂</option>
                <option value="energy">补充能量</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">每日热量目标</label>
              <input
                v-model.number="calories"
                type="number"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="例如: 2000"
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">餐数安排</label>
              <select v-model="mealsPerDay" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option :value="3">一日三餐</option>
                <option :value="4">三餐+加餐</option>
                <option :value="5">三餐+两顿加餐</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">饮食偏好</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" v-model="preferences.lowCarb">
                  <span>低碳水</span>
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" v-model="preferences.highProtein">
                  <span>高蛋白</span>
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" v-model="preferences.vegetarian">
                  <span>素食</span>
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" v-model="preferences.noGluten">
                  <span>无麸质</span>
                </label>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">排除食材</label>
              <textarea
                v-model="excludedFoods"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                rows="3"
                placeholder="用逗号分隔，例如: 花生, 海鲜"
              ></textarea>
            </div>

            <button
              @click="generateMealPlan"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
            >
              <Sparkles class="w-4 h-4 inline mr-2" />
              生成食谱
            </button>
          </div>
        </div>

        <!-- 营养目标 -->
        <div v-if="mealPlan.length > 0" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">营养目标</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">每日热量</span>
              <span class="font-medium">{{ calories }} 大卡</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">蛋白质</span>
              <span class="font-medium">{{ Math.round(calories * proteinRatio / 100 / 4) }}g</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">碳水</span>
              <span class="font-medium">{{ Math.round(calories * carbsRatio / 100 / 4) }}g</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">脂肪</span>
              <span class="font-medium">{{ Math.round(calories * fatRatio / 100 / 9) }}g</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：一周食谱 -->
      <div class="lg:col-span-3 space-y-4">
        <div v-if="mealPlan.length === 0" class="bg-card rounded-lg p-12 border text-center">
          <Utensils class="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p class="text-muted-foreground">设置您的饮食目标后点击"生成食谱"</p>
        </div>

        <div v-else class="space-y-4">
          <!-- 星期选择 -->
          <div class="bg-card rounded-lg p-4 border">
            <div class="flex gap-2 overflow-x-auto pb-2">
              <button
                v-for="(day, index) in weekDays"
                :key="index"
                @click="selectedDay = index"
                :class="['px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors', selectedDay === index ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
              >
                {{ day }}
              </button>
            </div>
          </div>

          <!-- 当日食谱 -->
          <div class="bg-card rounded-lg p-6 border">
            <h2 class="text-lg font-semibold mb-4">{{ weekDays[selectedDay] }}食谱</h2>

            <div class="space-y-4">
              <div
                v-for="(meal, index) in mealPlan[selectedDay].meals"
                :key="index"
                class="p-4 bg-muted rounded-lg"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">{{ meal.name }}</h3>
                  <span class="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{{ meal.calories }} 大卡</span>
                </div>
                <div class="text-sm text-muted-foreground mb-3">
                  蛋白质: {{ meal.protein }}g | 碳水: {{ meal.carbs }}g | 脂肪: {{ meal.fat }}g
                </div>
                <div class="space-y-2">
                  <div v-for="(food, fIndex) in meal.foods" :key="fIndex" class="flex items-center gap-2 text-sm">
                    <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{{ food.name }}</span>
                    <span class="text-muted-foreground">{{ food.amount }}</span>
                  </div>
                </div>
              </div>

              <!-- 每日总计 -->
              <div class="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                <h4 class="font-medium mb-3">每日营养总计</h4>
                <div class="grid grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <p class="text-muted-foreground">热量</p>
                    <p class="font-bold text-lg">{{ mealPlan[selectedDay].totalCalories }}</p>
                    <p class="text-xs">大卡</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground">蛋白质</p>
                    <p class="font-bold text-lg">{{ mealPlan[selectedDay].totalProtein }}</p>
                    <p class="text-xs">克</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground">碳水</p>
                    <p class="font-bold text-lg">{{ mealPlan[selectedDay].totalCarbs }}</p>
                    <p class="text-xs">克</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground">脂肪</p>
                    <p class="font-bold text-lg">{{ mealPlan[selectedDay].totalFat }}</p>
                    <p class="text-xs">克</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 一周概览 -->
          <div class="bg-card rounded-lg p-6 border">
            <h2 class="text-lg font-semibold mb-4">一周营养概览</h2>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b">
                    <th class="text-left p-2">日期</th>
                    <th class="text-center p-2">热量</th>
                    <th class="text-center p-2">蛋白质</th>
                    <th class="text-center p-2">碳水</th>
                    <th class="text-center p-2">脂肪</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(day, index) in mealPlan"
                    :key="index"
                    class="border-b hover:bg-muted/50"
                    :class="{ 'bg-primary/5': index === selectedDay }"
                  >
                    <td class="p-2">{{ weekDays[index] }}</td>
                    <td class="text-center p-2 font-mono">{{ day.totalCalories }}</td>
                    <td class="text-center p-2 font-mono">{{ day.totalProtein }}g</td>
                    <td class="text-center p-2 font-mono">{{ day.totalCarbs }}g</td>
                    <td class="text-center p-2 font-mono">{{ day.totalFat }}g</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="text-sm font-medium">一周平均摄入</p>
              <div class="grid grid-cols-4 gap-4 mt-2 text-center">
                <div>
                  <p class="text-lg font-bold">{{ weeklyAverages.calories }}</p>
                  <p class="text-xs text-muted-foreground">大卡/天</p>
                </div>
                <div>
                  <p class="text-lg font-bold">{{ weeklyAverages.protein }}g</p>
                  <p class="text-xs text-muted-foreground">蛋白质/天</p>
                </div>
                <div>
                  <p class="text-lg font-bold">{{ weeklyAverages.carbs }}g</p>
                  <p class="text-xs text-muted-foreground">碳水/天</p>
                </div>
                <div>
                  <p class="text-lg font-bold">{{ weeklyAverages.fat }}g</p>
                  <p class="text-xs text-muted-foreground">脂肪/天</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 购物清单 -->
          <div class="bg-card rounded-lg p-6 border">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart class="w-5 h-5 text-green-500" />
                购物清单
              </h2>
              <button @click="copyShoppingList" class="text-sm text-primary hover:underline">复制清单</button>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div
                v-for="(item, index) in shoppingList"
                :key="index"
                class="flex items-center gap-2 p-2 bg-muted rounded text-sm"
              >
                <CheckCircle class="w-4 h-4 text-green-500" />
                <span>{{ item.name }}</span>
                <span class="text-muted-foreground">x{{ item.amount }}</span>
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
import { useSeoMeta } from '#app'
import { Target, Sparkles, Utensils, CheckCircle, ShoppingCart } from 'lucide-vue-next'

const goal = ref('balanced')
const calories = ref(2000)
const mealsPerDay = ref(4)
const preferences = ref({
  lowCarb: false,
  highProtein: false,
  vegetarian: false,
  noGluten: false
})
const excludedFoods = ref('')
const selectedDay = ref(0)
const mealPlan = ref([])

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const proteinRatio = computed(() => {
  if (goal.value === 'muscle' || preferences.value.highProtein) return 35
  if (goal.value === 'fatloss' || preferences.value.lowCarb) return 35
  return 30
})

const carbsRatio = computed(() => {
  if (preferences.value.lowCarb) return 25
  return 40
})

const fatRatio = computed(() => {
  if (preferences.value.lowCarb) return 40
  if (goal.value === 'muscle') return 25
  return 30
})

const weeklyAverages = computed(() => {
  if (mealPlan.value.length === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  const total = mealPlan.value.reduce((acc, day) => ({
    calories: acc.calories + day.totalCalories,
    protein: acc.protein + day.totalProtein,
    carbs: acc.carbs + day.totalCarbs,
    fat: acc.fat + day.totalFat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  return {
    calories: Math.round(total.calories / 7),
    protein: Math.round(total.protein / 7),
    carbs: Math.round(total.carbs / 7),
    fat: Math.round(total.fat / 7)
  }
})

const shoppingList = computed(() => {
  if (mealPlan.value.length === 0) return []
  const list = {}
  mealPlan.value.forEach(day => {
    day.meals.forEach(meal => {
      meal.foods.forEach(food => {
        if (food.ingredient) {
          const key = food.ingredient
          list[key] = (list[key] || 0) + (food.quantity || 1)
        }
      })
    })
  })
  return Object.entries(list).map(([name, amount]) => ({ name, amount }))
})

const foodDatabase = {
  breakfast: [
    { name: '燕麦粥', foods: [{ name: '燕麦片', amount: '50g', ingredient: '燕麦片', quantity: 0.5 }, { name: '牛奶', amount: '250ml', ingredient: '牛奶', quantity: 1 }, { name: '香蕉', amount: '1根', ingredient: '香蕉', quantity: 1 }], calories: 350, protein: 15, carbs: 55, fat: 8 },
    { name: '鸡蛋吐司', foods: [{ name: '全麦吐司', amount: '2片', ingredient: '全麦面包', quantity: 0.1 }, { name: '鸡蛋', amount: '2个', ingredient: '鸡蛋', quantity: 2 }], calories: 380, protein: 22, carbs: 35, fat: 18 },
    { name: '酸奶果粒杯', foods: [{ name: '希腊酸奶', amount: '200g', ingredient: '酸奶', quantity: 1 }, { name: '蓝莓', amount: '50g', ingredient: '蓝莓', quantity: 0.05 }, { name: '坚果', amount: '20g', ingredient: '坚果', quantity: 0.02 }], calories: 280, protein: 18, carbs: 28, fat: 10 },
    { name: '蛋白质奶昔', foods: [{ name: '蛋白粉', amount: '1勺', ingredient: '蛋白粉', quantity: 0.03 }, { name: '香蕉', amount: '1根', ingredient: '香蕉', quantity: 1 }, { name: '杏仁奶', amount: '300ml', ingredient: '杏仁奶', quantity: 0.3 }], calories: 320, protein: 30, carbs: 40, fat: 8 }
  ],
  lunch: [
    { name: '鸡胸肉沙拉', foods: [{ name: '鸡胸肉', amount: '150g', ingredient: '鸡胸肉', quantity: 0.15 }, { name: '生菜', amount: '100g', ingredient: '生菜', quantity: 0.1 }, { name: '圣女果', amount: '50g', ingredient: '圣女果', quantity: 0.05 }], calories: 320, protein: 45, carbs: 12, fat: 10 },
    { name: '三文鱼糙米饭', foods: [{ name: '三文鱼', amount: '120g', ingredient: '三文鱼', quantity: 0.12 }, { name: '糙米饭', amount: '150g', ingredient: '糙米', quantity: 0.15 }, { name: '西兰花', amount: '100g', ingredient: '西兰花', quantity: 0.1 }], calories: 480, protein: 35, carbs: 45, fat: 18 },
    { name: '牛肉面', foods: [{ name: '瘦牛肉', amount: '100g', ingredient: '牛肉', quantity: 0.1 }, { name: '全麦面条', amount: '80g', ingredient: '全麦面条', quantity: 0.08 }, { name: '青菜', amount: '100g', ingredient: '青菜', quantity: 0.1 }], calories: 420, protein: 30, carbs: 50, fat: 12 },
    { name: '豆腐盖饭', foods: [{ name: '豆腐', amount: '150g', ingredient: '豆腐', quantity: 0.15 }, { name: '糙米饭', amount: '150g', ingredient: '糙米', quantity: 0.15 }, { name: '蘑菇', amount: '50g', ingredient: '蘑菇', quantity: 0.05 }], calories: 380, protein: 22, carbs: 48, fat: 12 }
  ],
  dinner: [
    { name: '清蒸鲈鱼', foods: [{ name: '鲈鱼', amount: '150g', ingredient: '鲈鱼', quantity: 0.15 }, { name: '蒸蛋羹', amount: '1份', ingredient: '鸡蛋', quantity: 1 }], calories: 280, protein: 40, carbs: 8, fat: 12 },
    { name: '虾仁炒饭', foods: [{ name: '虾仁', amount: '120g', ingredient: '虾仁', quantity: 0.12 }, { name: '糙米饭', amount: '150g', ingredient: '糙米', quantity: 0.15 }, { name: '豌豆', amount: '30g', ingredient: '豌豆', quantity: 0.03 }], calories: 420, protein: 32, carbs: 52, fat: 10 },
    { name: '牛排配蔬菜', foods: [{ name: '牛排', amount: '120g', ingredient: '牛排', quantity: 0.12 }, { name: '芦笋', amount: '100g', ingredient: '芦笋', quantity: 0.1 }, { name: '胡萝卜', amount: '80g', ingredient: '胡萝卜', quantity: 0.08 }], calories: 380, protein: 35, carbs: 15, fat: 20 },
    { name: '蔬菜炒鸡丁', foods: [{ name: '鸡胸肉', amount: '120g', ingredient: '鸡胸肉', quantity: 0.12 }, { name: '彩椒', amount: '100g', ingredient: '彩椒', quantity: 0.1 }, { name: '洋葱', amount: '50g', ingredient: '洋葱', quantity: 0.05 }], calories: 300, protein: 38, carbs: 18, fat: 10 }
  ],
  snack: [
    { name: '坚果酸奶', foods: [{ name: '希腊酸奶', amount: '150g', ingredient: '酸奶', quantity: 1 }, { name: '混合坚果', amount: '20g', ingredient: '坚果', quantity: 0.02 }], calories: 220, protein: 12, carbs: 15, fat: 12 },
    { name: '蛋白质棒', foods: [{ name: '蛋白质棒', amount: '1根', ingredient: '蛋白质棒', quantity: 1 }], calories: 200, protein: 20, carbs: 18, fat: 6 },
    { name: '水果沙拉', foods: [{ name: '苹果', amount: '1个', ingredient: '苹果', quantity: 1 }, { name: '蓝莓', amount: '50g', ingredient: '蓝莓', quantity: 0.05 }], calories: 120, protein: 1, carbs: 30, fat: 0 },
    { name: '全麦饼干', foods: [{ name: '全麦饼干', amount: '3片', ingredient: '全麦饼干', quantity: 3 }], calories: 150, protein: 3, carbs: 22, fat: 6 }
  ]
}

function generateMealPlan() {
  mealPlan.value = []

  for (let i = 0; i < 7; i++) {
    const dayMeals = []

    // 早餐
    const breakfast = foodDatabase.breakfast[Math.floor(Math.random() * foodDatabase.breakfast.length)]
    dayMeals.push({ ...breakfast, name: '早餐' })

    // 午餐
    const lunch = foodDatabase.lunch[Math.floor(Math.random() * foodDatabase.lunch.length)]
    dayMeals.push({ ...lunch, name: '午餐' })

    // 晚餐
    const dinner = foodDatabase.dinner[Math.floor(Math.random() * foodDatabase.dinner.length)]
    dayMeals.push({ ...dinner, name: '晚餐' })

    // 加餐
    if (mealsPerDay.value >= 4) {
      const snack1 = foodDatabase.snack[Math.floor(Math.random() * foodDatabase.snack.length)]
      dayMeals.push({ ...snack1, name: '上午加餐' })
    }
    if (mealsPerDay.value >= 5) {
      const snack2 = foodDatabase.snack[Math.floor(Math.random() * foodDatabase.snack.length)]
      dayMeals.push({ ...snack2, name: '下午加餐' })
    }

    // 计算每日总计
    const totalCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0)
    const totalProtein = dayMeals.reduce((sum, meal) => sum + meal.protein, 0)
    const totalCarbs = dayMeals.reduce((sum, meal) => sum + meal.carbs, 0)
    const totalFat = dayMeals.reduce((sum, meal) => sum + meal.fat, 0)

    // 调整份量以匹配目标热量
    const ratio = calories.value / totalCalories

    mealPlan.value.push({
      meals: dayMeals.map(meal => ({
        ...meal,
        calories: Math.round(meal.calories * ratio),
        protein: Math.round(meal.protein * ratio),
        carbs: Math.round(meal.carbs * ratio),
        fat: Math.round(meal.fat * ratio)
      })),
      totalCalories: Math.round(totalCalories * ratio),
      totalProtein: Math.round(totalProtein * ratio),
      totalCarbs: Math.round(totalCarbs * ratio),
      totalFat: Math.round(totalFat * ratio)
    })
  }
}

function copyShoppingList() {
  const text = shoppingList.value.map(item => `${item.name} x${item.amount}`).join('\n')
  navigator.clipboard.writeText(text)
  alert('购物清单已复制到剪贴板')
}

useSeoMeta({
  title: '一周食谱规划 - 在线健康膳食计划生成器',
  description: '免费在线一周食谱规划工具，智能生成健康的一周食谱，支持增肌、减脂、均衡饮食等多种目标，自动生成购物清单。', keywords: ['食谱规划', '一周食谱', '膳食计划', '营养搭配', '增肌食谱', '减脂食谱', '健康饮食', '购物清单', '在线工具']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('一周食谱规划')
</script>
