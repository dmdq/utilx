<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">跑步配速计算器</h1>
      <p class="text-muted-foreground">计算跑步配速、预计完成时间，支持多种距离单位，科学规划跑步训练</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和计算 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Footprints class="w-5 h-5 text-primary" />
            输入跑步数据
          </h2>

          <div class="space-y-4">
            <!-- 计算模式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">计算模式</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="mode = 'pace'"
                  :class="['p-2 rounded-lg text-sm transition-colors', mode === 'pace' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  配速→时间
                </button>
                <button
                  @click="mode = 'time'"
                  :class="['p-2 rounded-lg text-sm transition-colors', mode === 'time' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  时间→配速
                </button>
                <button
                  @click="mode = 'split'"
                  :class="['p-2 rounded-lg text-sm transition-colors', mode === 'split' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  分段配速
                </button>
              </div>
            </div>

            <!-- 距离选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">跑步距离</label>
              <div class="grid grid-cols-4 gap-2 mb-2">
                <button
                  v-for="dist in presetDistances"
                  :key="dist.value"
                  @click="distance = dist.value; distanceUnit = 'km'"
                  :class="['p-2 rounded-lg text-sm transition-colors', distance === dist.value && distanceUnit === 'km' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  {{ dist.label }}
                </button>
              </div>
              <div class="flex gap-2">
                <input
                  v-model.number="distance"
                  type="number"
                  step="0.01"
                  min="0.1"
                  class="flex-1 px-3 py-2 border border-border rounded-lg font-mono text-sm"
                  placeholder="自定义距离"
                >
                <select v-model="distanceUnit" class="px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="km">公里</option>
                  <option value="mile">英里</option>
                  <option value="m">米</option>
                </select>
              </div>
            </div>

            <!-- 配速输入 (模式1) -->
            <div v-if="mode === 'pace'">
              <label class="text-sm font-medium mb-2 block">跑步配速</label>
              <div class="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">分钟</label>
                  <input
                    v-model.number="paceMinutes"
                    type="number"
                    min="0"
                    max="30"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="分"
                  >
                </div>
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">秒</label>
                  <input
                    v-model.number="paceSeconds"
                    type="number"
                    min="0"
                    max="59"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="秒"
                  >
                </div>
              </div>
              <div class="flex gap-2">
                <select v-model="paceUnit" class="px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="km">每公里</option>
                  <option value="mile">每英里</option>
                </select>
                <button
                  @click="calculateFromPace"
                  class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                >
                  计算时间
                </button>
              </div>
            </div>

            <!-- 时间输入 (模式2) -->
            <div v-if="mode === 'time'">
              <label class="text-sm font-medium mb-2 block">完成时间</label>
              <div class="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">小时</label>
                  <input
                    v-model.number="timeHours"
                    type="number"
                    min="0"
                    max="23"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="时"
                  >
                </div>
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">分钟</label>
                  <input
                    v-model.number="timeMinutes"
                    type="number"
                    min="0"
                    max="59"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="分"
                  >
                </div>
                <div>
                  <label class="text-xs text-muted-foreground mb-1 block">秒</label>
                  <input
                    v-model.number="timeSeconds"
                    type="number"
                    min="0"
                    max="59"
                    class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                    placeholder="秒"
                  >
                </div>
              </div>
              <button
                @click="calculateFromTime"
                class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
              >
                计算配速
              </button>
            </div>

            <!-- 分段配速 (模式3) -->
            <div v-if="mode === 'split'">
              <label class="text-sm font-medium mb-2 block">分段距离</label>
              <div class="flex gap-2 mb-2">
                <input
                  v-model.number="splitDistance"
                  type="number"
                  step="0.1"
                  class="flex-1 px-3 py-2 border border-border rounded-lg font-mono text-sm"
                  placeholder="分段距离"
                >
                <select v-model="splitUnit" class="px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="km">公里</option>
                  <option value="mile">英里</option>
                  <option value="m">米</option>
                </select>
              </div>
              <label class="text-sm font-medium mb-2 block">分段完成时间</label>
              <div class="grid grid-cols-3 gap-2">
                <input
                  v-model.number="splitMin"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                  placeholder="分"
                >
                <input
                  v-model.number="splitSec"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-border rounded-lg font-mono text-sm"
                  placeholder="秒"
                >
              </div>
              <button
                @click="calculateSplit"
                class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm mt-2"
              >
                计算总时间
              </button>
            </div>
          </div>
        </div>

        <!-- 计算结果 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Timer class="w-5 h-5 text-green-500" />
            计算结果
          </h2>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border-2 border-primary/20">
              <p class="text-sm text-muted-foreground mb-1">完成时间</p>
              <p class="text-2xl font-bold text-primary">{{ result.totalTime }}</p>
            </div>
            <div class="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
              <p class="text-sm text-muted-foreground mb-1">平均配速</p>
              <p class="text-2xl font-bold text-purple-600">{{ result.avgPace }}</p>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 bg-muted rounded">
              <span class="text-muted-foreground">速度:</span>
              <span class="font-medium ml-2">{{ result.speed }} km/h</span>
            </div>
            <div class="p-2 bg-muted rounded">
              <span class="text-muted-foreground">消耗热量:</span>
              <span class="font-medium ml-2">~{{ result.calories }} kcal</span>
            </div>
          </div>

          <!-- 分段用时 -->
          <div v-if="result.splits && result.splits.length > 0" class="mt-4">
            <p class="text-sm font-medium mb-2">分段用时</p>
            <div class="space-y-1 max-h-48 overflow-y-auto">
              <div
                v-for="(split, index) in result.splits"
                :key="index"
                class="flex items-center justify-between p-2 bg-muted rounded text-sm"
              >
                <span>第 {{ index + 1 }} 段</span>
                <span class="font-mono">{{ split }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：参考数据 -->
      <div class="space-y-4">
        <!-- 配速参考 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常见目标配速</h2>

          <div class="space-y-2">
            <div class="p-3 bg-muted rounded">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">5公里 - 30分钟</span>
                <span class="text-xs font-mono">6:00/km</span>
              </div>
              <div class="w-full bg-background rounded-full h-2">
                <div class="bg-green-500 h-2 rounded-full" style="width: 60%"></div>
              </div>
            </div>
            <div class="p-3 bg-muted rounded">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">10公里 - 60分钟</span>
                <span class="text-xs font-mono">6:00/km</span>
              </div>
              <div class="w-full bg-background rounded-full h-2">
                <div class="bg-blue-500 h-2 rounded-full" style="width: 50%"></div>
              </div>
            </div>
            <div class="p-3 bg-muted rounded">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">半马 - 2小时</span>
                <span class="text-xs font-mono">5:41/km</span>
              </div>
              <div class="w-full bg-background rounded-full h-2">
                <div class="bg-orange-500 h-2 rounded-full" style="width: 40%"></div>
              </div>
            </div>
            <div class="p-3 bg-muted rounded">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-sm">全马 - 4小时</span>
                <span class="text-xs font-mono">5:41/km</span>
              </div>
              <div class="w-full bg-background rounded-full h-2">
                <div class="bg-red-500 h-2 rounded-full" style="width: 30%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 跑步等级 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">跑步等级参考</h2>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
              <span>精英</span>
              <span class="font-mono">&lt; 3:00/km</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span>高级</span>
              <span class="font-mono">3:00-4:00/km</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span>中级</span>
              <span class="font-mono">4:00-5:30/km</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <span>初级</span>
              <span class="font-mono">5:30-7:00/km</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
              <span>新手</span>
              <span class="font-mono">&gt; 7:00/km</span>
            </div>
          </div>
        </div>

        <!-- 使用技巧 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb class="w-5 h-5 text-yellow-500" />
            跑步技巧
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">配速控制</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>起跑时不要过快，保持均匀配速</li>
                <li>使用心率或体感监控强度</li>
                <li>负分割策略（后半程更快）更高效</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">训练建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>80%训练用轻松配速（E配速）</li>
                <li>20%训练用目标配速或更快</li>
                <li>每周安排1次长距离慢跑</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">比赛策略</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>提前熟悉赛道和配速表</li>
                <li>按公里配速分段执行</li>
                <li>预留体力用于最后冲刺</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 单位换算 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常用换算</h2>

          <div class="space-y-2 text-sm font-mono">
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>1 km</span>
              <span>= 0.6214 mile</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>1 mile</span>
              <span>= 1.6093 km</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>5 km</span>
              <span>= 3.107 miles</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>10 km</span>
              <span>= 6.214 miles</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>半马</span>
              <span>= 21.0975 km</span>
            </div>
            <div class="flex items-center justify-between p-2 bg-muted rounded">
              <span>全马</span>
              <span>= 42.195 km</span>
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
  Footprints,
  Timer,
  Lightbulb
} from 'lucide-vue-next'

const mode = ref('pace')
const distance = ref(5)
const distanceUnit = ref('km')

const paceMinutes = ref(5)
const paceSeconds = ref(30)
const paceUnit = ref('km')

const timeHours = ref(0)
const timeMinutes = ref(30)
const timeSeconds = ref(0)

const splitDistance = ref(1)
const splitUnit = ref('km')
const splitMin = ref(5)
const splitSec = ref(30)

const result = ref(null)

const presetDistances = [
  { label: '5K', value: 5 },
  { label: '10K', value: 10 },
  { label: '半马', value: 21.0975 },
  { label: '全马', value: 42.195 }
]

function calculateFromPace() {
  if (!distance.value || paceMinutes.value === null) return

  const paceInSeconds = paceMinutes.value * 60 + (paceSeconds.value || 0)
  const paceUnitKm = paceUnit.value === 'km' ? 1 : 1.6093

  const distanceInKm = distanceUnit.value === 'km' ? distance.value :
                      distanceUnit.value === 'mile' ? distance.value * 1.6093 :
                      distance.value / 1000

  const totalSeconds = (distanceInKm / paceUnitKm) * paceInSeconds
  const avgPacePerKm = totalSeconds / distanceInKm

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const avgPaceMin = Math.floor(avgPacePerKm / 60)
  const avgPaceSec = Math.floor(avgPacePerKm % 60)

  const speedKmH = (3600 / avgPacePerKm).toFixed(1)
  const calories = Math.round(distanceInKm * 60)

  result.value = {
    totalTime: `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    avgPace: `${avgPaceMin}:${avgPaceSec.toString().padStart(2, '0')}/km`,
    speed: speedKmH,
    calories,
    splits: generateSplits(distanceInKm, avgPacePerKm)
  }
}

function calculateFromTime() {
  if (!distance.value) return

  const totalSeconds = (timeHours.value || 0) * 3600 + (timeMinutes.value || 0) * 60 + (timeSeconds.value || 0)
  const distanceInKm = distanceUnit.value === 'km' ? distance.value :
                      distanceUnit.value === 'mile' ? distance.value * 1.6093 :
                      distance.value / 1000

  const avgPacePerKm = totalSeconds / distanceInKm
  const avgPaceMin = Math.floor(avgPacePerKm / 60)
  const avgPaceSec = Math.floor(avgPacePerKm % 60)

  const speedKmH = (3600 / avgPacePerKm).toFixed(1)
  const calories = Math.round(distanceInKm * 60)

  result.value = {
    totalTime: `${timeHours.value || 0}:${(timeMinutes.value || 0).toString().padStart(2, '0')}:${(timeSeconds.value || 0).toString().padStart(2, '0')}`,
    avgPace: `${avgPaceMin}:${avgPaceSec.toString().padStart(2, '0')}/km`,
    speed: speedKmH,
    calories,
    splits: generateSplits(distanceInKm, avgPacePerKm)
  }
}

function calculateSplit() {
  if (!distance.value || !splitDistance.value) return

  const splitSeconds = (splitMin.value || 0) * 60 + (splitSec.value || 0)
  const splitInKm = splitUnit.value === 'km' ? splitDistance.value :
                    splitUnit.value === 'mile' ? splitDistance.value * 1.6093 :
                    splitDistance.value / 1000

  const distanceInKm = distanceUnit.value === 'km' ? distance.value :
                      distanceUnit.value === 'mile' ? distance.value * 1.6093 :
                      distance.value / 1000

  const avgPacePerKm = splitSeconds / splitInKm
  const totalSeconds = avgPacePerKm * distanceInKm

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const avgPaceMin = Math.floor(avgPacePerKm / 60)
  const avgPaceSec = Math.floor(avgPacePerKm % 60)

  const speedKmH = (3600 / avgPacePerKm).toFixed(1)
  const calories = Math.round(distanceInKm * 60)

  result.value = {
    totalTime: `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    avgPace: `${avgPaceMin}:${avgPaceSec.toString().padStart(2, '0')}/km`,
    speed: speedKmH,
    calories,
    splits: generateSplits(distanceInKm, avgPacePerKm)
  }
}

function generateSplits(distanceInKm, pacePerKm) {
  const splits = []
  const numSplits = Math.floor(distanceInKm)

  for (let i = 0; i < numSplits; i++) {
    const splitSeconds = pacePerKm
    const min = Math.floor(splitSeconds / 60)
    const sec = Math.floor(splitSeconds % 60)
    splits.push(`${min}:${sec.toString().padStart(2, '0')}`)
  }

  return splits
}

useSeoMeta({
  title: '跑步配速计算器 - 在线跑步配速与时间计算工具',
  description: '免费在线跑步配速计算器，计算跑步配速、预计完成时间，支持5K/10K/半马/全马，科学规划跑步训练。',
  keywords: ['跑步配速', 'pace计算', '跑步时间', '马拉松', '5K', '10K', '跑步训练', '跑步计算器']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('跑步配速计算器')
</script>
