<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">运动消耗计算器</h1>
      <p class="text-muted-foreground mb-6">计算各种运动消耗的热量，基于体重、运动时长、强度，制定运动计划</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：运动数据输入 -->
      <div class="space-y-6">
        <!-- 个人信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">个人信息</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
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
                  min="10"
                  max="100"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">健身水平</label>
                <select v-model="personalInfo.fitnessLevel" class="w-full px-3 py-2 border rounded-lg">
                  <option value="beginner">初学者</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                  <option value="athlete">运动员</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 运动选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">运动类型选择</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">运动分类</label>
              <select v-model="selectedCategory" @change="onCategoryChange" class="w-full px-3 py-2 border rounded-lg">
                <option value="cardio">有氧运动</option>
                <option value="strength">力量训练</option>
                <option value="sports">体育运动</option>
                <option value="daily">日常活动</option>
                <option value="outdoor">户外运动</option>
                <option value="water">水中运动</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">具体运动</label>
              <select v-model="selectedExercise" class="w-full px-3 py-2 border rounded-lg">
                <option v-for="exercise in filteredExercises" :key="exercise.id" :value="exercise.id">
                  {{ exercise.name }}
                </option>
              </select>
            </div>

            <div class="p-3 bg-blue-50 rounded-lg">
              <div class="text-sm text-blue-800">
                <strong>运动强度参考：</strong>{{ getSelectedExercise().description }}
              </div>
            </div>
          </div>
        </div>

        <!-- 运动参数 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">运动参数</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">运动时长 (分钟)</label>
                <input
                  v-model.number="exerciseParams.duration"
                  type="number"
                  min="1"
                  max="480"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">运动强度</label>
                <select v-model="exerciseParams.intensity" class="w-full px-3 py-2 border rounded-lg">
                  <option value="low">低强度</option>
                  <option value="moderate">中等强度</option>
                  <option value="high">高强度</option>
                  <option value="very-high">极高强度</option>
                </select>
              </div>
            </div>

            <div v-if="getSelectedExercise().hasDistance" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">运动距离 (km)</label>
                <input
                  v-model.number="exerciseParams.distance"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="5"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">配速 (分钟/km)</label>
                <input
                  v-model.number="exerciseParams.pace"
                  type="number"
                  min="1"
                  max="20"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="6"
                />
              </div>
            </div>

            <div v-if="getSelectedExercise().hasWeight" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">重量 (kg)</label>
                <input
                  v-model.number="exerciseParams.weight"
                  type="number"
                  min="0"
                  max="500"
                  step="0.5"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="20"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">组数</label>
                <input
                  v-model.number="exerciseParams.sets"
                  type="number"
                  min="1"
                  max="50"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="3"
                />
              </div>
            </div>

            <div v-if="getSelectedExercise().hasReps" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">次数/组</label>
                <input
                  v-model.number="exerciseParams.reps"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="12"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">休息时间 (秒)</label>
                <input
                  v-model.number="exerciseParams.restTime"
                  type="number"
                  min="0"
                  max="300"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="60"
                />
              </div>
            </div>

            <button @click="calculateCalories" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              计算热量消耗
            </button>
          </div>
        </div>

        <!-- 运动计划 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">减重目标设置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">减重目标 (kg/月)</label>
              <input
                v-model.number="weightLossGoal.target"
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="2"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">每周运动天数</label>
              <input
                v-model.number="weightLossGoal.daysPerWeek"
                type="number"
                min="1"
                max="7"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="4"
              />
            </div>

            <button @click="calculateExercisePlan" class="w-full px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/80">
              生成运动计划
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 热量消耗结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">热量消耗分析</h3>
          <div v-if="results.caloriesBurned > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-5xl font-bold text-orange-600 mb-2">
                {{ results.caloriesBurned }}
              </div>
              <div class="text-lg text-muted-foreground">千卡/次运动</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-orange-50 rounded-lg">
                <div class="text-2xl font-semibold text-orange-600">{{ results.metValue }}</div>
                <div class="text-xs text-muted-foreground">MET值</div>
              </div>
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-2xl font-semibold text-blue-600">{{ results.caloriesPerMinute }}</div>
                <div class="text-xs text-muted-foreground">千卡/分钟</div>
              </div>
            </div>

            <!-- 运动强度分析 -->
            <div class="p-3 bg-yellow-50 rounded-lg">
              <div class="text-sm text-yellow-800">
                <strong>运动强度：</strong>{{ getIntensityText() }}
                <span class="block mt-1">相当于{{ getExerciseEquivalent() }}</span>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            选择运动并输入参数后计算热量消耗
          </div>
        </div>

        <!-- 运动计划 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">推荐运动计划</h3>
          <div v-if="exercisePlan.weeklyCalories > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600 mb-2">
                {{ exercisePlan.weeklyCalories }}
              </div>
              <div class="text-sm text-muted-foreground">每周总消耗 (千卡)</div>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span class="text-sm font-medium">每周需要运动</span>
                <span class="font-semibold">{{ exercisePlan.weeklyMinutes }} 分钟</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span class="text-sm font-medium">每日需要运动</span>
                <span class="font-semibold">{{ exercisePlan.dailyMinutes }} 分钟</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span class="text-sm font-medium">预计减重时间</span>
                <span class="font-semibold">{{ exercisePlan.weeksToGoal }} 周</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 热量对比 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">热量对比</h3>
          <div v-if="results.caloriesBurned > 0" class="space-y-4">
            <div class="space-y-2">
              <div v-for="comparison in getCalorieComparisons()" :key="comparison.item"
                   class="flex justify-between items-center p-2 bg-secondary rounded">
                <span class="text-sm">{{ comparison.item }}</span>
                <span class="text-xs text-muted-foreground">{{ comparison.quantity }}</span>
              </div>
            </div>

            <div class="p-3 bg-orange-50 rounded-lg">
              <div class="text-sm text-orange-800">
                <strong>提示：</strong>运动消耗的热量需要与饮食控制相结合，才能有效达到减重目标。
              </div>
            </div>
          </div>
        </div>

        <!-- 运动建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">运动建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>运动前热身5-10分钟，运动后拉伸10分钟</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>保持适中的运动强度，避免过度训练</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>结合有氧运动和力量训练，效果更佳</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>运动后及时补充水分和适量蛋白质</span>
            </div>
            <div class="flex items-start">
              <span class="text-red-600 mr-2">⚠️</span>
              <span>如有身体不适，请立即停止运动并咨询医生</span>
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
setPageTitle('运动消耗计算器')

// 个人信息
const personalInfo = ref({
  weight: 70,
  gender: 'male',
  age: 30,
  fitnessLevel: 'intermediate'
})

// 运动选择
const selectedCategory = ref('cardio')
const selectedExercise = ref('running')

// 运动参数
const exerciseParams = ref({
  duration: 30,
  intensity: 'moderate',
  distance: 5,
  pace: 6,
  weight: 20,
  sets: 3,
  reps: 12,
  restTime: 60
})

// 减重目标
const weightLossGoal = ref({
  target: 2,
  daysPerWeek: 4
})

// 运动数据库
const exercises = ref({
  cardio: [
    { id: 'running', name: '跑步', met: 9.8, description: '慢跑或快走，中等速度' },
    { id: 'cycling', name: '骑行', met: 7.5, description: '中等速度骑行' },
    { id: 'swimming', name: '游泳', met: 8.0, description: '自由泳或蛙泳' },
    { id: 'rowing', name: '划船', met: 7.0, description: '室内划船机' },
    { id: 'elliptical', name: '椭圆机', met: 6.5, description: '椭圆训练机' },
    { id: 'jogging', name: '慢跑', met: 7.0, description: '轻松慢跑' },
    { id: 'walking', name: '快走', met: 4.5, description: '快速步行' },
    { id: 'jumping-rope', name: '跳绳', met: 11.0, description: '连续跳绳' }
  ],
  strength: [
    { id: 'weightlifting', name: '举重', met: 6.0, description: '综合力量训练', hasWeight: true, hasSets: true, hasReps: true },
    { id: 'bench-press', name: '卧推', met: 5.0, description: '杠铃或哑铃卧推', hasWeight: true, hasSets: true, hasReps: true },
    { id: 'squat', name: '深蹲', met: 5.5, description: '杠铃深蹲', hasWeight: true, hasSets: true, hasReps: true },
    { id: 'deadlift', name: '硬拉', met: 6.0, description: '杠铃硬拉', hasWeight: true, hasSets: true, hasReps: true },
    { id: 'pull-ups', name: '引体向上', met: 8.0, description: '自重引体向上', hasSets: true, hasReps: true },
    { id: 'push-ups', name: '俯卧撑', met: 6.0, description: '自重俯卧撑', hasSets: true, hasReps: true }
  ],
  sports: [
    { id: 'basketball', name: '篮球', met: 8.0, description: '比赛或训练' },
    { id: 'football', name: '足球', met: 7.0, description: '比赛或训练' },
    { id: 'tennis', name: '网球', met: 7.3, description: '单打比赛' },
    { id: 'badminton', name: '羽毛球', met: 6.0, description: '单打比赛' },
    { id: 'volleyball', name: '排球', met: 5.0, description: '比赛或训练' },
    { id: 'table-tennis', name: '乒乓球', met: 4.0, description: '单打比赛' }
  ],
  daily: [
    { id: 'housework', name: '家务', met: 3.5, description: '清洁、洗衣等' },
    { id: 'gardening', name: '园艺', met: 4.0, description: '修剪、除草等' },
    { id: 'shopping', name: '购物', met: 2.5, description: '推购物车步行' },
    { id: 'stairs', name: '爬楼梯', met: 8.0, description: '上下楼梯' },
    { id: 'dancing', name: '跳舞', met: 6.0, description: '社交舞蹈或健身舞' }
  ],
  outdoor: [
    { id: 'hiking', name: '徒步', met: 6.5, description: '山地徒步', hasDistance: true },
    { id: 'mountain-biking', name: '山地骑行', met: 8.5, description: '越野骑行', hasDistance: true },
    { id: 'climbing', name: '攀岩', met: 8.0, description: '室内或户外攀岩' },
    { id: 'skiing', name: '滑雪', met: 7.0, description: ' downhill滑雪' },
    { id: 'snowboarding', name: '滑雪板', met: 7.0, description: '单板滑雪' }
  ],
  water: [
    { id: 'surfing', name: '冲浪', met: 6.0, description: '海上冲浪' },
    { id: 'kayaking', name: '皮划艇', met: 5.0, description: '静水或河流划行' },
    { id: 'paddle-board', name: '桨板', met: 6.0, description: '站立式桨板' },
    { id: 'water-aerobics', name: '水中有氧', met: 5.5, description: '水中健身操' }
  ]
})

// 计算结果
const results = ref({
  caloriesBurned: 0,
  metValue: 0,
  caloriesPerMinute: 0
})

// 运动计划
const exercisePlan = ref({
  weeklyCalories: 0,
  weeklyMinutes: 0,
  dailyMinutes: 0,
  weeksToGoal: 0
})

// 过滤后的运动列表
const filteredExercises = computed(() => {
  return exercises.value[selectedCategory.value] || []
})

// 分类改变处理
const onCategoryChange = () => {
  const categoryExercises = exercises.value[selectedCategory.value]
  if (categoryExercises && categoryExercises.length > 0) {
    selectedExercise.value = categoryExercises[0].id
  }
}

// 获取选中的运动
const getSelectedExercise = () => {
  const categoryExercises = exercises.value[selectedCategory.value]
  return categoryExercises?.find(ex => ex.id === selectedExercise.value) || {}
}

// 计算热量消耗
const calculateCalories = () => {
  const exercise = getSelectedExercise()
  const { weight, age, gender, fitnessLevel } = personalInfo.value
  const { duration, intensity } = exerciseParams.value

  // MET值调整
  let metValue = exercise.met || 5.0

  // 强度调整
  const intensityMultipliers = {
    low: 0.8,
    moderate: 1.0,
    high: 1.2,
    'very-high': 1.4
  }

  metValue *= intensityMultipliers[intensity] || 1.0

  // 健身水平调整
  const fitnessMultipliers = {
    beginner: 0.9,
    intermediate: 1.0,
    advanced: 1.1,
    athlete: 1.2
  }

  metValue *= fitnessMultipliers[fitnessLevel] || 1.0

  // 计算热量消耗 (MET × 体重kg × 时间小时)
  const caloriesBurned = Math.round(metValue * weight * (duration / 60))
  const caloriesPerMinute = Math.round((caloriesBurned / duration) * 10) / 10

  results.value = {
    caloriesBurned,
    metValue: Math.round(metValue * 10) / 10,
    caloriesPerMinute
  }
}

// 生成运动计划
const calculateExercisePlan = () => {
  const { target, daysPerWeek } = weightLossGoal.value

  // 每周需要消耗的热量 (1kg脂肪约7700千卡)
  const weeklyCaloriesNeeded = target * 7700
  const dailyCaloriesNeeded = weeklyCaloriesNeeded / daysPerWeek

  // 基于当前运动的强度计算所需时间
  const exercise = getSelectedExercise()
  const metValue = exercise.met || 5.0

  const minutesPerDay = Math.round(dailyCaloriesNeeded / (metValue * personalInfo.value.weight / 60))
  const weeklyMinutes = minutesPerDay * daysPerWeek

  // 计算达到目标所需周数
  const weeksToGoal = Math.round(10 / target) // 假设目标减重10kg

  exercisePlan.value = {
    weeklyCalories: weeklyCaloriesNeeded,
    weeklyMinutes,
    dailyMinutes: minutesPerDay,
    weeksToGoal
  }
}

// 获取强度文本
const getIntensityText = () => {
  const { intensity } = exerciseParams.value
  const intensityTexts = {
    low: '低强度运动',
    moderate: '中等强度运动',
    high: '高强度运动',
    'very-high': '极高强度运动'
  }
  return intensityTexts[intensity] || '中等强度运动'
}

// 获取运动等效
const getExerciseEquivalent = () => {
  const calories = results.value.caloriesBurned

  if (calories < 100) return `慢走${Math.round(calories / 3.5 * 10) / 10}分钟`
  if (calories < 200) return `快走${Math.round(calories / 4.5 * 10) / 10}分钟`
  if (calories < 300) return `跑步${Math.round(calories / 9.8 * 10) / 10}分钟`
  return `高强度运动${Math.round(calories / 12 * 10) / 10}分钟`
}

// 获取热量对比
const getCalorieComparisons = () => {
  const calories = results.value.caloriesBurned

  return [
    { item: '米饭', quantity: `${Math.round(calories / 116)}碗` },
    { item: '苹果', quantity: `${Math.round(calories / 52)}个` },
    { item: '可乐', quantity: `${Math.round(calories / 140)}杯` },
    { item: '巧克力', quantity: `${Math.round(calories / 546)}块` },
    { item: '鸡胸肉', quantity: `${Math.round(calories / 165)}克` }
  ]
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