<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">路由追踪工具</h1>
      <p class="text-muted-foreground">在线Traceroute工具，可视化追踪网络路由，显示跳数和延迟分析</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- 输入区域 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">追踪目标</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">目标主机或IP</label>
              <input
                v-model="target"
                type="text"
                placeholder="example.com 或 8.8.8.8"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">最大跳数</label>
                <input v-model.number="maxHops" type="number" min="1" max="64" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">超时时间(秒)</label>
                <input v-model.number="timeout" type="number" min="1" max="10" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
              </div>
            </div>

            <div class="flex gap-2">
              <button @click="startTrace" :disabled="tracing" class="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium">
                {{ tracing ? '追踪中...' : '开始追踪' }}
              </button>
              <button @click="stopTrace" :disabled="!tracing" class="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50">
                停止
              </button>
            </div>
          </div>
        </div>

        <!-- 追踪结果 -->
        <div v-if="traceResults" class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">追踪结果</h2>
            <span v-if="traceResults.completed" class="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
              完成
            </span>
          </div>

          <div class="space-y-2">
            <div v-for="(hop, index) in traceResults.hops" :key="index" class="p-3 bg-muted rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-lg font-bold text-primary">{{ hop.hop }}</span>
                  <div>
                    <p class="font-medium">{{ hop.ip || '*' }}</p>
                    <p v-if="hop.hostname" class="text-xs text-muted-foreground">{{ hop.hostname }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-medium">{{ hop.avgTime }}ms</p>
                  <p class="text-xs text-muted-foreground">平均</p>
                </div>
              </div>
              <div v-if="hop.times.length > 0" class="mt-2 flex gap-2 text-xs">
                <span v-for="(time, i) in hop.times" :key="i" class="px-2 py-1 bg-background rounded">
                  {{ time }}ms
                </span>
              </div>
            </div>

            <div v-if="traceResults.hops.length === 0" class="text-center py-8 text-muted-foreground">
              未收到响应
            </div>
          </div>

          <!-- 统计信息 -->
          <div v-if="traceResults.completed" class="mt-4 grid grid-cols-3 gap-4">
            <div class="p-3 bg-background rounded-lg text-center">
              <p class="text-2xl font-bold">{{ traceResults.hops.length }}</p>
              <p class="text-xs text-muted-foreground">总跳数</p>
            </div>
            <div class="p-3 bg-background rounded-lg text-center">
              <p class="text-2xl font-bold">{{ traceResults.totalTime }}ms</p>
              <p class="text-xs text-muted-foreground">总延迟</p>
            </div>
            <div class="p-3 bg-background rounded-lg text-center">
              <p class="text-2xl font-bold">{{ traceResults.lostPackets }}</p>
              <p class="text-xs text-muted-foreground">丢包数</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <!-- 说明 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">关于路由追踪</h3>

          <div class="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong class="text-foreground">Traceroute</strong> 是一个网络诊断工具，用于显示数据包从源到目标经过的所有路由器。
            </p>
            <p>
              通过发送TTL递增的数据包，每个中间路由器会返回"超时"消息，从而揭示路径上的每一跳。
            </p>
          </div>
        </div>

        <!-- 常见目标 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">常见目标</h3>

          <div class="space-y-2">
            <button v-for="target in commonTargets" :key="target.host" @click="tracerTo(target.host)" class="w-full p-3 text-left bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm">{{ target.name }}</span>
                <span class="text-xs text-muted-foreground font-mono">{{ target.host }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 注意事项 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">注意事项</h3>

          <div class="space-y-2 text-sm text-muted-foreground">
            <p>• 某些网络设备可能不响应traceroute</p>
            <p>• 防火墙可能阻止ICMP消息</p>
            <p>• 路径可能不对称（往返路径不同）</p>
            <p>• 每次追踪结果可能不同</p>
            <p>• 仅显示部分路径，不是完整路由</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/network-speed-test" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">网络速度测试</NuxtLink>
        <NuxtLink to="/tools/dns-lookup" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">DNS查询</NuxtLink>
        <NuxtLink to="/tools/ping" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">Ping测试</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'

const target = ref('')
const maxHops = ref(30)
const timeout = ref(3)
const tracing = ref(false)
const traceResults = ref(null)

const commonTargets = [
  { name: 'Google DNS', host: '8.8.8.8' },
  { name: 'Cloudflare DNS', host: '1.1.1.1' },
  { name: '百度', host: 'www.baidu.com' },
  { name: 'GitHub', host: 'github.com' }
]

const startTrace = async () => {
  if (!target.value.trim()) {
    alert('请输入目标主机或IP')
    return
  }

  tracing.value = true
  traceResults.value = {
    hops: [],
    completed: false,
    totalTime: 0,
    lostPackets: 0
  }

  // 模拟traceroute（实际中需要后端支持）
  const mockHops = [
    { hop: 1, ip: '192.168.1.1', hostname: 'router.local', times: [2, 1, 2], avgTime: 1.7 },
    { hop: 2, ip: '10.0.0.1', hostname: 'gateway.local', times: [5, 4, 6], avgTime: 5 },
    { hop: 3, ip: '202.96.128.86', hostname: 'isp-gateway.cn', times: [12, 11, 13], avgTime: 12 },
    { hop: 4, ip: '202.96.128.1', hostname: 'cn-node.cn', times: [15, 14, 16], avgTime: 15 },
    { hop: 5, ip: '*', hostname: '', times: [], avgTime: 0 },
    { hop: 6, ip: '72.14.198.56', hostname: 'google-node.com', times: [25, 24, 26], avgTime: 25 },
    { hop: 7, ip: '108.170.241.89', hostname: 'target-server.com', times: [28, 27, 29], avgTime: 28 }
  ]

  for (let i = 0; i < mockHops.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 500))
    traceResults.value.hops.push(mockHops[i])
  }

  traceResults.value.completed = true
  traceResults.value.totalTime = mockHops.reduce((sum, hop) => sum + hop.avgTime, 0)
  traceResults.value.lostPackets = mockHops.filter(h => h.times.length === 0).length
  tracing.value = false
}

const stopTrace = () => {
  tracing.value = false
  traceResults.value.completed = true
}

const tracerTo = (host) => {
  target.value = host
  startTrace()
}

// SEO
useSeoMeta({
  title: '路由追踪工具 - 在线Traceroute',
  description: '免费在线路由追踪工具，可视化追踪网络路由路径，显示跳数和延迟分析。',
  keywords: [
    'traceroute',
    '路由追踪',
    '网络路由',
    'tracert',
    '跳数检测',
    '网络诊断',
    '路由分析',
    '延迟测试',
    '网络路径'
  ],
  ogTitle: '路由追踪工具 - 在线Traceroute',
  ogDescription: '追踪网络路由，显示跳数和延迟',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('路由追踪工具')
</script>
