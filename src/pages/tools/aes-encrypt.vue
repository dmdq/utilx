<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">AES加密解密</h1>
      <p class="text-muted-foreground max-w-3xl">高级加密标准(AES)在线加密解密工具，支持AES-128、AES-192、AES-256，多种工作模式和填充方式。</p>
    </div>

    <!-- 加密设置 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">加密设置</h3>
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
          <label class="text-sm font-medium mb-2 block">输出格式</label>
          <select
            v-model="outputFormat"
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
              @click="generateKey"
              class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              生成密钥
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
              @click="generateIV"
              class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              生成IV
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
          <label class="text-lg font-semibold">原始文本</label>
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
                class="hidden"
              >
              <span class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                选择文件
              </span>
            </label>
          </div>
        </div>
        <textarea
          v-model="inputText"
          placeholder="请输入要加密的文本..."
          class="w-full h-64 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          字符数：{{ inputText.length }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">加密结果</label>
          <div class="flex items-center gap-2">
            <button
              @click="copyToClipboard(outputText)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              {{ copyButtonText }}
            </button>
            <button
              @click="downloadResult"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors"
            >
              下载
            </button>
          </div>
        </div>
        <textarea
          v-model="outputText"
          placeholder="加密结果将显示在这里..."
          readonly
          class="w-full h-64 p-4 border border-border border-border rounded-lg bg-muted/50 resize-none font-mono text-sm"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          长度：{{ outputText.length }}
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="encryptData"
        :disabled="!canEncrypt"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        加密
      </button>
      <button
        @click="decryptData"
        :disabled="!canDecrypt"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        解密
      </button>
      <button
        @click="swapData"
        class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        交换数据
      </button>
    </div>

    <!-- 解密结果 -->
    <div v-if="decryptedText !== null" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">解密结果</h3>
      <div class="bg-muted/50 rounded-lg p-4">
        <pre class="whitespace-pre-wrap text-sm">{{ decryptedText }}</pre>
      </div>
    </div>

    <!-- AES算法说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于AES加密</h3>
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-primary mb-2">算法特点</h4>
          <ul class="text-sm space-y-1">
            <li>• 对称加密算法，加密和解密使用相同的密钥</li>
            <li>• 支持128、192、256位密钥长度</li>
            <li>• 分组加密，块大小固定为128位</li>
            <li>• 安全性高，被美国政府批准用于机密信息的加密</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">工作模式说明</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 class="font-medium mb-1">CBC模式</h5>
              <p class="text-muted-foreground">每个明文块先与前一个密文块进行异或操作，再加密</p>
            </div>
            <div>
              <h5 class="font-medium mb-1">ECB模式</h5>
              <p class="text-muted-foreground">相同的明文块会产生相同的密文块，安全性较低</p>
            </div>
            <div>
              <h5 class="font-medium mb-1">CTR模式</h5>
              <p class="text-muted-foreground">将计数器加密后与明文异或，无需填充，可并行处理</p>
            </div>
            <div>
              <h5 class="font-medium mb-1">GCM模式</h5>
              <p class="text-muted-foreground">提供认证加密，同时保证机密性和完整性</p>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">安全注意事项</h4>
          <ul class="text-sm space-y-1 text-amber-600">
            <li>• 密钥必须保密，不要在不安全的通道传输</li>
            <li>• ECB模式不安全，仅用于特殊场景</li>
            <li>• CBC、CFB、OFB模式需要随机且唯一的IV</li>
            <li>• 建议使用GCM模式或带认证的加密方案</li>
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
const inputText = ref('')
const outputText = ref('')
const decryptedText = ref(null)
const secretKey = ref('')
const iv = ref('')
const keySize = ref('256')
const mode = ref('CBC')
const padding = ref('PKCS7')
const outputFormat = ref('base64')
const fileInput = ref(null)
const copyButtonText = ref('复制')

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'aes-encrypt'
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

// 是否可以加密
const canEncrypt = computed(() => {
  return inputText.value &&
         secretKey.value &&
         secretKey.value.length * 8 === Number(keySize) &&
         (mode.value === 'ECB' || (iv.value && iv.value.length === 16))
})

// 是否可以解密
const canDecrypt = computed(() => {
  return outputText.value &&
         secretKey.value &&
         secretKey.value.length * 8 === Number(keySize) &&
         (mode.value === 'ECB' || (iv.value && iv.value.length === 16))
})

// 生成密钥
const generateKey = () => {
  const bytes = Number(keySize) / 8
  const key = CryptoJS.lib.WordArray.random(bytes)
  secretKey.value = CryptoJS.enc.Hex.stringify(key)
}

// 生成IV
const generateIV = () => {
  const ivBytes = CryptoJS.lib.WordArray.random(16)
  iv.value = CryptoJS.enc.Hex.stringify(ivBytes)
}

// 加密数据
const encryptData = () => {
  try {
    if (!canEncrypt.value) {
      alert('请检查密钥和IV设置')
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

    // 加密
    const encrypted = CryptoJS.AES.encrypt(
      inputText.value,
      CryptoJS.enc.Hex.parse(secretKey.value),
      config
    )

    // 格式化输出
    switch (outputFormat.value) {
      case 'base64':
        outputText.value = encrypted.toString()
        break
      case 'hex':
        outputText.value = encrypted.ciphertext.toString(CryptoJS.enc.Hex)
        break
      case 'utf8':
        outputText.value = encrypted.toString(CryptoJS.enc.Utf8)
        break
    }

    decryptedText.value = null
  } catch (error) {
    alert('加密失败：' + error.message)
  }
}

// 解密数据
const decryptData = () => {
  try {
    if (!canDecrypt.value) {
      alert('请检查密钥和IV设置')
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

    // 解密
    const decrypted = CryptoJS.AES.decrypt(
      outputText.value,
      CryptoJS.enc.Hex.parse(secretKey.value),
      config
    )

    decryptedText.value = decrypted.toString(CryptoJS.enc.Utf8)

    if (!decryptedText.value) {
      alert('解密失败，可能是密钥或IV不正确')
    }
  } catch (error) {
    alert('解密失败：' + error.message)
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

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  decryptedText.value = null
}

// 交换数据
const swapData = () => {
  const temp = inputText.value
  inputText.value = decryptedText.value || ''
  decryptedText.value = temp
}

// 下载结果
const downloadResult = () => {
  if (!outputText.value) return

  const content = `加密算法: AES-${keySize}-${mode}\n密钥: ${secretKey.value}\n${mode !== 'ECB' ? `IV: ${iv.value}\n` : ''}加密结果 (${outputFormat.value}): ${outputText.value}\n生成时间: ${new Date().toLocaleString()}`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `aes-encrypted-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    inputText.value = e.target.result
  }
  reader.readAsText(file)
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('aes-encrypt')

// SEO配置
useSeoMeta({
  title: 'AES加密解密 - 在线AES加密工具',
  description: '免费在线AES加密解密工具，支持AES-128/192/256，多种工作模式和填充方式。',
  keywords: ['AES', '加密', '解密', '对称加密', 'AES-256', 'AES-128']
})

</script>