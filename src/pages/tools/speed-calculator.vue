<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">速度计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">速度/时间/距离互转、单位换算、平均速度计算</p>
    </div>

    <!-- 计算模式切换 -->
    <div class="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="mode in calculationModes"
          :key="mode.id"
          @click="currentMode = mode.id"
          :class="[
            'px-4 py-2 rounded-lg transition',
            currentMode === mode.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          {{ mode.name }}
        </button>
      </div>
    </div>

    <!-- 计算速度模式 -->
    <div v-if="currentMode === 'speed'" class="grid md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入数据</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">距离</label>
            <div class="flex gap-2">
              <input
                v-model.number="distance"
                type="number"
                step="0.01"
                min="0"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="输入距离"
              >
              <select v-model="distanceUnit" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="km">公里</option>
                <option value="m">米</option>
                <option value="mile">英里</option>
                <option value="nmi">海里</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">时间</label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <input
                  v-model.number="hours"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="时"
                >
                <span class="text-xs text-gray-500">小时</span>
              </div>
              <div>
                <input
                  v-model.number="minutes"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="分"
                >
                <span class="text-xs text-gray-500">分钟</span>
              </div>
              <div>
                <input
                  v-model.number="seconds"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="秒"
                >
                <span class="text-xs text-gray-500">秒</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">计算结果</h2>

        <div v-if="isValidSpeed" class="space-y-3">
          <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">速度</p>
            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {{ speedKmh.toFixed(2) }} <span class="text-lg">km/h</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">米/秒</p>
              <p class="text-lg font-semibold">{{ speedMs.toFixed(2) }} m/s</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">英里/小时</p>
              <p class="text-lg font-semibold">{{ speedMph.toFixed(2) }} mph</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">节</p>
              <p class="text-lg font-semibold">{{ speedKnots.toFixed(2) }} kn</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">马赫 (海平面)</p>
              <p class="text-lg font-semibold">{{ speedMach.toFixed(3) }} Ma</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-gray-400">
          请输入有效的距离和时间
        </div>
      </div>
    </div>

    <!-- 计算时间模式 -->
    <div v-if="currentMode === 'time'" class="grid md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入数据</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">距离</label>
            <div class="flex gap-2">
              <input
                v-model.number="distance"
                type="number"
                step="0.01"
                min="0"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="输入距离"
              >
              <select v-model="distanceUnit" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="km">公里</option>
                <option value="m">米</option>
                <option value="mile">英里</option>
                <option value="nmi">海里</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">速度</label>
            <div class="flex gap-2">
              <input
                v-model.number="speed"
                type="number"
                step="0.01"
                min="0"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="输入速度"
              >
              <select v-model="speedUnit" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="kmh">km/h</option>
                <option value="ms">m/s</option>
                <option value="mph">mph</option>
                <option value="knots">节</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">所需时间</h2>

        <div v-if="isValidTime" class="space-y-3">
          <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">总时间</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              {{ formatTime(totalTimeSeconds) }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">小时</p>
              <p class="text-lg font-semibold">{{ timeHours.toFixed(1) }} h</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">分钟</p>
              <p class="text-lg font-semibold">{{ timeMinutes.toFixed(0) }} min</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-gray-400">
          请输入有效的距离和速度
        </div>
      </div>
    </div>

    <!-- 计算距离模式 -->
    <div v-if="currentMode === 'distance'" class="grid md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入数据</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">速度</label>
            <div class="flex gap-2">
              <input
                v-model.number="speed"
                type="number"
                step="0.01"
                min="0"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="输入速度"
              >
              <select v-model="speedUnit" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <option value="kmh">km/h</option>
                <option value="ms">m/s</option>
                <option value="mph">mph</option>
                <option value="knots">节</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">时间</label>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <input
                  v-model.number="hours"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="时"
                >
                <span class="text-xs text-gray-500">小时</span>
              </div>
              <div>
                <input
                  v-model.number="minutes"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="分"
                >
                <span class="text-xs text-gray-500">分钟</span>
              </div>
              <div>
                <input
                  v-model.number="seconds"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="秒"
                >
                <span class="text-xs text-gray-500">秒</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">计算结果</h2>

        <div v-if="isValidDistance" class="space-y-3">
          <div class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">距离</p>
            <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {{ distanceKm.toFixed(2) }} <span class="text-lg">km</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">米</p>
              <p class="text-lg font-semibold">{{ distanceM.toFixed(0) }} m</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">英里</p>
              <p class="text-lg font-semibold">{{ distanceMile.toFixed(2) }} mi</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">海里</p>
              <p class="text-lg font-semibold">{{ distanceNmi.toFixed(2) }} nmi</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1"> marathon</p>
              <p class="text-lg font-semibold">{{ (distanceKm / 42.195).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-gray-400">
          请输入有效的速度和时间
        </div>
      </div>
    </div>

    <!-- 单位换算参考 -->
    <div class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">速度单位换算参考</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p class="font-medium mb-1">1 km/h</p>
          <p class="text-gray-600 dark:text-gray-400">= 0.2778 m/s</p>
          <p class="text-gray-600 dark:text-gray-400">= 0.6214 mph</p>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p class="font-medium mb-1">1 m/s</p>
          <p class="text-gray-600 dark:text-gray-400">= 3.6 km/h</p>
          <p class="text-gray-600 dark:text-gray-400">= 2.2369 mph</p>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p class="font-medium mb-1">1 mph</p>
          <p class="text-gray-600 dark:text-gray-400">= 1.6093 km/h</p>
          <p class="text-gray-600 dark:text-gray-400">= 0.4470 m/s</p>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p class="font-medium mb-1">1 节</p>
          <p class="text-gray-600 dark:text-gray-400">= 1.852 km/h</p>
          <p class="text-gray-600 dark:text-gray-400">= 0.5144 m/s</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '速度计算器 - 时间距离速度换算',
  meta: [{ name: 'description', content: '在线速度计算器，支持速度/时间/距离互转计算。提供多种单位换算（km/h、m/s、mph、节），适用于跑步、驾车、航行等速度计算场景。' }],
  keywords: ['速度计算', '时间计算', '距离计算', '速度换算', '平均速度', '单位换算']
})

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
</script>
