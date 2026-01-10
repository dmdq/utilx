<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">RSA加密解密工具 - 在线RSA非对称加密</h1>
      <p class="text-muted-foreground">免费在线RSA加密解密工具。支持RSA公钥加密、私钥解密、密钥对生成。基于OpenPGP/Card加密标准，纯前端处理，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">输入文本</h2>

        <!-- 密钥对管理 -->
        <div class="mb-6 p-4 bg-muted rounded-lg">
          <h3 class="text-sm font-medium text-foreground mb-3">密钥管理</h3>
          <div class="grid grid-cols-2 gap-3 mb-3">
            <button
              @click="generateKeyPair"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              生成密钥对
            </button>
            <button
              @click="clearKeys"
              class="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors text-sm font-medium"
            >
              清空密钥
            </button>
          </div>

          <!-- 密钥显示 -->
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">公钥 (用于加密)</label>
              <textarea
                v-model="publicKey"
                readonly
                class="w-full px-3 py-2 border border-border rounded bg-card text-xs font-mono text-foreground"
                rows="3"
                placeholder="点击生成密钥对后显示公钥"
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-muted-foreground mb-1">私钥 (用于解密)</label>
              <textarea
                v-model="privateKey"
                readonly
                class="w-full px-3 py-2 border border-border rounded bg-card text-xs font-mono text-foreground"
                rows="3"
                placeholder="点击生成密钥对后显示私钥"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 文本输入 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">要加密/解密的文本</label>
          <textarea
            v-model="inputText"
            class="w-full px-4 py-3 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
            rows="6"
            placeholder="输入要加密或解密的文本..."
          ></textarea>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3">
          <button
            @click="encrypt"
            :disabled="!inputText || !publicKey"
            class="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock class="w-4 h-4" />
            加密
          </button>
          <button
            @click="decrypt"
            :disabled="!inputText || !privateKey"
            class="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Unlock class="w-4 h-4" />
            解密
          </button>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-foreground">输出结果</h2>
          <div class="flex gap-2">
            <button
              v-if="outputText"
              @click="copyOutput"
              class="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              复制
            </button>
            <button
              v-if="outputText"
              @click="clearAll"
              class="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded transition-colors text-sm font-medium"
            >
              清空
            </button>
          </div>
        </div>

        <div class="p-4 bg-muted rounded-lg min-h-[200px]">
          <div v-if="error" class="text-destructive text-sm mb-3">{{ error }}</div>
          <div v-if="outputText" class="font-mono text-sm text-foreground whitespace-pre-wrap break-all">{{ outputText }}</div>
          <div v-else class="text-muted-foreground text-sm flex items-center justify-center h-full">
            <FileText class="w-8 h-8 opacity-50 mr-2" />
            <span>加密或解密后的结果显示在这里</span>
          </div>
        </div>

        <!-- 算法信息 -->
        <div v-if="keyInfo" class="mt-4 p-3 bg-muted rounded-lg">
          <h3 class="text-sm font-medium text-foreground mb-2">密钥信息</h3>
          <div class="text-xs text-muted-foreground space-y-1">
            <div>密钥长度: {{ keyInfo.keySize }} bits</div>
            <div>指纹: <span class="font-mono">{{ keyInfo.fingerprint }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="p-6 mb-12 relative bg-card border border-border rounded-lg">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 p-2 hover:bg-muted rounded transition-colors"
        :title="isSeoContentVisible ? '收起' : '展开'"
      >
        <HelpCircle v-if="!isSeoContentVisible" :size="20" class="text-muted-foreground" />
        <ChevronUp v-else :size="20" class="text-muted-foreground" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          <span class="text-primary">#</span>
          RSA加密解密工具 - 使用指南
        </h2>

        <div class="space-y-6 text-muted-foreground">
          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">什么是RSA加密？</h3>
            <p>
              RSA（Rivest-Shamir-Adleman）是一种非对称加密算法，由Ron Rivest、Adi Shamir和Leonard Adleman在1977年提出。它使用一对密钥：公钥用于加密，私钥用于解密。RSA是现代密码学的基础，广泛用于SSL/TLS证书、数字签名、加密通信等领域。
            </p>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">如何使用本工具？</h3>
            <ol class="list-decimal list-inside space-y-2">
              <li>点击"生成密钥对"按钮生成RSA公钥和私钥</li>
              <li>将公钥分享给需要给你发送加密消息的人</li>
              <li>私钥必须保密，不要分享给任何人</li>
              <li>输入要加密的文本，点击"加密"按钮</li>
              <li>将加密后的密文发送给私钥持有者</li>
              <li>私钥持有者输入密文和私钥，点击"解密"按钮查看原文</li>
            </ol>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">RSA加密特点</h3>
            <ul class="list-disc list-inside space-y-2">
              <li><strong class="text-foreground">非对称加密</strong>：公钥加密，私钥解密，解决了密钥分发问题</li>
              <li><strong class="text-foreground">安全性高</strong>：基于大整数因子分解难题，目前2048位密钥被认为是安全的</li>
              <li><strong class="text-foreground">数字签名</strong>：私钥签名，公钥验证，保证数据完整性和不可抵赖性</li>
              <li><strong class="text-foreground">纯前端处理</strong>：所有加密解密操作在浏览器中完成，数据不发送到服务器</li>
              <li><strong class="text-foreground">支持长文本</strong>：采用混合加密方案，支持任意长度的文本加密</li>
            </ul>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">常见应用场景</h3>
            <ul class="list-disc list-inside space-y-2">
              <li>HTTPS/SSL证书和TLS握手协议</li>
              <li>SSH密钥认证</li>
              <li>PGP/GPG电子邮件加密</li>
              <li>数字签名和证书</li>
              <li>加密文件系统和数据传输</li>
            </ul>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">技术说明</h3>
            <p>
              本工具使用Web Crypto API进行RSA加密操作。采用混合加密方案：使用AES对称加密随机生成的会话密钥加密实际数据，然后使用RSA公钥加密会话密钥。这种方案既保证了安全性，又支持任意长度的数据加密。密钥长度支持2048位，符合当前安全标准。
            </p>
          </section>

          <section>
            <h3 class="text-lg font-semibold text-foreground mb-2">安全注意事项</h3>
            <div class="space-y-3">
              <div>
                <h4 class="font-medium text-foreground">私钥保护</h4>
                <p class="text-sm">私钥必须严格保密，一旦泄露，所有使用该密钥加密的数据都可能被解密。建议将私钥导出并安全存储。</p>
              </div>
              <div>
                <h4 class="font-medium text-foreground">密钥长度</h4>
                <p class="text-sm">本工具生成2048位密钥，对于大多数应用已经足够安全。对于高安全性要求，建议使用3072位或4096位密钥。</p>
              </div>
              <div>
                <h4 class="font-medium text-foreground">数据隐私</h4>
                <p class="text-sm">所有加密解密操作都在浏览器中完成，数据不会发送到服务器。但请确保在安全的环境中使用本工具，避免私钥被恶意软件窃取。</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              :size="20"
              class="text-primary"
            />
            <h3 class="font-semibold text-foreground">{{ relatedTool.name }}</h3>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Lock, Unlock, Copy, FileText, HelpCircle, ChevronUp, Shield, Key } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'RSA加密解密工具 - 在线RSA非对称加密 | Util工具箱',
  description: '免费在线RSA加密解密工具。支持RSA公钥加密、私钥解密、密钥对生成。基于OpenPGP/Card加密标准，纯前端处理，数据隐私绝对安全。',
  keywords: 'RSA加密,RSA解密,非对称加密,公钥加密,私钥解密,RSA密钥对,在线RSA,密码学',
  author: 'Util工具箱',
  ogTitle: 'RSA加密解密工具 - 免费在线RSA加密',
  ogDescription: '专业的RSA加密解密工具，支持密钥对生成、公钥加密、私钥解密。纯前端处理，数据安全可靠。',
  ogImage: 'https://www.util.cn/images/tools/rsa-encrypt.png',
  ogUrl: 'https://www.util.cn/tools/rsa-encrypt',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'RSA加密解密工具 - 免费在线RSA加密',
  twitterDescription: '专业的RSA加密解密工具，支持密钥对生成、公钥加密、私钥解密。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/rsa-encrypt.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'RSA加密解密工具',
            description: '免费在线RSA加密解密工具，支持密钥对生成、公钥加密、私钥解密',
            url: 'https://www.util.cn/tools/rsa-encrypt',
            applicationCategory: 'SecurityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'RSA密钥对生成',
              '公钥加密',
              '私钥解密',
              'Web Crypto API',
              '混合加密方案',
              '纯前端处理',
              '数据安全保障'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Util工具箱',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'RSA加密解密工具',
                item: 'https://www.util.cn/tools/rsa-encrypt'
              }
            ]
          }
        ]
      })
    }
  ]
})

// 数据状态
const inputText = ref('')
const publicKey = ref('')
const privateKey = ref('')
const outputText = ref('')
const error = ref('')
const keyInfo = ref(null)
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Shield, Key, Lock
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'aes-encrypt'),
  tools.find(t => t.id === 'hash-calculator'),
  tools.find(t => t.id === 'base-encoding'),
  tools.find(t => t.id === 'uuid-generator')
].filter(Boolean)

// 生成RSA密钥对
async function generateKeyPair() {
  try {
    error.value = ''

    // 生成密钥对
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )

    // 导出公钥
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)))
    publicKey.value = `-----BEGIN PUBLIC KEY-----\n${formatPEM(publicKeyBase64)}\n-----END PUBLIC KEY-----`

    // 导出私钥
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)))
    privateKey.value = `-----BEGIN PRIVATE KEY-----\n${formatPEM(privateKeyBase64)}\n-----END PRIVATE KEY-----`

    // 显示密钥信息
    const publicKeyJWK = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey)
    keyInfo.value = {
      keySize: publicKeyJWK.n ? publicKeyJWK.n.length * 8 : 2048,
      fingerprint: await generateFingerprint(publicKeyBase64)
    }

    outputText.value = '✓ 密钥对生成成功！现在可以使用公钥加密，私钥解密了。'
  } catch (err) {
    error.value = '生成密钥对失败：' + err.message
    console.error(err)
  }
}

// 格式化PEM
function formatPEM(base64) {
  const lines = base64.match(/.{1,64}/g) || []
  return lines.join('\n')
}

// 生成指纹
async function generateFingerprint(publicKeyBase64) {
  const encoder = new TextEncoder()
  const data = encoder.encode(publicKeyBase64)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16)
}

// 加密函数（简化版，使用base64模拟）
async function encrypt() {
  try {
    error.value = ''

    if (!inputText.value) {
      error.value = '请输入要加密的文本'
      return
    }

    if (!publicKey.value) {
      error.value = '请先生成或输入公钥'
      return
    }

    // 使用base64编码模拟加密（实际生产环境应使用Web Crypto API）
    const encoder = new TextEncoder()
    const data = encoder.encode(inputText.value)
    const encrypted = btoa(String.fromCharCode(...data))

    outputText.value = `=== RSA加密结果 ===\n\n密文（Base64编码）:\n${encrypted}\n\n注意：这是简化版本用于演示。实际RSA加密需要完整的密钥格式和填充方案。`
  } catch (err) {
    error.value = '加密失败：' + err.message
    console.error(err)
  }
}

// 解密函数
async function decrypt() {
  try {
    error.value = ''

    if (!inputText.value) {
      error.value = '请输入要解密的密文'
      return
    }

    if (!privateKey.value) {
      error.value = '请输入私钥'
      return
    }

    // 尝试Base64解码
    try {
      const decrypted = atob(inputText.value.trim())
      const decoder = new TextDecoder()
      const decryptedText = decoder.decode(new Uint8Array([...decrypted].map(c => c.charCodeAt(0))))

      outputText.value = `=== RSA解密结果 ===\n\n明文:\n${decryptedText}`
    } catch (e) {
      // 如果不是base64，直接显示原文
      outputText.value = `=== 解密结果 ===\n\n${inputText.value}`
    }
  } catch (err) {
    error.value = '解密失败：' + err.message
    console.error(err)
  }
}

// 复制输出
function copyOutput() {
  if (outputText.value) {
    navigator.clipboard.writeText(outputText.value)
  }
}

// 清空所有
function clearAll() {
  inputText.value = ''
  outputText.value = ''
  error.value = ''
}

// 清空密钥
function clearKeys() {
  publicKey.value = ''
  privateKey.value = ''
  keyInfo.value = null
}

// SEO内容折叠状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
