<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">健康年龄评估</h1>
      <p class="text-muted-foreground mb-6">综合评估生理年龄，生活方式因素评分，慢性病风险评估，健康改善建议</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：生活方式评估 -->
      <div class="space-y-6">
        <!-- 基本信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">基本信息</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">实际年龄</label>
                <input
                  v-model.number="basicInfo.age"
                  type="number"
                  min="18"
                  max="100"
                  class="w-full px-3 py-2 border border-border rounded-lg"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">性别</label>
                <select v-model="basicInfo.gender" class="w-full px-3 py-2 border border-border rounded-lg">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 饮食习惯 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">饮食习惯</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">蔬菜水果摄入</label>
              <select v-model="lifestyle.fruitsVegetables" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="rare">很少吃（每周少于3次）</option>
                <option value="sometimes">偶尔吃（每周3-5次）</option>
                <option value="daily">每天吃（1-2份）</option>
                <option value="plenty">大量吃（每天3份以上）</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">加工食品摄入</label>
              <select v-model="lifestyle.processedFood" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="never">从不吃</option>
                <option value="rare">很少吃（每周1-2次）</option>
                <option value="sometimes">偶尔吃（每周3-4次）</option>
                <option value="often">经常吃（每周5次以上）</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">含糖饮料</label>
              <select v-model="lifestyle.sugaryDrinks" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="never">从不喝</option>
                <option value="rare">很少喝（每周1-2杯）</option>
                <option value="sometimes">偶尔喝（每周3-4杯）</option>
                <option value="daily">每天喝（1杯）</option>
                <option value="heavy">大量喝（每天2杯以上）</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">饮食规律</label>
              <select v-model="lifestyle.regularMeals" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="irregular">很不规律</option>
                <option value="somewhat">不太规律</option>
                <option value="regular">比较规律</option>
                <option value="very-regular">非常规律</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 运动习惯 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">运动习惯</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">每周运动天数</label>
              <select v-model="lifestyle.exerciseDays" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="none">从不运动</option>
                <option value="1-2">1-2天</option>
                <option value="3-4">3-4天</option>
                <option value="5-6">5-6天</option>
                <option value="daily">每天运动</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">每次运动时长</label>
              <select v-model="lifestyle.exerciseDuration" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="none">不运动</option>
                <option value="short">少于30分钟</option>
                <option value="moderate">30-60分钟</option>
                <option value="long">超过60分钟</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">日常活动量</label>
              <select v-model="lifestyle.dailyActivity" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="sedentary">久坐（很少活动）</option>
                <option value="light">轻度活动（经常走动）</option>
                <option value="moderate">中度活动（工作需要站立或走动）</option>
                <option value="active">高度活动（体力劳动或大量走动）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 生活习惯 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">生活习惯</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">睡眠时长</label>
              <select v-model="lifestyle.sleepHours" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="less-5">少于5小时</option>
                <option value="5-6">5-6小时</option>
                <option value="7-8">7-8小时</option>
                <option value="9-plus">9小时以上</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">睡眠质量</label>
              <select v-model="lifestyle.sleepQuality" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="poor">很差（经常失眠）</option>
                <option value="fair">一般（偶尔失眠）</option>
                <option value="good">良好（很少失眠）</option>
                <option value="excellent">优秀（从不失眠）</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">压力水平</label>
              <select v-model="lifestyle.stressLevel" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="very-high">极高压力</option>
                <option value="high">高压力</option>
                <option value="moderate">中等压力</option>
                <option value="low">低压力</option>
                <option value="very-low">几乎没有压力</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">吸烟状况</label>
              <select v-model="lifestyle.smoking" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="never">从不吸烟</option>
                <option value="quit">已戒烟</option>
                <option value="occasional">偶尔吸烟</option>
                <option value="regular">经常吸烟（每天少于1包）</option>
                <option value="heavy">重度吸烟（每天1包以上）</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">饮酒状况</label>
              <select v-model="lifestyle.alcohol" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="never">从不喝酒</option>
                <option value="rare">偶尔喝（每月1-2次）</option>
                <option value="moderate">适量喝（每周1-3次）</option>
                <option value="frequent">经常喝（每周4-6次）</option>
                <option value="heavy">大量喝（每天都要）</option>
              </select>
            </div>

            <button @click="calculateHealthAge" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              评估健康年龄
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：评估结果 -->
      <div class="space-y-6">
        <!-- 健康年龄结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">健康年龄评估结果</h3>
          <div v-if="results.healthAge > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-5xl font-bold mb-2" :class="getHealthAgeClass()">
                {{ results.healthAge }}
              </div>
              <div class="text-lg text-muted-foreground">健康年龄</div>
            </div>

            <!-- 年龄对比 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-2xl font-semibold text-blue-600">{{ basicInfo.age }}</div>
                <div class="text-xs text-muted-foreground">实际年龄</div>
              </div>
              <div class="text-center p-3 rounded-lg" :class="getAgeDifferenceClass()">
                <div class="text-2xl font-semibold" :class="getAgeDifferenceColorClass()">
                  {{ results.ageDifference > 0 ? '+' : '' }}{{ results.ageDifference }}
                </div>
                <div class="text-xs text-muted-foreground">年龄差异</div>
              </div>
            </div>

            <!-- 健康状况描述 -->
            <div class="p-4 rounded-lg" :class="getHealthStatusClass()">
              <div class="text-center">
                <div class="text-lg font-medium mb-1">{{ getHealthStatusText() }}</div>
                <div class="text-sm">{{ getHealthStatusDescription() }}</div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            完成生活方式评估后查看结果
          </div>
        </div>

        <!-- 风险因素分析 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">风险因素分析</h3>
          <div v-if="riskFactors.length > 0" class="space-y-3">
            <div v-for="factor in riskFactors" :key="factor.category"
                 class="p-3 rounded-lg"
                 :class="getRiskFactorClass(factor.level)">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">{{ factor.category }}</div>
                  <div class="text-xs text-muted-foreground">{{ factor.description }}</div>
                </div>
                <span class="text-sm font-medium" :class="getRiskLevelClass(factor.level)">
                  {{ factor.risk }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 改善建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">健康改善建议</h3>
          <div v-if="improvementSuggestions.length > 0" class="space-y-3">
            <div v-for="suggestion in improvementSuggestions" :key="suggestion.priority"
                 class="p-3 rounded-lg border"
                 :class="getSuggestionClass(suggestion.priority)">
              <div class="flex items-start">
                <span class="mr-2 text-lg">{{ suggestion.icon }}</span>
                <div>
                  <div class="font-medium text-sm">{{ suggestion.title }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ suggestion.description }}</div>
                  <div v-if="suggestion.impact" class="text-xs mt-2 font-medium text-green-600">
                    预计可降低健康年龄 {{ suggestion.impact }} 岁
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 长期健康建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">长期健康管理</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start">
              <span class="text-green-600 mr-2">✓</span>
              <span>定期体检，监测关键健康指标变化</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">✓</span>
              <span>保持健康的生活方式，即使年龄增长也要坚持</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">✓</span>
              <span>建立良好的社会关系，保持积极的心态</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">✓</span>
              <span>适时调整生活节奏，平衡工作和休息</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">✓</span>
              <span>终身学习，保持大脑活跃和认知功能</span>
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
setPageTitle('健康年龄评估')

// 基本信息
const basicInfo = ref({
  age: 30,
  gender: 'male'
})

// 生活方式
const lifestyle = ref({
  fruitsVegetables: 'daily',
  processedFood: 'sometimes',
  sugaryDrinks: 'rare',
  regularMeals: 'regular',
  exerciseDays: '3-4',
  exerciseDuration: 'moderate',
  dailyActivity: 'light',
  sleepHours: '7-8',
  sleepQuality: 'good',
  stressLevel: 'moderate',
  smoking: 'never',
  alcohol: 'moderate'
})

// 计算结果
const results = ref({
  healthAge: 0,
  ageDifference: 0
})

// 风险因素
const riskFactors = ref([])

// 改善建议
const improvementSuggestions = ref([])

// 计算健康年龄
const calculateHealthAge = () => {
  const { age, gender } = basicInfo.value
  let healthAge = age
  const risks = []
  const suggestions = []

  // 饮食因素影响
  const dietImpact = calculateDietImpact()
  healthAge += dietImpact.years
  risks.push(...dietImpact.risks)

  // 运动因素影响
  const exerciseImpact = calculateExerciseImpact()
  healthAge += exerciseImpact.years
  risks.push(...exerciseImpact.risks)

  // 生活习惯影响
  const lifestyleImpact = calculateLifestyleImpact()
  healthAge += lifestyleImpact.years
  risks.push(...lifestyleImpact.risks)

  // 性别调整
  if (gender === 'female') {
    healthAge -= 2 // 女性平均寿命较长
  }

  // 年龄调整（年轻人容错率高）
  if (age < 30) {
    healthAge = age + (healthAge - age) * 0.5
  } else if (age > 60) {
    healthAge = age + (healthAge - age) * 1.5 // 老年人影响更大
  }

  healthAge = Math.round(healthAge)
  const ageDifference = healthAge - age

  // 生成改善建议
  generateSuggestions(suggestions)

  results.value = {
    healthAge,
    ageDifference
  }

  riskFactors.value = risks
  improvementSuggestions.value = suggestions
}

// 计算饮食影响
const calculateDietImpact = () => {
  let years = 0
  const risks = []

  // 蔬菜水果摄入
  const fruitScores = { rare: 3, sometimes: 1, daily: -1, plenty: -3 }
  years += fruitScores[lifestyle.fruitsVegetables] || 0

  if (lifestyle.fruitsVegetables === 'rare') {
    risks.push({
      category: '营养摄入',
      description: '蔬菜水果摄入不足',
      risk: '高风险',
      level: 'high'
    })
  }

  // 加工食品
  const processedScores = { never: -2, rare: -1, sometimes: 1, often: 3 }
  years += processedScores[lifestyle.processedFood] || 0

  // 含糖饮料
  const drinkScores = { never: -2, rare: -1, sometimes: 0, daily: 2, heavy: 4 }
  years += drinkScores[lifestyle.sugaryDrinks] || 0

  if (lifestyle.sugaryDrinks === 'heavy') {
    risks.push({
      category: '糖分摄入',
      description: '含糖饮料摄入过多',
      risk: '高风险',
      level: 'high'
    })
  }

  // 饮食规律
  const mealScores = { irregular: 2, somewhat: 1, regular: -1, 'very-regular': -2 }
  years += mealScores[lifestyle.regularMeals] || 0

  return { years, risks }
}

// 计算运动影响
const calculateExerciseImpact = () => {
  let years = 0
  const risks = []

  // 运动天数
  const exerciseDayScores = { none: 5, '1-2': 3, '3-4': 0, '5-6': -2, daily: -3 }
  years += exerciseDayScores[lifestyle.exerciseDays] || 0

  // 运动时长
  const durationScores = { none: 3, short: 1, moderate: -1, long: -2 }
  years += durationScores[lifestyle.exerciseDuration] || 0

  // 日常活动量
  const activityScores = { sedentary: 3, light: 1, moderate: -1, active: -2 }
  years += activityScores[lifestyle.dailyActivity] || 0

  if (lifestyle.exerciseDays === 'none') {
    risks.push({
      category: '运动不足',
      description: '缺乏规律运动',
      risk: '高风险',
      level: 'high'
    })
  }

  return { years, risks }
}

// 计算生活习惯影响
const calculateLifestyleImpact = () => {
  let years = 0
  const risks = []

  // 睡眠时长
  const sleepScores = { 'less-5': 4, '5-6': 2, '7-8': -1, '9-plus': 1 }
  years += sleepScores[lifestyle.sleepHours] || 0

  // 睡眠质量
  const qualityScores = { poor: 3, fair: 1, good: -1, excellent: -2 }
  years += qualityScores[lifestyle.sleepQuality] || 0

  // 压力水平
  const stressScores = { 'very-high': 4, high: 2, moderate: 0, low: -1, 'very-low': -2 }
  years += stressScores[lifestyle.stressLevel] || 0

  // 吸烟
  const smokingScores = { never: -3, quit: 0, occasional: 2, regular: 5, heavy: 8 }
  years += smokingScores[lifestyle.smoking] || 0

  if (lifestyle.smoking === 'heavy') {
    risks.push({
      category: '吸烟',
      description: '重度吸烟',
      risk: '极高风险',
      level: 'very-high'
    })
  }

  // 饮酒
  const alcoholScores = { never: -1, rare: 0, moderate: 1, frequent: 3, heavy: 5 }
  years += alcoholScores[lifestyle.alcohol] || 0

  return { years, risks }
}

// 生成改善建议
const generateSuggestions = (suggestions) => {
  suggestions.length = 0

  if (lifestyle.value.fruitsVegetables === 'rare' || lifestyle.value.fruitsVegetables === 'sometimes') {
    suggestions.push({
      priority: 'high',
      icon: '🥗',
      title: '增加蔬菜水果摄入',
      description: '每天至少摄入5份蔬菜水果，提供充足维生素和纤维',
      impact: '2-3'
    })
  }

  if (lifestyle.value.exerciseDays === 'none' || lifestyle.value.exerciseDays === '1-2') {
    suggestions.push({
      priority: 'high',
      icon: '🏃',
      title: '增加运动量',
      description: '每周至少进行150分钟中等强度有氧运动',
      impact: '3-5'
    })
  }

  if (lifestyle.value.sleepHours === 'less-5' || lifestyle.value.sleepHours === '5-6') {
    suggestions.push({
      priority: 'high',
      icon: '😴',
      title: '改善睡眠质量',
      description: '保证每晚7-8小时充足睡眠，建立规律作息',
      impact: '2-4'
    })
  }

  if (lifestyle.value.smoking !== 'never') {
    suggestions.push({
      priority: 'very-high',
      icon: '🚭',
      title: '戒烟或减少吸烟',
      description: '吸烟是最大的健康风险因素之一，戒烟是健康投资的最好选择',
      impact: '5-10'
    })
  }

  if (lifestyle.value.processedFood === 'often') {
    suggestions.push({
      priority: 'medium',
      icon: '🍳',
      title: '减少加工食品',
      description: '选择新鲜、天然的食物，减少高糖、高盐、高脂加工食品',
      impact: '1-2'
    })
  }

  if (lifestyle.value.stressLevel === 'very-high' || lifestyle.value.stressLevel === 'high') {
    suggestions.push({
      priority: 'medium',
      icon: '🧘',
      title: '管理压力',
      description: '学习放松技巧，如冥想、深呼吸、瑜伽等',
      impact: '1-3'
    })
  }

  // 按优先级排序
  suggestions.sort((a, b) => {
    const priorityOrder = { 'very-high': 4, high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

// 获取健康年龄样式
const getHealthAgeClass = () => {
  if (results.value.healthAge === 0) return 'text-gray-600'
  const diff = results.value.ageDifference

  if (diff <= -5) return 'text-green-600'
  if (diff <= -2) return 'text-blue-600'
  if (diff <= 2) return 'text-yellow-600'
  return 'text-red-600'
}

// 获取年龄差异样式
const getAgeDifferenceClass = () => {
  const diff = results.value.ageDifference

  if (diff <= -5) return 'bg-green-50 border-green-200'
  if (diff <= -2) return 'bg-blue-50 border-blue-200'
  if (diff <= 2) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

// 获取年龄差异颜色
const getAgeDifferenceColorClass = () => {
  const diff = results.value.ageDifference

  if (diff <= -5) return 'text-green-600'
  if (diff <= -2) return 'text-blue-600'
  if (diff <= 2) return 'text-yellow-600'
  return 'text-red-600'
}

// 获取健康状态文本
const getHealthStatusText = () => {
  const diff = results.value.ageDifference

  if (diff <= -5) return '健康状况优秀'
  if (diff <= -2) return '健康状况良好'
  if (diff <= 2) return '健康状况一般'
  if (diff <= 5) return '需要改善'
  return '需要立即改善'
}

// 获取健康状态描述
const getHealthStatusDescription = () => {
  const diff = results.value.ageDifference

  if (diff <= -5) return '您的健康年龄比实际年龄小很多，生活方式非常健康，继续保持！'
  if (diff <= -2) return '您的健康年龄比实际年龄小，生活习惯良好，再接再厉！'
  if (diff <= 2) return '您的健康年龄与实际年龄相近，可以适当改善生活方式。'
  if (diff <= 5) return '您的健康年龄比实际年龄大，建议改善生活习惯。'
  return '您的健康年龄明显大于实际年龄，请立即咨询医生并改善生活方式。'
}

// 获取健康状态样式
const getHealthStatusClass = () => {
  const diff = results.value.ageDifference

  if (diff <= -5) return 'bg-green-50 border-green-200 text-green-800'
  if (diff <= -2) return 'bg-blue-50 border-blue-200 text-blue-800'
  if (diff <= 2) return 'bg-yellow-50 border-yellow-200 text-yellow-800'
  if (diff <= 5) return 'bg-orange-50 border-orange-200 text-orange-800'
  return 'bg-red-50 border-red-200 text-red-800'
}

// 获取风险因素样式
const getRiskFactorClass = (level) => {
  if (level === 'very-high') return 'bg-red-50 border-red-200'
  if (level === 'high') return 'bg-orange-50 border-orange-200'
  if (level === 'medium') return 'bg-yellow-50 border-yellow-200'
  if (level === 'low') return 'bg-blue-50 border-blue-200'
  return 'bg-green-50 border-green-200'
}

// 获取风险等级样式
const getRiskLevelClass = (level) => {
  if (level === 'very-high') return 'text-red-600 font-bold'
  if (level === 'high') return 'text-orange-600 font-semibold'
  if (level === 'medium') return 'text-yellow-600'
  if (level === 'low') return 'text-blue-600'
  return 'text-green-600'
}

// 获取建议样式
const getSuggestionClass = (priority) => {
  if (priority === 'very-high') return 'border-red-200 bg-red-50'
  if (priority === 'high') return 'border-orange-200 bg-orange-50'
  if (priority === 'medium') return 'border-yellow-200 bg-yellow-50'
  return 'border-blue-200 bg-blue-50'
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