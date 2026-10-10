<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <Zap class="w-8 h-8 text-primary" />
        <h1 class="text-3xl font-bold text-foreground">电器耗电量计算器 - 电费与用电量计算工具</h1>
      </div>
      <p class="text-muted-foreground">免费在线电器耗电量计算器，输入电器功率、每日使用时长和电价，即可算出日、月、年耗电量与电费。内置空调、热水器、电饭煲等常见家电功率速查，冰箱可按日均耗电量直接计算，支持阶梯电价参考提示。</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">电器信息</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">常见电器功率速查</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="appliance in appliancePresets"
                :key="appliance.name"
                @click="selectAppliance(appliance)"
                class="px-3 py-2 rounded-lg transition text-sm bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                {{ appliance.name }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">点击电器自动填入功率，实际功率请以电器铭牌为准</p>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">计算方式</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="powerMode = 'watt'"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  powerMode === 'watt'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                按功率计算
              </button>
              <button
                @click="powerMode = 'daily'"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  powerMode === 'daily'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                按日耗电量计算
              </button>
            </div>
          </div>

          <div v-if="powerMode === 'watt'" class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">电器功率（瓦 W）</label>
              <input
                v-model.number="powerWatt"
                type="number"
                step="10"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 1100"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">每日使用时长（小时）</label>
              <input
                v-model.number="hoursPerDay"
                type="number"
                step="0.5"
                min="0"
                max="24"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 8"
              >
            </div>
          </div>

          <div v-else class="mb-4">
            <label class="block text-sm font-medium mb-1 text-foreground">日均耗电量（千瓦时 kWh / 度）</label>
            <input
              v-model.number="dailyKwhInput"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 1.2"
            >
            <p class="text-xs text-muted-foreground mt-1">冰箱等间歇工作电器可直接填能效标签上的日耗电量</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">电价（元/千瓦时）</label>
              <input
                v-model.number="pricePerKwh"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 0.55"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-foreground">计算天数</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="day in dayPresets"
                  :key="day"
                  @click="calcDays = day"
                  :class="[
                    'px-4 py-2 rounded-lg transition text-sm flex-1',
                    calcDays === day
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  ]"
                >
                  {{ day }}天
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算结果</label>
        </div>

        <div v-if="isValid" class="space-y-4">
          <!-- 按所选天数（核心结果） -->
          <div class="p-6 bg-muted rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">按当前设置 {{ calcDays }} 天合计</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">
              ¥{{ periodCostText }}
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              共用电 {{ periodKwhText }} 度（kWh）
            </p>
          </div>

          <!-- 日 / 月 / 年明细 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">日耗电量</span>
              <span class="font-semibold text-foreground">{{ dailyKwhText }} 度</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">日电费</span>
              <span class="font-semibold text-foreground">¥{{ dailyCostText }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">月耗电量 / 电费（30天）</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{ monthKwhText }} 度 / ¥{{ monthCostText }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">年耗电量 / 电费（365天）</span>
              <span class="font-semibold text-foreground">{{ yearKwhText }} 度 / ¥{{ yearCostText }}</span>
            </div>
          </div>

          <!-- 阶梯电价提示 -->
          <div v-if="tierHint" class="p-4 bg-muted rounded-lg border border-border">
            <p class="text-sm text-foreground font-medium mb-1">阶梯电价提示（仅供参考）</p>
            <p class="text-xs text-muted-foreground">{{ tierHint }}</p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">
          请输入电器功率（或日耗电量）和使用时长开始计算
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
          什么是电器耗电量计算器？
        </h3>
        <p class="text-muted-foreground mb-4">
          电器耗电量计算器是一款免费在线电费估算工具，根据电器功率、每日使用时长与电价，快速算出一天、一个月、一年分别用多少度电、花多少钱。
          工具内置 1.5 匹空调、电热水器、电饭煲、微波炉、冰箱、洗衣机、电视、电脑等常见家电功率速查，冰箱等间歇工作电器还可直接按日均耗电量计算，
          并提供阶梯电价参考提示，帮您摸清家中"电老虎"。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>点击常见电器速查填入功率，或在"按功率计算"中手动输入功率（瓦）与每日使用时长（小时）</li>
          <li>冰箱等电器可切换"按日耗电量计算"，直接填能效标签上的日耗电量（度）</li>
          <li>填写当地电价（元/度，默认 0.55 元）</li>
          <li>选择计算天数（1 天 / 30 天 / 365 天）查看区间费用</li>
          <li>查看日、月、年耗电量与电费明细，以及阶梯电价提示</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          耗电量计算公式
        </h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>日耗电量</strong>: 日耗电（度）= 功率(W) × 使用时长(h) ÷ 1000</li>
          <li><strong>日电费</strong>: 日电费 = 日耗电量 × 电价（元/度）</li>
          <li><strong>月电费</strong>: 月电费 = 日电费 × 30</li>
          <li><strong>年电费</strong>: 年电费 = 日电费 × 365</li>
          <li><strong>1 度电</strong>: 1 千瓦时（kWh）= 1000 瓦电器工作 1 小时的用电量</li>
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
import { Zap, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'

// 添加到最近使用
addRecentTool('electricity-calculator')

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: '一度电是多少钱，怎么算？',
    a: '一度电就是 1 千瓦时（kWh），金额 = 用电度数 × 电价。例如电价 0.55 元/度时，一台 1100W 的空调开 8 小时：1100 × 8 ÷ 1000 = 8.8 度，电费 = 8.8 × 0.55 ≈ 4.84 元，一个月（30 天）约 264 度、145.2 元。居民电价各地不同，请以当地供电公司公布为准。'
  },
  {
    q: '空调的耗电量怎么估算？',
    a: '空调铭牌上的功率（如 1.5 匹约 1100W）是压缩机满负荷运行的功率。实际运行中达到设定温度后会降频或停机，长时间开启时耗电通常低于"功率 × 时长"的估算值；频繁开关反而更费电。变频空调可按额定功率的 60%-80% 粗略估算长时间运行的平均功耗。'
  },
  {
    q: '什么是阶梯电价？',
    a: '阶梯电价是把每月用电量分成若干档，用电越多、超出部分的电价越高。多数地区第一档约 200 度以内、第二档 200-400 度、第三档 400 度以上，各档电价依次上浮约 0.05-0.3 元/度。本工具按单一电价计算并给出阶梯提示，仅供参考，实际账单请以当地阶梯电价政策为准。'
  }
]

// SEO配置
useSeoMeta({
  title: '电器耗电量计算器 - 电费与用电量计算工具 | Util工具箱',
  description: '免费在线电器耗电量计算器，功率×时长×电价快速算出日、月、年耗电量与电费。内置空调热水器冰箱等常见家电功率速查，支持阶梯电价提示。',
  keywords: '电费计算器,电器耗电量计算,空调耗电量,家电用电量,电费多少钱,一度电,功率转千瓦时',
  author: 'Util工具箱',
  ogTitle: '电器耗电量计算器 - 电费与用电量计算工具',
  ogDescription: '功率×时长×电价快速算出日、月、年耗电量与电费，内置常见家电功率速查。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '电器耗电量计算器',
  twitterDescription: '功率×时长×电价快速算出日、月、年耗电量与电费。'
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
            name: '电器耗电量计算器',
            description: '功率×时长×电价快速算出日、月、年耗电量与电费',
            url: 'https://www.util.cn/tools/electricity-calculator',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '常见家电功率速查',
              '按功率或日耗电量计算',
              '日月年电费估算',
              '自定义电价',
              '阶梯电价提示'
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
                name: '电器耗电量计算器',
                item: 'https://www.util.cn/tools/electricity-calculator'
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

// 常见电器功率速查
interface Appliance {
  name: string
  watt?: number
  dailyKwh?: number
}

const appliancePresets: Appliance[] = [
  { name: '1.5匹空调', watt: 1100 },
  { name: '电热水器', watt: 2000 },
  { name: '电饭煲', watt: 800 },
  { name: '微波炉', watt: 1200 },
  { name: '冰箱(日均)', dailyKwh: 1.0 },
  { name: '洗衣机', watt: 500 },
  { name: '电视', watt: 100 },
  { name: '电脑', watt: 300 }
]

// 计算方式与输入
const powerMode = ref<'watt' | 'daily'>('watt')
const powerWatt = ref<number>(1100)
const hoursPerDay = ref<number>(8)
const dailyKwhInput = ref<number>(1.0)
const pricePerKwh = ref<number>(0.55)
const dayPresets = [1, 30, 365]
const calcDays = ref<number>(30)

const selectAppliance = (appliance: Appliance) => {
  if (appliance.dailyKwh !== undefined) {
    // 冰箱等按日均耗电量计算的电器
    powerMode.value = 'daily'
    dailyKwhInput.value = appliance.dailyKwh
    return
  }
  powerMode.value = 'watt'
  if (appliance.watt !== undefined) {
    powerWatt.value = appliance.watt
  }
}

// 计算过程
const isValid = computed(() => {
  if (powerMode.value === 'watt') {
    return powerWatt.value > 0 && hoursPerDay.value > 0
  }
  return dailyKwhInput.value > 0
})

// 日耗电量（度）
const dailyKwh = computed(() => {
  if (!isValid.value) return 0
  if (powerMode.value === 'daily') {
    return dailyKwhInput.value
  }
  return (powerWatt.value * hoursPerDay.value) / 1000
})

const dailyCost = computed(() => {
  return dailyKwh.value * (pricePerKwh.value > 0 ? pricePerKwh.value : 0)
})

const periodKwh = computed(() => {
  return dailyKwh.value * calcDays.value
})

const periodCost = computed(() => {
  return dailyCost.value * calcDays.value
})

const monthKwh = computed(() => {
  return dailyKwh.value * 30
})

const monthCost = computed(() => {
  return dailyCost.value * 30
})

const yearKwh = computed(() => {
  return dailyKwh.value * 365
})

const yearCost = computed(() => {
  return dailyCost.value * 365
})

// 阶梯电价提示（仅提示不强制）
const tierHint = computed(() => {
  const mk = monthKwh.value
  if (mk <= 0) return ''
  if (mk > 400) {
    return `按当前用量，月用电约 ${mk.toFixed(0)} 度，可能进入阶梯电价第三档（多数地区为 400 度以上），超出部分电价明显上浮，实际电费可能高于按单一电价计算的结果，请以当地供电公司公布的阶梯电价为准。`
  }
  if (mk > 200) {
    return `按当前用量，月用电约 ${mk.toFixed(0)} 度，可能进入阶梯电价第二档（多数地区为 200-400 度），超出部分电价略有上浮，实际电费可能略高于按单一电价计算的结果，请以当地阶梯电价政策为准。`
  }
  return `按当前用量，月用电约 ${mk.toFixed(0)} 度，一般处于阶梯电价第一档区间（多数地区为 200 度以内），按单一电价估算与实际账单较为接近。`
})

// 格式化输出
const fmt = (n: number, digits = 2) => {
  return n.toFixed(digits).replace(/\.?0+$/, '')
}

const dailyKwhText = computed(() => fmt(dailyKwh.value))
const dailyCostText = computed(() => dailyCost.value.toFixed(2))
const periodKwhText = computed(() => fmt(periodKwh.value))
const periodCostText = computed(() => periodCost.value.toFixed(2))
const monthKwhText = computed(() => fmt(monthKwh.value))
const monthCostText = computed(() => monthCost.value.toFixed(2))
const yearKwhText = computed(() => fmt(yearKwh.value))
const yearCostText = computed(() => yearCost.value.toFixed(2))

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
