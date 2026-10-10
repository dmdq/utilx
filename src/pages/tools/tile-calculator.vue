<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <Grid3x3 class="w-8 h-8 text-primary" />
        <h1 class="text-3xl font-bold text-foreground">瓷砖用量计算器 - 铺砖数量与损耗计算工具</h1>
      </div>
      <p class="text-muted-foreground">免费在线瓷砖用量计算器，输入铺贴面积与瓷砖规格，自动计算所需块数、损耗与整箱数。内置 300×300 至 750×1500 等常用规格速查，支持自定义尺寸与单价估算总费用，装修备料必备。</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 铺贴区域 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">铺贴区域</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">输入方式</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="inputMode = 'size'"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  inputMode === 'size'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                按长 × 宽
              </button>
              <button
                @click="inputMode = 'area'"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  inputMode === 'area'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                直接输入面积
              </button>
            </div>
          </div>

          <div v-if="inputMode === 'size'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">铺贴区长度（米）</label>
              <input
                v-model.number="roomLength"
                type="number"
                step="0.1"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 5"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">铺贴区宽度（米）</label>
              <input
                v-model.number="roomWidth"
                type="number"
                step="0.1"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 4"
              >
            </div>
          </div>

          <div v-else>
            <label class="block text-sm font-medium mb-1 text-foreground">铺贴面积（平方米）</label>
            <input
              v-model.number="roomArea"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 20"
            >
          </div>
        </div>

        <!-- 瓷砖规格与费用 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">瓷砖规格</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">常用规格速查（mm）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in tilePresets"
                :key="preset.label"
                @click="selectTilePreset(preset)"
                :class="[
                  'px-3 py-2 rounded-lg transition text-sm',
                  isPresetActive(preset)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">瓷砖长度（mm）</label>
              <input
                v-model.number="tileLength"
                type="number"
                step="1"
                min="1"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 800"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">瓷砖宽度（mm）</label>
              <input
                v-model.number="tileWidth"
                type="number"
                step="1"
                min="1"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 800"
              >
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">损耗率（%）</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <button
                v-for="rate in lossRatePresets"
                :key="rate"
                @click="lossRate = rate"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  lossRate === rate
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                {{ rate }}%
              </button>
            </div>
            <input
              v-model.number="lossRate"
              type="number"
              step="1"
              min="0"
              max="50"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="自定义损耗率"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">每箱片数（可选）</label>
              <input
                v-model.number="piecesPerBox"
                type="number"
                step="1"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 3"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">单片单价（元，可选）</label>
              <input
                v-model.number="piecePrice"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 25"
              >
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
          <!-- 含损耗片数（核心结果） -->
          <div class="p-6 bg-muted rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">建议购买数量（含损耗）</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">
              {{ piecesWithLoss }} <span class="text-lg font-medium">片</span>
            </p>
            <p v-if="boxes > 0" class="text-sm text-muted-foreground mt-2">
              约需整箱：{{ boxes }} 箱（每箱 {{ piecesPerBox }} 片，共 {{ boxes * piecesPerBox }} 片）
            </p>
          </div>

          <!-- 详细明细 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">单片面积</span>
              <span class="font-semibold text-foreground">{{ tileAreaText }} ㎡</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">铺贴面积</span>
              <span class="font-semibold text-foreground">{{ floorAreaText }} ㎡</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">理论用量（不含损耗）</span>
              <span class="font-semibold text-foreground">{{ theoreticalPieces }} 片</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">损耗率</span>
              <span class="font-semibold text-foreground">{{ lossRate }}%</span>
            </div>
            <div v-if="skirtingLength > 0" class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">踢脚线周长参考</span>
              <span class="font-semibold text-foreground">{{ skirtingLength }} 米</span>
            </div>
            <div v-if="totalCost > 0" class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="font-medium text-foreground">瓷砖总金额</span>
              <span class="font-bold text-blue-600 dark:text-blue-400">¥{{ totalCostText }}</span>
            </div>
          </div>

          <!-- 建议 -->
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground">
              实际施工中切割破损、边角对花都会产生损耗，常规铺贴建议按 5%-10% 预留；异形空间、斜铺或鱼骨铺法损耗更高，可适当上调至 10%-15%。
            </p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">
          请输入铺贴面积和瓷砖规格开始计算
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
          什么是瓷砖用量计算器？
        </h3>
        <p class="text-muted-foreground mb-4">
          瓷砖用量计算器是一款免费在线装修备料工具，根据铺贴面积与瓷砖规格，自动计算需要多少块瓷砖。
          工具内置 300×300、300×600、600×600、600×1200、750×1500、800×800 等常用规格速查，也支持自定义瓷砖尺寸，
          并可按损耗率向上取整、按每箱片数折算整箱数、按单价估算总金额，帮您一次买够、避免补货色差。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择输入方式，填写铺贴区的长和宽（米），或直接输入铺贴面积（平方米）</li>
          <li>点选常用瓷砖规格，或在下方自定义瓷砖长宽（毫米）</li>
          <li>选择损耗率（常规 5%-10%，斜铺可更高）</li>
          <li>如需整箱购买，填写每箱片数；如需估算费用，填写单片单价</li>
          <li>查看理论片数、含损耗片数、整箱数与总金额</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          瓷砖用量计算公式
        </h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>单片面积</strong>: 单片面积 = 瓷砖长(mm) × 瓷砖宽(mm) ÷ 1,000,000（换算为平方米）</li>
          <li><strong>理论片数</strong>: 理论片数 = ceil(铺贴面积 ÷ 单片面积)</li>
          <li><strong>含损耗片数</strong>: 含损耗片数 = ceil(理论片数 × (1 + 损耗率 ÷ 100))</li>
          <li><strong>整箱数</strong>: 整箱数 = ceil(含损耗片数 ÷ 每箱片数)</li>
          <li><strong>总金额</strong>: 总金额 = 含损耗片数 × 单片单价</li>
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
import { Grid3x3, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'

// 添加到最近使用
addRecentTool('tile-calculator')

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: '瓷砖损耗率一般取多少？',
    a: '常规正铺建议按 5%-10% 预留损耗，其中 5% 适合方正大空间，8%-10% 适合有小边角或需切割较多的房间。斜铺、鱼骨铺、异形空间损耗可达 10%-15%，建议适当上调，宁可少量余砖也不要补货，不同批次瓷砖可能有色差。'
  },
  {
    q: '一平方米要多少块 800×800 的瓷砖？',
    a: '800×800mm 瓷砖单片面积为 0.64 平方米，一平方米约需 1.56 片，向上取整即 2 片（未计损耗）。例如 20 平方米的客厅：20 ÷ 0.64 = 31.25，理论 32 片，按 8% 损耗计算约需 35 片。'
  },
  {
    q: '踢脚线怎么估算用量？',
    a: '踢脚线长度一般按房间周长估算：周长 = (长 + 宽) × 2，再扣除门口宽度并增加少量损耗。本工具在"按长×宽"模式下会给出周长参考值，实际购买时建议在周长基础上扣减门洞后上浮 5% 左右。'
  }
]

// SEO配置
useSeoMeta({
  title: '瓷砖用量计算器 - 铺砖数量与损耗计算工具 | Util工具箱',
  description: '免费在线瓷砖用量计算器，输入铺贴面积与瓷砖规格，自动计算所需块数、损耗与整箱数。内置常用规格速查，支持自定义尺寸与总费用估算，装修备料必备。',
  keywords: '瓷砖计算器,瓷砖用量计算,铺砖块数,瓷砖损耗,装修计算器,800x800瓷砖,一平方多少块砖',
  author: 'Util工具箱',
  ogTitle: '瓷砖用量计算器 - 铺砖数量与损耗计算工具',
  ogDescription: '输入铺贴面积与瓷砖规格，自动计算所需块数、损耗与整箱数，装修备料必备。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '瓷砖用量计算器',
  twitterDescription: '输入铺贴面积与瓷砖规格，自动计算所需块数、损耗与整箱数。'
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
            name: '瓷砖用量计算器',
            description: '输入铺贴面积与瓷砖规格，自动计算所需块数、损耗与整箱数',
            url: 'https://www.util.cn/tools/tile-calculator',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '常用瓷砖规格速查',
              '自定义瓷砖尺寸',
              '损耗率计算',
              '整箱数换算',
              '踢脚线周长参考',
              '总金额估算'
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
                name: '瓷砖用量计算器',
                item: 'https://www.util.cn/tools/tile-calculator'
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

// 铺贴区域
const inputMode = ref<'size' | 'area'>('size')
const roomLength = ref<number>(5)
const roomWidth = ref<number>(4)
const roomArea = ref<number>(20)

// 瓷砖规格
const tilePresets = [
  { label: '300×300', length: 300, width: 300 },
  { label: '300×600', length: 600, width: 300 },
  { label: '600×600', length: 600, width: 600 },
  { label: '600×1200', length: 1200, width: 600 },
  { label: '750×1500', length: 1500, width: 750 },
  { label: '800×800', length: 800, width: 800 }
]
const tileLength = ref<number>(800)
const tileWidth = ref<number>(800)

const selectTilePreset = (preset: { length: number, width: number }) => {
  tileLength.value = preset.length
  tileWidth.value = preset.width
}

const isPresetActive = (preset: { length: number, width: number }) => {
  return tileLength.value === preset.length && tileWidth.value === preset.width
}

// 损耗率与费用
const lossRatePresets = [5, 8, 10]
const lossRate = ref<number>(8)
const piecesPerBox = ref<number | null>(null)
const piecePrice = ref<number | null>(null)

// 计算过程
const floorArea = computed(() => {
  if (inputMode.value === 'area') {
    return roomArea.value > 0 ? roomArea.value : 0
  }
  const l = roomLength.value > 0 ? roomLength.value : 0
  const w = roomWidth.value > 0 ? roomWidth.value : 0
  return l * w
})

const isValid = computed(() => {
  return floorArea.value > 0 && tileLength.value > 0 && tileWidth.value > 0
})

const tileAreaText = computed(() => {
  return ((tileLength.value * tileWidth.value) / 1e6).toFixed(4).replace(/\.?0+$/, '')
})

const floorAreaText = computed(() => {
  return floorArea.value.toFixed(2).replace(/\.?0+$/, '')
})

// 理论片数 = ceil(面积(mm²) / 单片(mm²))，用平方毫米运算避免浮点误差
const theoreticalPieces = computed(() => {
  if (!isValid.value) return 0
  const areaMm2 = floorArea.value * 1e6
  const tileMm2 = tileLength.value * tileWidth.value
  return Math.ceil(areaMm2 / tileMm2)
})

// 含损耗片数 = ceil(理论 × (1 + 损耗率/100))
const piecesWithLoss = computed(() => {
  if (theoreticalPieces.value <= 0) return 0
  const rate = lossRate.value > 0 ? lossRate.value : 0
  return Math.ceil(theoreticalPieces.value * (1 + rate / 100))
})

// 整箱数
const boxes = computed(() => {
  if (!piecesPerBox.value || piecesPerBox.value <= 0) return 0
  return Math.ceil(piecesWithLoss.value / piecesPerBox.value)
})

// 踢脚线周长参考（仅按长×宽模式下有意义）
const skirtingLength = computed(() => {
  if (inputMode.value !== 'size') return 0
  const l = roomLength.value > 0 ? roomLength.value : 0
  const w = roomWidth.value > 0 ? roomWidth.value : 0
  if (l <= 0 && w <= 0) return 0
  return Number((2 * (l + w)).toFixed(2))
})

// 总金额
const totalCost = computed(() => {
  if (!piecePrice.value || piecePrice.value <= 0) return 0
  return piecesWithLoss.value * piecePrice.value
})

const totalCostText = computed(() => {
  return totalCost.value.toFixed(2)
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
