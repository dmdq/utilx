<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">凯撒密码工具 - 在线加密解密</h1>
      <p class="text-muted-foreground">经典凯撒密码加密与解密工具，支持自定义偏移量和大小写保留，纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入文本</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="clearInput"
            >
              清空
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteFromClipboard"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="loadSample"
            >
              示例
            </button>
          </div>
        </div>
        <textarea
          v-model="inputText"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入需要加密或解密的文本..."
          @input="process"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输出结果</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyOutput"
            >
              复制
            </button>
          </div>
        </div>
        <textarea
          v-model="outputText"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 设置区域 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12">
      <h2 class="text-xl font-semibold text-foreground mb-4">加密设置</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">偏移量 (1-25)</label>
          <input
            v-model.number="shift"
            type="number"
            min="1"
            max="25"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            @input="process"
          >
          <div class="flex gap-1 mt-2 flex-wrap">
            <button
              v-for="n in [1, 3, 5, 10, 13, 25]"
              :key="n"
              @click="shift = n; process()"
              class="px-3 py-1 text-sm bg-muted hover:bg-accent rounded text-muted-foreground"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">操作模式</label>
          <div class="flex gap-2">
            <button
              @click="mode = 'encrypt'; process()"
              :class="['px-4 py-2 rounded', mode === 'encrypt' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']"
            >
              加密
            </button>
            <button
              @click="mode = 'decrypt'; process()"
              :class="['px-4 py-2 rounded', mode === 'decrypt' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']"
            >
              解密
            </button>
          </div>

          <div class="mt-4">
            <label class="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" v-model="options.preserveCase" @change="process" class="rounded">
              <span>保留大小写</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-foreground mt-2">
              <input type="checkbox" v-model="options.preserveNonAlpha" @change="process" class="rounded">
              <span>保留非字母字符</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是凯撒密码？
        </h2>
        <p class="text-muted-foreground mb-4">
          凯撒密码（Caesar Cipher）是一种最简单且最广为人知的加密技术。它是一种替换加密的技术，明文中的所有字母都在字母表上向后（或向前）按照一个固定数目进行偏移后被替换成密文。
        </p>
        <p class="text-muted-foreground mb-4">
          例如，当偏移量为3时，所有的字母A将被替换成D，B变成E，以此类推。这个加密方法是以罗马共和国时期 Julius Caesar 命名的，据说他曾用这种方法与他的将军们进行通信。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          加密原理
        </h2>
        <div class="text-muted-foreground mb-6 space-y-2">
          <p><strong>加密公式:</strong> E(x) = (x + n) mod 26</p>
          <p><strong>解密公式:</strong> D(x) = (x - n) mod 26</p>
          <p>其中 x 是字母在字母表中的位置（0-25），n 是偏移量。</p>
          <p>例如偏移量为3时：A→D，B→E，...，X→A，Y→B，Z→C</p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框输入要加密或解密的文本</li>
          <li>设置偏移量（默认为3）</li>
          <li>选择加密或解密模式</li>
          <li>右侧会自动显示结果，点击复制按钮可复制结果</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">凯撒密码安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              凯撒密码非常容易被破解，因为只有25种可能的偏移量。它主要用于教学和简单的娱乐目的，不适合用于真正的加密需求。现代加密使用的是复杂的算法如AES、RSA等。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何破解凯撒密码？</h3>
            <p class="text-muted-foreground mt-1">
              由于凯撒密码只有25种可能的密钥，可以通过暴力穷举所有可能的偏移量来破解。另一种方法是频率分析，根据字母在语言中出现的频率来推断偏移量。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '凯撒密码工具 - 在线加密解密 | Util工具箱',
  description: '在线凯撒密码工具，支持自定义偏移量的凯撒密码加密和解密。经典替换加密技术，适用于密码学学习和娱乐，纯前端处理，数据安全。',
  keywords: '凯撒密码,caesar cipher,加密,解密,密码学,古典密码,在线加密工具',
  author: 'Util工具箱',
  ogTitle: '凯撒密码工具 - 在线加密解密',
  ogDescription: '经典凯撒密码加密与解密工具，支持自定义偏移量和大小写保留，纯本地计算。',
  ogType: 'website'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '凯撒密码工具',
            description: '在线凯撒密码加密与解密工具',
            url: 'https://www.util.cn/tools/caesar-cipher',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '凯撒密码加密',
              '凯撒密码解密',
              '自定义偏移量',
              '保留大小写',
              '保留非字母字符',
              '一键复制结果'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '凯撒密码',
                item: 'https://www.util.cn/tools/caesar-cipher'
              }
            ]
          }
        ]
      })
    }
  ]
})

// 定义当前工具
const tool = tools.find(t => t.id === 'caesar-cipher')

// 输入输出数据
const inputText = ref('')
const outputText = ref('')
const shift = ref(3)
const mode = ref('encrypt')
const options = ref({
  preserveCase: true,
  preserveNonAlpha: true
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Shield: computed(() => Shield),
  Lock: computed(() => Lock),
  Hash: computed(() => Hash),
  FileText: computed(() => FileText)
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'vigenere-cipher'),
    tools.find(t => t.id === 'base64-encode'),
    tools.find(t => t.id === 'rot13-cipher'),
    tools.find(t => t.id === 'aes-encrypt')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

// 处理文本
function process() {
  const text = inputText.value
  const n = shift.value % 26
  let result = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = text.charCodeAt(i)

    // 大写字母 A-Z (65-90)
    if (code >= 65 && code <= 90) {
      let newCode = mode.value === 'encrypt'
        ? ((code - 65 + n) % 26) + 65
        : ((code - 65 - n + 26) % 26) + 65
      result += String.fromCharCode(newCode)
    }
    // 小写字母 a-z (97-122)
    else if (code >= 97 && code <= 122) {
      let newCode = mode.value === 'encrypt'
        ? ((code - 97 + n) % 26) + 97
        : ((code - 97 - n + 26) % 26) + 97
      result += String.fromCharCode(newCode)
    }
    // 非字母字符
    else if (options.value.preserveNonAlpha) {
      result += char
    }
  }

  outputText.value = result
}

// 清空输入
function clearInput() {
  inputText.value = ''
  outputText.value = ''
}

// 粘贴剪贴板内容
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    process()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 加载示例数据
function loadSample() {
  inputText.value = 'HELLO WORLD'
  process()
}

// 复制输出
async function copyOutput() {
  if (!outputText.value) return

  try {
    await navigator.clipboard.writeText(outputText.value)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 初始化
loadSample()
</script>
