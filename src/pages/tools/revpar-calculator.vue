<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Building2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">RevPAR 收益计算</h1>
          <p class="text-sm text-muted-foreground mt-1">酒店民宿 RevPAR / ADR / 入住率三指标互算 · 定价反推 · 周期对比 · 短租平台口径提示</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        酒店与民宿收益管理的核心指标计算器：输入房间数、天数、已售房晚与房费收入四个原始量，
        自动算出 ADR（已售房晚平均房价）、OCC（入住率）与 RevPAR（每可售房晚收入），两种算法（ADR×OCC 与 房费收入÷可售房晚）互相印证闭环一致；
        支持目标 RevPAR + 目标入住率反推定价（ADR 引导），本月 vs 上月双列周期对比（差值与百分比变化，涨绿跌红），
        并给民宿短租平台的佣金口径提示与「入住率 100% 不是目标」的收益管理科普。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 说明条 -->
    <div class="flex items-start gap-2 px-4 py-3 mb-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-foreground">
      <Info class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
      <span>口径先行：ADR、OCC、RevPAR 全程用同一套口径（建议按平台到手价算房费收入）即可对比；「可售房晚 = 房间数 × 天数」，RevPAR = ADR × OCC = 房费收入 ÷ 可售房晚，两种算法本页会互相校验。</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左列 -->
      <div class="space-y-6">
        <!-- 输入卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 经营数据
          </h2>

          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="field-label">房间数（间）</span>
              <input v-model.number="roomsInput" type="number" min="1" step="1" placeholder="如：10" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">统计天数（晚）</span>
              <input v-model.number="daysInput" type="number" min="1" step="1" placeholder="如：30" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">已售房晚（间夜）</span>
              <input v-model.number="soldInput" type="number" min="0" step="1" placeholder="如：210" class="input-base" />
              <span class="text-[10px] text-muted-foreground mt-1 block">10 间房住 3 晚 = 30 间夜</span>
            </label>
            <label class="block">
              <span class="field-label">房费收入（元）</span>
              <input v-model.number="revenueInput" type="number" min="0" step="100" placeholder="如：63000" class="input-base" />
              <span class="text-[10px] text-muted-foreground mt-1 block">只算房费，不含早餐等其他收入</span>
            </label>
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
              <Play class="w-4 h-4" /> 载入民宿示例
            </button>
            <button
              @click="resetInputs"
              class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw class="w-4 h-4" /> 重置
            </button>
          </div>
        </div>

        <!-- 定价反推卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <ArrowRightLeft class="w-5 h-5 mr-2 text-primary" /> 定价反推：目标 RevPAR → 需要 ADR
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="field-label">目标 RevPAR（元/可售房晚）</span>
              <input v-model.number="targetRevparInput" type="number" min="0" step="10" placeholder="如：210" class="input-base" />
            </label>
            <label class="block">
              <span class="field-label">预计入住率 OCC（%）</span>
              <input v-model.number="targetOccInput" type="number" min="1" max="100" step="1" placeholder="如：70" class="input-base" />
            </label>
          </div>
          <div v-if="targetAdr !== null" class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">在 {{ targetOccText }} 入住率下做到 RevPAR {{ fmtNum(targetRevpar) }} 元，平均房价需要</p>
            <p class="text-3xl font-bold text-primary">ADR ≥ {{ fmtNum(targetAdr) }} 元</p>
            <p class="text-xs text-muted-foreground mt-2">公式：ADR = 目标 RevPAR ÷ OCC = {{ fmtNum(targetRevpar) }} ÷ {{ targetOccText }}</p>
            <p v-if="adrCompareText" class="text-xs mt-2 leading-relaxed" :class="adrCompareClass">{{ adrCompareText }}</p>
          </div>
          <p v-else class="text-sm text-muted-foreground">填入大于 0 的目标 RevPAR 与入住率（0 < OCC ≤ 100），即可反推需要的平均房价。</p>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>用法：先看竞对或自己的历史 RevPAR 定目标，再假设能做到的入住率，反推出的 ADR 就是挂牌价的定价底线——注意旺季可上浮、淡季要预留折扣空间。</span>
          </p>
        </div>
      </div>

      <!-- 右列 -->
      <div class="space-y-6">
        <!-- 三指标结果卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 三指标结果
          </h2>

          <template v-if="canCompute">
            <div class="bg-primary/10 rounded-lg p-6 text-center">
              <p class="text-xs text-muted-foreground mb-1">RevPAR（每可售房晚收入，含空置房）</p>
              <p class="text-5xl font-bold text-primary leading-none">{{ fmtNum(revparByRevenue) }}</p>
              <p class="text-sm font-medium text-primary mt-2">元 / 可售房晚</p>
              <p class="text-xs text-muted-foreground mt-3">
                可售房晚 {{ fmtNum(availableNights) }} = {{ fmtNum(rooms) }} 间 × {{ fmtNum(days) }} 晚 · 已售 {{ fmtNum(sold) }} 间夜
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">ADR（已售房晚平均房价）</p>
                <p class="text-xl font-bold text-foreground">{{ adr === null ? '—' : `${fmtNum(adr)} 元` }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">房费收入 ÷ 已售房晚</p>
              </div>
              <div class="bg-muted/50 rounded-lg p-3">
                <p class="text-[10px] text-muted-foreground mb-1">OCC（入住率）</p>
                <p class="text-xl font-bold text-foreground">{{ occ === null ? '—' : `${fmtNum(occ)}%` }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">已售 ÷ 可售房晚</p>
              </div>
            </div>

            <!-- 闭环校验 -->
            <div v-if="closedLoopOk" class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p class="text-xs text-green-700 leading-relaxed">
                闭环校验一致：ADR {{ fmtNum(adr) }} 元 × OCC {{ fmtNum(occ) }}% = {{ fmtNum(revparByRate) }} 元，与 房费收入 ÷ 可售房晚 = {{ fmtNum(revparByRevenue) }} 元 相符。
              </p>
            </div>
            <div v-else-if="revparByRate !== null" class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <TriangleAlert class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p class="text-xs text-red-600 leading-relaxed">
                闭环校验不一致：ADR×OCC = {{ fmtNum(revparByRate) }} 元，但 房费收入÷可售房晚 = {{ fmtNum(revparByRevenue) }} 元。请检查已售房晚、房费收入是否与同一口径。
              </p>
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
              <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>RevPAR 与 ADR 的区别：ADR 只统计卖出去的房（卖得越贵越好），RevPAR 把空置房也算进分母（卖得贵还得卖得多）——所以 RevPAR 才是平衡价格与出租率的收益指标。</span>
            </p>
          </template>
          <div v-else class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-2">
            <TriangleAlert class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-red-600 leading-relaxed">{{ inputWarning || '请先填写房间数与统计天数（均大于 0）。' }}</p>
          </div>
        </div>

        <!-- 周期对比卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <CalendarDays class="w-5 h-5 mr-2 text-primary" /> 周期对比：本月 vs 上月
          </h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <p class="text-xs font-semibold text-foreground">本月</p>
              <label class="block">
                <span class="field-label">房费收入（元）</span>
                <input v-model.number="curRevenueInput" type="number" min="0" step="100" placeholder="63000" class="input-base" />
              </label>
              <label class="block">
                <span class="field-label">已售房晚</span>
                <input v-model.number="curSoldInput" type="number" min="0" step="1" placeholder="210" class="input-base" />
              </label>
              <label class="block">
                <span class="field-label">可售房晚</span>
                <input v-model.number="curAvailableInput" type="number" min="1" step="1" placeholder="300" class="input-base" />
              </label>
            </div>
            <div class="space-y-2">
              <p class="text-xs font-semibold text-foreground">上月</p>
              <label class="block">
                <span class="field-label">房费收入（元）</span>
                <input v-model.number="prevRevenueInput" type="number" min="0" step="100" placeholder="56000" class="input-base" />
              </label>
              <label class="block">
                <span class="field-label">已售房晚</span>
                <input v-model.number="prevSoldInput" type="number" min="0" step="1" placeholder="200" class="input-base" />
              </label>
              <label class="block">
                <span class="field-label">可售房晚</span>
                <input v-model.number="prevAvailableInput" type="number" min="1" step="1" placeholder="300" class="input-base" />
              </label>
            </div>
          </div>

          <div v-if="compareRows.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-3 font-medium">指标</th>
                  <th class="py-2 pr-3 font-medium text-right">本月</th>
                  <th class="py-2 pr-3 font-medium text-right">上月</th>
                  <th class="py-2 pr-3 font-medium text-right">差值</th>
                  <th class="py-2 font-medium text-right">变化</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in compareRows" :key="row.label" class="border-b border-border/50 last:border-b-0">
                  <td class="py-2 pr-3 whitespace-nowrap text-muted-foreground">{{ row.label }}</td>
                  <td class="py-2 pr-3 text-right text-foreground font-mono">{{ row.curText }}</td>
                  <td class="py-2 pr-3 text-right text-foreground font-mono">{{ row.prevText }}</td>
                  <td class="py-2 pr-3 text-right font-mono font-medium" :class="row.deltaClass">{{ row.deltaText }}</td>
                  <td class="py-2 text-right font-mono font-medium" :class="row.pctClass">{{ row.pctText }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-muted-foreground">在两列分别填入房费收入、已售房晚与可售房晚，即可对比 RevPAR / ADR / OCC 的变化。</p>
          <p class="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>绿色为上涨、红色为下降；OCC 的差值单位是百分点（pp）。上月为 0 或未填时不计算变化率（避免除零），只显示本月值。两期建议同一口径，否则对比无意义。</span>
          </p>
        </div>
      </div>
    </div>

    <!-- 民宿场景注释卡 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4 space-y-1.5">
        <h3 class="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Info class="w-4 h-4 text-primary flex-shrink-0" /> 短租平台的佣金口径
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          平台挂牌价不等于你到手的钱：佣金、保洁费扣完后才是实收。本页建议按<span class="text-foreground font-medium">到手价</span>填房费收入（ADR 更真实）；
          按<span class="text-foreground font-medium">挂牌价</span>算也可以——它反映市场定价——但两种口径只能选一个且全程一致，混用会虚高 RevPAR、误导定价。
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 space-y-1.5">
        <h3 class="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <TriangleAlert class="w-4 h-4 text-amber-500 flex-shrink-0" /> OCC 100% 不是目标
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          满房常常意味着定价偏低——牺牲了本可以赚到的房价。收益管理的一句话：RevPAR 才是平衡「价格 × 出租率」的指标，
          提价到流失少量客源后 RevPAR 反而上升是常见结果；盯着入住率做满房，容易把利润让出去。
        </p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 space-y-1.5">
        <h3 class="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Building2 class="w-4 h-4 text-primary flex-shrink-0" /> RevPAR 只看房费
        </h3>
        <p class="text-xs text-muted-foreground leading-relaxed">
          RevPAR 的收入口径只有房费，不含早餐、接送、体验活动等其他收入；要看全口径收益属于 TRevPAR 指标（本页不展开）。
          民宿若副业收入占比高，请另行核算，别把非房费收入混进房费收入里。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>RevPAR 收益计算是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          RevPAR 收益计算是一款面向酒店、民宿与短租房东的收益管理指标工具。输入房间数、统计天数、已售房晚与房费收入四个原始量，
          它按行业口径一次算出三个指标：ADR（已售房晚平均房价 = 房费收入 ÷ 已售房晚）、OCC（入住率 = 已售房晚 ÷ 可售房晚）与
          RevPAR（每可售房晚收入），并用「ADR × OCC」与「房费收入 ÷ 可售房晚」两种算法互相校验闭环一致；
          再提供目标 RevPAR 反推定价（ADR 引导）、本月 vs 上月双列周期对比（差值与百分比变化），
          以及短租平台佣金口径、入住率满房误区等经营提示。全部计算在你的浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">RevPAR 是什么？怎么计算？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          RevPAR（Revenue Per Available Room，每可售房晚收入）是酒店行业衡量整体收益能力的核心指标，它把「卖出去的房价」和「没卖出去的空置」一起算账。
          两种等价算法：RevPAR = ADR × OCC（平均房价 × 入住率），或 RevPAR = 房费收入 ÷ 可售房晚（可售房晚 = 房间数 × 天数）。
          举例：ADR 300 元、入住率 70%，RevPAR = 300 × 0.7 = 210 元；若 10 间房 30 天（可售 300 间夜）卖了 210 间夜、房费收入 63000 元，
          则 63000 ÷ 300 = 210 元，两种算法结果一致。ADR 300 元看着不低，但 30% 的空置把每间可售房的实际贡献拉低到 210 元。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">RevPAR 和 ADR 有什么区别？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          ADR（Average Daily Rate）只统计已售房晚的平均房价，回答「卖出去的房卖了多少钱」，它完全看不见空置——降价甩卖反而能把 ADR 做高；
          RevPAR 的分母是全部可售房晚，等于 ADR × OCC，回答「每一间可用的房平均贡献多少钱」。一个店 ADR 很高但入住率很低，RevPAR 未必好；
          反过来满房但房价极低，RevPAR 同样上不去。经营上先看 RevPAR 判断整体收益，再用 ADR 与 OCC 的拆分判断问题出在价格还是出租率。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">民宿短租：平台佣金要不要计入？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          短租平台（如途家、爱彼迎、美团民宿）的挂牌价会被抽走佣金与扣点，还有保洁费等额外支出。常见两种口径：
          一是「挂牌价口径」——按房客支付的标价算收入，适合分析市场价格与挂牌策略；
          二是「到手价口径」——按扣除佣金、扣点后实际收到的钱算收入，适合核算真实收益与保本定价。
          本页推荐日常经营用到手价口径（更接近现金流），但关键是：ADR、OCC、RevPAR 三个指标、以及跨周期对比，必须始终用同一口径；
          本月按挂牌价、上月按到手价，算出的涨幅没有任何意义。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">入住率 100% 一定是好事吗？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          不一定。满房往往说明定价偏低——你本可以用更高的价格服务同样多的客人。收益管理（Revenue Management）的基本思路是：
          RevPAR = 价格 × 出租率，目标是两者的乘积最大化，而不是把出租率推到 100%。常见现象是提价 10%、流失 5% 的订单，
          RevPAR 反而从 210 涨到 217；此外满房还会推高清洁、耗品与人力边际成本。判断标准永远是「涨价后 RevPAR 与净利是否上升」，
          而不是「房是不是住满了」。节假日可冲高出租率，平日则应优先保房价。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">如何提高 RevPAR？</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          三条路：一是调价——用本页的定价反推，先定目标 RevPAR，再按预期入住率倒推 ADR 底线，旺季敢于上浮、淡季用折扣填仓；
          二是提高出租率——错峰定价、连住优惠、改善上线图片与评分、多平台分发；
          三是调整产品结构——把大房型拆分、把闲置时段做长短租组合，提升单位可售房晚的产出。
          做任何一项调整后，用周期对比卡验证 RevPAR 是否真的上升，避免只涨了 ADR 丢掉了 OCC（或反之）。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">RevPAR 怎么计算？</h3>
            <p class="text-sm text-muted-foreground mt-1">RevPAR = ADR × OCC，也可以用 房费收入 ÷ 可售房晚（可售房晚 = 房间数 × 天数）。例：ADR 300 元、入住率 70% 时 RevPAR = 210 元；房费收入 63000 元、可售 300 间夜时同样等于 210 元，两种算法应一致。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">RevPAR 和 ADR 有什么区别？</h3>
            <p class="text-sm text-muted-foreground mt-1">ADR 只看卖出去的房（已售房晚平均房价），看不见空置；RevPAR 把空置房也算进分母（= ADR × OCC）。ADR 高不代表赚得多，RevPAR 才反映每间可售房的真实贡献。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">民宿平台佣金要不要计入房费收入？</h3>
            <p class="text-sm text-muted-foreground mt-1">两种口径都可以：按挂牌价算适合分析市场定价，按扣佣后的到手价算更接近真实收益（本页推荐）。关键是三个指标和跨期对比必须全程同一口径，混用会虚高 RevPAR。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">入住率 100% 一定是好事吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不一定。满房常意味着定价偏低。收益管理的目标是 RevPAR（价格 × 出租率）最大化而非满房：提价 10% 流失 5% 订单，RevPAR 反而可能上升，且空置省下的清洁耗品成本也是净收益。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">RevPAR 多少算健康？</h3>
            <p class="text-sm text-muted-foreground mt-1">没有绝对标准，取决于城市、地段与房型。实用做法是三个基准：对比同城同档次竞对、对比自己的历史同期、并确认 RevPAR 能覆盖单间可售房晚的固定成本（房租+人工÷可售房晚）。环比上涨、且能盖住成本即为健康方向。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'revpar-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Building2, Calculator, TrendingUp, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, ArrowRightLeft, CalendarDays
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: 'RevPAR收益计算 - ADR入住率酒店民宿收益指标在线工具',
  description: '免费在线 RevPAR 计算器：输入房间数、天数、已售房晚与房费收入，算出 ADR 平均房价、OCC 入住率与 RevPAR，两种算法闭环校验，支持目标 RevPAR 反推定价与本月上月周期对比，附民宿短租平台佣金口径与满房误区提示，纯本地计算不上传',
  keywords: 'revpar计算,adr入住率,民宿经营指标,酒店收益管理,revpar是什么',
  author: '有条工具',
  ogTitle: 'RevPAR收益计算 - ADR入住率酒店民宿收益指标在线工具 | 有条工具',
  ogDescription: 'ADR、OCC、RevPAR 三指标一次算清，目标 RevPAR 反推定价，周期对比涨跌一目了然。',
  ogUrl: 'https://www.util.cn/tools/revpar-calculator',
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
          name: 'RevPAR收益计算',
          url: 'https://www.util.cn/tools/revpar-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['ADR 已售房晚平均房价计算', 'OCC 入住率计算', 'RevPAR 双算法闭环校验', '目标 RevPAR 反推定价 ADR', '本月上月周期对比与变化率', '民宿短租平台佣金口径提示', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: 'RevPAR收益计算', item: 'https://www.util.cn/tools/revpar-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'RevPAR 怎么计算？',
              acceptedAnswer: { '@type': 'Answer', text: 'RevPAR = ADR × OCC，也可以用 房费收入 ÷ 可售房晚（可售房晚 = 房间数 × 天数）。例：ADR 300 元、入住率 70% 时 RevPAR = 210 元；房费收入 63000 元、可售 300 间夜时同样等于 210 元，两种算法应一致。' }
            },
            {
              '@type': 'Question',
              name: 'RevPAR 和 ADR 有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'ADR 只看卖出去的房（已售房晚平均房价），看不见空置；RevPAR 把空置房也算进分母（= ADR × OCC）。ADR 高不代表赚得多，RevPAR 才反映每间可售房的真实贡献。' }
            },
            {
              '@type': 'Question',
              name: '民宿平台佣金要不要计入房费收入？',
              acceptedAnswer: { '@type': 'Answer', text: '两种口径都可以：按挂牌价算适合分析市场定价，按扣佣后的到手价算更接近真实收益（推荐）。关键是三个指标和跨期对比必须全程同一口径，混用会虚高 RevPAR。' }
            },
            {
              '@type': 'Question',
              name: '入住率 100% 一定是好事吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不一定。满房常意味着定价偏低。收益管理的目标是 RevPAR（价格 × 出租率）最大化而非满房：提价 10% 流失 5% 订单，RevPAR 反而可能上升。' }
            },
            {
              '@type': 'Question',
              name: 'RevPAR 多少算健康？',
              acceptedAnswer: { '@type': 'Answer', text: '没有绝对标准，取决于城市、地段与房型。实用做法：对比同城同档次竞对、对比自己的历史同期、并确认 RevPAR 能覆盖单间可售房晚的固定成本。' }
            }
          ]
        }
      ]
    })
  }]
})

/* ==== 纯函数（node 自测提取区）begin ==== */
// null / undefined / 空串视为未填（非法）返回 null；其余转 Number，非有限值也返回 null
function validNumOf(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// 可售房晚 = 房间数 × 天数；任一非法或 ≤ 0 返回 null（四舍五入取整）
function availableRoomNightsOf(rooms, days) {
  const r = validNumOf(rooms)
  const d = validNumOf(days)
  if (r === null || d === null || r <= 0 || d <= 0) return null
  return Math.round(r * d)
}

// ADR = 房费收入 ÷ 已售房晚（元/间夜）；已售房晚 ≤ 0（含除零）或收入为负返回 null
function adrOf(revenue, soldNights) {
  const rev = validNumOf(revenue)
  const s = validNumOf(soldNights)
  if (rev === null || s === null || s <= 0 || rev < 0) return null
  return rev / s
}

// OCC（%）= 已售房晚 ÷ 可售房晚 × 100；可售 ≤ 0（除零）或已售为负返回 null；超售不钳制，由 UI 提示
function occOf(soldNights, availableNights) {
  const s = validNumOf(soldNights)
  const a = validNumOf(availableNights)
  if (s === null || a === null || a <= 0 || s < 0) return null
  return (s / a) * 100
}

// RevPAR 算法一：ADR × OCC（OCC 按百分数）；任一指标无效返回 null
function revparByRateOf(adr, occPct) {
  const a = validNumOf(adr)
  const o = validNumOf(occPct)
  if (a === null || o === null) return null
  return a * (o / 100)
}

// RevPAR 算法二：房费收入 ÷ 可售房晚；可售 ≤ 0（除零）返回 null
function revparByRevenueOf(revenue, availableNights) {
  const rev = validNumOf(revenue)
  const a = validNumOf(availableNights)
  if (rev === null || a === null || a <= 0 || rev < 0) return null
  return rev / a
}

// 闭环校验：两种算法差值 < 0.01 元视为一致（浮点容差）
function revparClosedLoopOk(byRate, byRevenue) {
  if (byRate === null || byRevenue === null || !Number.isFinite(byRate) || !Number.isFinite(byRevenue)) return false
  return Math.abs(byRate - byRevenue) < 0.01
}

// 定价反推：目标 RevPAR ÷ 目标 OCC = 需要 ADR；OCC ≤ 0（除零）或 > 100（物理不可能）返回 null
function adrForTargetRevparOf(targetRevpar, occPct) {
  const t = validNumOf(targetRevpar)
  const o = validNumOf(occPct)
  if (t === null || o === null || o <= 0 || o > 100 || t < 0) return null
  return t / (o / 100)
}

// 周期对比变化：{ delta, pct }；基数 ≤ 0 或非法返回 null（0 基数不除零）
function deltaOf(cur, prev) {
  const c = validNumOf(cur)
  const p = validNumOf(prev)
  if (c === null || p === null || p <= 0) return null
  return { delta: c - p, pct: ((c - p) / p) * 100 }
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 输入状态 ----------
const DEFAULTS = { rooms: 10, days: 30, sold: 210, revenue: 63000 }
const EXAMPLE = { rooms: 6, days: 30, sold: 96, revenue: 33600 }
const COMPARE_DEFAULTS = { curRevenue: 63000, curSold: 210, curAvailable: 300, prevRevenue: 56000, prevSold: 200, prevAvailable: 300 }

const roomsInput = ref(DEFAULTS.rooms)
const daysInput = ref(DEFAULTS.days)
const soldInput = ref(DEFAULTS.sold)
const revenueInput = ref(DEFAULTS.revenue)

const targetRevparInput = ref(210)
const targetOccInput = ref(70)

const curRevenueInput = ref(COMPARE_DEFAULTS.curRevenue)
const curSoldInput = ref(COMPARE_DEFAULTS.curSold)
const curAvailableInput = ref(COMPARE_DEFAULTS.curAvailable)
const prevRevenueInput = ref(COMPARE_DEFAULTS.prevRevenue)
const prevSoldInput = ref(COMPARE_DEFAULTS.prevSold)
const prevAvailableInput = ref(COMPARE_DEFAULTS.prevAvailable)

const seoContentVisible = ref(true)

// 空输入/非法输入统一按 0 处理；负数钳 0
function numOf(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
function numNonNeg(v) {
  return Math.max(0, numOf(v))
}

const rooms = computed(() => numNonNeg(roomsInput.value))
const days = computed(() => numNonNeg(daysInput.value))
const sold = computed(() => numNonNeg(soldInput.value))
const revenue = computed(() => numNonNeg(revenueInput.value))

const availableNights = computed(() => availableRoomNightsOf(rooms.value, days.value))

const inputWarning = computed(() => {
  if (availableNights.value === null) return '请填写大于 0 的房间数与统计天数（可售房晚 = 房间数 × 天数）。'
  if (revenue.value > 0 && sold.value === 0) return '已填房费收入但已售房晚为 0：ADR 无法计算，请检查已售房晚。'
  if (sold.value > availableNights.value) return `已售房晚（${fmtNum(sold.value)}）大于可售房晚（${fmtNum(availableNights.value)}）：入住率会超过 100%，通常是超售或统计口径有误，请核对房间数与天数。`
  return ''
})
const canCompute = computed(() => inputWarning.value === '')

// ---------- 三指标 ----------
const adr = computed(() => adrOf(revenue.value, sold.value))
const occ = computed(() => occOf(sold.value, availableNights.value))
const revparByRate = computed(() => revparByRateOf(adr.value, occ.value))
const revparByRevenue = computed(() => revparByRevenueOf(revenue.value, availableNights.value))
const closedLoopOk = computed(() => revparClosedLoopOk(revparByRate.value, revparByRevenue.value))

// ---------- 定价反推 ----------
const targetRevpar = computed(() => numNonNeg(targetRevparInput.value))
const targetOcc = computed(() => numOf(targetOccInput.value))
const targetAdr = computed(() => adrForTargetRevparOf(targetRevpar.value, targetOcc.value))
const targetOccText = computed(() => (targetOcc.value > 0 && targetOcc.value <= 100 ? `${fmtNum(targetOcc.value)}%` : '—'))
const adrCompare = computed(() => {
  if (targetAdr.value === null || adr.value === null) return null
  const diff = targetAdr.value - adr.value
  if (Math.abs(diff) < 0.01) return { level: 'equal', text: `与当前 ADR ${fmtNum(adr.value)} 元持平：维持现价即可达成目标。` }
  if (diff > 0) return { level: 'up', text: `当前 ADR ${fmtNum(adr.value)} 元，还差 ${fmtNum(diff)} 元：需要提价或优化房型结构拉高均价。` }
  return { level: 'down', text: `当前 ADR ${fmtNum(adr.value)} 元已高于所需：现价即可达成，或预留更多折扣空间。` }
})
const adrCompareText = computed(() => (adrCompare.value ? adrCompare.value.text : ''))
const adrCompareClass = computed(() => {
  const level = adrCompare.value ? adrCompare.value.level : ''
  if (level === 'up') return 'text-amber-600'
  if (level === 'down') return 'text-green-600'
  if (level === 'equal') return 'text-green-600'
  return 'text-muted-foreground'
})

// ---------- 周期对比 ----------
const curMetrics = computed(() => {
  // 对比卡可售房晚直接输入（两期可能房型/天数不同），不再经房间数×天数推算
  const available = numOf(curAvailableInput.value)
  if (available <= 0) return { adr: null, occ: null, revpar: null }
  return {
    adr: adrOf(numNonNeg(curRevenueInput.value), numNonNeg(curSoldInput.value)),
    occ: occOf(numNonNeg(curSoldInput.value), available),
    revpar: revparByRevenueOf(numNonNeg(curRevenueInput.value), available)
  }
})
const prevMetrics = computed(() => {
  const available = numOf(prevAvailableInput.value)
  if (available <= 0) return { adr: null, occ: null, revpar: null }
  return {
    adr: adrOf(numNonNeg(prevRevenueInput.value), numNonNeg(prevSoldInput.value)),
    occ: occOf(numNonNeg(prevSoldInput.value), available),
    revpar: revparByRevenueOf(numNonNeg(prevRevenueInput.value), available)
  }
})

// 单行对比数据：本月/上月文本 + 差值与变化率（正绿负红，null 显示 —）
function buildCompareRow(label, unit, cur, prev) {
  const fmt = (v) => (v === null || v === undefined || !Number.isFinite(v) ? '—' : `${fmtNum(v)}${unit}`)
  const d = deltaOf(cur, prev)
  return {
    label,
    curText: fmt(cur),
    prevText: fmt(prev),
    deltaText: d === null ? '—' : `${d.delta > 0 ? '+' : ''}${fmtNum(d.delta)}${unit}`,
    pctText: d === null ? '—' : `${d.pct > 0 ? '+' : ''}${fmtNum(d.pct)}%`,
    deltaClass: d === null ? 'text-muted-foreground' : (d.delta > 0 ? 'text-green-600' : (d.delta < 0 ? 'text-red-600' : 'text-muted-foreground')),
    pctClass: d === null ? 'text-muted-foreground' : (d.pct > 0 ? 'text-green-600' : (d.pct < 0 ? 'text-red-600' : 'text-muted-foreground'))
  }
}

// 三指标中至少一项可对比才渲染表格
const compareRows = computed(() => {
  const c = curMetrics.value
  const p = prevMetrics.value
  const rows = [
    buildCompareRow('ADR（元）', ' 元', c.adr, p.adr),
    buildCompareRow('OCC（入住率）', 'pp', c.occ, p.occ),
    buildCompareRow('RevPAR（元）', ' 元', c.revpar, p.revpar)
  ]
  const hasAny = rows.some((r) => r.curText !== '—' || r.prevText !== '—')
  return hasAny ? rows : []
})

// ---------- 展示工具 ----------
function fmtNum(v) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—'
  const r = Math.round(v * 100) / 100
  return Number.isInteger(r)
    ? r.toLocaleString('zh-CN')
    : r.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

// ---------- 操作 ----------
function loadExample() {
  roomsInput.value = EXAMPLE.rooms
  daysInput.value = EXAMPLE.days
  soldInput.value = EXAMPLE.sold
  revenueInput.value = EXAMPLE.revenue
}
function resetInputs() {
  roomsInput.value = DEFAULTS.rooms
  daysInput.value = DEFAULTS.days
  soldInput.value = DEFAULTS.sold
  revenueInput.value = DEFAULTS.revenue
  curRevenueInput.value = COMPARE_DEFAULTS.curRevenue
  curSoldInput.value = COMPARE_DEFAULTS.curSold
  curAvailableInput.value = COMPARE_DEFAULTS.curAvailable
  prevRevenueInput.value = COMPARE_DEFAULTS.prevRevenue
  prevSoldInput.value = COMPARE_DEFAULTS.prevSold
  prevAvailableInput.value = COMPARE_DEFAULTS.prevAvailable
}
const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('revpar-calculator')
})
</script>

<style scoped>
.input-base {
  @apply w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30;
}
.field-label {
  @apply block text-[10px] text-muted-foreground mb-1;
}
</style>
