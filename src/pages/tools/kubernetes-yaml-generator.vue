<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Kubernetes YAML生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化生成K8s部署配置，支持Deployment、Service、ConfigMap等</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6 mb-6">
      <!-- 配置面板 -->
      <div class="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">配置</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">应用名称</label>
            <input v-model="config.name" @input="generateYAML" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="my-app">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">命名空间</label>
            <input v-model="config.namespace" @input="generateYAML" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="default">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">镜像</label>
            <input v-model="config.image" @input="generateYAML" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="nginx:latest">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium mb-1">副本数</label>
              <input v-model.number="config.replicas" @input="generateYAML" type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">容器端口</label>
              <input v-model.number="config.containerPort" @input="generateYAML" type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark-gray-700 text-sm">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">资源限制</label>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="config.memoryRequest" @input="generateYAML" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs" placeholder="内存请求">
              <input v-model="config.memoryLimit" @input="generateYAML" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs" placeholder="内存限制">
              <input v-model="config.cpuRequest" @input="generateYAML" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs" placeholder="CPU请求">
              <input v-model="config.cpuLimit" @input="generateYAML" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs" placeholder="CPU限制">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Service类型</label>
            <select v-model="config.serviceType" @input="generateYAML" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <option value="ClusterIP">ClusterIP</option>
              <option value="NodePort">NodePort</option>
              <option value="LoadBalancer">LoadBalancer</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">健康检查</label>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="config.livenessPath" @input="generateYAML" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs" placeholder="/health">
              <input v-model.number="config.livenessPort" @input="generateYAML" type="number" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs" placeholder="端口">
            </div>
          </div>

          <!-- 资源类型 -->
          <div>
            <label class="block text-sm font-medium mb-2">生成资源</label>
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="config.generateDeployment" @change="generateYAML" class="rounded">
                <span>Deployment</span>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="config.generateService" @change="generateYAML" class="rounded">
                <span>Service</span>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="config.generateConfigMap" @change="generateYAML" class="rounded">
                <span>ConfigMap</span>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="config.generateIngress" @change="generateYAML" class="rounded">
                <span>Ingress</span>
              </label>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="loadTemplate('web')" class="flex-1 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">Web应用</button>
            <button @click="loadTemplate('api')" class="flex-1 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">API服务</button>
          </div>
        </div>
      </div>

      <!-- YAML输出 -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">生成的YAML</h2>
          <div class="flex gap-2">
            <button @click="copyYAML" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!generatedYAML">复制</button>
            <button @click="downloadYAML" class="px-3 py-1 text-sm bg-blue-500 text-white rounded" :disabled="!generatedYAML">下载</button>
          </div>
        </div>
        <textarea
          v-model="generatedYAML"
          class="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 资源说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">K8s资源说明</h2>
      <div class="grid md:grid-cols-4 gap-4 text-sm">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 class="font-medium mb-2 text-blue-700 dark:text-blue-400">Deployment</h3>
          <p class="text-gray-600 dark:text-gray-400">管理无状态应用，声明期望状态，自动进行滚动更新。</p>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 class="font-medium mb-2 text-green-700 dark:text-green-400">Service</h3>
          <p class="text-gray-600 dark:text-gray-400">为Pod提供稳定的网络端点，支持ClusterIP、NodePort、LoadBalancer。</p>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h3 class="font-medium mb-2 text-orange-700 dark:text-orange-400">ConfigMap</h3>
          <p class="text-gray-600 dark:text-gray-400">存储配置数据，可与Pod解耦，支持环境变量和卷挂载。</p>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 class="font-medium mb-2 text-purple-700 dark:text-purple-400">Ingress</h3>
          <p class="text-gray-600 dark:text-gray-400">HTTP/HTTPS路由规则，将外部流量路由到Service，支持域名和TLS。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

useHead({
  title: 'Kubernetes YAML生成器 - K8s配置生成',
  meta: [{ name: 'description', content: '在线Kubernetes YAML生成工具，可视化配置Deployment、Service、ConfigMap、Ingress等资源。' }],
  keywords: ['Kubernetes', 'K8s', 'YAML生成', 'Deployment', 'Service', 'Ingress']
})

const config = ref({
  name: 'my-app',
  namespace: 'default',
  image: 'nginx:latest',
  replicas: 3,
  containerPort: 80,
  serviceType: 'ClusterIP',
  memoryRequest: '128Mi',
  memoryLimit: '512Mi',
  cpuRequest: '100m',
  cpuLimit: '500m',
  livenessPath: '/health',
  livenessPort: 80,
  generateDeployment: true,
  generateService: true,
  generateConfigMap: false,
  generateIngress: false
})

const generatedYAML = ref('')

function generateYAML() {
  const yamls: string[] = []

  // Deployment
  if (config.value.generateDeployment) {
    let deployment = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${config.value.name}
  namespace: ${config.value.namespace}
spec:
  replicas: ${config.value.replicas}
  selector:
    matchLabels:
      app: ${config.value.name}
  template:
    metadata:
      labels:
        app: ${config.value.name}
    spec:
      containers:
      - name: ${config.value.name}
        image: ${config.value.image}
        ports:
        - containerPort: ${config.value.containerPort}`

    // 资源限制
    if (config.value.memoryRequest || config.value.memoryLimit || config.value.cpuRequest || config.value.cpuLimit) {
      deployment += `\n        resources:`
      if (config.value.memoryRequest || config.value.cpuRequest) {
        deployment += `\n          requests:`
        if (config.value.memoryRequest) deployment += `\n            memory: ${config.value.memoryRequest}`
        if (config.value.cpuRequest) deployment += `\n            cpu: ${config.value.cpuRequest}`
      }
      if (config.value.memoryLimit || config.value.cpuLimit) {
        deployment += `\n          limits:`
        if (config.value.memoryLimit) deployment += `\n            memory: ${config.value.memoryLimit}`
        if (config.value.cpuLimit) deployment += `\n            cpu: ${config.value.cpuLimit}`
      }
    }

    // 健康检查
    if (config.value.livenessPath) {
      deployment += `\n        livenessProbe:
          httpGet:
            path: ${config.value.livenessPath}
            port: ${config.value.livenessPort || config.value.containerPort}
          initialDelaySeconds: 30
          periodSeconds: 10`
    }

    deployment += '\n'
    yamls.push(deployment)
  }

  // Service
  if (config.value.generateService) {
    const service = `apiVersion: v1
kind: Service
metadata:
  name: ${config.value.name}
  namespace: ${config.value.namespace}
spec:
  type: ${config.value.serviceType}
  selector:
    app: ${config.value.name}
  ports:
  - port: ${config.value.containerPort}
    targetPort: ${config.value.containerPort}
    protocol: TCP
`
    yamls.push(service)
  }

  // ConfigMap
  if (config.value.generateConfigMap) {
    const configMap = `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${config.value.name}-config
  namespace: ${config.value.namespace}
data:
  ENV: "production"
  LOG_LEVEL: "info"
`
    yamls.push(configMap)
  }

  // Ingress
  if (config.value.generateIngress) {
    const ingress = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${config.value.name}
  namespace: ${config.value.namespace}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: ${config.value.name}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${config.value.name}
            port:
              number: ${config.value.containerPort}
`
    yamls.push(ingress)
  }

  generatedYAML.value = yamls.join('---\n')
}

function loadTemplate(type: string) {
  switch (type) {
    case 'web':
      config.value = {
        ...config.value,
        name: 'web-app',
        image: 'nginx:alpine',
        replicas: 3,
        containerPort: 80,
        serviceType: 'ClusterIP',
        generateDeployment: true,
        generateService: true,
        generateConfigMap: false,
        generateIngress: true
      }
      break
    case 'api':
      config.value = {
        ...config.value,
        name: 'api-server',
        image: 'node:18-alpine',
        replicas: 2,
        containerPort: 3000,
        serviceType: 'LoadBalancer',
        generateDeployment: true,
        generateService: true,
        generateConfigMap: true,
        generateIngress: false
      }
      break
  }
  generateYAML()
}

async function copyYAML() {
  try {
    await navigator.clipboard.writeText(generatedYAML.value)
    alert('已复制')
  } catch {}
}

function downloadYAML() {
  const blob = new Blob([generatedYAML.value], { type: 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${config.value.name}-k8s.yaml`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

onMounted(() => {
  generateYAML()
})
</script>
