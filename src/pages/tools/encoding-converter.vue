<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">编码转换器</h1>
      <p class="text-muted-foreground mb-6">支持多种编码格式转换，Base64、URL编码、HTML实体等</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-6">
        <!-- 输入文本 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">输入文本</h3>
          <div class="space-y-4">
            <div>
              <textarea
                v-model="inputText"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="8"
                placeholder="请输入要转换的文本..."
                @input="convertText"
              ></textarea>
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium mb-2">快速示例</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="inputText = 'Hello World! 你好世界！'; convertText()"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  中英混合
                </button>
                <button
                  @click="inputText = 'https://example.com/search?q=测试&sort=desc'; convertText()"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  URL示例
                </button>
                <button
                  @click="loadExample('html')"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  HTML示例
                </button>
                <button
                  @click="inputText = 'email@example.com'; convertText()"
                  class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
                >
                  邮箱示例
                </button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="clearInput"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                清空
              </button>
              <button
                @click="pasteFromClipboard"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                粘贴
              </button>
              <button
                @click="copyInput"
                class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm"
              >
                复制输入
              </button>
            </div>
          </div>
        </div>

        <!-- 转换选项 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">转换选项</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">字符编码</label>
              <select
                v-model="selectedEncoding"
                @change="convertText"
                class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="utf-8">UTF-8</option>
                <option value="gbk">GBK</option>
                <option value="gb2312">GB2312</option>
                <option value="big5">Big5</option>
                <option value="iso-8859-1">ISO-8859-1</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">换行符格式</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="lineBreakType = 'lf'; convertText()"
                  :class="lineBreakType === 'lf' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                  class="px-3 py-2 rounded text-sm"
                >
                  LF (\n)
                </button>
                <button
                  @click="lineBreakType = 'crlf'; convertText()"
                  :class="lineBreakType === 'crlf' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                  class="px-3 py-2 rounded text-sm"
                >
                  CRLF (\r\n)
                </button>
                <button
                  @click="lineBreakType = 'cr'; convertText()"
                  :class="lineBreakType === 'cr' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
                  class="px-3 py-2 rounded text-sm"
                >
                  CR (\r)
                </button>
              </div>
            </div>

            <div>
              <label class="flex items-center">
                <input
                  v-model="preserveFormatting"
                  type="checkbox"
                  class="mr-2"
                  @change="convertText"
                />
                <span class="text-sm">保留格式（空格和换行）</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：转换结果 -->
      <div class="space-y-6">
        <!-- Base64编码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Base64</h3>
            <button
              @click="copyToClipboard(results.base64)"
              class="p-2 text-muted-foreground hover:text-foreground"
              title="复制"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2">
            <div class="p-3 bg-secondary rounded font-mono text-sm break-all min-h-[60px]">
              {{ results.base64 || '等待输入...' }}
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>长度: {{ results.base64?.length || 0 }} 字符</span>
              <button
                @click="convertBase64('encode')"
                class="text-primary hover:underline"
              >
                编码 →
              </button>
              <button
                @click="convertBase64('decode')"
                class="text-primary hover:underline"
              >
                ← 解码
              </button>
            </div>
          </div>
        </div>

        <!-- URL编码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">URL编码</h3>
            <button
              @click="copyToClipboard(results.urlEncoded)"
              class="p-2 text-muted-foreground hover:text-foreground"
              title="复制"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2">
            <div class="p-3 bg-secondary rounded font-mono text-sm break-all min-h-[60px]">
              {{ results.urlEncoded || '等待输入...' }}
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>长度: {{ results.urlEncoded?.length || 0 }} 字符</span>
              <button
                @click="convertUrl('encode')"
                class="text-primary hover:underline"
              >
                编码 →
              </button>
              <button
                @click="convertUrl('decode')"
                class="text-primary hover:underline"
              >
                ← 解码
              </button>
            </div>
          </div>
        </div>

        <!-- HTML实体编码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">HTML实体</h3>
            <button
              @click="copyToClipboard(results.htmlEncoded)"
              class="p-2 text-muted-foreground hover:text-foreground"
              title="复制"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2">
            <div class="p-3 bg-secondary rounded font-mono text-sm break-all min-h-[60px]">
              {{ results.htmlEncoded || '等待输入...' }}
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>长度: {{ results.htmlEncoded?.length || 0 }} 字符</span>
              <button
                @click="convertHtml('encode')"
                class="text-primary hover:underline"
              >
                编码 →
              </button>
              <button
                @click="convertHtml('decode')"
                class="text-primary hover:underline"
              >
                ← 解码
              </button>
            </div>
          </div>
        </div>

        <!-- Unicode转义 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Unicode转义</h3>
            <button
              @click="copyToClipboard(results.unicodeEscaped)"
              class="p-2 text-muted-foreground hover:text-foreground"
              title="复制"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2">
            <div class="p-3 bg-secondary rounded font-mono text-sm break-all min-h-[60px]">
              {{ results.unicodeEscaped || '等待输入...' }}
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>长度: {{ results.unicodeEscaped?.length || 0 }} 字符</span>
              <button
                @click="convertUnicode('encode')"
                class="text-primary hover:underline"
              >
                编码 →
              </button>
              <button
                @click="convertUnicode('decode')"
                class="text-primary hover:underline"
              >
                ← 解码
              </button>
            </div>
          </div>
        </div>

        <!-- 十六进制编码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">十六进制</h3>
            <button
              @click="copyToClipboard(results.hexEncoded)"
              class="p-2 text-muted-foreground hover:text-foreground"
              title="复制"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2">
            <div class="p-3 bg-secondary rounded font-mono text-sm break-all min-h-[60px]">
              {{ results.hexEncoded || '等待输入...' }}
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>长度: {{ results.hexEncoded?.length || 0 }} 字符</span>
              <button
                @click="convertHex('encode')"
                class="text-primary hover:underline"
              >
                编码 →
              </button>
              <button
                @click="convertHex('decode')"
                class="text-primary hover:underline"
              >
                ← 解码
              </button>
            </div>
          </div>
        </div>

        <!-- 二进制编码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">二进制</h3>
            <button
              @click="copyToClipboard(results.binaryEncoded)"
              class="p-2 text-muted-foreground hover:text-foreground"
              title="复制"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <div class="space-y-2">
            <div class="p-3 bg-secondary rounded font-mono text-sm break-all min-h-[60px] max-h-[120px] overflow-y-auto">
              {{ results.binaryEncoded || '等待输入...' }}
            </div>
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>长度: {{ results.binaryEncoded?.length || 0 }} 字符</span>
              <button
                @click="convertBinary('encode')"
                class="text-primary hover:underline"
              >
                编码 →
              </button>
              <button
                @click="convertBinary('decode')"
                class="text-primary hover:underline"
              >
                ← 解码
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编码信息 -->
    <div class="mt-8 bg-card rounded-lg p-6 border">
      <h3 class="text-lg font-semibold mb-4">编码说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
        <div>
          <h4 class="font-medium mb-2 text-primary">Base64</h4>
          <p class="text-muted-foreground text-xs">
            将二进制数据转换为ASCII字符串格式，常用于在文本协议中传输二进制数据。
          </p>
        </div>
        <div>
          <h4 class="font-medium mb-2 text-primary">URL编码</h4>
          <p class="text-muted-foreground text-xs">
            将URL中的特殊字符转换为%加两位十六进制的形式，确保URL在传输中不被误解。
          </p>
        </div>
        <div>
          <h4 class="font-medium mb-2 text-primary">HTML实体</h4>
          <p class="text-muted-foreground text-xs">
            将HTML中的特殊字符转换为实体形式，如&lt;转换为&lt;，防止XSS攻击。
          </p>
        </div>
        <div>
          <h4 class="font-medium mb-2 text-primary">Unicode转义</h4>
          <p class="text-muted-foreground text-xs">
            将Unicode字符转换为\u加四位十六进制的形式，常用于JavaScript字符串。
          </p>
        </div>
        <div>
          <h4 class="font-medium mb-2 text-primary">十六进制</h4>
          <p class="text-muted-foreground text-xs">
            将每个字符转换为两位十六进制表示，常用于数据显示和调试。
          </p>
        </div>
        <div>
          <h4 class="font-medium mb-2 text-primary">二进制</h4>
          <p class="text-muted-foreground text-xs">
            将每个字符转换为8位二进制表示，是最基础的数据表示形式。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSEO } from '~/composables/useSEO'
import { Copy } from 'lucide-vue-next'

const { setPageTitle } = useSEO()
setPageTitle('编码转换器')

// 状态管理
const inputText = ref('')
const selectedEncoding = ref('utf-8')
const lineBreakType = ref('lf')
const preserveFormatting = ref(true)

// 示例内容
const examples = {
  url: 'https://example.com/search?q=测试&sort=desc',
  html: '<div class="test">HTML内容</div>',
  chinese: '你好，世界！',
  emoji: '👋🌍💻'
}

// 加载示例
const loadExample = (type) => {
  inputText.value = examples[type]
  convertText()
}

// 转换结果
const results = ref({
  base64: '',
  urlEncoded: '',
  htmlEncoded: '',
  unicodeEscaped: '',
  hexEncoded: '',
  binaryEncoded: ''
})

// 处理换行符
const processLineBreaks = (text) => {
  if (!preserveFormatting.value) {
    return text.replace(/\r?\n/g, '')
  }

  switch (lineBreakType.value) {
    case 'lf':
      return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    case 'crlf':
      return text.replace(/\r\n/g, '\r\n').replace(/(?<!\r)\n/g, '\r\n').replace(/\r(?!\n)/g, '\r\n')
    case 'cr':
      return text.replace(/\r\n/g, '\r').replace(/\n/g, '\r')
    default:
      return text
  }
}

// 转换文本
const convertText = () => {
  if (!inputText.value) {
    Object.keys(results.value).forEach(key => {
      results.value[key] = ''
    })
    return
  }

  const text = processLineBreaks(inputText.value)

  // Base64编码
  try {
    results.value.base64 = btoa(unescape(encodeURIComponent(text)))
  } catch (error) {
    results.value.base64 = '编码错误'
  }

  // URL编码
  try {
    results.value.urlEncoded = encodeURIComponent(text)
  } catch (error) {
    results.value.urlEncoded = '编码错误'
  }

  // HTML实体编码
  try {
    results.value.htmlEncoded = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  } catch (error) {
    results.value.htmlEncoded = '编码错误'
  }

  // Unicode转义
  try {
    results.value.unicodeEscaped = text.split('').map(char => {
      const code = char.charCodeAt(0)
      if (code < 128) {
        return char
      } else {
        return '\\u' + code.toString(16).padStart(4, '0')
      }
    }).join('')
  } catch (error) {
    results.value.unicodeEscaped = '编码错误'
  }

  // 十六进制编码
  try {
    results.value.hexEncoded = text.split('').map(char => {
      return char.charCodeAt(0).toString(16).padStart(2, '0')
    }).join(' ')
  } catch (error) {
    results.value.hexEncoded = '编码错误'
  }

  // 二进制编码
  try {
    results.value.binaryEncoded = text.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0')
    }).join(' ')
  } catch (error) {
    results.value.binaryEncoded = '编码错误'
  }
}

// Base64转换
const convertBase64 = (action) => {
  if (!inputText.value) return

  try {
    if (action === 'encode') {
      inputText.value = btoa(unescape(encodeURIComponent(inputText.value)))
    } else {
      inputText.value = decodeURIComponent(escape(atob(inputText.value)))
    }
    convertText()
  } catch (error) {
    console.error('Base64转换失败:', error)
  }
}

// URL转换
const convertUrl = (action) => {
  if (!inputText.value) return

  try {
    if (action === 'encode') {
      inputText.value = encodeURIComponent(inputText.value)
    } else {
      inputText.value = decodeURIComponent(inputText.value)
    }
    convertText()
  } catch (error) {
    console.error('URL转换失败:', error)
  }
}

// HTML转换
const convertHtml = (action) => {
  if (!inputText.value) return

  try {
    if (action === 'encode') {
      inputText.value = inputText.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    } else {
      inputText.value = inputText.value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
    }
    convertText()
  } catch (error) {
    console.error('HTML转换失败:', error)
  }
}

// Unicode转换
const convertUnicode = (action) => {
  if (!inputText.value) return

  try {
    if (action === 'encode') {
      inputText.value = inputText.value.split('').map(char => {
        const code = char.charCodeAt(0)
        if (code < 128) {
          return char
        } else {
          return '\\u' + code.toString(16).padStart(4, '0')
        }
      }).join('')
    } else {
      inputText.value = inputText.value.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => {
        return String.fromCharCode(parseInt(code, 16))
      })
    }
    convertText()
  } catch (error) {
    console.error('Unicode转换失败:', error)
  }
}

// 十六进制转换
const convertHex = (action) => {
  if (!inputText.value) return

  try {
    if (action === 'encode') {
      inputText.value = inputText.value.split('').map(char => {
        return char.charCodeAt(0).toString(16).padStart(2, '0')
      }).join(' ')
    } else {
      inputText.value = inputText.value.split(' ').map(hex => {
        return String.fromCharCode(parseInt(hex, 16))
      }).join('')
    }
    convertText()
  } catch (error) {
    console.error('十六进制转换失败:', error)
  }
}

// 二进制转换
const convertBinary = (action) => {
  if (!inputText.value) return

  try {
    if (action === 'encode') {
      inputText.value = inputText.value.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(8, '0')
      }).join(' ')
    } else {
      inputText.value = inputText.value.split(' ').map(binary => {
        return String.fromCharCode(parseInt(binary, 2))
      }).join('')
    }
    convertText()
  } catch (error) {
    console.error('二进制转换失败:', error)
  }
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  convertText()
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    convertText()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 复制输入
const copyInput = async () => {
  if (!inputText.value) return

  try {
    await navigator.clipboard.writeText(inputText.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 监听输入变化
watch(inputText, convertText)
</script>

<style scoped>
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>