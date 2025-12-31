<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Dockerfile生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化生成Dockerfile，支持多种语言和框架</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- 配置面板 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">配置</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">基础镜像</label>
            <select v-model="config.from" @change="generateDockerfile" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <option value="node:18-alpine">Node.js 18 (Alpine)</option>
              <option value="node:20-alpine">Node.js 20 (Alpine)</option>
              <option value="python:3.11-slim">Python 3.11</option>
              <option value="python:3.12-slim">Python 3.12</option>
              <option value="openjdk:17-slim">Java 17 (OpenJDK)</option>
              <option value="openjdk:21-slim">Java 21 (OpenJDK)</option>
              <option value="golang:1.21-alpine">Go 1.21 (Alpine)</option>
              <option value="rust:1.75-slim">Rust 1.75</option>
              <option value="ruby:3.2-slim">Ruby 3.2</option>
              <option value="php:8.2-apache">PHP 8.2 (Apache)</option>
              <option value="php:8.2-fpm">PHP 8.2 (FPM)</option>
              <option value="nginx:alpine">Nginx (Alpine)</option>
              <option value="ubuntu:22.04">Ubuntu 22.04</option>
              <option value="alpine:3.19">Alpine 3.19</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">工作目录</label>
            <input v-model="config.workdir" @input="generateDockerfile" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="/app">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">端口</label>
            <input v-model.number="config.port" @input="generateDockerfile" type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="3000">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">启动命令</label>
            <input v-model="config.cmd" @input="generateDockerfile" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="npm start">
          </div>

          <!-- 选项 -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="config.useNpmInstall" @change="generateDockerfile" class="rounded">
              <span>npm install (Node.js)</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="config.usePipInstall" @change="generateDockerfile" class="rounded">
              <span>pip install (Python)</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="config.multiStage" @change="generateDockerfile" class="rounded">
              <span>多阶段构建</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="config.useNonRoot" @change="generateDockerfile" class="rounded">
              <span>非root用户</span>
            </label>
          </div>

          <!-- 环境变量 -->
          <div>
            <label class="block text-sm font-medium mb-1">环境变量</label>
            <textarea v-model="config.env" @input="generateDockerfile" class="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 resize-none font-mono text-sm" placeholder="NODE_ENV=production&#10;PORT=3000"></textarea>
          </div>
        </div>
      </div>

      <!-- Dockerfile预览 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Dockerfile</h2>
          <div class="flex gap-2">
            <button @click="loadTemplate('node')" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">Node.js</button>
            <button @click="loadTemplate('python')" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">Python</button>
            <button @click="copyDockerfile" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!dockerfile">复制</button>
          </div>
        </div>
        <textarea
          v-model="dockerfile"
          class="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 最佳实践 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Dockerfile最佳实践</h2>
      <div class="grid md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">镜像优化</h3>
          <ul class="space-y-1">
            <li>• 使用Alpine镜像减小体积</li>
            <li>• 多阶段构建分离编译和运行</li>
            <li>• 合并RUN命令减少层数</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">安全性</h3>
          <ul class="space-y-1">
            <li>• 使用非root用户运行</li>
            <li>• 最小化安装的包</li>
            <li>• 定期更新基础镜像</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">性能</h3>
          <ul class="space-y-1">
            <li>• 利用缓存层(先复制package.json)</li>
            <li>• 使用.dockerignore</li>
            <li>• 并行构建(多阶段)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  title: 'Dockerfile生成器 - 在线Docker配置生成',
  meta: [{ name: 'description', content: '在线Dockerfile生成工具，可视化配置Docker镜像，支持Node.js、Python、Java等多种语言。' }],
  keywords: ['Dockerfile', 'Docker生成', '容器配置', 'Docker镜像', '多阶段构建']
})

const config = ref({
  from: 'node:18-alpine',
  workdir: '/app',
  port: 3000,
  cmd: 'npm start',
  useNpmInstall: true,
  usePipInstall: false,
  multiStage: false,
  useNonRoot: true,
  env: 'NODE_ENV=production\nPORT=3000'
})

const dockerfile = ref('')

function generateDockerfile() {
  let result = ''

  if (config.value.multiStage) {
    result += `# Build stage\nFROM ${config.value.from} AS builder\n\n`
    result += `WORKDIR ${config.value.workdir}\n\n`
    result += `COPY package*.json ./\n`
    if (config.value.useNpmInstall) result += `RUN npm ci\n`
    result += `COPY . .\n`
    if (config.value.useNpmInstall) result += `RUN npm run build\n\n`
    result += `# Production stage\nFROM ${config.value.from.replace('alpine', 'slim') || config.value.from}\n\n`
    result += `WORKDIR ${config.value.workdir}\n\n`
    result += `COPY --from=builder ${config.value.workdir} .\n\n`
  } else {
    result += `FROM ${config.value.from}\n\n`
    result += `WORKDIR ${config.value.workdir}\n\n`
    result += `COPY package*.json ./\n`
    if (config.value.useNpmInstall) result += `RUN npm ci --only=production\n`
    if (config.value.usePipInstall) result += `RUN pip install --no-cache-dir -r requirements.txt\n`
    result += `COPY . .\n\n`
  }

  // 环境变量
  if (config.value.env) {
    const envs = config.value.env.split('\n').filter(e => e.trim())
    for (const env of envs) {
      result += `ENV ${env}\n`
    }
    result += '\n'
  }

  // 端口
  if (config.value.port) {
    result += `EXPOSE ${config.value.port}\n\n`
  }

  // 非root用户
  if (config.value.useNonRoot) {
    result += `RUN addgroup -g 1001 -S nodejs\n`
    result += `RUN adduser -S nodejs -u 1001\n`
    result += `USER nodejs\n\n`
  }

  // 启动命令
  if (config.value.cmd) {
    result += `CMD ["${config.value.cmd}"]\n`
  }

  dockerfile.value = result
}

function loadTemplate(type: string) {
  switch (type) {
    case 'node':
      config.value = {
        from: 'node:18-alpine',
        workdir: '/app',
        port: 3000,
        cmd: 'npm start',
        useNpmInstall: true,
        usePipInstall: false,
        multiStage: false,
        useNonRoot: true,
        env: 'NODE_ENV=production'
      }
      break
    case 'python':
      config.value = {
        from: 'python:3.11-slim',
        workdir: '/app',
        port: 8000,
        cmd: 'python app.py',
        useNpmInstall: false,
        usePipInstall: true,
        multiStage: false,
        useNonRoot: true,
        env: 'PYTHONUNBUFFERED=1'
      }
      break
  }
  generateDockerfile()
}

async function copyDockerfile() {
  try {
    await navigator.clipboard.writeText(dockerfile.value)
    alert('已复制')
  } catch {}
}

onMounted(() => {
  generateDockerfile()
})
</script>
