<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">油耗计算器 - 汽车油耗成本计算</h1>
      <p class="text-muted-foreground">在线油耗计算器，计算百公里油耗、油费和行程成本。支持不同油价计算，适用于车主计算燃油消耗，帮助您了解车辆实际油耗和开支。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">输入数据</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">行驶里程 (公里)</label>
            <input v-model.number="distance" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted" placeholder="如 500">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">消耗燃油 (升)</label>
            <input v-model.number="fuel" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted" placeholder="如 40">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">油价 (元/升)</label>
            <input v-model.number="price" type="number" step="0.01" class="w-full px-4 py-2 border border-border rounded bg-muted" placeholder="如 8.5">
          </div>
        </div>
      </div>

      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">计算结果</h2>
        <div class="space-y-4">
          <div class="p-4 bg-blue-500/10 rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">百公里油耗</p>
            <p class="text-3xl font-bold text-blue-600">{{ consumption.toFixed(1) }} L/100km</p>
          </div>
          <div class="p-4 bg-green-500/10 rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">油费</p>
            <p class="text-3xl font-bold text-green-600">¥{{ totalCost.toFixed(2) }}</p>
          </div>
          <div class="p-4 bg-purple-500/10 rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">每公里成本</p>
            <p class="text-3xl font-bold text-purple-600">¥{{ costPerKm.toFixed(2) }}</p>
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
          什么是油耗计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          油耗是指汽车在行驶一定距离所消耗的燃油量，通常用"升/百公里"(L/100km)来表示。
          油耗是衡量汽车经济性的重要指标，直接影响用车成本。通过油耗计算器，您可以准确了解车辆的实际油耗情况，
          合理规划出行预算，对比不同车型或驾驶习惯对油耗的影响。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入您的行驶里程（公里）</li>
          <li>输入这段行程消耗的燃油量（升）</li>
          <li>输入当前的油价（元/升）</li>
          <li>查看计算结果，包括百公里油耗、总油费和每公里成本</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          油耗计算公式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>百公里油耗</strong> = (消耗燃油量 ÷ 行驶里程) × 100</li>
          <li><strong>总油费</strong> = 消耗燃油量 × 油价</li>
          <li><strong>每公里成本</strong> = 总油费 ÷ 行驶里程</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          节油小贴士
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>保持稳定的驾驶速度，避免急加速和急刹车</li>
          <li>定期保养车辆，保持轮胎气压正常</li>
          <li>减少车内不必要的载重，拆除车顶行李架</li>
          <li>合理规划路线，避免拥堵路段</li>
          <li>使用合适的档位，避免高转速低档位行驶</li>
          <li>长时间等待时熄火，减少怠速油耗</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何准确测量油耗？</h3>
            <p class="text-muted-foreground mt-1">
              最准确的方法是在加油时将油箱加满，记录里程表读数。行驶一定距离后，再次将油箱加满，
              记录加入的油量和行驶里程。使用本工具输入这些数据即可得到准确的油耗。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么影响汽车油耗？</h3>
            <p class="text-muted-foreground mt-1">
              影响油耗的因素有很多：驾驶习惯（急加速、急刹车会增加油耗）、行驶路况（城市拥堵路况油耗更高）、
              车辆状况（保养良好的车油耗更低）、车载重量、空调使用、轮胎气压等。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么我的实际油耗与官方数据不同？</h3>
            <p class="text-muted-foreground mt-1">
              官方油耗数据通常是在理想测试条件下得出的，而实际使用中受到驾驶习惯、路况、气候、
              车辆状况等多种因素影响，因此实际油耗通常会高于官方数据。
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
import { HelpCircle, ChevronUp, Calculator, Car, DollarSign, TrendingUp } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '油耗计算器 - 汽车油耗成本计算 | Util工具箱',
  description: '在线油耗计算器，计算百公里油耗、油费和行程成本。支持不同油价计算，适用于车主计算燃油消耗，帮助您了解车辆实际油耗和开支。',
  keywords: '油耗计算,百公里油耗,油费计算,汽车油耗,燃油成本,油耗换算',
  author: 'Util工具箱',
  ogTitle: '油耗计算器 - 汽车油耗成本计算工具',
  ogDescription: '专业的油耗计算工具，计算百公里油耗、总油费和每公里成本。支持不同油价，帮助车主了解实际油耗和开支。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '油耗计算器 - 汽车油耗成本计算',
  twitterDescription: '专业的油耗计算工具，计算百公里油耗、总油费和每公里成本。'
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
            name: '油耗计算器',
            description: '在线油耗计算工具，计算百公里油耗、油费和行程成本',
            url: 'https://www.util.cn/tools/fuel-calculator',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '百公里油耗计算',
              '总油费计算',
              '每公里成本计算',
              '支持不同油价',
              '实时结果显示'
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
                name: '油耗计算器',
                item: 'https://www.util.cn/tools/fuel-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何准确测量油耗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '最准确的方法是在加油时将油箱加满，记录里程表读数。行驶一定距离后，再次将油箱加满，记录加入的油量和行驶里程。使用本工具输入这些数据即可得到准确的油耗。'
                }
              },
              {
                '@type': 'Question',
                name: '什么影响汽车油耗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '影响油耗的因素有很多：驾驶习惯、行驶路况、车辆状况、车载重量、空调使用、轮胎气压等。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const distance = ref(500)
const fuel = ref(40)
const price = ref(8.5)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Calculator, Car, DollarSign, TrendingUp
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'unit-converter'),
    tools.find(t => t.id === 'loan-calculator'),
    tools.find(t => t.id === 'depreciation-calculator'),
    tools.find(t => t.id === 'percentage-calculator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

const consumption = computed(() => {
  if (distance.value === 0) return 0
  return (fuel.value / distance.value) * 100
})

const totalCost = computed(() => fuel.value * price.value)

const costPerKm = computed(() => {
  if (distance.value === 0) return 0
  return totalCost.value / distance.value
})

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
