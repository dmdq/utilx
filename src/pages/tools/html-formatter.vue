<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">HTML格式化工具 - 在线HTML美化压缩工具</h1>
      <p class="text-muted-foreground">专业的在线HTML格式化工具，支持HTML代码美化、压缩、格式化和语法验证。智能缩进调整，实时预览效果，一键复制结果。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      <!-- 左侧输入区域 -->
      <div class="space-y-6">
        <!-- HTML输入框 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Code2 class="h-5 w-5 mr-2 text-primary" />
              HTML 代码输入
            </h2>
            <span class="text-sm text-muted-foreground">
              {{ formatBytes(htmlInput.length) }}
            </span>
          </div>
          <div class="space-y-4">
            <textarea
              v-model="htmlInput"
              placeholder="请粘贴您的HTML代码..."
              class="w-full h-80 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm text-foreground placeholder:text-muted-foreground resize-none"
              @input="formatHTML"
            ></textarea>
          </div>
        </div>

        <!-- 格式化选项 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            格式化选项
          </h3>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">缩进类型</label>
                <select
                  v-model="indentType"
                  @change="formatHTML"
                  class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="spaces">空格</option>
                  <option value="tabs">制表符</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">缩进大小</label>
                <input
                  type="number"
                  v-model="indentSize"
                  min="1"
                  max="8"
                  @input="formatHTML"
                  class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
              </div>
            </div>

            <div class="space-y-3">
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="removeComments"
                  @change="formatHTML"
                  class="mr-3 h-4 w-4 text-primary rounded border-border bg-background focus:ring-primary"
                >
                <span class="text-sm text-foreground">移除 HTML 注释</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="removeEmptyAttributes"
                  @change="formatHTML"
                  class="mr-3 h-4 w-4 text-primary rounded border-border bg-background focus:ring-primary"
                >
                <span class="text-sm text-foreground">移除空属性</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Zap class="h-5 w-5 mr-2 text-primary" />
            快速操作
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="loadExample"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <FileUp class="inline-block w-4 h-4 mr-2" />
              加载示例
            </button>
            <button
              @click="minifyHTML"
              class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors text-sm font-medium"
            >
              <Minimize2 class="inline-block w-4 h-4 mr-2" />
              压缩代码
            </button>
            <button
              @click="clearAll"
              class="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm font-medium"
            >
              <Trash2 class="inline-block w-4 h-4 mr-2" />
              清空全部
            </button>
            <button
              @click="validateHTML"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <CheckCircle class="inline-block w-4 h-4 mr-2" />
              验证格式
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧输出区域 -->
      <div class="space-y-6">
        <!-- 格式化结果 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <FileCheck class="h-5 w-5 mr-2 text-primary" />
              格式化结果
            </h2>
            <div class="flex items-center gap-2">
              <span class="text-sm px-2 py-1 bg-primary/10 text-primary rounded-full">
                {{ formatMode === 'format' ? '美化' : '压缩' }}模式
              </span>
              <button
                @click="copyResult"
                class="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Copy class="inline-block w-4 h-4 mr-1" />
                复制
              </button>
            </div>
          </div>
          <textarea
            v-model="formattedOutput"
            readonly
            class="w-full h-80 px-4 py-3 bg-muted border border-border rounded-lg font-mono text-sm text-foreground resize-none"
          ></textarea>

          <!-- 统计信息 -->
          <div class="mt-4 grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-primary">{{ formatBytes(htmlInput.length) }}</div>
              <div class="text-sm text-muted-foreground">原始大小</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-secondary">{{ formatBytes(formattedOutput.length) }}</div>
              <div class="text-sm text-muted-foreground">处理后</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ compressionRate }}%</div>
              <div class="text-sm text-muted-foreground">压缩率</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ formattedOutput.split('\n').length }}</div>
              <div class="text-sm text-muted-foreground">总行数</div>
            </div>
          </div>
        </div>

        <!-- HTML 预览 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Eye class="h-5 w-5 mr-2 text-primary" />
            HTML 预览
          </h3>
          <div
            class="border border-border rounded-lg p-6 min-h-[200px] bg-background overflow-auto"
            v-html="formattedOutput"
          ></div>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="bg-destructive/10 border border-destructive rounded-lg p-4">
          <div class="flex items-start">
            <AlertCircle class="h-5 w-5 text-destructive mr-2 mt-0.5" />
            <p class="text-destructive text-sm">{{ errorMessage }}</p>
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
          什么是 HTML 格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          HTML 格式化是指对 HTML 代码进行美化和整理，使其具有良好的缩进、换行和结构层次，
          从而提高代码的可读性和可维护性。格式化后的 HTML 代码更容易理解和修改，
          也有助于团队协作开发。
        </p>
        <p class="text-muted-foreground mb-4">
          HTML 格式化工具不仅可以美化代码，还可以压缩 HTML 以减小文件大小，
          提升网页加载速度。同时，它还能帮助检测 HTML 语法错误，确保代码符合标准规范。
        </p>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>智能格式化</strong>: 自动识别HTML结构，智能调整缩进和换行，让代码层次清晰</li>
          <li><strong>代码压缩</strong>: 移除多余空格、注释和换行符，显著减小文件体积</li>
          <li><strong>语法验证</strong>: 检查HTML标签配对、嵌套结构等语法问题</li>
          <li><strong>自定义选项</strong>: 支持缩进类型、大小、注释处理等多种自定义配置</li>
          <li><strong>实时预览</strong>: 即时查看格式化后的HTML效果</li>
          <li><strong>一键复制</strong>: 快速复制格式化结果到剪贴板</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>前端开发</strong>: 格式化和压缩HTML模板代码，优化网站性能</li>
          <li><strong>代码审查</strong>: 统一团队代码风格，提高代码可读性</li>
          <li><strong>学习HTML</strong>: 格式化示例代码，更好地理解HTML结构</li>
          <li><strong>代码优化</strong>: 压缩HTML文件，减少网络传输时间</li>
          <li><strong>SEO优化</strong>: 清理代码结构，提升搜索引擎友好度</li>
          <li><strong>代码重构</strong>: 重组项目代码，提高维护性</li>
        </ul>
        
        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">HTML格式化会影响网页显示效果吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。HTML格式化只改变代码的排版和结构，不影响网页的实际显示效果。
              浏览器在解析HTML时会忽略多余的空格和换行符，所以格式化后的代码在浏览器中显示效果完全相同。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么要压缩HTML代码？</h3>
            <p class="text-muted-foreground mt-1">
              压缩HTML代码可以显著减小文件大小，从而加快网页加载速度，
              提升用户体验。对于访问量大的网站，压缩HTML还能节省带宽成本。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的缩进方式？</h3>
            <p class="text-muted-foreground mt-1">
              一般建议使用空格缩进，因为不同编辑器对制表符的显示宽度可能不同，
              容易造成代码对齐混乱。通常2个或4个空格是比较常见的选择，
              可以根据团队规范或个人喜好进行设置。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">格式化工具安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。我们的HTML格式化工具采用纯前端技术实现，
              所有处理都在您的浏览器本地完成，数据不会上传到任何服务器，
              确保您的代码隐私和安全。
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
              :is="iconMap[relatedTool.icon] || FileText" 
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
import { ref, computed } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import {
  FileText, Code2, FileCheck, Settings, Zap, Shield, Eye, Copy, Minimize2,
  Trash2, CheckCircle, AlertCircle, ArrowRight, Search, Palette, Link, Replace,
  HelpCircle, ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'HTML格式化工具 - 在线HTML美化压缩工具',
  meta: [
    { name: 'description', content: '专业的在线HTML格式化工具，支持HTML代码美化、压缩、格式化和语法验证。智能缩进调整，实时预览效果，一键复制结果。' },
    { name: 'keywords', content: 'HTML格式化,HTML美化,HTML压缩,代码格式化,HTML验证,在线HTML工具' },
    { name: 'robots', content: 'index,follow' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'html-formatter')
const category = categories.find(c => c.id === 'format')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 响应式数据
const htmlInput = ref('')
const formattedOutput = ref('')
const indentType = ref('spaces')
const indentSize = ref(2)
const removeComments = ref(false)
const removeEmptyAttributes = ref(false)
const errorMessage = ref('')
const formatMode = ref('format')

// 图标映射
const iconMap = {
  FileText, Code2, FileCheck, Settings, Zap, Shield, Eye, Copy, Minimize2,
  Trash2, CheckCircle, AlertCircle, ArrowRight, Search, Palette, Link, Replace,
  HelpCircle, ChevronUp
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t => 
    t.category === 'format' && t.id !== 'html-formatter'
  ).slice(0, 2)
  
  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'css-formatter'),
    tools.find(t => t.id === 'js-formatter'),
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'xml-formatter')
  ].filter(Boolean)
  
  return [...sameCategory, ...recommended].slice(0, 4)
})

// 计算属性
const compressionRate = computed(() => {
  if (!htmlInput.value.length) return 0
  const reduction = htmlInput.value.length - formattedOutput.value.length
  return Math.round((reduction / htmlInput.value.length) * 100)
})

// 方法
const formatHTML = () => {
  if (!htmlInput.value) {
    formattedOutput.value = ''
    errorMessage.value = ''
    return
  }

  try {
    let formatted = htmlInput.value.trim()
    errorMessage.value = ''
    formatMode.value = 'format'

    // 移除注释
    if (removeComments.value) {
      formatted = formatted.replace(/<!--[\s\S]*?-->/g, '')
    }

    // 移除空属性
    if (removeEmptyAttributes.value) {
      formatted = formatted.replace(/\s+[a-zA-Z-]+=""|""/g, '')
    }

    // 基本格式化
    formatted = formatted
      .replace(/></g, '>\n<')
      .replace(/^\s*\n/gm, '')
      .split('\n')
      .map(line => {
        // 简单的嵌套深度计算
        let depth = 0
        if (line.includes('<')) {
          if (line.includes('</')) {
            // 自闭合标签
            if (line.match(/<[^>]*\/>/)) {
              depth = 0
            } else {
              // 结束标签
              depth = -1
            }
          } else if (line.match(/<[^>]*[^\/]>/)) {
            // 开始标签
            depth = 1
          }
        }

        const currentIndent = line.trim().startsWith('</') ? 0 : depth
        const indentChar = indentType.value === 'spaces' ? ' ' : '\t'
        const indent = indentChar.repeat(Math.max(0, (line.trim().length ? currentIndent : 0) * indentSize.value))

        return indent + line.trim()
      })
      .join('\n')

    formattedOutput.value = formatted
  } catch (error) {
    errorMessage.value = 'HTML格式错误: ' + error.message
  }
}

const minifyHTML = () => {
  if (!htmlInput.value) return

  formatMode.value = 'minify'
  try {
    let minified = htmlInput.value

    // 移除注释
    minified = minified.replace(/<!--[\s\S]*?-->/g, '')

    // 移除多余空白
    minified = minified
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()

    formattedOutput.value = minified
  } catch (error) {
    errorMessage.value = '压缩失败: ' + error.message
  }
}

const loadExample = () => {
  htmlInput.value = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>示例页面</title>
    <meta name="description" content="这是一个示例HTML页面">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <nav class="navigation">
            <div class="logo">网站Logo</div>
            <ul class="nav-links">
                <li><a href="#home">首页</a></li>
                <li><a href="#about">关于</a></li>
                <li><a href="#contact">联系</a></li>
            </ul>
        </nav>
    </header>

    <main class="main-content">
        <section class="hero">
            <h1>欢迎来到我们的网站</h1>
            <p>这是HTML格式化工具的示例内容</p>
            <button class="cta-button">开始使用</button>
        </section>

        <section class="features">
            <h2>功能特性</h2>
            <div class="feature-grid">
                <div class="feature-card">
                    <h3>智能格式化</h3>
                    <p>自动调整代码缩进</p>
                </div>
                <div class="feature-card">
                    <h3>代码压缩</h3>
                    <p>优化文件大小</p>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <p>&copy; 2025 示例网站. 保留所有权利.</p>
    </footer>
</body>
</html>`
  formatHTML()
}

const clearAll = () => {
  htmlInput.value = ''
  formattedOutput.value = ''
  errorMessage.value = ''
}

const validateHTML = () => {
  if (!htmlInput.value) {
    errorMessage.value = '请输入HTML代码'
    return
  }

  // 简单的HTML验证
  const tags = htmlInput.value.match(/<[^>]+>/g) || []
  const openTags = []
  const selfClosingTags = ['br', 'hr', 'img', 'meta', 'link', 'input', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']

  for (const tag of tags) {
    const match = tag.match(/<\/?([a-zA-Z-]+)/)
    if (!match) continue

    const tagName = match[1].toLowerCase()
    if (tag.startsWith('</')) {
      const lastOpen = openTags.pop()
      if (lastOpen !== tagName) {
        errorMessage.value = `HTML标签不匹配: 期望 </${lastOpen}> 但找到 </${tagName}>`
        return
      }
    } else if (!tag.endsWith('/>') && !selfClosingTags.includes(tagName)) {
      openTags.push(tagName)
    }
  }

  if (openTags.length > 0) {
    errorMessage.value = `未闭合的标签: ${openTags.join(', ')}`
    return
  }

  errorMessage.value = ''
  alert('HTML格式验证通过！')
}

const copyResult = async (event) => {
  try {
    await navigator.clipboard.writeText(formattedOutput.value)
    // 简单的成功提示，避免alert打断用户
    const button = event.currentTarget
    const originalText = button.textContent
    button.textContent = '已复制！'
    button.classList.add('bg-success')
    setTimeout(() => {
      button.textContent = originalText
      button.classList.remove('bg-success')
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    alert('复制失败，请手动复制')
  }
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>