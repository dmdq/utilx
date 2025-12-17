<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <User class="w-8 h-8 text-primary" />
        随机昵称生成器
      </h1>
      <p class="text-muted-foreground">生成多语言随机昵称，支持自定义导入姓名库</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">生成配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- 语言选择 -->
          <div>
            <label class="text-sm font-medium mb-2 block">语言类型</label>
            <select v-model="selectedLanguage" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option v-for="lang in languages" :key="lang.code" :value="lang.code">
                {{ lang.name }}
              </option>
            </select>
          </div>

          <!-- 生成数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">生成数量</label>
            <div class="flex gap-2">
              <input
                v-model.number="generateCount"
                type="number"
                min="1"
                max="100"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">个</span>
            </div>
          </div>

          <!-- 昵称格式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">昵称格式</label>
            <select v-model="nameFormat" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="simple">简洁格式</option>
              <option value="full">完整格式</option>
              <option value="creative">创意格式</option>
            </select>
          </div>
        </div>

        <!-- 快捷按钮 -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            @click="setQuickCount(5)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            5 个昵称
          </button>
          <button
            @click="setQuickCount(10)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            10 个昵称
          </button>
          <button
            @click="setQuickCount(20)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            20 个昵称
          </button>
          <button
            @click="setQuickCount(50)"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            50 个昵称
          </button>
          <button
            @click="setQuickFormat('simple')"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            简洁
          </button>
          <button
            @click="setQuickFormat('full')"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            完整
          </button>
          <button
            @click="setQuickFormat('creative')"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            创意
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="generateNames"
          :disabled="isGenerating"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isGenerating" class="w-5 h-5 animate-spin" />
          <Sparkles v-else class="w-5 h-5" />
          {{ isGenerating ? '生成中...' : '生成昵称' }}
        </button>

        <button
          @click="showImportModal = true"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Upload class="w-5 h-5" />
          导入姓名库
        </button>

        <button
          v-if="generatedNames.length > 0"
          @click="clearResults"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Trash2 class="w-5 h-5" />
          清空结果
        </button>
      </div>

      <!-- 输出区域 -->
      <div v-if="generatedNames.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">生成结果</h2>
          <div class="flex gap-2">
            <button
              @click="copyAllNames"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制全部' }}
            </button>
            <button
              @click="exportNames"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Download class="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="(name, index) in generatedNames"
            :key="index"
            class="group relative bg-muted/30 border border-border rounded-lg p-4 hover:bg-muted/50 transition-all"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-foreground truncate flex-1">{{ name }}</span>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click="copyName(name)"
                  class="text-muted-foreground hover:text-foreground p-1"
                  title="复制"
                >
                  <Copy class="w-4 h-4" />
                </button>
                <button
                  @click="removeName(index)"
                  class="text-muted-foreground hover:text-destructive p-1"
                  title="删除"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="mt-4 text-sm text-muted-foreground">
          共 {{ generatedNames.length }} 个昵称 · {{ uniqueCount }} 个不重复
        </div>
      </div>

      <!-- 语言预览 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">语言类型</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="lang in languages"
            :key="lang.code"
            :class="[
              'p-4 border rounded-lg cursor-pointer transition-all',
              selectedLanguage === lang.code ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            ]"
            @click="selectedLanguage = lang.code"
          >
            <h3 class="font-medium mb-1">{{ lang.name }}</h3>
            <p class="text-sm text-muted-foreground">{{ lang.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">功能特点</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>支持中文、英文、越南语、法语、德语等多种语言</li>
              <li>提供简洁、完整、创意三种昵称格式</li>
              <li>支持自定义导入姓名库，扩展生成范围</li>
              <li>自动去重，确保生成的昵称不重复</li>
              <li>支持批量复制和导出功能</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">昵称格式说明</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground">
              <div>
                <strong class="text-foreground">简洁格式：</strong>
                <p>姓氏+名字，如：张三、John Smith</p>
              </div>
              <div>
                <strong class="text-foreground">完整格式：</strong>
                <p>姓氏+双字名，如：张三丰、John Michael Smith</p>
              </div>
              <div>
                <strong class="text-foreground">创意格式：</strong>
                <p>形容词+名字，如：快乐的小张、Happy John</p>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">常见用途</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>游戏角色命名</li>
              <li>社交媒体账号</li>
              <li>测试数据生成</li>
              <li>创意写作灵感</li>
              <li>应用开发占位数据</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/password-generator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Lock class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">密码生成器</p>
              <p class="text-xs text-muted-foreground">生成安全密码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/text-counter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">字数统计</p>
              <p class="text-xs text-muted-foreground">统计文本信息</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/lorem-ipsum"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机文本生成</p>
              <p class="text-xs text-muted-foreground">Lorem Ipsum生成</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-8 max-w-lg w-full mx-4">
        <h3 class="text-xl font-semibold mb-4">导入姓名库</h3>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">选择语言类型</label>
          <select v-model="importLanguage" class="w-full border border-gray-300 rounded-lg px-3 py-2">
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">上传文件</label>
          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
            @drop="handleFileDrop"
            @dragover.prevent
            @dragenter.prevent
          >
            <Upload class="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p class="text-gray-600 mb-2">拖拽文件到此处或点击选择</p>
            <input
              type="file"
              @change="handleFileSelect"
              accept=".txt,.csv"
              class="hidden"
              ref="fileInput"
            >
            <button
              @click="fileInput?.click()"
              class="text-blue-500 hover:text-blue-700 font-medium"
            >
              选择文件
            </button>
            <p class="text-xs text-gray-500 mt-2">支持 .txt 和 .csv 文件，每行一个姓名</p>
          </div>
        </div>

        <div v-if="importPreview.length > 0" class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">预览 (前5个)</label>
          <div class="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
            <div v-for="(item, index) in importPreview.slice(0, 5)" :key="index" class="text-sm text-gray-700">
              {{ item }}
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="confirmImport"
            :disabled="importPreview.length === 0"
            class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认导入
          </button>
          <button
            @click="cancelImport"
            class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div v-if="showToast" class="fixed bottom-8 right-8 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  User, Sparkles, RefreshCw, Trash2, Upload,
  Copy, Download, X, ArrowRight, Lock, FileText
} from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

// 设置页面标题
const { setPageTitle } = useSEO()
setPageTitle('随机昵称生成器')

// 响应式数据
const selectedLanguage = ref('chinese')
const generateCount = ref(10)
const nameFormat = ref('simple')
const isGenerating = ref(false)
const generatedNames = ref([])
const showImportModal = ref(false)
const importLanguage = ref('chinese')
const importPreview = ref([])
const selectedFile = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const copied = ref(false)
const fileInput = ref(null)

// 语言配置
const languages = ref([
  { code: 'chinese', name: '中文', desc: '中文姓名' },
  { code: 'english', name: '英文', desc: 'English Names' },
  { code: 'vietnamese', name: '越南语', desc: 'Tên Việt Nam' },
  { code: 'french', name: '法语', desc: 'Noms Français' },
  { code: 'german', name: '德语', desc: 'Deutsche Namen' }
])

// 预设姓名库
const nameLibraries = ref({
  chinese: {
    surnames: ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'],
    names: ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞'],
    creative: ['快乐', '阳光', '温柔', '勇敢', '聪明', '可爱', '神秘', '优雅', '活泼', '沉稳']
  },
  english: {
    surnames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
    names: ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'],
    creative: ['Happy', 'Sunny', 'Gentle', 'Brave', 'Smart', 'Cute', 'Mysterious', 'Elegant', 'Lively', 'Calm']
  },
  vietnamese: {
    surnames: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Huỳnh', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'],
    names: ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hải', 'Linh', 'Minh', 'Nam', 'Quân'],
    creative: ['Vui vẻ', 'Nắng', 'Nhẹ nhàng', 'Dũng cảm', 'Thông minh', 'Dễ thương', 'Bí ẩn', 'Thanh lịch', 'Năng động', 'Điềm tĩnh']
  },
  french: {
    surnames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'],
    names: ['Pierre', 'Marie', 'Jean', 'Isabelle', 'Michel', 'Sophie', 'Philippe', 'Valérie', 'Stéphane', 'Nathalie'],
    creative: ['Heureux', 'Soleil', 'Doux', 'Courageux', 'Intelligent', 'Mignon', 'Mystérieux', 'Élégant', 'Vif', 'Calme']
  },
  german: {
    surnames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'],
    names: ['Hans', 'Anna', 'Klaus', 'Maria', 'Wolfgang', 'Helena', 'Jürgen', 'Sabine', 'Stefan', 'Monika'],
    creative: ['Glücklich', 'Sonnig', 'Sanft', 'Mutig', 'Klug', 'Süß', 'Geheimnisvoll', 'Elegant', 'Lebhaft', 'Ruhig']
  }
})

// 计算属性
const uniqueCount = computed(() => {
  return new Set(generatedNames.value).size
})

// 生成昵称
const generateNames = async () => {
  if (isGenerating.value) return

  isGenerating.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟加载

    const library = nameLibraries.value[selectedLanguage.value]
    const newNames = []
    const maxAttempts = generateCount.value * 10 // 防止无限循环
    let attempts = 0

    while (newNames.length < generateCount.value && attempts < maxAttempts) {
      let name = ''

      switch (nameFormat.value) {
        case 'simple':
          name = generateSimpleName(library)
          break
        case 'full':
          name = generateFullName(library)
          break
        case 'creative':
          name = generateCreativeName(library)
          break
      }

      if (name && !newNames.includes(name)) {
        newNames.push(name)
      }

      attempts++
    }

    generatedNames.value = newNames
    showToastMessage(`成功生成 ${newNames.length} 个昵称！`)

  } catch (error) {
    console.error('生成昵称失败:', error)
    showToastMessage('生成失败，请重试')
  } finally {
    isGenerating.value = false
  }
}

// 生成简单格式姓名
const generateSimpleName = (library) => {
  const surname = library.surnames[Math.floor(Math.random() * library.surnames.length)]
  const name = library.names[Math.floor(Math.random() * library.names.length)]
  return selectedLanguage.value === 'english' ? `${name} ${surname}` : `${surname}${name}`
}

// 生成完整格式姓名
const generateFullName = (library) => {
  const surname = library.surnames[Math.floor(Math.random() * library.surnames.length)]
  const name1 = library.names[Math.floor(Math.random() * library.names.length)]
  const name2 = library.names[Math.floor(Math.random() * library.names.length)]
  return selectedLanguage.value === 'english' ? `${name1} ${name2} ${surname}` : `${surname}${name1}${name2}`
}

// 生成创意格式姓名
const generateCreativeName = (library) => {
  const surname = library.surnames[Math.floor(Math.random() * library.surnames.length)]
  const name = library.names[Math.floor(Math.random() * library.names.length)]
  const creative = library.creative[Math.floor(Math.random() * library.creative.length)]

  if (selectedLanguage.value === 'english') {
    return `${creative} ${name}`
  } else if (selectedLanguage.value === 'chinese') {
    return `${creative}的${surname}${name}`
  } else {
    return `${creative} ${name} ${surname}`
  }
}

// 清空结果
const clearResults = () => {
  generatedNames.value = []
  showToastMessage('已清空所有结果')
}

// 复制单个姓名
const copyName = async (name) => {
  try {
    await navigator.clipboard.writeText(name)
    showToastMessage(`已复制: ${name}`)
  } catch (error) {
    console.error('复制失败:', error)
    showToastMessage('复制失败')
  }
}

// 设置快捷数量
const setQuickCount = (count) => {
  generateCount.value = count
}

// 设置快捷格式
const setQuickFormat = (format) => {
  nameFormat.value = format
}

// 复制所有姓名
const copyAllNames = async () => {
  try {
    const text = generatedNames.value.join('\n')
    await navigator.clipboard.writeText(text)
    copied.value = true
    showToastMessage(`已复制 ${generatedNames.value.length} 个姓名`)
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    showToastMessage('复制失败')
  }
}

// 导出姓名
const exportNames = () => {
  const text = generatedNames.value.join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nicknames_${selectedLanguage.value}_${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showToastMessage(`已导出 ${generatedNames.value.length} 个姓名`)
}

// 移除单个姓名
const removeName = (index) => {
  generatedNames.value.splice(index, 1)
  showToastMessage('已删除')
}

// 文件拖拽处理
const handleFileDrop = (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

// 文件选择处理
const handleFileSelect = (event) => {
  const files = event.target.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

// 处理文件
const processFile = async (file) => {
  try {
    const text = await file.text()
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    importPreview.value = lines.slice(0, 10) // 显示前10个预览
    selectedFile.value = { name: file.name, content: lines }
  } catch (error) {
    console.error('文件处理失败:', error)
    showToastMessage('文件处理失败')
  }
}

// 确认导入
const confirmImport = () => {
  if (!selectedFile.value) return

  const lines = selectedFile.value.content

  // 根据语言类型分别存储到姓氏或名字库
  const library = nameLibraries.value[importLanguage.value]

  // 简单判断：如果是中文且是单个字，当作姓氏；否则当作名字
  lines.forEach(line => {
    if (importLanguage.value === 'chinese' && line.length === 1) {
      if (!library.surnames.includes(line)) {
        library.surnames.push(line)
      }
    } else {
      if (!library.names.includes(line)) {
        library.names.push(line)
      }
    }
  })

  showToastMessage(`成功导入 ${lines.length} 个姓名`)
  cancelImport()
}

// 取消导入
const cancelImport = () => {
  showImportModal.value = false
  importPreview.value = []
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 显示提示消息
const showToastMessage = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 组件挂载
onMounted(() => {
  // 初始化
})
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 自定义滚动条 */
.max-h-32::-webkit-scrollbar {
  width: 4px;
}

.max-h-32::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.max-h-32::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.max-h-32::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>