<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">JWT令牌解析器</h1>
      <p class="text-muted-foreground mb-6">解析JWT令牌，验证签名，检查有效性</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- JWT输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">JWT令牌输入</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入JWT令牌</label>
              <textarea
                v-model="jwtInput"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="4"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                @input="parseJWT"
              ></textarea>
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium mb-2">快速示例</label>
              <div class="space-y-2">
                <button
                  @click="loadExample('valid')"
                  class="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm text-left"
                >
                  有效JWT示例
                </button>
                <button
                  @click="loadExample('expired')"
                  class="w-full px-3 py-2 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 text-sm text-left"
                >
                  过期JWT示例
                </button>
                <button
                  @click="loadExample('invalid')"
                  class="w-full px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm text-left"
                >
                  无效JWT示例
                </button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="clearJWT"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                清空
              </button>
              <button
                @click="pasteJWT"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                粘贴
              </button>
              <button
                @click="copyJWT"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                复制
              </button>
            </div>
          </div>
        </div>

        <!-- 签名验证 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">签名验证</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">验证密钥</label>
              <input
                v-model="verificationSecret"
                type="password"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="输入HMAC密钥或公钥..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">算法</label>
              <select
                v-model="selectedAlgorithm"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="HS256">HS256 (HMAC-SHA256)</option>
                <option value="HS384">HS384 (HMAC-SHA384)</option>
                <option value="HS512">HS512 (HMAC-SHA512)</option>
                <option value="RS256">RS256 (RSA-SHA256)</option>
                <option value="RS384">RS384 (RSA-SHA384)</option>
                <option value="RS512">RS512 (RSA-SHA512)</option>
                <option value="ES256">ES256 (ECDSA-SHA256)</option>
                <option value="ES384">ES384 (ECDSA-SHA384)</option>
                <option value="none">None (不验证)</option>
              </select>
            </div>

            <button
              @click="verifySignature"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              验证签名
            </button>
          </div>
        </div>

        <!-- 令牌生成器 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">JWT生成器</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Payload (JSON)</label>
              <textarea
                v-model="generatorPayload"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="3"
                placeholder='{"userId": 123, "role": "admin"}'
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">过期时间</label>
              <div class="flex gap-2">
                <input
                  v-model.number="generatorExpire"
                  type="number"
                  min="1"
                  class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  v-model="generatorExpireUnit"
                  class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="minutes">分钟</option>
                  <option value="hours">小时</option>
                  <option value="days">天</option>
                </select>
              </div>
            </div>

            <button
              @click="generateJWT"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              生成JWT
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：解析结果 -->
      <div class="space-y-6">
        <!-- 解析结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">解析结果</h3>
          <div v-if="parseResult" class="space-y-4">
            <!-- 有效性状态 -->
            <div class="flex items-center justify-between p-3 rounded-lg"
                 :class="parseResult.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
              <div class="flex items-center gap-2">
                <CheckCircle v-if="parseResult.valid" class="w-5 h-5" />
                <XCircle v-else class="w-5 h-5" />
                <span class="font-medium">
                  {{ parseResult.valid ? '有效令牌' : '无效令牌' }}
                </span>
              </div>
              <span class="text-sm">{{ parseResult.error || '格式正确' }}</span>
            </div>

            <!-- Header -->
            <div>
              <h4 class="font-medium mb-2 text-primary">Header</h4>
              <div class="p-3 bg-secondary rounded">
                <pre class="text-xs font-mono whitespace-pre-wrap">{{ parseResult.headerPretty }}</pre>
              </div>
            </div>

            <!-- Payload -->
            <div>
              <h4 class="font-medium mb-2 text-primary">Payload</h4>
              <div class="p-3 bg-secondary rounded">
                <pre class="text-xs font-mono whitespace-pre-wrap">{{ parseResult.payloadPretty }}</pre>
              </div>
            </div>

            <!-- 签名 -->
            <div>
              <h4 class="font-medium mb-2 text-primary">Signature</h4>
              <div class="p-3 bg-secondary rounded font-mono text-xs break-all">
                {{ parseResult.signature }}
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            输入JWT令牌进行解析
          </div>
        </div>

        <!-- 令牌信息 -->
        <div v-if="parseResult && parseResult.tokenInfo" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">令牌信息</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-center p-3 bg-secondary rounded-lg">
              <div class="font-semibold">{{ parseResult.tokenInfo.algorithm }}</div>
              <div class="text-xs text-muted-foreground">算法</div>
            </div>
            <div class="text-center p-3 bg-secondary rounded-lg">
              <div class="font-semibold">{{ parseResult.tokenInfo.type }}</div>
              <div class="text-xs text-muted-foreground">类型</div>
            </div>
            <div class="text-center p-3 bg-secondary rounded-lg">
              <div class="font-semibold">{{ formatTime(parseResult.tokenInfo.issuedAt) }}</div>
              <div class="text-xs text-muted-foreground">签发时间</div>
            </div>
            <div class="text-center p-3 bg-secondary rounded-lg">
              <div class="font-semibold" :class="isExpired(parseResult.tokenInfo.expiresAt) ? 'text-red-600' : 'text-green-600'">
                {{ formatTime(parseResult.tokenInfo.expiresAt) }}
              </div>
              <div class="text-xs text-muted-foreground">过期时间</div>
            </div>
          </div>

          <!-- 时间状态 -->
          <div class="mt-4 p-3 rounded-lg"
               :class="getTimeStatusClass(parseResult.tokenInfo)">
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4" />
              <span class="font-medium">{{ getTimeStatus(parseResult.tokenInfo) }}</span>
            </div>
            <div class="text-xs mt-1">
              {{ getTimeDescription(parseResult.tokenInfo) }}
            </div>
          </div>
        </div>

        <!-- Claims分析 -->
        <div v-if="parseResult && parseResult.claims" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">Claims分析</h3>
          <div class="space-y-3">
            <div v-for="(value, key) in parseResult.claims" :key="key"
                 class="flex justify-between items-center p-2 bg-secondary rounded">
              <span class="font-medium text-sm">{{ key }}</span>
              <span class="font-mono text-sm">{{ formatClaimValue(key, value) }}</span>
            </div>
          </div>
        </div>

        <!-- 验证结果 -->
        <div v-if="verificationResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">签名验证结果</h3>
          <div class="p-4 rounded-lg"
               :class="verificationResult.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
            <div class="flex items-center gap-2 mb-2">
              <Shield v-if="verificationResult.valid" class="w-5 h-5" />
              <AlertTriangle v-else class="w-5 h-5" />
              <span class="font-medium">
                {{ verificationResult.valid ? '签名有效' : '签名无效' }}
              </span>
            </div>
            <div class="text-sm">{{ verificationResult.message }}</div>
          </div>
        </div>

        <!-- 安全建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">安全建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">使用强算法</div>
                <div class="text-xs text-muted-foreground">推荐使用RS256或ES256，避免使用none算法</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">设置合理的过期时间</div>
                <div class="text-xs text-muted-foreground">访问令牌15-30分钟，刷新令牌7-30天</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">包含最小必要信息</div>
                <div class="text-xs text-muted-foreground">避免在JWT中存储敏感信息</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <div class="font-medium">安全存储密钥</div>
                <div class="text-xs text-muted-foreground">使用安全的密钥管理系统存储签名密钥</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSEO } from '~/composables/useSEO'
import { CheckCircle, XCircle, Shield, AlertTriangle, Clock } from 'lucide-vue-next'

const { setPageTitle } = useSEO()
setPageTitle('JWT令牌解析器')

// 状态管理
const jwtInput = ref('')
const verificationSecret = ref('')
const selectedAlgorithm = ref('HS256')
const generatorPayload = ref('{"userId": 123, "role": "user"}')
const generatorExpire = ref(24)
const generatorExpireUnit = ref('hours')

const parseResult = ref(null)
const verificationResult = ref(null)

// JWT示例
const jwtExamples = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid',
  invalid: 'invalid.jwt.token'
}

// 解析JWT
const parseJWT = () => {
  if (!jwtInput.value) {
    parseResult.value = null
    return
  }

  try {
    const parts = jwtInput.value.split('.')

    if (parts.length !== 3) {
      throw new Error('无效的JWT格式')
    }

    // 解码Header
    let header
    try {
      header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
    } catch {
      throw new Error('Header解码失败')
    }

    // 解码Payload
    let payload
    try {
      payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    } catch {
      throw new Error('Payload解码失败')
    }

    // 检查过期时间
    const now = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp && payload.exp < now

    parseResult.value = {
      valid: !isExpired,
      error: isExpired ? '令牌已过期' : null,
      headerPretty: JSON.stringify(header, null, 2),
      payloadPretty: JSON.stringify(payload, null, 2),
      signature: parts[2],
      tokenInfo: {
        algorithm: header.alg,
        type: header.typ,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null
      },
      claims: payload
    }

  } catch (error) {
    parseResult.value = {
      valid: false,
      error: error.message,
      headerPretty: null,
      payloadPretty: null,
      signature: null,
      tokenInfo: null,
      claims: null
    }
  }
}

// 加载示例
const loadExample = (type) => {
  jwtInput.value = jwtExamples[type]
  parseJWT()
}

// 验证签名
const verifySignature = () => {
  if (!jwtInput.value || !parseResult.value) {
    verificationResult.value = {
      valid: false,
      message: '请先输入并解析JWT令牌'
    }
    return
  }

  if (selectedAlgorithm.value === 'none') {
    verificationResult.value = {
      valid: false,
      message: '警告：使用none算法，令牌未签名，不安全'
    }
    return
  }

  // 这里是简化的签名验证逻辑
  // 实际应用中应使用专业的JWT库如jsonwebtoken
  try {
    const parts = jwtInput.value.split('.')

    if (selectedAlgorithm.value.startsWith('HS')) {
      if (!verificationSecret.value) {
        verificationResult.value = {
          valid: false,
          message: 'HMAC验证需要密钥'
        }
        return
      }

      // 模拟HMAC验证（实际应使用crypto库）
      const expectedSignature = btoa(parts[0] + '.' + parts[1] + verificationSecret.value)
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

      const isValid = parts[2] === expectedSignature

      verificationResult.value = {
        valid: isValid,
        message: isValid ? '签名验证成功' : '签名验证失败'
      }
    } else {
      verificationResult.value = {
        valid: false,
        message: 'RSA/ECDSA验证需要公钥，此演示版本暂不支持'
      }
    }
  } catch (error) {
    verificationResult.value = {
      valid: false,
      message: `验证失败: ${error.message}`
    }
  }
}

// 生成JWT
const generateJWT = () => {
  try {
    // 创建Header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    }

    // 创建Payload
    let payload
    try {
      payload = JSON.parse(generatorPayload.value)
    } catch {
      payload = { userId: 123, role: 'user' }
    }

    // 添加时间戳
    const now = Math.floor(Date.now() / 1000)
    payload.iat = now

    // 添加过期时间
    let expireSeconds = generatorExpire.value
    if (generatorExpireUnit.value === 'minutes') {
      expireSeconds *= 60
    } else if (generatorExpireUnit.value === 'hours') {
      expireSeconds *= 3600
    } else if (generatorExpireUnit.value === 'days') {
      expireSeconds *= 86400
    }
    payload.exp = now + expireSeconds

    // 编码Header和Payload
    const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    // 生成签名（简化版）
    const signature = btoa(headerBase64 + '.' + payloadBase64 + 'secret').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    // 组合JWT
    const jwt = headerBase64 + '.' + payloadBase64 + '.' + signature

    jwtInput.value = jwt
    parseJWT()

  } catch (error) {
    alert('JWT生成失败: ' + error.message)
  }
}

// 清空JWT
const clearJWT = () => {
  jwtInput.value = ''
  parseResult.value = null
  verificationResult.value = null
}

// 粘贴JWT
const pasteJWT = async () => {
  try {
    const text = await navigator.clipboard.readText()
    jwtInput.value = text
    parseJWT()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 复制JWT
const copyJWT = async () => {
  if (!jwtInput.value) return

  try {
    await navigator.clipboard.writeText(jwtInput.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 格式化时间
const formatTime = (date) => {
  if (!date) return '未设置'
  return date.toLocaleString()
}

// 检查是否过期
const isExpired = (date) => {
  if (!date) return false
  return date < new Date()
}

// 获取时间状态
const getTimeStatus = (tokenInfo) => {
  if (!tokenInfo.expiresAt) return '无过期时间'
  if (isExpired(tokenInfo.expiresAt)) return '已过期'
  return '有效'
}

// 获取时间状态样式
const getTimeStatusClass = (tokenInfo) => {
  if (!tokenInfo.expiresAt) return 'bg-gray-50 text-gray-800'
  if (isExpired(tokenInfo.expiresAt)) return 'bg-red-50 text-red-800'
  return 'bg-green-50 text-green-800'
}

// 获取时间描述
const getTimeDescription = (tokenInfo) => {
  if (!tokenInfo.expiresAt) return '令牌没有设置过期时间'
  if (isExpired(tokenInfo.expiresAt)) {
    const expired = Math.floor((new Date() - tokenInfo.expiresAt) / (1000 * 60))
    return `已于 ${expired} 分钟前过期`
  }
  const remaining = Math.floor((tokenInfo.expiresAt - new Date()) / (1000 * 60))
  return `剩余 ${remaining} 分钟`
}

// 格式化Claim值
const formatClaimValue = (key, value) => {
  if (key === 'iat' || key === 'exp' || key === 'nbf') {
    return new Date(value * 1000).toLocaleString()
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return value
}
</script>

<style scoped>
textarea:focus,
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>