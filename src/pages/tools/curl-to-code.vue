<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">cURL转代码 - 在线cURL命令转多种编程语言工具</h1>
      <p class="text-muted-foreground ">免费在线cURL转代码工具，支持将cURL命令转换为JavaScript、Python、PHP、Java、C#、Go、Ruby等多种编程语言代码。支持HTTP请求、API调用等场景，纯本地转换，代码安全可靠。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧输入区 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground flex items-center">
            <Terminal class="w-4 h-4 mr-2" />
            cURL命令
          </label>
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
          </div>
        </div>

        <textarea
          v-model="curlCommand"
          placeholder="curl -X POST https://api.example.com/data\n  -H 'Content-Type: application/json'\n  -d '{&quot;key&quot;: &quot;value&quot;}'"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          rows="8"
          @input="convertCurl"
        ></textarea>

        <!-- 预设示例 -->
        <div class="mt-4">
          <label class="block text-xs text-muted-foreground mb-2">常用示例</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="example in examples"
              :key="example.name"
              @click="loadExample(example)"
              class="px-3 py-2 bg-card border border-border rounded-md hover:bg-accent transition-colors text-xs text-foreground"
            >
              {{ example.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧输出区 -->
      <div class="flex flex-col h-full">
        <!-- 输出格式选择 -->
        <div class="mb-3">
          <label class="text-sm font-medium text-foreground flex items-center mb-2">
            <FileCode class="w-4 h-4 mr-2" />
            输出语言
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="lang in languages"
              :key="lang.value"
              @click="selectedLanguage = lang.value"
              :class="[
                'px-3 py-1.5 rounded-md transition-colors text-sm font-medium',
                selectedLanguage === lang.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              {{ lang.name }}
            </button>
          </div>
        </div>

        <!-- 生成的代码 -->
        <div class="flex-1 flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-foreground flex items-center">
              <Code class="w-4 h-4 mr-2" />
              生成的代码
            </label>
            <div class="flex gap-2">
              <select
                v-model="codeFontSize"
                class="text-xs bg-muted border border-border border-border rounded px-2 py-1"
              >
                <option value="text-xs">极小</option>
                <option value="text-sm">小</option>
                <option value="text-base">中</option>
                <option value="text-lg">大</option>
              </select>
              <button
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
                @click="copyCode"
              >
                <Copy class="w-3 h-3" />
              </button>
              <button
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
                @click="downloadCode"
              >
                <Download class="w-3 h-3" />
              </button>
            </div>
          </div>

          <pre
            :class="[
              'flex-1 w-full min-h-[300px] p-4 bg-card border border-border rounded-lg overflow-auto font-mono text-sm',
              codeFontSize
            ]"
          ><code>{{ generatedCode || '请输入cURL命令...' }}</code></pre>
        </div>

        <!-- 依赖说明 -->
        <div class="mt-4 p-3 bg-muted/50 rounded-lg">
          <h3 class="text-sm font-medium text-foreground flex items-center mb-2">
            <Package class="w-4 h-4 mr-2" />
            依赖说明
          </h3>
          <div class="text-xs text-muted-foreground">
            <div v-html="dependencyInfo"></div>
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
          什么是 cURL 转代码？
        </h2>
        <p class="text-muted-foreground mb-4">
          cURL 是一个强大的命令行工具，用于发送和接收数据，支持多种协议，包括 HTTP、HTTPS、FTP 等。
          在开发过程中，我们经常需要将测试好的 cURL 命令转换为实际的编程语言代码，以便集成到项目中。
          cURL 转代码工具可以帮助开发者快速完成这个转换过程，节省时间并减少错误。
        </p>
        <p class="text-muted-foreground">
          本工具支持多种主流编程语言，包括 JavaScript (fetch/axios)、Python (requests)、PHP (cURL)、Java (HttpClient)、
          C# (HttpClient)、Go (net/http)、Ruby (net/http) 等。转换后的代码可以直接在项目中使用，
          大大提高了开发效率。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 cURL 命令粘贴到左侧输入框中</li>
          <li>选择您想要转换的目标编程语言</li>
          <li>代码会自动生成并显示在右侧</li>
          <li>点击"复制"按钮复制生成的代码，或点击"下载"保存为文件</li>
          <li>查看底部的依赖说明，确保项目已安装必要的库</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          支持的功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种语言支持</strong>: 支持 JavaScript、Python、PHP、Java、C#、Go、Ruby 等主流编程语言</li>
          <li><strong>完整的 HTTP 功能</strong>: 支持 GET、POST、PUT、DELETE 等 HTTP 方法</li>
          <li><strong>请求头处理</strong>: 自动识别和转换自定义请求头</li>
          <li><strong>数据传输</strong>: 支持 JSON、表单数据、文件上传等多种数据格式</li>
          <li><strong>认证支持</strong>: 支持 Bearer Token、Basic Auth 等认证方式</li>
          <li><strong>本地处理</strong>: 所有转换都在浏览器本地完成，保护数据隐私</li>
          <li><strong>实时转换</strong>: 输入 cURL 命令后立即生成代码，无需等待</li>
          <li><strong>代码高亮</strong>: 生成的代码具有良好的格式和可读性</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见应用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>API 集成</strong>: 将 API 文档中的 cURL 示例转换为项目代码</li>
          <li><strong>快速原型</strong>: 快速生成 HTTP 请求代码，用于测试和开发</li>
          <li><strong>学习参考</strong>: 学习不同语言的 HTTP 请求实现方式</li>
          <li><strong>代码迁移</strong>: 将项目中的 cURL 命令转换为编程语言代码</li>
          <li><strong>文档编写</strong>: 为项目文档生成多语言示例代码</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">生成的代码可以直接使用吗？</h3>
            <p class="text-muted-foreground mt-1">
              大部分情况下可以直接使用。但建议根据您的项目需求进行适当调整，
              比如添加错误处理、响应解析、环境变量配置等。同时请确保项目已安装所需的依赖库。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些 cURL 选项？</h3>
            <p class="text-muted-foreground mt-1">
              本工具支持常用的 cURL 选项，包括 -X (HTTP方法)、-H (请求头)、-d (数据)、
              -F (表单)、-u (认证)、--timeout (超时) 等。如果遇到不支持的选项，
              可能需要手动调整生成的代码。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">数据安全有保障吗？</h3>
            <p class="text-muted-foreground mt-1">
              绝对安全。本工具采用纯前端技术实现，所有 cURL 命令解析和代码生成都在您的浏览器本地完成，
              数据不会上传到任何服务器。您的 cURL 命令可能包含敏感信息，使用本地处理可以确保隐私安全。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何处理复杂的 cURL 命令？</h3>
            <p class="text-muted-foreground mt-1">
              对于复杂的 cURL 命令，建议先进行简化转换，然后根据需要手动完善。
              特别是涉及特殊选项、自定义证书、代理设置等情况时，可能需要额外的配置。
              生成的代码提供了一个良好的起点，您可以根据实际需求进行调整。
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Terminal, FileCode, Code, Package, Copy, Download, RotateCcw,
  FileText, Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch, ChevronUp, HelpCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'



const router = useRouter()

// SEO配置
useSeoMeta({
  title: 'cURL转代码 - 在线cURL命令转多种编程语言工具',
  meta: [
    { name: 'description', content: '免费在线cURL转代码工具，支持将cURL命令转换为JavaScript、Python、PHP、Java、C#、Go、Ruby等多种编程语言代码。支持HTTP请求、API调用等场景，纯本地转换，代码安全可靠。' },
    { name: 'keywords', content: 'cURL转代码,HTTP请求,API调用,代码生成,JavaScript,Python,PHP,Java' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'curl-to-code')
const category = categories.find(c => c.id === 'network')

// 响应式数据
const curlCommand = ref('')
const generatedCode = ref('')
const selectedLanguage = ref('javascript')
const codeFontSize = ref('text-sm')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Terminal, FileCode, Code, Package, Copy, Download, RotateCcw,
  FileText, Lock, Shield, Clock, Type, Wifi, Image,
  Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, GitBranch
}

// 支持的语言
const languages = [
  { name: 'JavaScript', value: 'javascript', icon: 'Code' },
  { name: 'Python', value: 'python', icon: 'Code' },
  { name: 'PHP', value: 'php', icon: 'Code' },
  { name: 'Java', value: 'java', icon: 'Code' },
  { name: 'C#', value: 'csharp', icon: 'Code' },
  { name: 'Go', value: 'go', icon: 'Code' },
  { name: 'Ruby', value: 'ruby', icon: 'Code' },
  { name: 'Shell', value: 'shell', icon: 'Terminal' }
]

// 预设示例
const examples = [
  {
    name: 'GET请求',
    command: 'curl https://api.example.com/data'
  },
  {
    name: 'POST JSON',
    command: 'curl -X POST https://api.example.com/data \\\n  -H "Content-Type: application/json" \\\n  -d \'{\\"key\\": \\"value\\"}\''
  },
  {
    name: '带认证',
    command: 'curl -H "Authorization: Bearer token123" https://api.example.com/data'
  },
  {
    name: '上传文件',
    command: 'curl -X POST -F "file=@/path/to/file.jpg" https://api.example.com/upload'
  },
  {
    name: '设置超时',
    command: 'curl --connect-timeout 10 --max-time 60 https://api.example.com/data'
  },
  {
    name: '跟随重定向',
    command: 'curl -L https://api.example.com/data'
  }
]

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'curl-to-code'
  ).slice(0, 2)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'base64-encode'),
    tools.find(t => t.id === 'url-encode'),
    tools.find(t => t.id === 'api-doc')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 依赖信息
const dependencyInfo = computed(() => {
  const deps = {
    javascript: '<p class="mb-2"><strong>Node.js:</strong> 内置 <code>https</code> 模块</p><p><strong>浏览器:</strong> 使用 <code>fetch</code> API</p>',
    python: '<p class="mb-1">安装 requests 库:</p><pre class="bg-muted p-1 rounded text-xs"><code>pip install requests</code></pre>',
    php: '<p>使用 cURL 扩展（通常已安装）</p>',
    java: '<p class="mb-1">添加依赖：</p><pre class="bg-muted p-1 rounded text-xs"><code>// Maven\n&lt;dependency&gt;\n  &lt;groupId&gt;org.apache.httpcomponents&lt;/groupId&gt;\n  &lt;artifactId&gt;httpclient&lt;/artifactId&gt;\n  &lt;version&gt;4.5.13&lt;/version&gt;\n&lt;/dependency&gt;</code></pre>',
    csharp: '<p class="mb-1">使用 HttpClient：</p><pre class="bg-muted p-1 rounded text-xs"><code>// .NET Core\nusing System.Net.Http;\nusing System.Threading.Tasks;</code></pre>',
    go: '<p>内置 <code>net/http</code> 包</p>',
    ruby: '<p>使用 net/http 库（通常已安装）</p>',
    shell: '<p>直接使用 cURL 命令</p>'
  }
  return deps[selectedLanguage.value] || ''
})

// 方法
const convertCurl = () => {
  if (!curlCommand.value.trim()) {
    generatedCode.value = '请输入cURL命令'
    return
  }

  try {
    const parser = parseCurl(curlCommand.value)
    generatedCode.value = generateCode(parser, selectedLanguage.value)
  } catch (error) {
    generatedCode.value = '// 解析错误: ' + error.message
  }
}

const parseCurl = (command) => {
  // 简单的cURL解析（实际项目中应使用更完整的解析器）
  const result = {
    url: '',
    method: 'GET',
    headers: [],
    data: null,
    options: []
  }

  // 提取方法
  const methodMatch = command.match(/-X\s+(\w+)/i)
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase()
  }

  // 提取URL
  const urlMatch = command.match(/\s+(https?:\/\/[^\s]+)/i)
  if (urlMatch) {
    result.url = urlMatch[1]
  }

  // 提取头部
  const headerMatches = command.matchAll(/-H\s+['"]([^'"]+)['"]/gi)
  if (headerMatches) {
    result.headers = headerMatches.map(match => {
      const [key, value] = match[1].split(/:\s*/)
      return { key: key.trim(), value: value.trim() }
    })
  }

  // 提取数据
  const dataMatch = command.match(/-d\s+['"]([^'"]+)['"]/i)
  if (dataMatch) {
    result.data = dataMatch[1]
  }

  return result
}

const generateCode = (parsed, language) => {
  switch (language) {
    case 'javascript':
      return generateJavaScript(parsed)
    case 'python':
      return generatePython(parsed)
    case 'php':
      return generatePHP(parsed)
    case 'java':
      return generateJava(parsed)
    case 'csharp':
      return generateCSharp(parsed)
    case 'go':
      return generateGo(parsed)
    case 'ruby':
      return generateRuby(parsed)
    case 'nodejs':
      return generateNodeJS(parsed)
    case 'shell':
      return curlCommand.value
    default:
      return '// 不支持的语言'
  }
}

const generateJavaScript = (parsed) => {
  let code = `const url = '${parsed.url}'`

  if (parsed.method !== 'GET') {
    code += `\nconst options = {\n  method: '${parsed.method}',\n`

    if (parsed.headers.length > 0) {
      code += '  headers: {\n'
      parsed.headers.forEach(header => {
        code += `    '${header.key}': '${header.value}',\n`
      })
      code += '  },\n'
    }

    if (parsed.data) {
      code += `  body: JSON.stringify(${parsed.data.startsWith('{') ? parsed.data : `'${parsed.data}'`}),\n`
    }

    code += '}'

    code += `\n\nfetch(url, options)`
    code += `\n  .then(response => response.json())`
    code += `\n  .then(data => console.log(data))`
    code += `\n  .catch(error => console.error('Error:', error))`
  } else {
    if (parsed.headers.length > 0) {
      code += `\nconst headers = {`
      parsed.headers.forEach(header => {
        code += `\n  '${header.key}': '${header.value}',`
      })
      code += '\n}'
      code += `\n\nfetch(url, { headers })`
    } else {
      code += `\nfetch(url)`
    }

    code += `\n  .then(response => response.json())`
    code += `\n  .then(data => console.log(data))`
    code += `\n  .catch(error => console.error('Error:', error))`
  }

  return code
}

const generatePython = (parsed) => {
  let code = `import requests`
  code += `\n\nurl = '${parsed.url}'`

  const config = {
    method: parsed.method.toLowerCase()
  }

  if (parsed.headers.length > 0) {
    config.headers = {}
    parsed.headers.forEach(header => {
      config.headers[header.key] = header.value
    })
  }

  if (parsed.data) {
    config.json = JSON.parse(parsed.data.startsWith('{') ? parsed.data : `'${parsed.data}'`)
  }

  code += `\n\nresponse = requests.${parsed.method.toLowerCase()}(url,`
  if (Object.keys(config).length > 1) {
    code += `config`
  } else {
    code += 'json={}'
  }
  code += `)`
  code += `\nprint(response.json())`

  return code
}

const generatePHP = (parsed) => {
  let code = `<?php`
  code += `\n$ch = curl_init('${parsed.url}')`

  code += `\ncurl_setopt($ch, CURLOPT_${parsed.method === 'GET' ? 'CUSTOMREQUEST' : 'POST'}, true)`

  if (parsed.headers.length > 0) {
    code += `\n$headers = []`
    parsed.headers.forEach(header => {
      code += `\n$headers[] = '${header.key}: ${header.value}'`
    })
    code += `\ncurl_setopt($ch, CURLOPT_HTTPHEADER, $headers)`
  }

  if (parsed.data) {
    code += `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${parsed.data}')`
  }

  code += `\n\n$response = curl_exec($ch)`
  code += `\ncurl_close($ch)`
  code += `\necho $response;`

  return code
}

const generateJava = (parsed) => {
  let code = `import java.net.http.*;\n`
  code += `import java.net.URI;\n`
  code += `import java.net.http.HttpClient;\n`
  code += `import java.net.http.HttpRequest;\n`
  code += `import java.net.http.HttpResponse;\n`
  code += `import java.net.http.StringEntity;\n`
  code += `import java.util.List;\n`
  code += `import java.util.Map;\n\n`

  code += `public class ApiClient {\n`
  code += `  public static void main(String[] args) throws Exception {\n`
  code += `    HttpClient client = HttpClient.newHttpClient();\n`
  code += `    HttpRequest request = HttpRequest.newBuilder()\n`
  code += `        .uri(URI.create("${parsed.url}"))\n`
  code += `        .method(HttpRequest.Method.${parsed.method})\n`

  if (parsed.headers.length > 0) {
    code += `        .headers(headers -> {\n`
    parsed.headers.forEach(header => {
      code += `          headers.set("${header.key}", "${header.value}");\n`
    })
    code += `        })\n`
  }

  if (parsed.data) {
    code += `        .header("Content-Type", "application/json")\n`
    code += `        .POST(HttpRequest.BodyPublishers.ofString(${parsed.data.startsWith('{') ? parsed.data : `'" + parsed.data + "'`}))\n`
  }

  code += `        .build();\n`

  code += `    HttpResponse response = client.send(request, HttpResponse.BodyHandlers.ofString());\n`
  code += `    System.out.println(response.body());\n`
  code += `  }\n`
  code += `}`

  return code
}

const generateCSharp = (parsed) => {
  let code = `using System;\n`
  code += `using System.Net.Http;\n`
  code += `using System.Threading.Tasks;\n`
  code += `using System.Text;\n\n`

  code += `class Program\n`
  code += `{\n`
  code += `    static async Task Main()\n`
  code += `    {\n`
  code += `        var client = new HttpClient();\n`
  code += `        var request = new HttpRequestMessage(HttpMethod.${parsed.method}, "${parsed.url}");\n`

  if (parsed.headers.length > 0) {
    parsed.headers.forEach(header => {
      code += `        request.Headers.Add("${header.key}", "${header.value}");\n`
    })
  }

  if (parsed.data) {
    code += `        request.Content = new StringContent(${parsed.data.startsWith('{') ? parsed.data : `"` + parsed.data + `"`}, Encoding.UTF8, "application/json");\n`
  }

  code += `\n        var response = await client.SendAsync(request);\n`
  code += `        var content = await response.Content.ReadAsStringAsync();\n`
  code += `        Console.WriteLine(content);\n`
  code += `    }\n`
  code += `}`

  return code
}

const generateGo = (parsed) => {
  let code = `package main\n\n`
  code += `import (
  "fmt"
  "io/ioutil"
  "net/http"
  "strings"
  "bytes"
  "encoding/json"
)

`
  code += `func main() {\n`
  code += `  url := "${parsed.url}"\n\n`

  if (parsed.method === 'GET' && parsed.headers.length === 0 && !parsed.data) {
    code += `  resp, err := http.Get(url)\n`
    code += `  if err != nil {
    fmt.Println("Error:", err)
    return
  }
`
    code += `  defer resp.Body.Close()\n`
    code += `  body, _ := ioutil.ReadAll(resp.Body)\n`
    code += `  fmt.Println(string(body))\n`
  } else {
    code += `  client := &http.Client{}\n`
    code += `  var req *http.Request\n  var err error\n\n`

    if (parsed.data && parsed.data.startsWith('{')) {
      code += `  var jsonStr = \`${parsed.data}\`\n`
      code += `  var payload = bytes.NewBufferString(jsonStr)\n`
      code += `  req, err = http.NewRequest("${parsed.method}", url, payload)\n`
    } else {
      code += `  req, err = http.NewRequest("${parsed.method}", url, nil)\n`
    }

    code += `  if err != nil {
    fmt.Println("Error:", err)
    return
  }
`

    if (parsed.headers.length > 0) {
      parsed.headers.forEach(header => {
        code += `  req.Header.Set("${header.key}", "${header.value}")\n`
      })
    }

    code += `  resp, err := client.Do(req)\n`
    code += `  if err != nil {
    fmt.Println("Error:", err)
    return
  }
`
    code += `  defer resp.Body.Close()\n`
    code += `  body, _ := ioutil.ReadAll(resp.Body)\n`
    code += `  fmt.Println(string(body))\n`
  }

  code += `}`

  return code
}

const generateRuby = (parsed) => {
  let code = `require 'net/http'\n`
  code += `require 'uri'\n`
  code += `require 'json'\n\n`
  code += `url = URI('${parsed.url}')\n`
  code += `headers = {\n`

  if (parsed.headers.length > 0) {
    parsed.headers.forEach(header => {
      code += `  '${header.key}' => '${header.value}',\n`
    })
  }

  code += `}\n\n`

  if (parsed.method === 'GET' && !parsed.data) {
    code += `uri = URI(url)\n`
    code += `response = Net::HTTP.get(uri)\n`
    code += `puts response.body`
  } else {
    code += `uri = URI(url)\n`
    code += `request = Net::HTTP::${parsed.method === 'POST' ? 'Post' : parsed.method}.new(uri)\n`

    if (parsed.headers.length > 0) {
      code += `  headers.each { |key, value| request[key] = value }\n`
    }

    if (parsed.data) {
      code += `  request.body = ${parsed.data.startsWith('{') ? parsed.data : `'${parsed.data}'`}\n`
    }

    code += `  response = Net::HTTP.start(uri, request)\n`
    code += `  puts response.body\n`
  }

  return code
}

const generateNodeJS = (parsed) => {
  let code = `const fetch = require('node-fetch')\n`
  code += generateJavaScript(parsed)

  return code
}

const loadExample = (example) => {
  curlCommand.value = example.command
  convertCurl()
}

const copyCode = () => {
  if (!generatedCode.value) return

  navigator.clipboard.writeText(generatedCode.value).then(() => {
    // 可以添加复制成功的提示
  }).catch(error => {
    console.error('复制失败:', error)
  })
}

const downloadCode = () => {
  if (!generatedCode.value) return

  const languageExtensions = {
    javascript: 'js',
    python: 'py',
    php: 'php',
    java: 'java',
    csharp: 'cs',
    go: 'go',
    ruby: 'rb',
    shell: 'sh'
  }

  const ext = languageExtensions[selectedLanguage.value] || 'txt'
  const blob = new Blob([generatedCode.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `curl-code.${ext}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const clearInput = () => {
  curlCommand.value = ''
  generatedCode.value = ''
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    curlCommand.value = text
    convertCurl()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  // 跳转到具体工具页面
  router.push(`/tools/${selectedTool.id}`)
  // 添加到最近使用
  addRecentTool(selectedTool.id)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 监听语言变化
const handleLanguageChange = () => {
  if (curlCommand.value) {
    convertCurl()
  }
}

// 当选择的语言变化时重新转换
watch(selectedLanguage, handleLanguageChange)
</script>