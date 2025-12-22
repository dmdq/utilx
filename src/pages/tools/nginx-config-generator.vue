<template>
  <div class="container mx-auto p-4 max-w-6xl">
    <h1 class="text-3xl font-bold mb-6">Nginx配置生成器</h1>
    <p class="text-muted-foreground mb-8">根据需求快速生成Nginx配置文件，支持反向代理、负载均衡、SSL等常用配置</p>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- 配置选项 -->
      <div class="space-y-6">
        <!-- 基本配置 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server class="w-5 h-5 text-primary" />
            基本配置
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">服务器名称</label>
              <input
                v-model="config.serverName"
                type="text"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="example.com"
                @input="generateConfig"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">监听端口</label>
              <input
                v-model="config.port"
                type="number"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="80"
                @input="generateConfig"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">根目录</label>
              <input
                v-model="config.root"
                type="text"
                class="w-full px-3 py-2 border rounded-md"
                placeholder="/var/www/html"
                @input="generateConfig"
              />
            </div>
          </div>
        </div>

        <!-- 反向代理 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe class="w-5 h-5 text-primary" />
            反向代理
          </h2>

          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <input
                v-model="config.proxy.enabled"
                type="checkbox"
                id="proxyEnabled"
                class="rounded"
                @change="generateConfig"
              />
              <label for="proxyEnabled" class="text-sm font-medium">启用反向代理</label>
            </div>

            <div v-if="config.proxy.enabled">
              <div>
                <label class="block text-sm font-medium mb-2">后端地址</label>
                <input
                  v-model="config.proxy.backend"
                  type="text"
                  class="w-full px-3 py-2 border rounded-md"
                  placeholder="http://localhost:3000"
                  @input="generateConfig"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- SSL/TLS -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield class="w-5 h-5 text-primary" />
            SSL/TLS
          </h2>

          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <input
                v-model="config.ssl.enabled"
                type="checkbox"
                id="sslEnabled"
                class="rounded"
                @change="generateConfig"
              />
              <label for="sslEnabled" class="text-sm font-medium">启用SSL</label>
            </div>

            <div v-if="config.ssl.enabled">
              <div>
                <label class="block text-sm font-medium mb-2">证书路径</label>
                <input
                  v-model="config.ssl.certPath"
                  type="text"
                  class="w-full px-3 py-2 border rounded-md"
                  placeholder="/etc/ssl/certs/cert.pem"
                  @input="generateConfig"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">私钥路径</label>
                <input
                  v-model="config.ssl.keyPath"
                  type="text"
                  class="w-full px-3 py-2 border rounded-md"
                  placeholder="/etc/ssl/private/key.pem"
                  @input="generateConfig"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 负载均衡 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Network class="w-5 h-5 text-primary" />
            负载均衡
          </h2>

          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <input
                v-model="config.loadBalance.enabled"
                type="checkbox"
                id="loadBalanceEnabled"
                class="rounded"
                @change="generateConfig"
              />
              <label for="loadBalanceEnabled" class="text-sm font-medium">启用负载均衡</label>
            </div>

            <div v-if="config.loadBalance.enabled">
              <div>
                <label class="block text-sm font-medium mb-2">后端服务器（每行一个）</label>
                <textarea
                  v-model="config.loadBalance.backends"
                  class="w-full px-3 py-2 border rounded-md h-24"
                  placeholder="192.168.1.10:80&#10;192.168.1.11:80&#10;192.168.1.12:80"
                  @input="generateConfig"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">负载均衡策略</label>
                <select
                  v-model="config.loadBalance.method"
                  class="w-full px-3 py-2 border rounded-md"
                  @change="generateConfig"
                >
                  <option value="round_robin">轮询 (round_robin)</option>
                  <option value="least_conn">最少连接 (least_conn)</option>
                  <option value="ip_hash">IP哈希 (ip_hash)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 生成的配置 -->
      <div class="space-y-6">
        <div class="bg-card p-6 rounded-lg border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <FileText class="w-5 h-5 text-primary" />
              生成的配置
            </h2>
            <div class="flex gap-2">
              <button
                @click="copyConfig"
                class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                复制配置
              </button>
              <button
                @click="downloadConfig"
                class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                下载文件
              </button>
            </div>
          </div>

          <div class="relative">
            <pre class="bg-muted p-4 rounded-md overflow-x-auto text-sm"><code>{{ generatedConfig }}</code></pre>
            <div
              v-if="copySuccess"
              class="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-md text-sm"
            >
              已复制！
            </div>
          </div>
        </div>

        <!-- 配置说明 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4">配置说明</h2>
          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong>基本配置：</strong>设置服务器名称、监听端口和网站根目录
            </div>
            <div>
              <strong>反向代理：</strong>将请求转发到后端服务，适用于API网关或微服务架构
            </div>
            <div>
              <strong>SSL/TLS：</strong>启用HTTPS加密，需要提供证书和私钥文件路径
            </div>
            <div>
              <strong>负载均衡：</strong>将请求分发到多个后端服务器，提高可用性和性能
            </div>
          </div>
        </div>

        <!-- 常用配置模板 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4">常用配置模板</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="loadTemplate('static')"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
            >
              静态网站
            </button>
            <button
              @click="loadTemplate('proxy')"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
            >
              反向代理
            </button>
            <button
              @click="loadTemplate('wordpress')"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
            >
              WordPress
            </button>
            <button
              @click="loadTemplate('nodejs')"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
            >
              Node.js应用
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Server, Globe, Shield, Network, FileText } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: 'Nginx配置生成器 - 专业Web服务器配置文件生成工具 | Util工具箱',
  description: '专业的Nginx配置生成工具，根据需求快速生成Nginx配置文件，支持反向代理、负载均衡、SSL证书、虚拟主机等配置。可视化操作，一键生成标准配置。',
  keywords: 'Nginx配置生成器,Nginx配置,Web服务器,反向代理,负载均衡,SSL配置,虚拟主机,配置文件,服务器配置,Nginx教程',
  author: 'Util工具箱',
  ogTitle: 'Nginx配置生成器 - 专业Web服务器配置工具',
  ogDescription: '快速生成Nginx配置文件，支持反向代理、负载均衡、SSL等。可视化操作，一键生成标准配置，提升运维效率。',
  ogImage: 'https://util.cn/images/tools/nginx-config-generator.png',
  ogUrl: 'https://util.cn/tools/nginx-config-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Nginx配置生成器 - 反向代理和负载均衡配置',
  twitterDescription: '专业Nginx配置生成工具，支持反向代理、负载均衡、SSL配置，快速生成标准配置文件。',
  twitterImage: 'https://util.cn/images/tools/nginx-config-generator.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Nginx配置生成器',
            description: '专业的Nginx配置生成工具，支持反向代理、负载均衡、SSL等配置',
            url: 'https://util.cn/tools/nginx-config-generator',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '反向代理配置',
              '负载均衡设置',
              'SSL证书配置',
              '虚拟主机管理',
              '安全配置优化',
              '缓存策略设置',
              '日志记录配置',
              '性能优化建议'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Nginx配置生成器',
                item: 'https://util.cn/tools/nginx-config-generator'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '什么是Nginx？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': 'Nginx是一个高性能的HTTP和反向代理Web服务器，同时也提供了IMAP/POP3/SMTP服务。以高性能、低内存占用、配置简单而闻名，广泛用于Web服务、API网关、负载均衡等场景。'
                }
              },
              {
                '@type': 'Question',
                name: 'Nginx有哪些常用配置？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': 'Nginx常用配置：1）反向代理到后端服务；2）负载均衡多个后端；3）SSL/TLS加密；4）虚拟主机配置；5）缓存优化；6）访问控制；7）日志记录；8）安全防护等。'
                }
              },
              {
                '@type': 'Question',
                name: '如何配置负载均衡？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  'text': 'Nginx负载均衡配置：使用upstream模块定义后端服务器组，通过proxy_pass转发请求。支持轮询（round_robin）、IP哈希（ip_hash）、最少连接（least_conn）等负载均衡算法。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'nginx-config-generator')
const category = categories.find(c => c.id === 'network')

const config = ref({
  serverName: 'example.com',
  port: 80,
  root: '/var/www/html',
  proxy: {
    enabled: false,
    backend: 'http://localhost:3000'
  },
  ssl: {
    enabled: false,
    certPath: '/etc/ssl/certs/cert.pem',
    keyPath: '/etc/ssl/private/key.pem'
  },
  loadBalance: {
    enabled: false,
    backends: '',
    method: 'round_robin'
  }
})

const generatedConfig = ref('')
const copySuccess = ref(false)

const generateConfig = () => {
  let nginxConfig = ''

  // SSL配置需要监听443端口
  if (config.value.ssl.enabled) {
    nginxConfig += `server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${config.value.serverName};`

    nginxConfig += `

    # SSL配置
    ssl_certificate ${config.value.ssl.certPath};
    ssl_certificate_key ${config.value.ssl.keyPath};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;`

    // HTTP重定向到HTTPS
    nginxConfig += `
}

# HTTP重定向到HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${config.value.serverName};
    return 301 https://$server_name$request_uri;
}
`
  } else {
    // 普通HTTP配置
    nginxConfig += `server {
    listen ${config.value.port};
    listen [::]:${config.value.port};
    server_name ${config.value.serverName};`
  }

  // 根目录配置
  if (config.value.root && !config.value.proxy.enabled && !config.value.loadBalance.enabled) {
    nginxConfig += `

    # 网站根目录
    root ${config.value.root};
    index index.html index.htm index.php;`
  }

  // 负载均衡配置
  if (config.value.loadBalance.enabled && config.value.loadBalance.backends) {
    const backends = config.value.loadBalance.backends.split('\n').filter(b => b.trim())
    if (backends.length > 0) {
      nginxConfig += `

    # 负载均衡后端服务器
    upstream backend {
        ${config.value.loadBalance.method === 'least_conn' ? 'least_conn;' : ''}
        ${config.value.loadBalance.method === 'ip_hash' ? 'ip_hash;' : ''}

        ${backends.map(backend => `server ${backend.trim()};`).join('\n        ')}
    }`
    }
  }

  // 位置配置
  nginxConfig += `

    # 主要位置配置
    location / {`

  if (config.value.proxy.enabled) {
    nginxConfig += `
        # 反向代理
        proxy_pass ${config.value.proxy.backend};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;`
  } else if (config.value.loadBalance.enabled) {
    nginxConfig += `
        # 负载均衡
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;`
  } else if (config.value.root) {
    nginxConfig += `
        try_files $uri $uri/ =404;`
  }

  nginxConfig += `
    }`

  // 静态文件缓存
  nginxConfig += `

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }`

  // 安全头
  nginxConfig += `

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;`

  nginxConfig += `
}`

  generatedConfig.value = nginxConfig
}

const copyConfig = async () => {
  try {
    await navigator.clipboard.writeText(generatedConfig.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const downloadConfig = () => {
  const blob = new Blob([generatedConfig.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nginx.conf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const loadTemplate = (type) => {
  switch (type) {
    case 'static':
      config.value = {
        serverName: 'example.com',
        port: 80,
        root: '/var/www/html',
        proxy: { enabled: false, backend: 'http://localhost:3000' },
        ssl: { enabled: false, certPath: '', keyPath: '' },
        loadBalance: { enabled: false, backends: '', method: 'round_robin' }
      }
      break
    case 'proxy':
      config.value = {
        serverName: 'api.example.com',
        port: 80,
        root: '',
        proxy: { enabled: true, backend: 'http://localhost:3000' },
        ssl: { enabled: false, certPath: '', keyPath: '' },
        loadBalance: { enabled: false, backends: '', method: 'round_robin' }
      }
      break
    case 'wordpress':
      config.value = {
        serverName: 'blog.example.com',
        port: 80,
        root: '/var/www/wordpress',
        proxy: { enabled: false, backend: 'http://localhost:3000' },
        ssl: { enabled: false, certPath: '', keyPath: '' },
        loadBalance: { enabled: false, backends: '', method: 'round_robin' }
      }
      break
    case 'nodejs':
      config.value = {
        serverName: 'app.example.com',
        port: 80,
        root: '',
        proxy: { enabled: true, backend: 'http://localhost:3000' },
        ssl: { enabled: false, certPath: '', keyPath: '' },
        loadBalance: { enabled: false, backends: '', method: 'round_robin' }
      }
      break
  }
  generateConfig()
}

onMounted(() => {
  // 添加到最近使用
  if (tool) {
    addRecentTool(tool.id)
  }

  generateConfig()
})
</script>