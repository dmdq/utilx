<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">营养需求计算器</h1>
      <p class="text-muted-foreground mb-6">计算每日营养素需求，蛋白质、碳水化合物、脂肪需求，维生素和矿物质基础需求</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：基础信息输入 -->
      <div class="space-y-6">
        <!-- 个人信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">个人信息</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">性别</label>
                <select v-model="userInfo.gender" class="w-full px-3 py-2 border rounded-lg">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">年龄</label>
                <input
                  v-model.number="userInfo.age"
                  type="number"
                  min="1"
                  max="120"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">身高 (cm)</label>
                <input
                  v-model.number="userInfo.height"
                  type="number"
                  min="100"
                  max="250"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="170"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">体重 (kg)</label>
                <input
                  v-model.number="userInfo.weight"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="65"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">活动水平</label>
              <select v-model="userInfo.activityLevel" class="w-full px-3 py-2 border rounded-lg">
                <option value="sedentary">久坐（很少运动）</option>
                <option value="light">轻度活动（每周1-3次）</option>
                <option value="moderate">中度活动（每周3-5次）</option>
                <option value="active">高度活动（每周6-7次）</option>
                <option value="very-active">极高度活动（专业训练）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 目标设定 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">目标设定</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">健身目标</label>
              <select v-model="fitnessGoal.goal" class="w-full px-3 py-2 border rounded-lg">
                <option value="maintain">维持体重</option>
                <option value="lose-fat">减脂</option>
                <option value="gain-muscle">增肌</option>
                <option value="gain-weight">增重</option>
                <option value="endurance">提升耐力</option>
                <option value="strength">提升力量</option>
              </select>
            </div>

            <div v-if="fitnessGoal.goal !== 'maintain'">
              <label class="block text-sm font-medium mb-2">目标变化量 (kg/月)</label>
              <input
                v-model.number="fitnessGoal.targetChange"
                type="number"
                min="-5"
                max="5"
                step="0.5"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="1"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">饮食偏好</label>
              <select v-model="fitnessGoal.dietPreference" class="w-full px-3 py-2 border rounded-lg">
                <option value="balanced">均衡饮食</option>
                <option value="low-carb">低碳水化合物</option>
                <option value="high-protein">高蛋白</option>
                <option value="low-fat">低脂肪</option>
                <option value="vegetarian">素食</option>
                <option value="keto">生酮饮食</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 特殊需求 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">特殊需求</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="specialNeeds.pregnancy"
                type="checkbox"
                class="mr-2"
                :disabled="userInfo.gender === 'male'"
              />
              <span class="text-sm">怀孕/哺乳期</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="specialNeeds.elderly"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">老年人（≥65岁）</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="specialNeeds.athlete"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">专业运动员</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="specialNeeds.recovery"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">术后/康复期</span>
            </label>
          </div>

          <button @click="calculateNutrition" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 mt-4">
            计算营养需求
          </button>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 每日热量需求 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">每日热量需求</h3>
          <div v-if="results.totalCalories > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-5xl font-bold text-orange-600 mb-2">
                {{ results.totalCalories }}
              </div>
              <div class="text-lg text-muted-foreground">千卡/天</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-orange-50 rounded-lg">
                <div class="text-lg font-semibold text-orange-600">{{ results.bmr }}</div>
                <div class="text-xs text-muted-foreground">基础代谢率</div>
              </div>
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-lg font-semibold text-blue-600">{{ results.tdee }}</div>
                <div class="text-xs text-muted-foreground">总能量消耗</div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入信息后计算营养需求
          </div>
        </div>

        <!-- 宏量营养素分配 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">宏量营养素需求</h3>
          <div v-if="results.protein > 0" class="space-y-4">
            <!-- 蛋白质 -->
            <div>
              <div class="flex justify-between text-sm mb-2">
                <span class="font-medium">蛋白质</span>
                <span>{{ results.protein }}g ({{ results.proteinCalories }}千卡)</span>
              </div>
              <div class="w-full bg-muted rounded-full h-3">
                <div class="bg-red-500 h-3 rounded-full" :style="{ width: `${(results.proteinCalories / results.totalCalories) * 100}%` }"></div>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ Math.round((results.proteinCalories / results.totalCalories) * 100) }}% 总热量
              </div>
            </div>

            <!-- 碳水化合物 -->
            <div>
              <div class="flex justify-between text-sm mb-2">
                <span class="font-medium">碳水化合物</span>
                <span>{{ results.carbs }}g ({{ results.carbsCalories }}千卡)</span>
              </div>
              <div class="w-full bg-muted rounded-full h-3">
                <div class="bg-yellow-500 h-3 rounded-full" :style="{ width: `${(results.carbsCalories / results.totalCalories) * 100}%` }"></div>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ Math.round((results.carbsCalories / results.totalCalories) * 100) }}% 总热量
              </div>
            </div>

            <!-- 脂肪 -->
            <div>
              <div class="flex justify-between text-sm mb-2">
                <span class="font-medium">脂肪</span>
                <span>{{ results.fat }}g ({{ results.fatCalories }}千卡)</span>
              </div>
              <div class="w-full bg-muted rounded-full h-3">
                <div class="bg-green-500 h-3 rounded-full" :style="{ width: `${(results.fatCalories / results.totalCalories) * 100}%` }"></div>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ Math.round((results.fatCalories / results.totalCalories) * 100) }}% 总热量
              </div>
            </div>
          </div>
        </div>

        <!-- 微量营养素需求 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">主要微量营养素需求</h3>
          <div v-if="results.vitamins.length > 0" class="grid grid-cols-2 gap-4">
            <div v-for="vitamin in results.vitamins" :key="vitamin.name"
                 class="p-3 bg-purple-50 rounded-lg">
              <div class="font-medium text-sm">{{ vitamin.name }}</div>
              <div class="text-lg font-semibold text-purple-600">{{ vitamin.amount }}</div>
              <div class="text-xs text-muted-foreground">{{ vitamin.unit }}</div>
            </div>
          </div>
        </div>

        <!-- 矿物质需求 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">主要矿物质需求</h3>
          <div v-if="results.minerals.length > 0" class="grid grid-cols-2 gap-4">
            <div v-for="mineral in results.minerals" :key="mineral.name"
                 class="p-3 bg-cyan-50 rounded-lg">
              <div class="font-medium text-sm">{{ mineral.name }}</div>
              <div class="text-lg font-semibold text-cyan-600">{{ mineral.amount }}</div>
              <div class="text-xs text-muted-foreground">{{ mineral.unit }}</div>
            </div>
          </div>
        </div>

        <!-- 食物建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">食物建议</h3>
          <div v-if="foodRecommendations.length > 0" class="space-y-2">
            <div v-for="food in foodRecommendations" :key="food.category"
                 class="p-3 bg-green-50 rounded-lg">
              <div class="font-medium text-sm text-green-800">{{ food.category }}</div>
              <div class="text-xs text-green-700 mt-1">{{ food.recommendation }}</div>
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
setPageTitle('营养需求计算器')

// 用户信息
const userInfo = ref({
  gender: 'male',
  age: 30,
  height: 170,
  weight: 65,
  activityLevel: 'moderate'
})

// 健身目标
const fitnessGoal = ref({
  goal: 'maintain',
  targetChange: 1,
  dietPreference: 'balanced'
})

// 特殊需求
const specialNeeds = ref({
  pregnancy: false,
  elderly: false,
  athlete: false,
  recovery: false
})

// 计算结果
const results = ref({
  totalCalories: 0,
  bmr: 0,
  tdee: 0,
  protein: 0,
  proteinCalories: 0,
  carbs: 0,
  carbsCalories: 0,
  fat: 0,
  fatCalories: 0,
  vitamins: [],
  minerals: []
})

// 食物建议
const foodRecommendations = computed(() => {
  if (results.value.totalCalories === 0) return []

  const recommendations = []

  if (fitnessGoal.value.goal === 'gain-muscle') {
    recommendations.push({
      category: '蛋白质来源',
      recommendation: '瘦肉、鱼类、蛋类、豆制品、乳制品，每日1.2-1.6g/kg体重'
    })
  } else if (fitnessGoal.value.goal === 'lose-fat') {
    recommendations.push({
      category: '蛋白质来源',
      recommendation: '选择瘦肉、鱼类、豆制品等低脂蛋白质，每日1.2-1.4g/kg体重'
    })
  }

  recommendations.push({
    category: '碳水化合物',
    recommendation: fitnessGoal.value.dietPreference === 'low-carb' ?
      '选择全谷物、蔬菜、低糖水果，控制在总热量的30-40%' :
      '全谷物、薯类、豆类、水果，占总热量的45-65%'
  })

  recommendations.push({
    category: '健康脂肪',
    recommendation: '橄榄油、坚果、鱼类、牛油果，占总热量的20-35%'
  })

  recommendations.push({
    category: '维生素来源',
    recommendation: '多样化蔬菜水果，深色蔬菜优先，每日5-7份'
  })

  return recommendations
})

// 计算营养需求
const calculateNutrition = () => {
  const { gender, age, height, weight, activityLevel } = userInfo.value
  const { goal, targetChange, dietPreference } = fitnessGoal.value

  // 计算基础代谢率 (Mifflin-St Jeor公式)
  const bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161

  // 活动系数
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9
  }

  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2)

  // 根据目标调整热量
  let totalCalories = tdee
  if (goal === 'lose-fat') {
    totalCalories = tdee - (targetChange * 1000 * 30 / 7) // 每月减重，每天减少的热量
  } else if (goal === 'gain-muscle' || goal === 'gain-weight') {
    totalCalories = tdee + (targetChange * 1000 * 30 / 7) // 每月增重，每天增加的热量
  }

  // 确保热量不低于基础代谢率的80%
  totalCalories = Math.max(totalCalories, bmr * 0.8)

  // 根据饮食偏好调整宏量营养素比例
  let proteinRatio = 0.25
  let carbRatio = 0.45
  let fatRatio = 0.30

  switch (dietPreference) {
    case 'high-protein':
      proteinRatio = 0.35
      carbRatio = 0.35
      fatRatio = 0.30
      break
    case 'low-carb':
      proteinRatio = 0.35
      carbRatio = 0.20
      fatRatio = 0.45
      break
    case 'low-fat':
      proteinRatio = 0.25
      carbRatio = 0.65
      fatRatio = 0.10
      break
    case 'keto':
      proteinRatio = 0.25
      carbRatio = 0.05
      fatRatio = 0.70
      break
  }

  // 根据健身目标调整蛋白质需求
  if (goal === 'gain-muscle') {
    proteinRatio = Math.max(proteinRatio, 0.30)
  } else if (goal === 'lose-fat') {
    proteinRatio = Math.max(proteinRatio, 0.30)
  }

  // 特殊需求调整
  if (specialNeeds.value.pregnancy) {
    totalCalories += 300
    proteinRatio += 0.05
  }

  if (specialNeeds.value.athlete) {
    proteinRatio += 0.10
  }

  // 计算宏量营养素
  const proteinCalories = Math.round(totalCalories * proteinRatio)
  const carbsCalories = Math.round(totalCalories * carbRatio)
  const fatCalories = Math.round(totalCalories * fatRatio)

  const protein = Math.round(proteinCalories / 4) // 蛋白质4kcal/g
  const carbs = Math.round(carbsCalories / 4) // 碳水化合物4kcal/g
  const fat = Math.round(fatCalories / 9) // 脂肪9kcal/g

  // 主要维生素需求
  const vitamins = [
    { name: '维生素C', amount: 90, unit: 'mg' },
    { name: '维生素D', amount: 15, unit: 'μg' },
    { name: '维生素E', amount: 15, unit: 'mg' },
    { name: '维生素K', amount: 120, unit: 'μg' },
    { name: '维生素B1', amount: 1.2, unit: 'mg' },
    { name: '维生素B2', amount: 1.3, unit: 'mg' },
    { name: '维生素B6', amount: 1.7, unit: 'mg' },
    { name: '维生素B12', amount: 2.4, unit: 'μg' },
    { name: '叶酸', amount: 400, unit: 'μg' }
  ]

  // 主要矿物质需求
  const minerals = [
    { name: '钙', amount: 1000, unit: 'mg' },
    { name: '铁', amount: gender === 'male' ? 8 : 18, unit: 'mg' },
    { name: '镁', amount: 420, unit: 'mg' },
    { name: '锌', amount: gender === 'male' ? 11 : 8, unit: 'mg' },
    { name: '钾', amount: 3500, unit: 'mg' },
    { name: '钠', amount: 2300, unit: 'mg' }
  ]

  // 特殊需求调整
  if (specialNeeds.value.elderly) {
    vitamins.find(v => v.name === '维生素D').amount = 20
    minerals.find(m => m.name === '钙').amount = 1200
  }

  if (specialNeeds.value.pregnancy) {
    vitamins.find(v => v.name === '叶酸').amount = 600
    minerals.find(m => m.name === '铁').amount = 27
    minerals.find(m => m.name === '钙').amount = 1300
  }

  results.value = {
    totalCalories: Math.round(totalCalories),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    protein,
    proteinCalories,
    carbs,
    carbsCalories,
    fat,
    fatCalories,
    vitamins,
    minerals
  }
}
</script>

<style scoped>
input[type="number"],
select {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="number"]:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>