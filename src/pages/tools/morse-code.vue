<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">摩尔斯电码转换器</h1>
      <p class="text-muted-foreground">在文本和摩尔斯电码之间相互转换，支持播放电码声音</p>
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
          placeholder="请输入要转换的文本或摩尔斯电码..."
          class="w-full h-48 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>

        <!-- 转换选项 -->
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">输入类型:</label>
            <select v-model="inputType" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="text">文本</option>
              <option value="morse">摩尔斯电码</option>
              <option value="auto">自动检测</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">分隔符:</label>
            <select v-model="separator" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="space">空格</option>
              <option value="slash">斜杠</option>
              <option value="pipe">竖线</option>
              <option value="newline">换行</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class="text-sm font-medium">大小写:</label>
            <select v-model="caseType" class="px-3 py-1.5 border border-border rounded-md text-sm">
              <option value="upper">大写</option>
              <option value="lower">小写</option>
              <option value="preserve">保持原样</option>
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

        <!-- 摩尔斯电码输出 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">摩尔斯电码</h2>
            <div class="flex gap-2">
              <button
                v-if="outputs.morse"
                @click="playMorse"
                :disabled="isPlaying"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {{ isPlaying ? '播放中...' : '播放' }}
              </button>
              <button
                v-if="outputs.morse"
                @click="stopMorse"
                :disabled="!isPlaying"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                停止
              </button>
              <button
                v-if="outputs.morse"
                @click="copyOutput('morse')"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ copied.morse ? '已复制' : '复制' }}
              </button>
              <button
                v-if="outputs.morse"
                @click="downloadOutput('morse')"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                下载
              </button>
            </div>
          </div>
          <pre
            class="w-full h-48 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputs.morse || '转换结果将显示在这里' }}</pre>
        </div>
      </div>

      <!-- 音频控制 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">音频设置</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-sm text-muted-foreground mb-2 block">频率 (Hz)</label>
            <input
              v-model.number="audioSettings.frequency"
              type="range"
              min="200"
              max="1000"
              class="w-full"
            />
            <div class="text-center text-sm mt-1">{{ audioSettings.frequency }} Hz</div>
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-2 block">点长度 (ms)</label>
            <input
              v-model.number="audioSettings.dotDuration"
              type="range"
              min="50"
              max="300"
              class="w-full"
            />
            <div class="text-center text-sm mt-1">{{ audioSettings.dotDuration }} ms</div>
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-2 block">音量</label>
            <input
              v-model.number="audioSettings.volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="w-full"
            />
            <div class="text-center text-sm mt-1">{{ Math.round(audioSettings.volume * 100) }}%</div>
          </div>
        </div>
      </div>

      <!-- 字符映射表 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">摩尔斯电码字符表</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <div
            v-for="(morse, char) in morseAlphabet"
            :key="char"
            class="flex items-center justify-between p-2 bg-muted rounded hover:bg-primary/10 transition-colors"
            @click="copyToClipboard(char)"
          >
            <span class="font-mono text-lg">{{ char }}</span>
            <span class="font-mono text-sm text-muted-foreground ml-2">{{ morse }}</span>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div v-if="inputText" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.characters }}</div>
          <div class="text-sm text-muted-foreground">字符数</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.words }}</div>
          <div class="text-sm text-muted-foreground">单词数</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.dots }}</div>
          <div class="text-sm text-muted-foreground">点数</div>
        </div>
        <div class="bg-card border rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-primary">{{ stats.dashes }}</div>
          <div class="text-sm text-muted-foreground">划数</div>
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
          <p>• 摩尔斯电码使用点(.)和划(-)来表示字母、数字和标点符号</p>
          <p>• 字母间用空格分隔，单词间用斜杠(/)或更多空格分隔</p>
          <p>• 可以调整播放速度和频率来适应不同的学习需求</p>
          <p>• 点击字符表中的字符可以快速复制</p>
        </div>
      </div>

      <!-- 摩尔斯电码规则 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">摩尔斯电码规则</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-2">基本符号</h4>
            <div class="bg-muted p-3 rounded-lg">
              <pre class="text-xs font-mono">点 (·)  - 短信号，基本时间单位
划 (−)  - 长信号，等于3个点的时间
字母间隔 - 等于3个点的时间
单词间隔 - 等于7个点的时间</pre>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">常见组合</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-muted p-3 rounded-lg">
                <p class="text-xs font-medium mb-2">紧急信号 SOS:</p>
                <p class="text-xs font-mono">··· −−− ···</p>
              </div>
              <div class="bg-muted p-3 rounded-lg">
                <p class="text-xs font-medium mb-2">测试信号:</p>
                <p class="text-xs font-mono">−·−·−· −·−·−</p>
              </div>
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
            to="/tools/unicode-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Unicode 转换</p>
              <p class="text-xs text-muted-foreground">Unicode 编码转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/hex-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
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
const separator = ref('space')
const caseType = ref('upper')
const outputs = ref({
  text: '',
  morse: ''
})
const copied = ref({
  text: false,
  morse: false
})
const isPlaying = ref(false)
const audioContext = ref(null)
const oscillator = ref(null)
const gainNode = ref(null)
const playTimeout = ref(null)

// 音频设置
const audioSettings = ref({
  frequency: 600,
  dotDuration: 100,
  volume: 0.5
})

// 摩尔斯电码字母表
const morseAlphabet = {
  'A': '.-',
  'B': '-...',
  'C': '-.-.',
  'D': '-..',
  'E': '.',
  'F': '..-.',
  'G': '--.',
  'H': '....',
  'I': '..',
  'J': '.---',
  'K': '-.-',
  'L': '.-..',
  'M': '--',
  'N': '-.',
  'O': '---',
  'P': '.--.',
  'Q': '--.-',
  'R': '.-.',
  'S': '...',
  'T': '-',
  'U': '..-',
  'V': '...-',
  'W': '.--',
  'X': '-..-',
  'Y': '-.--',
  'Z': '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  '_': '..--.-',
  '"': '.-..-.',
  '$': '...-..-',
  '@': '.--.-.',
  ' ': '/'
}

// 反向摩尔斯电码表
const reverseMorseAlphabet = computed(() => {
  const reversed = {}
  for (const [char, morse] of Object.entries(morseAlphabet)) {
    reversed[morse] = char
  }
  return reversed
})

// 分隔符映射
const separatorMap = {
  space: ' ',
  slash: ' / ',
  pipe: ' | ',
  newline: '\n'
}

// 检测输入类型
const detectInputType = (text) => {
  // 如果包含点、划和可能的分隔符，则可能是摩尔斯电码
  const morsePattern = /^[.-\s\/|]+$/
  if (morsePattern.test(text)) {
    return 'morse'
  }
  return 'text'
}

// 文本转摩尔斯电码
const textToMorse = (text, sep, casing) => {
  let result = []

  // 处理大小写
  let processedText = text
  if (casing === 'upper') {
    processedText = text.toUpperCase()
  } else if (casing === 'lower') {
    processedText = text.toLowerCase()
  }

  for (let char of processedText) {
    if (morseAlphabet[char]) {
      result.push(morseAlphabet[char])
    } else {
      // 未知字符用问号代替
      result.push('..--..')
    }
  }

  return result.join(separatorMap[sep])
}

// 摩尔斯电码转文本
const morseToText = (morse, sep) => {
  const sepStr = separatorMap[sep]
  const words = morse.split(/[\s\/|]+/)
  let result = []

  for (let word of words) {
    if (reverseMorseAlphabet.value[word]) {
      result.push(reverseMorseAlphabet.value[word])
    } else if (word === '') {
      // 空字符串表示单词分隔
      result.push(' ')
    }
  }

  return result.join('')
}

// 计算统计信息
const stats = computed(() => {
  if (!outputs.value.morse) {
    return { characters: 0, words: 0, dots: 0, dashes: 0 }
  }

  const morse = outputs.value.morse
  const dots = (morse.match(/\./g) || []).length
  const dashes = (morse.match(/-/g) || []).length
  const characters = outputs.value.text.length
  const words = outputs.value.text.split(/\s+/).filter(word => word).length

  return { characters, words, dots, dashes }
})

// 播放摩尔斯电码
const playMorse = async () => {
  if (isPlaying.value) return

  isPlaying.value = true

  // 创建音频上下文
  if (!audioContext.value) {
    audioContext.value = new (window.AudioContext || window.webkitAudioContext)()
  }

  const morse = outputs.value.morse
  const dotDuration = audioSettings.value.dotDuration
  const dashDuration = dotDuration * 3
  const symbolGap = dotDuration
  const letterGap = dotDuration * 3
  const wordGap = dotDuration * 7

  for (let symbol of morse) {
    if (!isPlaying.value) break

    if (symbol === '.') {
      await playTone(dotDuration)
    } else if (symbol === '-') {
      await playTone(dashDuration)
    } else if (symbol === ' ') {
      await sleep(letterGap)
    } else if (symbol === '/') {
      await sleep(wordGap - letterGap)
    }

    if (symbol !== ' ' && symbol !== '/') {
      await sleep(symbolGap)
    }
  }

  isPlaying.value = false
}

// 播放音调
const playTone = async (duration) => {
  oscillator.value = audioContext.value.createOscillator()
  gainNode.value = audioContext.value.createGain()

  oscillator.value.frequency.value = audioSettings.value.frequency
  gainNode.value.gain.value = audioSettings.value.volume

  oscillator.value.connect(gainNode.value)
  gainNode.value.connect(audioContext.value.destination)

  oscillator.value.start()
  oscillator.value.stop(audioContext.value.currentTime + duration / 1000)
}

// 停止播放
const stopMorse = () => {
  isPlaying.value = false
  if (oscillator.value) {
    try {
      oscillator.value.stop()
    } catch (e) {
      // 忽略已停止的错误
    }
  }
  if (playTimeout.value) {
    clearTimeout(playTimeout.value)
  }
}

// 延迟函数
const sleep = (ms) => {
  return new Promise(resolve => {
    playTimeout.value = setTimeout(resolve, ms)
  })
}

// 转换函数
const convert = () => {
  if (!inputText.value) {
    outputs.value = {
      text: '',
      morse: ''
    }
    return
  }

  // 确定输入类型
  const actualInputType = inputType.value === 'auto' ? detectInputType(inputText.value) : inputType.value

  if (actualInputType === 'text') {
    // 文本转摩尔斯
    outputs.value.text = inputText.value
    outputs.value.morse = textToMorse(inputText.value, separator.value, caseType.value)
  } else {
    // 摩尔斯转文本
    outputs.value.morse = inputText.value
    outputs.value.text = morseToText(inputText.value, separator.value)
  }
}

// 加载示例
const loadExample = () => {
  inputText.value = 'SOS'
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

// 复制字符
const copyToClipboard = async (char) => {
  try {
    await navigator.clipboard.writeText(char)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = char
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

// 下载输出
const downloadOutput = (type) => {
  const filename = type === 'text' ? 'text.txt' : 'morse.txt'
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
    morse: ''
  }
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
watch([inputText, inputType, separator, caseType], () => {
  convert()
})

// SEO配置
useSeoMeta({
  title: '摩尔斯电码转换器 - 在线摩尔斯电码编码解码工具',
  description: '免费在线摩尔斯电码转换工具，支持文本与摩尔斯电码相互转换，内置音频播放功能。',
  keywords: ['morse', '摩尔斯电码', 'converter', '电报', '编码', '在线工具', '音频播放']
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

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

input[type="range"]::-webkit-slider-track {
  background: #e5e7eb;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background: hsl(var(--primary));
  height: 16px;
  width: 16px;
  border-radius: 50%;
  margin-top: -6px;
}

input[type="range"]::-moz-range-track {
  background: #e5e7eb;
  height: 4px;
  border-radius: 2px;
}

input[type="range"]::-moz-range-thumb {
  background: hsl(var(--primary));
  height: 16px;
  width: 16px;
  border-radius: 50%;
  border: none;
}
</style>