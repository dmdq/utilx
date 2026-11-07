<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Shirt class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">缝纫估料计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">门幅×款式查用量表，身高体重微调、缩水率预留与对格对花一次性算进购布米数</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线缝纫估料工具：按裁剪书通行口径内置 A 字裙 / 直筒裤 / 衬衫 / T恤 / 连衣裙 / 卫衣 / 睡衣套装在 90 / 110 / 140 / 150cm 四档门幅下的用布米数区间
        （视款式细节浮动 ±10%），支持身高体重超标按上限 +10% 微调、棉布 / 麻 / 化纤缩水率预留、条纹格子布按花回对花多留，
        最终按「基础用量 ×(1+缩水率) + 对花 + 0.1m 剪裁误差」向上取整到 0.1m 给出总购布米数，附四档门幅分档对照表。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>表值为中等身材（约 160–170cm / 50–70kg）通行口径，视款式细节（裙摆幅度、袖型、口袋、帽檐）浮动 ±10%；裁剪前先缩水、对花后再排版，宁可多买 0.2m 不要冒险差一截。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入区 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <!-- 款式与门幅 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Ruler class="w-5 h-5 mr-2 text-primary" /> ① 款式与门幅
          </h2>
          <label class="text-sm text-muted-foreground block mb-3">
            款式
            <select
              v-model="styleId"
              class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option v-for="s in STYLES" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="w in WIDTHS"
              :key="w"
              @click="widthCm = w"
              class="px-2 py-2 rounded-lg text-sm font-medium border transition"
              :class="widthCm === w ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >{{ w }}cm</button>
          </div>
          <p class="text-xs text-muted-foreground mt-2">
            90/110cm 为单幅（夏装衬衫布常见），140/150cm 为双幅（被面、外套、连衣裙常用）；幅宽越大排料越省。
          </p>
        </div>

        <hr class="border-border" />

        <!-- 身材微调 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <User class="w-5 h-5 mr-2 text-primary" /> ② 身材微调（可选）
          </h2>
          <div class="grid grid-cols-2 gap-2">
            <label class="text-sm text-muted-foreground">
              身高（cm）
              <input
                v-model.number="bodyH"
                type="number" min="0" step="1" placeholder="如 165"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label class="text-sm text-muted-foreground">
              体重（kg）
              <input
                v-model.number="bodyW"
                type="number" min="0" step="1" placeholder="如 60"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
          <p v-if="bodyLarge" class="mt-2 text-xs flex items-start gap-1.5 p-2 rounded bg-amber-500/10 text-foreground">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>身高 &gt;170cm 或体重 &gt;70kg：自动改按区间上限 ×1.1 备料（加长衣长裤长、放宽围度），结果已计入。</span>
          </p>
          <p v-else class="mt-2 text-xs text-muted-foreground">不填则按中等身材区间下限起算；胸围 / 臀围明显超码、做长裙长裤时手动按大码口径。</p>
        </div>

        <hr class="border-border" />

        <!-- 缩水与对花 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Droplets class="w-5 h-5 mr-2 text-primary" /> ③ 缩水预留与对格对花
          </h2>
          <label class="flex items-center gap-2 text-sm text-foreground mb-2">
            <input v-model="shrinkOn" type="checkbox" class="accent-[var(--primary,#6366f1)]" />
            裁剪前缩水预留（默认开，按 +{{ fmt1(shrinkPct) }}% 预留布长）
          </label>
          <div v-if="shrinkOn" class="grid grid-cols-3 gap-2 mb-2">
            <button
              v-for="m in SHRINK_PRESETS"
              :key="m.id"
              @click="shrinkId = m.id"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="shrinkId === m.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >{{ m.label }} {{ m.pct }}%</button>
          </div>
          <p class="text-xs text-muted-foreground mb-3">
            常见缩水率（自核通行口径）：棉布 3–5%、亚麻约 4%、化纤 1–2%；预缩处理过的面料可选化纤档或关掉本项。
          </p>
          <label class="flex items-center gap-2 text-sm text-foreground mb-2">
            <input v-model="patternOn" type="checkbox" class="accent-[var(--primary,#6366f1)]" />
            条纹 / 格子布对格对花（多留 1 个花回）
          </label>
          <div v-if="patternOn" class="pl-1">
            <label class="text-sm text-muted-foreground block">
              花回 / 格子高（cm）
              <input
                v-model.number="repeatCm"
                type="number" min="0" step="0.5" placeholder="如 5"
                class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <p class="text-xs text-muted-foreground mt-1">大格对格需在每段衣片接缝处对齐，布长按多买 1 个整花回估；细条纹可不加。</p>
          </div>
        </div>

        <hr class="border-border" />

        <div class="grid grid-cols-2 gap-2">
          <label class="text-sm text-muted-foreground">
            件数
            <input
              v-model.number="count"
              type="number" min="1" step="1"
              class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <div class="text-sm text-muted-foreground">估料口径
            <div class="mt-1 text-xs text-foreground leading-snug">基础 ×(1+缩水) + 对花 + 0.1m 误差，向上取整到 0.1m</div>
          </div>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 大结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="bg-primary/10 rounded-lg p-5 text-center mb-4">
            <p class="text-xs text-muted-foreground mb-1">建议购布（{{ styleLabel }} · {{ widthCm }}cm 门幅 × {{ count }} 件）</p>
            <p class="text-5xl font-bold text-primary tabular-nums">
              {{ result ? fmt1(result.totalM) : '—' }}<span class="text-lg font-semibold ml-1">m</span>
            </p>
            <p v-if="result" class="text-sm text-muted-foreground mt-2 tabular-nums">
              基础 {{ fmt2(result.baseM) }}m → 含缩水 {{ fmt2(result.afterShrinkM) }}m → 对花 +{{ fmt2(result.patternM) }}m → 剪裁误差 +0.1m → 取整 {{ fmt1(result.totalM) }}m
            </p>
            <p v-if="result" class="text-xs text-muted-foreground mt-1 tabular-nums">约 {{ fmt1(result.totalYards) }} 码（1 码 = 0.9144m）· 区间参考 {{ fmt1(result.lowM) }}–{{ fmt1(result.highM) }}m</p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-4">
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">基础用量</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ result ? fmt2(result.baseM) + ' m' : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">缩水预留</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ result ? '+' + fmt2(result.shrinkM) + ' m' : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">对花加放</p>
              <p class="text-sm font-bold text-foreground tabular-nums">{{ result ? '+' + fmt2(result.patternM) + ' m' : '—' }}</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-[10px] text-muted-foreground mb-1">身材调整</p>
              <p class="text-sm font-bold" :class="bodyLarge ? 'text-amber-600' : 'text-foreground'">{{ bodyLarge ? '上限×1.1' : '标准口径' }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="copyResult"
              :disabled="!result"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clipboard class="w-4 h-4" /> 复制估料单
            </button>
            <span class="text-xs text-muted-foreground">复制到购物备忘 / 布店下单对照。</span>
          </div>
        </div>

        <!-- 分档对照表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Table class="w-5 h-5 mr-2 text-primary" /> 款式用量表（当前口径换算后）
          </h2>
          <p class="text-xs text-muted-foreground mb-3">
            基础区间为通行估料口径（中等身材，±10% 浮动）；括号内为当前口径（{{ shrinkOn ? '缩水+' + fmt1(shrinkPct) + '%、' : '未缩水、' }}{{ bodyLarge ? '大码上限×1.1、' : '' }}含 0.1m 误差、取整 0.1m）的单件购布数。
          </p>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted/60 text-muted-foreground text-xs">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">款式</th>
                  <th v-for="w in WIDTHS" :key="w" class="px-3 py-2 text-right font-medium">{{ w }}cm 门幅</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in matrixRows" :key="row.styleId" class="border-t border-border tabular-nums" :class="row.styleId === styleId ? 'bg-primary/5' : ''">
                  <td class="px-3 py-2 font-medium text-foreground">
                    {{ row.label }}
                    <span v-if="row.styleId === styleId" class="ml-1 text-[10px] text-primary">当前</span>
                  </td>
                  <td v-for="cell in row.cells" :key="cell.w" class="px-3 py-2 text-right">
                    <span class="text-muted-foreground">{{ cell.low }}–{{ cell.high }}m</span>
                    <span class="block text-xs text-primary">{{ cell.total === null ? '—' : '买 ' + cell.total + 'm' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>T恤 / 卫衣 / 睡衣套装三行为同口径通行值（针织与家居布料裁剪教程常用区间），其余四类两源交叉自裁剪估料帖与算料公式复核；最终以你的纸样排版为准。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 内容区 -->
    <details open class="bg-card border border-border rounded-lg mb-8">
      <summary class="px-6 py-4 cursor-pointer select-none text-xl font-bold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>缝纫估料计算器：门幅、缩水与估料口径</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground" />
      </summary>
      <div class="px-6 pb-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h3 class="text-lg font-semibold text-foreground">门幅是什么？</h3>
        <p>
          门幅（幅宽）是布料经向两边的宽度，布匹展开后从布边到布边的距离，常见 90cm、110cm 的「单幅」和 140cm、150cm 的「双幅」。同一件衣服，门幅越宽，衣片可以并排排得越开，用布长度越短——所以估料必须「款式 × 门幅」成对查表，只说「做条裤子要几米布」是没意义的。90cm 幅的直筒裤要 2.3–2.5m，而 140cm 幅只要 1.2–1.4m，差出近一倍。买布时还要留意布边针孔约各占 1–2cm，有效幅宽略小于标称。
        </p>

        <h3 class="text-lg font-semibold text-foreground">为什么估料要留缩水？</h3>
        <p>
          棉、麻等天然纤维织物遇水后纤维溶胀、织缩回缩，第一次水洗普遍缩 3–5%（亚麻约 4%，化纤 1–2%）。如果按净尺寸裁剪，成衣洗一次就短一截，尤其做窗帘、床品与贴身衣物。老裁缝的做法是裁剪前先把整匹布「落水预缩」晾干再排版；不做预缩就要在估料时按缩水率多买布长。本工具按面料类型加放（默认棉布 +5% 保守档），已预缩 / 防缩处理的面料可切换或关闭。
        </p>

        <h3 class="text-lg font-semibold text-foreground">对格对花为什么费布？</h3>
        <p>
          条纹、格子的衣片要在侧缝、肩缝、口袋处对齐，排版时不能像素色布那样随意嵌套，前后片必须「错位一个整花回」摆放，通常按多买 1 个整花回长估算。花回越大越费布：5cm 小格多买 0.05m 无关痛痒，30cm 大格则要多买 0.3m；大面积对格款式甚至要按 +10–15% 估料。细条纹（1cm 内）视觉上不需要严格对格时可关闭本项。
        </p>

        <h3 class="text-lg font-semibold text-foreground">估料公式</h3>
        <p>
          总购布（m）= 向上取整到 0.1m〔 基础用量 × (1 + 缩水率) + 对花加放 + 0.1m 剪裁误差 〕。基础用量查「款式 × 门幅」表：中等身材取区间下限，身高超过 170cm 或体重超过 70kg 按区间上限 ×1.1（加长衣长裤长并放宽围度）。例：140cm 门幅直筒裤基础 1.2m，棉布缩水 5% → 1.26m，加 0.1m 误差 = 1.36m，向上取整到 0.1m → 买 1.4m。
        </p>

        <h3 class="text-lg font-semibold text-foreground">相关工具</h3>
        <p>
          窗帘的褶皱倍率、门幅拼接与损耗另有一套口径，见 <NuxtLink to="/tools/curtain-fabric-calculator" class="text-primary hover:underline">窗帘布料计算器</NuxtLink>；同样需要按米估算、考虑缩水与余量的手工备料场景还有 <NuxtLink to="/tools/knitting-yarn-calculator" class="text-primary hover:underline">毛线用量估算器</NuxtLink>。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <ul class="list-disc pl-5 space-y-2">
          <li><b class="text-foreground">1.5m 幅宽做一条成人裤子要多少布？</b>直筒裤 150cm 幅约 1.1–1.3m，含缩水与误差按 1.3–1.5m 备；阔腿裤、连腰头、大码再往上加。</li>
          <li><b class="text-foreground">针织布（做T恤）也按这个表吗？</b>针织筒径幅宽常按克重与筒径报价，排料口径与梭织不同；本表 T恤行按 90–150cm 平幅针织的通行区间给出，弹性面料缩水另按定型情况取 1–2%。</li>
          <li><b class="text-foreground">缩水率开关默认为什么是 +5%？</b>棉布常见缩水带 3–5%，估料按上限保守预留最稳；预缩棉布、化纤可下调或关闭，宁多勿少。</li>
          <li><b class="text-foreground">大码怎么加放？</b>身高超过 170cm 或体重超过 70kg 时工具自动改按区间上限 ×1.1；胸围 / 臀围显著超码、做大摆裙长外套时建议再手动加 0.2–0.5m。</li>
          <li><b class="text-foreground">数据会上传吗？</b>不会。全部计算在浏览器本地完成，刷新即清空。</li>
        </ul>

        <p class="text-xs pt-3 border-t border-border/50">
          来源与口径注记：估料表基础值两源交叉自裁剪估料教程（单幅/双幅分档米数表）与「用量 = 面积×(1+损耗)÷有效幅宽」算料公式复核；缩水率自纺织缩水科普（棉 3–5%、麻约 4%、化纤 1–2%，AATCC TM135 对机织物 ≤3% 的合格线）与面料商预缩工艺说明交叉。表值为通行经验口径，以现行面料实测与纸样排版权威数据为准。
        </p>
      </div>
    </details>

    <RelatedTools :currentToolId="'sewing-fabric-estimator'" :category="'others'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Shirt, Ruler, Info, CheckCircle, TriangleAlert, User, Droplets, Clipboard, Table, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '缝纫估料计算器 - 做衣服要多少布/门幅用布量在线估算',
  description: '免费在线缝纫估料：A字裙/直筒裤/衬衫/T恤/连衣裙/卫衣/睡衣套装 × 90/110/140/150cm 门幅用布米数区间，身高体重微调、棉麻化纤缩水率预留、对格对花花回加放，向上取整到 0.1m 给出总购布米数，纯浏览器本地运行。',
  keywords: '缝纫估料,做衣服要多少布,布料用量计算,门幅计算,裁剪估料,用布量,缩水率预留',
  author: '有条工具',
  ogTitle: '缝纫估料计算器 - 做衣服要多少布/门幅用布量 | 有条工具',
  ogDescription: '款式×门幅查用量，缩水率与对花加放一次算进，购布米数取整到 0.1m。',
  ogUrl: 'https://www.util.cn/tools/sewing-fabric-estimator',
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
          name: '缝纫估料计算器',
          url: 'https://www.util.cn/tools/sewing-fabric-estimator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['7 款式 × 4 门幅用量区间表', '身高体重超标按上限×1.1 微调', '棉/麻/化纤缩水率预留开关', '条纹格子对花花回加放', '总购布米数取整到 0.1m', '四档门幅分档对照表', '估料单一键复制', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '其他工具', item: 'https://www.util.cn/others' },
            { '@type': 'ListItem', position: 3, name: '缝纫估料计算器', item: 'https://www.util.cn/tools/sewing-fabric-estimator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '1.5m 幅宽做一条成人裤子要多少布？',
              acceptedAnswer: { '@type': 'Answer', text: '直筒裤 150cm 幅约 1.1–1.3m，含缩水 5% 与 0.1m 剪裁误差后按 1.3–1.5m 备料；阔腿裤、连腰头或大码再往上加。' }
            },
            {
              '@type': 'Question',
              name: '为什么估料要留缩水？',
              acceptedAnswer: { '@type': 'Answer', text: '棉麻织物第一次水洗普遍缩 3–5%（亚麻约 4%、化纤 1–2%），不预缩就按净尺寸裁剪会导致成衣洗后变短。可裁前落水预缩，或按缩水率多买布长。' }
            },
            {
              '@type': 'Question',
              name: '对格对花要多少加放？',
              acceptedAnswer: { '@type': 'Answer', text: '条纹格子布排版需错位一个整花回对齐接缝，通常按多买 1 个花回长估算；花回越大越费布，大格对格款式可按 +10–15% 估料。' }
            },
            {
              '@type': 'Question',
              name: '门幅越大越省布吗？',
              acceptedAnswer: { '@type': 'Answer', text: '是的。门幅越宽衣片可并排排料，用布长度越短：90cm 幅直筒裤要 2.3–2.5m，140cm 幅只要 1.2–1.4m。买布前先确认幅宽再估料。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 数值解析：空/非法/负数记 0
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
function fmt1(v) { return Number.isFinite(v) ? v.toFixed(1) : '—' }
function fmt2(v) { return Number.isFinite(v) ? v.toFixed(2) : '—' }

// 门幅档位与款式用量表（m，中等身材区间 [下限, 上限]）
// A字裙/直筒裤/衬衫/连衣裙四行两源交叉自裁剪估料教程与算料公式；T恤/卫衣/睡衣套装为同口径通行值
const WIDTHS = [90, 110, 140, 150]
const STYLES = [
  { id: 'askirt', label: 'A 字裙', range: { 90: [1.8, 2.0], 110: [1.4, 1.6], 140: [1.0, 1.2], 150: [1.0, 1.1] } },
  { id: 'pants', label: '直筒裤', range: { 90: [2.3, 2.5], 110: [1.8, 2.0], 140: [1.2, 1.4], 150: [1.1, 1.3] } },
  { id: 'shirt', label: '衬衫（长袖）', range: { 90: [2.0, 2.2], 110: [1.6, 1.8], 140: [1.1, 1.3], 150: [1.0, 1.2] } },
  { id: 'tshirt', label: 'T 恤（针织）', range: { 90: [1.6, 1.8], 110: [1.2, 1.4], 140: [0.9, 1.1], 150: [0.8, 1.0] } },
  { id: 'dress', label: '连衣裙', range: { 90: [2.8, 3.2], 110: [2.2, 2.5], 140: [1.5, 2.0], 150: [1.4, 1.8] } },
  { id: 'hoodie', label: '卫衣', range: { 90: [2.8, 3.2], 110: [2.2, 2.6], 140: [1.6, 2.0], 150: [1.5, 1.9] } },
  { id: 'pajamas', label: '睡衣套装', range: { 90: [3.6, 4.2], 110: [3.0, 3.5], 140: [2.4, 2.8], 150: [2.2, 2.6] } }
]

// 缩水率预置（%）：通行口径 棉 3–5 / 麻约 4 / 化纤 1–2，估料按上限保守预留
const SHRINK_PRESETS = [
  { id: 'cotton', label: '棉布', range: [3, 5], pct: 5 },
  { id: 'linen', label: '亚麻', range: [3, 4], pct: 4 },
  { id: 'synthetic', label: '化纤', range: [1, 2], pct: 2 }
]

// 身材是否按大码口径：身高 >170cm 或体重 >70kg
function isBodyLarge(h, w) {
  return (num(h) > 170) || (num(w) > 70)
}

// 基础用量（m）：标准身材取区间下限；大码口径取上限 ×1.1
function baseMeters(range, large) {
  if (!range) return null
  return large ? round2(range[1] * 1.1) : range[0]
}

// 总购布（m，0.1 步进向上取整）：基础 ×(1+缩水) + 对花 + 0.1 剪裁误差
function totalMeters(baseM, shrinkPct, patternCm) {
  if (!baseM || baseM <= 0) return null
  const afterShrink = baseM * (1 + num(shrinkPct) / 100)
  const patternM = num(patternCm) / 100
  const raw = afterShrink + patternM + 0.1
  return ceilTo01(raw)
}

// 向上取整到 0.1m（浮点容差处理：1.36 → 1.4）
function ceilTo01(v) {
  if (!Number.isFinite(v)) return null
  return Math.ceil(v * 10 - 1e-6) / 10
}
function round2(v) { return Math.round(v * 100) / 100 }

// ---------- 页面状态 ----------
const styleId = ref('pants')
const widthCm = ref(140)
const bodyH = ref('')
const bodyW = ref('')
const shrinkOn = ref(true)
const shrinkId = ref('cotton')
const patternOn = ref(false)
const repeatCm = ref(5)
const count = ref(1)

// ---------- 派生计算 ----------
const style = computed(() => STYLES.find((s) => s.id === styleId.value) || STYLES[0])
const styleLabel = computed(() => style.value.label)
const shrinkPct = computed(() => {
  const p = SHRINK_PRESETS.find((m) => m.id === shrinkId.value)
  return p ? p.pct : 0
})
const bodyLarge = computed(() => isBodyLarge(bodyH.value, bodyW.value))

const baseRange = computed(() => {
  const r = style.value.range[widthCm.value]
  return Array.isArray(r) ? r : null
})

const result = computed(() => {
  const range = baseRange.value
  if (!range) return null
  const baseM = baseMeters(range, bodyLarge.value)
  const shrinkP = shrinkOn.value ? shrinkPct.value : 0
  const afterShrinkM = round2(baseM * (1 + shrinkP / 100))
  const patternM = patternOn.value ? num(repeatCm.value) / 100 : 0
  const rawSingle = afterShrinkM + patternM + 0.1
  const singleM = ceilTo01(rawSingle)
  const totalM = ceilTo01(singleM * num(count.value))
  return {
    baseM,
    shrinkP,
    shrinkM: round2(afterShrinkM - baseM),
    afterShrinkM,
    patternM,
    lowM: ceilTo01(ceilTo01(range[0] * (1 + shrinkP / 100) + 0.1)),
    highM: ceilTo01(ceilTo01(round2(range[1] * (bodyLarge.value ? 1.1 : 1)) * (1 + shrinkP / 100) + patternM + 0.1)),
    singleM,
    totalM,
    totalYards: totalM / 0.9144
  }
})

// 分档对照表（当前口径下每款每幅的单件购布数）
const matrixRows = computed(() =>
  STYLES.map((s) => ({
    styleId: s.id,
    label: s.label,
    cells: WIDTHS.map((w) => {
      const r = s.range[w]
      if (!r) return { w, low: r ? r[0] : '—', high: '—', total: null }
      const base = baseMeters(r, bodyLarge.value)
      const shrinkP = shrinkOn.value ? shrinkPct.value : 0
      return {
        w,
        low: fmt1(r[0]),
        high: fmt1(r[1]),
        total: totalMeters(base, shrinkP, patternOn.value ? repeatCm.value : 0)
      }
    })
  }))
)

// 估料单文案
const estimateText = computed(() => {
  if (!result.value) return ''
  const lines = []
  lines.push('【缝纫购布估料单】缝纫估料计算器')
  lines.push(`款式：${styleLabel.value} × ${widthCm}cm 门幅 × ${count.value} 件`)
  lines.push(`基础用量 ${fmt2(result.value.baseM)}m${bodyLarge.value ? '（大码口径：上限×1.1）' : '（中等身材区间下限）'}`)
  lines.push(`缩水预留：${shrinkOn.value ? '+' + fmt1(result.value.shrinkP) + '% → ' + fmt2(result.value.afterShrinkM) + 'm' : '未开启（面料已预缩或化纤）'}`)
  if (patternOn.value) lines.push(`对格对花：+${fmt2(result.value.patternM)}m（花回 ${repeatCm.value}cm ×1）`)
  lines.push(`剪裁误差 +0.1m → 单件 ${fmt1(result.value.singleM)}m，共买 ${fmt1(result.value.totalM)}m`)
  lines.push('提示：表值为通行口径 ±10%，裁前先缩水、对花后再排版。')
  return lines.join('\n')
})

// ---------- 事件 ----------
async function copyResult() {
  try {
    await navigator.clipboard.writeText(estimateText.value)
    alert('已复制')
  } catch (e) {
    alert('复制失败，请手动选择文本复制')
  }
}

onMounted(() => {
  addRecentTool('sewing-fabric-estimator')
})
</script>
