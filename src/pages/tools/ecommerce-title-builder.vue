<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Type class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">电商标题组合生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">词根笛卡尔积批量出标题，实时字数限流与去重</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        把标题拆成「类目词 × 属性词 × 卖点词 × 颜色词」等词根组，工具按组序做全组合并拼接成商品标题：
        自动去重、按字数上限（淘系默认 30 字）过滤标红、支持自定义连接符与随机打乱，单条或一键复制全部。
        最多输出 5000 条，全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 词根组管理 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <ListTree class="w-5 h-5 mr-2 text-primary" /> 词根组
          </h2>
          <button
            @click="addGroup"
            :disabled="groups.length >= 8"
            class="text-sm text-primary hover:underline disabled:opacity-40 disabled:no-underline"
          >
            + 添加词根组
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="(group, i) in groups" :key="i" class="flex items-center gap-2">
            <span class="w-14 text-xs text-muted-foreground flex-shrink-0">组{{ i + 1 }}</span>
            <input
              v-model="groups[i]"
              type="text"
              class="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              :placeholder="groupPlaceholder"
            />
            <button
              @click="removeGroup(i)"
              :disabled="groups.length <= 1"
              class="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground"
              aria-label="删除该词根组"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          每组一行，词与词之间用英文或中文逗号分隔；组合时组间顺序按组序固定，例如组1×组2×组3 依次拼接。
          空组会被自动跳过。
        </p>

        <!-- 组合选项 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">字数上限</label>
            <input v-model.number="limit" type="number" min="1" max="60" step="1" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <p class="text-xs text-muted-foreground mt-1">淘系标题上限 30 字</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">组间连接符</label>
            <input v-model="connector" type="text" maxlength="4" class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="默认直接连接" />
            <p class="text-xs text-muted-foreground mt-1">如空格或「/」，留空为直接拼接</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input v-model="shuffleEnabled" type="checkbox" id="shuffle" class="w-4 h-4 rounded border-border" />
          <label for="shuffle" class="text-sm text-foreground">生成后随机打乱顺序</label>
        </div>

        <button
          @click="generate"
          class="w-full py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center justify-center gap-1.5"
        >
          <Sparkles class="w-4 h-4" /> 生成标题组合
        </button>
      </div>

      <!-- 生成结果 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <List class="w-5 h-5 mr-2 text-primary" /> 生成结果
          </h2>
          <button
            v-if="results.length > 0"
            @click="copyAll"
            class="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Copy class="w-3.5 h-3.5" /> 复制全部
          </button>
        </div>

        <!-- 统计条 -->
        <div v-if="rawTotal > 0" class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-muted/50 rounded-lg p-2.5">
            <p class="text-[10px] text-muted-foreground mb-1">组合总数</p>
            <p class="text-sm font-bold text-foreground">{{ fmtNum(rawTotal) }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-2.5">
            <p class="text-[10px] text-muted-foreground mb-1">去重后输出</p>
            <p class="text-sm font-bold text-primary">{{ fmtNum(results.length) }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-2.5">
            <p class="text-[10px] mb-1" :class="overCount > 0 ? 'text-red-500' : 'text-muted-foreground'">超长标红</p>
            <p class="text-sm font-bold" :class="overCount > 0 ? 'text-red-500' : 'text-foreground'">{{ fmtNum(overCount) }}</p>
          </div>
        </div>

        <p v-if="truncated" class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
          组合数已达 5000 条上限，仅输出前 5000 条；请拆分词根组或减少组内词数后分批生成。
        </p>

        <!-- 列表 -->
        <div v-if="items.length > 0" class="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          <div
            v-for="(item, i) in items"
            :key="item.title"
            class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 group"
            :class="item.over ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted/50'"
          >
            <span class="text-xs text-muted-foreground w-8 flex-shrink-0">{{ i + 1 }}.</span>
            <span class="flex-1 text-sm truncate" :class="item.over ? 'text-red-500' : 'text-foreground'">{{ item.title }}</span>
            <span class="text-xs flex-shrink-0" :class="item.over ? 'text-red-500 font-semibold' : 'text-muted-foreground'">{{ item.len }}字</span>
            <button
              @click="copyOne(item.title)"
              class="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              aria-label="复制该标题"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div v-else class="p-8 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          填写词根组后点击「生成标题组合」
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于电商标题组合</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            电商标题的本质是「关键词覆盖 × 可读性」：把类目词、属性词、卖点词、颜色词等词根分组成矩阵，
            全组合后逐一检查字数，就能在平台字数上限内批量产出备选标题。淘系商品标题上限 30 字（60 字符），
            超长标题无法提交，所以字数过滤是组合环节的关键一步。
          </p>
          <h3 class="text-lg font-semibold text-foreground">词根组怎么拆</h3>
          <p>
            推荐按「互斥维度」分组：组1 放类目主词（连衣裙、裙子），组2 放时间/季节词（夏季、2026新款），
            组3 放卖点词（显瘦、收腰），组4 放颜色词（白色、黑色）。同组内是「或」的关系，组与组之间是「且」的拼接关系，
            组合顺序按组序固定，保证读起来符合中文语序。
          </p>
          <h3 class="text-lg font-semibold text-foreground">去重与字数规则</h3>
          <p>
            组合结果会先按整条标题去重（不同词根拼出相同标题只保留一条），再按字数上限检查：
            未超长的条目正常列出，超长条目标红并计数，方便反向精简词根。随机打乱可用于分批上架时打散顺序，
            避免同款标题集中出现。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">组合数量为什么被截断了？</span>词根组一多组合数会指数级增长（如 4 组各 5 词即 625 条），为避免卡顿本工具单次最多输出 5000 条，建议精简词根分批生成。</li>
            <li><span class="text-foreground font-medium">字数怎么统计的？</span>按可见字符计数，一个汉字、一个字母或数字都算 1 字，与淘系 30 字上限的统计口径一致。</li>
            <li><span class="text-foreground font-medium">生成的标题能直接用吗？</span>组合只保证覆盖关键词与字数合规，仍需人工检查通顺度与平台禁用词（如「最」「第一」等极限词），避免被平台判违规。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ecommerce-title-builder'" :category="'text'" />

    <!-- 复制成功提示 -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition duration-200"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="copyMsg"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-foreground text-background text-sm shadow-lg"
        >
          {{ copyMsg }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Type, ListTree, List, Sparkles, Copy, Trash2,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '电商标题组合生成器 - 词根排列组合与30字限流',
  description: '在线电商标题组合生成器，词根组笛卡尔积批量生成商品标题，自动去重、30字上限过滤标红、自定义连接符与随机打乱，支持单条与全部复制，纯本地计算',
  keywords: '标题组合生成, 淘宝标题优化, 关键词组合, 电商标题, 30字标题, 词根组合',
  author: 'Util工具箱',
  ogTitle: '电商标题组合生成器 - 有条工具',
  ogDescription: '词根笛卡尔积批量出标题，实时字数限流与去重',
  ogUrl: 'https://www.util.cn/tools/ecommerce-title-builder',
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
          name: '电商标题组合生成器',
          url: 'https://www.util.cn/tools/ecommerce-title-builder',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['词根组笛卡尔积组合', '整条标题去重', '30字上限过滤标红', '自定义组间连接符', '随机打乱顺序', '单条与全部复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '文本工具', item: 'https://www.util.cn/text/' },
            { '@type': 'ListItem', position: 3, name: '电商标题组合生成器', item: 'https://www.util.cn/tools/ecommerce-title-builder/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '组合数量为什么被截断了？',
              acceptedAnswer: { '@type': 'Answer', text: '组合数随词根组指数级增长，为避免卡顿单次最多输出5000条，建议精简词根分批生成。' }
            },
            {
              '@type': 'Question',
              name: '字数怎么统计的？',
              acceptedAnswer: { '@type': 'Answer', text: '按可见字符计数，汉字、字母、数字均计1字，与淘系30字上限口径一致。' }
            },
            {
              '@type': 'Question',
              name: '生成的标题能直接用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '组合只保证关键词覆盖与字数合规，上架前仍需人工检查通顺度与平台禁用极限词。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ecommerce-title-builder')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
  generate()
})

// ---------- 常量与状态 ----------
const MAX_RESULTS = 5000
const groups = ref([
  '连衣裙,裙子',
  '夏季,2026新款',
  '显瘦,收腰',
  '白色,黑色'
])
const limit = ref(30)
const connector = ref('')
const shuffleEnabled = ref(false)
const results = ref([])
const rawTotal = ref(0)
const dedupeRemoved = ref(0)
const truncated = ref(false)
const seoContentVisible = ref(true)
const groupPlaceholder = '词与词用逗号分隔，如：白色,黑色'

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 词根解析 ----------
const parseGroup = (line) => String(line || '')
  .split(/[,，]/)
  .map(s => s.trim())
  .filter(Boolean)

const addGroup = () => {
  if (groups.value.length < 8) groups.value.push('')
}
const removeGroup = (i) => {
  if (groups.value.length > 1) groups.value.splice(i, 1)
}

// ---------- 字数过滤（与 node 自测用例保持一致） ----------
const charLen = (s) => [...String(s)].length
const filterByLimit = (list, lim) => {
  const ok = []
  const over = []
  for (const title of list) {
    if (charLen(title) <= lim) ok.push(title)
    else over.push(title)
  }
  return { ok, over }
}

// ---------- 生成（Math.random 仅在点击回调内使用） ----------
const generate = () => {
  const wordGroups = groups.value.map(parseGroup).filter(g => g.length > 0)
  if (wordGroups.length === 0) {
    results.value = []
    rawTotal.value = 0
    dedupeRemoved.value = 0
    truncated.value = false
    return
  }

  rawTotal.value = wordGroups.reduce((p, g) => p * g.length, 1)

  const seen = new Set()
  const out = []
  let dupCount = 0
  let hitCap = false

  const walk = (idx, parts) => {
    if (hitCap) return
    if (idx === wordGroups.length) {
      const title = parts.join(connector.value)
      if (seen.has(title)) {
        dupCount += 1
        return
      }
      seen.add(title)
      if (out.length >= MAX_RESULTS) {
        hitCap = true
        return
      }
      out.push(title)
      return
    }
    for (let i = 0; i < wordGroups[idx].length; i++) {
      parts.push(wordGroups[idx][i])
      walk(idx + 1, parts)
      parts.pop()
      if (hitCap) return
    }
  }
  walk(0, [])

  dedupeRemoved.value = dupCount
  truncated.value = hitCap

  let list = out
  if (shuffleEnabled.value) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = list[i]
      list[i] = list[j]
      list[j] = tmp
    }
  }
  results.value = list
}

const items = computed(() => results.value.map(title => {
  const len = charLen(title)
  return { title, len, over: len > limit.value }
}))
const overCount = computed(() => items.value.filter(it => it.over).length)

// ---------- 复制 ----------
const copyMsg = ref('')
const copyText = async (content, msg) => {
  try {
    await navigator.clipboard.writeText(content)
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  copyMsg.value = msg
  setTimeout(() => { copyMsg.value = '' }, 1500)
}
const copyOne = (title) => copyText(title, '已复制该标题')
const copyAll = () => copyText(results.value.join('\n'), `已复制全部 ${results.value.length} 条（换行分隔）`)

// ---------- 格式 ----------
const fmtNum = (v) => (isFinite(v) ? v.toLocaleString('zh-CN') : '—')
</script>

