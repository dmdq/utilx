<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Unicode 转换器</h1>
      <p class="text-muted-foreground">在文本、Unicode 码点、转义序列之间相互转换，支持多种编码格式</p>
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

        <textarea
          v-model="inputText"
          placeholder="请输入要转换的文本、Unicode 码点或转义序列..."
          class="w-full h-48 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>

        <!-- 转换选项 -->
        <div class="flex flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">输入格式:</label>
            <select v-model="inputFormat" class="px-3 py-1 border border-border rounded-md text-sm">
              <option value="text">普通文本</option>
              <option value="decimal">十进制码点</option>
              <option value="hexadecimal">十六进制码点</option>
              <option value="javascript">JavaScript 转义</option>
              <option value="python">Python 转义</option>
              <option value="java">Java 转义</option>
              <option value="c">C/C++ 转义</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">分隔符:</label>
            <input
              v-model="separator"
              type="text"
              placeholder="空格、逗号等"
              class="w-32 px-3 py-1 border border-border rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 文本输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">普通文本</h2>
            <button
              v-if="outputs.text"
              @click="copyOutput('text')"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ copied.text ? '已复制' : '复制' }}
            </button>
          </div>
          <pre
            class="w-full h-32 p-4 bg-muted rounded-lg overflow-auto text-sm whitespace-pre-wrap break-all"
          >{{ outputs.text || '转换结果将显示在这里' }}</pre>
        </div>

        <!-- Unicode 码点输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Unicode 码点 (十进制)</h2>
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
          >{{ outputs.decimal || '转换结果将显示在这里' }}</pre>
        </div>

        <!-- 十六进制码点输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Unicode 码点 (十六进制)</h2>
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
          >{{ outputs.hexadecimal || '转换结果将显示在这里' }}</pre>
        </div>

        <!-- JavaScript 转义输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">JavaScript 转义序列</h2>
            <button
              v-if="outputs.javascript"
              @click="copyOutput('javascript')"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ copied.javascript ? '已复制' : '复制' }}
            </button>
          </div>
          <pre
            class="w-full h-32 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputs.javascript || '转换结果将显示在这里' }}</pre>
        </div>
      </div>

      <!-- Unicode 详情表格 -->
      <div v-if="unicodeDetails.length > 0" class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">Unicode 字符详情</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">字符</th>
                <th class="text-left py-2">名称</th>
                <th class="text-left py-2">十进制</th>
                <th class="text-left py-2">十六进制</th>
                <th class="text-left py-2">UTF-8 字节</th>
                <th class="text-left py-2">分类</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(detail, index) in unicodeDetails"
                :key="index"
                class="border-b"
              >
                <td class="py-2">
                  <span class="text-2xl">{{ detail.char }}</span>
                </td>
                <td class="py-2">{{ detail.name || '-' }}</td>
                <td class="py-2 font-mono">{{ detail.decimal }}</td>
                <td class="py-2 font-mono">U+{{ detail.hexadecimal.toUpperCase().padStart(4, '0') }}</td>
                <td class="py-2 font-mono">{{ detail.utf8.join(' ') }}</td>
                <td class="py-2">{{ detail.category }}</td>
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
          <p>• 输入普通文本时，会自动转换成各种格式的 Unicode 表示</p>
          <p>• 输入码点时，支持十进制（如 65）和十六进制（如 41）格式</p>
          <p>• 可以使用空格、逗号等分隔符输入多个码点</p>
          <p>• 支持多种编程语言的转义序列格式</p>
        </div>
      </div>

      <!-- 编码示例 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">编码示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-2">常见字符的 Unicode 表示</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">A  → 65 (十进制) → U+0041 (十六进制) → \u0041 (JavaScript)
中 → 20013 (十进制) → U+4E2D (十六进制) → \u4E2D (JavaScript)
€ → 8364 (十进制) → U+20AC (十六进制) → \u20AC (JavaScript)</pre>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">编程语言格式对比</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">JavaScript: \u4F60\u597D
Python: \u4F60\u597D 或 \U00004F60\U0000597D
Java: \u4F60\u597D
C/C++: \u4F60\u597D 或 \U00004F60\U0000597D</pre>
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
import { ref, watch, computed } from 'vue'
import { Zap, Hash, Type, FileText, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputText = ref('')
const inputFormat = ref('text')
const separator = ref(' ')
const outputs = ref({
  text: '',
  decimal: '',
  hexadecimal: '',
  javascript: ''
})
const copied = ref({
  text: false,
  decimal: false,
  hexadecimal: false,
  javascript: false
})
const unicodeDetails = ref([])

// Unicode 字符分类
const unicodeCategories = {
  Lu: '大写字母',
  Ll: '小写字母',
  Lt: '首字母大写',
  Lm: '修饰字母',
  Lo: '其他字母',
  Mn: '非间距标记',
  Mc: '间距组合标记',
  Me: '封闭标记',
  Nd: '十进制数字',
  Nl: '字母数字',
  No: '其他数字',
  Pc: '连接符标点',
  Pd: '破折号标点',
  Ps: '开放标点',
  Pe: '关闭标点',
  Pi: '前引号标点',
  Pf: '后引号标点',
  Po: '其他标点',
  Sm: '数学符号',
  Sc: '货币符号',
  Sk: '修饰符号',
  So: '其他符号',
  Zs: '空格分隔符',
  Zl: '行分隔符',
  Zp: '段分隔符',
  Cc: '控制字符',
  Cf: '格式字符',
  Cs: '代理字符',
  Co: '专用字符',
  Cn: '未分配'
}

// 获取 Unicode 字符信息
const getUnicodeInfo = (char) => {
  const code = char.charCodeAt(0)
  return {
    char: char,
    name: getCharacterName(code),
    decimal: code,
    hexadecimal: code.toString(16),
    utf8: getUTF8Bytes(code),
    category: unicodeCategories[char.codePointAt(0)] || '未知'
  }
}

// 获取字符名称（简化版）
const getCharacterName = (code) => {
  const names = {
    32: 'Space',
    33: 'Exclamation Mark',
    34: 'Quotation Mark',
    35: 'Number Sign',
    36: 'Dollar Sign',
    37: 'Percent Sign',
    38: 'Ampersand',
    39: 'Apostrophe',
    40: 'Left Parenthesis',
    41: 'Right Parenthesis',
    43: 'Plus Sign',
    44: 'Comma',
    45: 'Hyphen-Minus',
    46: 'Full Stop',
    47: 'Solidus',
    48: 'Digit Zero',
    49: 'Digit One',
    50: 'Digit Two',
    51: 'Digit Three',
    52: 'Digit Four',
    53: 'Digit Five',
    54: 'Digit Six',
    55: 'Digit Seven',
    56: 'Digit Eight',
    57: 'Digit Nine',
    58: 'Colon',
    59: 'Semicolon',
    60: 'Less-Than Sign',
    61: 'Equals Sign',
    62: 'Greater-Than Sign',
    63: 'Question Mark',
    64: 'Commercial At',
    65: 'Latin Capital Letter A',
    66: 'Latin Capital Letter B',
    67: 'Latin Capital Letter C',
    68: 'Latin Capital Letter D',
    69: 'Latin Capital Letter E',
    70: 'Latin Capital Letter F',
    71: 'Latin Capital Letter G',
    72: 'Latin Capital Letter H',
    73: 'Latin Capital Letter I',
    74: 'Latin Capital Letter J',
    75: 'Latin Capital Letter K',
    76: 'Latin Capital Letter L',
    77: 'Latin Capital Letter M',
    78: 'Latin Capital Letter N',
    79: 'Latin Capital Letter O',
    80: 'Latin Capital Letter P',
    81: 'Latin Capital Letter Q',
    82: 'Latin Capital Letter R',
    83: 'Latin Capital Letter S',
    84: 'Latin Capital Letter T',
    85: 'Latin Capital Letter U',
    86: 'Latin Capital Letter V',
    87: 'Latin Capital Letter W',
    88: 'Latin Capital Letter X',
    89: 'Latin Capital Letter Y',
    90: 'Latin Capital Letter Z',
    91: 'Left Square Bracket',
    92: 'Reverse Solidus',
    93: 'Right Square Bracket',
    94: 'Circumflex Accent',
    95: 'Low Line',
    96: 'Grave Accent',
    97: 'Latin Small Letter A',
    98: 'Latin Small Letter B',
    99: 'Latin Small Letter C',
    100: 'Latin Small Letter D',
    101: 'Latin Small Letter E',
    102: 'Latin Small Letter F',
    103: 'Latin Small Letter G',
    104: 'Latin Small Letter H',
    105: 'Latin Small Letter I',
    106: 'Latin Small Letter J',
    107: 'Latin Small Letter K',
    108: 'Latin Small Letter L',
    109: 'Latin Small Letter M',
    110: 'Latin Small Letter N',
    111: 'Latin Small Letter O',
    112: 'Latin Small Letter P',
    113: 'Latin Small Letter Q',
    114: 'Latin Small Letter R',
    115: 'Latin Small Letter S',
    116: 'Latin Small Letter T',
    117: 'Latin Small Letter U',
    118: 'Latin Small Letter V',
    119: 'Latin Small Letter W',
    120: 'Latin Small Letter X',
    121: 'Latin Small Letter Y',
    122: 'Latin Small Letter Z',
    123: 'Left Curly Bracket',
    124: 'Vertical Line',
    125: 'Right Curly Bracket',
    126: 'Tilde',
    8364: 'Euro Sign'
  }
  return names[code] || null
}

// 获取 UTF-8 字节
const getUTF8Bytes = (code) => {
  if (code <= 0x7F) {
    return [code]
  } else if (code <= 0x7FF) {
    return [0xC0 | (code >> 6), 0x80 | (code & 0x3F)]
  } else if (code <= 0xFFFF) {
    return [0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F)]
  } else {
    return [0xF0 | (code >> 18), 0x80 | ((code >> 12) & 0x3F), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F)]
  }
}

// 解析输入
const parseInput = (text, format) => {
  let chars = []

  switch (format) {
    case 'text':
      chars = text.split('')
      break

    case 'decimal':
      chars = text.split(separator.value).filter(s => s).map(s => {
        const code = parseInt(s.trim())
        return code ? String.fromCodePoint(code) : ''
      })
      break

    case 'hexadecimal':
      chars = text.split(separator.value).filter(s => s).map(s => {
        const code = parseInt(s.trim(), 16)
        return code ? String.fromCodePoint(code) : ''
      })
      break

    case 'javascript':
    case 'python':
    case 'java':
    case 'c':
      // 解析转义序列
      const escapeRegex = /\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{8})/g
      let lastIndex = 0
      let match

      // 添加普通文本部分
      while ((match = escapeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          const normalText = text.slice(lastIndex, match.index)
          chars.push(...normalText.split(''))
        }

        const code = parseInt(match[1] || match[2], 16)
        chars.push(String.fromCodePoint(code))
        lastIndex = match.index + match[0].length
      }

      if (lastIndex < text.length) {
        const remainingText = text.slice(lastIndex)
        chars.push(...remainingText.split(''))
      }
      break
  }

  return chars.filter(char => char !== '')
}

// 转换函数
const convert = () => {
  if (!inputText.value) {
    outputs.value = {
      text: '',
      decimal: '',
      hexadecimal: '',
      javascript: ''
    }
    unicodeDetails.value = []
    return
  }

  const chars = parseInput(inputText.value, inputFormat.value)

  // 生成输出
  outputs.value.text = chars.join('')
  outputs.value.decimal = chars.map(char => char.charCodeAt(0)).join(separator.value)
  outputs.value.hexadecimal = chars.map(char => char.charCodeAt(0).toString(16)).join(separator.value)
  outputs.value.javascript = chars.map(char => {
    const code = char.charCodeAt(0)
    return '\\u' + code.toString(16).toUpperCase().padStart(4, '0')
  }).join('')

  // 生成详细信息
  unicodeDetails.value = chars.slice(0, 20).map(char => getUnicodeInfo(char))
}

// 加载示例
const loadExample = () => {
  inputText.value = 'Hello 世界! 🌍'
  inputFormat.value = 'text'
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

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputs.value = {
    text: '',
    decimal: '',
    hexadecimal: '',
    javascript: ''
  }
  unicodeDetails.value = []
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
watch([inputText, inputFormat, separator], () => {
  convert()
})

// SEO配置
useSeoMeta({
  title: 'Unicode转换器 - 在线Unicode编码转换工具',
  description: '免费在线Unicode转换工具，支持文本、Unicode码点、转义序列之间的相互转换，支持多种编程语言格式。',
  keywords: ['unicode', '转换', 'converter', '码点', '转义序列', '在线工具', '编码转换']
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