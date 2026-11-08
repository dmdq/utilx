<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <KeyRound class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">文本加密解密</h1>
          <p class="text-sm text-muted-foreground mt-1">AES-256-GCM 认证加密：密码错误解不开，密文被篡改一字节也解不开</p>
        </div>
      </div>
      <p class="text-muted-foreground mb-3">
        用一个密码把敏感文本加密成可粘贴的字符串，发给对方或存进笔记，对方用同一密码还原。加密走浏览器原生 Web Crypto：
        密码经 PBKDF2-SHA256 <strong class="text-foreground">600000 次迭代</strong>（OWASP 2023 推荐值）+ 随机 16 字节 salt
        派生 256 位密钥，随机 12 字节 IV 做 AES-GCM 认证加密。输出为自描述的
        <code class="px-1 bg-muted rounded text-sm">UTIL1:</code> 前缀格式（版本化，便于将来升级）。
        与常见的 ECB / DES 玩具"加密"不同，GCM 是认证加密：密文哪怕被改动一个字节、或密码错一个字符，都会解密失败并明确提示——
        而不是解出一堆错误的乱码。所有密钥派生与加解密都在本机完成，密钥与明文不经任何服务器。
      </p>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400">
        <ShieldCheck class="w-4 h-4" />
        密码不出浏览器：PBKDF2 派生与 AES 加解密全部在本机完成，不会上传到任何服务器。
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Lock class="w-5 h-5 mr-2 text-primary" /> 加密 / 解密输入
        </h2>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="t in TABS"
            :key="t.value"
            @click="switchTab(t.value)"
            :class="tab === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-sm font-medium transition-all"
          >{{ t.label }}</button>
        </div>

        <!-- 加密 -->
        <template v-if="tab === 'encrypt'">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">加密密码</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-11 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="输入密码（建议至少 6 位）"
                autocomplete="new-password"
              >
              <button
                @click="showPassword = !showPassword"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                type="button"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
            <p class="mt-1.5 text-xs" :class="isWeakPassword ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'">
              {{ passwordHint }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">要加密的明文</label>
            <textarea
              v-model="plaintext"
              rows="8"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="粘贴要保密的内容：账号密码、恢复助记词、服务器地址、私密笔记……"
            ></textarea>
            <p class="mt-1.5 text-xs text-muted-foreground">{{ plaintext.length }} 字符 · 支持中文与 emoji</p>
          </div>

          <button
            @click="runEncrypt"
            :disabled="busy || !password || !plaintext"
            class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >{{ busy ? '加密中…' : 'AES-256-GCM 加密' }}</button>
        </template>

        <!-- 解密 -->
        <template v-else>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">解密密码</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full px-3 py-2.5 pr-11 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="输入加密时使用的密码"
                autocomplete="off"
              >
              <button
                @click="showPassword = !showPassword"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                type="button"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
            <p class="mt-1.5 text-xs text-muted-foreground">密码或密文任何一个字符不对，都会解密失败并提示，不会输出错误内容。</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">UTIL1: 密文</label>
            <textarea
              v-model="payloadInput"
              rows="8"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="粘贴以 UTIL1: 开头的密文字符串……"
            ></textarea>
            <p class="mt-1.5 text-xs text-muted-foreground">{{ payloadInput.length }} 字符</p>
          </div>

          <button
            @click="runDecrypt"
            :disabled="busy || !password || !payloadInput"
            class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >{{ busy ? '解密中…' : 'AES-256-GCM 解密' }}</button>
        </template>
      </div>

      <!-- 右侧：结果区 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <!-- 加密结果 -->
        <template v-if="tab === 'encrypt'">
          <div v-if="encryptError" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-400 leading-relaxed">
            {{ encryptError }}
          </div>
          <div v-if="encryptResult" class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-foreground flex items-center gap-2">
                <Lock class="w-4 h-4 text-primary" /> 加密结果（UTIL1 格式）
              </h3>
              <button
                @click="copyText(encryptResult, 'enc-result')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
              >
                <Check v-if="copiedKey === 'enc-result'" class="w-3.5 h-3.5 text-green-600" />
                <Copy v-else class="w-3.5 h-3.5" />
                {{ copiedKey === 'enc-result' ? '已复制' : '复制密文' }}
              </button>
            </div>
            <pre class="overflow-auto p-3 bg-muted/30 border border-border rounded-lg text-xs font-mono leading-relaxed max-h-56 whitespace-pre-wrap break-all">{{ encryptResult }}</pre>
            <p class="text-xs text-muted-foreground">{{ encryptResult.length }} 字符</p>

            <div class="p-3 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground leading-relaxed">
              格式：<code class="px-0.5 bg-muted rounded">UTIL1:&lt;Base64(salt 16字节 | IV 12字节 | AES-GCM 密文+16字节认证标签)&gt;</code>。
              前缀自描述且版本化，解密方可校验格式；salt 与 IV 随密文一起传输，无需额外传递参数。
            </div>

            <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              诚实标注：忘记密码将无法恢复，AES-256-GCM 没有后门也无法绕过认证；同一密码对同一明文每次加密输出都不同
              （随机 salt 与 IV），这是正常现象，两条密文都能用同一密码解密。
            </div>
          </div>
          <div v-else class="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
            输入密码与明文后，这里会生成可粘贴的 UTIL1: 密文
          </div>
        </template>

        <!-- 解密结果 -->
        <template v-else>
          <div v-if="decryptError" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-400 leading-relaxed">
            {{ decryptError }}
          </div>
          <div v-if="decryptSuccess" class="space-y-4">
            <div class="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 shrink-0" />
              解密成功：GCM 认证通过，内容与加密时逐字节一致。
            </div>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-foreground flex items-center gap-2">
                <Unlock class="w-4 h-4 text-primary" /> 明文预览
              </h3>
              <button
                @click="copyText(decryptSuccess, 'dec-result')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
              >
                <Check v-if="copiedKey === 'dec-result'" class="w-3.5 h-3.5 text-green-600" />
                <Copy v-else class="w-3.5 h-3.5" />
                {{ copiedKey === 'dec-result' ? '已复制' : '复制明文' }}
              </button>
            </div>
            <pre class="overflow-auto p-3 bg-muted/30 border border-border rounded-lg text-sm leading-relaxed max-h-64 whitespace-pre-wrap break-all">{{ decryptSuccess }}</pre>
            <p class="text-xs text-muted-foreground">{{ decryptSuccess.length }} 字符 · 建议复制到本地安全保存，不要长期停留在剪贴板</p>
          </div>
          <div v-if="!decryptError && !decryptSuccess" class="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
            输入密码与 UTIL1: 密文后，这里会显示解密结果
          </div>
        </template>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于文本加密解密工具</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            本工具用密码对文本做真正的对称认证加密：密码先经 PBKDF2-SHA256 迭代 600000 次（OWASP 2023 推荐值）并混合 16 字节随机 salt，
            派生出 256 位 AES 密钥；再用随机 12 字节 IV 做 AES-GCM 加密。GCM 属于认证加密（AEAD）——它在加密的同时生成认证标签，
            解密时会逐字节校验密文与标签：密码错一个字符、密文被改动或截断一个字节，都会直接失败并提示"密码错误或内容已损坏"，
            绝不会输出似是而非的错误明文。输出格式为 <code class="px-1 bg-muted rounded">UTIL1:</code> 前缀 + Base64(salt|IV|密文)，
            自描述、版本化，把 salt 和 IV 打包进密文本身，解密方无需额外传参。
          </p>

          <h3 class="text-lg font-semibold text-foreground">与"玩具加密"的区别</h3>
          <p>
            网上不少在线"文本加密"工具仍使用 DES、ECB 模式或自制 XOR：ECB 对相同明文块输出相同密文（密文模式泄露内容结构），
            且没有任何完整性保护——密文被篡改后往往仍能"解密"出一串错误内容，使用者难以察觉。AES-256-GCM 两者都解决了：
            相同明文每次密文不同（随机 salt/IV），篡改即失败（认证标签校验）。密钥派生强度同样重要：600000 次 PBKDF2
            让暴力穷举弱密码的成本大幅提升，而直接拿密码当密钥的实现几乎等于没加密。
          </p>

          <h3 class="text-lg font-semibold text-foreground">什么时候用它</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>私密文本走公开渠道：通过微信、邮件、工单把账号、服务器地址、恢复码发给同事，聊天记录泄露也拿不到明文。</li>
            <li>加密笔记备份：把敏感笔记加密后存进任意云笔记/网盘，密文离了密码就是一堆随机字节。</li>
            <li>双人约定口令传递：双方提前约定一个强密码，之后任何文本都可用它安全往返。</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">忘记密码还能解密吗？</span>不能。密钥由密码 + 随机 salt 经 600000 次 PBKDF2 迭代派生，没有后门、无法重置，忘记密码等于内容永久丢失——请务必保管好密码。</li>
            <li><span class="text-foreground font-medium">同一密码两次加密的结果为什么不一样？</span>正常现象。每次加密都会生成新的随机 salt（16 字节）与 IV（12 字节）并打包进密文，所以密文不同但都能用同一密码解密；这也让攻击者无法通过比对密文发现"两段内容相同"。</li>
            <li><span class="text-foreground font-medium">密码错或内容被改会怎样？</span>解密直接失败，页面明确提示"密码错误或内容已损坏"。这是 GCM 认证加密的保证：密文哪怕被改动一个字节都无法通过认证，不会输出错误明文。</li>
            <li><span class="text-foreground font-medium">密码和文本会上传吗？</span>不会。PBKDF2 派生与 AES 加解密全部通过浏览器原生 Web Crypto API 在本机完成，页面没有任何网络请求。</li>
            <li><span class="text-foreground font-medium">加密为什么要等一下？</span>PBKDF2 要在本地执行 600000 次哈希迭代来抵抗暴力破解，通常一秒以内，属正常延迟；这也正是安全性的来源之一。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'text-encryptor'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { KeyRound, Lock, Unlock, Eye, EyeOff, Copy, Check, ChevronUp, ChevronDown, ShieldCheck } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '文本加密解密工具 - AES-256-GCM 密码加密在线',
  description: '在线文本加密解密工具：AES-256-GCM 认证加密 + PBKDF2-SHA256 600000 次迭代派生密钥，密码错误或密文被篡改一字节都无法解密，UTIL1 自描述格式可粘贴传输，纯本地不上传',
  keywords: '文本加密, 文字加密解密, aes加密工具, 在线加密, aes-256-gcm, 保密文本',
  author: 'Util工具箱',
  ogTitle: '文本加密解密 - 有条工具',
  ogDescription: 'AES-256-GCM 认证加密：密码错误解不开，密文被篡改一字节也解不开，密钥不经服务器',
  ogUrl: 'https://www.util.cn/tools/text-encryptor',
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
          '@type': 'SoftwareApplication',
          name: '文本加密解密',
          url: 'https://www.util.cn/tools/text-encryptor',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Any（浏览器）',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['AES-256-GCM 认证加密', 'PBKDF2-SHA256 600000 次迭代', '随机 salt 与 IV', 'UTIL1 自描述版本化格式', '篡改/错密码明确报错', '密码显隐与一键复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '文本加密解密', item: 'https://www.util.cn/tools/text-encryptor/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '忘记密码还能解密吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。密钥由密码与随机 salt 经 600000 次 PBKDF2-SHA256 迭代派生，没有后门也无法重置，忘记密码意味着内容永久丢失，请务必保管好密码。' }
            },
            {
              '@type': 'Question',
              name: '同一密码两次加密的结果为什么不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '正常现象。每次加密都生成新的随机 salt（16 字节）与 IV（12 字节）并打包进密文，密文不同但都能用同一密码解密，同时可防止攻击者通过比对密文判断内容是否相同。' }
            },
            {
              '@type': 'Question',
              name: '密码错误或内容被篡改时会怎样？',
              acceptedAnswer: { '@type': 'Answer', text: '解密直接失败并提示"密码错误或内容已损坏"。AES-256-GCM 是认证加密，密文哪怕被改动一个字节都无法通过认证标签校验，不会输出错误的明文。' }
            },
            {
              '@type': 'Question',
              name: '密码和文本会上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。PBKDF2 密钥派生与 AES 加解密全部通过浏览器原生 Web Crypto API 在本机完成，页面没有任何网络请求。' }
            },
            {
              '@type': 'Question',
              name: '加密为什么需要等待一小会儿？',
              acceptedAnswer: { '@type': 'Answer', text: 'PBKDF2-SHA256 需要在本地执行 600000 次迭代（OWASP 2023 推荐值）以抵抗对弱密码的暴力穷举，通常一秒以内，这正是安全性的来源之一。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'text-encryptor')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 纯函数（可独立提取测试；crypto.subtle / TextEncoder 在浏览器与 node 19+ 均为全局） =====

// 常量：格式前缀 / salt 长度 / IV 长度 / GCM 认证标签长度 / PBKDF2 迭代次数（OWASP 2023 推荐值）
const UTIL_PREFIX = 'UTIL1:'
const SALT_LEN = 16
const IV_LEN = 12
const TAG_LEN = 16
const PBKDF2_ITERATIONS = 600000

// Base64 字符表（纯表驱动实现，浏览器与 node 通用，不依赖 btoa/Buffer）
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// UTF-8 字符串 → 字节（中文/emoji 安全）
function stringToBytes(text) {
  return new TextEncoder().encode(text)
}

// 字节 → UTF-8 字符串
function bytesToString(bytes) {
  return new TextDecoder('utf-8').decode(bytes)
}

// 字节 → Base64
function bytesToBase64(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = bytes[i + 1]
    const b2 = bytes[i + 2]
    out += B64_CHARS[b0 >> 2]
    out += B64_CHARS[((b0 & 3) << 4) | ((b1 === undefined ? 0 : b1) >> 4)]
    out += b1 === undefined ? '=' : B64_CHARS[((b1 & 15) << 2) | ((b2 === undefined ? 0 : b2) >> 6)]
    out += b2 === undefined ? '=' : B64_CHARS[b2 & 63]
  }
  return out
}

// Base64 → 字节（严格校验，非法输入抛错）
function base64ToBytes(str) {
  let clean = String(str).replace(/\s+/g, '')
  const padIdx = clean.indexOf('=')
  if (padIdx !== -1) clean = clean.slice(0, padIdx)
  if (!/^[A-Za-z0-9+/]*$/.test(clean)) throw new Error('invalid base64 characters')
  if (clean.length % 4 === 1) throw new Error('invalid base64 length')
  const out = new Uint8Array(Math.floor(clean.length * 3 / 4))
  let o = 0
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_CHARS.indexOf(clean[i])
    const c1 = B64_CHARS.indexOf(clean[i + 1])
    const c2 = i + 2 < clean.length ? B64_CHARS.indexOf(clean[i + 2]) : -1
    const c3 = i + 3 < clean.length ? B64_CHARS.indexOf(clean[i + 3]) : -1
    out[o++] = (c0 << 2) | (c1 >> 4)
    if (c2 !== -1) out[o++] = ((c1 & 15) << 4) | (c2 >> 2)
    if (c3 !== -1) out[o++] = ((c2 & 3) << 6) | c3
  }
  return out.slice(0, o)
}

// 随机字节（crypto.getRandomValues，浏览器与 node 19+ 全局可用）
function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n))
}

// 组装 UTIL1 载荷：UTIL1:<base64(salt | iv | ciphertext+tag)>
function formatUtil1Payload(salt, iv, ciphertext) {
  const blob = new Uint8Array(salt.length + iv.length + ciphertext.length)
  blob.set(salt, 0)
  blob.set(iv, salt.length)
  blob.set(ciphertext, salt.length + iv.length)
  return UTIL_PREFIX + bytesToBase64(blob)
}

// 解析并严格校验 UTIL1 载荷；格式错误抛 isFormatError 标记的错误
function parseUtil1Payload(text) {
  const t = String(text || '').trim()
  if (!t.startsWith(UTIL_PREFIX)) {
    const err = new Error('格式不正确：密文应以 UTIL1: 开头')
    err.isFormatError = true
    throw err
  }
  let blob
  try {
    blob = base64ToBytes(t.slice(UTIL_PREFIX.length))
  } catch (e) {
    const err = new Error('格式不正确：UTIL1: 之后不是有效的 Base64')
    err.isFormatError = true
    throw err
  }
  if (blob.length < SALT_LEN + IV_LEN + TAG_LEN) {
    const err = new Error('格式不正确：密文内容不完整（缺少 salt、IV 或 GCM 认证标签）')
    err.isFormatError = true
    throw err
  }
  return {
    salt: blob.slice(0, SALT_LEN),
    iv: blob.slice(SALT_LEN, SALT_LEN + IV_LEN),
    ciphertext: blob.slice(SALT_LEN + IV_LEN)
  }
}

// 由密码 + salt 派生 AES-256-GCM 密钥（PBKDF2-SHA256 × 600000）
async function deriveKeyFromPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToBytes(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// 加密：密码 + 明文 → UTIL1: 密文串（随机 salt/IV，每次输出不同）
async function encryptText(password, plaintext) {
  const salt = randomBytes(SALT_LEN)
  const iv = randomBytes(IV_LEN)
  const key = await deriveKeyFromPassword(password, salt)
  const ctBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    stringToBytes(plaintext)
  )
  return formatUtil1Payload(salt, iv, new Uint8Array(ctBuf))
}

// 解密：密码 + UTIL1: 密文 → 明文。密码错误/密文被篡改时 crypto.subtle.reject（OperationError）
async function decryptText(password, payloadText) {
  const parts = parseUtil1Payload(payloadText)
  const key = await deriveKeyFromPassword(password, parts.salt)
  const ptBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: parts.iv },
    key,
    parts.ciphertext
  )
  return bytesToString(new Uint8Array(ptBuf))
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const TABS = [
  { value: 'encrypt', label: '加密' },
  { value: 'decrypt', label: '解密' }
]

const tab = ref('encrypt')
const password = ref('')
const showPassword = ref(false)
const plaintext = ref('')
const payloadInput = ref('')
const encryptResult = ref('')
const encryptError = ref('')
const decryptSuccess = ref('')
const decryptError = ref('')
const busy = ref(false)
const copiedKey = ref('')
const seoContentVisible = ref(true)

const isWeakPassword = computed(() => password.value.length > 0 && password.value.length < 6)
const passwordHint = computed(() => {
  if (password.value.length === 0) return '密码用于派生 AES-256 密钥，建议至少 6 位、混合大小写与符号'
  if (password.value.length < 6) return '密码不足 6 位，安全强度较弱（仍可加密，建议使用更长的密码）'
  return '密钥将经 PBKDF2-SHA256 × 600000 次迭代派生，通常需要不到一秒'
})

function switchTab(v) {
  tab.value = v
  decryptError.value = ''
}

// ---------- 加密 ----------
async function runEncrypt() {
  encryptError.value = ''
  encryptResult.value = ''
  if (!password.value || !plaintext.value) return
  busy.value = true
  try {
    encryptResult.value = await encryptText(password.value, plaintext.value)
  } catch (e) {
    encryptResult.value = ''
    encryptError.value = '加密失败：' + ((e && e.message) || '未知错误') + '（请确认浏览器支持 Web Crypto API 且页面通过 HTTPS 或 localhost 访问）'
  } finally {
    busy.value = false
  }
}

// ---------- 解密 ----------
async function runDecrypt() {
  decryptError.value = ''
  decryptSuccess.value = ''
  if (!password.value || !payloadInput.value) return
  busy.value = true
  try {
    decryptSuccess.value = await decryptText(password.value, payloadInput.value)
  } catch (e) {
    decryptSuccess.value = ''
    if (e && e.isFormatError) {
      decryptError.value = e.message
    } else {
      // GCM 认证失败（OperationError）：密码错误或密文被篡改，二者对外不可区分
      decryptError.value = '密码错误或内容已损坏：GCM 认证未通过，请核对密码与密文是否完整'
    }
  } finally {
    busy.value = false
  }
}

// ---------- 复制 ----------
let copyTimer = null
async function copyText(text, key) {
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

function toggleSeoContent() {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
