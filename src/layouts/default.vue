<template>
  <div class="bg-background text-foreground h-screen overflow-hidden flex antialiased selection:bg-primary/30">

    <!-- 移动端遮罩 (点击关闭侧边栏) -->
    <div
      id="mobileOverlay"
      class="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity lg:hidden"
      :class="{ 'hidden': !isSidebarOpen }"
      @click="toggleSidebar"
    ></div>

    <!-- 侧边栏 -->
    <aside 
      id="sidebar"
      class="fixed inset-y-0 left-0 z-50 w-42 bg-sidebar border-r border-sidebar-border transform transition-all duration-300 h-full lg:static lg:flex flex-col"
      :class="{ 
        '-translate-x-full': !isSidebarOpen, 
        'translate-x-0': isSidebarOpen,
        'lg:translate-x-0': true,
        'lg:w-20': isCollapsed 
      }"
    >
      <Sidebar
        :collapsed="isCollapsed"
        :current-category="currentCategory"
        @category-change="handleCategoryChange"
        @search="$emit('search', $event)"
        @close-sidebar="isSidebarOpen = false"
      />
      <!-- 伸缩按钮 -->
      <button 
        class="hidden lg:flex absolute right-0 top-8 transform translate-x-1/2 -translate-y-1/2 z-40 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
        @click="toggleCollapse"
      >
        <ChevronLeft 
          class="w-4 h-4 transition-transform" 
          :class="{ 'rotate-180': isCollapsed }" 
        />
      </button>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
      <!-- 桌面端 Header -->
      <header class="hidden lg:flex h-16 border-b border-border items-center justify-between px-6 bg-background/80 backdrop-blur z-30">
        <!-- 左侧：面包屑导航 -->
        <div class="flex items-center" style="width: 280px;">
          <Breadcrumb v-if="showBreadcrumbs && route.path !== '/'" />
          <!-- 首页显示打字效果 -->
          <div v-else-if="route.path === '/'" class="text-lg font-mono text-foreground">
            <span class="inline-block">{{ typedText }}</span>
            <span class="animate-pulse">|</span>
          </div>
        </div>

        <!-- 中间：智能搜索中枢 -->
        <div class="flex-1 flex items-center justify-center">
          <div
            @click="openSearch"
            class="w-80 flex items-center gap-2 px-3 py-1.5 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-lg text-sm text-muted-foreground cursor-pointer transition-all duration-200 group"
          >
            <!-- 搜索文本 -->
            <div class="flex items-center flex-1 justify-center gap-1">
              <span class="font-mono text-muted-foreground/70 group-hover:text-muted-foreground">Press</span>
              <kbd class="px-1.5 py-0.5 text-xs bg-background border border-border/50 rounded font-mono group-hover:bg-background/90 transition-colors">⌘</kbd>
              <span class="text-muted-foreground/70 group-hover:text-muted-foreground">+</span>
              <kbd class="px-1.5 py-0.5 text-xs bg-background border border-border/50 rounded font-mono group-hover:bg-background/90 transition-colors">K</kbd>
              <span class="text-muted-foreground/50 group-hover:text-muted-foreground">to search</span>
            </div>

            <!-- 搜索图标 -->
            <Search class="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />

            <!-- 脉动动画指示器 -->
            <div class="w-1 h-1 bg-primary/30 group-hover:bg-primary/50 rounded-full transition-all duration-300"></div>
          </div>
        </div>

        <!-- 右侧：功能图标区 -->
        <div class="flex items-center gap-2">
          <!-- 小工具模块 -->
          <div class="hidden lg:flex items-center px-3 py-1.5 bg-muted/50 rounded-md border border-border/50 relative overflow-hidden transition-all duration-300" style="height: 32px; min-width: 280px;">
            <!-- 显示内容区域 -->
            <div class="absolute left-3 top-0 right-20 flex flex-col transition-transform duration-300 ease-in-out" :style="{ transform: `translateY(-${currentWidget * 32}px)` }">
              <!-- 0: IP地址 -->
              <div class="flex items-center gap-2 h-8 whitespace-nowrap overflow-hidden">
                <Globe class="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span class="text-sm font-mono text-muted-foreground flex-1 truncate" :title="userIP">IP: {{ userIP }}</span>
              </div>
              <!-- 1: 时间戳 -->
              <div class="flex items-center gap-2 h-8 whitespace-nowrap overflow-hidden">
                <Clock class="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span class="text-sm font-mono text-muted-foreground flex-1 truncate" :title="currentTime">{{ currentTime }}</span>
              </div>

              <!-- 2: 文字tips -->
              <div class="flex items-center gap-2 h-8 whitespace-nowrap overflow-hidden">
                <Sparkles class="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span class="text-sm text-muted-foreground flex-1 truncate">为效率而生, Just Util.cn</span>
              </div>
            </div>

            <!-- 竖线分割 -->
            <div class="absolute right-16 top-1/2 transform -translate-y-1/2 w-px h-4 bg-muted-foreground/30"></div>

            <!-- 右侧控制按钮组 -->
            <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5 z-10">
              <!-- 复制按钮 -->
              <button
                @click="copyWidgetContent"
                class="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded transition-all duration-200 relative group"
                :title="copySuccess ? '已复制!' : '点击复制当前内容'"
              >
                <Check v-if="copySuccess" class="w-3 h-3 text-green-500" />
                <Copy v-else class="w-3 h-3" />
                <!-- Tooltip -->
                <div v-if="copySuccess" class="absolute -top-8 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap animate-fade-in shadow-lg">
                  已复制!
                </div>
                <div v-else class="absolute -top-8 right-0 bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                  点击复制
                </div>
              </button>

              <!-- 刷新切换按钮 -->
              <button
                @click="switchWidget(1)"
                class="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded transition-all duration-200"
                title="切换显示"
              >
                <RefreshCw class="w-3 h-3" />
              </button>
            </div>
          </div>
          <!-- GitHub -->
          <a
            href="https://github.com/dmdq/utilx"
            target="_blank"
            class="group flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
          >
            <Github class="w-4 h-4" />
            <span class="hidden sm:inline"></span>
          </a>

          <!-- 多语言切换, 暂时注释，待后续开发 -->
          <!-- <button class="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50">
            <Languages class="w-5 h-5" />
          </button> -->

          <!-- 主题切换 -->
          <button
            class="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50"
            @click="toggleTheme"
          >
            <Sun
              class="w-5 h-5 hidden dark:block"
            />
            <Moon
              class="w-5 h-5 block dark:hidden"
            />
          </button>
        </div>
      </header>

      <!-- 移动端 Header -->
      <header class="lg:hidden h-14 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur z-30">
        <div class="flex items-center gap-3">
          <button
            id="menuBtn"
            class="p-2 -ml-2 text-muted-foreground hover:text-foreground"
            @click="toggleSidebar"
          >
            <Menu class="w-6 h-6" />
          </button>
          <NuxtLink to="/" class="font-bold hover:text-primary transition-colors">Util.cn</NuxtLink>
        </div>
        <button class="p-2 text-muted-foreground" @click="openSearch">
          <Search class="w-5 h-5" />
        </button>
      </header>

      <!-- 内容滚动容器 -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 scroll-smooth" id="scrollContainer">
        <div class="min-h-full flex flex-col">
          <div class="flex-auto">
            <slot />
          </div>
          <Footer />
        </div>
      </div>

      <!-- 全局底部脚本区域 -->
      <div v-if="siteConfig.customFooterScripts" v-html="siteConfig.customFooterScripts"></div>

    </main>

    <!-- 全局搜索弹窗 -->
    <GlobalSearch v-model="isSearchOpen" />

    <!-- PWA 安装提示 -->
    <PWAInstallPrompt />

    <!-- 通知组件 -->
    <Notification />

    <!-- 快捷工具 -->
    <QuickTools />
  </div>

  
  
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Search, ChevronLeft, Languages, Sun, Moon, Sparkles, Github, Globe, RefreshCw, Clock, Copy, Check } from 'lucide-vue-next'
import Sidebar from '~/components/Sidebar.vue'
import Footer from '~/components/Footer.vue'
import GlobalSearch from '~/components/GlobalSearch.vue'
import Breadcrumb from '~/components/Breadcrumb.vue'
import PWAInstallPrompt from '~/components/PWAInstallPrompt.vue'
import Notification from '~/components/Notification.vue'
import QuickTools from '~/components/QuickTools.vue'
import { siteConfig } from '~/data/site'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'

const router = useRouter()
const route = useRoute()

defineEmits(['search'])

const isSidebarOpen = ref(false)
const isCollapsed = ref(false)
const currentCategory = ref('all')
const isSearchOpen = ref(false)
const userIP = ref('获取中...')
const currentWidget = ref(0) // 0: IP地址, 1: 时间戳, 2: 文字tips
const currentTime = ref('')
const copySuccess = ref(false) // 复制成功状态
const typedText = ref('') // 打字效果文本
const typewriterTexts = ref(['Hello World', '好用工具就上有条', '高效、安全、免费',"Util.cn 您身边的工具助手"]) // 要循环打出的文本数组
const currentTextIndex = ref(0) // 当前文本索引
let typewriterTimer = null // 存储打字定时器ID
let isTypewriterActive = ref(false) // 打字效果是否激活

// 计算当前分类名称
const currentCategoryName = computed(() => {
  if (currentCategory.value === 'all') return ''
  const category = categories.find(c => c.id === currentCategory.value)
  return category ? category.name : ''
})

// 计算当前工具名称
const currentToolName = computed(() => {
  // 检查是否是静态页面（about, privacy, terms, cookie等）
  const staticPages = {
    '/about/': '关于我们',
    '/privacy/': '隐私政策',
    '/terms/': '服务条款',
    '/cookie/': 'Cookie政策'
  }

  // 检查是否是特殊页面
  const specialPages = {
    '/all/': '全部工具',
    '/explore/': '工具探索',
    '/favorites/': '我的收藏',
    '/recent/': '最近使用',
    '/feedback/': '提交反馈',
    '/cookie/': 'Cookie政策',
    '/faq/': '常见问题',
    '/sitemap/': '站点地图',
     '/tags/': '标签导航'
  }

  if (route && staticPages[route.path]) {
    return staticPages[route.path]
  }

  if (route && specialPages[route.path]) {
    return specialPages[route.path]
  }

  // 从路由中提取工具ID
  if (route) {
    const pathParts = route.path.split('/').filter(part => part)
    if (pathParts.length > 1) {
      const toolId = pathParts[1]
      const tool = tools.find(t => t.id === toolId)
      return tool ? tool.name : ''
    }
  }
  return ''
})

// 计算页面标题（用于面包屑）
const pageTitle = computed(() => {
  // 如果路由元数据中有标题，使用它
  if (route && route.meta && route.meta.title) {
    return route.meta.title
  }

  // 检查是否是静态页面
  const staticPages = {
    '/about/': '关于我们',
    '/privacy/': '隐私政策',
    '/terms/': '服务条款',
    '/cookie/': 'Cookie政策'
  }

  // 检查是否是特殊页面
  const specialPages = {
    '/all/': '全部工具',
    '/explore/': '工具探索',
    '/favorites/': '我的收藏',
    '/recent/': '最近使用',
    '/feedback/': '提交反馈',
    '/cookie/': 'Cookie政策',
    '/faq/': '常见问题',
    '/sitemap/': '站点地图',
    '/tags/': '标签导航'
  }

  if (route && staticPages[route.path]) {
    return staticPages[route.path]
  }

  if (route && specialPages[route.path]) {
    return specialPages[route.path]
  }

  // 检查是否是标签详情页
  if (route && route.path.startsWith('/tag/') && route.path.endsWith('/')) {
    const pathParts = route.path.split('/').filter(part => part)
    if (pathParts.length >= 2) {
      const tagId = pathParts[1]
      // 从标签数据中获取标签名称，使用同步导入
      try {
        const { getTagInfo } = require('~/data/tags')
        const tagInfo = getTagInfo(tagId)
        if (tagInfo.name) {
          return `${tagInfo.name}标签`
        }
      } catch (error) {
        console.warn('Failed to load tag info:', error)
      }
      // 如果获取失败，使用标签ID并格式化
      return tagId.charAt(0).toUpperCase() + tagId.slice(1) + '标签'
    }
  }

  return ''
})

// 是否显示面包屑导航
const showBreadcrumbs = computed(() => {
  // 首页不显示面包屑
  if (route && route.path === '/') return false

  // 检查是否是分类页面
  const categoryPages = ['/ai/', '/crypto/', '/dev/', '/encode/', '/format/', '/image/', '/network/', '/text/', '/time/', '/all/', '/sitemap/', '/tags/']

  // 如果是分类页面、标签页面、标签详情页或有分类名称或工具名称或页面标题，则显示面包屑
  return categoryPages.includes(route.path) || route.path.startsWith('/tag/') || currentCategoryName.value !== '' || currentToolName.value !== '' || pageTitle.value !== ''
})

// 监听路由变化来更新当前分类
watch(
  () => route.path,
  (newPath) => {
    // 从路由路径中提取分类
    const pathParts = newPath.split('/').filter(part => part)
    if (pathParts.length > 0) {
      currentCategory.value = pathParts[0]
    } else {
      currentCategory.value = 'all'
    }
  },
  { immediate: true }
)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const toggleTheme = () => {
  const isDark = document.documentElement.classList.toggle('dark')
  // 保存用户偏好到localStorage
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

const openSearch = () => {
  isSearchOpen.value = true
}

const handleCategoryChange = (category) => {
  currentCategory.value = category
  
  // 如果不是'all'分类，则跳转到对应分类页面
  if (category !== 'all') {
    router.push(`/${category}`)
  } else {
    router.push('/all/')
  }
  
  // 在移动端设备上，路由跳转后关闭侧边栏
  if (window.innerWidth < 1024) {
    isSidebarOpen.value = false
  }
}

// 切换小工具
const switchWidget = (direction) => {
  const totalWidgets = 3
  currentWidget.value = (currentWidget.value + direction + totalWidgets) % totalWidgets
}

// 复制当前小工具内容
const copyWidgetContent = async () => {
  let contentToCopy = ''

  switch (currentWidget.value) {
    case 0: // IP地址
      contentToCopy = userIP.value
      break
    case 1: // 时间戳
      contentToCopy = currentTime.value
      break
    case 2: // 文字tips
      contentToCopy = '为效率而生, Just Util.cn'
      break
  }

  // 优先使用现代 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(contentToCopy)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
      return
    } catch (err) {
      console.warn('Clipboard API 失败，尝试备用方案:', err)
    }
  }

  // 降级方案：使用传统的 document.execCommand
  try {
    const textArea = document.createElement('textarea')
    textArea.value = contentToCopy
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    } else {
      throw new Error('复制命令执行失败')
    }
  } catch (err) {
    console.error('复制失败:', err)
    // 作为最后的备用方案，显示内容让用户手动复制
    showFallbackCopy(contentToCopy)
  }
}

// 备用复制方案：显示内容供用户手动复制
const showFallbackCopy = (content) => {
  // 创建一个临时的模态框显示内容
  const modal = document.createElement('div')
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    max-width: 90%;
    text-align: center;
  `

  modal.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">请手动复制以下内容:</div>
    <div style="padding: 10px; background: #f5f5f5; border-radius: 4px; margin-bottom: 15px; word-break: break-all; font-family: monospace;">${content}</div>
    <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
  `

  document.body.appendChild(modal)

  // 3秒后自动关闭
  setTimeout(() => {
    if (modal.parentElement) {
      modal.remove()
    }
  }, 3000)
}

// 更新时间戳
const updateCurrentTime = () => {
  const now = new Date()
  const timestamp = now.getTime()
  const dateStr = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  // currentTime.value = `${dateStr} | ${timestamp}`
  currentTime.value = `${dateStr}`
}

// 获取用户IP地址
const fetchUserIP = async () => {
  try {
    // 使用多个IP服务作为备选
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://api.ip.sb/ip',
      'https://ifconfig.me/ip'
    ]

    // 先尝试从 localStorage 获取缓存的IP（缓存1小时）
    const cachedIP = localStorage.getItem('userIP')
    const cachedTime = localStorage.getItem('userIPTimestamp')
    if (cachedIP && cachedTime) {
      const timeDiff = Date.now() - parseInt(cachedTime)
      // 如果缓存时间小于1小时，直接使用缓存的IP
      if (timeDiff < 3600000) {
        userIP.value = cachedIP
        return
      }
    }

    // 尝试获取新的IP地址
    for (const service of ipServices) {
      try {
        const response = await fetch(service)
        if (response.ok) {
          let ip
          if (service.includes('ipify.org')) {
            const data = await response.json()
            ip = data.ip
          } else if (service.includes('ipapi.co')) {
            const data = await response.json()
            ip = data.ip
          } else {
            ip = await response.text()
          }

          if (ip && ip.trim()) {
            userIP.value = ip.trim()
            // 缓存IP地址
            localStorage.setItem('userIP', ip.trim())
            localStorage.setItem('userIPTimestamp', Date.now().toString())
            return
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch IP from ${service}:`, e)
        continue
      }
    }

    // 如果所有服务都失败，使用缓存的IP或显示错误
    const fallbackIP = localStorage.getItem('userIP')
    userIP.value = fallbackIP || '未知'
  } catch (error) {
    console.error('Failed to fetch user IP:', error)
    userIP.value = '未知'
  }
}

// 清理打字效果定时器
const clearTypewriterTimer = () => {
  if (typewriterTimer) {
    clearTimeout(typewriterTimer)
    typewriterTimer = null
  }
  isTypewriterActive.value = false
}

// 打字效果
const typewriterEffect = () => {
  // 先清理之前的定时器
  clearTypewriterTimer()
  isTypewriterActive.value = true

  const texts = typewriterTexts.value
  let index = 0
  let currentText = texts[currentTextIndex.value]

  const typeChar = () => {
    // 检查是否还在首页，如果已经离开则停止
    if (!isTypewriterActive.value) {
      return
    }

    if (index < currentText.length) {
      typedText.value = currentText.substring(0, index + 1)
      index++
      typewriterTimer = setTimeout(typeChar, 150) // 每个字符间隔150ms
    } else {
      // 打完当前文本后等待1秒，然后清除文本并开始下一个
      typewriterTimer = setTimeout(() => {
        // 再次检查是否还在首页
        if (!isTypewriterActive.value) {
          return
        }

        typedText.value = ''
        currentTextIndex.value = (currentTextIndex.value + 1) % texts.length
        currentText = texts[currentTextIndex.value]
        index = 0
        typewriterTimer = setTimeout(typeChar, 1500) // 短暂停顿后开始下一个文本
      }, 3000)
    }
  }

  typeChar()
}

// 在组件挂载时初始化
onMounted(() => {
  // 获取用户IP
  fetchUserIP()

  // 初始化并更新时间
  updateCurrentTime()
  const timeInterval = setInterval(updateCurrentTime, 1000)

  // 启动打字效果（仅在首页）
  if (route.path === '/') {
    typewriterEffect()
  }

  // 监听路由变化
  watch(() => route.path, (newPath, oldPath) => {
    // 路由切换时滚动到顶部
    if (newPath !== oldPath) {
      const scrollContainer = document.getElementById('scrollContainer')
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      } else {
        // 备用方案：window 滚动
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }
    }

    // 离开首页时清理打字效果
    if (oldPath === '/' && newPath !== '/') {
      clearTypewriterTimer()
    }
    // 进入首页时启动打字效果
    else if (newPath === '/' && oldPath !== '/') {
      typedText.value = ''
      currentTextIndex.value = 0 // 重置索引
      typewriterEffect()
    }
  })

  // 通知 Tauri 主窗口页面已加载完成
  if (window.__TAURI__) {
    try {
      // Tauri v2 API: 使用 getCurrentWindow 而不是 getCurrent
      const { getCurrentWindow } = window.__TAURI__.window
      const currentWindow = getCurrentWindow()
      currentWindow.emit('tauri://created')
      console.log('✅ Tauri 窗口事件发送成功')
    } catch (error) {
      console.warn('⚠️ Tauri 窗口事件发送失败:', error)
      // 不阻断页面正常加载
    }
  }

  // 在组件卸载时清理定时器
  onUnmounted(() => {
    clearInterval(timeInterval)
    clearTypewriterTimer() // 清理打字效果定时器
  })
})
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-in-out;
}

/* 淡入淡出过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>