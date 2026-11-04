<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">心血管fitness年龄评估</h1>
      <p class="text-muted-foreground">基于VO2max评估心血管"年龄"，了解心脏健康状态，制定改善计划</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和计算 -->
      <div class="space-y-4">
        <!-- 基本信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart class="w-5 h-5 text-primary" />
            基本信息
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">性别</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="gender = 'male'"
                  :class="['p-3 rounded-lg text-sm', gender === 'male' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  男性
                </button>
                <button
                  @click="gender = 'female'"
                  :class="['p-3 rounded-lg text-sm', gender === 'female' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  女性
                </button>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">实际年龄</label>
              <input
                v-model.number="age"
                type="number"
                min="18"
                max="100"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="输入年龄"
              >
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">身高 (cm)</label>
                <input v-model.number="height" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="身高">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">体重 (kg)</label>
                <input v-model.number="weight" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="体重">
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">静息心率 (bpm)</label>
              <input
                v-model.number="restingHR"
                type="number"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="早晨静坐状态下测量"
              >
            </div>
          </div>
        </div>

        <!-- 生活方式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">生活方式</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">每周运动频率</label>
              <select v-model="exerciseFrequency" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option :value="0">几乎不运动</option>
                <option :value="1">1-2次/周</option>
                <option :value="2">3-4次/周</option>
                <option :value="3">5-6次/周</option>
                <option :value="4">每天运动</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">每次运动时长</label>
              <select v-model="exerciseDuration" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option :value="0">&lt;15分钟</option>
                <option :value="1">15-30分钟</option>
                <option :value="2">30-60分钟</option>
                <option :value="3">&gt;60分钟</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">运动强度</label>
              <select v-model="exerciseIntensity" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option :value="0">低强度（散步）</option>
                <option :value="1">中低强度（快走）</option>
                <option :value="2">中强度（慢跑）</option>
                <option :value="3">中高强度（跑步）</option>
                <option :value="4">高强度（剧烈运动）</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">吸烟情况</label>
              <select v-model="smoking" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option :value="0">不吸烟</option>
                <option :value="1">已戒烟</option>
                <option :value="2">偶尔吸烟</option>
                <option :value="3">每天吸烟</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 计算按钮 -->
        <button
          @click="calculateFitnessAge"
          class="w-full px-4 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-lg font-medium"
        >
          <Heart class="w-5 h-5 inline mr-2" />
          计算心血管年龄
        </button>
      </div>

      <!-- 右侧：结果和建议 -->
      <div class="space-y-4">
        <!-- 评估结果 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity class="w-5 h-5 text-purple-500" />
            评估结果
          </h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">您的心血管年龄</p>
              <p class="text-6xl font-bold text-primary mb-2">{{ result.fitnessAge }}</p>
              <p class="text-lg">岁</p>
            </div>
          </div>

          <!-- 年龄对比 -->
          <div class="flex items-center justify-center gap-8 mb-4 p-4 bg-muted rounded">
            <div class="text-center">
              <p class="text-sm text-muted-foreground">实际年龄</p>
              <p class="text-3xl font-bold">{{ age }}</p>
            </div>
            <div class="text-4xl text-muted-foreground">vs</div>
            <div class="text-center">
              <p class="text-sm text-muted-foreground">心血管年龄</p>
              <p class="text-3xl font-bold" :class="result.difference < 0 ? 'text-green-600' : 'text-red-600'">{{ result.fitnessAge }}</p>
            </div>
          </div>

          <!-- 评估 -->
          <div class="p-4 rounded-lg" :class="getAssessmentClass(result.difference)">
            <div class="flex items-center gap-3 mb-2">
              <component :is="getAssessmentIcon(result.difference)" class="w-6 h-6" />
              <p class="font-medium">{{ getAssessmentText(result.difference) }}</p>
            </div>
            <p class="text-sm">{{ getAssessmentDescription(result.difference) }}</p>
          </div>

          <!-- VO2max估算 -->
          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div class="flex items-center justify-between">
              <span class="text-sm">估算VO2max</span>
              <span class="font-bold text-lg">{{ result.vo2max }} ml/kg/min</span>
            </div>
          </div>
        </div>

        <!-- 改善建议 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">改善建议</h2>

          <div class="space-y-3 text-sm">
            <div v-if="result.difference > 0" class="p-3 bg-red-50 dark:bg-red-900/20 rounded">
              <p class="font-medium mb-2">需要重点关注</p>
              <p class="text-muted-foreground">您的心血管年龄高于实际年龄，建议：</p>
              <ul class="list-disc list-inside mt-2 text-muted-foreground">
                <li>咨询医生进行详细心血管检查</li>
                <li>制定循序渐进的运动计划</li>
                <li>改善饮食习惯，控制体重</li>
                <li>戒烟限酒，保证充足睡眠</li>
              </ul>
            </div>

            <div v-if="result.difference >= -2 && result.difference <= 2" class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <p class="font-medium mb-2">保持现状</p>
              <p class="text-muted-foreground">您的心血管年龄与实际年龄相符，建议：</p>
              <ul class="list-disc list-inside mt-2 text-muted-foreground">
                <li>保持当前的健康生活方式</li>
                <li>适当增加有氧运动强度</li>
                <li>定期体检监测心血管健康</li>
              </ul>
            </div>

            <div v-if="result.difference < -2" class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium mb-2">表现优秀</p>
              <p class="text-muted-foreground">您的心血管年龄低于实际年龄，说明：</p>
              <ul class="list-disc list-inside mt-2 text-muted-foreground">
                <li>您的心血管系统非常健康</li>
                <li>请继续保持良好的运动习惯</li>
                <li>您的努力正在获得回报</li>
              </ul>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium mb-2">通用建议</p>
              <div class="space-y-1 text-muted-foreground">
                <p>• 每周至少150分钟中等强度有氧运动</p>
                <p>• 每周2-3次力量训练</p>
                <p>• 健康饮食，多吃蔬菜水果</p>
                <p>• 管理压力，保持良好心态</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 心血管年龄参考 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-500" />
            心血管年龄说明
          </h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-1">什么是心血管年龄？</p>
              <p class="text-muted-foreground">心血管年龄是根据您的VO2max（最大摄氧量）推算出的心脏和血管系统的"生理年龄"，可以反映心血管健康状况。</p>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-1">影响心血管年龄的因素</p>
              <p class="text-muted-foreground">运动习惯、静息心率、体重、吸烟、饮酒、压力水平、睡眠质量等都会影响心血管年龄。</p>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-1">如何改善心血管年龄？</p>
              <p class="text-muted-foreground">规律的有氧运动是最有效的方法。坚持6-12周的运动训练，VO2max可提高10-20%，相当于心血管年龄年轻5-10岁。</p>
            </div>

            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <p class="font-medium mb-1">注意事项</p>
              <p class="text-muted-foreground">本评估仅供参考，不能替代专业医学检查。如有心血管疾病家族史或相关症状，请咨询医生。</p>
            </div>
          </div>
        </div>

        <!-- 目标设定 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">设定改善目标</h2>

          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium mb-2 block">目标心血管年龄</label>
              <input
                v-model.number="targetAge"
                type="number"
                :max="age"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="例如: 比实际年龄小5岁"
              >
            </div>

            <div class="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded">
              <p class="text-sm text-muted-foreground mb-2">需要提高的VO2max</p>
              <div class="flex items-center justify-between">
                <span class="font-bold text-lg">{{ vo2maxNeeded }}</span>
                <span class="text-sm text-muted-foreground">ml/kg/min</span>
              </div>
              <p class="text-xs text-muted-foreground mt-2">预计需要 {{ weeksNeeded }} 周规律训练</p>
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
import { Heart, Activity, ClipboardList, CheckCircle, AlertCircle, XCircle } from 'lucide-vue-next'

const gender = ref('male')
const age = ref(null)
const height = ref(null)
const weight = ref(null)
const restingHR = ref(null)
const exerciseFrequency = ref(1)
const exerciseDuration = ref(2)
const exerciseIntensity = ref(2)
const smoking = ref(0)
const targetAge = ref(null)

const result = ref(null)

function calculateFitnessAge() {
  if (!age.value || !height.value || !weight.value || !restingHR.value) {
    alert('请填写完整信息')
    return
  }

  // 估算VO2max (使用简化公式)
  let baseVO2
  if (gender.value === 'male') {
    baseVO2 = 15.3 * ((220 - age.value - restingHR.value) / (220 - age.value)) + 29
  } else {
    baseVO2 = 14.7 * ((220 - age.value - restingHR.value) / (220 - age.value)) + 32
  }

  // 生活方式调整
  const lifestyleScore = (exerciseFrequency.value + 1) * (exerciseDuration.value + 1) * (exerciseIntensity.value + 1)
  const lifestyleMultiplier = 0.8 + (lifestyleScore / 64)

  // 吸烟影响
  const smokingPenalty = smoking.value * 5

  let adjustedVO2 = baseVO2 * lifestyleMultiplier - smokingPenalty

  // BMI影响
  const bmi = weight.value / ((height.value / 100) ** 2)
  if (bmi > 25) {
    adjustedVO2 -= (bmi - 25) * 2
  }

  // 计算心血管年龄
  // 根据VO2max推算年龄
  let fitnessAge

  if (gender.value === 'male') {
    // 男性VO2max参考值：20岁约50ml/kg/min，每10年下降约5ml/kg/min
    const referenceVO2 = 50 - ((age.value - 20) / 10) * 5
    const ageAdjustment = (referenceVO2 - adjustedVO2) / 5 * 10
    fitnessAge = Math.round(age.value + ageAdjustment)
  } else {
    // 女性VO2max参考值：20岁约40ml/kg/min，每10年下降约4ml/kg/min
    const referenceVO2 = 40 - ((age.value - 20) / 10) * 4
    const ageAdjustment = (referenceVO2 - adjustedVO2) / 4 * 10
    fitnessAge = Math.round(age.value + ageAdjustment)
  }

  // 限制范围
  fitnessAge = Math.max(18, Math.min(100, fitnessAge))

  result.value = {
    fitnessAge,
    vo2max: Math.round(adjustedVO2),
    difference: fitnessAge - age.value
  }

  // 默认目标设为比实际年龄小5岁
  if (!targetAge.value) {
    targetAge.value = Math.max(18, age.value - 5)
  }
}

const vo2maxNeeded = computed(() => {
  if (!result.value || !targetAge.value) return 0
  const baseVO2 = result.value.vo2max

  // 反推目标VO2max
  let needed = 0
  const ageDiff = result.value.fitnessAge - targetAge.value

  if (gender.value === 'male') {
    needed = baseVO2 + (ageDiff / 10) * 5
  } else {
    needed = baseVO2 + (ageDiff / 10) * 4
  }

  return Math.round(Math.max(0, needed - baseVO2))
})

const weeksNeeded = computed(() => {
  const needed = vo2maxNeeded.value
  if (needed <= 0) return 0
  // 假设每周可提高1-1.5%的VO2max
  return Math.ceil(needed / (result.value.vo2max * 0.01))
})

function getAssessmentClass(difference) {
  if (difference > 5) return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
  if (difference > 2) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
  if (difference >= -2) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
  if (difference >= -5) return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
  return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
}

function getAssessmentIcon(difference) {
  if (difference > 5) return XCircle
  if (difference > 2) return AlertCircle
  return CheckCircle
}

function getAssessmentText(difference) {
  if (difference > 5) return '心血管年龄偏高'
  if (difference > 2) return '心血管年龄稍高'
  if (difference >= -2) return '心血管年龄正常'
  if (difference >= -5) return '心血管年龄良好'
  return '心血管年龄优秀'
}

function getAssessmentDescription(difference) {
  if (difference > 5) return '您的心血管系统比实际年龄衰老' + difference + '岁，需要立即采取行动改善心血管健康。'
  if (difference > 2) return '您的心血管系统比实际年龄大' + difference + '岁，建议开始改善生活方式。'
  if (difference >= -2) return '您的心血管年龄与实际年龄基本相符，保持当前的健康习惯。'
  if (difference >= -5) return '您的心血管年龄比实际年龄小' + Math.abs(difference) + '岁，心血管健康状况良好。'
  return '您的心血管年龄比实际年龄小' + Math.abs(difference) + '岁以上，心血管健康状况非常优秀！'
}

useSeoMeta({
  title: '心血管fitness年龄评估 - 在线心脏健康年龄计算',
  description: '免费在线心血管年龄评估工具，基于VO2max计算心脏生理年龄，了解心血管健康状况，获得科学改善建议。', keywords: ['心血管年龄', '心脏年龄', 'VO2max', '心血管健康', '心脏健康', 'fitness age', '生理年龄', '健康评估']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('心血管fitness年龄评估')
</script>
