<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">SQL 转义工具</h1>
      <p class="text-muted-foreground">SQL 语句转义与反转义，防止 SQL 注入攻击</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入内容</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入需要转义的 SQL 语句..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">数据库类型</h3>
          <div class="flex flex-wrap gap-2">
            <button v-for="db in databaseTypes" :key="db.value" @click="databaseType = db.value" :class="['px-3 py-2 text-sm rounded-lg border transition-colors', databaseType === db.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']">{{ db.label }}</button>
          </div>
        </div>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">转义规则</h3>
          <div class="text-xs font-mono space-y-1">
            <div>' → \\' (单引号)</div>
            <div>" → \\" (双引号)</div>
            <div>\\ → \\\\ (反斜杠)</div>
            <div>\n → \\n (换行)</div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转义结果</h2>
          <div class="flex gap-2">
            <button v-if="outputText" @click="toggleDirection" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ direction === 'escape' ? '反转义' : '转义' }}</button>
            <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
          </div>
        </div>

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">{{ outputText }}</pre>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">转义结果将显示在这里</div>
      </div>
    </div>

    <div class="mt-12 space-y-6">
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">SQL 注入防护说明</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium mb-2">危险示例：</h4>
            <code class="text-sm bg-muted p-2 rounded block">SELECT * FROM users WHERE name = '{{ inputText || "'; DROP TABLE users; --" }}'</code>
          </div>
          <div>
            <h4 class="font-medium mb-2">安全做法：</h4>
            <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>使用参数化查询（推荐）</li>
              <li>使用 ORM 框架</li>
              <li>转义特殊字符</li>
              <li>验证用户输入</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSeoMeta } from '#app'
import { Database } from 'lucide-vue-next'

const inputText = ref('')
const outputText = ref('')
const databaseType = ref('mysql')
const direction = ref('escape')
const copied = ref(false)

const databaseTypes = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mssql', label: 'SQL Server' },
  { value: 'oracle', label: 'Oracle' }
]

const examples = [
  "SELECT * FROM users WHERE name = 'John O'Brien'",
  "INSERT INTO users (name, email) VALUES ('John \"The Boss\"', 'john@example.com')",
  "SELECT * FROM posts WHERE content LIKE '%100% satisfied%'"
]
const currentExample = ref(0)

const escapeSQL = (text, db) => {
  if (direction.value === 'unescape') {
    return text
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
  }

  // 根据数据库类型转义
  return text
    .replace(/'/g, "''")  // SQL 标准转义
    .replace(/"/g, '\\"')
    .replace(/\\/g, '\\\\')
}

watch([inputText, databaseType, direction], () => {
  if (inputText.value) {
    outputText.value = escapeSQL(inputText.value, databaseType.value)
  } else {
    outputText.value = ''
  }
})

const clearInput = () => { inputText.value = ''; outputText.value = '' }
const loadExample = () => { inputText.value = examples[currentExample.value]; currentExample.value = (currentExample.value + 1) % examples.length }
const toggleDirection = () => { direction.value = direction.value === 'escape' ? 'unescape' : 'escape' }

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

useSeoMeta({
  title: 'SQL转义 - 在线SQL语句转义工具',
  description: '免费在线SQL转义工具，支持MySQL、PostgreSQL、SQLite等数据库类型，防止SQL注入攻击，保护数据库安全。',
  keywords: ['sql', 'escape', '转义', 'sql注入', 'mysql', 'postgresql', '安全', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('SQL转义工具')
</script>
