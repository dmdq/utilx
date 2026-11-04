<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Flame class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">现金跑道计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">创业公司 Burn Rate / Runway 测算：跑道月数、预计耗尽年月与健康度档位，一秒看清账上的钱还能烧多久</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线现金跑道计算器：录入公司账上现金余额、月固定支出与月收入，按 net 口径（月净消耗 = 支出 − 收入）即时测算 Runway 月数与预计现金耗尽年月；
        支持为支出与收入分别设置月增长率做复利推演、逐月列出未来现金余额，按 6 / 12 个月阈值给出危险、注意、健康三档评估，
        并用月消耗 ±20% 敏感度对比展示「省 20% 开支能多撑多久」。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Flame class="w-5 h-5 mr-2 text-primary" /> 收支与现金设置
        </h2>

        <!-- 当前现金余额 -->
        <div>
          <label for="burn-cash" class="block text-sm font-medium text-foreground mb-2">当前现金余额（元）</label>
          <input
            id="burn-cash"
            v-model.number="cashYuan"
            type="number"
            min="0"
            step="10000"
            placeholder="如 3000000"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">≈ {{ formatMoney(cashNum) }}</p>
        </div>

        <!-- 月固定支出 -->
        <div>
          <label for="burn-expense" class="block text-sm font-medium text-foreground mb-2">月固定支出（元）</label>
          <input
            id="burn-expense"
            v-model.number="expenseYuan"
            type="number"
            min="0"
            step="10000"
            placeholder="如 450000"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">≈ {{ formatMoney(expenseNum) }}</p>
        </div>

        <!-- 月收入 -->
        <div>
          <label for="burn-revenue" class="block text-sm font-medium text-foreground mb-2">月收入（元）</label>
          <input
            id="burn-revenue"
            v-model.number="revenueYuan"
            type="number"
            min="0"
            step="10000"
            placeholder="如 150000"
            class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">≈ {{ formatMoney(revenueNum) }}</p>
        </div>

        <!-- 净消耗预览 -->
        <div class="rounded-lg p-3 text-sm flex items-center justify-between" :class="netBurnView.box">
          <span class="text-muted-foreground flex items-center gap-1.5">
            <TrendingDown class="w-3.5 h-3.5" /> 当前{{ netBurnView.label }}
          </span>
          <span class="font-bold font-mono" :class="netBurnView.cls">{{ netBurnView.sign }}{{ netBurnView.value }}</span>
        </div>

        <!-- 进阶参数（默认收起） -->
        <div class="border-t border-border pt-4">
          <button
            @click="toggleAdvanced"
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
            :aria-expanded="advancedOpen"
          >
            <span class="flex items-center gap-1.5"><Info class="w-4 h-4 text-primary" /> 进阶参数：月增长率复利推演</span>
            <ChevronUp v-if="advancedOpen" class="w-4 h-4" />
            <ChevronDown v-else class="w-4 h-4" />
          </button>
          <div v-show="advancedOpen" class="mt-3 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="burn-exp-growth" class="block text-xs font-medium text-foreground mb-1.5">月支出增长率 %</label>
                <input
                  id="burn-exp-growth"
                  v-model.number="expGrowth"
                  type="number"
                  min="-20"
                  max="20"
                  step="0.5"
                  class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p class="text-[10px] text-muted-foreground mt-1">范围 -20 ~ 20，超出自动夹紧</p>
              </div>
              <div>
                <label for="burn-rev-growth" class="block text-xs font-medium text-foreground mb-1.5">月收入增长率 %</label>
                <input
                  id="burn-rev-growth"
                  v-model.number="revGrowth"
                  type="number"
                  min="-20"
                  max="50"
                  step="0.5"
                  class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p class="text-[10px] text-muted-foreground mt-1">范围 -20 ~ 50，超出自动夹紧</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1">
              <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
              <span>支出与收入按 (1 + 月增长率)^(月序 − 1) 复利迭代；当收入增长率 ≥ 支出增长率且某月转为净收入时，视为自我造血、跑道无限。</span>
            </p>
          </div>
        </div>

        <!-- 金额异常提示 -->
        <p v-if="amountWarning" class="text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ amountWarning }}</span>
        </p>

        <!-- 操作按钮 -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            @click="loadExample"
            class="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-sm font-medium text-primary transition"
          >
            载入示例
          </button>
          <button
            @click="resetAll"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <TrendingDown class="w-5 h-5 mr-2 text-primary" /> 跑道测算结果
        </h2>

        <!-- 大数字卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">现金跑道（Runway）</p>
            <p class="text-2xl font-bold" :class="runwayView.cls">
              {{ runwayView.text }}<span v-if="!runwayView.infinite" class="text-sm font-normal text-muted-foreground ml-1">个月</span>
            </p>
            <p class="text-xs text-muted-foreground mt-1">{{ runwayView.sub }}</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">预计现金耗尽</p>
            <p class="text-2xl font-bold text-foreground">{{ exhaustionText }}</p>
            <p class="text-xs text-muted-foreground mt-1">按月增长率逐月推演</p>
          </div>
          <div class="bg-muted/50 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ netBurnView.label }}</p>
            <p class="text-2xl font-bold" :class="netBurnView.cls">{{ netBurnView.sign }}{{ netBurnView.value }}</p>
            <p class="text-xs text-muted-foreground mt-1">月固定支出 − 月收入</p>
          </div>
        </div>

        <!-- 健康度提示条 -->
        <p
          v-if="isInputEmpty"
          class="text-xs leading-relaxed p-3 rounded-lg border border-border bg-muted/60 text-muted-foreground flex items-start gap-1.5"
        >
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>先在左侧填入现金余额与月度收支开始测算，或点击「载入示例」查看演示数据。</span>
        </p>
        <p v-else class="text-xs leading-relaxed p-3 rounded-lg border flex items-start gap-1.5" :class="healthMeta[healthStatus].cls">
          <component :is="healthMeta[healthStatus].icon" class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span><span class="font-semibold">{{ healthMeta[healthStatus].title }}</span> · {{ healthMeta[healthStatus].text }}</span>
        </p>

        <!-- 月度推演表 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">月度推演表（前 12 个月）</h3>
            <span class="text-xs text-muted-foreground">单位：万元</span>
          </div>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/50 text-muted-foreground">
                  <th class="px-3 py-2 text-left font-medium">月份</th>
                  <th class="px-3 py-2 text-right font-medium">月支出</th>
                  <th class="px-3 py-2 text-right font-medium">月收入</th>
                  <th class="px-3 py-2 text-right font-medium">期末现金</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="row in tableRows" :key="row.month" :class="row.exhausted ? 'bg-red-500/5' : ''">
                  <td class="px-3 py-2 text-muted-foreground whitespace-nowrap">第 {{ row.month }} 月</td>
                  <td class="px-3 py-2 text-right font-mono">{{ row.expenseText }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ row.revenueText }}</td>
                  <td class="px-3 py-2 text-right font-mono whitespace-nowrap" :class="row.exhausted ? 'text-red-600 font-semibold' : ''">
                    {{ row.cashText }}<span v-if="row.exhausted" class="ml-1 text-[10px] text-red-500">耗尽</span>
                  </td>
                </tr>
                <tr v-if="overflowNote" class="bg-muted/30">
                  <td colspan="4" class="px-3 py-2 text-xs text-muted-foreground text-center">… {{ overflowNote }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-2 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ tableSummary }}</span>
          </p>
        </div>

        <!-- 敏感度对比 -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center">
            <TrendingDown class="w-4 h-4 mr-1.5 text-primary" /> 敏感度：月消耗 ±20% 对跑道的影响
          </h3>
          <div v-if="sensitivity" class="space-y-2">
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <p class="text-[10px] text-muted-foreground mb-1">开支 −20%（省着花）</p>
                <p class="text-xl font-bold text-green-600">{{ formatMonths(sensitivity.saved) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">个月</span></p>
                <p class="text-[10px] text-green-600 mt-1">比当前多撑 {{ formatMonths(sensitivity.saved - sensitivity.current) }} 个月</p>
              </div>
              <div class="rounded-lg border border-border bg-muted/40 p-3">
                <p class="text-[10px] text-muted-foreground mb-1">当前月消耗</p>
                <p class="text-xl font-bold text-foreground">{{ formatMonths(sensitivity.current) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">个月</span></p>
                <p class="text-[10px] text-muted-foreground mt-1">月净消耗 {{ formatMoney(netBurn) }}</p>
              </div>
              <div class="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <p class="text-[10px] text-muted-foreground mb-1">开支 +20%</p>
                <p class="text-xl font-bold text-red-600">{{ formatMonths(sensitivity.extra) }}<span class="text-xs font-normal text-muted-foreground ml-0.5">个月</span></p>
                <p class="text-[10px] text-red-500 mt-1">比当前少撑 {{ formatMonths(sensitivity.current - sensitivity.extra) }} 个月</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              省下 20% 开支 = 月净消耗降为 80%，跑道约为原来的 1.25 倍（1 ÷ 0.8）——固定开支是延长跑道最直接的杠杆。
            </p>
          </div>
          <p v-else class="text-xs text-muted-foreground p-3 rounded-lg border border-border bg-muted/60 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>当前收入已覆盖支出（净消耗 ≤ 0），无跑道压力，敏感度对比不适用。</span>
          </p>
        </div>

        <!-- 免责声明 -->
        <p class="text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border pt-3">
          免责声明：本工具为简化静态模型，未包含融资到账、季节波动、工资社保口径差异等因素；参考阈值（6 / 12 / 18 个月）为业界常见口径，非投资建议。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>现金跑道计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          现金跑道计算器（Burn Rate / Runway Calculator）是一款面向创业者、财务负责人与投资人的在线现金流测算工具。它按 net 口径计算月净消耗（月支出 − 月收入），
          用「现金余额 ÷ 月净消耗」得出跑道月数（Runway），并从今天起算预计耗尽年月；同时支持为支出与收入分别设置月增长率做复利推演，逐月列出未来现金余额，
          按 6 / 12 个月阈值给出危险、注意、健康三档评估，并用月消耗 ±20% 的敏感度对比展示「省 20% 开支能多撑多久」。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Burn Rate 的两种口径：Gross 与 Net</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Burn Rate（烧钱率）指公司每月消耗现金的速度，业界有两种常用口径：Gross Burn（毛烧钱率）只看月总支出、不扣收入，反映「每个月固定要付出去多少」；
          Net Burn（净烧钱率）= 月支出 − 月收入，反映「账上现金每月真实净减少多少」。两者在收入占支出比例较高时差距很大：
          月支出 45 万、收入 15 万的公司，Gross 是 45 万/月，Net 是 30 万/月，对应的跑道相差 1.5 倍。
          本工具按 Net 口径计算（这也是「还能撑几个月」最常见的含义）；如果用于对外融资材料，建议同时标注两种口径，避免歧义。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Runway 多少个月算安全？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>少于 6 个月：危险区。现金流紧急，应立即削减开支或启动过桥 / 融资，此时在谈判桌上议价能力最弱。</li>
          <li>6–12 个月：警戒区。业务尚可，但应启动融资准备——从接触投资人到钱到账，通常需要 3–6 个月。</li>
          <li>超过 12 个月：健康区。通用参考是 18–24 个月更从容，给产品与商业化试错留出缓冲；现金过多也意味着股权稀释，需自行权衡。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么延长现金跑道？</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>降本四板斧：砍掉低 ROI 的投放与渠道费用；压缩非核心人力与办公成本（缓招、远程、缩减场地）；把固定成本变成可变成本（外包、按量付费的云服务）；暂停非紧急的研发与市场项目。</li>
          <li>增收：推动预收与年付回款、聚焦高毛利产品线、清理长期亏损的 SKU 与客户。</li>
          <li>融资节奏：在跑道还剩 9–12 个月时启动新一轮，预留 3–6 个月交割周期；不要等到 6 个月以内才见投资人。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">盈亏平衡点怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          月度盈亏平衡点即「月收入 = 月支出」、净消耗降为 0 的时刻。在本工具的月度推演表里，某一行的月收入首次不低于月支出，就是到达平衡点的月份；
          若此时收入增长率不低于支出增长率，之后不会再跌回净消耗，跑道视为无限（自我造血）。
          反推所需增速：若想在第 n 个月平衡，月收入增长率约需达到 (月支出 ÷ 月收入)^(1/(n−1)) × (1 + 月支出增长率) − 1。
          例如支出 45 万、收入 15 万（3 倍差距）、支出增速 2%，想在第 21 个月平衡，月收入增速约需 7.8%。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">Burn Rate 和 Runway 是什么关系？</h3>
            <p class="text-sm text-muted-foreground mt-1">Burn Rate 是每月消耗现金的速度，本工具按 net 口径（月支出 − 月收入）计算；Runway（现金跑道）= 现金余额 ÷ 月净消耗，即按当前消耗速度账上的钱还能支撑几个月。收入已覆盖支出时净消耗 ≤ 0，跑道视为无限（自我造血）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">现金跑道多少个月算安全？</h3>
            <p class="text-sm text-muted-foreground mt-1">常见参考：少于 6 个月为危险区，应立即削减开支或融资；6–12 个月为警戒区，应启动融资准备（融资周期通常 3–6 个月）；超过 12 个月为健康区，18–24 个月更从容。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么延长现金跑道？</h3>
            <p class="text-sm text-muted-foreground mt-1">三条路：降本（砍低 ROI 投放、压缩非核心人力与办公、固定成本可变化、暂停非紧急项目）、增收（预收年付、聚焦高毛利业务）、把握融资节奏（剩 9–12 个月时启动新一轮，预留 3–6 个月交割期）。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">盈亏平衡点怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">月度盈亏平衡即月收入 = 月支出、净消耗为 0。本工具推演表中某月收入首次不低于支出的月份即平衡点；若收入增长率不低于支出增长率，越过平衡点后跑道视为无限。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'burn-rate-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Flame, CheckCircle, TriangleAlert, RefreshCw,
  ChevronUp, ChevronDown, Info, TrendingDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '现金跑道计算器 - 创业公司 Burn Rate / Runway 在线测算工具',
  description: '免费在线现金跑道计算器：录入现金余额、月支出与月收入，按 net 口径秒算 Runway 月数、预计耗尽年月与健康度档位，支持月增长率复利推演表与 ±20% 开支敏感度对比，帮助创业者安排降本与融资节奏，纯浏览器本地运行不上传',
  keywords: '现金跑道计算器,burn rate计算器,runway计算,资金跑道,创业公司现金流,净消耗率,盈亏平衡点,融资节奏',
  author: '有条工具',
  ogTitle: '现金跑道计算器 - 创业公司 Burn Rate / Runway 在线测算 | 有条工具',
  ogDescription: '秒算创业公司现金跑道：Runway 月数、耗尽年月、健康度档位与逐月推演。',
  ogUrl: 'https://www.util.cn/tools/burn-rate-calculator',
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
          name: '现金跑道计算器',
          url: 'https://www.util.cn/tools/burn-rate-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Net 口径跑道月数测算', '预计现金耗尽年月推算', '月度收支增长率复利推演表', '6/12 个月阈值健康度评估', '月消耗 ±20% 敏感度对比', '载入示例一键演示', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '现金跑道计算器', item: 'https://www.util.cn/tools/burn-rate-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Burn Rate 和 Runway 是什么关系？',
              acceptedAnswer: { '@type': 'Answer', text: 'Burn Rate 是每月消耗现金的速度，本工具按 net 口径（月支出−月收入）计算；Runway（现金跑道）= 现金余额 ÷ 月净消耗，即按当前消耗速度账上的钱还能支撑几个月。收入已覆盖支出时净消耗≤0，跑道视为无限（自我造血）。' }
            },
            {
              '@type': 'Question',
              name: '现金跑道多少个月算安全？',
              acceptedAnswer: { '@type': 'Answer', text: '常见参考：少于6个月为危险区，应立即削减开支或融资；6–12个月为警戒区，应启动融资准备（融资周期通常3–6个月）；超过12个月为健康区，18–24个月更从容。' }
            },
            {
              '@type': 'Question',
              name: '怎么延长现金跑道？',
              acceptedAnswer: { '@type': 'Answer', text: '三条路：降本（砍低ROI投放、压缩非核心人力与办公、固定成本可变化、暂停非紧急项目）、增收（预收年付、聚焦高毛利业务）、把握融资节奏（剩9–12个月时启动新一轮，预留3–6个月交割期）。' }
            },
            {
              '@type': 'Question',
              name: '盈亏平衡点怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '月度盈亏平衡即月收入=月支出、净消耗为0。本工具推演表中某月收入首次不低于支出的月份即平衡点；若收入增长率不低于支出增长率，越过平衡点后跑道视为无限。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const MAX_MONTHS = 120 // 逐月推演的兜底上限

// 跑道月数（静态口径）：净消耗 ≤ 0 视为自我造血（Infinity）；
// 否则 cash / netBurn 向下取整保留 1 位小数，如 300万 ÷ 30万 = 10.0
function runwayOf(cash, netBurn) {
  if (netBurn <= 0) return Infinity
  return Math.floor((cash / netBurn) * 10) / 10
}

// 逐月推演：支出 / 收入按 (1 + 月增长率)^(月序 − 1) 复利迭代
// 耗尽口径：某月扣减净消耗后余额 ≤ 0，即认定现金在该月耗尽（与 runwayOf 的整数结果一致）
// - 耗尽当月返回 { months: n, rows, turnedProfitableAt: null }
// - 收入增长率 ≥ 支出增长率且某月净消耗 ≤ 0（含首月）→ 之后不会跌回净消耗，
//   返回 { months: Infinity, turnedProfitableAt: n }；同时继续收集至多 12 行用于展示盈利趋势
// - MAX_MONTHS 个月仍未耗尽 → { months: null, note: '超过 120 个月未耗尽' }
function projectRunway(cash, expense, revenue, expGrowth, revGrowth, maxMonths = MAX_MONTHS) {
  const eg = expGrowth / 100
  const rg = revGrowth / 100
  const trendMonths = Math.min(12, maxMonths) // 转盈利后仍收集的展示行数
  let balance = cash
  let turnedProfitableAt = null
  const rows = []
  for (let month = 1; month <= maxMonths; month++) {
    const mExpense = expense * Math.pow(1 + eg, month - 1)
    const mRevenue = revenue * Math.pow(1 + rg, month - 1)
    const netBurn = mExpense - mRevenue
    balance -= netBurn
    rows.push({ month, expense: mExpense, revenue: mRevenue, netBurn, cashLeft: balance })
    if (turnedProfitableAt === null && netBurn <= 0 && expGrowth <= revGrowth) {
      turnedProfitableAt = month // 支出增速 ≤ 收入增速：跨过平衡点后不会倒退
    }
    if (turnedProfitableAt === null && balance <= 0) {
      return { months: month, rows, turnedProfitableAt: null, note: null }
    }
    if (turnedProfitableAt !== null && rows.length >= trendMonths) break
  }
  if (turnedProfitableAt !== null) {
    return { months: Infinity, rows, turnedProfitableAt, note: null }
  }
  return { months: null, rows, turnedProfitableAt: null, note: '超过 120 个月未耗尽' }
}

// 耗尽年月：从今天起算 months 个月后的 { year, month }；Infinity / null 返回 null
function exhaustionDateOf(months) {
  if (months === null || months === undefined || !isFinite(months)) return null
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + Math.round(months), 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

// 健康度分档：Infinity 自我造血；<6 危险；6–12（含）注意；>12 健康；null（120+ 未耗尽）视为健康
function judgeHealth(months) {
  if (months === Infinity) return 'self-sustained'
  if (months === null) return 'ok'
  if (months < 6) return 'danger'
  if (months <= 12) return 'warn'
  return 'ok'
}

// 敏感度：现金不变，月净消耗 ±20% 后的跑道三档；净消耗 ≤ 0 时无跑道压力，返回 null
function sensitivityOf(cash, netBurn) {
  if (netBurn <= 0) return null
  return {
    saved: runwayOf(cash, netBurn * 0.8),
    current: runwayOf(cash, netBurn),
    extra: runwayOf(cash, netBurn * 1.2)
  }
}

// 金额输入归一化：非有限数 / 负数 / 空值一律按 0 处理
function numOr0(v) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : 0
}

// 增长率归一化：非有限数按 0，其余夹紧到 [min, max]
function clampRate(v, min, max) {
  const n = Number(v)
  if (!isFinite(n)) return 0
  return Math.min(max, Math.max(min, n))
}

// 金额格式化：满 1 万以「万」为单位（最多 1 位小数），否则按元千分位展示
function formatMoney(yuan) {
  const n = Number(yuan)
  if (!isFinite(n)) return '—'
  if (Math.abs(n) >= 10000) {
    return `${(n / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 1 })} 万`
  }
  return `${Math.round(n).toLocaleString('zh-CN')} 元`
}

// 表格单元格：万元固定 1 位小数，负余额（耗尽当月）按 0 展示
function formatWanFixed(yuan) {
  const n = Number(yuan)
  if (!isFinite(n)) return '—'
  return `${(Math.max(0, n) / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} 万`
}

// 月数格式化：Infinity → ∞，null → —，其余最多 1 位小数千分位
function formatMonths(months) {
  if (months === Infinity) return '∞'
  if (months === null || months === undefined || !isFinite(months)) return '—'
  return months.toLocaleString('zh-CN', { maximumFractionDigits: 1 })
}

// ---------- 输入状态 ----------
// 隐私说明：金额属于敏感财务信息，本工具不写入 localStorage、不做任何持久化；
// 页面无浏览器 API 依赖（日期计算 SSR / 客户端均安全），仅在 onMounted 记录最近使用。
const EXAMPLE = { cash: 3000000, expense: 450000, revenue: 150000, expGrowth: 2, revGrowth: 8 }

const cashYuan = ref(EXAMPLE.cash)
const expenseYuan = ref(EXAMPLE.expense)
const revenueYuan = ref(EXAMPLE.revenue)
const expGrowth = ref(EXAMPLE.expGrowth)
const revGrowth = ref(EXAMPLE.revGrowth)
const advancedOpen = ref(false)
const seoContentVisible = ref(true)

// ---------- 归一化与核心计算 ----------
const cashNum = computed(() => numOr0(cashYuan.value))
const expenseNum = computed(() => numOr0(expenseYuan.value))
const revenueNum = computed(() => numOr0(revenueYuan.value))
const expGrowthNum = computed(() => clampRate(expGrowth.value, -20, 20))
const revGrowthNum = computed(() => clampRate(revGrowth.value, -20, 50))

const netBurn = computed(() => expenseNum.value - revenueNum.value) // 负数 = 月净收入
const runwayMonths = computed(() => runwayOf(cashNum.value, netBurn.value))
const projection = computed(() =>
  projectRunway(cashNum.value, expenseNum.value, revenueNum.value, expGrowthNum.value, revGrowthNum.value)
)

// 大数字卡的跑道：推演判定自我造血时优先显示无限，否则用静态口径
const headlineRunway = computed(() =>
  projection.value.months === Infinity ? Infinity : runwayMonths.value
)
const healthStatus = computed(() => judgeHealth(headlineRunway.value))
const sensitivity = computed(() => sensitivityOf(cashNum.value, netBurn.value))
const isInputEmpty = computed(() => cashNum.value === 0 && expenseNum.value === 0 && revenueNum.value === 0)

const amountWarning = computed(() => {
  const raws = [cashYuan.value, expenseYuan.value, revenueYuan.value]
  const bad = raws.some((v) => {
    if (v === '' || v === null || v === undefined) return false
    const n = Number(v)
    return !isFinite(n) || n < 0
  })
  return bad ? '金额需为不小于 0 的数字，异常输入已按 0 处理。' : ''
})

// ---------- 展示视图 ----------
const netBurnView = computed(() => {
  if (netBurn.value > 0) {
    return { label: '月净消耗', sign: '-', value: formatMoney(netBurn.value), cls: 'text-red-600', box: 'bg-red-500/10' }
  }
  if (netBurn.value < 0) {
    return { label: '月净收入', sign: '+', value: formatMoney(-netBurn.value), cls: 'text-green-600', box: 'bg-green-500/10' }
  }
  return { label: '月净消耗', sign: '', value: '0 元', cls: 'text-muted-foreground', box: 'bg-muted/50' }
})

const runwayView = computed(() => {
  if (headlineRunway.value === Infinity) {
    return { infinite: true, text: '自我造血 ✓', cls: 'text-green-600', sub: '收入已覆盖支出，现金不再净流出' }
  }
  return { infinite: false, text: formatMonths(headlineRunway.value), cls: 'text-primary', sub: '现金余额 ÷ 月净消耗（net 口径）' }
})

const exhaustionText = computed(() => {
  const m = projection.value.months
  if (m === Infinity) return '不会耗尽'
  if (m === null) return '120 个月以上'
  const d = exhaustionDateOf(m)
  return d ? `${d.year} 年 ${d.month} 月` : '—'
})

const healthMeta = {
  danger: {
    icon: TriangleAlert,
    cls: 'bg-red-500/10 border-red-500/20 text-red-600',
    title: '危险',
    text: '跑道不足 6 个月：现金流紧急，优先削减开支或立即融资。'
  },
  warn: {
    icon: TriangleAlert,
    cls: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
    title: '注意',
    text: '跑道 6-12 个月：启动融资准备，融资周期通常 3-6 个月。'
  },
  ok: {
    icon: CheckCircle,
    cls: 'bg-green-500/10 border-green-500/20 text-green-600',
    title: '健康',
    text: '跑道超过 12 个月：健康区间（通用参考 18-24 个月更从容）。'
  },
  'self-sustained': {
    icon: CheckCircle,
    cls: 'bg-green-500/10 border-green-500/20 text-green-600',
    title: '自我造血',
    text: '业务已覆盖支出，现金不再净流出，无跑道压力。'
  }
}

// 推演表：前 12 行，耗尽当月高亮
const tableRows = computed(() =>
  projection.value.rows.slice(0, 12).map((r) => ({
    month: r.month,
    expenseText: formatWanFixed(r.expense),
    revenueText: formatWanFixed(r.revenue),
    cashText: formatWanFixed(r.cashLeft),
    exhausted: projection.value.months === r.month
  }))
)

const overflowNote = computed(() => {
  const p = projection.value
  const hidden = p.rows.length - 12
  if (hidden <= 0) return ''
  const tail = p.months === Infinity
    ? `第 ${p.turnedProfitableAt} 个月起转为净收入`
    : p.months === null
      ? '已推演 120 个月仍未耗尽'
      : `第 ${p.months} 个月现金耗尽`
  return `已省略后续 ${hidden} 个月（${tail}）`
})

const tableSummary = computed(() => {
  const p = projection.value
  if (p.months === Infinity) {
    return p.turnedProfitableAt === 1
      ? '首月起收入即覆盖支出（自我造血），上表为盈利趋势。'
      : `第 ${p.turnedProfitableAt} 个月起收入覆盖支出，此后现金逐月转增，上表为盈利趋势。`
  }
  if (p.months === null) {
    return '按当前增长率逐月推演 120 个月现金仍未耗尽，跑道极长。'
  }
  return `按当前增长率逐月推演，第 ${p.months} 个月现金耗尽（预计 ${exhaustionText.value}）。`
})

// ---------- 操作 ----------
function loadExample() {
  cashYuan.value = EXAMPLE.cash
  expenseYuan.value = EXAMPLE.expense
  revenueYuan.value = EXAMPLE.revenue
  expGrowth.value = EXAMPLE.expGrowth
  revGrowth.value = EXAMPLE.revGrowth
}

function resetAll() {
  cashYuan.value = 0
  expenseYuan.value = 0
  revenueYuan.value = 0
  expGrowth.value = 0
  revGrowth.value = 0
  advancedOpen.value = false
}

const toggleAdvanced = () => { advancedOpen.value = !advancedOpen.value }
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('burn-rate-calculator')
})
</script>
