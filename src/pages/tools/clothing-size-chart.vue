<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Ruler class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">衣物尺码中外对照表</h1>
          <p class="text-sm text-muted-foreground mt-1">男女装与鞋码的中国/欧/美/英互查，海淘网购必备</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        整理成人男女装（S ~ 3XL）与男鞋的"中国码 / 欧码 / 美码 / 英码"对照关系，支持按已知任一码反查整行。注意：各品牌有差异，以商品尺码表为准，本表仅提供通用换算参考。
      </p>
    </div>

    <!-- 类型切换 -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="setTab(t.key)"
        :class="activeTab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >{{ t.label }}</button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <!-- 反查 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <ArrowLeftRight class="w-5 h-5 mr-2 text-primary" /> 尺码反查
        </h2>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">已知尺码类型</label>
          <select
            v-model="lookupField"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="f in activeFields" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">输入尺码</label>
          <input
            v-model="lookupValue"
            type="text"
            :placeholder="activeFieldObj.placeholder"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div v-if="lookupResult" class="bg-primary/10 rounded-lg p-4 space-y-2">
          <p class="text-xs text-muted-foreground">查询结果（{{ activeTabLabel }}）</p>
          <div v-for="c in resultColumns" :key="c.key" class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">{{ c.label }}</span>
            <span class="font-bold" :class="c.key === lookupField ? 'text-primary' : 'text-foreground'">{{ c.value }}</span>
          </div>
        </div>
        <div v-else-if="lookupValue.trim()" class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-400">
          没有匹配到尺码，请检查输入（如欧码 46-56、美码 34-44 等范围内）
        </div>
        <div v-else class="p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
          输入已知尺码，自动显示所有对应码
        </div>
      </div>

      <!-- 对照表 -->
      <div class="lg:col-span-3 bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center text-foreground mb-1">
          <Shirt v-if="activeTab !== 'shoes'" class="w-5 h-5 mr-2 text-primary" />
          <Footprints v-else class="w-5 h-5 mr-2 text-primary" />
          {{ activeTabLabel }}对照表
        </h2>
        <p class="text-xs text-muted-foreground mb-4">各品牌有差异，以商品尺码表为准</p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground border-b border-border">
                <th v-for="h in tableHeaders" :key="h.key" class="py-2 pr-3 font-medium">{{ h.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in activeRows"
                :key="i"
                :class="lookupResult === row ? 'bg-primary/10' : ''"
                class="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td v-for="h in tableHeaders" :key="h.key" class="py-2.5 pr-3" :class="h.key === 'size' || h.key === 'cn' ? 'font-medium text-foreground' : 'text-muted-foreground'">
                  {{ row[h.key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 提示 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Info class="w-4 h-4 text-primary" /> 中国码怎么读
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">"170/88A"表示适合身高 170cm、胸围 88cm、标准体型（A）的人；鞋码"260"表示适合脚长 260 毫米。</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Shirt class="w-4 h-4 text-primary" /> 男女装不通用
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">同为"S 码"，男装对应欧 46/美 34，女装对应欧 36/美 4，海淘时务必先确认是男装还是女装版型。</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Ruler class="w-4 h-4 text-primary" /> 介于两码之间
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">建议量好自己的身高、胸围或脚长后取靠近值；喜欢宽松取大一号，修身取小一号，弹力面料可适当选小。</p>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：本表为成人通用尺码对照"参考建议"，各品牌版型、剪裁与测量标准差异较大（快时尚普遍偏小），下单一前请务必以商品详情页的尺码表与实测数据为准；鞋码建议以脚长实测并预留 5-10mm 活动空间。
      </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于中外尺码换算</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            海淘、代购或买外贸原单时最常见的坑就是尺码：中国的 S 码到欧美可能变成 XS 甚至更小。掌握"中国码 ↔ 欧/美/英码"的大致对应关系，再结合商品页的具体尺寸数据，能大幅降低退换货概率。
          </p>
          <h3 class="text-lg font-semibold text-foreground">中国码"170/88A"的含义</h3>
          <p>
            这是国标GB/T 1335 的标注方式：170 指适合身高 170cm，88 指适合净胸围 88cm，字母表示体型（Y 偏瘦、A 标准、B 微胖、C 偏胖）。买上衣主要看胸围，买裤子则要看身高与腰围组合。
          </p>
          <h3 class="text-lg font-semibold text-foreground">欧码、美码、英码怎么对应</h3>
          <p>
            男装上衣欧码与美码大致相差 12（欧 48 ≈ 美 36）；女装则用另一套体系（欧 40 ≈ 美 8 ≈ 英 12）。鞋码方面，中国以脚长毫米数标注，男鞋 240-270mm 大致覆盖欧 38-44、美 6-9、英 5.5-8.5。三者均为行业惯例，并非强制标准。
          </p>
          <h3 class="text-lg font-semibold text-foreground">网购尺码避坑建议</h3>
          <p>
            先量自己：上衣量胸围（最丰满处一圈）、衬衫量领围，裤子量腰围与裤长，鞋子站姿量脚长（最长趾到脚跟）。然后把实测数据与商品尺码表逐项对比，而不是只看字母码；评价区"身高体重穿了什么码"也是很好的参考。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么同一个码不同品牌大小不一样？</span>版型定位不同：意式偏修身、美式偏宽松，快时尚普遍偏小一码，所以"以商品尺码表为准"永远排在对照表前面。</li>
            <li><span class="text-foreground font-medium">量出来正好在两码中间怎么办？</span>按穿衣风格选：喜欢宽松或打算内搭选大一号，贴身修身选小一号；针织弹力面料通常可以取小。</li>
            <li><span class="text-foreground font-medium">童装能用这张表吗？</span>不能，本表仅适用于成人尺码。童装按身高分段（如 120/130/140），不同国家差异更大，请单独查童装对照。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'clothing-size-chart'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Ruler, Shirt, Footprints, ArrowLeftRight, Info, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '衣物尺码中外对照表 - 男女装/鞋码中国欧美英互查',
  description: '在线衣物尺码中外对照表，男装女装 S~3XL 与男鞋的中国码/欧码/美码/英码互查，支持按已知任一码反查整行，海淘网购尺码换算必备，纯本地计算',
  keywords: '尺码对照表, 欧码美码换算, 海淘尺码, 鞋码对照, 衣服尺码, 中国码对照, 服装尺码换算',
  author: 'Util工具箱',
  ogTitle: '衣物尺码中外对照表 - 有条工具',
  ogDescription: '男女装与鞋码的中国/欧/美/英互查，支持任一码反查',
  ogUrl: 'https://www.util.cn/tools/clothing-size-chart',
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
          name: '衣物尺码中外对照表',
          url: 'https://www.util.cn/tools/clothing-size-chart',
          applicationCategory: 'ShoppingApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['男装/女装/男鞋三套对照表', '中国/欧/美/英四地互查', '任一码反查', '海淘选码建议']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '衣物尺码中外对照表', item: 'https://www.util.cn/tools/clothing-size-chart' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么同一个码不同品牌大小不一样？',
              acceptedAnswer: { '@type': 'Answer', text: '版型定位不同，快时尚普遍偏小一码，下单前务必以商品详情页尺码表为准。' }
            },
            {
              '@type': 'Question',
              name: '量出来正好在两码中间怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '喜欢宽松或打算内搭选大一号，贴身修身选小一号，弹力面料通常可以取小。' }
            },
            {
              '@type': 'Question',
              name: '童装能用这张表吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能，本表仅适用于成人尺码，童装按身高分段且各国差异更大，请单独查童装对照。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'clothing-size-chart')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 尺码数据（通用口径，各品牌有差异） ----------
const menSizes = [
  { size: 'S', cn: '165/84A', height: 165, eu: 46, us: 34 },
  { size: 'M', cn: '170/88A', height: 170, eu: 48, us: 36 },
  { size: 'L', cn: '175/92A', height: 175, eu: 50, us: 38 },
  { size: 'XL', cn: '180/96A', height: 180, eu: 52, us: 40 },
  { size: '2XL', cn: '185/100A', height: 185, eu: 54, us: 42 },
  { size: '3XL', cn: '190/104A', height: 190, eu: 56, us: 44 }
]

const womenSizes = [
  { size: 'S', cn: '155/80A', height: 155, eu: 36, us: 4, uk: 8 },
  { size: 'M', cn: '160/84A', height: 160, eu: 38, us: 6, uk: 10 },
  { size: 'L', cn: '165/88A', height: 165, eu: 40, us: 8, uk: 12 },
  { size: 'XL', cn: '170/92A', height: 170, eu: 42, us: 10, uk: 14 },
  { size: '2XL', cn: '175/96A', height: 175, eu: 44, us: 12, uk: 16 }
]

const shoeSizes = [
  { mm: 240, eu: 38, us: 6, uk: 5.5 },
  { mm: 245, eu: 39, us: 6.5, uk: 6 },
  { mm: 250, eu: 40, us: 7, uk: 6.5 },
  { mm: 255, eu: 41, us: 7.5, uk: 7 },
  { mm: 260, eu: 42, us: 8, uk: 7.5 },
  { mm: 265, eu: 43, us: 8.5, uk: 8 },
  { mm: 270, eu: 44, us: 9, uk: 8.5 }
]

// ---------- 页面状态 ----------
const tabs = [
  { key: 'men', label: '男装上衣' },
  { key: 'women', label: '女装上衣' },
  { key: 'shoes', label: '男鞋鞋码' }
]

const FIELD_DEFS = {
  men: [
    { key: 'size', label: '国际尺码（S/M/L…）', placeholder: '如：M' },
    { key: 'cn', label: '中国码（如 170/88A，可只填身高 170）', placeholder: '如：M 或 170' },
    { key: 'eu', label: '欧码 EU（46-56）', placeholder: '如：48' },
    { key: 'us', label: '美码 US（34-44）', placeholder: '如：36' }
  ],
  women: [
    { key: 'size', label: '国际尺码（S/M/L…）', placeholder: '如：L' },
    { key: 'cn', label: '中国码（如 165/88A，可只填身高 165）', placeholder: '如：L 或 165' },
    { key: 'eu', label: '欧码 EU（36-44）', placeholder: '如：40' },
    { key: 'us', label: '美码 US（4-12）', placeholder: '如：8' },
    { key: 'uk', label: '英码 UK（8-16）', placeholder: '如：12' }
  ],
  shoes: [
    { key: 'mm', label: '脚长（毫米 240-270）', placeholder: '如：260' },
    { key: 'eu', label: '欧码 EU（38-44）', placeholder: '如：42' },
    { key: 'us', label: '美码 US（6-9）', placeholder: '如：8' },
    { key: 'uk', label: '英码 UK（5.5-8.5）', placeholder: '如：7.5' }
  ]
}

const TABLE_HEADERS = {
  men: [
    { key: 'size', label: '国际尺码' },
    { key: 'cn', label: '中国码（身高/胸围）' },
    { key: 'eu', label: '欧码 EU' },
    { key: 'us', label: '美码 US' }
  ],
  women: [
    { key: 'size', label: '国际尺码' },
    { key: 'cn', label: '中国码（身高/胸围）' },
    { key: 'eu', label: '欧码 EU' },
    { key: 'us', label: '美码 US' },
    { key: 'uk', label: '英码 UK' }
  ],
  shoes: [
    { key: 'mm', label: '中国码（脚长 mm）' },
    { key: 'eu', label: '欧码 EU' },
    { key: 'us', label: '美码 US' },
    { key: 'uk', label: '英码 UK' }
  ]
}

const RESULT_LABELS = {
  men: { size: '国际尺码', cn: '中国码', eu: '欧码 EU', us: '美码 US' },
  women: { size: '国际尺码', cn: '中国码', eu: '欧码 EU', us: '美码 US', uk: '英码 UK' },
  shoes: { mm: '脚长（毫米）', eu: '欧码 EU', us: '美码 US', uk: '英码 UK' }
}

const activeTab = ref('men')
const lookupField = ref('size')
const lookupValue = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const setTab = (t) => {
  activeTab.value = t
  lookupField.value = FIELD_DEFS[t][0].key
  lookupValue.value = ''
}

const activeRows = computed(() => {
  if (activeTab.value === 'men') return menSizes
  if (activeTab.value === 'women') return womenSizes
  return shoeSizes
})

const activeFields = computed(() => FIELD_DEFS[activeTab.value])
const activeFieldObj = computed(() => activeFields.value.find(f => f.key === lookupField.value) || activeFields.value[0])
const tableHeaders = computed(() => TABLE_HEADERS[activeTab.value])
const activeTabLabel = computed(() => {
  const t = tabs.find(x => x.key === activeTab.value)
  return t ? t.label : ''
})

// 反查纯函数：按字段与原始输入定位一行
function findSizeRow(rows, field, rawValue) {
  const raw = String(rawValue == null ? '' : rawValue).trim().toUpperCase()
  if (!raw) return null
  if (field === 'size' || field === 'cn') {
    const direct = rows.find(r => String(r[field]).toUpperCase() === raw)
    if (direct) return direct
    // 中国码允许只填身高（数字）：命中身高即视为同一行
    const num = Number(raw)
    if (isFinite(num)) return rows.find(r => r.height === num) || null
    return null
  }
  const num = Number(raw)
  if (!isFinite(num)) return null
  return rows.find(r => Number(r[field]) === num) || null
}

const lookupResult = computed(() => findSizeRow(activeRows.value, lookupField.value, lookupValue.value))

const resultColumns = computed(() => {
  if (!lookupResult.value) return []
  const labels = RESULT_LABELS[activeTab.value]
  const row = lookupResult.value
  return Object.keys(labels).map(key => ({ key, label: labels[key], value: row[key] }))
})
</script>
