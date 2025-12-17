<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">CRC校验计算器</h1>
      <p class="text-muted-foreground">计算CRC-8/CRC-16/CRC-32校验值，支持多种输入格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 输入区域 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">输入数据</h2>

          <div class="space-y-4">
            <!-- 输入格式选择 -->
            <div>
              <label class="text-sm font-medium">输入格式</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  @click="inputFormat = 'text'"
                  :class="[
                    'p-3 rounded-lg border transition-all',
                    inputFormat === 'text'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <Type class="w-4 h-4" />
                    <span class="text-sm">文本</span>
                  </div>
                </button>
                <button
                  @click="inputFormat = 'hex'"
                  :class="[
                    'p-3 rounded-lg border transition-all',
                    inputFormat === 'hex'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <Hash class="w-4 h-4" />
                    <span class="text-sm">十六进制</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- 输入框 -->
            <div>
              <label class="text-sm font-medium">{{ inputFormat === 'text' ? '文本内容' : '十六进制数据' }}</label>
              <textarea
                v-model="inputData"
                @input="calculateCRC"
                :placeholder="inputFormat === 'text' ? '输入要计算CRC的文本内容...' : '输入十六进制数据，如: 48656c6c6f'"
                class="mt-2 w-full h-32 p-3 border rounded-md resize-none font-mono text-sm"
              ></textarea>
              <div class="mt-2 text-xs text-muted-foreground">
                <span>字符数: {{ inputData.length }}</span>
                <span v-if="inputFormat === 'hex' && hexData" class="ml-4">
                  字节数: {{ hexData.length / 2 }}
                </span>
              </div>
            </div>

            <!-- 示例数据 -->
            <div>
              <label class="text-sm font-medium">示例数据</label>
              <div class="mt-2 space-y-2">
                <button
                  @click="loadExample('Hello World')"
                  class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
                >
                  Hello World (文本)
                </button>
                <button
                  @click="loadExample('48656c6c6f20576f726c64')"
                  class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left font-mono"
                >
                  48656c6c6f20576f726c64 (十六进制)
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- CRC参数设置 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">CRC参数</h2>

          <div class="space-y-4">
            <!-- CRC算法选择 -->
            <div>
              <label class="text-sm font-medium">算法类型</label>
              <select v-model="selectedAlgorithm" @change="calculateCRC" class="mt-2 w-full px-3 py-2 border rounded-md">
                <option v-for="algo in algorithms" :key="algo.name" :value="algo.name">
                  {{algo.name}} - {{algo.description}}
                </option>
              </select>
            </div>

            <!-- 自定义参数 -->
            <div v-if="selectedAlgorithm === 'custom'">
              <div class="space-y-3">
                <div>
                  <label class="text-sm font-medium">多项式 (Hex)</label>
                  <input
                    v-model="customParams.polynomial"
                    type="text"
                    placeholder="如: 1021"
                    class="mt-1 w-full px-3 py-2 border rounded-md font-mono text-sm"
                    @input="calculateCRC"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium">初始值 (Hex)</label>
                  <input
                    v-model="customParams.initValue"
                    type="text"
                    placeholder="如: FFFF"
                    class="mt-1 w-full px-3 py-2 border rounded-md font-mono text-sm"
                    @input="calculateCRC"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium">异或值 (Hex)</label>
                  <input
                    v-model="customParams.xorOut"
                    type="text"
                    placeholder="如: 0000"
                    class="mt-1 w-full px-3 py-2 border rounded-md font-mono text-sm"
                    @input="calculateCRC"
                  >
                </div>
                <div>
                  <label class="flex items-center gap-2">
                    <input
                      v-model="customParams.reflIn"
                      type="checkbox"
                      class="rounded"
                      @change="calculateCRC"
                    >
                    <span class="text-sm">输入反转</span>
                  </label>
                </div>
                <div>
                  <label class="flex items-center gap-2">
                    <input
                      v-model="customParams.reflOut"
                      type="checkbox"
                      class="rounded"
                      @change="calculateCRC"
                    >
                    <span class="text-sm">输出反转</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：结果显示 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 计算结果 -->
        <div class="bg-card rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">计算结果</h2>

          <div v-if="!inputData" class="text-center py-12 text-muted-foreground">
            <Calculator class="w-16 h-16 mx-auto mb-4" />
            <p>请输入数据开始计算CRC校验值</p>
          </div>

          <div v-else class="space-y-4">
            <!-- 主要结果 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                v-for="result in currentResults"
                :key="result.format"
                class="p-4 bg-muted rounded-lg"
              >
                <h3 class="text-sm font-medium mb-2">{{ result.format.toUpperCase() }}</h3>
                <div class="font-mono text-lg break-all">{{ result.value }}</div>
              </div>
            </div>

            <!-- 详细信息 -->
            <div v-if="currentAlgorithmInfo" class="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 class="font-medium mb-3">算法参数详情</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-muted-foreground">算法名称:</span>
                  <span class="font-medium ml-2">{{ currentAlgorithmInfo.name }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">多项式:</span>
                  <span class="font-medium ml-2">{{ currentAlgorithmInfo.polynomial }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">初始值:</span>
                  <span class="font-medium ml-2">{{ currentAlgorithmInfo.initValue }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">异或值:</span>
                  <span class="font-medium ml-2">{{ currentAlgorithmInfo.xorOut }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">输入反转:</span>
                  <span class="font-medium ml-2">{{ currentAlgorithmInfo.reflIn ? '是' : '否' }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">输出反转:</span>
                  <span class="font-medium ml-2">{{ currentAlgorithmInfo.reflOut ? '是' : '否' }}</span>
                </div>
              </div>
            </div>

            <!-- 所有算法对比 -->
            <div class="mt-6">
              <h3 class="font-medium mb-3">所有算法对比</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left py-2">算法</th>
                      <th class="text-left py-2">十六进制</th>
                      <th class="text-left py-2">十进制</th>
                      <th class="text-left py-2">二进制</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="algo in allResults" :key="algo.name" class="border-b">
                      <td class="py-2 font-medium">{{ algo.name }}</td>
                      <td class="py-2 font-mono">{{ algo.hex }}</td>
                      <td class="py-2 font-mono">{{ algo.decimal }}</td>
                      <td class="py-2 font-mono text-xs">{{ algo.binary }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info class="w-5 h-5 text-primary" />
            使用说明
          </h3>
          <div class="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 class="font-medium text-foreground mb-2">什么是CRC？</h4>
              <p class="mb-2">CRC（循环冗余校验）是一种错误检测码，用于验证数据传输或存储的完整性。</p>
              <p>常用于通信协议、文件系统和存储设备中，可以有效检测数据传输中的错误。</p>
            </div>
            <div>
              <h4 class="font-medium text-foreground mb-2">常用算法</h4>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li><strong>CRC-8:</strong> 用于简单的校验场景，如Dallas iButton</li>
                <li><strong>CRC-16:</strong> 常用于Modbus、XMODEM等协议</li>
                <li><strong>CRC-32:</strong> 广泛用于ZIP、PNG等文件格式和网络协议</li>
                <li><strong>CRC-32C:</strong> 优化的CRC-32实现，用于iSCSI等</li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium text-foreground mb-2">使用提示</h4>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>支持文本和十六进制两种输入格式</li>
                <li>可选择预设算法或自定义CRC参数</li>
                <li>结果显示多种格式：十六进制、十进制、二进制</li>
                <li>可以同时查看所有常用算法的计算结果</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 相关工具 -->
        <div class="bg-card rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">相关工具</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NuxtLink
              to="/tools/md5-generator"
              class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
            >
              <Shield class="w-5 h-5 text-primary" />
              <div>
                <p class="font-medium group-hover:text-primary">MD5生成器</p>
                <p class="text-xs text-muted-foreground">生成MD5哈希值</p>
              </div>
              <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
            </NuxtLink>
            <NuxtLink
              to="/tools/sha-generator"
              class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
            >
              <Shield class="w-5 h-5 text-primary" />
              <div>
                <p class="font-medium group-hover:text-primary">SHA生成器</p>
                <p class="text-xs text-muted-foreground">SHA-1/256/512哈希计算</p>
              </div>
              <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
            </NuxtLink>
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Calculator, Type, Hash, Info, Shield, ArrowRight } from 'lucide-vue-next'

// 数据
const inputData = ref('')
const inputFormat = ref('text')
const selectedAlgorithm = ref('crc32')

const customParams = ref({
  polynomial: '1021',
  initValue: 'FFFF',
  xorOut: '0000',
  reflIn: false,
  reflOut: false
})

// CRC算法配置
const algorithms = [
  {
    name: 'crc8',
    description: 'CRC-8',
    width: 8,
    polynomial: 0x07,
    initValue: 0x00,
    xorOut: 0x00,
    reflIn: false,
    reflOut: false
  },
  {
    name: 'crc8-darc',
    description: 'CRC-8/DARC',
    width: 8,
    polynomial: 0x39,
    initValue: 0x00,
    xorOut: 0x00,
    reflIn: true,
    reflOut: true
  },
  {
    name: 'crc16',
    description: 'CRC-16',
    width: 16,
    polynomial: 0x8005,
    initValue: 0x0000,
    xorOut: 0x0000,
    reflIn: true,
    reflOut: true
  },
  {
    name: 'crc16-modbus',
    description: 'CRC-16/MODBUS',
    width: 16,
    polynomial: 0x8005,
    initValue: 0xFFFF,
    xorOut: 0x0000,
    reflIn: true,
    reflOut: true
  },
  {
    name: 'crc16-xmodem',
    description: 'CRC-16/XMODEM',
    width: 16,
    polynomial: 0x1021,
    initValue: 0x0000,
    xorOut: 0x0000,
    reflIn: false,
    reflOut: false
  },
  {
    name: 'crc32',
    description: 'CRC-32',
    width: 32,
    polynomial: 0x04C11DB7,
    initValue: 0xFFFFFFFF,
    xorOut: 0xFFFFFFFF,
    reflIn: true,
    reflOut: true
  },
  {
    name: 'crc32c',
    description: 'CRC-32C',
    width: 32,
    polynomial: 0x1EDC6F41,
    initValue: 0xFFFFFFFF,
    xorOut: 0xFFFFFFFF,
    reflIn: true,
    reflOut: true
  },
  {
    name: 'custom',
    description: '自定义参数',
    width: 16,
    polynomial: 0x1021,
    initValue: 0xFFFF,
    xorOut: 0x0000,
    reflIn: false,
    reflOut: false
  }
]

// 计算属性
const hexData = computed(() => {
  if (!inputData.value) return ''

  if (inputFormat.value === 'hex') {
    // 移除所有非十六进制字符
    return inputData.value.replace(/[^0-9A-Fa-f]/g, '')
  } else {
    // 将文本转换为十六进制
    return Array.from(new TextEncoder().encode(inputData.value))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
})

const currentAlgorithmInfo = computed(() => {
  if (selectedAlgorithm.value === 'custom') {
    return {
      name: 'Custom',
      polynomial: customParams.value.polynomial || '0000',
      initValue: customParams.value.initValue || '0000',
      xorOut: customParams.value.xorOut || '0000',
      reflIn: customParams.value.reflIn,
      reflOut: customParams.value.reflOut
    }
  }
  return algorithms.find(a => a.name === selectedAlgorithm.value)
})

const currentResults = computed(() => {
  const algo = currentAlgorithmInfo.value
  if (!algo || !hexData.value) return []

  const crcValue = calculateCRCForAlgorithm(hexData.value, algo)
  const bits = algo.width

  return [
    {
      format: 'hex',
      value: crcValue.toString(16).toUpperCase().padStart(Math.ceil(bits / 4), '0')
    },
    {
      format: 'decimal',
      value: crcValue.toString(10)
    },
    {
      format: 'binary',
      value: crcValue.toString(2).padStart(bits, '0')
    }
  ]
})

const allResults = computed(() => {
  if (!hexData.value) return []

  return algorithms.filter(a => a.name !== 'custom').map(algo => {
    const crcValue = calculateCRCForAlgorithm(hexData.value, algo)
    const bits = algo.width

    return {
      name: algo.description,
      hex: crcValue.toString(16).toUpperCase().padStart(Math.ceil(bits / 4), '0'),
      decimal: crcValue.toString(10),
      binary: crcValue.toString(2).padStart(bits, '0')
    }
  })
})

// 方法
const calculateCRC = () => {
  // CRC计算在computed属性中自动进行
}

const calculateCRCForAlgorithm = (hexData, algorithm) => {
  const hexString = hexData.padEnd(Math.ceil(hexData.length / 2) * 2, '0')
  const bytes = []

  for (let i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16))
  }

  return crcCalculate(bytes, algorithm)
}

const crcCalculate = (bytes, algorithm) => {
  let { width, polynomial, initValue, xorOut, reflIn, reflOut } = algorithm

  // 如果是自定义，解析参数
  if (algorithm.name === 'custom') {
    polynomial = parseInt(customParams.value.polynomial, 16) || 0x1021
    initValue = parseInt(customParams.value.initValue, 16) || 0xFFFF
    xorOut = parseInt(customParams.value.xorOut, 16) || 0x0000
    reflIn = customParams.value.reflIn
    reflOut = customParams.value.reflOut
    width = 16 // 默认16位
  }

  const mask = (1 << width) - 1
  let crc = initValue & mask

  for (let byte of bytes) {
    if (reflIn) {
      byte = reverseBits(byte, 8)
    }

    crc ^= (byte << (width - 8)) & mask

    for (let i = 0; i < 8; i++) {
      if (crc & (1 << (width - 1))) {
        crc = ((crc << 1) ^ polynomial) & mask
      } else {
        crc = (crc << 1) & mask
      }
    }
  }

  if (reflOut) {
    crc = reverseBits(crc, width)
  }

  return (crc ^ xorOut) & mask
}

const reverseBits = (value, bitCount) => {
  let result = 0
  for (let i = 0; i < bitCount; i++) {
    result = (result << 1) | ((value >> i) & 1)
  }
  return result
}

const loadExample = (data) => {
  inputData.value = data
  if (data.startsWith('48')) {
    inputFormat.value = 'hex'
  } else {
    inputFormat.value = 'text'
  }
  calculateCRC()
}

// SEO配置
useSeoMeta({
  title: 'CRC校验计算器 - CRC-8/CRC-16/CRC-32在线计算',
  description: '免费在线CRC校验值计算工具，支持CRC-8/CRC-16/CRC-32等多种算法，支持文本和十六进制输入，自定义CRC参数。',
  keywords: ['CRC计算器', 'CRC校验', 'CRC-8', 'CRC-16', 'CRC-32', '循环冗余校验', '在线工具']
})

definePageMeta({
  layout: 'default'
})
</script>