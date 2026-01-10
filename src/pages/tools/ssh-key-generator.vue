<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">SSH密钥生成器 - 在线RSA/Ed25519密钥对生成</h1>
      <p class="text-muted-foreground">生成SSH密钥对，支持RSA和Ed25519算法，可用于服务器登录、Git等场景。纯本地计算，密钥安全隐私。</p>
    </div>

    <!-- 浏览器兼容性警告 -->
    <div v-if="!ed25519Supported && selectedAlgorithm === 'Ed25519'" class="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
        <div>
          <p class="font-medium text-destructive">浏览器不支持Ed25519</p>
          <p class="text-sm text-muted-foreground mt-1">请使用Chrome 108+、Firefox 115+、Safari 16.4+或Edge 108+。</p>
        </div>
      </div>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 密钥配置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">密钥配置</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">密钥算法</label>
          <select v-model="selectedAlgorithm" class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground">
            <option value="RSA-2048">RSA 2048位 (传统选择)</option>
            <option value="RSA-3072">RSA 3072位 (更高安全性)</option>
            <option value="RSA-4096">RSA 4096位 (最高安全性)</option>
            <option value="Ed25519">Ed25519 (推荐，现代且快速)</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">注释 (Comment)</label>
          <input
            v-model="keyComment"
            type="text"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            placeholder="user@example.com 或 Key描述"
          >
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-foreground mb-2">私钥密码 (可选)</label>
          <div class="relative">
            <input
              v-model="passphrase"
              :type="showPassphrase ? 'text' : 'password'"
              class="w-full px-4 py-2 pr-20 border border-border rounded-lg bg-muted text-foreground"
              placeholder="留空则无密码保护"
            >
            <button
              @click="showPassphrase = !showPassphrase"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-muted-foreground hover:text-foreground"
            >
              <Eye v-if="!showPassphrase" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          @click="generateKeyPair"
          :disabled="generating"
          class="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground disabled:text-muted-foreground font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <RefreshCw v-if="generating" class="w-5 h-5 animate-spin" />
          <Key v-else class="w-5 h-5" />
          {{ generating ? '生成中...' : '生成密钥对' }}
        </button>
      </div>

      <!-- 生成的密钥 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">生成的密钥</h2>

        <div v-if="keyPair" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              公钥 (Public Key)
              <span class="text-green-600 text-xs ml-2">可以公开分享</span>
            </label>
            <div class="relative">
              <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono break-all whitespace-pre-wrap text-foreground">{{ publicKey }}</pre>
              <div class="absolute top-2 right-2 flex gap-1">
                <button @click="copyToClipboard(publicKey)" class="p-2 bg-muted hover:bg-accent rounded" title="复制公钥">
                  <Copy class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              私钥 (Private Key)
              <span class="text-destructive text-xs ml-2">必须妥善保管</span>
            </label>
            <div class="relative">
              <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono break-all whitespace-pre-wrap max-h-96 overflow-y-auto text-foreground">{{ privateKeyVisible ? privateKey : '****** (已隐藏) ******' }}</pre>
              <div class="absolute top-2 right-2 flex gap-1">
                <button @click="privateKeyVisible = !privateKeyVisible" class="p-2 bg-muted hover:bg-accent rounded">
                  <Eye v-if="!privateKeyVisible" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
                <button @click="copyToClipboard(privateKey)" class="p-2 bg-muted hover:bg-accent rounded" title="复制私钥">
                  <Copy class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-muted-foreground">
          <Key class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>配置参数后点击"生成密钥对"</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是SSH密钥？
        </h2>
        <p class="text-muted-foreground mb-4">
          SSH密钥是一种认证方法，用于通过加密方式登录远程服务器。它比密码更安全，因为密钥比密码难破解得多。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          RSA vs Ed25519
        </h2>
        <div class="text-sm text-muted-foreground mb-6 space-y-2">
          <p><strong>RSA:</strong> 传统算法，兼容性好，但密钥较长，生成速度慢。推荐2048位或更高。</p>
          <p><strong>Ed25519:</strong> 现代算法，密钥更短，生成速度快，安全性更高。推荐用于新项目。</p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>生成密钥对</li>
          <li>将公钥添加到服务器的 ~/.ssh/authorized_keys 文件</li>
          <li>将私钥保存到本地 ~/.ssh/ 目录</li>
          <li>使用 ssh -i ~/.ssh/private_key user@server 登录</li>
        </ol>
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
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { HelpCircle, ChevronUp, AlertTriangle, Eye, EyeOff, RefreshCw, Key, Copy, FileSignature } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'SSH密钥生成器 - 在线RSA/Ed25519密钥对生成 | Util工具箱',
  description: '在线SSH密钥生成器，支持RSA 2048/3072/4096位和Ed25519算法。生成SSH密钥对用于服务器登录、Git操作，支持OpenSSH和PEM格式，纯前端处理。',
  keywords: 'SSH密钥生成,RSA密钥,Ed25519密钥,SSH密钥对,服务器登录,Git密钥,OpenSSH,在线密钥生成',
  author: 'Util工具箱',
  ogTitle: 'SSH密钥生成器 - RSA/Ed25519',
  ogDescription: '生成SSH密钥对，支持RSA和Ed25519算法',
  ogType: 'website'
})

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'SSH密钥生成器',
        description: '在线RSA/Ed25519密钥对生成工具',
        url: 'https://www.util.cn/tools/ssh-key-generator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any'
      })
    }
  ]
})

const tool = tools.find(t => t.id === 'ssh-key-generator')
const isSeoContentVisible = ref(true)

const selectedAlgorithm = ref('RSA-2048')
const keyComment = ref('')
const passphrase = ref('')
const showPassphrase = ref(false)
const generating = ref(false)
const keyPair = ref(null)
const privateKeyVisible = ref(false)
const ed25519Supported = ref(true)

onMounted(async () => {
  try {
    await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    )
  } catch {
    ed25519Supported.value = false
    if (selectedAlgorithm.value.startsWith('Ed25519')) {
      selectedAlgorithm.value = 'RSA-2048'
    }
  }
  if (tool) {
    addRecentTool(tool.id)
  }
})

const keyType = computed(() => {
  if (selectedAlgorithm.value === 'Ed25519') return 'ed25519'
  return 'rsa'
})

const publicKey = computed(() => {
  if (!keyPair.value) return ''
  return keyPair.value.publicKey
})

const privateKey = computed(() => {
  if (!keyPair.value) return ''
  return keyPair.value.privateKey
})

async function generateKeyPair() {
  if (!ed25519Supported.value && selectedAlgorithm.value === 'Ed25519') {
    alert('浏览器不支持Ed25519算法')
    return
  }

  generating.value = true
  keyPair.value = null
  privateKeyVisible.value = false

  try {
    const algorithm = selectedAlgorithm.value
    let keyParams
    let keySize = 2048
    let keyAlgoName = 'RSA'

    if (algorithm.startsWith('RSA')) {
      keySize = parseInt(algorithm.split('-')[1])
      keyParams = {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: keySize,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      }
      keyAlgoName = 'RSA'
    } else {
      keyParams = { name: 'Ed25519' }
      keySize = 256
      keyAlgoName = 'Ed25519'
    }

    const keys = await crypto.subtle.generateKey(keyParams, true, ['sign', 'verify'])
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keys.publicKey)
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keys.privateKey)

    const publicKeyRaw = new Uint8Array(publicKeyBuffer)
    const privateKeyRaw = new Uint8Array(privateKeyBuffer)

    const sshPublicKey = await formatSSHPublicKey(keys.publicKey, keyAlgoName)
    const privateKeyExport = formatPEMPrivateKey(privateKeyRaw, keyAlgoName)

    const fingerprint = await calculateFingerprint(publicKeyBuffer)
    const comment = keyComment.value || `generated-by-util-${new Date().toISOString().split('T')[0]}`

    keyPair.value = {
      publicKey: `${sshPublicKey} ${comment}`,
      privateKey: privateKeyExport,
      algorithm: keyAlgoName,
      keySize: keySize,
      fingerprint: fingerprint,
      comment: comment
    }
  } catch (e) {
    alert('密钥生成失败: ' + e.message)
  } finally {
    generating.value = false
  }
}

async function formatSSHPublicKey(publicKey, algorithm) {
  const spki = await crypto.subtle.exportKey('spki', publicKey)
  const spkiBytes = new Uint8Array(spki)
  const base64Key = btoa(String.fromCharCode(...spkiBytes))
  const sshKeyType = algorithm === 'Ed25519' ? 'ssh-ed25519' : 'ssh-rsa'
  return `${sshKeyType} ${base64Key}`
}

function formatPEMPrivateKey(keyData, algorithm) {
  const base64 = btoa(String.fromCharCode(...keyData))
  const lines = base64.match(/.{1,64}/g) || []
  const pemBody = lines.join('\n')
  return `-----BEGIN PRIVATE KEY-----\n${pemBody}\n-----END PRIVATE KEY-----`
}

async function calculateFingerprint(publicKeyBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer)
  const hashArray = new Uint8Array(hashBuffer)
  const base64 = btoa(String.fromCharCode(...hashArray))
  return `SHA256:${base64.replace(/=+$/, '')}`
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
}

const iconMap = {
  FileSignature: computed(() => FileSignature)
}

const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'ed25519-tools'),
    tools.find(t => t.id === 'rsa-sign-verify'),
    tools.find(t => t.id === 'ecdsa-tools'),
    tools.find(t => t.id === 'hmac-generator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
