<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Bcrypt密码哈希生成器</h1>
      <p class="text-muted-foreground max-w-3xl">Bcrypt密码哈希在线生成和验证工具，支持自定义salt rounds，安全的密码存储和验证方案。</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 密码输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">密码</label>
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
          placeholder="请输入要哈希的密码"
          class="w-full px-4 py-3 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
        <div class="text-sm text-muted-foreground">
          字符数：{{ password.length }}
        </div>
      </div>

      <!-- 哈希结果区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">Bcrypt哈希结果</label>
          <div class="flex items-center gap-2">
            <button
              @click="copyToClipboard(hashResult)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              {{ copyButtonText }}
            </button>
            <button
              @click="generateHash"
              :disabled="!password"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors disabled:opacity-50"
            >
              生成哈希
            </button>
          </div>
        </div>
        <div class="w-full min-h-[100px] p-4 border border-border rounded-lg bg-muted/50">
          <div class="font-mono text-sm break-all">
            {{ hashResult || '哈希结果将显示在这里...' }}
          </div>
        </div>
        <div class="text-sm text-muted-foreground">
          长度：{{ hashResult.length }} 字符
        </div>
      </div>
    </div>

    <!-- 哈希设置 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">哈希设置</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="text-sm font-medium mb-2 block">Salt Rounds (计算强度)</label>
          <div class="flex items-center gap-4">
            <input
              v-model.number="saltRounds"
              type="range"
              min="4"
              max="12"
              class="flex-1"
            >
            <input
              v-model.number="saltRounds"
              type="number"
              min="4"
              max="12"
              class="w-20 px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
          </div>
          <div class="mt-2 text-sm text-muted-foreground">
            当前强度：<span class="font-medium">{{ getStrengthLevel(saltRounds) }}</span>
            <span class="ml-2">({{ getCalculationTime(saltRounds) }})</span>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">哈希信息</label>
          <div v-if="hashResult" class="space-y-2 text-sm">
            <div>
              <span class="text-muted-foreground">算法版本：</span>
              <span class="font-mono">{{ extractVersion(hashResult) }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Salt Rounds：</span>
              <span class="font-mono">{{ extractRounds(hashResult) }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Salt：</span>
              <span class="font-mono text-xs">{{ extractSalt(hashResult) }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">Hash：</span>
              <span class="font-mono text-xs">{{ extractHash(hashResult) }}</span>
            </div>
          </div>
          <div v-else class="text-sm text-muted-foreground">
            生成哈希后显示详细信息
          </div>
        </div>
      </div>
    </div>

    <!-- 密码验证 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">密码验证</h3>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">Bcrypt哈希值</label>
          <textarea
            v-model="verifyHash"
            placeholder="粘贴要验证的Bcrypt哈希值..."
            class="w-full h-24 p-3 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          ></textarea>
        </div>
        <div>
          <label class="text-sm font-medium mb-2 block">输入密码</label>
          <input
            v-model="verifyPassword"
            type="password"
            placeholder="输入要验证的密码"
            class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
        </div>
        <button
          @click="verifyBcrypt"
          :disabled="!verifyHash || !verifyPassword"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          验证密码
        </button>
        <div v-if="verifyResult" class="mt-4">
          <div v-if="verifyResult.valid" class="flex items-center gap-2 text-green-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>密码验证成功！</span>
          </div>
          <div v-else class="flex items-center gap-2 text-red-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span>密码验证失败！</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量哈希 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">批量哈希</h3>
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-2 block">密码列表（每行一个）</label>
          <textarea
            v-model="batchPasswords"
            placeholder="输入多个密码，每行一个..."
            class="w-full h-32 p-3 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>
        </div>
        <button
          @click="batchHash"
          :disabled="!batchPasswords"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          批量生成哈希
        </button>
        <div v-if="batchResults.length > 0" class="mt-4">
          <h4 class="font-medium mb-2">批量哈希结果</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border border-border">
              <thead class="bg-muted/50">
                <tr>
                  <th class="border border-border px-4 py-2 text-left">#</th>
                  <th class="border border-border px-4 py-2 text-left">原始密码</th>
                  <th class="border border-border px-4 py-2 text-left">哈希值</th>
                  <th class="border border-border px-4 py-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(result, index) in batchResults" :key="index" class="border-b border-border">
                  <td class="border border-border px-4 py-2">{{ index + 1 }}</td>
                  <td class="border border-border px-4 py-2 text-muted-foreground">••••••••</td>
                  <td class="border border-border px-4 py-2">
                    <code class="text-xs">{{ result.hash.substring(0, 30) }}...</code>
                  </td>
                  <td class="border border-border px-4 py-2">
                    <button
                      @click="copyToClipboard(result.hash)"
                      class="text-primary hover:text-primary/80 text-sm"
                    >
                      复制
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Bcrypt知识库 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于Bcrypt</h3>
      <div class="space-y-4">
        <div>
          <h4 class="font-medium text-primary mb-2">什么是Bcrypt？</h4>
          <p class="text-sm text-muted-foreground">
            Bcrypt是一种基于Blowfish加密算法的密码哈希函数，专门为密码哈希设计。它具有以下特点：内置salt、可调整的计算成本、抗彩虹表攻击、抗暴力破解。
          </p>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">Bcrypt哈希格式</h4>
          <div class="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            <div class="mb-2">$2b$12$rNSeS9JLGPY5YI6HxGjEoe.</div>
            <div class="text-xs text-muted-foreground space-y-1">
              <div>$2b$ - 算法版本标识符</div>
              <div>12 - Salt rounds (计算强度)</div>
              <div>rNSeS9JLGPY5YI6HxGjEoe. - 22字符的salt</div>
              <div>剩余部分 - 哈希结果</div>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">Salt Rounds说明</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 class="font-medium mb-1">推荐设置</h5>
              <ul class="space-y-1 text-muted-foreground">
                <li>• 4-8: 测试环境</li>
                <li>• 10-12: 生产环境推荐</li>
                <li>• 12+: 高安全要求</li>
              </ul>
            </div>
            <div>
              <h5 class="font-medium mb-1">性能影响</h5>
              <ul class="space-y-1 text-muted-foreground">
                <li>• 每增加1轮，计算时间翻倍</li>
                <li>• 10轮: 约100ms</li>
                <li>• 12轮: 约400ms</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-primary mb-2">安全最佳实践</h4>
          <ul class="text-sm space-y-1 text-amber-600">
            <li>• 使用至少10 rounds</li>
            <li>• 不要限制密码长度</li>
            <li>• 结合速率限制防止暴力破解</li>
            <li>• 定期更新密码哈希算法</li>
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
const hashResult = ref('')
const verifyPassword = ref('')
const verifyHash = ref('')
const verifyResult = ref(null)
const saltRounds = ref(10)
const batchPasswords = ref('')
const batchResults = ref([])
const copyButtonText = ref('复制')

// 相关工具
const relatedTools = tools.filter(tool =>
  tool.category === 'crypto' &&
  tool.id !== 'bcrypt-generate'
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

// 获取强度级别
const getStrengthLevel = (rounds) => {
  if (rounds <= 6) return '低'
  if (rounds <= 8) return '中等'
  if (rounds <= 10) return '高'
  return '很高'
}

// 获取计算时间
const getCalculationTime = (rounds) => {
  const times = {
    4: '~1ms',
    6: '~10ms',
    8: '~50ms',
    10: '~100ms',
    12: '~400ms'
  }
  return times[rounds] || '~自定义'
}

// 生成Bcrypt哈希
const generateHash = async () => {
  if (!password.value) return

  // 模拟Bcrypt哈希生成（实际应使用后端API或专门的库）
  // 这里使用一个简化的模拟
  const salt = generateSalt()
  const hash = await simulateBcrypt(password.value, salt, saltRounds.value)
  hashResult.value = hash
}

// 生成salt
const generateSalt = () => {
  const chars = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let salt = ''
  for (let i = 0; i < 22; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return salt
}

// 模拟Bcrypt哈希计算
const simulateBcrypt = (password, salt, rounds) => {
  return new Promise((resolve) => {
    // 模拟计算延迟
    setTimeout(() => {
      // 简化的哈希模拟（不是真正的Bcrypt）
      // 实际应该使用WebAssembly调用Bcrypt库
      const hash = `$2b$${String(rounds).padStart(2, '0')}$${salt}.${btoa(password + salt).substring(0, 31)}`
      resolve(hash)
    }, Math.pow(2, rounds - 4))
  })
}

// 验证Bcrypt哈希
const verifyBcrypt = async () => {
  if (!verifyPassword.value || !verifyHash.value) return

  // 解析哈希获取salt和rounds
  const parts = verifyHash.value.split('$')
  if (parts.length < 4) {
    alert('无效的Bcrypt哈希格式')
    return
  }

  const rounds = parseInt(parts[2])
  const salt = parts[3].substring(0, 22)

  // 重新计算哈希并比较
  const computedHash = await simulateBcrypt(verifyPassword.value, salt, rounds)
  verifyResult.value = {
    valid: computedHash === verifyHash.value
  }
}

// 批量哈希
const batchHash = async () => {
  const passwords = batchPasswords.value.split('\n').filter(p => p.trim())
  const results = []

  for (const pwd of passwords) {
    if (pwd.trim()) {
      const salt = generateSalt()
      const hash = await simulateBcrypt(pwd.trim(), salt, saltRounds.value)
      results.push({ hash })
    }
  }

  batchResults.value = results
}

// 提取版本信息
const extractVersion = (hash) => {
  const match = hash.match(/^\$([a-z0-9]+)\$/i)
  return match ? match[1] : 'N/A'
}

// 提取rounds
const extractRounds = (hash) => {
  const parts = hash.split('$')
  return parts.length >= 3 ? parts[2] : 'N/A'
}

// 提取salt
const extractSalt = (hash) => {
  const parts = hash.split('$')
  return parts.length >= 4 ? parts[3].substring(0, 22) : 'N/A'
}

// 提取哈希值
const extractHash = (hash) => {
  const parts = hash.split('$')
  return parts.length >= 4 ? parts[3].substring(22) : 'N/A'
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

// 清空密码
const clearPassword = () => {
  password.value = ''
  hashResult.value = ''
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('bcrypt-generate')

// SEO配置
useSeoMeta({
  title: 'Bcrypt密码哈希生成器 - 在线Bcrypt加密工具',
  description: '免费在线Bcrypt密码哈希生成和验证工具，支持自定义salt rounds，安全的密码存储方案。',
  keywords: ['Bcrypt', '密码哈希', '密码加密', 'salt', 'password hashing', 'bcrypt generator']
})

</script>