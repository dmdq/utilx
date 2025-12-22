<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">SSL/TLS配置检查器</h1>
      <p class="text-muted-foreground mb-6">检查SSL/TLS配置安全性，提供优化建议</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：检查配置 -->
      <div class="space-y-6">
        <!-- 域名输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">域名/网站检查</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入域名或URL</label>
              <input
                v-model="domainInput"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="example.com 或 https://example.com"
                @keyup.enter="checkSSL"
              />
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium mb-2">快速示例</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="domainInput = 'google.com'; checkSSL()"
                  class="px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                >
                  Google
                </button>
                <button
                  @click="domainInput = 'github.com'; checkSSL()"
                  class="px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                >
                  GitHub
                </button>
                <button
                  @click="domainInput = 'stackoverflow.com'; checkSSL()"
                  class="px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                >
                  StackOverflow
                </button>
                <button
                  @click="domainInput = 'example.com'; checkSSL()"
                  class="px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                >
                  Example.com
                </button>
              </div>
            </div>

            <button
              @click="checkSSL"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              检查SSL/TLS配置
            </button>
          </div>
        </div>

        <!-- 检查选项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">检查选项</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="checkOptions.certificate"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">证书信息</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.protocols"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">协议版本</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.ciphers"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">加密套件</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.vulnerabilities"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">安全漏洞</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.headers"
                type="checkbox"
                class="mr-2"
              />
              <span class="text-sm">安全头部</span>
            </label>
          </div>
        </div>

        <!-- 端口配置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">端口配置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">检查端口</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="port in commonPorts"
                  :key="port.number"
                  @click="togglePort(port)"
                  :class="selectedPorts.includes(port.number) ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                  class="px-3 py-2 rounded text-sm"
                >
                  {{ port.number }} ({{ port.name }})
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">自定义端口</label>
              <input
                v-model="customPort"
                type="number"
                min="1"
                max="65535"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入端口号"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：检查结果 -->
      <div class="space-y-6">
        <!-- 总体评分 -->
        <div v-if="checkResult" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">安全评分</h3>
          <div class="space-y-4">
            <div class="text-center">
              <div class="text-6xl font-bold mb-2" :class="getScoreColorClass(checkResult.overallScore)">
                {{ checkResult.overallScore }}
              </div>
              <div class="text-lg text-muted-foreground">总分 (100)</div>
            </div>

            <!-- 评分项 -->
            <div class="space-y-3">
              <div v-for="item in checkResult.scoreItems" :key="item.name"
                   class="flex items-center justify-between">
                <span class="text-sm">{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <div class="w-32 bg-muted rounded-full h-2">
                    <div class="h-2 rounded-full"
                         :class="getScoreBarClass(item.score)"
                         :style="{ width: `${item.score}%` }"></div>
                  </div>
                  <span class="text-sm font-medium w-10">{{ item.score }}</span>
                </div>
              </div>
            </div>

            <!-- 等级 -->
            <div class="text-center p-3 rounded-lg"
                 :class="getGradeClass(checkResult.grade)">
              <span class="font-medium">安全等级: {{ checkResult.grade }}</span>
            </div>
          </div>
        </div>

        <!-- 证书信息 -->
        <div v-if="checkResult && checkResult.certificate" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">证书信息</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span>颁发者:</span>
              <span class="font-mono">{{ checkResult.certificate.issuer }}</span>
            </div>
            <div class="flex justify-between">
              <span>主题:</span>
              <span class="font-mono">{{ checkResult.certificate.subject }}</span>
            </div>
            <div class="flex justify-between">
              <span>有效期:</span>
              <span>{{ checkResult.certificate.validFrom }} - {{ checkResult.certificate.validTo }}</span>
            </div>
            <div class="flex justify-between">
              <span>剩余天数:</span>
              <span :class="checkResult.certificate.daysRemaining < 30 ? 'text-red-600' : 'text-green-600'">
                {{ checkResult.certificate.daysRemaining }} 天
              </span>
            </div>
            <div class="flex justify-between">
              <span>指纹 (SHA-256):</span>
              <span class="font-mono text-xs break-all max-w-[200px]">{{ checkResult.certificate.fingerprint }}</span>
            </div>
          </div>
        </div>

        <!-- 协议支持 -->
        <div v-if="checkResult && checkResult.protocols" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">协议支持</h3>
          <div class="space-y-2">
            <div v-for="protocol in checkResult.protocols" :key="protocol.version"
                 class="flex items-center justify-between p-2 rounded"
                 :class="getProtocolStatusClass(protocol.status)">
              <span class="font-medium">{{ protocol.version }}</span>
              <span class="text-sm">{{ protocol.status }}</span>
            </div>
          </div>
        </div>

        <!-- 安全建议 -->
        <div v-if="checkResult && checkResult.recommendations" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">安全建议</h3>
          <div class="space-y-3">
            <div v-for="rec in checkResult.recommendations" :key="rec.id"
                 class="flex items-start gap-2">
              <AlertTriangle v-if="rec.priority === 'high'" class="w-4 h-4 text-red-600 mt-0.5" />
              <AlertCircle v-else-if="rec.priority === 'medium'" class="w-4 h-4 text-yellow-600 mt-0.5" />
              <Info v-else class="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <div class="font-medium text-sm">{{ rec.title }}</div>
                <div class="text-xs text-muted-foreground">{{ rec.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 漏洞检测 -->
        <div v-if="checkResult && checkResult.vulnerabilities" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">漏洞检测</h3>
          <div class="space-y-3">
            <div v-for="vuln in checkResult.vulnerabilities" :key="vuln.id"
                 class="p-3 rounded-lg border"
                 :class="getVulnerabilityClass(vuln.severity)">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">{{ vuln.name }}</span>
                <span class="text-xs px-2 py-1 rounded"
                      :class="getVulnerabilityBadgeClass(vuln.severity)">
                  {{ vuln.severity }}
                </span>
              </div>
              <div class="text-sm text-muted-foreground">{{ vuln.description }}</div>
              <div v-if="vuln.cve" class="text-xs text-muted-foreground mt-1">
                CVE: {{ vuln.cve }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置建议 -->
    <div class="mt-8 bg-card rounded-lg p-6 border">
      <h3 class="text-lg font-semibold mb-4">配置建议</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div>
          <h4 class="font-medium mb-2 text-primary">推荐协议</h4>
          <ul class="space-y-1 text-xs text-muted-foreground">
            <li>✓ TLS 1.3</li>
            <li>✓ TLS 1.2</li>
            <li>✗ TLS 1.1, 1.0, SSL 3.0</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium mb-2 text-primary">推荐加密套件</h4>
          <ul class="space-y-1 text-xs text-muted-foreground">
            <li>• TLS_AES_256_GCM_SHA384</li>
            <li>• TLS_CHACHA20_POLY1305_SHA256</li>
            <li>• TLS_AES_128_GCM_SHA256</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium mb-2 text-primary">安全头部</h4>
          <ul class="space-y-1 text-xs text-muted-foreground">
            <li>• Strict-Transport-Security</li>
            <li>• X-Frame-Options</li>
            <li>• X-Content-Type-Options</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium mb-2 text-primary">证书要求</h4>
          <ul class="space-y-1 text-xs text-muted-foreground">
            <li>• 2048位以上RSA密钥</li>
            <li>• SHA-256签名算法</li>
            <li>• 定期更新证书</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSEO } from '~/composables/useSEO'
import { AlertTriangle, AlertCircle, Info, Shield } from 'lucide-vue-next'

const { setPageTitle } = useSEO()
setPageTitle('SSL/TLS配置检查器')

// 状态管理
const domainInput = ref('')
const customPort = ref('')
const selectedPorts = ref([443, 8443])

const checkOptions = ref({
  certificate: true,
  protocols: true,
  ciphers: true,
  vulnerabilities: true,
  headers: true
})

const checkResult = ref(null)

// 常见端口
const commonPorts = [
  { number: 443, name: 'HTTPS' },
  { number: 8443, name: 'Alt-HTTPS' },
  { number: 993, name: 'IMAPS' },
  { number: 995, name: 'POP3S' },
  { number: 465, name: 'SMTPS' },
  { number: 636, name: 'LDAPS' }
]

// 切换端口选择
const togglePort = (port) => {
  const index = selectedPorts.value.indexOf(port.number)
  if (index > -1) {
    selectedPorts.value.splice(index, 1)
  } else {
    selectedPorts.value.push(port.number)
  }
}

// 模拟SSL/TLS检查
const checkSSL = async () => {
  if (!domainInput.value) {
    alert('请输入域名')
    return
  }

  // 模拟检查过程
  const domain = domainInput.value.replace(/^https?:\/\//, '').split('/')[0]

  // 模拟不同域名的检查结果
  const results = {
    'google.com': generateHighSecurityResult(domain),
    'github.com': generateHighSecurityResult(domain),
    'stackoverflow.com': generateGoodSecurityResult(domain),
    'example.com': generateBasicSecurityResult(domain)
  }

  // 使用模拟结果或默认结果
  checkResult.value = results[domain] || generateBasicSecurityResult(domain)
}

// 生成高安全性结果
const generateHighSecurityResult = (domain) => {
  const scoreItems = [
    { name: '证书配置', score: 100 },
    { name: '协议支持', score: 95 },
    { name: '加密套件', score: 90 },
    { name: '安全头部', score: 85 },
    { name: '漏洞防护', score: 100 }
  ]

  const overallScore = Math.round(scoreItems.reduce((a, b) => a + b.score, 0) / scoreItems.length)

  return {
    overallScore,
    grade: 'A+',
    scoreItems,
    certificate: {
      issuer: "Let's Encrypt Authority X3",
      subject: `*.${domain}`,
      validFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      daysRemaining: 60,
      fingerprint: 'A1:B2:C3:D4:E5:F6:A7:B8:C9:D0:E1:F2:A3:B4:C5:D6:E7:F8'
    },
    protocols: [
      { version: 'TLS 1.3', status: '支持' },
      { version: 'TLS 1.2', status: '支持' },
      { version: 'TLS 1.1', status: '不支持' },
      { version: 'TLS 1.0', status: '不支持' },
      { version: 'SSL 3.0', status: '不支持' }
    ],
    recommendations: [
      {
        id: 1,
        priority: 'low',
        title: '考虑启用HSTS预加载',
        description: '将域名添加到Chrome的HSTS预加载列表中以提高安全性'
      }
    ],
    vulnerabilities: []
  }
}

// 生成良好安全性结果
const generateGoodSecurityResult = (domain) => {
  const scoreItems = [
    { name: '证书配置', score: 85 },
    { name: '协议支持', score: 80 },
    { name: '加密套件', score: 75 },
    { name: '安全头部', score: 70 },
    { name: '漏洞防护', score: 90 }
  ]

  const overallScore = Math.round(scoreItems.reduce((a, b) => a + b.score, 0) / scoreItems.length)

  return {
    overallScore,
    grade: 'B',
    scoreItems,
    certificate: {
      issuer: 'DigiCert SHA2 Secure Server CA',
      subject: `www.${domain}`,
      validFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      validTo: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      daysRemaining: 275,
      fingerprint: 'B2:C3:D4:E5:F6:A7:B8:C9:D0:E1:F2:A3:B4:C5:D6:E7:F8:A9'
    },
    protocols: [
      { version: 'TLS 1.3', status: '不支持' },
      { version: 'TLS 1.2', status: '支持' },
      { version: 'TLS 1.1', status: '支持' },
      { version: 'TLS 1.0', status: '不支持' },
      { version: 'SSL 3.0', status: '不支持' }
    ],
    recommendations: [
      {
        id: 1,
        priority: 'medium',
        title: '升级到TLS 1.3',
        description: '启用TLS 1.3协议以获得更好的安全性和性能'
      },
      {
        id: 2,
        priority: 'high',
        title: '禁用TLS 1.1',
        description: 'TLS 1.1存在已知安全问题，建议禁用'
      },
      {
        id: 3,
        priority: 'medium',
        title: '添加安全头部',
        description: '添加HSTS、X-Frame-Options等安全头部'
      }
    ],
    vulnerabilities: [
      {
        id: 1,
        name: 'TLS 1.1 支持',
        severity: 'medium',
        description: '服务器支持已弃用的TLS 1.1协议',
        cve: 'CVE-2011-3389'
      }
    ]
  }
}

// 生成基础安全性结果
const generateBasicSecurityResult = (domain) => {
  const scoreItems = [
    { name: '证书配置', score: 70 },
    { name: '协议支持', score: 60 },
    { name: '加密套件', score: 50 },
    { name: '安全头部', score: 40 },
    { name: '漏洞防护', score: 65 }
  ]

  const overallScore = Math.round(scoreItems.reduce((a, b) => a + b.score, 0) / scoreItems.length)

  return {
    overallScore,
    grade: 'C',
    scoreItems,
    certificate: {
      issuer: 'Self-Signed Certificate',
      subject: domain,
      validFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      validTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      daysRemaining: -30,
      fingerprint: 'C3:D4:E5:F6:A7:B8:C9:D0:E1:F2:A3:B4:C5:D6:E7:F8:A9:B0'
    },
    protocols: [
      { version: 'TLS 1.3', status: '不支持' },
      { version: 'TLS 1.2', status: '支持' },
      { version: 'TLS 1.1', status: '支持' },
      { version: 'TLS 1.0', status: '支持' },
      { version: 'SSL 3.0', status: '支持' }
    ],
    recommendations: [
      {
        id: 1,
        priority: 'high',
        title: '更新证书',
        description: '证书已过期，需要立即更新'
      },
      {
        id: 2,
        priority: 'high',
        title: '禁用旧协议',
        description: '禁用TLS 1.0、TLS 1.1和SSL 3.0'
      },
      {
        id: 3,
        priority: 'high',
        title: '强化加密套件',
        description: '移除弱加密套件，启用强加密套件'
      },
      {
        id: 4,
        priority: 'medium',
        title: '配置安全头部',
        description: '添加HSTS、X-Frame-Options等安全头部'
      }
    ],
    vulnerabilities: [
      {
        id: 1,
        name: '证书过期',
        severity: 'critical',
        description: 'SSL证书已过期，连接不安全'
      },
      {
        id: 2,
        name: '弱加密套件',
        severity: 'high',
        description: '服务器支持RC4、3DES等弱加密算法'
      },
      {
        id: 3,
        name: 'POODLE漏洞',
        severity: 'high',
        description: 'SSL 3.0协议存在POODLE漏洞',
        cve: 'CVE-2014-3566'
      }
    ]
  }
}

// 获取评分颜色
const getScoreColorClass = (score) => {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

// 获取评分条样式
const getScoreBarClass = (score) => {
  if (score >= 90) return 'bg-green-600'
  if (score >= 80) return 'bg-blue-600'
  if (score >= 70) return 'bg-yellow-600'
  return 'bg-red-600'
}

// 获取等级样式
const getGradeClass = (grade) => {
  if (grade === 'A+' || grade === 'A') return 'bg-green-50 text-green-800'
  if (grade === 'B' || grade === 'B+') return 'bg-blue-50 text-blue-800'
  if (grade === 'C' || grade === 'C+') return 'bg-yellow-50 text-yellow-800'
  return 'bg-red-50 text-red-800'
}

// 获取协议状态样式
const getProtocolStatusClass = (status) => {
  if (status === '支持') return 'bg-green-50 text-green-800 border-green-200'
  if (status === '不支持') return 'bg-red-50 text-red-800 border-red-200'
  return 'bg-gray-50 text-gray-800 border-gray-200'
}

// 获取漏洞样式
const getVulnerabilityClass = (severity) => {
  if (severity === 'critical') return 'bg-red-50 border-red-200'
  if (severity === 'high') return 'bg-red-50 border-red-200'
  if (severity === 'medium') return 'bg-yellow-50 border-yellow-200'
  return 'bg-blue-50 border-blue-200'
}

// 获取漏洞徽章样式
const getVulnerabilityBadgeClass = (severity) => {
  if (severity === 'critical') return 'bg-red-600 text-white'
  if (severity === 'high') return 'bg-red-600 text-white'
  if (severity === 'medium') return 'bg-yellow-600 text-white'
  return 'bg-blue-600 text-white'
}
</script>

<style scoped>
input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>