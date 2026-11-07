<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Droplet class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">血型遗传计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">父母 ABO + Rh 血型 → 孩子可能 / 不可能血型与概率，Punnett 方格可视化，孟买血型提示</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线血型遗传计算器：选择父母 ABO 血型（A / B / AB / O）与 Rh 因子（+ / −），按 ABO 三等位基因遗传规律
        （A=AA/AO、B=BB/BO、AB=AB、O=OO）枚举全部基因型组合，输出孩子<b>可能血型、不可能血型与各血型概率</b>，
        附 Punnett 方格可视化、「若 A 型为 AA / AO」基因型分支表与 Rh 因子遗传说明（Rh+ × Rh− 可出 Rh− 的条件）。
        血型遗传只能<b>排除</b>亲子关系、不能确认亲子关系；极罕见的孟买血型（hh）会让常规 ABO 推断失效。
        全部计算在浏览器本地完成，不构成医学或司法意见。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Droplet class="w-5 h-5 mr-2 text-primary" /> 父母血型
        </h2>

        <!-- 父亲 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">父亲</p>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="bti-f-abo" class="text-xs text-muted-foreground mb-1 block">ABO 血型</label>
              <select
                id="bti-f-abo"
                v-model="fatherAbo"
                class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="p in PHENOTYPES" :key="p" :value="p">{{ p }} 型</option>
              </select>
            </div>
            <div>
              <label for="bti-f-rh" class="text-xs text-muted-foreground mb-1 block">Rh 因子</label>
              <select
                id="bti-f-rh"
                v-model="fatherRh"
                class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="+">Rh+（阳性）</option>
                <option value="-">Rh−（阴性，熊猫血）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 母亲 -->
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">母亲</p>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="bti-m-abo" class="text-xs text-muted-foreground mb-1 block">ABO 血型</label>
              <select
                id="bti-m-abo"
                v-model="motherAbo"
                class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option v-for="p in PHENOTYPES" :key="p" :value="p">{{ p }} 型</option>
              </select>
            </div>
            <div>
              <label for="bti-m-rh" class="text-xs text-muted-foreground mb-1 block">Rh 因子</label>
              <select
                id="bti-m-rh"
                v-model="motherRh"
                class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="+">Rh+（阳性）</option>
                <option value="-">Rh−（阴性，熊猫血）</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-3 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition"
          >
            载入示例
          </button>
          <button
            @click="resetAll"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1 -mt-0.5" /> 重置
          </button>
        </div>

        <!-- 基因型提示 -->
        <div class="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed space-y-1">
          <p><b class="text-foreground">基因型枚举</b>：A 型 = AA 或 AO、B 型 = BB 或 BO、AB 型 = AB、O 型 = OO。</p>
          <p>本页概率默认按「显性表型为杂合子」假设（A→AO、B→BO）；若为纯合子，见右侧分支表逐一展开。</p>
        </div>
      </div>

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 孩子血型推断
          </h2>
          <button
            @click="copyResult"
            class="text-xs px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition"
          >
            <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制结果
          </button>
        </div>

        <!-- 可能 / 不可能 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <p class="text-xs text-muted-foreground mb-2">孩子可能出现的血型（全部基因型组合的并集）</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="p in possibleList"
                :key="p"
                class="px-3 py-1.5 rounded-full text-sm font-bold bg-green-500/15 text-green-600"
              >{{ p }} 型</span>
            </div>
          </div>
          <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p class="text-xs text-muted-foreground mb-2">不可能出现的血型</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="p in impossibleList"
                :key="p"
                class="px-3 py-1.5 rounded-full text-sm font-bold bg-red-500/10 text-red-500 line-through decoration-2"
              >{{ p }} 型</span>
              <span v-if="impossibleList.length === 0" class="text-sm text-muted-foreground">四种血型都有可能（如 A 型 × B 型）</span>
            </div>
          </div>
        </div>

        <!-- 默认假设概率表 -->
        <div class="bg-muted/50 rounded-xl p-4">
          <p class="text-sm font-semibold text-foreground mb-1">各血型概率（默认假设：{{ fatherAbo }} 型按 {{ defaultGeno(fatherAbo) }}、{{ motherAbo }} 型按 {{ defaultGeno(motherAbo) }}）</p>
          <p class="text-[11px] text-muted-foreground mb-3">概率只描述「基因型未知时的可能性」，不是孩子确定的结果；显性表型为纯合子时分布会不同，见下方分支表。</p>
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="p in PHENOTYPES"
              :key="p"
              class="rounded-lg border p-3 text-center"
              :class="defaultDist[p] > 0 ? 'border-primary/30 bg-primary/10' : 'border-border bg-background opacity-50'"
            >
              <p class="text-xs text-muted-foreground">{{ p }} 型</p>
              <p class="text-xl font-bold" :class="defaultDist[p] > 0 ? 'text-primary' : 'text-muted-foreground'">{{ Math.round(defaultDist[p] * 100) }}%</p>
            </div>
          </div>
        </div>

        <!-- Punnett 方格 SVG + Rh 卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-semibold text-foreground mb-2">Punnett 方格（{{ defaultGeno(fatherAbo) }} × {{ defaultGeno(motherAbo) }}）</p>
            <svg viewBox="0 0 320 320" class="w-full max-w-[320px]" role="img" :aria-label="`Punnett 方格：${defaultGeno(fatherAbo)} 与 ${defaultGeno(motherAbo)} 的基因型组合`">
              <rect x="0" y="0" width="320" height="320" rx="12" class="fill-muted/30" />
              <text x="60" y="30" text-anchor="middle" class="fill-muted-foreground" font-size="13">父 ↘ 母</text>
              <text v-for="(g, i) in punnett.gametes2" :key="'h' + i" :x="160 + i * 100" y="30" text-anchor="middle" class="fill-foreground" font-size="15" font-weight="bold">{{ g }}</text>
              <text v-for="(g, i) in punnett.gametes1" :key="'v' + i" x="60" :y="95 + i * 100" text-anchor="middle" class="fill-foreground" font-size="15" font-weight="bold">{{ g }}</text>
              <g v-for="(cell, i) in punnett.cells" :key="'c' + i">
                <rect
                  :x="110 + (i % 2) * 100"
                  :y="60 + Math.floor(i / 2) * 100"
                  width="90"
                  height="90"
                  rx="10"
                  :class="phenotypeOf(cell.gt) === 'O' ? 'fill-background stroke-border' : 'fill-primary/10 stroke-primary/30'"
                  stroke-width="1.5"
                />
                <text :x="155 + (i % 2) * 100" :y="100 + Math.floor(i / 2) * 100" text-anchor="middle" class="fill-foreground" font-size="17" font-weight="bold">{{ cell.gt }}</text>
                <text :x="155 + (i % 2) * 100" :y="126 + Math.floor(i / 2) * 100" text-anchor="middle" class="fill-primary" font-size="13">{{ phenotypeOf(cell.gt) }} 型</text>
              </g>
            </svg>
            <p class="text-[11px] text-muted-foreground leading-relaxed mt-1">
              方格按默认假设基因型绘制：行 = 父方配子、列 = 母方配子（A 型方格假设 AO，若为 AA 见分支表）。
            </p>
          </div>

          <div class="space-y-3">
            <!-- Rh 因子卡 -->
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-semibold text-foreground mb-1">Rh 因子遗传</p>
              <p class="text-2xl font-bold text-primary mb-1">Rh− 可能性 {{ rhDist.minus }}%</p>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ rhDist.note }}</p>
              <p class="text-[11px] text-muted-foreground leading-relaxed mt-2">
                中国汉族人群 Rh− 约占 0.2%~0.5%（俗称「熊猫血」）；Rh− 孕妇怀 Rh+ 胎儿时需关注新生儿溶血风险，产检时告知医生血型史。
              </p>
            </div>
            <!-- 分支表 -->
            <div class="bg-muted/50 rounded-xl p-4">
              <p class="text-sm font-semibold text-foreground mb-2">基因型分支表（若 {{ fatherAbo }} 型为 {{ possibleGeno(fatherAbo).join(' / ') }}、{{ motherAbo }} 型为 {{ possibleGeno(motherAbo).join(' / ') }}）</p>
              <div class="space-y-1.5">
                <div
                  v-for="(row, i) in branchRows"
                  :key="i"
                  class="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs"
                  :class="row.isDefault ? 'bg-primary/10 border border-primary/30' : 'bg-background border border-border'"
                >
                  <span class="font-mono text-foreground">{{ row.g1 }} × {{ row.g2 }}</span>
                  <span class="text-muted-foreground">{{ row.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 特殊提示卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="border border-amber-500/20 bg-amber-500/10 rounded-xl p-4 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-semibold text-foreground">孟买血型（hh）：常规推断会失效</p>
              <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                极罕见的孟买血型缺乏合成 A / B 抗原所需的 H 抗原（基因型 hh），即使携带 A 或 B 基因，常规血清学检测也表现为「O 型」，
                并可遗传出「父母与孩子血型不符合上表」的组合。有孟买血型家族史或检测结果异常时，需做基因分型确认。
              </p>
            </div>
          </div>
          <div class="border border-border bg-muted/30 rounded-xl p-4 flex items-start gap-2">
            <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-semibold text-foreground">血型不能确认亲子关系</p>
              <p class="text-xs text-muted-foreground leading-relaxed mt-1">
                ABO 血型在人群中的多态性有限：符合本页表格只能说明「不排除」，不符合可以「排除」。
                确认亲子关系需要 DNA 亲子鉴定（司法鉴定需到有资质的机构），血型对照绝不能作为确认依据。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 科普免责声明（页面固定） -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 flex items-start gap-1.5">
      <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>本工具基于 ABO / Rh 血型标准遗传学的孟德尔规律作教育科普，不构成医学诊断或司法意见；输血、妊娠 Rh 免疫预防与亲子鉴定请遵医嘱并由专业机构进行。</span>
    </p>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>血型遗传规律、概率口径与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">遗传规律速查表</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed">
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-muted-foreground border-b border-border">
                    <th class="px-2 py-1.5 text-left font-medium">父母组合</th>
                    <th class="px-2 py-1.5 text-left font-medium">孩子可能血型</th>
                    <th class="px-2 py-1.5 text-left font-medium">孩子不可能血型</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in LOOKUP_ROWS" :key="row.pair" class="border-b border-border/40 last:border-0">
                    <td class="px-2 py-1.5 text-foreground font-medium whitespace-nowrap">{{ row.pair }}</td>
                    <td class="px-2 py-1.5 text-foreground">{{ row.possible.join('、') }}</td>
                    <td class="px-2 py-1.5 text-muted-foreground">{{ row.impossible.length ? row.impossible.join('、') : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">概率是怎么算的？为什么同一组合有不同概率？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            ABO 血型由 9 号染色体上的一个基因座决定，A、B 为显性、O 为隐性。父母各自随机把一个等位基因传给孩子，
            Punnett 方格就是这两种配子的全组合。难点在于<b class="text-foreground">显性表型看不出基因型</b>：
            A 型可能是 AA 也可能是 AO——本页默认按杂合子（AO / BO）假设给出「最大可能性」分布，
            并在分支表中把 AA / AO 两种假设逐一展开。例：A × B 在 AO × BO 假设下 A / B / AB / O 各 25%，
            但若父母都是纯合子（AA × BB），孩子将 100% 是 AB 型。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">中国人血型比例（群体分布科普）</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            国内多次群体调查的综合口径大致为：O 型约 34%、B 型约 29%、A 型约 28%、AB 型约 8.5%
            （不同年代、地域与民族调查差异明显：华南地区 O 型可超过 40%，北方不少地区 B 型高于 A 型，此处为量级科普而非精确统计）。
            群体比例只影响「随机相遇时的先验概率」，<b class="text-foreground">不改变本页按孟德尔遗传算出的条件概率</b>。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">Rh 血型和 ABO 是两套系统</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            Rh 因子由 D 基因决定：DD 或 Dd 表现为 Rh+，dd 表现为 Rh−。两口「血型」相互独立，完整血型应写成如「A 型，Rh+」。
            值得注意的组合：父母都是 Rh+ 时孩子仍可能 Rh−（双方都是 Dd 杂合子时约 25%）；Rh− 母亲怀 Rh+ 胎儿时，
            可能在分娩时致敏产生抗 D 抗体，影响下一胎（新生儿溶血病），现代产科会在产后 72 小时内注射抗 D 免疫球蛋白预防。
            中国汉族 Rh− 仅约 0.2%~0.5%，备孕检查记得包含 Rh 分型。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">A 型和 B 型的父母能生出 O 型孩子吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">能，但仅当双方都是杂合子（AO × BO）时：四个格子 A / B / AB / O 各 25%。若一方是纯合 AA，孩子不可能是 O 型。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">O 型和 O 型的父母孩子是什么血型？</h3>
            <p class="text-sm text-muted-foreground mt-1">只能是 O 型（OO × OO 的孩子必为 OO）——这也是血型遗传里最确定的组合之一，孩子不可能是 A、B 或 AB 型。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">AB 型和 O 型的父母孩子是什么血型？</h3>
            <p class="text-sm text-muted-foreground mt-1">只能是 A 型或 B 型，各约 50%（AB 提供 A 或 B、O 只提供 o），孩子不可能是 AB 型或 O 型。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">两个 Rh+ 的父母会生出 Rh− 的孩子吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">会。Rh+ 的基因型可能是 DD 或 Dd，若双方都是 Dd，孩子有 25% 概率为 Rh−（dd）；任一方是 DD 则孩子必定 Rh+。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">父母和孩子血型对不上，一定不是亲生的吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不一定：可能是显性表型下的基因型组合与默认假设不同，也可能涉及极罕见的孟买血型（hh）或cis-AB等变异。血型不符可以「排除」常规遗传的可能性，但不能直接下结论，确认需 DNA 亲子鉴定。</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'blood-type-inheritance'" :category="'health'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Droplet, Calculator, Info, TriangleAlert, ChevronDown, RefreshCw, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '血型遗传计算器 - 父母血型看孩子可能血型（ABO+Rh）',
  description: '免费在线血型遗传计算器：父母 ABO 与 Rh 血型组合，按孟德尔遗传输出孩子可能/不可能血型与各血型概率，Punnett 方格基因型可视化、A/B/AB/O 全 10 种组合速查表、孟买血型提示与 Rh− 概率说明，纯浏览器本地计算',
  keywords: '血型遗传计算器,父母血型孩子血型,ABO血型遗传表,Rh血型遗传,血型对照表,亲子血型',
  author: '有条工具',
  ogTitle: '血型遗传计算器 - 父母血型看孩子可能血型（ABO+Rh） | 有条工具',
  ogDescription: '可能/不可能血型与概率、Punnett 方格可视化、孟买血型与 Rh 遗传提示。',
  ogUrl: 'https://www.util.cn/tools/blood-type-inheritance',
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
          name: '血型遗传计算器',
          url: 'https://www.util.cn/tools/blood-type-inheritance',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['父母 ABO × Rh 组合孩子血型推断', '可能 / 不可能血型与概率', 'Punnett 方格基因型可视化', 'AA/AO 基因型分支表', 'Rh− 概率说明（熊猫血）', '孟买血型与亲子鉴定科普提示', '纯本地计算']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '健康工具', item: 'https://www.util.cn/health/' },
            { '@type': 'ListItem', position: 3, name: '血型遗传计算器', item: 'https://www.util.cn/tools/blood-type-inheritance/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'A 型和 B 型的父母能生出 O 型孩子吗？',
              acceptedAnswer: { '@type': 'Answer', text: '能，但仅当双方都是杂合子（AO × BO）时：A / B / AB / O 各 25%。若一方是纯合 AA，孩子不可能是 O 型。' }
            },
            {
              '@type': 'Question',
              name: 'O 型和 O 型的父母孩子是什么血型？',
              acceptedAnswer: { '@type': 'Answer', text: '只能是 O 型（OO × OO），孩子不可能是 A、B 或 AB 型。' }
            },
            {
              '@type': 'Question',
              name: 'AB 型和 O 型的父母孩子是什么血型？',
              acceptedAnswer: { '@type': 'Answer', text: '只能是 A 型或 B 型，各约 50%；孩子不可能是 AB 型或 O 型。' }
            },
            {
              '@type': 'Question',
              name: '两个 Rh+ 的父母会生出 Rh− 的孩子吗？',
              acceptedAnswer: { '@type': 'Answer', text: '会。若双方基因型都是 Dd，孩子有 25% 概率为 Rh−；任一方是 DD 则孩子必定 Rh+。' }
            },
            {
              '@type': 'Question',
              name: '父母和孩子血型对不上，一定不是亲生的吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不一定，可能是基因型组合与默认假设不同或孟买血型等罕见变异；血型只能排除不能确认，确认需 DNA 亲子鉴定。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// ABO 三等位基因（9 号染色体）：A、B 显性，O 隐性。
// 表型 → 可能基因型：A = AA/AO、B = BB/BO、AB = AB、O = OO。
// 概率口径：默认按「显性表型为杂合子」假设（A→AO、B→BO），AB/O 基因型唯一；
// 分支表把显性表型的纯合 / 杂合两种假设逐一展开（区间展示）。

const PHENOTYPES = ['A', 'B', 'AB', 'O']

// 表型 → 可能基因型列表
function possibleGeno(ph) {
  switch (ph) {
    case 'A': return ['AA', 'AO']
    case 'B': return ['BB', 'BO']
    case 'AB': return ['AB']
    case 'O': return ['OO']
    default: return []
  }
}

// 表型 → 默认假设基因型（显性表型按杂合子）
function defaultGeno(ph) {
  switch (ph) {
    case 'A': return 'AO'
    case 'B': return 'BO'
    case 'AB': return 'AB'
    case 'O': return 'OO'
    default: return ''
  }
}

// 基因型 → 配子（等位基因）列表
function gametesOf(gt) {
  switch (gt) {
    case 'AA': return ['A', 'A']
    case 'AO': return ['A', 'O']
    case 'BB': return ['B', 'B']
    case 'BO': return ['B', 'O']
    case 'AB': return ['A', 'B']
    case 'OO': return ['O', 'O']
    default: return []
  }
}

// 两个等位基因 → 基因型（规范化排序，保持 AA/AB/AO/BB/BO/OO 形式）
function genotypeOf(a, b) {
  const order = { A: 0, B: 1, O: 2 }
  const pair = [a, b].sort((x, y) => order[x] - order[y])
  return pair.join('')
}

// 基因型 → 表型
function phenotypeOf(gt) {
  if (gt.includes('A') && gt.includes('B')) return 'AB'
  if (gt.includes('A')) return 'A'
  if (gt.includes('B')) return 'B'
  return 'O'
}

// 单一基因型组合交叉：返回 { counts: {A,B,AB,O}（0~1）, cells: [{gt, gametes}] }
function crossDist(g1, g2) {
  const gm1 = gametesOf(g1)
  const gm2 = gametesOf(g2)
  const counts = { A: 0, B: 0, AB: 0, O: 0 }
  const cells = []
  const total = gm1.length * gm2.length
  for (const a of gm1) {
    for (const b of gm2) {
      const gt = genotypeOf(a, b)
      const ph = phenotypeOf(gt)
      counts[ph] += 1 / total
      cells.push({ gt, ph })
    }
  }
  return { counts, cells }
}

// 父母表型 → 孩子可能血型（全部基因型组合并集）
function possiblePhenotypesOf(fPh, mPh) {
  const set = new Set()
  for (const g1 of possibleGeno(fPh)) {
    for (const g2 of possibleGeno(mPh)) {
      const d = crossDist(g1, g2)
      for (const p of PHENOTYPES) {
        if (d.counts[p] > 0) set.add(p)
      }
    }
  }
  return PHENOTYPES.filter((p) => set.has(p))
}

// 父母表型 → 孩子不可能血型
function impossiblePhenotypesOf(fPh, mPh) {
  const possible = new Set(possiblePhenotypesOf(fPh, mPh))
  return PHENOTYPES.filter((p) => !possible.has(p))
}

// 默认假设下的概率分布
function defaultDistOf(fPh, mPh) {
  return crossDist(defaultGeno(fPh), defaultGeno(mPh)).counts
}

// 分支表：显性表型纯合 / 杂合假设逐一展开
function branchRowsOf(fPh, mPh) {
  const rows = []
  const dg1 = defaultGeno(fPh)
  const dg2 = defaultGeno(mPh)
  for (const g1 of possibleGeno(fPh)) {
    for (const g2 of possibleGeno(mPh)) {
      const d = crossDist(g1, g2)
      const parts = PHENOTYPES.filter((p) => d.counts[p] > 0).map((p) => `${p} ${Math.round(d.counts[p] * 100)}%`)
      rows.push({ g1, g2, isDefault: g1 === dg1 && g2 === dg2, text: parts.join('，') || '—' })
    }
  }
  return rows
}

// Rh 因子遗传：+ 为显性（DD/Dd），− 为 dd。
// 返回 { plus, minus, note }；Rh+ 一方基因型未知时按杂合子 Dd 假设并注明。
function rhDistOf(fRh, mRh) {
  const plusCount = (fRh === '+' ? 1 : 0) + (mRh === '+' ? 1 : 0)
  if (plusCount === 0) {
    return { plus: 0, minus: 100, note: '双方均为 Rh−（dd），孩子必定 Rh−。' }
  }
  if (plusCount === 1) {
    return {
      plus: 50,
      minus: 50,
      note: 'Rh+ 一方按杂合子 Dd 假设：孩子 50% Rh+ / 50% Rh−；若该方为纯合 DD，则孩子 100% Rh+。'
    }
  }
  return {
    plus: 75,
    minus: 25,
    note: '双方 Rh+ 均按杂合子 Dd 假设：孩子 75% Rh+ / 25% Rh−；任一方为纯合 DD，则孩子 100% Rh+（不可能出现 Rh−）。'
  }
}

// 全 10 种父母组合速查表（用核心函数生成，保证与交互结果一致）
function lookupRows() {
  const rows = []
  for (const f of PHENOTYPES) {
    for (const m of PHENOTYPES) {
      rows.push({
        pair: `${f} × ${m}`,
        possible: possiblePhenotypesOf(f, m),
        impossible: impossiblePhenotypesOf(f, m)
      })
    }
  }
  return rows
}
const LOOKUP_ROWS = lookupRows()

// Punnett 方格数据（默认假设基因型）
function punnettOf(fPh, mPh) {
  const g1 = defaultGeno(fPh)
  const g2 = defaultGeno(mPh)
  const gametes1 = gametesOf(g1)
  const gametes2 = gametesOf(g2)
  const unique1 = [...new Set(gametes1)]
  const unique2 = [...new Set(gametes2)]
  const cells = []
  for (const a of unique1) {
    for (const b of unique2) {
      cells.push({ gt: genotypeOf(a, b) })
    }
  }
  return { g1, g2, gametes1: unique1, gametes2: unique2, cells }
}

// ---------- 页面状态 ----------
const fatherAbo = ref('A')
const motherAbo = ref('B')
const fatherRh = ref('+')
const motherRh = ref('+')

const possibleList = computed(() => possiblePhenotypesOf(fatherAbo.value, motherAbo.value))
const impossibleList = computed(() => impossiblePhenotypesOf(fatherAbo.value, motherAbo.value))
const defaultDist = computed(() => defaultDistOf(fatherAbo.value, motherAbo.value))
const branchRows = computed(() => branchRowsOf(fatherAbo.value, motherAbo.value))
const punnett = computed(() => punnettOf(fatherAbo.value, motherAbo.value))
const rhDist = computed(() => rhDistOf(fatherRh.value, motherRh.value))

// 复制结果（navigator.clipboard + alert）
function copyResult() {
  const lines = [
    `【血型遗传推断】父 ${fatherAbo.value} 型 Rh${fatherRh.value === '+' ? '+' : '−'} × 母 ${motherAbo.value} 型 Rh${motherRh.value === '+' ? '+' : '−'}`,
    `孩子可能血型：${possibleList.value.join('、') || '—'}`,
    `孩子不可能血型：${impossibleList.value.join('、') || '无（四种都有可能）'}`,
    `默认假设（${defaultGeno(fatherAbo.value)} × ${defaultGeno(motherAbo.value)}）概率：${PHENOTYPES.map((p) => `${p} ${Math.round(defaultDist.value[p] * 100)}%`).join('，')}`,
    `Rh− 可能性：${rhDist.value.minus}%（${rhDist.value.note}）`,
    '提示：血型只能排除、不能确认亲子关系；孟买血型（hh）会使常规 ABO 推断失效。'
  ].join('\n')
  navigator.clipboard.writeText(lines).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

function loadExample() {
  fatherAbo.value = 'A'
  motherAbo.value = 'B'
  fatherRh.value = '+'
  motherRh.value = '+'
}

function resetAll() {
  fatherAbo.value = 'A'
  motherAbo.value = 'A'
  fatherRh.value = '+'
  motherRh.value = '+'
}

onMounted(() => {
  addRecentTool('blood-type-inheritance')
})
</script>
