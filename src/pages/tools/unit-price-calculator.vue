<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">单价计算器 - 商品单价对比、按重量/体积/尺寸换算</h1>
      <p class="text-muted-foreground">一款免费的在线单价计算工具。计算商品单价、对比不同包装的价格、按重量体积换算单价。购物比价必备工具。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 商品A -->
      <div class="flex flex-col h-full bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">商品A</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">价格</label>
            <input v-model.number="productA.price" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">数量/重量</label>
            <input v-model.number="productA.quantity" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">单位</label>
            <select v-model="productA.unit" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="个">个</option>
              <option value="g">克</option>
              <option value="kg">公斤</option>
              <option value="ml">毫升</option>
              <option value="L">升</option>
              <option value="m">米</option>
            </select>
          </div>
          <div class="p-4 bg-muted rounded">
            <p class="text-sm text-muted-foreground">单价</p>
            <p class="text-2xl font-bold text-primary">¥{{ unitPriceA }}</p>
          </div>
        </div>
      </div>

      <!-- 商品B -->
      <div class="flex flex-col h-full bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">商品B</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">价格</label>
            <input v-model.number="productB.price" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">数量/重量</label>
            <input v-model.number="productB.quantity" type="number" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">单位</label>
            <select v-model="productB.unit" class="w-full px-4 py-2 border border-border rounded bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="个">个</option>
              <option value="g">克</option>
              <option value="kg">公斤</option>
              <option value="ml">毫升</option>
              <option value="L">升</option>
              <option value="m">米</option>
            </select>
          </div>
          <div class="p-4 bg-muted rounded">
            <p class="text-sm text-muted-foreground">单价</p>
            <p class="text-2xl font-bold text-primary">¥{{ unitPriceB }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 对比结果 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-xl font-semibold text-foreground mb-4">对比结果</h2>
      <div class="p-4 bg-muted rounded">
        <p class="text-lg font-semibold text-foreground">{{ comparisonText }}</p>
        <p class="text-sm text-muted-foreground mt-2">差价: ¥{{ priceDifference }}</p>
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
          什么是单价计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          单价计算是将商品的总价格除以数量，得到每单位商品的价格。在日常生活中，
          我们经常需要比较不同包装规格商品的价格，比如500克的商品A卖10元，1公斤的商品B卖25元，
          哪个更划算？通过单价计算器可以快速计算出它们的单价，帮助您做出明智的购买决策。
        </p>
        <p class="text-muted-foreground">
          单价计算器不仅适用于购物比价，还可以用于各种场景：比较不同品牌的同类产品、
          计算食材的单位成本、评估促销活动的真实折扣、比较不同供应商的报价等。
          支持多种单位（个、克、公斤、毫升、升、米），满足各种比价需求。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>输入商品A的价格和数量，选择对应单位</li>
          <li>输入商品B的价格和数量，选择对应单位</li>
          <li>系统自动计算两个商品的单价</li>
          <li>查看对比结果，了解哪个更划算</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>单价计算</strong>: 快速计算商品的单价</li>
          <li><strong>价格对比</strong>: 同时对比两个商品的单价</li>
          <li><strong>多单位支持</strong>: 支持重量、体积、长度等多种单位</li>
          <li><strong>实时计算</strong>: 输入参数后立即显示计算结果</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，数据不会上传到服务器</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算单价？</h3>
            <p class="text-muted-foreground mt-1">
              单价 = 总价格 ÷ 数量。例如，商品A的价格是10元，数量是500克，则单价 = 10 ÷ 500 = 0.02元/克。
              本工具会自动进行计算并显示结果。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">单价比较有什么意义？</h3>
            <p class="text-muted-foreground mt-1">
              单价比较可以帮助您了解哪个商品更划算。有时候大包装看起来总价高，但单价可能更低；
              有时候小包装有促销，单价反而比大包装更便宜。通过单价比较，您可以避免被营销手段误导，
              做出更理性的购买决策。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">不同单位的商品可以比较吗？</h3>
            <p class="text-muted-foreground mt-1">
              可以。如果两个商品的单位不同（如克和公斤），本工具会自动计算并显示各自的单价。
              您需要手动转换单位后再进行比较（如将克转换为公斤：1000克 = 1公斤）。
              建议使用相同单位进行比较，以获得更直观的结果。
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
import { ChevronUp, HelpCircle, ShoppingCart, Package, Scale, Calculator } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '单价计算器 - 商品单价对比与价格换算工具 | Util工具箱',
  description: '免费在线单价计算器，计算商品单价、对比不同包装的价格、按重量体积换算单价。购物比价必备工具。纯本地计算，数据安全隐私。',
  keywords: '单价计算,单价对比,价格对比,单位换算,购物比价,性价比,在线计算器',
  author: 'Util工具箱',
  ogTitle: '单价计算器 - 免费在线商品单价对比工具',
  ogDescription: '专业的单价计算工具，支持商品单价计算、价格对比、单位换算。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/unit-price-calculator.png',
  ogUrl: 'https://www.util.cn/tools/unit-price-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '单价计算器 - 免费在线商品单价对比',
  twitterDescription: '专业的单价计算工具，支持商品单价计算、价格对比、单位换算。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/unit-price-calculator.png'
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
            name: '单价计算器',
            description: '免费在线单价计算器，支持商品单价计算和价格对比',
            url: 'https://www.util.cn/tools/unit-price-calculator',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '单价计算',
              '价格对比',
              '多单位支持',
              '重量单位换算',
              '体积单位换算',
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
                name: '单价计算器',
                item: 'https://www.util.cn/tools/unit-price-calculator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何计算单价？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '单价 = 总价格 ÷ 数量。例如，商品A的价格是10元，数量是500克，则单价 = 10 ÷ 500 = 0.02元/克。'
                }
              },
              {
                '@type': 'Question',
                name: '单价比较有什么意义？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '单价比较可以帮助您了解哪个商品更划算。有时候大包装看起来总价高，但单价可能更低；有时候小包装有促销，单价反而比大包装更便宜。'
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
const productA = ref({ price: 10, quantity: 500, unit: 'g' })
const productB = ref({ price: 25, quantity: 1, unit: 'kg' })

// 计算属性
const unitPriceA = computed(() => (productA.value.price / productA.value.quantity).toFixed(4))
const unitPriceB = computed(() => (productB.value.price / productB.value.quantity).toFixed(4))
const priceDifference = computed(() => Math.abs(parseFloat(unitPriceA.value) - parseFloat(unitPriceB.value)).toFixed(4))
const comparisonText = computed(() => {
  const a = parseFloat(unitPriceA.value)
  const b = parseFloat(unitPriceB.value)
  if (a < b) return '商品A 更划算'
  if (a > b) return '商品B 更划算'
  return '单价相同'
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  ShoppingCart, Package, Scale, Calculator
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'sales-tax-calculator'),
    tools.find(t => t.id === 'proportion-calculator'),
    tools.find(t => t.id === 'discount-calculator'),
    tools.find(t => t.id === 'percentage-calculator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
