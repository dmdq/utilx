<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Percent class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">增值税含税/不含税换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">价税分离与价外税加计双向换算，支持 13%/9%/6%/3%/1%/0% 税率与征收率</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线增值税含税/不含税换算工具：输入含税价或不含税价，选择适用税率或征收率，实时拆分不含税金额与税额，或加计还原含税金额；
        公式逐项代入数字展示，数量大于 1 时自动按单价口径拆分。全部计算在浏览器本地完成，不上传任何数据，报价、成本核算与开票前核对价税口径必备。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <!-- 金额 -->
        <div>
          <label for="vat-amount" class="block text-sm font-medium text-foreground mb-2">{{ amountLabel }}</label>
          <input
            id="vat-amount"
            v-model="amountText"
            type="number"
            min="0"
            step="any"
            placeholder="例如 11300"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p v-if="amountHint.type === 'error'" class="mt-2 text-xs text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ amountHint.text }}</span>
          </p>
          <p v-else-if="amountHint.type === 'ok'" class="mt-2 text-xs text-green-500 flex items-start gap-1.5">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ amountHint.text }}</span>
          </p>
          <p v-else class="mt-2 text-xs text-muted-foreground">{{ amountHint.text }}</p>
        </div>

        <!-- 换算方向 -->
        <div>
          <span class="block text-sm font-medium text-foreground mb-2">换算方向</span>
          <div class="space-y-2">
            <label
              class="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition"
              :class="direction === 'split' ? 'border-primary/50 bg-primary/5' : 'border-border bg-background hover:bg-muted/40'"
            >
              <input v-model="direction" value="split" type="radio" name="vat-direction" class="mt-0.5 accent-primary" />
              <span>
                <span class="block text-sm font-medium text-foreground">含税价 → 不含税价</span>
                <span class="block text-xs text-muted-foreground mt-0.5">价税分离：从含税价中拆出税额，还原净价</span>
              </span>
            </label>
            <label
              class="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition"
              :class="direction === 'add' ? 'border-primary/50 bg-primary/5' : 'border-border bg-background hover:bg-muted/40'"
            >
              <input v-model="direction" value="add" type="radio" name="vat-direction" class="mt-0.5 accent-primary" />
              <span>
                <span class="block text-sm font-medium text-foreground">不含税价 → 含税价</span>
                <span class="block text-xs text-muted-foreground mt-0.5">价外税加计：按税率在净价上加计税额</span>
              </span>
            </label>
          </div>
        </div>

        <!-- 税率 -->
        <div>
          <label for="vat-rate" class="block text-sm font-medium text-foreground mb-2">税率 / 征收率</label>
          <select
            id="vat-rate"
            v-model="rateValue"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="opt in rateOptions" :key="opt.label" :value="opt.value">{{ opt.label }}（{{ opt.short }}）</option>
          </select>
          <p v-if="rateNote" class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ rateNote }}</span>
          </p>
          <p v-else class="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ selectedRate.desc }}</span>
          </p>
        </div>

        <!-- 数量 -->
        <div>
          <label for="vat-quantity" class="block text-sm font-medium text-foreground mb-2">数量（选填，≥1）</label>
          <input
            id="vat-quantity"
            v-model="quantityText"
            type="number"
            min="1"
            step="any"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="mt-2 text-xs text-muted-foreground">仅用于按单价口径展示拆分结果，换算总额仍以输入金额为准，默认 1。</p>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition"
          >
            载入示例
          </button>
          <button
            @click="resetForm"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold flex items-center">
              <Percent class="w-5 h-5 mr-2 text-primary" /> 换算结果
            </h2>
            <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{{ directionText }}</span>
          </div>

          <!-- 三大结果卡 -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="card in resultCards" :key="card.key" class="rounded-lg border p-4" :class="card.cardClass">
              <div class="flex items-center justify-between mb-2 gap-1">
                <p class="text-xs font-medium text-muted-foreground">{{ card.label }}</p>
                <span class="px-1.5 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap" :class="card.badgeClass">{{ card.badge }}</span>
              </div>
              <p class="font-bold tabular-nums break-all" :class="card.valueClass">{{ card.valueText }}</p>
              <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{{ card.sub }}</p>
            </div>
          </div>

          <!-- 公式行 -->
          <div v-if="formulaLines" class="bg-muted/50 rounded-lg p-4 space-y-1.5 font-mono text-sm text-foreground overflow-x-auto">
            <p>{{ formulaLines.main }}</p>
            <p class="text-muted-foreground">{{ formulaLines.taxLine }}</p>
          </div>
          <div v-else class="rounded-lg border border-dashed border-border p-8 text-center">
            <Calculator class="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p class="text-sm text-muted-foreground">输入金额后自动代入公式计算</p>
            <p class="text-xs text-muted-foreground/70 mt-1">价税分离：含税价 ÷ (1 + 税率)；价外税加计：不含税价 × (1 + 税率)</p>
          </div>

          <!-- 单价表（数量 > 1） -->
          <div v-if="unitRows" class="rounded-lg border border-border overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border text-sm font-medium text-foreground">
              单价拆分（数量 × {{ quantity }}）
            </div>
            <table class="w-full text-sm">
              <tbody>
                <tr v-for="row in unitRows" :key="row.label" class="border-b border-border/60 last:border-b-0">
                  <td class="px-4 py-2.5 text-muted-foreground">{{ row.label }}</td>
                  <td class="px-4 py-2.5 text-right font-mono font-medium text-foreground">{{ row.value }} 元</td>
                </tr>
              </tbody>
            </table>
            <p class="px-4 py-2.5 text-[11px] text-muted-foreground border-t border-border/60">
              数量仅作单价展示倍数（各项单价 = 总额 ÷ 数量，四舍五入到分），换算与合计仍以输入总额为准。
            </p>
          </div>

          <!-- 免责小字 -->
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>计算结果为价税分离参考，开票金额、申报口径请以税控系统与主管税务机关要求为准。</span>
          </p>
        </div>

        <!-- 常用税率速查卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Percent class="w-5 h-5 mr-2 text-primary" /> 常用增值税税率 / 征收率速查
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground border-b border-border">
                  <th class="py-2 pr-4 font-medium whitespace-nowrap">税率 / 征收率</th>
                  <th class="py-2 font-medium">常见适用范围（速记）</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rateReference" :key="row.label" class="border-b border-border/60 last:border-b-0">
                  <td class="py-2.5 pr-4 font-mono font-semibold text-primary whitespace-nowrap align-top">{{ row.label }}</td>
                  <td class="py-2.5 text-muted-foreground leading-relaxed">{{ row.desc }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 text-xs text-muted-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>税率适用以国家税务总局现行文件为准，本表为常见情形速记。</span>
          </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>增值税含税/不含税换算是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          增值税含税/不含税换算器用于在「含税价」与「不含税价」之间双向换算并拆出税额。中国增值税在计税原理上是价外税，
          但日常零售报价习惯报含税价，因此成本核算、供应商比价、合同签订与开票时经常需要在两个口径之间还原：
          价税分离用「含税价 ÷ (1 + 税率)」，价外税加计用「不含税价 × (1 + 税率)」。本工具支持 13%、9%、6% 税率与 3%、1% 征收率及 0% 零税率，
          结果按分取整防浮点误差，全部计算在浏览器本地完成。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">含税价和不含税价的区别是什么？（价内税 vs 价外税）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          含税价是「价内税」口径：税款已经包含在成交价格里，消费者支付的就是最终金额，增值税专用发票/普通发票会把它拆成「金额」与「税额」两栏；
          不含税价是「价外税」口径：价格本身不含税，税款按税率另加。中国增值税采用价外税原理计税，
          但市场上习惯的零售报价、菜单价多为含税价，所以财务在做成本比较、毛利测算时，要先把含税报价价税分离成不含税价，才能与不含税报价放在同一口径下比较。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">13%、9%、6% 的税率分别适用什么？（速记）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          速记口径：13% 对应「货物与有形动产」——销售、进口货物，加工修理修配劳务，有形动产租赁；
          9% 对应「位移、建造、不动产与民生基础」——交通运输、邮政、建筑、不动产租赁与销售、土地使用权转让，以及农产品、自来水、天然气等；
          6% 对应「服务与金融」——现代服务（研发、信息技术、文化创意等）、金融服务、生活服务、增值电信服务。
          此外，小规模纳税人适用 3% 征收率（阶段性优惠期曾减按 1%，以当期政策为准），出口货物及规定的跨境应税行为适用零税率。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">小规模纳税人和一般纳税人怎么选？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          年应征增值税销售额不超过 500 万元可登记为小规模纳税人：按征收率（3%，优惠期可能减按 1%）简易计税，计算简便，但一般不能抵扣进项税额；
          一般纳税人适用 13%/9%/6% 税率，可以抵扣进项，适合客户需要增值税专用发票抵扣、进项取得充分的企业。
          怎么选主要看三点：下游客户是否需要专票抵扣、自身进项发票的取得程度、销售额规模与增长预期；
          超过标准应登记为一般纳税人，临界状态可结合连续 12 个月销售额测算，并向主管税务机关确认。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">报价含税还是不含税？合同里怎么写？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          实务提醒：报价与合同必须写清「含税 / 不含税」口径和适用税率，例如「单价 100 元（含 13% 增值税）」或「不含税单价 100 元，增值税按 13% 另计」。
          只写「100 元」容易在开票、结算时产生 13% 口径的差额争议；同时建议约定发票类型（专票/普票）、
          运输安装等价外费用是否含税、以及税率调整期「按开票当期适用税率/征收率执行」的条款。
          拿到对方含税报价后，可用本工具先价税分离，再与不含税报价统一口径比价。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">换算公式是怎么推导的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：含税价 = 不含税价 × (1 + 税率)。反向价税分离即：不含税价 = 含税价 ÷ (1 + 税率)，
          税额 = 含税价 − 不含税价（等价于含税价 ÷ (1 + 税率) × 税率）；正向加计即：税额 = 不含税价 × 税率，含税价 = 不含税价 + 税额。
          本页所有结果都按这一关系计算，并对每一步按分（两位小数）取整，避免浮点误差在累计金额上放大。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">增值税含税价怎么换算成不含税价？</h3>
            <p class="text-sm text-muted-foreground mt-1">不含税价 = 含税价 ÷ (1 + 税率)，税额 = 含税价 − 不含税价。例如含税 11300 元、税率 13%：不含税价 10000 元、税额 1300 元；输入金额并选择方向即可自动计算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">13%、9%、6% 分别适用于什么业务？</h3>
            <p class="text-sm text-muted-foreground mt-1">13%：销售进口货物、加工修理修配劳务、有形动产租赁；9%：交通运输、邮政、建筑、不动产、土地使用权转让、农产品等；6%：现代服务、金融服务、生活服务、增值电信服务。具体适用以国家税务总局现行文件为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">小规模纳税人适用什么征收率？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见适用 3% 征收率；阶段性优惠期内曾减按 1% 征收，是否执行、执行到何时以当期政策公告为准；出口货物及规定的跨境应税行为适用零税率，税额为 0。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">报价应该写含税还是不含税？</h3>
            <p class="text-sm text-muted-foreground mt-1">两种口径都可以，但必须在合同与报价单中写明含税/不含税及适用税率，并约定发票类型与价外费用口径；口径不清是开票与结算差额争议的常见来源。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'vat-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Percent, Calculator, CheckCircle, TriangleAlert,
  RefreshCw, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '增值税含税/不含税换算器 - 在线价税分离计算工具',
  description: '免费在线增值税含税价与不含税价双向换算工具，价税分离拆出税额、价外税加计还原含税价，支持 13%、9%、6%、3%、1% 税率征收率与 0% 零税率，代入数字实时公式与按数量单价拆分，报价核算开票核对必备，纯浏览器本地运行不上传',
  keywords: '增值税计算器,含税价转不含税价,不含税价转含税价,价税分离,税额计算,增值税税率,征收率,小规模纳税人,一般纳税人,含税单价',
  author: '有条工具',
  ogTitle: '增值税含税/不含税换算器 - 在线价税分离计算工具 | 有条工具',
  ogDescription: '含税价与不含税价双向换算，一键拆分税额，支持 13%/9%/6%/3%/1%/0% 税率与征收率。',
  ogUrl: 'https://www.util.cn/tools/vat-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据（SoftwareApplication + BreadcrumbList + FAQPage）
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '增值税含税/不含税换算器',
          url: 'https://www.util.cn/tools/vat-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '含税价 → 不含税价 价税分离',
            '不含税价 → 含税价 价外税加计',
            '13%/9%/6%/3%/1%/0% 税率与征收率',
            '税额高亮与代入数字的实时公式',
            '按数量拆分不含税单价/含税单价/单件税额',
            '本地运行不上传数据'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '增值税含税/不含税换算器', item: 'https://www.util.cn/tools/vat-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '增值税含税价怎么换算成不含税价？',
              acceptedAnswer: { '@type': 'Answer', text: '不含税价 = 含税价 ÷ (1 + 税率)，税额 = 含税价 − 不含税价。例如含税 11300 元、税率 13%：不含税价 10000 元、税额 1300 元；输入金额并选择方向即可自动计算。' }
            },
            {
              '@type': 'Question',
              name: '13%、9%、6% 分别适用于什么业务？',
              acceptedAnswer: { '@type': 'Answer', text: '13%：销售进口货物、加工修理修配劳务、有形动产租赁；9%：交通运输、邮政、建筑、不动产、土地使用权转让、农产品等；6%：现代服务、金融服务、生活服务、增值电信服务。具体适用以国家税务总局现行文件为准。' }
            },
            {
              '@type': 'Question',
              name: '小规模纳税人适用什么征收率？',
              acceptedAnswer: { '@type': 'Answer', text: '常见适用 3% 征收率；阶段性优惠期内曾减按 1% 征收，是否执行、执行到何时以当期政策公告为准；出口货物及规定的跨境应税行为适用零税率，税额为 0。' }
            },
            {
              '@type': 'Question',
              name: '报价应该写含税还是不含税？',
              acceptedAnswer: { '@type': 'Answer', text: '两种口径都可以，但必须在合同与报价单中写明含税/不含税及适用税率，并约定发票类型与价外费用口径；口径不清是开票与结算差额争议的常见来源。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 金额一律按“分”取整防浮点误差：Math.round(x * 100) / 100

// 价内税拆分（含税价 → 不含税价 + 税额）
// 价内税口径：含税价 ÷ (1 + 税率) × 税率 = 税额，即不含税价 = 含税价 ÷ (1 + 税率)，税额 = 含税价 − 不含税价
function vatSplit(gross, rate) {
  const net = Math.round((gross / (1 + rate)) * 100) / 100
  const tax = Math.round((gross - net) * 100) / 100
  return { net, tax }
}

// 价外税加计（不含税价 → 含税价 + 税额）：税额 = 不含税价 × 税率，含税价 = 不含税价 + 税额
function vatAdd(net, rate) {
  const tax = Math.round(net * rate * 100) / 100
  const gross = Math.round((net + tax) * 100) / 100
  return { tax, gross }
}

// 千分位 + 固定 2 位小数（不使用 toLocaleString，保证 SSR 与浏览器输出一致）
function fmtMoney(n) {
  const rounded = Math.round(n * 100) / 100
  const sign = rounded < 0 ? '-' : ''
  const [intPart, decPart] = Math.abs(rounded).toFixed(2).split('.')
  return sign + intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + decPart
}

// 公式文案用普通数字（千分位会干扰“÷ (1 + 0.13)”的阅读），按分取整
function plainNum(n) {
  return String(Math.round(n * 100) / 100)
}

// 解析正数金额：非法或 ≤ 0 返回 null
function parsePositive(text) {
  const n = Number(text)
  return Number.isFinite(n) && n > 0 ? n : null
}

// 解析数量：非法或 < 1 时按 1 处理
function parseQuantity(text) {
  const n = Number(text)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

// 单价拆分：各项单价 = 总额 ÷ 数量，四舍五入到分（合计以总额为准）
function unitPrices(net, tax, gross, quantity) {
  const d = quantity > 0 ? quantity : 1
  return {
    netUnit: Math.round((net / d) * 100) / 100,
    taxUnit: Math.round((tax / d) * 100) / 100,
    grossUnit: Math.round((gross / d) * 100) / 100
  }
}

// 价税分离公式文案（代入实际数字）
function splitFormula(gross, rate, net, tax) {
  return {
    main: `${plainNum(gross)} ÷ (1 + ${plainNum(rate)}) = ${net.toFixed(2)}`,
    taxLine: `税额 = ${plainNum(gross)} − ${net.toFixed(2)} = ${tax.toFixed(2)}`
  }
}

// 价外税加计公式文案（代入实际数字）
function addFormula(net, rate, tax, gross) {
  return {
    main: `${plainNum(net)} × (1 + ${plainNum(rate)}) = ${gross.toFixed(2)}`,
    taxLine: `税额 = ${plainNum(net)} × ${plainNum(rate)} = ${tax.toFixed(2)}`
  }
}

// ---------- 静态定义 ----------
const rateOptions = [
  { value: 0.13, label: '13%', short: '一般纳税人货物销售、租赁', desc: '一般纳税人销售、进口货物，加工修理修配劳务，有形动产租赁' },
  { value: 0.09, label: '9%', short: '交通、建筑、不动产、农产品等', desc: '交通运输、邮政、建筑、不动产租赁与销售、土地使用权转让，以及农产品、自来水、天然气等' },
  { value: 0.06, label: '6%', short: '现代服务、金融、生活服务', desc: '现代服务（研发、信息技术、文化创意等）、金融服务、生活服务、增值电信服务' },
  { value: 0.03, label: '3%', short: '小规模征收率', desc: '小规模纳税人适用征收率，以及一般纳税人的简易计税情形' },
  { value: 0.01, label: '1%', short: '小规模优惠期征收率', desc: '小规模纳税人阶段性减免优惠期征收率，政策执行期以公告为准' },
  { value: 0, label: '0%', short: '零税率（出口等）', desc: '出口货物与规定的跨境应税行为适用零税率，税额为 0' }
]

// 常用税率速查卡：13%/9%/6%/3%/1% 五行（0% 为特殊情形，不列入速查表）
const rateReference = rateOptions
  .filter((opt) => opt.value > 0)
  .map((opt) => ({ label: opt.label, desc: opt.desc }))

// ---------- 表单状态 ----------
const amountText = ref('11300')          // 金额输入（保留原始字符串，避免输入过程丢精度）
const direction = ref('split')           // split: 含税→不含税；add: 不含税→含税
const rateValue = ref(0.13)
const quantityText = ref('1')
const seoContentVisible = ref(true)

const parsedAmount = computed(() => parsePositive(amountText.value))
const quantity = computed(() => parseQuantity(quantityText.value))
const selectedRate = computed(() => rateOptions.find((opt) => opt.value === rateValue.value) || rateOptions[0])
const directionText = computed(() =>
  direction.value === 'split' ? '含税价 → 不含税价（价税分离）' : '不含税价 → 含税价（价外税加计）'
)
const amountLabel = computed(() => (direction.value === 'split' ? '含税金额（元）' : '不含税金额（元）'))

const rateNote = computed(() => {
  if (rateValue.value === 0.01) return '1% 为阶段性优惠，以当期政策为准。'
  if (rateValue.value === 0) return '0% 为零税率：含税金额与不含税金额相同，税额为 0。'
  return ''
})

const amountHint = computed(() => {
  const text = amountText.value.trim()
  if (!text) {
    return {
      type: 'empty',
      text: direction.value === 'split' ? '输入含税金额，自动拆分不含税金额与税额' : '输入不含税金额，自动加计税额与含税金额'
    }
  }
  if (parsedAmount.value === null) {
    return { type: 'error', text: '请输入大于 0 的金额' }
  }
  return { type: 'ok', text: `按 ${selectedRate.value.label} ${direction.value === 'split' ? '价税分离' : '价外税加计'}实时计算` }
})

// 换算结果：null 表示金额无效，known 标记输入口径
const result = computed(() => {
  const amount = parsedAmount.value
  if (amount === null) return null
  const rate = rateValue.value
  if (direction.value === 'split') {
    const split = vatSplit(amount, rate)
    return { known: 'gross', gross: amount, net: split.net, tax: split.tax }
  }
  const added = vatAdd(amount, rate)
  return { known: 'net', net: amount, tax: added.tax, gross: added.gross }
})

// 三大结果卡：按方向自动强调已知项（输入值）与求解项（加大显示），税额卡始终高亮
const resultCards = computed(() => {
  const r = result.value
  const defs = [
    {
      key: 'net',
      label: '不含税金额',
      sub: direction.value === 'split' ? '含税价 ÷ (1 + 税率) 求得' : '输入的不含税价',
      role: direction.value === 'split' ? 'solved' : 'known'
    },
    {
      key: 'tax',
      label: '税额',
      sub: direction.value === 'split' ? '价内税：已包含在含税价中' : '价外税：在不含税价上加计',
      role: 'tax'
    },
    {
      key: 'gross',
      label: '含税金额',
      sub: direction.value === 'add' ? '不含税价 × (1 + 税率) 求得' : '输入的含税价',
      role: direction.value === 'add' ? 'solved' : 'known'
    }
  ]
  return defs.map((def) => ({
    ...def,
    valueText: r ? fmtMoney(r[def.key]) : '—',
    badge: def.role === 'known' ? '输入值' : def.role === 'solved' ? '求解结果' : direction.value === 'split' ? '价内税' : '价外税',
    cardClass: def.role === 'solved' ? 'border-primary/40 bg-primary/5' : def.role === 'tax' ? 'border-amber-500/30 bg-amber-500/10' : 'border-border bg-muted/30',
    valueClass: def.role === 'solved' ? 'text-3xl text-primary' : def.role === 'tax' ? 'text-2xl text-amber-600 dark:text-amber-400' : 'text-2xl text-foreground',
    badgeClass: def.role === 'solved' ? 'bg-primary/10 text-primary border-primary/20' : def.role === 'tax' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-muted text-muted-foreground border-border'
  }))
})

// 公式行：null 表示金额无效
const formulaLines = computed(() => {
  const r = result.value
  if (!r) return null
  return direction.value === 'split'
    ? splitFormula(r.gross, rateValue.value, r.net, r.tax)
    : addFormula(r.net, rateValue.value, r.tax, r.gross)
})

// 数量 > 1 时的单价表
const unitRows = computed(() => {
  const r = result.value
  if (!r || quantity.value <= 1) return null
  const units = unitPrices(r.net, r.tax, r.gross, quantity.value)
  return [
    { label: '不含税单价', value: fmtMoney(units.netUnit) },
    { label: '单件税额', value: fmtMoney(units.taxUnit) },
    { label: '含税单价', value: fmtMoney(units.grossUnit) }
  ]
})

// ---------- 操作 ----------
function loadExample() {
  amountText.value = '11300'
  direction.value = 'split'
  rateValue.value = 0.13
  quantityText.value = '1'
}

function resetForm() {
  amountText.value = ''
  direction.value = 'split'
  rateValue.value = 0.13
  quantityText.value = '1'
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('vat-calculator')
})
</script>
