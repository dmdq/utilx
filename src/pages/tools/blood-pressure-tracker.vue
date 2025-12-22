<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">血压健康评估</h1>
      <p class="text-muted-foreground mb-6">血压记录和健康评估，提供血压分类、趋势分析和健康建议</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：血压数据输入 -->
      <div class="space-y-6">
        <!-- 血压测量输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">血压测量</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">收缩压 (mmHg)</label>
                <input
                  v-model.number="currentReading.systolic"
                  type="number"
                  min="60"
                  max="250"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="120"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">舒张压 (mmHg)</label>
                <input
                  v-model.number="currentReading.diastolic"
                  type="number"
                  min="40"
                  max="150"
                  class="w-full px-3 py-2 border rounded-lg"
                  placeholder="80"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">心率 (次/分)</label>
              <input
                v-model.number="currentReading.heartRate"
                type="number"
                min="40"
                max="200"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="72"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">测量时间</label>
                <input
                  v-model="currentReading.time"
                  type="time"
                  class="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">测量状态</label>
                <select v-model="currentReading.state" class="w-full px-3 py-2 border rounded-lg">
                  <option value="resting">静息状态</option>
                  <option value="after-exercise">运动后</option>
                  <option value="after-meal">餐后</option>
                  <option value="stressed">紧张状态</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">备注</label>
              <textarea
                v-model="currentReading.notes"
                class="w-full px-3 py-2 border rounded-lg"
                rows="2"
                placeholder="测量时的特殊情况或症状"
              ></textarea>
            </div>

            <button @click="addReading" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              添加测量记录
            </button>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">历史记录</h3>
            <button
              @click="clearHistory"
              class="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm"
            >
              清空记录
            </button>
          </div>
          <div class="space-y-2 max-h-80 overflow-y-auto">
            <div v-if="readings.length === 0" class="text-center text-muted-foreground py-4">
              暂无测量记录
            </div>
            <div v-for="(reading, index) in readings" :key="index"
                 class="p-3 bg-secondary rounded-lg text-sm">
              <div class="flex justify-between items-start">
                <div>
                  <span class="font-semibold">{{ reading.systolic }}/{{ reading.diastolic }} mmHg</span>
                  <span class="text-muted-foreground ml-2">{{ reading.heartRate }}次/分</span>
                </div>
                <span class="text-xs text-muted-foreground">{{ reading.date }} {{ reading.time }}</span>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-xs" :class="getCategoryClass(getCategory(reading.systolic, reading.diastolic))">
                  {{ getCategoryName(getCategory(reading.systolic, reading.diastolic)) }}
                </span>
                <span class="text-xs text-muted-foreground">{{ getStateText(reading.state) }}</span>
              </div>
              <div v-if="reading.notes" class="text-xs text-muted-foreground mt-1">
                备注：{{ reading.notes }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：评估结果 -->
      <div class="space-y-6">
        <!-- 当前评估 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">当前评估结果</h3>
          <div v-if="currentAssessment.category" class="space-y-4">
            <div class="text-center">
              <div class="text-4xl font-bold mb-2" :class="getAssessmentColorClass()">
                {{ currentReading.systolic }}/{{ currentReading.diastolic }}
              </div>
              <div class="text-lg text-muted-foreground">mmHg</div>
              <div class="text-lg font-medium mt-2" :class="getCategoryClass(currentAssessment.category)">
                {{ getCategoryName(currentAssessment.category) }}
              </div>
            </div>

            <!-- 风险评估 -->
            <div class="p-4 rounded-lg" :class="getRiskClass(currentAssessment.risk)">
              <div class="flex items-center mb-2">
                <span class="font-medium">心血管风险等级：</span>
                <span class="ml-2" :class="getRiskTextClass(currentAssessment.risk)">
                  {{ getRiskText(currentAssessment.risk) }}
                </span>
              </div>
              <div class="text-sm text-muted-foreground">{{ currentAssessment.advice }}</div>
            </div>

            <!-- 平均值统计 -->
            <div v-if="readings.length > 0" class="grid grid-cols-3 gap-3">
              <div class="text-center p-3 bg-secondary rounded">
                <div class="text-lg font-semibold">{{ averageValues.systolic }}</div>
                <div class="text-xs text-muted-foreground">平均收缩压</div>
              </div>
              <div class="text-center p-3 bg-secondary rounded">
                <div class="text-lg font-semibold">{{ averageValues.diastolic }}</div>
                <div class="text-xs text-muted-foreground">平均舒张压</div>
              </div>
              <div class="text-center p-3 bg-secondary rounded">
                <div class="text-lg font-semibold">{{ averageValues.heartRate }}</div>
                <div class="text-xs text-muted-foreground">平均心率</div>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入血压数据进行评估
          </div>
        </div>

        <!-- 血压分类标准 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">血压分类标准</h3>
          <div class="space-y-3">
            <div v-for="category in bloodPressureCategories" :key="category.name"
                 class="p-3 rounded-lg border"
                 :class="getCategoryStandardClass(category.level)">
              <div class="flex justify-between items-center">
                <span class="font-medium">{{ category.name }}</span>
                <span class="text-sm">{{ category.systolic }}/{{ category.diastolic }} mmHg</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">{{ category.description }}</div>
            </div>
          </div>
        </div>

        <!-- 健康建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">健康建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>建议每日早晚各测量一次血压，测量前休息5分钟</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>测量时保持坐位，手臂与心脏同高，背部支撑</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>避免测量前30分钟内运动、吸烟、饮用咖啡或酒精</span>
            </div>
            <div class="flex items-start">
              <span class="text-green-600 mr-2">•</span>
              <span>定期记录血压数据，观察变化趋势，及时就医咨询</span>
            </div>
            <div class="flex items-start">
              <span class="text-red-600 mr-2">⚠️</span>
              <span>收缩压≥180或舒张压≥120时，请立即就医</span>
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
setPageTitle('血压健康评估')

// 当前血压读数
const currentReading = ref({
  systolic: 120,
  diastolic: 80,
  heartRate: 72,
  time: new Date().toTimeString().slice(0, 5),
  state: 'resting',
  notes: ''
})

// 历史记录
const readings = ref([])

// 血压分类标准
const bloodPressureCategories = [
  {
    name: '低血压',
    systolic: '<90',
    diastolic: '<60',
    level: 'low',
    description: '血压偏低，可能出现头晕、乏力等症状'
  },
  {
    name: '正常血压',
    systolic: '90-120',
    diastolic: '60-80',
    level: 'normal',
    description: '理想的血压水平，心血管风险较低'
  },
  {
    name: '正常高值',
    systolic: '120-129',
    diastolic: '80-84',
    level: 'elevated',
    description: '血压偏高，需要关注生活方式'
  },
  {
    name: '高血压1期',
    systolic: '130-139',
    diastolic: '85-89',
    level: 'stage1',
    description: '轻度高血压，建议改变生活方式'
  },
  {
    name: '高血压2期',
    systolic: '140-179',
    diastolic: '90-119',
    level: 'stage2',
    description: '中度高血压，需要药物治疗'
  },
  {
    name: '高血压危象',
    systolic: '≥180',
    diastolic: '≥120',
    level: 'crisis',
    description: '严重高血压，需要立即就医'
  }
]

// 当前评估结果
const currentAssessment = computed(() => {
  if (!currentReading.value.systolic || !currentReading.value.diastolic) {
    return {}
  }

  const category = getCategory(currentReading.value.systolic, currentReading.value.diastolic)
  const risk = getRiskLevel(currentReading.value.systolic, currentReading.value.diastolic)

  return {
    category,
    risk,
    advice: getMedicalAdvice(category, risk)
  }
})

// 平均值计算
const averageValues = computed(() => {
  if (readings.value.length === 0) {
    return { systolic: 0, diastolic: 0, heartRate: 0 }
  }

  const sum = readings.value.reduce((acc, reading) => ({
    systolic: acc.systolic + reading.systolic,
    diastolic: acc.diastolic + reading.diastolic,
    heartRate: acc.heartRate + reading.heartRate
  }), { systolic: 0, diastolic: 0, heartRate: 0 })

  const count = readings.value.length
  return {
    systolic: Math.round(sum.systolic / count),
    diastolic: Math.round(sum.diastolic / count),
    heartRate: Math.round(sum.heartRate / count)
  }
})

// 获取血压分类
const getCategory = (systolic, diastolic) => {
  if (systolic < 90 || diastolic < 60) return 'low'
  if (systolic < 120 && diastolic < 80) return 'normal'
  if (systolic < 130 && diastolic < 85) return 'elevated'
  if (systolic < 140 || diastolic < 90) return 'stage1'
  if (systolic < 180 || diastolic < 120) return 'stage2'
  return 'crisis'
}

// 获取风险等级
const getRiskLevel = (systolic, diastolic) => {
  if (systolic >= 180 || diastolic >= 120) return 'very-high'
  if (systolic >= 140 || diastolic >= 90) return 'high'
  if (systolic >= 130 || diastolic >= 85) return 'moderate'
  if (systolic >= 120 || diastolic >= 80) return 'low'
  return 'optimal'
}

// 添加读数
const addReading = () => {
  const reading = {
    ...currentReading.value,
    date: new Date().toLocaleDateString('zh-CN'),
    timestamp: new Date().getTime()
  }
  readings.value.unshift(reading)

  // 限制历史记录数量
  if (readings.value.length > 50) {
    readings.value = readings.value.slice(0, 50)
  }

  // 清空输入
  currentReading.value.notes = ''
}

// 清空历史记录
const clearHistory = () => {
  if (confirm('确定要清空所有测量记录吗？')) {
    readings.value = []
  }
}

// 获取分类名称
const getCategoryName = (category) => {
  const categoryMap = {
    'low': '低血压',
    'normal': '正常血压',
    'elevated': '正常高值',
    'stage1': '高血压1期',
    'stage2': '高血压2期',
    'crisis': '高血压危象'
  }
  return categoryMap[category] || '未知'
}

// 获取分类样式
const getCategoryClass = (category) => {
  if (category === 'low') return 'text-blue-600'
  if (category === 'normal') return 'text-green-600'
  if (category === 'elevated') return 'text-yellow-600'
  if (category === 'stage1') return 'text-orange-600'
  if (category === 'stage2') return 'text-red-600'
  if (category === 'crisis') return 'text-red-800 font-bold'
  return 'text-gray-600'
}

// 获取分类标准样式
const getCategoryStandardClass = (level) => {
  if (level === 'low') return 'border-blue-200 bg-blue-50'
  if (level === 'normal') return 'border-green-200 bg-green-50'
  if (level === 'elevated') return 'border-yellow-200 bg-yellow-50'
  if (level === 'stage1') return 'border-orange-200 bg-orange-50'
  if (level === 'stage2') return 'border-red-200 bg-red-50'
  if (level === 'crisis') return 'border-red-300 bg-red-100'
  return 'border-gray-200 bg-gray-50'
}

// 获取评估颜色
const getAssessmentColorClass = () => {
  if (!currentReading.value.systolic) return 'text-gray-600'
  const category = getCategory(currentReading.value.systolic, currentReading.value.diastolic)
  return getCategoryClass(category)
}

// 获取风险等级样式
const getRiskClass = (risk) => {
  if (risk === 'optimal') return 'bg-green-50 border-green-200'
  if (risk === 'low') return 'bg-blue-50 border-blue-200'
  if (risk === 'moderate') return 'bg-yellow-50 border-yellow-200'
  if (risk === 'high') return 'bg-orange-50 border-orange-200'
  if (risk === 'very-high') return 'bg-red-50 border-red-200'
  return 'bg-gray-50 border-gray-200'
}

// 获取风险文本
const getRiskText = (risk) => {
  const riskMap = {
    'optimal': '极低风险',
    'low': '低风险',
    'moderate': '中等风险',
    'high': '高风险',
    'very-high': '极高风险'
  }
  return riskMap[risk] || '未知风险'
}

// 获取风险文本样式
const getRiskTextClass = (risk) => {
  if (risk === 'optimal') return 'text-green-600'
  if (risk === 'low') return 'text-blue-600'
  if (risk === 'moderate') return 'text-yellow-600'
  if (risk === 'high') return 'text-orange-600'
  if (risk === 'very-high') return 'text-red-600 font-bold'
  return 'text-gray-600'
}

// 获取医疗建议
const getMedicalAdvice = (category, risk) => {
  const adviceMap = {
    'low': '血压偏低，注意补充水分和营养，避免突然站立',
    'normal': '血压正常，继续保持健康的生活方式',
    'elevated': '血压偏高，建议减少盐分摄入，增加运动',
    'stage1': '轻度高血压，建议咨询医生，可能需要药物治疗',
    'stage2': '中度高血压，必须就医治疗，配合生活方式改变',
    'crisis': '高血压危象，立即就医或拨打急救电话'
  }
  return adviceMap[category] || '请咨询医生获取专业建议'
}

// 获取状态文本
const getStateText = (state) => {
  const stateMap = {
    'resting': '静息',
    'after-exercise': '运动后',
    'after-meal': '餐后',
    'stressed': '紧张'
  }
  return stateMap[state] || '未知'
}
</script>

<style scoped>
input[type="number"],
input[type="time"],
select,
textarea {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="number"]:focus,
input[type="time"]:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>