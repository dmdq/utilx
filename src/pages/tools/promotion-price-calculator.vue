<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Percent class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">大促到手价计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">定金膨胀+跨店满减+优惠券+红包逐层抵扣，算清大促真实到手价</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        按大促平台通用顺序逐层抵扣：① 商品标价 → ② 减定金膨胀让利（抵扣额 − 定金）→ ③ 减单品券 → ④ 剩余价判断跨店满减档（触达即减）→ ⑤ 减红包 = 到手价。
        每一层给出明细与剩余价，并折算总让利与折扣率，帮你判断「预售凑单到底值不值」。全部计算在浏览器本地完成。
      </p>
    </div>

    <!-- 口径提示 -->
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-6 flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        口径说明：定金膨胀让利按「抵扣额 − 定金」计算（如定金 100 抵 300，让利 200）；跨店满减按<strong>剩余价触达档位即减 W（一档）</strong>判断，
        与部分平台「每满 Z 减 W 可叠加多档」的规则可能不同，叠加档数请按平台规则另行折算；未计入运费、分期手续费与退定金情形，结果仅供参考。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <BadgePercent class="w-5 h-5 mr-2 text-primary" /> 优惠信息录入
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">商品标价（元）</label>
          <input
            v-model.number="price"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 1000"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">定金（元）</label>
            <input
              v-model.number="deposit"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 100"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">定金抵扣额（元）</label>
            <input
              v-model.number="deduct"
              type="number"
              min="0"
              step="1"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 300"
            />
          </div>
        </div>
        <p class="text-xs text-muted-foreground -mt-2">无预售定金活动时，两项都填 0</p>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">单品券金额（元）</label>
          <input
            v-model.number="coupon"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 50，没有填 0"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">跨店满减档（每满 Z 减 W）</label>
          <div class="grid grid-cols-3 gap-1.5 mb-2">
            <button
              v-for="opt in thresholdOptions"
              :key="opt.key"
              @click="applyThreshold(opt)"
              :class="fullZ === opt.z && cutW === opt.w ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ opt.label }}</button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-muted-foreground mb-1">每满 Z（元）</label>
              <input
                v-model.number="fullZ"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 300"
              />
            </div>
            <div>
              <label class="block text-xs text-muted-foreground mb-1">减 W（元）</label>
              <input
                v-model.number="cutW"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="如 50"
              />
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">红包金额（元）</label>
          <input
            v-model.number="redPacket"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 20，没有填 0"
          />
        </div>
      </div>

      <!-- 明细结果区 -->
      <div class="flex flex-col">
        <div class="bg-card border border-border rounded-lg p-6 flex-1">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <ReceiptText class="w-5 h-5 mr-2 text-primary" /> 逐层抵扣明细
          </h2>

          <div v-if="price > 0" class="space-y-2">
            <div
              v-for="step in result.steps"
              :key="step.key"
              class="flex items-center justify-between gap-2 bg-muted/50 rounded-lg px-3 py-2.5"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground">
                  <span class="inline-flex items-center justify-center w-5 h-5 mr-1 rounded-full bg-primary/10 text-primary text-xs font-bold">{{ step.no }}</span>
                  {{ step.label }}
                </p>
                <p class="text-xs text-muted-foreground mt-0.5 truncate">{{ step.desc }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p :class="['text-sm font-semibold', step.delta < 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground']">
                  {{ step.delta < 0 ? '− ¥' + fmt2(-step.delta) : '¥' + fmt2(step.after) }}
                </p>
                <p class="text-xs text-muted-foreground">剩余 ¥{{ fmt2(step.after) }}</p>
              </div>
            </div>

            <!-- 到手价汇总 -->
            <div class="bg-primary/10 rounded-lg p-4 text-center mt-3">
              <p class="text-xs text-muted-foreground mb-1">到手价（定金 ¥{{ fmt2(depositPart) }} + 尾款 ¥{{ fmt2(balancePart) }}）</p>
              <p class="text-3xl font-bold text-primary">¥{{ fmt2(result.final) }}</p>
              <p class="text-sm text-primary mt-1">
                共省 ¥{{ fmt2(result.saved) }} · 相当于 <span class="font-semibold">{{ fmt1(result.discountRate) }}</span> 折（立省 {{ fmt1(result.savedPercent) }}%）
              </p>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              折扣率 = 到手价 ÷ 标价；跨店满减按剩余价 ¥{{ fmt2(thresholdBase) }} 判断档位，{{ result.reached ? '已触达减 ¥' + fmt2(Math.max(0, cutW)) : '未触达或未设置，本层不减' }}。
            </p>
          </div>

          <div v-else class="p-8 text-center text-muted-foreground text-sm">
            输入商品标价后自动逐层计算
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于大促到手价</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            大促期间一件商品往往叠着四五层优惠：预售定金膨胀、单品券、跨店满减、平台红包……每层优惠的基数都不一样，
            只盯着「标价 × 折扣」很容易高估让利。逐层按顺序抵扣，才能算出下单时真实支付的到手价。
          </p>
          <h3 class="text-lg font-semibold text-foreground">到手价的逐层计算顺序</h3>
          <p>
            以标价 1000 元、定金 100 抵 300、单品券 50、跨店满减每满 300 减 50、红包 20 为例：
            ① 标价 1000；② 减定金膨胀让利（300 − 100 = 200）得 800；③ 减单品券 50 得 750；
            ④ 剩余价 750 已达 300 档，减 50 得 700；⑤ 减红包 20 得到手价 680 元，
            共省 320 元、约为标价的 6.8 折（立省 32%）。定金 100 + 尾款 580 = 680。
          </p>
          <h3 class="text-lg font-semibold text-foreground">定金膨胀是怎么让利的</h3>
          <p>
            「定金 X 抵 Y」意为付 X 元定金可当 Y 元使用，实际让利是 Y − X 而不是 Y——定金本身是你本来就要付的钱。
            真正的膨胀优惠 = 抵扣额 − 定金，所以「100 抵 300」的让利只有 200 元，别被「抵」字夸大的数字迷惑。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">满减应该按什么价格判断档位？</span>跨店满减通常按参加活动商品的实际成交价（已减券后）累计判断，本工具按减完单品券后的剩余价触达即减一档，叠加档数请按平台规则折算。</li>
            <li><span class="text-foreground font-medium">各层优惠顺序能换吗？</span>不同平台顺序略有差异（如红包先于满减），顺序会影响满减档位判断，本工具按「膨胀 → 券 → 满减 → 红包」的常见顺序计算，可微调各层金额近似模拟。</li>
            <li><span class="text-foreground font-medium">到手价包含运费吗？</span>不包含。偏远地区运费、分期手续费与价保差异都需另行考虑，比价时请把运费加回到手价里再对比。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'promotion-price-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Percent, BadgePercent, ReceiptText, AlertTriangle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: '大促到手价计算器 - 定金膨胀/跨店满减/券红包逐层抵扣',
  description: '在线大促到手价计算器，按标价→定金膨胀→单品券→跨店满减→红包五层顺序逐层抵扣，明细展示每层剩余价与触达判断，折算总让利、折扣率与定金尾款拆分，纯本地计算',
  keywords: '到手价计算, 定金膨胀怎么算, 跨店满减计算, 大促价格计算, 优惠叠加, 双十一到手价',
  author: 'Util工具箱',
  ogTitle: '大促到手价计算器 - 有条工具',
  ogDescription: '定金膨胀+跨店满减+优惠券+红包逐层抵扣，算清大促真实到手价',
  ogUrl: 'https://www.util.cn/tools/promotion-price-calculator',
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
          name: '大促到手价计算器',
          url: 'https://www.util.cn/tools/promotion-price-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['五层优惠逐层抵扣明细', '定金膨胀让利折算', '跨店满减档位触达判断', '折扣率与立省比例', '定金尾款拆分']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '大促到手价计算器', item: 'https://www.util.cn/tools/promotion-price-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '满减应该按什么价格判断档位？',
              acceptedAnswer: { '@type': 'Answer', text: '跨店满减通常按参加活动商品减券后的成交价累计判断，本工具按减完单品券后的剩余价触达即减一档。' }
            },
            {
              '@type': 'Question',
              name: '各层优惠顺序能换吗？',
              acceptedAnswer: { '@type': 'Answer', text: '各平台顺序略有差异，本工具按膨胀→券→满减→红包的常见顺序计算，可微调金额近似模拟其他顺序。' }
            },
            {
              '@type': 'Question',
              name: '到手价包含运费吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不包含，运费、分期手续费与价保差异需另行考虑，比价时请把运费加回到手价。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'promotion-price-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 到手价逐层计算纯函数（可独立提取测试） =====
// 口径：①标价 ②减定金膨胀让利(抵扣额−定金) ③减单品券 ④剩余价触达满减档即减 W（一档） ⑤减红包=到手价
const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100

function calcPromotionPrice(opts) {
  const price = Math.max(0, Number(opts.price) || 0)
  const deposit = Math.max(0, Number(opts.deposit) || 0)
  const deduct = Math.max(0, Number(opts.deduct) || 0)
  const coupon = Math.max(0, Number(opts.coupon) || 0)
  const fullZ = Math.max(0, Number(opts.fullZ) || 0)
  const cutW = Math.max(0, Number(opts.cutW) || 0)
  const redPacket = Math.max(0, Number(opts.redPacket) || 0)

  const steps = []

  // ① 标价
  steps.push({ key: 'price', no: '①', label: '商品标价', desc: '促销基准价', delta: 0, after: round2(price) })

  // ② 定金膨胀：让利 = 抵扣额 − 定金
  const inflate = Math.max(0, deduct - deposit)
  let base = price
  if (inflate > 0 || deposit > 0) {
    base = Math.max(0, price - inflate)
    steps.push({
      key: 'inflate', no: '②', label: '定金膨胀',
      desc: inflate > 0 ? '定金 ' + deposit + ' 抵 ' + deduct + '，让利 ' + round2(inflate) : '抵扣额不高于定金，无膨胀让利',
      delta: -round2(inflate), after: round2(base)
    })
  }

  // ③ 单品券
  const couponCut = Math.min(coupon, base)
  base = Math.max(0, base - couponCut)
  if (coupon > 0) {
    steps.push({ key: 'coupon', no: '③', label: '单品券', desc: '券面额 ' + coupon, delta: -round2(couponCut), after: round2(base) })
  }

  // ④ 跨店满减：剩余价触达档位即减 W（一档）
  const thresholdBase = base
  const reached = fullZ > 0 && cutW > 0 && base >= fullZ
  const fullCut = reached ? Math.min(cutW, base) : 0
  base = Math.max(0, base - fullCut)
  steps.push({
    key: 'threshold', no: '④', label: '跨店满减',
    desc: reached
      ? '剩余 ' + round2(thresholdBase) + ' ≥ ' + fullZ + '，触达一档减 ' + cutW
      : (fullZ > 0 ? '剩余 ' + round2(thresholdBase) + '，未满 ' + fullZ + ' 不触达' : '未设置满减档'),
    delta: -round2(fullCut), after: round2(base), reached
  })

  // ⑤ 红包 = 到手价
  const redCut = Math.min(redPacket, base)
  base = Math.max(0, base - redCut)
  if (redPacket > 0) {
    steps.push({ key: 'redpacket', no: '⑤', label: '红包', desc: '红包面额 ' + redPacket, delta: -round2(redCut), after: round2(base) })
  }

  const final = round2(base)
  const saved = round2(Math.max(0, price - final))
  return {
    steps,
    final,
    saved,
    savedPercent: price > 0 ? round2((saved / price) * 100) : 0,
    discountRate: price > 0 ? round2((final / price) * 10) : 0,
    depositPart: round2(Math.min(deposit, final)),
    balancePart: round2(Math.max(0, final - Math.min(deposit, final))),
    reached,
    thresholdBase: round2(thresholdBase)
  }
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const price = ref(1000)
const deposit = ref(100)
const deduct = ref(300)
const coupon = ref(50)
const fullZ = ref(300)
const cutW = ref(50)
const redPacket = ref(20)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const thresholdOptions = [
  { key: 'none', label: '不参与满减', z: 0, w: 0 },
  { key: '300-50', label: '每满300减50', z: 300, w: 50 },
  { key: '300-30', label: '每满300减30', z: 300, w: 30 },
  { key: '200-20', label: '每满200减20', z: 200, w: 20 }
]

const applyThreshold = (opt) => {
  fullZ.value = opt.z
  cutW.value = opt.w
}

const result = computed(() => calcPromotionPrice({
  price: price.value,
  deposit: deposit.value,
  deduct: deduct.value,
  coupon: coupon.value,
  fullZ: fullZ.value,
  cutW: cutW.value,
  redPacket: redPacket.value
}))

const thresholdBase = computed(() => result.value.thresholdBase)
const depositPart = computed(() => result.value.depositPart)
const balancePart = computed(() => result.value.balancePart)

// ---------- 格式 ----------
const fmt2 = (v) => (isFinite(v) ? (Math.round((Number(v) + Number.EPSILON) * 100) / 100).toFixed(2) : '—')
const fmt1 = (v) => (isFinite(v) ? (Math.round((Number(v) + Number.EPSILON) * 10) / 10).toString() : '—')
</script>
