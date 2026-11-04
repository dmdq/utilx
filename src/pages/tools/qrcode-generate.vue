<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">二维码生成器</h1>
      <p class="text-muted-foreground">快速生成二维码，支持文本、网址、WiFi等多种格式</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入控制 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings class="w-5 h-5 text-primary" />
            配置选项
          </h2>

          <div class="space-y-4">
            <!-- 二维码类型 -->
            <div>
              <label class="text-sm font-medium mb-2 block">二维码类型</label>
              <div class="grid grid-cols-2 gap-2">
                <button @click="qrType = 'text'" :class="['p-3 rounded-lg text-sm', qrType === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">文本</button>
                <button @click="qrType = 'url'" :class="['p-3 rounded-lg text-sm', qrType === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">网址</button>
                <button @click="qrType = 'wifi'" :class="['p-3 rounded-lg text-sm', qrType === 'wifi' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">WiFi</button>
                <button @click="qrType = 'email'" :class="['p-3 rounded-lg text-sm', qrType === 'email' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']">邮件</button>
              </div>
            </div>

            <!-- 文本/网址输入 -->
            <div v-if="qrType === 'text' || qrType === 'url'">
              <label class="text-sm font-medium mb-2 block">{{ qrType === 'text' ? '文本内容' : '网址' }}</label>
              <textarea v-model="textContent" class="w-full px-3 py-2 border border-border rounded-lg text-sm" rows="4" :placeholder="qrType === 'url' ? 'https://example.com' : '请输入文本内容'"></textarea>
            </div>

            <!-- WiFi输入 -->
            <div v-if="qrType === 'wifi'" class="space-y-3">
              <div>
                <label class="text-sm font-medium mb-1 block">SSID（网络名称）</label>
                <input v-model="wifi.ssid" type="text" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="WiFi名称">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">密码</label>
                <input v-model="wifi.password" type="text" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="WiFi密码">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">加密类型</label>
                <select v-model="wifi.security" class="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">无密码</option>
                </select>
              </div>
            </div>

            <!-- 邮件输入 -->
            <div v-if="qrType === 'email'" class="space-y-3">
              <div>
                <label class="text-sm font-medium mb-1 block">邮箱地址</label>
                <input v-model="email.address" type="email" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="example@mail.com">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">主题</label>
                <input v-model="email.subject" type="text" class="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder="邮件主题">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">内容</label>
                <textarea v-model="email.body" class="w-full px-3 py-2 border border-border rounded-lg text-sm" rows="3" placeholder="邮件内容"></textarea>
              </div>
            </div>

            <!-- 二维码样式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">二维码大小</label>
              <div class="flex gap-2">
                <button @click="size = 200" :class="['flex-1 p-2 rounded text-xs', size === 200 ? 'bg-primary text-primary-foreground' : 'bg-muted']">200x200</button>
                <button @click="size = 300" :class="['flex-1 p-2 rounded text-xs', size === 300 ? 'bg-primary text-primary-foreground' : 'bg-muted']">300x300</button>
                <button @click="size = 400" :class="['flex-1 p-2 rounded text-xs', size === 400 ? 'bg-primary text-primary-foreground' : 'bg-muted']">400x400</button>
              </div>
            </div>

            <!-- 颜色选择 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium mb-1 block">前景色</label>
                <input v-model="colorDark" type="color" class="w-full h-10 rounded cursor-pointer">
              </div>
              <div>
                <label class="text-sm font-medium mb-1 block">背景色</label>
                <input v-model="colorLight" type="color" class="w-full h-10 rounded cursor-pointer">
              </div>
            </div>

            <button @click="generateQRCode" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <QrCode class="w-5 h-5 inline mr-2" />
              生成二维码
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：二维码展示 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">二维码预览</h2>

          <div class="flex items-center justify-center p-6 bg-muted rounded-lg min-h-[300px]">
            <div v-if="qrDataUrl" class="text-center">
              <img :src="qrDataUrl" :alt="'二维码'" class="mx-auto border-4 border-white shadow-lg" :style="{ width: size + 'px', height: size + 'px' }">
              <p class="text-xs text-muted-foreground mt-4">扫描二维码访问内容</p>
            </div>
            <div v-else class="text-center text-muted-foreground">
              <QrCode class="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>输入内容后点击生成</p>
            </div>
          </div>

          <div v-if="qrDataUrl" class="mt-4 space-y-2">
            <button @click="downloadQRCode" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Download class="w-4 h-4 inline mr-2" />
              下载二维码
            </button>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">使用说明</h2>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p class="font-medium">选择二维码类型</p>
                <p class="text-muted-foreground">根据需要选择文本、网址、WiFi或邮件类型</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p class="font-medium">输入内容</p>
                <p class="text-muted-foreground">填写对应的文本、网址或配置信息</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p class="font-medium">自定义样式</p>
                <p class="text-muted-foreground">选择合适的大小和颜色</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-xs font-bold text-primary">4</span>
              </div>
              <div>
                <p class="font-medium">生成并下载</p>
                <p class="text-muted-foreground">点击生成按钮，预览后可下载PNG格式</p>
              </div>
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
import { QrCode, Settings, Download } from 'lucide-vue-next'
import QRCode from 'qrcode'

const qrType = ref('text')
const textContent = ref('')
const size = ref(300)
const colorDark = ref('#000000')
const colorLight = ref('#ffffff')
const qrDataUrl = ref('')

const wifi = ref({
  ssid: '',
  password: '',
  security: 'WPA'
})

const email = ref({
  address: '',
  subject: '',
  body: ''
})

function generateQRCode() {
  let data = ''

  switch (qrType.value) {
    case 'text':
      data = textContent.value
      break
    case 'url':
      data = textContent.value
      break
    case 'wifi':
      const { ssid, password, security } = wifi.value
      data = `WIFI:T:${security};S:${ssid};P:${password};;`
      break
    case 'email':
      const { address, subject, body } = email.value
      data = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      break
  }

  if (!data) {
    alert('请输入内容')
    return
  }

  QRCode.toDataURL(data, {
    width: size.value,
    margin: 2,
    color: {
      dark: colorDark.value,
      light: colorLight.value
    }
  }, (error, url) => {
    if (error) {
      console.error(error)
      alert('生成二维码失败')
      return
    }
    qrDataUrl.value = url
  })
}

function downloadQRCode() {
  if (!qrDataUrl.value) return

  const link = document.createElement('a')
  link.download = `qrcode-${Date.now()}.png`
  link.href = qrDataUrl.value
  link.click()
}

useSeoMeta({
  title: '二维码生成器 - 在线二维码生成工具',
  description: '免费在线二维码生成器，支持文本、网址、WiFi、邮件等多种格式，可自定义大小和颜色，一键下载PNG格式。', keywords: ['二维码', 'QR Code', '二维码生成', '二维码工具', '在线二维码', 'WiFi二维码', '二维码下载']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('二维码生成器')
</script>
