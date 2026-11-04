<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Building2 class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">租房还是买房计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">买房 vs 租房全成本对比:月供利息、机会成本、租售比与交叉年份,一表看清哪个更划算</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        在线租房还是买房计算器:录入房价、首付、贷款利率与月租金,按「净成本 = 真金白银流出 − 资产价值」口径逐年对比买房与租房的累计成本,
        自动测算买房累计净成本首次低于租房的交叉年份;同时给出租售比判定(国际参考 1:200~300)、房价涨幅 −2% / 0% / +3% 敏感度分析与每 5 年成本对比表。
        全部计算在浏览器本地完成,不上传任何数据。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- 左侧:参数输入 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Building2 class="w-5 h-5 mr-2 text-primary" /> 参数设置
        </h2>

        <!-- 通用参数 -->
        <div>
          <h3 class="text-xs font-semibold text-muted-foreground mb-2">通用参数</h3>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label for="rvb-years" class="block text-xs font-medium text-foreground mb-1.5">比较年限(年)</label>
              <input
                id="rvb-years"
                v-model.number="compareYears"
                type="number"
                min="5"
                max="50"
                step="1"
                class="w-full px-2 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="rvb-inflation" class="block text-xs font-medium text-foreground mb-1.5">通胀率 %</label>
              <input
                id="rvb-inflation"
                v-model.number="inflationRate"
                type="number"
                min="-2"
                max="15"
                step="0.5"
                class="w-full px-2 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="rvb-invest" class="block text-xs font-medium text-foreground mb-1.5">理财收益 %</label>
              <input
                id="rvb-invest"
                v-model.number="investRate"
                type="number"
                min="0"
                max="15"
                step="0.1"
                class="w-full px-2 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p class="text-[10px] text-muted-foreground mt-1.5">年限 5-50;理财收益为保守口径,用于现金机会成本;持有成本按通胀逐年上涨</p>
        </div>

        <!-- 买房侧 -->
        <div class="border-t border-border pt-4">
          <h3 class="text-xs font-semibold text-muted-foreground mb-2">买房侧</h3>
          <div class="space-y-3">
            <div>
              <label for="rvb-price" class="block text-sm font-medium text-foreground mb-1.5">房价(万元)</label>
              <input
                id="rvb-price"
                v-model.number="priceWan"
                type="number"
                min="0"
                step="10"
                placeholder="如 300"
                class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="rvb-down" class="block text-xs font-medium text-foreground mb-1.5">首付比例 %</label>
                <input
                  id="rvb-down"
                  v-model.number="downPct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label for="rvb-loan-rate" class="block text-xs font-medium text-foreground mb-1.5">贷款利率 %</label>
                <input
                  id="rvb-loan-rate"
                  v-model.number="loanRatePct"
                  type="number"
                  min="0"
                  max="15"
                  step="0.1"
                  class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="rvb-loan-years" class="block text-xs font-medium text-foreground mb-1.5">贷款年限(年)</label>
                <input
                  id="rvb-loan-years"
                  v-model.number="loanYears"
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label for="rvb-fee" class="block text-xs font-medium text-foreground mb-1.5">月物业费(元)</label>
                <input
                  id="rvb-fee"
                  v-model.number="propertyFee"
                  type="number"
                  min="0"
                  step="100"
                  class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="rvb-repair" class="block text-xs font-medium text-foreground mb-1.5">年维修预留(房价 %)</label>
                <input
                  id="rvb-repair"
                  v-model.number="repairPct"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label for="rvb-deal" class="block text-xs font-medium text-foreground mb-1.5">交易税费(房价 %)</label>
                <input
                  id="rvb-deal"
                  v-model.number="dealCostPct"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label for="rvb-growth" class="block text-sm font-medium text-foreground mb-1.5">预期房价年涨幅 %</label>
              <input
                id="rvb-growth"
                v-model.number="priceGrowth"
                type="number"
                min="-5"
                max="10"
                step="0.5"
                class="w-full px-3 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p class="text-[10px] text-muted-foreground mt-1">范围 −5 ~ 10;契税 + 中介等一次性税费默认按房价 2% 估</p>
            </div>
            <p class="text-xs leading-relaxed p-2.5 rounded bg-muted/60 text-muted-foreground">
              贷款 {{ loanWanText }} · 月供约 <span class="font-mono font-semibold text-foreground">{{ monthlyPayText }}</span> 元(等额本息)
            </p>
          </div>
        </div>

        <!-- 租房侧 -->
        <div class="border-t border-border pt-4">
          <h3 class="text-xs font-semibold text-muted-foreground mb-2">租房侧</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="rvb-rent" class="block text-xs font-medium text-foreground mb-1.5">月租金(元)</label>
              <input
                id="rvb-rent"
                v-model.number="monthlyRent"
                type="number"
                min="0"
                step="500"
                placeholder="如 6000"
                class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="rvb-rent-growth" class="block text-xs font-medium text-foreground mb-1.5">年租金涨幅 %</label>
              <input
                id="rvb-rent-growth"
                v-model.number="rentGrowth"
                type="number"
                min="-10"
                max="30"
                step="0.5"
                class="w-full px-2.5 py-2 bg-background border border-border border-input rounded-lg text-foreground text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p class="text-[10px] text-muted-foreground mt-1.5">押金简化按 1 个月租,只计占用期间的理财增值损失</p>
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
            <Play class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 载入示例
          </button>
          <button
            @click="resetAll"
            class="px-4 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition"
          >
            <RefreshCw class="w-4 h-4 inline mr-1.5 -mt-0.5" /> 重置
          </button>
        </div>
      </div>

      <!-- 右侧:测算结果(占两列) -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5">
        <h2 class="text-lg font-semibold flex items-center">
          <Calculator class="w-5 h-5 mr-2 text-primary" /> 测算结果
        </h2>

        <!-- 结论卡 -->
        <div v-if="hasFullInput" class="space-y-3">
          <div class="rounded-lg p-5 text-center" :class="hasCrossover ? 'bg-primary/10' : 'bg-muted/50'">
            <p class="text-xs text-muted-foreground mb-1">买房累计净成本首次低于租房的年份</p>
            <p class="text-4xl font-bold" :class="hasCrossover ? 'text-primary' : 'text-foreground'">{{ crossoverText }}</p>
            <p class="text-xs text-muted-foreground mt-2">{{ crossoverDesc }}</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">期末买房净成本(第 {{ compareYearsNum }} 年)</p>
              <p class="text-xl font-bold text-foreground">{{ formatWan(finalBuyCost) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">月供 + 机会成本 + 持有 − 房产净权益</p>
            </div>
            <div class="bg-muted/50 rounded-lg p-4 text-center">
              <p class="text-xs text-muted-foreground mb-1">期末租房净成本</p>
              <p class="text-xl font-bold text-foreground">{{ formatWan(finalRentCost) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">租金累计 + 押金占用损失</p>
            </div>
            <div class="rounded-lg p-4 text-center border" :class="finalDiff <= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'">
              <p class="text-xs text-muted-foreground mb-1">期末对比(买房 − 租房)</p>
              <p class="text-xl font-bold" :class="finalDiff <= 0 ? 'text-green-600' : 'text-blue-600'">{{ formatWan(finalDiff) }}</p>
              <p class="text-[10px] text-muted-foreground mt-1">{{ finalDiff <= 0 ? '买房累计更低' : '租房累计更低' }}</p>
            </div>
          </div>
        </div>
        <p
          v-else
          class="text-xs leading-relaxed p-3 rounded-lg border border-border bg-muted/60 text-muted-foreground flex items-start gap-1.5"
        >
          <Info class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>先在左侧填入房价与月租金开始对比,或点击「载入示例」查看 300 万房 / 月租 6000 的演示数据。</span>
        </p>

        <!-- 累计成本对比表 -->
        <div v-if="hasFullInput">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-foreground">累计净成本对比(每 5 年)</h3>
            <span class="text-xs text-muted-foreground">万元 · 绿行 = 买房更低,蓝行 = 租房更低</span>
          </div>
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/50 text-muted-foreground">
                  <th class="px-3 py-2 text-left font-medium">年份</th>
                  <th class="px-3 py-2 text-right font-medium">买房净成本</th>
                  <th class="px-3 py-2 text-right font-medium">租房净成本</th>
                  <th class="px-3 py-2 text-right font-medium">差额(买房 − 租房)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="row in tableRows" :key="row.year" :class="row.buyBetter ? 'bg-green-500/5' : 'bg-blue-500/5'">
                  <td class="px-3 py-2 text-muted-foreground whitespace-nowrap">第 {{ row.year }} 年末</td>
                  <td class="px-3 py-2 text-right font-mono">{{ formatWan(row.buy) }}</td>
                  <td class="px-3 py-2 text-right font-mono">{{ formatWan(row.rent) }}</td>
                  <td class="px-3 py-2 text-right font-mono whitespace-nowrap" :class="row.buyBetter ? 'text-green-600 font-semibold' : 'text-blue-600 font-semibold'">
                    {{ formatWan(row.diff) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-2 flex items-start gap-1">
            <Info class="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>差额为负表示该年年末买房累计净成本更低(买房省);买房侧含首付、税费、月供、持有成本并扣除房产净权益,租房侧含租金累计与押金占用损失。</span>
          </p>
        </div>
        <div v-else class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          填入房价与月租金后,这里会给出每 5 年的累计净成本对比表。
        </div>

        <!-- 租售比卡 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="rounded-lg border border-border bg-muted/40 p-4">
            <p class="text-xs text-muted-foreground mb-1.5 flex items-center">
              <Calculator class="w-3.5 h-3.5 mr-1 text-primary" /> 租售比(按当前输入)
            </p>
            <p class="text-2xl font-bold text-foreground">
              {{ ratioText }}<span class="text-sm font-normal text-muted-foreground ml-1.5">个月租金 ≈ 房价</span>
            </p>
            <p class="text-xs text-muted-foreground mt-1">≈ {{ ratioYearsText }} 年租金收回当前房价</p>
          </div>
          <div class="rounded-lg border p-4" :class="ratioMeta[ratioLevel].cls">
            <p class="text-sm font-semibold flex items-center gap-1.5">
              <component :is="ratioMeta[ratioLevel].icon" class="w-4 h-4 flex-shrink-0" />
              {{ ratioMeta[ratioLevel].label }}
            </p>
            <p class="text-xs mt-1.5 leading-relaxed">{{ ratioMeta[ratioLevel].text }}</p>
          </div>
        </div>

        <!-- 敏感度条 -->
        <div>
          <h3 class="text-sm font-semibold text-foreground mb-2 flex items-center">
            <TrendingDown class="w-4 h-4 mr-1.5 text-primary" /> 敏感度:房价涨幅假设对交叉年份的影响
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="row in sensitivityRows"
              :key="row.growth"
              class="rounded-lg border p-3 text-center"
              :class="row.growth === 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/40'"
            >
              <p class="text-[10px] text-muted-foreground mb-1">房价年涨幅 {{ row.growth > 0 ? '+' : '' }}{{ row.growth }}%</p>
              <p class="text-lg font-bold" :class="row.crossover ? 'text-primary' : 'text-muted-foreground'">
                {{ row.crossover ? '第 ' + row.crossover + ' 年' : '无交叉' }}
              </p>
            </div>
          </div>
          <p class="text-xs text-muted-foreground leading-relaxed mt-2">固定其他输入不变,仅把房价年涨幅假设改为 −2% / 0% / +3% 三档后重新测算交叉年份。</p>
        </div>

        <!-- 提示条(静态) -->
        <p class="text-xs leading-relaxed p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-foreground flex items-start gap-1.5">
          <Info class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>交叉年份对房价涨幅假设极其敏感——2 个百分点的假设差可能改变结论;本工具只算钱,不算住得舒不舒服、落不落户。</span>
        </p>

        <!-- 免责声明 -->
        <p class="text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border pt-3">
          免责声明:本工具为简化全成本模型:未含户籍学区、居住品质偏好、流动性差异等非财务因素;房价涨幅与理财收益为假设参数,不构成投资建议。
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>租房还是买房计算器是什么?</h2>
        <p class="text-sm text-muted-foreground mb-4 leading-relaxed">
          租房还是买房计算器是一款在线住房财务决策工具。它按「净成本 = 真金白银流出 − 资产价值」口径,把买房侧的首付、交易税费、
          等额本息月供、物业与维修持有成本逐项累计,并计入首付与税费放弃的理财复利(机会成本),同时扣除房产现值与未还贷款本金形成的净权益;
          租房侧则累计逐年上涨的租金与押金占用损失。两条累计成本曲线逐年对比,自动找出买房累计净成本首次低于租房的交叉年份,
          并提供租售比判定(国际参考 1:200~300)、房价涨幅 −2% / 0% / +3% 三档敏感度与每 5 年成本对比表。全部计算在浏览器本地完成,不上传任何数据。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">租房还是买房怎么算?净成本口径讲解</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          买房与租房的公平比法不是「月供 vs 月租」,而是比较同样年限内的累计净成本。买房侧:首付 + 交易税费 + 月供累计 + 物业维修累计是真金白银流出,
          房产现值 − 未还贷款本金是净权益,流出减净权益就是净成本;同时首付与税费按理财收益复利计一次机会成本——这笔钱若不投入买房,本可以利滚利。
          租房侧:租金按年涨幅逐年递增累计,押金(简化按 1 个月租)到期可退、只损失占用期间的理财增值。两条曲线的交点,就是「从第几年起买房更便宜」。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">租售比多少合理?</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          租售比指「多少个月的租金能收回当前房价」,是衡量房价与租金匹配度的国际通行指标,常见参考区间为 1:200 ~ 1:300。
          低于 200 个月,说明房价相对租金便宜、租金回报率高,买房自住的财务属性更强;高于 300 个月,说明房价相对租金偏贵,
          租房并把省下的资金用于理财往往更划算。国内不少城市核心区的租售比明显高于 300 个月,这正是需要用净成本口径认真算一算、
          而不是凭感觉下结论的原因。本工具会按你当前输入自动判定档位。
        </p>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">买房的机会成本有哪些?</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>首付与交易税费:若拿去稳健理财,按复利滚 30 年是一笔不小的数目(本工具按理财年化收益复利计入买房成本)。</li>
          <li>贷款利息:等额本息 30 年、利率 3.6% 时,100 万贷款总利息约 63.7 万——利息是真金白银流出,却不形成任何资产。</li>
          <li>流动性与选择权:房子变现慢、置换摩擦大,被一套房锁定的职业与城市选择难以量化但真实存在。</li>
          <li>反过来看,租金是纯粹的消费、不形成资产,但租房人保住了全部资金的流动性。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">什么情况下租房更划算?</h3>
        <ul class="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li>租售比明显高于 300 个月:房价相对租金太贵,月供中利息与机会成本远超同地段租金。</li>
          <li>预期房价涨幅长期跑不赢「理财收益 + 持有成本」:房子不增值时,你只是在为一笔大额资产付保管费。</li>
          <li>居住年限短于交叉年份:工作流动大、几年内可能换城市,买房的高额一次性税费摊不平。</li>
          <li>贷款利率高、首付占用资金多:利率越高,利息累计越大,交叉年份被推得越远。</li>
        </ul>

        <h3 class="text-lg font-semibold text-foreground mt-6 mb-2">房贷利率对交叉点的影响?</h3>
        <p class="text-sm text-muted-foreground leading-relaxed">
          利率直接决定利息累计,是买房净成本中弹性最大的单项。以 100 万贷款、30 年等额本息为例:利率 3.6% 时月供约 4546 元、总利息约 63.7 万;
          利率升到 4.9%,月供涨到约 5307 元、总利息约 91 万——多出的 27 万多利息会把买房反超租房的交叉年份显著推后,甚至推出比较年限之外。
          存量房贷利率调整、LPR 变动之后,不妨回到本页把利率改成最新值重新对比一次。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4"><span class="text-primary mr-2">#</span>常见问题 (FAQ)</h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">租售比多少算合理?</h3>
            <p class="text-sm text-muted-foreground mt-1">国际参考口径为 1:200~300,即 200~300 个月租金约等于房价。不超过 200 个月为偏低(房价相对租金便宜,买房相对划算),200~300 个月为合理区间,超过 300 个月为偏高(租房相对划算)。本工具按你的输入自动给出三档判定。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">买房一定比租房划算吗?</h3>
            <p class="text-sm text-muted-foreground mt-1">不一定。结论取决于房价涨幅、房贷利率、理财收益与居住年限四个变量的组合。例如 300 万房、月租 6000、房价 0 涨幅的示例参数下,30 年内租房累计净成本始终更低;把涨幅假设改为 +3% 后,交叉年份会出现在 10 年出头。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">为什么交叉年份对假设这么敏感?</h3>
            <p class="text-sm text-muted-foreground mt-1">房价涨幅按复利作用于整个资产端,是公式里金额最大的单项:30 年后 2 个百分点的假设差会让房产现值相差近一倍,足以让交叉年份在「第 10 年」与「永不交叉」之间翻转。工具提供 −2% / 0% / +3% 三档敏感度,建议把结论理解为区间而不是单点。</p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-foreground">计算数据会上传吗?</h3>
            <p class="text-sm text-muted-foreground mt-1">不会。房价、租金等输入只参与浏览器内存中的本地计算,不发送任何网络请求,也不写入 localStorage,刷新页面即恢复示例默认值。</p>
          </div>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'rent-vs-buy-calculator'" :category="'finance'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Building2, Calculator, CheckCircle, TriangleAlert,
  ChevronUp, ChevronDown, Info, RefreshCw, Play, TrendingDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// ---------- SEO ----------
useSeoMeta({
  title: '租房还是买房计算器 - 买房租房净成本对比·租售比在线测算工具',
  description: '免费在线租房还是买房计算器:录入房价、首付、贷款利率与月租金,按净成本口径逐年对比买房与租房累计成本,秒算买房反超租房的交叉年份,提供租售比三档判定(1:200~300 国际参考)与房价涨幅敏感度分析,纯浏览器本地运行不上传',
  keywords: '租房还是买房,租售比,买房计算器,租售比多少合理,买房划算吗',
  author: '有条工具',
  ogTitle: '租房还是买房计算器 - 买房租房净成本对比 | 有条工具',
  ogDescription: '净成本口径逐年对比买房与租房,自动测算交叉年份、租售比档位与涨幅敏感度。',
  ogUrl: 'https://www.util.cn/tools/rent-vs-buy-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据(SoftwareApplication + BreadcrumbList + FAQPage)
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: '租房还是买房计算器',
          url: 'https://www.util.cn/tools/rent-vs-buy-calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['净成本口径逐年累计对比', '买房反超租房交叉年份测算', '租售比计算与三档判定', '房价涨幅 -2%/0%/+3% 敏感度分析', '每 5 年累计成本对比表', '等额本息月供与机会成本计算', '载入示例一键演示', '本地运行不上传']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '金融工具', item: 'https://www.util.cn/finance/' },
            { '@type': 'ListItem', position: 3, name: '租房还是买房计算器', item: 'https://www.util.cn/tools/rent-vs-buy-calculator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '租售比多少算合理?',
              acceptedAnswer: { '@type': 'Answer', text: '国际参考口径为 1:200~300,即 200~300 个月租金约等于房价。不超过 200 个月为偏低(房价相对租金便宜,买房相对划算),200~300 个月为合理区间,超过 300 个月为偏高(租房相对划算)。' }
            },
            {
              '@type': 'Question',
              name: '买房一定比租房划算吗?',
              acceptedAnswer: { '@type': 'Answer', text: '不一定。结论取决于房价涨幅、房贷利率、理财收益与居住年限的组合。例如 300 万房、月租 6000、房价 0 涨幅的示例下,30 年内租房累计净成本始终更低;把涨幅改为 +3% 后交叉年份出现在 10 年出头。' }
            },
            {
              '@type': 'Question',
              name: '为什么交叉年份对假设这么敏感?',
              acceptedAnswer: { '@type': 'Answer', text: '房价涨幅按复利作用于金额最大的资产单项:30 年后 2 个百分点的假设差会让房产现值相差近一倍,足以让交叉年份在「第 10 年」与「永不交叉」之间翻转,建议把结论理解为区间而不是单点。' }
            },
            {
              '@type': 'Question',
              name: '计算数据会上传吗?',
              acceptedAnswer: { '@type': 'Answer', text: '不会。房价、租金等输入只参与浏览器内存中的本地计算,不发送任何网络请求,也不写入 localStorage,刷新页面即恢复示例默认值。' }
            }
          ]
        }
      ]
    })
  }]
})

// ---------- 纯逻辑（可独立单测） ----------

// 输入防护:非法 / 非正数一律按 0 处理(金额类)
function safeNum(v) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : 0
}

// 数值夹紧:非有限数回落到下限,其余夹到 [min, max](百分数口径,如 3.6 表示 3.6%)
function clampNumber(v, min, max) {
  const n = Number(v)
  if (!isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

// 等额本息月供推导:设贷款本金 P、月利率 r = 年利率/12、共 n = 年限×12 期。
// 每期固定还款 A,其中利息 = 期初余额×r、本金 = A − 利息,余额按等比缩减;
// 由「n 期后余额恰好为 0」解得 A = P · r · (1+r)^n / ((1+r)^n − 1);r = 0(免息)时退化为 A = P / n。
function monthlyPaymentOf(principal, annualRate, years) {
  const n = Math.round(Number(years) * 12)
  const p = safeNum(principal)
  if (!isFinite(n) || n <= 0 || p <= 0) return 0
  const r = clampNumber(annualRate, 0, 100) / 100 / 12
  if (r === 0) return p / n
  const pow = Math.pow(1 + r, n)
  return p * r * pow / (pow - 1)
}

// 第 paidMonths 期后的未还贷款本金(标准摊还表):
// 剩余 = P · ((1+r)^n − (1+r)^p) / ((1+r)^n − 1);p ≥ n 时为 0;r = 0 时按期数线性递减。
function remainingPrincipalOf(principal, annualRate, years, paidMonths) {
  const n = Math.round(Number(years) * 12)
  const p = safeNum(principal)
  if (!isFinite(n) || n <= 0 || p <= 0) return 0
  const paid = Math.min(Math.max(0, Math.round(Number(paidMonths) || 0)), n)
  if (paid >= n) return 0
  const r = clampNumber(annualRate, 0, 100) / 100 / 12
  if (r === 0) return p * (1 - paid / n)
  const powN = Math.pow(1 + r, n)
  const powP = Math.pow(1 + r, paid)
  return p * (powN - powP) / (powN - 1)
}

// 第 year 年末「买房累计净成本」(净成本口径 = 真金白银流出 − 资产价值,注释如下):
//   已付月供累计(名义累计,贷款还清后封顶)
// + (首付 + 交易税费)按理财收益复利到年末的终值 —— 机会成本:这笔钱若不投入买房本可利滚利(终值口径,与房产价值对冲)
// + 物业维修累计(年持有成本 = 月物业费×12 + 初始房价×维修比例,随通胀逐年上涨;维修基数按初始房价简化)
// − 房产现值(按房价涨幅复利)
// + 未还贷款本金(资产按「房产现值 − 未还本金」的净权益计,减现值后需加回未还本金)
// 等价理解:净成本 = 利息累计 + 物业维修累计 + (首付+税费)理财终值 − 房产净权益。
// 自洽校准:0 房贷利率、0 涨幅、无税费与维修、理财收益为 0 时,任意年份净成本 ≡ 0(资金占用恰好对冲);
// year = 0 时净成本 = 交易税费(签约即蒸发)。
// 简化:月供按名义累计、不逐期复利(会略微低估买房侧机会成本)。
// 参数约定:inputs 单位为元 / 百分数;inflation、investRate 为百分数数值(2.5 表示 2.5%)。
function buyCumulativeOf(inputs, year, inflation, investRate) {
  const y = Math.max(0, Math.floor(Number(year) || 0))
  const src = inputs || {}
  const price = safeNum(src.priceYuan)
  const downPct = clampNumber(src.downPct, 0, 100)
  const loanRate = clampNumber(src.loanRate, 0, 100)
  const loanYears = Math.max(1, Math.round(clampNumber(src.loanYears, 1, 100)))
  const feeYuan = safeNum(src.propertyFeeYuan)
  const repairPct = clampNumber(src.repairPct, 0, 100)
  const dealPct = clampNumber(src.dealCostPct, 0, 100)
  const growthPct = clampNumber(src.priceGrowth, -100, 100)
  const inflationDec = clampNumber(inflation, -50, 200) / 100
  const investDec = clampNumber(investRate, -50, 200) / 100

  const downPayment = price * downPct / 100
  const dealCost = price * dealPct / 100
  const principal = Math.max(0, price - downPayment)
  const monthlyPay = monthlyPaymentOf(principal, loanRate, loanYears)
  const paidMonths = Math.min(y, loanYears) * 12
  const paidTotal = monthlyPay * paidMonths

  // 机会成本(终值口径):首付 + 税费若按理财收益率复利到第 y 年末的终值
  const opportunityCost = (downPayment + dealCost) * Math.pow(1 + investDec, y)

  // 物业 + 维修累计:年持有成本随通胀逐年上涨(第 t 年 = 基数 × (1+通胀)^(t−1))
  const baseHolding = feeYuan * 12 + price * repairPct / 100
  let holdingTotal = 0
  for (let t = 1; t <= y; t++) holdingTotal += baseHolding * Math.pow(1 + inflationDec, t - 1)

  // 房产现值:按涨幅复利(涨幅可为负)
  const currentValue = price * Math.pow(1 + growthPct / 100, y)

  // 未还贷款本金(净权益 = 现值 − 未还本金)
  const remaining = remainingPrincipalOf(principal, loanRate, loanYears, paidMonths)

  return paidTotal + opportunityCost + holdingTotal - currentValue + remaining
}

// 第 year 年末租房累计净成本 = 租金累计 + 押金占用机会成本:
// - 租金:第 t 年年租金 = 月租×12×(1+涨幅)^(t−1),逐年递增累计;
// - 押金 = depositMonths 个月租(按初始月租简化,不计随涨补差),到期可返还,
//   损失的是占用期间的理财增值 → 按增值口径 押金×((1+理财)^year − 1);
//   与买房侧「终值口径」的区别:首付投入后不可返还(与房产价值对冲),押金到期返还(只损失增值)。
function rentCumulativeOf(rent, rentGrowth, depositMonths, investRate, year) {
  const monthlyRent = safeNum(rent)
  const growthDec = clampNumber(rentGrowth, -100, 100) / 100
  const deposit = monthlyRent * Math.max(0, Number(depositMonths) || 0)
  const investDec = clampNumber(investRate, -50, 200) / 100
  const y = Math.max(0, Math.floor(Number(year) || 0))
  let rentTotal = 0
  for (let t = 1; t <= y; t++) rentTotal += monthlyRent * 12 * Math.pow(1 + growthDec, t - 1)
  const depositCost = deposit * (Math.pow(1 + investDec, y) - 1)
  return rentTotal + depositCost
}

// 交叉年份:买房累计净成本首次低于租房的年份(1-based);序列内无交叉返回 null
function crossoverYearOf(buySeries, rentSeries) {
  if (!Array.isArray(buySeries) || !Array.isArray(rentSeries)) return null
  const n = Math.min(buySeries.length, rentSeries.length)
  for (let i = 0; i < n; i++) {
    if (buySeries[i] < rentSeries[i]) return i + 1
  }
  return null
}

// 租售比:多少个月租金收回房价(房价元 ÷ 月租元);房价或月租非正时无法计算,返回 null
function rentSaleRatioOf(price, monthlyRent) {
  const p = safeNum(price)
  const r = safeNum(monthlyRent)
  if (p <= 0 || r <= 0) return null
  return p / r
}

// 租售比判定:≤200 个月偏低 / 200~300 合理 / >300 偏高(边界:200 归偏低、300 归合理)。
// 国际参考口径:租售比 1:200~300(200~300 个月租金 ≈ 房价)常被视为房价与租金匹配度的经验区间。
function judgeRentSaleRatio(months) {
  if (months === null || months === undefined || !isFinite(months)) return 'unknown'
  if (months <= 200) return 'low'
  if (months <= 300) return 'fair'
  return 'high'
}

// 元 → 万元字符串(1 位小数千分位),负数保留负号
function formatWan(yuan) {
  const n = Number(yuan)
  if (!isFinite(n)) return '—'
  return (n / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' 万'
}

// 差额(买房 − 租房)文案:负值 = 买房累计更低
function diffTextOf(diff) {
  const n = Number(diff)
  if (!isFinite(n)) return '—'
  return n <= 0 ? '买房省 ' + formatWan(-n) : '买房多花 ' + formatWan(n)
}

// ---------- 输入状态 ----------
// 隐私说明:房价、租金属于敏感财务信息,本工具不写入 localStorage、不做任何持久化;
// 全部计算为纯函数、无浏览器 API 依赖,SSR 与客户端结果一致,仅在 onMounted 记录最近使用。
const EXAMPLE = {
  compareYears: 30, inflation: 2, invest: 2.5,
  priceWan: 300, downPct: 30, loanRate: 3.6, loanYears: 30,
  propertyFee: 800, repairPct: 0.5, dealCostPct: 2, priceGrowth: 0,
  monthlyRent: 6000, rentGrowth: 2
}

const compareYears = ref(EXAMPLE.compareYears)   // 比较年限(5-50)
const inflationRate = ref(EXAMPLE.inflation)     // 预期通胀率 %(持有成本随之上涨)
const investRate = ref(EXAMPLE.invest)           // 理财年化收益 %(保守口径,用于机会成本)
const priceWan = ref(EXAMPLE.priceWan)           // 房价(万元)
const downPct = ref(EXAMPLE.downPct)             // 首付比例 %
const loanRatePct = ref(EXAMPLE.loanRate)        // 贷款年利率 %
const loanYears = ref(EXAMPLE.loanYears)         // 贷款年限(年)
const propertyFee = ref(EXAMPLE.propertyFee)     // 月物业费(元)
const repairPct = ref(EXAMPLE.repairPct)         // 年维修预留(初始房价 %)
const dealCostPct = ref(EXAMPLE.dealCostPct)     // 一次性交易税费(房价 %)
const priceGrowth = ref(EXAMPLE.priceGrowth)     // 预期房价年涨幅 %(-5~10)
const monthlyRent = ref(EXAMPLE.monthlyRent)     // 月租金(元)
const rentGrowth = ref(EXAMPLE.rentGrowth)       // 年租金涨幅 %
const seoContentVisible = ref(true)

// ---------- 归一化与核心计算 ----------
const compareYearsNum = computed(() => Math.round(clampNumber(compareYears.value, 5, 50)))
const inflationNum = computed(() => clampNumber(inflationRate.value, -2, 15))
const investNum = computed(() => clampNumber(investRate.value, 0, 15))
const priceYuan = computed(() => safeNum(priceWan.value) * 10000)
const downPctNum = computed(() => clampNumber(downPct.value, 0, 100))
const loanRateNum = computed(() => clampNumber(loanRatePct.value, 0, 15))
const loanYearsNum = computed(() => Math.round(clampNumber(loanYears.value, 1, 50)))
const propertyFeeNum = computed(() => safeNum(propertyFee.value))
const repairNum = computed(() => clampNumber(repairPct.value, 0, 5))
const dealCostNum = computed(() => clampNumber(dealCostPct.value, 0, 20))
const growthNum = computed(() => clampNumber(priceGrowth.value, -5, 10))
const monthlyRentNum = computed(() => safeNum(monthlyRent.value))
const rentGrowthNum = computed(() => clampNumber(rentGrowth.value, -10, 30))

const downPaymentYuan = computed(() => priceYuan.value * downPctNum.value / 100)
const dealCostYuan = computed(() => priceYuan.value * dealCostNum.value / 100)
const loanPrincipalYuan = computed(() => Math.max(0, priceYuan.value - downPaymentYuan.value))
const monthlyPayYuan = computed(() => monthlyPaymentOf(loanPrincipalYuan.value, loanRateNum.value, loanYearsNum.value))

const buyInputs = computed(() => ({
  priceYuan: priceYuan.value,
  downPct: downPctNum.value,
  loanRate: loanRateNum.value,
  loanYears: loanYearsNum.value,
  propertyFeeYuan: propertyFeeNum.value,
  repairPct: repairNum.value,
  dealCostPct: dealCostNum.value,
  priceGrowth: growthNum.value
}))

// 每年年末的累计净成本序列(下标 0 = 第 1 年)
const buySeries = computed(() => {
  const list = []
  for (let y = 1; y <= compareYearsNum.value; y++) {
    list.push(buyCumulativeOf(buyInputs.value, y, inflationNum.value, investNum.value))
  }
  return list
})
const rentSeries = computed(() => {
  const list = []
  for (let y = 1; y <= compareYearsNum.value; y++) {
    list.push(rentCumulativeOf(monthlyRentNum.value, rentGrowthNum.value, 1, investNum.value, y))
  }
  return list
})

const crossover = computed(() => crossoverYearOf(buySeries.value, rentSeries.value))
const hasCrossover = computed(() => crossover.value !== null)
const finalBuyCost = computed(() => buySeries.value[buySeries.value.length - 1] || 0)
const finalRentCost = computed(() => rentSeries.value[rentSeries.value.length - 1] || 0)
const finalDiff = computed(() => finalBuyCost.value - finalRentCost.value)

const hasFullInput = computed(() => priceYuan.value > 0 && monthlyRentNum.value > 0)

const rentSaleRatio = computed(() => rentSaleRatioOf(priceYuan.value, monthlyRentNum.value))
const ratioLevel = computed(() => judgeRentSaleRatio(rentSaleRatio.value))

// 敏感度:固定其他输入,房价年涨幅分别取 −2% / 0% / +3% 时的交叉年份
const sensitivityRows = computed(() => [-2, 0, 3].map((g) => {
  const list = []
  for (let y = 1; y <= compareYearsNum.value; y++) {
    list.push(buyCumulativeOf({ ...buyInputs.value, priceGrowth: g }, y, inflationNum.value, investNum.value))
  }
  return { growth: g, crossover: crossoverYearOf(list, rentSeries.value) }
}))

// 对比表:每 5 年一行,末尾补比较年限年末
const tableRows = computed(() => {
  const total = compareYearsNum.value
  const years = []
  for (let y = 5; y <= total; y += 5) years.push(y)
  if (years[years.length - 1] !== total) years.push(total)
  return years.map((y) => {
    const buy = buySeries.value[y - 1]
    const rent = rentSeries.value[y - 1]
    return { year: y, buy, rent, diff: buy - rent, buyBetter: buy < rent }
  })
})

const amountWarning = computed(() => {
  const raws = [priceWan.value, propertyFee.value, monthlyRent.value]
  const bad = raws.some((v) => {
    if (v === '' || v === null || v === undefined) return false
    const n = Number(v)
    return !isFinite(n) || n < 0
  })
  return bad ? '金额需为不小于 0 的数字,异常输入已按 0 处理。' : ''
})

// ---------- 展示视图 ----------
const crossoverText = computed(() =>
  hasCrossover.value ? '第 ' + crossover.value + ' 年' : '无交叉'
)
const crossoverDesc = computed(() => {
  const n = compareYearsNum.value
  if (hasCrossover.value) {
    return '从第 ' + crossover.value + ' 年起,买房累计净成本开始低于租房——按当前假设,住到 ' + n + ' 年买房整体更划算。'
  }
  return '比较 ' + n + ' 年内,买房累计净成本始终不低于租房,租房更划算;可试着调高房价涨幅假设再看。'
})

const loanWanText = computed(() => {
  if (loanPrincipalYuan.value <= 0) return '未产生贷款'
  return (loanPrincipalYuan.value / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + ' 万'
})
const monthlyPayText = computed(() =>
  monthlyPayYuan.value > 0 ? Math.round(monthlyPayYuan.value).toLocaleString('zh-CN') : '—'
)

const ratioText = computed(() => {
  if (rentSaleRatio.value === null) return '—'
  return Math.round(rentSaleRatio.value).toLocaleString('zh-CN')
})
const ratioYearsText = computed(() => {
  if (rentSaleRatio.value === null) return '—'
  return (rentSaleRatio.value / 12).toLocaleString('zh-CN', { maximumFractionDigits: 1 })
})

const ratioMeta = {
  low: {
    label: '偏低 · 买房相对划算',
    icon: CheckCircle,
    cls: 'bg-green-500/10 border-green-500/20 text-green-600',
    text: '不超过 200 个月:房价相对租金便宜,租金回报视角下买房的财务属性更强。'
  },
  fair: {
    label: '合理区间',
    icon: Info,
    cls: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
    text: '处于国际参考 1:200~300 区间内,房价与租金大体匹配,买房还是租房更多取决于居住年限与涨幅预期。'
  },
  high: {
    label: '偏高 · 租房相对划算',
    icon: TriangleAlert,
    cls: 'bg-red-500/10 border-red-500/20 text-red-600',
    text: '超过 300 个月:房价相对租金偏贵,租房并把省下的首付拿去理财,累计净成本往往更低。'
  },
  unknown: {
    label: '待计算',
    icon: Info,
    cls: 'bg-muted text-muted-foreground border-border',
    text: '填入房价与月租金后,自动按国际参考口径判定档位。'
  }
}

// ---------- 操作 ----------
function loadExample() {
  compareYears.value = EXAMPLE.compareYears
  inflationRate.value = EXAMPLE.inflation
  investRate.value = EXAMPLE.invest
  priceWan.value = EXAMPLE.priceWan
  downPct.value = EXAMPLE.downPct
  loanRatePct.value = EXAMPLE.loanRate
  loanYears.value = EXAMPLE.loanYears
  propertyFee.value = EXAMPLE.propertyFee
  repairPct.value = EXAMPLE.repairPct
  dealCostPct.value = EXAMPLE.dealCostPct
  priceGrowth.value = EXAMPLE.priceGrowth
  monthlyRent.value = EXAMPLE.monthlyRent
  rentGrowth.value = EXAMPLE.rentGrowth
}

function resetAll() {
  compareYears.value = EXAMPLE.compareYears
  inflationRate.value = EXAMPLE.inflation
  investRate.value = EXAMPLE.invest
  priceWan.value = 0
  downPct.value = EXAMPLE.downPct
  loanRatePct.value = EXAMPLE.loanRate
  loanYears.value = EXAMPLE.loanYears
  propertyFee.value = EXAMPLE.propertyFee
  repairPct.value = EXAMPLE.repairPct
  dealCostPct.value = EXAMPLE.dealCostPct
  priceGrowth.value = EXAMPLE.priceGrowth
  monthlyRent.value = 0
  rentGrowth.value = EXAMPLE.rentGrowth
}

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

onMounted(() => {
  addRecentTool('rent-vs-buy-calculator')
})
</script>
