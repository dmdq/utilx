<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">密码强度检测器</h1>
      <p class="text-muted-foreground mb-6">检测密码强度，分析安全性，提供改进建议</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：密码输入 -->
      <div class="space-y-6">
        <!-- 密码输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">密码输入</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入密码进行检测</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="请输入密码..."
                  @input="analyzePassword"
                />
                <button
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye v-if="!showPassword" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- 快速测试按钮 -->
            <div>
              <label class="block text-sm font-medium mb-2">快速测试密码</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="testPassword('password')"
                  class="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm"
                >
                  弱密码测试
                </button>
                <button
                  @click="testPassword('MyPassword123!')"
                  class="px-3 py-2 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 text-sm"
                >
                  中等密码测试
                </button>
                <button
                  @click="testPassword('Tr0ub4dour&3')"
                  class="px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                >
                  强密码测试
                </button>
                <button
                  @click="testPassword('correct-horse-battery-staple')"
                  class="px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm"
                >
                  短语密码测试
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 检测选项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">检测选项</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="checkOptions.checkCommonPasswords"
                type="checkbox"
                class="mr-2"
                @change="analyzePassword"
              />
              <span class="text-sm">检查常见密码</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.checkPatterns"
                type="checkbox"
                class="mr-2"
                @change="analyzePassword"
              />
              <span class="text-sm">检查常见模式</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.checkPersonalInfo"
                type="checkbox"
                class="mr-2"
                @change="analyzePassword"
              />
              <span class="text-sm">检查个人信息</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.checkKeyboardPatterns"
                type="checkbox"
                class="mr-2"
                @change="analyzePassword"
              />
              <span class="text-sm">检查键盘模式</span>
            </label>
          </div>
        </div>

        <!-- 批量检测 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">批量检测</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入多个密码（每行一个）</label>
              <textarea
                v-model="batchPasswords"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows="6"
                placeholder="密码1&#10;密码2&#10;密码3"
              ></textarea>
            </div>
            <button
              @click="analyzeBatchPasswords"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              批量检测
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：检测结果 -->
      <div class="space-y-6">
        <!-- 强度概览 -->
        <div v-if="analysis.score !== null" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">强度概览</h3>
          <div class="space-y-4">
            <!-- 强度等级 -->
            <div class="text-center">
              <div class="text-5xl font-bold mb-2" :class="getStrengthColorClass(analysis.score)">
                {{ analysis.strength }}
              </div>
              <div class="text-lg text-muted-foreground">安全等级</div>
            </div>

            <!-- 强度条 -->
            <div class="w-full bg-muted rounded-full h-4">
              <div
                class="h-4 rounded-full transition-all duration-300"
                :class="getStrengthBarClass(analysis.score)"
                :style="{ width: `${analysis.score}%` }"
              ></div>
            </div>

            <!-- 关键指标 -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="text-center p-3 bg-secondary rounded-lg">
                <div class="text-lg font-semibold">{{ analysis.passwordLength }}</div>
                <div class="text-xs text-muted-foreground">密码长度</div>
              </div>
              <div class="text-center p-3 bg-secondary rounded-lg">
                <div class="text-lg font-semibold">{{ analysis.entropy }}</div>
                <div class="text-xs text-muted-foreground">熵值 (bits)</div>
              </div>
              <div class="text-center p-3 bg-secondary rounded-lg">
                <div class="text-lg font-semibold">{{ analysis.crackTime }}</div>
                <div class="text-xs text-muted-foreground">破解时间</div>
              </div>
              <div class="text-center p-3 bg-secondary rounded-lg">
                <div class="text-lg font-semibold">{{ analysis.characterTypes }}</div>
                <div class="text-xs text-muted-foreground">字符类型</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细分析 -->
        <div v-if="analysis.details" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">详细分析</h3>
          <div class="space-y-3">
            <!-- 字符组成 -->
            <div>
              <div class="text-sm font-medium mb-2">字符组成分析</div>
              <div class="space-y-2">
                <div v-for="item in analysis.details.characterComposition" :key="item.type"
                     class="flex justify-between text-sm">
                  <span>{{ item.name }}</span>
                  <span :class="item.found ? 'text-green-600' : 'text-red-600'">
                    {{ item.found ? '✓' : '✗' }} {{ item.count }} 个
                  </span>
                </div>
              </div>
            </div>

            <!-- 安全性问题 -->
            <div v-if="analysis.details.issues.length > 0">
              <div class="text-sm font-medium mb-2">安全性问题</div>
              <div class="space-y-2">
                <div v-for="issue in analysis.details.issues" :key="issue.type"
                     class="p-2 rounded" :class="getIssueSeverityClass(issue.severity)">
                  <div class="flex items-center gap-2">
                    <AlertTriangle class="w-4 h-4" />
                    <span class="text-sm font-medium">{{ issue.title }}</span>
                  </div>
                  <div class="text-xs text-muted-foreground mt-1">{{ issue.description }}</div>
                </div>
              </div>
            </div>

            <!-- 评分详情 -->
            <div>
              <div class="text-sm font-medium mb-2">评分详情</div>
              <div class="space-y-2">
                <div v-for="item in analysis.details.scoring" :key="item.name"
                     class="flex justify-between text-sm">
                  <span>{{ item.name }}</span>
                  <span class="font-medium">+{{ item.points }} 分</span>
                </div>
                <div class="pt-2 mt-2 border-t">
                  <div class="flex justify-between text-sm font-medium">
                    <span>总分</span>
                    <span>{{ analysis.score }}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 改进建议 -->
        <div v-if="analysis.suggestions && analysis.suggestions.length > 0" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">改进建议</h3>
          <div class="space-y-3">
            <div v-for="suggestion in analysis.suggestions" :key="suggestion.priority"
                 class="flex items-start gap-2">
              <CheckCircle class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div class="text-sm font-medium">{{ suggestion.title }}</div>
                <div class="text-xs text-muted-foreground">{{ suggestion.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量检测结果 -->
        <div v-if="batchResults.length > 0" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">批量检测结果</h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            <div v-for="(result, index) in batchResults" :key="index"
                 class="p-3 rounded-lg border">
              <div class="flex justify-between items-center mb-2">
                <span class="font-mono text-sm">{{ maskPassword(result.password) }}</span>
                <span class="text-sm px-2 py-1 rounded"
                      :class="getStrengthBadgeClass(result.score)">
                  {{ result.strength }}
                </span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div
                  class="h-2 rounded-full"
                  :class="getStrengthBarClass(result.score)"
                  :style="{ width: `${result.score}%` }"
                ></div>
              </div>
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
import { Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-vue-next'

const { setPageTitle } = useSEO()
setPageTitle('密码强度检测器')

// 状态管理
const password = ref('')
const showPassword = ref(false)
const batchPasswords = ref('')
const batchResults = ref([])

// 检测选项
const checkOptions = ref({
  checkCommonPasswords: true,
  checkPatterns: true,
  checkPersonalInfo: true,
  checkKeyboardPatterns: true
})

// 分析结果
const analysis = ref({
  score: null,
  strength: '',
  passwordLength: 0,
  entropy: 0,
  crackTime: '',
  characterTypes: 0,
  details: null,
  suggestions: []
})

// 常见弱密码列表
const commonPasswords = [
  'password', '123456', '123456789', '12345678', '12345', '1234567',
  '1234567890', '1234', 'qwerty', 'abc123', '111111', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'qwertyuiop',
  'starwars', 'football', 'whatever', 'access', 'master', 'superman'
]

// 键盘模式
const keyboardPatterns = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'qwertyuiop[]', 'asdfghjkl;\'',
  'zxcvbnm,./', '1234567890', 'qazwsx', 'qweasd', '1qaz2wsx',
  'qwerty', 'asdf', 'zxcv', 'qweasd', '123123', 'abcabc'
]

// 密码分析
const analyzePassword = () => {
  if (!password.value) {
    resetAnalysis()
    return
  }

  const pwd = password.value
  let score = 0
  const details = {
    characterComposition: [],
    issues: [],
    scoring: []
  }
  const suggestions = []

  // 长度分析
  const length = pwd.length
  analysis.value.passwordLength = length

  if (length >= 8) {
    score += 20
    details.scoring.push({ name: '长度≥8位', points: 20 })
  }
  if (length >= 12) {
    score += 20
    details.scoring.push({ name: '长度≥12位', points: 20 })
  }
  if (length >= 16) {
    score += 20
    details.scoring.push({ name: '长度≥16位', points: 20 })
  }

  // 字符类型分析
  const charTypes = {
    uppercase: { name: '大写字母', pattern: /[A-Z]/, count: 0 },
    lowercase: { name: '小写字母', pattern: /[a-z]/, count: 0 },
    numbers: { name: '数字', pattern: /[0-9]/, count: 0 },
    symbols: { name: '特殊符号', pattern: /[^A-Za-z0-9]/, count: 0 }
  }

  let characterTypesFound = 0
  for (const [key, type] of Object.entries(charTypes)) {
    const matches = pwd.match(type.pattern)
    type.count = matches ? matches.length : 0
    type.found = type.count > 0

    if (type.found) {
      characterTypesFound++
      score += 10
      details.scoring.push({ name: type.name, points: 10 })
    }

    details.characterComposition.push({
      type: key,
      name: type.name,
      count: type.count,
      found: type.found
    })
  }

  analysis.value.characterTypes = characterTypesFound

  // 检查常见密码
  if (checkOptions.value.checkCommonPasswords && commonPasswords.includes(pwd.toLowerCase())) {
    details.issues.push({
      type: 'common',
      severity: 'high',
      title: '常见弱密码',
      description: '此密码在常见密码列表中，极易被破解'
    })
    score = Math.max(0, score - 50)
  }

  // 检查键盘模式
  if (checkOptions.value.checkKeyboardPatterns) {
    const lowerPwd = pwd.toLowerCase()
    for (const pattern of keyboardPatterns) {
      if (lowerPwd.includes(pattern) || pattern.includes(lowerPwd)) {
        details.issues.push({
          type: 'keyboard',
          severity: 'medium',
          title: '键盘模式',
          description: '密码包含键盘上的连续字符模式'
        })
        score = Math.max(0, score - 30)
        break
      }
    }
  }

  // 检查重复字符
  const hasRepeatingChars = /(.)\1{2,}/.test(pwd)
  if (hasRepeatingChars) {
    details.issues.push({
      type: 'repeating',
      severity: 'medium',
      title: '重复字符',
      description: '密码包含连续重复的字符'
    })
    score = Math.max(0, score - 20)
  }

  // 检查序列字符
  const hasSequentialChars = /(?:012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(pwd)
  if (hasSequentialChars) {
    details.issues.push({
      type: 'sequential',
      severity: 'medium',
      title: '序列字符',
      description: '密码包含连续的字符序列'
    })
    score = Math.max(0, score - 25)
  }

  // 计算熵值
  let charsetSize = 0
  if (charTypes.uppercase.found) charsetSize += 26
  if (charTypes.lowercase.found) charsetSize += 26
  if (charTypes.numbers.found) charsetSize += 10
  if (charTypes.symbols.found) charsetSize += 32

  const entropy = Math.round(length * Math.log2(charsetSize))
  analysis.value.entropy = entropy

  // 计算破解时间
  analysis.value.crackTime = calculateCrackTime(entropy)

  // 生成建议
  if (length < 12) {
    suggestions.push({
      priority: 1,
      title: '增加密码长度',
      description: '建议使用至少12个字符的密码，长度越大越安全'
    })
  }

  if (characterTypesFound < 3) {
    suggestions.push({
      priority: 2,
      title: '使用多种字符类型',
      description: '混合使用大小写字母、数字和特殊符号'
    })
  }

  if (details.issues.some(issue => issue.type === 'common')) {
    suggestions.push({
      priority: 3,
      title: '避免常见密码',
      description: '不要使用常见字典中的单词或常见组合'
    })
  }

  if (hasRepeatingChars) {
    suggestions.push({
      priority: 4,
      title: '避免重复字符',
      description: '避免使用连续重复的字符'
    })
  }

  if (charTypes.symbols.count === 0) {
    suggestions.push({
      priority: 5,
      title: '添加特殊符号',
      description: '包含 !@#$%^&* 等特殊符号可以显著提高密码强度'
    })
  }

  // 设置最终结果
  analysis.value.score = Math.min(100, Math.max(0, score))
  analysis.value.strength = getStrengthLevel(analysis.value.score)
  analysis.value.details = details
  analysis.value.suggestions = suggestions.sort((a, b) => a.priority - b.priority)
}

// 获取强度等级
const getStrengthLevel = (score) => {
  if (score >= 80) return '非常强'
  if (score >= 60) return '强'
  if (score >= 40) return '中等'
  if (score >= 20) return '弱'
  return '非常弱'
}

// 获取强度颜色类
const getStrengthColorClass = (score) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

const getStrengthBarClass = (score) => {
  if (score >= 80) return 'bg-green-600'
  if (score >= 60) return 'bg-blue-600'
  if (score >= 40) return 'bg-yellow-600'
  return 'bg-red-600'
}

const getStrengthBadgeClass = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-blue-100 text-blue-800'
  if (score >= 40) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

// 获取问题严重性样式
const getIssueSeverityClass = (severity) => {
  if (severity === 'high') return 'bg-red-50 text-red-800 border border-red-200'
  if (severity === 'medium') return 'bg-yellow-50 text-yellow-800 border border-yellow-200'
  return 'bg-blue-50 text-blue-800 border border-blue-200'
}

// 计算破解时间
const calculateCrackTime = (entropy) => {
  const guessesPerSecond = 100000000000 // 每秒1000亿次
  const seconds = Math.pow(2, entropy) / guessesPerSecond

  if (seconds < 1) return '瞬间'
  if (seconds < 60) return `${Math.round(seconds)}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}小时`
  if (seconds < 2592000) return `${Math.round(seconds / 86400)}天`
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)}个月`
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)}年`
  return '数千年'
}

// 测试密码
const testPassword = (testPwd) => {
  password.value = testPwd
  analyzePassword()
}

// 批量分析
const analyzeBatchPasswords = () => {
  if (!batchPasswords.value.trim()) return

  const passwords = batchPasswords.value.split('\n').filter(p => p.trim())
  const results = []

  for (const pwd of passwords) {
    // 简化版分析，用于批量处理
    const result = analyzePasswordSimple(pwd.trim())
    results.push(result)
  }

  batchResults.value = results
}

// 简化版密码分析
const analyzePasswordSimple = (pwd) => {
  let score = 0

  // 长度评分
  if (pwd.length >= 8) score += 20
  if (pwd.length >= 12) score += 20
  if (pwd.length >= 16) score += 20

  // 字符类型评分
  if (/[a-z]/.test(pwd)) score += 10
  if (/[A-Z]/.test(pwd)) score += 10
  if (/[0-9]/.test(pwd)) score += 10
  if (/[^A-Za-z0-9]/.test(pwd)) score += 10

  // 常见密码扣分
  if (commonPasswords.includes(pwd.toLowerCase())) score = Math.max(0, score - 50)

  // 重复字符扣分
  if (/(.)\1{2,}/.test(pwd)) score = Math.max(0, score - 20)

  score = Math.min(100, Math.max(0, score))

  return {
    password: pwd,
    score,
    strength: getStrengthLevel(score)
  }
}

// 隐藏密码显示
const maskPassword = (password) => {
  return password.length > 8 ?
    password.substring(0, 4) + '*'.repeat(password.length - 8) + password.substring(password.length - 4) :
    '*'.repeat(password.length)
}

// 重置分析结果
const resetAnalysis = () => {
  analysis.value = {
    score: null,
    strength: '',
    passwordLength: 0,
    entropy: 0,
    crackTime: '',
    characterTypes: 0,
    details: null,
    suggestions: []
  }
}
</script>

<style scoped>
input:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>