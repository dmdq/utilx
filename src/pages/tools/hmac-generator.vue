<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">HMAC生成器</h1>
      <p class="text-muted-foreground max-w-3xl">HMAC（Hash-based Message Authentication Code）在线生成器，支持多种哈希算法，用于消息认证和完整性验证。</p>
    </div>

    <!-- 算法选择 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">算法设置</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="text-sm font-medium mb-2 block">哈希算法</label>
          <select
            v-model="hashAlgorithm"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="SHA-1">HMAC-SHA1 (160位)</option>
            <option value="SHA-256">HMAC-SHA256 (256位) - 推荐</option>
            <option value="SHA-384">HMAC-SHA384 (384位)</option>
            <option value="SHA-512">HMAC-SHA512 (512位)</option>
            <option value="MD5">HMAC-MD5 (128位) - 不推荐</option>
          </select>
          <div class="mt-2 text-xs text-muted-foreground">
            推荐：SHA-256或更高
          </div>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">输出格式</label>
          <select
            v-model="outputFormat"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="hex">十六进制 (Hex)</option>
            <option value="base64">Base64</option>
            <option value="base64url">Base64 URL安全</option>
            <option value="binary">二进制</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 密钥输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">密钥 (Secret Key)</label>
          <div class="flex items-center gap-2">
            <button
              @click="generateRandomKey"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors"
            >
              生成随机密钥
            </button>
            <button
              @click="clearKey"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          v-model="secretKey"
          placeholder="请输入HMAC密钥..."
          class="w-full h-32 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          密钥长度：{{ secretKey.length }} 字符
          <span v-if="hashAlgorithm === 'SHA-256' && secretKey.length < 32" class="text-amber-600 ml-2">
            (建议至少32字符)
          </span>
        </div>
      </div>

      <!-- 消息输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">消息 (Message)</label>
          <div class="flex items-center gap-2">
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
            <button
              @click="clearMessage"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          v-model="message"
          placeholder="请输入要计算HMAC的消息..."
          class="w-full h-32 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          消息长度：{{ message.length }} 字符
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="generateHmac"
        :disabled="!secretKey || !message"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        生成HMAC
      </button>
      <button
        @click="verifyHmac"
        :disabled="!secretKey || !message || !hmacResult"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        验证HMAC
      </button>
      <button
        @click="swapData"
        class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        交换数据
      </button>
    </div>

    <!-- HMAC结果 -->
    <div v-if="hmacResult" class="border border-border rounded-lg p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">
          HMAC-{{ hashAlgorithm.replace('SHA-', '') }} 结果
        </h3>
        <div class="flex items-center gap-2">
          <button
            @click="copyToClipboard(hmacResult)"
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
      <div class="bg-muted/50 rounded-lg p-4">
        <pre class="text-sm font-mono break-all">{{ hmacResult }}</pre>
      </div>
      <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-muted-foreground">算法：</span>
          <span>HMAC-{{ hashAlgorithm }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">输出长度：</span>
          <span>{{ hmacResult.length * 8 / 2 }} 位</span>
        </div>
        <div>
          <span class="text-muted-foreground">格式：</span>
          <span>{{ outputFormat.toUpperCase() }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">字符数：</span>
          <span>{{ hmacResult.length }}</span>
        </div>
      </div>
    </div>

    <!-- 验证结果 -->
    <div v-if="verificationResult" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">验证结果</h3>
      <div v-if="verificationResult.valid" class="flex items-center gap-3 text-green-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <div class="font-medium">HMAC验证成功</div>
          <div class="text-sm">消息完整性得到保证</div>
        </div>
      </div>
      <div v-else class="flex items-center gap-3 text-red-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <div>
          <div class="font-medium">HMAC验证失败</div>
          <div class="text-sm">消息可能被篡改或密钥不正确</div>
        </div>
      </div>
    </div>

    <!-- 批量生成 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">批量生成HMAC</h3>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">消息列表（每行一条）</label>
          <textarea
            v-model="batchMessages"
            placeholder="输入多条消息，每行一条..."
            class="w-full h-32 p-3 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>
        </div>
        <button
          @click="batchGenerate"
          :disabled="!secretKey || !batchMessages"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          批量生成
        </button>
        <div v-if="batchResults.length > 0" class="mt-4">
          <h4 class="font-medium mb-2">批量生成结果</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border">
              <thead class="bg-muted/50">
                <tr>
                  <th class="border border-border px-4 py-2 text-left">#</th>
                  <th class="border border-border px-4 py-2 text-left">消息</th>
                  <th class="border border-border px-4 py-2 text-left">HMAC</th>
                  <th class="border border-border px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(result, index) in batchResults" :key="index" class="border-b border-border">
                  <td class="border border-border px-4 py-2">{{ index + 1 }}</td>
                  <td class="border border-border px-4 py-2 max-w-xs truncate">{{ result.message }}</td>
                  <td class="border border-border px-4 py-2">
                    <code class="text-xs">{{ result.hmac.substring(0, 40) }}...</code>
                  </td>
                  <td class="border border-border px-4 py-2">
                    <button
                      @click="copyToClipboard(result.hmac)"
                      class="text-primary hover:text-primary/80 text-sm"
                    >
                      复制
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- HMAC知识库 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于HMAC</h3>
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-primary mb-2">什么是HMAC？</h4>
          <p class="text-sm text-muted-foreground">
            HMAC（Hash-based Message Authentication Code）是一种使用密码学哈希函数和密钥来生成消息认证码的机制。
            它可以验证消息的完整性和真实性，防止消息在传输过程中被篡改。
          </p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">HMAC特点</h4>
          <ul class="text-sm space-y-1">
            <li>• 使用密钥进行认证，防止伪造</li>
            <li>• 基于安全的哈希函数（SHA-256等）</li>
            <li>• 长度固定，与消息长度无关</li>
            <li>• 计算速度快，适合大规模使用</li>
            <li>• 抗碰撞性，难以伪造相同HMAC的不同消息</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">HMAC计算公式</h4>
          <div class="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            HMAC(K, m) = H((K ⊕ opad) || H((K ⊕ ipad) || m))
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            其中：K是密钥，m是消息，H是哈希函数，⊕是异或，||是连接，ipad和opad是常量
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">应用场景</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 class="font-medium mb-1">API认证</h5>
              <p class="text-muted-foreground">验证API请求的合法性</p>
            </div>
            <div>
              <h5 class="font-medium mb-1">数据完整性</h5>
              <p class="text-muted-foreground">确保数据未被篡改</p>
            </div>
            <div>
              <h5 class="font-medium mb-1">JWT签名</h5>
              <p class="text-muted-foreground">JSON Web Token的签名方案</p>
            </div>
            <div>
              <h5 class="font-medium mb-1">支付验证</h5>
              <p class="text-muted-foreground">支付网关的请求验证</p>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">安全最佳实践</h4>
          <ul class="text-sm space-y-1 text-amber-600">
            <li>• 使用足够长度的密钥（至少32字节）</li>
            <li>• 优先使用SHA-256或更强的哈希算法</li>
            <li>• 密钥应随机生成并妥善保管</li>
            <li>• 定期轮换密钥以提高安全性</li>
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
import { ref } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'



const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const secretKey = ref('')
const message = ref('')
const hashAlgorithm = ref('SHA-256')
const outputFormat = ref('hex')
const hmacResult = ref('')
const verificationResult = ref(null)
const batchMessages = ref('')
const batchResults = ref([])
const copyButtonText = ref('复制')
const fileInput = ref(null)

// 相关工具
const relatedTools = tools.filter(tool =>
  tool.category === 'crypto' &&
  tool.id !== 'hmac-generator'
).slice(0, 4)

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

// 生成HMAC
const generateHmac = async () => {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey.value)
    const messageData = encoder.encode(message.value)

    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: hashAlgorithm.value } },
      false,
      ['sign', 'verify']
    )

    // 生成HMAC
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)

    // 转换为指定格式
    const hashArray = Array.from(new Uint8Array(signature))

    switch (outputFormat.value) {
      case 'hex':
        hmacResult.value = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        break
      case 'base64':
        hmacResult.value = btoa(String.fromCharCode(...hashArray))
        break
      case 'base64url':
        const base64 = btoa(String.fromCharCode(...hashArray))
        hmacResult.value = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
        break
      case 'binary':
        hmacResult.value = String.fromCharCode(...hashArray)
        break
    }
  } catch (error) {
    alert('HMAC生成失败：' + error.message)
  }
}

// 验证HMAC
const verifyHmac = async () => {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey.value)
    const messageData = encoder.encode(message.value)

    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: hashAlgorithm.value } },
      false,
      ['sign', 'verify']
    )

    // 将结果转换回ArrayBuffer
    let signature
    switch (outputFormat.value) {
      case 'hex':
        signature = new Uint8Array(hmacResult.value.match(/.{2}/g).map(byte => parseInt(byte, 16)))
        break
      case 'base64':
        const binaryString = atob(hmacResult.value)
        signature = new Uint8Array(binaryString.length).map((_, i) => binaryString.charCodeAt(i))
        break
      case 'base64url':
        const base64 = hmacResult.value.replace(/-/g, '+').replace(/_/g, '/')
        const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4)
        const binaryStr = atob(paddedBase64)
        signature = new Uint8Array(binaryStr.length).map((_, i) => binaryStr.charCodeAt(i))
        break
      case 'binary':
        signature = new TextEncoder().encode(hmacResult.value)
        break
    }

    // 验证HMAC
    const isValid = await crypto.subtle.verify('HMAC', cryptoKey, signature.buffer, messageData)
    verificationResult.value = { valid: isValid }
  } catch (error) {
    alert('HMAC验证失败：' + error.message)
  }
}

// 批量生成
const batchGenerate = async () => {
  if (!secretKey.value || !batchMessages.value) return

  const messages = batchMessages.value.split('\n').filter(m => m.trim())
  const results = []

  for (const msg of messages) {
    if (msg.trim()) {
      try {
        const encoder = new TextEncoder()
        const keyData = encoder.encode(secretKey.value)
        const messageData = encoder.encode(msg.trim())

        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: { name: hashAlgorithm.value } },
          false,
          ['sign']
        )

        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
        const hashArray = Array.from(new Uint8Array(signature))
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        results.push({ message: msg.trim(), hmac: hash })
      } catch (error) {
        console.error('批量生成失败:', error)
      }
    }
  }

  batchResults.value = results
}

// 生成随机密钥
const generateRandomKey = () => {
  const bytes = 32
  const randomBytes = new Uint8Array(bytes)
  crypto.getRandomValues(randomBytes)
  secretKey.value = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('')
}

// 处理文件上传
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    message.value = e.target.result
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
  if (!hmacResult.value) return

  const content = `算法: HMAC-${hashAlgorithm.value}\n消息: ${message.value}\n密钥: ${secretKey.value}\nHMAC: ${hmacResult.value}\n格式: ${outputFormat.value}\n生成时间: ${new Date().toLocaleString()}`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hmac-${hashAlgorithm.value}-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 清空操作
const clearKey = () => {
  secretKey.value = ''
  hmacResult.value = ''
  verificationResult.value = null
}

const clearMessage = () => {
  message.value = ''
  hmacResult.value = ''
  verificationResult.value = null
}

const swapData = () => {
  const temp = secretKey.value
  secretKey.value = message.value
  message.value = temp
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('hmac-generator')

// SEO配置
useSeoMeta({
  title: 'HMAC生成器 - 在线HMAC哈希计算工具',
  description: '免费在线HMAC生成器，支持SHA-1/SHA-256/SHA-512等多种算法，用于消息认证和完整性验证。',
  keywords: ['HMAC', '消息认证码', 'SHA', '哈希', '认证', '完整性验证']
})

</script>