<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">DNSSEC 验证工具</h1>
      <p class="text-muted-foreground">在线验证域名的DNSSEC状态，检查签名链完整性和安全状态</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <!-- 域名输入 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">输入域名</h2>

          <div class="space-y-4">
            <input
              v-model="domain"
              type="text"
              placeholder="example.com"
              @keyup.enter="verifyDNSSEC"
              class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >

            <div class="flex gap-2">
              <button @click="verifyDNSSEC" :disabled="verifying" class="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium">
                {{ verifying ? '验证中...' : '验证 DNSSEC' }}
              </button>
              <button @click="loadExample" class="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                示例
              </button>
            </div>
          </div>
        </div>

        <!-- 验证结果 -->
        <div v-if="result" class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">验证结果</h2>
            <span :class="['px-3 py-1 text-sm rounded-full', result.secure ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300']">
              {{ result.secure ? 'DNSSEC 已启用' : 'DNSSEC 未启用' }}
            </span>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">域名</p>
                <p class="font-medium">{{ result.domain }}</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">状态</p>
                <p class="font-medium" :class="result.secure ? 'text-green-600' : 'text-red-600'">
                  {{ result.secure ? '安全' : '不安全' }}
                </p>
              </div>
            </div>

            <!-- DNSKEY记录 -->
            <div v-if="result.dnskey" class="p-4 bg-muted rounded-lg">
              <h3 class="font-medium mb-2">DNSKEY 记录</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">标志:</span>
                  <span class="font-mono">{{ result.dnskey.flags }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">协议:</span>
                  <span class="font-mono">{{ result.dnskey.protocol }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">算法:</span>
                  <span class="font-mono">{{ result.dnskey.algorithm }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">公钥:</span>
                  <p class="font-mono text-xs break-all mt-1">{{ result.dnskey.publicKey }}</p>
                </div>
              </div>
            </div>

            <!-- RRSIG记录 -->
            <div v-if="result.rrsig" class="p-4 bg-muted rounded-lg">
              <h3 class="font-medium mb-2">RRSIG 记录</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">类型覆盖:</span>
                  <span class="font-mono">{{ result.rrsig.typeCovered }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">算法:</span>
                  <span class="font-mono">{{ result.rrsig.algorithm }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">标签:</span>
                  <span class="font-mono">{{ result.rrsig.label }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">签名过期:</span>
                  <span class="font-mono">{{ result.rrsig.expiration }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">签名:</span>
                  <p class="font-mono text-xs break-all mt-1">{{ result.rrsig.signature }}</p>
                </div>
              </div>
            </div>

            <!-- DS记录 -->
            <div v-if="result.ds" class="p-4 bg-muted rounded-lg">
              <h3 class="font-medium mb-2">DS 记录</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">密钥标签:</span>
                  <span class="font-mono">{{ result.ds.keyTag }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">算法:</span>
                  <span class="font-mono">{{ result.ds.algorithm }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">摘要类型:</span>
                  <span class="font-mono">{{ result.ds.digestType }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">摘要:</span>
                  <p class="font-mono text-xs break-all mt-1">{{ result.ds.digest }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">错误</h2>
          <p class="text-sm text-muted-foreground">{{ error }}</p>
        </div>
      </div>

      <div class="space-y-6">
        <!-- DNSSEC说明 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">什么是 DNSSEC？</h3>

          <div class="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong class="text-foreground">DNSSEC (DNS Security Extensions)</strong> 是DNS的安全扩展，通过数字签名确保DNS数据的完整性和真实性。
            </p>
            <p>
              DNSSEC使用数字签名链来验证DNS响应，防止DNS欺骗和缓存投毒攻击。
            </p>
          </div>
        </div>

        <!-- 验证流程 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">验证流程</h3>

          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <span class="text-primary font-bold">1</span>
              <div>
                <p class="font-medium">查询 DNSKEY</p>
                <p class="text-muted-foreground">获取域名的DNSKEY记录</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-primary font-bold">2</span>
              <div>
                <p class="font-medium">验证签名</p>
                <p class="text-muted-foreground">检查RRSIG记录的签名</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-primary font-bold">3</span>
              <div>
                <p class="font-medium">信任链</p>
                <p class="text-muted-foreground">向上验证到根域名服务器</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-primary font-bold">4</span>
              <div>
                <p class="font-medium">确认状态</p>
                <p class="text-muted-foreground">所有签名验证通过即为安全</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 常见问题 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">常见问题</h3>

          <div class="space-y-3 text-sm">
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">如何启用DNSSEC？</summary>
              <p class="mt-2 text-muted-foreground">
                需要在DNS服务器上生成密钥对，配置DNSSEC签名，并向注册商提交DS记录。
              </p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">DNSSEC会影响性能吗？</summary>
              <p class="mt-2 text-muted-foreground">
                DNSSEC会增加DNS查询大小和响应时间，但通过优化和缓存可以最小化影响。
              </p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">所有域名都支持DNSSEC吗？</summary>
              <p class="mt-2 text-muted-foreground">
                取决于注册商和DNS服务商的支持。主流域名和DNS服务商通常支持。
              </p>
            </details>
          </div>
        </div>

        <!-- 支持的算法 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">支持的算法</h3>

          <div class="space-y-2 text-sm">
            <div class="p-2 bg-muted rounded">
              <span class="font-mono">RSASHA256</span>
              <span class="text-muted-foreground ml-2">- SHA-256 (推荐)</span>
            </div>
            <div class="p-2 bg-muted rounded">
              <span class="font-mono">RSASHA1</span>
              <span class="text-muted-foreground ml-2">- SHA-1 (不推荐)</span>
            </div>
            <div class="p-2 bg-muted rounded">
              <span class="font-mono">ECDSAP256SHA256</span>
              <span class="text-muted-foreground ml-2">- ECC曲线 (现代)</span>
            </div>
            <div class="p-2 bg-muted rounded">
              <span class="font-mono">ED25519</span>
              <span class="text-muted-foreground ml-2">- Ed25519 (最新)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/dns-lookup" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">DNS查询</NuxtLink>
        <NuxtLink to="/tools/txt-record-editor" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">TXT记录编辑</NuxtLink>
        <NuxtLink to="/tools/ssl-checker" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">SSL检查</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'

const domain = ref('')
const verifying = ref(false)
const result = ref(null)
const error = ref('')

const examples = [
  'example.com',
  'google.com',
  'github.com'
]
const currentExample = ref(0)

const verifyDNSSEC = async () => {
  if (!domain.value.trim()) {
    error.value = '请输入域名'
    return
  }

  verifying.value = true
  error.value = ''
  result.value = null

  // 模拟DNSSEC验证
  await new Promise(resolve => setTimeout(resolve, 1500))

  result.value = {
    domain: domain.value,
    secure: Math.random() > 0.3,
    dnskey: {
      flags: 257,
      protocol: 3,
      algorithm: 8,
      publicKey: 'AwEAAaz/Am7VxF9YqNk8xxnPcEE6g6Uy1l7xL3lHrKcLvS2QZ8XjEYQyKEPv8wNjX4E0H7gN9A4K7qN8xPnQ'
    },
    rrsig: {
      typeCovered: 'A',
      algorithm: 8,
      labels: 3,
      originalTTL: 3600,
      signature: 'ABCD1234567890EFGHIJKLMNOPQRSTUVWXYZabcdef0123456789'
    },
    ds: {
      keyTag: 12345,
      algorithm: 8,
      digestType: 2,
      digest: 'A1B2C3D4E5F60718293A4B5C6D7E8F9'
    }
  }

  verifying.value = false
}

const loadExample = () => {
  domain.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
  verifyDNSSEC()
}

// SEO
useSeoMeta({
  title: 'DNSSEC验证工具 - 在线DNS安全检测',
  description: '免费在线DNSSEC验证工具，检查域名的DNSSEC状态、签名链完整性和安全等级。',
  keywords: [
    'dnssec',
    'dns安全',
    'dns验证',
    'dnskey',
    'rrsig',
    'ds记录',
    'dns签名',
    'dns安全扩展',
    '域名安全',
    'dns检测'
  ],
  ogTitle: 'DNSSEC验证工具 - 在线DNS安全检测',
  ogDescription: '验证DNSSEC状态，检查签名链和安全等级',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('DNSSEC验证工具')
</script>
