<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">腰臀比计算器</h1>
      <p class="text-muted-foreground">计算腰臀比(WHR)，评估中心性肥胖风险，预防心血管疾病和糖尿病</p>
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

            <!-- 单位选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">测量单位</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="unit = 'cm'"
                  :class="['p-3 rounded-lg text-sm transition-colors', unit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  厘米 (cm)
                </button>
                <button
                  @click="unit = 'inch'"
                  :class="['p-3 rounded-lg text-sm transition-colors', unit === 'inch' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  英寸 (inch)
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
                  @input="calculateWHR"
                >
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{{ unit }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">测量方法：在肚脐上方，肋骨下方最细处</p>
            </div>

            <!-- 臀围输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">臀围</label>
              <div class="relative">
                <input
                  v-model.number="hip"
                  type="number"
                  step="0.1"
                  min="50"
                  max="250"
                  class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm pr-16"
                  placeholder="输入臀围"
                  @input="calculateWHR"
                >
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{{ unit }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-1">测量方法：臀部最宽处水平测量</p>
            </div>
          </div>
        </div>

        <!-- 计算结果 -->
        <div v-if="whrResult" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart class="w-5 h-5 text-purple-500" />
            计算结果
          </h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">腰臀比 (WHR)</p>
              <p class="text-5xl font-bold text-primary mb-2">{{ whrResult.whr }}</p>
              <div class="flex items-center justify-center gap-2">
                <span class="text-sm text-muted-foreground">腰围 {{ whrResult.waist }}{{ unit }}</span>
                <span class="text-muted-foreground">/</span>
                <span class="text-sm text-muted-foreground">臀围 {{ whrResult.hip }}{{ unit }}</span>
              </div>
            </div>
          </div>

          <!-- 健康评估 -->
          <div class="p-4 rounded-lg" :class="getHealthClass(whrResult.level)">
            <div class="flex items-center gap-3 mb-2">
              <component :is="getHealthIcon(whrResult.level)" class="w-6 h-6" />
              <div>
                <p class="font-medium">{{ whrResult.category }}</p>
                <p class="text-sm text-muted-foreground">{{ whrResult.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 可视化图示 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">测量位置图示</h2>
          <div class="relative h-64 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg overflow-hidden">
            <!-- 人体轮廓简化图 -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="relative">
                <!-- 头部 -->
                <div class="w-16 h-16 bg-foreground/20 rounded-full mx-auto mb-2"></div>
                <!-- 躯干 -->
                <div class="relative">
                  <!-- 腰围线 -->
                  <div class="absolute left-0 right-0 top-1/3 border-t-4 border-dashed border-primary z-10">
                    <span class="absolute -right-20 top-1/2 -translate-y-1/2 text-xs font-medium text-primary whitespace-nowrap">腰围</span>
                  </div>
                  <!-- 臀围线 -->
                  <div class="absolute left-0 right-0 top-2/3 border-t-4 border-dashed border-purple-500 z-10">
                    <span class="absolute -right-20 top-1/2 -translate-y-1/2 text-xs font-medium text-purple-500 whitespace-nowrap">臀围</span>
                  </div>
                  <div class="w-24 h-32 bg-foreground/10 rounded-t-full mx-auto"></div>
                </div>
                <!-- 腿部 -->
                <div class="flex gap-2 justify-center">
                  <div class="w-8 h-24 bg-foreground/10 rounded-b-lg"></div>
                  <div class="w-8 h-24 bg-foreground/10 rounded-b-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：参考标准和说明 -->
      <div class="space-y-4">
        <!-- 健康标准 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-500" />
            腰臀比健康标准
          </h2>

          <div class="space-y-3">
            <!-- 男性标准 -->
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="font-medium text-sm mb-2 flex items-center gap-2">
                <User class="w-4 h-4 text-blue-500" />
                男性标准
              </p>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>&lt; 0.90</span>
                  <span class="text-green-600 font-medium">健康</span>
                </div>
                <div class="flex justify-between">
                  <span>0.90 - 0.99</span>
                  <span class="text-yellow-600 font-medium">中等风险</span>
                </div>
                <div class="flex justify-between">
                  <span>&ge; 1.00</span>
                  <span class="text-red-600 font-medium">高风险</span>
                </div>
              </div>
            </div>

            <!-- 女性标准 -->
            <div class="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <p class="font-medium text-sm mb-2 flex items-center gap-2">
                <User class="w-4 h-4 text-pink-500" />
                女性标准
              </p>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>&lt; 0.85</span>
                  <span class="text-green-600 font-medium">健康</span>
                </div>
                <div class="flex justify-between">
                  <span>0.85 - 0.89</span>
                  <span class="text-yellow-600 font-medium">中等风险</span>
                </div>
                <div class="flex justify-between">
                  <span>&ge; 0.90</span>
                  <span class="text-red-600 font-medium">高风险</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康风险 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-yellow-500" />
            腰臀比过高风险
          </h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <Heart class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>心血管疾病风险增加</p>
            </div>
            <div class="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <Droplet class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>2型糖尿病风险增加</p>
            </div>
            <div class="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <Activity class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p>高血压风险增加</p>
            </div>
            <div class="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <Brain class="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <p>代谢综合征风险增加</p>
            </div>
          </div>
        </div>

        <!-- 测量建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb class="w-5 h-5 text-green-500" />
            测量建议
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">最佳测量时间</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>早晨起床后测量</li>
                <li>排空膀胱后</li>
                <li>进食前</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">测量注意事项</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>保持自然站立，双脚分开25-30cm</li>
                <li>呼吸平稳，不要收腹</li>
                <li>软尺紧贴皮肤但不压迫</li>
                <li>多次测量取平均值</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">改善建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>增加有氧运动（跑步、游泳）</li>
                <li>力量训练增加肌肉量</li>
                <li>控制饮食，减少热量摄入</li>
                <li>减少腹部脂肪的关键是全身减脂</li>
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
              <span>腰高比</span>
              <a href="/tools/waist-to-height-calculator/" class="text-primary hover:underline">计算 &rarr;</a>
            </div>
          </div>
        </div>

        <!-- 知识问答 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常见问题</h2>

          <div class="space-y-3 text-sm">
            <div>
              <p class="font-medium text-foreground mb-1">腰臀比和BMI有什么区别？</p>
              <p class="text-muted-foreground">BMI只考虑体重和身高，无法区分脂肪和肌肉。腰臀比能更准确地反映中心性肥胖（腹部脂肪堆积），是评估心血管疾病风险的重要指标。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">正常的腰臀比是多少？</p>
              <p class="text-muted-foreground">男性&lt;0.90，女性&lt;0.85属于健康范围。超过这个数值提示腹部脂肪过多，需要关注。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">如何降低腰臀比？</p>
              <p class="text-muted-foreground">关键是通过饮食控制和运动减少全身脂肪，特别是腹部脂肪。建议每周至少150分钟中等强度有氧运动，配合力量训练。</p>
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
  Ruler,
  User,
  PieChart,
  ClipboardList,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertCircle,
  Heart,
  Droplet,
  Activity,
  Brain
} from 'lucide-vue-next'

const gender = ref('male')
const unit = ref('cm')
const waist = ref(null)
const hip = ref(null)

const whrResult = ref(null)

// 健康等级标准
const maleStandards = {
  low: { threshold: 0.90, level: 'low', category: '健康', description: '腰臀比在正常范围内，心血管疾病风险较低' },
  medium: { threshold: 1.00, level: 'medium', category: '中等风险', description: '腹部脂肪过多，建议增加运动、改善饮食' },
  high: { threshold: Infinity, level: 'high', category: '高风险', description: '中心性肥胖，心血管疾病风险显著增加，建议咨询医生' }
}

const femaleStandards = {
  low: { threshold: 0.85, level: 'low', category: '健康', description: '腰臀比在正常范围内，心血管疾病风险较低' },
  medium: { threshold: 0.90, level: 'medium', category: '中等风险', description: '腹部脂肪过多，建议增加运动、改善饮食' },
  high: { threshold: Infinity, level: 'high', category: '高风险', description: '中心性肥胖，心血管疾病风险显著增加，建议咨询医生' }
}

// 计算腰臀比
function calculateWHR() {
  if (!waist.value || !hip.value || waist.value <= 0 || hip.value <= 0) {
    whrResult.value = null
    return
  }

  const whr = waist.value / hip.value
  const standards = gender.value === 'male' ? maleStandards : femaleStandards

  let result
  if (whr < standards.low.threshold) {
    result = { ...standards.low }
  } else if (whr < standards.medium.threshold) {
    result = { ...standards.medium }
  } else {
    result = { ...standards.high }
  }

  whrResult.value = {
    whr: whr.toFixed(2),
    waist: waist.value,
    hip: hip.value,
    level: result.level,
    category: result.category,
    description: result.description
  }
}

// 获取健康等级样式类
function getHealthClass(level) {
  switch (level) {
    case 'low':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    case 'medium':
      return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
    case 'high':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    default:
      return 'bg-muted'
  }
}

// 获取健康等级图标
function getHealthIcon(level) {
  switch (level) {
    case 'low':
      return CheckCircle
    case 'medium':
      return AlertCircle
    case 'high':
      return XCircle
    default:
      return AlertCircle
  }
}

useSeoMeta({
  title: '腰臀比计算器 - 在线WHR计算与健康评估',
  description: '免费在线腰臀比计算器，评估中心性肥胖风险，预防心血管疾病和糖尿病，提供健康改善建议。',
  keywords: ['腰臀比', 'WHR', '腰围臀围比', '中心性肥胖', '腹部脂肪', '健康评估', '心血管风险', '在线计算器']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('腰臀比计算器')
</script>
