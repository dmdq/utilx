<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">密码生成器</h1>
      <p class="text-muted-foreground">生成安全、随机的密码，支持自定义密码规则</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 密码生成选项 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">密码选项</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 密码长度 -->
          <div>
            <label class="text-sm font-medium mb-2 block">
              密码长度: {{ passwordLength }}
            </label>
            <input
              v-model.number="passwordLength"
              type="range"
              min="4"
              max="128"
              class="w-full"
            />
            <div class="flex justify-between text-xs text-muted-foreground mt-1">
              <span>4</span>
              <span>128</span>
            </div>
          </div>

          <!-- 密码数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">生成数量</label>
            <select
              v-model.number="passwordCount"
              class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option :value="1">1 个密码</option>
              <option :value="5">5 个密码</option>
              <option :value="10">10 个密码</option>
              <option :value="20">20 个密码</option>
            </select>
          </div>
        </div>

        <!-- 字符类型 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-3 block">包含字符类型</label>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="options.uppercase"
                class="mr-2"
              />
              <span class="text-sm">大写字母 (A-Z)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="options.lowercase"
                class="mr-2"
              />
              <span class="text-sm">小写字母 (a-z)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="options.numbers"
                class="mr-2"
              />
              <span class="text-sm">数字 (0-9)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="options.symbols"
                class="mr-2"
              />
              <span class="text-sm">特殊符号 (!@#$...)</span>
            </label>
          </div>
        </div>

        <!-- 高级选项 -->
        <div class="mt-6 pt-6 border-t">
          <label class="text-sm font-medium mb-3 block">高级选项</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="options.excludeSimilar"
                class="mr-2"
              />
              <span class="text-sm">排除相似字符 (0O, l1, I)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="options.excludeAmbiguous"
                class="mr-2"
              />
              <span class="text-sm">排除歧义字符 ({}`~, etc.)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="options.requireEachType"
                class="mr-2"
              />
              <span class="text-sm">每种类型至少一个</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="options.noRepeating"
                class="mr-2"
              />
              <span class="text-sm">不重复字符</span>
            </label>
          </div>
        </div>

        <!-- 自定义字符集 -->
        <div class="mt-6">
          <label class="text-sm font-medium mb-2 block">自定义字符集（可选）</label>
          <textarea
            v-model="customChars"
            placeholder="输入要包含的自定义字符..."
            class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            rows="2"
          ></textarea>
        </div>
      </div>

      <!-- 生成按钮 -->
      <div class="flex justify-center">
        <button
          @click="generatePasswords"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Shield class="w-5 h-5" />
          生成密码
        </button>
      </div>

      <!-- 密码强度指示器 -->
      <div v-if="generatedPasswords.length > 0" class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">密码强度分析</h2>
        <div class="space-y-4">
          <div v-for="(password, index) in generatedPasswords" :key="index" class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1">
                <code class="font-mono text-lg bg-muted px-3 py-2 rounded select-all">{{ password }}</code>
                <div class="flex gap-2">
                  <button
                    @click="copyPassword(password)"
                    class="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                  <button
                    @click="regeneratePassword(index)"
                    class="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <span class="text-sm font-medium">{{ getStrengthLabel(password) }}</span>
                <div class="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all"
                    :class="getStrengthColor(password)"
                    :style="{ width: getStrengthPercent(password) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="text-xs text-muted-foreground">
              熵值: {{ calculateEntropy(password) }} 位 · {{ getCrackTime(password) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div v-if="generatedPasswords.length > 0" class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">批量操作</h2>
        <div class="flex gap-3">
          <button
            @click="copyAllPasswords"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            复制所有密码
          </button>
          <button
            @click="downloadPasswords"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            下载密码文件
          </button>
          <button
            @click="clearPasswords"
            class="px-4 py-2 bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            清空密码
          </button>
        </div>
      </div>

      <!-- 密码安全建议 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">密码安全建议</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-3 flex items-center gap-2">
              <Check class="w-5 h-5 text-green-500" />
              最佳实践
            </h3>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li>使用至少 12 个字符的密码</li>
              <li>包含大小写字母、数字和特殊符号</li>
              <li>避免使用个人信息（生日、姓名等）</li>
              <li>不要重复使用相同的密码</li>
              <li>定期更换重要账户的密码</li>
            </ul>
          </div>
          <div>
            <h3 class="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-yellow-500" />
              避免的做法
            </h3>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li>不要使用常见的单词或短语</li>
              <li>避免使用连续或重复的字符（123, aaa）</li>
              <li>不要在多个网站使用相同密码</li>
              <li>不要将密码写在明文位置</li>
              <li>不要通过不安全的渠道传输密码</li>
            </ul>
          </div>
        </div>

        <!-- 密码管理建议 -->
        <div class="mt-6 pt-6 border-t">
          <h3 class="font-medium mb-3">密码管理</h3>
          <p class="text-sm text-muted-foreground mb-3">
            推荐使用密码管理器来安全地存储和管理您的密码：
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-muted rounded-lg">
              <h4 class="font-medium mb-1">本地密码管理器</h4>
              <p class="text-xs text-muted-foreground">如 KeePass、Bitwarden</p>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h4 class="font-medium mb-1">浏览器密码管理器</h4>
              <p class="text-xs text-muted-foreground">Chrome、Firefox 内置功能</p>
            </div>
            <div class="p-4 bg-muted rounded-lg">
              <h4 class="font-medium mb-1">两步验证 (2FA)</h4>
              <p class="text-xs text-muted-foreground">增加额外的安全层</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/uuid-generator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">UUID生成器</p>
              <p class="text-xs text-muted-foreground">生成唯一标识符</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/sha-generator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Shield class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">SHA生成器</p>
              <p class="text-xs text-muted-foreground">生成哈希值</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/aes-encrypt"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Lock class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">AES加密</p>
              <p class="text-xs text-muted-foreground">对称加密工具</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Shield, Copy, RefreshCw, Check, AlertTriangle, Hash, Lock, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'text', name: '文本处理', description: '文本处理工具集合' }

// 状态管理
const passwordLength = ref(16)
const passwordCount = ref(5)
const generatedPasswords = ref([])
const customChars = ref('')
const copiedPassword = ref('')

// 密码选项
const options = ref({
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
  requireEachType: true,
  noRepeating: false
})

// 字符集定义
const charset = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

// 相似字符
const similarChars = '0O1lI'

// 歧义字符
const ambiguousChars = '`~\'"\\;<>{}[]()|'

// 获取字符集
const getCharset = () => {
  let chars = ''

  if (options.value.uppercase) chars += charset.uppercase
  if (options.value.lowercase) chars += charset.lowercase
  if (options.value.numbers) chars += charset.numbers
  if (options.value.symbols) chars += charset.symbols

  // 添加自定义字符
  if (customChars.value) {
    chars += customChars.value
  }

  // 排除相似字符
  if (options.value.excludeSimilar) {
    chars = chars.split('').filter(char => !similarChars.includes(char)).join('')
  }

  // 排除歧义字符
  if (options.value.excludeAmbiguous) {
    chars = chars.split('').filter(char => !ambiguousChars.includes(char)).join('')
  }

  return chars
}

// 生成单个密码
const generateSinglePassword = () => {
  const chars = getCharset()
  if (!chars) return ''

  let password = ''
  const usedChars = new Set()

  // 如果要求每种类型至少一个
  if (options.value.requireEachType) {
    const types = []
    if (options.value.uppercase) types.push('uppercase')
    if (options.value.lowercase) types.push('lowercase')
    if (options.value.numbers) types.push('numbers')
    if (options.value.symbols) types.push('symbols')

    // 确保每种类型至少有一个字符
    for (const type of types) {
      const typeCharset = charset[type].split('').filter(char => {
        if (options.value.excludeSimilar && similarChars.includes(char)) return false
        if (options.value.excludeAmbiguous && ambiguousChars.includes(char)) return false
        return true
      })

      if (typeCharset.length > 0) {
        const char = typeCharset[Math.floor(Math.random() * typeCharset.length)]
        password += char
        if (options.value.noRepeating) usedChars.add(char)
      }
    }
  }

  // 生成剩余的字符
  while (password.length < passwordLength.value) {
    let char
    do {
      char = chars[Math.floor(Math.random() * chars.length)]
    } while (options.value.noRepeating && usedChars.has(char) && usedChars.size < chars.length)

    password += char
    if (options.value.noRepeating) usedChars.add(char)
  }

  // 打乱密码字符顺序（为了满足长度要求）
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// 生成密码
const generatePasswords = () => {
  generatedPasswords.value = []
  for (let i = 0; i < passwordCount.value; i++) {
    generatedPasswords.value.push(generateSinglePassword())
  }
}

// 重新生成单个密码
const regeneratePassword = (index) => {
  generatedPasswords.value[index] = generateSinglePassword()
}

// 计算密码强度
const calculateStrength = (password) => {
  let strength = 0

  // 长度分数
  if (password.length >= 8) strength += 25
  if (password.length >= 12) strength += 25
  if (password.length >= 16) strength += 25

  // 字符类型分数
  if (/[a-z]/.test(password)) strength += 10
  if (/[A-Z]/.test(password)) strength += 10
  if (/[0-9]/.test(password)) strength += 10
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15

  // 额外加分项
  if (password.length >= 20) strength += 10
  if (password.length >= 30) strength += 10

  return Math.min(100, strength)
}

// 获取强度标签
const getStrengthLabel = (password) => {
  const strength = calculateStrength(password)
  if (strength < 30) return '弱'
  if (strength < 60) return '中等'
  if (strength < 80) return '强'
  return '非常强'
}

// 获取强度颜色
const getStrengthColor = (password) => {
  const strength = calculateStrength(password)
  if (strength < 30) return 'bg-red-500'
  if (strength < 60) return 'bg-yellow-500'
  if (strength < 80) return 'bg-blue-500'
  return 'bg-green-500'
}

// 获取强度百分比
const getStrengthPercent = (password) => {
  return calculateStrength(password)
}

// 计算熵值
const calculateEntropy = (password) => {
  const charsetSize = getCharset().length
  return Math.round(password.length * Math.log2(charsetSize))
}

// 计算破解时间
const getCrackTime = (password) => {
  const entropy = calculateEntropy(password)
  const guessesPerSecond = 100000000000 // 假设每秒 1000 亿次尝试
  const seconds = Math.pow(2, entropy) / guessesPerSecond

  if (seconds < 60) return '瞬间破解'
  if (seconds < 3600) return `约 ${Math.round(seconds / 60)} 分钟`
  if (seconds < 86400) return `约 ${Math.round(seconds / 3600)} 小时`
  if (seconds < 31536000) return `约 ${Math.round(seconds / 86400)} 天`
  if (seconds < 31536000000) return `约 ${Math.round(seconds / 31536000)} 年`
  return '超过千年'
}

// 复制密码
const copyPassword = async (password) => {
  try {
    await navigator.clipboard.writeText(password)
    copiedPassword.value = password
    setTimeout(() => {
      copiedPassword.value = ''
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = password
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedPassword.value = password
    setTimeout(() => {
      copiedPassword.value = ''
    }, 2000)
  }
}

// 复制所有密码
const copyAllPasswords = async () => {
  const text = generatedPasswords.value.join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

// 下载密码
const downloadPasswords = () => {
  const text = `Generated Passwords - ${new Date().toLocaleString()}\n` +
                '=' .repeat(50) + '\n' +
                generatedPasswords.value.map((pwd, i) => `${i + 1}. ${pwd}`).join('\n')

  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `passwords-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 清空密码
const clearPasswords = () => {
  generatedPasswords.value = []
}

// 初始化时生成密码
generatePasswords()

// SEO配置
useSeoMeta({
  title: '密码生成器 - 在线安全随机密码生成工具',
  description: '免费在线密码生成器，支持自定义长度、字符类型，生成安全随机的密码，提供密码强度分析。',
  keywords: ['密码生成器', '随机密码', '安全密码', '密码强度', '在线生成器']
})


</script>