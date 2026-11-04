<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">CORS配置生成器</h1>
      <p class="text-muted-foreground">可视化生成跨域资源共享(CORS)配置，支持多种服务器环境，提供预设模板</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：CORS配置 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings2 class="w-5 h-5 text-primary" />
            CORS配置选项
          </h2>

          <div class="space-y-4">
            <!-- 预设模板 -->
            <div>
              <label class="text-sm font-medium mb-2 block">预设模板</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="applyPreset('open')"
                  class="p-3 border rounded-lg hover:bg-muted text-sm text-center"
                >
                  <p class="font-medium">开放</p>
                  <p class="text-xs text-muted-foreground">允许所有</p>
                </button>
                <button
                  @click="applyPreset('restricted')"
                  class="p-3 border rounded-lg hover:bg-muted text-sm text-center"
                >
                  <p class="font-medium">限制</p>
                  <p class="text-xs text-muted-foreground">指定域名</p>
                </button>
                <button
                  @click="applyPreset('strict')"
                  class="p-3 border rounded-lg hover:bg-muted text-sm text-center"
                >
                  <p class="font-medium">严格</p>
                  <p class="text-xs text-muted-foreground">仅同源</p>
                </button>
              </div>
            </div>

            <!-- 允许的源 -->
            <div>
              <label class="text-sm font-medium mb-2 block">
                Access-Control-Allow-Origin
                <span class="text-muted-foreground text-xs ml-2">(允许的源)</span>
              </label>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <input
                    v-model="newOrigin"
                    @keyup.enter="addOrigin"
                    placeholder="输入源地址，如 https://example.com"
                    class="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-mono"
                  >
                  <button
                    @click="addOrigin"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                  >
                    添加
                  </button>
                </div>
                <div class="space-y-1">
                  <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                    <input type="checkbox" v-model="allowAllOrigins" @change="toggleAllowAll" class="rounded">
                    <span class="text-sm font-mono">*</span>
                    <span class="text-xs text-muted-foreground">允许所有源（开发用）</span>
                  </label>
                  <div v-for="(origin, index) in allowedOrigins" :key="index" class="flex items-center gap-2 p-2 bg-muted rounded">
                    <span class="flex-1 text-sm font-mono truncate">{{ origin }}</span>
                    <button @click="removeOrigin(index)" class="p-1 hover:bg-background rounded">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 允许的方法 -->
            <div>
              <label class="text-sm font-medium mb-2 block">Access-Control-Allow-Methods</label>
              <div class="grid grid-cols-3 gap-2">
                <label
                  v-for="method in httpMethods"
                  :key="method"
                  class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50"
                  :class="{ 'border-primary bg-primary/5': allowedMethods.has(method) }"
                >
                  <input type="checkbox" :value="method" v-model="allowedMethodsArray" class="rounded">
                  <span class="text-sm font-mono">{{ method }}</span>
                </label>
              </div>
            </div>

            <!-- 允许的请求头 -->
            <div>
              <label class="text-sm font-medium mb-2 block">
                Access-Control-Allow-Headers
                <span class="text-muted-foreground text-xs ml-2">(允许的请求头)</span>
              </label>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <input
                    v-model="newHeader"
                    @keyup.enter="addHeader"
                    placeholder="输入请求头名称"
                    class="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-mono"
                  >
                  <button
                    @click="addHeader"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                  >
                    添加
                  </button>
                </div>
                <div class="space-y-1">
                  <label class="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                    <input type="checkbox" v-model="allowAllHeaders" class="rounded">
                    <span class="text-sm font-mono">*</span>
                    <span class="text-xs text-muted-foreground">允许所有请求头</span>
                  </label>
                  <div v-for="(header, index) in allowedHeaders" :key="index" class="flex items-center gap-2 p-2 bg-muted rounded">
                    <span class="flex-1 text-sm font-mono truncate">{{ header }}</span>
                    <button @click="removeHeader(index)" class="p-1 hover:bg-background rounded">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 暴露的响应头 -->
            <div>
              <label class="text-sm font-medium mb-2 block">
                Access-Control-Expose-Headers
                <span class="text-muted-foreground text-xs ml-2">(暴露的响应头)</span>
              </label>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <input
                    v-model="newExposeHeader"
                    @keyup.enter="addExposeHeader"
                    placeholder="输入响应头名称"
                    class="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-mono"
                  >
                  <button
                    @click="addExposeHeader"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                  >
                    添加
                  </button>
                </div>
                <div v-for="(header, index) in exposedHeaders" :key="index" class="flex items-center gap-2 p-2 bg-muted rounded">
                  <span class="flex-1 text-sm font-mono truncate">{{ header }}</span>
                  <button @click="removeExposeHeader(index)" class="p-1 hover:bg-background rounded">
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 其他选项 -->
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="allowCredentials" class="rounded">
                <span class="text-sm">Access-Control-Allow-Credentials</span>
                <span class="text-xs text-muted-foreground">允许发送Cookie</span>
              </label>

              <div>
                <label class="text-sm font-medium mb-1 block">Access-Control-Max-Age</label>
                <div class="flex gap-2">
                  <input
                    v-model.number="maxAge"
                    type="number"
                    min="0"
                    placeholder="秒数"
                    class="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
                  >
                  <span class="text-sm text-muted-foreground self-center">秒 (预检请求缓存)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：生成配置 -->
      <div class="space-y-4">
        <!-- 配置预览 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <Code class="w-5 h-5 text-purple-500" />
              配置代码
            </h2>
            <select v-model="selectedServer" class="px-3 py-1 border border-border rounded text-sm">
              <option value="nginx">Nginx</option>
              <option value="apache">Apache</option>
              <option value="nodejs">Node.js</option>
              <option value="express">Express</option>
              <option value="python">Python Flask</option>
              <option value="django">Django</option>
              <option value="php">PHP</option>
              <option value="dotnet">ASP.NET</option>
            </select>
          </div>

          <div class="space-y-3">
            <div class="bg-muted rounded-lg p-4">
              <div class="flex items-start justify-between gap-2">
                <pre class="flex-1 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{{ generatedConfig }}</pre>
                <button
                  @click="copyConfig"
                  class="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
                  title="复制配置"
                >
                  <Copy class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- HTTP头预览 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileCode class="w-5 h-5 text-orange-500" />
            HTTP响应头
          </h2>

          <div class="space-y-2">
            <div v-for="header in httpHeaders" :key="header.name" class="flex items-start gap-2 p-2 bg-muted rounded">
              <span class="font-mono text-xs text-primary min-w-[200px]">{{ header.name }}</span>
              <span class="text-xs font-mono break-all">{{ header.value }}</span>
            </div>
          </div>
        </div>

        <!-- 预检请求示例 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Terminal class="w-5 h-5 text-green-500" />
            预检请求示例
          </h2>

          <div class="space-y-3">
            <div>
              <p class="text-sm font-medium mb-2">OPTIONS请求</p>
              <pre class="text-xs bg-muted p-3 rounded-lg overflow-x-auto"><code>OPTIONS /api/resource HTTP/1.1
Host: api.example.com
Origin: {{ allowedOrigins[0] || 'https://example.com' }}
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type</code></pre>
            </div>

            <div>
              <p class="text-sm font-medium mb-2">响应</p>
              <pre class="text-xs bg-muted p-3 rounded-lg overflow-x-auto"><code>HTTP/1.1 204 No Content
Access-Control-Allow-Origin: {{ allowAllOrigins ? '*' : (allowedOrigins[0] || 'https://example.com') }}
Access-Control-Allow-Methods: {{ Array.from(allowedMethods).join(', ') }}
Access-Control-Allow-Headers: {{ allowAllHeaders ? '*' : allowedHeaders.join(', ') }}
Access-Control-Max-Age: {{ maxAge }}</code></pre>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            关于CORS
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">什么是CORS？</p>
              <p>CORS（Cross-Origin Resource Sharing）是一种基于HTTP头的机制，允许服务器标识除了它自己以外的源，浏览器应该允许从这些源加载资源。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">简单请求 vs 预检请求</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">简单请求：</strong>GET、HEAD、POST，只允许简单头部</li>
                <li><strong class="text-foreground">预检请求：</strong>先发送OPTIONS请求检查权限</li>
                <li>PUT、DELETE、自定义头部会触发预检</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">常见错误</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>No 'Access-Control-Allow-Origin' header</li>
                <li>CORS policy: credentials mode is 'include'</li>
                <li>预检请求失败</li>
                <li>允许凭证时不能使用通配符*</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">安全建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>生产环境不要使用通配符*</li>
                <li>明确指定允许的源</li>
                <li>仅允许必要的HTTP方法</li>
                <li>谨慎使用 allow-credentials</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'
import {
  Settings2,
  Code,
  FileCode,
  Terminal,
  BookOpen,
  X,
  Copy
} from 'lucide-vue-next'

// CORS配置
const allowAllOrigins = ref(false)
const allowedOrigins = ref([])
const newOrigin = ref('')

const allowedMethods = ref(new Set(['GET', 'POST', 'PUT', 'DELETE']))
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

const allowAllHeaders = ref(true)
const allowedHeaders = ref(['Content-Type', 'Authorization'])
const newHeader = ref('')

const exposedHeaders = ref([])
const newExposeHeader = ref('')

const allowCredentials = ref(false)
const maxAge = ref(86400) // 24小时

const selectedServer = ref('nginx')

// 计算属性
const allowedMethodsArray = computed({
  get: () => Array.from(allowedMethods.value),
  set: (value) => {
    allowedMethods.value = new Set(value)
  }
})

// HTTP头预览
const httpHeaders = computed(() => {
  const headers = []

  if (allowAllOrigins.value) {
    headers.push({ name: 'Access-Control-Allow-Origin', value: '*' })
  } else if (allowedOrigins.value.length > 0) {
    headers.push({ name: 'Access-Control-Allow-Origin', value: allowedOrigins.value.join(', ') })
  }

  headers.push({
    name: 'Access-Control-Allow-Methods',
    value: Array.from(allowedMethods.value).join(', ')
  })

  if (allowAllHeaders.value) {
    headers.push({ name: 'Access-Control-Allow-Headers', value: '*' })
  } else if (allowedHeaders.value.length > 0) {
    headers.push({
      name: 'Access-Control-Allow-Headers',
      value: allowedHeaders.value.join(', ')
    })
  }

  if (exposedHeaders.value.length > 0) {
    headers.push({
      name: 'Access-Control-Expose-Headers',
      value: exposedHeaders.value.join(', ')
    })
  }

  if (allowCredentials.value) {
    headers.push({ name: 'Access-Control-Allow-Credentials', value: 'true' })
  }

  if (maxAge.value > 0) {
    headers.push({ name: 'Access-Control-Max-Age', value: maxAge.value.toString() })
  }

  return headers
})

// 生成配置代码
const generatedConfig = computed(() => {
  const origin = allowAllOrigins.value ? '*' : (allowedOrigins.value[0] || 'https://example.com')
  const methods = Array.from(allowedMethods.value).join(', ')
  const headers = allowAllHeaders.value ? '*' : allowedHeaders.value.join(', ')

  switch (selectedServer.value) {
    case 'nginx':
      return `add_header 'Access-Control-Allow-Origin' '${origin}';
add_header 'Access-Control-Allow-Methods' '${methods}';
add_header 'Access-Control-Allow-Headers' '${headers}';
add_header 'Access-Control-Expose-Headers' '${exposedHeaders.value.join(', ')}';
${allowCredentials.value ? "add_header 'Access-Control-Allow-Credentials' 'true';" : ''}
add_header 'Access-Control-Max-Age' '${maxAge.value}';

if ($request_method = 'OPTIONS') {
    return 204;
}`

    case 'apache':
      return `<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "${origin}"
    Header set Access-Control-Allow-Methods "${methods}"
    Header set Access-Control-Allow-Headers "${headers}"
    ${exposedHeaders.value.length ? `Header set Access-Control-Expose-Headers "${exposedHeaders.value.join(', ')}"` : ''}
    ${allowCredentials.value ? 'Header set Access-Control-Allow-Credentials "true"' : ''}
    Header set Access-Control-Max-Age "${maxAge.value}"
</IfModule>`

    case 'nodejs':
      return `const http = require('http');

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '${origin}');
  res.setHeader('Access-Control-Allow-Methods', '${methods}');
  res.setHeader('Access-Control-Allow-Headers', '${headers}');
  ${exposedHeaders.value.length ? `res.setHeader('Access-Control-Expose-Headers', '${exposedHeaders.value.join(', ')}');` : ''}
  ${allowCredentials.value ? "res.setHeader('Access-Control-Allow-Credentials', 'true');" : ''}
  res.setHeader('Access-Control-Max-Age', '${maxAge.value}');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 处理实际请求
}).listen(3000);`

    case 'express':
      return `const express = require('express');
const cors = require('cors');

const app = express();

const corsOptions = {
  origin: ${allowAllOrigins.value ? 'true' : `['${allowedOrigins.value.join("', '")}']`},
  methods: ['${Array.from(allowedMethods.value).join("', '")}'],
  allowedHeaders: ${allowAllHeaders.value ? 'true' : `['${allowedHeaders.value.join("', '")}']`},
  exposedHeaders: ${exposedHeaders.value.length ? `['${exposedHeaders.value.join("', '")}']` : 'undefined'},
  credentials: ${allowCredentials.value},
  maxAge: ${maxAge.value},
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.listen(3000);`

    case 'python':
      return `from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": ${allowAllOrigins.value ? '*"' : `['${allowedOrigins.value.join("', '")}']`},
        "methods": ['${Array.from(allowedMethods.value).join("', '")}'],
        "allow_headers": ${allowAllHeaders.value ? '*"' : `['${allowedHeaders.value.join("', '")}']`},
        "expose_headers": ${exposedHeaders.value.length ? `['${exposedHeaders.value.join("', '")}']` : '[]'},
        "supports_credentials": ${allowCredentials.value},
        "max_age": ${maxAge.value}
    }
})

@app.route('/')
def hello():
    return jsonify({"message": "Hello"})`

    case 'django':
      return `# settings.py
CORS_ALLOWED_ORIGINS = ${allowAllOrigins.value ? "['*']" : `['${allowedOrigins.value.join("', '")}']`}
CORS_ALLOW_HEADERS = ${allowAllHeaders.value ? "['*']" : `['${allowedHeaders.value.join("', '")}']`}
CORS_ALLOW_METHODS = ['${Array.from(allowedMethods.value).join("', '")}']
CORS_EXPOSE_HEADERS = ${exposedHeaders.value.length ? `['${exposedHeaders.value.join("', '")}']` : '[]'}
CORS_ALLOW_CREDENTIALS = ${allowCredentials.value}
CORS_PREFLIGHT_MAX_AGE = ${maxAge.value}

# urls.py
from django.urls import path
from corsheaders.decorators import cors_preflight

@cors_preflight
def my_view(request):
    return JsonResponse({'data': 'hello'})`

    case 'php':
      return `<?php
header("Access-Control-Allow-Origin: ${origin}");
header("Access-Control-Allow-Methods: ${methods}");
header("Access-Control-Allow-Headers: ${headers}");
${exposedHeaders.value.length ? `header("Access-Control-Expose-Headers: " . implode(', ', ['${exposedHeaders.value.join("', '")}']));` : ''}
${allowCredentials.value ? "header('Access-Control-Allow-Credentials: true');" : ''}
header("Access-Control-Max-Age: ${maxAge.value}");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 处理实际请求
echo json_encode(['message' => 'Hello']);
?>`

    case 'dotnet':
      return `// Program.cs / Startup.cs
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(${allowAllOrigins.value ? "\"*\"" : `new string[] { "${allowedOrigins.value.join("\", \"")}" }`})
             .WithMethods("${Array.from(allowedMethods.value).join("\", \"")}")
             ${allowAllHeaders.value ? '.AllowAnyHeader()' : `.WithHeaders("${allowedHeaders.value.join("\", \"")}")`}
             ${exposedHeaders.value.length ? `.WithExposedHeaders("${exposedHeaders.value.join("\", \"")}")` : ''}
             ${allowCredentials.value ? '.AllowCredentials()' : '.DisallowCredentials()'}
             .SetPreflightMaxAge(TimeSpan.FromSeconds(${maxAge.value}));
    });
});

app.UseCors();

app.MapControllers();
// 或
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapGet("/", () => "Hello");
});`

    default:
      return '// Select a server type'
  }
})

// 添加源
function addOrigin() {
  if (newOrigin.value.trim()) {
    allowedOrigins.value.push(newOrigin.value.trim())
    newOrigin.value = ''
  }
}

// 移除源
function removeOrigin(index) {
  allowedOrigins.value.splice(index, 1)
}

// 切换允许所有源
function toggleAllowAll() {
  if (allowAllOrigins.value) {
    allowedOrigins.value = []
  }
}

// 添加请求头
function addHeader() {
  if (newHeader.value.trim()) {
    allowedHeaders.value.push(newHeader.value.trim())
    newHeader.value = ''
  }
}

// 移除请求头
function removeHeader(index) {
  allowedHeaders.value.splice(index, 1)
}

// 添加暴露头
function addExposeHeader() {
  if (newExposeHeader.value.trim()) {
    exposedHeaders.value.push(newExposeHeader.value.trim())
    newExposeHeader.value = ''
  }
}

// 移除暴露头
function removeExposeHeader(index) {
  exposedHeaders.value.splice(index, 1)
}

// 应用预设
function applyPreset(type) {
  switch (type) {
    case 'open':
      allowAllOrigins.value = true
      allowedOrigins.value = []
      allowedMethods.value = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
      allowAllHeaders.value = true
      allowCredentials.value = false
      break
    case 'restricted':
      allowAllOrigins.value = false
      allowedOrigins.value = ['https://example.com']
      allowedMethods.value = new Set(['GET', 'POST', 'PUT', 'DELETE'])
      allowAllHeaders.value = false
      allowedHeaders.value = ['Content-Type', 'Authorization']
      allowCredentials.value = true
      break
    case 'strict':
      allowAllOrigins.value = false
      allowedOrigins.value = []
      allowedMethods.value = new Set(['GET', 'POST'])
      allowAllHeaders.value = false
      allowedHeaders.value = ['Content-Type']
      allowCredentials.value = false
      break
  }
}

// 复制配置
function copyConfig() {
  navigator.clipboard.writeText(generatedConfig.value)
}

useSeoMeta({
  title: 'CORS配置生成器 - 在线跨域资源共享配置工具',
  description: '免费在线CORS配置生成器，支持Nginx、Apache、Node.js、Express等多种服务器环境，可视化配置CORS策略。',
  keywords: ['cors', '跨域', '跨域资源共享', 'nginx', 'apache', 'nodejs', '配置生成', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('CORS配置生成器')
</script>
