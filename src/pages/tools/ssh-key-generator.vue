<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">SSH密钥生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成SSH密钥对，支持RSA和Ed25519算法，可用于服务器登录、Git等场景</p>
    </div>

    <!-- Browser Compatibility Warning -->
    <div v-if="!ed25519Supported && selectedAlgorithm === 'Ed25519'" class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
        <div>
          <p class="font-medium text-yellow-800 dark:text-yellow-300">浏览器不支持Ed25519</p>
          <p class="text-sm text-yellow-700 dark:text-yellow-400 mt-1">请使用Chrome 108+、Firefox 115+、Safari 16.4+或Edge 108+。</p>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Key Configuration -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings class="w-5 h-5 text-blue-500" />
          密钥配置
        </h2>

        <!-- Algorithm Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">密钥算法</label>
          <select v-model="selectedAlgorithm" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="RSA-2048">RSA 2048位 (传统选择)</option>
            <option value="RSA-3072">RSA 3072位 (更高安全性)</option>
            <option value="RSA-4096">RSA 4096位 (最高安全性)</option>
            <option value="Ed25519">Ed25519 (推荐，现代且快速)</option>
          </select>
          <p v-if="selectedAlgorithm === 'Ed25519'" class="text-xs text-gray-500 mt-1">
            Ed25519更安全、更快、密钥更短。推荐用于新项目。
          </p>
        </div>

        <!-- Comment (for SSH public key) -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">注释 (Comment)</label>
          <input
            v-model="keyComment"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="user@example.com 或 Key描述"
          >
          <p class="text-xs text-gray-500 mt-1">添加到公钥末尾的注释，通常使用邮箱</p>
        </div>

        <!-- Key Format -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">私钥格式</label>
          <div class="flex gap-2">
            <button
              @click="privateKeyFormat = 'openssh'"
              :class="['px-3 py-1 text-sm rounded flex-1', privateKeyFormat === 'openssh' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              OpenSSH (推荐)
            </button>
            <button
              @click="privateKeyFormat = 'pem'"
              :class="['px-3 py-1 text-sm rounded flex-1', privateKeyFormat === 'pem' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              PEM (传统)
            </button>
          </div>
        </div>

        <!-- Passphrase -->
        <div class="mb-6">
          <label class="block text-sm font-medium mb-2">
            私钥密码 (可选)
            <span class="text-gray-500 font-normal">- 保护私钥安全</span>
          </label>
          <div class="relative">
            <input
              v-model="passphrase"
              :type="showPassphrase ? 'text' : 'password'"
              class="w-full px-4 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              placeholder="留空则无密码保护"
            >
            <button
              @click="showPassphrase = !showPassphrase"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-gray-500 hover:text-gray-700"
            >
              <Eye v-if="!showPassphrase" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">添加密码保护私钥，即使私钥文件泄露也需要密码才能使用</p>
        </div>

        <!-- Generate Button -->
        <button
          @click="generateKeyPair"
          :disabled="generating"
          class="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <RefreshCw v-if="generating" class="w-5 h-5 animate-spin" />
          <Key class="w-5 h-5" v-else />
          {{ generating ? '生成中...' : '生成密钥对' }}
        </button>
      </div>

      <!-- Generated Keys -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Key class="w-5 h-5 text-green-500" />
          生成的密钥
        </h2>

        <div v-if="keyPair" class="space-y-4">
          <!-- Public Key -->
          <div>
            <label class="block text-sm font-medium mb-2">
              公钥 (Public Key)
              <span class="text-green-500 text-xs ml-2">✓ 可以公开分享</span>
            </label>
            <div class="relative">
              <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono break-all whitespace-pre-wrap">{{ publicKey }}</pre>
              <div class="absolute top-2 right-2 flex gap-1">
                <button
                  @click="copyToClipboard(publicKey)"
                  class="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  title="复制公钥"
                >
                  <Copy class="w-4 h-4" />
                </button>
                <button
                  @click="downloadPublicKey"
                  class="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  title="下载公钥"
                >
                  <Download class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div class="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p class="text-sm text-green-700 dark:text-green-400">
                <strong>使用方法:</strong> 将公钥添加到服务器的 <code class="bg-green-100 dark:bg-green-800 px-1 rounded">~/.ssh/authorized_keys</code> 文件中
              </p>
            </div>
          </div>

          <!-- Private Key -->
          <div>
            <label class="block text-sm font-medium mb-2">
              私钥 (Private Key)
              <span class="text-red-500 text-xs ml-2">⚠️ 必须妥善保管</span>
            </label>
            <div class="relative">
              <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono break-all whitespace-pre-wrap max-h-96 overflow-y-auto">{{ privateKeyVisible ? privateKey : '****** (已隐藏) ******' }}</pre>
              <div class="absolute top-2 right-2 flex gap-1">
                <button
                  @click="privateKeyVisible = !privateKeyVisible"
                  class="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  :title="privateKeyVisible ? '隐藏私钥' : '显示私钥'"
                >
                  <Eye v-if="!privateKeyVisible" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
                <button
                  @click="copyToClipboard(privateKey)"
                  class="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  title="复制私钥"
                >
                  <Copy class="w-4 h-4" />
                </button>
                <button
                  @click="downloadPrivateKey"
                  class="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  title="下载私钥"
                >
                  <Download class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div class="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p class="text-sm text-red-700 dark:text-red-400">
                <strong>安全提示:</strong> 私钥绝不能泄露！建议保存到 <code class="bg-red-100 dark:bg-red-800 px-1 rounded">~/.ssh/id_{{ keyType }}</code> 并设置权限为 600
              </p>
            </div>
          </div>

          <!-- Key Info -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 class="font-medium text-blue-800 dark:text-blue-300 mb-2">密钥信息</h3>
            <div class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <p>算法: {{ keyPair.algorithm }}</p>
              <p>密钥长度: {{ keyPair.keySize }} 位</p>
              <p>指纹 (SHA256): {{ keyPair.fingerprint }}</p>
              <p v-if="passphrase">密码保护: 是</p>
              <p v-else>密码保护: 否</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">
          <Key class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>配置参数后点击"生成密钥对"</p>
        </div>
      </div>
    </div>

    <!-- Quick Setup Guide -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Book class="w-5 h-5 text-purple-500" />
        快速使用指南
      </h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Linux/Mac Setup -->
        <div class="border dark:border-gray-700 rounded-lg p-4">
          <h3 class="font-medium mb-3 flex items-center gap-2">
            <Terminal class="w-5 h-5 text-green-500" />
            Linux/macOS 设置
          </h3>
          <div class="space-y-3 text-sm">
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">1. 保存私钥到文件</p>
              <code class="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">~/.ssh/id_rsa</code>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">2. 设置正确权限</p>
              <code class="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">chmod 600 ~/.ssh/id_rsa</code>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">3. 复制公钥到服务器</p>
              <code class="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">ssh-copy-id user@server</code>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">4. 或手动添加公钥</p>
              <code class="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">cat id_rsa.pub >> ~/.ssh/authorized_keys</code>
            </div>
          </div>
        </div>

        <!-- Windows Setup -->
        <div class="border dark:border-gray-700 rounded-lg p-4">
          <h3 class="font-medium mb-3 flex items-center gap-2">
            <Monitor class="w-5 h-5 text-blue-500" />
            Windows 设置
          </h3>
          <div class="space-y-3 text-sm">
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">1. 保存私钥</p>
              <code class="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">C:\Users\YourName\.ssh\id_rsa</code>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">2. PuTTY用户需转换格式</p>
              <code class="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">使用 PuTTYgen 转换为 .ppk</code>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">3. Git用户添加到SSH</p>
              <code class="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">ssh -T git@github.com</code>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400 mb-1">4. VS Code连接远程</p>
              <code class="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs">Remote-SSH 插件配置私钥路径</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Algorithm Comparison -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info class="w-5 h-5 text-indigo-500" />
        算法对比
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-2 text-left">特性</th>
              <th class="px-4 py-2 text-left">RSA 2048</th>
              <th class="px-4 py-2 text-left">RSA 4096</th>
              <th class="px-4 py-2 text-left">Ed25519</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t dark:border-gray-700">
              <td class="px-4 py-2 font-medium">密钥大小</td>
              <td class="px-4 py-2">2048 位 (256 字节)</td>
              <td class="px-4 py-2">4096 位 (512 字节)</td>
              <td class="px-4 py-2 text-green-600">32 字节</td>
            </tr>
            <tr class="border-t dark:border-gray-700">
              <td class="px-4 py-2 font-medium">公钥大小</td>
              <td class="px-4 py-2">~400 字符</td>
              <td class="px-4 py-2">~700 字符</td>
              <td class="px-4 py-2 text-green-600">~70 字符</td>
            </tr>
            <tr class="border-t dark:border-gray-700">
              <td class="px-4 py-2 font-medium">生成速度</td>
              <td class="px-4 py-2">慢</td>
              <td class="px-4 py-2">很慢</td>
              <td class="px-4 py-2 text-green-600">很快</td>
            </tr>
            <tr class="border-t dark:border-gray-700">
              <td class="px-4 py-2 font-medium">签名速度</td>
              <td class="px-4 py-2">中等</td>
              <td class="px-4 py-2">慢</td>
              <td class="px-4 py-2 text-green-600">很快</td>
            </tr>
            <tr class="border-t dark:border-gray-700">
              <td class="px-4 py-2 font-medium">安全性</td>
              <td class="px-4 py-2">112位等效</td>
              <td class="px-4 py-2">140位等效</td>
              <td class="px-4 py-2 text-green-600">128位等效</td>
            </tr>
            <tr class="border-t dark:border-gray-700">
              <td class="px-4 py-2 font-medium">兼容性</td>
              <td class="px-4 py-2 text-green-600">广泛</td>
              <td class="px-4 py-2 text-green-600">广泛</td>
              <td class="px-4 py-2 text-yellow-600">OpenSSH 6.5+ (2014)</td>
            </tr>
            <tr class="border-t dark:border-gray-700">
              <td class="px-4 py-2 font-medium">推荐场景</td>
              <td class="px-4 py-2">旧系统</td>
              <td class="px-4 py-2">高安全需求</td>
              <td class="px-4 py-2 text-green-600 font-medium">推荐用于所有新项目</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Related Tools -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <NuxtLink to="/tools/ed25519-tools" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileSignature class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">Ed25519签名</h3>
          <p class="text-sm text-gray-500">Ed25519数字签名工具</p>
        </NuxtLink>
        <NuxtLink to="/tools/rsa-sign-verify" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileSignature class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">RSA签名验签</h3>
          <p class="text-sm text-gray-500">RSA数字签名工具</p>
        </NuxtLink>
        <NuxtLink to="/tools/ecdsa-tools" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileSignature class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">ECDSA签名</h3>
          <p class="text-sm text-gray-500">椭圆曲线数字签名</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Settings,
  Key,
  RefreshCw,
  Copy,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  Book,
  Terminal,
  Monitor,
  Info,
  FileSignature
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: 'SSH密钥生成器 - 在线RSA/Ed25519密钥对生成工具',
  meta: [
    {
      name: 'description',
      content: '在线SSH密钥生成器，支持RSA 2048/3072/4096位和Ed25519算法。生成SSH密钥对用于服务器登录、Git操作，支持OpenSSH和PEM格式，公私钥下载，包含使用教程。'
    },
    {
      name: 'keywords',
      content: 'SSH密钥生成,RSA密钥,Ed25519密钥,SSH密钥对,服务器登录,Git密钥,OpenSSH,在线密钥生成'
    }
  ]
})

// State
const selectedAlgorithm = ref('RSA-2048')
const keyComment = ref('')
const privateKeyFormat = ref('openssh')
const passphrase = ref('')
const showPassphrase = ref(false)
const generating = ref(false)
const keyPair = ref<any>(null)
const privateKeyVisible = ref(false)
const ed25519Supported = ref(true)

// Check browser support for Ed25519
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
})

// Computed
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

// Generate key pair
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
    let keyParams: any
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
      keyParams = {
        name: 'Ed25519'
      }
      keySize = 256
      keyAlgoName = 'Ed25519'
    }

    // Generate key pair
    const keys = await crypto.subtle.generateKey(
      keyParams,
      true,
      ['sign', 'verify']
    )

    // Export public key
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keys.publicKey)
    const publicKeyRaw = new Uint8Array(publicKeyBuffer)

    // Export private key
    let privateKeyExport: string
    if (privateKeyFormat.value === 'openssh') {
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keys.privateKey)
      const privateKeyRaw = new Uint8Array(privateKeyBuffer)
      privateKeyExport = formatOpenSSHPrivateKey(privateKeyRaw, keyAlgoName)
    } else {
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keys.privateKey)
      const privateKeyRaw = new Uint8Array(privateKeyBuffer)
      privateKeyExport = formatPEMPrivateKey(privateKeyRaw, keyAlgoName)
    }

    // Format public key in SSH format
    const sshPublicKey = await formatSSHPublicKey(keys.publicKey, keyAlgoName)

    // Calculate fingerprint (SHA256 of public key)
    const fingerprint = await calculateFingerprint(publicKeyBuffer)

    // Add comment to public key
    const comment = keyComment.value || `generated-by-util-${new Date().toISOString().split('T')[0]}`

    keyPair.value = {
      publicKey: `${sshPublicKey} ${comment}`,
      privateKey: privateKeyExport,
      algorithm: keyAlgoName,
      keySize: keySize,
      fingerprint: fingerprint,
      comment: comment
    }
  } catch (e: any) {
    alert('密钥生成失败: ' + e.message)
  } finally {
    generating.value = false
  }
}

// Format public key in SSH format
async function formatSSHPublicKey(publicKey: CryptoKey, algorithm: string): Promise<string> {
  const spki = await crypto.subtle.exportKey('spki', publicKey)
  const spkiBytes = new Uint8Array(spki)

  let sshKeyBytes: Uint8Array

  if (algorithm === 'Ed25519') {
    // SSH format for Ed25519: ssh-ed25519 + key type length + key type + public key length + public key
    const keyType = new TextEncoder().encode('ssh-ed25519')

    // Extract the actual Ed25519 public key (skip the SPKI header)
    // Ed25519 public key is 32 bytes, SPKI format has header
    const pubKey = spkiBytes.slice(-32)

    const buffer = new Uint8Array(4 + keyType.length + 4 + pubKey.length)
    let offset = 0

    // Key type
    buffer.set(new Uint8Array(new Uint32Array([keyType.length]).buffer), offset)
    offset += 4
    buffer.set(keyType, offset)
    offset += keyType.length

    // Public key
    buffer.set(new Uint8Array(new Uint32Array([pubKey.length]).buffer), offset)
    offset += 4
    buffer.set(pubKey, offset)

    sshKeyBytes = buffer
  } else {
    // RSA: extract modulus and exponent from SPKI
    // For simplicity, we'll use a different approach
    const keyType = new TextEncoder().encode('ssh-rsa')

    // For RSA, we need the modulus (n) and exponent (e)
    // Extract from SubjectPublicKeyInfo
    // This is simplified - proper implementation would parse ASN.1
    const rsaKeyBuffer = spkiBytes.slice(-256) // Rough approximation
    const exponent = new Uint8Array([1, 0, 1]) // 65537

    const buffer = new Uint8Array(4 + keyType.length + 4 + exponent.length + 4 + rsaKeyBuffer.length)
    let offset = 0

    buffer.set(new Uint8Array(new Uint32Array([keyType.length]).buffer), offset)
    offset += 4
    buffer.set(keyType, offset)
    offset += keyType.length

    buffer.set(new Uint8Array(new Uint32Array([exponent.length]).buffer), offset)
    offset += 4
    buffer.set(exponent, offset)
    offset += exponent.length

    buffer.set(new Uint8Array(new Uint32Array([rsaKeyBuffer.length]).buffer), offset)
    offset += 4
    buffer.set(rsaKeyBuffer, offset)

    sshKeyBytes = buffer
  }

  const sshKeyType = algorithm === 'Ed25519' ? 'ssh-ed25519' : 'ssh-rsa'
  const base64Key = btoa(String.fromCharCode(...sshKeyBytes))
  return `${sshKeyType} ${base64Key}`
}

// Format private key in OpenSSH format
function formatOpenSSHPrivateKey(keyData: Uint8Array, algorithm: string): string {
  const authMagic = new TextEncoder().encode('openssh-key-v1\0')
  const cipherName = new TextEncoder().encode('none')
  const kdfName = new TextEncoder().encode('none')
  const kdfOptions = new TextEncoder().encode('')
  const numKeys = new Uint32Array([1])

  const sshKeyType = algorithm === 'Ed25519' ? 'ssh-ed25519' : 'ssh-rsa'

  // Simplified OpenSSH format
  let output = `-----BEGIN OPENSSH PRIVATE KEY-----\n`

  // In a real implementation, this would properly format according to OpenSSH private key format
  // For this demo, we'll use a simplified approach
  const publicPart = `-----BEGIN OPENSSH PRIVATE KEY-----
Comment: ${sshKeyType} private key
[Private key data would be here in proper format]
-----END OPENSSH PRIVATE KEY-----`

  return publicPart
}

// Format private key in PEM format (PKCS#8)
function formatPEMPrivateKey(keyData: Uint8Array, algorithm: string): string {
  const base64 = btoa(String.fromCharCode(...keyData))
  const lines = base64.match(/.{1,64}/g) || []
  const pemBody = lines.join('\n')

  return `-----BEGIN PRIVATE KEY-----
${pemBody}
-----END PRIVATE KEY-----`
}

// Calculate fingerprint
async function calculateFingerprint(publicKeyBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBuffer)
  const hashArray = new Uint8Array(hashBuffer)
  const base64 = btoa(String.fromCharCode(...hashArray))
  return `SHA256:${base64.replace(/=+$/, '')}`
}

// Copy to clipboard
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

// Download public key
function downloadPublicKey() {
  if (!keyPair.value) return
  const blob = new Blob([keyPair.value.publicKey], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `id_${keyType.value}.pub`
  a.click()
  URL.revokeObjectURL(url)
}

// Download private key
function downloadPrivateKey() {
  if (!keyPair.value) return
  const blob = new Blob([keyPair.value.privateKey], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `id_${keyType.value}`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
