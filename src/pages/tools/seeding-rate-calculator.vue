<template>
  <div class="max-w-8xl mx-auto py-8">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Rows3 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">播种量与株距行距计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">亩播量按千粒重与发芽率折算，株行距与种植密度双向互算，一亩地播多少种一算便知</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线播种量计算器：按计划基本苗、千粒重、发芽率与田间出苗率折算亩播量（口径：每 kg 有效粒数 = 10⁶ ÷ 千粒重 × 发芽率 × 出苗率），
        支持株行距与种植密度双向互算——行距 × 株距算亩株数（666.7 m² ÷ 单株占地），或按目标亩株数反推株距；
        内置小麦、玉米、水稻、大豆常见参考值一键载入，均可修改。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面提示条 -->
    <div class="mb-6 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
      <TriangleAlert class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <p class="text-sm leading-relaxed text-foreground font-medium">
        发芽率以种子包装标签为准，田间出苗率与整地质量、墒情相关，建议取当地经验值；计算结果为理论播量，实际播种请结合品种分蘖成穗特性与农技建议微调。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 计算参数
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-3 gap-1 p-1 bg-muted/60 rounded-lg">
          <button
            v-for="tab in modeTabs"
            :key="tab.id"
            @click="mode = tab.id"
            class="px-2 py-2 rounded-md text-xs font-medium transition"
            :class="mode === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- 模式一：亩播量 -->
        <div v-if="mode === 'rate'" class="space-y-3">
          <div>
            <label for="src-seedlings" class="block text-sm font-medium text-foreground mb-1.5">计划基本苗（株/穗 · 每亩）</label>
            <input id="src-seedlings" v-model="rate.seedlings" type="text" inputmode="numeric" placeholder="如 150000（15 万）" :class="inputCls" />
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label for="src-tgw" class="block text-sm font-medium text-foreground mb-1.5">千粒重（g）</label>
              <input id="src-tgw" v-model="rate.tgw" type="text" inputmode="decimal" placeholder="如 45" :class="inputCls" />
            </div>
            <div>
              <label for="src-germ" class="block text-sm font-medium text-foreground mb-1.5">发芽率（%）</label>
              <input id="src-germ" v-model="rate.germ" type="text" inputmode="decimal" placeholder="如 90" :class="inputCls" />
            </div>
            <div>
              <label for="src-emerge" class="block text-sm font-medium text-foreground mb-1.5">田间出苗率（%）</label>
              <input id="src-emerge" v-model="rate.emerge" type="text" inputmode="decimal" placeholder="如 85" :class="inputCls" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            口径：每 kg 有效粒数 = 10⁶ ÷ 千粒重 × 发芽率 × 出苗率；亩播量 = 基本苗 ÷ 每 kg 有效粒数。
            千粒重查品种审定公告或种子标签，发芽率看种子袋标注，田间出苗率按整地墒情取 75%-90% 经验值。
          </p>
        </div>

        <!-- 模式二：株行距 → 密度 -->
        <div v-else-if="mode === 'density'" class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="src-row" class="block text-sm font-medium text-foreground mb-1.5">行距（m）</label>
              <input id="src-row" v-model="density.row" type="text" inputmode="decimal" placeholder="如 0.2" :class="inputCls" />
            </div>
            <div>
              <label for="src-space" class="block text-sm font-medium text-foreground mb-1.5">株距（m）</label>
              <input id="src-space" v-model="density.space" type="text" inputmode="decimal" placeholder="如 0.1" :class="inputCls" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            亩株数 = 666.7 ÷（行距 × 株距），1 亩按 666.7 m² 计；也支持填带单位换算的心算参照——行距株距各乘 100 即厘米数。
          </p>
        </div>

        <!-- 模式三：密度 → 株距 -->
        <div v-else class="space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="src-plants" class="block text-sm font-medium text-foreground mb-1.5">目标亩株数（株/穗）</label>
              <input id="src-plants" v-model="spacing.plants" type="text" inputmode="numeric" placeholder="如 3500" :class="inputCls" />
            </div>
            <div>
              <label for="src-row2" class="block text-sm font-medium text-foreground mb-1.5">行距（m）</label>
              <input id="src-row2" v-model="spacing.row" type="text" inputmode="decimal" placeholder="如 0.6" :class="inputCls" />
            </div>
          </div>
          <p class="text-xs text-muted-foreground">株距 = 666.7 ÷（目标亩株数 × 行距）。播种机行距固定时，用这个式子把密度落成株距档位。</p>
        </div>

        <!-- 作物预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">常见作物预设（参考值，可修改）</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="p in CROP_PRESETS"
              :key="p.id"
              @click="applyPreset(p.id)"
              class="px-3 py-2 bg-muted/60 hover:bg-muted border border-border rounded-lg text-xs font-medium text-foreground transition text-left"
            >
              <span class="flex items-center gap-1.5"><Play class="w-3 h-3 text-primary flex-shrink-0" /> {{ p.name }}</span>
              <span class="block text-muted-foreground mt-0.5">{{ p.note }}</span>
            </button>
          </div>
        </div>

        <button
          @click="resetInputs"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
        >
          <RefreshCw class="w-4 h-4" /> 恢复默认参数
        </button>
      </div>

      <!-- 右：结果面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Rows3 class="w-5 h-5 mr-2 text-primary" /> 计算结果
        </h2>

        <!-- 亩播量结果 -->
        <div v-if="mode === 'rate'" class="space-y-4">
          <p v-if="!rateResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ rateResult.error }}
          </p>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">亩播量</p>
                <p class="text-3xl font-bold text-primary">{{ rateResult.kgText }}</p>
                <p class="text-xs text-muted-foreground mt-1">kg/亩 · 约 {{ rateResult.jinText }} 斤</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">每亩需播粒数</p>
                <p class="text-xl font-bold text-foreground">{{ rateResult.seedsText }} 粒</p>
                <p class="text-xs text-muted-foreground mt-1">基本苗 ÷ 发芽率 ÷ 出苗率</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">每 kg 有效粒数</p>
                <p class="text-xl font-bold text-foreground">{{ rateResult.perKgText }} 粒</p>
                <p class="text-xs text-muted-foreground mt-1">含发芽与出苗折损</p>
              </div>
            </div>
            <p class="text-sm text-foreground">
              算式：{{ rateResult.seedlingsText }} 苗 × {{ rateResult.tgwText }} g ÷（{{ rateResult.germText }}% ×
              {{ rateResult.emergeText }}%）÷ 10⁶ = {{ rateResult.kgText }} kg/亩。
              发芽率与出苗率越低，同一保苗目标下的播量越大。
            </p>
          </template>
        </div>

        <!-- 株行距 → 密度结果 -->
        <div v-else-if="mode === 'density'" class="space-y-4">
          <p v-if="!densityResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ densityResult.error }}
          </p>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">亩株数（密度）</p>
                <p class="text-3xl font-bold text-primary">{{ densityResult.perMuText }}</p>
                <p class="text-xs text-muted-foreground mt-1">株/亩</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">每平方米株数</p>
                <p class="text-xl font-bold text-foreground">{{ densityResult.perSqmText }}</p>
                <p class="text-xs text-muted-foreground mt-1">株/㎡</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">单株占地</p>
                <p class="text-xl font-bold text-foreground">{{ densityResult.areaText }} ㎡</p>
                <p class="text-xs text-muted-foreground mt-1">{{ densityResult.rowCmText }} cm × {{ densityResult.spaceCmText }} cm</p>
              </div>
            </div>
            <p class="text-sm text-foreground">
              算式：666.7 ÷（{{ densityResult.rowText }} m × {{ densityResult.spaceText }} m）= {{ densityResult.perMuText }} 株/亩。
              行距或株距每调一档，密度都会跟着变，定植前先按此核一遍。
            </p>
          </template>
        </div>

        <!-- 密度 → 株距结果 -->
        <div v-else class="space-y-4">
          <p v-if="!spacingResult.ok" class="text-sm text-red-500 flex items-start gap-1.5">
            <TriangleAlert class="w-4 h-4 flex-shrink-0 mt-0.5" /> {{ spacingResult.error }}
          </p>
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">株距</p>
                <p class="text-3xl font-bold text-primary">{{ spacingResult.cmText }}</p>
                <p class="text-xs text-muted-foreground mt-1">cm（{{ spacingResult.mText }} m）</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">行距</p>
                <p class="text-xl font-bold text-foreground">{{ spacingResult.rowCmText }} cm</p>
                <p class="text-xs text-muted-foreground mt-1">{{ spacingResult.rowText }} m</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">核实密度</p>
                <p class="text-xl font-bold text-foreground">{{ spacingResult.checkText }}</p>
                <p class="text-xs text-muted-foreground mt-1">株/亩</p>
              </div>
            </div>
            <p class="text-sm text-foreground">
              算式：666.7 ÷（{{ spacingResult.plantsText }} × {{ spacingResult.rowText }}）= {{ spacingResult.mText }} m ≈
              {{ spacingResult.cmText }} cm 株距。播种机档位取接近值后，密度会有小幅出入，可回「株行距 → 密度」复核。
            </p>
          </template>
        </div>

        <!-- 复制结果 -->
        <div class="flex flex-wrap gap-2 items-center pt-2 border-t border-border">
          <button
            @click="copyResult"
            :disabled="!copyText"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            {{ copied ? '已复制结果' : '复制播种单' }}
          </button>
          <p class="text-xs text-muted-foreground">播种单含参数与算式，可发到种植群或记入田间台账。</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>播种量与株距行距计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          播种量与株距行距计算器是面向种粮户、家庭菜园与新型经营主体的在线播种换算工具。它解决两件事：
          一是「一亩地播多少种」——把计划基本苗按千粒重、发芽率与田间出苗率折算成亩播量；
          二是「种多密」——行距 × 株距与亩株数双向互算，把种植密度落成播种机或定植的株距档位。
          内置小麦、玉米、水稻、大豆常见参考值一键载入，全部参数可改。计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">亩播量怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          口径：每 kg 有效粒数 = 10⁶ ÷ 千粒重（g）× 发芽率 × 出苗率；亩播量（kg）= 计划基本苗 ÷ 每 kg 有效粒数。
          展开即：亩播量 = 基本苗 × 千粒重 ÷（发芽率 × 出苗率）÷ 10⁶。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed mb-2">
          例：小麦 15 万基本苗、千粒重 45 g、发芽率 90%、田间出苗率 85%——
          每 kg 有效粒数 = 10⁶ ÷ 45 × 0.90 × 0.85 = 17000 粒，亩播量 = 150000 ÷ 17000 ≈ 8.82 kg（约 17.6 斤）。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">千粒重、发芽率、田间出苗率从哪里来？</h3>
        <ul class="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4">
          <li><strong>千粒重</strong>：1000 粒种子的克数，查品种审定公告或种子标签；小麦常见 40-50 g，玉米 300-380 g，水稻 24-28 g，大豆 150-200 g。</li>
          <li><strong>发芽率</strong>：种子袋标注的实验室发芽率（如 ≥90%、≥85%），反映种子本身的活气。</li>
          <li><strong>田间出苗率</strong>：出苗数占发芽种子数的比例，与整地质量、墒情、播深相关，机播小麦常取 80%-90%，粗放条件下取 70%-80%。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">株行距和密度怎么互算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          1 亩 = 666.7 m²。正向：亩株数 = 666.7 ÷（行距 m × 株距 m），如行距 0.2 m、株距 0.1 m，
          单株占地 0.02 ㎡，亩株数 = 666.7 ÷ 0.02 = 33335 株。反向：株距（m）= 666.7 ÷（目标亩株数 × 行距 m），
          如目标 3500 株/亩、行距 0.6 m，株距 = 666.7 ÷ 2100 ≈ 0.3175 m ≈ 31.7 cm。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么播种量要比基本苗多出两成多？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              因为种子不是播一粒出一株：发芽率 90% 意味着一成种子不发芽，田间出苗率 85% 再折掉一成多。
              两项连乘 0.90 × 0.85 = 0.765，即每播 1000 粒只保住约 765 株，所以要按基本苗 ÷ 0.765 反推播量——
              折损越大，同一保苗目标下播量越大。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">小麦一亩地播多少斤合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              常见参考：适期机播的小麦，15 万基本苗、千粒重 45 g、发芽率 90%、出苗率 85% 时约 8.8 kg（17-18 斤）/亩；
              晚播、粗整地或分蘖弱的品种会加到 25-30 斤。请以当地农技部门的播量建议为准，本工具算出的是参数对应的理论值。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">播种机行距固定，怎么定株距？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              用「密度 → 株距」模式：株距 = 666.7 ÷（目标亩株数 × 行距）。例如玉米 3500 株/亩、行距 0.6 m，
              株距约 31.7 cm，取播种机接近档位后再回「株行距 → 密度」核实实际密度即可。
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">水稻、大豆的预设值怎么用？</h3>
            <p class="text-sm text-muted-foreground mt-1">
              预设只是常见量级的参考值：常规粳稻直播按 10 万基本苗、千粒重 26 g 估算约 3.8 kg/亩；
              大豆 1.5 万株、千粒重 150 g 约 3.3 kg/亩。杂交稻、机插秧与各地品种差异较大，点选预设后请把基本苗、
              千粒重改成你手上的实际数字再读结果。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-8">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          <p class="text-sm text-muted-foreground line-clamp-2 mt-1">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Rows3, Calculator, TriangleAlert, RefreshCw, Play, Copy, CheckCircle,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import { tools } from '~/data/tools'

// ---------- SEO ----------
useSeoMeta({
  title: '播种量与株距行距计算器 - 亩播量/种植密度计算工具 | 有条工具',
  description: '免费在线播种量计算器：按基本苗、千粒重、发芽率与田间出苗率折算亩播量，株行距与亩株数双向互算（666.7 ÷ 行距×株距），内置小麦玉米水稻大豆参考值一键载入，纯浏览器本地计算不上传数据。',
  keywords: '播种量计算,亩播量 千粒重,株距行距计算,种植密度计算,seeding rate calculator,小麦播种量',
  author: '有条工具',
  ogTitle: '播种量与株距行距计算器 - 亩播量/种植密度计算工具 | 有条工具',
  ogDescription: '亩播量按千粒重与发芽率折算，株行距与种植密度双向互算，作物参考值一键载入。',
  ogUrl: 'https://www.util.cn/tools/seeding-rate-calculator',
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
          name: '播种量与株距行距计算器',
          url: 'https://www.util.cn/tools/seeding-rate-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['按基本苗/千粒重/发芽率/出苗率折算亩播量', '每 kg 有效粒数口径说明', '株行距与亩株数双向互算', '小麦玉米水稻大豆参考值一键载入', '播种单一键复制']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '播种量与株距行距计算器', item: 'https://www.util.cn/tools/seeding-rate-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '为什么播种量要比基本苗多出两成多？',
              acceptedAnswer: { '@type': 'Answer', text: '种子不是播一粒出一株：发芽率 90% 与田间出苗率 85% 连乘为 0.765，每播 1000 粒只保住约 765 株，所以按基本苗 ÷ 0.765 反推播量，折损越大播量越大。' }
            },
            {
              '@type': 'Question',
              name: '小麦一亩地播多少斤合适？',
              acceptedAnswer: { '@type': 'Answer', text: '常见参考：15 万基本苗、千粒重 45 g、发芽率 90%、出苗率 85% 时约 8.8 kg（17-18 斤）/亩；晚播或粗整地会加到 25-30 斤。请以当地农技部门建议为准。' }
            },
            {
              '@type': 'Question',
              name: '播种机行距固定，怎么定株距？',
              acceptedAnswer: { '@type': 'Answer', text: '株距 = 666.7 ÷（目标亩株数 × 行距）。如玉米 3500 株/亩、行距 0.6 m，株距约 31.7 cm；取播种机接近档位后再按行距×株距核实实际密度。' }
            },
            {
              '@type': 'Question',
              name: '亩株数怎么由行距株距算出？',
              acceptedAnswer: { '@type': 'Answer', text: '1 亩 = 666.7 m²，亩株数 = 666.7 ÷（行距 m × 株距 m）。行距 0.2 m、株距 0.1 m 时单株占地 0.02 ㎡，亩株数 33335 株。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MU_SQM = 666.7 // 1 亩 = 666.7 m²

// 宽松数值解析：接受 "150000" / "150,000"
function toNum(raw) {
  const s = String(raw == null ? '' : raw).trim().replace(/,/g, '')
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

// 小数尾零裁剪：8.80 → 8.8；8.00 → 8
function trimNum(x, digits) {
  let s = x.toFixed(digits)
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

// 千分位整数：150000 → 150,000
function fmtThousand(x) {
  return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 校验比例输入：0 < v <= 100
function validPercent(raw) {
  const v = toNum(raw)
  return Number.isFinite(v) && v > 0 && v <= 100
}

// 亩播量核心：亩播量(kg) = 基本苗 × 千粒重 ÷（发芽率 × 出苗率）÷ 10⁶
// 口径：每 kg 有效粒数 = 10⁶ ÷ 千粒重 × 发芽率 × 出苗率（两者互为倒数，结果一致）
function sowingKg(seedlings, tgwG, germPct, emergePct) {
  const perKgEffective = (1e6 / tgwG) * (germPct / 100) * (emergePct / 100)
  return seedlings / perKgEffective
}

// 密度正向：亩株数 = 666.7 ÷（行距 × 株距）
function densityPerMu(rowM, spaceM) {
  return MU_SQM / (rowM * spaceM)
}

// 密度反向：株距 = 666.7 ÷（亩株数 × 行距）
function spacingFromDensity(plants, rowM) {
  return MU_SQM / (plants * rowM)
}

// ---------- 页面状态 ----------
const mode = ref('rate')
const modeTabs = [
  { id: 'rate', name: '亩播量' },
  { id: 'density', name: '株行距→密度' },
  { id: 'spacing', name: '密度→株距' }
]

const DEFAULTS = {
  rate: { seedlings: '150000', tgw: '45', germ: '90', emerge: '85' },
  density: { row: '0.2', space: '0.1' },
  spacing: { plants: '3500', row: '0.6' }
}

const rate = reactive({ ...DEFAULTS.rate })
const density = reactive({ ...DEFAULTS.density })
const spacing = reactive({ ...DEFAULTS.spacing })

// 统一输入样式（双主题 token，不写死灰白色值）
const inputCls = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'

// 作物预设（常见参考值，可修改）
const CROP_PRESETS = [
  { id: 'wheat', name: '小麦', seedlings: '150000', tgw: '45', germ: '90', emerge: '85', note: '15 万基本苗 · 千粒重 45g' },
  { id: 'maize', name: '玉米', seedlings: '3500', tgw: '350', germ: '90', emerge: '90', note: '3500 株 · 千粒重 350g' },
  { id: 'rice', name: '水稻', seedlings: '100000', tgw: '26', germ: '85', emerge: '80', note: '10 万基本苗 · 千粒重 26g' },
  { id: 'soybean', name: '大豆', seedlings: '15000', tgw: '150', germ: '85', emerge: '80', note: '1.5 万株 · 千粒重 150g' }
]

const seoContentVisible = ref(true)
const copied = ref(false)
let copyTimer = null

// ---------- 派生结果 ----------
const rateResult = computed(() => {
  const seedlings = toNum(rate.seedlings)
  const tgw = toNum(rate.tgw)
  const germ = toNum(rate.germ)
  const emerge = toNum(rate.emerge)
  if (!Number.isFinite(seedlings) || seedlings <= 0) return { ok: false, error: '计划基本苗需为大于 0 的数字（株/穗·每亩，如 150000）' }
  if (!Number.isFinite(tgw) || tgw <= 0) return { ok: false, error: '千粒重需为大于 0 的数字（g，小麦常见 40-50）' }
  if (!validPercent(germ)) return { ok: false, error: '发芽率需在 0-100 之间（种子袋标注值，如 90）' }
  if (!validPercent(emerge)) return { ok: false, error: '田间出苗率需在 0-100 之间（经验值，如 85）' }
  const kg = sowingKg(seedlings, tgw, germ, emerge)
  const perKg = (1e6 / tgw) * (germ / 100) * (emerge / 100)
  const seeds = seedlings / ((germ / 100) * (emerge / 100))
  return {
    ok: true,
    kgText: trimNum(kg, 2),
    jinText: trimNum(kg * 2, 1),
    seedsText: fmtThousand(seeds),
    perKgText: fmtThousand(perKg),
    seedlingsText: fmtThousand(seedlings),
    tgwText: trimNum(tgw, 2),
    germText: trimNum(germ, 2),
    emergeText: trimNum(emerge, 2)
  }
})

const densityResult = computed(() => {
  const row = toNum(density.row)
  const space = toNum(density.space)
  if (!Number.isFinite(row) || row <= 0) return { ok: false, error: '行距需为大于 0 的数字（m，如 0.2；20 cm 填 0.2）' }
  if (!Number.isFinite(space) || space <= 0) return { ok: false, error: '株距需为大于 0 的数字（m，如 0.1；10 cm 填 0.1）' }
  const perMu = densityPerMu(row, space)
  return {
    ok: true,
    perMuText: fmtThousand(perMu),
    perSqmText: trimNum(1 / (row * space), 1),
    areaText: trimNum(row * space, 4),
    rowText: trimNum(row, 4),
    spaceText: trimNum(space, 4),
    rowCmText: trimNum(row * 100, 1),
    spaceCmText: trimNum(space * 100, 1)
  }
})

const spacingResult = computed(() => {
  const plants = toNum(spacing.plants)
  const row = toNum(spacing.row)
  if (!Number.isFinite(plants) || plants <= 0) return { ok: false, error: '目标亩株数需为大于 0 的数字（株/穗，如 3500）' }
  if (!Number.isFinite(row) || row <= 0) return { ok: false, error: '行距需为大于 0 的数字（m，如 0.6；60 cm 填 0.6）' }
  const space = spacingFromDensity(plants, row)
  const check = densityPerMu(row, space)
  return {
    ok: true,
    mText: trimNum(space, 4),
    cmText: trimNum(space * 100, 1),
    rowText: trimNum(row, 4),
    rowCmText: trimNum(row * 100, 1),
    plantsText: fmtThousand(plants),
    checkText: fmtThousand(check)
  }
})

// ---------- 播种单文本 ----------
const copyText = computed(() => {
  if (mode.value === 'rate' && rateResult.value.ok) {
    const r = rateResult.value
    return [
      '【播种单 · 亩播量】',
      `参数：基本苗 ${r.seedlingsText} · 千粒重 ${r.tgwText} g · 发芽率 ${r.germText}% · 田间出苗率 ${r.emergeText}%`,
      `亩播量：${r.kgText} kg（约 ${r.jinText} 斤）`,
      `需播粒数：${r.seedsText} 粒/亩 · 每 kg 有效粒数 ${r.perKgText} 粒`,
      '提醒：出苗率随整地墒情变化，播前按当地经验值复核'
    ].join('\n')
  }
  if (mode.value === 'density' && densityResult.value.ok) {
    const r = densityResult.value
    return [
      '【播种单 · 株行距→密度】',
      `行距 ${r.rowText} m × 株距 ${r.spaceText} m`,
      `亩株数：${r.perMuText} 株（${r.perSqmText} 株/㎡）`,
      '提醒：定植前按实际地块复核行株距'
    ].join('\n')
  }
  if (mode.value === 'spacing' && spacingResult.value.ok) {
    const r = spacingResult.value
    return [
      '【播种单 · 密度→株距】',
      `目标 ${r.plantsText} 株/亩 · 行距 ${r.rowText} m`,
      `株距：${r.cmText} cm（${r.mText} m）`,
      '提醒：取播种机接近档位后回核实际密度'
    ].join('\n')
  }
  return ''
})

// ---------- 交互回调（仅浏览器环境，SSR 安全） ----------
function applyPreset(id) {
  addRecentTool('seeding-rate-calculator')
  const p = CROP_PRESETS.find(x => x.id === id)
  if (!p) return
  mode.value = 'rate'
  Object.assign(rate, { seedlings: p.seedlings, tgw: p.tgw, germ: p.germ, emerge: p.emerge })
}

function resetInputs() {
  addRecentTool('seeding-rate-calculator')
  mode.value = 'rate'
  Object.assign(rate, DEFAULTS.rate)
  Object.assign(density, DEFAULTS.density)
  Object.assign(spacing, DEFAULTS.spacing)
}

async function copyResult() {
  addRecentTool('seeding-rate-calculator')
  const text = copyText.value
  if (!text || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 2000)
  } catch {
    copied.value = false
  }
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 相关工具（引用注册表真实条目）
const relatedTools = computed(() => {
  const ids = ['pesticide-dilution-calculator', 'unit-converter', 'proportion-calculator', 'percentage-calculator']
  return ids.map(id => tools.find(t => t.id === id)).filter(Boolean)
})

onMounted(() => {
  addRecentTool('seeding-rate-calculator')
})

onBeforeUnmount(() => {
  if (copyTimer) {
    clearTimeout(copyTimer)
    copyTimer = null
  }
})
</script>
