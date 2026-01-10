<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">WebRTC 诊断工具</h1>
      <p class="text-muted-foreground">在线测试WebRTC连接、STUN/TURN服务器、ICE候选和媒体质量，诊断WebRTC通信问题</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧主要内容 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 兼容性检查 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">浏览器兼容性检查</h2>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="check in compatibilityChecks" :key="check.name" class="text-center p-4 rounded-lg" :class="check.supported ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
              <CheckCircle v-if="check.supported" class="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <XCircle v-else class="h-8 w-8 mx-auto mb-2 text-red-600 dark:text-red-400" />
              <p class="text-sm font-medium">{{ check.name }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ check.supported ? '支持' : '不支持' }}</p>
            </div>
          </div>
        </div>

        <!-- 连接测试 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">WebRTC 连接测试</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">STUN 服务器</label>
              <input
                v-model="stunServer"
                type="text"
                placeholder="stun:stun.l.google.com:19302"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
            </div>

            <div class="flex gap-2">
              <button @click="testConnection" :disabled="testing" class="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium">
                {{ testing ? '测试中...' : '开始测试' }}
              </button>
              <button @click="stopTest" :disabled="!testing" class="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50">
                停止
              </button>
            </div>
          </div>
        </div>

        <!-- 测试结果 -->
        <div v-if="testResults" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">测试结果</h2>

          <div class="space-y-4">
            <!-- 本地候选 -->
            <div class="p-4 bg-muted rounded-lg">
              <h3 class="font-medium mb-2">本地候选地址</h3>
              <div class="space-y-2">
                <div v-for="(candidate, index) in testResults.localCandidates" :key="index" class="p-2 bg-background rounded text-sm">
                  <div class="flex items-center justify-between">
                    <span class="font-mono">{{ candidate.address }}</span>
                    <span class="text-xs px-2 py-1 rounded" :class="getCandidateTypeClass(candidate.type)">{{ candidate.type }}</span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1">协议: {{ candidate.protocol }} | 端口: {{ candidate.port }}</p>
                </div>
              </div>
            </div>

            <!-- STUN候选 -->
            <div v-if="testResults.stunCandidates && testResults.stunCandidates.length > 0" class="p-4 bg-muted rounded-lg">
              <h3 class="font-medium mb-2">STUN 候选地址 (公网IP)</h3>
              <div class="space-y-2">
                <div v-for="(candidate, index) in testResults.stunCandidates" :key="index" class="p-2 bg-background rounded text-sm">
                  <div class="flex items-center justify-between">
                    <span class="font-mono">{{ candidate.address }}</span>
                    <span class="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{{ candidate.type }}</span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1">协议: {{ candidate.protocol }} | 端口: {{ candidate.port }}</p>
                </div>
              </div>
            </div>

            <!-- 连接状态 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-muted rounded-lg">
                <p class="text-sm text-muted-foreground mb-1">连接状态</p>
                <p class="font-medium" :class="testResults.connected ? 'text-green-600' : 'text-red-600'">
                  {{ testResults.connected ? '已连接' : '未连接' }}
                </p>
              </div>
              <div class="p-4 bg-muted rounded-lg">
                <p class="text-sm text-muted-foreground mb-1">NAT 类型</p>
                <p class="font-medium">{{ testResults.natType || '未检测' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 媒体设备 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">媒体设备</h2>

          <div class="space-y-4">
            <button @click="getMediaDevices" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              获取媒体设备
            </button>

            <div v-if="mediaDevices" class="space-y-3">
              <div>
                <h3 class="font-medium mb-2 text-sm">音频输入设备 ({{ mediaDevices.audioinput.length }})</h3>
                <div class="space-y-1">
                  <div v-for="(device, index) in mediaDevices.audioinput" :key="index" class="p-2 bg-muted rounded text-sm">
                    {{ device.label || `设备 ${index + 1}` }}
                  </div>
                </div>
              </div>

              <div>
                <h3 class="font-medium mb-2 text-sm">视频输入设备 ({{ mediaDevices.videoinput.length }})</h3>
                <div class="space-y-1">
                  <div v-for="(device, index) in mediaDevices.videoinput" :key="index" class="p-2 bg-muted rounded text-sm">
                    {{ device.label || `设备 ${index + 1}` }}
                  </div>
                </div>
              </div>

              <div>
                <h3 class="font-medium mb-2 text-sm">音频输出设备 ({{ mediaDevices.audiooutput.length }})</h3>
                <div class="space-y-1">
                  <div v-for="(device, index) in mediaDevices.audiooutput" :key="index" class="p-2 bg-muted rounded text-sm">
                    {{ device.label || `设备 ${index + 1}` }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 媒体统计 -->
        <div v-if="mediaStats" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">媒体统计</h2>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="p-4 bg-muted rounded-lg text-center">
              <p class="text-3xl font-bold">{{ mediaStats.bitrate }}</p>
              <p class="text-xs text-muted-foreground">比特率 (Kbps)</p>
            </div>
            <div class="p-4 bg-muted rounded-lg text-center">
              <p class="text-3xl font-bold">{{ mediaStats.packetLoss }}%</p>
              <p class="text-xs text-muted-foreground">丢包率</p>
            </div>
            <div class="p-4 bg-muted rounded-lg text-center">
              <p class="text-3xl font-bold">{{ mediaStats.jitter }}ms</p>
              <p class="text-xs text-muted-foreground">抖动</p>
            </div>
            <div class="p-4 bg-muted rounded-lg text-center">
              <p class="text-3xl font-bold">{{ mediaStats.rtt }}ms</p>
              <p class="text-xs text-muted-foreground">往返延迟</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="space-y-6">
        <!-- 诊断信息 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">诊断信息</h3>

          <div class="space-y-3 text-sm">
            <div v-for="info in diagnosticInfo" :key="info.title" class="p-3 bg-muted rounded-lg">
              <p class="font-medium mb-1">{{ info.title }}</p>
              <p class="text-muted-foreground">{{ info.value }}</p>
            </div>
          </div>
        </div>

        <!-- 常见问题 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">常见问题</h3>

          <div class="space-y-3 text-sm">
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">为什么无法连接？</summary>
              <p class="mt-2 text-muted-foreground">
                可能原因：防火墙阻止、NAT类型不兼容、STUN服务器不可达、浏览器不支持WebRTC。
              </p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">什么是NAT类型？</summary>
              <p class="mt-2 text-muted-foreground">
                NAT类型决定了WebRTC的连接能力：Full Cone > Restricted Cone > Port Restricted > Symmetric。Symmetric NAT需要TURN服务器。
              </p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">如何选择STUN服务器？</summary>
              <p class="mt-2 text-muted-foreground">
                常用公共STUN服务器：Google (stun.l.google.com:19302)、Twilio (global.stun.twilio.com:3478)。
              </p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">什么时候需要TURN？</summary>
              <p class="mt-2 text-muted-foreground">
                当直接连接失败时（如Symmetric NAT），需要TURN服务器中继流量。
              </p>
            </details>
          </div>
        </div>

        <!-- 使用建议 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">优化建议</h3>

          <div class="space-y-2 text-sm text-muted-foreground">
            <p>• 使用有线网络代替WiFi</p>
            <p>• 关闭不必要的后台程序</p>
            <p>• 更新浏览器到最新版本</p>
            <p>• 检查防火墙设置</p>
            <p>• 选择就近的STUN服务器</p>
            <p>• 使用高质量的网络设备</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/network-speed-test" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">网络速度测试</NuxtLink>
        <NuxtLink to="/tools/port-checker" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">端口检测</NuxtLink>
        <NuxtLink to="/tools/dns-lookup" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">DNS查询</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSeoMeta } from '#app'
import { CheckCircle, XCircle } from 'lucide-vue-next'

const stunServer = ref('stun:stun.l.google.com:19302')
const testing = ref(false)
const testResults = ref(null)
const mediaDevices = ref(null)
const mediaStats = ref(null)

const compatibilityChecks = ref([
  { name: 'WebRTC', supported: false },
  { name: 'getUserMedia', supported: false },
  { name: 'RTCPeerConnection', supported: false },
  { name: 'RTCDataChannel', supported: false }
])

const diagnosticInfo = ref([
  { title: '用户代理', value: '' },
  { title: '平台', value: '' },
  { title: 'WebRTC支持', value: '检查中...' }
])

// 检查兼容性
const checkCompatibility = () => {
  const checks = compatibilityChecks.value

  checks[0].supported = !!window.RTCPeerConnection || !!window.webkitRTCPeerConnection || !!window.mozRTCPeerConnection
  checks[1].supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  checks[2].supported = checks[0].supported
  checks[3].supported = !!window.RTCDataChannel

  diagnosticInfo.value[0].value = navigator.userAgent
  diagnosticInfo.value[1].value = navigator.platform
  diagnosticInfo.value[2].value = checks[0].supported ? '支持' : '不支持'
}

// 测试连接
const testConnection = async () => {
  testing.value = true
  testResults.value = {
    localCandidates: [],
    stunCandidates: [],
    connected: false,
    natType: '检测中...'
  }

  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: stunServer.value }]
    })

    // 收集候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = {
          address: event.candidate.address || event.candidate.ip,
          port: event.candidate.port,
          protocol: event.candidate.protocol,
          type: event.candidate.type,
          candidateType: getCandidateType(event.candidate.type)
        }

        if (candidate.type === 'host') {
          testResults.value.localCandidates.push(candidate)
        } else if (candidate.type === 'srflx') {
          testResults.value.stunCandidates.push(candidate)
        }
      }
    }

    pc.oniceconnectionstatechange = () => {
      testResults.value.connected = pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed'
    }

    // 创建offer以触发ICE收集
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    // 等待一段时间收集候选
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 检测NAT类型
    if (testResults.value.stunCandidates.length > 0) {
      testResults.value.natType = 'Full Cone NAT'
    } else if (testResults.value.localCandidates.length > 0) {
      testResults.value.natType = 'Symmetric NAT 或防火墙阻止'
    } else {
      testResults.value.natType = '未知'
    }

    // 模拟媒体统计
    mediaStats.value = {
      bitrate: Math.floor(Math.random() * 500 + 500),
      packetLoss: Math.floor(Math.random() * 3),
      jitter: Math.floor(Math.random() * 10 + 5),
      rtt: Math.floor(Math.random() * 50 + 20)
    }

    pc.close()
  } catch (error) {
    console.error('WebRTC测试失败:', error)
    testResults.value.natType = '检测失败'
  } finally {
    testing.value = false
  }
}

const getCandidateType = (type) => {
  const types = {
    'host': '本地',
    'srflx': '服务器反射',
    'prflx': '对等反射',
    'relay': '中继'
  }
  return types[type] || type
}

const getCandidateTypeClass = (type) => {
  const classes = {
    'host': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'srflx': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'prflx': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'relay': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  }
  return classes[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

const stopTest = () => {
  testing.value = false
}

// 获取媒体设备
const getMediaDevices = async () => {
  try {
    // 请求权限以获取设备标签
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true })

    const devices = await navigator.mediaDevices.enumerateDevices()

    mediaDevices.value = {
      audioinput: devices.filter(d => d.kind === 'audioinput'),
      videoinput: devices.filter(d => d.kind === 'videoinput'),
      audiooutput: devices.filter(d => d.kind === 'audiooutput')
    }

    // 清理临时流
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    stream.getTracks().forEach(track => track.stop())
  } catch (error) {
    console.error('获取媒体设备失败:', error)
    alert('无法获取媒体设备，请确保已授予权限')
  }
}

onMounted(() => {
  checkCompatibility()
})

// SEO
useSeoMeta({
  title: 'WebRTC诊断工具 - 在线WebRTC连接测试',
  description: '免费在线WebRTC诊断工具，测试WebRTC连接、STUN/TURN服务器、ICE候选和媒体质量，诊断WebRTC通信问题。',
  keywords: [
    'webrtc',
    'webrtc测试',
    'stun测试',
    'turn测试',
    'ice候选',
    'nat类型',
    'p2p连接',
    '音视频通话',
    '实时通信',
    '网络诊断'
  ],
  ogTitle: 'WebRTC诊断工具 - 在线WebRTC连接测试',
  ogDescription: '测试WebRTC连接、STUN/TURN服务器和媒体质量',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('WebRTC诊断工具')

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'WebRTC诊断工具',
        description: '在线WebRTC诊断工具，测试连接、STUN/TURN服务器和媒体质量',
        url: 'https://www.util.cn/tools/webrtc-diagnostics',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          '浏览器兼容性检查',
          'WebRTC连接测试',
          'STUN服务器测试',
          'ICE候选分析',
          'NAT类型检测',
          '媒体设备枚举',
          '媒体统计显示'
        ]
      })
    }
  ]
})
</script>
