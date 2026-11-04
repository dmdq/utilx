<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">睡眠周期计算器</h1>
      <p class="text-muted-foreground">计算最佳睡眠和起床时间，基于90分钟睡眠周期，提高睡眠质量</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：计算工具 -->
      <div class="space-y-4">
        <!-- 计算模式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary" />
            计算模式
          </h2>

          <div class="grid grid-cols-2 gap-2">
            <button
              @click="mode = 'wakeup'"
              :class="['p-3 rounded-lg text-sm', mode === 'wakeup' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
            >
              计算起床时间
            </button>
            <button
              @click="mode = 'bedtime'"
              :class="['p-3 rounded-lg text-sm', mode === 'bedtime' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
            >
              计算就寝时间
            </button>
          </div>
        </div>

        <!-- 计算起床时间 -->
        <div v-if="mode === 'wakeup'" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">计算最佳起床时间</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">就寝时间</label>
              <input
                v-model="bedtimeInput"
                type="time"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">入睡所需时间（分钟）</label>
              <input
                v-model.number="fallAsleepTime"
                type="number"
                min="0"
                max="60"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="默认15分钟"
              >
              <p class="text-xs text-muted-foreground mt-1">从躺下到真正入睡的时间</p>
            </div>

            <button
              @click="calculateWakeUpTime"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              计算起床时间
            </button>
          </div>
        </div>

        <!-- 计算就寝时间 -->
        <div v-if="mode === 'bedtime'" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">计算最佳就寝时间</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">需要起床的时间</label>
              <input
                v-model="wakeupInput"
                type="time"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">入睡所需时间（分钟）</label>
              <input
                v-model.number="fallAsleepTime"
                type="number"
                min="0"
                max="60"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="默认15分钟"
              >
            </div>

            <button
              @click="calculateBedTime"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              计算就寝时间
            </button>
          </div>
        </div>

        <!-- 睡眠周期说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">睡眠周期说明</h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium mb-1">什么是睡眠周期？</p>
              <p class="text-muted-foreground">一个完整的睡眠周期约为90分钟，包括浅睡、深睡和快速眼动（REM）睡眠。每晚通常经历4-6个周期。</p>
            </div>

            <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p class="font-medium mb-1">为什么按周期醒来？</p>
              <p class="text-muted-foreground">在睡眠周期结束时醒来，您会感到更清醒和精神饱满。在深睡期被唤醒会感到昏沉和疲劳。</p>
            </div>

            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium mb-1">推荐睡眠时长</p>
              <p class="text-muted-foreground">成人建议7-9小时（5-6个周期），青少年需要8-10小时，老年人7-8小时。</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：结果和建议 -->
      <div class="space-y-4">
        <!-- 计算结果 -->
        <div v-if="results.length > 0" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sunrise class="w-5 h-5 text-yellow-500" />
            {{ mode === 'wakeup' ? '建议起床时间' : '建议就寝时间' }}
          </h2>

          <div class="space-y-3">
            <div
              v-for="(result, index) in results"
              :key="index"
              class="p-4 rounded-lg"
              :class="getRecommendedClass(index)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-muted-foreground">{{ result.cycles }}个睡眠周期 ({{ result.duration }})</p>
                  <p class="text-2xl font-bold">{{ result.time }}</p>
                </div>
                <div v-if="index === 0" class="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                  推荐
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
            <p class="font-medium mb-1">提示</p>
            <p class="text-muted-foreground">建议选择5-6个睡眠周期，这样可以获得充足的深睡和REM睡眠。少于4个周期可能导致睡眠不足。</p>
          </div>
        </div>

        <!-- 睡眠阶段 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">睡眠周期各阶段</h2>

          <div class="space-y-3">
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm">浅睡期 (N1/N2)</span>
                <span class="text-xs text-muted-foreground">~50分钟</span>
              </div>
              <p class="text-xs text-muted-foreground">身体放松，心率减慢，容易醒来</p>
            </div>

            <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm">深睡期 (N3)</span>
                <span class="text-xs text-muted-foreground">~30分钟</span>
              </div>
              <p class="text-xs text-muted-foreground">身体修复，免疫系统增强，记忆巩固</p>
            </div>

            <div class="p-3 bg-pink-50 dark:bg-pink-900/20 rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm">快速眼动期 (REM)</span>
                <span class="text-xs text-muted-foreground">~10-60分钟</span>
              </div>
              <p class="text-xs text-muted-foreground">做梦，情绪处理，创造力增强</p>
            </div>
          </div>

          <div class="mt-4 p-3 bg-muted rounded">
            <p class="text-sm text-muted-foreground">一个完整周期约90分钟，各阶段时长会因人而异</p>
          </div>
        </div>

        <!-- 不同年龄的睡眠需求 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">各年龄推荐睡眠时长</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>婴儿 (0-3个月)</span>
              <span class="font-mono">14-17小时</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>幼儿 (1-2岁)</span>
              <span class="font-mono">11-14小时</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>学龄前 (3-5岁)</span>
              <span class="font-mono">10-13小时</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>学龄 (6-13岁)</span>
              <span class="font-mono">9-11小时</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>青少年 (14-17岁)</span>
              <span class="font-mono">8-10小时</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span class="font-medium">成人 (18-64岁)</span>
              <span class="font-mono font-bold">7-9小时</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>老年 (65岁以上)</span>
              <span class="font-mono">7-8小时</span>
            </div>
          </div>
        </div>

        <!-- 改善睡眠质量 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">改善睡眠质量</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <Moon class="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">规律作息</p>
                <p class="text-muted-foreground">每天固定时间睡觉和起床，包括周末</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Sun class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">早晨光照</p>
                <p class="text-muted-foreground">起床后接触自然光，帮助调节生物钟</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Coffee class="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">下午禁咖啡因</p>
                <p class="text-muted-foreground">下午2点后避免咖啡、茶、能量饮料</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              < Smartphone class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">睡前远离屏幕</p>
                <p class="text-muted-foreground">睡前1小时避免使用电子设备</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Thermometer class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">保持适宜温度</p>
                <p class="text-muted-foreground">卧室温度保持在18-22°C最适宜睡眠</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <VolumeX class="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">安静环境</p>
                <p class="text-muted-foreground">使用耳塞或白噪音机减少干扰</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 睡眠债务 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">睡眠债务计算</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">本周实际平均睡眠时长（小时）</label>
              <input
                v-model.number="actualSleep"
                type="number"
                step="0.5"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="例如: 6"
              >
            </div>

            <button
              @click="calculateSleepDebt"
              class="w-full px-4 py-3 bg-muted rounded-lg text-sm"
            >
              计算睡眠债务
            </button>

            <div v-if="sleepDebt !== null" class="p-4 rounded" :class="sleepDebt > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-green-50 dark:bg-green-900/20'">
              <p class="text-sm text-muted-foreground">您的睡眠债务</p>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-bold">{{ sleepDebt > 0 ? '+' : '' }}{{ sleepDebt }}</span>
                <span class="text-sm">小时</span>
              </div>
              <p v-if="sleepDebt > 0" class="text-xs text-muted-foreground mt-2">
                建议本周每天增加 {{ Math.ceil(Math.abs(sleepDebt) / 7 * 10) / 10 }} 小时睡眠来补足
              </p>
              <p v-else class="text-xs text-muted-foreground mt-2">
                您的睡眠充足，继续保持！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'
import {
  Clock,
  Sunrise,
  Moon,
  Sun,
  Coffee,
  Smartphone,
  Thermometer,
  VolumeX
} from 'lucide-vue-next'

const mode = ref('wakeup')
const bedtimeInput = ref('23:00')
const wakeupInput = ref('07:00')
const fallAsleepTime = ref(15)
const actualSleep = ref(null)
const results = ref([])
const sleepDebt = ref(null)

const CYCLE_DURATION = 90 // 90分钟一个周期

function calculateWakeUpTime() {
  if (!bedtimeInput.value) return

  const [hours, minutes] = bedtimeInput.value.split(':').map(Number)
  let bedtimeMinutes = hours * 60 + minutes

  // 加上入睡时间
  bedtimeMinutes += fallAsleepTime.value

  results.value = []

  // 计算4-7个睡眠周期的起床时间
  for (let cycles = 4; cycles <= 7; cycles++) {
    const wakeUpMinutes = bedtimeMinutes + (cycles * CYCLE_DURATION)
    const hours24 = wakeUpMinutes % (24 * 60)
    const resultHours = Math.floor(hours24 / 60)
    const resultMinutes = hours24 % 60

    results.value.push({
      cycles,
      duration: `${(cycles * 1.5).toFixed(1)}小时`,
      time: `${resultHours.toString().padStart(2, '0')}:${resultMinutes.toString().padStart(2, '0')}`
    })
  }
}

function calculateBedTime() {
  if (!wakeupInput.value) return

  const [hours, minutes] = wakeupInput.value.split(':').map(Number)
  let wakeupMinutes = hours * 60 + minutes

  results.value = []

  // 计算4-7个睡眠周期的就寝时间
  for (let cycles = 4; cycles <= 7; cycles++) {
    let bedtimeMinutes = wakeupMinutes - (cycles * CYCLE_DURATION) - fallAsleepTime.value

    // 处理负数（前一天）
    while (bedtimeMinutes < 0) {
      bedtimeMinutes += 24 * 60
    }

    const resultHours = Math.floor(bedtimeMinutes / 60)
    const resultMinutes = bedtimeMinutes % 60

    results.value.push({
      cycles,
      duration: `${(cycles * 1.5).toFixed(1)}小时`,
      time: `${resultHours.toString().padStart(2, '0')}:${resultMinutes.toString().padStart(2, '0')}`
    })
  }

  // 反转数组，使推荐时间在前
  results.value.reverse()
}

function calculateSleepDebt() {
  if (actualSleep.value === null) return

  const recommendedSleep = 8 // 成人推荐8小时
  sleepDebt.value = (recommendedSleep - actualSleep.value) * 7 // 一周的总债务
}

function getRecommendedClass(index) {
  // 5-6个周期是推荐范围
  if (results.value[index].cycles === 5 || results.value[index].cycles === 6) {
    return 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
  }
  if (results.value[index].cycles === 4) {
    return 'bg-yellow-50 dark:bg-yellow-900/20'
  }
  return 'bg-muted'
}

useSeoMeta({
  title: '睡眠周期计算器 - 在线最佳睡眠时间计算工具',
  description: '免费在线睡眠周期计算器，基于90分钟睡眠周期计算最佳起床和就寝时间，提高睡眠质量，科学安排作息。', keywords: ['睡眠周期', '睡眠时间', '起床时间', '就寝时间', '睡眠质量', '90分钟周期', '睡眠计算器', '作息安排']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('睡眠周期计算器')
</script>
