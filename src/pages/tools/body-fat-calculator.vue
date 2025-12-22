<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">体脂率计算器</h1>
      <p class="text-muted-foreground mb-6">通过BMI、年龄、性别计算体脂率，支持多种测量方法，提供健康评估</p>
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
                  placeholder="25"
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
                  placeholder="175"
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
                  placeholder="70"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 测量方法选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">计算方法</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">选择计算方法</label>
              <select v-model="selectedMethod" class="w-full px-3 py-2 border rounded-lg">
                <option value="bmi">BMI公式法</option>
                <option value="navy">美国海军公式法</option>
                <option value="caliper">皮褶厚度法（简化版）</option>
              </select>
            </div>

            <!-- 海军公式需要的额外参数 -->
            <div v-if="selectedMethod === 'navy'" class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-2">腰围 (cm)</label>
                <input
                  v-model.number="navyMethod.waist"
                  type="number"
                  min="20"
                  max="200"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="80"
                />
              </div>
              <div v-if="basicInfo.gender === 'female'">
                <label class="block text-sm font-medium mb-2">臀围 (cm)</label>
                <input
                  v-model.number="navyMethod.hip"
                  type="number"
                  min="20"
                  max="200"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="95"
                />
              </div>
              <div v-if="basicInfo.gender === 'female'">
                <label class="block text-sm font-medium mb-2">颈围 (cm)</label>
                <input
                  v-model.number="navyMethod.neck"
                  type="number"
                  min="10"
                  max="100"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="35"
                />
              </div>
            </div>

            <!-- 皮褶厚度法需要的参数 -->
            <div v-if="selectedMethod === 'caliper'" class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-2">肱三头肌皮褶厚度 (mm)</label>
                <input
                  v-model.number="caliperMethod.triceps"
                  type="number"
                  min="1"
                  max="50"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="12"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">肩胛下角皮褶厚度 (mm)</label>
                <input
                  v-model.number="caliperMethod.suprailiac"
                  type="number"
                  min="1"
                  max="50"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="20"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">腹部皮褶厚度 (mm)</label>
                <input
                  v-model.number="caliperMethod.abdominal"
                  type="number"
                  min="1"
                  max="50"
                  step="0.1"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="25"
                />
              </div>
            </div>

            <button @click="calculateBodyFat" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              计算体脂率
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 计算结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">计算结果</h3>
          <div v-if="results.bodyFatPercentage > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-5xl font-bold text-primary mb-2">
                {{ results.bodyFatPercentage.toFixed(1) }}%
              </div>
              <div class="text-lg text-muted-foreground">体脂率</div>
            </div>

            <!-- 体脂率状态 -->
            <div class="p-4 rounded-lg" :class="getFatLevelClass(results.bodyFatPercentage)">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ getFatLevel(results.bodyFatPercentage) }}</span>
                <span class="text-sm">{{ getFatRange(results.bodyFatPercentage) }}</span>
              </div>
              <div class="text-sm mt-2">{{ getFatAdvice(results.bodyFatPercentage) }}</div>
            </div>

            <!-- 瘦体重和脂肪重量 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm text-muted-foreground">脂肪重量</div>
                <div class="text-xl font-semibold">{{ results.fatMass.toFixed(1) }} kg</div>
              </div>
              <div class="p-3 bg-secondary rounded">
                <div class="text-sm text-muted-foreground">瘦体重</div>
                <div class="text-xl font-semibold">{{ results.leanMass.toFixed(1) }} kg</div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入数据后计算体脂率
          </div>
        </div>

        <!-- 参考标准 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">体脂率参考标准</h3>
          <div class="space-y-4">
            <div>
              <h4 class="font-medium text-sm mb-2">男性体脂率标准</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>必需脂肪</span>
                  <span>2-5%</span>
                </div>
                <div class="flex justify-between">
                  <span>运动员</span>
                  <span>6-13%</span>
                </div>
                <div class="flex justify-between">
                  <span>健康</span>
                  <span>14-17%</span>
                </div>
                <div class="flex justify-between">
                  <span>可接受</span>
                  <span>18-24%</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>肥胖</span>
                  <span>≥25%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 class="font-medium text-sm mb-2">女性体脂率标准</h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>必需脂肪</span>
                  <span>10-13%</span>
                </div>
                <div class="flex justify-between">
                  <span>运动员</span>
                  <span>14-20%</span>
                </div>
                <div class="flex justify-between">
                  <span>健康</span>
                  <span>21-24%</span>
                </div>
                <div class="flex justify-between">
                  <span>可接受</span>
                  <span>25-31%</span>
                </div>
                <div class="flex justify-between text-red-600">
                  <span>肥胖</span>
                  <span>≥32%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">健康建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>定期监测体脂率变化，建议每月测量一次</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>结合体重和体脂率综合评估，避免只关注体重数字</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>保持健康体脂率需要合理饮食和规律运动</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>不同测量方法结果可能有差异，建议使用同一方法追踪变化</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('体脂率计算器')

// 基本信息
const basicInfo = ref({
  gender: 'male',
  age: 25,
  height: 175,
  weight: 70
})

// 计算方法
const selectedMethod = ref('bmi')

// 海军公式参数
const navyMethod = ref({
  waist: 80,
  hip: 95,
  neck: 35
})

// 皮褶厚度法参数
const caliperMethod = ref({
  triceps: 12,
  suprailiac: 20,
  abdominal: 25
})

// 计算结果
const results = ref({
  bodyFatPercentage: 0,
  fatMass: 0,
  leanMass: 0
})

// 计算体脂率
const calculateBodyFat = () => {
  const { gender, age, height, weight } = basicInfo.value
  let bodyFatPercentage = 0

  if (selectedMethod.value === 'bmi') {
    // BMI公式法（Deurenberg公式）
    const bmi = weight / Math.pow(height / 100, 2)
    bodyFatPercentage = (1.20 * bmi) + (0.23 * age) - 10.8 * (gender === 'male' ? 1 : 0) - 5.4

  } else if (selectedMethod.value === 'navy') {
    // 美国海军公式法
    if (gender === 'male') {
      bodyFatPercentage = 86.010 * Math.log10(parseFloat(navyMethod.value.waist) - parseFloat(navyMethod.value.neck)) - 70.041 * Math.log10(height) + 36.76
    } else {
      const log1 = Math.log10(parseFloat(navyMethod.value.waist) + parseFloat(navyMethod.value.hip) - parseFloat(navyMethod.value.neck))
      const log2 = Math.log10(height)
      bodyFatPercentage = 163.205 * log1 - 97.684 * log2 - 78.387
    }

  } else if (selectedMethod.value === 'caliper') {
    // 皮褶厚度法（简化版3点测量）
    const sum = parseFloat(caliperMethod.value.triceps) +
                parseFloat(caliperMethod.value.suprailiac) +
                parseFloat(caliperMethod.value.abdominal)

    if (gender === 'male') {
      bodyFatPercentage = (4.95 / (1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age) - 4.5) * 100
    } else {
      bodyFatPercentage = (4.95 / (1.099421 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age) - 4.5) * 100
    }
  }

  // 确保结果在合理范围内
  bodyFatPercentage = Math.max(1, Math.min(60, bodyFatPercentage))

  results.value = {
    bodyFatPercentage,
    fatMass: weight * bodyFatPercentage / 100,
    leanMass: weight * (100 - bodyFatPercentage) / 100
  }
}

// 获取体脂等级
const getFatLevel = (percentage) => {
  const { gender } = basicInfo.value

  if (gender === 'male') {
    if (percentage <= 5) return '必需脂肪'
    if (percentage <= 13) return '运动员水平'
    if (percentage <= 17) return '健康水平'
    if (percentage <= 24) return '可接受水平'
    return '肥胖'
  } else {
    if (percentage <= 13) return '必需脂肪'
    if (percentage <= 20) return '运动员水平'
    if (percentage <= 24) return '健康水平'
    if (percentage <= 31) return '可接受水平'
    return '肥胖'
  }
}

// 获取体脂范围描述
const getFatRange = (percentage) => {
  const { gender } = basicInfo.value

  if (gender === 'male') {
    if (percentage <= 5) return '低于正常范围'
    if (percentage <= 13) return '运动员水平'
    if (percentage <= 17) return '理想范围'
    if (percentage <= 24) return '正常范围'
    return '高于正常范围'
  } else {
    if (percentage <= 13) return '低于正常范围'
    if (percentage <= 20) return '运动员水平'
    if (percentage <= 24) return '理想范围'
    if (percentage <= 31) return '正常范围'
    return '高于正常范围'
  }
}

// 获取样式类
const getFatLevelClass = (percentage) => {
  const level = getFatLevel(percentage)

  if (level === '必需脂肪' || level === '运动员水平') return 'bg-green-50 border-green-200 text-green-800'
  if (level === '健康水平') return 'bg-blue-50 border-blue-200 text-blue-800'
  if (level === '可接受水平') return 'bg-yellow-50 border-yellow-200 text-yellow-800'
  return 'bg-red-50 border-red-200 text-red-800'
}

// 获取健康建议
const getFatAdvice = (percentage) => {
  const level = getFatLevel(percentage)

  if (level === '必需脂肪') return '体脂率过低，请咨询医生，注意营养均衡'
  if (level === '运动员水平') return '优秀的体脂率，继续保持当前的健康生活方式'
  if (level === '健康水平') return '健康的体脂率，继续保持良好的饮食和运动习惯'
  if (level === '可接受水平') return '体脂率稍高，建议增加运动量，控制饮食'
  return '体脂率过高，建议咨询医生，制定减脂计划'
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