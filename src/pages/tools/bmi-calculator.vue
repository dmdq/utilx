<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">BMI计算器</h1>
      <p class="text-muted-foreground">计算身体质量指数(BMI)，评估体重状况，支持公制和英制单位</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 单位制选择 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">选择单位制</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="unitSystem = 'metric'"
              :class="[
                'p-4 rounded-lg border transition-all text-center',
                unitSystem === 'metric'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary'
              ]"
            >
              <div class="font-medium">公制单位</div>
              <div class="text-sm text-muted-foreground">厘米 / 千克</div>
            </button>
            <button
              @click="unitSystem = 'imperial'"
              :class="[
                'p-4 rounded-lg border transition-all text-center',
                unitSystem === 'imperial'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary'
              ]"
            >
              <div class="font-medium">英制单位</div>
              <div class="text-sm text-muted-foreground">英寸 / 磅</div>
            </button>
          </div>
        </div>

        <!-- 基本信息输入 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">基本信息</h2>

          <div class="space-y-4">
            <!-- 性别选择 -->
            <div>
              <label class="block text-sm font-medium mb-2">性别</label>
              <div class="flex gap-3">
                <button
                  @click="gender = 'male'"
                  :class="[
                    'flex-1 p-3 rounded-lg border transition-all',
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-border hover:border-blue-300'
                  ]"
                >
                  <div class="flex items-center justify-center gap-2">
                    <User class="w-4 h-4" />
                    <span>男性</span>
                  </div>
                </button>
                <button
                  @click="gender = 'female'"
                  :class="[
                    'flex-1 p-3 rounded-lg border transition-all',
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-border hover:border-pink-300'
                  ]"
                >
                  <div class="flex items-center justify-center gap-2">
                    <User class="w-4 h-4" />
                    <span>女性</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- 年龄输入 -->
            <div>
              <label class="block text-sm font-medium mb-2">年龄</label>
              <input
                v-model.number="age"
                @input="calculateBMI"
                type="number"
                min="1"
                max="120"
                placeholder="请输入年龄"
                class="w-full px-3 py-2 border rounded-md"
              >
              <div class="mt-1 text-xs text-muted-foreground">
                年龄范围：1-120岁
              </div>
            </div>

            <!-- 身高输入 -->
            <div>
              <label class="block text-sm font-medium mb-2">
                身高 ({{ unitSystem === 'metric' ? '厘米' : '英寸' }})
              </label>
              <div v-if="unitSystem === 'metric'" class="flex gap-2">
                <input
                  v-model.number="height.cm"
                  @input="calculateBMI"
                  type="number"
                  min="50"
                  max="250"
                  placeholder="170"
                  class="flex-1 px-3 py-2 border rounded-md"
                >
                <span class="px-3 py-2 bg-muted rounded-md">cm</span>
              </div>
              <div v-else class="grid grid-cols-2 gap-2">
                <div class="flex gap-2">
                  <input
                    v-model.number="height.feet"
                    @input="calculateBMI"
                    type="number"
                    min="1"
                    max="8"
                    placeholder="5"
                    class="flex-1 px-3 py-2 border rounded-md"
                  >
                  <span class="px-3 py-2 bg-muted rounded-md">ft</span>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model.number="height.inches"
                    @input="calculateBMI"
                    type="number"
                    min="0"
                    max="11"
                    placeholder="8"
                    class="flex-1 px-3 py-2 border rounded-md"
                  >
                  <span class="px-3 py-2 bg-muted rounded-md">in</span>
                </div>
              </div>
            </div>

            <!-- 体重输入 -->
            <div>
              <label class="block text-sm font-medium mb-2">
                体重 ({{ unitSystem === 'metric' ? '千克' : '磅' }})
              </label>
              <div class="flex gap-2">
                <input
                  v-model.number="weight"
                  @input="calculateBMI"
                  type="number"
                  :min="unitSystem === 'metric' ? 20 : 44"
                  :max="unitSystem === 'metric' ? 200 : 440"
                  :placeholder="unitSystem === 'metric' ? '70' : '154'"
                  class="flex-1 px-3 py-2 border rounded-md"
                >
                <span class="px-3 py-2 bg-muted rounded-md">
                  {{ unitSystem === 'metric' ? 'kg' : 'lbs' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- BMI结果 -->
        <div v-if="bmiResult" class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">BMI结果</h2>

          <div class="text-center mb-6">
            <div class="text-4xl font-bold mb-2" :class="getBMIClass(bmiResult.value)">
              {{ bmiResult.value.toFixed(1) }}
            </div>
            <div class="text-lg text-muted-foreground mb-1">BMI指数</div>
            <div class="text-xl font-medium" :class="getBMIClass(bmiResult.value)">
              {{ bmiResult.category }}
            </div>
          </div>

          <!-- BMI进度条 -->
          <div class="mb-4">
            <div class="relative">
              <div class="h-4 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 via-orange-400 to-red-400 rounded-full"></div>
              <div
                class="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-4 border-gray-800 rounded-full shadow-lg"
                :style="{ left: `${getBMIPosition(bmiResult.value)}%` }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-muted-foreground mt-2">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>35</span>
              <span>40</span>
            </div>
          </div>

          <!-- 健康建议 -->
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 class="font-medium text-blue-800 mb-2">健康建议</h3>
            <ul class="text-sm text-blue-700 space-y-1">
              <li v-for="(advice, index) in bmiResult.advice" :key="index" class="flex items-start gap-2">
                <Check class="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>{{ advice }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 右侧：详细信息 -->
      <div class="space-y-4">
        <!-- 理想体重范围 -->
        <div v-if="bmiResult" class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">理想体重范围</h3>

          <div class="space-y-4">
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="text-sm font-medium text-green-800 mb-2">健康BMI范围：18.5 - 24.9</div>
              <div class="text-green-700">
                <div>理想体重范围：</div>
                <div class="text-xl font-bold">
                  {{ idealWeight.min.toFixed(1) }} - {{ idealWeight.max.toFixed(1) }} {{ unitSystem === 'metric' ? 'kg' : 'lbs' }}
                </div>
              </div>
            </div>

            <div class="text-sm text-muted-foreground">
              <div>当前体重差距：</div>
              <div class="font-medium">
                <span v-if="weight < idealWeight.min" class="text-blue-600">
                  需要增加 {{ (idealWeight.min - weight).toFixed(1) }} {{ unitSystem === 'metric' ? 'kg' : 'lbs' }}
                </span>
                <span v-else-if="weight > idealWeight.max" class="text-orange-600">
                  需要减少 {{ (weight - idealWeight.max).toFixed(1) }} {{ unitSystem === 'metric' ? 'kg' : 'lbs' }}
                </span>
                <span v-else class="text-green-600">体重在健康范围内</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BMI分类标准 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">BMI分类标准</h3>

          <div class="space-y-2">
            <div
              v-for="category in bmiCategories"
              :key="category.name"
              class="flex items-center justify-between p-3 rounded-lg"
              :class="[
                bmiResult && isCurrentCategory(category) ? 'bg-primary/10 border border-primary' : 'bg-muted/50'
              ]"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-4 h-4 rounded-full"
                  :style="{ backgroundColor: category.color }"
                ></div>
                <div>
                  <div class="font-medium">{{ category.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ category.description }}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="font-mono font-medium">{{ category.range }}</div>
                <div class="text-xs text-muted-foreground">BMI值</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康风险 -->
        <div v-if="bmiResult" class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">健康风险评估</h3>

          <div class="space-y-4">
            <div class="p-4 rounded-lg" :class="getHealthRiskClass()">
              <div class="flex items-center gap-3 mb-2">
                <AlertTriangle class="w-5 h-5" />
                <span class="font-medium">风险等级：{{ healthRisk.level }}</span>
              </div>
              <p class="text-sm">{{ healthRisk.description }}</p>
            </div>

            <div class="text-sm text-muted-foreground space-y-2">
              <div><strong>相关疾病风险：</strong></div>
              <ul class="space-y-1 ml-4">
                <li v-for="(risk, index) in healthRisk.diseases" :key="index" class="flex items-start gap-2">
                  <span class="text-red-500 mt-1">•</span>
                  <span>{{ risk }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-6 bg-card rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Info class="w-5 h-5 text-primary" />
        使用说明
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
        <div>
          <h4 class="font-medium text-foreground mb-2">什么是BMI？</h4>
          <p class="mb-2">BMI（Body Mass Index，身体质量指数）是评估人体胖瘦程度以及是否健康的一个标准。</p>
          <p>计算公式：BMI = 体重(kg) ÷ 身高²(m²)</p>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">注意事项</h4>
          <ul class="space-y-1 list-disc list-inside">
            <li>BMI仅供参考，不能完全反映体脂率</li>
            <li>运动员、孕妇等特殊人群BMI可能偏高</li>
            <li>儿童和青少年使用不同的BMI标准</li>
            <li>建议结合腰围、体脂率等指标综合评估</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { User, Check, AlertTriangle, Info } from 'lucide-vue-next'

// 状态管理
const unitSystem = ref('metric')
const gender = ref('male')
const age = ref('')
const weight = ref('')
const height = ref({
  cm: '',
  feet: '',
  inches: ''
})

// BMI分类
const bmiCategories = [
  {
    name: '严重偏瘦',
    description: '营养不良风险',
    range: '< 18.5',
    color: '#3B82F6',
    min: 0,
    max: 18.5
  },
  {
    name: '正常体重',
    description: '健康体重范围',
    range: '18.5 - 24.9',
    color: '#10B981',
    min: 18.5,
    max: 25
  },
  {
    name: '超重',
    description: '轻度肥胖风险',
    range: '25.0 - 29.9',
    color: '#F59E0B',
    min: 25,
    max: 30
  },
  {
    name: '肥胖',
    description: '中度肥胖风险',
    range: '30.0 - 34.9',
    color: '#EF4444',
    min: 30,
    max: 35
  },
  {
    name: '重度肥胖',
    description: '重度健康风险',
    range: '≥ 35.0',
    color: '#991B1B',
    min: 35,
    max: 50
  }
]

// 计算属性
const bmiResult = computed(() => {
  if (!weight.value || !getHeightInMeters()) return null

  const weightInKg = unitSystem.value === 'metric' ? weight.value : weight.value * 0.453592
  const heightInMeters = getHeightInMeters()

  const bmi = weightInKg / (heightInMeters * heightInMeters)

  return {
    value: bmi,
    category: getBMICategory(bmi),
    advice: getBMIAdvice(bmi)
  }
})

const idealWeight = computed(() => {
  if (!getHeightInMeters()) return { min: 0, max: 0 }

  const heightInMeters = getHeightInMeters()
  const minWeight = 18.5 * heightInMeters * heightInMeters
  const maxWeight = 24.9 * heightInMeters * heightInMeters

  return {
    min: unitSystem.value === 'metric' ? minWeight : minWeight * 2.20462,
    max: unitSystem.value === 'metric' ? maxWeight : maxWeight * 2.20462
  }
})

const healthRisk = computed(() => {
  if (!bmiResult.value) return null

  const bmi = bmiResult.value.value
  let level, description, diseases

  if (bmi < 18.5) {
    level = '低'
    description = '体重偏低可能影响免疫系统，增加感染风险'
    diseases = ['营养不良', '免疫力下降', '骨质疏松', '贫血']
  } else if (bmi < 25) {
    level = '最低'
    description = '体重在健康范围内，疾病风险较低'
    diseases = ['风险较低']
  } else if (bmi < 30) {
    level = '中等'
    description = '轻度超重，开始增加慢性病风险'
    diseases = ['高血压', '糖尿病', '心血管疾病', '关节问题']
  } else if (bmi < 35) {
    level = '高'
    description = '肥胖显著增加多种疾病风险'
    diseases = ['2型糖尿病', '高血压', '心脏病', '中风', '某些癌症']
  } else {
    level = '很高'
    description = '重度肥胖，严重健康风险'
    diseases = ['严重心脏病', '糖尿病并发症', '呼吸问题', '多种癌症', '寿命缩短']
  }

  return { level, description, diseases }
})

// 方法
const getHeightInMeters = () => {
  if (unitSystem.value === 'metric') {
    return height.value.cm ? height.value.cm / 100 : 0
  } else {
    const feet = height.value.feet || 0
    const inches = height.value.inches || 0
    const totalInches = feet * 12 + inches
    return totalInches * 0.0254
  }
}

const calculateBMI = () => {
  // BMI在computed属性中自动计算
}

const getBMICategory = (bmi) => {
  for (const category of bmiCategories) {
    if (bmi >= category.min && bmi < category.max) {
      return category.name
    }
  }
  return bmiCategories[bmiCategories.length - 1].name
}

const getBMIAdvice = (bmi) => {
  if (bmi < 18.5) {
    return [
      '增加营养摄入，选择高蛋白食物',
      '适量运动，增强肌肉力量',
      '定期体检，监测健康状况',
      '咨询营养师制定增重计划'
    ]
  } else if (bmi < 25) {
    return [
      '保持健康饮食和运动习惯',
      '维持当前体重，避免大幅波动',
      '定期进行健康检查',
      '保持良好的生活作息'
    ]
  } else if (bmi < 30) {
    return [
      '控制饮食，减少高热量食物',
      '增加有氧运动，每周150分钟以上',
      '监测体重变化，设定减重目标',
      '咨询医生制定健康减重计划'
    ]
  } else {
    return [
      '立即咨询医生，进行全面健康评估',
      '制定科学的减重计划，循序渐进',
      '控制饮食，专业营养指导',
      '从轻度运动开始，逐步增加强度'
    ]
  }
}

const getBMIClass = (bmi) => {
  if (bmi < 18.5) return 'text-blue-600'
  if (bmi < 25) return 'text-green-600'
  if (bmi < 30) return 'text-yellow-600'
  if (bmi < 35) return 'text-orange-600'
  return 'text-red-600'
}

const getBMIPosition = (bmi) => {
  // 将BMI值映射到进度条位置 (0-100%)
  const minBMI = 15
  const maxBMI = 40
  const position = ((bmi - minBMI) / (maxBMI - minBMI)) * 100
  return Math.max(0, Math.min(100, position))
}

const isCurrentCategory = (category) => {
  if (!bmiResult.value) return false
  const bmi = bmiResult.value.value
  return bmi >= category.min && bmi < category.max
}

const getHealthRiskClass = () => {
  if (!healthRisk.value) return 'bg-gray-50 border border-gray-200'

  const level = healthRisk.value.level
  if (level === '很低') return 'bg-green-50 border border-green-200'
  if (level === '低') return 'bg-blue-50 border border-blue-200'
  if (level === '中等') return 'bg-yellow-50 border border-yellow-200'
  if (level === '高') return 'bg-orange-50 border border-orange-200'
  return 'bg-red-50 border border-red-200'
}

// SEO配置
useSeoMeta({
  title: 'BMI计算器 - 身体质量指数在线计算工具',
  description: '免费在线BMI计算器，支持公制和英制单位，提供健康体重范围、风险评估和专业健康建议。',
  keywords: ['BMI计算', '身体质量指数', '体重评估', '健康计算', '理想体重', '肥胖指数']
})

definePageMeta({
  layout: 'default'
})
</script>