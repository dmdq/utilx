<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Markdown表格生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">可视化生成Markdown表格，支持对齐和合并单元格</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- 表格编辑器 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">表格编辑器</h2>
          <div class="flex gap-2">
            <button @click="addRow" class="px-3 py-1 text-sm bg-green-500 text-white rounded">+ 行</button>
            <button @click="addColumn" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">+ 列</button>
            <button @click="clearTable" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          </div>
        </div>

        <div class="overflow-auto max-h-96">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-700">
                <th v-for="(_, colIndex) in columnCount" :key="'header-'+colIndex" class="border border-gray-300 dark:border-gray-600 p-1">
                  <input v-model="headers[colIndex]" class="w-full px-2 py-1 text-sm bg-transparent" placeholder="列标题">
                  <div class="flex gap-1 mt-1">
                <button @click="setAlignment(colIndex, 'left')" :class="['w-6 h-6 text-xs rounded', alignments[colIndex] === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-200']">←</button>
                <button @click="setAlignment(colIndex, 'center')" :class="['w-6 h-6 text-xs rounded', alignments[colIndex] === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-200']">→</button>
                <button @click="setAlignment(colIndex, 'right')" :class="['w-6 h-6 text-xs rounded', alignments[colIndex] === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-200']">→</button>
                <button @click="removeColumn(colIndex)" class="w-6 h-6 text-xs bg-red-200 text-red-600 rounded">×</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in tableData" :key="'row-'+rowIndex">
            <td v-for="(cell, colIndex) in row" :key="'cell-'+rowIndex+'-'+colIndex" class="border border-gray-300 dark:border-gray-600 p-1">
              <input v-model="tableData[rowIndex][colIndex]" class="w-full px-2 py-1 text-sm bg-transparent" placeholder="内容">
            </td>
            <td class="border border-gray-300 dark:border-gray-600 p-1">
              <button @click="removeRow(rowIndex)" class="w-8 h-8 text-xs bg-red-100 text-red-600 rounded">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Markdown输出 -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Markdown表格</h2>
      <button @click="copyMarkdown" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!markdownTable">复制</button>
    </div>
    <textarea
      v-model="markdownTable"
      readonly
      class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
    ></textarea>

    <!-- 预览 -->
    <div class="mt-4">
      <h3 class="text-sm font-medium mb-2">预览</h3>
      <div class="p-4 border border-gray-200 dark:border-gray-700 rounded" v-html="renderedTable"></div>
    </div>
  </div>
  </div>

  <!-- 快捷模板 -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
  <h2 class="text-xl font-semibold mb-4">快捷模板</h2>
  <div class="flex flex-wrap gap-2">
    <button @click="loadTemplate('basic')" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded">基础表格</button>
    <button @click="loadTemplate('comparison')" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded">对比表格</button>
    <button @click="loadTemplate('schedule')" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded">日程表</button>
  </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: 'Markdown表格生成器 - 在线Markdown表格创建',
  meta: [{ name: 'description', content: '在线Markdown表格生成工具，可视化创建Markdown表格，支持对齐方式设置。' }],
  keywords: ['Markdown表格', '表格生成', 'Markdown编辑', '在线工具']
})

const rowCount = ref(3)
const columnCount = ref(3)
const headers = ref<string[]>(['列1', '列2', '列3'])
const alignments = ref<string[]>(['left', 'left', 'left'])
const tableData = ref<string[][]>([
  ['数据1', '数据2', '数据3'],
  ['数据4', '数据5', '数据6'],
  ['数据7', '数据8', '数据9']
])

const markdownTable = computed(() => {
  if (headers.value.length === 0) return ''

  let md = '| ' + headers.value.join(' | ') + ' |\n'
  md += '| ' + alignments.value.map(a => {
    switch (a) {
      case 'left': return '---'
      case 'center': return ':---:'
      case 'right': return '---:'
      default: return '---'
    }
  }).join(' | ') + ' |\n'

  for (const row of tableData.value) {
    md += '| ' + row.join(' | ') + ' |\n'
  }

  return md
})

const renderedTable = computed(() => {
  if (!markdownTable.value) return ''
  // 简单的Markdown到HTML转换
  const lines = markdownTable.value.split('\n').filter(l => l.trim())
  if (lines.length < 2) return ''

  const headers = lines[0].split('|').filter(c => c.trim()).map(c => c.trim())
  const aligns = lines[1].split('|').filter(c => c.trim()).map(c => {
    const a = c.trim()
    if (a.startsWith(':') && a.endsWith(':')) return 'center'
    if (a.endsWith(':')) return 'right'
    return 'left'
  })

  let html = '<table class="w-full border-collapse"><thead><tr>'
  headers.forEach((h, i) => {
    html += `<th class="border border-gray-300 px-4 py-2 text-${aligns[i] || 'left'}">${h}</th>`
  })
  html += '</tr></thead><tbody>'

  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').filter(c => c.trim()).map(c => c.trim())
    html += '<tr>'
    cells.forEach((cell, ci) => {
      html += `<td class="border border-gray-300 px-4 py-2 text-${aligns[ci] || 'left'}">${cell}</td>`
    })
    html += '</tr>'
  }

  html += '</tbody></table>'
  return html
})

function addRow() {
  tableData.value.push(new Array(columnCount.value).fill(''))
  rowCount.value++
}

function addColumn() {
  columnCount.value++
  headers.value.push(`列${columnCount.value}`)
  alignments.value.push('left')
  tableData.value.forEach(row => row.push(''))
}

function removeRow(index: number) {
  if (tableData.value.length > 1) {
    tableData.value.splice(index, 1)
    rowCount.value--
  }
}

function removeColumn(index: number) {
  if (headers.value.length > 1) {
    headers.value.splice(index, 1)
    alignments.value.splice(index, 1)
    tableData.value.forEach(row => row.splice(index, 1))
    columnCount.value--
  }
}

function setAlignment(colIndex: number, align: string) {
  alignments.value[colIndex] = align
}

function clearTable() {
  rowCount.value = 3
  columnCount.value = 3
  headers.value = ['列1', '列2', '列3']
  alignments.value = ['left', 'left', 'left']
  tableData.value = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]
}

function loadTemplate(type: string) {
  switch (type) {
    case 'basic':
      headers.value = ['名称', '类型', '描述']
      alignments.value = ['left', 'center', 'left']
      tableData.value = [
        ['项目A', 'Web', '一个Web项目'],
        ['项目B', '移动', '一个移动应用']
      ]
      columnCount.value = 3
      break
    case 'comparison':
      headers.value = ['功能', '免费版', '专业版']
      alignments.value = ['left', 'center', 'center']
      tableData.value = [
        ['用户数', '5', '无限'],
        ['存储空间', '1GB', '100GB'],
        ['技术支持', '社区', '24/7']
      ]
      columnCount.value = 3
      break
    case 'schedule':
      headers.value = ['时间', '周一', '周二', '周三']
      alignments.value = ['center', 'center', 'center', 'center']
      tableData.value = [
        ['9:00', '晨会', '晨会', '晨会'],
        ['10:00', '开发', '开发', '评审'],
        ['14:00', '测试', '发布', '开发']
      ]
      columnCount.value = 4
      break
  }
}

async function copyMarkdown() {
  try {
    await navigator.clipboard.writeText(markdownTable.value)
    alert('已复制')
  } catch {}
}

onMounted(() => {
  clearTable()
})
</script>
