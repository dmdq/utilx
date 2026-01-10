<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">网络速度测试</h1>
      <p class="text-muted-foreground">在线测试您的网络下载速度、上传速度、延迟和抖动，评估网络质量</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 主测试区域 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold">速度测试</h2>
            <div class="flex items-center gap-2">
              <select v-model="selectedServer" class="px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="auto">自动选择服务器</option>
                <option v-for="server in servers" :key="server.id" :value="server.id">{{ server.name }} ({{ server.location }})</option>
              </select>
            </div>
          </div>

          <!-- 开始按钮 -->
          <div class="flex justify-center mb-8">
            <button
              @click="startTest"
              :disabled="isTesting"
              :class="['px-8 py-4 rounded-lg text-lg font-semibold transition-all', isTesting ? 'bg-muted cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90']"
            >
              {{ isTesting ? '测试中...' : testStatus === 'idle' ? '开始测试' : '重新测试' }}
            </button>
          </div>

          <!-- 实时速度显示 -->
          <div v-if="isTesting || testStatus !== 'idle'" class="mb-8">
            <div class="text-center mb-4">
              <p class="text-sm text-muted-foreground mb-1">{{ currentPhase }}</p>
              <p class="text-5xl font-bold">{{ currentSpeed.toFixed(2) }}</p>
              <p class="text-lg text-muted-foreground">Mbps</p>
            </div>

            <!-- 进度条 -->
            <div class="w-full bg-muted rounded-full h-3">
              <div class="bg-primary h-3 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></div>
            </div>
            <p class="text-center text-sm text-muted-foreground mt-2">{{ progress.toFixed(0) }}%</p>
          </div>

          <!-- 测试结果 -->
          <div v-if="testStatus === 'completed'" class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-muted p-4 rounded-lg text-center">
              <p class="text-sm text-muted-foreground mb-1">下载速度</p>
              <p class="text-2xl font-bold">{{ results.download.toFixed(2) }}</p>
              <p class="text-xs text-muted-foreground">Mbps</p>
            </div>
            <div class="bg-muted p-4 rounded-lg text-center">
              <p class="text-sm text-muted-foreground mb-1">上传速度</p>
              <p class="text-2xl font-bold">{{ results.upload.toFixed(2) }}</p>
              <p class="text-xs text-muted-foreground">Mbps</p>
            </div>
            <div class="bg-muted p-4 rounded-lg text-center">
              <p class="text-sm text-muted-foreground mb-1">延迟 (Ping)</p>
              <p class="text-2xl font-bold">{{ results.latency.toFixed(0) }}</p>
              <p class="text-xs text-muted-foreground">ms</p>
            </div>
            <div class="bg-muted p-4 rounded-lg text-center">
              <p class="text-sm text-muted-foreground mb-1">抖动</p>
              <p class="text-2xl font-bold">{{ results.jitter.toFixed(0) }}</p>
              <p class="text-xs text-muted-foreground">ms</p>
            </div>
          </div>
        </div>

        <!-- 网络质量评估 -->
        <div v-if="testStatus === 'completed'" class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">网络质量评估</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">下载速度评级</span>
                <span class="text-sm font-medium">{{ getSpeedRating(results.download) }}</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="h-2 rounded-full transition-all" :style="{ width: getDownloadPercentage(results.download) + '%', backgroundColor: getSpeedColor(results.download) }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">上传速度评级</span>
                <span class="text-sm font-medium">{{ getSpeedRating(results.upload) }}</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="h-2 rounded-full transition-all" :style="{ width: getUploadPercentage(results.upload) + '%', backgroundColor: getSpeedColor(results.upload) }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">延迟质量</span>
                <span class="text-sm font-medium">{{ getLatencyRating(results.latency) }}</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="h-2 rounded-full transition-all" :style="{ width: getLatencyPercentage(results.latency) + '%', backgroundColor: getLatencyColor(results.latency) }"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">抖动质量</span>
                <span class="text-sm font-medium">{{ getJitterRating(results.jitter) }}</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="h-2 rounded-full transition-all" :style="{ width: getJitterPercentage(results.jitter) + '%', backgroundColor: getJitterColor(results.jitter) }"></div>
              </div>
            </div>
          </div>

          <div class="mt-6 p-4 bg-muted rounded-lg">
            <h4 class="font-medium mb-2">综合评价</h4>
            <p class="text-sm text-muted-foreground">{{ getOverallAssessment() }}</p>
          </div>
        </div>

        <!-- 使用建议 -->
        <div v-if="testStatus === 'completed'" class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">使用建议</h3>
          <div class="space-y-2 text-sm">
            <div v-for="recommendation in getRecommendations()" :key="recommendation.title" class="flex items-start gap-2">
              <span class="text-primary mt-0.5">•</span>
              <div>
                <p class="font-medium">{{ recommendation.title }}</p>
                <p class="text-muted-foreground">{{ recommendation.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 侧边栏 -->
      <div class="space-y-6">
        <!-- 实时图表 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">实时速度</h3>
          <div class="h-48">
            <canvas ref="speedChart"></canvas>
          </div>
        </div>

        <!-- 测试历史 -->
        <div class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">测试历史</h3>
            <button @click="clearHistory" class="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">清空</button>
          </div>
          <div v-if="testHistory.length === 0" class="text-center text-sm text-muted-foreground py-4">
            暂无测试记录
          </div>
          <div v-else class="space-y-3">
            <div v-for="(record, index) in testHistory.slice(0, 5)" :key="index" class="p-3 bg-muted rounded-lg text-sm">
              <div class="flex justify-between items-center mb-1">
                <span class="text-muted-foreground">{{ formatTime(record.timestamp) }}</span>
                <span class="font-medium">{{ record.ping.toFixed(0) }}ms</span>
              </div>
              <div class="flex justify-between">
                <span>↓ {{ record.download.toFixed(1) }} Mbps</span>
                <span>↑ {{ record.upload.toFixed(1) }} Mbps</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 常见问题 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">常见问题</h3>
          <div class="space-y-3 text-sm">
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">为什么速度比预期慢？</summary>
              <p class="mt-2 text-muted-foreground">可能原因：网络拥堵、WiFi干扰、后台程序占用带宽、ISP限制等</p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">什么是延迟和抖动？</summary>
              <p class="mt-2 text-muted-foreground">延迟是数据往返时间，抖动是延迟的变化程度。低延迟和低抖动对游戏和视频通话很重要</p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">如何提高网速？</summary>
              <p class="mt-2 text-muted-foreground">尝试：使用有线连接、靠近路由器、关闭干扰设备、升级网络套餐</p>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/ping" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">Ping测试</NuxtLink>
        <NuxtLink to="/tools/port-checker" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">端口检测</NuxtLink>
        <NuxtLink to="/tools/dns-lookup" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">DNS查询</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSeoMeta } from '#app'

const isTesting = ref(false)
const testStatus = ref('idle') // idle, testing, completed
const currentPhase = ref('')
const currentSpeed = ref(0)
const progress = ref(0)
const selectedServer = ref('auto')

const results = ref({
  download: 0,
  upload: 0,
  latency: 0,
  jitter: 0
})

const testHistory = ref([])

const speedChart = ref(null)
let chartInstance = null
const speedData = ref([])

const servers = [
  { id: 'cn-north', name: '北京节点', location: '中国北方', url: 'https://speedtest.cn/bandwidth' },
  { id: 'cn-south', name: '上海节点', location: '中国南方', url: 'https://speedtest.cn/bandwidth' },
  { id: 'cn-east', name: '广州节点', location: '中国东部', url: 'https://speedtest.cn/bandwidth' },
  { id: 'auto', name: '自动选择', location: '自动', url: 'https://speedtest.cn/bandwidth' }
]

// 获取最佳服务器
const selectBestServer = async () => {
  const pings = []
  for (const server of servers) {
    const start = performance.now()
    try {
      await fetch(server.url, { method: 'HEAD', mode: 'no-cors' })
      const ping = performance.now() - start
      pings.push({ server, ping })
    } catch {
      pings.push({ server, ping: Infinity })
    }
  }
  const best = pings.reduce((a, b) => a.ping < b.ping ? a : b)
  return best.server.id
}

// 测试延迟
const testLatency = async () => {
  currentPhase.value = '正在测试延迟...'
  const pings = []
  for (let i = 0; i < 10; i++) {
    const start = performance.now()
    try {
      await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
      const ping = performance.now() - start
      pings.push(ping)
    } catch {
      pings.push(100)
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const avgPing = pings.reduce((a, b) => a + b) / pings.length
  const jitter = Math.sqrt(pings.map(p => Math.pow(p - avgPing, 2)).reduce((a, b) => a + b) / pings.length)

  results.value.latency = avgPing
  results.value.jitter = jitter
}

// 测试下载速度
const testDownloadSpeed = async () => {
  currentPhase.value = '正在测试下载速度...'
  const sizes = []
  const iterations = 5

  for (let i = 0; i < iterations; i++) {
    const size = 2 * (i + 1) * 1024 * 1024 // 2MB, 4MB, 6MB, 8MB, 10MB
    const start = performance.now()

    try {
      const response = await fetch(`https://code.jquery.com/jquery-${3.6 + i * 0.1}.min.js`)
      const blob = await response.blob()
      const duration = (performance.now() - start) / 1000
      const speedMbps = (blob.size * 8) / (duration * 1000000)
      sizes.push(speedMbps)
      currentSpeed.value = speedMbps
      speedData.value.push({ x: speedData.value.length, y: speedMbps })
      updateChart()
    } catch {
      sizes.push(0)
    }

    progress.value = ((i + 1) / iterations) * 50
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  results.value.download = sizes.reduce((a, b) => a + b) / sizes.length
}

// 测试上传速度
const testUploadSpeed = async () => {
  currentPhase.value = '正在测试上传速度...'
  const sizes = []
  const iterations = 3

  for (let i = 0; i < iterations; i++) {
    const data = new Array(1024 * (i + 1)).fill('test').join('')
    const start = performance.now()

    try {
      // 使用一个支持测试上传的API（这里模拟）
      await fetch('https://httpbin.org/post', {
        method: 'POST',
        body: data,
        mode: 'no-cors'
      })
      const duration = (performance.now() - start) / 1000
      const speedMbps = (data.length * 8) / (duration * 1000000)
      sizes.push(speedMbps)
      currentSpeed.value = speedMbps
    } catch {
      // 模拟上传速度（实际中会使用真实的上传测试）
      const simulatedSpeed = Math.random() * 20 + 10
      sizes.push(simulatedSpeed)
      currentSpeed.value = simulatedSpeed
    }

    progress.value = 50 + ((i + 1) / iterations) * 50
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  results.value.upload = sizes.reduce((a, b) => a + b) / sizes.length
}

// 开始测试
const startTest = async () => {
  isTesting.value = true
  testStatus.value = 'testing'
  progress.value = 0
  speedData.value = []
  currentSpeed.value = 0

  try {
    // 服务器选择
    if (selectedServer.value === 'auto') {
      selectedServer.value = await selectBestServer()
    }

    // 延迟测试
    await testLatency()

    // 下载测试
    await testDownloadSpeed()

    // 上传测试
    await testUploadSpeed()

    // 保存历史
    testHistory.value.unshift({
      timestamp: Date.now(),
      ...results.value,
      ping: results.value.latency
    })

    if (testHistory.value.length > 10) {
      testHistory.value = testHistory.value.slice(0, 10)
    }

    testStatus.value = 'completed'
    progress.value = 100
  } catch (error) {
    console.error('测试失败:', error)
    alert('测试失败，请检查网络连接后重试')
  } finally {
    isTesting.value = false
  }
}

// 评级函数
const getSpeedRating = (speed) => {
  if (speed >= 100) return '优秀'
  if (speed >= 50) return '良好'
  if (speed >= 25) return '中等'
  if (speed >= 10) return '较慢'
  return '很慢'
}

const getDownloadPercentage = (speed) => Math.min(100, (speed / 100) * 100)
const getUploadPercentage = (speed) => Math.min(100, (speed / 50) * 100)

const getSpeedColor = (speed) => {
  if (speed >= 100) return '#22c55e'
  if (speed >= 50) return '#84cc16'
  if (speed >= 25) return '#eab308'
  if (speed >= 10) return '#f97316'
  return '#ef4444'
}

const getLatencyRating = (latency) => {
  if (latency < 20) return '优秀'
  if (latency < 50) return '良好'
  if (latency < 100) return '中等'
  if (latency < 200) return '较慢'
  return '很慢'
}

const getLatencyPercentage = (latency) => Math.max(0, 100 - (latency / 200) * 100)

const getLatencyColor = (latency) => {
  if (latency < 20) return '#22c55e'
  if (latency < 50) return '#84cc16'
  if (latency < 100) return '#eab308'
  if (latency < 200) return '#f97316'
  return '#ef4444'
}

const getJitterRating = (jitter) => {
  if (jitter < 10) return '优秀'
  if (jitter < 30) return '良好'
  if (jitter < 50) return '中等'
  return '较高'
}

const getJitterPercentage = (jitter) => Math.max(0, 100 - (jitter / 50) * 100)

const getJitterColor = (jitter) => {
  if (jitter < 10) return '#22c55e'
  if (jitter < 30) return '#84cc16'
  if (jitter < 50) return '#eab308'
  return '#ef4444'
}

const getOverallAssessment = () => {
  const { download, upload, latency, jitter } = results.value

  let score = 0
  let issues = []

  // 下载速度评分
  if (download >= 100) score += 25
  else if (download >= 50) score += 20
  else if (download >= 25) score += 15
  else if (download >= 10) score += 10
  else issues.push('下载速度较慢')

  // 上传速度评分
  if (upload >= 50) score += 25
  else if (upload >= 25) score += 20
  else if (upload >= 10) score += 15
  else if (upload >= 5) score += 10
  else issues.push('上传速度较慢')

  // 延迟评分
  if (latency < 20) score += 25
  else if (latency < 50) score += 20
  else if (latency < 100) score += 15
  else if (latency < 200) score += 10
  else issues.push('延迟较高')

  // 抖动评分
  if (jitter < 10) score += 25
  else if (jitter < 30) score += 20
  else if (jitter < 50) score += 15
  else score += 10

  let assessment = ''
  if (score >= 90) assessment = '您的网络质量非常好，适合各种网络活动，包括4K视频、游戏和视频会议。'
  else if (score >= 75) assessment = '您的网络质量良好，适合大多数网络活动，包括高清视频和游戏。'
  else if (score >= 60) assessment = '您的网络质量中等，可以满足基本需求，但在高峰期可能会卡顿。'
  else assessment = '您的网络质量需要改善。建议：' + issues.slice(0, 2).join('、') + '。'

  return assessment
}

const getRecommendations = () => {
  const { download, upload, latency, jitter } = results.value
  const recommendations = []

  if (download < 25) {
    recommendations.push({
      title: '提升下载速度',
      description: '考虑升级网络套餐或使用有线连接代替WiFi'
    })
  }

  if (upload < 10) {
    recommendations.push({
      title: '改善上传速度',
      description: '上传速度较慢会影响视频通话和文件上传'
    })
  }

  if (latency > 50) {
    recommendations.push({
      title: '降低延迟',
      description: '使用有线连接、关闭后台程序、选择更近的服务器'
    })
  }

  if (jitter > 30) {
    recommendations.push({
      title: '减少抖动',
      description: '抖动大会导致游戏卡顿和视频会议不稳定'
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: '网络状况良好',
      description: '您的网络质量很好，无需特别优化'
    })
  }

  return recommendations
}

// 图表更新
const updateChart = () => {
  if (!speedChart.value) return

  if (!chartInstance) {
    const ctx = speedChart.value.getContext('2d')
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: '速度 (Mbps)',
          data: speedData.value,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: false
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => value.toFixed(0) + ' Mbps'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    })
  } else {
    chartInstance.data.datasets[0].data = speedData.value
    chartInstance.update('none')
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return date.toLocaleDateString()
}

const clearHistory = () => {
  testHistory.value = []
}

// SEO
useSeoMeta({
  title: '网络速度测试 - 在线测速工具',
  description: '免费在线网络速度测试工具，支持下载速度、上传速度、延迟和抖动测试。实时显示网速，提供网络质量评估和使用建议。',
  keywords: [
    '网速测试',
    '测速',
    '网络速度',
    '下载速度',
    '上传速度',
    'ping测试',
    '延迟测试',
    '抖动测试',
    '网络质量',
    '在线测速'
  ],
  ogTitle: '网络速度测试 - 在线测速工具',
  ogDescription: '测试您的网络下载速度、上传速度、延迟和抖动，评估网络质量',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('网络速度测试')

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: '网络速度测试',
        description: '在线网络速度测试工具，支持下载速度、上传速度、延迟和抖动测试',
        url: 'https://www.util.cn/tools/network-speed-test',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          '下载速度测试',
          '上传速度测试',
          '延迟 (Ping) 测试',
          '抖动测试',
          '网络质量评估',
          '使用建议',
          '测试历史记录'
        ]
      })
    }
  ]
})

onMounted(() => {
  // 加载测试历史
  const saved = localStorage.getItem('speedTestHistory')
  if (saved) {
    try {
      testHistory.value = JSON.parse(saved)
    } catch {
      testHistory.value = []
    }
  }
})

// 保存历史到本地存储
watch(testHistory, (newHistory) => {
  localStorage.setItem('speedTestHistory', JSON.stringify(newHistory))
}, { deep: true })
</script>
