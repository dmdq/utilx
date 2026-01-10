<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">CORS 测试工具</h1>
      <p class="text-muted-foreground">在线测试跨域请求CORS配置，显示响应头信息，诊断CORS错误，生成服务器配置代码</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <!-- URL输入 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">测试目标 URL</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">目标 URL</label>
              <input
                v-model="targetUrl"
                type="url"
                placeholder="https://api.example.com/data"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">请求方法</label>
              <select v-model="httpMethod" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">自定义请求头（可选）</label>
              <textarea
                v-model="customHeaders"
                placeholder='Authorization: Bearer token&#10;X-Custom-Header: value'
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm h-24"
              ></textarea>
            </div>

            <div v-if="httpMethod !== 'GET' && httpMethod !== 'OPTIONS'">
              <label class="block text-sm font-medium mb-2">请求体（可选）</label>
              <textarea
                v-model="requestBody"
                placeholder='{"key": "value"}'
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm h-24"
              ></textarea>
            </div>

            <div class="flex gap-2">
              <button @click="testCORS" :disabled="testing" class="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium">
                {{ testing ? '测试中...' : '测试 CORS' }}
              </button>
              <button @click="loadExample" class="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                示例
              </button>
            </div>
          </div>
        </div>

        <!-- 请求结果 -->
        <div class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">测试结果</h2>
            <div v-if="testResult" class="flex items-center gap-2">
              <span :class="['px-3 py-1 rounded-full text-sm', testResult.success ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300']">
                {{ testResult.success ? 'CORS 启用' : 'CORS 错误' }}
              </span>
            </div>
          </div>

          <div v-if="testResult" class="space-y-4">
            <!-- 状态信息 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">HTTP 状态</p>
                <p class="font-medium">{{ testResult.status }} {{ testResult.statusText }}</p>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">响应时间</p>
                <p class="font-medium">{{ testResult.responseTime }}ms</p>
              </div>
            </div>

            <!-- CORS 响应头 -->
            <div>
              <h3 class="text-sm font-medium mb-2">CORS 响应头</h3>
              <div class="space-y-2">
                <div v-for="(value, key) in testResult.corsHeaders" :key="key" class="p-2 bg-background border rounded">
                  <p class="text-xs text-muted-foreground">{{ key }}:</p>
                  <p class="text-sm font-mono break-all">{{ value }}</p>
                </div>
                <div v-if="Object.keys(testResult.corsHeaders).length === 0" class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p class="text-sm text-yellow-800 dark:text-yellow-200">⚠️ 未检测到CORS响应头</p>
                </div>
              </div>
            </div>

            <!-- 诊断信息 -->
            <div v-if="testResult.diagnostics.length > 0" class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 class="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">诊断信息</h3>
              <ul class="space-y-1">
                <li v-for="(diag, index) in testResult.diagnostics" :key="index" class="text-sm text-blue-700 dark:text-blue-300">
                  • {{ diag }}
                </li>
              </ul>
            </div>

            <!-- 错误信息 -->
            <div v-if="testResult.error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 class="text-sm font-medium mb-2 text-red-800 dark:text-red-200">错误详情</h3>
              <p class="text-sm text-red-700 dark:text-red-300 font-mono">{{ testResult.error }}</p>
            </div>
          </div>

          <div v-else class="text-center py-8 text-muted-foreground">
            <p>输入URL后点击"测试 CORS"按钮开始测试</p>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <!-- 配置生成器 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">CORS 配置生成器</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">允许的源 (Origins)</label>
              <input
                v-model="corsConfig.allowedOrigins"
                placeholder="https://example.com, https://app.example.com"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
              >
              <p class="text-xs text-muted-foreground mt-1">使用 * 允许所有源（不推荐生产环境）</p>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">允许的方法</label>
              <input
                v-model="corsConfig.allowedMethods"
                placeholder="GET, POST, PUT, DELETE, OPTIONS"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">允许的请求头</label>
              <input
                v-model="corsConfig.allowedHeaders"
                placeholder="Content-Type, Authorization"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">暴露的响应头（可选）</label>
              <input
                v-model="corsConfig.exposedHeaders"
                placeholder="X-Custom-Header"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
              >
            </div>

            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="corsConfig.allowCredentials" class="w-4 h-4 rounded">
                <span class="text-sm">允许凭证</span>
              </label>
              <div>
                <label class="block text-sm font-medium mb-1">预检缓存(秒)</label>
                <input v-model.number="corsConfig.maxAge" type="number" class="w-full px-3 py-1 border rounded text-sm bg-background">
              </div>
            </div>
          </div>
        </div>

        <!-- 代码生成 -->
        <div class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">配置代码</h2>
            <button @click="copyCode" v-if="generatedCode" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>

          <div class="flex gap-2 mb-4 flex-wrap">
            <button v-for="lang in languages" :key="lang.value" @click="selectedLanguage = lang.value" :class="['px-3 py-2 text-sm rounded-lg border transition-colors', selectedLanguage === lang.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']">
              {{ lang.label }}
            </button>
          </div>

          <div class="relative">
            <pre class="p-4 bg-background border rounded-lg overflow-x-auto text-sm"><code>{{ generatedCode }}</code></pre>
          </div>
        </div>

        <!-- CORS 说明 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">CORS 详解</h2>

          <div class="space-y-4 text-sm">
            <div>
              <h3 class="font-medium mb-2">什么是 CORS？</h3>
              <p class="text-muted-foreground">
                跨域资源共享 (CORS) 是一种基于HTTP头的机制，允许服务器标示除了它自己以外的其他源（域、协议或端口），浏览器应该允许从这些源加载资源。
              </p>
            </div>

            <div>
              <h3 class="font-medium mb-2">常见响应头</h3>
              <ul class="space-y-2 text-muted-foreground">
                <li><code class="bg-muted px-1 rounded">Access-Control-Allow-Origin</code> - 指定允许的源</li>
                <li><code class="bg-muted px-1 rounded">Access-Control-Allow-Methods</code> - 允许的HTTP方法</li>
                <li><code class="bg-muted px-1 rounded">Access-Control-Allow-Headers</code> - 允许的请求头</li>
                <li><code class="bg-muted px-1 rounded">Access-Control-Allow-Credentials</code> - 是否允许凭证</li>
                <li><code class="bg-muted px-1 rounded">Access-Control-Max-Age</code> - 预检请求缓存时间</li>
              </ul>
            </div>

            <div>
              <h3 class="font-medium mb-2">简单请求 vs 预检请求</h3>
              <div class="space-y-2 text-muted-foreground">
                <p><strong>简单请求：</strong>GET、HEAD、或POST方法，且只允许某些Content-Type</p>
                <p><strong>预检请求：</strong>先发送OPTIONS请求检查权限，再发送实际请求</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常见错误 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h2 class="text-lg font-semibold mb-4">常见 CORS 错误及解决方法</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div class="p-4 bg-card rounded-lg">
          <h3 class="font-medium mb-2">No 'Access-Control-Allow-Origin' header</h3>
          <p class="text-muted-foreground mb-2">服务器未返回允许的源</p>
          <p class="text-xs text-muted-foreground">解决：在服务器响应中添加 Access-Control-Allow-Origin 头</p>
        </div>
        <div class="p-4 bg-card rounded-lg">
          <h3 class="font-medium mb-2">CORS policy: Origin is not allowed</h3>
          <p class="text-muted-foreground mb-2">请求的源不在允许列表中</p>
          <p class="text-xs text-muted-foreground">解决：将你的域名添加到允许的源列表</p>
        </div>
        <div class="p-4 bg-card rounded-lg">
          <h3 class="font-medium mb-2">Credentials flag is true</h3>
          <p class="text-muted-foreground mb-2">使用凭证但未配置</p>
          <p class="text-xs text-muted-foreground">解决：设置 Access-Control-Allow-Credentials: true 并指定具体源</p>
        </div>
        <div class="p-4 bg-card rounded-lg">
          <h3 class="font-medium mb-2">Method is not allowed</h3>
          <p class="text-muted-foreground mb-2">请求的方法不在允许列表中</p>
          <p class="text-xs text-muted-foreground">解决：添加方法到 Access-Control-Allow-Methods</p>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-6 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/http-client" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">HTTP客户端</NuxtLink>
        <NuxtLink to="/tools/http-header-analyzer" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">HTTP头分析</NuxtLink>
        <NuxtLink to="/tools/ssl-checker" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">SSL检查</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'

const targetUrl = ref('')
const httpMethod = ref('GET')
const customHeaders = ref('')
const requestBody = ref('')
const testing = ref(false)

const testResult = ref(null)

const corsConfig = ref({
  allowedOrigins: 'https://example.com',
  allowedMethods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization',
  exposedHeaders: '',
  allowCredentials: false,
  maxAge: 3600
})

const selectedLanguage = ref('nodejs')
const copied = ref(false)

const languages = [
  { value: 'nodejs', label: 'Node.js' },
  { value: 'express', label: 'Express' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache' },
  { value: 'python', label: 'Python Flask' },
  { value: 'go', label: 'Go' }
]

const examples = [
  'https://api.github.com/users/github',
  'https://jsonplaceholder.typicode.com/posts/1',
  'https://httpbin.org/get'
]
const currentExample = ref(0)

const generatedCode = computed(() => {
  const { allowedOrigins, allowedMethods, allowedHeaders, exposedHeaders, allowCredentials, maxAge } = corsConfig.value

  switch (selectedLanguage.value) {
    case 'nodejs':
      return `// Node.js (http module)
const http = require('http');

http.createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '${allowedOrigins}');
  res.setHeader('Access-Control-Allow-Methods', '${allowedMethods}');
  res.setHeader('Access-Control-Allow-Headers', '${allowedHeaders}');
  ${allowCredentials ? "res.setHeader('Access-Control-Allow-Credentials', 'true');" : ''}
  ${exposedHeaders ? `res.setHeader('Access-Control-Expose-Headers', '${exposedHeaders}');` : ''}
  res.setHeader('Access-Control-Max-Age', '${maxAge}');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 处理实际请求
  res.writeHead(200);
  res.end('Hello World');
}).listen(3000);`

    case 'express':
      return `// Express.js
const express = require('express');
const cors = require('cors');
const app = express();

// 自定义 CORS 配置
const corsOptions = {
  origin: '${allowedOrigins}',
  methods: ['${allowedMethods.split(',').join("', '")}'],
  allowedHeaders: ['${allowedHeaders.split(',').join("', '")}'],
  ${exposedHeaders ? `exposedHeaders: ['${exposedHeaders.split(',').join("', '")}'],` : ''}
  credentials: ${allowCredentials},
  maxAge: ${maxAge}
};

app.use(cors(corsOptions));

// 或使用快捷方式
// app.use(cors()); // 允许所有源

app.get('/data', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(3000);`

    case 'nginx':
      return `# Nginx 配置
server {
    listen 80;
    server_name example.com;

    location / {
        # CORS 头
        add_header 'Access-Control-Allow-Origin' '${allowedOrigins}' always;
        add_header 'Access-Control-Allow-Methods' '${allowedMethods}' always;
        add_header 'Access-Control-Allow-Headers' '${allowedHeaders}' always;
        ${exposedHeaders ? `add_header 'Access-Control-Expose-Headers' '${exposedHeaders}' always;` : ''}
        ${allowCredentials ? "add_header 'Access-Control-Allow-Credentials' 'true' always;" : ''}
        add_header 'Access-Control-Max-Age' '${maxAge}' always;

        # 处理预检请求
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '${allowedOrigins}' always;
            add_header 'Access-Control-Allow-Methods' '${allowedMethods}' always;
            add_header 'Access-Control-Allow-Headers' '${allowedHeaders}' always;
            add_header 'Access-Control-Max-Age' '${maxAge}' always;
            add_header 'Content-Length' 0;
            add_header 'Content-Type' 'text/plain';
            return 204;
        }

        # 代理到后端
        proxy_pass http://localhost:3000;
    }
}`

    case 'apache':
      return `# Apache .htaccess 或 httpd.conf
<IfModule mod_headers.c>
    # CORS 头
    Header always set Access-Control-Allow-Origin "${allowedOrigins}"
    Header always set Access-Control-Allow-Methods "${allowedMethods}"
    Header always set Access-Control-Allow-Headers "${allowedHeaders}"
    ${exposedHeaders ? `Header always set Access-Control-Expose-Headers "${exposedHeaders}"` : ''}
    ${allowCredentials ? "Header always set Access-Control-Allow-Credentials \"true\"" : ''}
    Header always set Access-Control-Max-Age "${maxAge}"

    # 处理预检请求
    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>`

    case 'python':
      return `# Python Flask
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# 配置 CORS
CORS(app,
     origins='${allowedOrigins}',
     methods=['${allowedMethods.split(',').join("', '")}'],
     allow_headers=['${allowedHeaders.split(',').join("', '")}'],
     ${exposedHeaders ? `expose_headers=['${exposedHeaders.split(',').join("', '")}'],` : ''}
     supports_credentials=${allowCredentials},
     max_age=${maxAge})

@app.route('/data')
def get_data():
    return jsonify({'message': 'Hello World'})

if __name__ == '__main__':
    app.run(debug=True)`

    case 'go':
      return `// Go with gorilla/mux
package main

import (
    "net/http"
    "github.com/gorilla/mux"
)

func enableCORS(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "${allowedOrigins}")
        w.Header().Set("Access-Control-Allow-Methods", "${allowedMethods}")
        w.Header().Set("Access-Control-Allow-Headers", "${allowedHeaders}")
        ${exposedHeaders ? `w.Header().Set("Access-Control-Expose-Headers", "${exposedHeaders}")` : ''}
        ${allowCredentials ? 'w.Header().Set("Access-Control-Allow-Credentials", "true")' : ''}
        w.Header().Set("Access-Control-Max-Age", "${maxAge}")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusNoContent)
            return
        }

        next.ServeHTTP(w, r)
    })
}

func main() {
    r := mux.NewRouter()
    r.Use(enableCORS)

    r.HandleFunc("/data", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello World"))
    })

    http.ListenAndServe(":3000", r)
}`

    default:
      return '// 选择语言查看配置代码'
  }
})

const testCORS = async () => {
  if (!targetUrl.value.trim()) {
    alert('请输入目标URL')
    return
  }

  testing.value = true
  testResult.value = null

  const startTime = performance.now()

  try {
    const headers = {}
    if (customHeaders.value) {
      customHeaders.value.split('\n').forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim())
        if (key && value) {
          headers[key] = value
        }
      })
    }

    const options = {
      method: httpMethod.value,
      headers: {
        'Origin': window.location.origin,
        ...headers
      }
    }

    if (requestBody.value && httpMethod.value !== 'GET' && httpMethod.value !== 'OPTIONS') {
      options.body = requestBody.value
    }

    const response = await fetch(targetUrl.value, options)
    const endTime = performance.now()

    const corsHeaders = {}
    const diagnostics = []

    // 检查CORS相关响应头
    const corsHeaderNames = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-allow-credentials',
      'access-control-expose-headers',
      'access-control-max-age'
    ]

    corsHeaderNames.forEach(header => {
      const value = response.headers.get(header)
      if (value) {
        corsHeaders[header] = value
      }
    })

    // 诊断
    if (!corsHeaders['access-control-allow-origin']) {
      diagnostics.push('服务器未返回 Access-Control-Allow-Origin 头')
    } else if (corsHeaders['access-control-allow-origin'] === '*') {
      diagnostics.push('使用通配符 * 允许所有源（适合公共API）')
    } else if (corsHeaders['access-control-allow-origin'] !== window.location.origin) {
      diagnostics.push('允许的源与当前源不匹配')
    }

    if (!corsHeaders['access-control-allow-methods']) {
      diagnostics.push('缺少 Access-Control-Allow-Methods 头')
    }

    testResult.value = {
      success: response.ok || corsHeaders['access-control-allow-origin'],
      status: response.status,
      statusText: response.statusText,
      responseTime: Math.round(endTime - startTime),
      corsHeaders: corsHeaders,
      diagnostics: diagnostics,
      error: null
    }

  } catch (error) {
    const endTime = performance.now()

    testResult.value = {
      success: false,
      status: 0,
      statusText: 'Error',
      responseTime: Math.round(endTime - startTime),
      corsHeaders: {},
      diagnostics: [],
      error: error.message
    }
  } finally {
    testing.value = false
  }
}

const loadExample = () => {
  targetUrl.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = generatedCode.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

// SEO
useSeoMeta({
  title: 'CORS测试工具 - 在线跨域请求检测',
  description: '免费在线CORS测试工具，检测跨域请求配置，显示CORS响应头，诊断CORS错误，生成多种后端的CORS配置代码。',
  keywords: [
    'cors测试',
    '跨域',
    'cors检测',
    '跨域请求',
    'access-control',
    'cors配置',
    'cors错误',
    'cors头',
    '预检请求',
    '网络工具'
  ],
  ogTitle: 'CORS测试工具 - 在线跨域请求检测',
  ogDescription: '测试CORS配置，显示响应头，生成配置代码',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('CORS测试工具')

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'CORS测试工具',
        description: '在线CORS测试工具，检测跨域请求配置，生成CORS配置代码',
        url: 'https://www.util.cn/tools/cors-tester',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          'CORS请求测试',
          '响应头分析',
          '预检请求检测',
          '错误诊断',
          '配置代码生成',
          '支持多种后端语言'
        ]
      })
    }
  ]
})
</script>
