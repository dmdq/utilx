<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">AES解密</h1>
      <p class="text-muted-foreground max-w-3xl">AES对称解密工具，支持AES-128/192/256，多种工作模式，可解密AES加密的文本和文件。</p>
    </div>

    <!-- 解密设置 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">解密设置</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="text-sm font-medium mb-2 block">密钥长度</label>
          <select
            v-model="keySize"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="128">AES-128 (128位)</option>
            <option value="192">AES-192 (192位)</option>
            <option value="256">AES-256 (256位)</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">工作模式</label>
          <select
            v-model="mode"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="CBC">CBC (密码块链接)</option>
            <option value="ECB">ECB (电子密码本)</option>
            <option value="CFB">CFB (密码反馈)</option>
            <option value="OFB">OFB (输出反馈)</option>
            <option value="CTR">CTR (计数器)</option>
            <option value="GCM">GCM (伽罗瓦计数器)</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">填充方式</label>
          <select
            v-model="padding"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            :disabled="mode === 'CTR' || mode === 'GCM'"
          >
            <option value="PKCS7">PKCS7</option>
            <option value="ISO97971">ISO/IEC 9797-1</option>
            <option value="ANSIX923">ANSI X9.23</option>
            <option value="ZERO">Zero Padding</option>
            <option value="NO_PADDING">无填充</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">输入格式</label>
          <select
            v-model="inputFormat"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="base64">Base64</option>
            <option value="hex">Hex</option>
            <option value="utf8">UTF-8</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 密钥和IV设置 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">密钥和初始向量</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="text-sm font-medium mb-2 block">
            密钥
            <span class="text-xs text-muted-foreground ml-2">({{ keySize/8 }}字节)</span>
          </label>
          <div class="flex gap-2">
            <input
              v-model="secretKey"
              type="password"
              :placeholder="`输入${keySize}位密钥`"
              class="flex-1 px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
            <button
              @click="clearKey"
              class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              清空
            </button>
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            密钥长度：{{ secretKey.length * 8 }} 位
            <span v-if="secretKey.length * 8 !== Number(keySize)" class="text-amber-600 ml-2">
              (需要 {{ keySize }} 位)
            </span>
          </div>
        </div>
        <div v-if="mode !== 'ECB'">
          <label class="text-sm font-medium mb-2 block">
            初始向量 (IV)
            <span class="text-xs text-muted-foreground ml-2">(16字节)</span>
          </label>
          <div class="flex gap-2">
            <input
              v-model="iv"
              type="password"
              placeholder="输入16字节初始向量"
              class="flex-1 px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
            <button
              @click="clearIV"
              class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              清空
            </button>
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            IV长度：{{ iv.length * 8 }} 位
            <span v-if="iv.length !== 16" class="text-amber-600 ml-2">
              (需要 128 位/16 字节)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">加密数据</label>
          <div class="flex items-center gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileUpload"
                accept=".txt,.enc,.aes"
                class="hidden"
              >
              <span class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                选择文件
              </span>
            </label>
          </div>
        </div>
        <textarea
          v-model="encryptedData"
          :placeholder="`请输入要解密的${inputFormat}格式数据...`"
          class="w-full h-64 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          数据长度：{{ encryptedData.length }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">解密结果</label>
          <div class="flex items-center gap-2">
            <button
              @click="copyToClipboard(decryptedData)"
              :disabled="!decryptedData"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {{ copyButtonText }}
            </button>
            <button
              @click="downloadResult"
              :disabled="!decryptedData"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors disabled:opacity-50"
            >
              下载
            </button>
          </div>
        </div>
        <textarea
          v-model="decryptedData"
          placeholder="解密结果将显示在这里..."
          readonly
          class="w-full h-64 p-4 border border-border border-border rounded-lg bg-muted/50 resize-none"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          长度：{{ decryptedData.length }}
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="decryptData"
        :disabled="!canDecrypt"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        解密数据
      </button>
      <button
        @click="autoDetectFormat"
        :disabled="!encryptedData"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
      >
        自动检测格式
      </button>
    </div>

    <!-- 解密状态 -->
    <div v-if="decryptStatus" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">解密状态</h3>
      <div class="flex items-center gap-3" :class="decryptStatus.success ? 'text-green-600' : 'text-red-600'">
        <svg v-if="decryptStatus.success" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <div>
          <div class="font-medium">{{ decryptStatus.success ? '解密成功' : '解密失败' }}</div>
          <div class="text-sm">{{ decryptStatus.message }}</div>
        </div>
      </div>
    </div>

    <!-- AES解密说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">AES解密说明</h3>
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-primary mb-2">解密要求</h4>
          <ul class="text-sm space-y-1">
            <li>• 密钥必须与加密时使用的密钥完全一致</li>
            <li>• 工作模式、填充方式必须与加密时相同</li>
            <li>• CBC、CFB、OFB、GCM模式需要正确的初始向量(IV)</li>
            <li>• 输入数据格式必须正确（Base64或Hex编码）</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">常见错误</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 class="font-medium text-amber-600 mb-1">Wrong padding</h5>
              <p class="text-muted-foreground">填充方式不正确或密钥错误</p>
            </div>
            <div>
              <h5 class="font-medium text-amber-600 mb-1">Invalid data</h5>
              <p class="text-muted-foreground">输入格式错误或数据损坏</p>
            </div>
            <div>
              <h5 class="font-medium text-amber-600 mb-1">Bad key length</h5>
              <p class="text-muted-foreground">密钥长度与设置不符</p>
            </div>
            <div>
              <h5 class="font-medium text-amber-600 mb-1">Empty result</h5>
              <p class="text-muted-foreground">解密结果为空，可能是密钥错误</p>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">安全建议</h4>
          <ul class="text-sm space-y-1 text-amber-600">
            <li>• 密钥应通过安全渠道传输，不要明文发送</li>
            <li>• 解密后及时清除内存中的敏感数据</li>
            <li>• 使用强密钥（至少AES-256）</li>
            <li>• 定期更换密钥以提高安全性</li>
          </ul>
        </div>
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
import { ref, computed } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'
import CryptoJS from 'crypto-js'



const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const encryptedData = ref('')
const decryptedData = ref('')
const secretKey = ref('')
const iv = ref('')
const keySize = ref('256')
const mode = ref('CBC')
const padding = ref('PKCS7')
const inputFormat = ref('base64')
const fileInput = ref(null)
const copyButtonText = ref('复制')
const decryptStatus = ref(null)

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'aes-decrypt'
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

// 是否可以解密
const canDecrypt = computed(() => {
  return encryptedData.value &&
         secretKey.value &&
         secretKey.value.length * 8 === Number(keySize) &&
         (mode.value === 'ECB' || (iv.value && iv.value.length === 16))
})

// 自动检测格式
const autoDetectFormat = () => {
  if (!encryptedData.value) return

  // 简单的格式检测
  const data = encryptedData.value.trim()

  // 检测Base64
  if (data.match(/^[A-Za-z0-9+/]*={0,2}$/) && data.length % 4 === 0) {
    inputFormat.value = 'base64'
    alert('检测为Base64格式')
    return
  }

  // 检测Hex
  if (data.match(/^[0-9A-Fa-f]+$/) && data.length % 2 === 0) {
    inputFormat.value = 'hex'
    alert('检测为Hex格式')
    return
  }

  // 默认UTF-8
  inputFormat.value = 'utf8'
  alert('无法自动检测，使用UTF-8格式')
}

// 解密数据
const decryptData = () => {
  try {
    if (!canDecrypt.value) {
      decryptStatus.value = {
        success: false,
        message: '请检查密钥和IV设置'
      }
      return
    }

    // 准备配置
    const config = {
      mode: getMode(),
      padding: getPadding()
    }

    // 添加IV（ECB模式不需要）
    if (mode.value !== 'ECB') {
      config.iv = CryptoJS.enc.Hex.parse(iv.value)
    }

    // 根据输入格式处理数据
    let encrypted
    switch (inputFormat.value) {
      case 'base64':
        encrypted = CryptoJS.enc.Base64.parse(encryptedData.value)
        break
      case 'hex':
        encrypted = CryptoJS.enc.Hex.parse(encryptedData.value)
        break
      case 'utf8':
        encrypted = CryptoJS.enc.Utf8.parse(encryptedData.value)
        break
    }

    // 解密
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encrypted },
      CryptoJS.enc.Hex.parse(secretKey.value),
      config
    )

    const result = decrypted.toString(CryptoJS.enc.Utf8)

    if (result) {
      decryptedData.value = result
      decryptStatus.value = {
        success: true,
        message: '解密成功'
      }
    } else {
      decryptedData.value = ''
      decryptStatus.value = {
        success: false,
        message: '解密失败，可能是密钥或参数不正确'
      }
    }
  } catch (error) {
    decryptedData.value = ''
    decryptStatus.value = {
      success: false,
      message: '解密错误：' + error.message
    }
  }
}

// 获取加密模式
const getMode = () => {
  const modes = {
    'CBC': CryptoJS.mode.CBC,
    'ECB': CryptoJS.mode.ECB,
    'CFB': CryptoJS.mode.CFB,
    'OFB': CryptoJS.mode.OFB,
    'CTR': CryptoJS.mode.CTR,
    'GCM': CryptoJS.mode.GCM
  }
  return modes[mode.value] || CryptoJS.mode.CBC
}

// 获取填充方式
const getPadding = () => {
  const paddings = {
    'PKCS7': CryptoJS.pad.Pkcs7,
    'ISO97971': CryptoJS.pad.Iso97971,
    'ANSIX923': CryptoJS.pad.AnsiX923,
    'ZERO': CryptoJS.pad.ZeroPadding,
    'NO_PADDING': CryptoJS.pad.NoPadding
  }
  return paddings[padding.value] || CryptoJS.pad.Pkcs7
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    encryptedData.value = e.target.result
  }
  reader.readAsText(file)
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    copyButtonText.value = '已复制'
    setTimeout(() => {
      copyButtonText.value = '复制'
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载结果
const downloadResult = () => {
  if (!decryptedData.value) return

  const content = `解密算法: AES-${keySize}-${mode}\n密钥长度: ${keySize}位\n${mode !== 'ECB' ? `IV: ${iv.value}\n` : ''}输入格式: ${inputFormat.value}\n\n解密结果:\n${decryptedData.value}\n\n解密时间: ${new Date().toLocaleString()}`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aes-decrypted-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 清空操作
const clearInput = () => {
  encryptedData.value = ''
  decryptedData.value = ''
  decryptStatus.value = null
}

const clearKey = () => {
  secretKey.value = ''
  decryptedData.value = ''
  decryptStatus.value = null
}

const clearIV = () => {
  iv.value = ''
  decryptedData.value = ''
  decryptStatus.value = null
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('aes-decrypt')

// SEO配置
useSeoMeta({
  title: 'AES解密 - 在线AES数据解密工具',
  description: '免费在线AES解密工具，支持AES-128/192/256，多种工作模式，快速解密AES加密的数据。',
  keywords: ['AES', '解密', '对称解密', 'AES-256', 'AES-128']
})

</script>