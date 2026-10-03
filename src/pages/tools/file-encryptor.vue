<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Lock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">文件加密解密器</h1>
          <p class="text-sm text-muted-foreground mt-1">基于 AES-256-GCM 的本地文件加密工具，密码不出浏览器</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        对任意本地文件进行加密保护，采用 PBKDF2 密钥派生 + AES-256-GCM 认证加密。整个加解密过程在浏览器本地完成，文件与密码都不会上传到任何服务器。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：控制面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 模式切换 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="grid grid-cols-2 gap-2 mb-6">
            <button
              @click="switchMode('encrypt')"
              :class="mode === 'encrypt' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Lock class="w-4 h-4" /> 加密
            </button>
            <button
              @click="switchMode('decrypt')"
              :class="mode === 'decrypt' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Unlock class="w-4 h-4" /> 解密
            </button>
          </div>

          <!-- 文件选择 -->
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileUp class="w-5 h-5 mr-2 text-primary" /> 选择文件
          </h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload v-if="!file" class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <FileCheck v-else class="w-8 h-8 mx-auto mb-2 text-primary" />
            <p v-if="!file" class="text-sm text-muted-foreground">
              点击选择或拖拽文件到此处
            </p>
            <template v-else>
              <p class="text-sm font-medium text-foreground truncate">{{ file.name }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ formatSize(file.size) }}</p>
            </template>
          </div>
          <p v-if="mode === 'decrypt'" class="text-xs text-muted-foreground mt-2">
            需要使用本工具加密生成的 .enc 文件
          </p>

          <!-- 密码 -->
          <div class="mt-6">
            <label class="block text-sm font-medium text-foreground mb-2">
              {{ mode === 'encrypt' ? '设置密码' : '输入密码' }}
            </label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-10 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="mode === 'encrypt' ? '输入加密密码' : '输入解密密码'"
                @keyup.enter="process"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
            <!-- 密码强度（仅加密模式） -->
            <div v-if="mode === 'encrypt' && password" class="mt-2">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="strengthClass"
                    :style="{ width: strengthPercent + '%' }"
                  ></div>
                </div>
                <span class="text-xs text-muted-foreground whitespace-nowrap">{{ strengthLabel }}</span>
              </div>
            </div>
          </div>

          <!-- 确认密码（仅加密模式） -->
          <div v-if="mode === 'encrypt'" class="mt-4">
            <label class="block text-sm font-medium text-foreground mb-2">确认密码</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="再次输入密码"
              @keyup.enter="process"
            />
            <p v-if="confirmPassword && password !== confirmPassword" class="text-xs text-destructive mt-1.5">
              两次输入的密码不一致
            </p>
          </div>

          <!-- 主操作 -->
          <button
            @click="process"
            :disabled="!canProcess || processing"
            class="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="processing" class="w-4 h-4 animate-spin" />
            <Lock v-else-if="mode === 'encrypt'" class="w-4 h-4" />
            <Unlock v-else class="w-4 h-4" />
            {{ processing ? '处理中...' : (mode === 'encrypt' ? '加密并下载' : '解密并下载') }}
          </button>
        </div>

        <!-- 安全说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <ShieldCheck class="w-4 h-4 mr-2 text-primary" /> 安全说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 加密算法：AES-256-GCM 认证加密</li>
            <li>• 密钥派生：PBKDF2（SHA-256，150,000 次迭代）</li>
            <li>• 随机盐值与随机 IV，同一文件每次加密结果不同</li>
            <li>• 全程本地处理，文件与密码不会离开浏览器</li>
            <li>• 建议单文件不超过 500MB</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 错误 -->
        <div v-if="error" class="bg-card border border-destructive/50 rounded-lg p-8">
          <div class="flex items-start gap-3">
            <FileWarning class="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="text-lg font-semibold text-destructive mb-1">{{ errorTitle }}</h3>
              <p class="text-sm text-muted-foreground">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- 成功结果 -->
        <div v-else-if="result" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-primary/10 rounded-lg">
              <component :is="mode === 'encrypt' ? Lock : Unlock" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-foreground">
                {{ mode === 'encrypt' ? '加密完成' : '解密完成' }}
              </h2>
              <p class="text-xs text-muted-foreground">文件已就绪，点击下方按钮保存到本地</p>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">输出文件</p>
              <p class="text-sm font-medium text-foreground truncate" :title="result.filename">{{ result.filename }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">文件大小</p>
              <p class="text-sm font-medium text-foreground">{{ formatSize(result.size) }}</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">处理耗时</p>
              <p class="text-sm font-medium text-foreground">{{ result.duration }}ms</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4">
              <p class="text-xs text-muted-foreground mb-1">算法</p>
              <p class="text-sm font-medium text-foreground">AES-256-GCM</p>
            </div>
          </div>
          <button
            @click="downloadResult"
            class="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <Download class="w-4 h-4" /> 保存到本地
          </button>
        </div>

        <!-- 空状态 -->
        <div v-else class="bg-card border border-border rounded-lg p-12">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock class="w-8 h-8 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">
              {{ mode === 'encrypt' ? '保护你的敏感文件' : '解密 .enc 加密文件' }}
            </h3>
            <p class="text-sm text-muted-foreground max-w-md mx-auto">
              {{ mode === 'encrypt'
                ? '选择任意文件并设置密码，生成只有持有密码的人才能打开的加密文件，适合备份、传输敏感文档。'
                : '选择由本工具生成的 .enc 文件并输入加密时使用的密码，即可还原出原始文件。' }}
            </p>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> 使用提示
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 加密文件扩展名为 .enc，原始文件名会记录在加密数据中，解密时自动恢复</li>
            <li>• 密码一旦遗失将无法恢复文件内容，请务必牢记</li>
            <li>• 解密时密码错误会直接提示失败，不会产生损坏的文件</li>
            <li>• 建议使用 12 位以上、包含大小写字母/数字/符号的强密码</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于文件加密解密器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            文件加密解密器是一款运行在浏览器中的本地文件保护工具。它使用国际通用的 AES-256-GCM 认证加密算法对文件内容进行加密，并通过 PBKDF2 密钥派生函数将你设置的密码扩展为高强度密钥，有效抵御暴力破解。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>敏感文档备份：合同、证件扫描件、财务报表等加密后再存入网盘</li>
            <li>安全传输：通过邮件、即时通讯工具发送加密文件，密码通过其他渠道告知对方</li>
            <li>个人隐私保护：加密存有个人信息的本地文件，防止设备丢失导致泄露</li>
            <li>团队协作：共享加密资料包，仅授权成员持有密码</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">为什么选择本地加密</h3>
          <p>
            与在线加密服务不同，本工具的全部计算都在你的浏览器中完成：文件不会被上传到服务器，密码不会经过网络传输，加密完成后立即释放内存中的数据。这保证了即使工具服务不可用，你加密过的文件依然可以用相同算法的工具解密。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">忘记密码怎么办？</span>无法恢复。AES-256-GCM 的安全性决定了没有密码就不可能解出原文，请务必妥善保管密码。</li>
            <li><span class="text-foreground font-medium">加密后文件会变大多少？</span>仅增加约 40 字节的头部信息（魔数、版本、盐值与 IV），几乎可以忽略。</li>
            <li><span class="text-foreground font-medium">支持哪些文件类型？</span>任意类型。图片、视频、压缩包、办公文档都可以加密。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'file-encryptor'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Lock, Unlock, FileUp, FileCheck, FileWarning, Upload, Download,
  Eye, EyeOff, Loader2, ShieldCheck, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '文件加密解密器 - 本地AES-256文件加密工具',
  description: '在浏览器本地对任意文件进行AES-256-GCM加密解密，支持密码强度检测，文件不上传服务器，保护数据隐私',
  keywords: '文件加密, 文件解密, AES加密, 本地加密, 文件保护, 加密工具, 免费加密',
  author: 'Util工具箱',
  ogTitle: '文件加密解密器 - 有条工具',
  ogDescription: '基于AES-256-GCM的本地文件加密工具，文件与密码都不离开浏览器',
  ogUrl: 'https://www.util.cn/tools/file-encryptor',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '文件加密解密器',
          url: 'https://www.util.cn/tools/file-encryptor',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['AES-256-GCM加密', 'PBKDF2密钥派生', '任意文件类型', '纯本地处理']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '文件加密解密器', item: 'https://www.util.cn/tools/file-encryptor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '忘记密码后还能解密文件吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。AES-256-GCM加密没有密码无法还原，请务必妥善保管密码。' }
            },
            {
              '@type': 'Question',
              name: '加密后的文件会变大多少？',
              acceptedAnswer: { '@type': 'Answer', text: '仅增加约40字节的头部信息（魔数、版本、盐值与IV），几乎可以忽略。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'file-encryptor')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const mode = ref('encrypt')
const file = ref(null)
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isDragging = ref(false)
const processing = ref(false)
const error = ref('')
const errorTitle = ref('')
const result = ref(null)
const seoContentVisible = ref(true)
const fileInput = ref(null)

// 文件格式：MAGIC(8) + VERSION(2) + SALT(16) + IV(12) + CIPHERTEXT
const MAGIC = new TextEncoder().encode('UTILENC1')
const PBKDF2_ITERATIONS = 150000
const SALT_LENGTH = 16
const IV_LENGTH = 12

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 密码强度 ----------
const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  return score
})
const strengthLabel = computed(() => {
  return ['过短', '弱', '一般', '良好', '强', '极强'][passwordStrength.value] || ''
})
const strengthPercent = computed(() => passwordStrength.value * 20)
const strengthClass = computed(() => {
  const s = passwordStrength.value
  if (s <= 1) return 'bg-destructive'
  if (s <= 2) return 'bg-orange-500'
  if (s <= 3) return 'bg-yellow-500'
  return 'bg-green-500'
})

// ---------- 可用性 ----------
const canProcess = computed(() => {
  if (!file.value || !password.value) return false
  if (mode.value === 'encrypt' && password.value !== confirmPassword.value) return false
  return true
})

// ---------- 文件选择 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = (e) => {
  const selected = e.target.files?.[0]
  if (selected) setFile(selected)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) setFile(dropped)
}

const setFile = (f) => {
  resetResult()
  file.value = f
}

const switchMode = (m) => {
  mode.value = m
  resetResult()
}

const resetResult = () => {
  result.value = null
  error.value = ''
  errorTitle.value = ''
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

// ---------- 加解密核心 ----------
const deriveKey = async (pwd, salt) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pwd),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

const process = async () => {
  if (!canProcess.value || processing.value) return
  if (!crypto?.subtle) {
    errorTitle.value = '环境不支持'
    error.value = '当前浏览器不支持 WebCrypto API，请使用最新版本的 Chrome / Edge / Firefox / Safari，并确保通过 HTTPS 访问。'
    return
  }

  processing.value = true
  resetResult()
  const startTime = performance.now()

  try {
    const data = await file.value.arrayBuffer()
    let output
    let filename

    if (mode.value === 'encrypt') {
      const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
      const key = await deriveKey(password.value, salt)
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      )
      output = new Uint8Array(MAGIC.length + 2 + salt.length + iv.length + ciphertext.byteLength)
      output.set(MAGIC, 0)
      output.set(new Uint8Array([0x01, 0x00]), MAGIC.length)
      output.set(salt, MAGIC.length + 2)
      output.set(iv, MAGIC.length + 2 + salt.length)
      output.set(new Uint8Array(ciphertext), MAGIC.length + 2 + salt.length + iv.length)
      filename = file.value.name + '.enc'
    } else {
      const bytes = new Uint8Array(data)
      const headerLength = MAGIC.length + 2 + SALT_LENGTH + IV_LENGTH
      if (bytes.length < headerLength || !MAGIC.every((b, i) => bytes[i] === b)) {
        throw new Error('FORMAT')
      }
      const version = bytes[MAGIC.length]
      if (version !== 0x01) {
        throw new Error('VERSION')
      }
      const saltStart = MAGIC.length + 2
      const salt = bytes.slice(saltStart, saltStart + SALT_LENGTH)
      const iv = bytes.slice(saltStart + SALT_LENGTH, saltStart + SALT_LENGTH + IV_LENGTH)
      const ciphertext = bytes.slice(headerLength)
      const key = await deriveKey(password.value, salt)
      output = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext))
      filename = restoreFilename(file.value.name)
    }

    result.value = {
      filename,
      data: output,
      size: output.byteLength,
      duration: Math.round(performance.now() - startTime)
    }
  } catch (err) {
    if (err.message === 'FORMAT') {
      errorTitle.value = '无法识别的文件'
      error.value = '这不是由本工具加密生成的文件，请选择 .enc 加密文件后再试。'
    } else if (err.message === 'VERSION') {
      errorTitle.value = '版本不支持'
      error.value = '该加密文件使用了不支持的格式版本。'
    } else if (err.name === 'OperationError') {
      errorTitle.value = '解密失败'
      error.value = '密码错误或文件已损坏，请确认密码后重试。'
    } else {
      errorTitle.value = '处理失败'
      error.value = '处理过程中出现错误：' + (err.message || '未知错误')
    }
  } finally {
    processing.value = false
  }
}

const restoreFilename = (encName) => {
  if (encName.toLowerCase().endsWith('.enc')) {
    return encName.slice(0, -4)
  }
  return encName + '.decrypted'
}

const downloadResult = () => {
  if (!result.value) return
  const blob = new Blob([result.value.data])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.value.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
