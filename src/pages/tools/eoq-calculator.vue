<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <TrendingUp class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">经济订货量 EOQ 计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">输入年需求量、单次订货成本与持有成本，算出最优订货批量、年订货次数与补货间隔，对比「你现在每次订的量」直接给出多花的钱，附成本曲线与批量敏感度表</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线经济订货量（Economic Order Quantity）计算器：采购备货、电商囤货、小店进货前，先回答「一次订多少最划算」。
        按经典 EOQ 公式 √(2DS/H) 求出订货成本与持有成本之和最低的批量点，换算成「每年订 19 次、约每 19 天补一次货」这种可直接执行的节奏；
        再把你现在拍板的批量画到同一张成本曲线上，量化「这样订一年多花多少钱、每次多花多少钱」。
        全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <!-- 假设口径说明条 -->
    <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 border border-border text-muted-foreground flex items-start gap-2 mb-6">
      <Info class="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
      <span>EOQ 假设需求均匀与订货成本恒定——对促销波动、保质期短、整箱起订的品类会失真，结果适合作为采购节奏讨论的起点而非拍板。</span>
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左列：输入面板 -->
      <div class="space-y-6">
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 参数输入
          </h2>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5" for="eoq-d">年需求量 D（件/年）</label>
            <input
              id="eoq-d"
              v-model="dInput"
              type="text"
              inputmode="decimal"
              placeholder="如 18250（日销 50 件 × 365）"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-[11px] text-muted-foreground mt-1">没有年数就按月销 × 12 或日销 × 365 折算；促销冲量月份建议剔除。</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5" for="eoq-s">单次订货成本 S（元/次）</label>
            <input
              id="eoq-s"
              v-model="sInput"
              type="text"
              inputmode="decimal"
              placeholder="如 200（下单+物流+清关+质检）"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-[11px] text-muted-foreground mt-1">每下单一律发生、与订多少无关的固定开销：采购人工、运费门槛、报关查验、到货质检。</p>
          </div>

          <div>
            <p class="text-sm font-medium text-foreground mb-2">单位持有成本 H（元/件/年）</p>
            <div class="flex flex-wrap gap-2 mb-3">
              <button
                v-for="m in HOLD_MODES"
                :key="m.id"
                @click="holdMode = m.id"
                class="px-3 py-1.5 rounded-full border text-xs font-medium transition"
                :class="holdMode === m.id ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted'"
                :aria-pressed="holdMode === m.id"
              >
                {{ m.label }}
              </button>
            </div>

            <div v-show="holdMode === 'direct'">
              <label class="block text-sm font-medium text-foreground mb-1.5" for="eoq-h">每件每年压着花多少（元/件/年）</label>
              <input
                id="eoq-h"
                v-model="hInput"
                type="text"
                inputmode="decimal"
                placeholder="如 8（仓储+资金+损耗摊销到每件）"
                class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div v-show="holdMode === 'rate'" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5" for="eoq-price">单价（元/件）</label>
                  <input
                    id="eoq-price"
                    v-model="priceInput"
                    type="text"
                    inputmode="decimal"
                    placeholder="如 10"
                    class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-foreground mb-1.5" for="eoq-rate">持有率（%）</label>
                  <input
                    id="eoq-rate"
                    v-model="rateInput"
                    type="text"
                    inputmode="decimal"
                    placeholder="如 25"
                    class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                H = 单价 × 持有率。持有率含资金占用利息、仓租、损耗与滞销跌价，常见 15%–30%，生鲜/时尚品可到 50% 以上。
                <span v-if="hFromRateText" class="block mt-1 font-mono text-foreground">{{ hFromRateText }}</span>
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-1.5" for="eoq-q">你现在每次订多少（件，选填）</label>
            <input
              id="eoq-q"
              v-model="qInput"
              type="text"
              inputmode="decimal"
              placeholder="如 2000——用于算「拍量多花的钱」"
              class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p class="text-[11px] text-muted-foreground mt-1">填上实际下单习惯，结果区会给出比最优节奏一年多花、每次多花多少——这是说服老板改节奏的关键数字。</p>
          </div>

          <p
            class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5"
            :class="checkResult.ok ? '' : 'bg-red-500/10'"
          >
            <TriangleAlert v-if="!checkResult.ok" class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <CheckCircle v-else class="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{{ checkResult.msg }}</span>
          </p>
        </div>

        <div class="bg-card border border-border rounded-lg p-6 space-y-3">
          <h2 class="text-sm font-semibold text-foreground">快速预设</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in PRESETS"
              :key="preset.id"
              @click="applyPreset(preset)"
              class="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground transition"
            >
              <Play class="w-3 h-3 inline mr-1 -mt-0.5 text-primary" />{{ preset.label }}
            </button>
            <button
              @click="resetAll"
              class="px-2.5 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-muted-foreground transition"
            >
              <RefreshCw class="w-3 h-3 inline mr-1 -mt-0.5" />重置
            </button>
          </div>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            预设①淘宝店：日销 50 件（年 18250）、每单开销 200 元、每件年持有 8 元；预设②五金店：月销 300 件（年 3600）、每单 80 元、单价 10 元 × 持有率 25%。
          </p>
        </div>
      </div>

      <!-- 右列：结果区（占两列） -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 结论卡 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-5">
          <h2 class="text-lg font-semibold flex items-center">
            <Package class="w-5 h-5 mr-2 text-primary" /> 最优订货节奏
          </h2>

          <div v-if="!ready" class="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 leading-relaxed">
            <TriangleAlert class="w-4 h-4 inline text-amber-500 mr-1 -mt-0.5" />
            {{ checkResult.msg }}补齐后此处立即显示结论。
          </div>

          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
              <div class="sm:col-span-2 bg-primary/10 rounded-lg p-5 text-center">
                <p class="text-xs text-muted-foreground mb-1">最优批量 EOQ（每次订这么多）</p>
                <p class="text-5xl font-bold text-primary leading-tight">{{ eoqText }}</p>
                <p class="text-xs text-muted-foreground mt-1.5">件 / 次 · 向上取整</p>
              </div>
              <div class="sm:col-span-3 grid grid-cols-3 gap-3 text-center">
                <div class="bg-muted/50 rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">年订货次数</p>
                  <p class="text-xl font-bold text-foreground">{{ ordersText }}</p>
                  <p class="text-[10px] text-muted-foreground mt-0.5">次 / 年</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">补货间隔</p>
                  <p class="text-xl font-bold text-foreground">{{ intervalText }}</p>
                  <p class="text-[10px] text-muted-foreground mt-0.5">天 / 次</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-3">
                  <p class="text-[10px] text-muted-foreground mb-1">年总成本</p>
                  <p class="text-xl font-bold text-foreground">{{ bestCostText }}</p>
                  <p class="text-[10px] text-muted-foreground mt-0.5">元（订货+持有）</p>
                </div>
              </div>
            </div>

            <p class="text-sm text-foreground font-medium text-center">口语化：{{ speechText }}，每次 {{ eoqText }} 件，全年订货加持有合计约 {{ bestCostText }} 元。</p>

            <p class="text-[11px] text-muted-foreground text-center font-mono">
              EOQ = √(2 × {{ fmtIntOf(dNum) }} × {{ fmtIntOf(sNum) }} ÷ {{ round1Text(hEff) }}) = {{ round1Text(eoqRawVal) }} → {{ eoqText }} 件
            </p>

            <div v-if="overpay && overpay.year > 0" class="rounded-lg p-4 bg-amber-500/10 border border-amber-500/30 text-sm text-foreground leading-relaxed">
              <TriangleAlert class="w-4 h-4 inline text-amber-600 mr-1.5 -mt-0.5" />
              照你现在每次 <span class="font-bold font-mono">{{ fmtIntOf(qNum) }}</span> 件拍，按最优批量来一年多花
              <span class="font-bold text-amber-600"> {{ fmtIntOf(overpay.year) }} 元</span>（摊到每次约多 <span class="font-bold font-mono">{{ overpay.perOrder.toFixed(1) }}</span> 元）——这就是改节奏能省的现金。
            </div>
            <div v-else-if="overpay" class="rounded-lg p-4 bg-green-500/10 border border-green-500/30 text-sm text-foreground leading-relaxed">
              <CheckCircle class="w-4 h-4 inline text-green-600 mr-1.5 -mt-0.5" />
              你现在的批量已经贴着最优区间，年成本与 EOQ 方案基本持平，不必折腾。
            </div>
            <div v-else class="rounded-lg p-4 bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed">
              在左侧填「你现在每次订多少」，这里会算出按现状拍板比最优节奏一年多花多少钱。
            </div>

            <p class="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
              批量是「订多少」的问题，别忘了「什么时候下单」——交期越不确定越容易断货。搭配
              <NuxtLink to="/tools/reorder-point-calculator" class="text-primary font-medium hover:underline">再订货点（ROP）计算器</NuxtLink>
              确定触发补货的库存水位。
            </p>
          </template>
        </div>

        <!-- 成本曲线 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Calculator class="w-5 h-5 mr-2 text-primary" /> 年总成本曲线（订货费 + 持有费）
          </h2>
          <div v-if="curveSvg" class="text-foreground" v-html="curveSvg"></div>
          <p v-else class="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
            参数有效后，这里画出批量 Q 在 0.5×EOQ ~ 3×EOQ 区间的 U 形成本曲线，并标出你的当前拍量位置。
          </p>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            读图：左端批量小——一年要下很多单，订货成本抬头；右端批量大——平均库存 Q/2 越压越多，持有成本抬头。两线交汇处的谷底就是 EOQ，年总成本最低。
          </p>
        </div>

        <!-- 敏感度表 -->
        <div class="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 批量敏感度：偏离最优多少，多花多少
          </h2>
          <div v-if="sensRows.length" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-muted-foreground border-b border-border">
                  <th class="py-2 pr-4 font-medium">相对 EOQ 的批量</th>
                  <th class="py-2 pr-4 font-medium">批量（件/次）</th>
                  <th class="py-2 pr-4 font-medium">年总成本（元）</th>
                  <th class="py-2 font-medium">比最优多花</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in sensRows"
                  :key="row.k"
                  class="border-b border-border/60 last:border-0"
                  :class="row.k === 1 ? 'bg-primary/5' : ''"
                >
                  <td class="py-2 pr-4 font-medium text-foreground">{{ row.label }}</td>
                  <td class="py-2 pr-4 font-mono">{{ row.qText }}</td>
                  <td class="py-2 pr-4 font-mono">{{ row.costText }}</td>
                  <td class="py-2 font-mono" :class="row.pct > 0 ? 'text-amber-600' : 'text-green-600'">
                    {{ row.pct > 0 ? '+' + row.pct.toFixed(1) + '%' : '0.0%（谷底）' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">参数有效后显示 ±20% / ±40% 的批量成本对照。</p>
          <p class="text-[11px] text-muted-foreground leading-relaxed">
            批量按 √(2DS/H) 的未取整值 × 倍数计算。EOQ 曲线谷底附近很平：±20% 通常只贵 2% 上下——为了凑整箱、凑起订量偏离一点，多半不值得纠结；偏离 40% 以上才真正心疼。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>经济订货量 EOQ 是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          EOQ（Economic Order Quantity，经济订货量）是库存管理里最经典的一个公式：
          <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">EOQ = √(2 × D × S ÷ H)</code>。
          它回答的问题是「每次下单订多少件，一年的订货成本加持有成本总和最低」。批量订小了，一年要下几十次单，下单、物流、清关、质检这些固定开销反复发生；
          批量订大了，仓库里平均堆着 Q/2 的库存，资金利息、仓租、损耗、跌价全在烧钱。EOQ 就是这两笔此消彼长的钱交汇出来的谷底。
          本工具按公式算出最优批量后，进一步换算成「每年订 19.1 次、约每 19 天补一次货」的可执行节奏，并画出成本曲线、给出批量敏感度表，
          还支持把你现在实际拍板的批量代入对比，直接量化「按现状订货一年白花多少钱」。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">EOQ 公式怎么读：√(2DS/H) 里三项各是什么钱</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          D 是年需求量（件/年），决定「这件事一年要发生多少总量」；S 是单次订货成本（元/次），是每次下单一律要付的固定开销——采购员的时间、运费、报关、到货质检，与订多少无关；
          H 是单位持有成本（元/件/年），是一件货在仓库里压一年要烧掉的价钱。年总成本 = 订货次数 × S + 平均库存 × H = (D/Q)·S + (Q/2)·H，
          对 Q 求导令其为零就得到 Q* = √(2DS/H)。记法：固定下单开销 S 越大、需求 D 越猛，就该一次多订摊薄开销；持有 H 越贵（货越重、越占仓、越跌价），就该少订快周转。
          谷底处的年总成本恰好等于 √(2DSH)，也是「订货费 ≈ 持有费」的那一点——两个分项各占一半，可以拿来交叉验证。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">持有成本 H 里到底包含什么</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          很多老板把 H 只算成「仓租」，结果严重低估囤货代价。完整的持有成本有四块：
          <span class="text-foreground font-medium">资金占用</span>（货款压仓的利息或机会成本，年化 6%–10%）；
          <span class="text-foreground font-medium">仓储费用</span>（租金、水电、管理人工，按占面积折算）；
          <span class="text-foreground font-medium">损耗</span>（破损、过期、被盗）；
          <span class="text-foreground font-medium">滞销跌价</span>（换季打折、清仓损失）。
          实务上很少逐项核算，通常用「单价 × 持有率」折算：一般耐用品持有率 15%–30%，重货占仓的（瓷砖、饮料）可到 30%–40%，生鲜、时尚品类 50% 以上也正常。
          本工具两种输入方式二选一联动，填单价与持有率会自动折算出 H 并回显。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">「一次订更多单价更低」时，EOQ 为什么要修正</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：数量折扣改变了 EOQ 的适用前提——它假设单价恒定，而批量越大拿到的进货价越低时，货款本身也要进入年成本比较。
          做法是对每个折扣档分别算 EOQ 并核对该档总成本（货款 + 订货费 + 持有费），取最低者，而不是无脑冲更大的起订档。
          例如 500 件以上单价便宜 2%，但 2% 货款节省若小于多压两个月库存的持有成本，就不该冲量。本工具当前按恒定单价口径计算，数量折扣请人工补比较。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么品类不适用 EOQ</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>促销/直播脉冲型需求：一年只卖几个高峰，「均匀消耗」假设直接失效，应按活动计划单独排量。</li>
          <li>保质期短的生鲜、临期品：囤多了不是贵一点，是全损，EOQ 无意义。</li>
          <li>整箱、整托、起订量强约束：算出 956 但供应商只按 1000/箱起订，就退化为「在允许档位里挑成本最低的」。</li>
          <li>单件极高价值或按单定制：持有率与断货代价主导，改用按需订购。</li>
          <li>需求剧烈波动的长尾 SKU：建议改用再订货点 + 安全库存的思路，先保不断货再谈省钱。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">EOQ 和再订货点（ROP）的区别</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          一句话：EOQ 管「每次订多少」，ROP 管「什么时候下这一单」。库存降到 ROP = 日均需求 × 交期 + 安全库存 的那一刻就该补货，
          补多少则按本页的 EOQ 批量。两者配合才构成「定量补货」策略的完整答案，可用
          <NuxtLink to="/tools/reorder-point-calculator" class="text-primary font-medium hover:underline">再订货点计算器</NuxtLink>
          继续算触发水位。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">经济订货量 EOQ 怎么算？</h3>
            <p class="text-sm text-muted-foreground mt-1">EOQ = √(2 × 年需求量 D × 单次订货成本 S ÷ 单位持有成本 H)。例如 D = 18250 件/年、S = 200 元/次、H = 8 元/件/年，则 2DS/H = 912500，开方约 955.2，向上取整得每次订 956 件，一年订约 19.1 次、每约 19 天补一次货。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">没有年需求量，只有日销/月销怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">日销 × 365、月销 × 12 折算成年需求量即可；建议剔除促销冲量月份取日常均值。持有成本没有每件金额时，用「单价 × 持有率」折算，一般品类持有率取 15%–30%。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">供应商说订得多单价更低，为什么不照更大的量囤？</h3>
            <p class="text-sm text-muted-foreground mt-1">因为 EOQ 假设单价恒定，数量折扣让货款本身参与比较。正确做法是把各折扣档的「货款 + 年订货费 + 年持有费」总成本分别算出来取最低：折扣省下的货款若小于多压库存的持有成本（资金利息 + 仓租 + 损耗 + 跌价），大批量并不划算。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">批量算出来 956，但只能按 1000 一箱起订怎么办？</h3>
            <p class="text-sm text-muted-foreground mt-1">EOQ 谷底附近曲线很平，取整到起订量 1000 件年成本只比最优贵百分之零点几，直接按箱取整即可；本工具的敏感度表就是帮你量化这种取整代价的。偏离 20% 以内一般不值得为「凑精确值」谈条件。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">EOQ 和再订货点（ROP）是一回事吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不是。EOQ 决定每次补货的数量，ROP 决定库存降到什么水位就触发下单（= 交期内的预期消耗 + 安全库存）。一个管「订多少」，一个管「何时订」，配套使用才是定量补货策略，可再用再订货点计算器算另一半。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。需求、订货成本、持有成本与批量对比全部在你的浏览器中即时计算，不发送任何网络请求，刷新页面即恢复默认输入。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'eoq-calculator'" :category="'calculate'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  TrendingUp, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, Package
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '经济订货量 EOQ 计算器 - 最优订货批量与库存成本在线测算',
  description: '免费在线 EOQ 计算器：输入年需求量、单次订货成本与单位持有成本，按 √(2DS/H) 算出经济订货批量、年订货次数与补货间隔，对比你现在的拍量量化多花的钱，附 U 形成本曲线、±20%/±40% 批量敏感度与单价×持有率折算，采购备货、小店进货、电商囤货本地运行不上传',
  keywords: '经济订货量,EOQ 计算,订货批量,库存成本,补货点计算',
  author: '有条工具',
  ogTitle: '经济订货量 EOQ 计算器 - 最优订货批量与库存成本在线测算 | 有条工具',
  ogDescription: '按 EOQ 公式算出每次订多少最省钱、一年订几次、隔几天补一单，并与你现在的拍量对比直接给出多花的钱。',
  ogUrl: 'https://www.util.cn/tools/eoq-calculator',
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
          name: '经济订货量 EOQ 计算器',
          url: 'https://www.util.cn/tools/eoq-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['EOQ 最优订货批量', '年订货次数与补货间隔', '当前拍量多花钱对比', 'U 形年成本曲线 SVG', '±20%/±40% 批量敏感度表', '单价×持有率折算 H', '本地计算不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '计算工具', item: 'https://www.util.cn/calculate/' },
            { '@type': 'ListItem', position: 3, name: '经济订货量 EOQ 计算器', item: 'https://www.util.cn/tools/eoq-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '经济订货量 EOQ 怎么算？',
              acceptedAnswer: { '@type': 'Answer', text: 'EOQ = √(2 × 年需求量 D × 单次订货成本 S ÷ 单位持有成本 H)。例如 D=18250 件/年、S=200 元/次、H=8 元/件/年，2DS/H=912500，开方约 955.2，向上取整每次订 956 件，一年约订 19.1 次、每约 19 天补一次货。' }
            },
            {
              '@type': 'Question',
              name: '只有日销/月销，年需求量怎么折算？',
              acceptedAnswer: { '@type': 'Answer', text: '日销 × 365、月销 × 12 折成年需求量，建议剔除促销冲量月份取日常均值。持有成本没有每件金额时用「单价 × 持有率」折算，一般品类持有率取 15%–30%。' }
            },
            {
              '@type': 'Question',
              name: '订得多单价更低，要不要按更大批量囤？',
              acceptedAnswer: { '@type': 'Answer', text: '不无脑冲。EOQ 假设单价恒定，数量折扣下应把各档「货款 + 年订货费 + 年持有费」总成本分别算出来取最低：折扣省下的货款小于多压库存的资金、仓租、损耗与跌价成本时，大批量反而亏。' }
            },
            {
              '@type': 'Question',
              name: 'EOQ 和再订货点（ROP）的区别是什么？',
              acceptedAnswer: { '@type': 'Answer', text: 'EOQ 管每次订多少（订货费与持有成本之和最低的批量），ROP 管什么时候下这一单（库存降到交期消耗 + 安全库存的水位即触发补货）。两者配套构成定量补货策略。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 解析输入数字：空串/非法返回 null
function parseNum(text) {
  const s = String(text ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// 正实数判定（EOQ 各项参数都必须 > 0）
function isPos(n) {
  return Number.isFinite(n) && n > 0
}

// 保留 1 位小数
function round1(n) {
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null
}

// 千分位整数格式化，非法返回 —
function fmtInt(n) {
  if (!Number.isFinite(n)) return '—'
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 单价 × 持有率 → 单位年持有成本 H（率需在 0–100 之间），非法返回 null
function holdCostFromRate(unitPrice, ratePct) {
  const p = parseNum(unitPrice)
  const r = parseNum(ratePct)
  if (!isPos(p) || !Number.isFinite(r) || r <= 0 || r > 100) return null
  return (p * r) / 100
}

// EOQ 原始值 √(2DS/H)，参数非法返回 null
function eoqRawOf(D, S, H) {
  const d = parseNum(D)
  const s = parseNum(S)
  const h = parseNum(H)
  if (!isPos(d) || !isPos(s) || !isPos(h)) return null
  return Math.sqrt((2 * d * s) / h)
}

// 最优批量（向上取整到件），非法返回 null
function eoqOf(D, S, H) {
  const raw = eoqRawOf(D, S, H)
  return raw === null ? null : Math.ceil(raw)
}

// 年订货次数 = D ÷ Q，保留 1 位小数
function ordersPerYearOf(D, Q) {
  const d = parseNum(D)
  const q = parseNum(Q)
  if (!isPos(d) || !isPos(q)) return null
  return round1(d / q)
}

// 补货间隔天数 = 365 ÷ 年次数 = 365Q/D，保留 1 位小数
function intervalDaysOf(D, Q) {
  const d = parseNum(D)
  const q = parseNum(Q)
  if (!isPos(d) || !isPos(q)) return null
  return round1((365 * q) / d)
}

// 口语化间隔：约每 X 天补一次货
function intervalSpeechOf(D, Q) {
  const days = intervalDaysOf(D, Q)
  if (days === null) return ''
  return `约每 ${Math.round(days)} 天补一次货`
}

// 年总成本明细：订货次数费 (D/Q)·S + 平均库存持有费 (Q/2)·H（均为未取整原值），非法返回 null
function totalCostOf(D, S, H, Q) {
  const d = parseNum(D)
  const s = parseNum(S)
  const h = parseNum(H)
  const q = parseNum(Q)
  if (!isPos(d) || !isPos(s) || !isPos(h) || !isPos(q)) return null
  const times = d / q
  const orderCost = times * s
  const holdingCost = (q / 2) * h
  return { times, orderCost, holdingCost, total: orderCost + holdingCost }
}

// 谷底理论最低年成本 √(2DSH)，非法返回 null
function minTotalCostOf(D, S, H) {
  const d = parseNum(D)
  const s = parseNum(S)
  const h = parseNum(H)
  if (!isPos(d) || !isPos(s) || !isPos(h)) return null
  return Math.sqrt(2 * d * s * h)
}

// 当前拍量 vs EOQ 整批量：一年多花 year 元（取整），每次约多花 perOrder 元（1 位小数）
function overpayVsBest(D, S, H, currentQ) {
  const now = totalCostOf(D, S, H, currentQ)
  const best = totalCostOf(D, S, H, eoqOf(D, S, H))
  if (!now || !best) return null
  const diff = now.total - best.total
  if (diff <= 0) return { year: 0, perOrder: 0 }
  return { year: Math.round(diff), perOrder: round1(diff / now.times) }
}

// 批量敏感度行：按 EOQ 的倍率列表输出 批量 / 年总成本 / 相对谷底涨幅 %
function sensitivityRowsOf(D, S, H, mults) {
  const e = eoqRawOf(D, S, H)
  const minC = minTotalCostOf(D, S, H)
  if (e === null || minC === null || !Array.isArray(mults)) return []
  return mults.map((k) => {
    const row = totalCostOf(D, S, H, e * k)
    const pct = round1(((row.total / minC) - 1) * 100)
    return {
      k,
      label: k === 1 ? '1.0×EOQ（最优）' : `${k < 1 ? '' : '+'}${Math.round((k - 1) * 100)}%（${k.toFixed(1)}×EOQ）`,
      qText: fmtInt(e * k),
      costText: fmtInt(row.total),
      pct
    }
  })
}

// XML 文本转义（SVG 内所有动态文案先过这里）
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// SVG 坐标数值：非有限值兜底为 0，保留 2 位小数
function svgNum(n) {
  return Number.isFinite(n) ? String(Math.round(n * 100) / 100) : '0'
}

// 成本曲线 SVG 字符串：Q 轴取 0.5×EOQ ~ 3×EOQ，画 U 形总成本、谷底标注与当前拍量标记；参数非法返回 ''
function costCurveSvgOf(D, S, H, currentQ) {
  const e = eoqRawOf(D, S, H)
  const minC = minTotalCostOf(D, S, H)
  if (e === null || minC === null) return ''
  const W = 660
  const HT = 300
  const padL = 64
  const padR = 18
  const padT = 30
  const padB = 44
  const qLo = e * 0.5
  const qHi = e * 3
  const costAt = (q) => ((parseNum(D) * parseNum(S)) / q + (q * parseNum(H)) / 2)
  const yTopC = Math.max(costAt(qLo), costAt(qHi))
  const yLo = minC * 0.97
  const yHi = yTopC * 1.03
  const plotW = W - padL - padR
  const plotH = HT - padT - padB
  const xOf = (q) => padL + ((q - qLo) / (qHi - qLo)) * plotW
  const yOf = (c) => HT - padB - ((c - yLo) / (yHi - yLo)) * plotH
  const bottom = HT - padB

  const parts = []
  parts.push(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + HT + '" role="img"' +
    ' aria-label="' + esc('年总成本曲线：批量接近 ' + fmtInt(e) + ' 件时最低，约 ' + fmtInt(minC) + ' 元/年') + '"' +
    ' class="w-full h-auto select-none">'
  )
  // 坐标轴
  parts.push('<line x1="' + svgNum(padL) + '" y1="' + svgNum(bottom) + '" x2="' + svgNum(W - padR) + '" y2="' + svgNum(bottom) + '" stroke="currentColor" stroke-width="1" class="text-muted-foreground/60" />')
  parts.push('<line x1="' + svgNum(padL) + '" y1="' + svgNum(padT - 10) + '" x2="' + svgNum(padL) + '" y2="' + svgNum(bottom) + '" stroke="currentColor" stroke-width="1" class="text-muted-foreground/60" />')
  // 横向虚线网格
  for (const f of [0.25, 0.5, 0.75]) {
    const gy = svgNum(bottom - f * plotH)
    parts.push('<line x1="' + svgNum(padL) + '" y1="' + gy + '" x2="' + svgNum(W - padR) + '" y2="' + gy + '" stroke="currentColor" stroke-width="1" stroke-dasharray="4 5" opacity="0.4" class="text-muted-foreground" />')
  }
  // 谷底水平参考线与左侧标注
  parts.push('<line x1="' + svgNum(padL) + '" y1="' + svgNum(yOf(minC)) + '" x2="' + svgNum(W - padR) + '" y2="' + svgNum(yOf(minC)) + '" stroke="currentColor" stroke-width="1" stroke-dasharray="3 4" class="text-muted-foreground/70" />')
  parts.push('<text x="' + svgNum(padL - 6) + '" y="' + svgNum(yOf(minC) + 3) + '" text-anchor="end" font-size="10" class="fill-current text-muted-foreground">' + esc(fmtInt(minC) + ' 元') + '</text>')
  // U 形曲线（96 段采样）
  const N = 96
  const pts = []
  for (let i = 0; i <= N; i++) {
    const q = qLo + ((qHi - qLo) * i) / N
    pts.push(svgNum(xOf(q)) + ',' + svgNum(yOf(costAt(q))))
  }
  parts.push('<path d="M ' + pts.join(' L ') + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" class="text-primary" />')
  // 谷底标注：EOQ 竖直虚线 + 圆点 + 文案
  parts.push('<line x1="' + svgNum(xOf(e)) + '" y1="' + svgNum(yOf(minC)) + '" x2="' + svgNum(xOf(e)) + '" y2="' + svgNum(bottom) + '" stroke="currentColor" stroke-width="1" stroke-dasharray="5 4" class="text-primary/60" />')
  parts.push('<circle cx="' + svgNum(xOf(e)) + '" cy="' + svgNum(yOf(minC)) + '" r="4.5" fill="currentColor" class="text-primary" />')
  parts.push('<text x="' + svgNum(Math.min(Math.max(xOf(e), padL + 62), W - padR - 62)) + '" y="' + svgNum(yOf(minC) - 12) + '" text-anchor="middle" font-size="11" font-weight="600" class="fill-current text-primary">' + esc('最低 ' + fmtInt(minC) + ' 元 · EOQ≈' + fmtInt(eoqOf(D, S, H)) + ' 件') + '</text>')
  // x 轴刻度
  const ticks = [
    { q: qLo, t: '0.5×EOQ ≈' + fmtInt(qLo) },
    { q: e, t: 'EOQ' },
    { q: qHi, t: '3×EOQ ≈' + fmtInt(qHi) }
  ]
  for (const tk of ticks) {
    parts.push('<line x1="' + svgNum(xOf(tk.q)) + '" y1="' + svgNum(bottom) + '" x2="' + svgNum(xOf(tk.q)) + '" y2="' + svgNum(bottom + 4) + '" stroke="currentColor" stroke-width="1" class="text-muted-foreground/60" />')
    parts.push('<text x="' + svgNum(xOf(tk.q)) + '" y="' + svgNum(HT - 18) + '" text-anchor="middle" font-size="10" class="fill-current text-muted-foreground">' + esc(tk.t) + '</text>')
  }
  // 轴名
  parts.push('<text x="' + svgNum(W - padR) + '" y="' + svgNum(HT - 4) + '" text-anchor="end" font-size="10" class="fill-current text-muted-foreground">' + esc('订货批量 Q（件/次）') + '</text>')
  parts.push('<text x="' + svgNum(padL) + '" y="' + svgNum(padT - 16) + '" font-size="10" class="fill-current text-muted-foreground">' + esc('年总成本（元/年）') + '</text>')
  // 当前拍量标记
  const cq = parseNum(currentQ)
  if (isPos(cq)) {
    if (cq >= qLo && cq <= qHi) {
      const cc = costAt(cq)
      parts.push('<line x1="' + svgNum(xOf(cq)) + '" y1="' + svgNum(yOf(cc)) + '" x2="' + svgNum(xOf(cq)) + '" y2="' + svgNum(bottom) + '" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" class="text-amber-600/70" />')
      parts.push('<circle cx="' + svgNum(xOf(cq)) + '" cy="' + svgNum(yOf(cc)) + '" r="4.5" fill="currentColor" class="text-amber-600" />')
      parts.push('<text x="' + svgNum(Math.min(Math.max(xOf(cq), padL + 58), W - padR - 58)) + '" y="' + svgNum(yOf(cc) - 10) + '" text-anchor="middle" font-size="11" font-weight="600" class="fill-current text-amber-600">' + esc('现拍 ' + fmtInt(cq) + ' 件 · ' + fmtInt(cc) + ' 元') + '</text>')
    } else {
      parts.push('<text x="' + svgNum(W - padR) + '" y="' + svgNum(padT - 16) + '" text-anchor="end" font-size="10" class="fill-current text-amber-600">' + esc('当前批量 ' + fmtInt(cq) + ' 件超出图示区间，未在曲线上标记') + '</text>')
    }
  }
  parts.push('</svg>')
  return parts.join('')
}

// 输入校验提示（safetyNote）：返回 { ok, msg }
function eoqInputsCheck(d, s, mode, h, price, rate) {
  if (d === null) return { ok: false, msg: '年需求量 D 还没填（件/年，日销 × 365 或月销 × 12）。' }
  if (!(d > 0)) return { ok: false, msg: '年需求量必须大于 0。' }
  if (s === null) return { ok: false, msg: '单次订货成本 S 还没填（元/次）。' }
  if (!(s > 0)) return { ok: false, msg: '订货成本必须大于 0——只算每次固定发生的开销。' }
  if (mode === 'rate') {
    if (price === null || !(price > 0)) return { ok: false, msg: '用「单价 × 持有率」时需要先填单价（元/件，>0）。' }
    if (rate === null || !(rate > 0) || rate > 100) return { ok: false, msg: '持有率请填写 0–100 之间的数字（常见 15%–30%）。' }
  }
  if (h === null || !(h > 0)) return { ok: false, msg: '单位持有成本 H 无效（元/件/年，必须 >0）。' }
  return { ok: true, msg: '输入有效，结果实时计算。' }
}

// ---------- 常量与默认值 ----------
const DEFAULTS = {
  d: '18250',
  s: '200',
  holdMode: 'direct',
  h: '8',
  price: '10',
  rate: '25',
  q: '2000'
}

// 持有成本两种输入口径（二选一联动）
const HOLD_MODES = [
  { id: 'direct', label: '直接填 H（元/件/年）' },
  { id: 'rate', label: '单价 × 持有率' }
]

// 敏感度倍率：±20% / ±40%
const SENS_MULTS = [0.6, 0.8, 1, 1.2, 1.4]

// 预设：①淘宝店 日销 50（D=18250）/ S=200 / H=8，手算 EOQ≈956 件
//      ②五金店 月销 300（D=3600）/ S=80 / 单价 10 × 持有率 25% → H=2.5，EOQ=480 件
const PRESETS = [
  {
    id: 'taobao',
    label: '淘宝店 · 日销 50 件',
    values: { d: '18250', s: '200', holdMode: 'direct', h: '8', q: '2000' }
  },
  {
    id: 'hardware',
    label: '五金店 · 单价 10 / 持有率 25%',
    values: { d: '3600', s: '80', holdMode: 'rate', price: '10', rate: '25', q: '300' }
  }
]

// ---------- 页面状态 ----------
const dInput = ref(DEFAULTS.d)
const sInput = ref(DEFAULTS.s)
const holdMode = ref(DEFAULTS.holdMode)
const hInput = ref(DEFAULTS.h)
const priceInput = ref(DEFAULTS.price)
const rateInput = ref(DEFAULTS.rate)
const qInput = ref(DEFAULTS.q)
const seoContentVisible = ref(true)

const dNum = computed(() => parseNum(dInput.value))
const sNum = computed(() => parseNum(sInput.value))
const qNum = computed(() => parseNum(qInput.value))
const priceNum = computed(() => parseNum(priceInput.value))
const rateNum = computed(() => parseNum(rateInput.value))

// 生效的持有成本 H：direct 用直填值，rate 用单价×持有率折算
const hEff = computed(() => {
  if (holdMode.value === 'direct') return parseNum(hInput.value)
  return holdCostFromRate(priceInput.value, rateInput.value)
})

const hFromRateText = computed(() => {
  const h = holdCostFromRate(priceInput.value, rateInput.value)
  if (h === null) return ''
  return `当前折算 H = ${priceNum.value} × ${rateNum.value}% = ${round1Text(h)} 元/件/年`
})

const checkResult = computed(() =>
  eoqInputsCheck(dNum.value, sNum.value, holdMode.value, hEff.value, priceNum.value, rateNum.value)
)
const ready = computed(() => checkResult.value.ok)

const eoqRawVal = computed(() => eoqRawOf(dNum.value, sNum.value, hEff.value))
const eoqInt = computed(() => eoqOf(dNum.value, sNum.value, hEff.value))
const eoqText = computed(() => (eoqInt.value === null ? '—' : String(eoqInt.value)))
const ordersYr = computed(() => ordersPerYearOf(dNum.value, eoqInt.value))
const ordersText = computed(() => (ordersYr.value === null ? '—' : ordersYr.value.toFixed(1)))
const intervalDays = computed(() => intervalDaysOf(dNum.value, eoqInt.value))
const intervalText = computed(() => (intervalDays.value === null ? '—' : intervalDays.value.toFixed(1)))
const speechText = computed(() => intervalSpeechOf(dNum.value, eoqInt.value) || '—')
const bestCost = computed(() => totalCostOf(dNum.value, sNum.value, hEff.value, eoqInt.value))
const bestCostText = computed(() => (bestCost.value ? fmtInt(bestCost.value.total) : '—'))

const overpay = computed(() => overpayVsBest(dNum.value, sNum.value, hEff.value, qNum.value))
const curveSvg = computed(() => costCurveSvgOf(dNum.value, sNum.value, hEff.value, qInput.value))
const sensRows = computed(() => sensitivityRowsOf(dNum.value, sNum.value, hEff.value, SENS_MULTS))

// 模板小工具：数字 → 显示串
function fmtIntOf(n) {
  return fmtInt(n)
}
function round1Text(n) {
  const r = round1(n)
  return r === null ? '—' : r.toFixed(1)
}

// ---------- 交互处理 ----------
function applyPreset(p) {
  dInput.value = p.values.d
  sInput.value = p.values.s
  holdMode.value = p.values.holdMode
  hInput.value = p.values.h ?? DEFAULTS.h
  priceInput.value = p.values.price ?? DEFAULTS.price
  rateInput.value = p.values.rate ?? DEFAULTS.rate
  qInput.value = p.values.q ?? ''
}

function resetAll() {
  dInput.value = DEFAULTS.d
  sInput.value = DEFAULTS.s
  holdMode.value = DEFAULTS.holdMode
  hInput.value = DEFAULTS.h
  priceInput.value = DEFAULTS.price
  rateInput.value = DEFAULTS.rate
  qInput.value = DEFAULTS.q
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('eoq-calculator')
})
</script>
