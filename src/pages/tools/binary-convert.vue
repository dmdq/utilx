<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">二进制转换器</h1>
      <p class="text-muted-foreground">在文本和二进制之间相互转换，支持多种编码格式和分组显示</p>
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
            placeholder="请输入要转换的文本或二进制数据..."
            class="w-full h-48 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          ></textarea>

          <!-- 字符统计 -->
          <div
            v-if="inputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ inputType === 'text' ? inputText.length + ' 字符' : Math.floor(inputText.replace(/\s/g, '').length / 8) + ' 字节' }}
          </div>
        </div>

        <!-- 转换选项 -->
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">输入类型:</label>
            <select v-model="inputType" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="text">文本</option>
              <option value="binary">二进制</option>
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
            <label class="text-sm font-medium">分组方式:</label>
            <select v-model="grouping" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="none">无</option>
              <option value="4">4位</option>
              <option value="8">8位（字节）</option>
              <option value="16">16位</option>
              <option value="32">32位</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">分隔符:</label>
            <select v-model="separator" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="space">空格</option>
              <option value="comma">逗号</option>
              <option value="dash">横线</option>
              <option value="newline">换行</option>
              <option value="none">无</option>
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

        <!-- 二进制输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">二进制结果</h2>
            <div class="flex gap-2">
              <button
                v-if="outputs.binary"
                @click="copyOutput('binary')"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ copied.binary ? '已复制' : '复制' }}
              </button>
              <button
                v-if="outputs.binary"
                @click="downloadOutput('binary')"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                下载
              </button>
            </div>
          </div>
          <pre
            class="w-full h-48 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputs.binary || '转换结果将显示在这里' }}</pre>
        </div>
      </div>

      <!-- 其他格式输出 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 十进制输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">十进制表示</h2>
            <button
              v-if="outputs.decimal"
              @click="copyOutput('decimal')"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ copied.decimal ? '已复制' : '复制' }}
            </button>
          </div>
          <pre
            class="w-full h-32 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputs.decimal || '十进制表示将显示在这里' }}</pre>
        </div>

        <!-- 十六进制输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">十六进制表示</h2>
            <button
              v-if="outputs.hexadecimal"
              @click="copyOutput('hexadecimal')"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ copied.hexadecimal ? '已复制' : '复制' }}
            </button>
          </div>
          <pre
            class="w-full h-32 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputs.hexadecimal || '十六进制表示将显示在这里' }}</pre>
        </div>
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
                <th class="text-left py-2">二进制</th>
                <th class="text-left py-2">八进制</th>
                <th class="text-left py-2">十进制</th>
                <th class="text-left py-2">十六进制</th>
                <th class="text-left py-2">描述</th>
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
                <td class="py-2 font-mono">{{ detail.binary }}</td>
                <td class="py-2 font-mono">{{ detail.octal }}</td>
                <td class="py-2 font-mono">{{ detail.decimal }}</td>
                <td class="py-2 font-mono">{{ detail.hexadecimal.toUpperCase() }}</td>
                <td class="py-2">{{ detail.description }}</td>
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
          <p>• 支持自动检测输入类型，智能判断是文本还是二进制</p>
          <p>• 支持多种分组方式：4位、8位（字节）、16位、32位</p>
          <p>• 支持多种编码格式：UTF-8、UTF-16、ASCII 等</p>
          <p>• 同时显示十进制和十六进制表示，方便理解</p>
        </div>
      </div>

      <!-- 编码示例 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">编码示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-2">文本转二进制</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">输入: A
ASCII:    01000001
UTF-8:     01000001</pre>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">中文转二进制（UTF-8）</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">输入: 中
UTF-8:     11100100 10111000 10101101
          (E4)     (B8)     (AD)</pre>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">二进制转文本</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">输入: 01001000 01100101 01101100 01101100 01101111
输出: Hello</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/hex-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">十六进制转换</p>
              <p class="text-xs text-muted-foreground">文本与十六进制互转</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/unicode-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Type class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Unicode 转换</p>
              <p class="text-xs text-muted-foreground">Unicode 编码转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/ascii-table"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">ASCII 码表</p>
              <p class="text-xs text-muted-foreground">查看 ASCII 字符集</p>
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
import { Zap, Hash, Type, FileText, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputText = ref('')
const inputType = ref('auto')
const encoding = ref('utf-8')
const grouping = ref('8')
const separator = ref('space')
const outputs = ref({
  text: '',
  binary: '',
  decimal: '',
  hexadecimal: ''
})
const copied = ref({
  text: false,
  binary: false,
  decimal: false,
  hexadecimal: false
})
const byteDetails = ref([])

// 分隔符映射
const separatorMap = {
  space: ' ',
  comma: ',',
  dash: '-',
  newline: '\n',
  none: ''
}

// 获取字符描述
const getCharDescription = (code) => {
  if (code === 32) return '空格'
  if (code === 10) return '换行'
  if (code === 13) return '回车'
  if (code === 9) return '制表符'
  if (code >= 0 && code <= 31) return '控制字符'
  if (code >= 127) return '扩展字符'
  if (code >= 48 && code <= 57) return '数字'
  if (code >= 65 && code <= 90) return '大写字母'
  if (code >= 97 && code <= 122) return '小写字母'
  return '可打印字符'
}

// 检测输入类型
const detectInputType = (text) => {
  // 移除所有非二进制字符
  const cleanText = text.replace(/[^01\s]/g, '').trim()

  // 如果清理后的文本只包含0和1，并且长度是8的倍数，则认为是二进制
  if (cleanText.length > 0 && /^[01\s]+$/.test(text)) {
    const binaryCount = text.replace(/\s/g, '').length
    if (binaryCount % 8 === 0) {
      return 'binary'
    }
  }

  return 'text'
}

// 文本转二进制
const textToBinary = (text, enc, group, sep) => {
  let binaryBits = []

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = char.charCodeAt(0)

    if (enc === 'utf-8') {
      // UTF-8 编码
      if (code <= 0x7F) {
        binaryBits.push(code.toString(2).padStart(8, '0'))
      } else if (code <= 0x7FF) {
        binaryBits.push(
          (0xC0 | (code >> 6)).toString(2).padStart(8, '0'),
          (0x80 | (code & 0x3F)).toString(2).padStart(8, '0')
        )
      } else if (code <= 0xFFFF) {
        binaryBits.push(
          (0xE0 | (code >> 12)).toString(2).padStart(8, '0'),
          (0x80 | ((code >> 6) & 0x3F)).toString(2).padStart(8, '0'),
          (0x80 | (code & 0x3F)).toString(2).padStart(8, '0')
        )
      } else {
        binaryBits.push(
          (0xF0 | (code >> 18)).toString(2).padStart(8, '0'),
          (0x80 | ((code >> 12) & 0x3F)).toString(2).padStart(8, '0'),
          (0x80 | ((code >> 6) & 0x3F)).toString(2).padStart(8, '0'),
          (0x80 | (code & 0x3F)).toString(2).padStart(8, '0')
        )
      }
    } else if (enc === 'utf-16') {
      // UTF-16 编码
      if (i === 0) {
        binaryBits.push('11111110', '00000000') // BOM Big Endian
      }
      binaryBits.push(
        (code >> 8).toString(2).padStart(8, '0'),
        (code & 0xFF).toString(2).padStart(8, '0')
      )
    } else if (enc === 'utf-16le') {
      binaryBits.push(
        (code & 0xFF).toString(2).padStart(8, '0'),
        (code >> 8).toString(2).padStart(8, '0')
      )
    } else if (enc === 'utf-16be') {
      binaryBits.push(
        (code >> 8).toString(2).padStart(8, '0'),
        (code & 0xFF).toString(2).padStart(8, '0')
      )
    } else if (enc === 'ascii') {
      binaryBits.push((code <= 127 ? code : 63).toString(2).padStart(8, '0'))
    }
  }

  // 连接所有二进制位
  let binaryString = binaryBits.join('')

  // 应用分组
  if (group !== 'none') {
    const groupSize = parseInt(group)
    const groups = []
    for (let i = 0; i < binaryString.length; i += groupSize) {
      groups.push(binaryString.substring(i, i + groupSize))
    }
    binaryString = groups.join(separatorMap[sep])
  }

  return binaryString
}

// 二进制转文本
const binaryToText = (binaryText, enc) => {
  // 清理输入
  const cleanBinary = binaryText.replace(/[^01]/g, '')

  // 确保长度是8的倍数
  if (cleanBinary.length % 8 !== 0) {
    return '错误：二进制长度必须是8的倍数'
  }

  // 转换为字节数组
  const bytes = []
  for (let i = 0; i < cleanBinary.length; i += 8) {
    bytes.push(parseInt(cleanBinary.substr(i, 8), 2))
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

    // 对于 ASCII 字符，显示单字节
    if (code <= 0x7F) {
      const byte = code
      details.push({
        position: i + 1,
        char: char,
        binary: byte.toString(2).padStart(8, '0'),
        octal: byte.toString(8).padStart(3, '0'),
        decimal: byte,
        hexadecimal: byte.toString(16).padStart(2, '0'),
        description: getCharDescription(byte)
      })
    } else {
      // 非 ASCII 字符，显示 UTF-8 编码的第一个字节
      const utf8Bytes = []
      if (code <= 0x7FF) {
        utf8Bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F))
      } else if (code <= 0xFFFF) {
        utf8Bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F))
      } else {
        utf8Bytes.push(0xF0 | (code >> 18), 0x80 | ((code >> 12) & 0x3F),
                     0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F))
      }

      details.push({
        position: i + 1,
        char: char,
        binary: utf8Bytes[0].toString(2).padStart(8, '0'),
        octal: utf8Bytes[0].toString(8).padStart(3, '0'),
        decimal: utf8Bytes[0],
        hexadecimal: utf8Bytes[0].toString(16).padStart(2, '0'),
        description: '多字节字符'
      })
    }
  }

  return details
}

// 转换函数
const convert = () => {
  if (!inputText.value) {
    outputs.value = {
      text: '',
      binary: '',
      decimal: '',
      hexadecimal: ''
    }
    byteDetails.value = []
    return
  }

  // 确定输入类型
  const actualInputType = inputType.value === 'auto' ? detectInputType(inputText.value) : inputType.value

  if (actualInputType === 'text') {
    // 文本转二进制
    const binary = textToBinary(inputText.value, encoding.value, grouping.value, separator.value)
    outputs.value.text = inputText.value
    outputs.value.binary = binary

    // 生成十进制和十六进制
    const cleanBinary = binary.replace(/[^01]/g, '')
    const decimalBytes = []
    const hexBytes = []
    for (let i = 0; i < cleanBinary.length; i += 8) {
      const byte = parseInt(cleanBinary.substr(i, 8), 2)
      decimalBytes.push(byte)
      hexBytes.push(byte.toString(16).padStart(2, '0'))
    }
    outputs.value.decimal = decimalBytes.join(separatorMap[separator.value === 'none' ? 'space' : separator.value])
    outputs.value.hexadecimal = hexBytes.join(separatorMap[separator.value === 'none' ? 'space' : separator.value])

    byteDetails.value = generateByteDetails(inputText.value)
  } else {
    // 二进制转文本
    const text = binaryToText(inputText.value, encoding.value)
    outputs.value.binary = inputText.value
    outputs.value.text = text

    // 生成十进制和十六进制
    const cleanBinary = inputText.value.replace(/[^01]/g, '')
    const decimalBytes = []
    const hexBytes = []
    for (let i = 0; i < cleanBinary.length; i += 8) {
      const byte = parseInt(cleanBinary.substr(i, 8), 2)
      decimalBytes.push(byte)
      hexBytes.push(byte.toString(16).padStart(2, '0'))
    }
    outputs.value.decimal = decimalBytes.join(separatorMap[separator.value === 'none' ? 'space' : separator.value])
    outputs.value.hexadecimal = hexBytes.join(separatorMap[separator.value === 'none' ? 'space' : separator.value])

    byteDetails.value = generateByteDetails(text)
  }
}

// 加载示例
const loadExample = () => {
  inputText.value = 'Binary Converter!'
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
  const filename = type === 'text' ? 'text.txt' : 'binary.txt'
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
    binary: '',
    decimal: '',
    hexadecimal: ''
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
watch([inputText, inputType, encoding, grouping, separator], () => {
  convert()
})

// SEO配置
useSeoMeta({
  title: '二进制转换器 - 在线文本与二进制互转工具',
  description: '免费在线二进制转换工具，支持文本与二进制相互转换，支持多种编码格式和分组显示。',
  keywords: ['binary', '二进制', 'converter', '编码', 'utf-8', 'ascii', '在线工具', '编码转换']
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