<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Repeat2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">LTV/CAC 计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">算清一个客户值多少钱（LTV）、花多少钱获取（CAC）、多久回本——订阅制与复购生意的单位经济三件套</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线 LTV/CAC 计算器：输入 ARPU（月均客单价或月费）与毛利率，支持两种 LTV 口径——简单口径（ARPU × 平均留存月数）适合凭经验估计的复购生意，
        留存曲线口径（ARPU × 毛利率 ÷ 月流失率）是订阅制标准，流失 5% 即平均生命周期 20 个月；选填获客成本 CAC 与月新增客户数后，
        即时给出 LTV/CAC 倍数与四档判定（亏损模式 / 偏紧 / 健康 / 优秀）、回本月数与月度获客支出，并附流失率 ±1pp 敏感度对照表。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 输入参数
        </h2>

        <div>
          <label for="ltv-arpu" class="text-sm font-medium text-foreground">ARPU（元 / 月）</label>
          <input
            id="ltv-arpu"
            v-model.number="arpuInput"
            type="number"
            min="0.01"
            step="1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">每月从单个客户获得的平均收入：订阅月费或月均客单价，如 99</p>
        </div>

        <div>
          <label for="ltv-margin" class="text-sm font-medium text-foreground">毛利率（%）</label>
          <input
            id="ltv-margin"
            v-model.number="marginInput"
            type="number"
            min="1"
            max="100"
            step="1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">服务单个客户的毛利占比：纯软件可按 100，含服务 / 硬件成本按实际填，如 80</p>
        </div>

        <div>
          <p class="text-sm font-medium text-foreground">LTV 口径</p>
          <div class="flex rounded-lg border border-border overflow-hidden mt-1.5" role="group" aria-label="LTV 口径切换">
            <button
              type="button"
              @click="ltvMode = 'simple'"
              class="flex-1 px-2 py-1.5 text-xs font-medium transition"
              :class="ltvMode === 'simple' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              简单口径（留存月数）
            </button>
            <button
              type="button"
              @click="ltvMode = 'churn'"
              class="flex-1 px-2 py-1.5 text-xs font-medium transition"
              :class="ltvMode === 'churn' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'"
            >
              留存曲线口径（流失率）
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1">{{ modeHint }}</p>
        </div>

        <div v-if="ltvMode === 'simple'">
          <label for="ltv-months" class="text-sm font-medium text-foreground">平均留存月数</label>
          <input
            id="ltv-months"
            v-model.number="monthsInput"
            type="number"
            min="1"
            max="120"
            step="1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">客户平均停留在付费状态多少个月（1–120），凭历史数据或经验估计</p>
        </div>
        <div v-else>
          <label for="ltv-churn" class="text-sm font-medium text-foreground">月流失率（%）</label>
          <input
            id="ltv-churn"
            v-model.number="churnInput"
            type="number"
            min="0.5"
            max="50"
            step="0.1"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">{{ churnHint }}</p>
        </div>

        <div>
          <label for="ltv-cac" class="text-sm font-medium text-foreground">CAC 获客成本（元，选填）</label>
          <input
            id="ltv-cac"
            v-model.number="cacInput"
            type="number"
            min="0"
            step="10"
            placeholder="如 600"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">广告 + 市场 + 销售人力与佣金，摊到单个新客户身上的总成本</p>
        </div>

        <div>
          <label for="ltv-newcust" class="text-sm font-medium text-foreground flex items-center">
            <Users class="w-3.5 h-3.5 mr-1 text-muted-foreground" /> 月新增客户数（选填）
          </label>
          <input
            id="ltv-newcust"
            v-model.number="newCustInput"
            type="number"
            min="1"
            step="1"
            placeholder="如 50"
            class="w-full mt-1.5 px-3 py-2 bg-background border border-border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
          <p class="text-xs text-muted-foreground mt-1">用于估算月度获客支出（CAC × 月新增）的烧钱视角</p>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            @click="loadExample"
            class="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetInputs"
            class="flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          示例口径：ARPU 99 元 / 月 · 毛利率 80% · 月流失率 5% · CAC 600 元 → LTV = 99 × 0.8 × 20 = 1,584 元，LTV/CAC ≈ 2.6x（偏紧），回收期 7.6 个月。
        </p>
      </div>

      <!-- 右：结果区（占两列） -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 单位经济结论
          </h2>

          <template v-if="arpuNum !== null">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">客户生命周期价值 LTV</p>
                <p class="text-4xl sm:text-5xl font-bold text-primary leading-tight">
                  {{ fmtMoney(ltv) }}<span class="text-sm font-normal text-muted-foreground ml-1">元</span>
                </p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">{{ ltvFormulaText }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center flex flex-col justify-center">
                <p class="text-xs text-muted-foreground mb-1">平均生命周期</p>
                <p class="text-2xl font-bold text-foreground leading-tight">
                  {{ fmtNum1(lifetime) }}<span class="text-xs font-normal text-muted-foreground ml-1">个月</span>
                </p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">{{ lifetimeNote }}</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center flex flex-col justify-center">
                <p class="text-xs text-muted-foreground mb-1">获客成本 CAC</p>
                <p v-if="cacNum !== null" class="text-2xl font-bold text-foreground leading-tight">
                  {{ fmtMoney(cacNum) }}<span class="text-xs font-normal text-muted-foreground ml-1">元</span>
                </p>
                <p v-else class="text-2xl font-bold text-muted-foreground leading-tight">—</p>
                <p class="text-xs text-muted-foreground mt-1">{{ cacNum !== null ? '单个新客户的获取总成本' : '选填后可算倍数与回收期' }}</p>
              </div>
            </div>

            <div v-if="ratioMeta" class="mt-4 p-4 rounded-lg border" :class="ratioMeta.card">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-xs text-muted-foreground mb-1">LTV / CAC 倍数</p>
                  <p class="text-3xl font-bold leading-tight" :class="ratioMeta.text">{{ fmtRatio(ratio) }}</p>
                </div>
                <span class="inline-block px-3 py-1.5 rounded-full border text-sm font-semibold" :class="ratioMeta.badge">{{ ratioMeta.label }}</span>
              </div>
              <p class="text-xs text-muted-foreground mt-2">{{ ratioMeta.desc }}</p>
            </div>
            <p v-else class="mt-4 text-xs text-muted-foreground">选填「CAC 获客成本」后，这里会给出 LTV/CAC 倍数与四档判定（亏损模式 / 偏紧 / 健康 / 优秀）。</p>

            <div class="flex flex-wrap gap-2 mt-4">
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">{{ modeChip }}</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">ARPU {{ fmtMoney(arpuNum) }} 元 / 月</span>
              <span class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">毛利率 {{ fmtNum1(marginNum) }}%</span>
              <span v-if="cacNum !== null" class="px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">CAC {{ fmtMoney(cacNum) }} 元</span>
            </div>
          </template>

          <div v-else class="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <TriangleAlert class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-foreground">请先填写 ARPU</p>
              <p class="text-xs text-muted-foreground mt-1">月均客单价或月费是两种口径的公共输入，填写后即可得到 LTV 与全套结论。</p>
            </div>
          </div>
        </div>

        <!-- 回收期与获客支出卡 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <RefreshCw class="w-5 h-5 mr-2 text-primary" /> 回收期与获客支出
          </h2>

          <template v-if="cacNum !== null && arpuNum !== null">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-primary/10 rounded-lg p-4 text-center">
                <p class="text-xs text-muted-foreground mb-1">CAC 回收期</p>
                <p class="text-3xl font-bold leading-tight" :class="paybackMonths <= 12 ? 'text-primary' : 'text-amber-600'">
                  {{ fmtNum1(paybackMonths) }}<span class="text-xs font-normal text-muted-foreground ml-1">个月回本</span>
                </p>
                <p class="text-xs text-muted-foreground mt-1">SaaS 常见参考 ≤ 12 个月</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center flex flex-col justify-center">
                <p class="text-xs text-muted-foreground mb-1">单客月毛利</p>
                <p class="text-2xl font-bold text-foreground leading-tight">
                  {{ fmtMoney(monthlyGrossProfit) }}<span class="text-xs font-normal text-muted-foreground ml-1">元 / 月</span>
                </p>
                <p class="text-xs text-muted-foreground mt-1 font-mono">= ARPU × 毛利率</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-4 text-center flex flex-col justify-center">
                <p class="text-xs text-muted-foreground mb-1">月度获客支出</p>
                <p v-if="monthlyBurn !== null" class="text-2xl font-bold text-foreground leading-tight">
                  {{ fmtMoney(monthlyBurn) }}<span class="text-xs font-normal text-muted-foreground ml-1">元 / 月</span>
                </p>
                <p v-else class="text-2xl font-bold text-muted-foreground leading-tight">—</p>
                <p class="text-xs text-muted-foreground mt-1">{{ monthlyBurn !== null ? '= CAC × 月新增客户' : '填月新增客户数后显示' }}</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3">{{ paybackNote }}</p>
          </template>
          <p v-else class="text-xs text-muted-foreground leading-relaxed">
            选填「CAC 获客成本」后，这里会给出回收月数（= CAC ÷ 单客月毛利）与月度获客支出的烧钱视角。
          </p>
        </div>

        <!-- 流失率敏感度表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold flex items-center mb-4">
            <Info class="w-5 h-5 mr-2 text-primary" /> 流失率敏感度（±1pp）
          </h2>

          <template v-if="arpuNum !== null">
            <div v-if="ltvMode === 'churn'" class="space-y-3">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-xs text-muted-foreground border-b border-border">
                      <th class="py-2 pr-3 font-medium">月流失率</th>
                      <th class="py-2 pr-3 font-medium">平均生命周期</th>
                      <th class="py-2 pr-3 font-medium text-right">LTV</th>
                      <th class="py-2 pr-3 font-medium text-right">LTV/CAC</th>
                      <th class="py-2 font-medium text-right">较当前</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in sensitivityRowsData"
                      :key="row.key"
                      class="border-b border-border/60 last:border-0"
                      :class="row.isBase ? 'bg-primary/5' : ''"
                    >
                      <td class="py-2 pr-3 font-medium text-foreground">
                        {{ row.churnText }}<span v-if="row.isBase" class="text-xs text-primary ml-1">当前</span>
                      </td>
                      <td class="py-2 pr-3 text-muted-foreground">{{ row.lifetimeText }} 个月</td>
                      <td class="py-2 pr-3 text-right font-mono text-foreground">{{ row.ltvText }}</td>
                      <td class="py-2 pr-3 text-right font-mono" :class="row.ratioClass">{{ row.ratioText }}</td>
                      <td class="py-2 text-right font-mono" :class="row.deltaClass">{{ row.deltaText }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs text-muted-foreground leading-relaxed">{{ churnSensitivityNote }}</p>
              <p class="text-xs text-muted-foreground">LTV/CAC 列颜色对应判定档位：红 = 亏损模式、黄 = 偏紧、绿 = 健康、青 = 优秀。</p>
            </div>
            <p v-else class="text-xs text-muted-foreground leading-relaxed">{{ simpleSensitivityNote }}</p>
          </template>
          <p v-else class="text-xs text-muted-foreground">填写 ARPU 后，这里会展示流失率 ±1pp 对 LTV 与倍数的影响。</p>
        </div>

        <!-- 情景提示条（静态） -->
        <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 text-foreground flex items-start gap-1.5">
          <TriangleAlert class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>3x 基准是粗尺子：早期产品留存不稳时 LTV 会失真，CAC 在规模化投放后通常上涨——两个数字都要动态看。</span>
        </p>
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
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>LTV/CAC 计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          本工具把订阅制 / 复购生意的「单位经济」拆成三个数：客户生命周期价值 LTV（一个客户在整个使用周期里贡献的毛利）、
          获客成本 CAC（获取一个新客户的全部花费）、以及两者的比值与回收期。输入 ARPU 与毛利率，选择简单口径或留存曲线口径，
          再选填 CAC 与月新增客户数，即可得到 LTV、LTV/CAC 倍数四档判定、回本月数与月度获客支出，并附流失率 ±1pp 敏感度对照表。
          全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">LTV 是什么、怎么算？（两口径对比）</h3>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          简单口径：LTV = ARPU × 平均留存月数；考虑毛利则 LTV = ARPU × 毛利率 × 留存月数。适合电商复购、储值会员等「凭经验知道平均用多久 / 买几次」的生意。
        </p>
        <p class="text-sm text-muted-foreground mb-2 leading-relaxed">
          留存曲线口径（订阅制标准）：LTV = ARPU × 毛利率 ÷ 月流失率。推导：客户每月以固定比例流失时，平均存活月数 = 1 ÷ 流失率（几何分布期望），
          即「留存月数 = 1 ÷ 流失率」；流失 5% → 1 ÷ 0.05 = 20 个月，因此 LTV = 99 × 80% × 20 = 1,584 元。
        </p>
        <p class="text-sm text-muted-foreground leading-relaxed">
          怎么选：知道「平均用多久」用简单口径；只知道「每月流失多少」用曲线口径。两者数学上等价（留存月数 = 1 ÷ 流失率），选数据更可靠的那个；
          早期产品流失率波动大，建议定期重算而不是一次定格。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CAC 包含哪些成本？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          CAC =（广告投放 + 市场活动 + 渠道佣金与分成 + 销售与地推人力 + 新客补贴赠品等）÷ 同期新增客户数。三个常见坑：
          ① 分摊口径要一致——算总账用 Blended CAC（全部市场销售费用 ÷ 全部新客），评估投放效率用 Paid CAC（付费投放费用 ÷ 付费渠道新客），两者不要混着比；
          ② 销售人力、给销售的提成、内容与品牌费用常被漏算，导致 CAC 被低估；
          ③ 自然流量带来的新客也在分母里，会拉低整体 CAC，但判断投放本身是否划算时应单独看付费渠道。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">LTV/CAC 比值多少算健康？（3x 的由来）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          四档通用参考：&lt;1 亏损模式（红）、1–3 偏紧（黄）、3–5 健康（绿）、&gt;5 优秀。3x 这条线的由来是早期 SaaS 投资人的经验法则：
          LTV 至少是 CAC 的 3 倍，才足以同时消化三件事——留存不达预期（LTV 高估）、规模化后 CAC 上涨、以及回本前几个月的资金占用。
          反过来，比值长期 &gt;5 也未必全是好事，可能说明投放过于保守，还有增长空间没吃掉。不同行业毛利结构差异大，3x 只是粗尺子，趋势比单点更重要。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">流失率为什么是第一杠杆？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          平均生命周期 = 1 ÷ 流失率，反比关系让流失率的改善被「放大」：流失率从 10% 压到 5%，生命周期从 10 个月翻倍到 20 个月，LTV 直接翻倍——
          同样的力气花在降 CAC 或提价上，很难有翻倍级的效果。而且流失率越低，每再降 1 个百分点的边际收益越大（本页敏感度表可以直观验证）；
          留存还是唯一「一好百好」的杠杆：LTV 变大、回收期变短、老客推荐同时改善。修留存通常从引导激活、定价适配、流失预警三处下手。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">回收期多长合理？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          回收期（月）= CAC ÷（ARPU × 毛利率），即每月毛利把一次获客成本赚回来所需的时间。SaaS 常见参考基准是 ≤12 个月：
          回收越快，同样一笔钱能滚动投放下一次获客，增长对融资的依赖越小；现金流紧张的早期团队建议控制在 6–12 个月。
          回收期偏长时的解法与比值偏紧一致：压 CAC、提 ARPU、改毛利率，或者先把留存做上去。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">LTV/CAC 比值多少算健康？</h3>
            <p class="text-sm text-muted-foreground mt-1">常用经验基准是 3x：低于 1x 为亏损模式，每获取一个客户都在亏钱；1–3x 偏紧，毛利勉强覆盖获客成本；3–5x 健康，达到 SaaS 常用基准，可考虑加大投放；5x 以上属优秀。3x 的由来是早期 SaaS 投资人的经验法则——3 倍以上才足以消化留存不达预期、CAC 上涨与回本前几个月的资金占用成本。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">LTV 应该用哪个口径计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">两种常用口径：简单口径 LTV = ARPU × 平均留存月数（或再乘毛利率），适合凭历史经验知道平均用多久的复购生意；订阅制标准是留存曲线口径 LTV = ARPU × 毛利率 ÷ 月流失率，因为平均生命周期 = 1 ÷ 流失率，流失 5% 即 20 个月。两种口径数学上等价，选数据更可靠的那个。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">流失率降 1 个百分点，LTV 能变大多少？</h3>
            <p class="text-sm text-muted-foreground mt-1">平均生命周期 = 1 ÷ 流失率，是反比关系：流失率从 10% 降到 5%，生命周期从 10 个月翻倍到 20 个月，LTV 同样翻倍；流失率越低，每再降 1 个百分点带来的 LTV 增幅越大。例如 ARPU 99 元、毛利率 80% 时，流失率 5% 对应 LTV 1,584 元，降到 4% 即变为 1,980 元（+25%）。可用本页敏感度表直观验证。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">回收期怎么算、多长合理？</h3>
            <p class="text-sm text-muted-foreground mt-1">回收期（月）= CAC ÷（ARPU × 毛利率），即每月毛利把一次获客成本赚回来所需月数。SaaS 常见参考是不超过 12 个月；现金流紧张的早期团队控制在 6–12 个月更稳妥，回收期越长，增长对外部融资的依赖越重。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ltv-cac-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Repeat2, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Users
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'LTV/CAC 计算器 - 客户生命周期价值/获客成本比值在线计算',
  description: '免费在线 LTV/CAC 计算器：支持简单口径与留存曲线口径两种 LTV 算法，输入 ARPU、毛利率、月流失率或留存月数、获客成本 CAC 与月新增客户数，即时得出 LTV、LTV/CAC 倍数四档判定（亏损/偏紧/健康/优秀）、回收期与月度获客支出，附流失率 ±1pp 敏感度对照表，订阅制与复购生意的单位经济分析工具，纯浏览器本地运行不上传',
  keywords: 'ltv cac 比值,客户生命周期价值,获客成本,留存率计算,订阅制指标',
  author: '有条工具',
  ogTitle: 'LTV/CAC 计算器 - 客户生命周期价值/获客成本比值在线计算 | 有条工具',
  ogDescription: '两种 LTV 口径、LTV/CAC 四档判定、回收期与流失率敏感度，订阅制单位经济一页算清。',
  ogUrl: 'https://www.util.cn/tools/ltv-cac-calculator',
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
          name: 'LTV/CAC 计算器',
          url: 'https://www.util.cn/tools/ltv-cac-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['两种 LTV 口径（简单留存月数 / 留存曲线流失率）', 'LTV/CAC 倍数与四档判定（亏损/偏紧/健康/优秀）', 'CAC 回收期与月度获客支出估算', '流失率 ±1pp 敏感度对照表', '示例一键载入与重置', '浏览器本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: 'LTV/CAC 计算器', item: 'https://www.util.cn/tools/ltv-cac-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'LTV/CAC 比值多少算健康？',
              acceptedAnswer: { '@type': 'Answer', text: '常用经验基准是 3x：低于 1x 为亏损模式，每获取一个客户都在亏钱；1–3x 偏紧，毛利勉强覆盖获客成本；3–5x 健康，达到 SaaS 常用基准，可考虑加大投放；5x 以上属优秀。3x 的由来是早期 SaaS 投资人的经验法则——3 倍以上才足以消化留存不达预期、CAC 上涨与回本前几个月的资金占用成本。' }
            },
            {
              '@type': 'Question',
              name: 'LTV 应该用哪个口径计算？',
              acceptedAnswer: { '@type': 'Answer', text: '两种常用口径：简单口径 LTV = ARPU × 平均留存月数（或再乘毛利率），适合凭历史经验知道平均用多久的复购生意；订阅制标准是留存曲线口径 LTV = ARPU × 毛利率 ÷ 月流失率，因为平均生命周期 = 1 ÷ 流失率，流失 5% 即 20 个月。两种口径数学上等价，选数据更可靠的那个。' }
            },
            {
              '@type': 'Question',
              name: '流失率降 1 个百分点，LTV 能变大多少？',
              acceptedAnswer: { '@type': 'Answer', text: '平均生命周期 = 1 ÷ 流失率，是反比关系：流失率从 10% 降到 5%，生命周期从 10 个月翻倍到 20 个月，LTV 同样翻倍；流失率越低，每再降 1 个百分点带来的 LTV 增幅越大。例如 ARPU 99 元、毛利率 80% 时，流失率 5% 对应 LTV 1584 元，降到 4% 即变为 1980 元（+25%）。' }
            },
            {
              '@type': 'Question',
              name: '回收期怎么算、多长合理？',
              acceptedAnswer: { '@type': 'Answer', text: '回收期（月）= CAC ÷（ARPU × 毛利率），即每月毛利把一次获客成本赚回来所需月数。SaaS 常见参考是不超过 12 个月；现金流紧张的早期团队控制在 6–12 个月更稳妥，回收期越长，增长对外部融资的依赖越重。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const CHURN_MIN = 0.5   // 月流失率下限（%）
const CHURN_MAX = 50    // 月流失率上限（%）
const MARGIN_MIN = 1    // 毛利率下限（%）
const MARGIN_MAX = 100  // 毛利率上限（%）
const MONTHS_MIN = 1    // 平均留存月数下限
const MONTHS_MAX = 120  // 平均留存月数上限

// 平均生命周期（月）= 100 ÷ 月流失率%。
// 推导：客户每月以固定比例 c（小数）流失时，存活月数服从几何分布，期望 = 1 ÷ c；
// 以百分比口径即 1 ÷ (churnPct/100) = 100 ÷ churnPct。流失率 5% → 1 ÷ 0.05 = 20 个月。
// 口径说明：「留存月数 = 1 ÷ 流失率」是月度离散流失模型的标准近似，假设各月流失率恒定、无留存曲线弯曲。
function lifetimeMonthsOf(churnPct) {
  if (!(churnPct > 0)) return Infinity
  return 100 / churnPct
}

// 简单口径：LTV = ARPU × 毛利率% × 平均留存月数
function ltvSimpleOf(arpu, marginPct, months) {
  return arpu * (marginPct / 100) * months
}

// 留存曲线口径（订阅制标准）：LTV = ARPU × 毛利率 ÷ 月流失率
// 推导：LTV = ARPU × (marginPct/100) × 生命周期 = ARPU × (marginPct/100) × (100/churnPct)，
//       百分号相互约分 → ARPU × marginPct ÷ churnPct。
// 示例：ARPU 99、毛利率 80%、流失 5% → 99 × 80 ÷ 5 = 1584 元。
function ltvChurnOf(arpu, marginPct, churnPct) {
  if (!(churnPct > 0)) return Infinity
  return (arpu * marginPct) / churnPct
}

// LTV/CAC 倍数（1 位小数）；CAC 非法（≤ 0）或 LTV 非有限值时返回 null
function ratioOf(ltv, cac) {
  if (!(cac > 0) || !Number.isFinite(ltv)) return null
  return Math.round((ltv / cac) * 10) / 10
}

// 四档判定（通用参考基准）：
//   r < 1     → 'loss'    亏损模式（红）
//   1 ≤ r < 3 → 'tight'   偏紧（黄）
//   3 ≤ r ≤ 5 → 'healthy' 健康（绿）—— 3x 是 SaaS 行业「值得规模化投放」的常用经验基准线
//   r > 5     → 'great'   优秀
// 不同行业毛利与留存结构差异大，此分档仅作粗尺子参考。
function judgeRatioOf(r) {
  if (!Number.isFinite(r)) return 'invalid'
  if (r < 1) return 'loss'
  if (r < 3) return 'tight'
  if (r <= 5) return 'healthy'
  return 'great'
}

// 回收期（月）= CAC ÷（ARPU × 毛利率%）：每月毛利把一次获客成本赚回来所需月数，1 位小数。
// SaaS 常见参考基准 ≤ 12 个月（通用经验值，非硬性标准）。
function paybackMonthsOf(cac, arpu, marginPct) {
  const monthlyGross = arpu * (marginPct / 100)
  if (!(monthlyGross > 0) || !(cac > 0)) return Infinity
  return Math.round((cac / monthlyGross) * 10) / 10
}

// 月度获客支出（烧钱视角）= CAC × 月新增客户数
function monthlyBurnOf(cac, newCustomers) {
  return cac * newCustomers
}

// 流失率敏感度行：基准值 ±1pp（钳制在 [CHURN_MIN, CHURN_MAX] 并去重），
// 每行给出平均生命周期 / LTV / LTV/CAC，用于直观呈现「流失率是订阅制第一杠杆」。
function churnSensitivityRows(arpu, marginPct, baseChurnPct, cac) {
  const candidates = [baseChurnPct - 1, baseChurnPct, baseChurnPct + 1].map(
    (c) => Math.min(CHURN_MAX, Math.max(CHURN_MIN, c))
  )
  const rows = []
  const seen = new Set()
  for (const churn of candidates) {
    const key = churn.toFixed(4)
    if (seen.has(key)) continue
    seen.add(key)
    const rowLtv = ltvChurnOf(arpu, marginPct, churn)
    rows.push({
      churn,
      isBase: Math.abs(churn - baseChurnPct) < 1e-9,
      lifetime: lifetimeMonthsOf(churn),
      ltv: rowLtv,
      ratio: ratioOf(rowLtv, cac)
    })
  }
  return rows
}

// 输入钳制：字符串 / 空值 / NaN 回退默认值，越界收紧到 [lo, hi]
function clampNumber(v, lo, hi, fallback) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(hi, Math.max(lo, n))
}

// ---------- 格式化（展示层纯函数） ----------

// 金额：四舍五入取整 + 千分位；空值显示占位符
function fmtMoney(n) {
  if (n === null || !Number.isFinite(n)) return '—'
  return Math.round(n).toLocaleString('zh-CN')
}

// 数值：整数原样，非整数保留 1 位小数
function fmtNum1(n) {
  if (n === null || !Number.isFinite(n)) return '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

// 倍数：1 位小数 + x
function fmtRatio(r) {
  if (r === null || !Number.isFinite(r)) return '—'
  return `${r.toFixed(1)}x`
}

// 带符号百分比：+25.0% / -16.7%
function fmtSignedPct(d) {
  if (d === null || !Number.isFinite(d)) return '—'
  return `${d >= 0 ? '+' : '-'}${Math.abs(d).toFixed(1)}%`
}

// ---------- 判定档位文案 ----------
const RATIO_META = {
  loss: {
    label: '亏损模式',
    text: 'text-red-600',
    card: 'bg-red-500/10 border-red-500/20',
    badge: 'bg-red-500/10 text-red-600 border-red-500/20',
    desc: 'LTV < CAC：每获取一个客户都在亏钱，先修留存或压降获客成本，再谈规模化增长。'
  },
  tight: {
    label: '偏紧',
    text: 'text-amber-600',
    card: 'bg-amber-500/10 border-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    desc: '1–3x：毛利勉强覆盖获客成本，规模化投放需谨慎，优先改善留存或提高 ARPU。'
  },
  healthy: {
    label: '健康',
    text: 'text-green-600',
    card: 'bg-green-500/10 border-green-500/20',
    badge: 'bg-green-500/10 text-green-600 border-green-500/20',
    desc: '3–5x：达到 SaaS 常用 3x 基准，单位经济可支撑增长，可考虑逐步加大投放。'
  },
  great: {
    label: '优秀',
    text: 'text-emerald-600',
    card: 'bg-emerald-500/10 border-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    desc: '>5x：单位经济非常健康；若增长停滞，也可能是投放过于保守，可测试加大获客投入。'
  }
}

// 敏感度表中倍数列的判定配色
const RATIO_TIER_TEXT = {
  loss: 'text-red-600',
  tight: 'text-amber-600',
  healthy: 'text-green-600',
  great: 'text-emerald-600'
}

// ---------- 页面状态 ----------
const DEFAULTS = {
  arpu: 99,    // ARPU（元/月）
  margin: 100, // 毛利率（%）
  months: 12,  // 简单口径：平均留存月数
  churn: 5     // 曲线口径：月流失率（%）
}

const arpuInput = ref(DEFAULTS.arpu)
const marginInput = ref(DEFAULTS.margin)
const ltvMode = ref('churn') // 'churn' 留存曲线口径（订阅制标准）| 'simple' 简单口径
const monthsInput = ref(DEFAULTS.months)
const churnInput = ref(DEFAULTS.churn)
const cacInput = ref('')       // 选填：空 = 未提供
const newCustInput = ref('')   // 选填：空 = 未提供
const seoContentVisible = ref(true)

// 载入示例：ARPU 99 / 毛利 80% / 流失 5% / CAC 600 → LTV = 99 × 0.8 × 20 = 1584，比值 2.6x（偏紧）
function loadExample() {
  arpuInput.value = 99
  marginInput.value = 80
  ltvMode.value = 'churn'
  monthsInput.value = 12
  churnInput.value = 5
  cacInput.value = 600
  newCustInput.value = 50
}

function resetInputs() {
  arpuInput.value = DEFAULTS.arpu
  marginInput.value = DEFAULTS.margin
  ltvMode.value = 'churn'
  monthsInput.value = DEFAULTS.months
  churnInput.value = DEFAULTS.churn
  cacInput.value = ''
  newCustInput.value = ''
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 计算管线（钳制 → 纯函数 → 展示） ----------
const arpuNum = computed(() => {
  const n = typeof arpuInput.value === 'number' ? arpuInput.value : parseFloat(arpuInput.value)
  return Number.isFinite(n) && n > 0 ? n : null
})
const marginNum = computed(() => clampNumber(marginInput.value, MARGIN_MIN, MARGIN_MAX, 100))
const monthsNum = computed(() => clampNumber(monthsInput.value, MONTHS_MIN, MONTHS_MAX, 12))
const churnNum = computed(() => clampNumber(churnInput.value, CHURN_MIN, CHURN_MAX, 5))
const cacNum = computed(() => {
  const n = typeof cacInput.value === 'number' ? cacInput.value : parseFloat(cacInput.value)
  return Number.isFinite(n) && n > 0 ? n : null
})
const newCustNum = computed(() => {
  const n = typeof newCustInput.value === 'number' ? newCustInput.value : parseFloat(newCustInput.value)
  return Number.isFinite(n) && n > 0 ? n : null
})

// 平均生命周期：曲线口径 = 100 ÷ 流失率；简单口径 = 直接采用输入的留存月数
const lifetime = computed(() =>
  ltvMode.value === 'churn' ? lifetimeMonthsOf(churnNum.value) : monthsNum.value
)

// LTV：两种口径各自的纯函数（数学上等价：留存月数 = 100 ÷ 流失率）
const ltv = computed(() => {
  if (arpuNum.value === null) return null
  return ltvMode.value === 'churn'
    ? ltvChurnOf(arpuNum.value, marginNum.value, churnNum.value)
    : ltvSimpleOf(arpuNum.value, marginNum.value, monthsNum.value)
})

const ratio = computed(() =>
  ltv.value !== null && cacNum.value !== null ? ratioOf(ltv.value, cacNum.value) : null
)
const verdict = computed(() => (ratio.value !== null ? judgeRatioOf(ratio.value) : null))
const ratioMeta = computed(() => (verdict.value && RATIO_META[verdict.value]) || null)

// 单客月毛利 = ARPU × 毛利率（回收期的分母）
const monthlyGrossProfit = computed(() =>
  arpuNum.value !== null ? arpuNum.value * (marginNum.value / 100) : null
)

const paybackMonths = computed(() =>
  cacNum.value !== null && monthlyGrossProfit.value !== null
    ? paybackMonthsOf(cacNum.value, arpuNum.value, marginNum.value)
    : null
)

const monthlyBurn = computed(() =>
  cacNum.value !== null && newCustNum.value !== null
    ? monthlyBurnOf(cacNum.value, newCustNum.value)
    : null
)

const modeHint = computed(() =>
  ltvMode.value === 'churn'
    ? '订阅制标准口径：LTV = ARPU × 毛利率 ÷ 月流失率，只需流失率一个留存参数'
    : '凭经验口径：LTV = ARPU × 毛利率 × 平均留存月数，适合复购 / 储值等非订阅生意'
)

const churnHint = computed(() => {
  const life = lifetimeMonthsOf(churnNum.value)
  return `每月流失的付费客户占比（0.5–50）。当前 ${fmtNum1(churnNum.value)}% → 平均生命周期 ${fmtNum1(life)} 个月（= 100 ÷ ${fmtNum1(churnNum.value)}）`
})

const ltvFormulaText = computed(() => {
  if (arpuNum.value === null) return ''
  return ltvMode.value === 'churn'
    ? `= ${fmtMoney(arpuNum.value)} × ${fmtNum1(marginNum.value)}% ÷ ${fmtNum1(churnNum.value)}%`
    : `= ${fmtMoney(arpuNum.value)} × ${fmtNum1(marginNum.value)}% × ${fmtNum1(monthsNum.value)} 个月`
})

const lifetimeNote = computed(() =>
  ltvMode.value === 'churn'
    ? `= 100 ÷ ${fmtNum1(churnNum.value)}`
    : '直接采用输入的留存月数'
)

const modeChip = computed(() =>
  ltvMode.value === 'churn'
    ? `口径：留存曲线 · 月流失率 ${fmtNum1(churnNum.value)}%`
    : `口径：简单 · 平均留存 ${fmtNum1(monthsNum.value)} 个月`
)

// 回收期基准说明：SaaS 常见基准 ≤ 12 个月（通用经验参考，非硬性标准）
const paybackNote = computed(() => {
  if (paybackMonths.value === null) return ''
  const within = paybackMonths.value <= 12
  return `回收期 = CAC ÷（ARPU × 毛利率）：每月毛利把一次获客成本赚回来所需的月数。${within ? '当前在 SaaS 常见的 ≤12 个月基准内，获客投入的现金流压力可控。' : '当前超过 SaaS 常见的 12 个月基准，规模化投放前建议先压 CAC、提 ARPU 或改善毛利率。'}`
})

// 敏感度表：仅留存曲线口径展示（简单口径不直接使用流失率）
const sensitivityRowsData = computed(() => {
  if (arpuNum.value === null || ltvMode.value !== 'churn') return []
  const rows = churnSensitivityRows(arpuNum.value, marginNum.value, churnNum.value, cacNum.value)
  const baseRow = rows.find((r) => r.isBase)
  const baseLtv = baseRow ? baseRow.ltv : null
  return rows.map((r) => {
    const tier = r.ratio !== null ? judgeRatioOf(r.ratio) : null
    const delta = baseLtv !== null && baseLtv !== 0 ? ((r.ltv - baseLtv) / baseLtv) * 100 : null
    return {
      key: r.churn.toFixed(2),
      isBase: r.isBase,
      churnText: `${fmtNum1(r.churn)}%`,
      lifetimeText: fmtNum1(r.lifetime),
      ltvText: fmtMoney(r.ltv),
      ratioText: fmtRatio(r.ratio),
      ratioClass: tier && RATIO_TIER_TEXT[tier] ? RATIO_TIER_TEXT[tier] : 'text-muted-foreground',
      deltaText: r.isBase ? '基准' : fmtSignedPct(delta),
      deltaClass: r.isBase
        ? 'text-muted-foreground'
        : delta !== null && delta > 0
          ? 'text-green-600'
          : delta !== null && delta < 0
            ? 'text-red-500'
            : 'text-muted-foreground'
    }
  })
})

const churnSensitivityNote = computed(() => {
  if (arpuNum.value === null) return ''
  const base = churnNum.value
  const baseLtv = ltvChurnOf(arpuNum.value, marginNum.value, base)
  const upChurn = base - 1
  const downChurn = base + 1
  const upLtv = upChurn >= CHURN_MIN ? ltvChurnOf(arpuNum.value, marginNum.value, upChurn) : null
  const downLtv = downChurn <= CHURN_MAX ? ltvChurnOf(arpuNum.value, marginNum.value, downChurn) : null
  const upText = upLtv !== null ? fmtSignedPct(((upLtv - baseLtv) / baseLtv) * 100) : '—'
  const downText = downLtv !== null ? fmtSignedPct(((downLtv - baseLtv) / baseLtv) * 100) : '—'
  return `平均生命周期 = 100 ÷ 流失率（反比）。以当前 ${fmtNum1(base)}% 为基准：降到 ${fmtNum1(Math.max(CHURN_MIN, upChurn))}% 时 LTV ${upText}，升到 ${fmtNum1(Math.min(CHURN_MAX, downChurn))}% 时 LTV ${downText}——流失率是订阅制第一杠杆，先修留存，再谈投放。`
})

const simpleSensitivityNote = computed(() => {
  const months = monthsNum.value
  const eq = 100 / months
  return `简单口径不直接使用流失率：你输入的 ${fmtNum1(months)} 个月留存，等效于月流失率约 ${fmtNum1(eq)}%（= 100 ÷ ${fmtNum1(months)}）。切换到「留存曲线口径」并填入该流失率，即可查看流失率 ±1pp 对 LTV 与 LTV/CAC 的敏感度对照。`
})

// ---------- 生命周期（SSR 安全：无浏览器 API，仅记录最近使用） ----------
onMounted(() => {
  addRecentTool('ltv-cac-calculator')
})
</script>
