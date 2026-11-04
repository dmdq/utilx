<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">皮脂厚度计算器</h1>
      <p class="text-muted-foreground">使用皮脂钳测量数据计算体脂率，支持3点和7点测量法，准确评估身体成分</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和计算 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target class="w-5 h-5 text-primary" />
            输入测量数据
          </h2>

          <div class="space-y-4">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-2 block">性别</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="gender = 'male'"
                    :class="['p-2 rounded-lg text-sm transition-colors', gender === 'male' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                  >
                    男性
                  </button>
                  <button
                    @click="gender = 'female'"
                    :class="['p-2 rounded-lg text-sm transition-colors', gender === 'female' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                  >
                    女性
                  </button>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium mb-2 block">年龄</label>
                <input
                  v-model.number="age"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                  placeholder="岁"
                  @input="calculateBodyFat"
                >
              </div>
            </div>

            <!-- 测量方法选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">测量方法</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="method = '3point'"
                  :class="['p-2 rounded-lg text-sm transition-colors', method === '3point' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  3点法 (Jackson-Pollock)
                </button>
                <button
                  @click="method = '7point'"
                  :class="['p-2 rounded-lg text-sm transition-colors', method === '7point' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  7点法 (Jackson-Pollock)
                </button>
              </div>
            </div>

            <!-- 3点法输入 -->
            <div v-if="method === '3point'" class="space-y-3">
              <div class="p-3 bg-muted rounded">
                <p class="font-medium text-sm mb-2">{{ gender === 'male' ? '男性' : '女性' }}测量部位</p>
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs text-muted-foreground">
                    <span>胸部</span>
                    <span>腹部</span>
                    <span>大腿</span>
                  </div>
                  <div class="flex items-center justify-center text-xs" v-if="gender === 'female'">
                    <span>(女性：三头肌、髂骨上、大腿)</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div v-if="gender === 'male'">
                  <label class="text-sm font-medium mb-1 block">胸部 (mm)</label>
                  <input
                    v-model.number="skinfold.chest"
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div v-else>
                  <label class="text-sm font-medium mb-1 block">三头肌 (mm)</label>
                  <input
                    v-model.number="skinfold.tricep"
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">腹部 (mm)</label>
                  <input
                    v-model.number="skinfold.abdominal"
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">大腿 (mm)</label>
                  <input
                    v-model.number="skinfold.thigh"
                    type="number"
                    step="0.1"
                    min="1"
                    max="50"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
              </div>

              <div v-if="gender === 'female'">
                <label class="text-sm font-medium mb-1 block">髂骨上 (mm)</label>
                <input
                  v-model.number="skinfold.suprailiac"
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                  @input="calculateBodyFat"
                >
              </div>
            </div>

            <!-- 7点法输入 -->
            <div v-if="method === '7point'" class="space-y-3">
              <div class="p-3 bg-muted rounded">
                <p class="font-medium text-sm mb-2">7点测量部位</p>
                <div class="grid grid-cols-4 gap-1 text-xs text-muted-foreground">
                  <span>胸部</span>
                  <span>腹部</span>
                  <span>大腿</span>
                  <span>三头肌</span>
                  <span>肩胛下</span>
                  <span>髂骨上</span>
                  <span>小腿</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium mb-1 block">胸部 (mm)</label>
                  <input
                    v-model.number="skinfold7.chest"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">腹部 (mm)</label>
                  <input
                    v-model.number="skinfold7.abdominal"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">大腿 (mm)</label>
                  <input
                    v-model.number="skinfold7.thigh"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">三头肌 (mm)</label>
                  <input
                    v-model.number="skinfold7.tricep"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">肩胛下 (mm)</label>
                  <input
                    v-model.number="skinfold7.subscapular"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">髂骨上 (mm)</label>
                  <input
                    v-model.number="skinfold7.suprailiac"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-1 block">小腿 (mm)</label>
                  <input
                    v-model.number="skinfold7.calf"
                    type="number"
                    step="0.1"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    @input="calculateBodyFat"
                  >
                </div>
              </div>
            </div>

            <!-- 体重输入（可选） -->
            <div>
              <label class="text-sm font-medium mb-1 block">体重 (可选)</label>
              <div class="flex gap-2">
                <input
                  v-model.number="bodyWeight"
                  type="number"
                  step="0.1"
                  class="flex-1 px-3 py-2 border border-border rounded-lg font-mono text-sm"
                  placeholder="输入体重"
                >
                <select v-model="weightUnit" class="px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 计算结果 -->
        <div v-if="bodyFatResult" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-purple-500" />
            计算结果
          </h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">体脂率</p>
              <p class="text-5xl font-bold text-primary">{{ bodyFatResult.percentage }}%</p>
              <p class="text-sm text-muted-foreground mt-2">{{ bodyFatResult.category }}</p>
            </div>
          </div>

          <!-- 身体成分分析 -->
          <div v-if="bodyWeight" class="space-y-2">
            <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span class="text-sm">脂肪重量</span>
              <span class="font-medium">{{ bodyFatResult.fatWeight }}kg</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span class="text-sm">瘦体重</span>
              <span class="font-medium">{{ bodyFatResult.leanWeight }}kg</span>
            </div>
          </div>

          <!-- 健康评估 -->
          <div class="mt-4 p-4 rounded-lg" :class="getCategoryClass(bodyFatResult.level)">
            <div class="flex items-center gap-3">
              <component :is="getCategoryIcon(bodyFatResult.level)" class="w-6 h-6" />
              <div>
                <p class="font-medium">{{ bodyFatResult.description }}</p>
                <p class="text-sm">{{ bodyFatResult.recommendation }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：测量指南和说明 -->
      <div class="space-y-4">
        <!-- 测量位置图示 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">测量位置指南</h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground mb-1">胸部 (Chest)</p>
              <p class="text-muted-foreground">男性：腋下前斜方肌肌腹；女性：三头肌位置</p>
            </div>
            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground mb-1">腹部 (Abdominal)</p>
              <p class="text-muted-foreground">肚脐旁2-3cm，纵向捏起皮褶</p>
            </div>
            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground mb-1">大腿 (Thigh)</p>
              <p class="text-muted-foreground">大腿前侧，髌骨与腹股沟中点</p>
            </div>
            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground mb-1">三头肌 (Tricep)</p>
              <p class="text-muted-foreground">上臂后侧，肩峰与肘部连线中点</p>
            </div>
            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground mb-1">肩胛下 (Subscapular)</p>
              <p class="text-muted-foreground">肩胛骨下角下方1-2cm，斜向45°</p>
            </div>
            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground mb-1">髂骨上 (Suprailiac)</p>
              <p class="text-muted-foreground">髂前上棘上方，斜向折叠</p>
            </div>
            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground mb-1">小腿 (Calf)</p>
              <p class="text-muted-foreground">小腿后侧内侧，垂直捏起</p>
            </div>
          </div>
        </div>

        <!-- 体脂率标准 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">体脂率健康标准</h2>

          <div class="space-y-3">
            <!-- 男性标准 -->
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium text-sm mb-2">男性标准</p>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between"><span>&lt; 6%</span><span class="text-blue-600">必需脂肪</span></div>
                <div class="flex justify-between"><span>6-14%</span><span class="text-green-600">运动员</span></div>
                <div class="flex justify-between"><span>14-18%</span><span class="text-green-600">健身</span></div>
                <div class="flex justify-between"><span>18-24%</span><span class="text-yellow-600">可接受</span></div>
                <div class="flex justify-between"><span>&gt; 24%</span><span class="text-red-600">过高</span></div>
              </div>
            </div>

            <!-- 女性标准 -->
            <div class="p-3 bg-pink-50 dark:bg-pink-900/20 rounded">
              <p class="font-medium text-sm mb-2">女性标准</p>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between"><span>&lt; 14%</span><span class="text-blue-600">必需脂肪</span></div>
                <div class="flex justify-between"><span>14-21%</span><span class="text-green-600">运动员</span></div>
                <div class="flex justify-between"><span>21-25%</span><span class="text-green-600">健身</span></div>
                <div class="flex justify-between"><span>25-31%</span><span class="text-yellow-600">可接受</span></div>
                <div class="flex justify-between"><span>&gt; 31%</span><span class="text-red-600">过高</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 测量技巧 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb class="w-5 h-5 text-yellow-500" />
            测量技巧
          </h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>使用专业皮脂钳，确保测量精度</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>在身体右侧测量，保持一致性</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>同一位置测量2-3次，取平均值</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>避免在运动后或进食后立即测量</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>捏起皮褶时保持肌肉放松</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>最佳测量时间：早晨起床后</p>
            </div>
          </div>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">相关健康工具</h2>

          <div class="space-y-2">
            <div class="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>体脂率计算器</span>
              <a href="/tools/body-fat-calculator/" class="text-primary hover:underline">计算 &rarr;</a>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>BMI计算器</span>
              <a href="/tools/bmi-calculator/" class="text-primary hover:underline">计算 &rarr;</a>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>基础代谢率</span>
              <a href="/tools/bmr-calculator/" class="text-primary hover:underline">计算 &rarr;</a>
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
import {
  Target,
  PieChart,
  CheckCircle,
  Lightbulb,
  CircleCheck,
  AlertCircle,
  XCircle,
  AlertTriangle
} from 'lucide-vue-next'

const gender = ref('male')
const age = ref(null)
const method = ref('3point')
const bodyWeight = ref(null)
const weightUnit = ref('kg')

const skinfold = ref({
  chest: null,
  abdominal: null,
  thigh: null,
  tricep: null,
  suprailiac: null
})

const skinfold7 = ref({
  chest: null,
  abdominal: null,
  thigh: null,
  tricep: null,
  subscapular: null,
  suprailiac: null,
  calf: null
})

const bodyFatResult = ref(null)

// 计算体脂率 (Jackson-Pollock公式)
function calculateBodyFat() {
  if (!age.value) return

  let sum = 0
  let density = 0
  const genderValue = gender.value === 'male' ? 1 : 0

  if (method.value === '3point') {
    // 3点法
    if (gender.value === 'male') {
      // 男性：胸部、腹部、大腿
      if (!skinfold.value.chest || !skinfold.value.abdominal || !skinfold.value.thigh) return
      sum = skinfold.value.chest + skinfold.value.abdominal + skinfold.value.thigh
      density = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * age.value)
    } else {
      // 女性：三头肌、髂骨上、大腿
      if (!skinfold.value.tricep || !skinfold.value.suprailiac || !skinfold.value.thigh) return
      sum = skinfold.value.tricep + skinfold.value.suprailiac + skinfold.value.thigh
      density = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * age.value)
    }
  } else {
    // 7点法
    const s7 = skinfold7.value
    if (!s7.chest || !s7.abdominal || !s7.thigh || !s7.tricep || !s7.subscapular || !s7.suprailiac || !s7.calf) return
    sum = s7.chest + s7.abdominal + s7.thigh + s7.tricep + s7.subscapular + s7.suprailiac + s7.calf

    if (gender.value === 'male') {
      density = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * age.value)
    } else {
      density = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * age.value)
    }
  }

  // Siri公式计算体脂率
  const bodyFatPercentage = ((4.95 / density) - 4.5) * 100

  // 计算分类
  let level, category, description, recommendation

  if (gender.value === 'male') {
    if (bodyFatPercentage < 6) {
      level = 'essential'
      category = '必需脂肪'
      description = '体脂率过低'
      recommendation = '需要增加健康脂肪摄入'
    } else if (bodyFatPercentage < 14) {
      level = 'athletic'
      category = '运动员水平'
      description = '优秀的身体成分'
      recommendation = '保持当前状态'
    } else if (bodyFatPercentage < 18) {
      level = 'fitness'
      category = '健身水平'
      description = '良好的身体成分'
      recommendation = '继续保持健康生活方式'
    } else if (bodyFatPercentage < 24) {
      level = 'average'
      category = '平均水平'
      description = '可接受的身体成分'
      recommendation = '可适当减少体脂以改善健康'
    } else {
      level = 'obese'
      category = '体脂过高'
      description = '体脂率偏高'
      recommendation = '建议增加运动，控制饮食'
    }
  } else {
    if (bodyFatPercentage < 14) {
      level = 'essential'
      category = '必需脂肪'
      description = '体脂率过低'
      recommendation = '需要增加健康脂肪摄入'
    } else if (bodyFatPercentage < 21) {
      level = 'athletic'
      category = '运动员水平'
      description = '优秀的身体成分'
      recommendation = '保持当前状态'
    } else if (bodyFatPercentage < 25) {
      level = 'fitness'
      category = '健身水平'
      description = '良好的身体成分'
      recommendation = '继续保持健康生活方式'
    } else if (bodyFatPercentage < 31) {
      level = 'average'
      category = '平均水平'
      description = '可接受的身体成分'
      recommendation = '可适当减少体脂以改善健康'
    } else {
      level = 'obese'
      category = '体脂过高'
      description = '体脂率偏高'
      recommendation = '建议增加运动，控制饮食'
    }
  }

  // 计算脂肪重量和瘦体重
  let fatWeight = 0
  let leanWeight = 0

  if (bodyWeight.value) {
    const weightInKg = weightUnit.value === 'lb' ? bodyWeight.value * 0.453592 : bodyWeight.value
    fatWeight = (weightInKg * bodyFatPercentage / 100).toFixed(1)
    leanWeight = (weightInKg - fatWeight).toFixed(1)
  }

  bodyFatResult.value = {
    percentage: bodyFatPercentage.toFixed(1),
    level,
    category,
    description,
    recommendation,
    fatWeight,
    leanWeight
  }
}

function getCategoryClass(level) {
  switch (level) {
    case 'essential':
      return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
    case 'athletic':
    case 'fitness':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    case 'average':
      return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
    case 'obese':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    default:
      return 'bg-muted'
  }
}

function getCategoryIcon(level) {
  switch (level) {
    case 'essential':
      return AlertCircle
    case 'athletic':
    case 'fitness':
      return CircleCheck
    case 'average':
      return AlertTriangle
    case 'obese':
      return XCircle
    default:
      return AlertCircle
  }
}

useSeoMeta({
  title: '皮脂厚度计算器 - 在线体脂率计算工具',
  description: '免费在线皮脂厚度计算器，使用Jackson-Pollock公式，支持3点和7点测量法准确计算体脂率。',
  keywords: ['皮脂厚度', '皮脂钳', '体脂率', 'Jackson-Pollock', '身体成分', '3点法', '7点法', '在线计算器']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('皮脂厚度计算器')
</script>
