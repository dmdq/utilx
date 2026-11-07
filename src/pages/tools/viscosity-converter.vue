<template>
  <div class="max-w-8xl mx-auto px-4">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplets class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">粘度换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">运动粘度 cSt ↔ 恩氏 °E ↔ 赛氏 SUS ↔ 雷氏 Rs 互算，ISO VG 润滑油牌号对照与动力粘度换算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线粘度单位换算工具：以运动粘度 cSt（mm²/s）为中转枢纽，按 ASTM D2161 口径换算赛氏通用秒 SUS（≤100s 用 0.226S−195/S、&gt;100s 用 0.220S−135/S），
        按 GB/T 266 恩氏粘度口径换算条件度 °E（7.31°E−6.31/°E，°E&gt;3 适用），雷氏一号秒按通行经验式 0.26R−179/R 近似换算（已趋淘汰，以实测为准）；
        附 ISO 3448 润滑油 VG 牌号对照（40℃ 中值 ±10% 带）、动力粘度 η=ν×ρ 换算与常见油品示例。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6 text-sm text-foreground leading-relaxed">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <span>换算前提是「同一温度」：运动粘度随温度剧烈变化（油品约每升温 10℃ 粘度减半量级），ISO VG 牌号固定按 40℃ 口径，SUS 传统按 100℉（37.8℃）报告——跨温度对照仅作选油参考。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <SlidersHorizontal class="w-5 h-5 mr-2 text-primary" /> ① 输入基准
          </h2>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="u in UNITS"
              :key="u.id"
              @click="baseUnit = u.id"
              class="px-1 py-2 rounded-lg text-xs font-medium border transition"
              :class="baseUnit === u.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted'"
            >{{ u.short }}</button>
          </div>
          <label class="text-sm text-muted-foreground block mt-3">
            {{ baseUnitLabel }}（数值需大于 0）
            <input
              v-model.number="baseValue"
              type="number" min="0" step="0.1" :placeholder="basePlaceholder"
              class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <p v-if="baseWarn" class="mt-2 text-xs flex items-start gap-1.5 p-2 rounded bg-amber-500/10 text-foreground">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>{{ baseWarn }}</span>
          </p>
          <p v-else-if="cst !== null" class="mt-2 text-xs flex items-start gap-1.5 p-2 rounded bg-muted/60 text-foreground">
            <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>中转值：运动粘度 ν = {{ fmt2(cst) }} cSt（{{ unitInBand }}）</span>
          </p>
        </div>

        <hr class="border-border" />

        <!-- 动力粘度 -->
        <div>
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <FlaskConical class="w-5 h-5 mr-2 text-primary" /> ② 动力粘度换算（可选）
          </h2>
          <label class="text-sm text-muted-foreground block">
            油品密度 ρ（g/cm³，40℃）
            <input
              v-model.number="density"
              type="number" min="0" step="0.005" placeholder="如 0.87"
              class="mt-1 w-full border border-border bg-background rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <p class="mt-2 text-sm text-foreground tabular-nums">
            η = ν×ρ = {{ cst === null ? '—' : fmt2(cst) }}×{{ fmt2(num(density)) }} =
            <b class="text-primary">{{ dynVisc === null ? '—' : fmt2(dynVisc) }} mPa·s</b>
            <span class="text-xs text-muted-foreground">（={{ dynVisc === null ? '—' : fmt2(dynVisc) }} cP；1 cSt×1 g/cm³ = 1 mPa·s）</span>
          </p>
        </div>
      </div>

      <!-- 右侧：结果 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 四单位并列 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle v-if="cst !== null" class="w-5 h-5 mr-2 text-green-500" />
            <TriangleAlert v-else class="w-5 h-5 mr-2 text-amber-500" />
            四单位换算结果
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="bg-primary/10 rounded-xl p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">运动粘度 ν</p>
              <p class="text-2xl font-bold text-primary tabular-nums">{{ cst === null ? '—' : fmt2(cst) }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">cSt（mm²/s）</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">恩氏粘度</p>
              <p class="text-2xl font-bold text-foreground tabular-nums">{{ eng === null ? '—' : fmt2(eng) }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">°E（条件度）</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">赛氏通用</p>
              <p class="text-2xl font-bold text-foreground tabular-nums">{{ sus === null ? '—' : fmt1(sus) }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">SUS / SSU（s）</p>
            </div>
            <div class="bg-muted/50 rounded-xl p-4 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">雷氏一号</p>
              <p class="text-2xl font-bold text-foreground tabular-nums">{{ red === null ? '—' : fmt1(red) }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">Rs（s）</p>
            </div>
          </div>
          <p v-if="cst !== null" class="text-xs text-muted-foreground mt-3 flex items-start gap-1.5 p-2.5 rounded bg-muted/60">
            <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>{{ rangeNote }}</span>
          </p>
          <p v-else class="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl">在左侧选择单位并输入大于 0 的数值。</p>
        </div>

        <!-- ISO VG 对照 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-3">
            <Gauge class="w-5 h-5 mr-2 text-primary" /> ISO VG 润滑油牌号对照（ISO 3448：40℃ 运动粘度中值 ±10%）
          </h2>
          <div v-if="vgMatch" class="bg-primary/10 rounded-lg p-4 mb-3 text-sm text-foreground">
            当前 ν = {{ fmt2(cst) }} cSt →
            <b class="text-primary">{{ vgMatch.grade }}</b>
            {{ vgMatch.inBand ? '（落在 ±10% 粘度带内）' : `（不在任何牌号带内，最接近 ${vgMatch.grade} 中值 ${vgMatch.mid}）` }}
          </div>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted/60 text-muted-foreground text-xs">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">牌号</th>
                  <th class="px-3 py-2 text-right font-medium">40℃ 中值 cSt</th>
                  <th class="px-3 py-2 text-center font-medium">粘度带 ±10%</th>
                  <th class="px-3 py-2 text-left font-medium">常见油品示例</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in vgRows"
                  :key="row.grade"
                  class="border-t border-border tabular-nums"
                  :class="vgMatch && row.grade === vgMatch.grade ? 'bg-primary/5' : ''"
                >
                  <td class="px-3 py-2 font-medium text-foreground">VG {{ row.grade }}</td>
                  <td class="px-3 py-2 text-right text-foreground">{{ row.mid }}</td>
                  <td class="px-3 py-2 text-center text-muted-foreground">{{ row.lo }} – {{ row.hi }}</td>
                  <td class="px-3 py-2 text-left text-xs text-muted-foreground">{{ row.note }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground mt-2">ISO 3448 将工业润滑油按 40℃ 运动粘度分 20 个等级（VG2–VG3200），常用 10–460 十一档；牌号数字即 40℃ 中值 cSt。</p>
        </div>
      </div>
    </div>

    <!-- 可折叠 SEO 内容区 -->
    <details open class="bg-card border border-border rounded-lg mb-8">
      <summary class="px-6 py-4 cursor-pointer select-none text-xl font-bold text-foreground flex items-center justify-between">
        <span><span class="text-primary mr-2">#</span>粘度单位、换算公式与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground" />
      </summary>
      <div class="px-6 pb-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
        <h3 class="text-lg font-semibold text-foreground">动力粘度 vs 运动粘度：差一个密度</h3>
        <p>
          动力粘度 η（绝对粘度）描述流体抵抗剪切的能力，单位 Pa·s 或 mPa·s（旧称 cP，1 mPa·s = 1 cP）；运动粘度 ν 是动力粘度与同温度密度之比：ν = η/ρ，单位 mm²/s（cSt）。润滑油行业惯用运动粘度，因为毛细管粘度计（平氏、乌氏）直接量出的是运动粘度；而泵与轴承的油膜计算、齿轮传动功率损耗用的是动力粘度。两者换算只需乘 / 除密度：32 cSt、0.87 g/cm³ 的液压油，动力粘度 = 32×0.87 = 27.84 mPa·s。注意密度随温度变化，跨温度换算要取同温度下的 ρ。
        </p>

        <h3 class="text-lg font-semibold text-foreground">换算公式与适用范围</h3>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><b class="text-foreground">赛氏通用秒 SUS（ASTM D2161 口径）</b>：cSt = 0.226×SUS − 195/SUS（SUS ≤ 100）；cSt = 0.220×SUS − 135/SUS（SUS &gt; 100）。两式在 SUS=100 处衔接（均得 20.65 cSt）。逆向换算解二次方程 a·S² − ν·S − b = 0 取正根。</li>
          <li><b class="text-foreground">恩氏粘度 °E（GB/T 266 口径）</b>：cSt = 7.31×°E − 6.31/°E，°E &gt; 3（约 20 cSt 以上）时较准；°E 是「油流出 200mL 时间 ÷ 蒸馏水水值」的条件度，无量纲，低恩氏段误差大、建议直接查 GB/T 265 附录换算表。</li>
          <li><b class="text-foreground">雷氏一号秒 Rs（英国体系）</b>：cSt ≈ 0.26×Rs − 179/Rs（通行经验式，中等粘度几十到几百 cSt 段适用；Rs &gt; 2000s 应改雷氏二号，其读数 ≈ Rs/10）。雷氏粘度计已逐步被运动粘度取代，本换算仅供读旧资料用，以实测为准。</li>
          <li><b class="text-foreground">°E ↔ SUS 互转</b>：两者都无直接解析关系，一律经 cSt 中转（°E→cSt→SUS 或反向），本工具即按此实现。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground">VG 牌号是什么意思？</h3>
        <p>
          ISO 3448 把工业润滑油按 40℃ 运动粘度分成 20 个等级，牌号数字就是 40℃ 粘度中值（cSt），实际油品允许落在中值 ±10% 的粘度带内：VG32 即 40℃ 粘度 28.8–35.2 cSt 的油。相邻常用档约 1.5 倍步进（10/15/22/32/46/68/100/150/220/320/460/680）。选油口诀：液压系统常用 VG32/VG46（压力高或环境热用 46），主轴与精密锭子用 VG10/15 以下，齿轮箱按负荷与温度用 VG150–460，寒区户外设备选低牌号或 HV 低温液压油。同一设备冬夏换油季，本质就是在同一质量等级里按温度挑粘度带。
        </p>

        <h3 class="text-lg font-semibold text-foreground">为什么换算必须同温度？</h3>
        <p>
          粘度对温度极其敏感——矿物油温度每升 10℃ 运动粘度约降到一半量级（具体由粘度指数 VI 决定）。30 cSt@40℃ 的油到 100℃ 可能只剩 5 cSt 左右。所以「SUS 150」这类老数据必须知道是哪个温度测的（赛氏传统按 100℉ 报告）才能与 40℃ 的 VG 表对照；不同温度之间要靠油的粘温曲线（Walther 双对数图 / 粘度指数）推算，而不是套用同温换算式。本工具所有换算都假定四个单位描述同一温度下的同一种油。
        </p>

        <h3 class="text-lg font-semibold text-foreground">相关工具</h3>
        <p>
          其他物理量的单位换算见 <NuxtLink to="/tools/unit-converter" class="text-primary hover:underline">万能单位换算器</NuxtLink>；机油与燃油的选型换算还可以配合站内计算工具箱中的工程类工具使用。
        </p>

        <h3 class="text-lg font-semibold text-foreground">常见问题 (FAQ)</h3>
        <ul class="list-disc pl-5 space-y-2">
          <li><b class="text-foreground">32 cSt 等于多少 SUS？</b>解 0.220×S−135/S=32 得 S≈149.6，即约 150 SUS（常用速记：1 cSt ≈ 4.6 SUS，中高粘度段成立）。</li>
          <li><b class="text-foreground">°E=5 是多少 cSt？</b>7.31×5 − 6.31/5 = 35.29 cSt，落在 ISO VG46 牌号带（41.4–50.6）之外、接近 VG32 与 VG46 之间——恩氏粘度多用于燃料油与沥青类产品，润滑油很少用。</li>
          <li><b class="text-foreground">VG32 与 32 cSt 一回事吗？</b>不完全是：VG32 是「40℃ 粘度落在 28.8–35.2 cSt 带内」的一类油，32 cSt 是一个精确点位；只有油品粘度恰好等于中值时才相等。</li>
          <li><b class="text-foreground">cP 和 mPa·s 什么关系？</b>1 cP = 1 mPa·s，水 20℃ 约 1 cP；cSt 与 cP 差一个密度（ρ in g/cm³），矿物油 40℃ 密度约 0.85–0.90，所以 32 cSt ≈ 28 mPa·s 量级。</li>
          <li><b class="text-foreground">数据会上传吗？</b>不会。全部换算在浏览器本地完成，刷新即清空。</li>
        </ul>

        <p class="text-xs pt-3 border-t border-border/50">
          来源与口径注记：SUS 换算两式自 ASTM D2161（Standard Practice for Converting Kinematic Viscosity to Saybolt Universal Viscosity）通行口径；恩氏 7.31°E−6.31/°E 自 GB/T 266《石油产品恩氏粘度测定法》体系与 GB/T 265 附录换算表口径；雷氏 0.26R−179/R 自国内润滑油手册通行经验式（英国 BS 体系，已趋淘汰，注明适用范围）；ISO VG 牌号与 ±10% 带自 ISO 3448。以现行标准与油品实测数据为准。
        </p>
      </div>
    </details>

    <RelatedTools :currentToolId="'viscosity-converter'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Droplets, Info, CheckCircle, TriangleAlert, SlidersHorizontal, FlaskConical, Gauge, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '粘度换算器 - cSt/恩氏°E/赛氏SUS/雷氏秒互算与ISO VG对照在线工具',
  description: '免费在线粘度单位换算：运动粘度 cSt ↔ 恩氏粘度 °E（GB/T 266 口径）↔ 赛氏通用秒 SUS（ASTM D2161）↔ 雷氏一号秒 Rs，附 ISO 3448 润滑油 VG 牌号对照（40℃ ±10% 带）、动力粘度 η=ν×ρ 换算与适用范围提示，纯浏览器本地运行。',
  keywords: '粘度换算,恩氏粘度换算,cSt换算SUS,赛氏粘度,雷氏粘度,运动粘度单位,ISO VG对照,润滑油牌号',
  author: '有条工具',
  ogTitle: '粘度换算器 - cSt/°E/SUS/Rs 互算与 ISO VG 对照 | 有条工具',
  ogDescription: '四单位互算 + ISO VG 牌号带对照 + 动力粘度换算，注明适用范围与同温口径。',
  ogUrl: 'https://www.util.cn/tools/viscosity-converter',
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
          name: '粘度换算器',
          url: 'https://www.util.cn/tools/viscosity-converter',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['cSt ↔ °E ↔ SUS ↔ 雷氏秒四单位互算', 'ASTM D2161 赛氏分段公式', 'GB/T 266 恩氏口径与适用范围提示', 'ISO 3448 VG 牌号 ±10% 带对照', '动力粘度 η=ν×ρ 换算', '常见油品示例速查', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '粘度换算器', item: 'https://www.util.cn/tools/viscosity-converter' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '32 cSt 等于多少 SUS？',
              acceptedAnswer: { '@type': 'Answer', text: '解 0.220×S−135/S=32 的二次方程得 S≈149.6，即 32 cSt ≈ 150 SUS。中高粘度段可按 1 cSt ≈ 4.6 SUS 速记。' }
            },
            {
              '@type': 'Question',
              name: '°E=5 的恩氏粘度是多少 cSt？',
              acceptedAnswer: { '@type': 'Answer', text: '按 GB/T 266 口径 cSt=7.31×°E−6.31/°E，°E=5 时 cSt=36.55−1.262=35.29，恩氏式在 °E>3 段较准，低恩氏段建议查表。' }
            },
            {
              '@type': 'Question',
              name: '动力粘度和运动粘度怎么换？',
              acceptedAnswer: { '@type': 'Answer', text: '运动粘度 ν=η/ρ，动力粘度 η=ν×ρ。32 cSt、密度 0.87 g/cm³ 的油动力粘度为 27.84 mPa·s（=27.84 cP），1 cSt×1 g/cm³=1 mPa·s。' }
            },
            {
              '@type': 'Question',
              name: 'VG32 是什么意思？',
              acceptedAnswer: { '@type': 'Answer', text: 'ISO 3448 润滑油粘度等级：数字为 40℃ 运动粘度中值（cSt），允许 ±10% 带，VG32 即 40℃ 粘度 28.8–35.2 cSt 的油品，常用作通用液压油。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
function num(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}
function fmt1(v) { return Number.isFinite(v) ? v.toFixed(1) : '—' }
function fmt2(v) { return Number.isFinite(v) ? v.toFixed(2) : '—' }

// —— SUS（赛氏通用秒）↔ cSt，ASTM D2161 通行口径，分段点 SUS=100 ——
// SUS ≤ 100：cSt = 0.226×SUS − 195/SUS；SUS > 100：cSt = 0.220×SUS − 135/SUS
function susToCst(sus) {
  const s = num(sus)
  if (!s) return null
  const cst = s <= 100 ? (0.226 * s - 195 / s) : (0.220 * s - 135 / s)
  return cst > 0 ? cst : null
}
// cSt → SUS：解 a·S² − ν·S − b = 0 取正根；按解出的 S 落在哪段选系数（两式在 S=100 处衔接）
function cstToSus(cst) {
  const v = num(cst)
  if (!v) return null
  const sHi = solveQuadPositive(0.220, -v, -135) // 假设 SUS>100
  if (sHi !== null && sHi > 100) return sHi
  const sLo = solveQuadPositive(0.226, -v, -195) // 假设 SUS≤100
  if (sLo !== null && sLo <= 100) return sLo
  return sHi !== null ? sHi : sLo // 衔接带内取任一
}
// 解 a·x² + b·x + c = 0 的正根（a≠0，判别式 ≥0）
function solveQuadPositive(a, b, c) {
  if (!a) return null
  const disc = b * b - 4 * a * c
  if (disc < 0) return null
  const root = (-b + Math.sqrt(disc)) / (2 * a)
  return root > 0 ? root : null
}

// —— 恩氏 °E ↔ cSt（GB/T 266 口径，°E>3 较准）——
function engToCst(e) {
  const en = num(e)
  if (!en) return null
  const cst = 7.31 * en - 6.31 / en
  return cst > 0 ? cst : null
}
function cstToEng(cst) {
  const v = num(cst)
  if (!v) return null
  // 7.31E² − νE − 6.31 = 0 取正根
  return solveQuadPositive(7.31, -v, -6.31)
}

// —— 雷氏一号 Rs ↔ cSt（通行经验式 cSt ≈ 0.26R − 179/R，中等粘度段适用）——
function redToCst(r) {
  const rs = num(r)
  if (!rs) return null
  const cst = 0.26 * rs - 179 / rs
  return cst > 0 ? cst : null
}
function cstToRed(cst) {
  const v = num(cst)
  if (!v) return null
  return solveQuadPositive(0.26, -v, -179)
}

// —— 动力粘度：η(mPa·s) = ν(cSt) × ρ(g/cm³) ——
function dynamicViscosity(cst, rho) {
  const v = num(cst), r = num(rho)
  if (!v || !r) return null
  return v * r
}

// —— ISO 3448 VG 牌号（40℃ 中值 ±10% 带）——
const ISO_VG = [
  { grade: 10, mid: 10, note: '锭子油 / 高速主轴油、缝纫机油' },
  { grade: 15, mid: 15, note: '主轴油、低温液压油基础' },
  { grade: 22, mid: 22, note: '轻载液压油、精密机床' },
  { grade: 32, mid: 32, note: '通用液压油（最常用）、导轨油' },
  { grade: 46, mid: 46, note: '液压油（高温/高压工况）、空压机油' },
  { grade: 68, mid: 68, note: '重载液压、轻载工业齿轮油' },
  { grade: 100, mid: 100, note: '中负荷齿轮油、链条油' },
  { grade: 150, mid: 150, note: '工业齿轮油、蜗杆油（轻）' },
  { grade: 220, mid: 220, note: '中重负荷工业齿轮油' },
  { grade: 320, mid: 320, note: '重负荷齿轮油、蜗轮蜗杆油' },
  { grade: 460, mid: 460, note: '重载齿轮 / 开式齿轮、高温链油' }
]
function vgMatchOf(cst) {
  const v = num(cst)
  if (!v) return null
  const inBand = ISO_VG.find((g) => v >= g.mid * 0.9 && v <= g.mid * 1.1)
  if (inBand) return { grade: `VG${inBand.grade}`, mid: inBand.mid, inBand: true }
  let best = ISO_VG[0]
  let bestDist = Infinity
  for (const g of ISO_VG) {
    const d = Math.abs(Math.log(v / g.mid))
    if (d < bestDist) { best = g; bestDist = d }
  }
  return { grade: `VG${best.grade}`, mid: best.mid, inBand: false }
}

// ---------- 页面状态 ----------
const baseUnit = ref('cst') // cst | eng | sus | red
const baseValue = ref(32)
const density = ref(0.87)

const UNITS = [
  { id: 'cst', short: 'cSt', label: '运动粘度 ν（cSt，mm²/s）', placeholder: '如 32', warn: '' },
  { id: 'eng', short: '°E', label: '恩氏粘度（°E，条件度）', placeholder: '如 5', warn: '' },
  { id: 'sus', short: 'SUS', label: '赛氏通用秒（SUS / SSU，s）', placeholder: '如 150', warn: '' },
  { id: 'red', short: 'Rs', label: '雷氏一号秒（Rs，s）', placeholder: '如 130', warn: '' }
]

// ---------- 派生计算 ----------
const baseUnitMeta = computed(() => UNITS.find((u) => u.id === baseUnit.value) || UNITS[0])
const baseUnitLabel = computed(() => baseUnitMeta.value.label)
const basePlaceholder = computed(() => baseUnitMeta.value.placeholder)

const cst = computed(() => {
  const v = num(baseValue.value)
  if (!v) return null
  if (baseUnit.value === 'cst') return v
  if (baseUnit.value === 'eng') return engToCst(v)
  if (baseUnit.value === 'sus') return susToCst(v)
  return redToCst(v)
})
const eng = computed(() => (cst.value === null ? null : (baseUnit.value === 'eng' ? num(baseValue.value) : cstToEng(cst.value))))
const sus = computed(() => (cst.value === null ? null : (baseUnit.value === 'sus' ? num(baseValue.value) : cstToSus(cst.value))))
const red = computed(() => (cst.value === null ? null : (baseUnit.value === 'red' ? num(baseValue.value) : cstToRed(cst.value))))

const dynVisc = computed(() => dynamicViscosity(cst.value, density.value))

const baseWarn = computed(() => {
  const v = num(baseValue.value)
  if (!v) return ''
  if (baseUnit.value === 'eng') {
    if (v <= 3) return `°E=${fmt2(v)} 低于恩氏式适用下限（°E>3），低恩氏段 7.31°E−6.31/°E 误差大，请查 GB/T 265 附录换算表。`
    if (v > 60) return '°E 超出 60（约 440 cSt 以上），建议直接以运动粘度 cSt 为基准输入。'
  }
  if (baseUnit.value === 'sus' && v < 30) return 'SUS 低于 30s 时动能修正项占比大，赛氏公式误差明显，建议以 cSt 为基准。'
  if (baseUnit.value === 'red') {
    if (v < 30) return '雷氏一号低于 30s 时公式不适用（雷氏计本就只用于 30s 以上）。'
    if (v > 2000) return 'Rs 超过 2000s 应改用雷氏二号（读数约为雷氏一号的 1/10），换算误差增大。'
  }
  return ''
})

const unitInBand = computed(() => {
  const m = vgMatchOf(cst.value)
  if (!m) return ''
  return m.inBand ? `落在 ${m.grade} 粘度带内` : `接近 ${m.grade}`
})
const vgMatch = computed(() => vgMatchOf(cst.value))

const vgRows = computed(() =>
  ISO_VG.map((g) => ({ ...g, lo: fmt1(g.mid * 0.9), hi: fmt1(g.mid * 1.1) }))
)

const rangeNote = computed(() => {
  const v = cst.value
  if (v === null) return ''
  const parts = []
  if (v < 1.5) parts.push('低于 1.5 cSt 时各经验式误差显著，仅作量级参考')
  if (baseUnit.value === 'red') parts.push('雷氏换算为通行经验式（英国体系已趋淘汰），以实测为准')
  if (baseUnit.value === 'eng' && num(baseValue.value) <= 3) parts.push('恩氏式 °E>3 段才较准，当前取值偏低温低粘区')
  parts.push('所有换算按「同一温度」口径；跨温度对照需按粘温曲线另行推算')
  return parts.join('；') + '。'
})

onMounted(() => {
  addRecentTool('viscosity-converter')
})
</script>
