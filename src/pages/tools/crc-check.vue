<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">CRC 校验工具</h1>
      <p class="text-muted-foreground">循环冗余校验 (Cyclic Redundancy Check)，支持多种CRC标准</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入数据</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入需要计算CRC的数据..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg space-y-3">
          <div>
            <h3 class="font-medium text-sm mb-2">输入格式</h3>
            <select v-model="inputFormat" class="w-full p-2 border border-border rounded-lg text-sm">
              <option value="text">文本 (ASCII)</option>
              <option value="hex">十六进制字符串</option>
            </select>
          </div>

          <div>
            <h3 class="font-medium text-sm mb-2">CRC 标准</h3>
            <select v-model="selectedCrc" class="w-full p-2 border border-border rounded-lg text-sm">
              <option value="CRC8">CRC-8</option>
              <option value="CRC16">CRC-16</option>
              <option value="CRC16_MODBUS">CRC-16-MODBUS</option>
              <option value="CRC16_CCITT">CRC-16-CCITT</option>
              <option value="CRC32">CRC-32</option>
            </select>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">校验结果</h2>
          <div class="flex gap-2">
            <button v-if="crcResult !== null" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
          </div>
        </div>

        <div v-if="crcResult !== null" class="space-y-3">
          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">CRC 校验码 (十六进制):</p>
            <p class="font-mono text-lg">{{ hexResult }}</p>
          </div>

          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">CRC 校验码 (十进制):</p>
            <p class="font-mono text-sm">{{ crcResult }}</p>
          </div>

          <div class="bg-muted p-4 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">CRC 校验码 (二进制):</p>
            <p class="font-mono text-xs break-all">{{ crcResult.toString(2).toUpperCase() }}</p>
          </div>
        </div>

        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">输入数据后将显示CRC校验码</div>
      </div>
    </div>

    <div class="mt-6 bg-muted p-4 rounded-lg">
      <h3 class="font-medium text-sm mb-2">CRC 标准说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
        <div>
          <p class="font-medium text-foreground mb-1">CRC-8</p>
          <p>多项式: 0x07, 用于 1-Wire 总线</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">CRC-16</p>
          <p>多项式: 0x8005, 用于 bisync</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">CRC-16-MODBUS</p>
          <p>多项式: 0x8005, 用于 Modbus 协议</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">CRC-16-CCITT</p>
          <p>多项式: 0x1021, 用于 X-25</p>
        </div>
        <div>
          <p class="font-medium text-foreground mb-1">CRC-32</p>
          <p>多项式: 0x04C11DB7, 用于 ZIP、PNG</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const inputFormat = ref('text')
const selectedCrc = ref('CRC32')
const crcResult = ref(null)
const copied = ref(false)

const examples = [
  '123456789',
  'Hello World!',
  'test data'
]
const currentExample = ref(0)

const hexResult = computed(() => {
  if (crcResult.value === null) return ''
  return crcResult.value.toString(16).toUpperCase().padStart(selectedCrc.value === 'CRC8' ? 2 : selectedCrc.value === 'CRC32' ? 8 : 4, '0')
})

const crc8Table = new Array(256)
const crc16Table = new Array(256)
const crc16ModbusTable = new Array(256)
const crc16CcittTable = new Array(256)
const crc32Table = new Array(256)

const initCRC8Table = () => {
  for (let i = 0; i < 256; i++) {
    let crc = i
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) : (crc << 1)
    }
    crc8Table[i] = crc & 0xFF
  }
}

const initCRC16Table = (poly) => {
  const table = new Array(256)
  for (let i = 0; i < 256; i++) {
    let crc = i << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ poly) : (crc << 1)
    }
    table[i] = crc & 0xFFFF
  }
  return table
}

const initCRC32Table = () => {
  for (let i = 0; i < 256; i++) {
    let crc = i
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? ((crc >>> 1) ^ 0xEDB88320) : (crc >>> 1)
    }
    crc32Table[i] = crc
  }
}

initCRC8Table()
const table16 = initCRC16Table(0x8005)
const table16Modbus = initCRC16Table(0x8005)
const table16Ccitt = initCRC16Table(0x1021)
initCRC32Table()

const calculateCRC8 = (data) => {
  let crc = 0x00
  for (let i = 0; i < data.length; i++) {
    crc = crc8Table[(crc ^ data[i]) & 0xFF]
  }
  return crc
}

const calculateCRC16 = (data, table) => {
  let crc = 0x0000
  for (let i = 0; i < data.length; i++) {
    crc = ((crc << 8) ^ table[((crc >> 8) ^ data[i]) & 0xFF]) & 0xFFFF
  }
  return crc
}

const calculateCRC32 = (data) => {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ data[i]) & 0xFF]
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

watch([inputText, inputFormat, selectedCrc], ([text, format, crcType]) => {
  if (!text) {
    crcResult.value = null
    return
  }

  try {
    let bytes = []

    if (format === 'hex') {
      const hexStr = text.replace(/\s/g, '')
      if (hexStr.length % 2 !== 0) {
        crcResult.value = null
        return
      }
      for (let i = 0; i < hexStr.length; i += 2) {
        bytes.push(parseInt(hexStr.substr(i, 2), 16))
      }
    } else {
      for (let i = 0; i < text.length; i++) {
        bytes.push(text.charCodeAt(i))
      }
    }

    switch (crcType) {
      case 'CRC8':
        crcResult.value = calculateCRC8(bytes)
        break
      case 'CRC16':
        crcResult.value = calculateCRC16(bytes, table16)
        break
      case 'CRC16_MODBUS':
        crcResult.value = calculateCRC16(bytes, table16Modbus)
        break
      case 'CRC16_CCITT':
        crcResult.value = calculateCRC16(bytes, table16Ccitt)
        break
      case 'CRC32':
        crcResult.value = calculateCRC32(bytes)
        break
    }
  } catch (e) {
    crcResult.value = null
  }
})

const clearInput = () => {
  inputText.value = ''
  crcResult.value = null
}

const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(hexResult.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = hexResult.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

useSeoMeta({
  title: 'CRC校验 - 在线循环冗余校验计算工具',
  description: '免费在线CRC校验工具，支持CRC-8/16/32多种标准计算，用于数据传输错误检测。',
  keywords: ['crc', '循环冗余校验', '校验码', 'crc8', 'crc16', 'crc32', 'modbus', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('CRC校验工具')
</script>
