<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">GraphQL查询构建器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化构建GraphQL查询和变更，自动生成语法</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：字段选择器 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">查询构建</h2>
          <div class="flex gap-2">
            <button @click="operationType = 'query'" :class="['px-3 py-1 text-sm rounded', operationType === 'query' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">Query</button>
            <button @click="operationType = 'mutation'" :class="['px-3 py-1 text-sm rounded', operationType === 'mutation' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">Mutation</button>
          </div>
        </div>

        <!-- 查询名称 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">操作名称</label>
          <input v-model="queryName" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="例如: GetUser">
        </div>

        <!-- 端点选择 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">端点/根字段</label>
          <input v-model="rootField" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="例如: user, users, createUser">
        </div>

        <!-- 参数 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">参数</label>
          <div class="space-y-2">
            <div v-for="(arg, index) in argsList" :key="index" class="flex gap-2">
              <input v-model="arg.name" placeholder="名称" class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <input v-model="arg.value" placeholder="值" class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <input v-model="arg.type" placeholder="类型" class="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <button @click="argsList.splice(index, 1)" class="px-2 text-red-500">×</button>
            </div>
            <button @click="argsList.push({ name: '', value: '', type: 'String' })" class="text-sm text-blue-600">+ 添加参数</button>
          </div>
        </div>

        <!-- 选择字段 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">选择字段</label>
          <div class="space-y-2">
            <div v-for="(field, index) in selectedFields" :key="index" class="flex gap-2 items-center">
              <input v-model="field.name" placeholder="字段名" class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <input v-model="field.alias" placeholder="别名" class="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
              <button @click="selectedFields.splice(index, 1)" class="px-2 text-red-500">×</button>
            </div>
            <button @click="selectedFields.push({ name: '', alias: '' })" class="text-sm text-blue-600">+ 添加字段</button>
          </div>
        </div>

        <!-- 快捷字段 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">快捷添加</label>
          <div class="flex flex-wrap gap-2">
            <button v-for="field in commonFields" :key="field" @click="addField(field)" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">{{ field }}</button>
          </div>
        </div>

        <!-- 内嵌片段 -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">内嵌对象字段</label>
          <textarea v-model="nestedFields" class="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm font-mono" placeholder="例如: user { id name }"></textarea>
        </div>

        <button @click="generateQuery" class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg">生成查询</button>
      </div>

      <!-- 右侧：生成的查询 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">生成的GraphQL</h2>
          <div class="flex gap-2">
            <button @click="copyQuery" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!generatedQuery">复制</button>
            <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
          </div>
        </div>
        <textarea
          v-model="generatedQuery"
          class="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
          placeholder="生成的GraphQL查询将显示在这里..."
          readonly
        ></textarea>

        <!-- 变量 -->
        <div v-if="variables" class="mt-4">
          <h3 class="text-sm font-medium mb-2">变量 (Variables)</h3>
          <textarea
            v-model="variables"
            class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
            readonly
          ></textarea>
        </div>
      </div>
    </div>

    <!-- GraphQL语法参考 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">GraphQL语法参考</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-2">基础查询</h3>
          <pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">query {
  user(id: "123") {
    id
    name
    email
  }
}</pre>
        </div>
        <div>
          <h3 class="font-medium mb-2">别名和片段</h3>
          <pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">query {
  admin: user(role: "admin") {
    ...userFields
  }
}

fragment userFields on User {
  id
  name
}</pre>
        </div>
        <div>
          <h3 class="font-medium mb-2">变更</h3>
          <pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">mutation {
  createUser(input: {name: "A"}) {
    id
    name
  }
}</pre>
        </div>
        <div>
          <h3 class="font-medium mb-2">变量</h3>
          <pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">query GetUser($id: ID!) {
  user(id: $id) {
    name
  }
}

# Variables: {"id": "123"}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'GraphQL查询构建器 - 可视化GraphQL生成',
  meta: [{ name: 'description', content: '在线GraphQL查询构建工具，可视化生成GraphQL查询和变更，支持参数、字段选择和片段。' }],
  keywords: ['GraphQL', 'GraphQL查询', 'GraphQL构建器', 'Query构建', '可视化GraphQL']
})

const operationType = ref<'query' | 'mutation'>('query')
const queryName = ref('')
const rootField = ref('user')
const argsList = ref([{ name: 'id', value: '"123"', type: 'ID' }])
const selectedFields = ref([{ name: 'id', alias: '' }, { name: 'name', alias: '' }, { name: 'email', alias: '' }])
const nestedFields = ref('')
const generatedQuery = ref('')
const variables = ref('')

const commonFields = ['id', 'name', 'email', 'createdAt', 'updatedAt', 'status', 'title', 'description']

function addField(name: string) {
  selectedFields.value.push({ name, alias: '' })
}

function generateQuery() {
  const op = operationType.value
  const name = queryName.value ? queryName.value : rootField.value.charAt(0).toUpperCase() + rootField.value.slice(1)
  const args = argsList.value.filter(a => a.name && a.value)
  const fields = selectedFields.value.filter(f => f.name)

  let query = ''

  // 操作类型和名称
  if (op === 'query') {
    query += queryName.value ? `query ${name}` : 'query'
  } else {
    query += queryName.value ? `mutation ${name}` : 'mutation'
  }

  // 参数
  if (args.length > 0) {
    const argStr = args.map(a => `$${a.name}: ${a.type}`).join(', ')
    query += `(${argStr})`
  }

  query += ' {\n'

  // 根字段
  query += `  ${rootField.value}`

  // 参数值
  if (args.length > 0) {
    const argStr = args.map(a => `${a.name}: $${a.name}`).join(', ')
    query += `(${argStr})`
  }

  query += ' {\n'

  // 字段
  for (const field of fields) {
    if (field.alias) {
      query += `    ${field.alias}: ${field.name}\n`
    } else {
      query += `    ${field.name}\n`
    }
  }

  // 内嵌字段
  if (nestedFields.value) {
    const indented = nestedFields.value.split('\n').map((l, i) => i === 0 ? `    ${l}` : `      ${l}`).join('\n')
    query += indented + '\n'
  }

  query += '  }\n}'

  generatedQuery.value = query

  // 生成变量
  if (args.length > 0) {
    const vars: any = {}
    for (const arg of args) {
      try {
        vars[arg.name] = JSON.parse(arg.value)
      } catch {
        vars[arg.name] = arg.value.replace(/"/g, '')
      }
    }
    variables.value = JSON.stringify(vars, null, 2)
  } else {
    variables.value = ''
  }
}

async function copyQuery() {
  try {
    await navigator.clipboard.writeText(generatedQuery.value)
    alert('已复制')
  } catch {}
}

function loadSample() {
  operationType.value = 'query'
  queryName.value = 'GetUser'
  rootField.value = 'user'
  argsList.value = [{ name: 'id', value: '"123"', type: 'ID' }]
  selectedFields.value = [
    { name: 'id', alias: '' },
    { name: 'name', alias: '' },
    { name: 'email', alias: '' },
    { name: 'posts', alias: '' }
  ]
  nestedFields.value = `posts {
  id
  title
}`
  generateQuery()
}

// 初始化
generateQuery()
</script>
