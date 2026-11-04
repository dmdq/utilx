<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">OCR图片文字识别</h1>
      <p class="text-muted-foreground">从图片中提取文字，支持多语言识别</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：上传 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">上传图片</h2>
          <button @click="clearImage" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
        </div>

        <div
          v-if="!imageUrl"
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          class="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            class="hidden"
          >
          <Upload class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p class="text-sm text-muted-foreground mb-2">拖拽图片到此处</p>
          <button @click="$refs.fileInput.click()" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            选择文件
          </button>
        </div>

        <div v-else class="space-y-4">
          <!-- 图片预览 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-2">图片预览</h3>
            <img :src="imageUrl" class="max-w-full h-auto rounded-lg" alt="预览">
          </div>

          <!-- 识别设置 -->
          <div class="bg-muted p-4 rounded-lg space-y-4">
            <h3 class="font-medium text-sm">识别设置</h3>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">识别语言</label>
              <select v-model="selectedLanguage" class="w-full p-2 border border-border rounded text-sm">
                <option value="eng">英语 (English)</option>
                <option value="chi_sim">简体中文</option>
                <option value="chi_tra">繁体中文</option>
                <option value="jpn">日语 (日本語)</option>
                <option value="kor">韩语 (한국어)</option>
                <option value="fra">法语 (Français)</option>
                <option value="deu">德语 (Deutsch)</option>
                <option value="spa">西班牙语 (Español)</option>
                <option value="rus">俄语 (Русский)</option>
                <option value="ara">阿拉伯语 (العربية)</option>
              </select>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="preprocess" class="rounded">
              <span class="text-sm">图像预处理 (提高准确率)</span>
            </label>

            <div>
              <label class="text-xs text-muted-foreground mb-1 block">页面分割模式</label>
              <select v-model="pageSegMode" class="w-full p-2 border border-border rounded text-sm">
                <option value="3">自动</option>
                <option value="6">单列文本</option>
                <option value="5">垂直对齐文本</option>
                <option value="4">可变大小文本</option>
                <option value="7">单行文本</option>
                <option value="8">单字</option>
              </select>
            </div>
          </div>

          <!-- 识别按钮 -->
          <button
            @click="performOCR"
            :disabled="isProcessing"
            class="w-full p-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isProcessing">识别中...</span>
            <span v-else>开始识别</span>
          </button>

          <div class="text-xs text-muted-foreground">
            <p>注意：此工具使用浏览器本地 OCR，无需上传图片到服务器。</p>
            <p>首次使用需要下载语言包，可能需要较长时间。</p>
          </div>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">识别结果</h2>

        <div v-if="!imageUrl" class="bg-muted rounded-lg p-12 text-center text-muted-foreground">
          上传图片后开始识别
        </div>

        <div v-else class="space-y-4">
          <!-- 识别状态 -->
          <div v-if="isProcessing" class="bg-muted rounded-lg p-4">
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm">正在识别文字...</span>
            </div>
          </div>

          <!-- 识别结果 -->
          <div v-if="ocrResult" class="bg-muted rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-sm">识别文本</h3>
              <div class="flex gap-2">
                <button @click="copyText" class="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
                  复制
                </button>
                <button @click="downloadText" class="px-3 py-1 text-xs bg-background hover:bg-muted rounded">
                  下载
                </button>
              </div>
            </div>

            <textarea
              v-model="ocrResult"
              class="w-full p-3 border border-border rounded-lg text-sm min-h-[300px] font-mono"
              placeholder="识别结果将显示在这里..."
            ></textarea>
          </div>

          <!-- 识别信息 -->
          <div v-if="ocrResult" class="bg-muted rounded-lg p-4">
            <h3 class="font-medium text-sm mb-2">识别信息</h3>
            <div class="text-xs text-muted-foreground space-y-1">
              <p>字符数: {{ ocrResult.length }}</p>
              <p>行数: {{ ocrResult.split('\n').length }}</p>
              <p>识别语言: {{ languageName }}</p>
              <p v-if="confidence">置信度: {{ (confidence * 100).toFixed(1) }}%</p>
            </div>
          </div>

          <!-- 常见问题 -->
          <div class="bg-muted p-4 rounded-lg">
            <h3 class="font-medium text-sm mb-2">提高识别准确率</h3>
            <div class="text-xs text-muted-foreground space-y-1">
              <p>• 确保图片清晰，文字部分光线充足</p>
              <p>• 图片尽量保持水平，避免倾斜</p>
              <p>• 裁剪掉无关区域，只保留文字部分</p>
              <p>• 对于复杂背景，建议先进行图像处理</p>
              <p>• 手写文字识别准确率可能较低</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tesseract.js 加载提示 -->
    <div v-if="imageUrl && !tesseractAvailable" class="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      OCR 功能需要安装依赖包 (npm install tesseract.js)
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'
import { Upload } from 'lucide-vue-next'

const fileInput = ref(null)
const imageUrl = ref('')
const selectedLanguage = ref('chi_sim')
const preprocess = ref(true)
const pageSegMode = ref('3')
const isProcessing = ref(false)
const ocrResult = ref('')
const confidence = ref(0)
const tesseractLoaded = ref(true)
const tesseractAvailable = ref(false)

const languageName = computed(() => {
  const names = {
    'eng': '英语',
    'chi_sim': '简体中文',
    'chi_tra': '繁体中文',
    'jpn': '日语',
    'kor': '韩语',
    'fra': '法语',
    'deu': '德语',
    'spa': '西班牙语',
    'rus': '俄语',
    'ara': '阿拉伯语'
  }
  return names[selectedLanguage.value] || selectedLanguage.value
})

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    loadImage(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) {
    loadImage(file)
  }
}

const loadImage = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageUrl.value = e.target.result
    ocrResult.value = ''
  }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  imageUrl.value = ''
  ocrResult.value = ''
  confidence.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const performOCR = async () => {
  if (!imageUrl.value) {
    alert('请先上传图片')
    return
  }

  if (!tesseractAvailable.value || !Tesseract) {
    alert('OCR 功能需要安装 @tesseract.js/v4 依赖。请联系管理员安装该依赖以启用此功能。')
    return
  }

  isProcessing.value = true
  ocrResult.value = ''

  try {
    const worker = await Tesseract.createWorker(selectedLanguage.value, 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          // 可以添加进度显示
        }
      }
    })

    // 设置页面分割模式
    await worker.setParameters({
      tessedit_pageseg_mode: pageSegMode.value
    })

    const { data } = await worker.recognize(imageUrl.value)
    ocrResult.value = data.text
    confidence.value = data.confidence

    await worker.terminate()
  } catch (error) {
    console.error('OCR 识别失败:', error)
    alert('OCR 识别失败: ' + error.message)
  } finally {
    isProcessing.value = false
  }
}

const copyText = () => {
  navigator.clipboard.writeText(ocrResult.value).then(() => {
    alert('文本已复制到剪贴板')
  })
}

const downloadText = () => {
  const blob = new Blob([ocrResult.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ocr_result_${Date.now()}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

useSeoMeta({
  title: 'OCR图片文字识别 - 在线图片文字提取工具',
  description: '免费在线OCR图片文字识别工具，支持多语言识别，从图片中提取文字内容。',
  keywords: ['OCR', '文字识别', '图片转文字', '图片识别', 'text recognition', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('OCR图片文字识别')
</script>
