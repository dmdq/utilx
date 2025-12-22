<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">睡眠质量计算器</h1>
      <p class="text-muted-foreground mb-6">评估睡眠质量和效率，分析睡眠 debt 和提供改善建议</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：睡眠数据输入 -->
      <div class="space-y-6">
        <!-- 基本信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">睡眠基本信息</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">年龄</label>
                <input
                  v-model.number="sleepInfo.age"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">就寝时间</label>
                <input
                  v-model="sleepInfo.bedtime"
                  type="time"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">起床时间</label>
                <input
                  v-model="sleepInfo.wakeTime"
                  type="time"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">实际睡眠时长 (小时)</label>
                <input
                  v-model.number="sleepInfo.actualSleep"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="7.5"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">睡眠质量评分 (1-10)</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="sleepInfo.qualityScore"
                  type="range"
                  min="1"
                  max="10"
                  class="flex-1"
                />
                <span class="w-12 text-center font-medium">{{ sleepInfo.qualityScore }}</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                1=很差，10=极好
              </div>
            </div>
          </div>
        </div>

        <!-- 睡眠模式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">睡眠模式</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">入睡时间 (分钟)</label>
              <input
                v-model.number="sleepInfo.sleepLatency"
                type="number"
                min="0"
                max="120"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="15"
              />
              <div class="text-xs text-muted-foreground mt-1">
                从关灯到入睡所需时间，正常范围15-20分钟
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">夜间觉醒次数</label>
              <input
                v-model.number="sleepInfo.awakenings"
                type="number"
                min="0"
                max="20"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="1"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">清醒时间 (分钟)</label>
              <input
                v-model.number="sleepInfo.wakeTime"
                type="number"
                min="0"
                max="300"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="10"
              />
              <div class="text-xs text-muted-foreground mt-1">
                夜间清醒的总时间
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">是否午睡</label>
                <select v-model="sleepInfo.nap" class="w-full px-3 py-2 border rounded-lg">
                  <option value="no">不午睡</option>
                  <option value="short">短午睡(≤30分钟)</option>
                  <option value="long">长午睡(>30分钟)</option>
                </select>
              </div>
              <div v-if="sleepInfo.nap !== 'no'">
                <label class="block text-sm font-medium mb-2">午睡时长 (分钟)</label>
                <input
                  v-model.number="sleepInfo.napDuration"
                  type="number"
                  min="5"
                  max="180"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 睡眠习惯 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">睡眠习惯</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="sleepInfo.regularSchedule"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">保持规律作息</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="sleepInfo.darkRoom"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">睡眠环境黑暗安静</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="sleepInfo.noDevices"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">睡前不使用电子设备</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="sleepInfo.noCaffeine"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">睡前6小时不摄入咖啡因</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="sleepInfo.exercise"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">规律运动</span>
            </label>
          </div>

          <button @click="calculateSleepQuality" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 mt-4">
            评估睡眠质量
          </button>
        </div>
      </div>

      <!-- 右侧：评估结果 -->
      <div class="space-y-6">
        <!-- 睡眠质量评分 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">睡眠质量评估</h3>
          <div v-if="results.totalScore > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-5xl font-bold mb-2" :class="getScoreClass(results.totalScore)">
                {{ results.totalScore }}
              </div>
              <div class="text-lg">{{ getQualityLevel(results.totalScore) }}</div>
              <div class="text-sm text-muted-foreground">睡眠质量评分 (满分100)</div>
            </div>

            <!-- 各项评分 -->
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>时长评分</span>
                  <span>{{ results.durationScore }}/30</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-blue-500 h-2 rounded-full" :style="{ width: `${(results.durationScore / 30) * 100}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>效率评分</span>
                  <span>{{ results.efficiencyScore }}/30</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" :style="{ width: `${(results.efficiencyScore / 30) * 100}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>规律评分</span>
                  <span>{{ results.regularityScore }}/20</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-purple-500 h-2 rounded-full" :style="{ width: `${(results.regularityScore / 20) * 100}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>习惯评分</span>
                  <span>{{ results.habitsScore }}/20</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="bg-orange-500 h-2 rounded-full" :style="{ width: `${(results.habitsScore / 20) * 100}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入睡眠数据后评估睡眠质量
          </div>
        </div>

        <!-- 睡眠建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">改善建议</h3>
          <div v-if="results.totalScore > 0" class="space-y-3">
            <div v-for="suggestion in getSleepSuggestions()" :key="suggestion.type"
                 class="p-3 rounded-lg" :class="getSuggestionClass(suggestion.priority)">
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

        <!-- 睡眠 debt 分析 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">睡眠 debt 分析</h3>
          <div v-if="results.sleepDebt > 0" class="space-y-4">
            <div class="text-center">
              <div class="text-3xl font-bold text-orange-600">{{ results.sleepDebt }}</div>
              <div class="text-sm text-muted-foreground">累计睡眠 debt (小时)</div>
            </div>

            <div class="p-3 bg-orange-50 rounded-lg">
              <div class="text-sm text-orange-800">
                <strong>睡眠 debt 说明：</strong>{{ getSleepDebtDescription(results.sleepDebt) }}
              </div>
            </div>

            <div class="p-3 bg-blue-50 rounded-lg">
              <div class="text-sm font-medium text-blue-800 mb-2">补觉建议：</div>
              <div class="text-xs text-blue-700">
                {{ getRecoveryPlan(results.sleepDebt) }}
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            无明显睡眠 debt
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
setPageTitle('睡眠质量计算器')

// 睡眠信息
const sleepInfo = ref({
  age: 30,
  bedtime: '23:00',
  wakeTime: '07:00',
  actualSleep: 7.5,
  qualityScore: 7,
  sleepLatency: 15,
  awakenings: 1,
  wakeDuration: 10,
  nap: 'no',
  napDuration: 0,
  regularSchedule: false,
  darkRoom: false,
  noDevices: false,
  noCaffeine: false,
  exercise: false
})

// 计算结果
const results = ref({
  totalScore: 0,
  durationScore: 0,
  efficiencyScore: 0,
  regularityScore: 0,
  habitsScore: 0,
  sleepDebt: 0,
  recommendedSleep: 8
})

// 计算睡眠质量
const calculateSleepQuality = () => {
  const { age, actualSleep, qualityScore, sleepLatency, awakenings, wakeDuration, napDuration } = sleepInfo.value

  // 推荐睡眠时长
  let recommendedSleep = 8
  if (age < 18) recommendedSleep = 9
  else if (age < 26) recommendedSleep = 8
  else if (age < 65) recommendedSleep = 7.5
  else recommendedSleep = 7

  // 时长评分 (30分)
  const durationScore = Math.max(0, Math.min(30, (actualSleep / recommendedSleep) * 30))

  // 效率评分 (30分)
  const totalBedTime = actualSleep + (sleepLatency / 60) + (wakeDuration / 60)
  const sleepEfficiency = (actualSleep / totalBedTime) * 100
  let efficiencyScore = (sleepEfficiency / 100) * 30

  // 入睡时间调整
  if (sleepLatency <= 20) efficiencyScore += 2
  else if (sleepLatency > 30) efficiencyScore -= 5

  // 夜间觉醒调整
  if (awakenings === 0) efficiencyScore += 3
  else if (awakenings >= 3) efficiencyScore -= 5

  // 规律评分 (20分)
  let regularityScore = 0
  if (sleepInfo.value.regularSchedule) regularityScore += 10
  if (napDuration === 0 || napDuration <= 30) regularityScore += 5
  if (sleepLatency <= 20) regularityScore += 5

  // 习惯评分 (20分)
  let habitsScore = 0
  if (sleepInfo.value.darkRoom) habitsScore += 5
  if (sleepInfo.value.noDevices) habitsScore += 5
  if (sleepInfo.value.noCaffeine) habitsScore += 5
  if (sleepInfo.value.exercise) habitsScore += 5

  // 主观评分调整
  const qualityAdjustment = (qualityScore - 5) * 2

  const totalScore = Math.round(Math.max(0, Math.min(100,
    durationScore + efficiencyScore + regularityScore + habitsScore + qualityAdjustment)))

  // 睡眠 debt 计算
  const sleepDebt = Math.max(0, recommendedSleep - actualSleep + (napDuration > 60 ? napDuration / 60 : 0))

  results.value = {
    totalScore,
    durationScore: Math.round(durationScore),
    efficiencyScore: Math.round(efficiencyScore),
    regularityScore: Math.round(regularityScore),
    habitsScore: Math.round(habitsScore),
    sleepDebt: Math.round(sleepDebt * 10) / 10,
    recommendedSleep
  }
}

// 获取评分样式
const getScoreClass = (score) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

// 获取质量等级
const getQualityLevel = (score) => {
  if (score >= 80) return '优秀'
  if (score >= 60) return '良好'
  if (score >= 40) return '一般'
  if (score >= 20) return '较差'
  return '很差'
}

// 获取睡眠建议
const getSleepSuggestions = () => {
  const suggestions = []
  const { actualSleep, sleepLatency, awakenings } = sleepInfo.value

  if (actualSleep < 7) {
    suggestions.push({
      type: 'duration',
      priority: 'high',
      icon: '⚠️',
      title: '增加睡眠时长',
      description: '建议每晚睡眠7-9小时，保证充足的休息时间'
    })
  }

  if (sleepLatency > 30) {
    suggestions.push({
      type: 'latency',
      priority: 'high',
      icon: '😴',
      title: '改善入睡困难',
      description: '建立睡前放松仪式，避免睡前使用电子设备'
    })
  }

  if (awakenings >= 3) {
    suggestions.push({
      type: 'awakenings',
      priority: 'medium',
      icon: '🌙',
      title: '减少夜间觉醒',
      description: '保持卧室安静黑暗，避免睡前大量饮水'
    })
  }

  if (!sleepInfo.value.regularSchedule) {
    suggestions.push({
      type: 'schedule',
      priority: 'high',
      icon: '⏰',
      title: '保持规律作息',
      description: '每天同一时间就寝和起床，包括周末'
    })
  }

  if (sleepInfo.value.nap === 'long') {
    suggestions.push({
      type: 'nap',
      priority: 'medium',
      icon: '💤',
      title: '调整午睡习惯',
      description: '午睡时间控制在30分钟内，避免影响夜间睡眠'
    })
  }

  if (!sleepInfo.value.darkRoom) {
    suggestions.push({
      type: 'environment',
      priority: 'medium',
      icon: '🌃',
      title: '优化睡眠环境',
      description: '保持卧室黑暗、安静、凉爽，使用遮光窗帘'
    })
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

// 获取建议样式
const getSuggestionClass = (priority) => {
  if (priority === 'high') return 'bg-red-50 border-red-200'
  if (priority === 'medium') return 'bg-yellow-50 border-yellow-200'
  return 'bg-blue-50 border-blue-200'
}

// 获取睡眠 debt 描述
const getSleepDebtDescription = (debt) => {
  if (debt < 1) return '睡眠 debt 较少，基本能满足睡眠需求'
  if (debt < 5) return '有轻微睡眠 debt，建议适当增加睡眠时间'
  if (debt < 10) return '睡眠 debt 中等，需要调整作息，保证充足睡眠'
  if (debt < 20) return '睡眠 debt 严重，建议咨询医生，制定改善计划'
  return '睡眠 debt 非常严重，可能影响健康，请立即就医'
}

// 获取恢复计划
const getRecoveryPlan = (debt) => {
  if (debt < 1) return '保持当前睡眠习惯即可'
  if (debt < 5) return `每天增加${Math.ceil(debt * 7 / 5)}分钟睡眠，约1周可补足`
  if (debt < 10) return `每天增加${Math.ceil(debt * 7 / 10)}分钟睡眠，约2周可补足`
  return `需要${Math.ceil(debt / 2)}周每天增加1小时睡眠才能补足`
}
</script>

<style scoped>
input[type="number"],
input[type="time"],
select {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="number"]:focus,
input[type="time"]:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}
</style>