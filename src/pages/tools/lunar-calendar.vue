<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">农历日历转换工具 - 公历与农历互转</h1>
      <p class="text-muted-foreground">公历与农历互转，显示天干地支、生肖、节气等中国传统历法信息。支持双向转换，提供传统节日查询和农历知识介绍。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 公历转农历 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
            <Calendar class="w-5 h-5 text-primary" />
            公历转农历
          </h2>
        </div>

        <!-- 日期选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">选择公历日期</label>
          <input
            v-model="solarDate"
            type="date"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
            @change="solarToLunar"
          >
        </div>

        <!-- 快捷操作 -->
        <div class="mb-4">
          <div class="flex flex-wrap gap-2">
            <button @click="setToday" class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">今天</button>
            <button @click="setSolarDate(-1)" class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground">昨天</button>
            <button @click="setSolarDate(1)" class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded text-muted-foreground">明天</button>
            <button @click="setLunarNewYear" class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">春节</button>
          </div>
        </div>

        <!-- 农历结果 -->
        <div v-if="lunarResult" class="space-y-3">
          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div class="text-sm text-red-700 dark:text-red-300 mb-1">农历日期</div>
            <div class="text-2xl font-bold text-red-800 dark:text-red-200">
              {{ lunarResult.lunarYear }}年 {{ lunarResult.isLeap ? '闰' : '' }}{{ lunarResult.lunarMonth }}月 {{ lunarResult.lunarDay }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">天干地支:</span>
              <span class="font-medium ml-2">{{ lunarResult.gzYear }}</span>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">生肖:</span>
              <span class="font-medium ml-2">{{ lunarResult.zodiac }}🐾</span>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">星座:</span>
              <span class="font-medium ml-2">{{ lunarResult.constellation }}</span>
            </div>
            <div class="p-3 bg-muted rounded-lg">
              <span class="text-muted-foreground">星期:</span>
              <span class="font-medium ml-2">{{ lunarResult.weekday }}</span>
            </div>
          </div>

          <div v-if="lunarResult.solarTerm" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span class="text-sm text-green-700 dark:text-green-300">节气: </span>
            <span class="font-medium">{{ lunarResult.solarTerm }}</span>
          </div>

          <div v-if="lunarResult.festival" class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <span class="text-sm text-orange-700 dark:text-orange-300">节日: </span>
            <span class="font-medium">{{ lunarResult.festival }}</span>
          </div>
        </div>
      </div>

      <!-- 农历转公历 -->
      <div class="flex flex-col h-full p-6 bg-card border border-border rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
            <Moon class="w-5 h-5 text-primary" />
            农历转公历
          </h2>
        </div>

        <!-- 年份选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">农历年份</label>
          <select v-model="lunarInput.year" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            <option v-for="y in lunarYears" :key="y" :value="y">{{ y }}年 ({{ getZodiac(y) }})</option>
          </select>
        </div>

        <!-- 月份选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">农历月份</label>
          <div class="flex gap-2">
            <select v-model="lunarInput.isLeap" class="px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
              <option :value="false">平月</option>
              <option :value="true">闰月</option>
            </select>
            <select v-model="lunarInput.month" class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
              <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
            </select>
          </div>
        </div>

        <!-- 日期选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">农历日期</label>
          <select v-model="lunarInput.day" class="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary">
            <option v-for="d in 30" :key="d" :value="d">{{ getLunarDayName(d) }}</option>
          </select>
        </div>

        <!-- 转换按钮 -->
        <button @click="lunarToSolar" class="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90">
          转换为公历
        </button>

        <!-- 公历结果 -->
        <div v-if="solarResult" class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div class="text-sm text-yellow-700 dark:text-yellow-300 mb-1">对应公历</div>
          <div class="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
            {{ solarResult }}
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          农历知识
        </h2>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm mb-8">
          <div>
            <h3 class="font-medium text-foreground mb-3">天干地支</h3>
            <div class="space-y-2">
              <div class="flex flex-wrap gap-1">
                <span v-for="(gan, i) in heavenlyStems" :key="i" class="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">{{ gan }}</span>
              </div>
              <div class="text-xs text-muted-foreground">十天干: 甲乙丙丁戊己庚辛壬癸</div>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-foreground mb-3">十二生肖</h3>
            <div class="grid grid-cols-4 gap-2 text-xs">
              <span v-for="(zodiac, i) in zodiacs" :key="i" class="p-2 bg-muted rounded">{{ zodiac }}年</span>
            </div>
          </div>

          <div>
            <h3 class="font-medium text-foreground mb-3">传统节日</h3>
            <div class="space-y-1 text-muted-foreground text-xs">
              <div>春节: 正月初一</div>
              <div>元宵节: 正月十五</div>
              <div>清明节: 公历4月4-6日</div>
              <div>端午节: 五月初五</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink v-for="relatedTool in relatedTools" :key="relatedTool.id" :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
          <div class="flex items-center gap-2 mb-2">
            <component :is="iconMap[relatedTool.icon]" class="w-5 h-5 text-primary" />
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
import { Calendar, Moon, Calculator, Sun, Gift, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

useSeoMeta({
  title: '农历日历转换工具 - 公历与农历互转 | Util工具箱',
  description: '在线农历日历转换工具，支持公历与农历互转，显示天干地支、生肖、节气等中国传统历法信息。',
  keywords: '农历转换,公历农历,天干地支,生肖查询,二十四节气,传统节日,在线农历'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: '农历日历转换工具',
      description: '在线农历转换工具，支持公历与农历互转',
      url: 'https://www.util.cn/tools/lunar-calendar'
    })
  }]
})

const iconMap = { Calendar, Moon, Calculator, Sun, Gift }

const relatedTools = computed(() => [
  tools.find(t => t.id === 'date-calculator'),
  tools.find(t => t.id === 'quarter-calculator'),
  tools.find(t => t.id === 'solar-term-calculator'),
  tools.find(t => t.id === 'holiday-calculator')
].filter(Boolean))

const isSeoContentVisible = ref(true)

const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const lunarDayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
const constellations = ['水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座',
  '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座']
const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const solarTerms = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至']
const lunarFestivals = {
  '1-1': '春节', '1-15': '元宵节', '2-2': '龙抬头', '5-5': '端午节',
  '7-7': '七夕节', '7-15': '中元节', '8-15': '中秋节', '9-9': '重阳节'
}

const solarDate = ref(new Date().toISOString().split('T')[0])
const lunarInput = ref({ year: new Date().getFullYear(), month: 1, day: 1, isLeap: false })
const lunarResult = ref(null)
const solarResult = ref('')

const lunarYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 200 }, (_, i) => currentYear - 100 + i)
})

function getZodiac(year) {
  const index = (year - 4) % 12
  return zodiacs[index >= 0 ? index : index + 12]
}

function getGzYear(year) {
  const stemIndex = (year - 4) % 10
  const branchIndex = (year - 4) % 12
  const stem = heavenlyStems[stemIndex >= 0 ? stemIndex : stemIndex + 10]
  const branch = earthlyBranches[branchIndex >= 0 ? branchIndex : branchIndex + 12]
  return stem + branch + '年'
}

function getConstellation(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dates = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 22, 22]
  const index = month - 1
  return constellations[(day < dates[index] ? index - 1 : index) >= 0 ? (day < dates[index] ? index - 1 : index) % 12 : 11]
}

function solarToLunarSimple(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const baseDate = new Date(2024, 0, 1)
  const baseLunar = { year: 2023, month: 11, day: 20 }

  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
  const lunarMonthDays = 29.53
  const totalMonths = Math.floor(diffDays / lunarMonthDays)
  const remainingDays = Math.floor(diffDays % lunarMonthDays)

  let lunarYear = baseLunar.year + Math.floor((baseLunar.month + totalMonths) / 12)
  let lunarMonth = ((baseLunar.month + totalMonths) % 12 + 12) % 12 || 12
  let lunarDay = baseLunar.day + remainingDays

  while (lunarDay > 30) {
    lunarDay -= 30
    lunarMonth++
    if (lunarMonth > 12) {
      lunarMonth = 1
      lunarYear++
    }
  }

  return { lunarYear, lunarMonth, lunarDay: lunarDay > 0 ? lunarDay : 1, isLeap: false }
}

function solarToLunar() {
  const date = new Date(solarDate.value)
  const lunar = solarToLunarSimple(date)

  lunarResult.value = {
    ...lunar,
    gzYear: getGzYear(lunar.lunarYear),
    zodiac: getZodiac(lunar.lunarYear),
    constellation: getConstellation(date),
    weekday: weekdays[date.getDay()],
    festival: lunarFestivals[`${lunar.lunarMonth}-${lunar.lunarDay}`] || '',
    solarTerm: getApproxSolarTerm(date)
  }
}

function getApproxSolarTerm(date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const termIndex = Math.floor((month - 1) * 2)
  if (day >= 4 && day <= 8) {
    return solarTerms[termIndex % 24]
  } else if (day >= 18 && day <= 23) {
    return solarTerms[(termIndex + 1) % 24]
  }
  return ''
}

function lunarToSolar() {
  const { year, month, day, isLeap } = lunarInput.value
  const baseLunar = { year: 2023, month: 11, day: 20 }
  const baseDate = new Date(2024, 0, 1)

  const yearDiff = year - baseLunar.year
  const monthDiff = month - baseLunar.year + yearDiff * 12
  const dayDiff = day - baseLunar.day
  const totalDays = monthDiff * 30 + dayDiff

  const resultDate = new Date(baseDate.getTime() + totalDays * 24 * 60 * 60 * 1000)
  solarResult.value = `${resultDate.getFullYear()}年${resultDate.getMonth() + 1}月${resultDate.getDate()}日`
}

function getLunarDayName(day) {
  return lunarDayNames[day - 1] || `${day}日`
}

function setToday() {
  solarDate.value = new Date().toISOString().split('T')[0]
  solarToLunar()
}

function setSolarDate(offset) {
  const date = new Date(solarDate.value)
  date.setDate(date.getDate() + offset)
  solarDate.value = date.toISOString().split('T')[0]
  solarToLunar()
}

function setLunarNewYear() {
  const currentYear = new Date().getFullYear()
  solarDate.value = `${currentYear}-02-10`
  solarToLunar()
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

solarToLunar()
</script>
