<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <ChefHat class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">烘焙百分比计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">以面粉为 100% 的烘焙百分比双向换算，水合度徽章与配方任意缩放</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线烘焙百分比计算器：面包师通用语言「烘焙百分比（Baker's Percentage）」以面粉总量恒为 100%，
        其余配料按占面粉的比例计——水的百分比就是面团水合度，直接决定面团软硬与成品组织。
        支持两种模式双向换算：配方克数 → 百分比（自动判水合度档位）；百分比 → 克数；
        并可按目标总重或目标面粉量把整个配方缩放到任意份量，附干酵母 0.5~1%、盐 1.8~2% 的通行用量提示。
        全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <!-- 模式切换 -->
    <div class="mb-6">
      <div class="inline-flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-lg border border-border">
        <button
          v-for="m in MODES"
          :key="m.id"
          type="button"
          @click="mode = m.id"
          class="px-4 py-2 rounded-md text-sm font-medium transition"
          :class="mode === m.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
        >{{ m.label }}</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <ChefHat class="w-5 h-5 mr-2 text-primary" /> {{ mode === 'recipe' ? '输入配方（克）' : '输入百分比（%）' }}
        </h2>

        <!-- 面粉 -->
        <div>
          <label for="bp-flour" class="block text-sm font-medium text-foreground mb-1.5">
            面粉总量（g）<span class="text-xs text-muted-foreground font-normal ml-1">恒为 100%</span>
          </label>
          <input id="bp-flour" v-model.number="flour" type="number" min="1" step="1" class="w-40 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <p v-if="mode === 'pct'" class="text-[11px] text-muted-foreground mt-1.5">两种面粉（如高筋 + 全麦）请合并填入总量，百分比按总面粉计。</p>
        </div>

        <!-- 配料行 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground w-16 flex-shrink-0">{{ mode === 'recipe' ? '配料 (g)' : '配料 (%)' }}</span>
            <span class="text-xs text-muted-foreground flex-1">{{ mode === 'recipe' ? '百分比结果' : '克数结果' }}</span>
          </div>
          <div v-for="(item, index) in items" :key="index" class="flex items-center gap-2">
            <input
              v-model="item.name"
              type="text"
              placeholder="名称"
              class="w-20 flex-shrink-0 border border-border bg-background rounded-lg px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              v-if="mode === 'recipe'"
              v-model.number="item.grams"
              type="number"
              min="0"
              step="0.1"
              aria-label="配料克数"
              class="w-24 flex-shrink-0 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              v-else
              v-model.number="item.pct"
              type="number"
              min="0"
              step="0.1"
              aria-label="配料百分比"
              class="w-24 flex-shrink-0 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div class="flex-1 min-w-0 flex items-center gap-2">
              <template v-if="mode === 'recipe'">
                <span class="text-sm font-bold text-primary font-mono">{{ pctText(item.grams) }}</span>
                <span v-if="item.name === '水' || item.name === '水（牛奶/液体折算）'" class="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">水合度</span>
              </template>
              <span v-else class="text-sm font-bold text-primary font-mono">{{ gramText(item.pct) }} g</span>
            </div>
            <button
              type="button"
              @click="removeItem(index)"
              class="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              aria-label="删除该行"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="chip in ADD_CHIPS"
            :key="chip"
            type="button"
            @click="addPreset(chip)"
            class="px-2.5 py-1 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary transition"
          >+ {{ chip }}</button>
          <button
            type="button"
            @click="addItem"
            class="px-2.5 py-1 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary transition"
          >+ 自定义行</button>
        </div>

        <!-- 缩放 -->
        <div class="border-t border-border pt-4 space-y-2">
          <p class="text-sm font-medium text-foreground flex items-center">
            <Scaling class="w-4 h-4 mr-1.5 text-primary" /> 任意缩放
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <label for="bp-target-flour" class="text-xs text-muted-foreground">目标面粉量</label>
            <input id="bp-target-flour" v-model.number="targetFlour" type="number" min="0" step="10" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">g，或</span>
            <label for="bp-target-total" class="text-xs text-muted-foreground">目标总重</label>
            <input id="bp-target-total" v-model.number="targetTotal" type="number" min="0" step="10" class="w-24 border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <span class="text-xs text-muted-foreground">g</span>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            {{ scaleTip }}
          </p>
        </div>

        <button type="button" @click="resetAll" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复示例配方（500g 面粉）
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
        <!-- 总览卡 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ClipboardList class="w-5 h-5 mr-2 text-primary" /> {{ mode === 'recipe' ? '配方分析' : '换算配方' }}
          </h2>
          <div v-if="result" class="space-y-3">
            <!-- 水合度徽章 -->
            <div class="bg-muted/50 rounded-xl p-4 flex flex-wrap items-center gap-3">
              <div>
                <p class="text-xs text-muted-foreground mb-1">水合度（水 ÷ 面粉）</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ result.hydration }}%</p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="hydrationBadge.cls">{{ hydrationBadge.label }}</span>
              <p class="text-xs text-muted-foreground leading-relaxed flex-1 min-w-[12rem]">{{ hydrationBadge.tip }}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">总面团重</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ result.totalG }} g</p>
                <p class="text-[11px] text-muted-foreground mt-1">面粉 + 各配料合计</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">总百分比（除面粉外）</p>
                <p class="text-2xl font-bold text-foreground font-mono">{{ result.totalPct }}%</p>
                <p class="text-[11px] text-muted-foreground mt-1">加面粉 100% 即配方总百分比</p>
              </div>
            </div>
            <!-- 明细表 -->
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-muted-foreground border-b border-border">
                    <th class="py-2 text-left font-medium">配料</th>
                    <th class="py-2 text-right font-medium">克数 (g)</th>
                    <th class="py-2 text-right font-medium">烘焙百分比</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-border/40 bg-primary/5">
                    <td class="py-2 font-medium text-foreground">面粉</td>
                    <td class="py-2 text-right font-mono text-foreground">{{ result.rows.flour.g }}</td>
                    <td class="py-2 text-right font-mono text-primary font-bold">100%</td>
                  </tr>
                  <tr v-for="(row, i) in result.rows.items" :key="i" class="border-b border-border/40">
                    <td class="py-2 text-foreground">{{ row.name || '配料 ' + (i + 1) }}</td>
                    <td class="py-2 text-right font-mono text-foreground">{{ row.g }}</td>
                    <td class="py-2 text-right font-mono text-muted-foreground">{{ row.pct }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- 缩放结果 -->
            <div v-if="result.scaleText" class="p-3 rounded-lg bg-muted/60 border border-border text-xs text-foreground leading-relaxed flex items-start gap-1.5">
              <Scaling class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>{{ result.scaleText }}</span>
            </div>
            <!-- 酵母/盐提示 -->
            <div v-if="result.yeastSaltNotes.length" class="p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed space-y-1">
              <p v-for="(note, i) in result.yeastSaltNotes" :key="i" class="flex items-start gap-1.5">
                <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <span>{{ note }}</span>
              </p>
            </div>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">填入面粉量与配料后自动计算</p>
        </div>

        <!-- 水合度速查 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Droplets class="w-5 h-5 mr-2 text-primary" /> 水合度速查（经验区间）
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">&lt; 60% · 低水量</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">贝果、意式面包等偏硬面团，好整形、组织紧实有嚼劲。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">60 ~ 70% · 常规</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">吐司、餐包最常见区间，面团软而不粘手，新手友好。</p>
            </div>
            <div class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">70 ~ 80% · 高水量</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">恰巴塔、欧式乡村包：气孔大而湿润，粘手、需要折叠手法与发酵经验。</p>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">区间为面包行业通行经验口径（页面注明「以通行经验/标准原文为准」）；全麦等高吸水粉料可承受更高水合度，液体奶按约 90% 折算成水。</p>
        </div>

        <!-- 内链 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2">
          <p class="text-sm font-medium text-foreground">配比定好了，烘烤温度也对一下？</p>
          <p class="text-xs text-muted-foreground leading-relaxed">面包常用 190~230℃，海外食谱的 ℉ / Gas Mark / 风扇档直接换算更省心。</p>
          <NuxtLink
            to="/tools/oven-temperature-converter/"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition"
          >
            <Thermometer class="w-4 h-4" /> 用烤箱温度换算器对照温度 →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 折叠区 -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>烘焙百分比为什么面粉必须 100%？</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>配方 → 百分比</strong>：各配料百分比 = 配料克数 ÷ 面粉克数 × 100%；面粉恒为 100%。</p>
            <p><strong>百分比 → 配方</strong>：配料克数 = 面粉克数 × 百分比 ÷ 100。</p>
            <p><strong>水合度</strong> = 水 ÷ 面粉 × 100%。</p>
            <p><strong>缩放系数</strong> = 目标面粉量 ÷ 原面粉量；按目标总重缩放时，面粉量 = 目标总重 ÷（1 + 除面粉外总百分比 ÷ 100）。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">为什么面粉必须 100%？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            因为面粉是配方里唯一的「结构骨架」：一切性质（吸水、筋度、发酵膨胀、成品组织）都随面粉量等比变化。
            以面粉为基准写配方，不管做 1 个还是 20 个面包、用 500g 还是 5kg 面粉，配方形状完全不变——
            「70% 水、2% 盐、1% 酵母」在任何份量下都是同一块面团。这也是全世界面包师、配方书交流的通用语言，
            比记录「水 350g」这种绝对值更能一眼看出面团性格（水合度高低、咸淡、发酵强弱）。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">水合度对面团有什么影响？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            水合度决定面团软硬与成品组织：低于 60% 的硬面团（贝果）好定型、组织紧实；60~70% 是吐司与餐包的常规区间，软而不粘手；
            70~80% 的高水量面团（恰巴塔、乡村欧包）湿粘、需要折叠替代揉面，但能换来大而湿润的气孔。
            注意两点：全麦、黑麦等粉料吸水率更高，同等水合度手感更干；牛奶约含 87~90% 水分，用奶代替水时按比例折算。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">500g 面粉、350g 水、10g 盐、5g 酵母是什么水平？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                水合度 70%（高水量区上沿）、盐 2%、酵母 1%，总面团重 865g——是典型的高水量吐司或欧式面团配置。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">干酵母放多少合适？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                通行用量为面粉的 0.5~1%（一次发酵 1~2 小时节奏）；急发可到 1.5%，隔夜冷藏慢发酵可降到 0.1~0.3%。
                鲜酵母约为干酵母的 3 倍用量，即面粉的 1.5~3%。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">盐也按百分比算吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                是的，盐通行 1.8~2%（占面粉）：低于 1.5% 发酵偏快但味淡、面筋弱；高于 2.2% 明显抑制酵母并偏咸。黄油、糖同理都按占面粉比例记录。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">计算数据会上传吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">不会。配方与缩放全部在浏览器内即时计算，无网络请求，不保存不上传。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            烘焙百分比（Baker's Percentage）定义与水合度经验区间（&lt;60 低水量 / 60~70 常规 / 70~80 高水量）为面包行业通行经验口径，
            干酵母 0.5~1%、盐 1.8~2% 为通行用量参考（页面注明「以通行经验/标准原文为准」）；特殊粉料与工艺请按配方书与实际手感微调。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'bakers-percentage-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChefHat, Trash2, Scaling, RefreshCw, TriangleAlert, ClipboardList, Info, Droplets, ChevronDown, Thermometer } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '烘焙百分比计算器 - 面粉100%双向换算与水合度 | 有条工具',
  description: '免费在线烘焙百分比计算器：以面粉恒为100%双向换算克数与百分比，自动判水合度档位（低水量/常规/高水量），支持目标总重或面粉量任意缩放配方，附干酵母0.5~1%、盐1.8~2%通行用量提示，纯浏览器本地计算不上传',
  keywords: '烘焙百分比计算器,面包水合度计算,配方缩放计算,bakers percentage,烘焙配方换算',
  author: '有条工具',
  ogTitle: '烘焙百分比计算器 - 面粉100%双向换算与水合度 | 有条工具',
  ogDescription: '面粉恒100%的烘焙百分比双向换算，水合度徽章与配方任意缩放。',
  ogUrl: 'https://www.util.cn/tools/bakers-percentage-calculator',
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
          name: '烘焙百分比计算器',
          url: 'https://www.util.cn/tools/bakers-percentage-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '配方克数 → 烘焙百分比（面粉恒 100%）',
            '百分比 → 克数反向换算',
            '水合度自动判档（<60 低水量 / 60-70 常规 / 70-80 高水量）',
            '按目标总重或目标面粉量任意缩放',
            '干酵母 0.5~1%、盐 1.8~2% 通行用量提示',
            '自定义配料行',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '烘焙百分比计算器', item: 'https://www.util.cn/tools/bakers-percentage-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '500g 面粉、350g 水、10g 盐、5g 酵母是什么水平？',
              acceptedAnswer: { '@type': 'Answer', text: '水合度 70%（高水量区上沿）、盐 2%、酵母 1%，总面团重 865g，是典型的高水量吐司或欧式面团配置。' }
            },
            {
              '@type': 'Question',
              name: '烘焙百分比为什么面粉必须是 100%？',
              acceptedAnswer: { '@type': 'Answer', text: '面粉是配方唯一结构基准，一切配料随面粉等比缩放后配方形状不变；以面粉为 100% 记录能让任意份量下的配方可比较、可复现。' }
            },
            {
              '@type': 'Question',
              name: '干酵母和盐一般放多少？',
              acceptedAnswer: { '@type': 'Answer', text: '通行用量：干酵母为面粉的 0.5~1%，盐为 1.8~2%；隔夜冷藏慢发酵酵母可降至 0.1~0.3%，鲜酵母约为干酵母 3 倍。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 百分比 = 克数/面粉×100（面粉恒 100%）；克数 = 面粉×百分比/100；
// 水合度 = 水/面粉×100；缩放系数 = 目标面粉/原面粉；
// 按目标总重缩放：面粉 = 目标总重 / (1 + 除面粉外总百分比/100)。

function pctOf(grams, flour) {
  const f = Number(flour)
  if (!Number.isFinite(f) || f <= 0 || !Number.isFinite(Number(grams))) return null
  return (Number(grams) / f) * 100
}
function gramOf(pct, flour) {
  const f = Number(flour)
  if (!Number.isFinite(f) || f <= 0 || !Number.isFinite(Number(pct))) return null
  return (f * Number(pct)) / 100
}
function hydrationOf(water, flour) {
  const p = pctOf(water, flour)
  return p === null ? null : p
}
// 水合度档位（通行经验区间）
function hydrationTier(h) {
  if (h === null) return null
  if (h < 60) return { key: 'low', label: '低水量面团', cls: 'bg-amber-500/15 text-amber-600', tip: '偏硬面团：好整形、组织紧实，适合贝果、意式硬面包。' }
  if (h < 70) return { key: 'mid', label: '常规水量', cls: 'bg-green-500/15 text-green-600', tip: '吐司、餐包最常见区间：面团软而不粘手，新手友好。' }
  if (h <= 80) return { key: 'high', label: '高水量面团', cls: 'bg-blue-500/15 text-blue-600', tip: '湿润粘手、气孔大：恰巴塔与乡村欧包区间，建议用折叠手法代替揉面。' }
  return { key: 'veryhigh', label: '超高水量', cls: 'bg-red-500/15 text-red-600', tip: '超过 80% 的液体面团，需强筋面粉与熟练手法，确认配方无误。' }
}
// 缩放系数：优先目标面粉量，其次目标总重
function scaleFactorOf(flour, totalG, targetFlour, targetTotal) {
  const f = Number(flour)
  if (!Number.isFinite(f) || f <= 0) return null
  const tf = Number(targetFlour)
  if (Number.isFinite(tf) && tf > 0) return tf / f
  const tt = Number(targetTotal)
  const otherPctSum = Math.max(0, (Number.isFinite(Number(totalG)) ? Number(totalG) : f) - f) / f * 100
  if (Number.isFinite(tt) && tt > 0) {
    const denom = 1 + otherPctSum / 100
    return tt / denom / f
  }
  return null
}

const fmtG = (v) => (Number.isFinite(v) ? +(Math.round(v * 10) / 10) : '—')
const fmtP = (v) => (v === null ? '—' : `${+(Math.round(v * 10) / 10)}%`)

// ---------- 静态数据 ----------
const MODES = [
  { id: 'recipe', label: '配方 → 百分比' },
  { id: 'pct', label: '百分比 → 配方' }
]

const ADD_CHIPS = ['水', '盐', '酵母', '糖', '油', '黄油', '奶粉']

// ---------- 响应式参数 ----------
const mode = ref('recipe')
const flour = ref(500)
const items = ref([
  { name: '水', grams: 350, pct: 70 },
  { name: '盐', grams: 10, pct: 2 },
  { name: '酵母', grams: 5, pct: 1 }
])
const targetFlour = ref(null)
const targetTotal = ref(null)

const waterGrams = computed(() => {
  const row = items.value.find((it) => (it.name || '').trim().startsWith('水'))
  if (!row) return 0
  return mode.value === 'recipe' ? Number(row.grams) || 0 : gramOf(row.pct, flour.value) || 0
})

const scaleTip = computed(() => {
  const sf = scaleFactorOf(flour.value, totalG.value, targetFlour.value, targetTotal.value)
  if (sf === null) return '填其一即可：整配方按系数缩放（目标总重按当前除面粉外百分比反推面粉量）。'
  return `当前缩放系数 ×${+sf.toFixed(3)}：右表明细已按缩放后份量展示。`
})

const totalG = computed(() => {
  const f = Number(flour.value)
  if (!Number.isFinite(f) || f <= 0) return null
  if (mode.value === 'recipe') {
    return f + items.value.reduce((s, it) => s + (Number(it.grams) || 0), 0)
  }
  return f + items.value.reduce((s, it) => s + (gramOf(it.pct, f) || 0), 0)
})

const totalPctExFlour = computed(() => {
  if (mode.value === 'recipe') {
    return items.value.reduce((s, it) => s + (pctOf(it.grams, flour.value) || 0), 0)
  }
  return items.value.reduce((s, it) => s + (Number(it.pct) || 0), 0)
})

const validationIssues = computed(() => {
  const list = []
  if (!(Number(flour.value) > 0)) list.push('面粉总量需为大于 0 的数值（克）')
  if (mode.value === 'recipe' && items.value.every((it) => !(Number(it.grams) > 0))) list.push('至少填写一种配料的克数')
  if (mode.value === 'pct' && items.value.every((it) => !(Number(it.pct) > 0))) list.push('至少填写一种配料的百分比')
  if (mode.value === 'pct' && items.value.some((it) => Number(it.pct) > 150)) list.push('存在超过 150% 的配料，请确认（水、糖、油等通常不超过面粉的 100%）')
  return list
})

const hydrationBadge = computed(() => {
  const h = hydrationOf(waterGrams.value, flour.value)
  const tier = hydrationTier(h)
  if (!tier) return { label: '—', cls: '', tip: '' }
  return { ...tier, pct: h }
})

// ---------- 计算结果 ----------
const result = computed(() => {
  const f = Number(flour.value)
  if (!Number.isFinite(f) || f <= 0) return null
  const sf = scaleFactorOf(f, totalG.value, targetFlour.value, targetTotal.value) || 1

  let rows
  if (mode.value === 'recipe') {
    rows = items.value.map((it) => {
      const g = (Number(it.grams) || 0) * sf
      const p = pctOf(it.grams, f)
      return { name: it.name, g: fmtG(g), pct: p === null ? '—' : fmtP(p) }
    })
  } else {
    rows = items.value.map((it) => {
      const g = gramOf(it.pct, f) || 0
      return { name: it.name, g: fmtG(g * sf), pct: fmtP(Number(it.pct) || 0) }
    })
  }

  const h = hydrationOf(waterGrams.value, f)
  const total = mode.value === 'recipe'
    ? f * sf + items.value.reduce((s, it) => s + (Number(it.grams) || 0) * sf, 0)
    : f * sf + items.value.reduce((s, it) => s + (gramOf(it.pct, f) || 0) * sf, 0)

  // 酵母 / 盐通行区间提示
  const notes = []
  const yeastPct = (() => {
    const row = items.value.find((it) => (it.name || '').includes('酵母'))
    if (!row) return null
    return mode.value === 'recipe' ? pctOf(row.grams, f) : Number(row.pct) || 0
  })()
  const saltPct = (() => {
    const row = items.value.find((it) => (it.name || '').includes('盐'))
    if (!row) return null
    return mode.value === 'recipe' ? pctOf(row.grams, f) : Number(row.pct) || 0
  })()
  if (yeastPct !== null && (yeastPct < 0.5 || yeastPct > 1)) {
    notes.push(`酵母当前 ${fmtP(yeastPct)}：通行区间为面粉的 0.5~1%，隔夜冷藏慢发酵可低至 0.1~0.3%，急发最多 1.5%。`)
  }
  if (saltPct !== null && (saltPct < 1.8 || saltPct > 2)) {
    notes.push(`盐当前 ${fmtP(saltPct)}：通行区间为面粉的 1.8~2%，过高抑制酵母、过低面筋与风味偏弱。`)
  }

  const scaleText = sf !== 1
    ? `已按缩放系数 ×${+sf.toFixed(3)} 展示（${targetFlour.value > 0 ? `目标面粉 ${targetFlour.value}g` : `目标总重 ${targetTotal.value}g`}）；总面团重 ${fmtG(total)}g。`
    : ''

  return {
    hydration: h === null ? '—' : +h.toFixed(1),
    totalG: fmtG(total),
    totalPct: fmtP(+(Math.round(totalPctExFlour.value * 10) / 10)),
    rows: { flour: { g: fmtG(f * sf) }, items: rows },
    scaleText,
    yeastSaltNotes: notes
  }
})

// ---------- 交互动作 ----------
function addItem() {
  items.value.push({ name: '', grams: 0, pct: 0 })
}
function addPreset(name) {
  items.value.push({ name, grams: 0, pct: 0 })
}
function removeItem(index) {
  items.value.splice(index, 1)
}
function resetAll() {
  mode.value = 'recipe'
  flour.value = 500
  items.value = [
    { name: '水', grams: 350, pct: 70 },
    { name: '盐', grams: 10, pct: 2 },
    { name: '酵母', grams: 5, pct: 1 }
  ]
  targetFlour.value = null
  targetTotal.value = null
}

const pctText = (grams) => fmtP(pctOf(grams, flour.value))
const gramText = (pct) => fmtG(gramOf(pct, flour.value))

onMounted(() => {
  addRecentTool('bakers-percentage-calculator')
})
</script>
