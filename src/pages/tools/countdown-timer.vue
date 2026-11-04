<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">倒计时器</h1>
      <p class="text-muted-foreground">设置倒计时，精确到秒的实时倒计时工具</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 倒计时显示 -->
      <div class="bg-card border rounded-lg p-8 text-center">
        <div v-if="isRunning || (countdown > 0)" class="space-y-4">
          <!-- 大屏显示 -->
          <div class="text-6xl lg:text-8xl font-mono font-bold tabular-nums">
            {{ formatTime(countdown) }}
          </div>

          <!-- 进度条 -->
          <div class="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              class="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>

          <!-- 控制按钮 -->
          <div class="flex justify-center gap-4">
            <button
              v-if="!isRunning && countdown > 0"
              @click="start"
              class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Play class="w-5 h-5" />
              开始
            </button>
            <button
              v-if="isRunning"
              @click="pause"
              class="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <Pause class="w-5 h-5" />
              暂停
            </button>
            <button
              v-if="isPaused"
              @click="resume"
              class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Play class="w-5 h-5" />
              继续
            </button>
            <button
              v-if="countdown > 0"
              @click="reset"
              class="px-6 py-3 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors flex items-center gap-2"
            >
              <RotateCcw class="w-5 h-5" />
              重置
            </button>
          </div>

          <!-- 预设声音选择 -->
          <div class="flex justify-center items-center gap-3">
            <span class="text-sm text-muted-foreground">提醒声音</span>
            <select
              v-model="selectedSound"
              class="px-3 py-1 border border-border rounded-md text-sm"
            >
              <option value="none">无</option>
              <option value="beep">哔哔声</option>
              <option value="bell">铃声</option>
              <option value="alert">警报</option>
            </select>
          </div>
        </div>

        <!-- 结束提示 -->
        <div v-if="countdown <= 0 && !isRunning" class="space-y-4">
          <div class="text-4xl">⏰</div>
          <div class="text-2xl font-bold text-primary">倒计时结束！</div>
          <button
            @click="reset"
            class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <RotateCcw class="w-5 h-5" />
            重新开始
          </button>
        </div>
      </div>

      <!-- 设置区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 快速设置 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">快速设置</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="preset in quickPresets"
              :key="preset.name"
              @click="setPreset(preset)"
              :disabled="isRunning"
              class="px-4 py-3 bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="font-medium">{{ preset.name }}</div>
              <div class="text-sm text-muted-foreground">{{ preset.time }}</div>
            </button>
          </div>
        </div>

        <!-- 自定义设置 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">自定义设置</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="text-sm font-medium">小时</label>
                <input
                  v-model.number="customTime.hours"
                  type="number"
                  min="0"
                  max="23"
                  :disabled="isRunning"
                  class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1 disabled:opacity-50"
                />
              </div>
              <div>
                <label class="text-sm font-medium">分钟</label>
                <input
                  v-model.number="customTime.minutes"
                  type="number"
                  min="0"
                  max="59"
                  :disabled="isRunning"
                  class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1 disabled:opacity-50"
                />
              </div>
              <div>
                <label class="text-sm font-medium">秒</label>
                <input
                  v-model.number="customTime.seconds"
                  type="number"
                  min="0"
                  max="59"
                  :disabled="isRunning"
                  class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1 disabled:opacity-50"
                />
              </div>
            </div>
            <button
              @click="setCustomTime"
              :disabled="isRunning"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              设置倒计时
            </button>
          </div>
        </div>
      </div>

      <!-- 高级功能 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 倒计时历史 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">倒计时历史</h2>
          <div v-if="history.length === 0" class="text-sm text-muted-foreground text-center py-4">
            暂无历史记录
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(item, index) in history"
              :key="index"
              @click="setFromHistory(item)"
              class="p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-sm text-muted-foreground">{{ item.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 事件倒计时 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">事件倒计时</h2>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium">目标日期时间</label>
              <input
                v-model="eventDateTime"
                type="datetime-local"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
                @input="calculateEventCountdown"
              />
            </div>
            <div>
              <label class="text-sm font-medium">事件名称</label>
              <input
                v-model="eventName"
                type="text"
                placeholder="输入事件名称"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              />
            </div>
            <div v-if="eventCountdown" class="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="text-sm text-muted-foreground">距离{{ eventName || '事件' }}</div>
              <div class="font-mono text-lg">{{ formatEventTime(eventCountdown) }}</div>
            </div>
          </div>
        </div>

        <!-- 循环倒计时 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">循环倒计时</h2>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium">循环次数</label>
              <input
                v-model.number="loopCount"
                type="number"
                min="1"
                max="100"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              />
            </div>
            <div>
              <label class="text-sm font-medium">间隔时间（分钟）</label>
              <input
                v-model.number="loopInterval"
                type="number"
                min="0"
                max="60"
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              />
            </div>
            <button
              @click="startLoop"
              :disabled="isRunning"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始循环
            </button>
            <div v-if="currentLoop > 0" class="text-sm text-muted-foreground text-center">
              第 {{ currentLoop }} / {{ loopCount }} 次
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
          使用提示
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">功能说明</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>支持精确到秒的倒计时功能</li>
              <li>提供多种预设时间快速选择</li>
              <li>支持自定义倒计时时间</li>
              <li>倒计时结束时可播放提醒声音</li>
              <li>支持循环倒计时功能</li>
              <li>可保存倒计时历史记录</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">常见用途</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>番茄工作法（25分钟工作，5分钟休息）</li>
              <li>运动间歇计时</li>
              <li>会议提醒</li>
              <li>烹饪计时</li>
              <li>学习和考试时间管理</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/stopwatch"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Timer class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">秒表计时器</p>
              <p class="text-xs text-muted-foreground">精确计时工具</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/timestamp-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Clock class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">时间戳转换器</p>
              <p class="text-xs text-muted-foreground">Unix时间戳转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/workday-calculator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Calendar class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">工作日计算器</p>
              <p class="text-xs text-muted-foreground">计算工作日天数</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Info, Play, Pause, RotateCcw, Timer, Clock, Calendar, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'time', name: '时间日期', description: '时间日期相关工具集合' }

// 状态管理
const countdown = ref(0)
const initialCountdown = ref(0)
const isRunning = ref(false)
const isPaused = ref(false)
const selectedSound = ref('beep')
const customTime = ref({
  hours: 0,
  minutes: 0,
  seconds: 0
})
const history = ref([])
const eventDateTime = ref('')
const eventCountdown = ref(null)
const eventName = ref('')
const loopCount = ref(3)
const loopInterval = ref(5)
const currentLoop = ref(0)
let interval = null
let eventInterval = null

// 快速预设
const quickPresets = [
  { name: '番茄工作法', time: '25分钟', seconds: 25 * 60 },
  { name: '短暂休息', time: '5分钟', seconds: 5 * 60 },
  { name: '长休息', time: '15分钟', seconds: 15 * 60 },
  { name: '1小时', time: '1小时', seconds: 60 * 60 },
  { name: '30分钟', time: '30分钟', seconds: 30 * 60 },
  { name: '10分钟', time: '10分钟', seconds: 10 * 60 }
]

// 计算进度
const progress = computed(() => {
  if (initialCountdown.value === 0) return 100
  return Math.max(0, (countdown.value / initialCountdown.value) * 100)
})

// 格式化时间
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 格式化事件时间
const formatEventTime = (seconds) => {
  const days = Math.floor(seconds / (24 * 3600))
  const hours = Math.floor((seconds % (24 * 3600)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}天 ${hours}小时 ${minutes}分钟`
  if (hours > 0) return `${hours}小时 ${minutes}分钟`
  return `${minutes}分钟`
}

// 设置预设
const setPreset = (preset) => {
  countdown.value = preset.seconds
  initialCountdown.value = preset.seconds
  saveToHistory(preset.name, preset.time)
}

// 设置自定义时间
const setCustomTime = () => {
  const totalSeconds = customTime.value.hours * 3600 + customTime.value.minutes * 60 + customTime.value.seconds
  if (totalSeconds > 0) {
    countdown.value = totalSeconds
    initialCountdown.value = totalSeconds
    saveToHistory('自定义', formatTime(totalSeconds))
  }
}

// 从历史设置
const setFromHistory = (item) => {
  // 这里简化处理，实际应该保存原始秒数
  const [h, m, s] = item.time.split(':').map(Number)
  countdown.value = h * 3600 + m * 60 + s
  initialCountdown.value = countdown.value
}

// 保存到历史
const saveToHistory = (name, time) => {
  const exists = history.value.find(item => item.name === name && item.time === time)
  if (!exists) {
    history.value.unshift({ name, time })
    if (history.value.length > 10) {
      history.value = history.value.slice(0, 10)
    }
  }
}

// 开始倒计时
const start = () => {
  if (countdown.value <= 0) return

  isRunning.value = true
  isPaused.value = false

  interval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      complete()
    }
  }, 1000)
}

// 暂停
const pause = () => {
  isRunning.value = false
  isPaused.value = true
  if (interval) {
    clearInterval(interval)
  }
}

// 继续
const resume = () => {
  isRunning.value = true
  isPaused.value = false
  start()
}

// 重置
const reset = () => {
  isRunning.value = false
  isPaused.value = false
  currentLoop.value = 0
  if (interval) {
    clearInterval(interval)
  }
  countdown.value = initialCountdown.value
}

// 完成
const complete = () => {
  isRunning.value = false
  if (interval) {
    clearInterval(interval)
  }

  // 播放声音
  playSound()

  // 处理循环
  if (currentLoop.value > 0 && currentLoop.value < loopCount.value) {
    setTimeout(() => {
      currentLoop.value++
      countdown.value = initialCountdown.value
      start()
    }, loopInterval.value * 60 * 1000)
  } else {
    currentLoop.value = 0
  }
}

// 播放声音
const playSound = () => {
  if (selectedSound.value === 'none') return

  const audio = new Audio()
  const context = new AudioContext()

  if (selectedSound.value === 'beep') {
    // 创建哔哔声
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3
    oscillator.start()
    oscillator.stop(context.currentTime + 0.2)
  } else if (selectedSound.value === 'bell') {
    // 创建铃声
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(context.destination)
    oscillator.frequency.value = 1000
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3
    oscillator.start()
    oscillator.stop(context.currentTime + 0.5)
  } else if (selectedSound.value === 'alert') {
    // 创建警报声
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(context.destination)
        oscillator.frequency.value = 600
        oscillator.type = 'sawtooth'
        gainNode.gain.value = 0.2
        oscillator.start()
        oscillator.stop(context.currentTime + 0.3)
      }, i * 500)
    }
  }
}

// 计算事件倒计时
const calculateEventCountdown = () => {
  if (!eventDateTime.value) {
    eventCountdown.value = null
    return
  }

  const event = new Date(eventDateTime.value)
  const now = new Date()
  const diff = Math.floor((event - now) / 1000)

  if (diff > 0) {
    eventCountdown.value = diff

    // 启动实时更新
    if (eventInterval) {
      clearInterval(eventInterval)
    }
    eventInterval = setInterval(() => {
      const now = new Date()
      const diff = Math.floor((event - now) / 1000)
      if (diff <= 0) {
        eventCountdown.value = null
        clearInterval(eventInterval)
      } else {
        eventCountdown.value = diff
      }
    }, 1000)
  } else {
    eventCountdown.value = null
  }
}

// 开始循环
const startLoop = () => {
  if (countdown.value <= 0) return
  currentLoop.value = 1
  start()
}

// SEO配置
useSeoMeta({
  title: '倒计时器 - 在线倒计时工具',
  description: '免费在线倒计时工具，支持自定义时间、番茄工作法、循环倒计时等功能，精确到秒的实时倒计时。',
  keywords: ['倒计时', '计时器', '番茄工作法', '在线工具', '时间管理']
})



// 清理
onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
  if (eventInterval) {
    clearInterval(eventInterval)
  }
})
</script>