<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Braces class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">JSON-LD结构化数据生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">按类型生成 Schema.org 结构化数据：FAQ / 面包屑 / 文章 / 商品 / 组织</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        选择结构化数据类型，填写表单即可实时生成符合 Schema.org 规范的 JSON-LD 代码，同时提供带 <code class="font-mono text-xs">&lt;script type="application/ld+json"&gt;</code> 标签的完整版本，直接粘贴到网页 head 即可参与富摘要展示。内置必填字段校验，缺失时红字提示；所有字符串值均按 JSON 规范转义。生成全部在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧：表单 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <!-- 类型切换 -->
        <div class="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          <button
            v-for="t in typeTabs"
            :key="t.value"
            @click="activeType = t.value"
            :class="activeType === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
            class="py-2 rounded-lg text-xs font-medium transition-all"
            :title="t.desc"
          >{{ t.label }}</button>
        </div>

        <!-- FAQPage 表单 -->
        <div v-if="activeType === 'faq'" class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-foreground">FAQ 问答对（{{ faqRows.length }} 条）</label>
            <button @click="addFaqRow" class="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus class="w-3.5 h-3.5" /> 添加一条
            </button>
          </div>
          <div v-for="(row, ri) in faqRows" :key="ri" class="border border-border rounded-lg p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">第 {{ ri + 1 }} 条</span>
              <button
                @click="removeFaqRow(ri)"
                class="text-muted-foreground hover:text-red-500 transition-colors"
                title="删除此条"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <input
              v-model="row.q"
              type="text"
              placeholder="问题，例如：如何申请退款？"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <textarea
              v-model="row.a"
              class="w-full h-20 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="答案内容"
            ></textarea>
          </div>
        </div>

        <!-- BreadcrumbList 表单 -->
        <div v-else-if="activeType === 'breadcrumb'" class="space-y-3">
          <label class="text-sm font-medium text-foreground">面包屑层级（自动按顺序编号 position）</label>
          <div v-for="(row, ri) in crumbRows" :key="ri" class="border border-border rounded-lg p-3 space-y-2">
            <span class="text-xs text-muted-foreground">第 {{ ri + 1 }} 级</span>
            <input
              v-model="row.name"
              type="text"
              :placeholder="'第 ' + (ri + 1) + ' 级名称，例如：首页 / 分类 / 详情'"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              v-model="row.url"
              type="text"
              placeholder="对应链接 URL"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <!-- Article 表单 -->
        <div v-else-if="activeType === 'article'" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">标题 headline *</label>
            <input
              v-model="article.headline"
              type="text"
              placeholder="文章标题"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">主图 image</label>
            <input
              v-model="article.image"
              type="text"
              placeholder="https://example.com/cover.jpg"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">作者 author *</label>
            <input
              v-model="article.author"
              type="text"
              placeholder="作者姓名"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">发布日期 *</label>
              <input
                v-model="article.datePublished"
                type="date"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">修改日期</label>
              <input
                v-model="article.dateModified"
                type="date"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">发布方 publisher</label>
            <input
              v-model="article.publisher"
              type="text"
              placeholder="网站或机构名称"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <!-- Product 表单 -->
        <div v-else-if="activeType === 'product'" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">商品名称 name *</label>
            <input
              v-model="product.name"
              type="text"
              placeholder="商品名称"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">商品图 image</label>
            <input
              v-model="product.image"
              type="text"
              placeholder="https://example.com/product.jpg"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">描述 description</label>
            <textarea
              v-model="product.description"
              class="w-full h-20 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              placeholder="商品简介"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">品牌 brand</label>
            <input
              v-model="product.brand"
              type="text"
              placeholder="品牌名称"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">价格 price *</label>
              <input
                v-model.number="product.price"
                type="number"
                step="0.01"
                min="0"
                placeholder="99.00"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">货币（固定 CNY）</label>
              <input
                type="text"
                value="CNY"
                disabled
                class="w-full px-3 py-2 bg-muted border border-input rounded-lg text-muted-foreground text-sm"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">库存状态 availability</label>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="opt in availabilityOptions"
                :key="opt.value"
                @click="product.availability = opt.value"
                :class="product.availability === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="py-2 rounded-lg text-xs font-medium transition-all"
              >{{ opt.label }}</button>
            </div>
          </div>
        </div>

        <!-- Organization 表单 -->
        <div v-else class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">组织名称 name *</label>
            <input
              v-model="org.name"
              type="text"
              placeholder="公司或组织名称"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">官网 url</label>
            <input
              v-model="org.url"
              type="text"
              placeholder="https://example.com"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">Logo</label>
            <input
              v-model="org.logo"
              type="text"
              placeholder="https://example.com/logo.png"
              class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">联系方式类型</label>
              <input
                v-model="org.contactType"
                type="text"
                placeholder="customer service"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-foreground mb-1">联系电话</label>
              <input
                v-model="org.telephone"
                type="text"
                placeholder="+86-400-000-0000"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        <!-- 校验提示 -->
        <div v-if="errors.length > 0" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-3 text-xs leading-relaxed">
          <p class="font-medium mb-1 flex items-center gap-1.5">
            <AlertTriangle class="w-3.5 h-3.5" /> 必填字段缺失（{{ errors.length }}）：
          </p>
          <ul class="list-disc pl-5 space-y-0.5">
            <li v-for="(err, ei) in errors" :key="ei">{{ err }}</li>
          </ul>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-foreground flex items-center">
            <Code class="w-5 h-5 mr-2 text-primary" /> 生成的 JSON-LD
          </h2>
          <div class="flex items-center gap-2">
            <button
              @click="copyText(jsonOutput, 'json')"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Check v-if="copiedKey === 'json'" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === 'json' ? '已复制' : '复制 JSON' }}
            </button>
            <button
              @click="copyText(wrappedOutput, 'wrapped')"
              class="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5"
            >
              <Check v-if="copiedKey === 'wrapped'" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === 'wrapped' ? '已复制' : '复制 script 标签' }}
            </button>
          </div>
        </div>

        <pre class="w-full h-72 overflow-auto bg-muted/30 border border-border rounded-lg p-3 text-xs font-mono whitespace-pre text-foreground">{{ jsonOutput }}</pre>

        <p class="text-xs text-muted-foreground mt-4 mb-1.5">带标签的完整版本（粘贴到页面 head 或 body）：</p>
        <pre class="w-full h-40 overflow-auto bg-muted/30 border border-border rounded-lg p-3 text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">{{ wrappedOutput }}</pre>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 JSON-LD 结构化数据</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            JSON-LD 是 Schema.org 推荐的结构化数据格式：一段放在页面里的 JSON 脚本，向搜索引擎声明「这个页面是什么」。正确部署后，搜索结果可能出现 FAQ 折叠面板、面包屑路径、商品价格星级、文章作者日期等富摘要样式，显著提高点击率。本工具覆盖最常用的五种类型，填表即出码，无需手写。
          </p>
          <h3 class="text-lg font-semibold text-foreground">五种类型怎么选</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>FAQPage：帮助中心、产品答疑页，搜索结果可展开问答</li>
            <li>BreadcrumbList：任意多层级站点，替代 URL 显示面包屑路径</li>
            <li>Article：博客、资讯文章，展示作者、日期等署名信息</li>
            <li>Product：电商商品页，展示价格、库存状态（货币固定 CNY）</li>
            <li>Organization：官网首页，声明品牌名称、Logo 与联系方式</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">使用步骤</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <li>选择类型并填写表单，缺失必填字段会红字提示</li>
            <li>复制带 <code class="font-mono">&lt;script type="application/ld+json"&gt;</code> 标签的完整版本</li>
            <li>粘贴到目标页面的 head 或 body 中，部署后用 Google 富媒体测试工具验证</li>
          </ol>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">JSON-LD 要放在页面哪个位置？</span>head 或 body 均可，Google 官方推荐放在 head；一页可以放多段不同类型的 JSON-LD。</li>
            <li><span class="text-foreground font-medium">生成后怎么验证？</span>先用本页的校验提示确认必填字段完整，再把代码粘到 Google Rich Results Test 或 Schema.org 官方校验器做最终验证。</li>
            <li><span class="text-foreground font-medium">加了这个就一定显示富摘要吗？</span>不一定。结构化数据只是资格条件，搜索引擎还会综合站点质量、内容相关性决定是否以及如何展示。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'json-ld-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Braces, Code, Copy, Check, Plus, Trash2,
  AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'JSON-LD结构化数据生成器 - FAQ/面包屑/文章/商品/组织',
  description: '在线 JSON-LD 结构化数据生成器，支持 FAQPage、BreadcrumbList、Article、Product、Organization 五种 Schema.org 类型，表单实时生成、必填校验红字提示、script 标签一键复制，纯本地处理',
  keywords: 'json-ld生成器, 结构化数据生成, schema.org, FAQPage, 富摘要',
  author: 'Util工具箱',
  ogTitle: 'JSON-LD结构化数据生成器 - 有条工具',
  ogDescription: '五种类型表单化生成 Schema.org JSON-LD，附必填校验',
  ogUrl: 'https://www.util.cn/tools/json-ld-generator',
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
          name: 'JSON-LD结构化数据生成器',
          url: 'https://www.util.cn/tools/json-ld-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五种 Schema.org 类型', '表单实时生成', '必填字段校验', 'script 标签一键复制', 'JSON 转义保证合法']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'JSON-LD结构化数据生成器', item: 'https://www.util.cn/tools/json-ld-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'JSON-LD 要放在页面哪个位置？',
              acceptedAnswer: { '@type': 'Answer', text: 'head 或 body 均可，Google 官方推荐放在 head；一页可以放多段不同类型的 JSON-LD。' }
            },
            {
              '@type': 'Question',
              name: '生成后怎么验证？',
              acceptedAnswer: { '@type': 'Answer', text: '先用本页的校验提示确认必填字段完整，再把代码粘到 Google Rich Results Test 或 Schema.org 官方校验器做最终验证。' }
            },
            {
              '@type': 'Question',
              name: '加了这个就一定显示富摘要吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不一定。结构化数据只是资格条件，搜索引擎还会综合站点质量、内容相关性决定是否以及如何展示。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'json-ld-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const activeType = ref('faq')
const seoContentVisible = ref(true)
const copiedKey = ref('')
let copyTimer = null

const typeTabs = [
  { value: 'faq', label: 'FAQPage', desc: '常见问题' },
  { value: 'breadcrumb', label: '面包屑', desc: 'BreadcrumbList' },
  { value: 'article', label: '文章', desc: 'Article' },
  { value: 'product', label: '商品', desc: 'Product' },
  { value: 'organization', label: '组织', desc: 'Organization' }
]

const availabilityOptions = [
  { value: 'InStock', label: '有货' },
  { value: 'OutOfStock', label: '缺货' },
  { value: 'PreOrder', label: '预售' }
]

const faqRows = ref([
  { q: '', a: '' },
  { q: '', a: '' }
])

const crumbRows = ref([
  { name: '', url: '' },
  { name: '', url: '' },
  { name: '', url: '' }
])

const article = ref({
  headline: '',
  image: '',
  author: '',
  datePublished: '',
  dateModified: '',
  publisher: ''
})

const product = ref({
  name: '',
  image: '',
  description: '',
  brand: '',
  price: null,
  availability: 'InStock'
})

const org = ref({
  name: '',
  url: '',
  logo: '',
  contactType: '',
  telephone: ''
})

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// ---------- 行操作 ----------
const addFaqRow = () => {
  faqRows.value.push({ q: '', a: '' })
}

const removeFaqRow = (i) => {
  if (faqRows.value.length > 1) {
    faqRows.value.splice(i, 1)
  }
}

// ---------- 生成 ----------
const trim = (v) => String(v == null ? '' : v).trim()

const pickDefined = (obj) => {
  const out = {}
  for (const key of Object.keys(obj)) {
    const v = obj[key]
    if (v === undefined || v === null || v === '') continue
    out[key] = v
  }
  return out
}

const buildLd = () => {
  if (activeType.value === 'faq') {
    const rows = faqRows.value.filter(r => trim(r.q) !== '' || trim(r.a) !== '')
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: rows.map(r => ({
        '@type': 'Question',
        name: trim(r.q),
        acceptedAnswer: { '@type': 'Answer', text: trim(r.a) }
      }))
    }
  }
  if (activeType.value === 'breadcrumb') {
    const rows = crumbRows.value.filter(r => trim(r.name) !== '' || trim(r.url) !== '')
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: rows.map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: trim(r.name),
        item: trim(r.url)
      }))
    }
  }
  if (activeType.value === 'article') {
    const a = article.value
    return pickDefined({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: trim(a.headline) || undefined,
      image: trim(a.image) ? [trim(a.image)] : undefined,
      author: trim(a.author) ? { '@type': 'Person', name: trim(a.author) } : undefined,
      datePublished: a.datePublished || undefined,
      dateModified: a.dateModified || undefined,
      publisher: trim(a.publisher) ? { '@type': 'Organization', name: trim(a.publisher) } : undefined
    })
  }
  if (activeType.value === 'product') {
    const p = product.value
    return pickDefined({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: trim(p.name) || undefined,
      image: trim(p.image) || undefined,
      description: trim(p.description) || undefined,
      brand: trim(p.brand) ? { '@type': 'Brand', name: trim(p.brand) } : undefined,
      offers: {
        '@type': 'Offer',
        price: p.price === null || p.price === '' ? '' : String(p.price),
        priceCurrency: 'CNY',
        availability: 'https://schema.org/' + (p.availability || 'InStock')
      }
    })
  }
  const o = org.value
  return pickDefined({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: trim(o.name) || undefined,
    url: trim(o.url) || undefined,
    logo: trim(o.logo) || undefined,
    contactPoint: (trim(o.contactType) || trim(o.telephone))
      ? {
          '@type': 'ContactPoint',
          contactType: trim(o.contactType),
          telephone: trim(o.telephone)
        }
      : undefined
  })
}

const jsonOutput = computed(() => JSON.stringify(buildLd(), null, 2))

const wrappedOutput = computed(() => {
  return '<script type="application/ld+json">\n' + jsonOutput.value + '\n<' + '/script>'
})

// ---------- 校验 ----------
const errors = computed(() => {
  const errs = []
  if (activeType.value === 'faq') {
    if (faqRows.value.length === 0) {
      errs.push('至少保留一条 FAQ')
    }
    faqRows.value.forEach((r, i) => {
      if (trim(r.q) === '') errs.push('第 ' + (i + 1) + ' 条 FAQ 缺少问题')
      if (trim(r.a) === '') errs.push('第 ' + (i + 1) + ' 条 FAQ 缺少答案')
    })
  } else if (activeType.value === 'breadcrumb') {
    crumbRows.value.forEach((r, i) => {
      if (trim(r.name) === '') errs.push('第 ' + (i + 1) + ' 级缺少名称')
      if (trim(r.url) === '') errs.push('第 ' + (i + 1) + ' 级缺少链接 URL')
    })
  } else if (activeType.value === 'article') {
    if (trim(article.value.headline) === '') errs.push('缺少标题 headline')
    if (trim(article.value.author) === '') errs.push('缺少作者 author')
    if (!article.value.datePublished) errs.push('缺少发布日期 datePublished')
  } else if (activeType.value === 'product') {
    if (trim(product.value.name) === '') errs.push('缺少商品名称 name')
    if (product.value.price === null || product.value.price === '' || isNaN(Number(product.value.price))) errs.push('缺少有效价格 price')
  } else {
    if (trim(org.value.name) === '') errs.push('缺少组织名称 name')
  }
  return errs
})

// ---------- 复制 ----------
const copyText = async (text, key) => {
  if (!text) return
  let ok = false
  try {
    await navigator.clipboard.writeText(text)
    ok = true
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      ok = true
    } catch (e2) {
      ok = false
    }
  }
  if (ok) {
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  }
}
</script>
