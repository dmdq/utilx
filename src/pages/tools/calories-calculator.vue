<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">卡路里计算器 - 每日热量需求计算</h1>
      <p class="text-muted-foreground">在线卡路里计算器，计算基础代谢率BMR、每日总消耗TDEE、减重增重热量需求。支持Mifflin-St Jeor公式，帮助您制定科学的饮食计划。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">输入信息</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">性别</label>
            <select v-model="gender" class="w-full px-4 py-2 border border-border rounded bg-muted">
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">年龄</label>
            <input v-model.number="age" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">身高 (cm)</label>
            <input v-model.number="height" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">体重 (kg)</label>
            <input v-model.number="weight" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">活动水平</label>
            <select v-model="activity" class="w-full px-4 py-2 border border-border rounded bg-muted">
              <option value="1.2">久坐不动</option>
              <option value="1.375">轻度活动 (1-3天/周)</option>
              <option value="1.55">中度活动 (3-5天/周)</option>
              <option value="1.725">高度活动 (6-7天/周)</option>
              <option value="1.9">极高度活动 (体力劳动/训练)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">计算结果</h2>
        <div class="space-y-4">
          <div class="p-4 bg-blue-500/10 rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">基础代谢率 (BMR)</p>
            <p class="text-3xl font-bold text-blue-600">{{ bmr }} kcal</p>
          </div>
          <div class="p-4 bg-green-500/10 rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">每日总消耗 (TDEE)</p>
            <p class="text-3xl font-bold text-green-600">{{ tdee }} kcal</p>
          </div>
          <div class="p-4 bg-purple-500/10 rounded-lg">
            <p class="text-sm font-medium text-foreground mb-2">减重/增重目标</p>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">减重 (-500kcal)</span>
                <span class="font-semibold text-foreground">{{ (tdee - 500).toFixed(0) }} kcal</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">增重 (+500kcal)</span>
                <span class="font-semibold text-foreground">{{ (tdee + 500).toFixed(0) }} kcal</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">保持体重</span>
                <span class="font-semibold text-foreground">{{ tdee }} kcal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是卡路里计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          卡路里（Calorie）是能量单位，用于衡量食物中的能量含量和人体消耗的能量。
          基础代谢率（BMR）是指人体在安静状态下（通常为静卧状态）消耗的最低热量，主要用于维持人体器官的正常运作。
          每日总能量消耗（TDEE）是指您一天中消耗的总热量，包括基础代谢和日常活动消耗。
          通过卡路里计算器，您可以了解自己的热量需求，制定合理的饮食计划。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择您的性别</li>
          <li>输入您的年龄、身高和体重</li>
          <li>选择您的日常活动水平</li>
          <li>查看计算结果，包括BMR、TDEE和不同目标的热量需求</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          计算公式说明
        </h2>
        <p class="text-muted-foreground mb-4">
          本工具采用Mifflin-St Jeor公式计算基础代谢率，这是目前被认为最准确的公式之一：
        </p>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>男性BMR</strong> = (10 × 体重kg) + (6.25 × 身高cm) - (5 × 年龄) + 5</li>
          <li><strong>女性BMR</strong> = (10 × 体重kg) + (6.25 × 身高cm) - (5 × 年龄) - 161</li>
          <li><strong>TDEE</strong> = BMR × 活动系数</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          减重与增重建议
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>减重</strong>: 每日摄入热量比TDEE少500大卡，理论上每周可减重约0.5公斤</li>
          <li><strong>增重</strong>: 每日摄入热量比TDEE多500大卡，理论上每周可增重约0.5公斤</li>
          <li><strong>保持体重</strong>: 每日摄入热量等于TDEE</li>
          <li><strong>健康提示</strong>: 每日热量摄入不应低于基础代谢率，极端节食可能损害健康</li>
          <li><strong>运动建议</strong>: 结合适量运动和饮食控制效果更佳，每周减重0.5-1公斤为健康速度</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是基础代谢率（BMR）？</h3>
            <p class="text-muted-foreground mt-1">
              基础代谢率是指人体在静止状态下（如睡觉时）维持生命活动所需的最低热量。
              这些能量用于心跳、呼吸、细胞修复等基本生理功能。BMR占总热量消耗的60-75%。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择正确的活动水平？</h3>
            <p class="text-muted-foreground mt-1">
              久坐不动：办公室工作，很少运动；轻度活动：每周运动1-3天；中度活动：每周运动3-5天；
              高度活动：每周运动6-7天；极高度活动：体力劳动或每天高强度训练。
              请根据您的实际情况选择最接近的活动水平。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">减重速度多少才健康？</h3>
            <p class="text-muted-foreground mt-1">
              健康的减重速度是每周0.5-1公斤，这相当于每天热量缺口500-1000大卡。
              过快的减重可能导致肌肉流失、营养不良、代谢降低等问题。
              建议通过合理饮食和适量运动来实现可持续的健康减重。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp, Calculator, Activity, Apple, Target } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '卡路里计算器 - 每日热量需求计算 | Util工具箱',
  description: '在线卡路里计算器，计算基础代谢率BMR、每日总消耗TDEE、减重增重热量需求。支持Mifflin-St Jeor公式，帮助您制定科学的饮食计划。',
  keywords: '卡路里计算,BMR计算,基础代谢,每日消耗,TDEE,减重热量,增重热量',
  author: 'Util工具箱',
  ogTitle: '卡路里计算器 - 每日热量需求计算',
  ogDescription: '专业的卡路里计算工具，计算BMR、TDEE和不同目标的热量需求。支持Mifflin-St Jeor公式，帮助制定科学的饮食计划。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '卡路里计算器 - 每日热量需求计算',
  twitterDescription: '专业的卡路里计算工具，计算BMR、TDEE和不同目标的热量需求。'
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
            name: '卡路里计算器',
            description: '在线卡路里计算工具，计算基础代谢率和每日总消耗',
            url: 'https://www.util.cn/tools/calories-calculator',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'BMR计算',
              'TDEE计算',
              'Mifflin-St Jeor公式',
              '减重热量计算',
              '增重热量计算',
              '多活动水平支持'
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
                name: '卡路里计算器',
                item: 'https://www.util.cn/tools/calories-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是基础代谢率（BMR）？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '基础代谢率是指人体在静止状态下维持生命活动所需的最低热量。这些能量用于心跳、呼吸、细胞修复等基本生理功能。BMR占总热量消耗的60-75%。'
                }
              },
              {
                '@type': 'Question',
                name: '如何选择正确的活动水平？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '久坐不动：办公室工作，很少运动；轻度活动：每周运动1-3天；中度活动：每周运动3-5天；高度活动：每周运动6-7天；极高度活动：体力劳动或每天高强度训练。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const gender = ref('male')
const age = ref(30)
const height = ref(175)
const weight = ref(70)
const activity = ref(1.375)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calculator, Activity, Apple, Target
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'bmi-calculator'),
    tools.find(t => t.id === 'body-fat-calculator'),
    tools.find(t => t.id === 'protein-calculator'),
    tools.find(t => t.id === 'unit-converter')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

const bmr = computed(() => {
  // Mifflin-St Jeor 公式
  if (gender.value === 'male') {
    return Math.round((10 * weight.value) + (6.25 * height.value) - (5 * age.value) + 5)
  } else {
    return Math.round((10 * weight.value) + (6.25 * height.value) - (5 * age.value) - 161)
  }
})

const tdee = computed(() => Math.round(bmr.value * activity.value))

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
