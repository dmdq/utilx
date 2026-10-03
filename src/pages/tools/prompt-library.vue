<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sparkles class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Prompt提示词库</h1>
          <p class="text-sm text-muted-foreground mt-1">常用提示词模板分类管理，变量填充一键复制</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        内置写作、编程、翻译、学习、办公五类高频提示词模板，支持 {变量} 占位符快速填充；可添加自己的常用提示词，数据保存在本机浏览器，支持 JSON 导入导出。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：分类与自定义 -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-lg p-5">
          <h2 class="text-sm font-semibold text-foreground mb-3">分类</h2>
          <div class="space-y-1.5">
            <button
              v-for="cat in allCategories"
              :key="cat"
              @click="activeCategory = cat"
              class="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-sm transition-all"
              :class="activeCategory === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'"
            >
              <span>{{ cat }}</span>
              <span class="text-xs opacity-70">{{ countOf(cat) }}</span>
            </button>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 class="text-sm font-semibold text-foreground flex items-center">
            <Plus class="w-4 h-4 mr-1.5 text-primary" /> 添加自定义提示词
          </h2>
          <input v-model="newTitle" type="text" placeholder="名称"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <textarea v-model="newContent" rows="4" placeholder="内容，可用 {变量} 占位，例如：帮我润色这段{内容}，语气更{语气}"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"></textarea>
          <div class="flex gap-2">
            <button @click="addPrompt" :disabled="!newTitle.trim() || !newContent.trim()"
              class="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground transition-all">
              添加
            </button>
            <label class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-xs cursor-pointer transition-all flex items-center">
              <Upload class="w-3.5 h-3.5" />
              <input type="file" accept=".json" class="hidden" @change="importPrompts" />
            </label>
            <button @click="exportPrompts" class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-xs transition-all flex items-center">
              <Download class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：提示词列表 -->
      <div class="lg:col-span-2 space-y-4">
        <div v-if="filteredPrompts.length === 0" class="bg-card border border-border rounded-lg p-14 text-center">
          <Sparkles class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">该分类暂无提示词</p>
        </div>

        <div
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          class="bg-card border border-border rounded-lg p-5"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <h3 class="text-base font-semibold text-foreground">{{ prompt.title }}</h3>
            <div class="flex items-center gap-1 flex-shrink-0">
              <button v-if="prompt.custom" @click="removePrompt(prompt.id)"
                class="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="删除">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p v-if="prompt.desc" class="text-xs text-muted-foreground mb-3">{{ prompt.desc }}</p>
          <p class="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{{ prompt.content }}</p>

          <!-- 变量填充 -->
          <div v-if="extractVars(prompt.content).length > 0" class="mt-3 space-y-2">
            <div v-for="v in extractVars(prompt.content)" :key="prompt.id + '-' + v" class="flex items-center gap-2">
              <span class="text-xs font-mono text-primary w-24 truncate" :title="v">{{ '{' + v + '}' }}</span>
              <input
                v-model="varValues[prompt.id + '-' + v]"
                type="text"
                :placeholder="'填写 ' + v"
                class="flex-1 px-2.5 py-1.5 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button @click="copyFilled(prompt)"
              class="mt-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-1.5">
              <Copy class="w-3.5 h-3.5" /> 填充并复制
            </button>
          </div>
          <button v-else @click="copyRaw(prompt)"
            class="mt-3 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-1.5">
            <Copy class="w-3.5 h-3.5" /> 复制提示词
          </button>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于提示词模板</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>高质量提示词通常包含四要素：明确的角色设定、具体任务描述、约束条件与输出格式。把验证过效果好的提示词沉淀为模板、变量化高频替换的部分，是团队与个人提效 AI 使用最直接的方式。</p>
          <h3 class="text-lg font-semibold text-foreground">使用建议</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>同一任务至少迭代三个版本再固化为模板</li>
            <li>变量占位用 {花括号} 包裹，工具会自动识别生成填充框</li>
            <li>自定义提示词保存在本机，通过导出 JSON 与团队共享</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'prompt-library'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import {
  Sparkles, Plus, Copy, Trash2, Upload, Download, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: 'Prompt提示词库 - AI提示词模板分类管理与变量填充',
  description: '在线提示词模板库，内置写作/编程/翻译/学习/办公五类高频AI提示词，支持变量占位填充与自定义提示词管理，数据保存本机',
  keywords: '提示词库, prompt模板, ai提示词, chatgpt提示词, 提示词管理, 提示词工程',
  author: 'Util工具箱',
  ogTitle: 'Prompt提示词库 - 有条工具',
  ogDescription: '常用提示词模板分类管理，变量填充一键复制',
  ogUrl: 'https://www.util.cn/tools/prompt-library',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: 'Prompt提示词库', url: 'https://www.util.cn/tools/prompt-library', applicationCategory: 'ProductivityApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['分类模板', '变量填充', '自定义管理', 'JSON导入导出'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '文本处理', item: 'https://www.util.cn/text/' },
          { '@type': 'ListItem', position: 3, name: 'Prompt提示词库', item: 'https://www.util.cn/tools/prompt-library/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'prompt-library')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  loadCustom()
})

// ---------- 内置模板 ----------
let builtinSeq = 0
const builtin = [
  { cat: '写作', title: '文章润色', desc: '保持原意提升表达', content: '你是一名资深中文编辑。请润色以下文字：纠正语病、提升流畅度与节奏感，不改变原意与写作意图。输出润色后的全文，最后用三条要点说明主要修改。\n\n{原文}' },
  { cat: '写作', title: '标题生成', desc: '一次产出多风格备选', content: '为以下内容生成 10 个标题：5 个简洁直接型、3 个悬念好奇型、2 个数字清单型。每个不超过 20 字，并标注适合的平台（公众号/知乎/小红书）。\n\n内容：{内容}' },
  { cat: '写作', title: '周报生成', desc: '流水账变结构化汇报', content: '把以下工作记录整理成周报，结构为：本周成果（按重要性排序，量化结果）、进行中事项（标注进度与风险）、下周计划。语言精炼，突出业务价值而非过程。\n\n工作记录：{流水账}' },
  { cat: '编程', title: '代码评审', desc: '按严重度分级给意见', content: '作为资深工程师评审以下代码：按 P0（必须修复）到 P3（建议）分级列出问题，每个问题给出位置、原因和修改示例。关注正确性、边界条件、安全与性能，不要纠结风格问题。\n\n```\n{代码}\n```' },
  { cat: '编程', title: '报错分析', desc: '定位根因给修复方案', content: '我在执行{操作}时遇到以下报错。请：1）解释报错的根本原因（而非表面信息）；2）给出修复方案（推荐方案 + 备选）；3）说明如何验证修复生效。\n\n报错信息：\n{报错}\n\n相关代码：\n```\n{代码}\n```' },
  { cat: '编程', title: '正则生成', desc: '带测试用例的正则', content: '编写一个匹配{需求描述}的正则表达式。输出：正则本体、各部分解释、5 个应匹配示例与 5 个不应匹配示例，并指出可能的边界陷阱与 ReDoS 风险。' },
  { cat: '翻译', title: '专业翻译', desc: '译文 + 术语表', content: '将以下{源语言}文本翻译为{目标语言}。要求：专业术语准确（首次出现附原文）、保留原文格式与代码、语气与原文一致。输出译文后附术语对照表。\n\n{文本}' },
  { cat: '翻译', title: '中文化改写', desc: '消除翻译腔', content: '以下文本是机器翻译或翻译腔严重的中文，请改写为地道、自然的中文表达，符合中文语序与用词习惯，专业术语保留通用译法。\n\n{文本}' },
  { cat: '学习', title: '费曼式讲解', desc: '用类比讲透概念', content: '用费曼学习法讲解「{概念}」：1）先用一句大白话概括本质；2）用一个生活类比解释原理；3）指出最常见的三个误解；4）给一道自测题（附答案）。目标读者是{读者水平}。' },
  { cat: '学习', title: '论文速读', desc: '三遍读法结构化摘要', content: '按三遍读法摘要这篇论文：第一遍（分类、背景、贡献、结论）；第二遍（方法框架、关键图表解释、实验设计与指标）；第三遍（局限性、可复现性、可借鉴点）。面向{读者背景}。\n\n论文内容：\n{论文}' },
  { cat: '学习', title: '出题自测', desc: '按难度分层的练习题', content: '围绕「{知识点}」出 10 道自测题：4 道基础概念、4 道应用分析、2 道综合难题。每题附详细解析。题目之间不重复考察同一细节。' },
  { cat: '办公', title: '邮件代拟', desc: '得体的商务邮件', content: '帮我写一封{邮件类型}邮件。背景：{背景说明}。收件人是{收件人身份}，希望达成的目标是{目标}。语气得体、简洁，附主题行；如有请求事项，明确列出便于对方行动。' },
  { cat: '办公', title: '会议纪要', desc: '从录音转写提炼', content: '把以下会议转写整理成纪要：议题列表、每个议题的讨论要点与结论、行动项（负责人 + 截止时间）、待定事项。未参会的管理层也能 3 分钟读完。\n\n转写内容：\n{转写}' },
  { cat: '办公', title: 'SWOT分析', desc: '结构化决策辅助', content: '对「{事项}」做 SWOT 分析：优势、劣势、机会、威胁各 3-5 条，要求基于事实而非套话；最后给出基于分析的行动建议（利用优势抓机会 / 补短板防风险的各 1-2 条）。' }
].map(t => ({ id: 'b-' + (++builtinSeq), custom: false, category: t.cat, ...t }))

const STORAGE_KEY = 'prompt-library-custom'
const customPrompts = ref([])
const allCategories = ['写作', '编程', '翻译', '学习', '办公', '我的']
const activeCategory = ref('写作')
const newTitle = ref('')
const newContent = ref('')
const varValues = reactive({})
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const prompts = computed(() => [...builtin, ...customPrompts.value])

const loadCustom = () => {
  if (!process.client) return
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (Array.isArray(data)) customPrompts.value = data.map(p => ({ ...p, custom: true }))
  } catch (e) { /* 忽略 */ }
}

const persistCustom = () => {
  if (!process.client) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customPrompts.value.map(({ custom, ...rest }) => rest)))
  } catch (e) { /* 忽略 */ }
}

const addPrompt = () => {
  if (!newTitle.value.trim() || !newContent.value.trim()) return
  customPrompts.value.push({ id: 'c-' + Date.now(), custom: true, category: '我的', title: newTitle.value.trim(), desc: '自定义', content: newContent.value })
  persistCustom()
  newTitle.value = ''
  newContent.value = ''
  activeCategory.value = '我的'
}

const removePrompt = (id) => {
  if (!confirm('确定删除该自定义提示词吗？')) return
  customPrompts.value = customPrompts.value.filter(p => p.id !== id)
  persistCustom()
}

const filteredPrompts = computed(() => {
  if (activeCategory.value === '我的') return customPrompts.value
  return prompts.value.filter(p => p.category === activeCategory.value)
})

const countOf = (cat) => cat === '我的' ? customPrompts.value.length : builtin.filter(p => p.cat === cat).length

// ---------- 变量填充 ----------
const extractVars = (content) => {
  const vars = new Set()
  for (const m of content.matchAll(/\{([^{}\n]{1,20})\}/g)) vars.add(m[1])
  return [...vars]
}

const fillVars = (prompt) => {
  let out = prompt.content
  for (const v of extractVars(prompt.content)) {
    const val = varValues[prompt.id + '-' + v] || ''
    out = out.split(`{${v}}`).join(val || `{${v}}`)
  }
  return out
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('已复制到剪贴板')
  }
}

const copyFilled = (prompt) => copyText(fillVars(prompt))
const copyRaw = (prompt) => copyText(prompt.content)

// ---------- 导入导出 ----------
const exportPrompts = () => {
  const blob = new Blob([JSON.stringify(customPrompts.value.map(({ custom, ...rest }) => rest), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'my-prompts.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const importPrompts = async (e) => {
  const f = e.target.files?.[0]
  if (!f) return
  try {
    const data = JSON.parse(await f.text())
    if (!Array.isArray(data)) throw new Error('bad')
    const valid = data.filter(p => p.title && p.content)
    customPrompts.value = valid.map((p, i) => ({ id: 'c-' + Date.now() + '-' + i, custom: true, category: '我的', title: p.title, desc: p.desc || '导入', content: p.content }))
    persistCustom()
    activeCategory.value = '我的'
    alert(`已导入 ${valid.length} 条`)
  } catch (err) {
    alert('导入失败：文件格式不正确')
  }
  e.target.value = ''
}
</script>
