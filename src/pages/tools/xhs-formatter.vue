<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PenTool class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">小红书排版器</h1>
          <p class="text-sm text-muted-foreground mt-1">笔记正文一键美化：emoji 分隔、段首符号、标题符号、话题标签</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        小红书正文不支持 Markdown，直接贴段落会挤成一坨。把草稿粘进来，一键在段落之间插入 emoji 分隔行，可选段首符号突出要点；标题符号工具条可在光标处插入「」〖〗★☆ 等装饰符号；话题标签自动按 #关键词# 格式附加文末。右侧实时预览成品效果，一键复制纯文本直接粘贴发布。全部处理在浏览器本地完成。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：编辑区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Edit3 class="w-5 h-5 mr-2 text-primary" /> 笔记草稿
        </h2>

        <!-- 原始草稿 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">原始草稿（每段一行或空行分隔）</label>
          <textarea
            ref="draftRef"
            v-model="draft"
            rows="8"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="在此粘贴或输入笔记草稿，空行或换行会被识别为段落分隔"
          ></textarea>
        </div>

        <!-- 标题符号工具条 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">符号工具条（点击插入光标处）</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="sym in toolbarSymbols"
              :key="sym"
              @click="insertAtCursor(sym)"
              class="w-9 h-9 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-foreground transition-all flex items-center justify-center text-sm"
              :title="'插入 ' + sym"
            >{{ sym }}</button>
          </div>
        </div>

        <!-- 一键美化 -->
        <div class="space-y-3 border-t border-border pt-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">段落分隔模板</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="e in dividerEmojis"
                :key="e"
                @click="dividerEmoji = e"
                :class="dividerEmoji === e ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'"
                class="w-10 h-10 rounded-lg border text-base transition-all flex items-center justify-center"
                :title="'使用 ' + e + ' 分隔'"
              >{{ e }}</button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="prefixEnabled"
              type="checkbox"
              id="prefixToggle"
              class="w-4 h-4 rounded border-border"
            />
            <label for="prefixToggle" class="text-sm text-foreground">段首自动加符号</label>
            <div class="flex gap-1 ml-2">
              <button
                v-for="s in prefixSymbols"
                :key="s"
                @click="prefixSymbol = s"
                :class="prefixSymbol === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'"
                class="w-8 h-8 rounded-lg border text-sm transition-all flex items-center justify-center"
              >{{ s }}</button>
            </div>
          </div>
        </div>

        <!-- 话题标签 -->
        <div class="space-y-2 border-t border-border pt-4">
          <div class="flex items-center gap-2">
            <input
              v-model="tagsEnabled"
              type="checkbox"
              id="tagsToggle"
              class="w-4 h-4 rounded border-border"
            />
            <label for="tagsToggle" class="text-sm text-foreground">自动附加话题标签</label>
          </div>
          <input
            v-model="tagInput"
            type="text"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="输入关键词，用逗号或空格分隔，如：穿搭, 通勤, 秋冬"
          />
          <div v-if="tagList.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="t in tagList"
              :key="t"
              class="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
            >#{{ t }}#</span>
          </div>
        </div>
      </div>

      <!-- 右侧：预览区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Eye class="w-5 h-5 mr-2 text-primary" /> 实时预览
          </h2>
          <div class="flex gap-1">
            <button
              @click="previewMode = 'card'"
              :class="previewMode === 'card' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >朋友圈卡片</button>
            <button
              @click="previewMode = 'mono'"
              :class="previewMode === 'mono' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >等宽纯文本</button>
          </div>
        </div>

        <div v-if="formattedText" :class="previewMode === 'card' ? 'bg-background border border-border rounded-xl p-5 shadow-sm' : 'bg-muted/50 border border-border rounded-lg p-4'">
          <p
            :class="previewMode === 'mono' ? 'font-mono text-xs leading-6 whitespace-pre-wrap text-foreground' : 'text-sm leading-7 whitespace-pre-wrap text-foreground'"
          >{{ formattedText }}</p>
        </div>
        <div v-else class="p-8 text-center text-muted-foreground text-sm">
          输入草稿后自动生成预览
        </div>

        <div v-if="formattedText" class="flex items-center gap-3">
          <button
            @click="copyFormatted"
            class="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
          >
            <Copy class="w-4 h-4" /> 一键复制纯文本
          </button>
          <span :class="charCount > 1000 ? 'text-destructive' : 'text-muted-foreground'" class="text-xs whitespace-nowrap">
            {{ charCount }} / 1000 字
          </span>
        </div>
        <p v-if="charCount > 1000" class="text-xs text-destructive">已超过小红书正文 1000 字上限，请精简内容</p>

        <p class="text-xs text-muted-foreground leading-relaxed">
          复制内容为纯文本（不含任何 HTML），直接粘贴到小红书发布页即可保留换行与 emoji 排版。
        </p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="seoContentVisible = !seoContentVisible"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>小红书笔记排版技巧</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            小红书正文编辑器只保留换行，不解析 Markdown，也不能加粗变色，因此排版全靠换行、空行、emoji 和特殊符号。合理的排版能让笔记在信息流里更易读：段落之间插入 emoji 分隔行制造呼吸感，段首符号引导视线，文末集中放话题标签提升搜索曝光。
          </p>
          <h3 class="text-lg font-semibold text-foreground">emoji 分隔怎么用</h3>
          <p>
            本工具内置 ✨🌿💡🔥📌🎀☕🛒 八套分隔模板，选择一套后一键美化会在每个段落之间插入一行分隔符，让正文呈现"标题—分隔—正文—分隔—结尾"的节奏。同一篇笔记建议只用一套模板，风格统一比花哨更重要。
          </p>
          <h3 class="text-lg font-semibold text-foreground">话题标签怎么放</h3>
          <p>
            话题标签按 #关键词# 格式书写，放在正文末尾单独区域，一般 3–6 个为宜：前 1–2 个放搜索量大的泛词，其余放精准细分词。标签也会计入 1000 字正文上限，建议正文控制在 800 字左右留出标签空间。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">小红书正文最多可以放多少字？</span>上限 1000 字（含话题标签与 emoji），超出无法发布，本工具会实时统计并提示是否超限。</li>
            <li><span class="text-foreground font-medium">为什么复制过去排版会乱？</span>多半是粘贴工具把 HTML 带了过去；本工具复制的是纯文本，只含换行与符号，粘贴后即可保留排版。</li>
            <li><span class="text-foreground font-medium">符号工具条怎么用？</span>把光标点在草稿里的目标位置，再点击「」〖〗★☆✦❤️ 等符号按钮，符号会插入光标处，适合装饰标题和重点句。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'xhs-formatter'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { PenTool, Edit3, Eye, Copy, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '小红书排版器 - 笔记正文一键美化+emoji分隔+话题标签',
  description: '在线小红书排版工具：笔记草稿一键美化，8 套 emoji 段落分隔模板、段首符号、标题符号工具条、话题标签自动生成，实时预览并一键复制纯文本，纯本地处理',
  keywords: '小红书排版, 小红书符号, 笔记排版工具, emoji分隔符, 小红书模板, 话题标签生成',
  author: 'Util工具箱',
  ogTitle: '小红书排版器 - 有条工具',
  ogDescription: '笔记正文一键美化：emoji 分隔、标题符号、话题标签，实时预览复制',
  ogUrl: 'https://www.util.cn/tools/xhs-formatter',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: '小红书排版器',
          url: 'https://www.util.cn/tools/xhs-formatter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['一键美化段落', '8 套 emoji 分隔模板', '段首符号选项', '标题符号工具条', '话题标签生成', '实时预览与纯文本复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '小红书排版器', item: 'https://www.util.cn/tools/xhs-formatter/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '小红书正文最多可以放多少字？',
              acceptedAnswer: { '@type': 'Answer', text: '上限 1000 字（含话题标签与 emoji），超出无法发布，工具会实时统计并提示是否超限。' }
            },
            {
              '@type': 'Question',
              name: '为什么复制过去排版会乱？',
              acceptedAnswer: { '@type': 'Answer', text: '多半是粘贴工具把 HTML 带了过去；本工具复制的是纯文本，只含换行与符号，粘贴后即可保留排版。' }
            },
            {
              '@type': 'Question',
              name: '符号工具条怎么用？',
              acceptedAnswer: { '@type': 'Answer', text: '把光标点在草稿里的目标位置，再点击「」〖〗★☆✦❤️ 等符号按钮，符号会插入光标处，适合装饰标题和重点句。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'xhs-formatter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const draft = ref('')
const draftRef = ref(null)
const dividerEmoji = ref('✨')
const prefixEnabled = ref(false)
const prefixSymbol = ref('🔸')
const tagsEnabled = ref(true)
const tagInput = ref('')
const previewMode = ref('card')
const seoContentVisible = ref(true)

const dividerEmojis = ['✨', '🌿', '💡', '🔥', '📌', '🎀', '☕', '🛒']
const prefixSymbols = ['🔸', '➡️', '✅', '❗', '⭐']
const toolbarSymbols = ['「', '」', '〖', '〗', '★', '☆', '✦', '❤️', '🔥', '✨', '👉', '✔️', '❗', '｜']

// ---------- 光标插入 ----------
const insertAtCursor = (sym) => {
  const el = draftRef.value
  if (!el) {
    draft.value += sym
    return
  }
  const start = el.selectionStart || 0
  const end = el.selectionEnd || 0
  draft.value = draft.value.slice(0, start) + sym + draft.value.slice(end)
  nextTick(() => {
    el.focus()
    el.selectionStart = start + sym.length
    el.selectionEnd = start + sym.length
  })
}

// ---------- 排版生成 ----------
const paragraphs = computed(() => draft.value
  .split(/\n+/)
  .map(s => s.trim())
  .filter(Boolean))

const dividerLine = computed(() => {
  const e = dividerEmoji.value
  return `${e} ${e} ${e}`
})

const tagList = computed(() => tagInput.value
  .split(/[,，、\s]+/)
  .map(s => s.trim().replace(/^#+/, ''))
  .filter(Boolean))

const formattedText = computed(() => {
  let paras = paragraphs.value
  if (!paras.length) return ''
  if (prefixEnabled.value) {
    paras = paras.map(p => `${prefixSymbol.value} ${p}`)
  }
  let out = paras.join(`\n\n${dividerLine.value}\n\n`)
  if (tagsEnabled.value && tagList.value.length) {
    out += `\n\n${tagList.value.map(t => `#${t}#`).join(' ')}`
  }
  return out
})

const charCount = computed(() => [...formattedText.value].length)

// ---------- 复制 ----------
const copyFormatted = async () => {
  if (!formattedText.value) return
  try {
    await navigator.clipboard.writeText(formattedText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = formattedText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}
</script>
