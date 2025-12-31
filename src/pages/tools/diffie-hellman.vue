<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Diffie-Hellman密钥交换工具</h1>
      <p class="text-muted-foreground max-w-3xl">
        在线Diffie-Hellman密钥协商工具，支持ECDH（椭圆曲线Diffie-Hellman）密钥交换。
        通信双方可以在不安全的信道上协商出共享密钥，用于后续的加密通信。
        支持P-256/P-384/P-521和X25519曲线。
      </p>
    </div>

    <!-- DH原理说明 -->
    <div class="p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg mb-6">
      <div class="flex items-start gap-3">
        <span class="text-blue-600 text-xl">ℹ️</span>
        <div>
          <h4 class="font-semibold text-blue-700 mb-1">Diffie-Hellman密钥交换原理</h4>
          <p class="text-sm text-blue-700">
            Alice和Bob各自生成密钥对，交换公钥后，各自计算得出相同的共享密钥。
            窃听者即使获得公钥也无法计算出共享密钥，这是现代HTTPS/TLS的基础。
          </p>
        </div>
      </div>
    </div>

    <!-- 双方密钥交换区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Alice 方 -->
      <div class="space-y-4 p-6 border border-border rounded-lg bg-background">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-blue-600">👤 Alice (甲方)</h2>
          <button
            @click="generateAliceKeyPair"
            :disabled="isGeneratingAlice"
            class="px-4 py-2 bg-blue-500/10 text-blue-600 rounded-md hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            {{ isGeneratingAlice ? '生成中...' : '生成密钥对' }}
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium mb-1 block">Alice私钥</label>
            <div class="p-3 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-xs break-all">{{ alicePrivateKey || '（生成密钥对后显示）' }}</div>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium mb-1 block">Alice公钥 (发送给Bob)</label>
            <div class="p-3 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-xs break-all">{{ alicePublicKey || '（生成密钥对后显示）' }}</div>
            </div>
            <div class="flex gap-2 mt-2">
              <button
                @click="copyToClipboard(alicePublicKey)"
                :disabled="!alicePublicKey"
                class="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                复制
              </button>
              <button
                @click="sendAliceToBob"
                :disabled="!alicePublicKey"
                class="px-3 py-1 text-xs bg-blue-500/10 text-blue-600 rounded-md hover:bg-blue-500/20 transition-colors disabled:opacity-50"
              >
                发送给Bob →
              </button>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium mb-1 block">Bob的公钥 (从Bob接收)</label>
            <textarea
              v-model="aliceReceivedPublicKey"
              placeholder="粘贴Bob的公钥..."
              class="w-full h-20 p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            ></textarea>
          </div>

          <button
            @click="aliceComputeSharedSecret"
            :disabled="!alicePrivateKey || !aliceReceivedPublicKey || isComputingAlice"
            class="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isComputingAlice ? '计算中...' : '计算共享密钥' }}
          </button>

          <div v-if="aliceSharedSecret">
            <label class="text-sm font-medium mb-1 block">共享密钥 (与Bob相同)</label>
            <div class="p-3 border-2 border-green-500 rounded-lg bg-green-500/5">
              <div class="font-mono text-xs break-all text-green-700">{{ aliceSharedSecret }}</div>
            </div>
            <div class="flex gap-2 mt-2">
              <button
                @click="copyToClipboard(aliceSharedSecret)"
                class="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                复制
              </button>
              <span class="text-xs text-green-600">✓ 密钥协商成功</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bob 方 -->
      <div class="space-y-4 p-6 border border-border rounded-lg bg-background">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-purple-600">👤 Bob (乙方)</h2>
          <button
            @click="generateBobKeyPair"
            :disabled="isGeneratingBob"
            class="px-4 py-2 bg-purple-500/10 text-purple-600 rounded-md hover:bg-purple-500/20 transition-colors disabled:opacity-50"
          >
            {{ isGeneratingBob ? '生成中...' : '生成密钥对' }}
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium mb-1 block">Bob私钥</label>
            <div class="p-3 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-xs break-all">{{ bobPrivateKey || '（生成密钥对后显示）' }}</div>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium mb-1 block">Bob公钥 (发送给Alice)</label>
            <div class="p-3 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-xs break-all">{{ bobPublicKey || '（生成密钥对后显示）' }}</div>
            </div>
            <div class="flex gap-2 mt-2">
              <button
                @click="copyToClipboard(bobPublicKey)"
                :disabled="!bobPublicKey"
                class="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                复制
              </button>
              <button
                @click="sendBobToAlice"
                :disabled="!bobPublicKey"
                class="px-3 py-1 text-xs bg-purple-500/10 text-purple-600 rounded-md hover:bg-purple-500/20 transition-colors disabled:opacity-50"
              >
                ← 发送给Alice
              </button>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium mb-1 block">Alice的公钥 (从Alice接收)</label>
            <textarea
              v-model="bobReceivedPublicKey"
              placeholder="粘贴Alice的公钥..."
              class="w-full h-20 p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            ></textarea>
          </div>

          <button
            @click="bobComputeSharedSecret"
            :disabled="!bobPrivateKey || !bobReceivedPublicKey || isComputingBob"
            class="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isComputingBob ? '计算中...' : '计算共享密钥' }}
          </button>

          <div v-if="bobSharedSecret">
            <label class="text-sm font-medium mb-1 block">共享密钥 (与Alice相同)</label>
            <div class="p-3 border-2 border-green-500 rounded-lg bg-green-500/5">
              <div class="font-mono text-xs break-all text-green-700">{{ bobSharedSecret }}</div>
            </div>
            <div class="flex gap-2 mt-2">
              <button
                @click="copyToClipboard(bobSharedSecret)"
                class="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                复制
              </button>
              <span class="text-xs text-green-600">✓ 密钥协商成功</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 密钥验证 -->
    <div v-if="aliceSharedSecret && bobSharedSecret" class="p-6 border-2 border-green-500 rounded-lg bg-green-500/10 mb-8">
      <div class="flex items-center gap-4">
        <div class="text-4xl">✅</div>
        <div>
          <h3 class="text-lg font-semibold text-green-700">密钥协商成功！</h3>
          <p class="text-sm text-green-600">
            Alice和Bob计算出相同的共享密钥！现在可以使用此密钥进行加密通信。
            即使有人截获了公钥，也无法计算出共享密钥。
          </p>
          <div class="mt-2 p-3 bg-green-500/20 rounded-lg">
            <div class="font-mono text-xs break-all text-green-800">
              共享密钥: {{ aliceSharedSecret.substring(0, 32) }}...
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 参数配置 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">算法配置</h3>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">密钥交换算法</label>
            <select
              v-model="selectedAlgorithm"
              @change="onAlgorithmChange"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ECDH-P256">ECDH P-256 (secp256r1)</option>
              <option value="ECDH-P384">ECDH P-384 (secp384r1)</option>
              <option value="ECDH-P521">ECDH P-521 (secp521r1)</option>
              <option value="X25519">X25519 (Curve25519 DH)</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">派生密钥长度 (字节)</label>
            <input
              v-model.number="derivedKeyLength"
              type="number"
              min="16"
              max="64"
              step="16"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 快速演示 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">快速演示 (自动模式)</h3>
      <p class="text-sm text-muted-foreground mb-4">
        点击下方按钮自动完成完整的密钥交换过程
      </p>
      <button
        @click="autoDemo"
        :disabled="isRunningDemo"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isRunningDemo ? '演示中...' : '自动演示密钥交换' }}
      </button>

      <div v-if="demoSteps.length > 0" class="mt-4 space-y-2">
        <div
          v-for="(step, index) in demoSteps"
          :key="index"
          :class="[
            'p-3 rounded-lg text-sm',
            step.status === 'completed' ? 'bg-green-500/10 text-green-700' : '',
            step.status === 'current' ? 'bg-blue-500/10 text-blue-700' : '',
            step.status === 'pending' ? 'bg-muted/50 text-muted-foreground' : ''
          ]"
        >
          <div class="flex items-center gap-2">
            <span class="font-mono">{{ index + 1 }}.</span>
            <span>{{ step.message }}</span>
            <span v-if="step.status === 'completed'" class="ml-auto">✓</span>
            <span v-if="step.status === 'current'" class="ml-auto">⟳</span>
          </div>
        </div>
      </div>
    </div>

    <!-- DH/ECDH说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于Diffie-Hellman密钥交换</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-primary mb-2">算法特点</h4>
          <ul class="space-y-1 text-sm">
            <li>• 1976年提出，公钥密码学的基石</li>
            <li>• 可在不可信信道上安全协商密钥</li>
            <li>• ECDH使用椭圆曲线，密钥更短更安全</li>
            <li>• 前向保密：即使长期密钥泄露，过去的通信仍然安全</li>
            <li>• 广泛应用于TLS、SSH、VPN等协议</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">ECDH vs 传统DH</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>密钥长度:</span>
              <span class="font-mono">ECDH 32字节 vs DH 2048字节</span>
            </div>
            <div class="flex justify-between">
              <span>计算速度:</span>
              <span class="font-mono">ECDH 更快</span>
            </div>
            <div class="flex justify-between">
              <span>安全级别:</span>
              <span class="font-mono">ECDH 256位 ≈ DH 3072位</span>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <h4 class="font-semibold text-yellow-600 mb-2">安全注意事项</h4>
        <ul class="space-y-1 text-sm text-yellow-700">
          <li>• 必须验证对方的公钥身份（防止中间人攻击）</li>
          <li>• 使用数字证书或预先共享的公钥指纹</li>
          <li>• 每次会话应使用新的临时密钥对（Ephemeral ECDH）</li>
          <li>• 共享密钥不应直接用作加密密钥，应通过HKDF派生</li>
        </ul>
      </div>
    </div>

    <!-- 典型应用 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">典型应用场景</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">🔒 TLS/HTTPS</h4>
          <p class="text-sm text-muted-foreground">网站HTTPS连接使用ECDH协商会话密钥，确保通信安全</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">🖥️ SSH协议</h4>
          <p class="text-sm text-muted-foreground">SSH使用Diffie-Hellman进行密钥交换，支持curve25519-sha256</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">📡 WireGuard VPN</h4>
          <p class="text-sm text-muted-foreground">现代VPN协议使用Noise框架，基于Curve25519的DH</p>
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
import ToolCard from '~/components/ToolCard.vue'

// SEO配置
useHead({
  title: 'Diffie-Hellman密钥交换工具 - 在线ECDH/X25519密钥协商',
  meta: [
    {
      name: 'description',
      content: '在线Diffie-Hellman密钥交换工具，支持ECDH椭圆曲线和X25519密钥协商。通信双方可安全协商共享密钥，支持P-256/P-384/P-521曲线，适用于HTTPS/TLS、SSH等加密通信场景。'
    },
    {
      name: 'keywords',
      content: 'Diffie-Hellman,ECDH,X25519,密钥交换,椭圆曲线,密钥协商,TLS,HTTPS,加密通信,在线工具'
    }
  ]
})

const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const selectedAlgorithm = ref('ECDH-P256')
const derivedKeyLength = ref(32)

// Alice
const alicePrivateKey = ref('')
const alicePublicKey = ref('')
const aliceReceivedPublicKey = ref('')
const aliceSharedSecret = ref('')
const isGeneratingAlice = ref(false)
const isComputingAlice = ref(false)

// Bob
const bobPrivateKey = ref('')
const bobPublicKey = ref('')
const bobReceivedPublicKey = ref('')
const bobSharedSecret = ref('')
const isGeneratingBob = ref(false)
const isComputingBob = ref(false)

// Demo
const isRunningDemo = ref(false)
const demoSteps = ref([])

const copyButtonText = ref('复制')

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'diffie-hellman'
  ).slice(0, 4)
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}

// ArrayBuffer转Hex
const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

// Hex转ArrayBuffer
const hexToArrayBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes.buffer
}

// 生成Alice密钥对
const generateAliceKeyPair = async () => {
  isGeneratingAlice.value = true

  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: selectedAlgorithm.value },
      true,
      ['deriveKey']
    )

    const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey)
    const pkcs8PrivateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    alicePublicKey.value = arrayBufferToHex(rawPublicKey)
    alicePrivateKey.value = arrayBufferToHex(pkcs8PrivateKey)
  } catch (error) {
    console.error('Alice密钥生成失败:', error)
    alert('密钥生成失败: ' + error.message)
  } finally {
    isGeneratingAlice.value = false
  }
}

// 生成Bob密钥对
const generateBobKeyPair = async () => {
  isGeneratingBob.value = true

  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: selectedAlgorithm.value },
      true,
      ['deriveKey']
    )

    const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey)
    const pkcs8PrivateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    bobPublicKey.value = arrayBufferToHex(rawPublicKey)
    bobPrivateKey.value = arrayBufferToHex(pkcs8PrivateKey)
  } catch (error) {
    console.error('Bob密钥生成失败:', error)
    alert('密钥生成失败: ' + error.message)
  } finally {
    isGeneratingBob.value = false
  }
}

// Alice计算共享密钥
const aliceComputeSharedSecret = async () => {
  isComputingAlice.value = true

  try {
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      hexToArrayBuffer(alicePrivateKey.value),
      { name: selectedAlgorithm.value },
      false,
      ['deriveKey']
    )

    const publicKey = await crypto.subtle.importKey(
      'raw',
      hexToArrayBuffer(aliceReceivedPublicKey.value),
      { name: selectedAlgorithm.value },
      false,
      []
    )

    const sharedSecret = await crypto.subtle.deriveKey(
      { name: selectedAlgorithm.value, public: publicKey },
      privateKey,
      { name: 'AES-GCM', length: derivedKeyLength.value * 8 },
      true,
      ['encrypt', 'decrypt']
    )

    const rawSecret = await crypto.subtle.exportKey('raw', sharedSecret)
    aliceSharedSecret.value = arrayBufferToHex(rawSecret)
  } catch (error) {
    console.error('Alice计算共享密钥失败:', error)
    alert('计算失败: ' + error.message)
  } finally {
    isComputingAlice.value = false
  }
}

// Bob计算共享密钥
const bobComputeSharedSecret = async () => {
  isComputingBob.value = true

  try {
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      hexToArrayBuffer(bobPrivateKey.value),
      { name: selectedAlgorithm.value },
      false,
      ['deriveKey']
    )

    const publicKey = await crypto.subtle.importKey(
      'raw',
      hexToArrayBuffer(bobReceivedPublicKey.value),
      { name: selectedAlgorithm.value },
      false,
      []
    )

    const sharedSecret = await crypto.subtle.deriveKey(
      { name: selectedAlgorithm.value, public: publicKey },
      privateKey,
      { name: 'AES-GCM', length: derivedKeyLength.value * 8 },
      true,
      ['encrypt', 'decrypt']
    )

    const rawSecret = await crypto.subtle.exportKey('raw', sharedSecret)
    bobSharedSecret.value = arrayBufferToHex(rawSecret)
  } catch (error) {
    console.error('Bob计算共享密钥失败:', error)
    alert('计算失败: ' + error.message)
  } finally {
    isComputingBob.value = false
  }
}

// 发送Alice公钥给Bob
const sendAliceToBob = () => {
  bobReceivedPublicKey.value = alicePublicKey.value
}

// 发送Bob公钥给Alice
const sendBobToAlice = () => {
  aliceReceivedPublicKey.value = bobPublicKey.value
}

// 自动演示
const autoDemo = async () => {
  isRunningDemo.value = true
  demoSteps.value = [
    { message: 'Alice生成密钥对', status: 'pending' },
    { message: 'Bob生成密钥对', status: 'pending' },
    { message: 'Alice发送公钥给Bob', status: 'pending' },
    { message: 'Bob发送公钥给Alice', status: 'pending' },
    { message: 'Alice计算共享密钥', status: 'pending' },
    { message: 'Bob计算共享密钥', status: 'pending' },
    { message: '密钥协商完成！', status: 'pending' }
  ]

  const updateStep = (index, status) => {
    demoSteps.value[index].status = status
  }

  // 步骤1: Alice生成密钥对
  updateStep(0, 'current')
  await generateAliceKeyPair()
  updateStep(0, 'completed')

  // 步骤2: Bob生成密钥对
  updateStep(1, 'current')
  await generateBobKeyPair()
  updateStep(1, 'completed')

  // 步骤3: Alice发送公钥给Bob
  updateStep(2, 'current')
  bobReceivedPublicKey.value = alicePublicKey.value
  await new Promise(r => setTimeout(r, 500))
  updateStep(2, 'completed')

  // 步骤4: Bob发送公钥给Alice
  updateStep(3, 'current')
  aliceReceivedPublicKey.value = bobPublicKey.value
  await new Promise(r => setTimeout(r, 500))
  updateStep(3, 'completed')

  // 步骤5: Alice计算共享密钥
  updateStep(4, 'current')
  await aliceComputeSharedSecret()
  updateStep(4, 'completed')

  // 步骤6: Bob计算共享密钥
  updateStep(5, 'current')
  await bobComputeSharedSecret()
  updateStep(5, 'completed')

  // 完成
  updateStep(6, 'completed')
  isRunningDemo.value = false
}

// 算法变更时清空
const onAlgorithmChange = () => {
  // 清空所有数据
  alicePrivateKey.value = ''
  alicePublicKey.value = ''
  aliceReceivedPublicKey.value = ''
  aliceSharedSecret.value = ''
  bobPrivateKey.value = ''
  bobPublicKey.value = ''
  bobReceivedPublicKey.value = ''
  bobSharedSecret.value = ''
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

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('diffie-hellman')

// SEO配置
useSeoMeta({
  title: 'Diffie-Hellman密钥交换工具 - 在线ECDH/X25519密钥协商',
  description: '免费在线Diffie-Hellman/ECDH密钥交换工具，支持P-256/P-384/P-521和X25519曲线，演示Alice和Bob的密钥协商过程。',
  keywords: ['Diffie-Hellman', 'ECDH', 'X25519', '密钥交换', 'TLS', '椭圆曲线', '共享密钥']
})
</script>
