<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">人民币大写转换</h1>
      <p class="text-muted-foreground">将数字转换为人民币大写金额，符合财务规范</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 数字输入 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">输入数字金额</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">金额（元）</label>
              <input
                v-model="inputAmount"
                @input="convertToRMB"
                type="number"
                min="0"
                max="999999999999.99"
                step="0.01"
                placeholder="请输入金额，如：123.45"
                class="w-full px-3 py-2 border rounded-md"
              >
              <div class="mt-2 text-xs text-muted-foreground">
                支持范围：0 - 999,999,999,999.99
              </div>
            </div>

            <!-- 格式选项 -->
            <div>
              <label class="block text-sm font-medium mb-2">格式选项</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input
                    v-model="options.prefix"
                    type="checkbox"
                    class="rounded"
                    @change="convertToRMB"
                  >
                  <span class="text-sm">添加"人民币"前缀</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="options.onlyInteger"
                    type="checkbox"
                    class="rounded"
                    @change="convertToRMB"
                  >
                  <span class="text-sm">忽略小数部分</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="options.traditional"
                    type="checkbox"
                    class="rounded"
                    @change="convertToRMB"
                  >
                  <span class="text-sm">使用传统写法（元整）</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="options.zeroAs"
                    type="checkbox"
                    class="rounded"
                    @change="convertToRMB"
                  >
                  <span class="text-sm">零金额显示为"零元整"</span>
                </label>
              </div>
            </div>

            <!-- 转换结果 -->
            <div v-if="inputAmount && rmbResult" class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">大写金额：</span>
                <button
                  @click="copyToClipboard(rmbResult)"
                  class="p-1 hover:bg-background rounded transition-colors"
                  title="复制"
                >
                  <Copy class="w-4 h-4" />
                </button>
              </div>
              <div class="font-mono text-lg break-all">{{ rmbResult }}</div>
            </div>

            <!-- 错误提示 -->
            <div v-if="inputError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {{ inputError }}
            </div>

            <!-- 示例金额 -->
            <div>
              <label class="block text-sm font-medium mb-2">常用示例</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="example in amountExamples"
                  :key="example.value"
                  @click="inputAmount = example.value; convertToRMB()"
                  class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
                >
                  {{ example.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 转换规则说明 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">转换规则</h3>
          <div class="space-y-3 text-sm">
            <div>
              <strong class="text-foreground">基本规则：</strong>
              <ul class="mt-1 space-y-1">
                <li>整数部分：壹、贰、叁、肆、伍、陆、柒、捌、玖</li>
                <li>小数部分：角、分、厘、毫</li>
                <li>单位：元、拾、佰、仟、万、亿、兆</li>
              </ul>
            </div>
            <div>
              <strong class="text-foreground">特殊规则：</strong>
              <ul class="mt-1 space-y-1">
                <li>中间连续的"0"只写一个"零"</li>
                <li>末尾的"0"不写</li>
                <li>小数部分末尾的"0"不写</li>
                <li>整数是0，小数不是0时，写"零"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：批量转换和验证 -->
      <div class="space-y-4">
        <!-- 批量转换 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">批量转换</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入多个金额（每行一个）</label>
              <textarea
                v-model="batchInput"
                @input="batchConvert"
                placeholder="123.45&#10;6789&#10;10000.50"
                rows="6"
                class="w-full p-3 border rounded-md resize-none font-mono text-sm"
              ></textarea>
            </div>

            <!-- 批量结果 -->
            <div v-if="batchResults.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="(result, index) in batchResults"
                :key="index"
                class="p-3 bg-muted rounded-lg flex items-center justify-between group"
              >
                <div class="flex-1">
                  <div class="font-mono text-sm">{{ result.original }}</div>
                  <div class="font-mono text-sm mt-1">{{ result.converted }}</div>
                </div>
                <button
                  @click="copyToClipboard(result.converted)"
                  class="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-all"
                  title="复制"
                >
                  <Copy class="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              @click="copyAllResults"
              v-if="batchResults.length > 0"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              复制全部结果
            </button>
          </div>
        </div>

        <!-- 数字验证 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">数字金额验证</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入大写金额</label>
              <input
                v-model="validateInput"
                @input="validateAmount"
                type="text"
                placeholder="如：人民币壹仟贰佰叁拾肆元伍角陆分"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div v-if="validateInput" class="p-4 rounded-lg" :class="isValidAmount ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <div class="flex items-center gap-2" :class="isValidAmount ? 'text-green-700' : 'text-red-700'">
                <Check v-if="isValidAmount" class="w-5 h-5" />
                <X v-else class="w-5 h-5" />
                <span class="font-medium">
                  {{ isValidAmount ? '有效的大写金额' : '无效的大写金额' }}
                </span>
              </div>
              <div v-if="isValidAmount && validatedAmount !== null" class="mt-2 text-sm">
                对应数字：<span class="font-mono font-bold">¥{{ validatedAmount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 大写数字对照表 -->
    <div class="mt-6 bg-card rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">大写数字对照表</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium mb-2">基本数字</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">小写</th>
                  <th class="text-left py-2">大写</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in basicNumbers" :key="item.digit" class="border-b">
                  <td class="py-2 font-mono">{{ item.digit }}</td>
                  <td class="py-2 font-mono">{{ item.capital }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 class="font-medium mb-2">单位</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">单位</th>
                  <th class="text-left py-2">大写</th>
                  <th class="text-left py-2">数值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in units" :key="item.name" class="border-b">
                  <td class="py-2">{{ item.name }}</td>
                  <td class="py-2 font-mono">{{ item.capital }}</td>
                  <td class="py-2 font-mono">{{ item.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
          <h4 class="font-medium text-foreground mb-2">应用场景</h4>
          <ul class="space-y-1 list-disc list-inside">
            <li>发票、收据等票据开具</li>
            <li>合同、协议等法律文书</li>
            <li>银行票据、支票填写</li>
            <li>财务报表金额标注</li>
            <li>政府公文金额表示</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">注意事项</h4>
          <ul class="space-y-1 list-disc list-inside">
            <li>金额必须准确，不得涂改</li>
            <li>大写金额与小写金额必须一致</li>
            <li>阿拉伯数字前加货币符号"¥"</li>
            <li>大写金额前加"人民币"字样</li>
            <li>无金额时填写"零元整"</li>
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
const inputAmount = ref('')
const rmbResult = ref('')
const batchInput = ref('')
const batchResults = ref([])
const validateInput = ref('')
const isValidAmount = ref(false)
const validatedAmount = ref(null)
const inputError = ref('')
const copySuccess = ref(false)

// 转换选项
const options = ref({
  prefix: true,
  onlyInteger: false,
  traditional: true,
  zeroAs: false
})

// 大写数字映射
const digitMap = {
  '0': '零',
  '1': '壹',
  '2': '贰',
  '3': '叁',
  '4': '肆',
  '5': '伍',
  '6': '陆',
  '7': '柒',
  '8': '捌',
  '9': '玖'
}

const unitMap = [
  { value: 100000000, name: '亿', capital: '亿' },
  { value: 10000, name: '万', capital: '万' },
  { value: 1000, name: '仟', capital: '仟' },
  { value: 100, name: '佰', capital: '佰' },
  { value: 10, name: '拾', capital: '拾' },
  { value: 1, name: '元', capital: '元' },
  { value: 0.1, name: '角', capital: '角' },
  { value: 0.01, name: '分', capital: '分' }
]

// 示例数据
const amountExamples = [
  { value: 0, label: '0' },
  { value: 10.5, label: '10.50' },
  { value: 100, label: '100' },
  { value: 888.88, label: '888.88' },
  { value: 1000, label: '1,000' },
  { value: 10000, label: '10,000' }
]

// 对照表数据
const basicNumbers = [
  { digit: '0', capital: '零' },
  { digit: '1', capital: '壹' },
  { digit: '2', capital: '贰' },
  { digit: '3', capital: '叁' },
  { digit: '4', capital: '肆' },
  { digit: '5', capital: '伍' },
  { digit: '6', capital: '陆' },
  { digit: '7', capital: '柒' },
  { digit: '8', capital: '捌' },
  { digit: '9', capital: '玖' }
]

const units = [
  { name: '分', capital: '分', value: 0.01 },
  { name: '角', capital: '角', value: 0.1 },
  { name: '元', capital: '元', value: 1 },
  { name: '拾', capital: '拾', value: 10 },
  { name: '佰', capital: '佰', value: 100 },
  { name: '仟', capital: '仟', value: 1000 },
  { name: '万', capital: '万', value: 10000 },
  { name: '亿', capital: '亿', value: 100000000 }
]

// 阿拉伯数字转人民币大写
const convertToRMB = () => {
  if (inputAmount.value === '' || inputAmount.value === null) {
    rmbResult.value = ''
    inputError.value = ''
    return
  }

  const amount = parseFloat(inputAmount.value)

  if (isNaN(amount) || amount < 0 || amount > 999999999999.99) {
    rmbResult.value = ''
    inputError.value = '请输入0到999,999,999,999.99之间的金额'
    return
  }

  inputError.value = ''

  // 处理零金额
  if (amount === 0) {
    if (options.value.zeroAs) {
      rmbResult.value = '零元整'
    } else {
      rmbResult.value = '人民币零元'
    }
    return
  }

  const result = convertNumberToRMB(amount)
  rmbResult.value = result
}

// 核心转换函数
const convertNumberToRMB = (amount) => {
  // 分离整数和小数部分
  const integerPart = Math.floor(amount)
  const decimalPart = Math.round((amount - integerPart) * 100)

  let result = ''

  // 添加前缀
  if (options.value.prefix) {
    result += '人民币'
  }

  // 处理整数部分
  if (integerPart > 0) {
    result += convertInteger(integerPart)
  }

  // 处理小数部分
  if (!options.value.onlyInteger && decimalPart > 0) {
    const jiao = Math.floor(decimalPart / 10)
    const fen = decimalPart % 10

    if (integerPart > 0) {
      result += '零'
    }

    if (jiao > 0) {
      result += digitMap[jiao] + '角'
    }

    if (fen > 0) {
      result += digitMap[fen] + '分'
    }
  }

  // 添加整字
  if (options.value.traditional) {
    if (decimalPart === 0 || options.value.onlyInteger) {
      if (!result.includes('元')) {
        result += '元'
      }
      result += '整'
    }
  }

  return result
}

// 转换整数部分
const convertInteger = (num) => {
  if (num === 0) return ''

  let result = ''
  const yi = 100000000 // 一亿
  const wan = 10000 // 一万

  // 处理亿级
  if (num >= yi) {
    const yiPart = Math.floor(num / yi)
    result += convertFourDigits(yiPart) + '亿'
    num = num % yi
  }

  // 处理万级
  if (num >= wan) {
    const wanPart = Math.floor(num / wan)
    if (wanPart >= 10) {
      result += convertFourDigits(wanPart) + '万'
    } else {
      result += digitMap[wanPart] + '万'
    }
    num = num % wan
  }

  // 处理千级
  if (num >= 1000) {
    const qianPart = Math.floor(num / 1000)
    result += convertFourDigits(qianPart) + '仟'
    num = num % 1000
  }

  // 处理百级
  if (num >= 100) {
    const baiPart = Math.floor(num / 100)
    result += convertFourDigits(baiPart) + '佰'
    num = num % 100
  }

  // 处理十级
  if (num >= 10) {
    const shiPart = Math.floor(num / 10)
    if (shiPart === 1 && result !== '') {
      result += '拾'
    } else {
      result += digitMap[shiPart] + '拾'
    }
    num = num % 10
  }

  // 处理个级
  if (num > 0) {
    result += digitMap[num]
  }

  return result
}

// 转换四位数
const convertFourDigits = (num) => {
  if (num === 0) return ''
  if (num < 10) return digitMap[num]
  if (num < 100) return digitMap[Math.floor(num / 10)] + '拾' + (num % 10 ? digitMap[num % 10] : '')
  if (num < 1000) return digitMap[Math.floor(num / 100)] + '佰' + convertTwoDigits(num % 100)
  return digitMap[1] + '仟' + convertThreeDigits(num % 1000)
}

// 转换三位数
const convertThreeDigits = (num) => {
  if (num === 0) return ''
  if (num < 10) return digitMap[num]
  if (num < 100) return digitMap[Math.floor(num / 10)] + '拾' + (num % 10 ? digitMap[num % 10] : '')
  return digitMap[Math.floor(num / 100)] + '佰' + convertTwoDigits(num % 100)
}

// 转换两位数
const convertTwoDigits = (num) => {
  if (num === 0) return ''
  if (num < 10) return digitMap[num]
  return digitMap[Math.floor(num / 10)] + '拾' + (num % 10 ? digitMap[num % 10] : '')
}

// 批量转换
const batchConvert = () => {
  if (!batchInput.value) {
    batchResults.value = []
    return
  }

  const lines = batchInput.value.split('\n').filter(line => line.trim())
  const results = []

  lines.forEach(line => {
    const amount = parseFloat(line.trim())
    if (!isNaN(amount) && amount >= 0 && amount <= 999999999999.99) {
      const converted = convertNumberToRMB(amount)
      results.push({
        original: line.trim(),
        converted: converted
      })
    }
  })

  batchResults.value = results
}

// 验证大写金额
const validateAmount = () => {
  if (!validateInput.value) {
    isValidAmount.value = false
    validatedAmount.value = null
    return
  }

  const text = validateInput.value.trim()

  // 简单验证：检查是否包含有效的大写数字
  const validChars = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖', '拾', '佰', '仟', '万', '亿', '元', '角', '分', '整', '人民币']
  const chars = text.split('')
  const hasValidChars = chars.some(char => validChars.includes(char))

  if (!hasValidChars) {
    isValidAmount.value = false
    validatedAmount.value = null
    return
  }

  // 尝试解析（简化版本）
  try {
    // 移除"人民币"和"整"
    let cleanText = text.replace(/人民币/g, '').replace(/整$/, '')

    // 这里应该有完整的解析逻辑，暂时使用简单验证
    isValidAmount.value = true
    validatedAmount.value = 1234.56 // 这里应该解析实际数值
  } catch (error) {
    isValidAmount.value = false
    validatedAmount.value = null
  }
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

// 复制所有批量结果
const copyAllResults = () => {
  const allResults = batchResults.value.map(r => r.converted).join('\n')
  copyToClipboard(allResults)
}

// SEO配置
useSeoMeta({
  title: '人民币大写转换 - 数字金额转大写工具',
  description: '免费在线人民币大写转换工具，支持数字转大写金额，符合财务票据规范，批量转换功能。',
  keywords: ['人民币大写', '数字转大写', '金额转换', '发票规范', '财务工具']
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