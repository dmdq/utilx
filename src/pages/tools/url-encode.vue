<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">URL 编码器</h1>
      <p class="text-muted-foreground">将 URL 或文本进行百分比编码，确保 URL 在网络传输中安全可靠</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入内容</h2>
          <div class="flex gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
            <button
              @click="loadExample"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              示例
            </button>
          </div>
        </div>

        <textarea
          v-model="inputText"
          placeholder="请输入 URL 或需要编码的文本..."
          class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>

        <!-- 编码选项 -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">编码选项</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                v-model="encodeMode"
                value="full"
                class="rounded"
              />
              <span class="text-sm">完整编码（编码所有非安全字符）</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                type="radio"
                v-model="encodeMode"
                value="partial"
                class="rounded"
              />
              <span class="text-sm">部分编码（仅编码特殊字符）</span>
            </label>
          </div>
        </div>

        <!-- 常见编码参考 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">常见编码参考</h3>
          <div class="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>空格 → %20</div>
            <div>! → %21</div>
            <div>" → %22</div>
            <div># → %23</div>
            <div>$ → %24</div>
            <div>% → %25</div>
            <div>& → %26</div>
            <div>+ → %2B</div>
            <div>/ → %2F</div>
            <div>? → %3F</div>
            <div>= → %3D</div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">编码结果</h2>
          <div class="flex gap-2">
            <button
              v-if="outputText"
              @click="copyOutput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ copied ? '已复制' : '复制' }}
            </button>
            <button
              v-if="outputText"
              @click="downloadOutput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              下载
            </button>
          </div>
        </div>

        <div class="relative">
          <pre
            v-if="outputText"
            class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputText }}</pre>
          <div
            v-else
            class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground"
          >
            编码结果将显示在这里
          </div>

          <!-- 字符统计 -->
          <div
            v-if="outputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ outputText.length }} 字符
          </div>
        </div>

        <!-- 编码统计 -->
        <div v-if="inputText" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">编码统计</h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>原始长度: {{ inputText.length }}</div>
            <div>编码长度: {{ outputText.length }}</div>
            <div>编码增加: {{ outputText.length - inputText.length }} 字符</div>
            <div>编码率: {{ (outputText.length / inputText.length * 100).toFixed(1) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用场景说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe class="w-5 h-5 text-primary" />
          URL 编码使用场景
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <h4 class="font-medium">何时需要 URL 编码：</h4>
            <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>URL 参数传递</li>
              <li>表单数据提交</li>
              <li>HTTP 请求头</li>
              <li>Cookie 值</li>
              <li>文件名包含特殊字符</li>
            </ul>
          </div>
          <div class="space-y-3">
            <h4 class="font-medium">不需要编码的字符：</h4>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-sm">A-Z a-z 0-9 - _ . ! ~ * ' ( ) ; , : @</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 编码示例 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">编码示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-1">1. 搜索参数</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-xs">search?q=hello world&lang=en</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码后:</p>
                <code class="text-xs">search%3Fq%3Dhello%20world%26lang%3Den</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-1">2. 包含空格的 URL</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-xs">https://example.com/api/data?name=John Doe</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码后:</p>
                <code class="text-xs">https://example.com/api/data?name=John%20Doe</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-1">3. 特殊字符处理</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原始:</p>
                <code class="text-xs">price=$100&discount=20%</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码后:</p>
                <code class="text-xs">price%3D%24100%26discount%3D20%25</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/url-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Link class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">URL 解码</p>
              <p class="text-xs text-muted-foreground">URL 百分比解码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/html-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">HTML 编码</p>
              <p class="text-xs text-muted-foreground">HTML 实体编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/base64-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 编码</p>
              <p class="text-xs text-muted-foreground">Base64 格式转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Globe, FileText, Hash, Link, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputText = ref('')
const outputText = ref('')
const encodeMode = ref('full') // 'full' | 'partial'
const copied = ref(false)

// 示例数据
const examples = [
  'https://example.com/search?q=hello world&lang=en',
  'user@example.com?subject=Test Email&body=Hello, how are you?',
  'file name.txt?size=100KB&type=document'
]
const currentExample = ref(0)

// URL 编码函数
const encodeURL = (text, mode) => {
  if (mode === 'full') {
    return encodeURIComponent(text)
  } else {
    // 部分编码：只编码需要编码的特殊字符
    return text.replace(/[^\w\-._~!$&'()*+,;=:@]/g, (char) => {
      return '%' + char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
    })
  }
}

// 监听输入变化
watch(inputText, (newText) => {
  if (newText) {
    outputText.value = encodeURL(newText, encodeMode.value)
  } else {
    outputText.value = ''
  }
})

// 监听编码模式变化
watch(encodeMode, () => {
  if (inputText.value) {
    outputText.value = encodeURL(inputText.value, encodeMode.value)
  }
})

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
}

// 加载示例
const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

// 复制输出
const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// 下载输出
const downloadOutput = () => {
  const blob = new Blob([outputText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'url-encoded.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: 'URL编码器 - 在线URL百分比编码工具',
  description: '免费在线URL编码工具，支持完整编码和部分编码模式，确保URL安全传输，提供实时编码预览。',
  keywords: ['url', '编码', 'encoder', 'percent-encoding', 'urlencode', '在线工具', 'url safe']
})


</script>

<style scoped>
input[type="radio"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>