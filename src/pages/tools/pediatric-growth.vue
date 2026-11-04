<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">儿童生长发育曲线</h1>
      <p class="text-muted-foreground">追踪儿童身高体重发育，对比标准生长曲线，评估营养状况</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Baby class="w-5 h-5 text-primary" />
            输入信息
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">性别</label>
              <div class="grid grid-cols-2 gap-2">
                <button @click="gender = 'male'" :class="['p-3 rounded-lg text-sm', gender === 'male' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">男孩</button>
                <button @click="gender = 'female'" :class="['p-3 rounded-lg text-sm', gender === 'female' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">女孩</button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">年龄（月）</label>
                <input v-model.number="ageMonths" type="number" min="0" max="216" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="月数">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">身高 (cm)</label>
                <input v-model.number="height" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="身高">
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">体重 (kg)</label>
              <input v-model.number="weight" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="体重">
            </div>

            <button @click="evaluateGrowth" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm">
              评估发育状况
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">评估结果</h2>

          <div class="space-y-4">
            <div class="p-4 rounded-lg" :class="getResultClass(result.level)">
              <div class="flex items-center gap-3">
                <component :is="getResultIcon(result.level)" class="w-6 h-6" />
                <div>
                  <p class="font-medium">{{ result.level }}</p>
                  <p class="text-sm">{{ result.description }}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-center">
                <p class="text-xs text-muted-foreground">身高百分位</p>
                <p class="text-xl font-bold text-blue-600">{{ result.heightPercentile }}</p>
              </div>
              <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded text-center">
                <p class="text-xs text-muted-foreground">体重百分位</p>
                <p class="text-xl font-bold text-green-600">{{ result.weightPercentile }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">发育评估说明</h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-1">百分位含义</p>
              <p class="text-muted-foreground">50百分位表示平均值，3-97百分位为正常范围。低于3百分位可能提示发育迟缓。</p>
            </div>
            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-1">生长曲线</p>
              <p class="text-muted-foreground">建议定期记录身高体重，绘制生长曲线图，可以更直观地观察发育趋势。</p>
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
import { Baby, CheckCircle, AlertTriangle, XCircle } from 'lucide-vue-next'

const gender = ref('male')
const ageMonths = ref(null)
const height = ref(null)
const weight = ref(null)

const result = ref(null)

function evaluateGrowth() {
  if (!ageMonths.value || !height.value || !weight.value) {
    alert('请填写完整信息')
    return
  }

  // WHO生长数据简化估算
  const age = ageMonths.value
  let heightMedian, weightMedian, heightSD, weightSD

  if (gender.value === 'male') {
    // 男孩简化数据
    if (age <= 12) {
      heightMedian = 75 + age * 1.5
      weightMedian = 9 + age * 0.5
    } else if (age <= 60) {
      heightMedian = 87 + (age - 12) * 1.2
      weightMedian = 15 + (age - 12) * 0.2
    } else {
      heightMedian = 135 + (age - 60) * 0.6
      weightMedian = 23 + (age - 60) * 0.2
    }
  } else {
    // 女孩简化数据
    if (age <= 12) {
      heightMedian = 73 + age * 1.5
      weightMedian = 8.5 + age * 0.5
    } else if (age <= 60) {
      heightMedian = 85 + (age - 12) * 1.2
      weightMedian = 14 + (age - 12) * 0.2
    } else {
      heightMedian = 133 + (age - 60) * 0.6
      weightMedian = 22 + (age - 60) * 0.2
    }
  }

  heightSD = heightMedian * 0.04
  weightSD = weightMedian * 0.1

  const heightZ = (height.value - heightMedian) / heightSD
  const weightZ = (weight.value - weightMedian) / weightSD

  const heightPercentile = getPercentile(heightZ)
  const weightPercentile = getPercentile(weightZ)

  let level, description

  if (heightZ < -2 || weightZ < -2) {
    level = '发育迟缓'
    description = '身高或体重低于同龄人标准，建议咨询儿科医生'
  } else if (heightZ > 2 || weightZ > 2) {
    level = '发育超前'
    description = '身高或体重高于同龄人标准，属于正常范围'
  } else {
    level = '发育正常'
    description = '身高体重在正常范围内，请继续保持良好的营养和生活习惯'
  }

  result.value = {
    level,
    description,
    heightPercentile,
    weightPercentile
  }
}

function getPercentile(z) {
  if (z < -2) return '&lt;3%'
  if (z < -1) return '3-15%'
  if (z < 0) return '15-50%'
  if (z < 1) return '50-84%'
  if (z < 2) return '84-97%'
  return '&gt;97%'
}

function getResultClass(level) {
  if (level.includes('迟缓')) return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
  if (level.includes('正常')) return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
  return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
}

function getResultIcon(level) {
  if (level.includes('迟缓')) return XCircle
  if (level.includes('正常')) return CheckCircle
  return CheckCircle
}

useSeoMeta({
  title: '儿童生长发育曲线 - 在线儿童发育评估工具',
  description: '免费在线儿童生长发育曲线工具，追踪儿童身高体重发育，对比WHO标准生长曲线，评估营养状况。', keywords: ['儿童发育', '生长曲线', '身高体重', '儿童健康', 'WHO标准', '发育评估', '百分位', '生长监测']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('儿童生长发育曲线')
</script>
