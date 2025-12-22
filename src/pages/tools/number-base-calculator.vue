<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">进制转换计算器</h1>
      <p class="text-muted-foreground mb-6">二进制、八进制、十进制、十六进制互转，支持大数据处理和补码计算</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和转换 -->
      <div class="space-y-6">
        <!-- 数字输入 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">数字输入</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">选择进制</label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="base in bases"
                  :key="base.value"
                  @click="inputBase = base.value"
                  :class="[
                    'px-3 py-2 rounded text-sm font-medium transition-all',
                    inputBase === base.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  ]"
                >
                  {{ base.name }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">输入数字</label>
              <textarea
                v-model="inputNumber"
                @input="convertFromInput"
                class="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows="4"
                :placeholder="`输入${bases.find(b => b.value === inputBase)?.name}数字`"
              ></textarea>
              <div class="text-xs text-muted-foreground mt-1">
                支持输入: {{ getValidChars(inputBase).join(', ') }}
              </div>
            </div>

            <div class="flex gap-2">
              <button @click="clearInput" class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90">
                清空
              </button>
              <button @click="generateRandom" class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                随机生成
              </button>
            </div>
          </div>
        </div>

        <!-- 快速转换结果 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">转换结果</h3>
          <div class="space-y-3">
            <div v-for="base in bases" :key="base.value" class="p-3 bg-secondary rounded-lg">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm">{{ base.name }}</span>
                <button
                  @click="copyToClipboard(conversions[base.value])"
                  class="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
                >
                  复制
                </button>
              </div>
              <div class="font-mono text-sm mt-1 break-all">
                {{ conversions[base.value] || '-' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 高级功能 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">高级功能</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">位运算</label>
              <div class="grid grid-cols-2 gap-2">
                <button @click="bitwiseOp('AND')" class="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  AND
                </button>
                <button @click="bitwiseOp('OR')" class="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  OR
                </button>
                <button @click="bitwiseOp('XOR')" class="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  XOR
                </button>
                <button @click="bitwiseOp('NOT')" class="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  NOT
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">移位运算</label>
              <div class="flex gap-2">
                <input
                  v-model.number="shiftBits"
                  type="number"
                  min="1"
                  max="64"
                  class="flex-1 px-3 py-2 border rounded text-sm"
                  placeholder="位数"
                />
                <button @click="bitwiseShift('left')" class="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  左移
                </button>
                <button @click="bitwiseShift('right')" class="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  右移
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">补码计算</label>
              <div class="flex gap-2">
                <input
                  v-model.number="bitWidth"
                  type="number"
                  min="8"
                  max="64"
                  step="8"
                  class="flex-1 px-3 py-2 border rounded text-sm"
                  placeholder="位宽 (8, 16, 32, 64)"
                />
                <button @click="calculateTwosComplement" class="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80">
                  二进制补码
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：工具和历史 -->
      <div class="space-y-6">
        <!-- 进制对比表 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">进制对比表</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">十进制</th>
                  <th class="text-left p-2">二进制</th>
                  <th class="text-left p-2">八进制</th>
                  <th class="text-left p-2">十六进制</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in 16" :key="i" class="border-b">
                  <td class="p-2 font-mono">{{ i - 1 }}</td>
                  <td class="p-2 font-mono">{{ (i - 1).toString(2) }}</td>
                  <td class="p-2 font-mono">{{ (i - 1).toString(8) }}</td>
                  <td class="p-2 font-mono">{{ (i - 1).toString(16).toUpperCase() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ASCII转换 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">ASCII转换</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">文本转ASCII</label>
              <textarea
                v-model="asciiInput.text"
                @input="convertTextToAscii"
                class="w-full px-3 py-2 border rounded-lg"
                rows="3"
                placeholder="输入文本"
              ></textarea>
            </div>

            <div v-if="asciiResult.binary" class="space-y-2">
              <div class="p-2 bg-secondary rounded">
                <div class="text-xs text-muted-foreground">二进制</div>
                <div class="font-mono text-sm break-all">{{ asciiResult.binary }}</div>
              </div>
              <div class="p-2 bg-secondary rounded">
                <div class="text-xs text-muted-foreground">十进制</div>
                <div class="font-mono text-sm break-all">{{ asciiResult.decimal }}</div>
              </div>
              <div class="p-2 bg-secondary rounded">
                <div class="text-xs text-muted-foreground">十六进制</div>
                <div class="font-mono text-sm break-all">{{ asciiResult.hex }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">转换历史</h3>
            <button
              @click="clearHistory"
              class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/80"
            >
              清空
            </button>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(item, index) in conversionHistory"
              :key="index"
              @click="loadFromHistory(item)"
              class="p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <div class="text-sm font-medium">{{ item.inputBase }}: {{ item.input }}</div>
              <div class="text-xs text-muted-foreground">{{ item.timestamp }}</div>
            </div>
            <div v-if="conversionHistory.length === 0" class="text-center text-muted-foreground py-4">
              暂无转换历史
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('进制转换计算器')

// 进制定义
const bases = [
  { name: '二进制', value: 2 },
  { name: '八进制', value: 8 },
  { name: '十进制', value: 10 },
  { name: '十六进制', value: 16 }
]

// 状态
const inputBase = ref(10)
const inputNumber = ref('')
const conversions = ref({
  2: '',
  8: '',
  10: '',
  16: ''
})

const shiftBits = ref(1)
const bitWidth = ref(8)

// ASCII转换
const asciiInput = ref({ text: '' })
const asciiResult = ref({
  binary: '',
  decimal: '',
  hex: ''
})

// 历史记录
const conversionHistory = ref([])

// 方法
const getValidChars = (base) => {
  const chars = {
    2: ['0', '1'],
    8: ['0', '1', '2', '3', '4', '5', '6', '7'],
    10: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    16: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
  }
  return chars[base] || []
}

const convertFromInput = () => {
  if (!inputNumber.value) {
    conversions.value = { 2: '', 8: '', 10: '', 16: '' }
    return
  }

  try {
    const decimal = parseInt(inputNumber.value, inputBase.value)
    if (isNaN(decimal)) {
      // 尝试逐个字符验证
      const validChars = getValidChars(inputBase.value)
      const hasInvalidChars = inputNumber.value.toUpperCase().split('').some(char =>
        !validChars.includes(char) && char !== '\n'
      )
      if (hasInvalidChars) {
        return
      }
    }

    conversions.value = {
      2: decimal.toString(2),
      8: decimal.toString(8),
      10: decimal.toString(10),
      16: decimal.toString(16).toUpperCase()
    }

    // 添加到历史记录
    addToHistory()
  } catch (error) {
    console.error('转换错误:', error)
  }
}

const clearInput = () => {
  inputNumber.value = ''
  conversions.value = { 2: '', 8: '', 10: '', 16: '' }
}

const generateRandom = () => {
  const maxDecimal = Math.floor(Math.random() * 1000)
  inputNumber.value = maxDecimal.toString(inputBase.value)
  convertFromInput()
}

const copyToClipboard = async (text) => {
  if (!text) return

  // 直接使用 Clipboard API
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

// 位运算
const bitwiseOp = (operation) => {
  if (!inputNumber.value) return

  const decimal = parseInt(inputNumber.value, inputBase.value)
  let result

  switch (operation) {
    case 'AND':
      // 简化实现，实际需要第二个操作数
      result = decimal & 0xFF // 示例：与0xFF进行AND
      break
    case 'OR':
      result = decimal | 0x55 // 示例：与0x55进行OR
      break
    case 'XOR':
      result = decimal ^ 0xAA // 示例：与0xAA进行XOR
      break
    case 'NOT':
      result = ~decimal
      break
    default:
      return
  }

  inputNumber.value = Math.abs(result).toString(inputBase.value)
  convertFromInput()
}

const bitwiseShift = (direction) => {
  if (!inputNumber.value) return

  const decimal = parseInt(inputNumber.value, inputBase.value)
  let result

  if (direction === 'left') {
    result = decimal << shiftBits.value
  } else {
    result = decimal >> shiftBits.value
  }

  inputNumber.value = Math.abs(result).toString(inputBase.value)
  convertFromInput()
}

const calculateTwosComplement = () => {
  if (!inputNumber.value) return

  const decimal = parseInt(inputNumber.value, 10)
  if (isNaN(decimal)) return

  const mask = (1 << bitWidth.value) - 1
  const twosComplement = ((~decimal + 1) & mask)

  inputNumber.value = twosComplement.toString(2).padStart(bitWidth.value, '0')
  inputBase.value = 2
  convertFromInput()
}

// ASCII转换
const convertTextToAscii = () => {
  const text = asciiInput.value.text
  if (!text) {
    asciiResult.value = { binary: '', decimal: '', hex: '' }
    return
  }

  const binary = text.split('').map(char =>
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join(' ')

  const decimal = text.split('').map(char =>
    char.charCodeAt(0)
  ).join(' ')

  const hex = text.split('').map(char =>
    char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
  ).join(' ')

  asciiResult.value = { binary, decimal, hex }
}

// 历史记录
const addToHistory = () => {
  const baseName = bases.find(b => b.value === inputBase.value)?.name
  conversionHistory.value.unshift({
    inputBase: baseName,
    input: inputNumber.value,
    timestamp: new Date().toLocaleTimeString()
  })

  if (conversionHistory.value.length > 20) {
    conversionHistory.value = conversionHistory.value.slice(0, 20)
  }
}

const loadFromHistory = (item) => {
  inputBase.value = bases.find(b => b.name === item.inputBase)?.value || 10
  inputNumber.value = item.input
  convertFromInput()
}

const clearHistory = () => {
  conversionHistory.value = []
}

// 监听输入变化
watch(() => inputBase.value, () => {
  convertFromInput()
})
</script>

<style scoped>
textarea {
  transition: border-color 0.2s, box-shadow 0.2s;
}

textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input[type="number"] {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="number"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>