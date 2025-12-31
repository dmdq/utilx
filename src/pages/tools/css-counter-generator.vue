<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">CSS计数器生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成自动编号样式</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">计数器设置</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">计数器名称</label>
            <input v-model="counterName" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="my-counter">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">起始值</label>
            <input v-model.number="startValue" type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">增量</label>
            <input v-model.number="increment" type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">编号样式</label>
            <select v-model="listStyle" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
              <option value="decimal">数字 (1, 2, 3...)</option>
              <option value="decimal-leading-zero">带零数字 (01, 02...)</option>
              <option value="lower-alpha">小写字母 (a, b, c...)</option>
              <option value="upper-alpha">大写字母 (A, B, C...)</option>
              <option value="lower-roman">小写罗马 (i, ii, iii...)</option>
              <option value="upper-roman">大写罗马 (I, II, III...)</option>
              <option value="lower-greek">小写希腊 (α, β, γ...)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">前缀</label>
            <input v-model="prefix" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="例如: 第、Section ">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">后缀</label>
            <input v-model="suffix" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="例如: 、. - ">
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>

        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <div class="counter-demo" v-html="previewHTML"></div>
        </div>

        <div class="p-4 bg-gray-900 rounded-lg">
          <pre class="text-green-400 text-sm font-mono overflow-x-auto"><code>{{ generatedCSS }}</code></pre>
        </div>

        <button @click="copyCSS" class="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg">复制CSS</button>
      </div>
    </div>

    <!-- HTML示例 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">HTML结构</h2>
      <div class="p-4 bg-gray-900 rounded-lg">
        <pre class="text-blue-400 text-sm font-mono overflow-x-auto"><code>{{ generatedHTML }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'CSS计数器生成器 - counter样式生成',
  meta: [{ name: 'description', content: '在线CSS计数器生成工具，创建自动编号样式。' }],
  keywords: ['css counter', '计数器', '自动编号', '列表编号']
})

const counterName = ref('section')
const startValue = ref(1)
const increment = ref(1)
const listStyle = ref('decimal')
const prefix = ref('')
const suffix = ref('.')

const generatedCSS = computed(() => {
  return `body {
  counter-reset: ${counterName.value} ${startValue.value};
}

.item {
  counter-increment: ${counterName.value} ${increment.value};
}

.item::before {
  content: "${prefix.value}" counter(${counterName.value}, ${listStyle.value}) "${suffix.value}";
  margin-right: 0.5em;
  font-weight: bold;
  color: #3b82f6;
}`
})

const generatedHTML = computed(() => {
  return `<div class="item">第一个项目</div>
<div class="item">第二个项目</div>
<div class="item">第三个项目</div>
<div class="item">第四个项目</div>`
})

const previewHTML = computed(() => {
  return `<div class="item">${prefix.value}1${suffix.value} 第一个项目</div>
<div class="item">${prefix.value}2${suffix.value} 第二个项目</div>
<div class="item">${prefix.value}3${suffix.value} 第三个项目</div>`
})

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(generatedCSS.value)
    alert('已复制CSS代码')
  } catch {}
}
</script>

<style>
.counter-demo .item {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 0.25rem;
}
</style>
