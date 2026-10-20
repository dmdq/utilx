<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Handshake class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">礼金往来参考表</h1>
          <p class="text-sm text-muted-foreground mt-1">按场合、关系与城市线级给份子钱参考区间，附回礼对等建议</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        婚礼、满月、乔迁、寿宴、探病、升学六大场合 × 五种关系亲疏 × 四档城市线级的内置参考矩阵，选完即得建议金额区间与吉利数字建议；还能输入「对方当年给你的金额」按通胀折算回礼对等参考。区间为民间行情整理，视亲疏与当地风俗调整，全部内容本地计算不上传。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid md:grid-cols-2 gap-6 mb-8">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 我的情况
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">场合</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="o in occasions"
              :key="o"
              @click="occasion = o"
              :class="occasion === o ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ o }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">关系</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="r in relations"
              :key="r"
              @click="relation = r"
              :class="relation === r ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ r }}</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">城市线级</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="c in cityTiers"
              :key="c"
              @click="cityTier = c"
              :class="cityTier === c ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ c }}</button>
          </div>
          <p class="text-xs text-muted-foreground mt-1.5">线级主要影响行情基数，同场合同关系按民间惯例递减</p>
        </div>

        <div class="border-t border-border pt-4 space-y-3">
          <h3 class="text-sm font-medium text-foreground flex items-center gap-1.5">
            <ArrowLeftRight class="w-4 h-4 text-primary" /> 回礼对等折算（可选）
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">对方当年给的（元）</label>
              <input
                v-model.number="pastGift"
                type="number"
                min="0"
                step="100"
                class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 600"
              />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">距今（年）</label>
              <input
                v-model.number="yearsSince"
                type="number"
                min="0"
                max="30"
                step="1"
                class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">年通胀率（%）</label>
              <input
                v-model.number="inflRate"
                type="number"
                min="0"
                max="15"
                step="0.1"
                class="w-full px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Gift class="w-5 h-5 mr-2 text-primary" /> 建议区间
        </h2>

        <div class="bg-primary/10 rounded-lg p-5 text-center">
          <p class="text-xs text-muted-foreground mb-1">{{ occasion }} · {{ relation }} · {{ cityTier }}</p>
          <p class="text-3xl font-bold text-primary">¥{{ result.min }} - {{ result.max }}</p>
          <p class="text-[11px] text-muted-foreground mt-1.5">民间参考区间，视亲疏与当地风俗上下浮动</p>
        </div>

        <div class="bg-muted/50 rounded-lg p-4">
          <p class="text-sm font-medium text-foreground mb-2">吉利金额建议</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="n in luckySuggestions"
              :key="n"
              class="px-3 py-1.5 rounded-lg bg-green-600/10 text-green-700 dark:text-green-400 text-sm font-semibold border border-green-600/30"
            >¥{{ n }}</span>
          </div>
          <p class="text-xs text-muted-foreground mt-2 leading-relaxed">
            优先取 6/8/9 结尾（600 顺、800 发、999 长长久久、1314 一生一世适合婚礼）；尽量避开 400 及含 4 的数，若区间落在 400 可调整为 366 或 500。
          </p>
        </div>

        <div v-if="pastGift > 0" class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p class="text-sm font-medium text-foreground mb-1">回礼对等建议</p>
          <p class="text-xl font-bold text-foreground">¥{{ giftBack.amount }}</p>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            对方 {{ yearsSince }} 年前给过 ¥{{ fmt(pastGift) }}，按年通胀 {{ inflRate }}% 折算对等约 ¥{{ fmt(giftBack.raw) }}，
            向上取吉利数即建议值——回礼遵循「只多不少」原则，取建议区间下限与本数中的较高者更稳妥。
          </p>
          <NuxtLink
            to="/tools/inflation-calculator"
            class="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
          >
            <TrendingUp class="w-3.5 h-3.5" /> 用通货膨胀计算器看历年购买力变化
          </NuxtLink>
        </div>

        <div class="p-4 bg-muted/50 rounded-lg border border-border">
          <h3 class="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
            <Lightbulb class="w-4 h-4" /> 随礼小规矩
          </h3>
          <ul class="list-disc pl-5 space-y-1 text-xs text-muted-foreground leading-relaxed">
            <li>参加婚宴按「位」还是按「家庭」给，先问同去的朋友对齐金额，避免明显低于圈层行情</li>
            <li>探病、乔迁一般不双数忌讳反其道：白事（丧仪）不适用本表，按当地风俗以白包处理</li>
            <li>关系特别铁或至亲，区间上限只是起点，量力加「心意部分」即可</li>
            <li>同批同事随礼尽量统一数字，单独过高会让当事人尴尬</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 参考矩阵说明 -->
    <div class="bg-card border border-border rounded-lg p-4 mb-8 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        免责声明：礼金行情无官方标准，本表为民间公开讨论口径整理的一二线城市常见区间（基准为一线，其余线级按约 0.75 / 0.55 / 0.35 折算取整到百元），仅反映大致行情，实际以当地风俗、亲疏程度与自身经济状况为准。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>份子钱到底给多少合适</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            随礼的本质是人情账户的存取：金额由「场合轻重 × 关系亲疏 × 当地行情」三个变量决定。本工具把三者做成查表矩阵——例如婚礼·朋友·一线常见 800-1000 元，同条件县城约 300-400 元，普通同事再降一档——给出区间而不是单点，因为区间本身就是风俗的容错带。
          </p>
          <h3 class="text-lg font-semibold text-foreground">回礼为什么要「对等加价」</h3>
          <p>
            人情往来的潜规则是回礼不低于对方当年给数。但十年前的 600 元和今天的 600 元购买力不同，直接等额回礼在对方眼里可能「缩水」。按年通胀率把对方金额折算到今天，再向上取吉利数（如 600 元 8 年前、按 2% 通胀折算约 700 元，回 800 既体面又不突兀），是多数家庭账本里心照不宣的做法。
          </p>
          <h3 class="text-lg font-semibold text-foreground">吉利数字与禁忌</h3>
          <p>
            喜庆场合（婚礼、满月、乔迁、寿宴、升学）优先 600（顺）、800（发）、999（长久）、1001（千里挑一，适合给新人）、1314（一生一世，适合密友婚礼）、1999（一辈子长久）；避开 400 与含 4 的金额，数字 7 在部分地区也少用。探病金额宜平实（300、500），白事（丧仪）另用白包、按当地风俗，不适用本参考表。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题（FAQ）</h3>
          <div class="space-y-3">
            <div>
              <h4 class="font-semibold text-foreground">Q1：同事结婚，随礼给多少不踩坑？</h4>
              <p class="mt-1">普通同事按本表「普通同事」档（一线常见 400-600，县城更低），最稳妥做法是与同部门同事商量统一金额；关系好的朋友再单独上浮到朋友档。</p>
            </div>
            <div>
              <h4 class="font-semibold text-foreground">Q2：对方多年前随的礼，现在怎么回？</h4>
              <p class="mt-1">回礼只多不少：把对方当年的金额按通胀折算到今天（本工具内置回礼折算），向上取吉利数。如 8 年前对方给 600，约折算 700，回 800 体面。</p>
            </div>
            <div>
              <h4 class="font-semibold text-foreground">Q3：去不了婚礼现场，礼金还要给吗？</h4>
              <p class="mt-1">关系到了就要给，可取建议区间下限并附一句祝福说明；若对方此前也未随过你的礼且关系一般，则可只表心意。礼金往来终究以「对等+人情」为纲，不必被数字绑架。</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'gift-money-reference'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Handshake, Calculator, Gift, ArrowLeftRight, TrendingUp, Lightbulb, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '礼金往来参考表 - 份子钱随礼金额行情查询',
  description: '在线礼金往来参考表，婚礼/满月/乔迁/寿宴/探病/升学六大场合按关系亲疏与城市线级查份子钱参考区间，附吉利数字建议（600/800/999/1314）与回礼对等通胀折算建议，随礼不再纠结',
  keywords: '随礼多少合适, 份子钱行情, 朋友结婚随多少, 回礼金额, 人情礼金, 婚礼红包',
  author: 'Util工具箱',
  ogTitle: '礼金往来参考表 - 有条工具',
  ogDescription: '按关系亲疏场合与城市给份子钱参考区间，附回礼对等建议，随礼不再纠结',
  ogUrl: 'https://www.util.cn/tools/gift-money-reference',
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
          name: '礼金往来参考表',
          url: 'https://www.util.cn/tools/gift-money-reference',
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['六场合×五关系×四线级参考矩阵', '吉利金额建议', '回礼对等通胀折算', '随礼规矩提示', '纯本地查询']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '更多工具', item: 'https://www.util.cn/tools/' },
            { '@type': 'ListItem', position: 3, name: '礼金往来参考表', item: 'https://www.util.cn/tools/gift-money-reference/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '同事结婚随礼给多少不踩坑？',
              acceptedAnswer: { '@type': 'Answer', text: '普通同事按参考表的同事档区间，最稳妥是与同部门同事统一金额；关系好的朋友再上浮到朋友档（如婚礼·朋友·一线常见800-1000）。' }
            },
            {
              '@type': 'Question',
              name: '对方多年前随的礼现在怎么回？',
              acceptedAnswer: { '@type': 'Answer', text: '回礼只多不少：把对方当年金额按年通胀折算到今天，再向上取吉利数，如8年前600按2%通胀约折算700，回800体面。' }
            },
            {
              '@type': 'Question',
              name: '随礼有哪些数字讲究？',
              acceptedAnswer: { '@type': 'Answer', text: '喜庆场合优先600、800、999、1001、1314等含6/8/9的吉利数，避开400与含4金额；白事（丧仪）另用白包按当地风俗处理。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'gift-money-reference')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const occasion = ref('婚礼')
const relation = ref('朋友')
const cityTier = ref('一线')
const pastGift = ref(0)
const yearsSince = ref(3)
const inflRate = ref(2)

const seoContentVisible = ref(true)
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const occasions = ['婚礼', '满月', '乔迁', '寿宴', '探病', '升学']
const relations = ['普通同事', '朋友', '闺蜜兄弟', '亲戚', '领导长辈']
const cityTiers = ['一线', '新一线', '二三线', '县城']

const fmt = (v) => (isFinite(v) ? Math.round(v).toLocaleString('zh-CN') : '0')

// ---------- 静态参考矩阵（一线为基准，[min, max]） ----------
const BASE_MATRIX = {
  '婚礼': { '普通同事': [400, 600], '朋友': [800, 1000], '闺蜜兄弟': [1000, 2000], '亲戚': [1000, 2000], '领导长辈': [600, 1000] },
  '满月': { '普通同事': [200, 400], '朋友': [400, 600], '闺蜜兄弟': [600, 1000], '亲戚': [600, 1200], '领导长辈': [400, 600] },
  '乔迁': { '普通同事': [200, 400], '朋友': [400, 600], '闺蜜兄弟': [600, 1000], '亲戚': [600, 1200], '领导长辈': [400, 800] },
  '寿宴': { '普通同事': [300, 500], '朋友': [500, 800], '闺蜜兄弟': [800, 1200], '亲戚': [800, 1600], '领导长辈': [600, 1000] },
  '探病': { '普通同事': [200, 300], '朋友': [300, 500], '闺蜜兄弟': [500, 1000], '亲戚': [500, 1000], '领导长辈': [300, 600] },
  '升学': { '普通同事': [200, 400], '朋友': [300, 600], '闺蜜兄弟': [600, 1000], '亲戚': [600, 1000], '领导长辈': [400, 600] }
}

const TIER_FACTOR = { '一线': 1, '新一线': 0.75, '二三线': 0.55, '县城': 0.35 }

const round100 = (v) => Math.max(100, Math.round(v / 100) * 100)

// 查表（带越界兜底：场合/关系/线级缺失时回退到默认项）
const lookup = (occ, rel, tier) => {
  const baseRow = BASE_MATRIX[occ] || BASE_MATRIX['婚礼']
  const range = baseRow[rel] || baseRow['朋友']
  const factor = TIER_FACTOR[tier] === undefined ? 1 : TIER_FACTOR[tier]
  const min = round100(range[0] * factor)
  const max = Math.max(min + 100, round100(range[1] * factor))
  return { min, max }
}

const result = computed(() => lookup(occasion.value, relation.value, cityTier.value))

// ---------- 吉利数（区间内按 6/8/9 优选） ----------
const LUCKY = [100, 166, 168, 188, 200, 288, 300, 366, 500, 520, 600, 606, 666, 688, 800, 888, 999, 1000, 1001, 1200, 1314, 1666, 1888, 2000, 3399, 6666, 8888, 9999]

const luckyInRange = (min, max) => LUCKY.filter(n => n >= min && n <= max)

const luckySuggestions = computed(() => {
  const list = luckyInRange(result.value.min, result.value.max)
  return list.length ? list.slice(0, 6) : [result.value.min]
})

// 向上取吉利数（超出表尾则取整到百元，且避开整段「400」忌讳）
const roundUpLucky = (v) => {
  const hit = LUCKY.find(n => n >= v)
  if (hit) return hit
  let n = Math.ceil(v / 100) * 100
  if (n % 1000 === 400) n += 100
  return n
}

// ---------- 回礼对等折算 ----------
const giftBack = computed(() => {
  const base = Math.max(0, Number(pastGift.value) || 0)
  const years = Math.max(0, Number(yearsSince.value) || 0)
  const rate = Math.max(0, Math.min(15, Number(inflRate.value) || 0)) / 100
  const raw = base * Math.pow(1 + rate, years)
  return { raw, amount: roundUpLucky(raw) }
})
</script>
