<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Blinds class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">窗帘用料计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">窗宽 × 褶皱倍数 ÷ 门幅 = 用布米数，含对花损耗、纱帘双层与轨道长度估算</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线窗帘用料计算器：买窗帘布前，按「定高布 / 定宽布」两种门幅口径算清要买多少米。
        定高布（2.8m 门幅，高度方向固定）用料 = 窗宽 × 褶皱倍数 + 折边，垂长超 2.8m 自动提示拼接；
        定宽布（1.5m 幅宽）按每片幅数 ×（垂长 + 上下折边 + 对花损耗）计算。
        支持褶皱倍数 1.8 / 2.0 / 2.5 预设、对花重复高度、帘片数与纱帘（默认 2.5 倍）双栏结果，
        并给出轨道长度（窗宽 + 两侧各 15cm）与幔头、绑带用料建议。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Blinds class="w-5 h-5 mr-2 text-primary" /> 窗帘参数
        </h2>

        <!-- 窗宽 / 垂长 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="cf-width" class="block text-sm font-medium text-foreground mb-1.5">窗宽（m）</label>
            <input id="cf-width" v-model.number="width" type="number" min="0.1" step="0.1" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <p class="text-[11px] text-muted-foreground mt-1">轨道覆盖的宽度，不是单扇窗玻璃宽。</p>
          </div>
          <div>
            <label for="cf-drop" class="block text-sm font-medium text-foreground mb-1.5">成品垂长（m）</label>
            <input id="cf-drop" v-model.number="drop" type="number" min="0.5" step="0.1" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <p class="text-[11px] text-muted-foreground mt-1">轨下到理想离地处，常规 2.2 ~ 2.6m。</p>
          </div>
        </div>

        <!-- 褶皱倍数 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">褶皱倍数（帘身）</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="k in PLEAT_PRESETS"
              :key="'body-' + k"
              type="button"
              @click="pleat = k"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="pleat === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ k }} 倍</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ pleatTip }}</p>
        </div>

        <!-- 布匹模式 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">布匹模式（门幅）</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="m in FABRIC_MODES"
              :key="m.id"
              type="button"
              @click="fabricMode = m.id"
              class="px-3 py-2 rounded-lg text-xs font-medium border transition text-left"
              :class="fabricMode === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >
              {{ m.label }}
              <span class="block text-[10px] opacity-80 mt-0.5">{{ m.sub }}</span>
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ activeModeTip }}</p>
        </div>

        <!-- 对花 + 帘片数 -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="cf-repeat" class="block text-sm font-medium text-foreground mb-1.5">对花重复高度（cm）</label>
            <input id="cf-repeat" v-model.number="repeatCm" type="number" min="0" step="1" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <p class="text-[11px] text-muted-foreground mt-1">花型一个循环的高度，0 = 素色无对花。</p>
          </div>
          <div>
            <label for="cf-panels" class="block text-sm font-medium text-foreground mb-1.5">帘片数</label>
            <input id="cf-panels" v-model.number="panels" type="number" min="1" max="6" step="1" class="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <p class="text-[11px] text-muted-foreground mt-1">对开帘填 2（默认），单片帘填 1。</p>
          </div>
        </div>

        <!-- 纱帘倍数 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">纱帘褶皱倍数</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="k in SHEER_PRESETS"
              :key="'sheer-' + k"
              type="button"
              @click="sheerPleat = k"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="sheerPleat === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ k }} 倍</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">纱帘更轻薄，通行做法比帘身多 0.5 倍左右，默认 2.5。</p>
        </div>

        <button type="button" @click="resetAll" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认参数
        </button>

        <div v-if="validationIssues.length" class="space-y-1.5">
          <p v-for="issue in validationIssues" :key="issue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ issue }}</span>
          </p>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <!-- 用料结果 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Scissors class="w-5 h-5 mr-2 text-primary" /> 用布总米数
          </h2>
          <div v-if="result" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">帘身用布（{{ pleat }} 倍褶皱）</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ result.body.text }} <span class="text-sm font-normal text-muted-foreground">米</span></p>
                <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{{ result.body.formula }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">纱帘用布（{{ sheerPleat }} 倍褶皱）</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.sheer.text }} <span class="text-sm font-normal text-muted-foreground">米</span></p>
                <p class="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{{ result.sheer.formula }}</p>
              </div>
            </div>

            <p v-if="result.spliceWarning" class="text-xs leading-relaxed p-2.5 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
              <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ result.spliceWarning }}</span>
            </p>

            <div class="p-3 rounded-lg bg-muted/60 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span v-if="fabricMode === 'fixed-height'">
                定高口径：用料 = 窗宽 {{ width }}m × 褶皱 {{ pleat }} + 左右折边 0.2m<span v-if="repeatCm > 0"> + 每片对花损耗</span>；门幅 2.8m 即成品垂长方向，已含在门幅内不另计高度。
              </span>
              <span v-else>
                定宽口径：每片幅数 = ceil(片宽 {{ perPanelWidth }}m × 褶皱 {{ pleat }} ÷ 1.5m) = {{ result.body.strips }} 幅，每幅长 = 垂长 {{ drop }}m + 上下折边 0.2m<span v-if="repeatCm > 0"> + 对花损耗</span>。
              </span>
            </div>

            <div v-if="repeatCm > 0" class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
              对花损耗：每幅按整花型循环裁剪，单片约加 <span class="font-mono text-foreground">{{ result.body.lossPerUnit }}</span> m；花型循环越大、损耗越大，对花布通常比素色布多备 10% ~ 20%。
            </div>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入窗宽与成品垂长后自动计算</p>
        </div>

        <!-- 轨道与配件 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 轨道长度与配件建议
          </h2>
          <div v-if="result" class="space-y-3">
            <div class="bg-muted/50 rounded-xl p-4 flex items-baseline gap-3">
              <span class="text-sm text-muted-foreground">轨道长度 = 窗宽 {{ width }}m + 两侧各 0.15m</span>
              <span class="text-2xl font-bold text-primary font-mono">{{ result.railText }} m</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3 rounded-lg border border-border bg-muted/40">
                <p class="text-sm font-medium text-foreground">幔头（如需要）</p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">窗幔料通常按窗宽 × 2 倍另算（本页结果不含幔头），成品幔头高 40 ~ 50cm，另加缝份 0.2m；简约风格可不装。</p>
              </div>
              <div class="p-3 rounded-lg border border-border bg-muted/40">
                <p class="text-sm font-medium text-foreground">绑带（每片 1 对）</p>
                <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ panels }} 片帘约需 {{ panels }} 对绑带，每对用料约 0.4 ~ 0.6m（宽 10 ~ 15cm 对折），可用帘身余料裁取。</p>
              </div>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">以上为通行经验口径，实际以门店测量的成品尺寸与工艺为准；购买前建议按整米向上取整备料。</p>
          </div>
          <p v-else class="p-4 text-center text-sm text-muted-foreground">等待计算</p>
        </div>

        <!-- 内链跳转 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2">
          <p class="text-sm font-medium text-foreground">装完窗帘接着铺地板？</p>
          <p class="text-xs text-muted-foreground leading-relaxed">软装期常一起规划地面材料，可用地板用量计算器按铺贴方式与损耗率算包数。</p>
          <NuxtLink
            to="/tools/flooring-material-calculator/"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition"
          >
            <LayoutGrid class="w-4 h-4" /> 用地板用量计算器算包数 →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 折叠区：FAQ + 公式 + 来源 -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>窗帘用料怎么算？褶皱、对花与门幅口径</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式（通行行业口径）</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>定高布（门幅 2.8m）</strong>：用料(m) = 窗宽 × 褶皱倍数 + 左右折边 2 × 0.1 + 对花损耗；门幅方向即成品垂长方向，垂长 ≤ 2.8m 时高度不另计米数。</p>
            <p><strong>定宽布（幅宽 1.5m）</strong>：每片幅数 = ceil(片宽 × 褶皱倍数 ÷ 1.5)，总用料 = 帘片数 × 幅数 ×（垂长 + 上下折边 0.2 + 对花损耗）。</p>
            <p><strong>对花损耗</strong>：每幅按整花型循环向上取整裁剪，单片损耗 = 对花周期 −（裁剪长度 mod 周期），恰好整周期时为 0。</p>
            <p><strong>轨道长度</strong> = 窗宽 + 0.3（两侧各 15cm）。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">为什么窗帘要打褶皱？倍数怎么选？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            褶皱（打褶 / 挂钩的波浪感）来自布料横向宽度大于轨道：倍数越大波浪越饱满、遮光与隔音越好，但用料与价格线性上涨。
            通行选择：<strong>1.8 倍</strong>偏简约经济，适合素色与预算有限；<strong>2 倍</strong>是最通行的标准倍数，波浪自然、多数客厅卧室的首选；
            <strong>2.5 倍及以上</strong>更华美厚重，常见于欧式 / 丝绒或需要强遮光的卧室。纱帘一般比帘身多 0.5 倍左右，2.5 倍起步才够飘逸。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">对花损耗为什么大？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            有花型的布要保证相邻两幅布的图案在拼接缝处上下 / 左右连续，每幅布必须「从同一个花型相位起裁、到整周期收裁」，
            也就是裁剪长度要向上取整到花型循环的整数倍，多余部分就被裁掉了——循环越大浪费越多。
            例如 40cm 循环、每幅裁 2.5m：2.5 ÷ 0.4 = 6.25 个循环，要按 7 个循环即 2.8m 裁，每幅多 0.3m。
            素色布、暗纹布无对花要求，损耗接近 0，预算紧张时优先选素色。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">定高布和定宽布有什么区别？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            定高布门幅 2.8m 左右，门幅方向就是窗帘的高度方向，一层高以内的窗用一幅即可、无拼接缝，用料按宽度方向算，是最省事的常规选择；
            定宽布幅宽 1.4 ~ 1.5m，门幅方向是帘片的横向，高度靠整幅长度裁足，用料按「幅数 × 每幅长」算。
            同样效果下两者用料接近，但定宽布横向幅数多、每幅间有拼接缝；大花型用定宽布对花损耗明显更高。
            注意定高布成品垂长超过 2.8m（如落地到顶、挑高客厅）需要上下拼接，本页会给出警示。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">3 米宽的窗、2 倍褶皱要用多少布？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                定高布：3 × 2 + 0.2 折边 = 6.2 米（无对花）；若用 1.5m 定宽布、垂长 2.3m：每片幅数 = ceil(1.5 × 2 ÷ 1.5) = 2 幅，2 片帘共 2 × 2 × (2.3 + 0.2) = 10 米。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">纱帘要和帘身一样多吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                通常更多：纱帘褶皱倍数通行 2.5 倍起（帘身 2 倍），按同窗宽计算后纱帘米数会略高于帘身；纱帘若与帘身同花型也需对花，素色纱则无对花损耗。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">计算结果要加余量吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                公式已含折边与对花损耗；若窗口不是标准矩形、或需在现场修正垂直度，建议再按整米向上取整。购买时以门店按实物测量的复尺为准。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">数据会上传吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">不会。所有计算在你的浏览器内即时完成，无网络请求，参数不保存不上传。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            定高 / 定宽用料口径、褶皱倍数 1.8 / 2 / 2.5 与对花整周期裁剪为窗帘行业通行经验做法（参见国内软装门店与建材平台通行的用料计算文章），
            各品牌工艺（如韩折、罗马杆与轨道盒折边）存在差异，页面注明「以通行经验/标准原文为准」，实际用料请以成品复尺为准。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'curtain-fabric-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Blinds, Scissors, Ruler, Info, RefreshCw, TriangleAlert, ChevronDown, LayoutGrid } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '窗帘用料计算器 - 窗宽×褶皱倍数算用布米数 | 有条工具',
  description: '免费在线窗帘用料计算器：定高布/定宽布两种门幅口径，按窗宽×褶皱倍数即时算用布米数，含对花损耗、垂长超2.8m拼接警示、纱帘双栏结果、轨道长度与幔头绑带建议，纯浏览器本地计算不上传',
  keywords: '窗帘用料计算器,窗帘布计算方法,窗帘褶皱倍数,窗帘对花损耗,定高布定宽布,窗帘轨道长度',
  author: '有条工具',
  ogTitle: '窗帘用料计算器 - 窗宽×褶皱倍数算用布米数 | 有条工具',
  ogDescription: '定高/定宽双口径算窗帘用布米数，对花损耗、纱帘与轨道长度一站算清。',
  ogUrl: 'https://www.util.cn/tools/curtain-fabric-calculator',
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
          '@type': 'SoftwareApplication',
          name: '窗帘用料计算器',
          url: 'https://www.util.cn/tools/curtain-fabric-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '定高布（2.8m 门幅）与定宽布（1.5m 幅宽）双口径计算',
            '褶皱倍数 1.8 / 2.0 / 2.5 预设',
            '对花重复高度整周期损耗计算',
            '帘片数自定义与拼接警示（垂长超 2.8m）',
            '帘身与纱帘双栏用料结果',
            '轨道长度与幔头绑带用料建议',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '窗帘用料计算器', item: 'https://www.util.cn/tools/curtain-fabric-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '3 米宽的窗、2 倍褶皱要用多少布？',
              acceptedAnswer: { '@type': 'Answer', text: '定高布：3 × 2 + 0.2 折边 = 6.2 米（无对花）。若用 1.5m 定宽布、垂长 2.3m：每片幅数 = ceil(1.5 × 2 ÷ 1.5) = 2 幅，2 片帘共 2 × 2 × (2.3 + 0.2) = 10 米。' }
            },
            {
              '@type': 'Question',
              name: '窗帘褶皱倍数怎么选？',
              acceptedAnswer: { '@type': 'Answer', text: '1.8 倍偏简约经济；2 倍是通行标准，波浪自然；2.5 倍以上更华美、遮光更好。纱帘通常 2.5 倍起步。倍数越大用料线性增加。' }
            },
            {
              '@type': 'Question',
              name: '对花损耗为什么大？',
              acceptedAnswer: { '@type': 'Answer', text: '对花布每幅必须按花型循环的整数倍裁剪以保证图案连续，裁剪长度向上取整到整周期，多余部分被裁掉；循环越大损耗越大，素色布无此损耗。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 定高布（门幅2.8m，高度方向固定）：用料 = 窗宽×褶皱 + 左右折边0.2 + Σ每片对花损耗；
//   垂长 > 2.8m 时按拼接段数放大用料并加拼接缝余量（警示展示）。
// 定宽布（幅宽1.5m）：每片幅数 = ceil(片宽×褶皱/1.5)；每幅长 = 垂长+上下折边0.2+对花损耗。
// 对花损耗：每幅按整花型循环裁剪，loss = (len mod R === 0) ? 0 : R - (len mod R)。

// 单幅对花损耗（m）：恰好整周期为 0（含浮点 epsilon 保护）
function repeatLossOf(cutLen, repeatM) {
  if (!(repeatM > 0) || !(cutLen > 0)) return 0
  const rem = cutLen % repeatM
  if (rem < 1e-9 || repeatM - rem < 1e-9) return 0
  return repeatM - rem
}

function curtainFabricOf(widthM, dropM, pleat, mode, repeatCm, panelCount) {
  const W = Number(widthM)
  const L = Number(dropM)
  const K = Number(pleat)
  const N = Math.round(Number(panelCount))
  if (!Number.isFinite(W) || !Number.isFinite(L) || !Number.isFinite(K) || !Number.isFinite(N) || W <= 0 || L <= 0 || K <= 0 || N < 1) {
    return { meters: null }
  }
  const R = Number(repeatCm) > 0 ? Number(repeatCm) / 100 : 0
  if (mode === 'fixed-height') {
    const panelPleatW = (W * K) / N
    const lossPerPanel = repeatLossOf(panelPleatW, R)
    const heightPieces = Math.ceil(L / 2.8)
    let meters = W * K + 0.2 + N * lossPerPanel
    let spliceSeam = 0
    if (heightPieces > 1) {
      spliceSeam = N * 0.1 * (heightPieces - 1)
      meters = meters * heightPieces + spliceSeam
    }
    return {
      meters,
      units: N,
      lossPerUnit: lossPerPanel,
      heightPieces,
      splice: heightPieces > 1,
      formula: `${W}×${K} + 0.2 折边${lossPerPanel > 0 ? ` + 对花 ${+(N * lossPerPanel).toFixed(2)}` : ''}${heightPieces > 1 ? ` × ${heightPieces} 段拼接` : ''}`
    }
  }
  const panelW = W / N
  const stripsPerPanel = Math.ceil((panelW * K) / 1.5)
  const stripLen = L + 0.2
  const lossPerStrip = repeatLossOf(stripLen, R)
  const meters = N * stripsPerPanel * (stripLen + lossPerStrip)
  return {
    meters,
    units: N * stripsPerPanel,
    lossPerUnit: lossPerStrip,
    heightPieces: 1,
    splice: false,
    formula: `${N} 片 × ${stripsPerPanel} 幅 × (${L} + 0.2${lossPerStrip > 0 ? ` + 对花 ${+lossPerStrip.toFixed(2)}` : ''})`
  }
}

const fmtM = (v) => (Number.isFinite(v) ? +(v.toFixed(2)) : null)

// ---------- 静态数据 ----------
const PLEAT_PRESETS = [1.8, 2.0, 2.5]
const SHEER_PRESETS = [2.0, 2.5, 3.0]

const FABRIC_MODES = [
  { id: 'fixed-height', label: '定高布 · 门幅 2.8m', sub: '高度方向固定，最常规', tip: '门幅 2.8m 即成品垂长方向，用料按宽度方向算；成品垂长超过 2.8m 需上下拼接（会给出警示与拼接用料）。' },
  { id: 'fixed-width', label: '定宽布 · 幅宽 1.5m', sub: '按幅数×每幅长算，有拼接缝', tip: '幅宽 1.5m 是帘片横向，高度靠整幅裁足：每片幅数 = ceil(片宽×褶皱 ÷ 1.5)，相邻幅拼接并需对花。' }
]

const PLEAT_TIPS = {
  1.8: '1.8 倍偏简约经济，适合素色布与预算有限的空间，波浪感较浅。',
  2.0: '2 倍是通行标准倍数：波浪自然饱满，客厅卧室首选。',
  2.5: '2.5 倍更华美厚重，适合欧式 / 丝绒或强遮光卧室，用料随倍数线性增加。'
}

// ---------- 响应式参数 ----------
const width = ref(3)
const drop = ref(2.5)
const pleat = ref(2.0)
const fabricMode = ref('fixed-height')
const repeatCm = ref(0)
const panels = ref(2)
const sheerPleat = ref(2.5)

const pleatTip = computed(() => PLEAT_TIPS[pleat.value] || '倍数越大波浪越饱满，用料线性增加。')
const activeModeTip = computed(() => (FABRIC_MODES.find((m) => m.id === fabricMode.value) || FABRIC_MODES[0]).tip)
const perPanelWidth = computed(() => (panels.value >= 1 ? +(width.value / panels.value).toFixed(2) : width.value))

const validationIssues = computed(() => {
  const list = []
  if (!(Number(width.value) > 0)) list.push('窗宽需为大于 0 的数值（米）')
  if (!(Number(drop.value) > 0)) list.push('成品垂长需为大于 0 的数值（米）')
  if (!(Number(panels.value) >= 1)) list.push('帘片数至少为 1，已按 1 片计算')
  if (Number(repeatCm.value) < 0) list.push('对花重复高度不能为负，已按无对花计算')
  if (fabricMode.value === 'fixed-height' && Number(drop.value) > 2.8) {
    list.push(`成品垂长 ${drop.value}m 超过定高布门幅 2.8m，需上下拼接（结果已按 ${Math.ceil(Number(drop.value) / 2.8)} 段拼接估算）`)
  }
  if (fabricMode.value === 'fixed-width' && (width.value * pleat.value / Math.max(1, Number(panels.value) || 1)) > 50) {
    list.push('单幅需求过大，请检查窗宽与帘片数输入')
  }
  return list
})

// ---------- 计算结果 ----------
const result = computed(() => {
  const body = curtainFabricOf(width.value, drop.value, pleat.value, fabricMode.value, repeatCm.value, panels.value)
  if (body.meters === null) return null
  const sheer = curtainFabricOf(width.value, drop.value, sheerPleat.value, fabricMode.value, repeatCm.value, panels.value)
  const rail = Number.isFinite(Number(width.value)) && Number(width.value) > 0 ? +(width.value + 0.3).toFixed(2) : null
  const spliceWarning = body.splice
    ? `成品垂长 ${drop.value}m 超过定高布门幅 2.8m，需按 ${body.heightPieces} 段上下拼接（用料已含拼接放大与每片拼接缝 0.1m/段）；也可改用定宽布口径避免高度拼接。`
    : ''
  return {
    body: { text: fmtM(body.meters), formula: body.formula, strips: fabricMode.value === 'fixed-width' ? body.units / Math.max(1, Number(panels.value) || 1) : null, lossPerUnit: body.lossPerUnit > 0 ? +body.lossPerUnit.toFixed(3) : 0 },
    sheer: { text: sheer.meters === null ? '—' : fmtM(sheer.meters), formula: sheer.formula },
    railText: rail,
    spliceWarning
  }
})

// ---------- 交互动作 ----------
function resetAll() {
  width.value = 3
  drop.value = 2.5
  pleat.value = 2.0
  fabricMode.value = 'fixed-height'
  repeatCm.value = 0
  panels.value = 2
  sheerPleat.value = 2.5
}

onMounted(() => {
  addRecentTool('curtain-fabric-calculator')
})
</script>
