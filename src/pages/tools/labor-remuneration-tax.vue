<template>
  <div class="max-w-8xl mx-auto px-4 py-8">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Receipt class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">劳务报酬个税计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">劳务报酬 / 稿酬 / 特许权使用费三类所得预扣预缴：三级预扣率、稿酬减按 70% 计入、年度汇算多退少补提示</p>
        </div>
      </div>
      <p class="text-muted-foreground leading-relaxed">
        在线劳务报酬个税计算器：选择所得类型并输入每次收入，按《个人所得税法》第六条与国家税务总局公告 2018 年第 61 号口径
        计算预扣预缴应纳税所得额与应预扣税额——劳务报酬按 20% / 30% / 40% 三级预扣率表（速算扣除数 0 / 2000 / 7000），
        稿酬按收入额减按 70% 计入、20% 比例预扣，特许权使用费 20% 比例预扣；同时给出税后到手金额与
        「并入综合所得 3%–45% 超额累进年度汇算、多退少补」的提示卡与年度税率表速查。
        全部计算在浏览器本地完成，不上传、不保存任何收入数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Receipt class="w-5 h-5 mr-2 text-primary" /> 所得类型与收入
        </h2>

        <!-- 所得类型 -->
        <div>
          <label for="lrt-type" class="block text-sm font-medium text-foreground mb-2">所得类型</label>
          <select
            id="lrt-type"
            v-model="incomeType"
            class="w-full px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option v-for="t in TYPES" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
          <p class="text-xs leading-relaxed mt-2 p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ activeType.desc }}</span>
          </p>
        </div>

        <!-- 每次收入 -->
        <div>
          <label for="lrt-income" class="block text-sm font-medium text-foreground mb-2">每次收入（税前）</label>
          <div class="flex items-center gap-2">
            <input
              id="lrt-income"
              v-model.number="income"
              type="number"
              min="0"
              step="100"
              placeholder="如 10000"
              class="flex-1 min-w-0 px-3 py-2 border border-border bg-background rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground flex-shrink-0">元</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>「每次」口径：劳务报酬属于同一项目连续性收入的，以一个月内取得的收入为一次（《个人所得税法实施条例》第十四条）。</span>
          </p>
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

        <!-- 预扣率表速查 -->
        <div class="border border-border rounded-lg overflow-hidden">
          <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
            <p class="text-sm font-semibold text-foreground">个人所得税预扣率表{{ activeType.tableName }}</p>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-xs text-muted-foreground border-b border-border">
                <th class="px-3 py-2 text-left font-medium">级数</th>
                <th class="px-3 py-2 text-left font-medium">预扣预缴应纳税所得额</th>
                <th class="px-3 py-2 text-right font-medium">预扣率</th>
                <th v-if="activeType.id === 'labor'" class="px-3 py-2 text-right font-medium">速算扣除数</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in activeType.table"
                :key="i"
                class="border-b border-border/40 last:border-0"
                :class="activeRow === i ? 'bg-primary/10' : ''"
              >
                <td class="px-3 py-2 text-foreground">{{ i + 1 }}</td>
                <td class="px-3 py-2 text-muted-foreground">{{ row.label }}</td>
                <td class="px-3 py-2 text-right font-mono text-foreground">{{ Math.round(row.rate * 100) }}%</td>
                <td v-if="activeType.id === 'labor'" class="px-3 py-2 text-right font-mono text-foreground">{{ row.quick.toLocaleString('zh-CN') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 预扣预缴测算结果
          </h2>
          <button
            v-if="canCalc"
            @click="copyResult"
            class="text-xs px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-foreground transition"
          >
            <Copy class="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> 复制结果
          </button>
        </div>

        <template v-if="canCalc">
          <!-- 主结果卡 -->
          <div class="bg-primary/10 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-xs text-muted-foreground mb-1">应纳税所得额（收入额）</p>
              <p class="text-2xl font-bold text-foreground font-mono">{{ fmtMoney(result.taxable) }} <span class="text-xs font-normal">元</span></p>
              <p class="text-[11px] text-muted-foreground mt-1">{{ result.deductLabel }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground mb-1">应预扣预缴税额</p>
              <p class="text-2xl font-bold text-primary font-mono">{{ fmtMoney(result.tax) }} <span class="text-xs font-normal">元</span></p>
              <p class="text-[11px] text-muted-foreground mt-1">{{ result.rateLabel }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground mb-1">税后到手收入</p>
              <p class="text-2xl font-bold text-foreground font-mono">{{ fmtMoney(result.net) }} <span class="text-xs font-normal">元</span></p>
              <p class="text-[11px] text-muted-foreground mt-1">实际税负 {{ result.effRate }}%</p>
            </div>
          </div>

          <!-- 计算明细表 -->
          <div class="border border-border rounded-lg overflow-hidden">
            <div class="px-4 py-2.5 bg-muted/40 border-b border-border">
              <p class="text-sm font-semibold text-foreground">计算明细（公式代入过程）</p>
            </div>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-muted-foreground border-b border-border">
                  <th class="px-4 py-2 text-left font-medium w-28">步骤</th>
                  <th class="px-4 py-2 text-left font-medium">公式代入</th>
                  <th class="px-4 py-2 text-right font-medium">结果</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(st, i) in detailSteps" :key="i" class="border-b border-border/40 last:border-0">
                  <td class="px-4 py-2 text-foreground font-medium align-top">{{ st.label }}</td>
                  <td class="px-4 py-2 text-muted-foreground align-top">{{ st.formula }}</td>
                  <td class="px-4 py-2 text-right font-mono text-foreground align-top whitespace-nowrap">{{ st.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 年度汇算提示卡 -->
          <div class="border border-amber-500/20 bg-amber-500/10 rounded-lg p-4 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-foreground">别忘了年度汇算清缴：预扣 ≠ 最终税负</p>
              <p class="text-sm text-muted-foreground mt-1 leading-relaxed">
                上述金额只是支付方「预扣预缴」的税款。居民个人的劳务报酬、稿酬、特许权使用费所得在年度终了后要与工资薪金
                <b class="text-foreground">合并计入年度综合所得</b>，按 3%–45% 超额累进税率重新计算全年应纳税额，
                与已预缴税款比较后<b class="text-foreground">多退少补</b>（次年 3 月 1 日至 6 月 30 日办理）。收入不高或可扣除专项附加的，
                汇算后常能退税；预扣率被「跳档」的高收入月份，汇算后税负会摊平。
              </p>
              <div class="overflow-x-auto mt-3 rounded-lg border border-border bg-background">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="text-muted-foreground border-b border-border bg-muted/40">
                      <th class="px-3 py-1.5 text-left font-medium">全年应纳税所得额</th>
                      <th class="px-3 py-1.5 text-right font-medium">税率</th>
                      <th class="px-3 py-1.5 text-right font-medium">速算扣除数（元）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in ANNUAL_TABLE" :key="i" class="border-b border-border/40 last:border-0">
                      <td class="px-3 py-1.5 text-foreground">{{ row.label }}</td>
                      <td class="px-3 py-1.5 text-right font-mono text-foreground">{{ row.rate }}%</td>
                      <td class="px-3 py-1.5 text-right font-mono text-foreground">{{ row.quick.toLocaleString('zh-CN') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-[11px] text-muted-foreground mt-2">
                年度税率表口径：全年应纳税所得额 = 综合所得收入额 − 6 万元基本减除费用 − 专项扣除 − 专项附加扣除等；
                劳务报酬、稿酬、特许权使用费在汇算时的收入额分别为 ×(1−20%)、×(1−20%)×70%、×(1−20%)。
              </p>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先完善左侧输入：{{ inputErrors.join('；') }}。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一条完整测算：劳务报酬每次收入 10000 元。</p>
        </div>
      </div>
    </div>

    <!-- 法条与免责声明（页面固定） -->
    <div class="border border-border bg-muted/30 rounded-lg p-4 mb-8 flex items-start gap-2">
      <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p class="text-xs text-muted-foreground leading-relaxed">
        计算依据：《中华人民共和国个人所得税法》第三条、第六条及个人所得税税率表（2018 年修正），
        国家税务总局公告 2018 年第 61 号《个人所得税扣缴申报管理办法（试行）》（预扣率表二），
        《个人所得税法实施条例》第十四条（「次」的口径）。本页已对照政府法规库原文逐字核对，
        <b class="text-foreground">一切以现行法规原文与主管税务机关口径为准</b>；本工具仅供教育参考，不构成税务意见，
        涉及实际申报请咨询税务机关（12366）或税务师。
      </p>
    </div>

    <!-- SEO 内容区（可折叠） -->
    <details class="bg-card border border-border rounded-lg mb-12 group">
      <summary class="flex items-center justify-between cursor-pointer select-none px-6 py-4">
        <span class="text-lg font-semibold text-foreground"><span class="text-primary mr-2">#</span>劳务报酬个税怎么算？公式、口径与常见问题</span>
        <ChevronDown class="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div class="px-6 pb-6 space-y-6">
        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">计算公式</h3>
          <div class="bg-muted/50 rounded-xl p-4 text-sm text-foreground leading-relaxed space-y-2">
            <p><strong>费用减除</strong>：每次收入 ≤ 4000 元减 800 元；&gt; 4000 元按收入 × (1−20%) 减除费用。</p>
            <p><strong>劳务报酬</strong>：应纳税所得额 = 收入 − 费用；税额 = 应纳税所得额 × 预扣率 − 速算扣除数（预扣率表二：≤2 万 20%、2 万～5 万 30% 速扣 2000、&gt;5 万 40% 速扣 7000，<b>按次</b>适用）。</p>
            <p><strong>稿酬</strong>：收入额 =（收入 − 费用）× 70%；税额 = 收入额 × 20%。即稿酬实际按收入的 56%（或减 800 后的 70%）计入。</p>
            <p><strong>特许权使用费</strong>：收入额 = 收入 − 费用；税额 = 收入额 × 20%。</p>
            <p><strong>税后收入</strong> = 每次收入 − 应预扣预缴税额。</p>
          </div>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">「按次」与「按月」是什么口径？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            《个人所得税法实施条例》第十四条规定：劳务报酬所得属于同一项目连续性收入的，以<b class="text-foreground">一个月内取得的收入为一次</b>。
            例：周六日兼职讲课，每月固定取得 4 笔 3000 元，属于同一项目连续性收入，应合并按月 12000 元为「一次」计税
            （12000 × 0.8 × 20% = 1920 元），而不是按次分四笔各算（440 × 4 = 1760 元）。
            一次性收入（如单场演出、一次性设计费）则以取得该笔收入为一次。稿酬与特许权使用费同理按「每次」判断。
            由于预扣率表二是超额累进结构（只对超出部分适用高税率），合并与拆分的差异主要来自 800 元费用能否重复扣除。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">为什么预扣的税和年度汇算不一样？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            预扣预缴的目的是「税款均衡入库」，不是最终税负：劳务报酬预扣率表二的 30%、40% 档只看单次收入，
            而年度汇算把全年全部综合所得（工资薪金 + 劳务报酬收入额 ×80% + 稿酬收入额 ×70% + 特许权使用费收入额 ×80%）合并，
            减除 6 万元基本减除费用与专项扣除、专项附加扣除后，按 3%–45% 超额累进重新计算。
            收入越高、月份越集中，预扣越「重」；反之收入低或扣除项多的，汇算常见退税。
            站内配套工具：<a href="/tools/tax-calculator/" class="text-primary hover:underline">工资个税计算器（月度工资薪金累计预扣）</a>。
          </p>
        </div>

        <div>
          <h3 class="text-base font-semibold text-foreground mb-2">稿酬「减按 70%」是什么意思？</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            《个人所得税法》第六条规定稿酬所得的收入额<b class="text-foreground">减按 70% 计算</b>——先按劳务同款规则减除费用
            （≤4000 减 800、&gt;4000 减 20%），再对剩余收入额打七折。以每次收入 10000 元为例：
            收入额 = 10000 × (1−20%) × 70% = 5600 元，预扣税 = 5600 × 20% = 1120 元。
            这一优惠在预扣与汇算两个环节均适用。
          </p>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">兼职劳务报酬 3000 元要交多少税？</h3>
            <p class="text-sm text-muted-foreground mt-1">每次收入不超过 4000 元减 800 元费用：(3000 − 800) × 20% = 440 元，税后到手 2560 元。若属同一项目连续性收入，应按月合并计算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">劳务报酬预扣率是全额累进还是超额累进？</h3>
            <p class="text-sm text-muted-foreground mt-1">超额累进：只对超出低档的部分适用高预扣率，公式为「应纳税所得额 × 预扣率 − 速算扣除数」。如 30000 元：24000 × 30% − 2000 = 5200 元，而非全额按 30%。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">稿酬 10000 元预扣多少税？</h3>
            <p class="text-sm text-muted-foreground mt-1">收入额 = 10000 × (1−20%) × 70% = 5600 元，按 20% 比例预扣 1120 元，税后 8880 元；年度汇算时 5600 元并入综合所得重新计算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">预扣的税多扣了怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">无需单独申请：次年 3 月 1 日至 6 月 30 日办理个人所得税综合所得年度汇算清缴，全年合并计税后多退少补，可在个人所得税 App 操作。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">特许权使用费和劳务报酬怎么区分？</h3>
            <p class="text-sm text-muted-foreground mt-1">提供专利权、商标权、著作权等财产的使用权取得的所得为特许权使用费所得（20% 比例预扣）；个人提供设计、咨询、讲学等独立劳务服务取得的所得为劳务报酬所得（三级预扣率表）。</p>
          </div>
        </div>
      </div>
    </details>

    <RelatedTools :currentToolId="'labor-remuneration-tax'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Receipt, Calculator, Info, TriangleAlert, ChevronDown, RefreshCw, Copy
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '劳务报酬个税计算器 - 劳务/稿酬/特许权使用费预扣预缴在线计算',
  description: '免费在线劳务报酬个税计算器：劳务报酬、稿酬、特许权使用费三类所得预扣预缴个税，三级预扣率 20%/30%/40% 速算扣除数自动代入，稿酬减按 70% 计入，附年度汇算 3%-45% 税率表速查与多退少补提示，纯浏览器本地计算不上传',
  keywords: '劳务报酬个税计算器,劳务报酬预扣率,稿酬所得个税,特许权使用费个税,个税汇算清缴,兼职收入税,预扣率表二',
  author: '有条工具',
  ogTitle: '劳务报酬个税计算器 - 劳务/稿酬/特许权使用费预扣预缴在线计算 | 有条工具',
  ogDescription: '三类所得预扣预缴一键测算，三级预扣率与速算扣除数自动代入，附年度汇算税率表速查。',
  ogUrl: 'https://www.util.cn/tools/labor-remuneration-tax',
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
          name: '劳务报酬个税计算器',
          url: 'https://www.util.cn/tools/labor-remuneration-tax',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['劳务报酬 20%/30%/40% 三级预扣率速算', '稿酬收入额减按 70% 计入', '特许权使用费 20% 比例预扣', '按次 / 按月口径说明', '年度汇算 3%-45% 税率表速查', '逐步明细与税后收入', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '劳务报酬个税计算器', item: 'https://www.util.cn/tools/labor-remuneration-tax/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '兼职劳务报酬 3000 元要交多少税？',
              acceptedAnswer: { '@type': 'Answer', text: '每次收入不超过 4000 元减 800 元费用：(3000 − 800) × 20% = 440 元，税后到手 2560 元。若属同一项目连续性收入，应按月合并计算。' }
            },
            {
              '@type': 'Question',
              name: '劳务报酬预扣率是全额累进还是超额累进？',
              acceptedAnswer: { '@type': 'Answer', text: '超额累进：只对超出低档的部分适用高预扣率，公式为「应纳税所得额 × 预扣率 − 速算扣除数」。如 30000 元：24000 × 30% − 2000 = 5200 元。' }
            },
            {
              '@type': 'Question',
              name: '稿酬 10000 元预扣多少税？',
              acceptedAnswer: { '@type': 'Answer', text: '收入额 = 10000 × (1−20%) × 70% = 5600 元，按 20% 比例预扣 1120 元，税后 8880 元；年度汇算时 5600 元并入综合所得重新计算。' }
            },
            {
              '@type': 'Question',
              name: '预扣的税多扣了怎么办？',
              acceptedAnswer: { '@type': 'Answer', text: '次年 3 月 1 日至 6 月 30 日办理个人所得税综合所得年度汇算清缴，全年合并计税后多退少补，可在个人所得税 App 操作。' }
            },
            {
              '@type': 'Question',
              name: '特许权使用费和劳务报酬怎么区分？',
              acceptedAnswer: { '@type': 'Answer', text: '提供专利权、商标权、著作权等财产的使用权取得的所得为特许权使用费所得（20% 比例预扣）；提供设计、咨询、讲学等独立劳务服务取得的所得为劳务报酬所得（三级预扣率表）。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 口径依据（两源逐字核对：国家税务总局公告 2018 年第 61 号 + 《个人所得税法》第六条）：
// - 每次收入 ≤ 4000 元：减除费用 800 元；> 4000 元：减除费用的 20%。
// - 劳务报酬：以「收入额」为预扣预缴应纳税所得额，适用预扣率表二（20%/30% 速扣 2000/40% 速扣 7000）。
// - 稿酬：收入额减按 70% 计算，20% 比例预扣（61 号文口径：先减除费用，再 ×70%）。
// - 特许权使用费：收入额 20% 比例预扣。
// 金额采用 0.01 元定点收敛（round2），避免浮点链式运算直接展示。

function round2(x) {
  return Math.round((Number(x) || 0) * 100) / 100
}

// 预扣率表二（劳务报酬所得适用，61 号公告）：rate 为小数，quick 为速算扣除数（元）
const LABOR_BRACKETS = [
  { limit: 20000, rate: 0.2, quick: 0, label: '不超过 20,000 元' },
  { limit: 50000, rate: 0.3, quick: 2000, label: '超过 20,000 元至 50,000 元' },
  { limit: Infinity, rate: 0.4, quick: 7000, label: '超过 50,000 元' }
]

// 劳务报酬预扣税额：应纳税所得额 × 预扣率 − 速算扣除数（负数收敛为 0）
function laborTaxOf(taxable) {
  const t = Math.max(0, round2(taxable))
  for (const b of LABOR_BRACKETS) {
    if (t <= b.limit) return Math.max(0, round2(t * b.rate - b.quick))
  }
  return 0
}

// 费用减除额：每次收入 ≤ 4000 元减 800；> 4000 元减收入的 20%；非正收入按 0
function deductionOf(income) {
  const inc = Number(income) || 0
  if (inc <= 0) return 0
  return inc <= 4000 ? 800 : round2(inc * 0.2)
}

// 收入额（预扣预缴应纳税所得额）：
// labor / royalty（特许权使用费）= 收入 − 费用；authorship（稿酬）=（收入 − 费用）× 70%
function incomeAmountOf(type, income) {
  const inc = Number(income) || 0
  const base = Math.max(0, round2(inc - deductionOf(inc)))
  return type === 'authorship' ? round2(base * 0.7) : base
}

// 应预扣预缴税额
function withholdingOf(type, income) {
  const taxable = incomeAmountOf(type, income)
  if (type === 'labor') return laborTaxOf(taxable)
  return round2(taxable * 0.2)
}

// 税后到手
function netIncomeOf(income, tax) {
  return round2((Number(income) || 0) - tax)
}

// 年度综合所得税率表（3%–45% 超额累进，《个人所得税法》附表，汇算速查）
const ANNUAL_TABLE = [
  { label: '不超过 36,000 元', rate: 3, quick: 0 },
  { label: '超过 36,000 元至 144,000 元', rate: 10, quick: 2520 },
  { label: '超过 144,000 元至 300,000 元', rate: 20, quick: 16920 },
  { label: '超过 300,000 元至 420,000 元', rate: 25, quick: 31920 },
  { label: '超过 420,000 元至 660,000 元', rate: 30, quick: 52920 },
  { label: '超过 660,000 元至 960,000 元', rate: 35, quick: 85920 },
  { label: '超过 960,000 元', rate: 45, quick: 181920 }
]

// 三种所得类型的展示元数据
const TYPES = [
  {
    id: 'labor',
    label: '劳务报酬所得（兼职、讲课、设计、咨询等）',
    desc: '个人独立从事各种非雇佣劳务取得的所得。每次收入 ≤ 4000 元减 800 元、> 4000 元按 80% 计入，适用预扣率表二（20% / 30% / 40%）。',
    tableName: '二（劳务报酬所得适用）',
    table: LABOR_BRACKETS
  },
  {
    id: 'authorship',
    label: '稿酬所得（出版、发表作品）',
    desc: '作品出版、发表取得的所得。收入额先按费用减除规则处理、再减按 70% 计算，按 20% 比例预扣。实际计入比例约为收入的 56%（>4000 元时）。',
    tableName: '（稿酬适用 20% 比例）',
    table: [{ limit: Infinity, rate: 0.2, quick: 0, label: '全部收入额' }]
  },
  {
    id: 'royalty',
    label: '特许权使用费所得（专利、商标、著作权许可）',
    desc: '提供专利权、商标权、著作权、非专利技术等使用权取得的所得。费用减除规则与劳务报酬相同，按 20% 比例预扣。',
    tableName: '（特许权适用 20% 比例）',
    table: [{ limit: Infinity, rate: 0.2, quick: 0, label: '全部收入额' }]
  }
]

function typeOf(id) {
  return TYPES.find((t) => t.id === id) || TYPES[0]
}

// 金额展示：千分位 + 固定 2 位小数（SSR 与浏览器一致的手工实现）
function fmtMoney(n) {
  const v = round2(n)
  const sign = v < 0 ? '-' : ''
  const parts = Math.abs(v).toFixed(2).split('.')
  return sign + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1]
}

// 全链路汇总
function calcAll(type, income) {
  const t = typeOf(type)
  const inc = Math.max(0, Number(income) || 0)
  const deduction = deductionOf(inc)
  const taxable = incomeAmountOf(type, inc)
  let tax = 0
  let rateLabel = ''
  if (t.id === 'labor') {
    tax = laborTaxOf(taxable)
    const b = LABOR_BRACKETS.find((x) => taxable <= x.limit) || LABOR_BRACKETS[2]
    rateLabel = `预扣率 ${Math.round(b.rate * 100)}%` + (b.quick ? `，速算扣除 ${b.quick.toLocaleString('zh-CN')} 元` : '')
  } else {
    tax = round2(taxable * 0.2)
    rateLabel = '20% 比例预扣' + (t.id === 'authorship' ? '（收入额减按 70%）' : '')
  }
  const net = netIncomeOf(inc, tax)
  const effRate = inc > 0 ? String(Math.round((tax / inc) * 1000) / 10) : '0'
  const deductLabel = inc <= 0
    ? '—'
    : (deduction === 800 ? '费用减除 800 元（收入 ≤ 4000 元）' : `费用减除收入的 20%（${fmtMoney(deduction)} 元）`)
  return { type: t, income: inc, deduction, taxable, tax, net, rateLabel, deductLabel, effRate }
}

// 明细表
function detailStepsOf(type, income) {
  const r = calcAll(type, income)
  const steps = []
  steps.push({
    label: '费用减除',
    formula: `每次收入 ${fmtMoney(r.income)} 元：${r.income <= 4000 ? '≤ 4000 元，减 800 元' : '> 4000 元，减除收入的 20%'}`,
    value: `${fmtMoney(r.deduction)} 元`
  })
  if (r.type.id === 'authorship') {
    steps.push({
      label: '稿酬收入额',
      formula: `（收入 − 费用）× 70% = ${fmtMoney(r.income)} − ${fmtMoney(r.deduction)} 再 × 70%（个税法第六条：收入额减按 70%）`,
      value: `${fmtMoney(r.taxable)} 元`
    })
  } else {
    steps.push({
      label: '应纳税所得额',
      formula: `收入 − 费用 = ${fmtMoney(r.income)} − ${fmtMoney(r.deduction)}`,
      value: `${fmtMoney(r.taxable)} 元`
    })
  }
  if (r.type.id === 'labor') {
    const b = LABOR_BRACKETS.find((x) => r.taxable <= x.limit) || LABOR_BRACKETS[2]
    steps.push({
      label: '适用预扣率',
      formula: `预扣率表二：${b.label}（按次适用）`,
      value: `${Math.round(b.rate * 100)}%，速扣 ${b.quick} 元`
    })
    steps.push({
      label: '应预扣税额',
      formula: `${fmtMoney(r.taxable)} × ${Math.round(b.rate * 100)}% − ${b.quick}`,
      value: `${fmtMoney(r.tax)} 元`
    })
  } else {
    steps.push({
      label: '应预扣税额',
      formula: `${fmtMoney(r.taxable)} × 20%（比例预扣率）`,
      value: `${fmtMoney(r.tax)} 元`
    })
  }
  steps.push({
    label: '税后到手',
    formula: `${fmtMoney(r.income)} − ${fmtMoney(r.tax)}`,
    value: `${fmtMoney(r.net)} 元`
  })
  return steps
}

// ---------- 页面状态 ----------
const incomeType = ref('labor')
const income = ref(10000)

const activeType = computed(() => typeOf(incomeType.value))

const inputErrors = computed(() => {
  const errs = []
  if (!(Number(income.value) > 0)) errs.push('每次收入需大于 0')
  return errs
})

const canCalc = computed(() => inputErrors.value.length === 0)

const result = computed(() => calcAll(incomeType.value, income.value))
const detailSteps = computed(() => detailStepsOf(incomeType.value, income.value))

// 当前命中的预扣率行（高亮预扣率表）
const activeRow = computed(() => {
  if (incomeType.value !== 'labor') return 0
  const taxable = result.value.taxable
  return LABOR_BRACKETS.findIndex((b) => taxable <= b.limit)
})

// 复制结果（navigator.clipboard + alert）
function copyResult() {
  const r = result.value
  const lines = [
    `【劳务报酬个税测算】${r.type.label}`,
    `每次收入：${fmtMoney(r.income)} 元`,
    `费用减除：${fmtMoney(r.deduction)} 元`,
    `应纳税所得额：${fmtMoney(r.taxable)} 元（${r.rateLabel}）`,
    `应预扣预缴税额：${fmtMoney(r.tax)} 元`,
    `税后到手：${fmtMoney(r.net)} 元（实际税负 ${r.effRate}%）`,
    '提示：预扣税额并入年度综合所得 3%-45% 汇算清缴、多退少补。',
    '来源：有条工具 labor-remuneration-tax（仅供参考，以现行法规原文为准）'
  ].join('\n')
  navigator.clipboard.writeText(lines).then(() => alert('已复制')).catch(() => alert('复制失败，请手动复制'))
}

function loadExample() {
  incomeType.value = 'labor'
  income.value = 10000
}

function resetAll() {
  incomeType.value = 'labor'
  income.value = ''
}

onMounted(() => {
  addRecentTool('labor-remuneration-tax')
})
</script>
