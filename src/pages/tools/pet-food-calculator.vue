<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <Bone class="w-8 h-8 text-primary" />
        <h1 class="text-3xl font-bold text-foreground">宠物喂食量计算器 - 猫狗每日热量与干粮克数计算工具</h1>
      </div>
      <p class="text-muted-foreground">免费在线宠物喂食量计算器，按体重与生命阶段（幼年/成体/绝育/老年/减重）采用兽医常用的 RER×系数 公式，计算猫狗每日所需热量（kcal）与干粮克数，并给出每日分餐建议，科学喂养不超标。</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">宠物信息</h3>

          <!-- 宠物类型 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">宠物类型</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="selectPetType('dog')"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  petType === 'dog'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                狗
              </button>
              <button
                @click="selectPetType('cat')"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  petType === 'cat'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                猫
              </button>
            </div>
          </div>

          <!-- 体重 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1 text-foreground">体重（kg，0.5-100）</label>
            <input
              v-model.number="weight"
              type="number"
              step="0.1"
              min="0.5"
              max="100"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 10"
            >
            <p class="text-xs text-muted-foreground mt-1">减重期建议以兽医确认的理想体重（而非当前体重）计算</p>
          </div>

          <!-- 生命阶段 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">生命阶段</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="stage in currentStages"
                :key="stage.key"
                @click="selectedStage = stage.key"
                :class="[
                  'px-3 py-2 rounded-lg transition text-sm',
                  selectedStage === stage.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ stage.label }}（×{{ stage.factor }}）
              </button>
            </div>
          </div>

          <!-- 能量密度 -->
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">干粮能量密度（kcal/g）</label>
            <input
              v-model.number="energyDensity"
              type="number"
              step="0.1"
              min="3"
              max="4.5"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 3.5"
            >
            <p class="text-xs text-muted-foreground mt-1">常见干粮约 3.5-4.0 kcal/g，请以包装袋上的代谢能标注为准</p>
          </div>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算结果</label>
        </div>

        <div v-if="isValid" class="space-y-4">
          <!-- 每日干粮克数（核心结果） -->
          <div class="p-6 bg-muted rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">每日干粮建议喂食量</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">
              {{ foodGramsText }} <span class="text-lg font-medium">克/天</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              {{ typeLabel }} · {{ stageLabel }} · 体重 {{ weightText }} kg
            </p>
          </div>

          <!-- 热量明细 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">静息能量需求 RER</span>
              <span class="font-semibold text-foreground">{{ rerText }} kcal/天</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">每日能量需求 DER（RER × {{ factorText }}）</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{ derText }} kcal/天</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">干粮能量密度</span>
              <span class="font-semibold text-foreground">{{ energyDensity }} kcal/g</span>
            </div>
          </div>

          <!-- 分餐建议 -->
          <div class="p-4 bg-muted rounded-lg border border-border">
            <p class="text-sm font-medium text-foreground mb-2">分餐建议</p>
            <p class="text-sm text-muted-foreground">{{ mealAdvice }}</p>
          </div>

          <!-- 提示 -->
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground">
              以上为理论参考值，实际喂食请结合体况评分（BCS）、活动量与零食摄入调整；幼年、孕产期或患有疾病的宠物，请遵医嘱喂食。
            </p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">
          请输入宠物体重（0.5-100kg）开始计算
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <ChevronDown v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h3 class="text-xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是宠物喂食量计算器？
        </h3>
        <p class="text-muted-foreground mb-4">
          宠物喂食量计算器是一款基于兽医营养学公式的免费在线工具。它先按体重计算静息能量需求（RER），
          再根据生命阶段（幼年、成年未绝育、绝育、活跃、老年、减重）乘以对应系数得到每日能量需求（DER），
          最后按干粮能量密度换算成每天该喂多少克狗粮或猫粮，并给出分餐建议，帮您避免"凭手感"喂胖或喂瘦。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择宠物类型：狗或猫</li>
          <li>输入体重（kg，支持 0.5-100kg）</li>
          <li>选择生命阶段，不同阶段对应不同的能量系数</li>
          <li>按狗粮/猫粮包装上的代谢能标注填写能量密度（默认 3.5 kcal/g）</li>
          <li>查看每日热量需求、干粮克数与分餐建议</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          喂食量计算公式
        </h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>静息能量需求</strong>: RER（kcal/天）= 70 × 体重(kg)^0.75</li>
          <li><strong>每日能量需求</strong>: DER = RER × 生命阶段系数</li>
          <li><strong>狗的系数</strong>: 幼犬(&lt;4月) 3.0 / 幼犬(4-12月) 2.0 / 成犬未绝育 1.8 / 成犬已绝育 1.6 / 活跃工作犬 3.0 / 老年 1.4 / 减重 1.0</li>
          <li><strong>猫的系数</strong>: 幼猫 2.5 / 成猫未绝育 1.4 / 成猫已绝育 1.2 / 老年 1.1 / 减重 0.8</li>
          <li><strong>干粮克数</strong>: 每日喂食量（g）= DER ÷ 干粮能量密度（kcal/g）</li>
        </ul>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h3>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h4 class="text-base font-semibold text-foreground">{{ faq.q }}</h4>
            <p class="text-muted-foreground mt-1">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bone, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'

// 添加到最近使用
addRecentTool('pet-food-calculator')

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: 'RER 和 DER 是什么？',
    a: 'RER（Resting Energy Requirement，静息能量需求）是宠物在安静休息状态下维持基本生理活动所需的热量，按 70 × 体重^0.75 计算。DER（Daily Energy Requirement，每日能量需求）= RER × 生命阶段系数，计入生长、活动、绝育状态等额外消耗，是确定每日喂食总热量的依据。例如 10kg 已绝育成犬：RER ≈ 393.6 kcal，DER ≈ 629.8 kcal，按 3.5 kcal/g 的干粮约喂 180g/天。'
  },
  {
    q: '为什么绝育后要少喂？',
    a: '绝育后宠物的新陈代谢率下降、活动量往往减少，热量需求比未绝育时低约 10%-20%（狗的系数从 1.8 降到 1.6，猫从 1.4 降到 1.2）。若绝育后仍按原量喂食，很容易发胖。肥胖会增加糖尿病、关节炎等疾病风险，绝育后建议按计算值喂食并定期称重调整。'
  },
  {
    q: '能量密度（kcal/g）在哪里看？',
    a: '在狗粮或猫粮包装袋的营养成分表或背标上，通常标注为"代谢能"或"ME"，单位是 kcal/kg 或 kcal/g。若标注为 kcal/kg，除以 1000 换算成 kcal/g，例如 3500 kcal/kg = 3.5 kcal/g。不同品牌差异较大（约 3.0-4.5 kcal/g），填写准确值能让喂食量计算更精确。'
  }
]

// SEO配置
useSeoMeta({
  title: '宠物喂食量计算器 - 猫狗每日热量与干粮克数计算工具 | Util工具箱',
  description: '免费在线宠物喂食量计算器，按体重与生命阶段用 RER×系数 公式计算猫狗每日所需热量与干粮克数，附分餐建议，科学喂养不超标。',
  keywords: '宠物喂食量计算器,狗一天吃多少狗粮,猫粮喂食量,宠物热量计算,RER计算,狗粮克数,猫咪热量',
  author: 'Util工具箱',
  ogTitle: '宠物喂食量计算器 - 猫狗每日热量与干粮克数计算工具',
  ogDescription: '按体重与生命阶段计算猫狗每日热量与干粮克数（RER×系数），科学喂养不超标。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '宠物喂食量计算器',
  twitterDescription: '按体重与生命阶段计算猫狗每日热量与干粮克数。'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '宠物喂食量计算器',
            description: '按体重与生命阶段计算猫狗每日热量与干粮克数（RER×系数）',
            url: 'https://www.util.cn/tools/pet-food-calculator',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'RER 静息能量计算',
              'DER 每日能量计算',
              '按生命阶段系数调整',
              '干粮克数换算',
              '分餐建议'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '宠物喂食量计算器',
                item: 'https://www.util.cn/tools/pet-food-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a
              }
            }))
          }
        ]
      })
    }
  ]
})

// 生命阶段定义
interface LifeStage {
  key: string
  label: string
  factor: number
  young: boolean
}

const dogStages: LifeStage[] = [
  { key: 'puppy-young', label: '幼犬（<4月龄）', factor: 3.0, young: true },
  { key: 'puppy', label: '幼犬（4-12月龄）', factor: 2.0, young: true },
  { key: 'adult-intact', label: '成犬未绝育', factor: 1.8, young: false },
  { key: 'adult-neutered', label: '成犬已绝育', factor: 1.6, young: false },
  { key: 'active', label: '活跃/工作犬', factor: 3.0, young: false },
  { key: 'senior', label: '老年犬', factor: 1.4, young: false },
  { key: 'weight-loss', label: '减重期', factor: 1.0, young: false }
]

const catStages: LifeStage[] = [
  { key: 'kitten', label: '幼猫', factor: 2.5, young: true },
  { key: 'adult-intact', label: '成猫未绝育', factor: 1.4, young: false },
  { key: 'adult-neutered', label: '成猫已绝育', factor: 1.2, young: false },
  { key: 'senior', label: '老年猫', factor: 1.1, young: false },
  { key: 'weight-loss', label: '减重期', factor: 0.8, young: false }
]

type PetType = 'dog' | 'cat'

const petType = ref<PetType>('dog')
const weight = ref<number>(10)
const selectedStage = ref<string>('adult-neutered')
const energyDensity = ref<number>(3.5)

const selectPetType = (type: PetType) => {
  petType.value = type
  // 切换类型时重置为该类型的默认阶段
  const stages = type === 'dog' ? dogStages : catStages
  const fallback = stages.find(s => s.key === 'adult-neutered') || stages[0]
  selectedStage.value = fallback.key
}

const currentStages = computed(() => {
  return petType.value === 'dog' ? dogStages : catStages
})

const currentStage = computed(() => {
  const found = currentStages.value.find(s => s.key === selectedStage.value)
  return found || currentStages.value[0]
})

const typeLabel = computed(() => (petType.value === 'dog' ? '狗' : '猫'))
const stageLabel = computed(() => currentStage.value.label)

// 有效性：体重 0.5-100，能量密度 > 0
const isValid = computed(() => {
  const w = weight.value
  return typeof w === 'number' && w >= 0.5 && w <= 100 && energyDensity.value > 0
})

// RER = 70 × 体重^0.75
const rer = computed(() => {
  if (!isValid.value) return 0
  return 70 * Math.pow(weight.value, 0.75)
})

// DER = RER × 生命阶段系数
const der = computed(() => {
  return rer.value * currentStage.value.factor
})

// 干粮克数 = DER / 能量密度
const foodGrams = computed(() => {
  if (!isValid.value) return 0
  return der.value / energyDensity.value
})

const weightText = computed(() => {
  return weight.value.toFixed(1).replace(/\.0$/, '')
})

const rerText = computed(() => rer.value.toFixed(1))
const derText = computed(() => der.value.toFixed(1))
const factorText = computed(() => String(currentStage.value.factor))
const foodGramsText = computed(() => Math.round(foodGrams.value).toString())

// 分餐建议：幼年 3-4 餐，成体 2 餐
const mealAdvice = computed(() => {
  if (currentStage.value.young) {
    const perMeal4 = Math.round(foodGrams.value / 4)
    const perMeal3 = Math.round(foodGrams.value / 3)
    return `幼年宠物肠胃较小，建议每日分 3-4 餐：按 4 餐计每餐约 ${perMeal4} 克，按 3 餐计每餐约 ${perMeal3} 克，少食多餐有助消化吸收。`
  }
  const perMeal = Math.round(foodGrams.value / 2)
  return `成年宠物建议每日分 2 餐（早晚各一次），每餐约 ${perMeal} 克；如同时喂食零食或湿粮，应从每日总热量中相应扣除。`
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
