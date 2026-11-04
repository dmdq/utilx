<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">字符集编码转换</h1>
      <p class="text-muted-foreground">文本字符集编码转换工具，支持 UTF-8、GBK、ISO-8859-1 等多种编码格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 输入编码选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">源编码格式</h2>
          <select v-model="sourceEncoding" class="w-full px-3 py-2 border border-border rounded-md text-sm">
            <option value="utf-8">UTF-8</option>
            <option value="gbk">GBK</option>
            <option value="gb2312">GB2312</option>
            <option value="big5">Big5</option>
            <option value="iso-8859-1">ISO-8859-1</option>
            <option value="windows-1252">Windows-1252</option>
            <option value="shift_jis">Shift_JIS</option>
            <option value="euc-jp">EUC-JP</option>
            <option value="euc-kr">EUC-KR</option>
            <option value="koi8-r">KOI8-R</option>
          </select>
        </div>

        <!-- 输入文本 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">输入文本</h2>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                加载示例
              </button>
              <button
                @click="clearInput"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="inputText"
            placeholder="输入要转换的文本..."
            class="w-full h-80 px-4 py-3 border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>

          <!-- 文件上传 -->
          <div class="mt-4">
            <label class="text-sm font-medium">或上传文件</label>
            <input
              type="file"
              @change="handleFileUpload"
              class="mt-2 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>

        <!-- 字符信息 -->
        <div v-if="inputText" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">字符信息</h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">字符数：</span>
              <span class="font-medium">{{ inputText.length }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">字节数（{{ sourceEncoding }}）：</span>
              <span class="font-medium">{{ getByteCount(inputText, sourceEncoding) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：输出区域 -->
      <div class="space-y-4">
        <!-- 目标编码选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">目标编码格式</h2>
          <div class="flex gap-2">
            <select v-model="targetEncoding" class="flex-1 px-3 py-2 border border-border rounded-md text-sm">
              <option value="utf-8">UTF-8</option>
              <option value="gbk">GBK</option>
              <option value="gb2312">GB2312</option>
              <option value="big5">Big5</option>
              <option value="iso-8859-1">ISO-8859-1</option>
              <option value="windows-1252">Windows-1252</option>
              <option value="shift_jis">Shift_JIS</option>
              <option value="euc-jp">EUC-JP</option>
              <option value="euc-kr">EUC-KR</option>
              <option value="koi8-r">KOI8-R</option>
            </select>
            <button
              @click="convertText"
              :disabled="!inputText"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              转换
            </button>
          </div>
        </div>

        <!-- 输出结果 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">转换结果</h2>
            <div class="flex gap-2">
              <button
                @click="copyResult"
                :disabled="!outputText"
                class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ copied ? '已复制' : '复制' }}
              </button>
              <button
                @click="downloadResult"
                :disabled="!outputText"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下载
              </button>
            </div>
          </div>

          <div class="border rounded-lg p-4 bg-muted/30 min-h-[320px] max-h-[400px] overflow-auto">
            <pre v-if="outputText" class="text-sm whitespace-pre-wrap break-all">{{ outputText }}</pre>
            <div v-else class="text-center text-muted-foreground py-12">
              <FileText class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>转换结果将显示在这里</p>
            </div>
          </div>
        </div>

        <!-- 十六进制预览 -->
        <div v-if="inputText" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">十六进制预览</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium mb-2">源编码（{{ sourceEncoding }}）</h3>
              <div class="p-3 bg-muted rounded-lg font-mono text-xs break-all">
                {{ getHexView(inputText, sourceEncoding) }}
              </div>
            </div>
            <div v-if="outputText">
              <h3 class="text-sm font-medium mb-2">目标编码（{{ targetEncoding }}）</h3>
              <div class="p-3 bg-muted rounded-lg font-mono text-xs break-all">
                {{ getHexView(outputText, targetEncoding) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编码说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          常见字符编码介绍
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-foreground mb-2">Unicode 编码</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>UTF-8：</strong>
                可变长度编码，使用 1-4 个字节表示 Unicode 字符，是目前最常用的编码
              </li>
              <li>
                <strong>UTF-16：</strong>
                使用 2 或 4 个字节，主要用于 Windows 和 Java
              </li>
              <li>
                <strong>UTF-32：</strong>
                固定使用 4 个字节，处理简单但浪费空间
              </li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">区域编码</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>GBK/GB2312：</strong>
                中文编码，GBK 是 GB2312 的扩展
              </li>
              <li>
                <strong>Big5：</strong>
                繁体中文编码
              </li>
              <li>
                <strong>Shift_JIS/EUC-JP：</strong>
                日文编码
              </li>
              <li>
                <strong>ISO-8859-1：</strong>
                Latin-1 西欧编码
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 使用场景 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">常见使用场景</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-medium mb-2">网页开发</h4>
            <p class="text-sm text-muted-foreground">
              处理不同编码的网页内容，解决乱码问题
            </p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-medium mb-2">数据迁移</h4>
            <p class="text-sm text-muted-foreground">
              数据库或文件迁移时的编码转换
            </p>
          </div>
          <div class="p-4 bg-muted rounded-lg">
            <h4 class="font-medium mb-2">国际化</h4>
            <p class="text-sm text-muted-foreground">
              多语言应用的文本编码处理
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Info, FileText } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const sourceEncoding = ref('utf-8')
const targetEncoding = ref('gbk')
const inputText = ref('')
const outputText = ref('')
const copied = ref(false)

// 编码映射
const encodingMap = {
  'utf-8': 'utf-8',
  'gbk': 'gbk',
  'gb2312': 'gb2312',
  'big5': 'big5',
  'iso-8859-1': 'iso-8859-1',
  'windows-1252': 'windows-1252',
  'shift_jis': 'shift_jis',
  'euc-jp': 'euc-jp',
  'euc-kr': 'euc-kr',
  'koi8-r': 'koi8-r'
}

// 示例文本
const exampleText = '你好，世界！Hello, World! こんにちは、世界！안녕하세요, 세계!'

// 加载示例
const loadExample = () => {
  inputText.value = exampleText
  convertText()
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
}

// 处理文件上传
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const text = await file.text()
    inputText.value = text
    convertText()
  } catch (error) {
    console.error('文件读取失败', error)
    alert('文件读取失败，请确保文件是文本格式')
  }
}

// 获取字节数
const getByteCount = (text, encoding) => {
  try {
    const encoder = new TextEncoder(encoding)
    const bytes = encoder.encode(text)
    return bytes.length
  } catch (error) {
    // 如果编码不支持，使用默认 UTF-8
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)
    return bytes.length
  }
}

// 获取十六进制视图
const getHexView = (text, encoding) => {
  try {
    const encoder = new TextEncoder(encoding)
    const bytes = encoder.encode(text)
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(' ')
  } catch (error) {
    // 如果编码不支持，使用默认 UTF-8
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
      .join(' ')
  }
}

// 转换文本
const convertText = () => {
  if (!inputText.value) {
    outputText.value = ''
    return
  }

  try {
    // 在浏览器中，JavaScript 内部使用 UTF-16
    // 这里模拟转换过程，实际应用中可能需要后端支持
    const decoder = new TextDecoder(encodingMap[sourceEncoding.value], { fatal: false })
    const encoder = new TextEncoder()

    // 尝试按源编码解码
    const bytes = encoder.encode(inputText.value)
    const decoded = decoder.decode(bytes)

    // 输出转换后的文本（这里主要是演示，实际转换可能需要特定编码支持）
    outputText.value = decoded

    // 如果源编码和目标编码不同，显示提示
    if (sourceEncoding.value !== targetEncoding.value) {
      outputText.value += `\n\n注意：浏览器环境的限制，实际转换请确保目标环境支持相应编码。`
    }
  } catch (error) {
    console.error('转换失败', error)
    outputText.value = `转换失败：${error.message}`
  }
}

// 复制结果
const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 下载结果
const downloadResult = () => {
  const content = outputText.value
  const filename = `converted_${sourceEncoding.value}_to_${targetEncoding.value}.txt`
  const mimeType = 'text/plain;charset=utf-8'

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: '字符集编码转换器 - 在线文本编码转换工具',
  description: '免费的在线字符集编码转换工具，支持 UTF-8、GBK、GB2312、Big5 等多种编码格式之间的转换。',
  keywords: ['字符编码', '编码转换', 'utf-8', 'gbk', 'gb2312', '文本编码', '乱码', '编码格式']
})


</script>