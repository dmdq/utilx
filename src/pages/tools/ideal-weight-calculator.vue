<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">理想体重计算器</h1>
      <p class="text-muted-foreground mb-6">计算理想体重范围，支持多种公式，结合身体骨架类型调整，提供体重目标建议</p>
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
                <select v-model="basicInfo.gender" class="w-full px-3 py-2 border rounded-lg">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">年龄</label>
                <input
                  v-model.number="basicInfo.age"
                  type="number"
                  min="10"
                  max="100"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">身高 (cm)</label>
                <input
                  v-model.number="basicInfo.height"
                  type="number"
                  min="100"
                  max="250"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="170"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">当前体重 (kg)</label>
                <input
                  v-model.number="basicInfo.currentWeight"
                  type="number"
                  min="20"
                  max="300"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="70"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">身体骨架类型</label>
              <select v-model="bodyFrameType" class="w-full px-3 py-2 border rounded-lg">
                <option value="small">小骨架</option>
                <option value="medium">中等骨架</option>
                <option value="large">大骨架</option>
                <option value="auto">自动计算</option>
              </select>
              <div class="text-xs text-muted-foreground mt-1">
                骨架类型会影响理想体重范围
              </div>
            </div>

            <!-- 骨架类型自动计算 -->
            <div v-if="bodyFrameType === 'auto'" class="p-3 bg-blue-50 rounded-lg">
              <h4 class="font-medium text-sm text-blue-800 mb-2">骨架类型测量方法：</h4>
              <div class="space-y-2 text-xs text-blue-700">
                <div>• <strong>手腕测量法：</strong>用右手拇指和中指环绕左手手腕</div>
                <div>• <strong>小骨架：</strong>两指重叠</div>
                <div>• <strong>中等骨架：</strong>两指刚好接触</div>
                <div>• <strong>大骨架：</strong>两指无法接触</div>
              </div>
              <div class="mt-3">
                <label class="block text-sm font-medium mb-1">手腕周长 (cm)</label>
                <input
                  v-model.number="wristCircumference"
                  type="number"
                  min="10"
                  max="25"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="16"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">计算公式</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="selectedFormulas"
                    type="checkbox"
                    value="devine"
                    class="mr-2"
                  />
                  <span class="text-sm">Devine公式 (1974)</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="selectedFormulas"
                    type="checkbox"
                    value="robinson"
                    class="mr-2"
                  />
                  <span class="text-sm">Robinson公式 (1983)</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="selectedFormulas"
                    type="checkbox"
                    value="hamwi"
                    class="mr-2"
                  />
                  <span class="text-sm">Hamwi公式 (1964)</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="selectedFormulas"
                    type="checkbox"
                    value="miller"
                    class="mr-2"
                  />
                  <span class="text-sm">Miller公式 (1983)</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="selectedFormulas"
                    type="checkbox"
                    value="healthy"
                    class="mr-2"
                  />
                  <span class="text-sm">健康BMI范围 (18.5-24.9)</span>
                </label>
              </div>
            </div>

            <button @click="calculateIdealWeight" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              计算理想体重
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 理想体重结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">理想体重分析</h3>
          <div v-if="results.averageWeight > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-5xl font-bold text-green-600 mb-2">
                {{ results.averageWeight }}
              </div>
              <div class="text-lg text-muted-foreground">kg</div>
              <div class="text-sm">平均理想体重</div>
            </div>

            <!-- 体重范围 -->
            <div class="p-4 bg-green-50 rounded-lg">
              <div class="text-center">
                <div class="text-lg font-semibold text-green-800">
                  {{ results.minWeight }} - {{ results.maxWeight }} kg
                </div>
                <div class="text-sm text-green-700">理想体重范围</div>
              </div>
            </div>

            <!-- 当前体重状态 -->
            <div v-if="basicInfo.currentWeight" class="space-y-3">
              <div class="p-3 rounded-lg" :class="getWeightStatusClass()">
                <div class="flex justify-between items-center">
                  <span class="font-medium">当前体重状态</span>
                  <span :class="getWeightStatusColorClass()">{{ getWeightStatusText() }}</span>
                </div>
                <div class="text-sm mt-1">
                  {{ getWeightStatusDescription() }}
                </div>
              </div>

              <!-- 体重差值 -->
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                  <div class="text-lg font-semibold text-blue-600">
                    {{ results.weightDifference > 0 ? '+' : '' }}{{ results.weightDifference }}
                  </div>
                  <div class="text-xs text-muted-foreground">与理想体重差值 (kg)</div>
                </div>
                <div class="text-center p-3 bg-purple-50 rounded-lg">
                  <div class="text-lg font-semibold text-purple-600">
                    {{ results.weightDifferencePercent }}%
                  </div>
                  <div class="text-xs text-muted-foreground">偏差百分比</div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入信息后计算理想体重
          </div>
        </div>

        <!-- 各公式结果对比 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">各公式结果对比</h3>
          <div v-if="results.formulaResults.length > 0" class="space-y-3">
            <div v-for="result in results.formulaResults" :key="result.name"
                 class="p-3 bg-secondary rounded-lg">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-medium text-sm">{{ result.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ result.description }}</div>
                </div>
                <div class="text-right">
                  <div class="font-semibold">{{ result.weight }} kg</div>
                  <div class="text-xs text-muted-foreground">{{ result.min }}-{{ result.max }} kg</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BMI分析 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">BMI健康范围</h3>
          <div v-if="basicInfo.height" class="space-y-4">
            <div class="space-y-3">
              <div v-for="bmiRange in bmiRanges" :key="bmiRange.name"
                   class="p-3 rounded-lg border"
                   :class="getBMIClass(bmiRange)">
                <div class="flex justify-between items-center">
                  <span class="font-medium">{{ bmiRange.name }}</span>
                  <span class="text-sm">{{ bmiRange.min }}-{{ bmiRange.max }} kg</span>
                </div>
                <div class="text-xs text-muted-foreground mt-1">BMI: {{ bmiRange.bmiMin }}-{{ bmiRange.bmiMax }}</div>
              </div>
            </div>

            <!-- BMI图表 -->
            <div class="mt-4">
              <div class="text-sm font-medium mb-2">BMI体重分布图</div>
              <div class="relative h-8 bg-gradient-to-r from-blue-200 via-green-200 to-yellow-200 rounded-lg">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-xs text-gray-700">
                    <span>偏瘦</span>
                    <span class="mx-8">正常</span>
                    <span class="mx-8">超重</span>
                    <span>肥胖</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">体重管理建议</h3>
          <div v-if="results.weightDifference !== null" class="space-y-3">
            <div v-for="suggestion in getWeightSuggestions()" :key="suggestion.type"
                 class="p-3 rounded-lg"
                 :class="getSuggestionClass(suggestion.priority)">
              <div class="flex items-start">
                <span class="mr-2">{{ suggestion.icon }}</span>
                <div>
                  <div class="font-medium text-sm">{{ suggestion.title }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ suggestion.description }}</div>
                </div>
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
setPageTitle('理想体重计算器')

// 基本信息
const basicInfo = ref({
  gender: 'male',
  age: 30,
  height: 170,
  currentWeight: 70
})

// 身体骨架类型
const bodyFrameType = ref('medium')
const wristCircumference = ref(16)

// 选择的公式
const selectedFormulas = ref(['devine', 'robinson', 'hamwi', 'miller', 'healthy'])

// 计算结果
const results = ref({
  averageWeight: 0,
  minWeight: 0,
  maxWeight: 0,
  weightDifference: 0,
  weightDifferencePercent: 0,
  formulaResults: []
})

// BMI范围定义
const bmiRanges = computed(() => {
  if (!basicInfo.value.height) return []

  const height = basicInfo.value.height / 100
  const heightSquared = height * height

  return [
    {
      name: '过轻',
      bmiMin: 18.5,
      bmiMax: 18.5,
      min: Math.round(18.5 * heightSquared - 1),
      max: Math.round(18.5 * heightSquared)
    },
    {
      name: '健康',
      bmiMin: 18.5,
      bmiMax: 24.9,
      min: Math.round(18.5 * heightSquared),
      max: Math.round(24.9 * heightSquared)
    },
    {
      name: '超重',
      bmiMin: 25.0,
      bmiMax: 29.9,
      min: Math.round(25.0 * heightSquared),
      max: Math.round(29.9 * heightSquared)
    },
    {
      name: '肥胖',
      bmiMin: 30.0,
      bmiMax: 30.0,
      min: Math.round(30.0 * heightSquared),
      max: Math.round(30.0 * heightSquared + 50)
    }
  ]
})

// 计算理想体重
const calculateIdealWeight = () => {
  const { gender, height, currentWeight } = basicInfo.value
  const formulaResults = []

  // 确定骨架类型
  let frameType = bodyFrameType.value
  if (bodyFrameType.value === 'auto' && wristCircumference.value) {
    frameType = calculateBodyFrameType(gender, height, wristCircumference.value)
  }

  // 骨架调整系数
  const frameAdjustments = {
    small: -0.9,
    medium: 0,
    large: 0.9
  }

  // Devine公式
  if (selectedFormulas.value.includes('devine')) {
    let devineWeight = gender === 'male'
      ? 50 + 2.3 * (height - 152.4)
      : 45.5 + 2.3 * (height - 152.4)

    devineWeight += frameAdjustments[frameType] * 2
    devineWeight = Math.round(devineWeight * 10) / 10

    formulaResults.push({
      name: 'Devine公式',
      description: '基于身高和性别的经典公式',
      weight: devineWeight,
      min: Math.round(devineWeight * 0.9),
      max: Math.round(devineWeight * 1.1)
    })
  }

  // Robinson公式
  if (selectedFormulas.value.includes('robinson')) {
    let robinsonWeight = gender === 'male'
      ? 52 + 1.9 * (height - 152.4)
      : 49 + 1.7 * (height - 152.4)

    robinsonWeight += frameAdjustments[frameType] * 2
    robinsonWeight = Math.round(robinsonWeight * 10) / 10

    formulaResults.push({
      name: 'Robinson公式',
      description: '改良的身高体重公式',
      weight: robinsonWeight,
      min: Math.round(robinsonWeight * 0.9),
      max: Math.round(robinsonWeight * 1.1)
    })
  }

  // Hamwi公式
  if (selectedFormulas.value.includes('hamwi')) {
    let hamwiWeight = gender === 'male'
      ? 48 + 2.7 * (height - 152.4)
      : 45.5 + 2.2 * (height - 152.4)

    hamwiWeight += frameAdjustments[frameType] * 2.5
    hamwiWeight = Math.round(hamwiWeight * 10) / 10

    formulaResults.push({
      name: 'Hamwi公式',
      description: '考虑骨架类型的公式',
      weight: hamwiWeight,
      min: Math.round(hamwiWeight * 0.9),
      max: Math.round(hamwiWeight * 1.1)
    })
  }

  // Miller公式
  if (selectedFormulas.value.includes('miller')) {
    let millerWeight = gender === 'male'
      ? 56.2 + 1.41 * (height - 152.4)
      : 53.1 + 1.36 * (height - 152.4)

    millerWeight += frameAdjustments[frameType] * 1.5
    millerWeight = Math.round(millerWeight * 10) / 10

    formulaResults.push({
      name: 'Miller公式',
      description: '适用于普通人群的简化公式',
      weight: millerWeight,
      min: Math.round(millerWeight * 0.9),
      max: Math.round(millerWeight * 1.1)
    })
  }

  // 健康BMI范围
  if (selectedFormulas.value.includes('healthy')) {
    const heightM = height / 100
    const healthyWeight = 22 * heightM * heightM // 使用BMI中位数22

    formulaResults.push({
      name: '健康BMI',
      description: '基于BMI 18.5-24.9范围',
      weight: Math.round(healthyWeight * 10) / 10,
      min: Math.round(18.5 * heightM * heightM),
      max: Math.round(24.9 * heightM * heightM)
    })
  }

  // 计算平均值和范围
  if (formulaResults.length > 0) {
    const weights = formulaResults.map(r => r.weight)
    const minWeights = formulaResults.map(r => r.min)
    const maxWeights = formulaResults.map(r => r.max)

    const averageWeight = Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10
    const minWeight = Math.round(Math.min(...minWeights) * 10) / 10
    const maxWeight = Math.round(Math.max(...maxWeights) * 10) / 10

    // 计算当前体重差值
    let weightDifference = 0
    let weightDifferencePercent = 0

    if (currentWeight) {
      weightDifference = Math.round((currentWeight - averageWeight) * 10) / 10
      weightDifferencePercent = Math.round((weightDifference / averageWeight) * 100 * 10) / 10
    }

    results.value = {
      averageWeight,
      minWeight,
      maxWeight,
      weightDifference,
      weightDifferencePercent,
      formulaResults
    }
  }
}

// 计算骨架类型
const calculateBodyFrameType = (gender, height, wristCircumference) => {
  const heightInInches = height / 2.54
  const wristInInches = wristCircumference / 2.54

  if (gender === 'male') {
    if (heightInInches > 5.5) {
      if (wristInInches < 6.5) return 'small'
      if (wristInInches < 7.5) return 'medium'
      return 'large'
    } else {
      if (wristInInches < 5.5) return 'small'
      if (wristInInches < 6.5) return 'medium'
      return 'large'
    }
  } else {
    if (heightInInches > 5.2) {
      if (wristInInches < 5.5) return 'small'
      if (wristInInches < 6.5) return 'medium'
      return 'large'
    } else {
      if (wristInInches < 5.0) return 'small'
      if (wristInInches < 6.0) return 'medium'
      return 'large'
    }
  }
}

// 获取体重状态
const getWeightStatusText = () => {
  if (!basicInfo.value.currentWeight || results.value.averageWeight === 0) return ''

  const difference = results.value.weightDifference

  if (Math.abs(difference) < 2) return '理想'
  if (difference > 2 && difference <= 5) return '稍重'
  if (difference > 5) return '过重'
  if (difference < -2 && difference >= -5) return '稍轻'
  return '过轻'
}

// 获取体重状态颜色
const getWeightStatusColorClass = () => {
  const status = getWeightStatusText()

  if (status === '理想') return 'text-green-600'
  if (status === '稍重' || status === '稍轻') return 'text-yellow-600'
  if (status === '过重' || status === '过轻') return 'text-red-600'
  return 'text-gray-600'
}

// 获取体重状态样式
const getWeightStatusClass = () => {
  const status = getWeightStatusText()

  if (status === '理想') return 'bg-green-50 border-green-200'
  if (status === '稍重' || status === '稍轻') return 'bg-yellow-50 border-yellow-200'
  if (status === '过重' || status === '过轻') return 'bg-red-50 border-red-200'
  return 'bg-gray-50 border-gray-200'
}

// 获取体重状态描述
const getWeightStatusDescription = () => {
  const difference = results.value.weightDifference

  if (difference === 0) return '您的体重非常理想，继续保持'
  if (difference > 0) {
    return `您比理想体重重${Math.abs(difference)}kg，建议适当控制饮食和增加运动`
  }
  return `您比理想体重轻${Math.abs(difference)}kg，可以适当增加营养摄入`
}

// 获取BMI样式
const getBMIClass = (range) => {
  if (range.name === '过轻') return 'border-blue-200 bg-blue-50'
  if (range.name === '健康') return 'border-green-200 bg-green-50'
  if (range.name === '超重') return 'border-yellow-200 bg-yellow-50'
  if (range.name === '肥胖') return 'border-red-200 bg-red-50'
  return 'border-gray-200 bg-gray-50'
}

// 获取体重建议
const getWeightSuggestions = () => {
  const suggestions = []
  const difference = results.value.weightDifference

  if (Math.abs(difference) > 5) {
    suggestions.push({
      type: 'medical',
      priority: 'high',
      icon: '⚠️',
      title: '咨询专业人士',
      description: '建议咨询医生或营养师，制定科学的体重管理计划'
    })
  }

  if (difference > 0) {
    suggestions.push({
      type: 'diet',
      priority: 'medium',
      icon: '🥗',
      title: '控制饮食',
      description: '减少高热量食物摄入，增加蔬菜水果，控制碳水化合物的量'
    })

    suggestions.push({
      type: 'exercise',
      priority: 'medium',
      icon: '🏃',
      title: '增加运动',
      description: '每周至少150分钟中等强度有氧运动，配合力量训练'
    })
  } else if (difference < 0) {
    suggestions.push({
      type: 'nutrition',
      priority: 'medium',
      icon: '🍖',
      title: '增加营养',
      description: '适当增加蛋白质和健康脂肪摄入，少量多餐'
    })

    suggestions.push({
      type: 'strength',
      priority: 'low',
      icon: '💪',
      title: '力量训练',
      description: '进行阻力训练增加肌肉量，改善身体成分'
    })
  }

  suggestions.push({
    type: 'lifestyle',
    priority: 'low',
    icon: '📊',
    title: '定期监测',
    description: '定期测量体重和体脂率，保持健康的生活方式'
  })

  return suggestions
}

// 获取建议样式
const getSuggestionClass = (priority) => {
  if (priority === 'high') return 'bg-red-50 border-red-200'
  if (priority === 'medium') return 'bg-yellow-50 border-yellow-200'
  return 'bg-blue-50 border-blue-200'
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