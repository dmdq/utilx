<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplets class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">徒步饮水估算 - 按距离/爬升/气温/负重算带多少水</h1>
          <p class="text-sm text-muted-foreground mt-1">以 0.5L/h 为基口的户外补水量估算，气温与爬升联动修正，输出个人区间与 500ml 瓶数、补水节奏与水源规划建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线徒步饮水量计算器：输入徒步距离（km）、累计爬升（m）、气温（℃）、体重与强度档位（慢走 / 快走 / 负重），
        按通行户外口径估算需水量——<span class="font-medium text-foreground">基础 0.5L/h</span>（按体重 65kg 与档位速度折算时长），
        气温 &gt;25℃ 每满 5℃ 基础 +20%（上限 ×2.0），<span class="font-medium text-foreground">累计爬升每 300m +0.25L</span>，负重档再上浮 10%。
        输出为个人区间（×0.9 ~ ×1.25）而非单值：每日 / 全程升数、按 500ml 瓶数、每 15-20 分钟补 100-150ml 的节奏注记，
        全程超过 4L 提示带滤水器就近补水而非全部背上山。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="flex items-start gap-2 text-xs leading-relaxed bg-primary/10 border border-primary/20 text-foreground rounded-lg p-3 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>估算按成人一日单段徒步口径；出汗率因人而异（本页区间 ×0.9 ~ ×1.25），高温、日晒、大风与高海拔会显著加大消耗。喝不下别硬灌，也不可断水。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左栏：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Mountain class="w-5 h-5 mr-2 text-primary" /> 徒步参数
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">徒步距离 (km)</label>
              <input
                v-model.number="distanceKm"
                type="number"
                min="0.5"
                step="0.5"
                class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="如 15"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">累计爬升 (m)</label>
              <input
                v-model.number="elevM"
                type="number"
                min="0"
                step="50"
                class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="如 600"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">气温 (℃)</label>
              <input
                v-model.number="tempC"
                type="number"
                min="-10"
                max="45"
                step="1"
                class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="如 28"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-foreground mb-1">体重 (kg)</label>
              <input
                v-model.number="weightKg"
                type="number"
                min="30"
                max="150"
                step="1"
                class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="默认 65"
              />
            </div>
          </div>

          <!-- 强度档位 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">强度档位</label>
            <div class="flex rounded-lg border border-border overflow-hidden">
              <button
                v-for="it in INTENSITIES"
                :key="it.id"
                @click="intensityId = it.id"
                class="flex-1 px-2 py-2 text-xs font-medium transition"
                :class="intensityId === it.id ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted'"
              >{{ it.label }}</button>
            </div>
            <p class="text-[11px] text-muted-foreground mt-1">{{ currentIntensityHint }}</p>
          </div>

          <!-- 活动天数 -->
          <div>
            <label class="block text-xs font-medium text-foreground mb-1">徒步天数（单日填 1）</label>
            <input
              v-model.number="days"
              type="number"
              min="1"
              max="30"
              step="1"
              class="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              placeholder="1"
            />
          </div>

          <button
            @click="resetInputs"
            class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认输入
          </button>
        </div>

        <!-- 口径说明卡 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-2">
          <h3 class="text-sm font-semibold flex items-center">
            <Info class="w-4 h-4 mr-1.5 text-primary" /> 估算口径（通行户外补水量）
          </h3>
          <ul class="text-xs leading-relaxed text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>时长 = 距离 ÷ 档位速度（慢走 3.0 / 快走 4.0 / 负重 3.5 km/h）</li>
            <li>基础需水 = 0.5L/h × 时长 ×（体重 ÷ 65）× 档位系数（负重 +10%）</li>
            <li>气温 &gt;25℃：每满 5℃ 基础 +20%（上限 ×2.0）；≤25℃ 不衰减</li>
            <li>累计爬升：每 300m +0.25L</li>
            <li>个人区间 = 计算值 ×0.9 ~ ×1.25（出汗率、日晒、风况差异）</li>
          </ul>
        </div>
      </div>

      <!-- 右栏：结果（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <template v-if="waterResult">
          <!-- 需水总览 -->
          <div class="bg-card border border-border rounded-lg p-6">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 class="text-lg font-semibold flex items-center">
                <Droplets class="w-5 h-5 mr-2 text-primary" /> 需水量估算
              </h2>
              <span class="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {{ distanceKm }}km · 爬升 {{ elevM }}m · {{ tempC }}℃ · {{ currentIntensityLabel }}
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">每日需水（区间）</p>
                <p class="text-3xl font-bold text-primary">{{ waterResult.min }} - {{ waterResult.max }} <span class="text-sm font-medium">L</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">计算中值 {{ waterResult.total }}L ×（0.9 ~ 1.25）</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">全程需水（{{ days }} 天）</p>
                <p class="text-2xl font-bold text-foreground">{{ tripMin }} - {{ tripMax }} <span class="text-sm font-medium">L</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">每日区间 × {{ days }} 天</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">按 500ml 瓶数</p>
                <p class="text-2xl font-bold text-foreground">{{ bottlesMin }} - {{ bottlesMax }} <span class="text-sm font-medium">瓶</span></p>
                <p class="text-[11px] text-muted-foreground mt-1">全程区间 ÷ 0.5L 向上取整</p>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[11px] text-muted-foreground">预计时长</p>
                <p class="text-sm font-semibold text-foreground mt-0.5">{{ waterResult.hours }} h</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[11px] text-muted-foreground">基础需水</p>
                <p class="text-sm font-semibold text-foreground mt-0.5">{{ waterResult.base }} L</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[11px] text-muted-foreground">气温系数</p>
                <p class="text-sm font-semibold text-foreground mt-0.5">×{{ tempFactorText }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3 text-center">
                <p class="text-[11px] text-muted-foreground">爬升加成</p>
                <p class="text-sm font-semibold text-foreground mt-0.5">+{{ waterResult.climbL }} L</p>
              </div>
            </div>
          </div>

          <!-- 水源规划 -->
          <div :class="['border rounded-lg p-5 space-y-2', shouldFilter ? 'bg-blue-500/10 border-blue-500/40' : 'bg-card border-border']">
            <h3 class="text-sm font-semibold flex items-center text-foreground">
              <Filter class="w-4 h-4 mr-1.5 text-primary" /> 水源规划
              <span v-if="shouldFilter" class="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-medium">建议带滤水器</span>
            </h3>
            <p class="text-xs leading-relaxed text-muted-foreground">
              <template v-if="shouldFilter">
                全程需水约 {{ tripMin }}-{{ tripMax }}L，超过 4L——全背上去既重又不现实（仅水就 {{ tripMax }}kg 起）。
                优先查路线补给点（山泉、溪流、补给站 / 岔路村落），<span class="font-medium text-foreground">带滤水器或净水片 + 1-2L 水袋循环补水</span>，
                背着"到下一个水源为止"的量即可；不确定水源可靠性时至少留 1L 应急余量。
              </template>
              <template v-else>
                全程需水约 {{ tripMin }}-{{ tripMax }}L，在 4L 以内，直接背够即可。
                出发前确认路线有无补给点；高温天建议再加 0.5L 应急余量，宁可多背半升。
              </template>
            </p>
          </div>

          <!-- 补水节奏 -->
          <div class="bg-card border border-border rounded-lg p-5 space-y-2">
            <h3 class="text-sm font-semibold flex items-center">
              <Timer class="w-4 h-4 mr-1.5 text-primary" /> 补水节奏：别等口渴才喝
            </h3>
            <p class="text-xs leading-relaxed text-muted-foreground">
              行进中每 <span class="font-medium text-foreground">15-20 分钟补 100-150ml</span>（约 0.4-0.6L/h，与 0.5L/h 基口一致），
              少量多次比一次猛灌更解渴也不涨胃；休息点可加量。晨起与出发前先喝 200-300ml，
              收营 / 下撤前留出最后一口应急水——<span class="font-medium text-foreground">水喝完之前就该到下一个水源</span>。
            </p>
          </div>
        </template>

        <div v-else class="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          请输入徒步距离开始估算
        </div>

        <!-- 电解质提示 -->
        <div class="bg-card border border-border rounded-lg p-5 space-y-2">
          <h3 class="text-sm font-semibold flex items-center">
            <Zap class="w-4 h-4 mr-1.5 text-primary" /> 电解质什么时候补？
          </h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            持续行走超过 <span class="font-medium text-foreground">2 小时</span>、大汗淋漓（衣服盐渍明显）或高温天连续爬升时，
            光补水会稀释血钠：按 500-1000ml 配一颗电解质泡腾片 / 一小撮盐 + 少量糖，或用运动饮料兑水。
            只喝大量白水而不补电解质，有低钠血症（"水中毒"）风险——两头都要防。
          </p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>徒步到底要带多少水？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          户外圈最通行的起步口径是<span class="font-medium text-foreground">中等强度 0.5L/h</span>：一次 4 小时的徒步约 2L 起。
          本页在此基础上做四类修正：按档位速度把距离折算成时长（慢走 3.0 / 快走 4.0 / 负重 3.5 km/h）；
          气温超过 25℃ 每满 5℃ 基础量 +20%（28℃ 按 +20% 一档算，35℃ 就是 +40%）；累计爬升每 300m 加 0.25L
          （爬坡时呼吸加深、做功增大，出汗远多于平路）；负重档整体上浮 10%。因为出汗率个体差异极大，
          输出给出 ×0.9 ~ ×1.25 的区间而不是假精确的单值——短途取下沿，高温大风晒一天取上沿。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">脱水和低钠（水中毒），两头风险都要防</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          脱水的信号：口干、尿少尿深、头晕乏力、心跳加快——出现任一就应立刻到阴凉处补水。
          而另一头是<span class="font-medium text-foreground">低钠血症（俗称水中毒）</span>：短时间内灌入大量白水而不补电解质，
          血钠被稀释，轻则恶心头胀，重则抽搐昏迷，马拉松与徒步赛事都有过惨案。
          判断方法很简单：持续出汗超过 2 小时就要"水 + 电解质"一起补；喝水后仍然头胀恶心、尿量很大且清亮，说明补过头了。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">骆驼原则：出发前就喝够</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          像骆驼一样"提前储水"：出发前一晚与晨起各喝 300-500ml，出发前再补 200-300ml，
          让身体带着充足的水合状态上路，而不是背着水却从脱水状态开始走。
          行进中每 15-20 分钟抿 100-150ml，到每个水源点都"喝够 + 装满"再离开（camel up），不把补水压力全留给下一程。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">冬天也要喝水</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          低温环境下口渴感会被显著抑制，加上穿衣厚、出汗照样发生（内层湿透就是证据），
          很多冬季徒步脱水案例是"不觉得渴"而不是"不需要水"。本页口径对 ≤25℃ 不做衰减，
          冬天请按同样的节奏定时喝水；保温壶或给水袋加保温套，避免水结冰喝不上。
          高海拔地区呼吸带走的水分更多，还要在口径上再放宽一档。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div v-for="(faq, index) in faqs" :key="index">
            <h3 class="text-base font-semibold text-foreground">{{ faq.q }}</h3>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :current-tool-id="'hiking-water'" :category="'others'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Droplets, Info, ChevronUp, ChevronDown,
  Mountain, Filter, Timer, Zap, RefreshCw
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'hiking-water'
const STORAGE_KEY = 'hiking-water-inputs'

// ---------- SEO ----------
useSeoMeta({
  title: '徒步饮水估算 - 徒步带多少水计算器 | 有条工具',
  description: '免费在线徒步饮水量计算：距离/爬升/气温/负重→基础0.5L/h口径估算每日与全程需水区间、500ml瓶数、补水节奏，超4L建议滤水器水源规划，纯本地计算。',
  keywords: '徒步饮水,爬山带多少水,户外补水量,徒步水袋,饮水量计算,电解质补充,脱水,水中毒',
  author: '有条工具',
  ogTitle: '徒步饮水估算 - 徒步带多少水计算器 | 有条工具',
  ogDescription: '距离/爬升/气温/负重→需水区间与瓶数、补水节奏与水源规划，0.5L/h 通行口径。',
  ogUrl: 'https://www.util.cn/tools/hiking-water',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// ---------- 纯逻辑（可独立单测） ----------
// __PURE_FNS_START__
function round1(n: number): number { return Math.round(n * 10) / 10 }
function round2(n: number): number { return Math.round(n * 100) / 100 }

// 强度档位：speedKmh 用于把距离折算成时长；factor 为基础需水档位系数（负重 = 快走 × 1.1 上浮 10%）
const INTENSITIES = [
  { id: 'slow', label: '慢走', speedKmh: 3.0, factor: 0.9, hint: '休闲漫步，约 3.0km/h，需水系数 ×0.9' },
  { id: 'fast', label: '快走', speedKmh: 4.0, factor: 1.0, hint: '常规徒步节奏，约 4.0km/h，基准系数 ×1.0' },
  { id: 'loaded', label: '负重', speedKmh: 3.5, factor: 1.1, hint: '重装 / 背大包，约 3.5km/h，需水上浮 10%（×1.1）' }
]

// 气温系数：>25℃ 每满 5℃ 基础 +20%（不足 5℃ 按 1 档起算），上限 ×2.0；≤25℃ 不衰减（冬天也要喝水）
function tempFactor(tempC: number): number {
  const t = Number(tempC)
  if (!Number.isFinite(t) || t <= 25) return 1
  return Math.min(2, round2(1 + 0.2 * Math.ceil((t - 25) / 5)))
}

// 爬升加成：每 300m +0.25L
function climbAddL(elevM: number): number {
  const e = Number(elevM)
  if (!Number.isFinite(e) || e <= 0) return 0
  return round2((e / 300) * 0.25)
}

// 时长（h）= 距离 ÷ 档位速度；非法输入返回 null
function hikeHours(distanceKm: number, intensityId: string) {
  const d = Number(distanceKm)
  const it = INTENSITIES.find(i => i.id === intensityId)
  if (!(d > 0) || !Number.isFinite(d) || !it) return null
  return round2(d / it.speedKmh)
}

// 每日需水：基础 0.5L/h × 时长 ×（体重/65）× 档位系数 × 气温系数 + 爬升加成；区间 ×0.9 ~ ×1.25
function dailyWaterL(distanceKm: number, elevM: number, tempC: number, weightKg: number, intensityId: string) {
  const hours = hikeHours(distanceKm, intensityId)
  const it = INTENSITIES.find(i => i.id === intensityId)
  const w = Number(weightKg)
  if (hours === null || !it || !(w > 0) || !Number.isFinite(w)) return null
  const base = round2(0.5 * hours * (w / 65) * it.factor)
  const withTemp = round2(base * tempFactor(tempC))
  const climbL = climbAddL(elevM)
  const total = round2(withTemp + climbL)
  return {
    hours,
    base,
    tempF: tempFactor(tempC),
    climbL,
    total,
    min: round1(total * 0.9),
    max: round1(total * 1.25)
  }
}

// 全程需水（多日按天累加）
function tripWater(dayWater: ReturnType<typeof dailyWaterL>, days: number) {
  if (!dayWater) return null
  const n = Math.max(1, Math.floor(Number(days) || 1))
  return {
    days: n,
    min: round1(dayWater.min * n),
    max: round1(dayWater.max * n)
  }
}

// 500ml 瓶数（向上取整）
function bottlesFromRange(minL: number, maxL: number) {
  const lo = Number(minL), hi = Number(maxL)
  if (!(lo > 0) || !(hi >= lo)) return null
  return { min: Math.ceil(lo / 0.5), max: Math.ceil(hi / 0.5) }
}

// 水源规划：全程上沿 > 4L 建议带滤水器就近补水
function needFilter(trip: ReturnType<typeof tripWater>) {
  return !!trip && trip !== null && trip.max > 4
}
// __PURE_FNS_END__

// ---------- 响应式状态 ----------
const distanceKm = ref<number>(15)
const elevM = ref<number>(600)
const tempC = ref<number>(28)
const weightKg = ref<number>(65)
const intensityId = ref<string>('fast')
const days = ref<number>(1)
const seoContentVisible = ref(true)

const faqs = [
  {
    q: '徒步时怎么判断自己脱水了？',
    a: '早期信号：口干、排尿减少且颜色深黄、头晕乏力、心跳加快。行进中观察尿液是最直接的办法——深黄色就是该补水了。等出现明显口渴时身体通常已缺水 1-2%，所以口渴是滞后指标：按每 15-20 分钟 100-150ml 的节奏主动喝，而不是等渴了猛灌。'
  },
  {
    q: '只喝白水会"水中毒"吗？电解质什么时候补？',
    a: '长时间大量出汗后只灌白水确实有低钠血症（水中毒）风险。经验口径：持续行走超过 2 小时、衣服上出现盐渍或高温天连续爬升时，把电解质和水分一起补——500-1000ml 水配一颗电解质片，或少量盐加糖自制简易电解质水。短途（2 小时内）正常饮食加白水即可。'
  },
  {
    q: '冬天冷不怎么出汗，也要带这么多水吗？',
    a: '要。低温会明显抑制口渴感，但呼吸蒸发、穿衣内的持续出汗仍在失水，高原环境下呼吸道蒸发还会加倍。建议冬季按同样节奏定时喝水（每 15-20 分钟抿一口），用保温壶或水袋保温套防冻，别让"不渴"骗了你。'
  },
  {
    q: '什么是"骆驼原则"？',
    a: '像骆驼穿越沙漠前先喝饱一样：出发前一晚与晨起各喝 300-500ml、出发前再补 200-300ml，让身体在最佳水合状态下起步；行进中少量多次，到每个水源点"喝够 + 装满"再走。这样即使后程水源不确定，身体储备也能兜底。'
  },
  {
    q: '估算的区间为什么这么宽？该按哪头准备？',
    a: '出汗率因人而异，同一条线同样的天气，两个人需水量可以差 30% 以上，所以本页给计算值 ×0.9 ~ ×1.25 的区间。常规温和天气按中值偏下准备；高温、暴晒、大风或高海拔取上沿；水源不确定时再加 0.5-1L 应急余量——宁可多背半升，不可断水。'
  }
]

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '徒步饮水估算',
          url: 'https://www.util.cn/tools/hiking-water',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按距离/爬升/气温/负重估算需水区间', '0.5L/h 通行户外口径', '每日与全程升数、500ml 瓶数', '补水节奏（每15-20分钟100-150ml）', '超4L水源规划与滤水器建议', '电解质与水中毒风险提示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '徒步饮水估算', item: 'https://www.util.cn/tools/hiking-water' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a }
          }))
        }
      ]
    })
  }]
})

// ---------- 派生结果 ----------
const currentIntensity = computed(() => INTENSITIES.find(i => i.id === intensityId.value) || INTENSITIES[1])
const currentIntensityLabel = computed(() => currentIntensity.value.label)
const currentIntensityHint = computed(() => currentIntensity.value.hint)
const tempFactorText = computed(() => {
  const f = waterResult.value ? waterResult.value.tempF : tempFactor(Number(tempC.value))
  return String(f)
})

const waterResult = computed(() => dailyWaterL(distanceKm.value, elevM.value, tempC.value, weightKg.value, intensityId.value))
const trip = computed(() => tripWater(waterResult.value, days.value))
const tripMin = computed(() => (trip.value ? String(trip.value.min) : '—'))
const tripMax = computed(() => (trip.value ? String(trip.value.max) : '—'))
const bottles = computed(() => (trip.value ? bottlesFromRange(trip.value.min, trip.value.max) : null))
const bottlesMin = computed(() => (bottles.value ? String(bottles.value.min) : '—'))
const bottlesMax = computed(() => (bottles.value ? String(bottles.value.max) : '—'))
const shouldFilter = computed(() => needFilter(trip.value))

// ---------- 操作（纯本地状态，SSR 安全） ----------
const DEFAULT_INPUTS = { distanceKm: 15, elevM: 600, tempC: 28, weightKg: 65, intensityId: 'fast', days: 1 }

function resetInputs() {
  distanceKm.value = DEFAULT_INPUTS.distanceKm
  elevM.value = DEFAULT_INPUTS.elevM
  tempC.value = DEFAULT_INPUTS.tempC
  weightKg.value = DEFAULT_INPUTS.weightKg
  intensityId.value = DEFAULT_INPUTS.intensityId
  days.value = DEFAULT_INPUTS.days
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 持久化：仅客户端交互回调中写 localStorage（键前缀 = 工具 id）
watch([distanceKm, elevM, tempC, weightKg, intensityId, days], () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        distanceKm: distanceKm.value,
        elevM: elevM.value,
        tempC: tempC.value,
        weightKg: weightKg.value,
        intensityId: intensityId.value,
        days: days.value
      }))
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})

onMounted(() => {
  addRecentTool(TOOL_ID)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.distanceKm === 'number' && s.distanceKm > 0) distanceKm.value = s.distanceKm
      if (typeof s.elevM === 'number' && s.elevM >= 0) elevM.value = s.elevM
      if (typeof s.tempC === 'number' && Number.isFinite(s.tempC)) tempC.value = s.tempC
      if (typeof s.weightKg === 'number' && s.weightKg > 0) weightKg.value = s.weightKg
      if (typeof s.intensityId === 'string' && INTENSITIES.some(i => i.id === s.intensityId)) intensityId.value = s.intensityId
      if (typeof s.days === 'number' && s.days >= 1) days.value = Math.floor(s.days)
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})
</script>
