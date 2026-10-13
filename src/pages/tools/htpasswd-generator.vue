<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Lock class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">htpasswd生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">生成 Nginx / Apache Basic Auth 的 htpasswd 条目与 auth_basic 配置片段</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入用户名和密码，按 htpasswd 官方 {SHA} 方案（RFC 2307 风格，SHA-1 加密后 Base64）生成认证条目，支持多条账号批量生成、逐条复制与合并复制，并附 Nginx auth_basic 配置片段与 Apache 说明。密码仅在浏览器本地用 Web Crypto 计算，不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <KeyRound class="w-5 h-5 mr-2 text-primary" /> 添加账号
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">用户名</label>
            <input
              v-model="username"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">密码</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-10 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="输入密码"
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              >
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <p v-if="inputError" class="text-xs text-destructive">{{ inputError }}</p>
          <p v-if="!webCryptoSupported" class="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            当前环境不支持 Web Crypto（需 HTTPS 或 localhost）。可改用站内 BCrypt 工具生成 $2y$ 串后按「用户名:$2y$...」格式粘贴进 htpasswd 文件。
          </p>

          <button
            @click="addEntry"
            class="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus class="w-4 h-4" /> 生成并添加条目
          </button>

          <p class="text-xs text-muted-foreground leading-relaxed">
            {SHA} 方案使用 SHA-1 摘要。这是 htpasswd 协议本身规定的算法（Apache htpasswd -s 同款），并非本站引入的安全缺陷；如需更高强度，推荐用
            <NuxtLink to="/tools/bcrypt-generate" class="text-primary hover:underline">BCrypt 生成器</NuxtLink>
            生成 $2y$ 串，Nginx 与 Apache 的 htpasswd 均兼容 bcrypt。
          </p>
        </div>

        <!-- Nginx 配置片段 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Server class="w-4 h-4 mr-2 text-primary" /> Nginx 配置片段
          </h3>
          <pre class="bg-muted/50 border border-border rounded-lg p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre">auth_basic "Restricted";
auth_basic_user_file /etc/nginx/.htpasswd;</pre>
          <button
            @click="copyText(nginxSnippet)"
            class="mt-3 w-full bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" /> 复制配置片段
          </button>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            放在需要保护的 server / location 块内，重载 Nginx（nginx -s reload）即可生效；.htpasswd 文件需 Nginx 进程可读，建议权限 600。
          </p>
        </div>
      </div>

      <!-- 右侧：条目输出 -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border flex-wrap gap-2">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileKey class="w-5 h-5 mr-2 text-primary" /> htpasswd 条目（{{ entries.length }}）
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="downloadHtpasswd"
                :disabled="!entries.length"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载 .htpasswd
              </button>
              <button
                @click="copyText(entriesOutput)"
                :disabled="!entries.length"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制全部
              </button>
            </div>
          </div>

          <div v-if="entries.length" class="divide-y divide-border">
            <div v-for="entry in entries" :key="entry.id" class="px-6 py-3.5 flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium font-mono text-foreground">{{ entry.username }}</p>
                <p class="text-xs font-mono text-muted-foreground truncate">{{ entry.line }}</p>
              </div>
              <button
                @click="copyText(entry.line)"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-2.5 py-1.5 rounded text-xs transition-all flex items-center gap-1 flex-shrink-0"
              >
                <Copy class="w-3 h-3" /> 复制
              </button>
              <button
                @click="removeEntry(entry.id)"
                class="bg-muted hover:bg-muted/80 text-muted-foreground px-2.5 py-1.5 rounded text-xs transition-all flex items-center gap-1 flex-shrink-0"
                aria-label="删除该条目"
              >
                <Trash2 class="w-3 h-3" /> 删除
              </button>
            </div>
          </div>
          <div v-else class="py-16 text-center">
            <FileKey class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">左侧输入用户名与密码，生成 htpasswd 条目</p>
          </div>
        </div>

        <!-- Apache 说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Server class="w-4 h-4 mr-2 text-primary" /> Apache 使用说明
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">生成文件</span>：把上方条目保存为 .htpasswd（如 /etc/apache2/.htpasswd），每行一条「用户名:{SHA}摘要」</li>
            <li>• <span class="text-foreground">目录保护</span>：在 Directory 或 .htaccess 中配置 AuthType Basic / AuthName "Restricted" / AuthUserFile /etc/apache2/.htpasswd / Require valid-user</li>
            <li>• <span class="text-foreground">等价命令</span>：本页条目等价于 htpasswd -sb .htpasswd 用户名 密码（-s 即 {SHA} 方案）</li>
            <li>• <span class="text-foreground">安全建议</span>：Basic Auth 明文传输凭据，务必配合 HTTPS 使用；管理后台等高价值入口建议改用 bcrypt（$2y$）条目</li>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于htpasswd生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            htpasswd 是 Nginx 与 Apache 共用的 Basic Auth 用户口令文件格式：每行一条「用户名:加密后的密码」。给测试环境、内部文档站、管理后台加一道访问口令，是运维最常用的轻量防护手段。本工具按 {SHA} 方案在浏览器本地完成加密，密码不经过网络。
          </p>
          <h3 class="text-lg font-semibold text-foreground">{SHA} 条目的格式与算法</h3>
          <p>
            {SHA} 条目形如 admin:{SHA}W6ph5Mm5Pz8GgiULbPgzG37mj9g，算法是 SHA-1(密码) 后做标准 Base64 编码。协议要求 SHA-1 属于格式规范本身（等价于 htpasswd -s 命令），而非本站引入的弱点；因此更适合挡住泛流量扫描，重要入口建议改用 bcrypt：用站内 BCrypt 工具生成 $2y$ 串后粘贴进 htpasswd 文件，Nginx 与 Apache 均原生兼容。
          </p>
          <h3 class="text-lg font-semibold text-foreground">Nginx 与 Apache 怎么启用</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>Nginx：server 或 location 中加 auth_basic "Restricted"; 与 auth_basic_user_file /etc/nginx/.htpasswd;，nginx -t 校验后 reload</li>
            <li>Apache：httpd.conf 的 Directory 段或 .htaccess 中配置 AuthType Basic、AuthUserFile 与 Require valid-user</li>
            <li>多条账号：本页可连续添加多个用户，复制全部或直接下载 .htpasswd 上传服务器</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">密码会被上传或记录吗？</span>不会。SHA-1 摘要由浏览器 Web Crypto 在本地计算，页面无任何网络请求携带密码。</li>
            <li><span class="text-foreground font-medium">用户名有什么限制？</span>htpasswd 以第一个冒号分隔用户名与密码，因此用户名不能包含冒号；建议只用字母、数字、点、下划线、连字符。</li>
            <li><span class="text-foreground font-medium">Nginx 报 crypt_r() failed 是什么情况？</span>说明条目的加密方案 Nginx 不支持。Nginx 支持 {SHA}、{SSHA}、bcrypt($2y$) 与系统 crypt，但不支持 Apache 的 MD5($apr1$) 明细差异，遇到时换用本页 {SHA} 或 bcrypt 条目即可。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'htpasswd-generator'" :category="'security'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Lock, KeyRound, Eye, EyeOff, Plus, Trash2, Copy, Download,
  Server, FileKey, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'htpasswd生成器 - Nginx/Apache Basic Auth 条目与auth_basic配置',
  description: '在线 htpasswd 生成器，按官方 {SHA} 方案（SHA-1+Base64）生成 Nginx/Apache Basic Auth 认证条目，支持多条账号批量生成、下载 .htpasswd、复制 auth_basic 配置片段，密码浏览器本地计算不上传',
  keywords: 'htpasswd生成, basic auth, nginx认证, apache htpasswd, auth_basic, 网页密码保护, sha1密码',
  author: 'Util工具箱',
  ogTitle: 'htpasswd生成器 - 有条工具',
  ogDescription: '生成 Nginx/Apache Basic Auth 的 htpasswd 条目与 auth_basic 配置片段',
  ogUrl: 'https://www.util.cn/tools/htpasswd-generator',
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
          name: 'htpasswd生成器',
          url: 'https://www.util.cn/tools/htpasswd-generator',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['官方 {SHA} 方案条目', '多条账号批量生成', '下载 .htpasswd 文件', 'Nginx auth_basic 配置片段', 'Apache 使用说明']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '安全工具', item: 'https://www.util.cn/security/' },
            { '@type': 'ListItem', position: 3, name: 'htpasswd生成器', item: 'https://www.util.cn/tools/htpasswd-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '密码会被上传或记录吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。SHA-1 摘要由浏览器 Web Crypto 在本地计算，页面没有任何携带密码的网络请求。' }
            },
            {
              '@type': 'Question',
              name: '用户名有什么限制？',
              acceptedAnswer: { '@type': 'Answer', text: 'htpasswd 以第一个冒号分隔用户名与密码，用户名不能包含冒号，建议只用字母、数字、点、下划线、连字符。' }
            },
            {
              '@type': 'Question',
              name: '{SHA} 用 SHA-1 安全吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'SHA-1 是 htpasswd 协议规范本身要求的算法（等价 htpasswd -s），适合基础防护；高价值入口建议改用 bcrypt($2y$) 条目。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'htpasswd-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  webCryptoSupported.value = typeof crypto !== 'undefined' && !!crypto.subtle
})

// ---------- 纯函数区（node 可独立测试） ----------

// SHA-1 摘要后 Base64（htpasswd {SHA} 方案核心步骤；规范格式不含 = 填充）
const sha1Base64 = async (text) => {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-1', data)
  const bytes = new Uint8Array(digest)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/=+$/, '')
}

// 生成一条 htpasswd 条目：user:{SHA}base64
const buildHtpasswdLine = async (user, pass) => {
  const hash = await sha1Base64(pass)
  return user + ':{SHA}' + hash
}

// 用户名校验：htpasswd 以冒号分隔，用户名不能含冒号
const validateUsername = (name) => {
  const s = String(name || '')
  if (!s.trim()) return '请输入用户名'
  if (s.includes(':')) return '用户名不能包含冒号（:）'
  if (/\s/.test(s)) return '用户名不能包含空白字符'
  return ''
}

// ---------- 状态 ----------
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const entries = ref([])
const webCryptoSupported = ref(true)
const seoContentVisible = ref(true)

const inputError = computed(() => {
  const nameErr = validateUsername(username.value)
  if (nameErr) return nameErr
  if (!password.value) return '请输入密码'
  return ''
})

const entriesOutput = computed(() => entries.value.map(e => e.line).join('\n'))

// Nginx 配置片段
const nginxSnippet = 'auth_basic "Restricted";\nauth_basic_user_file /etc/nginx/.htpasswd;'

const addEntry = async () => {
  if (inputError.value) return
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    webCryptoSupported.value = false
    return
  }
  const line = await buildHtpasswdLine(username.value.trim(), password.value)
  entries.value.push({
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    username: username.value.trim(),
    line
  })
  username.value = ''
  password.value = ''
}

const removeEntry = (id) => {
  entries.value = entries.value.filter(e => e.id !== id)
}

const downloadHtpasswd = () => {
  if (!entriesOutput.value) return
  const blob = new Blob([entriesOutput.value + '\n'], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '.htpasswd'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
