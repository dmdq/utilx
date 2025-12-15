<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">正则表达式测试 - 在线Regex匹配、验证与调试工具</h1>
      <p class="text-muted-foreground">一款免费的在线正则表达式测试工具。支持实时匹配、语法高亮、常用预设、测试用例和详细解释。纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧输入面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 正则表达式输入 -->
        <div class="bg-card rounded-lg border border-border p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
              <Search class="w-5 h-5 text-primary" />
              正则表达式
            </h2>
            <button
              @click="clearRegex"
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              清空
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-muted-foreground font-mono text-sm">/</span>
                <input
                  v-model="regexPattern"
                  type="text"
                  placeholder="输入正则表达式"
                  class="w-full pl-8 pr-8 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  @input="testRegex"
                />
                <span class="absolute right-3 top-2.5 text-muted-foreground font-mono text-sm">/</span>
              </div>
            </div>

            <!-- 标志位 -->
            <div>
              <label class="text-sm font-medium text-foreground mb-2 block">标志位 (Flags)</label>
              <div class="space-y-2">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="flags.g"
                    type="checkbox"
                    class="mr-2 rounded border-border text-primary focus:ring-primary"
                    @change="testRegex"
                  />
                  <span class="text-sm text-foreground">
                    <code class="bg-muted px-2 py-0.5 rounded text-xs">g</code>
                    全局匹配
                  </span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="flags.i"
                    type="checkbox"
                    class="mr-2 rounded border-border text-primary focus:ring-primary"
                    @change="testRegex"
                  />
                  <span class="text-sm text-foreground">
                    <code class="bg-muted px-2 py-0.5 rounded text-xs">i</code>
                    忽略大小写
                  </span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="flags.m"
                    type="checkbox"
                    class="mr-2 rounded border-border text-primary focus:ring-primary"
                    @change="testRegex"
                  />
                  <span class="text-sm text-foreground">
                    <code class="bg-muted px-2 py-0.5 rounded text-xs">m</code>
                    多行匹配
                  </span>
                </label>
              </div>
            </div>

            <!-- 预设模式 -->
            <div>
              <label class="text-sm font-medium text-foreground mb-2 block">常用预设</label>
              <div class="space-y-2">
                <button
                  v-for="preset in regexPresets"
                  :key="preset.name"
                  @click="applyPreset(preset)"
                  class="w-full text-left px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm"
                >
                  <div class="font-medium text-foreground">{{ preset.name }}</div>
                  <div class="text-xs text-muted-foreground font-mono">{{ preset.pattern }}</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 测试文本输入 -->
        <div class="bg-card rounded-lg border border-border p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText class="w-5 h-5 text-primary" />
              测试文本
            </h2>
            <div class="flex gap-2">
              <button
                @click="loadSampleText"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                示例文本
              </button>
              <button
                @click="clearTestText"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="testText"
            placeholder="输入要测试的文本..."
            class="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
            rows="8"
            @input="testRegex"
          ></textarea>
        </div>
      </div>

      <!-- 右侧结果面板 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 匹配结果 -->
        <div class="bg-card rounded-lg border border-border p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-foreground flex items-center gap-3">
              <CheckCircle class="w-6 h-6" :class="matchResults.length > 0 ? 'text-success' : 'text-muted-foreground'" />
              匹配结果
            </h3>
            <div class="flex items-center gap-4">
              <span class="text-sm text-muted-foreground">
                找到 <span class="font-semibold text-primary">{{ matchResults.length }}</span> 个匹配
              </span>
              <button
                v-if="matchResults.length > 0"
                @click="copyMatches"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                复制匹配项
              </button>
            </div>
          </div>

          <!-- 高亮显示的文本 -->
          <div v-if="testText" class="mb-6">
            <h4 class="text-sm font-medium text-foreground mb-3">文本高亮</h4>
            <div class="bg-muted/50 p-4 rounded-lg min-h-[100px]">
              <div v-if="regexPattern && !error" v-html="highlightedText" class="whitespace-pre-wrap font-mono text-sm"></div>
              <div v-else class="text-muted-foreground font-mono text-sm">{{ testText || '请输入测试文本' }}</div>
            </div>
          </div>

          <!-- 匹配列表 -->
          <div v-if="matchResults.length > 0">
            <h4 class="text-sm font-medium text-foreground mb-4">匹配详情</h4>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="(match, index) in matchResults"
                :key="index"
                class="flex items-start justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div class="flex-1 min-w-0">
                  <div class="font-mono text-sm">
                    <span class="text-muted-foreground">[{{ match.index }}-{{ match.index + match[0].length }}]</span>
                    <span class="ml-2 px-2 py-1 bg-primary/10 text-primary rounded text-xs">{{ match[0] }}</span>
                  </div>
                  <div v-if="match.length > 1" class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="(group, groupIndex) in match.slice(1)"
                      :key="groupIndex"
                      class="text-xs text-muted-foreground"
                    >
                      组{{ groupIndex + 1 }}: <code class="bg-background px-2 py-1 rounded border border-border">{{ group }}</code>
                    </span>
                  </div>
                </div>
                <button
                  @click="copyMatch(match[0])"
                  class="ml-3 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="error" class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p class="text-destructive text-sm">{{ error }}</p>
          </div>

          <!-- 无匹配提示 -->
          <div v-if="regexPattern && !error && matchResults.length === 0 && testText" class="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p class="text-warning-foreground text-sm">没有找到匹配项</p>
          </div>
        </div>

        <!-- 测试用例 -->
        <div class="bg-card rounded-lg border border-border p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
            <Beaker class="w-5 h-5 text-primary" />
            测试用例
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              v-for="testCase in testCases"
              :key="testCase.name"
              @click="runTestCase(testCase)"
              class="p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
            >
              <div class="font-medium text-sm text-foreground mb-1">{{ testCase.name }}</div>
              <div class="text-xs text-muted-foreground mb-3">{{ testCase.description }}</div>
              <div class="text-xs font-mono bg-background px-3 py-2 rounded border border-border">
                {{ testCase.pattern }}
              </div>
            </button>
          </div>
        </div>

        <!-- 解释说明 -->
        <div v-if="regexPattern && !error" class="bg-card rounded-lg border border-border p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
            <Info class="w-5 h-5 text-primary" />
            正则解释
          </h3>

          <div class="prose prose-sm max-w-none dark:prose-invert">
            <div v-html="regexExplanation" class="text-sm text-muted-foreground"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card rounded-lg border border-border">
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
          什么是正则表达式？
        </h2>
        <p class="text-muted-foreground mb-4">
          正则表达式（Regular Expression，简称 regex 或 regexp）是一种描述文本模式的强大工具。
          它使用特殊的字符序列来定义搜索模式，可以用于字符串的匹配、查找、替换和验证等操作。
          正则表达式广泛应用于各种编程语言和文本编辑器中，是处理文本数据的必备技能。
        </p>
        <p class="text-muted-foreground">
          正则表达式的核心思想是使用模式匹配来描述文本特征。通过组合普通字符（如字母、数字）
          和特殊字符（称为元字符），可以创建出灵活且精确的匹配规则。
          这种模式匹配的方式使得正则表达式在数据验证、文本提取、格式化等场景中非常实用。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入正则表达式模式</li>
          <li>选择合适的标志位（全局匹配、忽略大小写、多行匹配等）</li>
          <li>在测试文本框中输入要测试的文本内容</li>
          <li>实时查看匹配结果和高亮显示</li>
          <li>可以使用常用预设快速开始，或运行测试用例学习</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>实时匹配</strong>: 输入时立即显示匹配结果，无需手动触发</li>
          <li><strong>高亮显示</strong>: 匹配的文本会高亮标记，清晰可见</li>
          <li><strong>语法解释</strong>: 自动解释正则表达式各部分的含义</li>
          <li><strong>常用预设</strong>: 内置邮箱、手机号、URL等常用模式</li>
          <li><strong>测试用例</strong>: 提供实际应用场景的测试用例</li>
          <li><strong>本地安全</strong>: 所有处理都在浏览器本地完成，保护数据隐私</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">正则表达式测试工具安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              完全安全。我们的正则表达式测试工具采用纯前端技术实现，所有处理都在您的浏览器本地完成，
              文本数据不会上传到任何服务器。您可以放心测试包含敏感信息的文本内容。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是正则表达式的标志位？</h3>
            <p class="text-muted-foreground mt-1">
              标志位（flags）是正则表达式的修饰符，用于改变匹配行为：
              <br><code>g</code> - 全局匹配：查找所有匹配项，而不是在第一个匹配后停止
              <br><code>i</code> - 忽略大小写：匹配时不区分大小写
              <br><code>m</code> - 多行匹配：将 ^ 和 $ 视为每行的开始和结束，而不仅是整个字符串
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何学习正则表达式？</h3>
            <p class="text-muted-foreground mt-1">
              学习正则表达式建议从基础开始：先了解字符类（如 \d、\w、\s）和量词（如 *、+、?），
              然后学习分组和捕获、字符集等概念。通过实际练习和查看常见模式的实现，
              逐步掌握复杂表达式的构建。本工具的预设和测试用例是很好的学习资源。
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
              :is="iconMap[relatedTool.icon]"
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
import { ref, computed, watch } from 'vue'
import { useSeoMeta } from '#app'
import {
  Search, FileText, CheckCircle, Copy, Beaker, Info, HelpCircle, ChevronUp,
  FileJson, Database, Link, Hash, Timer, FileDiff,
  Globe, FolderOpen, GitBranch, Type, Wifi, Image, Code, Lock
} from 'lucide-vue-next'
// import { tools } from '~/data/tools'
// import { categories } from '~/data/categories'
// import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO Meta
useSeoMeta({
  title: '正则表达式测试工具 - 在线Regex匹配验证调试 | 有条工具',
  description: '免费的正则表达式在线测试工具，支持实时匹配、语法高亮、常用正则表达式库、测试用例和详细解释。纯本地计算，数据安全，无需注册，助您快速调试和验证正则表达式。',
  keywords: '正则表达式,regex,正则测试,在线调试,匹配验证,语法高亮,正则库,前端工具,免费工具',
  author: 'Util.cn',
  ogTitle: '正则表达式测试工具 - 免费在线Regex调试工具',
  ogDescription: '专业的正则表达式在线测试工具，支持实时匹配、语法高亮、常用预设和详细解释。纯本地计算，数据绝对安全。',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '正则表达式测试工具 - 免费在线Regex调试',
  twitterDescription: '免费的正则表达式在线测试工具，支持实时匹配、语法高亮、常用正则库。本地计算，数据安全。'
})

// 定义当前工具和分类
// const tool = tools.find(t => t.id === 'regex-tester')
// const category = categories.find(c => c.id === 'text')

// 添加到最近使用
// onMounted(() => {
//   if (tool) {
//     addRecentTool(tool.id)
//   }
// })

// 响应式数据
const regexPattern = ref('')
const testText = ref('')
const flags = ref({
  g: true,
  i: false,
  m: false
})
const matchResults = ref([])
const error = ref('')
const isSeoContentVisible = ref(false)

// 预设正则
const regexPresets = [
  {
    name: '邮箱地址',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
  },
  {
    name: '手机号码',
    pattern: '1[3-9]\\d{9}'
  },
  {
    name: 'URL',
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)'
  },
  {
    name: 'IP地址',
    pattern: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b'
  },
  {
    name: '中文',
    pattern: '[\\u4e00-\\u9fa5]+'
  },
  {
    name: '日期',
    pattern: '\\d{4}-\\d{2}-\\d{2}'
  }
]

// 测试用例
const testCases = [
  {
    name: '验证邮箱',
    description: '测试邮箱格式是否正确',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    text: 'test@example.com\ninvalid-email\nuser.name+tag@domain.co.uk'
  },
  {
    name: '提取URL',
    description: '从文本中提取所有URL',
    pattern: 'https?:\\/\\/[\\S]+',
    text: '访问 https://www.example.com 或 http://test.org 获取更多信息'
  },
  {
    name: '匹配HTML标签',
    description: '匹配HTML标签内容',
    pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)<\\/\\1>',
    text: '<div>内容</div>\n<p>段落</p>\n<span class="red">文本</span>'
  }
]

// 相关工具 - 静态列表
const relatedTools = ref([
  { id: 'text-replace', name: '文本替换', description: '批量查找替换文本', icon: 'FileText' },
  { id: 'json-formatter', name: 'JSON 格式化', description: '美化 JSON 数据', icon: 'FileJson' },
  { id: 'url-encode', name: 'URL 编码', description: 'URL编码解码', icon: 'Link' },
  { id: 'text-counter', name: '字符统计', description: '统计文本字符信息', icon: 'Hash' },
  { id: 'markdown-editor', name: 'Markdown 编辑', description: '实时预览编辑', icon: 'FileText' },
  { id: 'html-formatter', name: 'HTML 格式化', description: '美化HTML代码', icon: 'Code' },
  { id: 'base64-encode', name: 'Base64 编码', description: 'Base64编码解码', icon: 'Lock' },
  { id: 'text-diff', name: '文本对比', description: '比较文本差异', icon: 'GitBranch' }
])

// 图标映射
const iconMap = {
  FileText, FileJson, Database, Link, Hash, Timer, Search, FileDiff,
  Globe, FolderOpen, GitBranch, Type, Wifi, Image, Code, Lock, Beaker
}

// 计算属性
const flagsString = computed(() => {
  return Object.entries(flags.value)
    .filter(([_, value]) => value)
    .map(([key, _]) => key)
    .join('')
})

const highlightedText = computed(() => {
  if (!regexPattern.value || !testText.value || error.value) {
    return testText.value
  }

  try {
    const regex = new RegExp(regexPattern.value, flagsString.value)
    return testText.value.replace(regex, (match) => {
      return `<mark class="bg-warning/30 px-1 rounded text-warning-foreground font-medium">${match}</mark>`
    })
  } catch {
    return testText.value
  }
})

const regexExplanation = computed(() => {
  if (!regexPattern.value) return ''

  // 简单的正则解释逻辑
  let explanation = `<p class="font-medium">正则表达式: <code class="bg-muted px-3 py-1 rounded text-sm">${regexPattern.value}</code></p>`

  // 基本解释
  if (regexPattern.value.includes('^')) {
    explanation += '<p>• <code>^</code> - 匹配字符串开始位置</p>'
  }
  if (regexPattern.value.includes('$')) {
    explanation += '<p>• <code>$</code> - 匹配字符串结束位置</p>'
  }
  if (regexPattern.value.includes('\\d')) {
    explanation += '<p>• <code>\\d</code> - 匹配任意数字 (0-9)</p>'
  }
  if (regexPattern.value.includes('\\w')) {
    explanation += '<p>• <code>\\w</code> - 匹配任意字母、数字或下划线</p>'
  }
  if (regexPattern.value.includes('\\s')) {
    explanation += '<p>• <code>\\s</code> - 匹配任意空白字符</p>'
  }
  if (regexPattern.value.includes('[') && regexPattern.value.includes(']')) {
    explanation += '<p>• <code>[...]</code> - 字符集，匹配其中的任意字符</p>'
  }
  if (regexPattern.value.includes('{')) {
    explanation += '<p>• <code>{n}</code> - 量词，指定匹配次数</p>'
  }

  if (explanation === `<p class="font-medium">正则表达式: <code class="bg-muted px-3 py-1 rounded text-sm">${regexPattern.value}</code></p>`) {
    explanation += '<p>请参考上方快速参考了解各符号含义。</p>'
  }

  return explanation
})

// 监听变化
watch([regexPattern, testText, flags], () => {
  testRegex()
})

// 方法
const testRegex = () => {
  if (!regexPattern.value || !testText.value) {
    matchResults.value = []
    error.value = ''
    return
  }

  try {
    const regex = new RegExp(regexPattern.value, flagsString.value)
    const matches = []
    let match

    while ((match = regex.exec(testText.value)) !== null) {
      matches.push({
        ...match,
        index: match.index
      })

      // 避免无限循环
      if (!flags.value.g) break
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }

    matchResults.value = matches
    error.value = ''
  } catch (e) {
    error.value = e.message
    matchResults.value = []
  }
}

const applyPreset = (preset) => {
  regexPattern.value = preset.pattern
  testRegex()
}

const loadSampleText = () => {
  testText.value = `联系我们：support@example.com 或 sales@company.org
访问我们的网站：https://www.example.com
电话：13800138000 或 15912345678
地址：北京市朝阳区建国路88号
日期：2024-12-10
IP地址：192.168.1.1`
  testRegex()
}

const clearRegex = () => {
  regexPattern.value = ''
  error.value = ''
  matchResults.value = []
}

const clearTestText = () => {
  testText.value = ''
  matchResults.value = []
}

const runTestCase = (testCase) => {
  regexPattern.value = testCase.pattern
  testText.value = testCase.text
  testRegex()
}

const copyMatch = async (match) => {
  try {
    await navigator.clipboard.writeText(match)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const copyMatches = async () => {
  const matches = matchResults.value.map(m => m[0]).join('\n')
  try {
    await navigator.clipboard.writeText(matches)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>

<style scoped>
mark {
  animation: highlight 0.5s ease-in-out;
}

@keyframes highlight {
  from {
    background-color: hsl(var(--warning));
  }
  to {
    background-color: hsl(var(--warning) / 0.3);
  }
}
</style>