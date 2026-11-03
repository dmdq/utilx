<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <BadgePercent class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">定价计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">小生意/电商标价：成本加成、目标毛利反推、竞品对齐三种模式，毛利率与加成率一次算清</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线定价计算器：输入单件成本，用「成本加成、目标毛利率反推、竞品对齐」三种方式算出建议售价，实时双显毛利率与加成率——两者分母不同，是最容易踩的换算陷阱
        （成本 50、加成 100%，售价 100，毛利率是 50% 而不是 100%）；同时按 13/9/6/0% 增值税口径联动换算含税报价、给出 9/8/5 尾数心理价位建议，
        填月固定成本可联动测算保本销量；竞品模式下附「跟不跟价」判定。全部计算在浏览器本地完成，不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左：输入面板 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 定价输入
        </h2>

        <!-- 单件成本（三模式共用） -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="pc-cost">单件成本（元/件）</label>
          <input
            id="pc-cost"
            v-model="costInput"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            placeholder="如 50"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">不含税口径：进货价 + 包材 + 运费/头程等直接变动成本</p>
        </div>

        <!-- 模式一：成本加成 -->
        <div v-if="mode === 'costplus'">
          <label class="block text-sm font-medium text-foreground mb-2" for="pc-markup">加成率（%）</label>
          <input
            id="pc-markup"
            v-model="markupInput"
            type="number"
            step="1"
            inputmode="decimal"
            placeholder="如 100"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">以成本为分母：加成 100% 即按成本的两倍卖，售价 = 成本 × (1 + 加成率)</p>
        </div>

        <!-- 模式二：目标毛利反推 -->
        <div v-else-if="mode === 'targetmargin'">
          <label class="block text-sm font-medium text-foreground mb-2" for="pc-margin">目标毛利率（%，1-99）</label>
          <input
            id="pc-margin"
            v-model="targetMarginInput"
            type="number"
            min="0"
            max="99"
            step="1"
            inputmode="decimal"
            placeholder="如 50"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">以售价为分母：毛利率 50% 即成本占售价一半，售价 = 成本 ÷ (1 − 毛利率)</p>
        </div>

        <!-- 模式三：竞品对齐 -->
        <div v-else>
          <label class="block text-sm font-medium text-foreground mb-2" for="pc-rival">竞品售价（元）</label>
          <input
            id="pc-rival"
            v-model="rivalPriceInput"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            placeholder="如 100"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">填主要竞品的实际成交价（含日常促销价），工具据此测算你的毛利空间与跟价策略</p>
        </div>

        <!-- 通用附加：增值税税率 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="pc-tax">增值税税率</label>
          <select
            id="pc-tax"
            v-model.number="taxRate"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option :value="13">13%（一般货物）</option>
            <option :value="9">9%（交通/农产品等）</option>
            <option :value="6">6%（现代服务）</option>
            <option :value="0">0%（免税 / 零税率）</option>
          </select>
        </div>

        <!-- 通用附加：尾数定价档位 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="pc-charm">心理价位尾数档位</label>
          <select
            id="pc-charm"
            v-model.number="charmDigit"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option :value="9">9 尾 · 99 档（如 99、149）</option>
            <option :value="8">8 尾 · 98 档（如 98、88）</option>
            <option :value="5">5 尾 · 95 档（如 95、45）</option>
          </select>
        </div>

        <!-- 通用附加：月固定成本（保本联动） -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2" for="pc-fixed">月固定成本（元/月，选填）</label>
          <input
            id="pc-fixed"
            v-model="monthlyFixedInput"
            type="number"
            min="0"
            step="1"
            inputmode="decimal"
            placeholder="如 3000"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p class="text-xs text-muted-foreground mt-1.5">填了就联动测算保本销量 = 固定成本 ÷ 单件毛利（口径同站内「盈亏平衡计算器」）</p>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            @click="loadExample"
            class="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
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
      </div>

      <!-- 右：结果面板 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <h2 class="text-lg font-semibold flex items-center">
            <TrendingUp class="w-5 h-5 mr-2 text-primary" /> 定价结论
          </h2>
          <!-- 模式 tab 三选一 -->
          <div class="flex rounded-lg border border-border overflow-hidden" role="tablist" aria-label="定价模式">
            <button
              v-for="tab in modeTabs"
              :key="tab.id"
              type="button"
              role="tab"
              :aria-selected="mode === tab.id"
              class="px-3.5 py-1.5 text-sm font-medium transition"
              :class="mode === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
              @click="mode = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- 未就绪 / 不可行 -->
        <div
          v-if="!result.ok"
          class="rounded-lg p-5 text-sm leading-relaxed flex items-start gap-2 border"
          :class="result.kind === 'infeasible' ? 'bg-red-500/10 border-red-500/20' : 'bg-muted/50 border-border'"
        >
          <TriangleAlert v-if="result.kind === 'infeasible'" class="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <Info v-else class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p :class="result.kind === 'infeasible' ? 'text-red-600 font-medium' : 'text-muted-foreground'">{{ result.message }}</p>
        </div>

        <template v-else>
          <!-- 结论卡 -->
          <div class="bg-primary/10 rounded-lg p-5 text-center">
            <p class="text-xs text-muted-foreground mb-1">{{ priceLabel }}</p>
            <p class="text-5xl font-bold text-primary leading-none">
              {{ fmt(result.price) }}<span class="text-lg font-normal text-muted-foreground ml-1">元</span>
            </p>
            <div class="grid grid-cols-2 gap-2 mt-4 max-w-sm mx-auto">
              <div class="bg-card/70 rounded-lg p-2.5">
                <p class="text-[10px] text-muted-foreground mb-0.5">毛利率（毛利 ÷ 售价）</p>
                <p class="text-xl font-bold text-foreground">{{ marginPctText }}%</p>
              </div>
              <div class="bg-card/70 rounded-lg p-2.5">
                <p class="text-[10px] text-muted-foreground mb-0.5">加成率（毛利 ÷ 成本）</p>
                <p class="text-xl font-bold text-foreground">{{ markupPctText }}%</p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground mt-3">{{ formulaText }}</p>
            <p class="text-xs text-foreground mt-1.5">{{ taxText }}</p>
          </div>

          <!-- 成本构成双色条：成本占比 vs 毛利占比 -->
          <div>
            <div class="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span class="font-medium text-foreground">售价构成</span>
              <span class="flex items-center gap-3">
                <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-full inline-block bg-amber-500"></i>成本 {{ costShareText }}%</span>
                <span class="flex items-center gap-1"><i class="w-2 h-2 rounded-full inline-block bg-emerald-500"></i>毛利 {{ marginShareText }}%</span>
              </span>
            </div>
            <div class="w-full h-3 rounded-full overflow-hidden bg-muted flex">
              <div class="bg-amber-500 h-full transition-all" :style="{ width: costSharePct + '%' }"></div>
              <div class="bg-emerald-500 h-full transition-all" :style="{ width: marginSharePct + '%' }"></div>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              每卖一件收 {{ fmt(result.price) }} 元：{{ fmt(result.cost) }} 元回成本，{{ fmt(result.price - result.cost) }} 元是毛利（还没扣房租人工推广等固定费用）。
            </p>
          </div>

          <!-- 模式一科普：加成率/毛利率换算陷阱 -->
          <p v-if="result.kind === 'costplus'" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>口径陷阱：加成率的分母是成本，毛利率的分母是售价。成本 50、加成 100% → 售价 100，此时毛利率是 50% 而不是 100%——「我要一百个点」和「毛利率 100%」是两回事，报价前先对齐口径。</span>
          </p>

          <!-- 模式二科普：反向口径 -->
          <p v-else-if="result.kind === 'targetmargin'" class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>反向口径：目标毛利率 {{ fmtPct(result.marginPct) }}% 对应加成率 {{ fmtPct(result.markupPct) }}%——毛利率定 50%，其实是按成本的 200% 在卖，反推时同样别把两个口径填反。</span>
          </p>

          <!-- 模式三附加：竞品判定卡 -->
          <div v-if="result.kind === 'competitive'" class="rounded-lg border p-4" :class="verdictMeta[result.verdict].box">
            <p class="text-sm font-semibold flex items-center gap-1.5" :class="verdictMeta[result.verdict].title">
              <CheckCircle v-if="result.verdict === 'green'" class="w-4 h-4" />
              <TriangleAlert v-else class="w-4 h-4" />
              {{ verdictMeta[result.verdict].label }}
            </p>
            <p class="text-xs leading-relaxed mt-1.5 text-foreground">{{ verdictText }}</p>
            <p class="text-[10px] text-muted-foreground mt-1.5">判定阈值（成本 ÷ 竞品价：&lt;0.7 / &lt;0.9 / ≥0.9）为通用经验参考，非行业标准，请结合品类与库存压力自行调整。</p>
          </div>

          <!-- 竞品模式：负毛利警告 -->
          <p
            v-if="result.kind === 'competitive' && result.marginPct < 0"
            class="text-xs leading-relaxed p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-start gap-1.5"
          >
            <TriangleAlert class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>按竞品价 {{ fmt(result.price) }} 元销售每件亏损 {{ fmt(result.cost - result.price) }} 元：成本高于竞品售价，跟价即亏损，先谈供应链成本或直接换赛道。</span>
          </p>

          <!-- 盈亏平衡联动提示 -->
          <p
            v-if="breakEvenInfo"
            class="text-xs leading-relaxed p-3 rounded-lg flex items-start gap-1.5"
            :class="breakEvenInfo.loss ? 'bg-red-500/10 text-red-600' : 'bg-muted/60 text-foreground'"
          >
            <TriangleAlert v-if="breakEvenInfo.loss" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <Info v-else class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ breakEvenText }}</span>
          </p>

          <!-- 尾数定价建议行 -->
          <p v-if="charmInfo" class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 text-foreground flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{{ charmText }}</span>
          </p>
        </template>

        <!-- 静态提示条 -->
        <p class="text-xs leading-relaxed p-3 rounded-lg bg-muted/60 text-foreground border border-border flex items-start gap-2">
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>价格是策略不是算术：锚定效应、竞品位次、复购结构都不在公式里，公式只保证不亏。</span>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>定价计算器是什么？</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          定价计算器是一款面向小生意、摆摊与电商卖家的在线标价工具。它围绕单件成本提供三条定价路径：
          成本加成（售价 = 成本 × (1 + 加成率)）、目标毛利率反推（售价 = 成本 ÷ (1 − 毛利率)）与竞品对齐（以竞品成交价为锚，反算你的毛利与加成空间）。
          页面实时双显毛利率与加成率——两者分母不同，是定价里最常见的换算陷阱（成本 50、加成 100%，售价 100，毛利率是 50% 而非 100%）；
          同时按 13/9/6/0% 增值税口径联动换算含税报价、给出 9/8/5 尾数心理价位建议，填月固定成本还可联动测算保本销量；
          竞品模式下会给出「明显降价空间 / 可跟进但利润薄 / 成本优势不足」三档跟价判定。全部计算在浏览器本地完成，不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">加成率和毛利率的区别（本页核心科普）</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          加成率（markup）的分母是成本：加成率 = 毛利 ÷ 成本；毛利率（margin）的分母是售价：毛利率 = 毛利 ÷ 售价。
          正毛利时售价大于成本，所以同一笔生意的加成率永远大于毛利率。两者互逆换算：毛利率 = 加成率 ÷ (1 + 加成率)，加成率 = 毛利率 ÷ (1 − 毛利率)。
          最典型的例子：成本 50 元、加成 100%，售价 100 元，单件毛利 50 元——毛利率 = 50 ÷ 100 = 50%，而不是 100%。
          老板口头说的「我要一百个点」多数指加成率，财务报表与平台后台里的「毛利率」是另一个口径，报价与复盘前先统一语言。
        </p>
        <div class="overflow-x-auto mt-3">
          <table class="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr class="bg-muted/50 text-foreground">
                <th class="px-3 py-2 text-left font-medium">加成率</th>
                <th class="px-3 py-2 text-left font-medium">对应毛利率</th>
                <th class="px-3 py-2 text-left font-medium">成本 50 元时的售价</th>
              </tr>
            </thead>
            <tbody class="text-muted-foreground">
              <tr class="border-t border-border"><td class="px-3 py-1.5">25%</td><td class="px-3 py-1.5">20%</td><td class="px-3 py-1.5">62.5 元</td></tr>
              <tr class="border-t border-border"><td class="px-3 py-1.5">50%</td><td class="px-3 py-1.5">33.3%</td><td class="px-3 py-1.5">75 元</td></tr>
              <tr class="border-t border-border"><td class="px-3 py-1.5">100%</td><td class="px-3 py-1.5">50%</td><td class="px-3 py-1.5">100 元</td></tr>
              <tr class="border-t border-border"><td class="px-3 py-1.5">150%</td><td class="px-3 py-1.5">60%</td><td class="px-3 py-1.5">125 元</td></tr>
              <tr class="border-t border-border"><td class="px-3 py-1.5">200%</td><td class="px-3 py-1.5">66.7%</td><td class="px-3 py-1.5">150 元</td></tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">成本加成定价的优缺点</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>优点：算法简单、每单账算得快；只要成本核算准确，售出即不亏单件；适合成本结构稳定的标品、批发与加工报价。</li>
          <li>缺点：完全不看需求与竞品——成本低不等于消费者愿意付；运费、损耗、退货等成本分摊不准会被层层放大。</li>
          <li>缺点：高价高毛利可能把销量让给对手，低价走量又可能养不活固定成本。</li>
          <li>关键提醒：「保住毛利率」不等于赚钱——毛利还要覆盖房租、人工、推广等固定支出，建议配合保本销量倒验。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">目标毛利率怎么定</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          没有统一答案，常见经验区间：实体零售 20%-40%；餐饮按食材成本率倒算常对应毛利 60%-70%；电商标品 15%-30%；
          非标品、私域选品 40% 以上；软件与虚拟商品边际成本低，毛利可到 70% 以上。定目标时注意三点：
          一是毛利要能覆盖固定费用，可把月固定成本填进本页，用「保本销量 = 固定成本 ÷ 单件毛利」倒验目标是否现实；
          二是参考同行的实际成交价而不是吊牌价；三是分清毛利与净利——毛利率 50% 的生意扣除固定费用后净利可能只剩 10%。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">尾数定价（9.9 vs 10）有没有用</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          有用，但机制是心理而非折扣：一是左位数效应——人从左往右读价格，9.9 被归入「九块多」而不是「十块」；
          二是 9/5 这类尾数暗示「这是精算过的价格」，降低砍价预期；三是在电商比价场景里，9 尾价常排在同价位段靠前位置。
          但对品牌调性、礼品与高端服务，整数定价反而更体面。本页按 9/8/5 尾给出不高于计算价的建议值（如 100 → 99，只少 1 元），
          是否采用属于策略选择——定价 99 比 100 只少 1 元，转化率差异常见显著，这是经验口径而非定律。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">含税价不含税价报价口径</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          中国增值税按价外税原理计税，但日常零售习惯报含税价。两种口径的换算：含税价 = 不含税价 × (1 + 税率)；
          价税分离则反过来：不含税价 = 含税价 ÷ (1 + 税率)。税率常见 13%（一般货物）、9%（交通运输、农产品等）、6%（现代服务），
          小规模纳税人另有征收率，免税/零税率按 0% 处理。报价与合同务必写清「含税/不含税 + 适用税率 + 票种」，
          口径不清是结算差额争议的最常见来源；测算毛利时建议统一用不含税口径，用含税价算毛利会把毛利率系统性低估。
          本页的含税换算与站内「增值税含税/不含税换算器」口径一致，需要拆税额、开票核对可用那个工具。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">加成率 100%，为什么毛利率只有 50%？</h3>
            <p class="text-sm text-muted-foreground mt-1">因为分母不同：加成率的分母是成本，毛利率的分母是售价。成本 50 元、加成 100%，售价 100 元，单件毛利 50 元，毛利率 = 50 ÷ 100 = 50%。换算公式为毛利率 = 加成率 ÷ (1 + 加成率)；在本页输入成本与加成率，两个口径会同时显示。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">目标毛利率定多少合适？</h3>
            <p class="text-sm text-muted-foreground mt-1">实体零售常见 20%-40%，餐饮按食材成本率反算常在 60%-70%，电商标品 15%-30%，软件与虚拟商品可到 70% 以上。关键是毛利要覆盖固定费用：把月固定成本填进本页，用保本销量 = 固定成本 ÷ 单件毛利倒验目标是否现实。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">尾数定价（9.9、99）真的有用吗？</h3>
            <p class="text-sm text-muted-foreground mt-1">多数零售场景有用，来自左位数效应与「精算价」暗示，如 100 定成 99 只少 1 元但转化差异常见显著；不过高端、礼品与品牌场景整数定价更体面。本页给出不高于计算价的 9/8/5 尾建议值，是否采用属于策略选择。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">报价应该报含税价还是不含税价？</h3>
            <p class="text-sm text-muted-foreground mt-1">两种都可以，但必须写明口径与适用税率：含税价 = 不含税价 × (1 + 税率)，价税分离用除法还原。毛利测算建议统一用不含税口径，避免毛利率被系统性低估；需要拆税额可配合站内「增值税含税/不含税换算器」。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'pricing-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  BadgePercent, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, TrendingUp
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '定价计算器 - 成本加成/目标毛利反推/竞品对齐在线定价工具',
  description: '免费在线定价计算器：输入单件成本，支持成本加成定价、目标毛利率反推售价、竞品对齐跟价三种模式，自动双显毛利率与加成率换算、含税价换算（13/9/6/0%）、尾数定价建议与保本销量联动测算，附加成率与毛利率区别、报价口径科普，纯浏览器本地运行不上传',
  keywords: '定价计算器,成本加成定价,毛利率计算,售价怎么定,标价策略',
  author: '有条工具',
  ogTitle: '定价计算器 - 成本加成/目标毛利反推/竞品对齐在线定价工具 | 有条工具',
  ogDescription: '三种定价模式算出建议售价，毛利率与加成率双显换算，含税价、尾数价与保本销量联动，附跟价判定。',
  ogUrl: 'https://www.util.cn/tools/pricing-calculator',
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
          name: '定价计算器',
          url: 'https://www.util.cn/tools/pricing-calculator',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['成本加成定价计算', '目标毛利率反推售价', '竞品对齐与跟价判定', '加成率与毛利率互逆换算', '含税价换算（13/9/6/0%）', '尾数定价（9/8/5 尾）建议', '保本销量联动测算', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '定价计算器', item: 'https://www.util.cn/tools/pricing-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '加成率 100%，为什么毛利率只有 50%？',
              acceptedAnswer: { '@type': 'Answer', text: '因为分母不同：加成率的分母是成本，毛利率的分母是售价。成本 50 元、加成 100%，售价 100 元，单件毛利 50 元，毛利率 = 50 ÷ 100 = 50%。换算公式为毛利率 = 加成率 ÷ (1 + 加成率)。' }
            },
            {
              '@type': 'Question',
              name: '目标毛利率定多少合适？',
              acceptedAnswer: { '@type': 'Answer', text: '实体零售常见 20%-40%，餐饮按食材成本率反算常在 60%-70%，电商标品 15%-30%，软件与虚拟商品可到 70% 以上。关键是毛利要覆盖固定费用：用保本销量 = 月固定成本 ÷ 单件毛利倒验目标是否现实。' }
            },
            {
              '@type': 'Question',
              name: '尾数定价（9.9、99）真的有用吗？',
              acceptedAnswer: { '@type': 'Answer', text: '多数零售场景有用，来自左位数效应与精算价暗示，如 100 定成 99 只少 1 元但转化差异常见显著；高端、礼品与品牌场景整数定价更体面。' }
            },
            {
              '@type': 'Question',
              name: '报价应该报含税价还是不含税价？',
              acceptedAnswer: { '@type': 'Answer', text: '两种都可以，但必须写明口径与适用税率：含税价 = 不含税价 × (1 + 税率)，价税分离用除法还原。毛利测算建议统一用不含税口径，避免毛利率被系统性低估。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------
// 把任意输入解析成有限数字，解析失败返回 NaN（供输入框联动容错）
function numOf(v) {
  const n = typeof v === 'number' ? v : parseFloat(v)
  return Number.isFinite(n) ? n : NaN
}

// 保留 2 位小数（货币展示用，不参与公式传递，避免累积舍入误差）
function round2(n) {
  return Math.round(n * 100) / 100
}

// 保留 1 位小数（百分比展示用）
function round1(n) {
  return Math.round(n * 10) / 10
}

// 【换算陷阱】加成率(markup) → 毛利率(margin)：分母不同，两者不相等。
// 加成率 = 毛利 ÷ 成本；毛利率 = 毛利 ÷ 售价；售价 = 成本 × (1 + 加成率)，
// 故毛利率 = 加成率 ÷ (1 + 加成率)。例：成本 50、加成 100% → 售价 100 → 毛利率 50%，不是 100%。
// 加成率 ≤ -100% 时售价归零或为负，无意义，返回 NaN。
function markupToMarginOf(markupPct) {
  const m = numOf(markupPct)
  if (!Number.isFinite(m) || m <= -100) return NaN
  return (m / (100 + m)) * 100
}

// 毛利率(margin) → 加成率(markup)：加成率 = 毛利率 ÷ (1 − 毛利率)，与上式互逆。
// 毛利率 100% 时分母为 0，任何有限售价都无法满足（货白送还倒贴），返回 NaN。
function marginToMarkupOf(marginPct) {
  const m = numOf(marginPct)
  if (!Number.isFinite(m) || m >= 100) return NaN
  return (m / (100 - m)) * 100
}

// 成本加成定价：售价 = 成本 × (1 + 加成率/100)，成本必须大于 0
function priceOfCostPlus(cost, markupPct) {
  const c = numOf(cost)
  const m = numOf(markupPct)
  if (!(c > 0) || !Number.isFinite(m)) return NaN
  return c * (1 + m / 100)
}

// 目标毛利反推：售价 = 成本 ÷ (1 − 毛利率/100)；毛利率 ≥ 100% 时分母为 0 或为负，不可行，返回 NaN
function priceOfTargetMargin(cost, marginPct) {
  const c = numOf(cost)
  const m = numOf(marginPct)
  if (!(c > 0) || !Number.isFinite(m) || m >= 100) return NaN
  return c / (1 - m / 100)
}

// 竞品跟价判定（阈值为通用经验参考，非行业标准）：
// 成本 < 竞品价 × 0.7 → green（有明显降价空间）；< 竞品价 × 0.9 → yellow（可跟进但利润薄）；否则 red（成本优势不足，考虑差异化）
function judgeCompetitiveOf(cost, rivalPrice) {
  const c = numOf(cost)
  const r = numOf(rivalPrice)
  if (!(c > 0) || !(r > 0)) return 'invalid'
  const ratio = c / r
  if (ratio < 0.7) return 'green'
  if (ratio < 0.9) return 'yellow'
  return 'red'
}

// 含税价换算：与站内「增值税含税/不含税换算器」(vat-calculator) 口径一致，本地自实现、不跨页面 import。
// 增值税为价外税加计：含税价 = 不含税价 × (1 + 税率/100)；日常零售习惯报的含税价即「税款含在成交价里」的价内税观感口径。
// 返回不取整的精确值，展示层再统一保留 2 位小数。
function grossOf(net, rate) {
  const n = numOf(net)
  const r = numOf(rate)
  if (!Number.isFinite(n) || !Number.isFinite(r)) return NaN
  return n * (1 + r / 100)
}

// 价税分离：不含税价 = 含税价 ÷ (1 + 税率/100)，税率 ≤ -100% 时分母为 0，返回 NaN
function netOf(gross, rate) {
  const g = numOf(gross)
  const r = numOf(rate)
  if (!Number.isFinite(g) || !Number.isFinite(r) || r <= -100) return NaN
  return g / (1 + r / 100)
}

// 尾数定价（charm pricing）建议：取不超过 p、个位为 digit（9/8/5）的最大整数。
// 建议价永不高于原计算价（向下取整到目标尾数）；不足 10 元不做尾数处理，原样返回。
// 例：charmPriceOf(100) → 99；charmPriceOf(152) → 149；charmPriceOf(95, 5) → 95。
function charmPriceOf(p, digit = 9) {
  const x = numOf(p)
  if (!Number.isFinite(x)) return NaN
  const base = Math.floor(x)
  const d = numOf(digit)
  if (!Number.isFinite(d) || base < 10) return base
  const rem = base % 10
  return base - rem + d - (rem >= d ? 0 : 10)
}

// 盈亏平衡联动：保本销量 = 月固定成本 ÷ 单件毛利（向上取整），
// 口径与站内「盈亏平衡计算器」一致（单件毛利 = 售价 − 单件成本，即边际贡献）。
// 单件毛利 ≤ 0 时卖得越多亏得越多，返回 Infinity 供上层红字提示。
function breakEvenUnitsOf(fixedCost, unitProfit) {
  const f = numOf(fixedCost)
  const u = numOf(unitProfit)
  if (!(f > 0) || !Number.isFinite(u)) return NaN
  if (u <= 0) return Infinity
  return Math.ceil(f / u)
}

// ---------- 交互状态 ----------
const modeTabs = [
  { id: 'costplus', label: '成本加成' },
  { id: 'targetmargin', label: '目标毛利反推' },
  { id: 'competitive', label: '竞品对齐' }
]
const mode = ref('costplus')
const costInput = ref('')
const markupInput = ref('100')
const targetMarginInput = ref('50')
const rivalPriceInput = ref('')
const taxRate = ref(13)
const charmDigit = ref(9)
const monthlyFixedInput = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- 结果计算（按模式归一到统一结论结构） ----------
const result = computed(() => {
  const c = numOf(costInput.value)
  if (!(c > 0)) {
    return { ok: false, kind: 'pending', message: '先在左侧填入大于 0 的单件成本（不含税口径），定价结论会实时更新。' }
  }

  if (mode.value === 'costplus') {
    const mk = numOf(markupInput.value)
    const markup = Number.isFinite(mk) ? mk : NaN
    const price = priceOfCostPlus(c, markup)
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, kind: 'pending', message: '加成率过低（≤ -100%）会把售价归零甚至为负，请检查输入。' }
    }
    return { ok: true, kind: 'costplus', cost: c, price, marginPct: markupToMarginOf(markup), markupPct: markup }
  }

  if (mode.value === 'targetmargin') {
    const mg = numOf(targetMarginInput.value)
    if (!Number.isFinite(mg)) {
      return { ok: false, kind: 'pending', message: '请填写目标毛利率（1-99 之间）。' }
    }
    if (mg >= 100) {
      return { ok: false, kind: 'infeasible', message: `目标毛利率 ${fmt(mg)}% 不可行：售价 = 成本 ÷ (1 − 毛利率)，毛利率达到 100% 时分母为 0，等于让货白送还倒贴成本，任何售价都满足不了，请把目标调到 99% 以下。` }
    }
    const mgUse = Math.max(mg, 0)
    const price = priceOfTargetMargin(c, mgUse)
    return { ok: true, kind: 'targetmargin', cost: c, price, marginPct: mgUse, markupPct: marginToMarkupOf(mgUse) }
  }

  // 竞品对齐
  const rp = numOf(rivalPriceInput.value)
  if (!(rp > 0)) {
    return { ok: false, kind: 'pending', message: '竞品对齐模式：请填写大于 0 的竞品售价，工具会以它为锚测算你的毛利与跟价策略。' }
  }
  return {
    ok: true,
    kind: 'competitive',
    cost: c,
    price: rp,
    marginPct: ((rp - c) / rp) * 100,
    markupPct: ((rp - c) / c) * 100,
    verdict: judgeCompetitiveOf(c, rp),
    ratioPct: (c / rp) * 100
  }
})

const marginPctText = computed(() => (result.value.ok ? fmtPct(result.value.marginPct) : '—'))
const markupPctText = computed(() => (result.value.ok ? fmtPct(result.value.markupPct) : '—'))

const priceLabel = computed(() => {
  if (result.value.kind === 'costplus') return '建议售价（成本 × (1 + 加成率)）'
  if (result.value.kind === 'targetmargin') return '反推售价（成本 ÷ (1 − 毛利率)）'
  return '对齐竞品的参考售价'
})

const formulaText = computed(() => {
  const r = result.value
  if (!r.ok) return ''
  if (r.kind === 'costplus') return `${fmt(r.cost)} × (1 + ${fmtPct(r.markupPct)}%) = ${fmt(r.price)}`
  if (r.kind === 'targetmargin') return `${fmt(r.cost)} ÷ (1 − ${fmtPct(r.marginPct)}%) = ${fmt(r.price)}`
  return `以竞品价 ${fmt(r.price)} 元为锚：你的单件毛利 ${fmt(r.price - r.cost)} 元`
})

// ---------- 含税价换算行 ----------
const taxMultiplierText = computed(() => (1 + taxRate.value / 100).toFixed(2))
const grossPrice = computed(() => {
  const r = result.value
  return r.ok ? grossOf(r.price, taxRate.value) : NaN
})
const netFromGross = computed(() => {
  const r = result.value
  return r.ok ? netOf(grossPrice.value, taxRate.value) : NaN
})
const taxText = computed(() => {
  if (!result.value.ok) return ''
  if (taxRate.value === 0) return '0% 税率（免税/零税率）：含税价即建议售价，无需另加税额'
  return `按 ${taxRate.value}% 增值税：含税报价约 ${fmt(grossPrice.value)} 元（含税 = 不含税 × ${taxMultiplierText.value}）；反向价税分离 ${fmt(grossPrice.value)} ÷ ${taxMultiplierText.value} = ${fmt(netFromGross.value)} 元`
})

// ---------- 售价构成双色条 ----------
const costSharePct = computed(() => {
  const r = result.value
  if (!r.ok || !(r.price > 0)) return 0
  return Math.min(100, Math.max(0, round1((r.cost / r.price) * 100)))
})
const marginSharePct = computed(() => {
  const r = result.value
  if (!r.ok || !(r.price > 0)) return 0
  return Math.min(100, Math.max(0, round1(((r.price - r.cost) / r.price) * 100)))
})
const costShareText = computed(() => (result.value.ok ? fmtPct(costSharePct.value) : '—'))
const marginShareText = computed(() => (result.value.ok ? fmtPct(marginSharePct.value) : '—'))

// ---------- 竞品判定 ----------
const verdictMeta = {
  green: { label: '有明显降价空间', box: 'bg-green-500/10 border-green-500/20', title: 'text-green-600' },
  yellow: { label: '可跟进但利润薄', box: 'bg-amber-500/10 border-amber-500/20', title: 'text-amber-600' },
  red: { label: '成本优势不足，考虑差异化', box: 'bg-red-500/10 border-red-500/20', title: 'text-red-600' }
}
const verdictText = computed(() => {
  const r = result.value
  if (!r.ok || r.kind !== 'competitive' || r.verdict === 'invalid') return ''
  const pct = fmtPct(r.ratioPct)
  if (r.verdict === 'green') return `你的单件成本 ${fmt(r.cost)} 元只有竞品价 ${fmt(r.price)} 元的 ${pct}%，即使打到竞品价七折以下仍有毛利，可以用价格主动进攻抢量。`
  if (r.verdict === 'yellow') return `成本约为竞品价的 ${pct}%（0.7-0.9 区间）：可以跟价，但每件毛利已经很薄，建议同步压成本，或用满减、组合装把利润补回来。`
  return `成本达到竞品价的 ${pct}% 以上：硬跟价几乎不赚钱，建议避开正面价格战，在品质、服务或套装上做差异化。`
})

// ---------- 盈亏平衡联动 ----------
const breakEvenInfo = computed(() => {
  const r = result.value
  if (!r.ok) return null
  const fixed = numOf(monthlyFixedInput.value)
  if (!(fixed > 0)) return null
  const unitProfit = r.price - r.cost
  const units = breakEvenUnitsOf(fixed, unitProfit)
  return { fixed, unitProfit: round2(unitProfit), units, loss: !Number.isFinite(units) }
})
const breakEvenText = computed(() => {
  const b = breakEvenInfo.value
  if (!b) return ''
  if (b.loss) return `按当前定价单件毛利 ${fmt(b.unitProfit)} 元 ≤ 0，卖得越多亏得越多，先解决定价或成本再谈保本。`
  return `盈亏平衡联动：月固定成本 ${fmt(b.fixed)} 元 ÷ 单件毛利 ${fmt(b.unitProfit)} 元 ≈ ${b.units} 件/月保本（向上取整）。口径与站内「盈亏平衡计算器」一致，需要完整的目标利润与安全边际分析详见该工具。`
})

// ---------- 尾数定价建议 ----------
const charmInfo = computed(() => {
  const r = result.value
  if (!r.ok) return null
  const cp = charmPriceOf(r.price, charmDigit.value)
  if (!Number.isFinite(cp)) return null
  const diff = round2(r.price - cp)
  return { price: r.price, suggest: cp, digit: charmDigit.value, diff, same: diff <= 0 }
})
const charmText = computed(() => {
  const c = charmInfo.value
  if (!c) return ''
  if (c.same) return `心理价位建议：建议售价 ${fmt(c.price)} 元本身已落在 ${c.digit} 尾上，无需再调。`
  if (c.diff <= 2) {
    return `心理价位建议：定价 ${fmt(c.suggest)} 元——比 ${fmt(c.price)} 元只少 ${fmt(c.diff)} 元，转化率差异常见显著（经验口径）。`
  }
  return `心理价位建议：定价 ${fmt(c.suggest)} 元——比 ${fmt(c.price)} 元少 ${fmt(c.diff)} 元，换一档心理价位更容易被归入「${c.digit} 块多」（经验口径）。`
})

// ---------- 展示格式化 ----------
function fmt(n) {
  const x = numOf(n)
  if (!Number.isFinite(x)) return '—'
  return String(round2(x))
}

function fmtPct(n) {
  const x = numOf(n)
  if (!Number.isFinite(x)) return '—'
  return String(round1(x))
}

// ---------- 操作 ----------
function loadExample() {
  mode.value = 'costplus'
  costInput.value = '50'
  markupInput.value = '100'
  rivalPriceInput.value = ''
  monthlyFixedInput.value = '3000'
}

function resetAll() {
  mode.value = 'costplus'
  costInput.value = ''
  markupInput.value = '100'
  targetMarginInput.value = '50'
  rivalPriceInput.value = ''
  monthlyFixedInput.value = ''
  taxRate.value = 13
  charmDigit.value = 9
}

onMounted(() => {
  addRecentTool('pricing-calculator')
})
</script>
