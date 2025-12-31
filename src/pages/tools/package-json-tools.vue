<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">package.json工具</h1>
      <p class="text-gray-600 dark:text-gray-400">格式化、验证和分析package.json文件</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex flex-wrap gap-4 mb-4">
        <button @click="mode = 'validate'" :class="['px-4 py-2 rounded', mode === 'validate' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">验证</button>
        <button @click="mode = 'format'" :class="['px-4 py-2 rounded', mode === 'format' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">格式化</button>
        <button @click="mode = 'analyze'" :class="['px-4 py-2 rounded', mode === 'analyze' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">分析</button>
        <button @click="mode = 'generate'" :class="['px-4 py-2 rounded', mode === 'generate' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">生成</button>
      </div>
    </div>

    <!-- 验证/格式化模式 -->
    <div v-if="mode === 'validate' || mode === 'format'" class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">输入package.json</h2>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
        </div>
        <textarea
          v-model="inputJSON"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴package.json内容..."
          @input="process"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">{{ mode === 'validate' ? '验证结果' : '格式化结果' }}</h2>
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!outputResult">复制</button>
        </div>
        <div v-if="mode === 'validate'" class="mb-4">
          <div v-if="isValid" class="p-3 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400">
            ✓ JSON格式有效
          </div>
          <div v-else-if="errorMessage" class="p-3 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-400">
            ✗ {{ errorMessage }}
          </div>
        </div>
        <textarea
          v-model="outputResult"
          readonly
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        ></textarea>
      </div>
    </div>

    <!-- 分析模式 -->
    <div v-if="mode === 'analyze'" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">package.json分析</h2>
      <div class="mb-4">
        <textarea
          v-model="inputJSON"
          class="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴package.json..."
          @input="analyze"
        ></textarea>
      </div>

      <div v-if="analysis" class="grid md:grid-cols-3 gap-4">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ analysis.dependencies || 0 }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">生产依赖</div>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ analysis.devDependencies || 0 }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">开发依赖</div>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ analysis.scripts || 0 }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">脚本数量</div>
        </div>
      </div>

      <div v-if="analysis" class="mt-6 grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium mb-2">项目信息</h3>
          <div class="text-sm space-y-1">
            <div v-if="analysis.name" class="flex justify-between"><span>名称:</span><span>{{ analysis.name }}</span></div>
            <div v-if="analysis.version" class="flex justify-between"><span>版本:</span><span>{{ analysis.version }}</span></div>
            <div v-if="analysis.license" class="flex justify-between"><span>许可证:</span><span>{{ analysis.license }}</span></div>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2">脚本列表</h3>
          <div class="text-sm space-y-1 max-h-40 overflow-y-auto">
            <div v-for="(script, name) in analysis.scriptList" :key="name" class="font-mono">
              <span class="text-blue-600">{{ name }}</span>: {{ script }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 生成模式 -->
    <div v-if="mode === 'generate'" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">生成package.json</h2>

      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1">项目名称</label>
          <input v-model="genConfig.name" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="my-project">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">版本</label>
          <input v-model="genConfig.version" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="1.0.0">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">描述</label>
          <input v-model="genConfig.description" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="项目描述">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">许可证</label>
          <select v-model="genConfig.license" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            <option value="MIT">MIT</option>
            <option value="Apache-2.0">Apache-2.0</option>
            <option value="GPL-3.0">GPL-3.0</option>
            <option value="BSD-3-Clause">BSD-3-Clause</option>
            <option value="ISC">ISC</option>
          </select>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">框架/模板</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="tpl in templates" :key="tpl.id" @click="applyTemplate(tpl.id)" class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded">{{ tpl.name }}</button>
        </div>
      </div>

      <button @click="generatePackage" class="px-4 py-2 bg-blue-500 text-white rounded">生成package.json</button>

      <div v-if="generatedPackage" class="mt-4">
        <textarea
          v-model="generatedPackage"
          readonly
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        ></textarea>
        <button @click="copyGenerated" class="mt-2 px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
      </div>
    </div>

    <!-- 常用字段说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常用字段说明</h2>
      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <div class="space-y-2">
          <div class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><code class="text-blue-600">name</code><span>包名称</span></div>
          <div class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><code class="text-blue-600">version</code><span>版本号</span></div>
          <div class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><code class="text-blue-600">description</code><span>描述</span></div>
          <div class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><code class="text-blue-600">main</code><span>入口文件</span></div>
        </div>
        <div class="space-y-2">
          <div class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><code class="text-blue-600">scripts</code><span>npm脚本</span></div>
          <div class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><code class="text-blue-600">dependencies</code><span>生产依赖</span></div>
          <div class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><code class="text-blue-600">devDependencies</code><span>开发依赖</span></div>
          <div class="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"><code class="text-blue-600">keywords</code><span>关键词</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'package.json工具 - 格式化验证分析生成',
  meta: [{ name: 'description', content: '在线package.json工具，支持JSON格式化、依赖分析、脚本验证和模板生成。' }],
  keywords: ['package.json', 'npm工具', '依赖分析', 'JSON格式化', 'npm脚本']
})

const mode = ref('validate')
const inputJSON = ref('')
const outputResult = ref('')
const isValid = ref(false)
const errorMessage = ref('')
const analysis = ref<any>(null)
const generatedPackage = ref('')

const genConfig = ref({
  name: 'my-project',
  version: '1.0.0',
  description: '',
  license: 'MIT',
  type: 'commonjs'
})

const templates = [
  { id: 'node', name: 'Node.js' },
  { id: 'vue', name: 'Vue 3' },
  { id: 'react', name: 'React' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'next', name: 'Next.js' },
  { id: 'nuxt', name: 'Nuxt' }
]

const samplePackage = {
  name: 'my-app',
  version: '1.0.0',
  description: 'My awesome app',
  main: 'index.js',
  scripts: {
    start: 'node index.js',
    test: 'echo "Error: no test specified" && exit 1'
  },
  dependencies: {
    express: '^4.18.0'
  },
  devDependencies: {
    nodemon: '^3.0.0'
  }
}

function loadSample() {
  inputJSON.value = JSON.stringify(samplePackage, null, 2)
  process()
}

function process() {
  if (!inputJSON.value) {
    outputResult.value = ''
    isValid.value = false
    errorMessage.value = ''
    return
  }

  try {
    const parsed = JSON.parse(inputJSON.value)
    isValid.value = true
    errorMessage.value = ''

    if (mode.value === 'format') {
      outputResult.value = JSON.stringify(parsed, Object.keys(parsed).sort(), 2)
    } else {
      outputResult.value = JSON.stringify(parsed, null, 2)
    }
  } catch (e: any) {
    isValid.value = false
    errorMessage.value = (e as Error).message
    outputResult.value = ''
  }
}

function analyze() {
  if (!inputJSON.value) {
    analysis.value = null
    return
  }

  try {
    const parsed = JSON.parse(inputJSON.value)
    analysis.value = {
      name: parsed.name,
      version: parsed.version,
      license: parsed.license,
      dependencies: parsed.dependencies ? Object.keys(parsed.dependencies).length : 0,
      devDependencies: parsed.devDependencies ? Object.keys(parsed.devDependencies).length : 0,
      scripts: parsed.scripts ? Object.keys(parsed.scripts).length : 0,
      scriptList: parsed.scripts || {}
    }
  } catch {
    analysis.value = null
  }
}

function applyTemplate(tpl: string) {
  switch (tpl) {
    case 'node':
      genConfig.value.main = 'index.js'
      break
    case 'vue':
      genConfig.value.type = 'module'
      break
    case 'typescript':
      genConfig.value.main = 'dist/index.js'
      genConfig.value.types = 'dist/index.d.ts'
      break
  }
}

function generatePackage() {
  const pkg: any = {
    name: genConfig.value.name,
    version: genConfig.value.version,
    description: genConfig.value.description,
    license: genConfig.value.license
  }

  if (genConfig.value.main) pkg.main = genConfig.value.main
  if (genConfig.value.type !== 'commonjs') pkg.type = genConfig.value.type

  pkg.scripts = {
    start: 'node index.js',
    test: 'echo "Error: no test specified" && exit 1'
  }

  generatedPackage.value = JSON.stringify(pkg, null, 2)
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputResult.value)
    alert('已复制')
  } catch {}
}

async function copyGenerated() {
  try {
    await navigator.clipboard.writeText(generatedPackage.value)
    alert('已复制')
  } catch {}
}
</script>
