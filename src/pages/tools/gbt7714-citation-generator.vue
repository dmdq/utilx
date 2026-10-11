<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Quote class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">GB/T 7714 引文生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">按 2015 国标生成参考文献，期刊/学位论文/图书等 7 种类型，支持批量</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        填表即出符合 GB/T 7714—2015《信息与文献 参考文献著录规则》的引文条目：覆盖期刊论文 [J]、学位论文 [D]、图书 [M]、会议论文 [C]、标准 [S]、专利 [P] 与电子资源 [EB/OL] 七种常用类型；顺序编码制与著者-出版年制一键切换；3 名以上作者自动按国标处理为"前 3 名 + 等（et al.）"；支持批量增删多条并一键复制全部。全部生成在浏览器本地完成。
      </p>
    </div>

    <!-- 制式切换 -->
    <div class="flex flex-wrap items-center gap-2 mb-6">
      <span class="text-sm text-muted-foreground mr-1">标注制式：</span>
      <button
        @click="citeStyle = 'sequential'"
        :class="citeStyle === 'sequential' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >顺序编码制</button>
      <button
        @click="citeStyle = 'authordate'"
        :class="citeStyle === 'authordate' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >著者-出版年制</button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：类型与条目编辑 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BookMarked class="w-5 h-5 mr-2 text-primary" /> 添加文献条目
        </h2>

        <!-- 类型快速添加 -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(cfg, key) in typeFields"
            :key="key"
            @click="addRow(key)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
          >＋ {{ cfg.label }}</button>
        </div>

        <!-- 条目行 -->
        <div
          v-for="(row, idx) in rows"
          :key="row.id"
          class="border border-border rounded-lg p-4 space-y-3"
        >
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{{ idx + 1 }}</span>
            <select
              v-model="row.type"
              @change="resetRowValues(row)"
              class="px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option v-for="(cfg, key) in typeFields" :key="key" :value="key">{{ cfg.label }}</option>
            </select>
            <button
              @click="removeRow(row.id)"
              class="ml-auto px-2 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1"
            >
              <Trash2 class="w-3.5 h-3.5" /> 删除
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="f in typeFields[row.type].fields" :key="f.key" :class="f.full ? 'sm:col-span-2' : ''">
              <label class="block text-xs font-medium text-muted-foreground mb-1">{{ f.label }}</label>
              <input
                v-model="row.values[f.key]"
                type="text"
                class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :placeholder="f.placeholder"
              />
            </div>
          </div>

          <div v-if="rowCitation(row)" class="bg-muted/50 rounded-lg px-3 py-2.5 text-sm text-foreground leading-relaxed break-all">
            {{ rowCitation(row) }}
          </div>
        </div>

        <div v-if="!rows.length" class="p-8 text-center text-muted-foreground">
          点击上方类型按钮添加第一条文献
        </div>
      </div>

      <!-- 右侧：输出区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <ListOrdered class="w-5 h-5 mr-2 text-primary" /> 参考文献列表
        </h2>

        <div v-if="citations.length" class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="(c, i) in citations"
            :key="c.id"
            class="flex items-start gap-2 p-3 bg-muted/50 rounded-lg"
          >
            <span v-if="citeStyle === 'sequential'" class="text-xs font-bold text-primary mt-0.5 flex-shrink-0">[{{ i + 1 }}]</span>
            <p class="text-sm text-foreground leading-relaxed break-all flex-1">{{ c.text }}</p>
            <button
              @click="copyText(c.text)"
              class="flex-shrink-0 text-xs text-muted-foreground hover:text-primary transition-colors"
              title="复制本条"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div v-else class="p-8 text-center text-muted-foreground text-sm">
          填写条目后自动生成
        </div>

        <button
          v-if="citations.length"
          @click="copyAll"
          class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
        >
          <Copy class="w-4 h-4" /> 一键复制全部（{{ citations.length }} 条）
        </button>

        <p class="text-xs text-muted-foreground leading-relaxed">
          著录规则：3 名以内作者全部列出，超过 3 名列前 3 名后加"等"（英文文献用 et al.）；作者之间用逗号分隔；图书 1 版不标注版次。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>GB/T 7714 参考文献著录规范</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            GB/T 7714—2015 是我国学术论文参考文献的国家标准，几乎所有的期刊投稿与学位论文都要求按它著录。每条文献由"作者. 题名[文献类型标识]. 出版信息"构成，文献类型标识如期刊 [J]、学位论文 [D]、图书 [M]、会议论文 [C]、标准 [S]、专利 [P]、电子资源 [EB/OL]，格式错误是退修意见里最常见的问题之一。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常用类型的著录格式</h3>
          <p>
            期刊：作者. 题名[J]. 刊名, 年, 卷(期): 起止页码.；学位论文：作者. 题名[D]. 城市: 学校, 年.；图书：作者. 书名[M]. 版本(1 版不写). 城市: 出版社, 年: 页码.；会议论文：作者. 题名[C]//会议录名. 出版地: 出版者, 年: 页码.；标准：标准编号, 标准名称[S].；专利：专利申请者. 专利题名: 专利号[P]. 年-月-日.；电子资源：作者. 题名[EB/OL]. (更新日期)[引用日期]. URL。
          </p>
          <h3 class="text-lg font-semibold text-foreground">顺序编码制与著者-出版年制的区别</h3>
          <p>
            顺序编码制按引用先后顺序给文献编号，正文中用上标 [1]、[2] 标注，文献表按编号排列，是国内理工科期刊与学位论文的主流用法；著者-出版年制正文中用"（作者, 年份）"标注，文献表按作者姓氏排列，且出版年份要紧跟著者之后著录，社科类期刊使用较多。两种制式不可混用，投稿前请确认目标期刊的要求。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">3 名以上作者怎么处理？</span>3 名以内（含 3 名）作者全部列出；超过 3 名时只列前 3 名，其后加"等"，英文文献用"et al."，例如"作者一, 作者二, 作者三, 等."。</li>
            <li><span class="text-foreground font-medium">图书的版次什么时候写？</span>只有第 2 版及以后的版本才著录版次（如"2 版."），第 1 版不标注；页码为引用日期所在的可选页范围。</li>
            <li><span class="text-foreground font-medium">引用网页要注意什么？</span>电子资源 [EB/OL] 需注明"(更新日期)[引用日期]"与可访问的 URL，引用日期是您查看该网页的日期，格式为 年-月-日。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gbt7714-citation-generator'" :category="'text'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Quote, BookMarked, ListOrdered, Trash2, Copy, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'GB/T 7714 引文生成器 - 国标参考文献格式在线生成',
  description: '按 GB/T 7714—2015 国标生成参考文献：期刊[J]、学位论文[D]、图书[M]、会议论文[C]、标准[S]、专利[P]、电子资源[EB/OL] 七种类型，顺序编码制/著者-出版年制可切换，批量生成一键复制',
  keywords: '参考文献格式生成, gbt7714, 国标引文, 论文参考文献, citation生成器, 顺序编码制, 著者出版年制',
  author: 'Util工具箱',
  ogTitle: 'GB/T 7714 引文生成器 - 有条工具',
  ogDescription: '按 2015 国标生成参考文献，7 种文献类型，批量输出一键复制',
  ogUrl: 'https://www.util.cn/tools/gbt7714-citation-generator',
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
          name: 'GB/T 7714 引文生成器',
          url: 'https://www.util.cn/tools/gbt7714-citation-generator',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['7 种文献类型著录', '顺序编码制/著者-出版年制切换', '3 名以上作者自动加等', '批量增删条目', '一键复制全部']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: 'GB/T 7714 引文生成器', item: 'https://www.util.cn/tools/gbt7714-citation-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '3 名以上作者怎么处理？',
              acceptedAnswer: { '@type': 'Answer', text: '3 名以内（含 3 名）作者全部列出；超过 3 名时只列前 3 名，其后加"等"，英文文献用"et al."。' }
            },
            {
              '@type': 'Question',
              name: '顺序编码制和著者-出版年制有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '顺序编码制正文用上标 [1][2] 标注、文献表按编号排列；著者-出版年制正文用（作者, 年份）标注、年份紧跟著者，两者不可混用，以目标期刊要求为准。' }
            },
            {
              '@type': 'Question',
              name: '引用网页（电子资源）要注意什么？',
              acceptedAnswer: { '@type': 'Answer', text: '[EB/OL] 类型需注明 (更新日期)[引用日期] 与可访问的 URL，日期格式为 年-月-日，引用日期为查看网页的日期。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'gbt7714-citation-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 文献类型字段配置 ----------
const typeFields = {
  journal: {
    label: '期刊[J]',
    fields: [
      { key: 'authors', label: '作者', placeholder: '多名作者用逗号分隔', full: true },
      { key: 'title', label: '题名', placeholder: '文章题目', full: true },
      { key: 'journal', label: '刊名', placeholder: '计算机学报' },
      { key: 'year', label: '年份', placeholder: '2024' },
      { key: 'volume', label: '卷', placeholder: '47' },
      { key: 'issue', label: '期', placeholder: '5' },
      { key: 'pages', label: '起止页码', placeholder: '1001-1010' }
    ]
  },
  thesis: {
    label: '学位论文[D]',
    fields: [
      { key: 'authors', label: '作者', placeholder: '作者姓名' },
      { key: 'title', label: '题名', placeholder: '论文题目', full: true },
      { key: 'city', label: '城市', placeholder: '北京' },
      { key: 'school', label: '学校', placeholder: '某某大学' },
      { key: 'year', label: '年份', placeholder: '2024' }
    ]
  },
  book: {
    label: '图书[M]',
    fields: [
      { key: 'authors', label: '作者', placeholder: '多名作者用逗号分隔' },
      { key: 'title', label: '书名', placeholder: '图书名称', full: true },
      { key: 'edition', label: '版次（1 版不写）', placeholder: '2 版' },
      { key: 'city', label: '城市', placeholder: '北京' },
      { key: 'publisher', label: '出版社', placeholder: '某某出版社' },
      { key: 'year', label: '年份', placeholder: '2024' },
      { key: 'pages', label: '页码（可选）', placeholder: '100-120' }
    ]
  },
  conference: {
    label: '会议论文[C]',
    fields: [
      { key: 'authors', label: '作者', placeholder: '多名作者用逗号分隔' },
      { key: 'title', label: '题名', placeholder: '论文题目', full: true },
      { key: 'proceedings', label: '会议录名', placeholder: '某某会议论文集', full: true },
      { key: 'city', label: '出版地', placeholder: '北京' },
      { key: 'publisher', label: '出版者', placeholder: '某某出版社' },
      { key: 'year', label: '年份', placeholder: '2024' },
      { key: 'pages', label: '起止页码', placeholder: '55-60' }
    ]
  },
  standard: {
    label: '标准[S]',
    fields: [
      { key: 'stdNo', label: '标准编号', placeholder: 'GB/T 7714-2015' },
      { key: 'stdName', label: '标准名称', placeholder: '信息与文献 参考文献著录规则', full: true }
    ]
  },
  patent: {
    label: '专利[P]',
    fields: [
      { key: 'authors', label: '专利申请者', placeholder: '申请者姓名或单位' },
      { key: 'title', label: '专利题名', placeholder: '专利名称', full: true },
      { key: 'patentNo', label: '专利号', placeholder: 'CN202410000000.0' },
      { key: 'date', label: '公开日期', placeholder: '2024-05-10' }
    ]
  },
  electronic: {
    label: '电子资源[EB/OL]',
    fields: [
      { key: 'authors', label: '作者', placeholder: '作者或机构，可留空' },
      { key: 'title', label: '题名', placeholder: '网页标题', full: true },
      { key: 'updated', label: '更新日期（可选）', placeholder: '2024-06-01' },
      { key: 'cited', label: '引用日期', placeholder: '2024-10-01' },
      { key: 'url', label: 'URL', placeholder: 'https://example.com/page', full: true }
    ]
  }
}

const citeStyle = ref('sequential')
const seoContentVisible = ref(true)

// ---------- 条目行 ----------
let rowIdSeq = 1
const emptyValues = (type) => {
  const vals = {}
  typeFields[type].fields.forEach(f => { vals[f.key] = '' })
  return vals
}
const rows = ref([{ id: rowIdSeq++, type: 'journal', values: emptyValues('journal') }])

const addRow = (type) => {
  rows.value.push({ id: rowIdSeq++, type, values: emptyValues(type) })
}
const removeRow = (id) => {
  rows.value = rows.value.filter(r => r.id !== id)
}
const resetRowValues = (row) => {
  row.values = emptyValues(row.type)
}

// ---------- 著者格式化 ----------
const parseAuthors = (str) => (str || '')
  .split(/[,，;；、\n]+/)
  .map(s => s.trim())
  .filter(Boolean)

const formatAuthors = (str) => {
  const list = parseAuthors(str)
  if (!list.length) return ''
  const allLatin = list.every(a => /^[\x00-\x7F]+$/.test(a))
  if (list.length <= 3) return list.join(', ')
  return list.slice(0, 3).join(', ') + (allLatin ? ', et al' : ', 等')
}

// ---------- 各类型生成 ----------
const cleanTail = (s) => s.replace(/\s+\.$/, '.').replace(/\.\.$/, '.')

const hasCore = (type, v) => {
  if (type === 'standard') return !!(v.stdNo || v.stdName)
  if (type === 'patent') return !!(v.title || v.patentNo)
  return !!v.title
}

const buildCitation = (type, v, style) => {
  const a = formatAuthors(v.authors)
  const authorPart = a ? `${a}. ` : ''
  const placeYearPub = (cityKey, pubKey) => {
    let mid = v[cityKey] ? `${v[cityKey]}: ` : ''
    mid += v[pubKey] || ''
    if (v.pages) mid += `${mid ? ': ' : ''}${v.pages}`
    return mid
  }

  let text = ''
  if (type === 'journal') {
    if (style === 'authordate') {
      const volIss = v.volume && v.issue ? `${v.volume}(${v.issue})` : (v.volume || '')
      const mid = [v.journal, volIss].filter(Boolean).join(', ')
      text = `${authorPart}${v.year ? v.year + '. ' : ''}${v.title}[J]. ${mid}${v.pages ? ': ' + v.pages : ''}.`
    } else {
      const volIss = v.volume && v.issue ? `${v.volume}(${v.issue})` : (v.volume || (v.issue ? `(${v.issue})` : ''))
      const mid = [v.journal, v.year, volIss].filter(Boolean).join(', ')
      text = `${authorPart}${v.title}[J]. ${mid}${v.pages ? ': ' + v.pages : ''}.`
    }
  } else if (type === 'thesis') {
    if (style === 'authordate') {
      let mid = v.city ? `${v.city}: ` : ''
      mid += v.school || ''
      text = `${authorPart}${v.year ? v.year + '. ' : ''}${v.title}[D]. ${mid}.`
    } else {
      let mid = v.city ? `${v.city}: ` : ''
      mid += v.school || ''
      if (v.year) mid += `${v.school ? ', ' : ''}${v.year}`
      text = `${authorPart}${v.title}[D]. ${mid}.`
    }
  } else if (type === 'book') {
    const isFirst = /^(1|1st|1版|第1版|第一版)$/i.test((v.edition || '').trim())
    const ed = v.edition && !isFirst ? `${v.edition}. ` : ''
    if (style === 'authordate') {
      let mid = v.city ? `${v.city}: ` : ''
      mid += v.publisher || ''
      if (v.pages) mid += `${mid ? ': ' : ''}${v.pages}`
      text = `${authorPart}${v.year ? v.year + '. ' : ''}${v.title}[M]. ${ed}${mid}.`
    } else {
      let mid = v.city ? `${v.city}: ` : ''
      mid += v.publisher || ''
      if (v.year) mid += `${mid ? ', ' : ''}${v.year}`
      if (v.pages) mid += `: ${v.pages}`
      text = `${authorPart}${v.title}[M]. ${ed}${mid}.`
    }
  } else if (type === 'conference') {
    const proc = v.proceedings ? `${v.proceedings}. ` : ''
    if (style === 'authordate') {
      text = `${authorPart}${v.year ? v.year + '. ' : ''}${v.title}[C]//${proc}${placeYearPub('city', 'publisher')}.`
    } else {
      let mid = v.city ? `${v.city}: ` : ''
      mid += v.publisher || ''
      if (v.year) mid += `${mid ? ', ' : ''}${v.year}`
      if (v.pages) mid += `: ${v.pages}`
      text = `${authorPart}${v.title}[C]//${proc}${mid}.`
    }
  } else if (type === 'standard') {
    text = `${v.stdNo ? v.stdNo + ', ' : ''}${v.stdName}[S].`
  } else if (type === 'patent') {
    text = `${authorPart}${v.title}${v.title && v.patentNo ? ': ' : ''}${v.patentNo}[P].${v.date ? ' ' + v.date + '.' : ''}`
  } else if (type === 'electronic') {
    const dates = (v.updated ? `(${v.updated})` : '') + (v.cited ? `[${v.cited}]` : '')
    text = `${authorPart}${v.title}[EB/OL]. ${dates ? dates + '. ' : ''}${v.url || ''}${v.url ? '.' : ''}`
  }
  return cleanTail(text.replace(/\s+/g, ' ').trim())
}

const rowCitation = (row) => {
  if (!hasCore(row.type, row.values)) return ''
  return buildCitation(row.type, row.values, citeStyle.value)
}

const citations = computed(() => rows.value
  .map(row => ({ id: row.id, text: rowCitation(row) }))
  .filter(c => c.text))

const batchOutput = computed(() => citations.value
  .map((c, i) => (citeStyle.value === 'sequential' ? `[${i + 1}] ` : '') + c.text)
  .join('\n'))

// ---------- 复制 ----------
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('已复制到剪贴板')
  }
}

const copyAll = async () => {
  if (!batchOutput.value) return
  await copyText(batchOutput.value)
}
</script>
