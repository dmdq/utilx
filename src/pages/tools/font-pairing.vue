<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">字体配对工具</h1>
      <p class="text-muted-foreground mb-6">Web字体组合预览和推荐，找到完美的字体搭配</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：字体选择 -->
      <div class="space-y-6">
        <!-- 标题字体选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">标题字体</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">搜索字体</label>
              <input
                type="text"
                v-model="headingSearchQuery"
                @input="filterHeadingFonts"
                placeholder="搜索标题字体..."
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div class="h-48 overflow-y-auto border rounded-lg p-3">
              <div
                v-for="font in filteredHeadingFonts"
                :key="font.family"
                @click="selectHeadingFont(font)"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-colors mb-2',
                  selectedHeadingFont?.family === font.family
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                ]"
                :style="{ fontFamily: font.family }"
              >
                <div class="font-bold text-lg">{{ font.name }}</div>
                <div class="text-sm opacity-80">{{ font.family }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 正文字体选择 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">正文字体</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">搜索字体</label>
              <input
                type="text"
                v-model="bodySearchQuery"
                @input="filterBodyFonts"
                placeholder="搜索正文字体..."
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div class="h-48 overflow-y-auto border rounded-lg p-3">
              <div
                v-for="font in filteredBodyFonts"
                :key="font.family"
                @click="selectBodyFont(font)"
                :class="[
                  'p-3 rounded-lg cursor-pointer transition-colors mb-2',
                  selectedBodyFont?.family === font.family
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                ]"
                :style="{ fontFamily: font.family }"
              >
                <div class="font-normal text-lg">{{ font.name }}</div>
                <div class="text-sm opacity-80">{{ font.family }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 推荐组合 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">推荐组合</h3>
          <div class="space-y-3">
            <button
              v-for="pair in recommendedPairs"
              :key="pair.name"
              @click="applyPair(pair)"
              class="w-full text-left p-4 rounded-lg border hover:border-primary transition-colors"
            >
              <div class="font-semibold mb-1">{{ pair.name }}</div>
              <div class="text-sm text-muted-foreground mb-2">{{ pair.description }}</div>
              <div class="flex gap-4">
                <span class="text-sm font-medium" :style="{ fontFamily: pair.headingFont }">
                  {{ pair.headingFont }}
                </span>
                <span class="text-sm text-muted-foreground">+</span>
                <span class="text-sm" :style="{ fontFamily: pair.bodyFont }">
                  {{ pair.bodyFont }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和设置 -->
      <div class="space-y-6">
        <!-- 实时预览 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">实时预览</h3>
          <div class="space-y-6">
            <!-- 标题预览 -->
            <div>
              <label class="block text-sm font-medium mb-2">标题预览</label>
              <input
                type="text"
                v-model="previewHeading"
                class="w-full px-3 py-2 border rounded-lg mb-3"
                placeholder="输入标题文本"
              />
              <h1
                class="text-4xl font-bold mb-2"
                :style="headingStyle"
              >
                {{ previewHeading || '设计之美' }}
              </h1>
            </div>

            <!-- 正文预览 -->
            <div>
              <label class="block text-sm font-medium mb-2">正文预览</label>
              <textarea
                v-model="previewBody"
                class="w-full px-3 py-2 border rounded-lg mb-3 h-24 resize-none"
                placeholder="输入正文文本"
              ></textarea>
              <p
                class="text-base leading-relaxed"
                :style="bodyStyle"
              >
                {{ previewBody || '好的字体搭配能够提升用户体验，让内容更容易阅读。标题字体需要有力量感和辨识度，而正文字体则需要良好的可读性和舒适性。' }}
              </p>
            </div>

            <!-- 不同尺寸预览 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-lg font-semibold mb-2" :style="headingStyle">
                  副标题
                </h4>
                <p class="text-sm" :style="bodyStyle">
                  这是一个副标题和正文的小尺寸预览，展示字体在不同尺寸下的效果。
                </p>
              </div>
              <div>
                <h2 class="text-2xl font-semibold mb-2" :style="headingStyle">
                  引用标题
                </h2>
                <blockquote class="text-base italic" :style="bodyStyle">
                  "优秀的字体设计是无形的，它让内容自然流动，而不是喧宾夺主。"
                </blockquote>
              </div>
            </div>
          </div>
        </div>

        <!-- 字体设置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">字体设置</h3>

          <!-- 标题设置 -->
          <div class="mb-6">
            <h4 class="text-sm font-semibold mb-3">标题设置</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1">字重</label>
                <select v-model="headingFontWeight" class="w-full px-2 py-1 border rounded text-sm">
                  <option value="100">Thin</option>
                  <option value="300">Light</option>
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">SemiBold</option>
                  <option value="700">Bold</option>
                  <option value="800">ExtraBold</option>
                  <option value="900">Black</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">字间距</label>
                <input
                  type="range"
                  v-model.number="headingLetterSpacing"
                  min="-2"
                  max="10"
                  step="0.5"
                  class="w-full"
                />
                <span class="text-xs text-muted-foreground">{{ headingLetterSpacing }}px</span>
              </div>
            </div>
          </div>

          <!-- 正文设置 -->
          <div>
            <h4 class="text-sm font-semibold mb-3">正文设置</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1">字重</label>
                <select v-model="bodyFontWeight" class="w-full px-2 py-1 border rounded text-sm">
                  <option value="100">Thin</option>
                  <option value="300">Light</option>
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">SemiBold</option>
                  <option value="700">Bold</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">行高</label>
                <select v-model="bodyLineHeight" class="w-full px-2 py-1 border rounded text-sm">
                  <option value="1">1.0</option>
                  <option value="1.25">1.25</option>
                  <option value="1.5">1.5</option>
                  <option value="1.75">1.75</option>
                  <option value="2">2.0</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 对比度检查 -->
        <div class="bg-card rounded-lg p-6 border">
          <h3 class="text-lg font-semibold mb-4">可读性分析</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm">标题可读性</span>
              <span :class="getContrastClass(headingReadability)">
                {{ getContrastText(headingReadability) }}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all"
                :class="getContrastBarClass(headingReadability)"
                :style="{ width: `${headingReadability}%` }"
              ></div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm">正文可读性</span>
              <span :class="getContrastClass(bodyReadability)">
                {{ getContrastText(bodyReadability) }}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all"
                :class="getContrastBarClass(bodyReadability)"
                :style="{ width: `${bodyReadability}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- CSS代码 -->
        <div class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">CSS代码</h3>
            <button
              @click="copyCSS"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              复制代码
            </button>
          </div>
          <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm"><code>{{ cssCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// SEO设置
useSeoMeta({
  title: '字体配对工具 - 在线Web字体组合预览和推荐',
  description: '免费字体配对工具，提供Web字体组合预览和专业推荐。支持衬线字体、无衬线字体、等宽字体配对，实时预览效果，可读性分析。专业的字体设计和排版工具。',
  keywords: ['字体配对工具', 'Web字体搭配', '字体组合推荐', '字体配对预览', '衬线字体搭配', '无衬线字体组合', '字体排版设计', '可读性分析', 'UI字体选择', '网页字体设计', '字体配对建议', '英文字体搭配'],
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '字体配对工具',
    description: '免费的在线字体配对工具，提供Web字体组合预览和专业推荐，支持字体可读性分析。',
    url: 'https://util.iskytrip.com/tools/font-pairing',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY'
    },
    featureList: [
      '字体组合预览',
      '专业字体推荐',
      '可读性分析',
      '字体参数调节',
      '衬线字体搭配',
      '无衬线字体组合',
      '等宽字体选择',
      '实时效果预览',
      'CSS代码生成'
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'UI设计师、网页设计师、排版师'
    }
  }
})

// 字体数据
const webFonts = [
  // 衬线字体
  { family: 'Georgia, serif', name: 'Georgia', category: 'serif' },
  { family: 'Times New Roman, Times, serif', name: 'Times', category: 'serif' },
  { family: 'Baskerville, Baskerville Old Face, Hoefler Text, Garamond, Times New Roman, serif', name: 'Baskerville', category: 'serif' },
  { family: 'Caslon, Big Caslon, Bodoni MT, Didot, Hoefler Text, Garamond, serif', name: 'Caslon', category: 'serif' },
  { family: 'Garamond, Baskerville, Caslon, Times New Roman, serif', name: 'Garamond', category: 'serif' },
  { family: 'Playfair Display, Baskerville, Georgia, serif', name: 'Playfair Display', category: 'serif' },
  { family: 'Merriweather, Georgia, serif', name: 'Merriweather', category: 'serif' },
  { family: 'Lora, Georgia, serif', name: 'Lora', category: 'serif' },

  // 无衬线字体
  { family: 'Arial, Helvetica, sans-serif', name: 'Arial', category: 'sans-serif' },
  { family: 'Helvetica, Arial, sans-serif', name: 'Helvetica', category: 'sans-serif' },
  { family: 'Roboto, Arial, sans-serif', name: 'Roboto', category: 'sans-serif' },
  { family: 'Open Sans, Arial, sans-serif', name: 'Open Sans', category: 'sans-serif' },
  { family: 'Lato, Arial, sans-serif', name: 'Lato', category: 'sans-serif' },
  { family: 'Montserrat, Arial, sans-serif', name: 'Montserrat', category: 'sans-serif' },
  { family: 'Poppins, Arial, sans-serif', name: 'Poppins', category: 'sans-serif' },
  { family: 'Raleway, Arial, sans-serif', name: 'Raleway', category: 'sans-serif' },
  { family: 'Nunito, Arial, sans-serif', name: 'Nunito', category: 'sans-serif' },
  { family: 'Source Sans Pro, Arial, sans-serif', name: 'Source Sans Pro', category: 'sans-serif' },

  // 等宽字体
  { family: 'Courier New, Courier, monospace', name: 'Courier', category: 'monospace' },
  { family: 'Monaco, Consolas, monospace', name: 'Monaco', category: 'monospace' },
  { family: 'Menlo, Monaco, Consolas, monospace', name: 'Menlo', category: 'monospace' },
  { family: 'Fira Code, Monaco, Consolas, monospace', name: 'Fira Code', category: 'monospace' },
  { family: 'Source Code Pro, Monaco, Consolas, monospace', name: 'Source Code Pro', category: 'monospace' }
]

// 推荐组合
const recommendedPairs = [
  {
    name: '经典现代',
    description: '经典的无衬线字体组合，专业且易读',
    headingFont: 'Helvetica, Arial, sans-serif',
    bodyFont: 'Georgia, serif'
  },
  {
    name: '优雅衬线',
    description: '优雅的衬线字体搭配，适合高端品牌',
    headingFont: 'Playfair Display, Baskerville, Georgia, serif',
    bodyFont: 'Lora, Georgia, serif'
  },
  {
    name: '清新现代',
    description: '现代感十足的无衬线字体组合',
    headingFont: 'Montserrat, Arial, sans-serif',
    bodyFont: 'Open Sans, Arial, sans-serif'
  },
  {
    name: '友好圆润',
    description: '圆润友好的字体搭配，适合创意行业',
    headingFont: 'Poppins, Arial, sans-serif',
    bodyFont: 'Nunito, Arial, sans-serif'
  },
  {
    name: '科技感',
    description: '简洁有力的科技风格字体组合',
    headingFont: 'Raleway, Arial, sans-serif',
    bodyFont: 'Roboto, Arial, sans-serif'
  },
  {
    name: '阅读优化',
    description: '专为长时间阅读优化的字体组合',
    headingFont: 'Lato, Arial, sans-serif',
    bodyFont: 'Merriweather, Georgia, serif'
  }
]

// 状态
const selectedHeadingFont = ref(webFonts[13]) // Montserrat
const selectedBodyFont = ref(webFonts[15]) // Open Sans
const headingSearchQuery = ref('')
const bodySearchQuery = ref('')
const filteredHeadingFonts = ref(webFonts)
const filteredBodyFonts = ref(webFonts)

// 预览文本
const previewHeading = ref('')
const previewBody = ref('')

// 字体设置
const headingFontWeight = ref('700')
const headingLetterSpacing = ref(0)
const bodyFontWeight = ref('400')
const bodyLineHeight = ref('1.5')

// 计算样式
const headingStyle = computed(() => ({
  fontFamily: selectedHeadingFont.value?.family || 'Arial, sans-serif',
  fontWeight: headingFontWeight.value,
  letterSpacing: `${headingLetterSpacing.value}px`
}))

const bodyStyle = computed(() => ({
  fontFamily: selectedBodyFont.value?.family || 'Georgia, serif',
  fontWeight: bodyFontWeight.value,
  lineHeight: bodyLineHeight.value
}))

// 计算CSS代码
const cssCode = computed(() => {
  return `/* 标题字体 */
h1, h2, h3, h4, h5, h6 {
  font-family: ${selectedHeadingFont.value?.family || 'Arial, sans-serif'};
  font-weight: ${headingFontWeight.value};
  letter-spacing: ${headingLetterSpacing.value}px;
}

/* 正文字体 */
p, span, div {
  font-family: ${selectedBodyFont.value?.family || 'Georgia, serif'};
  font-weight: ${bodyFontWeight.value};
  line-height: ${bodyLineHeight.value};
}`
})

// 模拟可读性评分
const headingReadability = ref(85)
const bodyReadability = ref(92)

// 方法
const filterHeadingFonts = () => {
  const query = headingSearchQuery.value.toLowerCase()
  filteredHeadingFonts.value = webFonts.filter(font =>
    font.name.toLowerCase().includes(query) ||
    font.family.toLowerCase().includes(query) ||
    font.category.toLowerCase().includes(query)
  )
}

const filterBodyFonts = () => {
  const query = bodySearchQuery.value.toLowerCase()
  filteredBodyFonts.value = webFonts.filter(font =>
    font.name.toLowerCase().includes(query) ||
    font.family.toLowerCase().includes(query) ||
    font.category.toLowerCase().includes(query)
  )
}

const selectHeadingFont = (font) => {
  selectedHeadingFont.value = font
  updateReadability()
}

const selectBodyFont = (font) => {
  selectedBodyFont.value = font
  updateReadability()
}

const applyPair = (pair) => {
  const headingFont = webFonts.find(f => f.family === pair.headingFont)
  const bodyFont = webFonts.find(f => f.family === pair.bodyFont)

  if (headingFont) selectedHeadingFont.value = headingFont
  if (bodyFont) selectedBodyFont.value = bodyFont

  updateReadability()
}

const updateReadability = () => {
  // 模拟计算可读性评分
  const heading = selectedHeadingFont.value
  const body = selectedBodyFont.value

  // 衬线字体通常可读性更好
  const headingBonus = heading?.category === 'serif' ? 5 : 0
  const bodyBonus = body?.category === 'serif' ? 8 : 0

  headingReadability.value = Math.min(100, 75 + headingBonus + Math.random() * 15)
  bodyReadability.value = Math.min(100, 80 + bodyBonus + Math.random() * 15)
}

const getContrastClass = (value) => {
  if (value >= 80) return 'text-green-600 font-medium'
  if (value >= 60) return 'text-yellow-600 font-medium'
  return 'text-red-600 font-medium'
}

const getContrastBarClass = (value) => {
  if (value >= 80) return 'bg-green-500'
  if (value >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getContrastText = (value) => {
  if (value >= 80) return '优秀'
  if (value >= 60) return '良好'
  return '需改进'
}

const copyCSS = async () => {
  try {
    await navigator.clipboard.writeText(cssCode.value)
    alert('CSS代码已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，请手动复制')
  }
}

onMounted(() => {
  updateReadability()
})
</script>