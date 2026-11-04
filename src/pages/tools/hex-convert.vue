<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">十六进制转换器</h1>
      <p class="text-muted-foreground">在文本和十六进制之间相互转换，支持多种编码格式和分隔符</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
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
              @click="pasteFromClipboard"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              粘贴
            </button>
            <button
              @click="loadExample"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              示例
            </button>
          </div>
        </div>

        <div class="relative">
          <textarea
            v-model="inputText"
            placeholder="请输入要转换的文本或十六进制数据..."
            class="w-full h-48 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>

          <!-- 字符统计 -->
          <div
            v-if="inputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ inputType === 'text' ? inputText.length + ' 字符' : inputText.replace(/\s/g, '').length / 2 + ' 字节' }}
          </div>
        </div>

        <!-- 转换选项 -->
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">输入类型:</label>
            <select v-model="inputType" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="text">文本</option>
              <option value="hex">十六进制</option>
              <option value="auto">自动检测</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">编码格式:</label>
            <select v-model="encoding" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="utf-8">UTF-8</option>
              <option value="utf-16">UTF-16</option>
              <option value="utf-16le">UTF-16LE</option>
              <option value="utf-16be">UTF-16BE</option>
              <option value="ascii">ASCII</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">分隔符:</label>
            <select v-model="separator" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="none">无</option>
              <option value="space">空格</option>
              <option value="comma">逗号</option>
              <option value="colon">冒号</option>
              <option value="dash">横线</option>
              <option value="newline">换行</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">大小写:</label>
            <select v-model="hexCase" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="upper">大写 (A-F)</option>
              <option value="lower">小写 (a-f)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 文本输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">文本结果</h2>
            <div class="flex gap-2">
              <button
                v-if="outputs.text"
                @click="copyOutput('text')"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ copied.text ? '已复制' : '复制' }}
              </button>
              <button
                v-if="outputs.text"
                @click="downloadOutput('text')"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                下载
              </button>
            </div>
          </div>
          <pre
            class="w-full h-48 p-4 bg-muted rounded-lg overflow-auto text-sm whitespace-pre-wrap break-all"
          >{{ outputs.text || '转换结果将显示在这里' }}</pre>
        </div>

        <!-- 十六进制输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">十六进制结果</h2>
            <div class="flex gap-2">
              <button
                v-if="outputs.hex"
                @click="copyOutput('hex')"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ copied.hex ? '已复制' : '复制' }}
              </button>
              <button
                v-if="outputs.hex"
                @click="downloadOutput('hex')"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                下载
              </button>
            </div>
          </div>
          <pre
            class="w-full h-48 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputs.hex || '转换结果将显示在这里' }}</pre>
        </div>
      </div>

      <!-- 二进制输出 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">二进制表示</h2>
          <button
            v-if="outputs.binary"
            @click="copyOutput('binary')"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {{ copied.binary ? '已复制' : '复制' }}
          </button>
        </div>
        <pre
          class="w-full h-32 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
        >{{ outputs.binary || '二进制表示将显示在这里' }}</pre>
      </div>

      <!-- 字节详情表格 -->
      <div v-if="byteDetails.length > 0" class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">字节详情</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">位置</th>
                <th class="text-left py-2">字符</th>
                <th class="text-left py-2">Unicode</th>
                <th class="text-left py-2">UTF-8 字节</th>
                <th class="text-left py-2">十六进制</th>
                <th class="text-left py-2">二进制</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(detail, index) in byteDetails"
                :key="index"
                class="border-b"
              >
                <td class="py-2">{{ detail.position }}</td>
                <td class="py-2">{{ detail.char === ' ' ? '空格' : detail.char }}</td>
                <td class="py-2 font-mono">U+{{ detail.unicode.toUpperCase().padStart(4, '0') }}</td>
                <td class="py-2 font-mono">{{ detail.utf8Bytes.join(' ') }}</td>
                <td class="py-2 font-mono">{{ detail.hex.join(' ') }}</td>
                <td class="py-2 font-mono">{{ detail.binary.join(' ') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 使用技巧 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap class="w-5 h-5 text-primary" />
          使用技巧
        </h3>
        <div class="space-y-3 text-sm text-muted-foreground">
          <p>• 支持自动检测输入类型，智能判断是文本还是十六进制</p>
          <p>• 支持多种分隔符格式：无分隔、空格、逗号、冒号等</p>
          <p>• 支持多种编码格式：UTF-8、UTF-16、ASCII 等</p>
          <p>• 显示每个字符的详细字节信息和二进制表示</p>
        </div>
      </div>

      <!-- 编码示例 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">编码示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-2">文本转十六进制</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">输入: Hello
UTF-8: 48 65 6C 6C 6F
ASCII: 48 65 6C 6C 6F</pre>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">十六进制转文本</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">输入: E4 B8 AD E6 96 87 (UTF-8)
输出: 中文</pre>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">不同编码对比</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">字符: A
UTF-8:    41
UTF-16LE: 41 00
UTF-16BE: 00 41</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/binary-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Type class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">二进制转换</p>
              <p class="text-xs text-muted-foreground">文本与二进制互转</p>
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
              <p class="text-xs text-muted-foreground">文本转 Base64</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/unicode-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Unicode 转换</p>
              <p class="text-xs text-muted-foreground">Unicode 编码转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Zap, Type, Hash, FileText, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputText = ref('')
const inputType = ref('auto')
const encoding = ref('utf-8')
const separator = ref('space')
const hexCase = ref('upper')
const outputs = ref({
  text: '',
  hex: '',
  binary: ''
})
const copied = ref({
  text: false,
  hex: false,
  binary: false
})
const byteDetails = ref([])

// 分隔符映射
const separatorMap = {
  none: '',
  space: ' ',
  comma: ',',
  colon: ':',
  dash: '-',
  newline: '\n'
}

// 检测输入类型
const detectInputType = (text) => {
  // 简单的检测逻辑：如果只包含十六进制字符，则认为是十六进制
  const cleanText = text.replace(/[\s:,-]/g, '')
  const hexRegex = /^[0-9A-Fa-f]+$/

  if (cleanText.length > 0 && hexRegex.test(cleanText) && cleanText.length % 2 === 0) {
    return 'hex'
  }
  return 'text'
}

// 文本转十六进制
const textToHex = (text, enc, sep, casing) => {
  let hexBytes = []

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = char.charCodeAt(0)

    if (enc === 'utf-8') {
      // UTF-8 编码
      if (code <= 0x7F) {
        hexBytes.push(code)
      } else if (code <= 0x7FF) {
        hexBytes.push(0xC0 | (code >> 6))
        hexBytes.push(0x80 | (code & 0x3F))
      } else if (code <= 0xFFFF) {
        hexBytes.push(0xE0 | (code >> 12))
        hexBytes.push(0x80 | ((code >> 6) & 0x3F))
        hexBytes.push(0x80 | (code & 0x3F))
      } else {
        hexBytes.push(0xF0 | (code >> 18))
        hexBytes.push(0x80 | ((code >> 12) & 0x3F))
        hexBytes.push(0x80 | ((code >> 6) & 0x3F))
        hexBytes.push(0x80 | (code & 0x3F))
      }
    } else if (enc === 'utf-16') {
      // UTF-16 编码（使用 BOM）
      if (i === 0) {
        hexBytes.push(0xFE, 0xFF) // Big Endian BOM
      }
      hexBytes.push((code >> 8) & 0xFF)
      hexBytes.push(code & 0xFF)
    } else if (enc === 'utf-16le') {
      // UTF-16 Little Endian
      hexBytes.push(code & 0xFF)
      hexBytes.push((code >> 8) & 0xFF)
    } else if (enc === 'utf-16be') {
      // UTF-16 Big Endian
      hexBytes.push((code >> 8) & 0xFF)
      hexBytes.push(code & 0xFF)
    } else if (enc === 'ascii') {
      // ASCII 编码（非 ASCII 字符用 ? 代替）
      hexBytes.push(code <= 127 ? code : 63)
    }
  }

  // 格式化输出
  const sepStr = separatorMap[sep]
  const hexStr = hexBytes.map(byte => {
    const hex = byte.toString(16).padStart(2, '0')
    return casing === 'upper' ? hex.toUpperCase() : hex.toLowerCase()
  }).join(sepStr)

  return hexStr
}

// 十六进制转文本
const hexToText = (hexText, enc) => {
  // 清理输入
  const cleanHex = hexText.replace(/[\s:,-]/g, '')

  // 验证十六进制
  if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
    return '无效的十六进制格式'
  }

  // 转换为字节数组
  const bytes = []
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.substr(i, 2), 16))
  }

  // 解码
  let text = ''
  let i = 0

  if (enc === 'utf-16' && bytes.length >= 2) {
    // 检查 BOM
    if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
      // Big Endian
      i = 2
      while (i < bytes.length - 1) {
        const charCode = (bytes[i] << 8) | bytes[i + 1]
        text += String.fromCharCode(charCode)
        i += 2
      }
    } else if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
      // Little Endian
      i = 2
      while (i < bytes.length - 1) {
        const charCode = bytes[i] | (bytes[i + 1] << 8)
        text += String.fromCharCode(charCode)
        i += 2
      }
    }
  } else if (enc === 'utf-16le') {
    while (i < bytes.length - 1) {
      const charCode = bytes[i] | (bytes[i + 1] << 8)
      text += String.fromCharCode(charCode)
      i += 2
    }
  } else if (enc === 'utf-16be') {
    while (i < bytes.length - 1) {
      const charCode = (bytes[i] << 8) | bytes[i + 1]
      text += String.fromCharCode(charCode)
      i += 2
    }
  } else if (enc === 'ascii') {
    text = bytes.map(byte => byte <= 127 ? String.fromCharCode(byte) : '?').join('')
  } else {
    // UTF-8 解码
    while (i < bytes.length) {
      if (bytes[i] <= 0x7F) {
        text += String.fromCharCode(bytes[i])
        i++
      } else if (bytes[i] <= 0xDF) {
        if (i + 1 < bytes.length) {
          const charCode = ((bytes[i] & 0x1F) << 6) | (bytes[i + 1] & 0x3F)
          text += String.fromCharCode(charCode)
          i += 2
        } else {
          i++
        }
      } else if (bytes[i] <= 0xEF) {
        if (i + 2 < bytes.length) {
          const charCode = ((bytes[i] & 0x0F) << 12) | ((bytes[i + 1] & 0x3F) << 6) | (bytes[i + 2] & 0x3F)
          text += String.fromCharCode(charCode)
          i += 3
        } else {
          i++
        }
      } else {
        if (i + 3 < bytes.length) {
          const charCode = ((bytes[i] & 0x07) << 18) | ((bytes[i + 1] & 0x3F) << 12) |
                         ((bytes[i + 2] & 0x3F) << 6) | (bytes[i + 3] & 0x3F)
          text += String.fromCodePoint(charCode)
          i += 4
        } else {
          i++
        }
      }
    }
  }

  return text
}

// 生成字节详情
const generateByteDetails = (text) => {
  const details = []

  for (let i = 0; i < text.length && i < 20; i++) {
    const char = text[i]
    const code = char.charCodeAt(0)

    // 获取 UTF-8 字节
    const utf8Bytes = []
    if (code <= 0x7F) {
      utf8Bytes.push(code)
    } else if (code <= 0x7FF) {
      utf8Bytes.push(0xC0 | (code >> 6))
      utf8Bytes.push(0x80 | (code & 0x3F))
    } else if (code <= 0xFFFF) {
      utf8Bytes.push(0xE0 | (code >> 12))
      utf8Bytes.push(0x80 | ((code >> 6) & 0x3F))
      utf8Bytes.push(0x80 | (code & 0x3F))
    } else {
      utf8Bytes.push(0xF0 | (code >> 18))
      utf8Bytes.push(0x80 | ((code >> 12) & 0x3F))
      utf8Bytes.push(0x80 | ((code >> 6) & 0x3F))
      utf8Bytes.push(0x80 | (code & 0x3F))
    }

    details.push({
      position: i + 1,
      char: char,
      unicode: code.toString(16),
      utf8Bytes: utf8Bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')),
      hex: utf8Bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')),
      binary: utf8Bytes.map(b => b.toString(2).padStart(8, '0'))
    })
  }

  return details
}

// 转换函数
const convert = () => {
  if (!inputText.value) {
    outputs.value = {
      text: '',
      hex: '',
      binary: ''
    }
    byteDetails.value = []
    return
  }

  // 确定输入类型
  const actualInputType = inputType.value === 'auto' ? detectInputType(inputText.value) : inputType.value

  if (actualInputType === 'text') {
    // 文本转十六进制
    const hex = textToHex(inputText.value, encoding.value, separator.value, hexCase.value)
    outputs.value.text = inputText.value
    outputs.value.hex = hex

    // 生成二进制
    const cleanHex = hex.replace(/[\s:,-]/g, '')
    const binaryBytes = []
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substr(i, 2), 16)
      binaryBytes.push(byte.toString(2).padStart(8, '0'))
    }
    outputs.value.binary = binaryBytes.join(' ')

    byteDetails.value = generateByteDetails(inputText.value)
  } else {
    // 十六进制转文本
    const text = hexToText(inputText.value, encoding.value)
    outputs.value.hex = inputText.value
    outputs.value.text = text

    // 生成二进制
    const cleanHex = inputText.value.replace(/[\s:,-]/g, '')
    const binaryBytes = []
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substr(i, 2), 16)
      binaryBytes.push(byte.toString(2).padStart(8, '0'))
    }
    outputs.value.binary = binaryBytes.join(' ')

    byteDetails.value = generateByteDetails(text)
  }
}

// 加载示例
const loadExample = () => {
  inputText.value = 'Hello World! 你好世界！'
  inputType.value = 'text'
}

// 复制输出
const copyOutput = async (type) => {
  try {
    await navigator.clipboard.writeText(outputs.value[type])
    copied.value[type] = true
    setTimeout(() => {
      copied.value[type] = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = outputs.value[type]
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value[type] = true
    setTimeout(() => {
      copied.value[type] = false
    }, 2000)
  }
}

// 下载输出
const downloadOutput = (type) => {
  const filename = type === 'text' ? 'text.txt' : 'hex.txt'
  const blob = new Blob([outputs.value[type]], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputs.value = {
    text: '',
    hex: '',
    binary: ''
  }
  byteDetails.value = []
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('paste')
    inputText.value = textarea.value || ''
    document.body.removeChild(textarea)
  }
}

// 监听输入变化
watch([inputText, inputType, encoding, separator, hexCase], () => {
  convert()
})

// SEO配置
useSeoMeta({
  title: '十六进制转换器 - 在线文本与十六进制互转工具',
  description: '免费在线十六进制转换工具，支持文本与十六进制相互转换，支持多种编码格式和分隔符。',
  keywords: ['hex', '十六进制', 'converter', '编码', 'utf-8', 'ascii', '在线工具', '编码转换']
})


</script>

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>