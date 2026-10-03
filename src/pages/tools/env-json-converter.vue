<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileCode class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">.env与JSON转换器</h1>
          <p class="text-sm text-muted-foreground mt-1">环境变量与 JSON 双向转换，格式校验，纯本地处理</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        .env 与 JSON 双向转换：解析 KEY=VALUE（支持 export 前缀、引号、行内注释、\n 转义），校验重复键与缺失等号；JSON 转 .env 支持键名大写转换。全部处理在浏览器本地完成，数据不会上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：输入 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <FileCode v-if="mode === 'env2json'" class="w-5 h-5 mr-2 text-primary" />
            <Braces v-else class="w-5 h-5 mr-2 text-primary" />
            输入
          </h2>

          <!-- 转换方向 -->
          <div class="grid grid-cols-2 gap-1.5 mb-4">
            <button
              v-for="d in directionOptions"
              :key="d.value"
              @click="mode = d.value"
              :class="mode === d.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-1.5 rounded text-xs font-medium transition-all"
            >
              {{ d.label }}
            </button>
          </div>

          <textarea
            v-if="mode === 'env2json'"
            v-model="envText"
            class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="DB_HOST=localhost&#10;DB_PORT=3306&#10;# 注释行&#10;export API_KEY=&quot;abc&quot;&#10;MESSAGE=&quot;第一行\n第二行&quot;"
            spellcheck="false"
          ></textarea>
          <textarea
            v-else
            v-model="jsonText"
            class="w-full h-64 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="{&#10;  &quot;dbHost&quot;: &quot;localhost&quot;,&#10;  &quot;retries&quot;: 3,&#10;  &quot;debug&quot;: true&#10;}"
            spellcheck="false"
          ></textarea>

          <!-- 键名转换开关（仅 JSON → .env） -->
          <label v-if="mode === 'json2env'" class="flex items-center justify-between cursor-pointer mt-4">
            <span class="text-sm text-foreground">键名转换为大写 UPPER_SNAKE_CASE</span>
            <button
              type="button"
              @click="upperSnake = !upperSnake"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="upperSnake ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="upperSnake ? 'translate-x-6' : 'translate-x-1'"
              ></span>
            </button>
          </label>

          <button
            @click="convert"
            class="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> {{ mode === 'env2json' ? '转换为 JSON' : '转换为 .env' }}
          </button>

          <!-- 错误提示 -->
          <div v-if="activeErrors.length" class="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p class="text-xs text-destructive font-medium mb-1.5 flex items-center gap-1.5">
              <AlertTriangle class="w-3.5 h-3.5" /> 转换错误
            </p>
            <ul class="text-xs text-muted-foreground space-y-1">
              <li v-for="(e, i) in activeErrors" :key="i" class="font-mono break-all">{{ e }}</li>
            </ul>
          </div>
        </div>

        <!-- .env 语法速查 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Info class="w-4 h-4 mr-2 text-primary" /> .env 语法速查
          </h3>
          <ul class="text-xs text-muted-foreground space-y-2">
            <li>• <span class="text-foreground">基本格式</span>：KEY=VALUE，每行一条，= 两侧多余空格会被忽略</li>
            <li>• <span class="text-foreground">注释</span>：整行以 # 开头；未加引号的值中「空格 + #」之后视为行内注释</li>
            <li>• <span class="text-foreground">export 前缀</span>：可省略，会被自动忽略</li>
            <li>• <span class="text-foreground">双引号</span>：内部 \n 解析为换行，\" 转义为 "，\\\\ 转义为 \</li>
            <li>• <span class="text-foreground">单引号</span>：内容完全按字面处理，不解析任何转义</li>
            <li>• <span class="text-foreground">多行值</span>：用 \n 转义表示换行，而不是真实换行</li>
            <li>• <span class="text-foreground">重复键</span>：采用最后一次出现的值，并在警告中提示</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 class="text-lg font-semibold text-foreground flex items-center">
              <Braces v-if="mode === 'env2json'" class="w-5 h-5 mr-2 text-primary" />
              <FileCode v-else class="w-5 h-5 mr-2 text-primary" />
              {{ mode === 'env2json' ? 'JSON 输出' : '.env 输出' }}
            </h2>
            <div class="flex items-center gap-2">
              <button
                @click="copyOutput"
                :disabled="!activeOutput"
                class="bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" /> 复制
              </button>
              <button
                @click="downloadOutput"
                :disabled="!activeOutput"
                class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
              >
                <Download class="w-3.5 h-3.5" /> 下载
              </button>
            </div>
          </div>
          <div class="p-6">
            <textarea
              v-if="activeOutput"
              :value="activeOutput"
              readonly
              class="w-full h-80 px-3 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground text-sm font-mono focus:outline-none resize-y"
              spellcheck="false"
            ></textarea>
            <div v-else class="py-16 text-center">
              <FileCode class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p class="text-sm text-muted-foreground">输入内容并点击转换按钮，这里会显示结果</p>
            </div>
          </div>
        </div>

        <!-- 解析警告 -->
        <div v-if="activeWarnings.length" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
            <AlertTriangle class="w-4 h-4 mr-2 text-primary" /> 解析警告
          </h3>
          <ul class="text-xs text-muted-foreground space-y-1.5">
            <li v-for="(w, i) in activeWarnings" :key="i" class="font-mono break-all">• {{ w }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于.env与JSON转换器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            .env 是 12-Factor 应用推广的环境变量文件格式，被 Node.js、Python、Docker Compose、CI/CD 等生态广泛使用；JSON 则是程序间交换数据的通用格式。本工具在两者之间双向转换，并做格式校验（重复键、缺失等号、嵌套结构），让配置在"人读的 .env"和"程序读的 JSON"之间无损搬运。
          </p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>把 docker compose / CI 中的环境变量整理成 JSON 供脚本读取</li>
            <li>把后端导出的配置 JSON 生成 .env 文件给本地开发使用</li>
            <li>统一键名风格：驼峰 JSON 与 UPPER_SNAKE_CASE 环境变量互转</li>
            <li>校验 .env 文件里的重复键与格式错误</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">支持哪些 .env 语法？</span>export 前缀、单双引号、行内注释、\n 转义等常见写法，详见页面上方速查。</li>
            <li><span class="text-foreground font-medium">嵌套 JSON 怎么办？</span>.env 只有扁平的 KEY=VALUE 结构，工具会提示"仅支持扁平对象"，请先把嵌套 JSON 拍平（如 a.b → A_B）。</li>
            <li><span class="text-foreground font-medium">数据会上传吗？</span>不会。所有解析与转换都在浏览器本地完成，数据不出设备。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'env-json-converter'" :category="'file'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileCode, Braces, RefreshCw, Copy, Download, Info, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '.env与JSON转换器 - 环境变量与JSON互转工具',
  description: '在线.env与JSON双向转换工具，支持export前缀、引号、行内注释、\\n转义解析，校验重复键与缺失等号，JSON转.env支持UPPER_SNAKE_CASE键名转换，纯本地处理',
  keywords: 'env转json, json转env, 环境变量转换, dotenv, env格式化, env编辑器',
  author: 'Util工具箱',
  ogTitle: '.env与JSON转换器 - 有条工具',
  ogDescription: '环境变量与 JSON 双向转换，格式校验，纯本地处理',
  ogUrl: 'https://www.util.cn/tools/env-json-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '.env与JSON转换器',
          url: 'https://www.util.cn/tools/env-json-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['.env转JSON', 'JSON转.env', '重复键与格式校验', 'UPPER_SNAKE_CASE转换', '引号与注释解析']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文件工具', item: 'https://www.util.cn/file/' },
            { '@type': 'ListItem', position: 3, name: '.env与JSON转换器', item: 'https://www.util.cn/tools/env-json-converter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '支持哪些.env语法？',
              acceptedAnswer: { '@type': 'Answer', text: '支持 export 前缀、单双引号、行内注释、\\n 转义等常见写法，重复键采用最后一次出现的值并给出警告。' }
            },
            {
              '@type': 'Question',
              name: '嵌套JSON可以直接转换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。.env 只有扁平的 KEY=VALUE 结构，工具会提示仅支持扁平对象，需要先把嵌套 JSON 拍平。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'env-json-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const mode = ref('env2json')
const envText = ref('')
const jsonText = ref('')
const upperSnake = ref(false)
const envOutput = ref('')
const jsonOutput = ref('')
const envErrors = ref([])
const jsonError = ref('')
const envWarnings = ref([])
const seoContentVisible = ref(true)

const directionOptions = [
  { value: 'env2json', label: '.env → JSON' },
  { value: 'json2env', label: 'JSON → .env' }
]

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

const activeErrors = computed(() => {
  if (mode.value === 'env2json') return envErrors.value
  return jsonError.value ? [jsonError.value] : []
})

const activeWarnings = computed(() => {
  return mode.value === 'env2json' ? envWarnings.value : []
})

const activeOutput = computed(() => {
  return mode.value === 'env2json' ? envOutput.value : jsonOutput.value
})

// ---------- .env → JSON ----------
const convertEnvToJson = () => {
  envErrors.value = []
  envWarnings.value = []
  envOutput.value = ''
  const text = envText.value
  if (!text.trim()) return

  const obj = {}
  const errors = []
  const warnings = []
  const lines = text.split(/\r?\n/)

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return

    let body = line
    if (/^export\s+/.test(body)) body = body.replace(/^export\s+/, '')

    const eq = body.indexOf('=')
    if (eq === -1) {
      errors.push(`第 ${i + 1} 行：缺少 "="（${body.slice(0, 40)}）`)
      return
    }

    const key = body.slice(0, eq).trim()
    let value = body.slice(eq + 1).trim()
    if (!key || /\s/.test(key)) {
      errors.push(`第 ${i + 1} 行：键名不合法（"${key.slice(0, 40)}"）`)
      return
    }

    const dq = value.startsWith('"') && value.endsWith('"') && value.length >= 2
    const sq = !dq && value.startsWith("'") && value.endsWith("'") && value.length >= 2

    if (dq) {
      value = value.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    } else if (sq) {
      value = value.slice(1, -1)
    } else {
      // 行内注释：未加引号的值中「空格 + #」之后忽略
      const commentIdx = value.search(/\s#/)
      if (commentIdx !== -1) value = value.slice(0, commentIdx).trim()
      value = value.replace(/\\n/g, '\n')
    }

    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      warnings.push(`第 ${i + 1} 行：重复键 "${key}"，已采用最后一次的值`)
    }
    obj[key] = value
  })

  envErrors.value = errors
  envWarnings.value = warnings
  if (Object.keys(obj).length) {
    envOutput.value = JSON.stringify(obj, null, 2)
  }
}

// ---------- JSON → .env ----------
const toUpperSnake = (k) => {
  return k
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s\-.]+/g, '_')
    .toUpperCase()
}

const serializeEnvValue = (v) => {
  let s = v === null || v === undefined ? '' : String(v)
  if (s === '') return ''
  if (/[\s#"']/.test(s)) {
    s = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
    return `"${s}"`
  }
  return s
}

const convertJsonToEnv = () => {
  jsonError.value = ''
  jsonOutput.value = ''
  const t = jsonText.value.trim()
  if (!t) return

  let data
  try {
    data = JSON.parse(t)
  } catch (e) {
    jsonError.value = 'JSON 语法错误：' + e.message
    return
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    jsonError.value = '仅支持扁平对象：输入需要是 JSON 对象（{...}），而不是' + (Array.isArray(data) ? '数组' : '标量值')
    return
  }

  const nestedKey = Object.keys(data).find(k => data[k] !== null && typeof data[k] === 'object')
  if (nestedKey !== undefined) {
    jsonError.value = `仅支持扁平对象：字段 "${nestedKey}" 的值是${Array.isArray(data[nestedKey]) ? '数组' : '嵌套对象'}，请先拍平（如 a.b → A_B）`
    return
  }

  const lines = Object.entries(data).map(([k, v]) => {
    const key = upperSnake.value ? toUpperSnake(k) : k
    return `${key}=${serializeEnvValue(v)}`
  })
  jsonOutput.value = lines.join('\n')
}

// ---------- 交互 ----------
const convert = () => {
  if (mode.value === 'env2json') convertEnvToJson()
  else convertJsonToEnv()
}

const copyOutput = async () => {
  if (!activeOutput.value) return
  try {
    await navigator.clipboard.writeText(activeOutput.value)
    alert('已复制到剪贴板')
  } catch (err) {
    // 降级方案：使用 execCommand
    const textarea = document.createElement('textarea')
    textarea.value = activeOutput.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const downloadOutput = () => {
  if (!activeOutput.value) return
  const isEnv = mode.value === 'json2env'
  const blob = new Blob([activeOutput.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = isEnv ? 'output.env' : 'output.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
