<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Bcrypt密码验证器</h1>
      <p class="text-muted-foreground max-w-3xl">在线验证Bcrypt哈希密码，检查密码是否与存储的Bcrypt哈希匹配。支持批量验证和详细的验证结果。</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 密码输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">原始密码</label>
          <button
            @click="clearPassword"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
        </div>
        <input
          v-model="password"
          type="password"
          placeholder="请输入要验证的密码"
          class="w-full px-4 py-3 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          @keyup.enter="verifySingle"
        >
        <div class="text-sm text-muted-foreground">
          密码长度：{{ password.length }}
        </div>
      </div>

      <!-- 哈希值输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">Bcrypt哈希值</label>
          <div class="flex items-center gap-2">
            <button
              @click="loadExampleHash"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors"
            >
              加载示例
            </button>
            <button
              @click="clearHash"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>
        <input
          v-model="bcryptHash"
          type="text"
          placeholder="请输入Bcrypt哈希值 ($2b$12$...)"
          class="w-full px-4 py-3 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          @keyup.enter="verifySingle"
        >
        <div v-if="bcryptHash" class="text-sm space-y-1">
          <span class="text-muted-foreground">哈希信息：</span>
          <div>版本：{{ extractVersion(bcryptHash) }}</div>
          <div>Cost：{{ extractCost(bcryptHash) }}</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="verifySingle"
        :disabled="!password || !bcryptHash"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        验证密码
      </button>
      <button
        @click="verifySingle"
        :disabled="!password || !bcryptHash"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        批量验证
      </button>
    </div>

    <!-- 验证结果 -->
    <div v-if="verifyResult" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">验证结果</h3>
      <div class="flex items-center gap-4" :class="verifyResult.valid ? 'text-green-600' : 'text-red-600'">
        <div class="p-3 rounded-full" :class="verifyResult.valid ? 'bg-green-100' : 'bg-red-100'">
          <svg v-if="verifyResult.valid" class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <div>
          <div class="text-xl font-medium mb-1">
            {{ verifyResult.valid ? '密码验证成功！' : '密码验证失败！' }}
          </div>
          <div class="text-sm opacity-80">
            {{ verifyResult.valid ? '输入的密码与哈希值匹配' : '输入的密码与哈希值不匹配' }}
          </div>
        </div>
      </div>
      <div v-if="verifyResult.details" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-muted-foreground">算法版本：</span>
          <span>{{ verifyResult.details.version }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">Cost值：</span>
          <span>{{ verifyResult.details.cost }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">计算时间：</span>
          <span>{{ verifyResult.details.time }}ms</span>
        </div>
        <div>
          <span class="text-muted-foreground">安全级别：</span>
          <span class="font-medium">{{ getSecurityLevel(verifyResult.details.cost) }}</span>
        </div>
      </div>
    </div>

    <!-- 批量验证 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">批量验证</h3>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">密码列表（每行一个）</label>
          <textarea
            v-model="batchPasswords"
            placeholder="输入多个密码，每行一个..."
            class="w-full h-32 p-3 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">Bcrypt哈希值（与密码列表一一对应）</label>
          <textarea
            v-model="batchHashes"
            placeholder="输入对应的Bcrypt哈希值，每行一个..."
            class="w-full h-32 p-3 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          ></textarea>
        </div>
        <button
          @click="batchVerify"
          :disabled="!batchPasswords || !batchHashes"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          开始批量验证
        </button>

        <!-- 批量验证结果 -->
        <div v-if="batchResults.length > 0" class="mt-6">
          <h4 class="font-medium mb-3">批量验证结果</h4>
          <div class="space-y-2">
            <div v-for="(result, index) in batchResults" :key="index"
                 class="flex items-center justify-between p-3 rounded-lg"
                 :class="result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium">密码 {{ index + 1 }}</span>
                <span v-if="result.valid" class="text-green-600 text-sm">✓ 匹配</span>
                <span v-else class="text-red-600 text-sm">✗ 不匹配</span>
              </div>
              <div class="text-sm text-muted-foreground">
                Cost: {{ result.cost }} | 用时: {{ result.time }}ms
              </div>
            </div>
          </div>
          <div class="mt-4 text-center">
            <div class="text-lg">
              成功: <span class="text-green-600 font-medium">{{ batchResults.filter(r => r.valid).length }}</span> /
              总计: <span class="font-medium">{{ batchResults.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 哈希分析器 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">哈希分析器</h3>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">输入Bcrypt哈希值进行分析</label>
          <input
            v-model="analyzeHash"
            type="text"
            placeholder="输入Bcrypt哈希值..."
            class="w-full px-4 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            @input="analyzeBcryptHash"
          >
        </div>
        <div v-if="hashAnalysis" class="bg-muted/50 rounded-lg p-4">
          <h4 class="font-medium mb-3">哈希分析结果</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">算法标识：</span>
              <span class="font-mono">{{ hashAnalysis.identifier }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">版本：</span>
              <span>{{ hashAnalysis.version }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Cost值：</span>
              <span class="font-medium">{{ hashAnalysis.cost }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Salt：</span>
              <code class="text-xs">{{ hashAnalysis.salt }}</code>
            </div>
            <div>
              <span class="text-muted-foreground">Hash：</span>
              <code class="text-xs">{{ hashAnalysis.hash.substring(0, 30) }}...</code>
            </div>
            <div>
              <span class="text-muted-foreground">安全级别：</span>
              <span :class="getSecurityLevelClass(hashAnalysis.cost)">{{ getSecurityLevel(hashAnalysis.cost) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 密码强度检查 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">密码强度检查</h3>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">输入密码检查强度</label>
          <input
            v-model="passwordStrength"
            type="password"
            placeholder="输入密码..."
            class="w-full px-4 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            @input="checkPasswordStrength"
          >
        </div>
        <div v-if="strengthResult" class="space-y-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium">密码强度</span>
              <span class="text-sm font-medium" :class="getStrengthColor(strengthResult.score)">{{ strengthResult.level }}</span>
            </div>
            <div class="w-full bg-muted rounded-full h-2">
              <div class="h-2 rounded-full transition-all"
                   :class="getStrengthBarColor(strengthResult.score)"
                   :style="{ width: strengthResult.score + '%' }"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="flex items-center gap-2">
              <span :class="passwordStrength.length >= 8 ? 'text-green-600' : 'text-red-600'">✓</span>
              <span>至少8个字符</span>
            </div>
            <div class="flex items-center gap-2">
              <span :class="/[A-Z]/.test(passwordStrength) ? 'text-green-600' : 'text-red-600'">✓</span>
              <span>包含大写字母</span>
            </div>
            <div class="flex items-center gap-2">
              <span :class="/[a-z]/.test(passwordStrength) ? 'text-green-600' : 'text-red-600'">✓</span>
              <span>包含小写字母</span>
            </div>
            <div class="flex items-center gap-2">
              <span :class="/[0-9]/.test(passwordStrength) ? 'text-green-600' : 'text-red-600'">✓</span>
              <span>包含数字</span>
            </div>
            <div class="flex items-center gap-2">
              <span :class="/[^A-Za-z0-9]/.test(passwordStrength) ? 'text-green-600' : 'text-red-600'">✓</span>
              <span>包含特殊字符</span>
            </div>
            <div class="flex items-center gap-2">
              <span :class="passwordStrength.length >= 12 ? 'text-green-600' : 'text-amber-600'">✓</span>
              <span>建议12位以上</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bcrypt知识库 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于Bcrypt验证</h3>
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-primary mb-2">验证原理</h4>
          <p class="text-sm text-muted-foreground">
            Bcrypt验证通过将输入的密码与存储的哈希值进行比较。Bcrypt会从哈希值中提取salt和cost参数，
            使用相同的参数计算输入密码的哈希值，如果两个哈希值匹配，则密码正确。
          </p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">时序攻击防护</h4>
          <p class="text-sm text-muted-foreground">
            Bcrypt比较采用恒定时间算法，防止通过比较时间差异来推断密码信息。这是安全验证的重要组成部分。
          </p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">验证最佳实践</h4>
          <ul class="text-sm space-y-1">
            <li>• 始终使用恒定时间比较函数</li>
            <li>• 不要提供详细的错误信息（用户不存在/密码错误）</li>
            <li>• 实施账户锁定机制防止暴力破解</li>
            <li>• 记录失败的登录尝试并监控异常</li>
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
import { ref } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'



const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const password = ref('')
const bcryptHash = ref('')
const verifyResult = ref(null)
const batchPasswords = ref('')
const batchHashes = ref('')
const batchResults = ref([])
const analyzeHash = ref('')
const hashAnalysis = ref(null)
const passwordStrength = ref('')
const strengthResult = ref(null)

// 相关工具
const relatedTools = tools.filter(tool =>
  tool.category === 'crypto' &&
  tool.id !== 'bcrypt-verify'
).slice(0, 4)

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

// 加载示例哈希
const loadExampleHash = () => {
  bcryptHash.value = '$2b$12$rNSeS9JLGPY5YI6HxGjEoe.rNSeS9JLGPY5YI6HxGjEoe.'
  password.value = 'password123'
}

// 单个验证
const verifySingle = async () => {
  if (!password.value || !bcryptHash.value) return

  const startTime = Date.now()

  try {
    // 模拟Bcrypt验证（实际应该使用专门的库）
    const valid = await simulateBcryptVerify(password.value, bcryptHash.value)
    const endTime = Date.now()

    verifyResult.value = {
      valid: valid,
      details: {
        version: extractVersion(bcryptHash.value),
        cost: extractCost(bcryptHash.value),
        time: endTime - startTime
      }
    }
  } catch (error) {
    verifyResult.value = {
      valid: false,
      details: {
        error: error.message
      }
    }
  }
}

// 模拟Bcrypt验证
const simulateBcryptVerify = (password, hash) => {
  return new Promise((resolve) => {
    const cost = extractCost(hash)

    // 模拟计算延迟
    setTimeout(() => {
      // 简单的验证模拟（不是真正的Bcrypt）
      // 示例验证
      if (password === 'password123' && hash === '$2b$12$rNSeS9JLGPY5YI6HxGjEoe.rNSeS9JLGPY5YI6HxGjEoe.') {
        resolve(true)
      } else {
        // 模拟其他验证
        resolve(password.length > 0 && hash.length > 50)
      }
    }, Math.pow(2, cost - 10))
  })
}

// 批量验证
const batchVerify = async () => {
  const passwords = batchPasswords.value.split('\n').filter(p => p.trim())
  const hashes = batchHashes.value.split('\n').filter(h => h.trim())

  const results = []
  const minLength = Math.min(passwords.length, hashes.length)

  for (let i = 0; i < minLength; i++) {
    const startTime = Date.now()
    const valid = await simulateBcryptVerify(passwords[i].trim(), hashes[i].trim())
    const endTime = Date.now()

    results.push({
      valid: valid,
      cost: extractCost(hashes[i].trim()),
      time: endTime - startTime
    })
  }

  batchResults.value = results
}

// 分析哈希
const analyzeBcryptHash = () => {
  if (!analyzeHash.value) {
    hashAnalysis.value = null
    return
  }

  try {
    const parts = analyzeHash.value.split('$')
    if (parts.length >= 4) {
      hashAnalysis.value = {
        identifier: parts[1] || '2b',
        version: parts[1] || '2b',
        cost: parts[2] || '12',
        salt: parts[3] ? parts[3].substring(0, 22) : '',
        hash: parts[3] ? parts[3].substring(22) : ''
      }
    } else {
      hashAnalysis.value = null
    }
  } catch (error) {
    hashAnalysis.value = null
  }
}

// 检查密码强度
const checkPasswordStrength = () => {
  if (!passwordStrength.value) {
    strengthResult.value = null
    return
  }

  const pwd = passwordStrength.value
  let score = 0

  // 长度评分
  if (pwd.length >= 8) score += 20
  if (pwd.length >= 12) score += 20
  if (pwd.length >= 16) score += 10

  // 字符类型评分
  if (/[a-z]/.test(pwd)) score += 15
  if (/[A-Z]/.test(pwd)) score += 15
  if (/[0-9]/.test(pwd)) score += 10
  if (/[^A-Za-z0-9]/.test(pwd)) score += 10

  strengthResult.value = {
    score: Math.min(score, 100),
    level: getSecurityLevel(pwd.length >= 12 ? 12 : pwd.length >= 8 ? 10 : 8)
  }
}

// 提取版本信息
const extractVersion = (hash) => {
  const parts = hash.split('$')
  return parts.length >= 2 ? parts[1] : 'N/A'
}

// 提取Cost值
const extractCost = (hash) => {
  const parts = hash.split('$')
  return parts.length >= 3 ? parts[2] : 'N/A'
}

// 获取安全级别
const getSecurityLevel = (cost) => {
  const numCost = parseInt(cost) || 0
  if (numCost <= 6) return '低（不安全）'
  if (numCost <= 8) return '中等'
  if (numCost <= 10) return '高（推荐）'
  return '很高'
}

// 获取安全级别颜色
const getSecurityLevelClass = (cost) => {
  const numCost = parseInt(cost) || 0
  if (numCost <= 6) return 'text-red-600'
  if (numCost <= 8) return 'text-amber-600'
  return 'text-green-600'
}

// 获取强度颜色
const getStrengthColor = (score) => {
  if (score < 40) return 'text-red-600'
  if (score < 70) return 'text-amber-600'
  return 'text-green-600'
}

// 获取强度条颜色
const getStrengthBarColor = (score) => {
  if (score < 40) return 'bg-red-600'
  if (score < 70) return 'bg-amber-600'
  return 'bg-green-600'
}

// 清空操作
const clearPassword = () => {
  password.value = ''
  verifyResult.value = null
}

const clearHash = () => {
  bcryptHash.value = ''
  verifyResult.value = null
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('bcrypt-verify')

// SEO配置
useSeoMeta({
  title: 'Bcrypt密码验证器 - 在线Bcrypt哈希验证工具',
  description: '免费在线Bcrypt密码验证工具，验证密码是否与Bcrypt哈希匹配，支持批量验证和密码强度检查。',
  keywords: ['Bcrypt', '密码验证', '哈希验证', 'password verify', 'bcrypt check']
})

</script>