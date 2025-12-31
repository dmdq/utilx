<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">SQL格式化工具（开发版）</h1>
      <p class="text-gray-600 dark:text-gray-400">专为开发者设计的SQL美化工具，支持关键字大写、多数据库语法</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="grid md:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-2">数据库类型</label>
          <select v-model="dbType" @change="format" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="oracle">Oracle</option>
            <option value="sqlserver">SQL Server</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">关键字大小写</label>
          <select v-model="keywordCase" @change="format" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="upper">大写 (SELECT)</option>
            <option value="lower">小写 (select)</option>
            <option value="preserve">保持原样</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">缩进大小</label>
          <select v-model.number="indentSize" @change="format" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option :value="2">2 空格</option>
            <option :value="4">4 空格</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">换行位置</label>
          <select v-model="lineBreaks" @change="format" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="before">关键词前换行</option>
            <option value="after">关键词后换行</option>
          </select>
        </div>
      </div>

      <div class="flex gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.commaBefore" @change="format" class="rounded">
          <span>逗号在前列</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.spaceBetween" @change="format" class="rounded">
          <span>运算符加空格</span>
        </label>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">输入SQL</h2>
          <div class="flex gap-2">
            <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
            <button @click="clearAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          </div>
        </div>
        <textarea
          v-model="inputSQL"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴SQL语句..."
          @input="format"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">格式化结果</h2>
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
        </div>
        <textarea
          v-model="outputSQL"
          readonly
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        ></textarea>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">SQL关键字参考</h2>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div>
          <h3 class="font-medium mb-2 text-blue-600">查询语句</h3>
          <div class="flex flex-wrap gap-1">
            <span v-for="kw in selectKeywords" :key="kw" class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">{{ kw }}</span>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-green-600">数据操作</h3>
          <div class="flex flex-wrap gap-1">
            <span v-for="kw in dmlKeywords" :key="kw" class="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded">{{ kw }}</span>
          </div>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-orange-600">数据定义</h3>
          <div class="flex flex-wrap gap-1">
            <span v-for="kw in ddlKeywords" :key="kw" class="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded">{{ kw }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'SQL格式化工具（开发版）- SQL美化与格式化',
  meta: [{ name: 'description', content: '专为开发者设计的SQL格式化工具，支持MySQL、PostgreSQL、Oracle等数据库，关键字大写美化。' }],
  keywords: ['SQL格式化', 'SQL美化', 'MySQL格式化', 'PostgreSQL格式化', 'SQL关键字大写', '开发工具']
})

const inputSQL = ref('')
const outputSQL = ref('')
const dbType = ref('mysql')
const keywordCase = ref('upper')
const indentSize = ref(2)
const lineBreaks = ref('before')

const options = ref({
  commaBefore: false,
  spaceBetween: true
})

const selectKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET']
const dmlKeywords = ['INSERT', 'UPDATE', 'DELETE', 'MERGE', 'CALL', 'EXPLAIN']
const ddlKeywords = ['CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME']

const sampleSQL = `SELECT u.name,u.email,COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.created_at>='2024-01-01' GROUP BY u.id,u.name,u.email HAVING COUNT(o.id)>5 ORDER BY order_count DESC LIMIT 10`

function loadSample() {
  inputSQL.value = sampleSQL
  format()
}

function clearAll() {
  inputSQL.value = ''
  outputSQL.value = ''
}

function format() {
  let sql = inputSQL.value
  if (!sql) {
    outputSQL.value = ''
    return
  }

  const indent = ' '.repeat(indentSize.value)
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'LEFT OUTER JOIN',
    'ON', 'AND', 'OR', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'
  ]

  // 关键字转换大小写
  if (keywordCase.value === 'upper') {
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi')
      sql = sql.replace(regex, kw.toUpperCase())
    })
  } else if (keywordCase.value === 'lower') {
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi')
      sql = sql.replace(regex, kw.toLowerCase())
    })
  }

  // 运算符加空格
  if (options.value.spaceBetween) {
    sql = sql.replace(/([=<>!]+)/g, ' $1 ')
    sql = sql.replace(/\s+/g, ' ')
  }

  // 简单格式化
  const lines = sql.split(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ON|AND|OR|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i)
  let formatted: string[] = []
  let depth = 0

  for (let part of lines) {
    part = part.trim()
    if (!part) continue

    const upperPart = part.toUpperCase()
    const isKeyword = keywords.some(kw => upperPart === kw.toUpperCase())

    if (isKeyword) {
      if (lineBreaks.value === 'before') {
        formatted.push(indent.repeat(depth) + part)
      } else {
        if (formatted.length > 0) {
          formatted[formatted.length - 1] += ' ' + part
        } else {
          formatted.push(part)
        }
      }

      // 增加缩进
      if (['FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'AND', 'OR'].some(kw => upperPart.includes(kw))) {
        depth++
      }
    } else {
      if (part.includes(',')) {
        if (options.value.commaBefore) {
          formatted.push(indent.repeat(depth) + ', ' + part)
        } else {
          formatted.push(indent.repeat(depth) + part + ',')
        }
      } else {
        formatted.push(indent.repeat(depth) + part)
      }
    }
  }

  outputSQL.value = formatted.join('\n')
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputSQL.value)
    alert('已复制')
  } catch {}
}

loadSample()
</script>
