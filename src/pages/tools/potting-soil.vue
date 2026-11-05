<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Sprout class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">花盆配土用量计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">口径×深度按圆台体积算单盆土量，多盆合计加损耗，自动折营养土袋数与配土比例各组分开数</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线花盆配土用量计算工具：输入盆口径与盆深（底径可留空按 0.7×口径自动估算），按圆台体积公式 V = πh/12 × (D² + D·d + d²) 算出单盆用土升数，
        多盆自动合计并按 10% 损耗上浮，再按营养土常见 6L / 10L / 20L / 30L / 70L 包装档向上取整折袋数；
        内置通用（泥炭:珍珠岩:蛭石 = 5:3:2）、多肉（颗粒 7:泥炭 3）、月季（泥炭:椰糠:珍珠岩 = 4:4:2）等常见配方，
        按总升数折出泥炭、珍珠岩、颗粒等各组分要买多少升。全部计算在浏览器本地完成，不上传任何数据，换盆、上盆、囤土前的备料参考。
      </p>
    </div>

    <!-- 口径说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>花盆是上大下小的圆台：V = πh/12 × (D² + D·d + d²)，D=盆口内径、d=盆底内径、h=盆深（单位 cm，结果为升）。
      口径量盆口内沿、深度量盆内净深；若盆底垫了陶粒/泡沫排水层，请按「盆深 − 排水层厚度」填净深。底径留空按 0.7×口径估算，直筒盆可直接量或填近似值。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 主计算区（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 输入卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> ① 盆型与数量
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="pot-mouth" class="block text-sm font-medium text-foreground mb-1.5">盆口径 D（cm）</label>
              <input
                id="pot-mouth"
                v-model.number="potMouth"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="盆口内沿直径，如 20"
              >
            </div>
            <div>
              <label for="pot-depth" class="block text-sm font-medium text-foreground mb-1.5">盆深 h（cm）</label>
              <input
                id="pot-depth"
                v-model.number="potDepth"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="盆内净深，如 18"
              >
            </div>
            <div>
              <label for="pot-bottom" class="block text-sm font-medium text-foreground mb-1.5">盆底径 d（cm）</label>
              <div class="flex gap-2">
                <input
                  id="pot-bottom"
                  v-model.number="potBottom"
                  type="number"
                  min="0"
                  step="0.5"
                  class="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="留空按 0.7×口径"
                >
                <button
                  @click="fillBottomAuto"
                  class="px-3 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition whitespace-nowrap"
                >填 0.7×口径</button>
              </div>
              <p class="text-xs text-muted-foreground mt-1">当前取 {{ fmt(effBottom, 1) }} cm{{ potBottom > 0 ? '（手填）' : '（自动估算）' }}</p>
            </div>
            <div>
              <label for="pot-count" class="block text-sm font-medium text-foreground mb-1.5">盆数</label>
              <input
                id="pot-count"
                v-model.number="potCount"
                type="number"
                min="1"
                step="1"
                class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="要装土的盆数，如 3"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-foreground">损耗系数（拌土撒漏、边缘压实折损）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="w in [0, 5, 10, 15, 20]"
                :key="w"
                @click="wastePct = w"
                :class="wastePct === w ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
                class="px-4 py-1.5 rounded-lg text-sm font-medium transition"
              >+{{ w }}%</button>
            </div>
            <p class="text-xs text-muted-foreground mt-1">默认 +10%：拌土撒漏、盆沿留空与压实都会折损，多盆小盆可适当调高。</p>
          </div>
        </div>

        <!-- 结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Package class="w-5 h-5 mr-2 text-primary" /> ② 用土量与购袋
          </h2>

          <div v-if="valid" class="space-y-4">
            <div class="bg-primary/10 rounded-lg p-5 text-center">
              <p class="text-xs text-muted-foreground mb-1">多盆合计（含 {{ wastePct }}% 损耗）</p>
              <p class="text-5xl font-bold text-primary">{{ fmt(totalL, 2) }}<span class="text-lg font-semibold ml-1">L</span></p>
              <p class="text-sm text-muted-foreground mt-2">按 {{ bagSize }} L/袋 向上取整需买 <b class="text-foreground">{{ selBags }} 袋</b>（实得 {{ fmt(selBags * bagSize, 1) }} L）</p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">单盆土量</p>
                <p class="text-sm font-bold text-foreground">{{ fmt(perPotL, 2) }} L</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">净合计（{{ potsCount }} 盆）</p>
                <p class="text-sm font-bold text-foreground">{{ fmt(netL, 2) }} L</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">损耗量</p>
                <p class="text-sm font-bold text-foreground">{{ fmt(totalL - netL, 2) }} L</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">袋数 @{{ bagSize }}L</p>
                <p class="text-sm font-bold text-primary">{{ selBags }} 袋</p>
              </div>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60 font-mono">{{ processText }}</p>

            <!-- 袋装档位表 -->
            <div class="space-y-1.5">
              <p class="text-sm font-medium text-foreground mb-1">营养土常见袋装档位（点击切换口径）</p>
              <button
                v-for="row in bagRows"
                :key="row.size"
                @click="bagSize = row.size"
                class="w-full flex justify-between items-center px-3 py-2 rounded-lg border text-sm transition"
                :class="bagSize === row.size ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70'"
              >
                <span>{{ row.size }} L / 袋</span>
                <span class="font-mono text-xs">需 {{ row.bags }} 袋 · 实得 {{ fmt(row.bags * row.size, 1) }} L</span>
              </button>
            </div>

            <div class="flex items-center gap-3">
              <button
                @click="copyShoppingList"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition"
              >
                <Copy class="w-4 h-4" /> 复制备料清单
              </button>
              <span class="text-xs text-muted-foreground">粘贴到备忘录 / 购物车备注，下单按单买。</span>
            </div>

            <p class="text-xs text-muted-foreground flex items-start gap-1.5 p-2.5 rounded bg-amber-500/10">
              <Info class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>营养土袋装按升计。湿土 1 L ≈ 0.5–0.7 kg，按重量发货的商品可用此口径粗核；一次买够同品牌，不同批次颜色与蓬松度会有差异。</span>
            </p>
          </div>

          <div v-else class="p-8 text-center text-muted-foreground">
            填写盆口径与盆深后自动算出用土量与袋数
          </div>
        </div>

        <!-- 配土比例卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Layers class="w-5 h-5 mr-2 text-primary" /> ③ 配土比例（按含损耗总升数折算）
          </h2>
          <div class="flex flex-wrap gap-2 mb-3">
            <button
              v-for="r in SOIL_RECIPES"
              :key="r.id"
              @click="recipeId = r.id"
              :class="recipeId === r.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition"
            >{{ r.name }}</button>
          </div>
          <p class="text-xs text-muted-foreground mb-4">{{ recipe.note }}（体积比，常见配方口径，非标准，可按植物长势微调）</p>

          <div v-if="valid" class="space-y-2">
            <div v-for="p in recipeParts" :key="p.name" class="grid grid-cols-[80px_1fr_140px] sm:grid-cols-[110px_1fr_170px] items-center gap-3 text-sm">
              <span class="text-foreground">{{ p.name }}</span>
              <span class="h-2 rounded-full bg-muted overflow-hidden">
                <i class="block h-full rounded-full bg-primary/70" :style="{ width: p.pct + '%' }"></i>
              </span>
              <span class="text-right text-xs text-muted-foreground font-mono">{{ p.part }} 份 · {{ p.pct }}% · {{ fmt(p.liters, 2) }} L</span>
            </div>
            <p class="text-xs text-muted-foreground mt-3 border-t border-border pt-2">
              各组分升数按含损耗总用量 {{ fmt(totalL, 2) }} L × 体积比折算；泥炭椰糠压实后体积会缩，预拌时按松散体积量即可。
            </p>
          </div>
          <div v-else class="p-6 text-center text-muted-foreground">
            先在上方填盆型尺寸，配方会按总升数折出各组分要买多少升
          </div>
        </div>
      </div>

      <!-- 侧栏 -->
      <div class="space-y-4">
        <!-- 常见盆型参考 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> 常见盆型速查
          </h2>
          <div class="space-y-2">
            <button
              v-for="p in POT_PRESETS"
              :key="p.name"
              @click="applyPreset(p)"
              class="w-full flex justify-between items-center px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-sm transition"
            >
              <span class="text-foreground">{{ p.name }}</span>
              <span class="font-mono text-xs text-muted-foreground">{{ fmt(presetL(p), 2) }} L/盆</span>
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-3">点击填入盆型参数；加仑盆口径偏直筒，可把底径手填为口径的 0.85–0.95 再算更准。</p>
        </div>

        <!-- 小贴士 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Lightbulb class="w-5 h-5 mr-2 text-primary" /> 备土小贴士
          </h2>
          <ul class="space-y-2 text-sm text-muted-foreground leading-relaxed">
            <li>· 口径量<b class="text-foreground">盆口内沿</b>而非外沿；深度量到盆内底面，别按盆外高算。</li>
            <li>· 垫底陶粒/泡沫排水层建议 1–2 cm（大盆 3–5 cm），填「盆深 − 排水层厚度」作净深。</li>
            <li>· 旧土复用先筛去残根并暴晒，掺 30–50% 新土与颗粒补疏松，别 100% 复用。</li>
            <li>· 小盆多盆按 +10–20% 损耗备土；大盆一次调够，分袋保存防潮。</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区（可折叠） -->
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>花盆配土用量计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          花盆配土用量计算器是一款面向家庭园艺的本地计算工具。核心公式是圆台体积：花盆上大下小，
          土量 V = πh/12 × (D² + D·d + d²)，D 是盆口径、d 是盆底径、h 是盆深（cm），结果除以 1000 得到升。
          工具在单盆土量基础上乘盆数得净合计，再按损耗系数（默认 +10%）上浮，并对照营养土常见 6L / 10L / 20L / 30L / 70L 袋装档位向上取整折袋数；
          同时内置通用、多肉、月季三套常见配土配方，按体积比把总升数拆成泥炭、珍珠岩、蛭石、颗粒等各组分要备多少升，支持一键复制备料清单。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">圆台体积公式怎么来的？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          把花盆看成上底 D、下底 d、高 h 的圆台（截头圆锥），体积 V = πh/12 × (D² + D·d + d²)。
          两个极端可以自检口径：直筒盆 d ≈ D，公式退化为圆柱 V = π(D/2)²h；平底盆 d 很小，体积就接近圆锥。
          例：口径 20 cm、盆深 18 cm、底径 14 cm → V = π × 18/12 × (20² + 20×14 + 14²) = π × 1.5 × 876 ≈ 4.13 L，
          一盆只装约 4 升土——多数人凭感觉买土都买多了。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">盆底径怎么估？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          最准的办法是用卷尺量盆底内沿直径。懒得量时按盆型口径估：常见收腰陶盆、软胶盆底径约为口径的 0.6–0.7 倍（工具默认 0.7×口径）；
          加仑盆、控根盆等直筒盆底径约为口径的 0.85–0.95 倍，手填进去更准。底径估偏对结果影响不大——
          因为公式里 d² 与 D·d 都比 D² 权重小，±0.1×口径 的底径误差通常只带来 5% 上下体积偏差，在 10% 损耗余量内。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">垫底的陶粒算不算土量？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          垫底排水层不占「土」的体积，但占花盆的容积，所以正确的做法不是把陶粒算成土，而是把它从盆深里扣掉：
          小盆垫 1–2 cm、大盆垫 3–5 cm 陶粒或轻石，填净深 = 盆深 − 排水层厚度即可。若不扣，
          按全深算出的土量会偏多 10–20%，买回的营养土用不完；反过来也不建议把排水层省掉——
          陶粒层的意义是防涝闷根，与土量是两笔账。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">旧土能不能复用？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          换盆下来的旧土问题有三：结构板结、养分耗尽、可能残留虫卵与病菌。处理流程是先筛（去掉残根、石块），
          再暴晒或摊晾消毒，然后按旧土 ≤30–50% 的比例掺入新泥炭与珍珠岩等颗粒补疏松，并补缓释肥——不建议 100% 复用，
          更不建议复用于同科植物（连作障碍）。本工具算出的总升数可以帮你规划「新土 + 掺混旧土」各占多少升。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">口径 20cm 的花盆要多少土？</h3>
            <p class="text-sm text-muted-foreground mt-1">以盆深 18cm、底径 14cm 为例，圆台公式算出约 4.13L；3 盆含 10% 损耗约 13.6L，按 10L/袋向上取整买 2 袋。口径一样深度不同结果差别很大，请按自家盆填净深。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">营养土 1L 等于多少斤？</h3>
            <p class="text-sm text-muted-foreground mt-1">袋装营养土按体积（升）计，散装或按重发货时可粗略换算：干营养土 1L ≈ 0.5–0.7kg，即 1L ≈ 1–1.4 斤；不同品牌湿度不同有浮动，以标注为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">损耗为什么默认 +10%？</h3>
            <p class="text-sm text-muted-foreground mt-1">拌土时撒漏、盆沿留空不填满、浇定根水后土壤下沉压实都会让实际用量高于理论体积，10% 是家庭园艺常用余量；小盆批量上盆可调到 +15–20%。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">配土比例是体积比还是重量比？</h3>
            <p class="text-sm text-muted-foreground mt-1">本工具的配方（通用 5:3:2、多肉颗粒 7:3、月季 4:4:2）按体积比折算各组分开数，拌土时用量杯/小桶量体积最方便；若配方按重量给出，需按各自堆密度自行折算。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'potting-soil'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Sprout, Ruler, Info, Package, Layers, Lightbulb,
  ChevronUp, ChevronDown, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

const TOOL_ID = 'potting-soil'
const STORAGE_KEY = 'potting-soil.inputs'

// ---------- SEO ----------
useSeoMeta({
  title: '花盆配土用量计算器 - 营养土升数/袋数与配土比例在线计算',
  description: '免费在线花盆配土用量计算器：口径×深度按圆台体积公式算单盆用土升数，多盆合计加 10% 损耗，按 6/10/20/30/70L 袋装向上取整折袋数，内置通用 5:3:2、多肉颗粒 7:3、月季 4:4:2 常见配方拆各组分升数，纯浏览器本地计算。',
  keywords: '花盆土量计算,营养土用量,配土比例,种花用土,圆台体积,花盆升数,potting soil calculator',
  author: '有条工具',
  ogTitle: '花盆配土用量计算器 - 营养土升数/袋数与配土比例在线计算 | 有条工具',
  ogDescription: '口径×深度算单盆土量，多盆合计加损耗，自动折营养土袋数与配土比例各组分开数。',
  ogUrl: 'https://www.util.cn/tools/potting-soil',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '花盆配土用量计算器',
  twitterDescription: '圆台体积算花盆用土升数，多盆合计、损耗上浮、袋数取整与配土比例拆分。'
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
          name: '花盆配土用量计算器',
          url: 'https://www.util.cn/tools/potting-soil',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '圆台体积公式 V=πh/12×(D²+Dd+d²) 算单盆土量',
            '底径留空按 0.7×口径自动估算',
            '多盆合计与 10% 损耗系数可调',
            '6/10/20/30/70L 营养土袋装向上取整',
            '通用/多肉/月季配土比例拆各组分开数',
            '备料清单复制到备忘录',
            '本地运行不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '花盆配土用量计算器', item: 'https://www.util.cn/tools/potting-soil/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '口径 20cm 的花盆要多少土？',
              acceptedAnswer: { '@type': 'Answer', text: '以盆深 18cm、底径 14cm 为例，圆台体积公式 V=πh/12×(D²+Dd+d²) 算出约 4.13L；3 盆含 10% 损耗约 13.6L，按 10L/袋向上取整买 2 袋。口径一样深度不同结果差别很大，请按自家盆填净深。' }
            },
            {
              '@type': 'Question',
              name: '营养土 1L 等于多少斤？',
              acceptedAnswer: { '@type': 'Answer', text: '袋装营养土按体积（升）计；干营养土 1L 约合 0.5-0.7kg，即 1L 约 1-1.4 斤，不同品牌湿度不同有浮动，以商品标注为准。' }
            },
            {
              '@type': 'Question',
              name: '垫底的陶粒算不算土量？',
              acceptedAnswer: { '@type': 'Answer', text: '陶粒排水层占花盆容积但不占土量：小盆垫 1-2cm、大盆垫 3-5cm，把「盆深减排水层厚度」作为净深来算即可，不扣会多买 10-20% 的土。' }
            },
            {
              '@type': 'Question',
              name: '旧土能不能复用？',
              acceptedAnswer: { '@type': 'Answer', text: '可以但有限度：先筛去残根、暴晒消毒，再按旧土不超过 30-50% 的比例掺入新泥炭与颗粒补疏松并补缓释肥；不建议 100% 复用或复用于同科植物。' }
            }
          ]
        }
      ]
    })
  }]
})

// __PURE_FNS_START__
// ---------- 纯逻辑（可独立单测） ----------
// 数值解析：非法/空记 0；正数校验
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : 0
}
function pos(v) {
  const n = num(v)
  return n > 0 ? n : 0
}

// 格式化：toFixed + 去尾零，避免浮点尾差出现在界面上
function fmt(v, dp = 2) {
  if (!Number.isFinite(v)) return '—'
  const s = Number(v).toFixed(dp)
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s
}
// 定点舍入（单测断言用）
function roundN(v, dp) {
  const f = Math.pow(10, dp)
  return Math.round(v * f) / f
}

// 圆台体积（cm³）：V = πh/12 × (D² + D·d + d²)；D 口径、d 底径、h 盆深
function frustumCm3(D, d, h) {
  const Dv = pos(D), dv = pos(d), hv = pos(h)
  if (!Dv || !dv || !hv) return 0
  return (Math.PI * hv / 12) * (Dv * Dv + Dv * dv + dv * dv)
}
// cm³ → L
function cm3ToL(cm3) { return num(cm3) / 1000 }

// 底径：留空按 0.7 × 口径估算（常见收腰盆口径）
function bottomDiameter(D, dInput) {
  const dv = pos(dInput)
  if (dv) return dv
  return roundN(pos(D) * 0.7, 1)
}

// 多盆净合计（L）：盆数向下取整且 ≥0
function totalNetL(litersPerPot, pots) {
  return pos(litersPerPot) * Math.max(0, Math.floor(num(pots)))
}

// 含损耗总量（L）：损耗 0–30%，默认 10%
function totalWithWasteL(netL, wastePct) {
  const w = num(wastePct)
  const pct = Number.isFinite(w) ? Math.min(30, Math.max(0, w)) : 10
  return pos(netL) * (1 + pct / 100)
}

// 袋数：按袋装升数向上取整
function bagsFor(totalL, bagSizeL) {
  const s = pos(bagSizeL)
  if (!s || !pos(totalL)) return 0
  return Math.ceil(pos(totalL) / s)
}
// 各袋装档位表
function bagTableOf(totalL, sizes) {
  return sizes.map((s) => {
    const bags = bagsFor(totalL, s)
    return { size: s, bags, actual: bags * s }
  })
}

// 常见配土配方（体积比，常见口径非标准）
const SOIL_RECIPES = [
  {
    id: 'general',
    name: '通用营养土',
    note: '常见配方：泥炭:珍珠岩:蛭石 = 5:3:2，适合大多数绿植花草',
    parts: [{ name: '泥炭', part: 5 }, { name: '珍珠岩', part: 3 }, { name: '蛭石', part: 2 }]
  },
  {
    id: 'succulent',
    name: '多肉颗粒土',
    note: '常见配方：颗粒 7 : 泥炭 3（颗粒可用麦饭石/火山岩/赤玉土等混合）',
    parts: [{ name: '颗粒', part: 7 }, { name: '泥炭', part: 3 }]
  },
  {
    id: 'rose',
    name: '月季土',
    note: '常见配方：泥炭:椰糠:珍珠岩 = 4:4:2',
    parts: [{ name: '泥炭', part: 4 }, { name: '椰糠', part: 4 }, { name: '珍珠岩', part: 2 }]
  }
]

// 配方拆分：按含损耗总升数折各组分升数
function recipeSplit(totalL, recipe) {
  const t = pos(totalL)
  if (!t || !recipe || !recipe.parts || !recipe.parts.length) return []
  const sum = recipe.parts.reduce((s, p) => s + num(p.part), 0)
  if (!sum) return []
  return recipe.parts.map((p) => ({
    name: p.name,
    part: num(p.part),
    pct: Math.round((num(p.part) / sum) * 100),
    liters: t * num(p.part) / sum
  }))
}

// 备料清单文案（可独立单测）
function buildShoppingList(info) {
  const lines = []
  lines.push('【花盆配土备料清单】花盆配土用量计算器')
  lines.push(`盆型：口径 ${fmt(info.D, 1)} cm × 深 ${fmt(info.h, 1)} cm（底径 ${fmt(info.d, 1)} cm）× ${info.pots} 盆`)
  lines.push(`单盆土量：${fmt(info.perPotL, 2)} L`)
  lines.push(`净合计：${fmt(info.netL, 2)} L；含损耗 +${fmt(info.wastePct, 0)}% → ${fmt(info.totalL, 2)} L`)
  lines.push(`购土：按 ${info.bagSize} L/袋 需 ${info.selBags} 袋（向上取整，实得 ${fmt(info.selBags * info.bagSize, 1)} L）`)
  if (info.recipeName) {
    lines.push(`配方：${info.recipeName}——`)
    info.parts.forEach((p) => lines.push(`  · ${p.name}：${fmt(p.liters, 2)} L（${p.part} 份，${p.pct}%）`))
  }
  lines.push('提示：垫底陶粒排水层另计，请按「盆深 − 排水层厚度」填净深再核一遍。')
  lines.push('说明：圆台近似体积，异形盆/自吸盆按实际容积校准；损耗默认 10% 可调。')
  return lines.join('\n')
}
// __PURE_FNS_END__

// ---------- 交互状态 ----------
const potMouth = ref(20)
const potDepth = ref(18)
const potBottom = ref('') // 留空 = 0.7 × 口径
const potCount = ref(1)
const wastePct = ref(10)
const bagSize = ref(10)
const recipeId = ref('general')
const seoContentVisible = ref(true)

const BAG_SIZES = [6, 10, 20, 30, 70]

const POT_PRESETS = [
  { name: '育苗小盆 口径10×深9', D: 10, h: 9 },
  { name: '小球盆 口径15×深12', D: 15, h: 12 },
  { name: '加仑盆 口径20×深18', D: 20, h: 18 },
  { name: '大号加仑 口径25×深22', D: 25, h: 22 },
  { name: '五加仑 口径28×深26', D: 28, h: 26 }
]

// ---------- 派生计算 ----------
const effBottom = computed(() => bottomDiameter(potMouth.value, potBottom.value))
const perPotCm3 = computed(() => frustumCm3(potMouth.value, effBottom.value, potDepth.value))
const perPotL = computed(() => cm3ToL(perPotCm3.value))
const potsCount = computed(() => Math.max(0, Math.floor(num(potCount.value))))
const netL = computed(() => totalNetL(perPotL.value, potsCount.value))
const totalL = computed(() => totalWithWasteL(netL.value, wastePct.value))
const valid = computed(() => pos(potMouth.value) > 0 && pos(potDepth.value) > 0 && potsCount.value > 0)

const selBags = computed(() => bagsFor(totalL.value, bagSize.value))
const bagRows = computed(() => bagTableOf(totalL.value, BAG_SIZES))

const recipe = computed(() => SOIL_RECIPES.find((r) => r.id === recipeId.value) || SOIL_RECIPES[0])
const recipeParts = computed(() => recipeSplit(totalL.value, recipe.value))

const processText = computed(() => {
  const D = num(potMouth.value), d = effBottom.value, h = num(potDepth.value)
  return `V = π × ${fmt(h, 1)}/12 × (${fmt(D, 1)}² + ${fmt(D, 1)}×${fmt(d, 1)} + ${fmt(d, 1)}²) = ${fmt(perPotCm3.value, 0)} cm³ ≈ ${fmt(perPotL.value, 2)} L/盆`
})

const shoppingListText = computed(() => buildShoppingList({
  D: potMouth.value,
  h: potDepth.value,
  d: effBottom.value,
  pots: potsCount.value,
  perPotL: perPotL.value,
  netL: netL.value,
  wastePct: wastePct.value,
  totalL: totalL.value,
  bagSize: bagSize.value,
  selBags: selBags.value,
  recipeName: recipe.value.name,
  parts: recipeParts.value
}))

// ---------- 事件（浏览器 API 只在回调，SSR 安全） ----------
function presetL(p) {
  return cm3ToL(frustumCm3(p.D, bottomDiameter(p.D, ''), p.h))
}
function applyPreset(p) {
  potMouth.value = p.D
  potDepth.value = p.h
  potBottom.value = ''
}
function fillBottomAuto() {
  potBottom.value = bottomDiameter(potMouth.value, '')
}
async function copyShoppingList() {
  try {
    await navigator.clipboard.writeText(shoppingListText.value)
    alert('备料清单已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动选中清单文本复制')
  }
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// 输入持久化（键前缀为工具 id；watch 仅由用户交互触发，SSR 安全）
watch([potMouth, potDepth, potBottom, potCount, wastePct, bagSize, recipeId], () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      D: potMouth.value,
      h: potDepth.value,
      d: potBottom.value,
      pots: potCount.value,
      waste: wastePct.value,
      bag: bagSize.value,
      recipe: recipeId.value
    }))
  } catch (e) { /* 忽略写入失败 */ }
})

// ---------- 挂载：注册最近使用 + 恢复上次输入 ----------
onMounted(() => {
  addRecentTool(TOOL_ID)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (typeof s.D === 'number') potMouth.value = s.D
      if (typeof s.h === 'number') potDepth.value = s.h
      if (typeof s.d === 'number') potBottom.value = s.d
      if (typeof s.d === 'string') potBottom.value = s.d
      if (typeof s.pots === 'number') potCount.value = s.pots
      if (typeof s.waste === 'number') wastePct.value = s.waste
      if (typeof s.bag === 'number') bagSize.value = s.bag
      if (typeof s.recipe === 'string') recipeId.value = s.recipe
    }
  } catch (e) { /* localStorage 不可用时忽略 */ }
})
</script>
