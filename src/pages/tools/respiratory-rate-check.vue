<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">呼吸频率检测</h1>
      <p class="text-muted-foreground">测量呼吸频率，评估呼吸健康状况，发现异常呼吸模式</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：测量工具 -->
      <div class="space-y-4">
        <!-- 测量方式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wind class="w-5 h-5 text-primary" />
            测量方式
          </h2>

          <div class="grid grid-cols-2 gap-2">
            <button
              @click="mode = 'timer'"
              :class="['p-3 rounded-lg text-sm', mode === 'timer' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
            >
              计时测量
            </button>
            <button
              @click="mode = 'manual'"
              :class="['p-3 rounded-lg text-sm', mode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
            >
              手动输入
            </button>
          </div>
        </div>

        <!-- 计时测量 -->
        <div v-if="mode === 'timer'" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">计时测量</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">测量时长</label>
              <select v-model="duration" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option :value="15">15秒</option>
                <option :value="30">30秒</option>
                <option :value="60">60秒（推荐）</option>
              </select>
            </div>

            <div class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6 text-center">
              <p class="text-sm text-muted-foreground mb-2">{{ isRunning ? '正在计时...' : '准备开始' }}</p>
              <p class="text-5xl font-bold text-blue-600 mb-4">{{ displayTime }}</p>

              <div v-if="isRunning" class="mb-4">
                <p class="text-sm text-muted-foreground mb-2">每次呼吸按一下</p>
                <button
                  @click="countBreath"
                  class="px-8 py-4 bg-blue-500 text-white rounded-full text-2xl font-bold hover:bg-blue-600 active:scale-95 transition-all"
                >
                  {{ breathCount }}
                </button>
              </div>

              <div v-if="!isRunning && result" class="mb-4">
                <p class="text-lg">测量完成！</p>
                <p class="text-3xl font-bold text-primary">{{ result }} 次/分钟</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-if="!isRunning && !result"
                @click="startMeasurement"
                class="px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm"
              >
                开始测量
              </button>
              <button
                v-if="isRunning"
                @click="stopMeasurement"
                class="px-4 py-3 bg-red-500 text-white rounded-lg text-sm"
              >
                停止
              </button>
              <button
                v-if="!isRunning"
                @click="resetMeasurement"
                class="px-4 py-3 bg-muted rounded-lg text-sm"
              >
                重置
              </button>
            </div>
          </div>
        </div>

        <!-- 手动输入 -->
        <div v-if="mode === 'manual'" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">手动输入</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">观察时长</label>
              <select v-model="manualDuration" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option :value="15">15秒</option>
                <option :value="30">30秒</option>
                <option :value="60">60秒</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">呼吸次数</label>
              <input
                v-model.number="manualBreaths"
                type="number"
                class="w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="在此时间内记录的呼吸次数"
              >
            </div>

            <button
              @click="calculateManual"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              计算呼吸频率
            </button>
          </div>
        </div>

        <!-- 测量说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">测量说明</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">选择安静环境</p>
                <p class="text-muted-foreground">在安静、舒适的环境下测量，确保受测者处于放松状态</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">静坐休息</p>
                <p class="text-muted-foreground">测量前静坐休息至少5分钟，避免运动、情绪激动影响</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">观察胸腹部起伏</p>
                <p class="text-muted-foreground">观察胸部或腹部的起伏，一次完整的起伏算一次呼吸</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">避免干扰</p>
                <p class="text-muted-foreground">测量过程中不要说话、移动，保持自然呼吸状态</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">最佳测量时间</p>
                <p class="text-muted-foreground">早晨起床后或晚上睡觉前是最佳测量时间</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">测量记录</h2>
            <button @click="clearHistory" class="text-xs text-red-600 hover:underline">清空</button>
          </div>

          <div v-if="history.length === 0" class="text-center py-8 text-sm text-muted-foreground">
            暂无测量记录
          </div>

          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(record, index) in history"
              :key="index"
              class="flex items-center justify-between p-3 bg-muted rounded text-sm"
            >
              <div>
                <span class="font-medium">{{ record.rate }} 次/分钟</span>
                <p class="text-xs text-muted-foreground">{{ record.date }}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded" :class="getRateClass(record.rate)">
                {{ getRateText(record.rate) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：结果和参考 -->
      <div class="space-y-4">
        <!-- 当前结果 -->
        <div v-if="result" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity class="w-5 h-5 text-blue-500" />
            测量结果
          </h2>

          <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20 mb-4">
            <div class="text-center">
              <p class="text-sm text-muted-foreground mb-2">呼吸频率</p>
              <p class="text-5xl font-bold text-primary mb-2">{{ result }}</p>
              <p class="text-lg">次/分钟</p>
            </div>
          </div>

          <!-- 健康评估 -->
          <div class="p-4 rounded-lg" :class="getResultClass(result)">
            <div class="flex items-center gap-3">
              <component :is="getResultIcon(result)" class="w-6 h-6" />
              <div>
                <p class="font-medium">{{ getResultText(result) }}</p>
                <p class="text-sm">{{ getResultDescription(result) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 正常呼吸频率标准 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-500" />
            正常呼吸频率标准
          </h2>

          <div class="space-y-3">
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
              <p class="font-medium text-sm mb-2">成年人（静息状态）</p>
              <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-green-600">12-20</span>
                <span class="text-sm text-muted-foreground">次/分钟</span>
              </div>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p class="font-medium text-sm mb-2">儿童（6-12岁）</p>
              <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-blue-600">18-30</span>
                <span class="text-sm text-muted-foreground">次/分钟</span>
              </div>
            </div>

            <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p class="font-medium text-sm mb-2">幼儿（1-5岁）</p>
              <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-purple-600">22-34</span>
                <span class="text-sm text-muted-foreground">次/分钟</span>
              </div>
            </div>

            <div class="p-3 bg-pink-50 dark:bg-pink-900/20 rounded">
              <p class="font-medium text-sm mb-2">婴儿（&lt;1岁）</p>
              <div class="flex items-center justify-between">
                <span class="text-2xl font-bold text-pink-600">30-60</span>
                <span class="text-sm text-muted-foreground">次/分钟</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 异常呼吸 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">异常呼吸模式</h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">呼吸过缓</span>
                <span class="font-mono text-orange-600">&lt;12次/分</span>
              </div>
              <p class="text-muted-foreground text-xs">可能原因：睡眠、药物影响、心脏问题、甲状腺功能减退等</p>
            </div>

            <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">呼吸过快</span>
                <span class="font-mono text-orange-600">&gt;20次/分</span>
              </div>
              <p class="text-muted-foreground text-xs">可能原因：焦虑、运动、发热、贫血、肺部疾病等</p>
            </div>

            <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">严重异常</span>
                <span class="font-mono text-red-600">&lt;10或&gt;25次/分</span>
              </div>
              <p class="text-muted-foreground text-xs">建议及时就医检查，排除潜在健康问题</p>
            </div>
          </div>
        </div>

        <!-- 影响呼吸频率的因素 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">影响呼吸频率的因素</h2>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="p-2 bg-muted rounded text-center">
              <p class="font-medium">运动</p>
              <p class="text-xs text-muted-foreground">显著增加</p>
            </div>
            <div class="p-2 bg-muted rounded text-center">
              <p class="font-medium">情绪</p>
              <p class="text-xs text-muted-foreground">焦虑时加快</p>
            </div>
            <div class="p-2 bg-muted rounded text-center">
              <p class="font-medium">年龄</p>
              <p class="text-xs text-muted-foreground">儿童较快</p>
            </div>
            <div class="p-2 bg-muted rounded text-center">
              <p class="font-medium">海拔</p>
              <p class="text-xs text-muted-foreground">高海拔加快</p>
            </div>
            <div class="p-2 bg-muted rounded text-center">
              <p class="font-medium">体温</p>
              <p class="text-xs text-muted-foreground">发热时加快</p>
            </div>
            <div class="p-2 bg-muted rounded text-center">
              <p class="font-medium">药物</p>
              <p class="text-xs text-muted-foreground">某些药物减慢</p>
            </div>
            <div class="p-2 bg-muted rounded text-center">
              <p class="font-medium">体位</p>
              <p class="text-xs text-muted-foreground">卧位较慢</p>
            </div>
            <div class="p-2 bg-muted rounded text-center">
              <p class="font-medium">健康状况</p>
              <p class="text-xs text-muted-foreground">疾病时变化</p>
            </div>
          </div>
        </div>

        <!-- 健康建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">改善呼吸健康</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <Wind class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">腹式呼吸训练</p>
                <p class="text-muted-foreground">每天练习5-10分钟腹式呼吸，增强呼吸效率</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Wind class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">有氧运动</p>
                <p class="text-muted-foreground">规律的有氧运动可以改善肺功能，优化呼吸模式</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Wind class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">避免烟酒</p>
                <p class="text-muted-foreground">吸烟和过量饮酒会损害肺部健康，影响呼吸功能</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Wind class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p class="font-medium">保持良好姿势</p>
                <p class="text-muted-foreground">正确坐姿和站姿有助于肺部充分扩张</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 何时需要就医 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">何时需要就医</h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>静息呼吸频率持续低于10次/分钟或高于25次/分钟</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>出现呼吸困难、呼吸急促或胸痛</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>呼吸不规律，出现呼吸暂停</p>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p>伴有其他症状如发热、咳嗽、意识模糊等</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useSeoMeta } from '#app'
import { Wind, Activity, ClipboardList, CheckCircle, AlertTriangle, Check as CheckIcon, XCircle, AlertCircle } from 'lucide-vue-next'

const mode = ref('timer')
const duration = ref(60)
const manualDuration = ref(60)
const manualBreaths = ref(null)

const isRunning = ref(false)
const breathCount = ref(0)
const currentTime = ref(0)
const result = ref(null)
const history = ref([])

let timer = null

const displayTime = computed(() => {
  const seconds = duration.value - currentTime.value
  return `${seconds}秒`
})

function startMeasurement() {
  isRunning.value = true
  breathCount.value = 0
  currentTime.value = 0
  result.value = null

  timer = setInterval(() => {
    currentTime.value++
    if (currentTime.value >= duration.value) {
      stopMeasurement()
    }
  }, 1000)
}

function stopMeasurement() {
  isRunning.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  // 计算每分钟呼吸次数
  if (breathCount.value > 0) {
    const rate = Math.round((breathCount.value / duration.value) * 60)
    result.value = rate
    addToHistory(rate)
  }
}

function countBreath() {
  if (isRunning.value) {
    breathCount.value++
  }
}

function resetMeasurement() {
  isRunning.value = false
  breathCount.value = 0
  currentTime.value = 0
  result.value = null
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function calculateManual() {
  if (!manualBreaths.value || manualBreaths.value <= 0) {
    alert('请输入呼吸次数')
    return
  }

  const rate = Math.round((manualBreaths.value / manualDuration.value) * 60)
  result.value = rate
  addToHistory(rate)
}

function addToHistory(rate) {
  const now = new Date()
  const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
  history.value.unshift({ rate, date: dateStr })
  if (history.value.length > 10) {
    history.value.pop()
  }
}

function clearHistory() {
  history.value = []
}

function getRateClass(rate) {
  if (rate < 10 || rate > 25) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (rate < 12 || rate > 20) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
}

function getRateText(rate) {
  if (rate < 10 || rate > 25) return '异常'
  if (rate < 12 || rate > 20) return '注意'
  return '正常'
}

function getResultClass(rate) {
  if (rate < 10 || rate > 25) return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
  if (rate < 12 || rate > 20) return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
  return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
}

function getResultIcon(rate) {
  if (rate < 10 || rate > 25) return XCircle
  if (rate < 12 || rate > 20) return AlertCircle
  return CheckIcon
}

function getResultText(rate) {
  if (rate < 10) return '呼吸过缓'
  if (rate > 25) return '呼吸过快'
  if (rate < 12) return '呼吸频率偏低'
  if (rate > 20) return '呼吸频率偏高'
  return '呼吸频率正常'
}

function getResultDescription(rate) {
  if (rate < 10) return '呼吸频率过低，建议咨询医生'
  if (rate > 25) return '呼吸频率过高，可能存在健康问题'
  if (rate < 12) return '略低于正常范围，请注意观察'
  if (rate > 20) return '略高于正常范围，可能是生理因素导致'
  return '您的呼吸频率在正常范围内，请保持健康的生活方式'
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

useSeoMeta({
  title: '呼吸频率检测 - 在线呼吸频率测量工具',
  description: '免费在线呼吸频率检测工具，测量每分钟呼吸次数，评估呼吸健康状况，支持计时测量和手动输入。', keywords: ['呼吸频率', '呼吸次数', '呼吸检测', '呼吸健康', '肺功能', '呼吸测量', '在线检测']})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('呼吸频率检测')
</script>
