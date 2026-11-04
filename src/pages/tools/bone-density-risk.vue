<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">骨密度风险评估</h1>
      <p class="text-muted-foreground">评估骨质疏松风险，了解骨骼健康状况，预防骨折和骨骼疾病</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：评估问卷 -->
      <div class="space-y-4">
        <!-- 基本信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bone class="w-5 h-5 text-primary" />
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

            <div>
              <label class="text-sm font-medium mb-2 block">年龄</label>
              <input v-model.number="age" type="number" min="18" max="100" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="输入年龄">
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">体重 (kg)</label>
              <input v-model.number="weight" type="number" step="0.1" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="输入体重">
            </div>
          </div>
        </div>

        <!-- 风险因素 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">风险因素评估</h2>

          <div class="space-y-4">
            <div v-for="factor in riskFactors" :key="factor.id" class="flex items-start gap-3">
              <input
                :id="factor.id"
                v-model="selectedRisks"
                type="checkbox"
                :value="factor.id"
                class="mt-1"
              >
              <label :for="factor.id" class="text-sm flex-1 cursor-pointer">
                <span class="font-medium">{{ factor.text }}</span>
                <p v-if="factor.detail" class="text-xs text-muted-foreground mt-1">{{ factor.detail }}</p>
              </label>
            </div>
          </div>
        </div>

        <!-- 评估按钮 -->
        <button
          @click="assessRisk"
          class="w-full px-4 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-lg font-medium"
        >
          <Activity class="w-5 h-5 inline mr-2" />
          评估骨密度风险
        </button>
      </div>

      <!-- 右侧：结果和建议 -->
      <div class="space-y-4">
        <!-- 评估结果 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileCheck class="w-5 h-5 text-green-500" />
            评估结果
          </h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">骨密度风险等级</p>
              <p class="text-4xl font-bold text-primary mb-2">{{ result.levelText }}</p>
              <p class="text-sm">风险评分: {{ result.score }}/{{ maxScore }}</p>
            </div>
          </div>

          <!-- 风险评估 -->
          <div class="p-4 rounded-lg mb-4" :class="getRiskClass(result.level)">
            <div class="flex items-center gap-3">
              <component :is="getRiskIcon(result.level)" class="w-6 h-6" />
              <div>
                <p class="font-medium">{{ result.riskText }}</p>
                <p class="text-sm">{{ result.description }}</p>
              </div>
            </div>
          </div>

          <!-- 建议措施 -->
          <div v-if="result.recommendations.length > 0" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p class="font-medium text-sm mb-2">建议措施</p>
            <ul class="space-y-1 text-sm">
              <li v-for="(rec, index) in result.recommendations" :key="index" class="flex items-start gap-2">
                <ChevronRight class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>{{ rec }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- 骨密度知识 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            骨密度知识
          </h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-1">什么是骨密度？</p>
              <p class="text-muted-foreground">骨密度是衡量骨骼矿物质含量的指标，反映骨骼强度。骨密度越高，骨骼越强壮，骨折风险越低。</p>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-1">骨质疏松</p>
              <p class="text-muted-foreground">骨质疏松是一种骨骼疾病，特征是骨密度降低和骨组织退化，导致骨折风险增加。</p>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium mb-1">T值和Z值</p>
              <p class="text-muted-foreground">T值将您的骨密度与年轻健康成人比较，Z值则与同龄人比较。T值&lt;-2.5诊断为骨质疏松。</p>
            </div>
          </div>
        </div>

        <!-- 骨密度正常值参考 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">骨密度T值参考</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <span class="font-medium">正常</span>
              <span class="font-mono text-green-600">T值 ≥ -1.0</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <span class="font-medium">骨量减少</span>
              <span class="font-mono text-yellow-600">-2.5 &lt; T值 &lt; -1.0</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <span class="font-medium">骨质疏松</span>
              <span class="font-mono text-orange-600">T值 ≤ -2.5</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded">
              <span class="font-medium">严重骨质疏松</span>
              <span class="font-mono text-red-600">T值 ≤ -2.5 + 骨折</span>
            </div>
          </div>
        </div>

        <!-- 预防建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">预防骨质疏松</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <Apple class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">充足钙摄入</p>
                <p class="text-muted-foreground">成年人每日需要1000-1200mg钙，可通过奶制品、豆制品、绿叶蔬菜获取</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Sun class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">补充维生素D</p>
                <p class="text-muted-foreground">每日400-800IU维生素D，适当晒太阳或服用补充剂</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Dumbbell class="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">负重运动</p>
                <p class="text-muted-foreground">每周3-4次力量训练、跑步、跳绳等负重运动刺激骨骼生长</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <XCircle class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">避免不良习惯</p>
                <p class="text-muted-foreground">戒烟限酒，避免过量咖啡因和碳酸饮料</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Moon class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">保证睡眠</p>
                <p class="text-muted-foreground">充足睡眠有助于骨骼修复和重建</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 高危食物 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">影响骨骼健康的食物</h2>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded text-center">
              <p class="font-medium text-green-700">有益食物</p>
              <p class="text-xs text-muted-foreground">牛奶、豆腐、三文鱼</p>
            </div>
            <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded text-center">
              <p class="font-medium text-green-700">有益食物</p>
              <p class="text-xs text-muted-foreground">绿叶菜、坚果、蛋类</p>
            </div>
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
              <p class="font-medium text-red-700">应限制</p>
              <p class="text-xs text-muted-foreground">过量咖啡、碳酸饮料</p>
            </div>
            <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded text-center">
              <p class="font-medium text-red-700">应限制</p>
              <p class="text-xs text-muted-foreground">高盐食物、酒精</p>
            </div>
          </div>
        </div>

        <!-- 何时就医 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">何时进行骨密度检测</h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>女性65岁以上，男性70岁以上</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>绝经后女性有骨折风险因素</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>长期使用糖皮质激素</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>有家族性骨质疏松史</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>出现身高明显降低或驼背</p>
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
  Bone,
  Activity,
  FileCheck,
  BookOpen,
  Apple,
  Sun,
  Dumbbell,
  XCircle,
  Moon,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next'

const gender = ref('male')
const age = ref(null)
const weight = ref(null)
const selectedRisks = ref([])

const riskFactors = [
  { id: 'family', text: '有骨质疏松家族史', detail: '父母或兄弟姐妹曾被诊断为骨质疏松' },
  { id: 'fracture', text: '曾有脆性骨折', detail: '轻微外力导致的骨折' },
  { id: 'menopause', text: '绝经（女性）', detail: '包括自然绝经或手术绝经' },
  { id: 'hormone', text: '长期使用糖皮质激素', detail: '如泼尼松等，使用超过3个月' },
  { id: 'smoking', text: '吸烟', detail: '目前吸烟或曾长期吸烟' },
  { id: 'alcohol', text: '过量饮酒', detail: '每日饮酒超过2杯' },
  { id: 'lowWeight', text: '体重过轻', detail: 'BMI低于18.5' },
  { id: 'thyroid', text: '甲状腺疾病', detail: '甲亢或甲减病史' },
  { id: 'arthritis', text: '类风湿关节炎', detail: '或其他慢性炎症性疾病' },
  { id: 'diabetes', text: '糖尿病', detail: '1型或2型糖尿病' },
  { id: 'sedentary', text: '缺乏运动', detail: '每周运动少于2次' },
  { id: 'calcium', text: '钙摄入不足', detail: '日常饮食中奶制品、豆制品摄入较少' },
  { id: 'vitaminD', text: '维生素D缺乏', detail: '晒光少或血液检测维生素D偏低' },
  { id: 'caffeine', text: '过量咖啡因', detail: '每日饮用咖啡超过3杯' },
  { id: 'heightLoss', text: '身高降低', detail: '与年轻时相比身高降低超过3cm' }
]

const result = ref(null)

const maxScore = computed(() => {
  // 基础分数（性别、年龄、体重）
  let baseScore = 0

  if (gender.value === 'female') baseScore += 2
  if (age.value && age.value >= 50) baseScore += Math.floor((age.value - 50) / 10)
  if (age.value && age.value >= 65) baseScore += 2

  // 体重过轻
  if (weight.value && height.value) {
    const bmi = weight.value / ((height.value / 100) ** 2)
    if (bmi < 18.5) baseScore += 2
  }

  return baseScore + riskFactors.length
})

function assessRisk() {
  if (!age.value || !weight.value) {
    alert('请填写基本信息')
    return
  }

  let score = 0
  const recommendations = []

  // 性别因素
  if (gender.value === 'female') {
    score += 2
    if (age.value >= 50) {
      recommendations.push('绝经后女性应特别关注骨密度健康')
    }
  }

  // 年龄因素
  if (age.value >= 65) {
    score += 3
    recommendations.push('65岁以上建议定期进行骨密度检测')
  } else if (age.value >= 50) {
    score += 1
  }

  // 体重因素
  if (weight.value < 50) {
    score += 2
    recommendations.push('体重过轻是骨质疏松的风险因素，建议适当增重并增加肌肉量')
  }

  // 风险因素评分
  if (selectedRisks.value.includes('family')) {
    score += 3
    recommendations.push('有家族史需更加注意预防和早期检测')
  }
  if (selectedRisks.value.includes('fracture')) score += 4
  if (selectedRisks.value.includes('menopause')) {
    score += 3
    recommendations.push('绝经后女性雌激素下降加速骨质流失')
  }
  if (selectedRisks.value.includes('hormone')) {
    score += 3
    recommendations.push('长期使用激素需要医生监测骨密度')
  }
  if (selectedRisks.value.includes('smoking')) {
    score += 2
    recommendations.push('戒烟可以减缓骨质流失，改善骨骼健康')
  }
  if (selectedRisks.value.includes('alcohol')) {
    score += 2
    recommendations.push('限制酒精摄入有助于保护骨骼健康')
  }
  if (selectedRisks.value.includes('lowWeight')) score += 2
  if (selectedRisks.value.includes('thyroid')) score += 2
  if (selectedRisks.value.includes('arthritis')) {
    score += 2
    recommendations.push('慢性炎症可能影响骨密度，需定期监测')
  }
  if (selectedRisks.value.includes('diabetes')) {
    score += 1
    recommendations.push('糖尿病患者应注意骨骼健康')
  }
  if (selectedRisks.value.includes('sedentary')) {
    score += 2
    recommendations.push('缺乏运动会加速骨质流失，建议增加负重运动')
  }
  if (selectedRisks.value.includes('calcium')) {
    score += 2
    recommendations.push('增加钙摄入，每日1000-1200mg，可通过奶制品和补充剂获得')
  }
  if (selectedRisks.value.includes('vitaminD')) {
    score += 2
    recommendations.push('补充维生素D有助于钙吸收，每日400-800IU')
  }
  if (selectedRisks.value.includes('caffeine')) score += 1
  if (selectedRisks.value.includes('heightLoss')) {
    score += 3
    recommendations.push('身高降低可能是骨质疏松的信号，建议尽快进行骨密度检测')
  }

  // 总体评估
  const percentage = (score / maxScore.value) * 100
  let level, levelText, riskText, description

  if (percentage >= 60) {
    level = 'high'
    levelText = '高风险'
    riskText = '您属于骨质疏松高风险人群'
    description = '您的风险因素较多，强烈建议进行骨密度检测并咨询医生'
    recommendations.push('尽快进行双能X线骨密度检测（DXA）')
    recommendations.push('咨询医生评估是否需要药物治疗')
  } else if (percentage >= 40) {
    level = 'moderate'
    levelText = '中等风险'
    riskText = '您有一定的骨质疏松风险'
    description = '您存在多个风险因素，建议关注骨骼健康并采取预防措施'
    recommendations.push('建议进行骨密度检测')
  } else if (percentage >= 20) {
    level = 'low'
    levelText = '低风险'
    riskText = '您目前风险较低'
    description = '您有少量风险因素，建议保持健康的生活方式'
  } else {
    level = 'very_low'
    levelText = '风险很低'
    riskText = '您的骨骼健康状况良好'
    description = '您目前没有明显风险因素，请继续保持健康的生活方式'
  }

  // 通用建议
  if (recommendations.length === 0) {
    recommendations.push('继续保持健康的生活方式')
    recommendations.push('定期运动，保证充足的钙和维生素D摄入')
  }

  result.value = {
    score,
    maxScore: maxScore.value,
    percentage: percentage.toFixed(0),
    level,
    levelText,
    riskText,
    description,
    recommendations
  }
}

function getRiskClass(level) {
  switch (level) {
    case 'high':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    case 'moderate':
      return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
    case 'low':
      return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
    case 'very_low':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
    default:
      return 'bg-muted'
  }
}

function getRiskIcon(level) {
  switch (level) {
    case 'high':
      return XCircle
    case 'moderate':
      return AlertCircle
    case 'low':
      return AlertCircle
    case 'very_low':
      return CheckCircle
    default:
      return AlertCircle
  }
}

useSeoMeta({
  title: '骨密度风险评估 - 在线骨质疏松风险筛查工具',
  description: '免费在线骨密度风险评估工具，评估骨质疏松风险，了解骨骼健康状况，提供科学的预防建议。', keywords: ['骨密度', '骨质疏松', '骨骼健康', '骨折风险', '骨密度检测', 'T值', '风险评估', '在线工具']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('骨密度风险评估')
</script>
