<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">水分摄入计算器</h1>
      <p class="text-muted-foreground mb-6">计算每日建议水分摄入量，不同饮品含水量换算，制定饮水计划</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：个人信息输入 -->
      <div class="space-y-6">
        <!-- 基本信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">个人信息</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">性别</label>
                <select v-model="personalInfo.gender" class="w-full px-3 py-2 border rounded-lg">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">年龄</label>
                <input
                  v-model.number="personalInfo.age"
                  type="number"
                  min="1"
                  max="120"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">体重 (kg)</label>
                <input
                  v-model.number="personalInfo.weight"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="70"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">身高 (cm)</label>
                <input
                  v-model.number="personalInfo.height"
                  type="number"
                  min="100"
                  max="250"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="175"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">活动水平</label>
              <select v-model="personalInfo.activityLevel" class="w-full px-3 py-2 border rounded-lg">
                <option value="sedentary">久坐（很少运动）</option>
                <option value="light">轻度活动（每周1-3次轻度运动）</option>
                <option value="moderate">中度活动（每周3-5次中等运动）</option>
                <option value="active">高度活动（每周6-7次运动）</option>
                <option value="very-active">极高度活动（专业运动员或体力劳动）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 环境因素 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">环境因素</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">气候环境</label>
              <select v-model="environment.climate" class="w-full px-3 py-2 border rounded-lg">
                <option value="moderate">温和气候</option>
                <option value="hot">炎热气候</option>
                <option value="cold">寒冷气候</option>
                <option value="dry">干燥气候</option>
                <option value="humid">潮湿气候</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">室内外</label>
                <select v-model="environment.location" class="w-full px-3 py-2 border rounded-lg">
                  <option value="indoor">室内工作</option>
                  <option value="outdoor">户外工作</option>
                  <option value="mixed">室内外混合</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">海拔高度</label>
                <select v-model="environment.altitude" class="w-full px-3 py-2 border rounded-lg">
                  <option value="low">低海拔（<1000米）</option>
                  <option value="medium">中等海拔（1000-2500米）</option>
                  <option value="high">高海拔（>2500米）</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">特殊状况</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="specialConditions.pregnancy"
                    type="checkbox"
                    class="mr-2"
                    :disabled="personalInfo.gender === 'male'"
                  />
                  <span class="text-sm">怀孕/哺乳期</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="specialConditions.illness"
                    type="checkbox"
                    class="mr-2"
                  />
                  <span class="text-sm">发烧/生病</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="specialConditions.medication"
                    type="checkbox"
                    class="mr-2"
                  />
                  <span class="text-sm">服用利尿剂</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button @click="calculateWaterIntake" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          计算水分需求
        </button>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 水分需求结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">每日水分需求</h3>
          <div v-if="results.totalIntake > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-5xl font-bold text-blue-600 mb-2">
                {{ results.totalIntake }}
              </div>
              <div class="text-lg text-muted-foreground">毫升/天</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-2xl font-semibold text-blue-600">{{ Math.round(results.totalIntake / 250) }}</div>
                <div class="text-xs text-muted-foreground">杯数 (250ml/杯)</div>
              </div>
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <div class="text-2xl font-semibold text-green-600">{{ Math.round(results.totalIntake / 1000 * 10) / 10 }}</div>
                <div class="text-xs text-muted-foreground">升</div>
              </div>
            </div>

            <!-- 水分来源分析 -->
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span>直接饮水</span>
                <span>{{ results.directWater }} ml ({{ Math.round(results.directWater / results.totalIntake * 100) }}%)</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>食物含水</span>
                <span>{{ results.foodWater }} ml ({{ Math.round(results.foodWater / results.totalIntake * 100) }}%)</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>新陈代谢水</span>
                <span>{{ results.metabolismWater }} ml ({{ Math.round(results.metabolismWater / results.totalIntake * 100) }}%)</span>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入信息后计算水分需求
          </div>
        </div>

        <!-- 饮水计划 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">建议饮水计划</h3>
          <div v-if="results.schedule.length > 0" class="space-y-3">
            <div v-for="schedule in results.schedule" :key="schedule.time"
                 class="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div>
                <div class="font-medium text-sm">{{ schedule.time }}</div>
                <div class="text-xs text-muted-foreground">{{ schedule.description }}</div>
              </div>
              <div class="text-right">
                <div class="font-semibold">{{ schedule.amount }} ml</div>
                <div class="text-xs text-muted-foreground">{{ schedule.glasses }} 杯</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 饮品含水量换算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">饮品含水量换算</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">选择饮品类型</label>
              <select v-model="beverageCalculator.type" class="w-full px-3 py-2 border rounded-lg">
                <option value="water">纯净水 (100%)</option>
                <option value="coffee">黑咖啡 (99.5%)</option>
                <option value="tea">茶 (99.5%)</option>
                <option value="milk">牛奶 (87%)</option>
                <option value="juice">果汁 (85%)</option>
                <option value="soup">汤羹 (95%)</option>
                <option value="sports">运动饮料 (95%)</option>
                <option value="soda">碳酸饮料 (90%)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">饮品容量 (ml)</label>
              <input
                v-model.number="beverageCalculator.volume"
                type="number"
                min="0"
                max="2000"
                step="10"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="250"
              />
            </div>

            <div v-if="beverageCalculator.waterContent > 0" class="p-3 bg-blue-50 rounded-lg">
              <div class="text-sm text-blue-800">
                <strong>含水量：</strong>{{ beverageCalculator.waterContent }} ml
                <span class="text-xs ml-2">相当于 {{ Math.round(beverageCalculator.waterContent / 250 * 10) / 10 }} 杯水</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康提示 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">健康提示</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>起床后立即饮水300-500ml，激活身体机能</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>餐前30分钟饮水有助于消化，但避免过量</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>运动前、中、后都要及时补充水分</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>观察尿液颜色，淡黄色表示水分充足</span>
            </div>
            <div class="flex items-start">
              <span class="text-red-600 mr-2">⚠️</span>
              <span>不要等到口渴才喝水，口渴时身体已经缺水</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('水分摄入计算器')

// 个人信息
const personalInfo = ref({
  gender: 'male',
  age: 30,
  weight: 70,
  height: 175,
  activityLevel: 'moderate'
})

// 环境因素
const environment = ref({
  climate: 'moderate',
  location: 'indoor',
  altitude: 'low'
})

// 特殊状况
const specialConditions = ref({
  pregnancy: false,
  illness: false,
  medication: false
})

// 饮品计算器
const beverageCalculator = ref({
  type: 'water',
  volume: 250
})

// 饮品含水量比例
const beverageWaterContent = {
  water: 1.0,
  coffee: 0.995,
  tea: 0.995,
  milk: 0.87,
  juice: 0.85,
  soup: 0.95,
  sports: 0.95,
  soda: 0.90
}

// 计算结果
const results = ref({
  totalIntake: 0,
  directWater: 0,
  foodWater: 0,
  metabolismWater: 0,
  schedule: []
})

// 计算饮品含水量
const calculateBeverageWater = () => {
  const percentage = beverageWaterContent[beverageCalculator.value.type] || 1.0
  return Math.round(beverageCalculator.value.volume * percentage)
}

// 监听饮品计算器变化
watch(() => beverageCalculator.value.volume, () => {
  beverageCalculator.value.waterContent = calculateBeverageWater()
})

watch(() => beverageCalculator.value.type, () => {
  beverageCalculator.value.waterContent = calculateBeverageWater()
})

// 计算水分需求
const calculateWaterIntake = () => {
  const { gender, age, weight, activityLevel } = personalInfo.value
  const { climate, location, altitude } = environment.value
  const { pregnancy, illness, medication } = specialConditions.value

  // 基础水分需求 (按体重计算)
  let baseWater = weight * 30 // ml/kg

  // 性别调整
  if (gender === 'male') {
    baseWater *= 1.1
  } else {
    baseWater *= 0.95
  }

  // 年龄调整
  if (age > 60) {
    baseWater *= 0.9
  } else if (age < 18) {
    baseWater *= 1.1
  }

  // 活动水平调整
  const activityMultipliers = {
    sedentary: 1.0,
    light: 1.1,
    moderate: 1.2,
    active: 1.3,
    'very-active': 1.4
  }
  baseWater *= activityMultipliers[activityLevel] || 1.0

  // 环境因素调整
  if (climate === 'hot' || climate === 'dry') {
    baseWater *= 1.2
  } else if (climate === 'humid') {
    baseWater *= 1.1
  }

  if (location === 'outdoor') {
    baseWater *= 1.15
  }

  if (altitude === 'high') {
    baseWater *= 1.1
  }

  // 特殊状况调整
  if (pregnancy) {
    baseWater += 300 // ml
  } else if (specialConditions.value.breastfeeding) {
    baseWater += 700 // ml
  }

  if (illness) {
    baseWater += 500 // ml
  }

  if (medication) {
    baseWater += 200 // ml
  }

  // 计算各部分水分
  const totalIntake = Math.round(baseWater)
  const directWater = Math.round(totalIntake * 0.8) // 80%来自直接饮水
  const foodWater = Math.round(totalIntake * 0.15) // 15%来自食物
  const metabolismWater = Math.round(totalIntake * 0.05) // 5%来自新陈代谢

  // 生成饮水计划
  const schedule = generateWaterSchedule(directWater)

  results.value = {
    totalIntake,
    directWater,
    foodWater,
    metabolismWater,
    schedule
  }
}

// 生成饮水计划
const generateWaterSchedule = (totalWater) => {
  const schedule = []
  const glassAmount = 250 // ml per glass
  const totalGlasses = Math.round(totalWater / glassAmount)

  // 饮水时间点安排
  const timeSlots = [
    { time: '07:00', description: '起床后', amount: 400 },
    { time: '09:00', description: '上午', amount: 250 },
    { time: '11:00', description: '上午', amount: 250 },
    { time: '13:00', description: '午餐前', amount: 300 },
    { time: '15:00', description: '下午', amount: 250 },
    { time: '17:00', description: '下午', amount: 250 },
    { time: '19:00', description: '晚餐前', amount: 250 },
    { time: '21:00', description: '睡前1小时', amount: 200 }
  ]

  let remainingWater = totalWater

  for (const slot of timeSlots) {
    if (remainingWater <= 0) break

    const amount = Math.min(slot.amount, remainingWater)
    schedule.push({
      time: slot.time,
      description: slot.description,
      amount,
      glasses: Math.round(amount / glassAmount * 10) / 10
    })

    remainingWater -= amount
  }

  return schedule
}

// 初始化饮品含水量计算
beverageCalculator.value.waterContent = calculateBeverageWater()
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