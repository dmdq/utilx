<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">基础代谢率计算器</h1>
      <p class="text-muted-foreground mb-6">计算基础代谢率(BMR)和每日总能量消耗(TDEE)，制定科学的体重管理计划</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：基础信息输入 -->
      <div class="space-y-6">
        <!-- 基本信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">基本信息</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">性别</label>
                <div class="flex gap-4">
                  <label class="flex items-center">
                    <input
                      v-model="basicInfo.gender"
                      type="radio"
                      value="male"
                      class="mr-2"
                    />
                    男性
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="basicInfo.gender"
                      type="radio"
                      value="female"
                      class="mr-2"
                    />
                    女性
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">年龄</label>
                <input
                  v-model.number="basicInfo.age"
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
                  v-model.number="basicInfo.height"
                  type="number"
                  min="50"
                  max="250"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="170"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">体重 (kg)</label>
                <input
                  v-model.number="basicInfo.weight"
                  type="number"
                  min="10"
                  max="300"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="65"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">计算公式</label>
              <select v-model="selectedFormula" class="w-full px-3 py-2 border rounded-lg">
                <option value="mifflin">Mifflin-St Jeor公式（推荐）</option>
                <option value="harris">Harris-Benedict公式（经典）</option>
                <option value="both">两种公式对比</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 活动水平 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">活动水平</h3>
          <div class="space-y-3">
            <label v-for="level in activityLevels" :key="level.value"
                   class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-secondary/50"
                   :class="activityLevel === level.value ? 'border-primary bg-primary/5' : ''">
              <input
                v-model="activityLevel"
                type="radio"
                :value="level.value"
                class="mt-1 mr-3"
              />
              <div class="flex-1">
                <div class="font-medium">{{ level.name }}</div>
                <div class="text-sm text-muted-foreground">{{ level.description }}</div>
                <div class="text-xs text-primary mt-1">活动系数: {{ level.multiplier }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- 目标设定 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">体重管理目标</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">目标</label>
              <select v-model="weightGoal" class="w-full px-3 py-2 border rounded-lg">
                <option value="lose-fat-quick">快速减脂（每周减0.75kg）</option>
                <option value="lose-fat-slow">缓慢减脂（每周减0.5kg）</option>
                <option value="lose-fat-maintain">温和减脂（每周减0.25kg）</option>
                <option value="maintain">维持体重</option>
                <option value="gain-muscle-slow">缓慢增肌（每周增0.25kg）</option>
                <option value="gain-muscle-quick">快速增肌（每周增0.5kg）</option>
              </select>
            </div>

            <button @click="calculateTDEE" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              计算代谢率和热量需求
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 基础代谢率结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">基础代谢率 (BMR)</h3>
          <div v-if="results.bmr > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-4xl font-bold text-primary mb-2">
                {{ results.bmr }} kcal
              </div>
              <div class="text-sm text-muted-foreground">每日基础消耗</div>
            </div>

            <!-- 公式对比 -->
            <div v-if="selectedFormula === 'both'" class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-secondary rounded">
                <div class="text-xs text-muted-foreground mb-1">Mifflin-St Jeor</div>
                <div class="text-lg font-semibold">{{ results.mifflinBMR }} kcal</div>
              </div>
              <div class="p-3 bg-secondary rounded">
                <div class="text-xs text-muted-foreground mb-1">Harris-Benedict</div>
                <div class="text-lg font-semibold">{{ results.harrisBMR }} kcal</div>
              </div>
            </div>

            <div class="p-3 bg-blue-50 rounded-lg">
              <div class="text-sm text-blue-800">
                <strong>基础代谢率说明：</strong>这是身体在完全静息状态下维持基本生理功能所需的最低热量。
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入数据后计算基础代谢率
          </div>
        </div>

        <!-- 总能量消耗 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">每日总能量消耗 (TDEE)</h3>
          <div v-if="results.tdee > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-4xl font-bold text-green-600 mb-2">
                {{ results.tdee }} kcal
              </div>
              <div class="text-sm text-muted-foreground">每日总消耗热量</div>
            </div>

            <!-- TDEE组成 -->
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>基础代谢率</span>
                  <span>{{ results.bmr }} kcal</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-blue-500 h-2 rounded-full" :style="{ width: `${Math.round(results.bmr / results.tdee * 100)}%` }"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>日常活动消耗</span>
                  <span>{{ Math.round(results.tdee - results.bmr) }} kcal</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" :style="{ width: `${Math.round((results.tdee - results.bmr) / results.tdee * 100)}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 热量建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">每日热量摄入建议</h3>
          <div v-if="results.targetCalories > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-4xl font-bold" :class="getTargetCaloriesClass()">
                {{ results.targetCalories }} kcal
              </div>
              <div class="text-sm text-muted-foreground">{{ getGoalDescription() }}</div>
            </div>

            <!-- 营养素分配 -->
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>蛋白质 ({{ proteinPercentage }}%)</span>
                  <span>{{ results.protein }}g ({{ results.proteinCalories }}kcal)</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-red-500 h-2 rounded-full" :style="{ width: `${proteinPercentage}%` }"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>碳水化合物 ({{ carbPercentage }}%)</span>
                  <span>{{ results.carbs }}g ({{ results.carbsCalories }}kcal)</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-yellow-500 h-2 rounded-full" :style="{ width: `${carbPercentage}%` }"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>脂肪 ({{ fatPercentage }}%)</span>
                  <span>{{ results.fat }}g ({{ results.fatCalories }}kcal)</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" :style="{ width: `${fatPercentage}%` }"></div>
                </div>
              </div>
            </div>

            <!-- 预期结果 -->
            <div class="p-3 bg-secondary rounded">
              <div class="text-sm font-medium mb-1">预期效果</div>
              <div class="text-xs text-muted-foreground">
                每周{{ getWeeklyChange() }}，预计{{ getTimeToGoal() }}
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
setPageTitle('基础代谢率计算器')

// 基本信息
const basicInfo = ref({
  gender: 'male',
  age: 30,
  height: 170,
  weight: 65
})

// 计算公式
const selectedFormula = ref('mifflin')

// 活动水平
const activityLevel = ref('light')

// 体重目标
const weightGoal = ref('maintain')

// 活动水平选项
const activityLevels = [
  { value: 'sedentary', name: '久坐不动', description: '很少或没有运动，办公室工作', multiplier: 1.2 },
  { value: 'light', name: '轻度活动', description: '每周运动1-3天，轻度运动', multiplier: 1.375 },
  { value: 'moderate', name: '中度活动', description: '每周运动3-5天，中等强度运动', multiplier: 1.55 },
  { value: 'active', name: '高度活动', description: '每周运动6-7天，高强度运动', multiplier: 1.725 },
  { value: 'very-active', name: '极高度活动', description: '每天运动，体力劳动者或运动员', multiplier: 1.9 }
]

// 计算结果
const results = ref({
  bmr: 0,
  tdee: 0,
  mifflinBMR: 0,
  harrisBMR: 0,
  targetCalories: 0,
  protein: 0,
  proteinCalories: 0,
  carbs: 0,
  carbsCalories: 0,
  fat: 0,
  fatCalories: 0
})

// 营养素百分比
const proteinPercentage = computed(() => Math.round(results.value.proteinCalories / results.value.targetCalories * 100))
const carbPercentage = computed(() => Math.round(results.value.carbsCalories / results.value.targetCalories * 100))
const fatPercentage = computed(() => Math.round(results.value.fatCalories / results.value.targetCalories * 100))

// 计算TDEE
const calculateTDEE = () => {
  const { gender, age, height, weight } = basicInfo.value
  const activityMultiplier = activityLevels.find(level => level.value === activityLevel.value)?.multiplier || 1.2

  // Mifflin-St Jeor公式
  const mifflinBMR = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161

  // Harris-Benedict公式
  const harrisBMR = gender === 'male'
    ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)

  let bmr = mifflinBMR
  if (selectedFormula.value === 'harris') {
    bmr = harrisBMR
  } else if (selectedFormula.value === 'both') {
    bmr = Math.round((mifflinBMR + harrisBMR) / 2)
  }

  const tdee = Math.round(bmr * activityMultiplier)

  // 根据目标调整热量
  let targetCalories = tdee
  let proteinRatio = 0.25 // 蛋白质占总热量的25%
  let carbRatio = 0.45   // 碳水化合物占总热量的45%
  let fatRatio = 0.30    // 脂肪占总热量的30%

  // 根据目标调整热量和营养素比例
  switch (weightGoal.value) {
    case 'lose-fat-quick':
      targetCalories = tdee - 750 // 每天减少750kcal
      proteinRatio = 0.30 // 减脂期增加蛋白质比例
      carbRatio = 0.40
      fatRatio = 0.30
      break
    case 'lose-fat-slow':
      targetCalories = tdee - 500 // 每天减少500kcal
      proteinRatio = 0.30
      carbRatio = 0.40
      fatRatio = 0.30
      break
    case 'lose-fat-maintain':
      targetCalories = tdee - 250 // 每天减少250kcal
      proteinRatio = 0.28
      carbRatio = 0.42
      fatRatio = 0.30
      break
    case 'gain-muscle-slow':
      targetCalories = tdee + 250 // 每天增加250kcal
      proteinRatio = 0.28
      carbRatio = 0.45
      fatRatio = 0.27
      break
    case 'gain-muscle-quick':
      targetCalories = tdee + 500 // 每天增加500kcal
      proteinRatio = 0.30
      carbRatio = 0.45
      fatRatio = 0.25
      break
  }

  // 确保目标热量不低于基础代谢率的80%
  targetCalories = Math.max(targetCalories, Math.round(bmr * 0.8))

  // 计算营养素
  const proteinCalories = Math.round(targetCalories * proteinRatio)
  const carbsCalories = Math.round(targetCalories * carbRatio)
  const fatCalories = Math.round(targetCalories * fatRatio)

  results.value = {
    bmr: Math.round(bmr),
    tdee,
    mifflinBMR: Math.round(mifflinBMR),
    harrisBMR: Math.round(harrisBMR),
    targetCalories,
    protein: Math.round(proteinCalories / 4), // 蛋白质每克4kcal
    proteinCalories,
    carbs: Math.round(carbsCalories / 4), // 碳水化合物每克4kcal
    carbsCalories,
    fat: Math.round(fatCalories / 9), // 脂肪每克9kcal
    fatCalories
  }
}

// 获取目标热量样式
const getTargetCaloriesClass = () => {
  if (weightGoal.value.includes('lose')) return 'text-orange-600'
  if (weightGoal.value.includes('gain')) return 'text-green-600'
  return 'text-blue-600'
}

// 获取目标描述
const getGoalDescription = () => {
  switch (weightGoal.value) {
    case 'lose-fat-quick': return '快速减脂期摄入热量'
    case 'lose-fat-slow': return '缓慢减脂期摄入热量'
    case 'lose-fat-maintain': return '温和减脂期摄入热量'
    case 'maintain': return '维持体重摄入热量'
    case 'gain-muscle-slow': return '缓慢增肌期摄入热量'
    case 'gain-muscle-quick': return '快速增肌期摄入热量'
    default: return '每日建议摄入热量'
  }
}

// 获取每周变化
const getWeeklyChange = () => {
  switch (weightGoal.value) {
    case 'lose-fat-quick': return '减少0.75kg'
    case 'lose-fat-slow': return '减少0.5kg'
    case 'lose-fat-maintain': return '减少0.25kg'
    case 'maintain': return '保持体重'
    case 'gain-muscle-slow': return '增加0.25kg'
    case 'gain-muscle-quick': return '增加0.5kg'
    default: return '保持体重'
  }
}

// 获取达到目标时间
const getTimeToGoal = () => {
  if (weightGoal.value === 'maintain') return '维持当前状态'

  // 简单估算，假设目标是变化5kg
  const weeksToGoal = {
    'lose-fat-quick': 7, // 5kg / 0.75kg per week
    'lose-fat-slow': 10, // 5kg / 0.5kg per week
    'lose-fat-maintain': 20, // 5kg / 0.25kg per week
    'gain-muscle-slow': 20, // 5kg / 0.25kg per week
    'gain-muscle-quick': 10  // 5kg / 0.5kg per week
  }

  return `约${weeksToGoal[weightGoal.value]}周达到理想状态`
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