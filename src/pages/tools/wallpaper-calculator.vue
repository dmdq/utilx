<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <Frame class="w-8 h-8 text-primary" />
        <h1 class="text-3xl font-bold text-foreground">壁纸用量计算器 - 墙纸卷数与对花损耗计算工具</h1>
      </div>
      <p class="text-muted-foreground">免费在线壁纸用量计算器，按房间周长与墙高自动计算需要多少卷壁纸。支持 0.53m 标准幅、0.70m、1.06m 大幅等规格速查与自定义，可扣除门窗面积并计入对花余量，装修备料不浪费。</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 房间信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">房间信息</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">周长输入方式</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="perimeterMode = 'room'"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  perimeterMode === 'room'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                按长 + 宽自动计算
              </button>
              <button
                @click="perimeterMode = 'perimeter'"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  perimeterMode === 'perimeter'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                直接输入周长
              </button>
            </div>
          </div>

          <div v-if="perimeterMode === 'room'" class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">房间长度（米）</label>
              <input
                v-model.number="roomLength"
                type="number"
                step="0.1"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 4"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">房间宽度（米）</label>
              <input
                v-model.number="roomWidth"
                type="number"
                step="0.1"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 3"
              >
            </div>
          </div>

          <div v-else class="mb-4">
            <label class="block text-sm font-medium mb-1 text-foreground">房间周长（米）</label>
            <input
              v-model.number="perimeterInput"
              type="number"
              step="0.1"
              min="0"
              class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="如 14"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">墙高（米）</label>
              <input
                v-model.number="wallHeight"
                type="number"
                step="0.05"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 2.8"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">扣除门窗面积（㎡，可选）</label>
              <input
                v-model.number="openingArea"
                type="number"
                step="0.1"
                min="0"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 4"
              >
              <p class="text-xs text-muted-foreground mt-1">门窗面积将按墙高折算为墙面长度扣除</p>
            </div>
          </div>
        </div>

        <!-- 壁纸规格 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">壁纸规格</h3>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-foreground">常用规格速查（幅宽 m × 卷长 m）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in paperPresets"
                :key="preset.label"
                @click="selectPaperPreset(preset)"
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
              <label class="block text-sm font-medium mb-1 text-foreground">幅宽（米）</label>
              <input
                v-model.number="rollWidth"
                type="number"
                step="0.01"
                min="0.1"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 0.53"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-foreground">卷长（米）</label>
              <input
                v-model.number="rollLength"
                type="number"
                step="0.1"
                min="0.1"
                class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如 10"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">对花方式</label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="patternMatch = false"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  !patternMatch
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                不对花
              </button>
              <button
                @click="patternMatch = true"
                :class="[
                  'px-4 py-2 rounded-lg transition text-sm',
                  patternMatch
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                ]"
              >
                对花（每幅多留 5cm）
              </button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">带花纹的壁纸需对花裁切，每幅会额外留出 5cm 余量</p>
          </div>
        </div>
      </div>

      <!-- 右侧：计算结果 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">计算结果</label>
        </div>

        <div v-if="isValid" class="space-y-4">
          <!-- 需购卷数（核心结果） -->
          <div class="p-6 bg-muted rounded-lg text-center">
            <p class="text-sm text-muted-foreground mb-1">建议购买卷数</p>
            <p class="text-4xl font-bold text-green-600 dark:text-green-400">
              {{ rollsNeeded }} <span class="text-lg font-medium">卷</span>
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              每卷约可裁 {{ stripsPerRoll }} 幅，共需 {{ stripsNeeded }} 幅
            </p>
          </div>

          <!-- 详细明细 -->
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">墙面周长</span>
              <span class="font-semibold text-foreground">{{ perimeterText }} 米</span>
            </div>
            <div v-if="effectivePerimeter < roomPerimeter" class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">扣除门窗后有效周长</span>
              <span class="font-semibold text-foreground">{{ effectivePerimeterText }} 米</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">每幅裁切长度</span>
              <span class="font-semibold text-foreground">{{ stripLengthText }} 米{{ patternMatch ? '（含 5cm 对花余量）' : '' }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">每卷可裁幅数</span>
              <span class="font-semibold text-foreground">{{ stripsPerRoll }} 幅</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">需贴幅数</span>
              <span class="font-semibold text-foreground">{{ stripsNeeded }} 幅</span>
            </div>
          </div>

          <!-- 建议 -->
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground">
              壁纸建议一次买足同一批号，避免色差；每卷裁幅后剩下的零头可用于门窗上下方补贴。实际购买时若对花损耗较大或墙面不规则，可在结果基础上多备 1 卷。
            </p>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">
          请输入房间周长（或长宽）与墙高开始计算
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
          什么是壁纸用量计算器？
        </h3>
        <p class="text-muted-foreground mb-4">
          壁纸用量计算器是一款免费在线装修备料工具，根据房间周长与墙高，结合壁纸的幅宽和卷长，
          自动计算需要购买多少卷墙纸。工具支持 0.53m×10m 标准规格、0.70m×10m、1.06m×15.6m 大幅对花等常用规格速查与自定义，
          可扣除门窗面积、计入对花余量，帮您精准备料、减少浪费。
        </p>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h3>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择周长输入方式：填写房间长和宽（自动 ×2 得周长），或直接输入墙面周长（米）</li>
          <li>填写墙高（米），如有门窗可填写需扣除的门窗总面积</li>
          <li>点选常用壁纸规格，或自定义幅宽与卷长</li>
          <li>选择对花方式：带花纹壁纸选"对花"，每幅会多留 5cm 裁切余量</li>
          <li>查看每卷可裁幅数、需贴幅数与建议购买卷数</li>
        </ol>

        <h3 class="text-xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          壁纸用量计算公式
        </h3>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>有效周长</strong>: 有效周长 = 周长 − 门窗面积 ÷ 墙高（门窗按墙高折算为墙面长度）</li>
          <li><strong>每幅裁切长度</strong>: 每幅裁切长度 = 墙高 + 对花余量（对花时 +0.05 米）</li>
          <li><strong>每卷可裁幅数</strong>: 每卷可裁幅数 = floor(卷长 ÷ 每幅裁切长度)</li>
          <li><strong>需贴幅数</strong>: 需贴幅数 = ceil(有效周长 ÷ 幅宽)</li>
          <li><strong>需购卷数</strong>: 需购卷数 = ceil(需贴幅数 ÷ 每卷可裁幅数)</li>
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
import { Frame, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { addRecentTool } from '~/composables/useTools'

// 添加到最近使用
addRecentTool('wallpaper-calculator')

// 常见问题（与页面 SEO 区、JSON-LD FAQPage 保持一致）
const faqs = [
  {
    q: '一卷壁纸能贴多少平方米？',
    a: '以最常见的 0.53m×10m 标准卷为例，理论面积为 5.3 平方米，但实际要按幅裁切：墙高 2.8 米时每卷只能裁 3 幅，可覆盖约 3 × 0.53 × 2.8 ≈ 4.45 平方米。墙高越高、对花余量越大，每卷可用面积越少，因此按"幅数"计算比按面积计算更准确。'
  },
  {
    q: '对花和不对花有什么区别？',
    a: '带花纹的壁纸在拼接时需要上下对齐花纹（对花），裁切时每幅要在墙高之外多留约 5cm 余量，导致每卷可裁幅数变少、用量增加。纯色或竖条纹等无需对花的壁纸则可按墙高直接裁切，用量更省。选购时请查看包装上标注的对花方式。'
  },
  {
    q: '门窗面积怎么扣除？',
    a: '本工具按"门窗面积 ÷ 墙高"把门窗面积折算成墙面长度，从周长中扣除后再计算幅数。例如周长 14 米、墙高 2.8 米、门窗 5.6 平方米，相当于扣除 2 米墙面长度，按 12 米周长计算。注意窗台上下仍需补贴零头，扣除量不宜过大。'
  }
]

// SEO配置
useSeoMeta({
  title: '壁纸用量计算器 - 墙纸卷数与对花损耗计算工具 | Util工具箱',
  description: '免费在线壁纸用量计算器，按房间周长与墙高自动计算需要多少卷壁纸。支持标准幅与大幅规格速查、自定义尺寸、扣除门窗面积与对花余量，装修备料不浪费。',
  keywords: '壁纸计算器,墙纸用量计算,壁纸卷数,墙纸计算,装修壁纸,对花损耗,一卷壁纸贴多少',
  author: 'Util工具箱',
  ogTitle: '壁纸用量计算器 - 墙纸卷数与对花损耗计算工具',
  ogDescription: '按房间周长与墙高计算壁纸卷数，支持对花损耗与规格自定义，装修备料必备。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '壁纸用量计算器',
  twitterDescription: '按房间周长与墙高计算壁纸卷数，支持对花损耗与规格自定义。'
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
            name: '壁纸用量计算器',
            description: '按房间周长与墙高计算壁纸卷数，支持对花损耗与规格自定义',
            url: 'https://www.util.cn/tools/wallpaper-calculator',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '常用壁纸规格速查',
              '自定义幅宽卷长',
              '扣除门窗面积',
              '对花余量计算',
              '每卷裁幅数计算',
              '整卷数换算'
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
                name: '壁纸用量计算器',
                item: 'https://www.util.cn/tools/wallpaper-calculator'
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

// 房间信息
const perimeterMode = ref<'room' | 'perimeter'>('perimeter')
const roomLength = ref<number>(4)
const roomWidth = ref<number>(3)
const perimeterInput = ref<number>(14)
const wallHeight = ref<number>(2.8)
const openingArea = ref<number | null>(null)

// 壁纸规格
const paperPresets = [
  { label: '0.53×10 标准幅', width: 0.53, length: 10 },
  { label: '0.70×10', width: 0.7, length: 10 },
  { label: '1.06×15.6 大幅', width: 1.06, length: 15.6 }
]
const rollWidth = ref<number>(0.53)
const rollLength = ref<number>(10)

const selectPaperPreset = (preset: { width: number, length: number }) => {
  rollWidth.value = preset.width
  rollLength.value = preset.length
}

const isPresetActive = (preset: { width: number, length: number }) => {
  return rollWidth.value === preset.width && rollLength.value === preset.length
}

// 对花方式
const patternMatch = ref<boolean>(false)

// 计算过程
const roomPerimeter = computed(() => {
  if (perimeterMode.value === 'perimeter') {
    return perimeterInput.value > 0 ? perimeterInput.value : 0
  }
  const l = roomLength.value > 0 ? roomLength.value : 0
  const w = roomWidth.value > 0 ? roomWidth.value : 0
  return 2 * (l + w)
})

const isValid = computed(() => {
  return roomPerimeter.value > 0 && wallHeight.value > 0 && rollWidth.value > 0 && rollLength.value > 0
})

// 每幅裁切长度 = 墙高 + 对花余量(0.05m)
const stripLength = computed(() => {
  return wallHeight.value + (patternMatch.value ? 0.05 : 0)
})

// 每卷可裁幅数 = floor(卷长 / 每幅裁切长度)
const stripsPerRoll = computed(() => {
  if (stripLength.value <= 0) return 0
  return Math.floor(rollLength.value / stripLength.value)
})

// 有效周长：门窗面积按墙高折算为墙面长度后扣除
const effectivePerimeter = computed(() => {
  let deduction = 0
  if (openingArea.value && openingArea.value > 0 && wallHeight.value > 0) {
    deduction = openingArea.value / wallHeight.value
  }
  return Math.max(0, roomPerimeter.value - deduction)
})

// 需贴幅数 = ceil(有效周长 / 幅宽)
const stripsNeeded = computed(() => {
  if (rollWidth.value <= 0) return 0
  return Math.ceil(effectivePerimeter.value / rollWidth.value)
})

// 需购卷数 = ceil(幅数 / 每卷幅数)
const rollsNeeded = computed(() => {
  if (stripsPerRoll.value <= 0) return 0
  return Math.ceil(stripsNeeded.value / stripsPerRoll.value)
})

const perimeterText = computed(() => {
  return roomPerimeter.value.toFixed(2).replace(/\.?0+$/, '')
})

const effectivePerimeterText = computed(() => {
  return effectivePerimeter.value.toFixed(2).replace(/\.?0+$/, '')
})

const stripLengthText = computed(() => {
  return stripLength.value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
