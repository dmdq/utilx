<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">二维码扫描器</h1>
      <p class="text-muted-foreground max-w-3xl">使用您的摄像头扫描并解码二维码，快速提取信息，支持文本、网址、WiFi等多种格式。</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：摄像头输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">摄像头预览</label>
          <div class="flex items-center gap-2">
            <button
              @click="startCamera"
              :disabled="isCameraActive"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              启动摄像头
            </button>
            <button
              @click="stopCamera"
              :disabled="!isCameraActive"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              停止摄像头
            </button>
          </div>
        </div>
        <div
          class="w-full h-96 border border-border rounded-lg bg-muted/50 flex items-center justify-center"
        >
          <video
            v-if="isCameraActive"
            ref="videoElement"
            autoplay
            playsinline
            class="w-full h-full object-contain rounded-lg"
          ></video>
          <div v-else class="flex flex-col items-center justify-center h-full text-muted-foreground">
            <QrCode class="w-12 h-12 mx-auto mb-4" />
            <p class="text-center">等待摄像头启动...</p>
          </div>
        </div>
        <div class="text-sm text-muted-foreground">
          扫描状态：{{ cameraStatus }}
        </div>
      </div>

      <!-- 右侧：扫描结果区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">扫描结果</label>
          <div class="flex items-center gap-2">
            <button
              @click="copyResult"
              :disabled="!decodedText"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {{ copyResultButtonText }}
            </button>
            <button
              @click="loadResultIntoInput"
              :disabled="!decodedText"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors disabled:opacity-50"
            >
              填入上文
            </button>
          </div>
        </div>
        <div class="w-full h-96 p-4 border border-border rounded-lg bg-muted/50 overflow-y-auto">
          <div class="font-mono text-lg break-all">
            {{ decodedText || '扫描结果将显示在这里...' }}
          </div>
        </div>
        <div class="text-sm text-muted-foreground">
          检测到内容类型：{{ detectedContentType }}
        </div>
      </div>
    </div>

    <!-- 文件上传扫描 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">文件扫描</h3>
      <div class="flex items-center gap-4">
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          @change="handleFileUpload"
          class="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          @click="scanFileQRCode"
          :disabled="!selectedFile || isLoadingFileScan"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoadingFileScan ? '扫描中...' : '扫描文件' }}
        </button>
      </div>
      <div v-if="fileScanStatus" class="mt-4 text-sm" :class="fileScanStatus.success ? 'text-green-600' : 'text-red-600'">
        {{ fileScanStatus.message }}
      </div>
    </div>

    <!-- 结果处理 -->
    <div v-if="decodedText" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">操作结果</h3>
      <div v-if="detectedContentType === 'url'" class="flex items-center gap-2 mb-4">
        <Link class="w-5 h-5 text-primary" />
        <a :href="decodedText" target="_blank" class="text-primary hover:underline">
          {{ decodedText }}
        </a>
      </div>
      <div v-else-if="detectedContentType === 'wifi'" class="flex items-center gap-2 mb-4">
        <Wifi class="w-5 h-5 text-primary" />
        <p class="text-muted-foreground">WiFi: {{ getWifiDetails(decodedText).ssid }} ({{ getWifiDetails(decodedText).encryption }})</p>
      </div>
      <div v-else-if="detectedContentType === 'phone'" class="flex items-center gap-2 mb-4">
        <Phone class="w-5 h-5 text-primary" />
        <a :href="`tel:${decodedText}`" class="text-primary hover:underline">{{ decodedText }}</a>
      </div>
      <div v-else-if="detectedContentType === 'email'" class="flex items-center gap-2 mb-4">
        <Mail class="w-5 h-5 text-primary" />
        <a :href="`mailto:${decodedText}`" class="text-primary hover:underline">{{ decodedText }}</a>
      </div>
      <div v-else-if="detectedContentType === 'sms'" class="flex items-center gap-2 mb-4">
        <MessageSquare class="w-5 h-5 text-primary" />
        <p class="text-muted-foreground">短信: {{ decodedText }}</p>
      </div>
      <div v-else class="flex items-center gap-2 mb-4">
        <FileText class="w-5 h-5 text-primary" />
        <p class="text-muted-foreground">{{ decodedText }}</p>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">相关工具</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ToolCard
          v-for="tool in relatedTools"
          :key="tool.id"
          :tool="tool"
          :title="tool.name"
          :description="tool.description"
          :category="tool.category"
          :usage-count="formatViewCount(tool.viewCount)"
          :icon="tool.icon"
          @select="handleToolSelect"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { QrCode, X, CheckCircle, XCircle, Copy, ExternalLink, Camera, Link, Mail, Phone, MessageSquare, Wifi, Contact, Calendar, Type, Info, Hash, Link2, FileText } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// import QRCode from 'qrcode' // 原始导入

// 分类信息
const category = {
  id: 'encode',
  name: '编码解码',
  description: '编码解码工具集合'
}

// 响应式数据
const videoElement = ref(null)
const isCameraActive = ref(false)
const cameraStream = ref(null)
const isFileScanLoading = ref(false)
const selectedFile = ref(null)
const fileScanStatus = ref(null)
const decodedText = ref('')
const detectedContentType = ref('')
const copyResultButtonText = ref('复制')

const isLoadingFileScan = ref(false)

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'encode' &&
    tool.id !== 'qrcode-scan'
  ).slice(0, 4)
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

// 启动摄像头
const startCamera = async () => {
  if (isCameraActive.value) return

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment' // 优先使用后置摄像头
      }
    })
    videoElement.value.srcObject = stream
    cameraStream.value = stream
    isCameraActive.value = true
    cameraStatus.value = '摄像头已启动'
  } catch (error) {
    console.error('启动摄像头失败:', error)
    cameraStatus.value = '启动摄像头失败，请检查权限'
  }
}

// 停止摄像头
const stopCamera = () => {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
    videoElement.value.srcObject = null
    cameraStream.value = null
    isCameraActive.value = false
    cameraStatus.value = '摄像头已停止'
  }
}

// 扫描摄像头画面
const scanCameraQRCode = async () => {
  if (!isCameraActive.value || !videoElement.value) {
    cameraStatus.value = '请先启动摄像头'
    return
  }

  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = videoElement.value.videoWidth
    canvas.height = videoElement.value.videoHeight

    if (!context) throw new Error('无法获取2D上下文')

    context.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    const QRCode = await import('qrcode')
    const decodedText = await QRCode.decode(imageData)

    if (decodedText) {
      decodedText.value = decodedText
      detectedContentType.value = detectContentType(decodedText)
      cameraStatus.value = '二维码已扫描'
    } else {
      cameraStatus.value = '未检测到二维码',
      decodedText.value = ''
    }
  } catch (error) {
    console.error('扫描二维码失败:', error)
    cameraStatus.value = '扫描失败，请确保画面中有二维码'
    decodedText.value = ''
  }
}

// 扫描文件中的二维码
const scanFileQRCode = async () => {
  if (!selectedFile.value) {
    fileScanStatus.value = {
      success: false,
      message: '请先选择一个文件'
    }
    return
  }

  isLoadingFileScan.value = true
  fileScanStatus.value = null

  try {
    const file = selectedFile.value
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const imageDataUrl = e.target.result
        const QRCode = await import('qrcode')
        const decodedText = await QRCode.decode(imageDataUrl)
        if (decodedText) {
          decodedText.value = decodedText
          detectedContentType.value = detectContentType(decodedText)
          fileScanStatus.value = {
            success: true,
            message: '文件扫描成功！'
          }
        } else {
          fileScanStatus.value = {
            success: false,
            message: '文件中未检测到二维码'
          }
        }
      } catch (error) {
        console.error('文件扫描失败:', error)
        fileScanStatus.value = {
          success: false,
          message: '文件格式错误或无法解析二维码'
        }
      } finally {
        isLoadingFileScan.value = false
      }
    }
    reader.onerror = (error) => {
      console.error('读取文件时出错:', error)
      fileScanStatus.value = {
        success: false,
        message: '读取文件失败'
      }
      isLoadingFileScan.value = false
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('文件扫描异常:', error)
    fileScanStatus.value = {
      success: false,
      message: '发生未知错误'
    }
    isLoadingFileScan.value = false
  }
}

// 处理文件选择
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  selectedFile.value = file
}

// 检测内容类型
const detectContentType = (text) => {
  if (!text) return '未知'

  // 网址检测
  if (text.startsWith('http://') || text.startsWith('https://')) return 'url'

  // WiFi 检测
  if (text.startsWith('WIFI:')) return 'wifi'

  // 邮件检测
  if (text.startsWith('mailto:')) return 'email'

  // 电话检测
  if (text.startsWith('tel:')) return 'phone'

  // 短信检测
  if (text.startsWith('sms:')) return 'sms'

  // 名片检测
  if (text.startsWith('BEGIN:VCARD')) return 'vcard'

  return 'text'
}

// 复制扫描结果
const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(decodedText.value)
    copyResultButtonText.value = '已复制'
    setTimeout(() => {
      copyResultButtonText.value = '复制'
    }, 2000)
  } catch (error) {
    console.error('复制结果失败:', error)
  }
}

// 将扫描结果填入输入框
const loadResultIntoInput = () => {
  if (!decodedText.value) return

  // 根据内容类型填充不同的输入框
  const content = decodedText.value
  const type = detectContentType(content)

  switch (type) {
    case 'text':
      // 优先填充文本区域
      const textInput = document.querySelector('textarea')
      if (textInput) {
        textInput.value = content
        // 触发 formData 的 change 事件（如果需要）
      } else {
        // 如果找不到 textarea，先试试全局 formData
        formData.value.text = content
      }
      break

    case 'url':
      formData.value.url = content
      break

    case 'wifi':
      const wifiRegex = /WIFI:T:(.+);S:(.+?);P:(.*?);(?:H:true;)?$/;
      const wifiMatch = content.match(wifiRegex)
      if (wifiMatch) {
        formData.value.wifi.encryption = wifiMatch[1]
        formData.value.wifi.ssid = wifiMatch[2]
        formData.value.wifi.password = wifiMatch[3]
        // 'H:true' is not handled here, but could be added if needed
      }
      break

    case 'email':
      const mailtoRegex = /^mailto:([^?]+)(\?(.*))?$/
      const mailtoMatch = content.match(mailtoRegex)
      if (mailtoMatch) {
        formData.value.email.to = mailtoMatch[1]
        if (mailtoMatch[3]) {
          const queryParams = new URLSearchParams(mailtoMatch[3])
          formData.value.email.subject = queryParams.get('subject') || ''
          formData.value.email.body = queryParams.get('body') || ''
        }
      }
      break

    case 'phone':
      formData.value.phone = content.replace(/^tel:/, '')
      break

    case 'sms':
      const smsRegex = /^sms:([^?]+)(\?(.*))?$/
      const smsMatch = content.match(smsRegex)
      if (smsMatch) {
        formData.value.sms.to = smsMatch[1]
        if (smsMatch[3]) {
          const queryParams = new URLSearchParams(smsMatch[3])
          formData.value.sms.message = queryParams.get('body') || ''
        }
      }
      break

    case 'vcard':
      const vcardRegex = /^BEGIN:VCARD\nVERSION:3.0\nFN:(.+)\nORG:(.+)\nTEL:(.+)\nEMAIL:(.+)\nURL:(.+)\nEND:VCARD$/;
      const vcardMatch = content.match(vcardRegex);
      if (vcardMatch) {
        formData.value.vcard = {
          name: vcardMatch[1],
          organization: vcardMatch[2] || '',
          phone: vcardMatch[3] || '',
          email: vcardMatch[4] || '',
          url: vcardMatch[5] || ''
        };
      }
      break;
  }
}

// 切换摄像头状态
const toggleCamera = () => {
  if (isCameraActive.value) {
    stopCamera()
  } else {
    startCamera()
  }
}

// 状态更新
watch(decodedText, (newText) => {
  if (newText) {
    detectedContentType.value = detectContentType(newText)
  } else {
    detectedContentType.value = ''
  }
})

// 生命周期钩子
onMounted(() => {
  // 页面挂载时，尝试自动启动摄像头
  // startCamera()
  usePageMeta({
    title: '二维码扫描器',
    keywords: ['二维码', '扫描', '解码', 'QR Code', '在线工具']
  })
})

onUnmounted(() => {
  stopCamera()
})

// Tauri 相关（仅在 Tauri 环境下生效）
// 如果需要 Tauri 的特定功能（如文件访问），需要在这里集成

// 模拟 formData，如果组件中有使用
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

// 暂不处理 webcam 扫描，先侧重文件扫描
const cameraStatus = ref('请启动摄像头')

</script>

<style scoped>
/* 可以在这里添加一些 scoped CSS */
video {
  border-radius: 8px;
}

textarea {
  font-family: "SFMono-Regular", "Consolas", "Liberation Mono", Menlo, Courier, monospace;
}
</style>