<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">User-Agent生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成各浏览器和设备的User-Agent字符串</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1">浏览器</label>
          <select v-model="selectedBrowser" @change="generateUA" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            <option v-for="browser in browsers" :key="browser.id" :value="browser.id">{{ browser.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">操作系统</label>
          <select v-model="selectedOS" @change="generateUA" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            <option v-for="os in operatingSystems" :key="os.id" :value="os.id">{{ os.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">设备类型</label>
          <select v-model="selectedDevice" @change="generateUA" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            <option v-for="device in devices" :key="device.id" :value="device.id">{{ device.name }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- UA结果显示 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">User-Agent</h2>
        <button @click="copyUA" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!userAgent">复制</button>
      </div>
      <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg break-all font-mono text-sm">
        {{ userAgent || '选择浏览器和操作系统后自动生成' }}
      </div>

      <!-- UA信息解析 -->
      <div v-if="uaInfo" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-center">
          <div class="text-gray-500">浏览器</div>
          <div class="font-medium">{{ uaInfo.browser }}</div>
        </div>
        <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded text-center">
          <div class="text-gray-500">版本</div>
          <div class="font-medium">{{ uaInfo.version }}</div>
        </div>
        <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded text-center">
          <div class="text-gray-500">操作系统</div>
          <div class="font-medium">{{ uaInfo.os }}</div>
        </div>
        <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded text-center">
          <div class="text-gray-500">设备</div>
          <div class="font-medium">{{ uaInfo.device }}</div>
        </div>
      </div>
    </div>

    <!-- 常用UA模板 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常用User-Agent</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="template in commonUAs"
          :key="template.name"
          @click="applyTemplate(template)"
          class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
        >
          <div class="font-medium mb-1">{{ template.name }}</div>
          <div class="text-xs text-gray-500 truncate font-mono">{{ template.ua.substring(0, 60) }}...</div>
        </div>
      </div>
    </div>

    <!-- 自定义UA -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">自定义User-Agent</h2>
      <div class="mb-4">
        <textarea
          v-model="customUA"
          @input="parseCustomUA"
          class="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴自定义User-Agent..."
        ></textarea>
      </div>
      <div v-if="customUAInfo" class="p-4 bg-gray-50 dark:bg-gray-700 rounded text-sm">
        <div class="grid grid-cols-3 gap-4">
          <div><span class="text-gray-500">浏览器:</span> {{ customUAInfo.browser }}</div>
          <div><span class="text-gray-500">版本:</span> {{ customUAInfo.version }}</div>
          <div><span class="text-gray-500">系统:</span> {{ customUAInfo.os }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'User-Agent生成器 - 在线UA字符串生成',
  meta: [{ name: 'description', content: '在线User-Agent生成工具，生成各浏览器、操作系统和设备的User-Agent字符串。' }],
  keywords: ['User-Agent', 'UA生成', '浏览器UA', 'HTTP头', '爬虫UA']
})

const selectedBrowser = ref('chrome')
const selectedOS = ref('windows')
const selectedDevice = ref('desktop')
const customUA = ref('')

const browsers = [
  { id: 'chrome', name: 'Chrome' },
  { id: 'firefox', name: 'Firefox' },
  { id: 'safari', name: 'Safari' },
  { id: 'edge', name: 'Edge' },
  { id: 'opera', name: 'Opera' }
]

const operatingSystems = [
  { id: 'windows', name: 'Windows' },
  { id: 'macos', name: 'macOS' },
  { id: 'linux', name: 'Linux' },
  { id: 'android', name: 'Android' },
  { id: 'ios', name: 'iOS' }
]

const devices = [
  { id: 'desktop', name: '桌面' },
  { id: 'mobile', name: '移动设备' },
  { id: 'tablet', name: '平板' }
]

const commonUAs = [
  {
    name: 'Chrome Windows',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  {
    name: 'Firefox Mac',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/121.0'
  },
  {
    name: 'Safari iPhone',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  {
    name: 'Chrome Android',
    ua: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36'
  },
  {
    name: 'Googlebot',
    ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
  },
  {
    name: 'curl',
    ua: 'curl/7.68.0'
  }
]

const userAgent = computed(() => {
  const browserVersions: Record<string, string> = {
    chrome: '120.0.0.0',
    firefox: '121.0',
    safari: '17.0',
    edge: '120.0.0.0',
    opera: '105.0.0.0'
  }

  const osStrings: Record<string, string> = {
    windows: 'Windows NT 10.0; Win64; x64',
    macos: 'Macintosh; Intel Mac OS X 10_15_7',
    linux: 'X11; Linux x86_64',
    android: 'Linux; Android 14',
    ios: 'iPhone; CPU iPhone OS 17_0 like Mac OS X'
  }

  let ua = 'Mozilla/5.0 ('

  // OS
  ua += osStrings[selectedOS.value]

  ua += ') AppleWebKit/537.36 (KHTML, like Gecko) '

  // Browser
  switch (selectedBrowser.value) {
    case 'chrome':
      ua += `Chrome/${browserVersions.chrome} Safari/537.36`
      break
    case 'firefox':
      ua = `Mozilla/5.0 (${osStrings[selectedOS.value]}) Gecko/20100101 Firefox/${browserVersions.firefox}`
      break
    case 'safari':
      ua += `Version/${browserVersions.safari} Safari/605.1.15`
      break
    case 'edge':
      ua += `Chrome/${browserVersions.edge} Safari/537.36 Edg/${browserVersions.edge.replace('.0.0', '')}`
      break
    case 'opera':
      ua += `OPR/${browserVersions.opera}`
      break
  }

  // Mobile
  if (selectedDevice.value !== 'desktop') {
    if (selectedBrowser.value === 'chrome') {
      ua += ' Mobile'
    }
  }

  return ua
})

const uaInfo = computed(() => {
  const browserNames: Record<string, string> = {
    chrome: 'Chrome',
    firefox: 'Firefox',
    safari: 'Safari',
    edge: 'Edge',
    opera: 'Opera'
  }

  const osNames: Record<string, string> = {
    windows: 'Windows 10',
    macos: 'macOS 10.15',
    linux: 'Linux',
    android: 'Android 14',
    ios: 'iOS 17'
  }

  const deviceNames: Record<string, string> = {
    desktop: 'Desktop',
    mobile: 'Mobile',
    tablet: 'Tablet'
  }

  return {
    browser: browserNames[selectedBrowser.value],
    version: userAgent.value.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)?.[1] || '',
    os: osNames[selectedOS.value],
    device: deviceNames[selectedDevice.value]
  }
})

const customUAInfo = ref<any>(null)

function generateUA() {
  // 触发computed重新计算
}

function applyTemplate(template: any) {
  customUA.value = template.ua
  parseCustomUA()
}

function parseCustomUA() {
  if (!customUA.value) {
    customUAInfo.value = null
    return
  }

  const ua = customUA.value

  // 简单UA解析
  let browser = 'Unknown'
  let version = ''
  let os = 'Unknown'

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome'
    const match = ua.match(/Chrome\/([\d.]+)/)
    if (match) version = match[1]
  } else if (ua.includes('Edg')) {
    browser = 'Edge'
    const match = ua.match(/Edg\/([\d.]+)/)
    if (match) version = match[1]
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox'
    const match = ua.match(/Firefox\/([\d.]+)/)
    if (match) version = match[1]
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari'
    const match = ua.match(/Version\/([\d.]+)/)
    if (match) version = match[1]
  }

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux')) os = 'Linux'

  customUAInfo.value = { browser, version, os }
}

async function copyUA() {
  try {
    await navigator.clipboard.writeText(userAgent.value)
    alert('已复制')
  } catch {}
}

async function copyCustom() {
  try {
    await navigator.clipboard.writeText(customUA.value)
    alert('已复制')
  } catch {}
}
</script>
