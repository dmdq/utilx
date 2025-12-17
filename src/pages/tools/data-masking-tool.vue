<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">数据脱敏工具</h1>
      <p class="text-muted-foreground mb-4">对敏感数据进行脱敏处理，保护隐私信息，支持多种脱敏规则</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧输入和控制 -->
      <div class="space-y-6">
        <!-- 数据输入 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">数据输入</h3>
            <div class="flex gap-2">
              <button
                @click="loadSampleData"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                加载示例
              </button>
              <button
                @click="clearData"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium mb-2">输入格式</label>
            <div class="flex gap-2">
              <button
                v-for="format in inputFormats"
                :key="format.id"
                @click="inputFormat = format.id"
                :class="[
                  'px-3 py-1 rounded text-sm',
                  inputFormat === format.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                ]"
              >
                {{ format.name }}
              </button>
            </div>
          </div>

          <textarea
            v-model="inputData"
            class="w-full h-48 p-3 font-mono text-sm border rounded-md resize-none"
            :placeholder="getPlaceholder()"
          ></textarea>

          <div class="mt-2 text-sm text-muted-foreground">
            数据行数: {{ getInputLineCount() }}
          </div>
        </div>

        <!-- 脱敏规则 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">脱敏规则</h3>

          <!-- 预设规则 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">快速预设</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="preset in maskingPresets"
                :key="preset.id"
                @click="applyPreset(preset)"
                class="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>

          <!-- 自定义规则 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-medium">自定义规则</h4>
              <button
                @click="addCustomRule"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                添加规则
              </button>
            </div>

            <div
              v-for="(rule, index) in customRules"
              :key="index"
              class="border rounded-lg p-3 space-y-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">规则 {{ index + 1 }}</span>
                <button
                  @click="removeCustomRule(index)"
                  class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                >
                  删除
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-medium mb-1">模式</label>
                  <input
                    v-model="rule.pattern"
                    placeholder="正则表达式"
                    class="w-full px-2 py-1 text-sm border rounded"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">方法</label>
                  <select v-model="rule.method" class="w-full px-2 py-1 text-sm border rounded">
                    <option value="mask">遮蔽</option>
                    <option value="replace">替换</option>
                    <option value="hash">哈希</option>
                    <option value="encrypt">加密</option>
                  </select>
                </div>
              </div>

              <div v-if="rule.method === 'mask'" class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-medium mb-1">保留前几位</label>
                  <input
                    v-model.number="rule.keepStart"
                    type="number"
                    min="0"
                    class="w-full px-2 py-1 text-sm border rounded"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium mb-1">保留后几位</label>
                  <input
                    v-model.number="rule.keepEnd"
                    type="number"
                    min="0"
                    class="w-full px-2 py-1 text-sm border rounded"
                  >
                </div>
              </div>

              <div v-if="rule.method === 'replace'">
                <label class="block text-xs font-medium mb-1">替换文本</label>
                <input
                  v-model="rule.replacement"
                  placeholder="替换成的文本"
                  class="w-full px-2 py-1 text-sm border rounded"
                >
              </div>

              <div>
                <label class="block text-xs font-medium mb-1">测试</label>
                <div class="flex gap-2">
                  <input
                    v-model="rule.testInput"
                    placeholder="测试输入"
                    class="flex-1 px-2 py-1 text-sm border rounded"
                  >
                  <div class="px-2 py-1 bg-muted rounded text-sm min-w-0 flex-1 truncate">
                    {{ testRule(rule) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 脱敏选项 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">脱敏选项</h3>

          <div class="space-y-3">
            <div class="flex items-center">
              <input
                v-model="options.preserveFormat"
                type="checkbox"
                id="preserve-format"
                class="mr-2"
              >
              <label for="preserve-format" class="text-sm">保持数据格式</label>
            </div>

            <div class="flex items-center">
              <input
                v-model="options.consistentMasking"
                type="checkbox"
                id="consistent-masking"
                class="mr-2"
              >
              <label for="consistent-masking" class="text-sm">一致性脱敏</label>
            </div>

            <div v-if="options.consistentMasking">
              <label class="block text-sm font-medium mb-1">脱敏密钥</label>
              <input
                v-model="options.maskingKey"
                type="password"
                placeholder="密钥用于一致性脱敏"
                class="w-full px-3 py-2 border rounded"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">遮蔽字符</label>
              <input
                v-model="options.maskChar"
                maxlength="1"
                placeholder="默认: *"
                class="w-full px-3 py-2 border rounded"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧结果输出 -->
      <div class="space-y-6">
        <!-- 脱敏结果 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">脱敏结果</h3>
            <div class="flex gap-2">
              <button
                @click="applyMasking"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                执行脱敏
              </button>
              <button
                @click="copyResults"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                复制
              </button>
              <button
                @click="downloadResults"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                下载
              </button>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="mb-4 p-3 bg-muted rounded-md">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium">原始数据:</span> {{ getInputLineCount() }} 项
              </div>
              <div>
                <span class="font-medium">脱敏数据:</span> {{ getOutputLineCount() }} 项
              </div>
              <div>
                <span class="font-medium">检测字段:</span> {{ detectedFields.length }}
              </div>
              <div>
                <span class="font-medium">应用规则:</span> {{ activeRules.length }}
              </div>
            </div>
          </div>

          <!-- 字段检测 -->
          <div class="mb-4">
            <h4 class="text-sm font-medium mb-2">检测到的敏感字段</h4>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="field in detectedFields"
                :key="field.name"
                :class="[
                  'px-2 py-1 rounded text-xs',
                  field.detected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ field.name }} ({{ field.type }})
              </span>
            </div>
          </div>

          <!-- 结果预览 -->
          <div class="border rounded-md overflow-hidden">
            <div class="bg-muted px-3 py-2 text-sm font-medium">脱敏后数据</div>
            <pre class="p-3 text-sm overflow-x-auto max-h-96 overflow-y-auto bg-white">{{ maskedData || '点击"执行脱敏"按钮开始处理' }}</pre>
          </div>
        </div>

        <!-- 脱敏对比 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">脱敏对比</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium mb-2">原始数据示例</h4>
              <div class="border rounded-md p-3 bg-gray-50 max-h-32 overflow-y-auto">
                <pre class="text-xs">{{ getSampleOriginalData() }}</pre>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium mb-2">脱敏数据示例</h4>
              <div class="border rounded-md p-3 bg-blue-50 max-h-32 overflow-y-auto">
                <pre class="text-xs">{{ getSampleMaskedData() }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 脱敏说明 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">脱敏方法说明</h3>
          <div class="space-y-2 text-sm text-muted-foreground">
            <div>
              <strong>遮蔽 (Mask):</strong> 保留部分字符，其余用指定字符遮蔽
            </div>
            <div>
              <strong>替换 (Replace):</strong> 用指定的文本替换整个敏感信息
            </div>
            <div>
              <strong>哈希 (Hash):</strong> 使用哈希算法生成不可逆的标识符
            </div>
            <div>
              <strong>加密 (Encrypt):</strong> 使用加密算法保护数据，可解密还原
            </div>
            <div class="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
              <strong class="text-yellow-800">⚠️ 安全提示:</strong> 脱敏后的数据仍需妥善保管，避免泄露敏感信息。
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

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('数据脱敏工具 - 在线敏感数据脱敏处理')

// 数据
const inputData = ref('')
const maskedData = ref('')
const inputFormat = ref('json')

// 输入格式
const inputFormats = [
  { id: 'json', name: 'JSON' },
  { id: 'csv', name: 'CSV' },
  { id: 'text', name: '文本' }
]

// 脱敏预设
const maskingPresets = [
  {
    id: 'personal',
    name: '个人信息',
    rules: [
      { pattern: '\\b\\d{11}\\b', method: 'mask', keepStart: 3, keepEnd: 4 }, // 手机号
      { pattern: '\\b\\d{15,19}\\b', method: 'mask', keepStart: 4, keepEnd: 4 }, // 银行卡
      { pattern: '\\b\\d{17,18}[Xx\\d]\\b', method: 'mask', keepStart: 6, keepEnd: 4 }, // 身份证
      { pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b', method: 'mask', keepStart: 2, keepEnd: 0 } // 邮箱
    ]
  },
  {
    id: 'financial',
    name: '金融信息',
    rules: [
      { pattern: '\\b\\d{15,19}\\b', method: 'mask', keepStart: 4, keepEnd: 4 }, // 银行卡
      { pattern: '"card_number"\\s*:\\s*"([^"]{15,19})"', method: 'mask', keepStart: 4, keepEnd: 4 }, // JSON银行卡
      { pattern: '"cvv"\\s*:\\s*"([^"]{3,4})"', method: 'replace', replacement: '***' } // CVV
    ]
  },
  {
    id: 'address',
    name: '地址信息',
    rules: [
      { pattern: '\\d{6}', method: 'replace', replacement: '******' }, // 邮编
      { pattern: '[省市].*?区.*?(街道|路|道)', method: 'mask', keepStart: 4, keepEnd: 2 } // 地址
    ]
  }
]

// 自定义规则
const customRules = ref([])

// 脱敏选项
const options = ref({
  preserveFormat: true,
  consistentMasking: false,
  maskingKey: '',
  maskChar: '*'
})

// 检测到的字段
const detectedFields = ref([])

// 计算属性
const activeRules = computed(() => {
  const rules = []
  customRules.value.forEach(rule => {
    if (rule.pattern) {
      rules.push(rule)
    }
  })
  return rules
})

// 方法
const getPlaceholder = () => {
  switch (inputFormat.value) {
    case 'json':
      return '[{"name": "张三", "phone": "13812345678", "email": "zhangsan@example.com"}]'
    case 'csv':
      return 'name,phone,email\n张三,13812345678,zhangsan@example.com'
    case 'text':
      return '张三 13812345678 zhangsan@example.com'
    default:
      return '输入需要脱敏的数据...'
  }
}

const getInputLineCount = () => {
  if (!inputData.value) return 0
  return inputData.value.split('\n').length
}

const getOutputLineCount = () => {
  if (!maskedData.value) return 0
  return maskedData.value.split('\n').length
}

const loadSampleData = () => {
  const sampleData = [
    {
      name: '张三',
      phone: '13812345678',
      email: 'zhangsan@example.com',
      idCard: '110101199001011234',
      bankCard: '6222020200012345678',
      address: '北京市朝阳区建国路88号'
    },
    {
      name: '李四',
      phone: '13987654321',
      email: 'lisi@gmail.com',
      idCard: '310101198502022345',
      bankCard: '6222020200023456789',
      address: '上海市浦东新区陆家嘴环路1000号'
    },
    {
      name: '王五',
      phone: '13666666666',
      email: 'wangwu@163.com',
      idCard: '440101197803033456',
      bankCard: '6222020200034567890',
      address: '广州市天河区珠江新城花城大道123号'
    }
  ]

  inputData.value = JSON.stringify(sampleData, null, 2)
  inputFormat.value = 'json'
  detectSensitiveFields()
}

const clearData = () => {
  inputData.value = ''
  maskedData.value = ''
  detectedFields.value = []
}

const applyPreset = (preset) => {
  customRules.value = [...preset.rules.map(rule => ({ ...rule, testInput: '' }))]
}

const addCustomRule = () => {
  customRules.value.push({
    pattern: '',
    method: 'mask',
    keepStart: 2,
    keepEnd: 2,
    replacement: '***',
    testInput: ''
  })
}

const removeCustomRule = (index) => {
  customRules.value.splice(index, 1)
}

const testRule = (rule) => {
  if (!rule.pattern || !rule.testInput) return ''

  try {
    const regex = new RegExp(rule.pattern)
    const match = rule.testInput.match(regex)
    if (!match) return '未匹配'

    return applyMaskingMethod(rule.method, match[0], rule)
  } catch (e) {
    return '正则错误'
  }
}

const applyMaskingMethod = (method, value, rule) => {
  switch (method) {
    case 'mask':
      return maskValue(value, rule.keepStart || 2, rule.keepEnd || 2)
    case 'replace':
      return rule.replacement || '***'
    case 'hash':
      return hashValue(value)
    case 'encrypt':
      return encryptValue(value)
    default:
      return value
  }
}

const maskValue = (value, keepStart, keepEnd) => {
  const str = String(value)
  if (str.length <= keepStart + keepEnd) {
    return options.value.maskChar.repeat(str.length)
  }

  const start = str.substring(0, keepStart)
  const end = str.substring(str.length - keepEnd)
  const middle = options.value.maskChar.repeat(str.length - keepStart - keepEnd)

  return start + middle + end
}

const hashValue = (value) => {
  // 简化的哈希函数（实际应用中应使用更安全的哈希算法）
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return 'HASH_' + Math.abs(hash).toString(16)
}

const encryptValue = (value) => {
  // 简化的加密函数（仅用于演示）
  if (!options.value.maskingKey) {
    return 'ENC_' + btoa(value).substring(0, 8) + '...'
  }

  // 实际应用中应使用真正的加密算法
  return 'ENC_' + btoa(value + options.value.maskingKey).substring(0, 12)
}

const detectSensitiveFields = () => {
  const fields = []
  const sensitivePatterns = [
    { name: 'phone', pattern: /phone|手机|移动电话/i, type: '手机号' },
    { name: 'email', pattern: /email|邮箱|电子邮件/i, type: '邮箱' },
    { name: 'idCard', pattern: /idCard|身份证|证件号/i, type: '身份证' },
    { name: 'bankCard', pattern: /bankCard|银行卡|信用卡/i, type: '银行卡' },
    { name: 'address', pattern: /address|地址|住址/i, type: '地址' },
    { name: 'name', pattern: /name|姓名/i, type: '姓名' }
  ]

  if (inputFormat.value === 'json' && inputData.value) {
    try {
      const data = JSON.parse(inputData.value)
      const firstItem = Array.isArray(data) ? data[0] : data

      if (typeof firstItem === 'object') {
        Object.keys(firstItem).forEach(key => {
          const field = sensitivePatterns.find(p => p.pattern.test(key))
          if (field) {
            fields.push({ ...field, detected: true })
          }
        })
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  detectedFields.value = fields
}

const applyMasking = () => {
  if (!inputData.value) return

  detectSensitiveFields()

  let result = inputData.value

  // 应用自定义规则
  customRules.value.forEach(rule => {
    if (!rule.pattern) return

    try {
      const regex = new RegExp(rule.pattern, 'g')
      result = result.replace(regex, (match) => {
        return applyMaskingMethod(rule.method, match, rule)
      })
    } catch (e) {
      console.error('规则应用失败:', rule.pattern, e)
    }
  })

  maskedData.value = result
}

const copyResults = async () => {
  try {
    await navigator.clipboard.writeText(maskedData.value)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const downloadResults = () => {
  const blob = new Blob([maskedData.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'masked_data.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const getSampleOriginalData = () => {
  if (!inputData.value) return '暂无数据'
  const lines = inputData.value.split('\n')
  return lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '')
}

const getSampleMaskedData = () => {
  if (!maskedData.value) return '暂无数据'
  const lines = maskedData.value.split('\n')
  return lines.slice(0, 3).join('\n') + (lines.length > 3 ? '\n...' : '')
}

// 初始化
applyPreset(maskingPresets[0])
</script>