<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">速度计算器 - 时间距离速度换算工具</h1>
      <p class="text-muted-foreground">在线速度计算器，支持速度/时间/距离互转计算。提供多种单位换算（km/h、m/s、mph、节），适用于跑步、驾车、航行等速度计算场景。</p>
    </div>

    <!-- 计算模式切换 -->
    <div class="mb-6 bg-card rounded-xl p-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="mode in calculationModes"
          :key="mode.id"
          @click="currentMode = mode.id"
          :class="[
            'px-4 py-2 rounded-lg transition',
            currentMode === mode.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-foreground'
          ]"
        >
          {{ mode.name }}
        </button>
      </div>
    </div>

    <!-- 计算速度模式 -->
    <div v-if="currentMode === 'speed'" class="grid md:grid-cols-2 gap-6">
      <div class="bg-card rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-foreground">输入数据</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">距离</label>
            <div class="flex gap-2">
              <input
                v-model.number="distance"
                type="number"
                step="0.01"
                min="0"
                class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
                placeholder="输入距离"
              >
              <select v-model="distanceUnit" class="px-3 py-2 border border-border rounded-lg bg-muted">
                <option value="km">公里</option>
                <option value="m">米</option>
                <option value="mile">英里</option>
                <option value="nmi">海里</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">时间</label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <input
                  v-model.number="hours"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                  placeholder="时"
                >
                <span class="text-xs text-muted-foreground">小时</span>
              </div>
              <div>
                <input
                  v-model.number="minutes"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                  placeholder="分"
                >
                <span class="text-xs text-muted-foreground">分钟</span>
              </div>
              <div>
                <input
                  v-model.number="seconds"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                  placeholder="秒"
                >
                <span class="text-xs text-muted-foreground">秒</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-foreground">计算结果</h2>

        <div v-if="isValidSpeed" class="space-y-3">
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">速度</p>
            <p class="text-3xl font-bold text-primary">
              {{ speedKmh.toFixed(2) }} <span class="text-lg">km/h</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">米/秒</p>
              <p class="text-lg font-semibold text-foreground">{{ speedMs.toFixed(2) }} m/s</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">英里/小时</p>
              <p class="text-lg font-semibold text-foreground">{{ speedMph.toFixed(2) }} mph</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">节</p>
              <p class="text-lg font-semibold text-foreground">{{ speedKnots.toFixed(2) }} kn</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">马赫 (海平面)</p>
              <p class="text-lg font-semibold text-foreground">{{ speedMach.toFixed(3) }} Ma</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请输入有效的距离和时间
        </div>
      </div>
    </div>

    <!-- 计算时间模式 -->
    <div v-if="currentMode === 'time'" class="grid md:grid-cols-2 gap-6">
      <div class="bg-card rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-foreground">输入数据</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">距离</label>
            <div class="flex gap-2">
              <input
                v-model.number="distance"
                type="number"
                step="0.01"
                min="0"
                class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
                placeholder="输入距离"
              >
              <select v-model="distanceUnit" class="px-3 py-2 border border-border rounded-lg bg-muted">
                <option value="km">公里</option>
                <option value="m">米</option>
                <option value="mile">英里</option>
                <option value="nmi">海里</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">速度</label>
            <div class="flex gap-2">
              <input
                v-model.number="speed"
                type="number"
                step="0.01"
                min="0"
                class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
                placeholder="输入速度"
              >
              <select v-model="speedUnit" class="px-3 py-2 border border-border rounded-lg bg-muted">
                <option value="kmh">km/h</option>
                <option value="ms">m/s</option>
                <option value="mph">mph</option>
                <option value="knots">节</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-foreground">所需时间</h2>

        <div v-if="isValidTime" class="space-y-3">
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">总时间</p>
            <p class="text-3xl font-bold text-primary">
              {{ formatTime(totalTimeSeconds) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">小时</p>
              <p class="text-lg font-semibold text-foreground">{{ timeHours.toFixed(1) }} h</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">分钟</p>
              <p class="text-lg font-semibold text-foreground">{{ timeMinutes.toFixed(0) }} min</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请输入有效的距离和速度
        </div>
      </div>
    </div>

    <!-- 计算距离模式 -->
    <div v-if="currentMode === 'distance'" class="grid md:grid-cols-2 gap-6">
      <div class="bg-card rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-foreground">输入数据</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">速度</label>
            <div class="flex gap-2">
              <input
                v-model.number="speed"
                type="number"
                step="0.01"
                min="0"
                class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted"
                placeholder="输入速度"
              >
              <select v-model="speedUnit" class="px-3 py-2 border border-border rounded-lg bg-muted">
                <option value="kmh">km/h</option>
                <option value="ms">m/s</option>
                <option value="mph">mph</option>
                <option value="knots">节</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1 text-foreground">时间</label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <input
                  v-model.number="hours"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                  placeholder="时"
                >
                <span class="text-xs text-muted-foreground">小时</span>
              </div>
              <div>
                <input
                  v-model.number="minutes"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                  placeholder="分"
                >
                <span class="text-xs text-muted-foreground">分钟</span>
              </div>
              <div>
                <input
                  v-model.number="seconds"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                  placeholder="秒"
                >
                <span class="text-xs text-muted-foreground">秒</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-foreground">计算结果</h2>

        <div v-if="isValidDistance" class="space-y-3">
          <div class="p-4 bg-muted rounded-lg">
            <p class="text-sm text-muted-foreground mb-1">距离</p>
            <p class="text-3xl font-bold text-primary">
              {{ distanceKm.toFixed(2) }} <span class="text-lg">km</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">米</p>
              <p class="text-lg font-semibold text-foreground">{{ distanceM.toFixed(0) }} m</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">英里</p>
              <p class="text-lg font-semibold text-foreground">{{ distanceMile.toFixed(2) }} mi</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1">海里</p>
              <p class="text-lg font-semibold text-foreground">{{ distanceNmi.toFixed(2) }} nmi</p>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-1"> marathon</p>
              <p class="text-lg font-semibold text-foreground">{{ (distanceKm / 42.195).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          请输入有效的速度和时间
        </div>
      </div>
    </div>

    <!-- 单位换算参考 -->
    <div class="mt-6 bg-card rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4 text-foreground">速度单位换算参考</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div class="p-3 bg-muted rounded-lg">
          <p class="font-medium mb-1 text-foreground">1 km/h</p>
          <p class="text-muted-foreground">= 0.2778 m/s</p>
          <p class="text-muted-foreground">= 0.6214 mph</p>
        </div>
        <div class="p-3 bg-muted rounded-lg">
          <p class="font-medium mb-1 text-foreground">1 m/s</p>
          <p class="text-muted-foreground">= 3.6 km/h</p>
          <p class="text-muted-foreground">= 2.2369 mph</p>
        </div>
        <div class="p-3 bg-muted rounded-lg">
          <p class="font-medium mb-1 text-foreground">1 mph</p>
          <p class="text-muted-foreground">= 1.6093 km/h</p>
          <p class="text-muted-foreground">= 0.4470 m/s</p>
        </div>
        <div class="p-3 bg-muted rounded-lg">
          <p class="font-medium mb-1 text-foreground">1 节</p>
          <p class="text-muted-foreground">= 1.852 km/h</p>
          <p class="text-muted-foreground">= 0.5144 m/s</p>
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
          什么是速度计算？
        </h2>
        <p class="text-muted-foreground mb-4">
          速度是描述物体运动快慢的物理量，等于物体在单位时间内通过的路程。速度的计算公式为：速度 = 距离 ÷ 时间。
          在国际单位制中，速度的基本单位是米/秒（m/s），但日常生活中更常用公里/小时（km/h）。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          速度单位换算
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>公里/小时 (km/h)</strong>: 最常用的速度单位，用于表示车辆、行人等移动速度</li>
          <li><strong>米/秒 (m/s)</strong>: 国际单位制中的基本速度单位，1 km/h = 0.2778 m/s</li>
          <li><strong>英里/小时 (mph)</strong>: 主要在美国、英国等国家使用，1 km/h = 0.6214 mph</li>
          <li><strong>节 (knots)</strong>: 航空和航海专用单位，1节 = 1.852 km/h</li>
          <li><strong>马赫 (Mach)</strong>: 用于表示高速飞行器的速度，马赫数等于速度与音速的比值</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>交通运输</strong>: 计算车辆行驶时间、规划出行路线</li>
          <li><strong>运动健身</strong>: 跑步、骑行等运动的配速计算</li>
          <li><strong>物理学习</strong>: 解决运动学问题，理解速度、时间、距离的关系</li>
          <li><strong>工程计算</strong>: 机械设计、生产流水线速度规划</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何计算平均速度？</h3>
            <p class="text-muted-foreground mt-1">
              平均速度 = 总距离 ÷ 总时间。例如，如果你用2小时跑了120公里，那么平均速度就是 120 ÷ 2 = 60 km/h。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">100 km/h 等于多少 m/s？</h3>
            <p class="text-muted-foreground mt-1">
              100 km/h = 100 × (1000米 ÷ 3600秒) = 27.78 m/s。换算公式是：1 km/h = 0.2778 m/s。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是音速？</h3>
            <p class="text-muted-foreground mt-1">
              音速（马赫1）在海平面标准大气条件下约为1225 km/h（约340 m/s）。音速会随温度、气压等条件变化。
              马赫数是物体速度与当地音速的比值，马赫2就是2倍音速。
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

<script setup lang="ts">
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '速度计算器 - 时间距离速度换算工具 | Util工具箱',
  description: '在线速度计算器，支持速度/时间/距离互转计算。提供多种单位换算（km/h、m/s、mph、节），适用于跑步、驾车、航行等速度计算场景。',
  keywords: '速度计算,时间计算,距离计算,速度换算,平均速度,单位换算,速度计算器',
  author: 'Util工具箱',
  ogTitle: '速度计算器 - 时间距离速度换算',
  ogDescription: '在线速度计算器，支持速度/时间/距离互转计算。提供多种单位换算，适用于跑步、驾车、航行等场景。',
  ogType: 'website'
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
            name: '速度计算器',
            description: '在线速度计算器，支持速度/时间/距离互转计算',
            url: 'https://www.util.cn/tools/speed-calculator',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '速度/时间/距离互转计算',
              '多种单位换算',
              '平均速度计算',
              '实时计算结果'
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '如何计算平均速度？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '平均速度 = 总距离 ÷ 总时间。例如，如果你用2小时跑了120公里，那么平均速度就是 120 ÷ 2 = 60 km/h。'
                }
              },
              {
                '@type': 'Question',
                name: '100 km/h 等于多少 m/s？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '100 km/h = 100 × (1000米 ÷ 3600秒) = 27.78 m/s。换算公式是：1 km/h = 0.2778 m/s。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const currentMode = ref<'speed' | 'time' | 'distance'>('speed')
const distance = ref<number>(100)
const distanceUnit = ref<'km' | 'm' | 'mile' | 'nmi'>('km')
const speed = ref<number>(60)
const speedUnit = ref<'kmh' | 'ms' | 'mph' | 'knots'>('kmh')
const hours = ref<number>(1)
const minutes = ref<number>(30)
const seconds = ref<number>(0)

const calculationModes = [
  { id: 'speed', name: '计算速度' },
  { id: 'time', name: '计算时间' },
  { id: 'distance', name: '计算距离' }
]

// 距离换算为公里
const distanceInKm = computed(() => {
  switch (distanceUnit.value) {
    case 'km': return distance.value
    case 'm': return distance.value / 1000
    case 'mile': return distance.value * 1.609344
    case 'nmi': return distance.value * 1.852
    default: return distance.value
  }
})

// 速度换算为 km/h
const speedInKmh = computed(() => {
  switch (speedUnit.value) {
    case 'kmh': return speed.value
    case 'ms': return speed.value * 3.6
    case 'mph': return speed.value * 1.609344
    case 'knots': return speed.value * 1.852
    default: return speed.value
  }
})

// 总时间（秒）
const totalTimeSeconds = computed(() => {
  return hours.value * 3600 + minutes.value * 60 + seconds.value
})

// 计算速度模式
const isValidSpeed = computed(() => {
  return distanceInKm.value > 0 && totalTimeSeconds.value > 0
})

const speedKmh = computed(() => {
  if (!isValidSpeed.value) return 0
  return (distanceInKm.value / totalTimeSeconds.value) * 3600
})

const speedMs = computed(() => speedKmh.value / 3.6)
const speedMph = computed(() => speedKmh.value / 1.609344)
const speedKnots = computed(() => speedKmh.value / 1.852)
const speedMach = computed(() => speedKmh.value / 1225) // 海平面音速

// 计算时间模式
const isValidTime = computed(() => {
  return distanceInKm.value > 0 && speedInKmh.value > 0
})

const timeHours = computed(() => {
  if (!isValidTime.value) return 0
  return distanceInKm.value / speedInKmh.value
})

const timeMinutes = computed(() => timeHours.value * 60)

// 计算距离模式
const isValidDistance = computed(() => {
  return speedInKmh.value > 0 && totalTimeSeconds.value > 0
})

const distanceKm = computed(() => {
  if (!isValidDistance.value) return 0
  return speedInKmh.value * (totalTimeSeconds.value / 3600)
})

const distanceM = computed(() => distanceKm.value * 1000)
const distanceMile = computed(() => distanceKm.value / 1.609344)
const distanceNmi = computed(() => distanceKm.value / 1.852)

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)

  if (h > 0) {
    return `${h}时${m}分${s}秒`
  } else if (m > 0) {
    return `${m}分${s}秒`
  } else {
    return `${s}秒`
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 图标映射
const iconMap: Record<string, any> = {
  Calculator: null, // 可以导入相应的图标
  Timer: null,
  // 添加其他需要的图标
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'unit-converter'),
    tools.find(t => t.id === 'percentage-calculator'),
    tools.find(t => t.id === 'scientific-calculator'),
    tools.find(t => t.id === 'loan-calculator')
  ].filter(Boolean)
})
</script>
