<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ChefHat class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">烘焙原料替换对照</h1>
          <p class="text-sm text-muted-foreground mt-1">泡打粉小苏打鸡蛋黄油牛奶等烘焙原料换算与替换关系，缺料不慌</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        做蛋糕发现没有泡打粉？黄油能不能换成植物油？对照表内置 8 组常见烘焙原料的双向替换关系：每组给出替代品、用量换算、效果影响与注意事项，支持关键词搜索、点选正查，以及「我要用 X 代替 Y」的反查。填入你需要的份量即可得到换算后的克数/勺数。替换会微调成品风味与质地，首次尝试建议小批量。全部数据在浏览器本地匹配计算。
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：原料选择 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 md:col-span-1">
        <h2 class="text-lg font-semibold flex items-center">
          <Search class="w-5 h-5 mr-2 text-primary" /> 选择原料
        </h2>

        <input
          v-model="query"
          type="text"
          class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="搜索：泡打粉 / 黄油 / 鸡蛋…"
        />

        <div class="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          <button
            v-for="item in filteredItems"
            :key="item.key"
            @click="selectItem(item.key)"
            :class="selectedKey === item.key ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'"
            class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between"
          >
            <span>{{ item.zh }}</span>
            <span :class="selectedKey === item.key ? 'text-primary-foreground/70' : 'text-muted-foreground'" class="text-xs">{{ item.subs.length }} 种替代</span>
          </button>
          <p v-if="filteredItems.length === 0" class="text-sm text-muted-foreground py-2">没有匹配的原料，试试「奶」「糖」「粉」。</p>
        </div>

        <div class="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground leading-relaxed">
          用量换算基于常见家庭烘焙规格（茶匙约 5ml、大匙约 15ml），克重以标准配比估算，仅供参考。
        </div>
      </div>

      <!-- 中间：正查明细 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4 md:col-span-2">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowRightLeft class="w-5 h-5 mr-2 text-primary" /> {{ selectedItem ? selectedItem.zh + ' 的替代方案' : '替换明细' }}
          </h2>
          <div v-if="selectedItem" class="flex items-center gap-2 text-sm">
            <label class="text-muted-foreground whitespace-nowrap">我需要</label>
            <input
              v-model.number="amount"
              type="number"
              min="0"
              step="1"
              class="w-20 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-muted-foreground">{{ selectedItem.amountUnit }}</span>
          </div>
        </div>

        <p v-if="!selectedItem" class="text-sm text-muted-foreground">从左侧点选一种原料，查看可替代品与用量换算。</p>

        <div v-else class="space-y-3">
          <div
            v-for="sub in substituted.options"
            :key="sub.name"
            class="p-4 bg-muted/50 rounded-lg space-y-2"
          >
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-foreground">{{ sub.name }}</h3>
              <span class="text-xs text-muted-foreground">{{ sub.en }}</span>
            </div>
            <p class="text-sm text-foreground">
              基准：{{ sub.ratio }}
            </p>
            <div v-if="amount > 0" class="flex flex-wrap gap-2">
              <span
                v-for="p in sub.parts"
                :key="p.ing"
                class="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium"
              >{{ p.ing }} {{ p.amount }} {{ p.unit }}</span>
            </div>
            <div class="text-xs text-muted-foreground space-y-1">
              <p><span class="text-foreground font-medium">效果影响：</span>{{ sub.effect }}</p>
              <p><span class="text-foreground font-medium">备注：</span>{{ sub.note }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 反查区 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold flex items-center mb-4">
        <SearchCheck class="w-5 h-5 mr-2 text-primary" /> 反查：我要用 X 代替 Y
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">被替代的原料（Y）</label>
          <select
            v-model="reverseFrom"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="item in BAKING_SUBS" :key="'rf-' + item.key" :value="item.key">{{ item.zh }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">手头替代品（X）</label>
          <select
            v-model="reverseWith"
            class="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="sub in reverseSubOptions" :key="'rw-' + sub.name" :value="sub.name">{{ sub.name }}</option>
          </select>
        </div>
        <button
          @click="runReverse"
          class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
        >查询换算</button>
      </div>
      <div v-if="reverseResult" class="mt-4 p-4 bg-primary/10 rounded-lg space-y-2">
        <p class="text-sm text-foreground font-medium">{{ reverseResult }}</p>
      </div>
      <div class="mt-4 p-4 bg-muted rounded-lg">
        <h3 class="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
          <Lightbulb class="w-4 h-4" /> 烘焙小贴士
        </h3>
        <div class="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
          <p>• 膨发类替换（泡打粉/小苏打）现配现用，混合后尽快入炉，避免提前失效。</p>
          <p>• 油脂替换：黄油换成植物油后无法打发裹气，重油蛋糕可用，戚风与饼干口感会变。</p>
          <p>• 蛋类替代（亚麻蛋、香蕉泥）适合麦芬面包等湿润配方，不适合需要打发蛋白的配方，且会带来风味。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>烘焙原料替换对照表</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            烘焙是「化学」，原料替换不是随手互换：膨发剂要补够酸、油脂要考虑打发、蛋既提供结构又提供水分。对照表把 8 组最常见的缺料场景整理为「替代品 + 用量换算 + 效果影响 + 备注」四个要素，按换算表操作可以把失败率压到最低，但成品风味与质构仍会有细微差别。
          </p>
          <h3 class="text-lg font-semibold text-foreground">替换的三个原理</h3>
          <ul class="list-disc list-inside space-y-1">
            <li><span class="text-foreground font-medium">膨发</span>：泡打粉 = 小苏打 + 酸性盐（塔塔粉），缺泡打粉时按 1 茶匙 = 1/4 茶匙小苏打 + 1/2 茶匙塔塔粉现配；</li>
            <li><span class="text-foreground font-medium">油脂与水分</span>：黄油含约 15–18% 水分与乳固形物，换植物油按 100g 黄油 ≈ 80g 油折算，糖蜜、蜂蜜同理要反向调整配方液体量；</li>
            <li><span class="text-foreground font-medium">结构</span>：鸡蛋承担凝固与充气，亚麻籽蛋（1 勺亚麻粉 + 3 勺水静置）只补黏合不补打发，香蕉泥会带入甜味。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">使用建议</h3>
          <p>
            先在左侧点选缺的原料、输入配方中的用量，得到放大后的换算结果；如果手上只有某种替代品，用下方「反查」定位替换关系。替换后首次烘烤请减半试做，记录风味差异再决定是否常态化。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">小苏打能直接代替泡打粉吗？</span>不能等量直换。小苏打碱性、需酸性环境才产气，直接替代易发苦塌方；正确做法是 1 茶匙泡打粉 = 1/4 茶匙小苏打 + 1/2 茶匙塔塔粉。</li>
            <li><span class="text-foreground font-medium">鸡蛋过敏做蛋糕用什么？</span>湿润类配方（麦芬、布朗尼）可用亚麻籽蛋或半个香蕉泥替代 1 个蛋；需要打发蛋白的海绵/戚风类没有等效替代，建议改用无蛋配方。</li>
            <li><span class="text-foreground font-medium">淡奶油买不到怎么办？</span>可近似替代：约 75ml 全脂牛奶 + 25g 融化黄油兑出 100ml 淡奶油的脂肪含量，仅适合烘焙使用，无法打发成奶油裱花。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'baking-substitution-chart'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ChefHat, Search, ArrowRightLeft, SearchCheck, Lightbulb,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '烘焙原料替换对照 - 泡打粉黄油鸡蛋牛奶换算表',
  description: '在线烘焙原料替换对照表，泡打粉换小苏打加塔塔粉、黄油换植物油、鸡蛋换亚麻籽蛋、奶粉兑牛奶、淡奶油、中筋面粉、红糖蜂蜜等8组双向替换，含用量换算与效果影响说明，缺料不慌，纯本地计算',
  keywords: '烘焙原料替换, 泡打粉替代, 黄油 substitute 植物油, 鸡蛋替代, 亚麻籽蛋, 奶粉兑牛奶, 淡奶油替换, 红糖换白糖',
  author: 'Util工具箱',
  ogTitle: '烘焙原料替换对照 - 有条工具',
  ogDescription: '泡打粉小苏打鸡蛋黄油牛奶等烘焙原料换算与替换关系，缺料不慌',
  ogUrl: 'https://www.util.cn/tools/baking-substitution-chart',
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
          name: '烘焙原料替换对照',
          url: 'https://www.util.cn/tools/baking-substitution-chart',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['8组常见烘焙原料替换关系', '用量按份量自动换算', '效果影响与备注', '关键词搜索', '反查我要用X代替Y']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '烘焙原料替换对照', item: 'https://www.util.cn/tools/baking-substitution-chart/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '没有泡打粉怎么替代？',
              acceptedAnswer: { '@type': 'Answer', text: '1茶匙泡打粉可用1/4茶匙小苏打+1/2茶匙塔塔粉现配现用，膨发力接近，混合后尽快入炉。' }
            },
            {
              '@type': 'Question',
              name: '黄油可以换成植物油吗？',
              acceptedAnswer: { '@type': 'Answer', text: '可以按100g黄油≈80g植物油换算，但黄油能打发裹气、含乳香，重油蛋糕与面包适用，饼干与戚风口感会不同。' }
            },
            {
              '@type': 'Question',
              name: '换算结果准确吗？',
              acceptedAnswer: { '@type': 'Answer', text: '换算基于常见家庭烘焙标准配比（茶匙约5ml、大匙约15ml），不同品牌出餐与原料状态有差异，结果仅供参考，首次尝试建议小批量试做。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'baking-substitution-chart')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* __PURE_START__ */
// 烘焙原料替换表：parts 中 per = 每 1 个基准单位需要的替代品用量
const BAKING_SUBS = [
  {
    key: 'baking-powder', zh: '泡打粉', en: 'baking powder', amountUnit: '茶匙',
    subs: [
      {
        name: '小苏打 + 塔塔粉', en: 'baking soda + cream of tartar',
        parts: [
          { ing: '小苏打', en: 'baking soda', per: 0.25, unit: '茶匙' },
          { ing: '塔塔粉', en: 'cream of tartar', per: 0.5, unit: '茶匙' }
        ],
        ratio: '1 茶匙泡打粉 = 1/4 茶匙小苏打 + 1/2 茶匙塔塔粉',
        effect: '膨发力接近，现配现用，酸味由塔塔粉补足',
        note: '混合后尽快入炉，避免吸潮提前产气'
      }
    ]
  },
  {
    key: 'butter', zh: '黄油', en: 'butter', amountUnit: 'g',
    subs: [
      {
        name: '植物油', en: 'vegetable oil',
        parts: [{ ing: '植物油', en: 'vegetable oil', per: 0.8, unit: 'g' }],
        ratio: '100g 黄油 = 80g 植物油',
        effect: '更润更软，但无法打发裹气，奶香缺失',
        note: '适合麦芬/布朗尼/面包；饼干与蛋糕体需打发黄油时慎用'
      }
    ]
  },
  {
    key: 'egg', zh: '鸡蛋', en: 'egg', amountUnit: '个',
    subs: [
      {
        name: '亚麻籽蛋', en: 'flax egg',
        parts: [
          { ing: '亚麻籽粉', en: 'ground flaxseed', per: 1, unit: '大匙' },
          { ing: '水', en: 'water', per: 3, unit: '大匙' }
        ],
        ratio: '1 个鸡蛋 = 1 大匙亚麻籽粉 + 3 大匙水，静置 5 分钟',
        effect: '补黏合与水分，不补打发，成品略坚果香',
        note: '适合麦芬、面包、饼干；静置至凝胶状再用'
      },
      {
        name: '香蕉泥', en: 'mashed banana',
        parts: [{ ing: '香蕉泥', en: 'mashed banana', per: 0.5, unit: '根' }],
        ratio: '1 个鸡蛋 ≈ 半个香蕉捣成的泥',
        effect: '带来甜香与湿润度，膨发略减',
        note: '风味明显，不适合咸味烘焙'
      }
    ]
  },
  {
    key: 'milk', zh: '牛奶', en: 'milk', amountUnit: 'ml',
    subs: [
      {
        name: '奶粉 + 水', en: 'milk powder + water',
        parts: [
          { ing: '奶粉', en: 'milk powder', per: 0.125, unit: 'g' },
          { ing: '水', en: 'water', per: 0.875, unit: 'ml' }
        ],
        ratio: '牛奶 : 奶粉 : 水 ≈ 8 : 1 : 7（即 1 份奶粉 + 8 份水还原）',
        effect: '还原乳香接近，蛋白含量略低',
        note: '按 1:8 冲开后取所需总量'
      },
      {
        name: '豆浆（无糖）', en: 'soy milk',
        parts: [{ ing: '无糖豆浆', en: 'unsweetened soy milk', per: 1, unit: 'ml' }],
        ratio: '1 : 1 等量替换',
        effect: '豆香轻微，蛋白接近，适合素食配方',
        note: '选原味无糖，避免风味干扰'
      }
    ]
  },
  {
    key: 'heavy-cream', zh: '淡奶油', en: 'heavy cream', amountUnit: 'ml',
    subs: [
      {
        name: '全脂牛奶 + 黄油', en: 'whole milk + butter',
        parts: [
          { ing: '全脂牛奶', en: 'whole milk', per: 0.75, unit: 'ml' },
          { ing: '融化黄油', en: 'melted butter', per: 0.25, unit: 'g' }
        ],
        ratio: '约 100ml 淡奶油 ≈ 75ml 全脂牛奶 + 25g 融化黄油',
        effect: '补足脂肪含量，适合入馅入面团',
        note: '仅适合烘焙用脂，无法打发做裱花奶油（约值）'
      }
    ]
  },
  {
    key: 'ap-flour', zh: '普通面粉(中筋)', en: 'all-purpose flour', amountUnit: 'g',
    subs: [
      {
        name: '低筋面粉 + 玉米淀粉', en: 'cake flour + cornstarch',
        parts: [
          { ing: '低筋面粉', en: 'cake flour', per: 0.8, unit: 'g' },
          { ing: '玉米淀粉', en: 'cornstarch', per: 0.2, unit: 'g' }
        ],
        ratio: '100g 中筋面粉 = 80g 低筋面粉 + 20g 玉米淀粉（低筋:淀粉 ≈ 4:1）',
        effect: '降低面筋含量，口感更接近低筋',
        note: '反向缺低筋时，中筋 4 : 淀粉 1 也可兑出近似替代'
      }
    ]
  },
  {
    key: 'brown-sugar', zh: '红糖', en: 'brown sugar', amountUnit: '杯',
    subs: [
      {
        name: '白糖 + 糖蜜', en: 'white sugar + molasses',
        parts: [
          { ing: '白糖', en: 'white sugar', per: 1, unit: '杯' },
          { ing: '糖蜜', en: 'molasses', per: 1, unit: '大匙' }
        ],
        ratio: '1 杯红糖 = 1 杯白糖 + 1 大匙糖蜜',
        effect: '湿润度与焦糖香接近',
        note: '没有糖蜜时，白糖 + 少量红糖/黑糖调色亦可凑合'
      }
    ]
  },
  {
    key: 'honey', zh: '蜂蜜', en: 'honey', amountUnit: '杯',
    subs: [
      {
        name: '白糖 + 液体调整', en: 'white sugar + liquid adjust',
        parts: [
          { ing: '白糖', en: 'white sugar', per: 1.25, unit: '杯' },
          { ing: '配方液体减少', en: 'reduce liquid', per: 0.25, unit: '杯' }
        ],
        ratio: '1 杯蜂蜜 ≈ 1.25 杯白糖，且配方总液体减 1/4 杯',
        effect: '甜度接近，蜂蜜风味与保湿性减弱',
        note: '反向（糖换蜜）则减液体、降烤箱温度约 15°C 防上色过快'
      }
    ]
  }
]

const round2 = (v) => Math.round(v * 100) / 100

// 按 key/中文名/英文名定位原料，返回按 qty 放大后的换算对象
const substitute = (key, qty) => {
  const item = BAKING_SUBS.find(s => s.key === key || s.en === key || s.zh === key)
  if (!item) return null
  const n = Number(qty)
  const amt = isFinite(n) && n > 0 ? n : 1
  return {
    ingredient: item.zh,
    amount: amt,
    unit: item.amountUnit,
    options: item.subs.map(sub => ({
      name: sub.name,
      en: sub.en,
      ratio: sub.ratio,
      effect: sub.effect,
      note: sub.note,
      parts: sub.parts.map(p => ({
        ing: p.ing,
        en: p.en,
        unit: p.unit,
        amount: round2(p.per * amt)
      }))
    }))
  }
}
/* __PURE_END__ */

// ---------- 状态 ----------
const query = ref('')
const selectedKey = ref('baking-powder')
const amount = ref(1)
const reverseFrom = ref('baking-powder')
const reverseWith = ref('小苏打 + 塔塔粉')
const reverseResult = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const filteredItems = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return BAKING_SUBS
  return BAKING_SUBS.filter(item =>
    item.zh.toLowerCase().includes(q) ||
    item.en.toLowerCase().includes(q) ||
    item.subs.some(sub => sub.name.toLowerCase().includes(q) || sub.en.toLowerCase().includes(q))
  )
})

const selectedItem = computed(() => BAKING_SUBS.find(s => s.key === selectedKey.value) || null)

const substituted = computed(() => substitute(selectedKey.value, amount.value))

const selectItem = (key) => {
  selectedKey.value = key
}

const reverseSubOptions = computed(() => {
  const item = BAKING_SUBS.find(s => s.key === reverseFrom.value)
  return item ? item.subs : []
})

const runReverse = () => {
  const item = BAKING_SUBS.find(s => s.key === reverseFrom.value)
  if (!item) { reverseResult.value = '请先选择被替代的原料'; return }
  const sub = item.subs.find(s => s.name === reverseWith.value)
  if (!sub) { reverseResult.value = '该原料没有此替代方案'; return }
  const amt = isFinite(Number(amount.value)) && Number(amount.value) > 0 ? Number(amount.value) : 1
  const partsText = sub.parts
    .map(p => `${p.ing} ${round2(p.per * amt)} ${p.unit}`)
    .join(' + ')
  reverseResult.value = `配方要 ${amt} ${item.amountUnit}「${item.zh}」→ 改用 ${partsText}；${sub.effect}。`
}
</script>
