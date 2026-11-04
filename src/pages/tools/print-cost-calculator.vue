<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Printer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">3D 打印成本计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">耗材、电费、机器折旧、失败率加成、后处理五要素算清单件成本，切片读数直接代入，接单价三档速查</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 3D 打印成本估算工具：把切片软件预览给出的耗材克数与打印时长代入，按「材料费 + 电费 + 折旧 + 失败率期望加成 + 后处理人工」逐项算出单件成本底数与每克成本，
        支持 PLA / PETG / ABS / TPU / 树脂等 8 档常见耗材预设、按克价或整卷价两种计价、100% / 200% / 自定义毛利三档建议接单价，并可一键复制报价单文本。
        适合 FDM 爱好者核算长件值不值、淘宝代打与创客集市快速报价。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Printer class="w-5 h-5 mr-2 text-primary" /> 成本参数
        </h2>

        <div class="flex gap-2">
          <button
            v-for="p in INPUT_PRESETS"
            :key="p.id"
            @click="applyInputPreset(p)"
            class="flex-1 px-2 py-2 text-xs font-medium bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition"
          >
            <Play class="w-3 h-3 inline mr-1 -mt-0.5 text-primary" />{{ p.name }}
          </button>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">耗材重量 <span class="text-muted-foreground">g（切片器读数）</span></label>
          <input v-model.number="grams" type="number" min="0" step="1" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">计价方式</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="priceMode = 'perKg'"
              class="px-2 py-2 text-xs font-medium border rounded-lg transition"
              :class="priceMode === 'perKg' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'"
            >按克价（元/kg）</button>
            <button
              @click="priceMode = 'spool'"
              class="px-2 py-2 text-xs font-medium border rounded-lg transition"
              :class="priceMode === 'spool' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'"
            >按整卷价</button>
          </div>
        </div>

        <div v-show="priceMode === 'perKg'" class="space-y-2">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">耗材预设</label>
            <select :value="presetSel" @change="onPresetChange" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option v-for="f in FILAMENT_PRESETS" :key="f.id" :value="f.id">{{ f.name }} · {{ f.pricePerKg }} 元/kg</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">耗材单价 <span class="text-muted-foreground">元/kg（树脂按 ml 售卖见下方说明）</span></label>
            <input v-model.number="pricePerKgInput" type="number" min="0" step="5" @input="presetSel = 'custom'" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div v-show="priceMode === 'spool'" class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">整卷价 <span class="text-muted-foreground">元/卷</span></label>
            <input v-model.number="spoolPrice" type="number" min="0" step="1" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">卷净重 <span class="text-muted-foreground">g</span></label>
            <input v-model.number="spoolGrams" type="number" min="0" step="50" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <p class="col-span-2 text-xs text-muted-foreground">折合 <span class="font-mono text-foreground">{{ effectivePricePerKg }}</span> 元/kg（净重不含线轴，线轴一般 200-300g，别算进去）</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">打印时长 <span class="text-muted-foreground">h（切片读数）</span></label>
            <input v-model.number="hours" type="number" min="0" step="0.5" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">机器功率 <span class="text-muted-foreground">W</span></label>
            <select v-model.number="watts" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option v-for="w in MACHINE_POWER_OPTIONS" :key="w" :value="w">{{ w }} W</option>
            </select>
          </div>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed -mt-2">加热床占大头：整机功率多为热床 + 热端维持叠加，占空比低于 100%，按下拉档位估算偏保守。</p>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">电价 <span class="text-muted-foreground">元/kWh（默认 0.6）</span></label>
          <input v-model.number="pricePerKwh" type="number" min="0" step="0.1" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">机器价格 <span class="text-muted-foreground">元</span></label>
            <input v-model.number="machinePrice" type="number" min="0" step="100" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">预估寿命 <span class="text-muted-foreground">h</span></label>
            <input v-model.number="lifespanHours" type="number" min="1" step="500" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">失败率 <span class="text-muted-foreground">{{ failurePct }}%（0-50，期望加成 {{ factorText }}）</span></label>
          <input v-model.number="failurePct" type="range" min="0" max="50" step="1" class="w-full accent-primary" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">后处理人工 <span class="text-muted-foreground">元/件（打磨/喷涂，选填）</span></label>
          <input v-model.number="postProcess" type="number" min="0" step="1" class="w-full px-3 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <button
          @click="resetParams"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>
      </div>

      <!-- 结果面板（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Zap class="w-5 h-5 mr-2 text-primary" /> 成本瀑布（单件）
          </h2>

          <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5" :class="inputsValid ? '' : 'bg-red-500/10'">
            <CheckCircle v-if="inputsValid" class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <TriangleAlert v-else class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{{ inputsValid ? '已按切片读数生成五项成本明细与三档建议报价。' : '请填写耗材重量与打印时长（取切片软件预览读数），右侧即时给出成本底数。' }}</span>
          </p>

          <div class="bg-primary/10 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="text-center sm:text-left">
              <p class="text-xs text-muted-foreground mb-1">单件总成本（含失败率期望加成）</p>
              <p class="text-4xl font-bold text-primary">{{ totalCost.toFixed(2) }}<span class="text-base font-medium text-muted-foreground ml-1">元</span></p>
            </div>
            <div class="text-center sm:text-right">
              <p class="text-xs text-muted-foreground mb-1">每克成本（代打比价）</p>
              <p class="text-xl font-bold text-foreground font-mono">{{ perGram.toFixed(3) }} 元/g</p>
              <p class="text-[10px] text-muted-foreground">某宝代打约 0.5-1 元/克，波动大</p>
            </div>
          </div>

          <div class="space-y-2.5">
            <div v-for="item in waterfall" :key="item.key">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-foreground">{{ item.name }}</span>
                <span class="font-mono text-muted-foreground">{{ item.amount.toFixed(2) }} 元 · {{ item.pct.toFixed(1) }}%</span>
              </div>
              <div class="h-2 rounded-full bg-muted overflow-hidden">
                <div class="h-full rounded-full transition-all" :class="item.color" :style="{ width: item.amount > 0 ? Math.min(100, Math.max(item.pct, 1.5)) + '%' : '0%' }"></div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="tier in tierCards" :key="tier.label" class="bg-muted/50 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">{{ tier.desc }}</p>
              <p class="text-2xl font-bold text-foreground">{{ tier.value.toFixed(2) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">{{ tier.label }}</p>
            </div>
            <div class="bg-muted/50 border border-border rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">毛利 <input v-model.number="customMargin" type="number" min="0" step="10" class="w-14 px-1 py-0.5 bg-background border border-border rounded text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary" />%</p>
              <p class="text-2xl font-bold text-foreground">{{ quoteCustom.toFixed(2) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">自定义报价</p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed -mt-2">常见接单打法定位：×2 走量薄利、×3 含打样翻台损耗、更高倍数看后处理与急单程度——本工具只给成本底数，利润自己拍。</p>
        </div>

        <!-- 失败率误区科普 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2.5">
          <h3 class="text-base font-semibold text-foreground flex items-center">
            <TriangleAlert class="w-4 h-4 mr-2 text-amber-500" /> 失败率误区：为什么是 ÷(1−p)，不是 ×(1+p)
          </h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            直觉错法：成本 100 元、失败率 10%，就按 100 × 1.1 = 110 元——这是把「每尝试一件」当成「每成功一件」。
          </p>
          <p class="text-sm text-muted-foreground leading-relaxed">
            期望口径：平均每 1 ÷ (1−0.1) ≈ 1.11 次尝试才出 1 件成品，失败的耗材、电费、机时都要摊进成品，100 ÷ 0.9 ≈ 111.11 元。
          </p>
          <p class="text-sm text-muted-foreground leading-relaxed">
            即失败率 10% 实际加成 <span class="font-mono text-foreground">×1.11</span>（+11.1%）而不是 +10%；失败率越高差得越大，30% 时要 ÷0.7 ≈ +42.9%。本页瀑布里的「失败率加成」行按此口径计算。
          </p>
        </div>

        <!-- 报价单文本 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-base font-semibold text-foreground">报价单文本</h3>
            <button
              @click="copyQuoteText"
              class="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 border border-border rounded-lg transition flex items-center gap-1.5"
              :class="copied ? 'text-green-600' : 'text-foreground'"
            >
              <CheckCircle v-if="copied" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copied ? '已复制' : '复制报价单' }}
            </button>
          </div>
          <pre class="text-xs font-mono leading-relaxed bg-muted/60 rounded-lg p-4 whitespace-pre-wrap break-all text-foreground">{{ quoteText }}</pre>
        </div>
      </div>
    </div>

    <!-- 页面说明条 -->
    <div class="flex items-start gap-2 bg-muted/60 border border-border rounded-lg p-3 mb-8 text-xs text-muted-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>打印时间与耗材重常取自切片软件预览；失败率按你的机器与材料经验值加计——接单报价请再叠加人工与利润，本工具给的是成本底数。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>3D 打印成本由哪几项构成？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          一件打印成品的真实成本 = 耗材材料费（克重 × 折合克价）+ 电费（时长 × 整机功率 × 电价）+ 机器折旧（时长 × 机价 ÷ 预估寿命）+ 失败率期望加成 + 后处理人工。
          多数人只算了第一项，把「材料 × 2」当报价，长件会严重亏掉机时与失败损耗。本工具把五项拆成成本瀑布，逐行给出金额与占比，并换算成代打市场通用的「每克成本」口径。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">切片软件能导出成本吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Cura 可填材料单价并在预览中估算耗材花费，PrusaSlicer 预览会给出克重与预估电量，拓竹 Bambu Studio 支持按耗材库计价——但三家默认价常与你的实际购入价脱节，且切片估算普遍偏乐观
          （支撑、擦塔、换料失败都不计）。正确姿势：克重与时长取切片「读数」当输入，单价、功率、电价、寿命、失败率按自己的台账填，本工具不直接读取切片报告文件。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">电费与折旧真的占大头吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          分件型：1.5 小时、20g 的小挂件，材料费约占一半，电费只有几分钱，折旧也有限；而 12 小时、150g 的 PETG 功能件，电费 + 折旧合计约与材料费持平甚至反超——长件的机时才是隐形成本。
          2000 元的机器按 2000 小时寿命折算就是 1 元/小时，跑一整晚等于「烧掉半台 Voron 的月供」。给长件报价前先看看瀑布里电费折旧的占比条。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么报价要按失败率「除」不是「乘」？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          失败率 p 的含义是「每次尝试失败的概率」，要产出一件成品，平均需要 1 ÷ (1−p) 次尝试，成本也要按这个期望倍数摊。10% 失败率对应 ×1.111（+11.1%），若偷懒按 ×1.1（+10%）就系统性少收；
          30% 失败率对应 ÷0.7 ≈ ×1.43（+42.9%），差距进一步拉开。这也是高失败率材料（如易翘边的 ABS）报价应显著上浮的数学原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">耗材按克还是按整卷算成本？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          底层口径都是「折合元/kg」：按克价就是标注价；按整卷价则是卷价 ÷ 净重（1 kg 卷装、69 元购入即 69 元/kg，别把 200-300g 的线轴毛重算进去）。
          光固化树脂常按 ml 卖，密度约 1.05-1.1 g/ml，100 ml ≈ 105-110 g，先换算成克价再代入；树脂机功率低但后处理（清洗、二次固化、废液）重，建议把后处理人工如实填高。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">接单价市场参考</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          某宝 / 闲鱼 FDM 代打常见区间约 0.5-1 元/克（波动大：急单、大尺寸、多色、后处理精细都会上浮，批量白件低于此），本工具算出的每克成本是你的底线——报价低于它就是在贴钱接单。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">3D 打印一件的成本包含什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">五项：耗材材料（克重×折合克价）、电费（时长×功率×电价）、机器折旧（时长×机价÷寿命）、失败率期望加成（÷(1−p)）、后处理人工。本工具逐项给出金额与占比，合计即成本底数，报价在其上叠加利润。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">失败率 10% 为什么成本加成是 11.1% 而不是 10%？</h3>
            <p class="text-sm text-muted-foreground mt-1">因为要产出 1 件成品平均需要 1÷0.9≈1.11 次尝试，失败那次的耗材电费折旧也要摊进成品，所以正确公式是成本÷(1−p)；按×(1+p) 算会系统性低估，30% 失败率时两者差 12.9 个百分点。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。参数输入、五项成本、报价档与报价单文本全部在你的浏览器内存中即时计算，不发送任何网络请求，也不写入本地存储；刷新页面即回到默认值。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'print-cost-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Printer, Zap, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '3D打印成本计算器 - 在线耗材电费折旧接单报价估算工具',
  description: '免费在线3D打印成本计算器：代入切片软件的耗材克重与打印时长，按材料、电费、机器折旧、失败率期望加成、后处理五项算清单件成本与每克成本，PLA/PETG/TPU/树脂8档预设，×2/×3/自定义三档建议接单价，一键复制报价单，纯浏览器本地计算不上传',
  keywords: '3D 打印成本计算,打印耗时电费,耗材成本,打印机折旧,接单报价',
  author: '有条工具',
  ogTitle: '3D打印成本计算器 - 在线耗材电费折旧接单报价估算工具 | 有条工具',
  ogDescription: '材料+电费+折旧+失败率+后处理五项拆出单件成本，失败率按 ÷(1−p) 期望口径加成，×2/×3/自定义三档接单价，纯本地计算。',
  ogUrl: 'https://www.util.cn/tools/print-cost-calculator',
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
          name: '3D 打印成本计算器',
          url: 'https://www.util.cn/tools/print-cost-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['材料/电费/折旧/失败率/后处理五项成本瀑布', '按克价与整卷价双模式', 'PLA/PETG/ABS/TPU/树脂 8 档预设', '失败率 ÷(1−p) 期望加成', '×2/×3/自定义三档建议报价', '每克成本代打比价', '报价单一键复制', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '3D 打印成本计算器', item: 'https://www.util.cn/tools/print-cost-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '3D打印一件的成本包含什么？',
              acceptedAnswer: { '@type': 'Answer', text: '五项：耗材材料（克重×折合克价）、电费（时长×功率×电价）、机器折旧（时长×机价÷预估寿命）、失败率期望加成（成本÷(1−p)）、后处理人工。本工具逐项给出金额与占比，合计即成本底数，接单报价在其上再叠加利润。' }
            },
            {
              '@type': 'Question',
              name: '失败率10%为什么成本加成是11.1%而不是10%？',
              acceptedAnswer: { '@type': 'Answer', text: '产出1件成品平均需要1÷0.9≈1.11次尝试，失败一次的耗材、电费与机时要摊进成品，所以正确公式是成本÷(1−p)而不是×(1+p)。按乘法会系统性低估，30%失败率时两种算法相差12.9个百分点。' }
            },
            {
              '@type': 'Question',
              name: '切片软件估算的克重和时长可信吗？',
              acceptedAnswer: { '@type': 'Answer', text: 'Cura、PrusaSlicer、Bambu Studio 的预览克重与时长可作为输入基准，但普遍偏乐观：支撑、擦塔、换料与打印失败都不计入。建议读数照填，单价按实际购入价折算，再用失败率期望加成覆盖损耗。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const round2 = (x) => Math.round(x * 100) / 100
const round3 = (x) => Math.round(x * 1000) / 1000
const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0)

// 失败率安全区间：负数视为 0，上限 90%（防 ÷0，UI 本身限制 0-50）
function clampFailure(pct) {
  const p = Number.isFinite(Number(pct)) ? Number(pct) : 0
  return Math.min(Math.max(p, 0), 90)
}

// 材料费 = 克重 ÷ 1000 × 元/kg，保留 3 位
function materialCostOf(grams, pricePerKg) {
  return round3(num(grams) / 1000 * num(pricePerKg))
}

// 电费 = 时长 × 功率 ÷ 1000（kWh）× 电价，保留 3 位
function energyCostOf(hours, watts, pricePerKwh) {
  return round3(num(hours) * num(watts) / 1000 * num(pricePerKwh))
}

// 折旧 = 时长 × (机价 ÷ 寿命h)，寿命非法时为 0，保留 3 位
function depreciationOf(hours, machinePrice, lifespanHours) {
  if (num(lifespanHours) <= 0) return 0
  return round3(num(hours) * num(machinePrice) / num(lifespanHours))
}

// 期望口径加成：成本 ÷ (1−p)。经典误区——失败率 10% 是 ÷0.9≈+11.1%，不是 ×1.1=+10%
function expectedCostOf(sum, failurePct) {
  const p = clampFailure(failurePct) / 100
  return round3(num(sum) / (1 - p))
}

// 失败率系数文案（如 10% → ×1.11），与 expectedCostOf 同口径
function failureFactorText(failurePct) {
  return '×' + (1 / (1 - clampFailure(failurePct) / 100)).toFixed(2)
}

// 合计：材料+电费+折旧先按期望口径加成，后处理不参与加成（坏件一般没进后处理），保留 2 位
function totalCostOf(parts) {
  const base = num(parts.material) + num(parts.energy) + num(parts.depreciation)
  const withFailure = expectedCostOf(base, parts.failurePct)
  return round2(withFailure + num(parts.postProcess))
}

// 建议接单价 = 成本 × (1 + 毛利率%)，常见 100%-300%
function quoteOf(total, marginPct) {
  const m = Number.isFinite(Number(marginPct)) ? Math.max(Number(marginPct), 0) : 0
  return round2(num(total) * (1 + m / 100))
}

// 每克成本（代打市场按克比价的口径），保留 3 位
function perGramOf(total, grams) {
  if (num(grams) <= 0) return 0
  return round3(num(total) / num(grams))
}

// 整卷价折合成元/kg（净重克数），保留 2 位
function spoolPriceToPerKg(spoolPrice, spoolGrams) {
  if (num(spoolGrams) <= 0) return 0
  return round2(num(spoolPrice) / (num(spoolGrams) / 1000))
}

// 报价单文本（纯函数：传快照对象，返回多行字符串）
function buildQuoteText(ctx) {
  const lines = [
    `【3D 打印成本与报价单】`,
    `耗材：${ctx.grams}g × ${ctx.pricePerKg} 元/kg → 材料 ${ctx.material.toFixed(2)} 元`,
    `电费：${ctx.hours}h × ${ctx.watts}W × ${ctx.pricePerKwh} 元/kWh → ${ctx.energy.toFixed(2)} 元`,
    `折旧：机价 ${ctx.machinePrice} 元 / 寿命 ${ctx.lifespanHours}h → ${ctx.depreciation.toFixed(2)} 元`,
    `失败率 ${ctx.failurePct}%（期望 ${ctx.factorText}）→ 加成 +${ctx.uplift.toFixed(2)} 元`,
    `后处理人工：${ctx.postProcess.toFixed(2)} 元`,
    `——`,
    `单件成本：${ctx.total.toFixed(2)} 元（${ctx.perGram.toFixed(3)} 元/g）`,
    `建议接单：×2 ${ctx.q2.toFixed(2)} 元 | ×3 ${ctx.q3.toFixed(2)} 元 | 毛利${ctx.margin}% ${ctx.qc.toFixed(2)} 元`
  ]
  return lines.join('\n')
}

// 常见耗材预设（8 档，元/kg；树脂按 ml 售卖时先按密度 1.05-1.1 折成克价）
const FILAMENT_PRESETS = [
  { id: 'pla-basic', name: 'PLA 基础', pricePerKg: 60 },
  { id: 'pla-tough', name: 'PLA  tough/丝绸', pricePerKg: 80 },
  { id: 'pla-speed', name: 'PLA 高速', pricePerKg: 120 },
  { id: 'petg', name: 'PETG 通用', pricePerKg: 90 },
  { id: 'abs', name: 'ABS', pricePerKg: 70 },
  { id: 'tpu', name: 'TPU 软胶', pricePerKg: 150 },
  { id: 'resin', name: '光固化树脂', pricePerKg: 120 },
  { id: 'nylon', name: '尼龙 PA', pricePerKg: 200 }
]

// 常见整机功率档位（W，加热床占大头）
const MACHINE_POWER_OPTIONS = [120, 150, 250, 400]

const DEFAULT_INPUT = {
  grams: 100, priceMode: 'perKg', presetSel: 'pla-basic', pricePerKg: 60,
  spoolPrice: 60, spoolGrams: 1000, hours: 4, watts: 150, pricePerKwh: 0.6,
  machinePrice: 2000, lifespanHours: 2000, failurePct: 10, postProcess: 0, customMargin: 150
}

// 手算可核对的两组输入预设
const INPUT_PRESETS = [
  { id: 'pendant', name: '小挂件', label: '20g PLA · 1.5h', data: { grams: 20, presetSel: 'pla-basic', pricePerKg: 60, hours: 1.5, watts: 150, pricePerKwh: 0.6, machinePrice: 2000, lifespanHours: 3000, failurePct: 5, postProcess: 0 } },
  { id: 'functional', name: '功能件', label: '150g PETG · 12h', data: { grams: 150, presetSel: 'petg', pricePerKg: 90, hours: 12, watts: 250, pricePerKwh: 0.6, machinePrice: 2000, lifespanHours: 2000, failurePct: 10, postProcess: 0 } }
]

// ---------- 响应式状态 ----------
const grams = ref(DEFAULT_INPUT.grams)
const priceMode = ref(DEFAULT_INPUT.priceMode)
const presetSel = ref(DEFAULT_INPUT.presetSel)
const pricePerKgInput = ref(DEFAULT_INPUT.pricePerKg)
const spoolPrice = ref(DEFAULT_INPUT.spoolPrice)
const spoolGrams = ref(DEFAULT_INPUT.spoolGrams)
const hours = ref(DEFAULT_INPUT.hours)
const watts = ref(DEFAULT_INPUT.watts)
const pricePerKwh = ref(DEFAULT_INPUT.pricePerKwh)
const machinePrice = ref(DEFAULT_INPUT.machinePrice)
const lifespanHours = ref(DEFAULT_INPUT.lifespanHours)
const failurePct = ref(DEFAULT_INPUT.failurePct)
const postProcess = ref(DEFAULT_INPUT.postProcess)
const customMargin = ref(DEFAULT_INPUT.customMargin)
const copied = ref(false)
const seoContentVisible = ref(true)
let copyTimer = null

// 折合克价：按卷模式先做单位换算
const effectivePricePerKg = computed(() =>
  priceMode.value === 'spool'
    ? spoolPriceToPerKg(spoolPrice.value, spoolGrams.value)
    : num(pricePerKgInput.value)
)

const material = computed(() => materialCostOf(grams.value, effectivePricePerKg.value))
const energy = computed(() => energyCostOf(hours.value, watts.value, pricePerKwh.value))
const depreciation = computed(() => depreciationOf(hours.value, machinePrice.value, lifespanHours.value))
const baseSum = computed(() => material.value + energy.value + depreciation.value)
const expectedBase = computed(() => expectedCostOf(baseSum.value, failurePct.value))
const uplift = computed(() => round2(Math.max(0, expectedBase.value - baseSum.value)))
const totalCost = computed(() => totalCostOf({
  material: material.value, energy: energy.value, depreciation: depreciation.value,
  postProcess: postProcess.value, failurePct: failurePct.value
}))
const perGram = computed(() => perGramOf(totalCost.value, grams.value))
const factorText = computed(() => failureFactorText(failurePct.value))

const inputsValid = computed(() => num(grams.value) > 0 && num(hours.value) > 0)

const waterfall = computed(() => {
  const items = [
    { key: 'material', name: '耗材材料', amount: material.value, color: 'bg-primary' },
    { key: 'energy', name: '电费', amount: energy.value, color: 'bg-amber-500' },
    { key: 'depreciation', name: '机器折旧', amount: depreciation.value, color: 'bg-sky-500' },
    { key: 'uplift', name: `失败率加成（${factorText.value}）`, amount: uplift.value, color: 'bg-red-500' },
    { key: 'post', name: '后处理人工', amount: num(postProcess.value), color: 'bg-emerald-500' }
  ]
  const sum = items.reduce((s, i) => s + i.amount, 0)
  return items.map((i) => ({ ...i, pct: sum > 0 ? round2((i.amount / sum) * 100) : 0 }))
})

const quote2 = computed(() => quoteOf(totalCost.value, 100))
const quote3 = computed(() => quoteOf(totalCost.value, 200))
const quoteCustom = computed(() => quoteOf(totalCost.value, customMargin.value))

const tierCards = computed(() => [
  { label: `×2 = ${quote2.value.toFixed(2)} 元`, desc: '走量薄利（毛利 100%）', value: quote2.value },
  { label: `×3 = ${quote3.value.toFixed(2)} 元`, desc: '含打样翻台损耗（毛利 200%）', value: quote3.value }
])

const quoteText = computed(() => buildQuoteText({
  grams: num(grams.value), pricePerKg: effectivePricePerKg.value, material: material.value,
  hours: num(hours.value), watts: num(watts.value), pricePerKwh: num(pricePerKwh.value), energy: energy.value,
  machinePrice: num(machinePrice.value), lifespanHours: num(lifespanHours.value), depreciation: depreciation.value,
  failurePct: clampFailure(failurePct.value), factorText: factorText.value, uplift: uplift.value,
  postProcess: num(postProcess.value), total: totalCost.value, perGram: perGram.value,
  q2: quote2.value, q3: quote3.value, margin: num(customMargin.value), qc: quoteCustom.value
}))

// ---------- 交互 ----------
function onPresetChange(e) {
  const id = e.target.value
  presetSel.value = id
  const hit = FILAMENT_PRESETS.find((f) => f.id === id)
  if (hit) pricePerKgInput.value = hit.pricePerKg
}

function applyInputPreset(p) {
  const d = p.data
  grams.value = d.grams
  priceMode.value = 'perKg'
  presetSel.value = d.presetSel
  pricePerKgInput.value = d.pricePerKg
  hours.value = d.hours
  watts.value = d.watts
  pricePerKwh.value = d.pricePerKwh
  machinePrice.value = d.machinePrice
  lifespanHours.value = d.lifespanHours
  failurePct.value = d.failurePct
  postProcess.value = d.postProcess
}

function resetParams() {
  grams.value = DEFAULT_INPUT.grams
  priceMode.value = DEFAULT_INPUT.priceMode
  presetSel.value = DEFAULT_INPUT.presetSel
  pricePerKgInput.value = DEFAULT_INPUT.pricePerKg
  spoolPrice.value = DEFAULT_INPUT.spoolPrice
  spoolGrams.value = DEFAULT_INPUT.spoolGrams
  hours.value = DEFAULT_INPUT.hours
  watts.value = DEFAULT_INPUT.watts
  pricePerKwh.value = DEFAULT_INPUT.pricePerKwh
  machinePrice.value = DEFAULT_INPUT.machinePrice
  lifespanHours.value = DEFAULT_INPUT.lifespanHours
  failurePct.value = DEFAULT_INPUT.failurePct
  postProcess.value = DEFAULT_INPUT.postProcess
  customMargin.value = DEFAULT_INPUT.customMargin
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

async function copyQuoteText() {
  const text = quoteText.value
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  copied.value = true
  if (copyTimer !== null) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false; copyTimer = null }, 2000)
}

onMounted(() => {
  addRecentTool('print-cost-calculator')
})
</script>
