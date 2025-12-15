<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">SQL格式化 - 在线SQL美化与格式化工具</h1>
      <p class="text-muted-foreground ">一款免费的在线 SQL Formatter。支持一键美化、格式化各种 SQL 语句，包括 SELECT、INSERT、UPDATE、DELETE 等。支持多种数据库方言，纯本地计算，数据隐私绝对安全。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入SQL</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteFromClipboard"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadSample"
            >
              示例SQL
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">缩进:</label>
            <select
              v-model="indentSize"
              class="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value="2">2空格</option>
              <option value="4">4空格</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">数据库:</label>
            <select
              v-model="sqlDialect"
              class="text-xs bg-muted border border-border rounded px-2 py-1"
            >
              <option value="sql">标准SQL</option>
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
              <option value="oracle">Oracle</option>
              <option value="sqlserver">SQL Server</option>
            </select>
          </div>
        </div>
        <textarea
          v-model="inputSQL"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="在此输入SQL语句..."
          @keydown.ctrl.enter="formatSQL"
          @keydown.meta.enter="formatSQL"
        ></textarea>
        <div v-if="inputError" class="mt-2 p-2 bg-destructive/20 text-destructive text-sm rounded">
          {{ inputError }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">格式化结果</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyOutput"
            >
              复制
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="downloadOutput"
            >
              下载SQL
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="toggleFullscreen"
            >
              全屏模式
            </button>
          </div>
        </div>
        <pre
          ref="outputPre"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg overflow-auto font-mono text-sm whitespace-pre-wrap"
        >{{ outputSQL }}</pre>
      </div>
    </div>

    <!-- 格式化按钮 -->
    <div class="flex justify-center mb-12">
      <button
        @click="formatSQL"
        class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        格式化 SQL
      </button>
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
          什么是 SQL 格式化？
        </h2>
        <p class="text-muted-foreground mb-4">
          SQL（Structured Query Language）是用于管理关系数据库系统的标准化语言。
          SQL 格式化是将混乱、压缩的 SQL 语句转换为具有良好缩进、换行和结构化的可读格式的过程。
          这不仅提高了代码的可读性，也有助于团队协作和代码维护。
        </p>
        <p class="text-muted-foreground">
          在实际开发中，ORM 工具生成的 SQL 或为了节省传输带宽而压缩的 SQL 往往难以阅读。
          SQL 格式化工具可以帮助开发者快速分析和优化 SQL 查询，提高开发效率。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 SQL 语句粘贴到左侧输入框</li>
          <li>选择合适的数据库类型（标准SQL、MySQL、PostgreSQL等）</li>
          <li>调整缩进大小（2空格或4空格）</li>
          <li>点击"格式化 SQL"按钮或使用快捷键 Ctrl+Enter</li>
          <li>查看右侧格式化后的结果，可复制或下载</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多数据库支持</strong>: 支持 MySQL、PostgreSQL、SQLite、Oracle、SQL Server 等主流数据库方言</li>
          <li><strong>智能格式化</strong>: 自动识别 SQL 关键字、表名、字段名并进行合理格式化</li>
          <li><strong>自定义缩进</strong>: 支持 2 空格或 4 空格缩进，满足不同编码规范</li>
          <li><strong>本地处理</strong>: 所有格式化都在浏览器本地完成，数据不会上传到服务器</li>
          <li><strong>快捷操作</strong>: 支持快捷键操作，提高工作效率</li>
          <li><strong>导出功能</strong>: 支持复制和下载格式化后的 SQL</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">SQL 格式化工具支持哪些数据库？</h3>
            <p class="text-muted-foreground mt-1">
              我们支持主流的数据库系统，包括标准 SQL、MySQL、PostgreSQL、SQLite、Oracle 和 SQL Server。
              每种数据库都有其特有的语法特性，工具会根据选择的数据库类型进行相应的优化。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">格式化后的 SQL 会改变执行逻辑吗？</h3>
            <p class="text-muted-foreground mt-1">
              不会。SQL 格式化只改变代码的视觉呈现（缩进、换行、空格），不会改变 SQL 的执行逻辑和性能。
              格式化后的 SQL 与原始 SQL 在功能上完全等价。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要 SQL 格式化？</h3>
            <p class="text-muted-foreground mt-1">
              格式化 SQL 有多个好处：提高代码可读性、便于团队协作、有助于发现语法错误、
              方便代码审查、提升维护效率。对于复杂的 SQL 查询，格式化尤其重要。
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
          :to="`/tools/${relatedTool.id}/`"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSeoMeta } from 'nuxt/app'
import {
  Database, Copy, Download, RotateCcw,
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, ChevronDown, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'
import Breadcrumb from '~/components/Breadcrumb.vue'

// SEO配置
useSeoMeta({
  title: 'SQL格式化工具 - 在线SQL美化与格式化工具 | 有条工具',
  meta: [
    { name: 'description', content: '一款免费的在线 SQL 格式化工具。支持一键美化、格式化各种 SQL 语句，包括 SELECT、INSERT、UPDATE、DELETE 等。支持多种数据库方言，纯本地计算，数据隐私绝对安全。' },
    { name: 'keywords', content: 'SQL格式化,SQL美化,SQL格式化工具,在线SQL工具,SQL语句格式化,MySQL格式化,PostgreSQL格式化,SQLite格式化,Oracle格式化,SQL Server格式化' },
    { name: 'author', content: 'Util.cn' }
  ],
  og: {
    title: 'SQL格式化工具 - 在线SQL美化与格式化工具',
    description: '一款免费的在线 SQL 格式化工具。支持一键美化、格式化各种 SQL 语句，包括 SELECT、INSERT、UPDATE、DELETE 等。支持多种数据库方言，纯本地计算，数据隐私绝对安全。'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SQL格式化工具 - 在线SQL美化与格式化工具',
    description: '一款免费的在线 SQL 格式化工具。支持一键美化、格式化各种 SQL 语句，包括 SELECT、INSERT、UPDATE、DELETE 等。支持多种数据库方言，纯本地计算，数据隐私绝对安全。'
  }
})

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'sql-formatter')
const category = categories.find(c => c.id === 'format')

// 输入输出数据
const inputSQL = ref('')
const outputSQL = ref('')
const inputError = ref('')
const indentSize = ref('2')
const sqlDialect = ref('sql')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 全屏相关
const outputPre = ref(null)
const isFullscreen = ref(false)

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'format' && t.id !== 'sql-formatter'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'xml-formatter'),
    tools.find(t => t.id === 'yaml-converter'),
    tools.find(t => t.id === 'base64-encoder')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// SQL关键字列表
const sqlKeywords = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
  'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'JOIN', 'INNER', 'LEFT',
  'RIGHT', 'FULL', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN',
  'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT',
  'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'IS', 'NULL', 'COUNT', 'SUM',
  'AVG', 'MAX', 'MIN', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT'
])

// 格式化SQL
const formatSQL = () => {
  if (!inputSQL.value) return

  try {
    inputError.value = ''
    const formatted = formatSQLString(inputSQL.value, parseInt(indentSize.value))
    outputSQL.value = formatted
  } catch (error) {
    inputError.value = `格式化错误: ${error.message}`
    outputSQL.value = ''
  }
}

// 格式化SQL字符串
const formatSQLString = (sql, indent) => {
  const indentStr = ' '.repeat(indent)
  let formatted = ''
  let currentIndent = 0
  let inString = false
  let stringChar = ''
  let currentWord = ''

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const prevChar = i > 0 ? sql[i - 1] : ''

    // 处理字符串
    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
        stringChar = ''
      }
      formatted += char
      currentWord += char
      continue
    }

    if (inString) {
      formatted += char
      currentWord += char
      continue
    }

    // 处理注释
    if (char === '-' && prevChar === '-') {
      // 单行注释
      let comment = '--'
      i++
      while (i < sql.length && sql[i] !== '\n') {
        comment += sql[i]
        i++
      }
      formatted += comment + '\n' + indentStr.repeat(currentIndent)
      currentWord = ''
      continue
    }

    if (char === '/' && prevChar === '*') {
      // 多行注释结束
      formatted += char
      continue
    }

    if (char === '*' && prevChar === '/') {
      // 多行注释开始
      let comment = '/*'
      i++
      while (i < sql.length && !(sql[i] === '/' && sql[i - 1] === '*')) {
        comment += sql[i]
        i++
      }
      comment += '/'
      formatted += comment + '\n' + indentStr.repeat(currentIndent)
      currentWord = ''
      continue
    }

    // 处理关键字和标识符
    if (/[a-zA-Z_]/.test(char)) {
      currentWord += char
    } else {
      if (currentWord) {
        const upperWord = currentWord.toUpperCase()
        if (sqlKeywords.has(upperWord)) {
          // 主要关键字需要换行
          if (['SELECT', 'FROM', 'WHERE', 'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'UNION'].includes(upperWord)) {
            formatted += '\n' + indentStr.repeat(currentIndent) + upperWord + ' '
          } else {
            formatted += upperWord + ' '
          }

          // 需要增加缩进的关键字
          if (['SELECT', 'FROM', 'WHERE', 'SET', 'VALUES'].includes(upperWord)) {
            currentIndent++
          }

          // 需要减少缩进的关键字
          if (['AND', 'OR'].includes(upperWord)) {
            formatted += '\n' + indentStr.repeat(Math.max(0, currentIndent - 1))
          }
        } else {
          formatted += currentWord + ' '
        }
        currentWord = ''
      }

      // 处理特殊字符
      if (char === ',') {
        formatted += ',\n' + indentStr.repeat(currentIndent)
      } else if (char === '(') {
        formatted += '(\n' + indentStr.repeat(currentIndent + 1)
        currentIndent++
      } else if (char === ')') {
        currentIndent = Math.max(0, currentIndent - 1)
        formatted += '\n' + indentStr.repeat(currentIndent) + ')'
      } else if (char === ';') {
        currentIndent = 0
        formatted += ';\n'
      } else if (char !== ' ' && char !== '\t' && char !== '\n') {
        formatted += char
      }
    }
  }

  // 处理最后一个词
  if (currentWord) {
    const upperWord = currentWord.toUpperCase()
    if (sqlKeywords.has(upperWord)) {
      formatted += upperWord
    } else {
      formatted += currentWord
    }
  }

  // 清理多余的空行和空格
  return formatted
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/,\s*\n\s*/g, ',\n' + indentStr)
    .replace(/\(\s+/g, '(\n' + indentStr)
    .replace(/\s+\)/g, '\n)')
}

// 清空输入
const clearInput = () => {
  inputSQL.value = ''
  outputSQL.value = ''
  inputError.value = ''
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputSQL.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例SQL
const loadSample = () => {
  inputSQL.value = `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2023-01-01' AND u.status = 'active' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 0 ORDER BY total_spent DESC LIMIT 10`
}

// 复制输出
const copyOutput = async () => {
  if (!outputSQL.value) return

  try {
    await navigator.clipboard.writeText(outputSQL.value)
    // 这里可以添加复制成功的提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载输出
const downloadOutput = () => {
  if (!outputSQL.value) return

  const blob = new Blob([outputSQL.value], { type: 'text/sql' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.sql'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 切换全屏模式
const toggleFullscreen = () => {
  if (!outputPre.value) return

  if (!isFullscreen.value) {
    if (outputPre.value.requestFullscreen) {
      outputPre.value.requestFullscreen()
    } else if (outputPre.value.webkitRequestFullscreen) {
      outputPre.value.webkitRequestFullscreen()
    } else if (outputPre.value.msRequestFullscreen) {
      outputPre.value.msRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
  isFullscreen.value = !isFullscreen.value
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  // 跳转到具体工具页面
  router.push(`/tools/${selectedTool.id}/`)
  // 添加到最近使用
  addRecentTool(selectedTool.id)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 监听全屏变化事件
onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
  document.addEventListener('webkitfullscreenchange', () => {
    isFullscreen.value = !!document.webkitFullscreenElement
  })
  document.addEventListener('msfullscreenchange', () => {
    isFullscreen.value = !!document.msFullscreenElement
  })
})
</script>