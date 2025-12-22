<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">安全令牌生成器</h1>
      <p class="text-muted-foreground mb-6">生成各种类型的安全令牌，JWT、API Token、CSRF Token等</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：令牌配置 -->
      <div class="space-y-6">
        <!-- 令牌类型选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">令牌类型</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="type in tokenTypes"
              :key="type.id"
              @click="selectedType = type.id"
              :class="selectedType === type.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'"
              class="p-3 rounded-lg text-left transition-colors"
            >
              <div class="font-medium">{{ type.name }}</div>
              <div class="text-xs opacity-80">{{ type.description }}</div>
            </button>
          </div>
        </div>

        <!-- JWT配置 -->
        <div v-if="selectedType === 'jwt'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">JWT配置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">算法</label>
              <select
                v-model="jwtConfig.algorithm"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="HS256">HS256 (HMAC-SHA256)</option>
                <option value="HS384">HS384 (HMAC-SHA384)</option>
                <option value="HS512">HS512 (HMAC-SHA512)</option>
                <option value="RS256">RS256 (RSA-SHA256)</option>
                <option value="RS384">RS384 (RSA-SHA384)</option>
                <option value="RS512">RS512 (RSA-SHA512)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">密钥</label>
              <input
                v-model="jwtConfig.secret"
                type="password"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入签名密钥"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">过期时间</label>
              <div class="flex gap-2">
                <input
                  v-model.number="jwtConfig.expireTime"
                  type="number"
                  min="1"
                  class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  v-model="jwtConfig.expireUnit"
                  class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="minutes">分钟</option>
                  <option value="hours">小时</option>
                  <option value="days">天</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Payload (JSON)</label>
              <textarea
                v-model="jwtConfig.payload"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="4"
                placeholder='{"userId": 123, "role": "admin"}'
              ></textarea>
            </div>
          </div>
        </div>

        <!-- API Token配置 -->
        <div v-if="selectedType === 'api'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">API Token配置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">前缀</label>
              <select
                v-model="apiTokenConfig.prefix"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">无前缀</option>
                <option value="Bearer ">Bearer</option>
                <option value="Token ">Token</option>
                <option value="sk_">sk_ (Stripe)</option>
                <option value="pk_">pk_ (Stripe)</option>
                <option value="ghp_">ghp_ (GitHub)</option>
                <option value="gho_">gho_ (GitHub)</option>
                <option value="ghu_">ghu_ (GitHub)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">令牌长度</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="apiTokenConfig.length"
                  type="range"
                  min="16"
                  max="128"
                  class="flex-1"
                />
                <input
                  v-model.number="apiTokenConfig.length"
                  type="number"
                  min="16"
                  max="128"
                  class="w-16 px-2 py-1 border rounded-lg text-center"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">字符集</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="apiTokenConfig.charset"
                    type="radio"
                    value="alphanumeric"
                    class="mr-2"
                  />
                  <span class="text-sm">字母数字 (A-Z, a-z, 0-9)</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="apiTokenConfig.charset"
                    type="radio"
                    value="hex"
                    class="mr-2"
                  />
                  <span class="text-sm">十六进制 (0-9, a-f)</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="apiTokenConfig.charset"
                    type="radio"
                    value="base64url"
                    class="mr-2"
                  />
                  <span class="text-sm">Base64URL安全字符</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- CSRF Token配置 -->
        <div v-if="selectedType === 'csrf'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">CSRF Token配置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">令牌长度</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="csrfConfig.length"
                  type="range"
                  min="32"
                  max="256"
                  step="32"
                  class="flex-1"
                />
                <input
                  v-model.number="csrfConfig.length"
                  type="number"
                  min="32"
                  max="256"
                  step="32"
                  class="w-16 px-2 py-1 border rounded-lg text-center"
                />
              </div>
            </div>

            <div>
              <label class="flex items-center">
                <input
                  v-model="csrfConfig.includeTimestamp"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm">包含时间戳</span>
              </label>
            </div>

            <div>
              <label class="flex items-center">
                <input
                  v-model="csrfConfig.includeSessionId"
                  type="checkbox"
                  class="mr-2"
                />
                <span class="text-sm">包含会话ID</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 生成按钮 -->
        <button
          @click="generateToken"
          class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
        >
          生成令牌
        </button>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 生成的令牌 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">生成的令牌</h3>
          <div v-if="generatedToken" class="space-y-4">
            <div class="p-3 bg-secondary rounded font-mono text-sm break-all">
              {{ generatedToken }}
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="copyToken"
                class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
              >
                复制令牌
              </button>
              <button
                @click="downloadToken"
                class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
              >
                下载令牌
              </button>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            配置参数并点击生成令牌
          </div>
        </div>

        <!-- 令牌详情 -->
        <div v-if="tokenDetails" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">令牌详情</h3>
          <div class="space-y-3">
            <div v-for="(value, key) in tokenDetails" :key="key"
                 class="flex justify-between text-sm">
              <span class="font-medium">{{ key }}:</span>
              <span class="font-mono">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- JWT解码 -->
        <div v-if="selectedType === 'jwt' && jwtDecoded" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">JWT解码</h3>
          <div class="space-y-4">
            <div>
              <div class="text-sm font-medium mb-2">Header</div>
              <div class="p-3 bg-secondary rounded font-mono text-sm">
                {{ jwtDecoded.header }}
              </div>
            </div>

            <div>
              <div class="text-sm font-medium mb-2">Payload</div>
              <div class="p-3 bg-secondary rounded font-mono text-sm">
                {{ jwtDecoded.payload }}
              </div>
            </div>

            <div>
              <div class="text-sm font-medium mb-2">Signature</div>
              <div class="p-3 bg-secondary rounded font-mono text-sm break-all">
                {{ jwtDecoded.signature }}
              </div>
            </div>
          </div>
        </div>

        <!-- 批量生成 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">批量生成</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">生成数量</label>
              <input
                v-model.number="batchCount"
                type="number"
                min="1"
                max="100"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              @click="generateBatchTokens"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
            >
              批量生成
            </button>

            <div v-if="batchTokens.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
              <div v-for="(token, index) in batchTokens" :key="index"
                   class="flex items-center justify-between p-2 bg-secondary rounded">
                <span class="font-mono text-xs truncate flex-1">{{ maskToken(token) }}</span>
                <button
                  @click="copyToken(token)"
                  class="ml-2 p-1 text-muted-foreground hover:text-foreground"
                  title="复制"
                >
                  <Copy class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">使用说明</h3>
          <div class="space-y-3 text-sm">
            <div v-if="selectedType === 'jwt'">
              <h4 class="font-medium text-primary">JWT (JSON Web Token)</h4>
              <p class="text-muted-foreground text-xs">
                JWT是一种开放标准（RFC 7519），用于在各方之间安全地传输信息作为JSON对象。
                常用于身份验证和信息交换。
              </p>
            </div>

            <div v-if="selectedType === 'api'">
              <h4 class="font-medium text-primary">API Token</h4>
              <p class="text-muted-foreground text-xs">
                API令牌用于验证和授权API请求。通常包含在HTTP头部的Authorization字段中。
              </p>
            </div>

            <div v-if="selectedType === 'csrf'">
              <h4 class="font-medium text-primary">CSRF Token</h4>
              <p class="text-muted-foreground text-xs">
                CSRF令牌用于防止跨站请求伪造攻击。通常存储在会话中，并在表单中包含隐藏字段。
              </p>
            </div>

            <div v-if="selectedType === 'session'">
              <h4 class="font-medium text-primary">Session ID</h4>
              <p class="text-muted-foreground text-xs">
                会话ID用于标识用户会话。通常存储在服务器端，客户端保存会话标识符。
              </p>
            </div>

            <div v-if="selectedType === 'refresh'">
              <h4 class="font-medium text-primary">Refresh Token</h4>
              <p class="text-muted-foreground text-xs">
                刷新令牌用于获取新的访问令牌，而无需重新进行身份验证。
                通常具有较长的过期时间。
              </p>
            </div>

            <div v-if="selectedType === 'otp'">
              <h4 class="font-medium text-primary">OTP (One-Time Password)</h4>
              <p class="text-muted-foreground text-xs">
                一次性密码用于双因素身份验证。可以是基于时间（TOTP）或基于事件（HOTP）。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'
import { Copy } from 'lucide-vue-next'

const { setPageTitle } = useSEO()
setPageTitle('安全令牌生成器')

// 令牌类型
const tokenTypes = [
  { id: 'jwt', name: 'JWT', description: 'JSON Web Token' },
  { id: 'api', name: 'API Token', description: 'API访问令牌' },
  { id: 'csrf', name: 'CSRF Token', description: '跨站请求防护' },
  { id: 'session', name: 'Session ID', description: '会话标识符' },
  { id: 'refresh', name: 'Refresh Token', description: '刷新令牌' },
  { id: 'otp', name: 'OTP', description: '一次性密码' }
]

// 状态管理
const selectedType = ref('jwt')
const generatedToken = ref('')
const tokenDetails = ref(null)
const jwtDecoded = ref(null)
const batchTokens = ref([])
const batchCount = ref(5)

// JWT配置
const jwtConfig = ref({
  algorithm: 'HS256',
  secret: 'your-secret-key',
  expireTime: 24,
  expireUnit: 'hours',
  payload: '{"userId": 123, "role": "user"}'
})

// API Token配置
const apiTokenConfig = ref({
  prefix: 'Bearer ',
  length: 32,
  charset: 'alphanumeric'
})

// CSRF Token配置
const csrfConfig = ref({
  length: 128,
  includeTimestamp: true,
  includeSessionId: false
})

// 生成令牌
const generateToken = () => {
  let token = ''

  switch (selectedType.value) {
    case 'jwt':
      token = generateJWT()
      break
    case 'api':
      token = generateAPIToken()
      break
    case 'csrf':
      token = generateCSRFToken()
      break
    case 'session':
      token = generateSessionId()
      break
    case 'refresh':
      token = generateRefreshToken()
      break
    case 'otp':
      token = generateOTP()
      break
  }

  generatedToken.value = token
  updateTokenDetails()
}

// 生成JWT
const generateJWT = () => {
  try {
    const header = {
      alg: jwtConfig.value.algorithm,
      typ: 'JWT'
    }

    let payload
    try {
      payload = JSON.parse(jwtConfig.value.payload)
    } catch {
      payload = { userId: 123, role: 'user' }
    }

    // 添加过期时间
    const now = Math.floor(Date.now() / 1000)
    let expireSeconds = jwtConfig.value.expireTime

    if (jwtConfig.value.expireUnit === 'minutes') {
      expireSeconds *= 60
    } else if (jwtConfig.value.expireUnit === 'hours') {
      expireSeconds *= 3600
    } else if (jwtConfig.value.expireUnit === 'days') {
      expireSeconds *= 86400
    }

    payload.exp = now + expireSeconds
    payload.iat = now

    // 简化的JWT生成（实际应用中应使用专业库）
    const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const signature = btoa(headerBase64 + '.' + payloadBase64 + jwtConfig.value.secret).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const token = headerBase64 + '.' + payloadBase64 + '.' + signature

    // 解码用于显示
    jwtDecoded.value = {
      header: JSON.stringify(header, null, 2),
      payload: JSON.stringify(payload, null, 2),
      signature
    }

    return token
  } catch (error) {
    console.error('JWT生成失败:', error)
    return 'JWT生成失败'
  }
}

// 生成API Token
const generateAPIToken = () => {
  let charset = ''
  switch (apiTokenConfig.value.charset) {
    case 'alphanumeric':
      charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      break
    case 'hex':
      charset = '0123456789abcdef'
      break
    case 'base64url':
      charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
      break
  }

  let token = ''
  for (let i = 0; i < apiTokenConfig.value.length; i++) {
    token += charset.charAt(Math.floor(Math.random() * charset.length))
  }

  return apiTokenConfig.value.prefix + token
}

// 生成CSRF Token
const generateCSRFToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let token = ''

  // 添加时间戳
  if (csrfConfig.value.includeTimestamp) {
    token += Date.now().toString(36) + '_'
  }

  // 添加随机字符串
  for (let i = 0; i < csrfConfig.value.length / 2; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // 添加会话ID（模拟）
  if (csrfConfig.value.includeSessionId) {
    token += '_' + Math.random().toString(36).substring(2, 15)
  }

  return token
}

// 生成Session ID
const generateSessionId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let sessionId = ''

  for (let i = 0; i < 64; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return sessionId
}

// 生成Refresh Token
const generateRefreshToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''

  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  // 添加前缀标识
  return 'rt_' + token
}

// 生成OTP
const generateOTP = () => {
  // 生成6位数字OTP
  let otp = ''
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10).toString()
  }
  return otp
}

// 更新令牌详情
const updateTokenDetails = () => {
  const details = {}

  switch (selectedType.value) {
    case 'jwt':
      details.type = 'JWT'
      details.algorithm = jwtConfig.value.algorithm
      details.length = generatedToken.value.length
      details.expires = `${jwtConfig.value.expireTime} ${jwtConfig.value.expireUnit}`
      break
    case 'api':
      details.type = 'API Token'
      details.prefix = apiTokenConfig.value.prefix || '无'
      details.charset = apiTokenConfig.value.charset
      details.length = generatedToken.value.length
      break
    case 'csrf':
      details.type = 'CSRF Token'
      details.length = generatedToken.value.length
      details.timestamp = csrfConfig.value.includeTimestamp ? '是' : '否'
      break
    case 'session':
      details.type = 'Session ID'
      details.length = generatedToken.value.length
      details.storage = '服务器端'
      break
    case 'refresh':
      details.type = 'Refresh Token'
      details.length = generatedToken.value.length
      details.purpose = '获取新访问令牌'
      break
    case 'otp':
      details.type = 'OTP'
      details.length = generatedToken.value.length
      details.validity = '一次性'
      break
  }

  details.generatedAt = new Date().toLocaleString()
  tokenDetails.value = details
}

// 批量生成令牌
const generateBatchTokens = () => {
  batchTokens.value = []
  for (let i = 0; i < batchCount.value; i++) {
    let token = ''
    switch (selectedType.value) {
      case 'jwt':
        token = generateJWT()
        break
      case 'api':
        token = generateAPIToken()
        break
      case 'csrf':
        token = generateCSRFToken()
        break
      case 'session':
        token = generateSessionId()
        break
      case 'refresh':
        token = generateRefreshToken()
        break
      case 'otp':
        token = generateOTP()
        break
    }
    batchTokens.value.push(token)
  }
}

// 掩码令牌显示
const maskToken = (token) => {
  if (token.length <= 8) {
    return '*'.repeat(token.length)
  }
  return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4)
}

// 复制令牌
const copyToken = async (token = generatedToken.value) => {
  if (!token) return

  try {
    await navigator.clipboard.writeText(token)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载令牌
const downloadToken = () => {
  if (!generatedToken.value) return

  const content = `Generated Token\n` +
                  `=================\n` +
                  `Type: ${selectedType.value.toUpperCase()}\n` +
                  `Generated: ${new Date().toLocaleString()}\n` +
                  `Token: ${generatedToken.value}\n`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `token-${selectedType.value}-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>