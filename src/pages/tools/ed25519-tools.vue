<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <div class="flex items-center gap-2 mb-2">
        <h1 class="text-3xl font-bold">Ed25519签名工具</h1>
        <span class="px-2 py-1 text-xs bg-blue-500/10 text-blue-600 rounded-md font-medium">
          现代化算法
        </span>
      </div>
      <p class="text-muted-foreground max-w-3xl">
        Ed25519是现代最先进的椭圆曲线签名算法之一，基于Curve25519和SHA-512。
        相比传统RSA和ECDSA，Ed25519提供更快的签名/验签速度、更小的签名尺寸，
        且设计简单避免了常见的陷阱，被SSH、Signal、Tor等广泛采用。
      </p>
    </div>

    <!-- 浏览器兼容性提示 -->
    <div class="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg mb-6">
      <div class="flex items-start gap-3">
        <span class="text-yellow-600 text-xl">⚠️</span>
        <div>
          <h4 class="font-semibold text-yellow-700 mb-1">浏览器兼容性提示</h4>
          <p class="text-sm text-yellow-700">
            Ed25519需要较新版本的浏览器支持（Chrome 108+, Firefox 115+, Safari 16.4+）。
            如果您的浏览器不支持，建议使用最新的Chrome或Firefox。
          </p>
        </div>
      </div>
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
        <button
          @click="activeTab = 'compare'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'compare'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          算法对比
        </button>
      </div>
    </div>

    <!-- 签名面板 -->
    <div v-show="activeTab === 'sign'" class="space-y-6">
      <!-- 私钥输入 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">Ed25519私钥 (Hex格式)</label>
          <div class="flex gap-2">
            <button
              @click="generateNewPrivateKey"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              生成新私钥
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
          placeholder="请输入32字节(64个十六进制字符)的Ed25519私钥..."
          class="w-full h-24 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div v-if="privateKeyInfo" class="text-sm" :class="privateKeyInfo.valid ? 'text-green-600' : 'text-red-600'">
          {{ privateKeyInfo.valid ? '✓' : '✗' }} {{ privateKeyInfo.message }}
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
          class="w-full h-24 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- 签名按钮 -->
      <div class="flex gap-4">
        <button
          @click="generateSignature"
          :disabled="!privateKeyInput || !messageInput || isSigning"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSigning ? '签名中...' : '生成Ed25519签名' }}
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
              class="px-3 py-1 text-sm border border-border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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
        <div class="p-4 border border-border rounded-lg bg-muted/50">
          <div class="font-mono text-sm break-all">{{ signatureResult }}</div>
        </div>

        <!-- 签名信息 -->
        <div class="p-4 border border-border rounded-lg bg-muted/30">
          <h4 class="font-semibold text-sm mb-2">签名信息</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span class="text-muted-foreground">算法:</span>
              <span class="ml-2 font-mono">Ed25519</span>
            </div>
            <div>
              <span class="text-muted-foreground">长度:</span>
              <span class="ml-2 font-mono">{{ signatureResult.length / 2 }} bytes</span>
            </div>
            <div>
              <span class="text-muted-foreground">格式:</span>
              <span class="ml-2 font-mono">{{ signatureFormat === 'hex' ? 'Hex' : 'Base64' }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">计算时间:</span>
              <span class="ml-2 font-mono">{{ calculationTime }} ms</span>
            </div>
          </div>
        </div>

        <!-- 衍生公钥 -->
        <div v-if="derivedPublicKey" class="space-y-2">
          <label class="text-sm font-medium">衍生公钥 (从私钥自动计算)</label>
          <div class="p-3 border border-border rounded-lg bg-muted/50">
            <div class="font-mono text-xs break-all">{{ derivedPublicKey }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 验签面板 -->
    <div v-show="activeTab === 'verify'" class="space-y-6">
      <!-- 公钥输入 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">Ed25519公钥 (Hex格式)</label>
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
          placeholder="请输入32字节(64个十六进制字符)的Ed25519公钥..."
          class="w-full h-24 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div v-if="publicKeyInfo" class="text-sm" :class="publicKeyInfo.valid ? 'text-green-600' : 'text-red-600'">
          {{ publicKeyInfo.valid ? '✓' : '✗' }} {{ publicKeyInfo.message }}
        </div>
      </div>

      <!-- 原始数据 -->
      <div class="space-y-4">
        <label class="text-lg font-semibold">原始数据</label>
        <textarea
          v-model="verifyMessageInput"
          placeholder="请输入原始数据..."
          class="w-full h-24 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- 签名值 -->
      <div class="space-y-4">
        <label class="text-lg font-semibold">签名值</label>
        <textarea
          v-model="verifySignatureInput"
          placeholder="请输入64字节(128个十六进制字符)的Ed25519签名..."
          class="w-full h-24 p-4 border border-border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div class="text-xs text-muted-foreground">
          支持 Hex 或 Base64 格式
        </div>
      </div>

      <!-- 验签按钮 -->
      <div class="flex gap-4">
        <button
          @click="verifySignature"
          :disabled="!publicKeyInput || !verifyMessageInput || !verifySignatureInput || isVerifying"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isVerifying ? '验签中...' : '验证Ed25519签名' }}
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
          <div class="flex items-center gap-4 p-3 bg-background rounded-lg">
            <input
              type="checkbox"
              v-model="generateKeypair"
              class="text-primary focus:ring-2 focus:ring-primary"
            >
            <label class="text-sm">生成完整的密钥对（公钥+私钥）</label>
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
          {{ isGenerating ? '生成中...' : '生成Ed25519密钥对' }}
        </button>
        <button
          v-if="generatedPrivateKey && generatedPublicKey"
          @click="downloadKeyPair"
          class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
        >
          下载密钥对
        </button>
      </div>

      <!-- 生成结果 -->
      <div v-if="generatedPrivateKey || generatedPublicKey" class="space-y-4">
        <!-- 私钥 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-lg font-semibold">私钥 (Seed - 32 bytes)</label>
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
          <div class="p-4 border border-border rounded-lg bg-muted/50">
            <pre v-if="showPrivateKey" class="font-mono text-xs break-all">{{ generatedPrivateKey }}</pre>
            <div v-else class="text-center text-muted-foreground py-8">
              🔒 私钥已隐藏，点击上方"显示"按钮查看
            </div>
          </div>
          <p class="text-xs text-red-600">⚠️ 请妥善保管私钥，不要泄露给他人！</p>
        </div>

        <!-- 公钥 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-lg font-semibold">公钥 (Public Key - 32 bytes)</label>
            <button
              @click="copyToClipboard(generatedPublicKey)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              复制
            </button>
          </div>
          <div class="p-4 border border-border rounded-lg bg-muted/50">
            <pre class="font-mono text-xs break-all">{{ generatedPublicKey }}</pre>
          </div>
        </div>

        <!-- SSH格式 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">SSH公钥格式 (用于~/.ssh/authorized_keys)</label>
          <div class="p-3 border border-border rounded-lg bg-muted/50">
            <div class="font-mono text-xs break-all">{{ sshPublicKeyFormat || '正在生成...' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 算法对比面板 -->
    <div v-show="activeTab === 'compare'" class="space-y-6">
      <!-- 性能对比表格 -->
      <div class="border border-border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="px-4 py-3 text-left">指标</th>
              <th class="px-4 py-3 text-center">Ed25519</th>
              <th class="px-4 py-3 text-center">ECDSA (P-256)</th>
              <th class="px-4 py-3 text-center">RSA-2048</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr>
              <td class="px-4 py-3 font-medium">私钥长度</td>
              <td class="px-4 py-3 text-center text-green-600 font-mono">32 bytes</td>
              <td class="px-4 py-3 text-center font-mono">32 bytes</td>
              <td class="px-4 py-3 text-center text-red-600 font-mono">256 bytes</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">公钥长度</td>
              <td class="px-4 py-3 text-center text-green-600 font-mono">32 bytes</td>
              <td class="px-4 py-3 text-center font-mono">64 bytes (未压缩)</td>
              <td class="px-4 py-3 text-center text-red-600 font-mono">256 bytes</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">签名长度</td>
              <td class="px-4 py-3 text-center text-green-600 font-mono">64 bytes</td>
              <td class="px-4 py-3 text-center font-mono">64-72 bytes</td>
              <td class="px-4 py-3 text-center text-red-600 font-mono">256 bytes</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">签名速度</td>
              <td class="px-4 py-3 text-center text-green-600">极快</td>
              <td class="px-4 py-3 text-center">快</td>
              <td class="px-4 py-3 text-center text-yellow-600">中等</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">验签速度</td>
              <td class="px-4 py-3 text-center text-green-600">极快</td>
              <td class="px-4 py-3 text-center">快</td>
              <td class="px-4 py-3 text-center text-green-600">快</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">防侧信道</td>
              <td class="px-4 py-3 text-center text-green-600">内置</td>
              <td class="px-4 py-3 text-center text-yellow-600">需小心实现</td>
              <td class="px-4 py-3 text-center text-yellow-600">需小心实现</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">随机数依赖</td>
              <td class="px-4 py-3 text-center text-green-600">单次</td>
              <td class="px-4 py-3 text-center text-red-600">每次签名</td>
              <td class="px-4 py-3 text-center text-yellow-600">需填充</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 安全性对比 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-3 text-green-600">Ed25519优势</h4>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-green-500">✓</span>
              <span>设计简洁，避免了ECDSA的复杂陷阱</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-500">✓</span>
              <span>所有签名都是确定性的，无需高质量随机数</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-500">✓</span>
              <span>内置侧信道攻击防护</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-500">✓</span>
              <span>签名不可伪造性有数学证明</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-green-500">✓</span>
              <span>批处理验证可大幅提升速度</span>
            </li>
          </ul>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-3 text-blue-600">典型应用</h4>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-blue-500">•</span>
              <span><strong>SSH协议</strong>: OpenSSH 6.5+默认使用Ed25519</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500">•</span>
              <span><strong>Signal messenger</strong>: 端到端加密</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500">•</span>
              <span><strong>Tor网络</strong>: 匿名服务密钥</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500">•</span>
              <span><strong>GNUpg</strong>: OpenPGP实现</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-500">•</span>
              <span><strong>Facebook/Mesquite</strong>: 内部服务</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 密钥格式说明 -->
      <div class="p-4 border border-border rounded-lg bg-muted/30">
        <h4 class="font-semibold mb-3">Ed25519密钥格式说明</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 class="font-medium mb-2">私钥格式</h5>
            <ul class="space-y-1 text-muted-foreground">
              <li>• <strong>原始格式</strong>: 32字节种子</li>
              <li>• <strong>PKCS#8</strong>: 包含算法标识的DER编码</li>
              <li>• <strong>OpenSSH</strong>: OpenSSH私钥格式</li>
            </ul>
          </div>
          <div>
            <h5 class="font-medium mb-2">公钥格式</h5>
            <ul class="space-y-1 text-muted-foreground">
              <li>• <strong>原始格式</strong>: 32字节压缩公钥</li>
              <li>• <strong>SPKI</strong>: DER编码的SubjectPublicKeyInfo</li>
              <li>• <strong>SSH</strong>: ssh-ed25519 AAAA...格式</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Ed25519说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于Ed25519算法</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-primary mb-2">技术细节</h4>
          <ul class="space-y-1 text-sm">
            <li>• <strong>曲线</strong>: Curve25519 (Montgomery形式)</li>
            <li>• <strong>基域</strong>: 2^255 - 19</li>
            <li>• <strong>哈希</strong>: SHA-512</li>
            <li>• <strong>签名</strong>: 64字节 (R + S)</li>
            <li>• <strong>设计者</strong>: Daniel J. Bernstein等</li>
            <li>• <strong>年份</strong>: 2011</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">相关算法</h4>
          <ul class="space-y-1 text-sm">
            <li>• <strong>X25519</strong>: 密钥交换 (Diffie-Hellman)</li>
            <li>• <strong>X448</strong>: 448位密钥交换</li>
            <li>• <strong>Ed448</strong>: 448位签名变种</li>
            <li>• <strong>Curve25519</strong>: 原始椭圆曲线</li>
          </ul>
        </div>
      </div>
      <div class="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <h4 class="font-semibold text-green-600 mb-2">为什么选择Ed25519?</h4>
        <ul class="space-y-1 text-sm text-green-700">
          <li>• <strong>性能</strong>: 单次签名约0.00003秒，单次验签约0.00004秒</li>
          <li>• <strong>简单</strong>: 实现简单，减少了出错可能</li>
          <li>• <strong>安全</strong>: 避免了时序攻击、分支攻击等</li>
          <li>• <strong>标准化</strong>: RFC 8032, IETF标准</li>
        </ul>
      </div>
    </div>

    <!-- 典型应用 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">典型应用场景</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">🔑 SSH认证</h4>
          <p class="text-sm text-muted-foreground">OpenSSH 6.5+默认使用Ed25519，提供更快的认证和更小的密钥</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">💬 加密通讯</h4>
          <p class="text-sm text-muted-foreground">Signal、Telegram等使用Ed25519进行身份认证和消息签名</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">🌐 匿名网络</h4>
          <p class="text-sm text-muted-foreground">Tor网络使用Ed25519进行隐藏服务和节点认证</p>
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
const signatureResult = ref('')
const signatureFormat = ref('hex')
const derivedPublicKey = ref('')
const calculationTime = ref('')
const isSigning = ref(false)
const privateKeyInfo = ref({})

// 验签相关
const publicKeyInput = ref('')
const verifyMessageInput = ref('')
const verifySignatureInput = ref('')
const verificationResult = ref(null)
const isVerifying = ref(false)
const publicKeyInfo = ref({})

// 密钥生成相关
const generateKeypair = ref(true)
const generatedPrivateKey = ref('')
const generatedPublicKey = ref('')
const sshPublicKeyFormat = ref('')
const showPrivateKey = ref(false)
const isGenerating = ref(false)

const copyButtonText = ref('复制')

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'ed25519-tools'
  ).slice(0, 4)
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}

// 检查浏览器支持
const checkSupport = () => {
  try {
    // 检查是否支持Ed25519
    crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    ).then(() => {
      console.log('Ed25519 supported')
    }).catch(() => {
      console.warn('Ed25519 not supported')
    })
  } catch (e) {
    console.warn('Ed25519 check failed:', e)
  }
}

// 生成新私钥
const generateNewPrivateKey = async () => {
  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    )

    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    const privateKeyArray = new Uint8Array(privateKey)

    // 从PKCS8中提取实际的32字节私钥
    // PKCS8格式包含算法标识，私钥在最后32字节
    const seedBytes = privateKeyArray.slice(-32)
    const seedHex = Array.from(seedBytes, b => b.toString(16).padStart(2, '0')).join('')
    privateKeyInput.value = seedHex
    privateKeyInfo.value = { valid: true, message: '私钥生成成功' }
  } catch (error) {
    console.error('私钥生成失败:', error)
    privateKeyInfo.value = { valid: false, message: '错误: ' + error.message + ' (可能需要更新浏览器)' }
  }
}

// Hex转ArrayBuffer
const hexToArrayBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes.buffer
}

// ArrayBuffer转Hex
const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

// 生成签名
const generateSignature = async () => {
  if (!privateKeyInput.value || !messageInput.value) return

  isSigning.value = true
  const startTime = performance.now()

  try {
    // 将hex私钥转换为ArrayBuffer
    const privateKeyBytes = hexToArrayBuffer(privateKeyInput.value)

    // 导入私钥
    const privateKey = await crypto.subtle.importKey(
      'raw',
      privateKeyBytes,
      { name: 'Ed25519' },
      false,
      ['sign']
    )

    const messageBuffer = new TextEncoder().encode(messageInput.value)

    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      privateKey,
      messageBuffer
    )

    signatureResult.value = arrayBufferToHex(signature)

    // 计算衍生公钥
    try {
      const publicKey = await crypto.subtle.deriveKey(
        { name: 'Ed25519', publicKey: 'raw' },
        privateKey,
        { name: 'Ed25519' },
        true,
        ['verify']
      )
      const publicKeyBuffer = await crypto.subtle.exportKey('raw', publicKey)
      derivedPublicKey.value = arrayBufferToHex(publicKeyBuffer)
    } catch (e) {
      derivedPublicKey.value = '公钥衍生失败（浏览器可能不支持deriveKey）'
    }

    const endTime = performance.now()
    calculationTime.value = (endTime - startTime).toFixed(2)

    privateKeyInfo.value = { valid: true, message: '签名生成成功' }
  } catch (error) {
    console.error('签名失败:', error)
    privateKeyInfo.value = { valid: false, message: '错误: ' + error.message }
  } finally {
    isSigning.value = false
  }
}

// 验证签名
const verifySignature = async () => {
  if (!publicKeyInput.value || !verifyMessageInput.value || !verifySignatureInput.value) return

  isVerifying.value = true

  try {
    // 解析公钥
    const publicKeyBytes = hexToArrayBuffer(publicKeyInput.value)

    // 导入公钥
    const publicKey = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify']
    )

    const messageBuffer = new TextEncoder().encode(verifyMessageInput.value)

    // 解析签名
    let signatureBytes
    try {
      // 尝试Hex格式
      signatureBytes = hexToArrayBuffer(verifySignatureInput.value.trim())
    } catch {
      try {
        // 尝试Base64格式
        const binary = atob(verifySignatureInput.value.trim())
        signatureBytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          signatureBytes[i] = binary.charCodeAt(i)
        }
      } catch {
        throw new Error('无效的签名格式')
      }
    }

    const isValid = await crypto.subtle.verify(
      { name: 'Ed25519' },
      publicKey,
      signatureBytes,
      messageBuffer
    )

    verificationResult.value = isValid
    publicKeyInfo.value = { valid: true, message: '验签完成' }
  } catch (error) {
    console.error('验签失败:', error)
    verificationResult.value = false
    publicKeyInfo.value = { valid: false, message: '错误: ' + error.message }
  } finally {
    isVerifying.value = false
  }
}

// 生成密钥对
const generateKeyPair = async () => {
  isGenerating.value = true

  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'Ed25519' },
      true,
      ['sign', 'verify']
    )

    const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey)
    const pkcs8PrivateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    const publicKeyArray = new Uint8Array(rawPublicKey)
    const privateKeyArray = new Uint8Array(pkcs8PrivateKey)

    // 提取32字节私钥种子
    const seedBytes = privateKeyArray.slice(-32)

    generatedPublicKey.value = Array.from(publicKeyArray, b => b.toString(16).padStart(2, '0')).join('')
    generatedPrivateKey.value = Array.from(seedBytes, b => b.toString(16).padStart(2, '0')).join('')

    // 生成SSH格式公钥
    // ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA <base64公钥> comment
    const sshKeyBase64 = btoa(String.fromCharCode(...publicKeyArray))
    sshPublicKeyFormat.value = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA${sshKeyBase64} generated-key-${Date.now()}`
  } catch (error) {
    console.error('密钥生成失败:', error)
    alert('密钥生成失败: ' + error.message + '\n请确保您的浏览器支持Ed25519算法')
  } finally {
    isGenerating.value = false
  }
}

// 下载密钥对
const downloadKeyPair = () => {
  // 下载私钥
  const privateContent = `# Ed25519 Private Key\n# Generated on ${new Date().toISOString()}\n# WARNING: Keep this file secret!\n\nPrivate Key (Hex):\n${generatedPrivateKey.value}\n\n# SSH Private Key format (use: ssh-keygen -p -f ed25519 -m PEM)\n# Use the following to convert: printf "${generatedPrivateKey.value}" | xxd -r -p - key.pem\n`
  const privateBlob = new Blob([privateContent], { type: 'text/plain' })
  const privateUrl = URL.createObjectURL(privateBlob)
  const a = document.createElement('a')
  a.href = privateUrl
  a.download = 'ed25519-private-key.txt'
  a.click()
  URL.revokeObjectURL(privateUrl)

  // 下载公钥
  const publicContent = `# Ed25519 Public Key\n# Generated on ${new Date().toISOString()}\n\nPublic Key (Hex):\n${generatedPublicKey.value}\n\nSSH Authorized Keys format:\n${sshPublicKeyFormat.value}\n`
  const publicBlob = new Blob([publicContent], { type: 'text/plain' })
  const publicUrl = URL.createObjectURL(publicBlob)
  const b = document.createElement('a')
  b.href = publicUrl
  b.download = 'ed25519-public-key.txt'
  b.click()
  URL.revokeObjectURL(publicUrl)
}

// 切换私钥显示
const togglePrivateKeyVisibility = () => {
  showPrivateKey.value = !showPrivateKey.value
}

// 加载示例公钥
const loadSamplePublicKey = () => {
  // 生成一个示例公钥
  const sampleKey = crypto.getRandomValues(new Uint8Array(32))
  publicKeyInput.value = Array.from(sampleKey, b => b.toString(16).padStart(2, '0')).join('')
  publicKeyInfo.value = { valid: true, message: '示例公钥加载（仅用于测试）' }
}

// 清空函数
const clearPrivateKey = () => {
  privateKeyInput.value = ''
  privateKeyInfo.value = {}
  signatureResult.value = ''
  derivedPublicKey.value = ''
  calculationTime.value = ''
}

const clearPublicKey = () => {
  publicKeyInput.value = ''
  publicKeyInfo.value = {}
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

// Base64转ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
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

// 初始化检查
checkSupport()

// 添加到最近使用
addRecentTool('ed25519-tools')

// SEO配置
useSeoMeta({
  title: 'Ed25519签名工具 - 在线Ed25519签名验签密钥生成',
  description: '免费在线Ed25519签名工具，基于Curve25519的现代签名算法，支持Ed25519密钥对生成、签名和验证，用于SSH、加密通讯等。',
  keywords: ['Ed25519', 'Curve25519', '数字签名', 'SSH', 'OpenSSH', 'X25519', '现代密码学']
})
</script>
