<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Server class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">SSH 配置生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">填主机/别名/跳板机，一键生成 ~/.ssh/config，ProxyJump 免敲长命令</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        管理多台服务器时，每次 ssh 都要敲一长串 <code class="px-1 bg-muted rounded text-sm">ssh -p 2222 -i ~/.ssh/key user@1.2.3.4</code> 很难受。本工具按表单生成标准 <code class="px-1 bg-muted rounded text-sm">~/.ssh/config</code> 文本：主机条目可增删，支持 IdentityFile 私钥、ProxyJump 跳板链、转发/保活/压缩选项，自动校验跳板别名是否已定义并调整 Host 块顺序。纯本地生成，不上传任何主机信息。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：主机表单 -->
      <div class="space-y-4">
        <div
          v-for="(h, idx) in hosts"
          :key="idx"
          class="bg-card border border-border rounded-lg p-5 space-y-3"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-foreground flex items-center gap-2">
              <Server class="w-4 h-4 text-primary" /> 主机 {{ idx + 1 }}
            </h3>
            <button
              @click="removeHost(idx)"
              :disabled="hosts.length <= 1"
              :class="hosts.length <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:text-red-500'"
              class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" /> 删除
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">别名 Host</label>
              <input
                v-model="h.alias"
                type="text"
                spellcheck="false"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 prod-web"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">HostName / IP</label>
              <input
                v-model="h.hostName"
                type="text"
                spellcheck="false"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 203.0.113.10"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">User</label>
              <input
                v-model="h.user"
                type="text"
                spellcheck="false"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 deploy"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">Port</label>
              <input
                v-model="h.port"
                type="text"
                inputmode="numeric"
                spellcheck="false"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="22"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">IdentityFile（可选）</label>
              <input
                v-model="h.identityFile"
                type="text"
                spellcheck="false"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="~/.ssh/id_ed25519"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1.5">ProxyJump 跳板别名（可选）</label>
              <input
                v-model="h.proxyJump"
                type="text"
                spellcheck="false"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="引用上方某条目的别名"
              >
            </div>
          </div>

          <div class="flex flex-wrap gap-4 pt-1">
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="h.forwardAgent" type="checkbox" class="w-4 h-4 rounded border-border" >
              智能转发 ForwardAgent
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="h.keepAlive" type="checkbox" class="w-4 h-4 rounded border-border" >
              保活 ServerAliveInterval
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input v-model="h.compression" type="checkbox" class="w-4 h-4 rounded border-border" >
              压缩 Compression
            </label>
          </div>
        </div>

        <button
          @click="addHost"
          class="w-full py-2.5 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
        >
          <Plus class="w-4 h-4" /> 添加主机条目
        </button>
      </div>

      <!-- 右侧：输出 -->
      <div class="space-y-4">
        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-foreground flex items-center gap-2">
              <FileText class="w-4 h-4 text-primary" /> ~/.ssh/config
            </h3>
            <button
              @click="copyText(configResult.text, 'config')"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Check v-if="copiedKey === 'config'" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === 'config' ? '已复制' : '复制配置' }}
            </button>
          </div>

          <div
            v-if="configResult.warnings.length"
            class="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
          >
            <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <ul class="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <li v-for="(w, i) in configResult.warnings" :key="i">{{ w }}</li>
            </ul>
          </div>

          <pre class="overflow-auto p-4 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed max-h-[32rem] text-foreground">{{ configResult.text }}</pre>

          <div class="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <p class="flex items-center gap-1.5">
              <FolderOpen class="w-3.5 h-3.5 text-primary" />
              放置路径：macOS / Linux 为 <code class="px-1 bg-muted rounded">~/.ssh/config</code>；Windows（OpenSSH）为 <code class="px-1 bg-muted rounded">C:\Users\你的用户名\.ssh\config</code>
            </p>
            <p class="flex items-center gap-1.5">
              <ShieldCheck class="w-3.5 h-3.5 text-primary" />
              权限必须收紧：<code class="px-1 bg-muted rounded">chmod 600 ~/.ssh/config</code>（权限过开 ssh 会直接忽略该文件）
            </p>
            <p class="flex items-center gap-1.5">
              <Terminal class="w-3.5 h-3.5 text-primary" />
              验证：保存后直接执行 <code class="px-1 bg-muted rounded">ssh 别名</code> 即可，无需再敲 IP、端口和私钥参数
            </p>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 SSH 配置生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            OpenSSH 客户端会自动读取 <code class="px-1 bg-muted rounded">~/.ssh/config</code>，把每台服务器的主机名、端口、用户、私钥固化成 Host 块。之后连接只需 <code class="px-1 bg-muted rounded">ssh 别名</code>，scp、rsync、git、VS Code 远程开发等工具同样复用这套配置。
          </p>

          <h3 class="text-lg font-semibold text-foreground">Host 块的书写规则</h3>
          <p>
            每个 Host 块从 <code class="px-1 bg-muted rounded">Host 别名</code> 行开始，下面的选项行必须缩进；ssh 按「先匹配先赢、同键后者不覆盖」的顺序解析，所以通用配置（如 Host *）建议放在文件末尾。别名只是本地记号，不会发到服务器；真正的主机地址写在 HostName 里。本工具按输入顺序生成，并自动把被跳板引用的主机排到使用方之前。
          </p>

          <h3 class="text-lg font-semibold text-foreground">ProxyJump 跳板链怎么用</h3>
          <p>
            内网机器不能直连时，给目标主机写 <code class="px-1 bg-muted rounded">ProxyJump 跳板别名</code>，ssh 会先连跳板机再从跳板机转发到目标，相当于命令行里的 <code class="px-1 bg-muted rounded">ssh -J</code>。跳板机本身也要在 config 里定义（含它自己的 HostName/User/IdentityFile）。多级跳板可以用逗号串联：<code class="px-1 bg-muted rounded">ProxyJump 跳板A,跳板B</code>，按顺序逐跳。
          </p>

          <h3 class="text-lg font-semibold text-foreground">私钥与权限要点</h3>
          <p>
            IdentityFile 指向私钥文件（推荐 ed25519），私钥本身权限要 <code class="px-1 bg-muted rounded">chmod 600</code>；config 文件同样是 600，目录 .ssh 为 700。使用 ForwardAgent 可以把本地密钥代理到远端继续 git 操作，但在不受控制的跳板机上开启有安全风险，建议只在可信跳板上启用，或改用 <code class="px-1 bg-muted rounded">ssh-agent</code> + <code class="px-1 bg-muted rounded">AddKeysToAgent</code>。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">ProxyJump 的别名填什么？</span>填跳板机在 config 中的 Host 别名，或 user@host 形式；本工具勾选跳板后会自动校验别名是否存在，缺失时给出提示。</li>
            <li><span class="text-foreground font-medium">改了 config 不生效？</span>检查三点：文件权限是否 600、选项行是否缩进、Host 别名是否与输入完全一致；可用 <code class="px-1 bg-muted rounded">ssh -G 别名</code> 查看最终合并后的生效参数。</li>
            <li><span class="text-foreground font-medium">Windows 下路径怎么写？</span>OpenSSH for Windows 读取 C:\Users\用户名\.ssh\config，IdentityFile 可写 %USERPROFILE%\.ssh\id_ed25519 或 Git Bash 风格的 /c/Users/... 路径。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ssh-config-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Server, Plus, Trash2, FileText, Copy, Check, Terminal,
  FolderOpen, ShieldCheck, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'SSH 配置生成器 - ProxyJump 跳板机 ~/.ssh/config 在线生成 | 有条工具',
  description: '在线 SSH 配置生成器：表单填写主机别名、IP、用户、端口、私钥与 ProxyJump 跳板链，一键生成标准 ~/.ssh/config 文本，自动校验别名引用与块顺序，附放置路径与 600 权限说明，纯本地生成',
  keywords: 'ssh配置生成, ~/.ssh/config, ProxyJump, 跳板机配置, ssh多主机管理, ssh免密登录配置',
  author: '有条工具',
  ogTitle: 'SSH 配置生成器 - 有条工具',
  ogDescription: '填主机/别名/跳板机，一键生成 ~/.ssh/config，ProxyJump 免敲长命令',
  ogUrl: 'https://www.util.cn/tools/ssh-config-generator',
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
          name: 'SSH 配置生成器',
          url: 'https://www.util.cn/tools/ssh-config-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多主机条目增删', 'IdentityFile 私钥配置', 'ProxyJump 跳板链', '转发/保活/压缩选项', '别名引用校验', '一键复制配置']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'SSH 配置生成器', item: 'https://www.util.cn/tools/ssh-config-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'ProxyJump 的别名填什么？',
              acceptedAnswer: { '@type': 'Answer', text: '填跳板机在 config 中的 Host 别名，或 user@host 形式；本工具会自动校验别名是否在条目中存在，缺失时给出提示。' }
            },
            {
              '@type': 'Question',
              name: '修改 ssh config 后不生效怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '检查文件权限是否为 600、选项行是否缩进、Host 别名是否完全一致；可用 ssh -G 别名 查看最终合并后的生效参数。' }
            },
            {
              '@type': 'Question',
              name: '填写的主机信息会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。配置文本完全在你的浏览器内拼接生成，页面没有任何网络请求，关闭页面即清空。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ssh-config-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] SSH config 生成纯函数（可独立提取测试） =====
// 构建 ~/.ssh/config 文本
// hosts: [{ alias, hostName, user, port, identityFile, proxyJump, forwardAgent, keepAlive, compression }]
// 返回 { text, warnings }：跳板别名未定义时给出警告；被引用的主机块排在引用方之前
function buildSshConfig(hosts) {
  const warnings = []
  const list = (hosts || []).map((h, i) => ({
    ...h,
    _i: i,
    _alias: String(h.alias || '').trim(),
    _jump: String(h.proxyJump || '').trim()
  }))

  const aliasSet = new Set(list.map(h => h._alias).filter(Boolean))

  // 校验重复别名与未定义跳板别名
  const seen = new Set()
  for (const h of list) {
    if (!h._alias) {
      warnings.push(`第 ${h._i + 1} 条主机缺少别名，已按空别名生成 Host 行`)
    } else if (seen.has(h._alias)) {
      warnings.push(`别名「${h._alias}」重复定义，ssh 将以先出现的块为准`)
    }
    seen.add(h._alias)
    if (h._jump && !h._jump.split(',').every(j => aliasSet.has(j.trim()))) {
      const missing = h._jump.split(',').map(j => j.trim()).filter(j => !aliasSet.has(j))
      warnings.push(`主机「${h._alias || '(无别名)'}」的 ProxyJump 引用了未定义的别名：${missing.join('、')}`)
    }
  }

  // 块顺序：被跳板引用的主机排在引用方之前（简单拓扑排序，成环时回退原顺序）
  const ordered = []
  const pending = [...list]
  let guard = 0
  while (pending.length && guard < 200) {
    guard += 1
    const readyIdx = pending.findIndex(h => {
      if (!h._jump) return true
      const jumps = h._jump.split(',').map(j => j.trim()).filter(Boolean)
      return jumps.every(j => ordered.some(o => o._alias === j))
    })
    if (readyIdx === -1) { ordered.push(...pending); break }
    ordered.push(pending.splice(readyIdx, 1)[0])
  }

  const blocks = ordered.map(h => {
    const lines = [`Host ${h._alias}`]
    const push = (k, v) => { if (String(v || '').trim()) lines.push(`  ${k} ${String(v).trim()}`) }
    push('HostName', h.hostName)
    push('User', h.user)
    const port = String(h.port || '').trim()
    if (port) push('Port', port)
    push('IdentityFile', h.identityFile)
    if (h._jump) push('ProxyJump', h._jump)
    if (h.forwardAgent) lines.push('  ForwardAgent yes')
    if (h.keepAlive) {
      lines.push('  ServerAliveInterval 60')
      lines.push('  ServerAliveCountMax 3')
    }
    if (h.compression) lines.push('  Compression yes')
    return lines.join('\n')
  })

  const header = '# 由「有条工具 · SSH 配置生成器」生成\n# 保存后执行: chmod 600 ~/.ssh/config'
  const text = blocks.length
    ? [header, ...blocks].join('\n\n') + '\n'
    : header + '\n'
  return { text, warnings }
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const makeHost = () => ({
  alias: '',
  hostName: '',
  user: '',
  port: '22',
  identityFile: '',
  proxyJump: '',
  forwardAgent: false,
  keepAlive: false,
  compression: false
})

const hosts = ref([
  { ...makeHost(), alias: 'bastion', hostName: '203.0.113.1', user: 'ops', port: '22', identityFile: '~/.ssh/id_ed25519', keepAlive: true },
  { ...makeHost(), alias: 'prod-web', hostName: '10.0.0.8', user: 'deploy', port: '2222', identityFile: '~/.ssh/prod_key', proxyJump: 'bastion' }
])

const copiedKey = ref('')
const seoContentVisible = ref(true)

const configResult = computed(() => buildSshConfig(hosts.value))

const addHost = () => { hosts.value.push(makeHost()) }
const removeHost = (idx) => { hosts.value.splice(idx, 1) }

let copyTimer = null
const copyText = async (text, key) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
