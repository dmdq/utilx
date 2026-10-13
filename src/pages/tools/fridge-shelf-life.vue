<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Container class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">冰箱食材保质期速查</h1>
          <p class="text-sm text-muted-foreground mt-1">冷藏/冷冻参考天数一览，输入已放天数给"尽快吃/建议丢弃"分级</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        覆盖生鲜肉禽、海鲜、蛋奶、蔬果与剩菜等 15 类常见食材的冷藏与冷冻参考期限（参考 USDA 公开口径整理）。选择食材、输入已放天数与存放方式，即可获得"新鲜 / 尽快吃 / 建议丢弃"三级提示与剩余参考天数。所有数据均为一般性"参考期限"，不构成食品安全保证。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <!-- 左：速查表单 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center text-foreground">
          <Refrigerator class="w-5 h-5 mr-2 text-primary" /> 保质期速查
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">选择食材</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="f in foods"
              :key="f.id"
              @click="selectedId = f.id"
              :class="selectedId === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            >{{ f.name }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">已放天数</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="storedDays"
              type="number"
              min="0"
              step="1"
              class="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-sm text-muted-foreground">天</span>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">按放入冰箱起计算，不足一天可填小数（如 0.5）</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">存放方式</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              @click="storageMode = 'fridge'"
              :class="storageMode === 'fridge' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >冷藏（0-4°C）</button>
            <button
              @click="storageMode = 'freezer'"
              :class="storageMode === 'freezer' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-sm font-medium transition-all"
            >冷冻（-18°C）</button>
          </div>
        </div>

        <!-- 状态结果 -->
        <div v-if="selectedFood" :class="resultCardClass" class="rounded-lg p-4 space-y-1.5">
          <div class="flex items-center gap-2">
            <component :is="resultIcon" class="w-5 h-5" />
            <span class="text-lg font-bold">{{ statusMeta.label }}</span>
            <span class="text-sm opacity-80">{{ selectedFood.name }} · {{ storageMode === 'freezer' ? '冷冻' : '冷藏' }} {{ fmtDays }} 天</span>
          </div>
          <p class="text-sm leading-relaxed">{{ statusMeta.hint }}</p>
          <p v-if="statusMeta.remainingText" class="text-xs opacity-80">{{ statusMeta.remainingText }}</p>
        </div>
      </div>

      <!-- 右：对照表 -->
      <div class="lg:col-span-3 bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold flex items-center text-foreground mb-1">
          <Snowflake class="w-5 h-5 mr-2 text-primary" /> 冷藏/冷冻参考期限对照表
        </h2>
        <p class="text-xs text-muted-foreground mb-4">参考 USDA 公开口径整理，均为"参考期限"而非安全保证，各家庭冰箱实际温度有差异</p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted-foreground border-b border-border">
                <th class="py-2 pr-3 font-medium">食材</th>
                <th class="py-2 pr-3 font-medium">冷藏参考期限（0-4°C）</th>
                <th class="py-2 font-medium">冷冻参考期限（-18°C）</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="f in foods"
                :key="f.id"
                :class="f.id === selectedId ? 'bg-primary/10' : ''"
                class="border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
                @click="selectedId = f.id"
              >
                <td class="py-2 pr-3 font-medium text-foreground">{{ f.name }}</td>
                <td class="py-2 pr-3 text-muted-foreground">{{ f.fridgeText }}</td>
                <td :class="f.freezer ? 'text-muted-foreground' : 'text-orange-600 dark:text-orange-400'">{{ f.freezerText }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 通用建议 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Snowflake class="w-4 h-4 text-primary" /> 解冻后不要再冻
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">食材一旦解冻，细菌会快速恢复繁殖，反复冷冻既加速变质又严重损失口感。建议按单次食用量分装冷冻，吃多少解冻多少。</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Thermometer class="w-4 h-4 text-primary" /> 管好冰箱温度
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">冷藏室保持 0-4°C、冷冻室 -18°C 以下，避免频繁开门导致温度波动；生熟分开、熟上生下存放，防止交叉污染。</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <h3 class="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Timer class="w-4 h-4 text-primary" /> 剩菜尽快冷藏
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">剩菜剩饭建议在出锅 2 小时内密封放入冷藏（参考 3-4 天内吃完），再次食用前务必彻底加热，超过参考期限建议丢弃。</p>
      </div>
    </div>

    <!-- 免责声明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：本页参考期限参考美国农业部食品安全与检验署（USDA FSIS）公开口径整理，属于一般性"参考期限/建议"，不构成食品安全承诺；实际保存时间受冰箱温度、食材初始新鲜度与处理方式影响，食用前请结合气味、色泽与质地自行判断，任何感官异常的食材请直接丢弃。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于食材保质期</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            食材放入冰箱并不等于"保险箱"：低温只能减缓细菌繁殖，不能杀灭细菌。了解常见食材的冷藏与冷冻参考期限，配合"先进先出"的收纳习惯，既能减少浪费，也能显著降低食品安全风险。
          </p>
          <h3 class="text-lg font-semibold text-foreground">参考期限是怎么来的</h3>
          <p>
            本页数据参考 USDA FSIS 公开口径整理，以"品质与安全并重"的保守口径给出。表中数值均为统计意义上的"参考期限"：在此期限内，正确冷藏/冷冻的食材通常能保持较好的品质与安全性；超过后风险上升，但并不代表立刻变质。
          </p>
          <h3 class="text-lg font-semibold text-foreground">冷藏与冷冻有什么区别</h3>
          <p>
            冷藏（0-4°C）只是减缓细菌繁殖速度，保质期以"天"计；冷冻（-18°C 以下）基本停止细菌繁殖，保质期以"月"计，但口感与质地会随时间下降。部分食材（鸡蛋、牛奶、叶菜等）冷冻后品质受损严重，不建议冷冻。特别注意：解冻后不要再冻，解冻过程细菌会快速恢复繁殖。
          </p>
          <h3 class="text-lg font-semibold text-foreground">如何判断食材是否还能吃</h3>
          <p>
            参考期限只是统计建议，最终请结合感官判断：出现酸败味、黏液、变色、发霉或胀袋等任一情况，无论是否在参考期限内都建议丢弃。"闻着没坏"不能作为超期食材的安全依据，因为部分致病菌繁殖并不产生明显气味。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">冷冻能无限期保存吗？</span>不能。冷冻状态下细菌不繁殖，食品安全风险低，但品质会持续下降（脂肪氧化、冰晶损伤细胞），建议按表中参考期限内食用完毕。</li>
            <li><span class="text-foreground font-medium">剩菜要放凉再进冰箱吗？</span>不建议久放。室温下细菌繁殖很快，建议出锅后 2 小时内密封冷藏，热菜可稍微降温后直接放入，现代冰箱完全可以承受。</li>
            <li><span class="text-foreground font-medium">显示"建议丢弃"还能吃吗？</span>本工具只能按参考期限给出生成建议，无法感知食材实际状态；超过参考期限的食材风险上升，从安全角度建议丢弃，切勿给风险赌概率。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'fridge-shelf-life'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Container, Refrigerator, Snowflake, Thermometer, Timer, AlertTriangle, ChevronUp, ChevronDown, CheckCircle2, UtensilsCrossed, Trash2 } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '冰箱食材保质期速查 - 肉类/剩菜冷藏冷冻参考天数',
  description: '在线冰箱食材保质期速查表，覆盖生肉、海鲜、蛋奶、蔬果与剩菜等 15 类食材的冷藏冷冻参考期限（USDA 口径），输入已放天数即给新鲜/尽快吃/建议丢弃分级提示，纯本地计算',
  keywords: '食材保质期查询, 肉冷藏能放几天, 剩菜能放多久, 冰箱保存时间, 食物保存期限, 冷冻保质期, 冰箱收纳',
  author: 'Util工具箱',
  ogTitle: '冰箱食材保质期速查 - 有条工具',
  ogDescription: '15 类食材冷藏冷冻参考期限，输入已放天数给尽快吃/建议丢弃分级',
  ogUrl: 'https://www.util.cn/tools/fridge-shelf-life',
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
          name: '冰箱食材保质期速查',
          url: 'https://www.util.cn/tools/fridge-shelf-life',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['15 类食材冷藏/冷冻参考期限', '已放天数分级提示', '剩余参考天数', '通用储存建议', 'USDA 口径参考']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '工具', item: 'https://www.util.cn/tools' },
            { '@type': 'ListItem', position: 3, name: '冰箱食材保质期速查', item: 'https://www.util.cn/tools/fridge-shelf-life' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '冷冻能无限期保存吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。冷冻状态下细菌不繁殖，安全风险低，但品质会持续下降，建议按参考期限内食用完毕。' }
            },
            {
              '@type': 'Question',
              name: '剩菜要放凉再进冰箱吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不建议久放，建议出锅后 2 小时内密封冷藏，再次食用前彻底加热。' }
            },
            {
              '@type': 'Question',
              name: '显示"建议丢弃"还能吃吗？',
              acceptedAnswer: { '@type': 'Answer', text: '超过参考期限的食材风险上升，本工具无法感知实际状态，从安全角度建议丢弃，感官异常务必丢弃。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'fridge-shelf-life')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 食材数据（冷藏:天 / 冷冻:月，USDA 公开口径，参考期限） ----------
const foods = [
  { id: 'steak', name: '生牛排', fridge: [3, 5], fridgeText: '3-5 天', freezer: [4, 12], freezerText: '4-12 个月' },
  { id: 'ground', name: '绞肉', fridge: [1, 2], fridgeText: '1-2 天', freezer: [3, 4], freezerText: '3-4 个月' },
  { id: 'pork', name: '猪肉排', fridge: [3, 5], fridgeText: '3-5 天', freezer: [4, 6], freezerText: '4-6 个月' },
  { id: 'chicken', name: '整鸡', fridge: [1, 2], fridgeText: '1-2 天', freezer: [12, 12], freezerText: '1 年' },
  { id: 'shrimp', name: '虾', fridge: [1, 2], fridgeText: '1-2 天', freezer: [6, 12], freezerText: '6-12 个月' },
  { id: 'salmon', name: '三文鱼', fridge: [1, 2], fridgeText: '1-2 天', freezer: [2, 3], freezerText: '2-3 个月' },
  { id: 'egg', name: '鸡蛋', fridge: [21, 35], fridgeText: '3-5 周', freezer: null, freezerText: '不建议' },
  { id: 'milk', name: '牛奶', fridge: [7, 7], fridgeText: '约 7 天', freezer: null, freezerText: '不建议' },
  { id: 'yogurt', name: '酸奶', fridge: [7, 14], fridgeText: '1-2 周', freezer: [1, 2], freezerText: '1-2 个月' },
  { id: 'leafy', name: '叶菜', fridge: [3, 5], fridgeText: '3-5 天', freezer: null, freezerText: '不建议' },
  { id: 'carrot', name: '胡萝卜', fridge: [14, 28], fridgeText: '2-4 周', freezer: [8, 12], freezerText: '8-12 个月' },
  { id: 'leftovers', name: '剩菜', fridge: [3, 4], fridgeText: '3-4 天', freezer: [2, 6], freezerText: '2-6 个月' },
  { id: 'rice', name: '剩饭', fridge: [3, 4], fridgeText: '3-4 天', freezer: [1, 2], freezerText: '1-2 个月' },
  { id: 'tofu', name: '豆腐', fridge: [3, 5], fridgeText: '3-5 天', freezer: [1, 2], freezerText: '1-2 个月' },
  { id: 'dumpling', name: '熟饺子', fridge: [3, 4], fridgeText: '3-4 天', freezer: [1, 2], freezerText: '1-2 个月' }
]

// ---------- 状态判定（独立纯函数，便于测试） ----------
function assessShelf(food, days, mode) {
  const range = mode === 'freezer' ? food.freezer : food.fridge
  const rangeText = mode === 'freezer' ? food.freezerText : food.fridgeText
  if (!range) return { status: 'unsuitable', remaining: 0, unit: '', rangeText }
  const [min, max] = range
  if (mode === 'freezer') {
    const months = days / 30.44
    if (months < min) return { status: 'fresh', remaining: Math.round((min - months) * 10) / 10, unit: '个月', rangeText }
    if (months <= max) return { status: 'soon', remaining: Math.round((max - months) * 10) / 10, unit: '个月', rangeText }
    return { status: 'stale', remaining: 0, unit: '', rangeText }
  }
  if (days < min) return { status: 'fresh', remaining: Math.round((min - days) * 10) / 10, unit: '天', rangeText }
  if (days <= max) return { status: 'soon', remaining: Math.round((max - days) * 10) / 10, unit: '天', rangeText }
  return { status: 'discard', remaining: 0, unit: '', rangeText }
}

// ---------- 页面状态 ----------
const selectedId = ref('steak')
const storedDays = ref(1)
const storageMode = ref('fridge')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const selectedFood = computed(() => foods.find(f => f.id === selectedId.value))

const fmtDays = computed(() => {
  const d = storedDays.value
  return isFinite(d) && d >= 0 ? Math.round(d * 10) / 10 : 0
})

const result = computed(() => {
  if (!selectedFood.value) return null
  return assessShelf(selectedFood.value, Math.max(0, fmtDays.value), storageMode.value)
})

const STATUS_META = {
  fresh: {
    label: '新鲜',
    cardClass: 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400',
    icon: CheckCircle2,
    hint: '还在参考期限内，品质与安全性较好，按"先进先出"原则尽快安排食用。',
    remaining: (r) => `距"尽快吃"参考线还剩约 ${r.remaining} ${r.unit}（参考期限 ${r.rangeText}）`
  },
  soon: {
    label: '尽快吃',
    cardClass: 'bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400',
    icon: UtensilsCrossed,
    hint: '已进入参考期限后段，建议今天到明天内食用完毕，食用前检查气味与状态。',
    remaining: (r) => r.remaining > 0
      ? `参考剩余约 ${r.remaining} ${r.unit}（参考期限 ${r.rangeText}）`
      : `已到参考期限上限（${r.rangeText}），建议今天内吃完`
  },
  discard: {
    label: '建议丢弃',
    cardClass: 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400',
    icon: Trash2,
    hint: '已超过参考期限，变质风险明显上升，建议丢弃，不要凭气味赌概率。',
    remaining: (r) => `参考期限为 ${r.rangeText}，当前已超出`
  },
  stale: {
    label: '品质下降',
    cardClass: 'bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400',
    icon: UtensilsCrossed,
    hint: '已超过冷冻参考期限。冷冻可停止细菌繁殖，安全性风险低，但口感、水分与风味已明显下降，建议尽快食用完毕、不再继续储存。',
    remaining: (r) => `参考期限为 ${r.rangeText}，当前已超出`
  },
  unsuitable: {
    label: '不建议冷冻',
    cardClass: 'bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400',
    icon: AlertTriangle,
    hint: '该食材冷冻后会严重损害质地与品质（出水、变渣、油水分离），建议冷藏保存并尽快食用。',
    remaining: () => ''
  }
}

const statusMeta = computed(() => {
  if (!result.value) return null
  const meta = STATUS_META[result.value.status]
  return { ...meta, remainingText: meta.remaining(result.value) }
})

const resultCardClass = computed(() => (statusMeta.value && statusMeta.value.cardClass) || '')
const resultIcon = computed(() => (statusMeta.value && statusMeta.value.icon) || AlertTriangle)
</script>
