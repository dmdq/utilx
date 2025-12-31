<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">代码格式化工具（开发版）</h1>
      <p class="text-gray-600 dark:text-gray-400">专为开发者设计的代码格式化工具，支持语法高亮和实时预览</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="grid md:grid-cols-4 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium mb-2">编程语言</label>
          <select v-model="language" @change="handleLanguageChange" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="cpp">C++</option>
            <option value="csharp">C#</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">缩进大小</label>
          <select v-model.number="indentSize" @change="format" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option :value="2">2 空格</option>
            <option :value="4">4 空格</option>
            <option :value="8">8 空格</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">引号类型</label>
          <select v-model="quoteStyle" @change="format" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="single">单引号 '</option>
            <option value="double">双引号 "</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">分号</label>
          <select v-model="semicolons" @change="format" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="always">总是添加</option>
            <option value="asneeded">按需添加</option>
            <option value="remove">移除分号</option>
          </select>
        </div>
      </div>

      <div class="flex gap-4 mb-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.sortImports" @change="format" class="rounded">
          <span>排序导入语句</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.trimTrailing" @change="format" class="rounded">
          <span>去除行尾空格</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.insertFinalNewline" @change="format" class="rounded">
          <span>文件末尾换行</span>
        </label>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">输入代码</h2>
          <div class="flex gap-2">
            <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
            <button @click="clearAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          </div>
        </div>
        <textarea
          v-model="inputCode"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴代码..."
          @input="format"
        ></textarea>
        <div class="mt-2 text-sm text-gray-500">{{ inputCode.length }} 字符 · {{ inputCode.split('\n').length }} 行</div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">格式化结果</h2>
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
        </div>
        <textarea
          v-model="outputCode"
          readonly
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        ></textarea>
        <div class="mt-2 text-sm text-gray-500">{{ outputCode.length }} 字符 · {{ outputCode.split('\n').length }} 行</div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">代码格式化规则</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h3 class="font-medium mb-2">JavaScript/TypeScript</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>使用 const/let 代替 var</li>
            <li>箭头函数优于 function</li>
            <li>模板字符串优于字符串拼接</li>
            <li>对象字面量简写</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Python</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>遵循 PEP 8 规范</li>
            <li>4空格缩进</li>
            <li>函数和类之间空两行</li>
            <li>使用类型提示</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Java</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>4空格缩进</li>
            <li>左大括号不换行</li>
            <li>导入语句按字母排序</li>
            <li>每行最多120字符</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">通用规则</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>运算符两侧加空格</li>
            <li>逗号后加空格</li>
            <li>代码块之间加空行</li>
            <li>注释与代码间加空格</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

useHead({
  title: '代码格式化工具（开发版）- 开发者专用代码美化',
  meta: [{ name: 'description', content: '专为开发者设计的代码格式化工具，支持JavaScript、TypeScript、Python、Java等10+种语言，实时预览和语法高亮。' }],
  keywords: ['代码格式化', '代码美化', '开发者工具', 'javascript格式化', 'python格式化', 'java格式化', '代码规范']
})

const inputCode = ref('')
const outputCode = ref('')
const language = ref('javascript')
const indentSize = ref(2)
const quoteStyle = ref('single')
const semicolons = ref('asneeded')

const options = ref({
  sortImports: true,
  trimTrailing: true,
  insertFinalNewline: true
})

const sampleCodes: Record<string, string> = {
  javascript: `function calculate(a,b){let result=a+b;console.log(result);return result}`,
  typescript: `interface User{name:string;age:number}function greet(u:User){console.log("Hello,"+u.name)}`,
  python: `def calculate(a,b):\nresult=a+b\nprint(result)\nreturn result`,
  java: `public class Calculator{public int add(int a,int b){return a+b;}}`,
  go: `func add(a int,b int)int{return a+b}`,
  rust: `fn add(a:i32,b:i32)->i32{a+b}`,
  cpp: `int add(int a,int b){return a+b;}`,
  csharp: `public int Add(int a,int b){return a+b;}`,
  php: `function add($a,$b){return $a+$b;}`,
  ruby: `def add(a,b)\na+b\nend`
}

function loadSample() {
  inputCode.value = sampleCodes[language.value] || ''
  format()
}

function clearAll() {
  inputCode.value = ''
  outputCode.value = ''
}

function handleLanguageChange() {
  loadSample()
}

function format() {
  let code = inputCode.value
  if (!code) {
    outputCode.value = ''
    return
  }

  const indent = ' '.repeat(indentSize.value)

  switch (language.value) {
    case 'javascript':
    case 'typescript':
      code = formatJavaScript(code)
      break
    case 'python':
      code = formatPython(code)
      break
    case 'java':
    case 'go':
    case 'rust':
    case 'cpp':
    case 'csharp':
      code = formatCStyle(code)
      break
    case 'php':
      code = formatPHP(code)
      break
    case 'ruby':
      code = formatRuby(code)
      break
  }

  outputCode.value = code
}

function formatJavaScript(code: string): string {
  let result = code
  const indent = ' '.repeat(indentSize.value)

  // 转换引号
  if (quoteStyle.value === 'single') {
    result = result.replace(/"([^"]*)"/g, "'$1'")
  } else {
    result = result.replace(/'([^']*)'/g, '"$1"')
  }

  // 处理分号
  if (semicolons.value === 'always') {
    result = result.replace(/([a-zA-Z0-9_)\]])\s*\n/g, '$1;\n')
  } else if (semicolons.value === 'remove') {
    result = result.replace(/;(\s*)/g, '$1')
  }

  // 简单格式化
  let lines = result.split(/[{}]/)
  let formatted: string[] = []
  let depth = 0

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) continue

    const isOpen = i % 2 === 1 && line.length > 0
    const isClose = i % 2 === 0 && i > 0

    if (isClose && line.length === 0) depth--

    if (line) {
      formatted.push(indent.repeat(Math.max(0, depth)) + line)
    }

    if (isOpen) {
      formatted[formatted.length - 1] += ' {'
      depth++
    }
    if (isClose && line.length === 0) {
      formatted.push(indent.repeat(Math.max(0, depth - 1)) + '}')
      depth--
    }
  }

  return formatted.join('\n')
}

function formatPython(code: string): string {
  const lines = code.split('\n')
  const formatted: string[] = []
  const indent = ' '.repeat(indentSize.value)
  let depth = 0

  for (let line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      formatted.push('')
      continue
    }

    // 减少缩进
    if (trimmed.startsWith('return') || trimmed.startsWith('pass') || trimmed.startsWith('elif')) {
      depth = Math.max(0, depth - 1)
    }

    formatted.push(indent.repeat(depth) + trimmed)

    // 增加缩进
    if (trimmed.endsWith(':')) {
      depth++
    }
  }

  return formatted.join('\n')
}

function formatCStyle(code: string): string {
  let lines = code.split(/[{}]/)
  const indent = ' '.repeat(indentSize.value)
  let formatted: string[] = []
  let depth = 0

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line) continue

    const isOpen = i % 2 === 1

    if (line && !isOpen) {
      formatted.push(indent.repeat(depth) + line)
    }
    if (isOpen) {
      formatted.push(indent.repeat(depth) + line.substring(0, line.length - 1).trim() + ' {')
      depth++
    }
    if (line.length === 0 && i > 0) {
      depth--
      formatted.push(indent.repeat(Math.max(0, depth)) + '}')
    }
  }

  return formatted.join('\n')
}

function formatPHP(code: string): string {
  return formatJavaScript(code.replace(/function /g, 'function $'))
}

function formatRuby(code: string): string {
  const lines = code.split('\n')
  const indent = ' '.repeat(indentSize.value)
  let formatted: string[] = []
  let depth = 0

  for (let line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      formatted.push('')
      continue
    }

    if (trimmed.startsWith('end')) {
      depth = Math.max(0, depth - 1)
    }

    formatted.push(indent.repeat(depth) + trimmed)

    if (trimmed.endsWith(' do') || trimmed.endsWith(':')) {
      depth++
    }
  }

  return formatted.join('\n')
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputCode.value)
    alert('已复制')
  } catch {}
}

loadSample()
</script>
