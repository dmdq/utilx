<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">罗马数字转换</h1>
      <p class="text-muted-foreground">罗马数字与阿拉伯数字互转，支持大数字和规范格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：阿拉伯数字转罗马数字 -->
      <div class="space-y-4">
        <!-- 输入阿拉伯数字 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">阿拉伯数字 → 罗马数字</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入阿拉伯数字</label>
              <input
                v-model.number="arabicInput"
                @input="convertToRoman"
                type="number"
                min="1"
                max="3999999"
                placeholder="请输入1-3999999之间的数字"
                class="w-full px-3 py-2 border rounded-md"
              >
              <div class="mt-2 text-xs text-muted-foreground">
                支持范围：1 - 3,999,999
              </div>
            </div>

            <!-- 转换结果 -->
            <div v-if="arabicInput && romanResult" class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">罗马数字：</span>
                <button
                  @click="copyToClipboard(romanResult)"
                  class="p-1 hover:bg-background rounded transition-colors"
                  title="复制"
                >
                  <Copy class="w-4 h-4" />
                </button>
              </div>
              <div class="font-mono text-lg break-all">{{ romanResult }}</div>
            </div>

            <!-- 错误提示 -->
            <div v-if="arabicError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {{ arabicError }}
            </div>

            <!-- 示例数字 -->
            <div>
              <label class="block text-sm font-medium mb-2">常用示例</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="example in arabicExamples"
                  :key="example.value"
                  @click="arabicInput = example.value; convertToRoman()"
                  class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
                >
                  {{ example.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 罗马数字规则说明 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">罗马数字规则</h3>
          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <strong class="text-foreground">基本符号：</strong>
                <ul class="mt-1 space-y-1 font-mono">
                  <li>I = 1</li>
                  <li>V = 5</li>
                  <li>X = 10</li>
                  <li>L = 50</li>
                  <li>C = 100</li>
                  <li>D = 500</li>
                  <li>M = 1000</li>
                </ul>
              </div>
              <div>
                <strong class="text-foreground">减法规则：</strong>
                <ul class="mt-1 space-y-1 font-mono">
                  <li>IV = 4 (5-1)</li>
                  <li>IX = 9 (10-1)</li>
                  <li>XL = 40 (50-10)</li>
                  <li>XC = 90 (100-10)</li>
                  <li>CD = 400 (500-100)</li>
                  <li>CM = 900 (1000-100)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：罗马数字转阿拉伯数字 -->
      <div class="space-y-4">
        <!-- 输入罗马数字 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">罗马数字 → 阿拉伯数字</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入罗马数字</label>
              <input
                v-model="romanInput"
                @input="convertToArabic"
                type="text"
                placeholder="请输入罗马数字，如：XIX, MMXXIII"
                class="w-full px-3 py-2 border rounded-md font-mono uppercase"
              >
              <div class="mt-2 text-xs text-muted-foreground">
                请使用大写字母：I, V, X, L, C, D, M
              </div>
            </div>

            <!-- 转换结果 -->
            <div v-if="romanInput && arabicResult !== null" class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">阿拉伯数字：</span>
                <button
                  @click="copyToClipboard(arabicResult.toString())"
                  class="p-1 hover:bg-background rounded transition-colors"
                  title="复制"
                >
                  <Copy class="w-4 h-4" />
                </button>
              </div>
              <div class="font-mono text-lg">{{ arabicResult.toLocaleString() }}</div>
            </div>

            <!-- 错误提示 -->
            <div v-if="romanError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {{ romanError }}
            </div>

            <!-- 示例罗马数字 -->
            <div>
              <label class="block text-sm font-medium mb-2">常用示例</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="example in romanExamples"
                  :key="example.value"
                  @click="romanInput = example.value; convertToArabic()"
                  class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm font-mono"
                >
                  {{ example.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 验证工具 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">罗马数字验证</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入验证文本</label>
              <input
                v-model="validateInput"
                @input="validateRoman"
                type="text"
                placeholder="输入要验证的罗马数字"
                class="w-full px-3 py-2 border rounded-md font-mono"
              >
            </div>

            <div v-if="validateInput" class="p-4 rounded-lg" :class="isValidRoman ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <div class="flex items-center gap-2" :class="isValidRoman ? 'text-green-700' : 'text-red-700'">
                <Check v-if="isValidRoman" class="w-5 h-5" />
                <X v-else class="w-5 h-5" />
                <span class="font-medium">
                  {{ isValidRoman ? '有效的罗马数字' : '无效的罗马数字' }}
                </span>
              </div>
              <div v-if="isValidRoman && validatedValue" class="mt-2 text-sm">
                对应阿拉伯数字：<span class="font-mono font-bold">{{ validatedValue.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 大数字转换参考表 -->
    <div class="mt-6 bg-card rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">大数字参考表</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">阿拉伯数字</th>
              <th class="text-left py-2">罗马数字</th>
              <th class="text-left py-2">读法</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in largeNumberTable" :key="item.arabic" class="border-b">
              <td class="py-2">{{ item.arabic.toLocaleString() }}</td>
              <td class="py-2 font-mono">{{ item.roman }}</td>
              <td class="py-2">{{ item.reading }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-6 bg-card rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <Info class="w-5 h-5 text-primary" />
        使用说明
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
        <div>
          <h4 class="font-medium text-foreground mb-2">转换说明</h4>
          <ul class="space-y-1 list-disc list-inside">
            <li>支持1到3,999,999之间的数字转换</li>
            <li>自动应用减法规则优化表示</li>
            <li>支持验证罗马数字的有效性</li>
            <li>点击结果可快速复制到剪贴板</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">使用场景</h4>
          <ul class="space-y-1 list-disc list-inside">
            <li>历史年代标记（如：MCMLXXXVIII = 1988）</li>
            <li>书籍章节编号</li>
            <li>正式文件的序列号</li>
            <li>时钟表盘数字显示</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 复制成功提示 -->
    <div
      v-if="copySuccess"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity"
    >
      已复制到剪贴板
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Copy, X, Check, Info } from 'lucide-vue-next'

// 状态管理
const arabicInput = ref(null)
const romanInput = ref('')
const romanResult = ref('')
const arabicResult = ref(null)
const arabicError = ref('')
const romanError = ref('')
const validateInput = ref('')
const isValidRoman = ref(false)
const validatedValue = ref(null)
const copySuccess = ref(false)

// 罗马数字映射
const romanNumerals = [
  { value: 1000000, numeral: 'M̅' },
  { value: 500000, numeral: 'D̅' },
  { value: 100000, numeral: 'C̅' },
  { value: 50000, numeral: 'L̅' },
  { value: 10000, numeral: 'X̅' },
  { value: 9000, numeral: 'I̅X̅' },
  { value: 8000, numeral: 'V̅I̅I̅I̅' },
  { value: 7000, numeral: 'V̅I̅I̅' },
  { value: 6000, numeral: 'V̅I̅' },
  { value: 5000, numeral: 'V̅' },
  { value: 4000, numeral: 'I̅V̅' },
  { value: 3000, numeral: 'MMM' },
  { value: 2000, numeral: 'MM' },
  { value: 1000, numeral: 'M' },
  { value: 900, numeral: 'CM' },
  { value: 800, numeral: 'DCCC' },
  { value: 700, numeral: 'DCC' },
  { value: 600, numeral: 'DC' },
  { value: 500, numeral: 'D' },
  { value: 400, numeral: 'CD' },
  { value: 300, numeral: 'CCC' },
  { value: 200, numeral: 'CC' },
  { value: 100, numeral: 'C' },
  { value: 90, numeral: 'XC' },
  { value: 80, numeral: 'LXXX' },
  { value: 70, numeral: 'LXX' },
  { value: 60, numeral: 'LX' },
  { value: 50, numeral: 'L' },
  { value: 40, numeral: 'XL' },
  { value: 30, numeral: 'XXX' },
  { value: 20, numeral: 'XX' },
  { value: 10, numeral: 'X' },
  { value: 9, numeral: 'IX' },
  { value: 8, numeral: 'VIII' },
  { value: 7, numeral: 'VII' },
  { value: 6, numeral: 'VI' },
  { value: 5, numeral: 'V' },
  { value: 4, numeral: 'IV' },
  { value: 3, numeral: 'III' },
  { value: 2, numeral: 'II' },
  { value: 1, numeral: 'I' }
]

// 简化的罗马数字映射（用于验证）
const simpleRomanMap = {
  'I': 1,
  'V': 5,
  'X': 10,
  'L': 50,
  'C': 100,
  'D': 500,
  'M': 1000
}

// 示例数据
const arabicExamples = [
  { value: 1, label: '1' },
  { value: 4, label: '4' },
  { value: 9, label: '9' },
  { value: 40, label: '40' },
  { value: 99, label: '99' },
  { value: 2024, label: '2024' }
]

const romanExamples = [
  { value: 'I', label: 'I' },
  { value: 'IV', label: 'IV' },
  { value: 'XLII', label: 'XLII' },
  { value: 'XCIX', label: 'XCIX' },
  { value: 'CDXLIV', label: 'CDXLIV' },
  { value: 'MMXXIV', label: 'MMXXIV' }
]

// 大数字参考表
const largeNumberTable = [
  { arabic: 1000, roman: 'M', reading: '一千' },
  { arabic: 5000, roman: 'V̅', reading: '五千' },
  { arabic: 10000, roman: 'X̅', reading: '一万' },
  { arabic: 50000, roman: 'L̅', reading: '五万' },
  { arabic: 100000, roman: 'C̅', reading: '十万' },
  { arabic: 500000, roman: 'D̅', reading: '五十万' },
  { arabic: 1000000, roman: 'M̅', reading: '一百万' }
]

// 阿拉伯数字转罗马数字
const convertToRoman = () => {
  if (!arabicInput.value) {
    romanResult.value = ''
    arabicError.value = ''
    return
  }

  const num = parseInt(arabicInput.value)

  if (isNaN(num) || num < 1 || num > 3999999) {
    romanResult.value = ''
    arabicError.value = '请输入1到3,999,999之间的整数'
    return
  }

  arabicError.value = ''
  let remaining = num
  let result = ''

  for (const { value, numeral } of romanNumerals) {
    while (remaining >= value) {
      result += numeral
      remaining -= value
    }
  }

  romanResult.value = result
}

// 罗马数字转阿拉伯数字
const convertToArabic = () => {
  if (!romanInput.value) {
    arabicResult.value = null
    romanError.value = ''
    return
  }

  const roman = romanInput.value.toUpperCase().replace(/\s/g, '')

  if (!/^[IVXLCDM]+$/.test(roman)) {
    arabicResult.value = null
    romanError.value = '包含无效字符，请只使用 I, V, X, L, C, D, M'
    return
  }

  try {
    let total = 0
    let i = 0

    while (i < roman.length) {
      const current = simpleRomanMap[roman[i]]
      const next = simpleRomanMap[roman[i + 1]]

      if (next && current < next) {
        total += next - current
        i += 2
      } else {
        total += current
        i += 1
      }
    }

    // 验证转换结果是否正确
    const verification = parseInt(arabicToRoman(total))
    if (verification !== total) {
      romanError.value = '无效的罗马数字格式'
      arabicResult.value = null
      return
    }

    romanError.value = ''
    arabicResult.value = total
  } catch (error) {
    arabicResult.value = null
    romanError.value = '转换失败：' + error.message
  }
}

// 验证罗马数字
const validateRoman = () => {
  if (!validateInput.value) {
    isValidRoman.value = false
    validatedValue.value = null
    return
  }

  const roman = validateInput.value.toUpperCase().replace(/\s/g, '')

  if (!/^[IVXLCDM]+$/.test(roman)) {
    isValidRoman.value = false
    validatedValue.value = null
    return
  }

  try {
    let total = 0
    let i = 0

    while (i < roman.length) {
      const current = simpleRomanMap[roman[i]]
      const next = simpleRomanMap[roman[i + 1]]

      if (next && current < next) {
        total += next - current
        i += 2
      } else {
        total += current
        i += 1
      }
    }

    const verification = parseInt(arabicToRoman(total))
    isValidRoman.value = verification === total
    validatedValue.value = isValidRoman.value ? total : null
  } catch (error) {
    isValidRoman.value = false
    validatedValue.value = null
  }
}

// 辅助函数：阿拉伯数字转罗马数字（用于验证）
const arabicToRoman = (num) => {
  let remaining = num
  let result = ''

  for (const { value, numeral } of romanNumerals.filter(n => n.value <= 3999)) {
    while (remaining >= value) {
      result += numeral
      remaining -= value
    }
  }

  return result
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// SEO配置
useSeoMeta({
  title: '罗马数字转换 - 罗马数字与阿拉伯数字互转工具',
  description: '免费在线罗马数字转换工具，支持罗马数字和阿拉伯数字互转，验证罗马数字有效性，支持大数字转换。',
  keywords: ['罗马数字转换', '阿拉伯数字转换', 'Roman numeral', '数字转换', '在线工具']
})

definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
/* 自定义样式 */
.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>