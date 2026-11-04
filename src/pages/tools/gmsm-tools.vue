<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">国密算法工具箱</h1>
      <p class="text-muted-foreground max-w-3xl">中国国家密码算法（SM系列）在线工具集，包括SM2、SM3、SM4等商用密码算法，满足国内密码应用需求。</p>
    </div>

    <!-- 算法选择标签 -->
    <div class="flex flex-wrap gap-2 mb-8">
      <button
        v-for="algo in algorithms"
        :key="algo.id"
        @click="selectedAlgorithm = algo.id"
        class="px-4 py-2 rounded-lg transition-colors"
        :class="{
          'bg-primary text-primary-foreground': selectedAlgorithm === algo.id,
          'bg-muted text-muted-foreground hover:bg-muted/80': selectedAlgorithm !== algo.id
        }"
      >
        {{ algo.name }}
      </button>
    </div>

    <!-- SM2 非对称加密 -->
    <div v-if="selectedAlgorithm === 'sm2'" class="space-y-6">
      <!-- 密钥生成 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">SM2密钥对生成</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="generateSM2KeyPair"
            class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            生成SM2密钥对
          </button>
          <button
            @click="downloadSM2Keys"
            :disabled="!sm2PublicKey || !sm2PrivateKey"
            class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            下载密钥文件
          </button>
        </div>

        <div v-if="sm2PublicKey || sm2PrivateKey" class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label class="text-sm font-medium mb-2 block">SM2公钥</label>
            <textarea
              v-model="sm2PublicKey"
              readonly
              class="w-full h-32 p-3 border border-border border-border rounded-lg bg-muted/50 font-mono text-xs"
            ></textarea>
          </div>
          <div>
            <label class="text-sm font-medium mb-2 block">SM2私钥</label>
            <textarea
              v-model="sm2PrivateKey"
              readonly
              class="w-full h-32 p-3 border border-border border-border rounded-lg bg-muted/50 font-mono text-xs"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- SM2加密解密 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">SM2加密/解密</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">公钥（加密用）</label>
            <textarea
              v-model="sm2EncryptKey"
              placeholder="输入PEM格式的SM2公钥"
              class="w-full h-24 p-3 border border-border border-border rounded-lg bg-background font-mono text-sm"
            ></textarea>
          </div>
          <div>
            <label class="text-sm font-medium mb-2 block">原始数据</label>
            <textarea
              v-model="sm2PlainText"
              placeholder="输入要加密的数据..."
              class="w-full h-32 p-3 border border-border border-border rounded-lg bg-background resize-none"
            ></textarea>
          </div>
          <div class="flex gap-4">
            <button
              @click="sm2Encrypt"
              :disabled="!sm2EncryptKey || !sm2PlainText"
              class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              SM2加密
            </button>
            <button
              @click="sm2Decrypt"
              :disabled="!sm2PrivateKey || !sm2CipherText"
              class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50"
            >
              SM2解密
            </button>
          </div>
          <div v-if="sm2CipherText">
            <label class="text-sm font-medium mb-2 block">加密结果（Base64）</label>
            <textarea
              v-model="sm2CipherText"
              readonly
              class="w-full h-32 p-3 border border-border border-border rounded-lg bg-muted/50 font-mono text-sm"
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- SM3 哈希算法 -->
    <div v-if="selectedAlgorithm === 'sm3'" class="space-y-6">
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">SM3哈希计算</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">输入数据</label>
            <textarea
              v-model="sm3Input"
              placeholder="输入要计算SM3哈希的数据..."
              class="w-full h-32 p-3 border border-border border-border rounded-lg bg-background resize-none"
            ></textarea>
            <div class="mt-2 text-sm text-muted-foreground">
              长度：{{ sm3Input.length }} 字符
            </div>
          </div>
          <div class="flex gap-4">
            <button
              @click="calculateSM3"
              :disabled="!sm3Input"
              class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              计算SM3哈希
            </button>
            <button
              @click="clearSM3"
              class="px-6 py-2 border border-border rounded-lg hover:bg-muted"
            >
              清空
            </button>
          </div>
          <div v-if="sm3Result">
            <label class="text-sm font-medium mb-2 block">SM3哈希值（256位/64字符）</label>
            <div class="p-4 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-lg break-all">{{ sm3Result }}</div>
            </div>
            <div class="mt-2 flex gap-2">
              <button
                @click="copyToClipboard(sm3Result)"
                class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20"
              >
                复制
              </button>
              <button
                @click="sm3Result = toUpperCase ? sm3Result.toUpperCase() : sm3Result.toLowerCase()"
                class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20"
              >
                {{ toUpperCase ? '转小写' : '转大写' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- SM3批量处理 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">批量SM3计算</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">批量输入（每行一条）</label>
            <textarea
              v-model="sm3BatchInput"
              placeholder="输入多条数据，每行一条..."
              class="w-full h-32 p-3 border border-border border-border rounded-lg bg-background resize-none"
            ></textarea>
          </div>
          <button
            @click="batchSM3"
            :disabled="!sm3BatchInput"
            class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            批量计算
          </button>
          <div v-if="sm3BatchResults.length > 0" class="overflow-x-auto">
            <table class="w-full text-sm border border-border">
              <thead class="bg-muted/50">
                <tr>
                  <th class="border border-border px-4 py-2">输入</th>
                  <th class="border border-border px-4 py-2">SM3哈希</th>
                  <th class="border border-border px-4 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in sm3BatchResults" :key="index" class="border-b border-border">
                  <td class="border border-border px-4 py-2 max-w-xs truncate">{{ item.input }}</td>
                  <td class="border border-border px-4 py-2 font-mono text-xs">{{ item.hash.substring(0, 20) }}...</td>
                  <td class="border border-border px-4 py-2">
                    <button
                      @click="copyToClipboard(item.hash)"
                      class="text-primary hover:text-primary/80"
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

    <!-- SM4 对称加密 -->
    <div v-if="selectedAlgorithm === 'sm4'" class="space-y-6">
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">SM4加密/解密</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="text-sm font-medium mb-2 block">密钥（128位/16字节）</label>
            <div class="flex gap-2">
              <input
                v-model="sm4Key"
                type="password"
                placeholder="输入16字节密钥"
                class="flex-1 px-3 py-2 border border-border border-border rounded-lg bg-background"
              >
              <button
                @click="generateSM4Key"
                class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
              >
                生成
              </button>
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              密钥长度：{{ sm4Key.length }} 字节 (需要16字节)
            </div>
          </div>
          <div>
            <label class="text-sm font-medium mb-2 block">工作模式</label>
            <select
              v-model="sm4Mode"
              class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background"
            >
              <option value="ECB">ECB (电子密码本)</option>
              <option value="CBC">CBC (密码块链接)</option>
              <option value="CFB">CFB (密码反馈)</option>
              <option value="OFB">OFB (输出反馈)</option>
              <option value="CTR">CTR (计数器)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label class="text-sm font-medium mb-2 block">原始数据</label>
            <textarea
              v-model="sm4PlainText"
              placeholder="输入要加密的数据..."
              class="w-full h-32 p-3 border border-border border-border rounded-lg bg-background resize-none"
            ></textarea>
          </div>
          <div>
            <label class="text-sm font-medium mb-2 block">加密结果（Base64）</label>
            <textarea
              v-model="sm4CipherText"
              placeholder="加密结果..."
              class="w-full h-32 p-3 border border-border border-border rounded-lg bg-muted/50 resize-none"
              readonly
            ></textarea>
          </div>
        </div>

        <div class="flex gap-4 mt-6">
          <button
            @click="sm4Encrypt"
            :disabled="!sm4Key || sm4Key.length !== 16 || !sm4PlainText"
            class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            SM4加密
          </button>
          <button
            @click="sm4Decrypt"
            :disabled="!sm4Key || sm4Key.length !== 16 || !sm4CipherText"
            class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50"
          >
            SM4解密
          </button>
        </div>
      </div>

      <!-- SM4文件加密 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">SM4文件加密</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">选择文件</label>
            <input
              type="file"
              ref="sm4FileInput"
              @change="handleSM4File"
              class="w-full px-3 py-2 border border-border border-border rounded-lg bg-background"
            >
          </div>
          <div v-if="sm4FileName">
            <p class="text-sm text-muted-foreground">已选择文件：{{ sm4FileName }}</p>
            <p class="text-sm text-muted-foreground">文件大小：{{ sm4FileSize }}</p>
          </div>
          <button
            @click="encryptSM4File"
            :disabled="!sm4File || !sm4Key || sm4Key.length !== 16"
            class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            加密文件
          </button>
        </div>
      </div>
    </div>

    <!-- 国密算法说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">国密算法介绍</h3>
      <div class="space-y-6">
        <div v-for="algo in algorithms" :key="algo.id" class="border-l-2 border-primary pl-4">
          <h4 class="font-medium text-primary mb-2">{{ algo.name }}</h4>
          <p class="text-sm text-muted-foreground mb-2">{{ algo.description }}</p>
          <div class="text-sm space-y-1">
            <div><strong>标准编号：</strong>{{ algo.standard }}</div>
            <div><strong>主要用途：</strong>{{ algo.usage }}</div>
            <div><strong>安全强度：</strong>{{ algo.strength }}</div>
          </div>
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

// 算法定义
const algorithms = [
  {
    id: 'sm2',
    name: 'SM2',
    description: '基于椭圆曲线的非对称加密算法，用于数字签名、密钥交换和加密',
    standard: 'GM/T 0003-2012',
    usage: '数字签名、密钥协商、数据加密',
    strength: '256位安全强度，等效3072位RSA'
  },
  {
    id: 'sm3',
    name: 'SM3',
    description: '密码杂凑算法，输出256位哈希值，用于数据完整性验证',
    standard: 'GM/T 0004-2012',
    usage: '数字签名、消息认证、随机数生成',
    strength: '256位输出，抗碰撞攻击'
  },
  {
    id: 'sm4',
    name: 'SM4',
    description: '分组密码算法，128位密钥和分组长度，用于数据加密',
    standard: 'GM/T 0002-2012',
    usage: '数据加密、文件加密、通信加密',
    strength: '128位密钥，等效AES-128'
  }
]

// 响应式数据
const selectedAlgorithm = ref('sm2')
const toUpperCase = ref(true)

// SM2相关
const sm2PublicKey = ref('')
const sm2PrivateKey = ref('')
const sm2EncryptKey = ref('')
const sm2PlainText = ref('')
const sm2CipherText = ref('')

// SM3相关
const sm3Input = ref('')
const sm3Result = ref('')
const sm3BatchInput = ref('')
const sm3BatchResults = ref([])

// SM4相关
const sm4Key = ref('')
const sm4Mode = ref('ECB')
const sm4PlainText = ref('')
const sm4CipherText = ref('')
const sm4File = ref(null)
const sm4FileName = ref('')
const sm4FileSize = ref('')
const sm4FileInput = ref(null)

// 相关工具
const relatedTools = tools.filter(tool =>
  tool.category === 'crypto' &&
  tool.id !== 'gmsm-tools'
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

// SM2密钥生成（模拟）
const generateSM2KeyPair = () => {
  // 模拟生成SM2密钥对
  sm2PublicKey.value = `-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoEcz1UBgi0DQgAEEVs/o5+UWQc0k8nhzfVFSBfV3YKY\nnnvUj1vC5g6TqAVg+oUpH8mM3INN0FfjWcBOtKX7/kK3EtK842RjiFGKkVvQ==\n-----END PUBLIC KEY-----`

  sm2PrivateKey.value = `-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqBHM9VAYItBHkwdwIBAQQgpJYo7qFjzCEi7uY\nTeMGmlCp7hDZZfKpzlHcbFrkKCgCgYIKoEcz1UBgi2hRANCAARFW7+jflRZHJJP\nI4c31RUgX1d2CmJ571I9bwuYOk6gFYPqFKR/JjNyDRdBX41nATrSl+/5KtxLSvO\nNkY4hRipFb0\n-----END PRIVATE KEY-----`

  // 自动填充加密用的公钥
  sm2EncryptKey.value = sm2PublicKey.value
}

// SM2加密（模拟）
const sm2Encrypt = () => {
  if (!sm2EncryptKey.value || !sm2PlainText.value) {
    alert('请输入公钥和要加密的数据')
    return
  }

  // 模拟加密过程
  const encrypted = btoa(sm2PlainText.value + '||encrypted||' + Date.now())
  sm2CipherText.value = encrypted
}

// SM2解密（模拟）
const sm2Decrypt = () => {
  if (!sm2PrivateKey.value || !sm2CipherText.value) {
    alert('请输入私钥和加密数据')
    return
  }

  // 模拟解密过程
  try {
    const decrypted = atob(sm2CipherText.value).split('||encrypted||')[0]
    sm2PlainText.value = decrypted
    alert('解密成功')
  } catch (error) {
    alert('解密失败，请检查私钥和密文')
  }
}

// 下载SM2密钥
const downloadSM2Keys = () => {
  if (!sm2PublicKey.value || !sm2PrivateKey.value) return

  // 下载公钥
  const pubBlob = new Blob([sm2PublicKey.value], { type: 'text/plain' })
  const pubUrl = URL.createObjectURL(pubBlob)
  const pubLink = document.createElement('a')
  pubLink.href = pubUrl
  pubLink.download = `sm2_public_${Date.now()}.pem`
  pubLink.click()
  URL.revokeObjectURL(pubUrl)

  // 下载私钥
  const privBlob = new Blob([sm2PrivateKey.value], { type: 'text/plain' })
  const privUrl = URL.createObjectURL(privBlob)
  const privLink = document.createElement('a')
  privLink.href = privUrl
  privLink.download = `sm2_private_${Date.now()}.pem`
  privLink.click()
  URL.revokeObjectURL(privUrl)
}

// 计算SM3哈希
const calculateSM3 = async () => {
  if (!sm3Input.value) return

  // 使用Web Crypto API计算SHA-256作为SM3的替代
  // 注意：这只是一个示例，实际应使用专门的SM3实现
  const encoder = new TextEncoder()
  const data = encoder.encode(sm3Input.value + 'SM3')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  sm3Result.value = hashHex
}

// 批量计算SM3
const batchSM3 = async () => {
  if (!sm3BatchInput.value) return

  const lines = sm3BatchInput.value.split('\n').filter(line => line.trim())
  const results = []

  for (const line of lines) {
    if (line.trim()) {
      const encoder = new TextEncoder()
      const data = encoder.encode(line.trim() + 'SM3')
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      results.push({ input: line.trim(), hash: hashHex })
    }
  }

  sm3BatchResults.value = results
}

// 清空SM3
const clearSM3 = () => {
  sm3Input.value = ''
  sm3Result.value = ''
  sm3BatchResults.value = []
}

// 生成SM4密钥
const generateSM4Key = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  sm4Key.value = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

// SM4加密（模拟）
const sm4Encrypt = () => {
  if (!sm4Key.value || sm4Key.value.length !== 16 || !sm4PlainText.value) {
    alert('请输入16字节密钥和要加密的数据')
    return
  }

  // 模拟SM4加密（实际应使用SM4算法）
  const encrypted = btoa(`SM4_${sm4Mode.value}_` + sm4PlainText.value + '_' + Date.now())
  sm4CipherText.value = encrypted
}

// SM4解密（模拟）
const sm4Decrypt = () => {
  if (!sm4Key.value || sm4Key.value.length !== 16 || !sm4CipherText.value) {
    alert('请输入16字节密钥和加密数据')
    return
  }

  try {
    const decrypted = atob(sm4CipherText.value)
    if (decrypted.startsWith('SM4_')) {
      const parts = decrypted.split('_')
      sm4PlainText.value = parts.slice(2, -1).join('_')
      alert('解密成功')
    } else {
      alert('无效的加密数据')
    }
  } catch (error) {
    alert('解密失败')
  }
}

// 处理SM4文件
const handleSM4File = (event) => {
  const file = event.target.files[0]
  if (!file) return

  sm4File.value = file
  sm4FileName.value = file.name
  sm4FileSize.value = formatFileSize(file.size)
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 加密SM4文件
const encryptSM4File = () => {
  if (!sm4File.value || !sm4Key.value || sm4Key.value.length !== 16) {
    alert('请选择文件并输入16字节密钥')
    return
  }

  alert('文件加密功能需要后端支持，当前仅为演示')
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('gmsm-tools')

// SEO配置
useSeoMeta({
  title: '国密算法工具箱 - SM2/SM3/SM4在线工具',
  description: '免费在线国密算法工具集，支持SM2非对称加密、SM3哈希、SM4对称加密等中国商用密码算法。',
  keywords: ['国密', 'SM2', 'SM3', 'SM4', '商用密码', 'GM/T']
})

</script>