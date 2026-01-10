<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">维吉尼亚密码工具 - 多表替换加密解密</h1>
      <p class="text-muted-foreground">专业的在线维吉尼亚密码工具，使用密钥进行多表替换加密和解密。安全性高于凯撒密码，支持字母大小写自动转换，一键加密解密。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
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
              @click="pasteText"
            >
              粘贴
            </button>
          </div>
        </div>
        <textarea
          v-model="inputText"
          class="w-full h-40 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入需要加密或解密的文本..."
          @input="process"
        ></textarea>
      </div>

      <!-- 输出区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输出结果</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyResult"
            >
              复制
            </button>
          </div>
        </div>
        <textarea
          v-model="outputText"
          class="w-full h-40 px-4 py-3 bg-muted border border-border rounded-lg resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <!-- 设置区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">设置</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">密钥 (仅字母)</label>
          <input
            v-model="key"
            type="text"
            class="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono uppercase"
            placeholder="输入密钥，例如: KEY"
            @input="process"
          >
          <div class="flex gap-2 mt-2">
            <button
              @click="setKey('SECRET')"
              class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              SECRET
            </button>
            <button
              @click="setKey('KEY')"
              class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              KEY
            </button>
            <button
              @click="setKey('CIPHER')"
              class="text-xs px-3 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              CIPHER
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">操作模式</label>
          <div class="flex gap-2">
            <button
              @click="mode = 'encrypt'; process()"
              :class="['px-4 py-2 rounded transition-colors', mode === 'encrypt' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >
              加密
            </button>
            <button
              @click="mode = 'decrypt'; process()"
              :class="['px-4 py-2 rounded transition-colors', mode === 'decrypt' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground']"
            >
              解密
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加密原理说明区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">加密原理</h2>
      <div class="text-sm text-muted-foreground space-y-3">
        <p>维吉尼亚密码使用密钥进行多表替换加密，每个字母根据密钥中对应位置的字母进行偏移。</p>
        <p>密钥重复以匹配明文长度，例如密钥"KEY"用于"HELLO"：</p>
        <div class="bg-muted p-3 rounded font-mono text-sm">
          明文: H E L L O<br>
          密钥: K E Y K E
        </div>
        <p>每个字母使用不同的凯撒密码偏移量，因此相同明文字符可能产生不同密文。</p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-12 relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是维吉尼亚密码？
        </h2>
        <p class="text-muted-foreground mb-4">
          维吉尼亚密码（Vigenère Cipher）是一种使用关键字的多表替换加密技术，由法国密码学家Blaise de Vigenère于16世纪发明。
          它被认为是历史上第一个实用的多表密码系统，曾被称为"不可破译的密码"（le chiffre indéchiffrable）。
          相比简单的凯撒密码，维吉尼亚密码使用多条字母表进行加密，大大提高了安全性。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中输入需要加密或解密的文本（仅支持英文字母）</li>
          <li>设置密钥：输入一个或多个字母作为密钥，或选择预设密钥</li>
          <li>选择操作模式：加密或解密</li>
          <li>查看输出区域的加密或解密结果，可一键复制</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          加密算法原理
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多表替换</strong>: 使用26条不同的凯撒密码字母表，每条表对应不同的偏移量</li>
          <li><strong>密钥循环</strong>: 密钥重复使用以匹配明文长度，每个明文字符对应一个密钥字符</li>
          <li><strong>字母偏移</strong>: A=0, B=1, ..., Z=25，加密时C = (P + K) mod 26，解密时P = (C - K) mod 26</li>
          <li><strong>大小写处理</strong>: 工具会自动将输入转换为大写字母，非字母字符会被过滤</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          历史背景
        </h2>
        <p class="text-muted-foreground mb-4">
          维吉尼亚密码于1553年由Giovan Battista Bellaso首次描述，后于1586年由Blaise de Vigenère重新提出。
          在此后的几个世纪里，它被认为是非常安全的加密方法。直到1863年，普鲁士军官Friedrich Kasiski才发现了破解方法。
          如今，维吉尼亚密码主要用于教学和密码学学习，是理解现代密码学的重要基础。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">维吉尼亚密码安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              维吉尼亚密码在现代标准下是不安全的。使用卡西斯基测试（Kasiski examination）或频率分析可以破解它。
              但作为教学工具和理解密码学历史，它仍有重要价值。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">密钥应该如何选择？</h3>
            <p class="text-muted-foreground mt-1">
              密钥应选择难以猜测的字母组合，避免使用常见单词。密钥越长且越随机，安全性越高。
              但请注意，现代计算机可以在几秒钟内破解任何维吉尼亚密码。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">维吉尼亚密码和凯撒密码有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              凯撒密码使用单一的偏移量（所有字母移动相同位数），而维吉尼亚密码根据密钥使用多个偏移量。
              这使得维吉尼亚密码能够隐藏字母的频率特征，比凯撒密码更难破解。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何破解维吉尼亚密码？</h3>
            <p class="text-muted-foreground mt-1">
              主要有两种方法：卡西斯基测试（寻找重复字符序列来推断密钥长度）和频率分析（对每个密钥位置的字母进行频率分析）。
              现代计算机可以快速尝试所有可能的密钥长度和密钥。
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
import { HelpCircle, ChevronUp, Lock, Shield, Key, FileText } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '维吉尼亚密码工具 - 多表替换加密解密 | Util工具箱',
  description: '免费在线维吉尼亚密码工具，使用密钥进行多表替换加密和解密。安全性高于凯撒密码，支持字母大小写自动转换，一键加密解密。',
  keywords: '维吉尼亚密码,vigenere cipher,多表密码,多表替换,古典密码,加密解密,密码学,凯撒密码',
  author: 'Util工具箱',
  ogTitle: '维吉尼亚密码工具 - 多表替换加密解密',
  ogDescription: '使用密钥进行多表替换加密和解密，安全性高于凯撒密码，支持自动转换大小写。',
  ogImage: 'https://www.util.cn/images/tools/vigenere-cipher.png',
  ogUrl: 'https://www.util.cn/tools/vigenere-cipher',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '维吉尼亚密码工具 - 多表替换加密解密',
  twitterDescription: '使用密钥进行多表替换加密和解密，安全性高于凯撒密码。',
  twitterImage: 'https://www.util.cn/images/tools/vigenere-cipher.png'
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
            name: '维吉尼亚密码工具',
            description: '在线维吉尼亚密码加密解密工具，使用多表替换算法',
            url: 'https://www.util.cn/tools/vigenere-cipher',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多表替换加密',
              '自定义密钥',
              '自动转换大小写',
              '一键加密解密',
              '实时处理',
              '纯本地计算'
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
                name: '维吉尼亚密码',
                item: 'https://www.util.cn/tools/vigenere-cipher'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '维吉尼亚密码安全吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '维吉尼亚密码在现代标准下是不安全的。使用卡西斯基测试或频率分析可以破解它。'
                }
              },
              {
                '@type': 'Question',
                name: '密钥应该如何选择？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '密钥应选择难以猜测的字母组合，避免使用常见单词。密钥越长且越随机，安全性越高。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const inputText = ref('')
const outputText = ref('')
const key = ref('KEY')
const mode = ref('encrypt')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Lock, Shield, Key, FileText
}

// 相关工具
const relatedTools = computed(() => {
  const sameCategory = tools.filter(t =>
    t.category === 'encoding' && t.id !== 'vigenere-cipher'
  ).slice(0, 3)

  const recommended = [
    tools.find(t => t.id === 'caesar-cipher'),
    tools.find(t => t.id === 'base64-encoder'),
    tools.find(t => t.id === 'rot13-encoder'),
    tools.find(t => t.id === 'aes-encryption')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

function process() {
  const text = inputText.value.toUpperCase().replace(/[^A-Z]/g, '')
  const k = key.value.toUpperCase().replace(/[^A-Z]/g, '')

  if (!text || !k) {
    outputText.value = ''
    return
  }

  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) - 65
    const keyChar = k[i % k.length]
    const keyShift = keyChar.charCodeAt(0) - 65

    let newCode
    if (mode.value === 'encrypt') {
      newCode = (charCode + keyShift) % 26
    } else {
      newCode = (charCode - keyShift + 26) % 26
    }

    result += String.fromCharCode(newCode + 65)
  }

  outputText.value = result
}

function setKey(newKey) {
  key.value = newKey
  process()
}

async function pasteText() {
  try {
    inputText.value = await navigator.clipboard.readText()
    process()
  } catch {}
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
  } catch {}
}

function clearInput() {
  inputText.value = ''
  outputText.value = ''
}

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
addRecentTool('vigenere-cipher')

// 初始化示例
inputText.value = 'HELLO'
key.value = 'KEY'
mode.value = 'encrypt'
process()
</script>
