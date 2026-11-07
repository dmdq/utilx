<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Flame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">焊接电流选择器</h1>
          <p class="text-sm text-muted-foreground mt-1">焊条直径 × 焊接位置 → 推荐电流区间（35~55 A/mm 经验式），附板厚-焊条直径对照、J422/J507 速查与电流过大过小症状</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线焊条电弧焊电流计算器：手工焊打底前先定电流——推荐电流(A) =（35 ~ 55）× 焊条直径(mm) × 位置系数。
        例如 3.2mm 焊条平焊 112 ~ 176A（中值 144A），立焊乘 0.85 约 95 ~ 150A。
        本页内置平焊 1.00 / 横焊 0.90 / 立焊 0.85 / 仰焊 0.80 的位置折减（焊接手册常用经验系数）、等厚板材焊条直径对照表
        （δ≤2→2.0、δ3→2.5、δ4~6→3.2、δ8~12→4.0、δ&gt;12→5.0）与 J422(E4303)/J502(E5003)/J507(E5015) 焊条速查卡（药皮类型、电源极性、烘干制度），
        并给出电流过大（咬边、烧穿）/过小（粘条、夹渣）症状对照。全部在浏览器本地计算，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左：参数面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Zap class="w-5 h-5 mr-2 text-primary" /> 焊接参数
        </h2>

        <!-- 焊条直径 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">焊条直径（mm）</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="d in DIAMETERS"
              :key="d"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition"
              :class="dia === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="dia = d"
            >{{ d.toFixed(1) }}</button>
          </div>
          <p class="text-[11px] text-muted-foreground mt-1.5">看焊条包装标称直径；同批焊条保持同直径，混用时按最细一档定电流。</p>
        </div>

        <!-- 焊接位置 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">焊接位置（折减系数为焊接手册常用经验值）</label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="p in POSITIONS"
              :key="p.id"
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium border transition text-left"
              :class="position === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'"
              @click="position = p.id"
            >{{ p.label }}（×{{ p.factor.toFixed(2) }}）</button>
          </div>
        </div>

        <!-- 母材厚度 -->
        <div>
          <label for="wa-thick" class="block text-sm font-medium text-foreground mb-1.5">母材厚度 δ（可选：反查推荐焊条直径）</label>
          <div class="flex items-center gap-2">
            <select
              id="wa-thick"
              v-model.number="thickness"
              class="border border-border bg-background rounded-lg px-3 py-2 text-sm text-foreground flex-1 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option :value="null">不填（直接按焊条直径算电流）</option>
              <option v-for="t in THICKNESSES" :key="t" :value="t">{{ t }} mm</option>
            </select>
            <button
              v-if="thicknessDia !== null"
              type="button"
              class="px-3 py-2 rounded-lg text-xs font-medium border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition whitespace-nowrap"
              @click="dia = thicknessDia"
            >改用 {{ thicknessDia.toFixed(1) }}mm</button>
          </div>
          <p v-if="thicknessDia !== null" class="text-[11px] text-muted-foreground mt-1.5">按等厚对接经验表：δ{{ thicknessLabel }} 推荐 <span class="font-mono text-foreground font-semibold">{{ thicknessDia.toFixed(1) }}mm</span> 焊条（经验值，以工艺评定为准）。</p>
        </div>

        <div class="border-t border-border pt-4 space-y-1.5">
          <p class="text-xs leading-relaxed p-2 rounded bg-amber-500/10 text-amber-700 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>电流经验式为手工电弧焊（焊条电弧焊）打底参考：实际应以焊接工艺评定（WPS）与焊条厂家说明为准，现场按熔池状态微调 5~15A。</span>
          </p>
        </div>

        <button type="button" class="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition" @click="copyResult">
          <Copy class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 复制规范卡
        </button>
      </div>

      <!-- 右：结果 -->
      <div class="space-y-6">
        <div class="bg-card border border-primary/40 rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Flame class="w-5 h-5 mr-2 text-primary" /> 推荐焊接电流
          </h2>
          <div v-if="result" class="space-y-4">
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">{{ dia.toFixed(1) }}mm 焊条 · {{ activePosition.label }}（×{{ activePosition.factor.toFixed(2) }}）</p>
              <p class="text-3xl lg:text-4xl font-bold text-primary font-mono">{{ result.minText }} ~ {{ result.maxText }} <span class="text-lg font-normal text-muted-foreground">A</span></p>
              <p class="text-xs text-muted-foreground mt-2 font-mono">中值 <span class="font-semibold text-foreground">{{ result.midText }}A</span> 高亮推荐：{{ result.min }}=35×{{ dia.toFixed(1) }}×{{ activePosition.factor.toFixed(2) }}，{{ result.max }}=55×{{ dia.toFixed(1) }}×{{ activePosition.factor.toFixed(2) }}</p>
            </div>
            <div class="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs leading-relaxed">
              <p class="text-foreground">打底从<b>中值 {{ result.midText }}A</b> 起弧试焊：熔池能控制、铁水不淌不粘条即合适。运条偏慢 / 板厚偏上限加 10~15A；立焊仰焊铁水下淌则减 10~15A。</p>
            </div>
          </div>
          <p v-else class="p-8 text-center text-sm text-muted-foreground">选择焊条直径与位置开始计算</p>
        </div>

        <!-- 板厚-焊条直径对照 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <BookOpen class="w-5 h-5 mr-2 text-primary" /> 等厚板材推荐焊条直径对照
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-xs text-muted-foreground">
                  <th class="text-left py-2 pr-3 font-medium">母材厚度 δ（mm）</th>
                  <th class="text-right py-2 px-3 font-medium">推荐焊条直径（mm）</th>
                  <th class="text-right py-2 px-3 font-medium">平焊电流参考（A）</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in DIA_TABLE" :key="row.label" class="border-b border-border/50" :class="row.dia === dia ? 'bg-primary/5' : ''">
                  <td class="py-2 pr-3 text-foreground">{{ row.label }}</td>
                  <td class="py-2 px-3 text-right font-mono" :class="row.dia === dia ? 'text-primary font-semibold' : 'text-foreground'">{{ row.dia.toFixed(1) }}</td>
                  <td class="py-2 px-3 text-right font-mono text-muted-foreground">{{ row.flatRange }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-[11px] text-muted-foreground mt-2">对照为低碳钢单层对接的通行经验值；多层多道焊打底选偏细焊条，角焊缝/重要结构以工艺评定为准。</p>
        </div>

        <!-- 电流过大/过小症状 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> 电流过大 / 过小症状对照
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <p class="text-sm font-semibold text-red-600 mb-1.5">电流过大</p>
              <ul class="text-xs text-muted-foreground space-y-1 leading-relaxed list-disc list-inside">
                <li><b class="text-foreground">咬边</b>：母材边缘被电弧熔掉未填满，焊缝两侧出现凹槽</li>
                <li><b class="text-foreground">烧穿</b>：薄板熔池穿透成孔洞</li>
                <li>飞溅明显增大、焊缝过宽下塌成形差</li>
                <li>药皮成块脱落、焊条发红后半段药皮失效</li>
                <li>变形与热影响区加大，淬硬倾向增大</li>
              </ul>
            </div>
            <div class="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <p class="text-sm font-semibold text-blue-600 mb-1.5">电流过小</p>
              <ul class="text-xs text-muted-foreground space-y-1 leading-relaxed list-disc list-inside">
                <li><b class="text-foreground">粘条</b>：焊条粘在母材上提不起来，引弧困难</li>
                <li><b class="text-foreground">夹渣</b>：熔渣浮不上来、熔池浑浊，层间清理出渣</li>
                <li>未熔合/未焊透：电弧穿透力不足，坡口根部粘合</li>
                <li>焊缝窄而凸（余高过大）、成形堆叠</li>
                <li>运条感觉「推不动」、熔池不跟随焊条走</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 焊条速查卡 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-6">
      <h2 class="text-lg font-semibold flex items-center mb-3">
        <BookOpen class="w-5 h-5 mr-2 text-primary" /> 焊条速查卡：J422 / J502 / J507 与型号代码解读
      </h2>
      <div class="overflow-x-auto mb-4">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-xs text-muted-foreground">
              <th class="text-left py-2 pr-3 font-medium">牌号</th>
              <th class="text-left py-2 px-3 font-medium">型号（GB/T 5117）</th>
              <th class="text-left py-2 px-3 font-medium">药皮类型</th>
              <th class="text-left py-2 px-3 font-medium">电源</th>
              <th class="text-left py-2 px-3 font-medium">熔敷金属强度</th>
              <th class="text-left py-2 px-3 font-medium">焊前烘干（常用）</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in ELECTRODES" :key="e.grade" class="border-b border-border/50">
              <td class="py-2 pr-3 font-semibold text-foreground">{{ e.grade }}</td>
              <td class="py-2 px-3 font-mono text-foreground">{{ e.model }}</td>
              <td class="py-2 px-3 text-muted-foreground">{{ e.coating }}</td>
              <td class="py-2 px-3 text-muted-foreground">{{ e.power }}</td>
              <td class="py-2 px-3 font-mono text-muted-foreground">{{ e.strength }}</td>
              <td class="py-2 px-3 text-muted-foreground">{{ e.drying }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-3 rounded-lg border border-border bg-muted/40">
          <p class="text-sm font-medium text-foreground mb-1">E×&#215;×&#215; 型号怎么读（如 E4303 / E5015）</p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            <b class="text-foreground">E</b> = 焊条；<b class="text-foreground">前两位数字 ×10</b> = 熔敷金属最小抗拉强度 MPa（43→430、50→490）；
            <b class="text-foreground">第三位</b> = 适用焊接位置（0/1 全位置平立横仰、2 平焊及平角焊、4 向下立焊）；
            <b class="text-foreground">第三、四位组合</b> = 药皮类型与电源：03 钛钙型交直流两用、13 高钛钾型交直流、15 低氢钠型直流反接、16 低氢钾型交直流、10 高纤维素钠型直流反接。
          </p>
        </div>
        <div class="p-3 rounded-lg border border-border bg-muted/40">
          <p class="text-sm font-medium text-foreground mb-1">极性与烘干注意（以厂家说明为准）</p>
          <p class="text-xs text-muted-foreground leading-relaxed">
            <b class="text-foreground">J422（钛钙型）</b>：交流直流焊机均可，电弧稳、飞溅小、脱渣易，一般受潮时 75~150℃ 烘 1h 即可；
            <b class="text-foreground">J507（低氢钠型）</b>：必须<b class="text-foreground">直流反接</b>（焊条接正极），焊前 350~400℃ 烘 1~2h、保温筒随用随取、重复烘干不宜超过 2 次，否则易气孔与氢致裂纹；
            J506（E5016 低氢钾型）交直流两用，烘干制度同低氢类。碱性焊条宜短弧操作。
          </p>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 区：FAQ + 公式 + 来源 -->
    <details class="bg-card border border-border rounded-lg p-6 mb-6" open>
      <summary class="text-base font-semibold text-foreground cursor-pointer select-none mb-4">计算公式、经验依据与常见问题</summary>
      <div class="space-y-4">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">核心公式</h3>
          <ul class="text-sm text-muted-foreground space-y-1 leading-relaxed list-disc list-inside font-mono text-[13px]">
            <li>推荐电流(A) = (35 ~ 55) × 焊条直径 d(mm) × 位置系数 k</li>
            <li>位置系数：平焊 1.00 / 横焊 0.90 / 立焊 0.85 / 仰焊 0.80</li>
            <li>中值电流 = (35 + 55) ÷ 2 × d × k = 45 × d × k</li>
          </ul>
        </div>
        <div>
          <h3 class="text-base font-semibold text-foreground mb-1.5">依据与口径说明</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            「35~55 A/mm」为焊条电弧焊教课书与焊接手册通行的每毫米直径电流密度经验区间；位置折减系数（平 1.00 / 横 0.90 / 立焊仰焊 0.80~0.85）为
            焊接手册常用经验折减——非标准强制条文，不同教材手册略有出入。板厚-直径对照（δ≤2→2.0、δ3→2.5、δ4~6→3.2、δ8~12→4.0、δ&gt;12→5.0）
            为低碳钢单层对接经验值。焊条型号解读依据 GB/T 5117（非合金钢焊条）体系；烘干温度与极性为厂家说明通行口径。
            工程施焊参数应以焊接工艺评定（WPS）与现行标准原文为准。
          </p>
        </div>
        <div class="space-y-4 pt-2 border-t border-border/60">
          <div v-for="faq in FAQS" :key="faq.q">
            <h4 class="text-sm font-semibold text-foreground">{{ faq.q }}</h4>
            <p class="text-sm text-muted-foreground mt-1 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'welding-amperage-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Flame, Zap, BookOpen, Gauge, Copy, TriangleAlert } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '焊接电流选择器 - 焊条直径/焊接位置推荐电流计算 | 有条工具',
  description: '免费在线焊接电流计算器：推荐电流 =（35~55）×焊条直径×位置系数（平焊1.00/横焊0.90/立焊0.85/仰焊0.80），如 3.2mm 平焊 112~176A；附板厚-焊条直径对照表（δ≤2→2.0/δ3→2.5/δ4~6→3.2/δ8~12→4.0/δ>12→5.0）、J422/J502/J507 焊条速查（药皮/极性/烘干）、E4303/E5015 型号解读与电流过大过小症状对照，纯浏览器本地计算不上传',
  keywords: '焊接电流计算,焊条电流选择,J422,J507,焊条直径对照,E4303,E5015,手工电弧焊电流,立焊电流',
  author: '有条工具',
  ogTitle: '焊接电流选择器 - 焊条直径/焊接位置推荐电流计算 | 有条工具',
  ogDescription: '焊条直径 × 位置系数一键算出推荐电流区间与中值，附板厚选条对照和 J422/J507 速查卡。',
  ogUrl: 'https://www.util.cn/tools/welding-amperage-calculator',
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
          name: '焊接电流选择器',
          url: 'https://www.util.cn/tools/welding-amperage-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: [
            '推荐电流 =(35~55)×直径×位置系数',
            '平/横/立/仰焊位置折减系数',
            '板厚反查推荐焊条直径',
            '等厚板材直径对照表',
            'J422/J502/J507 焊条速查卡',
            'E4303/E5015 型号代码解读',
            '电流过大/过小症状对照',
            '本地计算不上传'
          ]
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '焊接电流选择器', item: 'https://www.util.cn/tools/welding-amperage-calculator' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '3.2 焊条用多大电流？',
              acceptedAnswer: { '@type': 'Answer', text: '按经验式 (35~55)×3.2：平焊 112~176A（中值 144A），立焊乘 0.85 约 95~150A，仰焊乘 0.80 约 90~141A。现场从 140A 左右试起，按熔池状态微调。' }
            },
            {
              '@type': 'Question',
              name: 'J422 和 J507 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'J422（E4303）是钛钙型酸性焊条，交直流两用，抗拉强度 430MPa 级，工艺性好，适合一般结构；J507（E5015）是低氢钠型碱性焊条，490MPa 级、韧性与抗裂性好，须直流反接，焊前 350~400℃ 烘干 1~2h。' }
            },
            {
              '@type': 'Question',
              name: '电流大了或小了分别有什么症状？',
              acceptedAnswer: { '@type': 'Answer', text: '电流过大：咬边、烧穿、飞溅大、焊条发红药皮脱落、变形大；电流过小：粘条、引弧难、夹渣、未熔合未焊透、焊缝窄而凸。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// PURE-LOGIC-START
// 推荐电流区间 =（35~55）× d × k；d、k 非法返回 null
function recommendCurrent(diaMm, posFactor) {
  const d = Number(diaMm)
  const k = Number(posFactor)
  if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(k) || k <= 0) return null
  const min = 35 * d * k
  const max = 55 * d * k
  return { min, max, mid: (min + max) / 2 }
}

// 板厚 → 推荐焊条直径：δ≤2→2.0、δ≤3→2.5、δ≤6→3.2、δ≤12→4.0、>12→5.0（经验值）；非法返回 null
function thicknessToDia(thicknessMm) {
  const t = Number(thicknessMm)
  if (!Number.isFinite(t) || t <= 0) return null
  if (t <= 2) return 2.0
  if (t <= 3) return 2.5
  if (t <= 6) return 3.2
  if (t <= 12) return 4.0
  return 5.0
}

// 区间文本：一步四舍五入到整数
function ampRangeText(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return `${Math.round(min)}~${Math.round(max)}A`
}
// PURE-LOGIC-END

// ---------- 静态数据 ----------
const DIAMETERS = [2.0, 2.5, 3.2, 4.0, 5.0, 6.0]
const POSITIONS = [
  { id: 'flat', label: '平焊', factor: 1.0 },
  { id: 'horizontal', label: '横焊', factor: 0.9 },
  { id: 'vertical', label: '立焊', factor: 0.85 },
  { id: 'overhead', label: '仰焊', factor: 0.8 }
]
const THICKNESSES = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20]

const DIA_TABLE = [
  { label: 'δ ≤ 2', dia: 2.0 },
  { label: 'δ ≈ 3', dia: 2.5 },
  { label: 'δ 4 ~ 6', dia: 3.2 },
  { label: 'δ 8 ~ 12', dia: 4.0 },
  { label: 'δ > 12', dia: 5.0 }
].map((row) => {
  const r = recommendCurrent(row.dia, 1.0)
  return { ...row, flatRange: r ? ampRangeText(r.min, r.max) : '—' }
})

const ELECTRODES = [
  {
    grade: 'J422', model: 'E4303', coating: '钛钙型（酸性）', power: '交流 / 直流均可',
    strength: '≥430 MPa', drying: '受潮时 75~150℃ × 1h'
  },
  {
    grade: 'J502', model: 'E5003', coating: '钛钙型（酸性）', power: '交流 / 直流均可',
    strength: '≥490 MPa', drying: '受潮时 75~150℃ × 1h'
  },
  {
    grade: 'J507', model: 'E5015', coating: '低氢钠型（碱性）', power: '直流反接（焊条接正）',
    strength: '≥490 MPa', drying: '350~400℃ × 1~2h，保温随用随取'
  }
]

const FAQS = [
  {
    q: '为什么立焊仰焊要减电流？',
    a: '立焊、仰焊时熔池受重力作用铁水容易下淌，电流偏大熔池更大更稀、更难控制，所以要折减（常用立焊 ×0.85、仰焊 ×0.80），并配合短弧、窄运条与正确的焊条角度；横焊介于两者之间（×0.90）。'
  },
  {
    q: 'J507 为什么必须直流反接？',
    a: 'J507（E5015）是低氢钠型碱性焊条，药皮含较多萤石等稳弧差成分，交流下电弧不稳甚至无法燃烧；直流反接（焊条接正极）电弧稳定、熔滴过渡平稳，且「直流反接」时电弧阳极热量在焊件侧相对较低、氢向焊条侧聚集少，利于低氢。低氢钾型的 J506（E5016）加了稳弧剂才实现交直流两用。'
  },
  {
    q: '焊条烘干温度和时间怎么记？',
    a: '钛钙型酸性焊条（J422/J502）对受潮敏感度低，一般 75~150℃ 烘 1h；低氢碱性焊条（J507/J506）必须 350~400℃ 烘 1~2h 并放入保温筒随用随取，重复烘干不宜超过 2 次——烘不够氢超标易生裂纹气孔，具体按厂家说明书执行。'
  },
  {
    q: '板厚和焊条直径怎么匹配？',
    a: '经验对照：δ≤2 用 2.0，δ3 用 2.5，δ4~6 用 3.2，δ8~12 用 4.0，δ>12 用 5.0（可多层多道）。原则是焊条直径不超过板厚太多，否则两侧未熔透；厚板多层焊时打底选细一档（如 3.2）保证根部熔合，填充盖面再上大直径提效率。'
  },
  {
    q: '公式算出的电流可以直接写进工艺卡吗？',
    a: '本工具给出的是经验起步区间，用于选条、试焊与快速核查。正式工艺卡（WPS）参数必须通过焊接工艺评定试验确定，还要结合钢材牌号、坡口形式、层间温度与预热要求；重要结构与压力容器施焊按现行标准与评定文件执行。'
  }
]

// ---------- 响应式参数 ----------
const dia = ref(3.2)
const position = ref('flat')
const thickness = ref(null)

const activePosition = computed(() => POSITIONS.find((p) => p.id === position.value) || POSITIONS[0])

const thicknessDia = computed(() => {
  if (thickness.value === null || thickness.value === '' || !Number.isFinite(Number(thickness.value))) return null
  return thicknessToDia(Number(thickness.value))
})

const thicknessLabel = computed(() => {
  const t = Number(thickness.value)
  if (!Number.isFinite(t)) return ''
  return t <= 3 ? ` ${t} ` : ` ${t} `
})

const result = computed(() => {
  const r = recommendCurrent(dia.value, activePosition.value.factor)
  if (!r) return null
  return {
    min: Math.round(r.min),
    max: Math.round(r.max),
    minText: Math.round(r.min).toString(),
    maxText: Math.round(r.max).toString(),
    midText: Math.round(r.mid).toString()
  }
})

// ---------- 交互动作 ----------
async function copyResult() {
  const r = result.value
  if (!r) return
  const lines = [
    `焊接参数参考（手工电弧焊经验式）`,
    `焊条：${dia.value.toFixed(1)}mm · ${activePosition.value.label}（位置系数 ×${activePosition.value.factor.toFixed(2)}）`,
    `推荐电流：${r.minText} ~ ${r.maxText} A（中值 ${r.midText} A）`,
    thicknessDia.value !== null ? `母材 δ${Number(thickness.value)}mm 推荐焊条：${thicknessDia.value.toFixed(1)}mm` : '',
    '提示：以焊接工艺评定（WPS）与厂家说明为准，现场按熔池状态微调 5~15A'
  ].filter(Boolean)
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('已复制')
  } catch {
    alert('复制失败，请手动选择文本复制')
  }
}

onMounted(() => {
  addRecentTool('welding-amperage-calculator')
})
</script>
