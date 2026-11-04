<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">1RM最大力量计算器</h1>
      <p class="text-muted-foreground">根据训练重量和重复次数估算单次最大重量（1RM），科学制定训练计划</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和计算 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Dumbbell class="w-5 h-5 text-primary" />
            输入训练数据
          </h2>

          <div class="space-y-4">
            <!-- 动作选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">训练动作</label>
              <select v-model="exercise" class="w-full px-4 py-3 border border-border rounded-lg text-sm">
                <option value="bench-press">卧推 (Bench Press)</option>
                <option value="squat">深蹲 (Squat)</option>
                <option value="deadlift">硬拉 (Deadlift)</option>
                <option value="overhead-press">推举 (Overhead Press)</option>
                <option value="barbell-row">杠铃划船 (Barbell Row)</option>
                <option value="other">其他动作</option>
              </select>
            </div>

            <!-- 重量输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">训练重量</label>
              <div class="flex gap-2">
                <input
                  v-model.number="weight"
                  type="number"
                  step="0.5"
                  min="1"
                  class="flex-1 px-4 py-3 border border-border rounded-lg font-mono text-sm"
                  placeholder="输入重量"
                  @input="calculate1RM"
                >
                <select v-model="weightUnit" class="px-4 py-2 border border-border rounded-lg text-sm">
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            <!-- 重复次数 -->
            <div>
              <label class="text-sm font-medium mb-2 block">重复次数 (至力竭)</label>
              <input
                v-model.number="reps"
                type="number"
                min="1"
                max="20"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm"
                placeholder="输入重复次数"
                @input="calculate1RM"
              >
              <p class="text-xs text-muted-foreground mt-1">建议使用1-10次的重量以获得更准确的结果</p>
            </div>

            <!-- 计算公式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">计算公式</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="formula in formulas"
                  :key="formula.id"
                  @click="selectedFormula = formula.id"
                  :class="['p-2 rounded-lg text-sm transition-colors', selectedFormula === formula.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  {{ formula.name }}
                </button>
              </div>
            </div>

            <!-- 计算 -->
            <button
              @click="calculate1RM"
              :disabled="!weight || !reps"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              <Calculator class="w-4 h-4 inline mr-2" />
              计算1RM
            </button>
          </div>
        </div>

        <!-- 计算结果 -->
        <div v-if="oneRepMax" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy class="w-5 h-5 text-yellow-500" />
            计算结果
          </h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">预估1RM (单次最大重量)</p>
              <p class="text-5xl font-bold text-primary mb-2">{{ oneRepMax }}{{ weightUnit }}</p>
              <p class="text-sm text-muted-foreground">{{ getExerciseName(exercise) }}</p>
            </div>
          </div>

          <!-- 训练百分比表 -->
          <div class="space-y-2">
            <p class="text-sm font-medium">训练强度参考</p>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="percent in trainingPercents"
                :key="percent.value"
                class="flex items-center justify-between p-2 bg-muted rounded text-sm"
              >
                <span class="text-muted-foreground">{{ percent.label }}</span>
                <span class="font-medium font-mono">{{ calculatePercent(percent.value) }}{{ weightUnit }}</span>
              </div>
            </div>
          </div>

          <!-- 训练建议 -->
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              <span class="font-medium">训练建议：</span>{{ getTrainingAdvice() }}
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧：公式说明和训练指南 -->
      <div class="space-y-4">
        <!-- 公式对比 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">公式对比</h2>

          <div class="space-y-3">
            <div
              v-for="formula in formulas"
              :key="formula.id"
              class="p-3 border rounded-lg"
              :class="{ 'border-primary bg-primary/5': selectedFormula === formula.id }"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm">{{ formula.name }}</span>
                <span v-if="oneRepMax" class="text-xs font-mono">{{ calculateWithFormula(formula.id) }}{{ weightUnit }}</span>
              </div>
              <p class="text-xs text-muted-foreground">{{ formula.description }}</p>
            </div>
          </div>
        </div>

        <!-- 使用指南 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            使用指南
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">如何获得准确结果？</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>使用热身后的重量（5-10分钟热身）</li>
                <li>选择能完成1-10次的重量</li>
                <li>确保动作标准，全程动作</li>
                <li>不要借助惯性或借力</li>
                <li>在充分休息状态下测试</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">注意事项</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>1RM计算值仅为估算，实际测试需谨慎</li>
                <li>建议在同伴保护下进行1RM测试</li>
                <li>不同公式结果可能相差5-10%</li>
                <li>新手适合使用较低次数（2-5次）估算</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">训练周期建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>每4-6周重新测试1RM</li>
                <li>力量增长期使用60-80%1RM训练</li>
                <li>力量维持期使用70-85%1RM训练</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 强度等级说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">训练强度说明</h2>

          <div class="space-y-2 text-sm">
            <div class="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p class="font-medium">50-60% 1RM - 热身/激活</p>
              <p class="text-xs text-muted-foreground">用于热身和激活肌肉</p>
            </div>
            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium">60-70% 1RM - 耐力训练</p>
              <p class="text-xs text-muted-foreground">12-20次，提高肌肉耐力</p>
            </div>
            <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium">70-80% 1RM - 肌肥大训练</p>
              <p class="text-xs text-muted-foreground">8-12次，促进肌肉生长</p>
            </div>
            <div class="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <p class="font-medium">80-90% 1RM - 力量训练</p>
              <p class="text-xs text-muted-foreground">4-6次，提高最大力量</p>
            </div>
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <p class="font-medium">90-100% 1RM - 爆发力/最大力量</p>
              <p class="text-xs text-muted-foreground">1-3次，提高爆发力和最大力量</p>
            </div>
          </div>
        </div>

        <!-- 计算原理 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">计算原理</h2>

          <div class="space-y-3 text-sm">
            <div>
              <p class="font-medium text-foreground mb-1">Epley公式</p>
              <code class="text-xs bg-muted p-2 rounded block">1RM = weight × (1 + reps/30)</code>
            </div>
            <div>
              <p class="font-medium text-foreground mb-1">Brzycki公式</p>
              <code class="text-xs bg-muted p-2 rounded block">1RM = weight × 36/(37-reps)</code>
            </div>
            <div>
              <p class="font-medium text-foreground mb-1">Lander公式</p>
              <code class="text-xs bg-muted p-2 rounded block">1RM = 100×weight/(101.3-2.67123×reps)</code>
            </div>
          </div>
        </div>

        <!-- 安全提示 -->
        <div class="bg-card rounded-lg p-6 border border-red-200 dark:border-red-800">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
            <AlertTriangle class="w-5 h-5" />
            安全提示
          </h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>不要在没有保护的情况下尝试1RM</p>
            </div>
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>充分热身，避免运动损伤</p>
            </div>
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>使用杠铃夹子确保安全</p>
            </div>
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>疲劳时不要进行大重量训练</p>
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
  Dumbbell,
  Calculator,
  Trophy,
  BookOpen,
  AlertTriangle,
  X
} from 'lucide-vue-next'

const exercise = ref('bench-press')
const weight = ref(null)
const weightUnit = ref('kg')
const reps = ref(null)
const selectedFormula = ref('epley')

const oneRepMax = ref(null)

const formulas = [
  { id: 'epley', name: 'Epley', description: '最常用的公式，适合1-10次重复' },
  { id: 'brzycki', name: 'Brzycki', description: '准确性较高，适合所有重复次数' },
  { id: 'lander', name: 'Lander', description: '适合中等重复次数' },
  { id: 'oconner', name: "O'Conner et al", description: '简化公式' },
  { id: 'average', name: '平均值', description: '多个公式的平均值' }
]

const trainingPercents = [
  { label: '60% (耐力)', value: 0.60 },
  { label: '70% (肌肥大)', value: 0.70 },
  { label: '80% (力量)', value: 0.80 },
  { label: '85% (力量)', value: 0.85 },
  { label: '90% (最大力量)', value: 0.90 },
  { label: '95% (爆发力)', value: 0.95 }
]

function getExerciseName(id) {
  const names = {
    'bench-press': '卧推',
    'squat': '深蹲',
    'deadlift': '硬拉',
    'overhead-press': '推举',
    'barbell-row': '杠铃划船',
    'other': '自定义动作'
  }
  return names[id] || id
}

function calculate1RM() {
  if (!weight.value || !reps.value) {
    oneRepMax.value = null
    return
  }

  oneRepMax.value = calculateWithFormula(selectedFormula.value)
}

function calculateWithFormula(formulaId) {
  const w = weight.value
  const r = reps.value

  let result

  switch (formulaId) {
    case 'epley':
      result = w * (1 + r / 30)
      break
    case 'brzycki':
      result = w * 36 / (37 - r)
      break
    case 'lander':
      result = 100 * w / (101.3 - 2.67123 * r)
      break
    case 'oconner':
      result = w * (1 + 0.025 * r)
      break
    case 'average':
      const epley = w * (1 + r / 30)
      const brzycki = w * 36 / (37 - r)
      const lander = 100 * w / (101.3 - 2.67123 * r)
      result = (epley + brzycki + lander) / 3
      break
    default:
      result = w * (1 + r / 30)
  }

  return result.toFixed(1)
}

function calculatePercent(percent) {
  if (!oneRepMax.value) return '-'
  return (parseFloat(oneRepMax.value) * percent).toFixed(1)
}

function getTrainingAdvice() {
  if (!oneRepMax.value) return ''

  const rm = parseFloat(oneRepMax.value)
  const w = weight.value
  const r = reps.value

  if (r <= 3) {
    return '当前重量接近最大值，适合力量突破训练。建议使用80-90%1RM进行4-6次训练组。'
  } else if (r <= 6) {
    return '当前重量适合力量训练。可以使用70-85%1RM进行4-8次训练组。'
  } else if (r <= 10) {
    return '当前重量适合肌肥大训练。建议使用70-80%1RM进行8-12次训练组。'
  } else {
    return '当前重量适合耐力训练。建议使用60-70%1RM进行12-15次训练组。'
  }
}

useSeoMeta({
  title: '1RM最大力量计算器 - 在线单次最大重量估算工具',
  description: '免费在线1RM计算器，根据训练重量和重复次数估算单次最大重量，支持多种公式，科学制定训练计划。',
  keywords: ['1RM', '最大力量', '卧推', '深蹲', '硬拉', '力量训练', '训练计划', '健身计算器']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('1RM最大力量计算器')
</script>
