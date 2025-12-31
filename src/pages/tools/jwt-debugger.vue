<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">JWT调试器</h1>
      <p class="text-gray-600 dark:text-gray-400">解码JWT Token，查看Header和Payload，验证签名</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">输入JWT Token</h2>
      <textarea
        v-model="jwtInput"
        class="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
        placeholder="粘贴JWT Token (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
        @input="decodeJWT"
      ></textarea>
      <div class="mt-4 flex gap-2">
        <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">加载示例</button>
        <button @click="clearAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
      </div>
    </div>

    <!-- 解码结果 -->
    <div v-if="decoded.header || decoded.payload" class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Header</h2>
          <span class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">解码后</span>
        </div>
        <pre class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">{{ formatJSON(decoded.header) }}</pre>
      </div>

      <!-- Payload -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Payload</h2>
          <span class="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 rounded">解码后</span>
        </div>
        <pre class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">{{ formatJSON(decoded.payload) }}</pre>
      </div>
    </div>

    <!-- 签名验证 -->
    <div v-if="decoded.signature" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">签名验证</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">密钥 (Secret Key)</label>
        <div class="flex gap-2">
          <input
            v-model="secretKey"
            type="password"
            placeholder="输入密钥验证签名..."
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
          <button @click="verifySignature" class="px-4 py-2 bg-blue-500 text-white rounded text-sm">验证</button>
        </div>
      </div>
      <div v-if="signatureResult" class="p-4 rounded-lg" :class="signatureResult.valid ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'">
        <div class="flex items-center gap-2" :class="signatureResult.valid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
          <svg v-if="signatureResult.valid" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>{{ signatureResult.valid ? '签名有效' : '签名无效' }}</span>
        </div>
      </div>

      <!-- 签名信息 -->
      <div v-if="decoded.header" class="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <span class="text-gray-600 dark:text-gray-400">算法 (alg):</span>
          <span class="ml-2 font-medium">{{ decoded.header.alg }}</span>
        </div>
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <span class="text-gray-600 dark:text-gray-400">类型 (typ):</span>
          <span class="ml-2 font-medium">{{ decoded.header.typ || 'JWT' }}</span>
        </div>
      </div>
    </div>

    <!-- 时间信息 -->
    <div v-if="decoded.payload" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">时间信息</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <div v-if="decoded.payload.iat" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">签发时间 (iat)</div>
          <div class="font-mono text-sm">{{ formatTimestamp(decoded.payload.iat) }}</div>
        </div>
        <div v-if="decoded.payload.exp" class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">过期时间 (exp)</div>
          <div class="font-mono text-sm">{{ formatTimestamp(decoded.payload.exp) }}</div>
          <div class="text-xs mt-1" :class="isExpired ? 'text-red-600' : 'text-green-600'">
            {{ isExpired ? '已过期' : '未过期' }}
          </div>
        </div>
        <div v-if="decoded.payload.nbf" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">生效时间 (nbf)</div>
          <div class="font-mono text-sm">{{ formatTimestamp(decoded.payload.nbf) }}</div>
        </div>
      </div>
    </div>

    <!-- 常用Claims说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">JWT标准Claims</h2>
      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <div class="space-y-2">
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">iss</code>
            <span class="ml-2 text-gray-600 dark:text-gray-400">- 签发者</span>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">sub</code>
            <span class="ml-2 text-gray-600 dark:text-gray-400">- 主题</span>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">aud</code>
            <span class="ml-2 text-gray-600 dark:text-gray-400">- 接收方</span>
          </div>
        </div>
        <div class="space-y-2">
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">exp</code>
            <span class="ml-2 text-gray-600 dark:text-gray-400">- 过期时间</span>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">nbf</code>
            <span class="ml-2 text-gray-600 dark:text-gray-400">- 生效时间</span>
          </div>
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">iat</code>
            <span class="ml-2 text-gray-600 dark:text-gray-400">- 签发时间</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'JWT调试器 - 在线JWT Token解码与验证',
  meta: [{ name: 'description', content: '在线JWT调试工具，解码JWT Token查看Header和Payload，验证签名，检查过期时间。' }],
  keywords: ['JWT', 'JWT解码', 'JWT调试', 'Token验证', 'JSON Web Token']
})

const jwtInput = ref('')
const secretKey = ref('')
const decoded = ref<{ header: any; payload: any; signature: string }>({
  header: null,
  payload: null,
  signature: ''
})
const signatureResult = ref<{ valid: boolean } | null>(null)

const isExpired = computed(() => {
  if (!decoded.value.payload?.exp) return false
  return decoded.value.payload.exp < Math.floor(Date.now() / 1000)
})

const sampleJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

function loadSample() {
  jwtInput.value = sampleJWT
  decodeJWT()
}

function clearAll() {
  jwtInput.value = ''
  decoded.value = { header: null, payload: null, signature: '' }
  signatureResult.value = null
}

function decodeJWT() {
  const token = jwtInput.value.trim()
  if (!token) {
    decoded.value = { header: null, payload: null, signature: '' }
    return
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    alert('无效的JWT格式，JWT应该包含3个部分')
    return
  }

  try {
    decoded.value.header = JSON.parse(atob(parts[0]))
    decoded.value.payload = JSON.parse(atob(parts[1]))
    decoded.value.signature = parts[2]
  } catch {
    alert('JWT解码失败，请检查格式')
  }
}

function formatJSON(obj: any): string {
  return obj ? JSON.stringify(obj, null, 2) : ''
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

function verifySignature() {
  // 简化验证 - 实际应用中需要使用JWT库
  signatureResult.value = { valid: false }
  alert('签名验证需要后端支持或使用JWT库（如jsonwebtoken）')
}

// 初始化加载示例
loadSample()
</script>
