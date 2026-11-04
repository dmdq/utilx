<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">最大摄氧量计算器</h1>
      <p class="text-muted-foreground">计算VO2最大值，评估心肺功能和有氧能力，预测运动表现和健康水平</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：计算工具 -->
      <div class="space-y-4">
        <!-- 计算方法选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity class="w-5 h-5 text-primary" />
            计算方法
          </h2>

          <div class="grid grid-cols-2 gap-2">
            <button
              @click="method = 'resting'"
              :class="['p-3 rounded-lg text-sm', method === 'resting' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
            >
              静息心率法
            </button>
            <button
              @click="method = 'rockport'"
              :class="['p-3 rounded-lg text-sm', method === 'rockport' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
            >
              Rockport步行测试
            </button>
            <button
              @click="method = 'cooper'"
              :class="['p-3 rounded-lg text-sm', method === 'cooper' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
            >
              Cooper跑步测试
            </button>
            <button
              @click="method = 'beep'"
              :class="['p-3 rounded-lg text-sm', method === 'beep' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
            >
              Beep测试
            </button>
          </div>
        </div>

        <!-- 静息心率法 -->
        <div v-if="method === 'resting'" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">静息心率法（Uth Søgaard算法）</h2>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">性别</label>
                <select v-model="gender" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">年龄</label>
                <input v-model.number="age" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="岁">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">静息心率 (bpm)</label>
                <input v-model.number="restingHR" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="早晨测量">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">最大心率 (bpm)</label>
                <input v-model.number="maxHR" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="220-年龄">
              </div>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <p class="font-medium mb-1">测量说明</p>
              <p class="text-muted-foreground">静息心率应在早晨起床后静坐状态下测量，测量多个日子取平均值更准确</p>
            </div>

            <button @click="calculateResting" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm">
              计算VO2max
            </button>
          </div>
        </div>

        <!-- Rockport步行测试 -->
        <div v-if="method === 'rockport'" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">Rockport步行测试</h2>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">性别</label>
                <select v-model="gender" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">年龄</label>
                <input v-model.number="age" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="岁">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">体重 (kg)</label>
                <input v-model.number="weight" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="体重">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">完成时间 (分钟)</label>
                <input v-model.number="walkTime" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="例如: 12.5">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">步行后心率 (bpm)</label>
                <input v-model.number="exerciseHR" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="立即测量">
              </div>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <p class="font-medium mb-1">测试说明</p>
              <p class="text-muted-foreground">以最快速度步行1英里（约1600米），记录完成时间和完成后立即的心率</p>
            </div>

            <button @click="calculateRockport" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm">
              计算VO2max
            </button>
          </div>
        </div>

        <!-- Cooper跑步测试 -->
        <div v-if="method === 'cooper'" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">Cooper 12分钟跑步测试</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-1 block">性别</label>
              <select v-model="gender" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-1 block">12分钟跑的距离 (米)</label>
              <input v-model.number="distance" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="例如: 2400">
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <p class="font-medium mb-1">测试说明</p>
              <p class="text-muted-foreground">在12分钟内尽可能跑更远的距离，记录总距离（米）。需要在400米跑道或平坦地面进行测试。</p>
            </div>

            <button @click="calculateCooper" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm">
              计算VO2max
            </button>
          </div>
        </div>

        <!-- Beep测试 -->
        <div v-if="method === 'beep'" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">Beep测试（多级往返跑）</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-1 block">性别</label>
              <select v-model="gender" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="male">男性</option>
                <option value="female">女性</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-1 block">达到的等级</label>
              <input v-model.number="beepLevel" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="例如: 10">
            </div>

            <div>
              <label class="text-sm font-medium mb-1 block">该等级的往返次数</label>
              <input v-model.number="beepShuttle" type="number" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="例如: 5">
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <p class="font-medium mb-1">测试说明</p>
              <p class="text-muted-foreground">Beep测试需要音频引导。记录最后一次成功完成的等级和往返次数。</p>
            </div>

            <button @click="calculateBeep" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm">
              计算VO2max
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：结果和参考 -->
      <div class="space-y-4">
        <!-- 计算结果 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy class="w-5 h-5 text-yellow-500" />
            计算结果
          </h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">VO2max</p>
              <p class="text-5xl font-bold text-primary mb-2">{{ result.vo2max }}</p>
              <p class="text-lg">ml/kg/min</p>
            </div>
          </div>

          <!-- 健康评估 -->
          <div class="p-4 rounded-lg mb-4" :class="getFitnessClass(result.level)">
            <div class="flex items-center gap-3">
              <component :is="getFitnessIcon(result.level)" class="w-6 h-6" />
              <div>
                <p class="font-medium">心肺功能等级: {{ result.levelText }}</p>
                <p class="text-sm">{{ result.description }}</p>
              </div>
            </div>
          </div>

          <!-- MET值 -->
          <div class="p-4 bg-muted rounded">
            <div class="flex items-center justify-between">
              <span class="text-sm">代谢当量 (MET)</span>
              <span class="font-bold text-lg">{{ result.met }}</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1">1 MET = 静息时的代谢率，约3.5ml/kg/min</p>
          </div>
        </div>

        <!-- VO2max参考标准 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-500" />
            VO2max参考标准 (ml/kg/min)
          </h2>

          <div class="space-y-4">
            <!-- 男性标准 -->
            <div>
              <p class="text-sm font-medium mb-2 text-blue-600 dark:text-blue-400">男性标准</p>
              <div class="space-y-1 text-sm">
                <div class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span>优秀 (≥52)</span>
                  <span class="font-mono">≥60ml/kg/min</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>良好 (47-51)</span>
                  <span class="font-mono">52-59ml/kg/min</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span>一般 (42-46)</span>
                  <span class="font-mono">45-51ml/kg/min</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <span>较差 (37-41)</span>
                  <span class="font-mono">38-44ml/kg/min</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span>差 (≤36)</span>
                  <span class="font-mono">&lt;38ml/kg/min</span>
                </div>
              </div>
            </div>

            <!-- 女性标准 -->
            <div>
              <p class="text-sm font-medium mb-2 text-pink-600 dark:text-pink-400">女性标准</p>
              <div class="space-y-1 text-sm">
                <div class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span>优秀 (≥44)</span>
                  <span class="font-mono">≥54ml/kg/min</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>良好 (40-43)</span>
                  <span class="font-mono">47-53ml/kg/min</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span>一般 (36-39)</span>
                  <span class="font-mono">42-46ml/kg/min</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <span>较差 (32-35)</span>
                  <span class="font-mono">35-41ml/kg/min</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span>差 (≤31)</span>
                  <span class="font-mono">&lt;35ml/kg/min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 职业运动员参考 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">职业运动员VO2max参考</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <span>公路自行车手</span>
              <span class="font-mono font-medium">70-85 ml/kg/min</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <span>越野滑雪运动员</span>
              <span class="font-mono font-medium">65-85 ml/kg/min</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span>长跑运动员</span>
              <span class="font-mono font-medium">60-80 ml/kg/min</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span>游泳运动员</span>
              <span class="font-mono font-medium">55-70 ml/kg/min</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <span>足球运动员</span>
              <span class="font-mono font-medium">50-65 ml/kg/min</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <span>篮球运动员</span>
              <span class="font-mono font-medium">45-60 ml/kg/min</span>
            </div>
          </div>
        </div>

        <!-- 提高VO2max的方法 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">提高VO2max的方法</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <Zap class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">间歇训练</p>
                <p class="text-muted-foreground">高强度间歇训练(HIIT)是最有效提高VO2max的方法</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Zap class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">长距离慢跑</p>
                <p class="text-muted-foreground">建立有氧基础，每周至少3-4次，每次30分钟以上</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Zap class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">阈值训练</p>
                <p class="text-muted-foreground">在接近乳酸阈值的强度下训练，提高耐力水平</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Zap class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">坚持训练</p>
                <p class="text-muted-foreground">每周训练3-5次，持续6-12周可见明显改善</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 注意事项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">注意事项</h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>测试前确保身体状况良好，避免疲劳或生病时进行测试</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>测试前充分热身，测试后做好整理放松</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>不同测试方法结果可能略有差异，建议使用同一方法追踪进步</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>VO2max受遗传因素影响约50%，但训练可以显著提高</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'
import {
  Activity,
  Trophy,
  ClipboardList,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-vue-next'

const method = ref('resting')
const gender = ref('male')
const age = ref(null)
const weight = ref(null)
const restingHR = ref(null)
const maxHR = ref(null)
const walkTime = ref(null)
const exerciseHR = ref(null)
const distance = ref(null)
const beepLevel = ref(null)
const beepShuttle = ref(null)

const result = ref(null)

function calculateResting() {
  if (!age.value || !restingHR.value || !maxHR.value) {
    alert('请填写完整信息')
    return
  }

  // Uth Søgaard算法
  const hrRatio = (maxHR.value - restingHR.value) / (maxHR.value)
  let vo2max

  if (gender.value === 'male') {
    vo2max = 15.3 * hrRatio + 29
  } else {
    vo2max = 14.7 * hrRatio + 32
  }

  evaluateResult(vo2max)
}

function calculateRockport() {
  if (!age.value || !weight.value || !walkTime.value || !exerciseHR.value) {
    alert('请填写完整信息')
    return
  }

  // Rockport步行测试公式
  let vo2max

  if (gender.value === 'male') {
    vo2max = 132.853 - (0.0769 * weight.value) - (0.3877 * age.value) + (6.315 * 0) - (3.2649 * walkTime.value) - (0.1565 * exerciseHR.value)
  } else {
    vo2max = 132.853 - (0.0769 * weight.value) - (0.3877 * age.value) + (6.315 * 1) - (3.2649 * walkTime.value) - (0.1565 * exerciseHR.value)
  }

  evaluateResult(vo2max)
}

function calculateCooper() {
  if (!distance.value) {
    alert('请输入12分钟跑的距离')
    return
  }

  // Cooper测试公式
  const vo2max = (distance.value - 504.9) / 44.73
  evaluateResult(vo2max)
}

function calculateBeep() {
  if (beepLevel.value === null || beepShuttle.value === null) {
    alert('请填写完整信息')
    return
  }

  // Beep测试估算公式
  const totalShuttles = beepLevel.value * 7 + beepShuttle.value
  let vo2max

  if (gender.value === 'male') {
    vo2max = 34.83 + (totalShuttles * 0.35)
  } else {
    vo2max = 31.23 + (totalShuttles * 0.35)
  }

  evaluateResult(vo2max)
}

function evaluateResult(vo2max) {
  const ageGroup = getAgeGroup()
  const standards = gender.value === 'male' ? maleStandards : femaleStandards
  const standard = standards[ageGroup] || standards['adult']

  let level, levelText, description

  if (vo2max >= standard.excellent) {
    level = 'excellent'
    levelText = '优秀'
    description = '您的心肺功能非常出色，具有很高的有氧运动能力'
  } else if (vo2max >= standard.good) {
    level = 'good'
    levelText = '良好'
    description = '您的心肺功能很好，有良好的有氧运动能力'
  } else if (vo2max >= standard.average) {
    level = 'average'
    levelText = '一般'
    description = '您的心肺功能处于平均水平，建议增加有氧运动'
  } else if (vo2max >= standard.fair) {
    level = 'fair'
    levelText = '较差'
    description = '您的心肺功能偏低，建议开始规律的有氧运动训练'
  } else {
    level = 'poor'
    levelText = '差'
    description = '您的心肺功能较低，建议咨询医生后开始循序渐进的运动'
  }

  result.value = {
    vo2max: vo2max.toFixed(1),
    met: (vo2max / 3.5).toFixed(1),
    level,
    levelText,
    description
  }
}

function getAgeGroup() {
  if (!age.value) return 'adult'
  if (age.value < 20) return 'teen'
  if (age.value < 30) return '20s'
  if (age.value < 40) return '30s'
  if (age.value < 50) return '40s'
  if (age.value < 60) return '50s'
  return '60plus'
}

const maleStandards = {
  teen: { excellent: 60, good: 52, average: 45, fair: 38 },
  '20s': { excellent: 60, good: 52, average: 45, fair: 38 },
  '30s': { excellent: 57, good: 50, average: 43, fair: 37 },
  '40s': { excellent: 54, good: 47, average: 41, fair: 35 },
  '50s': { excellent: 50, good: 44, average: 38, fair: 33 },
  '60plus': { excellent: 47, good: 41, average: 35, fair: 30 },
  adult: { excellent: 52, good: 47, average: 42, fair: 37 }
}

const femaleStandards = {
  teen: { excellent: 54, good: 47, average: 42, fair: 35 },
  '20s': { excellent: 54, good: 47, average: 42, fair: 35 },
  '30s': { excellent: 52, good: 45, average: 40, fair: 34 },
  '40s': { excellent: 49, good: 43, average: 37, fair: 32 },
  '50s': { excellent: 46, good: 40, average: 35, fair: 30 },
  '60plus': { excellent: 43, good: 38, average: 33, fair: 28 },
  adult: { excellent: 44, good: 40, average: 36, fair: 32 }
}

function getFitnessClass(level) {
  switch (level) {
    case 'excellent':
      return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
    case 'good':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    case 'average':
      return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
    case 'fair':
      return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
    case 'poor':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    default:
      return 'bg-muted'
  }
}

function getFitnessIcon(level) {
  switch (level) {
    case 'excellent':
    case 'good':
      return CheckCircle
    case 'average':
      return AlertCircle
    case 'fair':
    case 'poor':
      return XCircle
    default:
      return AlertCircle
  }
}

useSeoMeta({
  title: '最大摄氧量计算器 - 在线VO2max心肺功能评估工具',
  description: '免费在线最大摄氧量计算器，计算VO2max评估心肺功能和有氧能力，支持静息心率法、Rockport测试、Cooper测试等多种方法。', keywords: ['VO2max', '最大摄氧量', '心肺功能', '有氧能力', 'Rockport测试', 'Cooper测试', 'Beep测试', '体能评估', '在线计算器']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('最大摄氧量计算器')
</script>
