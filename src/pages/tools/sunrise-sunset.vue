<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sunrise class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">日出日落时间计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">NOAA 太阳算法，本地计算日出、日落、太阳正午与晨昏蒙影</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入任意经纬度与日期，或从内置城市快速选择，基于 NOAA 太阳位置算法计算日出、日落、太阳正午、白昼时长与民用晨昏蒙影，自动识别极昼极夜。计算完全在浏览器本地完成，时区按浏览器本地时区显示。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <MapPin class="w-5 h-5 mr-2 text-primary" /> 位置与日期
          </h2>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label class="block text-sm text-muted-foreground mb-1.5">纬度（-90 ~ 90，北纬为正）</label>
              <input
                v-model.number="lat"
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                placeholder="如 39.9042"
              />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground mb-1.5">经度（-180 ~ 180，东经为正）</label>
              <input
                v-model.number="lng"
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                placeholder="如 116.4074"
              />
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm text-muted-foreground mb-1.5 flex items-center">
              <Calendar class="w-3.5 h-3.5 mr-1" /> 日期
            </label>
            <input
              v-model="dateStr"
              type="date"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
            />
          </div>

          <p v-if="inputError" class="text-xs text-destructive flex items-center gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5" /> {{ inputError }}
          </p>
        </div>

        <!-- 内置城市 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Search class="w-4 h-4 mr-2 text-primary" /> 内置城市快速选择
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="city in cities"
              :key="city.name"
              @click="selectCity(city)"
              class="py-2 px-2 rounded-lg text-xs font-medium transition-all text-left"
              :class="activeCity === city.name
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            >
              {{ city.name }}
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-3">点击城市自动填入经纬度并计算；也可以直接修改经纬度查看任意地点。</p>
        </div>

        <!-- 说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 计算说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 采用 NOAA（美国国家海洋和大气管理局）太阳位置近似算法，太阳高度角门限取 -0.833°（含大气折射与太阳视半径）</li>
            <li>• <span class="text-foreground">时区</span>：结果按浏览器本地时区显示（当前为 {{ tzLabel }}），跨国城市请自行注意时差合理性</li>
            <li>• <span class="text-foreground">民用晨昏蒙影</span>：太阳中心位于地平线下 0° ~ 6° 的时段，天色明亮可户外活动</li>
            <li>• 高纬度地区极昼/极夜时会给出明确提示，此时部分晨昏蒙影时刻可能不存在</li>
            <li>• 计算精度约为 ±1~2 分钟，与天文台数据略有差异属正常现象</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="space-y-6">
        <!-- 极昼极夜提示 -->
        <div
          v-if="result && result.polar"
          class="bg-card border border-border rounded-lg p-5 flex items-start gap-3"
        >
          <AlertTriangle class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-foreground">
              {{ result.polar === 'day' ? '极昼：太阳全日在地平线上' : '极夜：太阳全日在地平线下' }}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
              {{ result.polar === 'day'
                ? '这一天太阳始终不落，全天都是白昼，没有日出日落时刻。'
                : '这一天太阳始终不升，全天都是黑夜，没有日出日落时刻。' }}
            </p>
          </div>
        </div>

        <!-- 时间卡片 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Clock class="w-5 h-5 mr-2 text-primary" /> 计算结果
            <span v-if="activeCity" class="text-sm font-normal text-muted-foreground ml-2">{{ activeCity }}</span>
          </h2>

          <div v-if="inputError" class="py-10 text-center">
            <MapPin class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">请输入有效的经纬度与日期</p>
          </div>

          <div v-else-if="result" class="space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <Sunrise class="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ result.sunrise }}</p>
                <p class="text-xs text-muted-foreground mt-1">日出</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <Sun class="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ result.sunset }}</p>
                <p class="text-xs text-muted-foreground mt-1">日落</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <Clock class="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ result.solarNoon }}</p>
                <p class="text-xs text-muted-foreground mt-1">太阳正午</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <Sun class="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ result.dayLength }}</p>
                <p class="text-xs text-muted-foreground mt-1">白昼时长</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <Sunrise class="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ result.civilDawn }}</p>
                <p class="text-xs text-muted-foreground mt-1">晨影开始</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <Sun class="w-5 h-5 mx-auto mb-1.5 text-primary" />
                <p class="text-2xl font-bold text-foreground font-mono tabular-nums">{{ result.civilDusk }}</p>
                <p class="text-xs text-muted-foreground mt-1">昏影结束</p>
              </div>
            </div>

            <!-- 24 小时图形化 -->
            <div class="pt-2">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-medium text-foreground">24 小时示意</p>
                <p class="text-xs text-muted-foreground">00:00 — 24:00（{{ tzLabel }}）</p>
              </div>
              <div class="relative h-9 rounded-lg overflow-hidden flex border border-border">
                <div :style="{ width: nightPct1 + '%' }" class="h-full bg-muted"></div>
                <div :style="{ width: dawnPct + '%' }" class="h-full bg-primary/30"></div>
                <div :style="{ width: dayPct + '%' }" class="h-full bg-primary"></div>
                <div :style="{ width: duskPct + '%' }" class="h-full bg-primary/30"></div>
                <div :style="{ width: nightPct2 + '%' }" class="h-full bg-muted"></div>
              </div>
              <div class="relative h-4 mt-1">
                <span
                  v-if="result.sunriseMin !== null"
                  class="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                  :style="{ left: pct(result.sunriseMin) + '%' }"
                >{{ result.sunrise }}</span>
                <span
                  v-if="result.sunsetMin !== null"
                  class="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                  :style="{ left: pct(result.sunsetMin) + '%' }"
                >{{ result.sunset }}</span>
              </div>
              <div class="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
              </div>
              <div class="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-primary inline-block"></span>白昼</span>
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-primary/30 inline-block"></span>晨昏蒙影</span>
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-muted border border-border inline-block"></span>黑夜</span>
              </div>
            </div>
          </div>

          <div v-else class="py-10 text-center">
            <Sunrise class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">选择城市或输入经纬度，这里会显示计算结果</p>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于日出日落时间计算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            日出日落时刻由三件事决定：纬度、日期和经度。纬度与日期决定太阳直射点与观测点的几何关系（夏至昼长夜短、冬至相反），经度决定太阳经过你所在子午线的钟表时刻。本工具使用 NOAA 的太阳位置近似算法：先算出当日的均时差（equation of time）与太阳赤纬，再由时角公式求出太阳到达 -0.833° 高度角（考虑大气折射与太阳视半径）的时刻。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>摄影计划：确定黄金时刻与蓝调时间，提前踩点机位</li>
            <li>户外活动：徒步、露营、海钓前评估可用白昼时间</li>
            <li>健康管理：结合光照安排晨练、补钙晒太阳的时段</li>
            <li>出行出差：了解目的地昼夜规律，倒 jet lag 更有把握</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么结果与天气预报差一两分钟？</span>大气折射随温湿度变化，且各家用的高度角门限略有差异，±2 分钟内属正常。</li>
            <li><span class="text-foreground font-medium">什么是民用晨昏蒙影？</span>太阳在地平线下 6° 以内的时段：晨影开始到日出之间天已亮，日落到昏影结束天还没黑。</li>
            <li><span class="text-foreground font-medium">时区怎么算？</span>结果按浏览器本地时区显示，中国境内城市无需调整；查询国外城市时得到的是"换算成本地钟表时间"的结果。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'sunrise-sunset'" :category="'time'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sunrise, Sun, Clock, MapPin, Calendar, Search, Info,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '日出日落时间计算器 - 每日日出日落时刻查询',
  description: '在线日出日落时间计算器，输入经纬度或选择城市，基于NOAA太阳算法计算日出、日落、太阳正午、白昼时长与民用晨昏蒙影，支持极昼极夜提示，纯本地计算',
  keywords: '日出时间, 日落时间, 日出日落查询, 太阳正午, 晨昏蒙影, 白昼时长, 昼长, 黄金时刻',
  author: 'Util工具箱',
  ogTitle: '日出日落时间计算器 - 有条工具',
  ogDescription: 'NOAA 太阳算法，本地计算日出、日落、太阳正午与晨昏蒙影',
  ogUrl: 'https://www.util.cn/tools/sunrise-sunset',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '日出日落时间计算器',
          url: 'https://www.util.cn/tools/sunrise-sunset',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['NOAA太阳算法', '内置城市快速选择', '民用晨昏蒙影计算', '极昼极夜提示', '24小时图形化展示']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '时间日期', item: 'https://www.util.cn/time/' },
            { '@type': 'ListItem', position: 3, name: '日出日落时间计算器', item: 'https://www.util.cn/tools/sunrise-sunset/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么计算结果与天气预报差一两分钟？',
              acceptedAnswer: { '@type': 'Answer', text: '大气折射随温湿度变化，各平台采用的高度角门限略有差异，误差在±2分钟内属正常现象。' }
            },
            {
              '@type': 'Question',
              name: '什么是民用晨昏蒙影？',
              acceptedAnswer: { '@type': 'Answer', text: '太阳中心位于地平线下0°到6°之间的时段，天色仍然明亮，可以进行户外活动。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'sunrise-sunset')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  if (!dateStr.value) dateStr.value = localToday()
})

// ---------- 状态 ----------
const cities = [
  { name: '北京', lat: 39.9042, lng: 116.4074 },
  { name: '上海', lat: 31.2304, lng: 121.4737 },
  { name: '广州', lat: 23.1291, lng: 113.2644 },
  { name: '深圳', lat: 22.5431, lng: 114.0579 },
  { name: '成都', lat: 30.5728, lng: 104.0668 },
  { name: '杭州', lat: 30.2741, lng: 120.1551 },
  { name: '西安', lat: 34.3416, lng: 108.9398 },
  { name: '哈尔滨', lat: 45.8038, lng: 126.535 },
  { name: '乌鲁木齐', lat: 43.8256, lng: 87.6168 },
  { name: '拉萨', lat: 29.652, lng: 91.1721 },
  { name: '纽约', lat: 40.7128, lng: -74.006 },
  { name: '伦敦', lat: 51.5074, lng: -0.1278 },
  { name: '悉尼', lat: -33.8688, lng: 151.2093 },
  { name: '新加坡', lat: 1.3521, lng: 103.8198 }
]

const lat = ref(39.9042)
const lng = ref(116.4074)
const dateStr = ref('')
const activeCity = ref('北京')
const seoContentVisible = ref(true)

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 浏览器本地时区标签
const tzOffsetHours = computed(() => {
  if (!process.client) return 8
  return -new Date().getTimezoneOffset() / 60
})
const tzLabel = computed(() => {
  const off = tzOffsetHours.value
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const selectCity = (city) => {
  activeCity.value = city.name
  lat.value = city.lat
  lng.value = city.lng
}

const inputError = computed(() => {
  const la = Number(lat.value)
  const ln = Number(lng.value)
  if (lat.value === null || lat.value === '' || isNaN(la) || la < -90 || la > 90) {
    return '请输入有效纬度（-90 到 90）'
  }
  if (lng.value === null || lng.value === '' || isNaN(ln) || ln < -180 || ln > 180) {
    return '请输入有效经度（-180 到 180）'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.value || '')) {
    return '请选择有效日期'
  }
  return ''
})

// ---------- NOAA 太阳算法 ----------
const RAD = Math.PI / 180

const dayOfYear = (year, month, day) => {
  const start = Date.UTC(year, 0, 1)
  const cur = Date.UTC(year, month - 1, day)
  return Math.floor((cur - start) / 86400000) + 1
}

// 求太阳到达高度角 h0（度，地平线下为负）的时角；不存在时返回极昼/极夜标记
const hourAngle = (latDeg, decl, h0Deg) => {
  const cosH = (Math.sin(h0Deg * RAD) - Math.sin(latDeg * RAD) * Math.sin(decl)) /
    (Math.cos(latDeg * RAD) * Math.cos(decl))
  if (cosH > 1) return { type: 'never-rises' }   // 极夜：太阳始终低于该高度角
  if (cosH < -1) return { type: 'never-sets' }   // 极昼：太阳始终高于该高度角
  return { type: 'ok', deg: Math.acos(cosH) / RAD }
}

// 分钟数 → HH:MM（按当日 0-1440 折算显示）
const fmtTime = (min) => {
  if (min === null || min === undefined || isNaN(min)) return '--:--'
  let m = ((min % 1440) + 1440) % 1440
  let h = Math.floor(m / 60)
  let mm = Math.round(m % 60)
  if (mm === 60) { mm = 0; h = (h + 1) % 24 }
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const fmtDuration = (minutes) => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '--'
  const total = Math.round(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}小时${m}分`
}

const computeSolar = (dateText, latDeg, lngDeg, tzHours) => {
  const [y, mo, d] = dateText.split('-').map(Number)
  const doy = dayOfYear(y, mo, d)

  // NOAA 近似：均时差（分钟）与太阳赤纬（弧度）
  const gamma = (2 * Math.PI / 365) * (doy - 1)
  const eqtime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)
  )
  const decl = 0.006918 -
    0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)

  // 太阳正午（本地钟表分钟）：720 - 4*经度 - 均时差 + 时区偏移*60
  const solarNoonMin = 720 - 4 * lngDeg - eqtime + tzHours * 60

  const sunHa = hourAngle(latDeg, decl, -0.833)  // 日出日落：高度角 -0.833°
  const twiHa = hourAngle(latDeg, decl, -6)      // 民用晨昏蒙影：高度角 -6°

  const polar = sunHa.type === 'never-sets' ? 'day' : (sunHa.type === 'never-rises' ? 'night' : null)

  const sunriseMin = sunHa.type === 'ok' ? solarNoonMin - 4 * sunHa.deg : null
  const sunsetMin = sunHa.type === 'ok' ? solarNoonMin + 4 * sunHa.deg : null
  const dawnMin = twiHa.type === 'ok' ? solarNoonMin - 4 * twiHa.deg : null
  const duskMin = twiHa.type === 'ok' ? solarNoonMin + 4 * twiHa.deg : null

  return {
    polar,
    solarNoonMin,
    sunriseMin,
    sunsetMin,
    dawnMin,
    duskMin,
    solarNoon: fmtTime(solarNoonMin),
    sunrise: fmtTime(sunriseMin),
    sunset: fmtTime(sunsetMin),
    civilDawn: dawnMin === null ? '--' : fmtTime(dawnMin),
    civilDusk: duskMin === null ? '--' : fmtTime(duskMin),
    dayLength: sunHa.type === 'ok' ? fmtDuration(8 * sunHa.deg) : (polar === 'day' ? '24小时' : '0小时')
  }
}

const result = computed(() => {
  if (inputError.value) return null
  try {
    return computeSolar(dateStr.value, Number(lat.value), Number(lng.value), tzOffsetHours.value)
  } catch (e) {
    return null
  }
})

// ---------- 图形化条段 ----------
const pct = (min) => {
  const p = (min / 1440) * 100
  return Math.max(0, Math.min(100, p))
}

const segWidths = computed(() => {
  const r = result.value
  if (!r) return null
  const dawn = r.dawnMin !== null ? r.dawnMin : (r.sunriseMin !== null ? r.sunriseMin : 0)
  const dusk = r.duskMin !== null ? r.duskMin : (r.sunsetMin !== null ? r.sunsetMin : 1440)
  const sunrise = r.sunriseMin !== null ? r.sunriseMin : (r.polar === 'day' ? 0 : 1440)
  const sunset = r.sunsetMin !== null ? r.sunsetMin : (r.polar === 'day' ? 1440 : 0)
  const clampMin = (v) => Math.max(0, Math.min(1440, v))
  const n1 = clampMin(dawn)
  const dawnW = Math.max(0, clampMin(sunrise) - n1)
  const dayW = Math.max(0, clampMin(sunset) - clampMin(sunrise))
  const duskW = Math.max(0, clampMin(dusk) - clampMin(sunset))
  const n2 = Math.max(0, 1440 - n1 - dawnW - dayW - duskW)
  return { n1, dawnW, dayW, duskW, n2 }
})

const nightPct1 = computed(() => segWidths.value ? pct(segWidths.value.n1) : 100)
const dawnPct = computed(() => segWidths.value ? pct(segWidths.value.dawnW) : 0)
const dayPct = computed(() => segWidths.value ? pct(segWidths.value.dayW) : 0)
const duskPct = computed(() => segWidths.value ? pct(segWidths.value.duskW) : 0)
const nightPct2 = computed(() => segWidths.value ? pct(segWidths.value.n2) : 0)
</script>
