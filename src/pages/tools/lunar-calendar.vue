<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">农历日历转换工具</h1>
      <p class="text-gray-600 dark:text-gray-400">公历与农历互转，显示天干地支、生肖、节气等中国传统历法信息</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 公历转农历 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-blue-500" />
          公历转农历
        </h2>

        <!-- 日期选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">选择公历日期</label>
          <input
            v-model="solarDate"
            type="date"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="solarToLunar"
          >
        </div>

        <!-- 快捷操作 -->
        <div class="mb-4">
          <div class="flex flex-wrap gap-2">
            <button
              @click="setToday"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              今天
            </button>
            <button
              @click="setSolarDate(-1)"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              昨天
            </button>
            <button
              @click="setSolarDate(1)"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              明天
            </button>
            <button
              @click="setLunarNewYear"
              class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              春节
            </button>
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
            <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">天干地支:</span>
              <span class="font-medium ml-2">{{ lunarResult.gzYear }}</span>
            </div>
            <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">生肖:</span>
              <span class="font-medium ml-2">{{ lunarResult.zodiac }}🐾</span>
            </div>
            <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">星座:</span>
              <span class="font-medium ml-2">{{ lunarResult.constellation }}</span>
            </div>
            <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span class="text-gray-600 dark:text-gray-400">星期:</span>
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
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Moon class="w-5 h-5 text-yellow-500" />
          农历转公历
        </h2>

        <!-- 年份选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">农历年份</label>
          <select
            v-model="lunarInput.year"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option v-for="y in lunarYears" :key="y" :value="y">{{ y }}年 ({{ getZodiac(y) }})</option>
          </select>
        </div>

        <!-- 月份选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">农历月份</label>
          <div class="flex gap-2">
            <select
              v-model="lunarInput.isLeap"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option :value="false">平月</option>
              <option :value="true">闰月</option>
            </select>
            <select
              v-model="lunarInput.month"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
            </select>
          </div>
        </div>

        <!-- 日期选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">农历日期</label>
          <select
            v-model="lunarInput.day"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option v-for="d in 30" :key="d" :value="d">{{ getLunarDayName(d) }}</option>
          </select>
        </div>

        <!-- 转换按钮 -->
        <button
          @click="lunarToSolar"
          class="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg"
        >
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

    <!-- 农历知识 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">农历知识</h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
        <!-- 天干地支 -->
        <div>
          <h3 class="font-medium mb-3">天干地支</h3>
          <div class="space-y-2">
            <div class="flex flex-wrap gap-1">
              <span v-for="(gan, i) in heavenlyStems" :key="i" class="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">{{ gan }}</span>
            </div>
            <div class="text-xs text-gray-500">十天干: 甲乙丙丁戊己庚辛壬癸</div>
            <div class="flex flex-wrap gap-1">
              <span v-for="(zhi, i) in earthlyBranches" :key="i" class="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-xs">{{ zhi }}</span>
            </div>
            <div class="text-xs text-gray-500">十二地支: 子丑寅卯辰巳午未申酉戌亥</div>
          </div>
        </div>

        <!-- 生肖 -->
        <div>
          <h3 class="font-medium mb-3">十二生肖</h3>
          <div class="grid grid-cols-4 gap-2 text-xs">
            <span v-for="(zodiac, i) in zodiacs" :key="i" class="p-2 bg-center">{{ zodiac }}年</span>
          </div>
        </div>

        <!-- 传统节日 -->
        <div>
          <h3 class="font-medium mb-3">传统节日</h3>
          <div class="space-y-1 text-gray-600 dark:text-gray-400 text-xs">
            <div>春节: 正月初一</div>
            <div>元宵节: 正月十五</div>
            <div>清明节: 公历4月4-6日</div>
            <div>端午节: 五月初五</div>
            <div>七夕节: 七月初七</div>
            <div>中秋节: 八月十五</div>
            <div>重阳节: 九月初九</div>
            <div>腊八节: 腊月初八</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/date-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calendar class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">日期计算器</h3>
          <p class="text-sm text-gray-500">日期加减计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/quarter-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Calculator class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">季度计算器</h3>
          <p class="text-sm text-gray-500">季度查询</p>
        </NuxtLink>
        <NuxtLink to="/tools/solar-term-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Sun class="w-8 h-8 text-yellow-500 mb-2" />
          <h3 class="font-medium">节气计算器</h3>
          <p class="text-sm text-gray-500">二十四节气</p>
        </NuxtLink>
        <NuxtLink to="/tools/holiday-calculator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Gift class="w-8 h-8 text-red-500 mb-2" />
          <h3 class="font-medium">节假日查询</h3>
          <p class="text-sm text-gray-500">法定节假日</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Calendar,
  Moon,
  Calculator,
  Sun,
  Gift
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '农历日历转换工具 - 公历与农历互转',
  meta: [
    {
      name: 'description',
      content: '在线农历日历转换工具，支持公历与农历互转，显示天干地支、生肖、节气等中国传统历法信息。包含传统节日查询和农历知识介绍。'
    },
    {
      name: 'keywords',
      content: '农历转换,公历农历,天干地支,生肖查询,二十四节气,传统节日,在线农历'
    }
  ]
})

// 天干
const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
// 地支
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
// 生肖
const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
// 农历日名
const lunarDayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
// 星座
const constellations = ['水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座',
  '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座']
// 星期
const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
// 二十四节气
const solarTerms = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
  '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至']
// 传统节日
const lunarFestivals: Record<string, string> = {
  '1-1': '春节',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '5-5': '端午节',
  '7-7': '七夕节',
  '7-15': '中元节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '10-1': '寒衣节',
  '10-15': '下元节',
  '12-8': '腊八节',
  '12-23': '小年'
}

// State
const solarDate = ref(new Date().toISOString().split('T')[0])
const lunarInput = ref({ year: new Date().getFullYear(), month: 1, day: 1, isLeap: false })
const lunarResult = ref<any>(null)
const solarResult = ref('')

// 农历年份列表
const lunarYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 200 }, (_, i) => currentYear - 100 + i)
})

// 获取生肖
function getZodiac(year: number): string {
  const index = (year - 4) % 12
  return zodiacs[index >= 0 ? index : index + 12]
}

// 获取天干地支年份
function getGzYear(year: number): string {
  const stemIndex = (year - 4) % 10
  const branchIndex = (year - 4) % 12
  const stem = heavenlyStems[stemIndex >= 0 ? stemIndex : stemIndex + 10]
  const branch = earthlyBranches[branchIndex >= 0 ? branchIndex : branchIndex + 12]
  return stem + branch + '年'
}

// 获取星座
function getConstellation(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dates = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 22, 22]
  const index = month - 1
  return (day < dates[index] ? index - 1 : index) >= 0
    ? constellations[(day < dates[index] ? index - 1 : index) % 12]
    : constellations[11]
}

// 简化的公历转农历
function solarToLunarSimple(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 基准日期：2024年1月1日 = 农历2023年十一月二十
  const baseDate = new Date(2024, 0, 1)
  const baseLunar = { year: 2023, month: 11, day: 20 }

  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))

  // 简化计算：农历月平均29.53天
  const lunarMonthDays = 29.53
  const totalMonths = Math.floor(diffDays / lunarMonthDays)
  const remainingDays = Math.floor(diffDays % lunarMonthDays)

  let lunarYear = baseLunar.year + Math.floor((baseLunar.month + totalMonths) / 12)
  let lunarMonth = ((baseLunar.month + totalMonths) % 12 + 12) % 12 || 12
  let lunarDay = baseLunar.day + remainingDays

  // 处理日期溢出
  while (lunarDay > 30) {
    lunarDay -= 30
    lunarMonth++
    if (lunarMonth > 12) {
      lunarMonth = 1
      lunarYear++
    }
  }

  return {
    lunarYear,
    lunarMonth,
    lunarDay: lunarDay > 0 ? lunarDay : 1,
    isLeap: false
  }
}

// 公历转农历
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

// 获取近似节气
function getApproxSolarTerm(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const termIndex = Math.floor((month - 1) * 2)
  const termDay = Math.floor((month * 2 - (termIndex % 2 === 0 ? 1 : 15)) + day / 8)
  if (day >= 4 && day <= 8) {
    return solarTerms[termIndex % 24]
  } else if (day >= 18 && day <= 23) {
    return solarTerms[(termIndex + 1) % 24]
  }
  return ''
}

// 农历转公历（简化）
function lunarToSolar() {
  const { year, month, day, isLeap } = lunarInput.value

  // 基准日期：农历2023年十一月二十 = 公历2024年1月1日
  const baseLunar = { year: 2023, month: 11, day: 20 }
  const baseDate = new Date(2024, 0, 1)

  const yearDiff = year - baseLunar.year
  const monthDiff = month - baseLunar.year + yearDiff * 12
  const dayDiff = day - baseLunar.day

  const totalDays = monthDiff * 30 + dayDiff

  const resultDate = new Date(baseDate.getTime() + totalDays * 24 * 60 * 60 * 1000)

  solarResult.value = `${resultDate.getFullYear()}年${resultDate.getMonth() + 1}月${resultDate.getDate()}日`
}

// 获取农历日名
function getLunarDayName(day: number): string {
  return lunarDayNames[day - 1] || `${day}日`
}

// 快捷操作
function setToday() {
  solarDate.value = new Date().toISOString().split('T')[0]
  solarToLunar()
}

function setSolarDate(offset: number) {
  const date = new Date(solarDate.value)
  date.setDate(date.getDate() + offset)
  solarDate.value = date.toISOString().split('T')[0]
  solarToLunar()
}

function setLunarNewYear() {
  const currentYear = new Date().getFullYear()
  // 简化：春节大约在1月21日到2月20日之间
  // 这里用2月初作为近似
  solarDate.value = `${currentYear}-02-10`
  solarToLunar()
}

// 初始化
solarToLunar()
</script>
