<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文件Base64转换器</h1>
      <p class="text-gray-600 dark:text-gray-400">将图片、字体等文件转换为Base64编码，支持CSS/HTML Data URI格式</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex flex-wrap gap-4 mb-6">
        <label class="flex items-center gap-2 text-sm">
          <input type="radio" v-model="mode" value="encode" @change="handleModeChange" class="rounded">
          <span>文件 → Base64</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="radio" v-model="mode" value="decode" @change="handleModeChange" class="rounded">
          <span>Base64 → 文件</span>
        </label>
      </div>

      <!-- 文件上传 -->
      <div v-if="mode === 'encode'" class="mb-6">
        <label class="block text-sm font-medium mb-2">选择文件</label>
        <div class="flex gap-4">
          <input
            ref="fileInput"
            type="file"
            @change="handleFileSelect"
            accept="image/*,.ttf,.otf,.woff,.woff2,.svg,.pdf"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
          <button @click="clearAll" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">清空</button>
        </div>
        <p class="mt-2 text-sm text-gray-500">支持图片、字体、PDF等文件，建议小于1MB</p>
      </div>

      <!-- 输出格式 -->
      <div v-if="mode === 'encode'" class="mb-6">
        <label class="block text-sm font-medium mb-2">输出格式</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="radio" v-model="outputFormat" value="base64" class="rounded">
            <span>纯Base64</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="radio" v-model="outputFormat" value="dataUri" class="rounded">
            <span>Data URI (data:image/png;base64,...)</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="radio" v-model="outputFormat" value="css" class="rounded">
            <span>CSS (background-image: url(...))</span>
          </label>
        </div>
      </div>

      <!-- Base64输入 -->
      <div v-if="mode === 'decode'" class="mb-6">
        <label class="block text-sm font-medium mb-2">输入Base64字符串</label>
        <textarea
          v-model="base64Input"
          class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴Base64字符串或Data URI..."
        ></textarea>
      </div>
    </div>

    <!-- 结果区域 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- 预览 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div v-if="previewUrl" class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center justify-center min-h-40 bg-gray-50 dark:bg-gray-900">
          <img v-if="isImage" :src="previewUrl" class="max-w-full max-h-64" alt="预览">
          <div v-else class="text-gray-500">文件类型不支持预览</div>
        </div>
        <div v-else class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-40 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
          {{ mode === 'encode' ? '选择文件后预览' : '输入Base64后预览' }}
        </div>

        <div v-if="fileInfo" class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">文件名:</span>
            <span class="font-medium">{{ fileInfo.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">文件大小:</span>
            <span class="font-medium">{{ formatSize(fileInfo.size) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">MIME类型:</span>
            <span class="font-medium">{{ fileInfo.type }}</span>
          </div>
        </div>
      </div>

      <!-- 输出 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Base64结果</h2>
          <div class="flex gap-2">
            <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!outputResult">复制</button>
            <button v-if="mode === 'decode' && outputResult" @click="downloadFile" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">下载</button>
          </div>
        </div>
        <textarea
          v-model="outputResult"
          readonly
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
          placeholder="Base64结果将显示在这里..."
        ></textarea>
        <div class="mt-2 text-sm text-gray-500">{{ outputResult?.length || 0 }} 字符</div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">使用说明</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h3 class="font-medium mb-2">CSS背景图片</h3>
          <pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">.logo {
  background-image: url("data:image/svg+xml;base64,PHN2Z...");
}</pre>
        </div>
        <div>
          <h3 class="font-medium mb-2">HTML内联图片</h3>
          <pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">&lt;img src="data:image/png;base64,iVBORw..." alt="Logo"&gt;</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '文件Base64转换器 - 图片转Base64 Data URI',
  meta: [{ name: 'description', content: '在线文件转Base64工具，支持图片、字体、PDF等文件转换为Base64编码，生成CSS Data URI格式。' }],
  keywords: ['base64转换', '图片转base64', 'data uri', 'css背景', '文件编码', '在线工具']
})

const mode = ref('encode')
const outputFormat = ref('dataUri')
const base64Input = ref('')
const outputResult = ref('')
const previewUrl = ref('')
const fileInfo = ref<any>(null)
const fileInput = ref<HTMLInputElement>()

const isImage = computed(() => {
  return fileInfo.value?.type?.startsWith('image/')
})

function handleModeChange() {
  clearAll()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  fileInfo.value = {
    name: file.name,
    size: file.size,
    type: file.type
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    const base64 = result.split(',')[1]

    switch (outputFormat.value) {
      case 'base64':
        outputResult.value = base64
        break
      case 'dataUri':
        outputResult.value = result
        break
      case 'css':
        outputResult.value = `background-image: url("${result}");`
        break
    }

    previewUrl.value = result
  }

  reader.readAsDataURL(file)
}

// 监听outputFormat变化
import { watch } from 'vue'
watch(outputFormat, () => {
  if (previewUrl.value) {
    const base64 = previewUrl.value.split(',')[1]
    switch (outputFormat.value) {
      case 'base64':
        outputResult.value = base64
        break
      case 'dataUri':
        outputResult.value = previewUrl.value
        break
      case 'css':
        outputResult.value = `background-image: url("${previewUrl.value}");`
        break
    }
  }
})

// 监听base64输入（解码模式）
watch(base64Input, () => {
  if (mode.value === 'decode' && base64Input.value) {
    try {
      let base64 = base64Input.value.trim()

      // 移除Data URI前缀
      if (base64.includes(',')) {
        base64 = base64.split(',')[1]
      }

      // 验证Base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
        return
      }

      outputResult.value = base64

      // 尝试预览
      try {
        previewUrl.value = 'data:' + (getMimeType(base64) || 'application/octet-stream') + ';base64,' + base64
      } catch {
        previewUrl.value = ''
      }
    } catch {
      outputResult.value = ''
      previewUrl.value = ''
    }
  }
})

function getMimeType(base64: string): string {
  // 根据Base64内容猜测MIME类型
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png'
  if (base64.startsWith('R0lGODlh')) return 'image/gif'
  if (base64.startsWith('Qk0')) return 'image/bmp'
  if (base64.startsWith('UklGR')) return 'image/webp'
  if (base64.startsWith('PHN2Z')) return 'image/svg+xml'
  return ''
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputResult.value)
    alert('已复制')
  } catch {}
}

function downloadFile() {
  if (!outputResult.value) return

  try {
    const base64 = outputResult.value
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray])

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'decoded-file'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    alert('下载失败，请检查Base64格式')
  }
}

function clearAll() {
  fileInfo.value = null
  outputResult.value = ''
  previewUrl.value = ''
  base64Input.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>
