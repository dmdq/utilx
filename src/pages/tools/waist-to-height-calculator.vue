<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">腰高比计算器</h1>
      <p class="text-muted-foreground">计算腰高比(WHtR)，更准确的肥胖评估指标，预测代谢综合征和心血管疾病风险</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和计算 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Ruler class="w-5 h-5 text-primary" />
            输入测量数据
          </h2>

          <div class="space-y-4">
            <!-- 性别选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">性别</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="gender = 'male'"
                  :class="['p-3 rounded-lg text-sm transition-colors', gender === 'male' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  <span class="flex items-center justify-center gap-2">
                    <User class="w-4 h-4" />
                    男性
                  </span>
                </button>
                <button
                  @click="gender = 'female'"
                  :class="['p-3 rounded-lg text-sm transition-colors', gender === 'female' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  <span class="flex items-center justify-center gap-2">
                    <User class="w-4 h-4" />
                    女性
                  </span>
                </button>
              </div>
            </div>

            <!-- 年龄 -->
            <div>
              <label class="text-sm font-medium mb-2 block">年龄</label>
              <input
                v-model.number="age"
                type="number"
                min="1"
                max="120"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm"
                placeholder="输入年龄"
                @input="calculateWHtR"
              >
            </div>

            <!-- 单位选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">测量单位</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="unit = 'cm'"
                  :class="['p-3 rounded-lg text-sm transition-colors', unit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  公制 (cm)
                </button>
                <button
                  @click="unit = 'inch'"
                  :class="['p-3 rounded-lg text-sm transition-colors', unit === 'inch' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  英制 (inch)
                </button>
              </div>
            </div>

            <!-- 腰围输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">腰围</label>
              <div class="relative">
                <input
                  v-model.number="waist"
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm pr-16"
                  placeholder="输入腰围"
                  @input="calculateWHtR"
                >
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{{ unit }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">在肚脐上方，肋骨下方最细处测量</p>
            </div>

            <!-- 身高输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">身高</label>
              <div class="relative">
                <input
                  v-model.number="height"
                  type="number"
                  step="0.1"
                  min="100"
                  max="250"
                  class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm pr-16"
                  placeholder="输入身高"
                  @input="calculateWHtR"
                >
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{{ unit }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">脱鞋直立测量</p>
            </div>
          </div>
        </div>

        <!-- 计算结果 -->
        <div v-if="whtrResult" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-purple-500" />
            计算结果
          </h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">腰高比 (WHtR)</p>
              <p class="text-5xl font-bold text-primary mb-2">{{ whtrResult.whtr }}</p>
              <div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>腰围 {{ whtrResult.waist }}{{ unit }}</span>
                <span>/</span>
                <span>身高 {{ whtrResult.height }}{{ unit }}</span>
              </div>
            </div>
          </div>

          <!-- 健康评估 -->
          <div class="p-4 rounded-lg mb-4" :class="getHealthClass(whtrResult.level)">
            <div class="flex items-center gap-3">
              <component :is="getHealthIcon(whtrResult.level)" class="w-6 h-6" />
              <div>
                <p class="font-medium">{{ whtrResult.category }}</p>
                <p class="text-sm">{{ whtrResult.description }}</p>
              </div>
            </div>
          </div>

          <!-- 风险评估 -->
          <div v-if="whtrResult.risks" class="space-y-2">
            <p class="text-sm font-medium">相关风险因素：</p>
            <div
              v-for="(risk, index) in whtrResult.risks"
              :key="index"
              class="flex items-center gap-2 p-2 bg-muted rounded text-sm"
            >
              <AlertTriangle class="w-4 h-4 text-yellow-500" />
              <span>{{ risk }}</span>
            </div>
          </div>
        </div>

        <!-- 与其他指标对比 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">WHtR vs BMI 对比</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <TrendingUp class="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p class="font-medium text-foreground">WHtR 优势</p>
                <p class="text-muted-foreground">能更准确反映腹部脂肪堆积，考虑身高因素，对不同身高的人群更公平</p>
              </div>
            </div>

            <div class="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <Activity class="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p class="font-medium text-foreground">BMI 局限性</p>
                <p class="text-muted-foreground">无法区分脂肪和肌肉，对高个子偏高的个体可能低估肥胖风险</p>
              </div>
            </div>
          </div>

          <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <p class="text-sm text-green-700 dark:text-green-300">
              <span class="font-medium">推荐：</span>WHtR &lt; 0.5 是判断肥胖的最佳标准，适用于所有成人和种族
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧：参考标准和说明 -->
      <div class="space-y-4">
        <!-- 健康标准 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-500" />
            腰高比健康标准
          </h2>

          <div class="space-y-3">
            <!-- 通用标准 -->
            <div class="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <p class="font-medium text-sm mb-3">通用标准（男女适用）</p>
              <div class="space-y-2">
                <div class="flex items-center justify-between p-2 bg-white dark:bg-black/50 rounded">
                  <span class="text-sm">&lt; 0.40</span>
                  <span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700">过瘦</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-white dark:bg-black/50 rounded">
                  <span class="text-sm">0.40 - 0.49</span>
                  <span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700">健康</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-white dark:bg-black/50 rounded">
                  <span class="text-sm">0.50 - 0.59</span>
                  <span class="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">超重</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-white dark:bg-black/50 rounded">
                  <span class="text-sm">&ge; 0.60</span>
                  <span class="text-xs px-2 py-1 rounded bg-red-100 text-red-700">肥胖</span>
                </div>
              </div>
            </div>

            <div class="p-3 bg-muted rounded text-sm">
              <p class="font-medium text-foreground mb-1">简单判断原则</p>
              <p class="text-muted-foreground">"保持腰围不超过身高的一半"</p>
              <p class="text-xs text-muted-foreground mt-1">即 WHtR &lt; 0.5</p>
            </div>
          </div>
        </div>

        <!-- 研究依据 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-green-500" />
            科学依据
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">WHtR 的优势</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>考虑了身高因素，比BMI更准确</li>
                <li>能预测内脏脂肪堆积</li>
                <li>适用于所有种族和年龄段</li>
                <li>与心血管疾病风险相关性更强</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">研究结论</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>WHtR ≥ 0.5 时，心血管疾病风险显著增加</li>
                <li>预测糖尿病的效果优于BMI和腰围</li>
                <li>是评估代谢综合征的最佳单一指标</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 改善建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb class="w-5 h-5 text-yellow-500" />
            改善建议
          </h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium text-foreground mb-2">饮食调整</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>控制总热量摄入</li>
                <li>减少精制碳水化合物</li>
                <li>增加膳食纤维</li>
                <li>限制高糖饮料</li>
              </ul>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium text-foreground mb-2">运动建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>每周至少150分钟中等强度有氧运动</li>
                <li>每周2-3次力量训练</li>
                <li>增加日常活动量</li>
                <li>减少久坐时间</li>
              </ul>
            </div>

            <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p class="font-medium text-foreground mb-2">生活方式</p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>保证充足睡眠</li>
                <li>管理压力水平</li>
                <li>限制饮酒</li>
                <li>定期监测腰围</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 相关指标 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">相关健康指标</h2>

          <div class="space-y-2">
            <div class="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>BMI指数</span>
              <a href="/tools/bmi-calculator/" class="text-primary hover:underline">计算 &rarr;</a>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>体脂率</span>
              <a href="/tools/body-fat-calculator/" class="text-primary hover:underline">计算 &rarr;</a>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>腰臀比</span>
              <a href="/tools/waist-to-hip-calculator/" class="text-primary hover:underline">计算 &rarr;</a>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <span>理想体重</span>
              <a href="/tools/ideal-weight-calculator/" class="text-primary hover:underline">计算 &rarr;</a>
            </div>
          </div>
        </div>

        <!-- 常见问题 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常见问题</h2>

          <div class="space-y-3 text-sm">
            <div>
              <p class="font-medium text-foreground mb-1">腰高比正常值是多少？</p>
              <p class="text-muted-foreground">对于成人和所有种族，WHtR应低于0.5。这是判断健康体重最简单的标准。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">WHtR和腰臀比哪个更好？</p>
              <p class="text-muted-foreground">WHtR考虑了身高因素，对不同身高的人更公平，且标准统一（&lt;0.5），更容易判断。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">如何快速测量？</p>
              <p class="text-muted-foreground">只需测量腰围和身高，然后确保腰围不超过身高的一半即可。这个"半身高规则"简单易记。</p>
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
  Ruler,
  User,
  PieChart,
  ClipboardList,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-vue-next'

const gender = ref('male')
const age = ref(null)
const unit = ref('cm')
const waist = ref(null)
const height = ref(null)

const whtrResult = ref(null)

// 计算腰高比
function calculateWHtR() {
  if (!waist.value || !height.value || waist.value <= 0 || height.value <= 0) {
    whtrResult.value = null
    return
  }

  const whtr = waist.value / height.value

  let result = {
    whr: whtr.toFixed(2),
    waist: waist.value,
    height: height.value
  }

  // 根据WHtR值判断健康等级
  if (whtr < 0.40) {
    result = {
      ...result,
      whtr: whtr.toFixed(2),
      level: 'underweight',
      category: '体重过轻',
      description: '腰高比偏低，建议适当增加营养摄入，咨询营养师'
    }
  } else if (whtr < 0.50) {
    result = {
      ...result,
      whtr: whtr.toFixed(2),
      level: 'healthy',
      category: '健康体重',
      description: '腰高比在健康范围内，请继续保持健康的生活方式',
      risks: []
    }
  } else if (whtr < 0.60) {
    result = {
      ...result,
      whtr: whtr.toFixed(2),
      level: 'overweight',
      category: '超重',
      description: '腰高比偏高，腹部脂肪过多，建议控制饮食、增加运动',
      risks: ['心血管疾病风险增加', '2型糖尿病风险增加', '高血压风险增加']
    }
  } else {
    result = {
      ...result,
      whtr: whtr.toFixed(2),
      level: 'obese',
      category: '肥胖',
      description: '腰高比过高，存在严重的健康风险，强烈建议咨询医生',
      risks: [
        '心血管疾病风险显著增加',
        '2型糖尿病风险显著增加',
        '代谢综合征',
        '脂肪肝',
        '睡眠呼吸暂停'
      ]
    }
  }

  whtrResult.value = result
}

// 获取健康等级样式类
function getHealthClass(level) {
  switch (level) {
    case 'underweight':
      return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
    case 'healthy':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    case 'overweight':
      return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
    case 'obese':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    default:
      return 'bg-muted'
  }
}

// 获取健康等级图标
function getHealthIcon(level) {
  switch (level) {
    case 'underweight':
      return AlertCircle
    case 'healthy':
      return CheckCircle
    case 'overweight':
      return AlertCircle
    case 'obese':
      return XCircle
    default:
      return AlertCircle
  }
}

useSeoMeta({
  title: '腰高比计算器 - 在线WHtR计算与肥胖评估',
  description: '免费在线腰高比计算器，更准确的肥胖评估指标，预测代谢综合征和心血管疾病风险，标准为WHtR<0.5。',
  keywords: ['腰高比', 'WHtR', '腰围身高比', '肥胖评估', '内脏脂肪', '代谢综合征', '健康评估', '在线计算器']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('腰高比计算器')
</script>
