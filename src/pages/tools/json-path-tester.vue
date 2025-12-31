<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">JSONPath测试器</h1>
      <p class="text-gray-600 dark:text-gray-400">测试JSONPath表达式，提取JSON数据中的特定字段</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- JSON输入 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">JSON数据</h2>
          <button @click="loadSampleJSON" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
        </div>
        <textarea
          v-model="jsonInput"
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴JSON数据..."
          @input="parseJSON"
        ></textarea>
        <div v-if="parseError" class="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-600 text-sm">
          {{ parseError }}
        </div>
      </div>

      <!-- JSONPath输入 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">JSONPath表达式</h2>
        <input
          v-model="jsonPath"
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm mb-4"
          placeholder="$.store.books[*].title"
          @input="evaluatePath"
        >

        <div class="mb-4">
          <h3 class="text-sm font-medium mb-2">常用表达式</h3>
          <div class="flex flex-wrap gap-2">
            <button @click="setPath('$')" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">$</button>
            <button @click="setPath('$.store.books[*]')" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">$.store.books[*]</button>
            <button @click="setPath('$..title')" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">$..title</button>
            <button @click="setPath('$.store.*')" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">$.store.*</button>
            <button @click="setPath('$..book[?(@.price < 10)]')" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">$..book[?(@.price < 10)]</button>
            <button @click="setPath('$..[?(@.category == \'fiction\')]')" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">过滤表达式</button>
          </div>
        </div>

        <button @click="evaluatePath" class="w-full px-4 py-2 bg-blue-500 text-white rounded">执行查询</button>
      </div>
    </div>

    <!-- 结果 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">查询结果</h2>
        <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!result">复制</button>
      </div>
      <div v-if="result !== null">
        <pre class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">{{ JSON.stringify(result, null, 2) }}</pre>
      </div>
      <div v-else class="p-8 text-center text-gray-400">
        输入JSON和JSONPath表达式后点击"执行查询"
      </div>
    </div>

    <!-- JSONPath语法说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">JSONPath语法参考</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div class="space-y-2">
          <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">$</code> <span class="text-gray-600 dark:text-gray-400">- 根节点</span>
          </div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">.property</code> <span class="text-gray-600 dark:text-gray-400">- 子节点</span>
          </div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">[*]</code> <span class="text-gray-600 dark:text-gray-400">- 通配符</span>
          </div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">..</code> <span class="text-gray-600 dark:text-gray-400">- 深度扫描</span>
          </div>
        </div>
        <div class="space-y-2">
          <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">[start:end]</code> <span class="text-gray-600 dark:text-gray-400">- 数组切片</span>
          </div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">[?(@.expr)]</code> <span class="text-gray-600 dark:text-gray-400">- 过滤表达式</span>
          </div>
          <div class="p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <code class="text-blue-600">@</code> <span class="text-gray-600 dark:text-gray-400">- 当前节点</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'JSONPath测试器 - 在线JSONPath表达式测试',
  meta: [{ name: 'description', content: '在线JSONPath测试工具，测试JSONPath表达式提取JSON数据，支持过滤和深度扫描。' }],
  keywords: ['JSONPath', 'JSON查询', 'JSON提取', 'JSON测试', '数据查询']
})

const jsonInput = ref('')
const jsonPath = ref('$.store.books[*].title')
const parsedJSON = ref<any>(null)
const parseError = ref('')
const result = ref<any>(null)

const sampleJSON = {
  store: {
    book: [
      { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
      { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
      { category: 'fiction', author: 'Herman Melville', title: 'Moby Dick', price: 8.99 }
    ],
    books: [
      { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
      { category: 'fiction', author: 'J. R. R. Tolkien', title: 'The Lord of the Rings', price: 22.99 }
    ],
    bicycle: { color: 'red', price: 19.95 }
  }
}

function loadSampleJSON() {
  jsonInput.value = JSON.stringify(sampleJSON, null, 2)
  parseJSON()
}

function parseJSON() {
  parseError.value = ''
  result.value = null

  if (!jsonInput.value) {
    parsedJSON.value = null
    return
  }

  try {
    parsedJSON.value = JSON.parse(jsonInput.value)
  } catch (e) {
    parseError.value = '无效的JSON: ' + (e as Error).message
    parsedJSON.value = null
  }
}

function evaluatePath() {
  if (!parsedJSON.value || !jsonPath.value) {
    result.value = null
    return
  }

  try {
    result.value = evaluateJSONPath(parsedJSON.value, jsonPath.value)
  } catch (e) {
    result.value = { error: (e as Error).message }
  }
}

function evaluateJSONPath(obj: any, path: string): any {
  // 简化的JSONPath实现
  let current = obj
  const parts = path.replace(/^\$\./, '').split('.')

  for (const part of parts) {
    if (part === '*' || part === '*]') {
      if (Array.isArray(current)) {
        current = current.flat()
      }
    } else if (part.includes('[*]')) {
      const [prop,] = part.split('[*]')
      current = current[prop]
    } else if (part.startsWith('..')) {
      const name = part.substring(2)
      current = deepSearch(current, name)
    } else if (part.includes('[?(@.')) {
      // 过滤表达式（简化处理）
      const match = part.match(/(.+)\[\?\(@\.(\w+)\s*([<>=!]+)\s*(.+?)\)\]\]/)
      if (match) {
        const [, arrayPath, prop, operator, value] = match
        let arr = navigatePath(current, arrayPath)
        if (arr) {
          const numValue = isNaN(Number(value)) ? value.replace(/['"]/g, '') : Number(value)
          current = arr.filter((item: any) => {
            const itemValue = item[prop]
            switch (operator) {
              case '<': return itemValue < numValue
              case '>': return itemValue > numValue
              case '<=': return itemValue <= numValue
              case '>=': return itemValue >= numValue
              case '==': return itemValue == numValue
              case '!=': return itemValue != numValue
              default: return true
            }
          })
        }
      }
    } else if (part.includes('[')) {
      const [prop, indexPart] = part.split('[')
      const index = parseInt(indexPart.replace(']', ''))
      const arr = navigatePath(current, prop)
      current = arr ? arr[index] : undefined
    } else {
      current = navigatePath(current, part)
    }

    if (current === undefined) break
  }

  return current
}

function navigatePath(obj: any, path: string): any {
  if (!obj) return undefined
  return path ? obj[path] : obj
}

function deepSearch(obj: any, key: string): any[] {
  const results: any[] = []

  function search(current: any) {
    if (typeof current !== 'object' || current === null) return

    if (Array.isArray(current)) {
      for (const item of current) {
        if (item && typeof item === 'object' && key in item) {
          results.push(item[key])
        }
        search(item)
      }
    } else {
      if (key in current) {
        results.push(current[key])
      }
      for (const value of Object.values(current)) {
        if (typeof value === 'object' && value !== null) {
          search(value)
        }
      }
    }
  }

  search(obj)
  return results
}

function setPath(path: string) {
  jsonPath.value = path
  evaluatePath()
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(result.value, null, 2))
    alert('已复制')
  } catch {}
}

// 初始化
loadSampleJSON()
</script>
