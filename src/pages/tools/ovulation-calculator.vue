<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">排卵期计算器 - 排卵期预测、受孕窗口、安全期计算</h1>
      <p class="text-muted-foreground">一款免费的在线排卵期计算工具。预测排卵日、排卵期、易受孕期和安全期。帮助备孕和避孕规划。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">月经信息</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">上次月经第一天</label>
          <input v-model="lastPeriod" type="date" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">月经周期 (天)</label>
          <input v-model.number="cycleLength" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="默认28">
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">月经持续天数</label>
          <input v-model.number="periodDays" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="默认5">
        </div>
      </div>
    </div>

    <!-- 计算结果 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-xl font-semibold text-foreground mb-4">计算结果</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="p-4 bg-muted rounded">
          <p class="text-sm text-muted-foreground mb-1">排卵日</p>
          <p class="text-xl font-bold text-primary">{{ ovulationDate }}</p>
        </div>
        <div class="p-4 bg-muted rounded">
          <p class="text-sm text-muted-foreground mb-1">排卵期</p>
          <p class="text-xl font-bold text-primary">{{ ovulationPeriod }}</p>
        </div>
        <div class="p-4 bg-muted rounded">
          <p class="text-sm text-muted-foreground mb-1">下次月经</p>
          <p class="text-xl font-bold text-primary">{{ nextPeriod }}</p>
        </div>
      </div>

      <div class="p-4 bg-muted rounded">
        <h3 class="font-medium text-foreground mb-2">易受孕期 (受孕窗口)</h3>
        <p class="text-lg font-semibold text-primary">{{ fertileWindow }}</p>
        <p class="text-sm text-muted-foreground mt-2">排卵日前5天到后4天</p>
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
          什么是排卵期？
        </h2>
        <p class="text-muted-foreground mb-4">
          排卵期是指女性卵巢排出卵子的时间段，通常在下次月经来潮前的14天左右。
          在这个时期，女性的受孕能力最强，是备孕的最佳时机。排卵期计算器可以帮助您预测排卵日、
          排卵期和易受孕期，为备孕或避孕提供参考依据。
        </p>
        <p class="text-muted-foreground">
          需要注意的是，本计算器基于月经周期规律的前提假设，计算结果仅供参考。
          实际排卵时间可能受到压力、疾病、药物、生活作息等多种因素影响。
          如需准确的排卵期信息，建议结合基础体温测量、排卵试纸检测或咨询专业医生。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入上次月经开始的第一天日期</li>
          <li>输入您的月经周期长度（通常为28天）</li>
          <li>输入月经持续天数（通常为5-7天）</li>
          <li>系统自动计算并显示排卵日、排卵期和易受孕期</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>排卵日预测</strong>: 根据月经周期计算预测的排卵日期</li>
          <li><strong>排卵期计算</strong>: 计算排卵期的起止日期</li>
          <li><strong>易受孕期显示</strong>: 标注最佳受孕窗口期</li>
          <li><strong>下次月经预测</strong>: 预测下次月经的开始日期</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算排卵日？</h3>
            <p class="text-muted-foreground mt-1">
              排卵日通常在下次月经来潮前的14天左右。例如，如果您的月经周期是28天，
              则排卵日大约在月经周期的第14天（从月经第一天开始计算）。如果周期是30天，
              则排卵日大约在第16天。本工具会根据您的月经周期自动计算排卵日。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是易受孕期？</h3>
            <p class="text-muted-foreground mt-1">
              易受孕期是指在排卵日前后的一段时期，此时女性受孕的概率最高。
              精子在女性体内可以存活3-5天，卵子排出后可以存活12-24小时，
              因此排卵日前5天到后4天是易受孕期，共约10天。对于备孕的夫妻来说，
              这是最佳的受孕窗口期。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">月经周期不规律怎么办？</h3>
            <p class="text-muted-foreground mt-1">
              如果您的月经周期不规律，本计算器的结果可能不够准确。建议您：
              1. 记录至少3-6个月的月经周期，计算平均周期长度；2. 结合基础体温测量；
              3. 使用排卵试纸检测；4. 咨询妇科医生，获得更专业的指导。
              对于月经周期严重不规律的女性，建议及时就医检查。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">安全期避孕可靠吗？</h3>
            <p class="text-muted-foreground mt-1">
              安全期避孕法的失败率较高，不建议作为常规避孕方法。因为排卵时间可能受到
              多种因素影响而发生变化，难以准确预测。建议采用更可靠的避孕措施，
              如避孕套、避孕药、宫内节育器等。如有避孕需求，请咨询专业医生选择合适的避孕方式。
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
import { ChevronUp, HelpCircle, Calendar, Heart, Activity, Baby } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '排卵期计算器 - 排卵期预测与受孕窗口计算工具 | Util工具箱',
  description: '免费在线排卵期计算器，预测排卵日、排卵期、易受孕期和安全期。帮助备孕和避孕规划。纯本地计算，数据安全隐私。',
  keywords: '排卵期计算,排卵日,易受孕期,安全期,备孕,月经周期,在线计算器',
  author: 'Util工具箱',
  ogTitle: '排卵期计算器 - 免费在线排卵期预测工具',
  ogDescription: '专业的排卵期计算工具，支持排卵日、排卵期、易受孕期计算。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/ovulation-calculator.png',
  ogUrl: 'https://www.util.cn/tools/ovulation-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '排卵期计算器 - 免费在线排卵期预测',
  twitterDescription: '专业的排卵期计算工具，支持排卵日、排卵期、易受孕期计算。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/ovulation-calculator.png'
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
            name: '排卵期计算器',
            description: '免费在线排卵期计算器，支持排卵日和排卵期预测',
            url: 'https://www.util.cn/tools/ovulation-calculator',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '排卵日预测',
              '排卵期计算',
              '易受孕期显示',
              '安全期计算',
              '月经周期追踪',
              '本地安全处理',
              '实时计算结果'
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
                name: '排卵期计算器',
                item: 'https://www.util.cn/tools/ovulation-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何计算排卵日？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '排卵日通常在下次月经来潮前的14天左右。例如，如果您的月经周期是28天，则排卵日大约在月经周期的第14天（从月经第一天开始计算）。'
                }
              },
              {
                '@type': 'Question',
                name: '什么是易受孕期？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '易受孕期是指在排卵日前后的一段时期，此时女性受孕的概率最高。精子在女性体内可以存活3-5天，卵子排出后可以存活12-24小时，因此排卵日前5天到后4天是易受孕期。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// 数据状态
const lastPeriod = ref(new Date().toISOString().split('T')[0])
const cycleLength = ref(28)
const periodDays = ref(5)

// 计算属性
const ovulationDate = computed(() => {
  const date = new Date(lastPeriod.value)
  date.setDate(date.getDate() + cycleLength.value - 14)
  return date.toLocaleDateString('zh-CN')
})

const ovulationPeriod = computed(() => {
  const date = new Date(lastPeriod.value)
  const start = new Date(date)
  start.setDate(start.getDate() + cycleLength.value - 18)
  const end = new Date(date)
  end.setDate(end.getDate() + cycleLength.value - 11)
  return `${start.toLocaleDateString('zh-CN')} - ${end.toLocaleDateString('zh-CN')}`
})

const nextPeriod = computed(() => {
  const date = new Date(lastPeriod.value)
  date.setDate(date.getDate() + cycleLength.value)
  return date.toLocaleDateString('zh-CN')
})

const fertileWindow = computed(() => {
  const date = new Date(lastPeriod.value)
  const start = new Date(date)
  start.setDate(start.getDate() + cycleLength.value - 19)
  const end = new Date(date)
  end.setDate(end.getDate() + cycleLength.value - 10)
  return `${start.toLocaleDateString('zh-CN')} - ${end.toLocaleDateString('zh-CN')}`
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calendar, Heart, Activity, Baby
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'pregnancy-calculator'),
    tools.find(t => t.id === 'due-date-calculator'),
    tools.find(t => t.id === 'bmi-calculator'),
    tools.find(t => t.id === 'health-tools')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
