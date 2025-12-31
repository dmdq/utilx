<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">URL Slug生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">将标题转换为URL友好的Slug，支持多语言和自定义规则</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">输入标题</label>
        <textarea
          v-model="inputTitle"
          class="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none text-sm"
          placeholder="输入文章标题或文本..."
          @input="generateSlug"
        ></textarea>
      </div>

      <div class="grid md:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1">分隔符</label>
          <select v-model="separator" @change="generateSlug" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            <option value="-">连字符 (-)</option>
            <option value="_">下划线 (_)</option>
            <option value="">无分隔</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">最大长度</label>
          <input v-model.number="maxLength" @input="generateSlug" type="number" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="留空无限制">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">语言</label>
          <select v-model="language" @change="generateSlug" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
            <option value="en">英语</option>
            <option value="zh">中文</option>
            <option value="ja">日语</option>
            <option value="ko">韩语</option>
            <option value="mixed">混合</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">小写</label>
          <div class="mt-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="lowercase" @change="generateSlug" class="rounded">
              <span>转换为小写</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mb-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.removeStopWords" @change="generateSlug" class="rounded">
          <span>移除停用词</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.removeNumbers" @change="generateSlug" class="rounded">
          <span>移除数字</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.preserveCase" @change="generateSlug" class="rounded">
          <span>保留大小写</span>
        </label>
      </div>
    </div>

    <!-- 结果 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">生成的Slug</h2>
          <button @click="copySlug" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!slugResult">复制</button>
        </div>
        <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <code class="text-lg break-all">{{ slugResult || '等待输入...' }}</code>
        </div>

        <!-- 历史记录 -->
        <div v-if="history.length > 0" class="mt-4">
          <h3 class="text-sm font-medium mb-2">历史记录</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(item, index) in history"
              :key="index"
              @click="slugResult = item"
              class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">快捷示例</h2>
        <div class="space-y-2">
          <button @click="setExample('blog')" class="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
            <div class="font-medium">博客文章标题</div>
            <div class="text-sm text-gray-500">"How to Learn Vue.js in 2024"</div>
          </button>
          <button @click="setExample('chinese')" class="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
            <div class="font-medium">中文标题</div>
            <div class="text-sm text-gray-500">"Vue 3 组合式 API 入门教程"</div>
          </button>
          <button @click="setExample('product')" class="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
            <div class="font-medium">产品名称</div>
            <div class="text-sm text-gray-500">"Apple iPhone 15 Pro Max 256GB"</div>
          </button>
        </div>
      </div>
    </div>

    <!-- 停用词列表 -->
    <div v-if="options.removeStopWords" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">停用词列表 (将被移除)</h2>
      <div class="flex flex-wrap gap-2">
        <span v-for="word in stopWords" :key="word" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">{{ word }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'URL Slug生成器 - 标题转URL友好格式',
  meta: [{ name: 'description', content: '在线URL Slug生成工具，将文章标题转换为URL友好的格式，支持多语言和自定义规则。' }],
  keywords: ['Slug生成', 'URL格式化', 'SEO友好URL', '标题转链接', '博客URL']
})

const inputTitle = ref('')
const slugResult = ref('')
const separator = ref('-')
const maxLength = ref<number | null>(null)
const language = ref('mixed')
const lowercase = ref(true)

const options = ref({
  removeStopWords: false,
  removeNumbers: false,
  preserveCase: false
})

const history = ref<string[]>([])

const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', '的', '了', '是', '在', '和', '与']

function generateSlug() {
  if (!inputTitle.value) {
    slugResult.value = ''
    return
  }

  let slug = inputTitle.value

  // 处理中文转拼音
  if (language.value === 'zh' || language.value === 'mixed') {
    slug = transliterateChinese(slug)
  }

  // 移除特殊字符，保留字母数字和空格
  slug = slug
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // 移除停用词
  if (options.value.removeStopWords) {
    const words = slug.split(' ')
    slug = words.filter(w => w && !stopWords.includes(w.toLowerCase())).join(' ')
  }

  // 移除数字
  if (options.value.removeNumbers) {
    slug = slug.replace(/\d+/g, '')
  }

  // 分隔符
  slug = slug.replace(/\s+/g, separator.value)

  // 长度限制
  if (maxLength.value && slug.length > maxLength.value) {
    slug = slug.substring(0, maxLength.value)
    // 避免在分隔符处截断
    if (separator.value && slug.endsWith(separator.value)) {
      slug = slug.slice(0, -1)
    }
  }

  // 小写
  if (lowercase.value && !options.value.preserveCase) {
    slug = slug.toLowerCase()
  }

  slugResult.value = slug

  // 添加到历史
  if (slug && !history.value.includes(slug)) {
    history.value.unshift(slug)
    if (history.value.length > 10) {
      history.value.pop()
    }
  }
}

// 简化的中文转拼音
function transliterateChinese(text: string): string {
  const pinyinMap: Record<string, string> = {
    '的': 'de', '了': 'le', '是': 'shi', '在': 'zai', '和': 'he', '与': 'yu',
    '我': 'wo', '你': 'ni', '他': 'ta', '她': 'ta', '它': 'ta',
    '这': 'zhe', '那': 'na', '有': 'you', '个': 'ge', '为': 'wei',
    '之': 'zhi', '了': 'le', '等': 'deng', '及': 'ji', '而': 'er',
    '教': 'jiao', '程': 'cheng', '入': 'ru', '门': 'men', '学': 'xue'
  }

  let result = text
  for (const [chinese, pinyin] of Object.entries(pinyinMap)) {
    result = result.split(chinese).join(' ' + pinyin + ' ')
  }
  return result
}

function setExample(type: string) {
  switch (type) {
    case 'blog':
      inputTitle.value = 'How to Learn Vue.js in 2024'
      language.value = 'en'
      separator.value = '-'
      break
    case 'chinese':
      inputTitle.value = 'Vue 3 组合式 API 入门教程'
      language.value = 'zh'
      separator.value = '-'
      break
    case 'product':
      inputTitle.value = 'Apple iPhone 15 Pro Max 256GB'
      language.value = 'en'
      separator.value = '-'
      options.value.removeStopWords = true
      break
  }
  generateSlug()
}

async function copySlug() {
  try {
    await navigator.clipboard.writeText(slugResult.value)
    alert('已复制')
  } catch {}
}
</script>
