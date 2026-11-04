<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">心率计算器</h1>
      <p class="text-muted-foreground mb-6">计算最大心率、目标心率区间，提供科学的运动强度指导</p>
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
                <label class="block text-sm font-medium mb-2">年龄</label>
                <input
                  v-model.number="basicInfo.age"
                  type="number"
                  min="10"
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

            <div>
              <label class="block text-sm font-medium mb-2">静息心率 (次/分)</label>
              <input
                v-model.number="basicInfo.restingHR"
                type="number"
                min="40"
                max="100"
                class="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="70"
              />
              <div class="text-xs text-muted-foreground mt-1">
                晨起安静状态下的心率，不知道可留空使用默认值70
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">最大心率计算公式</label>
              <select v-model="selectedFormula" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="220">220-年龄公式</option>
                <option value="tanaka">田中公式 (208-0.7×年龄)</option>
                <option value="gellish">Gellish公式 (207-0.7×年龄)</option>
                <option value="nesc">NESC公式 (211-0.64×年龄)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">体能水平</label>
              <select v-model="fitnessLevel" class="w-full px-3 py-2 border border-border rounded-lg">
                <option value="beginner">初学者 (很少运动)</option>
                <option value="intermediate">中级 (每周运动3-4次)</option>
                <option value="advanced">高级 (每周运动5-6次)</option>
                <option value="athlete">运动员 (专业训练)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 测量方法 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">心率测量方法</h3>
          <div class="space-y-4">
            <div class="p-3 bg-blue-50 rounded-lg">
              <h4 class="font-medium text-sm text-blue-800 mb-2">手动测量方法：</h4>
              <ol class="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>用食指和中指放在手腕内侧或颈部侧动脉处</li>
                <li>感受脉搏跳动，计数30秒内的搏动次数</li>
                <li>将次数乘以2得到每分钟心率</li>
                <li>测量时保持安静和放松状态</li>
              </ol>
            </div>

            <div class="p-3 bg-green-50 rounded-lg">
              <h4 class="font-medium text-sm text-green-800 mb-2">最佳测量时间：</h4>
              <ul class="text-xs text-green-700 space-y-1">
                <li>• 静息心率：早晨刚起床时</li>
                <li>• 运动心率：运动中或运动后立即测量</li>
                <li>• 恢复心率：运动停止后1分钟、2分钟分别测量</li>
              </ul>
            </div>

            <button @click="calculateHeartRate" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              计算心率区间
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 基础心率数据 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">基础心率数据</h3>
          <div v-if="results.maxHeartRate > 0" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-red-600">{{ results.maxHeartRate }}</div>
                <div class="text-sm text-muted-foreground">最大心率 (次/分)</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-blue-600">{{ results.restingHR }}</div>
                <div class="text-sm text-muted-foreground">静息心率 (次/分)</div>
              </div>
            </div>

            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ results.heartRateReserve }}</div>
              <div class="text-sm text-muted-foreground">心率储备 (次/分)</div>
            </div>

            <div class="p-3 bg-yellow-50 rounded-lg">
              <div class="text-xs text-yellow-800">
                <strong>心率储备：</strong>{{ results.heartRateReserve }}次/分，这是你的最大心率与静息心率的差值，用于更精确地计算目标心率。
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入数据后计算心率数据
          </div>
        </div>

        <!-- 目标心率区间 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">目标心率区间</h3>
          <div v-if="results.zones.length > 0" class="space-y-3">
            <div v-for="zone in results.zones" :key="zone.name"
                 class="p-3 rounded-lg border"
                 :class="getZoneClass(zone)">
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium">{{ zone.name }}</span>
                <span class="text-sm">{{ zone.min }} - {{ zone.max }} 次/分</span>
              </div>
              <div class="text-xs text-muted-foreground mb-2">{{ zone.description }}</div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="h-2 rounded-full transition-all"
                     :style="{
                       width: `${zone.percentage}%`,
                       backgroundColor: zone.color
                     }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 运动强度建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">运动强度建议</h3>
          <div v-if="results.maxHeartRate > 0" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-green-50 rounded-lg">
                <div class="text-sm font-medium text-green-800 mb-1">热身运动</div>
                <div class="text-lg font-semibold text-green-600">{{ results.warmup.min }}-{{ results.warmup.max }} 次/分</div>
                <div class="text-xs text-green-700">运动前5-10分钟</div>
              </div>
              <div class="p-3 bg-blue-50 rounded-lg">
                <div class="text-sm font-medium text-blue-800 mb-1">放松运动</div>
                <div class="text-lg font-semibold text-blue-600">{{ results.coolDown.min }}-{{ results.coolDown.max }} 次/分</div>
                <div class="text-xs text-blue-700">运动后5-10分钟</div>
              </div>
            </div>

            <div class="p-3 bg-orange-50 rounded-lg">
              <div class="text-sm font-medium text-orange-800 mb-2">主要运动区间</div>
              <div class="space-y-2">
                <div v-for="recommendation in getFitnessRecommendations()"
                     :key="recommendation.type"
                     class="flex items-start">
                  <span class="text-orange-600 mr-2">•</span>
                  <div>
                    <div class="font-medium text-sm">{{ recommendation.title }}</div>
                    <div class="text-xs text-orange-700">{{ recommendation.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 心率健康提示 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">心率健康提示</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start">
              <span class="text-red-600 mr-2">⚠️</span>
              <span>运动时心率不应超过最大心率的85%，除非在专业指导下</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">✓</span>
              <span>经常运动的人静息心率会降低，这是心肺功能改善的表现</span>
            </div>
            <div class="flex items-start">
              <span class="text-blue-600 mr-2">💡</span>
              <span>使用心率监测设备可以更准确地跟踪运动强度</span>
            </div>
            <div class="flex items-start">
              <span class="text-purple-600 mr-2">📊</span>
              <span>不同运动类型可能需要不同的心率区间，请根据运动类型调整</span>
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
setPageTitle('心率计算器')

// 基本信息
const basicInfo = ref({
  age: 30,
  gender: 'male',
  restingHR: 70
})

// 计算公式
const selectedFormula = ref('220')

// 体能水平
const fitnessLevel = ref('intermediate')

// 计算结果
const results = ref({
  maxHeartRate: 0,
  restingHR: 70,
  heartRateReserve: 0,
  zones: [],
  warmup: { min: 0, max: 0 },
  coolDown: { min: 0, max: 0 }
})

// 计算心率
const calculateHeartRate = () => {
  const { age, restingHR } = basicInfo.value

  // 计算最大心率
  let maxHeartRate = 0
  switch (selectedFormula.value) {
    case 'tanaka':
      maxHeartRate = Math.round(208 - 0.7 * age)
      break
    case 'gellish':
      maxHeartRate = Math.round(207 - 0.7 * age)
      break
    case 'nesc':
      maxHeartRate = Math.round(211 - 0.64 * age)
      break
    default:
      maxHeartRate = 220 - age
  }

  // 心率储备
  const heartRateReserve = maxHeartRate - restingHR

  // 计算目标心率区间（Karvonen公式：目标心率 = (最大心率 - 静息心率) × 强度百分比 + 静息心率）
  const zones = [
    {
      name: '恢复区',
      description: '放松恢复，促进血液循环',
      min: Math.round(heartRateReserve * 0.5 + restingHR),
      max: Math.round(heartRateReserve * 0.6 + restingHR),
      percentage: 60,
      color: '#3b82f6'
    },
    {
      name: '有氧基础区',
      description: '燃脂最佳区间，提高耐力',
      min: Math.round(heartRateReserve * 0.6 + restingHR),
      max: Math.round(heartRateReserve * 0.7 + restingHR),
      percentage: 70,
      color: '#10b981'
    },
    {
      name: '有氧进阶区',
      description: '提高心肺功能，增强耐力',
      min: Math.round(heartRateReserve * 0.7 + restingHR),
      max: Math.round(heartRateReserve * 0.8 + restingHR),
      percentage: 80,
      color: '#f59e0b'
    },
    {
      name: '乳酸阈值区',
      description: '提高运动表现，增强速度',
      min: Math.round(heartRateReserve * 0.8 + restingHR),
      max: Math.round(heartRateReserve * 0.9 + restingHR),
      percentage: 90,
      color: '#ef4444'
    },
    {
      name: '无氧区',
      description: '最大强度训练，短时间爆发',
      min: Math.round(heartRateReserve * 0.9 + restingHR),
      max: maxHeartRate,
      percentage: 100,
      color: '#7c3aed'
    }
  ]

  // 热身和放松区间
  const warmup = {
    min: Math.round(heartRateReserve * 0.5 + restingHR),
    max: Math.round(heartRateReserve * 0.6 + restingHR)
  }

  const coolDown = {
    min: Math.round(heartRateReserve * 0.4 + restingHR),
    max: Math.round(heartRateReserve * 0.5 + restingHR)
  }

  results.value = {
    maxHeartRate,
    restingHR,
    heartRateReserve,
    zones,
    warmup,
    coolDown
  }
}

// 获取区间样式
const getZoneClass = (zone) => {
  if (zone.name === '恢复区') return 'border-blue-200 bg-blue-50'
  if (zone.name === '有氧基础区') return 'border-green-200 bg-green-50'
  if (zone.name === '有氧进阶区') return 'border-yellow-200 bg-yellow-50'
  if (zone.name === '乳酸阈值区') return 'border-red-200 bg-red-50'
  if (zone.name === '无氧区') return 'border-purple-200 bg-purple-50'
  return 'border-gray-200 bg-gray-50'
}

// 获取体能水平建议
const getFitnessRecommendations = () => {
  const recommendations = []

  switch (fitnessLevel.value) {
    case 'beginner':
      recommendations.push({
        type: 'fat-burn',
        title: '减脂训练 (60-70%)',
        description: '每周3-4次，每次30-45分钟的有氧运动'
      })
      recommendations.push({
        type: 'endurance',
        title: '基础耐力 (70-80%)',
        description: '每周2-3次，每次20-30分钟的中等强度运动'
      })
      break
    case 'intermediate':
      recommendations.push({
        type: 'fat-burn',
        title: '减脂训练 (60-70%)',
        description: '每周3-4次，每次45-60分钟的有氧运动'
      })
      recommendations.push({
        type: 'endurance',
        title: '耐力提升 (70-80%)',
        description: '每周3-4次，每次30-45分钟的中等强度运动'
      })
      recommendations.push({
        type: 'performance',
        title: '表现提升 (80-85%)',
        description: '每周1-2次，每次20-30分钟的高强度间歇训练'
      })
      break
    case 'advanced':
      recommendations.push({
        type: 'endurance',
        title: '耐力训练 (70-80%)',
        description: '每周4-5次，每次60分钟以上的长时间有氧'
      })
      recommendations.push({
        type: 'performance',
        title: '竞技训练 (80-90%)',
        description: '每周2-3次，每次30-45分钟的高强度训练'
      })
      break
    case 'athlete':
      recommendations.push({
        type: 'performance',
        title: '专项训练 (80-90%)',
        description: '根据运动项目进行专项强度训练'
      })
      recommendations.push({
        type: 'max-intensity',
        title: '峰值训练 (90-100%)',
        description: '阶段性最大强度训练，提高运动表现上限'
      })
      break
  }

  return recommendations
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