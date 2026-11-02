<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Coins class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">盈亏平衡计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">小店/小生意保本分析：保本销量、保本销售额、目标利润所需销量与安全边际一目了然</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        开店、摆摊、做小生意前先算清楚一件事：每月要卖多少件才不亏。输入每月固定成本（房租、工资、水电底耗等雷打不动的支出）与单件经济模型（单价、单件变动成本），
        工具按「保本销量 = 固定成本 ÷ 单件边际贡献」算出保本点，折合每天单量与保本销售额；再填目标月利润可测算达成目标所需的销量，
        填当前月销量可得安全边际率与经营稳健度判定，并用 50%~150% 销量情景表、单件边际贡献拆分图与提价/降本敏感度分析辅助定价决策。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧：输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 经营参数
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">月固定成本（元/月）</label>
          <input
            v-model.number="fixedCostInput"
            type="number"
            min="0"
            step="500"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">房租 + 工资 + 水电底耗等每月不管卖多少都要付的合计</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">单价（元/件）</label>
          <input
            v-model.number="priceInput"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">按实际成交均价填，常打折就按折后价</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">单件变动成本（元/件）</label>
          <input
            v-model.number="varCostInput"
            type="number"
            min="0"
            step="0.1"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">进货/材料 + 包装 + 平台扣点，卖一件才发生的钱，需小于单价</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">目标月利润（元，选填）</label>
          <input
            v-model.number="targetProfitInput"
            type="number"
            min="0"
            step="1000"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">留空或填 0 即只算保本；大于 0 时测算达成目标所需销量</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">当前月销量（件/月，选填）</label>
          <input
            v-model.number="currentUnitsInput"
            type="number"
            min="0"
            step="10"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">填写后显示安全边际分析</p>
        </div>

        <div class="bg-primary/10 rounded-lg p-4 text-center">
          <p class="text-xs text-muted-foreground mb-1">单件边际贡献（单价 − 单件变动成本）</p>
          <p class="text-xl font-bold text-primary">{{ canCompute ? `${fmtNum(unitContribution)} 元` : '—' }}</p>
          <p v-if="canCompute" class="text-xs text-primary mt-0.5">边际贡献率 {{ cmRatioText }}</p>
        </div>

        <div v-if="inputWarning" class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
          <TriangleAlert class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-red-600 leading-relaxed">{{ inputWarning }}</p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="loadExample"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
          >
            <Play class="w-4 h-4" /> 载入示例
          </button>
          <button
            @click="resetInputs"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧：结果（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 保本结论
          </h2>

          <template v-if="canCompute">
            <div class="bg-primary/10 rounded-lg p-6 text-center">
              <p class="text-xs text-muted-foreground mb-1">保本销量（不亏不赚的月销量）</p>
              <p class="text-5xl font-bold text-primary leading-none">{{ fmtNum(breakEvenUnits) }}</p>
              <p class="text-sm font-medium text-primary mt-2">件/月</p>
              <p class="text-xs text-muted-foreground mt-3">
                折合每天约 {{ fmtNum(perDayUnits) }} 件 · 保本销售额 {{ fmtNum(breakEvenRevenue) }} 元/月
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">单件边际贡献</p>
                <p class="text-lg font-bold text-foreground">{{ fmtNum(unitContribution) }} 元</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">边际贡献率</p>
                <p class="text-lg font-bold text-foreground">{{ cmRatioText }}</p>
              </div>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed">
              公式：保本销量 = 月固定成本 ÷ 单件边际贡献 = {{ fmtNum(fixedCost) }} ÷ {{ fmtNum(unitContribution) }}（结果向上取整，卖出这一件数后开始盈利，每多卖一件净赚 {{ fmtNum(unitContribution) }} 元）。
            </p>
          </template>
          <div v-else class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-red-600 leading-relaxed">{{ inputWarning }}</p>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>口径说明：仅按填写的固定/变动成本计算，未含税费、库存损耗与坏账；「每天」按每月 30 天折算。结果供开店核算与定价参考。</span>
          </p>
        </div>

        <!-- 目标利润卡 -->
        <div v-if="unitsForTarget !== null" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 目标利润测算
          </h2>
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">达成目标月利润 {{ fmtNum(targetProfit) }} 元，需要卖</p>
            <p class="text-3xl font-bold text-primary">{{ fmtNum(unitsForTarget) }} <span class="text-sm font-medium">件/月</span></p>
          </div>
          <div class="text-sm">
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">比保本销量多</span>
              <span class="text-foreground font-medium">{{ fmtNum(targetExtraUnits) }} 件/月</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <span class="text-muted-foreground">按该销量实际月利润</span>
              <span class="text-green-600 font-medium">约 {{ fmtNum(profitAtTargetUnits) }} 元（≥ 目标）</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed">
            公式：所需销量 = (月固定成本 + 目标月利润) ÷ 单件边际贡献 = ({{ fmtNum(fixedCost) }} + {{ fmtNum(targetProfit) }}) ÷ {{ fmtNum(unitContribution) }}，结果向上取整。
          </p>
        </div>

        <!-- 情景表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 销量情景表（保本量的 50% → 150%）
          </h2>
          <div v-if="scenarioRows.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">场景</th>
                  <th class="py-2 pr-3 font-medium text-right">销量（件/月）</th>
                  <th class="py-2 pr-3 font-medium text-right">收入（元）</th>
                  <th class="py-2 pr-3 font-medium text-right">总成本（元）</th>
                  <th class="py-2 font-medium text-right">月利润（元）</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in scenarioRows"
                  :key="row.label"
                  class="border-b border-border/50 last:border-b-0"
                  :class="row.isBreakEven ? 'bg-primary/10' : ''"
                >
                  <td class="py-2 pr-3 whitespace-nowrap" :class="row.isBreakEven ? 'text-primary font-semibold' : 'text-muted-foreground'">{{ row.label }}</td>
                  <td class="py-2 pr-3 text-right text-foreground font-mono">{{ fmtNum(row.units) }}</td>
                  <td class="py-2 pr-3 text-right text-foreground font-mono">{{ fmtNum(row.revenue) }}</td>
                  <td class="py-2 pr-3 text-right text-foreground font-mono">{{ fmtNum(row.cost) }}</td>
                  <td class="py-2 text-right font-mono font-medium" :class="row.profit < 0 ? 'text-red-600' : (row.profit > 0 ? 'text-green-600' : 'text-foreground')">
                    {{ fmtSigned(row.profit) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-muted-foreground">先在左侧填写有效参数（单价大于 0 且变动成本小于单价），即可生成情景表。</p>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>总成本 = 月固定成本 + 销量 × 单件变动成本；月利润 = 收入 − 总成本。保本行以高亮显示，红色为亏损、绿色为盈利。</span>
          </p>
        </div>

        <!-- 边际贡献说明卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 每卖一件剩多少：边际贡献拆分
          </h2>
          <template v-if="canCompute">
            <div class="flex h-8 rounded-lg overflow-hidden border border-border bg-muted/50" role="img" aria-label="单价中变动成本与边际贡献占比">
              <div class="bg-amber-400 flex items-center justify-center" :style="{ width: contributionShares.varPct + '%' }">
                <span v-if="contributionShares.varPct >= 18" class="text-[10px] font-medium text-foreground">变动成本 {{ contributionShares.varPct }}%</span>
              </div>
              <div class="bg-primary flex items-center justify-center" :style="{ width: contributionShares.cmPct + '%' }">
                <span v-if="contributionShares.cmPct >= 18" class="text-[10px] font-medium text-primary-foreground">边际贡献 {{ contributionShares.cmPct }}%</span>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div class="flex items-start gap-1.5">
                <i class="w-2.5 h-2.5 rounded-sm bg-amber-400 mt-0.5 flex-shrink-0"></i>
                <p class="text-muted-foreground leading-relaxed">
                  <span class="text-foreground font-medium">变动成本 {{ fmtNum(varCost) }} 元（{{ contributionShares.varPct }}%）</span>——进货、材料、包装、平台扣点，卖一件才发生一件
                </p>
              </div>
              <div class="flex items-start gap-1.5">
                <i class="w-2.5 h-2.5 rounded-sm bg-primary mt-0.5 flex-shrink-0"></i>
                <p class="text-muted-foreground leading-relaxed">
                  <span class="text-foreground font-medium">边际贡献 {{ fmtNum(unitContribution) }} 元（{{ contributionShares.cmPct }}%）</span>——每卖一件先剩这么多，拿去盖房租工资
                </p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed">
              保本之前，每件 {{ fmtNum(unitContribution) }} 元的边际贡献在攒着还固定成本；卖够 {{ fmtNum(breakEvenUnits) }} 件/月之后，这些钱全部变成利润。边际贡献率越高，保本点越低、回本越快。
            </p>
          </template>
          <p v-else class="text-sm text-muted-foreground">参数无效（变动成本需小于单价），无法拆分单价构成。</p>
        </div>

        <!-- 安全边际卡 -->
        <div v-if="safetyLevel !== null" class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <CheckCircle class="w-5 h-5 mr-2 text-primary" /> 安全边际
          </h2>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">当前月销量</p>
              <p class="text-lg font-bold text-foreground">{{ fmtNum(currentUnits) }} 件</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-3">
              <p class="text-[10px] text-muted-foreground mb-1">保本销量</p>
              <p class="text-lg font-bold text-foreground">{{ fmtNum(breakEvenUnits) }} 件</p>
            </div>
          </div>
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">安全边际率（(当前销量 − 保本销量) ÷ 当前销量）</p>
            <p class="text-3xl font-bold" :class="safetyMargin < 0 ? 'text-red-600' : 'text-primary'">{{ fmtNum(safetyMargin) }}%</p>
            <span class="inline-block mt-2 px-3 py-1 rounded-full border text-xs font-medium" :class="safetyLevel.chipClass">{{ safetyLevel.label }}</span>
          </div>
          <p class="text-xs leading-relaxed flex items-start gap-1.5" :class="safetyLevel.key === 'tight' ? 'text-amber-600' : 'text-muted-foreground'">
            <TriangleAlert v-if="safetyLevel.key === 'tight'" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <CheckCircle v-else class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{{ safetyLevel.desc }}</span>
          </p>
          <p v-if="safetyMargin < 0" class="text-xs text-red-600 leading-relaxed">
            当前月销量尚未达到保本点：还差 {{ fmtNum(breakEvenUnits - currentUnits) }} 件/月才能不亏，请优先提销量或降低保本点。
          </p>
          <p v-else class="text-xs text-muted-foreground leading-relaxed">
            从当前销量往下跌 {{ fmtNum(currentUnits - breakEvenUnits) }} 件仍不亏损；跌幅超过这个数才开始亏钱。
          </p>
        </div>

        <!-- 敏感度 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 敏感度：提价与降本对保本点的影响
          </h2>
          <template v-if="sensitivityRows.length">
            <div
              v-for="row in sensitivityRows"
              :key="row.label"
              class="flex flex-wrap items-center justify-between gap-2 py-2.5 border-b border-border/50 last:border-b-0"
            >
              <div>
                <p class="text-sm font-medium text-foreground">{{ row.label }}</p>
                <p class="text-xs text-muted-foreground mt-0.5">{{ row.detail }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-foreground font-mono">{{ row.beText }}</p>
                <p class="text-xs mt-0.5" :class="row.delta < 0 ? 'text-green-600' : (row.delta > 0 ? 'text-red-600' : 'text-muted-foreground')">{{ row.changeText }}</p>
              </div>
            </div>
          </template>
          <p v-else class="text-sm text-muted-foreground">参数无效，无法做敏感度分析。</p>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>两个常用假设：单价上调 2 元（涨价一档），或单件变动成本下降 5%（换供应商、优化包装/扣点）。减少的保本件数就是这两类动作「值不值」的直观依据。</span>
          </p>
        </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>盈亏平衡计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          盈亏平衡计算器是一款面向小店、小生意与个体经营的保本分析工具。输入每月固定成本与两件关键数字（单价、单件变动成本），
          它按「保本销量 = 固定成本 ÷ 单件边际贡献」算出每月要卖多少件才不亏，并给出保本销售额、折合每天单量、单件边际贡献与边际贡献率；
          还支持目标利润所需销量测算、50%~150% 销量情景表、单价构成拆分图、安全边际率判定，以及提价/降本两种假设下的保本点敏感度分析。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">盈亏平衡点是什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          盈亏平衡点（也叫保本点）指收入恰好覆盖全部成本、利润为 0 的销量。公式：保本销量 = 固定成本 ÷ 单件边际贡献，保本销售额 = 保本销量 × 单价，
          其中单件边际贡献 = 单价 − 单件变动成本，即每卖一件能拿出来「盖固定成本」的钱。举例：月固定成本 30000 元、单价 45 元、单件变动成本 22 元，
          边际贡献 23 元，保本销量 = 30000 ÷ 23 ≈ 1305 件/月（向上取整），折合每天约 43.5 件，保本销售额约 58725 元；
          卖不到就亏，超过后每多卖一件净赚 23 元。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">固定成本和变动成本怎么区分？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          看这笔花销是否随销量变化。不随销量变的是固定成本：房租、基本工资、保险、软件订阅、水电底耗等，一个月不开单也要付；
          随销量同比例涨的是变动成本：进货/材料、包装耗材、运费、平台扣点/佣金等，卖一件才发生一件。判断技巧：把销量想象成 0，
          还要花的钱就是固定成本；销量翻倍、总额也跟着翻倍的就是变动成本。有些费用是混合的（如超套餐的话费、保底+提成的工资），可拆成两部分分别归入。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">边际贡献率多少算健康？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          边际贡献率 = (单价 − 单件变动成本) ÷ 单价，表示每 1 元收入里有多少能拿去盖固定成本。行业差异很大，只能给量级参考（粗略口径）：
          零售、餐饮常见 40%~70%（与毛利率口径接近），服务业可到 70% 以上，批发与低毛利标品可能只有 10%~30%。
          比率本身没有绝对的好坏，关键是边际贡献总额能否稳定覆盖固定成本并有剩余——边际贡献率越低，需要卖的件数就越多才能保本。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">安全边际率怎么看？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          安全边际率 = (实际销量 − 保本销量) ÷ 实际销量，表示销量还可以下滑多少仍不亏损。通用经营参考口径：
          低于 20% 偏紧（销量再跌两成就可能亏），20%~40% 尚可，高于 40% 稳健。刚开业、淡季明显或竞争加剧时这个数通常偏低，
          此时应优先降低保本点（提价/降本/降固定支出）或通过引流提升销量，而不是先追求高利润。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">怎么降低保本点？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三条路：一是提价——提高单件边际贡献，示例中单价 +2 元就让保本量从 1305 件降到 1200 件，前提是涨幅不明显赶走客人；
          二是降变动成本——换供应商、优化包装、谈低平台扣点，把边际贡献率做大；
          三是降固定成本——缩小门面/换址、灵活用工、砍掉闲置订阅，把分母直接做小。
          三者往往要组合使用：先在情景表和敏感度里看清各项的弹性，再挑对客流影响最小、降幅最大的一项先动手。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">盈亏平衡点怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">保本销量 = 月固定成本 ÷ 单件边际贡献（单价 − 单件变动成本），结果向上取整。例：固定成本 3 万、单价 45 元、变动成本 22 元时，30000 ÷ 23 ≈ 1305 件/月，保本销售额约 58725 元。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">固定成本和变动成本怎么区分？</h3>
            <p class="text-sm text-muted-foreground mt-1">看是否随销量变化：房租、底薪、水电底耗等不管卖多少都要付，是固定成本；进货、材料、包装、平台扣点等卖一件才发生一件，是变动成本。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">边际贡献率多少算健康？</h3>
            <p class="text-sm text-muted-foreground mt-1">行业差异大，粗略参考：零售、餐饮常见 40%~70%，服务业可超过 70%，批发与低毛利标品可能只有 10%~30%。关键看边际贡献总额能否稳定覆盖固定成本并有剩余。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">怎么降低保本点？</h3>
            <p class="text-sm text-muted-foreground mt-1">三条路：提价提高单件边际贡献、降低变动成本（换供应商/优化包装/谈扣点）、降低固定成本（缩店面/灵活用工/砍闲置开销），可组合使用，优先做对客流影响最小、降幅最大的一项。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'break-even-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Coins, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, TrendingUp
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '盈亏平衡计算器 - 保本点/边际贡献/安全边际在线测算',
  description: '免费在线盈亏平衡计算器，输入月固定成本、单价与单件变动成本，算出保本销量与保本销售额、目标利润所需销量、安全边际率，含 50%~150% 销量情景表与提价降本敏感度分析，开店核算、定价决策必备，纯本地计算不上传',
  keywords: '盈亏平衡点计算,保本点,固定成本变动成本,边际贡献,开店核算',
  author: '有条工具',
  ogTitle: '盈亏平衡计算器 - 保本点/边际贡献/安全边际在线测算 | 有条工具',
  ogDescription: '算出每月要卖多少件才不亏：保本销量、保本销售额、目标利润所需销量与安全边际率，开店核算必备。',
  ogUrl: 'https://www.util.cn/tools/break-even-calculator',
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
          name: '盈亏平衡计算器',
          url: 'https://www.util.cn/tools/break-even-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['保本销量与保本销售额计算', '单件边际贡献与边际贡献率', '目标利润所需销量测算', '50%~150% 销量情景表', '安全边际率分级判定', '单价与变动成本敏感度分析', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '盈亏平衡计算器', item: 'https://www.util.cn/tools/break-even-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '盈亏平衡点怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: '保本销量 = 月固定成本 ÷ 单件边际贡献（单价 − 单件变动成本），结果向上取整。例：固定成本 3 万、单价 45 元、变动成本 22 元时，30000 ÷ 23 ≈ 1305 件/月，保本销售额约 58725 元。' }
            },
            {
              '@type': 'Question',
              name: '固定成本和变动成本怎么区分？',
              acceptedAnswer: { '@type': 'Answer', text: '看是否随销量变化：房租、底薪、水电底耗等不管卖多少都要付，是固定成本；进货、材料、包装、平台扣点等卖一件才发生一件，是变动成本。' }
            },
            {
              '@type': 'Question',
              name: '边际贡献率多少算健康？',
              acceptedAnswer: { '@type': 'Answer', text: '行业差异大，粗略参考：零售、餐饮常见 40%~70%，服务业可超过 70%，批发与低毛利标品可能只有 10%~30%。关键看边际贡献总额能否稳定覆盖固定成本并有剩余。' }
            },
            {
              '@type': 'Question',
              name: '怎么降低保本点？',
              acceptedAnswer: { '@type': 'Answer', text: '三条路：提价提高单件边际贡献、降低变动成本（换供应商/优化包装/谈扣点）、降低固定成本（缩店面/灵活用工/砍闲置开销），可组合使用。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
const DAYS_PER_MONTH = 30        // 「每天单量」按每月 30 天折算
const PRICE_BUMP = 2             // 敏感度假设：单价上调 2 元
const VAR_COST_CUT_RATIO = 0.05  // 敏感度假设：单件变动成本下降 5%
const SAFETY_TIGHT = 20          // 安全边际率 < 20%：偏紧
const SAFETY_SOLID = 40          // 安全边际率 > 40%：稳健

// 单件边际贡献 = 单价 − 单件变动成本（每卖一件能拿去盖固定成本的钱）
function unitContributionOf(price, varCost) {
  return price - varCost
}

// 边际贡献率（百分比，1 位小数）；单价无效返回 null
function contributionMarginRatioOf(price, varCost) {
  if (!isFinite(price) || price <= 0 || !isFinite(varCost)) return null
  return Math.round(((price - varCost) / price) * 1000) / 10
}

// 保本销量 = 固定成本 ÷ 单件边际贡献，向上取整；边际贡献 ≤ 0 无法保本返回 null，固定成本 ≤ 0 为 0
function breakEvenUnitsOf(fixed, price, varCost) {
  const contribution = unitContributionOf(price, varCost)
  if (!isFinite(fixed) || !isFinite(contribution) || contribution <= 0) return null
  if (fixed <= 0) return 0
  return Math.ceil(fixed / contribution)
}

// 保本销售额 = 保本销量 × 单价；销量无效返回 null
function breakEvenRevenueOf(units, price) {
  if (units === null || units === undefined || !isFinite(units) || !isFinite(price)) return null
  return Math.round(units * price * 100) / 100
}

// 达成目标利润所需销量 = ceil((固定成本 + 目标利润) ÷ 单件边际贡献)
function unitsForProfitOf(fixed, target, price, varCost) {
  const contribution = unitContributionOf(price, varCost)
  if (!isFinite(fixed) || !isFinite(target) || !isFinite(contribution) || contribution <= 0) return null
  const need = fixed + target
  if (need <= 0) return 0
  return Math.ceil(need / contribution)
}

// 安全边际率（百分比，1 位小数）= (实际销量 − 保本销量) ÷ 实际销量；可为负（尚未保本），无效输入返回 null
function marginOfSafetyOf(actualUnits, breakEvenUnits) {
  if (actualUnits === null || actualUnits === undefined || !isFinite(actualUnits) || actualUnits <= 0) return null
  if (breakEvenUnits === null || breakEvenUnits === undefined || !isFinite(breakEvenUnits)) return null
  return Math.round(((actualUnits - breakEvenUnits) / actualUnits) * 1000) / 10
}

// 该销量下的月利润 = 销量 × 单件边际贡献 − 固定成本（可为负）
function profitAtUnitsOf(units, fixed, price, varCost) {
  if (units === null || units === undefined || !isFinite(units) || !isFinite(fixed)) return null
  return Math.round((units * unitContributionOf(price, varCost) - fixed) * 100) / 100
}

// 安全边际率分级：< 20% 偏紧（黄）/ 20%~40% 尚可 / > 40% 稳健（绿），通用经营参考口径
function safetyLevelOf(ratio) {
  if (ratio === null || ratio === undefined || !isFinite(ratio)) return null
  if (ratio < SAFETY_TIGHT) {
    return {
      key: 'tight',
      label: '偏紧',
      chipClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      desc: '安全边际不足两成：销量只要再跌两成就可能亏损，建议优先降低保本点（提价/降本/降固定支出）或提升销量。'
    }
  }
  if (ratio < SAFETY_SOLID) {
    return {
      key: 'ok',
      label: '尚可',
      chipClass: 'bg-primary/10 text-primary border-primary/20',
      desc: '有一定缓冲空间，但淡季或竞争加剧时仍需留意销量波动，可提前准备降本或引流手段。'
    }
  }
  return {
    key: 'solid',
    label: '稳健',
    chipClass: 'bg-green-500/10 text-green-600 border-green-500/20',
    desc: '缓冲充足：销量大幅下滑仍能保本，抗波动能力较强，可考虑加大投入扩大利润。'
  }
}

// 月销量折合每天件数（÷30，1 位小数）
function dailyUnitsOf(units) {
  if (units === null || units === undefined || !isFinite(units)) return null
  return Math.round((units / DAYS_PER_MONTH) * 10) / 10
}

// 百分比夹取到 [0, 100]，1 位小数（用于占比条宽度）
function clampPercentOf(v) {
  if (!isFinite(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10))
}

// ---------- 输入状态 ----------
const DEFAULTS = { fixed: 30000, price: 45, varCost: 22, target: 0, current: 0 }
const EXAMPLE = { fixed: 30000, price: 45, varCost: 22, target: 10000, current: 1700 }

const fixedCostInput = ref(DEFAULTS.fixed)
const priceInput = ref(DEFAULTS.price)
const varCostInput = ref(DEFAULTS.varCost)
const targetProfitInput = ref(DEFAULTS.target)
const currentUnitsInput = ref(DEFAULTS.current)
const seoContentVisible = ref(true)

// 空输入/非法输入统一按 0 处理
function numOf(v) {
  const n = Number(v)
  return isFinite(n) ? n : 0
}

const fixedCost = computed(() => Math.max(0, numOf(fixedCostInput.value)))
const price = computed(() => numOf(priceInput.value))
const varCost = computed(() => Math.max(0, numOf(varCostInput.value)))
const targetProfit = computed(() => Math.max(0, numOf(targetProfitInput.value)))
const currentUnits = computed(() => Math.max(0, numOf(currentUnitsInput.value)))

const inputWarning = computed(() => {
  if (price.value <= 0) return '请先填写大于 0 的单价。'
  if (varCost.value >= price.value) return '单件变动成本 ≥ 单价：每卖一件都在亏钱，卖多少都无法保本，请先提价或降低变动成本。'
  return ''
})
const canCompute = computed(() => inputWarning.value === '')

// ---------- 派生计算 ----------
const unitContribution = computed(() => unitContributionOf(price.value, varCost.value))
const cmRatio = computed(() => contributionMarginRatioOf(price.value, varCost.value))
const cmRatioText = computed(() => (cmRatio.value === null ? '—' : `${cmRatio.value}%`))
const breakEvenUnits = computed(() => breakEvenUnitsOf(fixedCost.value, price.value, varCost.value))
const breakEvenRevenue = computed(() => breakEvenRevenueOf(breakEvenUnits.value, price.value))
const perDayUnits = computed(() => dailyUnitsOf(breakEvenUnits.value))

// 目标利润：target > 0 时给出所需销量
const unitsForTarget = computed(() =>
  targetProfit.value > 0 ? unitsForProfitOf(fixedCost.value, targetProfit.value, price.value, varCost.value) : null
)
const targetExtraUnits = computed(() =>
  unitsForTarget.value === null || breakEvenUnits.value === null ? null : unitsForTarget.value - breakEvenUnits.value
)
const profitAtTargetUnits = computed(() =>
  unitsForTarget.value === null ? null : profitAtUnitsOf(unitsForTarget.value, fixedCost.value, price.value, varCost.value)
)

// 安全边际：填了当前月销量（> 0）时给出
const safetyMargin = computed(() =>
  currentUnits.value > 0 ? marginOfSafetyOf(currentUnits.value, breakEvenUnits.value) : null
)
const safetyLevel = computed(() => safetyLevelOf(safetyMargin.value))

// 情景表：保本量的 50% → 150% 六行
const SCENARIO_RATIOS = [
  { ratio: 0.5, label: '50%' },
  { ratio: 0.7, label: '70%' },
  { ratio: 0.9, label: '90%' },
  { ratio: 1, label: '100%（保本）' },
  { ratio: 1.2, label: '120%' },
  { ratio: 1.5, label: '150%' }
]
const scenarioRows = computed(() => {
  const be = breakEvenUnits.value
  if (be === null) return []
  return SCENARIO_RATIOS.map(({ ratio, label }) => {
    const units = Math.max(0, Math.round(be * ratio))
    const revenue = breakEvenRevenueOf(units, price.value) ?? 0
    const cost = Math.round(fixedCost.value + units * varCost.value)
    const profit = profitAtUnitsOf(units, fixedCost.value, price.value, varCost.value) ?? 0
    return { label, units, revenue, cost, profit, isBreakEven: ratio === 1 }
  })
})

// 单价构成拆分：变动成本占比 vs 边际贡献占比
const contributionShares = computed(() => {
  if (!canCompute.value) return { varPct: 0, cmPct: 0 }
  return {
    varPct: clampPercentOf((varCost.value / price.value) * 100),
    cmPct: clampPercentOf((unitContribution.value / price.value) * 100)
  }
})

// 敏感度：单价 +2 元 / 变动成本 −5% 两种假设下的保本量变化
function buildSensitivityRow(label, detail, fromBe, toBe) {
  if (fromBe === null || toBe === null) {
    return { label, detail, beText: '—', changeText: '无法计算', delta: 0 }
  }
  const delta = toBe - fromBe
  const pct = ((delta / fromBe) * 100).toFixed(1)
  return {
    label,
    detail,
    beText: `${fmtNum(fromBe)} → ${fmtNum(toBe)} 件`,
    changeText: delta === 0 ? '保本量不变' : delta < 0 ? `少 ${fmtNum(-delta)} 件（${pct}%）` : `多 ${fmtNum(delta)} 件（+${pct}%）`,
    delta
  }
}
const sensitivityRows = computed(() => {
  const be = breakEvenUnits.value
  if (be === null) return []
  const bumpedPrice = price.value + PRICE_BUMP
  const newVarCost = Math.round(varCost.value * (1 - VAR_COST_CUT_RATIO) * 100) / 100
  return [
    buildSensitivityRow('单价 +2 元', `单价 ${fmtNum(price.value)} → ${fmtNum(bumpedPrice)} 元/件`, be, breakEvenUnitsOf(fixedCost.value, bumpedPrice, varCost.value)),
    buildSensitivityRow('变动成本 −5%', `变动成本 ${fmtNum(varCost.value)} → ${fmtNum(newVarCost)} 元/件`, be, breakEvenUnitsOf(fixedCost.value, price.value, newVarCost))
  ]
})

// ---------- 展示工具 ----------
function fmtNum(v) {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  const r = Math.round(v * 100) / 100
  return Number.isInteger(r)
    ? r.toLocaleString('zh-CN')
    : r.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}
function fmtSigned(v) {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  return v > 0 ? `+${fmtNum(v)}` : fmtNum(v)
}

// ---------- 操作 ----------
function loadExample() {
  fixedCostInput.value = EXAMPLE.fixed
  priceInput.value = EXAMPLE.price
  varCostInput.value = EXAMPLE.varCost
  targetProfitInput.value = EXAMPLE.target
  currentUnitsInput.value = EXAMPLE.current
}
function resetInputs() {
  fixedCostInput.value = DEFAULTS.fixed
  priceInput.value = DEFAULTS.price
  varCostInput.value = DEFAULTS.varCost
  targetProfitInput.value = DEFAULTS.target
  currentUnitsInput.value = DEFAULTS.current
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('break-even-calculator')
})
</script>
