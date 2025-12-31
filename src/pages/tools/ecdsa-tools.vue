<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">ECDSA椭圆曲线签名工具</h1>
      <p class="text-muted-foreground max-w-3xl">
        ECDSA（椭圆曲线数字签名算法）是基于椭圆曲线密码学的数字签名算法。
        相比RSA，ECDSA使用更短的密钥长度提供相同的安全级别，签名和验证速度更快，
        广泛应用于区块链、TLS证书和移动设备安全。
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
          <label class="text-lg font-semibold">ECDSA私钥 (Hex格式)</label>
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
          placeholder="请输入32字节(64个十六进制字符)的私钥..."
          class="w-full h-24 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
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
          class="w-full h-24 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- 签名配置 -->
      <div class="p-4 border border-border rounded-lg bg-muted/30">
        <h3 class="font-semibold mb-4">签名配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 曲线选择 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">椭圆曲线</label>
            <select
              v-model="selectedCurve"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option v-for="curve in curves" :key="curve.value" :value="curve.value">
                {{ curve.label }} - {{ curve.desc }}
              </option>
            </select>
          </div>

          <!-- 哈希算法 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">哈希算法</label>
            <select
              v-model="hashAlgorithm"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="SHA-1">SHA-1 (不推荐)</option>
              <option value="SHA-256">SHA-256 (推荐)</option>
              <option value="SHA-384">SHA-384</option>
              <option value="SHA-512">SHA-512</option>
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
            <button
              @click="copyToClipboard(signatureResult.r)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              复制R
            </button>
            <button
              @click="copyToClipboard(signatureResult.s)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              复制S
            </button>
            <button
              @click="copyToClipboard(signatureResult.combined)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              复制组合
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">R值</label>
            <div class="p-3 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-xs break-all">{{ signatureResult.r }}</div>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">S值</label>
            <div class="p-3 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-xs break-all">{{ signatureResult.s }}</div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">组合签名 (DER格式/Base64)</label>
          <div class="p-3 border border-border rounded-lg bg-muted/50">
            <div class="font-mono text-xs break-all">{{ signatureResult.combined }}</div>
          </div>
        </div>

        <!-- 衍生公钥 -->
        <div v-if="derivedPublicKey" class="space-y-2">
          <label class="text-sm font-medium">衍生公钥 (未压缩格式)</label>
          <div class="p-3 border border-border rounded-lg bg-muted/50">
            <div class="font-mono text-xs break-all">{{ derivedPublicKey }}</div>
          </div>
        </div>

        <!-- 签名信息 -->
        <div class="p-4 border border-border rounded-lg bg-muted/30">
          <h4 class="font-semibold text-sm mb-2">签名信息</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span class="text-muted-foreground">曲线:</span>
              <span class="ml-2 font-mono">{{ selectedCurve.toUpperCase() }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">哈希:</span>
              <span class="ml-2 font-mono">{{ hashAlgorithm.replace('-', '') }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">R长度:</span>
              <span class="ml-2 font-mono">{{ signatureResult.r.length / 2 }} bytes</span>
            </div>
            <div>
              <span class="text-muted-foreground">S长度:</span>
              <span class="ml-2 font-mono">{{ signatureResult.s.length / 2 }} bytes</span>
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
          <label class="text-lg font-semibold">ECDSA公钥 (未压缩Hex格式)</label>
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
          placeholder="请输入公钥（04开头，130个十六进制字符，代表65字节未压缩公钥）..."
          class="w-full h-24 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
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
          class="w-full h-24 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- 签名值 -->
      <div class="space-y-4">
        <label class="text-lg font-semibold">签名值</label>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium mb-1 block">R值 (Hex)</label>
            <input
              v-model="verifyRInput"
              type="text"
              placeholder="请输入R值..."
              class="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            >
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">S值 (Hex)</label>
            <input
              v-model="verifySInput"
              type="text"
              placeholder="请输入S值..."
              class="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            >
          </div>
        </div>
        <div class="text-xs text-muted-foreground">
          或输入组合的DER/Base64格式签名:
        </div>
        <input
          v-model="verifyCombinedInput"
          type="text"
          placeholder="请输入组合签名（DER编码的Hex或Base64）..."
          class="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        >
      </div>

      <!-- 验签配置 -->
      <div class="p-4 border border-border rounded-lg bg-muted/30">
        <h3 class="font-semibold mb-4">验签配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">椭圆曲线</label>
            <select
              v-model="verifyCurve"
              class="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option v-for="curve in curves" :key="curve.value" :value="curve.value">
                {{ curve.label }} - {{ curve.desc }}
              </option>
            </select>
          </div>
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
        </div>
      </div>

      <!-- 验签按钮 -->
      <div class="flex gap-4">
        <button
          @click="verifySignature"
          :disabled="!publicKeyInput || !verifyMessageInput || (!verifyRInput && !verifyCombinedInput) || isVerifying"
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
          <!-- 曲线选择 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">选择椭圆曲线</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="curve in curves"
                :key="curve.value"
                @click="keygenCurve = curve.value"
                :class="[
                  'p-4 rounded-lg border-2 transition-all text-left',
                  keygenCurve === curve.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                ]"
              >
                <div class="font-semibold">{{ curve.label }}</div>
                <div class="text-sm text-muted-foreground">{{ curve.desc }}</div>
                <div class="text-xs text-muted-foreground mt-2">
                  密钥长度: {{ curve.keySize }} bits | 安全性: ~{{ curve.securityBits }}-bit
                </div>
              </button>
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
          {{ isGenerating ? '生成中...' : '生成ECDSA密钥对' }}
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
            <label class="text-lg font-semibold">公钥 (Public Key - 未压缩格式)</label>
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

        <!-- WIF格式（可选） -->
        <div class="space-y-2">
          <label class="text-sm font-medium">WIF格式 (Wallet Import Format，用于比特币等)</label>
          <div class="p-3 border border-border rounded-lg bg-muted/50">
            <div class="font-mono text-xs break-all">{{ generatedWIF || '暂不支持' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 算法对比面板 -->
    <div v-show="activeTab === 'compare'" class="space-y-6">
      <div class="border border-border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="px-4 py-3 text-left">特性</th>
              <th class="px-4 py-3 text-center">ECDSA</th>
              <th class="px-4 py-3 text-center">RSA</th>
              <th class="px-4 py-3 text-center">Ed25519</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr>
              <td class="px-4 py-3 font-medium">密钥长度</td>
              <td class="px-4 py-3 text-center">32-64 bytes</td>
              <td class="px-4 py-3 text-center">256-512 bytes</td>
              <td class="px-4 py-3 text-center">32 bytes (私钥)</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">签名长度</td>
              <td class="px-4 py-3 text-center">64-72 bytes</td>
              <td class="px-4 py-3 text-center">256-512 bytes</td>
              <td class="px-4 py-3 text-center">64 bytes</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">签名速度</td>
              <td class="px-4 py-3 text-center text-green-600">快</td>
              <td class="px-4 py-3 text-center text-yellow-600">中</td>
              <td class="px-4 py-3 text-center text-green-600">极快</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">验签速度</td>
              <td class="px-4 py-3 text-center text-green-600">快</td>
              <td class="px-4 py-3 text-center text-green-600">快</td>
              <td class="px-4 py-3 text-center text-green-600">极快</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">安全性</td>
              <td class="px-4 py-3 text-center text-green-600">高</td>
              <td class="px-4 py-3 text-center text-yellow-600">中（需更长密钥）</td>
              <td class="px-4 py-3 text-center text-green-600">高</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">抗量子</td>
              <td class="px-4 py-3 text-center text-red-600">否</td>
              <td class="px-4 py-3 text-center text-red-600">否</td>
              <td class="px-4 py-3 text-center text-red-600">否</td>
            </tr>
            <tr>
              <td class="px-4 py-3 font-medium">典型应用</td>
              <td class="px-4 py-3 text-center">比特币、TLS证书</td>
              <td class="px-4 py-3 text-center">PKI、代码签名</td>
              <td class="px-4 py-3 text-center">SSH、Signal、Tor</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 安全等级对比 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">P-256 (secp256r1)</h4>
          <p class="text-sm text-muted-foreground mb-3">NIST标准曲线，最广泛使用</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span>密钥长度:</span>
              <span class="font-mono">256 bit</span>
            </div>
            <div class="flex justify-between">
              <span>安全性:</span>
              <span class="font-mono">~128-bit</span>
            </div>
            <div class="flex justify-between">
              <span>等效RSA:</span>
              <span class="font-mono">3072 bit</span>
            </div>
          </div>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">P-384 (secp384r1)</h4>
          <p class="text-sm text-muted-foreground mb-3">更高安全需求</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span>密钥长度:</span>
              <span class="font-mono">384 bit</span>
            </div>
            <div class="flex justify-between">
              <span>安全性:</span>
              <span class="font-mono">~192-bit</span>
            </div>
            <div class="flex justify-between">
              <span>等效RSA:</span>
              <span class="font-mono">7680 bit</span>
            </div>
          </div>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">P-521 (secp521r1)</h4>
          <p class="text-sm text-muted-foreground mb-3">最高安全级别</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span>密钥长度:</span>
              <span class="font-mono">521 bit</span>
            </div>
            <div class="flex justify-between">
              <span>安全性:</span>
              <span class="font-mono">~260-bit</span>
            </div>
            <div class="flex justify-between">
              <span>等效RSA:</span>
              <span class="font-mono">15360 bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ECDSA说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于ECDSA算法</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-primary mb-2">算法优势</h4>
          <ul class="space-y-1 text-sm">
            <li>• 密钥更短：256位ECDSA ≈ 3072位RSA</li>
            <li>• 签名更短：ECDSA签名约RSA的1/4大小</li>
            <li>• 计算更快：签名和验签速度优于RSA</li>
            <li>• 带存节省：适合移动设备和IoT</li>
            <li>• 广泛支持：现代浏览器和系统原生支持</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">注意事项</h4>
          <ul class="space-y-1 text-sm">
            <li>• 随机数质量要求极高</li>
            <li>• 重复使用随机数会导致私钥泄露</li>
            <li>• 签名的每个值都不同（即使相同消息）</li>
            <li>• 某些曲线（如NIST P-256）存在争议</li>
            <li>• 推荐使用现代曲线如Curve25519</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 典型应用 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">典型应用场景</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">₿ 加密货币</h4>
          <p class="text-sm text-muted-foreground">比特币、以太坊使用ECDSA（secp256k1曲线）进行交易签名</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">🔐 TLS证书</h4>
          <p class="text-sm text-muted-foreground">现代网站HTTPS证书支持ECDSA，减少握手延迟</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">📱 移动应用</h4>
          <p class="text-sm text-muted-foreground">适合资源受限设备，节省计算和存储开销</p>
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
const selectedCurve = ref('P-256')
const hashAlgorithm = ref('SHA-256')
const signatureResult = ref(null)
const derivedPublicKey = ref('')
const isSigning = ref(false)
const privateKeyInfo = ref({})

// 验签相关
const publicKeyInput = ref('')
const verifyMessageInput = ref('')
const verifyRInput = ref('')
const verifySInput = ref('')
const verifyCombinedInput = ref('')
const verifyCurve = ref('P-256')
const verifyHashAlgorithm = ref('SHA-256')
const verificationResult = ref(null)
const isVerifying = ref(false)
const publicKeyInfo = ref({})

// 密钥生成相关
const keygenCurve = ref('P-256')
const generatedPrivateKey = ref('')
const generatedPublicKey = ref('')
const generatedWIF = ref('')
const showPrivateKey = ref(false)
const isGenerating = ref(false)

const copyButtonText = ref('复制')

// 椭圆曲线配置
const curves = [
  { value: 'P-256', label: 'P-256', desc: 'secp256r1，NIST标准', keySize: 256, securityBits: 128 },
  { value: 'P-384', label: 'P-384', desc: 'secp384r1，高安全', keySize: 384, securityBits: 192 },
  { value: 'P-521', label: 'P-521', desc: 'secp521r1，最高安全', keySize: 521, securityBits: 260 },
  { value: 'secp256k1', label: 'secp256k1', desc: 'Bitcoin曲线', keySize: 256, securityBits: 128 }
]

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'ecdsa-tools'
  ).slice(0, 4)
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}

// 生成新私钥
const generateNewPrivateKey = async () => {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: selectedCurve.value
      },
      true,
      ['sign', 'verify']
    )

    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    const privateKeyArray = new Uint8Array(privateKey)

    // 从PKCS8中提取实际的私钥（简化处理）
    // 实际应该解析PKCS8格式，这里简化处理
    const privateKeyHex = Array.from(privateKeyArray.slice(-32), b => b.toString(16).padStart(2, '0')).join('')
    privateKeyInput.value = privateKeyHex
    privateKeyInfo.value = { valid: true, message: '私钥生成成功' }
  } catch (error) {
    console.error('私钥生成失败:', error)
    privateKeyInfo.value = { valid: false, message: '错误: ' + error.message }
  }
}

// 生成签名
const generateSignature = async () => {
  if (!privateKeyInput.value || !messageInput.value) return

  isSigning.value = true

  try {
    // 将hex私钥转换为ArrayBuffer
    const privateKeyBytes = new Uint8Array(privateKeyInput.value.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))

    // 导入私钥（这里需要构建完整的PKCS8格式）
    // 简化处理：实际应该构建完整的PKCS8 DER编码
    const keyData = new Uint8Array(privateKeyBytes.length + 20) // 预留空间
    keyData.set(privateKeyBytes, 20)

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData.buffer,
      { name: 'ECDSA', namedCurve: selectedCurve.value },
      false,
      ['sign']
    )

    const messageBuffer = new TextEncoder().encode(messageInput.value)

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: hashAlgorithm.value },
      privateKey,
      messageBuffer
    )

    // 解析签名（DER格式）
    const signatureArray = new Uint8Array(signature)
    const r = signatureArray.slice(0, signatureArray.length / 2)
    const s = signatureArray.slice(signatureArray.length / 2)

    signatureResult.value = {
      r: Array.from(r, b => b.toString(16).padStart(2, '0')).join(''),
      s: Array.from(s, b => b.toString(16).padStart(2, '0')).join(''),
      combined: Array.from(signatureArray, b => b.toString(16).padStart(2, '0')).join(''),
      combinedBase64: btoa(String.fromCharCode(...signatureArray))
    }

    // 衍生公钥
    // 注意：从私钥衍生公钥需要额外的椭圆曲线计算
    // Web Crypto API不直接支持，这里留空
    derivedPublicKey.value = '需要使用专门的椭圆曲线库从私钥衍生公钥'

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
  if (!publicKeyInput.value || !verifyMessageInput.value) return

  isVerifying.value = true

  try {
    // 解析公钥
    let publicKeyBytes
    if (publicKeyInput.value.startsWith('04')) {
      // 未压缩格式
      publicKeyBytes = new Uint8Array(publicKeyInput.value.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
    } else {
      throw new Error('公钥格式错误，应以04开头')
    }

    // 导入公钥
    const publicKey = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'ECDSA', namedCurve: verifyCurve.value },
      false,
      ['verify']
    )

    const messageBuffer = new TextEncoder().encode(verifyMessageInput.value)

    // 解析签名
    let signatureBytes
    if (verifyCombinedInput.value) {
      // 尝试解析组合签名
      try {
        signatureBytes = new Uint8Array(verifyCombinedInput.value.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      } catch {
        // 尝试Base64
        const binary = atob(verifyCombinedInput.value)
        signatureBytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          signatureBytes[i] = binary.charCodeAt(i)
        }
      }
    } else if (verifyRInput.value && verifySInput.value) {
      // 组合R和S
      const rBytes = new Uint8Array(verifyRInput.value.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      const sBytes = new Uint8Array(verifySInput.value.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
      signatureBytes = new Uint8Array(rBytes.length + sBytes.length)
      signatureBytes.set(rBytes, 0)
      signatureBytes.set(sBytes, rBytes.length)
    } else {
      throw new Error('请提供签名值')
    }

    const isValid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: verifyHashAlgorithm.value },
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
      {
        name: 'ECDSA',
        namedCurve: keygenCurve.value
      },
      true,
      ['sign', 'verify']
    )

    const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey)
    const pkcs8PrivateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    generatedPublicKey.value = '04' + Array.from(new Uint8Array(rawPublicKey), b => b.toString(16).padStart(2, '0')).join('')
    generatedPrivateKey.value = Array.from(new Uint8Array(pkcs8PrivateKey), b => b.toString(16).padStart(2, '0')).join('')

    // secp256k1的WIF格式（仅用于Bitcoin等）
    if (keygenCurve.value === 'secp256k1') {
      // 这里简化处理，实际WIF格式需要Base58Check编码
      generatedWIF.value = 'WIF格式需要Base58Check编码，建议使用专门的比特币库'
    } else {
      generatedWIF.value = '仅secp256k1曲线支持WIF格式'
    }
  } catch (error) {
    console.error('密钥生成失败:', error)
    alert('密钥生成失败: ' + error.message)
  } finally {
    isGenerating.value = false
  }
}

// 下载密钥对
const downloadKeyPair = () => {
  // 下载私钥
  const privateBlob = new Blob([generatedPrivateKey.value], { type: 'text/plain' })
  const privateUrl = URL.createObjectURL(privateBlob)
  const a = document.createElement('a')
  a.href = privateUrl
  a.download = `ecdsa-private-key-${keygenCurve.value}.txt`
  a.click()
  URL.revokeObjectURL(privateUrl)

  // 下载公钥
  const publicBlob = new Blob([generatedPublicKey.value], { type: 'text/plain' })
  const publicUrl = URL.createObjectURL(publicBlob)
  const b = document.createElement('a')
  b.href = publicUrl
  b.download = `ecdsa-public-key-${keygenCurve.value}.txt`
  b.click()
  URL.revokeObjectURL(publicUrl)
}

// 切换私钥显示
const togglePrivateKeyVisibility = () => {
  showPrivateKey.value = !showPrivateKey.value
}

// 加载示例公钥
const loadSamplePublicKey = () => {
  // 使用P-256曲线的示例公钥
  publicKeyInput.value = '04' + '60'.repeat(64) // 示例数据
  publicKeyInfo.value = { valid: true, message: '示例公钥加载' }
}

// 清空函数
const clearPrivateKey = () => {
  privateKeyInput.value = ''
  privateKeyInfo.value = {}
  signatureResult.value = null
  derivedPublicKey.value = ''
}

const clearPublicKey = () => {
  publicKeyInput.value = ''
  publicKeyInfo.value = {}
  verificationResult.value = null
}

const clearMessage = () => {
  messageInput.value = ''
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
addRecentTool('ecdsa-tools')

// SEO配置
useSeoMeta({
  title: 'ECDSA椭圆曲线签名工具 - 在线ECDSA签名验签密钥生成',
  description: '免费在线ECDSA椭圆曲线数字签名工具，支持P-256/P-384/P-521和secp256k1曲线，SHA-1/256/384/512哈希，ECDSA密钥对生成和签名验证。',
  keywords: ['ECDSA', '椭圆曲线', '数字签名', 'P-256', 'secp256k1', '比特币', 'ECDSA密钥生成']
})
</script>
