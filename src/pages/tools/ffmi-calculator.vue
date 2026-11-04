<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">瘦体重指数计算器</h1>
      <p class="text-muted-foreground">计算FFMI评估肌肉发达程度，排除脂肪干扰，更准确反映身材水平</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和计算 -->
      <div class="space-y-4">
        <!-- 基本信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Dumbbell class="w-5 h-5 text-primary" />
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
              <label class="text-sm font-medium mb-2 block">体脂率 (%)</label>
              <input
                v-model.number="bodyFat"
                type="number"
                step="0.1"
                min="0"
                max="50"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="输入体脂率"
              >
              <p class="text-xs text-muted-foreground mt-1">可使用体脂率计算器获得准确值</p>
            </div>
          </div>
        </div>

        <!-- 计算按钮 -->
        <button
          @click="calculateFFMI"
          class="w-full px-4 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-lg font-medium"
        >
          <Dumbbell class="w-5 h-5 inline mr-2" />
          计算FFMI
        </button>
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
              <p class="text-sm text-muted-foreground mb-2">瘦体重指数 (FFMI)</p>
              <p class="text-6xl font-bold text-primary mb-2">{{ result.ffmi }}</p>
              <p class="text-lg">kg/m²</p>
            </div>
          </div>

          <!-- 详细数据 -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="p-3 bg-muted rounded text-center">
              <p class="text-xs text-muted-foreground">去脂体重</p>
              <p class="text-xl font-bold">{{ result.leanMass }} kg</p>
            </div>
            <div class="p-3 bg-muted rounded text-center">
              <p class="text-xs text-muted-foreground">调整后FFMI</p>
              <p class="text-xl font-bold">{{ result.adjustedFFMI }}</p>
            </div>
          </div>

          <!-- 水平评估 -->
          <div class="p-4 rounded-lg mb-4" :class="getLevelClass(result.level)">
            <div class="flex items-center gap-3">
              <component :is="getLevelIcon(result.level)" class="w-6 h-6" />
              <div>
                <p class="font-medium">{{ result.levelText }}</p>
                <p class="text-sm">{{ result.description }}</p>
              </div>
            </div>
          </div>

          <!-- 肌肉潜力 -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p class="text-sm font-medium mb-2">肌肉潜力分析</p>
            <div class="w-full bg-background rounded-full h-3 mb-2">
              <div
                class="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                :style="{ width: Math.min((result.ffmi / getMaxFFMI()) * 100, 100) + '%' }"
              ></div>
            </div>
            <p class="text-xs text-muted-foreground">当前: {{ result.ffmi }} | 天赋极限: {{ getMaxFFMI() }}</p>
          </div>
        </div>

        <!-- FFMI参考标准 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-500" />
            FFMI参考标准
          </h2>

          <div class="space-y-4">
            <!-- 男性标准 -->
            <div>
              <p class="text-sm font-medium mb-2 text-blue-600 dark:text-blue-400">男性标准</p>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span>瘦弱</span>
                  <span class="font-mono">&lt;18</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <span>一般</span>
                  <span class="font-mono">18-20</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span>运动型</span>
                  <span class="font-mono">20-22</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>健美型</span>
                  <span class="font-mono">22-23</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span>精英型</span>
                  <span class="font-mono">23-25</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span>职业健美</span>
                  <span class="font-mono">25-27</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                  <span>天赋极限</span>
                  <span class="font-mono">&gt;27（可能用药）</span>
                </div>
              </div>
            </div>

            <!-- 女性标准 -->
            <div>
              <p class="text-sm font-medium mb-2 text-pink-600 dark:text-pink-400">女性标准</p>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span>瘦弱</span>
                  <span class="font-mono">&lt;14</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <span>一般</span>
                  <span class="font-mono">14-16</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span>运动型</span>
                  <span class="font-mono">16-18</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span>健美型</span>
                  <span class="font-mono">18-20</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span>精英型</span>
                  <span class="font-mono">20-21</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <span>职业健美</span>
                  <span class="font-mono">21-23</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FFMI vs BMI -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">FFMI vs BMI 对比</h2>

          <div v-if="result" class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span class="text-sm">BMI (身体质量指数)</span>
              <span class="font-bold text-lg">{{ result.bmi }}</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <span class="text-sm">FFMI (瘦体重指数)</span>
              <span class="font-bold text-lg">{{ result.ffmi }}</span>
            </div>

            <div class="p-3 bg-muted rounded text-sm">
              <p class="font-medium mb-1">FFMI的优势</p>
              <p class="text-muted-foreground">BMI无法区分肌肉和脂肪，而FFMI只计算瘦体重（肌肉+骨骼+器官），更能准确反映肌肉发达程度。</p>
            </div>
          </div>
        </div>

        <!-- 著名运动员FFMI参考 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">著名运动员FFMI参考</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>Usain Bolt (短跑)</span>
              <span class="font-mono">~25.5</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>Michael Phelps (游泳)</span>
              <span class="font-mono">~24.5</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>Cristiano Ronaldo (足球)</span>
              <span class="font-mono">~23.5</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>LeBron James (篮球)</span>
              <span class="font-mono">~26.0</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>自然健美极限</span>
              <span class="font-mono">~25-26</span>
            </div>
          </div>

          <div class="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded text-xs">
            <p class="font-medium mb-1">注意</p>
            <p class="text-muted-foreground">FFMI > 26-27通常被认为超出了自然极限，可能使用了增强药物。但存在极少数天赋异禀的个体可能达到更高水平。</p>
          </div>
        </div>

        <!-- 提高FFMI的建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">科学提高FFMI</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <Dumbbell class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">力量训练</p>
                <p class="text-muted-foreground">专注于复合动作（深蹲、卧推、硬拉），逐渐增加训练重量</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Dumbbell class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">充足蛋白质</p>
                <p class="text-muted-foreground">每公斤体重摄入1.6-2.2g蛋白质，支持肌肉生长</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Dumbbell class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">热量盈余</p>
                <p class="text-muted-foreground">摄入比消耗多200-400大卡，为肌肉生长提供能量</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Dumbbell class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">充足睡眠</p>
                <p class="text-muted-foreground">每晚7-9小时优质睡眠，促进肌肉恢复和生长</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Dumbbell class="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">渐进超负荷</p>
                <p class="text-muted-foreground">逐步增加训练强度，持续刺激肌肉生长</p>
              </div>
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
import { Dumbbell, Trophy, ClipboardList, CheckCircle, AlertCircle, XCircle } from 'lucide-vue-next'

const gender = ref('male')
const height = ref(null)
const weight = ref(null)
const bodyFat = ref(null)

const result = ref(null)

function calculateFFMI() {
  if (!height.value || !weight.value || bodyFat.value === null) {
    alert('请填写完整信息')
    return
  }

  if (bodyFat.value < 0 || bodyFat.value > 50) {
    alert('请输入正确的体脂率（0-50%）')
    return
  }

  // 计算瘦体重（去脂体重）
  const leanMass = weight.value * (1 - bodyFat.value / 100)

  // 计算FFMI
  const heightInMeters = height.value / 100
  const ffmi = leanMass / (heightInMeters * heightInMeters)

  // 计算调整后FFMI（消除身高影响）
  const adjustedFFMI = ffmi + (6.3 * (1.8 - heightInMeters))

  // 计算BMI
  const bmi = weight.value / (heightInMeters * heightInMeters)

  // 评估水平
  let level, levelText, description

  const standards = gender.value === 'male' ? maleStandards : femaleStandards

  if (ffmi < standards.weak) {
    level = 'weak'
    levelText = '瘦弱'
    description = '您的肌肉量偏少，建议开始力量训练并增加蛋白质摄入'
  } else if (ffmi < standards.average) {
    level = 'average'
    levelText = '一般'
    description = '您的肌肉量处于平均水平，可以通过规律训练显著改善'
  } else if (ffmi < standards.athletic) {
    level = 'athletic'
    levelText = '运动型'
    description = '您有良好的肌肉量，继续保持训练可以获得更好的身材'
  } else if (ffmi < standards.bodybuilder) {
    level = 'bodybuilder'
    levelText = '健美型'
    description = '您的肌肉量非常出色，看起来强壮有型'
  } else if (ffmi < standards.elite) {
    level = 'elite'
    levelText = '精英型'
    description = '您拥有顶级的自然身材水平，肌肉量非常惊人'
  } else if (ffmi < standards.pro) {
    level = 'pro'
    levelText = '职业健美水平'
    description = '您的FFMI接近自然极限，是极少数能达到的水平'
  } else {
    level = 'enhanced'
    levelText = '超自然水平'
    description = '您的FFMI超过了自然极限，可能使用了增强药物或有极罕见的基因天赋'
  }

  result.value = {
    ffmi: ffmi.toFixed(1),
    adjustedFFMI: adjustedFFMI.toFixed(1),
    leanMass: leanMass.toFixed(1),
    bmi: bmi.toFixed(1),
    level,
    levelText,
    description
  }
}

function getMaxFFMI() {
  return gender.value === 'male' ? 27 : 23
}

function getLevelClass(level) {
  switch (level) {
    case 'weak':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    case 'average':
      return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
    case 'athletic':
      return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
    case 'bodybuilder':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    case 'elite':
      return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
    case 'pro':
      return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
    case 'enhanced':
      return 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
    default:
      return 'bg-muted'
  }
}

function getLevelIcon(level) {
  switch (level) {
    case 'weak':
    case 'average':
      return AlertCircle
    case 'athletic':
    case 'bodybuilder':
    case 'elite':
    case 'pro':
      return CheckCircle
    case 'enhanced':
      return Trophy
    default:
      return AlertCircle
  }
}

const maleStandards = {
  weak: 18,
  average: 20,
  athletic: 22,
  bodybuilder: 23,
  elite: 25,
  pro: 27
}

const femaleStandards = {
  weak: 14,
  average: 16,
  athletic: 18,
  bodybuilder: 20,
  elite: 21,
  pro: 23
}

useSeoMeta({
  title: '瘦体重指数计算器 - 在线FFMI计算与肌肉量评估',
  description: '免费在线瘦体重指数计算器，计算FFMI评估肌肉发达程度，排除脂肪干扰，更准确反映身材水平。', keywords: ['FFMI', '瘦体重指数', '去脂体重指数', '肌肉量', '肌肉发达程度', '健美', '身材评估', 'fat-free mass index']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('瘦体重指数计算器')
</script>
