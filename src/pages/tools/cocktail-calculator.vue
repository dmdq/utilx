<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Martini class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">鸡尾酒配方计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">经典配方一键算酒精度，摇和/搅拌稀释估算、批量备料换算与单杯成本摊算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线鸡尾酒配方计算器：内置玛格丽特、尼格罗尼、莫吉托等十余款 IBA 常见口径经典配方，按体积加权实时算出每杯混合酒精度（ABV），
        支持不稀释 / 摇和 / 搅拌三档冰镇稀释、1-20 杯派对批量换算（含冰量与青柠数小计）、纯酒精克数与标准杯双口径换算，
        还可为每款原料填 700ml 进价摊算单杯成本——家庭调酒、酒吧备料、活动主理人采购前都能先用它把度数和账算清楚。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 页面说明条 -->
    <p class="text-xs leading-relaxed p-2.5 rounded-lg bg-muted/60 border border-border text-foreground flex items-start gap-1.5 mb-6">
      <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <span>酒精度为体积加权估算（混合体积按加法近似），未计冰块融化稀释；理性饮酒，未成年人请勿饮酒。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左面板：配方与参数 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Martini class="w-5 h-5 mr-2 text-primary" /> 配方与参数
        </h2>

        <!-- 模式切换 -->
        <div class="grid grid-cols-2 gap-1 p-1 bg-muted/50 rounded-lg">
          <button
            @click="mode = 'preset'"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition"
            :class="mode === 'preset' ? 'bg-card border border-border text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          >经典配方</button>
          <button
            @click="mode = 'custom'"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition"
            :class="mode === 'custom' ? 'bg-card border border-border text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          >自定义配方</button>
        </div>

        <!-- 经典配方：下拉选择 -->
        <div v-show="mode === 'preset'">
          <label class="text-sm font-medium text-foreground block mb-1.5">选择配方（比例流派众多，本表取 IBA 常见配方口径）</label>
          <select
            v-model="selectedId"
            @change="onRecipeChange"
            class="w-full px-3 py-2 rounded-lg border border-border border-border bg-background text-sm text-foreground"
          >
            <option v-for="c in COCKTAILS" :key="c.id" :value="c.id">{{ c.name }} · {{ c.zhName }}</option>
          </select>
          <p class="text-xs text-muted-foreground mt-1.5 leading-relaxed">{{ currentRecipe.note }}</p>
        </div>

        <!-- 自定义配方：逐行编辑 -->
        <div v-show="mode === 'custom'" class="space-y-2">
          <p class="text-sm font-medium text-foreground">逐行添加原料（名称 / 酒精度% / 毫升）</p>
          <div v-for="(row, idx) in customRows" :key="idx" class="grid grid-cols-[1fr_64px_64px_28px] gap-1.5 items-center">
            <input v-model="row.name" placeholder="如 白朗姆酒" class="min-w-0 px-2 py-1.5 rounded-md border border-border border-border bg-background text-sm text-foreground" />
            <input v-model.number="row.abv" type="number" min="0" max="96" step="0.5" placeholder="ABV" class="min-w-0 px-2 py-1.5 rounded-md border border-border border-border bg-background text-sm text-foreground" />
            <input v-model.number="row.ml" type="number" min="0" step="5" placeholder="ml" class="min-w-0 px-2 py-1.5 rounded-md border border-border border-border bg-background text-sm text-foreground" />
            <button @click="removeCustomRow(idx)" class="h-8 text-muted-foreground hover:text-red-500 text-lg leading-none" aria-label="删除该行">×</button>
          </div>
          <button
            @click="addCustomRow"
            class="w-full px-3 py-1.5 rounded-lg border border-dashed border-primary/40 text-sm text-primary hover:bg-primary/10 transition"
          >+ 添加原料</button>
          <p
            v-show="mode === 'custom'"
            class="text-xs leading-relaxed p-2 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
            :class="isEmpty ? 'bg-red-500/10' : ''"
          >
            <TriangleAlert v-if="isEmpty" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{{ isEmpty ? '至少填一行「名称 + 毫升数」才能开始计算。' : '配方有效，已实时参与右侧计算。' }}</span>
          </p>
        </div>

        <!-- 稀释方式三档 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">冰镇方式（稀释档位）</p>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="key in dilutionKeys"
              :key="key"
              @click="setDilution(key)"
              class="px-2 py-1.5 rounded-lg border text-xs font-medium transition"
              :class="dilutionKey === key ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'"
            >{{ DILUTION_LEVELS[key].label }}</button>
          </div>
        </div>

        <!-- 份数滑杆 -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-sm font-medium text-foreground">份数（批量换算）</p>
            <span class="text-sm font-bold text-primary">{{ servings }} 杯</span>
          </div>
          <input v-model.number="servings" type="range" min="1" max="20" step="1" class="w-full accent-primary" />
          <div class="flex justify-between text-[10px] text-muted-foreground"><span>1</span><span>20</span></div>
        </div>

        <!-- 快速预设 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-1.5">快速预设</p>
          <div class="space-y-1.5">
            <button
              v-for="p in presets"
              :key="p.id"
              @click="applyPreset(p.id)"
              class="w-full px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 border border-border text-left text-sm text-foreground transition"
            >
              <Play class="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-primary" /> {{ p.label }}
            </button>
          </div>
        </div>

        <button
          @click="resetAll"
          class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
        >
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置全部输入
        </button>
      </div>

      <!-- 右面板：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <GlassWater class="w-5 h-5 mr-2 text-primary" /> {{ resultTitle }}
          </h2>
          <span class="inline-block px-2.5 py-1 rounded-full border text-xs font-semibold" :class="STRENGTH_META[strength].class">
            {{ STRENGTH_META[strength].label }}
          </span>
        </div>
        <p class="text-xs leading-relaxed text-muted-foreground">{{ STRENGTH_META[strength].desc }}</p>

        <!-- ABV 特大：冰镇前后两值并列 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div class="bg-primary/10 rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">冰镇前 ABV（未稀释）</p>
            <p class="text-4xl font-bold text-primary tabular-nums">{{ abvBeforeText }}<span class="text-base font-semibold">%</span></p>
          </div>
          <div class="bg-primary/10 rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">冰镇后 ABV（{{ DILUTION_LEVELS[dilutionKey].label }}）</p>
            <p class="text-4xl font-bold text-primary tabular-nums">{{ abvAfterText }}<span class="text-base font-semibold">%</span></p>
          </div>
          <div class="bg-muted/50 rounded-lg p-4">
            <p class="text-xs text-muted-foreground mb-1">每杯纯酒精（酒精不随稀释减少）</p>
            <p class="text-4xl font-bold text-foreground tabular-nums">{{ grams }}<span class="text-base font-semibold"> g</span></p>
            <p class="text-[10px] text-muted-foreground mt-1">≈ 标准杯 {{ drinks.ui }} 单位（UI，10g/杯） · {{ drinks.us }} 杯（US，14g/杯）</p>
          </div>
        </div>

        <!-- 杯型与加冰 -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <span>杯型：{{ activeRecipe.glass }}</span>
          <span class="flex items-center gap-1">
            <GlassWater class="w-3.5 h-3.5 text-primary" />
            {{ activeRecipe.ice ? '需冰（摇和/搅拌每杯约 ' + ICE_GRAMS_PER_CUP + 'g，上桌另备）' : '滤冰上桌（Up，无冰）' }}
          </span>
          <span>单杯总量约 {{ totalMl }} ml{{ factor > 0 ? '，摇/拌后约 ' + dilutedTotalMlText + ' ml' : '' }}</span>
        </div>

        <!-- 配方堆叠占比条 + 原料明细 -->
        <div>
          <p class="text-sm font-medium text-foreground mb-2">配方占比（体积堆叠）</p>
          <div class="flex h-5 rounded-full overflow-hidden border border-border bg-muted/40 mb-3">
            <div
              v-for="seg in stackSegments"
              :key="seg.name"
              :style="{ width: seg.pct + '%', backgroundColor: seg.color }"
              :title="seg.name + ' ' + seg.ml + ' ml'"
            ></div>
          </div>
          <div class="space-y-1.5">
            <div v-for="ing in ingredientRows" :key="ing.name" class="flex items-center gap-2 text-sm">
              <i class="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" :style="{ backgroundColor: ing.color }"></i>
              <span class="w-32 truncate text-foreground" :title="ing.name">{{ ing.name }}</span>
              <span class="w-16 text-right font-mono text-xs text-muted-foreground">{{ ing.ml }} ml</span>
              <span class="w-20 text-right text-xs" :class="ing.abv > 0 ? 'text-foreground' : 'text-muted-foreground'">ABV {{ ing.abv }}%</span>
              <div class="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                <div class="h-full rounded-full" :style="{ width: ing.pct + '%', backgroundColor: ing.color }"></div>
              </div>
              <span class="w-14 text-right text-xs text-muted-foreground tabular-nums">{{ ing.pctText }}</span>
              <input
                v-model.number="prices[ing.name]"
                type="number" min="0" placeholder="元/700ml"
                class="w-20 px-2 py-1 rounded-md border border-border border-border bg-background text-xs text-foreground text-right"
              />
              <span class="w-16 text-right text-xs text-muted-foreground tabular-nums">{{ ing.costText }}</span>
            </div>
          </div>
        </div>

        <!-- 批量换算（份数 > 1 时） -->
        <div v-show="servings > 1 && !isEmpty" class="border-t border-border pt-4">
          <p class="text-sm font-semibold text-foreground mb-2 flex items-center">
            <GlassWater class="w-4 h-4 mr-1.5 text-primary" /> 批量备料 · {{ servings }} 杯
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div v-for="b in batchDisplay" :key="b.name" class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1 truncate" :title="b.name">{{ b.name }}</p>
              <p class="text-lg font-bold text-foreground tabular-nums">{{ b.value }}</p>
            </div>
          </div>
          <p class="text-[10px] text-muted-foreground mt-2">冰量按每杯 {{ ICE_GRAMS_PER_CUP }}g（摇和/搅拌用冰）估算；青柠按每颗出汁约 {{ CITRUS_ML_PER_PIECE }}ml 折算，苏打/汽水类请注意现开现倒。</p>
        </div>

        <!-- 成本行 -->
        <div class="border-t border-border pt-4 flex items-center justify-between flex-wrap gap-2">
          <p class="text-sm font-medium text-foreground flex items-center">
            <Wine class="w-4 h-4 mr-1.5 text-primary" /> 成本摊算（选填上方各原料「元/700ml」进价）
          </p>
          <p class="text-sm text-muted-foreground">
            单杯 <span class="text-lg font-bold text-foreground tabular-nums">{{ costPerDrink }}</span> 元
            <span v-if="servings > 1"> · {{ servings }} 杯合计 <span class="font-bold text-foreground tabular-nums">{{ costTotal }}</span> 元</span>
            <span v-else-if="!anyPriceFilled" class="text-xs">（尚未填价，按 0 计）</span>
          </p>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          说明：混合酒精度按 Σ(毫升×酒精度)÷Σ毫升 体积加权计算；摇和/搅拌档按内置经验稀释系数估算冰镇后酒精度（系数流派众多，仅供备料与控度参考）。
          纯酒精克数按乙醇密度 0.789 g/ml 换算；标准杯并列给出两种常见口径：国际单位 UI = 10g 纯酒精、美国标准杯 US = 14g 纯酒精。
        </p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>鸡尾酒配方计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是一款面向家庭调酒、酒吧备料与活动主理人的在线鸡尾酒计算工具。它把一杯鸡尾酒看作若干种液体的体积加权混合：
          把每款原料的毫升数与酒精度（ABV）代入 Σ(毫升×ABV)÷Σ毫升，就得到冰镇前的理论酒精度；再按摇和、搅拌等冰镇方式乘上稀释系数，
          估算入口时的实际酒精度。工具同时输出纯酒精克数、标准杯换算、派对批量备料清单（含冰量与青柠数）与单杯成本，全部计算在浏览器本地完成。
          内置配方取 IBA（国际调酒师协会）常见配比口径——比例流派众多，请按自家酒谱微调。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">鸡尾酒酒精度怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          公式很简单：每款原料的「毫升 × ABV%」相加，除以总毫升数。例如玛格丽特 = 龙舌兰 40% × 50ml + 橙皮酒 30% × 25ml + 青柠汁 0 × 25ml，
          合计 (2000 + 750 + 0) ÷ 100ml = 27.5%。注意这是纯数学加权，果汁、苏打水会显著拉低度数，所以「看起来清澈」不等于「度数低」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">为什么摇和会降度？（稀释）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          冰镇不是免费的：冰块在摇酒壶或搅拌杯中融化，会以纯水形式进入酒液，体积变大、酒精总量不变，度数自然被摊薄。
          经验上含果汁/蛋清的摇和酒稀释约 20-25%，纯烈酒长时间搅拌可达 30% 以上，直调加苏打类几乎不稀释。本工具内置三档经验系数，
          给出「冰镇前 / 冰镇后」两个 ABV 并列展示——同一杯酒，摇到位可以低 5 个度以上，这也是「好喝到没警觉」的主要原因。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">一杯等于多少纯酒精？（标准杯科普）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          纯酒精克数 = 总体积 ml × ABV ÷ 100 × 0.789（乙醇密度）。各国「标准杯」口径不一：本工具并列两种常见定义——
          国际单位 UI 一杯 = 10g 纯酒精（WHO 及多数欧洲国家采用），美国标准杯 US = 14g（约 1.5oz 烈酒）。
          以一杯 100ml、27.5% 的玛格丽特为例，约含 21.7g 纯酒精 ≈ 2.2 个国际单位、1.6 个美国标准杯，两杯下去就相当于一瓶啤酒的数倍酒精。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">基酒替换规则</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：想保持度数不变就按「毫升 × ABV 相等」等酒精替换——用 40% 伏特加换 60ml 的 45% 波本，应取 60 × 45 ÷ 40 = 67.5ml，风味则按配方适配度自行取舍。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">无酒精版怎么做？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          在自定义配方里把基酒换成 0.0 无酒精蒸馏酒（或直接把该行删掉/置 ABV 为 0），剩下的工作是风味补偿：无酒精基酒普遍缺少烈度与酒体，
          可适量减少酸性果汁、补一点糖浆或苦精找回层次；纯 0 配方在口感速判里会落在「轻盈」档，适合孕妇、开车与不胜酒力的场合。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">鸡尾酒酒精度怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">按体积加权：Σ(原料毫升×ABV)÷Σ毫升。玛格丽特 50ml 40% 龙舌兰 + 25ml 30% 橙皮酒 + 25ml 无醇青柠汁即 (2000+750)÷100 = 27.5%；选择摇和/搅拌档后工具再乘稀释系数给出冰镇后度数。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">摇和、搅拌真的会让酒变低度吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">会。冰块融化以纯水进入酒液，酒精总量不变但体积增大，摇和通常稀释 20-25%、长时间搅拌可达 30% 以上。工具并列显示冰镇前后两个 ABV，批量备料时请按未稀释口径备酒。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">一杯鸡尾酒等于多少纯酒精？</h3>
            <p class="text-sm text-muted-foreground mt-1">纯酒精克数 = 毫升 × ABV ÷ 100 × 0.789。本工具按两种标准杯口径并列换算：国际单位 UI（10g/杯）与美国标准杯 US（14g/杯），一杯 27.5% 的玛格丽特约 21.7g，即 2.2 UI / 1.6 US。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'cocktail-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Martini, Wine, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, GlassWater
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '鸡尾酒配方计算器 - 在线调酒酒精度/稀释/标准杯/成本计算工具',
  description: '免费在线鸡尾酒配方计算器，内置玛格丽特、尼格罗尼等 IBA 常见口径经典配方，体积加权算 ABV、摇和/搅拌稀释估算、纯酒精克数与 UI/US 标准杯换算、1-20 杯批量备料与单杯成本摊算，纯浏览器本地运行不上传',
  keywords: '鸡尾酒配方计算,调酒酒精度,经典鸡尾酒比例,玛格丽特配方,纯酒精单位',
  author: '有条工具',
  ogTitle: '鸡尾酒配方计算器 - 在线调酒酒精度/稀释/标准杯/成本计算工具 | 有条工具',
  ogDescription: '一键算出每杯鸡尾酒的酒精度、稀释后度数、纯酒精克数、标准杯与单杯成本，派对批量备料换算。',
  ogUrl: 'https://www.util.cn/tools/cocktail-calculator',
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
          name: '鸡尾酒配方计算器',
          url: 'https://www.util.cn/tools/cocktail-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['经典配方库体积加权算 ABV', '摇和/搅拌/不稀释三档稀释估算', '纯酒精克数与 UI/US 标准杯双换算', '1-20 杯派对批量备料换算', '原料进价摊算单杯成本', '自定义配方自由编辑', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '鸡尾酒配方计算器', item: 'https://www.util.cn/tools/cocktail-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '鸡尾酒酒精度怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '按体积加权：Σ(原料毫升×ABV)÷Σ毫升。玛格丽特 50ml 40% 龙舌兰 + 25ml 30% 橙皮酒 + 25ml 无醇青柠汁即 (2000+750)÷100 = 27.5%；选择摇和/搅拌档后工具再乘稀释系数给出冰镇后度数。' }
            },
            {
              '@type': 'Question',
              name: '摇和、搅拌真的会让酒变低度吗？',
              acceptedAnswer: { '@type': 'Answer', text: '会。冰块融化以纯水进入酒液，酒精总量不变但体积增大，摇和通常稀释 20-25%、长时间搅拌可达 30% 以上。工具并列显示冰镇前后两个 ABV，批量备料时请按未稀释口径备酒。' }
            },
            {
              '@type': 'Question',
              name: '一杯鸡尾酒等于多少纯酒精？',
              acceptedAnswer: { '@type': 'Answer', text: '纯酒精克数 = 毫升 × ABV ÷ 100 × 0.789。本工具按两种标准杯口径并列换算：国际单位 UI（10g/杯）与美国标准杯 US（14g/杯），一杯 27.5% 的玛格丽特约 21.7g，即 2.2 UI / 1.6 US。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const ABV_DENSITY = 0.789        // 乙醇密度 g/ml（20°C，体积→质量换算）
const ICE_GRAMS_PER_CUP = 120    // 摇和/搅拌类每杯约用冰 120g（摇酒壶/搅拌杯口径，不含上桌冰块）
const CITRUS_ML_PER_PIECE = 25   // 一颗青柠平均出汁约 25ml（批量换算用常识值）
const UI_DRINK_GRAMS = 10        // 国际饮酒单位 UI：1 单位 = 10g 纯酒精（WHO/多数欧洲口径）
const US_DRINK_GRAMS = 14        // 美国标准杯 US Standard Drink：1 杯 = 14g 纯酒精（口径并列展示）
const CITRUS_RE = /青柠汁|柠檬汁|橙汁/

const round1 = (x) => Math.round(x * 10) / 10
const round2 = (x) => Math.round(x * 100) / 100

// 冰镇稀释三档：摇和约 20-25%（取 22%）、搅拌 30% 上下（取 30%，长时搅拌可更高）、直调不稀释。
// 系数为经验内置值，流派众多仅供备料控度参考；稀释只增体积不减酒精，故 ABV ÷ (1+系数)。
const DILUTION_LEVELS = {
  none: { label: '直调·不稀释', factor: 0 },
  shake: { label: '摇和', factor: 0.22 },
  stir: { label: '搅拌', factor: 0.3 }
}

// 混合酒精度 = Σ(ml×abv)÷Σml，可选按冰镇档位乘稀释系数；空列表返回 0
function abvOf(ingredients, dilutionKey = 'none') {
  const total = ingredients.reduce((s, i) => s + Number(i.ml || 0), 0)
  if (!total) return 0
  const alcohol = ingredients.reduce((s, i) => s + Number(i.ml || 0) * Number(i.abv || 0), 0)
  const factor = (DILUTION_LEVELS[dilutionKey] || DILUTION_LEVELS.none).factor
  return alcohol / total / (1 + factor)
}

// 纯酒精克数 = ml × abv/100 × 0.789，保留 1 位小数
function pureAlcoholGramsOf(ml, abv) {
  return round1(ml * (abv / 100) * ABV_DENSITY)
}

// 标准杯双口径换算（各保留 1 位小数）
function standardDrinksOf(grams) {
  return { ui: round1(grams / UI_DRINK_GRAMS), us: round1(grams / US_DRINK_GRAMS) }
}

// 派对批量换算：每份 ml × 杯数，附推荐冰量（摇/拌每杯约 120g）与青柠数小计（每颗出汁约 25ml）
function batchOf(recipe, servings) {
  const n = Math.max(1, Math.round(Number(servings)) || 1)
  const items = recipe.ingredients.map((ing) => ({ name: ing.name, ml: Math.round(Number(ing.ml) * n) }))
  const totalMl = items.reduce((s, i) => s + i.ml, 0)
  const juiceMl = recipe.ingredients.reduce((s, i) => (CITRUS_RE.test(i.name) ? s + Number(i.ml) : s), 0)
  return {
    items,
    totalMl,
    iceGrams: recipe.ice ? ICE_GRAMS_PER_CUP * n : 0,
    citrusCount: juiceMl > 0 ? Math.ceil((juiceMl * n) / CITRUS_ML_PER_PIECE) : 0
  }
}

// 单杯成本：prices 为 { 原料名: 元/700ml }（选填），按 ml/700 比例摊算，未填按 0；保留 2 位小数
function pricePerDrinkOf(ingredients, prices) {
  let cost = 0
  ingredients.forEach((i) => {
    const p = Number(prices[i.name]) || 0
    cost += (Number(i.ml) * p) / 700
  })
  return round2(cost)
}

// 口感速判（按冰镇后 ABV）：<10% 轻盈 / 10-18% 中等 / 18-28% 浓烈 / ≥28% 重炮
function strengthOf(abv) {
  if (abv < 10) return 'light'
  if (abv < 18) return 'medium'
  if (abv < 28) return 'strong'
  return 'heavy'
}

// 配方库：比例流派众多，本表取 IBA 常见配方口径（abv 为该原料市售常见酒精度）
const COCKTAILS = [
  { id: 'margarita', name: 'Margarita', zhName: '玛格丽特', ice: true, dilution: 'shake', glass: '玛格丽特杯（盐边）', note: '龙舌兰 5:3:2 配青柠，摇和后沿盐圈上桌',
    ingredients: [{ name: '龙舌兰', abv: 40, ml: 50 }, { name: '橙皮酒', abv: 30, ml: 25 }, { name: '青柠汁', abv: 0, ml: 25 }] },
  { id: 'old-fashioned', name: 'Old Fashioned', zhName: '古典', ice: true, dilution: 'stir', glass: '古典杯（大方冰）', note: '方糖可折为 7ml 糖浆，苦精 1 dash 约 1ml',
    ingredients: [{ name: '波本威士忌', abv: 45, ml: 60 }, { name: '糖浆', abv: 0, ml: 7 }, { name: '安高天娜苦精', abv: 44.5, ml: 1 }] },
  { id: 'mojito', name: 'Mojito', zhName: '莫吉托', ice: true, dilution: 'none', glass: '高球杯（碎冰）', note: '薄荷轻捣出香即可，捣烂会发苦',
    ingredients: [{ name: '白朗姆', abv: 40, ml: 50 }, { name: '苏打水', abv: 0, ml: 60 }, { name: '青柠汁', abv: 0, ml: 25 }, { name: '薄荷叶', abv: 0, ml: 10 }, { name: '糖浆', abv: 0, ml: 15 }] },
  { id: 'negroni', name: 'Negroni', zhName: '尼格罗尼', ice: true, dilution: 'stir', glass: '古典杯（大冰球）', note: '1:1:1 等比经典，橙皮挤香',
    ingredients: [{ name: '金酒', abv: 40, ml: 30 }, { name: '金巴利', abv: 25, ml: 30 }, { name: '甜味美思', abv: 16, ml: 30 }] },
  { id: 'daiquiri', name: 'Daiquiri', zhName: '代基里', ice: false, dilution: 'shake', glass: '马天尼杯（滤冰上桌）', note: '朗姆酸酒标准模板，酸甜平衡看 6:2.5:1.5',
    ingredients: [{ name: '白朗姆', abv: 40, ml: 60 }, { name: '青柠汁', abv: 0, ml: 25 }, { name: '糖浆', abv: 0, ml: 15 }] },
  { id: 'whisky-sour', name: 'Whisky Sour', zhName: '威士忌酸', ice: true, dilution: 'shake', glass: '古典杯（方冰可选）', note: '蛋清可先干摇起泡，再加冰摇',
    ingredients: [{ name: '波本威士忌', abv: 45, ml: 60 }, { name: '柠檬汁', abv: 0, ml: 30 }, { name: '糖浆', abv: 0, ml: 20 }, { name: '蛋清', abv: 0, ml: 15 }] },
  { id: 'moscow-mule', name: 'Moscow Mule', zhName: '莫斯科骡子', ice: true, dilution: 'none', glass: '铜杯/高球杯', note: '姜啤开瓶即倒，轻搅一两下即可',
    ingredients: [{ name: '伏特加', abv: 40, ml: 50 }, { name: '姜汁啤酒', abv: 0, ml: 120 }, { name: '青柠汁', abv: 0, ml: 10 }] },
  { id: 'aperol-spritz', name: 'Aperol Spritz', zhName: '阿佩罗橙光', ice: true, dilution: 'none', glass: '大红酒杯', note: '3:2:1 起泡酒:阿佩罗:苏打，餐前低度开胃',
    ingredients: [{ name: '普罗塞克起泡酒', abv: 11, ml: 90 }, { name: '阿佩罗', abv: 11, ml: 60 }, { name: '苏打水', abv: 0, ml: 30 }] },
  { id: 'cosmopolitan', name: 'Cosmopolitan', zhName: '大都会', ice: false, dilution: 'shake', glass: '马天尼杯', note: '蔓越莓汁调色，双冰摇和更清爽',
    ingredients: [{ name: '伏特加', abv: 40, ml: 40 }, { name: '橙皮酒', abv: 30, ml: 15 }, { name: '青柠汁', abv: 0, ml: 15 }, { name: '蔓越莓汁', abv: 0, ml: 30 }] },
  { id: 'gin-tonic', name: 'Gin Tonic', zhName: '金汤力', ice: true, dilution: 'none', glass: '高球杯（满冰）', note: '1:3 金汤比，青柠角提香',
    ingredients: [{ name: '金酒', abv: 40, ml: 50 }, { name: '汤力水', abv: 0, ml: 150 }] },
  { id: 'dry-martini', name: 'Dry Martini', zhName: '干马天尼', ice: false, dilution: 'stir', glass: '马天尼杯（柠檬皮）', note: '搅拌越久越柔，1:10 干口经典',
    ingredients: [{ name: '金酒', abv: 40, ml: 60 }, { name: '干味美思', abv: 16, ml: 10 }] }
]

// ---------- 交互状态 ----------
const mode = ref('preset')
const selectedId = ref('margarita')
const dilutionKey = ref('shake')
const servings = ref(1)
const customRows = ref([])
const prices = ref({})
const seoContentVisible = ref(true)

const dilutionKeys = Object.keys(DILUTION_LEVELS)

// 原料配色（堆叠条与图例共用，按序号取色）
const PALETTE = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#14b8a6', '#a855f7']

// 口感速判四档徽章（展示层，判定逻辑在 strengthOf）
const STRENGTH_META = {
  light: { label: '轻盈 · ABV < 10%', class: 'bg-sky-500/10 text-sky-600 border-sky-500/20', desc: '清爽易饮，接近长饮啤酒的酒精负担，但仍按纯酒精克数量力而行。' },
  medium: { label: '中等 · 10-18%', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20', desc: '介于葡萄酒与利酒之间，一口一杯的节奏最容易不知不觉过量。' },
  strong: { label: '浓烈 · 18-28%', class: 'bg-orange-500/10 text-orange-600 border-orange-500/20', desc: '接近烈酒直饮区，多数「短饮」经典配方落在这里，小杯慢品为宜。' },
  heavy: { label: '重炮 · 28%+', class: 'bg-red-500/10 text-red-600 border-red-500/20', desc: '高于多数经典短饮的入口度数（干马天尼搅拌后仍近 28%），请严格控制杯数。' }
}

const presets = [
  { id: 'margarita', label: '玛格丽特 1 杯（摇和示范）' },
  { id: 'negroni', label: '尼格罗尼 1 杯（搅拌默认）' },
  { id: 'aperol-spritz', label: '阿佩罗橙光 1 杯（低度演示）' }
]

const currentRecipe = computed(() => COCKTAILS.find((c) => c.id === selectedId.value) || COCKTAILS[0])

// 当前参与计算的原料行（自定义模式过滤空行并做数值化）
const activeIngredients = computed(() => {
  if (mode.value === 'preset') return currentRecipe.value.ingredients
  return customRows.value
    .map((r) => ({ name: String(r.name || '').trim(), abv: Number(r.abv) || 0, ml: Number(r.ml) || 0 }))
    .filter((r) => r.name && r.ml > 0)
})

const isEmpty = computed(() => activeIngredients.value.length === 0)

// 自定义模式也构造一个伪配方对象，杯型/加冰走默认值
const activeRecipe = computed(() =>
  mode.value === 'preset'
    ? currentRecipe.value
    : { name: '自定义配方', zhName: '', ingredients: activeIngredients.value, ice: true, dilution: dilutionKey.value, glass: '自选杯型', note: '' }
)

const factor = computed(() => DILUTION_LEVELS[dilutionKey.value].factor)
const totalMl = computed(() => activeIngredients.value.reduce((s, i) => s + i.ml, 0))
const abvBefore = computed(() => abvOf(activeIngredients.value, 'none'))
const abvAfter = computed(() => abvOf(activeIngredients.value, dilutionKey.value))
const grams = computed(() => pureAlcoholGramsOf(totalMl.value, abvBefore.value))
const drinks = computed(() => standardDrinksOf(grams.value))
const strength = computed(() => strengthOf(abvAfter.value))

const resultTitle = computed(() =>
  mode.value === 'preset' ? `${currentRecipe.value.name} ${currentRecipe.value.zhName}` : '自定义配方'
)

const fmtAbv = (x) => (Number.isFinite(x) ? x.toFixed(1) : '0.0')
const abvBeforeText = computed(() => fmtAbv(abvBefore.value))
const abvAfterText = computed(() => fmtAbv(abvAfter.value))
const dilutedTotalMlText = computed(() => String(Math.round(totalMl.value * (1 + factor.value))))

const stackSegments = computed(() =>
  activeIngredients.value.map((i, idx) => ({
    name: i.name,
    ml: i.ml,
    pct: totalMl.value ? (i.ml / totalMl.value) * 100 : 0,
    color: PALETTE[idx % PALETTE.length]
  }))
)

// 原料明细行（含单杯成本拆算：ml×元每700ml ÷ 700）
const ingredientRows = computed(() =>
  activeIngredients.value.map((i, idx) => {
    const price = Number(prices.value[i.name]) || 0
    const pct = totalMl.value ? (i.ml / totalMl.value) * 100 : 0
    return {
      name: i.name,
      ml: i.ml,
      abv: i.abv,
      pct,
      pctText: pct.toFixed(1) + '%',
      color: PALETTE[idx % PALETTE.length],
      costText: price > 0 ? (round2((i.ml * price) / 700)).toFixed(2) + ' 元' : '—'
    }
  })
)

const batch = computed(() => batchOf(activeRecipe.value, servings.value))

const batchDisplay = computed(() => {
  const list = batch.value.items.map((i) => ({ name: i.name, value: i.ml + ' ml' }))
  if (batch.value.iceGrams) list.push({ name: '用冰小计', value: batch.value.iceGrams + ' g' })
  if (batch.value.citrusCount) list.push({ name: '青柠/柠檬约需', value: batch.value.citrusCount + ' 颗' })
  list.push({ name: '液体总量', value: batch.value.totalMl + ' ml' })
  return list
})

const costPerDrink = computed(() => (isEmpty.value ? '0.00' : pricePerDrinkOf(activeIngredients.value, prices.value).toFixed(2)))
const costTotal = computed(() => round2(Number(costPerDrink.value) * servings.value).toFixed(2))
const anyPriceFilled = computed(() => activeIngredients.value.some((i) => (Number(prices.value[i.name]) || 0) > 0))

function setDilution(key) {
  dilutionKey.value = key
}

// 直接读事件目标而非依赖 v-model 与 @change 的注册顺序，切换配方时同步该酒谱的默认冰镇档位
function onRecipeChange(e) {
  const picked = COCKTAILS.find((c) => c.id === e.target.value) || COCKTAILS[0]
  dilutionKey.value = picked.dilution
}

function applyPreset(id) {
  mode.value = 'preset'
  selectedId.value = id
  dilutionKey.value = (COCKTAILS.find((c) => c.id === id) || COCKTAILS[0]).dilution
  servings.value = 1
  prices.value = {}
}

function addCustomRow() {
  customRows.value = customRows.value.concat({ name: '', abv: 40, ml: 50 })
}

function removeCustomRow(idx) {
  const next = customRows.value.slice()
  next.splice(idx, 1)
  customRows.value = next
}

function resetAll() {
  mode.value = 'preset'
  selectedId.value = 'margarita'
  dilutionKey.value = 'shake'
  servings.value = 1
  customRows.value = []
  prices.value = {}
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('cocktail-calculator')
})
</script>
