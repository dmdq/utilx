<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">哈希计算器</h1>
      <p class="text-muted-foreground mb-6">计算文本的哈希值，支持多种哈希算法，支持文件哈希计算</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 输入模式选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">输入模式</h3>
          <div class="grid grid-cols-2 gap-4">
            <button
              @click="inputMode = 'text'"
              :class="inputMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
              class="px-4 py-2 rounded-lg transition-colors"
            >
              文本输入
            </button>
            <button
              @click="inputMode = 'file'"
              :class="inputMode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
              class="px-4 py-2 rounded-lg transition-colors"
            >
              文件上传
            </button>
          </div>
        </div>

        <!-- 文本输入 -->
        <div v-if="inputMode === 'text'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">文本输入</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入文本</label>
              <textarea
                v-model="inputText"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows="6"
                placeholder="请输入要计算哈希值的文本..."
                @input="calculateHashes"
              ></textarea>
            </div>

            <!-- 快速文本 -->
            <div>
              <label class="block text-sm font-medium mb-2">快速测试文本</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="inputText = 'Hello World'; calculateHashes()"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  Hello World
                </button>
                <button
                  @click="inputText = '密码123456'; calculateHashes()"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  中文测试
                </button>
                <button
                  @click="inputText = 'test@example.com'; calculateHashes()"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  邮箱测试
                </button>
                <button
                  @click="inputText = generateRandomText(); calculateHashes()"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  随机文本
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 文件上传 -->
        <div v-if="inputMode === 'file'" class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">文件上传</h3>
          <div class="space-y-4">
            <div
              @drop="handleFileDrop"
              @dragover.prevent
              @dragenter.prevent
              class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            >
              <input
                ref="fileInput"
                type="file"
                @change="handleFileSelect"
                class="hidden"
              />
              <FileText class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <div class="text-sm text-muted-foreground mb-2">
                拖拽文件到此处或点击选择文件
              </div>
              <button
                @click="$refs.fileInput.click()"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                选择文件
              </button>
            </div>

            <div v-if="selectedFile" class="p-3 bg-secondary rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium">{{ selectedFile.name }}</div>
                  <div class="text-sm text-muted-foreground">
                    {{ formatFileSize(selectedFile.size) }}
                  </div>
                </div>
                <button
                  @click="removeFile"
                  class="p-2 text-muted-foreground hover:text-foreground"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 算法选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">哈希算法</h3>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="selectedAlgorithms.md5"
                type="checkbox"
                class="mr-2"
                @change="calculateHashes"
              />
              <span class="text-sm">MD5</span>
              <span class="text-xs text-muted-foreground ml-2">(128位)</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="selectedAlgorithms.sha1"
                type="checkbox"
                class="mr-2"
                @change="calculateHashes"
              />
              <span class="text-sm">SHA-1</span>
              <span class="text-xs text-muted-foreground ml-2">(160位)</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="selectedAlgorithms.sha256"
                type="checkbox"
                class="mr-2"
                @change="calculateHashes"
              />
              <span class="text-sm">SHA-256</span>
              <span class="text-xs text-muted-foreground ml-2">(256位)</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="selectedAlgorithms.sha512"
                type="checkbox"
                class="mr-2"
                @change="calculateHashes"
              />
              <span class="text-sm">SHA-512</span>
              <span class="text-xs text-muted-foreground ml-2">(512位)</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="selectedAlgorithms.sha3"
                type="checkbox"
                class="mr-2"
                @change="calculateHashes"
              />
              <span class="text-sm">SHA-3</span>
              <span class="text-xs text-muted-foreground ml-2">(可变长度)</span>
            </label>
          </div>

          <!-- 批量操作 -->
          <div class="mt-4 pt-4 border-t">
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="selectAllAlgorithms"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                全选
              </button>
              <button
                @click="clearAllAlgorithms"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：结果展示 -->
      <div class="space-y-6">
        <!-- 哈希结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">计算结果</h3>
          <div v-if="hashResults.length > 0" class="space-y-4">
            <div v-for="result in hashResults" :key="result.algorithm"
                 class="space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Hash class="w-4 h-4 text-primary" />
                  <span class="font-medium">{{ result.algorithm }}</span>
                  <span class="text-xs text-muted-foreground">({{ result.bits }}位)</span>
                </div>
                <button
                  @click="copyHash(result.hash)"
                  class="p-2 text-muted-foreground hover:text-foreground"
                  title="复制哈希值"
                >
                  <Copy class="w-4 h-4" />
                </button>
              </div>
              <div class="p-3 bg-secondary rounded font-mono text-sm break-all">
                {{ result.hash }}
              </div>
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>大写: {{ result.hash.toUpperCase() }}</span>
                <span>长度: {{ result.hash.length }} 字符</span>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-muted-foreground py-8">
            选择算法并输入文本或上传文件以计算哈希值
          </div>
        </div>

        <!-- 哈希比较 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">哈希比较</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">目标哈希值</label>
              <input
                v-model="targetHash"
                type="text"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="输入要比较的哈希值..."
              />
            </div>

            <div v-if="targetHash && hashResults.length > 0" class="space-y-2">
              <div v-for="result in hashResults" :key="'compare-' + result.algorithm"
                   class="flex items-center justify-between p-3 rounded"
                   :class="isHashMatch(result.hash, targetHash) ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
                <span class="font-medium">{{ result.algorithm }}</span>
                <span class="text-sm">
                  {{ isHashMatch(result.hash, targetHash) ? '✓ 匹配' : '✗ 不匹配' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 哈希信息 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">算法信息</h3>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
              <div>
                <div class="font-medium">MD5</div>
                <div class="text-xs text-muted-foreground">已不再推荐用于安全目的，仅适用于文件校验</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-yellow-600 rounded-full mt-1.5"></div>
              <div>
                <div class="font-medium">SHA-1</div>
                <div class="text-xs text-muted-foreground">安全性较低，不建议用于新的应用</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
              <div>
                <div class="font-medium">SHA-256</div>
                <div class="text-xs text-muted-foreground">目前广泛使用的安全哈希算法</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
              <div>
                <div class="font-medium">SHA-512</div>
                <div class="text-xs text-muted-foreground">更高安全性的哈希算法，输出512位</div>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 bg-purple-600 rounded-full mt-1.5"></div>
              <div>
                <div class="font-medium">SHA-3</div>
                <div class="text-xs text-muted-foreground">最新的哈希标准，与SHA-2完全不同</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用场景 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">使用场景</h3>
          <div class="grid grid-cols-1 gap-3 text-sm">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">文件完整性校验</div>
                <div class="text-xs text-muted-foreground">验证文件是否被修改</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">密码存储</div>
                <div class="text-xs text-muted-foreground">安全的密码哈希存储（建议使用加盐哈希）</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">数字签名</div>
                <div class="text-xs text-muted-foreground">验证数字签名的完整性</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <div class="font-medium">区块链</div>
                <div class="text-xs text-muted-foreground">构建区块链的数据结构</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'
import { FileText, Hash, Copy, X, CheckCircle } from 'lucide-vue-next'
import CryptoJS from 'crypto-js'

const { setPageTitle } = useSEO()
setPageTitle('哈希计算器')

// 状态管理
const inputMode = ref('text')
const inputText = ref('')
const selectedFile = ref(null)
const targetHash = ref('')

// 算法选择
const selectedAlgorithms = ref({
  md5: true,
  sha1: true,
  sha256: true,
  sha512: false,
  sha3: false
})

// 哈希结果
const hashResults = ref([])

// 计算哈希值
const calculateHashes = async () => {
  if (inputMode.value === 'text' && !inputText.value) {
    hashResults.value = []
    return
  }

  if (inputMode.value === 'file' && !selectedFile.value) {
    hashResults.value = []
    return
  }

  const results = []

  // 获取输入数据
  let data = ''
  if (inputMode.value === 'text') {
    data = inputText.value
  } else if (inputMode.value === 'file' && selectedFile.value) {
    data = await readFileAsText(selectedFile.value)
  }

  // MD5
  if (selectedAlgorithms.value.md5) {
    results.push({
      algorithm: 'MD5',
      bits: 128,
      hash: CryptoJS.MD5(data).toString()
    })
  }

  // SHA-1
  if (selectedAlgorithms.value.sha1) {
    results.push({
      algorithm: 'SHA-1',
      bits: 160,
      hash: CryptoJS.SHA1(data).toString()
    })
  }

  // SHA-256
  if (selectedAlgorithms.value.sha256) {
    results.push({
      algorithm: 'SHA-256',
      bits: 256,
      hash: CryptoJS.SHA256(data).toString()
    })
  }

  // SHA-512
  if (selectedAlgorithms.value.sha512) {
    results.push({
      algorithm: 'SHA-512',
      bits: 512,
      hash: CryptoJS.SHA512(data).toString()
    })
  }

  // SHA-3 (使用 SHA3-256)
  if (selectedAlgorithms.value.sha3) {
    results.push({
      algorithm: 'SHA-3-256',
      bits: 256,
      hash: CryptoJS.SHA3(data).toString()
    })
  }

  hashResults.value = results
}

// 读取文件为文本
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    calculateHashes()
  }
}

// 处理文件拖拽
const handleFileDrop = (event) => {
  event.preventDefault()
  const file = event.dataTransfer.files[0]
  if (file) {
    selectedFile.value = file
    calculateHashes()
  }
}

// 移除文件
const removeFile = () => {
  selectedFile.value = null
  if (inputMode.value === 'file') {
    hashResults.value = []
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生成随机文本
const generateRandomText = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 复制哈希值
const copyHash = async (hash) => {
  try {
    await navigator.clipboard.writeText(hash)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 检查哈希是否匹配
const isHashMatch = (hash1, hash2) => {
  return hash1.toLowerCase() === hash2.toLowerCase()
}

// 全选算法
const selectAllAlgorithms = () => {
  Object.keys(selectedAlgorithms.value).forEach(key => {
    selectedAlgorithms.value[key] = true
  })
  calculateHashes()
}

// 清空算法选择
const clearAllAlgorithms = () => {
  Object.keys(selectedAlgorithms.value).forEach(key => {
    selectedAlgorithms.value[key] = false
  })
  hashResults.value = []
}

// 监听文件变化
watch(selectedFile, () => {
  if (inputMode.value === 'file') {
    calculateHashes()
  }
})

// 初始计算
if (inputMode.value === 'text' && inputText.value) {
  calculateHashes()
}
</script>

<style scoped>
input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>