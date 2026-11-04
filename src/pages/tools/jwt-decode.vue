<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">JWT解码器</h1>
      <p class="text-muted-foreground max-w-3xl">JWT（JSON Web Token）在线解码和验证工具，解码Header和Payload，验证过期时间。</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">JWT Token</label>
          <div class="flex items-center gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          v-model="jwtToken"
          placeholder="请输入JWT Token..."
          class="w-full h-48 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div class="text-sm text-muted-foreground">
          Token长度：{{ jwtToken.length }}
        </div>
      </div>

      <!-- 解码结果 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">解码结果</label>
          <div class="flex items-center gap-2">
            <button
              @click="copyToClipboard(JSON.stringify(parsedJWT, null, 2))"
              :disabled="!parsedJWT.header"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {{ copyButtonText }}
            </button>
          </div>
        </div>
        <div class="h-48 border border-border rounded-lg bg-muted/50 overflow-auto">
          <pre v-if="parsedJWT.header" class="p-4 text-sm">{{ JSON.stringify(parsedJWT, null, 2) }}</pre>
          <div v-else class="flex items-center justify-center h-full text-muted-foreground">
            解码结果将显示在这里...
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="decodeJWT"
        :disabled="!jwtToken"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        解码JWT
      </button>
      <button
        @click="verifySignature"
        :disabled="!parsedJWT.header"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
      >
        验证签名
      </button>
    </div>

    <!-- 解析结果详情 -->
    <div v-if="parsedJWT.header" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">解析结果</h3>
      <div class="space-y-6">
        <!-- Header -->
        <div>
          <h4 class="font-medium text-primary mb-2">Header</h4>
          <div class="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <div>
              <span class="font-medium">算法 (alg):</span>
              <span class="ml-2 text-primary">{{ parsedJWT.header.alg || 'N/A' }}</span>
            </div>
            <div>
              <span class="font-medium">类型 (typ):</span>
              <span class="ml-2 text-primary">{{ parsedJWT.header.typ || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Payload -->
        <div>
          <h4 class="font-medium text-primary mb-2">Payload</h4>
          <div class="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <div v-if="parsedJWT.payload.iss">
              <span class="font-medium">签发者 (iss):</span>
              <span class="ml-2">{{ parsedJWT.payload.iss }}</span>
            </div>
            <div v-if="parsedJWT.payload.sub">
              <span class="font-medium">主题 (sub):</span>
              <span class="ml-2">{{ parsedJWT.payload.sub }}</span>
            </div>
            <div v-if="parsedJWT.payload.aud">
              <span class="font-medium">接收方 (aud):</span>
              <span class="ml-2">{{ parsedJWT.payload.aud }}</span>
            </div>
            <div v-if="parsedJWT.payload.exp">
              <span class="font-medium">过期时间 (exp):</span>
              <span class="ml-2">{{ new Date(parsedJWT.payload.exp * 1000).toLocaleString() }}</span>
            </div>
            <div v-if="parsedJWT.payload.nbf">
              <span class="font-medium">生效时间 (nbf):</span>
              <span class="ml-2">{{ new Date(parsedJWT.payload.nbf * 1000).toLocaleString() }}</span>
            </div>
            <div v-if="parsedJWT.payload.iat">
              <span class="font-medium">签发时间 (iat):</span>
              <span class="ml-2">{{ new Date(parsedJWT.payload.iat * 1000).toLocaleString() }}</span>
            </div>
            <div v-if="parsedJWT.payload.jti">
              <span class="font-medium">JWT ID (jti):</span>
              <span class="ml-2">{{ parsedJWT.payload.jti }}</span>
            </div>
          </div>
        </div>

        <!-- 过期状态 -->
        <div v-if="expirationStatus">
          <h4 class="font-medium text-primary mb-2">过期状态</h4>
          <div class="flex items-center gap-3" :class="expirationStatus.expired ? 'text-red-600' : 'text-green-600'">
            <svg v-if="expirationStatus.expired" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
              <div class="font-medium">{{ expirationStatus.expired ? '已过期' : '有效' }}</div>
              <div class="text-sm">{{ expirationStatus.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- JWT知识库 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于JWT</h3>
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-primary mb-2">什么是JWT？</h4>
          <p class="text-sm text-muted-foreground">
            JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在各方之间安全地传输信息作为JSON对象。
            它可以被验证和信任，因为它是数字签名的。
          </p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">JWT结构</h4>
          <div class="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            <div class="mb-2">Header.Payload.Signature</div>
            <div class="text-xs text-muted-foreground">
              例如：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">常见用途</h4>
          <ul class="text-sm space-y-1">
            <li>• 身份认证：用户登录后，后续请求携带JWT进行身份验证</li>
            <li>• 信息交换：安全地在各方之间传递信息</li>
            <li>• 授权：传递用户的权限信息</li>
            <li>• API安全：保护API端点免受未授权访问</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">安全注意事项</h4>
          <ul class="text-sm space-y-1 text-amber-600">
            <li>• 敏感数据不要放在Payload中（除非加密）</li>
            <li>• 使用强密钥（至少256位）</li>
            <li>• 设置合理的过期时间</li>
            <li>• 在HTTPS环境下传输</li>
            <li>• 定期轮换签名密钥</li>
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



const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const jwtToken = ref('')
const parsedJWT = ref({ header: null, payload: null })
const expirationStatus = ref(null)
const signatureResult = ref(null)
const copyButtonText = ref('复制')

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'jwt-decode'
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

// 解析JWT
const decodeJWT = () => {
  try {
    const parts = jwtToken.value.split('.')

    if (parts.length !== 3) {
      alert('无效的JWT格式，应该包含3个部分')
      return
    }

    // 解码Header
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))

    // 解码Payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))

    parsedJWT.value = { header, payload }

    // 检查过期时间
    checkExpiration(payload)

  } catch (error) {
    alert('JWT解码失败：' + error.message)
    parsedJWT.value = { header: null, payload: null }
    expirationStatus.value = null
  }
}

// 检查过期时间
const checkExpiration = (payload) => {
  if (payload.exp) {
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime > payload.exp) {
      expirationStatus.value = { expired: true, message: `已过期 (过期时间: ${new Date(payload.exp * 1000).toLocaleString()})` }
    } else {
      expirationStatus.value = { expired: false, message: `有效 (过期时间: ${new Date(payload.exp * 1000).toLocaleString()})` }
    }
  } else {
    expirationStatus.value = { expired: false, message: '无过期时间' }
  }
}

// 验证签名
const verifySignature = () => {
  // 客户端无法验证签名，这里只是展示签名信息
  const parts = jwtToken.value.split('.')
  const signature = parts[2] || 'N/A'
  signatureResult.value = {
    signature,
    message: '出于安全考虑，签名验证需要在服务端进行。此JWT签名为：' + signature
  }

  alert(signatureResult.value.message)
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
  jwtToken.value = ''
  parsedJWT.value = { header: null, payload: null }
  expirationStatus.value = null
  signatureResult.value = null
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('jwt-decode')

// SEO配置
useSeoMeta({
  title: 'JWT解码器 - 在线JWT Token解析工具',
  description: '免费在线JWT解码工具，快速解析JWT Token的Header和Payload，验证过期时间。',
  keywords: ['JWT', 'JSON Web Token', '解码', '解析', 'Token', '认证']
})

</script>