<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileSignature class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">PEM证书解析器</h1>
          <p class="text-sm text-muted-foreground mt-1">解析 X.509 证书字段，识别密钥类型，纯本地解析</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        粘贴 PEM 文本，自动识别 CERTIFICATE / PRIVATE KEY / PUBLIC KEY / CSR / CRL 块类型；证书类型可解析主体、签发者、有效期、序列号、指纹、SAN 域名与密钥算法。解析在浏览器本地完成，数据不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileSignature class="w-5 h-5 mr-2 text-primary" /> 输入 PEM 文本
          </h2>

          <!-- 上传区 -->
          <div
            class="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30 mb-4"
            :class="{ 'border-primary/60 bg-primary/5': isDragging }"
            @click="triggerFileSelect"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".pem,.crt,.cer,.key,.pub,.txt,text/plain"
              class="hidden"
              @change="handleFileChange"
            />
            <Upload v-if="!inputFileName" class="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
            <FileCheck v-else class="w-6 h-6 mx-auto mb-1.5 text-primary" />
            <p v-if="!inputFileName" class="text-xs text-muted-foreground">点击选择或拖入 .pem / .crt / .key 文件</p>
            <p v-else class="text-xs font-medium text-foreground truncate">{{ inputFileName }}</p>
          </div>

          <textarea
            v-model="pemText"
            class="w-full h-56 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="-----BEGIN CERTIFICATE-----&#10;MIIFazCCA1OgAwIBAgIRA...&#10;-----END CERTIFICATE-----"
            spellcheck="false"
          ></textarea>

          <button
            @click="parsePem"
            :disabled="!pemText.trim() || parsing"
            class="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="parsing" class="w-4 h-4 animate-spin" />
            {{ parsing ? '解析中...' : '解析证书' }}
          </button>

          <!-- 解析错误 -->
          <div v-if="parseError" class="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p class="text-sm text-destructive font-medium flex items-center gap-1.5">
              <FileWarning class="w-4 h-4" /> 解析失败
            </p>
            <p class="text-xs text-muted-foreground mt-1">{{ parseError }}</p>
          </div>

          <!-- 识别到的块类型 -->
          <div v-if="blocks.length" class="mt-4">
            <p class="text-xs font-medium text-foreground mb-2 flex items-center">
              <KeyRound class="w-3.5 h-3.5 mr-1 text-primary" /> 识别到的 PEM 块
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(b, i) in blocks"
                :key="i"
                class="px-2 py-1 bg-muted rounded text-xs font-mono text-foreground"
              >-----BEGIN {{ b.label }}-----</span>
            </div>
          </div>
        </div>

        <!-- 安全与隐私说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Lock class="w-4 h-4 mr-2 text-primary" /> 安全与隐私
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• 所有解析均在浏览器本地完成，任何数据（包括私钥）都不会上传服务器</li>
            <li>• 尽管如此，仍建议不要在不受信任的设备或网络环境中粘贴私钥</li>
            <li>• 支持识别：CERTIFICATE、PRIVATE KEY、PUBLIC KEY、CERTIFICATE REQUEST（CSR）、X509 CRL</li>
            <li>• 私钥文件（RSA/EC/PKCS#8）仅做类型识别，不解析、不展示其内容</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：解析结果 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileCheck class="w-5 h-5 mr-2 text-primary" /> 解析结果
          </h2>

          <!-- 证书详情 -->
          <div v-if="result && result.kind === 'cert'" class="space-y-5">
            <!-- 基本信息 -->
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">基本信息</h3>
              <div class="text-xs text-muted-foreground mb-3">{{ result.version }} · 签名算法：{{ result.signature || '未知' }}</div>
              <div class="space-y-1.5">
                <div class="flex items-start gap-3 py-1.5 border-b border-border/60">
                  <span class="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">序列号</span>
                  <span class="text-sm font-mono text-foreground break-all">{{ result.serial || '—' }}</span>
                </div>
                <div class="flex items-start gap-3 py-1.5 border-b border-border/60">
                  <span class="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">密钥算法</span>
                  <span class="text-sm text-foreground">{{ result.keyAlgo }}<span v-if="result.keyBits">（{{ result.keyBits }} 位）</span></span>
                </div>
              </div>
            </div>

            <!-- 主体 -->
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">主体 Subject</h3>
              <div class="space-y-1">
                <div v-for="(f, i) in result.subject" :key="i" class="flex items-start gap-3 py-1.5 border-b border-border/60 last:border-0">
                  <span class="w-28 shrink-0 text-xs text-muted-foreground pt-0.5">{{ f.label }}</span>
                  <span class="text-sm font-mono text-foreground break-all">{{ f.value }}</span>
                </div>
              </div>
            </div>

            <!-- 签发者 -->
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">签发者 Issuer</h3>
              <div class="space-y-1">
                <div v-for="(f, i) in result.issuer" :key="i" class="flex items-start gap-3 py-1.5 border-b border-border/60 last:border-0">
                  <span class="w-28 shrink-0 text-xs text-muted-foreground pt-0.5">{{ f.label }}</span>
                  <span class="text-sm font-mono text-foreground break-all">{{ f.value }}</span>
                </div>
              </div>
            </div>

            <!-- 有效期 -->
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">有效期 Validity</h3>
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-muted/50 rounded-lg p-3">
                  <p class="text-xs text-muted-foreground mb-1">生效时间</p>
                  <p class="text-sm font-mono text-foreground">{{ formatDate(result.notBefore) }}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-3">
                  <p class="text-xs text-muted-foreground mb-1">到期时间</p>
                  <p class="text-sm font-mono text-foreground">{{ formatDate(result.notAfter) }}</p>
                </div>
              </div>
              <p v-if="result.expired" class="mt-2 text-sm text-destructive font-medium flex items-center gap-1.5">
                <AlertTriangle class="w-4 h-4 shrink-0" />
                证书已过期 {{ result.daysOver }} 天，请勿继续用于生产环境
              </p>
              <p v-else-if="result.notYetValid" class="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle class="w-4 h-4 shrink-0" />
                证书尚未生效，生效时间为 {{ formatDate(result.notBefore) }}
              </p>
              <p v-else class="mt-2 text-sm text-foreground">
                剩余有效期约 <span class="font-semibold">{{ result.daysLeft }}</span> 天
              </p>
            </div>

            <!-- 指纹 -->
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">证书指纹</h3>
              <div class="space-y-1">
                <div class="flex items-start gap-3 py-1.5 border-b border-border/60">
                  <span class="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">SHA-1</span>
                  <span class="text-sm font-mono text-foreground break-all">{{ result.sha1 }}</span>
                </div>
                <div class="flex items-start gap-3 py-1.5 border-b border-border/60 last:border-0">
                  <span class="w-24 shrink-0 text-xs text-muted-foreground pt-0.5">SHA-256</span>
                  <span class="text-sm font-mono text-foreground break-all">{{ result.sha256 }}</span>
                </div>
              </div>
            </div>

            <!-- SAN -->
            <div>
              <h3 class="text-sm font-semibold text-foreground mb-2">SAN 备用域名</h3>
              <div v-if="result.san && result.san.length" class="flex flex-wrap gap-2">
                <span
                  v-for="(name, i) in result.san"
                  :key="i"
                  class="px-2 py-1 bg-muted rounded text-xs font-mono text-foreground break-all"
                >{{ name }}</span>
              </div>
              <p v-else class="text-xs text-muted-foreground">该证书未包含 SAN（subjectAltName）扩展</p>
            </div>
          </div>

          <!-- 私钥 / 公钥 / CSR / CRL：仅类型识别 -->
          <div v-else-if="result" class="p-4 rounded-lg border border-border bg-muted/30 flex gap-3">
            <Lock v-if="result.kind === 'private'" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <KeyRound v-else class="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">识别为{{ blockTypeMeta[result.kind]?.label || 'PEM 块' }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ blockTypeMeta[result.kind]?.desc || '' }}</p>
              <p v-if="result.kind === 'private'" class="text-xs text-destructive mt-2 flex items-start gap-1.5">
                <AlertTriangle class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                私钥是敏感凭据，切勿粘贴到不信任的环境或网站。本工具为纯前端实现，所有解析均在浏览器本地完成，数据不会上传服务器。
              </p>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="py-16 text-center">
            <FileSignature class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p class="text-sm text-muted-foreground">粘贴 PEM 文本并点击解析，这里会显示证书详情</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于PEM证书解析器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            PEM（Privacy-Enhanced Mail）是证书、密钥等密码学材料的 Base64 文本封装格式，以 -----BEGIN-----/-----END----- 行包裹，常见于 .pem、.crt、.key 等文件。本工具解析 X.509 证书的常用字段，帮助你快速核对域名、有效期与签发者，在部署前排查"证书过期""域名不匹配"等问题。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>部署 HTTPS 前核对证书覆盖的域名（SAN）与到期时间</li>
            <li>排查浏览器"证书已过期 / 域名不匹配"告警的具体原因</li>
            <li>检查证书链：通过签发者字段确认中间证书与根证书</li>
            <li>确认手头的 .key / .pub 文件到底是私钥还是公钥</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">证书数据会上传吗？</span>不会。解析通过 WebAssembly/JS 在浏览器本地完成，数据不出设备。</li>
            <li><span class="text-foreground font-medium">支持哪些 PEM 类型？</span>CERTIFICATE 可完整解析；PRIVATE KEY / PUBLIC KEY / CSR / CRL 目前仅做类型识别与安全提示。</li>
            <li><span class="text-foreground font-medium">粘贴私钥安全吗？</span>本工具纯本地解析不上传，但仍建议不要在不受信任的设备上粘贴私钥。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pem-parser'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  FileSignature, Upload, FileCheck, FileWarning,
  AlertTriangle, Lock, Loader2, KeyRound, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'PEM证书解析器 - 在线X.509证书查看工具',
  description: '在线PEM证书解析工具，解析X.509证书主体、签发者、有效期、序列号、SHA-1/SHA-256指纹、SAN域名与密钥算法，识别私钥/公钥/CSR/CRL类型，纯本地解析',
  keywords: 'pem解析, 证书解析, x509查看器, 证书有效期查询, 证书指纹, san域名, 在线证书工具',
  author: 'Util工具箱',
  ogTitle: 'PEM证书解析器 - 有条工具',
  ogDescription: '解析 X.509 证书字段，识别密钥类型，纯本地解析',
  ogUrl: 'https://www.util.cn/tools/pem-parser',
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
          name: 'PEM证书解析器',
          url: 'https://www.util.cn/tools/pem-parser',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['X.509证书解析', '有效期与过期提醒', 'SHA-1/SHA-256指纹', 'SAN域名列表', 'PEM块类型识别']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: 'PEM证书解析器', item: 'https://www.util.cn/tools/pem-parser/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '证书数据会上传到服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会，所有解析均在浏览器本地完成，数据不出设备；但仍建议不要在不受信任的设备上粘贴私钥。' }
            },
            {
              '@type': 'Question',
              name: '支持解析哪些PEM类型？',
              acceptedAnswer: { '@type': 'Answer', text: 'CERTIFICATE 证书可完整解析字段；PRIVATE KEY、PUBLIC KEY、CSR、CRL 目前仅做类型识别与安全提示。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'pem-parser')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const pemText = ref('')
const inputFileName = ref('')
const isDragging = ref(false)
const parsing = ref(false)
const parseError = ref('')
const blocks = ref([])
const result = ref(null)
const seoContentVisible = ref(true)
const fileInput = ref(null)

const blockTypeMeta = {
  cert: { label: '证书（CERTIFICATE）', desc: 'X.509 证书，已解析完整字段' },
  private: { label: '私钥（PRIVATE KEY）', desc: '本工具仅做类型识别，不解析、不展示私钥内容' },
  public: { label: '公钥（PUBLIC KEY）', desc: '本工具仅做类型识别；公钥可公开，但请核对指纹与来源' },
  csr: { label: 'CSR 证书签名请求（CERTIFICATE REQUEST）', desc: '本工具仅做类型识别，暂不支持解析其内部字段' },
  crl: { label: 'CRL 证书吊销列表（X509 CRL）', desc: '本工具仅做类型识别，暂不支持解析其内部字段' },
  unknown: { label: '未知的 PEM 块', desc: '该 BEGIN 标签不在已支持的类型列表中' }
}

const ATTR_LABELS = {
  CN: '通用名称（CN）',
  O: '组织（O）',
  OU: '组织单位（OU）',
  C: '国家（C）',
  ST: '省/州（ST）',
  L: '城市（L）',
  emailAddress: '邮箱',
  DC: '域名组件（DC）',
  SN: '姓氏（SN）',
  GN: '名字（GN）',
  serialNumber: '序列号属性'
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 解析 ----------
const detectType = (label) => {
  if (/CERTIFICATE REQUEST/.test(label)) return 'csr'
  if (/CRL/.test(label)) return 'crl'
  if (/PRIVATE KEY/.test(label)) return 'private'
  if (/PUBLIC KEY/.test(label)) return 'public'
  if (/CERTIFICATE/.test(label)) return 'cert'
  return 'unknown'
}

const readFields = (entity) => {
  return (entity?.fields || []).map(f => ({
    short: f.shortName || f.name || '',
    label: ATTR_LABELS[f.shortName] || f.shortName || f.name || '字段',
    value: String(f.value ?? '')
  }))
}

const formatHex = (hex) => (hex.match(/../g) || []).join(':').toUpperCase()

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleString('zh-CN', { hour12: false })
  } catch (e) {
    return String(d)
  }
}

const parsePem = async () => {
  parseError.value = ''
  result.value = null
  blocks.value = []
  const text = pemText.value.trim()
  if (!text) return

  // 识别块类型
  const labels = [...text.matchAll(/-----BEGIN ([A-Z0-9 ]+)-----/g)].map(m => m[1])
  if (!labels.length) {
    parseError.value = '未识别到 PEM 块：文本中应包含 -----BEGIN ...----- 与 -----END ...----- 行。'
    return
  }
  blocks.value = labels.map(label => ({ label, type: detectType(label) }))

  // 优先解析第一个证书块
  const certMatch = text.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/)
  if (certMatch) {
    parsing.value = true
    try {
      // 动态加载 node-forge，避免增大首屏体积
      const mod = await import('node-forge')
      const forge = mod.default && mod.default.pki ? mod.default : mod
      const cert = forge.pki.certificateFromPem(certMatch[0])

      // 指纹：对证书 DER 编码计算 SHA-1 / SHA-256
      const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
      const md1 = forge.md.sha1.create()
      md1.update(der)
      const md256 = forge.md.sha256.create()
      md256.update(der)

      // 有效期
      const now = Date.now()
      const notBefore = cert.validity.notBefore
      const notAfter = cert.validity.notAfter
      const expired = notAfter.getTime() < now
      const notYetValid = !expired && notBefore.getTime() > now

      // SAN
      let san = null
      try {
        const sanExt = cert.getExtension({ name: 'subjectAltName' })
        if (sanExt && sanExt.altNames && sanExt.altNames.length) {
          san = sanExt.altNames.map(a => {
            if (a.type === 7) {
              try {
                const ip = forge.util.bytesToIP(a.ip)
                return Array.isArray(ip) ? ip.join('.') : String(ip)
              } catch (e) { return a.ip }
            }
            return String(a.value ?? a.ip ?? '')
          })
        }
      } catch (e) { san = null }

      // 密钥算法与位数
      let keyAlgo = '未知'
      let keyBits = null
      const pk = cert.publicKey
      if (pk) {
        if (pk.n && typeof pk.n.bitLength === 'function') {
          keyAlgo = 'RSA'
          keyBits = pk.n.bitLength()
        } else if (pk.type === 'ed25519') {
          keyAlgo = 'Ed25519'
        } else {
          keyAlgo = 'ECDSA / 其他'
        }
      }

      // 签名算法
      let signature = ''
      try {
        signature = forge.pki.oids[cert.signatureOid] || cert.signatureOid || ''
      } catch (e) { signature = '' }

      result.value = {
        kind: 'cert',
        version: 'X.509 v' + (cert.version + 1),
        signature,
        serial: String(cert.serialNumber || '').toUpperCase(),
        subject: readFields(cert.subject),
        issuer: readFields(cert.issuer),
        notBefore,
        notAfter,
        expired,
        notYetValid,
        daysLeft: Math.ceil((notAfter.getTime() - now) / 86400000),
        daysOver: Math.floor((now - notAfter.getTime()) / 86400000),
        sha1: formatHex(md1.digest().toHex()),
        sha256: formatHex(md256.digest().toHex()),
        san,
        keyAlgo,
        keyBits
      }
    } catch (err) {
      parseError.value = '证书解析失败：请确认 BEGIN/END 之间是完整的 Base64 证书数据，且为受支持的证书格式。'
    } finally {
      parsing.value = false
    }
    return
  }

  // 非证书块：仅类型识别
  result.value = { kind: blocks.value[0].type }
}

// ---------- 文件 ----------
const triggerFileSelect = () => fileInput.value?.click()

const handleFileChange = async (e) => {
  const selected = e.target.files?.[0]
  if (selected) {
    inputFileName.value = selected.name
    pemText.value = await selected.text()
    parsePem()
  }
  e.target.value = ''
}

const handleDrop = async (e) => {
  isDragging.value = false
  const dropped = e.dataTransfer?.files?.[0]
  if (dropped) {
    inputFileName.value = dropped.name
    pemText.value = await dropped.text()
    parsePem()
  }
}
</script>
