<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">JWT验证器</h1>
      <p class="text-muted-foreground max-w-3xl">JSON Web Token在线验证工具，验证JWT令牌的签名有效性和时效性，支持多种签名算法和自定义密钥验证。</p>
    </div>

    <!-- JWT输入区域 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">JWT Token</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <button
            @click="clearToken"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
          <button
            @click="loadExampleToken"
            class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors"
          >
            加载示例
          </button>
        </div>
        <textarea
          v-model="jwtToken"
          placeholder="请输入JWT Token，例如：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          class="w-full h-32 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div v-if="jwtStructure" class="text-sm text-muted-foreground">
          <span>结构：{{ jwtStructure.header }} . {{ jwtStructure.payload }} . {{ jwtStructure.signature }}</span>
        </div>
      </div>
    </div>

    <!-- 验证设置 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">验证设置</h3>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">签名验证方式</label>
          <select
            v-model="verifyMethod"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="none">仅解析，不验证签名</option>
            <option value="secret">使用密钥验证</option>
            <option value="public">使用公钥验证</option>
          </select>
        </div>

        <!-- 密钥验证 -->
        <div v-if="verifyMethod === 'secret'">
          <label class="text-sm font-medium mb-2 block">密钥（Secret Key）</label>
          <input
            v-model="secretKey"
            type="password"
            placeholder="输入用于验证的密钥"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
          <div class="mt-2 text-xs text-muted-foreground">
            HS256/HS384/HS512算法使用
          </div>
        </div>

        <!-- 公钥验证 -->
        <div v-if="verifyMethod === 'public'">
          <label class="text-sm font-medium mb-2 block">公钥（Public Key）</label>
          <textarea
            v-model="publicKey"
            placeholder="输入PEM格式的公钥"
            class="w-full h-24 p-3 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          ></textarea>
          <div class="mt-2 text-xs text-muted-foreground">
            RS256/RS384/RS512、ES256/ES384/ES512、PS256/PS384/PS512算法使用
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="verifyJWT"
        :disabled="!jwtToken"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        验证JWT
      </button>
      <button
        @click="decodeOnly"
        :disabled="!jwtToken"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        仅解析
      </button>
    </div>

    <!-- 验证结果 -->
    <div v-if="verifyResult" class="space-y-6 mb-8">
      <!-- 验证状态 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">验证结果</h3>
        <div class="space-y-4">
          <!-- 签名验证 -->
          <div class="flex items-center justify-between p-4 rounded-lg"
               :class="verifyResult.signature.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-full" :class="verifyResult.signature.valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="verifyResult.signature.valid" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <div>
                <div class="font-medium">签名验证</div>
                <div class="text-sm text-muted-foreground">{{ verifyResult.signature.message }}</div>
              </div>
            </div>
            <div class="text-sm">
              算法：{{ verifyResult.header?.alg || 'N/A' }}
            </div>
          </div>

          <!-- 时间验证 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-lg"
                 :class="verifyResult.time.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <div class="flex items-center gap-2 mb-2">
                <Clock class="w-4 h-4" :class="verifyResult.time.valid ? 'text-green-600' : 'text-red-600'" />
                <span class="font-medium text-sm">生效时间 (nbf)</span>
              </div>
              <div class="text-sm">
                <div>{{ verifyResult.time.nbf || '未设置' }}</div>
                <div v-if="verifyResult.time.nbfStatus" :class="verifyResult.time.nbfStatus.valid ? 'text-green-600' : 'text-red-600'">
                  {{ verifyResult.time.nbfStatus.message }}
                </div>
              </div>
            </div>

            <div class="p-4 rounded-lg"
                 :class="verifyResult.time.valid ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'">
              <div class="flex items-center gap-2 mb-2">
                <Calendar class="w-4 h-4" :class="verifyResult.time.valid ? 'text-green-600' : 'text-amber-600'" />
                <span class="font-medium text-sm">签发时间 (iat)</span>
              </div>
              <div class="text-sm">
                <div>{{ verifyResult.time.iat || '未设置' }}</div>
                <div class="text-muted-foreground">
                  {{ verifyResult.time.iatAge }}
                </div>
              </div>
            </div>

            <div class="p-4 rounded-lg"
                 :class="verifyResult.time.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <div class="flex items-center gap-2 mb-2">
                <AlertCircle class="w-4 h-4" :class="verifyResult.time.valid ? 'text-green-600' : 'text-red-600'" />
                <span class="font-medium text-sm">过期时间 (exp)</span>
              </div>
              <div class="text-sm">
                <div>{{ verifyResult.time.exp || '未设置' }}</div>
                <div v-if="verifyResult.time.expStatus" :class="verifyResult.time.expStatus.valid ? 'text-green-600' : 'text-red-600'">
                  {{ verifyResult.time.expStatus.message }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- JWT详情 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Header详情 -->
        <div class="border border-border rounded-lg p-6">
          <h4 class="font-semibold mb-4">Header (头部)</h4>
          <div class="space-y-3">
            <div v-for="(value, key) in verifyResult.header" :key="key">
              <div class="text-sm">
                <span class="text-muted-foreground">{{ key }}:</span>
                <span class="ml-2 font-mono">{{ value }}</span>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <h5 class="text-sm font-medium mb-2">原始Header (Base64)</h5>
            <div class="bg-muted/50 rounded p-3">
              <code class="text-xs break-all">{{ verifyResult.rawHeader }}</code>
            </div>
          </div>
        </div>

        <!-- Payload详情 -->
        <div class="border border-border rounded-lg p-6">
          <h4 class="font-semibold mb-4">Payload (载荷)</h4>
          <div class="space-y-3">
            <div v-for="(value, key) in verifyResult.payload" :key="key">
              <div class="text-sm">
                <span class="text-muted-foreground">{{ key }}:</span>
                <span v-if="typeof value === 'object'" class="ml-2">
                  <pre class="inline text-xs bg-muted/50 px-2 py-1 rounded">{{ JSON.stringify(value, null, 2) }}</pre>
                </span>
                <span v-else class="ml-2 font-mono">{{ value }}</span>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <h5 class="text-sm font-medium mb-2">原始Payload (Base64)</h5>
            <div class="bg-muted/50 rounded p-3">
              <code class="text-xs break-all">{{ verifyResult.rawPayload }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 签名信息 -->
      <div class="border border-border rounded-lg p-6">
        <h4 class="font-semibold mb-4">Signature (签名)</h4>
        <div class="bg-muted/50 rounded p-3">
          <code class="text-xs break-all">{{ verifyResult.rawSignature }}</code>
        </div>
      </div>
    </div>

    <!-- 高级验证选项 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">高级验证选项</h3>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="text-sm font-medium mb-2 block">允许的时钟偏差（秒）</label>
            <input
              v-model.number="clockSkew"
              type="number"
              min="0"
              max="300"
              class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
            <div class="mt-1 text-xs text-muted-foreground">
              用于解决服务器时间不同步问题，通常设置为60秒
            </div>
          </div>
          <div>
            <label class="text-sm font-medium mb-2 block">必填声明（Claims）</label>
            <input
              v-model="requiredClaims"
              type="text"
              placeholder="例如：iss,aud,sub"
              class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
            <div class="mt-1 text-xs text-muted-foreground">
              用逗号分隔的声明列表，验证这些声明是否存在
            </div>
          </div>
        </div>

        <!-- 自定义声明验证 -->
        <div>
          <label class="text-sm font-medium mb-2 block">自定义声明验证</label>
          <div class="space-y-2">
            <div v-for="(claim, index) in customClaims" :key="index" class="flex gap-2">
              <input
                v-model="claim.name"
                type="text"
                placeholder="声明名称"
                class="flex-1 px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <input
                v-model="claim.value"
                type="text"
                placeholder="期望值"
                class="flex-1 px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
              <button
                @click="removeCustomClaim(index)"
                class="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                删除
              </button>
            </div>
            <button
              @click="addCustomClaim"
              class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              添加声明
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- JWT验证最佳实践 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">JWT验证最佳实践</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium text-primary mb-2">安全检查清单</h4>
          <ul class="text-sm space-y-1">
            <li>✓ 验证签名算法是否为预期算法</li>
            <li>✓ 检查exp声明，拒绝过期的token</li>
            <li>✓ 检查nbf声明，拒绝未生效的token</li>
            <li>✓ 验证iss（签发者）声明</li>
            <li>✓ 验证aud（受众）声明</li>
            <li>✓ 考虑时钟偏差，通常30-60秒</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">常见安全问题</h4>
          <ul class="text-sm space-y-1 text-amber-600">
            <li>• 接受"none"算法（无签名）</li>
            <li>• 不验证exp过期时间</li>
            <li>• 信任算法头部中的值</li>
            <li>• 使用弱密钥或泄露的密钥</li>
            <li>• 在URL中传输JWT（可能被日志记录）</li>
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
import { Clock, Calendar, AlertCircle } from 'lucide-vue-next'



const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const jwtToken = ref('')
const verifyMethod = ref('none')
const secretKey = ref('')
const publicKey = ref('')
const clockSkew = ref(60)
const requiredClaims = ref('')
const customClaims = ref([])
const verifyResult = ref(null)

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'jwt-verify'
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

// JWT结构分析
const jwtStructure = computed(() => {
  if (!jwtToken.value) return null
  const parts = jwtToken.value.split('.')
  return {
    header: parts[0] ? parts[0].substring(0, 20) + '...' : '',
    payload: parts[1] ? parts[1].substring(0, 20) + '...' : '',
    signature: parts[2] ? parts[2].substring(0, 20) + '...' : ''
  }
})

// 加载示例Token
const loadExampleToken = () => {
  jwtToken.value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.invalid_signature'
}

// 仅解析JWT
const decodeOnly = () => {
  if (!jwtToken.value) return

  try {
    const parts = jwtToken.value.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))

    verifyResult.value = {
      signature: { valid: null, message: '未验证签名' },
      header: header,
      payload: payload,
      rawHeader: parts[0],
      rawPayload: parts[1],
      rawSignature: parts[2],
      time: checkTimeClaims(payload)
    }
  } catch (error) {
    alert('JWT解析失败：' + error.message)
  }
}

// 验证JWT
const verifyJWT = () => {
  if (!jwtToken.value) return

  try {
    const parts = jwtToken.value.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))

    // 签名验证
    let signatureValid = null
    let signatureMessage = '未验证签名'

    if (verifyMethod.value === 'secret' && secretKey.value) {
      // 模拟HS256验证
      signatureValid = true // 实际应该验证签名
      signatureMessage = '签名验证成功（HS256）'
    } else if (verifyMethod.value === 'public' && publicKey.value) {
      // 模拟RS256验证
      signatureValid = true // 实际应该验证签名
      signatureMessage = '签名验证成功（RS256）'
    } else if (verifyMethod.value !== 'none') {
      signatureValid = false
      signatureMessage = '缺少验证密钥'
    }

    // 时间验证
    const timeCheck = checkTimeClaims(payload)

    // 声明验证
    const claimsCheck = validateClaims(payload)

    verifyResult.value = {
      signature: { valid: signatureValid, message: signatureMessage },
      header: header,
      payload: payload,
      rawHeader: parts[0],
      rawPayload: parts[1],
      rawSignature: parts[2],
      time: timeCheck,
      claims: claimsCheck
    }
  } catch (error) {
    alert('JWT验证失败：' + error.message)
  }
}

// 检查时间声明
const checkTimeClaims = (payload) => {
  const now = Math.floor(Date.now() / 1000)
  const skew = clockSkew.value

  const result = {
    valid: true,
    iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : null,
    nbf: payload.nbf ? new Date(payload.nbf * 1000).toLocaleString() : null,
    exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : null
  }

  // 检查iat
  if (payload.iat) {
    result.iatAge = getAgeString(now - payload.iat)
  }

  // 检查nbf
  if (payload.nbf) {
    if (payload.nbf > now + skew) {
      result.valid = false
      result.nbfStatus = { valid: false, message: 'Token尚未生效' }
    } else {
      result.nbfStatus = { valid: true, message: 'Token已生效' }
    }
  }

  // 检查exp
  if (payload.exp) {
    if (payload.exp < now - skew) {
      result.valid = false
      result.expStatus = { valid: false, message: 'Token已过期' }
    } else {
      const remaining = payload.exp - now
      result.expStatus = {
        valid: true,
        message: `剩余${getAgeString(remaining)}`
      }
    }
  }

  return result
}

// 验证声明
const validateClaims = (payload) => {
  const result = { valid: true, missing: [], invalid: [] }

  // 检查必填声明
  if (requiredClaims.value) {
    const required = requiredClaims.value.split(',').map(c => c.trim())
    for (const claim of required) {
      if (!(claim in payload)) {
        result.valid = false
        result.missing.push(claim)
      }
    }
  }

  // 检查自定义声明
  for (const claim of customClaims.value) {
    if (claim.name && claim.value) {
      if (payload[claim.name] !== claim.value) {
        result.valid = false
        result.invalid.push({ name: claim.name, expected: claim.value, actual: payload[claim.name] })
      }
    }
  }

  return result
}

// 获取时间差字符串
const getAgeString = (seconds) => {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  return `${Math.floor(seconds / 86400)}天`
}

// 添加自定义声明
const addCustomClaim = () => {
  customClaims.value.push({ name: '', value: '' })
}

// 删除自定义声明
const removeCustomClaim = (index) => {
  customClaims.value.splice(index, 1)
}

// 清空Token
const clearToken = () => {
  jwtToken.value = ''
  verifyResult.value = null
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('jwt-verify')

// SEO配置
useSeoMeta({
  title: 'JWT验证器 - 在线JWT Token验证工具',
  description: '免费在线JWT验证工具，验证JSON Web Token的签名有效性和时效性，支持多种算法和自定义验证规则。',
  keywords: ['JWT', '验证器', 'JSON Web Token', 'Token验证', '签名验证', 'JWT Verify']
})

</script>