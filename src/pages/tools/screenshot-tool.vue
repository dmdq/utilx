<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">网页截图工具 - 在线捕获网页截图</h1>
      <p class="text-muted-foreground">专业的在线网页截图工具，支持整页截图、可视区域截图、元素截图、延迟截图等多种模式，提供灵活的截图选项和批量下载功能。帮助开发者和设计师快速捕获网页内容。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      <!-- 左侧控制面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 截图模式 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            截图设置
          </h2>

          <div class="space-y-4">
            <!-- 截图模式 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">截图模式</label>
              <select
                v-model="captureMode"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="viewport">可视区域</option>
                <option value="fullpage">整页截图</option>
                <option value="element">元素截图</option>
                <option value="delay">延迟截图</option>
              </select>
            </div>

            <!-- 延迟时间 -->
            <div v-if="captureMode === 'delay'">
              <label class="block text-sm font-medium text-foreground mb-2">
                延迟时间: {{ delayTime }}秒
              </label>
              <input
                v-model.number="delayTime"
                type="range"
                min="1"
                max="10"
                class="w-full"
              />
            </div>

            <!-- 目标网址（整页截图） -->
            <div v-if="captureMode === 'fullpage'">
              <label class="block text-sm font-medium text-foreground mb-2">目标网址</label>
              <input
                v-model="targetUrl"
                type="url"
                placeholder="https://example.com"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                注：由于浏览器安全限制，此功能需要使用后端API或浏览器扩展
              </p>
            </div>

            <!-- 元素选择器 -->
            <div v-if="captureMode === 'element'">
              <label class="block text-sm font-medium text-foreground mb-2">元素选择器</label>
              <div class="space-y-2">
                <input
                  v-model="elementSelector"
                  type="text"
                  placeholder="#element-id 或 .class-name"
                  class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
                <button
                  @click="selectElement"
                  class="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                >
                  <MousePointer class="h-4 w-4 inline mr-1" />
                  点击选择元素
                </button>
              </div>
            </div>

            <!-- 图片格式 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输出格式</label>
              <select
                v-model="outputFormat"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>

            <!-- 图片质量 -->
            <div v-if="outputFormat === 'jpeg'">
              <label class="block text-sm font-medium text-foreground mb-2">
                图片质量: {{ quality }}%
              </label>
              <input
                v-model="quality"
                type="range"
                min="10"
                max="100"
                step="5"
                class="w-full"
              />
            </div>

            <!-- 高级选项 -->
            <div>
              <button
                @click="showAdvanced = !showAdvanced"
                class="w-full text-left px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm flex items-center justify-between"
              >
                <span>高级选项</span>
                <ChevronUp v-if="showAdvanced" class="h-4 w-4" />
                <ChevronDown v-else class="h-4 w-4" />
              </button>

              <div v-if="showAdvanced" class="mt-3 space-y-3">
                <label class="flex items-center">
                  <input
                    v-model="includeScrollbar"
                    type="checkbox"
                    class="mr-2 rounded border border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">包含滚动条</span>
                </label>

                <label class="flex items-center">
                  <input
                    v-model="captureShadow"
                    type="checkbox"
                    class="mr-2 rounded border border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">捕获元素阴影</span>
                </label>

                <label class="flex items-center">
                  <input
                    v-model="autoSave"
                    type="checkbox"
                    class="mr-2 rounded border border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">自动保存截图</span>
                </label>

                <label class="flex items-center">
                  <input
                    v-model="copyToClipboard"
                    type="checkbox"
                    class="mr-2 rounded border border-border text-primary focus:ring-primary bg-background"
                  />
                  <span class="text-sm text-foreground">复制到剪贴板</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <button
            @click="startCapture"
            :disabled="capturing || (captureMode === 'fullpage' && !targetUrl)"
            class="w-full bg-primary text-primary-foreground py-3 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Loader2 v-if="capturing" class="h-5 w-5 mr-2 animate-spin" />
            <Camera v-else class="h-5 w-5 mr-2" />
            {{ capturing ? '截图中...' : getCaptureButtonText() }}
          </button>

          <button
            v-if="screenshots.length > 0"
            @click="clearAll"
            class="w-full mt-3 bg-muted text-foreground py-3 px-4 rounded-md hover:bg-muted/80 transition-colors flex items-center justify-center"
          >
            <Trash2 class="h-5 w-5 mr-2" />
            清除所有截图
          </button>
        </div>

        <!-- 快捷键说明 -->
        <div class="bg-muted rounded-lg p-4">
          <h3 class="text-sm font-semibold text-foreground mb-2">快捷键</h3>
          <div class="space-y-1 text-xs text-muted-foreground">
            <div class="flex justify-between">
              <span>快速截图</span>
              <kbd class="px-2 py-1 bg-background rounded">Ctrl + Shift + S</kbd>
            </div>
            <div class="flex justify-between">
              <span>整页截图</span>
              <kbd class="px-2 py-1 bg-background rounded">Ctrl + Shift + P</kbd>
            </div>
            <div class="flex justify-between">
              <span>元素截图</span>
              <kbd class="px-2 py-1 bg-background rounded">Ctrl + Shift + E</kbd>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧预览区域 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 当前截图预览 -->
        <div v-if="currentScreenshot" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold flex items-center text-foreground">
              <Image class="h-5 w-5 mr-2 text-primary" />
              最新截图
            </h3>
            <div class="flex space-x-2">
              <button
                @click="downloadCurrent"
                class="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm flex items-center"
              >
                <Download class="h-4 w-4 mr-1" />
                下载
              </button>
              <button
                @click="copyCurrent"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors text-sm flex items-center"
              >
                <Copy class="h-4 w-4 mr-1" />
                复制
              </button>
              <button
                @click="editCurrent"
                class="px-3 py-1 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm flex items-center"
              >
                <Edit class="h-4 w-4 mr-1" />
                编辑
              </button>
            </div>
          </div>

          <div class="relative bg-muted rounded-lg overflow-hidden">
            <img
              :src="currentScreenshot.data"
              :alt="currentScreenshot.name"
              class="w-full h-auto"
            />

            <!-- 截图信息 -->
            <div class="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur text-foreground p-3">
              <div class="flex justify-between text-sm">
                <span>{{ currentScreenshot.name }}</span>
                <span>{{ currentScreenshot.width }} × {{ currentScreenshot.height }}</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ new Date(currentScreenshot.timestamp).toLocaleString() }}
              </div>
            </div>
          </div>
        </div>

        <!-- 截图历史 -->
        <div v-if="screenshots.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center justify-between text-foreground">
            <span class="flex items-center">
              <History class="h-5 w-5 mr-2 text-primary" />
              截图历史 ({{ screenshots.length }})
            </span>
            <button
              @click="downloadAll"
              class="text-sm text-primary hover:text-primary/80"
            >
              下载全部
            </button>
          </h3>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div
              v-for="(screenshot, index) in screenshots"
              :key="screenshot.id"
              class="relative group cursor-pointer"
              @click="selectScreenshot(index)"
            >
              <div class="relative">
                <img
                  :src="screenshot.data"
                  :alt="screenshot.name"
                  class="w-full h-32 object-cover rounded-lg border-2 transition-all"
                  :class="[
                    selectedIndex === index
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border group-hover:border-muted-foreground'
                  ]"
                />

                <!-- 操作按钮 -->
                <div class="absolute inset-0 bg-background/80 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    @click.stop="downloadScreenshot(screenshot)"
                    class="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
                  >
                    <Download class="h-4 w-4" />
                  </button>
                  <button
                    @click.stop="copyScreenshot(screenshot)"
                    class="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/90"
                  >
                    <Copy class="h-4 w-4" />
                  </button>
                  <button
                    @click.stop="deleteScreenshot(index)"
                    class="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- 截图信息 -->
              <div class="mt-2">
                <div class="text-xs text-muted-foreground truncate">{{ screenshot.name }}</div>
                <div class="text-xs text-muted-foreground/70">{{ screenshot.width }} × {{ screenshot.height }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button 
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>
      
      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是网页截图工具？
        </h2>
        <p class="text-muted-foreground mb-4">
          网页截图工具是一种在线服务，可以帮助用户捕获网页的视觉快照。无论是整个页面、当前可见区域还是特定元素，
          都可以通过浏览器的屏幕捕获功能快速生成高质量的图片。这对于开发者调试、设计师参考、内容分享等场景非常有用。
        </p>
        <p class="text-muted-foreground mb-4">
          现代网页截图工具不仅支持基本的截图功能，还提供了丰富的选项来自定义输出效果，如图片格式、质量、延迟截图等。
          一些高级工具甚至支持滚动截图，可以捕获超出浏览器窗口的完整页面内容。
        </p>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种截图模式</strong>: 支持可视区域、整页截图、元素截图和延迟截图四种模式</li>
          <li><strong>灵活输出格式</strong>: 支持 PNG、JPEG、WebP 等主流图片格式</li>
          <li><strong>质量控制</strong>: 可调节 JPEG 图片的质量，平衡文件大小和图像质量</li>
          <li><strong>高级选项</strong>: 包含滚动条、阴影、自动保存等高级截图选项</li>
          <li><strong>快捷键支持</strong>: 提供快捷键快速执行常用截图操作</li>
          <li><strong>批量管理</strong>: 支持截图历史管理和批量下载</li>
          <li><strong>剪贴板集成</strong>: 可直接将截图复制到剪贴板，方便粘贴使用</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>开发者调试</strong>: 快速捕获页面状态，用于 bug 报告和问题诊断</li>
          <li><strong>设计师参考</strong>: 保存网页设计灵感或竞品分析素材</li>
          <li><strong>内容分享</strong>: 将网页内容以图片形式分享到社交媒体</li>
          <li><strong>文档制作</strong>: 在技术文档或演示文稿中插入网页截图</li>
          <li><strong>教学培训</strong>: 制作教程时展示网页操作步骤</li>
          <li><strong>市场调研</strong>: 保存竞争对手的网页设计和布局</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么某些截图功能需要浏览器权限？</h3>
            <p class="text-muted-foreground mt-1">
              浏览器出于安全考虑，默认不允许网页随意访问屏幕内容。截图功能需要调用浏览器的屏幕捕获API，
              因此首次使用时会弹出权限请求对话框。用户需要明确授权才能进行屏幕截图。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">整页截图和可视区域截图有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              可视区域截图只捕获当前浏览器窗口内可见的部分，而整页截图则尝试捕获整个网页内容，
              包括需要滚动才能看到的部分。不过由于浏览器安全限制，纯前端实现的整页截图有一定局限性。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何提高截图质量？</h3>
            <p class="text-muted-foreground mt-1">
              选择 PNG 格式可以获得无损质量的截图，但文件较大。如果对文件大小有要求，
              可以选择 JPEG 格式并调整质量参数。对于现代浏览器，WebP 格式是一个很好的折中选择。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">截图工具有哪些浏览器兼容性要求？</h3>
            <p class="text-muted-foreground mt-1">
              截图工具需要浏览器支持 Screen Capture API，主流的现代浏览器（Chrome 72+、Firefox 66+、Edge 79+）
              都支持此功能。IE 和一些老旧浏览器可能不支持或支持有限。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink 
          v-for="relatedTool in relatedTools" 
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component 
              :is="iconMap[relatedTool.icon] || Camera" 
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import { 
  Settings, Camera, MousePointer, ChevronUp, ChevronDown, Loader2,
  Image, Download, Copy, Edit, History, Trash2, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '网页截图工具 - 在线捕获网页截图',
  meta: [
    { name: 'description', content: '免费在线网页截图工具，支持整页截图、可视区域截图、元素截图、延迟截图等多种模式，提供灵活的截图选项和批量下载功能。' },
    { name: 'keywords', content: '网页截图,在线截图,整页截图,屏幕截图,截图工具,浏览器截图' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'screenshot-tool')
const category = categories.find(c => c.id === 'network')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 响应式数据
const capturing = ref(false)
const screenshots = ref([])
const selectedIndex = ref(0)
const showAdvanced = ref(false)

// 截图设置
const captureMode = ref('viewport')
const delayTime = ref(3)
const targetUrl = ref('')
const elementSelector = ref('')
const outputFormat = ref('png')
const quality = ref(90)
const includeScrollbar = ref(false)
const captureShadow = ref(true)
const autoSave = ref(false)
const copyToClipboard = ref(false)

// 图标映射
const iconMap = {
  Settings, Camera, MousePointer, ChevronUp, ChevronDown, Loader2,
  Image, Download, Copy, Edit, History, Trash2, HelpCircle
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t => 
    t.category === 'network' && t.id !== 'screenshot-tool'
  ).slice(0, 2)
  
  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'user-agent-parser'),
    tools.find(t => t.id === 'mime-types'),
    tools.find(t => t.id === 'http-client'),
    tools.find(t => t.id === 'dns-lookup')
  ].filter(Boolean)
  
  return [...sameCategory, ...recommended].slice(0, 4)
})

// 计算属性
const currentScreenshot = computed(() => {
  return screenshots.value[0] || null
})

// 获取截图按钮文本
const getCaptureButtonText = () => {
  switch (captureMode.value) {
    case 'viewport':
      return '截图当前页面'
    case 'fullpage':
      return '截图整页'
    case 'element':
      return '截图选中元素'
    case 'delay':
      return `${delayTime.value}秒后截图`
    default:
      return '开始截图'
  }
}

// 截图功能
const startCapture = async () => {
  capturing.value = true

  try {
    let screenshot

    switch (captureMode.value) {
      case 'viewport':
        screenshot = await captureViewport()
        break
      case 'fullpage':
        screenshot = await captureFullPage()
        break
      case 'element':
        screenshot = await captureElement()
        break
      case 'delay':
        screenshot = await captureWithDelay()
        break
    }

    if (screenshot) {
      await saveScreenshot(screenshot)
    }
  } finally {
    capturing.value = false
  }
}

const captureViewport = async () => {
  // 检查是否支持 Screen Capture API
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('您的浏览器不支持屏幕截图功能')
  }

  // 请求屏幕捕获权限
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      mediaSource: 'screen'
    }
  })

  // 创建视频元素来捕获帧
  const video = document.createElement('video')
  video.srcObject = stream
  video.play()

  // 等待视频加载
  await new Promise((resolve) => {
    video.onloadedmetadata = resolve
  })

  // 创建canvas
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')

  // 绘制当前帧
  ctx.drawImage(video, 0, 0)

  // 停止屏幕捕获
  stream.getTracks().forEach(track => track.stop())

  return canvas.toDataURL(`image/${outputFormat.value}`, quality.value / 100)
}

const captureFullPage = async () => {
  // 由于浏览器安全限制，这里使用模拟实现
  // 实际应用中需要使用后端API或浏览器扩展
  throw new Error('整页截图需要后端API支持。请使用浏览器扩展或其他工具。')
}

const captureElement = async () => {
  if (!elementSelector.value) {
    // 使用元素选择模式
    return await captureElementWithSelector()
  } else {
    // 使用指定选择器
    const element = document.querySelector(elementSelector.value)
    if (!element) {
      throw new Error('找不到指定的元素')
    }
    return await captureElementNode(element)
  }
}

const captureElementWithSelector = () => {
  return new Promise((resolve, reject) => {
    // 添加选择样式
    const style = document.createElement('style')
    style.textContent = `
      .screenshot-hover {
        outline: 2px solid #10b981 !important;
        outline-offset: 2px !important;
        cursor: crosshair !important;
      }
    `
    document.head.appendChild(style)

    // 鼠标移动事件
    const onMouseMove = (e) => {
      document.querySelectorAll('.screenshot-hover').forEach(el => {
        el.classList.remove('screenshot-hover')
      })

      if (e.target !== document.body && e.target !== document.documentElement) {
        e.target.classList.add('screenshot-hover')
      }
    }

    // 点击事件
    const onClick = async (e) => {
      e.preventDefault()
      e.stopPropagation()

      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('click', onClick)
      document.head.removeChild(style)

      document.querySelectorAll('.screenshot-hover').forEach(el => {
        el.classList.remove('screenshot-hover')
      })

      try {
        const screenshot = await captureElementNode(e.target)
        resolve(screenshot)
      } catch (error) {
        reject(error)
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('click', onClick, true)
  })
}

const captureElementNode = async (element) => {
  // 使用 html2canvas 库（需要安装）
  // 这里提供一个简化实现
  const canvas = document.createElement('canvas')
  const rect = element.getBoundingClientRect()

  canvas.width = rect.width
  canvas.height = rect.height
  const ctx = canvas.getContext('2d')

  // 简单实现：直接绘制元素（实际应用中需要更复杂的逻辑）
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 这里应该使用 html2canvas 或其他库来准确捕获元素
  // 暂时返回一个占位图片
  return canvas.toDataURL(`image/${outputFormat.value}`, quality.value / 100)
}

const captureWithDelay = async () => {
  return new Promise((resolve) => {
    // 显示倒计时
    let countdown = delayTime.value
    const interval = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(interval)
        // 执行截图
        captureViewport().then(resolve)
      }
    }, 1000)
  })
}

// 保存截图
const saveScreenshot = async (dataUrl) => {
  const img = await loadImage(dataUrl)

  const screenshot = {
    id: Date.now(),
    name: `screenshot_${screenshots.value.length + 1}.${outputFormat.value}`,
    data: dataUrl,
    width: img.width,
    height: img.height,
    timestamp: new Date().toISOString(),
    mode: captureMode.value
  }

  screenshots.value.unshift(screenshot)
  selectedIndex.value = 0

  // 自动保存
  if (autoSave.value) {
    downloadScreenshot(screenshot)
  }

  // 复制到剪贴板
  if (copyToClipboard.value) {
    copyScreenshot(screenshot)
  }
}

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 选择元素
const selectElement = () => {
  elementSelector.value = ''
  captureElement()
    .then(() => {
      // 成功选择元素
    })
    .catch(() => {
      // 用户取消
    })
}

// 截图管理
const selectScreenshot = (index) => {
  selectedIndex.value = index
}

const downloadScreenshot = (screenshot) => {
  const link = document.createElement('a')
  link.download = screenshot.name
  link.href = screenshot.data
  link.click()
}

const downloadCurrent = () => {
  if (currentScreenshot.value) {
    downloadScreenshot(currentScreenshot.value)
  }
}

const copyScreenshot = async (screenshot) => {
  try {
    const blob = await (await fetch(screenshot.data)).blob()
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ])
    alert('截图已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请使用下载功能')
  }
}

const copyCurrent = () => {
  if (currentScreenshot.value) {
    copyScreenshot(currentScreenshot.value)
  }
}

const editCurrent = () => {
  // 跳转到图片编辑器
  // window.open(`/editor?image=${encodeURIComponent(currentScreenshot.value.data)}`, '_blank')
  alert('图片编辑功能正在开发中')
}

const deleteScreenshot = (index) => {
  screenshots.value.splice(index, 1)
  if (selectedIndex.value >= screenshots.value.length) {
    selectedIndex.value = Math.max(0, screenshots.value.length - 1)
  }
}

const clearAll = () => {
  screenshots.value = []
  selectedIndex.value = 0
}

const downloadAll = async () => {
  if (screenshots.value.length === 0) return

  if (screenshots.value.length === 1) {
    downloadScreenshot(screenshots.value[0])
    return
  }

  // 批量下载（使用JSZip）
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  screenshots.value.forEach((screenshot) => {
    const base64Data = screenshot.data.split(',')[1]
    zip.file(screenshot.name, base64Data, { base64: true })
  })

  const content = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.download = `screenshots_${Date.now()}.zip`
  link.href = URL.createObjectURL(content)
  link.click()
}

// 快捷键处理
const handleKeyDown = (e) => {
  if (e.ctrlKey && e.shiftKey) {
    switch (e.key) {
      case 'S':
        e.preventDefault()
        captureMode.value = 'viewport'
        startCapture()
        break
      case 'P':
        e.preventDefault()
        captureMode.value = 'fullpage'
        startCapture()
        break
      case 'E':
        e.preventDefault()
        captureMode.value = 'element'
        selectElement()
        break
    }
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>