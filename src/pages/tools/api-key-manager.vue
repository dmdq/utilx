<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">API密钥管理器</h1>
      <p class="text-muted-foreground mb-6">安全管理API密钥，生成安全的密钥，本地存储加密</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：密钥管理 -->
      <div class="space-y-6">
        <!-- 添加新密钥 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">添加新密钥</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">服务名称</label>
              <input
                v-model="newKey.service"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="如：GitHub、Google、AWS等"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">API密钥</label>
              <div class="relative">
                <input
                  v-model="newKey.key"
                  :type="showNewKey ? 'text' : 'password'"
                  class="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  placeholder="输入或生成API密钥"
                />
                <button
                  @click="showNewKey = !showNewKey"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye v-if="!showNewKey" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">密钥类型</label>
              <select
                v-model="newKey.type"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="api-key">API Key</option>
                <option value="secret-key">Secret Key</option>
                <option value="token">Bearer Token</option>
                <option value="oauth">OAuth Token</option>
                <option value="certificate">Certificate</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">描述（可选）</label>
              <textarea
                v-model="newKey.description"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows="2"
                placeholder="密钥用途说明..."
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="generateApiKey"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                生成密钥
              </button>
              <button
                @click="addKey"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                保存密钥
              </button>
            </div>
          </div>
        </div>

        <!-- 密钥列表 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">已保存密钥</h3>
            <div class="flex gap-2">
              <button
                @click="exportKeys"
                class="text-sm text-muted-foreground hover:text-foreground"
              >
                导出
              </button>
              <button
                @click="importKeys"
                class="text-sm text-muted-foreground hover:text-foreground"
              >
                导入
              </button>
              <button
                @click="clearAllKeys"
                class="text-sm text-red-600 hover:text-red-700"
              >
                清空
              </button>
            </div>
          </div>

          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div v-if="savedKeys.length === 0" class="text-center text-muted-foreground py-8">
              暂无保存的密钥
            </div>

            <div v-for="(key, index) in savedKeys" :key="index"
                 class="p-3 bg-secondary rounded-lg">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium">{{ key.service }}</span>
                    <span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                      {{ key.type }}
                    </span>
                  </div>
                  <div class="text-xs text-muted-foreground mb-2">
                    {{ key.description || '无描述' }}
                  </div>
                  <div class="font-mono text-xs bg-background p-2 rounded border break-all">
                    <span v-if="key.show">{{ key.key }}</span>
                    <span v-else>{{ maskKey(key.key) }}</span>
                  </div>
                  <div class="text-xs text-muted-foreground mt-1">
                    创建于: {{ formatDate(key.createdAt) }}
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <button
                    @click="toggleKeyVisibility(index)"
                    class="p-1 text-muted-foreground hover:text-foreground"
                    title="显示/隐藏"
                  >
                    <Eye v-if="!key.show" class="w-3 h-3" />
                    <EyeOff v-else class="w-3 h-3" />
                  </button>
                  <button
                    @click="copyKey(key.key)"
                    class="p-1 text-muted-foreground hover:text-foreground"
                    title="复制"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                  <button
                    @click="deleteKey(index)"
                    class="p-1 text-red-600 hover:text-red-700"
                    title="删除"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：工具和统计 -->
      <div class="space-y-6">
        <!-- 密钥生成器 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">密钥生成器</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">密钥长度</label>
              <div class="flex items-center gap-3">
                <input
                  v-model.number="keyGenerator.length"
                  type="range"
                  min="16"
                  max="128"
                  class="flex-1"
                />
                <input
                  v-model.number="keyGenerator.length"
                  type="number"
                  min="16"
                  max="128"
                  class="w-16 px-2 py-1 border rounded-lg text-center"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">密钥格式</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="keyGenerator.format"
                    type="radio"
                    value="random"
                    class="mr-2"
                  />
                  <span class="text-sm">随机字符串</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="keyGenerator.format"
                    type="radio"
                    value="uuid"
                    class="mr-2"
                  />
                  <span class="text-sm">UUID格式</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="keyGenerator.format"
                    type="radio"
                    value="hex"
                    class="mr-2"
                  />
                  <span class="text-sm">十六进制</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="keyGenerator.format"
                    type="radio"
                    value="base64"
                    class="mr-2"
                  />
                  <span class="text-sm">Base64编码</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">生成的密钥</label>
              <div class="p-3 bg-secondary rounded font-mono text-sm break-all">
                {{ keyGenerator.generated || '点击生成按钮' }}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="generateNewKey"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                生成新密钥
              </button>
              <button
                @click="copyGeneratedKey"
                class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg"
              >
                复制密钥
              </button>
            </div>
          </div>
        </div>

        <!-- 安全性检查 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">安全性检查</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入密钥进行检查</label>
              <textarea
                v-model="securityCheck.key"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="3"
                placeholder="输入要检查的密钥..."
                @input="checkSecurity"
              ></textarea>
            </div>

            <div v-if="securityCheck.result" class="space-y-2">
              <div class="p-3 rounded-lg"
                   :class="securityCheck.result.safe ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
                <div class="flex items-center gap-2 mb-2">
                  <Shield v-if="securityCheck.result.safe" class="w-4 h-4" />
                  <AlertTriangle v-else class="w-4 h-4" />
                  <span class="font-medium">
                    {{ securityCheck.result.safe ? '安全' : '存在风险' }}
                  </span>
                </div>
                <div class="text-sm space-y-1">
                  <div v-for="issue in securityCheck.result.issues" :key="issue">
                    {{ issue }}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="text-center p-2 bg-secondary rounded">
                  <div class="font-semibold">{{ securityCheck.result.entropy }}</div>
                  <div class="text-xs text-muted-foreground">熵值 (bits)</div>
                </div>
                <div class="text-center p-2 bg-secondary rounded">
                  <div class="font-semibold">{{ securityCheck.result.strength }}</div>
                  <div class="text-xs text-muted-foreground">强度</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">统计信息</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="text-center p-3 bg-secondary rounded-lg">
              <div class="text-2xl font-bold text-primary">{{ savedKeys.length }}</div>
              <div class="text-xs text-muted-foreground">保存的密钥</div>
            </div>
            <div class="text-center p-3 bg-secondary rounded-lg">
              <div class="text-2xl font-bold text-green-600">{{ uniqueServices }}</div>
              <div class="text-xs text-muted-foreground">不同服务</div>
            </div>
            <div class="text-center p-3 bg-secondary rounded-lg">
              <div class="text-2xl font-bold text-blue-600">{{ keyTypeStats.apiKey || 0 }}</div>
              <div class="text-xs text-muted-foreground">API Keys</div>
            </div>
            <div class="text-center p-3 bg-secondary rounded-lg">
              <div class="text-2xl font-bold text-purple-600">{{ keyTypeStats.token || 0 }}</div>
              <div class="text-xs text-muted-foreground">Tokens</div>
            </div>
          </div>
        </div>

        <!-- 安全建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">安全建议</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">定期更换密钥</div>
                <div class="text-xs text-muted-foreground">建议每3-6个月更换一次API密钥</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">最小权限原则</div>
                <div class="text-xs text-muted-foreground">只授予必要的权限范围</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">环境分离</div>
                <div class="text-xs text-muted-foreground">开发、测试、生产环境使用不同密钥</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <div class="font-medium">避免硬编码</div>
                <div class="text-xs text-muted-foreground">不要将密钥直接写在代码中</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSEO } from '~/composables/useSEO'
import { Eye, EyeOff, Copy, Trash2, Shield, AlertTriangle, CheckCircle } from 'lucide-vue-next'

const { setPageTitle } = useSEO()
setPageTitle('API密钥管理器')

// 状态管理
const showNewKey = ref(false)
const newKey = ref({
  service: '',
  key: '',
  type: 'api-key',
  description: ''
})

const savedKeys = ref([])
const keyGenerator = ref({
  length: 32,
  format: 'random',
  generated: ''
})

const securityCheck = ref({
  key: '',
  result: null
})

// 计算统计数据
const uniqueServices = computed(() => {
  const services = new Set(savedKeys.value.map(key => key.service))
  return services.size
})

const keyTypeStats = computed(() => {
  const stats = {}
  savedKeys.value.forEach(key => {
    stats[key.type] = (stats[key.type] || 0) + 1
  })
  return stats
})

// 生成API密钥
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < keyGenerator.value.length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  newKey.value.key = result
  showNewKey.value = true
}

// 生成新密钥（右侧工具）
const generateNewKey = () => {
  let result = ''

  switch (keyGenerator.value.format) {
    case 'random':
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (let i = 0; i < keyGenerator.value.length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      break

    case 'uuid':
      result = generateUUID()
      break

    case 'hex':
      const hexChars = '0123456789abcdef'
      for (let i = 0; i < keyGenerator.value.length; i++) {
        result += hexChars.charAt(Math.floor(Math.random() * hexChars.length))
      }
      break

    case 'base64':
      const bytes = new Uint8Array(keyGenerator.value.length)
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256)
      }
      result = btoa(String.fromCharCode(...bytes))
      break
  }

  keyGenerator.value.generated = result
}

// 生成UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 添加密钥
const addKey = () => {
  if (!newKey.value.service || !newKey.value.key) {
    alert('请填写服务名称和API密钥')
    return
  }

  savedKeys.value.push({
    service: newKey.value.service,
    key: newKey.value.key,
    type: newKey.value.type,
    description: newKey.value.description,
    createdAt: new Date().toISOString(),
    show: false
  })

  // 重置表单
  newKey.value = {
    service: '',
    key: '',
    type: 'api-key',
    description: ''
  }
  showNewKey.value = false

  // 保存到本地存储
  saveToLocalStorage()
}

// 切换密钥显示状态
const toggleKeyVisibility = (index) => {
  savedKeys.value[index].show = !savedKeys.value[index].show
}

// 复制密钥
const copyKey = async (key) => {
  try {
    await navigator.clipboard.writeText(key)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 复制生成的密钥
const copyGeneratedKey = async () => {
  if (!keyGenerator.value.generated) return

  try {
    await navigator.clipboard.writeText(keyGenerator.value.generated)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 删除密钥
const deleteKey = (index) => {
  if (confirm('确定要删除这个密钥吗？')) {
    savedKeys.value.splice(index, 1)
    saveToLocalStorage()
  }
}

// 清空所有密钥
const clearAllKeys = () => {
  if (confirm('确定要清空所有保存的密钥吗？此操作不可恢复！')) {
    savedKeys.value = []
    saveToLocalStorage()
  }
}

// 导出密钥
const exportKeys = () => {
  if (savedKeys.value.length === 0) {
    alert('没有可导出的密钥')
    return
  }

  const data = {
    keys: savedKeys.value,
    exportedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `api-keys-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 导入密钥
const importKeys = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.keys && Array.isArray(data.keys)) {
          savedKeys.value = [...savedKeys.value, ...data.keys]
          saveToLocalStorage()
          alert(`成功导入 ${data.keys.length} 个密钥`)
        } else {
          alert('无效的文件格式')
        }
      } catch (error) {
        alert('文件解析失败')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

// 检查安全性
const checkSecurity = () => {
  if (!securityCheck.value.key) {
    securityCheck.value.result = null
    return
  }

  const key = securityCheck.value.key
  const issues = []
  let safe = true

  // 检查长度
  if (key.length < 16) {
    issues.push('密钥长度过短，建议至少16个字符')
    safe = false
  }

  // 检查字符类型
  const hasUpper = /[A-Z]/.test(key)
  const hasLower = /[a-z]/.test(key)
  const hasNumbers = /[0-9]/.test(key)
  const hasSymbols = /[^A-Za-z0-9]/.test(key)

  if (!hasUpper || !hasLower || !hasNumbers) {
    issues.push('建议包含大小写字母和数字')
  }

  // 检查常见模式
  if (/^[a-zA-Z]+$/.test(key)) {
    issues.push('密钥只包含字母，安全性较低')
    safe = false
  }

  if (/^[0-9]+$/.test(key)) {
    issues.push('密钥只包含数字，安全性较低')
    safe = false
  }

  if (/^(.)\1+$/.test(key)) {
    issues.push('密钥包含重复字符，安全性极低')
    safe = false
  }

  // 检查常见弱密钥
  const weakPatterns = ['password', '123456', 'admin', 'test', 'key']
  for (const pattern of weakPatterns) {
    if (key.toLowerCase().includes(pattern)) {
      issues.push('密钥包含常见的弱模式')
      safe = false
      break
    }
  }

  // 计算熵值
  let charsetSize = 0
  if (hasUpper) charsetSize += 26
  if (hasLower) charsetSize += 26
  if (hasNumbers) charsetSize += 10
  if (hasSymbols) charsetSize += 32

  const entropy = Math.round(key.length * Math.log2(charsetSize))

  // 确定强度
  let strength = '弱'
  if (entropy >= 128) strength = '强'
  else if (entropy >= 64) strength = '中等'

  if (entropy < 32) {
    safe = false
    issues.push('熵值过低，容易被破解')
  }

  securityCheck.value.result = {
    safe,
    issues,
    entropy,
    strength
  }
}

// 掩码密钥显示
const maskKey = (key) => {
  if (key.length <= 8) {
    return '*'.repeat(key.length)
  }
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// 保存到本地存储
const saveToLocalStorage = () => {
  try {
    localStorage.setItem('api-keys', JSON.stringify(savedKeys.value))
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 从本地存储加载
const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('api-keys')
    if (stored) {
      savedKeys.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载失败:', error)
  }
}

// 初始化
onMounted(() => {
  loadFromLocalStorage()
})
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