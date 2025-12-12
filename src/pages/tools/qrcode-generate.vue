<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">二维码生成器</h1>
      <p class="text-muted-foreground">快速生成二维码，支持文本、网址、WiFi等多种格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入配置 -->
      <div class="space-y-4">
        <!-- 内容类型选择 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">内容类型</label>
          <div class="flex gap-2">
            <button
              v-for="type in contentTypes"
              :key="type.value"
              @click="contentType = type.value"
              :class="contentType === type.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'"
              class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- 动态输入表单 -->
        <div class="space-y-4 p-4 bg-card border rounded-lg">
          <!-- 文本内容 -->
          <div v-if="contentType === 'text'">
            <label class="text-sm font-medium mb-2 block">文本内容</label>
            <textarea
              v-model="formData.text"
              placeholder="请输入要生成二维码的文本内容..."
              class="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>

          <!-- 网址内容 -->
          <div v-if="contentType === 'url'">
            <label class="text-sm font-medium mb-2 block">网址</label>
            <input
              v-model="formData.url"
              type="url"
              placeholder="https://example.com"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <!-- WiFi内容 -->
          <div v-if="contentType === 'wifi'" class="space-y-3">
            <div>
              <label class="text-sm font-medium mb-2 block">网络名称 (SSID)</label>
              <input
                v-model="formData.wifi.ssid"
                type="text"
                placeholder="请输入WiFi名称"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">密码</label>
              <input
                v-model="formData.wifi.password"
                type="password"
                placeholder="请输入WiFi密码"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">加密类型</label>
              <select v-model="formData.wifi.encryption" class="w-full px-3 py-2 border rounded-md">
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">无密码</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="formData.wifi.hidden"
                type="checkbox"
                id="hidden"
                class="rounded"
              />
              <label for="hidden" class="text-sm">隐藏网络</label>
            </div>
          </div>

          <!-- 邮件内容 -->
          <div v-if="contentType === 'email'" class="space-y-3">
            <div>
              <label class="text-sm font-medium mb-2 block">收件人邮箱</label>
              <input
                v-model="formData.email.to"
                type="email"
                placeholder="example@email.com"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">主题</label>
              <input
                v-model="formData.email.subject"
                type="text"
                placeholder="邮件主题"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">正文</label>
              <textarea
                v-model="formData.email.body"
                placeholder="邮件内容"
                class="w-full h-24 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>
          </div>

          <!-- 电话内容 -->
          <div v-if="contentType === 'phone'">
            <label class="text-sm font-medium mb-2 block">电话号码</label>
            <input
              v-model="formData.phone"
              type="tel"
              placeholder="+86 138 0013 8000"
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <!-- 短信内容 -->
          <div v-if="contentType === 'sms'" class="space-y-3">
            <div>
              <label class="text-sm font-medium mb-2 block">收件人号码</label>
              <input
                v-model="formData.sms.to"
                type="tel"
                placeholder="13800138000"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">短信内容</label>
              <textarea
                v-model="formData.sms.message"
                placeholder="短信内容"
                class="w-full h-24 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
            </div>
          </div>

          <!-- 名片内容 -->
          <div v-if="contentType === 'vcard'" class="space-y-3">
            <div>
              <label class="text-sm font-medium mb-2 block">姓名</label>
              <input
                v-model="formData.vcard.name"
                type="text"
                placeholder="张三"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">公司</label>
              <input
                v-model="formData.vcard.organization"
                type="text"
                placeholder="XX科技有限公司"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">电话</label>
              <input
                v-model="formData.vcard.phone"
                type="tel"
                placeholder="13800138000"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">邮箱</label>
              <input
                v-model="formData.vcard.email"
                type="email"
                placeholder="zhangsan@example.com"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">网址</label>
              <input
                v-model="formData.vcard.url"
                type="url"
                placeholder="https://example.com"
                class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <!-- 二维码设置 -->
        <div class="space-y-4 p-4 bg-card border rounded-lg">
          <h3 class="font-medium">二维码设置</h3>

          <div>
            <label class="text-sm text-muted-foreground mb-2 block">尺寸</label>
            <select v-model="qrSettings.size" class="w-full px-3 py-2 border rounded-md">
              <option :value="200">小 (200x200)</option>
              <option :value="300">中 (300x300)</option>
              <option :value="400">大 (400x400)</option>
              <option :value="500">特大 (500x500)</option>
            </select>
          </div>

          <div>
            <label class="text-sm text-muted-foreground mb-2 block">纠错级别</label>
            <select v-model="qrSettings.errorCorrectionLevel" class="w-full px-3 py-2 border rounded-md">
              <option value="L">低 (7%)</option>
              <option value="M">中 (15%)</option>
              <option value="Q">较高 (25%)</option>
              <option value="H">高 (30%)</option>
            </select>
          </div>

          <div>
            <label class="text-sm text-muted-foreground mb-2 block">前景色</label>
            <input
              v-model="qrSettings.darkColor"
              type="color"
              class="w-full h-10 border rounded-md cursor-pointer"
            />
          </div>

          <div>
            <label class="text-sm text-muted-foreground mb-2 block">背景色</label>
            <input
              v-model="qrSettings.lightColor"
              type="color"
              class="w-full h-10 border rounded-md cursor-pointer"
            />
          </div>
        </div>
      </div>

      <!-- 右侧：预览和操作 -->
      <div class="space-y-4">
        <!-- 二维码预览 -->
        <div class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium">二维码预览</h3>
            <div class="flex gap-2">
              <button
                v-if="qrCodeUrl"
                @click="downloadQRCode"
                class="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                下载
              </button>
              <button
                v-if="qrCodeUrl"
                @click="copyQRCode"
                class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                复制
              </button>
            </div>
          </div>

          <div class="flex justify-center items-center min-h-[300px]">
            <div v-if="!qrCodeUrl && !qrContent" class="text-muted-foreground text-center">
              <p>请输入内容生成二维码</p>
            </div>
            <div v-else-if="!qrCodeUrl" class="text-muted-foreground text-center">
              <p>正在生成二维码...</p>
            </div>
            <div v-else class="relative">
              <img
                :src="qrCodeUrl"
                :style="{ width: qrSettings.size + 'px', height: qrSettings.size + 'px' }"
                alt="QR Code"
                class="border border-border rounded-lg"
              />
              <div
                v-if="qrSettings.logo"
                class="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <img
                  :src="qrSettings.logo"
                  alt="Logo"
                  class="w-1/5 h-1/5 rounded-md bg-white p-1"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 内容预览 -->
        <div v-if="qrContent" class="bg-card border rounded-lg p-4">
          <h3 class="font-medium mb-2">内容预览</h3>
          <div class="text-sm text-muted-foreground font-mono break-all max-h-32 overflow-y-auto">
            {{ qrContent }}
          </div>
        </div>

        <!-- 快速示例 -->
        <div class="bg-card border rounded-lg p-4">
          <h3 class="font-medium mb-3">快速示例</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="loadExample('url')"
              class="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors text-left"
            >
              网址示例
            </button>
            <button
              @click="loadExample('wifi')"
              class="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors text-left"
            >
              WiFi示例
            </button>
            <button
              @click="loadExample('email')"
              class="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors text-left"
            >
              邮件示例
            </button>
            <button
              @click="loadExample('vcard')"
              class="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md transition-colors text-left"
            >
              名片示例
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          使用说明
        </h3>
        <div class="space-y-4 text-sm">
          <div>
            <h4 class="font-medium mb-2">支持的二维码类型</h4>
            <ul class="text-muted-foreground space-y-1 ml-4">
              <li>• 纯文本 - 任意文本内容</li>
              <li>• 网址 (URL) - 自动识别并可在扫码后打开浏览器</li>
              <li>• WiFi - 自动连接WiFi网络</li>
              <li>• 邮件 - 填写收件人、主题和正文</li>
              <li>• 电话 - 一键拨打电话</li>
              <li>• 短信 - 预填写短信内容</li>
              <li>• 名片 (vCard) - 保存联系人信息</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium mb-2">纠错级别说明</h4>
            <ul class="text-muted-foreground space-y-1 ml-4">
              <li>• 低 (L) - 可纠正约7%的错误</li>
              <li>• 中 (M) - 可纠正约15%的错误（推荐）</li>
              <li>• 较高 (Q) - 可纠正约25%的错误</li>
              <li>• 高 (H) - 可纠正约30%的错误</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/base64-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 编码</p>
              <p class="text-xs text-muted-foreground">文本转 Base64</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/url-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Link class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">URL 编码</p>
              <p class="text-xs text-muted-foreground">URL 百分比编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/unicode-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Type class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Unicode 转换</p>
              <p class="text-xs text-muted-foreground">Unicode 编码转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Info, Hash, Link, Type, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'
import QRCode from 'qrcode'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const contentType = ref('text')
const qrContent = ref('')
const qrCodeUrl = ref('')

// 内容类型选项
const contentTypes = [
  { label: '文本', value: 'text' },
  { label: '网址', value: 'url' },
  { label: 'WiFi', value: 'wifi' },
  { label: '邮件', value: 'email' },
  { label: '电话', value: 'phone' },
  { label: '短信', value: 'sms' },
  { label: '名片', value: 'vcard' }
]

// 表单数据
const formData = ref({
  text: '',
  url: '',
  wifi: {
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false
  },
  email: {
    to: '',
    subject: '',
    body: ''
  },
  phone: '',
  sms: {
    to: '',
    message: ''
  },
  vcard: {
    name: '',
    organization: '',
    phone: '',
    email: '',
    url: ''
  }
})

// 二维码设置
const qrSettings = ref({
  size: 300,
  errorCorrectionLevel: 'M',
  darkColor: '#000000',
  lightColor: '#FFFFFF',
  logo: null
})

// 生成二维码内容
const generateQRContent = computed(() => {
  switch (contentType.value) {
    case 'text':
      return formData.value.text

    case 'url':
      return formData.value.url

    case 'wifi':
      const wifi = formData.value.wifi
      if (!wifi.ssid) return ''
      const auth = wifi.encryption === 'nopass' ? 'nopass' : wifi.encryption
      const wifiString = `WIFI:T:${auth};S:${wifi.ssid};P:${wifi.password};${wifi.hidden ? 'H:true' : ''};`
      return wifiString

    case 'email':
      const email = formData.value.email
      if (!email.to) return ''
      let emailString = `mailto:${email.to}`
      const params = []
      if (email.subject) params.push(`subject=${encodeURIComponent(email.subject)}`)
      if (email.body) params.push(`body=${encodeURIComponent(email.body)}`)
      if (params.length > 0) emailString += `?${params.join('&')}`
      return emailString

    case 'phone':
      return `tel:${formData.value.phone}`

    case 'sms':
      const sms = formData.value.sms
      if (!sms.to) return ''
      const smsString = `sms:${sms.to}${sms.message ? `?body=${encodeURIComponent(sms.message)}` : ''}`
      return smsString

    case 'vcard':
      const vcard = formData.value.vcard
      if (!vcard.name) return ''
      return `BEGIN:VCARD
VERSION:3.0
FN:${vcard.name}
ORG:${vcard.organization || ''}
TEL:${vcard.phone || ''}
EMAIL:${vcard.email || ''}
URL:${vcard.url || ''}
END:VCARD`

    default:
      return ''
  }
})

// 生成二维码
const generateQRCode = async () => {
  qrContent.value = generateQRContent.value

  if (!qrContent.value) {
    qrCodeUrl.value = ''
    return
  }

  try {
    const options = {
      width: qrSettings.value.size,
      height: qrSettings.value.size,
      color: {
        dark: qrSettings.value.darkColor,
        light: qrSettings.value.lightColor
      },
      errorCorrectionLevel: qrSettings.value.errorCorrectionLevel
    }

    const url = await QRCode.toDataURL(qrContent.value, options)
    qrCodeUrl.value = url
  } catch (error) {
    console.error('生成二维码失败:', error)
    qrCodeUrl.value = ''
  }
}

// 加载示例
const loadExample = (type) => {
  contentType.value = type

  switch (type) {
    case 'url':
      formData.value.url = 'https://www.util.cn'
      break

    case 'wifi':
      formData.value.wifi = {
        ssid: 'Util-WiFi',
        password: 'password123',
        encryption: 'WPA',
        hidden: false
      }
      break

    case 'email':
      formData.value.email = {
        to: 'hello@util.cn',
        subject: 'Hello from QR Code',
        body: 'This is a test email generated from QR Code.'
      }
      break

    case 'vcard':
      formData.value.vcard = {
        name: '张三',
        organization: 'Util科技',
        phone: '13800138000',
        email: 'zhangsan@util.cn',
        url: 'https://www.util.cn'
      }
      break
  }

  generateQRCode()
}

// 下载二维码
const downloadQRCode = () => {
  if (!qrCodeUrl.value) return

  const link = document.createElement('a')
  link.href = qrCodeUrl.value
  link.download = `qrcode-${Date.now()}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 复制二维码
const copyQRCode = async () => {
  if (!qrCodeUrl.value) return

  try {
    // 将 data URL 转换为 Blob
    const response = await fetch(qrCodeUrl.value)
    const blob = await response.blob()

    // 复制到剪贴板
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 监听数据变化
watch([contentType, formData, qrSettings], () => {
  generateQRCode()
}, { deep: true })

// SEO配置
useSeoMeta({
  title: '二维码生成器 - 在线QR码生成工具',
  description: '免费在线二维码生成工具，支持文本、网址、WiFi、邮件、电话、短信、名片等多种格式，可自定义颜色和尺寸。',
  keywords: ['qr', '二维码', 'generator', 'qrcode', '在线工具', 'wifi', 'vcard', '名片']
})

definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

input[type="color"] {
  cursor: pointer;
  border-radius: 4px;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 4px;
}
</style>