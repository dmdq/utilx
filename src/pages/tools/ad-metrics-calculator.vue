<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TrendingUp class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">广告指标换算器</h1>
          <p class="text-sm text-muted-foreground mt-1">CPM / CPC / CTR / CVR / CPA / ROAS / ROI / GMV 一键换算，漏斗推算 + 保本 CPA、保本 ROAS 盈亏平衡线</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线广告投放指标换算工具：把投放数据看作「曝光 → 点击 → 转化 → 成交」的漏斗，采用最少已知项求解——只需填写曝光、花费、点击、转化与客单价中的任意几项，
        即可自上而下自动推算 CPM、CPC、CTR、CVR、CPA、ROAS、ROI 与 GMV 八项核心指标，推不出的项会明确标注缺哪项数据；
        填入客单价与毛利率后，还会给出保本 CPA 与保本 ROAS 盈亏平衡线，并与当前实际值对比，直接判断这波投放是赚是亏。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：漏斗数据输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 漏斗数据输入
        </h2>

        <p class="text-xs text-muted-foreground leading-relaxed">
          最少已知项求解：至少填 2 项（如「曝光 + 花费」或「花费 + 点击」），其余指标按漏斗自上而下自动推算；客单价与毛利率选填，用于收益与盈亏平衡核算。
        </p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="ad-metrics-imp" class="text-xs font-medium text-foreground block mb-1.5">曝光 Impressions</label>
            <div class="relative">
              <input
                id="ad-metrics-imp"
                v-model.number="inputs.imp"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="如 200000"
                class="w-full pl-3 pr-10 py-2.5 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">次</span>
            </div>
          </div>
          <div>
            <label for="ad-metrics-spend" class="text-xs font-medium text-foreground block mb-1.5">花费 Spend</label>
            <div class="relative">
              <input
                id="ad-metrics-spend"
                v-model.number="inputs.spend"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                placeholder="如 3000"
                class="w-full pl-3 pr-10 py-2.5 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">元</span>
            </div>
          </div>
          <div>
            <label for="ad-metrics-clicks" class="text-xs font-medium text-foreground block mb-1.5">点击 Clicks</label>
            <div class="relative">
              <input
                id="ad-metrics-clicks"
                v-model.number="inputs.clicks"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="如 6000"
                class="w-full pl-3 pr-10 py-2.5 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">次</span>
            </div>
          </div>
          <div>
            <label for="ad-metrics-conv" class="text-xs font-medium text-foreground block mb-1.5">转化 Conversions</label>
            <div class="relative">
              <input
                id="ad-metrics-conv"
                v-model.number="inputs.conv"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="如 300"
                class="w-full pl-3 pr-10 py-2.5 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">单</span>
            </div>
          </div>
          <div>
            <label for="ad-metrics-aov" class="text-xs font-medium text-foreground block mb-1.5">客单价 AOV<span class="text-muted-foreground font-normal">（选填）</span></label>
            <div class="relative">
              <input
                id="ad-metrics-aov"
                v-model.number="inputs.aov"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                placeholder="如 199"
                class="w-full pl-3 pr-10 py-2.5 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">元</span>
            </div>
          </div>
          <div>
            <label for="ad-metrics-margin" class="text-xs font-medium text-foreground block mb-1.5">毛利率 Margin<span class="text-muted-foreground font-normal">（选填）</span></label>
            <div class="relative">
              <input
                id="ad-metrics-margin"
                v-model.number="inputs.margin"
                type="number"
                min="0"
                max="100"
                step="0.1"
                inputmode="decimal"
                placeholder="如 40"
                class="w-full pl-3 pr-10 py-2.5 bg-background border border-border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="loadSample"
            class="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center justify-center gap-1.5"
          >
            <Play class="w-4 h-4" /> 载入示例
          </button>
          <button
            @click="resetAll"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw class="w-4 h-4" /> 重置
          </button>
        </div>

        <p
          class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
          :class="inputStatus.level === 'warn' ? 'bg-amber-500/10' : ''"
        >
          <CheckCircle v-if="inputStatus.level === 'ok'" class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
          <TriangleAlert v-else-if="inputStatus.level === 'warn'" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <Info v-else class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <span>{{ inputStatus.text }}</span>
        </p>
      </div>

      <!-- 右：漏斗图 + 指标网格 + 盈亏平衡 + 场景速查 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 漏斗图卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Target class="w-5 h-5 mr-2 text-primary" /> 转化漏斗（曝光 → 点击 → 转化）
            </h2>
            <span class="hidden sm:inline text-xs text-muted-foreground">条宽按各层数量的相对比例</span>
          </div>

          <div class="space-y-4">
            <div v-for="layer in funnelLayers" :key="layer.key" class="space-y-1.5">
              <div class="flex items-center justify-between text-sm">
                <p class="font-medium text-foreground">{{ layer.name }}</p>
                <p class="font-mono" :class="layer.value === null ? 'text-muted-foreground' : 'text-foreground font-semibold'">
                  {{ layer.value === null ? '—' : layer.value }}
                  <span v-if="layer.value !== null" class="text-[10px] font-normal text-muted-foreground ml-0.5">{{ layer.unit }}</span>
                </p>
              </div>
              <div class="h-7 rounded-lg bg-muted/60 overflow-hidden relative">
                <div
                  v-if="layer.width !== null"
                  class="h-full rounded-lg transition-all duration-500"
                  :class="layer.barClass"
                  :style="{ width: layer.width + '%' }"
                ></div>
                <span v-else class="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">待补数据</span>
              </div>
              <p class="text-[11px]" :class="layer.good ? 'text-muted-foreground' : 'text-amber-600'">
                <TriangleAlert v-if="!layer.good" class="w-3 h-3 inline mr-0.5 -mt-0.5" />{{ layer.rateText }}
              </p>
            </div>
          </div>
        </div>

        <!-- 指标网格 8 卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 核心指标（自动换算）
            </h2>
            <span class="hidden sm:inline text-xs text-muted-foreground">缺失数据项显示 — 并注明原因</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div v-for="card in metricCards" :key="card.key" class="bg-muted/40 border border-border rounded-lg p-4 space-y-1">
              <div class="flex items-baseline justify-between gap-1">
                <p class="text-sm font-semibold text-foreground">{{ card.name }}</p>
                <p class="text-[10px] text-muted-foreground truncate" :title="card.full">{{ card.full }}</p>
              </div>
              <p class="text-xl font-bold font-mono" :class="card.value === null ? 'text-muted-foreground/60' : 'text-primary'">
                {{ card.text }}<span v-if="card.value !== null && card.unit === 'ratio'" class="text-xs font-normal text-muted-foreground ml-0.5">倍</span>
              </p>
              <p class="text-[11px] text-muted-foreground leading-snug">{{ card.hint }}</p>
              <p class="text-[10px] font-mono text-muted-foreground/70">{{ card.formula }}</p>
              <p v-if="card.value === null" class="text-[11px] text-amber-600 flex items-center gap-1">
                <TriangleAlert class="w-3 h-3 flex-shrink-0" />{{ card.missingText }}
              </p>
            </div>
          </div>
        </div>

        <!-- 盈亏平衡卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold flex items-center">
              <Calculator class="w-5 h-5 mr-2 text-primary" /> 盈亏平衡分析
            </h2>
            <span class="inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium" :class="breakEven.active ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground border-border'">
              {{ breakEven.active ? '已激活' : '待填写客单价 + 毛利率' }}
            </span>
          </div>

          <div v-if="breakEven.active" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="row in breakEvenRows" :key="row.label" class="bg-muted/40 border border-border rounded-lg p-4 space-y-1">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-foreground">{{ row.label }}</p>
                <span
                  v-if="row.verdict !== null"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium flex-shrink-0"
                  :class="row.verdict === 'good' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'"
                >
                  <CheckCircle v-if="row.verdict === 'good'" class="w-3 h-3" />
                  <TriangleAlert v-else class="w-3 h-3" />
                  {{ row.verdictText }}
                </span>
              </div>
              <p class="text-lg font-bold font-mono" :class="row.verdict === 'bad' ? 'text-red-600' : row.verdict === 'good' ? 'text-green-600' : 'text-foreground'">{{ row.value }}</p>
              <p class="text-[11px] text-muted-foreground leading-snug">{{ row.sub }} · {{ row.note }}</p>
            </div>
          </div>

          <p v-else class="text-xs text-muted-foreground leading-relaxed p-2.5 rounded bg-muted/60">
            填写「客单价」与「毛利率」后自动激活：保本 CPA = 客单价 × 毛利率（客单价 199 元 × 毛利 40% = 每单最多花 79.60 元获客），
            保本 ROAS = 100 ÷ 毛利率（毛利 40% → 保本 ROAS 2.5，即每花 1 元至少带回 2.5 元成交额才不亏）。
          </p>
        </div>

        <!-- 场景速查表 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-semibold flex items-center">
              <Info class="w-5 h-5 mr-2 text-primary" /> 场景速查表
            </h2>
            <span class="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">行业区间仅供参考</span>
          </div>
          <div class="divide-y divide-border">
            <div v-for="row in SCENARIO_ROWS" :key="row.scene" class="py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
              <p class="sm:w-44 flex-shrink-0 text-sm font-medium text-foreground">{{ row.scene }}</p>
              <p class="sm:w-36 flex-shrink-0 text-sm font-mono text-primary">{{ row.range }}</p>
              <p class="text-xs text-muted-foreground leading-relaxed flex-1">{{ row.note }}</p>
            </div>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>广告指标换算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          广告指标换算器是一款面向投放优化师与商家的在线换算工具。它把广告投放数据看成一条漏斗：曝光 → 点击 → 转化 → 成交，
          并采用「最少已知项求解」的方式，从你填写的曝光、花费、点击、转化与客单价中，自动推算 CPM（千次曝光成本）、CPC（单次点击成本）、CTR（点击率）、
          CVR（转化率）、CPA（单次转化成本）、ROAS（广告支出回报率）、ROI（投资回报率）与 GMV（成交总额）八项核心指标；
          推不出的项会标注缺哪项数据。填入客单价与毛利率后，工具还会计算保本 CPA 与保本 ROAS 盈亏平衡线，并与当前实际 CPA / ROAS 对比，
          用红绿色直接标出当前投放的盈亏状态。所有计算都在浏览器本地完成，不上传任何账户数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CPM、CPC、CPA 是什么区别？（三种计费模式）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三者都是「平均成本」指标，差别在计费锚点：CPM = 花费 ÷ 曝光数 × 1000，按千次曝光付费，买的是「看见」，适合品牌曝光与内容种草；
          CPC = 花费 ÷ 点击数，按点击付费，买的是「流量」，适合引流与拉新；CPA = 花费 ÷ 转化数，按效果付费，买的是「结果」，离生意最近。
          很多平台名义上按 CPM / CPC 结算，实际会用 oCPM 优化出价自动逼近目标 CPA。看报表时三个都要看：CPM 反映流量竞争环境，
          CPC 反映素材点击质量，CPA 反映最终获客效率。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">CTR 和 CVR 分别衡量什么？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          CTR = 点击 ÷ 曝光 × 100%，衡量素材与定向的吸引力：人群找得准不准、创意够不够让人想点。CVR = 转化 ÷ 点击 × 100%，
          衡量落地页的承接能力：页面加载速度、卖点表达、表单或下单流程是否顺畅。排查口诀：CTR 低先改素材和定向，CVR 低先改落地页和转化路径；
          两者都低时先解决 CTR——没有点击就没有转化，后面的环节无从谈起。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">ROAS 和 ROI 的区别（分母口径）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          ROAS = 成交额 ÷ 花费，分母是花费，衡量「每 1 元广告费带回多少成交额」，不扣成本口径；ROI = (成交额 − 花费) ÷ 花费 × 100%，
          衡量「扣除花费后净赚的比例」。同一组数据下两者可以互相换算：ROI = (ROAS − 1) × 100%，例如 ROAS 2.0 对应 ROI 100%，
          ROAS 1.2 对应 ROI 20%。两者在汇报里极易混用：运营口头说「ROI 做到 2」，往往指的是 ROAS = 2（即 ROI 100%）。
          对账与汇报前先统一口径，避免同一个数出现两套说法。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">保本 ROAS 怎么算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          保本 ROAS = 100 ÷ 毛利率。毛利率 40% 时保本 ROAS = 100 ÷ 40 = 2.5，意味着每花 1 元广告费至少要带回 2.5 元成交额才不亏；
          对应的保本 CPA = 客单价 × 毛利率，例如客单价 199 元、毛利 40% 时，每单获客成本最高 79.60 元。注意这里的毛利率是销售毛利率，
          且默认只扣广告费；如果还有仓储、物流、平台佣金、退货损耗等成本，应先把它们折进毛利率再计算，否则保本线会偏乐观。
          实际 ROAS 高于保本线说明有利润空间，可考虑逐步放量。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">新账户先看哪个指标？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          建议按漏斗从上往下看：冷启动期先看 CPM（判断计划能否起量、流量竞争环境）和 CTR（判断素材是否过关）；有量级后再看 CPC 与 CVR，
          定位问题是「买贵了」还是「接不住」；当转化数积累到 30 单以上、数据有统计意义时，才用 CPA 与 ROAS 做预算和出价决策。
          样本太小时 CPA / ROAS 波动极大，一两个偶然转化就能带偏结论，不建议作为早期唯一的决策依据。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">CPM、CPC、CPA 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">三者是三种计费锚点：CPM 按千次曝光付费（买曝光）、CPC 按点击付费（买流量）、CPA 按转化付费（买结果），风险依次从平台向广告主转移。CPM 反映流量竞争环境，CPC 反映素材点击质量，CPA 反映最终获客效率，看报表时建议三项结合。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">CTR 和 CVR 分别衡量什么？</h3>
            <p class="text-sm text-muted-foreground mt-1">CTR = 点击 ÷ 曝光，衡量素材与定向的吸引力；CVR = 转化 ÷ 点击，衡量落地页的承接转化能力。CTR 低优先改素材和定向，CVR 低优先改落地页与转化路径。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">ROAS 和 ROI 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">分母口径不同：ROAS = 成交额 ÷ 花费，ROI = (成交额 − 花费) ÷ 花费 × 100%。换算关系为 ROI = (ROAS − 1) × 100%，ROAS 2.0 即 ROI 100%。汇报前先统一口径，避免「同一个数两套说法」。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">保本 ROAS 怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">保本 ROAS = 100 ÷ 毛利率，毛利率 40% 时为 2.5；保本 CPA = 客单价 × 毛利率。若还有物流、佣金等固定成本，应先折进毛利率再算，否则保本线偏乐观。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">新账户投放先看哪个指标？</h3>
            <p class="text-sm text-muted-foreground mt-1">按漏斗自上而下：先看 CPM 与 CTR 判断起量与素材，再看 CPC 与 CVR 定位买贵还是接不住，转化积累到 30 单以上后再用 CPA / ROAS 做预算决策；样本太小时二者波动极大，不宜作为早期唯一依据。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ad-metrics-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  TrendingUp, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Target
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '广告指标换算器 - CPM/CPC/CPA/CTR/ROAS/ROI 在线计算工具',
  description: '免费在线广告投放指标换算器：输入曝光、花费、点击、转化与客单价，自动推算 CPM、CPC、CTR、CVR、CPA、ROAS、ROI 与 GMV，附转化漏斗可视化与保本 CPA / 保本 ROAS 盈亏平衡对比，纯浏览器本地计算不上传数据。',
  keywords: '广告指标换算器,CPM 计算,CPC CPA CTR,广告投放指标,ROI ROAS,投放换算,保本 ROAS,获客成本',
  author: '有条工具',
  ogTitle: '广告指标换算器 - CPM/CPC/CPA/CTR/ROAS/ROI 在线计算工具 | 有条工具',
  ogDescription: '最少已知项求解：填几项漏斗数据自动推算 8 项投放指标，含保本 CPA / 保本 ROAS 盈亏平衡线。',
  ogUrl: 'https://www.util.cn/tools/ad-metrics-calculator',
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
          name: '广告指标换算器',
          url: 'https://www.util.cn/tools/ad-metrics-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['最少已知项漏斗求解', 'CPM/CPC/CTR/CVR/CPA 一键换算', 'ROAS/ROI/GMV 收益核算', '转化漏斗可视化', '保本 CPA 与保本 ROAS 盈亏平衡线', '本地计算不上传数据']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '广告指标换算器', item: 'https://www.util.cn/tools/ad-metrics-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'CPM、CPC、CPA 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '三者是三种计费锚点：CPM 按千次曝光付费（买曝光）、CPC 按点击付费（买流量）、CPA 按转化付费（买结果），风险依次从平台向广告主转移。CPM 反映流量竞争环境，CPC 反映素材点击质量，CPA 反映最终获客效率，看报表时建议三项结合。' }
            },
            {
              '@type': 'Question',
              name: 'CTR 和 CVR 分别衡量什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'CTR = 点击 ÷ 曝光，衡量素材与定向的吸引力；CVR = 转化 ÷ 点击，衡量落地页的承接转化能力。CTR 低优先改素材和定向，CVR 低优先改落地页与转化路径。' }
            },
            {
              '@type': 'Question',
              name: 'ROAS 和 ROI 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: '分母口径不同：ROAS = 成交额 ÷ 花费，ROI = (成交额 − 花费) ÷ 花费 × 100%。换算关系为 ROI = (ROAS − 1) × 100%，ROAS 2.0 即 ROI 100%。汇报前先统一口径。' }
            },
            {
              '@type': 'Question',
              name: '保本 ROAS 怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: '保本 ROAS = 100 ÷ 毛利率，毛利率 40% 时为 2.5；保本 CPA = 客单价 × 毛利率。若还有物流、佣金等固定成本，应先折进毛利率再算，否则保本线偏乐观。' }
            },
            {
              '@type': 'Question',
              name: '新账户投放先看哪个指标？',
              acceptedAnswer: { '@type': 'Answer', text: '按漏斗自上而下：先看 CPM 与 CTR 判断起量与素材，再看 CPC 与 CVR 定位买贵还是接不住，转化积累到 30 单以上后再用 CPA / ROAS 做预算决策。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 输入规范化：空 / 非法 / 负数 → null，其余转数字
function toNum(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

// 四舍五入保留 2 位小数（金额与百分数统一口径）
function round2(n) {
  return Math.round(n * 100) / 100
}

// 整数千分位分组（200000 → '200,000'），不依赖 Intl，保证 SSR / CSR 输出一致
function groupInt(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 金额格式化：59700 → '¥59,700.00'，空值 → null
function fmtMoney(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return null
  const parts = round2(v).toFixed(2).split('.')
  return `¥${groupInt(Number(parts[0]))}.${parts[1]}`
}

// 百分数格式化：3 → '3.00%'
function fmtPct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return null
  return `${round2(v).toFixed(2)}%`
}

// 倍率格式化：19.9 → '19.90'
function fmtRatio(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return null
  return round2(v).toFixed(2)
}

// 整数格式化：6000 → '6,000'
function fmtInt(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return null
  return groupInt(Math.round(v))
}

// 比值工具：分子或分母缺失、分母 ≤ 0（除零）→ null
function pctRatioOf(num, den) {
  if (num === null || den === null || den <= 0) return null
  return round2((num / den) * 100)
}
function moneyRatioOf(num, den) {
  if (num === null || den === null || den <= 0) return null
  return round2(num / den)
}

// CTR 点击率（%）= 点击 ÷ 曝光 × 100
function ctrOf(clicks, imp) {
  return pctRatioOf(clicks, imp)
}

// CPM 千次曝光成本（元）= 花费 ÷ 曝光 × 1000
function cpmOf(spend, imp) {
  if (spend === null || imp === null || imp <= 0) return null
  return round2((spend / imp) * 1000)
}

// CPC 单次点击成本（元）= 花费 ÷ 点击
function cpcOf(spend, clicks) {
  return moneyRatioOf(spend, clicks)
}

// CVR 转化率（%）= 转化 ÷ 点击 × 100
function cvrOf(conv, clicks) {
  return pctRatioOf(conv, clicks)
}

// CPA 单次转化成本（元）= 花费 ÷ 转化
function cpaOf(spend, conv) {
  return moneyRatioOf(spend, conv)
}

// ROAS 广告支出回报率（倍）= 转化 × 客单价 ÷ 花费
function roasOf(conv, aov, spend) {
  if (conv === null || aov === null || spend === null || spend <= 0) return null
  return round2((conv * aov) / spend)
}

// ROI 投资回报率（%）= (转化 × 客单价 − 花费) ÷ 花费 × 100
function roiOf(conv, aov, spend) {
  if (conv === null || aov === null || spend === null || spend <= 0) return null
  return round2(((conv * aov - spend) / spend) * 100)
}

// GMV 成交总额（元）= 转化 × 客单价
function gmvOf(conv, aov) {
  if (conv === null || aov === null) return null
  return round2(conv * aov)
}

// 保本 CPA（元）= 客单价 × 毛利率%（marginPct 缺省 100% 时即客单价本身；毛利率未填/非正 → null）
function breakEvenCpaOf(aov, marginPct = 100) {
  const a = toNum(aov)
  const m = toNum(marginPct === undefined ? 100 : marginPct)
  if (a === null || a <= 0 || m === null || m <= 0) return null
  return round2((a * m) / 100)
}

// 保本 ROAS（倍）= 100 ÷ 毛利率%（毛利 50% → 2.0；毛利率未填/非正 → null）
function breakEvenRoasOf(marginPct = 100) {
  const m = toNum(marginPct === undefined ? 100 : marginPct)
  if (m === null || m <= 0) return null
  return round2(100 / m)
}

// ---------- 指标定义与依赖 ----------
const METRIC_DEFS = [
  { key: 'cpm', name: 'CPM', full: '千次曝光成本', unit: 'money', formula: '花费 ÷ 曝光 × 1000', hint: '每 1000 次曝光花多少钱' },
  { key: 'cpc', name: 'CPC', full: '单次点击成本', unit: 'money', formula: '花费 ÷ 点击', hint: '每来一次点击花多少钱' },
  { key: 'ctr', name: 'CTR', full: '点击率', unit: 'pct', formula: '点击 ÷ 曝光 × 100%', hint: '平均多少次曝光换来一次点击' },
  { key: 'cvr', name: 'CVR', full: '转化率', unit: 'pct', formula: '转化 ÷ 点击 × 100%', hint: '多少次点击换来一次转化' },
  { key: 'cpa', name: 'CPA', full: '单次转化成本', unit: 'money', formula: '花费 ÷ 转化', hint: '每获得一单转化花多少钱' },
  { key: 'roas', name: 'ROAS', full: '广告支出回报率', unit: 'ratio', formula: '转化 × 客单价 ÷ 花费', hint: '每花 1 元带回多少成交额' },
  { key: 'roi', name: 'ROI', full: '投资回报率', unit: 'pct', formula: '(成交额 − 花费) ÷ 花费 × 100%', hint: '扣除花费后赚回百分之多少' },
  { key: 'gmv', name: 'GMV', full: '成交总额', unit: 'money', formula: '转化 × 客单价', hint: '这波转化一共值多少钱' }
]

// 各指标依赖的原始量（用于「缺数据」原因标注）
const METRIC_NEEDS = {
  cpm: ['spend', 'imp'],
  cpc: ['spend', 'clicks'],
  ctr: ['clicks', 'imp'],
  cvr: ['conv', 'clicks'],
  cpa: ['spend', 'conv'],
  roas: ['conv', 'aov', 'spend'],
  roi: ['conv', 'aov', 'spend'],
  gmv: ['conv', 'aov']
}

const RAW_LABELS = { imp: '曝光数', spend: '花费', clicks: '点击数', conv: '转化数', aov: '客单价' }

// 由五个原始量一次性计算全部可解指标（推不出的项为 null）
function computeMetrics(d) {
  return {
    cpm: cpmOf(d.spend, d.imp),
    ctr: ctrOf(d.clicks, d.imp),
    cpc: cpcOf(d.spend, d.clicks),
    cvr: cvrOf(d.conv, d.clicks),
    cpa: cpaOf(d.spend, d.conv),
    roas: roasOf(d.conv, d.aov, d.spend),
    roi: roiOf(d.conv, d.aov, d.spend),
    gmv: gmvOf(d.conv, d.aov)
  }
}

// 反推规则表：已知「指标 + 比值另一方」时回填缺失的原始量。
// 注意：比值指标的定义本身同时依赖两个原始量，因此纯漏斗输入下通常无可回填项
//（如 clicks = imp × CTR 需 CTR，而 CTR 又需 clicks，循环不可解 → 保持 null 并标「缺数据」）。
// 保留不动点结构：若未来支持直接输入指标值，此结构即可自动串联求解。
const BACK_FILL_RULES = [
  { target: 'imp', metric: 'ctr', calc: (d, m) => (d.clicks !== null ? (d.clicks * 100) / m.ctr : null) },
  { target: 'clicks', metric: 'ctr', calc: (d, m) => (d.imp !== null ? (d.imp * m.ctr) / 100 : null) },
  { target: 'imp', metric: 'cpm', calc: (d, m) => (d.spend !== null ? (d.spend * 1000) / m.cpm : null) },
  { target: 'spend', metric: 'cpm', calc: (d, m) => (d.imp !== null ? (d.imp * m.cpm) / 1000 : null) },
  { target: 'clicks', metric: 'cpc', calc: (d, m) => (d.spend !== null ? d.spend / m.cpc : null) },
  { target: 'spend', metric: 'cpc', calc: (d, m) => (d.clicks !== null ? d.clicks * m.cpc : null) },
  { target: 'clicks', metric: 'cvr', calc: (d, m) => (d.conv !== null ? (d.conv * 100) / m.cvr : null) },
  { target: 'conv', metric: 'cvr', calc: (d, m) => (d.clicks !== null ? (d.clicks * m.cvr) / 100 : null) },
  { target: 'conv', metric: 'cpa', calc: (d, m) => (d.spend !== null ? d.spend / m.cpa : null) },
  { target: 'spend', metric: 'cpa', calc: (d, m) => (d.conv !== null ? d.conv * m.cpa : null) }
]

// 漏斗求解：自上而下逐层推算（曝光/花费 → CPM、点击 → CTR/CPC → 转化 → CVR/CPA → ROAS/ROI/GMV），
// 缺失的原始量先按反推规则尝试回填（不动点迭代，最多 3 轮），推不出的项保持 null 并给出缺数据原因
function solveFunnel(input) {
  const src = input || {}
  const d = {
    imp: toNum(src.imp),
    spend: toNum(src.spend),
    clicks: toNum(src.clicks),
    conv: toNum(src.conv),
    aov: toNum(src.aov)
  }
  const filled = { imp: false, spend: false, clicks: false, conv: false, aov: false }

  for (let pass = 0; pass < 3; pass++) {
    const m = computeMetrics(d)
    const snapshot = JSON.stringify(d)
    for (const rule of BACK_FILL_RULES) {
      if (m[rule.metric] === null || d[rule.target] !== null) continue
      const v = rule.calc(d, m)
      if (v !== null && Number.isFinite(v) && v >= 0) {
        d[rule.target] = round2(v)
        filled[rule.target] = true
      }
    }
    if (JSON.stringify(d) === snapshot) break
  }

  const metrics = computeMetrics(d)
  const missing = {}
  for (const def of METRIC_DEFS) {
    if (metrics[def.key] === null) {
      const lack = METRIC_NEEDS[def.key].filter((k) => d[k] === null).map((k) => RAW_LABELS[k])
      missing[def.key] = lack.length ? `缺${lack.join('、')}` : '除数为 0，无法计算'
    }
  }
  return { data: d, metrics, missing, filled }
}

// 场景速查表（静态常识参考，行业区间仅供参考）
const SCENARIO_ROWS = [
  {
    scene: '信息流 CPM',
    range: '约 ¥5 – ¥40',
    note: '抖音、朋友圈等原生信息流常见区间，一线城市、优质版位与大促竞争期偏高；长期低于 ¥3 多为长尾或低质流量。'
  },
  {
    scene: '电商 ROAS 2 – 4',
    range: '保本线 = 100 ÷ 毛利率',
    note: '毛利率 50% 时保本 ROAS = 2.0：ROAS 2–4 意味着毛利打平到翻倍之间；低于 2.0 大概率亏损，稳定高于 4 可考虑逐步放量。'
  },
  {
    scene: '教育 CPA ¥30',
    range: '试听课获客 ¥30 – ¥100',
    note: 'K12 / 职业教育试听课报名 30 元/人属于优秀水平；正价课转化成本通常数倍于此，需结合转化周期与客单价综合评估。'
  },
  {
    scene: 'CTR 参考区间',
    range: '信息流 1% – 3%',
    note: '原生信息流点击率 1%–3% 常见，搜索广告 2%–5%；持续低于 1% 优先优化素材与定向，而不是直接加价抢排名。'
  },
  {
    scene: '落地页 CVR',
    range: '1% – 5%',
    note: '点击到表单 / 下单的转化率 1%–5% 常见；低于 1% 先查页面加载速度、表单步骤与信任元素，再怀疑流量质量问题。'
  }
]

// ---------- 输入与视图状态 ----------
const EMPTY_INPUTS = () => ({ imp: '', spend: '', clicks: '', conv: '', aov: '', margin: '' })
const inputs = ref(EMPTY_INPUTS())
const seoContentVisible = ref(true)
const STORAGE_KEY = 'ad-metrics-calculator:inputs'

// localStorage 读写均包 try/catch：隐私模式 / 配额异常时静默降级
function loadSavedInputs() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch (e) {
    return null
  }
}

function persistInputs(data) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    // 忽略写入失败
  }
}

const marginNum = computed(() => toNum(inputs.value.margin))

const solved = computed(() => solveFunnel({
  imp: inputs.value.imp,
  spend: inputs.value.spend,
  clicks: inputs.value.clicks,
  conv: inputs.value.conv,
  aov: inputs.value.aov
}))

// 指标卡展示值：金额 / 百分数 / 倍率各自格式化，缺失显示 —
function metricValueText(def, v) {
  if (v === null) return '—'
  if (def.unit === 'money') return fmtMoney(v)
  if (def.unit === 'pct') return fmtPct(v)
  return fmtRatio(v)
}

const metricCards = computed(() =>
  METRIC_DEFS.map((def) => {
    const value = solved.value.metrics[def.key]
    return {
      ...def,
      value,
      text: metricValueText(def, value),
      missingText: value === null ? solved.value.missing[def.key] || '缺数据' : null
    }
  })
)

// 漏斗三层：相对宽度 + 每层转化率说明
const funnelLayers = computed(() => {
  const { imp, clicks, conv } = solved.value.data
  const m = solved.value.metrics
  const base = Math.max(imp || 0, clicks || 0, conv || 0)
  const widthOf = (v) => {
    if (v === null || base <= 0) return null
    return Math.min(100, Math.max(3, (v / base) * 100))
  }
  const overall = ctrOf(conv, imp)
  let convRate = null
  if (m.cvr !== null) convRate = `点击转化率 CVR ${fmtPct(m.cvr)}`
  else if (overall !== null) convRate = `全链路转化率 ${fmtPct(overall)}（缺点击数）`

  return [
    {
      key: 'imp',
      name: '曝光 Impressions',
      value: fmtInt(imp),
      unit: '次',
      width: widthOf(imp),
      barClass: 'bg-primary',
      good: imp !== null,
      rateText: imp === null ? '缺曝光数据' : '漏斗起点：广告被展示的次数'
    },
    {
      key: 'clicks',
      name: '点击 Clicks',
      value: fmtInt(clicks),
      unit: '次',
      width: widthOf(clicks),
      barClass: 'bg-primary/70',
      good: m.ctr !== null,
      rateText: m.ctr !== null ? `点击率 CTR ${fmtPct(m.ctr)}（曝光 → 点击）` : '缺点击或曝光数据，无法计算点击率'
    },
    {
      key: 'conv',
      name: '转化 Conversions',
      value: fmtInt(conv),
      unit: '单',
      width: widthOf(conv),
      barClass: 'bg-primary/45',
      good: m.cvr !== null || overall !== null,
      rateText: convRate || '缺转化数据：点击缺失时无法推算转化，需手动填写'
    }
  ]
})

// 盈亏平衡：客单价 + 毛利率齐备后激活
const breakEven = computed(() => {
  const aov = solved.value.data.aov
  const m = marginNum.value
  const beCpa = breakEvenCpaOf(aov, m)
  const beRoas = breakEvenRoasOf(m)
  return {
    aov,
    m,
    beCpa,
    beRoas,
    cpa: solved.value.metrics.cpa,
    roas: solved.value.metrics.roas,
    active: beCpa !== null && beRoas !== null
  }
})

const breakEvenRows = computed(() => {
  const be = breakEven.value
  if (!be.active) return []
  const rows = [
    {
      label: '保本 CPA',
      sub: '每单最多能花的获客成本',
      value: fmtMoney(be.beCpa),
      note: `客单价 ${fmtMoney(be.aov)} × 毛利率 ${be.m}%`,
      verdict: null,
      verdictText: ''
    },
    {
      label: '保本 ROAS',
      sub: '回本所需最低产出比',
      value: fmtRatio(be.beRoas),
      note: `100 ÷ 毛利率 ${be.m}`,
      verdict: null,
      verdictText: ''
    }
  ]
  if (be.cpa !== null) {
    const diff = round2(be.beCpa - be.cpa)
    const good = diff >= 0
    rows.push({
      label: '实际 CPA vs 保本线',
      sub: good ? '低于保本线，每单有利润' : '高于保本线，每单亏损',
      value: `${fmtMoney(be.cpa)} / ${fmtMoney(be.beCpa)}`,
      note: good ? `每单剩余毛利空间 ${fmtMoney(diff)}` : `每单超支 ${fmtMoney(-diff)}`,
      verdict: good ? 'good' : 'bad',
      verdictText: good ? '低于保本' : '高于保本'
    })
  } else {
    rows.push({
      label: '实际 CPA vs 保本线',
      sub: '尚无法评估',
      value: '—',
      note: '需已知花费与转化数才能算出实际 CPA',
      verdict: null,
      verdictText: ''
    })
  }
  if (be.roas !== null) {
    const diff = round2(be.roas - be.beRoas)
    const good = diff >= 0
    rows.push({
      label: '实际 ROAS vs 保本线',
      sub: good ? '高于保本线，有放量空间' : '低于保本线，优化后再放量',
      value: `${fmtRatio(be.roas)} / ${fmtRatio(be.beRoas)}`,
      note: good ? `高出保本线 ${fmtRatio(diff)}` : `距保本线还差 ${fmtRatio(-diff)}`,
      verdict: good ? 'good' : 'bad',
      verdictText: good ? '高于保本' : '低于保本'
    })
  } else {
    rows.push({
      label: '实际 ROAS vs 保本线',
      sub: '尚无法评估',
      value: '—',
      note: '需已知花费、转化数与客单价才能算出实际 ROAS',
      verdict: null,
      verdictText: ''
    })
  }
  return rows
})

// 输入状态提示
const inputStatus = computed(() => {
  const raw = inputs.value
  const keys = ['imp', 'spend', 'clicks', 'conv', 'aov', 'margin']
  const invalid = keys.some((k) => raw[k] !== '' && raw[k] !== null && raw[k] !== undefined && toNum(raw[k]) === null)
  const provided = ['imp', 'spend', 'clicks', 'conv'].filter((k) => toNum(raw[k]) !== null).length
  const metrics = solved.value.metrics
  const solvedCount = METRIC_DEFS.filter((def) => metrics[def.key] !== null).length
  const data = solved.value.data
  const blocking = []
  for (const k of ['imp', 'spend', 'clicks', 'conv', 'aov']) {
    if (data[k] === null && METRIC_DEFS.some((def) => metrics[def.key] === null && METRIC_NEEDS[def.key].includes(k))) {
      blocking.push(RAW_LABELS[k])
    }
  }
  let level = 'info'
  let text = ''
  if (invalid) {
    level = 'warn'
    text = '存在无效数值：所有输入需为 ≥ 0 的数字，负数与非法字符不参与计算。'
  } else if (provided < 2) {
    level = 'info'
    text = '至少填写 2 项漏斗数据（曝光 / 花费 / 点击 / 转化），如「曝光 + 花费」或「花费 + 点击」，即可自动推算能解出的指标。'
  } else if (solvedCount === METRIC_DEFS.length) {
    level = 'ok'
    text = '8 项指标全部解出，漏斗链路完整。'
  } else {
    level = 'warn'
    text = `已解出 ${solvedCount} / ${METRIC_DEFS.length} 项指标，其余因缺少${blocking.join('、')}暂无法推算，补齐后自动更新。`
  }
  return { level, text, solvedCount, total: METRIC_DEFS.length }
})

// ---------- 操作 ----------
function loadSample() {
  inputs.value = { imp: 200000, spend: 3000, clicks: 6000, conv: 300, aov: 199, margin: 40 }
}

function resetAll() {
  inputs.value = EMPTY_INPUTS()
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  // 恢复上次输入（SSR 渲染默认空表单，挂载后回填，无水合不一致）
  const saved = loadSavedInputs()
  if (saved) inputs.value = { ...EMPTY_INPUTS(), ...saved }
  watch(inputs, (v) => persistInputs({ ...v }), { deep: true })

  addRecentTool('ad-metrics-calculator')
})
</script>
