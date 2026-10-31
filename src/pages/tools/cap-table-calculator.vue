<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <PieChart class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">股权稀释计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">多轮融资 Cap Table 推演：期权池扩出与投资人进场后，创始团队持股逐轮变化一目了然</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线股权稀释计算器：录入创始团队持股与融资前预留的期权池，再逐轮添加天使轮、A 轮等融资事件，按等比稀释公式推演每一轮结束后的完整股权结构表（Cap Table），
        实时给出创始团队合计、期权池与投资人占比，并按 50% 相对控制线、34% 否决线给出控制权提示。支持一键载入示例与导出 CSV（带 BOM，Excel 直接打开不乱码），
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <PieChart class="w-5 h-5 mr-2 text-primary" /> 股东与融资设置
        </h2>

        <!-- 初始股东表 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">初始股东（创始团队）</label>
            <span class="text-xs font-mono" :class="holderCheck.valid ? 'text-green-600' : 'text-red-500'">
              合计 {{ holderCheck.total.toFixed(1) }}%
            </span>
          </div>
          <div class="space-y-2">
            <div v-for="(h, i) in holders" :key="h.id" class="flex items-center gap-2">
              <input
                v-model="h.name"
                type="text"
                placeholder="姓名"
                class="flex-1 min-w-0 px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                :class="rowErrorClass(i)"
              />
              <input
                v-model.number="h.pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="%"
                class="w-20 px-2.5 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                :class="rowErrorClass(i)"
              />
              <span class="text-xs text-muted-foreground flex-shrink-0 w-3">%</span>
              <button
                @click="removeHolder(i)"
                class="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition flex-shrink-0"
                :aria-label="'删除股东 ' + (h.name || i + 1)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            @click="addHolder"
            class="w-full mt-2 px-3 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition flex items-center justify-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" /> 添加股东
          </button>
          <p v-if="!holderCheck.valid" class="mt-2 text-xs leading-relaxed text-red-500 p-2 rounded bg-red-500/10 flex items-start gap-1.5">
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ holderHint }}</span>
          </p>
          <p v-else class="mt-2 text-xs text-green-600 flex items-center gap-1">
            <CheckCircle class="w-3.5 h-3.5 flex-shrink-0" />
            <span>合计 {{ holderCheck.total.toFixed(1) }}% ✓</span>
          </p>
        </div>

        <!-- 期权池 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">期权池（融资前预留，0-30）</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="poolPct"
              type="number"
              min="0"
              max="30"
              step="1"
              class="w-24 px-3 py-2 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span class="text-xs text-muted-foreground">%</span>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-1.5 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>口径：融资前从创始团队按比例稀释扩出期权池，投资人不承担池子成本（对创始人更保守）。</span>
          </p>
        </div>

        <!-- 融资轮次 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-foreground">融资轮次</label>
            <button
              @click="addRound"
              class="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" /> 添加轮次
            </button>
          </div>
          <div class="space-y-3">
            <div v-for="(r, i) in rounds" :key="r.id" class="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
              <div class="flex items-center gap-2">
                <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">第 {{ i + 1 }} 轮</span>
                <input
                  v-model="r.name"
                  type="text"
                  placeholder="轮次名，如：天使轮"
                  class="flex-1 min-w-0 px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  @click="removeRound(i)"
                  class="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition flex-shrink-0"
                  :aria-label="'删除轮次 ' + (r.name || i + 1)"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-xs text-muted-foreground flex-shrink-0">新投资人获得</label>
                <input
                  v-model.number="r.investorPct"
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  placeholder="0-60"
                  class="w-20 px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span class="text-xs text-muted-foreground flex-shrink-0">%</span>
                <input
                  v-model="r.amount"
                  type="text"
                  placeholder="融资额（选填，仅记录）"
                  class="flex-1 min-w-0 px-2.5 py-1.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-2 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>新投资人占比 = 融资额 ÷ 投后估值得出，此处直接填融资后占比（0-60）；融资额仅作展示记录，不参与计算。占比留空或为 0 的轮次不进入推演。</span>
          </p>
        </div>

        <!-- 操作 -->
        <div class="grid grid-cols-3 gap-2 pt-1">
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
          <button
            @click="exportCsv"
            class="px-3 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            导出 CSV
          </button>
        </div>
      </div>

      <!-- 右侧：推演结果（占两列） -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingDown class="w-5 h-5 mr-2 text-primary" /> 稀释推演结果
          </h2>
          <span class="text-xs text-muted-foreground hidden sm:block">共 {{ result.stages.length }} 个阶段</span>
        </div>

        <template v-if="holderCheck.valid">
          <!-- 结论卡：3 个数字 -->
          <div class="bg-primary/10 rounded-lg p-4 text-center">
            <p class="text-xs text-muted-foreground mb-1">创始团队当前合计（{{ finalStage.name }}后）</p>
            <p class="text-3xl font-bold text-primary">{{ finalStage.foundersPct.toFixed(2) }}%</p>
            <p class="text-xs text-primary mt-1">
              自初始 {{ result.stages[0].foundersPct.toFixed(2) }}% 以来累计稀释
              {{ (result.stages[0].foundersPct - finalStage.foundersPct).toFixed(2) }} 个百分点
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">期权池</p>
              <p class="text-sm font-bold text-foreground">{{ poolNow.toFixed(2) }}%</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3 text-center">
              <p class="text-[10px] text-muted-foreground mb-1">投资人合计</p>
              <p class="text-sm font-bold text-foreground">{{ investorsNow.toFixed(2) }}%</p>
            </div>
          </div>

          <!-- 控制权提示条（三档判定） -->
          <p class="text-xs leading-relaxed p-2.5 rounded flex items-start gap-1.5" :class="controlMeta[controlLevel].barClass">
            <TriangleAlert v-if="controlLevel !== 'ok'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <CheckCircle v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ controlMeta[controlLevel].message }}</span>
          </p>

          <!-- 每阶段一张表格卡：行 = 股东 + 期权池 + 已进投资人 -->
          <div class="space-y-3">
            <div v-for="(stage, si) in result.stages" :key="si" class="border border-border rounded-lg overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-sm font-semibold text-foreground">{{ stage.name }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" :class="stageBadge(si).class">{{ stageBadge(si).label }}</span>
                  <span v-if="roundAmountOf(stage.name)" class="text-xs text-muted-foreground truncate">融资额 {{ roundAmountOf(stage.name) }}</span>
                </div>
                <span class="text-xs text-muted-foreground flex-shrink-0 ml-2">创始团队 {{ stage.foundersPct.toFixed(2) }}%</span>
              </div>
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs text-muted-foreground border-b border-border">
                    <th class="px-4 py-2 text-left font-medium">股东</th>
                    <th class="px-4 py-2 text-right font-medium">{{ stageColLabel(si) }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in stage.rows" :key="ri" class="border-b border-border/40 last:border-0">
                    <td class="px-4 py-1.5" :class="rowClassOf(row)">{{ row.holder }}</td>
                    <td class="px-4 py-1.5 text-right font-mono" :class="rowClassOf(row)">{{ row.pct.toFixed(2) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <div v-else class="text-center text-muted-foreground py-16">
          <TriangleAlert class="w-10 h-10 mx-auto mb-3 text-yellow-500" />
          <p class="text-sm">请先在左侧完善股东信息：每人姓名非空、持股大于 0 且不超过 100，合计为 100%。</p>
          <p class="text-xs text-muted-foreground/70 mt-1">也可以点击「载入示例」先看一个 3 创始人 + 期权池 + 两轮融资的完整推演。</p>
        </div>
      </div>
    </div>

    <!-- 免责小字（页面固定） -->
    <p class="text-xs text-muted-foreground leading-relaxed mb-8 flex items-start gap-1.5">
      <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <span>本工具为简化模型：未考虑反稀释条款、可转债/SAFE 转换、员工行权、对赌回购等复杂结构，结果仅供理解稀释概念，实际 cap table 请以律师与 FA 出具为准。</span>
    </p>

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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>股权稀释与 Cap Table</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          股权稀释计算器是一款面向创始人的在线 Cap Table 推演工具。输入创始团队初始持股、融资前预留的期权池比例与各轮融资轮次（新投资人获得的融资后占比），
          按等比稀释公式逐轮计算每位股东、期权池与投资人的持股变化，并按 67% 完全控制线、51% 相对控制线、34% 否决线给出控制权参考判定。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">股权稀释怎么计算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          融资引入新股东采用<b class="text-foreground">等比稀释</b>：新投资人获得 p% 的融资后占比，所有原股东（含期权池与已进投资人）持股同步乘以 (1 - p%)。
          例如创始人持股 55%，天使轮出让 15% 后变为 55% × 0.85 = 46.75%，再经 A 轮出让 20% 变为 46.75% × 0.8 = 37.4%。
          多轮融资就是把每轮的 (1 - 新股比例) 连乘；期权池同理，本工具在融资前先按 (1 - 池子比例) 对创始团队等比扩出，随后每一轮期权池也和股东一样被稀释。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">期权池融资前扩还是融资后扩？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          业界两种口径都存在，差异在于「池子由谁买单」：<b class="text-foreground">融资前扩池</b>（本工具采用）是在融资交易前先把期权池从创始团队按比例稀释出来，
          新投资人的占比不受影响，池子成本全部由创始人承担，对创始人更保守；<b class="text-foreground">融资后扩池</b>则是融资完成后再从全体股东（含新投资人）按比例扩出，
          创始人稀释更少。两种口径都常见，取决于条款谈判，签署前务必确认 term sheet 写明期权池口径与是否「pre-money」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">创始人持股多少算安全？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          通用参考口径（以《公司法》表决机制为背景）：<b class="text-foreground">67% 完全控制</b>——修改章程、增资减资、合并分立解散等特别决议需 2/3 以上表决权通过，
          持股不低于 2/3 可单方通过；<b class="text-foreground">51% 相对控制</b>——选举董事、利润分配等普通决议需过半数通过；
          <b class="text-foreground">34% 否决线</b>——持股不低于 1/3 即可否决任何特别决议，低于 1/3 则对重大事项失去否决权。
          这只是参考口径，实际控制权还取决于董事会席位、一致行动协议、AB 股（同股不同权）等安排。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">Cap table 是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          Cap table（Capitalization Table，股权结构表）记录公司在某一时点全部股东及其持股比例，包括创始团队、员工期权池与各轮投资人，
          并随融资、行权、股权转让不断更新，是融资谈判、股权激励与退出分配的基础文件。本工具生成的是简化推演版，
          未考虑反稀释条款、可转债/SAFE 转换、员工行权、对赌回购等复杂结构，实际 cap table 请以律师与 FA 出具为准。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">股权稀释怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">等比稀释：新投资人获得 p% 融资后占比，原股东持股乘以 (1 - p%)，多轮融资逐轮连乘。例：55% 经天使轮 15%、A 轮 20% 两轮后为 55% × 0.85 × 0.8 = 37.4%；若融资前先扩 10% 期权池，则为 55% × 0.9 × 0.85 × 0.8 = 33.66%。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">期权池应该在融资前还是融资后预留？</h3>
            <p class="text-sm text-muted-foreground mt-1">两种口径业界都有。融资前扩池由创始人承担全部池子成本（对创始人更不利、更保守），融资后扩池由全体股东共同承担、创始人稀释更少。本工具采用融资前口径，便于按谈判最不利情形留安全边际。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">创始人持股多少比较安全？</h3>
            <p class="text-sm text-muted-foreground mt-1">通用参考：67% 为完全控制线（可单方通过修改章程等 2/3 特别决议），51% 为相对控制线（普通决议过半数），34% 为否决线（低于 1/3 对特别决议失去否决权）。实际以公司章程与股东协议为准。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">本工具的结果可以直接作为融资依据吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不能。本工具为简化模型：未考虑反稀释条款、可转债/SAFE 转换、员工行权、对赌回购等复杂结构，结果仅供理解稀释概念，实际 cap table 请以律师与 FA 出具为准。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'cap-table-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  PieChart, CheckCircle, TriangleAlert, RefreshCw,
  ChevronUp, ChevronDown, Info, Plus, X, TrendingDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '股权稀释计算器 - 多轮融资 Cap Table 在线推演工具',
  description: '免费在线股权稀释计算器：录入创始团队持股与期权池（融资前扩池口径），逐轮添加融资轮次，按等比稀释公式推演每轮后的 Cap Table，实时给出创始团队、期权池与投资人占比，附 67%/51%/34% 控制权参考线与 CSV 导出，纯浏览器本地计算不上传',
  keywords: '股权稀释计算器,股权稀释怎么计算,cap table,期权池,融资稀释,创始人持股,融资后占股,Cap Table 推演',
  author: '有条工具',
  ogTitle: '股权稀释计算器 - 多轮融资 Cap Table 在线推演工具 | 有条工具',
  ogDescription: '期权池与多轮融资逐轮推演，创始团队持股变化与控制权三档判定一目了然。',
  ogUrl: 'https://www.util.cn/tools/cap-table-calculator',
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
          name: '股权稀释计算器',
          url: 'https://www.util.cn/tools/cap-table-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['多轮融资等比稀释推演', '期权池融资前扩池口径', '创始团队控制权三档判定（50%/34%）', '各轮 Cap Table 明细表', 'CSV 导出（带 BOM）', '纯本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '股权稀释计算器', item: 'https://www.util.cn/tools/cap-table-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '股权稀释怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '等比稀释：新投资人获得p%融资后占比，原股东持股乘以(1-p%)，多轮融资逐轮连乘。例：55%经天使轮15%、A轮20%两轮后为55%×0.85×0.8=37.4%；若融资前先扩10%期权池，则为55%×0.9×0.85×0.8=33.66%。' }
            },
            {
              '@type': 'Question',
              name: '期权池应该在融资前还是融资后预留？',
              acceptedAnswer: { '@type': 'Answer', text: '两种口径业界都有。融资前扩池由创始人承担全部池子成本（对创始人更不利、更保守），融资后扩池由全体股东共同承担、创始人稀释更少。本工具采用融资前口径，便于按最不利情形留安全边际。' }
            },
            {
              '@type': 'Question',
              name: '创始人持股多少比较安全？',
              acceptedAnswer: { '@type': 'Answer', text: '通用参考：67%为完全控制线（可单方通过修改章程等2/3特别决议），51%为相对控制线（普通决议过半数），34%为否决线（低于1/3对特别决议失去否决权）。实际以公司章程与股东协议为准。' }
            },
            {
              '@type': 'Question',
              name: '本工具的结果可以直接作为融资依据吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不能。本工具为简化模型：未考虑反稀释条款、可转债/SAFE转换、员工行权、对赌回购等复杂结构，结果仅供理解稀释概念，实际cap table请以律师与FA出具为准。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 保留 2 位小数（规避浮点误差：Math.round(x*100)/100）
function round2(x) {
  return Math.round(x * 100) / 100
}

// 把任意输入收敛到 [0, 100] 的百分比，非法输入（NaN/Infinity/空串）按 0 处理
function clamp100(v) {
  const n = Number(v)
  if (!isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

// 股东姓名归一：空名回退为「股东N」
function holderNameOf(h, i) {
  const raw = h && typeof h.name === 'string' ? h.name.trim() : ''
  return raw || `股东${i + 1}`
}

// 归一化股东表：空名回退、重名追加序号、pct 收敛到 [0,100]，返回精确值行
function normalizeHolders(holders) {
  const seen = {}
  return (Array.isArray(holders) ? holders : []).map((h, i) => {
    let name = holderNameOf(h, i)
    if (seen[name]) {
      seen[name] += 1
      name = `${name}（${seen[name]}）`
    } else {
      seen[name] = 1
    }
    return { holder: name, pct: clamp100(h && h.pct), isPool: false, isInvestor: false }
  })
}

// 股东表校验：姓名非空、每人 (0, 100]、合计 100%（99.99-100.01 浮点容差）
// 返回 { valid, total, totalOk, rowErrors[] }，rowErrors[i] 为 true 表示第 i 行不合格（红字标红）
function validateHolders(holders) {
  const list = Array.isArray(holders) ? holders : []
  const rowErrors = list.map((h) => {
    const name = h && typeof h.name === 'string' ? h.name.trim() : ''
    const pct = Number(h && h.pct)
    return name === '' || !isFinite(pct) || !(pct > 0) || pct > 100
  })
  const total = round2(list.reduce((s, h) => s + (Number(h && h.pct) || 0), 0))
  const totalOk = total >= 99.99 && total <= 100.01
  return { valid: totalOk && rowErrors.every((e) => !e), total, totalOk, rowErrors }
}

// 期权池扩出（融资前口径）：所有股东持股 ×(1 - pool/100)，期权池作为独立行加入
// 返回精确值（未取整），展示层用 round2 取整
function expandPool(holders, poolPct) {
  const pool = clamp100(poolPct)
  const rows = normalizeHolders(holders).map((r) => ({
    holder: r.holder,
    pct: r.pct * (1 - pool / 100),
    isPool: false,
    isInvestor: false
  }))
  rows.push({ holder: '期权池', pct: pool, isPool: true, isInvestor: false })
  return rows
}

// 轮次清洗：空名回退为「第N轮」，pct 收敛到 [0,100]，占比非正的轮次不进入推演
function cleanRounds(rounds) {
  return (Array.isArray(rounds) ? rounds : [])
    .map((r, i) => ({
      name: r && typeof r.name === 'string' && r.name.trim() ? r.name.trim() : `第${i + 1}轮`,
      pct: clamp100(r && r.investorPct)
    }))
    .filter((r) => r.pct > 0)
}

// 由精确行构造一个展示阶段：rows 取整到 2 位小数，foundersPct 为创始团队精确合计取整
function stageOf(name, rows) {
  return {
    name,
    rows: rows.map((r) => ({ holder: r.holder, pct: round2(r.pct), isPool: r.isPool, isInvestor: r.isInvestor })),
    foundersPct: round2(rows.filter((r) => !r.isPool && !r.isInvestor).reduce((s, r) => s + r.pct, 0))
  }
}

// 核心推演：dilute(holders, poolPct, rounds)
// 1. expandPool 得到带期权池的初始表（融资前从创始团队按比例稀释扩出）；
// 2. 每轮：全员持股 ×(1-roundPct/100)，新增「轮次名（投资人）」行 = roundPct；
// 3. 返回 { stages: [{ name: '初始'/'期权池后'/轮次名, rows: [{holder,pct,isPool,isInvestor}], foundersPct }] }，pct 保留 2 位小数
function dilute(holders, poolPct, rounds) {
  const pool = clamp100(poolPct)
  const stages = []

  // 阶段一「初始」：原始股东表
  stages.push(stageOf('初始', normalizeHolders(holders)))

  // 阶段二「期权池后」：融资前扩出期权池
  let work = expandPool(holders, pool)
  stages.push(stageOf('期权池后', work))

  // 阶段三起：每一轮融资，全员等比稀释后追加投资人行（内部链路保持精确值，仅展示取整）
  cleanRounds(rounds).forEach((rd) => {
    work = work.map((r) => ({ ...r, pct: r.pct * (1 - rd.pct / 100) }))
    work = work.concat([{ holder: `${rd.name}（投资人）`, pct: rd.pct, isPool: false, isInvestor: true }])
    stages.push(stageOf(rd.name, work))
  })

  return { stages }
}

// 创始团队控制权三档判定：≥50 相对控股；34~50 关注控制权；<34 失去特别决议否决权
function judgeControl(foundersPct) {
  const p = Number(foundersPct) || 0
  if (p < 34) return 'danger'
  if (p < 50) return 'warn'
  return 'ok'
}

// 导出 CSV：每轮一列（股东,初始,期权池后,天使轮后,A轮后），带 BOM，Excel 直接打开不乱码
function buildCapCsv(stages) {
  const list = Array.isArray(stages) ? stages : []
  const names = []
  const seen = new Set()
  list.forEach((st) => (st.rows || []).forEach((r) => {
    if (!seen.has(r.holder)) {
      seen.add(r.holder)
      names.push(r.holder)
    }
  }))
  // 列名：初始 / 期权池后 / 轮次名+后
  const colName = (st, i) => (i >= 2 ? `${st.name}后` : st.name)
  const esc = (v) => {
    const s = String(v)
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const lines = []
  lines.push(['股东'].concat(list.map((st, i) => colName(st, i))).map(esc).join(','))
  names.forEach((nm) => {
    lines.push([nm].concat(list.map((st) => {
      const row = (st.rows || []).find((r) => r.holder === nm)
      return row ? row.pct : ''
    })).map(esc).join(','))
  })
  return '\uFEFF' + lines.join('\r\n')
}

// ---------- 提示文案与徽标 ----------
const controlMeta = {
  ok: {
    barClass: 'bg-green-500/10 text-green-600',
    message: '创始团队合计不低于 50%，仍保持相对控股地位；若达到 67%（2/3）则可单方通过修改章程等特别决议。'
  },
  warn: {
    barClass: 'bg-yellow-500/10 text-yellow-600',
    message: '已低于 50%，重大事项（增资、合并等）需特别关注控制权安排（一致行动协议、AB 股等超出本工具范围）。'
  },
  danger: {
    barClass: 'bg-red-500/10 text-red-600',
    message: '低于三分之一，对公司重大决策（修改章程等 2/3 表决事项）已无否决权。'
  }
}

// ---------- 页面状态 ----------
let uid = 0

function createExampleHolders() {
  return [
    { id: ++uid, name: '张三', pct: 55 },
    { id: ++uid, name: '李四', pct: 30 },
    { id: ++uid, name: '王五', pct: 15 }
  ]
}

function createExampleRounds() {
  return [
    { id: ++uid, name: '天使轮', investorPct: 15, amount: '' },
    { id: ++uid, name: 'A 轮', investorPct: 20, amount: '' }
  ]
}

const holders = ref(createExampleHolders())
const poolPct = ref(10)
const rounds = ref(createExampleRounds())
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 计算与展示派生 ----------
const holderCheck = computed(() => validateHolders(holders.value))

const holderHint = computed(() => {
  const parts = []
  const badRows = holderCheck.value.rowErrors.filter(Boolean).length
  if (badRows) parts.push(`${badRows} 行姓名为空或持股不在 (0, 100] 区间（已标红）`)
  if (!holderCheck.value.totalOk) parts.push(`合计持股应为 100%，当前 ${holderCheck.value.total.toFixed(1)}%`)
  return parts.join('；')
})

const result = computed(() => dilute(holders.value, poolPct.value, rounds.value))

const finalStage = computed(() => {
  const stages = result.value.stages
  return stages[stages.length - 1]
})

const poolNow = computed(() => {
  const row = finalStage.value.rows.find((r) => r.isPool)
  return row ? row.pct : 0
})

const investorsNow = computed(() =>
  round2(finalStage.value.rows.filter((r) => r.isInvestor).reduce((s, r) => s + r.pct, 0))
)

const controlLevel = computed(() => judgeControl(finalStage.value.foundersPct))

// ---------- 行/列样式（创始团队加粗、期权池灰字、投资人高亮） ----------
function rowClassOf(row) {
  if (row.isPool) return 'text-muted-foreground'
  if (row.isInvestor) return 'text-primary'
  return 'text-foreground font-semibold'
}

function rowErrorClass(i) {
  return holderCheck.value.rowErrors[i] ? 'border-red-400' : ''
}

function stageColLabel(si) {
  if (si === 0) return '初始持股'
  if (si === 1) return '扩池后持股'
  return '本轮后持股'
}

function stageBadge(si) {
  if (si === 0) return { label: '起点', class: 'bg-muted text-muted-foreground' }
  if (si === 1) return { label: '扩池', class: 'bg-yellow-500/10 text-yellow-600' }
  return { label: '融资轮', class: 'bg-primary/10 text-primary' }
}

// 阶段名对应的融资额（仅展示记录）；轮次名留空的回退名匹配不到则不展示
function roundAmountOf(name) {
  const r = rounds.value.find((x) => (x.name || '').trim() === name && String(x.amount ?? '').trim() !== '')
  return r ? String(r.amount).trim() : ''
}

// ---------- 行与轮次的增删 ----------
function addHolder() {
  holders.value.push({ id: ++uid, name: '', pct: '' })
}

function removeHolder(i) {
  holders.value.splice(i, 1)
}

function addRound() {
  rounds.value.push({ id: ++uid, name: '', investorPct: '', amount: '' })
}

function removeRound(i) {
  rounds.value.splice(i, 1)
}

// ---------- 示例与重置 ----------
function loadExample() {
  holders.value = createExampleHolders()
  poolPct.value = 10
  rounds.value = createExampleRounds()
}

function resetAll() {
  holders.value = [
    { id: ++uid, name: '', pct: '' },
    { id: ++uid, name: '', pct: '' }
  ]
  poolPct.value = 10
  rounds.value = [
    { id: ++uid, name: '天使轮', investorPct: '', amount: '' },
    { id: ++uid, name: 'A 轮', investorPct: '', amount: '' }
  ]
}

// ---------- 导出 CSV（浏览器 API 仅在用户回调中触发，SSR 安全） ----------
function exportCsv() {
  try {
    const csv = buildCapCsv(result.value.stages)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cap-table.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    // 导出失败静默降级，不影响页面其他功能
  }
}

onMounted(() => {
  addRecentTool('cap-table-calculator')
})
</script>
