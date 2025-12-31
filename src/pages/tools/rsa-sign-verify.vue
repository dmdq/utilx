<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">RSA签名与验签工具</h1>
      <p class="text-muted-foreground max-w-3xl">
        在线RSA数字签名生成和验证工具，支持PKCS#1 v1.5和PSS两种填充模式。
        使用私钥对数据进行签名，公钥验证签名完整性，确保数据来源可信且未被篡改。
      </p>
    </div>

    <!-- 标签页切换 -->
    <div class="border-b border-border mb-6">
      <div class="flex gap-6">
        <button
          @click="activeTab = 'sign'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'sign'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          签名
        </button>
        <button
          @click="activeTab = 'verify'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'verify'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          验签
        </button>
        <button
          @click="activeTab = 'keygen'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'keygen'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          密钥生成
        </button>
      </div>
    </div>

    <!-- 签名面板 -->
    <div v-show="activeTab === 'sign'" class="space-y-6">
      <!-- 私钥输入 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">RSA私钥 (PEM格式)</label>
          <div class="flex gap-2">
            <button
              @click="loadSamplePrivateKey"
              class="px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/70 transition-colors"
            >
              加载示例
            </button>
            <button
              @click="clearPrivateKey"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          v-model="privateKeyInput"
          placeholder="-----BEGIN RSA PRIVATE KEY-----
或
-----BEGIN PRIVATE KEY-----"
          class="w-full h-32 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div v-if="privateKeyInfo" class="text-sm text-green-600">
          ✓ {{ privateKeyInfo }}
        </div>
      </div>

      <!-- 待签名数据 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">待签名数据</label>
          <button
            @click="clearMessage"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
        </div>
        <textarea
          v-model="messageInput"
          placeholder="请输入要签名的数据..."
          class="w-full h-32 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- 签名配置 -->
      <div class="p-4 border border-border rounded-lg bg-muted/30">
        <h3 class="font-semibold mb-4">签名配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 哈希算法 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">哈希算法</label>
            <select
              v-model="signHashAlgorithm"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="SHA-1">SHA-1 (不推荐)</option>
              <option value="SHA-256">SHA-256 (推荐)</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-512">SHA-512</option>
            </select>
          </div>

          <!-- 填充模式 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">填充模式</label>
            <select
              v-model="signPadding"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="PKCS1-v1_5">PKCS#1 v1.5</option>
              <option value="PSS">PSS (推荐)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 签名按钮 -->
      <div class="flex gap-4">
        <button
          @click="generateSignature"
          :disabled="!privateKeyInput || !messageInput || isSigning"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSigning ? '签名中...' : '生成签名' }}
        </button>
      </div>

      <!-- 签名结果 -->
      <div v-if="signatureResult" class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">签名结果</label>
          <div class="flex gap-2">
            <select
              v-model="signatureFormat"
              @change="convertSignatureFormat"
              class="px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="hex">Hex格式</option>
              <option value="base64">Base64格式</option>
            </select>
            <button
              @click="copyToClipboard(signatureResult)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              {{ copyButtonText }}
            </button>
          </div>
        </div>
        <div class="w-full p-4 border border-border rounded-lg bg-muted/50">
          <div class="font-mono text-sm break-all">
            {{ signatureResult }}
          </div>
        </div>

        <!-- 签名信息 -->
        <div class="p-4 border border-border rounded-lg bg-muted/30">
          <h4 class="font-semibold text-sm mb-2">签名信息</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span class="text-muted-foreground">算法:</span>
              <span class="ml-2 font-mono">{{ signHashAlgorithm.replace('-', '') }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">填充:</span>
              <span class="ml-2 font-mono">{{ signPadding }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">长度:</span>
              <span class="ml-2 font-mono">{{ signatureResult.length }} 字符</span>
            </div>
            <div>
              <span class="text-muted-foreground">原始:</span>
              <span class="ml-2 font-mono">{{ (signatureResult.length / 2).toFixed(0) }} 字节</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 验签面板 -->
    <div v-show="activeTab === 'verify'" class="space-y-6">
      <!-- 公钥输入 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">RSA公钥 (PEM格式)</label>
          <div class="flex gap-2">
            <button
              @click="loadSamplePublicKey"
              class="px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/70 transition-colors"
            >
              加载示例
            </button>
            <button
              @click="clearPublicKey"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          v-model="publicKeyInput"
          placeholder="-----BEGIN PUBLIC KEY-----"
          class="w-full h-32 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div v-if="publicKeyInfo" class="text-sm text-green-600">
          ✓ {{ publicKeyInfo }}
        </div>
      </div>

      <!-- 原始数据 -->
      <div class="space-y-4">
        <label class="text-lg font-semibold">原始数据</label>
        <textarea
          v-model="verifyMessageInput"
          placeholder="请输入原始数据..."
          class="w-full h-24 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- 签名值 -->
      <div class="space-y-4">
        <label class="text-lg font-semibold">签名值</label>
        <textarea
          v-model="verifySignatureInput"
          placeholder="请输入签名值（Hex或Base64格式）..."
          class="w-full h-24 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
      </div>

      <!-- 验签配置 -->
      <div class="p-4 border border-border rounded-lg bg-muted/30">
        <h3 class="font-semibold mb-4">验签配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">哈希算法</label>
            <select
              v-model="verifyHashAlgorithm"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="SHA-1">SHA-1</option>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-512">SHA-512</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">填充模式</label>
            <select
              v-model="verifyPadding"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="PKCS1-v1_5">PKCS#1 v1.5</option>
              <option value="PSS">PSS</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 验签按钮 -->
      <div class="flex gap-4">
        <button
          @click="verifySignature"
          :disabled="!publicKeyInput || !verifyMessageInput || !verifySignatureInput || isVerifying"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isVerifying ? '验签中...' : '验证签名' }}
        </button>
      </div>

      <!-- 验签结果 -->
      <div v-if="verificationResult !== null" class="p-6 border border-border rounded-lg" :class="verificationResult ? 'bg-green-500/10' : 'bg-red-500/10'">
        <div class="flex items-center gap-4">
          <div class="text-4xl">
            {{ verificationResult ? '✅' : '❌' }}
          </div>
          <div>
            <h3 class="text-lg font-semibold" :class="verificationResult ? 'text-green-600' : 'text-red-600'">
              {{ verificationResult ? '签名验证成功！' : '签名验证失败！' }}
            </h3>
            <p class="text-sm text-muted-foreground mt-1">
              {{ verificationResult
                ? '该签名有效，数据来源可信且未被篡改'
                : '该签名无效，数据可能被篡改或签名不匹配'
              }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 密钥生成面板 -->
    <div v-show="activeTab === 'keygen'" class="space-y-6">
      <!-- 密钥配置 -->
      <div class="p-4 border border-border rounded-lg bg-muted/30">
        <h3 class="font-semibold mb-4">密钥配置</h3>
        <div class="space-y-4">
          <!-- 密钥长度 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">密钥长度 (位)</label>
              <span class="text-xs text-muted-foreground">{{ keyLength }} bits</span>
            </div>
            <input
              v-model.number="keyLength"
              type="range"
              min="1024"
              max="4096"
              step="1024"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="len in [1024, 2048, 3072, 4096]"
                :key="len"
                @click="keyLength = len"
                :class="[
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  keyLength === len
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                ]"
              >
                {{ len }} bit
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ keyLength === 1024 ? '⚠️ 1024位已不建议使用，推荐2048位或以上' : keyLength >= 2048 ? '✓ 推荐使用' : '' }}
            </p>
          </div>

          <!-- 密钥格式 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">密钥格式</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="keyFormat"
                  type="radio"
                  value="pkcs8"
                  class="text-primary focus:ring-2 focus:ring-primary"
                >
                <span class="text-sm">PKCS#8 (推荐)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="keyFormat"
                  type="radio"
                  value="pkcs1"
                  class="text-primary focus:ring-2 focus:ring-primary"
                >
                <span class="text-sm">PKCS#1 (传统)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 生成按钮 -->
      <div class="flex gap-4">
        <button
          @click="generateKeyPair"
          :disabled="isGenerating"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isGenerating ? '生成中...' : '生成密钥对' }}
        </button>
        <button
          v-if="generatedPublicKey && generatedPrivateKey"
          @click="downloadKeyPair"
          class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          下载密钥对
        </button>
      </div>

      <!-- 生成结果 -->
      <div v-if="generatedPublicKey || generatedPrivateKey" class="space-y-4">
        <!-- 公钥 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-lg font-semibold">公钥 (Public Key)</label>
            <button
              @click="copyToClipboard(generatedPublicKey)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              复制
            </button>
          </div>
          <div class="p-4 border border-border rounded-lg bg-muted/50 max-h-64 overflow-y-auto">
            <pre class="font-mono text-xs">{{ generatedPublicKey }}</pre>
          </div>
        </div>

        <!-- 私钥 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-lg font-semibold">私钥 (Private Key)</label>
            <div class="flex gap-2">
              <button
                @click="togglePrivateKeyVisibility"
                class="px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/70 transition-colors"
              >
                {{ showPrivateKey ? '隐藏' : '显示' }}
              </button>
              <button
                @click="copyToClipboard(generatedPrivateKey)"
                class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                复制
              </button>
            </div>
          </div>
          <div class="p-4 border border-border rounded-lg bg-muted/50 max-h-64 overflow-y-auto">
            <pre v-if="showPrivateKey" class="font-mono text-xs">{{ generatedPrivateKey }}</pre>
            <div v-else class="text-center text-muted-foreground py-8">
              🔒 私钥已隐藏，点击上方"显示"按钮查看
            </div>
          </div>
          <p class="text-xs text-red-600">⚠️ 请妥善保管私钥，不要泄露给他人！</p>
        </div>
      </div>
    </div>

    <!-- RSA签名说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于RSA数字签名</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-primary mb-2">数字签名原理</h4>
          <ul class="space-y-1 text-sm">
            <li>• 发送方用私钥对数据哈希进行签名</li>
            <li>• 接收方用公钥验证签名</li>
            <li>• 确保数据来源可信（身份认证）</li>
            <li>• 确保数据未被篡改（完整性）</li>
            <li>• 发送方无法否认签名（不可抵赖）</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">填充模式对比</h4>
          <ul class="space-y-1 text-sm">
            <li>• <strong>PKCS#1 v1.5</strong>: 传统格式，兼容性好</li>
            <li>• <strong>PSS</strong>: 更安全的概率签名方案</li>
            <li>• PSS包含随机盐值，相同输入签名不同</li>
            <li>• 新应用推荐使用PSS模式</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 典型应用 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">典型应用场景</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">📜 代码签名</h4>
          <p class="text-sm text-muted-foreground">软件、驱动程序、脚本数字签名，验证发布者身份</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">🔐 SSL/TLS证书</h4>
          <p class="text-sm text-muted-foreground">网站HTTPS证书，CA机构使用RSA签名颁发证书</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">📝 电子合同</h4>
          <p class="text-sm text-muted-foreground">电子文档、合同签名，具有法律效力</p>
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
import { ref, computed } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'

const category = categories.find(c => c.id === 'crypto')

// 标签页
const activeTab = ref('sign')

// 签名相关
const privateKeyInput = ref('')
const messageInput = ref('')
const signHashAlgorithm = ref('SHA-256')
const signPadding = ref('PSS')
const signatureResult = ref('')
const signatureFormat = ref('hex')
const isSigning = ref(false)
const privateKeyInfo = ref('')

// 验签相关
const publicKeyInput = ref('')
const verifyMessageInput = ref('')
const verifySignatureInput = ref('')
const verifyHashAlgorithm = ref('SHA-256')
const verifyPadding = ref('PSS')
const verificationResult = ref(null)
const isVerifying = ref(false)
const publicKeyInfo = ref('')

// 密钥生成相关
const keyLength = ref(2048)
const keyFormat = ref('pkcs8')
const generatedPublicKey = ref('')
const generatedPrivateKey = ref('')
const showPrivateKey = ref(false)
const isGenerating = ref(false)

const copyButtonText = ref('复制')

// 示例密钥（用于测试）
const samplePublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyKf7KmFm1CywFZtJ8qV
iXHO9KvMJBjJMnOZDXwPVjK4KXaVqKP4aJNjYZKNxZC8J6KVBvVRCMYxZN4CJd7kq
W4OZhLGBxVYdOYbzQLkJPYxMYHxNKDYPpJJGFVZKRENGvPeRL/JfpvHhMwM6Pw5L
3gXFFmXLF0DHJKRRmGVfJYaOPEjvKU9FZJRlD5o8BNlJYPPTFQ5jFGLP3vRLYdQUY
KZJ7HkPZjQ6hBCYPqgVJx8GJVxKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKY
KQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJ
h8GfYKYKQJZ8ZJVYKwIDAQAB
-----END PUBLIC KEY-----`

const samplePrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDIP8qzP7bNQ1Q
ZKL9YZJnHqN9YFZMyRj8QKXpJ7VqEH2vZPJ8YKx0ZQJ8ZJVYKwYbBQYJh8GfYKYK
QJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh
8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKw
YbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8
ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYK
YKQJZ8ZJVYKwIDAQABAoIBADQC2K9v3J8qVpH2PqN7vFJjPY3KvL9RZJqQKXpJ7Vq
EH2vZPJ8YKx0ZQJ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVY
KwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJ
Z8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfY
KYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQY
Jh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYK
wYbBQYJh8ECgYEA/4K2vZPJ8YKx0ZQJ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJ
h8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwY
bBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8Z
JVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYK
QJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8G
fYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQ
YJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYK
wYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8Z
JVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYK
QJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8G
fYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQY
Jh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYK
wYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8Z
JVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYK
QJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8G
fYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQY
Jh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKwYbBQYJh8GfYKYKQJZ8ZJVYKw
-----END PRIVATE KEY-----`

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'rsa-sign-verify'
  ).slice(0, 4)
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}

// PEM格式转ArrayBuffer
const pemToArrayBuffer = (pem) => {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ArrayBuffer转Hex
const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

// Hex转ArrayBuffer
const hexToArrayBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes.buffer
}

// Base64转ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// 生成签名
const generateSignature = async () => {
  if (!privateKeyInput.value || !messageInput.value) return

  isSigning.value = true

  try {
    const privateKeyBuffer = pemToArrayBuffer(privateKeyInput.value)

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: signHashAlgorithm.value },
      false,
      ['sign']
    )

    const messageBuffer = new TextEncoder().encode(messageInput.value)

    const algorithm = signPadding.value === 'PSS'
      ? { name: 'RSA-PSS', saltLength: 32 }
      : { name: 'RSASSA-PKCS1-v1_5' }

    const signature = await crypto.subtle.sign(
      algorithm,
      privateKey,
      messageBuffer
    )

    signatureResult.value = arrayBufferToHex(signature)
    privateKeyInfo.value = '私钥加载成功'
  } catch (error) {
    console.error('签名失败:', error)
    privateKeyInfo.value = '错误: ' + error.message
  } finally {
    isSigning.value = false
  }
}

// 验证签名
const verifySignature = async () => {
  if (!publicKeyInput.value || !verifyMessageInput.value || !verifySignatureInput.value) return

  isVerifying.value = true

  try {
    const publicKeyBuffer = pemToArrayBuffer(publicKeyInput.value)

    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: verifyHashAlgorithm.value },
      false,
      ['verify']
    )

    const messageBuffer = new TextEncoder().encode(verifyMessageInput.value)

    // 尝试解析签名
    let signatureBuffer
    try {
      signatureBuffer = hexToArrayBuffer(verifySignatureInput.value.trim())
    } catch {
      try {
        signatureBuffer = base64ToArrayBuffer(verifySignatureInput.value.trim())
      } catch {
        throw new Error('无效的签名格式')
      }
    }

    const algorithm = verifyPadding.value === 'PSS'
      ? { name: 'RSA-PSS', saltLength: 32 }
      : { name: 'RSASSA-PKCS1-v1_5' }

    const isValid = await crypto.subtle.verify(
      algorithm,
      publicKey,
      signatureBuffer,
      messageBuffer
    )

    verificationResult.value = isValid
    publicKeyInfo.value = '公钥加载成功'
  } catch (error) {
    console.error('验签失败:', error)
    verificationResult.value = false
    publicKeyInfo.value = '错误: ' + error.message
  } finally {
    isVerifying.value = false
  }
}

// 生成密钥对
const generateKeyPair = async () => {
  isGenerating.value = true

  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: keyLength.value,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    )

    const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    const publicKeyPem = spkiToPem(publicKeySpki)
    const privateKeyPem = pkcs8ToPem(privateKeyPkcs8)

    generatedPublicKey.value = publicKeyPem
    generatedPrivateKey.value = privateKeyPem
  } catch (error) {
    console.error('密钥生成失败:', error)
    alert('密钥生成失败: ' + error.message)
  } finally {
    isGenerating.value = false
  }
}

// SPKI转PEM
const spkiToPem = (spki) => {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(spki)))
  let pem = '-----BEGIN PUBLIC KEY-----\n'
  for (let i = 0; i < b64.length; i += 64) {
    pem += b64.slice(i, i + 64) + '\n'
  }
  pem += '-----END PUBLIC KEY-----'
  return pem
}

// PKCS8转PEM
const pkcs8ToPem = (pkcs8) => {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)))
  let pem = '-----BEGIN PRIVATE KEY-----\n'
  for (let i = 0; i < b64.length; i += 64) {
    pem += b64.slice(i, i + 64) + '\n'
  }
  pem += '-----END PRIVATE KEY-----'
  return pem
}

// 下载密钥对
const downloadKeyPair = () => {
  // 下载公钥
  const publicBlob = new Blob([generatedPublicKey.value], { type: 'text/plain' })
  const publicUrl = URL.createObjectURL(publicBlob)
  const a = document.createElement('a')
  a.href = publicUrl
  a.download = 'public-key.pem'
  a.click()
  URL.revokeObjectURL(publicUrl)

  // 下载私钥
  const privateBlob = new Blob([generatedPrivateKey.value], { type: 'text/plain' })
  const privateUrl = URL.createObjectURL(privateBlob)
  const b = document.createElement('a')
  b.href = privateUrl
  b.download = 'private-key.pem'
  b.click()
  URL.revokeObjectURL(privateUrl)
}

// 切换私钥显示
const togglePrivateKeyVisibility = () => {
  showPrivateKey.value = !showPrivateKey.value
}

// 加载示例密钥
const loadSamplePrivateKey = () => {
  privateKeyInput.value = samplePrivateKey
}

const loadSamplePublicKey = () => {
  publicKeyInput.value = samplePublicKey
}

// 清空函数
const clearPrivateKey = () => {
  privateKeyInput.value = ''
  privateKeyInfo.value = ''
  signatureResult.value = ''
}

const clearPublicKey = () => {
  publicKeyInput.value = ''
  publicKeyInfo.value = ''
  verificationResult.value = null
}

const clearMessage = () => {
  messageInput.value = ''
}

// 转换签名格式
const convertSignatureFormat = () => {
  if (!signatureResult.value) return

  try {
    if (signatureFormat.value === 'base64') {
      const buffer = hexToArrayBuffer(signatureResult.value)
      const binary = String.fromCharCode(...new Uint8Array(buffer))
      signatureResult.value = btoa(binary)
    } else {
      const buffer = base64ToArrayBuffer(signatureResult.value)
      signatureResult.value = arrayBufferToHex(buffer)
    }
  } catch (error) {
    console.error('格式转换失败:', error)
  }
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

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('rsa-sign-verify')

// SEO配置
useSeoMeta({
  title: 'RSA签名验签工具 - 在线RSA数字签名生成验证',
  description: '免费在线RSA数字签名工具，支持PKCS#1 v1.5和PSS填充模式，SHA-1/256/384/512哈希算法，RSA密钥生成和签名验证。',
  keywords: ['RSA签名', 'RSA验签', '数字签名', 'PKCS#1', 'PSS', 'SHA-256', 'RSA密钥生成']
})
</script>
