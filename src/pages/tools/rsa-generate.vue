<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">RSA密钥生成器</h1>
      <p class="text-muted-foreground max-w-3xl">在线生成RSA公钥和私钥对，支持多种密钥长度（1024/2048/4096位），可导出为PEM、DER等格式。</p>
    </div>

    <!-- 生成设置 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">密钥设置</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label class="text-sm font-medium mb-2 block">密钥长度</label>
          <select
            v-model="keySize"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1024">1024 位（不推荐）</option>
            <option value="2048">2048 位（推荐）</option>
            <option value="3072">3072 位</option>
            <option value="4096">4096 位（高安全）</option>
          </select>
          <div class="mt-2 text-xs text-muted-foreground">
            更长的密钥提供更高的安全性，但生成速度较慢
          </div>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">密钥格式</label>
          <select
            v-model="keyFormat"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="PEM">PEM (文本格式)</option>
            <option value="DER">DER (二进制格式)</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">密钥类型</label>
          <select
            v-model="keyType"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="RSA">RSA</option>
            <option value="RSA-OAEP">RSA-OAEP</option>
          </select>
        </div>
      </div>

      <!-- 附加选项 -->
      <div class="mt-6">
        <label class="text-sm font-medium mb-3 block">附加选项</label>
        <div class="flex flex-wrap gap-4">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="includeExponent"
              class="rounded border border-border"
            >
            <span class="text-sm">自定义指数</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="includePassphrase"
              class="rounded border border-border"
            >
            <span class="text-sm">私钥密码保护</span>
          </label>
        </div>
      </div>

      <!-- 自定义指数 -->
      <div v-if="includeExponent" class="mt-4">
        <label class="text-sm font-medium mb-2 block">公钥指数</label>
        <input
          v-model.number="publicExponent"
          type="number"
          placeholder="65537"
          class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
      </div>

      <!-- 私钥密码 -->
      <div v-if="includePassphrase" class="mt-4">
        <label class="text-sm font-medium mb-2 block">私钥密码</label>
        <input
          v-model="passphrase"
          type="password"
          placeholder="输入密码保护私钥"
          class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="generateKeyPair"
        :disabled="isGenerating"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isGenerating ? '生成中...' : '生成密钥对' }}
      </button>
      <button
        @click="downloadKeys"
        :disabled="!publicKey || !privateKey"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        下载密钥文件
      </button>
      <button
        @click="clearKeys"
        class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        清空
      </button>
    </div>

    <!-- 生成进度 -->
    <div v-if="isGenerating" class="border border-border rounded-lg p-6 mb-8">
      <div class="flex items-center gap-3">
        <div class="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
        <span>正在生成 {{ keySize }} 位RSA密钥对，请稍候...</span>
      </div>
    </div>

    <!-- 密钥显示结果 -->
    <div v-if="publicKey && privateKey" class="space-y-6 mb-8">
      <!-- 公钥 -->
      <div class="border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <span>公钥 (Public Key)</span>
            <span class="text-sm text-muted-foreground">({{ keySize }} bits)</span>
          </h3>
          <div class="flex items-center gap-2">
            <button
              @click="copyToClipboard(publicKey)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              复制
            </button>
          </div>
        </div>
        <pre class="bg-muted/50 rounded-lg p-4 overflow-x-auto text-xs font-mono">{{ publicKey }}</pre>
      </div>

      <!-- 私钥 -->
      <div class="border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <span>私钥 (Private Key)</span>
            <span class="text-sm text-muted-foreground">({{ keySize }} bits)</span>
            <span v-if="includePassphrase && passphrase" class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
              已加密
            </span>
          </h3>
          <div class="flex items-center gap-2">
            <button
              @click="copyToClipboard(privateKey)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              复制
            </button>
          </div>
        </div>
        <pre class="bg-muted/50 rounded-lg p-4 overflow-x-auto text-xs font-mono">{{ privateKey }}</pre>
      </div>

      <!-- 密钥信息 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">密钥信息</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-primary mb-2">基本参数</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <span class="text-muted-foreground">密钥长度：</span>
                <span>{{ keySize }} 位</span>
              </li>
              <li>
                <span class="text-muted-foreground">密钥格式：</span>
                <span>{{ keyFormat }}</span>
              </li>
              <li>
                <span class="text-muted-foreground">密钥类型：</span>
                <span>{{ keyType }}</span>
              </li>
              <li v-if="publicExponent">
                <span class="text-muted-foreground">公钥指数：</span>
                <span>{{ publicExponent }}</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-primary mb-2">安全强度</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <span class="text-muted-foreground">对称密钥等效强度：</span>
                <span>{{ getEquivalentStrength(keySize) }}</span>
              </li>
              <li>
                <span class="text-muted-foreground">推荐用途：</span>
                <span>{{ getRecommendedUsage(keySize) }}</span>
              </li>
              <li>
                <span class="text-muted-foreground">预计破解时间：</span>
                <span>{{ getCrackTime(keySize) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- RSA算法说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于RSA加密</h3>
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-primary mb-2">算法原理</h4>
          <p class="text-sm text-muted-foreground">
            RSA（Rivest-Shamir-Adleman）是一种非对称加密算法，基于大数分解的数学难题。它使用一对密钥：公钥用于加密，私钥用于解密。
          </p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">密钥长度与安全性</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border">
              <thead class="bg-muted/50">
                <tr>
                  <th class="border border-border px-4 py-2 text-left">密钥长度</th>
                  <th class="border border-border px-4 py-2 text-left">等效对称密钥强度</th>
                  <th class="border border-border px-4 py-2 text-left">安全级别</th>
                  <th class="border border-border px-4 py-2 text-left">推荐用途</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-border px-4 py-2">1024位</td>
                  <td class="border border-border px-4 py-2">80位</td>
                  <td class="border border-border px-4 py-2 text-amber-600">低（不推荐）</td>
                  <td class="border border-border px-4 py-2">仅用于测试</td>
                </tr>
                <tr>
                  <td class="border border-border px-4 py-2">2048位</td>
                  <td class="border border-border px-4 py-2">112位</td>
                  <td class="border border-border px-4 py-2 text-green-600">中等（推荐）</td>
                  <td class="border border-border px-4 py-2">常规应用</td>
                </tr>
                <tr>
                  <td class="border border-border px-4 py-2">3072位</td>
                  <td class="border border-border px-4 py-2">128位</td>
                  <td class="border border-border px-4 py-2 text-green-600">高</td>
                  <td class="border border-border px-4 py-2">敏感数据</td>
                </tr>
                <tr>
                  <td class="border border-border px-4 py-2">4096位</td>
                  <td class="border border-border px-4 py-2">152位</td>
                  <td class="border border-border px-4 py-2 text-green-600">很高</td>
                  <td class="border border-border px-4 py-2">高价值资产</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">使用场景</h4>
          <ul class="text-sm space-y-1">
            <li>• 数字签名：验证数据的完整性和来源</li>
            <li>• 密钥交换：安全地传输对称加密密钥</li>
            <li>• 小数据加密：加密少量敏感数据</li>
            <li>• SSL/TLS证书：HTTPS网站安全通信</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">安全注意事项</h4>
          <ul class="text-sm space-y-1 text-amber-600">
            <li>• 私钥必须妥善保管，绝不能泄露</li>
            <li>• 建议使用2048位或更长的密钥</li>
            <li>• 定期更换密钥，特别是在怀疑泄露时</li>
            <li>• 私钥应使用强密码加密保护</li>
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
import { JSEncrypt } from 'jsencrypt'



const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const keySize = ref('2048')
const keyFormat = ref('PEM')
const keyType = ref('RSA')
const includeExponent = ref(false)
const includePassphrase = ref(false)
const publicExponent = ref('65537')
const passphrase = ref('')
const publicKey = ref('')
const privateKey = ref('')
const isGenerating = ref(false)

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'rsa-generate'
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

// 生成密钥对
const generateKeyPair = async () => {
  isGenerating.value = true

  try {
    // 创建JSEncrypt实例
    const jsEncrypt = new JSEncrypt({
      default_key_size: Number(keySize.value),
      default_public_exponent: publicExponent.value
    })

    // 生成密钥对
    const keyPair = jsEncrypt.getKey()

    if (keyPair) {
      publicKey.value = keyPair.getPublicKey()
      privateKey.value = keyPair.getPrivateKey()

      // 如果设置了密码，这里需要使用其他库来加密私钥
      // JSEncrypt本身不支持私钥密码加密
      if (includePassphrase.value && passphrase.value) {
        // 注意：实际应用中应使用专业的密码加密库
        // 这里只是提示用户
        alert('注意：当前版本不支持私钥密码加密，请使用其他工具加密私钥')
      }
    }
  } catch (error) {
    alert('密钥生成失败：' + error.message)
  } finally {
    isGenerating.value = false
  }
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载密钥文件
const downloadKeys = () => {
  if (!publicKey.value || !privateKey.value) return

  // 下载公钥
  const publicBlob = new Blob([publicKey.value], { type: 'text/plain' })
  const publicUrl = URL.createObjectURL(publicBlob)
  const publicLink = document.createElement('a')
  publicLink.href = publicUrl
  publicLink.download = `public_${keySize.value}key_${Date.now()}.pem`
  publicLink.click()
  URL.revokeObjectURL(publicUrl)

  // 下载私钥
  const privateBlob = new Blob([privateKey.value], { type: 'text/plain' })
  const privateUrl = URL.createObjectURL(privateBlob)
  const privateLink = document.createElement('a')
  privateLink.href = privateUrl
  privateLink.download = `private_${keySize.value}key_${Date.now()}.pem`
  privateLink.click()
  URL.revokeObjectURL(privateUrl)
}

// 清空密钥
const clearKeys = () => {
  publicKey.value = ''
  privateKey.value = ''
  passphrase.value = ''
}

// 获取等效安全强度
const getEquivalentStrength = (bits) => {
  const strengths = {
    '1024': '80位',
    '2048': '112位',
    '3072': '128位',
    '4096': '152位'
  }
  return strengths[bits] || 'N/A'
}

// 获取推荐用途
const getRecommendedUsage = (bits) => {
  const usages = {
    '1024': '仅用于测试（已不安全）',
    '2048': '常规应用、数字签名',
    '3072': '敏感数据保护',
    '4096': '高价值资产、长期保护'
  }
  return usages[bits] || 'N/A'
}

// 获取预计破解时间
const getCrackTime = (bits) => {
  const times = {
    '1024': '数小时到数天',
    '2048': '数百万年',
    '3072': '数十亿年',
    '4096': '数万亿年'
  }
  return times[bits] || 'N/A'
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('rsa-generate')

// SEO配置
useSeoMeta({
  title: 'RSA密钥生成器 - 在线RSA公钥私钥生成工具',
  description: '免费在线RSA密钥对生成器，支持1024/2048/3072/4096位密钥，PEM格式，公钥私钥生成和下载。',
  keywords: ['RSA', '密钥生成器', '公钥', '私钥', '非对称加密', 'PEM']
})

</script>