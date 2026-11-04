<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">年龄计算器</h1>
      <p class="text-muted-foreground">精确计算年龄，包括年、月、日、小时等详细信息</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：出生日期输入 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">出生信息</h2>

          <!-- 出生日期 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">出生日期</label>
              <input
                v-model="birthDate"
                type="datetime-local"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="calculateAge"
              />
            </div>

            <!-- 快捷选择 -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="setToday"
                class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
              >
                今天出生（0岁）
              </button>
              <button
                @click="setYesterday"
                class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
              >
                昨天出生（0岁）
              </button>
              <button
                @click="setLastYear"
                class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
              >
                去年出生（1岁）
              </button>
              <button
                @click="setTenYearsAgo"
                class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
              >
                10年前出生
              </button>
            </div>

            <!-- 常用生日选择 -->
            <div>
              <label class="text-sm font-medium">常用生日</label>
              <div class="mt-2 space-y-2">
                <div
                  v-for="preset in birthdayPresets"
                  :key="preset.name"
                  @click="setBirthdayPreset(preset)"
                  class="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                >
                  <span class="text-sm">{{ preset.name }}</span>
                  <span class="text-sm text-muted-foreground">{{ preset.age }}岁</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 年龄结果 -->
        <div v-if="ageResult" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">计算结果</h2>
          <div class="space-y-4">
            <!-- 主要年龄显示 -->
            <div class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="text-sm text-muted-foreground mb-2">当前年龄</div>
              <div class="text-3xl font-bold">{{ ageResult.years }}岁</div>
              <div class="text-sm text-muted-foreground mt-1">{{ ageResult.months }}个月 {{ ageResult.days }}天</div>
            </div>

            <!-- 详细分解 -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">总月数</div>
                <div class="font-mono">{{ ageResult.totalMonths }}个月</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">总周数</div>
                <div class="font-mono">{{ ageResult.totalWeeks }}周</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">总天数</div>
                <div class="font-mono">{{ ageResult.totalDays }}天</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">总小时数</div>
                <div class="font-mono">{{ ageResult.totalHours.toLocaleString() }}小时</div>
              </div>
            </div>

            <!-- 里程碑信息 -->
            <div class="space-y-3">
              <div class="text-sm font-medium">重要里程碑</div>
              <div class="space-y-2">
                <div class="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span class="text-sm">第100天</span>
                  <span class="text-sm text-muted-foreground">{{ milestoneDays[100] }}</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span class="text-sm">第1000天</span>
                  <span class="text-sm text-muted-foreground">{{ milestoneDays[1000] }}</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span class="text-sm">第10000天</span>
                  <span class="text-sm text-muted-foreground">{{ milestoneDays[10000] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：目标年龄计算 -->
      <div class="space-y-4">
        <!-- 目标日期计算 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">目标年龄计算</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">目标年龄</label>
              <input
                v-model.number="targetAge"
                type="number"
                min="1"
                max="150"
                placeholder="输入年龄"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="calculateTargetDate"
              />
            </div>

            <div v-if="targetDateResult" class="p-4 bg-muted rounded-lg space-y-2">
              <div class="text-sm text-muted-foreground">满{{ targetAge }}岁的日期</div>
              <div class="font-medium">{{ targetDateResult.date }}</div>
              <div class="text-sm text-muted-foreground">还有{{ targetDateResult.daysLeft }}天</div>
            </div>

            <!-- 常见目标年龄 -->
            <div>
              <label class="text-sm font-medium">常见目标年龄</label>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <button
                  v-for="age in commonAges"
                  :key="age"
                  @click="setTargetAge(age)"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm"
                >
                  {{ age }}岁
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 下一个生日 -->
        <div v-if="nextBirthday" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">下一个生日</h2>
          <div class="space-y-3">
            <div class="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="text-sm text-muted-foreground mb-2">{{ nextBirthday.age }}岁生日</div>
              <div class="text-xl font-bold">{{ nextBirthday.date }}</div>
              <div class="text-sm text-muted-foreground mt-1">还有{{ nextBirthday.daysLeft }}天</div>
            </div>

            <div v-if="nextBirthday.isLeapBirthday" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="text-sm text-yellow-800">
                ⭐ 您是闰年出生，4年才过一个真正的生日！
              </div>
            </div>
          </div>
        </div>

        <!-- 星座信息 -->
        <div v-if="zodiacInfo" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">星座信息</h2>
          <div class="flex items-center gap-4">
            <div class="text-4xl">{{ zodiacInfo.emoji }}</div>
            <div>
              <div class="font-medium">{{ zodiacInfo.name }}</div>
              <div class="text-sm text-muted-foreground">{{ zodiacInfo.dateRange }}</div>
              <div class="text-sm text-muted-foreground mt-1">{{ zodiacInfo.element }}</div>
            </div>
          </div>
        </div>

        <!-- 历史瞬间 -->
        <div v-if="ageResult && ageResult.totalDays > 0" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">历史瞬间</h2>
          <div class="space-y-3 text-sm">
            <div class="p-3 bg-muted rounded-lg">
              <div class="font-medium mb-1">出生那天的世界</div>
              <div class="text-muted-foreground">{{ ageResult.birthDayInfo }}</div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">出生时距现在</div>
                <div class="font-mono">{{ ageResult.pastTimeInfo }}</div>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <div class="text-muted-foreground mb-1">生命进度</div>
                <div class="font-mono">{{ ageResult.lifeProgress }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于年龄计算
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">计算方法</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>按照公历精确计算，包含闰年闰月的处理</li>
              <li>年龄计算考虑了出生时刻的精确时间</li>
              <li>闰年2月29日出生的人在非闰年生日为2月28日或3月1日</li>
              <li>所有计算都基于当前的系统时间</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">趣味知识</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>人类的平均寿命约为72岁</li>
              <li>活到100岁的人被称为"百岁老人"</li>
              <li>闰年每4年出现一次，但能被100整除但不能被400整除的年份除外</li>
              <li>全球每秒大约有4.3个婴儿出生</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/date-diff"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Calendar class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">日期差计算</p>
              <p class="text-xs text-muted-foreground">计算两个日期的时间差</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/date-calculator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Calculator class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">日期计算器</p>
              <p class="text-xs text-muted-foreground">日期加减计算</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/week-calculator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <CalendarDays class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">周数计算器</p>
              <p class="text-xs text-muted-foreground">计算日期所在周数</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Info, Calendar, Calculator, CalendarDays, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const birthDate = ref('')
const targetAge = ref('')
const ageResult = ref(null)
const targetDateResult = ref(null)
const nextBirthday = ref(null)
const zodiacInfo = ref(null)

// 常用生日预设
const birthdayPresets = [
  { name: '2000年出生（千禧宝宝）', date: '2000-01-01', age: 24 },
  { name: '1990年出生（90后）', date: '1990-01-01', age: 34 },
  { name: '1988年出生（龙年）', date: '1988-01-01', age: 36 },
  { name: '1980年出生（80后）', date: '1980-01-01', age: 44 },
  { name: '1970年出生（70后）', date: '1970-01-01', age: 54 }
]

// 常见目标年龄
const commonAges = [18, 20, 30, 40, 50, 60, 70, 80, 100]

// 星座信息
const zodiacSigns = [
  { name: '白羊座', emoji: '♈', dateRange: '3月21日-4月19日', element: '火象星座', month: 3, day: 21 },
  { name: '金牛座', emoji: '♉', dateRange: '4月20日-5月20日', element: '土象星座', month: 4, day: 20 },
  { name: '双子座', emoji: '♊', dateRange: '5月21日-6月21日', element: '风象星座', month: 5, day: 21 },
  { name: '巨蟹座', emoji: '♋', dateRange: '6月22日-7月22日', element: '水象星座', month: 6, day: 22 },
  { name: '狮子座', emoji: '♌', dateRange: '7月23日-8月22日', element: '火象星座', month: 7, day: 23 },
  { name: '处女座', emoji: '♍', dateRange: '8月23日-9月22日', element: '土象星座', month: 8, day: 23 },
  { name: '天秤座', emoji: '♎', dateRange: '9月23日-10月23日', element: '风象星座', month: 9, day: 23 },
  { name: '天蝎座', emoji: '♏', dateRange: '10月24日-11月22日', element: '水象星座', month: 10, day: 24 },
  { name: '射手座', emoji: '♐', dateRange: '11月23日-12月21日', element: '火象星座', month: 11, day: 23 },
  { name: '摩羯座', emoji: '♑', dateRange: '12月22日-1月19日', element: '土象星座', month: 12, day: 22 },
  { name: '水瓶座', emoji: '♒', dateRange: '1月20日-2月18日', element: '风象星座', month: 1, day: 20 },
  { name: '双鱼座', emoji: '♓', dateRange: '2月19日-3月20日', element: '水象星座', month: 2, day: 19 }
]

// 计算里程碑日期
const milestoneDays = computed(() => {
  if (!ageResult.value || !birthDate.value) return {}

  const birth = new Date(birthDate.value)
  const milestones = {}

  ;[100, 1000, 10000].forEach(days => {
    const date = new Date(birth)
    date.setDate(birth.getDate() + days)
    milestones[days] = date.toLocaleDateString('zh-CN')
  })

  return milestones
})

// 计算年龄
const calculateAge = () => {
  if (!birthDate.value) {
    ageResult.value = null
    nextBirthday.value = null
    zodiacInfo.value = null
    return
  }

  const birth = new Date(birthDate.value)
  const now = new Date()

  // 精确计算
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()
  let hours = now.getHours() - birth.getHours()
  let minutes = now.getMinutes() - birth.getMinutes()
  let seconds = now.getSeconds() - birth.getSeconds()

  // 处理负数情况
  if (seconds < 0) {
    seconds += 60
    minutes--
  }
  if (minutes < 0) {
    minutes += 60
    hours--
  }
  if (hours < 0) {
    hours += 24
    days--
  }
  if (days < 0) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += lastMonth.getDate()
    months--
  }
  if (months < 0) {
    months += 12
    years--
  }

  // 计算总量
  const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
  const totalWeeks = Math.floor(totalDays / 7)
  const totalMonths = years * 12 + months
  const totalHours = Math.floor((now - birth) / (1000 * 60 * 60))

  ageResult.value = {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalWeeks,
    totalMonths,
    totalHours,
    birthDayInfo: birth.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }),
    pastTimeInfo: `${Math.floor((now - birth) / 1000)}秒前`,
    lifeProgress: `${(totalDays / 36500 * 100).toFixed(2)}%` // 假设100岁为人生
  }

  // 计算下一个生日
  calculateNextBirthday(birth, now)

  // 计算星座
  calculateZodiac(birth)
}

// 计算下一个生日
const calculateNextBirthday = (birth, now) => {
  const currentYear = now.getFullYear()
  let nextBirth = new Date(currentYear, birth.getMonth(), birth.getDate())

  // 如果今年生日已过，计算明年的
  if (nextBirth < now) {
    nextBirth = new Date(currentYear + 1, birth.getMonth(), birth.getDate())
  }

  // 处理闰年2月29日
  const isLeapBirthday = birth.getMonth() === 1 && birth.getDate() === 29
  if (isLeapBirthday) {
    const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    if (!isLeapYear(nextBirth.getFullYear())) {
      nextBirth.setDate(28) // 非闰年改为2月28日
    }
  }

  const daysLeft = Math.ceil((nextBirth - now) / (1000 * 60 * 60 * 24))
  const nextAge = nextBirth.getFullYear() - birth.getFullYear()

  nextBirthday.value = {
    age: nextAge,
    date: nextBirth.toLocaleDateString('zh-CN'),
    daysLeft,
    isLeapBirthday
  }
}

// 计算星座
const calculateZodiac = (birth) => {
  const month = birth.getMonth() + 1
  const day = birth.getDate()

  // 摩羯座特殊处理（跨越年份）
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    zodiacInfo.value = zodiacSigns[9] // 摩羯座
    return
  }

  // 其他星座按顺序查找
  const sign = zodiacSigns.find(s => {
    if (s.month === 12) return false // 已处理摩羯座
    if (month === s.month && day >= s.day) return true
    if (month === ((s.month % 12) + 1) && day < zodiacSigns[zodiacSigns.indexOf(s) + 1].day) return true
    return false
  })

  zodiacInfo.value = sign || zodiacSigns[0]
}

// 计算目标日期
const calculateTargetDate = () => {
  if (!targetAge.value || !birthDate.value) {
    targetDateResult.value = null
    return
  }

  const birth = new Date(birthDate.value)
  const now = new Date()
  const targetDate = new Date(birth.getFullYear() + targetAge.value, birth.getMonth(), birth.getDate())

  const daysLeft = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24))

  targetDateResult.value = {
    date: targetDate.toLocaleDateString('zh-CN'),
    daysLeft: daysLeft > 0 ? daysLeft : 0
  }
}

// 设置今天
const setToday = () => {
  birthDate.value = new Date().toISOString().slice(0, 16)
  calculateAge()
}

// 设置昨天
const setYesterday = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  birthDate.value = yesterday.toISOString().slice(0, 16)
  calculateAge()
}

// 设置去年
const setLastYear = () => {
  const lastYear = new Date()
  lastYear.setFullYear(lastYear.getFullYear() - 1)
  birthDate.value = lastYear.toISOString().slice(0, 16)
  calculateAge()
}

// 设置10年前
const setTenYearsAgo = () => {
  const tenYearsAgo = new Date()
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
  birthDate.value = tenYearsAgo.toISOString().slice(0, 16)
  calculateAge()
}

// 设置生日预设
const setBirthdayPreset = (preset) => {
  birthDate.value = new Date(preset.date + 'T00:00:00').toISOString().slice(0, 16)
  calculateAge()
}

// 设置目标年龄
const setTargetAge = (age) => {
  targetAge.value = age
  calculateTargetDate()
}

// SEO配置
useSeoMeta({
  title: '年龄计算器 - 精确计算年龄和生日信息',
  description: '免费在线年龄计算工具，精确计算年、月、日、小时等详细信息，包含星座查询、生日倒计时等功能。',
  keywords: ['年龄计算', '生日计算', '星座查询', '生日倒计时', '精确年龄', '在线工具']
})



// 初始化
onMounted(() => {
  // 默认设置为20年前
  const defaultBirth = new Date()
  defaultBirth.setFullYear(defaultBirth.getFullYear() - 20)
  birthDate.value = defaultBirth.toISOString().slice(0, 16)
  calculateAge()
})
</script>