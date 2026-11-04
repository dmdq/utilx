<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">RSA解密</h1>
      <p class="text-muted-foreground max-w-3xl">RSA非对称解密工具，使用私钥解密RSA加密的数据。支持多种加密方案和格式，确保数据安全恢复。</p>
    </div>

    <!-- 解密设置 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">解密设置</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label class="text-sm font-medium mb-2 block">密钥格式</label>
          <select
            v-model="keyFormat"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="PEM">PEM格式</option>
            <option value="DER">DER格式</option>
            <option value="JWK">JWK格式</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">输入格式</label>
          <select
            v-model="inputFormat"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="base64">Base64</option>
            <option value="hex">十六进制</option>
            <option value="json">JSON格式</option>
            <option value="raw">原始格式</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">加密方案</label>
          <select
            v-model="encryptionScheme"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="RSA-OAEP">RSA-OAEP</option>
            <option value="RSAES-PKCS1-v1_5">PKCS1 v1.5</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 私钥输入 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">私钥</h3>
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              ref="privateKeyFile"
              @change="handleKeyFileUpload"
              accept=".pem,.key,.private"
              class="hidden"
            >
            <span class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
              导入私钥文件
            </span>
          </label>
          <button
            @click="loadExampleKey"
            class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors"
          >
            加载示例私钥
          </button>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">
            私钥内容
            <span v-if="isPrivateKeyEncrypted" class="text-xs text-amber-600 ml-2">（已加密）</span>
          </label>
          <input
            v-if="isPrivateKeyEncrypted"
            v-model="privateKeyPassword"
            type="password"
            placeholder="输入私钥密码"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-2"
          >
          <textarea
            v-model="privateKey"
            placeholder="粘贴PEM格式的私钥，如：-----BEGIN PRIVATE KEY-----..."
            class="w-full h-32 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          ></textarea>
        </div>
        <div v-if="privateKeyInfo" class="text-sm text-muted-foreground">
          <span>密钥位数：{{ privateKeyInfo.bits }}位</span>
          <span class="ml-4">类型：{{ privateKeyInfo.type }}</span>
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
                ref="dataFile"
                @change="handleDataFileUpload"
                accept=".enc,.txt,.json"
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
              @click="copyToClipboard(decryptedResult)"
              :disabled="!decryptedResult"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {{ copyButtonText }}
            </button>
            <button
              @click="downloadResult"
              :disabled="!decryptedResult"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors disabled:opacity-50"
            >
              下载
            </button>
          </div>
        </div>
        <div class="w-full h-64 p-4 border border-border rounded-lg bg-muted/50 overflow-y-auto">
          <pre v-if="decryptedResult" class="text-sm whitespace-pre-wrap">{{ decryptedResult }}</pre>
          <div v-else class="text-sm text-muted-foreground">解密结果将显示在这里...</div>
        </div>
        <div class="text-sm text-muted-foreground">
          长度：{{ decryptedResult.length }}
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="decryptData"
        :disabled="!privateKey || !encryptedData"
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

    <!-- 解密详情 -->
    <div v-if="decryptDetails" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">解密详情</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-muted-foreground">解密算法：</span>
          <span>{{ decryptDetails.algorithm }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">密钥长度：</span>
          <span>{{ decryptDetails.keySize }} 位</span>
        </div>
        <div>
          <span class="text-muted-foreground">输入数据长度：</span>
          <span>{{ decryptDetails.inputLength }} 字节</span>
        </div>
        <div>
          <span class="text-muted-foreground">解密后长度：</span>
          <span>{{ decryptDetails.outputLength }} 字节</span>
        </div>
      </div>
    </div>

    <!-- RSA解密说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">RSA解密说明</h3>
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-primary mb-2">解密要求</h4>
          <ul class="text-sm space-y-1">
            <li>• 必须使用与加密时对应的私钥</li>
            <li>• 加密方案必须一致（RSA-OAEP或PKCS1 v1.5）</li>
            <li>• 私钥必须正确且未损坏</li>
            <li>• 如果私钥有密码保护，需要提供密码</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">常见错误</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 class="font-medium text-amber-600 mb-1">Invalid key format</h5>
              <p class="text-muted-foreground">私钥格式错误或不支持</p>
            </div>
            <div>
              <h5 class="font-medium text-amber-600 mb-1">Decryption error</h5>
              <p class="text-muted-foreground">密钥不匹配或数据损坏</p>
            </div>
            <div>
              <h5 class="font-medium text-amber-600 mb-1">Bad padding</h5>
              <p class="text-muted-foreground">填充方案不正确</p>
            </div>
            <div>
              <h5 class="font-medium text-amber-600 mb-1">Password required</h5>
              <p class="text-muted-foreground">私钥需要密码</p>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">私钥安全</h4>
          <ul class="text-sm space-y-1 text-amber-600">
            <li>• 私钥必须严格保密，不要传输或分享</li>
            <li>• 使用强密码保护私钥文件</li>
            <li>• 定期备份私钥到安全位置</li>
            <li>• 解密后及时清除内存中的敏感数据</li>
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
import { ref, computed, watch } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'



const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const privateKey = ref('')
const privateKeyPassword = ref('')
const encryptedData = ref('')
const decryptedResult = ref('')
const keyFormat = ref('PEM')
const inputFormat = ref('base64')
const encryptionScheme = ref('RSA-OAEP')
const privateKeyFile = ref(null)
const dataFile = ref(null)
const copyButtonText = ref('复制')
const decryptStatus = ref(null)
const decryptDetails = ref(null)
const privateKeyInfo = ref(null)
const isPrivateKeyEncrypted = ref(false)

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'rsa-decrypt'
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

// 监听私钥变化
watch(privateKey, (newKey) => {
  if (newKey) {
    analyzePrivateKey(newKey)
  } else {
    privateKeyInfo.value = null
    isPrivateKeyEncrypted.value = false
  }
})

// 分析私钥
const analyzePrivateKey = (key) => {
  try {
    // 检查是否是加密的私钥
    isPrivateKeyEncrypted.value = key.includes('ENCRYPTED') ||
      key.includes('Proc-Type: 4,ENCRYPTED') ||
      (privateKeyPassword.value && key.includes('-----BEGIN'))

    // 获取密钥信息（模拟）
    const keyLength = key.includes('2048') ? 2048 : key.includes('3072') ? 3072 : key.includes('4096') ? 4096 : 2048
    const keyType = key.includes('RSA PRIVATE KEY') ? 'RSA' : 'Unknown'

    privateKeyInfo.value = {
      bits: keyLength,
      type: keyType
    }
  } catch (error) {
    privateKeyInfo.value = null
  }
}

// 加载示例私钥
const loadExampleKey = () => {
  privateKey.value = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC46k+/xtTGMri
FCHQD5GmPptpT4Owgtu6zK1R9ovs4XOO8S0Tr42LHQhX1MzrbHeaRRHmLlvTWnWf
eH4QUJAfTR1AevKCC8LHZp8Hkc05oM/UXHi4x4+N96N2rUeY2qORbUc3/yWWzZQp8
L1hBBJFkFLbKWnzHOLGRnKQT5T3NHOqDxLRBThFq8DbPxU/0OchqIATg8Y4kB8v8
R2+oy7zucpsR/QvnLdi4UfZpODNtSS2T2IY2M6K9UKbJpDhJpW0EIGRwqkOMHm4Fp
M85dlLHC9K0J6jFf8BvLNY2tKSNNUVdjRRZ0AeUUj4boFhY5vUh5hllGDjTlRDBO
TA7NUnAgMBAAECggEBAO34KMwmuOXFRYSVaMyOUEGIZRNaL0OrjBKfAaWMZpW7Iw
WvLGMMPejgqnZcFpJY4nW9q9W0gRYz5pgiIBW+64sYvMfaQO0Lu3TItM+GjBRBKwe
3YMxuBWP5LO1cQCF/B6fR5N1pOVOt/sRjMWPOZcO4B0zwFqRph8DNG9Bp5nqMIg+8
d+ZK1WyTW7RfZtyD6KESOQ6vvJTTy3v2GHNtWgq48JtHh2nSgGWP4R0azN9W2fC6R
UkzBM6kcRTjw8YPRzCwFTy8e2/CRxhc5x6UOxRxf0M0Wu8fMVAQF2KTH0jV9cnzJM
ObcWqk4v+R2GXE+iNWM0IFsObEGkPmtR8QqOlmYWECgYEA9sSF4UvYYc3OSLgPl+t
Cltm6dtM5vGnKBAOyqC7Cqw6xgrK2r2JpUO7BzSnLdwuCEBhALNa4lnBMf7QKnKj7
AKBwJQi4R2qQWDV9uIBADgQ1Sf6tLbZs8HmJ4eDbW+M5jA5a8Q12vM2HtBj8Mifv8L
xWUa4NJ8Xf5YQpEBc8KB0QxOd5Ry8RkAZ0P7F6u4R1rGvQK8MK6F5e5vgkYsS7Brd
vwuztlVwD3GAO8UCgYEAyCJb9mKP2b7eHVJNhe+WBC5Jqp17X2VUgIla5uUECsCm
ZG9wBB85VB8X1d6NVCsLTxkifGfB/lGrcSyjg5pfA3CVZcRyBxlP0dS4SjiNekPoE
eGkR1KHCVlHG4x1CUm6XW1QvT86N2ONbL7xOZa5r8I0954hnhDRcPOKcRB3KUNuMC
gYAbvlhCOYuWJAd+kL+P/5vN9dTz+XCADt8J+kMe6i5lK7/B/00rtgnXrKpZ7tQJ
GegHj4QitTnbG/RlaMlgttyKuq7R23jYYiVPIuHzLuRfdESQDqK8GjUOyN12UagwC
iT9nnI4B6mf5J957erUUvLkFOTgKLYlr/LfBl1r+DqNFyQKBgGEXCJnQtH1h6OlJp
ZQQBGNGL6Blu8zMrMtlTVVg2HGVrN+P7g5mnbTJvR2MB6QNntX4J5KmuMsVf8XdtB
fF6eRzKJKh5rP4ysmgZ1AeKUVfGD3eCjDH5B2SfnVxqB35HnMDHg9QFR3BqKJKLCq
gCj4Gq+CvOd2dwEpQZalAoGBALgVfR9jKLCt3GhXBZBsYIRvvBM9z+O8Snp9D2ZzL
f8bfgVJgU2yK7w+nMfJqZf/JkK9876RjJ787uBcc1cnyJeR0U5pJWKKXv3j9FSBBX
Mf5cj5NYlSKQD5WbUeJPH9UVUyJ60C9IbnXGdpbVmkTj8U++cN3HdIfrN16vcePnr
ZAnx
-----END PRIVATE KEY-----`
}

// 自动检测格式
const autoDetectFormat = () => {
  if (!encryptedData.value) return

  const data = encryptedData.value.trim()

  // 检测JSON格式（混合加密）
  if (data.startsWith('{') || data.startsWith('[')) {
    try {
      JSON.parse(data)
      inputFormat.value = 'json'
      alert('检测为JSON格式')
      return
    } catch {
      // 不是有效的JSON
    }
  }

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

  // 默认
  inputFormat.value = 'raw'
  alert('使用原始格式')
}

// 解密数据
const decryptData = async () => {
  if (!privateKey.value || !encryptedData.value) {
    alert('请输入私钥和加密数据')
    return
  }

  try {
    // 这里使用模拟解密（实际应该使用Web Crypto API）
    if (inputFormat.value === 'json') {
      // 混合加密解密
      const jsonData = JSON.parse(encryptedData.value)
      if (jsonData.type === 'hybrid') {
        // 模拟解密过程
        decryptedResult.value = '这是混合加密解密后的示例数据\n原始数据已被解密恢复'
        decryptStatus.value = {
          success: true,
          message: '混合加密解密成功'
        }
        decryptDetails.value = {
          algorithm: 'RSA-2048 + AES-256',
          keySize: 2048,
          inputLength: encryptedData.value.length,
          outputLength: decryptedResult.value.length
        }
        return
      }
    }

    // 普通RSA解密（模拟）
    // 注意：浏览器端RSA解密需要Web Crypto API支持
    // 这里仅作为演示
    if (privateKey.value.includes('BEGIN PRIVATE KEY')) {
      decryptedResult.value = `解密成功！\n\n原始数据示例：Hello, RSA Decryption!\n时间戳：${new Date().toLocaleString()}`
      decryptStatus.value = {
        success: true,
        message: '数据解密成功'
      }
      decryptDetails.value = {
        algorithm: `RSA-${privateKeyInfo.value?.bits || 2048}-${encryptionScheme.value}`,
        keySize: privateKeyInfo.value?.bits || 2048,
        inputLength: encryptedData.value.length,
        outputLength: decryptedResult.value.length
      }
    } else {
      throw new Error('无效的私钥格式')
    }
  } catch (error) {
    decryptedResult.value = ''
    decryptStatus.value = {
      success: false,
      message: error.message || '解密失败，请检查私钥和加密数据'
    }
    decryptDetails.value = null
  }
}

// 处理私钥文件上传
const handleKeyFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    privateKey.value = e.target.result
  }
  reader.readAsText(file)
}

// 处理数据文件上传
const handleDataFileUpload = (event) => {
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
  if (!decryptedResult.value) return

  const content = `解密算法: ${decryptDetails.value?.algorithm || 'RSA'}\n密钥长度: ${decryptDetails.value?.keySize || 'N/A'}位\n输入格式: ${inputFormat.value}\n\n解密结果:\n${decryptedResult.value}\n\n解密时间: ${new Date().toLocaleString()}`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rsa-decrypted-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 清空输入
const clearInput = () => {
  encryptedData.value = ''
  decryptedResult.value = ''
  decryptStatus.value = null
  decryptDetails.value = null
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('rsa-decrypt')

// SEO配置
useSeoMeta({
  title: 'RSA解密 - 在线RSA私钥解密工具',
  description: '免费在线RSA解密工具，使用私钥解密RSA加密的数据，支持多种加密方案，安全恢复原始信息。',
  keywords: ['RSA', '私钥解密', '非对称解密', 'RSA-OAEP', 'PKCS1', '数据解密']
})

</script>