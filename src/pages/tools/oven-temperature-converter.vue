<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Thermometer class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">烤箱温度换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">摄氏 / 华氏 / Gas Mark 气体档 / 风扇档四向互换，附常用烘烤温度对照卡</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线烤箱温度换算器：看懂海外食谱的 ℉、英式烤箱的 Gas Mark 气体档、以及风扇烤箱的降温规则。
        换算关系：℉ = ℃ × 9/5 + 32；Gas Mark 按通行英制定义 ℉ = 250 + 25 × 档位（G1≈140℃、G4=180℃、G6=200℃）；
        风扇档（fan-assisted）按英国食品标准局通行建议比常规加热档低 20℃。
        任填一档即时换算其余三档，附 G1~G9 完整对照表与面包 / 蛋糕 / 曲奇 / 披萨 / 烤鸡常用温区卡。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Thermometer class="w-5 h-5 mr-2 text-primary" /> 输入任一档温度
        </h2>

        <!-- 档位选择 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">输入档位</label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              v-for="u in UNITS"
              :key="u.id"
              type="button"
              @click="setUnit(u.id)"
              class="px-2 py-2 rounded-lg text-xs font-medium border transition"
              :class="unit === u.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
            >{{ u.label }}</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ activeUnitTip }}</p>
        </div>

        <!-- 数值输入 -->
        <div>
          <label :for="'ov-in-' + unit" class="block text-sm font-medium text-foreground mb-1.5">{{ activeUnitLabel }}</label>
          <div class="flex items-center gap-2">
            <input
              :id="'ov-in-' + unit"
              v-model.number="value"
              type="number"
              :min="activeUnitMeta.min"
              :step="unit === 'gas' ? 1 : 5"
              class="w-32 border border-border bg-background rounded-lg px-3 py-2 text-lg text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="chip in activeUnitMeta.chips"
                :key="chip.v"
                type="button"
                @click="value = chip.v"
                class="px-2.5 py-1 rounded-md text-xs font-medium border transition"
                :class="value === chip.v ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              >{{ chip.t }}</button>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">{{ activeUnitMeta.hint }}</p>
        </div>

        <button type="button" @click="resetAll" class="w-full px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition">
          <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 恢复默认（180℃）
        </button>

        <div v-if="validationIssue" class="text-xs leading-relaxed p-2 rounded bg-red-500/10 text-red-600 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ validationIssue }}</span>
        </div>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <!-- 换算结果 -->
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowRightLeft class="w-5 h-5 mr-2 text-primary" /> 换算结果
          </h2>
          <div v-if="result" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">摄氏 ℃（常规加热档）</p>
                <p class="text-3xl font-bold text-primary font-mono">{{ result.c }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">华氏 ℉</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.f }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">Gas Mark 气体档</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.gas }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">{{ result.gasNote }}</p>
              </div>
              <div class="bg-muted/50 rounded-xl p-4">
                <p class="text-xs text-muted-foreground mb-1">风扇档（fan-assisted）</p>
                <p class="text-3xl font-bold text-foreground font-mono">{{ result.fan }}</p>
                <p class="text-[11px] text-muted-foreground mt-1">比常规档低 20℃</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-green-500/10 text-green-600 flex items-start gap-1.5">
              <CheckCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>常规档 {{ result.c }}℃ ≈ 风扇档 {{ result.fan }}℃ ≈ {{ result.gas }} 档（Gas Mark）。各品牌烤箱实际温差普遍 ±10~15℃，第一次用时建议配烤箱温度计校准。</span>
            </p>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">输入温度后自动换算</p>
        </div>

        <!-- Gas Mark 对照表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Table2 class="w-5 h-5 mr-2 text-primary" /> Gas Mark 对照表（G1 ~ G9）
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-muted-foreground border-b border-border">
                  <th class="py-2 text-left font-medium">气体档</th>
                  <th class="py-2 text-right font-medium">℃（名义值）</th>
                  <th class="py-2 text-right font-medium">℉</th>
                  <th class="py-2 text-right font-medium">风扇档 ℃</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in GAS_TABLE"
                  :key="row.g"
                  class="border-b border-border/40"
                  :class="result && result.gasNum === row.g ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 font-medium text-foreground">Gas {{ row.g }}</td>
                  <td class="py-2 text-right font-mono text-foreground">{{ row.c }}</td>
                  <td class="py-2 text-right font-mono text-muted-foreground">{{ row.f }}</td>
                  <td class="py-2 text-right font-mono text-muted-foreground">{{ row.c - 20 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-3 leading-relaxed">
            ℉ 列按通行英制定义精确对应（℉ = 250 + 25 × 档）；℃ 列为厂商通行名义值（如 G1 名义 140℃，精确换算 275℉ = 135℃，各表略有出入，G3 在 160~170℃、G7 在 210~220℃ 间因来源而异）。以通行经验/标准原文为准。
          </p>
        </div>

        <!-- 常用烘烤温度对照卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-1">
            <Flame class="w-5 h-5 mr-2 text-primary" /> 常用烘烤温度对照卡
          </h2>
          <p class="text-xs text-muted-foreground mb-3 leading-relaxed">家常烤箱通行温区（常规加热档），按配方与烤箱脾气微调。</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="card in BAKE_CARDS" :key="card.name" class="p-3 rounded-lg border border-border bg-muted/40">
              <p class="text-sm font-medium text-foreground">{{ card.name }}</p>
              <p class="text-xs font-mono text-primary mt-1">{{ card.c }}</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">{{ card.tip }}</p>
            </div>
          </div>
        </div>

        <!-- 内链 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-2">
          <p class="text-sm font-medium text-foreground">温度对上了，配方比例也一起算？</p>
          <p class="text-xs text-muted-foreground leading-relaxed">面包配方讲究以面粉为 100% 的烘焙百分比，水合度直接决定面团软硬。</p>
          <NuxtLink
            to="/tools/bakers-percentage-calculator/"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-medium text-primary hover:bg-primary/20 transition"
          >
            <ChefHat class="w-4 h-4" /> 用烘焙百分比计算器换算配方 →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- SEO 折叠区 -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>烤箱温度换算与「温差陷阱」</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">换算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>华氏 ↔ 摄氏</strong>：℉ = ℃ × 9/5 + 32；℃ = (℉ − 32) × 5/9。</p>
            <p><strong>Gas Mark</strong>：通行英制定义 ℉ = 250 + 25 × 档位，即档位 = round((℉ − 250) ÷ 25)；℃ 列采用厂商通行名义值（G1 = 140℃、G4 = 180℃、G6 = 200℃、G9 = 240℃）。</p>
            <p><strong>风扇档</strong>：常规加热档温度 − 20℃（英国食品标准局等通行建议；时间基本不变）。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">为什么烤箱温度计必备？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            家用烤箱的显示温度≠腔体实际温度：温控探头位置、加热管惯性、门缝漏热都会造成普遍 ±10~15℃、严重的甚至 ±25℃ 的偏差，
            而蛋糕塌陷、曲奇摊烂、面包外糊内湿往往就差这十几度。一只十几元的烤箱温度计放在中层实测，
            记下「显示 180℃ 实际 170℃」这类偏移量，之后所有配方按偏移量修正，是烘焙成功率提升最大的单项投入。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">上下火有什么差异？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            下火管底部热量负责「烤熟、上色底部」，上火管负责表面上色与脆壳。多数烤箱上下火不能独立调温时，按配方温度同调即可；
            可独立调温时通行做法：蛋糕类上火略低 10℃ 防表面过早结壳开裂、下火足温烤透；面包后段视上色情况加盖锡纸或关上火；
            没有独立控温但发现总是上色过快，把烤架下移一层比调温更立竿见影。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">常见问题 (FAQ)</h3>
          <div class="space-y-4">
            <div>
              <h4 class="text-sm font-semibold text-foreground">180℃ 等于多少华氏度和 Gas Mark？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">180℃ = 356℉ = Gas Mark 4（350℉ 名义 180℃）。风扇烤箱约 160℃。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">200℃ 是 Gas 几档？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">200℃ = 392℉ ≈ Gas Mark 6（400℉）。风扇烤箱约 180℃。</p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">风扇烤箱为什么要降 20℃？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                风扇强制循环让热空气持续扫过食物表面，换热效率比静置腔体高，同温度下食物升温更快、更容易上色过度，
                所以通行建议常规档温度减 20℃（时间基本不变，或提前几分钟检查）。
              </p>
            </div>
            <div>
              <h4 class="text-sm font-semibold text-foreground">计算数据会上传吗？</h4>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">不会。全部换算在你的浏览器内即时完成，无网络请求，不保存不上传。</p>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">口径与来源</h3>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Gas Mark 定义（℉ = 250 + 25 × 档）与 G1~G9 对照值经英国厨电厂商手册与主流烘焙媒体两源交叉核对；
            风扇档 −20℃ 为英国食品标准局（FSA）及 Which?、Delia Online 等通行建议。℃ 名义值各来源在 G3 / G7 存在 160~170℃、210~220℃ 的出入，
            页面注明「以通行经验/标准原文为准」。
          </p>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'oven-temperature-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Thermometer, ArrowRightLeft, Table2, Flame, RefreshCw, TriangleAlert, CheckCircle, ChevronDown, ChefHat } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '烤箱温度换算器 - 摄氏/华氏/Gas Mark/风扇档对照 | 有条工具',
  description: '免费在线烤箱温度换算器：℃/℉/Gas Mark 气体档/风扇档任填一档四向互换，Gas Mark 按英制 250+25×档 定义，风扇档按通行建议降 20℃，附 G1~G9 完整对照表与面包蛋糕曲奇披萨烤鸡常用温区卡，纯浏览器本地计算不上传',
  keywords: '烤箱温度换算,华氏度换算摄氏度,Gas Mark 温度对照,风扇烤箱温度降低,烘焙温度换算,180华氏度',
  author: '有条工具',
  ogTitle: '烤箱温度换算器 - 摄氏/华氏/Gas Mark/风扇档对照 | 有条工具',
  ogDescription: '℃/℉/Gas Mark/风扇档任填一档即时互换，附 G1~G9 对照表与常用烘烤温区卡。',
  ogUrl: 'https://www.util.cn/tools/oven-temperature-converter',
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
          name: '烤箱温度换算器',
          url: 'https://www.util.cn/tools/oven-temperature-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '摄氏 / 华氏 / Gas Mark / 风扇档四向互换',
            'Gas Mark 按英制定义 ℉ = 250 + 25 × 档位换算',
            'G1~G9 完整对照表（含风扇档列）',
            '风扇档按通行建议比常规档低 20℃',
            '面包 / 蛋糕 / 曲奇 / 披萨 / 烤鸡常用温区卡',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '烤箱温度换算器', item: 'https://www.util.cn/tools/oven-temperature-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '180℃ 等于多少华氏度和 Gas Mark？',
              acceptedAnswer: { '@type': 'Answer', text: '180℃ = 356℉ = Gas Mark 4（通行名义 350℉/180℃）。风扇烤箱约 160℃。' }
            },
            {
              '@type': 'Question',
              name: '200℃ 是 Gas 几档？',
              acceptedAnswer: { '@type': 'Answer', text: '200℃ = 392℉ ≈ Gas Mark 6（400℉）。风扇烤箱约 180℃。' }
            },
            {
              '@type': 'Question',
              name: '风扇烤箱温度要调低多少？',
              acceptedAnswer: { '@type': 'Answer', text: '通行建议比常规加热档低 20℃（如常规 200℃ 用风扇 180℃），时间基本不变或提前几分钟检查上色。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// ℉ = ℃×9/5+32；Gas Mark 按英制定义 ℉ = 250 + 25×G → G = round((℉−250)/25)；
// ℃ 显示采用厂商通行名义表（G1=140…G9=240）。风扇档 = 常规档 − 20℃。

const c2f = (c) => c * 9 / 5 + 32
const f2c = (f) => (f - 32) * 5 / 9
const c2gas = (c) => Math.round((c2f(c) - 250) / 25)
const gas2f = (g) => 250 + 25 * g

// 厂商通行名义值（℃）；G3 / G7 各来源在 160~170 / 210~220 间略有出入
const GAS_TABLE = [
  { g: 1, c: 140, f: 275 },
  { g: 2, c: 150, f: 300 },
  { g: 3, c: 165, f: 325 },
  { g: 4, c: 180, f: 350 },
  { g: 5, c: 190, f: 375 },
  { g: 6, c: 200, f: 400 },
  { g: 7, c: 220, f: 425 },
  { g: 8, c: 230, f: 450 },
  { g: 9, c: 240, f: 475 }
]
const gas2cNominal = (g) => {
  const row = GAS_TABLE.find((r) => r.g === g)
  return row ? row.c : Math.round(f2c(gas2f(g)))
}

const FAN_DELTA = 20

// 任意档 → 常规档 ℃；非法输入返回 null
function toConventionalC(unit, value) {
  const v = Number(value)
  if (!Number.isFinite(v)) return null
  switch (unit) {
    case 'c': return v
    case 'f': return f2c(v)
    case 'gas': return gas2cNominal(v)
    case 'fan': return v + FAN_DELTA
    default: return null
  }
}

const fmt1 = (v) => (Number.isFinite(v) ? String(+(Math.round(v * 10) / 10)) : '—')

// ---------- 静态数据 ----------
const UNITS = [
  { id: 'c', label: '摄氏 ℃', name: '摄氏温度（常规加热档）', tip: '常规上下火加热档的腔体设定温度，国内食谱默认口径。' },
  { id: 'f', label: '华氏 ℉', name: '华氏温度（常规加热档）', tip: '北美食谱默认口径；350℉ 是最常见的烘焙档位（约 177℃）。' },
  { id: 'gas', label: 'Gas Mark', name: 'Gas Mark 气体档', tip: '英式燃气烤箱档位；按通行英制定义 ℉ = 250 + 25 × 档位换算。' },
  { id: 'fan', label: '风扇档', name: '风扇档温度（fan-assisted）', tip: '风扇强制循环档，通行建议比常规加热档低 20℃；输入风扇档数值即按此反推。' }
]

const UNIT_META = {
  c: { min: 50, chips: [{ v: 150, t: '150' }, { v: 180, t: '180' }, { v: 200, t: '200' }, { v: 220, t: '220' }], hint: '常见烘焙区间 150 ~ 230℃；低于 100℃ 多用于低温慢烤 / 果干。' },
  f: { min: 120, chips: [{ v: 300, t: '300' }, { v: 350, t: '350' }, { v: 400, t: '400' }, { v: 425, t: '425' }], hint: '常见区间 300 ~ 450℉；例如 350℉ = 177℃ = G4。' },
  gas: { min: 1, chips: [{ v: 3, t: 'G3' }, { v: 4, t: 'G4' }, { v: 6, t: 'G6' }, { v: 7, t: 'G7' }], hint: 'G1 ~ G9；也有 G¼ / G½ 低温档，此处按整数档换算。' },
  fan: { min: 30, chips: [{ v: 130, t: '130' }, { v: 160, t: '160' }, { v: 180, t: '180' }, { v: 200, t: '200' }], hint: '输入风扇档设定值，常规档 = 输入 + 20℃（通行建议）。' }
}

const BAKE_CARDS = [
  { name: '面包', c: '190 ~ 230℃（375 ~ 446℉，G6 ~ G8）', tip: '软餐包 / 吐司 180~190℃；欧包带蒸汽 230℃ 起步，后段降温至 210℃ 烤透上色。' },
  { name: '蛋糕', c: '150 ~ 180℃（302 ~ 356℉，G2 ~ G4）', tip: '戚风 / 海绵 150~170℃ 低温慢烤防塌防裂；重油蛋糕 170~180℃；纸杯蛋糕 170℃ 左右。' },
  { name: '曲奇', c: '170 ~ 190℃（338 ~ 374℉，G3 ~ G5）', tip: '170℃ 边缘微焦中心软糯，190℃ 上色快更酥脆；薄配方取低温、厚配方取高温。' },
  { name: '披萨', c: '220 ~ 250℃（428 ~ 482℉，G7 ~ G9）', tip: '家用烤箱开到上限并用烤石 / 铸铁盘蓄热；薄底 250℃ 5~8 分钟，厚底降至 220℃ 延时。' },
  { name: '烤鸡', c: '180 ~ 200℃（356 ~ 392℉，G4 ~ G6）', tip: '整鸡 200℃ 前 20 分钟上色后转 180℃ 烤透；中心温度 74℃ 即熟，带骨髓微出汁更嫩。' },
  { name: '低温慢烤', c: '120 ~ 150℃（248 ~ 302℉，G1 ~ G2）', tip: '果干、肉干、舒芙蕾与隔夜低温烤蔬菜；水分走得慢，注意风门与时间。' }
]

// ---------- 响应式参数 ----------
const unit = ref('c')
const value = ref(180)

const activeUnitMeta = computed(() => UNIT_META[unit.value])
const activeUnitLabel = computed(() => (UNITS.find((u) => u.id === unit.value) || UNITS[0]).name)
const activeUnitTip = computed(() => (UNITS.find((u) => u.id === unit.value) || UNITS[0]).tip)

const validationIssue = computed(() => {
  const v = Number(value.value)
  if (!Number.isFinite(v)) return '请输入数值'
  if (unit.value === 'gas' && (v < 1 || v > 9)) return 'Gas Mark 常规范围 1 ~ 9（G¼/G½ 低温档此处按整数档近似）'
  if (unit.value !== 'gas' && v < 0) return '温度不能为负'
  if (unit.value === 'c' && v > 350) return '超过常见烤箱上限（350℃），请确认输入'
  return ''
})

// ---------- 计算结果 ----------
const result = computed(() => {
  const convC = toConventionalC(unit.value, value.value)
  if (convC === null || convC < -50) return null
  const gasNum = c2gas(convC)
  const inTable = gasNum >= 1 && gasNum <= 9
  const gasNote = inTable
    ? `对应名义 ${gas2cNominal(gasNum)}℃ / ${gas2f(gasNum)}℉`
    : '超出 G1~G9 常规范围，仅按公式线性换算'
  return {
    c: fmt1(convC),
    f: fmt1(c2f(convC)),
    gas: inTable ? `G${gasNum}` : `G${gasNum}（表外）`,
    gasNum,
    gasNote,
    fan: fmt1(convC - FAN_DELTA)
  }
})

// ---------- 交互动作 ----------
function setUnit(u) {
  // 切换档位时把当前结果值带入新档位，避免跳变感
  const convC = toConventionalC(unit.value, value.value)
  unit.value = u
  if (convC === null) return
  switch (u) {
    case 'c': value.value = Math.round(convC); break
    case 'f': value.value = Math.round(c2f(convC)); break
    case 'gas': {
      const g = c2gas(convC)
      value.value = Math.min(9, Math.max(1, g))
      break
    }
    case 'fan': value.value = Math.round(convC - FAN_DELTA); break
  }
}

function resetAll() {
  unit.value = 'c'
  value.value = 180
}

onMounted(() => {
  addRecentTool('oven-temperature-converter')
})
</script>
